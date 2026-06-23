import { useMemo } from 'react';

import type { SetupPhase } from '../navigation/types';
import { selectIsAuthenticated, useAuthStore } from '../stores/useAuthStore';
import { useAppStore } from '../stores/useAppStore';

export function useSetupPhase(): SetupPhase {
  const language = useAppStore(state => state.language);
  const onboarding = useAppStore(state => state.onboarding);
  const isAuthenticated = useAuthStore(selectIsAuthenticated);

  return useMemo(() => {
    if (!language) {
      return 'language';
    }
    if (!onboarding) {
      return 'onboarding';
    }
    if (!isAuthenticated) {
      return 'login';
    }
    return 'main';
  }, [language, isAuthenticated, onboarding]);
}
