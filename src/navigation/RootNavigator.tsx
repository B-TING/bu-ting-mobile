import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { BrandIcon } from '../components/shared/brand/BrandIcon';
import { layout } from '../constants/layout';
import { FestivalCalendarScreen } from '../screens/festival/FestivalCalendarScreen';
import { FestivalDetailScreen } from '../screens/festival/FestivalDetailScreen';
import { BusanAccommodationScreen } from '../screens/accommodation/BusanAccommodationScreen';
import { BusanAttractionScreen } from '../screens/attraction/BusanAttractionScreen';
import { HelpDeskChatScreen } from '../screens/helpdesk/HelpDeskChatScreen';
import { LuggageStorageScreen } from '../screens/locker/LuggageStorageScreen';
import { TravelogueDetailScreen } from '../screens/feed/TravelogueDetailScreen';
import { TravelogueFeedScreen } from '../screens/feed/TravelogueFeedScreen';
import { MainHomeScreen } from '../screens/MainHomeScreen';
import { MenuPlaceholderScreen } from '../screens/MenuPlaceholderScreen';
import { PlanCandidatesScreen } from '../screens/plan/PlanCandidatesScreen';
import { PlanDetailScreen } from '../screens/plan/PlanDetailScreen';
import { PlanWizardScreen } from '../screens/plan/PlanWizardScreen';
import { LanguageSelectionScreen } from '../screens/setup/LanguageSelectionScreen';
import { LoginScreen } from '../screens/setup/LoginScreen';
import { OnboardingScreen } from '../screens/setup/OnboardingScreen';
import {
  hydrateAppStore,
  selectActivePlan,
  selectSetupPhase,
  useAppStore,
  usePlanStore,
} from '../stores';
import type { SetupPhase } from './types';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

const INITIAL_ROUTES: Record<Exclude<SetupPhase, 'main'>, keyof RootStackParamList> = {
  language: 'LanguageSelection',
  login: 'Login',
  onboarding: 'Onboarding',
};

const HYDRATE_TIMEOUT_MS = 5000;

export function RootNavigator() {
  const hasHydrated = useAppStore(state => state._hasHydrated);
  const phase = useAppStore(selectSetupPhase);
  const activePlan = usePlanStore(selectActivePlan);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const timeout = setTimeout(() => {
      if (!cancelled && !useAppStore.getState()._hasHydrated) {
        console.warn('[Bu-Ting] Storage hydrate timeout — continuing anyway');
        useAppStore.getState().setHasHydrated(true);
      }
    }, HYDRATE_TIMEOUT_MS);

    hydrateAppStore()
      .catch(error => {
        console.warn('[Bu-Ting] hydrate failed', error);
        useAppStore.getState().setHasHydrated(true);
      })
      .finally(() => {
        if (!cancelled) {
          setReady(true);
        }
      });

    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, []);

  if (!ready || !hasHydrated) {
    return (
      <View style={[layout.screen, styles.loading]}>
        <BrandIcon size={72} />
        <ActivityIndicator size="large" color="#0077B6" style={styles.spinner} />
      </View>
    );
  }

  const initialRoute =
    phase === 'main' ? (activePlan ? 'PlanDetail' : 'PlanWizard') : INITIAL_ROUTES[phase];

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={initialRoute}
        screenOptions={{ headerShown: false, contentStyle: layout.screen }}>
        <Stack.Screen
          name="LanguageSelection"
          component={LanguageSelectionScreen}
        />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        <Stack.Screen name="MainHome" component={MainHomeScreen} />
        <Stack.Screen name="MenuPlaceholder" component={MenuPlaceholderScreen} />
        <Stack.Screen name="PlanWizard" component={PlanWizardScreen} />
        <Stack.Screen name="PlanCandidates" component={PlanCandidatesScreen} />
        <Stack.Screen name="PlanDetail" component={PlanDetailScreen} />
        <Stack.Screen name="TravelogueFeed" component={TravelogueFeedScreen} />
        <Stack.Screen name="TravelogueDetail" component={TravelogueDetailScreen} />
        <Stack.Screen name="FestivalCalendar" component={FestivalCalendarScreen} />
        <Stack.Screen name="FestivalDetail" component={FestivalDetailScreen} />
        <Stack.Screen name="LuggageStorage" component={LuggageStorageScreen} />
        <Stack.Screen name="BusanAccommodation" component={BusanAccommodationScreen} />
        <Stack.Screen name="BusanAttraction" component={BusanAttractionScreen} />
        <Stack.Screen name="HelpDeskChat" component={HelpDeskChatScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loading: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  spinner: {
    marginTop: 24,
  },
});
