/**
 * Sign In Screen
 *
 * Login form with email + password fields.
 * Uses react-hook-form + Zod validation aligned with backend LoginRequest.
 * Wired to AuthProvider signIn flow with 2FA support.
 */

import { useState } from 'react';
import { StyleSheet, View, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { Text, TextInput, Button, Surface, HelperText } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Link } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { useAppTheme } from '@core/theme';
import { useAuth } from '@core/hooks/use-auth';
import { extractApiError } from '@core/api/errors';
import { loginSchema, type LoginInput } from '@modules/auth/validations';

export default function SignInScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { colors, spacing, borderRadius } = useAppTheme();
  const { signIn } = useAuth();

  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (data: LoginInput) => {
    setErrorMessage(null);
    setIsSubmitting(true);
    try {
      const result = await signIn(data.email, data.password);
      if (result.type === 'requires_2fa') {
        router.push({
          pathname: '/(auth)/verify-otp',
          params: { tempToken: result.tempToken },
        });
      } else {
        // Login success — navigate to dashboard immediately
        router.replace('/(tabs)');
      }
    } catch (error) {
      const apiError = extractApiError(error);
      setErrorMessage(apiError.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={[styles.content, { paddingHorizontal: spacing.lg }]}>
          {/* Header */}
          <View style={[styles.header, { marginBottom: spacing.xl }]}>
            <Image
              source={require('../../../assets/images/logo_hd.png')}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text
              variant="bodyLarge"
              style={[styles.subtitle, { color: colors.onSurfaceVariant, marginTop: spacing.sm }]}
            >
              {t('auth.welcomeBack')}
            </Text>
          </View>

          {/* Form */}
          <Surface
            style={[
              styles.formCard,
              {
                padding: spacing.lg,
                borderRadius: borderRadius.lg,
                backgroundColor: colors.surface,
              },
            ]}
            elevation={1}
          >
            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, onBlur, value } }) => (
                <View style={{ marginBottom: spacing.md }}>
                  <TextInput
                    label={t('auth.email')}
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    mode="outlined"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                    error={!!errors.email}
                    left={<TextInput.Icon icon="email-outline" />}
                  />
                  {errors.email && (
                    <HelperText type="error" visible>
                      {t(errors.email.message ?? 'auth.invalidEmail')}
                    </HelperText>
                  )}
                </View>
              )}
            />

            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, onBlur, value } }) => (
                <View style={{ marginBottom: spacing.sm }}>
                  <TextInput
                    label={t('auth.password')}
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    mode="outlined"
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    error={!!errors.password}
                    left={<TextInput.Icon icon="lock-outline" />}
                    right={
                      <TextInput.Icon
                        icon={showPassword ? 'eye-off' : 'eye'}
                        onPress={() => setShowPassword(!showPassword)}
                      />
                    }
                  />
                  {errors.password && (
                    <HelperText type="error" visible>
                      {t(errors.password.message ?? 'auth.passwordRequired')}
                    </HelperText>
                  )}
                </View>
              )}
            />

            <Link
              href="/(auth)/forgot-password"
              style={[
                styles.forgotLink,
                { color: colors.primary, marginBottom: spacing.lg },
              ]}
            >
              {t('auth.forgotPassword')}
            </Link>

            {errorMessage && (
              <Text
                variant="bodySmall"
                style={{ color: colors.error, marginBottom: spacing.md, textAlign: 'center' }}
              >
                {errorMessage}
              </Text>
            )}

            <Button
              mode="contained"
              onPress={handleSubmit(onSubmit)}
              loading={isSubmitting}
              disabled={isSubmitting}
              contentStyle={styles.buttonContent}
              style={{ borderRadius: borderRadius.sm }}
            >
              {t('auth.signIn')}
            </Button>
          </Surface>

          {/* Sign up link */}
          <View style={[styles.footer, { marginTop: spacing.lg }]}>
            <Text variant="bodyMedium" style={{ color: colors.onSurfaceVariant }}>
              {t('auth.noAccount')}{' '}
            </Text>
            <Link href="/(auth)/sign-up">
              <Text variant="bodyMedium" style={{ color: colors.primary, fontWeight: '600' }}>
                {t('auth.signUp')}
              </Text>
            </Link>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
  },
  logo: {
    width: 180,
    height: 80,
  },
  subtitle: {
    textAlign: 'center',
  },
  formCard: {
    width: '100%',
  },
  forgotLink: {
    textAlign: 'right',
    fontSize: 14,
  },
  buttonContent: {
    paddingVertical: 6,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
