import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert } from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  type PlanScheduleTabHandle,
  type ScheduleModalState,
} from '../../components/plan/tabs/PlanScheduleTab';
import { routeFabBottom } from '../../components/plan/fab/RouteOptimizeFab';
import { getNavbarOverlayHeight } from '../../components/shared/navigation/Navbar';
import { type PlanDetailTab } from '../../constants/plan/planDetail';
import { useAppLanguage, useCopy } from '../../i18n';
import { useAppAlert, useFeatureUnavailableAlert } from '../../components/shared/modals';
import {
  ALPHA_FEATURE_LABELS,
  isAlphaFeatureBlocked,
} from '../../constants/common/alphaFeatureBlocks';
import { useBusanSearchLocationWhen } from '../usePlaceMapUserLocation';
import { usePlanRoutePlaceDetails } from '../usePlanRoutePlaceDetails';
import { useTravelExpensesSync } from '../useTravelExpensesSync';
import { useTravelMembersSync } from '../useTravelMembersSync';
import type { RootStackParamList } from '../../navigation/types';
import { navigateToMainTab } from '../../navigation/navigateToMainTab';
import {
  addPlanPlaceFromCandidate,
  findDayRoute,
  getDayRoutesFromPlan,
  removePlanPlaceFromApi,
  replacePlanPlaceFromCandidate,
  routesInItemOrder,
  updatePlanPlaceMemoOnApi,
  updatePlanPlaceOrderOnApi,
  updatePlanPlaceVisitedOnApi,
} from '../../services/travel/planPlaceSync';
import {
  addPlanDayOnApi,
  canAddPlanDay,
  canRemovePlanDay,
  computeNextPlanDay,
  removePlanDayOnApi,
} from '../../services/travel/planDaySync';
import {
  budgetEntryToCreateRequest,
  expenseCreateResponseToBudgetEntry,
} from '../../services/travel/travelExpenseMapper';
import { createTravelExpense } from '../../services/travel/travelExpenseService';
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
import { useApiTravelPlanSync } from '../useApiTravelPlanSync';
import { usePlanOfflineSyncFeedback } from '../usePlanOfflineSyncFeedback';
import { usePlanPicker } from './usePlanPicker';
import type { BudgetEntry, RouteItem, TravelLegMode } from '../../types/travelPlan';
import type { PlaceReview } from '../../types/travelReview';
import { sortedRoutes } from '../../utils/plan/planItinerary';
import { optimizeRouteOrder } from '../../utils/plan/routeOptimize';
import {
  buildMemberSummariesFromBudgetEntries,
  buildTransfersFromMemberSummaries,
  pickCurrencyMemberSummaries,
} from '../../utils/plan/budgetSettlementPreview';
import {
  candidateToRouteItem,
  type RebootPlaceCandidate,
} from '../../utils/places/rebootPlaces';
import { mergeRouteWithPlaceDetail } from '../../utils/places/routePlaceDetail';
import { getReviewForPlace, reviewProgress } from '../../utils/review/travelReview';
import { lockPlanScheduleIfApiError } from '../../utils/travel/scheduleApiLock';
import type { BudgetEntryDraft } from '../../components/plan/modals/BudgetEntryModal';

const EMPTY_BUDGET: BudgetEntry[] = [];

export type UsePlanDetailScreenParams = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'PlanDetail'>;
  paramPlanId?: string;
  initialTab?: PlanDetailTab;
  openReboot?: boolean;
  embeddedInMainTabs?: boolean;
};

