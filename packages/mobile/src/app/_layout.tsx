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

import { useTranslation } from 'react-i18next';

import { ThemeProvider } from '@core/theme';
import { AuthProvider } from '@core/auth/auth-provider';
import { useAuth } from '@core/hooks/use-auth';
import { ErrorBoundary } from '@components/ui/error-boundary';
import { AppLockProvider } from '@core/security/app-lock';
import {
  initNotifications,
  getInitialNotificationResponse,
  routeFromPayload,
  type NotificationDataPayload,
} from '@core/notifications';
import { useDeviceTokenRegistration } from '@modules/notifications/hooks/use-device-token-registration';
import { useNotifications } from '@modules/notifications/hooks/use-notifications';
import '@core/i18n';

// Suppress known React 19 + New Architecture internal warnings
// These are React internals, not actionable — https://github.com/facebook/react/issues/28839
LogBox.ignoreLogs([
  'Internal React error: Expected static flag was missing',
  'Each child in a list',
  'Open debugger to view warnings',
  'Unable to activate keep awake',
]);

// Keep splash screen visible while providers initialize
SplashScreen.preventAutoHideAsync();

// Configure notification foreground display + Android channels.
// Idempotent — safe to fire-and-forget at module load.
void initNotifications();

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
 * Prefetch slow catalog data in background AFTER splash is hidden.
 * Delayed 3s to avoid competing with auth bootstrap for network/CPU.
 * Non-blocking, errors silently ignored.
 */
function usePrefetchCatalogs() {
  useEffect(() => {
    const timer = setTimeout(() => {
      const baseUrl = process.env.EXPO_PUBLIC_API_URL;
      if (!baseUrl) return;
      const api = `${baseUrl}/api/v1`;
      // Fire and forget — no await, no blocking
      queryClient.prefetchQuery({
        queryKey: ['bundles', 'commerce-types'],
        queryFn: () => fetch(`${api}/service-bundles/commerce-types`).then(r => r.json()).catch(() => []),
        staleTime: 60 * 60_000,
      });
      queryClient.prefetchQuery({
        queryKey: ['bundles', 'zones'],
        queryFn: () => fetch(`${api}/service-bundles/zones`).then(r => r.json()).catch(() => []),
        staleTime: 60 * 60_000,
      });
    }, 3000); // Delay 3s after mount — let auth bootstrap finish first
    return () => clearTimeout(timer);
  }, []);
}

/**
 * Inner navigator component that has access to AuthContext.
 * Hides the splash screen only after auth bootstrap finishes.
 */
function RootNavigator() {
  const { isLoading, isAuthenticated } = useAuth();
  // Subscribe to language changes so the entire tree re-renders when i18n locale switches
  useTranslation();
  // Prefetch catalog data in background
  usePrefetchCatalogs();
  // Register device token with the backend after auth bootstrap.
  // No-ops while unauthenticated; idempotent on repeat calls.
  useDeviceTokenRegistration();
  // Subscribe to incoming pushes (foreground display + tap routing + MMKV).
  useNotifications();

  useEffect(() => {
    if (!isLoading) {
      SplashScreen.hideAsync();
    }
  }, [isLoading]);

  // Cold-start deep link: if the app was launched by tapping a push, route to
  // the target only AFTER auth bootstrap finishes — earlier and we'd land on
  // /index which would re-redirect away.
  useEffect(() => {
    if (isLoading || !isAuthenticated) return;
    let cancelled = false;
    void (async () => {
      const response = await getInitialNotificationResponse();
      if (cancelled || !response) return;
      const data = response.notification.request.content.data as
        | NotificationDataPayload
        | undefined;
      routeFromPayload(data);
    })();
    return () => {
      cancelled = true;
    };
  }, [isLoading, isAuthenticated]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="onboarding" options={{ animation: 'fade' }} />
      <Stack.Screen name="+not-found" />
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen
        name="wizard"
        options={{ presentation: 'fullScreenModal' }}
      />
      <Stack.Screen name="settings" />
      <Stack.Screen name="support" />
      <Stack.Screen name="notifications" />
      <Stack.Screen name="documents/index" />
      <Stack.Screen name="documents/[id]" />
      <Stack.Screen name="documents/upload" />
      <Stack.Screen name="bundle-wizard" />
      <Stack.Screen name="calculator/index" />
      <Stack.Screen name="calculator/history" />
      <Stack.Screen name="licencias" />
      <Stack.Screen name="directorio" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <AuthProvider>
            <AppLockProvider>
              <ErrorBoundary>
                <StatusBar style="auto" />
                <RootNavigator />
              </ErrorBoundary>
            </AppLockProvider>
          </AuthProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
