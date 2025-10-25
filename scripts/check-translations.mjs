import fs from 'fs';

const sql = fs.readFileSync('data/seed/seed_translations.sql', 'utf8');
const taxes = JSON.parse(fs.readFileSync('data/taxes_restructured.json', 'utf8'));

// Extract service codes from translations SQL
const matches = [...sql.matchAll(/fiscal_service', '([^']+)'/g)];
const inTranslations = new Set(matches.map(m => m[1]));

// Get all tax IDs
const allTaxes = new Set(taxes.map(t => t.id));

// Find missing
const missing = [...allTaxes].filter(id => !inTranslations.has(id));

console.log('Total services in taxes_restructured.json:', allTaxes.size);
console.log('Total services in seed_translations.sql:', inTranslations.size);
console.log('Missing in translations:', missing.length);

if (missing.length > 0) {
  console.log('\nMissing services:');
  missing.forEach(id => {
    const tax = taxes.find(t => t.id === id);
    console.log(`  ${id}: ${tax?.nombre_es || 'UNKNOWN'}`);
  });
}
