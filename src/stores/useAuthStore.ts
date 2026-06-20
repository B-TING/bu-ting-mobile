import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { AuthUser } from '../types/auth';

type AuthStoreState = {
  accessToken: string | null;
  user: AuthUser | null;
  _hasHydrated: boolean;
  setHasHydrated: (value: boolean) => void;
  setSession: (payload: { accessToken: string; user?: AuthUser | null }) => void;
  setUser: (user: AuthUser) => void;
  clearSession: () => void;
};

const initialState = {
  accessToken: null as string | null,
  user: null as AuthUser | null,
};

export const useAuthStore = create<AuthStoreState>()(
  persist(
    set => ({
      ...initialState,
      _hasHydrated: false,
      setHasHydrated: value => set({ _hasHydrated: value }),
      setSession: ({ accessToken, user = null }) =>
        set({
          accessToken,
          user,
        }),
      setUser: user => set({ user }),
      clearSession: () => set(initialState),
    }),
    {
      name: '@buting/auth-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: state => ({
        accessToken: state.accessToken,
        user: state.user,
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
  return Boolean(state.accessToken);
}

export async function hydrateAuthStore(): Promise<void> {
  await useAuthStore.persist.rehydrate();
  useAuthStore.getState().setHasHydrated(true);
}
