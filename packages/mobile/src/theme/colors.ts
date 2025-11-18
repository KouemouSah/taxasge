/**
 * TaxasGE Mobile - Design System Colors
 * Official brand colors from design brief
 * Date: 2025-11-17
 */

export const Colors = {
  // Primary color (blue - most used)
  primary: '#004aad',      // Main primary color

  // Brand Colors
  brand: {
    red: '#d10d00',       // Primary - Attention, Action
    blue: '#004aad',      // Trust, Security
    green: '#499003',     // Innovation, AI
    greenLight: '#def6e5', // Secondary backgrounds
    yellow: '#ffde59',    // Highlights
  },

  // Neutral Colors (One UI 14 style)
  neutral: {
    white: '#ffffff',
    black: '#000000',
    gray50: '#fafafa',
    gray100: '#f5f5f5',
    gray200: '#eeeeee',
    gray300: '#e0e0e0',
    gray400: '#bdbdbd',
    gray500: '#9e9e9e',
    gray600: '#757575',
    gray700: '#616161',
    gray800: '#424242',
    gray900: '#212121',
  },

  // Semantic Colors
  semantic: {
    success: '#499003',
    successLight: '#e8f5e9',
    error: '#d10d00',
    errorLight: '#ffebee',
    warning: '#ffde59',
    warningLight: '#fff9c4',
    info: '#004aad',
    infoLight: '#e3f2fd',
  },

  // Background Gradients (for onboarding)
  gradients: {
    screen1: ['#ffffff', '#f8f4ed'],        // White to beige
    screen2: ['#004aad', '#003585'],        // Blue gradient
    screen3: ['#499003', '#367a02'],        // Green gradient
    overlay: ['rgba(0,0,0,0)', 'rgba(0,0,0,0.3)'],
  },

  // Text Colors
  text: {
    primary: '#1a1a1a',
    secondary: '#616161',
    tertiary: '#9e9e9e',
    light: '#ffffff',
    muted: '#bdbdbd',
  },

  // Background Colors (One UI 14)
  background: {
    primary: '#ffffff',
    secondary: '#f5f5f5',
    tertiary: '#fafafa',
    card: '#ffffff',
  },

  // Icon Background Colors (for colored circles)
  iconBackground: {
    blue: '#e3f2fd',
    green: '#e8f5e9',
    orange: '#fff3e0',
    purple: '#f3e5f5',
    red: '#ffebee',
    yellow: '#fff9c4',
    cyan: '#e0f7fa',
    pink: '#fce4ec',
  },
} as const;

export type ColorKeys = keyof typeof Colors;
