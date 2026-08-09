jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.mock('../src/i18n', () => ({
  useAppLanguage: () => 'ko',
  useCopy: () => ({
    offlineSyncNotice: 'offline',
    inviteLinkError: 'invite error',
    roleLabels: { LEADER: '방장', MEMBER: '일행' },
    transport: {},
  }),
}));

jest.mock('../src/components/shared/modals', () => ({
  useAppAlert: () => ({ alert: jest.fn() }),
  useFeatureUnavailableAlert: () => ({ show: jest.fn() }),
}));

jest.mock('../src/components/plan/fab/RouteOptimizeFab', () => ({
  routeFabBottom: () => 80,
}));

jest.mock('../src/components/shared/navigation/Navbar', () => ({
  getNavbarOverlayHeight: () => 64,
}));

jest.mock('../src/hooks/usePlaceMapUserLocation', () => ({
  useBusanSearchLocationWhen: () => ({ location: null }),
}));

jest.mock('../src/hooks/usePlanRoutePlaceDetails', () => ({
  usePlanRoutePlaceDetails: () => ({}),
}));

jest.mock('../src/hooks/useTravelExpensesSync', () => ({
  useTravelExpensesSync: () => ({
    syncExpenses: jest.fn(),
    refreshSettlementPreview: jest.fn(),
    settlement: null,
    summary: null,
    settlementLoading: false,
    settlementError: null,
    confirming: false,
    confirmSettlement: jest.fn(),
  }),
}));

jest.mock('../src/hooks/useTravelMembersSync', () => ({
  useTravelMembersSync: jest.fn(),
}));

jest.mock('../src/hooks/useApiTravelPlanSync', () => ({
  useApiTravelPlanSync: () => ({ syncFromServer: jest.fn() }),
}));

jest.mock('../src/hooks/usePlanOfflineSyncFeedback', () => ({
  usePlanOfflineSyncFeedback: () => ({
    toastText: null,
    toastOpacity: { value: 0 },
    showToast: jest.fn(),
  }),
}));

jest.mock('../src/navigation/navigateToMainTab', () => ({
  navigateToMainTab: jest.fn(),
}));

jest.mock('../src/services/travel/planPlaceSync', () => ({
  addPlanPlaceFromCandidate: jest.fn(),
  findDayRoute: jest.fn(),
  getDayRoutesFromPlan: jest.fn(() => []),
  removePlanPlaceFromApi: jest.fn(),
  replacePlanPlaceFromCandidate: jest.fn(),
  routesInItemOrder: jest.fn((routes: unknown) => routes),
  updatePlanPlaceMemoOnApi: jest.fn(),
  updatePlanPlaceOrderOnApi: jest.fn(),
  updatePlanPlaceVisitedOnApi: jest.fn(),
}));

jest.mock('../src/services/travel/planDaySync', () => ({
  addPlanDayOnApi: jest.fn(),
  canAddPlanDay: jest.fn(() => true),
  canRemovePlanDay: jest.fn(() => true),
  computeNextPlanDay: jest.fn(),
  removePlanDayOnApi: jest.fn(),
}));

jest.mock('../src/services/travel/travelExpenseMapper', () => ({
  budgetEntryToCreateRequest: jest.fn(),
  expenseCreateResponseToBudgetEntry: jest.fn(),
}));

jest.mock('../src/services/travel/travelExpenseService', () => ({
  createTravelExpense: jest.fn(),
}));

jest.mock('../src/services/travel/travelTeamService', () => ({
  resolveTravelInviteLink: jest.fn(),
}));

jest.mock('../src/services/travel/travelService', () => ({
  updateTravelStatus: jest.fn(),
}));

jest.mock('../src/services/travel/savePlaceReviewForTravel', () => ({
  PlaceReviewSyncError: class PlaceReviewSyncError extends Error {},
  savePlaceReviewForTravel: jest.fn(),
}));

jest.mock('../src/services/travel/deletePlaceReviewForTravel', () => ({
  deletePlaceReviewForTravel: jest.fn(),
}));

jest.mock('../src/services/travel/loadPlanPlaceReviewsForTravel', () => ({
  loadPlanPlaceReviewsForTravel: jest.fn(async () => undefined),
}));

jest.mock('../src/services/travel/travelRecordService', () => ({
  fetchMyTravelRecords: jest.fn(async () => []),
}));

jest.mock('../src/constants/common/alphaFeatureBlocks', () => ({
  ALPHA_FEATURE_LABELS: {},
  isAlphaFeatureBlocked: () => false,
}));

const mockAppState = {
  offlineMode: false,
  setOfflineMode: jest.fn(),
  auth: { displayName: 'Tester' },
};

