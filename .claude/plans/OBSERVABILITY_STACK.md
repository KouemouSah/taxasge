# Observability Stack — Facil

**Last updated**: 2026-04-30 (v1.1)
**Owner**: Engineering
**Audience**: Engineers wiring observability on a new environment, debugging an existing one, or onboarding to the project.

This document is the single source of truth for: which observability tools are wired, how secrets flow from origin to runtime, and how to recreate the whole stack on a fresh environment (local, GCP, AWS, Azure, bare-metal VPS, on-prem).

---

## 1. Tools in production today

| Tool | Scope | What it captures | SDK/integration | Free tier |
|---|---|---|---|---|
| **Sentry** | `packages/mobile` only | Crashes, native stack traces, alerting (Slack/email) | `@sentry/react-native@7.2`, init in `_layout.tsx` `<DeferredEffects>` | 5K errors + 10K txn / month |
| **LogRocket (web)** | `packages/web` | Session replay, console, network, user funnel | `logrocket@12` + `logrocket-react@7`, init in `<LogRocketProvider>` mounted by `Providers.tsx` | 1K sessions/month |
| **LogRocket (RN)** | `packages/mobile`, `packages/inspector` | Touches, screens, network, console, perf | `@logrocket/react-native@1.62` + native Maven repo | shared with web quota |
| **Cloud Logging** | Backend (Cloud Run) | structured JSON logs from FastAPI | stdout → GCP automatic | Free up to 50 GiB |
| **GitHub Actions** | CI / build pipelines | Build & deploy logs, artifact retention | `gh` CLI / Actions UI | Free for public; 2K min/month for private |

**Not yet wired** (intentional):
- Sentry web (`@sentry/nextjs`) — web side relies on LogRocket capture for now. Bridge stub `bridgeLogRocketToSentry()` exists in `packages/web/src/core/observability/logrocket.ts` for the day Sentry web is added (4-line edit).
- Sentry inspector RN — inspector has no Sentry yet. Stub bridge in `packages/inspector/src/core/observability/logrocket.ts` is no-op.
- LogRocket source-map upload — stack traces in LogRocket are minified.
- APM / distributed tracing — out of scope at current scale.

---

## 2. Secret topology

### 2.1 Origin of truth: Google Cloud Secret Manager

Project: `taxasge-dev` (will mirror to `taxasge-pro` when production is provisioned).

| Secret name | Value type | Where it's consumed | Rotation cadence |
|---|---|---|---|
| `expo-token` | Expo personal access token | EAS CLI on CI + on developer machines | 90 days, or on team change |
| `sentry-auth-token` | Sentry user auth token (`sntryu_*`) | sourcemap upload, Sentry CLI in CI | 180 days |
| `logrocket-app-id` | `<org>/<project>` (e.g. `0eqns2/facil`) | NEXT_PUBLIC_/EXPO_PUBLIC_ env vars at build time | Never (public, baked into client bundle) |
| `database-url` | Postgres DSN (Supabase) | Backend Cloud Run | 90 days |
| `jwt-secret-key` | HS256 signing key | Backend + frontend middleware | Never (changing breaks all sessions) |
| `firebase-admin-key-dev` | Firebase Admin SDK service account | Backend push notifications, storage | On compromise |
| `firebase-admin-key-pro` | Same, prod | Same, prod | On compromise |
| `gemini-api-key`* | Gemini Vertex AI key | Backend chatbot RAG | 90 days |
| `cron-secret` | HMAC for `/cron/*` endpoints | Backend scheduler | 180 days |

*Some entries currently live as GitHub repo secrets only — migrating to GCP Secret Manager is on the to-do list. Pattern below.

### 2.2 Flow diagrams

#### Backend (Cloud Run)
```
Secret Manager (taxasge-dev)
        │
        ▼  (gcloud secrets versions access)
GitHub Actions deploy-backend-staging.yml
        │
        ▼  (--set-secrets="DATABASE_URL=database-url:latest")
Cloud Run service env
        │
        ▼  (process.env.DATABASE_URL)
FastAPI app
```

