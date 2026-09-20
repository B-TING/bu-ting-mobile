/**
 * @format
 */

import 'react-native-get-random-values';

import { AppRegistry } from 'react-native';

import App from './App';
import { name as appName } from './app.json';

import './global.css';
import { registerBackgroundMessageHandler } from './src/services/notification/fcmService';
import { setupPretendardFont } from './src/utils/fonts/setupPretendardFont';

setupPretendardFont();
registerBackgroundMessageHandler();

AppRegistry.registerComponent(appName, () => App);
