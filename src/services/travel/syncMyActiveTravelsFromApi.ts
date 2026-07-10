import type { MyTravelResponse } from '../../types/travelApi';
import type { PlanMember, TravelPlan } from '../../types/travelPlan';
import { usePlanStore } from '../../stores/usePlanStore';
import { isServerBackedPlan } from '../../utils/plan/serverBackedPlan';
import { logTravelPlanApi } from '../../utils/travel/travelPlanApiLogger';
import { fetchMyActiveTravels } from './travelTeamService';
import { myTravelMemberRole, myTravelResponseToPlanShell } from './travelMapper';
import { trySyncTravelPlanFromApi } from './trySyncTravelPlanFromApi';

function findLocalPlanForTravel(plans: TravelPlan[], travelId: string): TravelPlan | undefined {
  return plans.find(plan => plan.apiTravelId === travelId || plan.planId === travelId);
}

function pickActiveTravelId(
  travels: MyTravelResponse[],
  currentActivePlanId: string | null,
): string | null {
  if (!travels.length) {
    return null;
  }

  const travelIds = new Set(travels.map(travel => travel.travelId));
  if (currentActivePlanId) {
    const activePlan = usePlanStore.getState().plans.find(p => p.planId === currentActivePlanId);
    const activeTravelId = activePlan?.apiTravelId ?? activePlan?.planId;
    if (activeTravelId && travelIds.has(activeTravelId)) {
      return activePlan?.planId ?? activeTravelId;
    }
  }

  const inProgress = travels.find(travel => travel.status === 'IN_PROGRESS');
  if (inProgress) {
    const local = findLocalPlanForTravel(usePlanStore.getState().plans, inProgress.travelId);
    return local?.planId ?? inProgress.travelId;
  }

  const planned = travels.find(travel => travel.status === 'PLANNED');
  if (planned) {
    const local = findLocalPlanForTravel(usePlanStore.getState().plans, planned.travelId);
    return local?.planId ?? planned.travelId;
  }

  const first = travels[0];
  const local = findLocalPlanForTravel(usePlanStore.getState().plans, first.travelId);
  return local?.planId ?? first.travelId;
}

function clearInvalidActivePlan(): void {
  const store = usePlanStore.getState();
  if (!store.activePlanId) {
    return;
  }
  const active = store.plans.find(plan => plan.planId === store.activePlanId);
  if (!active || !isServerBackedPlan(active) || active.status === 'COMPLETED') {
    store.clearActivePlan();
  }
}

/** 내 참여 여행(PLANNED·IN_PROGRESS) 목록을 서버에서 받아 로컬 플랜을 갱신합니다. */
export async function syncMyActiveTravelsFromApi(
  accessToken: string,
  member: PlanMember,
): Promise<TravelPlan | null> {
  const travels = await fetchMyActiveTravels(accessToken);
  const store = usePlanStore.getState();

  logTravelPlanApi('my-travels.filtered', 'PLANNED·IN_PROGRESS 여행 필터링 결과', {
    detail: {
      count: travels.length,
      statuses: travels.map(t => t.status),
    },
  });

  if (!travels.length) {
    clearInvalidActivePlan();
    return null;
  }

  clearInvalidActivePlan();

  const syncedPlans: TravelPlan[] = [];

  for (const travel of travels) {
    const existing = findLocalPlanForTravel(store.plans, travel.travelId);
    const memberForTravel: PlanMember = {
      userId: member.userId,
      nickname: member.nickname,
      role: myTravelMemberRole(travel.role),
    };
    const shell = myTravelResponseToPlanShell(travel, memberForTravel, existing);

    const { plan, usedOfflineFallback } = await trySyncTravelPlanFromApi(accessToken, shell);
    if (usedOfflineFallback) {
      const existingPlan = findLocalPlanForTravel(usePlanStore.getState().plans, travel.travelId);
      const offlinePlanId = existingPlan?.planId ?? plan.planId;
      usePlanStore.getState().setPlanOfflineSync(offlinePlanId, true);
      if (existingPlan) {
        syncedPlans.push(existingPlan);
        continue;
      }
    } else {
      usePlanStore.getState().setPlanOfflineSync(plan.planId, false);
    }
    usePlanStore.getState().upsertPlan(plan);
    syncedPlans.push(plan);
  }

  const activePlanId = pickActiveTravelId(travels, usePlanStore.getState().activePlanId);
  if (activePlanId) {
    usePlanStore.getState().setActivePlan(activePlanId);
  } else {
    usePlanStore.getState().clearActivePlan();
  }

  return syncedPlans.find(plan => plan.planId === activePlanId) ?? syncedPlans[0] ?? null;
}
