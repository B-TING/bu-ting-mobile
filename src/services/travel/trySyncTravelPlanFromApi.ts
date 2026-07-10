import type { TravelPlan } from '../../types/travelPlan';
import { logTravelPlanApi } from '../../utils/travel/travelPlanApiLogger';
import { syncTravelPlanFromApi } from './syncTravelPlanFromApi';

export type TravelPlanSyncResult = {
  plan: TravelPlan;
  usedOfflineFallback: boolean;
};

/** GET 동기화 실패 시 로컬 캐시를 유지하고 오프라인 fallback 여부를 반환합니다. */
export async function trySyncTravelPlanFromApi(
  accessToken: string,
  localPlan: TravelPlan,
): Promise<TravelPlanSyncResult> {
  const travelId = localPlan.apiTravelId ?? localPlan.planId;

  try {
    const plan = await syncTravelPlanFromApi(accessToken, localPlan);
    return { plan, usedOfflineFallback: false };
  } catch (error) {
    logTravelPlanApi('sync.fallback', 'GET 동기화 실패 — 오프라인 캐시 사용', {
      level: 'warn',
      detail: error,
      travelId,
    });
    return { plan: localPlan, usedOfflineFallback: true };
  }
}
