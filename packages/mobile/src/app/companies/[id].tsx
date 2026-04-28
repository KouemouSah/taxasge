/**
 * Company detail (citizen view) — wired on
 *   GET /bundle-workflow/my-companies/{id}
 *   GET /bundle-workflow/my-companies/{id}/payments
 *
 * Mirrors the web /empresas/[id] page: license status, obligations list with
 * "Pagar Obligaciones" CTA, payment history, company info, members preview.
 */

import React, { useCallback, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import {
  ActivityIndicator,
  Appbar,
  Button,
  Card,
  Divider,
  Menu,
  Snackbar,
  Text,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useAppTheme } from '@core/theme';
import { CompanyDeleteDialog } from '@modules/companies/components/company-delete-dialog';
import { MemberListItem } from '@modules/companies/components/member-list-item';
import {
  useCompanyMembers,
  useDeleteCompany,
  useDownloadLicensePdf,
} from '@modules/companies';
import {
  useBundleMyCompanyDetail,
  useBundleMyCompanyPayments,
  type LicenseObligation,
  type MyCompanyPayment,
} from '@modules/bundles';

function statusColor(status: string | null, colors: ReturnType<typeof useAppTheme>['colors']) {
  switch (status) {
    case 'active':
    case 'paid':
      return colors.tertiary;
    case 'pending':
    case 'pending_payment':
    case 'draft':
      return colors.primary;
    case 'overdue':
    case 'expired':
    case 'revoked':
    case 'cancelled':
      return colors.error;
    default:
      return colors.outline;
  }
}

export default function CompanyDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  const [menuVisible, setMenuVisible] = useState(false);
  const [deleteVisible, setDeleteVisible] = useState(false);
  const [snackbar, setSnackbar] = useState<string | null>(null);

  const detail = useBundleMyCompanyDetail(id);
  const payments = useBundleMyCompanyPayments(id, 1, 10);
  const members = useCompanyMembers(id ?? null);
  const remove = useDeleteCompany();
  const downloadPdf = useDownloadLicensePdf();

  const company = detail.data?.company ?? null;
  const license = detail.data?.license ?? null;
  const obligations = detail.data?.obligations ?? [];

  const pendingObligations = useMemo(
    () => obligations.filter((o) => o.status === 'pending' || o.status === 'overdue'),
    [obligations],
  );

  const handleDelete = useCallback(() => {
    if (!id) return;
    remove.mutate(id, {
      onSuccess: () => {
        setDeleteVisible(false);
        setSnackbar(t('companies.delete.success'));
        router.back();
      },
      onError: () => setSnackbar(t('companies.errors.deleteFailed')),
    });
  }, [id, remove, t]);

  const handleDownloadPdf = useCallback(() => {
    if (!id) return;
    setMenuVisible(false);
    downloadPdf.mutate(
      { companyId: id, language: 'es' },
      {
        onError: (err) =>
          setSnackbar(err instanceof Error ? err.message : t('companies.errors.unknown')),
      },
    );
  }, [downloadPdf, id, t]);

  const handlePayObligations = useCallback(() => {
    if (!id) return;
    router.push(`/bundle-wizard?company_id=${encodeURIComponent(id)}` as never);
  }, [id]);

  const previewMembers = (members.data ?? []).slice(0, 3);

  return (
    <SafeAreaView edges={['top']} style={[styles.root, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <Appbar.Header style={{ backgroundColor: colors.surface }}>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content title={company?.legal_name ?? t('companies.detail.loading')} />
        <Menu
          visible={menuVisible}
          onDismiss={() => setMenuVisible(false)}
          anchor={
            <Appbar.Action
              icon="dots-vertical"
              onPress={() => setMenuVisible(true)}
              accessibilityLabel={t('common.actions')}
            />
          }
        >
          {license ? (
            <Menu.Item
              onPress={handleDownloadPdf}
              leadingIcon="file-download-outline"
              title={t('companies.detail.actions.downloadLicense')}
            />
          ) : null}
          <Menu.Item
            onPress={() => {
              setMenuVisible(false);
              router.push(`/companies/${id}/edit` as never);
            }}
            leadingIcon="pencil-outline"
            title={t('companies.detail.actions.edit')}
          />
          <Menu.Item
            onPress={() => {
              setMenuVisible(false);
              setDeleteVisible(true);
            }}
            leadingIcon="trash-can-outline"
            title={t('companies.detail.actions.delete')}
          />
        </Menu>
      </Appbar.Header>

      {detail.isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : !company ? (
        <View style={styles.center}>
          <Text variant="titleSmall" style={{ color: colors.error }}>
            {t('companies.detail.loadError')}
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
          {/* License status card */}
          <Card style={styles.card}>
            <Card.Title title={t('companies.detail.sections.license')} />
            <Card.Content>
              {license ? (
                <>
                  <View style={styles.statusRow}>
                    <View
                      style={[styles.dot, { backgroundColor: statusColor(license.status, colors) }]}
                    />
                    <Text variant="titleSmall" style={{ color: colors.onSurface, fontWeight: '600' }}>
                      {t(`companies.license.status.${license.status}`, {
                        defaultValue: license.status,
                      })}
                    </Text>
                  </View>
                  <Field
                    label={t('companies.card.registrationNumber')}
                    value={company.registration_number ?? '—'}
                  />
                  <Field
                    label={t('companies.card.deadline')}
                    value={
                      license.deadline ? new Date(license.deadline).toLocaleDateString() : '—'
                    }
                  />
                  <Field
                    label={t('detail.total')}
                    value={`${license.total_amount.toLocaleString()} XAF`}
                  />
                  <Field
                    label={t('companies.obligations.status.paid')}
                    value={`${license.amount_paid.toLocaleString()} / ${license.total_amount.toLocaleString()} XAF`}
                  />
                </>
              ) : (
                <Text variant="bodySmall" style={{ color: colors.onSurfaceVariant }}>
                  {t('companies.card.noLicense')}
                </Text>
              )}
            </Card.Content>
          </Card>

          {/* Obligations */}
          <Card style={styles.card}>
            <Card.Title title={t('companies.obligations.title')} />
            <Card.Content style={{ paddingHorizontal: 0 }}>
              {obligations.length === 0 ? (
                <Text
                  variant="bodySmall"
                  style={{ color: colors.onSurfaceVariant, paddingHorizontal: 16 }}
                >
                  {t('companies.obligations.empty')}
                </Text>
              ) : (
                obligations.map((o, i) => (
                  <View key={o.id}>
                    <ObligationRow obligation={o} />
                    {i < obligations.length - 1 ? <Divider /> : null}
                  </View>
                ))
              )}
              {pendingObligations.length > 0 ? (
                <Button
                  icon="cash-multiple"
                  mode="contained"
                  onPress={handlePayObligations}
                  style={{ marginTop: 12, marginHorizontal: 16 }}
                >
                  {t('companies.obligations.payAll')}
                </Button>
              ) : null}
            </Card.Content>
          </Card>

          {/* Payment history */}
          <Card style={styles.card}>
            <Card.Title title={t('companies.payments.title')} />
            <Card.Content style={{ paddingHorizontal: 0 }}>
              {payments.isLoading ? (
                <ActivityIndicator color={colors.primary} style={{ marginVertical: 12 }} />
              ) : (payments.data?.payments?.length ?? 0) === 0 ? (
                <Text
                  variant="bodySmall"
                  style={{ color: colors.onSurfaceVariant, paddingHorizontal: 16 }}
                >
                  {t('companies.payments.empty')}
                </Text>
              ) : (
                payments.data!.payments.map((p, i) => (
                  <View key={p.id}>
                    <PaymentRow payment={p} />
                    {i < payments.data!.payments.length - 1 ? <Divider /> : null}
                  </View>
                ))
              )}
            </Card.Content>
          </Card>

          {/* Company info */}
          <Card style={styles.card}>
            <Card.Title title={t('companies.detail.sections.info')} />
            <Card.Content>
              <Field label={t('companies.form.fields.taxId')} value={company.nif ?? '—'} />
              <Field
                label={t('companies.form.fields.representanteLegal')}
                value={company.representante_legal ?? '—'}
              />
              <Field
                label={t('companies.form.fields.formaJuridica')}
                value={company.forma_juridica ?? '—'}
              />
              <Field
                label={t('companies.form.fields.regimenFiscal')}
                value={company.regimen_fiscal ?? '—'}
              />
              <Field
                label={t('companies.form.fields.cityName')}
                value={company.city_name ?? '—'}
              />
            </Card.Content>
          </Card>

          {/* Members preview */}
          <Card style={styles.card}>
            <Card.Title
              title={t('companies.detail.sections.members')}
              right={() => (
                <Button compact onPress={() => router.push(`/companies/${id}/members` as never)}>
                  {t('companies.detail.actions.manageMembers')}
                </Button>
              )}
            />
            <Card.Content style={{ paddingHorizontal: 0 }}>
              {previewMembers.length === 0 ? (
                <Text
                  variant="bodySmall"
                  style={{ color: colors.onSurfaceVariant, paddingHorizontal: 16 }}
                >
                  {t('companies.detail.noMembers')}
                </Text>
              ) : (
                previewMembers.map((member, i) => (
                  <View key={member.user_id}>
                    <MemberListItem member={member} />
                    {i < previewMembers.length - 1 ? <Divider /> : null}
                  </View>
                ))
              )}
            </Card.Content>
          </Card>
        </ScrollView>
      )}

      <CompanyDeleteDialog
        visible={deleteVisible}
        companyName={company?.legal_name ?? ''}
        loading={remove.isPending}
        onCancel={() => setDeleteVisible(false)}
        onConfirm={handleDelete}
      />

      <Snackbar visible={!!snackbar} onDismiss={() => setSnackbar(null)} duration={3000}>
        {snackbar ?? ''}
      </Snackbar>
    </SafeAreaView>
  );
}

function ObligationRow({ obligation }: { obligation: LicenseObligation }) {
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  return (
    <View style={styles.row}>
      <View style={[styles.rowDot, { backgroundColor: statusColor(obligation.status, colors) }]} />
      <View style={styles.rowBody}>
        <Text
          variant="bodyMedium"
          numberOfLines={1}
          style={{ color: colors.onSurface, fontWeight: '500' }}
        >
          {obligation.service_name ?? obligation.fee_type}
        </Text>
        <Text variant="bodySmall" style={{ color: colors.onSurfaceVariant }} numberOfLines={1}>
          {obligation.ministry_name ?? ''}
          {obligation.due_date
            ? ` · ${t('companies.obligations.dueDate')}: ${new Date(
                obligation.due_date,
              ).toLocaleDateString()}`
            : ''}
        </Text>
      </View>
      <View style={styles.rowRight}>
        <Text variant="bodyMedium" style={{ color: colors.onSurface, fontWeight: '600' }}>
          {obligation.amount.toLocaleString()} XAF
        </Text>
        <Text variant="labelSmall" style={{ color: statusColor(obligation.status, colors) }}>
          {t(`companies.obligations.status.${obligation.status}`, {
            defaultValue: obligation.status,
          })}
        </Text>
      </View>
    </View>
  );
}

function PaymentRow({ payment }: { payment: MyCompanyPayment }) {
  const { colors } = useAppTheme();
  return (
    <View style={styles.row}>
      <MaterialCommunityIcons name="receipt" size={20} color={colors.primary} />
      <View style={styles.rowBody}>
        <Text
          variant="bodyMedium"
          numberOfLines={1}
          style={{ color: colors.onSurface, fontWeight: '500' }}
        >
          {payment.receipt_number ?? payment.reference}
        </Text>
        <Text variant="bodySmall" style={{ color: colors.onSurfaceVariant }} numberOfLines={1}>
          {payment.created_at ? new Date(payment.created_at).toLocaleDateString() : ''}
          {payment.entity_code ? ` · ${payment.entity_code}` : ''}
        </Text>
      </View>
      <Text variant="bodyMedium" style={{ color: colors.onSurface, fontWeight: '600' }}>
        {payment.amount.toLocaleString()} {payment.currency}
      </Text>
    </View>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  const { colors } = useAppTheme();
  return (
    <View style={styles.field}>
      <Text variant="labelSmall" style={{ color: colors.onSurfaceVariant }}>
        {label}
      </Text>
      <Text variant="bodyMedium" style={{ color: colors.onSurface }}>
        {value}
      </Text>
      <Divider style={styles.fieldDivider} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  card: { marginHorizontal: 16, marginBottom: 12 },
  field: { marginBottom: 8 },
  fieldDivider: { marginTop: 6 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 12,
  },
  rowDot: { width: 8, height: 8, borderRadius: 4 },
  rowBody: { flex: 1 },
  rowRight: { alignItems: 'flex-end' },
});
