import type { RootStackParamList } from '../navigation/types';

export type AppMenuTarget =
  | { kind: 'screen'; route: keyof RootStackParamList }
  | { kind: 'placeholder'; titleKo: string; titleEn: string };

export type AppMenuItem = {
  id: string;
  labelKo: string;
  labelEn: string;
  target: AppMenuTarget;
};

export const APP_MENU_ITEMS: AppMenuItem[] = [
  {
    id: 'home',
    labelKo: '홈',
    labelEn: 'Home',
    target: { kind: 'screen', route: 'MainHome' },
  },
  {
    id: 'plan',
    labelKo: '내 여행 일정',
    labelEn: 'My itinerary',
    target: { kind: 'screen', route: 'PlanDetail' },
  },
  {
    id: 'luggage',
    labelKo: '짐 보관소',
    labelEn: 'Luggage storage',
    target: { kind: 'placeholder', titleKo: '짐 보관소', titleEn: 'Luggage storage' },
  },
  {
    id: 'community',
    labelKo: '커뮤니티',
    labelEn: 'Community',
    target: { kind: 'placeholder', titleKo: '커뮤니티', titleEn: 'Community' },
  },
  {
    id: 'calendar',
    labelKo: '캘린더',
    labelEn: 'Calendar',
    target: { kind: 'placeholder', titleKo: '캘린더', titleEn: 'Calendar' },
  },
  {
    id: 'emergency',
    labelKo: '비상연락',
    labelEn: 'Emergency',
    target: { kind: 'placeholder', titleKo: '비상연락', titleEn: 'Emergency contacts' },
  },
  {
    id: 'feed',
    labelKo: '피드',
    labelEn: 'Feed',
    target: { kind: 'placeholder', titleKo: '피드', titleEn: 'Feed' },
  },
  {
    id: 'my',
    labelKo: '마이페이지',
    labelEn: 'My page',
    target: { kind: 'placeholder', titleKo: '마이페이지', titleEn: 'My page' },
  },
];
