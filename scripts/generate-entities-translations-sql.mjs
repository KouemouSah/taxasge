#!/usr/bin/env node
/**
 * GENERATE ENTITIES TRANSLATIONS SQL (V3)
 *
 * Génère SQL pour traductions ministries, sectors, categories, services
 * TABLE: entity_translations (avec colonne translation_text)
 */

import fs from 'fs';
import path from 'path';

console.log('📝 GENERATE ENTITIES TRANSLATIONS SQL (V3)\n');

// Charger données
const ministries = JSON.parse(fs.readFileSync('data/ministerios.json', 'utf8'));
const sectors = JSON.parse(fs.readFileSync('data/sectores.json', 'utf8'));
const categories = JSON.parse(fs.readFileSync('data/categorias_cleaned.json', 'utf8'));
const services = JSON.parse(fs.readFileSync('data/taxes_restructured.json', 'utf8'));

console.log('📊 Data loaded:');
console.log(`  Ministries: ${ministries.length}`);
console.log(`  Sectors: ${sectors.length}`);
console.log(`  Categories: ${categories.length}`);
console.log(`  Services: ${services.length}\n`);

const translations = [];
let stats = {
  ministries: { fr: 0, en: 0 },
  sectors: { fr: 0, en: 0 },
  categories: { fr: 0, en: 0 },
  services: { fr: 0, en: 0 }
};

console.log('🔍 Processing ministries translations...\n');

