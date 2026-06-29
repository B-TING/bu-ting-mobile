import type { EventZoneId } from '../../types/eventZone';
import type { RouteItem } from '../../types/travelPlan';
import { resolveEventZoneForRoute } from '../eventZone/zoneResolver';

export type ScheduleZoneSegment = {
  zoneId: EventZoneId;
  entries: { route: RouteItem; globalIndex: number }[];
};

export function groupScheduleRoutesByZone(routes: RouteItem[]): ScheduleZoneSegment[] {
  const segments: ScheduleZoneSegment[] = [];

  routes.forEach((route, globalIndex) => {
    const zoneId = resolveEventZoneForRoute(route);
    const last = segments[segments.length - 1];

    if (last && last.zoneId === zoneId) {
      last.entries.push({ route, globalIndex });
      return;
    }

    segments.push({
      zoneId,
      entries: [{ route, globalIndex }],
    });
  });

  return segments;
}

export function countScheduleZoneSegments(routes: RouteItem[]): number {
  return groupScheduleRoutesByZone(routes).length;
}