#### Web (Cloud Run + Docker)
```
Secret Manager (taxasge-dev)
        │
        ▼  manually mirrored once into GitHub repo secrets
GitHub Actions deploy-frontend-staging.yml
        │
        ▼  --build-arg NEXT_PUBLIC_LOGROCKET_APP_ID=...
Docker BUILDER stage
        │
        ▼  Next.js bakes NEXT_PUBLIC_* into the client bundle
Docker IMAGE
        │
        ▼  gcloud run deploy --image
Cloud Run service
```

#### Mobile / Inspector (EAS Cloud)
```
Secret Manager (taxasge-dev)
        │
        ▼  manually mirrored once into EAS env vars (eas env:create)
EAS Cloud builder
        │
        ▼  eas.json env block injects EXPO_PUBLIC_LOGROCKET_APP_ID
EAS Build worker
        │
        ▼  Expo CLI bakes EXPO_PUBLIC_* into the JS bundle
APK / IPA / AAB artifact
        │
        ▼  Play Store / App Store / direct distribution
End-user device
```

### 2.3 Secret mirror matrix

| Secret | GCP SM | GitHub Repo | EAS env | Cloud Run env | Notes |
|---|:-:|:-:|:-:|:-:|---|
| `expo-token` | ✅ | ✅ `EXPO_TOKEN` | n/a | n/a | GitHub copy needed because Actions can't reach SM without service account; auto-rotation script in §4.4 keeps them in sync |
| `sentry-auth-token` | ✅ | ✅ `SENTRY_AUTH_TOKEN` | ✅ secret | n/a | EAS uploads sourcemaps via Sentry CLI |
| `logrocket-app-id` | ✅ | ✅ `LOGROCKET_APP_ID` | ✅ plaintext (preview+prod) | ✅ via `--build-arg` | plaintext OK — present in client bundle anyway |
| `database-url` | ✅ | n/a | n/a | ✅ via `--set-secrets` | Backend only |
| `jwt-secret-key` | ✅ | n/a | n/a | ✅ via `--set-secrets` | Backend only |
| `firebase-*` | ✅ | n/a | n/a | ✅ via `--set-secrets` | Backend only |

