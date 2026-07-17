import { createContext, useContext } from 'react';

import type { NavbarTab } from '../components/shared/navigation/Navbar';

export type MainTabNavigationContextValue = {
  activeTab: NavbarTab;
  goToTab: (tab: NavbarTab) => void;
};

export const MainTabNavigationContext = createContext<MainTabNavigationContextValue | null>(
  null,
);

export function useMainTabNavigation(): MainTabNavigationContextValue {
  const ctx = useContext(MainTabNavigationContext);
  if (!ctx) {
    throw new Error('useMainTabNavigation must be used within MainTabNavigator');
  }
  return ctx;
}

export function useMainTabNavigationOptional(): MainTabNavigationContextValue | null {
  return useContext(MainTabNavigationContext);
}
