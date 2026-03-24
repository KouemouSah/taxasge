/**
 * Request Status Badge
 *
 * Colored compact chip displaying the current status of a service request.
 * Maps each status to a visual style using the app theme tokens.
 */

import { StyleSheet } from 'react-native';
import { Chip } from 'react-native-paper';
import { useTranslation } from 'react-i18next';

import { useAppTheme, type AppTheme } from '@core/theme';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface RequestStatusBadgeProps {
  /** Uppercase status string from the backend (e.g. "SUBMITTED", "COMPLETED"). */
  status: string;
}

// ---------------------------------------------------------------------------
// Status → style mapping
// ---------------------------------------------------------------------------

type BadgeStyle = {
  mode: 'flat' | 'outlined';
  backgroundColor: string;
  textColor: string;
};

function resolveBadgeStyle(
  status: string,
  colors: AppTheme['colors'],
): BadgeStyle {
  switch (status.toUpperCase()) {
    case 'DRAFT':
      return {
        mode: 'outlined',
        backgroundColor: 'transparent',
        textColor: colors.outline,
      };

    case 'SUBMITTED':
      return {
        mode: 'flat',
        backgroundColor: colors.tertiaryContainer,
        textColor: colors.onTertiaryContainer,
      };

    case 'UNDER_REVIEW':
    case 'PROCESSING':
      return {
        mode: 'flat',
        backgroundColor: colors.tertiaryContainer,
        textColor: colors.onTertiaryContainer,
      };

    case 'PAYMENT_PENDING':
      return {
        mode: 'flat',
        backgroundColor: colors.tertiaryContainer,
        textColor: colors.onTertiaryContainer,
      };

    case 'PAID':
      return {
        mode: 'flat',
        backgroundColor: colors.primaryContainer,
        textColor: colors.onPrimaryContainer,
      };

    case 'COMPLETED':
      return {
        mode: 'flat',
        backgroundColor: colors.approved,
        textColor: colors.onPrimary,
      };

    case 'REJECTED':
      return {
        mode: 'flat',
        backgroundColor: colors.error,
        textColor: colors.onError,
      };

    case 'CANCELLED':
      return {
        mode: 'outlined',
        backgroundColor: 'transparent',
        textColor: colors.outline,
      };

    default:
      return {
        mode: 'flat',
        backgroundColor: colors.surfaceVariant,
        textColor: colors.onSurfaceVariant,
      };
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function RequestStatusBadge({ status }: RequestStatusBadgeProps) {
  const { colors, borderRadius } = useAppTheme();
  const { t } = useTranslation();

  const style = resolveBadgeStyle(status, colors);
  const i18nKey = `requests.status.${status.toLowerCase()}`;
  const translated = t(i18nKey);
  // If i18n key not found (returns the key itself), humanize the status
  const label = translated === i18nKey
    ? status.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())
    : translated;

  return (
    <Chip
      mode={style.mode}
      compact
      textStyle={[styles.text, { color: style.textColor }]}
      style={[
        styles.chip,
        {
          backgroundColor: style.backgroundColor,
          borderRadius: borderRadius.sm,
          borderColor: style.mode === 'outlined' ? colors.outline : undefined,
        },
      ]}
    >
      {label}
    </Chip>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  chip: {
    alignSelf: 'flex-start',
    height: 26,
    maxWidth: 140,
  },
  text: {
    fontSize: 11,
    fontWeight: '600',
  },
});
