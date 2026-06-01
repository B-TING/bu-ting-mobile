import type {
  AppLanguage,
  BusanFamiliarity,
  CompanionType,
  LuggageLevel,
  TravelStyle,
  VisitPurpose,
} from '../types/user';

export const ONBOARDING_STEP_COUNT = 5;

export type OnboardingStepId =
  | 'travelStyle'
  | 'companions'
  | 'luggage'
  | 'purposes'
  | 'busanFamiliarity';

export type OnboardingStepConfig = {
  id: OnboardingStepId;
  title: Record<AppLanguage, string>;
  subtitle: Record<AppLanguage, string>;
};

export const ONBOARDING_STEPS: OnboardingStepConfig[] = [
  {
    id: 'travelStyle',
    title: {
      ko: '여행 스타일은 어떤 편인가요?',
      en: 'How do you usually plan trips?',
      ja: '旅行のスタイルは？',
      zh: '您的旅行风格是？',
    },
    subtitle: {
      ko: '맞춤 일정·인근 추천에 반영됩니다',
      en: 'Used for itinerary and nearby suggestions',
      ja: '行程・近くのおすすめに反映されます',
      zh: '用于行程与附近推荐',
    },
  },
  {
    id: 'companions',
    title: {
      ko: '누구와 여행하나요?',
      en: 'Who do you travel with?',
      ja: '誰と旅行しますか？',
      zh: '您和谁一起旅行？',
    },
    subtitle: {
      ko: '동기화·오프라인 기능에 반영됩니다',
      en: 'Used for sync and offline features',
      ja: '同期・オフライン機能に反映されます',
      zh: '用于同步与离线功能',
    },
  },
  {
    id: 'luggage',
    title: {
      ko: '짐은 어느 정도 챙기시나요?',
      en: 'How much luggage do you bring?',
      ja: '荷物はどのくらいですか？',
      zh: '您通常带多少行李？',
    },
    subtitle: {
      ko: '짐 보관·편의 시설 안내에 반영됩니다',
      en: 'Used for locker and amenity guides',
      ja: '荷物預かり・施設案内に反映されます',
      zh: '用于行李寄存与设施指引',
    },
  },
  {
    id: 'purposes',
    title: {
      ko: '부산에서 가장 하고 싶은 것은?',
      en: 'What do you want most in Busan?',
      ja: '釜山で一番やりたいことは？',
      zh: '您在釜山最想做什么？',
    },
    subtitle: {
      ko: '복수 선택 가능 · 식당·축제 추천에 반영',
      en: 'Select multiple · restaurants & events',
      ja: '複数選択可 · 飲食店・イベント推薦',
      zh: '可多选 · 用于餐厅与活动推荐',
    },
  },
  {
    id: 'busanFamiliarity',
    title: {
      ko: '부산에 대해 얼마나 아시나요?',
      en: 'How well do you know Busan?',
      ja: '釜山についてどのくらい知っていますか？',
      zh: '您对釜山了解多少？',
    },
    subtitle: {
      ko: 'GPS 안내 vs 여행기 기능에 반영됩니다',
      en: 'GPS guides vs travel journal features',
      ja: 'GPS案内か旅行記機能かに反映',
      zh: '用于 GPS 导览或旅行记功能',
    },
  },
];

type Option<T extends string> = {
  value: T;
  label: Record<AppLanguage, string>;
};

export const TRAVEL_STYLE_OPTIONS: Option<TravelStyle>[] = [
  {
    value: 'planned',
    label: {
      ko: '계획적인 편',
      en: 'I plan ahead',
      ja: '計画的',
      zh: '喜欢提前规划',
    },
  },
  {
    value: 'spontaneous',
    label: {
      ko: '즉흥적인 편',
      en: 'I go with the flow',
      ja: 'その場の気分で',
      zh: '随性而行',
    },
  },
];

export const COMPANION_OPTIONS: Option<CompanionType>[] = [
  {
    value: 'solo',
    label: {
      ko: '혼자 여행',
      en: 'Solo',
      ja: 'ひとり旅',
      zh: '独自旅行',
    },
  },
  {
    value: 'group',
    label: {
      ko: '함께 여행',
      en: 'With others',
      ja: '誰かと一緒',
      zh: '与他人同行',
    },
  },
];

