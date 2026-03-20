# Design Bundle Workflow — Flux de données complet

## Date : 2026-03-20
## Statut : VALIDÉ
## Contexte : Schéma détaillé table × champ × étape pour BUNDLE_PAYMENT

---

## WORKFLOW CODE : `BUNDLE_PAYMENT`

Pattern : REGIME_ACTION (cohérent avec les codes internes existants).
Le user-facing est dans `service_name_es` = "Pago de Obligaciones Fiscales".

---

## AUDIT VÉRIFIÉ — État de l'existant

### Ce qui EXISTE (vérifié BD directe)

| Composant | BD | Python enum | Notes |
|---|---|---|---|
| Entité `TESORO` | `entities` table, is_active=true | **PAS dans `EntityCode`** | `workflow_codes = []` |
| Entité `AYUNTAMIENTO` | `entities` table, is_active=true | PAS dans enum | `workflow_codes = []` |
| Entité `CAMARA_COMERCIO` | `entities` table, is_active=true | PAS dans enum | `workflow_codes = []` |
| `service_payments.fee_type` | varchar, nullable | N/A | Marqueur OMS (non-null = OMS) |
| `service_payments.company_id` | uuid, nullable | N/A | Lien vers company |
| `license_obligations.payment_id` | uuid FK → service_payments | N/A | Lien obligation→paiement |
| `commercial_licenses.service_request_id` | uuid FK | N/A | Lien licence→request |
| `commercial_licenses.processing_mode` | varchar | N/A | `per_line` / `consolidated` |
| Catégorie `COMERCIO` | N/A | `WorkflowCategory` enum | Existe, pas besoin de FISCAL |
| Roles agents (agent_tesoro, etc.) | `roles` table | N/A | Avec `company.view` |
| 20 entités BD | `entities` table | Seulement 8 dans Python enum | Gap de 12 entités |

### Ce qui MANQUE

| Composant | Action requise |
|---|---|
| `WorkflowCode.BUNDLE_PAYMENT` | Ajouter dans enum Python |
| `EntityCode.TESORO` | Ajouter dans enum Python (BD existe déjà) |
| `entities.workflow_codes` pour TESORO | Ajouter `["BUNDLE_PAYMENT"]` via migration |
| Rôles citizen/business n'ont PAS `company.view` | Endpoint dédié `/bundle-workflow/search-company` |
| ObligationRoutingService municipal/chamber → "completed" | Corriger → "processing" (Addendum 3) |

---

## FLUX COMPLET — Chaque table × champ × étape

### STEP 0 : IDENTIFICATION ENTREPRISE

**Action** : Chercher ou sélectionner l'entreprise

#### "Mis empresas" (au mount)

```
READ companies c
  → c.id, c.legal_name, c.tax_id, c.nif,
    c.registration_number, c.regimen_fiscal,
    c.commerce_type, c.zone_id, c.city_id,
    c.is_active, c.is_verified

JOIN user_company_roles ucr
  → ucr.user_id = current_user (filtre mes entreprises)
  → ucr.role (owner/admin/accountant/member)

LEFT JOIN commercial_licenses cl
  → cl.company_id, cl.fiscal_year = 2026, cl.status

LEFT JOIN license_obligations lo
  → COUNT(lo.id) WHERE lo.status IN ('pending','overdue')
  → pending_count pour badge "3 obligaciones pendientes"

FILTRE: c.is_active = true
TRI: pending_count DESC, c.updated_at DESC
LIMIT: 5
```

#### Recherche (quand user tape)

```
READ companies c (endpoint dédié, PAS admin search)
  → WHERE (c.legal_name ILIKE $1
          OR c.tax_id ILIKE $1
          OR c.nif ILIKE $1
          OR c.registration_number ILIKE $1)
    AND c.is_active = true
    AND c.regimen_fiscal = 'bundle'

READ user_company_roles ucr (optionnel)
  → Pour badge "registrada por otro usuario"
  → ucr.user_id != current_user → tiers
```

**OUTPUT** → `company_id` (stocké en mémoire wizard, PAS en BD)

---

### STEP 1 : UPLOAD CERTIFICADO (conditionnel : nouvelle entreprise)

**Action** : Extraire → Créer company → Classifier → Résoudre zone

#### 1a. Upload + Extraction

```
GeminiDocumentProcessor.process(
  content = bytes du fichier,
  document_code = "certificado_padron",
  extraction_schema_key = "CERTIFICADO_ACTUALIZACION_PADRON_EMPRESARIAL_GQ_V1"
)
  → extraction = {
      "empresa.numero_registro": "PE-001234",
      "empresa.denominacion_comercial": "Tienda El Sol",
      "ubicacion.localidad": "Malabo",
      "ubicacion.provincia": "BIOKO-NORTE",
      "actividad.objeto_social": "Venta alimenticios",
      "certificacion.estado_negocio": "Negocio Activo",
    }
```

#### 1b. Vérifier doublon (PE-XXXX existe en BD?)

