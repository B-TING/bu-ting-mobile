import { API_BASE_URL, TRAVEL_TEAM_ENDPOINTS } from '../../constants/api/apiConfig';
import type {
  MyTravelResponse,
  TravelInviteLinkInfoResponse,
  TravelInviteLinkResponse,
  TravelMemberResponse,
  TravelStatusDto,
} from '../../types/travelApi';
import {
  logTravelPlanApiError,
  logTravelPlanApiRequest,
  logTravelPlanApiResponse,
} from '../../utils/travel/travelPlanApiLogger';
import { ApiClientError, apiGet, apiPost } from '../api/apiClient';
import { TravelServiceError } from './travelService';

function mapTravelTeamError(error: ApiClientError): TravelServiceError {
  return new TravelServiceError(error.message, {
    status: error.status,
    url: error.url,
    responseBody: error.responseBody,
  });
}

const authOpts = (accessToken: string) => ({
  accessToken,
  errorMessagePrefix: 'Travel team request failed',
  mapError: mapTravelTeamError,
});

function teamUrl(path: string): string {
  return `${API_BASE_URL}${path}`;
}

function teamLogHooks(
  method: 'GET' | 'POST',
  url: string,
  accessToken: string,
  travelId?: string,
) {
  return {
    onRequest: () => {
      logTravelPlanApiRequest(method, url, { accessToken, travelId });
    },
    onResponse: ({ status, body }: { status: number; body: unknown }) => {
      logTravelPlanApiResponse(method, url, status, body, { travelId });
    },
    onError: (error: ApiClientError) => {
      logTravelPlanApiError(method, url, error, { travelId });
    },
  };
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
    ...authOpts(accessToken),
    ...teamLogHooks('GET', url, accessToken),
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

export async function fetchTravelMembers(
  accessToken: string,
  travelId: string,
): Promise<TravelMemberResponse[]> {
  const url = teamUrl(TRAVEL_TEAM_ENDPOINTS.travelMembers(travelId));
  const data = await apiGet<TravelMemberResponse[]>(url, {
    ...authOpts(accessToken),
    ...teamLogHooks('GET', url, accessToken, travelId),
  });
  return data ?? [];
}

export async function fetchTravelInviteLink(
  accessToken: string,
  travelId: string,
): Promise<TravelInviteLinkInfoResponse | null> {
  const url = teamUrl(TRAVEL_TEAM_ENDPOINTS.travelInvite(travelId));
  const data = await apiGet<TravelInviteLinkInfoResponse>(url, {
    ...authOpts(accessToken),
    emptyOnStatus: [400],
    ...teamLogHooks('GET', url, accessToken, travelId),
  });
  return data ?? null;
}

export async function createTravelInviteLink(
  accessToken: string,
  travelId: string,
): Promise<TravelInviteLinkResponse> {
  const url = teamUrl(TRAVEL_TEAM_ENDPOINTS.travelInvite(travelId));
  const data = await apiPost<TravelInviteLinkResponse>(url, {
    ...authOpts(accessToken),
    ...teamLogHooks('POST', url, accessToken, travelId),
  });
  if (!data?.inviteLink) {
    throw new TravelServiceError('Invite link response missing inviteLink');
  }
  return data;
}

/** 유효한 초대 링크를 조회하고 없으면 새로 생성합니다. */
export async function resolveTravelInviteLink(
  accessToken: string,
  travelId: string,
): Promise<TravelInviteLinkInfoResponse> {
  const existing = await fetchTravelInviteLink(accessToken, travelId);
  if (existing?.inviteLink) {
    return existing;
  }
  const created = await createTravelInviteLink(accessToken, travelId);
  return { inviteLink: created.inviteLink };
}
