import fs from 'fs';

const taxes = JSON.parse(fs.readFileSync('data/taxes_restructured.json', 'utf8'));
const cats = JSON.parse(fs.readFileSync('data/categorias_cleaned.json', 'utf8'));

const needed = new Set(taxes.map(t => t.category_id));
const existing = new Set(cats.map(c => c.id));

const missing = [...needed].filter(c => !existing.has(c)).sort();

console.log('Catégories manquantes:', missing.length);
console.log(missing.join(', '));

// Show which taxes reference missing categories
for (const catId of missing) {
  const taxesWithCat = taxes.filter(t => t.category_id === catId);
  console.log(`\n${catId}: ${taxesWithCat.length} services`);
  taxesWithCat.forEach(t => console.log(`  - ${t.id}: ${t.nombre_es}`));
}
