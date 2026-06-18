import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BackButton } from '../../components/shared/buttons/BackButton';
import { BudgetEntryModal } from '../../components/plan/modals/BudgetEntryModal';
import { PlaceDetailModal } from '../../components/plan/modals/PlaceDetailModal';
import { PlacePickModal } from '../../components/plan/modals/PlacePickModal';
import { RouteOptimizeFab, routeFabBottom } from '../../components/plan/fab/RouteOptimizeFab';
import { PlanBudgetTab } from '../../components/plan/tabs/PlanBudgetTab';
import { PlanOverviewTab } from '../../components/plan/tabs/PlanOverviewTab';
import { PlanRecordsTab } from '../../components/plan/tabs/PlanRecordsTab';
import {
  PlanScheduleTab,
  type PlanScheduleTabHandle,
  type ScheduleModalState,
} from '../../components/plan/tabs/PlanScheduleTab';
import { PlanTabPager } from '../../components/plan/tabs/PlanTabPager';
import { PlaceReviewFormModal } from '../../components/review/modals/PlaceReviewFormModal';
import { PLAN_DETAIL_COPY, type PlanDetailTab } from '../../constants/planDetail';
import { TRAVEL_REVIEW_COPY } from '../../constants/travelReview';
import type { RootStackParamList } from '../../navigation/types';
import {
  EMPTY_REVIEWS,
  hydrateRoutePlaceInfo,
  useAppStore,
  usePlanStore,
  useTravelogueStore,
} from '../../stores';
import type { BudgetEntry, RouteItem, TravelLegMode } from '../../types/travelPlan';
import { sortedRoutes } from '../../utils/planItinerary';
import {
  candidateToRouteItem,
  type RebootPlaceCandidate,
} from '../../utils/rebootPlaces';
import { getReviewForRoute, reviewProgress } from '../../utils/travelReview';

type Props = NativeStackScreenProps<RootStackParamList, 'PlanDetail'>;

const EMPTY_BUDGET: BudgetEntry[] = [];

