import type { DailyItinerary, TravelPlan } from '../../types/travelPlan';
import { enumerateVisitDates } from './travelMapper';
import { createTravelPlan, deleteTravelPlan } from './travelService';

export function computeNextPlanDay(
  plan: TravelPlan,
): { dayNumber: number; visitDate: string } | null {
  if (plan.itinerary.length === 0) {
    const dates = enumerateVisitDates(plan.startDate, plan.endDate);
    if (dates.length === 0) {
      return null;
    }
    return { dayNumber: 1, visitDate: dates[0] };
  }

  const sorted = [...plan.itinerary].sort((a, b) => a.dayNumber - b.dayNumber);
  const last = sorted[sorted.length - 1];
  const nextDate = new Date(`${last.date}T12:00:00`);
  nextDate.setDate(nextDate.getDate() + 1);
  const visitDate = nextDate.toISOString().slice(0, 10);
  if (visitDate > plan.endDate) {
    return null;
  }

  return { dayNumber: last.dayNumber + 1, visitDate };
}

export function canAddPlanDay(plan: TravelPlan): boolean {
  return computeNextPlanDay(plan) != null;
}

export function canRemovePlanDay(plan: TravelPlan): boolean {
  return plan.itinerary.length > 1;
}

export async function addPlanDayOnApi(
  accessToken: string,
  plan: TravelPlan,
): Promise<{ dayNumber: number; visitDate: string }> {
  const next = computeNextPlanDay(plan);
  if (!next) {
    throw new Error('여행 기간 내에 추가할 수 있는 일자가 없습니다.');
  }

  const travelId = plan.apiTravelId ?? plan.planId;
  await createTravelPlan(accessToken, travelId, next);
  return next;
}

export async function removePlanDayOnApi(
  accessToken: string,
  plan: TravelPlan,
  day: DailyItinerary,
): Promise<void> {
  const apiPlanId = day.apiPlanId;
  if (!apiPlanId) {
    throw new Error('삭제할 일자 정보를 찾을 수 없습니다.');
  }

  const travelId = plan.apiTravelId ?? plan.planId;
  await deleteTravelPlan(accessToken, travelId, apiPlanId);
}
