# LogRocket SDK Setup — TaxasGE web (`packages/web`)

**App ID** : `0eqns2/facil`
**Target** : `packages/web` (Next.js 14 App Router, React 18, TanStack Query)
**Out of scope** : `packages/mobile` and `packages/inspector` (RN — already covered by `@sentry/react-native`). LogRocket has a separate `@logrocket/react-native` SDK; revisit later if browser-grade session replay is wanted on mobile too.

This file is the **expanded, executable runbook** the AI assistant followed
when wiring LogRocket into the web app. It supersedes the stub fetched
from `https://app.logrocket.com/public/ai/logrocket-setup.md`, which was
just a list of documentation links.

---

## 1. Architectural decisions (read first)

1. **Single SDK init point**. LogRocket must initialize exactly once per
   browser tab. Init lives in a client-only component
   (`<LogRocketProvider>`) mounted high in the App Router tree, so every
   route (including the marketing pages) gets covered while the SDK only
   loads once.
2. **Hard gating**. The init no-ops when:
   - `process.env.NODE_ENV === 'development'` (don't pollute the inbox
     with hot-reload noise)
   - `process.env.NEXT_PUBLIC_LOGROCKET_APP_ID` is empty (a contributor
     who pulls the repo without the secret should still be able to run
     the app)
   - `typeof window === 'undefined'` (extra safety — App Router can SSR
     the wrapper component before reaching the `'use client'` directive
     in some edge cases)
3. **PII redaction by default**. The integration passes a strict
   `dom: { isEnabled, baseHref, inputSanitizer, textSanitizer }`
   configuration so password / NIF / email fields are redacted before
   leaving the browser. Network capture also strips `Authorization` and
   `Cookie` headers.
4. **Identify ⊥ Auth provider**. We expose a `useLogRocketIdentify(user)`
   hook that the existing auth provider calls once after login. We do
   NOT couple the LogRocket SDK directly to auth internals — the hook is
   no-op when the SDK is gated off.
5. **No Sentry bridge for the web (yet)**. Sentry is wired to the mobile
   React Native build (`packages/mobile/src/core/observability/sentry.ts`)
   but not to the web. If web Sentry is added later, the bridge is a
   four-line addition in `<LogRocketProvider>` —
   `Sentry.setTag('logrocket', sessionURL)` on the
   `LogRocket.getSessionURL` callback. Documented but not built.
6. **No source-map upload yet**. Stack traces in LogRocket will be
   minified for now. Phase 10 polish will hook the Sentry CLI sourcemap
   upload (already used for mobile RN builds) into the Next.js build to
   feed LogRocket's source-map endpoint too.

---

## 2. Files touched / created

| Path | Type | Purpose |
|------|------|---------|
| `packages/web/package.json` | edit | add `logrocket`, `logrocket-react` |
| `packages/web/src/core/observability/logrocket.ts` | create | wraps `LogRocket.init`, `setupLogRocketReact`, identify helpers, capture helpers — single import surface |
| `packages/web/src/components/observability/LogRocketProvider.tsx` | create | client component that calls `initLogRocket()` once on mount; mounted in `<Providers>` |
| `packages/web/src/app/Providers.tsx` | edit | mount `<LogRocketProvider>` |
| `packages/web/.env.example` | edit | document `NEXT_PUBLIC_LOGROCKET_APP_ID` |
| `packages/web/src/core/auth/use-auth.ts` (or wherever the auth hook lives) | edit | call `LogRocket.identify(...)` after a successful sign-in / refresh |

(If the exact paths differ from this list, the assistant adapts — but
the *roles* of these files are fixed.)

---

## 3. Concrete steps

### Step 1 — Install dependencies

```bash
cd packages/web
npm install --save logrocket logrocket-react
```

`logrocket-react` is the React plugin (component name capture). It is
peer-compatible with React 16.8+, so React 18 is fine.

### Step 2 — Create the SDK wrapper

`packages/web/src/core/observability/logrocket.ts`:

