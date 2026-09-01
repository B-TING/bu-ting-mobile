import { Linking, Platform } from 'react-native';

import type { TravelLegMode } from '../../types/travelPlan';

export type MapDirectionsPoint = {
  lat: number;
  lng: number;
  name: string;
};

export type LegDirectionsInput = {
  from: MapDirectionsPoint;
  to: MapDirectionsPoint;
  mode: TravelLegMode;
};

export type OpenLegDirectionsResult = 'opened' | 'invalid' | 'failed';

type GoogleTravelMode = 'walking' | 'driving' | 'transit';
type KakaoRouteBy = 'FOOT' | 'CAR' | 'PUBLICTRANSIT';

function formatCoord(lat: number, lng: number): string {
  return `${lat},${lng}`;
}

export function isValidMapCoordinate(lat: number, lng: number): boolean {
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180 &&
    !(lat === 0 && lng === 0)
  );
}

export function isLegDirectionsInputValid(input: LegDirectionsInput): boolean {
  return (
    isValidMapCoordinate(input.from.lat, input.from.lng) &&
    isValidMapCoordinate(input.to.lat, input.to.lng)
  );
}

function toGoogleTravelMode(mode: TravelLegMode): GoogleTravelMode {
  if (mode === 'drive') {
    return 'driving';
  }
  if (mode === 'transit') {
    return 'transit';
  }
  return 'walking';
}

function toKakaoRouteBy(mode: TravelLegMode): KakaoRouteBy {
  if (mode === 'drive') {
    return 'CAR';
  }
  if (mode === 'transit') {
    return 'PUBLICTRANSIT';
  }
  return 'FOOT';
}

export function buildGoogleMapsDirectionsAppUrl(input: LegDirectionsInput): string {
  const travelMode = toGoogleTravelMode(input.mode);
  const saddr = encodeURIComponent(formatCoord(input.from.lat, input.from.lng));
  const daddr = encodeURIComponent(formatCoord(input.to.lat, input.to.lng));
  return `comgooglemaps://?saddr=${saddr}&daddr=${daddr}&directionsmode=${travelMode}`;
}

export function buildGoogleMapsDirectionsWebUrl(input: LegDirectionsInput): string {
  const travelMode = toGoogleTravelMode(input.mode);
  const origin = encodeURIComponent(formatCoord(input.from.lat, input.from.lng));
  const destination = encodeURIComponent(formatCoord(input.to.lat, input.to.lng));
  return `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&travelmode=${travelMode}`;
}

export function buildKakaoMapDirectionsAppUrl(input: LegDirectionsInput): string {
  const by = toKakaoRouteBy(input.mode);
  const sp = encodeURIComponent(formatCoord(input.from.lat, input.from.lng));
  const ep = encodeURIComponent(formatCoord(input.to.lat, input.to.lng));
  return `kakaomap://route?sp=${sp}&ep=${ep}&by=${by}`;
}

export function buildKakaoMapDirectionsWebUrl(input: LegDirectionsInput): string {
  const fromName = encodeURIComponent(input.from.name);
  const toName = encodeURIComponent(input.to.name);
  const fromCoord = `${input.from.lat},${input.from.lng}`;
  const toCoord = `${input.to.lat},${input.to.lng}`;
  return `https://map.kakao.com/link/route/${fromName},${fromCoord}/${toName},${toCoord}`;
}

export function buildLegDirectionsFallbackUrls(input: LegDirectionsInput): string[] {
  return [
    buildGoogleMapsDirectionsAppUrl(input),
    buildGoogleMapsDirectionsWebUrl(input),
    buildKakaoMapDirectionsAppUrl(input),
    buildKakaoMapDirectionsWebUrl(input),
  ];
}

async function tryOpenUrl(url: string): Promise<boolean> {
  try {
    const canOpen = await Linking.canOpenURL(url);
    if (!canOpen) {
      return false;
    }
    await Linking.openURL(url);
    return true;
  } catch {
    return false;
  }
}

/** Google Maps 우선, 실패 시 웹/Kakao 순으로 길찾기를 연다. */
export async function openLegDirections(
  input: LegDirectionsInput,
): Promise<OpenLegDirectionsResult> {
  if (!isLegDirectionsInputValid(input)) {
    return 'invalid';
  }

  for (const url of buildLegDirectionsFallbackUrls(input)) {
    const opened = await tryOpenUrl(url);
    if (opened) {
      return 'opened';
    }
  }

  if (Platform.OS === 'android') {
    for (const url of [
      buildGoogleMapsDirectionsWebUrl(input),
      buildKakaoMapDirectionsWebUrl(input),
    ]) {
      try {
        await Linking.openURL(url);
        return 'opened';
      } catch {
        // try next
      }
    }
  }

  return 'failed';
}
