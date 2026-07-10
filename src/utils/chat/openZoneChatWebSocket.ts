import { getZoneChatWsHandshakeOrigin } from '../../constants/chat/zoneChatConfig';

/**
 * 구역 채팅 STOMP용 WebSocket.
 * 핸드셰이크·STOMP CONNECT 모두 Authorization: Bearer 로 인증합니다.
 *
 * 핸드셰이크 Origin 은 .env ZONE_CHAT_WS_HANDSHAKE_ORIGIN (npm run api:sync).
 */
export function openZoneChatWebSocket(
  url: string,
  accessToken?: string | null,
): WebSocket {
  const headers: Record<string, string> = {};
  const handshakeOrigin = getZoneChatWsHandshakeOrigin();
  if (handshakeOrigin) {
    headers.origin = handshakeOrigin;
  }
  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  const socket = new WebSocket(
    url,
    undefined,
    Object.keys(headers).length > 0 ? { headers } : undefined,
  ) as WebSocket & { binaryType?: string };
  socket.binaryType = 'arraybuffer';
  return socket;
}
