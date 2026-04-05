/**
 * Root Layout - Facil Inspeccion
 *
 * Provider hierarchy: GestureHandler -> QueryClient -> Theme -> Auth -> SplashGate -> AppLock -> Router
 */

import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';

import { ThemeProvider } from '@core/theme';
import { AuthProvider } from '@core/auth/auth-provider';
import { AppLockProvider } from '@core/security/app-lock';
import { useAuth } from '@core/hooks/use-auth';
import { secureStorage } from '@core/storage/mmkv';
import { ErrorBoundary } from '@components/ui/error-boundary';
import { NetworkBanner } from '@components/ui/network-banner';
import { useScreenProtection } from '@core/security/use-screen-protection';
import '@core/i18n';

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 2 * 60 * 1_000,
      gcTime: 10 * 60 * 1_000,
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

function SplashGate({ children }: { children: React.ReactNode }) {
  const { isLoading } = useAuth();
  const [storageReady, setStorageReady] = React.useState(false);

  // Prevent screenshots/screen recording in production builds
  useScreenProtection();

  useEffect(() => {
    // Secure MMKV storage with device-unique key before anything else
    secureStorage().finally(() => setStorageReady(true));
  }, []);

  useEffect(() => {
    if (!isLoading && storageReady) {
      SplashScreen.hideAsync();
    }
  }, [isLoading, storageReady]);

  return <>{children}</>;
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <AuthProvider>
            <SplashGate>
              <AppLockProvider>
                <ErrorBoundary>
                  <StatusBar style="auto" />
                  <NetworkBanner />
                  <Stack screenOptions={{ headerShown: false }}>
                    <Stack.Screen name="(auth)" />
                    <Stack.Screen name="(tabs)" />
                    <Stack.Screen name="inspection" options={{ presentation: 'modal' }} />
                    <Stack.Screen name="supervisor" options={{ presentation: 'modal' }} />
                  </Stack>
                </ErrorBoundary>
              </AppLockProvider>
            </SplashGate>
          </AuthProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
