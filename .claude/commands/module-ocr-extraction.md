# OCR Document Extraction Module Command

Implement or enhance the OCR (Optical Character Recognition) system for automatic document data extraction.

## Context

**OCR Module** extracts text and structured data from uploaded tax declaration forms:
- **Tesseract OCR** (text extraction from scanned documents)
- **Document AI Form Parser** (structured form parsing with field recognition)
- **Template-Based Extraction** (zone-label hybrid extraction with 3 strategies)
- **Auto-Fill Forms** (pre-populate web forms with extracted data)
- **Confidence Scoring** (per-field and overall quality metrics)
- **Multi-Language Support** (Spanish primary, French, English, Portuguese)

## Existing Implementation

**Backend Module:** `packages/backend/app/modules/documents/`

**Architecture:** Template-driven extraction system (Version 3.0)

**Key Files:**
- `services/ocr_service.py` - Tesseract OCR integration
- `extractors/zone_label_extractor.py` - Hybrid 3-strategy extraction (414 lines)
- `extractors/template_loader.py` - Dynamic template loading with caching (342 lines)
- `extractors/declarations/declaration_form_extractor.py` - Declaration extractors
- `mappers/declaration_mapper.py` - Form mapping to frontend (572 lines)
- `templates/declarations/` - JSON templates for 13 tax forms (7 templates)

**OCR Technologies:**
1. **Tesseract OCR** - Text extraction from images/PDFs
2. **Document AI (Form Parser)** - Structured field recognition and parsing

**Supported Forms:** 13 declaration forms (IVA, IRPF, Retenciones, Petroleum, Payroll, etc.)

## Workflow Architecture (from FISCAL_DECLARATIONS_ARCHITECTURE.md)

### PHASE 1: DECLARATION SUBMISSION - Two Methods

#### MÉTHODE A: Upload Pre-Filled Form (OCR-based)
```
1. User uploads PDF/image of pre-filled form
   ↓
2. OCR + AI Extraction Pipeline:
   a) Tesseract: Extract raw text from document
   b) Document AI (Form Parser): Structured parsing
   c) Field Recognition:
      - "Base Imponible 01": 1500000
      - "Tipo 02": 15%
      - "Cuota 03": 225000
      - ... (all form fields)
   d) extracted_data = {...} (JSONB)
   ↓
3. Auto-Fill Web Form:
   - form_auto_fill_data = extracted_data
   - User sees: pre-populated fields
   - User corrects OCR errors if any
   ↓
4. Submit declaration (status = 'submitted')
```

#### MÉTHODE B: Manual Entry
```
1. User fills web form manually
2. Frontend validation (regex, amount consistency)
3. Auto-calculations:
   - Total IVA Devengado = 03 + 06 + 09 + ...
   - Total a deducir = 022 + 023 + ...
   - Total a Ingresar = 021 - 028 (if positive)
4. Submit declaration
```

## Template-Based Extraction System

### Architecture Overview

```
Extraction Pipeline:
┌────────────────────────────────────────────────────────┐
│ 1. Template Loading (JSON)                            │
│    └─ Load form structure definition                  │
├────────────────────────────────────────────────────────┤
│ 2. OCR Text Extraction (Tesseract)                    │
│    └─ Extract raw text from PDF/image                 │
├────────────────────────────────────────────────────────┤
│ 3. Structured Extraction (ZoneLabelExtractor)         │
│    └─ Hybrid 3-strategy field extraction              │
├────────────────────────────────────────────────────────┤
│ 4. Form Mapping (Mappers)                             │
│    └─ Convert to frontend form structure              │
├────────────────────────────────────────────────────────┤
│ 5. Confidence Scoring                                 │
│    └─ Per-field + overall confidence (0-1)            │
└────────────────────────────────────────────────────────┘
```

### Core Components

**Template Loader** (`extractors/template_loader.py`):
- Loads JSON templates from `templates/declarations/` or `templates/fiscal_services/`
- Caching with singleton pattern (10ms first load, <1ms cached)
- Template validation on load

**Zone-Label Extractor** (`extractors/zone_label_extractor.py`):
- **Strategy 1: Label Detection** (Primary) ✅
  - Most robust - works with rotated/distorted scans
  - Finds label in OCR text (e.g., "N.I.F.")
  - Extracts value immediately after label
  - Confidence: 0.7 base + 0.2 if matches pattern

