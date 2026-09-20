jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(() => Promise.resolve()),
  getItem: jest.fn(() => Promise.resolve(null)),
  removeItem: jest.fn(() => Promise.resolve()),
  multiGet: jest.fn(() => Promise.resolve([])),
  multiSet: jest.fn(() => Promise.resolve()),
  multiRemove: jest.fn(() => Promise.resolve()),
  getAllKeys: jest.fn(() => Promise.resolve([])),
  clear: jest.fn(() => Promise.resolve()),
}));

import {
  refreshAccessToken,
  resetTokenRefreshForTests,
} from '../src/services/auth/tokenRefreshService';
import { useAuthStore } from '../src/stores/useAuthStore';

const HOUR_MS = 60 * 60 * 1000;

function seedSession(refreshToken: string | null) {
  useAuthStore.setState({
    accessToken: 'expired-access',
    accessTokenExpiresAt: Date.now() - 1000,
    refreshToken,
    refreshTokenExpiresAt: refreshToken ? Date.now() + HOUR_MS : null,
    user: {
      userId: 'user-1',
      email: 'user@example.com',
      nickname: '테스터',
      provider: 'google',
    },
    rememberMe: true,
    provider: 'google',
    providerToken: null,
    _hasHydrated: true,
  });
}

function okResponse(accessToken: string, refreshToken: string) {
  return {
    ok: true,
    status: 200,
    json: async () => ({
      success: true,
      message: 'Token refreshed.',
      data: {
        accessToken,
        tokenType: 'Bearer',
        expiresIn: 3600,
        refreshToken,
        refreshExpiresIn: 2592000,
      },
    }),
  } as unknown as Response;
}

describe('refreshAccessToken', () => {
  beforeEach(() => {
    resetTokenRefreshForTests();
    jest.restoreAllMocks();
  });

  it('새 액세스 토큰과 회전된 리프레시 토큰을 저장한다', async () => {
    seedSession('refresh-1');
    const fetchSpy = jest
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(okResponse('access-2', 'refresh-2'));

    await expect(refreshAccessToken()).resolves.toBe('access-2');

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const state = useAuthStore.getState();
    expect(state.accessToken).toBe('access-2');
    // 회전된 리프레시를 저장하지 않으면 다음 재발급이 401이 된다.
    expect(state.refreshToken).toBe('refresh-2');
  });

  it('동시에 여러 번 불러도 재발급 요청은 한 번만 나간다', async () => {
    seedSession('refresh-1');
    const fetchSpy = jest
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(okResponse('access-2', 'refresh-2'));

    const results = await Promise.all([
      refreshAccessToken(),
      refreshAccessToken(),
      refreshAccessToken(),
    ]);

    // 각자 재발급을 부르면 먼저 성공한 쪽이 나머지 토큰을 무효화한다.
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(results).toEqual(['access-2', 'access-2', 'access-2']);
  });

  it('리프레시 토큰이 없으면 요청하지 않고 세션을 비운다', async () => {
    seedSession(null);
    const fetchSpy = jest.spyOn(globalThis, 'fetch');

    await expect(refreshAccessToken()).resolves.toBeNull();

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(useAuthStore.getState().accessToken).toBeNull();
  });

  it('재발급이 실패하면 세션을 비운다', async () => {
    seedSession('refresh-1');
    jest.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ message: 'Unauthorized' }),
    } as unknown as Response);

    await expect(refreshAccessToken()).resolves.toBeNull();

    expect(useAuthStore.getState().accessToken).toBeNull();
    expect(useAuthStore.getState().refreshToken).toBeNull();
  });
});
