# PLAN GÉNÉRAL — Inspection Mobile × Bundle Service Requests

**Date** : 2026-04-11
**Statut** : PROPOSÉ — en attente validation utilisateur
**Auteur** : Claude (expert mode)
**Contexte** : Correction des bugs critiques du `CollectionService` de l'app Inspector + exclusion d'expiration des dossiers bundle + finalisation Mobile Inspector (P4-P6)

---

## 0. PROBLÉMATIQUES À RÉSOUDRE

### 0.1 Demandes de l'utilisateur
1. **Déduplication paiement agent inspection** : quand un agent d'inspection enregistre un paiement, vérifier s'il existe déjà un dossier de cette entreprise pour l'année en cours et le mettre à jour selon l'obligation traitée — éviter la duplication.
2. **Séparation expiration** : les `service_requests` normales expirent après 2h en DRAFT ; les dossiers bundle ne doivent pas expirer tant qu'ils ne sont pas complètement réglés.

### 0.2 Bugs critiques vérifiés dans le code existant

| # | Fichier | Ligne | Bug | Sévérité |
|---|---------|-------|-----|----------|
| B1 | `inspections/services/collection_service.py` | 69 | `status NOT IN ('cancelled', 'rejected')` — enum UPPERCASE en BD (`'CANCELLED'`, `'REJECTED'`). PostgreSQL plante `invalid input value for enum` dès le 1er appel. | 🔴 Critique |
| B2 | `collection_service.py` | 68 | `EXTRACT(YEAR FROM sr.created_at) = fiscal_year` — faux (licence fiscal_year 2026 peut être créée en décembre 2025). | 🔴 Critique |
| B3 | `collection_service.py` | 64-72 | Aucun filtre par `workflow_code` ni `source` — réutilise le dossier de N'IMPORTE quelle demande active (passeport, conducir, etc.) → corruption de dossier. | 🔴 Critique |
| B4 | `collection_service.py` | 64-72 | Pas de lien vers `license_id` ni `bundle_id` — entreprise avec plusieurs bundles → collision. La clé correcte est `(company_id, bundle_id, fiscal_year)`. | 🔴 Critique |
| B5 | `collection_service.py` | 64-89 | Aucun `SELECT FOR UPDATE` ni `UNIQUE` — race condition multi-agents. | 🟠 Haut |
| B6 | `migrations/287_allow_field_payments_without_service_request.sql` | 58 | Index partiel `WHERE status NOT IN ('cancelled', 'rejected')` — lowercase invalide, CREATE INDEX a probablement FAILED en prod. | 🔴 Critique |
| B7 | `collection_service.py` | 80-89 | INSERT new service_request mais n'UPDATE PAS `commercial_licenses.service_request_id`. Licence orpheline. | 🟠 Haut |
| B8 | `service_requests/services/service_request_service.py` | 768-774 | `cleanup_abandoned_requests` ne filtre pas `workflow_code IN ('BUNDLE_PAYMENT', 'FIELD_INSPECTION')` ni `source = 'field_inspection'` → destruction dossiers bundle + documents Firebase. | 🔴 Critique |
| B9 | `cron_routes.py` | — | Aucun cron automatique appelle `cleanup_abandoned_requests` — expiration manuelle uniquement. | 🟠 Haut |
| B10 | `service_request_service.py` | 737 | `max_age_hours=2` hardcodé — viole règle "ne rien hardcoder". | 🟡 Moyen |
| B11 | `collection_service.py` | — | Pas d'`Idempotency-Key` — retry HTTP en zone terrain instable = double encaissement. OWASP A04. | 🟠 Haut |
| B12 | `collection_service.py` | 128-147 | Pas de vérification `agent.fee_type == obligation.fee_type` — un agent MIN_AGRICULTURA peut collecter du `municipal`. | 🟠 Haut |

### 0.3 Challenge à la formulation utilisateur

- **"une demande par an par entreprise"** → INCORRECT. Une entreprise peut avoir plusieurs bundles (commerce + alimentation + transport). La clé réelle est `(company_id, bundle_id, fiscal_year)` — déjà présente en UNIQUE sur `commercial_licenses`. Donc : **1 `service_request` par `commercial_license` (1:1)**.
- **"ne pas expirer tant que non réglées"** → à préciser en 3 états : `ACTIVE` (obligations pending) → `OVERDUE` (deadline dépassée, reste visible) → `CLOSED` (toutes completed OU fermeture admin). L'expiration hard n'a aucun sens pour un bundle ouvert ; l'expiration s'applique uniquement à la `wizard_session` (brouillon) tant que le citoyen n'a pas confirmé — pas au dossier lui-même.

