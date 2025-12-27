# Workflow Service Request - Implementation Aligned with Migrations 020-027

Implementer le module service_requests aligné avec les migrations de base de données.

## Context

**Tables créées par migrations 020-027:**
- `service_requests` - Demandes principales (020)
- `service_request_documents` - Documents uploadés (020)
- `service_request_history` - Audit trail (020)
- `workflow_document_requirements` - Documents requis par workflow (021)
- `workflow_tariffs` - Tarifs par workflow (022)
- `tariff_supplements` - Suppléments (cédulas, pólizas) (022)
- `extraction_schemas` - Mapping schemas JSON (025)
- `gemini_processing_logs` - Audit Gemini (026)
- `notification_log` - Historique notifications (027)

## Architecture

### Database Schema (Source of Truth)

```sql
-- service_requests (020)
CREATE TABLE service_requests (
    id UUID PRIMARY KEY,
    reference VARCHAR(50) UNIQUE NOT NULL,     -- RES-2025-00001
    user_id UUID NOT NULL REFERENCES users(id),
    workflow_code VARCHAR(100) NOT NULL,       -- residencia, pasaporte_nuevo
    solicitud_type VARCHAR(50) DEFAULT 'expedicion',
    fiscal_service_id INTEGER REFERENCES fiscal_services(id),
    status service_request_status_enum DEFAULT 'DRAFT',
    priority service_request_priority_enum DEFAULT 'NORMAL',
    form_data JSONB DEFAULT '{}',
    extracted_data JSONB DEFAULT '{}',
    extraction_confidence NUMERIC(5,4),
    validations JSONB DEFAULT '{}',
    assigned_to UUID REFERENCES users(id),
    assigned_at TIMESTAMPTZ,
    entity_code VARCHAR(50),
    base_amount NUMERIC(12,2),
    supplements_amount NUMERIC(12,2) DEFAULT 0,
    penalties_amount NUMERIC(12,2) DEFAULT 0,
    total_amount NUMERIC(12,2),
    currency VARCHAR(3) DEFAULT 'XAF',
    payment_id UUID,
    payment_status VARCHAR(50),
    paid_at TIMESTAMPTZ,
    cita_date DATE,
    cita_time TIME,
    cita_location VARCHAR(255),
    submitted_at TIMESTAMPTZ,
    validated_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    notes TEXT,
    rejection_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES users(id)
);

-- service_request_documents (020)
CREATE TABLE service_request_documents (
    id UUID PRIMARY KEY,
    service_request_id UUID NOT NULL REFERENCES service_requests(id),
    document_code VARCHAR(100) NOT NULL,
    document_name VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_size INTEGER,
    mime_type VARCHAR(100),
    extraction_data JSONB DEFAULT '{}',
    extraction_confidence NUMERIC(5,4),
    extraction_status VARCHAR(50) DEFAULT 'pending',
    is_valid BOOLEAN,
    validation_errors JSONB DEFAULT '[]',
    validated_by UUID REFERENCES users(id),
    validated_at TIMESTAMPTZ,
    source VARCHAR(50) DEFAULT 'user_upload',
    uploaded_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(service_request_id, document_code)
);

-- Status enum (19 états)
service_request_status_enum:
  DRAFT, TIMBRES_PENDING, TIMBRES_PAID,
  SUBMITTED, DOCUMENTS_REQUIRED,
  UNDER_REVIEW, DOSSIER_VALIDE, REJECTED,
  PENDING_NOTA_INGRESO, NOTA_UPLOADED,
  PAYMENT_PENDING, PAYMENT_PROCESSING, PAID, PAYMENT_FAILED,
  CITA_SCHEDULED, IN_PROGRESS, COMPLETED, CANCELLED, EXPIRED
```

### Pipeline Document Processing

