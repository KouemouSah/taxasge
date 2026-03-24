/**
 * Root Layout — Facil Mobile
 *
 * Wraps the entire app with required providers:
 * - GestureHandlerRootView (gesture support for bottom sheets, swipes)
 * - QueryClientProvider (TanStack Query for server state)
 * - ThemeProvider (MD3 + custom tokens)
 * - AuthProvider (JWT auth state)
 *
 * Splash screen stays visible until auth bootstrap completes (isLoading = false).
 */

import { useEffect } from 'react';
import { LogBox } from 'react-native';
import { Stack } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';

import { ThemeProvider } from '@core/theme';
import { AuthProvider } from '@core/auth/auth-provider';
import { useAuth } from '@core/hooks/use-auth';
import { ErrorBoundary } from '@components/ui/error-boundary';
import '@core/i18n';

// Suppress known React 19 + New Architecture internal warnings
// These are React internals, not actionable — https://github.com/facebook/react/issues/28839
LogBox.ignoreLogs([
  'Internal React error: Expected static flag was missing',
]);

// Keep splash screen visible while providers initialize
SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 2 * 60 * 1000, // 2 min
      gcTime: 10 * 60 * 1000, // 10 min
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

/**
 * Inner navigator component that has access to AuthContext.
 * Hides the splash screen only after auth bootstrap finishes.
 */
function RootNavigator() {
  const { isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      SplashScreen.hideAsync();
    }
  }, [isLoading]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="+not-found" />
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen
        name="wizard"
        options={{ presentation: 'fullScreenModal' }}
      />
      <Stack.Screen name="settings" />
      <Stack.Screen name="support" />
      <Stack.Screen name="calculator/index" />
      <Stack.Screen name="calculator/history" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <AuthProvider>
            <ErrorBoundary>
              <StatusBar style="auto" />
              <RootNavigator />
            </ErrorBoundary>
          </AuthProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