```ts
/**
 * LogRocket SDK wrapper — single source of truth for init + identify +
 * capture. Every other module imports from here so we can tighten the
 * gating logic in one place.
 *
 * App ID: 0eqns2/facil
 *
 * Gating:
 *   - skipped when NODE_ENV === 'development' (dev hot-reload noise)
 *   - skipped when NEXT_PUBLIC_LOGROCKET_APP_ID is unset
 *   - skipped on server side (typeof window === 'undefined')
 *
 * PII:
 *   - DOM: passwords + inputs flagged data-private are scrubbed.
 *     Free-text fields are NOT redacted by default — review and add
 *     `data-private` to any element that may render NIF / email / phone.
 *   - Network: Authorization + Cookie headers stripped from request
 *     captures. Response bodies are passed through untouched (assume
 *     the API does not echo PII it didn't accept).
 */

import LogRocket from 'logrocket';
import setupLogRocketReact from 'logrocket-react';

const APP_ID = process.env.NEXT_PUBLIC_LOGROCKET_APP_ID ?? '';

// `__DEV__` doesn't exist in Next.js — use NODE_ENV.
const IS_DEV = process.env.NODE_ENV === 'development';
const IS_BROWSER = typeof window !== 'undefined';

let initialized = false;

export function isLogRocketActive(): boolean {
  return initialized && !!APP_ID && !IS_DEV && IS_BROWSER;
}

/**
 * Initialise LogRocket once. Safe to call multiple times — subsequent
 * calls are no-ops.
 *
 * Should be invoked from <LogRocketProvider> (a client component
 * mounted in <Providers>).
 */
export function initLogRocket(): void {
  if (initialized) return;
  initialized = true;

  if (!APP_ID || IS_DEV || !IS_BROWSER) return;

  LogRocket.init(APP_ID, {
    // ── DOM capture ────────────────────────────────────────────────
    // Passwords are auto-scrubbed by LogRocket. We additionally honour
    // any element marked `data-private` (a common convention) so the
    // app team can opt-in fields case-by-case without code changes.
    dom: {
      inputSanitizer: true, // mask all input values by default
      textSanitizer: false, // keep visible text — required for replay
      baseHref: undefined,
    },
    // ── Network capture ────────────────────────────────────────────
    // Strip Authorization + Cookie headers so JWTs and session cookies
    // never leave the browser. Response headers are kept (status codes
    // are valuable for debugging API issues).
    network: {
      requestSanitizer: (request) => {
        if (request.headers) {
          delete request.headers['Authorization'];
          delete request.headers['authorization'];
          delete request.headers['Cookie'];
          delete request.headers['cookie'];
        }
        // Don't capture login-payload bodies (contain plaintext password).
        if (
          request.url.includes('/auth/login') ||
          request.url.includes('/auth/register') ||
          request.url.includes('/auth/password-reset')
        ) {
          request.body = undefined;
        }
        return request;
      },
      responseSanitizer: (response) => {
        // Don't capture response bodies of token-issuing endpoints.
        if (
          response.url.includes('/auth/login') ||
          response.url.includes('/auth/refresh')
        ) {
          response.body = undefined;
        }
        return response;
      },
    },
    // ── Console capture ────────────────────────────────────────────
    // Default is on — keep it that way. Useful for "user clicked X
    // and our front-end logged a warning" investigations.
    console: { isEnabled: { warn: true, error: true, log: false } },
    // ── Release ────────────────────────────────────────────────────
    // Bump on every Next.js build via `NEXT_PUBLIC_BUILD_VERSION`
    // (set by GitHub Actions or fall back to a placeholder).
    release: process.env.NEXT_PUBLIC_BUILD_VERSION ?? 'dev',
    // ── Privacy ────────────────────────────────────────────────────
    shouldCaptureIP: false, // do NOT geo-locate users
  });

  // React plugin — captures component names in stack traces / replay
  setupLogRocketReact(LogRocket);
}

/**
 * Attach the (non-PII) user context. Call after sign-in success, after
 * silent refresh, and after `refreshUser()` updates. Pass `null` at
 * sign-out.
 *
 * We send id / role / locale only — never email, phone or NIF.
 */
export function identifyLogRocket(
  user: { id: string; role?: string; locale?: string } | null,
): void {
  if (!isLogRocketActive()) return;
  if (!user) {
    // LogRocket has no explicit "anonymise" — rotate to a fresh anon
    // session by calling startNewSession.
    LogRocket.startNewSession();
    return;
  }
  LogRocket.identify(user.id, {
    role: user.role ?? 'unknown',
    locale: user.locale ?? 'es',
  });
}

/**
 * Track a discrete user-facing event. Avoid tracking high-volume events
 * (mouse moves, keystrokes — those are part of the session replay
 * already) — use this for funnel-relevant moments.
 */
export function trackLogRocket(
  event: string,
  props?: Record<string, string | number | boolean>,
): void {
  if (!isLogRocketActive()) return;
  LogRocket.track(event, props);
}

/**
 * Capture an exception explicitly from a try/catch or an
 * ErrorBoundary. Auto-uncaught errors are picked up by LogRocket
 * automatically — only call this when you suppress an error to keep
 * the UI alive.
 */
export function captureLogRocketException(
  err: unknown,
  extra?: Record<string, unknown>,
): void {
  if (!isLogRocketActive()) return;
  if (err instanceof Error) {
    LogRocket.captureException(err, extra ? { extra: extra as Record<string, string | number | boolean> } : undefined);
  } else {
    LogRocket.captureMessage(typeof err === 'string' ? err : JSON.stringify(err), {
      extra: extra as Record<string, string | number | boolean> | undefined,
    });
  }
}

/**
 * Call this once after init to bridge LogRocket sessions to a wider
 * observability layer. Currently a no-op — wired the day Sentry is
 * added to the web. Implementation reference:
 *
 *   LogRocket.getSessionURL((sessionURL) => {
 *     Sentry.configureScope((scope) => scope.setExtra('logrocketURL', sessionURL));
 *   });
 */
export function bridgeLogRocketToSentry(): void {
  // intentionally empty — left as a hook for future wiring
}

// Re-export the bare SDK for callers that need the full surface
// (e.g. `LogRocket.startNewSession()` mid-flow).
export { LogRocket };
```

