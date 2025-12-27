# OCR Extraction avec Firebase Storage - Architecture Refactorée

**Version:** 2.0 (Refactor)
**Date:** 2025-12-03
**Objectif:** Implémenter workflows séparés (Déclaration + Pièces Jointes) avec temp storage

---

## 🎯 ARCHITECTURE OVERVIEW

### Principe Fondamental: 2 WORKFLOWS SÉPARÉS

```
┌──────────────────────────────────────────────────────────────┐
│ WORKFLOW A: DÉCLARATION (Formulaire Fiscal)                  │
│ Temp Storage → OCR → Review → Submit → Firebase (atomique)   │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│ WORKFLOW B: PIÈCES JOINTES (Factures pour contrôle)          │
│ Séparé, 3 options, Classification, Contrôle NON bloquant     │
└──────────────────────────────────────────────────────────────┘
```

**Pourquoi séparés?**
- Déclaration = Montant déclaré par l'entreprise
- Pièces jointes = Contrôle de cohérence (optionnel, NON bloquant)
- Écart toléré: <3% OK, 3-5% justificatif, 5-10% agent, >10% rejet

---

## 📋 WORKFLOW A: DÉCLARATION FISCALE

### Principe: Temp Storage First, Firebase Only on Submit

**Rationale:**
> "le traitement OCR se fait sur le fichier dans l'enregistrement temporaire... pour eviter que si ce n'est pas le bon fichier il ne soit pas sauvegardé dans firebase directement"

**Technologies:**
- OCR: Tesseract + Document AI (Form Parser)
- Temp Storage: Redis (ou Disk avec 15min TTL)
- Final Storage: Firebase Storage (atomic avec déclaration)

---

