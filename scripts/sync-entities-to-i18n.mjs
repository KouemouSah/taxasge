#!/usr/bin/env node
/**
 * SYNC ENTITIES → FRONTEND I18N
 *
 * Lit ministries, sectors, categories, services depuis JSON
 * Génère i18n/{es,fr,en}/entities.json
 *
 * Structure: {
 *   "ministries.M-001": "Nom traduit",
 *   "sectors.S-001": "Nom traduit",
 *   "categories.C-001": "Nom traduit",
 *   "services.T-001": "Nom traduit"
 * }
 */

import fs from 'fs';
import path from 'path';

console.log('🔄 SYNC ENTITIES → FRONTEND I18N\n');

// Lecture JSON sources
const ministerios = JSON.parse(fs.readFileSync('data/ministerios.json', 'utf8'));
const sectores = JSON.parse(fs.readFileSync('data/sectores.json', 'utf8'));
const categorias = JSON.parse(fs.readFileSync('data/categorias_cleaned.json', 'utf8'));
const services = JSON.parse(fs.readFileSync('data/taxes_restructured.json', 'utf8'));

console.log('📊 Entities loaded:');
console.log(`  Ministries: ${ministerios.length}`);
console.log(`  Sectors: ${sectores.length}`);
console.log(`  Categories: ${categorias.length}`);
console.log(`  Services: ${services.length}`);
console.log(`  TOTAL: ${ministerios.length + sectores.length + categorias.length + services.length}\n`);

// Structure résultat par langue
const i18nFiles = {
  es: {},
  fr: {},
  en: {}
};

let totalKeys = 0;

console.log('🔍 Processing translations...\n');

// Helper function
function addEntityTranslations(entities, prefix) {
  let count = 0;
  entities.forEach(entity => {
    const key = `${prefix}.${entity.id}`;

    if (entity.nombre_es) {
      i18nFiles.es[key] = entity.nombre_es;
      count++;
    }
    if (entity.nombre_fr) {
      i18nFiles.fr[key] = entity.nombre_fr;
      count++;
    }
    if (entity.nombre_en) {
      i18nFiles.en[key] = entity.nombre_en;
      count++;
    }
  });

  const uniqueKeys = entities.length;
  totalKeys += uniqueKeys;
  console.log(`  ${prefix}: ${uniqueKeys} keys (${count} translations)`);
  return uniqueKeys;
}

// Traiter chaque type d'entité
addEntityTranslations(ministerios, 'ministries');
addEntityTranslations(sectores, 'sectors');
addEntityTranslations(categorias, 'categories');
addEntityTranslations(services, 'services');

console.log(`\n✅ ${totalKeys} unique keys processed\n`);

// Statistiques par langue
const stats = {
  es: Object.keys(i18nFiles.es).length,
  fr: Object.keys(i18nFiles.fr).length,
  en: Object.keys(i18nFiles.en).length
};

console.log('📊 Translations by language:');
console.log(`  ES: ${stats.es} keys`);
console.log(`  FR: ${stats.fr} keys`);
console.log(`  EN: ${stats.en} keys\n`);

// Identifier traductions manquantes
const missingFr = totalKeys - stats.fr;
const missingEn = totalKeys - stats.en;

if (missingFr > 0 || missingEn > 0) {
  console.log('⚠️  Missing translations:');
  if (missingFr > 0) console.log(`  FR: ${missingFr} missing`);
  if (missingEn > 0) console.log(`  EN: ${missingEn} missing`);
  console.log('');
}

// Créer dossiers i18n si nécessaire
const i18nDir = path.join(process.cwd(), 'i18n');
const languages = ['es', 'fr', 'en'];

for (const lang of languages) {
  const langDir = path.join(i18nDir, lang);
  if (!fs.existsSync(langDir)) {
    fs.mkdirSync(langDir, { recursive: true });
  }

  // Sauvegarder entities.json
  const outputPath = path.join(langDir, 'entities.json');
  const content = JSON.stringify(i18nFiles[lang], null, 2);
  fs.writeFileSync(outputPath, content, 'utf8');

  const fileSize = (fs.statSync(outputPath).size / 1024).toFixed(2);
  console.log(`✅ Generated: i18n/${lang}/entities.json (${fileSize} KB, ${Object.keys(i18nFiles[lang]).length} keys)`);
}

console.log('\n💡 USAGE EXEMPLE (Frontend):\n');
console.log('  import esEntities from \'./i18n/es/entities.json\';');
console.log('  import frEntities from \'./i18n/fr/entities.json\';');
console.log('  import enEntities from \'./i18n/en/entities.json\';');
console.log('');
console.log('  // Accès traduction');
console.log('  const ministry = frEntities["ministries.M-001"];');
console.log('  const service = esEntities["services.T-001"];');
console.log('  const category = enEntities["categories.C-001"];');
console.log('');

console.log('✅ Entity translations synced successfully!');
