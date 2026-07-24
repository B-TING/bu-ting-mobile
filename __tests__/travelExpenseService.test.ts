jest.mock('../src/constants/api/apiConfig', () => ({
  API_BASE_URL: 'https://api.example.com',
  TRAVEL_EXPENSE_ENDPOINTS: {
    expenses: (travelId: string) => `/api/v1/travels/${travelId}/expenses`,
    expenseById: (travelId: string, expenseId: string) =>
      `/api/v1/travels/${travelId}/expenses/${expenseId}`,
    summary: (travelId: string) => `/api/v1/travels/${travelId}/expenses/summary`,
    settlements: (travelId: string) =>
      `/api/v1/travels/${travelId}/expenses/settlements`,
    confirmSettlement: (travelId: string) =>
      `/api/v1/travels/${travelId}/expenses/settlements/confirm`,
  },
}));

jest.mock('../src/utils/travel/travelPlanApiLogger', () => ({
  logTravelPlanApiRequest: jest.fn(),
  logTravelPlanApiResponse: jest.fn(),
  logTravelPlanApiError: jest.fn(),
  logTravelPlanApi: jest.fn(),
}));

const mockApiGet = jest.fn();
const mockApiPost = jest.fn();
const mockApiPut = jest.fn();
const mockApiDelete = jest.fn();

jest.mock('../src/services/api/apiClient', () => ({
  ApiClientError: class ApiClientError extends Error {
    status?: number;
    url?: string;
    responseBody?: unknown;
    constructor(
      message: string,
      options?: { status?: number; url?: string; responseBody?: unknown },
    ) {
      super(message);
      this.status = options?.status;
      this.url = options?.url;
      this.responseBody = options?.responseBody;
    }
  },
  apiGet: (...args: unknown[]) => mockApiGet(...args),
  apiPost: (...args: unknown[]) => mockApiPost(...args),
  apiPut: (...args: unknown[]) => mockApiPut(...args),
  apiDelete: (...args: unknown[]) => mockApiDelete(...args),
}));

import {
  confirmTravelSettlement,
  createTravelExpense,
  deleteTravelExpense,
  fetchAllTravelExpenses,
  fetchTravelExpense,
  fetchTravelExpenseSummary,
  fetchTravelExpenses,
  fetchTravelSettlements,
  updateTravelExpense,
} from '../src/services/travel/travelExpenseService';

