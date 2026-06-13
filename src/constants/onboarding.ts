import type {
  AppLanguage,
  BusanFamiliarity,
  CompanionType,
  LuggageLevel,
  OnboardingAnswers,
  SchedulePace,
  TravelStyle,
  VisitPurpose,
} from '../types/user';

export const ONBOARDING_QUESTION_COUNT = 6;

export type OnboardingStepId =
  | 'travelStyle'
  | 'schedulePace'
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
      ko: '계획적인 편 vs 즉흥적인 편 중 선택',
      en: 'Choose planned vs spontaneous',
      ja: '計画的か、その場次第か',
      zh: '选择计划型或随性型',
    },
  },
  {
    id: 'schedulePace',
    title: {
      ko: '일정은 어떻게 짜는 편인가요?',
      en: 'How packed should your days be?',
      ja: '日程はどのくらい詰めますか？',
      zh: '您喜欢怎样的行程密度？',
    },
    subtitle: {
      ko: '여유롭게 vs 빡빡하게 중 선택',
      en: 'Choose relaxed or packed days',
      ja: 'ゆったりか、ぎゅうぎゅうか',
      zh: '选择宽松或紧凑的行程',
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
      ko: '혼자 vs 함께 중 선택',
      en: 'Solo or with others',
      ja: 'ひとりか、誰かとか',
      zh: '独自或与他人同行',
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
      ko: '가볍게 vs 많이 챙김 중 선택',
      en: 'Travel light or pack more',
      ja: '少なめか、多めか',
      zh: '轻装或行李较多',
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
      ko: '복수 선택 가능 (음식, 풍경, 문화체험 등)',
      en: 'Select all that apply',
      ja: '複数選択可',
      zh: '可多选',
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
      ko: '잘 모른다 vs 아는 편이다 중 선택',
      en: 'New to Busan or know it well',
      ja: 'あまり知らないか、だいたい知っているか',
      zh: '不太了解或比较了解',
    },
  },
];

export type OnboardingFlowStep =
  | ({ kind: 'question' } & OnboardingStepConfig)
  | { kind: 'feature'; forQuestion: OnboardingStepId };

/** 질문 → 기능 설명 → 질문 → … 순서 */
export const ONBOARDING_FLOW: OnboardingFlowStep[] = ONBOARDING_STEPS.flatMap(
  step => [
    { kind: 'question' as const, ...step },
    { kind: 'feature' as const, forQuestion: step.id },
  ],
);

export const ONBOARDING_STEP_COUNT = ONBOARDING_FLOW.length;

/** 온보딩 완료 감사 화면 표시 후 다음 화면으로 이동하기까지 대기(ms) */
export const ONBOARDING_COMPLETE_DELAY_MS = 2400;

export type FeatureHighlight = {
  emoji: string;
  title: Record<AppLanguage, string>;
  description: Record<AppLanguage, string>;
  emphasized?: boolean;
};

export type FeatureStepContent = {
  title: Record<AppLanguage, string>;
  subtitle: Record<AppLanguage, string>;
  features: FeatureHighlight[];
};

