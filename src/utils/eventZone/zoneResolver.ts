import {
  BUSAN_DISTRICT_BOUNDARIES,
  BUSAN_DISTRICT_EXTENT,
} from '../../constants/eventZone/busanDistrictBoundaries';
import {
  BUSAN_DISTRICT_BY_ID,
  BUSAN_DISTRICT_LABEL_CENTERS,
  BUSAN_SVG_VIEWBOX,
  EVENT_ZONE_DISTRICT_IDS,
} from '../../constants/eventZone/busanMapPaths';
import { EVENT_ZONES } from '../../constants/eventZone/eventZone';
import type { EventZoneCoordinate, EventZoneId } from '../../types/eventZone';
import type { RouteItem } from '../../types/travelPlan';
import { distanceMetersToRings, expandLatLngByMeters } from '../geo/distanceToRing';
import { pointInFlattenedBoundaryRings } from '../geo/pointInPolygon';

/** lat/lng ↔ busan.svg 보정 (자갈치·해운대 기준 2점 보간) */
const MAP_PROJECTION = {
  lngToX: { scale: 1018.5, offset: -131051.0 },
  latToY: { scale: -2045.0, offset: 72267.0 },
} as const;

const DISTRICT_LABEL_TO_ID: Record<string, string> = Object.fromEntries(
  Object.values(BUSAN_DISTRICT_BY_ID).flatMap(district => [
    [district.labelKo, district.id],
    [district.labelKo.replace(/[구군]$/, ''), district.id],
  ]),
);

/** 영문 주소용 (예: Suyeong-gu, Busan) */
const DISTRICT_ENGLISH_TO_ID: Record<string, string> = {
  'jung-gu': 'CD26110',
  jung: 'CD26110',
  'seo-gu': 'CD26140',
  seo: 'CD26140',
  'dong-gu': 'CD26170',
  'yeongdo-gu': 'CD26200',
  yeongdo: 'CD26200',
  'busanjin-gu': 'CD26230',
  busanjin: 'CD26230',
  'dongnae-gu': 'CD26260',
  dongnae: 'CD26260',
  'nam-gu': 'CD26290',
  'buk-gu': 'CD26320',
  'haeundae-gu': 'CD26350',
  haeundae: 'CD26350',
  'saha-gu': 'CD26380',
  saha: 'CD26380',
  'geumjeong-gu': 'CD26410',
  geumjeong: 'CD26410',
  'gangseo-gu': 'CD26440',
  gangseo: 'CD26440',
  'yeonje-gu': 'CD26470',
  yeonje: 'CD26470',
  'suyeong-gu': 'CD26500',
  suyeong: 'CD26500',
  'sasang-gu': 'CD26530',
  sasang: 'CD26530',
  'gijang-gun': 'CD26710',
  gijang: 'CD26710',
};

const DISTRICT_ID_TO_ZONE = Object.fromEntries(
  (Object.entries(EVENT_ZONE_DISTRICT_IDS) as [EventZoneId, string[]][]).flatMap(
    ([zoneId, districtIds]) => districtIds.map(districtId => [districtId, zoneId]),
  ),
) as Record<string, EventZoneId>;

/** 해안·구 경계 틈. PIP 실패 시 이 거리 안이면 그 구. */
export const USER_ZONE_EDGE_MAX_METERS = 200;

type DistrictBBox = {
  districtId: string;
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
};

const DISTRICT_BBOXES: DistrictBBox[] = BUSAN_DISTRICT_BOUNDARIES.map(boundary => {
  let minLat = Infinity;
  let maxLat = -Infinity;
  let minLng = Infinity;
  let maxLng = -Infinity;
  for (const ring of boundary.rings) {
    for (const point of ring) {
      if (point.lat < minLat) minLat = point.lat;
      if (point.lat > maxLat) maxLat = point.lat;
      if (point.lng < minLng) minLng = point.lng;
      if (point.lng > maxLng) maxLng = point.lng;
    }
  }
  return { districtId: boundary.districtId, minLat, maxLat, minLng, maxLng };
});

function bboxMayReach(
  bbox: DistrictBBox,
  location: EventZoneCoordinate,
  meters: number,
): boolean {
  const { latPad, lngPad } = expandLatLngByMeters(meters, location.lat);
  return (
    location.lat >= bbox.minLat - latPad &&
    location.lat <= bbox.maxLat + latPad &&
    location.lng >= bbox.minLng - lngPad &&
    location.lng <= bbox.maxLng + lngPad
  );
}

export function isInsideBusanBounds(location: EventZoneCoordinate): boolean {
  return (
    location.lat >= BUSAN_DISTRICT_EXTENT.minLat &&
    location.lat <= BUSAN_DISTRICT_EXTENT.maxLat &&
    location.lng >= BUSAN_DISTRICT_EXTENT.minLng &&
    location.lng <= BUSAN_DISTRICT_EXTENT.maxLng
  );
}

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

