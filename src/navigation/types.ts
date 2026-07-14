import type { NavbarTab } from '../components/shared/navigation/Navbar';
import type { PlaceContentTypeId } from '../types/placesApi';

export type RootStackParamList = {
  LanguageSelection: undefined;
  Login: undefined;
  Onboarding: { mode?: 'setup' | 'edit' | 'account' } | undefined;
  MainTabs: { tab?: NavbarTab } | undefined;
  PlanWizard: undefined;
  PlanCandidates: undefined;
  /** planId 생략 시 진행 중(active) 플랜 사용 */
  PlanDetail: { planId?: string; openReboot?: boolean; tab?: 'overview' | 'schedule' | 'budget' | 'records' } | undefined;
  MenuPlaceholder: { title: string };
  TravelogueDetail: { travelogueId: string };
  FestivalCalendar: { initialDate?: string } | undefined;
  /** @deprecated PlaceMapSearch 사용 */
  FestivalDetail: { festivalId: string };
  LuggageStorage: undefined;
  PlaceMapSearch: {
    contentTypeId?: PlaceContentTypeId;
    selectedContentId?: string;
    festivalEventStartDate?: string;
    festivalEventEndDate?: string;
  } | undefined;
  HelpDeskChat: undefined;
  EventZone: undefined;
  EventZoneChat: { roomId: string };
};

export type SetupPhase = 'language' | 'login' | 'onboarding' | 'main';