```
READ companies WHERE registration_number = 'PE-001234'
  SI TROUVÉ → utiliser l'existante → company_id = existant.id → STEP 2
  SI PAS TROUVÉ → continuer 1c
```

#### 1c. Mapper + Créer company

```
map_gemini_extraction_to_company_data(extraction)
  → company_data = {legal_name, registration_number, forma_juridica,
     sector_actividad, objeto_social, localidad, provincia}

INSERT companies (via CompanyRepository.create())
  → c.id (UUID), tous champs company_data

INSERT user_company_roles
  → user_id = current_user, company_id = c.id, role = 'company_owner'
```

#### 1d. Classification automatique

```
ClassificationAgent.classify_company(conn, company_data)
  Règle R2b: autonomo + PE-XXXX → ALWAYS bundle (conf 0.95)
    → regimen_fiscal = "bundle"
    → commerce_type = "abaceria" (LLM inféré du objeto_social)

Zone resolution:
  READ cities WHERE name ILIKE localidad → city_id
  READ commerce_zones WHERE city_id matches → zone_id, zone_code

UPDATE companies SET regimen_fiscal, commerce_type, zone_id, city_id

INSERT company_classification_history
  → company_id, regimen_fiscal, confidence, rules_applied
```

**OUTPUT** → `company_id` (créé ou existant)

---

### STEP 2 : REVUE DES OBLIGATIONS

**Action** : Trouver/créer licence → Afficher obligations → Mode A/B

#### 2a. Vérifier/Créer licence

```
READ commercial_licenses
  WHERE company_id = $1 AND fiscal_year = 2026

CAS 1: EXISTS, status='complete' → Message "Déjà payé" → FIN
CAS 2: EXISTS, status='open'|'partial'|'overdue' → Utiliser existante
CAS 3: NOT EXISTS → Résoudre bundle + open_license()
```

#### open_license() (CAS 3)

```
READ service_bundles WHERE commerce_type = company.commerce_type → bundle_id

LicenseService.open_license(conn, {company_id, bundle_id, zone_id, city_id, fiscal_year})

  INSERT commercial_licenses
    → id, company_id, bundle_id, zone_id, fiscal_year,
      total_amount (calculé), obligations_total, status='open', deadline

  INSERT license_obligations (batch, 1 par bundle_item)
    → id, license_id, bundle_item_id, fiscal_service_id,
      ministry_id, fee_type, amount, due_date,
      penalty_config (snapshot), deadline_config, status='pending'

  INSERT license_compliance_events (batch)
    → 'license_created' + N × 'obligation_created'
```

#### 2b. Afficher obligations + Sélection mode

```
READ license_obligations lo
JOIN fiscal_services fs ON lo.fiscal_service_id = fs.id
JOIN ministries m ON lo.ministry_id = m.id
  → Groupés par fee_type (TESORO / AYUNTAMIENTO / CÁMARA)
  → Champs: lo.id, fs.name, lo.fee_type, m.name, lo.amount,
    lo.penalty_amount, lo.status, lo.due_date, lo.paid_at

USER CHOISIT:
  → processing_mode: 'per_line' ou 'consolidated'
  → selected_obligation_ids[] (Mode A seulement)
```

**OUTPUT** → `license_id, processing_mode, selected_obligation_ids`

---

### STEP 3 : PAIEMENT (TRANSACTION ATOMIQUE)

**Action** : Créer service_request + service_payment + lier obligations

#### 3a. Créer le dossier

```
INSERT service_requests
  → id, user_id, workflow_code='BUNDLE_PAYMENT', status='SUBMITTED',
    entity_code='TESORO', reference_number='BDL-2026-XXXXX',
    metadata={company_id, license_id, processing_mode}

UPDATE commercial_licenses SET
  → service_request_id = request.id
  → processing_mode = choisi
```

#### 3b. Créer le paiement (1 SEUL service_payment)

```
INSERT service_payments
  → id, service_request_id, user_id, company_id
  → fee_type = 'bundle'           ← MARQUEUR OMS (non-null)
  → payment_method = 'mobile_money' | 'cash'
  → total_amount = somme obligations sélectionnées
  → currency = 'XAF'
  → calculation_details = {
      obligations: [{id, name, fee_type, amount}...],
      processing_mode, license_id
    }
  → payment_reference = 'SR-20260320...'

SI mobile_money:
  → status='processing', workflow_status='submitted'
  → requires_agent_validation = false
  → Appel BANGE API → redirect_url

SI cash:
  → status='pending', workflow_status='pending_agent_review'
  → requires_agent_validation = true
```

#### 3c. Lier obligations au paiement

```
UPDATE license_obligations SET
  payment_id = service_payment.id,
  status = 'payment_pending'
WHERE id IN (selected_obligation_ids)
  AND status IN ('pending', 'overdue')     ← RACE PROTECTION
RETURNING id

★ Si RETURNING count < expected → ROLLBACK (race condition)

INSERT license_compliance_events (batch)
  → 'payment_initiated', {payment_id, amount, method}
```

**OUTPUT** :
- mobile_money → `redirect_url` (BANGE)
- cash → `payment_reference` → Step 4

---

