/**
 * Wizard Session Screen — Multi-step wizard
 *
 * Orchestrates: Stepper → Upload → Form → Appointment → Payment → Confirmation
 * Uses useWizardSession() hook for all state management + TTL.
 */

import { useState, useCallback, useMemo } from 'react';
import { StyleSheet, View, Alert } from 'react-native';
import { Text, Button, IconButton, ActivityIndicator, Snackbar } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useAppTheme } from '@core/theme';
import { useWizardSession } from '@modules/wizard';
import { WizardStepper } from '@modules/wizard/components/wizard-stepper';
import { TTLCountdown } from '@modules/wizard/components/ttl-countdown';

import { StepUpload } from '@modules/wizard/components/step-upload';
import { DocumentPreviewSheet } from '@modules/wizard/components/document-preview-sheet';
import { StepForm } from '@modules/wizard/components/step-form';
import { StepAppointment } from '@modules/wizard/components/step-appointment';
import { StepSiteSelection } from '@modules/wizard/components/step-site-selection';
import { StepPayment } from '@modules/wizard/components/step-payment';
import { StepConfirmation } from '@modules/wizard/components/step-confirmation';
import type { DocumentPreview, InitiatePaymentResult } from '@modules/wizard';

type WizardStepType = 'upload' | 'form' | 'appointment' | 'site_selection' | 'payment' | 'confirmation';

interface StepDef {
  id: string;
  type: WizardStepType;
  label: string;
}

