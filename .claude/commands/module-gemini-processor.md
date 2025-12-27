# Module Gemini Document Processor - Architecture Simplifiee

Implementer le processeur Gemini unifie pour le traitement complet des documents (classification + extraction + analyse de risque) en un seul appel API synchrone.

## Context

**Architecture Simplifiee Phase 1** - Gemini-first sans CloudAMQP:
- Un seul appel Gemini pour tout le pipeline (2-3 secondes)
- Traitement synchrone (pas de workers, pas de queues)
- Document AI reserve pour Phase 3 (si besoin reglementaire)

## Documentation Reference

```bash
Read Documentations/workflow/ARCHITECTURE_SIMPLIFIEE_PHASE1.md
Read Documentations/workflow/PLAN_IMPLEMENTATION_SIMPLIFIE.md
```

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    GEMINI DOCUMENT PROCESSOR (UNIFIE)                        │
└─────────────────────────────────────────────────────────────────────────────┘

                    Document (image/PDF)
                           │
                           ▼
                ┌───────────────────────┐
                │   GEMINI 2.0 FLASH    │
                │   ─────────────────   │
                │                       │
                │   Prompt Unifie:      │
                │   1. Classifier       │
                │   2. Extraire         │
                │   3. Analyser Risque  │
                │                       │
                │   Temps: 2-3 secondes │
                └───────────────────────┘
                           │
           ┌───────────────┼───────────────┐
           ▼               ▼               ▼
    ┌────────────┐  ┌────────────┐  ┌────────────┐
    │ CLASSIF    │  │ ENTITIES   │  │ RISK       │
    │ ─────────  │  │ ──────────  │  │ ───────    │
    │ type: dni  │  │ nif: XXX   │  │ score: 0.15│
    │ conf: 0.95 │  │ nom: Doe   │  │ action:    │
    │            │  │ date: ...  │  │ auto_approve│
    └────────────┘  └────────────┘  └────────────┘
```

## Target Module Structure

```
packages/backend/app/modules/gemini/
├── __init__.py
├── api/
│   └── gemini_routes.py              # Endpoints (optionnel, integre dans service_requests)
├── models/
│   ├── __init__.py
│   ├── processing_result.py          # Modeles Pydantic
│   └── prompts.py                    # Prompts systeme
├── services/
│   ├── __init__.py
│   └── document_processor.py         # Service principal
└── tests/
    ├── __init__.py
    └── test_document_processor.py    # Tests unitaires
```

## Implementation

### Step 1: Create Pydantic Models

```python
# packages/backend/app/modules/gemini/models/processing_result.py
from pydantic import BaseModel, Field
from typing import Dict, List, Optional, Any
from enum import Enum

class DocumentType(str, Enum):
    """Types de documents supportes"""
    DNI_CNI = "dni_cni"
    PASSPORT = "passport"
    NOTA_INGRESO = "nota_ingreso"
    FACTURE = "facture"
    LICENCE_COMMERCE = "licence_commerce"
    CONTRAT = "contrat"
    CERTIFICAT = "certificat"
    DEMANDE_OFFICIELLE = "demande_officielle"
    AUTRE = "autre"

class RiskLevel(str, Enum):
    """Niveaux de risque"""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class WorkflowAction(str, Enum):
    """Actions recommandees"""
    AUTO_APPROVE = "auto_approve"
    MANUAL_REVIEW = "manual_review"
    REQUEST_DOCUMENTS = "request_documents"
    REJECT = "reject"

class ExtractedEntity(BaseModel):
    """Entite extraite du document"""
    field_name: str
    value: Any
    confidence: float = Field(ge=0.0, le=1.0)
    bounding_box: Optional[Dict[str, int]] = None

class CoherenceCheck(BaseModel):
    """Resultat verification coherence"""
    is_valid: bool
    checks_passed: List[str] = []
    checks_failed: List[str] = []
    warnings: List[str] = []

class RiskAnalysis(BaseModel):
    """Resultat analyse de risque"""
    risk_score: float = Field(ge=0.0, le=1.0)
    risk_level: RiskLevel
    risk_factors: List[str] = []
    coherence: CoherenceCheck
    recommendation: WorkflowAction
    justification: str
    confidence: float = Field(ge=0.0, le=1.0)