const mockPlanStoreState = {
  plans: [] as Array<Record<string, unknown>>,
  activePlanId: null as string | null,
  budgetByPlan: {} as Record<string, unknown[]>,
  toggleRouteVisited: jest.fn(),
  replaceRouteInPlan: jest.fn(),
  addRouteToPlan: jest.fn(),
  removeRouteFromPlan: jest.fn(),
  reorderRoutesInPlan: jest.fn(),
  updateRouteMemo: jest.fn(),
  addItineraryDay: jest.fn(),
  removeItineraryDay: jest.fn(),
  addBudgetEntry: jest.fn(),
  completePlan: jest.fn(),
};

jest.mock('../src/stores', () => ({
  EMPTY_REVIEWS: [],
  hydrateRoutePlaceInfo: (route: unknown) => route,
  useAppStore: (selector: (s: typeof mockAppState) => unknown) => selector(mockAppState),
  useAuthStore: (selector: (s: Record<string, unknown>) => unknown) =>
    selector({
      accessToken: null,
      user: { id: 'u1', nickname: 'Tester' },
    }),
  usePlanStore: (selector: (s: typeof mockPlanStoreState) => unknown) =>
    selector(mockPlanStoreState),
  useTravelRecordStore: (selector: (s: Record<string, unknown>) => unknown) =>
    selector({ reviewsByTravelId: {} }),
}));

jest.mock('../src/stores/usePlanStore', () => ({
  selectIsPlanOfflineSync: () => () => false,
}));

jest.mock('../src/stores/useAuthStore', () => ({
  selectReusableAccessToken: () => null,
}));

import { usePlanDetailScreen } from '../src/hooks/plan/usePlanDetailScreen';
import { act, renderHook } from './helpers/renderHook';

const mockPlan = {
  planId: 'plan-1',
  apiTravelId: 'travel-1',
  title: '부산 여행',
  startDate: '2026-08-01',
  endDate: '2026-08-03',
  status: 'CONFIRMED',
  travelStatus: 'PLANNED',
  source: 'local',
  members: [{ userId: 'u1', nickname: '방장', role: 'LEADER' }],
  itinerary: [
    {
      dayNumber: 1,
      date: '2026-08-01',
      routes: [
        {
          itemId: 'r1',
          placeId: 'place-1',
          name: '해운대',
          order: 0,
          visited: false,
        },
      ],
    },
  ],
};

function makeNavigation() {
  return {
    goBack: jest.fn(),
    navigate: jest.fn(),
    replace: jest.fn(),
    setParams: jest.fn(),
    canGoBack: () => true,
  };
}

describe('usePlanDetailScreen', () => {
  beforeEach(() => {
    mockAppState.offlineMode = false;
    mockPlanStoreState.plans = [];
    mockPlanStoreState.activePlanId = null;
    mockPlanStoreState.budgetByPlan = {};
    jest.clearAllMocks();
  });

  it('returns null enrichedPlan when no matching plan exists', () => {
    const navigation = makeNavigation();
    const { result } = renderHook(() =>
      usePlanDetailScreen({
        navigation: navigation as never,
        paramPlanId: 'missing',
      }),
    );

    expect(result.current.enrichedPlan).toBeNull();
    expect(result.current.planId).toBe('');
    expect(result.current.allRoutes).toEqual([]);
    expect(navigation.replace).toHaveBeenCalledWith('PlanWizard');
  });

  it('resolves plan by paramPlanId and exposes itinerary routes', () => {
    mockPlanStoreState.plans = [mockPlan];

    const navigation = makeNavigation();
    const { result } = renderHook(() =>
      usePlanDetailScreen({
        navigation: navigation as never,
        paramPlanId: 'plan-1',
        initialTab: 'schedule',
      }),
    );

    expect(result.current.enrichedPlan?.planId).toBe('plan-1');
    expect(result.current.planId).toBe('plan-1');
    expect(result.current.tab).toBe('schedule');
    expect(result.current.tripDates).toEqual(['2026-08-01']);
    expect(result.current.allRoutes).toHaveLength(1);
    expect(result.current.allRoutes[0]?.name).toBe('해운대');
  });

  it('updates tab via setTab', () => {
    mockPlanStoreState.plans = [mockPlan];

    const navigation = makeNavigation();
    const { result } = renderHook(() =>
      usePlanDetailScreen({
        navigation: navigation as never,
        paramPlanId: 'plan-1',
      }),
    );

    act(() => {
      result.current.setTab('budget');
    });

    expect(result.current.tab).toBe('budget');
  });

  it('ignores schedule modal changes while offline', () => {
    mockAppState.offlineMode = true;
    mockPlanStoreState.plans = [mockPlan];

    const navigation = makeNavigation();
    const { result } = renderHook(() =>
      usePlanDetailScreen({
        navigation: navigation as never,
        paramPlanId: 'plan-1',
      }),
    );

    act(() => {
      result.current.handleScheduleModalChange({ kind: 'add', dayNumber: 1 });
    });

    expect(result.current.scheduleModal).toEqual({ kind: 'none' });
  });
});
