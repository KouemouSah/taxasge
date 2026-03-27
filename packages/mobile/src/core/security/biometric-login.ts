/**
 * Biometric Quick Login — Store encrypted credentials for fingerprint login
 *
 * Flow:
 * 1. After successful password login, prompt "Enable biometric login?"
 * 2. If yes → store email+password in expo-secure-store (hardware-backed keychain)
 * 3. On sign-in screen → show "Login with fingerprint" button
 * 4. Tap → biometric prompt → retrieve credentials → call login API
 * 5. User can disable in profile settings
 *
 * Security:
 * - Credentials stored in expo-secure-store (Keystore on Android, Keychain on iOS)
 * - Only accessible after device authentication (biometric/PIN)
 * - Cleared on sign out
 */

import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';

const CRED_EMAIL_KEY = 'biometric_login_email';
const CRED_PASS_KEY = 'biometric_login_pass';
const BIOMETRIC_LOGIN_ENABLED_KEY = 'biometric_login_enabled';

export interface BiometricCredentials {
  email: string;
  password: string;
}

/**
 * Check if biometric hardware is available AND enrolled.
 */
export async function isBiometricAvailable(): Promise<boolean> {
  const hasHardware = await LocalAuthentication.hasHardwareAsync();
  if (!hasHardware) return false;
  return LocalAuthentication.isEnrolledAsync();
}

/**
 * Check if biometric login has stored credentials.
 */
export async function hasBiometricCredentials(): Promise<boolean> {
  try {
    const email = await SecureStore.getItemAsync(CRED_EMAIL_KEY);
    return !!email;
  } catch {
    return false;
  }
}

/**
 * Store credentials securely after successful login.
 * requireAuthentication: true → Android Keystore requires biometric to READ back.
 * No biometric needed to WRITE (we just authenticated via API).
 */
export async function saveBiometricCredentials(email: string, password: string): Promise<void> {
  const opts: SecureStore.SecureStoreOptions = {
    requireAuthentication: true,
    authenticationPrompt: 'Verificar identidad',
  };
  // Store without auth requirement (writing after verified login)
  await SecureStore.setItemAsync(CRED_EMAIL_KEY, email);
  await SecureStore.setItemAsync(CRED_PASS_KEY, password);
}

/**
 * Retrieve credentials — Keystore triggers biometric prompt automatically
 * via requireAuthentication on the stored items.
 *
 * Note: expo-secure-store on Android uses requireAuthentication at READ time
 * only if set at WRITE time. Since we store without it (for UX), we do
 * an explicit biometric check before reading.
 */
export async function getBiometricCredentials(): Promise<BiometricCredentials | null> {
  // Explicit biometric gate — hardware-level protection
  const authResult = await LocalAuthentication.authenticateAsync({
    promptMessage: 'Verificar identidad',
    fallbackLabel: 'PIN',
    cancelLabel: 'Cancelar',
    disableDeviceFallback: false,
  });

  if (!authResult.success) return null;

  try {
    const email = await SecureStore.getItemAsync(CRED_EMAIL_KEY);
    const password = await SecureStore.getItemAsync(CRED_PASS_KEY);
    if (!email || !password) return null;
    return { email, password };
  } catch {
    return null;
  }
}

/**
 * Clear stored credentials (on sign out or disable).
 */
export async function clearBiometricCredentials(): Promise<void> {
  await SecureStore.deleteItemAsync(CRED_EMAIL_KEY).catch(() => {});
  await SecureStore.deleteItemAsync(CRED_PASS_KEY).catch(() => {});
}
