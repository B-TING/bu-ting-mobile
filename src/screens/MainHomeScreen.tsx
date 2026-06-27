import { useEffect, useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { ActivePlanHeroBanner } from '../components/home/banners/ActivePlanHeroBanner';
import { HeroBanner } from '../components/home/banners/HeroBanner';
import { EventsSectionMock } from '../components/home/sections/EventsSectionMock';
import { QuickAccessRow } from '../components/home/sections/QuickAccessRow';
import { TraveloguePreviewMock } from '../components/home/sections/TraveloguePreviewMock';
import { HomeActionFabs, FAB_GAP, FAB_SIZE } from '../components/helpdesk/HomeActionFabs';
import { AppBar } from '../components/shared/navigation/AppBar';
import { AppMenuDrawer } from '../components/shared/navigation/AppMenuDrawer';
import { Navbar, type NavbarTab } from '../components/shared/navigation/Navbar';
import { useAppAlert } from '../components/shared/modals';
import { HELP_DESK_COPY } from '../constants/helpdesk/helpDesk';
import {
  MAIN_HOME_COPY,
  MOCK_EVENTS,
  MOCK_SPECIAL_OFFER,
  MOCK_TRAVELOGUE,
  QUICK_ACCESS_ITEMS,
} from '../constants/home/mainHome';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { layout } from '../constants/common/layout';
import type { RootStackParamList } from '../navigation/types';
import { showTravelSurveyOnboardingPrompt } from '../services/setup/travelSurveyOnboardingPrompt';
import { selectActivePlan, useAppStore, usePlanStore, useTravelogueStore } from '../stores';
import { isTraveloguePublic } from '../utils/review/travelReview';
import { getNearestUpcomingStop } from '../utils/plan/planSchedule';

type Props = NativeStackScreenProps<RootStackParamList, 'MainHome'>;

const NAVBAR_HEIGHT = 72;

export function MainHomeScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { alert } = useAppAlert();
  const language = useAppStore(s => s.language) ?? 'ko';
  const pendingTravelSurveyPrompt = useAppStore(s => s.pendingTravelSurveyPrompt);
  const setPendingTravelSurveyPrompt = useAppStore(
    s => s.setPendingTravelSurveyPrompt,
  );
  const copy = MAIN_HOME_COPY[language];
  const helpCopy = HELP_DESK_COPY[language];
  const activePlan = usePlanStore(selectActivePlan);
  const publishedTravelogues = useTravelogueStore(s => s.publishedTravelogues);
  const latestTravelogue = useMemo(
    () => publishedTravelogues.find(isTraveloguePublic),
    [publishedTravelogues],
  );
  const [activeTab, setActiveTab] = useState<NavbarTab>('home');
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!pendingTravelSurveyPrompt) {
      return;
    }
    setPendingTravelSurveyPrompt(false);
    showTravelSurveyOnboardingPrompt(alert, navigation, language);
  }, [
    alert,
    language,
    navigation,
    pendingTravelSurveyPrompt,
    setPendingTravelSurveyPrompt,
  ]);

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

  const goToReboot = () => {
    if (!activePlan) {
      return;
    }
    navigation.navigate('PlanDetail', {
      planId: activePlan.planId,
      tab: 'schedule',
      openReboot: true,
    });
  };

  const goToHelpDesk = () => {
    navigation.navigate('HelpDeskChat');
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
        navigation.navigate('MyPage');
        break;
      default:
        break;
    }
  };

  return (
    <View className="flex-1 bg-brand-background" style={layout.screen}>
      <AppBar
        onMenuPress={() => setMenuOpen(true)}
        onProfilePress={() => navigation.navigate('MyPage')}
      />

      <AppMenuDrawer
        visible={menuOpen}
        language={language}
        navigation={navigation}
        onClose={() => setMenuOpen(false)}
      />

      <ScrollView
        className="flex-1 px-5"
        contentContainerStyle={{
          paddingBottom:
            NAVBAR_HEIGHT + 16 + (activePlan ? FAB_SIZE + FAB_GAP : 0),
        }}
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
          onItemPress={id => {
            if (id === 'festivals') {
              navigation.navigate('FestivalCalendar');
            }
            if (id === 'luggage') {
              navigation.navigate('LuggageStorage');
            }
            if (id === 'hotels') {
              navigation.navigate('BusanAccommodation');
            }
            if (id === 'attractions') {
              navigation.navigate('BusanAttraction');
            }
            if (id === 'eventZone') {
              navigation.navigate('EventZone');
            }
            if (id === 'help') {
              goToHelpDesk();
            }
          }}
        />

        <EventsSectionMock
          title={copy.eventsTitle}
          viewAllLabel={copy.eventsViewAll}
          events={MOCK_EVENTS}
          language={language}
          onViewAllPress={() => navigation.navigate('FestivalCalendar')}
          onEventPress={id => navigation.navigate('FestivalDetail', { festivalId: id })}
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

      <HomeActionFabs
        bottom={insets.bottom + NAVBAR_HEIGHT + 8}
        helpLabel={helpCopy.fabLabel}
        showReboot={!!activePlan}
        onHelpPress={goToHelpDesk}
        onRebootPress={goToReboot}
      />
    </View>
  );
}
