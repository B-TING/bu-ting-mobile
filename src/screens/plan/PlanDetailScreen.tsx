import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PlanSyncStatusDot } from '../../components/plan/PlanSyncStatusDot';
import { TransientBottomToast } from '../../components/shared/feedback/TransientBottomToast';
import { BackButton } from '../../components/shared/buttons/BackButton';
import { BudgetEntryModal } from '../../components/plan/modals/BudgetEntryModal';
import { PlacePickModal } from '../../components/plan/modals/PlacePickModal';
import { TravelInviteLinkModal } from '../../components/plan/modals/TravelInviteLinkModal';
import { RouteOptimizeFab, routeFabBottom } from '../../components/plan/fab/RouteOptimizeFab';
import { getNavbarOverlayHeight } from '../../components/shared/navigation/Navbar';
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
import { type PlanDetailTab } from '../../constants/plan/planDetail';
import { useAppLanguage, useCopy } from '../../i18n';
import { useAppAlert } from '../../components/shared/modals';
import { usePlanRoutePlaceDetails } from '../../hooks/usePlanRoutePlaceDetails';
import { useTravelMembersSync } from '../../hooks/useTravelMembersSync';
import type { RootStackParamList } from '../../navigation/types';
import { navigateToMainTab } from '../../navigation/navigateToMainTab';
import { addPlanPlaceFromCandidate, findDayRoute, getDayRoutesFromPlan, removePlanPlaceFromApi, replacePlanPlaceFromCandidate, routesInItemOrder, updatePlanPlaceMemoOnApi, updatePlanPlaceOrderOnApi } from '../../services/travel/planPlaceSync';
import {
  addPlanDayOnApi,
  canAddPlanDay,
  canRemovePlanDay,
  computeNextPlanDay,
  removePlanDayOnApi,
} from '../../services/travel/planDaySync';
import { resolveTravelInviteLink } from '../../services/travel/travelTeamService';
import { updateTravelStatus } from '../../services/travel/travelService';
import {
  EMPTY_REVIEWS,
  hydrateRoutePlaceInfo,
  useAppStore,
  useAuthStore,
  usePlanStore,
  useTravelogueStore,
} from '../../stores';
import { selectIsPlanOfflineSync } from '../../stores/usePlanStore';
import { selectReusableAccessToken } from '../../stores/useAuthStore';
import {
  filterPlansForCurrentApiServer,
} from '../../utils/api/apiServerOrigin';
import { useApiTravelPlanSync } from '../../hooks/useApiTravelPlanSync';
import { usePlanOfflineSyncFeedback } from '../../hooks/usePlanOfflineSyncFeedback';
import type { BudgetEntry, RouteItem, TravelLegMode } from '../../types/travelPlan';
import { sortedRoutes } from '../../utils/plan/planItinerary';
import { optimizeRouteOrder } from '../../utils/plan/routeOptimize';
import {
  candidateToRouteItem,
  type RebootPlaceCandidate,
} from '../../utils/places/rebootPlaces';
import { mergeRouteWithPlaceDetail } from '../../utils/places/routePlaceDetail';
import { getReviewForRoute, reviewProgress } from '../../utils/review/travelReview';
import { lockPlanScheduleIfApiError } from '../../utils/travel/scheduleApiLock';

type Props = NativeStackScreenProps<RootStackParamList, 'PlanDetail'> & {
  embeddedInMainTabs?: boolean;
};

const EMPTY_BUDGET: BudgetEntry[] = [];

