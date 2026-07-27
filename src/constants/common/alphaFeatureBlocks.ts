/**
 * 알파 1.0.0 Play Store 제출용 — 미완 기능 차단 플래그.
 * true면 FeatureUnavailableAlert 로 진입을 막는다.
 */
export const ALPHA_FEATURE_BLOCKS = {
  /** 여행기·피드 (미디어 업로드 미완) */
  feed: true,
  travelogue: true,
  /** 팀원(일행) 초대 */
  invite: true,
  /** 구역 이벤트 (구역 채팅방은 유지) */
  zoneEvent: true,
  /** 일정 AI 추천·생성 (직접 생성은 유지) */
  planAi: true,
  /** AI 헬프데스크 */
  helpdesk: true,
  /** 리부트 */
  reboot: true,
} as const;

export type AlphaBlockedFeature = keyof typeof ALPHA_FEATURE_BLOCKS;

export const ALPHA_FEATURE_LABELS: Record<AlphaBlockedFeature, string> = {
  feed: '여행 피드',
  travelogue: '여행기',
  invite: '일행 초대',
  zoneEvent: '구역 이벤트',
  planAi: 'AI 일정 생성',
  helpdesk: 'AI 헬프데스크',
  reboot: '리부트',
};

export function isAlphaFeatureBlocked(feature: AlphaBlockedFeature): boolean {
  return ALPHA_FEATURE_BLOCKS[feature];
}
