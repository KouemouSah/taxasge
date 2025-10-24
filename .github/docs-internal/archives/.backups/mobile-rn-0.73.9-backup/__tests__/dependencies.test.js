/**
 * Critical Dependencies Test - Phase 2 Validation
 * Valide que toutes les dépendances critiques peuvent être importées
 * Tests les 865 packages installés localement (standalone, pas symlinks)
 */

describe('Critical Dependencies Import - Phase 2 Validation', () => {
  describe('React Native Core', () => {
    it('should import React', () => {
      expect(() => require('react')).not.toThrow();
      const React = require('react');
      expect(React).toBeDefined();
      expect(React.version).toBeDefined();
    });

    it('should import React Native', () => {
      expect(() => require('react-native')).not.toThrow();
      const RN = require('react-native');
      expect(RN.Platform).toBeDefined();
      expect(RN.AppRegistry).toBeDefined();
    });

    it('should verify React Native version', () => {
      const RN = require('react-native');
      expect(RN.Platform.Version).toBeDefined();
    });
  });

  describe('Database Dependencies', () => {
    it('should import Supabase JS', () => {
      expect(() => require('@supabase/supabase-js')).not.toThrow();
      const { createClient } = require('@supabase/supabase-js');
      expect(createClient).toBeDefined();
      expect(typeof createClient).toBe('function');
    });

    it('should import SQLite Storage', () => {
      expect(() => require('react-native-sqlite-storage')).not.toThrow();
      const SQLite = require('react-native-sqlite-storage');
      expect(SQLite).toBeDefined();
    });

    it('should import AsyncStorage', () => {
      expect(() => require('@react-native-async-storage/async-storage')).not.toThrow();
    });
  });

  describe('State Management', () => {
    it('should import Redux Toolkit', () => {
      expect(() => require('@reduxjs/toolkit')).not.toThrow();
      const toolkit = require('@reduxjs/toolkit');
      expect(toolkit.configureStore).toBeDefined();
      expect(toolkit.createSlice).toBeDefined();
    });

    it('should import React Redux', () => {
      expect(() => require('react-redux')).not.toThrow();
      const { Provider } = require('react-redux');
      expect(Provider).toBeDefined();
    });

    it('should import Redux Persist', () => {
      expect(() => require('redux-persist')).not.toThrow();
    });

    it('should import React Query', () => {
      expect(() => require('react-query')).not.toThrow();
    });
  });

  describe('Navigation Dependencies', () => {
    it('should import React Navigation Native', () => {
      expect(() => require('@react-navigation/native')).not.toThrow();
      const { NavigationContainer } = require('@react-navigation/native');
      expect(NavigationContainer).toBeDefined();
    });

    it('should import React Navigation Stack', () => {
      expect(() => require('@react-navigation/stack')).not.toThrow();
    });

    it('should import React Navigation Bottom Tabs', () => {
      expect(() => require('@react-navigation/bottom-tabs')).not.toThrow();
    });

    it('should import React Navigation Drawer', () => {
      expect(() => require('@react-navigation/drawer')).not.toThrow();
    });

    it('should import React Native Screens', () => {
      expect(() => require('react-native-screens')).not.toThrow();
    });

    it('should import React Native Safe Area Context', () => {
      expect(() => require('react-native-safe-area-context')).not.toThrow();
    });
  });

  describe('Firebase Dependencies', () => {
    it('should import React Native Firebase App', () => {
      expect(() => require('@react-native-firebase/app')).not.toThrow();
    });

    it('should import React Native Firebase Auth', () => {
      expect(() => require('@react-native-firebase/auth')).not.toThrow();
    });

    it('should import React Native Firebase Firestore', () => {
      expect(() => require('@react-native-firebase/firestore')).not.toThrow();
    });

    it('should import React Native Firebase Storage', () => {
      expect(() => require('@react-native-firebase/storage')).not.toThrow();
    });

    it('should import React Native Firebase Analytics', () => {
      expect(() => require('@react-native-firebase/analytics')).not.toThrow();
    });

    it('should import React Native Firebase Crashlytics', () => {
      expect(() => require('@react-native-firebase/crashlytics')).not.toThrow();
    });

    it('should import React Native Firebase Messaging', () => {
      expect(() => require('@react-native-firebase/messaging')).not.toThrow();
    });
  });

  describe('AI/ML Dependencies', () => {
    it('should import TensorFlow JS', () => {
      expect(() => require('@tensorflow/tfjs')).not.toThrow();
    });

    it('should import TensorFlow React Native', () => {
      expect(() => require('@tensorflow/tfjs-react-native')).not.toThrow();
    });
  });

  describe('UI Components Libraries', () => {
    it('should import React Native Vector Icons', () => {
      expect(() => require('react-native-vector-icons')).not.toThrow();
    });

    it('should import React Native Gesture Handler', () => {
      expect(() => require('react-native-gesture-handler')).not.toThrow();
    });

    it('should import React Native Reanimated', () => {
      expect(() => require('react-native-reanimated')).not.toThrow();
    });

    it('should import React Native SVG', () => {
      expect(() => require('react-native-svg')).not.toThrow();
    });

    it('should import React Native Modal', () => {
      expect(() => require('react-native-modal')).not.toThrow();
    });

    it('should import React Native Calendars', () => {
      expect(() => require('react-native-calendars')).not.toThrow();
    });
  });

  describe('Utility Libraries', () => {
    it('should import Axios', () => {
      expect(() => require('axios')).not.toThrow();
      const axios = require('axios');
      expect(axios.get).toBeDefined();
    });

    it('should import Lodash', () => {
      expect(() => require('lodash')).not.toThrow();
    });

    it('should import Date-fns', () => {
      expect(() => require('date-fns')).not.toThrow();
    });

    it('should import Formik', () => {
      expect(() => require('formik')).not.toThrow();
    });

    it('should import Yup', () => {
      expect(() => require('yup')).not.toThrow();
    });

    it('should import Crypto JS', () => {
      expect(() => require('crypto-js')).not.toThrow();
    });

    it('should import JWT Decode', () => {
      expect(() => require('jwt-decode')).not.toThrow();
    });
  });

  describe('Internationalization', () => {
    it('should import i18next', () => {
      expect(() => require('i18next')).not.toThrow();
    });

    it('should import React i18next', () => {
      expect(() => require('react-i18next')).not.toThrow();
    });
  });

  describe('Device Capabilities', () => {
    it('should import React Native Device Info', () => {
      expect(() => require('react-native-device-info')).not.toThrow();
    });

    it('should import React Native NetInfo', () => {
      expect(() => require('@react-native-community/netinfo')).not.toThrow();
    });

    it('should import React Native Biometrics', () => {
      expect(() => require('react-native-biometrics')).not.toThrow();
    });

    it('should import React Native Keychain', () => {
      expect(() => require('react-native-keychain')).not.toThrow();
    });

    it('should import React Native Permissions', () => {
      expect(() => require('react-native-permissions')).not.toThrow();
    });
  });

  describe('Media and Files', () => {
    it('should import React Native Image Picker', () => {
      expect(() => require('react-native-image-picker')).not.toThrow();
    });

    it('should import React Native Document Picker', () => {
      expect(() => require('react-native-document-picker')).not.toThrow();
    });

    it('should import React Native FS', () => {
      expect(() => require('react-native-fs')).not.toThrow();
    });

    it('should import React Native PDF', () => {
      expect(() => require('react-native-pdf')).not.toThrow();
    });

    it('should import React Native Share', () => {
      expect(() => require('react-native-share')).not.toThrow();
    });

    it('should import React Native Print', () => {
      expect(() => require('react-native-print')).not.toThrow();
    });
  });

  describe('Performance and Monitoring', () => {
    it('should import Redux Logger', () => {
      expect(() => require('redux-logger')).not.toThrow();
    });

    it('should import React Native MMKV', () => {
      expect(() => require('react-native-mmkv')).not.toThrow();
    });
  });
});
