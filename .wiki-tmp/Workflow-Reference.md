# Workflow Reference

## Overview

Facil manages 36 predefined workflows for government service requests. Each workflow defines: required documents, form steps, fee calculation, appointment requirements, and processing entity.

## Workflow Codes by Domain

### PASAPORTE - Identity Documents (5 workflows)

Entity: **CNEDOGE** (Centro Nacional de Expedicion de Documentos)

| Code | Description | Appointment |
|------|-------------|-------------|
| `PASAPORTE_NUEVO` | New passport issuance | Yes |
| `PASAPORTE_RENOVACION` | Passport renewal | Yes |
| `PASAPORTE_PERDIDA` | Replacement (loss) | Yes |
| `PASAPORTE_ROBO` | Replacement (theft) | Yes |
| `PASAPORTE_DETERIORO` | Replacement (damage) | Yes |

Features: Minor support, motivo selection, 3 form review pages, OCR for DIP (identity card).

### RESIDENCIA - Residence Permits (2 workflows)

Entity: **EXTRANJERIA** (Direccion General de Extranjeria)

| Code | Description | Appointment |
|------|-------------|-------------|
| `RESIDENCIA_PRIMERA_VEZ` | First-time residence permit | Yes |
| `RESIDENCIA_RENOVACION` | Residence permit renewal | Yes |

Features: Person type selection (SELECTION step), 3 form review pages, dual schema NIF/Autorizacion, work permit validation.

### TRAMITES VISADO - Visa Procedures (4 workflows)

Entity: **EXTRANJERIA**

| Code | Description | Appointment |
|------|-------------|-------------|
| `PRORROGA_VISADO` | Visa extension | No |
| `VISADO_ALTERNATIVO` | Alternative visa (tiered pricing) | No |
| `PERMANENCIA_EXTRANJERIA` | Extended stay (per-month) | No |
| `SALIDA_VISADO_VENCIDO` | Departure with expired visa (overstay penalty) | No |

Tariffs: PRORROGA 20K fixed; ALTERNATIVO tiered (3mo: 20K, 6mo: 40K, 12mo: 80K, 24mo: 600K); PERMANENCIA 50K/month; SALIDA 30K/month auto-calculated overstay.

### VEHICULOS - Vehicle Services (7 workflows)

Entities: **DGT** + **OFIVE** + **ITVE**

| Code | Description | Entity | Appointment |
|------|-------------|--------|-------------|
| `VEHICULO_PRIMERA_MATRICULACION` | First vehicle registration | DGT | No |
| `VEHICULO_TRANSFERENCIA` | Vehicle ownership transfer | DGT | No |
| `VEHICULO_RENOVACION_CUVE` | CUVE sticker renewal | OFIVE | No |
| `VEHICULO_RENOVACION_ITV` | Technical inspection renewal | ITVE | No |
| `VEHICULO_DUPLICADO_PERMISO` | Duplicate vehicle permit | DGT | No |
| `VEHICULO_DUPLICADO_CUVE` | Duplicate CUVE sticker | OFIVE | No |
| `VEHICULO_CAMBIO_CARACTERISTICAS` | Vehicle characteristic change | DGT | No |

### CONTRATO - Contract Registration (7 workflows)

Entity: **ONRC** (Oficina Nacional de Registro de Contratos)

| Code | Description | Appointment |
|------|-------------|-------------|
| `CONTRATO_OBRA` | Construction contract | No |
| `CONTRATO_SERVICIO` | Service contract | No |
| `CONTRATO_SUMINISTRO` | Supply contract | No |
| `CONTRATO_CONCESION` | Concession contract | No |
| `CONTRATO_JOINT_VENTURE` | Joint venture contract | No |
| `CONTRATO_ARRENDAMIENTO` | Lease contract | No |
| `CONTRATO_OTRO` | Other contract type | No |

Features: 3 required + 10 optional documents, percentage-based tariff on contract value.

### CONDUCIR - Driving Licenses (5 workflows)

Entity: **DGT** (Direccion General de Trafico)

| Code | Description | Appointment |
|------|-------------|-------------|
| `CONDUCIR_NUEVO` | New driving license | Yes |
| `CONDUCIR_CANJE` | License exchange (foreign) | Yes |
| `CONDUCIR_RENOVACION` | License renewal | Yes |
| `CONDUCIR_DUPLICADO` | Duplicate license | Yes |
| `CONDUCIR_EXTENSION` | License category extension | Yes |

Features: Motivo selection for DUPLICADO (PERDIDA, ROBO, DETERIORO).

### FUNCION PUBLICA - Civil Service (5 workflows)

Entity: **MINFP** (Ministerio de Funcion Publica)

| Code | Description | Appointment |
|------|-------------|-------------|
| `FP_VERIFICACION_FUNCIONARIO` | Civil servant verification | No |
| `FP_CARNET_FUNCIONARIO` | Civil servant ID card | Yes |
| `FP_PROMOCION_ADMINISTRATIVA` | Administrative promotion | No |
| `FP_PERMISO_EXTRAORDINARIO` | Extraordinary leave permit | No |
| `FP_CERTIFICADO_ADMINISTRATIVO` | Administrative certificate | No |

### BUNDLE / OMS - Commercial Obligations (1 workflow)

