#!/usr/bin/env node
/**
 * fix-coming-soon.js — retire la classe `coming-soon` des liens pointant vers des pages existantes
 *
 * Logique :
 * 1. Liste tous les fichiers .html dans docs/manual/
 * 2. Pour chaque fichier HTML, parse les liens <a class="...coming-soon..." href="X.html">
 * 3. Si X.html existe dans docs/manual/, retire `coming-soon` de la classe
 *
 * Usage:
 *   node docs/manual/tools/fix-coming-soon.js
 *   node docs/manual/tools/fix-coming-soon.js --dry-run
 */

const fs = require('fs');
const path = require('path');

const MANUAL_DIR = path.resolve(__dirname, '..');
const DRY_RUN = process.argv.includes('--dry-run');

function listHtml(dir) {
  return fs.readdirSync(dir, { withFileTypes: true })
    .filter((e) => e.isFile() && e.name.endsWith('.html'))
    .map((e) => e.name);
}

const existingFiles = new Set(listHtml(MANUAL_DIR));
console.log(`=== fix-coming-soon.js ===`);
console.log(`Manual dir: ${MANUAL_DIR}`);
console.log(`Existing HTML files: ${existingFiles.size}`);
console.log(`Dry run: ${DRY_RUN}\n`);

// Regex matching: <a ... class="...coming-soon..." href="X.html" ...>
// or                <a ... href="X.html" ... class="...coming-soon..." ...>
// We'll match any <a> tag that has both `class=...coming-soon...` and `href="X.html"`
// and remove `coming-soon` from the class attribute.

let totalFixed = 0;
let totalScanned = 0;

for (const filename of existingFiles) {
  const fullPath = path.join(MANUAL_DIR, filename);
  let content = fs.readFileSync(fullPath, 'utf8');
  const original = content;
  totalScanned++;

  // Regex: <a [attrs] (with class containing coming-soon AND href to .html file)
  // We use a flexible matcher that finds each <a ...> tag
  content = content.replace(/<a\s+([^>]*?)>/g, (match, attrs) => {
    // Extract href and class
    const hrefMatch = attrs.match(/href="([^"]+\.html)"/);
    const classMatch = attrs.match(/class="([^"]*coming-soon[^"]*)"/);
    if (!hrefMatch || !classMatch) return match;

    const href = hrefMatch[1];
    // Skip anchor URLs (#section)
    if (href.startsWith('#') || href.startsWith('http')) return match;

    // Check if file exists
    if (!existingFiles.has(href)) return match;

    // Remove `coming-soon` from class (handle: "x coming-soon", "coming-soon x", "x coming-soon y")
    const newClassValue = classMatch[1]
      .replace(/\s+coming-soon\b/g, '')
      .replace(/\bcoming-soon\s+/g, '')
      .replace(/\bcoming-soon\b/g, '')
      .trim();

    const newAttrs = attrs.replace(
      /class="[^"]*coming-soon[^"]*"/,
      `class="${newClassValue}"`
    );
    return `<a ${newAttrs}>`;
  });

  if (content !== original) {
    const diffCount = (original.match(/coming-soon/g) || []).length - (content.match(/coming-soon/g) || []).length;
    console.log(`  [${DRY_RUN ? 'DRY' : 'OK '}] ${filename}: ${diffCount} coming-soon removed`);
    totalFixed += diffCount;
    if (!DRY_RUN) fs.writeFileSync(fullPath, content);
  }
}

console.log('');
console.log(`=== Summary ===`);
console.log(`Files scanned : ${totalScanned}`);
console.log(`Total fixes   : ${totalFixed}`);
if (DRY_RUN) console.log(`\nDry run — no files written.`);
