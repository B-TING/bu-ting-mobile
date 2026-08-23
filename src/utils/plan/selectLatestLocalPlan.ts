import type { TravelPlan } from '../../types/travelPlan';
import { isPlanForCurrentApiServer } from '../api/apiServerOrigin';

function todayIso(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}

function isCompletedLocalPlan(plan: TravelPlan): boolean {
  if (plan.travelStatus === 'COMPLETED' || plan.status === 'COMPLETED') {
    return true;
  }
  return Boolean(plan.endDate && plan.endDate < todayIso());
}

function planHasOfflineViewContent(plan: TravelPlan): boolean {
  return plan.itinerary.some(day => day.routes.length > 0);
}

function isOfflineViewablePlan(plan: TravelPlan): boolean {
  return !isCompletedLocalPlan(plan);
}

function sortPlansByCreatedAtDesc(plans: TravelPlan[]): TravelPlan[] {
  return [...plans].sort((a, b) =>
    (b.createdAt || '').localeCompare(a.createdAt || ''),
  );
}

/** 로컬에서 지울 완료된 여행 ID (상태·종료일 기준) */
export function listCompletedLocalPlanIds(plans: TravelPlan[]): string[] {
  return plans.filter(isCompletedLocalPlan).map(plan => plan.planId);
}

/** 오프라인 열람 후보 — 완료 제외, 현재 API origin, 장소 있는 일정 우선 */
export function listOfflineViewablePlans(input: {
  plans: TravelPlan[];
}): TravelPlan[] {
  const candidates = input.plans
    .filter(isPlanForCurrentApiServer)
    .filter(isOfflineViewablePlan);
  if (candidates.length === 0) {
    return [];
  }

  const withContent = candidates.filter(planHasOfflineViewContent);
  const pool = withContent.length > 0 ? withContent : candidates;
  return sortPlansByCreatedAtDesc(pool);
}

/** 오프라인 열람용 — 현재 API origin · 일정 내용 우선, 활성 일정, 최근 생성 순 */
export function selectLatestLocalPlan(input: {
  plans: TravelPlan[];
  activePlanId: string | null;
}): TravelPlan | null {
  const pool = listOfflineViewablePlans(input);
  if (pool.length === 0) {
    return null;
  }

  if (input.activePlanId) {
    const active = pool.find(p => p.planId === input.activePlanId);
    if (active) {
      return active;
    }
  }

  return pool[0] ?? null;
}
