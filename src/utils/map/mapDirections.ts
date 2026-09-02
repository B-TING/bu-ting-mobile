import { Linking, Platform } from 'react-native';

import type { TravelLegMode } from '../../types/travelPlan';

export type MapDirectionsPoint = {
  lat: number;
  lng: number;
  name: string;
  address?: string;
};

export type LegDirectionsInput = {
  from: MapDirectionsPoint;
  to: MapDirectionsPoint;
  mode: TravelLegMode;
};

export type OpenLegDirectionsResult = 'opened' | 'invalid' | 'failed';

type GoogleTravelMode = 'walking' | 'driving' | 'transit';

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

/** Google 길찾기 — 주소 → 좌표 → 장소명 */
export function resolveGoogleDirectionsLabel(point: MapDirectionsPoint): string {
  const address = point.address?.trim();
  if (address) {
    return address;
  }
  if (isValidMapCoordinate(point.lat, point.lng)) {
    return formatCoord(point.lat, point.lng);
  }
  const name = point.name?.trim();
  if (name) {
    return name;
  }
  return formatCoord(point.lat, point.lng);
}

/** Kakao 길찾기 라벨 — 주소 → 좌표 → 장소명 */
function resolveKakaoRouteLabel(point: MapDirectionsPoint): string {
  const address = point.address?.trim();
  if (address) {
    return address;
  }
  if (isValidMapCoordinate(point.lat, point.lng)) {
    return formatCoord(point.lat, point.lng);
  }
  const name = point.name?.trim();
  if (name) {
    return name;
  }
  return '장소';
}

function hasDirectionsEndpoint(point: MapDirectionsPoint): boolean {
  if (point.address?.trim()) {
    return true;
  }
  if (isValidMapCoordinate(point.lat, point.lng)) {
    return true;
  }
  if (point.name?.trim()) {
    return true;
  }
  return false;
}

export function isLegDirectionsInputValid(input: LegDirectionsInput): boolean {
  return hasDirectionsEndpoint(input.from) && hasDirectionsEndpoint(input.to);
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

function toKakaoAppTravelMode(mode: TravelLegMode): 'foot' | 'car' | 'publictransit' {
  if (mode === 'drive') {
    return 'car';
  }
  if (mode === 'transit') {
    return 'publictransit';
  }
  return 'foot';
}

function toKakaoWebTravelMode(mode: TravelLegMode): 'walk' | 'car' | 'traffic' {
  if (mode === 'drive') {
    return 'car';
  }
  if (mode === 'transit') {
    return 'traffic';
  }
  return 'walk';
}

export function buildGoogleMapsDirectionsAppUrl(input: LegDirectionsInput): string {
  const travelMode = toGoogleTravelMode(input.mode);
  const saddr = encodeURIComponent(resolveGoogleDirectionsLabel(input.from));
  const daddr = encodeURIComponent(resolveGoogleDirectionsLabel(input.to));
  return `comgooglemaps://?saddr=${saddr}&daddr=${daddr}&directionsmode=${travelMode}`;
}

export function buildGoogleMapsDirectionsWebUrl(input: LegDirectionsInput): string {
  const travelMode = toGoogleTravelMode(input.mode);
  const origin = encodeURIComponent(resolveGoogleDirectionsLabel(input.from));
  const destination = encodeURIComponent(resolveGoogleDirectionsLabel(input.to));
  return `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&travelmode=${travelMode}`;
}

function buildKakaoRouteQuery(input: LegDirectionsInput): string {
  const sp = formatCoord(input.from.lat, input.from.lng);
  const ep = formatCoord(input.to.lat, input.to.lng);
  const by = toKakaoAppTravelMode(input.mode);
  const params = [`sp=${sp}`, `ep=${ep}`, `by=${by}`];
  const sn = resolveKakaoRouteLabel(input.from);
  const en = resolveKakaoRouteLabel(input.to);
  if (sn) {
    params.push(`sn=${encodeURIComponent(sn)}`);
  }
  if (en) {
    params.push(`en=${encodeURIComponent(en)}`);
  }
  return params.join('&');
}

export function buildKakaoMapDirectionsAppUrl(input: LegDirectionsInput): string {
  return `kakaomap://route?${buildKakaoRouteQuery(input)}`;
}

export function buildKakaoMapDirectionsMobileWebUrl(input: LegDirectionsInput): string {
  return `http://m.map.kakao.com/scheme/route?${buildKakaoRouteQuery(input)}`;
}

/** Kakao 지도 Web API — /link/by/{mode}/{이름,위도,경도}/{이름,위도,경도} */
function formatKakaoLinkPoint(point: MapDirectionsPoint): string {
  const label = encodeURIComponent(resolveKakaoRouteLabel(point));
  const lat = isValidMapCoordinate(point.lat, point.lng) ? point.lat : 0;
  const lng = isValidMapCoordinate(point.lat, point.lng) ? point.lng : 0;
  return `${label},${lat},${lng}`;
}

export function buildKakaoMapDirectionsWebUrl(input: LegDirectionsInput): string {
  const by = toKakaoWebTravelMode(input.mode);
  const from = formatKakaoLinkPoint(input.from);
  const to = formatKakaoLinkPoint(input.to);
  return `https://map.kakao.com/link/by/${by}/${from}/${to}`;
}

function buildGoogleLegDirectionsUrls(input: LegDirectionsInput): string[] {
  return [buildGoogleMapsDirectionsAppUrl(input), buildGoogleMapsDirectionsWebUrl(input)];
}

function buildKakaoLegDirectionsUrls(input: LegDirectionsInput): string[] {
  const urls: string[] = [];
  if (
    isValidMapCoordinate(input.from.lat, input.from.lng) &&
    isValidMapCoordinate(input.to.lat, input.to.lng)
  ) {
    urls.push(buildKakaoMapDirectionsAppUrl(input));
    urls.push(buildKakaoMapDirectionsMobileWebUrl(input));
  }
  urls.push(buildKakaoMapDirectionsWebUrl(input));
  return urls;
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

async function openDirectionsUrls(urls: string[]): Promise<boolean> {
  for (const url of urls) {
    if (await tryOpenUrl(url)) {
      return true;
    }
  }
  if (Platform.OS === 'android' && urls.length > 0) {
    try {
      await Linking.openURL(urls[urls.length - 1]!);
      return true;
    } catch {
      return false;
    }
  }
  return false;
}

/** Google Maps 앱 → 웹 */
export async function openGoogleLegDirections(
  input: LegDirectionsInput,
): Promise<OpenLegDirectionsResult> {
  if (!isLegDirectionsInputValid(input)) {
    return 'invalid';
  }
  return (await openDirectionsUrls(buildGoogleLegDirectionsUrls(input)))
    ? 'opened'
    : 'failed';
}

/** 카카오맵 앱 → 모바일웹 스킴 → 웹 */
export async function openKakaoLegDirections(
  input: LegDirectionsInput,
): Promise<OpenLegDirectionsResult> {
  if (!isLegDirectionsInputValid(input)) {
    return 'invalid';
  }
  return (await openDirectionsUrls(buildKakaoLegDirectionsUrls(input)))
    ? 'opened'
    : 'failed';
}

export function buildLegDirectionsFallbackUrls(input: LegDirectionsInput): string[] {
  return [
    buildGoogleMapsDirectionsAppUrl(input),
    buildGoogleMapsDirectionsWebUrl(input),
    buildKakaoMapDirectionsAppUrl(input),
    buildKakaoMapDirectionsMobileWebUrl(input),
    buildKakaoMapDirectionsWebUrl(input),
  ];
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
