import type { AppLanguage } from '../../types/user';

export type LanguageOption = {
  code: AppLanguage;
  shortCode: string;
  nativeLabel: string;
  englishLabel: string;
  /** 카드 하단 보조 라벨 (피그마) */
  hintLabel: string;
};

export const LANGUAGE_OPTIONS: LanguageOption[] = [
  {
    code: 'ko',
    shortCode: 'KR',
    nativeLabel: '한국어',
    englishLabel: 'Korean',
    hintLabel: 'Korean',
  },
  {
    code: 'en',
    shortCode: 'US',
    nativeLabel: 'English',
    englishLabel: 'English',
    hintLabel: '영어',
  },
  {
    code: 'ja',
    shortCode: 'JP',
    nativeLabel: '日本語',
    englishLabel: 'Japanese',
    hintLabel: '일본어',
  },
  {
    code: 'zh',
    shortCode: 'CN',
    nativeLabel: '中文',
    englishLabel: 'Chinese',
    hintLabel: '중국어',
  },
];