class ClassificationResult(BaseModel):
    """Resultat classification document"""
    document_type: DocumentType
    confidence: float = Field(ge=0.0, le=1.0)
    detected_language: str = "es"

class DocumentProcessingResult(BaseModel):
    """Resultat complet du traitement Gemini"""
    # Classification
    classification: ClassificationResult

    # Extraction
    entities: Dict[str, ExtractedEntity] = {}
    raw_text: Optional[str] = None

    # Risk Analysis
    risk_analysis: RiskAnalysis

    # Metadata
    processing_time_ms: int
    gemini_model: str

    class Config:
        json_schema_extra = {
            "example": {
                "classification": {
                    "document_type": "dni_cni",
                    "confidence": 0.95,
                    "detected_language": "es"
                },
                "entities": {
                    "nif": {"field_name": "nif", "value": "123456789", "confidence": 0.92},
                    "full_name": {"field_name": "full_name", "value": "Juan Doe", "confidence": 0.88}
                },
                "risk_analysis": {
                    "risk_score": 0.15,
                    "risk_level": "low",
                    "risk_factors": [],
                    "coherence": {"is_valid": True, "checks_passed": ["nif_format", "date_valid"]},
                    "recommendation": "auto_approve",
                    "justification": "Document valid, low risk profile",
                    "confidence": 0.90
                },
                "processing_time_ms": 2340,
                "gemini_model": "gemini-2.0-flash-exp"
            }
        }
```

### Step 2: Create Unified Prompt

```python
# packages/backend/app/modules/gemini/models/prompts.py

UNIFIED_DOCUMENT_PROCESSING_PROMPT = """
Tu es un agent intelligent de traitement documentaire pour TaxasGE, la plateforme officielle
de services fiscaux de Guinee Equatoriale.

## MISSION
Analyse ce document et retourne un JSON structure avec:
1. Classification du document
2. Extraction des entites
3. Analyse de risque

## CONTEXTE SERVICE
- Service demande: {service_name}
- Code service: {service_code}
- Categorie: {service_category}

## TYPES DE DOCUMENTS RECONNUS
- dni_cni: Carte nationale d'identite
- passport: Passeport
- nota_ingreso: Note de versement/recette
- facture: Facture commerciale
- licence_commerce: Licence commerciale
- contrat: Contrat (travail, bail, etc.)
- certificat: Certificat officiel
- demande_officielle: Formulaire de demande
- autre: Document non categorise

## ENTITES A EXTRAIRE (selon type document)
### Pour dni_cni / passport:
- nif (format: 9 chiffres)
- full_name
- date_naissance
- lieu_naissance
- date_emission
- date_expiration
- numero_document

### Pour nota_ingreso / facture:
- nif_emetteur
- nif_destinataire
- montant (en XAF)
- date_emission
- reference
- description

### Pour licence_commerce:
- nif_entreprise
- raison_sociale
- numero_licence
- activite_principale
- date_emission
- date_expiration

## ANALYSE DE RISQUE

### Facteurs de risque:
| Facteur | Poids |
|---------|-------|
| Montant > 500,000 XAF | +0.15 |
| NIF format invalide | +0.20 |
| Document expire | +0.30 |
| Ecart montant > 10% | +0.25 |
| Qualite image faible | +0.10 |
| Donnees incompletes | +0.15 |

### Seuils decision:
- risk_score < 0.30 -> "auto_approve"
- risk_score 0.30-0.60 -> "manual_review"
- risk_score 0.60-0.80 -> "request_documents"
- risk_score > 0.80 -> "reject"

### Verifications coherence:
- NIF format valide (9 chiffres)
- Dates logiques (emission < expiration)
- Document non expire
- Donnees minimales presentes

## FORMAT REPONSE (JSON STRICT)

```json
{{
  "classification": {{
    "document_type": "dni_cni",
    "confidence": 0.95,
    "detected_language": "es"
  }},
  "entities": {{
    "nif": {{"field_name": "nif", "value": "123456789", "confidence": 0.92}},
    "full_name": {{"field_name": "full_name", "value": "Juan Perez Garcia", "confidence": 0.88}},
    "date_expiration": {{"field_name": "date_expiration", "value": "2028-05-15", "confidence": 0.85}}
  }},
  "risk_analysis": {{
    "risk_score": 0.15,
    "risk_level": "low",
    "risk_factors": [],
    "coherence": {{
      "is_valid": true,
      "checks_passed": ["nif_format", "date_valid", "not_expired"],
      "checks_failed": [],
      "warnings": []
    }},
    "recommendation": "auto_approve",
    "justification": "Document valide, NIF correct, non expire",
    "confidence": 0.90
  }},
  "raw_text": "Texte OCR extrait..."
}}
```

## REGLES IMPORTANTES
1. TOUJOURS retourner du JSON valide
2. Confidence entre 0.0 et 1.0
3. Si document illisible, risk_score = 1.0, recommendation = "reject"
4. Extraire TOUTES les entites visibles, meme partiellement
5. Justification en francais ou espagnol selon langue document
"""

