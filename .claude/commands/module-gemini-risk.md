# Gemini Risk Analysis Module Command

Implement the Gemini-powered risk analysis agent for fraud detection and workflow recommendations.

## Context

**Gemini Risk Analysis Module** provides AI-powered analysis for TaxasGE:
- **Risk Scoring** (calculate fraud/error probability 0.0-1.0)
- **Coherence Check** (verify inter-document consistency)
- **Fraud Detection** (pattern recognition for anomalies)
- **Workflow Recommendation** (auto_approve, manual_review, reject)
- **Classification Fallback** (when Document AI confidence is low)

## Documentation Reference

**IMPORTANT:** Read architecture documentation first:
```bash
Read Documentations/workflow/RAPPORT_ARCHITECTURE_AGENTS_IA.md
```

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    GEMINI RISK ANALYSIS FLOW                                 │
└─────────────────────────────────────────────────────────────────────────────┘

  Document AI Output     User History        Service Context
         │                    │                    │
         └────────────────────┼────────────────────┘
                              │
                              ▼
                    ┌─────────────────────┐
                    │   GEMINI 2.0 FLASH  │
                    │   ─────────────────  │
                    │                     │
                    │   System Prompt:    │
                    │   - Contexte GE     │
                    │   - Règles Article 6│
                    │   - Seuils risque   │
                    │                     │
                    └──────────┬──────────┘
                               │
              ┌────────────────┼────────────────┐
              │                │                │
              ▼                ▼                ▼
       ┌───────────┐    ┌───────────┐    ┌───────────┐
       │ risk_score│    │ coherence │    │ recommend │
       │   0.15    │    │   valid   │    │ auto_approve
       └───────────┘    └───────────┘    └───────────┘
```

## Risk Analysis Functions

### 1. Risk Scoring

**Factors:**
| Factor | Weight | Description |
|--------|--------|-------------|
| Amount > 500,000 XAF | +0.15 | High-value transaction |
| First transaction | +0.10 | New user, less history |
| Unknown NIF | +0.20 | NIF not in system |
| Amount mismatch > 10% | +0.25 | Declared vs calculated differs |
| Document expires < 7 days | +0.10 | Near-expiry documents |
| Past anomalies | +0.30 | Historical fraud alerts |

**Thresholds:**
- `risk_score < 0.30` → `auto_approve`
- `risk_score 0.30-0.60` → `manual_review`
- `risk_score 0.60-0.80` → `request_documents`
- `risk_score > 0.80` → `reject`

### 2. Coherence Check

**Verifications:**
- NIF format valid
- Dates logical (emission < expiration)
- Amounts within expected range
- Name matches across documents
- Document not expired

### 3. Fraud Detection

**Patterns:**
- Duplicate submissions
- Unusual transaction timing
- Geographic anomalies
- Value manipulation
- Identity inconsistencies

## Target Module Structure

```
packages/backend/app/modules/gemini_risk/
├── __init__.py
├── api/
│   └── risk_routes.py             # API endpoints
├── models/
│   ├── __init__.py
│   ├── risk_analysis.py           # Risk models
│   └── prompts.py                 # System prompts
├── services/
│   ├── __init__.py
│   ├── risk_analyzer_service.py   # Main risk analysis
│   ├── coherence_service.py       # Inter-doc validation
│   ├── fraud_detector_service.py  # Pattern detection
│   └── gemini_client.py           # Gemini API wrapper
├── repositories/
│   └── user_history_repository.py # Get user transaction history
├── workers/
│   └── risk_worker.py             # CloudAMQP consumer
└── config/
    └── risk_config.py             # Thresholds, weights
```

## Instructions

### Step 1: Read Existing Implementation
```bash
Read packages/backend/app/modules/chatbot/services/gemini_service.py
Read Documentations/workflow/RAPPORT_ARCHITECTURE_AGENTS_IA.md (Section 4)
```

### Step 2: Use Subagents for Development

Launch 3 subagents in parallel:

#### Subagent 1: Risk Scoring Service
```markdown
Task: Implement Gemini-based risk scoring

