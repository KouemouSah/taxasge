#!/usr/bin/env node
/**
 * design-audit — mechanical enforcement for the design system.
 *
 * Zero dependencies. Node >= 18. Works on Windows, macOS, Linux.
 *
 *   node design-audit.mjs <repo-root>
 *   node design-audit.mjs <repo-root> --only contrast,no-raw-color
 *   node design-audit.mjs <repo-root> --json
 *   node design-audit.mjs <repo-root> --max-warnings 50
 *
 * Exit code: 0 clean · 1 errors found (or warnings above --max-warnings) · 2 bad usage.
 *
 * Rationale: anything checkable by regex or arithmetic must be checked by a
 * machine. Documentation is for judgment calls only — a rule that lives solely
 * in a markdown file is a rule that quietly stops being true.
 *
 * Optional config at <repo-root>/.designauditrc.json:
 *   {
 *     "ignore": ["packages/legacy/**"],
 *     "tokenFiles": ["src/styles/tokens.css", "src/theme/colors.ts"],
 *     "safeHtmlFiles": ["src/components/safe-html.tsx"],
 *     "disable": ["ui-string"]
 *   }
 */

import fs from 'node:fs';
import path from 'node:path';

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

const argv = process.argv.slice(2);
const root = path.resolve(argv.find((a) => !a.startsWith('--')) ?? '.');
const flag = (name) => {
  const i = argv.indexOf(`--${name}`);
  return i === -1 ? null : argv[i + 1];
};
const has = (name) => argv.includes(`--${name}`);

const onlyRules = flag('only')?.split(',').map((s) => s.trim()).filter(Boolean) ?? null;
const asJson = has('json');
const maxWarnings = Number(flag('max-warnings') ?? Infinity);

if (!fs.existsSync(root)) {
  console.error(`design-audit: no such directory: ${root}`);
  process.exit(2);
}

let config = { ignore: [], tokenFiles: [], safeHtmlFiles: [], disable: [], contrastPairs: [] };
const rcPath = path.join(root, '.designauditrc.json');
if (fs.existsSync(rcPath)) {
  try {
    config = { ...config, ...JSON.parse(fs.readFileSync(rcPath, 'utf8')) };
  } catch (e) {
    console.error(`design-audit: could not parse .designauditrc.json — ${e.message}`);
    process.exit(2);
  }
}

// ---------------------------------------------------------------------------
// Colour maths (WCAG 2.x relative luminance)
// ---------------------------------------------------------------------------

const chan = (c) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
const luminance = ([r, g, b]) => 0.2126 * chan(r / 255) + 0.7152 * chan(g / 255) + 0.0722 * chan(b / 255);
const contrast = (a, b) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};
const hslToRgb = (h, s, l) => {
  s /= 100; l /= 100;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let rgb;
  if (h < 60) rgb = [c, x, 0];
  else if (h < 120) rgb = [x, c, 0];
  else if (h < 180) rgb = [0, c, x];
  else if (h < 240) rgb = [0, x, c];
  else if (h < 300) rgb = [x, 0, c];
  else rgb = [c, 0, x];
  return rgb.map((v) => Math.round((v + m) * 255));
};
const hexToRgb = (hex) => {
  let h = hex.replace('#', '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
};

/** OKLCH -> sRGB. Tailwind v4 and most 2024+ token systems emit oklch(). */
const oklchToRgb = (L, C, hDeg) => {
  const h = (hDeg * Math.PI) / 180;
  const a = C * Math.cos(h);
  const b = C * Math.sin(h);
  // OKLab -> LMS
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.291485548 * b;
  const l = l_ ** 3, m = m_ ** 3, s = s_ ** 3;
  // LMS -> linear sRGB
  const lin = [
    +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
  // linear -> gamma-encoded 0..255
  return lin.map((v) => {
    const c = v <= 0.0031308 ? 12.92 * v : 1.055 * Math.pow(Math.max(v, 0), 1 / 2.4) - 0.055;
    return Math.round(Math.min(1, Math.max(0, c)) * 255);
  });
};

/**
 * Parse any colour notation a token file realistically uses.
 *
 * Deliberately format-agnostic: a validator that only understands one notation
 * silently reports "clean" on every project that uses another one.
 * Returns null when the value is not a resolvable colour (e.g. a var() alias).
 */
const parseColor = (raw) => {
  if (!raw) return null;
  const v = String(raw).trim().replace(/;$/, '');

  // #rgb / #rrggbb
  let m = v.match(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})\b/);
  if (m) return hexToRgb(m[0]);

  // Tailwind/shadcn bare-channel form: `H S% L%` (no wrapper, composable with /alpha)
  m = v.match(/^(-?[\d.]+)\s+([\d.]+)%\s+([\d.]+)%/);
  if (m) return hslToRgb(((Number(m[1]) % 360) + 360) % 360, Number(m[2]), Number(m[3]));

  // hsl(H S% L%) / hsl(H, S%, L%) / hsla(...)
  m = v.match(/^hsla?\(\s*(-?[\d.]+)(?:deg)?\s*[, ]\s*([\d.]+)%\s*[, ]\s*([\d.]+)%/i);
  if (m) return hslToRgb(((Number(m[1]) % 360) + 360) % 360, Number(m[2]), Number(m[3]));

  // rgb(r g b) / rgb(r, g, b) / rgba(...)
  m = v.match(/^rgba?\(\s*([\d.]+)\s*[, ]\s*([\d.]+)\s*[, ]\s*([\d.]+)/i);
  if (m) return [Number(m[1]), Number(m[2]), Number(m[3])].map((n) => Math.round(n));

  // oklch(L C H) — L may be a percentage
  m = v.match(/^oklch\(\s*([\d.]+)(%?)\s+([\d.]+)\s+(-?[\d.]+)/i);
  if (m) {
    const L = m[2] === '%' ? Number(m[1]) / 100 : Number(m[1]);
    return oklchToRgb(L, Number(m[3]), Number(m[4]));
  }

  // Bare channel triplet without units: `255 255 255` (Tailwind rgb-channel style)
  m = v.match(/^(\d{1,3})\s+(\d{1,3})\s+(\d{1,3})\s*$/);
  if (m) return [Number(m[1]), Number(m[2]), Number(m[3])];

  return null; // var() alias, colour keyword, gradient, transparent…
};

// ---------------------------------------------------------------------------
// File walking
// ---------------------------------------------------------------------------

const SKIP_DIRS = new Set([
  'node_modules', '.git', '.next', 'dist', 'build', 'out', 'coverage',
  '.expo', '.turbo', '.cache', 'android', 'ios', 'vendor', '__snapshots__',
  '.venv', 'venv', '.claude',
]);
// Stack-agnostic on purpose. A validator that only reads .tsx reports "clean"
// on a Vue/Svelte/Astro codebase, which is worse than reporting nothing.
const CODE_EXT = new Set([
  '.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs',
  '.vue', '.svelte', '.astro', '.html',
  '.css', '.scss', '.sass', '.less',
]);
/** Files that can contain component markup, whatever the framework. */
const isMarkupFile = (rel) => /\.(tsx|jsx|vue|svelte|astro|html)$/.test(rel);

const toPosix = (p) => p.split(path.sep).join('/');
const ignoreRe = config.ignore.map(
  (g) => new RegExp('^' + g.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*\*/g, '.*').replace(/(?<!\.)\*/g, '[^/]*') + '$'),
);
const isIgnored = (rel) => ignoreRe.some((re) => re.test(rel));

function walk(dir, out = []) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (SKIP_DIRS.has(e.name)) continue;
      walk(full, out);
    } else if (CODE_EXT.has(path.extname(e.name))) {
      const rel = toPosix(path.relative(root, full));
      if (!isIgnored(rel)) out.push({ full, rel });
    }
  }
  return out;
}