# Prompt simplifie pour re-traitement rapide
QUICK_CLASSIFICATION_PROMPT = """
Classifie rapidement ce document parmi:
- dni_cni, passport, nota_ingreso, facture, licence_commerce, contrat, certificat, demande_officielle, autre

Retourne JSON: {{"document_type": "...", "confidence": 0.XX}}
"""
```

### Step 3: Create Document Processor Service

```python
# packages/backend/app/modules/gemini/services/document_processor.py
import json
import time
from typing import Optional, Dict, Any
import asyncio

from google.cloud import aiplatform
from vertexai.generative_models import GenerativeModel, Part
import vertexai

from app.config import settings
from ..models.processing_result import DocumentProcessingResult, ClassificationResult, RiskAnalysis
from ..models.prompts import UNIFIED_DOCUMENT_PROCESSING_PROMPT

import logging
logger = logging.getLogger(__name__)

class GeminiDocumentProcessor:
    """
    Processeur de documents utilisant Gemini 2.0 Flash.
    Pipeline unifie: Classification + Extraction + Risk en un seul appel.
    """

    def __init__(self):
        self._initialized = False
        self.model: Optional[GenerativeModel] = None

    async def initialize(self):
        """Initialise le client Vertex AI (lazy loading)"""
        if self._initialized:
            return

        vertexai.init(
            project=settings.GOOGLE_CLOUD_PROJECT,
            location=settings.VERTEX_AI_LOCATION
        )

        self.model = GenerativeModel(
            settings.GEMINI_MODEL,
            generation_config={
                "temperature": 0.1,  # Deterministe pour extraction
                "max_output_tokens": 4096,
                "response_mime_type": "application/json"
            }
        )

        self._initialized = True
        logger.info(f"Gemini initialized: {settings.GEMINI_MODEL}")

    async def process_document(
        self,
        document_content: bytes,
        mime_type: str,
        service_code: str,
        service_name: str,
        service_category: str
    ) -> DocumentProcessingResult:
        """
        Traite un document avec Gemini en un seul appel.

        Args:
            document_content: Contenu binaire du document
            mime_type: Type MIME (image/png, application/pdf, etc.)
            service_code: Code du service fiscal demande
            service_name: Nom du service
            service_category: Categorie du service

        Returns:
            DocumentProcessingResult avec classification, entities, risk_analysis
        """
        await self.initialize()

        start_time = time.time()

        # Build prompt with context
        prompt = UNIFIED_DOCUMENT_PROCESSING_PROMPT.format(
            service_name=service_name,
            service_code=service_code,
            service_category=service_category
        )

        # Create multimodal content
        document_part = Part.from_data(
            data=document_content,
            mime_type=mime_type
        )

        try:
            # Single API call for complete pipeline
            response = await asyncio.to_thread(
                self.model.generate_content,
                [document_part, prompt]
            )

            # Parse JSON response
            result_json = json.loads(response.text)

            processing_time_ms = int((time.time() - start_time) * 1000)

            # Build result object
            return DocumentProcessingResult(
                classification=ClassificationResult(**result_json["classification"]),
                entities=result_json.get("entities", {}),
                raw_text=result_json.get("raw_text"),
                risk_analysis=RiskAnalysis(**result_json["risk_analysis"]),
                processing_time_ms=processing_time_ms,
                gemini_model=settings.GEMINI_MODEL
            )

        except json.JSONDecodeError as e:
            logger.error(f"Gemini returned invalid JSON: {e}")
            # Return fallback with high risk
            return self._create_error_result(
                error_message=f"Invalid JSON response: {str(e)}",
                processing_time_ms=int((time.time() - start_time) * 1000)
            )

        except Exception as e:
            logger.error(f"Gemini processing error: {e}")
            return self._create_error_result(
                error_message=str(e),
                processing_time_ms=int((time.time() - start_time) * 1000)
            )

    def _create_error_result(
        self,
        error_message: str,
        processing_time_ms: int
    ) -> DocumentProcessingResult:
        """Create a result indicating processing failure"""
        from ..models.processing_result import (
            DocumentType, RiskLevel, WorkflowAction, CoherenceCheck
        )

        return DocumentProcessingResult(
            classification=ClassificationResult(
                document_type=DocumentType.AUTRE,
                confidence=0.0,
                detected_language="unknown"
            ),
            entities={},
            raw_text=None,
            risk_analysis=RiskAnalysis(
                risk_score=1.0,
                risk_level=RiskLevel.CRITICAL,
                risk_factors=["processing_error", error_message],
                coherence=CoherenceCheck(is_valid=False, checks_failed=["processing"]),
                recommendation=WorkflowAction.REJECT,
                justification=f"Document processing failed: {error_message}",
                confidence=0.0
            ),
            processing_time_ms=processing_time_ms,
            gemini_model=settings.GEMINI_MODEL
        )


