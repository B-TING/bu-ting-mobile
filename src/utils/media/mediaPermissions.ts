import { PermissionsAndroid, Platform } from 'react-native';

export type MediaPermissionKind = 'library' | 'camera';
export type MediaPermissionResult = 'granted' | 'denied' | 'blocked' | 'unavailable';

async function checkAndroidPermission(
  permission: (typeof PermissionsAndroid.PERMISSIONS)[keyof typeof PermissionsAndroid.PERMISSIONS],
): Promise<boolean> {
  try {
    return await PermissionsAndroid.check(permission);
  } catch {
    return false;
  }
}

async function requestAndroidPermission(
  permission: (typeof PermissionsAndroid.PERMISSIONS)[keyof typeof PermissionsAndroid.PERMISSIONS],
): Promise<MediaPermissionResult> {
  try {
    const result = await PermissionsAndroid.request(permission);
    if (result === PermissionsAndroid.RESULTS.GRANTED) {
      return 'granted';
    }
    if (result === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
      return 'blocked';
    }
    return 'denied';
  } catch {
    return 'unavailable';
  }
}

/**
 * 앨범 접근 — Android Photo Picker / 시스템 선택 도구만 사용하므로
 * READ_MEDIA_* 런타임 요청을 하지 않습니다. (Google Play 사진·동영상 권한 정책)
 */
export async function hasMediaLibraryPermission(): Promise<boolean> {
  return true;
}

/** 카메라 권한이 이미 있는지 */
export async function hasCameraPermission(): Promise<boolean> {
  if (Platform.OS !== 'android') {
    return true;
  }
  return checkAndroidPermission(PermissionsAndroid.PERMISSIONS.CAMERA);
}

/**
 * 앨범은 시스템 피커가 권한을 대체하므로 항상 granted.
 * iOS도 Info.plist + 시스템 피커 흐름.
 */
export async function requestMediaLibraryPermission(): Promise<MediaPermissionResult> {
  return 'granted';
}

/** Android 런타임 카메라 권한 요청 */
export async function requestCameraPermission(): Promise<MediaPermissionResult> {
  if (Platform.OS !== 'android') {
    return 'granted';
  }
  return requestAndroidPermission(PermissionsAndroid.PERMISSIONS.CAMERA);
}

export async function hasMediaPermission(kind: MediaPermissionKind): Promise<boolean> {
  return kind === 'camera' ? hasCameraPermission() : hasMediaLibraryPermission();
}

export async function requestMediaPermission(
  kind: MediaPermissionKind,
): Promise<MediaPermissionResult> {
  return kind === 'camera' ? requestCameraPermission() : requestMediaLibraryPermission();
}