### PHASE 1: UPLOAD & TEMP STORAGE

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Frontend: User uploads formulaire fiscal                │
│    - File selector: PDF/image                               │
│    - Validation: type (PDF/JPG/PNG), size (<10MB)           │
│    - Preview document (optional)                            │
└─────────────────────────────────────────────────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. Frontend: Upload to Backend (multipart/form-data)       │
│    - Endpoint: POST /api/v1/ocr/upload-temp                │
│    - Body: {                                                │
│        file: File,                                          │
│        declaration_type: "iva_real",                        │
│        user_id: "uuid",                                     │
│        session_id: "uuid" (frontend generated)              │
│      }                                                      │
└─────────────────────────────────────────────────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. Backend: Save to Temp Storage (NOT Firebase yet)        │
│    - Service: temp_storage_service.py                       │
│    - Storage options:                                       │
│      a) Redis: key = "temp:ocr:{session_id}:{file_uuid}"   │
│         TTL = 15 minutes (auto-delete)                      │
│      b) Disk: /tmp/ocr/{session_id}/{file_uuid}.pdf        │
│         Cleanup: Cron job every 15min                       │
│    - Security checks:                                       │
│      • MIME type validation (PDF, JPG, PNG only)           │
│      • File size check (max 10MB)                          │
│      • Antivirus scan (.exe, .bat blocked)                 │
│      • User ownership verification                         │
│    - Generate metadata:                                     │
│      • temp_file_id: UUID                                  │
│      • uploaded_at: timestamp                              │
│      • user_id: UUID                                       │
│      • session_id: UUID                                    │
│      • original_filename: "IVA_REAL_Oct_2024.pdf"         │
│    - Response: {                                            │
│        temp_file_id: "uuid",                               │
│        session_id: "uuid",                                 │
│        filename: "IVA_REAL_Oct_2024.pdf",                  │
│        file_size: 2456789,                                 │
│        uploaded_at: "2025-12-03T10:30:00Z",               │
│        expires_at: "2025-12-03T10:45:00Z"  (15min)        │
│      }                                                      │
└─────────────────────────────────────────────────────────────┘
```

---

### PHASE 2: OCR FROM TEMP STORAGE

```
┌─────────────────────────────────────────────────────────────┐
│ 4. Backend: Trigger OCR Processing                         │
│    - Automatic after upload (sync or async)                │
│    - OR User clicks "Extract Data" button                  │
│    - Endpoint: POST /api/v1/ocr/process                    │
│    - Body: {                                                │
│        temp_file_id: "uuid",                               │
│        session_id: "uuid",                                 │
│        declaration_type: "iva_real"                        │
│      }                                                      │
└─────────────────────────────────────────────────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────────┐
│ 5. Backend: Load from Temp Storage                         │
│    - Service: temp_storage_service.load()                  │
│    - Redis: GET "temp:ocr:{session_id}:{temp_file_id}"    │
│    - OR Disk: read /tmp/ocr/{session_id}/{temp_file_id}.pdf│
│    - Validation: Check expiration (15min TTL)              │
│    - If expired: Return error "File expired, upload again" │
│    - Result: file_bytes (binary content)                   │
└─────────────────────────────────────────────────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────────┐
│ 6. Backend: Tesseract OCR Extraction                       │
│    - Service: ocr_service.extract_text()                   │
│    - Input: {                                               │
│        file_content: file_bytes,                           │
│        language: "spa" (Spanish primary),                  │
│        document_type: "iva_real"                           │
│      }                                                      │
│    - Processing:                                            │
│      • Convert PDF to images (pdf2image)                   │
│      • Preprocessing: deskew, denoise, contrast            │
│      • Tesseract OCR (languages: spa+eng+fra)              │
│      • Confidence calculation per word                     │
│    - Result: {                                              │
│        success: true,                                      │
│        ocr_text: "N.I.F.: 12345678A\nEjercicio: 2024...", │
│        ocr_confidence: 0.92,                               │
│        ocr_provider: "tesseract",                          │
│        processing_time_ms: 1250                            │
│      }                                                      │
└─────────────────────────────────────────────────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────────┐
│ 7. Backend: Template-Based Structured Extraction           │
│    - Load template: template_loader.load("iva_real")      │
│    - Extractor: TemplateBasedExtractor + ZoneLabelExtractor│
│    - Strategy 1: Label Detection (primary)                 │
│      • Find "Base Imponible" → Extract value after         │
│      • Confidence: 0.7 base + 0.2 if pattern match         │
│    - Strategy 2: Pattern Matching (fallback)               │
│      • Regex: \d{8}[A-Z] for NIF                          │
│      • Confidence: 0.5 base + 0.2 if unique                │
│    - Extract all fields (68 fields for IVA-REAL):          │
│      • nif: "12345678A" (confidence: 0.95)                 │
│      • ejercicio: "2024" (confidence: 0.92)                │
│      • base_imponible_01: 1500000 (confidence: 0.88)       │
│      • tipo_02: 15.0 (confidence: 0.92)                    │
│      • cuota_03: 225000 (confidence: 0.85)                 │
│      • ... (all fields)                                    │
│    - Business validation:                                   │
│      • cuota = base * (tipo / 100) ✓                       │
│      • total_a_pagar = devengado - deducible ✓            │
│    - Result: {                                              │
│        success: true,                                      │
│        extracted_data: {...},                              │
│        field_confidences: {...},                           │
│        overall_confidence: 0.89,                           │
│        warnings: ["base_liquidable low confidence"],       │
│        low_confidence_fields: ["base_liquidable"]          │
│      }                                                      │
└─────────────────────────────────────────────────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────────┐
│ 8. Backend: Store OCR Result in Temp Session               │
│    - Redis: SET "session:{session_id}:ocr_result"         │
│      Value: JSON serialized OCR result                     │
│      TTL: 15 minutes (same as file)                        │
│    - Response to Frontend: {                                │
│        temp_file_id: "uuid",                               │
│        session_id: "uuid",                                 │
│        ocr_confidence: 0.92,                               │
│        extraction_confidence: 0.89,                        │
│        extracted_data: {...},                              │
│        field_confidences: {...},                           │
│        low_confidence_fields: ["base_liquidable"],         │
│        warnings: ["Verify base_liquidable manually"]       │
│      }                                                      │
└─────────────────────────────────────────────────────────────┘
```

---

### PHASE 3: USER REVIEW & CORRECTION

```
┌─────────────────────────────────────────────────────────────┐
│ 9. Frontend: Display OCR Review Screen                     │
│    - Split view:                                            │
│      • Left: Document viewer (PDF.js)                       │
│        - Display from temp storage (base64 or blob URL)    │
│        - Zoom, pan, rotate controls                        │
│      • Right: Form fields (auto-filled)                    │
│        - Pre-filled with extracted_data                    │
│        - Confidence badges per field                       │
│        - Low confidence fields highlighted (yellow/red)    │
│    - Overall confidence indicator: 89% (Green)             │
│    - Warnings banner: "1 field needs review"               │
│    - Actions:                                               │
│      • [Re-upload] - Upload different file                 │
│      • [Edit Fields] - Correct OCR errors                  │
│      • [Submit Declaration] - Save to Firebase             │
└─────────────────────────────────────────────────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────────┐
│ 10. User: Review & Correct Fields                          │
│     - Auto-filled fields:                                   │
│       • NIF: [12345678A] ✓ 95%                             │
│       • Base Imponible: [1,500,000.00] ✓ 88%              │
│       • Base Liquidable: [1,400,000.00] ⚠ 65%  [Edit]     │
│     - User clicks [Edit] on low-confidence field            │
│     - Inline input appears                                  │
│     - User corrects: 1,400,000.00 → 1,450,000.00           │
│     - Auto-save correction (localStorage)                   │
│     - Track correction: {                                   │
│         field: "base_liquidable",                           │
│         ocr_value: 1400000,                                │
│         user_value: 1450000,                               │
│         confidence_was: 0.65,                              │
│         corrected_at: timestamp                            │
│       }                                                     │
│     - Frontend validation:                                  │
│       • Required fields filled ✓                           │
│       • Auto-calculations verified ✓                       │
│       • No negative amounts (except credits) ✓             │
└─────────────────────────────────────────────────────────────┘
```

---

### PHASE 4: SUBMIT & SAVE TO FIREBASE (ATOMIC)

```
┌─────────────────────────────────────────────────────────────┐
│ 11. User: Submit Declaration                               │
│     - Click "Submit Declaration"                            │
│     - Frontend confirmation: "Save declaration?"            │
│     - POST /api/v1/declarations/submit                      │
│     - Body: {                                               │
│         company_id: "uuid",                                │
│         declaration_type: "monthly_vat_standard",          │
│         tax_period: "2024-10",                             │
│         declaration_data: {                                │
│           ... (corrected form data)                        │
│         },                                                 │
│         original_ocr_data: {...},                          │
│         user_corrections: [...],                           │
│         temp_file_id: "uuid",                              │
│         session_id: "uuid"                                 │
│       }                                                    │
└─────────────────────────────────────────────────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────────┐
│ 12. Backend: ATOMIC TRANSACTION (Declaration + Firebase)   │
│     - BEGIN TRANSACTION                                     │
│                                                            │
│     Step 1: Load file from temp storage                    │
│     ├─ temp_storage_service.load(temp_file_id)           │
│     ├─ Validation: Check expiration                       │
│     └─ Result: file_bytes                                 │
│                                                            │
│     Step 2: Upload to Firebase Storage                     │
│     ├─ firebase_storage_service.upload_declaration()      │
│     ├─ Path: user-documents/{userId}/{declarationId}/     │
│     │         {original_filename}_{uuid}.pdf              │
│     ├─ Metadata: {                                        │
│     │    uploadedBy: user_id,                            │
│     │    uploadedAt: timestamp,                          │
│     │    declarationId: declaration_id,                  │
│     │    declarationType: "iva_real",                    │
│     │    ocrProcessed: true,                             │
│     │    ocrConfidence: 0.89                             │
│     │  }                                                 │
│     └─ Result: firebase_storage_url                      │
│                                                            │
│     Step 3: Save to Database (documents table)             │
│     ├─ INSERT INTO documents (                            │
│     │    id: uuid(),                                      │
│     │    user_id: user_id,                               │
│     │    declaration_id: declaration_id,                 │
│     │    file_path: "user-documents/...",                │
│     │    storage_url: firebase_storage_url,              │
│     │    file_type: "application/pdf",                   │
│     │    file_size_bytes: 2456789,                       │
│     │    processing_status: "completed",                 │
│     │    ocr_text: "...",                                │
│     │    ocr_confidence: 0.92,                           │
│     │    extracted_data: {...},                          │
│     │    extraction_confidence: 0.89,                    │
│     │    uploaded_at: NOW()                              │
│     │  )                                                 │
│     └─ Result: document_id                               │
│                                                            │
│     Step 4: Save Declaration (tax_declarations table)      │
│     ├─ INSERT INTO tax_declarations (                     │
│     │    id: uuid(),                                      │
│     │    user_id: user_id,                               │
│     │    company_id: company_id,                         │
│     │    declaration_type: "monthly_vat_standard",       │
│     │    tax_period: "2024-10",                          │
│     │    declaration_data: {...},                        │
│     │    original_ocr_data: {...},                       │
│     │    user_corrections: [...],                        │
│     │    extraction_confidence: 0.89,                    │
│     │    status: "submitted",                            │
│     │    submitted_at: NOW(),                            │
│     │    due_date: "2024-11-20",                         │
│     │    primary_document_id: document_id                │
│     │  )                                                 │
│     └─ Result: declaration_id                            │
│                                                            │
│     Step 5: Delete from Temp Storage (cleanup)             │
│     ├─ temp_storage_service.delete(temp_file_id)         │
│     ├─ Redis: DEL "temp:ocr:{session_id}:{temp_file_id}" │
│     └─ Session: DEL "session:{session_id}:ocr_result"    │
│                                                            │
│     - COMMIT TRANSACTION                                   │
│     - If any step fails: ROLLBACK + cleanup Firebase      │
│                                                            │
│     - Email notification: "Declaration submitted"          │
│     - Response: {                                          │
│         declaration_id: "uuid",                           │
│         document_id: "uuid",                              │
│         storage_url: firebase_storage_url,                │
│         status: "submitted",                              │
│         submitted_at: timestamp                           │
│       }                                                    │
└─────────────────────────────────────────────────────────────┘
```

**Key Point:** Fichier sauvegardé dans Firebase **SI ET SEULEMENT SI** déclaration soumise avec succès (transaction atomique).

---

## 📋 WORKFLOW B: PIÈCES JOINTES (Factures pour Contrôle)

### Principe: Traitement Séparé, Contrôle NON Bloquant

**Objectif:**
- Calculer montant total des factures (achats + ventes)
- Comparer avec montant déclaré
- Alerter si écart significatif (NON bloquant)

**3 Options de Soumission:**

```
┌─────────────────────────────────────────────────────────────┐
│ OPTION 1: PDFs Factures Individuels                        │
│ - Upload multiple: 10-50 factures PDF/image                │
│ - OCR individuel par facture                               │
│ - Extraction: NIF, date, montant HT, TVA, TTC              │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ OPTION 2: Fichier Condensé Excel                           │
│ - Template prédéfini (.xlsx)                               │
│ - Colonnes: Type, N° Facture, Date, Entreprise, NIF/RC,   │
│             Base HT, TVA (%), Montant TVA, Total TTC       │
│ - Parsing: openpyxl ou pandas                              │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ OPTION 3: Fichier Condensé PDF                             │
│ - Format tableau structuré (généré par compta)             │
│ - OCR + Template parsing                                   │
│ - Mêmes colonnes que Excel                                 │
└─────────────────────────────────────────────────────────────┘
```

---

### PHASE 1: UPLOAD PIÈCES JOINTES

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Frontend: Attachment Upload UI                          │
│    - Contextual upload (après déclaration soumise)         │
│    - User selects option:                                  │
│      [ ] Individual invoices (PDFs)                        │
│      [ ] Excel summary file (.xlsx)                        │
│      [ ] PDF summary file (structured table)               │
│    - Multiple file upload (drag & drop)                    │
│    - Preview: List of files to upload                      │
└─────────────────────────────────────────────────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. Frontend: Upload to Backend                             │
│    - Endpoint: POST /api/v1/attachments/upload             │
│    - Body: {                                                │
│        declaration_id: "uuid",                             │
│        attachment_type: "invoices" | "excel_summary" |     │
│                        "pdf_summary",                      │
│        files: [File1, File2, ...],                         │
│        metadata: {                                         │
│          tax_period: "2024-10",                           │
│          declared_amount: 225000  (from declaration)      │
│        }                                                   │
│      }                                                     │
└─────────────────────────────────────────────────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. Backend: Process Based on Type                          │
│    - Route to appropriate processor:                       │
│      • Individual invoices → invoice_processor.py         │
│      • Excel summary → excel_processor.py                 │
│      • PDF summary → pdf_summary_processor.py             │
└─────────────────────────────────────────────────────────────┘
```

