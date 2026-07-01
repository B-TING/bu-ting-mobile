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

/** Client → Server */
export type ZoneChatClientFrame =
  | {
      type: 'JOIN';
      roomId: string;
      zoneId?: EventZoneId;
      participant: ZoneChatParticipant;
    }
  | {
      type: 'LEAVE';
      roomId: string;
    }
  | {
      type: 'MESSAGE';
      roomId: string;
      clientMessageId: string;
      text: string;
    }
  | { type: 'PING' };

/** Server → Client (백엔드 스펙 확정 전 가안) */
export type ZoneChatServerFrame =
  | {
      type: 'WELCOME';
      roomId: string;
      participantCount?: number;
    }
  | {
      type: 'HISTORY';
      roomId: string;
      messages: ZoneChatServerMessage[];
    }
  | {
      type: 'MESSAGE';
      roomId: string;
      message: ZoneChatServerMessage;
    }
  | {
      type: 'ERROR';
      code?: string;
      message: string;
    }
  | { type: 'PONG' };

export type ZoneChatServerMessage = {
  id: string;
  roomId: string;
  authorIdentityField?: ZoneChatIdentityField;
  authorIdentityValue: string;
  authorNickname: string;
  text: string;
  sentAt: string;
};

export type ZoneChatWebSocketConnectOptions = {
  url: string;
  roomId: string;
  zoneId?: EventZoneId;
  participant: ZoneChatParticipant;
  accessToken?: string | null;
};
