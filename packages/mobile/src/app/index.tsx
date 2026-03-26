/**
 * Entry Redirect
 *
 * 1. If first launch → onboarding
 * 2. If auth loading → spinner
 * 3. Otherwise → (tabs)
 */

import { View, ActivityIndicator } from 'react-native';
import { Redirect } from 'expo-router';

import { useAuth } from '@core/hooks/use-auth';
import { useAppTheme } from '@core/theme';
import { storage } from '@core/storage/mmkv';

const ONBOARDING_KEY = 'onboarding_completed';

export default function Index() {
  const { isLoading } = useAuth();
  const { colors } = useAppTheme();

  // Check onboarding flag (sync read from MMKV — instant)
  const onboardingCompleted = storage.getBoolean(ONBOARDING_KEY) ?? false;

  if (!onboardingCompleted) {
    return <Redirect href="/onboarding" />;
  }

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
