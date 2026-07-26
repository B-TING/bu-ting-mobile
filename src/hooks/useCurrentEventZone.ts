import { useEffect, useState } from 'react';

import { useLocationConsent } from '../components/shared/modals';
import { DEFAULT_USER_LOCATION_BUSAN } from '../constants/eventZone/eventZone';
import type { EventZoneCoordinate, EventZoneId } from '../types/eventZone';
import {
  isInsideBusanBounds,
  resolveEventZoneFromCoordinate,
} from '../utils/eventZone/zoneResolver';
import {
  getCurrentCoordinates,
  requestFineLocationPermission,
} from '../utils/location/deviceLocation';

export type CurrentEventZoneStatus = 'loading' | 'ready' | 'fallback';

export type CurrentEventZoneState = {
  /** 부산 안이면 구역 ID, 부산 밖·미소속이면 null */
  zoneId: EventZoneId | null;
  location: EventZoneCoordinate;
  /** GPS/권한을 쓰지 못하고 부산역 기본값으로 표시 중 */
  usedFallback: boolean;
  status: CurrentEventZoneStatus;
};

/**
 * 채팅 구역·홈 위젯용 현재 위치/구역.
 * - 동의·권한·GPS 성공 + 부산 안 → 해당 구역
 * - 부산 밖 → zoneId null (아무 구역에도 속하지 않음)
 * - 거절/실패 → 부산역 좌표 + 폴백 구역(표시용) + usedFallback
 */
export function useCurrentEventZone(): CurrentEventZoneState {
  const { ensureLocationConsent } = useLocationConsent();
  const [location, setLocation] = useState<EventZoneCoordinate>(
    DEFAULT_USER_LOCATION_BUSAN,
  );
  const [usedFallback, setUsedFallback] = useState(true);
  const [status, setStatus] = useState<CurrentEventZoneStatus>('loading');
  const [zoneId, setZoneId] = useState<EventZoneId | null>(
    resolveEventZoneFromCoordinate(DEFAULT_USER_LOCATION_BUSAN),
  );

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const consent = await ensureLocationConsent();
      if (cancelled) {
        return;
      }

      if (consent !== 'accepted') {
        setLocation(DEFAULT_USER_LOCATION_BUSAN);
        setZoneId(resolveEventZoneFromCoordinate(DEFAULT_USER_LOCATION_BUSAN));
        setUsedFallback(true);
        setStatus('fallback');
        return;
      }

      const permission = await requestFineLocationPermission();
      if (cancelled) {
        return;
      }

      if (permission !== 'granted') {
        setLocation(DEFAULT_USER_LOCATION_BUSAN);
        setZoneId(resolveEventZoneFromCoordinate(DEFAULT_USER_LOCATION_BUSAN));
        setUsedFallback(true);
        setStatus('fallback');
        return;
      }

      const coords = await getCurrentCoordinates();
      if (cancelled) {
        return;
      }

      if (!coords) {
        setLocation(DEFAULT_USER_LOCATION_BUSAN);
        setZoneId(resolveEventZoneFromCoordinate(DEFAULT_USER_LOCATION_BUSAN));
        setUsedFallback(true);
        setStatus('fallback');
        return;
      }

      setLocation(coords);
      setUsedFallback(false);

      if (!isInsideBusanBounds(coords)) {
        setZoneId(null);
        setStatus('ready');
        return;
      }

      setZoneId(resolveEventZoneFromCoordinate(coords));
      setStatus('ready');
    })().catch(() => {
      if (cancelled) {
        return;
      }
      setLocation(DEFAULT_USER_LOCATION_BUSAN);
      setZoneId(resolveEventZoneFromCoordinate(DEFAULT_USER_LOCATION_BUSAN));
      setUsedFallback(true);
      setStatus('fallback');
    });

    return () => {
      cancelled = true;
    };
  }, [ensureLocationConsent]);

  return {
    zoneId,
    location,
    usedFallback,
    status,
  };
}
