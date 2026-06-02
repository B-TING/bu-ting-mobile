export type Place = {
  id: string;
  name: string;
  description: string;
  latitude: number;
  longitude: number;
};

export type {
  AppLanguage,
  AuthState,
  OnboardingProfile,
} from './user';
export type {
  PlanWizardAnswers,
  PlanGenerationMode,
  CompanionGroupType,
} from './planWizard';
export type {
  TravelPlan,
  TravelPlanResponse,
  PlanStatus,
  RouteItem,
  DailyItinerary,
} from './travelPlan';
export { toTravelPlanResponse } from './travelPlan';
