import { API_BASE_URL } from '../api/apiBaseUrl';

import type { ZoneChatIdentityField } from '../../types/zoneChatWebSocket';

/**
 * 구역 채팅 WebSocket 설정.
 * 백엔드 준비 후 `enabled: true` 및 path/url 조정.
 */
export const ZONE_CHAT_WS_CONFIG = {
  /** false — 로컬 mock 채팅만 사용 */
  enabled: false,
  /** API_BASE_URL 기준 WebSocket path (가안) */
  path: '/ws/v1/zone-chat',
  /** 전체 URL override (설정 시 path·API_BASE_URL 무시) */
  urlOverride: null as string | null,
  /** 입장 시 서버에 보낼 식별자 필드 (userId | email | nickname) */
  identityField: 'userId' as ZoneChatIdentityField,
  reconnectMaxAttempts: 5,
  reconnectBaseDelayMs: 1000,
  pingIntervalMs: 30_000,
} as const;

export function isZoneChatWebSocketEnabled(): boolean {
  return ZONE_CHAT_WS_CONFIG.enabled;
}

/** REST base URL → WebSocket URL (http→ws, https→wss) */
export function httpBaseUrlToWebSocketBase(httpBase: string): string {
  return httpBase.replace(/\/$/, '').replace(/^http/i, 'ws');
}

export function buildZoneChatWebSocketUrl(accessToken?: string | null): string {
  if (ZONE_CHAT_WS_CONFIG.urlOverride) {
    return appendAccessToken(ZONE_CHAT_WS_CONFIG.urlOverride, accessToken);
  }

  const wsBase = httpBaseUrlToWebSocketBase(API_BASE_URL);
  const url = `${wsBase}${ZONE_CHAT_WS_CONFIG.path}`;
  return appendAccessToken(url, accessToken);
}

function appendAccessToken(url: string, accessToken?: string | null): string {
  if (!accessToken) {
    return url;
  }
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}token=${encodeURIComponent(accessToken)}`;
}
