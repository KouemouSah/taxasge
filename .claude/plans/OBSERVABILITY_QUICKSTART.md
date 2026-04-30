# Observability — Hands-on Tutorial

**Last updated**: 2026-04-30 (v1.1)
**Companion (deep dive)**: [`OBSERVABILITY_STACK.md`](./OBSERVABILITY_STACK.md) — ~750-line reference. This file walks you through end-to-end; jump to the deep dive when you hit a section labeled "📚 read more".

**Target reader**: an engineer who just cloned the repo and wants observability working from zero, plus enough context to debug the first incident they hit.

**Time**: ~25 minutes if you read every step, ~5 minutes for the GCP/build cheat sheet at the bottom.

---

## Step 0 — Prerequisites

Install once on your laptop:

| Tool | Why | Install |
|---|---|---|
| Node.js 20+ | Workspace dep manager + EAS CLI | `nvm install 20` |
| `gcloud` | Read secrets from GCP Secret Manager | https://cloud.google.com/sdk/docs/install |
| `gh` (GitHub CLI) | Inspect / rerun workflows, manage repo secrets | https://cli.github.com/ |
| Android SDK + JDK 17 | Local mobile builds (optional — EAS Cloud is the canonical path) | `brew install --cask android-studio temurin@17` (macOS) |
| Xcode | iOS local builds (macOS only, optional) | App Store |

Ask the lead to add your Google account to the `taxasge-dev` GCP project (role: `Secret Manager Secret Accessor`) and to the GitHub `KouemouSah/taxasge` repo.

---

## Step 1 — Authenticate GCP and verify Secret Manager access

```bash
gcloud auth login                       # opens a browser
gcloud config set project taxasge-dev
gcloud auth application-default login   # for SDK clients (e.g. backend)
```

Verify:

```bash
gcloud secrets list
```

**Expected output** — you should see lines like:

```
expo-token              Automatic
sentry-auth-token       Automatic
logrocket-app-id        Automatic
database-url            Automatic
jwt-secret-key          Automatic
firebase-admin-key-dev  Automatic
…
```

If the list is empty or you get `PERMISSION_DENIED`, your IAM role isn't right yet. Tell the lead. **Don't** copy values from another teammate's terminal.

