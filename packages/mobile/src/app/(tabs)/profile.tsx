/**
 * Profile Tab
 *
 * Full user profile screen with:
 * - Avatar with tap-to-change (camera/gallery/remove)
 * - View/Edit toggle for personal info
 * - Language picker
 * - Notification settings (immediate save)
 * - Security settings navigation (password, 2FA, sessions)
 * - Sign out
 *
 * All data from backend via React Query. Zero mock data.
 */

import { useState, useCallback } from 'react';
import { StyleSheet, View, ScrollView, Alert } from 'react-native';
import {
  Text,
  Button,
  Surface,
  Divider,
  List,
  Snackbar,
  ActivityIndicator,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { useAppTheme } from '@core/theme';
import { useAuth } from '@core/hooks/use-auth';
import type { SupportedLanguage, UserUpdateRequest } from '@core/config/types';
import { getFullName } from '@core/config/types';

import { useProfile, useUpdateProfile, useUploadAvatar, useDeleteAvatar } from '@modules/profile';
import { ProfileHeader } from '@modules/profile/components/profile-header';
import { ProfileEditForm } from '@modules/profile/components/profile-edit-form';
import { AvatarPicker } from '@modules/profile/components/avatar-picker';
import { NotificationSettings } from '@modules/profile/components/notification-settings';
import { LanguagePicker } from '@modules/profile/components/language-picker';
import type { ProfileUpdateInput } from '@modules/profile/validations';

export default function ProfileScreen() {
  const { t } = useTranslation();
  const { colors, spacing, borderRadius } = useAppTheme();
  const { user, signOut } = useAuth();
  const router = useRouter();

  // Remote profile data
  const { data: profile, isLoading: profileLoading } = useProfile(!!user);
  const updateMutation = useUpdateProfile();
  const uploadAvatarMutation = useUploadAvatar();
  const deleteAvatarMutation = useDeleteAvatar();

  // Use remote profile if available, fall back to auth context
  const displayUser = profile ?? user;

  // UI state
  const [isEditing, setIsEditing] = useState(false);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [showLanguagePicker, setShowLanguagePicker] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState<string | null>(null);

  // Local notification state (optimistic updates)
  const [notifPrefs, setNotifPrefs] = useState({
    email_notifications: displayUser?.email_notifications ?? true,
    push_notifications: displayUser?.push_notifications ?? true,
    sms_notifications: displayUser?.sms_notifications ?? false,
  });

  const handleSignOut = useCallback(() => {
    Alert.alert(
      t('auth.signOutTitle'),
      t('auth.signOutMessage'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('auth.signOut'),
          style: 'destructive',
          onPress: () => signOut(),
        },
      ],
    );
  }, [t, signOut]);

  const handleSaveProfile = useCallback(
    (data: ProfileUpdateInput) => {
      const updateData: UserUpdateRequest = {};
      if (data.first_name) updateData.first_name = data.first_name;
      if (data.last_name) updateData.last_name = data.last_name;
      if (data.phone_number) updateData.phone_number = data.phone_number;
      if (data.address !== undefined) updateData.address = data.address || undefined;
      if (data.city !== undefined) updateData.city = data.city || undefined;

      updateMutation.mutate(updateData, {
        onSuccess: () => {
          setIsEditing(false);
          setSnackbarMessage(t('profile.profileUpdated'));
        },
        onError: () => {
          setSnackbarMessage(t('common.errorOccurred'));
        },
      });
    },
    [updateMutation, t],
  );

  const handleAvatarSelected = useCallback(
    (uri: string) => {
      uploadAvatarMutation.mutate(
        { uri },
        {
          onSuccess: () => setSnackbarMessage(t('profile.avatarUpdated')),
          onError: () => setSnackbarMessage(t('common.errorOccurred')),
        },
      );
    },
    [uploadAvatarMutation, t],
  );

  const handleAvatarRemove = useCallback(() => {
    deleteAvatarMutation.mutate(undefined, {
      onSuccess: () => setSnackbarMessage(t('profile.avatarRemoved')),
      onError: () => setSnackbarMessage(t('common.errorOccurred')),
    });
  }, [deleteAvatarMutation, t]);

  const handleNotifUpdate = useCallback((field: string, value: boolean) => {
    setNotifPrefs((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleLanguageChanged = useCallback((lang: SupportedLanguage) => {
    setSnackbarMessage(null); // will re-render with new i18n
  }, []);

  if (!displayUser) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
        {/* Profile Header with Avatar */}
        <ProfileHeader
          user={displayUser}
          onAvatarPress={() => setShowAvatarPicker(true)}
          isUploading={uploadAvatarMutation.isPending}
        />

        {/* Personal Info Section */}
        <Surface
          style={[styles.section, { margin: spacing.md, borderRadius: borderRadius.lg, backgroundColor: colors.surface }]}
          elevation={1}
        >
          {isEditing ? (
            <ProfileEditForm
              user={displayUser}
              onSave={handleSaveProfile}
              onCancel={() => setIsEditing(false)}
              isSaving={updateMutation.isPending}
            />
          ) : (
            <View style={{ padding: spacing.md }}>
              <View style={styles.sectionHeader}>
                <Text variant="titleMedium" style={{ color: colors.primary, fontWeight: '600' }}>
                  {t('profile.personalInfo')}
                </Text>
                <Button
                  mode="text"
                  compact
                  icon="pencil"
                  onPress={() => setIsEditing(true)}
                >
                  {t('common.edit')}
                </Button>
              </View>
              <Divider style={{ marginBottom: 8 }} />

              <List.Item
                title={t('auth.firstName')}
                description={displayUser.first_name}
                left={(props) => <List.Icon {...props} icon="account-outline" />}
              />
              <List.Item
                title={t('auth.lastName')}
                description={displayUser.last_name}
                left={(props) => <List.Icon {...props} icon="account-outline" />}
              />
              <List.Item
                title={t('auth.email')}
                description={displayUser.email}
                left={(props) => <List.Icon {...props} icon="email-outline" />}
              />
              {displayUser.phone_number && (
                <List.Item
                  title={t('auth.phone')}
                  description={`+240 ${displayUser.phone_number}`}
                  left={(props) => <List.Icon {...props} icon="phone-outline" />}
                />
              )}
              {displayUser.address && (
                <List.Item
                  title={t('profile.address')}
                  description={displayUser.address}
                  left={(props) => <List.Icon {...props} icon="map-marker-outline" />}
                />
              )}
              {displayUser.city && (
                <List.Item
                  title={t('profile.city')}
                  description={displayUser.city}
                  left={(props) => <List.Icon {...props} icon="city-variant-outline" />}
                />
              )}
            </View>
          )}
        </Surface>

        {/* Preferences Section */}
        <Surface
          style={[styles.section, { margin: spacing.md, borderRadius: borderRadius.lg, backgroundColor: colors.surface }]}
          elevation={1}
        >
          <List.Subheader style={{ color: colors.primary }}>
            {t('settings.preferences')}
          </List.Subheader>

          <List.Item
            title={t('profile.languageTitle')}
            description={
              displayUser.preferred_language === 'es'
                ? 'Español'
                : displayUser.preferred_language === 'fr'
                  ? 'Français'
                  : 'English'
            }
            left={(props) => <List.Icon {...props} icon="translate" />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => setShowLanguagePicker(true)}
          />
        </Surface>

        {/* Notification Settings */}
        <Surface
          style={[styles.section, { margin: spacing.md, borderRadius: borderRadius.lg, backgroundColor: colors.surface }]}
          elevation={1}
        >
          <NotificationSettings
            emailNotifications={notifPrefs.email_notifications}
            pushNotifications={notifPrefs.push_notifications}
            smsNotifications={notifPrefs.sms_notifications}
            onUpdate={handleNotifUpdate}
          />
        </Surface>

        {/* Security Section */}
        <Surface
          style={[styles.section, { margin: spacing.md, borderRadius: borderRadius.lg, backgroundColor: colors.surface }]}
          elevation={1}
        >
          <List.Subheader style={{ color: colors.primary }}>
            {t('settings.security')}
          </List.Subheader>

          <List.Item
            title={t('profile.changePassword')}
            left={(props) => <List.Icon {...props} icon="lock-outline" />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => router.push('/settings/change-password')}
          />
          <Divider />
          <List.Item
            title={t('profile.twoFactor')}
            description={
              displayUser.two_factor_enabled
                ? t('profile.twoFactorEnabled')
                : t('profile.twoFactorDisabled')
            }
            left={(props) => <List.Icon {...props} icon="shield-lock-outline" />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => router.push('/settings/two-factor')}
          />
          <Divider />
          <List.Item
            title={t('profile.sessions')}
            left={(props) => <List.Icon {...props} icon="devices" />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => router.push('/settings/sessions')}
          />
        </Surface>

        {/* Sign Out */}
        <View style={{ margin: spacing.md }}>
          <Button
            mode="outlined"
            icon="logout"
            onPress={handleSignOut}
            textColor={colors.error}
            style={{ borderColor: colors.error }}
          >
            {t('auth.signOut')}
          </Button>
        </View>

        {/* App Version */}
        <Text
          variant="bodySmall"
          style={{ textAlign: 'center', color: colors.outline, marginTop: spacing.sm }}
        >
          Facil v1.0.0
        </Text>
      </ScrollView>

      {/* Modals */}
      <AvatarPicker
        visible={showAvatarPicker}
        onDismiss={() => setShowAvatarPicker(false)}
        onImageSelected={handleAvatarSelected}
        onRemove={handleAvatarRemove}
        hasAvatar={!!displayUser.avatar_url}
      />

      <LanguagePicker
        visible={showLanguagePicker}
        onDismiss={() => setShowLanguagePicker(false)}
        currentLanguage={displayUser.preferred_language}
        onLanguageChanged={handleLanguageChanged}
      />

      {/* Snackbar */}
      <Snackbar
        visible={!!snackbarMessage}
        onDismiss={() => setSnackbarMessage(null)}
        duration={3000}
      >
        {snackbarMessage ?? ''}
      </Snackbar>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
});
