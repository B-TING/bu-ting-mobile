import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  clearPendingInviteToken,
  peekPendingInviteToken,
  savePendingInviteToken,
  takePendingInviteToken,
} from '../src/utils/travel/pendingInviteToken';

jest.mock('@react-native-async-storage/async-storage', () => {
  let store: Record<string, string> = {};
  return {
    __esModule: true,
    default: {
      setItem: jest.fn(async (key: string, value: string) => {
        store[key] = value;
      }),
      getItem: jest.fn(async (key: string) => store[key] ?? null),
      removeItem: jest.fn(async (key: string) => {
        delete store[key];
      }),
      clear: jest.fn(async () => {
        store = {};
      }),
    },
  };
});

describe('pendingInviteToken', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    jest.clearAllMocks();
  });

  it('saves and peeks a trimmed token', async () => {
    await savePendingInviteToken('  abc-token  ');
    await expect(peekPendingInviteToken()).resolves.toBe('abc-token');
  });

  it('ignores empty tokens', async () => {
    await savePendingInviteToken('   ');
    await expect(peekPendingInviteToken()).resolves.toBeNull();
  });

  it('take clears storage after read', async () => {
    await savePendingInviteToken('invite-1');
    await expect(takePendingInviteToken()).resolves.toBe('invite-1');
    await expect(peekPendingInviteToken()).resolves.toBeNull();
  });

  it('clear removes pending token', async () => {
    await savePendingInviteToken('invite-2');
    await clearPendingInviteToken();
    await expect(peekPendingInviteToken()).resolves.toBeNull();
  });
});
