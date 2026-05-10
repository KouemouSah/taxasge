#!/usr/bin/env node
/**
 * i18n key checker — Manual Facil
 *
 * Verifica:
 *   1. Que cada `data-i18n*` usada en HTML está definida en es.js
 *   2. Cobertura FR + EN respecto a ES
 *   3. Claves potencialmente huérfanas
 *
 * Uso: node docs/manual/tools/check-i18n.js
 */

const fs = require('fs');
const path = require('path');

const MANUAL_DIR = path.resolve(__dirname, '..');
const HTML_GLOB_DIR = MANUAL_DIR;

// 1. Extraer claves data-i18n del HTML
function extractHtmlKeys(dir) {
  const keys = new Set();
  const re = /data-i18n(?:-html|-attr-[a-z-]+|-title)?="([^"]+)"/g;

  function walk(currentDir) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(currentDir, entry.name);
      // Excluir _templates/ (placeholders __PAGEKEY__) y pagefind/ (generado)
      if (entry.isDirectory()) {
        if (entry.name === '_templates' || entry.name === 'pagefind' || entry.name === '_assets' || entry.name === 'tools' || entry.name.startsWith('.')) continue;
        walk(full);
      } else if (entry.isFile() && entry.name.endsWith('.html')) {
        const content = fs.readFileSync(full, 'utf8');
        let match;
        while ((match = re.exec(content)) !== null) {
          if (!match[1].includes('__PAGEKEY__')) {
            keys.add(match[1]);
          }
        }
      }
    }
  }
  walk(dir);
  return Array.from(keys).sort();
}

// 2. Aplanar claves de un archivo messages/X.js
function loadMessagesKeys(file, lang) {
  if (!fs.existsSync(file)) return [];
  const content = fs.readFileSync(file, 'utf8');
  const sandbox = { window: {} };
  // eslint-disable-next-line no-new-func
  const fn = new Function('window', content + '\nreturn window.__I18N__;');
  let i18n;
  try {
    i18n = fn(sandbox.window);
  } catch (e) {
    console.error(`Error loading ${file}: ${e.message}`);
    return [];
  }
  const data = i18n && i18n[lang];
  if (!data) return [];

  function flatten(obj, prefix) {
    const keys = [];
    if (typeof obj !== 'object' || obj === null) return keys;
    for (const k of Object.keys(obj)) {
      const newKey = prefix ? `${prefix}.${k}` : k;
      if (typeof obj[k] === 'object' && obj[k] !== null) {
        keys.push(...flatten(obj[k], newKey));
      } else {
        keys.push(newKey);
      }
    }
    return keys;
  }
  return flatten(data, '').sort();
}

// 3. Comparar listas (a - b)
function diff(a, b) {
  const setB = new Set(b);
  return a.filter((x) => !setB.has(x));
}

// === Main ===
console.log('=== i18n key checker — Manual Facil ===');
console.log(`Directorio: ${MANUAL_DIR}\n`);

const htmlKeys = extractHtmlKeys(HTML_GLOB_DIR);
console.log(`--- Paso 1: HTML ---`);
console.log(`  ${htmlKeys.length} claves únicas usadas en HTML\n`);

const esKeys = loadMessagesKeys(path.join(MANUAL_DIR, 'i18n/messages/es.js'), 'es');
console.log(`--- Paso 2: messages/es.js ---`);
console.log(`  ${esKeys.length} claves definidas en es.js\n`);

const missing = diff(htmlKeys, esKeys);
console.log(`--- Paso 3: HTML SIN ES ---`);
if (missing.length === 0) {
  console.log(`  ✅ Cobertura HTML→es.js perfecta.`);
} else {
  console.log(`  ⚠️ ${missing.length} clave(s) HTML sin traducción ES :`);
  missing.slice(0, 20).forEach((k) => console.log(`    - ${k}`));
  if (missing.length > 20) console.log(`    ... (${missing.length - 20} más)`);
}
console.log('');

const orphan = diff(esKeys, htmlKeys);
console.log(`--- Paso 4: ES huérfanas ---`);
if (orphan.length === 0) {
  console.log(`  ✅ Todas las claves es.js están usadas.`);
} else {
  console.log(`  ℹ️ ${orphan.length} clave(s) es.js no encontradas en HTML (común durante desarrollo) :`);
  orphan.slice(0, 10).forEach((k) => console.log(`    - ${k}`));
  if (orphan.length > 10) console.log(`    ... (${orphan.length - 10} más)`);
}
console.log('');

console.log(`--- Paso 5: Cobertura FR + EN ---`);
for (const lang of ['fr', 'en']) {
  const langKeys = loadMessagesKeys(path.join(MANUAL_DIR, `i18n/messages/${lang}.js`), lang);
  const percent = esKeys.length > 0 ? Math.round((langKeys.length * 100) / esKeys.length) : 0;
  console.log(`  ${lang}.js : ${langKeys.length} / ${esKeys.length} claves (${percent}% de ES)`);
}
console.log('\n=== Validación completada ===');

// Exit code 0 si OK, 1 si claves faltantes
process.exit(missing.length === 0 ? 0 : 1);