- **Strategy 2: Pattern Matching** (Fallback) ✅
  - Uses regex patterns from template
  - Searches entire OCR text for matching values
  - Confidence: 0.5 base + 0.2 if unique match

- **Strategy 3: Coordinate-Based** (Optional) ⏳
  - NOT YET IMPLEMENTED
  - Would use x, y, w, h coordinates + homography
  - Most accurate but brittle with poor scans
  - User feedback: "risky with bad scans"

**Form Mappers** (`mappers/declaration_mapper.py`):
- Convert extracted data to frontend form structure
- Value transformations (currency rounding, percentage formatting)
- Derived field calculations (totals, verifications)
- Confidence tracking per frontend field

### Template Structure (JSON)

```json
{
  "name": "iva_destajo",
  "category": "iva",
  "description": "IVA Destajo - 3 regimes (General, Reduced1, Reduced2)",
  "version": "1.0",
  "fields": [
    {
      "id": "nif",
      "label": ["N.I.F.", "NIF", "N.I.F"],
      "type": "text",
      "pattern": "\\d{8}[A-Z]",
      "required": true,
      "position_hint": "after_label"
    },
    {
      "id": "regimen_general_base",
      "label": ["Base Imponible", "Base Imponible:"],
      "type": "currency",
      "required": false,
      "position_hint": "after_label"
    },
    {
      "id": "regimen_general_tipo",
      "label": ["Tipo", "Tipo:"],
      "type": "percentage",
      "required": false
    }
  ],
  "validations": [
    {
      "type": "calculation",
      "formula": "cuota = base * (tipo / 100)",
      "tolerance": 0.01
    }
  ]
}
```

**Field Types:**
- `text` - String fields (names, addresses, IDs)
- `currency` - Monetary amounts (auto Euro/US format normalization)
- `percentage` - Tax rates, retention percentages
- `date` - Dates in DD/MM/YYYY format
- `year` - 4-digit years (2000-2030)

**Validation Types:**
- `calculation` - Verify arithmetic (e.g., cuota = base * tipo / 100)
- `format` - Regex pattern validation
- `range` - Numeric range checks

## Database Schema

```sql
documents:
  - id UUID PRIMARY KEY
  - declaration_id UUID FK → tax_declarations.id
  - file_path VARCHAR(500) -- Firebase Storage path
  - file_type VARCHAR(100) -- "application/pdf", "image/jpeg"
  - file_size_bytes INTEGER
  - ocr_text TEXT -- Extracted text (Tesseract)
  - ocr_confidence DECIMAL(5,2) -- 0-100
  - ocr_provider VARCHAR(50) -- "tesseract_server"
  - ocr_language VARCHAR(10) -- "spa", "eng", "fra"
  - extracted_data JSONB -- Structured form data (Document AI)
  - processing_status VARCHAR(50) -- "pending", "processing", "completed", "failed"
  - uploaded_at TIMESTAMP

tax_declarations:
  - declaration_data JSONB -- Auto-filled from extracted_data
  - original_ocr_data JSONB -- Raw OCR results
  - user_corrections JSONB -- Fields user corrected
  - extraction_confidence DECIMAL(5,2) -- Overall confidence
```

## Instructions

### Step 1: Read Existing Implementation
```bash
Read packages/backend/app/modules/documents/README.md
Read packages/backend/app/modules/documents/services/ocr_service.py
Read packages/backend/app/modules/documents/extractors/zone_label_extractor.py
Read packages/backend/app/modules/documents/extractors/template_loader.py
Read packages/backend/app/modules/documents/mappers/declaration_mapper.py
```

### Step 2: Understand Current System

**Implemented (Version 3.0):**
- [x] Tesseract OCR integration
- [x] Template-based extraction (7 templates for 13 forms)
- [x] Zone-label hybrid extraction (Strategy 1 & 2)
- [x] Form mappers for all declaration types
- [x] Confidence scoring system
- [x] Multi-language support (spa, eng, fra, por)
- [x] E2E tests with realistic samples

