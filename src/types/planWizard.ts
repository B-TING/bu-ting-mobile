import type { AppLanguage } from './user';

export type CompanionGroupType =
  | 'family'
  | 'couple'
  | 'friends'
  | 'solo'
  | 'coworkers';

export type AccommodationMode = 'booked' | 'area_only';

export type PlanGenerationMode = 'auto' | 'candidates';

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
  foodIds: string[];
  accommodationMode: AccommodationMode;
  /** booked: 숙소명 검색 선택 */
  accommodationPlaceId: string | null;
  accommodationName: string | null;
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