---

### PHASE 2A: OPTION 1 - Individual Invoices Processing

```
┌─────────────────────────────────────────────────────────────┐
│ 4. Backend: Process Individual Invoices                    │
│    - Loop through each uploaded file                       │
│    - For each invoice:                                     │
│      Step 1: Save to temp storage (15min TTL)             │
│      Step 2: OCR extraction (Tesseract)                   │
│      Step 3: Extract structured data:                     │
│        • invoice_number: "FAC-2024-001"                   │
│        • invoice_date: "2024-10-15"                       │
│        • issuer_nif: "12345678A"                          │
│        • issuer_name: "Proveedor SA"                      │
│        • recipient_nif: "87654321B"                       │
│        • recipient_name: "Mi Empresa SL"                  │
│        • base_amount: 100000                              │
│        • vat_rate: 15.0                                   │
│        • vat_amount: 15000                                │
│        • total_amount: 115000                             │
│      Step 4: Classification (CRITICAL)                     │
│        - Rule 1: recipient_nif == company_nif → ACHAT    │
│          (95% confidence)                                 │
│        - Rule 2: issuer_nif == company_nif → VENTE       │
│          (95% confidence)                                 │
│        - Rule 3: Keywords analysis → Medium confidence    │
│          (requires user confirmation)                     │
│      Step 5: Store result:                                 │
│        • invoice_classification: "purchase" | "sale"      │
│        • confidence: 0.95                                 │
│        • needs_confirmation: false                        │
│    - Parallel processing (10 invoices at once)            │
└─────────────────────────────────────────────────────────────┘
```

