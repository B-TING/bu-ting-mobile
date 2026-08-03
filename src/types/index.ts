export type Place = {
  id: string;
  name: string;
  description: string;
  latitude: number;
  longitude: number;
};

export type {
  ApiEnvelope,
  AuthUser,
  OAuthLoginRequest,
  OAuthLoginResponse,
  OAuthProvider,
} from './auth';
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
  TravelRecord,
  TravelRecordComment,
  TravelRecordDay,
  TravelRecordPlace,
  TravelRecordSocial,
  TravelRecordStatus,
} from './travelReview';
export type {
  TravelRecordCreateRequest,
  TravelRecordFeedPageResponse,
  TravelRecordFeedResponse,
  TravelRecordManageResponse,
  TravelRecordResponse,
  TravelRecordUpdateRequest,
} from './travelRecordApi';
export {
  mapTravelRecordFeedItem,
  mapTravelRecordManageItem,
  mapTravelRecordResponse,
} from './travelRecordApi';
export type {
  PlaceDetailVO,
  PlaceListItemVO,
  PlaceReviewVO,
  PlaceKind,
  AccommodationPlaceDetail,
  AttractionPlaceDetail,
} from './googlePlaces';
