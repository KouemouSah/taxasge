/**
 * Change Password Screen
 *
 * 2-step flow via auth route (higher security for mobile):
 * Step 1: Enter current password → API sends 6-digit code to email
 * Step 2: Enter code + new password → API confirms
 *
 * Uses POST /auth/password/change + POST /auth/password/change/verify
 */

import { useState } from 'react';
import { StyleSheet, View, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Text, TextInput, Button, Surface, HelperText, Snackbar } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useAppTheme } from '@core/theme';
import { useAuth } from '@core/hooks/use-auth';
import { extractApiError } from '@core/api/errors';
import {
  passwordChangeRequestSchema,
  passwordChangeVerifySchema,
  type PasswordChangeRequestInput,
  type PasswordChangeVerifyInput,
} from '@modules/auth/validations';
import { usePasswordChangeRequest, usePasswordChangeVerify } from '@modules/auth/services/auth-hooks';
import { PasswordStrengthIndicator } from '@modules/auth/components/password-strength-indicator';

export default function ChangePasswordScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { colors, spacing, borderRadius } = useAppTheme();
  const { user } = useAuth();

  const [step, setStep] = useState<1 | 2>(1);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  const requestMutation = usePasswordChangeRequest();
  const verifyMutation = usePasswordChangeVerify();

  // Step 1 form
  const step1Form = useForm<PasswordChangeRequestInput>({
    resolver: zodResolver(passwordChangeRequestSchema),
    defaultValues: { current_password: '' },
  });

  // Step 2 form
  const step2Form = useForm<PasswordChangeVerifyInput>({
    resolver: zodResolver(passwordChangeVerifySchema),
    defaultValues: {
      email: user?.email ?? '',
      verification_code: '',
      new_password: '',
      confirm_password: '',
    },
  });

  const handleStep1 = (data: PasswordChangeRequestInput) => {
    setErrorMessage(null);
    requestMutation.mutate(data.current_password, {
      onSuccess: () => {
        step2Form.setValue('email', user?.email ?? '');
        setStep(2);
      },
      onError: (error) => {
        setErrorMessage(extractApiError(error).message);
      },
    });
  };

  const handleStep2 = (data: PasswordChangeVerifyInput) => {
    setErrorMessage(null);
    verifyMutation.mutate(
      {
        email: data.email,
        verification_code: data.verification_code,
        new_password: data.new_password,
      },
      {
        onSuccess: () => {
          setShowSuccess(true);
          setTimeout(() => router.back(), 2000);
        },
        onError: (error) => {
          setErrorMessage(extractApiError(error).message);
        },
      },
    );
  };

  const watchNewPassword = step2Form.watch('new_password');

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { padding: spacing.lg }]}
        keyboardShouldPersistTaps="handled"
      >
        {/* Step indicator */}
        <View style={[styles.stepIndicator, { marginBottom: spacing.lg }]}>
          <MaterialCommunityIcons
            name={step === 1 ? 'numeric-1-circle' : 'check-circle'}
            size={28}
            color={step >= 1 ? colors.primary : colors.outline}
          />
          <View style={[styles.stepLine, { backgroundColor: step >= 2 ? colors.primary : colors.outline }]} />
          <MaterialCommunityIcons
            name={step === 2 ? 'numeric-2-circle' : 'numeric-2-circle-outline'}
            size={28}
            color={step >= 2 ? colors.primary : colors.outline}
          />
        </View>

        <Surface
          style={[styles.card, { padding: spacing.lg, borderRadius: borderRadius.lg, backgroundColor: colors.surface }]}
          elevation={1}
        >
          {step === 1 ? (
            <>
              <Text variant="titleMedium" style={[styles.stepTitle, { color: colors.onSurface }]}>
                {t('profile.enterCurrentPassword')}
              </Text>
              <Text
                variant="bodyMedium"
                style={{ color: colors.onSurfaceVariant, marginBottom: spacing.lg }}
              >
                {t('profile.currentPasswordDesc')}
              </Text>

              <Controller
                control={step1Form.control}
                name="current_password"
                render={({ field: { onChange, onBlur, value } }) => (
                  <View style={{ marginBottom: spacing.lg }}>
                    <TextInput
                      label={t('auth.currentPassword')}
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      mode="outlined"
                      secureTextEntry={!showPassword}
                      error={!!step1Form.formState.errors.current_password}
                      left={<TextInput.Icon icon="lock-outline" />}
                      right={
                        <TextInput.Icon
                          icon={showPassword ? 'eye-off' : 'eye'}
                          onPress={() => setShowPassword(!showPassword)}
                        />
                      }
                    />
                    {step1Form.formState.errors.current_password && (
                      <HelperText type="error" visible>
                        {t(step1Form.formState.errors.current_password.message ?? '')}
                      </HelperText>
                    )}
                  </View>
                )}
              />

              {errorMessage && (
                <Text variant="bodySmall" style={{ color: colors.error, marginBottom: spacing.md, textAlign: 'center' }}>
                  {errorMessage}
                </Text>
              )}

              <Button
                mode="contained"
                onPress={step1Form.handleSubmit(handleStep1)}
                loading={requestMutation.isPending}
                disabled={requestMutation.isPending}
                contentStyle={styles.buttonContent}
              >
                {t('common.next')}
              </Button>
            </>
          ) : (
            <>
              <Text variant="titleMedium" style={[styles.stepTitle, { color: colors.onSurface }]}>
                {t('profile.verifyAndSetNew')}
              </Text>
              <Text
                variant="bodyMedium"
                style={{ color: colors.onSurfaceVariant, marginBottom: spacing.lg }}
              >
                {t('profile.codeSentToEmail', { email: user?.email })}
              </Text>

              {/* Verification code */}
              <Controller
                control={step2Form.control}
                name="verification_code"
                render={({ field: { onChange, onBlur, value } }) => (
                  <View style={{ marginBottom: spacing.md }}>
                    <TextInput
                      label={t('auth.verificationCode')}
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      mode="outlined"
                      keyboardType="number-pad"
                      maxLength={6}
                      error={!!step2Form.formState.errors.verification_code}
                      left={<TextInput.Icon icon="shield-check-outline" />}
                    />
                    {step2Form.formState.errors.verification_code && (
                      <HelperText type="error" visible>
                        {t(step2Form.formState.errors.verification_code.message ?? '')}
                      </HelperText>
                    )}
                  </View>
                )}
              />

              {/* New password */}
              <Controller
                control={step2Form.control}
                name="new_password"
                render={({ field: { onChange, onBlur, value } }) => (
                  <View style={{ marginBottom: spacing.sm }}>
                    <TextInput
                      label={t('auth.newPassword')}
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      mode="outlined"
                      secureTextEntry={!showPassword}
                      error={!!step2Form.formState.errors.new_password}
                      left={<TextInput.Icon icon="lock-outline" />}
                      right={
                        <TextInput.Icon
                          icon={showPassword ? 'eye-off' : 'eye'}
                          onPress={() => setShowPassword(!showPassword)}
                        />
                      }
                    />
                    <PasswordStrengthIndicator password={watchNewPassword} />
                  </View>
                )}
              />

              {/* Confirm password */}
              <Controller
                control={step2Form.control}
                name="confirm_password"
                render={({ field: { onChange, onBlur, value } }) => (
                  <View style={{ marginBottom: spacing.lg }}>
                    <TextInput
                      label={t('auth.confirmPassword')}
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      mode="outlined"
                      secureTextEntry={!showPassword}
                      error={!!step2Form.formState.errors.confirm_password}
                      left={<TextInput.Icon icon="lock-check-outline" />}
                    />
                    {step2Form.formState.errors.confirm_password && (
                      <HelperText type="error" visible>
                        {t(step2Form.formState.errors.confirm_password.message ?? '')}
                      </HelperText>
                    )}
                  </View>
                )}
              />

              {errorMessage && (
                <Text variant="bodySmall" style={{ color: colors.error, marginBottom: spacing.md, textAlign: 'center' }}>
                  {errorMessage}
                </Text>
              )}

              <View style={styles.actions}>
                <Button
                  mode="outlined"
                  onPress={() => { setStep(1); setErrorMessage(null); }}
                  style={{ flex: 1, marginRight: 8 }}
                >
                  {t('common.previous')}
                </Button>
                <Button
                  mode="contained"
                  onPress={step2Form.handleSubmit(handleStep2)}
                  loading={verifyMutation.isPending}
                  disabled={verifyMutation.isPending}
                  contentStyle={styles.buttonContent}
                  style={{ flex: 1 }}
                >
                  {t('profile.changePassword')}
                </Button>
              </View>
            </>
          )}
        </Surface>
      </ScrollView>

      <Snackbar visible={showSuccess} onDismiss={() => setShowSuccess(false)} duration={2000}>
        {t('auth.passwordChanged')}
      </Snackbar>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scrollContent: { flexGrow: 1 },
  stepIndicator: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  stepLine: { height: 2, width: 48, marginHorizontal: 8 },
  card: { width: '100%' },
  stepTitle: { fontWeight: '600', marginBottom: 8 },
  buttonContent: { paddingVertical: 6 },
  actions: { flexDirection: 'row' },
});
