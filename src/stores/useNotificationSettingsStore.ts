import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { NotificationSettingsMap, NotificationType } from '../types/notification';
import {
  emptyNotificationSettings,
  NOTIFICATION_TYPES,
  normalizeNotificationSettings,
} from '../types/notification';

/** 마스터 on/off는 로컬. 유형별 설정은 로그인 후 서버와 동기화. */
export type NotificationPreferenceKey = NotificationType;

type NotificationSettingsState = {
  enabled: boolean;
  settings: NotificationSettingsMap;
  _hasHydrated: boolean;
  setHasHydrated: (value: boolean) => void;
  setEnabled: (value: boolean) => void;
  setPreference: (key: NotificationPreferenceKey, value: boolean) => void;
  applyServerSettings: (settings: NotificationSettingsMap) => void;
};

export const useNotificationSettingsStore = create<NotificationSettingsState>()(
  persist(
    set => ({
      enabled: true,
      settings: emptyNotificationSettings(true),
      _hasHydrated: false,
      setHasHydrated: value => set({ _hasHydrated: value }),
      setEnabled: value => set({ enabled: value }),
      setPreference: (key, value) =>
        set(state => ({
          settings: { ...state.settings, [key]: value },
        })),
      applyServerSettings: settings =>
        set({ settings: normalizeNotificationSettings(settings) }),
    }),
    {
      name: '@buting/notification-settings',
      storage: createJSONStorage(() => AsyncStorage),
      version: 2,
      migrate: (persisted, version) => {
        const state = (persisted ?? {}) as Record<string, unknown>;
        if (version < 2) {
          return {
            enabled: typeof state.enabled === 'boolean' ? state.enabled : true,
            settings: emptyNotificationSettings(true),
          };
        }
        return {
          enabled: typeof state.enabled === 'boolean' ? state.enabled : true,
          settings: normalizeNotificationSettings(
            state.settings as Partial<Record<string, boolean>> | undefined,
          ),
        };
      },
      partialize: state => ({
        enabled: state.enabled,
        settings: state.settings,
      }),
      onRehydrateStorage: () => (_state, error) => {
        if (error) {
          console.warn('[Bu-Ting] notification settings rehydrate error', error);
        }
        useNotificationSettingsStore.getState().setHasHydrated(true);
      },
    },
  ),
);

export { NOTIFICATION_TYPES };
