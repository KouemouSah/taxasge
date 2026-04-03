/**
 * Bundle Wizard — Dedicated screen for BUNDLE_PAYMENT workflow
 *
 * 5 steps: Company → Upload (optional) → Obligations → Payment → Confirmation
 * Completely separate from the generic wizard — aligned with web bundle-workflow module.
 */

import { View, StyleSheet, Pressable } from 'react-native';
import { Text, Button, ActivityIndicator, ProgressBar, Snackbar } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useAppTheme } from '@core/theme';
import {
  useBundleWizard,
  BundleStep,
  BUNDLE_STEP_LABELS,
  CompanyIdentificationStep,
  ObligationsReviewStep,
  BundlePaymentStep,
  BundleConfirmationStep,
} from '@modules/bundle-workflow';
import { CompanyUploadStep } from '@modules/bundle-workflow/components/company-upload';

export default function BundleWizardScreen() {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const { colors } = useAppTheme();
  const lang = (i18n.language || 'es') as string;
  const wizard = useBundleWizard();

  const stepLabel = BUNDLE_STEP_LABELS[wizard.currentStep as BundleStep]?.[lang] ||
    BUNDLE_STEP_LABELS[wizard.currentStep as BundleStep]?.es || '';
  const progress = (wizard.currentStep + 1) / wizard.totalSteps;

  return (
    <SafeAreaView style={[s.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={[s.header, { backgroundColor: colors.surface, borderBottomColor: colors.outlineVariant }]}>
        <Pressable onPress={() => (wizard.canGoBack ? wizard.goBack() : router.back())} style={{ padding: 4 }}>
          <MaterialCommunityIcons name={wizard.canGoBack ? 'arrow-left' : 'close'} size={24} color={colors.onSurface} />
        </Pressable>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text variant="titleMedium" style={{ fontWeight: '600' }}>
            {lang === 'fr' ? 'Paiement Obligations' : lang === 'en' ? 'Pay Obligations' : 'Pago Obligaciones'}
          </Text>
          <Text variant="labelSmall" style={{ color: colors.outline }}>
            {stepLabel} ({wizard.currentStep + 1}/{wizard.totalSteps})
          </Text>
        </View>
      </View>

      {/* Progress */}
      <ProgressBar progress={progress} color={colors.primary} style={{ height: 3 }} />

      {/* Step content */}
      <View style={{ flex: 1 }}>
        {wizard.isLoading ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <>
            {wizard.currentStep === BundleStep.COMPANY_IDENTIFICATION && (
              <CompanyIdentificationStep wizard={wizard} lang={lang} />
            )}
            {wizard.currentStep === BundleStep.DOCUMENT_UPLOAD && (
              <CompanyUploadStep wizard={wizard} lang={lang} />
            )}
            {wizard.currentStep === BundleStep.CLASSIFICATION && (
              <View style={{ flex: 1, padding: 16, gap: 12 }}>
                <Text variant="titleSmall" style={{ fontWeight: '600' }}>
                  {lang === 'fr' ? 'Classification' : lang === 'en' ? 'Classification' : 'Clasificación'}
                </Text>
                {wizard.classificationPreview ? (
                  <View style={{ gap: 12 }}>
                    <Text variant="bodySmall" style={{ color: colors.outline }}>
                      {lang === 'fr' ? 'Sélectionnez la zone et le type de commerce' :
                       lang === 'en' ? 'Select zone and commerce type' :
                       'Seleccione la zona y tipo de comercio'}
                    </Text>
                    {/* Zone + Commerce type selection handled by canGoNext validation */}
                    <Text variant="bodyMedium">
                      Zone: {wizard.classificationPreview.zone?.name || wizard.selectedZoneId || '—'}
                    </Text>
                    <Text variant="bodyMedium">
                      Type: {wizard.selectedCommerceType || '—'}
                    </Text>
                  </View>
                ) : (
                  <ActivityIndicator color={colors.primary} />
                )}
              </View>
            )}
            {wizard.currentStep === BundleStep.OBLIGATIONS_REVIEW && (
              <ObligationsReviewStep wizard={wizard} lang={lang} />
            )}
            {wizard.currentStep === BundleStep.PAYMENT && (
              <BundlePaymentStep wizard={wizard} lang={lang} />
            )}
            {wizard.currentStep === BundleStep.CONFIRMATION && (
              <BundleConfirmationStep wizard={wizard} lang={lang} />
            )}
          </>
        )}
      </View>

      {/* Navigation bar (hidden on confirmation) */}
      {wizard.currentStep < BundleStep.CONFIRMATION && (
        <View style={[s.navBar, { backgroundColor: colors.surface, borderTopColor: colors.outlineVariant }]}>
          {wizard.canGoBack ? (
            <Button mode="outlined" onPress={wizard.goBack} style={{ flex: 1, marginRight: 8 }}>
              {t('common.previous')}
            </Button>
          ) : <View style={{ flex: 1, marginRight: 8 }} />}
          <Button
            mode="contained"
            onPress={wizard.goNext}
            disabled={!wizard.canGoNext || wizard.isLoading}
            loading={wizard.isLoading || wizard.isPaymentProcessing}
            style={{ flex: 1 }}
          >
            {wizard.currentStep === BundleStep.PAYMENT
              ? (lang === 'fr' ? 'Payer' : lang === 'en' ? 'Pay' : 'Pagar')
              : t('common.next')}
          </Button>
        </View>
      )}

      {/* Error snackbar */}
      <Snackbar visible={!!wizard.error} onDismiss={wizard.clearError} duration={4000}
        action={{ label: 'OK', onPress: wizard.clearError }}>
        {wizard.error ?? ''}
      </Snackbar>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
  navBar: { flexDirection: 'row', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 16, borderTopWidth: 1 },
});
