# Session 6 — Tests E2E Complets Module Companies

## Objectif
Tests de bout en bout de CHAQUE flux, endpoint, API, frontend. Validation complète avant mise en production.

## Prérequis
- Sessions 1-5 terminées
- Données seed en BD

## Phases

### Phase 1 : Tests Backend Endpoints (pytest)

#### Flux 1 : CRUD Company
- [ ] POST /companies → create + auto-classification
- [ ] GET /companies → list user's companies
- [ ] GET /companies/{id} → detail avec JOINs
- [ ] PUT /companies/{id} → update + auto-reclassification
- [ ] DELETE /companies/{id} → soft delete

#### Flux 2 : CSV Import → Classification → Drafts
- [ ] POST /classification/import-csv → parse + validate + classify + drafts
- [ ] Test NIF format validation (regex)
- [ ] Test PE-XXXX cross-check (autonomo)
- [ ] Test duplicate detection (BD + intra-CSV)
- [ ] GET /classification/drafts → list avec pagination
- [ ] POST /classification/drafts/{id}/approve → company + licence créées

#### Flux 3 : Dashboard Endpoints
- [ ] GET /dashboard/global-stats → toutes les colonnes
- [ ] GET /dashboard/zone-stats → 12 zones
- [ ] GET /dashboard/analytics → 6 datasets croisés
- [ ] GET /dashboard/zone-stats/mine → scoped à la zone agent

#### Flux 4 : Ministry Debt
- [ ] GET /ministry/company-debt/{id} → scoped ministry_id
- [ ] Vérifier qu'un agent tesoro ne voit PAS les obligations ayuntamiento
- [ ] GET /lookup → search par NIF, PE, nom

#### Flux 5 : Public Directory
- [ ] GET /public/companies/search → rate-limited, is_active+is_verified only
- [ ] Vérifier PAS de email/phone dans la réponse
- [ ] GET /public/companies/zones → 12 zones
- [ ] GET /public/companies/sectors → secteurs distincts

#### Flux 6 : Cron
- [ ] POST /cron/annual-reclassification → keyset pagination
- [ ] POST /cron/data-quality-check → anomalies détectées
- [ ] POST /cron/compliance-reminders → overdue updated

#### Flux 7 : NIF Normalization
- [ ] INSERT avec nif=' ab 123 ' → vérifie nif='AB123'
- [ ] INSERT autonomo PE-001 → vérifie PE-001
- [ ] CHECK constraint violation (nif trop court)

### Phase 2 : Tests Frontend Playwright

#### Test 1 : Navigation publique
- [ ] Vérifier menu : Servicios → Licencias → Directorio → Ministerios → Calculadora → Guía
- [ ] Click Directorio → page annuaire s'affiche
- [ ] Rechercher "empresa" → résultats apparaissent

#### Test 2 : Admin Dashboard
- [ ] Login admin → naviguer /admin/companies/dashboard
- [ ] 4 onglets visibles et cliquables
- [ ] KPIs affichent des données (pas 0 si seed data présente)
- [ ] Graphes rendus (donut, bar, line)

#### Test 3 : Gestión Empresas
- [ ] Table affiche 50 entreprises
- [ ] Filtres fonctionnent (status, regime, zone)
- [ ] Recherche fonctionne (debounce)

#### Test 4 : Classification
- [ ] Onglet stats affiche donut + barres colorées
- [ ] Import CSV fonctionne (upload test.csv)

#### Test 5 : Licencias + PDF
- [ ] Liste licences affiche 40 licences
- [ ] Click PDF → download fonctionne
- [ ] PDF contient données correctes

### Phase 3 : Tests de sécurité
- [ ] Agent tesoro ne peut PAS accéder /admin/companies
- [ ] Endpoint public ne retourne PAS email/phone
- [ ] Rate limiting fonctionne (>100 req/min → 429)
- [ ] UUID injection rejetée gracefully

### Validation finale
- [ ] 100% des tests passent
- [ ] 0 erreurs ESLint
- [ ] Build next.js passe
- [ ] Tous les endpoints retournent les données attendues
