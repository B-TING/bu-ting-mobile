import { Linking } from 'react-native';

import { OAUTH_AUTHORIZE_URL, OAUTH_CLIENT_CONFIG } from '../../constants/api/apiConfig';
import type { OAuthProvider } from '../../types/auth';
import {
  buildOAuthRedirectUri,
  isPkceOAuthProvider,
  resolveGoogleOAuthClientId,
  type PkceOAuthProvider,
} from './oauthRedirectUri';
import { generateCodeChallenge, generateCodeVerifier } from './pkce';
import { clearOAuthSession, saveOAuthSession } from './oauthSession';

export class ProviderOAuthFlowError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ProviderOAuthFlowError';
  }
}

const OAUTH_TIMEOUT_MS = 120_000;

export type ProviderAuthorizationCodeResult = {
  provider: PkceOAuthProvider;
  providerToken: string;
  redirectUri: string;
  codeVerifier: string;
};

function parseRedirectQuery(url: string): URLSearchParams {
  const queryStart = url.indexOf('?');
  if (queryStart === -1) {
    return new URLSearchParams();
  }
  return new URLSearchParams(url.slice(queryStart + 1));
}

function parseAuthorizationCode(url: string): string | null {
  return parseRedirectQuery(url).get('code');
}

async function waitForOAuthRedirect(
  redirectUri: string,
  expectedState: string,
): Promise<string> {
  const redirectPrefix = redirectUri.split('?')[0];

  return new Promise((resolve, reject) => {
    let settled = false;

    const finish = (callback: () => void) => {
      if (settled) {
        return;
      }
      settled = true;
      subscription.remove();
      clearTimeout(timer);
      callback();
    };

    const handleUrl = (url: string | null | undefined) => {
      if (!url || !url.startsWith(redirectPrefix)) {
        return;
      }

      const params = parseRedirectQuery(url);
      const returnedState = params.get('state');
      if (returnedState !== expectedState) {
        finish(() => reject(new ProviderOAuthFlowError('OAuth state mismatch.')));
        return;
      }

      const error = params.get('error');
      if (error) {
        const description = params.get('error_description');
        finish(() =>
          reject(
            new ProviderOAuthFlowError(
              description ? `${error}: ${description}` : `OAuth error: ${error}`,
            ),
          ),
        );
        return;
      }

      finish(() => resolve(url));
    };

    const subscription = Linking.addEventListener('url', event => {
      handleUrl(event.url);
    });

    const timer = setTimeout(() => {
      finish(() => reject(new ProviderOAuthFlowError('OAuth sign-in timed out.')));
    }, OAUTH_TIMEOUT_MS);

    Linking.getInitialURL()
      .then(handleUrl)
      .catch(() => undefined);
  });
}

function resolveAuthorizeClientId(provider: PkceOAuthProvider): string {
  if (provider === 'google') {
    return resolveGoogleOAuthClientId();
  }
  const { clientId } = OAUTH_CLIENT_CONFIG[provider];
  if (!clientId) {
    throw new ProviderOAuthFlowError(`${provider} OAuth client ID is not configured.`);
  }
  return clientId;
}

function buildAuthorizeUrl(
  provider: PkceOAuthProvider,
  redirectUri: string,
  codeChallenge: string,
  state: string,
): string {
  const clientId = resolveAuthorizeClientId(provider);
  const scope = OAUTH_CLIENT_CONFIG[provider].scope;

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    state,
  });

  if (provider === 'google') {
    params.set('scope', scope);
    params.set('code_challenge', codeChallenge);
    params.set('code_challenge_method', 'S256');
  } else {
    params.set('scope', scope.replace(/\s+/g, ','));
  }

  return `${OAUTH_AUTHORIZE_URL[provider]}?${params.toString()}`;
}

export async function signInWithProviderAuthorizationCode(
  provider: OAuthProvider,
): Promise<ProviderAuthorizationCodeResult> {
  if (!isPkceOAuthProvider(provider)) {
    throw new ProviderOAuthFlowError(`Provider does not use authorization code flow: ${provider}`);
  }

  const redirectUri = buildOAuthRedirectUri(provider);
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = await generateCodeChallenge(codeVerifier);
  const state = generateCodeVerifier();

  await saveOAuthSession({ codeVerifier, state });

  const authUrl = buildAuthorizeUrl(provider, redirectUri, codeChallenge, state);

  try {
    const redirectPromise = waitForOAuthRedirect(redirectUri, state);
    await Linking.openURL(authUrl);
    const redirectUrl = await redirectPromise;

    const code = parseAuthorizationCode(redirectUrl);
    if (!code) {
      throw new ProviderOAuthFlowError('Authorization code missing from redirect.');
    }

    return {
      provider,
      providerToken: code,
      redirectUri,
      codeVerifier,
    };
  } catch (error) {
    await clearOAuthSession();
    throw error;
  }
}