```
DOCUMENT UPLOADE
     │
     ▼
┌────────────────────────────────────────────────┐
│  1. GEMINI PROCESSOR (Principal)               │
│  - Classification: Quel type de document?      │
│  - Matching: Correspond au document requis?    │
│  - Extraction: Extraire selon schema JSON      │
│  SEUIL: confidence >= 70%                      │
└────────────────────────────────────────────────┘
     │ Si échec ou confidence < 70%
     ▼
┌────────────────────────────────────────────────┐
│  2. TESSERACT FALLBACK                         │
│  - OCR via ocr_service existant                │
│  - Extraction schema-based avec regex          │
│  SEUIL: confidence >= 60%                      │
└────────────────────────────────────────────────┘
     │ Si confidence insuffisante
     ▼
┌────────────────────────────────────────────────┐
│  3. ACCEPTER AVEC REVIEW                       │
│  - Upload vers Firebase Storage                │
│  - extraction_status = 'manual_review'         │
│  - Agent humain vérifiera                      │
└────────────────────────────────────────────────┘
```

## Target Module Structure

```
packages/backend/app/modules/service_requests/
├── __init__.py
├── schemas/                              # 19 schemas JSON (existants)
│   ├── dip_gq.json
│   ├── pasaporte_gq.json
│   ├── permiso_residencia_gq.json
│   └── ...
├── models/
│   ├── __init__.py
│   ├── service_request.py               # Pydantic models
│   ├── document.py                       # Document models
│   └── enums.py                          # Status, Priority enums
├── repositories/
│   ├── __init__.py
│   ├── service_request_repository.py    # CRUD service_requests
│   └── document_repository.py           # CRUD service_request_documents
├── services/
│   ├── __init__.py
│   ├── service_request_service.py       # Orchestration principale
│   ├── document_processor.py            # Pipeline Gemini + Tesseract
│   ├── gemini_processor.py              # Classification + extraction
│   ├── schema_extractor.py              # Tesseract fallback
│   ├── schema_loader.py                 # Chargement schemas JSON
│   ├── tariff_service.py                # Calcul tarifs workflow
│   └── notification_service.py          # Notifications status change
├── api/
│   ├── __init__.py
│   ├── routes.py                         # Endpoints REST
│   └── dependencies.py                   # Auth, permissions
└── tests/
    └── ...
```

## Implementation Steps

### Step 1: Pydantic Models (models/enums.py)

```python
from enum import Enum

class ServiceRequestStatus(str, Enum):
    """Status enum matching database"""
    DRAFT = "DRAFT"
    TIMBRES_PENDING = "TIMBRES_PENDING"
    TIMBRES_PAID = "TIMBRES_PAID"
    SUBMITTED = "SUBMITTED"
    DOCUMENTS_REQUIRED = "DOCUMENTS_REQUIRED"
    UNDER_REVIEW = "UNDER_REVIEW"
    DOSSIER_VALIDE = "DOSSIER_VALIDE"
    REJECTED = "REJECTED"
    PENDING_NOTA_INGRESO = "PENDING_NOTA_INGRESO"
    NOTA_UPLOADED = "NOTA_UPLOADED"
    PAYMENT_PENDING = "PAYMENT_PENDING"
    PAYMENT_PROCESSING = "PAYMENT_PROCESSING"
    PAID = "PAID"
    PAYMENT_FAILED = "PAYMENT_FAILED"
    CITA_SCHEDULED = "CITA_SCHEDULED"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"
    EXPIRED = "EXPIRED"

class ServiceRequestPriority(str, Enum):
    LOW = "LOW"
    NORMAL = "NORMAL"
    HIGH = "HIGH"
    URGENT = "URGENT"

class SolicitudType(str, Enum):
    EXPEDICION = "expedicion"
    RENOVACION = "renovacion"
    DUPLICADO = "duplicado"

class ExtractionStatus(str, Enum):
    PENDING = "pending"
    SUCCESS = "success"
    FAILED = "failed"
    MANUAL_REVIEW = "manual_review"
```

### Step 2: Pydantic Models (models/service_request.py)

