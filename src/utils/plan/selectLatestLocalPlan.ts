import type { TravelPlan } from '../../types/travelPlan';
import { isPlanForCurrentApiServer } from '../api/apiServerOrigin';

function planHasOfflineViewContent(plan: TravelPlan): boolean {
  return plan.itinerary.some(day => day.routes.length > 0);
}

function sortPlansByCreatedAtDesc(plans: TravelPlan[]): TravelPlan[] {
  return [...plans].sort((a, b) =>
    (b.createdAt || '').localeCompare(a.createdAt || ''),
  );
}

/** 오프라인 열람용 — 현재 API origin · 일정 내용 우선, 활성 일정, 최근 생성 순 */
export function selectLatestLocalPlan(input: {
  plans: TravelPlan[];
  activePlanId: string | null;
}): TravelPlan | null {
  const candidates = input.plans.filter(isPlanForCurrentApiServer);
  if (candidates.length === 0) {
    return null;
  }

  const withContent = candidates.filter(planHasOfflineViewContent);
  const pool = withContent.length > 0 ? withContent : candidates;

  if (input.activePlanId) {
    const active = pool.find(p => p.planId === input.activePlanId);
    if (active) {
      return active;
    }
  }

  return sortPlansByCreatedAtDesc(pool)[0] ?? null;
}
