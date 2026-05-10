#!/usr/bin/env node
/**
 * propagate-sidebar.js — synchronise le sidebar de toutes les pages HTML
 *
 * Source canonique : index.html (bloc `<nav class="sidebar-nav">...</nav>`)
 * Cible : tous les fichiers `*.html` dans docs/manual/ (sauf _templates/, _assets/, pagefind/)
 *
 * Pour chaque fichier cible :
 *   1. Lit son contenu
 *   2. Remplace son sidebar par le canonique
 *   3. Détecte le filename de la page courante
 *   4. Ajoute la classe `active` à l'entrée correspondante du sidebar
 *
 * Usage:
 *   node docs/manual/tools/propagate-sidebar.js
 *   node docs/manual/tools/propagate-sidebar.js --dry-run     # afficher seulement
 */

const fs = require('fs');
const path = require('path');

const MANUAL_DIR = path.resolve(__dirname, '..');
const SOURCE_FILE = path.join(MANUAL_DIR, 'index.html');
const DRY_RUN = process.argv.includes('--dry-run');

/** Extrait le bloc <nav class="sidebar-nav">...</nav> entre les balises */
function extractSidebar(content) {
  const startTag = '<nav class="sidebar-nav">';
  const endTag = '</nav>';
  const start = content.indexOf(startTag);
  if (start === -1) return null;
  const end = content.indexOf(endTag, start);
  if (end === -1) return null;
  return content.substring(start, end + endTag.length);
}

/** Remplace le sidebar dans le contenu par le canonique */
function replaceSidebar(content, canonicalSidebar) {
  const startTag = '<nav class="sidebar-nav">';
  const endTag = '</nav>';
  const start = content.indexOf(startTag);
  if (start === -1) return null;
  const end = content.indexOf(endTag, start);
  if (end === -1) return null;
  return content.substring(0, start) + canonicalSidebar + content.substring(end + endTag.length);
}

/** Marque l'entrée correspondant au filename comme active */
function setActiveLink(sidebar, currentFilename) {
  // Pattern de chaque lien : <a href="FILE.html" class="sidebar-link"...>
  // ou <a href="FILE.html" class="sidebar-link coming-soon"...>
  // On veut : <a href="FILE.html" class="sidebar-link active"...>

  // 1. D'abord retirer toute classe `active` existante (du canonique source)
  let result = sidebar.replace(/(<a [^>]*class="sidebar-link)\s+active(")/g, '$1$2');

  // 2. Ajouter active sur la bonne entrée
  // Match: <a href="11-crear-cuenta.html" class="sidebar-link"...>
  // Tolère class="sidebar-link" ou class="sidebar-link coming-soon"
  const escapedFilename = currentFilename.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const linkRegex = new RegExp(`(<a href="${escapedFilename}" class="sidebar-link)( coming-soon)?(")`, 'g');
  result = result.replace(linkRegex, '$1 active$3');

  return result;
}

/** Lister tous les fichiers HTML dans MANUAL_DIR (non récursif, racine seulement) */
function listHtmlFiles() {
  const entries = fs.readdirSync(MANUAL_DIR, { withFileTypes: true });
  return entries
    .filter((e) => e.isFile() && e.name.endsWith('.html'))
    .map((e) => e.name);
}

// === Main ===
console.log('=== propagate-sidebar.js ===');
console.log('Manual dir:', MANUAL_DIR);
console.log('Source canonical:', path.basename(SOURCE_FILE));
console.log('Dry run:', DRY_RUN);
console.log('');

const sourceContent = fs.readFileSync(SOURCE_FILE, 'utf8');
const canonical = extractSidebar(sourceContent);
if (!canonical) {
  console.error('ERROR: cannot extract sidebar from', SOURCE_FILE);
  process.exit(1);
}
console.log(`Canonical sidebar extracted: ${canonical.length} bytes\n`);

const files = listHtmlFiles();
console.log(`Found ${files.length} HTML files to process:\n`);

let updated = 0;
let unchanged = 0;
let errors = 0;

for (const filename of files) {
  const fullPath = path.join(MANUAL_DIR, filename);
  let content;
  try {
    content = fs.readFileSync(fullPath, 'utf8');
  } catch (e) {
    console.error(`  [ERR] ${filename}: ${e.message}`);
    errors++;
    continue;
  }

  const replaced = replaceSidebar(content, canonical);
  if (!replaced) {
    console.log(`  [SKIP] ${filename}: no sidebar found`);
    continue;
  }

  // Set active on this page's link
  const finalContent = replaceSidebar(content, setActiveLink(canonical, filename));
  if (!finalContent) {
    console.error(`  [ERR] ${filename}: could not re-replace sidebar`);
    errors++;
    continue;
  }

  if (finalContent === content) {
    console.log(`  [SAME] ${filename} (no change needed)`);
    unchanged++;
    continue;
  }

  if (!DRY_RUN) {
    fs.writeFileSync(fullPath, finalContent);
  }
  console.log(`  [${DRY_RUN ? 'DRY' : 'OK '}]   ${filename}`);
  updated++;
}

console.log('');
console.log('=== Summary ===');
console.log(`Updated   : ${updated}`);
console.log(`Unchanged : ${unchanged}`);
console.log(`Errors    : ${errors}`);
console.log('');
if (DRY_RUN) console.log('Dry run — no files written. Re-run without --dry-run to apply.');
