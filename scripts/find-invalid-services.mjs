import fs from 'fs';

const taxes = JSON.parse(fs.readFileSync('data/taxes_restructured.json', 'utf8'));

// Services avec nom vide ou invalide
const invalid = taxes.filter(t => !t.nombre_es || t.nombre_es.trim() === '');

console.log(`🔍 Services avec nom ES vide: ${invalid.length}\n`);

if (invalid.length > 0) {
  invalid.forEach(t => {
    console.log(`  ${t.id} (catégorie ${t.category_id})`);
    console.log(`    - Nom ES: "${t.nombre_es}"`);
    console.log(`    - Nom FR: "${t.nombre_fr}"`);
    console.log(`    - Nom EN: "${t.nombre_en}"`);
    console.log(`    - Tarifs: exp=${t.tasa_expedicion}, ren=${t.tasa_renovacion}`);
    console.log('');
  });

  console.log('💡 Recommandation:');
  console.log('   - Option 1: Corriger les noms dans taxes_restructured.json');
  console.log('   - Option 2: Marquer comme "inactive" ou "draft" en DB');
  console.log('');
  console.log('🚀 Script SQL pour désactiver:');
  console.log('');
  console.log('UPDATE fiscal_services');
  console.log('SET status = \'inactive\'');
  console.log(`WHERE service_code IN ('${invalid.map(t => t.id).join("', '")}');`);
  console.log('');
  console.log(`-- Affecterait ${invalid.length} service(s)`);
}