---

## 1. ARCHITECTURE CIBLE

### 1.1 Modèle de données renforcé

```
commercial_licenses (1:1 avec service_request bundle)
├── id
├── company_id  ──┐
├── bundle_id    │ UNIQUE(company_id, bundle_id, fiscal_year)
├── fiscal_year ─┘
├── service_request_id  ──── FK → service_requests.id (1:1 ENFORCED via trigger)
└── status

service_requests
├── id
├── company_id
├── workflow_code  (BUNDLE_PAYMENT | FIELD_INSPECTION | PASAPORTE | ...)
├── source         (citizen_wizard | field_inspection | admin_import | batch)
├── bundle_id      ── NOUVEAU (nullable, NOT NULL si source ∈ {bundle})
├── commercial_license_id ── NOUVEAU (nullable, NOT NULL si bundle)
├── fiscal_year    ── NOUVEAU (nullable, NOT NULL si bundle)
├── is_bundle      ── GENERATED ALWAYS AS (workflow_code IN ('BUNDLE_PAYMENT', 'FIELD_INSPECTION')) STORED
├── status
└── UNIQUE(company_id, bundle_id, fiscal_year) WHERE is_bundle AND status NOT IN ('CANCELLED', 'REJECTED')

license_obligations (inchangé)
└── payment_id → service_payments.id
```

### 1.2 Règles d'expiration

| Type | Mécanisme | TTL | Trigger |
|------|-----------|-----|---------|
| `wizard_session` Redis (brouillon citoyen) | Redis TTL | 30 min | natif Redis |
| `service_request` DRAFT normale | Cron cleanup | **configurable via `settings.DRAFT_CLEANUP_MAX_HOURS`** (défaut 2h) | nouveau cron `POST /cron/cleanup-abandoned-requests` |
| `service_request` bundle (BUNDLE_PAYMENT / FIELD_INSPECTION) | **JAMAIS expiré par cron** | — | exclusion explicite + trigger d'assertion |
| `commercial_license` en `overdue` | Cron OMS existant (`flag_overdue_obligations`) | deadline + 0j | `POST /cron/flag-overdue` — déjà implémenté |
| `commercial_license` fermée | Flux métier | manuel admin OU cron annuel | tâche future |

### 1.3 Déduplication paiement terrain — nouvelle clé

```python
# PSEUDO-CODE CIBLE (à implémenter Phase 1)
def find_or_create_bundle_dossier(
    conn, license_id: UUID, user_id: UUID
) -> UUID:
    # 1. Lock license row
    license = conn.fetchrow(
        "SELECT id, company_id, bundle_id, fiscal_year, service_request_id "
        "FROM commercial_licenses WHERE id = $1 FOR UPDATE",
        license_id,
    )

    # 2. Dossier already linked? Reuse
    if license['service_request_id']:
        return license['service_request_id']

    # 3. Check if another process created one concurrently (via UNIQUE)
    existing = conn.fetchval("""
        SELECT id FROM service_requests
        WHERE commercial_license_id = $1
          AND status NOT IN ('CANCELLED', 'REJECTED')
        LIMIT 1
    """, license_id)
    if existing:
        conn.execute(
            "UPDATE commercial_licenses SET service_request_id = $1 WHERE id = $2",
            existing, license_id
        )
        return existing

    # 4. Create new dossier
    new_id = uuid4()
    conn.execute("""
        INSERT INTO service_requests (
            id, user_id, company_id, workflow_code, status, source,
            bundle_id, commercial_license_id, fiscal_year,
            created_at, updated_at
        ) VALUES ($1, $2, $3, 'FIELD_INSPECTION', 'SUBMITTED', 'field_inspection',
                  $4, $5, $6, NOW(), NOW())
    """, new_id, user_id, license['company_id'],
        license['bundle_id'], license_id, license['fiscal_year'])

    conn.execute(
        "UPDATE commercial_licenses SET service_request_id = $1 WHERE id = $2",
        new_id, license_id
    )
    return new_id
```

