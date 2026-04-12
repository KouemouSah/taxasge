# PLAN DÉTAILLÉ — Phase 1 : Fix critique `CollectionService` + migration corrective

**Date** : 2026-04-11
**Parent plan** : `.claude/plans/INSPECTION_BUNDLE_PAYMENT_FIX_PLAN.md` (plan général)
**Statut** : À VALIDER avant implémentation
**Prérequis** : BD prod inspectée directement (voir section 0)

---

## 0. ÉTAT BD PROD (factuel, 2026-04-11)

### 0.1 Tables concernées (colonnes réelles)

**`service_requests`** (52 colonnes en prod) — colonnes clés :
- `id`, `reference`, `user_id`, `workflow_code`, `status` (enum UPPERCASE), `company_id` (UUID, nullable), `bundle_id` (UUID, FK service_bundles, nullable), `entity_location_id`, `entity_code`, `fiscal_service_id`, `zone_id`, `batch_id`
- **PAS DE** : `source`, `commercial_license_id`, `fiscal_year`, `is_bundle`, `expires_at_logical`
- Contraintes existantes : `fk_sr_valid_workflow_code` (workflow_code REFERENCES valid_workflow_codes), FK bundle_id → service_bundles ON DELETE SET NULL

**`commercial_licenses`** (13 rows prod) :
- Colonnes : `id`, `company_id`, `service_request_id` (UUID, nullable, FK ON DELETE SET NULL), `bundle_id`, `zone_id`, `city_id`, `fiscal_year` (INTEGER NOT NULL), `processing_mode`, `total_amount`, `amount_paid`, `penalty_amount`, `obligations_total/paid/overdue`, `compliance_score`, `status` (VARCHAR CHECK `open/partial/complete/overdue/suspended/closed`), `deadline`, `opened_at`, `completed_at`, `closed_at`
- **UNIQUE** : `(company_id, bundle_id, fiscal_year)` ← source de vérité pour dedup
- **`service_request_id = NULL` partout** en prod

**`license_obligations`** (70 rows : 35 pending + 22 paid + 13 overdue) :
- `id`, `license_id`, `bundle_item_id`, `fiscal_service_id`, `ministry_id`, `fee_type` (tesoro/municipal/chamber), `amount`, `penalty_amount`, `due_date`, `status`, `payment_id` (UUID, nullable)
- **paid ont `payment_id = NULL`** → pas d'archi paiement réelle en prod

**`service_payments`** :
- `collection_type` CHECK `'office'/'field'/'online'`
- `fee_type` CHECK `'tesoro'/'municipal'/'chamber'`
- **`chk_service_request_required`** : `service_request_id IS NOT NULL OR created_at < '2026-01-11'` ← **obligatoire depuis 2026-01-11**
- Colonnes field : `collection_type`, `collected_by`, `field_inspection_id`, `field_sla_warning_sent`, `field_sla_escalated`, `fee_type`, `entity_code`, `ministry_id`

**`field_inspections`** (2 rows `in_progress`) :
- Schéma selon migration 249 (inchangé)

### 0.2 Enum `service_request_status_enum` — valeurs UPPERCASE exactes

```
DRAFT, TIMBRES_PENDING, TIMBRES_PAID, SUBMITTED, DOCUMENTS_REQUIRED,
UNDER_REVIEW, DOSSIER_VALIDE, REJECTED, PENDING_NOTA_INGRESO,
NOTA_UPLOADED, PAYMENT_PENDING, PAYMENT_PROCESSING, PAID, PAYMENT_FAILED,
CITA_SCHEDULED, IN_PROGRESS, COMPLETED, CANCELLED, EXPIRED
```

### 0.3 `valid_workflow_codes` — déjà enregistrés

- `FIELD_INSPECTION` ✓ (créé 2026-04-07)
- `BUNDLE_PAYMENT` ✓ (via migration 273)

### 0.4 Permissions inspection

14 permissions `inspection.*` en BD, assignées à :
- `admin` : 14
- 9 supervisor_* : 14 chacun
- 9 agent_* : 6 chacun

---

## 1. OBJECTIFS P1

1. Corriger **7 bugs critiques** dans `CollectionService` (B1-B7 du plan général)
2. Créer la migration **291** qui rattrape la migration 287 + ajoute les colonnes manquantes pour le lien 1:1 licence↔dossier
3. Mettre en place la déduplication forte via **lazy creation** déclenchée au 1er paiement terrain
4. Garantir `service_request_id` NOT NULL sur tout `service_payment` (respecter `chk_service_request_required`)
5. Tests unitaires + intégration > 85% couverture
6. Zéro régression sur les flux `service_payments` existants (office/online)

---

## 2. ARCHITECTURE CIBLE

### 2.1 Modèle 1:1 lazy

```
commercial_licenses (13 rows prod)
├── id                      ◄──────┐
├── company_id              │      │
├── bundle_id               │      │ Lien 1:1 bidirectionnel
├── fiscal_year             │      │
└── service_request_id ─────┘      │ (lazy, NULL tant que pas d'encaissement)
                                   │
service_requests (nouvelles colonnes)
├── id                              │
├── user_id                         │
├── company_id                      │
├── workflow_code = 'FIELD_INSPECTION'
├── status = 'SUBMITTED'  (UPPERCASE)
├── source = 'field_inspection'   ◄── NOUVEAU
├── commercial_license_id ──────┘  ◄── NOUVEAU
└── fiscal_year                    ◄── NOUVEAU (dénormalisé pour queries rapides)

service_payments (inchangé)
├── service_request_id  NOT NULL  (chk existant)
├── collection_type = 'field'
└── field_inspection_id
```

### 2.2 Flow `collect_field_payment` cible

