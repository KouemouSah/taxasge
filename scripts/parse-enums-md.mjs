#!/usr/bin/env node
/**
 * PARSE ENUMS.MD → JSON
 *
 * Transforme data/enums.md en data/enum_translations.json
 * Structure simple : enum_type → enum_value → {es, fr, en}
 *
 * Pas de déduplication, contexte explicite conservé
 */

import fs from 'fs';
import path from 'path';

console.log('📖 PARSE ENUMS.MD → JSON\n');

// Lecture fichier
const enumsPath = path.join(process.cwd(), 'data', 'enums.md');
const content = fs.readFileSync(enumsPath, 'utf8');

// Structure résultat
const enums = {};
let currentEnum = null;
let currentValue = null;

const lines = content.split('\n');

console.log('🔍 Parsing markdown...');

for (let i = 0; i < lines.length; i++) {
  const line = lines[i].trim();

  // Détection ENUM type (### xxx_enum ou ### xxx)
  if (line.startsWith('### ') && !line.startsWith('### Documents') && !line.startsWith('### Types')) {
    currentEnum = line.replace('### ', '').trim();

    // Ne garder que les vrais ENUMs PostgreSQL (ceux qui finissent par _enum)
    if (currentEnum.includes('_enum')) {
      enums[currentEnum] = {};
      console.log(`  ✓ ${currentEnum}`);
    } else {
      currentEnum = null; // Ignorer sections non-ENUM
    }
  }

  // Détection valeur ENUM (**value**)
  else if (line.startsWith('**') && line.endsWith('**') && currentEnum) {
    currentValue = line.replace(/\*\*/g, '').trim();
    enums[currentEnum][currentValue] = {};
  }

  // Détection traduction (- es/fr/en: xxx)
  else if (line.match(/^- (es|fr|en): (.+)$/)) {
    const match = line.match(/^- (es|fr|en): (.+)$/);
    const lang = match[1];
    const translation = match[2].trim();

    if (currentEnum && currentValue) {
      enums[currentEnum][currentValue][lang] = translation;
    }
  }
}

// Validation
console.log('\n✅ Validation...');

let totalEnums = Object.keys(enums).length;
let totalValues = 0;
let totalTranslations = 0;
let errors = [];

for (const [enumType, values] of Object.entries(enums)) {
  const valueCount = Object.keys(values).length;
  totalValues += valueCount;

  for (const [enumValue, translations] of Object.entries(values)) {
    const hasEs = translations.es && translations.es.trim() !== '';
    const hasFr = translations.fr && translations.fr.trim() !== '';
    const hasEn = translations.en && translations.en.trim() !== '';

    if (hasEs) totalTranslations++;
    if (hasFr) totalTranslations++;
    if (hasEn) totalTranslations++;

    // Vérifier que toutes les langues sont présentes
    if (!hasEs || !hasFr || !hasEn) {
      errors.push({
        enum_type: enumType,
        enum_value: enumValue,
        missing: [
          !hasEs && 'es',
          !hasFr && 'fr',
          !hasEn && 'en'
        ].filter(Boolean)
      });
    }
  }
}

console.log(`  ENUMs: ${totalEnums}`);
console.log(`  Valeurs: ${totalValues}`);
console.log(`  Traductions: ${totalTranslations} (attendu: ${totalValues * 3})`);

if (errors.length > 0) {
  console.log(`\n⚠️  ${errors.length} traductions incomplètes détectées :`);
  errors.slice(0, 5).forEach(err => {
    console.log(`  - ${err.enum_type}.${err.enum_value} : manque ${err.missing.join(', ')}`);
  });
  if (errors.length > 5) {
    console.log(`  ... et ${errors.length - 5} autres`);
  }
}

// Sauvegarde JSON
const outputPath = path.join(process.cwd(), 'data', 'enum_translations.json');

fs.writeFileSync(outputPath, JSON.stringify(enums, null, 2), 'utf8');

console.log(`\n✅ Fichier généré: ${outputPath}`);
console.log(`📊 Taille: ${(fs.statSync(outputPath).size / 1024).toFixed(2)} KB`);

// Générer aussi un fichier de stats
const stats = {
  generated_at: new Date().toISOString(),
  total_enums: totalEnums,
  total_values: totalValues,
  total_translations: totalTranslations,
  errors: errors,
  enums_list: Object.entries(enums).map(([name, values]) => ({
    name,
    value_count: Object.keys(values).length
  }))
};

const statsPath = path.join(process.cwd(), 'data', 'enum_translations_stats.json');
fs.writeFileSync(statsPath, JSON.stringify(stats, null, 2), 'utf8');

console.log(`📈 Stats sauvegardées: ${statsPath}`);
