#!/usr/bin/env node

/**
 * 🚀 SCRIPT ENRICHISSEMENT DONNÉES JSON → SQL
 * TaxasGE v3.4 - Consolidation et génération seed data
 *
 * Fonctionnalités :
 * - Enrichissement algorithmique (service_type, calculation_method, icons, etc.)
 * - Génération instructions_es depuis procedimientos
 * - Génération seed_data.sql hiérarchique (respect FK)
 * - Génération seed_procedures.sql
 * - Génération seed_translations.sql (FR/EN)
 *
 * Usage :
 *   node scripts/enrich-json-data.mjs
 *   node scripts/enrich-json-data.mjs --dry-run
 *   node scripts/enrich-json-data.mjs --review
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================
// CONSTANTES & MAPPINGS
// ============================================

const SERVICE_TYPE_ICONS = {
  'document_processing': 'file-check',
  'license_permit': 'badge-check',
  'residence_permit': 'home',
  'registration_fee': 'clipboard-list',
  'inspection_fee': 'search-check',
  'administrative_tax': 'landmark',
  'customs_duty': 'package-check',
  'declaration_tax': 'file-text',
};

const MINISTRY_ICON_KEYWORDS = {
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

function escapeSql(str) {
  if (!str) return '';
  return str.replace(/'/g, "''").replace(/\\/g, '\\\\');
}

function truncate(str, maxLength) {
  if (!str || str.length <= maxLength) return str;
  return str.substring(0, maxLength - 3) + '...';
}

function getColorForIndex(index) {
  return COLOR_PALETTE[index % COLOR_PALETTE.length];
}

// ============================================
// ENRICHISSEMENT ALGORITHMIQUE
// ============================================

function inferServiceType(tax) {
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

function inferCalculationMethod(tax) {
  const expedicion = parseFloat(String(tax.tasa_expedicion || 0));
  const renovacion = parseFloat(String(tax.tasa_renovacion || 0));
  const nameES = tax.nombre_es.toLowerCase();

  // Règle 0 : Service gratuit ou sans tarif défini (les deux à 0)
  // → Utiliser calculation_method qui ne nécessite pas de tarif fixe
  if (expedicion === 0 && renovacion === 0) {
    // Vérifier si c'est un service à coût variable
    if (
      nameES.includes('por tonelada') || nameES.includes('por kg') ||
      nameES.includes('por pasajero') || nameES.includes('por litro') ||
      nameES.includes('por unidad')
    ) {
      return 'unit_based';
    }
    if (nameES.includes('%') || nameES.includes('porcentaje') || nameES.includes('sobre el valor')) {
      return 'percentage_based';
    }
    if (nameES.includes('según tramo') || nameES.includes('escalonado')) {
      return 'tiered_rates';
    }
    if (nameES.includes('calculado según') || nameES.includes('fórmula')) {
      return 'formula_based';
    }
    // Par défaut : service gratuit ou à définir
    return 'formula_based'; // Permet tarif 0, sera à configurer manuellement
  }

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

  return 'fixed_expedition';
}

function inferMinistryIcon(ministry) {
  const name = ministry.nombre_es.toUpperCase();

  for (const [keyword, icon] of Object.entries(MINISTRY_ICON_KEYWORDS)) {
    if (name.includes(keyword)) {
      return icon;
    }
  }

  return 'building-2';
}

function extractPercentageInfo(tax) {
  const nameES = tax.nombre_es.toLowerCase();
  const nameEN = (tax.nombre_en || '').toLowerCase();
  const nameFR = (tax.nombre_fr || '').toLowerCase();

  // Pattern 1 : "X% sobre el valor..." ou "X% sur la valeur..." ou "X% on..."
  const percentRegex = /(\d+(?:\.\d+)?)\s*%\s*(?:sobre|sur|on|de|of|del?)\s+(?:el\s+)?(?:la\s+)?(valor|valeur|value|CIF|FOB|CAF|factura|invoice|contrat|contract|precio|price|montant|amount)/i;

  const matchES = nameES.match(percentRegex);
  const matchEN = nameEN.match(percentRegex);
  const matchFR = nameFR.match(percentRegex);

  const match = matchES || matchEN || matchFR;

  if (match) {
    const percentage = parseFloat(match[1]);
    const base = match[2]; // valor, value, CIF, etc.

    // Convertir en décimal (1% = 0.01)
    const basePercentage = percentage / 100;

    // Identifier la base de calcul en anglais (standard DB)
    let percentageOf = 'transaction_value';
    if (/CIF|CAF/i.test(nameES + nameEN + nameFR)) {
      percentageOf = 'CIF_value';
    } else if (/FOB/i.test(nameES + nameEN + nameFR)) {
      percentageOf = 'FOB_value';
    } else if (/factura|invoice/i.test(nameES + nameEN + nameFR)) {
      percentageOf = 'invoice_value';
    } else if (/contrat|contract/i.test(nameES + nameEN + nameFR)) {
      percentageOf = 'contract_value';
    } else if (/precio|price|montant|amount/i.test(nameES + nameEN + nameFR)) {
      percentageOf = 'price';
    }

    return {
      base_percentage: basePercentage,
      percentage_of: percentageOf,
    };
  }

  return {
    base_percentage: null,
    percentage_of: null,
  };
}

function generateInstructionsSummary(procedures) {
  if (!procedures || procedures.length === 0) {
    return null;
  }

  const esSteps = procedures
    .filter(p => p.description_es)
    .sort((a, b) => a.step_number - b.step_number)
    .slice(0, 3);

  if (esSteps.length === 0) return null;

  const summary = esSteps
    .map(p => p.description_es.replace(/^\d+\.\s*/, '').toLowerCase())
    .join(', ');

  return truncate(summary, 200) + '.';
}

