import type { LatLng } from 'react-native-maps';

import { getScheduleDayColor } from '../constants/scheduleDayColors';
import type { DailyItinerary } from '../types/travelPlan';
import { toMapCoordinate } from './mapRegion';
import { buildScheduleMapDays } from './scheduleMapSnapshot';

export type ScheduleMapLineOverlay = {
  key: string;
  dayNumber: number;
  coordinates: LatLng[];
  strokeColor: string;
  strokeWidth: number;
  zIndex: number;
};

export type ScheduleMapMarkerOverlay = {
  key: string;
  dayNumber: number;
  itemId: string;
  coordinate: LatLng;
  order: number;
  isSelectedDay: boolean;
  isActiveDay: boolean;
};

function withAlpha(hex: string, alpha: number): string {
  const normalized = hex.replace('#', '');
  const value = Math.round(Math.min(1, Math.max(0, alpha)) * 255)
    .toString(16)
    .padStart(2, '0');
  return `#${normalized}${value}`;
}

/** null/undefined 좌표 제거 — Polyline 크래시 방지 */
export function filterValidCoordinates(coordinates: LatLng[]): LatLng[] {
  return coordinates.filter(
    coord =>
      Number.isFinite(coord.latitude) &&
      Number.isFinite(coord.longitude) &&
      coord.latitude !== 0 &&
      coord.longitude !== 0,
  );
}

export function buildScheduleMapOverlays(
  itinerary: DailyItinerary[],
  selectedDayNumber?: number,
): { lines: ScheduleMapLineOverlay[]; markers: ScheduleMapMarkerOverlay[] } {
  const lines: ScheduleMapLineOverlay[] = [];
  const markers: ScheduleMapMarkerOverlay[] = [];

  for (const day of buildScheduleMapDays(itinerary)) {
    if (day.routes.length === 0) {
      continue;
    }

    const isSelectedDay =
      selectedDayNumber == null || day.dayNumber === selectedDayNumber;
    const isActiveDay = day.dayNumber === selectedDayNumber;
    const color = getScheduleDayColor(day.dayNumber);
    const coordinates = filterValidCoordinates(
      day.routes.map(route => toMapCoordinate(route.location)),
    );

    if (coordinates.length >= 2) {
      lines.push({
        key: `line-day-${day.dayNumber}`,
        dayNumber: day.dayNumber,
        coordinates,
        strokeColor: isSelectedDay ? color.main : withAlpha(color.main, 0.45),
        strokeWidth: isSelectedDay ? 4 : 2.5,
        zIndex: isSelectedDay ? 2 : 1,
      });
    }

    day.routes.forEach((route, index) => {
      const coordinate = toMapCoordinate(route.location);
      if (
        !Number.isFinite(coordinate.latitude) ||
        !Number.isFinite(coordinate.longitude)
      ) {
        return;
      }

      markers.push({
        key: `marker-${day.dayNumber}-${route.itemId}-order-${index + 1}`,
        dayNumber: day.dayNumber,
        itemId: route.itemId,
        coordinate,
        order: index + 1,
        isSelectedDay,
        isActiveDay,
      });
    });
  }

  return { lines, markers };
}