export function PlanDetailScreen({ navigation, route }: Props) {
  const paramPlanId = route.params?.planId;
  const insets = useSafeAreaInsets();
  const language = useAppStore(s => s.language) ?? 'ko';

  const plans = usePlanStore(s => s.plans);
  const activePlanId = usePlanStore(s => s.activePlanId);
  const budgetByPlan = usePlanStore(s => s.budgetByPlan);
  const toggleVisited = usePlanStore(s => s.toggleRouteVisited);
  const replaceRoute = usePlanStore(s => s.replaceRouteInPlan);
  const addRoute = usePlanStore(s => s.addRouteToPlan);
  const addBudgetEntry = usePlanStore(s => s.addBudgetEntry);
  const completePlan = usePlanStore(s => s.completePlan);
  const upsertPlaceReview = useTravelogueStore(s => s.upsertPlaceReview);
  const displayName = useAppStore(s => s.auth.displayName) ?? 'Traveler';

  const plan = useMemo(() => {
    if (paramPlanId) {
      return plans.find(p => p.planId === paramPlanId) ?? null;
    }
    if (activePlanId) {
      const active = plans.find(p => p.planId === activePlanId);
      if (active && active.status !== 'COMPLETED') {
        return active;
      }
    }
    return plans.find(p => p.status === 'DRAFT' || p.status === 'CONFIRMED') ?? null;
  }, [paramPlanId, plans, activePlanId]);

  const planId = plan?.planId ?? '';
  const planReviews =
    useTravelogueStore(s => (planId ? s.reviewsByPlan[planId] : undefined)) ??
    EMPTY_REVIEWS;
  const isPlanPublished = useTravelogueStore(s =>
    planId ? s.publishedPlanIds.includes(planId) : false,
  );

  const budgetEntries = useMemo(
    () => (planId ? budgetByPlan[planId] : undefined) ?? EMPTY_BUDGET,
    [budgetByPlan, planId],
  );

  const copy = PLAN_DETAIL_COPY[language];
  const reviewCopy = TRAVEL_REVIEW_COPY[language];

  const [tab, setTab] = useState<PlanDetailTab>(route.params?.tab ?? 'overview');
  const [selectedDay, setSelectedDay] = useState(1);
  const [selectedRoute, setSelectedRoute] = useState<RouteItem | null>(null);
  const [scheduleModal, setScheduleModal] = useState<ScheduleModalState>({ kind: 'none' });
  const [scheduleReorderActive, setScheduleReorderActive] = useState(false);
  const [reviewFormRoute, setReviewFormRoute] = useState<RouteItem | null>(null);
  const [budgetModalOpen, setBudgetModalOpen] = useState(false);

  const scheduleRef = useRef<PlanScheduleTabHandle>(null);
  const openRebootPendingRef = useRef(route.params?.openReboot === true);

  const enrichedPlan = useMemo(() => {
    if (!plan) {
      return null;
    }
    return {
      ...plan,
      itinerary: plan.itinerary.map(day => ({
        ...day,
        routes: sortedRoutes(day.routes).map(r => hydrateRoutePlaceInfo(r, language)),
      })),
    };
  }, [plan, language]);

  const allRoutes = useMemo(
    () => enrichedPlan?.itinerary.flatMap(d => d.routes) ?? [],
    [enrichedPlan],
  );

  const recordsProgress = useMemo(
    () => reviewProgress(allRoutes, planReviews),
    [allRoutes, planReviews],
  );

  const scheduleDay =
    enrichedPlan?.itinerary.find(d => d.dayNumber === selectedDay) ??
    enrichedPlan?.itinerary[0];
  const scheduleRoutes = scheduleDay ? sortedRoutes(scheduleDay.routes) : [];
  const schedulePlaceIds = scheduleRoutes.map(r => r.placeId);
  const pickRoute =
    scheduleModal.kind === 'pick'
      ? (scheduleRoutes.find(r => r.itemId === scheduleModal.itemId) ?? null)
      : null;
  const lastScheduleRoute = scheduleRoutes[scheduleRoutes.length - 1];

  const closeScheduleModal = useCallback(() => {
    setScheduleModal({ kind: 'none' });
  }, []);

  const handlePickReplacement = useCallback(
    (candidate: RebootPlaceCandidate, legMode?: TravelLegMode) => {
      if (!pickRoute || !planId) {
        return;
      }
      const replacement = candidateToRouteItem(
        candidate,
        pickRoute.sequence,
        language,
        pickRoute.type === 'LOCKER' ? 'ATTRACTION' : pickRoute.type,
        legMode ?? pickRoute.legMode,
      );
      replaceRoute(planId, pickRoute.itemId, replacement);
      if (selectedRoute?.itemId === pickRoute.itemId) {
        setSelectedRoute({
          ...replacement,
          itemId: pickRoute.itemId,
          sequence: pickRoute.sequence,
        });
      }
      closeScheduleModal();
    },
    [pickRoute, language, planId, replaceRoute, selectedRoute, closeScheduleModal],
  );

  const handleAddPlace = useCallback(
    (candidate: RebootPlaceCandidate, legMode?: TravelLegMode) => {
      if (!scheduleDay || !planId) {
        return;
      }
      const newRoute = candidateToRouteItem(
        candidate,
        scheduleRoutes.length,
        language,
        'ATTRACTION',
        legMode ?? 'walk',
      );
      addRoute(planId, scheduleDay.dayNumber, newRoute);
      closeScheduleModal();
    },
    [scheduleDay, scheduleRoutes.length, language, planId, addRoute, closeScheduleModal],
  );

  const handleQuickRating = useCallback(
    (routeItem: RouteItem, rating: number) => {
      if (!planId) {
        return;
      }
      upsertPlaceReview(planId, {
        planId,
        routeItemId: routeItem.itemId,
        placeId: routeItem.placeId,
        placeName: routeItem.placeName,
        rating,
        tags: [],
        comment: '',
        media: [],
      });
    },
    [planId, upsertPlaceReview],
  );

  useEffect(() => {
    openRebootPendingRef.current = route.params?.openReboot === true;
  }, [route.params?.openReboot]);

  useEffect(() => {
    if (!openRebootPendingRef.current || !enrichedPlan) {
      return;
    }

    openRebootPendingRef.current = false;
    setTab('schedule');
    navigation.setParams({ openReboot: undefined });

    const timer = setTimeout(() => {
      scheduleRef.current?.handleRebootFabPress();
    }, 400);

    return () => clearTimeout(timer);
  }, [enrichedPlan, navigation]);

  useEffect(() => {
    if (scheduleModal.kind === 'pick' && !pickRoute) {
      closeScheduleModal();
    }
  }, [scheduleModal.kind, pickRoute, closeScheduleModal]);

  useEffect(() => {
    if (!enrichedPlan) {
      navigation.replace('PlanWizard');
    }
  }, [enrichedPlan, navigation]);

  if (!enrichedPlan) {
    return null;
  }

  const roleLabels = {
    OWNER: copy.roleOwner,
    EDITOR: copy.roleEditor,
    VIEWER: copy.roleViewer,
  };

  const budgetTotal = budgetEntries.reduce((s, e) => s + e.amount, 0);
  const day =
    enrichedPlan.itinerary.find(d => d.dayNumber === selectedDay) ??
    enrichedPlan.itinerary[0];

  const transportCopy = {
    transportModeTitle: copy.transportModeTitle,
    legWalk: copy.legWalk,
    legDrive: copy.legDrive,
    legTransit: copy.legTransit,
  };

  return (
    <View
      className="flex-1 bg-brand-background"
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}>
      <View className="flex-row items-center border-b border-brand-border bg-brand-surface px-4 py-3">
        <BackButton
          accessibilityLabel={language === 'ko' ? '메인으로' : 'Back to home'}
          onPress={() => navigation.navigate('MainHome')}
        />
        <Text className="flex-1 text-lg font-bold text-brand-text" numberOfLines={1}>
          {enrichedPlan.title}
        </Text>
      </View>

      <PlanTabPager
        active={tab}
        onChange={setTab}
        language={language}
        horizontalScrollEnabled={!scheduleReorderActive && tab !== 'schedule'}
        pages={{
          overview: (
            <PlanOverviewTab
              plan={enrichedPlan}
              language={language}
              copy={copy}
              roleLabels={roleLabels}
              budgetEntries={budgetEntries}
              budgetTotal={budgetTotal}
              onNavigateToTab={setTab}
              recordsProgress={recordsProgress}
              isTraveloguePublished={isPlanPublished}
            />
          ),
          schedule: (
            <PlanScheduleTab
              ref={scheduleRef}
              planId={planId}
              plan={enrichedPlan}
              language={language}
              copy={copy}
              selectedDay={selectedDay}
              planReviews={planReviews}
              onSelectDay={setSelectedDay}
              onSelectRoute={setSelectedRoute}
              onToggleVisited={itemId => toggleVisited(planId, itemId)}
              onWriteReview={setReviewFormRoute}
              onQuickRating={handleQuickRating}
              onRouteRemoved={itemId => {
                if (selectedRoute?.itemId === itemId) {
                  setSelectedRoute(null);
                }
              }}
              onScheduleModalChange={setScheduleModal}
              onReorderActiveChange={setScheduleReorderActive}
            />
          ),
          budget: (
            <PlanBudgetTab
              copy={copy}
              budgetEntries={budgetEntries}
              budgetTotal={budgetTotal}
              members={enrichedPlan.members}
              onAddExpense={() => setBudgetModalOpen(true)}
            />
          ),
          records: (
            <PlanRecordsTab
              plan={enrichedPlan}
              allRoutes={allRoutes}
              language={language}
              authorName={displayName}
              destinationLabel={enrichedPlan.title}
              isTripActive={enrichedPlan.status !== 'COMPLETED'}
              onPublished={() => {
                completePlan(planId);
                navigation.navigate('MainHome');
              }}
              onEndTrip={() => {
                completePlan(planId);
                navigation.navigate('MainHome');
              }}
              onViewFeed={() => navigation.navigate('TravelogueFeed')}
              onViewTravelogue={travelogueId =>
                navigation.navigate('TravelogueDetail', { travelogueId })
              }
            />
          ),
        }}
      />

      {tab === 'schedule' && (
        <RouteOptimizeFab
          bottom={routeFabBottom(insets.bottom)}
          label={copy.routeOptimize}
          addPlaceLabel={copy.addPlace}
          onPress={() => scheduleRef.current?.handleRouteOptimize()}
          onAddPlace={() => scheduleRef.current?.handleAddPlacePress()}
        />
      )}

      <BudgetEntryModal
        visible={budgetModalOpen}
        copy={copy}
        language={language}
        members={enrichedPlan.members}
        defaultDate={day?.date ?? enrichedPlan.startDate}
        planId={planId}
        onClose={() => setBudgetModalOpen(false)}
        onSave={entry => addBudgetEntry(entry)}
      />

      <PlacePickModal
        visible={scheduleModal.kind === 'pick' && !!pickRoute}
        anchor={pickRoute?.location}
        language={language}
        showTransportMode
        defaultLegMode={pickRoute?.legMode ?? 'walk'}
        copy={{
          title: copy.rebootModalTitle,
          subtitle: pickRoute ? copy.rebootModalSub(pickRoute.placeName) : undefined,
          nearbyTitle: copy.rebootNearbyTitle,
          searchPlaceholder: copy.rebootSearchPlaceholder,
          searchEmpty: copy.rebootSearchEmpty,
          applyLabel: copy.rebootApply,
          cancelLabel: copy.rebootCancel,
          distance: copy.rebootDistance,
          ...transportCopy,
        }}
        excludePlaceIds={schedulePlaceIds}
        onClose={closeScheduleModal}
        onSelect={handlePickReplacement}
      />

      <PlacePickModal
        visible={scheduleModal.kind === 'add'}
        anchor={lastScheduleRoute?.location}
        language={language}
        showTransportMode
        defaultLegMode="walk"
        copy={{
          title: copy.addPlaceTitle,
          subtitle: copy.addPlaceSub,
          nearbyTitle: copy.addPlaceBrowseTitle,
          searchPlaceholder: copy.rebootSearchPlaceholder,
          searchEmpty: copy.rebootSearchEmpty,
          applyLabel: copy.addPlaceConfirm,
          cancelLabel: copy.addPlaceClose,
          distance: copy.rebootDistance,
          ...transportCopy,
        }}
        excludePlaceIds={schedulePlaceIds}
        onClose={closeScheduleModal}
        onSelect={handleAddPlace}
      />

      <PlaceDetailModal
        visible={!!selectedRoute}
        route={selectedRoute}
        language={language}
        copy={copy}
        placeReview={
          selectedRoute
            ? getReviewForRoute(planReviews, selectedRoute.itemId)
            : undefined
        }
        onClose={() => setSelectedRoute(null)}
        onToggleVisited={() => {
          if (selectedRoute) {
            toggleVisited(planId, selectedRoute.itemId);
            setSelectedRoute({
              ...selectedRoute,
              isVisited: !selectedRoute.isVisited,
            });
          }
        }}
        onWriteReview={() => {
          if (selectedRoute) {
            setReviewFormRoute(selectedRoute);
          }
        }}
      />

      <PlaceReviewFormModal
        visible={!!reviewFormRoute}
        route={reviewFormRoute}
        existing={
          reviewFormRoute
            ? getReviewForRoute(planReviews, reviewFormRoute.itemId)
            : undefined
        }
        copy={reviewCopy}
        language={language}
        planId={planId}
        onClose={() => setReviewFormRoute(null)}
        onSave={payload => upsertPlaceReview(planId, payload)}
      />
    </View>
  );
}
