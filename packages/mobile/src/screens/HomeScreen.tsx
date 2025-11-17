/**
 * TaxasGE Mobile - Modern Home Screen
 * Beautiful home screen with search, quick actions, ministries, and recent consultations
 * Date: 2025-11-17
 * Based on: Inicio.png design
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  StatusBar,
  SafeAreaView,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { Colors, Typography, Spacing, Shadows } from '../theme';
import { fiscalServicesService, FiscalService } from '../database/services/FiscalServicesService';
import { APP_CONFIG } from '../config/AppConfig';

interface HomeScreenProps {
  language: 'es' | 'fr' | 'en';
  onNavigate: (screen: string, data?: any) => void;
}

const TEXTS = {
  es: {
    searchPlaceholder: 'Buscar ministerios o servicios...',
    quickActions: 'Acciones Rápidas',
    ministries: 'Ministerios',
    seeAll: 'Ver todos',
    recentConsultations: 'Consultas Recientes',
    noRecent: 'Sin consultas recientes',
    tabs: {
      home: 'Inicio',
      search: 'Buscar',
      favorites: 'Favoritos',
      profile: 'Perfil',
    },
    actions: {
      search: 'Buscar Servicios',
      chatbot: 'Asistente',
      favorites: 'Mis Favoritos',
      history: 'Historial',
    },
  },
  fr: {
    searchPlaceholder: 'Rechercher ministères ou services...',
    quickActions: 'Actions Rapides',
    ministries: 'Ministères',
    seeAll: 'Voir tous',
    recentConsultations: 'Consultations Récentes',
    noRecent: 'Aucune consultation récente',
    tabs: {
      home: 'Accueil',
      search: 'Rechercher',
      favorites: 'Favoris',
      profile: 'Profil',
    },
    actions: {
      search: 'Rechercher Services',
      chatbot: 'Assistant',
      favorites: 'Mes Favoris',
      history: 'Historique',
    },
  },
  en: {
    searchPlaceholder: 'Search ministries or services...',
    quickActions: 'Quick Actions',
    ministries: 'Ministries',
    seeAll: 'See all',
    recentConsultations: 'Recent Consultations',
    noRecent: 'No recent consultations',
    tabs: {
      home: 'Home',
      search: 'Search',
      favorites: 'Favorites',
      profile: 'Profile',
    },
    actions: {
      search: 'Search Services',
      chatbot: 'Assistant',
      favorites: 'My Favorites',
      history: 'History',
    },
  },
};

const HomeScreen: React.FC<HomeScreenProps> = ({ language, onNavigate }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('home');
  const [topMinistries, setTopMinistries] = useState<any[]>([]);
  const [recentServices, setRecentServices] = useState<FiscalService[]>([]);
  const t = TEXTS[language];

  useEffect(() => {
    loadTopMinistries();
    loadRecentConsultations();
  }, []);

  const loadTopMinistries = async () => {
    try {
      // Get top 4 ministries by service count
      const services = await fiscalServicesService.getFiltered({}, 100);

      // Group by ministry and count
      const ministryMap = new Map<string, { name: string; count: number; icon: string }>();

      services.forEach(service => {
        const ministryId = service.ministry_id;
        const ministryName = service.ministry_name_es;

        if (!ministryMap.has(ministryId)) {
          ministryMap.set(ministryId, {
            name: ministryName,
            count: 0,
            icon: '🏛️', // Default icon
          });
        }

        const ministry = ministryMap.get(ministryId)!;
        ministry.count++;
      });

      // Sort by count and take top 4
      const sorted = Array.from(ministryMap.entries())
        .map(([id, data]) => ({ id, ...data }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 4);

      setTopMinistries(sorted);
    } catch (error) {
      console.error('[HomeScreen] Error loading ministries:', error);
    }
  };

  const loadRecentConsultations = async () => {
    try {
      // Get 3 most recently viewed services (from history/favorites)
      // For now, just get first 3 services as placeholder
      const services = await fiscalServicesService.getFiltered({}, 3);
      setRecentServices(services);
    } catch (error) {
      console.error('[HomeScreen] Error loading recent consultations:', error);
    }
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      onNavigate('search', { initialSearch: searchQuery });
    } else {
      onNavigate('search');
    }
  };

  const renderHeader = () => (
    <View style={styles.header}>
      {/* Logo + App Name */}
      <View style={styles.logoSection}>
        <Image
          source={require('../assets/images/taxasge.png')}
          style={styles.logoSmall}
          resizeMode="contain"
        />
        <View>
          <Text style={styles.appName}>TaxasGE</Text>
          <Text style={styles.appSubtitle}>E-Fiscal Servicios</Text>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder={t.searchPlaceholder}
            placeholderTextColor={Colors.neutral.gray400}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Text style={styles.clearIcon}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );

  const renderTabs = () => (
    <View style={styles.tabsContainer}>
      {Object.entries(t.tabs).map(([key, label]) => (
        <TouchableOpacity
          key={key}
          style={[
            styles.tab,
            activeTab === key && styles.tabActive,
          ]}
          onPress={() => {
            setActiveTab(key);
            if (key !== 'home') {
              onNavigate(key === 'search' ? 'search' : key);
            }
          }}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === key && styles.tabTextActive,
            ]}
          >
            {label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderQuickActions = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{t.quickActions}</Text>
      <View style={styles.quickActionsGrid}>
        <TouchableOpacity
          style={[styles.actionCard, { backgroundColor: Colors.primary.blue }]}
          onPress={() => onNavigate('search')}
        >
          <Text style={styles.actionIcon}>🔍</Text>
          <Text style={styles.actionText}>{t.actions.search}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionCard, { backgroundColor: Colors.primary.green }]}
          onPress={() => onNavigate('chatbot')}
        >
          <Text style={styles.actionIcon}>🤖</Text>
          <Text style={styles.actionText}>{t.actions.chatbot}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionCard, { backgroundColor: '#e91e63' }]}
          onPress={() => onNavigate('favorites')}
        >
          <Text style={styles.actionIcon}>❤️</Text>
          <Text style={styles.actionText}>{t.actions.favorites}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionCard, { backgroundColor: '#9c27b0' }]}
          onPress={() => onNavigate('history')}
        >
          <Text style={styles.actionIcon}>🕐</Text>
          <Text style={styles.actionText}>{t.actions.history}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderMinistries = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{t.ministries}</Text>
        <TouchableOpacity onPress={() => onNavigate('search', { filterByMinistry: true })}>
          <Text style={styles.seeAllText}>{t.seeAll} →</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.ministriesGrid}>
        {topMinistries.map((ministry, index) => (
          <TouchableOpacity
            key={ministry.id}
            style={styles.ministryCard}
            onPress={() => onNavigate('search', { ministryId: ministry.id })}
          >
            <View style={styles.ministryIcon}>
              <Text style={styles.ministryIconText}>{ministry.icon}</Text>
            </View>
            <Text style={styles.ministryName} numberOfLines={2}>
              {ministry.name}
            </Text>
            <Text style={styles.ministryCount}>
              {ministry.count} {language === 'es' ? 'servicios' : language === 'fr' ? 'services' : 'services'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderRecentConsultations = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{t.recentConsultations}</Text>

      {recentServices.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>{t.noRecent}</Text>
        </View>
      ) : (
        <View style={styles.recentList}>
          {recentServices.map((service, index) => (
            <TouchableOpacity
              key={service.id}
              style={styles.recentCard}
              onPress={() => onNavigate('serviceDetail', service)}
            >
              <View style={styles.recentIcon}>
                <Text style={styles.recentIconText}>📄</Text>
              </View>
              <View style={styles.recentInfo}>
                <Text style={styles.recentName} numberOfLines={1}>
                  {service.name_es}
                </Text>
                <Text style={styles.recentCategory} numberOfLines={1}>
                  {service.category_name_es}
                </Text>
              </View>
              <Text style={styles.recentArrow}>→</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.neutral.white} />

      {/* Header with gradient */}
      <LinearGradient
        colors={['#004aad', '#0066cc']}
        style={styles.headerGradient}
      >
        {renderHeader()}
      </LinearGradient>

      {/* Tabs */}
      {renderTabs()}

      {/* Scrollable Content */}
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        {renderQuickActions()}
        {renderMinistries()}
        {renderRecentConsultations()}

        {/* Bottom Spacer */}
        <View style={{ height: Spacing.xxxl }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.neutral.gray100,
  },
  headerGradient: {
    paddingBottom: Spacing.lg,
  },
  header: {
    paddingHorizontal: Spacing.screenPadding,
    paddingTop: Spacing.md,
  },
  logoSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  logoSmall: {
    width: 50,
    height: 50,
    marginRight: Spacing.sm,
  },
  appName: {
    ...Typography.h3,
    color: Colors.neutral.white,
    fontWeight: 'bold',
  },
  appSubtitle: {
    ...Typography.bodySmall,
    color: 'rgba(255,255,255,0.8)',
  },
  searchContainer: {
    marginTop: Spacing.sm,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.neutral.white,
    borderRadius: Spacing.borderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    ...Shadows.md,
  },
  searchIcon: {
    fontSize: 20,
    marginRight: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    ...Typography.body,
    color: Colors.text.primary,
  },
  clearIcon: {
    fontSize: 18,
    color: Colors.neutral.gray400,
    padding: Spacing.xs,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.neutral.white,
    paddingHorizontal: Spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral.gray200,
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  tabActive: {
    borderBottomWidth: 3,
    borderBottomColor: Colors.primary.blue,
  },
  tabText: {
    ...Typography.label,
    color: Colors.neutral.gray500,
  },
  tabTextActive: {
    color: Colors.primary.blue,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingTop: Spacing.lg,
  },
  section: {
    marginBottom: Spacing.xl,
    paddingHorizontal: Spacing.screenPadding,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    ...Typography.h3,
    color: Colors.text.primary,
    fontWeight: 'bold',
  },
  seeAllText: {
    ...Typography.label,
    color: Colors.primary.blue,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  actionCard: {
    width: '47%',
    aspectRatio: 1.5,
    borderRadius: Spacing.borderRadius.md,
    padding: Spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.md,
  },
  actionIcon: {
    fontSize: 32,
    marginBottom: Spacing.sm,
  },
  actionText: {
    ...Typography.label,
    color: Colors.neutral.white,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  ministriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  ministryCard: {
    width: '47%',
    backgroundColor: Colors.neutral.white,
    borderRadius: Spacing.borderRadius.md,
    padding: Spacing.md,
    alignItems: 'center',
    ...Shadows.sm,
  },
  ministryIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.neutral.gray100,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  ministryIconText: {
    fontSize: 24,
  },
  ministryName: {
    ...Typography.bodySmall,
    color: Colors.text.primary,
    textAlign: 'center',
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  ministryCount: {
    ...Typography.caption,
    color: Colors.neutral.gray500,
  },
  recentList: {
    gap: Spacing.sm,
  },
  recentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.neutral.white,
    borderRadius: Spacing.borderRadius.md,
    padding: Spacing.md,
    ...Shadows.sm,
  },
  recentIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.neutral.gray100,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  recentIconText: {
    fontSize: 20,
  },
  recentInfo: {
    flex: 1,
  },
  recentName: {
    ...Typography.body,
    color: Colors.text.primary,
    fontWeight: '600',
    marginBottom: 2,
  },
  recentCategory: {
    ...Typography.bodySmall,
    color: Colors.neutral.gray500,
  },
  recentArrow: {
    fontSize: 20,
    color: Colors.neutral.gray400,
  },
  emptyState: {
    paddingVertical: Spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    ...Typography.body,
    color: Colors.neutral.gray400,
  },
});

export default HomeScreen;
