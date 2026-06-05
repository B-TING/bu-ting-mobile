import { useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { ActivePlanHeroBanner } from '../components/home/ActivePlanHeroBanner';
import { EventsSectionMock } from '../components/home/EventsSectionMock';
import { HeroBanner } from '../components/home/HeroBanner';
import { QuickAccessRow } from '../components/home/QuickAccessRow';
import { TraveloguePreviewMock } from '../components/home/TraveloguePreviewMock';
import { AppBar } from '../components/navigation/AppBar';
import { AppMenuDrawer } from '../components/navigation/AppMenuDrawer';
import { Navbar, type NavbarTab } from '../components/navigation/Navbar';
import {
  MAIN_HOME_COPY,
  MOCK_EVENTS,
  MOCK_SPECIAL_OFFER,
  MOCK_TRAVELOGUE,
  QUICK_ACCESS_ITEMS,
} from '../constants/mainHome';
import { layout } from '../constants/layout';
import type { RootStackParamList } from '../navigation/types';
import { selectActivePlan, useAppStore, usePlanStore, useTravelogueStore } from '../stores';
import { isTraveloguePublic } from '../utils/travelReview';
import { getNearestUpcomingStop } from '../utils/planSchedule';

type Props = NativeStackScreenProps<RootStackParamList, 'MainHome'>;

const NAVBAR_HEIGHT = 72;

export function MainHomeScreen({ navigation }: Props) {
  const language = useAppStore(s => s.language) ?? 'ko';
  const copy = MAIN_HOME_COPY[language];
  const activePlan = usePlanStore(selectActivePlan);
  const publishedTravelogues = useTravelogueStore(s => s.publishedTravelogues);
  const latestTravelogue = useMemo(
    () => publishedTravelogues.find(isTraveloguePublic),
    [publishedTravelogues],
  );
  const [activeTab, setActiveTab] = useState<NavbarTab>('home');
  const [menuOpen, setMenuOpen] = useState(false);

  const upcomingStop = useMemo(
    () => (activePlan ? getNearestUpcomingStop(activePlan) : null),
    [activePlan],
  );

  const goToPlan = () => {
    navigation.navigate(
      'PlanDetail',
      activePlan ? { planId: activePlan.planId } : undefined,
    );
  };

  const handleNavbarPress = (tab: NavbarTab) => {
    setActiveTab(tab);
    switch (tab) {
      case 'home':
        break;
      case 'route':
        navigation.navigate(activePlan ? 'PlanDetail' : 'PlanWizard');
        break;
      case 'feed':
        navigation.navigate('TravelogueFeed');
        break;
      case 'my':
        break;
      default:
        break;
    }
  };

  return (
    <View className="flex-1 bg-brand-background" style={layout.screen}>
      <AppBar onMenuPress={() => setMenuOpen(true)} />

      <AppMenuDrawer
        visible={menuOpen}
        language={language}
        navigation={navigation}
        onClose={() => setMenuOpen(false)}
      />

      <ScrollView
        className="flex-1 px-5"
        contentContainerStyle={{ paddingBottom: NAVBAR_HEIGHT + 16 }}
        showsVerticalScrollIndicator={false}>
        {activePlan ? (
          <ActivePlanHeroBanner
            plan={activePlan}
            upcoming={upcomingStop}
            language={language}
            copy={{
              ongoingLabel: copy.ongoingLabel,
              nextStop: copy.nextStop,
              viewItinerary: copy.viewItinerary,
              dday: copy.dday,
              ddayToday: copy.ddayToday,
              dayLabel: copy.dayLabel,
            }}
            onPress={goToPlan}
          />
        ) : (
          <HeroBanner
            title={copy.heroTitle}
            subtitle={copy.heroSubtitle}
            ctaLabel={copy.heroCta}
            onCtaPress={() => navigation.navigate('PlanWizard')}
          />
        )}

        <QuickAccessRow
          items={QUICK_ACCESS_ITEMS}
          language={language}
        />

        <EventsSectionMock
          title={copy.eventsTitle}
          viewAllLabel={copy.eventsViewAll}
          events={MOCK_EVENTS}
          language={language}
        />

        <TraveloguePreviewMock
          trendingTitle={copy.trendingTitle}
          travelogue={MOCK_TRAVELOGUE}
          specialOffer={MOCK_SPECIAL_OFFER}
          language={language}
          latestTravelogue={latestTravelogue}
          onTraveloguePress={() => {
            if (latestTravelogue) {
              navigation.navigate('TravelogueDetail', {
                travelogueId: latestTravelogue.travelogueId,
              });
            } else {
              navigation.navigate('TravelogueFeed');
            }
          }}
          onFeedPress={() => navigation.navigate('TravelogueFeed')}
        />
      </ScrollView>

      <Navbar activeTab={activeTab} language={language} onTabPress={handleNavbarPress} />
    </View>
  );
}
