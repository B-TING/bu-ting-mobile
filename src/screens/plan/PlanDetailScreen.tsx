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
import { addPlanPlaceFromCandidate, findDayRoute, getDayRoutesFromPlan, removePlanPlaceFromApi, replacePlanPlaceFromCandidate, routesInItemOrder, updatePlanPlaceMemoOnApi, updatePlanPlaceOrderOnApi, updatePlanPlaceVisitedOnApi } from '../../services/travel/planPlaceSync';
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
  PlaceReviewSyncError,
  savePlaceReviewForTravel,
} from '../../services/travel/savePlaceReviewForTravel';
import { deletePlaceReviewForTravel } from '../../services/travel/deletePlaceReviewForTravel';
import { loadPlanPlaceReviewsForTravel } from '../../services/travel/loadPlanPlaceReviewsForTravel';
import { fetchMyTravelRecords } from '../../services/travel/travelRecordService';
import {
  EMPTY_REVIEWS,
  hydrateRoutePlaceInfo,
  useAppStore,
  useAuthStore,
  usePlanStore,
  useTravelRecordStore,
} from '../../stores';
import { selectIsPlanOfflineSync } from '../../stores/usePlanStore';
import { selectReusableAccessToken } from '../../stores/useAuthStore';
import { useApiTravelPlanSync } from '../../hooks/useApiTravelPlanSync';
import { usePlanOfflineSyncFeedback } from '../../hooks/usePlanOfflineSyncFeedback';
import type { BudgetEntry, RouteItem, TravelLegMode } from '../../types/travelPlan';
import type { PlaceReview } from '../../types/travelReview';
import { sortedRoutes } from '../../utils/plan/planItinerary';
import { optimizeRouteOrder } from '../../utils/plan/routeOptimize';
import {
  candidateToRouteItem,
  type RebootPlaceCandidate,
} from '../../utils/places/rebootPlaces';
import { mergeRouteWithPlaceDetail } from '../../utils/places/routePlaceDetail';
import { getReviewForPlace, reviewProgress } from '../../utils/review/travelReview';
import { lockPlanScheduleIfApiError } from '../../utils/travel/scheduleApiLock';

type Props = NativeStackScreenProps<RootStackParamList, 'PlanDetail'> & {
  embeddedInMainTabs?: boolean;
};

const EMPTY_BUDGET: BudgetEntry[] = [];

