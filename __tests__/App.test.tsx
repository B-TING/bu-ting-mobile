/**
 * @format
 *
 * App smoke test. RootNavigator pulls native maps/WebView/geolocation, so it is
 * stubbed here — navigator behavior is covered by screen/hook unit tests.
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(async () => null),
  setItem: jest.fn(async () => undefined),
  removeItem: jest.fn(async () => undefined),
  multiRemove: jest.fn(async () => undefined),
}));

jest.mock('../src/navigation/RootNavigator', () => ({
  RootNavigator: () => null,
}));

jest.mock('../src/services/auth/oauthSdkService', () => ({
  initOAuthSdks: jest.fn(),
}));

jest.mock('../src/hooks/useSessionActiveTravelsSync', () => ({
  useSessionActiveTravelsSync: jest.fn(),
}));

import App from '../App';
import { initOAuthSdks } from '../src/services/auth/oauthSdkService';
import { useSessionActiveTravelsSync } from '../src/hooks/useSessionActiveTravelsSync';

test('renders correctly', async () => {
  await ReactTestRenderer.act(async () => {
    ReactTestRenderer.create(<App />);
  });

  expect(initOAuthSdks).toHaveBeenCalled();
  expect(useSessionActiveTravelsSync).toHaveBeenCalled();
});
