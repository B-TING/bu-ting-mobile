export type RootStackParamList = {
  LanguageSelection: undefined;
  Login: undefined;
  Onboarding: { mode?: 'setup' | 'edit' | 'account' } | undefined;
  MainHome: undefined;
  MyPage: undefined;
  PlanWizard: undefined;
  PlanCandidates: undefined;
  /** planId 생략 시 진행 중(active) 플랜 사용 */
  PlanDetail: { planId?: string; openReboot?: boolean; tab?: 'overview' | 'schedule' | 'budget' | 'records' } | undefined;
  MenuPlaceholder: { title: string };
  TravelogueFeed: undefined;
  TravelogueDetail: { travelogueId: string };
  FestivalCalendar: { initialDate?: string } | undefined;
  FestivalDetail: { festivalId: string };
  LuggageStorage: undefined;
  BusanAccommodation: undefined;
  BusanAttraction: undefined;
  HelpDeskChat: undefined;
};

export type SetupPhase = 'language' | 'login' | 'onboarding' | 'main';