**Classification Rules (invoice_classifier.py):**

```python
class InvoiceClassifier:
    def classify(self, invoice_data: dict, company_nif: str) -> Classification:
        """
        Classify invoice as PURCHASE or SALE

        Rules:
        1. Recipient NIF == Company NIF → PURCHASE (95% confidence)
        2. Issuer NIF == Company NIF → SALE (95% confidence)
        3. Keywords → Medium confidence (needs confirmation)
        """

        # Rule 1: NIF-based (primary, high confidence)
        if invoice_data['recipient_nif'] == company_nif:
            return Classification(
                type="purchase",
                confidence=0.95,
                rule="recipient_nif_match",
                needs_confirmation=False
            )

        if invoice_data['issuer_nif'] == company_nif:
            return Classification(
                type="sale",
                confidence=0.95,
                rule="issuer_nif_match",
                needs_confirmation=False
            )

        # Rule 2: Keywords analysis (fallback, medium confidence)
        keywords_purchase = ["compra", "proveedor", "pago a"]
        keywords_sale = ["venta", "cliente", "cobro de"]

        # ... keyword matching logic

        return Classification(
            type="purchase",  # or "sale"
            confidence=0.65,
            rule="keyword_analysis",
            needs_confirmation=True  # User must confirm
        )
```

---

### PHASE 2B: OPTION 2 - Excel Summary Processing

```
┌─────────────────────────────────────────────────────────────┐
│ 5. Backend: Process Excel Summary                          │
│    - Library: openpyxl or pandas                           │
│    - Expected template structure:                          │
│                                                            │
│      | Type   | N° Facture  | Date       | Entreprise     |│
│      |--------|-------------|------------|----------------|│
│      | ACHAT  | FAC-001     | 2024-10-01 | Proveedor SA   |│
│      | VENTE  | FAC-002     | 2024-10-05 | Cliente XYZ    |│
│      | ...    | ...         | ...        | ...            |│
│                                                            │
│      | NIF/RC     | Base HT   | TVA (%) | Montant TVA |...|│
│      |------------|-----------|---------|-------------|---|│
│      | 12345678A  | 100000    | 15.00   | 15000       |...|│
│      | 87654321B  | 200000    | 15.00   | 30000       |...|│
│                                                            │
│    - Processing:                                           │
│      Step 1: Validate headers (column names)              │
│      Step 2: Parse each row                               │
│      Step 3: Data validation:                             │
│        • Required fields present ✓                        │
│        • Type = "ACHAT" or "VENTE" ✓                     │
│        • Amounts are numeric ✓                           │
│        • Dates are valid ✓                               │
│        • NIF format valid ✓                              │
│      Step 4: Business validation:                         │
│        • montant_tva = base_ht * (tva_rate / 100) ✓     │
│        • total_ttc = base_ht + montant_tva ✓            │
│      Step 5: Aggregate results                            │
└─────────────────────────────────────────────────────────────┘
```