1. Create Risk Prompts (models/prompts.py):
   ```python
   RISK_ANALYSIS_PROMPT = """
   Tu es un agent d'analyse de risque fiscal pour TaxasGE, la plateforme officielle
   de services fiscaux de Guinée Équatoriale.

   ## CONTEXTE
   Service demandé: {service_name}
   Type de workflow: {workflow_type}
   Montant calculé: {calculated_amount} XAF

   ## DONNÉES EXTRAITES DU DOCUMENT
   {extracted_entities_json}

   ## HISTORIQUE UTILISATEUR
   - Transactions précédentes: {transaction_count}
   - Taux de succès: {success_rate}%
   - Alertes passées: {past_alerts}
   - Ancienneté compte: {account_age_days} jours

   ## RÈGLES D'ANALYSE

   1. VÉRIFICATIONS OBLIGATOIRES:
      - NIF valide et format correct
      - Dates cohérentes (émission < expiration)
      - Montant correspond au tarif (±5% tolérance)
      - Documents non expirés

   2. INDICATEURS DE RISQUE:
      - Montant > 500,000 XAF → +0.15
      - Première transaction → +0.10
      - NIF inconnu → +0.20
      - Écart montant > 10% → +0.25
      - Document expire < 7 jours → +0.10
      - Anomalie historique → +0.30

   3. SEUILS DE DÉCISION:
      - < 0.30 → "auto_approve"
      - 0.30-0.60 → "manual_review"
      - 0.60-0.80 → "request_documents"
      - > 0.80 → "reject"

   ## FORMAT DE RÉPONSE (JSON strict)
   {
     "risk_score": 0.15,
     "risk_level": "low",
     "risk_factors": [...],
     "coherence": {...},
     "fraud_indicators": [],
     "recommendation": "auto_approve",
     "justification": "...",
     "required_actions": [],
     "confidence": 0.92
   }
   """

   CLASSIFICATION_FALLBACK_PROMPT = """
   Document AI n'a pas pu classifier ce document avec confiance suffisante.
   Analyse le texte OCR suivant et détermine le type de document.

   TEXTE OCR:
   {ocr_text}

   TYPES POSSIBLES:
   - nota_ingreso, dni_cni, passeport, permis_conduire
   - licence_commerce, contrat, facture, demande_officielle
   - certificat, autre

   RÉPONSE (JSON):
   {"document_type": "...", "confidence": 0.XX, "reasoning": "..."}
   """
   ```

2. Create GeminiClient wrapper:
   ```python
   from google.cloud import aiplatform
   from vertexai.generative_models import GenerativeModel

   class GeminiClient:
       def __init__(self):
           aiplatform.init(
               project=settings.GOOGLE_CLOUD_PROJECT,
               location=settings.VERTEX_AI_LOCATION
           )
           self.model = GenerativeModel(settings.GEMINI_MODEL)

       async def generate(
           self,
           prompt: str,
           response_schema: Optional[Dict] = None
       ) -> str:
           response = await self.model.generate_content_async(
               prompt,
               generation_config={
                   "temperature": 0.1,
                   "max_output_tokens": 2048,
                   "response_mime_type": "application/json"
               }
           )
           return response.text
   ```

3. Create RiskAnalyzerService:
   ```python
   class RiskAnalyzerService:
       def __init__(
           self,
           gemini_client: GeminiClient,
           user_history_repo: UserHistoryRepository
       ):
           self.gemini = gemini_client
           self.history_repo = user_history_repo

       async def analyze_risk(
           self,
           service_request_id: str,
           extracted_entities: Dict,
           calculated_amount: float,
           service_info: Dict,
           user_id: str
       ) -> RiskAnalysisResult:
           # Get user history
           history = await self.history_repo.get_user_history(user_id)

           # Build prompt
           prompt = RISK_ANALYSIS_PROMPT.format(
               service_name=service_info["name"],
               workflow_type=service_info["workflow_type"],
               calculated_amount=calculated_amount,
               extracted_entities_json=json.dumps(extracted_entities),
               transaction_count=history.transaction_count,
               success_rate=history.success_rate,
               past_alerts=history.past_alerts,
               account_age_days=history.account_age_days
           )

           # Get Gemini response
           response_text = await self.gemini.generate(prompt)
           result = json.loads(response_text)

           return RiskAnalysisResult(
               risk_score=result["risk_score"],
               risk_level=result["risk_level"],
               risk_factors=result["risk_factors"],
               coherence=result["coherence"],
               recommendation=result["recommendation"],
               justification=result["justification"],
               confidence=result["confidence"]
           )
   ```

