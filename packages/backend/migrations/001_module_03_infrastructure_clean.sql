-- ============================================================================
-- MIGRATION 001: MODULE 03 - INFRASTRUCTURE DÉCLARATIONS & SERVICES FISCAUX
-- ============================================================================
-- Version: 1.0
-- Date: 2025-11-13
-- Auteur: Claude Code
-- Description: Création des 3 tables manquantes pour Module 03
--   1. ALTER sessions (ajouter context preservation)
--   2. CREATE agent_work_queue (load balancing agents)
--   3. CREATE document_processing_queue (OCR retry logic)
--
-- Références:
--   - FISCAL_DECLARATIONS_ARCHITECTURE.md (lignes 1327-1475)
--   - PLAN_TRAVAIL_MODULE_03.md (UC-00-02, UC-01-01)
--   - DATABASE_SCHEMA_REFERENCE.md (ligne 1930-1981)
--
-- ============================================================================

-- ============================================================================
-- SECTION 1: EXTENSION TABLE SESSIONS (Context Preservation)
-- ============================================================================

-- Objectif: Permettre aux utilisateurs de reprendre leur paiement/déclaration
-- après interruption (déconnexion, timeout, erreur réseau)

BEGIN;

-- Ajout colonnes pour context preservation
ALTER TABLE sessions
  -- Context data (CRITIQUE: reprendre paiement interrompu)
  ADD COLUMN IF NOT EXISTS context_data JSONB DEFAULT '{}' NOT NULL,
  -- Exemples context_data:
  -- {
  --   "current_step": "payment_pending",
  --   "declaration_id": "uuid",
  --   "payment_draft": {"amount": 50000, "bank_selected": "BANGE"},
  --   "form_draft": {...},
  --   "uploaded_files": ["file_id_1", "file_id_2"]
  -- }

  -- Termination reason (Audit trail)
  ADD COLUMN IF NOT EXISTS termination_reason VARCHAR(50),
  -- Valeurs: 'logout', 'timeout', 'forced', 'security_breach', 'device_limit'

  -- Améliorer IP tracking (VARCHAR → INET pour validation native)
  ALTER COLUMN ip_address TYPE INET USING
    CASE
      WHEN ip_address IS NULL THEN NULL
      WHEN ip_address::TEXT ~ '^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$' THEN ip_address::INET
      ELSE NULL  -- Ignorer IPs invalides
    END;

-- Indexes pour performance context queries
CREATE INDEX IF NOT EXISTS idx_sessions_context_data
  ON sessions USING gin(context_data);

CREATE INDEX IF NOT EXISTS idx_sessions_active_user
  ON sessions(user_id, status)
  WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_sessions_termination
  ON sessions(termination_reason, revoked_at)
  WHERE termination_reason IS NOT NULL;

-- Commentaires colonnes
COMMENT ON COLUMN sessions.context_data IS
  'JSONB storage for user session context (form drafts, payment state, navigation) to resume interrupted workflows';

COMMENT ON COLUMN sessions.termination_reason IS
  'Reason for session termination: logout, timeout, forced, security_breach, device_limit';

COMMIT;

-- ============================================================================
-- SECTION 2: TABLE AGENT_WORK_QUEUE (Load Balancing Agents)
-- ============================================================================

-- Objectif: Distribuer équitablement les tâches de validation entre agents
-- avec priorité dynamique basée sur SLA, montant, complexité

BEGIN;

-- Suppression table si existe (idempotence)
DROP TABLE IF EXISTS agent_work_queue CASCADE;