# Singleton instance
gemini_processor = GeminiDocumentProcessor()
```

### Step 4: Create Tests

```python
# packages/backend/app/modules/gemini/tests/test_document_processor.py
import pytest
from unittest.mock import AsyncMock, MagicMock, patch
import json

from ..services.document_processor import GeminiDocumentProcessor
from ..models.processing_result import (
    DocumentProcessingResult, DocumentType, RiskLevel, WorkflowAction
)

# Mock response from Gemini
MOCK_GEMINI_RESPONSE = {
    "classification": {
        "document_type": "dni_cni",
        "confidence": 0.95,
        "detected_language": "es"
    },
    "entities": {
        "nif": {"field_name": "nif", "value": "123456789", "confidence": 0.92},
        "full_name": {"field_name": "full_name", "value": "Juan Perez", "confidence": 0.88}
    },
    "risk_analysis": {
        "risk_score": 0.15,
        "risk_level": "low",
        "risk_factors": [],
        "coherence": {
            "is_valid": True,
            "checks_passed": ["nif_format", "date_valid"],
            "checks_failed": [],
            "warnings": []
        },
        "recommendation": "auto_approve",
        "justification": "Document valid",
        "confidence": 0.90
    },
    "raw_text": "DNI REPUBLICA DE GUINEA ECUATORIAL..."
}

@pytest.fixture
def processor():
    return GeminiDocumentProcessor()

@pytest.fixture
def mock_document():
    # Fake PNG bytes
    return b'\x89PNG\r\n\x1a\n...'

