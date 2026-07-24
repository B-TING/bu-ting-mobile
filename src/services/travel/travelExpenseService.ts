import { API_BASE_URL, TRAVEL_EXPENSE_ENDPOINTS } from '../../constants/api/apiConfig';
import type {
  TravelExpenseCreateRequest,
  TravelExpenseCreateResponse,
  TravelExpenseDetailResponse,
  TravelExpenseListQuery,
  TravelExpenseListResponse,
  TravelExpenseSummaryQuery,
  TravelExpenseSummaryResponse,
  TravelExpenseUpdateRequest,
  TravelSettlementResponse,
} from '../../types/travelApi';
import {
  logTravelPlanApiError,
  logTravelPlanApiRequest,
  logTravelPlanApiResponse,
} from '../../utils/travel/travelPlanApiLogger';
import { ApiClientError, apiDelete, apiGet, apiPost, apiPut } from '../api/apiClient';
import { TravelServiceError } from './travelService';

function mapExpenseError(error: ApiClientError): TravelServiceError {
  return new TravelServiceError(error.message, {
    status: error.status,
    url: error.url,
    responseBody: error.responseBody,
  });
}

const authOpts = (accessToken: string) => ({
  accessToken,
  errorMessagePrefix: 'Travel expense request failed',
  mapError: mapExpenseError,
});

function expenseUrl(path: string): string {
  return `${API_BASE_URL}${path}`;
}

type ExpenseLogContext = {
  travelId?: string;
  expenseId?: string;
  requestBody?: unknown;
};

function expenseLogHooks(
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  url: string,
  accessToken: string,
  context: ExpenseLogContext = {},
) {
  return {
    onRequest: () => {
      logTravelPlanApiRequest(method, url, {
        accessToken,
        travelId: context.travelId,
        requestBody: context.requestBody,
      });
    },
    onResponse: ({ status, body }: { status: number; body: unknown }) => {
      logTravelPlanApiResponse(method, url, status, body, {
        travelId: context.travelId,
      });
    },
    onError: (error: ApiClientError) => {
      logTravelPlanApiError(method, url, error, {
        travelId: context.travelId,
      });
    },
  };
}

function withQuery(basePath: string, query?: Record<string, string | number | undefined>): string {
  const url = new URL(expenseUrl(basePath));
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== '') {
        url.searchParams.set(key, String(value));
      }
    }
  }
  return url.toString();
}

export async function fetchTravelExpenses(
  accessToken: string,
  travelId: string,
  query: TravelExpenseListQuery = {},
): Promise<TravelExpenseListResponse> {
  const url = withQuery(TRAVEL_EXPENSE_ENDPOINTS.expenses(travelId), {
    category: query.category,
    from: query.from,
    to: query.to,
    payerId: query.payerId,
    page: query.page,
    size: query.size,
    sort: query.sort,
  });
  const data = await apiGet<TravelExpenseListResponse>(url, {
    ...authOpts(accessToken),
    ...expenseLogHooks('GET', url, accessToken, { travelId }),
  });
  return (
    data ?? {
      content: [],
      page: query.page ?? 0,
      size: query.size ?? 20,
      totalElements: 0,
      totalPages: 0,
    }
  );
}

/** 페이지를 순회해 여행 경비 전체를 가져옵니다. */
export async function fetchAllTravelExpenses(
  accessToken: string,
  travelId: string,
  query: Omit<TravelExpenseListQuery, 'page' | 'size'> = {},
): Promise<TravelExpenseListResponse['content']> {
  const pageSize = 50;
  const first = await fetchTravelExpenses(accessToken, travelId, {
    ...query,
    page: 0,
    size: pageSize,
  });
  const items = [...(first.content ?? [])];
  const totalPages = first.totalPages ?? 1;

  for (let page = 1; page < totalPages; page += 1) {
    const next = await fetchTravelExpenses(accessToken, travelId, {
      ...query,
      page,
      size: pageSize,
    });
    items.push(...(next.content ?? []));
  }

  return items;
}

