/**
 * Entry Redirect
 *
 * Determines the initial route based on authentication state:
 * - Authenticated users → (tabs) dashboard
 * - Unauthenticated users → (auth) sign-in
 * - Loading → centered spinner
 */

import { View, ActivityIndicator } from 'react-native';
import { Redirect } from 'expo-router';

import { useAuth } from '@core/hooks/use-auth';
import { useAppTheme } from '@core/theme';

export default function Index() {
  const { isAuthenticated, isLoading } = useAuth();
  const { colors } = useAppTheme();

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: colors.background,
        }}
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (isAuthenticated) return <Redirect href="/(tabs)" />;
  return <Redirect href="/(auth)/sign-in" />;
}
