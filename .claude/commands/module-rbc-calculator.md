# RBC Calculator Module Command

Implement or enhance the Rule-Based Calculator (RBC) module for fiscal service tariff calculation.

## Context

**RBC Calculator Module** is the tariff calculation engine for TaxasGE:
- **Base Calculations** (fixed, percentage, unit-based, tiered, formula-based)
- **Penalty Management** (late payment, express service, duplicata)
- **Validation** (tariff validity, service status, eligibility)
- **Caching** (Redis for performance)
- **Integration** (CloudAMQP message queue)

## Documentation Reference

**IMPORTANT:** Read the full specification before implementation:
```bash
Read Documentations/workflow/AGENT_RBC_CALCULATOR_SPECIFICATION.md
```

## Existing Implementation

**Backend Module:** `packages/backend/app/modules/fiscal_services/`

**Key Files:**
- `services/calculation_service.py` - Current calculation service (to be refactored)
- `models/fiscal_service.py` - Pydantic models (CalculationInput, CalculationResult)
- `api/fiscal_service_routes.py` - Existing `/calculate` endpoint

**Database Schema:**
```sql
fiscal_services:
  - tasa_expedicion NUMERIC -- Fixed expedition fee
  - tasa_renovacion NUMERIC -- Fixed renewal fee
  - calculation_method calculation_method_enum -- Method type
  - base_percentage NUMERIC -- For percentage_based
  - unit_rate NUMERIC -- For unit_based
  - rate_tiers JSONB -- For tiered_rates
  - calculation_config JSONB -- For formula_based
  - late_penalty_percentage NUMERIC -- Default penalty rate
  - late_penalty_fixed NUMERIC -- Fixed penalty amount
  - penalty_calculation_rules JSONB -- Custom penalty rules
  - grace_period_days INTEGER -- Days before penalty applies
  - tariff_effective_from DATE -- Validity start
  - tariff_effective_to DATE -- Validity end
```

## Architecture

### Calculation Methods (8 types)

| Method | Description | Formula |
|--------|-------------|---------|
| `fixed_expedition` | Fixed fee for first issuance | `tasa_expedicion` |
| `fixed_renewal` | Fixed fee for renewal only | `tasa_renovacion` |
| `fixed_both` | Same fee for both | `tasa_expedicion` |
| `percentage_based` | % of base value | `base_value × rate%` |
| `unit_based` | Price per unit | `unit_rate × quantity` |
| `tiered_rates` | Progressive brackets | `Σ(tier_amount × tier_rate)` |
| `formula_based` | Custom expression | `eval(formula, variables)` |
| `fixed_plus_unit` | Base + per unit | `base + (unit × qty)` |

### Penalty System

| Type | Rate | Description |
|------|------|-------------|
| Late (1-30 days) | +5% | Standard late fee tier 1 |
| Late (31-60 days) | +10% | Standard late fee tier 2 |
| Late (61-90 days) | +15% | Standard late fee tier 3 |
| Late (>90 days) | +25% | Maximum late fee |
| Express Service | +50% | 24h processing |
| Urgent Service | +100% | Same-day processing |
| Duplicata | +25% | Replacement document |
| Modification | 10,000 XAF | Post-validation change |

**Maximum Penalty:** 50% of base amount (legal cap)

### Target Module Structure

```
packages/backend/app/modules/rbc/
├── __init__.py
├── api/
│   └── rbc_routes.py              # API endpoints
├── models/
│   ├── __init__.py
│   ├── calculation.py             # Request/Response models
│   ├── penalty.py                 # Penalty models
│   └── exceptions.py              # Custom exceptions
├── services/
│   ├── __init__.py
│   ├── rbc_service.py             # Main orchestration
│   ├── base_calculator.py         # 8 calculation methods
│   ├── penalty_calculator.py      # Penalty calculations
│   ├── express_calculator.py      # Express/duplicata fees
│   ├── validation_service.py      # Tariff validation
│   └── formula_evaluator.py       # Safe formula eval
├── repositories/
│   ├── __init__.py
│   ├── tariff_repository.py       # DB access
│   └── penalty_repository.py      # Penalty rules access
├── cache/
│   └── tariff_cache.py            # Redis caching
└── workers/
    └── rbc_worker.py              # CloudAMQP consumer
```

