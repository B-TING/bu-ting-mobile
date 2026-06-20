import {
  API_BASE_URL,
  AUTH_ENDPOINTS,
  OAUTH_AUTHORIZE_URL,
  OAUTH_CLIENT_CONFIG,
} from '../constants/apiConfig';
import type {
  ApiEnvelope,
  OAuthLoginRequest,
  OAuthLoginResponse,
  OAuthProvider,
} from '../types/auth';
import { generateCodeChallenge, generateCodeVerifier } from '../utils/pkce';
import {
  clearOAuthSession,
  loadOAuthSession,
  saveOAuthSession,
} from '../utils/oauthSession';

export class AuthServiceError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = 'AuthServiceError';
    this.status = status;
  }
}

/** PKCE code_verifier 생성 후 provider 로그인 URL을 만듭니다. */
export async function startOAuthLogin(provider: OAuthProvider): Promise<string> {
  const config = OAUTH_CLIENT_CONFIG[provider];
  if (!config.clientId || !config.redirectUri) {
    throw new AuthServiceError(
      `OAuth client config is missing for provider: ${provider}`,
    );
  }

  const codeVerifier = generateCodeVerifier();
  const codeChallenge = await generateCodeChallenge(codeVerifier);
  const state =
    provider === 'naver' ? generateCodeVerifier().slice(0, 32) : null;

  await saveOAuthSession({ codeVerifier, state });

  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: 'code',
    scope: config.scope,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
  });

  if (state) {
    params.set('state', state);
  }

  return `${OAUTH_AUTHORIZE_URL[provider]}?${params.toString()}`;
}

export type CompleteOAuthLoginParams = {
  provider: OAuthProvider;
  code: string;
  state?: string | null;
  redirectUri: string;
};

/**
 * 콜백에서 받은 authorization code를 백엔드로 보내
 * 우리 서비스 opaque accessToken을 발급받습니다.
 */
export async function completeOAuthLogin(
  params: CompleteOAuthLoginParams,
): Promise<OAuthLoginResponse> {
  const session = await loadOAuthSession();
  if (!session?.codeVerifier) {
    throw new AuthServiceError('OAuth session expired. Please sign in again.');
  }

  if (params.provider === 'naver') {
    if (!params.state || session.state !== params.state) {
      throw new AuthServiceError('Invalid OAuth state.');
    }
  }

  const providerToken =
    params.provider === 'naver'
      ? `code=${params.code}&state=${params.state}`
      : params.code;

  const request: OAuthLoginRequest = {
    provider: params.provider,
    providerToken,
    redirectUri: params.redirectUri,
    codeVerifier: session.codeVerifier,
  };

  try {
    return await loginWithOAuth(request);
  } finally {
    await clearOAuthSession();
  }
}

export async function loginWithOAuth(
  request: OAuthLoginRequest,
): Promise<OAuthLoginResponse> {
  const url = `${API_BASE_URL}${AUTH_ENDPOINTS.oauthLogin}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  const body = (await res.json().catch(() => null)) as
    | ApiEnvelope<OAuthLoginResponse>
    | { message?: string }
    | null;

  if (!res.ok) {
    const message =
      (body && 'message' in body && body.message) ||
      `OAuth login failed (${res.status})`;
    throw new AuthServiceError(message, res.status);
  }

  if (!body || !('data' in body) || !body.data?.accessToken) {
    throw new AuthServiceError('Invalid OAuth login response.');
  }

  return body.data;
}
