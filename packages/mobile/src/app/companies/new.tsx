import React, { useCallback, useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { Appbar, Snackbar } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { useAppTheme } from '@core/theme';
import { CompanyForm } from '@modules/companies/components/company-form';
import { useCreateCompany } from '@modules/companies';
import type { CompanyCreate, CompanyFormValues } from '@modules/companies';

export default function CompanyNewScreen() {
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  const create = useCreateCompany();
  const [snackbar, setSnackbar] = useState<string | null>(null);

  const handleSubmit = useCallback(
    (values: CompanyFormValues) => {
      // is_active defaults to true (a citizen-created company is active by
      // default); is_verified to false (admin verification flow is server-side).
      const payload: CompanyCreate = {
        legal_name: values.legal_name,
        tax_id: values.tax_id,
        representante_legal: values.representante_legal,
        regimen_fiscal: values.regimen_fiscal ?? null,
        is_active: true,
        is_verified: false,
        ...(values.zone_id ? { zone_id: values.zone_id } : {}),
        ...(values.commerce_type ? { commerce_type: values.commerce_type } : {}),
        ...(values.forma_juridica ? { forma_juridica: values.forma_juridica } : {}),
        ...(values.sector_actividad ? { sector_actividad: values.sector_actividad } : {}),
        ...(values.address ? { address: values.address } : {}),
        ...(values.email ? { email: values.email } : {}),
        ...(values.phone ? { phone: values.phone } : {}),
      };
      create.mutate(payload, {
        onSuccess: (data) => {
          router.replace(`/companies/${data.id}` as never);
        },
        onError: (err) => {
          setSnackbar(err instanceof Error ? err.message : t('companies.errors.unknown'));
        },
      });
    },
    [create, t],
  );

  return (
    <SafeAreaView edges={['top']} style={[styles.root, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <Appbar.Header style={{ backgroundColor: colors.surface }}>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content title={t('companies.create.title')} />
      </Appbar.Header>
      <ScrollView contentContainerStyle={styles.content}>
        <CompanyForm
          submitting={create.isPending}
          onSubmit={handleSubmit}
          submitLabelKey="companies.create.action"
        />
      </ScrollView>
      <Snackbar visible={!!snackbar} onDismiss={() => setSnackbar(null)} duration={3000}>
        {snackbar ?? ''}
      </Snackbar>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { padding: 16, paddingBottom: 32 },
});
