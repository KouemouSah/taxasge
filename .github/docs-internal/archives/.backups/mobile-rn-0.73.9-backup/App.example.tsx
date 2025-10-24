/**
 * TaxasGE Mobile - App Example
 * Exemple d'intégration avec DatabaseProvider et SyncProvider
 *
 * USAGE:
 * 1. Copier ce fichier vers App.tsx (ou App.js)
 * 2. Adapter selon vos besoins (navigation, auth, etc.)
 * 3. npm run android ou npm run ios
 */

import React from 'react';
import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  useColorScheme,
} from 'react-native';

// Providers
import {DatabaseProvider} from './src/providers/DatabaseProvider';
import {SyncProvider} from './src/providers/SyncProvider';

// Navigation (à adapter selon votre router)
import {NavigationContainer} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';

// Screens (examples - adapter selon vos screens)
import HomeScreen from './src/screens/HomeScreen';
import ServicesListScreen from './src/screens/ServicesListScreen';
import ServiceDetailScreen from './src/screens/ServiceDetailScreen';

const Stack = createStackNavigator();

function App(): React.JSX.Element {
  const isDarkMode = useColorScheme() === 'dark';

  const backgroundStyle = {
    backgroundColor: isDarkMode ? '#000000' : '#FFFFFF',
    flex: 1,
  };

  return (
    <SafeAreaView style={backgroundStyle}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={backgroundStyle.backgroundColor}
      />

      {/*
        DatabaseProvider: Initialise SQLite au démarrage
        - autoSync=true: Sync automatique si DB vide
        - onInitialized: Callback après init réussie
        - onError: Callback si erreur init
      */}
      <DatabaseProvider
        autoSync={true}
        onInitialized={() => {
          console.log('[App] Database initialized successfully');
        }}
        onError={(error) => {
          console.error('[App] Database initialization failed:', error);
        }}
      >
        {/*
          SyncProvider: Gère sync automatique et statut online/offline
          - autoSyncInterval: Sync toutes les 6h (360 min)
          - onSyncComplete: Callback après sync réussie
        */}
        <SyncProvider
          autoSyncInterval={360}
          onSyncComplete={() => {
            console.log('[App] Sync completed');
          }}
          onError={(error) => {
            console.error('[App] Sync error:', error);
          }}
        >
          {/* Navigation */}
          <NavigationContainer>
            <Stack.Navigator
              initialRouteName="Home"
              screenOptions={{
                headerStyle: {
                  backgroundColor: '#007AFF',
                },
                headerTintColor: '#FFFFFF',
                headerTitleStyle: {
                  fontWeight: 'bold',
                },
              }}
            >
              <Stack.Screen
                name="Home"
                component={HomeScreen}
                options={{title: 'TaxasGE'}}
              />
              <Stack.Screen
                name="ServicesList"
                component={ServicesListScreen}
                options={{title: 'Services Fiscaux'}}
              />
              <Stack.Screen
                name="ServiceDetail"
                component={ServiceDetailScreen}
                options={{title: 'Détails Service'}}
              />
            </Stack.Navigator>
          </NavigationContainer>
        </SyncProvider>
      </DatabaseProvider>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // Styles additionnels si nécessaire
});

export default App;
