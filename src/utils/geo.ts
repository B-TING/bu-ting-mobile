import type { TravelLeg, TravelLegMode } from '../types/travelPlan';

export function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** 네이버 길찾기 API 대체: 직선거리 기반 추정 이동 */
export function estimateTravelLeg(
  from: { lat: number; lng: number },
  to: { lat: number; lng: number },
  preferredMode?: TravelLegMode,
): TravelLeg {
  const km = haversineKm(from.lat, from.lng, to.lat, to.lng);
  const mode =
    preferredMode ??
    (km < 0.8 ? 'walk' : km < 4 ? 'transit' : 'drive');

  if (mode === 'walk') {
    return {
      mode: 'walk',
      durationMinutes: Math.max(3, Math.round(km * 12)),
      distanceKm: Math.round(km * 10) / 10,
    };
  }
  if (mode === 'transit') {
    return {
      mode: 'transit',
      durationMinutes: Math.max(8, Math.round(km * 5)),
      distanceKm: Math.round(km * 10) / 10,
    };
  }
  return {
    mode: 'drive',
    durationMinutes: Math.max(10, Math.round(km * 3)),
    distanceKm: Math.round(km * 10) / 10,
  };
}

export function formatWeekdayDate(dateIso: string, lang: string): string {
  const d = new Date(dateIso);
  const weekdaysKo = ['일', '월', '화', '수', '목', '금', '토'];
  const weekdaysEn = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const wd =
    lang === 'ko' ? weekdaysKo[d.getDay()] : weekdaysEn[d.getDay()];
  const m = d.getMonth() + 1;
  const day = d.getDate();
  return lang === 'ko' ? `${wd} ${m}/${day}` : `${wd} ${m}/${day}`;
}
