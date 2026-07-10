import { todayIso } from '../../constants/festival/festivalCalendar';
import type { TravelStatusDto } from '../../types/travelApi';
import type { TravelPlan } from '../../types/travelPlan';

export function resolvePlanTravelStatus(plan: TravelPlan): TravelStatusDto {
  if (plan.travelStatus) {
    return plan.travelStatus;
  }
  if (plan.status === 'COMPLETED') {
    return 'COMPLETED';
  }

  const today = todayIso();
  if (today < plan.startDate) {
    return 'PLANNED';
  }
  if (today > plan.endDate) {
    return 'COMPLETED';
  }
  return 'IN_PROGRESS';
}
