#!/usr/bin/env node
/**
 * merge-translations.js — Phase 9 merger
 *
 * Reads the 5 partial JSON files per language (fr-G1.json, fr-G2.json, ...,
 * en-G1.json, ...) produced by the parallel translation agents, then
 * reconstructs `fr.js` and `en.js` so they mirror the namespace order of
 * `es.js` and preserve the existing file-header comment.
 *
 * Existing keys already in fr.js / en.js (the scaffold: common, nav, etc.)
 * are PRESERVED unless the partials provide a translation (the partials
 * should NOT touch namespaces outside their grappe — they only cover
 * pageNN namespaces).
 *
 * Usage:
 *   node docs/manual/tools/merge-translations.js [--check]
 *
 *   --check : do not write, only validate partials are parsable + count keys
 */

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const TMP = path.join(ROOT, 'i18n', 'messages', '.tmp');
const ES_PATH = path.join(ROOT, 'i18n', 'messages', 'es.js');
const GROUPS = ['G1', 'G2', 'G3', 'G4a', 'G4b'];

function loadModule(modulePath) {
  const code = fs.readFileSync(modulePath, 'utf8');
  const sandbox = { window: {} };
  // eslint-disable-next-line no-new-func
  new Function('window', code)(sandbox.window);
  return sandbox.window.__I18N__;
}

function countLeaves(obj) {
  let n = 0;
  if (obj === null || typeof obj !== 'object') return 0;
  for (const k of Object.keys(obj)) {
    const v = obj[k];
    if (typeof v === 'string') n++;
    else if (typeof v === 'object' && v !== null) n += countLeaves(v);
  }
  return n;
}

function loadPartial(lang, group) {
  const filePath = path.join(TMP, `${lang}-${group}.json`);
  if (!fs.existsSync(filePath)) {
    return { ok: false, error: `MISSING: ${filePath}` };
  }
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(raw);
    return { ok: true, data, leaves: countLeaves(data) };
  } catch (e) {
    return { ok: false, error: `INVALID JSON in ${filePath}: ${e.message}` };
  }
}

function readHeader(filePath) {
  const code = fs.readFileSync(filePath, 'utf8');
  // Header = everything up to (but not including) "window.__I18N__"
  const idx = code.indexOf('window.__I18N__');
  if (idx === -1) return '';
  return code.substring(0, idx);
}

function loadExisting(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const i18n = loadModule(filePath);
  // Detect lang
  const keys = Object.keys(i18n);
  if (keys.length === 0) return {};
  return i18n[keys[0]] || {};
}

function topLevelOrder(esRoot) {
  return Object.keys(esRoot);
}

function buildFile(lang, header, mergedRoot, esOrder) {
  // Build a deterministic object literal that follows ES top-level order
  const ordered = {};
  for (const k of esOrder) {
    if (Object.prototype.hasOwnProperty.call(mergedRoot, k)) {
      ordered[k] = mergedRoot[k];
    }
  }
  // Append any extra keys (shouldn't happen, but guard)
  for (const k of Object.keys(mergedRoot)) {
    if (!Object.prototype.hasOwnProperty.call(ordered, k)) {
      ordered[k] = mergedRoot[k];
    }
  }

  const body = JSON.stringify(ordered, null, 2);
  // The JSON body is a valid JS object literal; prefix with the IIFE shape used by es.js
  return (
    header +
    `window.__I18N__ = window.__I18N__ || {};\n` +
    `window.__I18N__.${lang} = ${body};\n`
  );
}

function main() {
  const checkOnly = process.argv.includes('--check');
  const errors = [];
  const stats = [];

  // 1. Validate all 10 partials
  for (const lang of ['fr', 'en']) {
    for (const grp of GROUPS) {
      const r = loadPartial(lang, grp);
      if (!r.ok) {
        errors.push(`[${lang} ${grp}] ${r.error}`);
      } else {
        stats.push({ lang, grp, leaves: r.leaves });
      }
    }
  }

  // 2. Compare leaf counts with ES per group
  const esRoot = loadModule(ES_PATH).es;
  const esOrder = topLevelOrder(esRoot);

  const grpPages = {
    G1: ['page01', 'page11', 'page12', 'page13', 'page14', 'page15', 'page16', 'page17'],
    G2: ['page21', 'page22', 'page23', 'page24', 'page25', 'page26', 'page27', 'page28', 'page29',
         'page31', 'page32', 'page33', 'page34', 'page35', 'page36', 'page37', 'page38', 'page39'],
    G3: ['page41', 'page42', 'page43', 'page44',
         'page51', 'page52', 'page53', 'page54', 'page55', 'page56', 'page57', 'page58', 'page59'],
    G4a: ['page60', 'page61', 'page62', 'page63', 'page64', 'page65', 'page66', 'page67', 'page68', 'page69'],
    G4b: ['page71', 'page72', 'page73', 'page74',
          'page81', 'page82', 'page83', 'page84', 'page85', 'page86', 'page87', 'page88', 'page89'],
  };

  for (const [grp, pages] of Object.entries(grpPages)) {
    let esLeaves = 0;
    for (const p of pages) esLeaves += countLeaves(esRoot[p] || {});
    for (const lang of ['fr', 'en']) {
      const r = loadPartial(lang, grp);
      if (r.ok && r.leaves !== esLeaves) {
        errors.push(`[${lang} ${grp}] leaf count mismatch: ES=${esLeaves} got=${r.leaves}`);
      }
    }
  }

  console.log('=== Partial validation ===');
  for (const s of stats) console.log(`  ${s.lang}-${s.grp}: ${s.leaves} leaves`);
  if (errors.length) {
    console.log('\n=== ERRORS ===');
    for (const e of errors) console.log('  ' + e);
    if (!checkOnly) {
      console.log('\nAborting merge (errors present). Re-run with --check after fixing.');
      process.exit(1);
    }
  } else {
    console.log('\nAll partials valid and counts match ES per group.');
  }

  if (checkOnly) {
    console.log('\n--check mode: not writing files.');
    return;
  }

  // 3. Merge per language
  for (const lang of ['fr', 'en']) {
    const filePath = path.join(ROOT, 'i18n', 'messages', `${lang}.js`);
    const header = readHeader(filePath);
    const existing = loadExisting(filePath);

    // Merge partials on top of existing (partials replace pageNN namespaces)
    const merged = Object.assign({}, existing);
    for (const grp of GROUPS) {
      const r = loadPartial(lang, grp);
      if (!r.ok) continue;
      for (const ns of Object.keys(r.data)) {
        merged[ns] = r.data[ns];
      }
    }

    const out = buildFile(lang, header, merged, esOrder);
    fs.writeFileSync(filePath, out);
    const sizeKB = (Buffer.byteLength(out, 'utf8') / 1024).toFixed(1);
    const leafTotal = countLeaves(merged);
    console.log(`Wrote ${filePath}: ${leafTotal} leaves, ${sizeKB} KB`);
  }

  // 4. Final verification
  console.log('\n=== Final verification ===');
  const esLeafTotal = countLeaves(esRoot);
  console.log(`ES total leaves: ${esLeafTotal}`);
  for (const lang of ['fr', 'en']) {
    const filePath = path.join(ROOT, 'i18n', 'messages', `${lang}.js`);
    const root = loadModule(filePath)[lang];
    const total = countLeaves(root);
    console.log(`${lang.toUpperCase()} total leaves after merge: ${total} (delta vs ES: ${total - esLeafTotal})`);
  }
}

main();
