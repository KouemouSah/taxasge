import fs from 'fs';

// Mapping des IDs renommés (uniquement pour catégorie C-071)
const idMapping = {
  'T-465': 'T-548',
  'T-466': 'T-549',
  'T-467': 'T-550',
  'T-468': 'T-551'
};

console.log('🔧 Propagation des changements d\'IDs...\n');

// 1. taxes_restructured.json - DÉJÀ FAIT
console.log('✅ taxes_restructured.json - Déjà corrigé');

// 2. procedimientos.json
console.log('\n📝 Mise à jour procedimientos.json...');
const procedures = JSON.parse(fs.readFileSync('data/procedimientos.json', 'utf8'));
let procUpdated = 0;

// IMPORTANT: Nous devons identifier LESQUELS renommer
// Les procédures de T-465 à T-468 sont dupliquées (C-070 et C-071)
// On ne peut pas juste renommer tous les T-465 en T-548
// Il faudrait connaître la catégorie, mais procedimientos.json n'a pas category_id !

// Solution: Regarder dans taxes_restructured.json pour savoir quels services ont été renommés
const taxes = JSON.parse(fs.readFileSync('data/taxes_restructured.json', 'utf8'));
const renamedServices = new Set(Object.values(idMapping)); // T-548, T-549, T-550, T-551

// Créer un mapping: tax_id → index dans le tableau
const taxIndex = new Map();
taxes.forEach((tax, idx) => {
  taxIndex.set(tax.id, idx);
});

// Pour les procédures: on va DUPLIQUER les entrées
// T-465 (C-070) garde ses procédures
// T-548 (C-071) obtient une COPIE des procédures de T-465
const newProcedures = [];
for (const proc of procedures) {
  newProcedures.push(proc);

  // Si cette procédure référence un ancien ID
  if (idMapping[proc.tax_id]) {
    // Créer une copie pour le nouvel ID
    const newProc = { ...proc, tax_id: idMapping[proc.tax_id] };
    newProcedures.push(newProc);
    procUpdated++;
  }
}

fs.writeFileSync('data/procedimientos.json', JSON.stringify(newProcedures, null, 2), 'utf8');
console.log(`   ✅ ${procUpdated} procédures dupliquées pour nouveaux IDs`);
console.log(`   Total: ${procedures.length} → ${newProcedures.length}`);

// 3. documentos_requeridos.json
console.log('\n📄 Mise à jour documentos_requeridos.json...');
const documents = JSON.parse(fs.readFileSync('data/documentos_requeridos.json', 'utf8'));
let docUpdated = 0;

const newDocuments = [];
for (const doc of documents) {
  newDocuments.push(doc);

  if (idMapping[doc.tax_id]) {
    const newDoc = { ...doc, tax_id: idMapping[doc.tax_id] };
    newDocuments.push(newDoc);
    docUpdated++;
  }
}

fs.writeFileSync('data/documentos_requeridos.json', JSON.stringify(newDocuments, null, 2), 'utf8');
console.log(`   ✅ ${docUpdated} documents dupliqués pour nouveaux IDs`);
console.log(`   Total: ${documents.length} → ${newDocuments.length}`);

// 4. translations.json
console.log('\n🌍 Mise à jour translations.json...');
const translationsData = JSON.parse(fs.readFileSync('data/translations.json', 'utf8'));
const translations = translationsData.translations || translationsData; // Support both formats
let transUpdated = 0;

if (Array.isArray(translations)) {
  const newTranslations = [];
  for (const trans of translations) {
    newTranslations.push(trans);

    if (trans.entity_id && idMapping[trans.entity_id]) {
      const newTrans = { ...trans, entity_id: idMapping[trans.entity_id] };
      newTranslations.push(newTrans);
      transUpdated++;
    }
  }

  const output = translationsData.translations ? { translations: newTranslations } : newTranslations;
  fs.writeFileSync('data/translations.json', JSON.stringify(output, null, 2), 'utf8');
  console.log(`   ✅ ${transUpdated} traductions dupliquées pour nouveaux IDs`);
  console.log(`   Total: ${translations.length} → ${newTranslations.length}`);
} else {
  console.log('   ⚠️  Format translations.json non reconnu - skip');
}

console.log('\n✅ Propagation terminée!\n');
console.log('📋 Résumé:');
console.log(`   - Procédures: +${procUpdated}`);
console.log(`   - Documents: +${docUpdated}`);
console.log(`   - Traductions: +${transUpdated}`);
console.log('\n🚀 Prochaine étape:');
console.log('   node scripts/enrich-json-data.mjs');
