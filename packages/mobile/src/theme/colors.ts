/**
 * TaxasGE Mobile - Design System Colors
 * Official brand colors from design brief
 * Date: 2025-11-17
 */

export const Colors = {
  // Primary Brand Colors
  primary: {
    red: '#d10d00',       // Primary - Attention, Action
    blue: '#004aad',      // Trust, Security
    green: '#499003',     // Innovation, AI
    greenLight: '#def6e5', // Secondary backgrounds
    yellow: '#ffde59',    // Highlights
  },

  // Neutral Colors
  neutral: {
    white: '#ffffff',
    black: '#000000',
    gray100: '#f5f5f5',
    gray200: '#e0e0e0',
    gray300: '#bdbdbd',
    gray400: '#9e9e9e',
    gray500: '#757575',
    gray600: '#616161',
    gray700: '#424242',
    gray800: '#212121',
  },

  // Semantic Colors
  semantic: {
    success: '#499003',
    error: '#d10d00',
    warning: '#ffde59',
    info: '#004aad',
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
    primary: '#000000',
    secondary: '#616161',
    light: '#ffffff',
    muted: '#9e9e9e',
  },
} as const;

export type ColorKeys = keyof typeof Colors;
