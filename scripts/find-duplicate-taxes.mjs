import fs from 'fs';

const taxes = JSON.parse(fs.readFileSync('data/taxes_restructured.json', 'utf8'));

const ids = taxes.map(t => t.id);
const seen = new Map();
const duplicates = [];

for (let i = 0; i < taxes.length; i++) {
  const tax = taxes[i];
  if (seen.has(tax.id)) {
    duplicates.push({ index: i, tax, firstIndex: seen.get(tax.id) });
  } else {
    seen.set(tax.id, i);
  }
}

console.log(`\nTotal taxes: ${taxes.length}`);
console.log(`Duplicate IDs found: ${duplicates.length}`);

if (duplicates.length > 0) {
  console.log('\n=== DUPLICATES ===\n');
  for (const dup of duplicates) {
    const first = taxes[dup.firstIndex];
    console.log(`ID: ${dup.tax.id}`);
    console.log(`  First occurrence (index ${dup.firstIndex}):`);
    console.log(`    - Category: ${first.category_id}`);
    console.log(`    - Name ES: ${first.nombre_es}`);
    console.log(`  Duplicate (index ${dup.index}):`);
    console.log(`    - Category: ${dup.tax.category_id}`);
    console.log(`    - Name ES: ${dup.tax.nombre_es}`);
    console.log('');
  }

  console.log(`\n=== SOLUTION ===`);
  console.log(`Renumber duplicates with next available ID starting from T-${taxes.length + 1}`);
}
