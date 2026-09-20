import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { AuthUser, OAuthProvider } from '../types/auth';

type AuthStoreState = {
  accessToken: string | null;
  /** Unix ms. `expiresIn`(초) 기준으로 로그인 시 저장합니다. */
  accessTokenExpiresAt: number | null;
  /** 액세스 토큰 재발급용. 서버가 회전시키므로 재발급마다 새 값으로 덮어씁니다. */
  refreshToken: string | null;
  refreshTokenExpiresAt: number | null;
  user: AuthUser | null;
  rememberMe: boolean;
  provider: OAuthProvider | null;
  providerToken: string | null;
  _hasHydrated: boolean;
  setHasHydrated: (value: boolean) => void;
  setSession: (payload: {
    accessToken: string;
    expiresIn: number;
    refreshToken?: string | null;
    refreshExpiresIn?: number | null;
    user: AuthUser;
    rememberMe: boolean;
    provider: OAuthProvider;
    providerToken: string | null;
  }) => void;
  /** 재발급 결과만 반영합니다. 사용자·provider 정보는 그대로 둡니다. */
  setTokens: (payload: {
    accessToken: string;
    expiresIn: number;
    refreshToken: string;
    refreshExpiresIn: number;
  }) => void;
  setUser: (user: AuthUser) => void;
  clearSession: () => void;
};

const initialState = {
  accessToken: null as string | null,
  accessTokenExpiresAt: null as number | null,
  refreshToken: null as string | null,
  refreshTokenExpiresAt: null as number | null,
  user: null as AuthUser | null,
  rememberMe: false,
  provider: null as OAuthProvider | null,
  providerToken: null as string | null,
};

export const useAuthStore = create<AuthStoreState>()(
  persist(
    set => ({
      ...initialState,
      _hasHydrated: false,
      setHasHydrated: value => set({ _hasHydrated: value }),
      setSession: ({
        accessToken,
        expiresIn,
        refreshToken,
        refreshExpiresIn,
        user,
        rememberMe,
        provider,
        providerToken,
      }) =>
        set({
          accessToken,
          accessTokenExpiresAt: Date.now() + expiresIn * 1000,
          refreshToken: refreshToken ?? null,
          refreshTokenExpiresAt:
            refreshToken && refreshExpiresIn
              ? Date.now() + refreshExpiresIn * 1000
              : null,
          user,
          rememberMe,
          provider,
          providerToken: rememberMe ? providerToken : null,
        }),
      setTokens: ({ accessToken, expiresIn, refreshToken, refreshExpiresIn }) =>
        set({
          accessToken,
          accessTokenExpiresAt: Date.now() + expiresIn * 1000,
          refreshToken,
          refreshTokenExpiresAt: Date.now() + refreshExpiresIn * 1000,
        }),
      setUser: user => set({ user }),
      clearSession: () => set({ ...initialState, _hasHydrated: true }),
    }),
    {
      name: '@buting/auth-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: state => ({
        rememberMe: state.rememberMe,
        accessToken: state.rememberMe ? state.accessToken : null,
        accessTokenExpiresAt: state.rememberMe
          ? state.accessTokenExpiresAt
          : null,
        refreshToken: state.rememberMe ? state.refreshToken : null,
        refreshTokenExpiresAt: state.rememberMe
          ? state.refreshTokenExpiresAt
          : null,
        user: state.rememberMe ? state.user : null,
        provider: state.rememberMe ? state.provider : null,
        providerToken: state.rememberMe ? state.providerToken : null,
      }),
      onRehydrateStorage: () => (_state, error) => {
        if (error) {
          console.warn('[Bu-Ting] auth persist rehydrate error', error);
        }
        useAuthStore.getState().setHasHydrated(true);
      },
    },
  ),
);

export function selectIsAuthenticated(state: AuthStoreState): boolean {
  return Boolean(selectReusableAccessToken(state) && state.user);
}

/** 만료 전이면 로컬에 저장된 opaque access token을 반환합니다. */
export function selectReusableAccessToken(state: AuthStoreState): string | null {
  if (!state.accessToken) {
    return null;
  }

  if (
    state.accessTokenExpiresAt !== null &&
    Date.now() >= state.accessTokenExpiresAt
  ) {
    return null;
  }

  return state.accessToken;
}

/** 만료 전이면 저장된 리프레시 토큰을 반환합니다. */
export function selectReusableRefreshToken(state: AuthStoreState): string | null {
  if (!state.refreshToken) {
    return null;
  }

  if (
    state.refreshTokenExpiresAt !== null &&
    Date.now() >= state.refreshTokenExpiresAt
  ) {
    return null;
  }

  return state.refreshToken;
}

export function selectAuthUser(state: AuthStoreState): AuthUser | null {
  return state.user;
}

export async function hydrateAuthStore(): Promise<void> {
  await useAuthStore.persist.rehydrate();
  useAuthStore.getState().setHasHydrated(true);
}
