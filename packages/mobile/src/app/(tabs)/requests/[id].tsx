/**
 * Request Detail Screen
 *
 * Displays the full detail view for a single service request, including:
 * - Header with workflow name, reference, and solicitud type
 * - Horizontal workflow stepper
 * - Status card with entity code
 * - Photo (if available)
 * - Dynamic data sections
 * - Documents list
 * - Tariff breakdown card
 * - Appointment card
 * - Payment card
 * - Notifications timeline
 *
 * Data is fetched from GET /service-requests/{id}/detail-view.
 */

import { StyleSheet, View, ScrollView, Image } from 'react-native';
import {
  Text,
  Button,
  Surface,
  Divider,
  List,
  ActivityIndicator,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useAppTheme } from '@core/theme';
import { formatCurrency, formatDate } from '@core/utils/format';
import { useRequestDetailView } from '@modules/service-requests';
import { RequestStatusBadge } from '@modules/service-requests/components/request-status-badge';
import { WorkflowStepper } from '@modules/service-requests/components/workflow-stepper';
import { DataSections } from '@modules/service-requests/components/data-sections';
import { RequestNotifications } from '@modules/service-requests/components/request-notifications';

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function RequestDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t } = useTranslation();
  const { colors, spacing, borderRadius } = useAppTheme();

  const { data, isLoading, isError } = useRequestDetailView(id ?? '');

  // --- Loading state -------------------------------------------------------
  if (isLoading) {
    return (
      <SafeAreaView
        style={[styles.container, styles.centered, { backgroundColor: colors.background }]}
        edges={['top']}
      >
        <ActivityIndicator size="large" color={colors.primary} />
        <Text
          variant="bodyMedium"
          style={{ color: colors.onSurfaceVariant, marginTop: spacing.md }}
        >
          {t('common.loading')}
        </Text>
      </SafeAreaView>
    );
  }

  // --- Error state ---------------------------------------------------------
  if (isError || !data) {
    return (
      <SafeAreaView
        style={[styles.container, styles.centered, { backgroundColor: colors.background }]}
        edges={['top']}
      >
        <MaterialCommunityIcons
          name="alert-circle-outline"
          size={48}
          color={colors.error}
        />
        <Text
          variant="bodyMedium"
          style={{ color: colors.onSurfaceVariant, marginTop: spacing.md }}
        >
          {t('common.error')}
        </Text>
        <Button
          mode="outlined"
          onPress={() => router.back()}
          style={{ marginTop: spacing.md }}
        >
          {t('common.back')}
        </Button>
      </SafeAreaView>
    );
  }

  const {
    request,
    stepper_phases,
    current_phase_index,
    data_sections,
    citizen_notifications,
    photo_url,
    tariff,
    appointment,
    documents,
    workflow_name_es,
    solicitud_type_display,
    payment_status,
    payment_reference,
    receipt_number,
  } = data;

  // --- Render --------------------------------------------------------------

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={['top']}
    >
      {/* Header bar */}
      <View
        style={[
          styles.headerBar,
          {
            padding: spacing.md,
            backgroundColor: colors.surface,
            borderBottomColor: colors.outlineVariant,
          },
        ]}
      >
        <Button
          mode="text"
          icon="arrow-left"
          onPress={() => router.back()}
          compact
        >
          {t('common.back')}
        </Button>
        <Text
          variant="titleMedium"
          style={{ color: colors.onSurface, fontWeight: '600', flex: 1, textAlign: 'center' }}
          numberOfLines={1}
        >
          {t('requests.detail')}
        </Text>
        {/* Spacer to keep title centered */}
        <View style={{ width: 80 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { padding: spacing.md }]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header: workflow name + reference + type ── */}
        <Surface
          style={[
            styles.card,
            {
              padding: spacing.md,
              borderRadius: borderRadius.md,
              backgroundColor: colors.surface,
              marginBottom: spacing.md,
            },
          ]}
          elevation={1}
        >
          <Text
            variant="titleMedium"
            style={[styles.sectionTitle, { color: colors.onSurface }]}
          >
            {workflow_name_es}
          </Text>
          <Text
            variant="bodySmall"
            style={{ color: colors.outline, marginTop: 2 }}
          >
            {request.reference}
            {solicitud_type_display ? ` \u00B7 ${solicitud_type_display}` : ''}
          </Text>
        </Surface>

        {/* ── Workflow Stepper ── */}
        {stepper_phases.length > 0 && (
          <Surface
            style={[
              styles.card,
              {
                borderRadius: borderRadius.md,
                backgroundColor: colors.surface,
                marginBottom: spacing.md,
                paddingVertical: spacing.sm,
              },
            ]}
            elevation={1}
          >
            <WorkflowStepper
              phases={stepper_phases}
              currentIndex={current_phase_index}
            />
          </Surface>
        )}

        {/* ── Status card ── */}
        <Surface
          style={[
            styles.card,
            {
              padding: spacing.md,
              borderRadius: borderRadius.md,
              backgroundColor: colors.surface,
              marginBottom: spacing.md,
            },
          ]}
          elevation={1}
        >
          <View style={styles.statusRow}>
            <Text variant="labelMedium" style={{ color: colors.onSurfaceVariant }}>
              {t('requests.statusLabel')}
            </Text>
            <RequestStatusBadge status={request.status} />
          </View>
          {request.entity_code ? (
            <>
              <Divider style={{ marginVertical: spacing.sm }} />
              <View style={styles.statusRow}>
                <Text variant="labelMedium" style={{ color: colors.onSurfaceVariant }}>
                  {t('requests.entity')}
                </Text>
                <Text variant="bodyMedium" style={{ color: colors.onSurface, fontWeight: '500' }}>
                  {request.entity_code}
                </Text>
              </View>
            </>
          ) : null}
        </Surface>

        {/* ── Photo ── */}
        {photo_url ? (
          <Surface
            style={[
              styles.card,
              {
                borderRadius: borderRadius.md,
                backgroundColor: colors.surface,
                marginBottom: spacing.md,
                overflow: 'hidden',
              },
            ]}
            elevation={1}
          >
            <Image
              source={{ uri: photo_url }}
              style={styles.photo}
              resizeMode="cover"
            />
          </Surface>
        ) : null}

        {/* ── Data Sections ── */}
        {data_sections.length > 0 && (
          <View style={{ marginBottom: spacing.md }}>
            <DataSections sections={data_sections} />
          </View>
        )}

        {/* ── Documents list ── */}
        {documents.length > 0 && (
          <Surface
            style={[
              styles.card,
              {
                borderRadius: borderRadius.md,
                backgroundColor: colors.surface,
                marginBottom: spacing.md,
              },
            ]}
            elevation={1}
          >
            <Text
              variant="titleSmall"
              style={[
                styles.sectionTitle,
                {
                  color: colors.onSurface,
                  paddingHorizontal: spacing.md,
                  paddingTop: spacing.md,
                  paddingBottom: spacing.xs,
                },
              ]}
            >
              {t('requests.documents')}
            </Text>
            {documents.map((doc, docIndex) => (
              <View key={doc.id}>
                {docIndex > 0 && (
                  <Divider style={{ marginHorizontal: spacing.md }} />
                )}
                <List.Item
                  title={doc.document_name}
                  description={doc.file_name}
                  titleStyle={{ color: colors.onSurface, fontSize: 14 }}
                  descriptionStyle={{ color: colors.outline, fontSize: 12 }}
                  left={(props) => (
                    <List.Icon
                      {...props}
                      icon="file-document-outline"
                      color={colors.primary}
                    />
                  )}
                  right={(props) => (
                    <List.Icon
                      {...props}
                      icon="download"
                      color={colors.outline}
                    />
                  )}
                  style={{ paddingVertical: 4 }}
                />
              </View>
            ))}
          </Surface>
        )}

        {/* ── Tariff breakdown ── */}
        {tariff ? (
          <Surface
            style={[
              styles.card,
              {
                padding: spacing.md,
                borderRadius: borderRadius.md,
                backgroundColor: colors.surface,
                marginBottom: spacing.md,
              },
            ]}
            elevation={1}
          >
            <Text
              variant="titleSmall"
              style={[styles.sectionTitle, { color: colors.onSurface, marginBottom: spacing.sm }]}
            >
              {t('requests.tariff')}
            </Text>

            {/* Base amount */}
            <View style={styles.tariffRow}>
              <Text variant="bodyMedium" style={{ color: colors.onSurfaceVariant }}>
                {t('requests.baseAmount')}
              </Text>
              <Text variant="bodyMedium" style={{ color: colors.onSurface }}>
                {formatCurrency(tariff.base_amount, tariff.currency)}
              </Text>
            </View>

            {/* Supplements */}
            {tariff.supplements.map((supplement, suppIndex) => (
              <View key={`supp-${suppIndex}`} style={styles.tariffRow}>
                <Text variant="bodySmall" style={{ color: colors.onSurfaceVariant }}>
                  {supplement.label || t('requests.supplement')}
                </Text>
                <Text variant="bodySmall" style={{ color: colors.onSurface }}>
                  {formatCurrency(supplement.amount, tariff.currency)}
                </Text>
              </View>
            ))}

            {/* Penalties if any */}
            {tariff.penalties_amount != null && tariff.penalties_amount > 0 && (
              <View style={styles.tariffRow}>
                <Text variant="bodySmall" style={{ color: colors.error }}>
                  {t('requests.penalties')}
                </Text>
                <Text variant="bodySmall" style={{ color: colors.error }}>
                  {formatCurrency(tariff.penalties_amount, tariff.currency)}
                </Text>
              </View>
            )}

            <Divider style={{ marginVertical: spacing.sm }} />

            {/* Total */}
            <View style={styles.tariffRow}>
              <Text
                variant="titleSmall"
                style={{ color: colors.onSurface, fontWeight: '700' }}
              >
                {t('requests.totalAmount')}
              </Text>
              <Text
                variant="titleSmall"
                style={{ color: colors.primary, fontWeight: '700' }}
              >
                {formatCurrency(tariff.total_amount, tariff.currency)}
              </Text>
            </View>
          </Surface>
        ) : null}

        {/* ── Appointment card ── */}
        {appointment ? (
          <Surface
            style={[
              styles.card,
              {
                padding: spacing.md,
                borderRadius: borderRadius.md,
                backgroundColor: colors.surface,
                marginBottom: spacing.md,
              },
            ]}
            elevation={1}
          >
            <View style={styles.cardTitleRow}>
              <MaterialCommunityIcons
                name="calendar-check"
                size={20}
                color={colors.primary}
              />
              <Text
                variant="titleSmall"
                style={[styles.sectionTitle, { color: colors.onSurface, marginLeft: spacing.sm }]}
              >
                {t('requests.appointment')}
              </Text>
            </View>
            <Divider style={{ marginVertical: spacing.sm }} />
            <View style={styles.appointmentRow}>
              <Text variant="bodySmall" style={{ color: colors.onSurfaceVariant }}>
                {t('requests.appointmentDate')}
              </Text>
              <Text variant="bodyMedium" style={{ color: colors.onSurface, fontWeight: '500' }}>
                {formatDate(appointment.date, 'PPP')}
              </Text>
            </View>
            <View style={[styles.appointmentRow, { marginTop: spacing.xs }]}>
              <Text variant="bodySmall" style={{ color: colors.onSurfaceVariant }}>
                {t('requests.appointmentTime')}
              </Text>
              <Text variant="bodyMedium" style={{ color: colors.onSurface, fontWeight: '500' }}>
                {appointment.time}
              </Text>
            </View>
            <View style={[styles.appointmentRow, { marginTop: spacing.xs }]}>
              <Text variant="bodySmall" style={{ color: colors.onSurfaceVariant }}>
                {t('requests.appointmentLocation')}
              </Text>
              <Text variant="bodyMedium" style={{ color: colors.onSurface, fontWeight: '500' }}>
                {appointment.location}
              </Text>
            </View>
          </Surface>
        ) : null}

        {/* ── Payment card ── */}
        {payment_status ? (
          <Surface
            style={[
              styles.card,
              {
                padding: spacing.md,
                borderRadius: borderRadius.md,
                backgroundColor: colors.surface,
                marginBottom: spacing.md,
              },
            ]}
            elevation={1}
          >
            <View style={styles.cardTitleRow}>
              <MaterialCommunityIcons
                name="credit-card-outline"
                size={20}
                color={colors.primary}
              />
              <Text
                variant="titleSmall"
                style={[styles.sectionTitle, { color: colors.onSurface, marginLeft: spacing.sm }]}
              >
                {t('requests.payment')}
              </Text>
            </View>
            <Divider style={{ marginVertical: spacing.sm }} />

            <View style={styles.paymentRow}>
              <Text variant="bodySmall" style={{ color: colors.onSurfaceVariant }}>
                {t('requests.paymentStatus')}
              </Text>
              <RequestStatusBadge status={payment_status} />
            </View>

            {payment_reference ? (
              <View style={[styles.paymentRow, { marginTop: spacing.xs }]}>
                <Text variant="bodySmall" style={{ color: colors.onSurfaceVariant }}>
                  {t('requests.paymentReference')}
                </Text>
                <Text variant="bodyMedium" style={{ color: colors.onSurface, fontWeight: '500' }}>
                  {payment_reference}
                </Text>
              </View>
            ) : null}

            {receipt_number ? (
              <View style={[styles.paymentRow, { marginTop: spacing.xs }]}>
                <Text variant="bodySmall" style={{ color: colors.onSurfaceVariant }}>
                  {t('requests.receiptNumber')}
                </Text>
                <Text variant="bodyMedium" style={{ color: colors.onSurface, fontWeight: '500' }}>
                  {receipt_number}
                </Text>
              </View>
            ) : null}
          </Surface>
        ) : null}

        {/* ── Notifications timeline ── */}
        <Surface
          style={[
            styles.card,
            {
              padding: spacing.md,
              borderRadius: borderRadius.md,
              backgroundColor: colors.surface,
              marginBottom: spacing.lg,
            },
          ]}
          elevation={1}
        >
          <Text
            variant="titleSmall"
            style={[styles.sectionTitle, { color: colors.onSurface, marginBottom: spacing.sm }]}
          >
            {t('requests.notifications')}
          </Text>
          <RequestNotifications notifications={citizen_notifications} />
        </Surface>
      </ScrollView>
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  card: {},
  sectionTitle: {
    fontWeight: '600',
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  photo: {
    width: '100%',
    height: 200,
  },
  tariffRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 2,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  appointmentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
