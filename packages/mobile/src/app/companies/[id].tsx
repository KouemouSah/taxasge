/**
 * Company detail — informations, license PDF download, members preview,
 * actions (edit, delete).
 */

import React, { useCallback, useState } from 'react';
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

import { useAppTheme } from '@core/theme';
import { CompanyDeleteDialog } from '@modules/companies/components/company-delete-dialog';
import { MemberListItem } from '@modules/companies/components/member-list-item';
import {
  useCompanyDetail,
  useCompanyMembers,
  useDeleteCompany,
  useDownloadLicensePdf,
} from '@modules/companies';

export default function CompanyDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  const [menuVisible, setMenuVisible] = useState(false);
  const [deleteVisible, setDeleteVisible] = useState(false);
  const [snackbar, setSnackbar] = useState<string | null>(null);

  const company = useCompanyDetail(id ?? null);
  const members = useCompanyMembers(id ?? null);
  const remove = useDeleteCompany();
  const downloadPdf = useDownloadLicensePdf();

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

  const isBundle = company.data?.regimen_fiscal === 'bundle';
  const previewMembers = (members.data ?? []).slice(0, 3);

  return (
    <SafeAreaView edges={['top']} style={[styles.root, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <Appbar.Header style={{ backgroundColor: colors.surface }}>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content title={company.data?.legal_name ?? t('companies.detail.loading')} />
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

      {company.isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : !company.data ? (
        <View style={styles.center}>
          <Text variant="titleSmall" style={{ color: colors.error }}>
            {t('companies.detail.loadError')}
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
          {/* Info card */}
          <Card style={styles.card}>
            <Card.Title title={t('companies.detail.sections.info')} />
            <Card.Content>
              <Field label={t('companies.form.fields.taxId')} value={company.data.tax_id ?? '—'} />
              <Field
                label={t('companies.form.fields.representanteLegal')}
                value={company.data.representante_legal ?? '—'}
              />
              <Field
                label={t('companies.form.fields.formaJuridica')}
                value={company.data.forma_juridica ?? '—'}
              />
              <Field
                label={t('companies.form.fields.sectorActividad')}
                value={company.data.sector_actividad ?? '—'}
              />
              <Field
                label={t('companies.form.fields.regimenFiscal')}
                value={company.data.regimen_fiscal ?? '—'}
              />
              <Field
                label={t('companies.form.fields.address')}
                value={company.data.address ?? '—'}
              />
            </Card.Content>
          </Card>

          {/* Bundle license PDF download */}
          {isBundle ? (
            <Card style={styles.card}>
              <Card.Title title={t('companies.detail.sections.license')} />
              <Card.Content>
                <Button
                  icon="file-download-outline"
                  mode="contained"
                  onPress={handleDownloadPdf}
                  loading={downloadPdf.isPending}
                  disabled={downloadPdf.isPending}
                >
                  {t('companies.detail.actions.downloadLicense')}
                </Button>
              </Card.Content>
            </Card>
          ) : null}

          {/* Members preview */}
          <Card style={styles.card}>
            <Card.Title
              title={t('companies.detail.sections.members')}
              right={() => (
                <Button
                  compact
                  onPress={() => router.push(`/companies/${id}/members` as never)}
                >
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
        companyName={company.data?.legal_name ?? ''}
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
});