// ============================================
// DÉTECTION GROUPES DE TRANCHES
// ============================================

function detectTierGroups(taxesByCategory) {
  const tierGroups = [];

  // Regex pour détecter intervalles : "101 a 1000", "1001-10000", "10 à 100", etc.
  const rangeRegex = /(\d+(?:[.,]\d+)?)\s*(?:a|à|-|de)\s*(\d+(?:[.,]\d+)?)\s*(m[2²³]|kg|tonne|tonelada|hectare|ha|litro|pasajero)?/i;
  const openEndRegex = /(?:más de|plus de|more than|de)\s*(\d+(?:[.,]\d+)?)\s*(?:en adelante|et plus|onwards)?/i;

  for (const [categoryId, taxes] of Object.entries(taxesByCategory)) {
    if (taxes.length < 2) continue; // Besoin d'au moins 2 services pour un groupe

    const withRanges = taxes
      .map(t => {
        const match = t.nombre_es.match(rangeRegex);
        const openMatch = t.nombre_es.match(openEndRegex);

        if (match) {
          return {
            ...t,
            tier_min: parseFloat(match[1].replace(',', '.')),
            tier_max: parseFloat(match[2].replace(',', '.')),
            tier_unit: (match[3] || 'm2').toLowerCase().replace('²', '2').replace('³', '3')
          };
        } else if (openMatch) {
          return {
            ...t,
            tier_min: parseFloat(openMatch[1].replace(',', '.')),
            tier_max: null,
            tier_unit: 'm2'
          };
        }
        return null;
      })
      .filter(Boolean);

    if (withRanges.length < 2) continue;

    // Détecter sous-groupes par mots-clés (pour séparer "terreno" vs "imponible")
    const keywords = ['imponible', 'terreno', 'superficie', 'construcción', 'edificio', 'local'];
    const subgroups = new Map();

    for (const keyword of keywords) {
      const matches = withRanges.filter(t =>
        t.nombre_es.toLowerCase().includes(keyword)
      );
      if (matches.length >= 2) {
        if (!subgroups.has(keyword)) {
          subgroups.set(keyword, []);
        }
        subgroups.get(keyword).push(...matches);
      }
    }

    // Si pas de sous-groupes détectés, tout est 1 groupe
    if (subgroups.size === 0) {
      const sortedTaxes = withRanges.sort((a, b) => a.tier_min - b.tier_min);

      // Vérifier que les tranches sont contiguës ou séquentielles
      let isSequential = true;
      for (let i = 1; i < sortedTaxes.length; i++) {
        const prev = sortedTaxes[i - 1];
        const curr = sortedTaxes[i];
        if (prev.tier_max !== null && Math.abs(curr.tier_min - prev.tier_max) > 1) {
          isSequential = false;
          break;
        }
      }

      if (isSequential) {
        tierGroups.push({
          category_id: categoryId,
          group_name: sortedTaxes[0].nombre_es.split(/\d/)[0].trim() || 'Tarification par tranches',
          unit: sortedTaxes[0].tier_unit,
          tiers: sortedTaxes.map(t => ({
            service_code: t.id,
            min: t.tier_min,
            max: t.tier_max,
            rate_expedicion: t.tasa_expedicion,
            rate_renovacion: t.tasa_renovacion,
            name_es: t.nombre_es
          }))
        });
      }
    } else {
      // Créer un groupe pour chaque sous-groupe
      for (const [keyword, services] of subgroups.entries()) {
        const sortedTaxes = services.sort((a, b) => a.tier_min - b.tier_min);

        tierGroups.push({
          category_id: categoryId,
          group_name: keyword.charAt(0).toUpperCase() + keyword.slice(1),
          unit: sortedTaxes[0].tier_unit,
          tiers: sortedTaxes.map(t => ({
            service_code: t.id,
            min: t.tier_min,
            max: t.tier_max,
            rate_expedicion: t.tasa_expedicion,
            rate_renovacion: t.tasa_renovacion,
            name_es: t.nombre_es
          }))
        });
      }
    }
  }

  return tierGroups;
}