const featureCopy = {
  planner: {
    emoji: '📅',
    title: {
      ko: '일정 플래너',
      en: 'Trip planner',
      ja: '行程プランナー',
      zh: '行程规划',
    },
    description: {
      ko: '시간·이동을 고려한 맞춤 일정을 만들고 조정할 수 있어요.',
      en: 'Build and adjust itineraries with travel time in mind.',
      ja: '移動時間を考慮した行程を作成・調整できます。',
      zh: '根据交通时间制定并调整专属行程。',
    },
  },
  nearby: {
    emoji: '📍',
    title: {
      ko: '인근 장소 추천',
      en: 'Nearby suggestions',
      ja: '近くのおすすめ',
      zh: '附近推荐',
    },
    description: {
      ko: '지금 위치 주변의 맛집·명소를 즉흥적으로 탐색할 수 있어요.',
      en: 'Discover spots around you when you explore on the fly.',
      ja: '現在地周辺のスポットをその場で探せます。',
      zh: '随时发现您附近的景点与餐厅。',
    },
  },
  sync: {
    emoji: '🔄',
    title: {
      ko: '일정 동기화',
      en: 'Itinerary sync',
      ja: '行程の同期',
      zh: '行程同步',
    },
    description: {
      ko: '함께 여행하는 일행과 실시간으로 일정을 맞출 수 있어요.',
      en: 'Keep plans aligned with travel companions in real time.',
      ja: '同行者とリアルタイムで行程を共有できます。',
      zh: '与同行伙伴实时对齐行程。',
    },
  },
  offline: {
    emoji: '📴',
    title: {
      ko: '오프라인 모드',
      en: 'Offline mode',
      ja: 'オフラインモード',
      zh: '离线模式',
    },
    description: {
      ko: '데이터가 없어도 저장된 일정·지도를 볼 수 있어요.',
      en: 'View saved plans and maps without a connection.',
      ja: '通信なしでも保存した行程・地図を表示できます。',
      zh: '无网络时仍可查看已保存的行程与地图。',
    },
  },
  locker: {
    emoji: '🧳',
    title: {
      ko: '짐 보관 안내',
      en: 'Luggage storage',
      ja: '荷物預かり案内',
      zh: '行李寄存',
    },
    description: {
      ko: '역·관광지 근처 짐 보관소 위치와 이용 방법을 알려드려요.',
      en: 'Find locker locations and how to use them near stations and sights.',
      ja: '駅や観光地付近のコインロッカーを案内します。',
      zh: '指引车站与景点附近的行李寄存点。',
    },
  },
  amenities: {
    emoji: '🏪',
    title: {
      ko: '편의 시설 위치',
      en: 'Amenities nearby',
      ja: '周辺施設',
      zh: '便民设施',
    },
    description: {
      ko: '화장실·편의점·약국 등 여행 중 필요한 시설을 지도에서 찾을 수 있어요.',
      en: 'Locate restrooms, convenience stores, pharmacies, and more on the map.',
      ja: 'トイレ・コンビニ・薬局などを地図で探せます。',
      zh: '在地图上查找洗手间、便利店、药店等设施。',
    },
  },
  restaurants: {
    emoji: '🍽️',
    title: {
      ko: '맛집 리스트',
      en: 'Restaurant picks',
      ja: '飲食店リスト',
      zh: '餐厅推荐',
    },
    description: {
      ko: '취향에 맞는 부산 맛집을 모아 보고 경로에 넣을 수 있어요.',
      en: 'Browse Busan restaurants that match your taste and add them to your route.',
      ja: '好みの釜山グルメを一覧し、行程に追加できます。',
      zh: '浏览符合口味的釜山餐厅并加入行程。',
    },
  },
  festivals: {
    emoji: '🎉',
    title: {
      ko: '축제·이벤트',
      en: 'Festivals & events',
      ja: '祭り・イベント',
      zh: '节庆活动',
    },
    description: {
      ko: '방문 시기에 맞는 축제와 문화 행사를 리스트업해 드려요.',
      en: 'See festivals and cultural events that fit your visit dates.',
      ja: '訪問時期に合う祭りや文化イベントを一覧表示します。',
      zh: '列出与您行程日期匹配的节庆与文化活动的清单。',
    },
  },
  sceneryList: {
    emoji: '🌊',
    title: {
      ko: '명소·뷰포인트',
      en: 'Scenic spots',
      ja: '景勝地',
      zh: '风景打卡',
    },
    description: {
      ko: '해운대·감천문화마을 등 풍경 명소를 일정에 쉽게 담을 수 있어요.',
      en: 'Add iconic views like Haeundae and Gamcheon to your plan.',
      ja: '海雲台や甘川文化村などの景勝地を行程に追加できます。',
      zh: '将海云台、甘川文化村等风景点加入行程。',
    },
  },
  gpsGuide: {
    emoji: '🛰️',
    title: {
      ko: 'GPS 인근 안내',
      en: 'GPS nearby guide',
      ja: 'GPS周辺案内',
      zh: 'GPS 周边导览',
    },
    description: {
      ko: '가까운 여행지·시설에 대한 설명을 위치 기반으로 받을 수 있어요.',
      en: 'Get location-based explanations for nearby places and facilities.',
      ja: '近くの観光地・施設の説明を位置情報で受け取れます。',
      zh: '根据位置获取附近景点与设施说明。',
    },
  },
  travelJournal: {
    emoji: '📔',
    title: {
      ko: '여행기',
      en: 'Travel journal',
      ja: '旅行記',
      zh: '旅行记',
    },
    description: {
      ko: '방문 기록과 팁을 남기고 다른 여행자와 공유할 수 있어요.',
      en: 'Record visits and tips, and share with other travelers.',
      ja: '訪問記録やヒントを残し、他の旅行者と共有できます。',
      zh: '记录到访与心得，并与其他旅行者分享。',
    },
  },
} as const;

