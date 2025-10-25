#!/usr/bin/env node
/**
 * GENERATE PROCEDURES & DOCUMENTS TRANSLATIONS SQL (V3 FINALE)
 *
 * STRATÉGIE RÉVISÉE:
 * - entity_code = "T-XXX:step_Y" (composite key: tax_id + step_number)
 * - Permet matching avec service_procedures via JOIN dynamique
 * - Évite dépendance UUID (qui ne matche pas SERIAL id)
 * - TABLE: entity_translations (avec colonne translation_text)
 *
 * Pour documents : entity_code = "T-XXX" (tax_id uniquement)
 */

import fs from 'fs';
import path from 'path';

console.log('📝 GENERATE PROCEDURES & DOCUMENTS TRANSLATIONS SQL (V2)\n');

const procedures = JSON.parse(fs.readFileSync('data/procedimientos.json', 'utf8'));
const documents = JSON.parse(fs.readFileSync('data/documentos_requeridos.json', 'utf8'));

console.log('📊 Data loaded:');
console.log(`  Procedures: ${procedures.length}`);
console.log(`  Documents: ${documents.length}\n`);

const lines = [];
const translations = [];

let stats = {
  procedures: { fr: 0, en: 0 },
  documents: { fr: 0, en: 0 }
};

console.log('🔍 Processing procedures translations...\n');