Return: Risk prompts, Gemini client, risk analyzer service
```

#### Subagent 2: Coherence & Fraud Detection
```markdown
Task: Implement coherence checking and fraud detection

1. Create CoherenceService:
   ```python
   class CoherenceService:
       async def check_coherence(
           self,
           entities: Dict[str, Any],
           document_type: str
       ) -> CoherenceResult:
           checks_passed = []
           checks_failed = []
           warnings = []

           # Check NIF format
           nif = entities.get("nif_demandeur", {}).get("value")
           if nif:
               if self._validate_nif_format(nif):
                   checks_passed.append("nif_format")
               else:
                   checks_failed.append("nif_format")

           # Check date logic
           emission = entities.get("date_emission", {}).get("value")
           expiration = entities.get("date_expiration", {}).get("value")
           if emission and expiration:
               if self._dates_logical(emission, expiration):
                   checks_passed.append("date_validity")
               else:
                   checks_failed.append("date_validity")

           # Check amount range
           amount = entities.get("montant", {}).get("value")
           if amount:
               if self._amount_reasonable(amount, document_type):
                   checks_passed.append("amount_range")
               else:
                   warnings.append("amount_unusually_high")

           # Check document not expired
           if expiration:
               if not self._is_expired(expiration):
                   checks_passed.append("not_expired")
               else:
                   checks_failed.append("document_expired")

           return CoherenceResult(
               is_valid=len(checks_failed) == 0,
               checks_passed=checks_passed,
               checks_failed=checks_failed,
               warnings=warnings
           )

       def _validate_nif_format(self, nif: str) -> bool:
           # GE NIF format: XXXXXXXXX (9 digits)
           pattern = r"^[A-Z]?\d{8,9}$"
           return bool(re.match(pattern, nif.upper()))

       def _dates_logical(self, emission: str, expiration: str) -> bool:
           emission_date = date.fromisoformat(emission)
           expiration_date = date.fromisoformat(expiration)
           return emission_date < expiration_date
   ```

2. Create FraudDetectorService:
   ```python
   class FraudDetectorService:
       async def detect_fraud_patterns(
           self,
           service_request_id: str,
           user_id: str,
           entities: Dict,
           amount: float
       ) -> List[FraudIndicator]:
           indicators = []

           # Check for duplicate submission
           duplicate = await self._check_duplicate_submission(
               user_id, entities
           )
           if duplicate:
               indicators.append(FraudIndicator(
                   type="duplicate_submission",
                   severity="high",
                   details={"original_request_id": duplicate.id}
               ))

           # Check unusual timing
           timing = await self._check_unusual_timing(user_id)
           if timing:
               indicators.append(FraudIndicator(
                   type="unusual_timing",
                   severity="medium",
                   details={"pattern": timing}
               ))

           # Check amount manipulation
           if await self._check_amount_manipulation(amount, entities):
               indicators.append(FraudIndicator(
                   type="amount_manipulation",
                   severity="high",
                   details={"declared": entities.get("montant"), "expected": amount}
               ))

           # Check identity inconsistency
           if await self._check_identity_mismatch(user_id, entities):
               indicators.append(FraudIndicator(
                   type="identity_mismatch",
                   severity="critical",
                   details={"field": "nif"}
               ))

           return indicators

       async def _check_duplicate_submission(
           self,
           user_id: str,
           entities: Dict
       ) -> Optional[ServiceRequest]:
           # Look for same NIF + service in last 24h
           pass

       async def _check_amount_manipulation(
           self,
           calculated: float,
           entities: Dict
       ) -> bool:
           declared = entities.get("montant", {}).get("value", 0)
           if declared and calculated:
               diff = abs(declared - calculated) / calculated
               return diff > 0.10  # >10% difference
           return False
   ```

3. Create UserHistoryRepository:
   ```python
   class UserHistoryRepository:
       async def get_user_history(
           self,
           user_id: str
       ) -> UserHistory:
           query = """
               SELECT
                   COUNT(*) as transaction_count,
                   AVG(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) * 100 as success_rate,
                   COUNT(CASE WHEN has_alert = true THEN 1 END) as past_alerts,
                   EXTRACT(DAY FROM NOW() - MIN(created_at)) as account_age_days
               FROM service_requests
               WHERE user_id = $1
           """
           row = await self.db.fetchrow(query, user_id)
           return UserHistory(**dict(row))
   ```

