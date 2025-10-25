#!/usr/bin/env node
/**
 * SYNC DB → FRONTEND I18N
 *
 * Lit data/enum_translations.json
 * Génère fichiers i18n/{es,fr,en}/enums.json
 * Structure: enum_type.enum_value = "traduction"
 *
 * Mapping 1:1 simple (pas de déduplication frontend)
 */

import fs from 'fs';
import path from 'path';

console.log('🔄 SYNC DB → FRONTEND I18N\n');

// Lecture JSON source
const jsonPath = path.join(process.cwd(), 'data', 'enum_translations.json');
const enums = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

// Structure résultat par langue
const i18nFiles = {
  es: {},
  fr: {},
  en: {}
};

console.log('🔍 Processing translations...\n');

let totalKeys = 0;

// Transformer structure : enum_translations → i18n files
for (const [enumType, enumValues] of Object.entries(enums)) {
  console.log(`  Processing ${enumType}...`);

  for (const [enumValue, translations] of Object.entries(enumValues)) {
    // Clé i18n : "user_role_enum.citizen"
    const i18nKey = `${enumType}.${enumValue}`;

    // Ajouter à chaque langue
    if (translations.es) {
      i18nFiles.es[i18nKey] = translations.es;
    }
    if (translations.fr) {
      i18nFiles.fr[i18nKey] = translations.fr;
    }
    if (translations.en) {
      i18nFiles.en[i18nKey] = translations.en;
    }

    totalKeys++;
  }
}

console.log(`\n✅ ${totalKeys} keys processed\n`);

// Créer dossiers i18n/{es,fr,en} si nécessaire
const i18nDir = path.join(process.cwd(), 'i18n');
if (!fs.existsSync(i18nDir)) {
  fs.mkdirSync(i18nDir);
  console.log('📁 Created: i18n/');
}

const languages = ['es', 'fr', 'en'];
const stats = [];

for (const lang of languages) {
  const langDir = path.join(i18nDir, lang);
  if (!fs.existsSync(langDir)) {
    fs.mkdirSync(langDir);
    console.log(`📁 Created: i18n/${lang}/`);
  }

  // Sauvegarder enums.json
  const outputPath = path.join(langDir, 'enums.json');
  const content = JSON.stringify(i18nFiles[lang], null, 2);
  fs.writeFileSync(outputPath, content, 'utf8');

  const fileSize = (fs.statSync(outputPath).size / 1024).toFixed(2);
  stats.push({ lang, keys: Object.keys(i18nFiles[lang]).length, size: fileSize });

  console.log(`✅ Generated: i18n/${lang}/enums.json (${fileSize} KB)`);
}

console.log('\n📊 RÉSUMÉ\n');

stats.forEach(s => {
  console.log(`  ${s.lang.toUpperCase()}: ${s.keys} keys, ${s.size} KB`);
});

console.log(`\n✅ Frontend i18n files synced successfully!`);
console.log('\n💡 USAGE EXEMPLE (Frontend):\n');
console.log('  import esEnums from \'./i18n/es/enums.json\';');
console.log('  import frEnums from \'./i18n/fr/enums.json\';');
console.log('  import enEnums from \'./i18n/en/enums.json\';');
console.log('');
console.log('  // Accès traduction');
console.log('  const role = esEnums["user_role_enum.citizen"]; // "Ciudadano"');
console.log('  const status = frEnums["payment_status_enum.pending"]; // "En attente"');
console.log('');