**Propriétés garanties** :
- Idempotent (réentrant) grâce au `FOR UPDATE` + `UNIQUE`
- Déduplication forte côté BD (UNIQUE partial index) **+** côté applicatif (check license.service_request_id)
- Lien bidirectionnel `license ↔ service_request`
- Un paiement citoyen en ligne et un paiement terrain sur la même licence partagent le dossier

---

## 2. PHASES — VUE D'ENSEMBLE

| Phase | Nom | Objectif | Durée estimée | Bloquant pour |
|-------|-----|----------|---------------|---------------|
| **P1** | Fix critique backend `CollectionService` + migration corrective | Stopper la corruption de données et unblocker le paiement terrain | ~1 jour | P2, P3, P4 |
| **P2** | Exclusion expiration bundle + cron auto + config externalisée | Protéger les dossiers bundle, automatiser le cleanup | ~0.5 jour | P4 |
| **P3** | Reprise dossier citoyen côté mobile + Idempotency-Key + permissions fee_type | UX agent + sécurité OWASP | ~1 jour | P4 |
| **P4** | Mobile Inspector — finaliser P4 (supervisor avancé) + P5 (offline) + intégration endpoints corrigés | Delivrable mobile | ~3 jours | P5 |
| **P5** | Observabilité + audit trail bundle + tests charge 1M+ | Production-ready 100+ agents concurrents | ~1 jour | — |

**Total estimé** : ~6.5 jours de travail.

---

## 3. PHASE 1 — Fix critique backend `CollectionService` + migration corrective

### 3.1 Objectifs
- Corriger les 7 bugs critiques B1-B7
- Garantir déduplication forte `(company_id, bundle_id, fiscal_year)` par UNIQUE index partiel
- Mettre en place le lien bidirectionnel `commercial_licenses ↔ service_requests`
- Préserver les données existantes (backfill safe)

### 3.2 Checklist P1

#### P1.A — Migration SQL corrective
- [ ] P1.A.1 : Créer migration `291_fix_bundle_dossier_linking.sql`
- [ ] P1.A.2 : Drop de l'index FAILED `idx_sr_company_year_active` (migration 287)
- [ ] P1.A.3 : Ajouter colonnes sur `service_requests` : `commercial_license_id UUID REFERENCES commercial_licenses(id) ON DELETE SET NULL`, `bundle_id UUID REFERENCES service_bundles(id) ON DELETE SET NULL`, `fiscal_year INTEGER`
- [ ] P1.A.4 : Ajouter GENERATED column `is_bundle BOOLEAN GENERATED ALWAYS AS (workflow_code IN ('BUNDLE_PAYMENT', 'FIELD_INSPECTION')) STORED`
- [ ] P1.A.5 : Backfill : `UPDATE service_requests sr SET commercial_license_id = cl.id, bundle_id = cl.bundle_id, fiscal_year = cl.fiscal_year FROM commercial_licenses cl WHERE cl.service_request_id = sr.id`
- [ ] P1.A.6 : Créer UNIQUE index partiel : `CREATE UNIQUE INDEX idx_sr_bundle_dedup ON service_requests (company_id, bundle_id, fiscal_year) WHERE is_bundle AND status NOT IN ('CANCELLED', 'REJECTED')`
- [ ] P1.A.7 : Créer index de lookup : `CREATE INDEX idx_sr_license ON service_requests (commercial_license_id) WHERE commercial_license_id IS NOT NULL`
- [ ] P1.A.8 : Trigger `enforce_bundle_sr_integrity()` : AVANT INSERT/UPDATE, si `is_bundle = true` alors `commercial_license_id`, `bundle_id`, `fiscal_year` doivent être NOT NULL
- [ ] P1.A.9 : Trigger `sync_license_service_request()` : APRÈS INSERT sur service_requests avec `commercial_license_id`, UPDATE `commercial_licenses.service_request_id`
- [ ] P1.A.10 : Rollback section documenté
- [ ] P1.A.11 : Dry-run sur copie locale BD dev, comptage avant/après

