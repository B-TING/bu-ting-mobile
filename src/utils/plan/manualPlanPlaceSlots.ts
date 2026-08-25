import type { WizardPickedPlace } from '../../types/planWizard';
import type { RouteItemType } from '../../types/travelPlan';

export type ManualDayPlaceSlot = {
  place: WizardPickedPlace;
  type: Extract<RouteItemType, 'ATTRACTION' | 'ACCOMMODATION'>;
};

type ManualPlaceSlotInput = {
  selectedAttractions: WizardPickedPlace[];
  bookedAccommodation: WizardPickedPlace | null;
  accommodationMode: 'booked' | 'area_only';
};

/**
 * 직접 일정 만들기 일차 배정.
 * 1일차: 예약 숙소(있으면) + 선택한 관광지 전부.
 * 2일차 이후: 예약 숙소만.
 */
export function buildManualPlanPlaceSlots(
  answers: ManualPlaceSlotInput,
  dayCount: number,
): ManualDayPlaceSlot[][] {
  const count = Math.max(0, dayCount);
  const stay =
    answers.accommodationMode === 'booked' && answers.bookedAccommodation
      ? {
          place: answers.bookedAccommodation,
          type: 'ACCOMMODATION' as const,
        }
      : null;
  const stayId = stay?.place.placeId;
  const attractions = answers.selectedAttractions
    .filter(place => place.placeId !== stayId)
    .map(place => ({ place, type: 'ATTRACTION' as const }));

  return Array.from({ length: count }, (_, index) => {
    if (index === 0) {
      return stay ? [stay, ...attractions] : attractions;
    }
    return stay ? [stay] : [];
  });
}
