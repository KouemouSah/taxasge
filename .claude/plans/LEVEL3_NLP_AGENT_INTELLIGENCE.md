# Level 3 — NLP Agent Intelligence: ML Classifier + Auto-Training Pipeline

**Status**: Phase 1 COMPLETE, Phase 2 IN PROGRESS (2026-03-05)
**Agents concerned**: Treasury Analyst + Admin Assistant (both use `BaseAnalystService`)
**Priority**: High — foundational for agent long-term intelligence

---

## Problem Statement

Level 2 (e6bdd497) delivered conversation memory + slot filling but with a critical weakness:
intent classification uses **regex pattern counting**, which gives:
- Fake confidence scores (sum of matched patterns, not probabilities)
- Brittle: "recaudación" ≠ "ingresos" ≠ "cobros" for the regex
- No generalization: unseen phrasing = wrong intent = bad routing
- No learning loop: same errors repeat forever
- Threshold 0.6 for slot inheritance is arbitrary guesswork

---

## Architecture

### Layer Stack (after Level 3)
```
User question
  → IntentClassifier (TF-IDF + LR, sklearn, trained on seeds + real data)
    → P(intent|question) — REAL probability, not fake regex count
  → Regex slot extraction (entity codes, time periods, metrics — deterministic)
  → ConversationMemory.resolve_missing_slots() (threshold = ML confidence)
  → enriched prompt → Gemini (better routing)
  → function calls executed → response built
  → agent_query_logs (async fire-and-forget, ground truth = Gemini's function choice)
```

### Key Insight
**Gemini's function choice = free ground truth label.**
`get_revenue_summary` called → intent was REVENUE. No manual labeling needed.
Accumulate 500+ real queries → retrain → model improves on the org's actual vocabulary.

---

## Phases

### Phase 1: ML Intent Classifier ✅ COMPLETE
Replace regex intent scoring with sklearn TF-IDF + LogisticRegression.

**Files modified:**
- `packages/backend/app/modules/shared/services/nlp_preprocessor.py` — REWRITE
  - Add `IntentClassifier` class (TF-IDF + LR, trained from 275 seed examples)
  - Add `FUNCTION_TO_INTENT` mapping (17 treasury + 11 admin functions → 11 intents)
  - `ExtractedSlots.intent_probabilities: Dict[str, float]` (NEW field)
  - `NLPPreprocessor.extract_slots()` uses ML for intent, keeps regex for other slots
  - `NLPPreprocessor.get_intent_probabilities()` → full distribution for logging
  - Confidence = `max(predict_proba)` — calibrated probability, not fake count
  - Fallback to regex if sklearn unavailable (defensive)

**Verification Checklist — Phase 1:**
- [x] Python syntax check passes on nlp_preprocessor.py
- [x] `nlp_preprocessor = NLPPreprocessor()` instantiates without error (288 seeds, 11 intents)
- [x] `extract_slots("Cuantos agentes conectados?").intent == AGENT_AVAILABILITY` (conf=0.537)
- [x] `extract_slots("y los rechazos?").confidence < 0.60` (conf=0.214, ambiguous follow-up)
- [x] `extract_slots("Total de ingresos del mes").intent == REVENUE` (conf=0.781)
- [x] `extract_slots("anomalias en pagos").intent == ANOMALY` (conf=0.596)
- [x] `extract_slots("hola").intent == GENERAL`
- [x] intent_probabilities contains 11 keys (all IntentCategory values)
- [x] FUNCTION_TO_INTENT has 28 entries (17 treasury + 11 admin)
- [x] All existing slots still extracted correctly (entity_codes, time_period, metric, agent_name)
- [x] Fallback regex works when SKLEARN_AVAILABLE=False (fixed accent bug in `est[aá]n`)
- [x] 16/16 intent tests pass, 5/5 slot tests pass
- [x] Previously misclassified: workload/performance/entity_compare — fixed with +13 seeds + C=5.0
- [x] Text normalization: NFKD accent stripping + typo correction + abbreviation expansion
- [x] Typo resilience: "pagso", "rekaudacion", "anomlaias", "rendimietno" → all correctly classified
- [x] 444 seed examples (35-45 per class), avg confidence 0.65+ (was 0.45)
- [x] Confidence boost: agent_availability 0.47→0.67, revenue 0.66→0.80, workload 0.39→0.79

### Phase 2: Query Logging for ML Training Data ✅ COMPLETE
Capture every Q&A pair with ground truth for future auto-retraining.

