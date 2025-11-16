# 🧠 DOCUMENT AI SETUP GUIDE - Configuration complète

**Date**: 2025-11-16
**Project**: taxasge-dev
**Module**: Phase 2 - Document Extraction avec Google Document AI

---

## ❌ ERREURS CONCEPTUELLES À ÉVITER

### Erreur #1: Upload templates JSON vers Document AI
**INCORRECT** ❌ : Uploader templates JSON depuis Firebase Storage vers Document AI
**CORRECT** ✅ : Templates JSON restent dans Firebase Storage, utilisés par TemplateBasedExtractor

**Explication:**
- Document AI Form Parser est un modèle **pré-entraîné** ML
- Il détecte automatiquement les champs sans templates
- Nos templates JSON servent à **valider** et **mapper** les résultats Document AI

### Erreur #2: Stockage permanent des PDFs dans Document AI
**INCORRECT** ❌ : Uploader tous les PDFs utilisateurs dans Document AI
**CORRECT** ✅ : Envoyer PDFs à Document AI API en temps réel (pas de storage)

**Workflow correct:**
```
User PDF → Firebase Storage → Backend download → Document AI API call → Response
```

---

## ✅ CONFIGURATION REQUISE

### 1. Service Account (OBLIGATOIRE)

#### Étape 1.1: Créer Service Account

```bash
# Via gcloud CLI
gcloud iam service-accounts create taxasge-document-ai \
    --display-name="TaxasGE Document AI Service Account" \
    --project=taxasge-dev
```

**OU via Console Google Cloud:**
1. Aller à https://console.cloud.google.com/iam-admin/serviceaccounts?project=taxasge-dev
2. Cliquer "CREATE SERVICE ACCOUNT"
3. Nom: `taxasge-document-ai`
4. Description: `Service account for Document AI processing in TaxasGE backend`

#### Étape 1.2: Assigner rôles IAM

```bash
# Document AI API User (lecture/traitement)
gcloud projects add-iam-policy-binding taxasge-dev \
    --member="serviceAccount:taxasge-document-ai@taxasge-dev.iam.gserviceaccount.com" \
    --role="roles/documentai.apiUser"

# Storage Object Viewer (lecture Firebase Storage)
gcloud projects add-iam-policy-binding taxasge-dev \
    --member="serviceAccount:taxasge-document-ai@taxasge-dev.iam.gserviceaccount.com" \
    --role="roles/storage.objectViewer"
```

**OU via Console:**
1. Sélectionner le service account créé
2. Onglet "PERMISSIONS"
3. Ajouter rôles:
   - `Document AI API User`
   - `Storage Object Viewer`

#### Étape 1.3: Générer clé JSON

```bash
# Via gcloud
gcloud iam service-accounts keys create taxasge-document-ai-key.json \
    --iam-account=taxasge-document-ai@taxasge-dev.iam.gserviceaccount.com
```

**OU via Console:**
1. Service Account → "KEYS" tab
2. "ADD KEY" → "Create new key"
3. Type: JSON
4. Télécharger `taxasge-document-ai-key.json`

⚠️ **SÉCURITÉ CRITIQUE:**
```bash
# NE JAMAIS commit la clé dans Git!
# Ajouter au .gitignore:
echo "taxasge-document-ai-key.json" >> .gitignore
echo "*.json" >> .gitignore  # Si pas déjà présent
```

---

### 2. Configuration Backend (.env)

#### Ajouter dans `packages/backend/.env`:

```bash
# Google Cloud Document AI Configuration
GOOGLE_APPLICATION_CREDENTIALS=C:/taxasge/taxasge-document-ai-key.json
GOOGLE_CLOUD_PROJECT=taxasge-dev

# Document AI Processor (après création)
DOCUMENT_AI_PROCESSOR_ID=YOUR_PROCESSOR_ID_HERE
DOCUMENT_AI_LOCATION=eu  # ou us selon où tu as créé le processor
```

#### Alternative: Credentials JSON inline (pour production)

