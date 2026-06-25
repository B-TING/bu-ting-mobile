import type { OAuthProvider } from '../../types/auth';

/** 네이버 개발자 앱 등록 전까지 비활성화 */
export const NAVER_OAUTH_ENABLED = false;

const BASE_PROVIDERS: OAuthProvider[] = ['google', 'kakao'];

export const ENABLED_OAUTH_PROVIDERS: OAuthProvider[] = NAVER_OAUTH_ENABLED
  ? [...BASE_PROVIDERS, 'naver']
  : BASE_PROVIDERS;
