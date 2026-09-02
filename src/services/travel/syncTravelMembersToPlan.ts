import { fetchTravelMembers } from './travelTeamService';
import { travelMembersToPlanMembers } from './travelMapper';
import { isPlanForCurrentApiServer } from '../../utils/api/apiServerOrigin';
import { logTravelPlanApi } from '../../utils/travel/travelPlanApiLogger';
import { usePlanStore } from '../../stores/usePlanStore';
import type { PlanMember } from '../../types/travelPlan';

/**
 * 서버 멤버 목록을 로컬 플랜에 반영합니다.
 * @returns 반영된 멤버 목록 (실패·스킵 시 null)
 */
export async function syncTravelMembersToPlan(
  accessToken: string,
  travelId: string,
  planId?: string | null,
): Promise<PlanMember[] | null> {
  try {
    const members = await fetchTravelMembers(accessToken, travelId);
    const planMembers = travelMembersToPlanMembers(members);
    const store = usePlanStore.getState();
    const plan =
      (planId
        ? store.plans.find(p => p.planId === planId)
        : undefined) ??
      store.plans.find(
        p => p.apiTravelId === travelId || p.planId === travelId,
      );

    if (!plan || !isPlanForCurrentApiServer(plan)) {
      return planMembers;
    }

    store.upsertPlan({
      ...plan,
      members: planMembers,
    });
    return planMembers;
  } catch (error) {
    logTravelPlanApi('members.sync.error', '여행 멤버 동기화 실패', {
      level: 'warn',
      detail: error,
    });
    return null;
  }
}