Entity: **TESORO** (multi-entity: TESORO + AYUNTAMIENTO + CAMARA_COMERCIO + MIN_*)

| Code | Description | Appointment |
|------|-------------|-------------|
| `BUNDLE_PAYMENT` | Bundle payment for commercial license obligations | No |

Features: Multi-entity validation flow, zone-based pricing, receipt per entity.

---

## Workflow State Machine

```
                   +--------+
                   | DRAFT  |
                   +---+----+
                       |
              (citizen submits)
                       |
                +------v-------+
                | TIMBRES_     |-----> (pay stamp duty)
                | PENDING      |
                +------+-------+
                       |
                +------v-------+
                | SUBMITTED    |
                +------+-------+
                       |
              (auto-assignment to agent)
                       |
                +------v-------+     +------------------+
                | UNDER_REVIEW |---->| DOCUMENTS_       |
                +------+-------+     | REQUIRED         |
                       |             +--------+---------+
                       |                      |
              (agent validates)       (citizen re-uploads)
                       |                      |
                +------v-------+              |
                | DOSSIER_     |<-------------+
                | VALIDE       |
                +------+-------+
                       |
            +----------+-----------+
            |                      |
     (nota de ingreso)     (direct payment)
            |                      |
     +------v-------+     +-------v------+
     | PENDING_NOTA |     | PAYMENT_     |
     | INGRESO      |     | PENDING      |
     +------+-------+     +-------+------+
            |                      |
     +------v-------+     +-------v------+
     | NOTA_        |     | PAYMENT_     |
     | UPLOADED     |     | PROCESSING   |
     +------+-------+     +-------+------+
            |                      |
            +----------+-----------+
                       |
                +------v-------+
                |    PAID      |
                +------+-------+
                       |
            (if appointment required)
                       |
                +------v--------+
                | CITA_         |
                | SCHEDULED     |
                +------+--------+
                       |
                +------v-------+
                | IN_PROGRESS  |
                +------+-------+
                       |
                +------v-------+
                | COMPLETED    |
                +--------------+
```

Side states: `REJECTED`, `CANCELLED`, `EXPIRED`, `PAYMENT_FAILED`

## Wizard Steps

Each workflow defines a sequence of wizard steps for the citizen:

| Step Type | Description |
|-----------|-------------|
| `selection` | Choose request type, sub-type, or person category |
| `upload` | Upload required documents (with OCR extraction) |
| `form_review_1` | Review extracted data, fill manual fields (page 1) |
| `form_review_2` | Additional form fields (page 2) |
| `form_review_3` | Supporting documents and extra fields (page 3) |
| `appointment` | Select appointment date/time/location (if required) |
| `payment` | Choose payment method and pay |
| `confirmation` | Summary, PDF download, receipt |

### Cache-First Wizard

The wizard uses a **cache-first** approach:
1. Session state stored in Redis (not DB) during wizard navigation
2. On payment submission, one atomic operation persists everything to DB
3. `POST /wizard-sessions/{id}/initiate-payment` handles: service_request INSERT + document upload + payment creation + appointment confirmation

## Fee Calculation Methods

| Method | Description | Example |
|--------|-------------|---------|
| `FIXED` | Fixed amount from `workflow_tariffs` | Passport: 100,000 XAF |
| `RBC` | Risk-Based Calculator | Vehicle inspections |
| `PERCENTAGE` | Percentage of declared value | Contracts: % of contract value |
| `NOTA_INGRESO` | Based on Treasury Nota de Ingreso | Some government services |
| `tiered_rates` | Tiered pricing by duration/quantity | Visa alternatives |
| `formula_based` | Custom formula evaluation | Special calculations |

## Document Validation

Documents are validated through a 2-layer system:

1. **Layer 1 (Upload)**: SchemaValidationEngine (70+ JSON rules) + RiskAnalyzer (12 steps)
2. **Layer 2 (Form Review)**: `validate_step()` Python overrides for business-specific rules

39 OCR schemas defined in `packages/backend/app/modules/service_requests/schemas/`.

## Processing Entities

| Entity Code | Full Name | Workflows |
|-------------|-----------|-----------|
| `CNEDOGE` | Centro Nacional de Expedicion de Documentos | PASAPORTE_* (5) |
| `EXTRANJERIA` | Direccion General de Extranjeria | RESIDENCIA_*, *_VISADO, PERMANENCIA_*, SALIDA_* (6) |
| `DGT` | Direccion General de Trafico | VEHICULO_* (partial), CONDUCIR_* (5) |
| `OFIVE` | Oficina de Vehiculos | VEHICULO_RENOVACION_CUVE, VEHICULO_DUPLICADO_CUVE |
| `ITVE` | Inspeccion Tecnica de Vehiculos | VEHICULO_RENOVACION_ITV |
| `ONRC` | Oficina Nacional de Registro de Contratos | CONTRATO_* (7) |
| `MINFP` | Ministerio de Funcion Publica | FP_* (5) |
| `TESORO` | Tesoro Publico | BUNDLE_PAYMENT |
| `AYUNTAMIENTO` | Ayuntamiento (Municipal) | Bundle obligations |
| `CAMARA_COMERCIO` | Camara de Comercio | Bundle obligations |

Entity routing is driven by `entities.workflow_codes` in the database (JSONB array), managed via admin UI -- not hardcoded in application code.
