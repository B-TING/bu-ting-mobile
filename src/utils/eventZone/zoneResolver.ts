import {
  BUSAN_DISTRICT_LABEL_CENTERS,
  BUSAN_SVG_VIEWBOX,
  EVENT_ZONE_DISTRICT_IDS,
} from '../../constants/eventZone/busanMapPaths';
import { EVENT_ZONES } from '../../constants/eventZone/eventZone';
import type { EventZoneCoordinate, EventZoneId } from '../../types/eventZone';

/** lat/lng ↔ busan.svg 보정 (자갈치·해운대 기준 2점 보간) */
const MAP_PROJECTION = {
  lngToX: { scale: 1018.5, offset: -131051.0 },
  latToY: { scale: -2045.0, offset: 72267.0 },
} as const;

export function projectLatLngToMapPoint(location: EventZoneCoordinate): {
  x: number;
  y: number;
} {
  const x = MAP_PROJECTION.lngToX.scale * location.lng + MAP_PROJECTION.lngToX.offset;
  const y = MAP_PROJECTION.latToY.scale * location.lat + MAP_PROJECTION.latToY.offset;

  return {
    x: Math.max(0, Math.min(BUSAN_SVG_VIEWBOX.width, x)),
    y: Math.max(0, Math.min(BUSAN_SVG_VIEWBOX.height, y)),
  };
}

function distanceSq(
  a: { x: number; y: number },
  b: { x: number; y: number },
): number {
  return (a.x - b.x) ** 2 + (a.y - b.y) ** 2;
}

/** GPS 좌표를 busan.svg 상 위치로 투영한 뒤, 가장 가까운 행정구역 → 이벤트 존 반환 */
export function resolveEventZoneFromCoordinate(
  location: EventZoneCoordinate,
): EventZoneId {
  const mapPoint = projectLatLngToMapPoint(location);

  let bestZone: EventZoneId = EVENT_ZONES[0].id;
  let bestDistance = Number.POSITIVE_INFINITY;

  for (const zone of EVENT_ZONES) {
    for (const districtId of EVENT_ZONE_DISTRICT_IDS[zone.id]) {
      const center = BUSAN_DISTRICT_LABEL_CENTERS[districtId];
      if (!center) {
        continue;
      }
      const dist = distanceSq(mapPoint, center);
      if (dist < bestDistance) {
        bestDistance = dist;
        bestZone = zone.id;
      }
    }
  }

  return bestZone;
}

export function getEventZoneIdForLandmark(
  location: EventZoneCoordinate,
): EventZoneId {
  return resolveEventZoneFromCoordinate(location);
}