export function PlanDetailScreen({ navigation, route, embeddedInMainTabs = false }: Props) {
  const paramPlanId = route.params?.planId;
  const insets = useSafeAreaInsets();
  const language = useAppLanguage();
  const offlineMode = useAppStore(s => s.offlineMode);
  const setOfflineMode = useAppStore(s => s.setOfflineMode);

  const plans = usePlanStore(s => s.plans);
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
  const viewOnly = scheduleReadOnly || offlineMode;
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
    enabled: isApiPlan && !offlineMode,
    accessToken,
  });
  useTravelMembersSync({
    planId,
    travelId,
    accessToken,
    enabled: isApiPlan && !offlineMode,
  });
  const planReviews =
    useTravelRecordStore(s =>
      travelId ? s.reviewsByTravelId[travelId] : undefined,
    ) ?? EMPTY_REVIEWS;
  const [isPlanPublished, setIsPlanPublished] = useState(false);

  const planPlaceIdsKey = useMemo(() => {
    if (!plan) {
      return '';
    }
    return plan.itinerary
      .flatMap(day => day.routes)
      .map(r => r.apiPlanPlaceId)
      .filter(Boolean)
      .join(',');
  }, [plan]);

  useEffect(() => {
    if (!planId || !accessToken || !isApiPlan || !travelId) {
      setIsPlanPublished(false);
      return;
    }
    let cancelled = false;
    void fetchMyTravelRecords(accessToken)
      .then(list => {
        if (cancelled) {
          return;
        }
        const match = list.find(
          item =>
            item.travelId === travelId &&
            (item.status === 'PUBLISHED' || item.status === 'HIDDEN'),
        );
        setIsPlanPublished(Boolean(match));
      })
      .catch(() => {
        if (!cancelled) {
          setIsPlanPublished(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [planId, accessToken, isApiPlan, travelId]);

  useEffect(() => {
    if (!planId || !accessToken || !isApiPlan) {
      return;
    }
    const current = usePlanStore.getState().plans.find(p => p.planId === planId);
    if (!current) {
      return;
    }
    void loadPlanPlaceReviewsForTravel({ accessToken, plan: current });
  }, [planId, accessToken, isApiPlan, planPlaceIdsKey]);

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
  const [savingReview, setSavingReview] = useState(false);
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
  const scheduleRoutes = useMemo(
    () => (scheduleDay ? sortedRoutes(scheduleDay.routes) : []),
    [scheduleDay],
  );
  const schedulePlaceIds = useMemo(
    () => scheduleRoutes.map(r => r.placeId),
    [scheduleRoutes],
  );
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
      if (!planId || viewOnly) {
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
    [
      planId,
      viewOnly,
      scheduleReadOnly,
      isApiPlan,
      accessToken,
      removeRoute,
      syncFromServer,
      lockScheduleOnApiError,
      notifyScheduleReadOnly,
    ],
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
    if (!planId || !enrichedPlan || viewOnly) {
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
    viewOnly,
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
    if (!planId || !enrichedPlan || !scheduleDay || viewOnly) {
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
    viewOnly,
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
    if (!planId || !enrichedPlan || !scheduleDay || viewOnly) {
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
    viewOnly,
    alert,
    copy,
    confirmRemoveDay,
    notifyScheduleReadOnly,
  ]);

  const handleToggleVisited = useCallback(
    (itemId: string) => {
      if (!planId || !plan) {
        return;
      }
      if (scheduleReadOnly) {
        notifyScheduleReadOnly();
        return;
      }

      const route = plan.itinerary
        .flatMap(day => day.routes)
        .find(r => r.itemId === itemId);
      if (!route) {
        return;
      }

      const nextVisited = !route.isVisited;
      toggleVisited(planId, itemId);

      if (isApiPlan && accessToken && route.apiPlanPlaceId) {
        void updatePlanPlaceVisitedOnApi(accessToken, route, nextVisited).catch(error => {
          toggleVisited(planId, itemId);
          if (__DEV__) {
            console.warn('[PlanDetail] visited PATCH failed', error);
          }
        });
      }
    },
    [
      planId,
      plan,
      scheduleReadOnly,
      notifyScheduleReadOnly,
      toggleVisited,
      isApiPlan,
      accessToken,
    ],
  );

  const handleSaveRouteMemo = useCallback(
    async (route: RouteItem, memo: string | undefined) => {
      if (!planId || viewOnly) {
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
    [
      planId,
      viewOnly,
      scheduleReadOnly,
      isApiPlan,
      accessToken,
      updateRouteMemo,
      lockScheduleOnApiError,
      notifyScheduleReadOnly,
    ],
  );

  const handlePickReplacement = useCallback(
    async (candidate: RebootPlaceCandidate, legMode?: TravelLegMode) => {
      if (!pickRoute || !planId || !scheduleDay || viewOnly) {
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
      viewOnly,
      syncFromServer,
      lockScheduleOnApiError,
    ],
  );

  const handleReorderRoutes = useCallback(
    async (dayNumber: number, orderedItemIds: string[]) => {
      if (!planId || viewOnly) {
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
    [
      planId,
      viewOnly,
      enrichedPlan,
      isApiPlan,
      accessToken,
      reorderRoutes,
      syncFromServer,
      lockScheduleOnApiError,
    ],
  );

  const handleOptimizeDayRoute = useCallback(
    async (dayNumber: number) => {
      if (!planId || viewOnly) {
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
    [
      planId,
      viewOnly,
      enrichedPlan,
      isApiPlan,
      accessToken,
      reorderRoutes,
      syncFromServer,
      alert,
      copy,
      lockScheduleOnApiError,
    ],
  );

  const handleAddPlace = useCallback(
    async (candidate: RebootPlaceCandidate, legMode?: TravelLegMode) => {
      if (!scheduleDay || !planId || !enrichedPlan || viewOnly) {
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
      viewOnly,
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
      if (offlineMode || !plan) {
        return;
      }
      void savePlaceReviewForTravel({
        accessToken,
        plan,
        route: routeItem,
        authorNickname: displayName,
        payload: {
          rating,
          tags: [],
          content: null,
          media: [],
        },
      });
    },
    [accessToken, plan, displayName, offlineMode],
  );

  const handleSavePlaceReview = useCallback(
    async (
      payload: Omit<PlaceReview, 'placeReviewId' | 'createdAt' | 'updatedAt'> & {
        placeReviewId?: string;
      },
    ) => {
      if (!plan || !reviewFormRoute) {
        return;
      }
      setSavingReview(true);
      try {
        await savePlaceReviewForTravel({
          accessToken,
          plan,
          route: reviewFormRoute,
          authorNickname: displayName,
          payload: {
            placeReviewId: payload.placeReviewId,
            rating: payload.rating,
            content: payload.content,
            tags: payload.tags,
            media: payload.media,
          },
        });
      } finally {
        setSavingReview(false);
      }
    },
    [accessToken, plan, reviewFormRoute, displayName],
  );

  const handleDeletePlaceReview = useCallback(() => {
    return new Promise<void>((resolve, reject) => {
      if (!plan || !reviewFormRoute) {
        reject(new Error('no route'));
        return;
      }
      const existing = getReviewForPlace(
        planReviews,
        reviewFormRoute.apiPlanPlaceId ?? reviewFormRoute.itemId,
      );
      alert({
        title: reviewCopy.deleteReviewConfirmTitle,
        message: reviewCopy.deleteReviewConfirmMessage,
        buttons: [
          {
            label: reviewCopy.cancel,
            variant: 'secondary',
            onPress: () => reject(new Error('cancelled')),
          },
          {
            label: reviewCopy.deleteReviewConfirm,
            variant: 'danger',
            onPress: () => {
              void (async () => {
                setSavingReview(true);
                try {
                  await deletePlaceReviewForTravel({
                    accessToken,
                    plan,
                    route: reviewFormRoute,
                    placeReviewId: existing?.placeReviewId,
                  });
                  resolve();
                } catch (error) {
                  alert({
                    title:
                      error instanceof PlaceReviewSyncError
                        ? error.message
                        : error instanceof Error
                          ? error.message
                          : 'Failed to delete review.',
                  });
                  reject(error);
                } finally {
                  setSavingReview(false);
                }
              })();
            },
          },
        ],
      });
    });
  }, [
    accessToken,
    plan,
    reviewFormRoute,
    planReviews,
    alert,
    reviewCopy,
  ]);

  const exitOffline = useCallback(() => {
    setOfflineMode(false);
    navigation.reset({
      index: 0,
      routes: [{ name: 'Login' }],
    });
  }, [navigation, setOfflineMode]);

  useEffect(() => {
    openRebootPendingRef.current = route.params?.openReboot === true;
  }, [route.params?.openReboot]);

  useEffect(() => {
    if (offlineMode || !openRebootPendingRef.current || !enrichedPlan) {
      return;
    }

    openRebootPendingRef.current = false;
    setTab('schedule');
    navigation.setParams({ openReboot: undefined });

    const timer = setTimeout(() => {
      scheduleRef.current?.handleRebootFabPress();
    }, 400);

    return () => clearTimeout(timer);
  }, [enrichedPlan, navigation, offlineMode]);

  useEffect(() => {
    if (scheduleModal.kind === 'pick' && !pickRoute) {
      closeScheduleModal();
    }
  }, [scheduleModal.kind, pickRoute, closeScheduleModal]);

  useEffect(() => {
    if (!enrichedPlan) {
      if (offlineMode) {
        exitOffline();
      } else {
        navigation.replace('PlanWizard');
      }
    }
  }, [enrichedPlan, navigation, offlineMode, exitOffline]);

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

  /** 메인 탭 absolute Navbar 위로 콘텐츠·FAB가 오도록 */
  const mainTabBottomClearance = embeddedInMainTabs
    ? getNavbarOverlayHeight(insets.bottom)
    : 0;
  const fabBottomInset = embeddedInMainTabs
    ? mainTabBottomClearance
    : insets.bottom;

  return (
    <View className="flex-1 bg-brand-background">
      <View className="flex-row items-center border-b border-brand-border bg-brand-surface px-4 py-3">
        {!embeddedInMainTabs ? (
          <BackButton
            accessibilityLabel={
              offlineMode
                ? language === 'ko'
                  ? '로그인으로'
                  : 'Back to login'
                : language === 'ko'
                  ? '메인으로'
                  : 'Back to home'
            }
            onPress={() => {
              if (offlineMode) {
                exitOffline();
              } else {
                navigateToMainTab(navigation, 'home');
              }
            }}
          />
        ) : null}
        <Text className="flex-1 text-lg font-bold text-brand-text" numberOfLines={1}>
          {enrichedPlan.title}
        </Text>
        {isApiPlan && !offlineMode ? (
          <PlanSyncStatusDot offline={isPlanOfflineSync} />
        ) : null}
      </View>

      {offlineMode ? (
        <View className="border-b border-brand-border bg-brand-selected px-4 py-2">
          <Text className="text-center text-xs font-semibold text-brand-primary">
            {language === 'ko'
              ? '오프라인 모드 · 열람만 가능'
              : 'Offline mode · view only'}
          </Text>
        </View>
      ) : null}

      <View
        className="min-h-0 flex-1"
        style={
          mainTabBottomClearance > 0
            ? { marginBottom: mainTabBottomClearance }
            : undefined
        }>
        <PlanTabPager
          active={tab}
          onChange={setTab}
          language={language}
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
                isTravelRecordPublished={isPlanPublished}
                showInvite={isApiPlan && canInvite && !offlineMode}
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
                readOnly={viewOnly}
                onReadOnlyPress={scheduleReadOnly ? notifyScheduleReadOnly : undefined}
                selectedDay={selectedDay}
                planReviews={planReviews}
                onSelectDay={setSelectedDay}
                onToggleVisited={itemId => {
                  if (viewOnly) {
                    if (scheduleReadOnly) {
                      notifyScheduleReadOnly();
                    }
                    return;
                  }
                  handleToggleVisited(itemId);
                }}
                onWriteReview={routeItem => {
                  if (offlineMode) {
                    return;
                  }
                  setReviewFormRoute(routeItem);
                }}
                onQuickRating={handleQuickRating}
                onDeleteRoute={handleDeleteRoute}
                onSaveRouteMemo={viewOnly ? undefined : handleSaveRouteMemo}
                onReorderRoutes={
                  viewOnly ? undefined : isApiPlan ? handleReorderRoutes : undefined
                }
                onOptimizeDayRoute={
                  viewOnly ? undefined : isApiPlan ? handleOptimizeDayRoute : undefined
                }
                onScheduleModalChange={modal => {
                  if (offlineMode) {
                    return;
                  }
                  setScheduleModal(modal);
                }}
                onReorderActiveChange={setScheduleReorderActive}
                canAddDay={!viewOnly}
                canRemoveDay={canRemovePlanDay(enrichedPlan)}
                onAddDay={() => {
                  void handleAddDay();
                }}
                onRemoveDay={handleRemoveDay}
                scrollBottomInset={embeddedInMainTabs ? 0 : undefined}
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
                onAddExpense={
                  offlineMode ? undefined : () => setBudgetModalOpen(true)
                }
              />
            ),
            records: (
              <PlanRecordsTab
                plan={enrichedPlan}
                allRoutes={allRoutes}
                language={language}
                authorNickname={displayName}
                destinationLabel={enrichedPlan.title}
                isTripActive={!offlineMode && enrichedPlan.status !== 'COMPLETED'}
                onPublished={
                  offlineMode
                    ? undefined
                    : () => {
                        setIsPlanPublished(true);
                        if (planId) {
                          completePlan(planId);
                        }
                        navigateToMainTab(navigation, 'home');
                      }
                }
                onEndTrip={offlineMode ? undefined : requestCompletePlan}
                onViewFeed={
                  offlineMode ? undefined : () => navigateToMainTab(navigation, 'feed')
                }
                onViewTravelRecord={
                  offlineMode
                    ? undefined
                    : travelRecordId =>
                        navigation.navigate('TravelRecordDetail', { travelRecordId })
                }
              />
            ),
          }}
        />
      </View>


      {tab === 'schedule' && !viewOnly ? (
        <RouteOptimizeFab
          bottom={routeFabBottom(fabBottomInset)}
          label={copy.routeOptimize}
          addPlaceLabel={copy.addPlace}
          onPress={() => scheduleRef.current?.handleRouteOptimize()}
          onAddPlace={() => scheduleRef.current?.handleAddPlacePress()}
        />
      ) : null}

      <BudgetEntryModal
        visible={!offlineMode && budgetModalOpen}
        copy={copy}
        language={language}
        members={enrichedPlan.members}
        defaultDate={day?.date ?? enrichedPlan.startDate}
        planId={planId}
        onClose={() => setBudgetModalOpen(false)}
        onSave={entry => addBudgetEntry(entry)}
      />

      <PlacePickModal
        visible={!offlineMode && scheduleModal.kind === 'pick' && !!pickRoute}
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
        visible={!offlineMode && scheduleModal.kind === 'add'}
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
        visible={!offlineMode && !!reviewFormRoute}
        route={reviewFormRoute}
        existing={
          reviewFormRoute
            ? getReviewForPlace(
                planReviews,
                reviewFormRoute.apiPlanPlaceId ?? reviewFormRoute.itemId,
              )
            : undefined
        }
        copy={reviewCopy}
        language={language}
        saving={savingReview}
        onClose={() => {
          if (!savingReview) {
            setReviewFormRoute(null);
          }
        }}
        onSave={handleSavePlaceReview}
        onDelete={
          reviewFormRoute &&
          getReviewForPlace(
            planReviews,
            reviewFormRoute.apiPlanPlaceId ?? reviewFormRoute.itemId,
          )
            ? handleDeletePlaceReview
            : undefined
        }
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
        bottom={fabBottomInset + 16}
      />
    </View>
  );
}
