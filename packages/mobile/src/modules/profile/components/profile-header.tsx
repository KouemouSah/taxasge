/**
 * Profile Header
 *
 * Displays avatar (with tap-to-change), full name, email, and role badge.
 */

import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Text, Avatar, Chip, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import type { UserProfile } from '@core/config/types';
import { getFullName } from '@core/config/types';

interface ProfileHeaderProps {
  user: UserProfile;
  onAvatarPress: () => void;
  isUploading?: boolean;
}

export function ProfileHeader({ user, onAvatarPress, isUploading }: ProfileHeaderProps) {
  const theme = useTheme();
  const { t } = useTranslation();

  const fullName = getFullName(user);
  const initials = fullName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <View style={styles.container}>
      <Pressable onPress={onAvatarPress} style={styles.avatarContainer}>
        {user.avatar_url ? (
          <Avatar.Image size={96} source={{ uri: user.avatar_url }} />
        ) : (
          <Avatar.Text
            size={96}
            label={initials}
            style={{ backgroundColor: theme.colors.primaryContainer }}
            labelStyle={{ color: theme.colors.onPrimaryContainer }}
          />
        )}
        <View
          style={[
            styles.cameraOverlay,
            { backgroundColor: theme.colors.primary },
          ]}
        >
          <MaterialCommunityIcons
            name={isUploading ? 'loading' : 'camera'}
            size={16}
            color={theme.colors.onPrimary}
          />
        </View>
      </Pressable>

      <Text variant="headlineSmall" style={[styles.name, { color: theme.colors.onBackground }]}>
        {fullName}
      </Text>
      <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
        {user.email}
      </Text>
      {user.phone_number && (
        <Text variant="bodySmall" style={{ color: theme.colors.outline }}>
          +240 {user.phone_number}
        </Text>
      )}
      <Chip
        compact
        style={[styles.roleBadge, { backgroundColor: theme.colors.secondaryContainer }]}
        textStyle={{ color: theme.colors.onSecondaryContainer, fontSize: 12 }}
      >
        {t(`roles.${user.role_code ?? user.role}`)}
      </Chip>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 4,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  cameraOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  name: {
    fontWeight: '600',
  },
  roleBadge: {
    marginTop: 8,
  },
});
