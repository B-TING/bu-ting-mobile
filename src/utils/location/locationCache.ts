/** 폴링 주기. watchPosition 추적 없음. */
export const LOCATION_POLL_INTERVAL_MS = 30_000;

/** 반경 체크에서 캐시를 유효로 보는 최대 경과 시간. 폴링 주기보다 약간 길게. */
export const LOCATION_CACHE_MAX_AGE_MS = 45_000;

/** 이보다 거친 GPS는 존 갱신에 쓰지 않는다. */
export const LOCATION_ZONE_MAX_ACCURACY_M = 500;

export function isFreshLocationCache(
  updatedAt: number | null,
  now = Date.now(),
  maxAgeMs = LOCATION_CACHE_MAX_AGE_MS,
): boolean {
  return updatedAt != null && now - updatedAt <= maxAgeMs;
}

export function isAccurateEnoughForZone(accuracyMeters?: number): boolean {
  if (accuracyMeters == null || !Number.isFinite(accuracyMeters) || accuracyMeters <= 0) {
    return true;
  }
  return accuracyMeters <= LOCATION_ZONE_MAX_ACCURACY_M;
}