/** 직전 질문 응답에 맞춘 기능 설명 콘텐츠 */
export function getFeatureStepContent(
  forQuestion: OnboardingStepId,
  answers: OnboardingAnswers,
): FeatureStepContent {
  const emphasize = (key: keyof typeof featureCopy): FeatureHighlight => ({
    ...featureCopy[key],
    emphasized: true,
  });
  const plain = (key: keyof typeof featureCopy): FeatureHighlight => ({
    ...featureCopy[key],
  });

  switch (forQuestion) {
    case 'schedulePace': {
      const packed = answers.schedulePace === 'packed';
      return {
        title: {
          ko: '일정 밀도에 맞는 플래너',
          en: 'Planner for your pace',
          ja: 'ペースに合ったプランナー',
          zh: '匹配您节奏的规划器',
        },
        subtitle: {
          ko: packed
            ? '하루에 더 많은 장소를 담은 알찬 일정을 추천해 드려요'
            : '이동·휴식 시간을 넉넉히 두는 여유로운 일정을 만들어요',
          en: packed
            ? 'We fit more stops into each day for you'
            : 'We leave room for breaks and unhurried travel',
          ja: packed
            ? '1日により多くのスポットを組み込みます'
            : '移動と休憩の余裕を持たせた行程にします',
          zh: packed ? '每日为您安排更多景点' : '预留充足的移动与休息时间',
        },
        features: packed
          ? [emphasize('planner'), plain('nearby')]
          : [plain('planner'), emphasize('amenities')],
      };
    }
    case 'travelStyle': {
      const planned = answers.travelStyle === 'planned';
      return {
        title: {
          ko: '당신에게 맞는 기능',
          en: 'Features for you',
          ja: 'あなた向けの機能',
          zh: '为您推荐的功能',
        },
        subtitle: {
          ko: planned
            ? '계획적인 여행에 플래너가 도움이 됩니다'
            : '즉흥적인 여행에 인근 추천이 도움이 됩니다',
          en: planned
            ? 'The planner fits your planned trips'
            : 'Nearby picks fit your spontaneous style',
          ja: planned
            ? '計画的な旅にプランナーが役立ちます'
            : 'その場の探索に近くのおすすめが役立ちます',
          zh: planned ? '行程规划适合爱做计划的你' : '附近推荐适合随性探索的你',
        },
        features: planned
          ? [emphasize('planner'), plain('nearby')]
          : [plain('planner'), emphasize('nearby')],
      };
    }
    case 'companions': {
      const group = answers.companions === 'group';
      return {
        title: {
          ko: '함께·혼자 여행에 유용한 기능',
          en: 'Features for your travel style',
          ja: '旅のスタイルに合う機能',
          zh: '适合您出行方式的功能',
        },
        subtitle: {
          ko: group
            ? '일행과 함께할 때 동기화가 특히 유용해요'
            : '혼자 여행할 때도 오프라인으로 안심하고 이용할 수 있어요',
          en: group
            ? 'Sync shines when you travel with others'
            : 'Offline mode helps when you travel solo',
          ja: group
            ? '同行者と一緒のときは同期が便利です'
            : 'ひとり旅でもオフラインで安心です',
          zh: group ? '与他人同行时同步特别有用' : '独自旅行时离线模式更安心',
        },
        features: group
          ? [emphasize('sync'), emphasize('offline')]
          : [plain('sync'), emphasize('offline')],
      };
    }
    case 'luggage': {
      const heavy = answers.luggage === 'heavy';
      return {
        title: {
          ko: '짐에 맞는 편의 기능',
          en: 'Features for your luggage',
          ja: '荷物に合わせた機能',
          zh: '贴合行李需求的便利功能',
        },
        subtitle: {
          ko: heavy
            ? '짐이 많을 때 보관·시설 안내를 활용해 보세요'
            : '가볍게 다녀도 주변 편의 시설 안내를 받을 수 있어요',
          en: heavy
            ? 'Use storage and amenity guides when you pack more'
            : 'Still find amenities nearby when you travel light',
          ja: heavy
            ? '荷物が多いときは預かり・施設案内が便利です'
            : '少なめでも周辺施設案内を利用できます',
          zh: heavy ? '行李多时可使用寄存与设施指引' : '轻装出行也能查找周边便民设施',
        },
        features: heavy
          ? [emphasize('locker'), emphasize('amenities')]
          : [plain('locker'), emphasize('amenities')],
      };
    }
    case 'purposes': {
      const purposes = answers.purposes;
      const features: FeatureHighlight[] = [];
      if (purposes.includes('food')) {
        features.push(emphasize('restaurants'));
      }
      if (
        purposes.includes('culture') ||
        purposes.includes('nightlife')
      ) {
        features.push(emphasize('festivals'));
      }
      if (purposes.includes('scenery')) {
        features.push(emphasize('sceneryList'));
      }
      if (features.length === 0) {
        features.push(emphasize('restaurants'), plain('festivals'));
      }
      return {
        title: {
          ko: '목적에 맞는 추천 기능',
          en: 'Features for your goals',
          ja: '目的に合った機能',
          zh: '契合您目的的功能',
        },
        subtitle: {
          ko: '선택하신 관심사에 맞춰 맛집·축제·명소를 추천해 드려요',
          en: 'We tailor restaurants, events, and sights to what you picked',
          ja: '選んだ関心に合わせて飲食店・イベント・名所をおすすめします',
          zh: '根据您选择的兴趣推荐餐厅、活动与景点',
        },
        features,
      };
    }
    case 'busanFamiliarity': {
      const novice = answers.busanFamiliarity === 'novice';
      return {
        title: {
          ko: '부산 숙련도에 맞는 기능',
          en: 'Features for your Busan know-how',
          ja: '釜山の知識に合った機能',
          zh: '匹配您对釜山了解程度的功能',
        },
        subtitle: {
          ko: novice
            ? '처음 방문이라면 GPS 기반 안내가 도움이 됩니다'
            : '잘 아신다면 여행기로 기록을 남겨 보세요',
          en: novice
            ? 'GPS guides help when Busan is new to you'
            : 'Use the travel journal when you already know the city',
          ja: novice
            ? '初めてならGPS案内が便利です'
            : '詳しい方は旅行記に記録を残せます',
          zh: novice ? '初次来访可用 GPS 导览' : '熟悉釜山可用旅行记记录',
        },
        features: novice
          ? [emphasize('gpsGuide'), plain('travelJournal')]
          : [plain('gpsGuide'), emphasize('travelJournal')],
      };
    }
  }
}

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