`✅ plaintext` for `logrocket-app-id` on EAS is deliberate: EAS `secret`-typed env vars cannot back `EXPO_PUBLIC_*` keys (they'd be redacted from the bundle), and the LogRocket App ID is public anyway (visible in DevTools network).

### 2.4 What is NOT in any secret store

- The user account password `libressai@gmail.com / Seigneur` lives in your personal password manager (1Password / Bitwarden / Apple Keychain). Do **not** put it in GCP Secret Manager — Secret Manager is for machine credentials. Human passwords should support 2FA, recovery flows, and per-user rotation that machine secret stores can't model cleanly.
- Apple Developer Account API key (`.p8`) — uploaded directly to EAS via `eas credentials` and stored on Expo servers. Not pulled at build time.

---

## 3. Repository wiring (file-level reference)

### Backend
- `packages/backend/app/core/secrets.py` — Secret Manager client (lazy load, in-memory cache).
- `packages/backend/.env.example` — variable names only, no values.
- `.github/workflows/deploy-backend-staging.yml` — `gcloud run deploy --set-secrets=...`

### Web
- `packages/web/src/core/observability/logrocket.ts` — SDK wrapper.
- `packages/web/src/components/observability/LogRocketProvider.tsx` — client component mounted in `Providers.tsx`.
- `packages/web/src/core/auth/storage.ts` — `identifyLogRocket` plugged into `setAuthData/clearAuthData`.
- `packages/web/.env.example` — `NEXT_PUBLIC_LOGROCKET_APP_ID`, `NEXT_PUBLIC_BUILD_VERSION`.
- `packages/web/Dockerfile` — `ARG NEXT_PUBLIC_LOGROCKET_APP_ID` + `ENV` line.
- `.github/workflows/deploy-frontend-staging.yml` — passes `_NEXT_PUBLIC_LOGROCKET_APP_ID=${{ secrets.LOGROCKET_APP_ID }}` to Cloud Build substitutions.

### Mobile
- `packages/mobile/src/core/observability/sentry.ts` — Sentry RN wrapper (existing).
- `packages/mobile/src/core/observability/logrocket.ts` — LogRocket RN wrapper.
- `packages/mobile/src/app/_layout.tsx` — `initSentry()` and `initLogRocket()` inside `<DeferredEffects>`.
- `packages/mobile/src/core/auth/auth-provider.tsx` — `setSentryUser` + `identifyLogRocket` co-located.
- `packages/mobile/app.json` — `expo-build-properties` plugin with `minSdkVersion: 25` + `extraMavenRepos` (informational in non-CNG mode; see §6).
- `packages/mobile/android/build.gradle` — `ext.minSdkVersion = 25` + Maven repo entry (canonical in non-CNG mode — committed natives).
- `packages/mobile/eas.json` — `EXPO_PUBLIC_LOGROCKET_APP_ID` in `preview` + `production` env blocks.
- `packages/mobile/.easignore` — overrides `.gitignore` so `/android` ships to EAS (without it: `ENOENT gradlew` at FIX_GRADLEW phase).

### Inspector
- Same files as mobile but in `packages/inspector/`.
- No Sentry RN yet — `bridgeLogRocketToSentry()` is a no-op stub.
- No `.easignore` — `packages/inspector/.gitignore` does not contain `/android`, so the default behavior is correct.
- `android/build.gradle` includes `ext { minSdkVersion = 25 }` (added — LogRocket RN requirement, see §7.6).

### CI/CD
- `.github/workflows/mobile-eas-build.yml` — orchestrates `eas build` via `EXPO_TOKEN` secret.
- `.github/workflows/inspector-build.yml` — same for inspector.
- `.github/workflows/deploy-frontend-staging.yml` — Docker build + Cloud Run deploy.
- `.github/workflows/deploy-backend-staging.yml` — Cloud Run deploy with SM secrets bound at runtime.

---

## 4. Operating procedures

### 4.1 Add a new secret

```bash
# 1. Create in Secret Manager (origin of truth)
echo -n "VALUE_HERE" | gcloud secrets create my-secret \
  --project=taxasge-dev \
  --data-file=- \
  --replication-policy=automatic \
  --labels=usage=ci,scope=observability

# 2. Mirror to GitHub repo (only if used by Actions)
gh secret set MY_SECRET --repo KouemouSah/taxasge \
  --body "$(gcloud secrets versions access latest --secret=my-secret --project=taxasge-dev)"

# 3. Mirror to EAS (only if used in mobile/inspector builds)
cd packages/mobile  # or packages/inspector
EXPO_TOKEN="$(gcloud secrets versions access latest --secret=expo-token --project=taxasge-dev)" \
  eas env:create --environment preview --name MY_SECRET \
  --value "$(gcloud secrets versions access latest --secret=my-secret --project=taxasge-dev)" \
  --visibility plaintext --non-interactive
```

### 4.2 Rotate an existing secret

```bash
# 1. Generate new value at the upstream provider (Expo, Sentry, etc.)
NEW_VALUE="..."

# 2. Add new version to Secret Manager (old version stays accessible 24h grace)
echo -n "$NEW_VALUE" | gcloud secrets versions add my-secret \
  --project=taxasge-dev --data-file=-

# 3. Mirror to GitHub
gh secret set MY_SECRET --repo KouemouSah/taxasge --body "$NEW_VALUE"

# 4. Mirror to EAS (per environment)
EXPO_TOKEN="$(...)" eas env:update --environment preview --name MY_SECRET --value "$NEW_VALUE"

# 5. Disable the old SM version after CI re-runs successfully
gcloud secrets versions disable VERSION_NUMBER --secret=my-secret --project=taxasge-dev
```

### 4.3 Read a secret on a developer laptop

```bash
# Set up once
gcloud auth login
gcloud config set project taxasge-dev

# Read on demand — never write to disk
export EXPO_TOKEN="$(gcloud secrets versions access latest --secret=expo-token)"
eas whoami
```

Convenience aliases (in `~/.bashrc` or `~/.zshrc`):
```bash
alias expo-token='gcloud secrets versions access latest --secret=expo-token --project=taxasge-dev'
alias sentry-token='gcloud secrets versions access latest --secret=sentry-auth-token --project=taxasge-dev'
```

### 4.4 Emergency: assume a token leaked

1. Revoke at upstream (Expo, Sentry, etc.) — kills the live token immediately.
2. Generate a fresh one.
3. Run §4.2 to rotate.
4. Search git history: `git log -p --all -S "<first 8 chars of leaked token>"` — if a hit, tell the team and consider repo history rewrite (BFG Repo-Cleaner).
5. Search team chat (Slack, Discord, email) for the same prefix.
6. Audit dependent systems for unauthorized usage (Expo build queue, Sentry events, etc.).

---

## 5. Multi-environment deployment guide

### 5.1 Local dev (every contributor)

**Required tools**:
- Node.js 20+ (use `nvm`)
- `gcloud` SDK (`https://cloud.google.com/sdk/docs/install`)
- `gh` CLI (optional but useful)
- For mobile: Android SDK + JDK 17, optionally Xcode (macOS only)

**Setup**:
```bash
git clone https://github.com/KouemouSah/taxasge.git
cd taxasge

# Pull workspace deps
npm install --legacy-peer-deps

# Authenticate gcloud once (gives you SM read access if your account is granted)
gcloud auth application-default login
gcloud config set project taxasge-dev

# Backend
cp packages/backend/.env.example packages/backend/.env
# Fill in DATABASE_URL etc. — values are in Secret Manager
echo "DATABASE_URL=$(gcloud secrets versions access latest --secret=database-url)" >> packages/backend/.env

# Web
cp packages/web/.env.example packages/web/.env.local
# LogRocket is OFF by default in dev — leave NEXT_PUBLIC_LOGROCKET_APP_ID empty

# Mobile
# expo-doctor will warn about icons — non-blocking
cd packages/mobile && npm install --legacy-peer-deps
```

**Run locally**:
- Backend: `uvicorn app.main:app --reload` (port 8000)
- Web: `cd packages/web && npm run dev` (port 3000)
- Mobile: `cd packages/mobile && npm start` then `i` (iOS) or `a` (Android)
- Inspector: `cd packages/inspector && npm start` (uses port 8081 by default)

**LogRocket / Sentry behavior in dev**:
- Both SDKs auto-no-op when `__DEV__ === true` or `NODE_ENV === 'development'`. You will not flood the staging dashboards by running locally — but if you want to test the wrapper logic, set `NEXT_PUBLIC_LOGROCKET_APP_ID=0eqns2/facil` in `.env.local` AND `NODE_ENV=production`.

---

### 5.2 GCP staging / production (current setup)

Primary target. Everything wired and documented above.

**Minimum IAM roles for a service account that runs the backend**:
- `roles/secretmanager.secretAccessor` (read SM)
- `roles/cloudsql.client` (if you migrate off Supabase)
- `roles/datastore.user` (if you migrate to Firestore)
- `roles/run.invoker` (call other Cloud Run services)

**Provisioning checklist** (one-shot per environment):
- [ ] Cloud Run service created (`taxasge-backend-{env}`, `taxasge-frontend-{env}`).
- [ ] Service accounts with the IAM roles above.
- [ ] Artifact Registry repository for Docker images.
- [ ] All `Documentations/OBSERVABILITY_STACK.md §2.1` secrets created in Secret Manager.
- [ ] GitHub Actions service account JSON uploaded as `GCP_SERVICE_ACCOUNT_KEY` repo secret.
- [ ] `LOGROCKET_APP_ID`, `EXPO_TOKEN`, `SENTRY_AUTH_TOKEN` mirrored to repo secrets.
- [ ] EAS project per app: `eas init` → upload secrets via `eas env:create`.

---

### 5.3 AWS deployment

Replace GCP-specific moving parts:

| Concept | GCP | AWS |
|---|---|---|
| Container runtime | Cloud Run | App Runner / Fargate |
| Secret store | Secret Manager | AWS Secrets Manager |
| Container registry | Artifact Registry | ECR |
| Build pipeline | Cloud Build | CodeBuild (or keep GitHub Actions) |
| Object storage | Cloud Storage | S3 |
| Logs | Cloud Logging | CloudWatch Logs |
| CI service account | GCP service account JSON | IAM user with programmatic access keys, or OIDC role for GitHub Actions (preferred) |

**Migration steps (backend, condensed)**:
1. Replace `app/core/secrets.py` with an AWS Secrets Manager client (`@aws-sdk/client-secrets-manager` or `boto3`).
2. Update Dockerfile — no GCP-specific changes; image stays portable.
3. Push image to ECR instead of GCR (`docker tag`, `docker push`).
4. Replace `gcloud run deploy` calls in `.github/workflows/deploy-backend-staging.yml` with `aws apprunner update-service` or `aws ecs update-service`.
5. Recreate the same secrets in AWS Secrets Manager:
   ```bash
   aws secretsmanager create-secret --name database-url --secret-string "$(...)"
   ```
6. Bind secrets to the running service (App Runner: `RuntimeEnvironmentSecrets`; ECS: `taskDefinition.containerDefinitions[].secrets`).

**Frontend (Next.js)**: same Docker image works — just deploy on App Runner or Amplify Hosting (Amplify has native Next.js SSR support).

**EAS**: unchanged. EAS is platform-agnostic; the only AWS dependency is whatever your CI uses to call `eas build`.

---

### 5.4 Azure deployment

| Concept | GCP | Azure |
|---|---|---|
| Container runtime | Cloud Run | Container Apps |
| Secret store | Secret Manager | Key Vault |
| Container registry | Artifact Registry | Azure Container Registry (ACR) |
| Build pipeline | Cloud Build | Azure DevOps Pipelines (or keep GitHub Actions) |
| Object storage | Cloud Storage | Blob Storage |
| Logs | Cloud Logging | Application Insights / Log Analytics |
| CI auth | GCP service account JSON | Service principal (preferred: federated identity from GitHub OIDC) |

Same migration pattern as AWS. Key differences:
- **Container Apps revisions**: each deploy creates an immutable revision; revert via traffic split, not `rollback`.
- **Key Vault**: secret access requires either MSI (managed identity bound to the Container App) or a service principal. Set up MSI once; it eliminates secret bootstrap problem.
- **Sourcemap upload to Sentry**: ensure your CI agent has outbound HTTPS to `sentry.io` — Azure DevOps's Microsoft-hosted agents do, but self-hosted agents behind corporate proxy may not.

---

### 5.5 Bare-metal VPS (Hetzner, OVH, DigitalOcean droplet)

When you don't have a managed secret store. Two patterns:

#### Pattern A — Docker Swarm or Compose with `.env` files

```
/opt/facil/
├── .env.backend          # chmod 600, owned by deploy user
├── .env.frontend
├── docker-compose.yml
└── data/
    └── postgres/
```

`.env.backend` is populated **manually** at first deploy from a printed copy of your Secret Manager values — **rotate immediately after** so the values you transcribed are no longer current. Then keep rotation strictly through the manual SSH path.

```yaml
# docker-compose.yml
services:
  backend:
    image: ghcr.io/kouemousah/facil-backend:latest
    env_file:
      - .env.backend
    restart: unless-stopped
```

**Pros**: simple. **Cons**: secret rotation is painful; secrets sit on disk; no audit log; no per-secret access control.

#### Pattern B — HashiCorp Vault on the same VPS

```bash
# Once, on the VPS
docker run -d --name=vault -p 8200:8200 hashicorp/vault server
vault operator init
vault operator unseal
vault kv put secret/facil/database-url value="postgres://..."
```

Backend reads from Vault at boot via `VAULT_ADDR` + `VAULT_TOKEN`:
```python
# packages/backend/app/core/secrets.py — Vault adapter
import hvac
client = hvac.Client(url=os.getenv("VAULT_ADDR"), token=os.getenv("VAULT_TOKEN"))
DATABASE_URL = client.secrets.kv.v2.read_secret_version(path="facil/database-url")["data"]["data"]["value"]
```

**Pros**: rotation is fast, audit log exists, per-token ACL. **Cons**: another moving part to operate; Vault unsealing on reboot is manual unless you set up auto-unseal (KMS, transit, etc.).

#### Self-hosted CI

If you can't use GitHub Actions (egress restrictions):
- **Drone**, **Woodpecker**, or **Gitea Actions** — open-source CI runners. Same workflow file format.
- Provide secrets to runners via the same `.env` or Vault pattern.

#### Sourcemap upload offline

If the VPS can't reach `sentry.io` directly, run the Sentry on-prem image (`getsentry/self-hosted`) and point `@sentry/cli` to that URL. Same for LogRocket — the on-prem option is enterprise-tier; you would just disable LogRocket if you can't expose internet.

---

### 5.6 Local-only / air-gapped

When you have no internet at all:
- LogRocket: OFF (no on-prem free tier).
- Sentry: self-hosted (`getsentry/self-hosted`) on the same network.
- Logs: file-based (`structlog` to `/var/log/facil/*.log`) + log rotation via `logrotate`.
- Build: native `gradle build` and `xcodebuild` — drop EAS dependency.

This is a major architectural shift; expect 2-4 days of work to remove cloud dependencies.

---

## 6. Mode CNG vs non-CNG (mobile + inspector)

Expo projects come in two flavours:

| Mode | `android/` and `ios/` in git? | `app.json` plugins synced? | Build flow |
|---|---|---|---|
| **CNG** (managed, "continuous native generation") | NO — gitignored | YES — applied via `expo prebuild` on every build | Cleaner, but each build runs prebuild (slower) |
| **Non-CNG** (bare/prebuilt) | YES — committed | NO — `expo prebuild` not re-run | Faster builds, but app.json plugin entries are dead weight |

**Today, both `packages/mobile` and `packages/inspector` are non-CNG.** This means:

- Edits to `app.json` `plugins` (e.g. `extraMavenRepos`) **do not** propagate to `android/build.gradle` automatically. The hand-edit on `android/build.gradle` is the operative source of truth.
- `expo-doctor` warns about this (16/17 → 17/17 once the warning is acknowledged): "fields that may not be synced in a non-CNG project". Non-fatal.
- Adding a new native module requires: (1) `npm install`, (2) hand-edit `android/build.gradle` if it needs a new repo or plugin, (3) optionally also add the equivalent in `app.json` plugin block as documentation — it's read by `expo prebuild` if a contributor regenerates the folder locally.

**To switch to CNG** (future):
1. `git rm -r packages/mobile/android packages/mobile/ios`
2. Remove `/android` and `/ios` from `packages/mobile/.gitignore`.
3. Delete `packages/mobile/.easignore` (no longer needed — EAS will run prebuild).
4. Verify `app.json` plugin block has all native config (Sentry plugin, LogRocket Maven, expo-build-properties, etc.).
5. Run `expo prebuild --platform android` once locally to verify the generated folders are valid.
6. Push, trigger an EAS build, expect prebuild to run on the builder.

---

## 7. Known traps

### 7.1 `expo-doctor` icon check
`icon_facil.png` was 280×308 (non-square). `expo-doctor` flagged it as a schema error; EAS Cloud build dispatched from GitHub Actions ran doctor and marked the build pre-flight as failed (build still proceeded but the trace was confusing). **Fix already applied** — padded to 308×308 transparent canvas (commit `412868ca`).

Local `eas build` from a developer machine never tripped this because the local CLI uses `expo-doctor` warnings as non-fatal. EAS Cloud's `RUN_EXPO_DOCTOR` phase used to be permissive too; behavior may have tightened in a recent EAS-CLI version.

### 7.2 `.gitignore` strips `android/` from EAS uploads
`packages/mobile/.gitignore` line 43 (`/android`) was added by Expo's default template assuming CNG. Since this project is non-CNG and natives are committed, EAS-side upload exclusion stripped them: `ENOENT gradlew` at FIX_GRADLEW.

**Fix**: `packages/mobile/.easignore` (commit `412868ca`) overrides `.gitignore` for EAS uploads. Keeps the dev-side ignore in place to avoid noise from regenerated folders.

### 7.3 GitHub-Actions secret created AFTER workflow run
Secret creation is eventually-consistent at the `secrets.<NAME>` resolution time. Always create the secret BEFORE triggering the workflow. We saw a 6-minute window where the dispatch ran with `secrets.EXPO_TOKEN=""` (run `25157629153`, failed at the `eas build` step with "An Expo user account is required").

**Workaround**: trigger the workflow `> 1 min` after `gh secret set`; for production, document the secret in the workflow YAML comment (`# Required: secrets.EXPO_TOKEN`) so future dispatchers know the prereq.

### 7.4 `EXPO_TOKEN` job-scope vs step-scope
The `expo/expo-github-action@v8` step authenticates the EAS CLI inside its own action context but does NOT propagate the token to subsequent `run:` steps (each `run:` spawns a fresh shell). Always set `EXPO_TOKEN` at the **job env scope** so every step inherits it. Already applied in `mobile-eas-build.yml` line 79.

### 7.5 Cloud Run `--set-env-vars` doesn't help `NEXT_PUBLIC_*`
Next.js bakes `NEXT_PUBLIC_*` into the client bundle at `next build` time. Setting them on Cloud Run after the image is built is a no-op for the browser bundle. Always inject as Docker `--build-arg`.

### 7.6 LogRocket RN requires Android `minSdkVersion ≥ 25`
`@logrocket/react-native@1.62` declares `minSdkVersion 25` (Android 7.1
Nougat MR1) in its AAR manifest. Expo SDK 54 defaults to 24, so the
manifest merger fails:

```
uses-sdk:minSdkVersion 24 cannot be smaller than version 25
declared in library [com.logrocket:logrocket:1.62.0]
```

**Fix (commit `8582591a`)** — bump to 25 in three places (operative,
documented, future-CNG-ready):

1. `packages/{mobile,inspector}/android/build.gradle`:
   ```groovy
   ext {
     minSdkVersion = 25
   }
   ```
   Operative source of truth in non-CNG mode (see §6).

2. `packages/{mobile,inspector}/app.json` `expo-build-properties`:
   ```json
   { "android": { "minSdkVersion": 25, ... } }
   ```
   Informational today; canonical the day we migrate to CNG.

3. (Alternative — **NOT chosen**) `tools:overrideLibrary="com.logrocket.core"`
   in `AndroidManifest.xml`. Force-merges but masks runtime crashes if
   LogRocket invokes a 7.1+ API on a 7.0 device.

**Trade-off**: closes Android 7.0 (API 24) install base. Global share
~0.4% in 2026; near-zero in our target market (Equatorial Guinea, mostly
Android 8+). Correct cost/benefit for the gain in session replay
debuggability.

**When this trap re-fires**: any new RN native module with a higher
`minSdkVersion` than the project. Always read the module's AAR manifest
before installing — `npm view <pkg>` + linked GitHub release notes.

### 7.7 GitHub Actions PAT (`GH_PAT`) silent expiry
Classic GitHub PATs default to 30 / 60 / 90-day expiry. The `GH_PAT`
secret used by `auto-tag-mobile-inspector.yml` (to push tags WITH a
non-`GITHUB_TOKEN` so downstream tag-trigger workflows fire — see
that workflow's line 65 comment) is **not auto-rotated**. When it
expires:

```
fatal: could not read Username for 'https://github.com':
       terminal prompts disabled
The process '/usr/bin/git' failed with exit code 128
```

This happens at `actions/checkout` because `secrets.GH_PAT` resolves
to an empty string when the underlying token is dead, and git falls
back to interactive auth which is disabled in CI.

**Diagnosis**:
- Check the secret's `updatedAt`: `gh secret list --repo OWNER/REPO`.
- If older than the original PAT TTL, almost certainly expired.

**Fix (manual, ~3 min)**:
1. Generate a fine-grained PAT at https://github.com/settings/tokens?type=beta
   - Permissions: `repository: contents=read+write, metadata=read+write`
   - Expiration: 1 year (max for fine-grained)
2. Mirror to repo + GCP SM (one-shot):
   ```bash
   NEW="github_pat_..."
   gh secret set GH_PAT --repo KouemouSah/taxasge --body "$NEW"
   echo -n "$NEW" | gcloud secrets versions add github-pat \
     --project=taxasge-dev --data-file=-   # or `secrets create` first time
   ```
3. Re-run the failed workflow: `gh run rerun <RUN_ID>`.

**Future-proofing**: schedule a recurring agent / cron 60 days before
expiry to alert on rotation. Tracked in §8.

### 7.8 EAS Cloud `RUN_EXPO_DOCTOR` is stricter than local
Local `eas build` from a developer machine treats `expo-doctor`
warnings as advisory. The EAS Cloud builder's `RUN_EXPO_DOCTOR` phase
can fail the build on schema errors. The most common offender is
non-square icon images:

```
✖ Check Expo config (app.json/ app.config.js) schema
Error validating asset fields: image should be square, but the file
at './assets/images/icon_facil.png' has dimensions 280x308.
```

**Fix (commit `412868ca`)** — pad to a square transparent canvas:
```js
const sharp = require('sharp');
sharp(SRC).resize({ width: max, height: max, fit: 'contain',
  background: { r:0, g:0, b:0, alpha: 0 } }).png().toBuffer();
```

**Gotcha**: regen overwrites the original. Keep a pre-pad copy if the
original non-square image is needed elsewhere (rare).

---

## 8. Future enhancements

| Item | Owner | ETA |
|---|---|---|
| Sentry web (`@sentry/nextjs`) + activate `bridgeLogRocketToSentry()` body | Engineering | TBD |
| Sentry RN on inspector + bridge | Engineering | TBD |
| LogRocket source-map upload via `@sentry/cli` reused | Engineering | Phase 10 polish |
| Migrate remaining GitHub repo secrets (`GEMINI_*`, `FIREBASE_*`) into GCP SM with `--set-secrets` binding | Engineering | Q1 next year |
| Auto-rotation cron for `expo-token` and `sentry-auth-token` (90/180-day cadence) via a scheduled GitHub Actions workflow | Engineering | Q1 next year |
| Pre-expiry alert agent for `GH_PAT` (fires 60 days before secret `updatedAt + TTL`) — see §7.7 | Engineering | Q1 next year |
| Switch mobile + inspector to CNG mode for cleaner native plugin management | Engineering | When prebuild slowdown is acceptable |
| OpenTelemetry traces backend → Cloud Trace + per-request `logrocketURL` correlation | Engineering | When >100 concurrent agents |
| Audit log dashboard reading `audit_logs` table + Cloud Logging via Looker Studio | Operations | Q2 |

---

## 9. Quick reference — commands cheat sheet

```bash
# === GCP Secret Manager ===
gcloud secrets list --project=taxasge-dev
gcloud secrets versions access latest --secret=expo-token --project=taxasge-dev
echo -n "VALUE" | gcloud secrets versions add expo-token --project=taxasge-dev --data-file=-
gcloud secrets versions disable VERSION --secret=expo-token --project=taxasge-dev

# === GitHub Actions secrets ===
gh secret list --repo KouemouSah/taxasge
gh secret set NAME --repo KouemouSah/taxasge --body "VALUE"
gh secret delete NAME --repo KouemouSah/taxasge

# === EAS env vars ===
EXPO_TOKEN="$(gcloud secrets versions access latest --secret=expo-token)" eas env:list --environment preview
EXPO_TOKEN="$(...)" eas env:create --environment preview --name NAME --value VALUE --visibility plaintext
EXPO_TOKEN="$(...)" eas env:update --environment preview --name NAME --value NEWVALUE
EXPO_TOKEN="$(...)" eas env:delete --environment preview --name NAME

# === Trigger CI builds ===
gh workflow run mobile-eas-build.yml --repo KouemouSah/taxasge --ref develop -f profile=preview -f platform=android
gh workflow run deploy-frontend-staging.yml --repo KouemouSah/taxasge --ref develop
gh run list --workflow=mobile-eas-build.yml --limit 5 --repo KouemouSah/taxasge
gh run view RUN_ID --repo KouemouSah/taxasge --log-failed

# === Inspect EAS build status ===
EXPO_TOKEN="$(...)" cd packages/mobile && eas build:list --limit 5 --json
EXPO_TOKEN="$(...)" eas build:view BUILD_ID
```

---

## 10. Changelog

- **2026-04-30 v1.1** — same-day additive update from the LogRocket
  rollout session:
  - §3: documented `ext.minSdkVersion = 25` in mobile + inspector
    `android/build.gradle` and `app.json` plugin block.
  - §7.6: new trap — LogRocket RN `minSdkVersion 25` manifest merger
    failure (commit `8582591a`).
  - §7.7: new trap — `GH_PAT` silent expiry (rotated after auto-tag
    run `25162098399` failed; rerun `25162496256` ✓).
  - §7.8: new trap — stricter `RUN_EXPO_DOCTOR` on EAS Cloud vs local
    (icon non-square; commit `412868ca`).
  - §8: pre-expiry alert agent for `GH_PAT` added to roadmap.
- **2026-04-30 v1.0** — initial document. Captures: LogRocket web + RN integrations, mobile EAS build fixes (`.easignore`, square icon), Secret Manager migration of `expo-token`/`sentry-auth-token`/`logrocket-app-id`, multi-environment guide (GCP/AWS/Azure/VPS).
