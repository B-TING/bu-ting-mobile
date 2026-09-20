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
  /** 액세스 토큰 재발급용. 서버가 회전시키므로 재발급 때마다 새 값으로 저장해야 합니다. */
  refreshToken?: string;
  refreshExpiresIn?: number;
};

/** `POST /auth/refresh` 응답. 리프레시도 함께 갈립니다. */
export type TokenRefreshResponse = {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  refreshToken: string;
  refreshExpiresIn: number;
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