export function PlanDetailScreen({ navigation, route, embeddedInMainTabs = false }: Props) {
  const paramPlanId = route.params?.planId;
  const insets = useSafeAreaInsets();
  const language = useAppLanguage();

  const plans = usePlanStore(s => filterPlansForCurrentApiServer(s.plans));
  const activePlanId = usePlanStore(s => s.activePlanId);
  const budgetByPlan = usePlanStore(s => s.budgetByPlan);
  const toggleVisited = usePlanStore(s => s.toggleRouteVisited);
  const replaceRoute = usePlanStore(s => s.replaceRouteInPlan);
  const addRoute = usePlanStore(s => s.addRouteToPlan);
  const removeRoute = usePlanStore(s => s.removeRouteFromPlan);
  const reorderRoutes = usePlanStore(s => s.reorderRoutesInPlan);
  const updateRouteMemo = usePlanStore(s => s.updateRouteMemo);
  const addItineraryDay = usePlanStore(s => s.addItineraryDay);
  const removeItineraryDay = usePlanStore(s => s.removeItineraryDay);
  const addBudgetEntry = usePlanStore(s => s.addBudgetEntry);
  const completePlan = usePlanStore(s => s.completePlan);
  const upsertPlaceReview = useTravelogueStore(s => s.upsertPlaceReview);
  const displayName = useAppStore(s => s.auth.displayName) ?? 'Traveler';
  const accessToken = useAuthStore(selectReusableAccessToken);
  const authUser = useAuthStore(s => s.user);

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
  const isApiPlan = plan?.source === 'api';
  const isPlanOfflineSync = usePlanStore(selectIsPlanOfflineSync(planId));
  const scheduleReadOnly = isApiPlan && isPlanOfflineSync;
  const travelId = plan?.apiTravelId ?? plan?.planId;

  const copy = useCopy('planDetail');
  const { toastText, toastOpacity, showToast } = usePlanOfflineSyncFeedback({
    planId,
    enabled: isApiPlan,
    message: copy.offlineSyncNotice,
  });

  const notifyScheduleReadOnly = useCallback(() => {
    showToast(copy.offlineSyncNotice);
  }, [showToast, copy.offlineSyncNotice]);

  const { syncFromServer } = useApiTravelPlanSync({
    planId,
    enabled: isApiPlan,
    accessToken,
  });
  useTravelMembersSync({
    planId,
    travelId,
    accessToken,
    enabled: isApiPlan,
  });
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

  const reviewCopy = useCopy('travelReview');
  const { alert } = useAppAlert();

  const [tab, setTab] = useState<PlanDetailTab>(route.params?.tab ?? 'overview');
  const [selectedDay, setSelectedDay] = useState(1);
  const [scheduleModal, setScheduleModal] = useState<ScheduleModalState>({ kind: 'none' });
  const [scheduleReorderActive, setScheduleReorderActive] = useState(false);
  const [reviewFormRoute, setReviewFormRoute] = useState<RouteItem | null>(null);
  const [budgetModalOpen, setBudgetModalOpen] = useState(false);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [inviteExpiredAt, setInviteExpiredAt] = useState<string | null>(null);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);

  const canInvite = useMemo(() => {
    if (!isApiPlan || !authUser?.userId || !plan) {
      return false;
    }
    return plan.members.some(
      member => member.userId === authUser.userId && member.role === 'LEADER',
    );
  }, [authUser?.userId, isApiPlan, plan]);

  const loadInviteLink = useCallback(async () => {
    if (!accessToken || !travelId) {
      return;
    }
    setInviteLoading(true);
    setInviteError(null);
    try {
      const result = await resolveTravelInviteLink(accessToken, travelId);
      setInviteLink(result.inviteLink);
      setInviteExpiredAt(result.expiredAt ?? null);
    } catch (error) {
      setInviteError(error instanceof Error ? error.message : copy.inviteLinkError);
      setInviteLink(null);
      setInviteExpiredAt(null);
    } finally {
      setInviteLoading(false);
    }
  }, [accessToken, copy.inviteLinkError, travelId]);

  const handleInvite = useCallback(() => {
    if (!canInvite) {
      alert({ title: copy.inviteMembers, message: copy.inviteLeaderOnly });
      return;
    }
    setInviteModalOpen(true);
    void loadInviteLink();
  }, [alert, canInvite, copy.inviteLeaderOnly, copy.inviteMembers, loadInviteLink]);

  const closeInviteModal = useCallback(() => {
    setInviteModalOpen(false);
    setInviteLink(null);
    setInviteExpiredAt(null);
    setInviteError(null);
  }, []);

  const lockScheduleOnApiError = useCallback(
    (error: unknown) => {
      if (!isApiPlan) {
        return;
      }
      lockPlanScheduleIfApiError(planId, error);
    },
    [isApiPlan, planId],
  );

  const scheduleRef = useRef<PlanScheduleTabHandle>(null);
  const openRebootPendingRef = useRef(route.params?.openReboot === true);

  const rawAllRoutes = useMemo(
    () => plan?.itinerary.flatMap(day => sortedRoutes(day.routes)) ?? [],
    [plan],
  );
  const detailsByPlaceId = usePlanRoutePlaceDetails(rawAllRoutes, tab === 'schedule');

  const enrichedPlan = useMemo(() => {
    if (!plan) {
      return null;
    }
    return {
      ...plan,
      itinerary: plan.itinerary.map(day => ({
        ...day,
        routes: sortedRoutes(day.routes).map(route => {
          const withCatalog = hydrateRoutePlaceInfo(route, language);
          return mergeRouteWithPlaceDetail(
            withCatalog,
            detailsByPlaceId[route.placeId] ?? null,
            language,
          );
        }),
      })),
    };
  }, [plan, language, detailsByPlaceId]);

  const tripDates = useMemo(
    () => enrichedPlan?.itinerary.map(day => day.date) ?? [],
    [enrichedPlan],
  );

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
  const addPlaceAnchor =
    lastScheduleRoute?.location ?? enrichedPlan?.constraints.initialAnchor;

  const closeScheduleModal = useCallback(() => {
    setScheduleModal({ kind: 'none' });
  }, []);

  const handleDeleteRoute = useCallback(
    async (route: RouteItem) => {
      if (!planId || scheduleReadOnly) {
        if (scheduleReadOnly) {
          notifyScheduleReadOnly();
        }
        return;
      }

      if (isApiPlan && accessToken && (route.apiPlanPlaceId || route.itemId)) {
        try {
          await removePlanPlaceFromApi(accessToken, route);
          await syncFromServer();
        } catch (error) {
          lockScheduleOnApiError(error);
          const message =
            error instanceof Error ? error.message : '장소 삭제에 실패했습니다.';
          Alert.alert('장소 삭제 실패', message);
          return;
        }
        return;
      }

      removeRoute(planId, route.itemId);
    },
    [planId, scheduleReadOnly, isApiPlan, accessToken, removeRoute, syncFromServer, lockScheduleOnApiError, notifyScheduleReadOnly],
  );

  const resolveSelectedDayAfterRemove = useCallback(
    (removedDayNumber: number, previousSelected: number) => {
      const itinerary =
        usePlanStore.getState().plans.find(p => p.planId === planId)?.itinerary ?? [];
      if (itinerary.length === 0) {
        return 1;
      }
      if (itinerary.some(day => day.dayNumber === previousSelected)) {
        return previousSelected;
      }
      if (previousSelected === removedDayNumber) {
        return Math.max(1, removedDayNumber - 1);
      }
      if (previousSelected > removedDayNumber) {
        const adjusted = previousSelected - 1;
        if (itinerary.some(day => day.dayNumber === adjusted)) {
          return adjusted;
        }
      }
      return itinerary[itinerary.length - 1]?.dayNumber ?? 1;
    },
    [planId],
  );

  const handleAddDay = useCallback(async () => {
    if (!planId || !enrichedPlan || scheduleReadOnly) {
      if (scheduleReadOnly) {
        notifyScheduleReadOnly();
      }
      return;
    }

    if (!canAddPlanDay(enrichedPlan)) {
      alert({ title: copy.addDay, message: copy.cannotAddMoreDays });
      return;
    }

    if (isApiPlan && accessToken) {
      try {
        const next = await addPlanDayOnApi(accessToken, enrichedPlan);
        await syncFromServer();
        setSelectedDay(next.dayNumber);
      } catch (error) {
        lockScheduleOnApiError(error);
        const message =
          error instanceof Error ? error.message : copy.cannotAddMoreDays;
        Alert.alert(copy.addDay, message);
      }
      return;
    }

    const next = computeNextPlanDay(enrichedPlan);
    if (!next) {
      alert({ title: copy.addDay, message: copy.cannotAddMoreDays });
      return;
    }
    addItineraryDay(planId, next.dayNumber, next.visitDate);
    setSelectedDay(next.dayNumber);
  }, [
    planId,
    enrichedPlan,
    scheduleReadOnly,
    isApiPlan,
    accessToken,
    alert,
    copy,
    addItineraryDay,
    syncFromServer,
    lockScheduleOnApiError,
    notifyScheduleReadOnly,
  ]);

  const confirmRemoveDay = useCallback(async () => {
    if (!planId || !enrichedPlan || !scheduleDay || scheduleReadOnly) {
      return;
    }

    const removedDayNumber = scheduleDay.dayNumber;
    const previousSelected = selectedDay;

    if (isApiPlan && accessToken) {
      try {
        await removePlanDayOnApi(accessToken, enrichedPlan, scheduleDay);
        await syncFromServer();
        setSelectedDay(resolveSelectedDayAfterRemove(removedDayNumber, previousSelected));
      } catch (error) {
        lockScheduleOnApiError(error);
        const message =
          error instanceof Error ? error.message : copy.removeDayConfirmTitle;
        Alert.alert(copy.removeDay, message);
      }
      return;
    }

    removeItineraryDay(planId, removedDayNumber);
    setSelectedDay(resolveSelectedDayAfterRemove(removedDayNumber, previousSelected));
  }, [
    planId,
    enrichedPlan,
    scheduleDay,
    scheduleReadOnly,
    selectedDay,
    isApiPlan,
    accessToken,
    copy,
    removeItineraryDay,
    syncFromServer,
    lockScheduleOnApiError,
    resolveSelectedDayAfterRemove,
  ]);

  const handleRemoveDay = useCallback(() => {
    if (!planId || !enrichedPlan || !scheduleDay || scheduleReadOnly) {
      if (scheduleReadOnly) {
        notifyScheduleReadOnly();
      }
      return;
    }

    if (!canRemovePlanDay(enrichedPlan)) {
      alert({ title: copy.removeDay, message: copy.cannotRemoveLastDay });
      return;
    }

    alert({
      title: copy.removeDayConfirmTitle,
      message: copy.removeDayConfirmMessage(scheduleDay.date, scheduleDay.dayNumber),
      buttons: [
        { label: copy.rebootCancel, variant: 'secondary', onPress: () => {} },
        {
          label: copy.removeDayConfirm,
          variant: 'primary',
          onPress: () => {
            void confirmRemoveDay();
          },
        },
      ],
    });
  }, [
    planId,
    enrichedPlan,
    scheduleDay,
    scheduleReadOnly,
    alert,
    copy,
    confirmRemoveDay,
    notifyScheduleReadOnly,
  ]);

  const handleSaveRouteMemo = useCallback(
    async (route: RouteItem, memo: string | undefined) => {
      if (!planId || scheduleReadOnly) {
        if (scheduleReadOnly) {
          notifyScheduleReadOnly();
        }
        return;
      }

      const previousMemo = route.memo;
      updateRouteMemo(planId, route.itemId, memo);

      if (isApiPlan && accessToken) {
        try {
          await updatePlanPlaceMemoOnApi(accessToken, route, memo ?? null);
        } catch (error) {
          updateRouteMemo(planId, route.itemId, previousMemo);
          lockScheduleOnApiError(error);
          const message =
            error instanceof Error ? error.message : '메모 저장에 실패했습니다.';
          Alert.alert('메모 저장 실패', message);
        }
      }
    },
    [planId, scheduleReadOnly, isApiPlan, accessToken, updateRouteMemo, lockScheduleOnApiError, notifyScheduleReadOnly],
  );

  const handlePickReplacement = useCallback(
    async (candidate: RebootPlaceCandidate, legMode?: TravelLegMode) => {
      if (!pickRoute || !planId || !scheduleDay || scheduleReadOnly) {
        return;
      }

      const apiPlanId = scheduleDay.apiPlanId;
      if (isApiPlan && accessToken && apiPlanId) {
        try {
          const synced = await syncFromServer();
          const freshRoute =
            findDayRoute(synced, scheduleDay.dayNumber, pickRoute) ?? pickRoute;

          const replaced = await replacePlanPlaceFromCandidate(
            accessToken,
            freshRoute,
            candidate,
          );
          await syncFromServer();
          if (legMode && legMode !== pickRoute.legMode) {
            usePlanStore.getState().updateRouteLegMode(planId, replaced.itemId, legMode);
          }
          closeScheduleModal();
        } catch (error) {
          lockScheduleOnApiError(error);
          const message =
            error instanceof Error ? error.message : '장소 변경에 실패했습니다.';
          Alert.alert('장소 변경 실패', message);
          await syncFromServer();
        }
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
      closeScheduleModal();
    },
    [
      pickRoute,
      scheduleDay,
      language,
      planId,
      isApiPlan,
      accessToken,
      replaceRoute,
      closeScheduleModal,
      scheduleReadOnly,
      syncFromServer,
      lockScheduleOnApiError,
    ],
  );

  const handleReorderRoutes = useCallback(
    async (dayNumber: number, orderedItemIds: string[]) => {
      if (!planId || scheduleReadOnly) {
        return;
      }

      const day = enrichedPlan?.itinerary.find(d => d.dayNumber === dayNumber);
      const apiPlanId = day?.apiPlanId;
      if (!isApiPlan || !accessToken || !apiPlanId) {
        reorderRoutes(planId, dayNumber, orderedItemIds);
        return;
      }

      try {
        const synced = await syncFromServer();
        const freshRoutes = getDayRoutesFromPlan(synced, dayNumber);
        const orderedRoutes = routesInItemOrder(freshRoutes, orderedItemIds);
        if (orderedRoutes.length !== freshRoutes.length) {
          throw new Error(
            '일정이 동기화되지 않았습니다. 잠시 후 다시 시도해 주세요.',
          );
        }

        await updatePlanPlaceOrderOnApi(accessToken, apiPlanId, orderedRoutes);
        await syncFromServer();
      } catch (error) {
        lockScheduleOnApiError(error);
        const message =
          error instanceof Error ? error.message : '순서 변경에 실패했습니다.';
        Alert.alert('순서 변경 실패', message);
        await syncFromServer();
      }
    },
    [planId, scheduleReadOnly, enrichedPlan, isApiPlan, accessToken, reorderRoutes, syncFromServer, lockScheduleOnApiError],
  );

  const handleOptimizeDayRoute = useCallback(
    async (dayNumber: number) => {
      if (!planId || scheduleReadOnly) {
        return;
      }

      const day = enrichedPlan?.itinerary.find(d => d.dayNumber === dayNumber);
      const apiPlanId = day?.apiPlanId;
      const routes = getDayRoutesFromPlan(enrichedPlan, dayNumber);
      if (routes.length < 2) {
        return;
      }

      if (!isApiPlan || !accessToken || !apiPlanId) {
        const orderedItemIds = optimizeRouteOrder(routes).map(r => r.itemId);
        reorderRoutes(planId, dayNumber, orderedItemIds);
        alert({ title: copy.routeOptimize, message: copy.routeOptimized });
        return;
      }

      try {
        const synced = await syncFromServer();
        const freshRoutes = getDayRoutesFromPlan(synced, dayNumber);
        if (freshRoutes.length < 2) {
          return;
        }
        const optimized = optimizeRouteOrder(freshRoutes);

        await updatePlanPlaceOrderOnApi(accessToken, apiPlanId, optimized);
        await syncFromServer();
        alert({ title: copy.routeOptimize, message: copy.routeOptimized });
      } catch (error) {
        lockScheduleOnApiError(error);
        const message =
          error instanceof Error ? error.message : '경로 최적화에 실패했습니다.';
        Alert.alert('경로 최적화 실패', message);
        await syncFromServer();
      }
    },
    [planId, scheduleReadOnly, enrichedPlan, isApiPlan, accessToken, reorderRoutes, syncFromServer, alert, copy, lockScheduleOnApiError],
  );

  const handleAddPlace = useCallback(
    async (candidate: RebootPlaceCandidate, legMode?: TravelLegMode) => {
      if (!scheduleDay || !planId || !enrichedPlan || scheduleReadOnly) {
        return;
      }

      const apiPlanId = scheduleDay.apiPlanId;
      if (isApiPlan && apiPlanId && accessToken) {
        try {
          await syncFromServer();
          await addPlanPlaceFromCandidate(accessToken, apiPlanId, candidate);
          const afterAdd = await syncFromServer();
          if (legMode && legMode !== 'walk') {
            const dayRoutes = getDayRoutesFromPlan(afterAdd, scheduleDay.dayNumber);
            const added = dayRoutes.find(r => r.placeId === candidate.placeId);
            if (added) {
              usePlanStore.getState().updateRouteLegMode(planId, added.itemId, legMode);
            }
          }
          closeScheduleModal();
        } catch (error) {
          lockScheduleOnApiError(error);
          const message =
            error instanceof Error ? error.message : '장소 추가에 실패했습니다.';
          Alert.alert('장소 추가 실패', message);
          await syncFromServer();
        }
        return;
      }

      const newRoute = candidateToRouteItem(
        candidate,
        scheduleRoutes.length + 1,
        language,
        'ATTRACTION',
        legMode ?? 'walk',
      );
      addRoute(planId, scheduleDay.dayNumber, newRoute);
      closeScheduleModal();
    },
    [
      scheduleDay,
      scheduleRoutes,
      language,
      planId,
      enrichedPlan,
      scheduleReadOnly,
      isApiPlan,
      accessToken,
      addRoute,
      closeScheduleModal,
      syncFromServer,
      lockScheduleOnApiError,
    ],
  );

  const handleCompletePlan = useCallback(async () => {
    if (!planId) {
      return;
    }

    if (isApiPlan && accessToken && plan) {
      try {
        await updateTravelStatus(accessToken, plan.apiTravelId ?? plan.planId, {
          status: 'COMPLETED',
        });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : '여행 완료 처리에 실패했습니다.';
        Alert.alert('여행 완료 실패', message);
        return;
      }
    }

    completePlan(planId);
    navigateToMainTab(navigation, 'home');
  }, [planId, isApiPlan, accessToken, plan, completePlan, navigation]);

  const requestCompletePlan = useCallback(() => {
    alert({
      title: reviewCopy.completeTripConfirmTitle,
      message: reviewCopy.completeTripConfirmMessage,
      buttons: [
        { label: reviewCopy.cancel, variant: 'secondary', onPress: () => {} },
        {
          label: reviewCopy.completeTripConfirm,
          variant: 'primary',
          onPress: () => {
            void handleCompletePlan();
          },
        },
      ],
    });
  }, [alert, reviewCopy, handleCompletePlan]);

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
    LEADER: copy.roleLeader,
    MEMBER: copy.roleMember,
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

  /** 글래스 Navbar 위로 FAB·스크롤만 올리고, 화면 배경은 계속 비침 */
  const contentBottomInset = embeddedInMainTabs
    ? getNavbarOverlayHeight(insets.bottom)
    : insets.bottom;

  return (
    <View className="flex-1 bg-brand-background">
      <View className="flex-row items-center border-b border-brand-border bg-brand-surface px-4 py-3">
        {!embeddedInMainTabs ? (
          <BackButton
            accessibilityLabel={language === 'ko' ? '메인으로' : 'Back to home'}
            onPress={() => navigateToMainTab(navigation, 'home')}
          />
        ) : null}
        <Text className="flex-1 text-lg font-bold text-brand-text" numberOfLines={1}>
          {enrichedPlan.title}
        </Text>
        {isApiPlan ? <PlanSyncStatusDot offline={isPlanOfflineSync} /> : null}
      </View>

      <PlanTabPager
        active={tab}
        onChange={setTab}
        language={language}
        scrollBottomInset={contentBottomInset}
        horizontalScrollEnabled={
          !scheduleReorderActive && tab !== 'schedule' && tab !== 'overview'
        }
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
              showInvite={isApiPlan && canInvite}
              onInvite={handleInvite}
            />
          ),
          schedule: (
            <PlanScheduleTab
              ref={scheduleRef}
              planId={planId}
              plan={enrichedPlan}
              language={language}
              copy={copy}
              readOnly={scheduleReadOnly}
              onReadOnlyPress={scheduleReadOnly ? notifyScheduleReadOnly : undefined}
              selectedDay={selectedDay}
              planReviews={planReviews}
              onSelectDay={setSelectedDay}
              onToggleVisited={itemId => {
                if (scheduleReadOnly) {
                  notifyScheduleReadOnly();
                  return;
                }
                toggleVisited(planId, itemId);
              }}
              onWriteReview={setReviewFormRoute}
              onQuickRating={handleQuickRating}
              onDeleteRoute={handleDeleteRoute}
              onSaveRouteMemo={scheduleReadOnly ? undefined : handleSaveRouteMemo}
              onReorderRoutes={scheduleReadOnly ? undefined : isApiPlan ? handleReorderRoutes : undefined}
              onOptimizeDayRoute={scheduleReadOnly ? undefined : isApiPlan ? handleOptimizeDayRoute : undefined}
              onScheduleModalChange={setScheduleModal}
              onReorderActiveChange={setScheduleReorderActive}
              canAddDay={!scheduleReadOnly}
              canRemoveDay={canRemovePlanDay(enrichedPlan)}
              onAddDay={() => {
                void handleAddDay();
              }}
              onRemoveDay={handleRemoveDay}
              scrollBottomInset={contentBottomInset}
            />
          ),
          budget: (
            <PlanBudgetTab
              copy={copy}
              language={language}
              tripDates={tripDates}
              budgetEntries={budgetEntries}
              budgetTotal={budgetTotal}
              members={enrichedPlan.members}
              onAddExpense={() => setBudgetModalOpen(true)}
              scrollBottomInset={contentBottomInset}
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
                void handleCompletePlan();
              }}
              onEndTrip={requestCompletePlan}
              onViewFeed={() => navigateToMainTab(navigation, 'feed')}
              onViewTravelogue={travelogueId =>
                navigation.navigate('TravelogueDetail', { travelogueId })
              }
            />
          ),
        }}
      />

      {tab === 'schedule' && !scheduleReadOnly ? (
        <RouteOptimizeFab
          bottom={routeFabBottom(contentBottomInset)}
          label={copy.routeOptimize}
          addPlaceLabel={copy.addPlace}
          onPress={() => scheduleRef.current?.handleRouteOptimize()}
          onAddPlace={() => scheduleRef.current?.handleAddPlacePress()}
        />
      ) : null}

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
        useTourApiNearby
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
        anchor={addPlaceAnchor}
        language={language}
        showTransportMode
        defaultLegMode="walk"
        useTourApiNearby
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

      <TravelInviteLinkModal
        visible={inviteModalOpen}
        copy={copy}
        inviteLink={inviteLink}
        expiredAt={inviteExpiredAt}
        loading={inviteLoading}
        errorMessage={inviteError}
        onClose={closeInviteModal}
        onRetry={() => void loadInviteLink()}
      />

      <TransientBottomToast
        text={toastText}
        opacity={toastOpacity}
        bottom={contentBottomInset + 16}
      />
    </View>
  );
}
