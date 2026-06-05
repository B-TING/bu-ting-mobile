import { useCallback, useEffect, useMemo, useRef, useState } from 'react';



import { Text, View } from 'react-native';

import type { NativeStackScreenProps } from '@react-navigation/native-stack';



import { useSafeAreaInsets } from 'react-native-safe-area-context';







import { BackButton } from '../../components/plan/BackButton';



import { PlaceDetailModal } from '../../components/plan/PlaceDetailModal';



import { PlanTabPager } from '../../components/plan/PlanTabPager';



import { PlanBudgetTab } from '../../components/plan/detail/PlanBudgetTab';



import { PlanExploreTab } from '../../components/plan/detail/PlanExploreTab';



import { PlanOverviewTab } from '../../components/plan/detail/PlanOverviewTab';



import { PlanRecordsTab } from '../../components/plan/detail/PlanRecordsTab';



import {
  PlanScheduleTab,
  type PlanScheduleTabHandle,
  type ScheduleModalState,
} from '../../components/plan/detail/PlanScheduleTab';
import { PlacePickModal } from '../../components/plan/PlacePickModal';
import { ScheduleRebootFab } from '../../components/plan/ScheduleRebootFab';



import {



  PLAN_DETAIL_COPY,



  type PlanDetailTab,



} from '../../constants/planDetail';



import type { RootStackParamList } from '../../navigation/types';



import { PlaceReviewFormModal } from '../../components/review/PlaceReviewFormModal';
import { TRAVEL_REVIEW_COPY } from '../../constants/travelReview';
import {
  EMPTY_REVIEWS,
  hydrateRoutePlaceInfo,
  useAppStore,
  usePlanStore,
  useTravelogueStore,
} from '../../stores';
import { getReviewForRoute, reviewProgress } from '../../utils/travelReview';



import type { BudgetEntry, RouteItem } from '../../types/travelPlan';



import { sortedRoutes } from '../../utils/planItinerary';
import { candidateToRouteItem } from '../../utils/rebootPlaces';
import type { RebootPlaceCandidate } from '../../utils/rebootPlaces';







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



    return (



      plans.find(p => p.status === 'DRAFT' || p.status === 'CONFIRMED') ?? null



    );



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



  const [tab, setTab] = useState<PlanDetailTab>('overview');



  const [selectedDay, setSelectedDay] = useState(1);



  const [selectedRoute, setSelectedRoute] = useState<RouteItem | null>(null);
  const scheduleRef = useRef<PlanScheduleTabHandle>(null);
  const [scheduleModal, setScheduleModal] = useState<ScheduleModalState>({ kind: 'none' });
  const [scheduleReorderActive, setScheduleReorderActive] = useState(false);
  const [reviewFormRoute, setReviewFormRoute] = useState<RouteItem | null>(null);
  const reviewCopy = TRAVEL_REVIEW_COPY[language];







  const enrichedPlan = useMemo(() => {



    if (!plan) {



      return null;



    }



    return {



      ...plan,



      itinerary: plan.itinerary.map(day => ({



        ...day,



        routes: sortedRoutes(day.routes).map(r =>



          hydrateRoutePlaceInfo(r, language),



        ),



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
    (candidate: RebootPlaceCandidate) => {
      if (!pickRoute || !planId) {
        return;
      }
      const replacement = candidateToRouteItem(
        candidate,
        pickRoute.sequence,
        language,
        pickRoute.type === 'LOCKER' ? 'ATTRACTION' : pickRoute.type,
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
    (candidate: RebootPlaceCandidate) => {
      if (!scheduleDay || !planId) {
        return;
      }
      const newRoute = candidateToRouteItem(candidate, scheduleRoutes.length, language);
      addRoute(planId, scheduleDay.dayNumber, newRoute);
      closeScheduleModal();
    },
    [scheduleDay, scheduleRoutes.length, language, planId, addRoute, closeScheduleModal],
  );

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

  const addSampleExpense = () => {



    addBudgetEntry({



      planId,



      label: language === 'ko' ? '점심 (자갈치)' : 'Lunch',



      amount: 28000,



      currency: 'KRW',



      date: day?.date ?? enrichedPlan.startDate,



      paidByUserId: enrichedPlan.members[0]?.userId ?? 'local-user',



    });



  };







  return (



    <View className="flex-1 bg-brand-background" style={{ paddingTop: insets.top }}>



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



        bottomInset={insets.bottom}

        horizontalScrollEnabled={!scheduleReorderActive}

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
              onSelectDay={setSelectedDay}
              onSelectRoute={setSelectedRoute}
              onToggleVisited={itemId => toggleVisited(planId, itemId)}
              onRouteRemoved={itemId => {
                if (selectedRoute?.itemId === itemId) {
                  setSelectedRoute(null);
                }
              }}
              onScheduleModalChange={setScheduleModal}
              onReorderActiveChange={setScheduleReorderActive}
            />



          ),



          explore: (



            <PlanExploreTab copy={copy} language={language} allRoutes={allRoutes} />



          ),



          budget: (



            <PlanBudgetTab



              copy={copy}



              budgetEntries={budgetEntries}



              budgetTotal={budgetTotal}



              onAddSample={addSampleExpense}



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
        <ScheduleRebootFab
          bottom={insets.bottom + 72}
          onPress={() => scheduleRef.current?.handleRebootFabPress()}
        />
      )}

      <PlacePickModal
        visible={scheduleModal.kind === 'pick' && !!pickRoute}
        anchor={pickRoute?.location}
        language={language}
        copy={{
          title: copy.rebootModalTitle,
          subtitle: pickRoute ? copy.rebootModalSub(pickRoute.placeName) : undefined,
          nearbyTitle: copy.rebootNearbyTitle,
          searchPlaceholder: copy.rebootSearchPlaceholder,
          searchEmpty: copy.rebootSearchEmpty,
          applyLabel: copy.rebootApply,
          cancelLabel: copy.rebootCancel,
          distance: copy.rebootDistance,
        }}
        excludePlaceIds={schedulePlaceIds}
        onClose={closeScheduleModal}
        onSelect={handlePickReplacement}
      />

      <PlacePickModal
        visible={scheduleModal.kind === 'add'}
        anchor={lastScheduleRoute?.location}
        language={language}
        copy={{
          title: copy.addPlaceTitle,
          subtitle: copy.addPlaceSub,
          nearbyTitle: copy.addPlaceBrowseTitle,
          searchPlaceholder: copy.rebootSearchPlaceholder,
          searchEmpty: copy.rebootSearchEmpty,
          applyLabel: copy.addPlaceConfirm,
          cancelLabel: copy.addPlaceClose,
          distance: copy.rebootDistance,
        }}
        excludePlaceIds={schedulePlaceIds}
        onClose={closeScheduleModal}
        onSelect={handleAddPlace}
      />

      <PlaceDetailModal
        visible={!!selectedRoute}
        route={selectedRoute}
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


