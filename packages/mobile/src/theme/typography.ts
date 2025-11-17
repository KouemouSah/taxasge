/**
 * TaxasGE Mobile - Typography System
 * Consistent text styles across the app
 * Date: 2025-11-17
 */

import { Platform, TextStyle } from 'react-native';

const fontFamily = {
  regular: Platform.select({
    ios: 'System',
    android: 'Roboto',
  }),
  medium: Platform.select({
    ios: 'System',
    android: 'Roboto-Medium',
  }),
  bold: Platform.select({
    ios: 'System',
    android: 'Roboto-Bold',
  }),
};

export const Typography = {
  // Display (Hero titles)
  display: {
    fontSize: 48,
    lineHeight: 56,
    fontWeight: '700' as TextStyle['fontWeight'],
    fontFamily: fontFamily.bold,
    letterSpacing: -1,
  },

  // Headings
  h1: {
    fontSize: 32,
    lineHeight: 40,
    fontWeight: '700' as TextStyle['fontWeight'],
    fontFamily: fontFamily.bold,
    letterSpacing: -0.5,
  },
  h2: {
    fontSize: 28,
    lineHeight: 36,
    fontWeight: '700' as TextStyle['fontWeight'],
    fontFamily: fontFamily.bold,
    letterSpacing: -0.3,
  },
  h3: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: '600' as TextStyle['fontWeight'],
    fontFamily: fontFamily.medium,
  },
  h4: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '600' as TextStyle['fontWeight'],
    fontFamily: fontFamily.medium,
  },

  // Body text
  body: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '400' as TextStyle['fontWeight'],
    fontFamily: fontFamily.regular,
  },
  bodyLarge: {
    fontSize: 18,
    lineHeight: 28,
    fontWeight: '400' as TextStyle['fontWeight'],
    fontFamily: fontFamily.regular,
  },
  bodySmall: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400' as TextStyle['fontWeight'],
    fontFamily: fontFamily.regular,
  },

  // Captions and labels
  caption: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '400' as TextStyle['fontWeight'],
    fontFamily: fontFamily.regular,
  },
  label: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500' as TextStyle['fontWeight'],
    fontFamily: fontFamily.medium,
  },

  // Button text
  button: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '600' as TextStyle['fontWeight'],
    fontFamily: fontFamily.medium,
    letterSpacing: 0.5,
  },
  buttonLarge: {
    fontSize: 18,
    lineHeight: 28,
    fontWeight: '700' as TextStyle['fontWeight'],
    fontFamily: fontFamily.bold,
    letterSpacing: 0.5,
  },
} as const;

export type TypographyKeys = keyof typeof Typography;