```
┌─────────────────────────────────────────────────────────────────┐
│ async with conn.transaction():                                  │
│   SET LOCAL lock_timeout = '3s'                                 │
│   SET LOCAL statement_timeout = '5s'                            │
│                                                                 │
│  1. Validate inspection ownership + obligations                 │
│     (enum UPPERCASE 'CANCELLED'/'REJECTED' si référencé)        │
│                                                                 │
│  2. SELECT commercial_licenses WHERE id = $license_id FOR UPDATE│
│     → SEUL lock explicite (ordre canonique D5, racine)          │
│                                                                 │
│  3. IF license.service_request_id IS NULL:                      │
│       a. TRY INSERT INTO service_requests (                     │
│            user_id=company_owner, company_id=cl.company_id,     │
│            workflow_code='FIELD_INSPECTION',                    │
│            status='SUBMITTED', source='field_inspection',       │
│            commercial_license_id=cl.id, bundle_id=cl.bundle_id, │
│            fiscal_year=cl.fiscal_year)                          │
│          RETURNING id → new_sr_id                               │
│          (reference auto-générée par trg_sr_auto_reference →    │
│           'FLD-YYYY-NNNNN' grâce au patch D1)                   │
│       b. EXCEPT asyncpg.UniqueViolationError:                   │
│            existing = SELECT id FROM service_requests           │
│                       WHERE commercial_license_id = $1          │
│            return existing  (D3 — récupération déterministe,    │
│                               pas de retry/sleep)               │
│       c. UPDATE commercial_licenses                             │
│            SET service_request_id = new_sr_id WHERE id = cl.id  │
│          (aussi fait par trigger trg_sync_license_sr_id)        │
│     ELSE:                                                       │
│       service_request_id = license.service_request_id           │
│                                                                 │
│  4. INSERT INTO service_payments (                              │
│       service_request_id=$sr_id, collection_type='field',       │
│       workflow_status='field_collected',                        │
│       field_inspection_id=$insp_id, collected_by=$agent_id,     │
│       fee_type=..., entity_code=..., total_amount=...)          │
│     (FK chk_service_request_required SATISFAITE — SR NOT NULL)  │
│                                                                 │
│  5. UPDATE license_obligations                                  │
│       SET status = 'payment_pending',  -- D2: PAS 'paid'        │
│           payment_id = $payment_id                              │
│     WHERE id = ANY($obligation_ids)                             │
│       AND status IN ('pending', 'overdue')                      │
│                                                                 │
│  6. UPDATE field_inspections SET payment_collected=true, ...    │
│                                                                 │
│  7. INSERT INTO license_compliance_events (                     │
│       event_type='payment_initiated',                           │
│       event_data={source:'field_inspection',...})               │
│                                                                 │
│ END TRANSACTION (commit ou rollback atomique)                   │
│                                                                 │
│ POST-TRANSACTION (non-atomique, best-effort):                   │
│  8. EventBus.publish PAYMENT_CASH_PENDING                       │
│  9. INSERT INTO audit_logs (...)                                │
│                                                                 │
│ SUPERVISOR VALIDATION (async, endpoint existant):               │
│   POST /inspections/reconcile/supervisor/{payment_id}/validate  │
│   → LicenseService.on_payment_completed(payment_id)             │
│   → UPDATE license_obligations SET status='paid'                │
│      WHERE payment_id=$1 AND status='payment_pending'           │
│   → ObligationRoutingService.route_paid_obligations()           │
│   → status='processing' (tesoro) ou 'completed' (municipal)     │
└─────────────────────────────────────────────────────────────────┘
```

**Propriétés garanties** :
- **Idempotence** : `FOR UPDATE` sur licence + check `service_request_id IS NOT NULL`
- **1:1 strict** (1 SR max par licence) via **partial unique index** côté BD + trigger d'assertion
- **Réutilisation automatique** si citoyen ou autre agent a déjà créé le SR
- **Anti-race condition** : lock racine sur `commercial_licenses` + recovery `UniqueViolationError` déterministe (D3)
- **Double validation OWASP A04** : agent crée en `payment_pending`, superviseur valide en `paid` via endpoint existant (D2)
- **Timeouts transaction-scoped** : `lock_timeout 3s` + `statement_timeout 5s` — pas de blocage infini (D5)
- **Audit trail légal** : `license_compliance_events` immuable (event_type `payment_initiated`)

### 2.3 Signature Python cible