/** busan.svg 좌표 → GPS (projectLatLngToMapPoint 역변환) */
export function projectMapPointToLatLng(point: { x: number; y: number }): EventZoneCoordinate {
  return {
    lng: (point.x - MAP_PROJECTION.lngToX.offset) / MAP_PROJECTION.lngToX.scale,
    lat: (point.y - MAP_PROJECTION.latToY.offset) / MAP_PROJECTION.latToY.scale,
  };
}

function distanceSq(
  a: { x: number; y: number },
  b: { x: number; y: number },
): number {
  return (a.x - b.x) ** 2 + (a.y - b.y) ** 2;
}

/** 주소 문자열에서 부산 시·군·구 행정구역 ID 추출 */
export function resolveDistrictIdFromAddress(address: string): string | null {
  const trimmed = address.trim();
  if (!trimmed) {
    return null;
  }

  const koreanMatch = trimmed.match(/([가-힣]{1,5}(?:구|군))/);
  if (koreanMatch) {
    const label = koreanMatch[1];
    return DISTRICT_LABEL_TO_ID[label] ?? DISTRICT_LABEL_TO_ID[label.replace(/[구군]$/, '')] ?? null;
  }

  const englishMatch = trimmed.match(/\b([A-Za-z]+(?:-gu|-gun))\b/i);
  if (englishMatch) {
    return DISTRICT_ENGLISH_TO_ID[englishMatch[1].toLowerCase()] ?? null;
  }

  return null;
}

/** 주소 기반 이벤트 구역 (행정구역을 알 수 없으면 null) */
export function resolveEventZoneFromAddress(address: string): EventZoneId | null {
  const districtId = resolveDistrictIdFromAddress(address);
  if (!districtId) {
    return null;
  }
  return DISTRICT_ID_TO_ZONE[districtId] ?? null;
}

/** 행정 경계(PIP)로 구·군 ID — 경계 밖/미매칭이면 null */
export function resolveDistrictIdFromCoordinate(
  location: EventZoneCoordinate,
): string | null {
  for (const boundary of BUSAN_DISTRICT_BOUNDARIES) {
    if (pointInFlattenedBoundaryRings(location, boundary.rings)) {
      return boundary.districtId;
    }
  }
  return null;
}

export function resolveEventZoneFromDistrictPolygon(
  location: EventZoneCoordinate,
): EventZoneId | null {
  const districtId = resolveDistrictIdFromCoordinate(location);
  if (!districtId) {
    return null;
  }
  return DISTRICT_ID_TO_ZONE[districtId] ?? null;
}

const BOUNDARY_BY_ID = Object.fromEntries(
  BUSAN_DISTRICT_BOUNDARIES.map(boundary => [boundary.districtId, boundary]),
);

function resolveNearestDistrictIdWithinMeters(
  location: EventZoneCoordinate,
  maxMeters: number,
): string | null {
  let bestId: string | null = null;
  let bestDist = maxMeters;

  for (const bbox of DISTRICT_BBOXES) {
    if (!bboxMayReach(bbox, location, maxMeters)) {
      continue;
    }
    const boundary = BOUNDARY_BY_ID[bbox.districtId];
    if (!boundary) {
      continue;
    }
    const dist = distanceMetersToRings(location, boundary.rings);
    if (dist < bestDist) {
      bestDist = dist;
      bestId = bbox.districtId;
    }
  }
  return bestId;
}

/**
 * 현재 위치 → 채팅 존.
 * PIP → 폴리곤 변 200m → 아니면 null. 맵 상자·SVG 라벨은 쓰지 않는다.
 */
export function resolveUserEventZone(
  location: EventZoneCoordinate,
): EventZoneId | null {
  const inside = resolveEventZoneFromDistrictPolygon(location);
  if (inside) {
    return inside;
  }
  const nearId = resolveNearestDistrictIdWithinMeters(
    location,
    USER_ZONE_EDGE_MAX_METERS,
  );
  if (!nearId) {
    return null;
  }
  return DISTRICT_ID_TO_ZONE[nearId] ?? null;
}

function resolveEventZoneByNearestLabel(
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

/**
 * GPS → 이벤트 존.
 * 1) 행정구역 폴리곤(PIP)  2) 실패 시 SVG 라벨 최근접 (해안·경계 fallback)
 */
export function resolveEventZoneFromCoordinate(
  location: EventZoneCoordinate,
): EventZoneId {
  const districtId = resolveDistrictIdFromCoordinate(location);
  if (districtId) {
    const zoneId = DISTRICT_ID_TO_ZONE[districtId];
    if (zoneId) {
      return zoneId;
    }
  }
  return resolveEventZoneByNearestLabel(location);
}

/** 일정 장소: 주소 우선, 없거나 미상이면 좌표로 판별 */
export function resolveEventZoneForRoute(route: RouteItem): EventZoneId {
  const address = route.placeInfo?.address;
  if (address) {
    const fromAddress = resolveEventZoneFromAddress(address);
    if (fromAddress) {
      return fromAddress;
    }
  }
  return resolveEventZoneFromCoordinate(route.location);
}

export function getEventZoneIdForLandmark(
  location: EventZoneCoordinate,
): EventZoneId {
  return resolveEventZoneFromCoordinate(location);
}