```bash
# Pour Cloud Run / Firebase Functions
GOOGLE_APPLICATION_CREDENTIALS_JSON='{
  "type": "service_account",
  "project_id": "taxasge-dev",
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "taxasge-document-ai@taxasge-dev.iam.gserviceaccount.com",
  ...
}'
```

---

### 3. Vérifier Processor Form Parser

#### Option A: Via gcloud

```bash
# Lister processeurs existants
gcloud documentai processors list \
    --project=taxasge-dev \
    --location=eu  # ou us

# Obtenir détails du processor
gcloud documentai processors describe PROCESSOR_ID \
    --project=taxasge-dev \
    --location=eu
```

#### Option B: Via Console

1. Aller à https://console.cloud.google.com/ai/document-ai/processors?project=taxasge-dev
2. Vérifier que le processor "FORM_PARSER" existe
3. Noter le **Processor ID** (format: `projects/PROJECT_ID/locations/LOCATION/processors/PROCESSOR_ID`)

**Si pas encore créé:**

```bash
# Créer Form Parser processor
gcloud documentai processors create \
    --display-name="TaxasGE Form Parser" \
    --type=FORM_PARSER_PROCESSOR \
    --project=taxasge-dev \
    --location=eu
```

---

## 🔧 IMPLÉMENTATION DOCUMENT AI SERVICE

### 4. Créer Document AI Service Python

**Créer fichier**: `packages/backend/app/services/document_ai_service.py`

```python
"""
Google Document AI Service for TaxasGE
Processes tax declaration forms with high accuracy
"""

import os
from typing import Dict, Any, List, Optional
from google.cloud import documentai_v1 as documentai
from google.api_core.client_options import ClientOptions
from loguru import logger
from pydantic import BaseModel

class DocumentAIResult(BaseModel):
    """Document AI processing result"""
    success: bool
    text: str
    confidence: float
    entities: Dict[str, Any]  # Detected form fields
    tables: List[Dict[str, Any]]  # Extracted tables
    processing_time_ms: int
    errors: List[str] = []

class DocumentAIService:
    """
    Service for processing documents with Google Document AI
    Optimized for tax declaration forms (IVA, IRPF, etc.)
    """

    def __init__(self):
        self.project_id = os.getenv("GOOGLE_CLOUD_PROJECT", "taxasge-dev")
        self.location = os.getenv("DOCUMENT_AI_LOCATION", "eu")
        self.processor_id = os.getenv("DOCUMENT_AI_PROCESSOR_ID")

        if not self.processor_id:
            logger.warning("DOCUMENT_AI_PROCESSOR_ID not configured")
            return

        # Initialize Document AI client
        opts = ClientOptions(api_endpoint=f"{self.location}-documentai.googleapis.com")
        self.client = documentai.DocumentProcessorServiceClient(client_options=opts)

        # Processor name
        self.processor_name = self.client.processor_path(
            self.project_id, self.location, self.processor_id
        )

        logger.info(f"Document AI initialized: {self.processor_name}")

    async def process_document(
        self,
        file_content: bytes,
        mime_type: str = "application/pdf"
    ) -> DocumentAIResult:
        """
        Process document with Document AI Form Parser

        Args:
            file_content: Document bytes
            mime_type: MIME type (application/pdf or image/*)

        Returns:
            DocumentAIResult with extracted data
        """
        import time
        start_time = time.time()

        try:
            # Create Document AI request
            raw_document = documentai.RawDocument(
                content=file_content,
                mime_type=mime_type
            )

            request = documentai.ProcessRequest(
                name=self.processor_name,
                raw_document=raw_document
            )

            # Process document
            result = self.client.process_document(request=request)
            document = result.document

            # Extract entities (form fields)
            entities = {}
            for entity in document.entities:
                entities[entity.type_] = {
                    "value": entity.mention_text,
                    "confidence": entity.confidence
                }

            # Extract tables
            tables = []
            for page in document.pages:
                for table in page.tables:
                    table_data = self._extract_table(table, document.text)
                    tables.append(table_data)

            # Calculate processing time
            processing_time = int((time.time() - start_time) * 1000)

            logger.info(f"Document AI processed: {len(entities)} entities, {len(tables)} tables")

            return DocumentAIResult(
                success=True,
                text=document.text,
                confidence=document.confidence if hasattr(document, 'confidence') else 0.9,
                entities=entities,
                tables=tables,
                processing_time_ms=processing_time
            )

        except Exception as e:
            logger.error(f"Document AI processing failed: {e}")
            return DocumentAIResult(
                success=False,
                text="",
                confidence=0.0,
                entities={},
                tables=[],
                processing_time_ms=int((time.time() - start_time) * 1000),
                errors=[str(e)]
            )

    def _extract_table(self, table, full_text: str) -> Dict[str, Any]:
        """Extract table data from Document AI table"""
        rows = []
        for row in table.body_rows:
            row_data = []
            for cell in row.cells:
                # Get cell text from layout
                cell_text = self._get_text_from_layout(cell.layout, full_text)
                row_data.append(cell_text)
            rows.append(row_data)

        return {
            "rows": rows,
            "row_count": len(rows),
            "column_count": len(rows[0]) if rows else 0
        }

    def _get_text_from_layout(self, layout, full_text: str) -> str:
        """Get text from layout segments"""
        text = ""
        for segment in layout.text_anchor.text_segments:
            start_index = int(segment.start_index) if hasattr(segment, 'start_index') else 0
            end_index = int(segment.end_index)
            text += full_text[start_index:end_index]
        return text.strip()

# Singleton instance
document_ai_service = DocumentAIService()
```

