import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { SetupPhase } from '../navigation/types';
import { changeAppLanguage } from '../i18n';
import { selectIsAuthenticated, useAuthStore } from './useAuthStore';
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
  /** 초기 설정 플로우·UI용 활성 프로필 */
  onboarding: OnboardingProfile | null;
  /** 회원가입 전 게스트 설문 */
  guestOnboarding: OnboardingProfile | null;
  /** 계정별 로컬 캐시 (ownerUserId 포함) */
  onboardingByUserId: Record<string, OnboardingProfile>;
  pendingTravelSurveyPrompt: boolean;
  hideUserIdOnMyPage: boolean;
  /** 세션 전용 — 로그인 없이 로컬 일정 열람 */
  offlineMode: boolean;
  _hasHydrated: boolean;
  setHasHydrated: (value: boolean) => void;
  setLanguage: (language: AppLanguage) => void;
  setHideUserIdOnMyPage: (hide: boolean) => void;
  setPendingTravelSurveyPrompt: (value: boolean) => void;
  setOfflineMode: (value: boolean) => void;
  login: (payload: { userId: string; displayName: string }) => void;
  completeOnboarding: (
    profile: OnboardingProfile,
    options?: { userId?: string | null },
  ) => void;
  saveUserOnboarding: (userId: string, profile: OnboardingProfile) => void;
  setActiveOnboarding: (userId: string) => void;
  clearGuestOnboarding: () => void;
  resetSetup: () => void;
};

function withOwner(
  profile: OnboardingProfile,
  userId: string | null,
): OnboardingProfile {
  return { ...profile, ownerUserId: userId };
}

export const useAppStore = create<AppState>()(
  persist(
    set => ({
      language: null,
      auth: initialAuth,
      onboarding: null,
      guestOnboarding: null,
      onboardingByUserId: {},
      pendingTravelSurveyPrompt: false,
      hideUserIdOnMyPage: false,
      offlineMode: false,
      _hasHydrated: false,
      setHasHydrated: value => set({ _hasHydrated: value }),
      setLanguage: language => {
        void changeAppLanguage(language);
        set({ language });
      },
      setHideUserIdOnMyPage: hideUserIdOnMyPage => set({ hideUserIdOnMyPage }),
      setPendingTravelSurveyPrompt: pendingTravelSurveyPrompt =>
        set({ pendingTravelSurveyPrompt }),
      setOfflineMode: offlineMode => set({ offlineMode }),
      login: ({ userId, displayName }) =>
        set({
          auth: { isLoggedIn: true, userId, displayName },
          offlineMode: false,
        }),
      completeOnboarding: (profile, options) => {
        const userId = options?.userId ?? null;
        const record = withOwner(profile, userId);
        if (userId) {
          set(state => ({
            onboardingByUserId: {
              ...state.onboardingByUserId,
              [userId]: record,
            },
            onboarding: record,
          }));
          return;
        }
        set({
          guestOnboarding: record,
          onboarding: record,
        });
      },
      saveUserOnboarding: (userId, profile) => {
        const record = withOwner(profile, userId);
        set(state => ({
          onboardingByUserId: {
            ...state.onboardingByUserId,
            [userId]: record,
          },
          onboarding: record,
        }));
      },
      setActiveOnboarding: userId =>
        set(state => ({
          onboarding: state.onboardingByUserId[userId] ?? null,
        })),
      clearGuestOnboarding: () => set({ guestOnboarding: null }),
      resetSetup: () =>
        set({
          language: null,
          auth: initialAuth,
          onboarding: null,
          guestOnboarding: null,
          onboardingByUserId: {},
          pendingTravelSurveyPrompt: false,
          offlineMode: false,
        }),
    }),
    {
      name: '@buting/app-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: state => ({
        language: state.language,
        auth: state.auth,
        onboarding: state.onboarding,
        guestOnboarding: state.guestOnboarding,
        onboardingByUserId: state.onboardingByUserId,
        pendingTravelSurveyPrompt: state.pendingTravelSurveyPrompt,
        hideUserIdOnMyPage: state.hideUserIdOnMyPage,
        // offlineMode는 persist하지 않음 (자동 로그인보다 우선되면 안 됨)
      }),
      onRehydrateStorage: () => (state, error) => {
        if (error) {
          console.warn('[Bu-Ting] persist rehydrate error', error);
        }
        if (state) {
          state.offlineMode = false;
          if (state.onboarding && !state.guestOnboarding) {
            const ownerId = state.onboarding.ownerUserId ?? null;
            if (ownerId) {
              if (!state.onboardingByUserId[ownerId]) {
                state.onboardingByUserId = {
                  ...state.onboardingByUserId,
                  [ownerId]: state.onboarding,
                };
              }
            } else if (!state.guestOnboarding) {
              state.guestOnboarding = state.onboarding;
            }
          }
        }
        useAppStore.getState().setHasHydrated(true);
      },
    },
  ),
);

export function selectOnboardingForUser(userId: string | null | undefined) {
  return (state: AppState): OnboardingProfile | null => {
    if (userId) {
      return state.onboardingByUserId[userId] ?? null;
    }
    return state.guestOnboarding ?? state.onboarding;
  };
}

export function selectSetupPhase(state: AppState): SetupPhase {
  if (!state.language) {
    return 'language';
  }
  if (!state.onboarding) {
    return 'onboarding';
  }
  if (selectIsAuthenticated(useAuthStore.getState())) {
    return 'main';
  }
  if (state.offlineMode) {
    return 'main';
  }
  return 'login';
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
      const onboarding = JSON.parse(onboardingRaw) as OnboardingProfile;
      patch.onboarding = onboarding;
      patch.guestOnboarding = onboarding;
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
  useAppStore.getState().setOfflineMode(false);
  useAppStore.getState().setHasHydrated(true);
}
