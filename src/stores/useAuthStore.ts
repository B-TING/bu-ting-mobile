import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { AuthUser, OAuthProvider } from '../types/auth';

type AuthStoreState = {
  accessToken: string | null;
  /** Unix ms. `expiresIn`(초) 기준으로 로그인 시 저장합니다. */
  accessTokenExpiresAt: number | null;
  user: AuthUser | null;
  rememberMe: boolean;
  provider: OAuthProvider | null;
  providerToken: string | null;
  _hasHydrated: boolean;
  setHasHydrated: (value: boolean) => void;
  setSession: (payload: {
    accessToken: string;
    expiresIn: number;
    user: AuthUser;
    rememberMe: boolean;
    provider: OAuthProvider;
    providerToken: string | null;
  }) => void;
  setUser: (user: AuthUser) => void;
  clearSession: () => void;
};

const initialState = {
  accessToken: null as string | null,
  accessTokenExpiresAt: null as number | null,
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
        user,
        rememberMe,
        provider,
        providerToken,
      }) =>
        set({
          accessToken,
          accessTokenExpiresAt: Date.now() + expiresIn * 1000,
          user,
          rememberMe,
          provider,
          providerToken: rememberMe ? providerToken : null,
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

export function selectAuthUser(state: AuthStoreState): AuthUser | null {
  return state.user;
}

export async function hydrateAuthStore(): Promise<void> {
  await useAuthStore.persist.rehydrate();
  useAuthStore.getState().setHasHydrated(true);
}
