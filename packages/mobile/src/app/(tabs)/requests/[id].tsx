/**
 * Request Detail Screen — Native Android Design
 *
 * Compact, flat layout optimized for mobile:
 * - Hero header: avatar photo + title + status + progress bar
 * - Quick info row: entity + appointment
 * - Flat data sections with dividers (no cards)
 * - Documents as flat list
 * - Payment summary inline
 * - PDF download button prominent
 * - NO activity/notifications (agent-facing, not citizen mobile)
 */

import { useState } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  Image,
  Pressable,
  Modal,
} from 'react-native';
import {
  Text,
  Button,
  Divider,
  ActivityIndicator,
  ProgressBar,
  IconButton,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useAppTheme } from '@core/theme';
import { formatCurrency, formatDate } from '@core/utils/format';
import { useRequestDetailView } from '@modules/service-requests';
import { RequestStatusBadge } from '@modules/service-requests/components/request-status-badge';
import { DataSections } from '@modules/service-requests/components/data-sections';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function humanizeCode(code: string): string {
  return code.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function getDocIcon(name: string): string {
  const lower = name.toLowerCase();
  if (lower.includes('photo') || lower.includes('foto')) return 'camera';
  if (lower.includes('pasaporte')) return 'passport';
  if (lower.includes('dip') || lower.includes('dni')) return 'card-account-details';
  return 'file-document-outline';
}

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function RequestDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t } = useTranslation();
  const { colors, spacing, borderRadius } = useAppTheme();

  const { data, isLoading, isError } = useRequestDetailView(id ?? '');
  const [photoModalVisible, setPhotoModalVisible] = useState(false);

  // --- Loading ---
  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, styles.centered, { backgroundColor: colors.background }]} edges={['top']}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  // --- Error ---
  if (isError || !data) {
    return (
      <SafeAreaView style={[styles.container, styles.centered, { backgroundColor: colors.background }]} edges={['top']}>
        <MaterialCommunityIcons name="alert-circle-outline" size={48} color={colors.error} />
        <Text variant="bodyMedium" style={{ color: colors.onSurfaceVariant, marginTop: 12 }}>{t('common.error')}</Text>
        <Button mode="outlined" onPress={() => router.back()} style={{ marginTop: 12 }}>{t('common.back')}</Button>
      </SafeAreaView>
    );
  }

  const {
    request, stepper_phases, current_phase_index, data_sections,
    photo_url, tariff, appointment, documents, workflow_name_es,
    solicitud_type_display, payment_status, payment_reference, receipt_number,
  } = data;

  const progress = stepper_phases.length > 0
    ? (current_phase_index + 1) / stepper_phases.length
    : 0;
  const currentPhaseName = stepper_phases[current_phase_index]?.title_es ?? '';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Top bar */}
      <View style={[styles.topBar, { backgroundColor: colors.surface, borderBottomColor: colors.outlineVariant }]}>
        <IconButton icon="arrow-left" size={24} onPress={() => router.back()} />
        <Text variant="titleMedium" style={{ color: colors.onSurface, fontWeight: '600', flex: 1 }} numberOfLines={1}>
          {t('requests.detail')}
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>

        {/* ═══ HERO: Photo avatar + Title + Status + Progress ═══ */}
        <View style={[styles.hero, { padding: spacing.md, backgroundColor: colors.surface }]}>
          <View style={styles.heroRow}>
            {/* Photo avatar (tap to fullscreen) */}
            {photo_url ? (
              <Pressable onPress={() => setPhotoModalVisible(true)}>
                <Image source={{ uri: photo_url }} style={styles.avatar} />
              </Pressable>
            ) : (
              <View style={[styles.avatarPlaceholder, { backgroundColor: colors.primaryContainer }]}>
                <MaterialCommunityIcons name="file-document" size={28} color={colors.primary} />
              </View>
            )}

            <View style={styles.heroText}>
              <Text variant="titleMedium" style={{ color: colors.onSurface, fontWeight: '700' }} numberOfLines={2}>
                {workflow_name_es}
              </Text>
              <Text variant="bodySmall" style={{ color: colors.outline }}>
                {request.reference}
                {solicitud_type_display ? ` · ${solicitud_type_display}` : ''}
              </Text>
              <View style={{ marginTop: 4 }}>
                <RequestStatusBadge status={request.status} />
              </View>
            </View>
          </View>

          {/* Progress bar */}
          {stepper_phases.length > 0 && (
            <View style={{ marginTop: 12 }}>
              <View style={styles.progressHeader}>
                <Text variant="labelSmall" style={{ color: colors.onSurfaceVariant }}>
                  {currentPhaseName}
                </Text>
                <Text variant="labelSmall" style={{ color: colors.primary, fontWeight: '600' }}>
                  {current_phase_index + 1}/{stepper_phases.length}
                </Text>
              </View>
              <ProgressBar progress={progress} color={colors.primary} style={styles.progressBar} />
            </View>
          )}
        </View>

        {/* ═══ QUICK INFO ROW ═══ */}
        <View style={[styles.quickInfo, { paddingHorizontal: spacing.md, paddingVertical: 10, backgroundColor: colors.surfaceVariant }]}>
          {request.entity_code && (
            <View style={styles.quickInfoItem}>
              <MaterialCommunityIcons name="domain" size={16} color={colors.onSurfaceVariant} />
              <Text variant="labelSmall" style={{ color: colors.onSurfaceVariant, marginLeft: 4 }}>
                {humanizeCode(request.entity_code)}
              </Text>
            </View>
          )}
          {appointment && (
            <View style={styles.quickInfoItem}>
              <MaterialCommunityIcons name="calendar" size={16} color={colors.primary} />
              <Text variant="labelSmall" style={{ color: colors.primary, fontWeight: '600', marginLeft: 4 }}>
                {formatDate(appointment.date, 'dd/MM/yyyy')} · {appointment.time}
              </Text>
            </View>
          )}
          {appointment?.location && (
            <View style={styles.quickInfoItem}>
              <MaterialCommunityIcons name="map-marker" size={16} color={colors.onSurfaceVariant} />
              <Text variant="labelSmall" style={{ color: colors.onSurfaceVariant, marginLeft: 4 }}>
                {appointment.location}
              </Text>
            </View>
          )}
        </View>

        {/* ═══ DATA SECTIONS (flat, no cards) ═══ */}
        {data_sections.length > 0 && (
          <View style={{ paddingHorizontal: spacing.md, paddingTop: spacing.md }}>
            <DataSections sections={data_sections} />
          </View>
        )}

        {/* ═══ DOCUMENTS ═══ */}
        {documents.length > 0 && (
          <View style={{ paddingHorizontal: spacing.md, paddingTop: spacing.lg }}>
            <Text variant="titleSmall" style={{ color: colors.onSurface, fontWeight: '600', marginBottom: 8 }}>
              {t('requests.documents')} ({documents.length})
            </Text>
            {documents.map((doc, i) => (
              <View key={doc.id}>
                {i > 0 && <Divider />}
                <Pressable
                  style={styles.docRow}
                  android_ripple={{ color: colors.primaryContainer }}
                >
                  <MaterialCommunityIcons
                    name={getDocIcon(doc.document_name) as keyof typeof MaterialCommunityIcons.glyphMap}
                    size={20}
                    color={colors.primary}
                  />
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text variant="bodyMedium" style={{ color: colors.onSurface }} numberOfLines={1}>
                      {humanizeCode(doc.document_name)}
                    </Text>
                    <Text variant="bodySmall" style={{ color: colors.outline }} numberOfLines={1}>
                      {doc.file_name}
                    </Text>
                  </View>
                  <MaterialCommunityIcons name="download" size={20} color={colors.outline} />
                </Pressable>
              </View>
            ))}
          </View>
        )}

        {/* ═══ TARIFF ═══ */}
        {tariff && (
          <View style={{ paddingHorizontal: spacing.md, paddingTop: spacing.lg }}>
            <Text variant="titleSmall" style={{ color: colors.onSurface, fontWeight: '600', marginBottom: 8 }}>
              {t('requests.tariff')}
            </Text>
            <View style={styles.tariffRow}>
              <Text variant="bodyMedium" style={{ color: colors.onSurfaceVariant }}>{t('requests.baseAmount')}</Text>
              <Text variant="bodyMedium" style={{ color: colors.onSurface }}>{formatCurrency(tariff.base_amount, tariff.currency)}</Text>
            </View>
            {tariff.supplements.map((s, i) => (
              <View key={`s-${i}`} style={styles.tariffRow}>
                <Text variant="bodySmall" style={{ color: colors.onSurfaceVariant }}>{s.label || t('requests.supplement')}</Text>
                <Text variant="bodySmall" style={{ color: colors.onSurface }}>{formatCurrency(s.amount, tariff.currency)}</Text>
              </View>
            ))}
            <Divider style={{ marginVertical: 6 }} />
            <View style={styles.tariffRow}>
              <Text variant="titleSmall" style={{ color: colors.onSurface, fontWeight: '700' }}>{t('requests.totalAmount')}</Text>
              <Text variant="titleSmall" style={{ color: colors.primary, fontWeight: '700' }}>{formatCurrency(tariff.total_amount, tariff.currency)}</Text>
            </View>
          </View>
        )}

        {/* ═══ PAYMENT SUMMARY (inline, not card) ═══ */}
        {payment_status && (
          <View style={{ paddingHorizontal: spacing.md, paddingTop: spacing.lg }}>
            <Text variant="titleSmall" style={{ color: colors.onSurface, fontWeight: '600', marginBottom: 8 }}>
              {t('requests.payment')}
            </Text>
            <View style={styles.paymentSummary}>
              <View style={{ flex: 1 }}>
                <RequestStatusBadge status={payment_status} compact />
                {payment_reference && (
                  <Text variant="bodySmall" style={{ color: colors.outline, marginTop: 4 }} numberOfLines={1}>
                    {payment_reference}
                  </Text>
                )}
              </View>
              {receipt_number && (
                <View style={{ alignItems: 'flex-end' }}>
                  <Text variant="labelSmall" style={{ color: colors.onSurfaceVariant }}>{t('requests.receiptNumber')}</Text>
                  <Text variant="bodySmall" style={{ color: colors.onSurface, fontWeight: '600' }}>{receipt_number}</Text>
                </View>
              )}
            </View>
          </View>
        )}
      </ScrollView>

      {/* ═══ STICKY BOTTOM: Download PDF ═══ */}
      <View style={[styles.bottomBar, { backgroundColor: colors.surface, borderTopColor: colors.outlineVariant }]}>
        <Button
          mode="contained"
          icon="file-pdf-box"
          onPress={() => {
            // TODO P3: Download citizen summary PDF via /service-requests/{id}/citizen-summary
          }}
          style={{ flex: 1, borderRadius: borderRadius.sm }}
          contentStyle={{ paddingVertical: 4 }}
        >
          {t('detail.downloadPDF')}
        </Button>
      </View>

      {/* ═══ PHOTO FULLSCREEN MODAL ═══ */}
      {photo_url && (
        <Modal visible={photoModalVisible} transparent animationType="fade" onRequestClose={() => setPhotoModalVisible(false)}>
          <Pressable style={styles.modalOverlay} onPress={() => setPhotoModalVisible(false)}>
            <Image source={{ uri: photo_url }} style={styles.modalPhoto} resizeMode="contain" />
            <IconButton
              icon="close"
              iconColor="#fff"
              size={28}
              style={styles.modalClose}
              onPress={() => setPhotoModalVisible(false)}
            />
          </Pressable>
        </Modal>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { justifyContent: 'center', alignItems: 'center' },
  topBar: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1 },
  hero: {},
  heroRow: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 64, height: 64, borderRadius: 32, marginRight: 14 },
  avatarPlaceholder: { width: 64, height: 64, borderRadius: 32, marginRight: 14, justifyContent: 'center', alignItems: 'center' },
  heroText: { flex: 1 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  progressBar: { height: 6, borderRadius: 3 },
  quickInfo: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  quickInfoItem: { flexDirection: 'row', alignItems: 'center' },
  docRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
  tariffRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 3 },
  paymentSummary: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 12, borderTopWidth: 1 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center' },
  modalPhoto: { width: '90%', height: '70%' },
  modalClose: { position: 'absolute', top: 40, right: 16 },
});
