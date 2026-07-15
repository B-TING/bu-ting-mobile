import { useEffect, useMemo } from 'react';
import { ScrollView, View } from 'react-native';
import type { NavigationProp } from '@react-navigation/native';

import { TransientBottomToast } from '../components/shared/feedback/TransientBottomToast';
import { ActivePlanHeroBanner } from '../components/home/banners/ActivePlanHeroBanner';
import { HeroBanner } from '../components/home/banners/HeroBanner';
import { EventsSectionMock } from '../components/home/sections/EventsSectionMock';
import { HomeEventZoneSection } from '../components/home/sections/HomeEventZoneSection';
import { QuickAccessRow } from '../components/home/sections/QuickAccessRow';
import { TraveloguePreviewMock } from '../components/home/sections/TraveloguePreviewMock';
import { HomeActionFabs, FAB_GAP, FAB_SIZE } from '../components/helpdesk/HomeActionFabs';
import { useAppAlert } from '../components/shared/modals';
import {
  MOCK_SPECIAL_OFFER,
  MOCK_TRAVELOGUE,
  QUICK_ACCESS_ITEMS,
} from '../constants/home/mainHome';
import { festivalToHomeEvent } from '../constants/festival/festivalCalendar';
import { layout } from '../constants/common/layout';
import { useMainTabNavigation } from '../navigation/mainTabNavigation';
import { openItineraryOrWizard } from '../navigation/navigateToMainTab';
import type { RootStackParamList } from '../navigation/types';
import { PLACE_CONTENT_TYPE } from '../types/placesApi';
import { upcomingFestivalDateRangeYyyymmdd } from '../utils/places/festivalApiMapper';
import { showTravelSurveyOnboardingPrompt } from '../services/setup/travelSurveyOnboardingPrompt';
import { selectActivePlan, selectHomeFeaturedPlan, useAppStore, useFestivalStore, usePlanStore, useTravelRecordStore } from '../stores';
import { useSessionActiveTravelsSyncOnFocus } from '../hooks/useSessionActiveTravelsSync';
import { usePlanOfflineSyncFeedback } from '../hooks/usePlanOfflineSyncFeedback';
import { isServerBackedPlan } from '../utils/plan/serverBackedPlan';
import { isTravelRecordPublic } from '../utils/review/travelReview';
import { getNearestUpcomingStop } from '../utils/plan/planSchedule';
import { resolvePlanTravelStatus } from '../utils/plan/planTravelStatus';
import { getChatRoomByZoneId } from '../constants/eventZone/eventZone';
import { useAppLanguage, useCopy } from '../i18n';
import type { EventZoneId } from '../types/eventZone';

type Props = {
  navigation: NavigationProp<RootStackParamList>;
};

export function MainHomeScreen({ navigation }: Props) {
  const { goToTab } = useMainTabNavigation();
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
  const featuredPlan = usePlanStore(selectHomeFeaturedPlan);
  const featuredTravelStatus = useMemo(
    () => (featuredPlan ? resolvePlanTravelStatus(featuredPlan) : null),
    [featuredPlan],
  );
  const showTripRebootFab = featuredTravelStatus === 'IN_PROGRESS';
  const showSyncStatus = Boolean(featuredPlan && isServerBackedPlan(featuredPlan));
  const { toastText, toastOpacity } =
    usePlanOfflineSyncFeedback({
      planId: featuredPlan?.planId ?? '',
      enabled: showSyncStatus,
      message: planDetailCopy.offlineSyncNotice,
    });
  useSessionActiveTravelsSyncOnFocus();

  const publishedTravelRecords = useTravelRecordStore(s => s.publishedTravelRecords);
  const latestTravelogue = useMemo(
    () => publishedTravelRecords.find(isTravelRecordPublic),
    [publishedTravelRecords],
  );
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
    () =>
      featuredPlan && featuredTravelStatus === 'IN_PROGRESS'
        ? getNearestUpcomingStop(featuredPlan)
        : null,
    [featuredPlan, featuredTravelStatus],
  );

  const goToPlan = () => {
    openItineraryOrWizard(navigation);
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

  return (
    <View className="flex-1 bg-brand-background" style={layout.screen}>
      <ScrollView
        className="flex-1 px-5"
        contentContainerStyle={{
          paddingBottom: 16 + (showTripRebootFab ? FAB_SIZE + FAB_GAP : 0),
        }}
        showsVerticalScrollIndicator={false}>
        {featuredPlan && featuredTravelStatus ? (
          <ActivePlanHeroBanner
            plan={featuredPlan}
            travelStatus={featuredTravelStatus}
            upcoming={upcomingStop}
            language={language}
            copy={{
              plannedLabel: copy.plannedLabel,
              inProgressLabel: copy.inProgressLabel,
              completedLabel: copy.completedLabel,
              nextStop: copy.nextStop,
              viewItinerary: copy.viewItinerary,
              viewCompletedItinerary: copy.viewCompletedItinerary,
              completedTripHint: copy.completedTripHint,
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
            onCtaPress={() => openItineraryOrWizard(navigation)}
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
              navigation.navigate('TravelRecordDetail', {
                travelRecordId: latestTravelogue.travelRecordId,
              });
            } else {
              goToTab('feed');
            }
          }}
          onFeedPress={() => goToTab('feed')}
        />
      </ScrollView>

      <HomeActionFabs
        bottom={8}
        helpLabel={helpCopy.fabLabel}
        showReboot={showTripRebootFab}
        onHelpPress={goToHelpDesk}
        onRebootPress={goToReboot}
      />

      <TransientBottomToast
        text={toastText}
        opacity={toastOpacity}
        bottom={12}
      />
    </View>
  );
}