## Instructions

### Step 1: Read Existing Implementation
```bash
Read packages/backend/app/modules/fiscal_services/services/calculation_service.py
Read packages/backend/app/modules/fiscal_services/models/fiscal_service.py
Read Documentations/workflow/AGENT_RBC_CALCULATOR_SPECIFICATION.md
```

### Step 2: Understand Current State

**Implemented:**
- [x] 8 calculation methods (base calculator)
- [x] Pydantic models (CalculationInput, CalculationResult)
- [x] API endpoint `/calculate`
- [x] Database columns for penalties (not used)

**Needs Implementation:**
- [ ] Penalty calculations (late_payment, express, etc.)
- [ ] Safe formula evaluator (replace eval())
- [ ] Tariff validity validation
- [ ] Redis caching
- [ ] Idempotency handling
- [ ] CloudAMQP worker
- [ ] Audit trail (calculation_history)
- [ ] New penalty_rules table

### Step 3: Use Subagents for Development

Launch 3 subagents in parallel for comprehensive RBC implementation:

#### Subagent 1: Refactoring & Penalty Calculator
```markdown
Task: Refactor calculation service and implement penalty system

1. Create new module structure:
   ```
   packages/backend/app/modules/rbc/
   ├── __init__.py
   ├── models/
   │   ├── __init__.py
   │   ├── calculation.py
   │   ├── penalty.py
   │   └── exceptions.py
   └── services/
       ├── __init__.py
       ├── base_calculator.py
       ├── penalty_calculator.py
       └── express_calculator.py
   ```

2. Migrate BaseCalculator from calculation_service.py:
   - Keep all 8 methods (fixed_*, percentage, unit, tiered, formula)
   - Improve type safety with Pydantic
   - Add detailed breakdowns

3. Implement PenaltyCalculator:
   ```python
   class PenaltyCalculator:
       DEFAULT_PENALTY_TIERS = [
           {"days_from": 1, "days_to": 30, "rate": 5.0},
           {"days_from": 31, "days_to": 60, "rate": 10.0},
           {"days_from": 61, "days_to": 90, "rate": 15.0},
           {"days_from": 91, "days_to": None, "rate": 25.0},
       ]
       MAX_PENALTY_PERCENTAGE = 50.0

       async def calculate_late_penalty(
           self,
           base_amount: float,
           due_date: date,
           payment_date: date,
           custom_rules: Optional[Dict] = None
       ) -> PenaltyBreakdown:
           # Implement tiered penalty calculation
           # Apply max cap (50%)
           pass
   ```

4. Implement ExpressCalculator:
   ```python
   class ExpressCalculator:
       MODIFIERS = {
           "express": {"rate": 50.0, "type": "percentage"},
           "urgent": {"rate": 100.0, "type": "percentage"},
           "duplicate": {"rate": 25.0, "type": "percentage"},
           "modification": {"amount": 10000, "type": "fixed"},
       }

       async def calculate_modifier(
           self,
           base_amount: float,
           modifier_type: str
       ) -> ModifierBreakdown:
           pass
   ```

5. Implement SafeFormulaEvaluator:
   - Use ast module for safe parsing
   - Only allow +, -, *, /, %, **
   - Only allow min(), max(), abs(), round() functions
   - Validate all variables exist

6. Unit Tests:
   - test_base_calculator.py (all 8 methods)
   - test_penalty_calculator.py (all tiers + cap)
   - test_express_calculator.py (all modifiers)
   - test_formula_evaluator.py (security + math)

Return: Refactored calculators with full test coverage
```