---

### PHASE 2C: OPTION 3 - PDF Summary Processing

```
┌─────────────────────────────────────────────────────────────┐
│ 6. Backend: Process PDF Summary                            │
│    - Expected format: Structured table (generated by ERP) │
│    - Processing:                                           │
│      Step 1: OCR extraction (Tesseract)                   │
│      Step 2: Table detection:                             │
│        • Identify table boundaries                        │
│        • Extract rows and columns                         │
│        • Use Document AI (Table Parser) if available      │
│      Step 3: Parse table data:                            │
│        • Same structure as Excel                          │
│        • Extract: Type, N° Facture, Date, NIF, Amounts    │
│      Step 4: Validation (same as Excel)                   │
│      Step 5: Aggregate results                            │
│    - Lower accuracy than Excel (OCR errors possible)      │
└─────────────────────────────────────────────────────────────┘
```

---

### PHASE 3: AGGREGATION & COHERENCE CONTROL

```
┌─────────────────────────────────────────────────────────────┐
│ 7. Backend: Aggregate Invoice Amounts                      │
│    - Group by type:                                        │
│      • total_achats = SUM(base_ht WHERE type="ACHAT")     │
│      • total_ventes = SUM(base_ht WHERE type="VENTE")     │
│      • total_tva_achats = SUM(montant_tva WHERE ACHAT)    │
│      • total_tva_ventes = SUM(montant_tva WHERE VENTE)    │
│    - Calculate totals:                                     │
│      • total_invoices_count: 42                           │
│      • total_invoices_amount: 4,250,000 XAF               │
│      • achats_count: 28                                   │
│      • ventes_count: 14                                   │
│    - Result: {                                             │
│        total_achats: 2800000,                             │
│        total_ventes: 1450000,                             │
│        total_tva_achats: 420000,                          │
│        total_tva_ventes: 217500,                          │
│        invoice_count: 42,                                 │
│        processing_confidence: 0.92                        │
│      }                                                     │
└─────────────────────────────────────────────────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────────┐
│ 8. Backend: Coherence Control (NON BLOQUANT)               │
│    - Load declaration amount:                              │
│      • declared_amount = 225000 (from tax_declarations)   │
│    - Load calculated amount:                               │
│      • calculated_amount = total_tva_ventes - total_tva_achats│
│      • calculated_amount = 217500 - 420000 = -202500      │
│      • (Négatif = crédit TVA, positif = TVA à payer)      │
│    - Calculate variance:                                   │
│      • variance = ABS(declared_amount - calculated_amount)│
│      • variance_pct = (variance / declared_amount) * 100  │
│      • variance = ABS(225000 - (-202500)) = 427500        │
│      • variance_pct = (427500 / 225000) * 100 = 190%      │
│    - Apply thresholds:                                     │
│      • < 3%: OK (auto-pass, green status)                 │
│      • 3-5%: Requires justification (yellow, upload doc)  │
│      • 5-10%: Agent review required (orange alert)        │
│      • > 10%: High variance (red alert, not blocking)     │
│    - Result: {                                             │
│        coherence_status: "high_variance",  (>10%)         │
│        variance_amount: 427500,                           │
│        variance_percentage: 190%,                         │
│        recommendation: "agent_review",                    │
│        is_blocking: false  (❌ NON BLOQUANT)              │
│      }                                                     │
└─────────────────────────────────────────────────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────────┐
│ 9. Backend: Save Attachments to Firebase (APRÈS agrégation)│
│    - FOR EACH validated invoice:                           │
│      • Upload to Firebase Storage                          │
│      • Path: application-attachments/{declarationId}/     │
│                invoices/{invoice_number}_{uuid}.pdf       │
│      • INSERT INTO documents (                             │
│          declaration_id,                                  │
│          document_type: "invoice",                        │
│          invoice_classification: "purchase" | "sale",     │
│          extracted_data: {...},                           │
│          storage_url: firebase_url                        │
│        )                                                   │
│    - Save aggregation result:                              │
│      • INSERT INTO declaration_attachments_summary (      │
│          declaration_id,                                  │
│          total_achats,                                    │
│          total_ventes,                                    │
│          total_tva_achats,                                │
│          total_tva_ventes,                                │
│          invoice_count,                                   │
│          coherence_status: "high_variance",               │
│          variance_amount: 427500,                         │
│          variance_percentage: 190%,                       │
│          requires_justification: true,                    │
│          agent_review_required: true                      │
│        )                                                   │
└─────────────────────────────────────────────────────────────┘
```

---

### PHASE 4: USER NOTIFICATION & AGENT WORKFLOW