export function usePlanDetailScreen({
  navigation,
  paramPlanId,
  initialTab,
  openReboot,
  embeddedInMainTabs = false,
}: UsePlanDetailScreenParams) {
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
  const pickerCopy = useCopy('mainHome');
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
  const {
    syncExpenses,
    refreshSettlementPreview,
    settlement,
    summary,
    settlementLoading,
    settlementError,
    confirming,
    confirmSettlement,
  } = useTravelExpensesSync({
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
  const { showUnavailable } = useFeatureUnavailableAlert();

  const [tab, setTab] = useState<PlanDetailTab>(initialTab ?? 'overview');
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

  const {
    pickerPlans,
    canSwitchPlans,
    planPickerOpen,
    openPlanPicker,
    closePlanPicker,
    selectPlan: applySelectedPlan,
  } = usePlanPicker(plan);

  const selectPlan = useCallback(
    (nextPlanId: string) => {
      applySelectedPlan(nextPlanId);
      if (!embeddedInMainTabs) {
        navigation.setParams({ planId: nextPlanId });
      }
    },
    [applySelectedPlan, embeddedInMainTabs, navigation],
  );

  const viewedPlanIdRef = useRef(planId);
  useEffect(() => {
    if (viewedPlanIdRef.current === planId) {
      return;
    }
    viewedPlanIdRef.current = planId;
    setSelectedDay(1);
    setScheduleModal({ kind: 'none' });
    setScheduleReorderActive(false);
    setReviewFormRoute(null);
    setBudgetModalOpen(false);
    setInviteModalOpen(false);
  }, [planId]);

  const canInvite = useMemo(() => {
    if (!isApiPlan || !authUser?.userId || !plan) {
      return false;
    }
    return plan.members.some(
      member => member.userId === authUser.userId && member.role === 'LEADER',
    );
  }, [authUser?.userId, isApiPlan, plan]);

  const settlementConfirmed = settlement?.confirmed === true;
  const canConfirmSettlement = canInvite && !settlementConfirmed && !offlineMode;

  const settlementMemberSummaries = useMemo(() => {
    const fromApi = pickCurrencyMemberSummaries(summary?.currencySummaries);
    if (fromApi.length > 0) {
      return fromApi;
    }
    if (!plan || budgetEntries.length === 0) {
      return [];
    }
    return buildMemberSummariesFromBudgetEntries(budgetEntries, plan.members);
  }, [budgetEntries, plan, summary]);

  const settlementForDisplay = useMemo(() => {
    if (!settlement && settlementMemberSummaries.length === 0) {
      return null;
    }

    const apiTransfers = settlement?.transfers ?? [];
    if (apiTransfers.length > 0 || settlementConfirmed) {
      return (
        settlement ?? {
          travelId: travelId ?? '',
          confirmed: false,
          transfers: [],
        }
      );
    }

    const localTransfers = buildTransfersFromMemberSummaries(settlementMemberSummaries);
    return {
      travelId: settlement?.travelId ?? travelId ?? '',
      confirmed: settlement?.confirmed ?? false,
      confirmedById: settlement?.confirmedById,
      confirmedAt: settlement?.confirmedAt,
      transfers: localTransfers,
    };
  }, [settlement, settlementConfirmed, settlementMemberSummaries, travelId]);

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
    if (isAlphaFeatureBlocked('invite')) {
      showUnavailable(ALPHA_FEATURE_LABELS.invite);
      return;
    }
    if (!canInvite) {
      alert({ title: copy.inviteMembers, message: copy.inviteLeaderOnly });
      return;
    }
    setInviteModalOpen(true);
    void loadInviteLink();
  }, [
    alert,
    canInvite,
    copy.inviteLeaderOnly,
    copy.inviteMembers,
    loadInviteLink,
    showUnavailable,
  ]);

  const handleSaveBudgetEntry = useCallback(
    async (entry: BudgetEntryDraft) => {
      if (!isApiPlan || !accessToken || !travelId) {
        addBudgetEntry(entry);
        return;
      }

      if (settlementConfirmed) {
        alert({
          title: copy.budgetAdd,
          message: copy.budgetSettlementLocked,
        });
        return;
      }

      try {
        const request = budgetEntryToCreateRequest(entry);
        const created = await createTravelExpense(accessToken, travelId, request);
        addBudgetEntry(
          expenseCreateResponseToBudgetEntry(created, planId, request.participantIds),
        );
        await refreshSettlementPreview();
        void syncExpenses();
      } catch (error) {
        alert({
          title: copy.budgetAdd,
          message: error instanceof Error ? error.message : copy.budgetAdd,
        });
      }
    },
    [
      accessToken,
      addBudgetEntry,
      alert,
      copy.budgetAdd,
      copy.budgetSettlementLocked,
      isApiPlan,
      planId,
      refreshSettlementPreview,
      settlementConfirmed,
      syncExpenses,
      travelId,
    ],
  );

  const handleConfirmSettlement = useCallback(() => {
    if (!canConfirmSettlement) {
      alert({
        title: copy.budgetSettlementConfirm,
        message: copy.budgetSettlementLeaderOnly,
      });
      return;
    }

    alert({
      title: copy.budgetSettlementConfirmTitle,
      message: copy.budgetSettlementConfirmMessage,
      buttons: [
        { label: copy.budgetCancel, variant: 'secondary', onPress: () => {} },
        {
          label: copy.budgetSettlementConfirmAction,
          variant: 'primary',
          onPress: () => {
            void (async () => {
              try {
                await confirmSettlement();
              } catch (error) {
                alert({
                  title: copy.budgetSettlementConfirm,
                  message:
                    error instanceof Error ? error.message : copy.budgetSettlementError,
                });
              }
            })();
          },
        },
      ],
    });
  }, [
    alert,
    canConfirmSettlement,
    confirmSettlement,
    copy.budgetCancel,
    copy.budgetSettlementConfirm,
    copy.budgetSettlementConfirmAction,
    copy.budgetSettlementConfirmMessage,
    copy.budgetSettlementConfirmTitle,
    copy.budgetSettlementError,
    copy.budgetSettlementLeaderOnly,
  ]);

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
  const openRebootPendingRef = useRef(openReboot === true);

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
  const needGpsAddAnchor =
    !offlineMode && scheduleModal.kind === 'add' && !lastScheduleRoute?.location;
  const { location: gpsAddAnchor } = useBusanSearchLocationWhen(needGpsAddAnchor);
  const addPlaceAnchor =
    lastScheduleRoute?.location ?? gpsAddAnchor ?? undefined;

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
      } catch (error) {
        alert({
          title:
            error instanceof PlaceReviewSyncError
              ? error.message
              : error instanceof Error
                ? error.message
                : '후기 저장에 실패했습니다.',
        });
        throw error;
      } finally {
        setSavingReview(false);
      }
    },
    [accessToken, plan, reviewFormRoute, displayName, alert],
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
    openRebootPendingRef.current = openReboot === true;
  }, [openReboot]);

  useEffect(() => {
    if (offlineMode || !openRebootPendingRef.current || !enrichedPlan) {
      return;
    }

    openRebootPendingRef.current = false;
    navigation.setParams({ openReboot: undefined });

    if (isAlphaFeatureBlocked('reboot')) {
      showUnavailable(ALPHA_FEATURE_LABELS.reboot);
      return;
    }

    setTab('schedule');

    const timer = setTimeout(() => {
      scheduleRef.current?.handleRebootFabPress();
    }, 400);

    return () => clearTimeout(timer);
  }, [enrichedPlan, navigation, offlineMode, showUnavailable]);

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

  const roleLabels = {
    LEADER: copy.roleLeader,
    MEMBER: copy.roleMember,
  };

  const budgetTotal = budgetEntries.reduce((s, e) => s + e.amount, 0);
  const day =
    enrichedPlan?.itinerary.find(d => d.dayNumber === selectedDay) ??
    enrichedPlan?.itinerary[0];

  const transportCopy = {
    transportModeTitle: copy.transportModeTitle,
    legWalk: copy.legWalk,
    legDrive: copy.legDrive,
    legTransit: copy.legTransit,
  };

  const mainTabBottomClearance = embeddedInMainTabs
    ? getNavbarOverlayHeight(insets.bottom)
    : 0;
  const fabBottomInset = embeddedInMainTabs
    ? mainTabBottomClearance
    : insets.bottom;
  const fabBottom = routeFabBottom(fabBottomInset);
  const toastBottom = fabBottomInset + 16;

  const handleBackPress = useCallback(() => {
    if (offlineMode) {
      exitOffline();
    } else {
      navigateToMainTab(navigation, 'home');
    }
  }, [offlineMode, exitOffline, navigation]);

  const handlePublished = useCallback(() => {
    setIsPlanPublished(true);
    if (planId) {
      completePlan(planId);
    }
    navigateToMainTab(navigation, 'home');
  }, [planId, completePlan, navigation]);

  const handleViewFeed = useCallback(() => {
    if (isAlphaFeatureBlocked('feed')) {
      showUnavailable(ALPHA_FEATURE_LABELS.feed);
      return;
    }
    navigateToMainTab(navigation, 'feed');
  }, [navigation, showUnavailable]);

  const handleViewTravelRecord = useCallback(
    (travelRecordId: string) => {
      if (isAlphaFeatureBlocked('travelogue')) {
        showUnavailable(ALPHA_FEATURE_LABELS.travelogue);
        return;
      }
      navigation.navigate('TravelRecordDetail', { travelRecordId });
    },
    [navigation, showUnavailable],
  );

  const handleScheduleToggleVisited = useCallback(
    (itemId: string) => {
      if (viewOnly) {
        if (scheduleReadOnly) {
          notifyScheduleReadOnly();
        }
        return;
      }
      handleToggleVisited(itemId);
    },
    [viewOnly, scheduleReadOnly, notifyScheduleReadOnly, handleToggleVisited],
  );

  const handleWriteReview = useCallback(
    (routeItem: RouteItem) => {
      if (offlineMode) {
        return;
      }
      setReviewFormRoute(routeItem);
    },
    [offlineMode],
  );

  const handleScheduleModalChange = useCallback(
    (modal: ScheduleModalState) => {
      if (offlineMode) {
        return;
      }
      setScheduleModal(modal);
    },
    [offlineMode],
  );

  const reviewFormExisting = reviewFormRoute
    ? getReviewForPlace(
        planReviews,
        reviewFormRoute.apiPlanPlaceId ?? reviewFormRoute.itemId,
      )
    : undefined;

  return {
    language,
    offlineMode,
    copy,
    pickerCopy,
    reviewCopy,
    enrichedPlan,
    planId,
    isApiPlan,
    isPlanOfflineSync,
    viewOnly,
    scheduleReadOnly,
    tab,
    setTab,
    toastText,
    toastOpacity,
    notifyScheduleReadOnly,
    selectedDay,
    setSelectedDay,
    scheduleReorderActive,
    setScheduleReorderActive,
    reviewFormRoute,
    setReviewFormRoute,
    savingReview,
    budgetModalOpen,
    setBudgetModalOpen,
    inviteModalOpen,
    inviteLink,
    inviteExpiredAt,
    inviteLoading,
    inviteError,
    canInvite,
    settlementConfirmed,
    canConfirmSettlement,
    settlementMemberSummaries,
    settlementForDisplay,
    settlementLoading,
    settlementError,
    confirming,
    budgetEntries,
    budgetTotal,
    tripDates,
    allRoutes,
    recordsProgress,
    isPlanPublished,
    roleLabels,
    day,
    transportCopy,
    mainTabBottomClearance,
    fabBottom,
    toastBottom,
    scheduleRef,
    planReviews,
    displayName,
    scheduleModal,
    pickRoute,
    schedulePlaceIds,
    addPlaceAnchor,
    reviewFormExisting,
    handleBackPress,
    handleInvite,
    handleSaveBudgetEntry,
    handleConfirmSettlement,
    closeInviteModal,
    loadInviteLink,
    handleDeleteRoute,
    handleAddDay,
    handleRemoveDay,
    handleToggleVisited: handleScheduleToggleVisited,
    handleSaveRouteMemo,
    handlePickReplacement,
    handleReorderRoutes,
    handleOptimizeDayRoute,
    handleAddPlace,
    handleQuickRating,
    handleSavePlaceReview,
    handleDeletePlaceReview,
    closeScheduleModal,
    requestCompletePlan,
    syncExpenses,
    handlePublished,
    handleViewFeed,
    handleViewTravelRecord,
    handleWriteReview,
    handleScheduleModalChange,
    pickerPlans,
    canSwitchPlans,
    planPickerOpen,
    openPlanPicker,
    closePlanPicker,
    selectPlan,
  };
}
