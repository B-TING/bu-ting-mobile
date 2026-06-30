import { API_BASE_URL, USER_ENDPOINTS } from '../../constants/api/apiConfig';
import type { ApiEnvelope, ApiErrorResponse } from '../../types/auth';
import type { MyProfileResponse, UpdateMyProfileRequest } from '../../types/userProfile';

export class UserServiceError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = 'UserServiceError';
    this.status = status;
  }
}

function authHeaders(accessToken: string): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${accessToken}`,
  };
}

function parseProfileBody(
  body: ApiEnvelope<MyProfileResponse> | ApiErrorResponse | MyProfileResponse | null,
): MyProfileResponse {
  if (body && 'data' in body && body.data) {
    return body.data;
  }
  if (body && 'userId' in body && 'nickname' in body) {
    return body;
  }
  throw new UserServiceError('Invalid profile response.');
}

async function parseErrorMessage(res: Response, body: unknown): Promise<string> {
  if (body && typeof body === 'object' && 'message' in body && typeof body.message === 'string') {
    return body.message;
  }
  return `User request failed (${res.status})`;
}

export async function updateMyProfile(
  accessToken: string,
  request: UpdateMyProfileRequest,
): Promise<MyProfileResponse> {
  const url = `${API_BASE_URL}${USER_ENDPOINTS.me}`;
  const res = await fetch(url, {
    method: 'PATCH',
    headers: authHeaders(accessToken),
    body: JSON.stringify(request),
  });

  const body = (await res.json().catch(() => null)) as
    | ApiEnvelope<MyProfileResponse>
    | ApiErrorResponse
    | MyProfileResponse
    | null;

  if (!res.ok) {
    throw new UserServiceError(await parseErrorMessage(res, body), res.status);
  }

  return parseProfileBody(body);
}

export async function deleteMyAccount(accessToken: string): Promise<void> {
  const url = `${API_BASE_URL}${USER_ENDPOINTS.me}`;
  const res = await fetch(url, {
    method: 'DELETE',
    headers: authHeaders(accessToken),
  });

  if (res.status === 204) {
    return;
  }

  const body = (await res.json().catch(() => null)) as ApiErrorResponse | null;
  throw new UserServiceError(await parseErrorMessage(res, body), res.status);
}
