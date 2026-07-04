import { CHAT_ENDPOINTS } from '../api/apiConfig';
import { API_BASE_URL } from '../api/apiBaseUrl';

import type { ZoneChatIdentityField } from '../../types/zoneChatWebSocket';

/**
 * 구역 채팅 WebSocket 설정 (백엔드 STOMP 스펙).
 * ws://{HOST}:8080/ws-stomp — CONNECT 시 Authorization: Bearer 헤더로 인증.
 */
export const ZONE_CHAT_WS_CONFIG = {
  /** 백엔드 채팅 연동 테스트 활성화 */
  enabled: true,
  /** API_BASE_URL 기준 WebSocket path */
  path: CHAT_ENDPOINTS.webSocketPath,
  /** 전체 URL override (설정 시 path·API_BASE_URL 무시) */
  urlOverride: null as string | null,
  /** 입장 시 서버에 보낼 식별자 필드 (userId | email | nickname) */
  identityField: 'userId' as ZoneChatIdentityField,
  reconnectMaxAttempts: 5,
  reconnectBaseDelayMs: 1000,
  pingIntervalMs: 30_000,
  /** GET /messages 페이지당 최대 개수 */
  messagePageSize: 100,
  /** STOMP 구독/발행 destination */
  stomp: {
    sendMessage: '/pub/chat/message',
    roomMessages: (roomId: string) => `/sub/chat/room/${roomId}`,
    roomStatus: (roomId: string) => `/sub/chat/room/${roomId}/status`,
  },
  /** WS 입·퇴장 후 REST currentMembers 동기화 대기(ms) */
  memberCountSyncDelayMs: 400,
  /** STOMP DISCONNECT 후 소켓 close 대기(ms) */
  gracefulDisconnectMs: 100,
} as const;

export function isZoneChatWebSocketEnabled(): boolean {
  return ZONE_CHAT_WS_CONFIG.enabled;
}

/** REST base URL → WebSocket URL (http→ws, https→wss) */
export function httpBaseUrlToWebSocketBase(httpBase: string): string {
  return httpBase.replace(/\/$/, '').replace(/^http/i, 'ws');
}

/**
 * STOMP 연결 URL. 인증은 CONNECT 프레임의 Authorization 헤더로 하므로
 * accessToken 을 URL 쿼리에 붙이지 않습니다.
 */
export function buildZoneChatWebSocketUrl(_accessToken?: string | null): string {
  if (ZONE_CHAT_WS_CONFIG.urlOverride) {
    return ZONE_CHAT_WS_CONFIG.urlOverride;
  }
  const wsBase = httpBaseUrlToWebSocketBase(API_BASE_URL);
  return `${wsBase}${ZONE_CHAT_WS_CONFIG.path}`;
}