const files = walk(root);
const read = (f) => {
  try { return fs.readFileSync(f, 'utf8'); } catch { return ''; }
};

/**
 * What kind of codebase is this? Measured, not assumed — the answer decides
 * which rules are meaningful and which ones must report "not applicable"
 * instead of a misleading zero.
 */
function detectStack() {
  const TW = /\b(?:class|className)\s*=\s*["'`{][^"'`]*\b(?:flex|grid|p-\d|px-\d|text-\w+|bg-\w+)/;
  for (const { full, rel } of files) {
    const ext = path.extname(rel);
    if (/\.(css|scss|sass|less)$/.test(ext)) { coverage.files.style++; continue; }
    if (!isMarkupFile(rel) && !/\.(ts|js|mjs|cjs)$/.test(ext)) continue;
    const src = read(full);
    if (isMarkupFile(rel)) coverage.files.markup++;
    if (/from\s+['"]react-native['"]|from\s+['"]react-native-paper['"]/.test(src)) coverage.files.native++;
    if (/from\s+['"]react['"]|dangerouslySetInnerHTML|useState|useEffect/.test(src)) coverage.files.reactLike++;
    if (TW.test(src)) coverage.files.tailwind++;
  }
}

// A token/theme file is allowed to hold literal values — that is its job.
const TOKEN_FILE_RE = /(^|\/)(tokens?|colors?|palette|theme|design-tokens)(\.[a-z]+)?\.(css|scss|ts|tsx|js|jsx)$/i;
const isTokenFile = (rel) =>
  TOKEN_FILE_RE.test(rel) ||
  config.tokenFiles.some((t) => rel.endsWith(t.replace(/^\.\//, '')));

const findings = [];
const report = (rule, severity, file, line, message, detail) =>
  findings.push({ rule, severity, file, line, message, detail });

const ruleEnabled = (name) =>
  !config.disable.includes(name) && (!onlyRules || onlyRules.includes(name));

// Ignore matches inside a line comment — comments legitimately cite bad examples.
const isCommentLine = (line) => /^\s*(\/\/|\*|#|<!--)/.test(line);

/**
 * Raw-HTML sinks across frameworks. Every one of these takes a string and
 * inserts it into the document as markup — the XSS boundary is identical
 * regardless of which framework spells it which way.
 */
const HTML_SINK_RE = new RegExp(
  [
    'dangerouslySetInnerHTML',   // React
    'v-html',                    // Vue
    '\\{@html\\s',               // Svelte
    'set:html',                  // Astro
    '\\[innerHTML\\]',           // Angular property binding
    '\\.innerHTML\\s*=',         // plain DOM
    '\\.outerHTML\\s*=',         // plain DOM
    'insertAdjacentHTML',        // plain DOM
    'bypassSecurityTrustHtml',   // Angular DomSanitizer escape hatch
  ].join('|'),
  'g',
);

/**
 * Coverage ledger.
 *
 * A rule that finds nothing can mean two very different things: "the codebase
 * is clean" or "this rule could not read this codebase". Reporting both as
 * `0 findings` is the single most dangerous thing a quality tool can do — it
 * manufactures false confidence. Every rule therefore records whether it saw
 * any input it could actually analyse, and the report says so explicitly.
 */
const coverage = {
  contrast: { sources: 0, pairsChecked: 0 },
  files: { markup: 0, style: 0, native: 0, tailwind: 0, reactLike: 0 },
};

// Measure the stack now that the ledger exists.
detectStack();

// ---------------------------------------------------------------------------
// Rule: no-raw-color
// ---------------------------------------------------------------------------

const TW_PALETTE = 'slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose';
const TW_CLASS_RE = new RegExp(`\\b(?:bg|text|border|ring|fill|stroke|from|via|to|divide|outline|shadow|decoration|accent|caret|placeholder)-(?:${TW_PALETTE})-(?:50|[1-9]00|950)\\b`, 'g');
const TW_ARBITRARY_RE = /\b(?:bg|text|border|ring|fill|stroke|shadow|outline)-\[(?:#[0-9a-fA-F]{3,8}|rgb|rgba|hsl|hsla)[^\]]*\]/g;
const HEX_RE = /#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b/g;

if (ruleEnabled('no-raw-color')) {
  for (const { full, rel } of files) {
    if (isTokenFile(rel)) continue;
    const src = read(full);
    const isNative = /from\s+['"]react-native['"]|from\s+['"]react-native-paper['"]/.test(src);
    const lines = src.split('\n');

    lines.forEach((line, i) => {
      if (isCommentLine(line)) return;

      if (isNative) {
        // React Native: any hex literal is a token bypass.
        const m = line.match(HEX_RE);
        if (m) {
          report('no-raw-color', 'error', rel, i + 1,
            `hardcoded color ${m.slice(0, 3).join(', ')} — use a theme token`,
            line.trim().slice(0, 120));
        }
      } else {
        const cls = line.match(TW_CLASS_RE);
        if (cls) {
          report('no-raw-color', 'error', rel, i + 1,
            `palette-scale class ${[...new Set(cls)].slice(0, 3).join(', ')} — use a semantic token`,
            line.trim().slice(0, 120));
        }
        const arb = line.match(TW_ARBITRARY_RE);
        if (arb) {
          report('no-raw-color', 'error', rel, i + 1,
            `arbitrary color ${arb[0]} — use a semantic token`,
            line.trim().slice(0, 120));
        }
        // Markup files of ANY framework: a hex literal in a template, a
        // :style binding or a scoped <style> block is the same token bypass
        // as one in a React Native StyleSheet.
        if (isMarkupFile(rel)) {
          const hx = line.match(HEX_RE);
          if (hx && !/--[\w-]+\s*:/.test(line)) {
            const list = [...new Set(hx)].slice(0, 3).join(', ');
            report('no-raw-color', 'error', rel, i + 1,
              `hardcoded color ${list} — use a semantic token`,
              line.trim().slice(0, 120));
          }
        }
        if (path.extname(rel) === '.css' || path.extname(rel) === '.scss') {
          const hx = line.match(HEX_RE);
          if (hx && !/--[\w-]+\s*:/.test(line)) {
            report('no-raw-color', 'error', rel, i + 1,
              `hardcoded color ${hx[0]} outside a token declaration`, line.trim().slice(0, 120));
          }
        }
      }
    });
  }
}

// ---------------------------------------------------------------------------
// Rule: contrast
// ---------------------------------------------------------------------------

/**
 * Extract design tokens from a stylesheet, whatever the notation.
 *
 * Handles :root / .dark / [data-theme] / html.dark / @media (prefers-color-scheme)
 * and hex, rgb(), hsl(), oklch(), and bare "H S% L%" channels.
 */
function parseCssTokens(src) {
  const themes = {};
  const addBlock = (scheme, body) => {
    themes[scheme] ??= {};
    const varRe = /--([\w-]+)\s*:\s*([^;{}]+)/g;
    let v;
    while ((v = varRe.exec(body))) {
      const rgb = parseColor(v[2]);
      if (rgb) themes[scheme][v[1]] = rgb;
    }
  };

  // Any selector block that declares custom properties.
  const blockRe = /([^{}]+)\{([^{}]*--[^{}]*)\}/g;
  let m;
  while ((m = blockRe.exec(src))) {
    const selector = m[1].trim();
    if (!/--[\w-]+\s*:/.test(m[2])) continue;
    const isDark = /\.dark\b|\[data-theme=["']?dark|:root\s*\.dark|prefers-color-scheme:\s*dark/i.test(selector)
      || /prefers-color-scheme:\s*dark/i.test(src.slice(Math.max(0, m.index - 120), m.index));
    addBlock(isDark ? 'dark' : 'light', m[2]);
  }
  return themes;
}

/**
 * Extract tokens from a JS/TS token module: { light: { primary: '#..' }, dark: {...} }
 * or a flat exported object. Values may be any supported colour notation.
 */
function parseTsTokens(src) {
  const themes = {};
  const grab = (startIdx) => {
    let depth = 0, i = src.indexOf('{', startIdx), body = '';
    for (; i < src.length; i++) {
      const ch = src[i];
      if (ch === '{') depth++;
      else if (ch === '}') { depth--; if (depth === 0) break; }
      if (depth > 0) body += ch;
    }
    const entries = {};
    const kvRe = /([\w$]+)\s*:\s*['"`]([^'"`]+)['"`]/g;
    let m;
    while ((m = kvRe.exec(body))) {
      const rgb = parseColor(m[2]);
      if (rgb) entries[m[1]] = rgb;
    }
    return entries;
  };
  for (const scheme of ['light', 'dark']) {
    const start = src.search(new RegExp(`\\b${scheme}\\s*:\\s*\\{`));
    if (start === -1) continue;
    const entries = grab(start);
    if (Object.keys(entries).length) themes[scheme] = entries;
  }

  // No light/dark split? Flatten the whole module into dotted keys so grouped
  // palettes still get checked:  primary: { main, contrast } -> primary.main,
  // primary.contrast. This is the MUI / "role group" convention; without it the
  // rule silently reports nothing on a large family of real design systems.
  if (!Object.keys(themes).length) {
    const flat = {};
    const groupRe = /(\w+)\s*:\s*\{([^{}]*)\}/g;
    let g;
    while ((g = groupRe.exec(src))) {
      const group = g[1];
      const kvRe = /([\w$]+)\s*:\s*['"`]([^'"`]+)['"`]/g;
      let kv;
      while ((kv = kvRe.exec(g[2]))) {
        const rgb = parseColor(kv[2]);
        if (rgb) flat[`${group}.${kv[1]}`] = rgb;
      }
    }
    if (Object.keys(flat).length) themes.default = flat;
  }
  return themes;
}

/**
 * Pair a foreground token with its background.
 *
 * Conventions understood out of the box:
 *   `x` + `x-foreground`   (shadcn / Tailwind)
 *   `x` + `onX`            (Material Design 3)
 *   `x` + `x-fg` / `x-text` / `x-contrast`
 * Anything else: declare it in .designauditrc.json
 *   { "contrastPairs": [["--color-text", "--color-bg", 4.5]] }
 */
function derivePairs(tokens) {
  const TEXT_MIN = 4.5, UI_MIN = 3;
  const pairs = [];
  const SUFFIXES = ['-foreground', '-fg', '-text', '-contrast', 'Foreground'];

  for (const key of Object.keys(tokens)) {
    for (const suffix of SUFFIXES) {
      if (key.endsWith(suffix) && key.length > suffix.length) {
        const base = key.slice(0, -suffix.length);
        if (tokens[base]) { pairs.push([key, base, TEXT_MIN]); break; }
      }
    }
    if (/^on[A-Z]/.test(key)) {
      const base = key[2].toLowerCase() + key.slice(3);
      if (tokens[base]) pairs.push([key, base, TEXT_MIN]);
    }
  }

  // Grouped / MUI-style palettes: primary.main + primary.contrast(Text),
  // primary.container + primary.onContainer.
  for (const key of Object.keys(tokens)) {
    const dot = key.indexOf('.');
    if (dot < 0) continue;
    const group = key.slice(0, dot);
    const leaf = key.slice(dot + 1);
    if (leaf === 'contrast' || leaf === 'contrastText' || leaf === 'onMain') {
      const base = `${group}.main`;
      if (tokens[base]) pairs.push([key, base, TEXT_MIN]);
    }
    if (/^on[A-Z]/.test(leaf)) {
      const baseLeaf = leaf[2].toLowerCase() + leaf.slice(3);
      const base = `${group}.${baseLeaf}`;
      if (tokens[base]) pairs.push([key, base, TEXT_MIN]);
    }
  }

  // Control boundaries and focus rings: 3:1 against the page (WCAG 1.4.11).
  const pageKey = tokens.background ? 'background' : tokens.surface ? 'surface' : tokens.bg ? 'bg' : null;
  if (pageKey) {
    for (const k of ['input', 'ring', 'outline', 'border-strong']) {
      if (tokens[k]) pairs.push([k, pageKey, UI_MIN]);
    }
  }
  return pairs;
}

function checkPairs(themes, file) {
  for (const [scheme, tokens] of Object.entries(themes)) {
    const pairs = derivePairs(tokens);

    // Explicit pairs from config, for naming schemes this cannot infer.
    for (const [fgRaw, bgRaw, min] of config.contrastPairs ?? []) {
      const fg = String(fgRaw).replace(/^--/, '');
      const bg = String(bgRaw).replace(/^--/, '');
      if (tokens[fg] && tokens[bg]) pairs.push([fg, bg, min ?? 4.5]);
    }

    if (!pairs.length) continue;
    coverage.contrast.pairsChecked += pairs.length;

    for (const [fg, bgKey, min] of pairs) {
      const ratio = contrast(tokens[fg], tokens[bgKey]);
      if (ratio < min) {
        report('contrast', 'error', file, 0,
          `${scheme}: ${fg} on ${bgKey} = ${ratio.toFixed(2)}:1 (needs ${min}:1)`,
          min >= 4.5
            ? 'darken the background or flip the foreground; in dark themes accents go LIGHT with DARK foregrounds'
            : 'control boundaries and focus rings need 3:1 (WCAG 1.4.11)');
      }
    }
  }
}

if (ruleEnabled('contrast')) {
  for (const { full, rel } of files) {
    const ext = path.extname(rel);
    const src = read(full);
    if (/\.(css|scss|sass|less)$/.test(ext) && /--[\w-]+\s*:/.test(src)) {
      const themes = parseCssTokens(src);
      const count = Object.values(themes).reduce((n, t) => n + Object.keys(t).length, 0);
      if (count >= 4) { coverage.contrast.sources++; checkPairs(themes, rel); }
    } else if (/\.(ts|tsx|js|jsx|mjs)$/.test(ext) && isTokenFile(rel)) {
      const themes = parseTsTokens(src);
      const count = Object.values(themes).reduce((n, t) => n + Object.keys(t).length, 0);
      if (count >= 4) { coverage.contrast.sources++; checkPairs(themes, rel); }
    }
  }
  if (coverage.contrast.sources === 0) {
    report('contrast', 'warning', '(repo)', 0,
      'NO TOKEN SOURCE FOUND — contrast was NOT verified (this is not a pass)',
      'point the validator at your tokens: a stylesheet with custom properties, or a token module ' +
      'named tokens/colors/theme/palette. Custom naming? declare pairs in .designauditrc.json ' +
      '{ "contrastPairs": [["--color-text","--color-bg",4.5]] }');
  } else if (coverage.contrast.pairsChecked === 0) {
    report('contrast', 'warning', '(repo)', 0,
      `${coverage.contrast.sources} token source(s) found but NO PAIR could be derived — contrast was NOT verified`,
      'the validator pairs x/x-foreground, x/onX, x/x-fg, x/x-text. For another convention, declare ' +
      'pairs explicitly in .designauditrc.json { "contrastPairs": [["--fg","--bg",4.5]] }');
  }
}

// ---------------------------------------------------------------------------
// Rule: dark-mode-contract
// ---------------------------------------------------------------------------

if (ruleEnabled('dark-mode-contract')) {
  let declaresDark = false, darkFile = null;
  let setsClass = false, persists = false, setsColorScheme = false;

  for (const { full, rel } of files) {
    const src = read(full);
    if (!declaresDark && /(^|\s)\.dark\s*\{/m.test(src) && /--background\s*:/.test(src)) {
      declaresDark = true; darkFile = rel;
    }
    if (/classList\.(toggle|add|remove)\(\s*['"]dark['"]/.test(src) ||
        /setAttribute\(\s*['"]data-theme['"]/.test(src) ||
        /from\s+['"]next-themes['"]/.test(src)) setsClass = true;
    if (/from\s+['"]next-themes['"]/.test(src)) { persists = true; setsColorScheme = true; }
    if (/(localStorage|AsyncStorage)[^\n]{0,60}(theme|color-?scheme)/i.test(src)) persists = true;
    if (/colorScheme\s*=|color-scheme\s*:/.test(src)) setsColorScheme = true;
  }

  if (declaresDark) {
    const missing = [];
    if (!setsClass) missing.push('nothing ever applies the `dark` class / data-theme');
    if (!persists) missing.push('the preference is never persisted');
    if (!setsColorScheme) missing.push('`color-scheme` is never set (native controls stay light)');
    if (missing.length) {
      report('dark-mode-contract', 'error', darkFile, 0,
        `dark tokens are declared but the contract is incomplete: ${missing.join('; ')}`,
        'ship the toggle + persistence + pre-paint class + color-scheme, or delete the dark tokens');
    }
  }
}

// ---------------------------------------------------------------------------
// Rule: unsafe-html
// ---------------------------------------------------------------------------

if (ruleEnabled('unsafe-html')) {
  const SAFE_FILE_RE = /(safe-html|safe-markdown|sanitize)/i;
  for (const { full, rel } of files) {
    if (SAFE_FILE_RE.test(rel) || config.safeHtmlFiles.some((f) => rel.endsWith(f.replace(/^\.\//, '')))) continue;
    const src = read(full);
    if (!HTML_SINK_RE.test(src)) continue;
    HTML_SINK_RE.lastIndex = 0;
    const lines = src.split('\n');
    lines.forEach((line, i) => {
      HTML_SINK_RE.lastIndex = 0;
      if (!HTML_SINK_RE.test(line) || isCommentLine(line)) return;
      // Structured-data blobs are serialized by JSON.stringify: not an HTML sink.
      const ctx = lines.slice(Math.max(0, i - 3), i + 2).join(' ');
      if (/JSON\.stringify|application\/ld\+json/.test(ctx)) return;

      // An inline <script> whose payload is a literal with no interpolation is a
      // build-time constant (theme bootstrap, service-worker registration). It is
      // not an XSS sink — but it is an obstacle to dropping 'unsafe-inline'.
      const block = lines.slice(Math.max(0, i - 2), i + 12).join('\n');
      const isStaticScript = /<script/.test(ctx) && /__html:\s*[`'"]/.test(block) && !/\$\{/.test(block);
      if (isStaticScript) {
        report('unsafe-html', 'warning', rel, i + 1,
          'static inline <script> — safe content, but it forces `unsafe-inline` in script-src',
          'serve it with a CSP nonce, or move it to a static file');
        return;
      }

      const sanitized = /sanitiz|DOMPurify|purify/i.test(ctx);
      report('unsafe-html', sanitized ? 'warning' : 'error', rel, i + 1,
        sanitized
          ? 'sanitized inline — move it behind the shared <SafeHtml> so the config cannot drift'
          : 'raw-HTML sink with no sanitizer in scope',
        'route all untrusted HTML through ONE sanitising component (React dangerouslySetInnerHTML, ' +
        'Vue v-html, Svelte {@html}, Astro set:html, Angular [innerHTML], plain .innerHTML are the same ' +
        'boundary). Escaping entities does NOT block javascript: URLs');
    });
  }
}

// ---------------------------------------------------------------------------
// Rule: unsafe-link
// ---------------------------------------------------------------------------

if (ruleEnabled('unsafe-link')) {
  for (const { full, rel } of files) {
    const src = read(full);
    if (!src.includes('_blank')) continue;
    src.split('\n').forEach((line, i) => {
      if (!/target\s*=\s*["'{]?_blank/.test(line) || isCommentLine(line)) return;
      // rel may sit on an adjacent line of a multi-line JSX element.
      const window = src.split('\n').slice(Math.max(0, i - 3), i + 4).join(' ');
      if (/rel\s*=\s*["'{][^"'}]*noopener/.test(window)) return;
      report('unsafe-link', 'error', rel, i + 1,
        'target="_blank" without rel="noopener noreferrer"',
        'the opened page can navigate yours through window.opener');
    });
  }
}

// ---------------------------------------------------------------------------
// Rule: touch-target
// ---------------------------------------------------------------------------

if (ruleEnabled('touch-target')) {
  for (const { full, rel } of files) {
    if (!/components?\/(ui|primitives)\//.test(rel)) continue;
    const src = read(full);
    if (!/cva\(|buttonVariants|size\s*:/.test(src)) continue;
    src.split('\n').forEach((line, i) => {
      if (isCommentLine(line)) return;
      const m = line.match(/\bh-(\d+)\b/);
      if (!m) return;
      const px = Number(m[1]) * 4; // Tailwind spacing unit = 4px
      if (px > 0 && px < 44 && /(default|sm|icon|size)/.test(line)) {
        report('touch-target', 'warning', rel, i + 1,
          `size variant is ${px}px tall — below the 44px touch minimum`,
          'use h-11 (44px) for the default, or add min-h-touch on touch surfaces');
      }
    });
  }
}

// ---------------------------------------------------------------------------
// Rule: async-states
// ---------------------------------------------------------------------------

if (ruleEnabled('async-states')) {
  for (const { full, rel } of files) {
    // Only render surfaces. A `*-hooks.ts` data layer legitimately has no UI states.
    if (!isMarkupFile(rel)) continue;
    const src = read(full);
    if (!/use(Query|SWR|InfiniteQuery)\s*[(<]/.test(src)) continue;
    const hasLoading = /isLoading|isPending|isFetching|Skeleton|loading/i.test(src);
    const hasError = /isError|\berror\b|ErrorState|onRetry/i.test(src);
    const hasEmpty = /length\s*===\s*0|!\w+\.length|EmptyState|isEmpty/.test(src);
    const missing = [
      !hasLoading && 'loading',
      !hasError && 'error',
      !hasEmpty && 'empty',
    ].filter(Boolean);
    if (missing.length) {
      report('async-states', 'warning', rel, 0,
        `fetches data but has no ${missing.join(' / ')} state`,
        'every remote-data surface renders loading, empty, error, forbidden and success');
    }
  }
}

// ---------------------------------------------------------------------------
// Rule: ui-string  (hardcoded user-visible default prop values)
// ---------------------------------------------------------------------------

if (ruleEnabled('ui-string')) {
  // Matches both JSX attributes (placeholder="Select an option") and destructured
  // defaults (placeholder = 'Select an option'). The backreference keeps a French
  // apostrophe inside a double-quoted string from truncating the match.
  const DEFAULT_RE = /\b(placeholder|label|title|message|description|emptyMessage|loadingMessage|errorMessage|confirmLabel|actionLabel|cancelLabel|tooltip|alt)\s*=\s*(['"])((?:(?!\2).){4,})\2/g;
  for (const { full, rel } of files) {
    if (!isMarkupFile(rel)) continue;
    const src = read(full);
    src.split('\n').forEach((line, i) => {
      if (isCommentLine(line)) return;
      let m;
      DEFAULT_RE.lastIndex = 0;
      while ((m = DEFAULT_RE.exec(line))) {
        const value = m[3];
        if (!/[A-Za-zÀ-ÿ]/.test(value)) continue;          // no letters: not prose
        if (/^[\w.-]+$/.test(value) && !/\s/.test(value)) continue; // an i18n key / slug / variant
        if (/^\{|\$\{|^t\(/.test(value)) continue;         // already an expression
        // Format hints rather than prose: sample email, phone mask, URL, code pattern.
        if (/^[\w.+-]+@[\w.-]+$/.test(value)) continue;
        if (/^[+\d][\d\sXx().-]{4,}$/.test(value)) continue;
        if (/^(https?:\/\/|www\.)/.test(value)) continue;
        if (/^[A-Z0-9]{2,}[-_/][A-Z0-9X]{2,}/.test(value)) continue;
        report('ui-string', 'warning', rel, i + 1,
          `hardcoded UI string \`${m[1]}="${value.slice(0, 60)}"\``,
          'user-visible text — including default prop values — must come from an i18n key');
      }
    });
  }
}

// ---------------------------------------------------------------------------
// Rule: hardcoded-options  (an option list duplicating a backend enum)
// ---------------------------------------------------------------------------

if (ruleEnabled('hardcoded-options')) {
  // <SelectItem value="draft">, <Option value="draft">, <Picker.Item value="draft">
  const OPT_RE = /<(?:SelectItem|Option|Picker\.Item|MenuItem|RadioGroupItem)\b[^>]*\bvalue\s*=\s*["']([^"'{}]+)["']/g;
  for (const { full, rel } of files) {
    if (!isMarkupFile(rel)) continue;
    const src = read(full);
    const values = new Set();
    let m;
    while ((m = OPT_RE.exec(src))) {
      const v = m[1];
      // UI-only sentinels and page-size / boolean options are not domain values.
      if (['all', 'none', 'any', '__all__', '__global__', '-1', 'true', 'false', 'asc', 'desc'].includes(v)) continue;
      if (/^\d+$/.test(v)) continue;
      values.add(v);
    }
    // Three or more literal domain values in one file is an inlined enum.
    if (values.size >= 3) {
      const line = src.split('\n').findIndex((l) => OPT_RE.test(l) || /<(SelectItem|Option|Picker\.Item)\b/.test(l)) + 1;
      report('hardcoded-options', 'warning', rel, line,
        `${values.size} literal option values (${[...values].slice(0, 4).join(', ')}…) — likely a duplicated backend enum`,
        'fetch the option list from a referential endpoint; a value added in the database is silently missing here');
    }
  }
}

// ---------------------------------------------------------------------------
// Rule: free-text-referential  (a text input where a closed list exists)
// ---------------------------------------------------------------------------

if (ruleEnabled('free-text-referential')) {
  const REFERENTIAL = new Set([
    'city', 'ciudad', 'ville', 'province', 'provincia', 'region', 'country', 'pais', 'pays',
    'nationality', 'nacionalidad', 'nationalite', 'ministry', 'ministerio', 'ministere',
    'entity', 'entidad', 'entite', 'office', 'oficina', 'category', 'categoria', 'categorie',
    'sector', 'secteur', 'type', 'tipo', 'currency', 'moneda', 'devise',
    'status', 'estado', 'statut', 'role', 'rol', 'bank', 'banco', 'banque', 'regime',
  ]);

  // The SUBJECT of a field name is its last segment, except when that segment is
  // a reference suffix (`ministryId`, `cityName`) — then it is the one before.
  // `serviceCode` keeps `code` as its subject: an admin screen defining a code is
  // legitimately free text, and treating it as a referential is a false positive.
  const subjectOf = (name) => {
    const segs = name
      .replace(/[_-]+/g, ' ')
      .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
      .toLowerCase()
      .split(/\s+/)
      .filter(Boolean);
    if (!segs.length) return '';
    const last = segs[segs.length - 1];
    if ((last === 'id' || last === 'name') && segs.length > 1) return segs[segs.length - 2];
    return last;
  };

  const NAME_ATTR_RE = /\b(?:name|id|htmlFor)\s*=\s*["'`]([^"'`]+)["'`]/;

  for (const { full, rel } of files) {
    if (!isMarkupFile(rel)) continue;
    const src = read(full);
    const lines = src.split('\n');
    lines.forEach((line, i) => {
      if (isCommentLine(line)) return;
      if (!/<(Input|TextInput|Textarea)\b/.test(line)) return;
      // The element and its attributes may span several lines.
      const block = lines.slice(i, i + 6).join(' ');
      // Numeric and date controls are not the free-text problem.
      if (/type\s*=\s*["'](number|date|time|datetime-local|email|tel|url|password|search|file|checkbox|radio)["']/.test(block)) return;
      if (/Buscar|Rechercher|[Ss]earch/.test(block)) return;
      const m = block.match(NAME_ATTR_RE);
      if (!m) return;
      const subject = subjectOf(m[1]);
      if (!REFERENTIAL.has(subject)) return;
      report('free-text-referential', 'warning', rel, i + 1,
        `free-text input on "${m[1]}" — "${subject}" has a referential`,
        'bind a Select/Combobox to the referential; free text yields unmatchable values (Springfield / springfield / SPRINGFIELD ). ' +
        'On an admin screen that DEFINES this referential, free text is correct — disable the rule for that file.');
    });
  }
}

// ---------------------------------------------------------------------------
// Rule: form-primitive  (hand-wired fields bypass the aria plumbing)
// ---------------------------------------------------------------------------

if (ruleEnabled('form-primitive')) {
  for (const { full, rel } of files) {
    if (!isMarkupFile(rel)) continue;
    if (/components?\/(ui|primitives)\//.test(rel)) continue; // the primitives themselves
    const src = read(full);
    const controls = (src.match(/<(Input|Textarea|Select|Checkbox|RadioGroup|Switch|Combobox)\b/g) ?? []).length;
    if (controls < 3) continue;
    const usesForm = /<FormField\b|useFormContext|<FormItem\b|Controller\b/.test(src);
    if (usesForm) continue;
    // A read-only filter bar is not a form.
    const looksLikeForm = /onSubmit|handleSubmit|<form\b/.test(src);
    if (!looksLikeForm) continue;
    const hasAria = /aria-describedby|aria-invalid/.test(src);
    report('form-primitive', 'warning', rel, 0,
      `${controls} controls in a form that bypasses the Form primitive${hasAria ? '' : ' (and has no aria-invalid / aria-describedby)'}`,
      'route fields through the Form wrapper so label, description and error ids are wired for every field');
  }
}

// ---------------------------------------------------------------------------
// Rule: token-storage  (a credential written where a script can read it)
// ---------------------------------------------------------------------------

if (ruleEnabled('token-storage')) {
  // localStorage / sessionStorage are readable by ANY script on the origin.
  // AsyncStorage / MMKV are plaintext on disk. A token in either turns any XSS
  // (or a rooted device) into account takeover. Tokens belong in memory + an
  // HttpOnly cookie (web) or the platform keychain (mobile).
  const STORE = '(?:localStorage|sessionStorage|AsyncStorage|MMKV|storage)';
  const SECRET = '(?:token|jwt|auth|secret|credential|password|passwd|apikey|api_key|refresh|session|bearer)';
  const WRITE_RE = new RegExp(`\\b${STORE}\\s*\\.\\s*(?:setItem|set)\\s*\\(\\s*['"\`][^'"\`]*${SECRET}`, 'i');
  const READ_RE = new RegExp(`\\b${STORE}\\s*\\.\\s*(?:getItem|get)\\s*\\(\\s*['"\`][^'"\`]*${SECRET}`, 'i');

  for (const { full, rel } of files) {
    if (!/\.(ts|tsx|js|jsx|mjs|vue|svelte|astro)$/.test(rel)) continue;
    const src = read(full);
    if (!/localStorage|sessionStorage|AsyncStorage|MMKV/.test(src)) continue;
    src.split('\n').forEach((line, i) => {
      if (isCommentLine(line)) return;
      const isWrite = WRITE_RE.test(line);
      const isRead = !isWrite && READ_RE.test(line);
      if (!isWrite && !isRead) return;
      report('token-storage', 'error', rel, i + 1,
        isWrite
          ? 'a credential is WRITTEN to script-readable storage'
          : 'a credential is READ from script-readable storage (so it is stored there)',
        'any XSS on this origin can exfiltrate it. Web: access token in memory + refresh token in an ' +
        'HttpOnly/Secure/SameSite cookie. Mobile: expo-secure-store / Keychain / Keystore. ' +
        'See references/state-cache-and-session.md §4');
    });
  }
}

// ---------------------------------------------------------------------------
// Rule: sensitive-log  (a secret handed to the console)
// ---------------------------------------------------------------------------

if (ruleEnabled('sensitive-log')) {
  const LOG_RE = /\bconsole\.(log|info|debug|warn|error|table|dir)\s*\(([^)]*)\)/gi;
  const SECRET_ARG = /\b(token|jwt|password|passwd|secret|credential|apiKey|api_key|refreshToken|accessToken|authorization|bearer)\b/i;

  for (const { full, rel } of files) {
    if (!/\.(ts|tsx|js|jsx|mjs|vue|svelte|astro)$/.test(rel)) continue;
    const src = read(full);
    if (!src.includes('console.')) continue;
    src.split('\n').forEach((line, i) => {
      if (isCommentLine(line)) return;
      LOG_RE.lastIndex = 0;
      let m;
      while ((m = LOG_RE.exec(line))) {
        const args = m[2];
        if (!SECRET_ARG.test(args)) continue;
        // A message that merely names the concept is fine; a VALUE is not.
        // Heuristic: the secret word appears outside quotes, i.e. as an identifier.
        const withoutStrings = args.replace(/(['"\`])(?:(?!\1)[^\\]|\\.)*\1/g, '');
        if (!SECRET_ARG.test(withoutStrings)) continue;
        report('sensitive-log', 'error', rel, i + 1,
          `console.${m[1]} receives a credential-named value`,
          'this line ships. Logs reach browser devtools, mobile logcat over USB, and log aggregators. ' +
          'Log an identifier, never the secret');
      }
    });
  }
}

// ---------------------------------------------------------------------------
// Rule: zoom-blocked  (WCAG 1.4.4 — text must resize to 200%)
// ---------------------------------------------------------------------------

if (ruleEnabled('zoom-blocked')) {
  for (const { full, rel } of files) {
    const src = read(full);
    if (!/viewport/i.test(src)) continue;
    src.split('\n').forEach((line, i) => {
      if (isCommentLine(line)) return;
      if (!/viewport/i.test(line)) return;
      if (/user-scalable\s*[=:]\s*['"]?(no|0)/i.test(line)) {
        report('zoom-blocked', 'error', rel, i + 1,
          'viewport declares user-scalable=no — pinch-zoom is disabled',
          'direct WCAG 1.4.4 failure. Low-vision users cannot enlarge the text. Remove it; ' +
          'if the layout breaks when zoomed, fix the layout (see references/layout-and-responsive.md §4)');
      }
      const maxScale = line.match(/maximum-scale\s*[=:]\s*['"]?([\d.]+)/i);
      if (maxScale && Number(maxScale[1]) < 5) {
        report('zoom-blocked', 'error', rel, i + 1,
          `viewport caps maximum-scale at ${maxScale[1]} — zoom is limited below the required 200%`,
          'WCAG 1.4.4 requires text to reach 200%; a cap under 5 blocks it on most devices');
      }
    });
  }
}

// ---------------------------------------------------------------------------
// Rule: viewport-font  (a font-size that ignores user zoom)
// ---------------------------------------------------------------------------

if (ruleEnabled('viewport-font')) {
  // vw/vh do NOT change when the user zooms. A font-size driven by them is
  // frozen — the classic "fluid typography" mistake. The fix keeps a rem term
  // inside the clamp: clamp(1rem, 0.75rem + 1.2vw, 1.5rem).
  const CSS_RE = /font-size\s*:\s*([^;{}]+)/gi;
  const TW_RE = /\btext-\[([^\]]+)\]/g;

  /** Split a function's arguments on TOP-LEVEL commas only. */
  const splitArgs = (inner) => {
    const out = [];
    let depth = 0, cur = '';
    for (const ch of inner) {
      if (ch === '(') depth++;
      if (ch === ')') depth--;
      if (ch === ',' && depth === 0) { out.push(cur); cur = ''; continue; }
      cur += ch;
    }
    out.push(cur);
    return out.map((a) => a.trim());
  };

  const offends = (value) => {
    if (!/\d\s*(vw|vh|vmin|vmax)\b/i.test(value)) return false;

    // clamp(min, PREFERRED, max): only the PREFERRED term is applied across the
    // range that matters. clamp(1rem, 2vw, 1.5rem) is frozen under zoom even
    // though a rem appears elsewhere in the expression — that is exactly the
    // classic "fluid typography" mistake, so inspect the middle argument.
    const clamp = value.match(/clamp\s*\(([\s\S]*)\)/i);
    if (clamp) {
      const args = splitArgs(clamp[1]);
      const preferred = args.length >= 2 ? args[1] : '';
      if (!/\d\s*(vw|vh|vmin|vmax)\b/i.test(preferred)) return false; // no viewport unit where it counts
      return !/\d\s*(rem|em)\b/i.test(preferred);                     // rem anchor present -> zoom still works
    }

    // Bare calc()/expression: a rem term anywhere keeps zoom working.
    if (/calc\s*\(/i.test(value) && /\d\s*(rem|em)\b/i.test(value)) return false;
    return true;
  };

  for (const { full, rel } of files) {
    const src = read(full);
    if (!/\d(vw|vh|vmin|vmax)\b/i.test(src)) continue;
    src.split('\n').forEach((line, i) => {
      if (isCommentLine(line)) return;
      let m;
      CSS_RE.lastIndex = 0;
      while ((m = CSS_RE.exec(line))) {
        if (!offends(m[1])) continue;
        report('viewport-font', 'error', rel, i + 1,
          `font-size driven by viewport units: ${m[1].trim().slice(0, 60)}`,
          'vw/vh ignore user zoom, so the text cannot reach 200% (WCAG 1.4.4). ' +
          'Keep a rem term inside the clamp: clamp(1rem, 0.75rem + 1.2vw, 1.5rem)');
      }
      TW_RE.lastIndex = 0;
      while ((m = TW_RE.exec(line))) {
        if (!offends(m[1])) continue;
        report('viewport-font', 'error', rel, i + 1,
          `arbitrary font size in viewport units: text-[${m[1]}]`,
          'vw/vh ignore user zoom (WCAG 1.4.4). Keep a rem term inside the clamp');
      }
    });
  }
}

// ---------------------------------------------------------------------------
// Rule: body-scroll-lock  (the shell must not own the scrollbar)
// ---------------------------------------------------------------------------

if (ruleEnabled('body-scroll-lock')) {
  const JS_RE = /document\.(body|documentElement)\.style\.overflow\s*=/;
  // `html { overflow: hidden }` / `body { overflow: hidden }` in a stylesheet.
  const CSS_RE = /^\s*(html|body)[^{}]*\{[^{}]*overflow(-y)?\s*:\s*hidden/;

  for (const { full, rel } of files) {
    const src = read(full);
    if (!/overflow/.test(src)) continue;
    const lines = src.split('\n');
    lines.forEach((line, i) => {
      if (isCommentLine(line)) return;
      let hit = null;
      if (JS_RE.test(line)) hit = 'scroll locked on the document from JS';
      else if (CSS_RE.test(line)) hit = 'overflow:hidden on html/body';
      else if (/^\s*(html|body)\b/.test(line)) {
        // Selector and declaration on separate lines.
        const block = lines.slice(i, i + 6).join(' ');
        if (/\{[^{}]*overflow(-y)?\s*:\s*hidden/.test(block)) hit = 'overflow:hidden on html/body';
      }
      if (!hit) return;
      report('body-scroll-lock', 'warning', rel, i + 1,
        hit,
        'the content region owns the scroll, not the shell. Locking the document breaks iOS momentum ' +
        'scrolling, position:fixed children and scroll restoration. Lock the overlay instead ' +
        '(overscroll-behavior + inert background) and restore the position on close');
    });
  }
}

// ---------------------------------------------------------------------------
// Output
// ---------------------------------------------------------------------------

const errors = findings.filter((f) => f.severity === 'error');
const warnings = findings.filter((f) => f.severity === 'warning');

/**
 * Which rules were actually able to run on this codebase?
 *
 * `applicable: false` means the rule found no input it understands — NOT that
 * the codebase passed. Reporting that distinction is the whole point: on a
 * stack this validator does not recognise, silence would otherwise read as
 * a clean bill of health.
 */
const f = coverage.files;
const APPLICABILITY = {
  contrast: {
    applicable: coverage.contrast.pairsChecked > 0,
    why: coverage.contrast.sources === 0
      ? 'no token source found'
      : coverage.contrast.pairsChecked === 0
        ? 'tokens found but no foreground/background pair could be derived'
        : `${coverage.contrast.pairsChecked} pair(s) checked in ${coverage.contrast.sources} source(s)`,
  },
  'dark-mode-contract': {
    applicable: f.style > 0,
    why: f.style > 0 ? `${f.style} stylesheet(s)` : 'no stylesheet found',
  },
  'unsafe-html': {
    applicable: f.markup > 0,
    why: f.markup > 0 ? `${f.markup} markup file(s)` : 'no markup file found',
  },
  'unsafe-link': {
    applicable: f.markup > 0,
    why: f.markup > 0 ? `${f.markup} markup file(s)` : 'no markup file found',
  },
  'no-raw-color': {
    applicable: f.tailwind > 0 || f.native > 0 || f.style > 0,
    why: [
      f.tailwind > 0 && `${f.tailwind} file(s) using utility classes`,
      f.native > 0 && `${f.native} React Native file(s)`,
      f.style > 0 && `${f.style} stylesheet(s)`,
    ].filter(Boolean).join(', ')
      || 'no Tailwind-style classes, no React Native styles, no stylesheet — '
       + 'this rule cannot see CSS-in-JS or scoped <style> blocks',
  },
  'hardcoded-options': { applicable: f.markup > 0, why: f.markup > 0 ? `${f.markup} markup file(s)` : 'no markup file found' },
  'free-text-referential': { applicable: f.markup > 0, why: f.markup > 0 ? `${f.markup} markup file(s)` : 'no markup file found' },
  'form-primitive': { applicable: f.reactLike > 0, why: f.reactLike > 0 ? `${f.reactLike} React-like file(s)` : 'React-specific: no React files found' },
  'touch-target': { applicable: f.tailwind > 0, why: f.tailwind > 0 ? `${f.tailwind} file(s) using utility classes` : 'Tailwind-specific: no utility classes found' },
  'async-states': { applicable: f.reactLike > 0, why: f.reactLike > 0 ? `${f.reactLike} React-like file(s)` : 'React-query/SWR specific: no React files found' },
  'ui-string': { applicable: f.markup > 0, why: f.markup > 0 ? `${f.markup} markup file(s)` : 'no markup file found' },
  'token-storage': { applicable: files.length > 0, why: `${files.length} file(s) scanned` },
  'sensitive-log': { applicable: files.length > 0, why: `${files.length} file(s) scanned` },
  'zoom-blocked': { applicable: f.markup > 0, why: f.markup > 0 ? `${f.markup} markup file(s)` : 'no markup file found' },
  'viewport-font': { applicable: f.style > 0 || f.markup > 0, why: `${f.style} stylesheet(s), ${f.markup} markup file(s)` },
  'body-scroll-lock': { applicable: f.style > 0 || f.reactLike > 0, why: `${f.style} stylesheet(s), ${f.reactLike} script file(s)` },
};

const enabledRules = Object.keys(APPLICABILITY).filter((r) => ruleEnabled(r));
const inapplicable = enabledRules.filter((r) => !APPLICABILITY[r].applicable);

if (asJson) {
  console.log(JSON.stringify({
    root, filesScanned: files.length,
    errors: errors.length, warnings: warnings.length,
    coverage: {
      stack: coverage.files,
      rules: Object.fromEntries(enabledRules.map((r) => [r, APPLICABILITY[r]])),
      inapplicableRules: inapplicable,
    },
    findings,
  }, null, 2));
} else {
  const RULE_ORDER = ['contrast', 'dark-mode-contract', 'unsafe-html', 'unsafe-link', 'no-raw-color', 'hardcoded-options', 'free-text-referential', 'form-primitive', 'token-storage', 'sensitive-log', 'zoom-blocked', 'viewport-font', 'body-scroll-lock', 'touch-target', 'async-states', 'ui-string'];
  const byRule = new Map();
  for (const f of findings) {
    if (!byRule.has(f.rule)) byRule.set(f.rule, []);
    byRule.get(f.rule).push(f);
  }

  console.log(`\ndesign-audit — ${files.length} files scanned in ${root}\n`);

  // Coverage FIRST, before any result. A reader must know what was actually
  // inspected before they read how many problems were found.
  console.log(`── coverage  (${enabledRules.length - inapplicable.length}/${enabledRules.length} rules could run)`);
  for (const rule of enabledRules) {
    const a = APPLICABILITY[rule];
    console.log(`   ${a.applicable ? 'ran ' : 'N/A '} ${rule.padEnd(22)} ${a.why}`);
  }
  if (inapplicable.length) {
    console.log('');
    console.log(`   ⚠ ${inapplicable.length} rule(s) found NO INPUT THEY UNDERSTAND: ${inapplicable.join(', ')}`);
    console.log('     Zero findings from these rules means "not checked", NOT "clean".');
    console.log('     See references/portability.md to map them onto this stack.');
  }
  console.log('');

  if (!findings.length) {
    console.log(inapplicable.length
      ? `  No findings — but only ${enabledRules.length - inapplicable.length} of ${enabledRules.length} rules could run. This is NOT a clean bill of health.\n`
      : '  No findings. All enabled rules ran and passed.\n');
  }

  for (const rule of RULE_ORDER) {
    const list = byRule.get(rule);
    if (!list) continue;
    const errCount = list.filter((f) => f.severity === 'error').length;
    console.log(`── ${rule}  (${errCount} error${errCount === 1 ? '' : 's'}, ${list.length - errCount} warning${list.length - errCount === 1 ? '' : 's'})`);
    // Cap the per-rule output; the full set is available via --json.
    const shown = list.slice(0, 15);
    for (const f of shown) {
      const loc = f.line ? `${f.file}:${f.line}` : f.file;
      console.log(`   ${f.severity === 'error' ? 'ERR ' : 'WARN'} ${loc}`);
      console.log(`        ${f.message}`);
      if (f.detail) console.log(`        → ${f.detail}`);
    }
    if (list.length > shown.length) {
      console.log(`   … ${list.length - shown.length} more (use --json for the full list)`);
    }
    console.log('');
  }

  console.log(`Total: ${errors.length} error(s), ${warnings.length} warning(s)\n`);
}

if (errors.length > 0 || warnings.length > maxWarnings) process.exit(1);
process.exit(0);
