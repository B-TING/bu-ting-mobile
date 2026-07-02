import type { ChatZone } from './eventZone';

/**
 * 백엔드 채팅 스펙 타입 (REST + STOMP).
 * enter 히스토리는 `id`, STOMP 브로드캐스트는 `messageId` 필드를 사용합니다.
 */

/** GET /api/v1/chat/rooms/zone?zone={ChatZone} 응답 item */
export type ChatRoomSummary = {
  roomId: string;
  zone?: ChatZone;
  title?: string;
  name?: string;
  currentMembers?: number;
  memberCount?: number;
  [key: string]: unknown;
};

/** 백엔드 원본 메시지 (REST enter · STOMP MESSAGE) */
export type ChatMessageRaw = {
  messageId?: string;
  id?: string;
  roomId: string;
  userId: string;
  senderNickname: string;
  content: string;
  createdAt: string;
  isMine?: boolean;
};

/** 앱 내부 정규화 메시지 */
export type ChatMessage = {
  messageId: string;
  roomId: string;
  userId: string;
  senderNickname: string;
  content: string;
  createdAt: string;
  isMine?: boolean;
};

/** STOMP SEND /pub/chat/message body */
export type ChatSendPayload = {
  roomId: string;
  content: string;
};

export function normalizeChatMessage(raw: ChatMessageRaw): ChatMessage {
  const messageId = raw.messageId ?? raw.id;
  if (!messageId) {
    throw new Error('Chat message missing id/messageId');
  }
  return {
    messageId,
    roomId: raw.roomId,
    userId: raw.userId,
    senderNickname: raw.senderNickname,
    content: raw.content,
    createdAt: raw.createdAt,
    isMine: raw.isMine,
  };
}

/** 백엔드 ChatroomResponse.currentMembers */
export function readChatRoomMemberCount(room: ChatRoomSummary): number {
  if (typeof room.currentMembers === 'number') {
    return room.currentMembers;
  }
  if (typeof room.memberCount === 'number') {
    return room.memberCount;
  }
  return 0;
}
