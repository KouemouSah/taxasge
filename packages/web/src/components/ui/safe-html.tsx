'use client'

/**
 * SafeHtml / SafeMarkdown — THE render boundary for untrusted content.
 *
 * Every string that did not originate in this source tree — user input, LLM
 * output, a CMS field, a third-party API — passes through here and nowhere else.
 * `dangerouslySetInnerHTML` is forbidden elsewhere (ESLint `react/no-danger`).
 *
 * WHY A DEDICATED COMPONENT RATHER THAN "the renderer already escapes":
 * escaping entities stops tag injection but NOT dangerous URLs. A renderer that
 * escapes < > & " ' and then does
 *     html.replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2">$1</a>')
 * emits a working <a href="javascript:...">. The entity escaping is real and the
 * payload still lands. `renderMarkdown` now allowlists schemes as well
 * (defence in depth), but security must not depend on the renderer being right —
 * hence this second, independent gate.
 *
 * @module components/ui/safe-html
 */

import * as React from 'react'
import createDOMPurify from 'dompurify'

/** Schemes permitted in href. Everything else is dropped by DOMPurify. */
const SAFE_URI = /^(?:https?:|mailto:|tel:|\/|#|\.\/|\.\.\/)/i

const CONFIG = {
  ALLOWED_TAGS: [
    'p', 'br', 'span', 'div', 'strong', 'em', 'b', 'i', 'u', 's',
    'ul', 'ol', 'li', 'blockquote', 'hr',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'code', 'pre', 'a',
    'table', 'thead', 'tbody', 'tr', 'th', 'td',
  ],
  // `style` is intentionally absent: an attacker-controlled style attribute
  // enables clickjacking overlays and data exfiltration via url().
  ALLOWED_ATTR: ['href', 'title', 'target', 'rel', 'class', 'colspan', 'rowspan'],
  ALLOWED_URI_REGEXP: SAFE_URI,
  FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed', 'form', 'input', 'svg', 'math'],
  FORBID_ATTR: ['style', 'srcset', 'formaction', 'xlink:href'],
  ALLOW_DATA_ATTR: false,
}

let purifier: ReturnType<typeof createDOMPurify> | null = null

function getPurifier() {
  if (!purifier) {
    purifier = createDOMPurify(window)
    // Any link that survives sanitisation must be safe to open cross-origin.
    purifier.addHook('afterSanitizeAttributes', (node: Element) => {
      if (node.tagName === 'A' && node.hasAttribute('href')) {
        node.setAttribute('target', '_blank')
        node.setAttribute('rel', 'noopener noreferrer nofollow')
      }
    })
  }
  return purifier
}

/**
 * Sanitise an untrusted HTML string.
 *
 * Returns '' during SSR: DOMPurify needs a DOM, and "skip sanitisation on the
 * server" would ship the raw payload straight to the browser.
 */
export function sanitizeHtml(dirty: string): string {
  if (typeof window === 'undefined') return ''
  return getPurifier().sanitize(dirty, CONFIG) as unknown as string
}

export interface SafeHtmlProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Untrusted HTML. */
  html: string
  /** Rendered until the client-side sanitiser is available (SSR / first paint). */
  fallback?: React.ReactNode
}

/**
 * Renders untrusted HTML after sanitisation.
 *
 * ```tsx
 * <SafeHtml html={ministry.description} className="prose" />
 * ```
 */
export function SafeHtml({ html, fallback = null, ...rest }: SafeHtmlProps) {
  const [clean, setClean] = React.useState<string | null>(null)

  React.useEffect(() => {
    setClean(sanitizeHtml(html))
  }, [html])

  if (clean === null) return <>{fallback}</>
  // eslint-disable-next-line react/no-danger -- the single sanitised sink
  return <div {...rest} dangerouslySetInnerHTML={{ __html: clean }} />
}

export interface SafeMarkdownProps extends Omit<SafeHtmlProps, 'html'> {
  /** Untrusted markdown (user, LLM, third party). */
  markdown: string
  /** Markdown -> HTML renderer. Its correctness is not a security dependency. */
  render: (md: string) => string
}

/**
 * Renders untrusted markdown: render, then sanitise.
 *
 * ```tsx
 * <SafeMarkdown markdown={message.content} render={renderMarkdown} />
 * ```
 */
export function SafeMarkdown({ markdown, render, ...rest }: SafeMarkdownProps) {
  const html = React.useMemo(() => render(markdown), [markdown, render])
  return <SafeHtml html={html} {...rest} />
}
