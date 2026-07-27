import { useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, View } from 'react-native';
import type { NavigationProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { TransientBottomToast } from '../components/shared/feedback/TransientBottomToast';
import { ActivePlanHeroBanner } from '../components/home/banners/ActivePlanHeroBanner';
import { HeroBanner } from '../components/home/banners/HeroBanner';
import { EventsSectionMock } from '../components/home/sections/EventsSectionMock';
import { HomeEventZoneSection } from '../components/home/sections/HomeEventZoneSection';
import { QuickAccessRow } from '../components/home/sections/QuickAccessRow';
import { TraveloguePreview } from '../components/home/sections/TraveloguePreview';
import { HomeActionFabs, FAB_GAP, FAB_SIZE } from '../components/helpdesk/HomeActionFabs';
import { GUIDE_TARGET } from '../components/guide/guideTypes';
import { ROUTE_FAB_BOTTOM_OFFSET } from '../components/plan/fab/RouteOptimizeFab';
import { getNavbarOverlayHeight } from '../components/shared/navigation/Navbar';
import { useAppAlert, useFeatureUnavailableAlert } from '../components/shared/modals';
import { QUICK_ACCESS_ITEMS } from '../constants/home/mainHome';
import {
  ALPHA_FEATURE_LABELS,
  isAlphaFeatureBlocked,
} from '../constants/common/alphaFeatureBlocks';
import { festivalToHomeEvent } from '../constants/festival/festivalCalendar';
import { layout } from '../constants/common/layout';
import { useMainTabNavigation } from '../navigation/mainTabNavigation';
import { openItineraryOrWizard } from '../navigation/navigateToMainTab';
import type { RootStackParamList } from '../navigation/types';
import { PLACE_CONTENT_TYPE } from '../types/placesApi';
import { upcomingFestivalDateRangeYyyymmdd } from '../utils/places/festivalApiMapper';
import { showTravelSurveyOnboardingPrompt } from '../services/setup/travelSurveyOnboardingPrompt';
import { fetchTravelRecordFeed } from '../services/travel/travelRecordService';
import { mapTravelRecordFeedItem } from '../types/travelRecordApi';
import {
  selectActivePlan,
  selectHomeFeaturedPlan,
  useAppStore,
  useAuthStore,
  useFestivalStore,
  usePlanStore,
} from '../stores';
import { selectReusableAccessToken } from '../stores/useAuthStore';
import { useSessionActiveTravelsSyncOnFocus } from '../hooks/useSessionActiveTravelsSync';
import { usePlanOfflineSyncFeedback } from '../hooks/usePlanOfflineSyncFeedback';
import { isServerBackedPlan } from '../utils/plan/serverBackedPlan';
import { isTravelRecordPublic } from '../utils/review/travelReview';
import { getNearestUpcomingStop } from '../utils/plan/planSchedule';
import { resolvePlanTravelStatus } from '../utils/plan/planTravelStatus';
import { getChatRoomByZoneId } from '../constants/eventZone/eventZone';
import { useAppLanguage, useCopy } from '../i18n';
import type { EventZoneId } from '../types/eventZone';
import type { TravelRecord } from '../types/travelReview';

type Props = {
  navigation: NavigationProp<RootStackParamList>;
  /** 온보딩 가이드 등 Navbar 미표시 시 하단 clearance 제거 */
  suppressNavbarClearance?: boolean;
  /** 온보딩 가이드에서 리부트 FAB을 임시로 표시 */
  forceShowRebootFab?: boolean;
  /** 온보딩 가이드: 해당 타깃이 보이도록 홈 스크롤 */
  guideScrollTargetId?: string | null;
};

export function MainHomeScreen({
  navigation,
  suppressNavbarClearance = false,
  forceShowRebootFab = false,
  guideScrollTargetId = null,
}: Props) {
  const insets = useSafeAreaInsets();
  const { goToTab } = useMainTabNavigation();
  const { alert } = useAppAlert();
  const { showUnavailable } = useFeatureUnavailableAlert();
  const scrollRef = useRef<ScrollView>(null);
  const travelogueOffsetY = useRef(0);
  const language = useAppLanguage();
  const copy = useCopy('mainHome');
  const planDetailCopy = useCopy('planDetail');
  const helpCopy = useCopy('helpdesk');
  const pendingTravelSurveyPrompt = useAppStore(s => s.pendingTravelSurveyPrompt);
  const setPendingTravelSurveyPrompt = useAppStore(
    s => s.setPendingTravelSurveyPrompt,
  );
  const accessToken = useAuthStore(selectReusableAccessToken);
  const activePlan = usePlanStore(selectActivePlan);
  const featuredPlan = usePlanStore(selectHomeFeaturedPlan);
  const featuredTravelStatus = useMemo(
    () => (featuredPlan ? resolvePlanTravelStatus(featuredPlan) : null),
    [featuredPlan],
  );
  const showTripRebootFab =
    forceShowRebootFab || featuredTravelStatus === 'IN_PROGRESS';
  const showSyncStatus = Boolean(featuredPlan && isServerBackedPlan(featuredPlan));
  const { toastText, toastOpacity } =
    usePlanOfflineSyncFeedback({
      planId: featuredPlan?.planId ?? '',
      enabled: showSyncStatus,
      message: planDetailCopy.offlineSyncNotice,
    });
  useSessionActiveTravelsSyncOnFocus();

  const [latestTravelogue, setLatestTravelogue] = useState<TravelRecord | null>(null);
  const [loadingTravelogue, setLoadingTravelogue] = useState(true);
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
    let cancelled = false;
    setLoadingTravelogue(true);
    void fetchTravelRecordFeed({ size: 1, sort: 'LATEST' }, accessToken)
      .then(page => {
        if (cancelled) {
          return;
        }
        const first = (page.items ?? [])
          .map(mapTravelRecordFeedItem)
          .find(isTravelRecordPublic);
        setLatestTravelogue(first ?? null);
      })
      .catch(() => {
        if (!cancelled) {
          setLatestTravelogue(null);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoadingTravelogue(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [accessToken]);

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

  useEffect(() => {
    let cancelled = false;

    const scrollHome = (y: number, animated: boolean) => {
      scrollRef.current?.scrollTo({ y, animated });
    };

    if (guideScrollTargetId !== GUIDE_TARGET.traveloguePreview) {
      scrollHome(0, true);
      return;
    }

    const tryScrollToTravelogue = (attempt: number) => {
      if (cancelled) {
        return;
      }
      const y = travelogueOffsetY.current;
      if (y > 0 || attempt >= 10) {
        scrollHome(Math.max(0, y - 72), true);
        return;
      }
      setTimeout(() => tryScrollToTravelogue(attempt + 1), 40);
    };

    tryScrollToTravelogue(0);
    return () => {
      cancelled = true;
    };
  }, [guideScrollTargetId]);

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
    if (isAlphaFeatureBlocked('reboot')) {
      showUnavailable(ALPHA_FEATURE_LABELS.reboot);
      return;
    }
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
    if (isAlphaFeatureBlocked('helpdesk')) {
      showUnavailable(ALPHA_FEATURE_LABELS.helpdesk);
      return;
    }
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

  /** 화면은 Navbar 아래로 이어지고, 스크롤·FAB만 글래스 바 위로 올림 */
  const navbarClearance = suppressNavbarClearance
    ? Math.max(insets.bottom, 8)
    : getNavbarOverlayHeight(insets.bottom);
  const fabBottom = navbarClearance + ROUTE_FAB_BOTTOM_OFFSET;
  const guideTraveloguePad =
    guideScrollTargetId === GUIDE_TARGET.traveloguePreview ? 140 : 0;

  return (
    <View className="flex-1 bg-brand-background" style={layout.screen}>
      <ScrollView
        ref={scrollRef}
        className="flex-1 px-5"
        contentContainerStyle={{
          paddingBottom:
            fabBottom +
            FAB_SIZE +
            (showTripRebootFab ? FAB_GAP + FAB_SIZE : 0) +
            16 +
            guideTraveloguePad,
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
            if (id === 'restaurants') {
              navigation.navigate('PlaceMapSearch', {
                contentTypeId: PLACE_CONTENT_TYPE.restaurant,
              });
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

        <View
          onLayout={e => {
            travelogueOffsetY.current = e.nativeEvent.layout.y;
          }}>
          <TraveloguePreview
            trendingTitle={copy.trendingTitle}
            language={language}
            latestTravelogue={latestTravelogue}
            loading={loadingTravelogue}
            onTraveloguePress={() => {
              if (isAlphaFeatureBlocked('travelogue') || isAlphaFeatureBlocked('feed')) {
                showUnavailable(ALPHA_FEATURE_LABELS.travelogue);
                return;
              }
              if (latestTravelogue) {
                navigation.navigate('TravelRecordDetail', {
                  travelRecordId: latestTravelogue.travelRecordId,
                });
              } else {
                goToTab('feed');
              }
            }}
            onFeedPress={() => {
              if (isAlphaFeatureBlocked('feed')) {
                showUnavailable(ALPHA_FEATURE_LABELS.feed);
                return;
              }
              goToTab('feed');
            }}
          />
        </View>
      </ScrollView>

      <HomeActionFabs
        bottom={fabBottom}
        helpLabel={helpCopy.fabLabel}
        showReboot={showTripRebootFab}
        onHelpPress={goToHelpDesk}
        onRebootPress={goToReboot}
      />

      <TransientBottomToast
        text={toastText}
        opacity={toastOpacity}
        bottom={fabBottom}
      />
    </View>
  );
}
