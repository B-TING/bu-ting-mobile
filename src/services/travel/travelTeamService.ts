import { API_BASE_URL, TRAVEL_TEAM_ENDPOINTS } from '../../constants/api/apiConfig';
import type { MyTravelResponse, TravelStatusDto } from '../../types/travelApi';
import {
  logTravelPlanApiError,
  logTravelPlanApiRequest,
  logTravelPlanApiResponse,
} from '../../utils/travel/travelPlanApiLogger';
import { ApiClientError, apiGet } from '../api/apiClient';
import { TravelServiceError } from './travelService';

function mapTravelTeamError(error: ApiClientError): TravelServiceError {
  return new TravelServiceError(error.message, {
    status: error.status,
    url: error.url,
    responseBody: error.responseBody,
  });
}

function myTravelsUrl(status?: TravelStatusDto): string {
  const url = new URL(`${API_BASE_URL}${TRAVEL_TEAM_ENDPOINTS.myTravels}`);
  if (status) {
    url.searchParams.set('status', status);
  }
  return url.toString();
}

export async function fetchMyTravels(
  accessToken: string,
  status?: TravelStatusDto,
): Promise<MyTravelResponse[]> {
  const url = myTravelsUrl(status);
  const data = await apiGet<MyTravelResponse[]>(url, {
    accessToken,
    errorMessagePrefix: 'My travels request failed',
    mapError: mapTravelTeamError,
    onRequest: () => {
      logTravelPlanApiRequest('GET', url, { accessToken });
    },
    onResponse: ({ status: httpStatus, body }) => {
      logTravelPlanApiResponse('GET', url, httpStatus, body);
    },
    onError: (error: ApiClientError) => {
      logTravelPlanApiError('GET', url, error);
    },
  });
  return data ?? [];
}

/** PLANNED·IN_PROGRESS 여행만 반환 */
export async function fetchMyActiveTravels(accessToken: string): Promise<MyTravelResponse[]> {
  const travels = await fetchMyTravels(accessToken);
  return travels.filter(
    travel => travel.status === 'PLANNED' || travel.status === 'IN_PROGRESS',
  );
}
