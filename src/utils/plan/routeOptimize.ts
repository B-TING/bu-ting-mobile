import type { RouteItem } from '../../types/travelPlan';
import { haversineKm } from '../geo/geo';
import { sortedRoutes } from './planItinerary';

/** 탐욕적 최근접 이웃으로 당일 경로 순서 최적화 */
export function optimizeRouteOrder(routes: RouteItem[]): RouteItem[] {
  if (routes.length <= 2) {
    return sortedRoutes(routes);
  }

  const sorted = sortedRoutes(routes);
  const remaining = [...sorted];
  const result: RouteItem[] = [remaining.shift()!];

  while (remaining.length > 0) {
    const current = result[result.length - 1];
    let nearestIdx = 0;
    let nearestDist = Infinity;

    for (let i = 0; i < remaining.length; i++) {
      const dist = haversineKm(
        current.location.lat,
        current.location.lng,
        remaining[i].location.lat,
        remaining[i].location.lng,
      );
      if (dist < nearestDist) {
        nearestDist = dist;
        nearestIdx = i;
      }
    }

    result.push(remaining.splice(nearestIdx, 1)[0]);
  }

  return result.map((r, i) => ({ ...r, sequence: i }));
}
