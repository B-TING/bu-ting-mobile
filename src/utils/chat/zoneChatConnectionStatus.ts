import type { ZoneChatConnectionStatus } from '../../types/zoneChatWebSocket';

/** RN WebSocket — HTTP 101 대신 401/403 이 오면 재연결해도 성공하지 않음 */
export function isWebSocketAuthHandshakeFailure(reason?: string | null): boolean {
  const normalized = (reason ?? '').trim();
  return /\b403\b/.test(normalized) || /\b401\b/.test(normalized);
}

type StatusLabelOptions = {
  needsLogin: boolean;
};

export function zoneChatConnectionStatusLabel(
  status: ZoneChatConnectionStatus,
  language: string,
  options: StatusLabelOptions,
): string | null {
  if (options.needsLogin) {
    return language === 'ko'
      ? '실시간 채팅을 쓰려면 로그인이 필요합니다.'
      : 'Sign in to use live chat.';
  }

  switch (status) {
    case 'idle':
      return language === 'ko' ? '채팅방 입장 중…' : 'Joining chat room…';
    case 'connecting':
    case 'reconnecting':
      return language === 'ko' ? '채팅 서버 연결 중…' : 'Connecting to chat…';
    case 'failed':
      return language === 'ko'
        ? '연결에 실패했습니다. 네트워크·로그인 상태를 확인해 주세요.'
        : 'Connection failed. Check network and sign-in.';
    case 'connected':
      return language === 'ko' ? '실시간 채팅 연결됨' : 'Live chat connected';
    default:
      return null;
  }
}
