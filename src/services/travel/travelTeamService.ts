import { API_BASE_URL, TRAVEL_TEAM_ENDPOINTS } from '../../constants/api/apiConfig';
import type {
  MyTravelResponse,
  TravelInviteLinkInfoResponse,
  TravelInviteLinkResponse,
  TravelMemberResponse,
  TravelStatusDto,
  InviteVerificationResponse,
} from '../../types/travelApi';
import {
  logTravelPlanApiError,
  logTravelPlanApiRequest,
  logTravelPlanApiResponse,
} from '../../utils/travel/travelPlanApiLogger';
import { ApiClientError, apiDelete, apiGet, apiPatch, apiPost } from '../api/apiClient';
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
  method: 'GET' | 'POST' | 'DELETE' | 'PATCH',
  url: string,
  accessToken: string,
  travelId?: string,
  requestBody?: unknown,
) {
  return {
    onRequest: () => {
      logTravelPlanApiRequest(method, url, { accessToken, travelId, requestBody });
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

function inviteTokenUrl(path: string, token: string): string {
  const url = new URL(`${API_BASE_URL}${path}`);
  url.searchParams.set('token', token);
  return url.toString();
}

/** GET /api/v1/travel/team/invites/verify?token= — 초대 미리보기 (인증 불필요) */
export async function verifyTravelInvite(
  token: string,
): Promise<InviteVerificationResponse> {
  const trimmed = token.trim();
  if (!trimmed) {
    throw new TravelServiceError('Invite token is required');
  }
  const url = inviteTokenUrl(TRAVEL_TEAM_ENDPOINTS.invitesVerify, trimmed);
  const data = await apiGet<InviteVerificationResponse>(url, {
    errorMessagePrefix: 'Travel invite verify failed',
    mapError: mapTravelTeamError,
    ...teamLogHooks('GET', url, ''),
  });
  if (!data?.travelId) {
    throw new TravelServiceError('Invite verify response missing travelId');
  }
  return data;
}

/** POST /api/v1/travel/team/invites/accept?token= — 합류 (Bearer 필수) */
export async function acceptTravelInvite(
  accessToken: string,
  token: string,
): Promise<InviteVerificationResponse> {
  const trimmed = token.trim();
  if (!trimmed) {
    throw new TravelServiceError('Invite token is required');
  }
  const url = inviteTokenUrl(TRAVEL_TEAM_ENDPOINTS.invitesAccept, trimmed);
  const data = await apiPost<InviteVerificationResponse>(url, {
    ...authOpts(accessToken),
    ...teamLogHooks('POST', url, accessToken),
  });
  if (!data?.travelId) {
    throw new TravelServiceError('Invite accept response missing travelId');
  }
  return data;
}

/** DELETE /api/v1/travel/team/{travelId}/members/me — 여행 나가기 */
export async function leaveTravelTeam(
  accessToken: string,
  travelId: string,
): Promise<void> {
  const url = teamUrl(TRAVEL_TEAM_ENDPOINTS.travelMembersMe(travelId));
  await apiDelete(url, {
    ...authOpts(accessToken),
    ...teamLogHooks('DELETE', url, accessToken, travelId),
  });
}

/** DELETE /api/v1/travel/team/{travelId}/members/{userId} — 멤버 강퇴 */
export async function removeTravelMember(
  accessToken: string,
  travelId: string,
  userId: string,
): Promise<void> {
  const trimmed = userId.trim();
  if (!trimmed) {
    throw new TravelServiceError('userId is required');
  }
  const url = teamUrl(TRAVEL_TEAM_ENDPOINTS.travelMemberByUserId(travelId, trimmed));
  await apiDelete(url, {
    ...authOpts(accessToken),
    ...teamLogHooks('DELETE', url, accessToken, travelId),
  });
}

/** PATCH /api/v1/travel/team/{travelId}/leader — 방장 위임 */
export async function transferTravelLeader(
  accessToken: string,
  travelId: string,
  newLeaderUserId: string,
): Promise<void> {
  const trimmed = newLeaderUserId.trim();
  if (!trimmed) {
    throw new TravelServiceError('newLeaderUserId is required');
  }
  const url = teamUrl(TRAVEL_TEAM_ENDPOINTS.travelLeader(travelId));
  const body = { newLeaderUserId: trimmed };
  await apiPatch(url, {
    ...authOpts(accessToken),
    body,
    ...teamLogHooks('PATCH', url, accessToken, travelId, body),
  });
}
