import type { TravelPlan } from '../../types/travelPlan';
import { mergeApiTravelPlanWithLocal } from './travelMapper';
import { fetchTravelPlans } from './travelService';

/** 서버 Travel API 응답을 기준으로 로컬 플랜 일정을 덮어씁니다. */
export async function syncTravelPlanFromApi(
  accessToken: string,
  localPlan: TravelPlan,
): Promise<TravelPlan> {
  const travelId = localPlan.apiTravelId ?? localPlan.planId;
  const response = await fetchTravelPlans(accessToken, travelId);
  return mergeApiTravelPlanWithLocal(localPlan, response);
}
