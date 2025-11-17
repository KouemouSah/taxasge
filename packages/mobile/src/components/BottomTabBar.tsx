/**
 * TaxasGE - Bottom Tab Bar Component
 * Navigation tabs at the bottom of the screen
 */

import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Colors } from '../theme';

export type TabName = 'home' | 'search' | 'favorites' | 'profile';

interface Tab {
  name: TabName;
  label: string;
  icon: string;
}

interface BottomTabBarProps {
  activeTab: TabName;
  onTabPress: (tab: TabName) => void;
  language: 'es' | 'fr' | 'en';
}

const TABS_CONFIG: Record<'es' | 'fr' | 'en', Tab[]> = {
  es: [
    { name: 'home', label: 'Inicio', icon: '🏠' },
    { name: 'search', label: 'Buscar', icon: '🔍' },
    { name: 'favorites', label: 'Favoritos', icon: '❤️' },
    { name: 'profile', label: 'Perfil', icon: '👤' },
  ],
  fr: [
    { name: 'home', label: 'Accueil', icon: '🏠' },
    { name: 'search', label: 'Rechercher', icon: '🔍' },
    { name: 'favorites', label: 'Favoris', icon: '❤️' },
    { name: 'profile', label: 'Profil', icon: '👤' },
  ],
  en: [
    { name: 'home', label: 'Home', icon: '🏠' },
    { name: 'search', label: 'Search', icon: '🔍' },
    { name: 'favorites', label: 'Favorites', icon: '❤️' },
    { name: 'profile', label: 'Profile', icon: '👤' },
  ],
};

export const BottomTabBar: React.FC<BottomTabBarProps> = ({ activeTab, onTabPress, language }) => {
  const tabs = TABS_CONFIG[language];

  return (
    <View style={styles.container}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.name;
        return (
          <TouchableOpacity
            key={tab.name}
            style={styles.tab}
            onPress={() => onTabPress(tab.name)}
            activeOpacity={0.7}>
            <Text style={[styles.icon, isActive && styles.iconActive]}>{tab.icon}</Text>
            <Text style={[styles.label, isActive && styles.labelActive]} numberOfLines={1}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    paddingBottom: 8,
    paddingTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  icon: {
    fontSize: 24,
    marginBottom: 4,
    opacity: 0.5,
  },
  iconActive: {
    opacity: 1,
  },
  label: {
    fontSize: 11,
    color: '#666666',
    fontWeight: '500',
  },
  labelActive: {
    color: Colors.primary,
    fontWeight: '700',
  },
});

export default BottomTabBar;
