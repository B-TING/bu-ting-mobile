import { useCallback } from 'react';

import { useLocationConsent } from '../components/shared/modals';
import {
  isLegDirectionsInputValid,
  openGoogleLegDirections,
  openKakaoLegDirections,
  type LegDirectionsInput,
  type MapDirectionsPoint,
} from '../utils/map/mapDirections';
import { acquireDeviceCoordinates } from '../utils/location/acquireDeviceCoordinates';

export type DirectionsFromMeCopy = {
  directionsMyLocationLabel: string;
  directionsLocationUnavailable: string;
  directionsLocationDenied: string;
  directionsUnavailable: string;
  directionsFailed: string;
};

export type DirectionsDestination = {
  lat: number;
  lng: number;
  name: string;
  address?: string;
};

/**
 * 현 위치 → 목적지 구글/카카오 길찾기.
 * 일정 상세·장소 검색 상세에서 공유.
 */
export function useDirectionsFromMyLocation(
  copy: DirectionsFromMeCopy,
  onNotify?: (message: string) => void,
) {
  const { ensureLocationConsent } = useLocationConsent();

  const openDirectionsFromMyLocation = useCallback(
    (provider: 'google' | 'kakao', to: DirectionsDestination) => {
      void (async () => {
        const acquired = await acquireDeviceCoordinates({ ensureLocationConsent });
        if (!acquired.ok) {
          onNotify?.(
            acquired.reason === 'location_unavailable'
              ? copy.directionsLocationUnavailable
              : copy.directionsLocationDenied,
          );
          return;
        }

        const from: MapDirectionsPoint = {
          lat: acquired.coords.lat,
          lng: acquired.coords.lng,
          name: copy.directionsMyLocationLabel,
        };
        const input: LegDirectionsInput = {
          from,
          to: {
            lat: to.lat,
            lng: to.lng,
            name: to.name,
            address: to.address,
          },
          mode: 'walk',
        };

        if (!isLegDirectionsInputValid(input)) {
          onNotify?.(copy.directionsUnavailable);
          return;
        }

        const open =
          provider === 'google' ? openGoogleLegDirections : openKakaoLegDirections;
        const result = await open(input);
        if (result === 'invalid') {
          onNotify?.(copy.directionsUnavailable);
        } else if (result === 'failed') {
          onNotify?.(copy.directionsFailed);
        }
      })();
    },
    [
      copy.directionsFailed,
      copy.directionsLocationDenied,
      copy.directionsLocationUnavailable,
      copy.directionsMyLocationLabel,
      copy.directionsUnavailable,
      ensureLocationConsent,
      onNotify,
    ],
  );

  return { openDirectionsFromMyLocation };
}