#### P1.B — Correction `CollectionService`
- [ ] P1.B.1 : Remplacer `_find_or_create_service_request` par `_find_or_create_bundle_dossier(license_id)` (signature changée)
- [ ] P1.B.2 : Ajouter `FOR UPDATE` sur SELECT license
- [ ] P1.B.3 : Corriger casse enum `'CANCELLED', 'REJECTED'` partout
- [ ] P1.B.4 : Filtrer par `commercial_license_id` (pas `company_id + year`)
- [ ] P1.B.5 : Mettre à jour `commercial_licenses.service_request_id` dans la même transaction
- [ ] P1.B.6 : Wrap toute la fonction `collect_field_payment` dans `async with conn.transaction()` (pas juste l'INSERT)
- [ ] P1.B.7 : Ajouter retry avec backoff sur `UniqueViolationError` (retry 3x, 50ms exponentiel)
- [ ] P1.B.8 : Propager `service_request_id` dans le return dict

#### P1.C — Tests
- [ ] P1.C.1 : `test_find_or_create_bundle_dossier_creates_new` (aucun dossier existant)
- [ ] P1.C.2 : `test_find_or_create_bundle_dossier_reuses_citizen_wizard` (dossier créé par citizen, agent le réutilise)
- [ ] P1.C.3 : `test_find_or_create_bundle_dossier_reuses_field_inspection` (autre agent a déjà créé)
- [ ] P1.C.4 : `test_concurrent_creation_unique_constraint` (2 tâches asyncio en parallèle → 1 seul dossier)
- [ ] P1.C.5 : `test_cross_year_renewal_does_not_collide` (licence 2025 + licence 2026 même entreprise = 2 dossiers)
- [ ] P1.C.6 : `test_multi_bundle_same_company_year` (2 bundles différents = 2 dossiers)
- [ ] P1.C.7 : `test_collect_payment_updates_license_service_request_id`
- [ ] P1.C.8 : `test_enum_case_correct` (regression B1)
- [ ] P1.C.9 : Mypy strict + flake8 passent

#### P1.D — Validation
- [ ] P1.D.1 : Push vers `develop`, GitHub Actions vert
- [ ] P1.D.2 : Vérifier migration appliquée en staging (count rows avant/après)
- [ ] P1.D.3 : Manual E2E : créer licence → agent collecte → vérifier dossier unique créé → 2e obligation même licence → dossier réutilisé
- [ ] P1.D.4 : Auto-critique P1 (relecture complète)

---

## 4. PHASE 2 — Exclusion expiration bundle + cron auto + config externalisée

### 4.1 Objectifs
- Empêcher `cleanup_abandoned_requests` de toucher aux dossiers bundle
- Automatiser via cron Cloud Scheduler
- Externaliser toute valeur hardcodée
- Respecter l'architecture d'expiration par état (ACTIVE / OVERDUE / CLOSED)

### 4.2 Checklist P2

#### P2.A — Correction query cleanup
- [ ] P2.A.1 : Modifier `service_request_service.py:768` query pour ajouter `AND is_bundle = false` (GENERATED column → performant)
- [ ] P2.A.2 : Ajouter `AND source != 'field_inspection'` en ceinture/bretelle
- [ ] P2.A.3 : Ajouter `AND NOT EXISTS (SELECT 1 FROM commercial_licenses cl WHERE cl.service_request_id = sr.id)` — garde-fou ultime
- [ ] P2.A.4 : Logger séparément les `skipped_bundle_count` pour observabilité

#### P2.B — Configuration externalisée
- [ ] P2.B.1 : Ajouter dans `app/config.py` : `DRAFT_CLEANUP_MAX_HOURS: int = 2` (Pydantic Settings)
- [ ] P2.B.2 : Ajouter `WIZARD_SESSION_TTL_SECONDS: int = 1800` (déjà à 30min mais hardcodé)
- [ ] P2.B.3 : Ajouter `PREVIEW_EXPIRY_MINUTES: int = 30`
- [ ] P2.B.4 : Documenter dans `.env.example`

#### P2.C — Nouveau cron `cleanup-abandoned-requests`
- [ ] P2.C.1 : Créer endpoint `POST /cron/cleanup-abandoned-requests` dans `cron_routes.py` avec `Depends(verify_cron_auth)`
- [ ] P2.C.2 : Lire `settings.DRAFT_CLEANUP_MAX_HOURS`
- [ ] P2.C.3 : Appeler `service_request_service.cleanup_abandoned_requests(db, max_age_hours=settings.DRAFT_CLEANUP_MAX_HOURS)`
- [ ] P2.C.4 : Retourner stats JSON (deleted, skipped_bundle, errors)
- [ ] P2.C.5 : Ajouter au Cloud Scheduler (infra/gcp/schedulers.tf ou via console) — fréquence horaire
- [ ] P2.C.6 : Monitoring : log WARNING si `deleted > 100/run` (anomalie)

#### P2.D — Tests
- [ ] P2.D.1 : `test_cleanup_does_not_delete_bundle_draft`
- [ ] P2.D.2 : `test_cleanup_does_not_delete_field_inspection_draft`
- [ ] P2.D.3 : `test_cleanup_deletes_normal_draft_older_than_config`
- [ ] P2.D.4 : `test_cleanup_preserves_license_linked_even_without_flag` (garde-fou)
- [ ] P2.D.5 : `test_cron_endpoint_requires_auth`
- [ ] P2.D.6 : `test_cron_endpoint_uses_config_value`

#### P2.E — Validation
- [ ] P2.E.1 : Dry-run du cron en staging
- [ ] P2.E.2 : Vérifier que 0 dossier bundle est supprimé
- [ ] P2.E.3 : Push + GitHub Actions vert
- [ ] P2.E.4 : Auto-critique P2

---

## 5. PHASE 3 — Reprise dossier citoyen côté mobile + Idempotency-Key + permissions fee_type

### 5.1 Objectifs
- Permettre à l'agent de voir/payer sur un dossier bundle préexistant (créé par le citoyen en wizard)
- Empêcher les doubles encaissements en cas de retry
- Vérifier que l'agent a le droit de collecter le `fee_type` de l'obligation

### 5.2 Checklist P3

#### P3.A — Endpoint `GET /inspections/verify` enrichi
- [ ] P3.A.1 : Retourner `existing_dossier: {service_request_id, created_via, reference} | null`
- [ ] P3.A.2 : Retourner `agent_can_collect_all: bool` + `restricted_obligations: UUID[]` (si permissions fee_type filtrent)
- [ ] P3.A.3 : Retourner `has_pending_citizen_payment: bool` (si un paiement online est en cours — warning pour éviter double paiement)

#### P3.B — Middleware Idempotency
- [ ] P3.B.1 : Créer `app/core/idempotency.py` : décorateur `@idempotent(key_header='Idempotency-Key', ttl_seconds=86400)`
- [ ] P3.B.2 : Stockage Redis : clé `idem:{endpoint}:{key}` → réponse JSON cached
- [ ] P3.B.3 : Si même key arrive 2x, renvoyer la réponse cached (status 200 + header `Idempotency-Replay: true`)
- [ ] P3.B.4 : Appliquer sur `POST /inspections/{id}/collect`
- [ ] P3.B.5 : Appliquer sur `POST /inspections/` (create)

#### P3.C — Vérification permissions fee_type
- [ ] P3.C.1 : Dans `CollectionService.collect_field_payment`, après load obligations :
  ```python
  agent_ctx = await InspectionService.resolve_inspector_context(conn, user_id)
  allowed_fee_types = agent_ctx['allowed_fee_types']  # ex: ['tesoro', 'chamber']
  forbidden = [o for o in obls if o['fee_type'] not in allowed_fee_types]
  if forbidden:
      raise PermissionError(f"Agent cannot collect fee_types: {[o['fee_type'] for o in forbidden]}")
  ```
- [ ] P3.C.2 : Cas spécial `agent_oms_polyvalent` = tous fee_types
- [ ] P3.C.3 : Cas AYUNTAMIENTO = uniquement `municipal`
- [ ] P3.C.4 : Cas CAMARA_COMERCIO = uniquement `chamber`
- [ ] P3.C.5 : Cas MIN_* = uniquement `tesoro` filtré par `ministry_id`

#### P3.D — Tests
- [ ] P3.D.1 : `test_verify_returns_existing_citizen_dossier`
- [ ] P3.D.2 : `test_idempotency_replay_returns_same_payment_id`
- [ ] P3.D.3 : `test_idempotency_expires_after_ttl`
- [ ] P3.D.4 : `test_agent_ayuntamiento_cannot_collect_tesoro`
- [ ] P3.D.5 : `test_agent_polyvalent_collects_all_fee_types`
- [ ] P3.D.6 : `test_min_agricultura_cannot_collect_min_turismo_ministry`

#### P3.E — Validation
- [ ] P3.E.1 : Push + GitHub Actions vert
- [ ] P3.E.2 : E2E staging : citizen crée bundle wizard → agent trouve dossier → collecte → pas de duplicat
- [ ] P3.E.3 : Auto-critique P3

---

## 6. PHASE 4 — Mobile Inspector P4-P5 (intégration endpoints corrigés)

### 6.1 Objectifs
- Finaliser les phases P4 (supervisor avancé) et P5 (offline) du MOBILE_INSPECTOR_MASTER_PLAN
- Intégrer les endpoints corrigés + afficher les dossiers existants + gérer Idempotency-Key
- Mode offline avec SQLite queue (indispensable terrain)

### 6.2 Checklist P4 (référence : sections P4 + P5 du MOBILE_INSPECTOR_MASTER_PLAN)

#### P4.A — Écran vérification licence enrichi
- [ ] P4.A.1 : Afficher bandeau `existing_dossier` si présent ("Dossier en cours créé le {date} via {citizen_wizard/field}")
- [ ] P4.A.2 : Afficher warning si `has_pending_citizen_payment`
- [ ] P4.A.3 : Griser les obligations `restricted_obligations` avec icône verrou + tooltip "Votre entité ne peut pas collecter ce type"
- [ ] P4.A.4 : Bouton "Voir dossier" si existing → navigation détail

#### P4.B — Écran collect payment avec Idempotency-Key
- [ ] P4.B.1 : Générer UUID client-side au mount du screen : `idempotencyKey = useRef(uuid())`
- [ ] P4.B.2 : Passer en header `Idempotency-Key` à la requête
- [ ] P4.B.3 : Gérer cas `Idempotency-Replay: true` → toast "Paiement déjà enregistré"

#### P4.C — Supervisor dashboard (P4 du master plan)
- [ ] P4.C.1 : Écran liste scellés en attente
- [ ] P4.C.2 : Écran reconciliation cash
- [ ] P4.C.3 : Écran statut agents temps réel
- [ ] P4.C.4 : Écran rapports + export

#### P4.D — Offline mode (P5 du master plan)
- [ ] P4.D.1 : SQLite schema : `pending_inspections`, `pending_updates`, `pending_payments`, `pending_photos`
- [ ] P4.D.2 : Sync engine : background task + NetInfo listener
- [ ] P4.D.3 : Conflict resolution : server-wins pour status, merge pour notes, refuse-replay pour payments (via Idempotency-Key)
- [ ] P4.D.4 : Cache licences vérifiées (24h TTL)
- [ ] P4.D.5 : Indicateur sync header badge
- [ ] P4.D.6 : Tests airplane mode

#### P4.E — Push notifications
- [ ] P4.E.1 : FCM setup + permissions Android 13+
- [ ] P4.E.2 : Notifications : scellé approuvé/rejeté, MED expiré, nouvelle mission, paiement rejeté par superviseur
- [ ] P4.E.3 : Deep linking vers écran concerné

#### P4.F — Validation
- [ ] P4.F.1 : Build APK dev via EAS
- [ ] P4.F.2 : Tests E2E : terrain sans réseau → 5 inspections + 3 paiements → reconnexion → sync → 0 doublon
- [ ] P4.F.3 : Stress test : 100 inspections offline → sync en < 30s
- [ ] P4.F.4 : Auto-critique P4

---

## 7. PHASE 5 — Observabilité + audit trail bundle + tests charge

### 7.1 Objectifs
- Production-ready pour 100+ agents concurrents, 1M+ transactions
- Audit trail légal pour Hacienda
- Tests de charge + alerting

### 7.2 Checklist P5

#### P5.A — Audit trail bundle
- [ ] P5.A.1 : Étendre `license_compliance_events` avec event_type `field_payment_collected`
- [ ] P5.A.2 : Logger chaque `collect_field_payment` dans ce journal en plus de `audit_logs`
- [ ] P5.A.3 : Include : agent_id, inspection_id, payment_id, obligation_ids, amount, method, gps, timestamp

#### P5.B — Métriques Prometheus
- [ ] P5.B.1 : Counter `field_collections_total{method, fee_type, status}`
- [ ] P5.B.2 : Counter `field_collections_dossier_reused_total` vs `field_collections_dossier_created_total`
- [ ] P5.B.3 : Histogram `find_or_create_bundle_dossier_duration_seconds`
- [ ] P5.B.4 : Counter `cleanup_abandoned_requests_skipped_bundle_total` (doit rester flat = 0 suppression bundle)
- [ ] P5.B.5 : Counter `idempotency_replay_total{endpoint}`

#### P5.C — Tests de charge
- [ ] P5.C.1 : Locust scenario : 100 agents collectent en parallèle sur 10 licences (forcer contention UNIQUE)
- [ ] P5.C.2 : Cible : p95 < 500ms, 0 duplicate dossier, 0 error 500
- [ ] P5.C.3 : Scenario 1000 clients citoyens + 100 agents en parallèle
- [ ] P5.C.4 : Benchmark cleanup cron sur 10k DRAFT requests

#### P5.D — Alertes
- [ ] P5.D.1 : Alert PagerDuty si `field_collections_without_dossier_reuse_total` augmente anormalement (logique déduplication cassée)
- [ ] P5.D.2 : Alert si `cleanup_abandoned_requests_skipped_bundle_total` > 0 augmente (signe que bundle DRAFT sont en train d'être candidats à suppression — vérifier)
- [ ] P5.D.3 : Alert si `idempotency_replay_total` spike (client en retry loop)

#### P5.E — Documentation
- [ ] P5.E.1 : Section "Field payment flow" dans `Documentations/code-analysis.md`
- [ ] P5.E.2 : Diagramme séquence Mermaid : citizen-wizard, field-terrain, deduplication
- [ ] P5.E.3 : Runbook incident "Duplicate dossier detected"

#### P5.F — Validation finale
- [ ] P5.F.1 : Tous tests passent (unit + integration + E2E + load)
- [ ] P5.F.2 : GitHub Actions vert
- [ ] P5.F.3 : Déploiement staging + 48h observation
- [ ] P5.F.4 : Auto-critique finale
- [ ] P5.F.5 : Mise à jour MEMORY.md avec pointeur vers ce plan

---

## 8. DÉPENDANCES ET ORDRE D'EXÉCUTION

```
P1 ─┬─► P2 ─┬─► P4 ─► P5
    │       │
    └─► P3 ─┘
```

- P1 est bloquant pour TOUT le reste (les bugs critiques empêchent le bon fonctionnement)
- P2 et P3 peuvent être parallélisés après P1
- P4 (mobile) nécessite P1 + P2 + P3 (endpoints corrigés et enrichis)
- P5 (observabilité) clôture

---

## 9. MÉTRIQUES DE SUCCÈS

| Métrique | Avant (mesuré) | Cible |
|----------|----------------|-------|
| Dossiers dupliqués par entreprise/bundle/année | Inconnu (bug probable) | **0** |
| Taux d'erreur `collect_field_payment` | Inconnu (probable 100% si B1) | **< 0.1%** |
| Dossiers bundle supprimés par cleanup | Inconnu | **0** |
| Latence find_or_create p95 | — | **< 200ms** |
| Paiements terrain dupliqués (retry) | Inconnu | **0** (grâce à Idempotency) |
| Tests couverture `CollectionService` | 0% | **> 85%** |
| Concurrent agents supportés | Inconnu | **100+** validé par load test |

---

## 10. RISQUES ET MITIGATIONS

| Risque | Impact | Mitigation |
|--------|--------|------------|
| Migration 291 échoue en prod (données existantes incohérentes) | 🔴 Critique | Backfill séparé en étapes, dry-run staging, rollback script prêt |
| Index UNIQUE détecte des duplicats préexistants (si bug B1-B4 a tourné en prod) | 🔴 Critique | Pré-cleanup SQL avant CREATE INDEX : query de détection + résolution manuelle |
| Cron Cloud Scheduler oublié → dossiers bundle pas protégés mais pas non plus nettoyés | 🟠 Haut | Check IaC + smoke test cron endpoint |
| Idempotency Redis cache full (100+ agents × 24h retention) | 🟡 Moyen | TTL agressif + mémoire Upstash surveillée |
| Mobile offline queue corrompue | 🟠 Haut | Signature SHA256 des actions + versionning schema SQLite |
| Permission fee_type cassée pour rôles legacy | 🟡 Moyen | Mode permissif en shadow (log warning mais ne bloque pas) puis stricte après 1 semaine |

---

## 11. VALIDATION REQUISE AVANT P1

Avant de démarrer P1, cette checklist doit être validée par l'utilisateur :

- [ ] **Validation utilisateur du plan général** (ce document)
- [ ] **Confirmation** : 1 `service_request` par `commercial_license` (1:1) et non 1 par entreprise/an
- [ ] **Confirmation** : `field_inspection` est un dossier complet et non un simple enregistrement de paiement
- [ ] **Confirmation** : les dossiers bundle ne doivent JAMAIS être expirés par cron (même si aucune activité > 30j)
- [ ] **Vérification BD** : l'utilisateur exécute cette query pour confirmer l'état prod :
  ```sql
  -- 1. Enum case check
  SELECT enum_range(NULL::service_request_status_enum);

  -- 2. Migration 287 index existe ?
  SELECT indexname, indexdef FROM pg_indexes
  WHERE indexname = 'idx_sr_company_year_active';

  -- 3. Duplicats potentiels sur bundle ?
  SELECT company_id, bundle_id, fiscal_year, COUNT(*)
  FROM commercial_licenses cl
  JOIN service_requests sr ON sr.company_id = cl.company_id
  WHERE sr.workflow_code IN ('BUNDLE_PAYMENT', 'FIELD_INSPECTION')
  GROUP BY company_id, bundle_id, fiscal_year
  HAVING COUNT(*) > 1;

  -- 4. Dossiers field_inspection en prod ?
  SELECT COUNT(*), source FROM service_requests
  GROUP BY source;

  -- 5. Licences sans service_request_id ?
  SELECT COUNT(*) FROM commercial_licenses WHERE service_request_id IS NULL;
  ```
  Résultat → ajuster P1.A.5 (backfill) selon ce qui existe

---

## 12. LIVRABLES PAR PHASE

| Phase | Livrables |
|-------|-----------|
| P1 | `291_fix_bundle_dossier_linking.sql`, `collection_service.py` refactoré, test suite > 85% couverture |
| P2 | `service_request_service.py` query corrigée, `cron_routes.py` nouveau endpoint, `config.py` externalisé, `.env.example` docs |
| P3 | `app/core/idempotency.py`, `inspection_service.verify_license_for_agent` enrichi, `CollectionService` fee_type checks |
| P4 | `packages/inspector/src/modules/offline/`, supervisor screens, sync engine, FCM, APK dev |
| P5 | Prometheus metrics, Locust scenarios, Documentations/code-analysis.md mis à jour, runbooks |

---

## 13. WORKFLOW DE DÉVELOPPEMENT (RAPPEL RÈGLES)

1. Avant chaque phase : **créer le plan détaillé de la phase** avec architecture + interfaces dans `.claude/plans/INSPECTION_BUNDLE_P{n}_DETAIL.md`
2. Phase par phase avec checklist
3. **Tests obligatoires** à la fin de chaque phase pour valider la checklist
4. Cocher progressivement le plan au fur et à mesure
5. **Auto-critique** à la fin de chaque phase + correction des bugs trouvés
6. **Commit local** par phase, **push uniquement après validation globale de l'utilisateur** (règle 14 MEMORY)
7. **GitHub Actions** gère tous les builds (règle 1 MEMORY — pas de gcloud manuel)
8. **Jamais hardcoder** — toujours passer par `settings.` ou BD
9. **OWASP** : Idempotency-Key, FOR UPDATE, fee_type checks, audit_logs
10. **Interroger BD directement** pour vérifier tout schéma avant coder (règle 12 MEMORY)

---

## 14. STATUT

- **Plan général** : ✅ Rédigé, en attente validation utilisateur
- **P1 plan détaillé** : ⏳ À créer après validation générale
- **P2-P5 plans détaillés** : ⏳ À créer avant chaque phase

---

**FIN DU PLAN GÉNÉRAL**

Pour valider : réponds "GO P1" pour que je rédige le plan détaillé de la Phase 1 (architecture SQL + signatures Python + tests).
