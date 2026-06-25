import { localizedAreaName } from '../../constants/places/accommodation';
import { localizedAttractionCategory } from '../../constants/places/attractions';
import { getScheduleDayColor } from '../../constants/plan/scheduleDayColors';
import type { BusanAccommodation } from '../../types/accommodation';
import type { BusanAttraction } from '../../types/attraction';
import type { SubwayLockerStation } from '../../types/subwayLocker';
import type { AppLanguage } from '../../types/user';
import type { RouteItem } from '../../types/travelPlan';
import type { KakaoMapOverlay } from './types';
import type {
  ScheduleMapLineOverlay,
  ScheduleMapMarkerOverlay,
} from './scheduleOverlays';

function parseStrokeColor(hex: string): { color: string; opacity: number } {
  if (hex.length === 9 && hex.startsWith('#')) {
    const alpha = parseInt(hex.slice(7, 9), 16) / 255;
    return { color: hex.slice(0, 7), opacity: alpha };
  }
  return { color: hex, opacity: 0.85 };
}

export function kakaoOverlaysFromSchedule(
  lines: ScheduleMapLineOverlay[],
  markers: ScheduleMapMarkerOverlay[],
): KakaoMapOverlay[] {
  const overlays: KakaoMapOverlay[] = [];

  for (const line of lines) {
    if (line.coordinates.length < 2) {
      continue;
    }
    const { color, opacity } = parseStrokeColor(line.strokeColor);
    overlays.push({
      kind: 'polyline',
      id: line.key,
      path: line.coordinates.map(coord => ({
        lat: coord.latitude,
        lng: coord.longitude,
      })),
      strokeColor: color,
      strokeOpacity: opacity,
      strokeWeight: line.strokeWidth,
      zIndex: line.zIndex,
    });
  }

  for (const marker of markers) {
    const dayColor = getScheduleDayColor(marker.dayNumber);
    overlays.push({
      kind: 'numbered',
      id: marker.key,
      lat: marker.coordinate.latitude,
      lng: marker.coordinate.longitude,
      order: marker.order,
      color: dayColor.main,
      opacity: marker.isSelectedDay ? 1 : 0.72,
      size: marker.isActiveDay ? 30 : 26,
      zIndex: marker.isActiveDay ? 10 : 5,
    });
  }

  return overlays;
}

export function kakaoOverlaysFromRoutes(
  routes: RouteItem[],
  highlightItemId?: string | null,
): KakaoMapOverlay[] {
  if (routes.length === 0) {
    return [];
  }

  const sorted = [...routes].sort((a, b) => a.sequence - b.sequence);
  const overlays: KakaoMapOverlay[] = [];
  const path = sorted.map(route => ({
    lat: route.location.lat,
    lng: route.location.lng,
  }));

  if (path.length >= 2) {
    overlays.push({
      kind: 'polyline',
      id: 'route-line',
      path,
      strokeColor: '#0077B6',
      strokeOpacity: 0.85,
      strokeWeight: 4,
      zIndex: 2,
    });
  }

  sorted.forEach((route, index) => {
    const active = highlightItemId === route.itemId;
    overlays.push({
      kind: 'numbered',
      id: `route-${route.itemId}`,
      lat: route.location.lat,
      lng: route.location.lng,
      order: index + 1,
      color: active ? '#0077B6' : '#4285F4',
      opacity: 1,
      size: active ? 30 : 26,
      zIndex: active ? 10 : 5,
    });
  });

  return overlays;
}

export function kakaoOverlaysFromStays(
  stays: BusanAccommodation[],
  selectedId: string | null | undefined,
  bookmarkedIds: readonly string[],
  options: {
    language: AppLanguage;
    areaLabel: (area: string) => string;
  },
): KakaoMapOverlay[] {
  const bookmarkSet = new Set(bookmarkedIds);

  return stays.map(stay => {
    const active = stay.id === selectedId;
    const bookmarked = bookmarkSet.has(stay.id);
    const pinColor = bookmarked ? '#F59E0B' : '#4285F4';

    return {
      kind: 'rating',
      id: stay.id,
      lat: stay.location.lat,
      lng: stay.location.lng,
      rating: stay.rating > 0 ? stay.rating.toFixed(1) : '—',
      color: pinColor,
      active,
      bookmarked,
      caption: active
        ? `${stay.name} · ${options.areaLabel(localizedAreaName(stay, options.language))}`
        : undefined,
    };
  });
}

export function kakaoOverlaysFromAttractions(
  attractions: BusanAttraction[],
  selectedId: string | null | undefined,
  bookmarkedIds: readonly string[],
  options: {
    language: AppLanguage;
    categoryLabel: (category: string) => string;
  },
): KakaoMapOverlay[] {
  const bookmarkSet = new Set(bookmarkedIds);

  return attractions.map(attraction => {
    const active = attraction.id === selectedId;
    const bookmarked = bookmarkSet.has(attraction.id);
    const pinColor = bookmarked ? '#F59E0B' : '#4285F4';

    return {
      kind: 'rating',
      id: attraction.id,
      lat: attraction.location.lat,
      lng: attraction.location.lng,
      rating: attraction.rating > 0 ? attraction.rating.toFixed(1) : '—',
      color: pinColor,
      active,
      bookmarked,
      caption: active
        ? `${attraction.name} · ${options.categoryLabel(
            localizedAttractionCategory(attraction, options.language),
          )}`
        : undefined,
    };
  });
}

function formatLockerCount(total: number): string {
  return total >= 100 ? '99+' : String(total);
}

export function kakaoOverlaysFromLockerStations(
  stations: SubwayLockerStation[],
  selectedId: string | null | undefined,
  bookmarkedIds: readonly string[],
  lineLabel?: (line: number) => string,
): KakaoMapOverlay[] {
  const bookmarkSet = new Set(bookmarkedIds);

  return stations.map(station => {
    const active = station.id === selectedId;
    const bookmarked = bookmarkSet.has(station.id);
    const pinColor = bookmarked ? '#F59E0B' : '#4285F4';

    return {
      kind: 'locker',
      id: station.id,
      lat: station.location.lat,
      lng: station.location.lng,
      count: formatLockerCount(station.lockers.total),
      stationName: station.name,
      color: pinColor,
      active,
      bookmarked,
      subtitle:
        active && lineLabel ? lineLabel(station.line) : undefined,
    };
  });
}
