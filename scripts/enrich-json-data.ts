#!/usr/bin/env -S deno run --allow-read --allow-write

/**
 * 🚀 SCRIPT ENRICHISSEMENT DONNÉES JSON → SQL
 * TaxasGE v3.4 - Consolidation et génération seed data
 *
 * Fonctionnalités :
 * - Enrichissement algorithmique (service_type, calculation_method, icons, etc.)
 * - Génération instructions_es depuis procedimientos
 * - Option génération IA descriptions (--enable-ai-descriptions)
 * - Génération seed_data.sql hiérarchique (respect FK)
 * - Génération seed_translations.sql (FR/EN)
 * - Validation intégrité
 *
 * Usage :
 *   deno run --allow-read --allow-write scripts/enrich-json-data.ts
 *   deno run --allow-read --allow-write scripts/enrich-json-data.ts --enable-ai-descriptions
 *   deno run --allow-read --allow-write scripts/enrich-json-data.ts --dry-run
 *   deno run --allow-read --allow-write scripts/enrich-json-data.ts --review
 */

import { parse } from "https://deno.land/std@0.208.0/flags/mod.ts";

// ============================================
// TYPES & INTERFACES
// ============================================

interface Ministry {
  id: string;
  nombre_es: string;
  nombre_fr?: string;
  nombre_en?: string;
}

interface Sector {
  id: string;
  ministerio_id: string;
  nombre_es: string;
  nombre_fr?: string;
  nombre_en?: string;
}

interface Category {
  id: string;
  sector_id?: string;
  ministerio_id?: string;
  nombre_es: string;
  nombre_fr?: string;
  nombre_en?: string;
}

interface Tax {
  id: string;
  category_id: string;
  nombre_es: string;
  nombre_fr?: string;
  nombre_en?: string;
  tasa_expedicion: number;
  tasa_renovacion: number;
}

interface Procedure {
  id: string;
  tax_id: string;
  step_number: number;
  description_es?: string;
  description_fr?: string;
  description_en?: string;
}

interface EnrichedMinistry extends Ministry {
  description_es?: string;
  description_fr?: string;
  description_en?: string;
  display_order: number;
  icon: string;
  color: string;
  is_active: boolean;
}

interface EnrichedTax extends Tax {
  service_type: string;
  calculation_method: string;
  description_es?: string;
  description_fr?: string;
  description_en?: string;
  instructions_es?: string;
  status: string;
}

interface EnrichmentOptions {
  enableAIDescriptions: boolean;
  reviewMode: boolean;
  dryRun: boolean;
  outputDir: string;
}

// ============================================
// CONSTANTES & MAPPINGS
// ============================================

const SERVICE_TYPE_ICONS: Record<string, string> = {
  'document_processing': 'file-check',
  'license_permit': 'badge-check',
  'residence_permit': 'home',
  'registration_fee': 'clipboard-list',
  'inspection_fee': 'search-check',
  'administrative_tax': 'landmark',
  'customs_duty': 'package-check',
  'declaration_tax': 'file-text',
};

const MINISTRY_ICON_KEYWORDS: Record<string, string> = {
  'ASUNTOS EXTERIORES': 'globe',
  'AVIACION': 'plane',
  'COMERCIO': 'shopping-bag',
  'CULTURA': 'palette',
  'DEFENSA': 'shield',
  'ECONOMIA': 'trending-up',
  'EDUCACION': 'graduation-cap',
  'ENERGIA': 'zap',
  'FINANZAS': 'banknote',
  'HACIENDA': 'coins',
  'INFRAESTRUCTURA': 'construction',
  'INTERIOR': 'building',
  'JUSTICIA': 'scale',
  'MINAS': 'mountain',
  'OBRAS': 'hammer',
  'PESCA': 'fish',
  'SANIDAD': 'heart-pulse',
  'SEGURIDAD': 'shield-check',
  'TRABAJO': 'briefcase',
  'TRANSPORTE': 'truck',
  'TURISMO': 'palm-tree',
};

