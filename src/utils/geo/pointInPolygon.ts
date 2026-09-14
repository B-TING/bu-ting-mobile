import type { EventZoneCoordinate } from '../../types/eventZone';

/**
 * Ray-casting point-in-ring (lat/lng as y/x).
 * Ring should be closed or nearly closed; duplicate closing vertex is fine.
 */
export function pointInRing(
  point: EventZoneCoordinate,
  ring: EventZoneCoordinate[],
): boolean {
  if (ring.length < 3) {
    return false;
  }

  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const yi = ring[i]!.lat;
    const xi = ring[i]!.lng;
    const yj = ring[j]!.lat;
    const xj = ring[j]!.lng;
    const intersects =
      yi > point.lat !== yj > point.lat &&
      point.lng < ((xj - xi) * (point.lat - yi)) / (yj - yi + Number.EPSILON) + xi;
    if (intersects) {
      inside = !inside;
    }
  }
  return inside;
}

/**
 * rings[0] = exterior, rings[1..] = holes (GeoJSON Polygon).
 */
export function pointInPolygonRings(
  point: EventZoneCoordinate,
  rings: EventZoneCoordinate[][],
): boolean {
  const exterior = rings[0];
  if (!exterior || !pointInRing(point, exterior)) {
    return false;
  }
  for (let i = 1; i < rings.length; i += 1) {
    const hole = rings[i];
    if (hole && pointInRing(point, hole)) {
      return false;
    }
  }
  return true;
}

/**
 * `busanDistrictBoundaries` 빌더는 MultiPolygon을 링 배열로 평탄화한다.
 * (외곽+홀 구조가 아님) → 유효 링 중 하나라도 포함이면 true.
 */
export function pointInFlattenedBoundaryRings(
  point: EventZoneCoordinate,
  rings: EventZoneCoordinate[][],
): boolean {
  return rings.some(ring => ring.length >= 4 && pointInRing(point, ring));
}
