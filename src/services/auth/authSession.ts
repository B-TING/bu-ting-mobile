import { GoogleSignin } from '@react-native-google-signin/google-signin';

import { logout as kakaoLogout } from '@react-native-seoul/kakao-login';



import { NAVER_OAUTH_ENABLED } from '../../constants/auth/oauthProviders';

import {
  buildOAuthLoginRequest,
  loginWithOAuth,
} from './authService';

import { refreshProviderToken } from './oauthSdkService';

import {

  syncTravelSurveyAfterLogin,

  type TravelSurveyLoginSyncResult,

} from '../setup/travelSurveySync';

import { syncSessionActiveTravels } from '../travel/syncSessionActiveTravels';

import { useAppStore } from '../../stores/useAppStore';

import { usePlanStore } from '../../stores/usePlanStore';
import { useTravelRecordBookmarkStore } from '../../stores/useTravelRecordBookmarkStore';

import {

  hydrateAuthStore,

  selectIsAuthenticated,

  useAuthStore,

} from '../../stores/useAuthStore';

import type { AuthUser, OAuthLoginResponse, OAuthProvider } from '../../types/auth';

import { isPkceOAuthProvider } from '../../utils/auth/oauthRedirectUri';

import { logAuth } from '../../utils/auth/authLogger';

import { clearOAuthSession } from '../../utils/auth/oauthSession';



export type CompleteProviderLoginResult = {

  response: OAuthLoginResponse;

  needsOnboardingPrompt: boolean;

};



async function syncTravelSurveyForCurrentSession(): Promise<TravelSurveyLoginSyncResult> {

  const { accessToken, user } = useAuthStore.getState();

  if (!accessToken || !user?.userId) {

    return { needsOnboardingPrompt: false };

  }

  return syncTravelSurveyAfterLogin(user.userId, accessToken);

}



function applyTravelSurveySyncResult(result: TravelSurveyLoginSyncResult): boolean {

  if (result.needsOnboardingPrompt) {

    useAppStore.getState().setPendingTravelSurveyPrompt(true);

  }

  return result.needsOnboardingPrompt;

}



export type ApplyAuthSessionOptions = {

  rememberMe: boolean;

  provider: OAuthProvider;

  providerToken: string | null;

};



function toAuthUser(response: OAuthLoginResponse): AuthUser {

  return {

    userId: response.userId,

    email: response.email,

    nickname: response.nickname,

    provider: response.provider,

  };

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



  useAppStore.getState().login({

    userId: user.userId,

    displayName: user.nickname || user.email.split('@')[0] || 'User',

  });



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

): Promise<CompleteProviderLoginResult> {

  logAuth('login.start', 'Provider login flow started', {

    detail: {

      provider,

      rememberMe,

      providerToken,

    },

  });



  const response = await loginWithOAuth(

    buildOAuthLoginRequest(provider, providerToken),

  );



  const storedProviderToken = isPkceOAuthProvider(provider) ? null : providerToken;



  applyAuthSession(response, {

    rememberMe,

    provider,

    providerToken: storedProviderToken,

  });



  if (isPkceOAuthProvider(provider)) {

    await clearOAuthSession();

  }



  const syncResult = await syncTravelSurveyForCurrentSession();

  const needsOnboardingPrompt = applyTravelSurveySyncResult(syncResult);

  await syncSessionActiveTravels();



  logAuth('login.complete', 'Provider login flow completed', {

    detail: { provider, userId: response.userId, needsOnboardingPrompt },

  });



  return { response, needsOnboardingPrompt };

}



async function tryBackendLogin(

  provider: OAuthProvider,

  providerToken: string,

  rememberMe: boolean,

): Promise<boolean> {

  try {

    await completeProviderLogin(provider, providerToken, rememberMe);

    return true;

  } catch (error) {

    logAuth('bootstrap.backend.fail', 'Stored token login failed', {

      level: 'warn',

      detail: error,

    });

    return false;

  }

}



function restorePersistedSession(user: AuthUser): void {

  useAppStore.getState().login({

    userId: user.userId,

    displayName: user.nickname || user.email.split('@')[0] || 'User',

  });

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

  await clearOAuthSession();

  useAuthStore.getState().clearSession();

  usePlanStore.getState().clearActivePlan();
  useTravelRecordBookmarkStore.getState().reset();



  useAppStore.setState(current => ({

    ...current,

    auth: {

      isLoggedIn: false,

      userId: null,

      displayName: null,

    },

    onboarding: current.guestOnboarding ?? null,

    pendingTravelSurveyPrompt: false,

  }));



  logAuth('logout.complete', 'Logout completed');

}



/**

 * 앱 시작 시 저장된 세션을 복원합니다.

 * 1) 유효한 access token이 있으면 로컬 세션 복원

 * 2) 저장된 providerToken으로 백엔드 재로그인 (Naver 등)

 * 3) 실패 시 SDK silent refresh 후 재시도

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

  useAppStore.getState().setOfflineMode(false);

  if (selectIsAuthenticated(state) && state.user) {

    restorePersistedSession(state.user);

    await syncTravelSurveyForCurrentSession();

    await syncSessionActiveTravels();

    logAuth('bootstrap.success', 'Auto login succeeded (stored access token)');

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