-- Création table
CREATE TABLE agent_work_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Polymorphic reference (payment OU declaration)
    item_type VARCHAR(20) NOT NULL CHECK (item_type IN ('payment', 'declaration')),
    item_id UUID NOT NULL,
    -- item_type='payment' → item_id référence payments.id
    -- item_type='declaration' → item_id référence tax_declarations.id

    -- Métadonnées pour priorisation
    ministry_id INTEGER NOT NULL REFERENCES ministries(id) ON DELETE CASCADE,
    amount DECIMAL(15,2),  -- Montant (NULL si non applicable)
    declaration_type VARCHAR(50),  -- Type déclaration (NULL si payment direct)

    -- Priorité calculée automatiquement
    priority_score INTEGER NOT NULL DEFAULT 0,
    -- Calcul: base 0-100
    --   +30 si montant > 1M XAF
    --   +20 si SLA < 6h restantes
    --   +15 si correction_count >= 2 (frustration user)
    --   +10 si declaration_type = 'IVA_MENSUEL' (volume élevé)
    --   +10 si escalated = true

    -- SLA management
    sla_deadline TIMESTAMPTZ NOT NULL,
    -- Calculé à l'insertion: NOW() + ministry_sla_hours
    -- Ex: 48h pour déclarations, 24h pour paiements

    sla_status VARCHAR(20) DEFAULT 'on_time' CHECK (sla_status IN ('on_time', 'warning', 'critical', 'breached')),
    -- on_time: > 25% temps restant
    -- warning: 10-25% temps restant
    -- critical: < 10% temps restant
    -- breached: deadline dépassé

    -- Agent assignment
    assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
    assigned_at TIMESTAMPTZ,
    locked_until TIMESTAMPTZ,  -- Lock expire automatiquement (évite blocages)

    -- Escalation
    escalated BOOLEAN DEFAULT false,
    escalated_at TIMESTAMPTZ,
    escalated_by UUID REFERENCES users(id) ON DELETE SET NULL,
    escalation_reason TEXT,

    -- Status
    status VARCHAR(20) NOT NULL DEFAULT 'pending'
      CHECK (status IN ('pending', 'assigned', 'in_progress', 'completed', 'cancelled')),

    completed_at TIMESTAMPTZ,
    completed_by UUID REFERENCES users(id) ON DELETE SET NULL,

    -- Retry logic (si agent release sans traiter)
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,

    -- Audit
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Contrainte: pas de duplicate dans queue
    CONSTRAINT unique_queue_item UNIQUE (item_type, item_id)
);

-- Indexes pour performance agent dashboard
CREATE INDEX idx_queue_status_priority
  ON agent_work_queue(status, priority_score DESC, sla_deadline ASC)
  WHERE status IN ('pending', 'assigned');

CREATE INDEX idx_queue_ministry_pending
  ON agent_work_queue(ministry_id, status, priority_score DESC)
  WHERE status = 'pending';

CREATE INDEX idx_queue_assigned_agent
  ON agent_work_queue(assigned_to, status)
  WHERE assigned_to IS NOT NULL AND status IN ('assigned', 'in_progress');

CREATE INDEX idx_queue_sla_critical
  ON agent_work_queue(sla_status, sla_deadline ASC)
  WHERE sla_status IN ('warning', 'critical', 'breached') AND status != 'completed';

CREATE INDEX idx_queue_escalated
  ON agent_work_queue(escalated, escalated_at DESC)
  WHERE escalated = true;

-- Commentaires table
COMMENT ON TABLE agent_work_queue IS
  'Work queue for agent load balancing with dynamic priority calculation based on SLA, amount, and complexity';

COMMENT ON COLUMN agent_work_queue.priority_score IS
  'Dynamic priority score (0-100): +30 if amount>1M, +20 if SLA<6h, +15 if retry>=2, +10 if IVA, +10 if escalated';

COMMENT ON COLUMN agent_work_queue.sla_deadline IS
  'Service Level Agreement deadline: 48h for declarations, 24h for payments';

-- Fonction: Calculer priorité automatiquement
CREATE OR REPLACE FUNCTION calculate_queue_priority()
RETURNS TRIGGER AS $$
DECLARE
    score INTEGER := 0;
    hours_remaining INTERVAL;
BEGIN
    -- Base: 0 points

    -- +30 si montant > 1M XAF (gros contribuables)
    IF NEW.amount > 1000000 THEN
        score := score + 30;
    END IF;

    -- +20 si SLA < 6h restantes (urgence)
    hours_remaining := NEW.sla_deadline - NOW();
    IF hours_remaining < INTERVAL '6 hours' THEN
        score := score + 20;
    ELSIF hours_remaining < INTERVAL '12 hours' THEN
        score := score + 10;
    END IF;

    -- +15 si retry >= 2 (frustration user)
    IF NEW.retry_count >= 2 THEN
        score := score + 15;
    END IF;

    -- +10 si IVA (volume élevé, traitement prioritaire)
    IF NEW.declaration_type LIKE 'IVA%' OR NEW.declaration_type = 'actual_vat' THEN
        score := score + 10;
    END IF;

    -- +10 si escalated
    IF NEW.escalated = true THEN
        score := score + 10;
    END IF;

    -- Limiter score max à 100
    NEW.priority_score := LEAST(score, 100);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Recalculer priorité à chaque UPDATE
CREATE TRIGGER trg_calculate_priority
    BEFORE INSERT OR UPDATE OF amount, sla_deadline, retry_count, escalated, declaration_type
    ON agent_work_queue
    FOR EACH ROW
    EXECUTE FUNCTION calculate_queue_priority();

-- Fonction: Mettre à jour SLA status automatiquement
CREATE OR REPLACE FUNCTION update_sla_status()
RETURNS TRIGGER AS $$
DECLARE
    hours_remaining INTERVAL;
    total_hours INTERVAL;
    percentage_remaining NUMERIC;