```python
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime, date, time
from uuid import UUID
from .enums import ServiceRequestStatus, ServiceRequestPriority, SolicitudType

class ServiceRequestCreate(BaseModel):
    """Create a new service request"""
    workflow_code: str = Field(..., min_length=1, max_length=100)
    solicitud_type: SolicitudType = SolicitudType.EXPEDICION
    fiscal_service_id: Optional[int] = None
    priority: ServiceRequestPriority = ServiceRequestPriority.NORMAL
    form_data: Dict[str, Any] = Field(default_factory=dict)

class ServiceRequestUpdate(BaseModel):
    """Update service request"""
    status: Optional[ServiceRequestStatus] = None
    priority: Optional[ServiceRequestPriority] = None
    form_data: Optional[Dict[str, Any]] = None
    notes: Optional[str] = None
    assigned_to: Optional[UUID] = None

class RequiredDocument(BaseModel):
    """Document requis pour un workflow"""
    document_code: str
    document_name: str
    is_required: bool
    display_order: int
    accepted_formats: List[str]
    max_size_mb: int

class ProvidedDocument(BaseModel):
    """Document fourni"""
    id: UUID
    document_code: str
    document_name: str
    file_path: str
    file_name: str
    file_size: Optional[int]
    mime_type: Optional[str]
    extraction_data: Dict[str, Any] = {}
    extraction_confidence: Optional[float]
    extraction_status: str
    is_valid: Optional[bool]
    validation_errors: List[str] = []
    created_at: datetime

class TariffBreakdown(BaseModel):
    """Detail tarif"""
    base_amount: float
    supplements: List[Dict[str, Any]] = []
    supplements_total: float
    penalties_amount: float = 0
    total_amount: float
    currency: str = "XAF"

class ServiceRequestResponse(BaseModel):
    """Response complete"""
    id: UUID
    reference: str
    workflow_code: str
    solicitud_type: SolicitudType
    status: ServiceRequestStatus
    priority: ServiceRequestPriority

    # Documents
    required_documents: List[RequiredDocument]
    provided_documents: List[ProvidedDocument]
    missing_documents: List[RequiredDocument]
    documents_progress: str  # "2/5"

    # Form data
    form_data: Dict[str, Any]
    extracted_data: Dict[str, Any]
    extraction_confidence: Optional[float]

    # Tarif
    tariff: Optional[TariffBreakdown] = None

    # Assignment
    assigned_to: Optional[UUID] = None
    entity_code: Optional[str] = None

    # Cita
    cita_date: Optional[date] = None
    cita_time: Optional[time] = None
    cita_location: Optional[str] = None

    # Timestamps
    created_at: datetime
    updated_at: Optional[datetime]
    submitted_at: Optional[datetime]

    class Config:
        from_attributes = True
```

### Step 3: Repository (repositories/service_request_repository.py)

