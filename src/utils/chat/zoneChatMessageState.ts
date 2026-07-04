import {
  mapServerMessageToEventZoneChat,
  sortEventZoneChatMessages,
} from '../../services/chat/zoneChatMessageMapper';
import type { ChatMessage, ChatMessageRaw } from '../../types/chatApi';
import { readChatMessageId } from '../../types/chatApi';
import type { EventZoneChatMessage } from '../../types/eventZone';
import type { ZoneChatParticipant } from '../../types/zoneChatWebSocket';

const LOCAL_MESSAGE_ID_PREFIX = 'local-msg-';

let localMessageCounter = 0;

export function nextLocalZoneChatMessageId(): string {
  localMessageCounter += 1;
  return `${LOCAL_MESSAGE_ID_PREFIX}${localMessageCounter}-${Date.now()}`;
}

export function isLocalZoneChatMessageId(id: string): boolean {
  return id.startsWith(LOCAL_MESSAGE_ID_PREFIX);
}

export function createOptimisticZoneChatMessage(
  clientMessageId: string,
  roomId: string,
  participant: ZoneChatParticipant,
  text: string,
): EventZoneChatMessage {
  return {
    id: clientMessageId,
    roomId,
    authorId: participant.identityValue,
    authorNickname: participant.displayNickname,
    text,
    sentAt: new Date().toISOString(),
    isMine: true,
  };
}

export function appendOptimisticZoneChatMessage(
  messages: EventZoneChatMessage[],
  optimistic: EventZoneChatMessage,
): EventZoneChatMessage[] {
  return sortEventZoneChatMessages([...messages, optimistic]);
}

export function prependOlderZoneChatMessages(
  messages: EventZoneChatMessage[],
  older: EventZoneChatMessage[],
): EventZoneChatMessage[] {
  if (older.length === 0) {
    return messages;
  }

  const existingIds = new Set(messages.map(message => message.id));
  const uniqueOlder = older.filter(message => !existingIds.has(message.id));
  if (uniqueOlder.length === 0) {
    return messages;
  }

  return sortEventZoneChatMessages([...uniqueOlder, ...messages]);
}

export function oldestPersistedZoneChatMessageId(
  messages: EventZoneChatMessage[],
): string | null {
  const oldest = messages.find(message => !isLocalZoneChatMessageId(message.id));
  return oldest?.id ?? null;
}

export function mergeIncomingZoneChatMessage(
  messages: EventZoneChatMessage[],
  raw: ChatMessage | ChatMessageRaw,
  participant: ZoneChatParticipant,
): EventZoneChatMessage[] {
  const messageId = readChatMessageId(raw);
  if (messageId && messages.some(item => item.id === messageId)) {
    return messages;
  }

  const mapped = mapServerMessageToEventZoneChat(raw, participant);
  const withoutOptimistic = mapped.isMine
    ? messages.filter(
        item => !(isLocalZoneChatMessageId(item.id) && item.text === mapped.text),
      )
    : messages;

  return sortEventZoneChatMessages([...withoutOptimistic, mapped]);
}
