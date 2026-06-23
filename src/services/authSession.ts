import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { logout as kakaoLogout } from '@react-native-seoul/kakao-login';

import { NAVER_OAUTH_ENABLED } from '../constants/oauthProviders';
import { buildOAuthLoginRequest, loginWithOAuth } from './authService';
import { refreshProviderToken } from './oauthSdkService';
import { useAppStore } from '../stores/useAppStore';
import {
  hydrateAuthStore,
  selectIsAuthenticated,
  selectReusableAccessToken,
  useAuthStore,
} from '../stores/useAuthStore';
import type { AuthUser, OAuthLoginResponse, OAuthProvider } from '../types/auth';
import { logAuth } from '../utils/authLogger';

export type ApplyAuthSessionOptions = {
  rememberMe: boolean;
  provider: OAuthProvider;
  providerToken: string;
};

function toAuthUser(response: OAuthLoginResponse): AuthUser {
  return {
    userId: response.userId,
    email: response.email,
    nickname: response.nickname,
    provider: response.provider,
  };
}

function syncAppLoginFromAuthUser(user: AuthUser): void {
  useAppStore.getState().login({
    userId: user.userId,
    displayName: user.nickname || user.email.split('@')[0] || 'User',
  });
}

export function applyAuthSession(
  response: OAuthLoginResponse,
  options: ApplyAuthSessionOptions,
): void {
  const user = toAuthUser(response);

  useAuthStore.getState().setSession({
    accessToken: response.accessToken,
    expiresIn: response.expiresIn,
    user,
    rememberMe: options.rememberMe,
    provider: options.provider,
    providerToken: options.rememberMe ? options.providerToken : null,
  });

  syncAppLoginFromAuthUser(user);

  logAuth('session.apply', 'Auth session stored', {
    detail: {
      userId: user.userId,
      email: user.email,
      nickname: user.nickname,
      provider: options.provider,
      rememberMe: options.rememberMe,
      accessToken: response.accessToken,
    },
  });
}

export async function completeProviderLogin(
  provider: OAuthProvider,
  providerToken: string,
  rememberMe: boolean,
  options?: { reuseStoredAccessToken?: boolean },
): Promise<OAuthLoginResponse> {
  logAuth('login.start', 'Provider login flow started', {
    detail: { provider, rememberMe, providerToken },
  });

  const reuseStoredAccessToken = options?.reuseStoredAccessToken ?? true;
  const storedAccessToken = reuseStoredAccessToken
    ? selectReusableAccessToken(useAuthStore.getState())
    : null;

  const response = await loginWithOAuth(
    buildOAuthLoginRequest(provider, providerToken),
    { storedAccessToken },
  );

  applyAuthSession(response, { rememberMe, provider, providerToken });

  logAuth('login.complete', 'Provider login flow completed', {
    detail: { provider, userId: response.userId },
  });

  return response;
}

async function tryBackendLogin(
  provider: OAuthProvider,
  providerToken: string,
  rememberMe: boolean,
): Promise<boolean> {
  try {
    await completeProviderLogin(provider, providerToken, rememberMe, {
      reuseStoredAccessToken: false,
    });
    return true;
  } catch (error) {
    logAuth('bootstrap.backend.fail', 'Stored token login failed', {
      level: 'warn',
      detail: error,
    });
    return false;
  }
}

async function signOutProviderSdks(provider: OAuthProvider | null): Promise<void> {
  if (provider === 'google') {
    try {
      await GoogleSignin.signOut();
    } catch {
      /* ignore */
    }
  }

  if (provider === 'kakao') {
    try {
      await kakaoLogout();
    } catch {
      /* ignore */
    }
  }
}

export async function logoutSession(): Promise<void> {
  const { provider } = useAuthStore.getState();

  logAuth('logout.start', 'Logout started', { detail: { provider } });
  await signOutProviderSdks(provider);
  useAuthStore.getState().clearSession();

  useAppStore.setState(current => ({
    ...current,
    auth: {
      isLoggedIn: false,
      userId: null,
      displayName: null,
    },
  }));

  logAuth('logout.complete', 'Logout completed');
}

/**
 * 앱 시작 시 자동 로그인을 시도합니다.
 * 1) 우리 accessToken이 아직 유효하면 API 호출 없이 로컬 세션 복원
 * 2) 만료됐으면 저장된 providerToken으로 백엔드 재검증 (Authorization 헤더 생략)
 * 3) 실패 시 SDK 세션으로 토큰 갱신 후 재시도
 */
export async function bootstrapAuth(): Promise<void> {
  logAuth('bootstrap.start', 'Auth bootstrap started');
  await hydrateAuthStore();

  const state = useAuthStore.getState();

  if (state.provider === 'naver' && !NAVER_OAUTH_ENABLED) {
    logAuth('bootstrap.skip', 'Naver session cleared (disabled)', { level: 'warn' });
    useAuthStore.getState().clearSession();
    return;
  }

  if (!state.rememberMe || !state.provider) {
    if (!selectIsAuthenticated(state)) {
      useAppStore.setState(current => ({
        ...current,
        auth: {
          isLoggedIn: false,
          userId: null,
          displayName: null,
        },
      }));
    }

    logAuth('bootstrap.skip', 'Auto login disabled or no saved provider');
    return;
  }

  if (selectIsAuthenticated(state) && state.user) {
    syncAppLoginFromAuthUser(state.user);
    logAuth('bootstrap.success', 'Auto login succeeded (cached session)');
    return;
  }

  const { provider, providerToken } = state;

  logAuth('bootstrap.try', 'Auto login attempt', {
    detail: { provider, hasProviderToken: Boolean(providerToken) },
  });

  if (providerToken) {
    const ok = await tryBackendLogin(provider, providerToken, true);
    if (ok) {
      logAuth('bootstrap.success', 'Auto login succeeded (stored token)');
      return;
    }
  }

  const refreshed = await refreshProviderToken(provider);
  if (refreshed?.providerToken) {
    const ok = await tryBackendLogin(
      refreshed.provider,
      refreshed.providerToken,
      true,
    );
    if (ok) {
      logAuth('bootstrap.success', 'Auto login succeeded (refreshed token)');
      return;
    }
  }

  logAuth('bootstrap.fail', 'Auto login failed — session cleared', { level: 'warn' });
  useAuthStore.getState().clearSession();
  useAppStore.setState(current => ({
    ...current,
    auth: {
      isLoggedIn: false,
      userId: null,
      displayName: null,
    },
  }));
}
