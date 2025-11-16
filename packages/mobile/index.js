/**
 * TaxasGE Mobile - Application Entry Point
 * @format
 */

// CRITICAL: URL polyfill MUST be imported first for Hermes compatibility
// Fixes "Cannot assign to property 'protocol' which has only a getter" error with Supabase
import 'react-native-url-polyfill/auto';

import { AppRegistry } from 'react-native';
import App from './src/App';
import { name as appName } from './app.json';

AppRegistry.registerComponent(appName, () => App);