// ============================================
// ENRICHISSEMENT DONNÉES
// ============================================

function enrichMinistries(ministries) {
  console.log(`\n🏛️  Enrichissement ${ministries.length} ministères...`);

  return ministries.map((ministry, index) => ({
    ...ministry,
    display_order: index,
    icon: inferMinistryIcon(ministry),
    color: getColorForIndex(index),
    is_active: true,
  }));
}

function enrichTaxes(taxes, procedimientos, options) {
  console.log(`\n💰 Enrichissement ${taxes.length} services fiscaux...`);

  // Grouper procedimientos par tax_id
  const proceduresByTax = new Map();
  for (const proc of procedimientos) {
    if (!proceduresByTax.has(proc.tax_id)) {
      proceduresByTax.set(proc.tax_id, []);
    }
    proceduresByTax.get(proc.tax_id).push(proc);
  }

  // Grouper taxes par catégorie pour détection tranches
  const taxesByCategory = taxes.reduce((acc, tax) => {
    if (!acc[tax.category_id]) {
      acc[tax.category_id] = [];
    }
    acc[tax.category_id].push(tax);
    return acc;
  }, {});

  // Détecter groupes de tranches
  const tierGroups = detectTierGroups(taxesByCategory);
  console.log(`   🔍 ${tierGroups.length} groupes de tranches détectés`);

  // Map pour marquer les services qui font partie d'un groupe
  const serviceInGroup = new Map();
  for (const group of tierGroups) {
    for (const tier of group.tiers) {
      serviceInGroup.set(tier.service_code, {
        group_name: group.group_name,
        tier_min: tier.min,
        tier_max: tier.max
      });
    }
  }

  const enriched = [];
  const reviewNeeded = [];

  for (const tax of taxes) {
    const service_type = inferServiceType(tax);
    const calculation_method = inferCalculationMethod(tax);
    const procedures = proceduresByTax.get(tax.id) || [];
    const instructions_es = generateInstructionsSummary(procedures);
    const percentageInfo = extractPercentageInfo(tax);

    // Vérifier si ce service fait partie d'un groupe de tranches
    const groupInfo = serviceInGroup.get(tax.id);

    enriched.push({
      ...tax,
      service_type,
      calculation_method,
      instructions_es,
      base_percentage: percentageInfo.base_percentage,
      percentage_of: percentageInfo.percentage_of,
      tier_group_name: groupInfo?.group_name || null,
      is_tier_component: !!groupInfo,
      status: 'active',
    });

    if (calculation_method !== 'fixed_expedition' && calculation_method !== 'fixed_both') {
      reviewNeeded.push({
        id: tax.id,
        field: 'calculation_method',
        value: calculation_method,
      });
    }
  }

  console.log(`   ✅ ${enriched.length} services enrichis`);
  console.log(`   📊 ${serviceInGroup.size} services marqués comme composants de tranches`);
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

function generateSeedDataSQL(ministries, sectors, categories, taxes) {
  const lines = [];

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

  ministries.forEach((m, idx) => {
    const isLast = idx === ministries.length - 1;
    lines.push(`  ('${m.id}', '${escapeSql(m.nombre_es)}', ${m.description_es ? `'${escapeSql(m.description_es)}'` : 'NULL'}, ${m.display_order}, '${m.icon}', '${m.color}', ${m.is_active}, NOW())${isLast ? ';' : ','}`);
  });
  lines.push('');

  // 2. SECTORS
  lines.push('-- ============================================');
  lines.push('-- 2. SECTORS');
  lines.push('-- ============================================');
  lines.push('');
  lines.push('INSERT INTO sectors (');
  lines.push('  sector_code, ministry_id, name_es, is_active, created_at');
  lines.push(') VALUES');

  sectors.forEach((s, idx) => {
    const isLast = idx === sectors.length - 1;
    lines.push(`  ('${s.id}', (SELECT id FROM ministries WHERE ministry_code = '${s.ministerio_id}'), '${escapeSql(s.nombre_es)}', true, NOW())${isLast ? ';' : ','}`);
  });
  lines.push('');

  // 3. CATEGORIES
  lines.push('-- ============================================');
  lines.push('-- 3. CATEGORIES');
  lines.push('-- ============================================');
  lines.push('');
  lines.push('INSERT INTO categories (');
  lines.push('  category_code, sector_id, ministry_id, name_es, service_type, is_active, created_at');
  lines.push(') VALUES');

  categories.forEach((c, idx) => {
    const isLast = idx === categories.length - 1;
    const sectorRef = c.sector_id ? `(SELECT id FROM sectors WHERE sector_code = '${c.sector_id}')` : 'NULL';
    const ministryRef = c.ministerio_id ? `(SELECT id FROM ministries WHERE ministry_code = '${c.ministerio_id}')` : 'NULL';
    const serviceType = c.nombre_es.toLowerCase().includes('consular') ? 'document_processing' : 'administrative_tax';

    lines.push(`  ('${c.id}', ${sectorRef}, ${ministryRef}, '${escapeSql(c.nombre_es)}', '${serviceType}', true, NOW())${isLast ? ';' : ','}`);
  });
  lines.push('');

  // 4. FISCAL_SERVICES
  lines.push('-- ============================================');
  lines.push('-- 4. FISCAL_SERVICES (TAXES)');
  lines.push('-- ============================================');
  lines.push('');
  lines.push('INSERT INTO fiscal_services (');
  lines.push('  service_code, category_id, name_es, description_es, instructions_es,');
  lines.push('  service_type, calculation_method, tasa_expedicion, tasa_renovacion,');
  lines.push('  base_percentage, percentage_of,');
  lines.push('  tier_group_name, is_tier_component,');
  lines.push('  status, created_at');
  lines.push(') VALUES');

  taxes.forEach((t, idx) => {
    const isLast = idx === taxes.length - 1;
    const basePercentage = t.base_percentage !== null ? t.base_percentage : 'NULL';
    const percentageOf = t.percentage_of ? `'${t.percentage_of}'` : 'NULL';
    const tierGroupName = t.tier_group_name ? `'${escapeSql(t.tier_group_name)}'` : 'NULL';
    const isTierComponent = t.is_tier_component ? 'true' : 'false';
    lines.push(`  ('${t.id}', (SELECT id FROM categories WHERE category_code = '${t.category_id}'), '${escapeSql(t.nombre_es)}', ${t.description_es ? `'${escapeSql(t.description_es)}'` : 'NULL'}, ${t.instructions_es ? `'${escapeSql(t.instructions_es)}'` : 'NULL'}, '${t.service_type}', '${t.calculation_method}', ${t.tasa_expedicion}, ${t.tasa_renovacion}, ${basePercentage}, ${percentageOf}, ${tierGroupName}, ${isTierComponent}, '${t.status}', NOW())${isLast ? ';' : ','}`);
  });
  lines.push('');

  lines.push('COMMIT;');
  lines.push('');
  lines.push('-- ============================================');
  lines.push('-- SEED DATA IMPORTÉ AVEC SUCCÈS');
  lines.push(`-- Ministries: ${ministries.length}`);
  lines.push(`-- Sectors: ${sectors.length}`);
  lines.push(`-- Categories: ${categories.length}`);
  lines.push(`-- Fiscal Services: ${taxes.length}`);
  lines.push('-- ============================================');

  return lines.join('\n');
}

function consolidateDocuments(documentosRequeridos) {
  // Regrouper documents par tax_id (3 entrées: ES, FR, EN → 1 document)
  const docsByTaxId = new Map();

  for (const doc of documentosRequeridos) {
    if (!docsByTaxId.has(doc.tax_id)) {
      docsByTaxId.set(doc.tax_id, {
        tax_id: doc.tax_id,
        nombre_es: null,
        nombre_fr: null,
        nombre_en: null,
      });
    }

    const consolidated = docsByTaxId.get(doc.tax_id);
    if (doc.nombre_es) consolidated.nombre_es = doc.nombre_es;
    if (doc.nombre_fr) consolidated.nombre_fr = doc.nombre_fr;
    if (doc.nombre_en) consolidated.nombre_en = doc.nombre_en;
  }

  return Array.from(docsByTaxId.values()).filter(d => d.nombre_es);
}

function generateSeedProceduresSQL(procedimientos) {
  const lines = [];

  lines.push('-- ============================================');
  lines.push('-- SEED PROCEDURES TaxasGE v3.4');
  lines.push('-- Procédures détaillées services fiscaux');
  lines.push(`-- Total: ${procedimientos.length} étapes`);
  lines.push(`-- Date: ${new Date().toISOString()}`);
  lines.push('-- ============================================');
  lines.push('');
  lines.push('BEGIN;');
  lines.push('');

  const esProcedures = procedimientos.filter(p => p.description_es);

  if (esProcedures.length === 0) {
    lines.push('-- Aucune procédure trouvée');
    lines.push('COMMIT;');
    return lines.join('\n');
  }

  lines.push('INSERT INTO service_procedures (');
  lines.push('  fiscal_service_id, step_number, description_es, created_at');
  lines.push(') VALUES');

  esProcedures.forEach((p, idx) => {
    const isLast = idx === esProcedures.length - 1;
    lines.push(`  ((SELECT id FROM fiscal_services WHERE service_code = '${p.tax_id}'), ${p.step_number}, '${escapeSql(p.description_es)}', NOW())${isLast ? ';' : ','}`);
  });

  lines.push('');
  lines.push('COMMIT;');
  lines.push('');
  lines.push(`-- ${esProcedures.length} procédures importées avec succès`);

  return lines.join('\n');
}

function generateSeedDocumentsSQL(documentosRequeridos) {
  const lines = [];

  lines.push('-- ============================================');
  lines.push('-- SEED REQUIRED DOCUMENTS TaxasGE v3.4');
  lines.push('-- Documents requis par service fiscal');
  lines.push(`-- Total brut: ${documentosRequeridos.length} entrées`);
  lines.push(`-- Date: ${new Date().toISOString()}`);
  lines.push('-- ============================================');
  lines.push('');
  lines.push('BEGIN;');
  lines.push('');

  // Consolider 3 entrées (ES/FR/EN) → 1 document
  const consolidated = consolidateDocuments(documentosRequeridos);

  lines.push(`-- ${consolidated.length} documents uniques consolidés (ES/FR/EN regroupés)`);
  lines.push('');

  if (consolidated.length === 0) {
    lines.push('-- Aucun document trouvé');
    lines.push('COMMIT;');
    return lines.join('\n');
  }

  lines.push('INSERT INTO required_documents (');
  lines.push('  document_code, fiscal_service_id, name_es, is_mandatory, applies_to, created_at');
  lines.push(') VALUES');

  consolidated.forEach((doc, idx) => {
    const isLast = idx === consolidated.length - 1;
    const docCode = `RD-${doc.tax_id}-${idx + 1}`;
    lines.push(`  ('${docCode}', (SELECT id FROM fiscal_services WHERE service_code = '${doc.tax_id}'), '${escapeSql(doc.nombre_es)}', true, 'both', NOW())${isLast ? ';' : ','}`);
  });

  lines.push('');
  lines.push('COMMIT;');
  lines.push('');
  lines.push(`-- ${consolidated.length} documents requis importés avec succès`);
  lines.push('-- Note: Traductions FR/EN disponibles dans JSON source pour future implémentation');

  return lines.join('\n');
}

function generateSeedTranslationsSQL(ministries, sectors, categories, taxes, procedimientos, documentosRequeridos) {
  const lines = [];

  lines.push('-- ============================================');
  lines.push('-- SEED TRANSLATIONS TaxasGE v3.4');
  lines.push('-- Traductions FR/EN depuis JSON');
  lines.push(`-- Date: ${new Date().toISOString()}`);
  lines.push('-- ============================================');
  lines.push('');
  lines.push('-- STRATÉGIE :');
  lines.push('-- 1. Espagnol (ES) → Stocké en DB colonnes *_es');
  lines.push('-- 2. Français/Anglais (FR/EN) → Stocké dans table translation_status');
  lines.push('-- 3. Une ligne par traduction (language_code: fr ou en)');
  lines.push('-- 4. Interface admin pourra enrichir traductions manquantes');
  lines.push('');
  lines.push('BEGIN;');
  lines.push('');

  // Compteurs
  let translationCount = 0;
  const allTranslations = [];

  // Helper function pour ajouter traductions
  function addTranslations(entityType, items) {
    items.forEach(item => {
      if (item.nombre_fr) {
        allTranslations.push({
          entity_type: entityType,
          entity_code: item.id,
          language_code: 'fr',
          field_name: 'name',
          translation_status: 'available'
        });
        translationCount++;
      }
      if (item.nombre_en) {
        allTranslations.push({
          entity_type: entityType,
          entity_code: item.id,
          language_code: 'en',
          field_name: 'name',
          translation_status: 'available'
        });
        translationCount++;
      }
    });
  }

  // Collecter toutes les traductions
  addTranslations('ministry', ministries.filter(m => m.nombre_fr || m.nombre_en));
  addTranslations('sector', sectors.filter(s => s.nombre_fr || s.nombre_en));
  addTranslations('category', categories.filter(c => c.nombre_fr || c.nombre_en));
  addTranslations('fiscal_service', taxes.filter(t => t.nombre_fr || t.nombre_en));

  // Générer INSERT unique
  if (allTranslations.length > 0) {
    lines.push('-- ============================================');
    lines.push('-- ALL TRANSLATIONS (FR/EN)');
    lines.push(`-- Total: ${translationCount} traductions`);
    lines.push('-- ============================================');
    lines.push('');
    lines.push('INSERT INTO translation_status (entity_type, entity_code, language_code, field_name, translation_status, created_at)');
    lines.push('VALUES');

    allTranslations.forEach((trans, idx) => {
      const isLast = idx === allTranslations.length - 1;
      lines.push(`  ('${trans.entity_type}', '${trans.entity_code}', '${trans.language_code}', '${trans.field_name}', '${trans.translation_status}', NOW())${isLast ? ';' : ','}`);
    });
    lines.push('');
  }

  // PROCEDURES (déjà dans procedimientos.json avec ES/FR/EN)
  const proceduresES = procedimientos.filter(p => p.description_es);
  const proceduresFR = procedimientos.filter(p => p.description_fr);
  const proceduresEN = procedimientos.filter(p => p.description_en);

  if (proceduresES.length > 0) {
    lines.push('-- ============================================');
    lines.push('-- PROCEDURES TRANSLATIONS (Info only)');
    lines.push('-- ============================================');
    lines.push('-- Note: Procédures déjà importées avec description_es en DB');
    lines.push(`-- Traductions disponibles: ${proceduresFR.length} FR, ${proceduresEN.length} EN`);
    lines.push('-- À implémenter via colonnes description_fr/description_en dans service_procedures');
    lines.push('');
  }

  // DOCUMENTS
  const consolidatedDocs = consolidateDocuments(documentosRequeridos);
  const docsWithTranslations = consolidatedDocs.filter(d => d.nombre_fr || d.nombre_en);

  if (docsWithTranslations.length > 0) {
    lines.push('-- ============================================');
    lines.push('-- REQUIRED DOCUMENTS TRANSLATIONS (Info only)');
    lines.push('-- ============================================');
    lines.push(`-- ${docsWithTranslations.length} documents avec traductions FR/EN disponibles`);
    lines.push('-- À implémenter via colonnes name_fr/name_en dans required_documents');
    lines.push('');
  }

  lines.push('COMMIT;');
  lines.push('');
  lines.push('-- ============================================');
  lines.push('-- RÉSUMÉ IMPORT TRADUCTIONS');
  lines.push('-- ============================================');
  lines.push(`-- Translation_status enregistrements: ${translationCount}`);
  lines.push(`-- Ministries: ${ministries.filter(m => m.nombre_fr || m.nombre_en).length}`);
  lines.push(`-- Sectors: ${sectors.filter(s => s.nombre_fr || s.nombre_en).length}`);
  lines.push(`-- Categories: ${categories.filter(c => c.nombre_fr || c.nombre_en).length}`);
  lines.push(`-- Fiscal Services: ${taxes.filter(t => t.nombre_fr || t.nombre_en).length}`);
  lines.push('');
  lines.push('-- ℹ️ NOTE ARCHITECTURE I18N:');
  lines.push('-- Les traductions procedures/documents sont VOLONTAIREMENT absentes des colonnes.');
  lines.push('-- Stratégie adoptée : Soft references via translation_status (évite duplication massive).');
  lines.push('--');
  lines.push('-- Pour récupérer traductions:');
  lines.push('--   SELECT entity_code, field_name, language_code, translation_status');
  lines.push('--   FROM translation_status');
  lines.push('--   WHERE entity_type = \'fiscal_service\' AND language_code = \'fr\';');
  lines.push('--');
  lines.push('-- Avantages:');
  lines.push('--   ✅ Pas de duplication (économie stockage)');
  lines.push('--   ✅ Enrichissement progressif possible');
  lines.push('--   ✅ Interface admin peut identifier traductions manquantes');

  return lines.join('\n');
}

// ============================================
// MAIN
// ============================================

async function main() {
  const args = process.argv.slice(2);
  const options = {
    enableAIDescriptions: args.includes('--enable-ai-descriptions'),
    reviewMode: args.includes('--review'),
    dryRun: args.includes('--dry-run'),
    outputDir: 'data/seed',
  };

  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
🚀 Script Enrichissement JSON → SQL TaxasGE v3.4

Usage:
  node scripts/enrich-json-data.mjs [options]

Options:
  --enable-ai-descriptions   Activer génération IA descriptions
  --review                   Mode review interactif
  --dry-run                  Afficher résultats sans écrire fichiers
  --help, -h                 Afficher cette aide

Exemples:
  node scripts/enrich-json-data.mjs
  node scripts/enrich-json-data.mjs --review
  node scripts/enrich-json-data.mjs --dry-run
    `);
    process.exit(0);
  }

  console.log('🚀 TaxasGE - Enrichissement JSON → SQL v3.4\n');
  console.log('Options:');
  console.log(`  - AI Descriptions: ${options.enableAIDescriptions ? '✅ Activé' : '❌ Désactivé'}`);
  console.log(`  - Review Mode: ${options.reviewMode ? '✅' : '❌'}`);
  console.log(`  - Dry Run: ${options.dryRun ? '✅' : '❌'}`);
  console.log(`  - Output: ${options.outputDir}/`);
  console.log('');

  // Charger JSON
  console.log('📂 Chargement fichiers JSON...');
  const ministries = JSON.parse(fs.readFileSync('data/ministerios.json', 'utf8'));
  const sectors = JSON.parse(fs.readFileSync('data/sectores.json', 'utf8'));
  const categories = JSON.parse(fs.readFileSync('data/categorias_cleaned.json', 'utf8'));
  const taxes = JSON.parse(fs.readFileSync('data/taxes_restructured.json', 'utf8'));
  const procedimientos = JSON.parse(fs.readFileSync('data/procedimientos.json', 'utf8'));
  const documentosRequeridos = JSON.parse(fs.readFileSync('data/documentos_requeridos.json', 'utf8'));

  console.log(`   ✅ ${ministries.length} ministères`);
  console.log(`   ✅ ${sectors.length} secteurs`);
  console.log(`   ✅ ${categories.length} catégories`);
  console.log(`   ✅ ${taxes.length} services fiscaux`);
  console.log(`   ✅ ${procedimientos.length} étapes procédures`);
  console.log(`   ✅ ${documentosRequeridos.length} documents requis (brut)`);

  // Enrichissement
  const enrichedMinistries = enrichMinistries(ministries);
  const enrichedTaxes = enrichTaxes(taxes, procedimientos, options);

  // Génération SQL
  console.log('\n📝 Génération fichiers SQL...');
  const seedDataSQL = generateSeedDataSQL(enrichedMinistries, sectors, categories, enrichedTaxes);
  const seedProceduresSQL = generateSeedProceduresSQL(procedimientos);
  const seedDocumentsSQL = generateSeedDocumentsSQL(documentosRequeridos);
  const seedTranslationsSQL = generateSeedTranslationsSQL(
    ministries,
    sectors,
    categories,
    taxes,
    procedimientos,
    documentosRequeridos
  );

  if (options.dryRun) {
    console.log('\n🔍 DRY RUN - Aperçu résultats:\n');
    console.log(seedDataSQL.split('\n').slice(0, 50).join('\n'));
    console.log('\n... (fichier complet non affiché en dry-run)\n');
  } else {
    // Créer dossier output
    if (!fs.existsSync(options.outputDir)) {
      fs.mkdirSync(options.outputDir, { recursive: true });
    }

    // Écrire fichiers
    fs.writeFileSync(`${options.outputDir}/seed_data.sql`, seedDataSQL, 'utf8');
    fs.writeFileSync(`${options.outputDir}/seed_procedures.sql`, seedProceduresSQL, 'utf8');
    fs.writeFileSync(`${options.outputDir}/seed_documents.sql`, seedDocumentsSQL, 'utf8');
    fs.writeFileSync(`${options.outputDir}/seed_translations.sql`, seedTranslationsSQL, 'utf8');

    console.log(`   ✅ ${options.outputDir}/seed_data.sql`);
    console.log(`   ✅ ${options.outputDir}/seed_procedures.sql`);
    console.log(`   ✅ ${options.outputDir}/seed_documents.sql`);
    console.log(`   ✅ ${options.outputDir}/seed_translations.sql`);
  }

  console.log('\n✅ Enrichissement terminé avec succès!\n');
  console.log('📋 Prochaines étapes:');
  console.log('   1. Valider seed_data.sql');
  console.log('   2. Exécuter sur DB: psql -f data/seed/seed_data.sql');
  console.log('   3. Exécuter procedures: psql -f data/seed/seed_procedures.sql');
  console.log('   4. Exécuter documents: psql -f data/seed/seed_documents.sql');
  console.log('   5. Valider intégrité données');
}

main().catch(console.error);
