/**
 * @format
 */

import 'react-native-get-random-values';

import { AppRegistry } from 'react-native';

import App from './App';
import { name as appName } from './app.json';

import './global.css';
import { setupPretendardFont } from './src/utils/fonts/setupPretendardFont';

setupPretendardFont();

AppRegistry.registerComponent(appName, () => App);