describe('travelExpenseService', () => {
  const accessToken = 'token-abc';
  const travelId = '10000000-0000-0000-0000-000000000001';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('lists expenses with query params', async () => {
    mockApiGet.mockResolvedValue({
      content: [],
      page: 0,
      size: 20,
      totalElements: 0,
      totalPages: 0,
    });

    await fetchTravelExpenses(accessToken, travelId, {
      category: 'FOOD',
      page: 1,
      size: 10,
      sort: 'spentAt,desc',
    });

    expect(mockApiGet).toHaveBeenCalledTimes(1);
    const [url, options] = mockApiGet.mock.calls[0];
    expect(url).toContain(`/api/v1/travels/${travelId}/expenses`);
    expect(url).toContain('category=FOOD');
    expect(url).toContain('page=1');
    expect(url).toContain('size=10');
    expect(url).toContain('sort=spentAt%2Cdesc');
    expect(options.accessToken).toBe(accessToken);
  });

  it('fetches all expense pages', async () => {
    mockApiGet
      .mockResolvedValueOnce({
        content: [{ expenseId: 'e1' }, { expenseId: 'e2' }],
        page: 0,
        size: 50,
        totalElements: 3,
        totalPages: 2,
      })
      .mockResolvedValueOnce({
        content: [{ expenseId: 'e3' }],
        page: 1,
        size: 50,
        totalElements: 3,
        totalPages: 2,
      });

    const items = await fetchAllTravelExpenses(accessToken, travelId);
    expect(items.map(item => item.expenseId)).toEqual(['e1', 'e2', 'e3']);
    expect(mockApiGet).toHaveBeenCalledTimes(2);
  });

  it('creates an expense', async () => {
    mockApiPost.mockResolvedValue({
      expenseId: 'exp-1',
      travelId,
      title: '식사',
      amount: 10000,
      currency: 'KRW',
      category: 'FOOD',
      payerId: 'u1',
      creatorId: 'u1',
      splitType: 'EQUAL',
      spentAt: '2026-08-01T12:00:00',
      shares: [],
    });

    const body = {
      title: '식사',
      amount: 10000,
      category: 'FOOD' as const,
      payerId: 'u1',
      participantIds: ['u1'],
      spentAt: '2026-08-01T12:00:00',
    };

    const created = await createTravelExpense(accessToken, travelId, body);
    expect(created.expenseId).toBe('exp-1');
    expect(mockApiPost).toHaveBeenCalledWith(
      expect.stringContaining(`/api/v1/travels/${travelId}/expenses`),
      expect.objectContaining({
        accessToken,
        body,
      }),
    );
  });

  it('fetches expense detail', async () => {
    mockApiGet.mockResolvedValue({
      expenseId: 'exp-1',
      travelId,
      title: '식사',
      amount: 10000,
      currency: 'KRW',
      category: 'FOOD',
      payer: { userId: 'u1', nickname: '방장' },
      createdBy: { userId: 'u1', nickname: '방장' },
      splitType: 'EQUAL',
      spentAt: '2026-08-01T12:00:00',
      shares: [],
      editable: true,
    });

    const detail = await fetchTravelExpense(accessToken, travelId, 'exp-1');
    expect(detail.expenseId).toBe('exp-1');
    expect(mockApiGet.mock.calls[0][0]).toContain('/expenses/exp-1');
  });

  it('updates and deletes an expense', async () => {
    mockApiPut.mockResolvedValue({
      expenseId: 'exp-1',
      travelId,
      title: '수정',
      amount: 11000,
      currency: 'KRW',
      category: 'FOOD',
      payer: { userId: 'u1', nickname: '방장' },
      createdBy: { userId: 'u1', nickname: '방장' },
      splitType: 'EQUAL',
      spentAt: '2026-08-01T12:00:00',
      shares: [],
      editable: true,
    });
    mockApiDelete.mockResolvedValue(undefined);

    const body = {
      title: '수정',
      amount: 11000,
      category: 'FOOD' as const,
      payerId: 'u1',
      participantIds: ['u1'],
      spentAt: '2026-08-01T12:00:00',
    };

    await updateTravelExpense(accessToken, travelId, 'exp-1', body);
    await deleteTravelExpense(accessToken, travelId, 'exp-1');

    expect(mockApiPut).toHaveBeenCalled();
    expect(mockApiDelete).toHaveBeenCalled();
  });

  it('fetches summary and settlements', async () => {
    mockApiGet
      .mockResolvedValueOnce({
        travelId,
        expenseCount: 2,
        currencySummaries: [],
      })
      .mockResolvedValueOnce({
        travelId,
        confirmed: false,
        transfers: [],
      });

    const summary = await fetchTravelExpenseSummary(accessToken, travelId, {
      from: '2026-08-01T00:00:00',
    });
    const settlement = await fetchTravelSettlements(accessToken, travelId);

    expect(summary.expenseCount).toBe(2);
    expect(settlement.confirmed).toBe(false);
    expect(mockApiGet.mock.calls[0][0]).toContain('/expenses/summary');
    expect(mockApiGet.mock.calls[0][0]).toContain('from=2026-08-01T00%3A00%3A00');
    expect(mockApiGet.mock.calls[1][0]).toContain('/expenses/settlements');
  });

  it('confirms settlement', async () => {
    mockApiPost.mockResolvedValue({
      travelId,
      confirmed: true,
      transfers: [
        {
          currency: 'KRW',
          senderId: 'u2',
          senderNickname: '민지',
          receiverId: 'u1',
          receiverNickname: '방장',
          amount: 20000,
        },
      ],
    });

    const result = await confirmTravelSettlement(accessToken, travelId);
    expect(result.confirmed).toBe(true);
    expect(mockApiPost.mock.calls[0][0]).toContain('/settlements/confirm');
  });

  it('accepts summary/settlement payloads without travelId', async () => {
    mockApiGet
      .mockResolvedValueOnce({
        expenseCount: 3,
        currencySummaries: [
          {
            currency: 'KRW',
            totalAmount: 80000,
            categorySummaries: [],
            memberSummaries: [
              {
                memberId: 'u1',
                nickname: '방장',
                paidAmount: 80000,
                shareAmount: 80000,
                balance: 0,
              },
            ],
          },
        ],
      })
      .mockResolvedValueOnce({
        confirmed: false,
        transfers: [],
      });

    const summary = await fetchTravelExpenseSummary(accessToken, travelId);
    const settlement = await fetchTravelSettlements(accessToken, travelId);

    expect(summary.travelId).toBe(travelId);
    expect(summary.expenseCount).toBe(3);
    expect(summary.currencySummaries[0].memberSummaries).toHaveLength(1);
    expect(settlement.travelId).toBe(travelId);
    expect(settlement.transfers).toEqual([]);
  });
});
