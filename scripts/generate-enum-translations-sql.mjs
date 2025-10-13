#!/usr/bin/env node
/**
 * GENERATE ENUM TRANSLATIONS SQL SEED
 *
 * Lit data/enum_translations.json
 * Génère data/seed/seed_enum_translations.sql
 * Structure simple : 1 row par (enum_type, enum_value, language)
 */

import fs from 'fs';
import path from 'path';

console.log('📝 GENERATE ENUM TRANSLATIONS SQL\n');

// Lecture JSON
const jsonPath = path.join(process.cwd(), 'data', 'enum_translations.json');
const enums = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

const lines = [];
const values = [];
let totalInserts = 0;

console.log('🔍 Processing enums...\n');

// Header SQL
lines.push('-- ============================================');
lines.push('-- SEED ENUM TRANSLATIONS - TaxasGE v3.4');
lines.push('-- Traductions ENUMs PostgreSQL (ES/FR/EN)');
lines.push('-- Source: data/enums.md → enum_translations.json');
lines.push(`-- Generated: ${new Date().toISOString()}`);
lines.push('-- ============================================');
lines.push('');
lines.push('-- Architecture: Contexte explicite (pas de déduplication)');
lines.push('-- Chaque enum_type + enum_value garde ses propres traductions');
lines.push('-- Soft reference : Pas de FK, flexibilité maximale');
lines.push('');
lines.push('BEGIN;');
lines.push('');

// Collecter toutes les valeurs
for (const [enumType, enumValues] of Object.entries(enums)) {
  console.log(`  Processing ${enumType}...`);
  let enumCount = 0;

  for (const [enumValue, translations] of Object.entries(enumValues)) {
    // Espagnol
    if (translations.es) {
      values.push({
        enum_type: enumType,
        enum_value: enumValue,
        language_code: 'es',
        translation: translations.es.replace(/'/g, "''") // Escape quotes
      });
      enumCount++;
      totalInserts++;
    }

    // Français
    if (translations.fr) {
      values.push({
        enum_type: enumType,
        enum_value: enumValue,
        language_code: 'fr',
        translation: translations.fr.replace(/'/g, "''")
      });
      enumCount++;
      totalInserts++;
    }

    // Anglais
    if (translations.en) {
      values.push({
        enum_type: enumType,
        enum_value: enumValue,
        language_code: 'en',
        translation: translations.en.replace(/'/g, "''")
      });
      enumCount++;
      totalInserts++;
    }
  }

  console.log(`    → ${enumCount} translations`);
}

console.log(`\n✅ Total: ${totalInserts} INSERT statements\n`);

// Générer INSERT statement
if (values.length > 0) {
  lines.push('-- Insert all translations (contexte explicite)');
  lines.push('INSERT INTO enum_translations (enum_type, enum_value, language_code, translation, created_at)');
  lines.push('VALUES');

  values.forEach((val, idx) => {
    const isLast = idx === values.length - 1;
    const line = `  ('${val.enum_type}', '${val.enum_value}', '${val.language_code}', '${val.translation}', NOW())${isLast ? ';' : ','}`;
    lines.push(line);
  });
}

lines.push('');
lines.push('COMMIT;');
lines.push('');
lines.push('-- ============================================');
lines.push('-- VERIFICATION');
lines.push('-- ============================================');
lines.push('');
lines.push('-- Count by enum_type');
lines.push('SELECT enum_type, COUNT(*) as total_translations');
lines.push('FROM enum_translations');
lines.push('GROUP BY enum_type');
lines.push('ORDER BY enum_type;');
lines.push('');
lines.push('-- Count by language');
lines.push('SELECT language_code, COUNT(*) as total');
lines.push('FROM enum_translations');
lines.push('GROUP BY language_code;');
lines.push('');
lines.push('-- Sample translations');
lines.push('SELECT * FROM enum_translations');
lines.push('WHERE enum_type = \'user_role_enum\'');
lines.push('ORDER BY enum_value, language_code;');
lines.push('');

// Sauvegarde
const outputPath = path.join(process.cwd(), 'data', 'seed', 'seed_enum_translations.sql');
fs.writeFileSync(outputPath, lines.join('\n'), 'utf8');

const fileSize = (fs.statSync(outputPath).size / 1024).toFixed(2);

console.log('📊 RÉSUMÉ\n');
console.log(`  Fichier: ${outputPath}`);
console.log(`  Taille: ${fileSize} KB`);
console.log(`  INSERT statements: ${totalInserts}`);
console.log(`  ENUMs: ${Object.keys(enums).length}`);
console.log(`\n✅ SQL seed généré avec succès!`);
