export type RootStackParamList = {
  LanguageSelection: undefined;
  Login: undefined;
  Onboarding: undefined;
  MainHome: undefined;
  PlanWizard: undefined;
  PlanCandidates: undefined;
  /** planId 생략 시 진행 중(active) 플랜 사용 */
  PlanDetail: { planId?: string } | undefined;
};

export type SetupPhase = 'language' | 'login' | 'onboarding' | 'main';
