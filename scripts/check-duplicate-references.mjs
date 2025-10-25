import fs from 'fs';

const procedures = JSON.parse(fs.readFileSync('data/procedimientos.json', 'utf8'));
const documents = JSON.parse(fs.readFileSync('data/documentos_requeridos.json', 'utf8'));
const translations = JSON.parse(fs.readFileSync('data/translations.json', 'utf8'));

// Les IDs qui ont été renommés
const renamedIds = [
  { old: 'T-465', new: 'T-548', category: 'C-071' },
  { old: 'T-466', new: 'T-549', category: 'C-071' },
  { old: 'T-467', new: 'T-550', category: 'C-071' },
  { old: 'T-468', new: 'T-551', category: 'C-071' }
];

console.log('🔍 Vérification des références aux IDs renommés...\n');

for (const renamed of renamedIds) {
  console.log(`\n=== ${renamed.old} → ${renamed.new} (${renamed.category}) ===`);

  // Procédures
  const procMatches = procedures.filter(p => p.tax_id === renamed.old);
  console.log(`  Procedures: ${procMatches.length}`);

  // Documents
  const docMatches = documents.filter(d => d.tax_id === renamed.old);
  console.log(`  Documents: ${docMatches.length}`);

  // Translations
  const transMatches = translations.filter(t => t.entity_id === renamed.old);
  console.log(`  Translations: ${transMatches.length}`);
}

console.log('\n\n⚠️  ATTENTION:');
console.log('Les IDs T-465 à T-468 existent dans 2 catégories (C-070 et C-071).');
console.log('Seuls ceux de C-071 ont été renommés en T-548 à T-551.');
console.log('');
console.log('Les fichiers JSON source (procedimientos.json, documentos_requeridos.json)');
console.log('contiennent probablement les anciennes références.');
console.log('');
console.log('💡 Solution:');
console.log('Les fichiers seed SQL sont générés dynamiquement depuis taxes_restructured.json');
console.log('et utilisent le nouveau tax_id. Donc seed_procedures.sql et seed_documents.sql');
console.log('devraient DÉJÀ contenir les bonnes références.');
console.log('');
console.log('Vérifions...');
