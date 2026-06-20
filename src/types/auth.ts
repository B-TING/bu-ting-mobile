export type OAuthProvider = 'google' | 'kakao' | 'naver';

export type AuthUser = {
  userId: string;
  email: string | null;
  providerId: string;
  nickname: string | null;
  provider: OAuthProvider;
};

export type OAuthLoginRequest = {
  provider: OAuthProvider;
  /** Google/Kakao: authorization code. Naver: `code=...&state=...` */
  providerToken: string;
  redirectUri: string;
  codeVerifier: string;
};

export type OAuthLoginResponse = {
  accessToken: string;
  user?: AuthUser;
};

export type ApiEnvelope<T> = {
  data: T;
  success?: boolean;
  message?: string;
};
