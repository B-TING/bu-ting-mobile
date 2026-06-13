import type { AppLanguage } from '../types/user';

export type QuickAccessItem = {
  id: string;
  icon: string;
  labelKo: string;
  labelEn: string;
};

export type MockEvent = {
  id: string;
  tag: 'FESTIVAL' | 'EXHIBITION';
  titleKo: string;
  titleEn: string;
  locationKo: string;
  locationEn: string;
  dateKo: string;
  dateEn: string;
  imageColor: string;
  imageEmoji: string;
};

export type MockTravelogue = {
  titleKo: string;
  titleEn: string;
  subtitleKo: string;
  subtitleEn: string;
  thumbnailColor: string;
  thumbnailEmoji: string;
};

export type MockSpecialOffer = {
  titleKo: string;
  titleEn: string;
  subtitleKo: string;
  subtitleEn: string;
};

export const MAIN_HOME_COPY: Record<
  AppLanguage,
  {
    heroTitle: string;
    heroSubtitle: string;
    heroCta: string;
    ongoingLabel: string;
    nextStop: string;
    viewItinerary: string;
    dday: (n: number) => string;
    ddayToday: string;
    dayLabel: (n: number) => string;
    eventsTitle: string;
    eventsViewAll: string;
    trendingTitle: string;
  }
> = {
  ko: {
    heroTitle: '새로운 부산 여행을 BU-TING 하세요!',
    heroSubtitle: 'AI가 당신의 취향에 맞는 일정을 만들어 드립니다.',
    heroCta: 'AI 플래너 시작',
    ongoingLabel: '진행 중인 여행',
    nextStop: '다음 일정',
    viewItinerary: '일정 보기',
    dday: n => `D-${n}`,
    ddayToday: '오늘 출발',
    dayLabel: n => `${n}일차`,
    eventsTitle: '놓치면 안 될 이벤트',
    eventsViewAll: '전체 >',
    trendingTitle: '지금 뜨는 여행 & 투어',
  },
  en: {
    heroTitle: 'Start your new Busan trip with BU-TING!',
    heroSubtitle: 'AI builds an itinerary tailored to your taste.',
    heroCta: 'Start AI Planner',
    ongoingLabel: 'Trip in progress',
    nextStop: 'Up next',
    viewItinerary: 'View itinerary',
    dday: n => `D-${n}`,
    ddayToday: 'Starts today',
    dayLabel: n => `Day ${n}`,
    eventsTitle: 'Events you should not miss',
    eventsViewAll: 'See all >',
    trendingTitle: 'Trending travel & tours',
  },
  ja: {
    heroTitle: '新しい釜山旅行をBU-TINGしよう！',
    heroSubtitle: 'AIがあなた好みの行程を作ります。',
    heroCta: 'AIプランナー開始',
    ongoingLabel: '進行中の旅行',
    nextStop: '次の予定',
    viewItinerary: '行程を見る',
    dday: n => `D-${n}`,
    ddayToday: '本日出発',
    dayLabel: n => `${n}日目`,
    eventsTitle: '見逃せないイベント',
    eventsViewAll: 'すべて >',
    trendingTitle: '今話題の旅行＆ツアー',
  },
  zh: {
    heroTitle: '用 BU-TING 开启全新釜山之旅！',
    heroSubtitle: 'AI 为您定制符合喜好的行程。',
    heroCta: '开始 AI 规划',
    ongoingLabel: '进行中的旅行',
    nextStop: '下一行程',
    viewItinerary: '查看行程',
    dday: n => `D-${n}`,
    ddayToday: '今天出发',
    dayLabel: n => `第${n}天`,
    eventsTitle: '不容错过的事件',
    eventsViewAll: '全部 >',
    trendingTitle: '热门旅行与游览',
  },
};

export const QUICK_ACCESS_ITEMS: QuickAccessItem[] = [
  {
    id: 'hotels',
    icon: '🏨',
    labelKo: '숙소 정보',
    labelEn: 'Hotels',
  },

  {
    id: 'festivals',
    icon: '📅',
    labelKo: '축제 캘린더',
    labelEn: 'Festivals',
  },
  {
    id: 'help',
    icon: '✱',
    labelKo: '헬프데스크',
    labelEn: 'Help Desk',
  },
  {
    id: 'funCorner',
    icon: '🎉',
    labelKo: '재미 코너',
    labelEn: 'Fun Corner',
  },
  {
    id: 'luggage',
    icon: '🧳',
    labelKo: '짐 보관소',
    labelEn: 'Luggage',
  },
];

/** 축제 API 연동 전 목업 */
export const MOCK_EVENTS: MockEvent[] = [
  {
    id: 'rock-festival',
    tag: 'FESTIVAL',
    titleKo: '부산 국제 록 페스티벌',
    titleEn: 'Busan International Rock Festival',
    locationKo: '사상 삼락',
    locationEn: 'Sasang Samnak',
    dateKo: '10.04 - 10.06',
    dateEn: 'Oct 4 - 6',
    imageColor: '#1e3a5f',
    imageEmoji: '🎆',
  },
  {
    id: 'drone-show',
    tag: 'EXHIBITION',
    titleKo: '광안리 M 드론 라이트쇼',
    titleEn: 'Gwangalli M Drone Light Show',
    locationKo: '광안리 해수욕장',
    locationEn: 'Gwangalli Beach',
    dateKo: '매주 토요일',
    dateEn: 'Every Saturday',
    imageColor: '#0f766e',
    imageEmoji: '🛸',
  },
];

export const MOCK_TRAVELOGUE: MockTravelogue = {
  titleKo: '영도 바다뷰 투어 (여행기)',
  titleEn: 'Yeongdo Sea View Tour (Travelogue)',
  subtitleKo: '로컬들이 사랑하는 비밀 명소 5곳',
  subtitleEn: '5 secret spots locals love',
  thumbnailColor: '#7dd3fc',
  thumbnailEmoji: '🏖️',
};

export const MOCK_SPECIAL_OFFER: MockSpecialOffer = {
  titleKo: '부산 투어 패스 20% 할인',
  titleEn: 'Busan Tour Pass 20% off',
  subtitleKo: '가장 실속있게 부산 즐기기',
  subtitleEn: 'Enjoy Busan with the best value',
};

export function calcTripDday(startDate: string): number {
  const start = new Date(startDate);
  const today = new Date();
  start.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  return Math.round((start.getTime() - today.getTime()) / 86400000);
}