#### Subagent 2: Validation, Caching & API
```markdown
Task: Implement validation, Redis caching, and API endpoints

1. Create ValidationService:
   ```python
   class ValidationService:
       async def validate_tariff(
           self,
           service_id: int,
           calculation_date: date = None
       ) -> TariffValidation:
           # Check tariff_effective_from/to
           # Check service status (active)
           # Return validation result

       async def check_eligibility(
           self,
           service_id: int,
           user_context: Dict
       ) -> EligibilityResult:
           # Check eligibility_criteria
           # Check exemption_conditions
           pass
   ```

2. Create TariffCache (Redis):
   ```python
   class TariffCache:
       TTL_SECONDS = 3600  # 1 hour

       async def get_tariff(self, service_id: int) -> Optional[Dict]:
           key = f"tariff:{service_id}"
           cached = await redis.get(key)
           return json.loads(cached) if cached else None

       async def set_tariff(self, service_id: int, tariff: Dict):
           key = f"tariff:{service_id}"
           await redis.setex(key, self.TTL_SECONDS, json.dumps(tariff))

       async def invalidate(self, service_id: int):
           await redis.delete(f"tariff:{service_id}")

       async def check_idempotency(
           self,
           idempotency_key: str
       ) -> Optional[CalculationResult]:
           # Check if same calculation was done recently
           pass
   ```

3. Create RBC API Routes:
   ```python
   router = APIRouter(prefix="/rbc", tags=["rbc"])

   @router.post("/calculate", response_model=CalculationResult)
   async def calculate_tariff(
       request: CalculationRequest,
       db = Depends(get_database),
       current_user = Depends(get_current_user)
   ):
       # Validate tariff
       # Check cache
       # Calculate base + penalties + modifiers
       # Save to history
       # Return result
       pass

   @router.post("/calculate-batch")
   async def calculate_batch(request: BatchCalculationRequest):
       pass

   @router.get("/penalty-rules")
   async def get_penalty_rules():
       pass

   @router.get("/tariff-validity/{service_id}")
   async def check_tariff_validity(service_id: int):
       pass
   ```

4. Create Repositories:
   - TariffRepository (get service with caching)
   - PenaltyRepository (get penalty rules)
   - HistoryRepository (save calculation history)

5. Integration Tests:
   - test_rbc_api.py (all endpoints)
   - test_tariff_cache.py (cache hit/miss)
   - test_validation.py (validity checks)

Return: Complete API with caching and validation
```

