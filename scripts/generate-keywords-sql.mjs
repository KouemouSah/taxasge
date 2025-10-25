#!/usr/bin/env node
/**
 * GENERATE SERVICE KEYWORDS SQL (PRODUCTION)
 *
 * ARCHITECTURE PRODUCTION:
 * - Table: service_keywords (avec FK vers fiscal_services)
 * - Multilingue natif (es/fr/en dans même table)
 * - Index GIN pour recherche full-text performante
 * - Résolution tax_id → fiscal_service_id via subquery
 */

import fs from 'fs';
import path from 'path';

console.log('📝 GENERATE SERVICE KEYWORDS SQL (PRODUCTION)\n');

// Charger données
const keywords = JSON.parse(fs.readFileSync('data/palabras_clave.json', 'utf8'));

console.log('📊 Data loaded:');
console.log(`  Total keywords: ${keywords.length}`);

// Analyser distribution
const stats = {
  byLang: {},
  byService: {},
  total: keywords.length
};

keywords.forEach(kw => {
  stats.byLang[kw.lang_code] = (stats.byLang[kw.lang_code] || 0) + 1;
  stats.byService[kw.tax_id] = (stats.byService[kw.tax_id] || 0) + 1;
});

const uniqueServices = Object.keys(stats.byService).length;
const avgPerService = (keywords.length / uniqueServices).toFixed(1);

console.log('\n📊 Statistics:');
console.log(`  Languages:`);
Object.entries(stats.byLang).sort().forEach(([lang, count]) => {
  console.log(`    ${lang}: ${count}`);
});
console.log(`  Services with keywords: ${uniqueServices}`);
console.log(`  Average per service: ${avgPerService}`);
console.log('');

// Validation qualité
console.log('🔍 Quality checks...\n');

// Check 1: Keywords vides
const emptyKeywords = keywords.filter(kw => !kw.keyword || kw.keyword.trim() === '');
if (emptyKeywords.length > 0) {
  console.warn(`  ⚠️  ${emptyKeywords.length} empty keywords found`);
}

// Check 2: Keywords trop courts (< 3 chars, potentiellement stop words)
const tooShort = keywords.filter(kw => kw.keyword && kw.keyword.length < 3);
console.log(`  ℹ️  ${tooShort.length} keywords < 3 chars (may be stop words)`);

// Check 3: Duplicates par service/langue
const duplicates = new Map();
keywords.forEach(kw => {
  const key = `${kw.tax_id}:${kw.lang_code}:${kw.keyword.toLowerCase()}`;
  duplicates.set(key, (duplicates.get(key) || 0) + 1);
});
const dupsCount = Array.from(duplicates.values()).filter(c => c > 1).length;
if (dupsCount > 0) {
  console.warn(`  ⚠️  ${dupsCount} duplicate keywords (same service/lang/keyword)`);
}

// Check 4: Distribution équilibrée par langue
const minLang = Math.min(...Object.values(stats.byLang));
const maxLang = Math.max(...Object.values(stats.byLang));
const variance = maxLang - minLang;
if (variance > 100) {
  console.warn(`  ⚠️  Unbalanced language distribution (variance: ${variance})`);
} else {
  console.log(`  ✅ Balanced language distribution (variance: ${variance})`);
}

console.log('');

// Nettoyer et préparer données
console.log('🧹 Cleaning and preparing data...\n');

const cleanedKeywords = keywords
  .filter(kw => kw.keyword && kw.keyword.trim() !== '') // Supprimer vides
  .map(kw => ({
    tax_id: kw.tax_id,
    lang_code: kw.lang_code,
    keyword: kw.keyword.trim().toLowerCase(), // Normaliser
    is_auto_generated: true // Marqué comme auto-généré
  }));

// Dédupliquer
const seen = new Set();
const uniqueKeywords = cleanedKeywords.filter(kw => {
  const key = `${kw.tax_id}:${kw.lang_code}:${kw.keyword}`;
  if (seen.has(key)) return false;
  seen.add(key);
  return true;
});

console.log(`  Cleaned: ${cleanedKeywords.length}`);
console.log(`  Deduplicated: ${uniqueKeywords.length}`);
console.log(`  Removed: ${keywords.length - uniqueKeywords.length}`);
console.log('');

// Grouper par service pour optimiser SQL
const byService = {};
uniqueKeywords.forEach(kw => {
  if (!byService[kw.tax_id]) {
    byService[kw.tax_id] = { es: [], fr: [], en: [] };
  }
  byService[kw.tax_id][kw.lang_code].push(kw.keyword);
});

// Générer SQL
const lines = [];

lines.push('-- ============================================');
lines.push('-- SEED SERVICE KEYWORDS (PRODUCTION)');
lines.push('-- TaxasGE v3.4.1');
lines.push('-- Table: service_keywords');
lines.push(`-- Total: ${uniqueKeywords.length} keywords`);
lines.push(`-- Services: ${uniqueServices}`);
lines.push(`-- Generated: ${new Date().toISOString()}`);
lines.push('-- ============================================');
lines.push('');
lines.push('-- ARCHITECTURE:');
lines.push('-- - FK vers fiscal_services (intégrité référentielle)');
lines.push('-- - Multilingue natif (es/fr/en)');
lines.push('-- - Index GIN pour full-text search');
lines.push('-- - Weight=1 par défaut (peut être ajusté)');
lines.push('-- - is_auto_generated=true (importé depuis JSON)');
lines.push('');
lines.push('-- STRATÉGIE RÉSOLUTION:');
lines.push('-- - Utilise service_code (T-001, T-002) pour lookup');
lines.push('-- - Subquery (SELECT id FROM fiscal_services WHERE service_code = ...)');
lines.push('-- - Si service inexistant → INSERT ignoré (protégé par FK)');
lines.push('');
lines.push('BEGIN;');
lines.push('');

