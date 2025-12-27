# Document AI Module Command

> **NOTICE - PHASE 1:** Ce module N'EST PAS NECESSAIRE pour Phase 1.
> Gemini 2.0 Flash gere classification, extraction et analyse de risque.
> Document AI est reserve pour Phase 3 si ID Proofing reglementaire est requis.
>
> **Voir:** `Documentations/workflow/ARCHITECTURE_SIMPLIFIEE_PHASE1.md`
>
> **Alternative Phase 1:** Utiliser `/module-gemini-processor` pour le traitement unifie.

---

## Original Documentation (Reserve pour Phase 3 - ID Proofing)

Implement the Document AI integration for document classification, extraction, and ID verification.

## Context

**Document AI Module** handles all document processing for TaxasGE:
- **Classification** (DOCUMENT_SPLITTER processor)
- **Form Extraction** (FORM_PARSER processor)
- **ID Verification** (ID_PROOFING processor)
- **OCR Enhancement** (pre-processing pipeline)
- **Normalization** (date, amount, name formatting)

## Documentation Reference

**IMPORTANT:** Read architecture documentation first:
```bash
Read Documentations/workflow/RAPPORT_ARCHITECTURE_AGENTS_IA.md
```

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    PIPELINE DOCUMENT AI                                      │
└─────────────────────────────────────────────────────────────────────────────┘

  Input: PDF/Image
         │
         ▼
  ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
  │ PRE-TRAITEMENT  │     │ CLASSIFICATION  │     │   EXTRACTION    │
  │ ─────────────── │     │ ─────────────── │     │ ─────────────── │
  │ • Conversion    │────▶│ • Type document │────▶│ • FORM_PARSER   │
  │ • Orientation   │     │ • Confidence    │     │ • ID_PROOFING   │
  │ • Qualité       │     │ • Routing       │     │ • Key-values    │
  └─────────────────┘     └─────────────────┘     └─────────────────┘
                                                          │
                                                          ▼
                          ┌─────────────────┐     ┌─────────────────┐
                          │   VALIDATION    │     │  NORMALISATION  │
                          │ ─────────────── │◀────│ ─────────────── │
                          │ • NIF format    │     │ • Dates ISO     │
                          │ • Required      │     │ • Montants      │
                          │ • Confidence    │     │ • Noms          │
                          └─────────────────┘     └─────────────────┘
```

## Document AI Processors

### 1. DOCUMENT_SPLITTER (Classifier)

**Purpose:** Classify document type before extraction

**Supported Types:**
- `nota_ingreso` - Reçu officiel de paiement fiscal
- `dni_cni` - Carte d'identité nationale
- `passeport` - Passeport
- `permis_conduire` - Permis de conduire
- `licence_commerce` - Licence commerciale
- `licence_transport` - Licence transport
- `contrat` - Contrat légal
- `facture` - Facture commerciale
- `demande_officielle` - Formulaire de demande
- `certificat` - Certificat officiel
- `autre` - Non classifiable

**Routing Rules:**
- Confidence < 0.70 → Fallback to Gemini classification
- Type in [dni, passeport, permis] → ID_PROOFING
- Other types → FORM_PARSER

### 2. FORM_PARSER (Extractor)

**Purpose:** Extract key-value pairs from forms

**Documents Handled:**
- Nota de Ingreso (fiscal receipt)
- Demandes officielles
- Licences
- Contrats
- Factures

**Extraction Features:**
- Key-value pairs
- Tables
- Checkboxes
- Signatures
- Amounts

### 3. ID_PROOFING (Verifier)

**Purpose:** Verify and extract ID document data

**Documents Handled:**
- DNI/CNI (National ID)
- Passeport
- Permis de conduire

**Extraction:**
- Full name
- Date of birth
- Document number
- Expiration date
- Nationality
- Photo hash
- MRZ (Machine Readable Zone)

## Target Module Structure

```
packages/backend/app/modules/document_ai/
├── __init__.py
├── api/
│   └── document_ai_routes.py      # API endpoints
├── models/
│   ├── __init__.py
│   ├── classification.py          # Classification models
│   ├── extraction.py              # Extraction models
│   └── validation.py              # Validation models
├── services/
│   ├── __init__.py
│   ├── document_ai_service.py     # Main orchestration
│   ├── classifier_service.py      # Classification logic
│   ├── form_parser_service.py     # Form extraction
│   ├── id_proofing_service.py     # ID verification
│   ├── preprocessor_service.py    # Image preprocessing
│   └── normalizer_service.py      # Data normalization
├── repositories/
│   └── extraction_repository.py   # Save extraction results
├── workers/
│   └── document_worker.py         # CloudAMQP consumer
└── config/
    └── processor_config.py        # Processor IDs, settings
