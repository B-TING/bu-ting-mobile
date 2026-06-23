import { GoogleSignin } from '@react-native-google-signin/google-signin';
import {
  getAccessToken as getKakaoAccessToken,
  getProfile as getKakaoProfile,
  login as kakaoLogin,
  loginWithKakaoAccount,
} from '@react-native-seoul/kakao-login';
import NaverLogin from '@react-native-seoul/naver-login';

import { OAUTH_CONFIG } from '../constants/oauthConfig';
import { NAVER_OAUTH_ENABLED } from '../constants/oauthProviders';
import type { OAuthProvider } from '../types/auth';
import { logAuth } from '../utils/authLogger';

export class OAuthSdkError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'OAuthSdkError';
  }
}

export type ProviderTokenResult = {
  provider: OAuthProvider;
  providerToken: string;
};

let initialized = false;

export function initOAuthSdks(): void {
  if (initialized) {
    return;
  }

  if (OAUTH_CONFIG.googleWebClientId) {
    GoogleSignin.configure({
      webClientId: OAUTH_CONFIG.googleWebClientId,
      iosClientId: OAUTH_CONFIG.googleIosClientId || undefined,
      offlineAccess: false,
    });
  }

  if (
    NAVER_OAUTH_ENABLED &&
    OAUTH_CONFIG.naverClientId &&
    OAUTH_CONFIG.naverClientSecret
  ) {
    NaverLogin.initialize({
      appName: OAUTH_CONFIG.naverAppName,
      consumerKey: OAUTH_CONFIG.naverClientId,
      consumerSecret: OAUTH_CONFIG.naverClientSecret,
      serviceUrlSchemeIOS: OAUTH_CONFIG.naverUrlScheme,
      disableNaverAppAuthIOS: true,
    });
  }

  initialized = true;
  logAuth('sdk.init', 'OAuth SDKs initialized', {
    detail: {
      google: Boolean(OAUTH_CONFIG.googleWebClientId),
      kakao: Boolean(OAUTH_CONFIG.kakaoNativeAppKey),
      naver:
        NAVER_OAUTH_ENABLED &&
        Boolean(OAUTH_CONFIG.naverClientId && OAUTH_CONFIG.naverClientSecret),
    },
  });
}

function assertProviderConfigured(provider: OAuthProvider): void {
  if (provider === 'google' && !OAUTH_CONFIG.googleWebClientId) {
    throw new OAuthSdkError('Google OAuth is not configured.');
  }
  if (provider === 'kakao' && !OAUTH_CONFIG.kakaoNativeAppKey) {
    throw new OAuthSdkError('Kakao OAuth is not configured.');
  }
  if (provider === 'naver') {
    if (!NAVER_OAUTH_ENABLED) {
      throw new OAuthSdkError('Naver OAuth is currently disabled.');
    }
    if (!OAUTH_CONFIG.naverClientId || !OAUTH_CONFIG.naverClientSecret) {
      throw new OAuthSdkError('Naver OAuth is not configured.');
    }
  }
}

async function signInWithGoogle(): Promise<ProviderTokenResult> {
  await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
  const response = await GoogleSignin.signIn();
  if (response.type !== 'success' || !response.data.idToken) {
    throw new OAuthSdkError('Google sign-in was cancelled.');
  }
  return { provider: 'google', providerToken: response.data.idToken };
}

