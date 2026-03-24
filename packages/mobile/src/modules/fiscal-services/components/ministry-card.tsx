/**
 * MinistryCard — Grid card for a government ministry.
 *
 * Shows an icon (mapped from ministry code), the ministry name,
 * and a service count badge.
 */

import { StyleSheet, View } from 'react-native';
import { Card, Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useAppTheme } from '@core/theme';
import type { MinistryItem } from '../types/services.types';

/** Map ministry codes to MaterialCommunityIcons names. */
const MINISTRY_ICONS: Record<string, React.ComponentProps<typeof MaterialCommunityIcons>['name']> = {
  CNEDOGE: 'passport',
  DGT: 'car',
  ONRC: 'file-sign',
  ITVE: 'car-cog',
  HACIENDA: 'cash-register',
  SEGURIDAD: 'shield-account',
};

const DEFAULT_ICON: React.ComponentProps<typeof MaterialCommunityIcons>['name'] = 'office-building';

function getMinistryIcon(code: string): React.ComponentProps<typeof MaterialCommunityIcons>['name'] {
  const upper = code.toUpperCase();
  // Check for partial matches (e.g. "MIN_HACIENDA" contains "HACIENDA")
  for (const [key, icon] of Object.entries(MINISTRY_ICONS)) {
    if (upper.includes(key)) {
      return icon;
    }
  }
  return DEFAULT_ICON;
}

interface MinistryCardProps {
  ministry: MinistryItem;
  onPress: () => void;
}

export function MinistryCard({ ministry, onPress }: MinistryCardProps) {
  const { colors, spacing, borderRadius } = useAppTheme();

  const iconName = getMinistryIcon(ministry.code);

  return (
    <Card
      style={[
        styles.card,
        { borderRadius: borderRadius.md, backgroundColor: colors.surface },
      ]}
      onPress={onPress}
      mode="elevated"
    >
      <Card.Content style={[styles.content, { padding: spacing.md }]}>
        {/* Icon circle */}
        <View
          style={[
            styles.iconCircle,
            {
              backgroundColor: colors.primaryContainer,
              borderRadius: borderRadius.full,
              width: 48,
              height: 48,
              marginBottom: spacing.sm,
            },
          ]}
        >
          <MaterialCommunityIcons
            name={iconName}
            size={24}
            color={colors.primary}
          />
        </View>

        {/* Ministry name */}
        <Text
          variant="titleSmall"
          style={[styles.name, { color: colors.onSurface }]}
          numberOfLines={2}
        >
          {ministry.name_es}
        </Text>

        {/* Service count */}
        {ministry.service_count != null && ministry.service_count > 0 && (
          <Text
            variant="labelSmall"
            style={{ color: colors.onSurfaceVariant, marginTop: spacing.xs }}
          >
            {ministry.service_count} servicio{ministry.service_count !== 1 ? 's' : ''}
          </Text>
        )}
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: 140,
    elevation: 1,
  },
  content: {
    alignItems: 'center',
  },
  iconCircle: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  name: {
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 18,
  },
});