```

## Instructions

### Step 1: Read Existing Implementation
```bash
Read packages/backend/app/modules/documents/services/extraction_service.py
Read packages/backend/app/modules/documents/extractors/
Read Documentations/workflow/RAPPORT_ARCHITECTURE_AGENTS_IA.md (Section 3)
```

### Step 2: Use Subagents for Development

Launch 3 subagents in parallel:

#### Subagent 1: Classification & Preprocessing
```markdown
Task: Implement Document AI classifier and preprocessing pipeline

1. Create ClassifierService:
   ```python
   from google.cloud import documentai_v1 as documentai

   class ClassifierService:
       PROCESSOR_ID = settings.DOCUMENT_AI_CLASSIFIER_PROCESSOR_ID
       LOCATION = "eu"

       async def classify_document(
           self,
           file_content: bytes,
           mime_type: str
       ) -> ClassificationResult:
           client = documentai.DocumentProcessorServiceClient()
           name = f"projects/{PROJECT}/locations/{LOCATION}/processors/{PROCESSOR_ID}"

           request = documentai.ProcessRequest(
               name=name,
               raw_document=documentai.RawDocument(
                   content=file_content,
                   mime_type=mime_type
               )
           )

           result = await client.process_document(request=request)

           # Parse classification
           return ClassificationResult(
               document_type=result.document.entities[0].type_,
               confidence=result.document.entities[0].confidence,
               language=result.document.language_code
           )
   ```

2. Create PreprocessorService:
   ```python
   from PIL import Image
   import pdf2image

   class PreprocessorService:
       async def preprocess(
           self,
           file_content: bytes,
           mime_type: str
       ) -> bytes:
           # 1. Convert PDF to images if needed
           if mime_type == "application/pdf":
               images = pdf2image.convert_from_bytes(file_content)
               # Process first page for classification
               file_content = self._image_to_bytes(images[0])

           # 2. Detect and correct orientation
           image = Image.open(io.BytesIO(file_content))
           rotated = self._correct_orientation(image)

           # 3. Enhance quality (contrast, noise reduction)
           enhanced = self._enhance_image(rotated)

           return enhanced

       def _correct_orientation(self, image: Image) -> Image:
           # Use EXIF data or Tesseract OSD
           pass

       def _enhance_image(self, image: Image) -> bytes:
           # Adjust contrast, reduce noise
           pass
   ```

3. Create GeminiFallback for low-confidence classification:
   ```python
   class GeminiFallbackClassifier:
       async def classify_with_gemini(
           self,
           ocr_text: str
       ) -> ClassificationResult:
           prompt = CLASSIFICATION_FALLBACK_PROMPT.format(ocr_text=ocr_text)
           response = await gemini_service.generate(prompt)
           return parse_classification_response(response)
   ```

4. Configuration:
   ```python
   # config/processor_config.py
   DOCUMENT_CLASSES = {
       "nota_ingreso": {
           "route_to": "FORM_PARSER",
           "required_fields": ["numero_nota", "nif_demandeur", "montant"]
       },
       "dni_cni": {
           "route_to": "ID_PROOFING",
           "required_fields": ["nom", "numero_document", "date_expiration"]
       },
       # ... other classes
   }
   ```

Return: Classifier service, preprocessor, Gemini fallback
```

#### Subagent 2: Form Extraction & ID Proofing
```markdown
Task: Implement form extraction and ID verification

1. Create FormParserService:
   ```python
   class FormParserService:
       PROCESSOR_ID = settings.DOCUMENT_AI_FORM_PARSER_PROCESSOR_ID

       async def extract_form_data(
           self,
           file_content: bytes,
           mime_type: str,
           document_type: str
       ) -> FormExtractionResult:
           client = documentai.DocumentProcessorServiceClient()

           request = documentai.ProcessRequest(
               name=f"projects/{PROJECT}/locations/{LOCATION}/processors/{PROCESSOR_ID}",
               raw_document=documentai.RawDocument(
                   content=file_content,
                   mime_type=mime_type
               )
           )

           result = await client.process_document(request=request)

           # Parse entities
           entities = {}
           for entity in result.document.entities:
               entities[entity.type_] = {
                   "value": entity.mention_text,
                   "confidence": entity.confidence,
                   "normalized": entity.normalized_value
               }

           # Parse tables
           tables = self._extract_tables(result.document)

           # Parse checkboxes
           checkboxes = self._extract_checkboxes(result.document)

           return FormExtractionResult(
               entities=entities,
               tables=tables,
               checkboxes=checkboxes,
               processing_time_ms=result.processing_time
           )
   ```

