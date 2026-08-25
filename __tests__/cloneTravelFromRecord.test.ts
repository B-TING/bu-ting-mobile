const mockCloneTravelRecordToTravel = jest.fn();

jest.mock('../src/services/travel/travelRecordService', () => ({
  cloneTravelRecordToTravel: (...args: unknown[]) => mockCloneTravelRecordToTravel(...args),
}));

jest.mock('../src/utils/api/apiServerOrigin', () => ({
  getCurrentApiServerOrigin: () => 'local',
}));

import { cloneTravelFromRecord } from '../src/services/travel/cloneTravelFromRecord';

const members = [{ userId: 'u1', nickname: 'Traveler', role: 'LEADER' as const }];

describe('cloneTravelFromRecord', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCloneTravelRecordToTravel.mockResolvedValue({
      travelId: 'travel-new',
      title: '부산 2박 3일',
      days: [
        {
          planId: 'plan-1',
          dayNumber: 1,
          visitDate: '2026-09-10',
          places: [
            {
              planPlaceId: 'pp-1',
              sequence: 1,
              placeName: '해동용궁사',
              address: '부산 기장군',
              latitude: 35.1882,
              longitude: 129.2232,
              provider: 'KAKAO',
              providerPlaceId: '126081',
            },
          ],
        },
        {
          planId: 'plan-2',
          dayNumber: 2,
          visitDate: '2026-09-11',
          places: [],
        },
      ],
    });
  });

  it('calls clone API and maps response to TravelPlan', async () => {
    const plan = await cloneTravelFromRecord({
      accessToken: 'token',
      travelRecordId: 'record-1',
      members,
      request: { startDate: '2026-09-10', title: '부산 2박 3일' },
    });

    expect(mockCloneTravelRecordToTravel).toHaveBeenCalledWith('token', 'record-1', {
      startDate: '2026-09-10',
      title: '부산 2박 3일',
    });
    expect(plan.planId).toBe('travel-new');
    expect(plan.apiTravelId).toBe('travel-new');
    expect(plan.startDate).toBe('2026-09-10');
    expect(plan.endDate).toBe('2026-09-11');
    expect(plan.itinerary).toHaveLength(2);
    expect(plan.source).toBe('api');
  });

  it('throws when access token is missing', async () => {
    await expect(
      cloneTravelFromRecord({
        accessToken: '',
        travelRecordId: 'record-1',
        members,
        request: { startDate: '2026-09-10' },
      }),
    ).rejects.toThrow('로그인이 필요합니다.');
    expect(mockCloneTravelRecordToTravel).not.toHaveBeenCalled();
  });

  it('throws when startDate is missing', async () => {
    await expect(
      cloneTravelFromRecord({
        accessToken: 'token',
        travelRecordId: 'record-1',
        members,
        request: { startDate: '' },
      }),
    ).rejects.toThrow('출발일을 선택해 주세요.');
    expect(mockCloneTravelRecordToTravel).not.toHaveBeenCalled();
  });

  it('wraps API errors', async () => {
    mockCloneTravelRecordToTravel.mockRejectedValue(new Error('Travel record not found'));
    await expect(
      cloneTravelFromRecord({
        accessToken: 'token',
        travelRecordId: 'missing',
        members,
        request: { startDate: '2026-09-10' },
      }),
    ).rejects.toThrow('Travel record not found');
  });
});
