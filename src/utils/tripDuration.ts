import type { DailyItinerary, RouteItem } from '../types/travelPlan';
import { estimateTravelLeg } from './geo';
import { sortedRoutes } from './planItinerary';

const DEFAULT_DWELL_MINUTES = 60;

/** 일정 전체 소요시간(이동 + 체류) 추정 */
export function computeTripTotalMinutes(itinerary: DailyItinerary[]): number {
  let total = 0;

  for (const day of itinerary) {
    const routes = sortedRoutes(day.routes);
    for (let i = 0; i < routes.length; i++) {
      const route = routes[i];
      total += route.placeInfo?.dwellMinutes ?? DEFAULT_DWELL_MINUTES;
      if (i > 0) {
        const prev = routes[i - 1];
        total += estimateTravelLeg(prev.location, route.location, route.legMode)
          .durationMinutes;
      }
    }
  }

  return total;
}

export function formatDurationMinutes(minutes: number, lang: string): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (lang === 'ko') {
    if (h === 0) {
      return `${m}분`;
    }
    if (m === 0) {
      return `${h}시간`;
    }
    return `${h}시간 ${m}분`;
  }
  if (h === 0) {
    return `${m} min`;
  }
  if (m === 0) {
    return `${h} hr`;
  }
  return `${h} hr ${m} min`;
}

export function computeDayTotalMinutes(routes: RouteItem[]): number {
  const sorted = sortedRoutes(routes);
  let total = 0;
  for (let i = 0; i < sorted.length; i++) {
    total += sorted[i].placeInfo?.dwellMinutes ?? DEFAULT_DWELL_MINUTES;
    if (i > 0) {
      total += estimateTravelLeg(
        sorted[i - 1].location,
        sorted[i].location,
        sorted[i].legMode,
      ).durationMinutes;
    }
  }
  return total;
}
