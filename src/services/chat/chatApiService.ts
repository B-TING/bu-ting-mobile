import { API_BASE_URL, CHAT_ENDPOINTS } from '../../constants/api/apiConfig';
import type { ApiEnvelope, ApiErrorResponse } from '../../types/auth';
import type { ChatMessage, ChatMessageRaw, ChatRoomSummary } from '../../types/chatApi';
import { normalizeChatMessage, readChatRoomMemberCount } from '../../types/chatApi';
import type { ChatZone } from '../../types/eventZone';
import { logZoneChat } from '../../utils/chat/zoneChatLogger';

export class ChatApiError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = 'ChatApiError';
    this.status = status;
  }
}

function authHeaders(accessToken: string): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${accessToken}`,
  };
}

async function parseErrorMessage(res: Response, body: unknown): Promise<string> {
  if (
    body &&
    typeof body === 'object' &&
    'message' in body &&
    typeof (body as { message: unknown }).message === 'string'
  ) {
    return (body as { message: string }).message;
  }
  return `Chat request failed (${res.status})`;
}

/** ApiResponse 래퍼가 있으면 data를, 없으면 body를 그대로 반환 */
function unwrap<T>(body: ApiEnvelope<T> | ApiErrorResponse | T | null): T {
  if (body && typeof body === 'object' && 'data' in body && (body as ApiEnvelope<T>).data != null) {
    return (body as ApiEnvelope<T>).data;
  }
  return body as T;
}

/** GET /api/v1/chat/rooms/zone?zone={zone} — 인증 불필요 */
export async function fetchChatRoomsByZone(zone: ChatZone): Promise<ChatRoomSummary[]> {
  const url = `${API_BASE_URL}${CHAT_ENDPOINTS.roomsByZone}?zone=${encodeURIComponent(zone)}`;

  logZoneChat('rest.rooms', 'Fetch chat rooms by zone', { detail: { zone, url } });

  const res = await fetch(url, { method: 'GET' });
  const body = (await res.json().catch(() => null)) as
    | ApiEnvelope<ChatRoomSummary[]>
    | ApiErrorResponse
    | ChatRoomSummary[]
    | null;

  if (!res.ok) {
    throw new ChatApiError(await parseErrorMessage(res, body), res.status);
  }

  const rooms = unwrap<ChatRoomSummary[]>(body);
  return Array.isArray(rooms) ? rooms : [];
}

/** 권역당 대표 채팅방 1개 (백엔드 더미 기준) */
export async function fetchChatRoomByZone(zone: ChatZone): Promise<ChatRoomSummary | null> {
  const rooms = await fetchChatRoomsByZone(zone);
  return rooms.find(room => room.roomId) ?? null;
}

export { readChatRoomMemberCount };

/**
 * POST /api/v1/chat/rooms/{roomId}/enter — Bearer 필수.
 * 응답은 ApiResponse 래퍼 없이 메시지 배열을 직접 반환합니다.
 */
export async function enterChatRoom(
  roomId: string,
  accessToken: string,
): Promise<ChatMessage[]> {
  const url = `${API_BASE_URL}${CHAT_ENDPOINTS.enter(roomId)}`;

  logZoneChat('rest.enter', 'Enter chat room', { detail: { roomId, url } });

  const res = await fetch(url, {
    method: 'POST',
    headers: authHeaders(accessToken),
  });

  const body = (await res.json().catch(() => null)) as
    | ChatMessageRaw[]
    | ApiEnvelope<ChatMessageRaw[]>
    | ApiErrorResponse
    | null;

  if (!res.ok) {
    throw new ChatApiError(await parseErrorMessage(res, body), res.status);
  }

  const history = unwrap<ChatMessageRaw[]>(body);
  const normalized = Array.isArray(history) ? history.map(normalizeChatMessage) : [];
  logZoneChat('rest.enter.success', 'Chat room entered', {
    detail: { roomId, historyCount: normalized.length },
  });
  return normalized;
}

/** DELETE /api/v1/chat/rooms/{roomId}/exit — Bearer 필수 */
export async function exitChatRoom(roomId: string, accessToken: string): Promise<void> {
  const url = `${API_BASE_URL}${CHAT_ENDPOINTS.exit(roomId)}`;

  logZoneChat('rest.exit', 'Exit chat room', { detail: { roomId, url } });

  const res = await fetch(url, {
    method: 'DELETE',
    headers: authHeaders(accessToken),
  });

  if (res.ok || res.status === 204) {
    return;
  }

  const body = (await res.json().catch(() => null)) as ApiErrorResponse | null;
  throw new ChatApiError(await parseErrorMessage(res, body), res.status);
}
