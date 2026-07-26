import { useEffect } from 'react';
import { StatusBar, useColorScheme, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AppErrorBoundary } from './src/components/shared/layout/AppErrorBoundary';
import {
  AppAlertProvider,
  FeatureUnavailableAlertProvider,
} from './src/components/shared/modals';
import { layout } from './src/constants/common/layout';
import { RootNavigator } from './src/navigation/RootNavigator';
import { useSessionActiveTravelsSync } from './src/hooks/useSessionActiveTravelsSync';
import { initOAuthSdks } from './src/services/auth/oauthSdkService';

function App() {
  const isDarkMode = useColorScheme() === 'dark';

  useEffect(() => {
    initOAuthSdks();
  }, []);

  useSessionActiveTravelsSync();

  return (
    <View style={layout.screen}>
      <SafeAreaProvider>
        <AppErrorBoundary>
          <AppAlertProvider>
            <FeatureUnavailableAlertProvider>
              <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
              <RootNavigator />
            </FeatureUnavailableAlertProvider>
          </AppAlertProvider>
        </AppErrorBoundary>
      </SafeAreaProvider>
    </View>
  );
}

export default App;
