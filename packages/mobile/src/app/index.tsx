/**
 * Entry Redirect
 *
 * Always redirects to (tabs). The tab layout handles which tabs
 * to show based on authentication state (public vs auth mode).
 */

import { View, ActivityIndicator } from 'react-native';
import { Redirect } from 'expo-router';

import { useAuth } from '@core/hooks/use-auth';
import { useAppTheme } from '@core/theme';

export default function Index() {
  const { isLoading } = useAuth();
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

  return <Redirect href="/(tabs)" />;
}
