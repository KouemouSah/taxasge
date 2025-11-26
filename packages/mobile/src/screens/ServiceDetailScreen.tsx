/**
 * TaxasGE Mobile - Service Detail Screen (Modern One UI 14 Design)
 * Completely redesigned with cards, icons, and modern spacing
 * Date: 2025-11-18
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { FiscalService, getServiceName, getServiceDescription, getMinistryName, getCategoryName, getSectorName } from '../database/services/FiscalServicesService';
import {
  ServiceDocument,
  ServiceProcedure,
  ProcedureStep,
  getDocumentName,
  getProcedureName,
  getStepDescription,
} from '../database/services/ServiceDetailsService';
import { GradientHeader } from '../components/GradientHeader';
import { Icon, IconName } from '../components/Icon';
import { Colors, Spacing, BorderRadius, Shadows } from '../theme';
import { dataCacheService } from '../services/DataCacheService';

export interface ServiceDetailScreenProps {
  service: FiscalService;
  language: 'es' | 'fr' | 'en';
  onBack?: () => void;
  onCalculate?: (service: FiscalService) => void;
}

const TEXTS = {
  es: {
    title: 'Detalles',
    pricing: 'Tarifas',
    expedition: 'Expedición',
    renewal: 'Renovación',
    documents: 'Documentos',
    procedures: 'Procedimientos',
    information: 'Información',
    category: 'Categoría',
    sector: 'Sector',
    ministry: 'Ministerio',
    calculate: 'Calcular Costo',
    noDocuments: 'No hay documentos',
    noProcedures: 'No hay procedimientos',
    steps: 'pasos',
  },
  fr: {
    title: 'Détails',
    pricing: 'Tarifs',
    expedition: 'Expédition',
    renewal: 'Renouvellement',
    documents: 'Documents',
    procedures: 'Procédures',
    information: 'Information',
    category: 'Catégorie',
    sector: 'Secteur',
    ministry: 'Ministère',
    calculate: 'Calculer le Coût',
    noDocuments: 'Aucun document',
    noProcedures: 'Aucune procédure',
    steps: 'étapes',
  },
  en: {
    title: 'Details',
    pricing: 'Pricing',
    expedition: 'Expedition',
    renewal: 'Renewal',
    documents: 'Documents',
    procedures: 'Procedures',
    information: 'Information',
    category: 'Category',
    sector: 'Sector',
    ministry: 'Ministry',
    calculate: 'Calculate Cost',
    noDocuments: 'No documents',
    noProcedures: 'No procedures',
    steps: 'steps',
  },
};

interface InfoCardProps {
  icon: IconName;
  iconColor: string;
  iconBgColor: string;
  title: string;
  children: React.ReactNode;
}

const InfoCard: React.FC<InfoCardProps> = ({ icon, iconColor, iconBgColor, title, children }) => (
  <View style={styles.card}>
    <View style={styles.cardHeader}>
      <View style={[styles.iconCircle, { backgroundColor: iconBgColor }]}>
        <Icon name={icon} size={24} color={iconColor} />
      </View>
      <Text style={styles.cardTitle}>{title}</Text>
    </View>
    <View style={styles.cardContent}>
      {children}
    </View>
  </View>
);

export const ServiceDetailScreen: React.FC<ServiceDetailScreenProps> = ({
  service,
  language,
  onBack,
  onCalculate,
}) => {
  const t = TEXTS[language];
  const [documents, setDocuments] = useState<ServiceDocument[]>([]);
  const [procedures, setProcedures] = useState<ServiceProcedure[]>([]);
  const [procedureSteps, setProcedureSteps] = useState<Map<string, ProcedureStep[]>>(new Map());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadServiceDetails();
  }, [service.id]);

  const loadServiceDetails = async () => {
    const startTime = Date.now();
    try {
      setIsLoading(true);
      const details = await dataCacheService.getServiceDetails(service.id);

      // Process documents and procedures in parallel
      const [expandedDocuments, expandedProcedures] = await Promise.all([
        Promise.resolve(details.documents.flatMap(doc => {
          const namesEs = doc.document_name.split(',').map((n: string) => n.trim()).filter((n: string) => n.length > 0);
          const namesFr = doc.document_name_fr ? doc.document_name_fr.split(',').map((n: string) => n.trim()).filter((n: string) => n.length > 0) : [];
          const namesEn = doc.document_name_en ? doc.document_name_en.split(',').map((n: string) => n.trim()).filter((n: string) => n.length > 0) : [];
          const maxLength = namesEs.length;

          if (maxLength > 1) {
            return Array.from({ length: maxLength }, (_, i) => ({
              ...doc,
              document_name: (namesEs[i] || namesEs[0] || '').replace(/^[-\s]+/, '').replace(/^\d+[\.\-]\s*/, '').trim(),
              document_name_fr: namesFr[i] ? namesFr[i].replace(/^[-\s]+/, '').replace(/^\d+[\.\-]\s*/, '').trim() : undefined,
              document_name_en: namesEn[i] ? namesEn[i].replace(/^[-\s]+/, '').replace(/^\d+[\.\-]\s*/, '').trim() : undefined,
              document_code: `${doc.document_code}-${i + 1}`,
            }));
          }

          return [{
            ...doc,
            document_name: namesEs[0].replace(/^[-\s]+/, '').replace(/^\d+[\.\-]\s*/, '').trim(),
            document_name_fr: namesFr[0] ? namesFr[0].replace(/^[-\s]+/, '').replace(/^\d+[\.\-]\s*/, '').trim() : undefined,
            document_name_en: namesEn[0] ? namesEn[0].replace(/^[-\s]+/, '').replace(/^\d+[\.\-]\s*/, '').trim() : undefined,
          }];
        })),

        Promise.resolve(details.procedures.flatMap(proc => {
          const namesEs = proc.name_es.split(',').map((n: string) => n.trim()).filter((n: string) => n.length > 0);
          const namesFr = proc.name_fr ? proc.name_fr.split(',').map((n: string) => n.trim()).filter((n: string) => n.length > 0) : [];
          const namesEn = proc.name_en ? proc.name_en.split(',').map((n: string) => n.trim()).filter((n: string) => n.length > 0) : [];
          const maxLength = namesEs.length;

          if (maxLength > 1) {
            return Array.from({ length: maxLength }, (_, i) => ({
              ...proc,
              name_es: (namesEs[i] || namesEs[0] || '').replace(/^[-\s]+/, '').replace(/^\d+[\.\-]\s*/, '').trim(),
              name_fr: namesFr[i] ? namesFr[i].replace(/^[-\s]+/, '').replace(/^\d+[\.\-]\s*/, '').trim() : undefined,
              name_en: namesEn[i] ? namesEn[i].replace(/^[-\s]+/, '').replace(/^\d+[\.\-]\s*/, '').trim() : undefined,
              template_code: `${proc.template_code}-${i + 1}`,
            }));
          }

          return [{
            ...proc,
            name_es: namesEs[0].replace(/^[-\s]+/, '').replace(/^\d+[\.\-]\s*/, '').trim(),
            name_fr: namesFr[0] ? namesFr[0].replace(/^[-\s]+/, '').replace(/^\d+[\.\-]\s*/, '').trim() : undefined,
            name_en: namesEn[0] ? namesEn[0].replace(/^[-\s]+/, '').replace(/^\d+[\.\-]\s*/, '').trim() : undefined,
          }];
        })),
      ]);

      setDocuments(expandedDocuments);
      setProcedures(expandedProcedures);
      setProcedureSteps(details.procedureSteps);
      console.log(`[ServiceDetailScreen] ⚡ Loaded in ${Date.now() - startTime}ms`);
    } catch (error) {
      console.error('[ServiceDetailScreen] Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatAmount = (amount: number): string => {
    return amount.toLocaleString('es-GQ', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
  };

  // Group documents by type
  const expeditionDocs = useMemo(() =>
    documents.filter(doc => doc.is_required_expedition && !doc.is_required_renewal),
    [documents]
  );
  const renewalDocs = useMemo(() =>
    documents.filter(doc => doc.is_required_renewal && !doc.is_required_expedition),
    [documents]
  );
  const bothDocs = useMemo(() =>
    documents.filter(doc => doc.is_required_expedition && doc.is_required_renewal),
    [documents]
  );

  // Group procedures
  const expeditionProcs = useMemo(() =>
    procedures.filter(proc => proc.applies_to === 'expedition'),
    [procedures]
  );
  const renewalProcs = useMemo(() =>
    procedures.filter(proc => proc.applies_to === 'renewal'),
    [procedures]
  );
  const bothProcs = useMemo(() =>
    procedures.filter(proc => proc.applies_to === 'both'),
    [procedures]
  );

  const renderDocumentList = (docs: ServiceDocument[], type: string) => {
    if (docs.length === 0) return null;

    return (
      <View style={styles.listSection}>
        {type && <Text style={styles.listSectionTitle}>{type}</Text>}
        {docs.map((doc, index) => (
          <View key={`${doc.document_code}-${index}`} style={styles.listItem}>
            <View style={styles.listItemBullet} />
            <Text style={styles.listItemText}>{getDocumentName(doc, language)}</Text>
          </View>
        ))}
      </View>
    );
  };

  const renderProcedureList = (procs: ServiceProcedure[], type: string) => {
    if (procs.length === 0) return null;

    return (
      <View style={styles.listSection}>
        {type && <Text style={styles.listSectionTitle}>{type}</Text>}
        {procs.map((proc, index) => {
          const steps = procedureSteps.get(proc.id);
          const stepCount = steps ? steps.length : 0;

          return (
            <View key={`${proc.template_code}-${index}`} style={styles.procedureItem}>
              <View style={styles.procedureHeader}>
                <View style={styles.listItemBullet} />
                <Text style={styles.listItemText}>{getProcedureName(proc, language)}</Text>
              </View>
              {stepCount > 0 && (
                <Text style={styles.stepCount}>  {stepCount} {t.steps}</Text>
              )}
            </View>
          );
        })}
      </View>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <GradientHeader title={t.title} onBack={onBack} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <GradientHeader title={t.title} onBack={onBack} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section */}
        <View style={styles.hero}>
          <View style={[styles.heroIcon, { backgroundColor: Colors.iconBackground.blue }]}>
            <Icon name="document" size={40} color={Colors.primary} />
          </View>
          <Text style={styles.heroTitle}>{getServiceName(service, language)}</Text>
          {getServiceDescription(service, language) && (
            <Text style={styles.heroDescription}>{getServiceDescription(service, language)}</Text>
          )}
        </View>

        {/* Pricing Card */}
        <InfoCard
          icon="calculator"
          iconColor="#FF9800"
          iconBgColor={Colors.iconBackground.orange}
          title={t.pricing}
        >
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>{t.expedition}</Text>
            <Text style={styles.priceValue}>{formatAmount(service.tasa_expedicion)} XAF</Text>
          </View>
          {service.tasa_renovacion && service.tasa_renovacion > 0 && (
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>{t.renewal}</Text>
              <Text style={styles.priceValue}>{formatAmount(service.tasa_renovacion)} XAF</Text>
            </View>
          )}
        </InfoCard>

        {/* Documents Card */}
        {(expeditionDocs.length > 0 || renewalDocs.length > 0 || bothDocs.length > 0) && (
          <InfoCard
            icon="document"
            iconColor="#2196F3"
            iconBgColor={Colors.iconBackground.blue}
            title={t.documents}
          >
            {renderDocumentList(bothDocs, '')}
            {renderDocumentList(expeditionDocs, expeditionDocs.length > 0 && bothDocs.length > 0 ? t.expedition : '')}
            {renderDocumentList(renewalDocs, renewalDocs.length > 0 && (bothDocs.length > 0 || expeditionDocs.length > 0) ? t.renewal : '')}
            {documents.length === 0 && (
              <Text style={styles.emptyText}>{t.noDocuments}</Text>
            )}
          </InfoCard>
        )}

        {/* Procedures Card */}
        {(expeditionProcs.length > 0 || renewalProcs.length > 0 || bothProcs.length > 0) && (
          <InfoCard
            icon="edit"
            iconColor="#4CAF50"
            iconBgColor={Colors.iconBackground.green}
            title={t.procedures}
          >
            {renderProcedureList(bothProcs, '')}
            {renderProcedureList(expeditionProcs, expeditionProcs.length > 0 && bothProcs.length > 0 ? t.expedition : '')}
            {renderProcedureList(renewalProcs, renewalProcs.length > 0 && (bothProcs.length > 0 || expeditionProcs.length > 0) ? t.renewal : '')}
            {procedures.length === 0 && (
              <Text style={styles.emptyText}>{t.noProcedures}</Text>
            )}
          </InfoCard>
        )}

        {/* Information Card */}
        <InfoCard
          icon="info"
          iconColor="#9C27B0"
          iconBgColor={Colors.iconBackground.purple}
          title={t.information}
        >
          {getCategoryName(service, language) && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>{t.category}</Text>
              <Text style={styles.infoValue}>{getCategoryName(service, language)}</Text>
            </View>
          )}
          {getSectorName(service, language) && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>{t.sector}</Text>
              <Text style={styles.infoValue}>{getSectorName(service, language)}</Text>
            </View>
          )}
          {getMinistryName(service, language) && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>{t.ministry}</Text>
              <Text style={styles.infoValue}>{getMinistryName(service, language)}</Text>
            </View>
          )}
        </InfoCard>

        {/* Calculate Button */}
        {onCalculate && (
          <TouchableOpacity
            style={styles.calculateButton}
            onPress={() => onCalculate(service)}
            activeOpacity={0.8}
          >
            <Icon name="calculator" size={24} color="#FFFFFF" />
            <Text style={styles.calculateButtonText}>{t.calculate}</Text>
          </TouchableOpacity>
        )}

        {/* Bottom Spacing */}
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.secondary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Hero Section (One UI 14 style)
  hero: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    marginBottom: Spacing.md,
  },
  heroIcon: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.xl,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.text.primary,
    textAlign: 'center',
    marginBottom: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  heroDescription: {
    fontSize: 16,
    color: Colors.text.secondary,
    textAlign: 'center',
    paddingHorizontal: Spacing.lg,
    lineHeight: 24,
  },

  // Card Style (One UI 14)
  card: {
    backgroundColor: Colors.background.card,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    ...Shadows.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.round,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text.primary,
    flex: 1,
  },
  cardContent: {
    // Content area
  },

  // Price Row
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral.gray200,
  },
  priceLabel: {
    fontSize: 16,
    color: Colors.text.secondary,
    fontWeight: '500',
  },
  priceValue: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.primary,
  },

  // List Section
  listSection: {
    marginBottom: Spacing.md,
  },
  listSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing.sm,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: Spacing.sm,
  },
  listItemBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primary,
    marginTop: 8,
    marginRight: Spacing.md,
  },
  listItemText: {
    flex: 1,
    fontSize: 15,
    color: Colors.text.primary,
    lineHeight: 22,
  },

  // Procedure Item
  procedureItem: {
    marginBottom: Spacing.sm,
  },
  procedureHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  stepCount: {
    fontSize: 13,
    color: Colors.text.tertiary,
    marginLeft: 18,
    marginTop: 4,
  },

  // Info Row
  infoRow: {
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral.gray200,
  },
  infoLabel: {
    fontSize: 13,
    color: Colors.text.secondary,
    marginBottom: 4,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 16,
    color: Colors.text.primary,
    fontWeight: '400',
  },

  // Empty State
  emptyText: {
    fontSize: 15,
    color: Colors.text.tertiary,
    textAlign: 'center',
    paddingVertical: Spacing.lg,
  },

  // Calculate Button (One UI 14 style)
  calculateButton: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.xl,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.lg,
    marginTop: Spacing.md,
  },
  calculateButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginLeft: Spacing.md,
  },
});

export default ServiceDetailScreen;
