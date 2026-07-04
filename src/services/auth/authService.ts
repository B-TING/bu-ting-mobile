import { API_BASE_URL, AUTH_ENDPOINTS } from '../../constants/api/apiConfig';
import type { OAuthLoginRequest, OAuthLoginResponse, OAuthProvider } from '../../types/auth';
import { logAuth } from '../../utils/auth/authLogger';
import { ApiClientError, apiPost } from '../api/apiClient';

export class AuthServiceError extends ApiClientError {
  constructor(message: string, status?: number) {
    super(message, { status });
    this.name = 'AuthServiceError';
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

  logAuth('api.request', 'OAuth login request', {
    detail: {
      provider: request.provider,
      url,
      providerToken: request.providerToken,
      hasStoredAccessToken: Boolean(storedAccessToken),
    },
  });

  try {
    const data = await apiPost<OAuthLoginResponse>(url, {
      body: request,
      accessToken: storedAccessToken,
      errorMessagePrefix: 'OAuth login failed',
      mapError: error => new AuthServiceError(error.message, error.status),
      onError: error => {
        logAuth('api.error', error.message, {
          level: 'error',
          detail: { status: error.status, provider: request.provider, body: error.responseBody },
        });
      },
    });

    if (!data?.accessToken) {
      logAuth('api.error', 'Invalid OAuth login response.', { level: 'error' });
      throw new AuthServiceError('Invalid OAuth login response.');
    }

    logAuth('api.success', 'OAuth login succeeded', {
      detail: {
        provider: data.provider,
        userId: data.userId,
        email: data.email,
        nickname: data.nickname,
        accessToken: data.accessToken,
        expiresIn: data.expiresIn,
      },
    });

    return data;
  } catch (error) {
    if (error instanceof AuthServiceError) {
      throw error;
    }
    if (error instanceof ApiClientError) {
      throw new AuthServiceError(error.message, error.status);
    }
    throw error;
  }
}
