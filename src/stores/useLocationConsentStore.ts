import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

type LocationConsentState = {
  /** Play Prominent Disclosure에 동의한 적 있는지 */
  disclosureAccepted: boolean;
  _hasHydrated: boolean;
  setHasHydrated: (value: boolean) => void;
  acceptDisclosure: () => void;
  resetDisclosure: () => void;
};

export const useLocationConsentStore = create<LocationConsentState>()(
  persist(
    set => ({
      disclosureAccepted: false,
      _hasHydrated: false,
      setHasHydrated: value => set({ _hasHydrated: value }),
      acceptDisclosure: () => set({ disclosureAccepted: true }),
      resetDisclosure: () => set({ disclosureAccepted: false }),
    }),
    {
      name: '@buting/location-consent',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: state => ({
        disclosureAccepted: state.disclosureAccepted,
      }),
      onRehydrateStorage: () => (_state, error) => {
        if (error) {
          console.warn('[Bu-Ting] location consent rehydrate error', error);
        }
        useLocationConsentStore.getState().setHasHydrated(true);
      },
    },
  ),
);
