import type { LocationConsentResult } from '../../components/shared/modals/LocationConsentProvider';
import { getCachedCoordinates, useLocationStore } from '../../stores/useLocationStore';
import type { ZoneEvent } from '../../types/eventZone';
import {
  getCurrentCoordinates,
  requestFineLocationPermission,
} from '../location/deviceLocation';
import {
  evaluateAuthRadius,
  type AuthRadiusEvaluation,
} from './authRadius';

export type EventAuthLocationCheck =
  | AuthRadiusEvaluation
  | { status: 'consent_denied' }
  | { status: 'permission_denied' }
  | { status: 'location_unavailable' };

/**
 * 동의 → 권한 → GPS → 인증 반경 판정.
 * Phase 1: 반경 안에서만 참여·촬영 허용.
 */
export async function checkEventAuthLocation(
  event: ZoneEvent,
  ensureLocationConsent: () => Promise<LocationConsentResult>,
): Promise<EventAuthLocationCheck> {
  const consent = await ensureLocationConsent();
  if (consent !== 'accepted') {
    return { status: 'consent_denied' };
  }

  const permission = await requestFineLocationPermission();
  if (permission !== 'granted') {
    return { status: 'permission_denied' };
  }

  const cached = getCachedCoordinates();
  const coords = cached ?? (await getCurrentCoordinates());
  if (!coords) {
    return { status: 'location_unavailable' };
  }

  if (!cached) {
    useLocationStore.getState().setCoords(coords);
  }

  return evaluateAuthRadius(coords, event);
}