```python
import asyncpg
from typing import Optional, List, Dict, Any
from uuid import UUID
from datetime import datetime

class ServiceRequestRepository:
    """Data access layer for service_requests"""

    async def create(
        self,
        db: asyncpg.Connection,
        user_id: UUID,
        workflow_code: str,
        solicitud_type: str = "expedicion",
        fiscal_service_id: Optional[int] = None,
        priority: str = "NORMAL",
        form_data: Dict = None
    ) -> Dict:
        """Create new service request with auto-generated reference"""
        query = """
            INSERT INTO service_requests (
                user_id, workflow_code, solicitud_type,
                fiscal_service_id, priority, form_data, created_by
            )
            VALUES ($1, $2, $3, $4, $5, $6, $1)
            RETURNING *
        """
        row = await db.fetchrow(
            query, user_id, workflow_code, solicitud_type,
            fiscal_service_id, priority, form_data or {}
        )
        return dict(row)

    async def find_by_id(self, db: asyncpg.Connection, request_id: UUID) -> Optional[Dict]:
        query = "SELECT * FROM service_requests WHERE id = $1"
        row = await db.fetchrow(query, request_id)
        return dict(row) if row else None

    async def find_by_user(
        self,
        db: asyncpg.Connection,
        user_id: UUID,
        status: Optional[str] = None,
        limit: int = 20,
        offset: int = 0
    ) -> List[Dict]:
        if status:
            query = """
                SELECT * FROM service_requests
                WHERE user_id = $1 AND status = $2
                ORDER BY created_at DESC
                LIMIT $3 OFFSET $4
            """
            rows = await db.fetch(query, user_id, status, limit, offset)
        else:
            query = """
                SELECT * FROM service_requests
                WHERE user_id = $1
                ORDER BY created_at DESC
                LIMIT $2 OFFSET $3
            """
            rows = await db.fetch(query, user_id, limit, offset)
        return [dict(row) for row in rows]

    async def update_status(
        self,
        db: asyncpg.Connection,
        request_id: UUID,
        new_status: str,
        performed_by: UUID,
        comment: Optional[str] = None
    ) -> Dict:
        """Update status and create history entry"""
        # Get current status
        current = await self.find_by_id(db, request_id)

        # Update status
        await db.execute(
            """UPDATE service_requests
               SET status = $2, updated_at = NOW()
               WHERE id = $1""",
            request_id, new_status
        )

        # Create history entry
        await db.execute(
            """INSERT INTO service_request_history
               (service_request_id, action, previous_status, new_status,
                performed_by, comment)
               VALUES ($1, 'status_change', $2, $3, $4, $5)""",
            request_id, current["status"], new_status, performed_by, comment
        )

        return await self.find_by_id(db, request_id)

    async def update_amounts(
        self,
        db: asyncpg.Connection,
        request_id: UUID,
        base_amount: float,
        supplements_amount: float,
        penalties_amount: float,
        total_amount: float
    ) -> None:
        await db.execute(
            """UPDATE service_requests
               SET base_amount = $2, supplements_amount = $3,
                   penalties_amount = $4, total_amount = $5,
                   updated_at = NOW()
               WHERE id = $1""",
            request_id, base_amount, supplements_amount,
            penalties_amount, total_amount
        )

    async def assign_agent(
        self,
        db: asyncpg.Connection,
        request_id: UUID,
        agent_id: UUID,
        performed_by: UUID
    ) -> Dict:
        await db.execute(
            """UPDATE service_requests
               SET assigned_to = $2, assigned_at = NOW(), updated_at = NOW()
               WHERE id = $1""",
            request_id, agent_id
        )

        await db.execute(
            """INSERT INTO service_request_history
               (service_request_id, action, performed_by,
                details)
               VALUES ($1, 'assigned', $2, $3)""",
            request_id, performed_by,
            {"assigned_to": str(agent_id)}
        )

        return await self.find_by_id(db, request_id)

service_request_repository = ServiceRequestRepository()
```

### Step 4: Document Repository (repositories/document_repository.py)

```python
import asyncpg
from typing import Optional, List, Dict
from uuid import UUID

class DocumentRepository:
    """Data access for service_request_documents"""

    async def add_document(
        self,
        db: asyncpg.Connection,
        service_request_id: UUID,
        document_code: str,
        document_name: str,
        file_path: str,
        file_name: str,
        file_size: int,
        mime_type: str,
        uploaded_by: UUID
    ) -> Dict:
        query = """
            INSERT INTO service_request_documents (
                service_request_id, document_code, document_name,
                file_path, file_name, file_size, mime_type,
                uploaded_by, source
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'user_upload')
            ON CONFLICT (service_request_id, document_code)
            DO UPDATE SET
                file_path = EXCLUDED.file_path,
                file_name = EXCLUDED.file_name,
                file_size = EXCLUDED.file_size,
                mime_type = EXCLUDED.mime_type,
                extraction_status = 'pending',
                updated_at = NOW()
            RETURNING *
        """
        row = await db.fetchrow(
            query, service_request_id, document_code, document_name,
            file_path, file_name, file_size, mime_type, uploaded_by
        )
        return dict(row)

    async def update_extraction(
        self,
        db: asyncpg.Connection,
        document_id: UUID,
        extraction_data: Dict,
        extraction_confidence: float,
        extraction_status: str
    ) -> None:
        await db.execute(
            """UPDATE service_request_documents
               SET extraction_data = $2, extraction_confidence = $3,
                   extraction_status = $4, updated_at = NOW()
               WHERE id = $1""",
            document_id, extraction_data, extraction_confidence, extraction_status
        )

    async def validate_document(
        self,
        db: asyncpg.Connection,
        document_id: UUID,
        is_valid: bool,
        validation_errors: List[str],
        validated_by: UUID
    ) -> None:
        await db.execute(
            """UPDATE service_request_documents
               SET is_valid = $2, validation_errors = $3,
                   validated_by = $4, validated_at = NOW(),
                   updated_at = NOW()
               WHERE id = $1""",
            document_id, is_valid, validation_errors, validated_by
        )

    async def find_by_request(
        self,
        db: asyncpg.Connection,
        service_request_id: UUID
    ) -> List[Dict]:
        query = """
            SELECT * FROM service_request_documents
            WHERE service_request_id = $1
            ORDER BY created_at
        """
        rows = await db.fetch(query, service_request_id)
        return [dict(row) for row in rows]

    async def find_by_id(
        self,
        db: asyncpg.Connection,
        document_id: UUID
    ) -> Optional[Dict]:
        row = await db.fetchrow(
            "SELECT * FROM service_request_documents WHERE id = $1",
            document_id
        )
        return dict(row) if row else None

document_repository = DocumentRepository()
```