📚 **Read more**: [`OBSERVABILITY_STACK.md §2.1`](./OBSERVABILITY_STACK.md#21-origin-of-truth-google-cloud-secret-manager) for the full secret catalog and rotation cadence.

---

## Step 2 — Authenticate GitHub CLI

```bash
gh auth login
```

Pick `https`, follow the browser flow. Verify:

```bash
gh auth status
```

You should see `Logged in to github.com account <your-handle>` and the token scopes should include `repo` and `workflow`. If `workflow` is missing, run `gh auth refresh -s workflow`.

This lets you list / rerun CI workflows from the terminal — essential for on-call.

---

## Step 3 — Clone the repo and install dependencies

```bash
git clone https://github.com/KouemouSah/taxasge.git
cd taxasge

# Workspace install (web + shared deps; mobile + inspector hoist here too)
npm install --legacy-peer-deps
```

`--legacy-peer-deps` is needed because some Expo packages still ship strict peer deps that conflict with the workspace's React 19 hoist. Without the flag, `npm` aborts.

📚 **Read more**: [`OBSERVABILITY_STACK.md §5.1`](./OBSERVABILITY_STACK.md#51-local-dev-every-contributor) for the full local setup including backend.

---

## Step 4 — Run the web app locally

Observability is **off by default in dev**. You don't need any LogRocket env var to start.

```bash
cd packages/web
cp .env.example .env.local              # one-time
npm run dev
```

Open http://localhost:3000 . Open DevTools → Network tab → filter `logrocket`. You should see **zero** requests — the SDK is gated off in `NODE_ENV=development`.

This is correct. To verify the gating logic itself works:

```bash
# packages/web/.env.local
NEXT_PUBLIC_LOGROCKET_APP_ID=0eqns2/facil
```

Restart `npm run dev`, navigate the app, then check https://app.logrocket.com/0eqns2/facil/sessions — you should see a session within ~30 s. Once verified, **remove** the line so you don't pollute the staging dashboard with local navigation.

📚 **Read more**: [`OBSERVABILITY_STACK.md §1`](./OBSERVABILITY_STACK.md#1-tools-in-production-today) explains the gating logic in `packages/web/src/core/observability/logrocket.ts`.

---

## Step 5 — Run the mobile app locally

Same idea: SDK no-ops in `__DEV__`.

```bash
cd packages/mobile
npm install --legacy-peer-deps          # if you skipped the workspace install
npm start                               # Metro bundler
# Then press `a` for Android emulator or `i` for iOS simulator
```

If `expo-doctor` warns about your Android SDK / JDK paths, fix those before continuing — they don't block startup but block native builds.

The first launch on a fresh emulator takes 2–3 minutes (Gradle download). Subsequent launches are < 30 s.

You'll see a **Sentry warning in Metro logs** complaining about the missing DSN — that's expected; Sentry is gated off in `__DEV__` too.

**If your laptop has < 16 GB free RAM** the local Android build will OOM (Gradle exits with `3221225794` on Windows or a plain Java OOM on macOS / Linux). Fix in [`§7.10`](./OBSERVABILITY_STACK.md#710-local-android-build--gradle-jvm-out-of-memory-exit-code-3221225794) — single architecture + larger heap. EAS Cloud builds are unaffected.

📚 **Read more**:
- [`§7.6`](./OBSERVABILITY_STACK.md#76-logrocket-rn-requires-android-minsdkversion--25) — manifest merger error (LogRocket needs minSdk 25).
- [`§7.10`](./OBSERVABILITY_STACK.md#710-local-android-build--gradle-jvm-out-of-memory-exit-code-3221225794) — Gradle JVM OOM during local Android build.
- [`§7.11`](./OBSERVABILITY_STACK.md#711-axioserror-network-error-after-doze--app-resume) — `AxiosError: Network Error` after Doze (`setupQueryListeners`).

---

## Step 6 — Read a secret on demand (rotation, debug)

Don't `cat .env` — values change. Read live from Secret Manager:

```bash
# Quick read
gcloud secrets versions access latest --secret=expo-token

# Use it inline (recommended — never write to disk)
export EXPO_TOKEN="$(gcloud secrets versions access latest --secret=expo-token)"
eas whoami
```

Add convenience aliases in your `~/.bashrc` / `~/.zshrc`:

```bash
alias expo-token='gcloud secrets versions access latest --secret=expo-token --project=taxasge-dev'
alias sentry-token='gcloud secrets versions access latest --secret=sentry-auth-token --project=taxasge-dev'
```

📚 **Read more**: [`OBSERVABILITY_STACK.md §4.3`](./OBSERVABILITY_STACK.md#43-read-a-secret-on-a-developer-laptop) for the rotation procedure.

---

## Step 7 — Trigger a mobile build via EAS Cloud

Two ways:

### 7a — Via GitHub Actions (the canonical path)

```bash
gh workflow run mobile-eas-build.yml \
  --repo KouemouSah/taxasge \
  --ref develop \
  -f profile=preview \
  -f platform=android
```

Then watch:

```bash
gh run list --workflow=mobile-eas-build.yml --limit 3
```

The orchestrator runs in ~2 min on the GitHub runner; the actual build runs on EAS Cloud (5–15 min) and you get the artifact at https://expo.dev/accounts/emacsah/projects/facil/builds.

### 7b — Direct from your laptop (faster feedback when iterating)

```bash
cd packages/mobile
EXPO_TOKEN="$(expo-token)" eas build \
  --profile preview --platform android \
  --non-interactive --no-wait
```

`--no-wait` returns immediately. Track progress with:

```bash
EXPO_TOKEN="$(expo-token)" eas build:list --limit 3
```

📚 **Read more**: [`OBSERVABILITY_STACK.md §3 (CI/CD)`](./OBSERVABILITY_STACK.md#cicd) for the workflow-file-by-workflow-file reference.

---

## Step 8 — When a build fails, read this first

This is the part you'll come back to most often. Below is the actual triage sequence we use today.

### 8.1 — Get the error message

```bash
gh run list --workflow=mobile-eas-build.yml --limit 1
# Note the RUN_ID
gh run view RUN_ID --log-failed | tail -80
```

If the failure is on the EAS side (orchestrator succeeded but build failed):

```bash
EXPO_TOKEN="$(expo-token)" eas build:list --limit 1 --json | jq '.[0].error'
EXPO_TOKEN="$(expo-token)" eas build:view BUILD_ID
```

### 8.2 — Match the error to a known trap

This catalogue is curated from this session + prior `MOBILE_USER_*` /
`MOBILE_BUGFIX_*` / `MOBILE_INSPECTOR_*` session bilans, kept short on
purpose — only traps that **recur on infrastructure / build / runtime**
(not one-off code bugs that have already been fixed in the codebase).

#### Build & deploy (CI / EAS Cloud)

| Error fragment | Root cause | Fix link |
|---|---|---|
| `ENOENT … gradlew` | `/android` in `.gitignore` strips files from EAS upload | [`§7.2`](./OBSERVABILITY_STACK.md#72-gitignore-strips-android-from-eas-uploads) — add `.easignore` |
| `minSdkVersion 24 cannot be smaller than 25` | New native module needs higher API level | [`§7.6`](./OBSERVABILITY_STACK.md#76-logrocket-rn-requires-android-minsdkversion--25) — bump `ext.minSdkVersion` |
| `image should be square` | Icon dimensions not 1:1 | [`§7.8`](./OBSERVABILITY_STACK.md#78-eas-cloud-run_expo_doctor-is-stricter-than-local) — pad transparent canvas |
| `An Expo user account is required` | `EXPO_TOKEN` not in step env scope | [`§7.4`](./OBSERVABILITY_STACK.md#74-expo_token-job-scope-vs-step-scope) — hoist to job-level env |
| `could not read Username for 'https://github.com'` | `GH_PAT` expired | [`§7.7`](./OBSERVABILITY_STACK.md#77-github-actions-pat-gh_pat-silent-expiry) — rotate |
| Frontend lacks `LOGROCKET_APP_ID` in bundle | `--build-arg` not passed at Docker build | [`§7.5`](./OBSERVABILITY_STACK.md#75-cloud-run---set-env-vars-doesnt-help-next_public_) — Cloud Build YAML |
| `secrets.EXPO_TOKEN` empty in workflow | Secret created AFTER the dispatch | [`§7.3`](./OBSERVABILITY_STACK.md#73-github-actions-secret-created-after-workflow-run) — wait 1 min, redispatch |

#### Local mobile build (Gradle / native)

| Error fragment | Root cause | Fix link |
|---|---|---|
| `Out of memory: Java heap` / exit `3221225794` | Default RN build does 4 archs in parallel, OOMs on < 16 GB free RAM | [`§7.10`](./OBSERVABILITY_STACK.md#710-local-android-build--gradle-jvm-out-of-memory-exit-code-3221225794) — `arm64-v8a` only + `-Xmx4g` |
| Build hangs at `compileDebugKotlin` | Gradle daemon stale | `cd packages/mobile/android && ./gradlew --stop` then retry |

#### Runtime mobile (production crashes / silent failures)

| Symptom | Root cause | Fix link |
|---|---|---|
| Sentry receives 0 events for React render errors | `<SentryErrorBoundary>` outside `<ErrorBoundary>` — inner boundary swallows error | [`§7.9`](./OBSERVABILITY_STACK.md#79-sentryerrorboundary-outside-errorboundary-swallows-react-errors) — collapse to one boundary that calls `captureException` |
| `AxiosError: Network Error` after backgrounding then resuming | Android Doze killed TCP, React Query has no AppState listener | [`§7.11`](./OBSERVABILITY_STACK.md#711-axioserror-network-error-after-doze--app-resume) — `setupQueryListeners` (focusManager + onlineManager) |
| App "hangs" with spinner after resume | Same as above (network in flight when backgrounded) | Same fix |
| `AxiosError: Request failed with status code 500` consistently on one endpoint | Backend enum / schema mismatch — always check Cloud Run logs first | n/a — backend bug, not an observability trap |

### 8.3 — Apply the fix, re-trigger

For most fixes:
1. Edit the file the trap points to.
2. Commit + push.
3. The auto-tag workflow will pick it up: any push to `develop` touching `packages/mobile/**` creates a tag `v1.0.X` which fires `mobile-eas-build.yml` automatically.

For a one-shot rerun without a code change (e.g. you just rotated `GH_PAT`):

```bash
gh run rerun RUN_ID --repo KouemouSah/taxasge
```

📚 **Read more**: [`OBSERVABILITY_STACK.md §7`](./OBSERVABILITY_STACK.md#7-known-traps) lists every known trap and its full diagnosis path.

---

## Step 9 — Add observability to a feature you're building

You almost never need to touch the SDK directly — the wrappers cover the common cases.

### 9.1 — Identify a user after login (already wired)

The auth providers call `identifyLogRocket` (web + mobile + inspector) and `setSentryUser` (mobile) automatically when the user signs in. You don't add this on every page.

If you implement a new login flow (e.g. impersonation):

```ts
// Mobile
import { identifyLogRocket } from '@core/observability/logrocket';
import { setSentryUser } from '@core/observability/sentry';

setSentryUser({ id, role, locale });
identifyLogRocket({ id, role, locale });

// Logout
setSentryUser(null);
identifyLogRocket(null);   // rotates to a fresh anonymous session
```

**Critical rule**: `id`, `role`, `locale` only. **Never** include `email`, `phone`, `nif`, `address`. The wrappers enforce the safe shape via TypeScript, but a `as any` bypass would leak PII to LogRocket / Sentry.

### 9.2 — Track a funnel-relevant event

```ts
import { trackLogRocket } from '@core/observability/logrocket';

trackLogRocket('payment_success', { amount: payment.amount });
trackLogRocket('service_request_submitted', { workflow_code: req.workflow_code });
```

**Don't** track on every button click — every event burns LogRocket quota and clutters the timeline.

### 9.3 — Capture a swallowed exception

The SDKs auto-catch `window.onerror` / `unhandledrejection` (web) and unhandled JS errors (mobile, via `shouldDetectExceptions: true`). Only call this **explicitly** when you `try/catch` an error and decide to keep the UI alive:

```ts
import { captureLogRocketException } from '@core/observability/logrocket';
// or captureException from @core/observability/sentry on mobile

try {
  await fragileOperation();
} catch (err) {
  captureLogRocketException(err, { context: 'fragile-operation' });
  showFallbackUi();
}
```

📚 **Read more**: [`OBSERVABILITY_STACK.md §3`](./OBSERVABILITY_STACK.md#3-repository-wiring-file-level-reference) — the exact wrapper file for each package.

---

## Step 10 — Redact PII from session replays

Two **opposite** defaults you must remember.

### Web — capture by default, opt out
LogRocket captures all visible text by default (you set this in `packages/web/src/core/observability/logrocket.ts:textSanitizer: false`). Tag elements that render PII:

```tsx
<div data-private="redact">
  NIF: {user.nif}
</div>
<input data-private="redact" value={passport} />
```

The `data-private` attribute is a LogRocket convention. The redaction happens in the browser before the event is uploaded — server never sees the raw value.

### Mobile / Inspector — redact by default, opt in
RN wrappers set `textSanitizer: 'excluded'` — every `<Text>` is masked unless you wrap it. Use `<LRAllow>` for content you confirm is non-PII:

```tsx
import { LRAllow } from '@logrocket/react-native';

// Safe to show (button label, navigation, public price):
<LRAllow><Text>Continuer</Text></LRAllow>

// Default behaviour (masked):
<Text>{user.nif}</Text>
```

### Why opposite defaults?
Web is desktop, often used by agents on shared machines — capturing is more useful for triage. Mobile is personal devices with sensitive forms (passport, NIF, address) — redacting by default is safer. The trade-off cost: replays on mobile are less informative until you audit and `<LRAllow>`-wrap non-PII zones.

📚 **Read more**: [`OBSERVABILITY_STACK.md §1`](./OBSERVABILITY_STACK.md#1-tools-in-production-today) for the full PII redaction strategy + L1–L4 layers in the wrapper.

---

## Step 11 — Deploying to a new environment

Out of scope for this tutorial. The deep dive has dedicated sections per cloud:

- GCP (current setup): [`§5.2`](./OBSERVABILITY_STACK.md#52-gcp-staging--production-current-setup)
- AWS migration: [`§5.3`](./OBSERVABILITY_STACK.md#53-aws-deployment)
- Azure migration: [`§5.4`](./OBSERVABILITY_STACK.md#54-azure-deployment)
- Bare-metal VPS (Hetzner / OVH / DigitalOcean): [`§5.5`](./OBSERVABILITY_STACK.md#55-bare-metal-vps-hetzner-ovh-digitalocean-droplet)
- Air-gapped (no internet): [`§5.6`](./OBSERVABILITY_STACK.md#56-local-only--air-gapped)

Each section has a service-mapping table (`Cloud Run → App Runner / Container Apps`) and a step-by-step migration checklist.

---

## Cheat sheet (5-minute version)

If you read nothing else, copy this:

```bash
# === Auth ===
gcloud auth login && gcloud config set project taxasge-dev
gh auth login                                                    # repo + workflow scopes

# === Get a secret ===
gcloud secrets versions access latest --secret=expo-token        # plus -token / -app-id variants
gh secret list --repo KouemouSah/taxasge                         # what's mirrored to GitHub
EXPO_TOKEN="$(...)" eas env:list --environment preview           # what's on EAS

# === Trigger / inspect builds ===
gh workflow run mobile-eas-build.yml --repo KouemouSah/taxasge --ref develop -f profile=preview -f platform=android
gh run list --workflow=mobile-eas-build.yml --limit 5
gh run view RUN_ID --log-failed | tail -80
EXPO_TOKEN="$(...)" eas build:list --limit 3 --json | jq '.[0].error'

# === Rerun a failed run (e.g. after rotating GH_PAT) ===
gh run rerun RUN_ID --repo KouemouSah/taxasge

# === Rotate a secret (origin → mirrors) ===
NEW="..."
echo -n "$NEW" | gcloud secrets versions add MY_SECRET --project=taxasge-dev --data-file=-
gh secret set MY_SECRET --repo KouemouSah/taxasge --body "$NEW"
EXPO_TOKEN="$(...)" eas env:update --environment preview --name MY_SECRET --value "$NEW"
```

---

## What's next?

Pinned items in [`OBSERVABILITY_STACK.md §8`](./OBSERVABILITY_STACK.md#8-future-enhancements):

- Sentry web (`@sentry/nextjs`) + activate `bridgeLogRocketToSentry()` body in the web wrapper.
- Sentry RN on inspector (currently no Sentry there).
- Source-map upload to LogRocket via `@sentry/cli`.
- Auto-rotation cron for `expo-token`, `sentry-auth-token`, `GH_PAT` (60-day pre-expiry alert).

If something here is wrong or out of date, fix it — this file is a living tutorial, not a frozen wiki.
