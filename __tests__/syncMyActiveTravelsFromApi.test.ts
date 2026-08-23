import type { MyTravelResponse } from '../src/types/travelApi';
import type { TravelPlan } from '../src/types/travelPlan';

const mockUpsertPlan = jest.fn();
const mockSetPlanOfflineSync = jest.fn();
const mockSetActivePlan = jest.fn();
const mockClearActivePlan = jest.fn();
const mockTrySync = jest.fn();
const mockFetchMyActiveTravels = jest.fn();

const localPlans: TravelPlan[] = [];

jest.mock('../src/stores/usePlanStore', () => ({
  usePlanStore: {
    getState: () => ({
      plans: localPlans,
      activePlanId: null,
      upsertPlan: mockUpsertPlan,
      setPlanOfflineSync: mockSetPlanOfflineSync,
      setActivePlan: mockSetActivePlan,
      clearActivePlan: mockClearActivePlan,
    }),
  },
}));

jest.mock('../src/services/travel/travelTeamService', () => ({
  fetchMyActiveTravels: (...args: unknown[]) => mockFetchMyActiveTravels(...args),
}));

jest.mock('../src/services/travel/trySyncTravelPlanFromApi', () => ({
  trySyncTravelPlanFromApi: (...args: unknown[]) => mockTrySync(...args),
}));

jest.mock('../src/utils/travel/travelPlanApiLogger', () => ({
  logTravelPlanApi: jest.fn(),
}));

jest.mock('../src/utils/api/apiServerOrigin', () => ({
  filterPlansForCurrentApiServer: (plans: TravelPlan[]) => plans,
  isPlanForCurrentApiServer: () => true,
  getCurrentApiServerOrigin: () => 'local',
}));

import { syncMyActiveTravelsFromApi } from '../src/services/travel/syncMyActiveTravelsFromApi';

const member = {
  userId: 'u1',
  nickname: 'Tester',
  role: 'LEADER' as const,
};

function travel(overrides: Partial<MyTravelResponse> = {}): MyTravelResponse {
  return {
    travelId: 'travel-1',
    title: '부산',
    startDate: '2026-08-01',
    endDate: '2026-08-03',
    status: 'PLANNED',
    role: 'LEADER',
    ...overrides,
  } as MyTravelResponse;
}

function existingPlan(planId = 'travel-1'): TravelPlan {
  return {
    planId,
    apiTravelId: 'travel-1',
    title: '부산',
    startDate: '2026-08-01',
    endDate: '2026-08-03',
    status: 'CONFIRMED',
    constraints: {},
    members: [member],
    itinerary: [
      {
        dailyId: 'd1',
        dayNumber: 1,
        date: '2026-08-01',
        routes: [
          {
            itemId: 'r1',
            sequence: 0,
            placeId: 'p1',
            placeName: '해운대',
            type: 'ATTRACTION',
            location: { lat: 35, lng: 129 },
            isVisited: false,
          },
        ],
      },
    ],
    createdAt: '2026-08-01T00:00:00.000Z',
    source: 'api',
    apiServerOrigin: 'local',
  };
}

describe('syncMyActiveTravelsFromApi locked shell handling', () => {
  beforeEach(() => {
    localPlans.length = 0;
    jest.clearAllMocks();
  });

  it('keeps existing local plan and marks offline when sync locks', async () => {
    const existing = existingPlan();
    localPlans.push(existing);
    mockFetchMyActiveTravels.mockResolvedValue([travel()]);
    mockTrySync.mockResolvedValue({ plan: existing, scheduleLocked: true });

    const result = await syncMyActiveTravelsFromApi('token', member);

    expect(mockSetPlanOfflineSync).toHaveBeenCalledWith('travel-1', true);
    expect(mockUpsertPlan).not.toHaveBeenCalled();
    expect(result?.planId).toBe('travel-1');
  });

  it('does not upsert a locked shell when no local plan exists', async () => {
    mockFetchMyActiveTravels.mockResolvedValue([travel()]);
    mockTrySync.mockResolvedValue({
      plan: existingPlan('shell-empty'),
      scheduleLocked: true,
    });

    const result = await syncMyActiveTravelsFromApi('token', member);

    expect(mockUpsertPlan).not.toHaveBeenCalled();
    expect(mockSetPlanOfflineSync).not.toHaveBeenCalled();
    expect(result).toBeNull();
  });
});