```
┌─────────────────────────────────────────────────────────────┐
│ 10. Backend: Notify User (Based on Variance)               │
│     - Variance < 3%: "✅ Amounts match, all good"          │
│     - Variance 3-5%: "⚠️ Small difference, upload          │
│       justification (optional)"                            │
│     - Variance 5-10%: "⚠️ Significant difference, agent    │
│       will review"                                         │
│     - Variance > 10%: "🔴 High variance detected, agent    │
│       review required. Upload justification."              │
│     - IMPORTANT: Declaration NOT blocked, status stays     │
│       "submitted" and proceeds to agent review             │
└─────────────────────────────────────────────────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────────┐
│ 11. Agent Dashboard: Coherence Alert (NON bloquant)        │
│     - Agent views declaration in queue                     │
│     - Badge: "⚠️ High Variance (190%)"                     │
│     - Agent can:                                           │
│       a) Review declaration details                        │
│       b) Review uploaded invoices                          │
│       c) Check aggregation summary                         │
│       d) Request clarification from user                   │
│       e) Approve despite variance (with notes)             │
│       f) Reject with reason                                │
│     - Coherence control = Additional information for agent │
│       NOT a blocking validation                            │
└─────────────────────────────────────────────────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────────┐
│ 12. Agent: Request Retroactive Attachments (Edge Case)     │
│     - If user didn't upload invoices initially             │
│     - Agent suspects fraud or error                        │
│     - Agent clicks: "Request Attachments"                  │
│     - User notified: "Agent requested supporting invoices" │
│     - User uploads attachments (Workflow B triggered)      │
│     - Aggregation + coherence control runs                 │
│     - Agent reviews results                                │
└─────────────────────────────────────────────────────────────┘
```

---

## 🗄️ DATABASE SCHEMA

### Table: declaration_attachments_summary

```sql
CREATE TABLE declaration_attachments_summary (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  declaration_id UUID REFERENCES tax_declarations(id) UNIQUE,

  -- Aggregation results
  total_achats DECIMAL(15,2),
  total_ventes DECIMAL(15,2),
  total_tva_achats DECIMAL(15,2),
  total_tva_ventes DECIMAL(15,2),
  calculated_tva_net DECIMAL(15,2),  -- tva_ventes - tva_achats

  -- Invoice counts
  invoice_count INTEGER,
  achats_count INTEGER,
  ventes_count INTEGER,

  -- Coherence control
  declared_amount DECIMAL(15,2),  -- From tax_declarations
  variance_amount DECIMAL(15,2),
  variance_percentage DECIMAL(5,2),
  coherence_status VARCHAR(50),  -- "ok", "requires_justification", "agent_review", "high_variance"

  -- Processing metadata
  attachment_type VARCHAR(50),  -- "individual_invoices", "excel_summary", "pdf_summary"
  processing_confidence DECIMAL(5,2),
  processing_errors TEXT[],

  -- Review flags
  requires_justification BOOLEAN DEFAULT false,
  agent_review_required BOOLEAN DEFAULT false,
  justification_uploaded BOOLEAN DEFAULT false,

  -- Timestamps
  processed_at TIMESTAMP DEFAULT NOW(),
  reviewed_at TIMESTAMP,
  reviewed_by_agent_id UUID REFERENCES users(id)
);

CREATE INDEX idx_attachments_summary_declaration ON declaration_attachments_summary(declaration_id);
CREATE INDEX idx_attachments_summary_status ON declaration_attachments_summary(coherence_status);
CREATE INDEX idx_attachments_summary_review ON declaration_attachments_summary(agent_review_required);
```

### Table: extracted_invoices

```sql
CREATE TABLE extracted_invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  declaration_id UUID REFERENCES tax_declarations(id),
  document_id UUID REFERENCES documents(id),

  -- Invoice data
  invoice_number VARCHAR(100),
  invoice_date DATE,
  issuer_name VARCHAR(255),
  issuer_nif VARCHAR(20),
  recipient_name VARCHAR(255),
  recipient_nif VARCHAR(20),

  -- Amounts
  base_amount DECIMAL(15,2),
  vat_rate DECIMAL(5,2),
  vat_amount DECIMAL(15,2),
  total_amount DECIMAL(15,2),

  -- Classification
  invoice_classification VARCHAR(50),  -- "purchase", "sale"
  classification_confidence DECIMAL(5,2),
  classification_rule VARCHAR(100),  -- "recipient_nif_match", "issuer_nif_match", "keyword_analysis"
  needs_confirmation BOOLEAN DEFAULT false,
  user_confirmed BOOLEAN DEFAULT false,

  -- Extraction metadata
  extraction_confidence DECIMAL(5,2),
  extraction_warnings TEXT[],

  -- Timestamps
  extracted_at TIMESTAMP DEFAULT NOW(),
  confirmed_at TIMESTAMP
);

CREATE INDEX idx_invoices_declaration ON extracted_invoices(declaration_id);
CREATE INDEX idx_invoices_classification ON extracted_invoices(invoice_classification);
CREATE INDEX idx_invoices_needs_confirmation ON extracted_invoices(needs_confirmation);
```

---

## 🔧 SERVICES & API ENDPOINTS

### Service: temp_storage_service.py