2. Create IDProofingService:
   ```python
   class IDProofingService:
       PROCESSOR_ID = settings.DOCUMENT_AI_ID_PROOFING_PROCESSOR_ID

       async def verify_id_document(
           self,
           file_content: bytes,
           mime_type: str,
           expected_type: str  # PASSPORT, DRIVER_LICENSE, NATIONAL_ID
       ) -> IDVerificationResult:
           client = documentai.DocumentProcessorServiceClient()

           request = documentai.ProcessRequest(
               name=f"projects/{PROJECT}/locations/{LOCATION}/processors/{PROCESSOR_ID}",
               raw_document=documentai.RawDocument(
                   content=file_content,
                   mime_type=mime_type
               ),
               field_mask=documentai.DocumentMask(
                   paths=["entities"]
               )
           )

           result = await client.process_document(request=request)

           # Extract ID fields
           id_data = self._parse_id_entities(result.document.entities)

           # Verify MRZ if passport
           if expected_type == "PASSPORT":
               mrz_valid = self._verify_mrz(id_data.get("mrz_line_1"), id_data.get("mrz_line_2"))
           else:
               mrz_valid = None

           return IDVerificationResult(
               document_type=expected_type,
               full_name=id_data.get("full_name"),
               document_number=id_data.get("document_number"),
               date_of_birth=id_data.get("date_of_birth"),
               expiration_date=id_data.get("expiration_date"),
               nationality=id_data.get("nationality"),
               mrz_valid=mrz_valid,
               is_expired=self._check_expiration(id_data.get("expiration_date")),
               confidence_scores=id_data.get("confidences", {})
           )
   ```

3. Create NormalizerService:
   ```python
   class NormalizerService:
       async def normalize_extraction(
           self,
           entities: Dict[str, Any],
           document_type: str
       ) -> Dict[str, Any]:
           normalized = {}

           for field, data in entities.items():
               value = data.get("value")

               if field in ["date_emission", "date_expiration", "date_naissance"]:
                   normalized[field] = self._normalize_date(value)

               elif field in ["montant", "amount", "total"]:
                   normalized[field] = self._normalize_amount(value)

               elif field in ["nom", "full_name", "nom_demandeur"]:
                   normalized[field] = self._normalize_name(value)

               elif field in ["telephone", "phone"]:
                   normalized[field] = self._normalize_phone(value)

               elif field == "nif":
                   normalized[field] = self._normalize_nif(value)

               else:
                   normalized[field] = value

           return normalized

       def _normalize_date(self, value: str) -> str:
           # Convert to ISO 8601 (YYYY-MM-DD)
           pass

       def _normalize_amount(self, value: str) -> Decimal:
           # Remove currency symbols, convert to decimal
           pass

       def _normalize_nif(self, value: str) -> str:
           # Validate NIF format, add checksum if needed
           pass
   ```

Return: Form parser, ID proofer, normalizer with validation
```

#### Subagent 3: Orchestration & Worker
```markdown
Task: Create main service orchestration and CloudAMQP worker

