import type { NavigationProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import type { NavbarTab } from '../components/shared/navigation/Navbar';
import type { RootStackParamList } from './types';

type MainTabNavigation = NavigationProp<RootStackParamList> | NativeStackNavigationProp<RootStackParamList>;

export function navigateToMainTab(navigation: MainTabNavigation, tab: NavbarTab = 'home') {
  navigation.navigate('MainTabs', { tab });
}
