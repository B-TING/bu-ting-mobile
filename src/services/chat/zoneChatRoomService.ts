import {
  fetchChatRoomMessages,
  hasMoreChatHistory,
} from './chatApiService';
import {
  mapServerMessagesToEventZoneChat,
  sortEventZoneChatMessages,
} from './zoneChatMessageMapper';
import type { EventZoneChatMessage } from '../../types/eventZone';
import type { ZoneChatParticipant } from '../../types/zoneChatWebSocket';

/** 첫 진입 — GET messages(최신 페이지)만 조회. 입장·퇴장은 STOMP 구독/연결 해제로 처리 */
export async function loadInitialZoneChatHistory(
  roomId: string,
  accessToken: string,
  participant: ZoneChatParticipant,
): Promise<EventZoneChatMessage[]> {
  const history = await fetchChatRoomMessages(roomId, accessToken);
  return sortEventZoneChatMessages(mapServerMessagesToEventZoneChat(history, participant));
}

/** 더보기 — 화면 상단(가장 오래된) 메시지 ID 기준 이전 페이지 로드 */
export async function loadOlderZoneChatHistory(
  roomId: string,
  accessToken: string,
  lastMessageId: string,
  participant: ZoneChatParticipant,
): Promise<EventZoneChatMessage[]> {
  const history = await fetchChatRoomMessages(roomId, accessToken, { lastMessageId });
  return sortEventZoneChatMessages(mapServerMessagesToEventZoneChat(history, participant));
}

export { fetchChatRoomMessages, hasMoreChatHistory };