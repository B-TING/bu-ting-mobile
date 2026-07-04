import { CHAT_ENDPOINTS } from '../api/apiConfig';
import { API_BASE_URL } from '../api/apiBaseUrl';

import type { ZoneChatIdentityField } from '../../types/zoneChatWebSocket';

/**
 * 구역 채팅 WebSocket 설정 (백엔드 STOMP 스펙).
 * ws://{HOST}:8080/ws-stomp
 * - RN WebSocket 은 핸드셰이크에 Authorization 헤더를 붙일 수 없어 access_token 쿼리 사용
 * - STOMP CONNECT 프레임에도 Bearer 헤더를 함께 전송
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
 * STOMP WebSocket URL.
 * accessToken 이 있으면 핸드셰이크 인증용 쿼리(access_token)를 붙입니다.
 */
export function buildZoneChatWebSocketUrl(accessToken?: string | null): string {
  if (ZONE_CHAT_WS_CONFIG.urlOverride) {
    return ZONE_CHAT_WS_CONFIG.urlOverride;
  }
  const wsBase = httpBaseUrlToWebSocketBase(API_BASE_URL);
  const base = `${wsBase}${ZONE_CHAT_WS_CONFIG.path}`;
  if (!accessToken) {
    return base;
  }
  return `${base}?access_token=${encodeURIComponent(accessToken)}`;
}
