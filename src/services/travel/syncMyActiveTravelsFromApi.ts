import type { MyTravelResponse } from '../../types/travelApi';
import type { PlanMember, TravelPlan } from '../../types/travelPlan';
import { usePlanStore } from '../../stores/usePlanStore';
import {
  filterPlansForCurrentApiServer,
  isPlanForCurrentApiServer,
} from '../../utils/api/apiServerOrigin';
import { isServerBackedPlan } from '../../utils/plan/serverBackedPlan';
import { logTravelPlanApi } from '../../utils/travel/travelPlanApiLogger';
import { fetchMyActiveTravels } from './travelTeamService';
import { myTravelMemberRole, myTravelResponseToPlanShell } from './travelMapper';
import { trySyncTravelPlanFromApi } from './trySyncTravelPlanFromApi';

function findLocalPlanForTravel(plans: TravelPlan[], travelId: string): TravelPlan | undefined {
  return filterPlansForCurrentApiServer(plans).find(
    plan => plan.apiTravelId === travelId || plan.planId === travelId,
  );
}

function pickActiveTravelId(
  travels: MyTravelResponse[],
  currentActivePlanId: string | null,
): string | null {
  if (!travels.length) {
    return null;
  }

  const travelIds = new Set(travels.map(travel => travel.travelId));
  const plans = usePlanStore.getState().plans;

  const inProgress = travels.find(travel => travel.status === 'IN_PROGRESS');
  if (inProgress) {
    const local = findLocalPlanForTravel(plans, inProgress.travelId);
    return local?.planId ?? inProgress.travelId;
  }

  const planned = travels.find(travel => travel.status === 'PLANNED');
  if (planned) {
    const local = findLocalPlanForTravel(plans, planned.travelId);
    return local?.planId ?? planned.travelId;
  }

  // 활성(예정·진행)이 없으면 COMPLETED 포함해 현재 선택·첫 항목 유지 (조회용)
  if (currentActivePlanId) {
    const activePlan = filterPlansForCurrentApiServer(plans).find(
      p => p.planId === currentActivePlanId,
    );
    const activeTravelId = activePlan?.apiTravelId ?? activePlan?.planId;
    if (activePlan && activeTravelId && travelIds.has(activeTravelId)) {
      return activePlan.planId;
    }
  }

  const first = travels[0];
  const local = findLocalPlanForTravel(plans, first.travelId);
  return local?.planId ?? first.travelId;
}

function clearInvalidActivePlan(): void {
  const store = usePlanStore.getState();
  if (!store.activePlanId) {
    return;
  }
  const active = store.plans.find(plan => plan.planId === store.activePlanId);
  if (!active || !isServerBackedPlan(active) || !isPlanForCurrentApiServer(active)) {
    store.clearActivePlan();
  }
}

/** 내 여행(PLANNED·IN_PROGRESS·COMPLETED) 목록을 서버에서 받아 로컬 플랜을 갱신합니다. */
export async function syncMyActiveTravelsFromApi(
  accessToken: string,
  member: PlanMember,
): Promise<TravelPlan | null> {
  const travels = await fetchMyActiveTravels(accessToken);
  const store = usePlanStore.getState();

  logTravelPlanApi('my-travels.filtered', 'my-travels 동기화 대상 필터링 결과', {
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

    const { plan, scheduleLocked } = await trySyncTravelPlanFromApi(accessToken, shell);
    if (scheduleLocked) {
      const existingPlan = findLocalPlanForTravel(usePlanStore.getState().plans, travel.travelId);
      if (!existingPlan) {
        // 로컬 캐시 없는 locked shell은 빈 일정 UX를 만들지 않도록 건너뛴다.
        continue;
      }
      usePlanStore.getState().setPlanOfflineSync(existingPlan.planId, true);
      syncedPlans.push(existingPlan);
      continue;
    }
    usePlanStore.getState().setPlanOfflineSync(plan.planId, false);
    // 일정 sync는 멤버를 API에서 안 가져오므로, 그사이 멤버 sync가 갱신했으면 유지
    const latest = usePlanStore.getState().plans.find(p => p.planId === plan.planId);
    const merged = {
      ...plan,
      members: latest?.members ?? plan.members,
    };
    usePlanStore.getState().upsertPlan(merged);
    syncedPlans.push(merged);
  }

  const activePlanId = pickActiveTravelId(travels, usePlanStore.getState().activePlanId);
  if (activePlanId) {
    usePlanStore.getState().setActivePlan(activePlanId);
  } else {
    usePlanStore.getState().clearActivePlan();
  }

  return syncedPlans.find(plan => plan.planId === activePlanId) ?? syncedPlans[0] ?? null;
}
