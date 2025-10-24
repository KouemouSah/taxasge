/**
 * TaxasGE Mobile - Service Detail Screen
 * Displays complete details of a fiscal service for data validation
 * Date: 2025-10-17
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { FiscalService, getServiceName, getServiceDescription, getMinistryName, getCategoryName, getSectorName } from '../database/services/FiscalServicesService';
import {
  serviceDetailsService,
  ServiceDocument,
  ServiceProcedure,
  ProcedureStep,
  getDocumentName,
  getProcedureName,
  getStepDescription,
  getStepInstructions
} from '../database/services/ServiceDetailsService';

export interface ServiceDetailScreenProps {
  service: FiscalService;
  language: 'es' | 'fr' | 'en';
  onBack?: () => void;
  onCalculate?: (service: FiscalService) => void;
}

const TEXTS = {
  es: {
    title: 'Detalles del Servicio',
    description: 'Descripción',
    code: 'Código',
    pricing: 'Tarifas',
    expedition: 'Expedición',
    renewal: 'Renovación',
    calculationMethod: 'Método de Cálculo',
    categorySection: 'Categoría',
    category: 'Categoría',
    sector: 'Sector',
    ministry: 'Ministerio',
    documents: 'Documentos Requeridos',
    documentsExpedition: 'Documentos Requeridos - Expedición',
    documentsRenewal: 'Documentos Requeridos - Renovación',
    documentsBoth: 'Documentos Requeridos - Expedición y Renovación',
    procedures: 'Procedimientos',
    proceduresExpedition: 'Procedimientos - Expedición',
    proceduresRenewal: 'Procedimientos - Renovación',
    proceduresBoth: 'Procedimientos - Expedición y Renovación',
    noDocuments: 'No hay documentos registrados',
    noProcedures: 'No hay procedimientos registrados',
    steps: 'pasos',
    estimatedDuration: 'Duración estimada',
    location: 'Localización',
    officeHours: 'Horas de apertura',
    minutes: 'minutos',
    calculate: 'Calcular',
  },
  fr: {
    title: 'Détails du Service',
    description: 'Description',
    code: 'Code',
    pricing: 'Tarifs',
    expedition: 'Expédition',
    renewal: 'Renouvellement',
    calculationMethod: 'Méthode de Calcul',
    categorySection: 'Catégorie',
    category: 'Catégorie',
    sector: 'Secteur',
    ministry: 'Ministère',
    documents: 'Documents Requis',
    documentsExpedition: 'Documents Requis - Expédition',
    documentsRenewal: 'Documents Requis - Renouvellement',
    documentsBoth: 'Documents Requis - Expédition et Renouvellement',
    procedures: 'Procédures',
    proceduresExpedition: 'Procédures - Expédition',
    proceduresRenewal: 'Procédures - Renouvellement',
    proceduresBoth: 'Procédures - Expédition et Renouvellement',
    noDocuments: 'Aucun document enregistré',
    noProcedures: 'Aucune procédure enregistrée',
    steps: 'étapes',
    estimatedDuration: 'Durée estimée',
    location: 'Localisation',
    officeHours: "Heures d'ouverture",
    minutes: 'minutes',
    calculate: 'Calculer',
  },
  en: {
    title: 'Service Details',
    description: 'Description',
    code: 'Code',
    pricing: 'Pricing',
    expedition: 'Expedition',
    renewal: 'Renewal',
    calculationMethod: 'Calculation Method',
    categorySection: 'Category',
    category: 'Category',
    sector: 'Sector',
    ministry: 'Ministry',
    documents: 'Required Documents',
    documentsExpedition: 'Required Documents - Expedition',
    documentsRenewal: 'Required Documents - Renewal',
    documentsBoth: 'Required Documents - Expedition and Renewal',
    procedures: 'Procedures',
    proceduresExpedition: 'Procedures - Expedition',
    proceduresRenewal: 'Procedures - Renewal',
    proceduresBoth: 'Procedures - Expedition and Renewal',
    noDocuments: 'No documents registered',
    noProcedures: 'No procedures registered',
    steps: 'steps',
    estimatedDuration: 'Estimated duration',
    location: 'Location',
    officeHours: 'Office hours',
    minutes: 'minutes',
    calculate: 'Calculate',
  },
};

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
  const [isLoadingDetails, setIsLoadingDetails] = useState(true);

  useEffect(() => {
    loadServiceDetails();
  }, [service.id]);

  const loadServiceDetails = async () => {
    const startTime = Date.now();
    try {
      setIsLoadingDetails(true);
      console.log('[ServiceDetailScreen] Loading details for service:', service.id);
      const queryStart = Date.now();
      const details = await serviceDetailsService.getCompleteDetails(service.id);
      console.log(`[ServiceDetailScreen] ⏱️  Query took ${Date.now() - queryStart}ms`);

      // Split documents that contain commas into separate entries
      const expandedDocuments: ServiceDocument[] = [];
      details.documents.forEach(doc => {
        // Split all language versions (es, fr, en)
        const namesEs = doc.document_name.split(',').map(n => n.trim()).filter(n => n.length > 0);
        const namesFr = doc.document_name_fr ? doc.document_name_fr.split(',').map(n => n.trim()).filter(n => n.length > 0) : [];
        const namesEn = doc.document_name_en ? doc.document_name_en.split(',').map(n => n.trim()).filter(n => n.length > 0) : [];

        // Use the longest array to determine how many documents we have
        const maxLength = Math.max(namesEs.length, namesFr.length, namesEn.length);

        if (maxLength > 1) {
          // Multiple documents in one line - split them
          for (let i = 0; i < maxLength; i++) {
            const cleanNameEs = (namesEs[i] || namesEs[0] || '').replace(/^[-\s]+/, '').replace(/^\d+[\.\-]\s*/, '').trim();
            const cleanNameFr = (namesFr[i] || '').replace(/^[-\s]+/, '').replace(/^\d+[\.\-]\s*/, '').trim();
            const cleanNameEn = (namesEn[i] || '').replace(/^[-\s]+/, '').replace(/^\d+[\.\-]\s*/, '').trim();

            expandedDocuments.push({
              ...doc,
              document_name: cleanNameEs,
              document_name_fr: cleanNameFr || undefined,
              document_name_en: cleanNameEn || undefined,
              document_code: `${doc.document_code}-${i + 1}`,
            });
          }
        } else {
          // Single document - also clean it
          const cleanNameEs = namesEs[0].replace(/^[-\s]+/, '').replace(/^\d+[\.\-]\s*/, '').trim();
          const cleanNameFr = namesFr[0] ? namesFr[0].replace(/^[-\s]+/, '').replace(/^\d+[\.\-]\s*/, '').trim() : undefined;
          const cleanNameEn = namesEn[0] ? namesEn[0].replace(/^[-\s]+/, '').replace(/^\d+[\.\-]\s*/, '').trim() : undefined;

          expandedDocuments.push({
            ...doc,
            document_name: cleanNameEs,
            document_name_fr: cleanNameFr,
            document_name_en: cleanNameEn,
          });
        }
      });

      // Split procedures that contain commas into separate entries
      const expandedProcedures: ServiceProcedure[] = [];
      details.procedures.forEach(proc => {
        // Split all language versions (es, fr, en)
        const namesEs = proc.procedure_name.split(',').map(n => n.trim()).filter(n => n.length > 0);
        const namesFr = proc.procedure_name_fr ? proc.procedure_name_fr.split(',').map(n => n.trim()).filter(n => n.length > 0) : [];
        const namesEn = proc.procedure_name_en ? proc.procedure_name_en.split(',').map(n => n.trim()).filter(n => n.length > 0) : [];

        // Use the longest array to determine how many procedures we have
        const maxLength = Math.max(namesEs.length, namesFr.length, namesEn.length);

        if (maxLength > 1) {
          // Multiple procedures in one line - split them
          for (let i = 0; i < maxLength; i++) {
            const cleanNameEs = (namesEs[i] || namesEs[0] || '').replace(/^[-\s]+/, '').replace(/^\d+[\.\-]\s*/, '').trim();
            const cleanNameFr = (namesFr[i] || '').replace(/^[-\s]+/, '').replace(/^\d+[\.\-]\s*/, '').trim();
            const cleanNameEn = (namesEn[i] || '').replace(/^[-\s]+/, '').replace(/^\d+[\.\-]\s*/, '').trim();

            expandedProcedures.push({
              ...proc,
              procedure_name: cleanNameEs,
              procedure_name_fr: cleanNameFr || undefined,
              procedure_name_en: cleanNameEn || undefined,
              template_code: `${proc.template_code}-${i + 1}`,
              // Don't show steps_count for split procedures - it's not accurate
              steps_count: 0,
            });
          }
        } else {
          // Single procedure - also clean it
          const cleanNameEs = namesEs[0].replace(/^[-\s]+/, '').replace(/^\d+[\.\-]\s*/, '').trim();
          const cleanNameFr = namesFr[0] ? namesFr[0].replace(/^[-\s]+/, '').replace(/^\d+[\.\-]\s*/, '').trim() : undefined;
          const cleanNameEn = namesEn[0] ? namesEn[0].replace(/^[-\s]+/, '').replace(/^\d+[\.\-]\s*/, '').trim() : undefined;

          expandedProcedures.push({
            ...proc,
            procedure_name: cleanNameEs,
            procedure_name_fr: cleanNameFr,
            procedure_name_en: cleanNameEn,
            // Keep the original steps_count for unsplit procedures
          });
        }
      });

      setDocuments(expandedDocuments);
      setProcedures(expandedProcedures);
      setProcedureSteps(details.procedureSteps);
      console.log(`[ServiceDetailScreen] Loaded ${expandedDocuments.length} documents (from ${details.documents.length}) and ${expandedProcedures.length} procedures (from ${details.procedures.length}) with ${details.procedureSteps.size} procedure templates`);
      console.log(`[ServiceDetailScreen] ⏱️  Total load time: ${Date.now() - startTime}ms`);
    } catch (error) {
      console.error('[ServiceDetailScreen] Error loading details:', error);
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const formatAmount = (amount: number): string => {
    return amount.toLocaleString('es-GQ', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
  };

  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString(language === 'es' ? 'es-ES' : language === 'fr' ? 'fr-FR' : 'en-US');
    } catch {
      return dateString;
    }
  };

  // Group documents by type
  const expeditionDocs = documents.filter(doc => doc.is_required_expedition && !doc.is_required_renewal);
  const renewalDocs = documents.filter(doc => doc.is_required_renewal && !doc.is_required_expedition);
  const bothDocs = documents.filter(doc => doc.is_required_expedition && doc.is_required_renewal);

  // Group procedures by type with deduplication
  const expeditionProcs = procedures.filter(proc => proc.applies_to === 'expedition');
  const renewalProcs = procedures.filter(proc => proc.applies_to === 'renewal');
  const bothProcs = procedures.filter(proc => proc.applies_to === 'both');

  // Deduplicate: if expedition and renewal have IDENTICAL procedures, move them to "both"
  const deduplicatedExpeditionProcs: ServiceProcedure[] = [];
  const deduplicatedRenewalProcs: ServiceProcedure[] = [];
  const deduplicatedBothProcs = [...bothProcs];

  expeditionProcs.forEach(expProc => {
    // Find if same procedure exists in renewal
    const matchingRenewalIndex = renewalProcs.findIndex(
      renProc => renProc.procedure_name.trim().toLowerCase() === expProc.procedure_name.trim().toLowerCase() &&
                 renProc.template_code.split('-')[0] === expProc.template_code.split('-')[0]
    );

    if (matchingRenewalIndex !== -1) {
      // Found duplicate - add to "both" only once
      const isDuplicateInBoth = deduplicatedBothProcs.some(
        bothProc => bothProc.procedure_name.trim().toLowerCase() === expProc.procedure_name.trim().toLowerCase()
      );
      if (!isDuplicateInBoth) {
        deduplicatedBothProcs.push({ ...expProc, applies_to: 'both' });
      }
    } else {
      // No duplicate - keep in expedition
      deduplicatedExpeditionProcs.push(expProc);
    }
  });

  // Add remaining renewal procedures that weren't duplicates
  renewalProcs.forEach(renProc => {
    const isInBoth = deduplicatedBothProcs.some(
      bothProc => bothProc.procedure_name.trim().toLowerCase() === renProc.procedure_name.trim().toLowerCase()
    );
    if (!isInBoth) {
      deduplicatedRenewalProcs.push(renProc);
    }
  });

  // Group procedures by template_code base and render together
  const renderProcedureGroup = (procs: ServiceProcedure[], groupIndex: number) => {
    if (procs.length === 0) return null;

    // Get the base template code (without -1, -2 suffixes)
    const baseTemplateCode = procs[0].template_code.split('-')[0];
    const stepsFromDB = procedureSteps.get(baseTemplateCode) || procedureSteps.get(procs[0].template_code) || [];

    // Build final list of steps from ALL procedures in this group
    const allSteps: Array<{step_number: number, step: ProcedureStep | null, procName?: string}> = [];

    if (stepsFromDB.length === 0) {
      // No steps in DB - use procedure names as steps
      procs.forEach(proc => {
        const cleanProcName = getProcedureName(proc, language).replace(/^\d+[\.\-]\s*/, '').trim();
        allSteps.push({
          step_number: allSteps.length + 1,
          step: null,
          procName: cleanProcName
        });
      });
    } else {
      // Steps exist in DB - use them
      stepsFromDB.forEach(step => {
        allSteps.push({
          step_number: allSteps.length + 1,
          step: step,
          procName: undefined
        });
      });
    }

    // Calculate total duration and get location/hours info
    const totalDuration = stepsFromDB.reduce((sum, s) => sum + (s.estimated_duration_minutes || 0), 0);
    const locationInfo = stepsFromDB.find(s => s.location_address)?.location_address;
    const officeHoursInfo = stepsFromDB.find(s => s.office_hours)?.office_hours;

    // Render all steps
    return (
      <React.Fragment key={groupIndex}>
        {allSteps.map((stepData, stepIndex) => {
          const description = stepData.step
            ? getStepDescription(stepData.step, language).replace(/^\d+[\.\-]\s*/, '').trim()
            : stepData.procName || '';
          const instructions = stepData.step
            ? getStepInstructions(stepData.step, language)
            : undefined;

          return (
            <View key={`${groupIndex}-${stepIndex}`} style={styles.listItem}>
              <Text style={styles.listNumber}>{`${stepData.step_number}.`}</Text>
              <View style={styles.listContent}>
                <Text style={styles.listText}>{description}</Text>
                {instructions ? (
                  <Text style={styles.listDetail}>{instructions}</Text>
                ) : null}
              </View>
            </View>
          );
        })}

        {/* Additional info - Always display with labels */}
        <View style={styles.procedureInfo}>
          <Text style={styles.procedureInfoText}>
            {`${t.estimatedDuration}: ${totalDuration > 0 ? `${totalDuration} ${t.minutes}` : '—'}`}
          </Text>
          <Text style={styles.procedureInfoText}>
            {`${t.location}: ${locationInfo || '—'}`}
          </Text>
          <Text style={styles.procedureInfoText}>
            {`${t.officeHours}: ${officeHoursInfo || 'Lun-Ven : 08h - 16h'}`}
          </Text>
        </View>
      </React.Fragment>
    );
  };

  // Helper function to group procedures by base template_code
  const groupProceduresByTemplate = (procs: ServiceProcedure[]): ServiceProcedure[][] => {
    const groups: Map<string, ServiceProcedure[]> = new Map();

    procs.forEach(proc => {
      const baseTemplateCode = proc.template_code.split('-')[0];
      if (!groups.has(baseTemplateCode)) {
        groups.set(baseTemplateCode, []);
      }
      groups.get(baseTemplateCode)!.push(proc);
    });

    return Array.from(groups.values());
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={styles.header}>
        {onBack && (
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
        )}

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{t.title}</Text>
        </View>

        <View style={styles.headerRight} />
      </View>

      {/* Content */}
      <ScrollView contentContainerStyle={styles.content}>
        {/* Service Name & Ministry */}
        <View style={styles.titleSection}>
          <View style={styles.titleRow}>
            <Text style={styles.serviceName}>{getServiceName(service, language)}</Text>
            {service.ministry_color ? (
              <View style={[styles.ministryDot, { backgroundColor: service.ministry_color }]} />
            ) : null}
          </View>
          {getMinistryName(service, language) ? (
            <Text style={styles.ministryName}>{getMinistryName(service, language)}</Text>
          ) : null}
        </View>

        {/* Description */}
        {getServiceDescription(service, language) ? (
          <Section title={t.description}>
            <Text style={styles.descriptionText}>{getServiceDescription(service, language)}</Text>
          </Section>
        ) : null}

        {/* Pricing */}
        <Section title={t.pricing}>
          {(service.calculation_method &&
           service.calculation_method !== 'fixed_amount' &&
           service.calculation_method !== 'fixed_expedition' &&
           service.calculation_method !== 'fixed_renewal' &&
           service.calculation_method !== 'fixed_both') ? (
            <Field label={t.calculationMethod} value={service.calculation_method} />
          ) : null}
          <Field
            label={t.expedition}
            value={`${formatAmount(service.tasa_expedicion)} XAF`}
            highlight
          />
          {(service.tasa_renovacion && service.tasa_renovacion > 0) ? (
            <Field
              label={t.renewal}
              value={`${formatAmount(service.tasa_renovacion)} XAF`}
              highlight
            />
          ) : null}
          {/* Calculate Button - Only show for non-fixed calculation methods */}
          {(service.calculation_method &&
           service.calculation_method !== 'fixed_expedition' &&
           service.calculation_method !== 'fixed_renewal' &&
           service.calculation_method !== 'fixed_both' &&
           onCalculate) ? (
            <TouchableOpacity
              style={styles.calculateButton}
              onPress={() => onCalculate(service)}>
              <Text style={styles.calculateButtonText}>{t.calculate}</Text>
            </TouchableOpacity>
          ) : null}
        </Section>

        {/* Category Section */}
        <Section title={t.categorySection}>
          {getSectorName(service, language) ? <Field label={t.sector} value={getSectorName(service, language)!} /> : null}
          {getCategoryName(service, language) ? <Field value={getCategoryName(service, language)!} /> : null}
        </Section>

        {/* Documents - Both */}
        {bothDocs.length > 0 && (
          <Section title={t.documentsBoth}>
            {isLoadingDetails ? (
              <ActivityIndicator size="small" color="#007AFF" />
            ) : (
              bothDocs.map((doc, index) => (
                <View key={index} style={styles.listItem}>
                  <Text style={styles.listNumber}>{`${index + 1}.`}</Text>
                  <View style={styles.listContent}>
                    <Text style={styles.listText}>{getDocumentName(doc, language)}</Text>
                  </View>
                </View>
              ))
            )}
          </Section>
        )}

        {/* Documents - Expedition */}
        {expeditionDocs.length > 0 && (
          <Section title={t.documentsExpedition}>
            {isLoadingDetails ? (
              <ActivityIndicator size="small" color="#007AFF" />
            ) : (
              expeditionDocs.map((doc, index) => (
                <View key={index} style={styles.listItem}>
                  <Text style={styles.listNumber}>{`${index + 1}.`}</Text>
                  <View style={styles.listContent}>
                    <Text style={styles.listText}>{getDocumentName(doc, language)}</Text>
                  </View>
                </View>
              ))
            )}
          </Section>
        )}

        {/* Documents - Renewal */}
        {renewalDocs.length > 0 && (
          <Section title={t.documentsRenewal}>
            {isLoadingDetails ? (
              <ActivityIndicator size="small" color="#007AFF" />
            ) : (
              renewalDocs.map((doc, index) => (
                <View key={index} style={styles.listItem}>
                  <Text style={styles.listNumber}>{`${index + 1}.`}</Text>
                  <View style={styles.listContent}>
                    <Text style={styles.listText}>{getDocumentName(doc, language)}</Text>
                  </View>
                </View>
              ))
            )}
          </Section>
        )}

        {/* Procedures - Both */}
        {deduplicatedBothProcs.length > 0 && (
          <Section title={t.proceduresBoth}>
            {isLoadingDetails ? (
              <ActivityIndicator size="small" color="#007AFF" />
            ) : (
              groupProceduresByTemplate(deduplicatedBothProcs).map((group, groupIndex) =>
                renderProcedureGroup(group, groupIndex)
              )
            )}
          </Section>
        )}

        {/* Procedures - Expedition */}
        {deduplicatedExpeditionProcs.length > 0 && (
          <Section title={t.proceduresExpedition}>
            {isLoadingDetails ? (
              <ActivityIndicator size="small" color="#007AFF" />
            ) : (
              groupProceduresByTemplate(deduplicatedExpeditionProcs).map((group, groupIndex) =>
                renderProcedureGroup(group, groupIndex)
              )
            )}
          </Section>
        )}

        {/* Procedures - Renewal */}
        {deduplicatedRenewalProcs.length > 0 && (
          <Section title={t.proceduresRenewal}>
            {isLoadingDetails ? (
              <ActivityIndicator size="small" color="#007AFF" />
            ) : (
              groupProceduresByTemplate(deduplicatedRenewalProcs).map((group, groupIndex) =>
                renderProcedureGroup(group, groupIndex)
              )
            )}
          </Section>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

// Helper Components
const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>{title}</Text>
    {children}
  </View>
);

interface FieldProps {
  label?: string;
  value: string;
  mono?: boolean;
  multiline?: boolean;
  highlight?: boolean;
}

const Field: React.FC<FieldProps> = ({ label, value, mono, multiline, highlight }) => (
  <View style={styles.field}>
    {label && <Text style={styles.fieldLabel}>{label}</Text>}
    <Text
      style={[
        styles.fieldValue,
        mono && styles.fieldValueMono,
        multiline && styles.fieldValueMultiline,
        highlight && styles.fieldValueHighlight,
      ]}>
      {value || '—'}
    </Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  backButtonText: {
    fontSize: 24,
    color: '#007AFF',
    fontWeight: '600',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
  },
  headerRight: {
    width: 40,
  },

  // Content
  content: {
    padding: 16,
  },

  // Title Section
  titleSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  serviceName: {
    flex: 1,
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
    marginRight: 12,
  },
  ministryDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginTop: 4,
  },
  ministryName: {
    fontSize: 14,
    color: '#666',
  },

  // Section
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    paddingBottom: 8,
  },

  // Field
  field: {
    marginBottom: 12,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },
  fieldValue: {
    fontSize: 14,
    color: '#1A1A1A',
  },
  fieldValueMono: {
    fontFamily: 'monospace',
    fontSize: 12,
    color: '#333',
  },
  fieldValueMultiline: {
    lineHeight: 20,
  },
  fieldValueHighlight: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },

  // Description
  descriptionText: {
    fontSize: 14,
    color: '#1A1A1A',
    lineHeight: 20,
  },

  // List Items
  listItem: {
    flexDirection: 'row',
    marginBottom: 8,
    alignItems: 'flex-start',
  },
  listNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
    marginRight: 8,
    minWidth: 24,
  },
  listContent: {
    flex: 1,
  },
  listText: {
    fontSize: 14,
    color: '#1A1A1A',
    lineHeight: 20,
  },
  listDetail: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },

  // Procedure Container
  procedureContainer: {
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  procedureName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  procedureInfo: {
    marginTop: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F5F5F5',
  },
  procedureInfoText: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
  },

  // Calculate Button
  calculateButton: {
    marginTop: 16,
    paddingVertical: 14,
    paddingHorizontal: 20,
    backgroundColor: '#007AFF',
    borderRadius: 8,
    alignItems: 'center',
  },
  calculateButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

export default ServiceDetailScreen;