---

### 5. Intégrer dans ocr_service.py

**Modifier `_process_with_document_ai()`:**

```python
async def _process_with_document_ai(
    self,
    images: List[np.ndarray],
    language: str,
    document_type: Optional[str] = None
) -> OCRResult:
    """Process images with Google Document AI"""
    try:
        from app.services.document_ai_service import document_ai_service

        # Convert first image to bytes (Document AI processes PDFs better)
        import cv2
        img = images[0]
        is_success, buffer = cv2.imencode(".jpg", img)
        if not is_success:
            raise Exception("Failed to encode image")

        file_content = buffer.tobytes()

        # Process with Document AI
        result = await document_ai_service.process_document(
            file_content=file_content,
            mime_type="image/jpeg"
        )

        if not result.success:
            logger.warning("Document AI failed, falling back to Tesseract")
            return await self._process_with_tesseract_server(images, language, document_type)

        # Convert DocumentAIResult to OCRResult
        return OCRResult(
            success=True,
            text=result.text,
            confidence=result.confidence,
            word_confidences=[],  # Document AI ne fournit pas per-word confidence
            processing_time_ms=result.processing_time_ms,
            provider="document_ai",
            language=language,
            metadata={
                "entities": result.entities,
                "tables": result.tables
            }
        )

    except Exception as e:
        logger.error(f"Document AI processing failed: {e}")
        logger.warning("Falling back to Tesseract")
        return await self._process_with_tesseract_server(images, language, document_type)
```

---

## 🧪 TESTS

### Test 1: Vérifier credentials

```python
# test_document_ai.py
import os
from google.cloud import documentai_v1 as documentai
from google.api_core.client_options import ClientOptions

def test_credentials():
    """Test Document AI credentials"""
    project_id = os.getenv("GOOGLE_CLOUD_PROJECT", "taxasge-dev")
    location = "eu"

    opts = ClientOptions(api_endpoint=f"{location}-documentai.googleapis.com")
    client = documentai.DocumentProcessorServiceClient(client_options=opts)

    # List processors
    parent = f"projects/{project_id}/locations/{location}"
    processors = client.list_processors(parent=parent)

    print(f"✅ Credentials valid! Found {len(list(processors))} processors")
    for processor in processors:
        print(f"  - {processor.display_name} ({processor.type_})")

if __name__ == "__main__":
    test_credentials()
```

### Test 2: Process sample PDF

