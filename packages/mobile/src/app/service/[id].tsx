/**
 * Service Detail Screen — Full detail view for a fiscal service.
 *
 * Shows: header (ministry + category + name + code), description,
 * pricing card, documents list, procedures accordion, related services,
 * legal reference, and a sticky "Iniciar Solicitud" bottom button.
 */

import { useCallback } from 'react';
import { StyleSheet, View, ScrollView, FlatList, type ListRenderItemInfo } from 'react-native';
import { Text, Button, Surface, Chip, Divider, IconButton } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useAppTheme } from '@core/theme';
import { formatCurrency } from '@core/utils/format';
import { useServiceDetail } from '@modules/fiscal-services';
import type { RelatedServiceItem } from '@modules/fiscal-services';

import { LoadingScreen } from '@components/ui/loading-screen';
import { EmptyState } from '@components/ui/empty-state';
import { ServicePricing } from '@modules/fiscal-services/components/service-pricing';
import { ServiceDocuments } from '@modules/fiscal-services/components/service-documents';
import { ServiceProcedures } from '@modules/fiscal-services/components/service-procedures';

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function ServiceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t } = useTranslation();
  const { colors, spacing, borderRadius } = useAppTheme();

  const serviceId = Number(id);
  const { data: service, isLoading, isError } = useServiceDetail(serviceId, 'es');

  // Handlers
  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  const handleStartRequest = useCallback(() => {
    // P3 placeholder: navigate to wizard start for this service
    // router.push(`/wizard/start?service_id=${serviceId}`);
  }, [serviceId]);

  const handleRelatedPress = useCallback(
    (relatedId: number) => {
      router.push(`/service/${relatedId}`);
    },
    [router],
  );

  // ---------------------------------------------------------------------------
  // Loading / Error states
  // ---------------------------------------------------------------------------

  if (isLoading) {
    return <LoadingScreen message={t('common.loading', { defaultValue: 'Cargando...' })} />;
  }

  if (isError || !service) {
    return (
      <SafeAreaView style={[styles.fullScreen, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={[styles.headerBar, { padding: spacing.md, backgroundColor: colors.surface, borderBottomColor: colors.outlineVariant }]}>
          <IconButton icon="arrow-left" onPress={handleBack} />
        </View>
        <EmptyState
          icon="alert-circle-outline"
          title={t('services.errorTitle', { defaultValue: 'Error al cargar' })}
          description={t('services.errorDesc', { defaultValue: 'No se pudo cargar el servicio. Intenta de nuevo.' })}
          actionLabel={t('common.retry', { defaultValue: 'Reintentar' })}
          onAction={handleBack}
        />
      </SafeAreaView>
    );
  }

  // ---------------------------------------------------------------------------
  // Related services render
  // ---------------------------------------------------------------------------

  const renderRelatedItem = ({ item }: ListRenderItemInfo<RelatedServiceItem>) => {
    const isFree = (item.expedition_price ?? 0) === 0 && (item.renewal_price ?? 0) === 0;

    return (
      <Surface
        style={[
          styles.relatedCard,
          {
            backgroundColor: colors.surface,
            borderRadius: borderRadius.md,
            padding: spacing.md,
            marginRight: spacing.sm,
          },
        ]}
        elevation={1}
      >
        <Text
          variant="bodyMedium"
          style={{ color: colors.onSurface, fontWeight: '500' }}
          numberOfLines={2}
          onPress={() => handleRelatedPress(item.id)}
        >
          {item.name}
        </Text>
        <Text
          variant="labelSmall"
          style={{ color: colors.outline, marginTop: spacing.xs }}
        >
          {item.service_code}
        </Text>
        {isFree ? (
          <Text variant="labelSmall" style={{ color: colors.primary, marginTop: spacing.xs, fontWeight: '600' }}>
            Gratuito
          </Text>
        ) : (
          <Text variant="labelSmall" style={{ color: colors.primary, marginTop: spacing.xs, fontWeight: '600' }}>
            {formatCurrency(item.expedition_price ?? 0)}
          </Text>
        )}
      </Surface>
    );
  };

  // ---------------------------------------------------------------------------
  // Main render
  // ---------------------------------------------------------------------------

  const allRelated = [
    ...service.related_services,
    ...service.child_services,
  ];

  return (
    <SafeAreaView
      style={[styles.fullScreen, { backgroundColor: colors.background }]}
      edges={['top']}
    >
      {/* Top header bar */}
      <View
        style={[
          styles.headerBar,
          {
            padding: spacing.sm,
            paddingHorizontal: spacing.md,
            backgroundColor: colors.surface,
            borderBottomColor: colors.outlineVariant,
          },
        ]}
      >
        <IconButton icon="arrow-left" onPress={handleBack} iconColor={colors.onSurface} />
        <Text
          variant="titleMedium"
          style={{ color: colors.onSurface, fontWeight: '600', flex: 1, textAlign: 'center' }}
          numberOfLines={1}
        >
          {t('services.details', { defaultValue: 'Detalle del servicio' })}
        </Text>
        {/* Spacer to center title */}
        <View style={{ width: 48 }} />
      </View>

      {/* Scrollable content */}
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { padding: spacing.md }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero section: ministry + category + name + code */}
        <Surface
          style={[
            styles.heroSection,
            {
              padding: spacing.lg,
              borderRadius: borderRadius.md,
              backgroundColor: colors.surface,
              marginBottom: spacing.md,
            },
          ]}
          elevation={1}
        >
          {/* Ministry badge */}
          {service.ministry && (
            <Chip
              compact
              mode="flat"
              style={[styles.chip, { backgroundColor: colors.primaryContainer, marginBottom: spacing.sm }]}
              textStyle={{ color: colors.onPrimaryContainer, fontSize: 11 }}
              icon={() => (
                <MaterialCommunityIcons name="office-building" size={12} color={colors.onPrimaryContainer} />
              )}
            >
              {service.ministry.name}
            </Chip>
          )}

          {/* Category badge */}
          {service.category && (
            <Chip
              compact
              mode="flat"
              style={[styles.chip, { backgroundColor: colors.secondaryContainer, marginBottom: spacing.sm }]}
              textStyle={{ color: colors.onSecondaryContainer, fontSize: 11 }}
            >
              {service.category.name}
            </Chip>
          )}

          {/* Service name */}
          <Text
            variant="headlineSmall"
            style={{ color: colors.onSurface, fontWeight: '700', marginBottom: spacing.xs }}
          >
            {service.name}
          </Text>

          {/* Service code */}
          <Text variant="labelMedium" style={{ color: colors.outline }}>
            {service.service_code}
          </Text>
        </Surface>

        {/* Description */}
        {service.description ? (
          <Surface
            style={[
              {
                padding: spacing.md,
                borderRadius: borderRadius.md,
                backgroundColor: colors.surface,
                marginBottom: spacing.md,
              },
            ]}
            elevation={1}
          >
            <View style={[styles.sectionHeader, { marginBottom: spacing.sm }]}>
              <MaterialCommunityIcons name="text-box-outline" size={20} color={colors.primary} />
              <Text
                variant="titleSmall"
                style={{ color: colors.onSurface, fontWeight: '600', marginLeft: spacing.sm }}
              >
                {t('services.description', { defaultValue: 'Descripcion' })}
              </Text>
            </View>
            <Divider style={{ marginBottom: spacing.sm }} />
            <Text variant="bodyMedium" style={{ color: colors.onSurfaceVariant, lineHeight: 22 }}>
              {service.description}
            </Text>
          </Surface>
        ) : null}

        {/* Pricing */}
        <View style={{ marginBottom: spacing.md }}>
          <ServicePricing
            pricing={service.pricing}
            processing_time_days={service.processing_time_days}
          />
        </View>

        {/* Documents */}
        {service.has_documents && service.documents.length > 0 && (
          <View style={{ marginBottom: spacing.md }}>
            <ServiceDocuments documents={service.documents} />
          </View>
        )}

        {/* Procedures */}
        {service.has_procedures && service.procedures.length > 0 && (
          <View style={{ marginBottom: spacing.md }}>
            <ServiceProcedures procedures={service.procedures} />
          </View>
        )}

        {/* Related services */}
        {allRelated.length > 0 && (
          <View style={{ marginBottom: spacing.md }}>
            <Text
              variant="titleSmall"
              style={{ color: colors.onSurface, fontWeight: '600', marginBottom: spacing.sm }}
            >
              {t('services.relatedServices', { defaultValue: 'Servicios relacionados' })}
            </Text>
            <FlatList
              data={allRelated}
              keyExtractor={(item) => String(item.id)}
              renderItem={renderRelatedItem}
              horizontal
              showsHorizontalScrollIndicator={false}
            />
          </View>
        )}

        {/* Legal reference */}
        {service.legal_reference ? (
          <Surface
            style={[
              {
                padding: spacing.md,
                borderRadius: borderRadius.md,
                backgroundColor: colors.surface,
                marginBottom: spacing.md,
              },
            ]}
            elevation={1}
          >
            <View style={[styles.sectionHeader, { marginBottom: spacing.sm }]}>
              <MaterialCommunityIcons name="scale-balance" size={20} color={colors.primary} />
              <Text
                variant="titleSmall"
                style={{ color: colors.onSurface, fontWeight: '600', marginLeft: spacing.sm }}
              >
                {t('services.legalReference', { defaultValue: 'Base legal' })}
              </Text>
            </View>
            <Divider style={{ marginBottom: spacing.sm }} />
            <Text variant="bodySmall" style={{ color: colors.onSurfaceVariant, fontStyle: 'italic' }}>
              {service.legal_reference}
            </Text>
          </Surface>
        ) : null}

        {/* Notes */}
        {service.notes ? (
          <Surface
            style={[
              {
                padding: spacing.md,
                borderRadius: borderRadius.md,
                backgroundColor: colors.surfaceVariant,
                marginBottom: spacing.md,
              },
            ]}
            elevation={0}
          >
            <View style={[styles.sectionHeader, { marginBottom: spacing.sm }]}>
              <MaterialCommunityIcons name="information-outline" size={20} color={colors.onSurfaceVariant} />
              <Text
                variant="titleSmall"
                style={{ color: colors.onSurfaceVariant, fontWeight: '600', marginLeft: spacing.sm }}
              >
                {t('services.notes', { defaultValue: 'Notas' })}
              </Text>
            </View>
            <Text variant="bodySmall" style={{ color: colors.onSurfaceVariant }}>
              {service.notes}
            </Text>
          </Surface>
        ) : null}

        {/* Bottom spacer for the sticky button */}
        <View style={{ height: 80 }} />
      </ScrollView>

      {/* Sticky bottom CTA */}
      <View
        style={[
          styles.bottomBar,
          {
            padding: spacing.md,
            backgroundColor: colors.surface,
            borderTopColor: colors.outlineVariant,
          },
        ]}
      >
        <Button
          mode="contained"
          onPress={handleStartRequest}
          contentStyle={styles.ctaContent}
          style={{ borderRadius: borderRadius.sm }}
          icon="arrow-right"
        >
          {t('services.startRequest', { defaultValue: 'Iniciar Solicitud' })}
        </Button>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  fullScreen: {
    flex: 1,
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
  heroSection: {},
  chip: {
    alignSelf: 'flex-start',
    height: 26,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  relatedCard: {
    width: 180,
  },
  bottomBar: {
    borderTopWidth: 1,
  },
  ctaContent: {
    paddingVertical: 6,
    flexDirection: 'row-reverse',
  },
});