**Not Implemented:**
- [ ] Strategy 3 (coordinate-based extraction)
- [ ] Document AI API integration (currently using template-based logic only)
- [ ] Multi-document support (link related forms)
- [ ] Auto-classification (detect form type from OCR)
- [ ] Handwriting recognition
- [ ] Table extraction (invoice line items)

### Step 3: Use Subagents for Development

Launch 3 subagents in parallel for OCR enhancements:

#### Subagent 1: Document AI Form Parser Integration
```markdown
Task: Integrate Google Cloud Document AI for structured form parsing

Implement in packages/backend/app/modules/documents/services/:

1. Setup:
   - Enable Document AI API in Google Cloud Console
   - Create processor for "FORM_PARSER" type
   - Add google-cloud-documentai to requirements.txt
   - Configure credentials (service account JSON)

2. Implementation (services/document_ai_service.py):
   ```python
   from google.cloud import documentai_v1 as documentai

   class DocumentAIService:
       """
       Google Cloud Document AI integration for structured form parsing

       Use cases:
       - Tax declaration forms (IVA, IRPF, etc.)
       - Fiscal service documents (Nota de Ingreso)
       - Better accuracy than pure Tesseract for structured forms
       """

       def __init__(self):
           self.client = documentai.DocumentProcessorServiceClient()
           self.project_id = settings.GCP_PROJECT_ID
           self.location = "us"  # or "eu"
           self.processor_id = settings.DOCUMENT_AI_PROCESSOR_ID

       async def process_form(
           self,
           file_content: bytes,
           mime_type: str = "application/pdf"
       ) -> FormExtractionResult:
           """
           Process form using Document AI Form Parser

           Returns:
               FormExtractionResult with:
               - form_fields: Dict[field_name, field_value]
               - tables: List[Table] (if present)
               - confidence_scores: Dict[field_name, confidence]
               - raw_text: Full text from document
           """
           # Prepare request
           name = f"projects/{self.project_id}/locations/{self.location}/processors/{self.processor_id}"

           raw_document = documentai.RawDocument(
               content=file_content,
               mime_type=mime_type
           )

           request = documentai.ProcessRequest(
               name=name,
               raw_document=raw_document
           )

           # Process document
           result = self.client.process_document(request=request)
           document = result.document

           # Extract form fields
           form_fields = {}
           confidence_scores = {}

           for page in document.pages:
               for field in page.form_fields:
                   field_name = self._get_field_name(field.field_name)
                   field_value = self._get_field_value(field.field_value)
                   confidence = field.field_name.confidence

                   form_fields[field_name] = field_value
                   confidence_scores[field_name] = confidence

           # Extract tables (if present)
           tables = self._extract_tables(document.pages)

           return FormExtractionResult(
               form_fields=form_fields,
               tables=tables,
               confidence_scores=confidence_scores,
               raw_text=document.text,
               overall_confidence=self._calculate_overall_confidence(confidence_scores)
           )

       def _get_field_name(self, field_name_segment):
           """Extract clean field name from Document AI segment"""
           return field_name_segment.text_anchor.text_segments[0].text.strip()

       def _get_field_value(self, field_value_segment):
           """Extract clean field value from Document AI segment"""
           return field_value_segment.text_anchor.text_segments[0].text.strip()

       def _extract_tables(self, pages):
           """Extract tables from document pages"""
           tables = []
           for page in pages:
               for table in page.tables:
                   headers = [cell.text for cell in table.header_rows[0].cells]
                   rows = []
                   for row in table.body_rows:
                       row_data = {headers[i]: cell.text for i, cell in enumerate(row.cells)}
                       rows.append(row_data)
                   tables.append({"headers": headers, "rows": rows})
           return tables
   ```

3. Integration with Existing Pipeline:
   ```python
   # In ocr_service.py or extraction pipeline
   async def extract_with_hybrid_approach(
       file_content: bytes,
       file_type: str,
       form_type: str
   ):
       # Method 1: Try Document AI (if available and configured)
       if settings.DOCUMENT_AI_ENABLED:
           try:
               doc_ai_result = await document_ai_service.process_form(
                   file_content, file_type
               )
               if doc_ai_result.overall_confidence > 0.8:
                   # High confidence, use Document AI result
                   return doc_ai_result
           except Exception as e:
               logger.warning(f"Document AI failed: {e}, falling back to Tesseract")

       # Method 2: Fallback to Tesseract + Template-based
       ocr_result = await ocr_service.extract_text(file_content, file_type)
       template = template_loader.load(form_type, "declaration")
       extraction_result = await zone_label_extractor.extract_from_template(
           ocr_result.text, template, ocr_result.confidence
       )
       return extraction_result
   ```

4. Cost Optimization:
   - Use Document AI for critical/complex forms (IVA, IRPF)
   - Use Tesseract for simple forms (reduce API costs)
   - Cache results to avoid re-processing
   - Batch processing for multiple documents

Return: Document AI integration, hybrid fallback strategy
```

