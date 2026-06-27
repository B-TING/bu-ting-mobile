import { useEffect, useMemo, useState } from 'react';

import { DEFAULT_USER_LOCATION } from '../constants/eventZone/eventZone';
import type { EventZoneCoordinate, EventZoneId } from '../types/eventZone';
import { resolveEventZoneFromCoordinate } from '../utils/eventZone/zoneResolver';

type GeolocationLike = {
  getCurrentPosition: (
    success: (position: { coords: { latitude: number; longitude: number } }) => void,
    error?: () => void,
    options?: { enableHighAccuracy?: boolean; timeout?: number; maximumAge?: number },
  ) => void;
};

function readDeviceLocation(): Promise<EventZoneCoordinate | null> {
  const geolocation = (
    globalThis as typeof globalThis & {
      navigator?: { geolocation?: GeolocationLike };
    }
  ).navigator?.geolocation;

  if (!geolocation) {
    return Promise.resolve(null);
  }

  return new Promise(resolve => {
    geolocation.getCurrentPosition(
      position => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      () => resolve(null),
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 60_000 },
    );
  });
}

export function useCurrentEventZone() {
  const [location, setLocation] = useState<EventZoneCoordinate>(DEFAULT_USER_LOCATION);
  const [usedFallback, setUsedFallback] = useState(true);

  useEffect(() => {
    let cancelled = false;

    readDeviceLocation().then(deviceLocation => {
      if (cancelled) {
        return;
      }
      if (deviceLocation) {
        setLocation(deviceLocation);
        setUsedFallback(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const zoneId = useMemo(
    () => resolveEventZoneFromCoordinate(location),
    [location],
  );

  return {
    zoneId,
    location,
    usedFallback,
  };
}

export type CurrentEventZoneState = {
  zoneId: EventZoneId;
  location: EventZoneCoordinate;
  usedFallback: boolean;
};
