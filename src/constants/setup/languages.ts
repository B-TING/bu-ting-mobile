import type { AppLanguage } from '../../types/user';

export type LanguageOption = {
  code: AppLanguage;
  nativeLabel: string;
  englishLabel: string;
};

export const LANGUAGE_OPTIONS: LanguageOption[] = [
  { code: 'ko', nativeLabel: '한국어', englishLabel: 'Korean' },
  { code: 'en', nativeLabel: 'English', englishLabel: 'English' },
  { code: 'ja', nativeLabel: '日本語', englishLabel: 'Japanese' },
  { code: 'zh', nativeLabel: '中文', englishLabel: 'Chinese' },
];
