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

export async function createTravel(
  accessToken: string,
  body: TravelCreateRequest,
): Promise<TravelResponse> {
  const data = await apiPost<TravelResponse>(travelUrl(TRAVEL_ENDPOINTS.travels), {
    ...authOpts(accessToken),
    body,
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
  const data = await apiPost<PlanResponse>(travelUrl(TRAVEL_ENDPOINTS.travelPlans(travelId)), {
    ...authOpts(accessToken),
    body,
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
  const data = await apiGet<TravelPlansResponse>(travelUrl(TRAVEL_ENDPOINTS.travelPlans(travelId)), {
    ...authOpts(accessToken),
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
  const data = await apiGet<PlanPlaceResponse[]>(travelUrl(TRAVEL_ENDPOINTS.planPlaces(planId)), {
    ...authOpts(accessToken),
  });
  return data ?? [];
}

export async function createPlanPlace(
  accessToken: string,
  planId: string,
  body: PlanPlaceCreateRequest,
): Promise<PlanPlaceResponse> {
  const data = await apiPost<PlanPlaceResponse>(travelUrl(TRAVEL_ENDPOINTS.planPlaces(planId)), {
    ...authOpts(accessToken),
    body,
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
  const data = await apiPatch<PlanPlaceResponse[]>(
    travelUrl(TRAVEL_ENDPOINTS.planPlaceSequence(planId)),
    {
      ...authOpts(accessToken),
      body,
    },
  );
  return data ?? [];
}

export async function deletePlanPlace(accessToken: string, planPlaceId: string): Promise<void> {
  await apiDelete(travelUrl(TRAVEL_ENDPOINTS.planPlaceById(planPlaceId)), {
    ...authOpts(accessToken),
  });
}
