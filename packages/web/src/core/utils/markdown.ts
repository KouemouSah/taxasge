/**
 * Shared Markdown Renderer
 *
 * Converts markdown text to safe HTML for rendering with dangerouslySetInnerHTML.
 * Used by chatbot MessageItem and admin assistant components.
 *
 * Supports: bold, italic, code blocks, inline code, lists, links, headings, tables.
 * Sanitizes HTML entities to prevent XSS.
 *
 * @module core/utils/markdown
 */

/**
 * URL scheme allowlist for generated links.
 *
 * Accepts absolute http(s), mailto, tel, and site-relative URLs. Everything
 * else — javascript:, data:, vbscript:, blob:, file: — is rejected.
 *
 * The check is deliberately done on the DECODED, whitespace-stripped value:
 * `java\tscript:` and `JaVaScRiPt:` are the classic bypasses.
 */
export function isSafeUrl(rawUrl: string): boolean {
  // Strip leading/trailing whitespace AND any control character: `java\tscript:`
  // and `JaVaScRiPt:` are the classic scheme-check bypasses. Done without a
  // regex so no control character ever appears in this source file.
  const url = Array.from(rawUrl.trim())
    .filter((ch) => (ch.codePointAt(0) ?? 0) > 0x20)
    .join('');
  if (!url) return false;
  // Relative and anchor targets are safe by construction.
  if (/^[#/]/.test(url) || /^\.{1,2}\//.test(url)) return true;
  // Anything else must carry an explicitly allowed scheme.
  const scheme = url.match(/^([a-zA-Z][a-zA-Z0-9+.-]*):/);
  if (!scheme) return true; // no scheme at all -> treated as relative
  return ['http', 'https', 'mailto', 'tel'].includes(scheme[1].toLowerCase());
}

/**
 * Sanitize HTML entities to prevent XSS injection
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Parse a markdown table block into styled HTML table.
 *
 * Expects format:
 *   | Header1 | Header2 |
 *   |---------|---------|
 *   | cell1   | cell2   |
 *
 * Supports alignment via separator row:
 *   :--- left, ---: right, :---: center
 */
function parseTable(tableBlock: string): string {
  const lines = tableBlock.trim().split('\n').filter(l => l.trim());
  if (lines.length < 2) return tableBlock;

  const parseRow = (line: string): string[] =>
    line.split('|').slice(1, -1).map(c => c.trim());

  const headerCells = parseRow(lines[0]);

  // Detect separator row and alignment
  const sepLine = lines[1];
  const isSeparator = /^\|[\s:]*-+[\s:]*(\|[\s:]*-+[\s:]*)*\|?\s*$/.test(sepLine);
  if (!isSeparator) return tableBlock;

  const sepCells = parseRow(sepLine);
  const alignments: string[] = sepCells.map(cell => {
    const trimmed = cell.trim();
    if (trimmed.startsWith(':') && trimmed.endsWith(':')) return 'center';
    if (trimmed.endsWith(':')) return 'right';
    return 'left';
  });

  const alignStyle = (i: number) => {
    const a = alignments[i] || 'left';
    return a !== 'left' ? ` style="text-align:${a}"` : '';
  };

  // Build header
  const thCells = headerCells
    .map((h, i) => `<th class="px-3 py-2 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b bg-muted/50"${alignStyle(i)}>${h}</th>`)
    .join('');
  const thead = `<thead><tr>${thCells}</tr></thead>`;

  // Build body rows
  const bodyLines = lines.slice(2);
  const tbodyRows = bodyLines.map((line, rowIdx) => {
    const cells = parseRow(line);
    const tds = headerCells
      .map((_, i) => `<td class="px-3 py-1.5 text-sm border-b"${alignStyle(i)}>${cells[i] ?? ''}</td>`)
      .join('');
    const stripe = rowIdx % 2 === 1 ? ' class="bg-muted/30"' : '';
    return `<tr${stripe}>${tds}</tr>`;
  }).join('');
  const tbody = `<tbody>${tbodyRows}</tbody>`;

  return `<div class="overflow-x-auto my-3 rounded-md border"><table class="w-full text-sm">${thead}${tbody}</table></div>`;
}

/**
 * Render markdown text to safe HTML string.
 *
 * @param text - Raw markdown text (from LLM or user)
 * @returns HTML string safe for dangerouslySetInnerHTML
 */
export function renderMarkdown(text: string): string {
  // Step 1: Extract code blocks and tables BEFORE escaping (they need special handling)
  const codeBlocks: string[] = [];
  const tableBlocks: string[] = [];

  // Extract fenced code blocks first
  let processed = text.replace(/```([\s\S]*?)```/g, (_match, code) => {
    const idx = codeBlocks.length;
    codeBlocks.push(code);
    return `%%CODEBLOCK_${idx}%%`;
  });

  // Extract markdown tables (consecutive lines starting/ending with |)
  processed = processed.replace(
    /(?:^|\n)((?:\|[^\n]+\|\s*\n){2,})/g,
    (_match, tableText: string, offset: number) => {
      // Only replace if starts at line boundary
      const prefix = offset > 0 && processed[offset - 1] !== '\n' ? '\n' : '';
      const idx = tableBlocks.length;
      tableBlocks.push(tableText);
      return `${prefix}%%TABLE_${idx}%%`;
    }
  );

  // Step 2: Escape HTML entities (XSS prevention)
  let html = escapeHtml(processed);

  // Step 3: Restore code blocks with styling
  html = html.replace(/%%CODEBLOCK_(\d+)%%/g, (_m, idx) => {
    const code = escapeHtml(codeBlocks[parseInt(idx)]);
    return `<pre class="bg-muted p-2 rounded text-sm overflow-x-auto my-2"><code>${code}</code></pre>`;
  });

  // Step 4: Restore tables with parsed HTML
  html = html.replace(/%%TABLE_(\d+)%%/g, (_m, idx) => {
    const tableText = tableBlocks[parseInt(idx)];
    return parseTable(escapeHtml(tableText));
  });

  // Step 5: Markdown inline transformations (order matters)

  // Inline code `code`
  html = html.replace(
    /`([^`]+)`/g,
    '<code class="bg-muted px-1 py-0.5 rounded text-sm font-mono">$1</code>'
  );

  // Headings ### h3, ## h2 (before bold, since ## can conflict)
  html = html.replace(/^### (.+)$/gm, '<h4 class="font-semibold text-sm mt-4 mb-2">$1</h4>');
  html = html.replace(/^## (.+)$/gm, '<h3 class="font-semibold text-base mt-5 mb-2">$1</h3>');

  // Bold **text**
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong class="font-semibold">$1</strong>');

  // Italic *text*
  html = html.replace(/\*([^*]+)\*/g, '<em class="italic">$1</em>');

  // Bullet lists - item (consecutive lines)
  html = html.replace(/^- (.+)$/gm, '<li class="ml-4 list-disc">$1</li>');
  html = html.replace(
    /(<li class="ml-4 list-disc">[\s\S]*?<\/li>)/g,
    '<ul class="my-1">$1</ul>'
  );
  // Clean double-wrapped <ul>
  html = html.replace(/<\/ul>\s*<ul class="my-1">/g, '');

  // Numbered lists 1. item
  html = html.replace(/^\d+\. (.+)$/gm, '<li class="ml-4 list-decimal">$1</li>');

  // Links [text](url)
  //
  // SECURITY: the URL is NOT interpolated blindly. Escaping HTML entities (step 2)
  // prevents attribute breakout but does NOT stop a dangerous scheme: the literal
  //   [click](javascript:fetch('/api/me').then(...))
  // would otherwise emit a working javascript: link. Only a scheme allowlist
  // closes that. This is defence in depth — output must still go through
  // <SafeHtml> / <SafeMarkdown>, which sanitises again.
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_match, text: string, rawUrl: string) => {
    if (!isSafeUrl(rawUrl)) {
      // Drop the link, keep the text: never silently render an unsafe href.
      return text;
    }
    return `<a href="${rawUrl}" target="_blank" rel="noopener noreferrer" class="text-primary hover:underline">${text}</a>`;
  });

  // Line breaks: double newline = paragraph break (proper spacing)
  html = html.replace(/\n\n/g, '<div class="mb-3"></div>');

  return html;
}
