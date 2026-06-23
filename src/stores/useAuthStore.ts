import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { AuthUser, OAuthProvider } from '../types/auth';

type AuthStoreState = {
  accessToken: string | null;
  user: AuthUser | null;
  rememberMe: boolean;
  provider: OAuthProvider | null;
  providerToken: string | null;
  _hasHydrated: boolean;
  setHasHydrated: (value: boolean) => void;
  setSession: (payload: {
    accessToken: string;
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
        user,
        rememberMe,
        provider,
        providerToken,
      }) =>
        set({
          accessToken,
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
  return Boolean(state.accessToken && state.user);
}

export function selectAuthUser(state: AuthStoreState): AuthUser | null {
  return state.user;
}

export async function hydrateAuthStore(): Promise<void> {
  await useAuthStore.persist.rehydrate();
  useAuthStore.getState().setHasHydrated(true);
}