### Step 5: Schema Loader (services/schema_loader.py)

```python
import json
from pathlib import Path
from typing import Dict, Optional, List
from functools import lru_cache
import logging

logger = logging.getLogger(__name__)
SCHEMAS_DIR = Path(__file__).parent.parent / "schemas"

class SchemaLoader:
    """Load and manage extraction schemas"""

    def __init__(self):
        self._schemas: Dict[str, Dict] = {}
        self._load_all()

    def _load_all(self):
        """Load all JSON schemas from directory"""
        for filepath in SCHEMAS_DIR.glob("*.json"):
            try:
                with open(filepath, "r", encoding="utf-8") as f:
                    schema = json.load(f)
                    # Use filename without extension as key
                    key = filepath.stem
                    self._schemas[key] = schema
                    logger.info(f"Loaded schema: {key}")
            except Exception as e:
                logger.error(f"Error loading {filepath}: {e}")

    def get_schema(self, schema_key: str) -> Optional[Dict]:
        """Get schema by key (e.g., 'dip_gq', 'pasaporte_gq')"""
        return self._schemas.get(schema_key)

    def get_schema_for_document(self, document_code: str) -> Optional[Dict]:
        """Get schema matching a document code"""
        # Try exact match first
        if document_code in self._schemas:
            return self._schemas[document_code]

        # Try partial match
        for key, schema in self._schemas.items():
            if document_code.lower() in key.lower():
                return schema

        return None

    def get_extraction_fields(self, schema_key: str) -> Dict[str, Dict]:
        """Get all extraction fields from a schema"""
        schema = self.get_schema(schema_key)
        if not schema:
            return {}

        fields = {}
        for bloc_name, bloc in schema.get("blocs", {}).items():
            for field_name, field_config in bloc.get("fields", {}).items():
                fields[field_name] = {**field_config, "bloc": bloc_name}
        return fields

    def build_gemini_prompt(self, schema_key: str) -> str:
        """Build extraction prompt from schema"""
        schema = self.get_schema(schema_key)
        if not schema:
            return ""

        lines = [f"Document: {schema.get('description', schema_key)}"]
        lines.append("Extraire les informations suivantes:")

        for bloc_name, bloc in schema.get("blocs", {}).items():
            lines.append(f"\n## {bloc_name}")
            for field_name, config in bloc.get("fields", {}).items():
                required = "OBLIGATOIRE" if config.get("required") else "optionnel"
                hint = config.get("gemini_hint", "")
                lines.append(f"- {field_name} ({required}): {hint}")

        return "\n".join(lines)

    def get_tesseract_patterns(self, schema_key: str) -> Dict[str, List[str]]:
        """Get regex patterns for Tesseract fallback"""
        schema = self.get_schema(schema_key)
        if not schema:
            return {}
        return schema.get("tesseract_patterns", {})

schema_loader = SchemaLoader()
```

### Step 6: Tariff Service (services/tariff_service.py)

