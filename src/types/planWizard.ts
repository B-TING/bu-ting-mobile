import type { AppLanguage } from './user';

export type CompanionGroupType =
  | 'family'
  | 'couple'
  | 'friends'
  | 'solo'
  | 'coworkers';

export type AccommodationMode = 'booked' | 'area_only';

export type PlanGenerationMode = 'auto' | 'candidates' | 'manual';

/** 위저드에서 검색 API로 고른 장소 */
export type WizardPickedPlace = {
  placeId: string;
  placeName: string;
  location: { lat: number; lng: number };
  address?: string;
  imageUrl?: string;
};

export type PlanWizardAnswers = {
  startDate: string;
  endDate: string;
  companionCount: number;
  companionTypes: CompanionGroupType[];
  travelStyleIds: string[];
  hasHeavyBaggage: boolean;
  hasPets: boolean;
  otherConstraintIds: string[];
  attractionIds: string[];
  selectedAttractions: WizardPickedPlace[];
  foodIds: string[];
  accommodationMode: AccommodationMode;
  /** booked: 숙소명 검색 선택 */
  accommodationPlaceId: string | null;
  accommodationName: string | null;
  bookedAccommodation: WizardPickedPlace | null;
  /** area_only: 후보 지역 */
  accommodationAreaIds: string[];
  generationMode: PlanGenerationMode;
};

export type PlanWizardStepId =
  | 'dates'
  | 'companions'
  | 'companionType'
  | 'travelStyle'
  | 'constraints'
  | 'attractions'
  | 'foods'
  | 'accommodation'
  | 'generationMode';

export type LocalizedLabel = Record<AppLanguage, string>;
