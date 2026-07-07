import { API_BASE_URL, TRAVEL_ENDPOINTS } from '../../constants/api/apiConfig';
import type {
  PlanCreateRequest,
  PlanPlaceCreateRequest,
  PlanPlaceResponse,
  PlanPlaceSequenceUpdateRequest,
  PlanResponse,
  TravelCreateRequest,
  TravelPlansResponse,
  TravelResponse,
} from '../../types/travelApi';
import {
  logTravelPlanApiError,
  logTravelPlanApiRequest,
  logTravelPlanApiResponse,
} from '../../utils/travel/travelPlanApiLogger';
import { ApiClientError, apiDelete, apiGet, apiPatch, apiPost } from '../api/apiClient';

export class TravelServiceError extends ApiClientError {
  constructor(message: string, options?: { status?: number; url?: string; responseBody?: unknown }) {
    super(message, {
      status: options?.status,
      url: options?.url,
      responseBody: options?.responseBody,
    });
    this.name = 'TravelServiceError';
  }
}

function mapTravelError(error: ApiClientError): TravelServiceError {
  return new TravelServiceError(error.message, {
    status: error.status,
    url: error.url,
    responseBody: error.responseBody,
  });
}

function travelUrl(path: string) {
  return `${API_BASE_URL}${path}`;
}

const authOpts = (accessToken: string) => ({
  accessToken,
  errorMessagePrefix: 'Travel request failed',
  mapError: mapTravelError,
});

type TravelPlanLogContext = {
  travelId?: string;
  planId?: string;
  requestBody?: unknown;
};

function travelPlanLogHooks(
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
  url: string,
  accessToken: string,
  context: TravelPlanLogContext = {},
) {
  return {
    onRequest: () => {
      logTravelPlanApiRequest(method, url, {
        accessToken,
        travelId: context.travelId,
        planId: context.planId,
        requestBody: context.requestBody,
      });
    },
    onResponse: ({ status, body }: { status: number; body: unknown }) => {
      logTravelPlanApiResponse(method, url, status, body, {
        travelId: context.travelId,
        planId: context.planId,
      });
    },
    onError: (error: ApiClientError) => {
      logTravelPlanApiError(method, url, error, {
        travelId: context.travelId,
        planId: context.planId,
      });
    },
  };
}

export async function createTravel(
  accessToken: string,
  body: TravelCreateRequest,
): Promise<TravelResponse> {
  const url = travelUrl(TRAVEL_ENDPOINTS.travels);
  const data = await apiPost<TravelResponse>(url, {
    ...authOpts(accessToken),
    body,
    ...travelPlanLogHooks('POST', url, accessToken, { requestBody: body }),
  });
  if (!data?.id) {
    throw new TravelServiceError('Travel create response missing id');
  }
  return data;
}

export async function createTravelPlan(
  accessToken: string,
  travelId: string,
  body: PlanCreateRequest,
): Promise<PlanResponse> {
  const url = travelUrl(TRAVEL_ENDPOINTS.travelPlans(travelId));
  const data = await apiPost<PlanResponse>(url, {
    ...authOpts(accessToken),
    body,
    ...travelPlanLogHooks('POST', url, accessToken, { travelId, requestBody: body }),
  });
  if (!data?.planId) {
    throw new TravelServiceError('Plan create response missing planId');
  }
  return data;
}

export async function fetchTravelPlans(
  accessToken: string,
  travelId: string,
): Promise<TravelPlansResponse> {
  const url = travelUrl(TRAVEL_ENDPOINTS.travelPlans(travelId));
  const data = await apiGet<TravelPlansResponse>(url, {
    ...authOpts(accessToken),
    ...travelPlanLogHooks('GET', url, accessToken, { travelId }),
  });
  if (!data?.travelId) {
    throw new TravelServiceError('Travel plans response missing travelId');
  }
  return data;
}

export async function fetchPlanPlaces(
  accessToken: string,
  planId: string,
): Promise<PlanPlaceResponse[]> {
  const url = travelUrl(TRAVEL_ENDPOINTS.planPlaces(planId));
  const data = await apiGet<PlanPlaceResponse[]>(url, {
    ...authOpts(accessToken),
    ...travelPlanLogHooks('GET', url, accessToken, { planId }),
  });
  return data ?? [];
}

export async function createPlanPlace(
  accessToken: string,
  planId: string,
  body: PlanPlaceCreateRequest,
): Promise<PlanPlaceResponse> {
  const url = travelUrl(TRAVEL_ENDPOINTS.planPlaces(planId));
  const data = await apiPost<PlanPlaceResponse>(url, {
    ...authOpts(accessToken),
    body,
    ...travelPlanLogHooks('POST', url, accessToken, { planId, requestBody: body }),
  });
  if (!data?.planPlaceId) {
    throw new TravelServiceError('Plan place create response missing planPlaceId');
  }
  return data;
}

export async function updatePlanPlaceSequence(
  accessToken: string,
  planId: string,
  body: PlanPlaceSequenceUpdateRequest,
): Promise<PlanPlaceResponse[]> {
  const url = travelUrl(TRAVEL_ENDPOINTS.planPlaceSequence(planId));
  const data = await apiPatch<PlanPlaceResponse[]>(url, {
    ...authOpts(accessToken),
    body,
    ...travelPlanLogHooks('PATCH', url, accessToken, { planId, requestBody: body }),
  });
  return data ?? [];
}

export async function deletePlanPlace(accessToken: string, planPlaceId: string): Promise<void> {
  const url = travelUrl(TRAVEL_ENDPOINTS.planPlaceById(planPlaceId));
  await apiDelete(url, {
    ...authOpts(accessToken),
    ...travelPlanLogHooks('DELETE', url, accessToken, { planId: planPlaceId }),
  });
}
