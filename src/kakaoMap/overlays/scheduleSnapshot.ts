import type { DailyItinerary, RouteItem } from '../../types/travelPlan';
import { sortedRoutes } from '../../utils/planItinerary';

export type ScheduleMapDay = {
  dayNumber: number;
  routes: RouteItem[];
};

export function buildScheduleDayRevisionKey(day: ScheduleMapDay): string {
  return sortedRoutes(day.routes)
    .map(
      route =>
        `${route.itemId}@${route.sequence}:${route.location.lat.toFixed(5)},${route.location.lng.toFixed(5)}`,
    )
    .join(';');
}

/** 일정 변경 시 지도 오버레이 remount·region 갱신용 */
export function buildScheduleMapRevisionKey(itinerary: DailyItinerary[]): string {
  return itinerary
    .map(day => `${day.dayNumber}=[${buildScheduleDayRevisionKey({ dayNumber: day.dayNumber, routes: day.routes })}]`)
    .join('|');
}

export function buildScheduleMapDays(itinerary: DailyItinerary[]): ScheduleMapDay[] {
  return itinerary.map(day => ({
    dayNumber: day.dayNumber,
    routes: sortedRoutes(day.routes),
  }));
}

export function collectScheduleMapPoints(days: ScheduleMapDay[], dayNumber?: number) {
  const visibleDays =
    dayNumber != null ? days.filter(day => day.dayNumber === dayNumber) : days;
  return visibleDays.flatMap(day => day.routes.map(route => route.location));
}
