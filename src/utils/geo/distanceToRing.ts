import type { EventZoneCoordinate } from '../../types/eventZone';

const METERS_PER_DEG_LAT = 111_320;

function metersPerDegLng(lat: number): number {
  return METERS_PER_DEG_LAT * Math.cos((lat * Math.PI) / 180);
}

function pointToSegmentMeters(
  origin: EventZoneCoordinate,
  a: EventZoneCoordinate,
  b: EventZoneCoordinate,
): number {
  const mx = metersPerDegLng(origin.lat);
  const px = 0;
  const py = 0;
  const ax = (a.lng - origin.lng) * mx;
  const ay = (a.lat - origin.lat) * METERS_PER_DEG_LAT;
  const bx = (b.lng - origin.lng) * mx;
  const by = (b.lat - origin.lat) * METERS_PER_DEG_LAT;
  const dx = bx - ax;
  const dy = by - ay;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) {
    return Math.hypot(px - ax, py - ay);
  }
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / lenSq));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

/** 점과 링 변 사이의 최소 거리(m). */
export function distanceMetersToRing(
  point: EventZoneCoordinate,
  ring: EventZoneCoordinate[],
): number {
  if (ring.length < 2) {
    return Number.POSITIVE_INFINITY;
  }
  let best = Number.POSITIVE_INFINITY;
  for (let i = 0; i < ring.length; i += 1) {
    const a = ring[i]!;
    const b = ring[(i + 1) % ring.length]!;
    const dist = pointToSegmentMeters(point, a, b);
    if (dist < best) {
      best = dist;
    }
  }
  return best;
}

export function distanceMetersToRings(
  point: EventZoneCoordinate,
  rings: EventZoneCoordinate[][],
): number {
  let best = Number.POSITIVE_INFINITY;
  for (const ring of rings) {
    const dist = distanceMetersToRing(point, ring);
    if (dist < best) {
      best = dist;
    }
  }
  return best;
}

export function expandLatLngByMeters(
  meters: number,
  lat: number,
): { latPad: number; lngPad: number } {
  return {
    latPad: meters / METERS_PER_DEG_LAT,
    lngPad: meters / Math.max(metersPerDegLng(lat), 1),
  };
}
