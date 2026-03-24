/**
 * Tab Navigator Layout
 *
 * Bottom tab navigator with 5 tabs:
 * 1. Dashboard (home)
 * 2. Services (search)
 * 3. Requests (documents)
 * 4. Chat (AI assistant)
 * 5. Profile (account)
 *
 * Wrapped in AuthGuard to enforce authentication.
 */

import { Tabs } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import { useAppTheme } from '@core/theme';
import { AuthGuard } from '@core/auth/auth-guard';

export default function TabLayout() {
  const { colors } = useAppTheme();
  const { t } = useTranslation();

  return (
    <AuthGuard>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.onSurfaceVariant,
          tabBarStyle: {
            backgroundColor: colors.surface,
            borderTopColor: colors.outlineVariant,
          },
          headerShown: false,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: t('dashboard.title'),
            tabBarIcon: ({ color, size }) => (
              <MaterialCommunityIcons name="home" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="services"
          options={{
            title: t('services.title'),
            tabBarIcon: ({ color, size }) => (
              <MaterialCommunityIcons
                name="magnify"
                size={size}
                color={color}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="requests"
          options={{
            title: t('requests.title'),
            tabBarIcon: ({ color, size }) => (
              <MaterialCommunityIcons
                name="file-document-outline"
                size={size}
                color={color}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="chat"
          options={{
            title: t('chat.title'),
            tabBarIcon: ({ color, size }) => (
              <MaterialCommunityIcons
                name="robot-outline"
                size={size}
                color={color}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: t('profile.title'),
            tabBarIcon: ({ color, size }) => (
              <MaterialCommunityIcons
                name="account-outline"
                size={size}
                color={color}
              />
            ),
          }}
        />
      </Tabs>
    </AuthGuard>
  );
}
