/**
 * Workflow Selection Screen — Entry point for "Nouvelle demande"
 *
 * Shows available workflows grouped by category.
 * Citizen picks a workflow → navigates to wizard/create with workflow_code.
 *
 * Uses GET /service-requests/workflows (backend returns workflows list).
 */

import { useMemo } from 'react';
import { StyleSheet, View, SectionList, Pressable } from 'react-native';
import { Text, ActivityIndicator, Divider, IconButton } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useAppTheme } from '@core/theme';
import { useAvailableWorkflows } from '@modules/service-requests';
import type { WorkflowInfo } from '@modules/service-requests';

// ---------------------------------------------------------------------------
// Category config (icons + labels per language)
// ---------------------------------------------------------------------------

const CATEGORY_CONFIG: Record<string, {
  icon: string;
  es: string;
  fr: string;
  en: string;
  descEs: string;
  descFr: string;
  descEn: string;
}> = {
  IDENTIDAD: { icon: 'card-account-details', es: 'Identidad', fr: 'Identité', en: 'Identity', descEs: 'DIP, Pasaportes', descFr: 'DIP, Passeports', descEn: 'ID, Passports' },
  EXTRANJERIA: { icon: 'earth', es: 'Extranjería', fr: 'Immigration', en: 'Immigration', descEs: 'Visados, Residencia', descFr: 'Visas, Résidence', descEn: 'Visas, Residence' },
  VEHICULOS: { icon: 'car', es: 'Vehículos', fr: 'Véhicules', en: 'Vehicles', descEs: 'Matriculación, Inspección', descFr: 'Immatriculation, Inspection', descEn: 'Registration, Inspection' },
  CONTRATOS: { icon: 'file-sign', es: 'Contratos', fr: 'Contrats', en: 'Contracts', descEs: 'Legalización contratos', descFr: 'Légalisation contrats', descEn: 'Contract legalization' },
  CONDUCCION: { icon: 'card-account-details-outline', es: 'Conducción', fr: 'Conduite', en: 'Driving', descEs: 'Permisos de conducir', descFr: 'Permis de conduire', descEn: 'Driving licenses' },
  FUNCION_PUBLICA: { icon: 'badge-account', es: 'Función Pública', fr: 'Fonction Publique', en: 'Public Service', descEs: 'Certificados funcionarios', descFr: 'Certificats fonctionnaires', descEn: 'Civil servant certificates' },
  REGISTRO_CIVIL: { icon: 'book-open-variant', es: 'Registro Civil', fr: 'État Civil', en: 'Civil Registry', descEs: 'Nacimiento, Matrimonio', descFr: 'Naissance, Mariage', descEn: 'Birth, Marriage' },
  COMERCIO: { icon: 'store', es: 'Comercio', fr: 'Commerce', en: 'Commerce', descEs: 'Licencias comerciales', descFr: 'Licences commerciales', descEn: 'Commercial licenses' },
};

function getCategoryLabel(category: string, lang: string): string {
  const config = CATEGORY_CONFIG[category];
  if (!config) return category.replace(/_/g, ' ');
  return lang === 'fr' ? config.fr : lang === 'en' ? config.en : config.es;
}

function getCategoryDesc(category: string, lang: string): string {
  const config = CATEGORY_CONFIG[category];
  if (!config) return '';
  return lang === 'fr' ? config.descFr : lang === 'en' ? config.descEn : config.descEs;
}

function getCategoryIcon(category: string): string {
  return CATEGORY_CONFIG[category]?.icon ?? 'folder-outline';
}

/** Translate workflow name using i18n key, fallback to backend name */
function getWorkflowName(wf: WorkflowInfo, t: (key: string) => string): string {
  const key = `workflows.${wf.code}`;
  const translated = t(key);
  // If key not found (returns the key itself), use backend name
  return translated === key ? wf.service_name_es : translated;
}

/** Translate solicitud type */
function getSolicitudLabel(type: string, t: (key: string) => string): string {
  const key = `wizard.selection.${type}`;
  const translated = t(key);
  return translated === key ? type : translated;
}

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function SelectWorkflowScreen() {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const { colors, spacing } = useAppTheme();
  const lang = i18n.language;

  const { data: workflows, isLoading, isError } = useAvailableWorkflows();

  // Group workflows by category
  const sections = useMemo(() => {
    if (!workflows) return [];
    const grouped: Record<string, WorkflowInfo[]> = {};
    for (const wf of workflows) {
      const cat = wf.category || 'GENERAL';
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(wf);
    }
    return Object.entries(grouped).map(([category, data]) => ({
      title: getCategoryLabel(category, lang),
      icon: getCategoryIcon(category),
      data,
    }));
  }, [workflows, lang]);

  const handleSelectWorkflow = (wf: WorkflowInfo) => {
    router.push(`/wizard/create?workflow_code=${wf.code}` as never);
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, styles.centered, { backgroundColor: colors.background }]} edges={['top']}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  if (isError || !workflows) {
    return (
      <SafeAreaView style={[styles.container, styles.centered, { backgroundColor: colors.background }]} edges={['top']}>
        <MaterialCommunityIcons name="alert-circle-outline" size={48} color={colors.error} />
        <Text variant="bodyMedium" style={{ color: colors.onSurfaceVariant, marginTop: 12 }}>{t('common.error')}</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.topBar, { backgroundColor: colors.surface, borderBottomColor: colors.outlineVariant }]}>
        <IconButton icon="arrow-left" size={24} onPress={() => router.back()} />
        <Text variant="titleMedium" style={{ color: colors.onSurface, fontWeight: '600', flex: 1 }}>
          {t('wizard.selectWorkflow')}
        </Text>
      </View>

      <SectionList
        sections={sections}
        keyExtractor={(item) => item.code}
        contentContainerStyle={{ paddingBottom: 24 }}
        renderSectionHeader={({ section }) => (
          <View style={[styles.sectionHeader, { backgroundColor: colors.surfaceVariant, paddingHorizontal: spacing.md, paddingVertical: 10 }]}>
            <MaterialCommunityIcons
              name={section.icon as keyof typeof MaterialCommunityIcons.glyphMap}
              size={18}
              color={colors.primary}
            />
            <Text variant="titleSmall" style={{ color: colors.primary, fontWeight: '600', marginLeft: 8 }}>
              {section.title}
            </Text>
          </View>
        )}
        renderItem={({ item }) => (
          <>
            <Pressable
              style={styles.workflowRow}
              onPress={() => handleSelectWorkflow(item)}
              android_ripple={{ color: colors.primaryContainer }}
            >
              <View style={{ flex: 1 }}>
                <Text variant="bodyMedium" style={{ color: colors.onSurface, fontWeight: '500' }}>
                  {getWorkflowName(item, t)}
                </Text>
                <Text variant="labelSmall" style={{ color: colors.outline }}>
                  {item.allowed_solicitud_types.map((st) => getSolicitudLabel(st, t)).join(' · ')}
                </Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={20} color={colors.outline} />
            </Pressable>
            <Divider />
          </>
        )}
        ListEmptyComponent={
          <View style={styles.centered}>
            <Text variant="bodyMedium" style={{ color: colors.outline }}>{t('common.noResults')}</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  topBar: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center' },
  workflowRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 },
});
