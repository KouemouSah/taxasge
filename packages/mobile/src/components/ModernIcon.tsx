/**
 * TaxasGE - Modern Icon Component
 * Provides consistent modern icons across the app
 */

import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';

export type IconName =
  | 'search'
  | 'chatbot'
  | 'heart'
  | 'calendar'
  | 'home'
  | 'list'
  | 'user'
  | 'ministry'
  | 'document'
  | 'calculator'
  | 'send'
  | 'edit'
  | 'settings'
  | 'history'
  | 'language'
  | 'theme'
  | 'grid'
  | 'arrow-back'
  | 'arrow-forward';

interface ModernIconProps {
  name: IconName;
  size?: number;
  color?: string;
  backgroundColor?: string;
  style?: ViewStyle;
}

/**
 * Modern icon component using Unicode symbols and custom SVG paths
 * This is a simplified version - ideally use react-native-vector-icons
 */
export const ModernIcon: React.FC<ModernIconProps> = ({
  name,
  size = 24,
  color = '#FFFFFF',
  backgroundColor,
  style,
}) => {
  // Map icon names to Unicode symbols (temporary solution)
  const iconMap: Record<IconName, string> = {
    search: '🔍',
    chatbot: '🤖',
    heart: '❤️',
    calendar: '📅',
    home: '🏠',
    list: '📋',
    user: '👤',
    ministry: '🏛️',
    document: '📄',
    calculator: '🧮',
    send: '➤',
    edit: '✏️',
    settings: '⚙️',
    history: '🕐',
    language: '🌐',
    theme: '🎨',
    grid: '▦',
    'arrow-back': '←',
    'arrow-forward': '→',
  };

  const iconSymbol = iconMap[name] || '?';

  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          backgroundColor: backgroundColor || 'transparent',
          borderRadius: backgroundColor ? size / 2 : 0,
        },
        style,
      ]}>
      <View style={styles.iconWrapper}>
        {/* Using text emoji as fallback - ideally use SVG icons */}
        <View style={{ width: size * 0.8, height: size * 0.8, justifyContent: 'center', alignItems: 'center' }}>
          {/* Icon placeholder - would be replaced with actual icon library */}
          <View style={[styles.iconCircle, { width: size * 0.6, height: size * 0.6, backgroundColor: color }]} />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconCircle: {
    borderRadius: 100,
  },
});

export default ModernIcon;
