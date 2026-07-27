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
  /** 부산 안이면 구역 ID. 부산 밖·위치 미확인이면 null(채팅 미소속). */
  zoneId: EventZoneId | null;
  /** 지도 카메라 등용. 폴백 시 부산역. */
  location: EventZoneCoordinate;
  /** GPS/권한을 쓰지 못함 (채팅 소속으로 부산에 있다고 치지 않음) */
  usedFallback: boolean;
  status: CurrentEventZoneStatus;
};

function applyFallback(
  setLocation: (v: EventZoneCoordinate) => void,
  setZoneId: (v: EventZoneId | null) => void,
  setUsedFallback: (v: boolean) => void,
  setStatus: (v: CurrentEventZoneStatus) => void,
) {
  // 지도 폴백용 좌표만 부산역. 채팅 구역 소속은 부여하지 않음.
  setLocation(DEFAULT_USER_LOCATION_BUSAN);
  setZoneId(null);
  setUsedFallback(true);
  setStatus('fallback');
}

/**
 * 채팅 구역·홈 위젯용 현재 위치/구역.
 * - 동의·권한·GPS 성공 + 부산 안 → 해당 구역
 * - 부산 밖 → zoneId null (미소속)
 * - 거절/실패 → zoneId null + usedFallback (부산에 있다고 표시하지 않음)
 */
export function useCurrentEventZone(): CurrentEventZoneState {
  const { ensureLocationConsent } = useLocationConsent();
  const [location, setLocation] = useState<EventZoneCoordinate>(
    DEFAULT_USER_LOCATION_BUSAN,
  );
  const [usedFallback, setUsedFallback] = useState(false);
  const [status, setStatus] = useState<CurrentEventZoneStatus>('loading');
  const [zoneId, setZoneId] = useState<EventZoneId | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const consent = await ensureLocationConsent();
      if (cancelled) {
        return;
      }

      if (consent !== 'accepted') {
        applyFallback(setLocation, setZoneId, setUsedFallback, setStatus);
        return;
      }

      const permission = await requestFineLocationPermission();
      if (cancelled) {
        return;
      }

      if (permission !== 'granted') {
        applyFallback(setLocation, setZoneId, setUsedFallback, setStatus);
        return;
      }

      const coords = await getCurrentCoordinates();
      if (cancelled) {
        return;
      }

      if (!coords) {
        applyFallback(setLocation, setZoneId, setUsedFallback, setStatus);
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
      applyFallback(setLocation, setZoneId, setUsedFallback, setStatus);
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
