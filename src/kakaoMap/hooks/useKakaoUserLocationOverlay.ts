import { useEffect, useMemo } from 'react';

import { useLocationStore } from '../../stores/useLocationStore';
import { resolveUserEventZone } from '../../utils/eventZone/zoneResolver';
import {
  isAccurateEnoughForZone,
  isFreshLocationCache,
} from '../../utils/location/locationCache';
import { refreshLocationCacheIfPermitted } from '../../utils/location/refreshLocationCache';
import type { KakaoMapUserLocationOverlay } from '../overlays/types';

const USER_LOCATION_OVERLAY_ID = 'user-location';

/**
 * 부산 안 + 신선·정확 캐시일 때만 현재 위치 오버레이.
 * 동의/권한 없으면 조용히 생략 (다이얼로그 없음).
 */
export function useKakaoUserLocationOverlay(
  enabled: boolean,
): KakaoMapUserLocationOverlay | null {
  const coords = useLocationStore(s => s.coords);
  const updatedAt = useLocationStore(s => s.updatedAt);

  useEffect(() => {
    if (!enabled) {
      return;
    }
    void refreshLocationCacheIfPermitted();
  }, [enabled]);

  return useMemo(() => {
    if (!enabled || !coords || !isFreshLocationCache(updatedAt)) {
      return null;
    }
    if (!isAccurateEnoughForZone(coords.accuracyMeters)) {
      return null;
    }
    if (resolveUserEventZone(coords) == null) {
      return null;
    }
    return {
      kind: 'user',
      id: USER_LOCATION_OVERLAY_ID,
      lat: coords.lat,
      lng: coords.lng,
      zIndex: 20,
    };
  }, [enabled, coords, updatedAt]);
}
