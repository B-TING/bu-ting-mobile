import { API_BASE_URL, CHAT_ENDPOINTS } from '../../constants/api/apiConfig';
import { ZONE_CHAT_WS_CONFIG } from '../../constants/chat/zoneChatConfig';
import type { ChatMessage, ChatMessageRaw, ChatRoomSummary, FetchChatRoomMessagesOptions } from '../../types/chatApi';
import { normalizeChatMessage, readChatRoomMemberCount } from '../../types/chatApi';
import type { ChatZone } from '../../types/eventZone';
import { logZoneChat } from '../../utils/chat/zoneChatLogger';
import { chatApiGet, chatApiRequest } from './chatApiClient';

export { ChatApiError } from './chatApiClient';
export { readChatRoomMemberCount };

/** GET /api/v1/chat/rooms/zone?zone={zone} — 인증 불필요 */
export async function fetchChatRoomsByZone(zone: ChatZone): Promise<ChatRoomSummary[]> {
  const url = `${API_BASE_URL}${CHAT_ENDPOINTS.roomsByZone}?zone=${encodeURIComponent(zone)}`;
  const rooms = await chatApiGet<ChatRoomSummary[]>(url, {
    logStep: 'rest.rooms',
    logMessage: 'Fetch chat rooms by zone',
    logDetail: { zone },
  });
  return Array.isArray(rooms) ? rooms : [];
}

/** 권역당 대표 채팅방 1개 */
export async function fetchChatRoomByZone(zone: ChatZone): Promise<ChatRoomSummary | null> {
  const rooms = await fetchChatRoomsByZone(zone);
  return rooms.find(room => room.roomId) ?? null;
}

/** GET /api/v1/chat/rooms/{roomId}/messages — Bearer 필수, lastMessageId 로 이전 내역 페이징 */
export async function fetchChatRoomMessages(
  roomId: string,
  accessToken: string,
  options?: FetchChatRoomMessagesOptions,
): Promise<ChatMessage[]> {
  const query = new URLSearchParams();
  if (options?.lastMessageId) {
    query.set('lastMessageId', options.lastMessageId);
  }
  const queryString = query.toString();
  const url = `${API_BASE_URL}${CHAT_ENDPOINTS.messages(roomId)}${queryString ? `?${queryString}` : ''}`;
  const history = await chatApiRequest<ChatMessageRaw[]>(url, {
    method: 'GET',
    accessToken,
    logStep: 'rest.messages',
    logMessage: options?.lastMessageId ? 'Fetch older chat messages' : 'Fetch chat room messages',
    logDetail: { roomId, lastMessageId: options?.lastMessageId ?? null },
  });

  const normalized = Array.isArray(history) ? history.map(normalizeChatMessage) : [];
  logZoneChat('rest.messages.success', 'Chat messages loaded', {
    detail: {
      roomId,
      lastMessageId: options?.lastMessageId ?? null,
      historyCount: normalized.length,
    },
  });
  return normalized;
}

export function hasMoreChatHistory(batchSize: number): boolean {
  return batchSize >= ZONE_CHAT_WS_CONFIG.messagePageSize;
}
