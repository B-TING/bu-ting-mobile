import type { AppLanguage } from '../../types/user';

/** Google·Kakao 로그인 버튼 공통 높이 */
export const OAUTH_BUTTON_HEIGHT = 48;

export const KAKAO_BUTTON = {
  container: '#FEE500',
  symbol: '#000000',
  label: 'rgba(0, 0, 0, 0.85)',
  borderRadius: 12,
  fontSize: 15,
  iconSize: 18,
  iconGap: 8,
} as const;

export const GOOGLE_BUTTON = {
  container: '#FFFFFF',
  border: '#747775',
  label: '#1F1F1F',
  borderRadius: 20,
  fontSize: 14,
  iconSize: 20,
  iconGap: 12,
} as const;

const KAKAO_LABEL: Record<AppLanguage, string> = {
  ko: '카카오 로그인',
  en: 'Login with Kakao',
  ja: 'Login with Kakao',
  zh: 'Login with Kakao',
};

const GOOGLE_LABEL: Record<AppLanguage, string> = {
  ko: 'Google 계정으로 로그인',
  en: 'Sign in with Google',
  ja: 'Sign in with Google',
  zh: 'Sign in with Google',
};

export function getKakaoLoginLabel(language: AppLanguage): string {
  return KAKAO_LABEL[language];
}

export function getGoogleLoginLabel(language: AppLanguage): string {
  return GOOGLE_LABEL[language];
}