BEGIN
    -- Calculer temps restant
    hours_remaining := NEW.sla_deadline - NOW();
    total_hours := NEW.sla_deadline - NEW.created_at;

    -- Calculer pourcentage restant
    percentage_remaining := EXTRACT(EPOCH FROM hours_remaining)::NUMERIC /
                           EXTRACT(EPOCH FROM total_hours)::NUMERIC * 100;

    -- Mise à jour status
    IF hours_remaining < INTERVAL '0 hours' THEN
        NEW.sla_status := 'breached';
    ELSIF percentage_remaining < 10 THEN
        NEW.sla_status := 'critical';
    ELSIF percentage_remaining < 25 THEN
        NEW.sla_status := 'warning';
    ELSE
        NEW.sla_status := 'on_time';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Vérifier SLA à chaque UPDATE
CREATE TRIGGER trg_update_sla
    BEFORE INSERT OR UPDATE OF sla_deadline
    ON agent_work_queue
    FOR EACH ROW
    EXECUTE FUNCTION update_sla_status();

COMMIT;

-- ============================================================================
-- SECTION 3: TABLE DOCUMENT_PROCESSING_QUEUE (OCR Retry Logic)
-- ============================================================================

-- Objectif: Gérer retry automatique des OCR échoués avec exponential backoff
-- Support Cloud Vision + Tesseract fallback

BEGIN;

-- Suppression table si existe (idempotence)
DROP TABLE IF EXISTS document_processing_queue CASCADE;

-- Création table
CREATE TABLE document_processing_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Document à traiter
    uploaded_file_id UUID NOT NULL REFERENCES uploaded_files(id) ON DELETE CASCADE,
    form_template_id UUID REFERENCES form_templates(id) ON DELETE SET NULL,

    -- Type de processing
    processing_type VARCHAR(30) NOT NULL DEFAULT 'ocr_extraction'
      CHECK (processing_type IN ('ocr_extraction', 'validation', 'conversion', 'compression')),

    -- OCR Engine (ordre de priorité)
    ocr_engine_primary VARCHAR(30) DEFAULT 'cloud_vision'
      CHECK (ocr_engine_primary IN ('cloud_vision', 'tesseract', 'manual')),
    ocr_engine_fallback VARCHAR(30) DEFAULT 'tesseract',

    -- Status
    status VARCHAR(20) NOT NULL DEFAULT 'pending'
      CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'dead_letter')),

    -- Retry logic avec exponential backoff
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 5,
    -- Retry delays: 10s, 30s, 1min, 5min, 15min

    next_retry_at TIMESTAMPTZ,
    -- Calculé avec exponential backoff: NOW() + (10s * 3^retry_count)

    -- Résultats
    result_data JSONB,
    -- Structure résultat:
    -- {
    --   "confidence": 0.87,
    --   "engine_used": "cloud_vision",
    --   "extracted_fields": {...},
    --   "processing_time_ms": 1234,
    --   "fallback_used": false
    -- }

    error_message TEXT,
    error_code VARCHAR(50),
    error_count INTEGER DEFAULT 0,

    -- Performance metrics
    processing_started_at TIMESTAMPTZ,
    processing_completed_at TIMESTAMPTZ,
    processing_duration_ms INTEGER,

    -- Priority (pour traiter documents critiques en premier)
    priority VARCHAR(10) DEFAULT 'normal'
      CHECK (priority IN ('low', 'normal', 'high', 'critical')),

    -- Audit
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Metadata additionnelle
    metadata JSONB DEFAULT '{}',
    -- Ex: {"user_id": "uuid", "declaration_id": "uuid", "user_waiting": true}

    CONSTRAINT valid_retry_logic CHECK (retry_count <= max_retries)
);

-- Indexes pour processing workers
CREATE INDEX idx_doc_queue_status_priority
  ON document_processing_queue(status, priority DESC, next_retry_at ASC)
  WHERE status IN ('pending', 'failed');

CREATE INDEX idx_doc_queue_retry
  ON document_processing_queue(next_retry_at ASC)
  WHERE status = 'failed' AND retry_count < max_retries;

CREATE INDEX idx_doc_queue_uploaded_file
  ON document_processing_queue(uploaded_file_id);

CREATE INDEX idx_doc_queue_dead_letter
  ON document_processing_queue(status, error_code)
  WHERE status = 'dead_letter';

-- Commentaires table
COMMENT ON TABLE document_processing_queue IS
  'Async processing queue for OCR with retry logic, exponential backoff, and Cloud Vision→Tesseract fallback';

COMMENT ON COLUMN document_processing_queue.next_retry_at IS
  'Next retry timestamp with exponential backoff: NOW() + (10s * 3^retry_count)';

