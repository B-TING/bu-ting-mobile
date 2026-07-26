import type { AppLanguage } from '../../types/user';

export type FeatureUnavailableCopy = {
  title: string;
  message: string;
  messageWithFeature: (featureName: string) => string;
  confirm: string;
};

export const FEATURE_UNAVAILABLE_COPY: Record<
  AppLanguage,
  FeatureUnavailableCopy
> = {
  ko: {
    title: '준비 중인 기능이에요',
    message: '알파 버전에서는 아직 사용할 수 없습니다.',
    messageWithFeature: featureName => `${featureName} 기능은 준비 중이에요.`,
    confirm: '확인',
  },
  en: {
    title: 'Coming soon',
    message: 'This feature is not available in the alpha version yet.',
    messageWithFeature: featureName =>
      `${featureName} is not available yet.`,
    confirm: 'OK',
  },
  ja: {
    title: '準備中の機能です',
    message: 'アルファ版ではまだご利用いただけません。',
    messageWithFeature: featureName =>
      `${featureName}機能は準備中です。`,
    confirm: 'OK',
  },
  zh: {
    title: '功能即将推出',
    message: '该功能在 Alpha 版本中尚不可用。',
    messageWithFeature: featureName => `${featureName}功能即将推出。`,
    confirm: '确定',
  },
};

export function getFeatureUnavailableCopy(
  language: AppLanguage | null | undefined,
): FeatureUnavailableCopy {
  return FEATURE_UNAVAILABLE_COPY[language ?? 'ko'];
}