**Files modified:**
- `packages/backend/database/migrations/173_agent_query_logs.sql` — NEW
- `packages/backend/app/modules/shared/services/base_analyst_service.py` — UPDATE
  - Add `_get_agent_type()` method (returns None, subclass overrides)
  - Add `_log_query()` async fire-and-forget method
  - Call logging at end of process_question (success + timeout + error paths)
- `packages/backend/app/modules/service_requests/services/treasury_analyst_service.py` — UPDATE
  - Add `_get_agent_type()` → returns "treasury"
- `packages/backend/app/modules/agents/services/admin_assistant_service.py` — UPDATE
  - Add `_get_agent_type()` → returns "admin"

**Table: agent_query_logs**
```sql
CREATE TABLE agent_query_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_type VARCHAR(20) NOT NULL,   -- 'treasury' | 'admin'
    session_id VARCHAR(128),
    question TEXT NOT NULL,
    detected_intent VARCHAR(50),       -- ML prediction
    actual_functions_called TEXT[],    -- Gemini's choice
    ground_truth_intent VARCHAR(50),   -- derived from functions_called (via FUNCTION_TO_INTENT)
    intent_confidence FLOAT,           -- ML max_probability
    intent_probabilities JSONB,        -- full 11-class distribution
    was_successful BOOLEAN DEFAULT TRUE,
    response_time_ms INTEGER,
    entity_codes TEXT[],
    time_period_days INTEGER,
    metric VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Verification Checklist — Phase 2:**
- [x] Migration 173 applied: `agent_query_logs` table created with 14 columns
- [x] 4 indexes created (agent_type+created_at, ground_truth_intent, session_id, retrain_window)
- [x] Python syntax check passes on all 3 modified files
- [x] `_get_agent_type()` returns None in base, "treasury" in TreasuryAnalystService, "admin" in AdminAssistantService
- [x] `_log_query()` is async fire-and-forget (3 asyncio.create_task calls)
- [x] `ground_truth_intent` derived from `actual_functions_called` via FUNCTION_TO_INTENT (28 entries)
- [x] `intent_probabilities` stored as JSONB (11 keys from predict_proba)
- [x] Logging failure does NOT break response (except Exception swallowed, logger.debug)
- [x] All 3 exit paths log (success line 568, timeout line 591, error line 623)
- [ ] E2E: question to treasury/admin → row appears in agent_query_logs (requires deployed backend)

### Phase 3: Weekly Auto-Retrain Cron ✅ COMPLETE
Use accumulated agent_query_logs to retrain IntentClassifier.

**Files:**
- `packages/backend/app/modules/shared/services/nlp_retrain_service.py` — NEW (orchestrator)
- `packages/backend/app/modules/service_requests/api/cron_routes.py` — ADD endpoint
- `packages/backend/app/modules/shared/services/nlp_preprocessor.py` — FIX normalize_text in retrain()

**Verification Checklist — Phase 3:**
- [x] Cron endpoint `POST /cron/retrain-nlp-classifier` protected (verify_cron_auth)
- [x] Cold start: < 50 samples → skip (tested with 0 samples: "skipped_cold_start")
- [x] Model serialized: joblib.dump → base64 → Redis (7-day TTL)
- [x] All instances pick up model via load_from_redis() on next request
- [x] Held-out 20% accuracy evaluation (reported in response)
- [x] Model metadata tracked in Redis (`nlp:intent_classifier:metadata`, 8-day TTL)
- [x] normalize_text applied during retrain (consistency with predict)
- [x] Training data deduplicated (same question+intent = 1 sample)
- [x] Redis roundtrip tested: save → load → predict = same intent

### Phase 4: spaCy Lemmatization + NER — SKIPPED
**Decision:** normalize_text() already handles accent stripping + typo correction.
spaCy adds 50MB+ Docker size for marginal lemmatization benefit.
TF-IDF strip_accents="unicode" + our normalize_text = sufficient.
Skip directly to Phase 5 (embeddings = real impact).

### Phase 5: Vertex AI Embeddings + Dynamic Few-Shot ✅ COMPLETE
**Dependencies:** `google-cloud-aiplatform` (already in requirements), `pgvector` (v0.8.0 installed)

**Architecture (dual-mode):**
- **Mode A (pgvector)**: Vertex AI `text-multilingual-embedding-002` (768-dim) + pgvector `<=>` cosine distance
  - SEMANTIC similarity: understands "plata" ~ "dinero" ~ "ingresos"
  - Embeddings computed fire-and-forget in `_log_query()`, stored in `agent_query_logs.embedding`
  - pgvector IVFFlat index (lists=10) for sub-ms similarity search
  - Activates automatically when embeddings accumulate (>= 10 with non-null embedding)
- **Mode B (TF-IDF fallback)**: IntentClassifier's TF-IDF vectorizer cosine in Python
  - LEXICAL similarity: ~1ms in-memory, no API call, no pgvector needed
  - Used during cold start (no embeddings) or if Vertex AI unavailable
- Top-3 similar past successes injected as `[EJEMPLOS SIMILARES EXITOSOS]` in enriched prompt
- Embeddings cached in Redis (1h TTL), logs cached (1h TTL)
- Cold start guard: < 10 successful logs → no few-shot (current behavior unchanged)

**Files modified:**
- `packages/backend/app/modules/shared/services/few_shot_retriever.py` — NEW (dual-mode retriever)
- `packages/backend/app/modules/shared/services/embedding_service.py` — NEW (Vertex AI embeddings)
- `packages/backend/database/migrations/174_agent_query_logs_embedding.sql` — NEW (vector column + indexes)
- `packages/backend/app/modules/shared/services/nlp_preprocessor.py` — UPDATE (few_shot_section param)
- `packages/backend/app/modules/shared/services/base_analyst_service.py` — UPDATE (embed + few-shot integration)

**Verification Checklist — Phase 5:**
- [x] Migration 174 applied: `embedding vector(768)` column + IVFFlat index + composite index
- [x] Python syntax check passes on all 4 modified/new files
- [x] TF-IDF cosine similarity works correctly (top match sim=0.504 for "ingresos totales del mes")
- [x] `format_few_shot_prompt()` produces correct `[EJEMPLOS SIMILARES EXITOSOS]` section
- [x] `build_enriched_prompt()` accepts `few_shot_section` param, injects between context and question
- [x] `_log_query()` computes embedding fire-and-forget (non-blocking, exception-safe)
- [x] `get_few_shot_examples()` tries pgvector first, falls back to TF-IDF
- [x] Cold start guard: < 10 logs → empty examples (no regression)
- [x] Embedding cache: Redis 1h TTL keyed by SHA256 hash
- [x] pgvector search: `1 - (embedding <=> $1::vector)` = cosine similarity
- [ ] E2E: question → embedding stored in agent_query_logs (requires deployed backend)
- [ ] E2E: with 10+ embeddings, pgvector search returns relevant examples

---

## Technical Decisions Log

| Decision | Rationale |
|----------|-----------|
| TF-IDF + LR, not transformer embeddings | 275-sample dataset → transformer overfit, LR generalizes; 0.3ms vs 500ms inference |
| 524 seed examples (45-55×11) | Extended from 275; covers Treasury + Admin + typos + FR/EN |
| Gemini choices as ground truth | Distant supervision — free labels, no annotation cost |
| sklearn (already in requirements) | Zero new dependencies for P1+P2 |
| Fire-and-forget logging (create_task) | Never adds latency to user-facing response |
| Seed model always available | No cold start — seeds trained synchronously at import |
| Redis for model distribution | Multi-instance (Cloud Run scales) — all instances get the same retrained model |
| Dual-mode few-shot (pgvector + TF-IDF) | pgvector for semantic similarity when embeddings available; TF-IDF as zero-cost fallback |
| text-multilingual-embedding-002 (768d) | Multilingual (ES/FR/EN), 768-dim, already in google-cloud-aiplatform |
| IVFFlat lists=10 | Appropriate for < 10K rows; bump to 100 when > 50K |
| Embedding in _log_query() | Fire-and-forget: embedding computed after response sent, never blocks user |

---

## Files Reference

| File | Phase | Change |
|------|-------|--------|
| `shared/services/nlp_preprocessor.py` | P1,P5 | ML classifier + few_shot_section param |
| `database/migrations/173_agent_query_logs.sql` | P2 | NEW — query logs table |
| `database/migrations/174_agent_query_logs_embedding.sql` | P5 | NEW — vector column + indexes |
| `shared/services/base_analyst_service.py` | P2,P5 | _log_query (embedding) + few-shot integration |
| `treasury_analyst_service.py` | P2 | _get_agent_type = "treasury" |
| `admin_assistant_service.py` | P2 | _get_agent_type = "admin" |
| `shared/services/nlp_retrain_service.py` | P3 | NEW — weekly retrain cron |
| `service_requests/api/cron_routes.py` | P3 | retrain endpoint |
| `shared/services/few_shot_retriever.py` | P5 | NEW — dual-mode similar query retriever |
| `shared/services/embedding_service.py` | P5 | NEW — Vertex AI embedding service |