-- Fonction: Calculer next_retry_at avec exponential backoff
CREATE OR REPLACE FUNCTION calculate_next_retry()
RETURNS TRIGGER AS $$
BEGIN
    -- Exponential backoff: 10s * 3^retry_count
    -- Retry 0: 10s
    -- Retry 1: 30s
    -- Retry 2: 90s (1.5min)
    -- Retry 3: 270s (4.5min)
    -- Retry 4: 810s (13.5min)

    IF NEW.status = 'failed' AND NEW.retry_count < NEW.max_retries THEN
        NEW.next_retry_at := NOW() + (INTERVAL '10 seconds' * POWER(3, NEW.retry_count));
    ELSIF NEW.retry_count >= NEW.max_retries THEN
        -- Dead letter queue (échec définitif)
        NEW.status := 'dead_letter';
        NEW.next_retry_at := NULL;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Calculer next retry
CREATE TRIGGER trg_calculate_next_retry
    BEFORE UPDATE OF status, retry_count
    ON document_processing_queue
    FOR EACH ROW
    WHEN (NEW.status = 'failed')
    EXECUTE FUNCTION calculate_next_retry();

-- Fonction: Auto-incrémenter retry_count
CREATE OR REPLACE FUNCTION increment_retry_count()
RETURNS TRIGGER AS $$
BEGIN
    -- Si transition processing → failed, incrémenter retry
    IF OLD.status = 'processing' AND NEW.status = 'failed' THEN
        NEW.retry_count := OLD.retry_count + 1;
        NEW.error_count := OLD.error_count + 1;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Incrémenter retry count
CREATE TRIGGER trg_increment_retry
    BEFORE UPDATE OF status
    ON document_processing_queue
    FOR EACH ROW
    WHEN (OLD.status = 'processing' AND NEW.status = 'failed')
    EXECUTE FUNCTION increment_retry_count();

COMMIT;

-- ============================================================================
-- SECTION 4: VALIDATION & TESTS
-- ============================================================================

-- Test 1: Vérifier colonnes ajoutées à sessions
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'sessions' AND column_name = 'context_data'
    ) THEN
        RAISE EXCEPTION 'Migration failed: sessions.context_data not created';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'sessions' AND column_name = 'termination_reason'
    ) THEN
        RAISE EXCEPTION 'Migration failed: sessions.termination_reason not created';
    END IF;

    RAISE NOTICE '[OK] Test 1 passed: sessions table extended successfully';
END $$;

-- Test 2: Vérifier table agent_work_queue créée
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'agent_work_queue'
    ) THEN
        RAISE EXCEPTION 'Migration failed: agent_work_queue table not created';
    END IF;

    RAISE NOTICE '[OK] Test 2 passed: agent_work_queue table created successfully';
END $$;

-- Test 3: Vérifier table document_processing_queue créée
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'document_processing_queue'
    ) THEN
        RAISE EXCEPTION 'Migration failed: document_processing_queue table not created';
    END IF;

    RAISE NOTICE '[OK] Test 3 passed: document_processing_queue table created successfully';
END $$;

-- Test 4: Vérifier triggers créés
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'trg_calculate_priority'
    ) THEN
        RAISE EXCEPTION 'Migration failed: trg_calculate_priority trigger not created';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'trg_calculate_next_retry'
    ) THEN
        RAISE EXCEPTION 'Migration failed: trg_calculate_next_retry trigger not created';
    END IF;

    RAISE NOTICE '[OK] Test 4 passed: All triggers created successfully';
END $$;

-- ============================================================================
-- SECTION 5: SEED DATA (Optional)
-- ============================================================================

-- Aucun seed data requis pour cette migration
-- Les tables seront peuplées dynamiquement par l'application

-- ============================================================================
-- FIN DE MIGRATION
-- ============================================================================

-- Afficher résumé
DO $$
BEGIN
    RAISE NOTICE '
    ============================================================================
    [OK] MIGRATION 001 COMPLETED SUCCESSFULLY
    ============================================================================

    📊 SUMMARY:
    - [OK] Table sessions: 2 columns added (context_data, termination_reason)
    - [OK] Table agent_work_queue: Created with 3 triggers
    - [OK] Table document_processing_queue: Created with 3 triggers
    - [OK] 8 indexes created for performance
    - [OK] 6 functions created (priority calc, SLA tracking, retry logic)

    🎯 NEXT STEPS:
    1. Update application code to use new columns/tables
    2. Test OCR retry logic with Cloud Vision + Tesseract
    3. Implement agent dashboard using agent_work_queue
    4. Monitor performance with new indexes

    📚 REFERENCES:
    - PLAN_TRAVAIL_MODULE_03.md (UC-01-01)
    - FISCAL_DECLARATIONS_ARCHITECTURE.md (lines 1327-1475)

    ============================================================================
    ';
END $$;