```python
import asyncpg
from typing import Dict, Optional
from decimal import Decimal

class TariffService:
    """Calculate tariffs using workflow_tariffs and tariff_supplements"""

    async def calculate(
        self,
        db: asyncpg.Connection,
        workflow_code: str,
        solicitud_type: str = "expedicion",
        extracted_data: Dict = None
    ) -> Dict:
        """Calculate total tariff for a workflow"""

        # Use database function
        query = "SELECT * FROM get_workflow_tariff_total($1, $2)"
        row = await db.fetchrow(query, workflow_code, solicitud_type)

        if not row:
            return {
                "base_amount": 0,
                "supplements": [],
                "supplements_total": 0,
                "penalties_amount": 0,
                "total_amount": 0,
                "currency": "XAF"
            }

        return {
            "base_amount": float(row["base_amount"]),
            "supplements": row["supplements"] or [],
            "supplements_total": float(row["supplements_total"]),
            "penalties_amount": 0,  # Calculated separately if needed
            "total_amount": float(row["total_amount"]),
            "currency": row["currency"]
        }

tariff_service = TariffService()
```

### Step 7: Service Request Service (services/service_request_service.py)

```python
import asyncpg
from typing import Dict, List, Optional
from uuid import UUID
from fastapi import HTTPException, UploadFile
import logging

from ..repositories.service_request_repository import service_request_repository
from ..repositories.document_repository import document_repository
from ..models.service_request import (
    ServiceRequestCreate, ServiceRequestResponse,
    RequiredDocument, ProvidedDocument, TariffBreakdown
)
from .document_processor import document_processor
from .tariff_service import tariff_service
from app.modules.documents.services.storage_service import storage_service

logger = logging.getLogger(__name__)

class ServiceRequestService:
    """Main orchestration service"""

    async def create_request(
        self,
        db: asyncpg.Connection,
        user_id: UUID,
        data: ServiceRequestCreate
    ) -> ServiceRequestResponse:
        """Create new service request"""

        # Get required documents for workflow
        required_docs = await self._get_required_documents(db, data.workflow_code)

        # Create request
        request = await service_request_repository.create(
            db=db,
            user_id=user_id,
            workflow_code=data.workflow_code,
            solicitud_type=data.solicitud_type.value,
            fiscal_service_id=data.fiscal_service_id,
            priority=data.priority.value,
            form_data=data.form_data
        )

        return await self._build_response(db, request, required_docs)

    async def upload_document(
        self,
        db: asyncpg.Connection,
        request_id: UUID,
        user_id: UUID,
        document_code: str,
        file: UploadFile
    ) -> Dict:
        """Upload and process a document"""

        # Verify request ownership
        request = await service_request_repository.find_by_id(db, request_id)
        if not request:
            raise HTTPException(404, "Service request not found")
        if request["user_id"] != user_id:
            raise HTTPException(403, "Access denied")

        # Read file content
        content = await file.read()

        # Upload to Firebase Storage
        file_path = await storage_service.upload_user_document(
            file_content=content,
            filename=file.filename,
            content_type=file.content_type,
            user_id=str(user_id),
            folder=f"service-requests/{request_id}"
        )

        # Save document record
        doc = await document_repository.add_document(
            db=db,
            service_request_id=request_id,
            document_code=document_code,
            document_name=document_code,  # Will be updated after processing
            file_path=file_path,
            file_name=file.filename,
            file_size=len(content),
            mime_type=file.content_type,
            uploaded_by=user_id
        )

        # Process document (Gemini + Tesseract fallback)
        processing_result = await document_processor.process(
            document_content=content,
            mime_type=file.content_type,
            document_code=document_code
        )

        # Update extraction
        await document_repository.update_extraction(
            db=db,
            document_id=doc["id"],
            extraction_data=processing_result["extraction"],
            extraction_confidence=processing_result["confidence"],
            extraction_status=processing_result["status"]
        )

        # Log to gemini_processing_logs
        await self._log_processing(db, request_id, doc["id"], user_id, processing_result)

        # Check if all documents provided
        await self._check_completion(db, request_id, user_id)

        return {
            "document_id": doc["id"],
            "extraction": processing_result["extraction"],
            "confidence": processing_result["confidence"],
            "processor": processing_result["processor"],
            "status": processing_result["status"]
        }

    async def get_request(
        self,
        db: asyncpg.Connection,
        request_id: UUID,
        user_id: UUID
    ) -> ServiceRequestResponse:
        """Get request details"""
        request = await service_request_repository.find_by_id(db, request_id)
        if not request:
            raise HTTPException(404, "Service request not found")
        if request["user_id"] != user_id:
            raise HTTPException(403, "Access denied")

        required_docs = await self._get_required_documents(
            db, request["workflow_code"]
        )
        return await self._build_response(db, request, required_docs)

    async def list_requests(
        self,
        db: asyncpg.Connection,
        user_id: UUID,
        status: Optional[str] = None,
        limit: int = 20,
        offset: int = 0
    ) -> List[ServiceRequestResponse]:
        """List user's requests"""
        requests = await service_request_repository.find_by_user(
            db, user_id, status, limit, offset
        )

        results = []
        for req in requests:
            required_docs = await self._get_required_documents(
                db, req["workflow_code"]
            )
            results.append(await self._build_response(db, req, required_docs))

        return results

    async def _get_required_documents(
        self,
        db: asyncpg.Connection,
        workflow_code: str
    ) -> List[RequiredDocument]:
        """Get required documents from workflow_document_requirements"""
        query = """
            SELECT document_code, document_name, is_required, display_order,
                   accepted_formats, max_size_mb
            FROM workflow_document_requirements
            WHERE workflow_code = $1 AND is_active = TRUE
            ORDER BY display_order
        """
        rows = await db.fetch(query, workflow_code)
        return [RequiredDocument(**dict(row)) for row in rows]

    async def _check_completion(
        self,
        db: asyncpg.Connection,
        request_id: UUID,
        user_id: UUID
    ) -> None:
        """Check if all required documents are provided"""
        request = await service_request_repository.find_by_id(db, request_id)
        required = await self._get_required_documents(db, request["workflow_code"])
        provided = await document_repository.find_by_request(db, request_id)

        required_codes = {d.document_code for d in required if d.is_required}
        provided_codes = {d["document_code"] for d in provided}

        if required_codes <= provided_codes:
            # All required documents provided
            # Calculate tariff
            tariff = await tariff_service.calculate(
                db=db,
                workflow_code=request["workflow_code"],
                solicitud_type=request["solicitud_type"]
            )

            await service_request_repository.update_amounts(
                db=db,
                request_id=request_id,
                base_amount=tariff["base_amount"],
                supplements_amount=tariff["supplements_total"],
                penalties_amount=tariff["penalties_amount"],
                total_amount=tariff["total_amount"]
            )

            # Update status to SUBMITTED
            await service_request_repository.update_status(
                db=db,
                request_id=request_id,
                new_status="SUBMITTED",
                performed_by=user_id,
                comment="All documents provided"
            )

    async def _log_processing(
        self,
        db: asyncpg.Connection,
        request_id: UUID,
        document_id: UUID,
        user_id: UUID,
        result: Dict
    ) -> None:
        """Log to gemini_processing_logs"""
        await db.execute(
            """INSERT INTO gemini_processing_logs (
                service_request_id, document_id, user_id,
                processor, document_type_detected,
                classification_confidence, extraction_result,
                processing_time_ms, has_error
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)""",
            request_id, document_id, user_id,
            result["processor"], result.get("document_type"),
            result["confidence"], result["extraction"],
            result.get("processing_time_ms", 0), result.get("has_error", False)
        )

    async def _build_response(
        self,
        db: asyncpg.Connection,
        request: Dict,
        required_docs: List[RequiredDocument]
    ) -> ServiceRequestResponse:
        """Build complete response"""
        provided = await document_repository.find_by_request(db, request["id"])
        provided_codes = {d["document_code"] for d in provided}

        missing = [d for d in required_docs if d.document_code not in provided_codes]

        tariff = None
        if request.get("total_amount"):
            tariff = TariffBreakdown(
                base_amount=float(request["base_amount"]),
                supplements=[],
                supplements_total=float(request["supplements_amount"]),
                penalties_amount=float(request["penalties_amount"]),
                total_amount=float(request["total_amount"])
            )

        return ServiceRequestResponse(
            id=request["id"],
            reference=request["reference"],
            workflow_code=request["workflow_code"],
            solicitud_type=request["solicitud_type"],
            status=request["status"],
            priority=request["priority"],
            required_documents=required_docs,
            provided_documents=[ProvidedDocument(**d) for d in provided],
            missing_documents=missing,
            documents_progress=f"{len(provided)}/{len(required_docs)}",
            form_data=request["form_data"],
            extracted_data=request["extracted_data"],
            extraction_confidence=request.get("extraction_confidence"),
            tariff=tariff,
            assigned_to=request.get("assigned_to"),
            entity_code=request.get("entity_code"),
            cita_date=request.get("cita_date"),
            cita_time=request.get("cita_time"),
            cita_location=request.get("cita_location"),
            created_at=request["created_at"],
            updated_at=request.get("updated_at"),
            submitted_at=request.get("submitted_at")
        )

service_request_service = ServiceRequestService()
```

