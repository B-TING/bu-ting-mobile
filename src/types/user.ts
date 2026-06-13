export type AppLanguage = 'ko' | 'en' | 'ja' | 'zh';

export type TravelStyle = 'planned' | 'spontaneous';

/** 일정을 빡빡하게 vs 여유롭게 짜는 편 */
export type SchedulePace = 'relaxed' | 'packed';

export type CompanionType = 'solo' | 'group';

export type LuggageLevel = 'light' | 'heavy';

export type VisitPurpose =
  | 'food'
  | 'scenery'
  | 'culture'
  | 'shopping'
  | 'nightlife'
  | 'relaxation';

export type BusanFamiliarity = 'novice' | 'familiar';

export type OnboardingAnswers = {
  travelStyle: TravelStyle | null;
  schedulePace: SchedulePace | null;
  companions: CompanionType | null;
  luggage: LuggageLevel | null;
  purposes: VisitPurpose[];
  busanFamiliarity: BusanFamiliarity | null;
  skippedSteps: number[];
  skippedAll: boolean;
};

export type OnboardingProfile = OnboardingAnswers & {
  completedAt: string;
  language: AppLanguage;
  /** AI 에이전트 프롬프트에 주입할 유저 컨텍스트 */
  aiPromptContext: string;
};

export type AuthState = {
  isLoggedIn: boolean;
  userId: string | null;
  displayName: string | null;
};