async function signInWithKakao(): Promise<ProviderTokenResult> {
  let token: {
    accessToken?: string;
    idToken?: string;
    refreshToken?: string;
  };

  try {
    token = await kakaoLogin();
  } catch (talkError) {
    logAuth('sdk.kakao.talk.fail', 'KakaoTalk login failed, trying account login', {
      level: 'warn',
      detail: talkError,
    });
    token = await loginWithKakaoAccount();
  }

  if (!token.accessToken) {
    throw new OAuthSdkError('Kakao sign-in failed: no access token.');
  }

  logAuth('sdk.kakao.token', 'Kakao OAuth token shape', {
    detail: {
      nativeAppKeyPrefix: OAUTH_CONFIG.kakaoNativeAppKey.slice(0, 8),
      hasAccessToken: Boolean(token.accessToken),
      hasIdToken: Boolean(token.idToken),
      hasRefreshToken: Boolean(token.refreshToken),
    },
  });

  try {
    const profile = await getKakaoProfile();
    logAuth('sdk.kakao.profile', 'Kakao profile verified locally', {
      detail: { id: profile.id, hasEmail: Boolean(profile.email) },
    });
    if (!profile.email) {
      logAuth(
        'sdk.kakao.profile.no-email',
        'Kakao email consent missing — backend signup may fail (enable email scope in Kakao console)',
        { level: 'warn' },
      );
    }
  } catch (profileError) {
    logAuth('sdk.kakao.profile.fail', 'Kakao profile fetch failed', {
      level: 'error',
      detail: profileError,
    });
    throw new OAuthSdkError(
      'Kakao login succeeded but the token is invalid. Check native app key, package name, and key hash in Kakao Developers.',
    );
  }

  // OpenAPI/카카오 REST API: 백엔드 검증은 access_token 기준 (/v2/user/me, /v1/user/access_token_info).
  // id_token은 OIDC 전용이며 Kakao providerToken으로 전달하지 않음.
  return { provider: 'kakao', providerToken: token.accessToken };
}

async function signInWithNaver(): Promise<ProviderTokenResult> {
  const response = await NaverLogin.login();
  if (!response.isSuccess || !response.successResponse?.accessToken) {
    if (response.failureResponse?.isCancel) {
      throw new OAuthSdkError('Naver sign-in was cancelled.');
    }
    throw new OAuthSdkError(
      response.failureResponse?.message ?? 'Naver sign-in failed.',
    );
  }
  return {
    provider: 'naver',
    providerToken: response.successResponse.accessToken,
  };
}

async function refreshGoogleToken(): Promise<ProviderTokenResult | null> {
  try {
    const silent = await GoogleSignin.signInSilently();
    if (silent.type === 'success' && silent.data.idToken) {
      return { provider: 'google', providerToken: silent.data.idToken };
    }
    const tokens = await GoogleSignin.getTokens();
    if (tokens.idToken) {
      return { provider: 'google', providerToken: tokens.idToken };
    }
  } catch {
    return null;
  }
  return null;
}

async function refreshKakaoToken(): Promise<ProviderTokenResult | null> {
  try {
    const tokenInfo = await getKakaoAccessToken();
    if (tokenInfo.accessToken) {
      return { provider: 'kakao', providerToken: tokenInfo.accessToken };
    }
  } catch {
    return null;
  }
  return null;
}

export async function signInWithProvider(
  provider: OAuthProvider,
): Promise<ProviderTokenResult> {
  initOAuthSdks();
  assertProviderConfigured(provider);
  logAuth('sdk.signIn.start', `${provider} sign-in started`);

  try {
    let result: ProviderTokenResult;
    switch (provider) {
      case 'google':
        result = await signInWithGoogle();
        break;
      case 'kakao':
        result = await signInWithKakao();
        break;
      case 'naver':
        result = await signInWithNaver();
        break;
      default:
        throw new OAuthSdkError(`Unsupported provider: ${provider satisfies never}`);
    }
    logAuth('sdk.signIn.success', `${provider} token received`, {
      detail: { provider, providerToken: result.providerToken },
    });
    return result;
  } catch (error) {
    logAuth('sdk.signIn.error', `${provider} sign-in failed`, {
      level: 'error',
      detail: error,
    });
    throw error;
  }
}

/** SDK에 남아 있는 세션으로 provider token을 갱신합니다. */
export async function refreshProviderToken(
  provider: OAuthProvider,
): Promise<ProviderTokenResult | null> {
  initOAuthSdks();
  assertProviderConfigured(provider);
  logAuth('sdk.refresh.start', `${provider} silent refresh started`);

  let result: ProviderTokenResult | null = null;
  switch (provider) {
    case 'google':
      result = await refreshGoogleToken();
      break;
    case 'kakao':
      result = await refreshKakaoToken();
      break;
    case 'naver':
      result = null;
      break;
    default:
      result = null;
  }

  if (result) {
    logAuth('sdk.refresh.success', `${provider} token refreshed`, {
      detail: { provider, providerToken: result.providerToken },
    });
  } else {
    logAuth('sdk.refresh.empty', `${provider} silent refresh unavailable`, {
      level: 'warn',
    });
  }

  return result;
}