```python
class TempStorageService:
    """
    Manage temporary file storage (Redis or Disk)
    TTL: 15 minutes
    """

    async def save(
        self,
        file_bytes: bytes,
        session_id: str,
        metadata: dict
    ) -> TempFileResult:
        """
        Save file to temp storage
        Returns: temp_file_id, expires_at
        """

    async def load(
        self,
        temp_file_id: str,
        session_id: str
    ) -> bytes:
        """
        Load file from temp storage
        Raises: FileExpiredError if TTL exceeded
        """

    async def delete(
        self,
        temp_file_id: str,
        session_id: str
    ) -> bool:
        """
        Delete file from temp storage (cleanup)
        """
```

### Service: invoice_processor.py

```python
class InvoiceProcessor:
    """
    Process invoices (individual PDFs or summary files)
    """

    async def process_individual_invoices(
        self,
        files: List[UploadFile],
        declaration_id: str,
        company_nif: str
    ) -> ProcessingResult:
        """
        Process individual invoice PDFs
        Steps: OCR → Extract → Classify → Aggregate
        """

    async def process_excel_summary(
        self,
        file: UploadFile,
        declaration_id: str
    ) -> ProcessingResult:
        """
        Process Excel summary file
        Steps: Parse → Validate → Aggregate
        """

    async def process_pdf_summary(
        self,
        file: UploadFile,
        declaration_id: str
    ) -> ProcessingResult:
        """
        Process PDF summary file
        Steps: OCR → Table Extract → Parse → Aggregate
        """
```

### Service: coherence_control_service.py

```python
class CoherenceControlService:
    """
    Calculate variance between declared and calculated amounts
    NON-BLOCKING validation
    """

    def calculate_variance(
        self,
        declared_amount: Decimal,
        calculated_amount: Decimal
    ) -> VarianceResult:
        """
        Calculate variance and apply thresholds
        Returns: variance_amount, variance_pct, status, is_blocking (always False)
        """

    def get_threshold_status(
        self,
        variance_pct: Decimal
    ) -> str:
        """
        < 3%: "ok"
        3-5%: "requires_justification"
        5-10%: "agent_review"
        > 10%: "high_variance"
        """
```

---

### API Endpoints: Workflow A (Déclaration)

```
POST /api/v1/ocr/upload-temp
  - Upload file to temp storage (NOT Firebase yet)
  - Response: temp_file_id, session_id, expires_at

POST /api/v1/ocr/process
  - Process OCR from temp storage
  - Response: extracted_data, field_confidences

POST /api/v1/declarations/submit
  - Submit declaration (atomic: save to DB + upload to Firebase + delete temp)
  - Response: declaration_id, document_id, firebase_url
```

### API Endpoints: Workflow B (Pièces Jointes)

```
POST /api/v1/attachments/upload
  - Upload invoices (individual PDFs, Excel, or PDF summary)
  - Body: {declaration_id, attachment_type, files[]}
  - Response: processing_job_id (async processing)

GET /api/v1/attachments/{declaration_id}/status
  - Get processing status (pending, processing, completed, failed)
  - Response: {status, progress_pct, invoices_processed}

GET /api/v1/attachments/{declaration_id}/summary
  - Get aggregation summary and coherence control result
  - Response: {
      total_achats, total_ventes,
      variance_amount, variance_pct,
      coherence_status, is_blocking (false)
    }

POST /api/v1/attachments/{declaration_id}/confirm-classification
  - User confirms low-confidence classifications
  - Body: {invoice_id, confirmed_type: "purchase" | "sale"}
  - Response: {updated: true}
```

---

## 📊 VARIANCE THRESHOLDS & ACTIONS

| Variance | Status | User Action | Agent Action | Blocking? |
|----------|--------|-------------|--------------|-----------|
| < 3% | ✅ OK | None | None | ❌ NO |
| 3-5% | ⚠️ Justification Recommended | Upload justification (optional) | Review if suspicious | ❌ NO |
| 5-10% | 🟠 Agent Review | Upload justification (recommended) | Review required | ❌ NO |
| > 10% | 🔴 High Variance | Upload justification (strongly recommended) | Detailed review required | ❌ NO |

**Key Point:** Coherence control is **NEVER blocking**. Declaration proceeds to agent review regardless of variance.

---

## 🔐 ATTACHMENT REQUIREMENTS (Conditional)

### When Attachments Required?

**Rule-based logic:**

```python
def are_attachments_required(declaration: Declaration) -> bool:
    """
    Determine if attachments are required
    """

    # Rule 1: High-value declarations (>500K XAF)
    if declaration.amount > 500000:
        return True

    # Rule 2: First declaration for company
    if is_first_declaration(declaration.company_id):
        return True

    # Rule 3: Significant variance from historical average (>30%)
    avg_amount = get_historical_average(declaration.company_id, declaration.type)
    if abs(declaration.amount - avg_amount) / avg_amount > 0.30:
        return True

    # Rule 4: Manual flag by agent
    if declaration.agent_requested_attachments:
        return True

    # Otherwise: Optional
    return False
```

**UI Behavior:**
- Required: Upload form shown, "Skip" button disabled
- Optional: Upload form shown, "Skip" button enabled with confirmation

---

## 🎯 FICHIER CONDENSÉ TEMPLATE

### Excel Template Structure

