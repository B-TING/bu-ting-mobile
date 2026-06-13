import type { RouteItem } from '../types/travelPlan';
import { haversineKm } from './geo';

/** 방문 진행을 바탕으로 한 현재 위치 추정 (GPS 연동 전) */
export function estimateUserLocation(routes: RouteItem[]): { lat: number; lng: number } {
  const visited = routes.filter(r => r.isVisited);
  if (visited.length > 0) {
    return visited[visited.length - 1].location;
  }
  const first = routes[0];
  if (first) {
    return first.location;
  }
  return { lat: 35.1587, lng: 129.1604 };
}

/** 현재 위치에서 가장 가까운 일정 항목 */
export function findNearestScheduleRoute(
  routes: RouteItem[],
  userLocation: { lat: number; lng: number },
): RouteItem | null {
  if (routes.length === 0) {
    return null;
  }
  const eligible = routes.filter(
    r => r.type === 'ATTRACTION' || r.type === 'RESTAURANT' || r.type === 'ACCOMMODATION',
  );
  const pool = eligible.length > 0 ? eligible : routes;
  return pool.reduce((best, r) => {
    const d = haversineKm(
      userLocation.lat,
      userLocation.lng,
      r.location.lat,
      r.location.lng,
    );
    const bestD = haversineKm(
      userLocation.lat,
      userLocation.lng,
      best.location.lat,
      best.location.lng,
    );
    return d < bestD ? r : best;
  });
}