class TestGeminiDocumentProcessor:

    @pytest.mark.asyncio
    async def test_process_document_success(self, processor, mock_document):
        """Test successful document processing"""
        with patch.object(processor, 'initialize', new_callable=AsyncMock):
            # Mock the model
            mock_response = MagicMock()
            mock_response.text = json.dumps(MOCK_GEMINI_RESPONSE)

            processor.model = MagicMock()
            processor.model.generate_content = MagicMock(return_value=mock_response)
            processor._initialized = True

            result = await processor.process_document(
                document_content=mock_document,
                mime_type="image/png",
                service_code="SRV001",
                service_name="Certificado de Residencia",
                service_category="Certificados"
            )

            assert isinstance(result, DocumentProcessingResult)
            assert result.classification.document_type == DocumentType.DNI_CNI
            assert result.classification.confidence == 0.95
            assert "nif" in result.entities
            assert result.risk_analysis.risk_score == 0.15
            assert result.risk_analysis.recommendation == WorkflowAction.AUTO_APPROVE

    @pytest.mark.asyncio
    async def test_process_document_invalid_json(self, processor, mock_document):
        """Test handling of invalid JSON response"""
        with patch.object(processor, 'initialize', new_callable=AsyncMock):
            mock_response = MagicMock()
            mock_response.text = "not valid json"

            processor.model = MagicMock()
            processor.model.generate_content = MagicMock(return_value=mock_response)
            processor._initialized = True

            result = await processor.process_document(
                document_content=mock_document,
                mime_type="image/png",
                service_code="SRV001",
                service_name="Test Service",
                service_category="Test"
            )

            # Should return error result with high risk
            assert result.risk_analysis.risk_score == 1.0
            assert result.risk_analysis.recommendation == WorkflowAction.REJECT
            assert "processing_error" in result.risk_analysis.risk_factors

    @pytest.mark.asyncio
    async def test_process_document_high_risk(self, processor, mock_document):
        """Test document with high risk score"""
        high_risk_response = MOCK_GEMINI_RESPONSE.copy()
        high_risk_response["risk_analysis"] = {
            "risk_score": 0.75,
            "risk_level": "high",
            "risk_factors": ["amount_mismatch", "document_near_expiry"],
            "coherence": {
                "is_valid": True,
                "checks_passed": ["nif_format"],
                "checks_failed": [],
                "warnings": ["near_expiry"]
            },
            "recommendation": "request_documents",
            "justification": "High value transaction with expiring document",
            "confidence": 0.85
        }

        with patch.object(processor, 'initialize', new_callable=AsyncMock):
            mock_response = MagicMock()
            mock_response.text = json.dumps(high_risk_response)

            processor.model = MagicMock()
            processor.model.generate_content = MagicMock(return_value=mock_response)
            processor._initialized = True

            result = await processor.process_document(
                document_content=mock_document,
                mime_type="image/png",
                service_code="SRV001",
                service_name="Test Service",
                service_category="Test"
            )

            assert result.risk_analysis.risk_score == 0.75
            assert result.risk_analysis.risk_level == RiskLevel.HIGH
            assert result.risk_analysis.recommendation == WorkflowAction.REQUEST_DOCUMENTS
```

## Environment Variables

```bash
# Deja configures (pas de changement)
GOOGLE_CLOUD_PROJECT=taxasge-dev
VERTEX_AI_LOCATION=us-central1
GEMINI_MODEL=gemini-2.0-flash-exp
```

## Integration with Service Requests

```python
# Dans service_request_service.py

async def create_service_request(
    self,
    db: asyncpg.Connection,
    user_id: int,
    service_code: str,
    document_file: UploadFile
) -> ServiceRequestResponse:
    """Create a service request with document processing"""

    # 1. Get service info
    service = await fiscal_service_repo.find_by_code(db, service_code)

    # 2. Upload to Firebase Storage
    document_url = await firebase_storage.upload(
        file=document_file,
        path=f"service-requests/{user_id}/{uuid4()}"
    )

    # 3. Process document with Gemini
    processing_result = await gemini_processor.process_document(
        document_content=await document_file.read(),
        mime_type=document_file.content_type,
        service_code=service_code,
        service_name=service.name_es,
        service_category=service.category
    )

    # 4. Calculate tariff with RBC
    tariff = await rbc_service.calculate(
        db=db,
        service_code=service_code,
        entities=processing_result.entities
    )

    # 5. Save to database
    request = await service_request_repo.create(
        db=db,
        user_id=user_id,
        service_code=service_code,
        document_url=document_url,
        gemini_classification=processing_result.classification.dict(),
        gemini_entities=processing_result.entities,
        gemini_risk_analysis=processing_result.risk_analysis.dict(),
        calculated_amount=tariff.total_amount,
        processing_time_ms=processing_result.processing_time_ms
    )

    return ServiceRequestResponse(
        id=request.id,
        status="pending_payment",
        document_type=processing_result.classification.document_type,
        extracted_data=processing_result.entities,
        total_amount=tariff.total_amount,
        breakdown=tariff.breakdown,
        risk_recommendation=processing_result.risk_analysis.recommendation
    )
```

## Checklist

- [ ] Read ARCHITECTURE_SIMPLIFIEE_PHASE1.md
- [ ] Create module structure
- [ ] Create Pydantic models (processing_result.py)
- [ ] Create unified prompt (prompts.py)
- [ ] Implement GeminiDocumentProcessor service
- [ ] Handle errors gracefully
- [ ] Create unit tests with mocks
- [ ] Test with real documents (integration test)
- [ ] Integrate with service_request_service
- [ ] Verify processing time < 4 seconds

## Performance Target

| Metric | Target |
|--------|--------|
| Processing time | < 3 seconds |
| Classification accuracy | > 90% |
| Entity extraction | > 85% |
| Risk assessment | Consistent with rules |
