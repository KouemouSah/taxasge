/**
 * TaxasGE Mobile - Spacing System
 * Consistent spacing and sizing across the app
 * Date: 2025-11-17
 */

export const Spacing = {
  // Base spacing units (8px grid system)
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,

  // Semantic spacing
  screenPadding: 20,
  cardPadding: 16,
  sectionGap: 24,
  itemGap: 12,

  // Border radius
  borderRadius: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    xxl: 32,
    full: 9999,
  },

  // Icon sizes
  iconSize: {
    xs: 16,
    sm: 20,
    md: 24,
    lg: 32,
    xl: 48,
    xxl: 64,
  },
} as const;

export type SpacingKeys = keyof typeof Spacing;
