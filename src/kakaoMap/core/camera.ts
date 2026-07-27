export type MapPoint = {
  lat: number;
  lng: number;
};

export type MapRegion = {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
};

export type MapCamera = {
  lat: number;
  lng: number;
  zoomLevel: number;
};

const DEFAULT_LAT_DELTA = 0.02;
const DEFAULT_LNG_DELTA = 0.03;

const FOCUS_LAT_DELTA = 0.008;
const FOCUS_LNG_DELTA = 0.012;
/** 단일 장소 포커스 시 카카오맵 줌 (3=광역, 5=동네, 8=블록) */
const FOCUS_ZOOM_LEVEL = 8;

/** 일정 Day 선택 시 지도 스케일 (km) */
export const SCHEDULE_DAY_FOCUS_KM_SPAN = 4;
/** 카카오맵 level 7 ≈ 4km, level 8 ≈ 2km (부산 위도 기준) */
export const SCHEDULE_DAY_FOCUS_ZOOM_LEVEL = 9;

export function toMapCoordinate(point: MapPoint) {
  return { latitude: point.lat, longitude: point.lng };
}

/** kmSpan → 카카오맵 level (숫자가 클수록 확대) */
export function kmSpanToZoomLevel(kmSpan: number): number {
  if (kmSpan >= 100) {
    return 3;
  }
  if (kmSpan >= 50) {
    return 4;
  }
  if (kmSpan >= 20) {
    return 5;
  }
  if (kmSpan >= 10) {
    return 6;
  }
  if (kmSpan >= 4) {
    return 7;
  }
  if (kmSpan >= 2) {
    return 8;
  }
  if (kmSpan >= 1) {
    return 9;
  }
  if (kmSpan >= 0.5) {
    return 10;
  }
  return 11;
}

function latDeltaToZoomLevel(latDelta: number): number {
  return kmSpanToZoomLevel(latDelta * 111);
}

export function regionFromPoints(
  points: MapPoint[],
  options?: { focus?: MapPoint; latDelta?: number; lngDelta?: number },
): MapRegion {
  if (options?.focus) {
    return {
      latitude: options.focus.lat,
      longitude: options.focus.lng,
      latitudeDelta: options.latDelta ?? FOCUS_LAT_DELTA,
      longitudeDelta: options.lngDelta ?? FOCUS_LNG_DELTA,
    };
  }

  if (points.length === 0) {
    return {
      latitude: 35.1796,
      longitude: 129.0756,
      latitudeDelta: 0.12,
      longitudeDelta: 0.12,
    };
  }

  const lats = points.map(point => point.lat);
  const lngs = points.map(point => point.lng);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);

  const latitudeDelta = Math.max((maxLat - minLat) * 1.45, DEFAULT_LAT_DELTA);
  const longitudeDelta = Math.max((maxLng - minLng) * 1.45, DEFAULT_LNG_DELTA);

  return {
    latitude: (minLat + maxLat) / 2,
    longitude: (minLng + maxLng) / 2,
    latitudeDelta,
    longitudeDelta,
  };
}

export function cameraFromPoints(
  points: MapPoint[],
  options?: {
    focus?: MapPoint;
    latDelta?: number;
    lngDelta?: number;
    /** 고정 지도 스케일(km) — bbox 줌 대신 사용 */
    kmSpan?: number;
  },
): MapCamera {
  const region = regionFromPoints(points, options);
  let zoomLevel: number;
  if (options?.kmSpan === SCHEDULE_DAY_FOCUS_KM_SPAN) {
    zoomLevel = SCHEDULE_DAY_FOCUS_ZOOM_LEVEL;
  } else if (options?.kmSpan != null) {
    zoomLevel = kmSpanToZoomLevel(options.kmSpan);
  } else if (options?.focus) {
    zoomLevel = FOCUS_ZOOM_LEVEL;
  } else {
    zoomLevel = latDeltaToZoomLevel(region.latitudeDelta);
  }
  return {
    lat: region.latitude,
    lng: region.longitude,
    zoomLevel,
  };
}
