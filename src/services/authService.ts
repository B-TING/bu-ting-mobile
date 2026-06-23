import { API_BASE_URL, AUTH_ENDPOINTS } from '../constants/apiConfig';
import type {
  ApiEnvelope,
  ApiErrorResponse,
  OAuthLoginRequest,
  OAuthLoginResponse,
  OAuthProvider,
} from '../types/auth';
import { logAuth } from '../utils/authLogger';

export class AuthServiceError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = 'AuthServiceError';
    this.status = status;
  }
}

export function buildOAuthLoginRequest(
  provider: OAuthProvider,
  providerToken: string,
): OAuthLoginRequest {
  return { provider, providerToken };
}

export async function loginWithOAuth(
  request: OAuthLoginRequest,
  options?: { storedAccessToken?: string | null },
): Promise<OAuthLoginResponse> {
  const url = `${API_BASE_URL}${AUTH_ENDPOINTS.oauthLogin}`;
  const storedAccessToken = options?.storedAccessToken ?? null;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (storedAccessToken) {
    headers.Authorization = `Bearer ${storedAccessToken}`;
  }

  logAuth('api.request', 'OAuth login request', {
    detail: {
      provider: request.provider,
      url,
      providerToken: request.providerToken,
      hasStoredAccessToken: Boolean(storedAccessToken),
    },
  });

  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(request),
  });

  const body = (await res.json().catch(() => null)) as
    | ApiEnvelope<OAuthLoginResponse>
    | ApiErrorResponse
    | null;

  if (!res.ok) {
    const message =
      (body && 'message' in body && body.message) ||
      `OAuth login failed (${res.status})`;
    logAuth('api.error', message, {
      level: 'error',
      detail: { status: res.status, provider: request.provider, body },
    });
    throw new AuthServiceError(message, res.status);
  }

  if (!body || !('data' in body) || !body.data?.accessToken) {
    logAuth('api.error', 'Invalid OAuth login response.', { level: 'error' });
    throw new AuthServiceError('Invalid OAuth login response.');
  }

  logAuth('api.success', 'OAuth login succeeded', {
    detail: {
      provider: body.data.provider,
      userId: body.data.userId,
      email: body.data.email,
      nickname: body.data.nickname,
      accessToken: body.data.accessToken,
      expiresIn: body.data.expiresIn,
    },
  });

  return body.data;
}
