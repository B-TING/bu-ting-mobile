import type { RootStackParamList } from '../../navigation/types';
import { PLACE_CONTENT_TYPE } from '../../types/placesApi';

export type AppMenuTarget =
  | {
      kind: 'screen';
      route: keyof RootStackParamList;
      params?: RootStackParamList[keyof RootStackParamList];
    }
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
    target: { kind: 'screen', route: 'MainTabs', params: { tab: 'home' } },
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
    target: { kind: 'screen', route: 'LuggageStorage' },
  },
  {
    id: 'accommodation',
    labelKo: '부산 숙소',
    labelEn: 'Busan stays',
    target: {
      kind: 'screen',
      route: 'PlaceMapSearch',
      params: { contentTypeId: PLACE_CONTENT_TYPE.accommodation },
    },
  },
  {
    id: 'attraction',
    labelKo: '부산 관광지',
    labelEn: 'Busan attractions',
    target: {
      kind: 'screen',
      route: 'PlaceMapSearch',
      params: { contentTypeId: PLACE_CONTENT_TYPE.attraction },
    },
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
    target: { kind: 'screen', route: 'FestivalCalendar' },
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
    target: { kind: 'screen', route: 'MainTabs', params: { tab: 'my' } },
  },
];
