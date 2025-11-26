/**
 * TaxasGE Mobile - Ministry Detail Screen
 * Shows detailed ministry information with stats and services
 * Date: 2025-11-17
 * Based on: ministerio_icones.png layout + i18n system
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { GradientHeader } from '../components/GradientHeader';
import { Icon } from '../components/Icon';
import { getSection } from '../i18n';
import { Colors, Spacing, Shadows } from '../theme';
import DatabaseService from '../database/DatabaseService';
import { FiscalService, getServiceName, Ministry } from '../database/services/FiscalServicesService';

interface MinistryStats {
  sectorsCount: number;
  categoriesCount: number;
  servicesCount: number;
}

interface MinisterioDetailScreenProps {
  ministry: Ministry;
  language: 'es' | 'fr' | 'en';
  onBack: () => void;
  onServicePress: (service: FiscalService) => void;
}

export const MinisterioDetailScreen: React.FC<MinisterioDetailScreenProps> = ({
  ministry,
  language,
  onBack,
  onServicePress,
}) => {
  const t = getSection(language, 'ministerioDetail');
  const [stats, setStats] = useState<MinistryStats>({ sectorsCount: 0, categoriesCount: 0, servicesCount: 0 });
  const [services, setServices] = useState<FiscalService[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadMinistryDetails();
  }, [ministry.id]);

  const loadMinistryDetails = async () => {
    try {
      setIsLoading(true);
      const db = DatabaseService;

      // Load stats in parallel
      const [sectorsResult, categoriesResult, servicesResult, servicesList] = await Promise.all([
        db.query<{ count: number }>(
          'SELECT COUNT(DISTINCT sector_id) as count FROM fiscal_services WHERE ministry_id = ? AND status = ?',
          [ministry.id, 'active']
        ),
        db.query<{ count: number }>(
          'SELECT COUNT(DISTINCT category_id) as count FROM fiscal_services WHERE ministry_id = ? AND status = ?',
          [ministry.id, 'active']
        ),
        db.query<{ count: number }>(
          'SELECT COUNT(*) as count FROM fiscal_services WHERE ministry_id = ? AND status = ?',
          [ministry.id, 'active']
        ),
        db.query<FiscalService>(
          'SELECT * FROM v_fiscal_services_complete WHERE ministry_id = ? AND status = ? ORDER BY name_es LIMIT 20',
          [ministry.id, 'active']
        ),
      ]);

      setStats({
        sectorsCount: sectorsResult[0]?.count || 0,
        categoriesCount: categoriesResult[0]?.count || 0,
        servicesCount: servicesResult[0]?.count || 0,
      });
      setServices(servicesList);
    } catch (error) {
      console.error('[MinisterioDetail] Error loading details:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getMinistryName = (): string => {
    if (language === 'fr' && ministry.name_fr) return ministry.name_fr;
    if (language === 'en' && ministry.name_en) return ministry.name_en;
    return ministry.name_es;
  };

  const getMinistryDescription = (): string | undefined => {
    if (language === 'fr' && ministry.description_fr) return ministry.description_fr;
    if (language === 'en' && ministry.description_en) return ministry.description_en;
    return ministry.description_es;
  };

  const getMinistryAddress = (): string => {
    if (language === 'fr' && ministry.address_fr) return ministry.address_fr;
    if (language === 'en' && ministry.address_en) return ministry.address_en;
    return ministry.address_es || t.notAvailable;
  };

  const handleEmailPress = () => {
    if (ministry.contact_email) {
      Linking.openURL(`mailto:${ministry.contact_email}`);
    }
  };

  const handleWebsitePress = () => {
    if (ministry.website_url) {
      Linking.openURL(ministry.website_url);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <GradientHeader title={t.title} onBack={onBack} />

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <View style={styles.iconCircle}>
            <Icon name="building" size={40} color={Colors.primary} />
          </View>
          <Text style={styles.ministryName}>{getMinistryName()}</Text>
          {getMinistryDescription() && (
            <Text style={styles.ministryDescription}>{getMinistryDescription()}</Text>
          )}
          <Text style={styles.servicesAvailable}>
            {stats.servicesCount} {t.servicesAvailable}
          </Text>
        </View>

        {/* Contact Information */}
        <View style={styles.contactSection}>
          <View style={styles.contactRow}>
            <View style={styles.contactIconContainer}>
              <Icon name="globe" size={20} color="#666666" />
            </View>
            <View style={styles.contactContent}>
              <Text style={styles.contactLabel}>{t.location}</Text>
              <Text style={styles.contactValue}>{getMinistryAddress()}</Text>
            </View>
          </View>

          {ministry.contact_email && (
            <TouchableOpacity style={styles.contactRow} onPress={handleEmailPress} activeOpacity={0.7}>
              <View style={styles.contactIconContainer}>
                <Icon name="info" size={20} color="#666666" />
              </View>
              <View style={styles.contactContent}>
                <Text style={styles.contactLabel}>{t.email}</Text>
                <Text style={[styles.contactValue, styles.contactLink]}>{ministry.contact_email}</Text>
              </View>
            </TouchableOpacity>
          )}

          {ministry.website_url && (
            <TouchableOpacity style={styles.contactRow} onPress={handleWebsitePress} activeOpacity={0.7}>
              <View style={styles.contactIconContainer}>
                <Icon name="globe" size={20} color="#666666" />
              </View>
              <View style={styles.contactContent}>
                <Text style={styles.contactLabel}>{t.website}</Text>
                <Text style={[styles.contactValue, styles.contactLink]}>{ministry.website_url}</Text>
              </View>
            </TouchableOpacity>
          )}
        </View>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.sectorsCount}</Text>
            <Text style={styles.statLabel}>{t.stats.sectors}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.categoriesCount}</Text>
            <Text style={styles.statLabel}>{t.stats.categories}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.servicesCount}</Text>
            <Text style={styles.statLabel}>{t.stats.services}</Text>
          </View>
        </View>

        {/* Services List */}
        <View style={styles.servicesSection}>
          <Text style={styles.sectionTitle}>{t.servicesTitle}</Text>

          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={Colors.primary} />
            </View>
          ) : services.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>{t.noServices}</Text>
            </View>
          ) : (
            <View style={styles.servicesList}>
              {services.map((service) => (
                <TouchableOpacity
                  key={service.id}
                  style={styles.serviceCard}
                  onPress={() => onServicePress(service)}
                  activeOpacity={0.7}>
                  <View style={styles.serviceContent}>
                    <Text style={styles.serviceName} numberOfLines={2}>
                      {getServiceName(service, language)}
                    </Text>
                    <Text style={styles.servicePrice}>
                      {service.tasa_expedicion.toLocaleString()} XAF
                    </Text>
                  </View>
                  <Text style={styles.serviceArrow}>→</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Spacing.lg,
  },

  // Hero Section
  heroSection: {
    backgroundColor: '#FFFFFF',
    padding: Spacing.xl,
    alignItems: 'center',
    ...Shadows.md,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  icon: {
    fontSize: 40,
  },
  ministryName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A1A',
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  ministryDescription: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  servicesAvailable: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },

  // Contact Section
  contactSection: {
    backgroundColor: '#FFFFFF',
    marginTop: Spacing.md,
    padding: Spacing.md,
    ...Shadows.sm,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  contactIconContainer: {
    width: 24,
    height: 24,
    marginRight: Spacing.md,
    marginTop: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contactContent: {
    flex: 1,
  },
  contactLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666666',
    marginBottom: 4,
  },
  contactValue: {
    fontSize: 14,
    color: '#1A1A1A',
  },
  contactLink: {
    color: Colors.primary,
    textDecorationLine: 'underline',
  },

  // Stats Cards
  statsContainer: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.md,
    paddingHorizontal: Spacing.md,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: Spacing.md,
    alignItems: 'center',
    ...Shadows.sm,
  },
  statNumber: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.primary,
  },
  statLabel: {
    fontSize: 12,
    color: '#666666',
    marginTop: 4,
    textAlign: 'center',
  },

  // Services Section
  servicesSection: {
    marginTop: Spacing.md,
    paddingHorizontal: Spacing.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: Spacing.md,
  },
  loadingContainer: {
    padding: Spacing.xl,
    alignItems: 'center',
  },
  emptyContainer: {
    padding: Spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#666666',
  },
  servicesList: {
    gap: Spacing.sm,
  },
  serviceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: Spacing.md,
    ...Shadows.sm,
  },
  serviceContent: {
    flex: 1,
  },
  serviceName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  servicePrice: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
  serviceArrow: {
    fontSize: 18,
    color: Colors.primary,
    marginLeft: Spacing.sm,
  },
});

export default MinisterioDetailScreen;
