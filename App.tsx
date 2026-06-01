import { StatusBar, useColorScheme, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AppErrorBoundary } from './src/components/AppErrorBoundary';
import { layout } from './src/constants/layout';
import { RootNavigator } from './src/navigation/RootNavigator';

function App() {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <View style={layout.screen}>
      <SafeAreaProvider>
        <AppErrorBoundary>
          <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
          <RootNavigator />
        </AppErrorBoundary>
      </SafeAreaProvider>
    </View>
  );
}

export default App;
