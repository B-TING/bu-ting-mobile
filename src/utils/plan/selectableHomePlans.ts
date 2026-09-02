import type { TravelStatusDto } from '../../types/travelApi';
import type { TravelPlan } from '../../types/travelPlan';
import { filterPlansForCurrentApiServer } from '../api/apiServerOrigin';
import { isServerBackedPlan } from './serverBackedPlan';

const STATUS_RANK: Record<TravelStatusDto, number> = {
  IN_PROGRESS: 0,
  PLANNED: 1,
  COMPLETED: 2,
};

function todayIso(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}

function planTravelStatus(plan: TravelPlan): TravelStatusDto {
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

function isActiveTravelStatus(status: TravelStatusDto): boolean {
  return status === 'PLANNED' || status === 'IN_PROGRESS';
}

let cachedSelectableInput: TravelPlan[] | undefined;
let cachedSelectableResult: TravelPlan[] = [];

/** 홈·일정 탭에서 고를 수 있는 서버 연동 여행 (예정·진행 중) */
export function getSelectableHomePlans(plans: TravelPlan[]): TravelPlan[] {
  if (cachedSelectableInput === plans) {
    return cachedSelectableResult;
  }

  cachedSelectableInput = plans;
  cachedSelectableResult = filterPlansForCurrentApiServer(plans)
    .filter(plan => isServerBackedPlan(plan) && isActiveTravelStatus(planTravelStatus(plan)))
    .sort((a, b) => {
      const statusDiff = STATUS_RANK[planTravelStatus(a)] - STATUS_RANK[planTravelStatus(b)];
      if (statusDiff !== 0) {
        return statusDiff;
      }
      const dateDiff = a.startDate.localeCompare(b.startDate);
      if (dateDiff !== 0) {
        return dateDiff;
      }
      return (b.createdAt || '').localeCompare(a.createdAt || '');
    });
  return cachedSelectableResult;
}

/** 피커에 현재 히어로 플랜이 빠져 있으면 맨 앞에 붙입니다. 완료된 여행은 넣지 않습니다. */
export function mergeFeaturedIntoPickerPlans(
  selectablePlans: TravelPlan[],
  featuredPlan: TravelPlan | null,
): TravelPlan[] {
  if (!featuredPlan || !isActiveTravelStatus(planTravelStatus(featuredPlan))) {
    return selectablePlans;
  }
  if (selectablePlans.some(plan => plan.planId === featuredPlan.planId)) {
    return selectablePlans;
  }
  return [featuredPlan, ...selectablePlans];
}
