import type { ChatMessage, ChatMessageRaw } from '../../types/chatApi';
import { normalizeChatMessage } from '../../types/chatApi';
import type { EventZoneChatMessage } from '../../types/eventZone';
import type { ZoneChatParticipant } from '../../types/zoneChatWebSocket';

/** 백엔드 ChatMessage 가 현재 사용자 것인지 (userId 기준) */
export function isZoneChatMessageMine(
  message: ChatMessage,
  participant: ZoneChatParticipant,
): boolean {
  if (typeof message.isMine === 'boolean') {
    return message.isMine;
  }
  if (participant.userId && message.userId) {
    return message.userId === participant.userId;
  }
  return false;
}

export function mapServerMessageToEventZoneChat(
  raw: ChatMessageRaw,
  participant: ZoneChatParticipant,
): EventZoneChatMessage {
  const message = normalizeChatMessage(raw);
  return {
    id: message.messageId,
    roomId: message.roomId,
    authorId: message.userId,
    authorNickname: message.senderNickname,
    text: message.content,
    sentAt: message.createdAt,
    isMine: isZoneChatMessageMine(message, participant),
  };
}

export function mapServerMessagesToEventZoneChat(
  messages: ChatMessageRaw[],
  participant: ZoneChatParticipant,
): EventZoneChatMessage[] {
  const mapped: EventZoneChatMessage[] = [];
  for (const message of messages) {
    try {
      mapped.push(mapServerMessageToEventZoneChat(message, participant));
    } catch {
      // normalizeChatMessage 실패 — 개별 메시지 스킵
    }
  }
  return sortEventZoneChatMessages(mapped);
}

export function sortEventZoneChatMessages(
  messages: EventZoneChatMessage[],
): EventZoneChatMessage[] {
  return [...messages].sort(
    (a, b) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime(),
  );
}
