import { useCallback, useEffect, useState } from 'react';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useCopy } from '../../i18n';
import type { RootStackParamList } from '../../navigation/types';
import {
  fetchNotificationSettings,
  patchNotificationSettings,
} from '../../services/notification/notificationApiService';
import {
  syncFcmTokenWithServer,
  unregisterFcmTokenFromServer,
} from '../../services/notification/fcmService';
import {
  NOTIFICATION_TYPES,
  useNotificationSettingsStore,
} from '../../stores';
import type { NotificationPreferenceKey } from '../../stores/useNotificationSettingsStore';
import { selectReusableAccessToken, useAuthStore } from '../../stores/useAuthStore';

type Navigation = NativeStackNavigationProp<RootStackParamList, 'NotificationSettings'>;

export function useNotificationSettingsScreen(navigation: Navigation) {
  const copy = useCopy('notificationSettings');
  const accessToken = useAuthStore(selectReusableAccessToken);
  const enabled = useNotificationSettingsStore(state => state.enabled);
  const settings = useNotificationSettingsStore(state => state.settings);
  const hydrated = useNotificationSettingsStore(state => state._hasHydrated);
  const setEnabled = useNotificationSettingsStore(state => state.setEnabled);
  const setPreference = useNotificationSettingsStore(state => state.setPreference);
  const applyServerSettings = useNotificationSettingsStore(
    state => state.applyServerSettings,
  );
  const [syncing, setSyncing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken || !hydrated) {
      return;
    }
    let cancelled = false;
    setSyncing(true);
    fetchNotificationSettings(accessToken)
      .then(next => {
        if (!cancelled) {
          applyServerSettings(next);
          setErrorMessage(null);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setErrorMessage(copy.syncFailed);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setSyncing(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [accessToken, applyServerSettings, copy.syncFailed, hydrated]);

  const handleMasterChange = useCallback(
    async (value: boolean) => {
      setEnabled(value);
      if (!accessToken) {
        return;
      }
      if (value) {
        await syncFcmTokenWithServer(accessToken);
      } else {
        await unregisterFcmTokenFromServer(accessToken);
      }
    },
    [accessToken, setEnabled],
  );

  const handlePreferenceChange = useCallback(
    async (key: NotificationPreferenceKey, value: boolean) => {
      const previous = settings[key];
      setPreference(key, value);
      if (!accessToken) {
        return;
      }
      try {
        const next = await patchNotificationSettings(accessToken, { [key]: value });
        applyServerSettings(next);
        setErrorMessage(null);
      } catch {
        setPreference(key, previous);
        setErrorMessage(copy.syncFailed);
      }
    },
    [accessToken, applyServerSettings, copy.syncFailed, setPreference, settings],
  );

  return {
    copy,
    isAuthenticated: Boolean(accessToken),
    hydrated,
    syncing,
    errorMessage,
    enabled,
    settings,
    preferenceKeys: NOTIFICATION_TYPES,
    setEnabled: handleMasterChange,
    setPreference: handlePreferenceChange,
    goBack: () => navigation.goBack(),
    goLogin: () => navigation.navigate('Login'),
  };
}