#### Subagent 2: Enhanced Template Extraction & Table Support
```markdown
Task: Enhance zone-label extractor with table extraction and improved strategies

Implement in packages/backend/app/modules/documents/extractors/:

1. Table Extraction (extractors/table_extractor.py):
   ```python
   class TableExtractor:
       """
       Extract tables from OCR text or Document AI results

       Use cases:
       - Invoice line items (Facturas)
       - IVA detailed operations (Detalle de ventas)
       - Payroll details (Nóminas)
       """

       async def extract_table(
           self,
           ocr_text: str,
           table_definition: dict,
           ocr_data: Optional[dict] = None
       ) -> TableExtractionResult:
           """
           Extract table from OCR text

           Args:
               ocr_text: Full OCR text
               table_definition: {
                   "start_pattern": "DETALLE DE VENTAS",
                   "end_pattern": "TOTAL",
                   "columns": ["Fecha", "Concepto", "Monto", "IVA"],
                   "delimiter": "|"  # or "\t" or regex
               }
               ocr_data: Optional word-level OCR data with bounding boxes

           Returns:
               TableExtractionResult with rows and confidence
           """
           # Find table boundaries
           start_idx = self._find_pattern(ocr_text, table_definition["start_pattern"])
           end_idx = self._find_pattern(ocr_text, table_definition["end_pattern"])

           if start_idx == -1 or end_idx == -1:
               return TableExtractionResult(success=False, error="Table boundaries not found")

           # Extract table region
           table_text = ocr_text[start_idx:end_idx]

           # Parse rows
           rows = []
           for line in table_text.split("\n"):
               if not line.strip():
                   continue

               # Split by delimiter
               cells = self._parse_row(line, table_definition["delimiter"])

               if len(cells) == len(table_definition["columns"]):
                   row_data = dict(zip(table_definition["columns"], cells))
                   rows.append(row_data)

           return TableExtractionResult(
               success=True,
               rows=rows,
               row_count=len(rows),
               confidence=self._calculate_table_confidence(rows)
           )

       def _parse_row(self, line: str, delimiter: str):
           """Parse table row by delimiter"""
           if delimiter == "regex":
               # Use regex for complex patterns
               return re.split(r'\s{2,}', line)  # 2+ spaces
           else:
               return [cell.strip() for cell in line.split(delimiter)]
   ```

2. Strategy 3: Coordinate-Based Extraction (optional):
   ```python
   # In zone_label_extractor.py
   async def _extract_strategy_3_coordinates(
       self,
       field_config: dict,
       ocr_data: dict  # Word-level with bounding boxes
   ) -> Optional[str]:
       """
       Strategy 3: Coordinate-based extraction with homography

       ONLY use if:
       - Template has coordinate hints
       - OCR data includes bounding boxes
       - Scan quality is high (confidence > 0.9)

       Approach:
       1. Find reference points (e.g., form borders)
       2. Calculate homography matrix (handle rotation/skew)
       3. Map template coordinates to actual scan
       4. Extract value at mapped coordinates
       """
       if not field_config.get("coordinates"):
           return None

       coords = field_config["coordinates"]  # {"x": 100, "y": 200, "w": 150, "h": 30}

       # Find reference points for homography
       reference_points = self._find_reference_points(ocr_data)
       if not reference_points:
           logger.warning("Reference points not found, skipping Strategy 3")
           return None

       # Calculate transformation matrix
       homography = self._calculate_homography(reference_points)

       # Map template coords to scan coords
       actual_coords = self._apply_homography(coords, homography)

       # Extract words within mapped region
       value = self._extract_words_in_region(ocr_data, actual_coords)

       if value:
           logger.debug(f"Strategy 3 extracted: {value}")
           return value

       return None
   ```

3. Multi-Page PDF Support:
   ```python
   async def extract_multi_page_form(
       pdf_content: bytes,
       form_type: str
   ) -> MultiPageExtractionResult:
       """
       Extract data from multi-page PDF declaration

       Example: IVA form with:
       - Page 1: Main declaration data
       - Page 2: Detailed operations table
       - Page 3: Supporting documents list
       """
       # Convert PDF to images (one per page)
       images = convert_from_bytes(pdf_content, dpi=300)

       page_results = []
       for page_num, image in enumerate(images, start=1):
           # OCR each page
           ocr_result = await ocr_service.extract_text_from_image(image)

           # Determine page type (main form, table, supporting docs)
           page_type = self._classify_page(ocr_result.text)

           # Extract based on page type
           if page_type == "main_form":
               extraction = await self._extract_main_form(ocr_result)
           elif page_type == "table":
               extraction = await self._extract_table_page(ocr_result)
           else:
               extraction = None

           page_results.append({
               "page_number": page_num,
               "page_type": page_type,
               "extraction": extraction
           })

       # Merge results from all pages
       merged_data = self._merge_page_results(page_results)

       return MultiPageExtractionResult(
           pages=page_results,
           merged_data=merged_data,
           total_pages=len(images)
       )
   ```

Return: Table extraction, Strategy 3 (optional), multi-page support
```

