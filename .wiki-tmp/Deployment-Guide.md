# Deployment Guide

## Overview

Facil uses a fully automated CI/CD pipeline. **Manual `gcloud` builds are never allowed.** All deployments are triggered by pushing to the remote branch, and GitHub Actions handles the build and deploy process.

## Infrastructure

| Component | Service | Region |
|-----------|---------|--------|
| Backend API | Google Cloud Run | us-central1 |
| Frontend Web | Firebase Hosting | Global CDN |
| Database | Supabase PostgreSQL | (managed) |
| Cache | Upstash Redis | (managed, TLS) |
| File Storage | Supabase Storage / Firebase Storage | (managed) |
| AI | Google Vertex AI (Gemini 2.0 Flash) | us-central1 |
| Secrets | Google Cloud Secret Manager | us-central1 |
| Mobile CI | Expo.dev (EAS Build) | (managed) |

## GitHub Actions Workflows (6)

Located in `.github/workflows/`:

### 1. `ci.yml` - Continuous Integration

**Trigger**: Push to `main`, `develop`, or `feature/**` branches; Pull requests to `main`/`develop`

**Steps**:
- Backend: Install dependencies, run `flake8` linting, run `pytest` tests
- Frontend: Install dependencies, run `eslint`, run `tsc` type-check, run `next build`

### 2. `deploy-backend-staging.yml` - Backend Staging Deploy

**Trigger**: Push to `develop` with changes in `packages/backend/`

**Steps**:
1. Checkout code
2. Authenticate to Google Cloud (service account key)
3. Build Docker image
4. Push to Google Container Registry
5. Deploy to Cloud Run (`taxasge-backend-staging`)
6. Verify health endpoint

### 3. `deploy-frontend-staging.yml` - Frontend Staging Deploy

**Trigger**: Push to `develop` with changes in `packages/web/`

**Steps**:
1. Checkout code
2. Install dependencies (`npm install --legacy-peer-deps`)
3. Build Next.js (`npm run build`)
4. Deploy to Firebase Hosting (`taxasge-dev`)

### 4. `mobile-build.yml` - Citizen Mobile App

**Trigger**: Manual dispatch or push with changes in `packages/mobile/`

**Steps**:
1. Setup Expo CLI
2. Run EAS Build (Android APK / iOS IPA)
3. Upload to Expo.dev for beta testing

### 5. `inspector-build.yml` - Inspector Mobile App

**Trigger**: Manual dispatch or push with changes in `packages/inspector/`

**Steps**: Same as mobile-build but for the inspector app.

### 6. `inspector-ci.yml` - Inspector CI

**Trigger**: Push with changes in `packages/inspector/`

**Steps**: Lint and type-check the inspector app.

### 7. `codeql.yml` - Security Analysis

**Trigger**: Push to `main`/`develop`, scheduled weekly

**Steps**: GitHub CodeQL security scanning for JavaScript/TypeScript and Python.

### 8. `update-dashboard.yml` - Dashboard Stats

**Trigger**: Scheduled or manual

**Steps**: Update repository statistics dashboard.

## Branch Strategy

```
main (production)
  |
  +--- develop (staging, auto-deploy)
         |
         +--- feature/xyz (feature branches)
         +--- fix/abc (bugfix branches)
```

| Branch | Environment | Auto-Deploy |
|--------|------------|-------------|
| `main` | Production | Manual tag-based release |
| `develop` | Staging | Yes (on push with relevant file changes) |
| `feature/**` | None (CI only) | No |

## Deployment Rules

1. **NEVER run `gcloud builds submit` or `gcloud run deploy` manually**
2. Push changes to `develop` branch
3. GitHub Actions detects changed files and triggers the appropriate workflow
4. Monitor the Actions tab for build status
5. Verify deployment at the staging URL

## Environment Variables

Backend environment variables are stored in `packages/backend/.env` (local) and Google Cloud Secret Manager (production).

Key variables:

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string (Supabase) |
| `REDIS_URL` | Upstash Redis URL (TLS) |
| `SECRET_KEY` | JWT signing key |
| `ENVIRONMENT` | `development`, `staging`, or `production` |
| `SMTP_PASSWORD_GMAIL` | Gmail SMTP password for email sending |
| `GOOGLE_APPLICATION_CREDENTIALS` | Path to GCP service account JSON |
| `BANGE_API_KEY` | BANGE payment gateway API key |
| `BANGE_MERCHANT_ID` | BANGE merchant identifier |

## Cloud Run Configuration

| Setting | Value |
|---------|-------|
| Container port | 8000 |
| Min instances | 0 (staging), 1 (production) |
| Max instances | 10 (staging), 100 (production) |
| Memory | 512 MiB (staging), 1 GiB (production) |
| CPU | 1 (staging), 2 (production) |
| Timeout | 300s |
| Concurrency | 80 |
| Entry point | `uvicorn app.main:app --host 0.0.0.0 --port 8000` |

## Monitoring

### Health Check

```bash
curl https://taxasge-backend-staging-392159428433.us-central1.run.app/health
```

Returns:
```json
{
  "status": "healthy",
  "service": "taxasge-backend",
  "version": "1.1.8",
  "checks": {
    "api": "ok",
    "database": "ok",
    "redis": "ok (Upstash)",
    "cache": { "redis_enabled": true, "redis_status": "connected" }
  }
}
```

### Logs

- Backend logs: Google Cloud Console > Cloud Run > Logs
- Frontend logs: Firebase Console > Hosting
- CI/CD logs: GitHub > Actions tab

### Debug Endpoints (staging only)

| Endpoint | Purpose |
|----------|---------|
| `GET /api/v1/debug/routers` | List loaded API routers |
| `GET /api/v1/debug/communications-import` | Diagnose communications module |
| `GET /api/v1/debug/enum-import` | Diagnose enum router imports |
| `GET /api/v1/debug/support-import` | Diagnose support module |

These endpoints require authentication and are disabled in production (return 404).
