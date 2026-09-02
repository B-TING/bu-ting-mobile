import { useCallback, useRef, useState } from 'react';
import { Alert } from 'react-native';

import { useLocationConsent } from '../../components/shared/modals';
import { useCopy } from '../../i18n';
import type { ZoneEvent } from '../../types/eventZone';
import { checkEventAuthLocation } from '../../utils/eventZone/checkEventAuthLocation';

/** 참여·촬영 전에 GPS 반경을 검사하고, 실패 시 Alert. */
export function useEventAuthRadiusGate() {
  const copy = useCopy('eventGame');
  const { ensureLocationConsent } = useLocationConsent();
  const [checking, setChecking] = useState(false);
  const checkingRef = useRef(false);

  const assertWithinRadius = useCallback(
    async (event: ZoneEvent): Promise<boolean> => {
      if (checkingRef.current) {
        return false;
      }

      checkingRef.current = true;
      setChecking(true);
      try {
        const result = await checkEventAuthLocation(
          event,
          ensureLocationConsent,
        );

        if (result.status === 'inside') {
          return true;
        }

        if (result.status === 'outside') {
          const distanceM = Number.isFinite(result.distanceM)
            ? Math.round(result.distanceM)
            : null;
          Alert.alert(
            copy.outOfRadiusTitle,
            distanceM != null
              ? copy.outOfRadiusMessage(distanceM, result.radiusM)
              : copy.outOfRadiusHint,
          );
          return false;
        }

        if (
          result.status === 'consent_denied' ||
          result.status === 'permission_denied'
        ) {
          Alert.alert(copy.locationDeniedTitle, copy.locationDeniedMessage);
          return false;
        }

        if (result.status === 'location_unavailable') {
          Alert.alert(
            copy.locationUnavailableTitle,
            copy.locationUnavailableMessage,
          );
          return false;
        }

        Alert.alert(copy.outOfRadiusTitle, copy.outOfRadiusHint);
        return false;
      } finally {
        checkingRef.current = false;
        setChecking(false);
      }
    },
    [copy, ensureLocationConsent],
  );

  return { checking, assertWithinRadius };
}
