import { Platform } from 'react-native';

import { OAUTH_CONFIG } from '../../constants/auth/oauthConfig';
import type { OAuthProvider } from '../../types/auth';

/** Google PKCE redirect path (단일 슬래시) */
export const GOOGLE_OAUTH_REDIRECT_PATH = '/oauth2redirect';

export type PkceOAuthProvider = 'google' | 'kakao';

export function isPkceOAuthProvider(
  provider: OAuthProvider,
): provider is PkceOAuthProvider {
  return provider === 'google' || provider === 'kakao';
}

/** `123-abc.apps.googleusercontent.com` → `com.googleusercontent.apps.123-abc` */
export function reversedGoogleClientIdScheme(clientId: string): string | null {
  const trimmed = clientId.trim();
  if (!trimmed) {
    return null;
  }
  const match = trimmed.match(/^([\w-]+)\.apps\.googleusercontent\.com$/);
  if (match) {
    return `com.googleusercontent.apps.${match[1]}`;
  }
  if (trimmed.startsWith('com.googleusercontent.apps.')) {
    return trimmed;
  }
  return null;
}

/**
 * 모바일 authorize·redirect_uri용 Google OAuth 클라이언트 ID.
 * Web 클라이언트는 custom scheme redirect URI를 허용하지 않으므로 사용하지 않습니다.
 */
export function resolveGoogleOAuthClientId(): string {
  if (Platform.OS === 'ios') {
    const iosClientId = OAUTH_CONFIG.googleIosClientId.trim();
    if (iosClientId) {
      return iosClientId;
    }
    throw new Error(
      'GOOGLE_OAUTH_IOS_CLIENT_ID is required on iOS (iOS OAuth client type).',
    );
  }

  if (Platform.OS === 'android') {
    const androidClientId = (__DEV__
      ? OAUTH_CONFIG.googleAndroidClientIdDebug
      : OAUTH_CONFIG.googleAndroidClientIdRelease
    ).trim();
    if (androidClientId) {
      return androidClientId;
    }
    throw new Error(
      'GOOGLE_OAUTH_ANDROID_CLIENT_ID_FOR_DEBUG/RELEASE is required on Android.',
    );
  }

  const webClientId = OAUTH_CONFIG.googleWebClientId.trim();
  if (webClientId) {
    return webClientId;
  }
  throw new Error('Google OAuth client ID is not configured.');
}

/**
 * Google redirect_uri (Android/iOS OAuth 클라이언트 역방향 DNS)
 * `com.googleusercontent.apps.{CLIENT_ID}:/oauth2redirect`
 */
export function buildGoogleRedirectUri(): string {
  const reversedScheme = reversedGoogleClientIdScheme(resolveGoogleOAuthClientId());
  if (!reversedScheme) {
    throw new Error('Google OAuth client ID is not configured.');
  }
  return `${reversedScheme}:${GOOGLE_OAUTH_REDIRECT_PATH}`;
}

/**
 * Kakao redirect_uri
 * `kakao{NATIVE_APP_KEY}://oauth`
 */
export function buildKakaoRedirectUri(): string {
  const nativeKey = OAUTH_CONFIG.kakaoNativeAppKey.trim();
  if (!nativeKey) {
    throw new Error('Kakao native app key is not configured.');
  }
  return `kakao${nativeKey}://oauth`;
}

export function buildOAuthRedirectUri(provider: PkceOAuthProvider): string {
  if (provider === 'kakao') {
    return buildKakaoRedirectUri();
  }
  return buildGoogleRedirectUri();
}

/** AndroidManifest·Info.plist에 등록할 Google reversed scheme 목록 */
export function listGoogleOAuthRedirectSchemes(): string[] {
  const clientIds = [
    OAUTH_CONFIG.googleAndroidClientIdDebug,
    OAUTH_CONFIG.googleAndroidClientIdRelease,
    OAUTH_CONFIG.googleIosClientId,
  ];
  const schemes = clientIds
    .map(id => reversedGoogleClientIdScheme(id.trim()))
    .filter((scheme): scheme is string => Boolean(scheme));
  return [...new Set(schemes)];
}
