/**
 * Payment Result Screen
 *
 * Deep link handler for BANGE payment return.
 * The BANGE Mobile Money redirect URL points here after payment.
 *
 * URL pattern: facil://wizard/payment-result?session_id=...&status=...
 *
 * TODO: Wire up to verify payment status via
 *       GET /wizard-sessions/{sessionId}/payment-status
 */

import { useEffect, useState } from 'react';
import { StyleSheet, View, ActivityIndicator } from 'react-native';
import { Text, Button, Surface } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useAppTheme } from '@core/theme';

export default function PaymentResultScreen() {
  const params = useLocalSearchParams<{
    session_id?: string;
    status?: string;
  }>();
  const router = useRouter();
  const { t } = useTranslation();
  const { colors, spacing, borderRadius } = useAppTheme();

  const [isVerifying, setIsVerifying] = useState(true);
  const [paymentStatus, setPaymentStatus] = useState<'success' | 'failed' | 'pending'>('pending');

  useEffect(() => {
    // TODO: Verify payment with backend
    const timer = setTimeout(() => {
      setIsVerifying(false);
      setPaymentStatus(params.status === 'success' ? 'success' : 'pending');
    }, 2000);
    return () => clearTimeout(timer);
  }, [params.status]);

  const statusConfig = {
    success: {
      icon: 'check-circle-outline' as const,
      color: colors.success,
      label: t('payment.status.completed'),
    },
    failed: {
      icon: 'close-circle-outline' as const,
      color: colors.error,
      label: t('payment.status.failed'),
    },
    pending: {
      icon: 'clock-outline' as const,
      color: colors.warning,
      label: t('payment.status.processing'),
    },
  };

  const config = statusConfig[paymentStatus];

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <View style={[styles.content, { padding: spacing.lg }]}>
        {isVerifying ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text
              variant="bodyLarge"
              style={[
                styles.loadingText,
                { color: colors.onSurfaceVariant, marginTop: spacing.md },
              ]}
            >
              {t('payment.status.processing')}...
            </Text>
          </View>
        ) : (
          <Surface
            style={[
              styles.resultCard,
              {
                padding: spacing.xl,
                borderRadius: borderRadius.lg,
                backgroundColor: colors.surface,
              },
            ]}
            elevation={1}
          >
            <MaterialCommunityIcons
              name={config.icon}
              size={80}
              color={config.color}
            />
            <Text
              variant="headlineSmall"
              style={[
                styles.statusLabel,
                { color: colors.onSurface, marginTop: spacing.md },
              ]}
            >
              {config.label}
            </Text>
            {params.session_id && (
              <Text
                variant="bodySmall"
                style={{ color: colors.outline, marginTop: spacing.sm }}
              >
                Session: {params.session_id}
              </Text>
            )}
            <Button
              mode="contained"
              onPress={() => router.replace('/(tabs)/requests')}
              style={{ marginTop: spacing.xl }}
              icon="arrow-right"
            >
              {t('requests.title')}
            </Button>
          </Surface>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    alignItems: 'center',
  },
  loadingText: {
    textAlign: 'center',
  },
  resultCard: {
    alignItems: 'center',
    width: '100%',
  },
  statusLabel: {
    fontWeight: '700',
    textAlign: 'center',
  },
});