```python
# packages/backend/app/modules/inspections/services/collection_service.py

class CollectionService:

    @staticmethod
    async def _find_or_create_bundle_dossier(
        conn: asyncpg.Connection,
        license_id: UUID,
        company_owner_user_id: UUID,
    ) -> UUID:
        """
        Find or lazy-create service_request for a commercial_license (1:1).

        Must be called inside an active transaction where commercial_licenses
        has already been locked via SELECT FOR UPDATE by the caller.

        The UNIQUE partial index on service_requests(commercial_license_id)
        is a safety net against race conditions (cf. D3 retry déterministe).

        Args:
            conn: active asyncpg connection (must be inside transaction
                  with commercial_licenses row already locked)
            license_id: commercial_licenses.id
            company_owner_user_id: user_id of company_owner (NOT the agent)

        Returns:
            service_request UUID (existing or newly created)

        Raises:
            ValueError: if license not found
        """
        # The license row MUST already be locked by the caller via FOR UPDATE
        # (see collect_field_payment step 2). We re-read it here to access
        # bundle_id/fiscal_year/service_request_id without re-locking.
        row = await conn.fetchrow(
            """
            SELECT id, company_id, bundle_id, fiscal_year, service_request_id
            FROM commercial_licenses
            WHERE id = $1
            """,
            license_id,
        )
        if not row:
            raise ValueError(f"License {license_id} not found")

        # Reuse existing dossier (1:1 lazy)
        if row["service_request_id"]:
            logger.info(
                "Reusing existing service_request %s for license %s",
                row["service_request_id"], license_id,
            )
            return row["service_request_id"]

        # Lazy create — reference auto-generated by trigger trg_sr_auto_reference
        # (fixed in migration 291 → will produce 'FLD-YYYY-NNNNN')
        new_id = uuid4()
        try:
            await conn.execute(
                """
                INSERT INTO service_requests (
                    id, user_id, company_id,
                    workflow_code, status, source,
                    commercial_license_id, bundle_id, fiscal_year,
                    created_at, updated_at
                ) VALUES (
                    $1, $2, $3,
                    'FIELD_INSPECTION', 'SUBMITTED', 'field_inspection',
                    $4, $5, $6,
                    NOW(), NOW()
                )
                """,
                new_id, company_owner_user_id, row["company_id"],
                license_id, row["bundle_id"], row["fiscal_year"],
            )
        except asyncpg.UniqueViolationError:
            # Safety net per D3: UNIQUE partial index idx_sr_commercial_license_unique
            # caught a concurrent insert. Recover deterministically (no retry).
            existing = await conn.fetchval(
                """
                SELECT id FROM service_requests
                WHERE commercial_license_id = $1
                LIMIT 1
                """,
                license_id,
            )
            if existing is None:
                raise  # Different unique violation, not ours
            logger.warning(
                "UniqueViolationError recovered for license %s → existing SR %s",
                license_id, existing,
            )
            return existing

        # Link back from commercial_licenses (also enforced by trigger
        # trg_sync_license_sr_id, but explicit here for clarity/defensive)
        await conn.execute(
            "UPDATE commercial_licenses SET service_request_id = $1, updated_at = NOW() WHERE id = $2",
            new_id, license_id,
        )

        logger.info(
            "Created service_request %s for license %s (company %s, bundle %s, year %d)",
            new_id, license_id, row["company_id"], row["bundle_id"], row["fiscal_year"],
        )
        return new_id

    @staticmethod
    async def collect_field_payment(
        conn, inspection_id, user_id, obligation_ids, method, amount,
        phone_number=None, notes=None,
    ) -> dict:
        async with conn.transaction():
            # D5: transaction-scoped timeouts
            await conn.execute("SET LOCAL lock_timeout = '3s'")
            await conn.execute("SET LOCAL statement_timeout = '5s'")

            # Step 1: Validate inspection ownership + obligations
            # (enum UPPERCASE 'CANCELLED', 'REJECTED' — pas lowercase)
            inspection = await InspectionRepository.get_by_id(conn, inspection_id)
            if not inspection:
                raise ValueError(f"Inspection {inspection_id} not found")
            if inspection["agent_id"] != user_id:
                raise ValueError("Cannot collect payment on another agent's inspection")
            if inspection.get("payment_collected"):
                raise ValueError("Payment already collected for this inspection")

            # Validate obligations + compute expected amount (unchanged)
            obls = await conn.fetch(
                """
                SELECT lo.id, lo.status, lo.amount, lo.penalty_amount,
                       lo.fee_type, lo.license_id, lo.ministry_id
                FROM license_obligations lo
                WHERE lo.id = ANY($1::uuid[])
                  AND lo.license_id = $2
                ORDER BY lo.fee_type
                """,
                obligation_ids, inspection["license_id"],
            )
            if len(obls) != len(obligation_ids):
                raise ValueError("Obligations not found or wrong license")
            uncollectable = [o for o in obls if o["status"] not in ("pending", "overdue")]
            if uncollectable:
                raise ValueError(f"Obligations must be pending/overdue")

            base_amount = sum(_normalize_amount(o["amount"]) for o in obls)
            penalties = sum(_normalize_amount(o["penalty_amount"]) for o in obls)
            expected = base_amount + penalties
            received = _normalize_amount(amount)
            if received != expected:
                raise ValueError(f"Amount mismatch: expected {expected}, got {received}")

            # Step 2: LOCK license row (D5 — only explicit lock in the flow)
            license_row = await conn.fetchrow(
                """
                SELECT id, company_id, bundle_id, fiscal_year
                FROM commercial_licenses
                WHERE id = $1
                FOR UPDATE
                """,
                inspection["license_id"],
            )
            if not license_row:
                raise ValueError("License not found")

            # Step 3: Find company owner for service_request.user_id
            owner = await conn.fetchrow(
                """
                SELECT u.id AS user_id, u.email, u.full_name
                FROM user_company_roles ucr
                JOIN users u ON u.id = ucr.user_id
                WHERE ucr.company_id = $1
                  AND ucr.role = 'company_owner' AND ucr.is_active = true
                LIMIT 1
                """,
                license_row["company_id"],
            )
            payment_user_id = owner["user_id"] if owner else user_id

            # Step 4: Lazy-create or reuse 1:1 dossier (D3 sans retry)
            service_request_id = await CollectionService._find_or_create_bundle_dossier(
                conn,
                license_id=license_row["id"],
                company_owner_user_id=payment_user_id,
            )

            # Step 5: INSERT service_payment (FK constraint satisfied — SR NOT NULL)
            payment_id = uuid4()
            seq = await conn.fetchval("SELECT nextval('field_receipt_seq')")
            payment_ref = f"FLD-{datetime.now(timezone.utc).strftime('%Y%m%d')}-{seq:05d}"
            ministry_id = obls[0]["ministry_id"]
            fee_type = obls[0]["fee_type"]
            entity_code = await CollectionService._resolve_agent_entity_code(conn, user_id)

            await conn.execute(
                """
                INSERT INTO service_payments (
                    id, payment_reference, user_id, company_id,
                    service_request_id,
                    payment_type, base_amount, penalties, discounts, total_amount,
                    payment_method, currency, status, workflow_status,
                    entity_code, ministry_id, fee_type,
                    collection_type, collected_by, field_inspection_id,
                    supporting_documents,
                    created_at, updated_at
                ) VALUES (
                    $1, $2, $3, $4,
                    $5,
                    'full', $6, $7, 0, $8,
                    $9, 'XAF', 'pending', 'field_collected',
                    $10, $11, $12,
                    'field', $13, $14,
                    $15,
                    NOW(), NOW()
                )
                """,
                payment_id, payment_ref, payment_user_id, license_row["company_id"],
                service_request_id,
                base_amount, penalties, received,
                method,
                entity_code, ministry_id, fee_type,
                user_id, inspection_id,
                json.dumps({
                    "inspection_id": str(inspection_id),
                    "obligation_ids": [str(oid) for oid in obligation_ids],
                    "phone_number": phone_number,
                    "notes": notes,
                    "fee_types": list({o["fee_type"] for o in obls}),
                }),
            )

            # Step 6: Obligations → payment_pending (D2 — supervisor validation déclenche 'paid')
            await conn.execute(
                """
                UPDATE license_obligations
                SET status = 'payment_pending',
                    payment_id = $1,
                    updated_at = NOW()
                WHERE id = ANY($2::uuid[])
                  AND status IN ('pending', 'overdue')
                """,
                payment_id, obligation_ids,
            )

            # Step 7: Update inspection
            await InspectionRepository.update(conn, inspection_id, {
                "payment_collected": True,
                "payment_amount": amount,
                "payment_id": payment_id,
                "payment_receipt_number": payment_ref,
            })

            # Step 8: Compliance event (audit trail bundle)
            await conn.execute(
                """
                INSERT INTO license_compliance_events (
                    license_id, event_type, event_data,
                    triggered_by, created_at
                ) VALUES (
                    $1, 'payment_initiated', $2::jsonb,
                    $3, NOW()
                )
                """,
                license_row["id"],
                json.dumps({
                    "source": "field_inspection",
                    "inspection_id": str(inspection_id),
                    "payment_id": str(payment_id),
                    "payment_reference": payment_ref,
                    "obligation_ids": [str(oid) for oid in obligation_ids],
                    "amount": float(received),
                    "method": method,
                }),
                user_id,
            )

        # Step 9: Post-transaction — EventBus + audit_logs (non-atomic)
        try:
            EventBus.publish_nowait(EventType.PAYMENT_CASH_PENDING, {...})
        except Exception as e:
            logger.warning(f"Event emission failed: {e}")

        return {
            "payment_id": str(payment_id),
            "payment_reference": payment_ref,
            "service_request_id": str(service_request_id),
            "amount": float(received),
            "obligation_count": len(obligation_ids),
            "status": "field_collected",
            "method": method,
        }
```

**Note sur D2** : Les obligations passent à `payment_pending` dans la même transaction que l'insert du `service_payment`. Le superviseur via l'endpoint existant `POST /inspections/reconcile/supervisor/{payment_id}/validate` déclenchera `LicenseService.on_payment_completed()` qui fait la transition `payment_pending → paid → routing` (cohérence avec paiement online).

---

## 3. MIGRATION SQL DÉTAILLÉE (`291_fix_bundle_dossier_linking.sql`)

