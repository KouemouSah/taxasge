/**
 * Collect Payment Screen — Cash or mobile money in field
 */

import React, { useCallback, useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Divider, RadioButton, Text, TextInput } from 'react-native-paper';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAppTheme } from '@core/theme';
import { extractApiError } from '@core/api/errors';
import { formatCurrency } from '@core/utils/format';
import { appConfig } from '@core/config/app';
import { LoadingScreen } from '@components/ui/loading-screen';
import { useInspectionDetail, useCollectPayment } from '@modules/inspections/services/inspections-hooks';

export default function CollectPaymentScreen() {
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();

  const { data: inspection, isLoading } = useInspectionDetail(id ?? '');
  const collectMutation = useCollectPayment(id ?? '');

  const [method, setMethod] = useState<'cash' | 'mobile_money'>('cash');
  const [amount, setAmount] = useState('');
  const [phone, setPhone] = useState<string>(appConfig.business.phonePrefix);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  if (isLoading || !inspection) return <LoadingScreen />;

  const parsedAmount = Math.round(parseFloat(amount.replace(/[^0-9]/g, '')));

  const handleSubmit = useCallback(() => {
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError(t('payment.invalidAmount'));
      return;
    }
    if (parsedAmount > appConfig.business.maxFieldCollectionAmount) {
      setError(t('payment.maxAmount', { amount: formatCurrency(appConfig.business.maxFieldCollectionAmount) }));
      return;
    }
    if (method === 'mobile_money' && !appConfig.business.phoneRegex.test(phone)) {
      setError(t('payment.invalidPhone'));
      return;
    }

    Alert.alert(
      t('payment.collect'),
      `${t('payment.method')}: ${t(`payment.${method}`)}\n${t('payment.amount')}: ${formatCurrency(parsedAmount)}`,
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('payment.confirm'),
          onPress: async () => {
            try {
              setError('');
              await collectMutation.mutateAsync({
                obligation_ids: [], // Backend handles obligation resolution
                method,
                amount: parsedAmount,
                phone_number: method === 'mobile_money' ? phone : undefined,
                notes: notes.trim() || undefined,
              });
              router.back();
            } catch (err) {
              setError(extractApiError(err).message);
            }
          },
        },
      ],
    );
  }, [parsedAmount, method, phone, notes, collectMutation, t]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 4 }]}>
        <View style={styles.headerRow}>
          <Button icon="arrow-left" onPress={() => router.back()} textColor={colors.primary} compact>
            {t('common.cancel')}
          </Button>
          <Text variant="titleMedium" style={{ color: colors.onBackground, fontWeight: '700' }}>
            {t('payment.collect')}
          </Text>
          <View style={{ width: 60 }} />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Company */}
        <View style={styles.section}>
          <Text variant="titleSmall" style={{ color: colors.onSurface }}>
            {inspection.company_name ?? '—'}
          </Text>
          <Text variant="bodySmall" style={{ color: colors.onSurfaceVariant }}>
            Impago: {formatCurrency(inspection.unpaid_obligations_amount)}
          </Text>
        </View>
        <Divider />

        {/* Payment Method */}
        <View style={styles.section}>
          <Text variant="labelLarge" style={[styles.sectionTitle, { color: colors.onSurfaceVariant }]}>
            {t('payment.method')}
          </Text>
          <RadioButton.Group onValueChange={(v) => setMethod(v as 'cash' | 'mobile_money')} value={method}>
            <RadioButton.Item label={t('payment.cash')} value="cash" mode="android" />
            <RadioButton.Item label={t('payment.mobileMoney')} value="mobile_money" mode="android" />
          </RadioButton.Group>
        </View>
        <Divider />

        {/* Amount */}
        <View style={styles.section}>
          <TextInput
            mode="flat"
            label={`${t('payment.amount')} (XAF)`}
            value={amount}
            onChangeText={setAmount}
            keyboardType="numeric"
            style={{ backgroundColor: 'transparent' }}
          />
        </View>
        <Divider />

        {/* Phone (mobile_money only) */}
        {method === 'mobile_money' && (
          <>
            <View style={styles.section}>
              <TextInput
                mode="flat"
                label={t('payment.phone')}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                maxLength={20}
                style={{ backgroundColor: 'transparent' }}
              />
            </View>
            <Divider />
          </>
        )}

        {/* Notes */}
        <View style={styles.section}>
          <TextInput
            mode="flat"
            label={t('inspection.notes')}
            value={notes}
            onChangeText={setNotes}
            multiline
            maxLength={500}
            style={{ backgroundColor: 'transparent' }}
          />
        </View>

        {error ? (
          <Text variant="bodyMedium" style={{ color: colors.error, paddingHorizontal: 16 }}>{error}</Text>
        ) : null}

        <View style={styles.submitSection}>
          <Button
            mode="contained"
            icon="cash"
            onPress={handleSubmit}
            loading={collectMutation.isPending}
            disabled={collectMutation.isPending || !amount}
            style={styles.submitButton}
            contentStyle={{ paddingVertical: 6 }}
          >
            {t('payment.confirm')} {parsedAmount > 0 ? formatCurrency(parsedAmount) : ''}
          </Button>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 8, paddingBottom: 4 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  content: { paddingBottom: 32 },
  section: { paddingHorizontal: 16, paddingVertical: 12 },
  sectionTitle: { fontWeight: '600', marginBottom: 4 },
  submitSection: { paddingHorizontal: 16, paddingTop: 16 },
  submitButton: { borderRadius: 8 },
});
