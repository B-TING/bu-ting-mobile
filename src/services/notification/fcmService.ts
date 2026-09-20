import { PermissionsAndroid, Platform } from 'react-native';
import {
  AuthorizationStatus,
  getInitialNotification,
  getMessaging,
  getToken,
  onMessage,
  onNotificationOpenedApp,
  onTokenRefresh,
  registerDeviceForRemoteMessages,
  requestPermission,
  setBackgroundMessageHandler,
  type RemoteMessage,
} from '@react-native-firebase/messaging';

import type { DevicePlatform } from '../../types/notification';
import {
  deleteDeviceToken,
  registerDeviceToken,
} from './notificationApiService';

const LOG_PREFIX = '[Bu-Ting][FCM]';

let cachedToken: string | null = null;
let listenersAttached = false;

export function getCachedFcmToken(): string | null {
  return cachedToken;
}

export function devicePlatform(): DevicePlatform {
  return Platform.OS === 'ios' ? 'IOS' : 'ANDROID';
}

function tryGetMessaging() {
  try {
    return getMessaging();
  } catch (error) {
    console.warn(LOG_PREFIX, 'messaging unavailable', error);
    return null;
  }
}

export async function requestPushPermission(): Promise<boolean> {
  const messaging = tryGetMessaging();
  if (!messaging) {
    return false;
  }

  if (Platform.OS === 'android' && Platform.Version >= 33) {
    const result = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
    );
    if (result !== PermissionsAndroid.RESULTS.GRANTED) {
      console.warn(LOG_PREFIX, 'POST_NOTIFICATIONS denied');
      return false;
    }
  }

  const authStatus = await requestPermission(messaging);
  const enabled =
    authStatus === AuthorizationStatus.AUTHORIZED ||
    authStatus === AuthorizationStatus.PROVISIONAL;

  if (!enabled) {
    console.warn(LOG_PREFIX, 'notification permission not granted', authStatus);
  }
  return enabled;
}

export async function getFcmToken(): Promise<string | null> {
  const messaging = tryGetMessaging();
  if (!messaging) {
    return null;
  }

  try {
    if (Platform.OS === 'ios') {
      await registerDeviceForRemoteMessages(messaging);
    }
    const token = await getToken(messaging);
    cachedToken = token || null;
    return cachedToken;
  } catch (error) {
    console.warn(LOG_PREFIX, 'getToken failed', error);
    return null;
  }
}

export async function syncFcmTokenWithServer(
  accessToken: string,
): Promise<string | null> {
  const allowed = await requestPushPermission();
  if (!allowed) {
    return null;
  }

  const token = await getFcmToken();
  if (!token) {
    return null;
  }

  try {
    await registerDeviceToken(accessToken, {
      fcmToken: token,
      platform: devicePlatform(),
    });
    console.log(LOG_PREFIX, 'device token registered');
    return token;
  } catch (error) {
    console.warn(LOG_PREFIX, 'registerDeviceToken failed', error);
    return null;
  }
}

export async function unregisterFcmTokenFromServer(
  accessToken: string | null | undefined,
): Promise<void> {
  const token = cachedToken ?? (await getFcmToken().catch(() => null));
  if (!accessToken || !token) {
    cachedToken = null;
    return;
  }

  try {
    await deleteDeviceToken(accessToken, token);
    console.log(LOG_PREFIX, 'device token deleted');
  } catch (error) {
    console.warn(LOG_PREFIX, 'deleteDeviceToken failed', error);
  } finally {
    cachedToken = null;
  }
}

function logRemoteMessage(message: RemoteMessage): void {
  console.log(LOG_PREFIX, 'message', {
    messageId: message.messageId,
    title: message.notification?.title,
    body: message.notification?.body,
    data: message.data,
  });
}

/** 포그라운드·오픈 리스너. 앱 수명 동안 1회만 등록. */
export function attachFcmMessageListeners(): () => void {
  const messaging = tryGetMessaging();
  if (!messaging || listenersAttached) {
    return () => undefined;
  }
  listenersAttached = true;

  const unsubForeground = onMessage(messaging, async remoteMessage => {
    logRemoteMessage(remoteMessage);
  });

  const unsubOpened = onNotificationOpenedApp(messaging, remoteMessage => {
    logRemoteMessage(remoteMessage);
  });

  getInitialNotification(messaging)
    .then(remoteMessage => {
      if (remoteMessage) {
        logRemoteMessage(remoteMessage);
      }
    })
    .catch((error: unknown) => {
      console.warn(LOG_PREFIX, 'getInitialNotification failed', error);
    });

  return () => {
    unsubForeground();
    unsubOpened();
    listenersAttached = false;
  };
}

/** 토큰 갱신 시 서버 재등록용 — 콜백을 외부에서 주입 */
export function attachFcmTokenRefreshHandler(
  onRefresh: (token: string) => void,
): () => void {
  const messaging = tryGetMessaging();
  if (!messaging) {
    return () => undefined;
  }
  return onTokenRefresh(messaging, (token: string) => {
    cachedToken = token;
    onRefresh(token);
  });
}

/** 백그라운드 핸들러 — index.js 에서 등록 */
export function registerBackgroundMessageHandler(): void {
  const messaging = tryGetMessaging();
  if (!messaging) {
    return;
  }
  setBackgroundMessageHandler(messaging, async remoteMessage => {
    logRemoteMessage(remoteMessage);
  });
}
