import { API_BASE_URL, AUTH_ENDPOINTS } from '../../constants/api/apiConfig';
import type {
  ApiEnvelope,
  ApiErrorResponse,
  OAuthLoginRequest,
  OAuthLoginResponse,
  OAuthProvider,
} from '../../types/auth';
import { logAuth } from '../../utils/authLogger';

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
  options?: { redirectUri?: string; codeVerifier?: string },
): OAuthLoginRequest {
  const request: OAuthLoginRequest = { provider, providerToken };

  if (options?.redirectUri) {
    request.redirectUri = options.redirectUri;
  }
  if (options?.codeVerifier) {
    request.codeVerifier = options.codeVerifier;
  }

  return request;
}

export async function loginWithOAuth(
  request: OAuthLoginRequest,
): Promise<OAuthLoginResponse> {
  const url = `${API_BASE_URL}${AUTH_ENDPOINTS.oauthLogin}`;
  logAuth('api.request', 'OAuth login request', {
    detail: {
      provider: request.provider,
      url,
      providerToken: request.providerToken,
      tokenKind: request.redirectUri ? 'authorization_code' : 'access_token',
      hasRedirectUri: Boolean(request.redirectUri),
      hasCodeVerifier: Boolean(request.codeVerifier),
    },
  });

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
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