export default function WizardSessionScreen() {
  const params = useLocalSearchParams<{ 'session-id': string }>();
  const sessionId = params['session-id'] ?? '';
  const router = useRouter();
  const { t } = useTranslation();
  const { colors, spacing } = useAppTheme();

  const wizard = useWizardSession(sessionId);
  const { session, isLoading, isSaving, error, timeRemaining, isExpiring, isExpired } = wizard;

  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [snackbar, setSnackbar] = useState<string | null>(null);
  const [documentPreview, setDocumentPreview] = useState<DocumentPreview | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [paymentResult, setPaymentResult] = useState<InitiatePaymentResult | null>(null);

  // Build step definitions from session
  const steps = useMemo<StepDef[]>(() => {
    if (!session) return [];
    const s: StepDef[] = [];

    // Upload documents (always)
    s.push({ id: 'upload', type: 'upload', label: t('wizard.step.upload') });

    // Form reviews (check session for form step count — for now assume 1-3)
    // Backend determines actual steps, we add a generic one
    s.push({ id: 'form_review_1', type: 'form', label: t('wizard.step.form') });

    // Appointment or site selection
    if (session.requires_appointment) {
      s.push({ id: 'appointment', type: 'appointment', label: t('wizard.step.appointment') });
    } else {
      s.push({ id: 'site_selection', type: 'site_selection', label: t('wizard.step.site') });
    }

    // Payment
    s.push({ id: 'payment', type: 'payment', label: t('wizard.step.payment') });

    // Confirmation
    s.push({ id: 'confirmation', type: 'confirmation', label: t('wizard.step.confirmation') });

    return s;
  }, [session, t]);

  const currentStep = steps[currentStepIndex];

  const handleNext = useCallback(() => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    }
  }, [currentStepIndex, steps.length]);

  const handlePrev = useCallback(() => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  }, [currentStepIndex]);

  const handleCancel = useCallback(() => {
    Alert.alert(
      t('wizard.cancel'),
      t('wizard.cancelConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.confirm'),
          style: 'destructive',
          onPress: async () => {
            await wizard.cancelSession();
            router.back();
          },
        },
      ],
    );
  }, [wizard, router, t]);

  // Loading
  if (isLoading && !session) {
    return (
      <SafeAreaView style={[styles.container, styles.centered, { backgroundColor: colors.background }]} edges={['top']}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text variant="bodyMedium" style={{ color: colors.outline, marginTop: 12 }}>
          {t('wizard.loading')}
        </Text>
      </SafeAreaView>
    );
  }

  // Expired
  if (isExpired) {
    return (
      <SafeAreaView style={[styles.container, styles.centered, { backgroundColor: colors.background }]} edges={['top']}>
        <MaterialCommunityIcons name="clock-alert-outline" size={48} color={colors.error} />
        <Text variant="titleMedium" style={{ color: colors.onSurface, fontWeight: '600', marginTop: 12 }}>
          {t('wizard.sessionExpired')}
        </Text>
        <Button mode="contained" onPress={() => router.back()} style={{ marginTop: 16 }}>
          {t('common.back')}
        </Button>
      </SafeAreaView>
    );
  }

  // Error state
  if (!session && error) {
    return (
      <SafeAreaView style={[styles.container, styles.centered, { backgroundColor: colors.background }]} edges={['top']}>
        <MaterialCommunityIcons name="alert-circle-outline" size={48} color={colors.error} />
        <Text variant="bodyMedium" style={{ color: colors.error, marginTop: 12, textAlign: 'center', paddingHorizontal: 24 }}>
          {error}
        </Text>
        <Button mode="outlined" onPress={() => router.back()} style={{ marginTop: 16 }}>
          {t('common.back')}
        </Button>
      </SafeAreaView>
    );
  }

  if (!session) return null;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Top bar: cancel + title + TTL */}
      <View style={[styles.topBar, { backgroundColor: colors.surface, borderBottomColor: colors.outlineVariant }]}>
        <IconButton icon="close" size={22} onPress={handleCancel} />
        <Text variant="titleSmall" style={{ color: colors.onSurface, fontWeight: '600', flex: 1 }} numberOfLines={1}>
          {t('wizard.title')}
        </Text>
        <TTLCountdown timeRemaining={timeRemaining} isExpiring={isExpiring} />
      </View>

      {/* Stepper */}
      <View style={{ paddingHorizontal: spacing.md }}>
        <WizardStepper
          totalSteps={steps.length}
          currentStep={currentStepIndex}
          stepLabels={steps.map((s) => s.label)}
        />
      </View>

      {/* Step content */}
      <View style={styles.stepContent}>
        {currentStep?.type === 'upload' && (
          <StepUpload
            requiredDocuments={session.required_documents}
            uploadingDocuments={wizard.uploadingDocuments}
            onUploadDocument={wizard.previewDocument}
            onDeleteDocument={wizard.deleteDocument}
            onDocumentPreview={(preview) => { setDocumentPreview(preview); setShowPreview(true); }}
          />
        )}
        {currentStep?.type === 'form' && (
          <StepForm
            stepId={currentStep.id}
            getFormConfig={wizard.getFormConfig}
            onSaveFormData={wizard.saveFormData}
            isSaving={isSaving}
          />
        )}
        {currentStep?.type === 'appointment' && (
          <StepAppointment
            getLocations={wizard.getLocations}
            getAvailableDays={wizard.getAvailableDays}
            getAvailableSlots={wizard.getAvailableSlots}
            saveAppointment={wizard.saveAppointment}
            currentAppointment={session.appointment_data}
            isSaving={isSaving}
          />
        )}
        {currentStep?.type === 'site_selection' && (
          <StepSiteSelection
            getAvailableSites={wizard.getAvailableSites}
            saveSite={wizard.saveSite}
            currentSite={session.site_selection}
            isSaving={isSaving}
          />
        )}
        {currentStep?.type === 'payment' && !paymentResult && (
          <StepPayment
            preparePayment={wizard.preparePayment}
            initiatePayment={wizard.initiatePayment}
            isSaving={isSaving}
            onPaymentComplete={(result) => {
              setPaymentResult(result);
              // Advance to confirmation
              const confirmIdx = steps.findIndex((s) => s.type === 'confirmation');
              if (confirmIdx >= 0) setCurrentStepIndex(confirmIdx);
            }}
          />
        )}
        {currentStep?.type === 'confirmation' && paymentResult && (
          <StepConfirmation
            result={paymentResult}
            onViewRequest={() => {
              if (paymentResult.service_request_id) {
                router.replace(`/(tabs)/requests/${paymentResult.service_request_id}` as never);
              }
            }}
            onGoHome={() => router.replace('/(tabs)' as never)}
          />
        )}
      </View>

      {/* Document preview bottom sheet */}
      <DocumentPreviewSheet
        visible={showPreview}
        onDismiss={() => setShowPreview(false)}
        preview={documentPreview}
        onConfirm={async (data) => {
          await wizard.confirmDocument(data);
          setShowPreview(false);
          setDocumentPreview(null);
        }}
        isConfirming={isSaving}
      />

      {/* Navigation buttons */}
      <View style={[styles.navBar, { backgroundColor: colors.surface, borderTopColor: colors.outlineVariant }]}>
        <Button
          mode="outlined"
          onPress={handlePrev}
          disabled={currentStepIndex === 0}
          style={{ flex: 1, marginRight: 8 }}
        >
          {t('common.previous')}
        </Button>
        <Button
          mode="contained"
          onPress={handleNext}
          disabled={currentStepIndex === steps.length - 1}
          loading={isSaving}
          style={{ flex: 1, borderRadius: 8 }}
        >
          {t('common.next')}
        </Button>
      </View>

      {/* Error snackbar */}
      <Snackbar visible={!!snackbar || !!error} onDismiss={() => { setSnackbar(null); wizard.clearError(); }} duration={4000}>
        {snackbar ?? error ?? ''}
      </Snackbar>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { justifyContent: 'center', alignItems: 'center' },
  topBar: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, paddingRight: 8 },
  stepContent: { flex: 1 },
  placeholder: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  navBar: { flexDirection: 'row', padding: 12, borderTopWidth: 1 },
});