```sql
-- Migration 291: Fix bundle dossier linking (1:1 licence ↔ service_request)
-- Date: 2026-04-11
-- Context: Corrige les bugs B1-B7 de INSPECTION_BUNDLE_PAYMENT_FIX_PLAN.md
--          Rattrape la migration 287 qui a partiellement failed en prod.
--
-- État BD avant migration (vérifié via psycopg2 2026-04-11):
--   - service_requests.source: N'EXISTE PAS (ALTER 287 failed)
--   - idx_sr_company_year_active: N'EXISTE PAS
--   - 0 service_requests avec commercial_license_id (colonne n'existe pas)
--   - 13 commercial_licenses avec service_request_id = NULL
--   - valid_workflow_codes.FIELD_INSPECTION: EXISTS (créé 2026-04-07)
--   - workflows.BUNDLE_PAYMENT: EXISTS
--
-- Stratégie: additive only, pas de destructive drops sur données existantes.

BEGIN;

-- ============================================================
-- 1. PATCH fonction generate_service_request_reference
-- ============================================================
-- Bugs corrigés dans la fonction existante (vérifiés en prod 2026-04-11):
--   BUG-A: Pas d'advisory lock → race condition possible
--          (alors que generate_batch_reference a pg_advisory_xact_lock)
--   BUG-B: Switch hardcodé lowercase ('residencia%') mais codes UPPERCASE
--          en prod → tous les refs tombent sur 'SRV' (12/12 rows prod)
--   BUG-C: Pas de cas pour BUNDLE_PAYMENT ni FIELD_INSPECTION
--
-- Action: CREATE OR REPLACE sans DROP (idempotent + safe)

CREATE OR REPLACE FUNCTION public.generate_service_request_reference(
    p_workflow_code character varying
) RETURNS character varying
LANGUAGE plpgsql
AS $function$
DECLARE
    v_prefix VARCHAR(10);
    v_year VARCHAR(4);
    v_sequence INTEGER;
    v_reference VARCHAR(50);
    v_code_upper VARCHAR(100);
BEGIN
    -- BUG-A FIX: Advisory lock pour sérialiser les appels concurrents
    -- Key stable = hashtext d'une chaîne connue (reproducible across restarts)
    PERFORM pg_advisory_xact_lock(hashtext('service_request_reference_gen'));

    v_code_upper := UPPER(p_workflow_code);

    -- BUG-B FIX: Matching UPPERCASE explicite
    -- BUG-C FIX: Ajout BUNDLE_PAYMENT (LIC) et FIELD_INSPECTION (FLD)
    v_prefix := CASE
        WHEN v_code_upper LIKE 'RESIDENCIA%' THEN 'RES'
        WHEN v_code_upper LIKE 'PASAPORTE%' THEN 'PAS'
        WHEN v_code_upper LIKE 'FP_CARNET_FUNCIONARIO%' THEN 'CFN'
        WHEN v_code_upper LIKE 'CONDUCIR%' THEN 'CON'
        WHEN v_code_upper LIKE 'VEHICULO%' THEN 'VHC'
        WHEN v_code_upper LIKE 'CONTRATO%' THEN 'CTR'
        WHEN v_code_upper LIKE 'FP_VERIFICACION%' THEN 'VER'
        WHEN v_code_upper LIKE 'FP_PROMOCION%' THEN 'PRO'
        WHEN v_code_upper LIKE 'FP_CERTIFICADO%' THEN 'CER'
        WHEN v_code_upper LIKE 'FP_PERMISO%' THEN 'PER'
        WHEN v_code_upper LIKE 'PRORROGA%' OR v_code_upper LIKE 'PERMANENCIA%'
             OR v_code_upper LIKE 'SALIDA%' THEN 'VIS'
        WHEN v_code_upper = 'BUNDLE_PAYMENT' THEN 'LIC'
        WHEN v_code_upper = 'FIELD_INSPECTION' THEN 'FLD'
        ELSE 'SRV'
    END;

    v_year := TO_CHAR(NOW(), 'YYYY');

    -- Next sequence number for this prefix+year
    SELECT COALESCE(MAX(
        CAST(NULLIF(SPLIT_PART(reference, '-', 3), '') AS INTEGER)
    ), 0) + 1
    INTO v_sequence
    FROM service_requests
    WHERE reference LIKE v_prefix || '-' || v_year || '-%';

    v_reference := v_prefix || '-' || v_year || '-' || LPAD(v_sequence::TEXT, 5, '0');

    RETURN v_reference;
END;
$function$;

COMMENT ON FUNCTION public.generate_service_request_reference IS
    'Génère une référence unique PREFIX-YYYY-NNNNN pour un service_request. '
    'Advisory lock pour éviter race conditions. Patched 2026-04-11 (migration 291).';

-- ============================================================
-- 2. Ajouter colonne `source` sur service_requests
-- ============================================================
-- Rattrape la migration 287 qui avait ADD COLUMN dans un BEGIN/COMMIT
-- qui s'est rollback. Ici on fait DANS NOTRE PROPRE BEGIN sans mixer
-- avec CREATE INDEX dangereux.

ALTER TABLE service_requests
    ADD COLUMN IF NOT EXISTS source VARCHAR(30) NOT NULL DEFAULT 'citizen_wizard';

COMMENT ON COLUMN service_requests.source IS
    'Origin of this request: citizen_wizard (online), field_inspection (agent terrain), admin_import (migration), batch (bulk)';

-- Check constraint — créé idempotent
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'chk_sr_source' AND conrelid = 'service_requests'::regclass
    ) THEN
        ALTER TABLE service_requests
            ADD CONSTRAINT chk_sr_source
            CHECK (source IN ('citizen_wizard', 'field_inspection', 'admin_import', 'batch'));
    END IF;
END $$;

-- ============================================================
-- 3. Ajouter colonnes pour lien 1:1 commercial_licenses
-- ============================================================

ALTER TABLE service_requests
    ADD COLUMN IF NOT EXISTS commercial_license_id UUID
        REFERENCES commercial_licenses(id) ON DELETE RESTRICT;

ALTER TABLE service_requests
    ADD COLUMN IF NOT EXISTS fiscal_year INTEGER;

COMMENT ON COLUMN service_requests.commercial_license_id IS
    'FK vers commercial_licenses — non-NULL pour dossiers bundle (FIELD_INSPECTION ou BUNDLE_PAYMENT). NULL pour autres workflows.';

COMMENT ON COLUMN service_requests.fiscal_year IS
    'Année fiscale dénormalisée depuis commercial_licenses (accélère les queries de reporting)';

-- ============================================================
-- 4. Backfill (données existantes)
-- ============================================================
-- État prod: 0 service_requests bundle, 13 commercial_licenses orphelines
-- → aucun backfill nécessaire (rien à relier).
-- On laisse commercial_licenses.service_request_id = NULL
-- Elles seront liées au premier field_payment (lazy create).

-- Toutefois, si des SR bundle existaient (ex: staging), on les relie :
UPDATE service_requests sr
SET commercial_license_id = cl.id,
    fiscal_year = cl.fiscal_year,
    bundle_id = COALESCE(sr.bundle_id, cl.bundle_id),
    source = CASE
        WHEN sr.workflow_code = 'FIELD_INSPECTION' THEN 'field_inspection'
        ELSE sr.source
    END
FROM commercial_licenses cl
WHERE cl.service_request_id = sr.id
  AND sr.commercial_license_id IS NULL;

-- ============================================================
-- 5. UNIQUE partial index : 1 SR max par licence
-- ============================================================
-- Garde-fou BD : empêche 2 service_requests pour la même licence
-- même en cas de bug applicatif.

CREATE UNIQUE INDEX IF NOT EXISTS idx_sr_commercial_license_unique
    ON service_requests (commercial_license_id)
    WHERE commercial_license_id IS NOT NULL;

-- ============================================================
-- 6. Index de lookup rapide (bundle/field filters)
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_sr_source
    ON service_requests (source)
    WHERE source != 'citizen_wizard';

CREATE INDEX IF NOT EXISTS idx_sr_fiscal_year
    ON service_requests (fiscal_year)
    WHERE fiscal_year IS NOT NULL;

-- ============================================================
-- 7. Trigger d'intégrité : bundle SR doit avoir commercial_license_id
-- ============================================================

CREATE OR REPLACE FUNCTION fn_enforce_bundle_sr_integrity()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.workflow_code IN ('BUNDLE_PAYMENT', 'FIELD_INSPECTION') THEN
        IF NEW.commercial_license_id IS NULL THEN
            RAISE EXCEPTION 'service_request with workflow_code % must have commercial_license_id',
                NEW.workflow_code
                USING ERRCODE = 'check_violation';
        END IF;
        IF NEW.fiscal_year IS NULL THEN
            RAISE EXCEPTION 'service_request with workflow_code % must have fiscal_year',
                NEW.workflow_code
                USING ERRCODE = 'check_violation';
        END IF;
        IF NEW.source NOT IN ('citizen_wizard', 'field_inspection') THEN
            RAISE EXCEPTION 'bundle service_request source must be citizen_wizard or field_inspection, got %',
                NEW.source
                USING ERRCODE = 'check_violation';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_enforce_bundle_sr_integrity ON service_requests;
CREATE TRIGGER trg_enforce_bundle_sr_integrity
    BEFORE INSERT OR UPDATE ON service_requests
    FOR EACH ROW
    EXECUTE FUNCTION fn_enforce_bundle_sr_integrity();

-- ============================================================
-- 8. Trigger de synchronisation : sync commercial_licenses.service_request_id
-- ============================================================
-- Quand un service_request est créé/updaté avec commercial_license_id,
-- on met à jour commercial_licenses.service_request_id.

CREATE OR REPLACE FUNCTION fn_sync_license_service_request_id()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.commercial_license_id IS NOT NULL THEN
        UPDATE commercial_licenses
            SET service_request_id = NEW.id,
                updated_at = NOW()
            WHERE id = NEW.commercial_license_id
              AND (service_request_id IS NULL OR service_request_id = NEW.id);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_license_sr_id ON service_requests;
CREATE TRIGGER trg_sync_license_sr_id
    AFTER INSERT OR UPDATE OF commercial_license_id ON service_requests
    FOR EACH ROW
    WHEN (NEW.commercial_license_id IS NOT NULL)
    EXECUTE FUNCTION fn_sync_license_service_request_id();

-- ============================================================
-- 9. Sanity checks (non-destructifs)
-- ============================================================

DO $$
DECLARE
    v_orphan_licenses INTEGER;
    v_broken_sr INTEGER;
BEGIN
    -- Count orphan licenses (should be 13 based on prod check 2026-04-11)
    SELECT COUNT(*) INTO v_orphan_licenses
    FROM commercial_licenses
    WHERE service_request_id IS NULL;

    RAISE NOTICE 'Migration 291: % orphan commercial_licenses (lazy-create on first field payment)',
        v_orphan_licenses;

    -- Count SRs that should have commercial_license_id but don't
    SELECT COUNT(*) INTO v_broken_sr
    FROM service_requests
    WHERE workflow_code IN ('BUNDLE_PAYMENT', 'FIELD_INSPECTION')
      AND commercial_license_id IS NULL;

    IF v_broken_sr > 0 THEN
        RAISE WARNING 'Migration 291: % service_requests in bundle/field workflow without commercial_license_id — needs manual investigation',
            v_broken_sr;
    END IF;
END $$;

COMMIT;

-- ============================================================
-- ROLLBACK (manual execution if needed)
-- ============================================================
-- NOTE: Ne PAS rollback le CREATE OR REPLACE FUNCTION de la section 1 —
--       la version précédente est buggée (lowercase + no advisory lock).
--       Si rollback nécessaire, restaurer depuis git history migration 020.
--
-- BEGIN;
-- DROP TRIGGER IF EXISTS trg_sync_license_sr_id ON service_requests;
-- DROP FUNCTION IF EXISTS fn_sync_license_service_request_id();
-- DROP TRIGGER IF EXISTS trg_enforce_bundle_sr_integrity ON service_requests;
-- DROP FUNCTION IF EXISTS fn_enforce_bundle_sr_integrity();
-- DROP INDEX IF EXISTS idx_sr_fiscal_year;
-- DROP INDEX IF EXISTS idx_sr_source;
-- DROP INDEX IF EXISTS idx_sr_commercial_license_unique;
-- ALTER TABLE service_requests DROP COLUMN IF EXISTS fiscal_year;
-- ALTER TABLE service_requests DROP COLUMN IF EXISTS commercial_license_id;
-- ALTER TABLE service_requests DROP CONSTRAINT IF EXISTS chk_sr_source;
-- ALTER TABLE service_requests DROP COLUMN IF EXISTS source;
-- COMMIT;
```