### STEP 4 : CONFIRMATION (frontend seulement)

```
READ service_payments → référence, montant, statut
READ license_obligations → statut de chaque obligation
READ commercial_licenses → statut licence

Affichage: résumé + "un agente validará su pago" + PDF download
```

---

## POST-PAIEMENT (ASYNCHRONE — hors wizard)

### Événement : Paiement validé

Déclencheur : BANGE webhook callback OU agent Tesoro valide cash

#### A. Détection OMS

```
LicenseService.on_payment_completed(conn, payment_id)

READ service_payments WHERE id = payment_id
  → fee_type = 'bundle' (non-null → C'EST un OMS)
  → SI fee_type IS NULL → pas OMS, exit

READ license_obligations
  WHERE payment_id = payment_id AND status = 'payment_pending'
```

#### B. Mise à jour obligations → paid

```
UPDATE license_obligations SET status = 'paid'
  WHERE payment_id = $1 AND status = 'payment_pending'
  RETURNING *  (idempotent)
```

#### C. Routage par obligation

```
ObligationRoutingService.route_paid_obligations(conn, obligations, license_row, user_id)

POUR CHAQUE obligation:

1. resolve_target_status(obligation.fee_type)
   ┌──────────────────────────────────────────┐
   │ fee_type     │ CORRIGÉ (Addendum 3)      │
   │──────────────│───────────────────────────│
   │ 'tesoro'     │ 'processing'              │
   │ 'municipal'  │ 'processing' ★ (corrigé)  │
   │ 'chamber'    │ 'processing' ★ (corrigé)  │
   └──────────────────────────────────────────┘

2. resolve_target_entity(conn, obligation, license_row)
   ┌──────────────────────────────────────────────────┐
   │ fee_type   │ Mode A (per_line)  │ Mode B (consol.)│
   │────────────│────────────────────│─────────────────│
   │ 'tesoro'   │ MIN_HACIENDA ou    │ TESORO          │
   │            │ MIN_COMERCIO etc.  │ (polyvalent)    │
   │ 'municipal'│ AYUNTAMIENTO       │ AYUNTAMIENTO    │
   │ 'chamber'  │ CAMARA_COMERCIO    │ CAMARA_COMERCIO │
   └──────────────────────────────────────────────────┘

3. UPDATE license_obligations SET status = 'processing'
4. INSERT assignments → agent de l'entité cible
5. INSERT license_compliance_events → 'obligation_routed'
```

#### D. Mise à jour compteurs licence

```
LicenseService.update_license_counters(conn, license_id)

UPDATE commercial_licenses SET
  obligations_paid, amount_paid, status, completed_at
```

### Événement : Agent traite l'obligation

```
UPDATE license_obligations SET status = 'completed', issued_document_id
INSERT license_compliance_events → 'agent_approved'
LicenseService.update_license_counters(...)
  → Si toutes completed → license.status='complete' → PDF + email citoyen
```

---

## TABLES PAR ÉTAPE (résumé)

| Table | Step 0 | Step 1 | Step 2 | Step 3 | Post-paiement |
|-------|--------|--------|--------|--------|---------------|
| `companies` | READ | INSERT/READ | READ | - | - |
| `user_company_roles` | READ | INSERT | - | - | - |
| `commercial_licenses` | READ | - | READ/INSERT | UPDATE | UPDATE |
| `license_obligations` | READ | - | READ/INSERT | UPDATE | UPDATE |
| `license_compliance_events` | - | - | INSERT | INSERT | INSERT |
| `service_requests` | - | - | - | INSERT | READ |
| `service_payments` | - | - | - | INSERT | READ/UPDATE |
| `company_classification_history` | - | INSERT | - | - | - |
| `service_bundles` | - | - | READ | - | - |
| `service_bundle_items` | - | - | READ | - | - |
| `commerce_zones` | - | READ | READ | - | - |
| `assignments` | - | - | - | - | INSERT |

---

## POINT CLÉ : Pourquoi 1 seul service_payment

Le user fait 1 action (1 tap BANGE, 1 visite agence). Créer N payments = N redirections BANGE = impossible UX.

Le routage multi-entités se fait APRÈS validation, au niveau des OBLIGATIONS (chaque obligation a son propre `fee_type`). `service_payments.fee_type = 'bundle'` est un MARQUEUR pour `on_payment_completed()` — il détecte "c'est un OMS" et itère les obligations liées via `license_obligations.payment_id`.

### Résumé discriminants

| Champ | Rôle | Valeurs |
|-------|------|---------|
| `service_payments.fee_type` | Marqueur OMS | `'bundle'` (non-null = OMS) |
| `service_payments.company_id` | Lien entreprise | UUID de la company |
| `license_obligations.fee_type` | Routage entité | `'tesoro'`, `'municipal'`, `'chamber'` |
| `license_obligations.payment_id` | Lien obligation→paiement | FK vers service_payments |
| `commercial_licenses.processing_mode` | Mode A/B | `'per_line'`, `'consolidated'` |
| `commercial_licenses.service_request_id` | Lien licence→dossier | FK vers service_requests |
