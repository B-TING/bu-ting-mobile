import { useEffect, useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { PlanSyncStatusDot } from '../components/plan/PlanSyncStatusDot';
import { TransientBottomToast } from '../components/shared/feedback/TransientBottomToast';
import { ActivePlanHeroBanner } from '../components/home/banners/ActivePlanHeroBanner';
import { HeroBanner } from '../components/home/banners/HeroBanner';
import { EventsSectionMock } from '../components/home/sections/EventsSectionMock';
import { HomeEventZoneSection } from '../components/home/sections/HomeEventZoneSection';
import { QuickAccessRow } from '../components/home/sections/QuickAccessRow';
import { TraveloguePreviewMock } from '../components/home/sections/TraveloguePreviewMock';
import { HomeActionFabs, FAB_GAP, FAB_SIZE } from '../components/helpdesk/HomeActionFabs';
import { AppBar } from '../components/shared/navigation/AppBar';
import { AppMenuDrawer } from '../components/shared/navigation/AppMenuDrawer';
import { Navbar, type NavbarTab } from '../components/shared/navigation/Navbar';
import { useAppAlert } from '../components/shared/modals';
import {
  MOCK_SPECIAL_OFFER,
  MOCK_TRAVELOGUE,
  QUICK_ACCESS_ITEMS,
} from '../constants/home/mainHome';
import { festivalToHomeEvent } from '../constants/festival/festivalCalendar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { layout } from '../constants/common/layout';
import type { RootStackParamList } from '../navigation/types';
import { PLACE_CONTENT_TYPE } from '../types/placesApi';
import { upcomingFestivalDateRangeYyyymmdd } from '../utils/places/festivalApiMapper';
import { showTravelSurveyOnboardingPrompt } from '../services/setup/travelSurveyOnboardingPrompt';
import { selectActivePlan, useAppStore, useFestivalStore, usePlanStore, useTravelogueStore } from '../stores';
import { useSessionActiveTravelsSyncOnFocus } from '../hooks/useSessionActiveTravelsSync';
import { usePlanOfflineSyncFeedback } from '../hooks/usePlanOfflineSyncFeedback';
import { isServerBackedPlan } from '../utils/plan/serverBackedPlan';
import { isTraveloguePublic } from '../utils/review/travelReview';
import { getNearestUpcomingStop } from '../utils/plan/planSchedule';
import { getChatRoomByZoneId } from '../constants/eventZone/eventZone';
import { useAppLanguage, useCopy } from '../i18n';
import type { EventZoneId } from '../types/eventZone';

type Props = NativeStackScreenProps<RootStackParamList, 'MainHome'>;

const NAVBAR_HEIGHT = 72;

export function MainHomeScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { alert } = useAppAlert();
  const language = useAppLanguage();
  const copy = useCopy('mainHome');
  const planDetailCopy = useCopy('planDetail');
  const helpCopy = useCopy('helpdesk');
  const pendingTravelSurveyPrompt = useAppStore(s => s.pendingTravelSurveyPrompt);
  const setPendingTravelSurveyPrompt = useAppStore(
    s => s.setPendingTravelSurveyPrompt,
  );
  const activePlan = usePlanStore(selectActivePlan);
  const showSyncStatus = Boolean(activePlan && isServerBackedPlan(activePlan));
  const { isOffline: isActivePlanOfflineSync, toastText, toastOpacity } =
    usePlanOfflineSyncFeedback({
      planId: activePlan?.planId ?? '',
      enabled: showSyncStatus,
      message: planDetailCopy.offlineSyncNotice,
    });
  useSessionActiveTravelsSyncOnFocus();

  const publishedTravelogues = useTravelogueStore(s => s.publishedTravelogues);
  const latestTravelogue = useMemo(
    () => publishedTravelogues.find(isTraveloguePublic),
    [publishedTravelogues],
  );
  const [activeTab, setActiveTab] = useState<NavbarTab>('home');
  const [menuOpen, setMenuOpen] = useState(false);
  const homeFestivals = useFestivalStore(s => s.homeFestivals);
  const fetchHomeFestivals = useFestivalStore(s => s.fetchHomeFestivals);
  const homeEvents = useMemo(
    () => homeFestivals.map(festivalToHomeEvent),
    [homeFestivals],
  );

  useEffect(() => {
    void fetchHomeFestivals(
      language === 'ko' ? '행사 정보를 불러오지 못했어요' : 'Could not load events',
    );
  }, [fetchHomeFestivals, language]);

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

  const goToEventZone = () => {
    navigation.navigate('EventZone');
  };

  const goToEventZoneChat = (zoneId: EventZoneId) => {
    const room = getChatRoomByZoneId(zoneId);
    if (room) {
      navigation.navigate('EventZoneChat', { roomId: room.id });
    }
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
        topRightAccessory={
          showSyncStatus ? <PlanSyncStatusDot offline={isActivePlanOfflineSync} /> : undefined
        }
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
              navigation.navigate('PlaceMapSearch', {
                contentTypeId: PLACE_CONTENT_TYPE.accommodation,
              });
            }
            if (id === 'attractions') {
              navigation.navigate('PlaceMapSearch', {
                contentTypeId: PLACE_CONTENT_TYPE.attraction,
              });
            }
            if (id === 'eventZone') {
              navigation.navigate('EventZone');
            }
            if (id === 'help') {
              goToHelpDesk();
            }
          }}
        />

        <HomeEventZoneSection
          onMapPress={goToEventZone}
          onEnterChat={goToEventZoneChat}
        />

        <EventsSectionMock
          title={copy.eventsTitle}
          viewAllLabel={copy.eventsViewAll}
          events={homeEvents}
          language={language}
          onViewAllPress={() => navigation.navigate('FestivalCalendar')}
          onEventPress={id => {
            const { eventStartDate, eventEndDate } = upcomingFestivalDateRangeYyyymmdd();
            navigation.navigate('PlaceMapSearch', {
              contentTypeId: PLACE_CONTENT_TYPE.festival,
              selectedContentId: id,
              festivalEventStartDate: eventStartDate,
              festivalEventEndDate: eventEndDate,
            });
          }}
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

      <TransientBottomToast
        text={toastText}
        opacity={toastOpacity}
        bottom={insets.bottom + NAVBAR_HEIGHT + 12}
      />
    </View>
  );
}
