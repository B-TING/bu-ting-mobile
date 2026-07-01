import type { EventZoneChatMessage } from '../../types/eventZone';
import type {
  ZoneChatParticipant,
  ZoneChatServerMessage,
} from '../../types/zoneChatWebSocket';
import { isZoneChatMessageMine } from './zoneChatIdentity';

export function mapServerMessageToEventZoneChat(
  message: ZoneChatServerMessage,
  participant: ZoneChatParticipant,
): EventZoneChatMessage {
  return {
    id: message.id,
    roomId: message.roomId,
    authorId: message.authorIdentityValue,
    authorNickname: message.authorNickname,
    text: message.text,
    sentAt: message.sentAt,
    isMine: isZoneChatMessageMine(message, participant),
  };
}

export function mapServerMessagesToEventZoneChat(
  messages: ZoneChatServerMessage[],
  participant: ZoneChatParticipant,
): EventZoneChatMessage[] {
  return messages.map(message => mapServerMessageToEventZoneChat(message, participant));
}
