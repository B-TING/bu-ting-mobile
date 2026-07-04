import { API_BASE_URL, USER_ENDPOINTS } from '../../constants/api/apiConfig';
import type { MyProfileResponse, UpdateMyProfileRequest } from '../../types/userProfile';
import { ApiClientError, apiDelete, apiPatch } from '../api/apiClient';

export class UserServiceError extends ApiClientError {
  constructor(message: string, status?: number) {
    super(message, { status });
    this.name = 'UserServiceError';
  }
}

function mapUserError(error: ApiClientError): UserServiceError {
  return new UserServiceError(error.message, error.status);
}

function parseProfileBody(data: MyProfileResponse | undefined): MyProfileResponse {
  if (data && 'userId' in data && 'nickname' in data) {
    return data;
  }
  throw new UserServiceError('Invalid profile response.');
}

export async function updateMyProfile(
  accessToken: string,
  request: UpdateMyProfileRequest,
): Promise<MyProfileResponse> {
  const url = `${API_BASE_URL}${USER_ENDPOINTS.me}`;
  const data = await apiPatch<MyProfileResponse>(url, {
    accessToken,
    body: request,
    errorMessagePrefix: 'User request failed',
    mapError: mapUserError,
  });

  return parseProfileBody(data);
}

export async function deleteMyAccount(accessToken: string): Promise<void> {
  const url = `${API_BASE_URL}${USER_ENDPOINTS.me}`;
  await apiDelete(url, {
    accessToken,
    errorMessagePrefix: 'User request failed',
    mapError: mapUserError,
  });
}
