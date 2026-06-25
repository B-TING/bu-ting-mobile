import {
  KAKAO_CAR_DIRECTIONS_URL,
  KAKAO_MOBILITY_SERVICE_NAME,
  KAKAO_WALKING_DIRECTIONS_URL,
} from '../../constants/map/kakaoMobilityConfig';
import { KAKAO_REST_API_KEY } from '../../constants/map/kakaoMapConfig';
import type { TravelLegMode } from '../../types/travelPlan';
import type { MapPoint } from '../../utils/geo/mapRegion';

type KakaoCoord = { lat: number; lng: number };

type KakaoRoad = {
  vertexes?: number[];
};

type KakaoSection = {
  roads?: KakaoRoad[];
};

type KakaoRoute = {
  result_code?: number;
  sections?: KakaoSection[];
};

type KakaoDirectionsResponse = {
  routes?: KakaoRoute[];
};

const routePathCache = new Map<string, KakaoCoord[]>();

function coordKey(point: KakaoCoord): string {
  return `${point.lng.toFixed(5)},${point.lat.toFixed(5)}`;
}

function segmentCacheKey(from: KakaoCoord, to: KakaoCoord, mode: TravelLegMode): string {
  return `${mode}:${coordKey(from)}>${coordKey(to)}`;
}

function toKakaoPair(point: KakaoCoord): string {
  return `${point.lng},${point.lat}`;
}

function parseVertexes(vertexes: number[]): KakaoCoord[] {
  const points: KakaoCoord[] = [];
  for (let i = 0; i + 1 < vertexes.length; i += 2) {
    const lng = vertexes[i];
    const lat = vertexes[i + 1];
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      points.push({ lat, lng });
    }
  }
  return points;
}

function extractPathFromResponse(data: KakaoDirectionsResponse): KakaoCoord[] {
  const route = data.routes?.[0];
  if (!route || (route.result_code != null && route.result_code !== 0)) {
    return [];
  }

  const points: KakaoCoord[] = [];
  for (const section of route.sections ?? []) {
    for (const road of section.roads ?? []) {
      if (!road.vertexes?.length) {
        continue;
      }
      const segment = parseVertexes(road.vertexes);
      if (segment.length === 0) {
        continue;
      }
      if (points.length > 0) {
        const last = points[points.length - 1];
        const first = segment[0];
        if (
          Math.abs(last.lat - first.lat) < 0.00001 &&
          Math.abs(last.lng - first.lng) < 0.00001
        ) {
          points.push(...segment.slice(1));
        } else {
          points.push(...segment);
        }
      } else {
        points.push(...segment);
      }
    }
  }
  return points;
}

async function fetchDirections(
  url: string,
  params: Record<string, string>,
): Promise<KakaoCoord[]> {
  if (!KAKAO_REST_API_KEY) {
    return [];
  }

  const search = new URLSearchParams({ ...params, summary: 'false' });
  const response = await fetch(`${url}?${search.toString()}`, {
    headers: {
      Authorization: `KakaoAK ${KAKAO_REST_API_KEY}`,
      'Content-Type': 'application/json',
      service: KAKAO_MOBILITY_SERVICE_NAME,
    },
  });

  if (!response.ok) {
    return [];
  }

  const data = (await response.json()) as KakaoDirectionsResponse;
  return extractPathFromResponse(data);
}

function resolveDirectionsMode(mode: TravelLegMode): 'walk' | 'drive' {
  return mode === 'drive' ? 'drive' : 'walk';
}

async function fetchSegmentPath(
  from: KakaoCoord,
  to: KakaoCoord,
  mode: TravelLegMode,
): Promise<KakaoCoord[]> {
  const cacheKey = segmentCacheKey(from, to, mode);
  const cached = routePathCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const travelMode = resolveDirectionsMode(mode);
  const path =
    travelMode === 'drive'
      ? await fetchDirections(KAKAO_CAR_DIRECTIONS_URL, {
          origin: toKakaoPair(from),
          destination: toKakaoPair(to),
          priority: 'RECOMMEND',
          car_fuel: 'GASOLINE',
          car_hipass: 'false',
          alternatives: 'false',
          road_details: 'false',
        })
      : await fetchDirections(KAKAO_WALKING_DIRECTIONS_URL, {
          origin: toKakaoPair(from),
          destination: toKakaoPair(to),
          priority: 'DISTANCE',
        });

  routePathCache.set(cacheKey, path);
  return path;
}

function appendPath(target: KakaoCoord[], segment: KakaoCoord[]): KakaoCoord[] {
  if (segment.length === 0) {
    return target;
  }
  if (target.length === 0) {
    return [...segment];
  }
  const last = target[target.length - 1];
  const first = segment[0];
  if (
    Math.abs(last.lat - first.lat) < 0.00001 &&
    Math.abs(last.lng - first.lng) < 0.00001
  ) {
    return [...target, ...segment.slice(1)];
  }
  return [...target, ...segment];
}

function straightSegment(from: KakaoCoord, to: KakaoCoord): KakaoCoord[] {
  return [from, to];
}

/** Íµ¨Í∞ÑÎ≥?Ïπ¥Ïπ¥??Í∏∏Ï∞æÍ∏?Í≤ΩÎ°ú (?§Ìå® ??ÏßÅÏÑ† fallback) */
export async function fetchKakaoRouteSegmentPath(
  from: MapPoint,
  to: MapPoint,
  mode: TravelLegMode = 'walk',
): Promise<KakaoCoord[]> {
  const origin = { lat: from.lat, lng: from.lng };
  const destination = { lat: to.lat, lng: to.lng };

  try {
    const path = await fetchSegmentPath(origin, destination, mode);
    if (path.length >= 2) {
      return path;
    }
  } catch {
    // fallback below
  }

  return straightSegment(origin, destination);
}

/** Day ?ºÏ†ï ?ÑÏ≤¥Î•??úÏÑú?ÄÎ°??áÎäî ?ÅÏÑ∏ Í≤ΩÎ°ú */
export async function fetchKakaoDayRoutePath(
  stops: Array<{ location: MapPoint; legMode?: TravelLegMode }>,
): Promise<KakaoCoord[]> {
  if (stops.length < 2) {
    return [];
  }

  let merged: KakaoCoord[] = [];
  for (let index = 0; index < stops.length - 1; index += 1) {
    const from = stops[index].location;
    const to = stops[index + 1].location;
    const mode = stops[index + 1].legMode ?? 'walk';
    const segment = await fetchKakaoRouteSegmentPath(from, to, mode);
    merged = appendPath(merged, segment);
  }

  return merged;
}
