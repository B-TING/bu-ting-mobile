import type { ChatZone } from './eventZone';

/**
 * 백엔드 채팅 스펙 타입 (REST + STOMP).
 * REST 히스토리(GET messages)는 `id`, STOMP 브로드캐스트는 `messageId` 필드를 사용합니다.
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

/** 백엔드 원본 메시지 (REST messages · STOMP MESSAGE) */
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

export type FetchChatRoomMessagesOptions = {
  /** 더보기 페이징 — 화면 상단(가장 오래된) 메시지 UUID */
  lastMessageId?: string;
};

/** STOMP /sub/chat/room/{roomId}/status 수신 payload */
export type ChatRoomStatusPayload = {
  roomId: string;
  currentMembers?: number | string;
  current_members?: number | string;
  memberCount?: number | string;
  [key: string]: unknown;
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

export function readChatMessageId(message: ChatMessage | ChatMessageRaw): string {
  return message.messageId ?? ('id' in message ? message.id : undefined) ?? '';
}

/** 백엔드 ChatroomResponse.currentMembers */
export function readChatRoomMemberCount(room: ChatRoomSummary): number {
  const parsed = parseMemberCountValue(
    room.currentMembers ?? room.memberCount ?? room.current_members,
  );
  return parsed ?? 0;
}

export function parseMemberCountValue(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

export function readRoomStatusMemberCount(
  status: ChatRoomStatusPayload | Record<string, unknown>,
): number | null {
  return parseMemberCountValue(
    status.currentMembers ?? status.current_members ?? status.memberCount,
  );
}

export function isSameChatRoomId(
  left: string | null | undefined,
  right: string | null | undefined,
): boolean {
  return Boolean(left && right && left.toLowerCase() === right.toLowerCase());
}

export function isChatStatusDestination(destination: string): boolean {
  return destination.endsWith('/status');
}

/** STOMP status MESSAGE body → 정규화 payload */
export type ParsedChatRoomStatusPayload = {
  roomId: string;
  currentMembers: number;
};

/** STOMP status MESSAGE body → 정규화 payload (실패 시 null) */
export function parseChatRoomStatusBody(body: string): ParsedChatRoomStatusPayload | null {
  try {
    const raw = JSON.parse(body) as ChatRoomStatusPayload;
    const currentMembers = readRoomStatusMemberCount(raw);
    const roomId = typeof raw.roomId === 'string' ? raw.roomId : null;
    if (currentMembers == null || !roomId) {
      return null;
    }
    return { roomId, currentMembers };
  } catch {
    return null;
  }
}
