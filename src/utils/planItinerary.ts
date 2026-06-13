import type { RouteItem } from '../types/travelPlan';

export function sortedRoutes(routes: RouteItem[]): RouteItem[] {
  return [...routes].sort((a, b) => a.sequence - b.sequence);
}

/** 개요·미리보기용: 숙소가 아닌 첫 장소, 없으면 첫 일정 */
export function representativeRoute(routes: RouteItem[]): RouteItem | null {
  const sorted = sortedRoutes(routes);
  return sorted.find(r => r.type !== 'ACCOMMODATION') ?? sorted[0] ?? null;
}

export function totalPlaceCount(
  itinerary: { routes: RouteItem[] }[],
): number {
  return itinerary.reduce((sum, day) => sum + day.routes.length, 0);
}
