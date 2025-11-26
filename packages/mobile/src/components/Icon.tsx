/**
 * TaxasGE Mobile - Icon Component
 * Modern pictogram icons using Unicode characters
 * Date: 2025-11-18
 */

import React from 'react';
import { Text, TextStyle, StyleProp, StyleSheet } from 'react-native';

export type IconName =
  | 'home'
  | 'search'
  | 'heart'
  | 'heart-filled'
  | 'user'
  | 'building'
  | 'document'
  | 'calculator'
  | 'robot'
  | 'chat'
  | 'chart'
  | 'edit'
  | 'star'
  | 'star-filled'
  | 'globe'
  | 'clock'
  | 'palette'
  | 'info'
  | 'lock'
  | 'export'
  | 'flag-es'
  | 'flag-fr'
  | 'flag-gb';

// Modern Unicode icons - Clean and professional
const ICONS: Record<IconName, string> = {
  // Navigation
  home: '⌂',        // House symbol
  search: '⌕',      // Search symbol
  heart: '♡',       // Empty heart
  'heart-filled': '♥', // Filled heart
  user: '⚉',        // User/person symbol

  // Objects
  building: '⌂',    // Building symbol
  document: '☰',    // Document/list symbol
  calculator: '⊞',  // Calculator grid
  robot: '⚙',       // Bot/settings gear
  chat: '💬',       // Chat bubble for TaxaBot
  chart: '▤',       // Chart/graph symbol
  edit: '✎',        // Edit pencil
  star: '☆',        // Empty star
  'star-filled': '★', // Filled star

  // Settings
  globe: '⊕',       // Globe/world
  clock: '⌚',       // Clock/time
  palette: '⊞',     // Palette/design
  info: 'ⓘ',        // Info circle
  lock: '⚿',        // Lock/security
  export: '⤊',      // Export/upload arrow

  // Flags (using regional indicator symbols)
  'flag-es': '🇪🇸',
  'flag-fr': '🇫🇷',
  'flag-gb': '🇬🇧',
};

export interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
  style?: StyleProp<TextStyle>;
}

export const Icon: React.FC<IconProps> = ({
  name,
  size = 24,
  color = '#000',
  style,
}) => {
  const iconChar = ICONS[name] || '?';

  return (
    <Text
      style={[
        styles.icon,
        {
          fontSize: size,
          color: color,
          lineHeight: size,
        },
        style,
      ]}
      allowFontScaling={false}>
      {iconChar}
    </Text>
  );
};

const styles = StyleSheet.create({
  icon: {
    fontWeight: '400',
    textAlign: 'center',
  },
});

export default Icon;
