/**
 * 구역 채팅 STOMP용 WebSocket.
 * 핸드셰이크·STOMP CONNECT 모두 Authorization: Bearer 로 인증합니다.
 * Origin은 RN 기본값(API 호스트)을 사용합니다 — SecurityConfig CORS에 API 호스트가 등록되어 있어야 합니다.
 */
export function openZoneChatWebSocket(
  url: string,
  accessToken?: string | null,
): WebSocket {
  const headers: Record<string, string> = {};
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
