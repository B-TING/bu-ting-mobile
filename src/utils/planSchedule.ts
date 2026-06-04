import type { DailyItinerary, RouteItem, TravelPlan } from '../types/travelPlan';

export type UpcomingStop = {
  day: DailyItinerary;
  route: RouteItem;
};

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

/** 오늘 이후(또는 오늘) 첫 미방문 장소, 없으면 여행 기간 내 다음 일정 */
export function getNearestUpcomingStop(plan: TravelPlan): UpcomingStop | null {
  if (plan.itinerary.length === 0) {
    return null;
  }

  const today = startOfDay(new Date());
  const days = [...plan.itinerary].sort((a, b) => a.date.localeCompare(b.date));

  for (const day of days) {
    const dayDate = startOfDay(new Date(day.date));
    if (dayDate < today) {
      continue;
    }
    const routes = [...day.routes].sort((a, b) => a.sequence - b.sequence);
    if (routes.length === 0) {
      continue;
    }
    const next = routes.find(r => !r.isVisited) ?? routes[0];
    return { day, route: next };
  }

  const tripStart = startOfDay(new Date(plan.startDate));
  const tripEnd = startOfDay(new Date(plan.endDate));
  if (today >= tripStart && today <= tripEnd) {
    for (const day of days) {
      const routes = [...day.routes].sort((a, b) => a.sequence - b.sequence);
      const next = routes.find(r => !r.isVisited);
      if (next) {
        return { day, route: next };
      }
    }
  }

  const lastDay = days[days.length - 1];
  const lastRoutes = [...lastDay.routes].sort((a, b) => a.sequence - b.sequence);
  if (lastRoutes[0]) {
    return { day: lastDay, route: lastRoutes[0] };
  }

  return null;
}
