export type OAuthProvider = 'google' | 'kakao' | 'naver';

export type AuthUser = {
  userId: string;
  email: string;
  nickname: string;
  provider: OAuthProvider;
};

export type OAuthLoginRequest = {
  provider: OAuthProvider;
  /** Google/Kakao: id_token. Naver: access_token (네이티브 SDK) */
  providerToken: string;
};

export type OAuthLoginResponse = {
  userId: string;
  email: string;
  nickname: string;
  provider: OAuthProvider;
  loggedIn: boolean;
  emailRequired: boolean;
  accessToken: string;
  tokenType: string;
  expiresIn: number;
};

export type SignUpRequest = {
  email: string;
  nickname: string;
  provider?: string;
  providerId?: string;
  firstName?: string;
  lastName?: string;
};

export type ApiEnvelope<T> = {
  data: T;
  success?: boolean;
  message?: string;
};

export type ApiErrorResponse = {
  success: boolean;
  message: string;
  data: null;
};
