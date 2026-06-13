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
  PlanMember,
  BudgetEntry,
  PlaceInfo,
  TravelLeg,
} from './travelPlan';
export { toTravelPlanResponse } from './travelPlan';
export type {
  PlaceReview,
  ReviewMedia,
  ReviewMediaType,
  Travelogue,
  TravelogueDaySnapshot,
  TravelogueRouteSnapshot,
} from './travelReview';
