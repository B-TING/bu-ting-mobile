import { useEffect, useState } from 'react';

import { useLocationConsent } from '../components/shared/modals';
import { DEFAULT_USER_LOCATION_BUSAN } from '../constants/eventZone/eventZone';
import type { EventZoneCoordinate } from '../types/eventZone';
import { isInsideBusanBounds } from '../utils/eventZone/zoneResolver';
import {
  getCurrentCoordinates,
  requestFineLocationPermission,
} from '../utils/location/deviceLocation';

export type PlaceMapLocationStatus = 'loading' | 'ready' | 'fallback';

/**
 * 장소 지도 검색용 초기 중심점.
 * - 동의·권한·GPS 성공 + 부산 안 → 현재 위치
 * - 그 외(거절/실패/부산 외) → 부산역 기본 좌표
 */
export function usePlaceMapUserLocation() {
  const { ensureLocationConsent } = useLocationConsent();
  const [location, setLocation] = useState<EventZoneCoordinate>(
    DEFAULT_USER_LOCATION_BUSAN,
  );
  const [status, setStatus] = useState<PlaceMapLocationStatus>('loading');

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const consent = await ensureLocationConsent();
      if (cancelled) {
        return;
      }

      if (consent !== 'accepted') {
        setLocation(DEFAULT_USER_LOCATION_BUSAN);
        setStatus('fallback');
        return;
      }

      const permission = await requestFineLocationPermission();
      if (cancelled) {
        return;
      }

      if (permission !== 'granted') {
        setLocation(DEFAULT_USER_LOCATION_BUSAN);
        setStatus('fallback');
        return;
      }

      const coords = await getCurrentCoordinates();
      if (cancelled) {
        return;
      }

      if (!coords || !isInsideBusanBounds(coords)) {
        setLocation(DEFAULT_USER_LOCATION_BUSAN);
        setStatus('fallback');
        return;
      }

      setLocation(coords);
      setStatus('ready');
    })();

    return () => {
      cancelled = true;
    };
  }, [ensureLocationConsent]);

  return { location, status };
}
