import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { SetupPhase } from '../navigation/types';
import type {
  AppLanguage,
  AuthState,
  OnboardingProfile,
} from '../types/user';

const LEGACY_KEYS = {
  language: '@buting/language',
  auth: '@buting/auth',
  onboarding: '@buting/onboarding',
} as const;

const initialAuth: AuthState = {
  isLoggedIn: false,
  userId: null,
  displayName: null,
};

type AppState = {
  language: AppLanguage | null;
  auth: AuthState;
  onboarding: OnboardingProfile | null;
  _hasHydrated: boolean;
  setHasHydrated: (value: boolean) => void;
  setLanguage: (language: AppLanguage) => void;
  login: (payload: { userId: string; displayName: string }) => void;
  completeOnboarding: (profile: OnboardingProfile) => void;
  resetSetup: () => void;
};

export const useAppStore = create<AppState>()(
  persist(
    set => ({
      language: null,
      auth: initialAuth,
      onboarding: null,
      _hasHydrated: false,
      setHasHydrated: value => set({ _hasHydrated: value }),
      setLanguage: language => set({ language }),
      login: ({ userId, displayName }) =>
        set({
          auth: { isLoggedIn: true, userId, displayName },
        }),
      completeOnboarding: onboarding => set({ onboarding }),
      resetSetup: () =>
        set({
          language: null,
          auth: initialAuth,
          onboarding: null,
        }),
    }),
    {
      name: '@buting/app-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: state => ({
        language: state.language,
        auth: state.auth,
        onboarding: state.onboarding,
      }),
      onRehydrateStorage: () => (_state, error) => {
        if (error) {
          console.warn('[Bu-Ting] persist rehydrate error', error);
        }
        useAppStore.getState().setHasHydrated(true);
      },
    },
  ),
);

export function selectSetupPhase(state: AppState): SetupPhase {
  if (!state.language) {
    return 'language';
  }
  if (!state.auth.isLoggedIn) {
    return 'login';
  }
  if (!state.onboarding) {
    return 'onboarding';
  }
  return 'main';
}

/** Zustand 도입 전 AsyncStorage 키 → 스토어 마이그레이션 */
export async function migrateLegacyStorage(): Promise<void> {
  const state = useAppStore.getState();
  if (state.language || state.auth.isLoggedIn || state.onboarding) {
    return;
  }

  const [lang, authRaw, onboardingRaw] = await Promise.all([
    AsyncStorage.getItem(LEGACY_KEYS.language),
    AsyncStorage.getItem(LEGACY_KEYS.auth),
    AsyncStorage.getItem(LEGACY_KEYS.onboarding),
  ]);

  const patch: Partial<AppState> = {};

  if (lang === 'ko' || lang === 'en' || lang === 'ja' || lang === 'zh') {
    patch.language = lang;
  }

  if (authRaw) {
    try {
      const auth = JSON.parse(authRaw) as AuthState;
      if (auth.isLoggedIn) {
        patch.auth = auth;
      }
    } catch {
      /* ignore */
    }
  }

  if (onboardingRaw) {
    try {
      patch.onboarding = JSON.parse(onboardingRaw) as OnboardingProfile;
    } catch {
      /* ignore */
    }
  }

  if (Object.keys(patch).length > 0) {
    useAppStore.setState(patch);
    await AsyncStorage.multiRemove(Object.values(LEGACY_KEYS));
  }
}

export async function hydrateAppStore(): Promise<void> {
  await migrateLegacyStorage();
  await useAppStore.persist.rehydrate();
  useAppStore.getState().setHasHydrated(true);
}