#### Subagent 3: OCR Review & Correction UI
```markdown
Task: Create user interface for reviewing and correcting OCR extractions

Create in packages/web/src/modules/declarations/ocr/:

1. Components:
   - OCRDocumentUploader.tsx (drag-and-drop with preview)
   - OCRExtractionPreview.tsx (document viewer + extracted fields)
   - OCRFieldCorrection.tsx (inline field editing with confidence badges)
   - OCRConfidenceIndicator.tsx (visual confidence scoring)
   - OCRComparisonView.tsx (side-by-side: document vs. form)

2. Document Upload Flow (OCRDocumentUploader.tsx):
   - Drag-and-drop or file picker
   - Support: PDF, JPEG, PNG (max 10MB)
   - Upload to Firebase Storage
   - Show processing status:
     - "Uploading..." (progress bar)
     - "Processing OCR..." (spinner)
     - "Extracting fields..." (progress %)
     - "Ready for review" (checkmark)

3. Extraction Preview (OCRExtractionPreview.tsx):
   - Split view layout:
     - Left: Document viewer (PDF.js or image)
     - Right: Extracted fields list
   - Bounding boxes overlay on document:
     - Show detected field regions
     - Color-coded by confidence:
       - Green: >90% (high confidence)
       - Yellow: 70-90% (review recommended)
       - Red: <70% (likely error)
   - Click field → Highlight region in document
   - Zoom and pan on document

4. Field Correction (OCRFieldCorrection.tsx):
   - Inline editing for each field:
     ```
     NIF: [12345678A]  ✓ 95%
     Base Imponible: [1,500,000.00]  ⚠ 75%  [Edit]
     Tipo: [15.0%]  ✗ 45%  [Edit]
     ```
   - Confidence badge next to each field
   - Edit button → Inline input field
   - Auto-save on blur or Enter
   - Track user corrections (for ML training)

5. Confidence Indicator (OCRConfidenceIndicator.tsx):
   - Overall document confidence (circular progress):
     - 0-50%: Red (manual review required)
     - 50-70%: Orange (some corrections needed)
     - 70-90%: Yellow (minor review)
     - 90-100%: Green (high confidence)
   - Per-field confidence badges
   - Tooltip: "OCR detected 'Tipo: 15%' with 85% confidence"

6. Comparison View (OCRComparisonView.tsx):
   - Side-by-side layout:
     - Left: Original document section
     - Right: Corresponding form fields
   - Synchronized scrolling
   - Highlight discrepancies:
     - Red: User corrected field (OCR was wrong)
     - Yellow: Low confidence field
   - "Accept All" button (if overall confidence >90%)
   - "Review Low Confidence" button (jump to next flagged field)

7. Workflow:
   ```
   User uploads document
      ↓
   Processing (OCR + extraction)
      ↓
   Review screen with confidence scores
      ↓
   User corrects low-confidence fields (if any)
      ↓
   Confirm and submit
      ↓
   Declaration created with corrected data
   ```

8. Hooks:
   - useUploadDocument() - Upload to Firebase + trigger OCR
   - useOCRStatus(documentId) - Poll processing status
   - useExtractedData(documentId) - Fetch OCR results
   - useCorrectField() - Submit user correction
   - useBulkAccept() - Accept all fields (high confidence)
   - useTrackCorrections() - Send corrections for ML training

9. Features:
   - Auto-save corrections (localStorage backup)
   - Keyboard shortcuts (Tab: next field, Enter: accept)
   - Mobile-friendly (responsive design)
   - Accessibility (screen reader support)

Return: Complete OCR review UI, correction workflow, confidence visualization
```

