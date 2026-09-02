import type { LucideIconName } from '../icons';
import type { RootStackParamList } from '../../navigation/types';

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
  icon: LucideIconName;
  /** 긴급 연락처 등 강조 항목 */
  danger?: boolean;
  target: AppMenuTarget;
};

export const APP_MENU_ITEMS: AppMenuItem[] = [
  {
    id: 'home',
    labelKo: '홈',
    labelEn: 'Home',
    icon: 'home',
    target: { kind: 'screen', route: 'MainTabs', params: { tab: 'home' } },
  },
  {
    id: 'plan',
    labelKo: '일정 플래너',
    labelEn: 'Itinerary planner',
    icon: 'map',
    target: { kind: 'screen', route: 'MainTabs', params: { tab: 'route' } },
  },
  {
    id: 'newPlan',
    labelKo: '새 여행 만들기',
    labelEn: 'Create a new trip',
    icon: 'plus',
    target: { kind: 'screen', route: 'PlanWizard' },
  },
  {
    id: 'inviteScan',
    labelKo: '초대 QR 스캔',
    labelEn: 'Scan invite QR',
    icon: 'camera',
    target: { kind: 'screen', route: 'TravelInviteScan' },
  },
  {
    id: 'places',
    labelKo: '장소 탐색',
    labelEn: 'Explore places',
    icon: 'mapPin',
    target: { kind: 'screen', route: 'PlaceMapSearch' },
  },
  {
    id: 'calendar',
    labelKo: '축제 캘린더',
    labelEn: 'Festival calendar',
    icon: 'calendar',
    target: { kind: 'screen', route: 'FestivalCalendar' },
  },
  {
    id: 'eventZone',
    labelKo: '이벤트 존',
    labelEn: 'Event Zone',
    icon: 'messageCircle',
    target: { kind: 'screen', route: 'EventZone' },
  },
  {
    id: 'luggage',
    labelKo: '짐 보관소',
    labelEn: 'Luggage storage',
    icon: 'package',
    target: { kind: 'screen', route: 'LuggageStorage' },
  },
  {
    id: 'feed',
    labelKo: '여행 피드',
    labelEn: 'Travel feed',
    icon: 'bookOpen',
    target: { kind: 'screen', route: 'MainTabs', params: { tab: 'feed' } },
  },
  {
    id: 'ai',
    labelKo: 'AI 헬프데스크',
    labelEn: 'AI helpdesk',
    icon: 'sparkles',
    target: { kind: 'screen', route: 'HelpDeskChat' },
  },
  {
    id: 'my',
    labelKo: '마이페이지',
    labelEn: 'My page',
    icon: 'user',
    target: { kind: 'screen', route: 'MainTabs', params: { tab: 'my' } },
  },
];