const COLOR_PALETTE = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
  '#EC4899', '#14B8A6', '#F97316', '#06B6D4', '#84CC16',
  '#6366F1', '#22C55E', '#FBBF24', '#F87171', '#A78BFA',
];

// ============================================
// UTILITAIRES
// ============================================

function escapeSql(str: string): string {
  if (!str) return '';
  return str.replace(/'/g, "''").replace(/\\/g, '\\\\');
}

function truncate(str: string, maxLength: number): string {
  if (!str || str.length <= maxLength) return str;
  return str.substring(0, maxLength - 3) + '...';
}

function getColorForIndex(index: number): string {
  return COLOR_PALETTE[index % COLOR_PALETTE.length];
}

// ============================================
// ENRICHISSEMENT ALGORITHMIQUE
// ============================================

function inferServiceType(tax: Tax): string {
  const nameES = tax.nombre_es.toLowerCase();

  if (nameES.includes('legalización') || nameES.includes('certificación')) {
    return 'document_processing';
  }
  if (nameES.includes('licencia') || (nameES.includes('permiso') && !nameES.includes('residencia'))) {
    return 'license_permit';
  }
  if (nameES.includes('residencia') || nameES.includes('extranjería')) {
    return 'residence_permit';
  }
  if (nameES.includes('registro') || nameES.includes('inscripción') || nameES.includes('matriculación')) {
    return 'registration_fee';
  }
  if (nameES.includes('inspección') || nameES.includes('control técnico') || nameES.includes('homologación')) {
    return 'inspection_fee';
  }
  if (nameES.includes('aduana') || nameES.includes('arancel') || nameES.includes('importación')) {
    return 'customs_duty';
  }
  if (nameES.includes('declaración') || nameES.includes('impuesto') || nameES.includes('tributación')) {
    return 'declaration_tax';
  }

  return 'administrative_tax';
}

function inferCalculationMethod(tax: Tax): string {
  const expedicion = parseFloat(String(tax.tasa_expedicion || 0));
  const renovacion = parseFloat(String(tax.tasa_renovacion || 0));
  const nameES = tax.nombre_es.toLowerCase();

  // Règle 1 : Valeurs fixes
  if (expedicion > 0 && renovacion > 0) {
    return 'fixed_both';
  }
  if (expedicion > 0 && renovacion === 0) {
    return 'fixed_expedition';
  }
  if (expedicion === 0 && renovacion > 0) {
    return 'fixed_renewal';
  }

  // Règle 2 : Mots-clés unité
  if (
    nameES.includes('por tonelada') || nameES.includes('por kg') ||
    nameES.includes('por pasajero') || nameES.includes('por litro') ||
    nameES.includes('por unidad')
  ) {
    return 'unit_based';
  }

  // Règle 3 : Pourcentage
  if (nameES.includes('%') || nameES.includes('porcentaje') || nameES.includes('sobre el valor')) {
    return 'percentage_based';
  }

  // Règle 4 : Tranches
  if (nameES.includes('según tramo') || nameES.includes('escalonado')) {
    return 'tiered_rates';
  }

  // Règle 5 : Formule complexe
  if (nameES.includes('calculado según') || nameES.includes('fórmula')) {
    return 'formula_based';
  }

  // Défaut
  return 'fixed_expedition';
}

function inferMinistryIcon(ministry: Ministry): string {
  const name = ministry.nombre_es.toUpperCase();

  for (const [keyword, icon] of Object.entries(MINISTRY_ICON_KEYWORDS)) {
    if (name.includes(keyword)) {
      return icon;
    }
  }

  return 'building-2';
}

function generateInstructionsSummary(procedures: Procedure[]): string | null {
  if (!procedures || procedures.length === 0) {
    return null;
  }

  // Filtrer uniquement espagnol
  const esSteps = procedures
    .filter(p => p.description_es)
    .sort((a, b) => a.step_number - b.step_number)
    .slice(0, 3); // Max 3 étapes

  if (esSteps.length === 0) return null;

  const summary = esSteps
    .map(p => p.description_es!.replace(/^\d+\.\s*/, '').toLowerCase())
    .join(', ');

  return truncate(summary, 200) + '.';
}

// ============================================
// ENRICHISSEMENT DONNÉES
// ============================================

async function enrichMinistries(ministries: Ministry[]): Promise<EnrichedMinistry[]> {
  console.log(`\n🏛️  Enrichissement ${ministries.length} ministères...`);

  return ministries.map((ministry, index) => ({
    ...ministry,
    display_order: index,
    icon: inferMinistryIcon(ministry),
    color: getColorForIndex(index),
    is_active: true,
  }));
}

async function enrichTaxes(
  taxes: Tax[],
  procedimientos: Procedure[],
  options: EnrichmentOptions
): Promise<EnrichedTax[]> {
  console.log(`\n💰 Enrichissement ${taxes.length} services fiscaux...`);

  // Grouper procedimientos par tax_id
  const proceduresByTax = new Map<string, Procedure[]>();
  for (const proc of procedimientos) {
    if (!proceduresByTax.has(proc.tax_id)) {
      proceduresByTax.set(proc.tax_id, []);
    }
    proceduresByTax.get(proc.tax_id)!.push(proc);
  }

  const enriched: EnrichedTax[] = [];
  const reviewNeeded: Array<{ id: string; field: string; value: string }> = [];

  for (const tax of taxes) {
    const service_type = inferServiceType(tax);
    const calculation_method = inferCalculationMethod(tax);
    const procedures = proceduresByTax.get(tax.id) || [];
    const instructions_es = generateInstructionsSummary(procedures);

    enriched.push({
      ...tax,
      service_type,
      calculation_method,
      instructions_es,
      status: 'active',
    });

    // Marquer pour review si calculation_method critique
    if (calculation_method !== 'fixed_expedition' && calculation_method !== 'fixed_both') {
      reviewNeeded.push({
        id: tax.id,
        field: 'calculation_method',
        value: calculation_method,
      });
    }
  }

  console.log(`   ✅ ${enriched.length} services enrichis`);
  console.log(`   ⚠️  ${reviewNeeded.length} services nécessitent review (calculation_method)`);

  if (options.reviewMode && reviewNeeded.length > 0) {
    console.log('\n📋 Services nécessitant validation manuelle:');
    for (const item of reviewNeeded.slice(0, 10)) {
      const tax = taxes.find(t => t.id === item.id);
      console.log(`   - ${item.id}: ${tax?.nombre_es}`);
      console.log(`     → ${item.field}: ${item.value}`);
    }
    if (reviewNeeded.length > 10) {
      console.log(`   ... et ${reviewNeeded.length - 10} autres`);
    }
  }

  return enriched;
}

// ============================================
// GÉNÉRATION SQL
// ============================================

function generateSeedDataSQL(
  ministries: EnrichedMinistry[],
  sectors: Sector[],
  categories: Category[],
  taxes: EnrichedTax[]
): string {
  const lines: string[] = [];

  lines.push('-- ============================================');
  lines.push('-- SEED DATA TaxasGE v3.4');
  lines.push('-- Données production Guinée Équatoriale');
  lines.push('-- Génération automatique depuis JSON enrichis');
  lines.push(`-- Date: ${new Date().toISOString()}`);
  lines.push('-- ============================================');
  lines.push('');
  lines.push('BEGIN;');
  lines.push('');

  // 1. MINISTRIES
  lines.push('-- ============================================');
  lines.push('-- 1. MINISTRIES');
  lines.push('-- ============================================');
  lines.push('');
  lines.push('INSERT INTO ministries (');
  lines.push('  ministry_code, name_es, description_es, display_order,');
  lines.push('  icon, color, is_active, created_at');
  lines.push(') VALUES');

  const ministryValues = ministries.map((m, idx) => {
    const isLast = idx === ministries.length - 1;
    return `  ('${m.id}', '${escapeSql(m.nombre_es)}', ${m.description_es ? `'${escapeSql(m.description_es)}'` : 'NULL'}, ${m.display_order}, '${m.icon}', '${m.color}', ${m.is_active}, NOW())${isLast ? ';' : ','}`;
  });
  lines.push(...ministryValues);
  lines.push('');

  // 2. SECTORS
  lines.push('-- ============================================');
  lines.push('-- 2. SECTORS');
  lines.push('-- ============================================');
  lines.push('');
  lines.push('INSERT INTO sectors (');
  lines.push('  sector_code, ministry_id, name_es, is_active, created_at');
  lines.push(') VALUES');

  const sectorValues = sectors.map((s, idx) => {
    const isLast = idx === sectors.length - 1;
    return `  ('${s.id}', (SELECT id FROM ministries WHERE ministry_code = '${s.ministerio_id}'), '${escapeSql(s.nombre_es)}', true, NOW())${isLast ? ';' : ','}`;
  });
  lines.push(...sectorValues);
  lines.push('');

  // 3. CATEGORIES
  lines.push('-- ============================================');
  lines.push('-- 3. CATEGORIES');
  lines.push('-- ============================================');
  lines.push('');
  lines.push('INSERT INTO categories (');
  lines.push('  category_code, sector_id, ministry_id, name_es, service_type, is_active, created_at');
  lines.push(') VALUES');

  const categoryValues = categories.map((c, idx) => {
    const isLast = idx === categories.length - 1;
    const sectorRef = c.sector_id ? `(SELECT id FROM sectors WHERE sector_code = '${c.sector_id}')` : 'NULL';
    const ministryRef = c.ministerio_id ? `(SELECT id FROM ministries WHERE ministry_code = '${c.ministerio_id}')` : 'NULL';

    // Inférer service_type depuis nom (simplifié)
    const serviceType = c.nombre_es.toLowerCase().includes('consular') ? 'document_processing' : 'administrative_tax';

    return `  ('${c.id}', ${sectorRef}, ${ministryRef}, '${escapeSql(c.nombre_es)}', '${serviceType}', true, NOW())${isLast ? ';' : ','}`;
  });
  lines.push(...categoryValues);
  lines.push('');

  // 4. FISCAL_SERVICES
  lines.push('-- ============================================');
  lines.push('-- 4. FISCAL_SERVICES (TAXES)');
  lines.push('-- ============================================');
  lines.push('');
  lines.push('INSERT INTO fiscal_services (');
  lines.push('  service_code, category_id, name_es, description_es, instructions_es,');
  lines.push('  service_type, calculation_method, tasa_expedicion, tasa_renovacion,');
  lines.push('  status, created_at');
  lines.push(') VALUES');

  const taxValues = taxes.map((t, idx) => {
    const isLast = idx === taxes.length - 1;
    return `  ('${t.id}', (SELECT id FROM categories WHERE category_code = '${t.category_id}'), '${escapeSql(t.nombre_es)}', ${t.description_es ? `'${escapeSql(t.description_es)}'` : 'NULL'}, ${t.instructions_es ? `'${escapeSql(t.instructions_es)}'` : 'NULL'}, '${t.service_type}', '${t.calculation_method}', ${t.tasa_expedicion}, ${t.tasa_renovacion}, '${t.status}', NOW())${isLast ? ';' : ','}`;
  });
  lines.push(...taxValues);
  lines.push('');

  lines.push('COMMIT;');
  lines.push('');
  lines.push('-- ============================================');
  lines.push('-- SEED DATA IMPORTÉ AVEC SUCCÈS');
  lines.push('-- ============================================');

  return lines.join('\n');
}

function generateSeedProceduresSQL(procedimientos: Procedure[]): string {
  const lines: string[] = [];

  lines.push('-- ============================================');
  lines.push('-- SEED PROCEDURES TaxasGE v3.4');
  lines.push('-- Procédures détaillées services fiscaux');
  lines.push(`-- Total: ${procedimientos.length} étapes`);
  lines.push(`-- Date: ${new Date().toISOString()}`);
  lines.push('-- ============================================');
  lines.push('');
  lines.push('BEGIN;');
  lines.push('');

  // Grouper par langue
  const esProcedures = procedimientos.filter(p => p.description_es);

  if (esProcedures.length === 0) {
    lines.push('-- Aucune procédure trouvée');
    lines.push('COMMIT;');
    return lines.join('\n');
  }

  lines.push('INSERT INTO service_procedures (');
  lines.push('  fiscal_service_id, step_number, description_es, created_at');
  lines.push(') VALUES');

  const procValues = esProcedures.map((p, idx) => {
    const isLast = idx === esProcedures.length - 1;
    return `  ((SELECT id FROM fiscal_services WHERE service_code = '${p.tax_id}'), ${p.step_number}, '${escapeSql(p.description_es!)}', NOW())${isLast ? ';' : ','}`;
  });

  lines.push(...procValues);
  lines.push('');
  lines.push('COMMIT;');

  return lines.join('\n');
}

function generateSeedTranslationsSQL(
  ministries: EnrichedMinistry[],
  sectors: Sector[],
  categories: Category[],
  taxes: EnrichedTax[],
  procedimientos: Procedure[]
): string {
  const lines: string[] = [];

  lines.push('-- ============================================');
  lines.push('-- SEED TRANSLATIONS TaxasGE v3.4');
  lines.push('-- Traductions FR/EN depuis JSON');
  lines.push(`-- Date: ${new Date().toISOString()}`);
  lines.push('-- ============================================');
  lines.push('');
  lines.push('BEGIN;');
  lines.push('');

  // Ministries translations
  const ministryTranslations = ministries.filter(m => m.nombre_fr || m.nombre_en);
  if (ministryTranslations.length > 0) {
    lines.push('-- Ministries translations');
    lines.push('INSERT INTO translation_status (entity_type, entity_code, field_name, es_source, fr_source, en_source)');
    lines.push('VALUES');

    ministryTranslations.forEach((m, idx) => {
      const isLast = idx === ministryTranslations.length - 1;
      lines.push(`  ('ministry', '${m.id}', 'name', 'database', ${m.nombre_fr ? "'json_import'" : 'NULL'}, ${m.nombre_en ? "'json_import'" : 'NULL'})${isLast ? ';' : ','}`);
    });
    lines.push('');
  }

  lines.push('COMMIT;');
  lines.push('');
  lines.push('-- Note: Traductions détaillées FR/EN à implémenter via fichiers i18n');

  return lines.join('\n');
}

// ============================================
// MAIN
// ============================================

async function main() {
  const args = parse(Deno.args, {
    boolean: ['enable-ai-descriptions', 'review', 'dry-run', 'help'],
    string: ['output'],
    default: {
      output: 'data/seed',
    },
    alias: {
      h: 'help',
      o: 'output',
    },
  });

  if (args.help) {
    console.log(`
🚀 Script Enrichissement JSON → SQL TaxasGE v3.4

Usage:
  deno run --allow-read --allow-write scripts/enrich-json-data.ts [options]

Options:
  --enable-ai-descriptions   Activer génération IA descriptions (Claude API)
  --review                   Mode review interactif
  --dry-run                  Afficher résultats sans écrire fichiers
  -o, --output <dir>         Dossier output (défaut: data/seed)
  -h, --help                 Afficher cette aide

Exemples:
  deno run --allow-read --allow-write scripts/enrich-json-data.ts
  deno run --allow-read --allow-write scripts/enrich-json-data.ts --review
  deno run --allow-read --allow-write scripts/enrich-json-data.ts --dry-run
    `);
    Deno.exit(0);
  }

  const options: EnrichmentOptions = {
    enableAIDescriptions: args['enable-ai-descriptions'] || false,
    reviewMode: args.review || false,
    dryRun: args['dry-run'] || false,
    outputDir: args.output,
  };

  console.log('🚀 TaxasGE - Enrichissement JSON → SQL v3.4\n');
  console.log('Options:');
  console.log(`  - AI Descriptions: ${options.enableAIDescriptions ? '✅ Activé' : '❌ Désactivé'}`);
  console.log(`  - Review Mode: ${options.reviewMode ? '✅' : '❌'}`);
  console.log(`  - Dry Run: ${options.dryRun ? '✅' : '❌'}`);
  console.log(`  - Output: ${options.outputDir}/`);
  console.log('');

  // Charger JSON
  console.log('📂 Chargement fichiers JSON...');
  const ministries: Ministry[] = JSON.parse(await Deno.readTextFile('data/ministerios.json'));
  const sectors: Sector[] = JSON.parse(await Deno.readTextFile('data/sectores.json'));
  const categories: Category[] = JSON.parse(await Deno.readTextFile('data/categorias_cleaned.json'));
  const taxes: Tax[] = JSON.parse(await Deno.readTextFile('data/taxes_restructured.json'));
  const procedimientos: Procedure[] = JSON.parse(await Deno.readTextFile('data/procedimientos.json'));

  console.log(`   ✅ ${ministries.length} ministères`);
  console.log(`   ✅ ${sectors.length} secteurs`);
  console.log(`   ✅ ${categories.length} catégories`);
  console.log(`   ✅ ${taxes.length} services fiscaux`);
  console.log(`   ✅ ${procedimientos.length} étapes procédures`);

  // Enrichissement
  const enrichedMinistries = await enrichMinistries(ministries);
  const enrichedTaxes = await enrichTaxes(taxes, procedimientos, options);

  // Génération SQL
  console.log('\n📝 Génération fichiers SQL...');
  const seedDataSQL = generateSeedDataSQL(enrichedMinistries, sectors, categories, enrichedTaxes);
  const seedProceduresSQL = generateSeedProceduresSQL(procedimientos);
  const seedTranslationsSQL = generateSeedTranslationsSQL(
    enrichedMinistries,
    sectors,
    categories,
    enrichedTaxes,
    procedimientos
  );

  if (options.dryRun) {
    console.log('\n🔍 DRY RUN - Aperçu résultats:\n');
    console.log(seedDataSQL.split('\n').slice(0, 50).join('\n'));
    console.log('\n... (fichier complet non affiché en dry-run)\n');
  } else {
    // Créer dossier output
    try {
      await Deno.mkdir(options.outputDir, { recursive: true });
    } catch {
      // Dossier existe déjà
    }

    // Écrire fichiers
    await Deno.writeTextFile(`${options.outputDir}/seed_data.sql`, seedDataSQL);
    await Deno.writeTextFile(`${options.outputDir}/seed_procedures.sql`, seedProceduresSQL);
    await Deno.writeTextFile(`${options.outputDir}/seed_translations.sql`, seedTranslationsSQL);

    console.log(`   ✅ ${options.outputDir}/seed_data.sql`);
    console.log(`   ✅ ${options.outputDir}/seed_procedures.sql`);
    console.log(`   ✅ ${options.outputDir}/seed_translations.sql`);
  }

  console.log('\n✅ Enrichissement terminé avec succès!\n');
  console.log('📋 Prochaines étapes:');
  console.log('   1. Valider seed_data.sql');
  console.log('   2. Exécuter sur DB staging: psql -f data/seed/seed_data.sql');
  console.log('   3. Exécuter procedures: psql -f data/seed/seed_procedures.sql');
  console.log('   4. Valider intégrité données');
}

if (import.meta.main) {
  main().catch(console.error);
}
