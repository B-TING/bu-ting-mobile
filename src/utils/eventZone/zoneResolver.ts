import {
  BUSAN_MAP_BOUNDS,
  BUSAN_MAP_VIEWBOX,
  EVENT_ZONES,
} from '../../constants/eventZone/eventZone';
import type { EventZoneCoordinate, EventZoneId } from '../../types/eventZone';

export function projectLatLngToMapPoint(location: EventZoneCoordinate): {
  x: number;
  y: number;
} {
  const { minLat, maxLat, minLng, maxLng } = BUSAN_MAP_BOUNDS;
  const x =
    ((location.lng - minLng) / (maxLng - minLng)) * BUSAN_MAP_VIEWBOX.width;
  const y =
    ((maxLat - location.lat) / (maxLat - minLat)) * BUSAN_MAP_VIEWBOX.height;
  return { x, y };
}

function isInsideBounds(
  location: EventZoneCoordinate,
  bounds: {
    minLat: number;
    maxLat: number;
    minLng: number;
    maxLng: number;
  },
): boolean {
  return (
    location.lat >= bounds.minLat &&
    location.lat <= bounds.maxLat &&
    location.lng >= bounds.minLng &&
    location.lng <= bounds.maxLng
  );
}

function zoneCenterDistance(
  location: EventZoneCoordinate,
  bounds: {
    minLat: number;
    maxLat: number;
    minLng: number;
    maxLng: number;
  },
): number {
  const centerLat = (bounds.minLat + bounds.maxLat) / 2;
  const centerLng = (bounds.minLng + bounds.maxLng) / 2;
  return (
    (location.lat - centerLat) ** 2 + (location.lng - centerLng) ** 2
  );
}

/** 현재 좌표가 속하는 이벤트 구역 (겹치면 중심 거리가 가까운 구역) */
export function resolveEventZoneFromCoordinate(
  location: EventZoneCoordinate,
): EventZoneId {
  const matches = EVENT_ZONES.filter(zone => isInsideBounds(location, zone.bounds));

  if (matches.length === 1) {
    return matches[0].id;
  }

  if (matches.length > 1) {
    return matches.reduce((best, zone) =>
      zoneCenterDistance(location, zone.bounds) <
      zoneCenterDistance(location, best.bounds)
        ? zone
        : best,
    ).id;
  }

  return EVENT_ZONES.reduce((best, zone) =>
    zoneCenterDistance(location, zone.bounds) <
    zoneCenterDistance(location, best.bounds)
      ? zone
      : best,
  ).id;
}

export function getEventZoneIdForLandmark(
  location: EventZoneCoordinate,
): EventZoneId {
  return resolveEventZoneFromCoordinate(location);
}