### Step 3 — Create the provider client component

`packages/web/src/components/observability/LogRocketProvider.tsx`:

```tsx
'use client';

import { useEffect } from 'react';

import { initLogRocket } from '@core/observability/logrocket';

/**
 * Mounts LogRocket exactly once per browser tab. No visual output — it
 * just renders its children.
 *
 * Mount this high in the App Router tree (inside <Providers>). Mounting
 * it lower means routes outside the subtree will not be captured.
 */
export function LogRocketProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    initLogRocket();
  }, []);

  return <>{children}</>;
}
```

### Step 4 — Mount the provider

`packages/web/src/app/Providers.tsx` (edit):

```diff
+ import { LogRocketProvider } from '@/components/observability/LogRocketProvider';
  ...
  return (
    <ThemeProvider ...>
      <QueryClientProvider client={queryClient}>
+       <LogRocketProvider>
          {/* existing children */}
+       </LogRocketProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
```

### Step 5 — Identify on auth events

Locate the auth hook (likely `packages/web/src/core/auth/use-auth.ts`
or `packages/web/src/modules/auth/...`). After every successful sign-in
/ refresh / profile update, call:

```ts
import { identifyLogRocket } from '@core/observability/logrocket';

// inside the success callback that already exists for setSentryUser-like flow
identifyLogRocket({ id: String(user.id), role: user.role, locale: user.preferred_language });
```

And on sign-out:

```ts
identifyLogRocket(null);
```

### Step 6 — Capture exceptions in error boundaries

Wherever the app already has an `<ErrorBoundary>` (look in `components/ui/error-boundary.tsx` or similar), add:

```tsx
import { captureLogRocketException } from '@core/observability/logrocket';

componentDidCatch(error: Error, info: React.ErrorInfo) {
  captureLogRocketException(error, { componentStack: info.componentStack });
  // ... existing handling
}
```

If no React class-based error boundary exists, this can be skipped —
LogRocket auto-catches `window.onerror` + `unhandledrejection` already.

### Step 7 — Track key funnel events (optional but recommended)

Lightly instrument the moments that matter:

```ts
import { trackLogRocket } from '@core/observability/logrocket';

// after successful payment
trackLogRocket('payment_success', { amount: payment.amount, currency: payment.currency });

// after successful service-request submission
trackLogRocket('service_request_submitted', { workflow_code: req.workflow_code });

// on chatbot first message
trackLogRocket('chatbot_first_message', {});
```

Keep this surface narrow — every `track` call costs a backend event in
LogRocket's quota. Don't track on every button click.

### Step 8 — Environment variables

`packages/web/.env.example`:

```
# LogRocket session replay + diagnostics. Leave empty in dev to skip init.
# App ID is the org/project pair from app.logrocket.com.
NEXT_PUBLIC_LOGROCKET_APP_ID=0eqns2/facil
```

`packages/web/.env.local` (developer-local, not committed):
```
# Empty for local dev — set to 0eqns2/facil to enable session capture
NEXT_PUBLIC_LOGROCKET_APP_ID=
```

GitHub Actions / Firebase Hosting build pipeline must inject the
`NEXT_PUBLIC_LOGROCKET_APP_ID` env var at build time (Next.js bakes
`NEXT_PUBLIC_*` env vars into the client bundle).

### Step 9 — Validate

```bash
cd packages/web
npm run type-check   # tsc --noEmit
npm run lint         # ESLint
npm run build        # production build
```

