import { useCallback, useMemo, useRef, useState } from 'react';



import { Pressable, Text, View } from 'react-native';

import { CommonActions } from '@react-navigation/native';

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



import { PrimaryButton } from '../../components/setup/PrimaryButton';



import {



  PLAN_DETAIL_COPY,



  type PlanDetailTab,



} from '../../constants/planDetail';



import { PLAN_WIZARD_COPY } from '../../constants/planWizard';



import type { RootStackParamList } from '../../navigation/types';



import { hydrateRoutePlaceInfo, useAppStore, usePlanStore } from '../../stores';



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



  const onboarding = useAppStore(s => s.onboarding);



  const resetSetup = useAppStore(s => s.resetSetup);



  const plans = usePlanStore(s => s.plans);



  const activePlanId = usePlanStore(s => s.activePlanId);



  const budgetByPlan = usePlanStore(s => s.budgetByPlan);



  const toggleVisited = usePlanStore(s => s.toggleRouteVisited);
  const replaceRoute = usePlanStore(s => s.replaceRouteInPlan);
  const addRoute = usePlanStore(s => s.addRouteToPlan);

  const addBudgetEntry = usePlanStore(s => s.addBudgetEntry);







  const plan = useMemo(() => {



    if (paramPlanId) {



      return plans.find(p => p.planId === paramPlanId) ?? null;



    }



    if (activePlanId) {



      return plans.find(p => p.planId === activePlanId) ?? null;



    }



    return (



      plans.find(p => p.status === 'DRAFT' || p.status === 'CONFIRMED') ?? null



    );



  }, [paramPlanId, plans, activePlanId]);







  const planId = plan?.planId ?? '';



  const budgetEntries = useMemo(



    () => (planId ? budgetByPlan[planId] : undefined) ?? EMPTY_BUDGET,



    [budgetByPlan, planId],



  );







  const copy = PLAN_DETAIL_COPY[language];



  const wizardCopy = PLAN_WIZARD_COPY[language];



  const [tab, setTab] = useState<PlanDetailTab>('overview');



  const [selectedDay, setSelectedDay] = useState(1);



  const [selectedRoute, setSelectedRoute] = useState<RouteItem | null>(null);
  const scheduleRef = useRef<PlanScheduleTabHandle>(null);
  const [rebootFabEnabled, setRebootFabEnabled] = useState(false);
  const [scheduleModal, setScheduleModal] = useState<ScheduleModalState>({ kind: 'none' });
  const [scheduleReorderActive, setScheduleReorderActive] = useState(false);







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

  if (!enrichedPlan) {



    return (



      <View



        className="flex-1 bg-brand-background px-6"



        style={{ paddingTop: insets.top + 8, paddingBottom: insets.bottom + 24 }}>



        <View className="mb-6 flex-row items-center">



          <BackButton



            accessibilityLabel={language === 'ko' ? '메인으로' : 'Back to home'}



            onPress={() => navigation.navigate('MainHome')}



          />



          <Text className="flex-1 text-2xl font-bold text-brand-primary">부팅</Text>



        </View>



        <Text className="mb-10 text-base text-brand-muted">



          {language === 'ko' ? '나만의 부산 여행 가이드' : 'Your Busan travel guide'}



        </Text>



        <View className="mb-8 flex-1 justify-center rounded-2xl border-2 border-dashed border-brand-border bg-brand-surface p-8">



          <Text className="mb-2 text-center text-lg font-semibold text-brand-text">



            {wizardCopy.noPlan}



          </Text>



          <Text className="text-center text-sm text-brand-muted">



            {wizardCopy.noPlanSub}



          </Text>



        </View>



        <PrimaryButton



          label={wizardCopy.createPlan}



          onPress={() => navigation.navigate('PlanWizard')}



        />



        {__DEV__ && (



          <Pressable



            className="mt-6 self-center p-3 active:opacity-80"



            onPress={() => {



              resetSetup();



              navigation.dispatch(



                CommonActions.reset({



                  index: 0,



                  routes: [{ name: 'LanguageSelection' }],



                }),



              );



            }}>



            <Text className="text-[13px] text-brand-primary underline">



              {onboarding?.language === 'ko'



                ? '[DEV] 초기 설정 초기화'



                : '[DEV] Reset setup'}



            </Text>



          </Pressable>



        )}



      </View>



    );



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
              onRebootFabEnabledChange={setRebootFabEnabled}
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



          records: <PlanRecordsTab copy={copy} language={language} />,



        }}



      />







      {tab === 'schedule' && (
        <ScheduleRebootFab
          enabled={rebootFabEnabled}
          label={copy.rebootFabLabel}
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



      />



    </View>



  );



}


