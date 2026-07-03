#!/usr/bin/env node
/**
 * 로컬 백엔드 채팅 REST + STOMP 통합 테스트.
 * 사용: node scripts/test-zone-chat.cjs
 */
const crypto = require('crypto');

const BASE_URL = process.env.API_BASE_URL || 'http://192.168.183.5:8080';
const WS_URL = BASE_URL.replace(/^http/i, 'ws') + '/ws-stomp';
const ZONE = 'SUYEONG_NAMGU';
const TEST_TOKEN = process.env.CHAT_TEST_TOKEN || 'local-chat-test-token-001';
const TEST_USER_ID = '11111111-1111-1111-1111-111111111111';

const STOMP_NULL = '\u0000';

function sha256Hex(value) {
  return crypto.createHash('sha256').update(value, 'utf8').digest('hex');
}

function encodeStompFrame(command, headers = {}, body = '') {
  const lines = [command];
  for (const [key, value] of Object.entries(headers)) {
    lines.push(`${key}:${value}`);
  }
  lines.push('');
  lines.push(body);
  return lines.join('\n') + STOMP_NULL;
}

function decodeStompFrames(raw) {
  return raw
    .split(STOMP_NULL)
    .map(chunk => chunk.replace(/^\n+/, ''))
    .filter(Boolean)
    .map(chunk => {
      const idx = chunk.indexOf('\n\n');
      if (idx === -1) {
        return { command: chunk.trim(), headers: {}, body: '' };
      }
      const head = chunk.slice(0, idx);
      const body = chunk.slice(idx + 2);
      const lines = head.split('\n');
      const command = lines.shift();
      const headers = {};
      for (const line of lines) {
        const colon = line.indexOf(':');
        if (colon === -1) continue;
        headers[line.slice(0, colon)] = line.slice(colon + 1);
      }
      return { command, headers, body };
    });
}

async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, options);
  const text = await res.text();
  let body = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }
  return { res, body };
}

function assertOk(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function seedTestUser() {
  const tokenHash = sha256Hex(TEST_TOKEN);
  const sql = `
INSERT INTO users (id, email, provider, provider_id, last_name, first_name, nickname, role, created_at, updated_at)
VALUES ('${TEST_USER_ID}', 'chat-test@local.dev', 'development', 'chat-test', '테스트', '채팅', '채팅테스터', 'USER', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

DELETE FROM opaque_tokens WHERE user_id = '${TEST_USER_ID}';

INSERT INTO opaque_tokens (id, token_hash, user_id, expires_at, created_at, updated_at)
VALUES ('22222222-2222-2222-2222-222222222222', '${tokenHash}', '${TEST_USER_ID}', NOW() + INTERVAL '1 hour', NOW(), NOW());
`;

  const { execSync } = require('child_process');
  execSync(
    `docker exec -i postgres_local_container psql -U myuser -d mydb -v ON_ERROR_STOP=1`,
    { input: sql, stdio: ['pipe', 'pipe', 'pipe'] },
  );
  console.log('✓ 테스트 유저·토큰 시드 완료');
}

async function testRoomsByZone() {
  const { res, body } = await request(`/api/v1/chat/rooms/zone?zone=${ZONE}`);
  assertOk(res.ok, `rooms/zone failed: ${res.status} ${JSON.stringify(body)}`);
  const rooms = body.data ?? body;
  assertOk(Array.isArray(rooms) && rooms.length > 0, 'rooms/zone returned empty');
  console.log('✓ rooms/zone', rooms[0].roomId, rooms[0].title ?? rooms[0].name);
  return rooms[0].roomId;
}

async function testMessages(roomId, lastMessageId) {
  const query = lastMessageId ? `?lastMessageId=${encodeURIComponent(lastMessageId)}` : '';
  const { res, body } = await request(`/api/v1/chat/rooms/${roomId}/messages${query}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${TEST_TOKEN}`,
    },
  });
  assertOk(res.ok, `messages failed: ${res.status} ${JSON.stringify(body)}`);
  const history = Array.isArray(body) ? body : body.data;
  console.log(`✓ messages — history ${history?.length ?? 0} messages`);
  return history ?? [];
}

function testStomp(roomId) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(WS_URL);
    let connected = false;
    let received = null;
    const timeout = setTimeout(() => {
      ws.close();
      reject(new Error('STOMP test timeout'));
    }, 15000);

    const testMessage = `테스트 메시지 ${Date.now()}`;

    ws.addEventListener('open', () => {
      ws.send(
        encodeStompFrame('CONNECT', {
          'accept-version': '1.2',
          Authorization: `Bearer ${TEST_TOKEN}`,
        }),
      );
    });

    ws.addEventListener('message', event => {
      const frames = decodeStompFrames(String(event.data));
      for (const frame of frames) {
        if (frame.command === 'CONNECTED') {
          connected = true;
          ws.send(
            encodeStompFrame('SUBSCRIBE', {
              id: 'sub-test',
              destination: `/sub/chat/room/${roomId}`,
            }),
          );
          ws.send(
            encodeStompFrame(
              'SEND',
              {
                destination: '/pub/chat/message',
                'content-type': 'application/json',
              },
              JSON.stringify({ roomId, content: testMessage }),
            ),
          );
          continue;
        }

        if (frame.command === 'MESSAGE' && frame.body) {
          try {
            const payload = JSON.parse(frame.body);
            if (payload.content === testMessage) {
              received = payload;
              clearTimeout(timeout);
              ws.send(encodeStompFrame('DISCONNECT', {}));
              ws.close();
              console.log('✓ STOMP send/receive', payload.messageId ?? payload.id);
              resolve(received);
            }
          } catch {
            /* ignore */
          }
        }

        if (frame.command === 'ERROR') {
          clearTimeout(timeout);
          ws.close();
          reject(new Error(frame.headers.message || frame.body || 'STOMP ERROR'));
        }
      }
    });

    ws.addEventListener('error', () => {
      clearTimeout(timeout);
      reject(new Error('WebSocket error'));
    });

    ws.addEventListener('close', () => {
      if (!connected) {
        clearTimeout(timeout);
        reject(new Error('WebSocket closed before STOMP CONNECTED'));
      } else if (!received) {
        clearTimeout(timeout);
        reject(new Error('WebSocket closed before receiving message'));
      }
    });
  });
}

async function main() {
  console.log(`\n[Bu-Ting] Chat integration test → ${BASE_URL}\n`);
  await seedTestUser();
  const roomId = await testRoomsByZone();
  await testMessages(roomId);
  await testStomp(roomId);
  console.log('\n모든 채팅 연동 테스트 통과 ✓\n');
}

main().catch(error => {
  console.error('\n채팅 테스트 실패 ✗');
  console.error(error.message || error);
  process.exit(1);
});
