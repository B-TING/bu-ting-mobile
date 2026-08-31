import AsyncStorage from '@react-native-async-storage/async-storage';

const PENDING_INVITE_TOKEN_KEY = '@bu-ting/pending-invite-token';

export async function savePendingInviteToken(token: string): Promise<void> {
  const trimmed = token.trim();
  if (!trimmed) {
    return;
  }
  await AsyncStorage.setItem(PENDING_INVITE_TOKEN_KEY, trimmed);
}

export async function peekPendingInviteToken(): Promise<string | null> {
  const value = await AsyncStorage.getItem(PENDING_INVITE_TOKEN_KEY);
  const trimmed = value?.trim();
  return trimmed || null;
}

export async function clearPendingInviteToken(): Promise<void> {
  await AsyncStorage.removeItem(PENDING_INVITE_TOKEN_KEY);
}

/** 저장된 pending token을 읽고 비웁니다. */
export async function takePendingInviteToken(): Promise<string | null> {
  const token = await peekPendingInviteToken();
  if (token) {
    await clearPendingInviteToken();
  }
  return token;
}
