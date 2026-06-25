import AsyncStorage from '@react-native-async-storage/async-storage';

const CODE_VERIFIER_KEY = '@buting/oauth/code_verifier';
const STATE_KEY = '@buting/oauth/state';

export type OAuthSession = {
  codeVerifier: string;
  state: string | null;
};

export async function saveOAuthSession(session: OAuthSession): Promise<void> {
  await AsyncStorage.setItem(CODE_VERIFIER_KEY, session.codeVerifier);
  if (session.state) {
    await AsyncStorage.setItem(STATE_KEY, session.state);
  } else {
    await AsyncStorage.removeItem(STATE_KEY);
  }
}

export async function loadOAuthSession(): Promise<OAuthSession | null> {
  const codeVerifier = await AsyncStorage.getItem(CODE_VERIFIER_KEY);
  if (!codeVerifier) {
    return null;
  }

  const state = await AsyncStorage.getItem(STATE_KEY);
  return { codeVerifier, state };
}

export async function clearOAuthSession(): Promise<void> {
  await AsyncStorage.removeItem(CODE_VERIFIER_KEY);
  await AsyncStorage.removeItem(STATE_KEY);
}
