import { DEFAULT_USER_LOCATION_BUSAN } from '../../constants/eventZone/eventZone';
import type { EventZoneCoordinate } from '../../types/eventZone';
import { isInsideBusanBounds } from '../eventZone/zoneResolver';
import type { LocationConsentResult } from '../../components/shared/modals';
import {
  getCurrentCoordinates,
  requestFineLocationPermission,
} from './deviceLocation';

export type BusanSearchLocationResult = {
  location: EventZoneCoordinate;
  status: 'ready' | 'fallback';
};

/**
 * 동의 → fine location → GPS.
 * 부산 안이면 현재 위치, 그 외(거절/실패/부산 외)면 부산역.
 */
export async function resolveBusanSearchLocation(
  ensureLocationConsent: () => Promise<LocationConsentResult>,
): Promise<BusanSearchLocationResult> {
  const consent = await ensureLocationConsent();
  if (consent !== 'accepted') {
    return { location: DEFAULT_USER_LOCATION_BUSAN, status: 'fallback' };
  }

  const permission = await requestFineLocationPermission();
  if (permission !== 'granted') {
    return { location: DEFAULT_USER_LOCATION_BUSAN, status: 'fallback' };
  }

  const coords = await getCurrentCoordinates();
  if (!coords || !isInsideBusanBounds(coords)) {
    return { location: DEFAULT_USER_LOCATION_BUSAN, status: 'fallback' };
  }

  return { location: coords, status: 'ready' };
}