```
Fichier: rapport_factures_template.xlsx

Sheet: "Factures"

| Type   | N° Facture | Date       | Entreprise      | NIF/RC     | Base HT    | TVA (%) | Montant TVA | Total TTC  |
|--------|------------|------------|-----------------|------------|------------|---------|-------------|------------|
| ACHAT  | FAC-001    | 01/10/2024 | Proveedor SA    | 12345678A  | 100,000.00 | 15.00   | 15,000.00   | 115,000.00 |
| VENTE  | FAC-002    | 05/10/2024 | Cliente XYZ     | 87654321B  | 200,000.00 | 15.00   | 30,000.00   | 230,000.00 |
| ACHAT  | FAC-003    | 10/10/2024 | Fournisseur Ltd | 11223344C  | 50,000.00  | 15.00   | 7,500.00    | 57,500.00  |
| ...    | ...        | ...        | ...             | ...        | ...        | ...     | ...         | ...        |

Totaux automatiques (dernière ligne):
| TOTAUX | -          | -          | -               | -          | 350,000.00 | -       | 52,500.00   | 402,500.00 |
```

**Validation Rules:**
- Type: Must be "ACHAT" or "VENTE" (case-insensitive)
- N° Facture: Required, max 50 chars
- Date: Valid date format (DD/MM/YYYY)
- NIF/RC: Valid NIF format (8 digits + letter) or RC (7 digits)
- Amounts: Numeric, >= 0
- Business rule: `Montant TVA = Base HT * (TVA % / 100)`
- Business rule: `Total TTC = Base HT + Montant TVA`

---

### PDF Template Structure

**Expected format:** Structured table (similar to Excel)

**Processing:**
1. OCR extraction (Tesseract)
2. Table detection (Document AI Table Parser or custom algorithm)
3. Extract rows and columns
4. Parse values
5. Same validation as Excel

**Limitations:**
- OCR errors possible (especially with handwritten amounts)
- Confidence lower than Excel (~85% vs 99%)
- Recommend Excel for >20 invoices

---

## ⚡ PERFORMANCE & COST

### Processing Times

| Task | Duration |
|------|----------|
| Upload to temp storage | 0.5-2s |
| OCR (1 page formulaire) | 1-2s |
| OCR (1 invoice) | 1-2s |
| Template extraction | 150ms |
| Excel parsing (50 invoices) | 200ms |
| PDF summary OCR + parsing | 3-5s |
| Individual invoices (10 PDFs) | 10-15s (parallel) |
| Firebase upload (atomic) | 1-3s |

### Storage Costs

**Temp Storage (Redis):**
- 10MB file × 15min TTL × 1000 users/day = ~150GB-hour/day
- Redis cost: ~$0.20/GB-hour = $30/day = $900/month
- **Recommendation:** Use Disk temp storage for cost savings

**Firebase Storage:**
- 10MB × 10 declarations/user/month × 1000 users = 100GB/month
- Storage: $0.026/GB/month = $2.60/month
- Download: Minimal (agent views, ~10GB/month) = $1.20/month
- **Total:** ~$4/month

---

## ✅ CHECKLIST IMPLEMENTATION

### Workflow A: Déclaration

- [ ] Implement temp_storage_service.py (Redis or Disk)
- [ ] Endpoint: POST /api/v1/ocr/upload-temp
- [ ] Endpoint: POST /api/v1/ocr/process
- [ ] Endpoint: POST /api/v1/declarations/submit (atomic transaction)
- [ ] Atomic transaction: Save declaration + Upload to Firebase + Delete temp
- [ ] Frontend: Upload UI with preview
- [ ] Frontend: OCR review screen (split view)
- [ ] Frontend: Field correction with confidence badges
- [ ] Test: Full flow Upload → OCR → Review → Submit → Firebase
- [ ] Monitor: Transaction rollback on failure

### Workflow B: Pièces Jointes

- [ ] Implement invoice_processor.py
- [ ] Implement invoice_classifier.py (NIF-based classification)
- [ ] Implement excel_processor.py (openpyxl/pandas)
- [ ] Implement pdf_summary_processor.py (OCR + table extraction)
- [ ] Implement coherence_control_service.py
- [ ] Create table: declaration_attachments_summary
- [ ] Create table: extracted_invoices
- [ ] Endpoint: POST /api/v1/attachments/upload
- [ ] Endpoint: GET /api/v1/attachments/{id}/status
- [ ] Endpoint: GET /api/v1/attachments/{id}/summary
- [ ] Frontend: Attachment upload UI (3 options)
- [ ] Frontend: Coherence alert display (NON bloquant)
- [ ] Frontend: Invoice classification confirmation UI
- [ ] Agent dashboard: Coherence badge/alert
- [ ] Test: Individual invoices flow (10 PDFs)
- [ ] Test: Excel summary flow
- [ ] Test: PDF summary flow
- [ ] Test: Variance thresholds (< 3%, 3-5%, 5-10%, > 10%)
- [ ] Test: NON-blocking behavior (declaration proceeds despite variance)

### General

- [ ] Create Excel template: rapport_factures_template.xlsx
- [ ] Documentation: User guide for attachments
- [ ] Documentation: Agent guide for coherence control
- [ ] Monitoring: Track OCR accuracy
- [ ] Monitoring: Track classification accuracy
- [ ] Cost monitoring: Temp storage usage
- [ ] Cost monitoring: Firebase storage usage

---

**Fichier créé:** 2025-12-03
**Auteur:** Claude Code
**Version:** 2.0 (Refactored)
