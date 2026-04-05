/**
 * Quick Actions - Dashboard CTA buttons
 */

import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Button } from 'react-native-paper';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAppTheme } from '@core/theme';

export function QuickActions() {
  const { t } = useTranslation();
  const { colors } = useAppTheme();

  return (
    <View style={styles.container}>
      <Button
        mode="contained"
        icon="qrcode-scan"
        onPress={() => router.push({ pathname: '/(tabs)/verify', params: { openScanner: '1' } } as never)}
        style={[styles.button, { flex: 1 }]}
        contentStyle={styles.buttonContent}
      >
        {t('scanner.scanLicense')}
      </Button>
      <Button
        mode="outlined"
        icon="magnify"
        onPress={() => router.push('/(tabs)/verify' as never)}
        style={[styles.button, { flex: 1 }]}
        contentStyle={styles.buttonContent}
        textColor={colors.primary}
      >
        {t('dashboard.verifyLicense')}
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  button: { borderRadius: 8 },
  buttonContent: { paddingVertical: 4 },
});
