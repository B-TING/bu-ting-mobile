import { useEffect, useRef } from 'react';

import {
  attachFcmMessageListeners,
  attachFcmTokenRefreshHandler,
  devicePlatform,
  syncFcmTokenWithServer,
} from '../services/notification/fcmService';
import { registerDeviceToken } from '../services/notification/notificationApiService';
import { useNotificationSettingsStore } from '../stores';
import {
  selectReusableAccessToken,
  useAuthStore,
} from '../stores/useAuthStore';

/** 로그인·마스터 on 이면 토큰 등록. 리스너는 앱 수명 동안 유지. */
export function useFcmBootstrap() {
  const accessToken = useAuthStore(selectReusableAccessToken);
  const authHydrated = useAuthStore(state => state._hasHydrated);
  const settingsHydrated = useNotificationSettingsStore(state => state._hasHydrated);
  const enabled = useNotificationSettingsStore(state => state.enabled);
  const accessTokenRef = useRef(accessToken);
  const enabledRef = useRef(enabled);

  accessTokenRef.current = accessToken;
  enabledRef.current = enabled;

  useEffect(() => {
    const detachMessages = attachFcmMessageListeners();
    const detachRefresh = attachFcmTokenRefreshHandler(token => {
      const tokenAccess = accessTokenRef.current;
      if (!tokenAccess || !enabledRef.current) {
        return;
      }
      registerDeviceToken(tokenAccess, {
        fcmToken: token,
        platform: devicePlatform(),
      }).catch(error => {
        console.warn('[Bu-Ting][FCM] refresh register failed', error);
      });
    });
    return () => {
      detachMessages();
      detachRefresh();
    };
  }, []);

  useEffect(() => {
    if (!authHydrated || !settingsHydrated) {
      return;
    }
    if (!accessToken || !enabled) {
      return;
    }

    let cancelled = false;
    syncFcmTokenWithServer(accessToken)
      .catch(error => {
        console.warn('[Bu-Ting][FCM] bootstrap sync failed', error);
      })
      .finally(() => {
        if (cancelled) {
          return;
        }
      });

    return () => {
      cancelled = true;
    };
  }, [accessToken, authHydrated, enabled, settingsHydrated]);
}
