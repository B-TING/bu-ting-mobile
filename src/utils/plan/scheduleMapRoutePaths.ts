import type { DailyItinerary } from '../../types/travelPlan';
import { buildScheduleMapDays } from '../../kakaoMap/overlays/scheduleSnapshot';
import { fetchKakaoDayRoutePath } from '../../services/kakaoDirectionsService';
import { sortedRoutes } from './planItinerary';

export type ScheduleDayRoutePath = {
  dayNumber: number;
  path: { lat: number; lng: number }[];
};

export async function buildScheduleMapRoutePaths(
  itinerary: DailyItinerary[],
): Promise<Record<number, { lat: number; lng: number }[]>> {
  const days = buildScheduleMapDays(itinerary);
  const entries = await Promise.all(
    days.map(async day => {
      const routes = sortedRoutes(day.routes);
      if (routes.length < 2) {
        return [day.dayNumber, []] as const;
      }
      const path = await fetchKakaoDayRoutePath(
        routes.map(route => ({
          location: route.location,
          legMode: route.legMode,
        })),
      );
      return [day.dayNumber, path] as const;
    }),
  );

  return Object.fromEntries(entries);
}