#### Subagent 3: Database & CloudAMQP Worker
```markdown
Task: Create database migrations and CloudAMQP integration

1. Create SQL Migrations:
   ```sql
   -- 001_create_penalty_rules_table.sql
   CREATE TABLE IF NOT EXISTS penalty_rules (
       id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
       rule_code VARCHAR(50) UNIQUE NOT NULL,
       rule_name VARCHAR(100) NOT NULL,
       penalty_type VARCHAR(30) NOT NULL,
       calculation_method VARCHAR(20) NOT NULL,
       rate DECIMAL(8,4),
       fixed_amount DECIMAL(15,2),
       tiers JSONB DEFAULT '[]'::jsonb,
       max_percentage DECIMAL(8,4) DEFAULT 50.0,
       conditions JSONB DEFAULT '{}'::jsonb,
       effective_from DATE DEFAULT CURRENT_DATE,
       effective_until DATE,
       is_active BOOLEAN DEFAULT true,
       created_at TIMESTAMPTZ DEFAULT NOW(),
       updated_at TIMESTAMPTZ DEFAULT NOW()
   );

   -- Insert default rules
   INSERT INTO penalty_rules (rule_code, rule_name, penalty_type, calculation_method, tiers)
   VALUES (
       'LATE_DEFAULT', 'Standard Late Payment', 'late_payment', 'tiered',
       '[{"days_from":1,"days_to":30,"rate":5.0},
         {"days_from":31,"days_to":60,"rate":10.0},
         {"days_from":61,"days_to":90,"rate":15.0},
         {"days_from":91,"days_to":null,"rate":25.0}]'::jsonb
   );

   -- 002_update_calculation_history.sql
   ALTER TABLE calculation_history ADD COLUMN IF NOT EXISTS
       service_request_id UUID REFERENCES service_requests(id);
   ALTER TABLE calculation_history ADD COLUMN IF NOT EXISTS
       penalties_amount NUMERIC DEFAULT 0;
   ALTER TABLE calculation_history ADD COLUMN IF NOT EXISTS
       modifiers_amount NUMERIC DEFAULT 0;
   ALTER TABLE calculation_history ADD COLUMN IF NOT EXISTS
       total_amount NUMERIC;
   ALTER TABLE calculation_history ADD COLUMN IF NOT EXISTS
       penalty_breakdown JSONB DEFAULT '{}'::jsonb;
   ALTER TABLE calculation_history ADD COLUMN IF NOT EXISTS
       idempotency_key VARCHAR(100) UNIQUE;
   ```

2. Create RBC Worker (CloudAMQP):
   ```python
   class RBCWorker:
       def __init__(self, rbc_service: RBCService, amqp_url: str):
           self.rbc_service = rbc_service
           self.amqp_url = amqp_url
           self.queue_name = "calculations"

       async def start(self):
           connection = await aio_pika.connect_robust(self.amqp_url)
           channel = await connection.channel()
           await channel.set_qos(prefetch_count=20)

           queue = await channel.declare_queue(
               self.queue_name,
               durable=True,
               arguments={
                   "x-message-ttl": 300000,
                   "x-dead-letter-exchange": "dlx"
               }
           )

           await queue.consume(self._process_message)

       async def _process_message(self, message: IncomingMessage):
           async with message.process():
               try:
                   data = json.loads(message.body)
                   result = await self.rbc_service.calculate_full(...)
                   await self._publish_result(data, result)
               except Exception as e:
                   if data.get("retry_count", 0) < 2:
                       await self._requeue(message)
                   else:
                       await self._send_to_dlq(message, str(e))
   ```

3. Create Message Schemas:
   ```python
   @dataclass
   class CalculationMessage:
       message_id: str
       correlation_id: str
       service_request_id: str
       fiscal_service_id: int
       extracted_data: Dict
       is_renewal: bool
       is_express: bool
       due_date: Optional[date]
       variables: Optional[Dict]
       retry_count: int = 0

   @dataclass
   class CalculationResultMessage:
       message_id: str
       correlation_id: str
       status: str
       base_amount: float
       penalties: float
       modifiers: float
       total_amount: float
       breakdown: Dict
   ```

4. Create Main RBC Service (Orchestration):
   ```python
   class RBCService:
       def __init__(
           self,
           base_calc: BaseCalculator,
           penalty_calc: PenaltyCalculator,
           express_calc: ExpressCalculator,
           validation_svc: ValidationService,
           cache: TariffCache,
           tariff_repo: TariffRepository,
           history_repo: HistoryRepository
       ):
           ...

       async def calculate_full(
           self,
           fiscal_service_id: int,
           is_renewal: bool = False,
           is_express: bool = False,
           is_duplicate: bool = False,
           due_date: Optional[date] = None,
           payment_date: Optional[date] = None,
           base_value: Optional[float] = None,
           quantity: Optional[int] = None,
           variables: Optional[Dict] = None,
           idempotency_key: Optional[str] = None
       ) -> FullCalculationResult:
           # 1. Check idempotency
           # 2. Validate tariff
           # 3. Get service (with cache)
           # 4. Calculate base amount
           # 5. Calculate penalties
           # 6. Calculate modifiers
           # 7. Sum total
           # 8. Save to history
           # 9. Return result
           pass
   ```

5. Add Worker Entry Point:
   ```python
   # scripts/run_rbc_worker.py
   async def main():
       settings = get_settings()
       rbc_service = await create_rbc_service()
       worker = RBCWorker(rbc_service, settings.CLOUDAMQP_URL)
       await worker.start()

   if __name__ == "__main__":
       asyncio.run(main())
   ```

Return: Database migrations, CloudAMQP worker, orchestration service
```