export const SCHEDULE_PACE_OPTIONS: Option<SchedulePace>[] = [
  {
    value: 'relaxed',
    label: {
      ko: '여유롭게',
      en: 'Relaxed pace',
      ja: 'ゆったり',
      zh: '宽松悠闲',
    },
  },
  {
    value: 'packed',
    label: {
      ko: '빡빡하게',
      en: 'Packed schedule',
      ja: 'ぎゅうぎゅう',
      zh: '紧凑满满',
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
    thankYouTitle: string;
    thankYouPrivacy: string;
    thankYouWait: string;
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
    thankYouTitle: '설문에 응하여 주셔서 감사합니다!',
    thankYouPrivacy:
      '응답 정보는 사용자에게 필요한 정보를 제공하는 데 이용됩니다.',
    thankYouWait: '잠시만 기다려 주세요…',
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
    thankYouTitle: 'Thank you for completing the survey!',
    thankYouPrivacy:
      'Your responses are used to provide information tailored to your needs.',
    thankYouWait: 'Just a moment…',
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
    thankYouTitle: 'アンケートへのご協力ありがとうございます！',
    thankYouPrivacy:
      'ご回答は、お客様に必要な情報を提供するために利用されます。',
    thankYouWait: '少々お待ちください…',
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
    thankYouTitle: '感谢您完成问卷！',
    thankYouPrivacy: '您的回答将用于向您提供所需的信息。',
    thankYouWait: '请稍候…',
  },
};