```python
# test_process_pdf.py
import asyncio
from app.services.document_ai_service import document_ai_service
from app.services.firebase_storage_service import firebase_storage_service

async def test_process_sample():
    """Test processing a sample tax form PDF"""

    # Download PDF from Firebase Storage
    pdf_path = "tax-forms/IVA_DESTAJO/I.V.A.-DESTAJO.pdf"
    download_result = await firebase_storage_service.download_file(
        file_path=pdf_path,
        user_id=None  # System file
    )

    # Process with Document AI
    result = await document_ai_service.process_document(
        file_content=download_result.content,
        mime_type="application/pdf"
    )

    print(f"✅ Success: {result.success}")
    print(f"📄 Text length: {len(result.text)} chars")
    print(f"🎯 Confidence: {result.confidence:.2%}")
    print(f"📊 Entities: {len(result.entities)}")
    print(f"📋 Tables: {len(result.tables)}")
    print(f"⏱️ Processing time: {result.processing_time_ms}ms")

    # Print extracted entities
    print("\n📝 Extracted entities:")
    for key, value in result.entities.items():
        print(f"  {key}: {value['value']} (confidence: {value['confidence']:.2%})")

if __name__ == "__main__":
    asyncio.run(test_process_sample())
```

---

## 📊 COMPARAISON TESSERACT VS DOCUMENT AI

| Critère | Tesseract | Document AI |
|---------|-----------|-------------|
| **Accuracy** | 70-80% | 95-98% |
| **Form fields** | ❌ Détection manuelle (regex) | ✅ Détection automatique |
| **Tables** | ❌ Nécessite parsing complexe | ✅ Structure préservée |
| **Checkboxes** | ❌ Très difficile | ✅ Natif |
| **Currency** | ⚠️ Via regex | ✅ Reconnaissance native |
| **Coût** | 💚 Gratuit | 💰 $1.50/1000 pages |
| **Vitesse** | ~2-3s/page | ~1s/page |
| **Setup** | 🟢 Simple | 🟡 Complexe (credentials, etc.) |

**Recommandation:**
- **Development/Tests**: Tesseract (gratuit, sufficient)
- **Production**: Document AI (accuracy critique pour fiscalité)
- **Hybrid**: Document AI primary, Tesseract fallback

---

## ⚠️ CHECKLIST SÉCURITÉ

- [ ] Service Account créé avec rôles minimaux (principe least privilege)
- [ ] Clé JSON **JAMAIS** committée dans Git
- [ ] `.gitignore` inclut `*.json` et `taxasge-document-ai-key.json`
- [ ] En production: utiliser Secret Manager (pas .env)
- [ ] Rotation clés service account tous les 90 jours
- [ ] Monitoring coûts Document AI (alertes si > budget)
- [ ] Rate limiting sur API Document AI (éviter abuse)

---

## 💰 COÛTS ESTIMÉS

**Document AI Form Parser Pricing:**
- 0-1,000 pages/mois: **$1.50 par 1,000 pages**
- 1,001-100,000 pages/mois: **$0.65 par 1,000 pages**
- 100,001-1M pages/mois: **$0.30 par 1,000 pages**

**Estimation TaxasGE:**
- Hypothèse: 100 déclarations/jour = 3,000 pages/mois
- Coût: 3,000 × $1.50/1000 = **$4.50/mois**
- Si scale à 1,000 déclarations/jour = 30,000 pages/mois
- Coût: 30,000 × $0.65/1000 = **$19.50/mois**

**Très abordable comparé à la valeur ajoutée!**

---

## 📚 RÉFÉRENCES

- [Document AI Form Parser Docs](https://cloud.google.com/document-ai/docs/form-parser)
- [Python Client Library](https://cloud.google.com/python/docs/reference/documentai/latest)
- [Sample Code (Python)](https://docs.cloud.google.com/document-ai/docs/samples/documentai-process-form-document?hl=fr#documentai_process_form_document-python)
- [Pricing](https://cloud.google.com/document-ai/pricing)
- [Best Practices](https://cloud.google.com/document-ai/docs/best-practices)

---

**Document créé**: 2025-11-16
**Auteur**: Claude Code (Backend Dev Agent)
**Status**: Ready for implementation