// Traiter procédures avec entity_code = "tax_id:step_number"
procedures.forEach(proc => {
  const entityCode = `${proc.tax_id}:step_${proc.step_number}`;

  if (proc.description_fr) {
    translations.push({
      entity_type: 'procedure',
      entity_code: entityCode,
      language_code: 'fr',
      field_name: 'description',
      translation_status: 'available',
      content: proc.description_fr.replace(/'/g, "''")
    });
    stats.procedures.fr++;
  }

  if (proc.description_en) {
    translations.push({
      entity_type: 'procedure',
      entity_code: entityCode,
      language_code: 'en',
      field_name: 'description',
      translation_status: 'available',
      content: proc.description_en.replace(/'/g, "''")
    });
    stats.procedures.en++;
  }
});

console.log(`  Procedures FR: ${stats.procedures.fr}`);
console.log(`  Procedures EN: ${stats.procedures.en}\n`);

console.log('🔍 Processing documents translations...\n');

// Traiter documents avec entity_code = "tax_id"
documents.forEach(doc => {
  const entityCode = doc.tax_id;

  if (doc.nombre_fr) {
    translations.push({
      entity_type: 'document',
      entity_code: entityCode,
      language_code: 'fr',
      field_name: 'name',
      translation_status: 'available',
      content: doc.nombre_fr.replace(/'/g, "''")
    });
    stats.documents.fr++;
  }

  if (doc.nombre_en) {
    translations.push({
      entity_type: 'document',
      entity_code: entityCode,
      language_code: 'en',
      field_name: 'name',
      translation_status: 'available',
      content: doc.nombre_en.replace(/'/g, "''")
    });
    stats.documents.en++;
  }
});

console.log(`  Documents FR: ${stats.documents.fr}`);
console.log(`  Documents EN: ${stats.documents.en}\n`);

const totalTranslations = translations.length;

console.log('✅ Total translations to insert:', totalTranslations);
console.log('');

// Générer SQL
lines.push('-- ============================================');
lines.push('-- SEED PROCEDURES & DOCUMENTS TRANSLATIONS V3');
lines.push('-- TaxasGE v3.4.1');
lines.push('-- Table: entity_translations');
lines.push(`-- Total: ${totalTranslations} traductions (FR/EN uniquement)`);
lines.push(`-- Generated: ${new Date().toISOString()}`);
lines.push('-- ============================================');
lines.push('');
lines.push('-- STRATÉGIE RÉVISÉE:');
lines.push('-- - ES stocké en colonnes (description_es, name_es)');
lines.push('-- - FR/EN stockés via translation_status (soft reference)');
lines.push('-- - entity_code pour procedures = "T-XXX:step_Y" (composite key)');
lines.push('-- - entity_code pour documents = "T-XXX" (tax_id)');
lines.push('-- - Permet JOIN via service_code + step_number (pas UUID)');
lines.push('');
lines.push('BEGIN;');
lines.push('');

if (translations.length > 0) {
  lines.push('-- Insert translations (procedures + documents)');
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
lines.push("WHERE entity_type IN ('procedure', 'document')");
lines.push('GROUP BY entity_type, language_code');
lines.push('ORDER BY entity_type, language_code;');
lines.push('');
lines.push('-- Expected results:');
lines.push(`--   procedure | fr | ${stats.procedures.fr}`);
lines.push(`--   procedure | en | ${stats.procedures.en}`);
lines.push(`--   document  | fr | ${stats.documents.fr}`);
lines.push(`--   document  | en | ${stats.documents.en}`);
lines.push('');
lines.push('-- ============================================');
lines.push('-- USAGE: Récupérer traductions procedures');
lines.push('-- ============================================');
lines.push('');
lines.push('-- Méthode: JOIN via entity_code = service_code:step_X');
lines.push('');
lines.push('SELECT');
lines.push('  sp.id,');
lines.push('  fs.service_code,');
lines.push('  sp.step_number,');
lines.push('  sp.description_es,');
lines.push("  (SELECT translation_text FROM entity_translations");
lines.push("   WHERE entity_code = fs.service_code || ':step_' || sp.step_number");
lines.push("     AND entity_type = 'procedure'");
lines.push("     AND language_code = 'fr'");
lines.push("     AND field_name = 'description') as description_fr,");
lines.push("  (SELECT translation_text FROM entity_translations");
lines.push("   WHERE entity_code = fs.service_code || ':step_' || sp.step_number");
lines.push("     AND entity_type = 'procedure'");
lines.push("     AND language_code = 'en'");
lines.push("     AND field_name = 'description') as description_en");
lines.push('FROM service_procedures sp');
lines.push('JOIN fiscal_services fs ON sp.fiscal_service_id = fs.id');
lines.push("WHERE fs.service_code = 'T-001'");
lines.push('ORDER BY sp.step_number;');
lines.push('');
lines.push('-- ============================================');
lines.push('-- USAGE: Récupérer traductions documents');
lines.push('-- ============================================');
lines.push('');
lines.push('SELECT');
lines.push('  rd.id,');
lines.push('  fs.service_code,');
lines.push('  rd.name_es,');
lines.push("  (SELECT translation_text FROM entity_translations");
lines.push("   WHERE entity_code = fs.service_code");
lines.push("     AND entity_type = 'document'");
lines.push("     AND language_code = 'fr'");
lines.push("     AND field_name = 'name') as name_fr,");
lines.push("  (SELECT translation_text FROM entity_translations");
lines.push("   WHERE entity_code = fs.service_code");
lines.push("     AND entity_type = 'document'");
lines.push("     AND language_code = 'en'");
lines.push("     AND field_name = 'name') as name_en");
lines.push('FROM required_documents rd');
lines.push('JOIN fiscal_services fs ON rd.fiscal_service_id = fs.id');
lines.push("WHERE fs.service_code = 'T-001';");
lines.push('');

// Sauvegarde
const outputPath = path.join(process.cwd(), 'data', 'seed', 'seed_procedures_documents_translations.sql');
fs.writeFileSync(outputPath, lines.join('\n'), 'utf8');

const fileSize = (fs.statSync(outputPath).size / 1024).toFixed(2);

console.log('📊 RÉSUMÉ\n');
console.log(`  Fichier: ${outputPath}`);
console.log(`  Taille: ${fileSize} KB`);
console.log(`  INSERT statements: ${totalTranslations}`);
console.log('');
console.log('  Procedures:');
console.log(`    FR: ${stats.procedures.fr}`);
console.log(`    EN: ${stats.procedures.en}`);
console.log('  Documents:');
console.log(`    FR: ${stats.documents.fr}`);
console.log(`    EN: ${stats.documents.en}`);
console.log('');
console.log('✅ SQL seed généré avec succès!');
console.log('');
console.log('💡 IMPORT:\n');
console.log('  psql -h [HOST] -U postgres -d postgres -f data/seed/seed_procedures_documents_translations.sql');
console.log('');
console.log('🔑 CLÉS UTILISÉES:');
console.log('  - Procedures: entity_code = "T-XXX:step_Y"');
console.log('  - Documents: entity_code = "T-XXX"');
console.log('');