// Approche optimisée: batch INSERT par langue
const insertsByLang = { es: [], fr: [], en: [] };

uniqueKeywords.forEach(kw => {
  const line = `  ((SELECT id FROM fiscal_services WHERE service_code = '${kw.tax_id}'), '${kw.keyword.replace(/'/g, "''")}', '${kw.lang_code}', 1, true, NOW())`;
  insertsByLang[kw.lang_code].push(line);
});

// Générer INSERTs par langue (meilleure lisibilité)
['es', 'fr', 'en'].forEach(lang => {
  const langKeywords = insertsByLang[lang];
  if (langKeywords.length === 0) return;

  lines.push(`-- Keywords ${lang.toUpperCase()} (${langKeywords.length})`);
  lines.push('INSERT INTO service_keywords (fiscal_service_id, keyword, language_code, weight, is_auto_generated, created_at)');
  lines.push('VALUES');

  langKeywords.forEach((line, idx) => {
    const isLast = idx === langKeywords.length - 1;
    lines.push(line + (isLast ? '' : ','));
  });

  lines.push('ON CONFLICT (fiscal_service_id, keyword, language_code) DO NOTHING;');
  lines.push('');
});

lines.push('COMMIT;');
lines.push('');
lines.push('-- ============================================');
lines.push('-- VERIFICATION');
lines.push('-- ============================================');
lines.push('');
lines.push('-- Count by language');
lines.push('SELECT language_code, COUNT(*) as total');
lines.push('FROM service_keywords');
lines.push('GROUP BY language_code');
lines.push('ORDER BY language_code;');
lines.push('');
lines.push('-- Expected results:');
lines.push(`--   es | ${stats.byLang.es || 0}`);
lines.push(`--   fr | ${stats.byLang.fr || 0}`);
lines.push(`--   en | ${stats.byLang.en || 0}`);
lines.push('');
lines.push('-- Top services by keywords count');
lines.push('SELECT');
lines.push('  fs.service_code,');
lines.push('  fs.name_es,');
lines.push('  COUNT(*) as keywords_count');
lines.push('FROM service_keywords sk');
lines.push('JOIN fiscal_services fs ON sk.fiscal_service_id = fs.id');
lines.push('GROUP BY fs.service_code, fs.name_es');
lines.push('ORDER BY keywords_count DESC');
lines.push('LIMIT 10;');
lines.push('');
lines.push('-- ============================================');
lines.push('-- USAGE: Recherche par keyword');
lines.push('-- ============================================');
lines.push('');
lines.push('-- Recherche simple');
lines.push('SELECT DISTINCT');
lines.push('  fs.service_code,');
lines.push('  fs.name_es,');
lines.push('  sk.keyword,');
lines.push('  sk.language_code');
lines.push('FROM service_keywords sk');
lines.push('JOIN fiscal_services fs ON sk.fiscal_service_id = fs.id');
lines.push("WHERE sk.keyword ILIKE '%legal%'");
lines.push('ORDER BY fs.service_code;');
lines.push('');
lines.push('-- Recherche full-text avec ranking');
lines.push('SELECT');
lines.push('  fs.service_code,');
lines.push('  fs.name_es,');
lines.push('  COUNT(*) as matches,');
lines.push('  array_agg(DISTINCT sk.keyword) as matched_keywords');
lines.push('FROM service_keywords sk');
lines.push('JOIN fiscal_services fs ON sk.fiscal_service_id = fs.id');
lines.push("WHERE sk.language_code = 'es'");
lines.push("  AND sk.keyword ILIKE '%document%'");
lines.push('GROUP BY fs.service_code, fs.name_es');
lines.push('ORDER BY matches DESC;');
lines.push('');

// Sauvegarde
const outputPath = path.join(process.cwd(), 'data', 'seed', 'seed_keywords.sql');
fs.writeFileSync(outputPath, lines.join('\n'), 'utf8');

const fileSize = (fs.statSync(outputPath).size / 1024).toFixed(2);

console.log('📊 RÉSUMÉ\n');
console.log(`  Fichier: ${outputPath}`);
console.log(`  Taille: ${fileSize} KB`);
console.log(`  Keywords totaux: ${uniqueKeywords.length}`);
console.log(`  Services: ${uniqueServices}`);
console.log('');
console.log('  Par langue:');
console.log(`    ES: ${stats.byLang.es || 0}`);
console.log(`    FR: ${stats.byLang.fr || 0}`);
console.log(`    EN: ${stats.byLang.en || 0}`);
console.log('');
console.log('✅ SQL seed généré avec succès!');
console.log('');
console.log('💡 IMPORT:\n');
console.log('  psql -h [HOST] -U postgres -d postgres -f data/seed/seed_keywords.sql');
console.log('');
console.log('🔑 ARCHITECTURE PRODUCTION:');
console.log('  - FK vers fiscal_services (intégrité)');
console.log('  - Multilingue natif (pas de table séparée)');
console.log('  - Index GIN pour performance search');
console.log('  - ON CONFLICT DO NOTHING (idempotent)');
console.log('');
