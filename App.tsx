import { StatusBar, useColorScheme, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AppErrorBoundary } from './src/components/shared/layout/AppErrorBoundary';
import { AppAlertProvider } from './src/components/shared/modals';
import { layout } from './src/constants/layout';
import { RootNavigator } from './src/navigation/RootNavigator';

function App() {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <View style={layout.screen}>
      <SafeAreaProvider>
        <AppErrorBoundary>
          <AppAlertProvider>
            <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
            <RootNavigator />
          </AppAlertProvider>
        </AppErrorBoundary>
      </SafeAreaProvider>
    </View>
  );
}

export default App;
