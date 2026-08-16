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

/** @deprecated Use useCopy('mainHome') from src/i18n */
export const MAIN_HOME_COPY: Record<
  AppLanguage,
  {
    heroTitle: string;
    heroSubtitle: string;
    heroCta: string;
    plannedLabel: string;
    inProgressLabel: string;
    completedLabel: string;
    nextStop: string;
    viewItinerary: string;
    viewCompletedItinerary: string;
    completedTripHint: string;
    dday: (n: number) => string;
    ddayToday: string;
    dayLabel: (n: number) => string;
    eventsTitle: string;
    eventsViewAll: string;
    trendingTitle: string;
    switchPlanCount: (n: number) => string;
    switchPlanA11y: string;
    pickPlanTitle: string;
    pickPlanSubtitle: string;
    pickPlanClose: string;
    pickPlanSelected: string;
  }
> = {
  ko: {
    heroTitle: '새로운 부산 여행을 BU-TING 하세요!',
    heroSubtitle: 'AI가 당신의 취향에 맞는 일정을 만들어 드립니다.',
    heroCta: 'AI 플래너 시작',
    plannedLabel: '예정된 여행',
    inProgressLabel: '진행 중인 여행',
    completedLabel: '완료된 여행',
    nextStop: '다음 일정',
    viewItinerary: '일정 보기',
    viewCompletedItinerary: '완료 일정 보기',
    completedTripHint: '여행을 마쳤어요',
    dday: n => `D-${n}`,
    ddayToday: '오늘 출발',
    dayLabel: n => `${n}일차`,
    eventsTitle: '이 달의 부산 축제',
    eventsViewAll: '전체 >',
    trendingTitle: '지금 뜨는 여행 & 투어',
    switchPlanCount: n => `일정 ${n}개`,
    switchPlanA11y: '다른 여행 일정 선택',
    pickPlanTitle: '여행 일정 선택',
    pickPlanSubtitle: '홈과 일정 탭에 보여줄 여행을 골라 주세요',
    pickPlanClose: '닫기',
    pickPlanSelected: '선택됨',
  },
  en: {
    heroTitle: 'Start your new Busan trip with BU-TING!',
    heroSubtitle: 'AI builds an itinerary tailored to your taste.',
    heroCta: 'Start AI Planner',
    plannedLabel: 'Upcoming trip',
    inProgressLabel: 'Trip in progress',
    completedLabel: 'Completed trip',
    nextStop: 'Up next',
    viewItinerary: 'View itinerary',
    viewCompletedItinerary: 'View completed trip',
    completedTripHint: 'You finished this trip',
    dday: n => `D-${n}`,
    ddayToday: 'Starts today',
    dayLabel: n => `Day ${n}`,
    eventsTitle: 'Busan festivals this month',
    eventsViewAll: 'See all >',
    trendingTitle: 'Trending travel & tours',
    switchPlanCount: n => `${n} trips`,
    switchPlanA11y: 'Choose another itinerary',
    pickPlanTitle: 'Choose a trip',
    pickPlanSubtitle: 'Pick which trip to show on Home and Route',
    pickPlanClose: 'Close',
    pickPlanSelected: 'Selected',
  },
  ja: {
    heroTitle: '新しい釜山旅行をBU-TINGしよう！',
    heroSubtitle: 'AIがあなた好みの行程を作ります。',
    heroCta: 'AIプランナー開始',
    plannedLabel: '予定の旅行',
    inProgressLabel: '進行中の旅行',
    completedLabel: '完了した旅行',
    nextStop: '次の予定',
    viewItinerary: '行程を見る',
    viewCompletedItinerary: '完了した行程を見る',
    completedTripHint: '旅行が終了しました',
    dday: n => `D-${n}`,
    ddayToday: '本日出発',
    dayLabel: n => `${n}日目`,
    eventsTitle: '今月の釜山フェスティバル',
    eventsViewAll: 'すべて >',
    trendingTitle: '今話題の旅行＆ツアー',
    switchPlanCount: n => `旅程${n}件`,
    switchPlanA11y: '別の旅程を選ぶ',
    pickPlanTitle: '旅程を選択',
    pickPlanSubtitle: 'ホームと行程タブに表示する旅行を選んでください',
    pickPlanClose: '閉じる',
    pickPlanSelected: '選択中',
  },
  zh: {
    heroTitle: '用 BU-TING 开启全新釜山之旅！',
    heroSubtitle: 'AI 为您定制符合喜好的行程。',
    heroCta: '开始 AI 规划',
    plannedLabel: '计划中的旅行',
    inProgressLabel: '进行中的旅行',
    completedLabel: '已完成的旅行',
    nextStop: '下一行程',
    viewItinerary: '查看行程',
    viewCompletedItinerary: '查看已完成行程',
    completedTripHint: '旅行已结束',
    dday: n => `D-${n}`,
    ddayToday: '今天出发',
    dayLabel: n => `第${n}天`,
    eventsTitle: '本月釜山节日',
    eventsViewAll: '全部 >',
    trendingTitle: '热门旅行与游览',
    switchPlanCount: n => `${n}个行程`,
    switchPlanA11y: '选择其他行程',
    pickPlanTitle: '选择行程',
    pickPlanSubtitle: '选择要在首页和行程页显示的旅行',
    pickPlanClose: '关闭',
    pickPlanSelected: '已选择',
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
    id: 'restaurants',
    icon: QUICK_ACCESS_ICONS.restaurants,
    labelKo: '식당',
    labelEn: 'Restaurants',
  },
  {
    id: 'luggage',
    icon: QUICK_ACCESS_ICONS.luggage,
    labelKo: '짐 보관소',
    labelEn: 'Luggage',
  },
];

export function calcTripDday(startDate: string): number {
  const start = new Date(startDate);
  const today = new Date();
  start.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  return Math.round((start.getTime() - today.getTime()) / 86400000);
}
