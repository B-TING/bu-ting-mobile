import type { ChatMessage } from './chatApi';
import type { EventZoneId } from './eventZone';

/** 백엔드 입장 식별자 필드 — 확정 전까지 설정으로 전환 */
export type ZoneChatIdentityField = 'userId' | 'email' | 'nickname';

export type ZoneChatParticipant = {
  identityField: ZoneChatIdentityField;
  identityValue: string;
  displayNickname: string;
  userId?: string | null;
  email?: string | null;
};

export type ZoneChatConnectionStatus =
  | 'disabled'
  | 'idle'
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'disconnected'
  | 'failed';

/** 서버 실시간 메시지는 백엔드 ChatMessageResponse 정규화본 */
export type ZoneChatServerMessage = ChatMessage;

export type ZoneChatWebSocketConnectOptions = {
  url: string;
  roomId: string;
  zoneId?: EventZoneId;
  participant: ZoneChatParticipant;
  accessToken?: string | null;
};