## Key Features

### 1. Multiple Calculation Methods
- 8 built-in methods covering all fiscal scenarios
- Safe formula evaluation for custom calculations
- Tiered progressive rates (like income tax)

### 2. Penalty System
- Automatic late payment penalties
- Express/urgent service surcharges
- Duplicata fees
- Modification charges
- Legal cap at 50%

### 3. Validation
- Tariff validity period check
- Service status verification
- Eligibility criteria evaluation
- Exemption conditions

### 4. Performance
- Redis caching (1-hour TTL)
- Idempotency for duplicate requests
- Batch calculation support
- <200ms p99 latency

### 5. Integration
- CloudAMQP worker for async processing
- Audit trail in calculation_history
- Workflow engine integration

## Use Cases

### Simple Fixed Fee
```python
# Input
{
    "fiscal_service_id": 123,
    "is_renewal": false
}

# Output
{
    "base_amount": 15000,
    "penalties": 0,
    "modifiers": 0,
    "total_amount": 15000,
    "currency": "XAF"
}
```

### With Late Penalty + Express
```python
# Input
{
    "fiscal_service_id": 123,
    "is_renewal": false,
    "is_express": true,
    "due_date": "2025-11-15",
    "payment_date": "2025-12-21"  # 36 days late
}

# Output
{
    "base_amount": 100000,
    "penalties": 10000,        # 10% (31-60 days)
    "modifiers": 50000,        # 50% express
    "total_amount": 160000,
    "currency": "XAF",
    "penalty_breakdown": {
        "days_late": 36,
        "tier": "31-60 days",
        "rate": 10.0
    },
    "modifier_breakdown": [
        {"type": "express", "rate": 50.0, "amount": 50000}
    ]
}
```

### Percentage-Based with Contract Value
```python
# Input
{
    "fiscal_service_id": 456,
    "is_renewal": false,
    "base_value": 10000000  # Contract value
}

# Output (0.5% rate)
{
    "base_amount": 50000,
    "penalties": 0,
    "modifiers": 0,
    "total_amount": 50000
}
```

## Testing Scenarios

### Happy Path
1. Calculate fixed fee → Returns tasa_expedicion
2. Calculate percentage → Returns base_value × rate
3. Calculate tiered → Returns progressive sum
4. Calculate with express → Adds 50% modifier

### Penalty Scenarios
1. On-time payment → No penalty
2. 15 days late → 5% penalty
3. 45 days late → 10% penalty
4. 100 days late → 25% penalty (capped at 50% if >200%)

### Validation Errors
1. Expired tariff → TariffExpired error
2. Inactive service → ServiceInactive error
3. Missing base_value for percentage → ValidationError

## Checklist

- [ ] Read existing calculation_service.py
- [ ] Read AGENT_RBC_CALCULATOR_SPECIFICATION.md
- [ ] Create new module structure app/modules/rbc/
- [ ] Migrate base calculator (8 methods)
- [ ] Implement penalty calculator (tiered + cap)
- [ ] Implement express calculator (modifiers)
- [ ] Implement safe formula evaluator
- [ ] Implement validation service (tariff validity)
- [ ] Add Redis caching (TariffCache)
- [ ] Create penalty_rules table (migration)
- [ ] Update calculation_history table
- [ ] Create API endpoints (/calculate, etc.)
- [ ] Implement CloudAMQP worker
- [ ] Unit tests for all calculators
- [ ] Integration tests for API
- [ ] Test with real fiscal services
- [ ] Update main.py router registration
