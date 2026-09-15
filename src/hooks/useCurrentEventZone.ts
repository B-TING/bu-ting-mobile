import { useEffect, useMemo, useState } from 'react';

import { useLocationConsent } from '../components/shared/modals';
import { DEFAULT_USER_LOCATION_BUSAN } from '../constants/eventZone/eventZone';
import { useLocationStore } from '../stores/useLocationStore';
import type { EventZoneCoordinate, EventZoneId } from '../types/eventZone';
import {
  confirmUserZone,
  peekCommittedUserZone,
  resetUserZoneHysteresis,
} from '../utils/eventZone/userZoneHysteresis';
import { resolveUserEventZone } from '../utils/eventZone/zoneResolver';
import { acquireDeviceCoordinates } from '../utils/location/acquireDeviceCoordinates';
import {
  isAccurateEnoughForZone,
  isFreshLocationCache,
} from '../utils/location/locationCache';

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

export type UseCurrentEventZoneOptions = {
  /**
   * false면 동의 모달·GPS 요청 없이 캐시만 쓴다.
   * 온보딩 가이드처럼 메인 홈을 미리보기할 때 사용.
   */
  requestLocation?: boolean;
};

/**
 * 채팅 구역·홈 위젯용 현재 위치/구역.
 * - LocationStore 캐시/폴링과 연동 (#182)
 * - 좌표 확보는 `acquireDeviceCoordinates` 단일 파이프라인
 * - 소속: 구 폴리곤 PIP → 변 200m. 맵 상자·라벨 최근접 없음
 * - 신선·정확 좌표만 존 갱신. 전환은 연속 2샘플
 * - 거절/실패/만료 → zoneId null + usedFallback
 */
export function useCurrentEventZone(
  options?: UseCurrentEventZoneOptions,
): CurrentEventZoneState {
  const requestLocation = options?.requestLocation ?? true;
  const { ensureLocationConsent } = useLocationConsent();
  const coords = useLocationStore(s => s.coords);
  const updatedAt = useLocationStore(s => s.updatedAt);
  const [bootStatus, setBootStatus] = useState<CurrentEventZoneStatus>(() => {
    if (coords) {
      return 'ready';
    }
    return requestLocation ? 'loading' : 'fallback';
  });
  const [zoneId, setZoneId] = useState<EventZoneId | null>(null);

  useEffect(() => {
    if (coords) {
      setBootStatus('ready');
    }
  }, [coords]);

  useEffect(() => {
    if (!requestLocation) {
      if (!useLocationStore.getState().coords) {
        setBootStatus('fallback');
      }
      return;
    }

    if (useLocationStore.getState().coords) {
      return;
    }

    let cancelled = false;

    (async () => {
      setBootStatus('loading');

      const acquired = await acquireDeviceCoordinates({ ensureLocationConsent });
      if (cancelled) {
        return;
      }

      setBootStatus(acquired.ok ? 'ready' : 'fallback');
    })().catch(() => {
      if (cancelled) {
        return;
      }
      setBootStatus('fallback');
    });

    return () => {
      cancelled = true;
    };
  }, [ensureLocationConsent, requestLocation]);

  const isFresh = isFreshLocationCache(updatedAt);
  const isAccurate = isAccurateEnoughForZone(coords?.accuracyMeters);

  useEffect(() => {
    if (!coords || !isFresh) {
      resetUserZoneHysteresis();
      setZoneId(null);
      return;
    }

    if (!isAccurate) {
      setZoneId(peekCommittedUserZone());
      return;
    }

    const sampleKey = `${updatedAt}:${coords.lat}:${coords.lng}`;
    setZoneId(confirmUserZone(resolveUserEventZone(coords), sampleKey));
  }, [coords, updatedAt, isFresh, isAccurate]);

  return useMemo((): CurrentEventZoneState => {
    if (coords && isFresh) {
      return {
        zoneId,
        location: coords,
        usedFallback: false,
        status: 'ready',
      };
    }

    if (coords && !isFresh) {
      return {
        zoneId: null,
        location: coords,
        usedFallback: true,
        status: 'fallback',
      };
    }

    if (bootStatus === 'loading') {
      return {
        zoneId: null,
        location: DEFAULT_USER_LOCATION_BUSAN,
        usedFallback: false,
        status: 'loading',
      };
    }

    return {
      zoneId: null,
      location: DEFAULT_USER_LOCATION_BUSAN,
      usedFallback: true,
      status: 'fallback',
    };
  }, [bootStatus, coords, isFresh, zoneId]);
}
