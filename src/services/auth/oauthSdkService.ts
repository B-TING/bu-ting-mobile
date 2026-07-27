import { GoogleSignin } from '@react-native-google-signin/google-signin';
import {
  login as kakaoLogin,
  logout as kakaoLogout,
} from '@react-native-seoul/kakao-login';
import NaverLogin from '@react-native-seoul/naver-login';

import { OAUTH_CONFIG } from '../../constants/auth/oauthConfig';
import { NAVER_OAUTH_ENABLED } from '../../constants/auth/oauthProviders';
import type { OAuthProvider } from '../../types/auth';
import { logAuth } from '../../utils/auth/authLogger';

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

function isGoogleOAuthConfigured(): boolean {
  return Boolean(OAUTH_CONFIG.googleWebClientId.trim());
}

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
      google: isGoogleOAuthConfigured(),
      kakao: Boolean(OAUTH_CONFIG.kakaoRestApiKey || OAUTH_CONFIG.kakaoNativeAppKey),
      naver:
        NAVER_OAUTH_ENABLED &&
        Boolean(OAUTH_CONFIG.naverClientId && OAUTH_CONFIG.naverClientSecret),
    },
  });
}

function assertProviderConfigured(provider: OAuthProvider): void {
  if (provider === 'google' && !isGoogleOAuthConfigured()) {
    throw new OAuthSdkError('Google OAuth is not configured.');
  }
  if (provider === 'kakao' && !OAUTH_CONFIG.kakaoRestApiKey && !OAUTH_CONFIG.kakaoNativeAppKey) {
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
  if (response.type === 'cancelled') {
    throw new OAuthSdkError('Google sign-in was cancelled.');
  }

  const idToken = response.data.idToken;
  if (!idToken) {
    throw new OAuthSdkError(
      'Google ID token is not available. Check GOOGLE_OAUTH_WEB_CLIENT_ID.',
    );
  }

  return { provider: 'google', providerToken: idToken };
}

async function signInWithKakao(): Promise<ProviderTokenResult> {
  const token = await kakaoLogin();
  if (!token.idToken) {
    throw new OAuthSdkError(
      'Kakao ID token is not available. Enable OpenID Connect in Kakao app settings.',
    );
  }

  return { provider: 'kakao', providerToken: token.idToken };
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
    logAuth('sdk.signIn.success', `${provider} id token received`, {
      detail: {
        provider,
        providerToken: result.providerToken,
      },
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

/** SDK에 남아 있는 세션으로 provider token을 재발급합니다. */
export async function refreshProviderToken(
  provider: OAuthProvider,
): Promise<ProviderTokenResult | null> {
  initOAuthSdks();
  assertProviderConfigured(provider);
  logAuth('sdk.refresh.start', `${provider} silent refresh started`);

  if (provider === 'google') {
    const result = await refreshGoogleToken();
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

  logAuth('sdk.refresh.empty', `${provider} silent refresh unavailable`, {
    level: 'warn',
  });
  return null;
}

export async function signOutProvider(provider: OAuthProvider | null): Promise<void> {
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