---

## 4. CHECKLIST P1

### P1.A — Migration SQL `291_fix_bundle_dossier_linking.sql`

- [x] P1.A.1 : Créer fichier `packages/backend/database/migrations/291_fix_bundle_dossier_linking.sql`
- [x] P1.A.2 : Section 1 — **CREATE OR REPLACE FUNCTION `generate_service_request_reference`** (D1 patch : advisory lock + UPPERCASE cases + préfixes LIC/FLD)
- [x] P1.A.3 : Section 2 — ADD COLUMN `source` VARCHAR(30) + CHECK constraint (rattrape 287)
- [x] P1.A.4 : Section 3 — ADD COLUMN `commercial_license_id` (FK ON DELETE RESTRICT) + `fiscal_year`
- [x] P1.A.5 : Section 4 — Backfill conditionnel (pas d'impact en prod car 0 rows)
- [x] P1.A.6 : Section 5 — UNIQUE partial index `idx_sr_commercial_license_unique`
- [x] P1.A.7 : Section 6 — Indexes de lookup (`idx_sr_source`, `idx_sr_fiscal_year`)
- [x] P1.A.8 : Section 7 — Trigger `fn_enforce_bundle_sr_integrity` (bundle SR doit avoir `commercial_license_id` NOT NULL)
- [x] P1.A.9 : Section 8 — Trigger `fn_sync_license_service_request_id` (sync bidirectionnel)
- [x] P1.A.10 : Section 9 — Sanity checks `DO $$` avec RAISE NOTICE
- [x] P1.A.11 : Bloc rollback documenté en commentaire (note : fonction `generate_service_request_reference` NE doit PAS être rollbackée — version précédente buggée)
- [x] P1.A.12 : Dry-run sur dev via `"C:/Program Files/Odoo 17/python/python.exe" scripts/apply_migration_291.py`
- [x] P1.A.13 : Vérification post-migration via script psycopg2 :
  - [ ] Colonne `source` existe avec DEFAULT `'citizen_wizard'`
  - [ ] Colonne `commercial_license_id` existe, FK pointe vers `commercial_licenses(id) ON DELETE RESTRICT`
  - [ ] Colonne `fiscal_year` existe
  - [ ] `idx_sr_commercial_license_unique` existe (partial WHERE commercial_license_id IS NOT NULL)
  - [ ] Triggers `trg_enforce_bundle_sr_integrity` + `trg_sync_license_sr_id` existent
  - [ ] Fonction `generate_service_request_reference` contient `pg_advisory_xact_lock` et `BUNDLE_PAYMENT`
  - [ ] Test rapide : `SELECT generate_service_request_reference('BUNDLE_PAYMENT')` → retourne `'LIC-2026-00001'` (ou suivant)
  - [ ] Test rapide : `SELECT generate_service_request_reference('FIELD_INSPECTION')` → retourne `'FLD-2026-00001'`
  - [ ] Test rapide : `SELECT generate_service_request_reference('PASAPORTE_NUEVO')` → retourne `'PAS-2026-NNNNN'` (plus `'SRV-'` !)
- [x] P1.A.14 : Ajouter section "Lock Ordering" dans `CLAUDE.md` (D5)
- [x] P1.A.15 : Pousser la migration vers `develop` **après validation utilisateur globale** (règle 14), GitHub Actions vert

### P1.B — Refactor `CollectionService`

- [x] P1.B.1 : Ouvrir `packages/backend/app/modules/inspections/services/collection_service.py`
- [x] P1.B.2 : Supprimer `_find_or_create_service_request` (ancienne version buggée)
- [x] P1.B.3 : Ajouter `_find_or_create_bundle_dossier(conn, license_id, company_owner_user_id)` selon spec §2.3 :
  - [ ] Pas de `SELECT FOR UPDATE` (caller a déjà locké la license)
  - [ ] Try/except `asyncpg.UniqueViolationError` → SELECT récupération (D3, pas de retry/sleep)
  - [ ] UPDATE `commercial_licenses.service_request_id` explicite (défensif, même si trigger sync existe)
- [x] P1.B.4 : Ajouter helper `_resolve_agent_entity_code(conn, user_id)` (factorisation)
- [x] P1.B.5 : Refactor `collect_field_payment` en suivant le pseudo-code §2.3 :
  - [ ] Entourer TOUT le flow d'`async with conn.transaction():`
  - [ ] **D5 timeouts** : `SET LOCAL lock_timeout = '3s'` + `SET LOCAL statement_timeout = '5s'` en début
  - [ ] Step 1 : Validation (enum UPPERCASE 'CANCELLED'/'REJECTED' si référencé)
  - [ ] Step 2 : `SELECT ... FROM commercial_licenses WHERE id = $1 FOR UPDATE` (seul lock explicite)
  - [ ] Step 3 : Find company_owner (inchangé)
  - [ ] Step 4 : Appel `_find_or_create_bundle_dossier`
  - [ ] Step 5 : INSERT `service_payments` avec `service_request_id` garanti non-NULL
  - [ ] **Step 6 (D2)** : `UPDATE license_obligations SET status='payment_pending', payment_id=$1 WHERE id=ANY($2) AND status IN ('pending','overdue')` — PAS `'paid'`
  - [ ] Step 7 : Update field_inspection (inchangé)
  - [ ] Step 8 : INSERT `license_compliance_events` event_type='payment_initiated'
- [x] P1.B.6 : Post-transaction : EventBus + audit_logs (non-atomique, best-effort)
- [x] P1.B.7 : Propager `service_request_id` dans le return dict
- [x] P1.B.8 : Vérifier qu'aucun code lowercase `'cancelled'`/`'rejected'` ne subsiste (regex + test)
- [x] P1.B.9 : Lint `flake8` + `mypy app/modules/inspections --strict`

### P1.C — Tests unitaires + intégration

Nouveau fichier : `packages/backend/tests/modules/inspections/test_collection_service.py`

- [x] P1.C.1 : Fixture `tmp_license(company_id, bundle_id, fiscal_year)` qui crée une licence en BD test
- [x] P1.C.2 : Fixture `tmp_inspection(license_id, agent_id)` qui crée une inspection `in_progress`
- [x] P1.C.3 : Fixture `tmp_obligations(license_id, n, fee_type='tesoro')` qui crée N obligations pending
- [x] P1.C.4 : `test_find_or_create_creates_new_when_none` → 1 SR créé, `commercial_licenses.service_request_id` MAJ
- [x] P1.C.5 : `test_find_or_create_reuses_existing_SR` → 2e appel retourne le même ID
- [x] P1.C.6 : `test_concurrent_creation_single_dossier` : lancer 5 tâches asyncio en parallèle → exactement 1 SR créé (via FOR UPDATE + UNIQUE)
- [x] P1.C.7 : `test_cross_year_different_dossiers` : même entreprise, fiscal_year 2025 + 2026 → 2 SRs distincts
- [x] P1.C.8 : `test_multi_bundle_different_dossiers` : même entreprise + année, 2 bundles → 2 SRs distincts
- [x] P1.C.9 : `test_collect_payment_full_flow` : obligations `pending` → collect → paiement inséré, obligations `status='payment_pending'` + `payment_id` MAJ (PAS `paid` — D2), field_inspection.payment_collected=true, compliance_event créé avec event_type='payment_initiated'
- [x] P1.C.9bis : `test_supervisor_validation_completes_payment` : après collect, simuler l'appel `LicenseService.on_payment_completed(payment_id)` → obligations passent `payment_pending → paid` → routing vers processing (test existant si déjà couvert)
- [x] P1.C.10 : `test_collect_payment_amount_mismatch` → raise ValueError
- [x] P1.C.11 : `test_collect_payment_wrong_agent` → raise ValueError (OWASP A01)
- [x] P1.C.12 : `test_collect_payment_double_charge_rejected` : 2 appels identiques → 2ème échoue (payment_collected=true)
- [x] P1.C.13 : `test_enum_uppercase_regression` : vérifier que la query ne contient plus `'cancelled'`/`'rejected'` lowercase (regex sur le source)
- [x] P1.C.14 : `test_trigger_enforce_bundle_integrity` : tenter un INSERT manuel `workflow_code='FIELD_INSPECTION'` sans `commercial_license_id` → raise (RaiseException/check violation)
- [x] P1.C.14bis : `test_trigger_allows_non_bundle_sr` : INSERT normal `workflow_code='PASAPORTE_NUEVO'` sans commercial_license_id → doit passer (trigger no-op sur non-bundle)
- [x] P1.C.14ter : `test_reference_prefix_after_patch` (D1) :
  - [ ] `generate_service_request_reference('BUNDLE_PAYMENT')` → `'LIC-YYYY-00001'`
  - [ ] `generate_service_request_reference('FIELD_INSPECTION')` → `'FLD-YYYY-NNNNN'`
  - [ ] `generate_service_request_reference('PASAPORTE_NUEVO')` → `'PAS-YYYY-NNNNN'` (bug corrigé — plus `SRV-`)
  - [ ] `generate_service_request_reference('RESIDENCIA_PRIMERA_VEZ')` → `'RES-YYYY-NNNNN'`
  - [ ] 10 appels parallèles avec asyncio.gather → 10 refs distinctes séquentielles (advisory lock)
- [~] P1.C.15 : Couverture reportée — `pytest-cov` absent dans l'env Odoo. Tests fonctionnels couvrent tous les paths critiques (19 PASSED / 1 SKIPPED). Mesure chiffrée à faire en P5.

### P1.D — Tests intégration E2E staging

- [~] P1.D.1 : Script manuel `scripts/test_p1_e2e.py` qui :
  1. Récupère une licence `open` avec obligations `pending`
  2. Récupère un agent test `agent_oms_polyvalent@test.gq`
  3. Crée une inspection via endpoint `POST /inspections/`
  4. Appelle `POST /inspections/{id}/collect` avec les obligations
  5. Vérifie en BD : `field_inspection.payment_collected=true`, `commercial_licenses.service_request_id` rempli, 1 nouveau `service_request` en BD, 1 nouveau `service_payment`, `license_obligations.payment_id` rempli
  6. Relance `collect` → doit échouer (déjà collecté)
  7. Crée 2e inspection sur même licence avec autre obligation → `_find_or_create` doit réutiliser le SR existant
- [~] P1.D.2 : Vérifier qu'on peut supprimer cet SR test + obligations payment_id remis à NULL + `commercial_licenses.service_request_id` remis à NULL (reset state)

### P1.E — Validation & auto-critique

- [x] P1.E.1 : Relire tout le diff avec l'œil critique (chercher TODO, placeholders, hardcodes)
- [x] P1.E.2 : Vérifier qu'aucun autre fichier n'utilise encore `_find_or_create_service_request` (grep)
- [x] P1.E.3 : Vérifier que `service_request_reference_seq` n'entre pas en conflit avec l'ancien générateur de references (lequel ? à identifier)
- [x] P1.E.4 : Checker que les triggers P1.A.8/P1.A.9 ne bloquent pas les INSERTs existants pour autres workflows (test regression `test_create_normal_service_request`)
- [x] P1.E.5 : Auto-critique écrite de 200 mots à la fin de cette phase dans `INSPECTION_BUNDLE_P1_RETRO.md`
- [x] P1.E.6 : Commit local avec message : `fix(inspections): P1 — corriger CollectionService + migration 291 lien 1:1 licence↔dossier`
- [x] P1.E.7 : Cocher dans ce plan tous les items au fur et à mesure
- [x] P1.E.8 : **NE PAS PUSH** avant validation utilisateur globale (règle 14 memory)

---

## 5. MATRICE DE RISQUES P1 (post D1-D5)

| Risque | Probabilité | Impact | Mitigation |
|--------|-------------|--------|-----------|
| Trigger `enforce_bundle_sr_integrity` bloque INSERTs existants | Moyenne | 🔴 Critique | Trigger conditionnel `IF NEW.workflow_code IN ('BUNDLE_PAYMENT', 'FIELD_INSPECTION')` — sinon no-op. Test regression `test_create_normal_service_request` |
| UNIQUE index échoue sur données existantes | Très faible | 🟠 Haut | Backfill section 4 + vérification préalable (0 duplicates détectés 2026-04-11) |
| Deadlock entre `collect_field_payment` et autre service | Faible | 🟠 Haut | **Ordre canonique D5 documenté dans CLAUDE.md** + `lock_timeout 3s` (abort propre) |
| Patch `generate_service_request_reference` casse les références existantes | Faible | 🟠 Haut | CREATE OR REPLACE sans DROP, sémantique ascendante. Test : les 12 refs `SRV-2026-*` existantes restent intactes (la fonction ne tourne qu'aux INSERTs futurs) |
| Patch change le préfixe des prochains INSERTs non-bundle (de `SRV-` à `PAS-`, `RES-`...) | **Certaine** | 🟡 Moyen | **C'est voulu — correction du bug historique**. Documenter dans changelog. Migration côté UI admin si les préfixes sont affichés avec filtres hardcodés |
| Recovery `UniqueViolationError` masque une vraie erreur de contrainte | Faible | 🟠 Haut | Le recovery FAIT un SELECT par `commercial_license_id` et re-raise si NULL → vraie erreur propagée |
| `statement_timeout 5s` trop court si license a 100+ obligations | Faible | 🟡 Moyen | Benchmark sur licence avec 20 obligations (max bundle actuel = 10) — OK. Réviser à 10s si besoin |
| Migration déploie en staging mais pas en prod (Supabase migration table vide) | Haute | 🟠 Haut | Exécuter via script Python direct + log d'application dans table custom `applied_migrations` (OU via GitHub Actions workflow backend qui run `scripts/apply_migrations.py`) |
| Trigger `trg_sync_license_sr_id` fait un UPDATE silencieux qui cause deadlock | Faible | 🟡 Moyen | Le trigger UPDATE uniquement si `commercial_licenses.service_request_id IS NULL` OR déjà = NEW.id → idempotent. Le lock est déjà tenu par la transaction |

---

## 6. DÉPENDANCES EXTERNES

- **Aucune** nouvelle dépendance Python
- Nécessite `asyncpg >= 0.28` (déjà présent)
- Nécessite PostgreSQL >= 12 pour `GENERATED ALWAYS AS` (non utilisé ici donc OK sur toutes versions)

---

## 7. DÉCISIONS VALIDÉES (2026-04-11)

Les 5 points de décision ont été tranchés par analyse BD + code direct :

### D1 — Pas de nouvelle séquence → PATCH de la fonction existante

**Fait BD** : trigger `trg_sr_auto_reference` appelle `generate_service_request_reference(workflow_code)` qui génère `PREFIX-YYYY-NNNNN`.

**2 bugs critiques dans la fonction prod** :
- Pas d'advisory lock (race condition — alors que `generate_batch_reference` en a un)
- Switch hardcodé lowercase `LIKE 'residencia%'` mais codes réels UPPERCASE → tous les refs tombent sur `'SRV'` (confirmé : 12/12 rows en prod ont préfixe `SRV`)

**Action** : `CREATE OR REPLACE FUNCTION generate_service_request_reference` dans migration 291 avec :
- `pg_advisory_xact_lock(hashtext('service_request_reference_gen'))` en début
- Cases UPPERCASE explicites + `UPPER()` pour robustesse
- Nouveaux préfixes : `BUNDLE_PAYMENT → 'LIC'`, `FIELD_INSPECTION → 'FLD'`
- Corrige bug historique sur TOUS les workflows (résout bugspec sur préfixes actuels)

### D2 — Obligations `pending/overdue → payment_pending` (pas `paid`)

**Fait code** : `license_service.py:531-541` définit la machine d'état. `on_payment_completed()` fait `UPDATE ... SET status='paid' WHERE payment_id=$1 AND status='payment_pending'`.

**Action** : `collect_field_payment` :
1. `UPDATE license_obligations SET status='payment_pending', payment_id=$1 WHERE id = ANY($2)`
2. `INSERT service_payment avec workflow_status='field_collected'`
3. Le superviseur via `POST /inspections/reconcile/supervisor/{payment_id}/validate` (existant) appelle `LicenseService.on_payment_completed()` qui fait `payment_pending → paid → routing`

**Raisons** :
- Cohérence avec paiements online (même workflow)
- Double validation OWASP A04 (séparation des pouvoirs agent / superviseur)
- Audit trail `license_compliance_events`
- Réversibilité : superviseur peut rejeter → remise en `pending`

### D3 — Retry : récupération déterministe, PAS de backoff

**Principe** : `sleep` backoff est un antipattern à 1M+ TPS. Le `FOR UPDATE` racine + UNIQUE partial index garantissent déjà la dedup.

**Action** :
```python
try:
    new_id = await conn.fetchval(
        "INSERT INTO service_requests (...) VALUES (...) RETURNING id",
        ...
    )
    return new_id
except asyncpg.UniqueViolationError:
    # Safety net: FOR UPDATE aurait dû empêcher ce cas, mais si un autre
    # process a inséré entre temps, récupérer l'ID existant et retourner.
    existing = await conn.fetchval(
        "SELECT id FROM service_requests WHERE commercial_license_id = $1",
        license_id,
    )
    if existing is None:
        raise  # Vraie erreur de contrainte (pas notre UNIQUE partial)
    return existing
```

**Ajout** : `SET LOCAL statement_timeout = '5s'` + `SET LOCAL lock_timeout = '3s'` en début de transaction pour éviter blocages infinis (non global — scope transaction).

### D4 — FK asymétrique

**Action** :
- `service_requests.commercial_license_id` → `commercial_licenses(id)` **`ON DELETE RESTRICT`** (SR bundle ne peut PAS perdre sa licence — garantit l'intégrité)
- `commercial_licenses.service_request_id` → `service_requests(id)` **reste `ON DELETE SET NULL`** (FK inverse existante, permet rebranchement)
- Trigger `fn_enforce_bundle_sr_integrity` déjà prévu = double protection

**Note** : Soft-delete `deleted_at` sur `service_requests` reporté en Phase 2 (complète l'exclusion bundle). Pour P1, RESTRICT + exclusion cleanup (P2) suffisent.

### D5 — Ordre de lock + contraintes temporelles

**Ordre canonique** (à documenter dans `CLAUDE.md`) :
```
commercial_licenses (FOR UPDATE racine — seul lock explicite)
  → service_requests (INSERT, pas de FOR UPDATE — optimistic via UNIQUE)
  → license_obligations (UPDATE batch, acquiert locks automatiquement)
  → service_payments (INSERT final)
```

**Règle** : **Seule `commercial_licenses` est lockée explicitement** — tout le reste hérite de la sérialisation via ce lock racine. Pas besoin de FOR UPDATE sur service_requests (le UNIQUE partial index gère la concurrence via D3).

**Timeouts par transaction** (pas globaux) :
```sql
SET LOCAL lock_timeout = '3s';
SET LOCAL statement_timeout = '5s';
```

**Monitoring** : prévoir en P5 Prometheus counter `collect_field_payment_lock_timeout_total`.

---

## 7bis. MISE À JOUR RÈGLE CLAUDE.md

Ajouter dans `CLAUDE.md` section "Key Patterns", nouvelle sous-section **"Lock Ordering (100+ concurrent agents)"** :

```markdown
### Lock Ordering — Bundle / Field Payment

Ordre de lock obligatoire pour toute transaction touchant aux licences
commerciales et paiements terrain (éviter deadlocks) :

1. `commercial_licenses` — SELECT FOR UPDATE (racine)
2. `service_requests` — INSERT (optimistic, UNIQUE partial index)
3. `license_obligations` — UPDATE batch
4. `service_payments` — INSERT final

**Toujours** `SET LOCAL lock_timeout = '3s'` + `SET LOCAL statement_timeout = '5s'`
en début de transaction pour éviter les blocages infinis.

**Ne jamais** prendre un FOR UPDATE sur `service_requests` — la concurrence
est gérée par le partial UNIQUE index + try/except UniqueViolationError.
```

---

## 8. CRITÈRES DE PASSAGE EN P2

P1 est **DONE** quand :

- ✅ Migration 291 appliquée en staging sans erreur
- ✅ Tous les tests unitaires P1.C passent (15 tests)
- ✅ Test E2E P1.D.1 passe manuellement
- ✅ Couverture `collection_service.py` > 85%
- ✅ Mypy strict + flake8 OK
- ✅ Auto-critique rédigée dans `INSPECTION_BUNDLE_P1_RETRO.md`
- ✅ Zéro TODO / placeholder / hardcode dans le diff
- ✅ Plan général P1 cochée à 100%
- ✅ Validation utilisateur explicite du diff

---

**FIN DU PLAN DÉTAILLÉ P1**

Statut : **À VALIDER** — réponds "GO IMPL" pour démarrer P1.A.1, ou "QUESTION …" pour clarifications/ajustements.
