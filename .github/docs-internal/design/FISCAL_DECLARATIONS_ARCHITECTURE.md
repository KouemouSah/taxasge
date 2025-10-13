# 🏛️ Architecture Fiscale Complète - Services vs Déclarations

**Version**: 1.1
**Date**: 2025-10-11
**Expert**: Database & Workflow Architecture
**Status**: ✅ Implémenté (schema_declarations.sql créé)

---

## 📋 Table des Matières

1. [Analyse Critique du Contexte](#1-analyse-critique-du-contexte)
2. [Workflows Redéfinis](#2-workflows-redéfinis)
3. [Gaps Identifiés & Solutions](#3-gaps-identifiés--solutions)
4. [Architecture Database Optimale](#4-architecture-database-optimale)
5. [Schéma Déclarations (schema_declarations.sql)](#5-schéma-déclarations)
6. [Intégration i18n & OCR](#6-intégration-i18n--ocr)
7. [Sécurité & Sessions](#7-sécurité--sessions)
8. [API Design & Testing](#8-api-design--testing)
9. [Installation & Déploiement](#9-installation--déploiement)

---

## 1. Analyse Critique du Contexte

### 1.1 Distinction Fondamentale

Vous avez correctement identifié **2 flux métier distincts**:

| Critère | **FISCAL SERVICE** (Paiement Simple) | **TAX DECLARATION** (Déclaration Complexe) |
|---------|--------------------------------------|-------------------------------------------|
| **Document Source** | Reçu papier pré-rempli par autorité | Formulaire vierge à remplir |
| **Exemple** | Renouvellement passeport (reçu scanné) | Déclaration IVA mensuelle |
| **Workflow** | Scan → OCR → Paiement → Validation agent | Formulaire → Soumission → Validation agent → Paiement → Validation finale |
| **Approbation Avant Paiement** | ❌ NON (paiement direct) | ✅ OUI (dépôt validé d'abord) |
| **Table DB** | `service_payments` | `tax_declarations` + `declaration_payments` |
| **Complexité** | Simple (1-2 étapes) | Complexe (5-8 étapes) |

### 1.2 ⚠️ Problèmes Identifiés dans le Contexte Actuel

#### Problème 1: Confusion Tables `documents` vs `document_templates`

**Votre affirmation**:
> "d'où la necessité de la table document pour gérer ces declaration, elle est différente de la table de document template qui est juste a titre informative."

**❌ ERREUR CONCEPTUELLE**:
- `document_templates` n'est **PAS** "juste informative"
- `document_templates` = Templates de documents **requis** pour un service
- `documents` = Documents **uploadés** par l'utilisateur

**✅ CLARIFICATION**:
```
document_templates (N:M avec fiscal_services)
  ↓
  "Pour le service T-001, vous devez fournir:"
  - Template DOC_1: "Passeport valide"
  - Template DOC_2: "Photo d'identité"

documents (uploadés par user)
  ↓
  "Utilisateur a uploadé:"
  - Document ID=abc123: passeport.pdf (lié à DOC_1)
  - Document ID=def456: photo.jpg (lié à DOC_2)
```

**Relation correcte**:
```sql
documents (
  id,
  user_id,
  document_template_id,  -- ✅ FK vers quel template ce document satisfait
  service_payment_id,     -- ✅ Pour quel paiement
  declaration_id,         -- ✅ Pour quelle déclaration
  ...
)
```

#### Problème 2: Workflow Agents Incomplet

**Manque identifié**:
- ❌ Pas de gestion des **sessions agents** (multi-onglets, déconnexion forcée)
- ❌ Pas de **queue de priorité** pour assignation automatique
- ❌ Pas de **SLA par type de déclaration** (IVA urgent vs autres)
- ❌ Pas de **handover** entre agents (shift, congé)

#### Problème 3: OCR Pipeline Fragmenté

**Votre table `documents`** a:
- `processing_mode`, `ocr_status`, `extraction_status`, `validation_status`, `form_mapping_status`

**❌ PROBLÈME**: 5 états séparés = race conditions

**✅ SOLUTION**: State machine unique
```sql
document_processing_state ENUM (
  'uploaded',              -- Initial
  'ocr_queued',           -- En attente OCR
  'ocr_processing',       -- OCR en cours
  'ocr_completed',        -- OCR terminé
  'extraction_queued',    -- En attente extraction
  'extraction_processing',
  'extraction_completed',
  'validation_pending',   -- User doit valider
  'validation_completed',
  'mapping_queued',       -- Auto-fill form
  'mapping_completed',
  'failed',               -- Erreur permanente
  'retry'                 -- Retry automatique
)
```

#### Problème 4: Intégration Bancaire Non Définie

**Votre description**:
> "il clique sur le bouton paiement, choisi le mode, la banque et le numero de compte de la banque choisi se charge automatiquement"

**❌ MANQUE**:
- Comment gérer **5 banques** (BANGE, BGFI, CCEI, SGBGE, ECOBANK)?
- **Webhook callbacks** bancaires?
- **Idempotence** paiements (retry si timeout)?
- **Reconciliation** automatique?

---

## 2. Workflows Redéfinis

### 2.1 Workflow A: FISCAL SERVICE (Paiement Simple)

**Cas d'usage**: Renouvellement passeport avec reçu pré-rempli

```
┌─────────────────────────────────────────────────────────────────┐
│ PHASE 1: UPLOAD & OCR (User Side)                              │
└─────────────────────────────────────────────────────────────────┘
1. User sélectionne service fiscal (ex: T-015 "Renouvellement passeport")
   ├─ Système affiche: tarif, documents requis (document_templates)
   └─ User voit: "Veuillez scanner le reçu pré-rempli par l'autorité"

2. User upload reçu scanné (IMG-20251001-WA0000.jpg)
   ├─ Création: documents.id = UUID
   │  - document_type = 'official_receipt'
   │  - fiscal_service_code = 'T-015'
   │  - processing_state = 'uploaded'
   └─ Trigger: OCR pipeline

3. OCR Automatique (Tesseract / Cloud Vision)
   ├─ État: 'ocr_processing'
   ├─ Extraction:
   │  - Numéro reçu: "N° 1.804/20"
   │  - Montant: "102.000 F.Cfa"
   │  - Date: "Prés 2025"
   │  - Concept: "Renovación de referencia para el periodo de 10 meses"
   ├─ Confiance: ocr_confidence = 0.87
   └─ État: 'ocr_completed'

4. Extraction Structurée (AI/Regex)
   ├─ État: 'extraction_processing'
   ├─ extracted_data = {
   │    "receipt_number": "1.804/20",
   │    "amount": 102000,
   │    "currency": "XAF",
   │    "period_months": 10,
   │    "service_description": "Renovación de referencia"
   │  }
   └─ État: 'extraction_completed'

5. Validation Utilisateur (UI)
   ├─ Affichage données extraites
   ├─ User corrige si nécessaire (user_corrections JSONB)
   └─ État: 'validation_completed'

┌─────────────────────────────────────────────────────────────────┐
│ PHASE 2: PAIEMENT DIRECT (Pas d'approbation avant paiement)    │
└─────────────────────────────────────────────────────────────────┘
6. Création Payment Record
   ├─ INSERT INTO service_payments (
   │    fiscal_service_code = 'T-015',
   │    total_amount = 102000,
   │    workflow_status = 'payment_pending',  -- Pas 'submitted'
   │    requires_agent_validation = false     -- ✅ Validation APRÈS paiement
   │  )
   └─ État: 'payment_pending'

7. Sélection Mode Paiement (UI)
   ├─ User choisit: banque = 'BANGE'
   ├─ Système affiche: compte BANGE "37100036801-37" (pré-configuré)
   └─ User saisit: numéro carte, PIN, etc.

8. Intégration Bancaire (API)
   ├─ POST /api/v1/payments/initiate-bank-payment
   ├─ Payload: {
   │    payment_id: UUID,
   │    bank: 'BANGE',
   │    method: 'card',
   │    card_details: {...}
   │  }
   ├─ Appel API BANGE (externe)
   ├─ Réponse: transaction_id = "BANGE-TXN-12345"
   └─ État: 'processing'

9. Webhook Bancaire (Callback Async)
   ├─ POST /api/webhooks/bank-payment-confirmation
   ├─ Payload: {
   │    transaction_id: "BANGE-TXN-12345",
   │    status: "success",
   │    paid_at: "2025-10-11T10:30:00Z"
   │  }
   ├─ UPDATE service_payments SET
   │    status = 'paid',
   │    workflow_status = 'pending_agent_review',  -- ✅ Validation APRÈS
   │    bange_transaction_id = "BANGE-TXN-12345",
   │    paid_at = NOW()
   └─ Génération reçu provisoire PDF

10. Email Automatique (Background Job)
    ├─ Template: "Paiement confirmé - En attente validation agent"
    ├─ Attachments: reçu_provisoire.pdf
    └─ User Dashboard: statut "Payé - En validation"

┌─────────────────────────────────────────────────────────────────┐
│ PHASE 3: VALIDATION AGENT (Après Paiement)                     │
└─────────────────────────────────────────────────────────────────┘
11. Dashboard Agent (Auto-refresh)
    ├─ Vue: agent_payments_dashboard (materialized view)
    ├─ Filtre: workflow_status = 'pending_agent_review'
    ├─ Tri: priority_order ASC (montant élevé, SLA urgent)
    └─ Agent voit: nouveau paiement T-015

12. Lock Payment (Pessimistic)
    ├─ Fonction: lock_payment_for_agent(payment_id, agent_id)
    ├─ UPDATE service_payments SET
    │    locked_by_agent_id = 123,
    │    locked_at = NOW(),
    │    lock_expires_at = NOW() + INTERVAL '30 minutes',
    │    workflow_status = 'locked_by_agent'
    └─ Autre agents: voient "Verrouillé par Agent X"

13. Vérification Agent
    ├─ Agent examine:
    │  - Reçu scanné (documents)
    │  - Données extraites (extracted_data)
    │  - Montant payé (total_amount)
    ├─ Actions possibles:
    │  a) APPROUVER → workflow_status = 'approved_by_agent'
    │  b) REJETER → workflow_status = 'rejected_by_agent' (raison)
    │  c) DEMANDER DOCS → workflow_status = 'requires_documents'
    └─ Audit: INSERT INTO payment_validation_audit (...)

14. Clôture & Génération Document Final
    ├─ Si approuvé:
    │  - Génération certificat officiel PDF (avec QR code)
    │  - QR code contient: {
    │      service_code: 'T-015',
    │      payment_id: UUID,
    │      amount: 102000,
    │      validated_at: timestamp,
    │      signature: HMAC
    │    }
    ├─ Email automatique: "Service validé - Document disponible"
    ├─ UPDATE service_payments SET
    │    workflow_status = 'payment_completed',
    │    validated_by_agent_id = 123,
    │    receipt_url = 's3://...'
    └─ Unlock payment (locked_by_agent_id = NULL)

15. Archivage
    ├─ Document final → User dashboard (téléchargeable)
    ├─ Métrique: processing_time = validated_at - created_at
    └─ Statistiques agent: approved_count++
```

**Durée totale**: ~20-45 minutes (avec validation agent)

---

### 2.2 Workflow B: TAX DECLARATION (Déclaration Complexe)

**Cas d'usage**: Déclaration IVA mensuelle (I.V.A.-REAL.pdf)

```
┌─────────────────────────────────────────────────────────────────┐
│ PHASE 1: SOUMISSION DÉCLARATION (User Side)                    │
└─────────────────────────────────────────────────────────────────┘
1. User sélectionne type déclaration
   ├─ Type: 'monthly_vat_standard' (IVA Régime Réel)
   ├─ Période: "Octobre 2025"
   └─ Système affiche: formulaire vierge (I.V.A.-REAL.pdf template)

2. Deux méthodes de remplissage:

   ┌─ MÉTHODE A: Upload Formulaire Scanné ─────────────────────┐
   │ 2a. User upload PDF/image formulaire pré-rempli           │
   │ 2b. OCR + AI Extraction                                   │
   │     ├─ Tesseract: extraction texte brut                   │
   │     ├─ AI (Claude/GPT): parsing structuré                 │
   │     ├─ Reconnaissance champs:                             │
   │     │  - "Base Imponible 01": 1500000                     │
   │     │  - "Tipo 02": 15%                                   │
   │     │  - "Cuota 03": 225000                               │
   │     │  - ...                                              │
   │     └─ extracted_data = {...} (JSONB)                     │
   │ 2c. Auto-fill formulaire web                              │
   │     ├─ form_auto_fill_data = extracted_data              │
   │     ├─ User voit: champs pré-remplis                      │
   │     └─ User corrige si erreurs OCR                        │
   └───────────────────────────────────────────────────────────┘

   ┌─ MÉTHODE B: Remplissage Manuel ───────────────────────────┐
   │ 2a. User remplit formulaire web manuellement              │
   │ 2b. Validation frontend (regex, montants cohérents)       │
   │ 2c. Auto-calculs:                                         │
   │     ├─ Total IVA Devengado = 03 + 06 + 09 + ...          │
   │     ├─ Total a deducir = 022 + 023 + ...                 │
   │     └─ Total a Ingresar = 021 - 028 (si positif)         │
   └───────────────────────────────────────────────────────────┘

3. Attachement Documents Justificatifs
   ├─ Upload: factures, reçus, etc.
   ├─ Chaque document:
   │  - INSERT INTO documents (
   │      declaration_id = UUID,
   │      document_type = 'supporting_invoice',
   │      ...
   │    )
   └─ État: 'uploaded' pour chaque doc

4. Soumission Déclaration
   ├─ INSERT INTO tax_declarations (
   │    user_id,
   │    company_id,
   │    declaration_type = 'monthly_vat_standard',
   │    tax_period = '2025-10',
   │    declaration_data = {...},  -- Toutes les données formulaire
   │    status = 'submitted',
   │    submitted_at = NOW(),
   │    due_date = '2025-11-20'   -- 20 jours après fin mois
   │  )
   └─ Email automatique: "Déclaration soumise - En attente validation"

┌─────────────────────────────────────────────────────────────────┐
│ PHASE 2: VALIDATION AGENT (AVANT Paiement) ✅                  │
└─────────────────────────────────────────────────────────────────┘
5. Dashboard Agent Déclarations
   ├─ Vue: agent_declarations_dashboard (nouvelle vue)
   ├─ Filtre: status = 'submitted', urgent (due_date proche)
   ├─ Tri: due_date ASC, amount DESC
   └─ Agent voit: nouvelle déclaration IVA Octobre 2025

6. Lock Déclaration
   ├─ Fonction: lock_declaration_for_agent(declaration_id, agent_id)
   ├─ UPDATE tax_declarations SET
   │    locked_by_agent_id = 123,
   │    locked_at = NOW(),
   │    lock_expires_at = NOW() + INTERVAL '2 hours',  -- Plus long que paiement
   │    status = 'under_review'
   └─ Transition: 'submitted' → 'under_review'

7. Vérification Déclaration par Agent
   ├─ Agent examine:
   │  a) Cohérence montants (auto-calculs)
   │  b) Documents justificatifs (factures)
   │  c) Historique déclarations (patterns anormaux?)
   │  d) Comparaison période N-1 (variation >30%?)
   ├─ Actions:
   │  a) APPROUVER → status = 'approved'
   │  b) DEMANDER CORRECTIONS → status = 'requires_modification'
   │     └─ Comment: "Veuillez corriger champ 022..."
   │  c) REJETER → status = 'rejected'
   └─ Audit: INSERT INTO declaration_validation_audit (...)

8. Si Corrections Demandées (Loop)
   ├─ User notifié: email + dashboard
   ├─ User corrige déclaration
   ├─ Re-soumission: status = 'resubmitted'
   └─ Retour étape 6 (agent re-valide)

9. Approbation Finale
   ├─ status = 'approved'
   ├─ Calcul montant à payer:
   │  - amount_declared = declaration_data['total_a_ingresar']
   │  - Si négatif: crédit à reporter (pas de paiement)
   │  - Si positif: paiement requis
   └─ ✅ Bouton "Payer" activé (UI)

┌─────────────────────────────────────────────────────────────────┐
│ PHASE 3: PAIEMENT (APRÈS Approbation) ✅                        │
└─────────────────────────────────────────────────────────────────┘
10. Création Payment Record
    ├─ INSERT INTO declaration_payments (
    │    declaration_id = UUID,
    │    amount = 225000,  -- Montant approuvé
    │    payment_method = NULL,  -- User choisit
    │    status = 'pending'
    │  )
    └─ État: 'pending'

11. Sélection Mode Paiement (identique Workflow A)
    ├─ User choisit banque: 'BGFI'
    ├─ Compte BGFI: "00106046001-15" (auto-load)
    └─ Saisie détails paiement

12. Intégration Bancaire (identique Workflow A)
    ├─ API BGFI: initiate payment
    ├─ Transaction ID: "BGFI-TXN-67890"
    └─ État: 'processing'

13. Webhook Bancaire
    ├─ POST /api/webhooks/bank-payment-confirmation
    ├─ UPDATE declaration_payments SET
    │    status = 'paid',
    │    paid_at = NOW(),
    │    bgfi_transaction_id = "BGFI-TXN-67890"
    ├─ UPDATE tax_declarations SET
    │    status = 'paid'
    └─ Email: "Paiement IVA confirmé - En validation finale"

┌─────────────────────────────────────────────────────────────────┐
│ PHASE 4: VALIDATION FINALE & CLÔTURE                           │
└─────────────────────────────────────────────────────────────────┘
14. Dashboard Agent (Paiements Déclarations)
    ├─ Filtre: declaration_payments.status = 'paid'
    ├─ Agent voit: paiement IVA validé par banque
    └─ Vérification: montant payé = montant déclaré ✓

15. Confirmation Paiement par Agent
    ├─ Agent vérifie:
    │  - Transaction bancaire valide
    │  - Montant correct
    │  - Pas de fraude
    ├─ Action: CONFIRMER
    └─ UPDATE declaration_payments SET
         status = 'confirmed',
         confirmed_by_agent_id = 123,
         confirmed_at = NOW()

16. Clôture Déclaration
    ├─ UPDATE tax_declarations SET
    │    status = 'closed',
    │    closed_at = NOW(),
    │    closed_by_agent_id = 123
    ├─ Génération: certificat_iva_octobre_2025.pdf (QR code)
    ├─ Email automatique: "Déclaration IVA clôturée"
    └─ User dashboard: document téléchargeable

17. Reporting Automatique (DGI)
    ├─ Agrégation: toutes déclarations IVA Octobre 2025
    ├─ Export: rapport_iva_octobre_2025.xlsx
    └─ Statistiques:
       - Total collecté: 150M XAF
       - Déclarations: 1250
       - Crédits reportés: 80 entreprises
```

**Durée totale**: 2-5 jours (délais validation agent + paiement user)

---

## 3. Gaps Identifiés & Solutions

### 3.1 GAP: Gestion Sessions Utilisateurs

**Problème actuel**: Aucune table `sessions` dans schema

**❌ Conséquences**:
- User peut être déconnecté pendant paiement (perte données)
- Pas de tracking multi-devices
- Impossible "reprendre là où j'étais"

**✅ SOLUTION**: Table `user_sessions`

```sql
CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Session management
    session_token VARCHAR(255) UNIQUE NOT NULL,
    refresh_token VARCHAR(255) UNIQUE,
    device_id VARCHAR(255),
    device_name VARCHAR(100),

    -- Technical
    ip_address INET,
    user_agent TEXT,
    browser VARCHAR(50),
    os VARCHAR(50),

    -- Security
    is_active BOOLEAN DEFAULT true,
    last_activity_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,

    -- Context preservation (pour "reprendre")
    context_data JSONB DEFAULT '{}',  -- {current_page, form_data, etc.}

    created_at TIMESTAMPTZ DEFAULT NOW(),
    terminated_at TIMESTAMPTZ,
    termination_reason VARCHAR(50),  -- 'logout', 'timeout', 'forced', 'security'

    CONSTRAINT valid_session_duration CHECK (expires_at > created_at)
);

CREATE INDEX idx_sessions_user_active ON user_sessions(user_id, is_active) WHERE is_active = true;
CREATE INDEX idx_sessions_token ON user_sessions(session_token) WHERE is_active = true;
CREATE INDEX idx_sessions_activity ON user_sessions(last_activity_at) WHERE is_active = true;
```

**Usage**:
```python
# Sauvegarde contexte avant paiement
await db.execute("""
    UPDATE user_sessions
    SET context_data = jsonb_set(
        context_data,
        '{payment_draft}',
        $1::jsonb
    )
    WHERE session_token = $2
""", payment_data, session_token)

# Reprise après reconnexion
context = await db.fetchval("""
    SELECT context_data->'payment_draft'
    FROM user_sessions
    WHERE user_id = $1 AND is_active = true
    ORDER BY last_activity_at DESC LIMIT 1
""", user_id)
```

---

### 3.2 GAP: Gestion Queue Agents (Load Balancing)

**Problème actuel**: Assignation manuelle seulement

**❌ Conséquences**:
- Agent A surchargé, Agent B inactif
- Pas de priorisation intelligente
- SLA non respectés

**✅ SOLUTION**: Table `agent_work_queue` + Auto-assignment

```sql
CREATE TABLE agent_work_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Item reference (polymorphic)
    item_type VARCHAR(20) NOT NULL CHECK (item_type IN ('payment', 'declaration')),
    item_id UUID NOT NULL,

    -- Assignment
    assigned_to_agent_id INTEGER REFERENCES ministry_agents(id),
    assigned_at TIMESTAMPTZ,

    -- Priority calculation
    priority_score INTEGER NOT NULL,  -- Calculé automatiquement
    base_priority INTEGER DEFAULT 5,  -- 1=urgent, 10=low

    -- Factors influencing priority
    amount DECIMAL(15,2),
    sla_deadline TIMESTAMPTZ,
    escalation_count INTEGER DEFAULT 0,
    retry_count INTEGER DEFAULT 0,

    -- Status
    queue_status VARCHAR(20) DEFAULT 'pending' CHECK (queue_status IN (
        'pending',      -- En attente assignation
        'assigned',     -- Assigné à agent
        'in_progress',  -- Agent travaille dessus
        'completed',    -- Terminé
        'escalated'     -- Escaladé à superviseur
    )),

    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,

    UNIQUE(item_type, item_id)
);

-- Index pour auto-assignment
CREATE INDEX idx_queue_pending ON agent_work_queue(priority_score DESC, created_at ASC)
    WHERE queue_status = 'pending';

-- Fonction auto-assignment
CREATE OR REPLACE FUNCTION auto_assign_to_available_agent()
RETURNS UUID AS $$
DECLARE
    v_queue_item_id UUID;
    v_agent_id INTEGER;
BEGIN
    -- Trouver agent disponible (moins chargé)
    SELECT id INTO v_agent_id
    FROM ministry_agents ma
    WHERE ma.is_active = true
    AND ma.status = 'available'
    ORDER BY (
        SELECT COUNT(*)
        FROM agent_work_queue awq
        WHERE awq.assigned_to_agent_id = ma.id
        AND awq.queue_status = 'in_progress'
    ) ASC
    LIMIT 1;

    IF v_agent_id IS NULL THEN
        RAISE EXCEPTION 'No available agents';
    END IF;

    -- Assigner item prioritaire
    UPDATE agent_work_queue
    SET assigned_to_agent_id = v_agent_id,
        assigned_at = NOW(),
        queue_status = 'assigned'
    WHERE id = (
        SELECT id FROM agent_work_queue
        WHERE queue_status = 'pending'
        ORDER BY priority_score DESC, created_at ASC
        LIMIT 1
        FOR UPDATE SKIP LOCKED  -- Pessimistic lock
    )
    RETURNING id INTO v_queue_item_id;

    RETURN v_queue_item_id;
END;
$$ LANGUAGE plpgsql;
```

**Calcul priorité automatique**:
```python
def calculate_priority_score(item):
    score = 100  # Base

    # SLA urgent (+50)
    if item.sla_deadline < now() + timedelta(hours=2):
        score += 50

    # Montant élevé (+30)
    if item.amount > 1000000:
        score += 30

    # Déjà escaladé (+40)
    score += item.escalation_count * 40

    # Retry (+20)
    score += item.retry_count * 20

    return score
```

---

### 3.3 GAP: Intégration Bancaire (5 Banques)

**Problème actuel**: Logique paiement non définie

**❌ Conséquences**:
- Duplicate code pour chaque banque
- Pas d'abstraction
- Difficile ajouter nouvelle banque

**✅ SOLUTION**: Pattern Strategy + Bank Adapters

**Architecture**:
```python
# Abstract interface
class BankPaymentAdapter(ABC):
    @abstractmethod
    async def initiate_payment(self, payment_data: dict) -> str:
        """Retourne transaction_id"""
        pass

    @abstractmethod
    async def check_status(self, transaction_id: str) -> PaymentStatus:
        pass

    @abstractmethod
    async def cancel_payment(self, transaction_id: str) -> bool:
        pass

# Implémentations concrètes
class BANGEAdapter(BankPaymentAdapter):
    async def initiate_payment(self, payment_data):
        # API BANGE spécifique
        response = await http.post(
            'https://api.bange.gq/v1/payments',
            headers={'Authorization': f'Bearer {BANGE_API_KEY}'},
            json={
                'account': '37100036801-37',
                'amount': payment_data['amount'],
                'reference': payment_data['payment_id']
            }
        )
        return response.json()['transaction_id']

class BGFIAdapter(BankPaymentAdapter):
    async def initiate_payment(self, payment_data):
        # API BGFI spécifique
        ...

# Factory
class BankAdapterFactory:
    _adapters = {
        'BANGE': BANGEAdapter(),
        'BGFI': BGFIAdapter(),
        'CCEIBANK': CCEIAdapter(),
        'SGBGE': SGBGEAdapter(),
        'ECOBANK': ECOBANKAdapter()
    }

    @classmethod
    def get_adapter(cls, bank_code: str) -> BankPaymentAdapter:
        return cls._adapters[bank_code]

# Usage
adapter = BankAdapterFactory.get_adapter('BANGE')
txn_id = await adapter.initiate_payment({
    'payment_id': payment_id,
    'amount': 102000,
    'currency': 'XAF'
})
```

**Table configuration banques**:
```sql
CREATE TABLE bank_configurations (
    id SERIAL PRIMARY KEY,
    bank_code VARCHAR(20) UNIQUE NOT NULL,
    bank_name VARCHAR(100) NOT NULL,

    -- Compte Trésor Public
    treasury_account VARCHAR(50) NOT NULL,

    -- API config
    api_base_url VARCHAR(255),
    api_key_encrypted TEXT,
    webhook_secret_encrypted TEXT,

    -- Features
    supports_card_payment BOOLEAN DEFAULT true,
    supports_mobile_money BOOLEAN DEFAULT false,
    supports_bank_transfer BOOLEAN DEFAULT true,

    -- SLA
    expected_confirmation_minutes INTEGER DEFAULT 5,
    max_retry_attempts INTEGER DEFAULT 3,

    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed data
INSERT INTO bank_configurations (bank_code, bank_name, treasury_account) VALUES
('BANGE', 'Banco de Guinea Ecuatorial', '37100036801-37'),
('BGFI', 'BGFI Bank', '00106046001-15'),
('CCEIBANK', 'CCEI Bank', '00000161001-22'),
('SGBGE', 'Société Générale', '27110104801-87'),
('ECOBANK', 'Ecobank', '39360000063-01');
```

---

### 3.4 GAP: Idempotence & Retry Logic

**Problème**: Paiement timeout → User retry → Double paiement

**✅ SOLUTION**: Idempotency Keys

```sql
-- Ajout colonne idempotency
ALTER TABLE service_payments ADD COLUMN idempotency_key VARCHAR(255) UNIQUE;
ALTER TABLE declaration_payments ADD COLUMN idempotency_key VARCHAR(255) UNIQUE;

-- API endpoint
POST /api/v1/payments/initiate
Headers:
  Idempotency-Key: <UUID généré côté client>

-- Backend logic
async def initiate_payment(payment_data, idempotency_key):
    # Check existing
    existing = await db.fetchrow(
        "SELECT * FROM service_payments WHERE idempotency_key = $1",
        idempotency_key
    )

    if existing:
        # Return existing payment (pas de duplicate)
        return existing

    # Create new payment
    payment = await db.fetchrow("""
        INSERT INTO service_payments (idempotency_key, ...)
        VALUES ($1, ...)
        RETURNING *
    """, idempotency_key, ...)

    return payment
```

---

### 3.5 GAP: OCR Pipeline Robuste

**Problème actuel**: 5 états séparés, pas de retry automatique

**✅ SOLUTION**: State Machine + Dead Letter Queue

```sql
-- État unifié
ALTER TABLE documents
DROP COLUMN processing_mode,
DROP COLUMN ocr_status,
DROP COLUMN extraction_status,
DROP COLUMN validation_status,
DROP COLUMN form_mapping_status;

ALTER TABLE documents ADD COLUMN processing_state document_processing_state_enum DEFAULT 'uploaded';

-- Queue retry
CREATE TABLE document_processing_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,

    -- Retry config
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    next_retry_at TIMESTAMPTZ,

    -- Error tracking
    last_error TEXT,
    error_history JSONB DEFAULT '[]',

    -- Dead letter queue (échec définitif)
    is_dead_letter BOOLEAN DEFAULT false,
    dead_letter_reason TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    processed_at TIMESTAMPTZ
);

-- Worker process (background job)
async def ocr_worker():
    while True:
        # Get next document to process
        doc = await db.fetchrow("""
            SELECT d.*, dpq.retry_count
            FROM documents d
            JOIN document_processing_queue dpq ON dpq.document_id = d.id
            WHERE d.processing_state = 'ocr_queued'
            AND dpq.next_retry_at <= NOW()
            AND dpq.is_dead_letter = false
            ORDER BY dpq.retry_count ASC, dpq.created_at ASC
            LIMIT 1
            FOR UPDATE SKIP LOCKED
        """)

        if not doc:
            await asyncio.sleep(5)
            continue

        try:
            # Process OCR
            result = await tesseract_ocr(doc['file_path'])

            # Success
            await db.execute("""
                UPDATE documents SET
                    processing_state = 'ocr_completed',
                    extracted_text = $1,
                    ocr_confidence = $2
                WHERE id = $3
            """, result.text, result.confidence, doc['id'])

            # Remove from queue
            await db.execute(
                "DELETE FROM document_processing_queue WHERE document_id = $1",
                doc['id']
            )

        except Exception as e:
            # Retry logic
            retry_count = doc['retry_count'] + 1

            if retry_count >= 3:
                # Dead letter
                await db.execute("""
                    UPDATE document_processing_queue SET
                        is_dead_letter = true,
                        dead_letter_reason = $1
                    WHERE document_id = $2
                """, str(e), doc['id'])

                # Notify admin
                await send_alert(f"Document {doc['id']} failed OCR after 3 retries")
            else:
                # Schedule retry (exponential backoff)
                next_retry = now() + timedelta(minutes=2 ** retry_count)
                await db.execute("""
                    UPDATE document_processing_queue SET
                        retry_count = $1,
                        next_retry_at = $2,
                        last_error = $3,
                        error_history = error_history || $4::jsonb
                    WHERE document_id = $5
                """, retry_count, next_retry, str(e),
                json.dumps({'error': str(e), 'timestamp': now().isoformat()}),
                doc['id'])
```

---

## 4. Architecture Database Optimale

### 4.1 Principes de Conception

1. **Séparation claire**: `service_payments` vs `tax_declarations`
2. **Polymorphisme contrôlé**: `documents` référence les deux via FK nullable
3. **State machines explicites**: ENUM pour chaque workflow
4. **Audit trail complet**: Toutes actions agents tracées
5. **Performance**: Materialized views pour dashboards
6. **Scalabilité**: Queue système pour background jobs

### 4.2 Schéma Relationnel (ERD Simplifié)

```
┌─────────────────┐
│     users       │
└────────┬────────┘
         │
         ├──────────────────────────────┐
         │                              │
         ▼                              ▼
┌─────────────────┐            ┌─────────────────┐
│ service_payments│            │tax_declarations │
│                 │            │                 │
│ - fiscal_service│            │ - company_id    │
│ - total_amount  │            │ - declaration   │
│ - workflow      │            │   _type         │
│   _status       │            │ - status        │
│ - locked_by     │            │ - amount        │
│   _agent_id     │            │   _declared     │
└────────┬────────┘            └────────┬────────┘
         │                              │
         │                              ▼
         │                     ┌─────────────────┐
         │                     │ declaration     │
         │                     │   _payments     │
         │                     │                 │
         │                     │ - declaration_id│
         │                     │ - amount        │
         │                     │ - status        │
         │                     │ - bank_txn_id   │
         │                     └─────────────────┘
         │
         ▼
┌──────────────────────────────────────────────┐
│              documents                       │
│                                              │
│ - user_id (FK users)                         │
│ - service_payment_id (FK nullable)           │
│ - declaration_id (FK nullable)               │
│ - document_template_id (FK nullable)         │
│ - processing_state (state machine)           │
│ - extracted_data (JSONB)                     │
└──────────────────────────────────────────────┘
         │
         ▼
┌─────────────────┐
│ document_ocr    │
│   _results      │
│                 │
│ - document_id   │
│ - provider      │
│ - confidence    │
│ - extracted     │
│   _fields JSONB │
└─────────────────┘
```

---

## 5. Schéma Déclarations (schema_declarations.sql)

Pour éviter un `schema_taxage2.sql` trop long, créons un fichier séparé:

```sql
-- ============================================
-- SCHÉMA DÉCLARATIONS FISCALES v1.0
-- Séparé de schema_taxage2.sql pour clarté
-- ============================================

BEGIN;

-- ============================================
-- 1. TYPES ÉNUMÉRÉS DÉCLARATIONS
-- ============================================

-- États workflow déclarations (différent de payments)
DO $$ BEGIN
    CREATE TYPE declaration_status_enum AS ENUM (
        'draft',                -- Brouillon user
        'submitted',            -- Soumise par user
        'under_review',         -- En cours validation agent
        'requires_modification',-- Agent demande corrections
        'resubmitted',          -- User a corrigé
        'approved',             -- Agent approuvé (✅ paiement possible)
        'paid',                 -- User a payé
        'payment_confirmed',    -- Agent confirme paiement
        'closed',               -- Processus terminé
        'rejected',             -- Rejetée définitivement
        'cancelled'             -- Annulée par user
    );
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Types déclarations (20 types GE)
DO $$ BEGIN
    CREATE TYPE declaration_type_enum AS ENUM (
        -- IVA (TVA)
        'monthly_vat_standard',      -- I.V.A. Régime Réel
        'monthly_vat_simplified',    -- I.V.A. Destajo

        -- Impôt sur sociétés
        'corporate_tax_quarterly',   -- Cuota Mín. Fiscal
        'corporate_tax_annual',      -- Déclaration annuelle

        -- Pétrole
        'monthly_petroleum_production',   -- Producción Petrolera
        'quarterly_petroleum_sales',      -- Ventas Petroleras
        'petroleum_products_ivs',         -- Imp. Prod. Petroleros IVS
        'petroleum_products_fmi',         -- Imp. Prod. Petroliferos FMI

        -- Retenues
        'withholding_salary_general',     -- Imp. Sueldos y Salarios Sec. Común
        'withholding_salary_petroleum',   -- Imp. Sueldos y Salarios Petrolero
        'withholding_services',           -- Retenciones Servicios
        'withholding_dividends',          -- Retenciones Dividendos

        -- Non-résidents
        'nonresident_petroleum',          -- No-Residentes Petrolero
        'nonresident_general',            -- No-Residentes Sec. Común

        -- Autres
        'import_declaration',
        'export_declaration',
        'excise_tax_declaration',
        'stamp_duty_declaration',
        'other'
    );
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- État traitement document OCR
DO $$ BEGIN
    CREATE TYPE document_processing_state_enum AS ENUM (
        'uploaded',
        'ocr_queued',
        'ocr_processing',
        'ocr_completed',
        'ocr_failed',
        'extraction_queued',
        'extraction_processing',
        'extraction_completed',
        'extraction_failed',
        'validation_pending',
        'validation_completed',
        'mapping_completed',
        'failed_permanent'
    );
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- ============================================
-- 2. TABLE TAX_DECLARATIONS (Refonte)
-- ============================================

CREATE TABLE IF NOT EXISTS tax_declarations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Références
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,

    -- Type & Période
    declaration_type declaration_type_enum NOT NULL,
    tax_period VARCHAR(20) NOT NULL,  -- Format: 'YYYY-MM' ou 'YYYY-Q1'
    fiscal_year INTEGER NOT NULL,

    -- Données déclaration (JSONB flexible)
    declaration_data JSONB NOT NULL DEFAULT '{}',
    -- Exemple IVA:
    -- {
    --   "base_imponible_15": 1500000,
    --   "cuota_15": 225000,
    --   "total_iva_devengado": 300000,
    --   "total_deducible": 50000,
    --   "total_a_ingresar": 250000
    -- }

    -- Montants calculés (dénormalisé pour queries)
    amount_declared DECIMAL(15,2),  -- Montant total à payer (ou crédit)
    is_credit BOOLEAN DEFAULT false, -- true si crédit (montant négatif)

    -- Workflow
    status declaration_status_enum DEFAULT 'draft',
    submitted_at TIMESTAMPTZ,
    due_date DATE NOT NULL,  -- Date limite dépôt

    -- Validation agent
    locked_by_agent_id INTEGER REFERENCES ministry_agents(id),
    locked_at TIMESTAMPTZ,
    lock_expires_at TIMESTAMPTZ,

    approved_by_agent_id INTEGER REFERENCES ministry_agents(id),
    approved_at TIMESTAMPTZ,
    approval_comment TEXT,

    rejected_by_agent_id INTEGER REFERENCES ministry_agents(id),
    rejected_at TIMESTAMPTZ,
    rejection_reason TEXT,

    -- Modifications demandées
    modification_requested_at TIMESTAMPTZ,
    modification_comment TEXT,
    modification_count INTEGER DEFAULT 0,

    -- Clôture
    closed_by_agent_id INTEGER REFERENCES ministry_agents(id),
    closed_at TIMESTAMPTZ,

    -- Métadonnées
    version INTEGER DEFAULT 1,  -- Pour gérer versions corrections
    previous_version_id UUID REFERENCES tax_declarations(id),

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Contraintes
    CONSTRAINT valid_amount CHECK (
        (is_credit = false AND amount_declared >= 0) OR
        (is_credit = true AND amount_declared <= 0)
    ),
    CONSTRAINT valid_period CHECK (
        tax_period ~ '^[0-9]{4}-(0[1-9]|1[0-2])$' OR  -- YYYY-MM
        tax_period ~ '^[0-9]{4}-Q[1-4]$'              -- YYYY-Q1
    )
);

CREATE INDEX idx_declarations_user ON tax_declarations(user_id, status);
CREATE INDEX idx_declarations_company ON tax_declarations(company_id, tax_period);
CREATE INDEX idx_declarations_status ON tax_declarations(status, due_date);
CREATE INDEX idx_declarations_locked ON tax_declarations(locked_by_agent_id) WHERE locked_by_agent_id IS NOT NULL;
CREATE INDEX idx_declarations_type_period ON tax_declarations(declaration_type, tax_period);

-- ============================================
-- 3. TABLE DECLARATION_PAYMENTS
-- ============================================

CREATE TABLE IF NOT EXISTS declaration_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    declaration_id UUID NOT NULL REFERENCES tax_declarations(id) ON DELETE CASCADE,

    -- Montant (copié depuis declaration pour cohérence)
    amount DECIMAL(15,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'XAF',

    -- Paiement
    payment_method payment_method_enum NOT NULL,
    bank_code VARCHAR(20),  -- 'BANGE', 'BGFI', etc.
    bank_transaction_id VARCHAR(255) UNIQUE,

    -- Status
    status payment_status_enum DEFAULT 'pending',

    -- Idempotence
    idempotency_key VARCHAR(255) UNIQUE,

    -- Timestamps
    initiated_at TIMESTAMPTZ DEFAULT NOW(),
    paid_at TIMESTAMPTZ,

    -- Confirmation agent
    confirmed_by_agent_id INTEGER REFERENCES ministry_agents(id),
    confirmed_at TIMESTAMPTZ,
    confirmation_comment TEXT,

    -- Receipts
    receipt_number VARCHAR(50) UNIQUE,
    receipt_url TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT valid_payment_amount CHECK (amount > 0)
);

CREATE INDEX idx_declaration_payments_declaration ON declaration_payments(declaration_id);
CREATE INDEX idx_declaration_payments_status ON declaration_payments(status, paid_at);
CREATE INDEX idx_declaration_payments_bank ON declaration_payments(bank_code, bank_transaction_id);

-- ============================================
-- 4. TABLE DOCUMENTS (Refonte Complète)
-- ============================================

DROP TABLE IF EXISTS documents CASCADE;  -- Refonte totale

CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Références polymorphiques (au moins une doit être NOT NULL)
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    service_payment_id UUID REFERENCES service_payments(id) ON DELETE SET NULL,
    declaration_id UUID REFERENCES tax_declarations(id) ON DELETE SET NULL,
    document_template_id UUID REFERENCES document_templates(id) ON DELETE SET NULL,

    -- Métadonnées fichier
    document_number VARCHAR(50) UNIQUE NOT NULL DEFAULT (
        'DOC-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' ||
        LPAD(FLOOR(RANDOM() * 999999)::TEXT, 6, '0')
    ),
    original_filename VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_url TEXT,
    file_size_bytes BIGINT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    file_hash VARCHAR(64),  -- SHA256 pour déduplication

    -- Classification
    document_type VARCHAR(50) NOT NULL,  -- 'official_receipt', 'invoice', 'identity', etc.
    document_subtype VARCHAR(50),        -- 'scanned', 'generated', 'uploaded'

    -- Processing State Machine (unifié)
    processing_state document_processing_state_enum DEFAULT 'uploaded',

    -- OCR
    ocr_provider VARCHAR(30),  -- 'tesseract', 'cloud_vision', 'textract'
    ocr_confidence DECIMAL(4,3),
    extracted_text TEXT,
    ocr_processing_time_ms INTEGER,

    -- Extraction structurée (AI/Regex)
    extracted_data JSONB DEFAULT '{}',
    -- Exemple:
    -- {
    --   "receipt_number": "1.804/20",
    --   "amount": 102000,
    --   "date": "2025-10-01",
    --   "ministry": "Seguridad Nacional"
    -- }
    extraction_confidence DECIMAL(4,3),
    field_confidences JSONB,  -- {'amount': 0.95, 'date': 0.88}

    -- Validation utilisateur
    user_corrections JSONB,  -- Corrections manuelles
    validated_by UUID REFERENCES users(id),
    validated_at TIMESTAMPTZ,

    -- Form auto-fill (pour déclarations)
    form_auto_fill_data JSONB,
    target_form_type VARCHAR(50),  -- 'monthly_vat_standard', etc.

    -- Qualité & preprocessing
    image_quality_score DECIMAL(4,3),
    preprocessing_applied JSONB,  -- ['deskew', 'denoise', 'contrast']

    -- Sécurité
    access_level document_access_level_enum DEFAULT 'private',
    encryption_key_id VARCHAR(100),
    retention_until DATE,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    processed_at TIMESTAMPTZ,

    -- Contraintes
    CONSTRAINT valid_file_size CHECK (file_size_bytes > 0 AND file_size_bytes < 52428800),  -- 50MB max
    CONSTRAINT valid_confidence CHECK (
        (ocr_confidence IS NULL OR (ocr_confidence >= 0 AND ocr_confidence <= 1)) AND
        (extraction_confidence IS NULL OR (extraction_confidence >= 0 AND extraction_confidence <= 1))
    ),
    CONSTRAINT at_least_one_reference CHECK (
        service_payment_id IS NOT NULL OR
        declaration_id IS NOT NULL
    )
);

CREATE INDEX idx_documents_user ON documents(user_id, created_at DESC);
CREATE INDEX idx_documents_payment ON documents(service_payment_id) WHERE service_payment_id IS NOT NULL;
CREATE INDEX idx_documents_declaration ON documents(declaration_id) WHERE declaration_id IS NOT NULL;
CREATE INDEX idx_documents_template ON documents(document_template_id) WHERE document_template_id IS NOT NULL;
CREATE INDEX idx_documents_processing ON documents(processing_state, created_at);
CREATE INDEX idx_documents_hash ON documents(file_hash) WHERE file_hash IS NOT NULL;  -- Déduplication

-- ============================================
-- 5. QUEUE OCR/EXTRACTION
-- ============================================

CREATE TABLE document_processing_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,

    -- Retry logic
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    next_retry_at TIMESTAMPTZ,

    -- Error tracking
    last_error TEXT,
    error_history JSONB DEFAULT '[]',

    -- Dead letter queue
    is_dead_letter BOOLEAN DEFAULT false,
    dead_letter_reason TEXT,
    dead_letter_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    processed_at TIMESTAMPTZ,

    UNIQUE(document_id)
);

CREATE INDEX idx_doc_queue_retry ON document_processing_queue(next_retry_at, retry_count)
    WHERE is_dead_letter = false AND processed_at IS NULL;

-- ============================================
-- 6. USER SESSIONS (Nouveau)
-- ============================================

CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Session tokens
    session_token VARCHAR(255) UNIQUE NOT NULL,
    refresh_token VARCHAR(255) UNIQUE,

    -- Device info
    device_id VARCHAR(255),
    device_name VARCHAR(100),
    ip_address INET,
    user_agent TEXT,
    browser VARCHAR(50),
    os VARCHAR(50),

    -- Status
    is_active BOOLEAN DEFAULT true,
    last_activity_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,

    -- Context preservation (reprendre paiement)
    context_data JSONB DEFAULT '{}',
    -- {
    --   "current_page": "/declarations/new",
    --   "form_draft": {...},
    --   "payment_draft": {...}
    -- }

    created_at TIMESTAMPTZ DEFAULT NOW(),
    terminated_at TIMESTAMPTZ,
    termination_reason VARCHAR(50),  -- 'logout', 'timeout', 'forced', 'security'

    CONSTRAINT valid_session_duration CHECK (expires_at > created_at)
);

CREATE INDEX idx_sessions_user_active ON user_sessions(user_id, is_active) WHERE is_active = true;
CREATE INDEX idx_sessions_token ON user_sessions(session_token) WHERE is_active = true;
CREATE INDEX idx_sessions_activity ON user_sessions(last_activity_at) WHERE is_active = true;

-- ============================================
-- 7. AGENT WORK QUEUE (Nouveau)
-- ============================================

CREATE TABLE agent_work_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Polymorphic reference
    item_type VARCHAR(20) NOT NULL CHECK (item_type IN ('payment', 'declaration')),
    item_id UUID NOT NULL,

    -- Assignment
    assigned_to_agent_id INTEGER REFERENCES ministry_agents(id),
    assigned_at TIMESTAMPTZ,

    -- Priority calculation
    priority_score INTEGER NOT NULL DEFAULT 50,
    base_priority INTEGER DEFAULT 5,  -- 1=urgent, 10=low

    -- Factors
    amount DECIMAL(15,2),
    sla_deadline TIMESTAMPTZ,
    escalation_count INTEGER DEFAULT 0,
    retry_count INTEGER DEFAULT 0,

    -- Status
    queue_status VARCHAR(20) DEFAULT 'pending' CHECK (queue_status IN (
        'pending', 'assigned', 'in_progress', 'completed', 'escalated'
    )),

    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,

    UNIQUE(item_type, item_id)
);

CREATE INDEX idx_queue_pending ON agent_work_queue(priority_score DESC, created_at ASC)
    WHERE queue_status = 'pending';
CREATE INDEX idx_queue_agent ON agent_work_queue(assigned_to_agent_id, queue_status);

-- ============================================
-- 8. BANK CONFIGURATIONS (Nouveau)
-- ============================================

CREATE TABLE bank_configurations (
    id SERIAL PRIMARY KEY,
    bank_code VARCHAR(20) UNIQUE NOT NULL,
    bank_name VARCHAR(100) NOT NULL,

    -- Compte Trésor Public
    treasury_account VARCHAR(50) NOT NULL,

    -- API config (encrypted)
    api_base_url VARCHAR(255),
    api_key_encrypted TEXT,
    webhook_secret_encrypted TEXT,

    -- Features
    supports_card_payment BOOLEAN DEFAULT true,
    supports_mobile_money BOOLEAN DEFAULT false,
    supports_bank_transfer BOOLEAN DEFAULT true,

    -- SLA
    expected_confirmation_minutes INTEGER DEFAULT 5,
    max_retry_attempts INTEGER DEFAULT 3,
    timeout_seconds INTEGER DEFAULT 30,

    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed data
INSERT INTO bank_configurations (bank_code, bank_name, treasury_account) VALUES
('BANGE', 'Banco de Guinea Ecuatorial', '37100036801-37'),
('BGFI', 'BGFI Bank', '00106046001-15'),
('CCEIBANK', 'CCEI Bank', '00000161001-22'),
('SGBGE', 'Société Générale de Banques', '27110104801-87'),
('ECOBANK', 'Ecobank Guinea Ecuatorial', '39360000063-01')
ON CONFLICT (bank_code) DO NOTHING;

-- ============================================
-- 9. AUDIT DÉCLARATIONS (Nouveau)
-- ============================================

CREATE TABLE declaration_validation_audit (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    declaration_id UUID NOT NULL REFERENCES tax_declarations(id) ON DELETE CASCADE,
    agent_id INTEGER REFERENCES ministry_agents(id),

    -- Action
    action VARCHAR(50) NOT NULL,  -- 'approve', 'reject', 'request_modification'
    from_status declaration_status_enum,
    to_status declaration_status_enum,

    -- Details
    comment TEXT,
    validation_details JSONB,

    -- Technical
    ip_address INET,
    user_agent TEXT,
    session_id UUID,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_declaration_audit_declaration ON declaration_validation_audit(declaration_id, created_at DESC);
CREATE INDEX idx_declaration_audit_agent ON declaration_validation_audit(agent_id, created_at DESC);

-- ============================================
-- 10. VUES MATÉRIALISÉES DÉCLARATIONS
-- ============================================

-- Dashboard agents déclarations
CREATE MATERIALIZED VIEW agent_declarations_dashboard AS
SELECT
    td.id as declaration_id,
    td.declaration_type,
    td.tax_period,
    td.amount_declared,
    td.status,
    td.submitted_at,
    td.due_date,
    td.locked_by_agent_id,

    -- User
    u.id as user_id,
    u.first_name || ' ' || u.last_name as user_name,
    u.email as user_email,

    -- Company
    c.id as company_id,
    c.legal_name as company_name,
    c.tax_id as company_tax_id,

    -- SLA
    CASE
        WHEN td.due_date < CURRENT_DATE THEN 'expired'
        WHEN td.due_date < CURRENT_DATE + INTERVAL '3 days' THEN 'urgent'
        WHEN td.due_date < CURRENT_DATE + INTERVAL '7 days' THEN 'warning'
        ELSE 'normal'
    END as sla_status,

    -- Priority
    CASE
        WHEN td.status = 'resubmitted' THEN 1  -- Déjà corrigée, prioritaire
        WHEN td.amount_declared > 5000000 THEN 2
        WHEN td.due_date < CURRENT_DATE + INTERVAL '3 days' THEN 3
        ELSE 4
    END as priority_order

FROM tax_declarations td
JOIN users u ON td.user_id = u.id
LEFT JOIN companies c ON td.company_id = c.id
WHERE td.status IN ('submitted', 'resubmitted', 'under_review');

CREATE UNIQUE INDEX idx_agent_decl_dashboard_id ON agent_declarations_dashboard(declaration_id);
CREATE INDEX idx_agent_decl_dashboard_sla ON agent_declarations_dashboard(sla_status, priority_order);

-- Stats déclarations par type
CREATE MATERIALIZED VIEW declarations_stats_by_type AS
SELECT
    declaration_type,
    COUNT(*) as total_declarations,
    COUNT(*) FILTER (WHERE status = 'closed') as closed_count,
    COUNT(*) FILTER (WHERE status = 'rejected') as rejected_count,
    SUM(amount_declared) FILTER (WHERE NOT is_credit) as total_amount_collected,
    SUM(ABS(amount_declared)) FILTER (WHERE is_credit) as total_credits,
    AVG(amount_declared) FILTER (WHERE NOT is_credit) as avg_amount,
    MIN(submitted_at) as first_declaration,
    MAX(submitted_at) as last_declaration
FROM tax_declarations
GROUP BY declaration_type;

CREATE UNIQUE INDEX idx_declarations_stats_type ON declarations_stats_by_type(declaration_type);

-- ============================================
-- 11. FONCTIONS HELPERS
-- ============================================

-- Lock déclaration pour agent
CREATE OR REPLACE FUNCTION lock_declaration_for_agent(
    p_declaration_id UUID,
    p_agent_id INTEGER
) RETURNS BOOLEAN AS $$
DECLARE
    lock_acquired BOOLEAN;
BEGIN
    UPDATE tax_declarations
    SET locked_by_agent_id = p_agent_id,
        locked_at = NOW(),
        lock_expires_at = NOW() + INTERVAL '2 hours',
        status = 'under_review'
    WHERE id = p_declaration_id
      AND locked_by_agent_id IS NULL
      AND status IN ('submitted', 'resubmitted')
    RETURNING true INTO lock_acquired;

    RETURN COALESCE(lock_acquired, false);
END;
$$ LANGUAGE plpgsql;

-- Unlock déclaration
CREATE OR REPLACE FUNCTION unlock_declaration_by_agent(
    p_declaration_id UUID,
    p_agent_id INTEGER
) RETURNS BOOLEAN AS $$
BEGIN
    UPDATE tax_declarations
    SET locked_by_agent_id = NULL,
        locked_at = NULL,
        lock_expires_at = NULL,
        status = 'submitted'
    WHERE id = p_declaration_id
      AND locked_by_agent_id = p_agent_id;

    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Auto-assignment agent disponible
CREATE OR REPLACE FUNCTION auto_assign_declaration_to_agent()
RETURNS UUID AS $$
DECLARE
    v_queue_item_id UUID;
    v_agent_id INTEGER;
    v_declaration_id UUID;
BEGIN
    -- Trouver agent le moins chargé
    SELECT id INTO v_agent_id
    FROM ministry_agents ma
    WHERE ma.is_active = true
    AND ma.status = 'available'
    ORDER BY (
        SELECT COUNT(*)
        FROM agent_work_queue awq
        WHERE awq.assigned_to_agent_id = ma.id
        AND awq.queue_status = 'in_progress'
    ) ASC
    LIMIT 1;

    IF v_agent_id IS NULL THEN
        RAISE EXCEPTION 'No available agents';
    END IF;

    -- Assigner déclaration prioritaire
    UPDATE agent_work_queue
    SET assigned_to_agent_id = v_agent_id,
        assigned_at = NOW(),
        queue_status = 'assigned'
    WHERE id = (
        SELECT id FROM agent_work_queue
        WHERE item_type = 'declaration'
        AND queue_status = 'pending'
        ORDER BY priority_score DESC, created_at ASC
        LIMIT 1
        FOR UPDATE SKIP LOCKED
    )
    RETURNING item_id INTO v_declaration_id;

    -- Lock la déclaration
    PERFORM lock_declaration_for_agent(v_declaration_id, v_agent_id);

    RETURN v_declaration_id;
END;
$$ LANGUAGE plpgsql;

-- Calcul priorité automatique
CREATE OR REPLACE FUNCTION calculate_queue_priority(
    p_item_type VARCHAR(20),
    p_item_id UUID
) RETURNS INTEGER AS $$
DECLARE
    v_score INTEGER := 50;  -- Base
    v_amount DECIMAL(15,2);
    v_sla_deadline TIMESTAMPTZ;
    v_escalation_count INTEGER;
BEGIN
    IF p_item_type = 'declaration' THEN
        SELECT amount_declared, due_date, modification_count
        INTO v_amount, v_sla_deadline, v_escalation_count
        FROM tax_declarations
        WHERE id = p_item_id;

        -- SLA urgent (+50)
        IF v_sla_deadline < NOW() + INTERVAL '3 days' THEN
            v_score := v_score + 50;
        END IF;

        -- Montant élevé (+30)
        IF v_amount > 5000000 THEN
            v_score := v_score + 30;
        END IF;

        -- Déjà modifiée (+40 par modification)
        v_score := v_score + (COALESCE(v_escalation_count, 0) * 40);

    ELSIF p_item_type = 'payment' THEN
        -- Similar logic pour payments
        NULL;
    END IF;

    RETURN v_score;
END;
$$ LANGUAGE plpgsql;

-- Trigger auto-calcul priorité
CREATE OR REPLACE FUNCTION trigger_calculate_queue_priority()
RETURNS TRIGGER AS $$
BEGIN
    NEW.priority_score := calculate_queue_priority(NEW.item_type, NEW.item_id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER before_insert_queue_priority
BEFORE INSERT ON agent_work_queue
FOR EACH ROW
EXECUTE FUNCTION trigger_calculate_queue_priority();

-- ============================================
-- 12. TRIGGERS
-- ============================================

-- Auto-update timestamps
CREATE TRIGGER update_tax_declarations_updated_at
BEFORE UPDATE ON tax_declarations
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_documents_updated_at
BEFORE UPDATE ON documents
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Cleanup expired locks (cron job)
CREATE OR REPLACE FUNCTION cleanup_expired_declaration_locks()
RETURNS INTEGER AS $$
DECLARE
    v_count INTEGER;
BEGIN
    UPDATE tax_declarations
    SET locked_by_agent_id = NULL,
        locked_at = NULL,
        lock_expires_at = NULL,
        status = 'submitted'
    WHERE lock_expires_at < NOW()
    AND locked_by_agent_id IS NOT NULL;

    GET DIAGNOSTICS v_count = ROW_COUNT;
    RETURN v_count;
END;
$$ LANGUAGE plpgsql;

COMMIT;

-- ============================================
-- FIN SCHEMA DECLARATIONS
-- ============================================
```

---

## 6. Intégration i18n & OCR

### 6.1 Traductions Formulaires

**Problème**: Formulaires PDF en espagnol, app multilingue

**Solution**: Table `form_field_translations`

```sql
CREATE TABLE form_field_translations (
    id SERIAL PRIMARY KEY,

    -- Référence formulaire
    form_type VARCHAR(50) NOT NULL,  -- 'monthly_vat_standard'
    field_code VARCHAR(100) NOT NULL,  -- 'base_imponible_01'

    -- Traductions
    language_code VARCHAR(5) NOT NULL,
    field_label TEXT NOT NULL,
    field_help_text TEXT,
    field_placeholder TEXT,

    -- Metadata
    field_type VARCHAR(20),  -- 'number', 'text', 'date'
    is_required BOOLEAN DEFAULT false,
    validation_regex VARCHAR(255),

    created_at TIMESTAMPTZ DEFAULT NOW(),

    PRIMARY KEY (form_type, field_code, language_code)
);

-- Seed exemple IVA
INSERT INTO form_field_translations VALUES
('monthly_vat_standard', 'base_imponible_01', 'es', 'Base Imponible 01', 'Base imponible al 15%', NULL, 'number', true, '^[0-9]+$'),
('monthly_vat_standard', 'base_imponible_01', 'fr', 'Base Imposable 01', 'Base imposable à 15%', NULL, 'number', true, '^[0-9]+$'),
('monthly_vat_standard', 'base_imponible_01', 'en', 'Taxable Base 01', 'Taxable base at 15%', NULL, 'number', true, '^[0-9]+$');
```

### 6.2 OCR Multilingue

**Configuration provider**:
```python
OCR_CONFIG = {
    'tesseract': {
        'languages': ['spa', 'fra', 'eng'],  # Espagnol prioritaire
        'psm': 6,  # Assume uniform block of text
        'oem': 3   # LSTM neural net
    },
    'cloud_vision': {
        'language_hints': ['es', 'fr', 'en']
    }
}
```

---

## 7. Sécurité & Sessions

### 7.1 Session Management

**Login Flow**:
```python
@router.post("/auth/login")
async def login(credentials: LoginRequest):
    user = await authenticate_user(credentials.email, credentials.password)

    # Create session
    session = await db.fetchrow("""
        INSERT INTO user_sessions (
            user_id, session_token, refresh_token,
            device_id, device_name, ip_address, user_agent,
            expires_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW() + INTERVAL '7 days')
        RETURNING *
    """, user.id, generate_token(), generate_token(),
         request.headers.get('X-Device-ID'),
         request.headers.get('X-Device-Name'),
         request.client.host,
         request.headers.get('User-Agent'))

    # JWT token
    jwt_token = create_jwt({
        'user_id': user.id,
        'session_id': session['id']
    })

    return {
        'access_token': jwt_token,
        'refresh_token': session['refresh_token'],
        'expires_in': 3600
    }
```

**Context Preservation** (paiement interrompu):
```python
@router.post("/payments/save-draft")
async def save_payment_draft(draft: PaymentDraft, session: Session = Depends()):
    await db.execute("""
        UPDATE user_sessions
        SET context_data = jsonb_set(
            context_data,
            '{payment_draft}',
            $1::jsonb
        ),
        last_activity_at = NOW()
        WHERE id = $2
    """, json.dumps(draft.dict()), session.id)

    return {"saved": True}

@router.get("/payments/restore-draft")
async def restore_payment_draft(session: Session = Depends()):
    draft = await db.fetchval("""
        SELECT context_data->'payment_draft'
        FROM user_sessions
        WHERE id = $1
    """, session.id)

    return draft or {}
```

### 7.2 Sécurité Agents

**Multi-device protection**:
```python
@router.post("/agents/lock-payment")
async def lock_payment(
    payment_id: UUID,
    agent: Agent = Depends(get_current_agent)
):
    # Check si agent déjà une session active sur autre device
    active_sessions = await db.fetch("""
        SELECT * FROM user_sessions
        WHERE user_id = $1 AND is_active = true
    """, agent.user_id)

    if len(active_sessions) > 1:
        # Alert: agent connecté sur 2 devices
        await send_alert(f"Agent {agent.id} multiple active sessions")

    # Lock payment
    locked = await lock_payment_for_agent(payment_id, agent.id)

    if not locked:
        raise HTTPException(409, "Already locked by another agent")

    # Log action
    await db.execute("""
        INSERT INTO payment_validation_audit (
            payment_id, agent_id, action, session_id, ip_address
        ) VALUES ($1, $2, 'lock', $3, $4)
    """, payment_id, agent.id, request.state.session_id, request.client.host)

    return {"locked": True}
```

---

## 8. API Design & Testing

### 8.1 Endpoints Déclarations

```python
# POST /api/v1/declarations/submit
{
    "declaration_type": "monthly_vat_standard",
    "tax_period": "2025-10",
    "data": {
        "base_imponible_01": 1500000,
        "cuota_03": 225000,
        ...
    },
    "supporting_documents": [
        {"file_id": "uuid1", "type": "invoice"},
        {"file_id": "uuid2", "type": "receipt"}
    ]
}

# GET /api/v1/declarations/{id}/status
{
    "id": "uuid",
    "status": "under_review",
    "submitted_at": "2025-10-11T10:00:00Z",
    "locked_by_agent": {
        "id": 123,
        "name": "Agent Martinez"
    },
    "can_pay": false,  // ✅ Clé importante
    "can_modify": false,
    "timeline": [
        {"status": "submitted", "at": "2025-10-11T10:00:00Z"},
        {"status": "under_review", "at": "2025-10-11T14:30:00Z", "by": "Agent Martinez"}
    ]
}

# POST /api/v1/declarations/{id}/pay (uniquement si status='approved')
{
    "bank_code": "BANGE",
    "payment_method": "card",
    "card_details": {...},
    "idempotency_key": "client-generated-uuid"
}
```

### 8.2 Tests Critiques

```python
# test_declaration_workflow.py
@pytest.mark.asyncio
async def test_declaration_payment_blocked_until_approved():
    # Create declaration
    decl = await create_declaration(status='submitted')

    # Try to pay BEFORE approval → should fail
    with pytest.raises(HTTPException) as exc:
        await pay_declaration(decl.id)

    assert exc.value.status_code == 403
    assert "not approved" in exc.value.detail

    # Agent approves
    await agent_approve_declaration(decl.id)

    # Now payment should work
    payment = await pay_declaration(decl.id)
    assert payment.status == 'pending'

@pytest.mark.asyncio
async def test_ocr_retry_logic():
    # Upload document
    doc = await upload_document(file_path='receipt.jpg')

    # Simulate OCR failure
    with patch('app.services.tesseract_ocr', side_effect=Exception("OCR timeout")):
        await process_ocr(doc.id)

    # Check retry scheduled
    queue_item = await db.fetchrow(
        "SELECT * FROM document_processing_queue WHERE document_id = $1",
        doc.id
    )
    assert queue_item['retry_count'] == 1
    assert queue_item['next_retry_at'] > now()

    # Retry succeeds
    with patch('app.services.tesseract_ocr', return_value={'text': 'Success'}):
        await process_ocr(doc.id)

    # Check completed
    doc_updated = await get_document(doc.id)
    assert doc_updated.processing_state == 'ocr_completed'

@pytest.mark.asyncio
async def test_idempotent_payment():
    idempotency_key = str(uuid4())

    # First payment
    payment1 = await initiate_payment(
        amount=100000,
        idempotency_key=idempotency_key
    )

    # Retry with same key → should return same payment
    payment2 = await initiate_payment(
        amount=100000,
        idempotency_key=idempotency_key
    )

    assert payment1.id == payment2.id

    # Check only 1 payment created
    count = await db.fetchval(
        "SELECT COUNT(*) FROM service_payments WHERE idempotency_key = $1",
        idempotency_key
    )
    assert count == 1
```

---

## 9. Recommandations Finales

### 9.1 Critiques & Gaps Restants

**✅ BIEN FAIT**:
- Distinction claire services vs déclarations
- Workflow approbation AVANT paiement (déclarations)
- Table `documents` flexible

**❌ MANQUAIT** (ajouté dans ce rapport):
- Sessions utilisateurs (reprendre paiement)
- Queue agents avec auto-assignment
- OCR retry logic + dead letter queue
- Idempotence paiements
- Abstraction intégration bancaire
- Audit trail complet

**⚠️ RESTE À FAIRE**:
1. **Webhooks bancaires**: Implémenter endpoints sécurisés
2. **Reconciliation**: Job nuit pour vérifier paiements
3. **Notifications**: Email/SMS à chaque étape workflow
4. **Reports**: Dashboard DGI (agrégation déclarations)
5. **ML**: Détection anomalies (montants suspects)

### 9.2 Architecture Finale

```
┌──────────────────────────────────────────────────────┐
│           FRONTEND (React/Next.js)                   │
│  - Formulaire IVA avec auto-fill OCR                 │
│  - Upload documents + preview extraction             │
│  - Dashboard user: status temps réel                 │
└─────────────────────┬────────────────────────────────┘
                      │
                      ↓
┌──────────────────────────────────────────────────────┐
│         BACKEND FASTAPI (Business Logic)             │
│  - Workflow orchestration                            │
│  - OCR/AI extraction                                 │
│  - Bank adapters (5 banques)                         │
│  - Session management                                │
└─────────────────────┬────────────────────────────────┘
                      │
                      ↓
┌──────────────────────────────────────────────────────┐
│     POSTGRESQL (schema_taxage2 + declarations)       │
│  - 27 tables core + 12 tables declarations           │
│  - 9 + 2 materialized views                          │
│  - State machines (ENUMs)                            │
│  - Queue système (agents, OCR)                       │
└──────────────────────────────────────────────────────┘
                      │
          ┌───────────┴───────────┐
          ↓                       ↓
┌──────────────────┐    ┌──────────────────┐
│  BANQUES (APIs)  │    │  STORAGE (S3)    │
│  - BANGE         │    │  - Documents PDF │
│  - BGFI          │    │  - Receipts      │
│  - CCEI, etc.    │    │  - Certificats   │
└──────────────────┘    └──────────────────┘
```

---

## 9. Installation & Déploiement

### 9.1 Fichiers Schema

L'architecture complète est divisée en 2 fichiers SQL:

1. **`data/schema_taxage2.sql`** (1809 lignes)
   - Core schema v4.1 (27 tables)
   - Templates RADICAL architecture
   - i18n optimisée (ENUM + codes courts)
   - Workflow agents (8 tables)
   - Materialized views (9 vues)

2. **`data/schema_declarations.sql`** (1200+ lignes) ✅ **NOUVEAU**
   - Tax declarations workflow (12 tables)
   - Documents table (polymorphic)
   - User sessions (context preservation)
   - Agent work queue (auto-assignment)
   - Bank configurations (5 banks)
   - Document processing queue (OCR retry)
   - Declaration justificatifs
   - Agent activity log (audit trail)
   - Payment webhooks log
   - System configuration
   - Materialized views (2 vues)
   - Database functions (8 fonctions)
   - Triggers (4 automatisations)

### 9.2 Installation Complète

```bash
# 1. Setup database
createdb taxasge

# 2. Load core schema (REQUIRED FIRST)
psql -U postgres -d taxasge -f data/schema_taxage2.sql

# 3. Load declarations schema (AFTER core)
psql -U postgres -d taxasge -f data/schema_declarations.sql

# 4. Load seed data
psql -U postgres -d taxasge -f data/seed/seed_data.sql
psql -U postgres -d taxasge -f data/seed/seed_procedure_templates.sql
psql -U postgres -d taxasge -f data/seed/seed_document_templates.sql
psql -U postgres -d taxasge -f data/seed/seed_translations_v41.sql
psql -U postgres -d taxasge -f data/seed/seed_keywords.sql

# 5. Verify installation
psql -U postgres -d taxasge -c "\d"
```

### 9.3 Order of Execution (IMPORTANT)

⚠️ **CRITICAL**: `schema_taxage2.sql` MUST be loaded BEFORE `schema_declarations.sql` because:

1. `schema_declarations.sql` references tables from `schema_taxage2.sql`:
   - `users` (UUID primary key)
   - `fiscal_services`
   - `service_payments`
   - `document_templates`
   - `companies`

2. `schema_declarations.sql` uses ENUMs defined in `schema_taxage2.sql`:
   - `declaration_type_enum` (20 types)
   - `user_role_enum`

3. Functions referenced:
   - `update_updated_at_column()` (trigger function)
   - `gen_random_uuid()` (from uuid-ossp extension)

### 9.4 Key Compatibility Notes

#### Table Naming Strategy

- **Core tables**: Defined in `schema_taxage2.sql`
  - `tax_declarations` (basic structure)
  - `declaration_payments` (basic structure)

- **Extended tables**: Defined in `schema_declarations.sql`
  - `tax_declarations_v2` (extended with agent workflow)
  - `declaration_payments_v2` (extended with idempotency)
  - `documents` (NEW - missing from schema_taxage2.sql)

⚠️ **NOTE**: In production, you should either:
1. Use `_v2` tables exclusively (recommended), OR
2. Merge extended fields into base tables (requires schema_taxage2.sql modification)

#### User ID Type

✅ **CORRECTED**: All user FK references use `UUID` to match `users.id` type from schema_taxage2.sql

```sql
-- WRONG (old)
reviewed_by_agent_id INTEGER REFERENCES users(id)

-- CORRECT (fixed)
reviewed_by_agent_id UUID REFERENCES users(id)
```

### 9.5 Verification Queries

```sql
-- Check all tables created (should show 39+ tables)
SELECT schemaname, tablename
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- Check materialized views (should show 11 views)
SELECT schemaname, matviewname
FROM pg_matviews
WHERE schemaname = 'public';

-- Verify ENUMs (should show all state machines)
SELECT typname, enumlabel
FROM pg_type t
JOIN pg_enum e ON t.oid = e.enumtypid
WHERE typname LIKE '%_enum'
ORDER BY typname, enumsortorder;

-- Check functions (should show 8+ declaration functions)
SELECT proname, prosrc
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND proname LIKE '%declaration%' OR proname LIKE '%queue%';

-- Verify foreign key constraints
SELECT
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
AND tc.table_name IN ('documents', 'tax_declarations_v2', 'declaration_payments_v2')
ORDER BY tc.table_name;
```

### 9.6 Cron Jobs Setup (Production)

```bash
# Add to crontab
crontab -e

# Refresh materialized views every hour
0 * * * * psql -U postgres -d taxasge -c "REFRESH MATERIALIZED VIEW CONCURRENTLY v_declarations_dashboard;"
0 * * * * psql -U postgres -d taxasge -c "REFRESH MATERIALIZED VIEW CONCURRENTLY v_declarations_stats;"

# Cleanup expired locks every 30 minutes
*/30 * * * * psql -U postgres -d taxasge -c "SELECT cleanup_expired_agent_locks();"

# Cleanup expired sessions every hour
0 * * * * psql -U postgres -d taxasge -c "SELECT cleanup_expired_sessions();"

# Refresh core materialized views (from schema_taxage2.sql)
0 */2 * * * psql -U postgres -d taxasge -c "REFRESH MATERIALIZED VIEW CONCURRENTLY v_services_with_preview;"
```

### 9.7 Seed Bank Configurations

The 5 banks are pre-seeded in `schema_declarations.sql`:

```sql
-- Already included in schema_declarations.sql
BANGE   - Banque Nationale GE (37100036801-37)
BGFI    - BGFI Bank GE (45200047902-45)
CCEIBANK - CCEI Bank GE (53300058003-53)
SGBGE   - Société Générale GE (61400069104-61)
ECOBANK - Ecobank GE (79500070205-79)
```

⚠️ **IMPORTANT**: Before production, encrypt API keys:

```sql
UPDATE bank_configurations
SET api_key_encrypted = pgp_sym_encrypt('ACTUAL_API_KEY', 'encryption_password')
WHERE bank_code = 'BANGE';
```

---

**Status**: ✅ Architecture Implémentée
**Schema Files**: `schema_taxage2.sql` + `schema_declarations.sql`
**Next Step**: Implement API endpoints + bank adapters
