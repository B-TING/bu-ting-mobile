import type { LocationConsentResult } from '../../components/shared/modals';
import type { ZoneEvent } from '../../types/eventZone';
import { acquireDeviceCoordinates } from '../location/acquireDeviceCoordinates';
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
 * 동의 → 권한 → GPS(캐시 우선) → 인증 반경 판정.
 * Phase 1: 반경 안에서만 참여·촬영 허용.
 */
export async function checkEventAuthLocation(
  event: ZoneEvent,
  ensureLocationConsent: () => Promise<LocationConsentResult>,
): Promise<EventAuthLocationCheck> {
  const acquired = await acquireDeviceCoordinates({ ensureLocationConsent });
  if (!acquired.ok) {
    return { status: acquired.reason };
  }

  return evaluateAuthRadius(acquired.coords, event);
}
