import { PermissionsAndroid, Platform } from 'react-native';

export type MediaPermissionKind = 'library' | 'camera';
export type MediaPermissionResult = 'granted' | 'denied' | 'blocked' | 'unavailable';

function androidSdkInt(): number {
  return typeof Platform.Version === 'number' ? Platform.Version : 0;
}

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

/** 앨범(사진·동영상) 권한이 이미 있는지 */
export async function hasMediaLibraryPermission(): Promise<boolean> {
  if (Platform.OS !== 'android') {
    // iOS: 시스템 피커/Info.plist 흐름 — 사전 차단하지 않음
    return true;
  }
  if (androidSdkInt() >= 33) {
    const images = await checkAndroidPermission(
      PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES,
    );
    const video = await checkAndroidPermission(
      PermissionsAndroid.PERMISSIONS.READ_MEDIA_VIDEO,
    );
    return images || video;
  }
  return checkAndroidPermission(PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE);
}

/** 카메라 권한이 이미 있는지 */
export async function hasCameraPermission(): Promise<boolean> {
  if (Platform.OS !== 'android') {
    return true;
  }
  return checkAndroidPermission(PermissionsAndroid.PERMISSIONS.CAMERA);
}

/**
 * Android 런타임 앨범 권한 요청.
 * iOS는 Info.plist + 시스템 피커가 처리하므로 granted 반환.
 */
export async function requestMediaLibraryPermission(): Promise<MediaPermissionResult> {
  if (Platform.OS !== 'android') {
    return 'granted';
  }

  if (androidSdkInt() >= 33) {
    try {
      const result = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES,
        PermissionsAndroid.PERMISSIONS.READ_MEDIA_VIDEO,
      ]);
      const images = result[PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES];
      const video = result[PermissionsAndroid.PERMISSIONS.READ_MEDIA_VIDEO];
      if (
        images === PermissionsAndroid.RESULTS.GRANTED ||
        video === PermissionsAndroid.RESULTS.GRANTED
      ) {
        return 'granted';
      }
      if (
        images === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN ||
        video === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN
      ) {
        return 'blocked';
      }
      return 'denied';
    } catch {
      return 'unavailable';
    }
  }

  return requestAndroidPermission(PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE);
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
