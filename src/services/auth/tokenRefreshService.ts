import { API_BASE_URL, AUTH_ENDPOINTS } from '../../constants/api/apiConfig';
import {
  selectReusableRefreshToken,
  useAuthStore,
} from '../../stores/useAuthStore';
import type { TokenRefreshResponse } from '../../types/auth';
import { logAuth } from '../../utils/auth/authLogger';
import { apiPost } from '../api/apiClient';

/**
 * 동시에 여러 요청이 401을 받아도 재발급은 한 번만 돈다.
 *
 * 서버가 리프레시를 회전시키므로, 각자 재발급을 부르면 먼저 성공한 쪽이 나머지의 토큰을 무효화한다.
 * 진행 중인 약속을 공유해 그 결과를 함께 쓴다.
 */
let inFlight: Promise<string | null> | null = null;

/**
 * 저장된 리프레시 토큰으로 액세스 토큰을 다시 받는다.
 *
 * @returns 새 액세스 토큰. 재발급할 수 없으면 null이며, 이때 세션은 비워진다.
 */
export function refreshAccessToken(): Promise<string | null> {
  if (inFlight) {
    return inFlight;
  }

  inFlight = requestRefresh().finally(() => {
    inFlight = null;
  });

  return inFlight;
}

async function requestRefresh(): Promise<string | null> {
  const refreshToken = selectReusableRefreshToken(useAuthStore.getState());

  if (!refreshToken) {
    logAuth('token.refresh', 'No reusable refresh token; session cleared.');
    useAuthStore.getState().clearSession();
    return null;
  }

  try {
    const data = await apiPost<TokenRefreshResponse>(
      `${API_BASE_URL}${AUTH_ENDPOINTS.refresh}`,
      {
        body: { refreshToken },
        // 재발급이 401이면 다시 재발급을 부르는 무한 루프가 된다.
        retryOnUnauthorized: false,
        errorMessagePrefix: 'Token refresh failed',
      },
    );

    if (!data?.accessToken || !data?.refreshToken) {
      throw new Error('Invalid token refresh response.');
    }

    // 회전된 리프레시까지 저장해야 다음 재발급이 통과한다.
    useAuthStore.getState().setTokens({
      accessToken: data.accessToken,
      expiresIn: data.expiresIn,
      refreshToken: data.refreshToken,
      refreshExpiresIn: data.refreshExpiresIn,
    });

    logAuth('token.refresh', 'Access token refreshed.');
    return data.accessToken;
  } catch (error) {
    logAuth('token.refresh', 'Token refresh failed; session cleared.', {
      level: 'warn',
      detail: { message: error instanceof Error ? error.message : String(error) },
    });
    useAuthStore.getState().clearSession();
    return null;
  }
}

/** 테스트에서 진행 중인 재발급 상태를 초기화한다. */
export function resetTokenRefreshForTests(): void {
  inFlight = null;
}
