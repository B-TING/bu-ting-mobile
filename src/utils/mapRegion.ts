import type { Region } from 'react-native-maps';

export type MapPoint = {
  lat: number;
  lng: number;
};

const DEFAULT_LAT_DELTA = 0.02;
const DEFAULT_LNG_DELTA = 0.03;

const FOCUS_LAT_DELTA = 0.024;
const FOCUS_LNG_DELTA = 0.036;

export function toMapCoordinate(point: MapPoint) {
  return { latitude: point.lat, longitude: point.lng };
}

export function regionFromPoints(
  points: MapPoint[],
  options?: { focus?: MapPoint; latDelta?: number; lngDelta?: number },
): Region {
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
