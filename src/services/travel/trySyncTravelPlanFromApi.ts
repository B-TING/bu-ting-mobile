import type { TravelPlan } from '../../types/travelPlan';
import { logTravelPlanApi } from '../../utils/travel/travelPlanApiLogger';
import { shouldLockScheduleOnTravelApiError } from '../../utils/travel/scheduleApiLock';
import { syncTravelPlanFromApi } from './syncTravelPlanFromApi';

export type TravelPlanSyncResult = {
  plan: TravelPlan;
  scheduleLocked: boolean;
};

/** GET 동기화 실패 시 로컬 캐시를 유지하고, 잠금 필요 여부를 반환합니다. */
export async function trySyncTravelPlanFromApi(
  accessToken: string,
  localPlan: TravelPlan,
): Promise<TravelPlanSyncResult> {
  const travelId = localPlan.apiTravelId ?? localPlan.planId;

  try {
    const plan = await syncTravelPlanFromApi(accessToken, localPlan);
    return { plan, scheduleLocked: false };
  } catch (error) {
    const scheduleLocked = shouldLockScheduleOnTravelApiError(error);
    logTravelPlanApi('sync.fallback', 'GET 동기화 실패 — 로컬 캐시 사용', {
      level: 'warn',
      detail: error,
      travelId,
    });
    return { plan: localPlan, scheduleLocked };
  }
}
