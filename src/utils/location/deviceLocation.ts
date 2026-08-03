import { PermissionsAndroid, Platform } from 'react-native';
import Geolocation from '@react-native-community/geolocation';

import type { EventZoneCoordinate } from '../../types/eventZone';

export type LocationPermissionResult = 'granted' | 'denied' | 'unavailable';

/**
 * Android: ACCESS_FINE_LOCATION 런타임 요청.
 * iOS: Info.plist WhenInUse 문구 기준으로 getCurrentPosition 시 시스템 다이얼로그가 뜸.
 */
export async function requestFineLocationPermission(): Promise<LocationPermissionResult> {
  if (Platform.OS !== 'android') {
    return 'granted';
  }

  try {
    const result = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
    );
    if (result === PermissionsAndroid.RESULTS.GRANTED) {
      return 'granted';
    }
    return 'denied';
  } catch {
    return 'unavailable';
  }
}

/** 앱 사용 중(foreground) 현재 좌표. 실패 시 null. */
export function getCurrentCoordinates(): Promise<EventZoneCoordinate | null> {
  const readOnce = (enableHighAccuracy: boolean) =>
    new Promise<EventZoneCoordinate | null>(resolve => {
      Geolocation.getCurrentPosition(
        position => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        () => resolve(null),
        {
          enableHighAccuracy,
          timeout: enableHighAccuracy ? 12_000 : 8_000,
          // 구역 판별은 캐시된(옛) 부산 좌표로 오인되면 안 됨
          maximumAge: 0,
        },
      );
    });

  return readOnce(true).then(coords => coords ?? readOnce(false));
}
