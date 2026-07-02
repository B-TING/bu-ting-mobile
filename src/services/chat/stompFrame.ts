/**
 * 최소 STOMP 1.2 프레임 인코더/디코더.
 * @stomp/stompjs 의존성 없이 raw WebSocket 위에서 채팅 테스트용으로 사용.
 */

export const STOMP_NULL = '\u0000';
const LF = '\n';

export type StompFrame = {
  command: string;
  headers: Record<string, string>;
  body: string;
};

const ESCAPE_MAP: Record<string, string> = {
  '\\': '\\\\',
  ':': '\\c',
  '\n': '\\n',
  '\r': '\\r',
};

const UNESCAPE_MAP: Record<string, string> = {
  '\\\\': '\\',
  '\\c': ':',
  '\\n': '\n',
  '\\r': '\r',
};

function escapeHeaderValue(value: string): string {
  return value.replace(/[\\:\n\r]/g, match => ESCAPE_MAP[match] ?? match);
}

function unescapeHeaderValue(value: string): string {
  return value.replace(/\\\\|\\c|\\n|\\r/g, match => UNESCAPE_MAP[match] ?? match);
}

export function encodeStompFrame(frame: StompFrame): string {
  const lines = [frame.command];
  for (const [key, value] of Object.entries(frame.headers)) {
    lines.push(`${escapeHeaderValue(key)}:${escapeHeaderValue(value)}`);
  }
  lines.push('');
  lines.push(frame.body ?? '');
  return lines.join(LF) + STOMP_NULL;
}

/**
 * React Native WebSocket 은 문자열 send 시 STOMP 종료 바이트(\0)를 잘라낼 수 있어
 * 바이너리로 보내야 서버가 CONNECTED 를 반환합니다.
 */
export function encodeStompFrameBytes(frame: StompFrame): Uint8Array {
  const encoded = encodeStompFrame(frame);
  const bytes = new Uint8Array(encoded.length);
  for (let i = 0; i < encoded.length; i += 1) {
    bytes[i] = encoded.charCodeAt(i);
  }
  return bytes;
}

/** STOMP 서버는 여러 프레임을 한 메시지로 보낼 수 있으므로 배열 반환 */
export function decodeStompFrames(raw: string): StompFrame[] {
  const frames: StompFrame[] = [];
  const chunks = raw.split(STOMP_NULL);

  for (const chunk of chunks) {
    const trimmed = chunk.replace(/^\n+/, '');
    if (!trimmed) {
      continue;
    }
    const frame = parseSingleFrame(trimmed);
    if (frame) {
      frames.push(frame);
    }
  }

  return frames;
}

/** React Native WebSocket 은 ArrayBuffer 로 프레임을 줄 수 있음 */
export function decodeWebSocketPayload(data: unknown): string {
  if (typeof data === 'string') {
    return data;
  }
  if (data instanceof ArrayBuffer || ArrayBuffer.isView(data)) {
    const bytes =
      data instanceof ArrayBuffer
        ? new Uint8Array(data)
        : new Uint8Array(data.buffer, data.byteOffset, data.byteLength);

    const TextDecoderCtor = (
      globalThis as typeof globalThis & {
        TextDecoder?: new (label?: string) => { decode(input: Uint8Array): string };
      }
    ).TextDecoder;

    if (TextDecoderCtor) {
      return new TextDecoderCtor('utf-8').decode(bytes);
    }

    let result = '';
    for (let i = 0; i < bytes.length; i += 1) {
      result += String.fromCharCode(bytes[i]!);
    }
    return result;
  }
  return String(data);
}

export function isStompHeartbeat(raw: string): boolean {
  return raw === '\n' || raw === '\r\n';
}

function parseSingleFrame(raw: string): StompFrame | null {
  const separatorIndex = raw.indexOf(LF + LF);
  if (separatorIndex === -1) {
    const commandOnly = raw.trim();
    if (!commandOnly) {
      return null;
    }
    return { command: commandOnly, headers: {}, body: '' };
  }

  const head = raw.slice(0, separatorIndex);
  const body = raw.slice(separatorIndex + 2);
  const headLines = head.split(LF);
  const command = headLines.shift()?.trim() ?? '';

  const headers: Record<string, string> = {};
  for (const line of headLines) {
    const idx = line.indexOf(':');
    if (idx === -1) {
      continue;
    }
    const key = unescapeHeaderValue(line.slice(0, idx));
    const value = unescapeHeaderValue(line.slice(idx + 1));
    if (!(key in headers)) {
      headers[key] = value;
    }
  }

  return { command, headers, body };
}
