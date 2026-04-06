# PLAN DE TESTS PROFESSIONNEL — Module "Mes Documents + Agent IA"

**Date** : 2026-04-05
**Total cible** : 424 tests (202 existants + 222 nouveaux)

## Pyramide de tests

| Couche | Framework | Tests | Vitesse |
|--------|-----------|-------|---------|
| Models + Integrity + Tools | pytest | 202 (existants) | 2.5s |
| Service Unit | pytest-asyncio + AsyncMock | 27 | 3s |
| Route Tests | httpx AsyncClient + mocked deps | 113 | 10s |
| Integration (Real DB) | pytest-asyncio + Supabase | 17 | 30s |
| Frontend Components | Jest + React Testing Library | 40 | 5s |
| Frontend E2E | Playwright | 15 | 2min |

## Tableaux de validation par zone fonctionnelle

### UPLOAD (22 tests)
UP-01 to UP-15 (single) + BU-01 to BU-07 (bulk)
- Auth 401, MIME validation, size 10MB, magic bytes A08, quota 100MB, dedup SHA-256, rate limit 10/min

### LIST/SEARCH/STATS (21 tests)
LS-01 to LS-12 + SR-01 to SR-05 + ST-01 to ST-04
- Cursor pagination, 5 filtres, full-text search, quota percentage

### READINESS (9 tests)
RD-01 to RD-09
- Score 0-100, can_start logic, missing/expiring detection, OWASP ownership

### CRUD (20 tests)
CR-01 to CR-20
- Detail, download signed URL, thumbnail, versions, update, reclassify, archive, delete, OWASP ownership

### ALERTS (8 tests)
AL-01 to AL-08
- Severity grouping, mark read, dismiss, OWASP ownership

### BULK/EXPORT (14 tests)
BX-01 to BX-14
- Bulk archive/delete/download, export background task, status polling, download URL

### AGENT (14 tests)
AG-01 to AG-14
- Permission CRUD, memory CRUD, upsert conflict, level validation, reset all

### CRON (5 tests)
CJ-01 to CJ-05
- X-Cron-Secret auth, daily_scan trigger, failure handling

### SERVICES (27 tests)
SV-01 to SV-14 + PA-01 to PA-09 + EX-01 to EX-04
- File integrity, category inference, cursor encode/decode, expiry computation, proactive scan idempotence

### CHATBOT INTEGRATION (10 tests)
CT-01 to CT-10
- Tool selection par message, anonymous guard, function map completeness

### FRONTEND COMPONENTS (40 tests)
FE-01 to FE-40
- ExpiryBadge colors, DocumentCard rendering, Upload dialog validation, Alerts grouping, Readiness progress, Agent settings

### FRONTEND E2E (15 tests)
E2E-01 to E2E-15
- Upload flow, readiness check, alerts management, agent settings

## Priorite d'implementation

P0 : conftest.py (prerequis)
P1 : upload routes (22) + crud routes (20) + list routes (21) + agent routes (14) = 77 tests
P2 : alerts (8) + readiness (9) + bulk/export (14) + cron (5) + services (27) + frontend components (40) = 103 tests
P3 : chatbot integration (10) + DB integration (17) + E2E (15) = 42 tests
