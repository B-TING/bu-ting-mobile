export type TravelSurveyProfileRequest = {
  preferredLanguage?: string;
  isPlanned?: boolean | null;
  isRelaxed?: boolean | null;
  isSolo?: boolean | null;
  isLight?: boolean | null;
  isFamiliar?: boolean | null;
  purposes?: string[];
  skippedSteps?: number[];
  skippedAll?: boolean;
};

export type TravelSurveyProfileResponse = TravelSurveyProfileRequest & {
  completedAt?: string | null;
  aiPromptContext?: string | null;
};
