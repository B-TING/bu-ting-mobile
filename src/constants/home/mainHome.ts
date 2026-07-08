import type { AppLanguage } from '../../types/user';
import type { LucideIconName } from '../icons';
import { QUICK_ACCESS_ICONS } from '../icons';

export type QuickAccessItem = {
  id: string;
  icon: LucideIconName;
  labelKo: string;
  labelEn: string;
};

export type MockEvent = {
  id: string;
  tag: 'FESTIVAL' | 'EXHIBITION';
  titleKo: string;
  titleEn: string;
  titleJa: string;
  titleZh: string;
  locationKo: string;
  locationEn: string;
  locationJa: string;
  locationZh: string;
  dateKo: string;
  dateEn: string;
  dateJa: string;
  dateZh: string;
  imageColor: string;
  imageIcon: LucideIconName;
  imageUri?: string;
};

export type MockTravelogue = {
  titleKo: string;
  titleEn: string;
  subtitleKo: string;
  subtitleEn: string;
  thumbnailColor: string;
  thumbnailIcon: LucideIconName;
};

export type MockSpecialOffer = {
  titleKo: string;
  titleEn: string;
  subtitleKo: string;
  subtitleEn: string;
};

/** @deprecated Use useCopy('mainHome') from src/i18n */
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

/** @deprecated Use useCopy('homeEventZone') from src/i18n */
export const HOME_EVENT_ZONE_COPY: Record<
  AppLanguage,
  {
    sectionTitle: string;
    landmarksTitle: string;
    outsideBusanHint: string;
    mapA11y: string;
  }
> = {
  ko: {
    sectionTitle: '이벤트 존',
    landmarksTitle: '유명 관광지',
    outsideBusanHint: '부산 외 지역 · 구역 미리보기',
    mapA11y: '이벤트 존 지도 보기',
  },
  en: {
    sectionTitle: 'Event zone',
    landmarksTitle: 'Popular spots',
    outsideBusanHint: 'Outside Busan · zone preview',
    mapA11y: 'View event zone map',
  },
  ja: {
    sectionTitle: 'イベントゾーン',
    landmarksTitle: '人気スポット',
    outsideBusanHint: '釜山外 · エリアプレビュー',
    mapA11y: 'イベントゾーンマップを見る',
  },
  zh: {
    sectionTitle: '活动区域',
    landmarksTitle: '热门景点',
    outsideBusanHint: '釜山以外 · 区域预览',
    mapA11y: '查看活动区域地图',
  },
};

export const QUICK_ACCESS_ITEMS: QuickAccessItem[] = [
  {
    id: 'hotels',
    icon: QUICK_ACCESS_ICONS.hotels,
    labelKo: '숙소 정보',
    labelEn: 'Hotels',
  },

  {
    id: 'attractions',
    icon: QUICK_ACCESS_ICONS.attractions,
    labelKo: '관광지',
    labelEn: 'Attractions',
  },
  {
    id: 'festivals',
    icon: QUICK_ACCESS_ICONS.festivals,
    labelKo: '축제 캘린더',
    labelEn: 'Festivals',
  },
  {
    id: 'eventZone',
    icon: QUICK_ACCESS_ICONS.eventZone,
    labelKo: '이벤트 존',
    labelEn: 'Event Zone',
  },
  {
    id: 'luggage',
    icon: QUICK_ACCESS_ICONS.luggage,
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
    titleJa: '釜山国際ロックフェスティバル',
    titleZh: '釜山国际摇滚音乐节',
    locationKo: '사상 삼락',
    locationEn: 'Sasang Samnak',
    locationJa: '沙上三楽',
    locationZh: '沙上三乐',
    dateKo: '10.04 - 10.06',
    dateEn: 'Oct 4 - 6',
    dateJa: '10/4 - 10/6',
    dateZh: '10/4 - 10/6',
    imageColor: '#1e3a5f',
    imageIcon: 'sparkles',
  },
  {
    id: 'drone-show',
    tag: 'EXHIBITION',
    titleKo: '광안리 M 드론 라이트쇼',
    titleEn: 'Gwangalli M Drone Light Show',
    titleJa: '広安里Mドローンライトショー',
    titleZh: '广安里M无人机灯光秀',
    locationKo: '광안리 해수욕장',
    locationEn: 'Gwangalli Beach',
    locationJa: '広安里海水浴場',
    locationZh: '广安里海水浴场',
    dateKo: '매주 토요일',
    dateEn: 'Every Saturday',
    dateJa: '毎週土曜日',
    dateZh: '每周六',
    imageColor: '#0f766e',
    imageIcon: 'satellite',
  },
];

export const MOCK_TRAVELOGUE: MockTravelogue = {
  titleKo: '영도 바다뷰 투어 (여행기)',
  titleEn: 'Yeongdo Sea View Tour (Travelogue)',
  subtitleKo: '로컬들이 사랑하는 비밀 명소 5곳',
  subtitleEn: '5 secret spots locals love',
  thumbnailColor: '#7dd3fc',
  thumbnailIcon: 'waves',
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