export async function fetchTravelExpense(
  accessToken: string,
  travelId: string,
  expenseId: string,
): Promise<TravelExpenseDetailResponse> {
  const url = expenseUrl(TRAVEL_EXPENSE_ENDPOINTS.expenseById(travelId, expenseId));
  const data = await apiGet<TravelExpenseDetailResponse>(url, {
    ...authOpts(accessToken),
    ...expenseLogHooks('GET', url, accessToken, { travelId, expenseId }),
  });
  if (!data?.expenseId) {
    throw new TravelServiceError('Expense detail response missing expenseId');
  }
  return data;
}

export async function createTravelExpense(
  accessToken: string,
  travelId: string,
  body: TravelExpenseCreateRequest,
): Promise<TravelExpenseCreateResponse> {
  const url = expenseUrl(TRAVEL_EXPENSE_ENDPOINTS.expenses(travelId));
  const data = await apiPost<TravelExpenseCreateResponse>(url, {
    ...authOpts(accessToken),
    body,
    ...expenseLogHooks('POST', url, accessToken, { travelId, requestBody: body }),
  });
  if (!data?.expenseId) {
    throw new TravelServiceError('Create expense response missing expenseId');
  }
  return data;
}

export async function updateTravelExpense(
  accessToken: string,
  travelId: string,
  expenseId: string,
  body: TravelExpenseUpdateRequest,
): Promise<TravelExpenseDetailResponse> {
  const url = expenseUrl(TRAVEL_EXPENSE_ENDPOINTS.expenseById(travelId, expenseId));
  const data = await apiPut<TravelExpenseDetailResponse>(url, {
    ...authOpts(accessToken),
    body,
    ...expenseLogHooks('PUT', url, accessToken, {
      travelId,
      expenseId,
      requestBody: body,
    }),
  });
  if (!data?.expenseId) {
    throw new TravelServiceError('Update expense response missing expenseId');
  }
  return data;
}

export async function deleteTravelExpense(
  accessToken: string,
  travelId: string,
  expenseId: string,
): Promise<void> {
  const url = expenseUrl(TRAVEL_EXPENSE_ENDPOINTS.expenseById(travelId, expenseId));
  await apiDelete(url, {
    ...authOpts(accessToken),
    ...expenseLogHooks('DELETE', url, accessToken, { travelId, expenseId }),
  });
}

export async function fetchTravelExpenseSummary(
  accessToken: string,
  travelId: string,
  query: TravelExpenseSummaryQuery = {},
): Promise<TravelExpenseSummaryResponse> {
  const url = withQuery(TRAVEL_EXPENSE_ENDPOINTS.summary(travelId), {
    from: query.from,
    to: query.to,
  });
  const data = await apiGet<TravelExpenseSummaryResponse>(url, {
    ...authOpts(accessToken),
    ...expenseLogHooks('GET', url, accessToken, { travelId }),
  });
  if (!data?.travelId) {
    throw new TravelServiceError('Expense summary response missing travelId');
  }
  return data;
}

export async function fetchTravelSettlements(
  accessToken: string,
  travelId: string,
): Promise<TravelSettlementResponse> {
  const url = expenseUrl(TRAVEL_EXPENSE_ENDPOINTS.settlements(travelId));
  const data = await apiGet<TravelSettlementResponse>(url, {
    ...authOpts(accessToken),
    ...expenseLogHooks('GET', url, accessToken, { travelId }),
  });
  if (!data?.travelId) {
    throw new TravelServiceError('Settlement response missing travelId');
  }
  return data;
}

export async function confirmTravelSettlement(
  accessToken: string,
  travelId: string,
): Promise<TravelSettlementResponse> {
  const url = expenseUrl(TRAVEL_EXPENSE_ENDPOINTS.confirmSettlement(travelId));
  const data = await apiPost<TravelSettlementResponse>(url, {
    ...authOpts(accessToken),
    ...expenseLogHooks('POST', url, accessToken, { travelId }),
  });
  if (!data?.travelId) {
    throw new TravelServiceError('Confirm settlement response missing travelId');
  }
  return data;
}