### Step 8: API Routes (api/routes.py)

```python
from fastapi import APIRouter, Depends, File, UploadFile, Query, Form
from typing import List, Optional
from uuid import UUID
import asyncpg

from ..models.service_request import (
    ServiceRequestCreate, ServiceRequestResponse
)
from ..services.service_request_service import service_request_service
from app.database.connection import get_database
from app.modules.auth.dependencies import get_current_user

router = APIRouter(prefix="/service-requests", tags=["Service Requests"])

@router.post("/", response_model=ServiceRequestResponse, status_code=201)
async def create_service_request(
    data: ServiceRequestCreate,
    db: asyncpg.Connection = Depends(get_database),
    current_user = Depends(get_current_user)
):
    """Create a new service request"""
    return await service_request_service.create_request(
        db=db, user_id=current_user.id, data=data
    )

@router.post("/{request_id}/documents")
async def upload_document(
    request_id: UUID,
    document_code: str = Form(...),
    file: UploadFile = File(...),
    db: asyncpg.Connection = Depends(get_database),
    current_user = Depends(get_current_user)
):
    """Upload a document for the request"""
    return await service_request_service.upload_document(
        db=db,
        request_id=request_id,
        user_id=current_user.id,
        document_code=document_code,
        file=file
    )

@router.get("/{request_id}", response_model=ServiceRequestResponse)
async def get_service_request(
    request_id: UUID,
    db: asyncpg.Connection = Depends(get_database),
    current_user = Depends(get_current_user)
):
    """Get request details"""
    return await service_request_service.get_request(
        db=db, request_id=request_id, user_id=current_user.id
    )

@router.get("/", response_model=List[ServiceRequestResponse])
async def list_service_requests(
    status: Optional[str] = Query(None),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: asyncpg.Connection = Depends(get_database),
    current_user = Depends(get_current_user)
):
    """List user's service requests"""
    return await service_request_service.list_requests(
        db=db, user_id=current_user.id, status=status,
        limit=limit, offset=offset
    )
```

## Dependencies (Existing Services to Reuse)

```python
# DO NOT recreate - use existing:
from app.modules.documents.services.storage_service import storage_service
from app.modules.documents.services.ocr_service import ocr_service
```

## Checklist

- [ ] Create module structure (models/, repositories/, services/, api/)
- [ ] Implement enums.py
- [ ] Implement service_request.py models
- [ ] Implement document.py models
- [ ] Implement service_request_repository.py
- [ ] Implement document_repository.py
- [ ] Implement schema_loader.py
- [ ] Implement gemini_processor.py
- [ ] Implement schema_extractor.py (Tesseract fallback)
- [ ] Implement document_processor.py (orchestration)
- [ ] Implement tariff_service.py
- [ ] Implement notification_service.py
- [ ] Implement service_request_service.py
- [ ] Implement routes.py
- [ ] Register router in main.py
- [ ] Write unit tests
- [ ] Write integration tests

## Notes

- **workflow_code** (not service_code) - matches workflow_tariffs, workflow_document_requirements
- **service_request_documents** table (not JSONB) - proper normalization
- **reference** auto-generated via trigger in migration 020
- **extraction_schemas** table links document types to JSON schemas
- **gemini_processing_logs** for audit trail
- **notification_log** for status change notifications
