import type { TravelPlan } from '../../types/travelPlan';

/** 백엔드 Travel API와 연동된 플랜인지 여부 */
export function isServerBackedPlan(plan: TravelPlan): boolean {
  return plan.source === 'api' || Boolean(plan.apiTravelId);
}