export const LUGGAGE_OPTIONS: Option<LuggageLevel>[] = [
  {
    value: 'light',
    label: {
      ko: '가볍게',
      en: 'Travel light',
      ja: '少なめ',
      zh: '轻装',
    },
  },
  {
    value: 'heavy',
    label: {
      ko: '많이 챙김',
      en: 'Pack a lot',
      ja: '多めに持つ',
      zh: '行李较多',
    },
  },
];

export const PURPOSE_OPTIONS: Option<VisitPurpose>[] = [
  {
    value: 'food',
    label: { ko: '음식', en: 'Food', ja: 'グルメ', zh: '美食' },
  },
  {
    value: 'scenery',
    label: { ko: '풍경', en: 'Scenery', ja: '景色', zh: '风景' },
  },
  {
    value: 'culture',
    label: { ko: '문화체험', en: 'Culture', ja: '文化体験', zh: '文化体验' },
  },
  {
    value: 'shopping',
    label: { ko: '쇼핑', en: 'Shopping', ja: 'ショッピング', zh: '购物' },
  },
  {
    value: 'nightlife',
    label: { ko: '나이트라이프', en: 'Nightlife', ja: 'ナイトライフ', zh: '夜生活' },
  },
  {
    value: 'relaxation',
    label: { ko: '휴식', en: 'Relaxation', ja: 'リラックス', zh: '休闲' },
  },
];

export const FAMILIARITY_OPTIONS: Option<BusanFamiliarity>[] = [
  {
    value: 'novice',
    label: {
      ko: '잘 모른다',
      en: "Don't know well",
      ja: 'あまり知らない',
      zh: '不太了解',
    },
  },
  {
    value: 'familiar',
    label: {
      ko: '아는 편이다',
      en: 'Know it fairly well',
      ja: 'だいたい知っている',
      zh: '比较了解',
    },
  },
];

export const SETUP_COPY: Record<
  AppLanguage,
  {
    languageTitle: string;
    languageSubtitle: string;
    continue: string;
    loginTitle: string;
    loginSubtitle: string;
    email: string;
    password: string;
    login: string;
    skip: string;
    skipAll: string;
    next: string;
    finish: string;
    stepOf: (current: number, total: number) => string;
  }
> = {
  ko: {
    languageTitle: '언어를 선택해 주세요',
    languageSubtitle: '앱 안내와 관광 정보 언어에 사용됩니다',
    continue: '계속',
    loginTitle: '로그인',
    loginSubtitle: '일정 동기화와 Route Feed를 위해 로그인하세요',
    email: '이메일',
    password: '비밀번호',
    login: '로그인',
    skip: '건너뛰기',
    skipAll: '온보딩 전체 건너뛰기',
    next: '다음',
    finish: '시작하기',
    stepOf: (c, t) => `${c} / ${t}`,
  },
  en: {
    languageTitle: 'Choose your language',
    languageSubtitle: 'Used for app UI and tourism content',
    continue: 'Continue',
    loginTitle: 'Sign in',
    loginSubtitle: 'Sync itineraries and share on Route Feed',
    email: 'Email',
    password: 'Password',
    login: 'Sign in',
    skip: 'Skip',
    skipAll: 'Skip all onboarding',
    next: 'Next',
    finish: 'Get started',
    stepOf: (c, t) => `${c} / ${t}`,
  },
  ja: {
    languageTitle: '言語を選択',
    languageSubtitle: 'アプリと観光情報の表示言語に使用',
    continue: '続ける',
    loginTitle: 'ログイン',
    loginSubtitle: '行程の同期とRoute Feedのために',
    email: 'メール',
    password: 'パスワード',
    login: 'ログイン',
    skip: 'スキップ',
    skipAll: 'オンボーディングをすべてスキップ',
    next: '次へ',
    finish: 'はじめる',
    stepOf: (c, t) => `${c} / ${t}`,
  },
  zh: {
    languageTitle: '选择语言',
    languageSubtitle: '用于应用界面与旅游信息',
    continue: '继续',
    loginTitle: '登录',
    loginSubtitle: '同步行程并分享至 Route Feed',
    email: '邮箱',
    password: '密码',
    login: '登录',
    skip: '跳过',
    skipAll: '跳过全部引导',
    next: '下一步',
    finish: '开始',
    stepOf: (c, t) => `${c} / ${t}`,
  },
};
