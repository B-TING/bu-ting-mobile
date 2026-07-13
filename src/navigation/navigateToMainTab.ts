import type { NavigationProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import type { NavbarTab } from '../components/shared/navigation/Navbar';
import {
  selectActivePlan,
  selectHomeFeaturedPlan,
  usePlanStore,
} from '../stores/usePlanStore';
import type { TravelPlan } from '../types/travelPlan';
import type { RootStackParamList } from './types';

type MainTabNavigation = NavigationProp<RootStackParamList> | NativeStackNavigationProp<RootStackParamList>;

export function resolveItineraryPlan(): TravelPlan | null {
  const state = usePlanStore.getState();
  return selectActivePlan(state) ?? selectHomeFeaturedPlan(state);
}

export function navigateToMainTab(navigation: MainTabNavigation, tab: NavbarTab = 'home') {
  if (tab === 'route' && !resolveItineraryPlan()) {
    navigation.navigate('PlanWizard');
    return;
  }

  navigation.navigate('MainTabs', { tab });
}

export function openItineraryOrWizard(navigation: MainTabNavigation) {
  if (resolveItineraryPlan()) {
    navigation.navigate('MainTabs', { tab: 'route' });
    return;
  }

  navigation.navigate('PlanWizard');
}
