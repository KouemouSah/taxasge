/**
 * TaxasGE Mobile - Modern Home Screen
 * Beautiful home screen with search, quick actions, and random ministries
 * Date: 2025-11-17
 * Based on: Inicio.png design + i18n system
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { BottomTabBar, TabName } from '../components/BottomTabBar';
import { Icon } from '../components/Icon';
import { getSection } from '../i18n';
import { HEADER_GRADIENT, GRADIENTS, Colors, Spacing, Shadows } from '../theme';
import DatabaseService from '../database/DatabaseService';
import { Ministry, FiscalService, getServiceName } from '../database/services/FiscalServicesService';
import { dataCacheService } from '../services/DataCacheService';

interface HomeScreenProps {
  language: 'es' | 'fr' | 'en';
  onNavigate: (screen: string, data?: any) => void;
}

const HomeScreen: React.FC<HomeScreenProps> = ({ language, onNavigate }) => {
  const t = getSection(language, 'homeScreen');
  const [searchQuery, setSearchQuery] = useState('');
  const [randomMinistries, setRandomMinistries] = useState<Ministry[]>([]);
  const [recentServices, setRecentServices] = useState<FiscalService[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const startTime = Date.now();
    try {
      setIsLoading(true);

      // Use cache service for faster loading, with DB fallback for random ministries
      const [allMinistries, recentServicesData] = await Promise.all([
        dataCacheService.getMinistries(),
        dataCacheService.getPopularServices(3),
      ]);

      // Get 4 random ministries from the cached list with service count > 0
      const ministriesWithServices = allMinistries.filter(m => (m.service_count || 0) > 0);
      const shuffled = [...ministriesWithServices].sort(() => Math.random() - 0.5);
      const randomMinistries = shuffled.slice(0, 4);

      setRandomMinistries(randomMinistries);
      setRecentServices(recentServicesData);

      console.log(`[HomeScreen] ⚡ Data loaded in ${Date.now() - startTime}ms (using cache)`);
    } catch (error) {
      console.error('[HomeScreen] Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getMinistryName = useCallback((ministry: Ministry): string => {
    if (language === 'fr' && ministry.name_fr) return ministry.name_fr;
    if (language === 'en' && ministry.name_en) return ministry.name_en;
    return ministry.name_es;
  }, [language]);

  const getMinistryGradient = (index: number): string[] => {
    const gradients = [
      GRADIENTS.ministryYellow,
      GRADIENTS.ministryCyan,
      GRADIENTS.ministryOrange,
      GRADIENTS.ministryBlue,
    ];
    return gradients[index % gradients.length];
  };

  const handleTabPress = (tab: TabName) => {
    if (tab === 'home') return; // Already on home
    onNavigate(tab);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header with gradient */}
      <LinearGradient
        colors={HEADER_GRADIENT}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerTop}>
            <View style={styles.logoContainer}>
              <Image
                source={require('../assets/images/taxasge.png')}
                style={styles.logo}
                resizeMode="contain"
              />
              <View style={styles.titleContainer}>
                <Text style={styles.headerTitle}>{t.title}</Text>
                <Text style={styles.headerSubtitle}>{t.subtitle}</Text>
              </View>
            </View>
          </View>

          {/* Search bar */}
          <View style={styles.searchContainer}>
            <Icon name="search" size={20} color="#999999" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder={t.searchPlaceholder}
              placeholderTextColor="#999999"
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={() => {
                if (searchQuery.trim()) {
                  onNavigate('search', { query: searchQuery });
                }
              }}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Text style={styles.clearIcon}>✕</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </LinearGradient>

      {/* Scrollable content */}
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Quick Actions - ICONS CENTERED */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.quickActionsTitle}</Text>
          <View style={styles.quickActionsGrid}>
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => onNavigate('search')}
              activeOpacity={0.8}>
              <LinearGradient
                colors={['#4A90E2', '#357ABD']}
                style={styles.actionCardGradient}>
                <View style={styles.actionIconContainer}>
                  <Icon name="search" size={54} color="#FFFFFF" />
                </View>
                <Text style={styles.actionLabel}>{t.quickActions.searchServices}</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => onNavigate('chatbot')}
              activeOpacity={0.8}>
              <LinearGradient
                colors={['#50C878', '#3EAE63']}
                style={styles.actionCardGradient}>
                <View style={styles.actionIconContainer}>
                  <Icon name="chat" size={54} color="#FFFFFF" />
                </View>
                <Text style={styles.actionLabel}>{t.quickActions.contactAssistant}</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => onNavigate('favorites')}
              activeOpacity={0.8}>
              <LinearGradient
                colors={['#E91E63', '#C2185B']}
                style={styles.actionCardGradient}>
                <View style={styles.actionIconContainer}>
                  <Icon name="heart-filled" size={54} color="#FFFFFF" />
                </View>
                <Text style={styles.actionLabel}>{t.quickActions.myFavorites}</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => onNavigate('history')}
              activeOpacity={0.8}>
              <LinearGradient
                colors={['#9C27B0', '#7B1FA2']}
                style={styles.actionCardGradient}>
                <View style={styles.actionIconContainer}>
                  <Icon name="calculator" size={54} color="#FFFFFF" />
                </View>
                <Text style={styles.actionLabel}>{t.quickActions.calculator}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>

        {/* Recently Visited Services */}
        {recentServices.length > 0 && (
          <View style={[styles.section, { marginTop: Spacing.md }]}>
            <Text style={styles.sectionTitle}>{t.recentlyVisitedTitle}</Text>
            <View style={styles.recentServicesContainer}>
              {recentServices.map((service) => (
                <TouchableOpacity
                  key={service.id}
                  style={styles.recentServiceItem}
                  onPress={() => onNavigate('serviceDetail', service)}
                  activeOpacity={0.7}>
                  <View style={styles.recentServiceIcon}>
                    <Icon name="document" size={20} color="#007AFF" />
                  </View>
                  <View style={styles.recentServiceInfo}>
                    <Text style={styles.recentServiceName} numberOfLines={2}>
                      {getServiceName(service, language)}
                    </Text>
                    <Text style={styles.recentServicePrice}>
                      {service.tasa_expedicion ? `${service.tasa_expedicion.toLocaleString()} XAF` : 'N/A'}
                    </Text>
                  </View>
                  <Text style={styles.recentServiceArrow}>→</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Ministerios Populares - REDUCED SPACING */}
        <View style={[styles.section, { marginTop: Spacing.md }]}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t.popularMinistriesTitle}</Text>
            <TouchableOpacity onPress={() => onNavigate('ministerios')}>
              <Text style={styles.viewAllLink}>
                {t.viewAll} →
              </Text>
            </TouchableOpacity>
          </View>

          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={Colors.primary} />
            </View>
          ) : (
            <View style={styles.ministriesContainer}>
              {randomMinistries.map((ministry, index) => (
                <TouchableOpacity
                  key={ministry.id}
                  style={styles.ministryCard}
                  onPress={() => onNavigate('ministerioDetail', ministry)}
                  activeOpacity={0.8}>
                  <View
                    style={[
                      styles.ministryIconCircle,
                      { backgroundColor: getMinistryGradient(index)[0] },
                    ]}>
                    <Icon name="building" size={28} color="#FFFFFF" />
                  </View>
                  <View style={styles.ministryInfo}>
                    <Text style={styles.ministryName} numberOfLines={2}>
                      {getMinistryName(ministry)}
                    </Text>
                    <Text style={styles.ministryServices}>
                      {ministry.service_count} {t.services}
                    </Text>
                  </View>
                  <Text style={styles.ministryArrow}>→</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Bottom Tab Navigation */}
      <BottomTabBar activeTab="home" onTabPress={handleTabPress} language={language} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 16,
  },
  headerContent: {
    gap: 16,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  logo: {
    width: 40,
    height: 40,
    marginRight: 12,
  },
  titleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 2,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#000000',
  },
  clearIcon: {
    fontSize: 16,
    color: '#999999',
    paddingHorizontal: 8,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.md,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1A1A1A',
    marginBottom: Spacing.md,
    letterSpacing: -0.5,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  viewAllLink: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  actionCard: {
    width: '47%',
    height: 110, // Reduced height (was aspectRatio: 1)
    borderRadius: 16,
    overflow: 'hidden',
    ...Shadows.md,
  },
  actionCardGradient: {
    flex: 1,
    padding: Spacing.sm,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  actionIconContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionIcon: {
    fontSize: 42, // 60% of ~70px card height
  },
  actionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginTop: 4,
  },
  loadingContainer: {
    padding: Spacing.xl,
    alignItems: 'center',
  },
  ministriesContainer: {
    gap: Spacing.sm,
  },
  ministryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: Spacing.md,
    ...Shadows.sm,
  },
  ministryIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  ministryIcon: {
    fontSize: 24,
  },
  ministryInfo: {
    flex: 1,
  },
  ministryName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  ministryServices: {
    fontSize: 13,
    color: '#666666',
  },
  ministryArrow: {
    fontSize: 18,
    color: Colors.primary,
    marginLeft: Spacing.sm,
  },

  // Recently Visited Services
  recentServicesContainer: {
    gap: Spacing.sm,
  },
  recentServiceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: Spacing.md,
    ...Shadows.sm,
  },
  recentServiceIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  recentServiceIconText: {
    fontSize: 24,
  },
  recentServiceInfo: {
    flex: 1,
  },
  recentServiceName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  recentServicePrice: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primary,
  },
  recentServiceArrow: {
    fontSize: 18,
    color: '#CCCCCC',
    marginLeft: Spacing.sm,
  },
});

export default HomeScreen;