// Ministries
ministries.forEach(ministry => {
  const entityCode = ministry.id; // M-001, M-002, etc.

  if (ministry.nombre_fr) {
    translations.push({
      entity_type: 'ministry',
      entity_code: entityCode,
      language_code: 'fr',
      field_name: 'name',
      content: ministry.nombre_fr.replace(/'/g, "''")
    });
    stats.ministries.fr++;
  }

  if (ministry.nombre_en) {
    translations.push({
      entity_type: 'ministry',
      entity_code: entityCode,
      language_code: 'en',
      field_name: 'name',
      content: ministry.nombre_en.replace(/'/g, "''")
    });
    stats.ministries.en++;
  }
});

console.log(`  Ministries FR: ${stats.ministries.fr}`);
console.log(`  Ministries EN: ${stats.ministries.en}\n`);

console.log('🔍 Processing sectors translations...\n');

// Sectors
sectors.forEach(sector => {
  const entityCode = sector.id; // S-001, S-002, etc.

  if (sector.nombre_fr) {
    translations.push({
      entity_type: 'sector',
      entity_code: entityCode,
      language_code: 'fr',
      field_name: 'name',
      content: sector.nombre_fr.replace(/'/g, "''")
    });
    stats.sectors.fr++;
  }

  if (sector.nombre_en) {
    translations.push({
      entity_type: 'sector',
      entity_code: entityCode,
      language_code: 'en',
      field_name: 'name',
      content: sector.nombre_en.replace(/'/g, "''")
    });
    stats.sectors.en++;
  }
});

console.log(`  Sectors FR: ${stats.sectors.fr}`);
console.log(`  Sectors EN: ${stats.sectors.en}\n`);

console.log('🔍 Processing categories translations...\n');

// Categories
categories.forEach(category => {
  const entityCode = category.id; // C-001, C-002, etc.

  if (category.nombre_fr) {
    translations.push({
      entity_type: 'category',
      entity_code: entityCode,
      language_code: 'fr',
      field_name: 'name',
      content: category.nombre_fr.replace(/'/g, "''")
    });
    stats.categories.fr++;
  }

  if (category.nombre_en) {
    translations.push({
      entity_type: 'category',
      entity_code: entityCode,
      language_code: 'en',
      field_name: 'name',
      content: category.nombre_en.replace(/'/g, "''")
    });
    stats.categories.en++;
  }
});

console.log(`  Categories FR: ${stats.categories.fr}`);
console.log(`  Categories EN: ${stats.categories.en}\n`);

console.log('🔍 Processing services translations...\n');

// Services
services.forEach(service => {
  const entityCode = service.id; // T-001, T-002, etc.

  // Name
  if (service.nombre_fr) {
    translations.push({
      entity_type: 'fiscal_service',
      entity_code: entityCode,
      language_code: 'fr',
      field_name: 'name',
      content: service.nombre_fr.replace(/'/g, "''")
    });
    stats.services.fr++;
  }

  if (service.nombre_en) {
    translations.push({
      entity_type: 'fiscal_service',
      entity_code: entityCode,
      language_code: 'en',
      field_name: 'name',
      content: service.nombre_en.replace(/'/g, "''")
    });
    stats.services.en++;
  }

  // Description (optionnel)
  if (service.descripcion_fr) {
    translations.push({
      entity_type: 'fiscal_service',
      entity_code: entityCode,
      language_code: 'fr',
      field_name: 'description',
      content: service.descripcion_fr.replace(/'/g, "''")
    });
  }

  if (service.descripcion_en) {
    translations.push({
      entity_type: 'fiscal_service',
      entity_code: entityCode,
      language_code: 'en',
      field_name: 'description',
      content: service.descripcion_en.replace(/'/g, "''")
    });
  }
});

console.log(`  Services FR: ${stats.services.fr}`);
console.log(`  Services EN: ${stats.services.en}\n`);

const totalTranslations = translations.length;

console.log('✅ Total translations to insert:', totalTranslations);
console.log('');

// Générer SQL
const lines = [];

lines.push('-- ============================================');
lines.push('-- SEED ENTITIES TRANSLATIONS V3');
lines.push('-- TaxasGE v3.4.1');
lines.push('-- Table: entity_translations');
lines.push(`-- Total: ${totalTranslations} traductions (FR/EN uniquement)`);
lines.push(`-- Generated: ${new Date().toISOString()}`);
lines.push('-- ============================================');
lines.push('');
lines.push('-- STRATÉGIE:');
lines.push('-- - ES stocké en colonnes (name_es, description_es)');
lines.push('-- - FR/EN stockés via entity_translations');
lines.push('-- - entity_code = ministry_code, sector_code, category_code, service_code');
lines.push('');
lines.push('BEGIN;');
lines.push('');

if (translations.length > 0) {
  lines.push('-- Insert translations (ministries + sectors + categories + services)');
  lines.push('INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)');
  lines.push('VALUES');

  translations.forEach((trans, idx) => {
    const isLast = idx === translations.length - 1;
    const line = `  ('${trans.entity_type}', '${trans.entity_code}', '${trans.language_code}', '${trans.field_name}', '${trans.content}', 'import', NOW())${isLast ? '' : ','}`;
    lines.push(line);
  });

  lines.push('ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;');
}

lines.push('');
lines.push('COMMIT;');
lines.push('');
lines.push('-- ============================================');
lines.push('-- VERIFICATION');
lines.push('-- ============================================');
lines.push('');
lines.push('-- Count by entity_type and language');
lines.push('SELECT entity_type, language_code, COUNT(*) as total');
lines.push('FROM entity_translations');
lines.push("WHERE entity_type IN ('ministry', 'sector', 'category', 'fiscal_service')");
lines.push('GROUP BY entity_type, language_code');
lines.push('ORDER BY entity_type, language_code;');
lines.push('');
lines.push('-- Expected results:');
lines.push(`--   ministry       | fr | ${stats.ministries.fr}`);
lines.push(`--   ministry       | en | ${stats.ministries.en}`);
lines.push(`--   sector         | fr | ${stats.sectors.fr}`);
lines.push(`--   sector         | en | ${stats.sectors.en}`);
lines.push(`--   category       | fr | ${stats.categories.fr}`);
lines.push(`--   category       | en | ${stats.categories.en}`);
lines.push(`--   fiscal_service | fr | ${stats.services.fr}`);
lines.push(`--   fiscal_service | en | ${stats.services.en}`);
lines.push('');
lines.push('-- ============================================');
lines.push('-- USAGE: Récupérer traductions service');
lines.push('-- ============================================');
lines.push('');
lines.push('SELECT');
lines.push('  fs.service_code,');
lines.push('  fs.name_es,');
lines.push("  (SELECT translation_text FROM entity_translations");
lines.push("   WHERE entity_code = fs.service_code");
lines.push("     AND entity_type = 'fiscal_service'");
lines.push("     AND language_code = 'fr'");
lines.push("     AND field_name = 'name') as name_fr,");
lines.push("  (SELECT translation_text FROM entity_translations");
lines.push("   WHERE entity_code = fs.service_code");
lines.push("     AND entity_type = 'fiscal_service'");
lines.push("     AND language_code = 'en'");
lines.push("     AND field_name = 'name') as name_en");
lines.push('FROM fiscal_services fs');
lines.push("WHERE fs.service_code = 'T-001';");
lines.push('');

// Sauvegarde
const outputPath = path.join(process.cwd(), 'data', 'seed', 'seed_translations.sql');
fs.writeFileSync(outputPath, lines.join('\n'), 'utf8');

const fileSize = (fs.statSync(outputPath).size / 1024).toFixed(2);

console.log('📊 RÉSUMÉ\n');
console.log(`  Fichier: ${outputPath}`);
console.log(`  Taille: ${fileSize} KB`);
console.log(`  INSERT statements: ${totalTranslations}`);
console.log('');
console.log('  Ministries:');
console.log(`    FR: ${stats.ministries.fr}`);
console.log(`    EN: ${stats.ministries.en}`);
console.log('  Sectors:');
console.log(`    FR: ${stats.sectors.fr}`);
console.log(`    EN: ${stats.sectors.en}`);
console.log('  Categories:');
console.log(`    FR: ${stats.categories.fr}`);
console.log(`    EN: ${stats.categories.en}`);
console.log('  Services:');
console.log(`    FR: ${stats.services.fr}`);
console.log(`    EN: ${stats.services.en}`);
console.log('');
console.log('✅ SQL seed généré avec succès!');
console.log('');
console.log('💡 IMPORT:\n');
console.log('  psql -h [HOST] -U postgres -d postgres -f data/seed/seed_translations.sql');
console.log('');