Return: Coherence service, fraud detector, user history repository
```

#### Subagent 3: Worker & API
```markdown
Task: Create CloudAMQP worker and API endpoints

1. Create RiskWorker:
   ```python
   class RiskWorker:
       QUEUE_NAME = "risk-analysis"

       async def start(self):
           connection = await aio_pika.connect_robust(settings.CLOUDAMQP_URL)
           channel = await connection.channel()
           await channel.set_qos(prefetch_count=10)

           queue = await channel.declare_queue(
               self.QUEUE_NAME,
               durable=True,
               arguments={
                   "x-message-ttl": 3600000,  # 1h
                   "x-dead-letter-exchange": "dlx"
               }
           )

           await queue.consume(self._process_message)

       async def _process_message(self, message: IncomingMessage):
           async with message.process():
               data = json.loads(message.body)

               # Perform risk analysis
               result = await risk_analyzer.analyze_risk(
                   service_request_id=data["service_request_id"],
                   extracted_entities=data["extracted_entities"],
                   calculated_amount=data["calculated_amount"],
                   service_info=data["service_info"],
                   user_id=data["user_id"]
               )

               # Update service request
               await service_request_repo.update_risk_analysis(
                   data["service_request_id"],
                   result
               )

               # Route based on recommendation
               if result.recommendation == "auto_approve":
                   await self._publish_to_payment_queue(data)
               elif result.recommendation == "manual_review":
                   await self._assign_to_agent(data)
               else:
                   await self._notify_rejection(data, result)
   ```

2. Create API Endpoints:
   ```python
   router = APIRouter(prefix="/risk", tags=["risk-analysis"])

   @router.post("/analyze", response_model=RiskAnalysisResult)
   async def analyze_risk(
       request: RiskAnalysisRequest,
       current_user = Depends(get_current_user)
   ):
       return await risk_analyzer.analyze_risk(
           service_request_id=request.service_request_id,
           extracted_entities=request.extracted_entities,
           calculated_amount=request.calculated_amount,
           service_info=request.service_info,
           user_id=str(current_user.id)
       )

   @router.post("/classify-fallback", response_model=ClassificationResult)
   async def classify_with_gemini(
       request: ClassificationFallbackRequest
   ):
       prompt = CLASSIFICATION_FALLBACK_PROMPT.format(ocr_text=request.ocr_text)
       response = await gemini_client.generate(prompt)
       return ClassificationResult(**json.loads(response))

   @router.get("/thresholds")
   async def get_risk_thresholds():
       return RISK_THRESHOLDS
   ```

3. Create RiskConfig:
   ```python
   # config/risk_config.py
   RISK_THRESHOLDS = {
       "auto_approve": {"max": 0.30},
       "manual_review": {"min": 0.30, "max": 0.60},
       "request_documents": {"min": 0.60, "max": 0.80},
       "reject": {"min": 0.80}
   }

   RISK_WEIGHTS = {
       "high_amount": 0.15,
       "first_transaction": 0.10,
       "unknown_nif": 0.20,
       "amount_mismatch": 0.25,
       "near_expiry": 0.10,
       "past_anomaly": 0.30
   }
   ```

Return: Risk worker, API endpoints, configuration
```

## Environment Variables

```bash
# Already configured for chatbot
GOOGLE_CLOUD_PROJECT=taxasge-dev
VERTEX_AI_LOCATION=us-central1
GEMINI_MODEL=gemini-2.0-flash-exp
```

## Checklist

- [ ] Read existing gemini_service.py
- [ ] Read RAPPORT_ARCHITECTURE_AGENTS_IA.md Section 4
- [ ] Create risk analysis prompts
- [ ] Implement GeminiClient wrapper
- [ ] Implement RiskAnalyzerService
- [ ] Implement CoherenceService
- [ ] Implement FraudDetectorService
- [ ] Create UserHistoryRepository
- [ ] Create CloudAMQP RiskWorker
- [ ] Create API endpoints
- [ ] Configure risk thresholds
- [ ] Test with sample data
- [ ] Integration tests