1. Create DocumentAIService (Main Orchestrator):
   ```python
   class DocumentAIService:
       def __init__(
           self,
           classifier: ClassifierService,
           form_parser: FormParserService,
           id_proofer: IDProofingService,
           preprocessor: PreprocessorService,
           normalizer: NormalizerService,
           gemini_fallback: GeminiFallbackClassifier
       ):
           self.classifier = classifier
           self.form_parser = form_parser
           self.id_proofer = id_proofer
           self.preprocessor = preprocessor
           self.normalizer = normalizer
           self.gemini_fallback = gemini_fallback

       async def process_document(
           self,
           file_id: str,
           file_content: bytes,
           mime_type: str,
           expected_type: Optional[str] = None
       ) -> DocumentProcessingResult:
           start_time = time.time()

           # 1. Preprocess
           processed_content = await self.preprocessor.preprocess(
               file_content, mime_type
           )

           # 2. Classify (unless type is known)
           if expected_type:
               classification = ClassificationResult(
                   document_type=expected_type,
                   confidence=1.0
               )
           else:
               classification = await self.classifier.classify_document(
                   processed_content, mime_type
               )

               # Fallback to Gemini if low confidence
               if classification.confidence < 0.70:
                   ocr_text = await self._get_ocr_text(processed_content)
                   classification = await self.gemini_fallback.classify_with_gemini(ocr_text)

           # 3. Route to appropriate extractor
           if classification.document_type in ["dni_cni", "passeport", "permis_conduire"]:
               extraction = await self.id_proofer.verify_id_document(
                   processed_content, mime_type, classification.document_type
               )
           else:
               extraction = await self.form_parser.extract_form_data(
                   processed_content, mime_type, classification.document_type
               )

           # 4. Normalize extracted data
           normalized = await self.normalizer.normalize_extraction(
               extraction.entities,
               classification.document_type
           )

           # 5. Validate required fields
           validation = await self._validate_extraction(
               normalized, classification.document_type
           )

           processing_time = int((time.time() - start_time) * 1000)

           return DocumentProcessingResult(
               file_id=file_id,
               classification=classification,
               entities=normalized,
               validation=validation,
               processing_time_ms=processing_time
           )
   ```

2. Create DocumentWorker (CloudAMQP):
   ```python
   class DocumentWorker:
       QUEUE_NAME = "documents"

       async def start(self):
           connection = await aio_pika.connect_robust(settings.CLOUDAMQP_URL)
           channel = await connection.channel()
           await channel.set_qos(prefetch_count=5)

           queue = await channel.declare_queue(
               self.QUEUE_NAME,
               durable=True,
               arguments={
                   "x-message-ttl": 86400000,  # 24h
                   "x-dead-letter-exchange": "dlx"
               }
           )

           await queue.consume(self._process_message)

       async def _process_message(self, message: IncomingMessage):
           async with message.process():
               data = json.loads(message.body)

               # Download file from storage
               file_content = await storage.download(data["storage_url"])

               # Process document
               result = await document_ai_service.process_document(
                   file_id=data["file_id"],
                   file_content=file_content,
                   mime_type=data["mime_type"]
               )

               # Save to database
               await extraction_repo.save(
                   file_id=data["file_id"],
                   classification=result.classification,
                   entities=result.entities,
                   validation=result.validation
               )

               # Publish to next queue (risk-analysis)
               await self._publish_to_risk_queue(data, result)
   ```

3. Create API Endpoints:
   ```python
   router = APIRouter(prefix="/document-ai", tags=["document-ai"])

   @router.post("/process", response_model=DocumentProcessingResult)
   async def process_document(
       file: UploadFile,
       expected_type: Optional[str] = None
   ):
       content = await file.read()
       return await document_ai_service.process_document(
           file_id=str(uuid.uuid4()),
           file_content=content,
           mime_type=file.content_type,
           expected_type=expected_type
       )

   @router.get("/supported-types")
   async def get_supported_types():
       return DOCUMENT_CLASSES
   ```

Return: Orchestration service, CloudAMQP worker, API endpoints
```

## Environment Variables

```bash
# Document AI
DOCUMENT_AI_PROJECT_ID=taxasge-dev
DOCUMENT_AI_LOCATION=eu
DOCUMENT_AI_CLASSIFIER_PROCESSOR_ID=xxx
DOCUMENT_AI_FORM_PARSER_PROCESSOR_ID=xxx
DOCUMENT_AI_ID_PROOFING_PROCESSOR_ID=xxx
```

## Dependencies

```txt
# requirements.txt additions
google-cloud-documentai>=2.20.0
pdf2image>=1.16.3
Pillow>=10.0.0
```

## Checklist

- [ ] Read existing extraction_service.py
- [ ] Read RAPPORT_ARCHITECTURE_AGENTS_IA.md
- [ ] Create Document AI processors in GCP Console
- [ ] Configure processor IDs in environment
- [ ] Implement PreprocessorService
- [ ] Implement ClassifierService
- [ ] Implement FormParserService
- [ ] Implement IDProofingService
- [ ] Implement NormalizerService
- [ ] Implement GeminiFallbackClassifier
- [ ] Create main DocumentAIService orchestrator
- [ ] Create CloudAMQP DocumentWorker
- [ ] Create API endpoints
- [ ] Test with real documents
- [ ] Integration tests