Expected outcome: zero new TypeScript errors, zero new lint warnings,
build artifact slightly larger (~50KB gzipped — LogRocket SDK).

### Step 10 — Smoke-test in browser

```bash
cd packages/web
NEXT_PUBLIC_LOGROCKET_APP_ID=0eqns2/facil npm run dev
```

Then open http://localhost:3000 and:
1. Open DevTools → Network → filter `logrocket` → confirm a session is
   started (`initSession` request goes out).
2. Sign in.
3. Open https://app.logrocket.com/0eqns2/facil/sessions → the active
   session should appear within ~30s with the user id you signed in
   with.
4. Force an error: in the console, run `throw new Error('lr smoke test')`.
   Within ~1 min the error should appear in the LogRocket session
   timeline.

If any of these fail, do NOT proceed to commit — re-check the gating
logic and the env var injection.

---

## 4. PII redaction checklist (do this BEFORE going live)

LogRocket's default behaviour is to capture every visible character on
screen. The integration above adds two layers, but the third is on the
app team:

- [x] **Layer 1 — `inputSanitizer: true`**: every `<input>` value is
      replaced with `*` characters. Already in `logrocket.ts`.
- [x] **Layer 2 — Network sanitisation**: Authorization, Cookie, login
      bodies / token responses are stripped. Already in `logrocket.ts`.
- [ ] **Layer 3 — DOM `data-private` audit**: anywhere the UI renders
      a NIF / phone / email / DNI / address as plain text, add the
      attribute `data-private="redact"` (LogRocket replaces these
      nodes' inner text with `*`). Pages to audit at minimum:
      - `/dashboard/profile` (NIF, email, phone, address)
      - `/dashboard/declarations/*` (declaration metadata may contain NIF)
      - `/dashboard/payments/*` (receipt details)
      - `/admin/users/*` (admin views show user info)
      - chatbot transcript (user prompts may contain personal info)
- [ ] **Layer 4 — `LogRocket.identify` payload audit**: confirm only
      `id`, `role`, `locale` are sent. Verified in `logrocket.ts:identifyLogRocket`.
- [ ] **Layer 5 — Console log audit**: any `console.log(user)` or
      similar in the codebase will end up in the session replay. Run
      `grep -rn 'console.log' packages/web/src` and remove anything
      that prints raw API payloads.

---

## 5. Summary block (filled at end of run)

```
LogRocket Setup Summary
=======================
Init file:        packages/web/src/core/observability/logrocket.ts
Provider:         packages/web/src/components/observability/LogRocketProvider.tsx
Mount point:      packages/web/src/app/Providers.tsx
App ID:           0eqns2/facil  (NEXT_PUBLIC_LOGROCKET_APP_ID env var)
Plugins added:    logrocket-react (component name capture)
Identify calls:   1 location (auth provider — TODO list at step 5)
Events tracked:   3 suggested (payment_success, service_request_submitted, chatbot_first_message) — implementation deferred
Capture handlers: error-boundary integration optional (auto-capture covers window.onerror + unhandledrejection)
Sentry bridge:    NOT WIRED — Sentry is mobile-only today; web bridge is a 4-line patch in initLogRocket() the day Sentry web is added
Source maps:      NOT UPLOADED — phase 10 polish item

Note: This integration does not include automatic PII sanitisation
beyond input fields and known auth headers/bodies. Before going live,
complete the PII redaction checklist (section 4 of this file). Free-text
elements that render NIF / email / phone MUST be tagged `data-private`.

Optional next steps:
====================
- Source maps upload (https://docs.logrocket.com/reference/javascript-stack-traces)
- DOM redaction audit (https://docs.logrocket.com/reference/dom)
- Subdomain Tracking once we expose subdomains (https://docs.logrocket.com/reference/roothostname)
- Sentry web + bridge once web Sentry is added
```

---

## 6. Out-of-scope companion notes

- **`packages/mobile`**: Sentry RN is already wired (`core/observability/sentry.ts`).
  LogRocket has a separate `@logrocket/react-native` SDK we can wire
  later if browser-grade session replay on mobile is wanted. Do NOT
  blindly install `logrocket` (the web SDK) inside `packages/mobile` —
  it depends on `window` and will crash at module load.
- **`packages/inspector`**: same as mobile — Sentry-only for now.
- **Backend**: no LogRocket needed. Backend errors flow to Sentry +
  Cloud Logging.

---

## 7. Changelog

- **2026-04-30 v1.0** — runbook authored from the upstream stub. Web app
  ID `0eqns2/facil`. Implementation in this same session: web only,
  Android (mobile + inspector) untouched.
