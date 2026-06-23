export type OAuthProvider = 'google' | 'kakao' | 'naver';

export type AuthUser = {
  userId: string;
  email: string;
  nickname: string;
  provider: OAuthProvider;
};

export type OAuthLoginRequest = {
  provider: OAuthProvider;
  /** Google: id_token 또는 authorization code. Kakao/Naver: access_token 또는 authorization code. */
  providerToken: string;
  /** Authorization code 발급 시 사용한 redirect_uri (access token/id token이면 생략) */
  redirectUri?: string;
  /** PKCE authorization code flow의 code_verifier (access token/id token이면 생략) */
  codeVerifier?: string;
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
