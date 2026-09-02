import { API_BASE_URL, TRAVEL_ENDPOINTS } from '../../constants/api/apiConfig';
import type {
  PlanCreateRequest,
  PlanPlaceCreateRequest,
  PlanPlaceResponse,
  PlanPlaceSequenceUpdateRequest,
  PlanPlaceUpdatePlaceRequest,
  PlanPlaceUpdateRequest,
  PlanPlaceVisitedUpdateRequest,
  PlanResponse,
  TravelCreateRequest,
  AiTravelPlanGenerateRequest,
  TravelPlansResponse,
  TravelResponse,
  TravelStatusUpdateRequest,
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

export const AI_TRAVEL_PLAN_TIMEOUT_MS = 30_000;

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
  if (!data?.travelId) {
    throw new TravelServiceError('Travel create response missing travelId');
  }
  return data;
}

export async function generateAiTravelPlans(
  accessToken: string,
  travelId: string,
  body: AiTravelPlanGenerateRequest,
): Promise<TravelPlansResponse> {
  const url = travelUrl(TRAVEL_ENDPOINTS.aiPlans(travelId));
  const data = await apiPost<TravelPlansResponse>(url, {
    ...authOpts(accessToken),
    body,
    timeoutMs: AI_TRAVEL_PLAN_TIMEOUT_MS,
    mapError: error => {
      if (error.code === 'TIMEOUT') {
        return new TravelServiceError('일정 생성 시간이 초과되었습니다. 다시 시도해 주세요.', {
          url: error.url,
          responseBody: error.responseBody,
        });
      }
      if (error.status === 500) {
        return new TravelServiceError(
          'AI 일정 생성 중 서버 오류가 발생했습니다. 백엔드 AI 설정과 로그를 확인해 주세요.',
          {
            status: error.status,
            url: error.url,
            responseBody: error.responseBody,
          },
        );
      }
      return mapTravelError(error);
    },
    ...travelPlanLogHooks('POST', url, accessToken, { travelId, requestBody: body }),
  });
  if (!data?.travelId) {
    throw new TravelServiceError('AI travel plan response missing travelId');
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

export async function deleteTravelPlan(
  accessToken: string,
  travelId: string,
  planId: string,
): Promise<void> {
  const url = travelUrl(TRAVEL_ENDPOINTS.travelPlanById(travelId, planId));
  await apiDelete(url, {
    ...authOpts(accessToken),
    ...travelPlanLogHooks('DELETE', url, accessToken, { travelId, planId }),
  });
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

export async function updateTravelStatus(
  accessToken: string,
  travelId: string,
  body: TravelStatusUpdateRequest,
): Promise<TravelResponse> {
  const url = travelUrl(TRAVEL_ENDPOINTS.travelStatus(travelId));
  const data = await apiPatch<TravelResponse>(url, {
    ...authOpts(accessToken),
    body,
    ...travelPlanLogHooks('PATCH', url, accessToken, { travelId, requestBody: body }),
  });
  if (!data?.travelId) {
    throw new TravelServiceError('Travel status response missing travelId');
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

export async function updatePlanPlace(
  accessToken: string,
  planPlaceId: string,
  body: PlanPlaceUpdateRequest,
): Promise<PlanPlaceResponse> {
  const url = travelUrl(TRAVEL_ENDPOINTS.planPlaceById(planPlaceId));
  const data = await apiPatch<PlanPlaceResponse>(url, {
    ...authOpts(accessToken),
    body,
    ...travelPlanLogHooks('PATCH', url, accessToken, {
      planId: planPlaceId,
      requestBody: body,
    }),
  });
  if (!data?.planPlaceId) {
    throw new TravelServiceError('Plan place update response missing planPlaceId');
  }
  return data;
}

export async function updatePlanPlaceVisited(
  accessToken: string,
  planPlaceId: string,
  body: PlanPlaceVisitedUpdateRequest,
): Promise<PlanPlaceResponse> {
  const url = travelUrl(TRAVEL_ENDPOINTS.planPlaceVisited(planPlaceId));
  const data = await apiPatch<PlanPlaceResponse>(url, {
    ...authOpts(accessToken),
    body,
    ...travelPlanLogHooks('PATCH', url, accessToken, {
      planId: planPlaceId,
      requestBody: body,
    }),
  });
  if (!data?.planPlaceId) {
    throw new TravelServiceError('Plan place visited update response missing planPlaceId');
  }
  return data;
}

export async function updatePlanPlacePlace(
  accessToken: string,
  planPlaceId: string,
  body: PlanPlaceUpdatePlaceRequest,
): Promise<PlanPlaceResponse> {
  const url = travelUrl(TRAVEL_ENDPOINTS.planPlacePlace(planPlaceId));
  const data = await apiPatch<PlanPlaceResponse>(url, {
    ...authOpts(accessToken),
    body,
    ...travelPlanLogHooks('PATCH', url, accessToken, {
      planId: planPlaceId,
      requestBody: body,
    }),
  });
  if (!data?.planPlaceId) {
    throw new TravelServiceError('Plan place replace response missing planPlaceId');
  }
  return data;
}

export async function deletePlanPlace(accessToken: string, planPlaceId: string): Promise<void> {
  const url = travelUrl(TRAVEL_ENDPOINTS.planPlaceById(planPlaceId));
  await apiDelete(url, {
    ...authOpts(accessToken),
    ...travelPlanLogHooks('DELETE', url, accessToken, { planId: planPlaceId }),
  });
}