## Key Features (Current Implementation)

### 1. Template-Driven Architecture
- 7 JSON templates for 13 tax declaration forms
- Declarative form structure definition
- 90% less code duplication vs. per-form extractors

### 2. Hybrid 3-Strategy Extraction
- **Strategy 1: Label Detection** (primary, most robust)
- **Strategy 2: Pattern Matching** (fallback for missing labels)
- **Strategy 3: Coordinates** (not yet implemented, optional for high-quality scans)

### 3. Confidence Scoring
- Per-field confidence (0-1 scale)
- Overall document confidence (weighted average)
- Automatic flagging for manual review (<0.7)

### 4. Form Mapping
- Convert extracted data → frontend form structure
- Value transformations (currency, percentage, date)
- Derived field calculations (totals, verifications)
- Unmapped fields tracking

### 5. Performance
- Template caching (<1ms after first load)
- ~150ms average full form extraction
- 95%+ accuracy on high-quality scans
- 80-90% accuracy on medium-quality scans

## Use Cases

### Upload Pre-Filled IVA Form
1. Company fills IVA form on paper
2. Scans to PDF (300 DPI)
3. Uploads to TaxasGE
4. System processes:
   - Tesseract OCR: Extract text
   - Load IVA template
   - Zone-label extraction: Extract all fields
   - Confidence scoring: 92% overall
5. Web form pre-populated
6. User reviews, corrects 2 low-confidence fields
7. Submits declaration

### Low-Quality Scan
1. User uploads blurry phone photo of form
2. OCR confidence: 65% (low)
3. Many fields flagged as low-confidence (red)
4. User manually reviews and corrects 8 fields
5. System logs corrections for ML training
6. Submit declaration

### Multi-Page Declaration
1. User uploads 3-page IVA PDF
2. System processes:
   - Page 1: Main form data (extracted)
   - Page 2: Detailed operations table (extracted)
   - Page 3: Signature page (skipped)
3. Merge data from pages 1-2
4. Pre-fill form
5. User reviews and submits

## Testing

**Test Coverage:**
```bash
# Run E2E extraction tests
pytest packages/backend/tests/integration/test_document_extraction_e2e.py -v

# Test specific form
pytest packages/backend/tests/integration/test_document_extraction_e2e.py::TestDocumentExtractionE2E::test_iva_destajo_extraction_e2e -v
```

**Tested:**
- ✅ All 7 templates load successfully
- ✅ All 8 mappers instantiate correctly
- ✅ IVA Destajo extraction (3 regimes)
- ✅ Retención Servicios with municipality data
- ✅ Petroleum Products with pricing
- ✅ Payroll Tax with retention amounts
- ✅ Minimum Fiscal Fee with deductions
- ✅ Template validation rules
- ✅ Confidence scoring
- ✅ Missing fields handling

## Checklist

- [ ] Read documents module README.md
- [ ] Understand template-based extraction architecture
- [ ] Review zone-label extractor (3 strategies)
- [ ] Test Tesseract OCR with sample forms
- [ ] Integrate Document AI Form Parser (optional)
- [ ] Implement table extraction
- [ ] Add Strategy 3 (coordinate-based, optional)
- [ ] Build OCR review UI
- [ ] Create field correction interface
- [ ] Add confidence visualization
- [ ] Test with real tax declaration forms
- [ ] Measure accuracy (OCR vs. manual)
- [ ] Collect user corrections for ML training
- [ ] Optimize for poor-quality scans
- [ ] Add multi-page PDF support
