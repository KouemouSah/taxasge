# MODULE 03 - ANALYSE CRITIQUE DU WORKFLOW DOCUMENTS

**Date**: 2025-11-14
**Auteur**: Claude Code
**Version**: 1.0 - Analyse critique de l'écart entre code et DB réel

---

## 🎯 RÉSUMÉ EXÉCUTIF

### Statut Global: ⚠️ INCOMPLET - 40% Implémenté

| Composant | Statut | Commentaire |
|-----------|--------|-------------|
| Templates JSON | ✅ 100% | 7 templates pour 13 formulaires |
| Extracteurs | ✅ 100% | Zone-label extraction avec 3 stratégies |
| Mappers | ✅ 100% | 8 mappers pour pre-fill frontend |
| Tests E2E | ✅ 100% | Tests complets avec OCR samples |
| **DB Schema** | ⚠️ 60% | Colonnes manquantes pour extraction complète |
| **Repository** | ⚠️ 80% | Code bon mais incompatible avec DB actuelle |
| **OCR Service** | ❌ 0% | Google Cloud Vision non intégré |
| **DocumentService** | ❌ 0% | Orchestration workflow non implémentée |
| **API Endpoints** | ❌ 0% | Aucun endpoint créé |

**Conclusion**: Le "cerveau" (extraction logic) fonctionne mais le "corps" (API, DB, OCR) est manquant.

---

## 📊 ANALYSE DÉTAILLÉE DB vs CODE

### Table: `uploaded_files` (Schéma Actuel DB)

```sql
-- Colonnes EXISTANTES dans Supabase (extrait 2025-11-14):
CREATE TABLE uploaded_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    tax_declaration_id UUID REFERENCES tax_declarations(id),
    payment_id UUID REFERENCES payments(id),

    -- Métadonnées fichier (✅ OK)
    file_path TEXT NOT NULL UNIQUE,
    file_name TEXT NOT NULL,
    file_size_bytes BIGINT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    file_type attachment_type_enum NOT NULL,

    -- OCR basique (⚠️ INCOMPLET)
    requires_ocr BOOLEAN NOT NULL DEFAULT false,
    ocr_status VARCHAR(20) DEFAULT 'pending',

    -- Timestamps
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ❌ COLONNES MANQUANTES pour Module 03:
-- original_filename VARCHAR(255)
-- document_type VARCHAR(50)  -- Type de document (vs file_type enum)
-- document_subtype VARCHAR(50)
-- description TEXT
-- file_hash VARCHAR(64)  -- SHA-256 hash
-- file_url TEXT  -- Public URL
-- processing_mode VARCHAR(20)  -- server_processing, cloud_vision, lite_mode
-- ocr_text TEXT  -- ❌ CRITIQUE: Texte OCR extrait
-- ocr_confidence NUMERIC(3,2)  -- ❌ CRITIQUE: Score 0-1
-- ocr_provider VARCHAR(20)  -- tesseract, google_vision
-- extraction_status VARCHAR(20)  -- ❌ CRITIQUE: pending, completed, failed
-- extracted_data JSONB  -- ❌ CRITIQUE: Données structurées extraites
-- extraction_confidence NUMERIC(3,2)  -- Score extraction
-- form_mapping JSONB  -- ❌ CRITIQUE: Pre-fill frontend
-- processing_started_at TIMESTAMPTZ
-- processing_completed_at TIMESTAMPTZ
-- processing_duration_ms INTEGER
-- access_level VARCHAR(20)  -- private, shared, public
-- validation_status VARCHAR(20)
-- related_to_type VARCHAR(50)
-- related_to_id UUID
-- updated_at TIMESTAMPTZ
```

### Table: `ocr_extraction_results` (Existante)

```sql
-- Cette table EXISTE et est utilisée pour stocker les résultats OCR
CREATE TABLE ocr_extraction_results (
    id UUID PRIMARY KEY,
    uploaded_file_id UUID NOT NULL REFERENCES uploaded_files(id),
    ocr_engine ocr_engine_enum NOT NULL,  -- tesseract, google_vision, manual
    extracted_data JSONB NOT NULL,  -- ✅ Données OCR brutes
    confidence_score NUMERIC,  -- ✅ Score confiance
    processing_time_ms INTEGER,
    tesseract_version VARCHAR(20),
    language_used VARCHAR(10) DEFAULT 'spa+fra+eng',
    status VARCHAR(20) DEFAULT 'pending_validation',
    validated_by UUID REFERENCES users(id),
    validated_at TIMESTAMPTZ,
    validation_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Architecture DB Actuelle**:
- `uploaded_files`: Métadonnées fichier + statut OCR basique
- `ocr_extraction_results`: Résultats OCR détaillés (1-N relation)

**Architecture Code DocumentRepository attend**:
- TOUT dans `uploaded_files` (dénormalisé)
- Pas d'utilisation de `ocr_extraction_results`

---

## 🔴 ÉCARTS CRITIQUES IDENTIFIÉS

### 1. Schéma DB Incompatible avec DocumentRepository

**Problème**: Le `DocumentRepository` (packages/backend/app/repositories/document_repository.py) attend des colonnes qui n'existent PAS:

```python
# DocumentRepository._map_to_model() attend:
ocr_text = data.get("ocr_text")  # ❌ Colonne inexistante
ocr_confidence = data.get("ocr_confidence")  # ❌ Inexistant
extracted_data = data.get("extracted_data")  # ❌ Inexistant
extraction_status = data.get("extraction_status")  # ❌ Inexistant
form_mapping = data.get("form_mapping")  # ❌ CRITIQUE pour pre-fill
```

**Impact**:
- ❌ `document_repository.update_ocr_results()` va ÉCHOUER (colonnes inexistantes)
- ❌ `document_repository.update_extracted_data()` va ÉCHOUER
- ❌ Impossible de stocker les résultats d'extraction
- ❌ Impossible de faire le pre-fill frontend

**Solutions possibles**:

**Option A: Migration ALTER TABLE (RECOMMANDÉ)**
```sql
ALTER TABLE uploaded_files ADD COLUMN ocr_text TEXT;
ALTER TABLE uploaded_files ADD COLUMN ocr_confidence NUMERIC(3,2);
ALTER TABLE uploaded_files ADD COLUMN extracted_data JSONB;
ALTER TABLE uploaded_files ADD COLUMN extraction_status VARCHAR(20) DEFAULT 'pending';
ALTER TABLE uploaded_files ADD COLUMN form_mapping JSONB;
-- + 10 autres colonnes
```
✅ Avantages: Code fonctionne immédiatement, performant
❌ Inconvénients: Dénormalisation (redondance avec ocr_extraction_results)

**Option B: Adapter Repository pour utiliser ocr_extraction_results**
```python
# Jointure SQL uploaded_files + ocr_extraction_results
```
✅ Avantages: Architecture normalisée, pas de migration lourde
❌ Inconvénients: Réécriture complète du Repository, requêtes plus complexes

**Option C: Hybride (RECOMMANDÉ POUR PROD)**
- Garder `ocr_extraction_results` pour l'historique et l'audit
- Ajouter colonnes essentielles dans `uploaded_files` pour performance:
  - `ocr_text` (cache)
  - `extracted_data` (dernière version)
  - `form_mapping` (pre-fill)
  - `extraction_status`

---

### 2. Modèle Pydantic vs DB

**Document model (app/models/document.py):**
```python
class Document(BaseModel):
    # ✅ Mapping OK
    id: UUID
    user_id: UUID
    file_path: str
    file_size_bytes: int
    mime_type: str

    # ⚠️ Noms différents
    original_filename: str  # DB: file_name
    document_type: DocumentType  # DB: file_type (enum different)
    file_hash: str  # DB: n'existe pas (mais sha256_hash existe dans old schema?)

    # ❌ Inexistants en DB
    document_subtype: Optional[str]
    description: Optional[str]
    file_url: str
    processing_mode: DocumentProcessingMode
    ocr_text: Optional[str]
    ocr_confidence: Optional[float]
    ocr_provider: Optional[str]
    extraction_status: DocumentExtractionStatus
    extracted_data: Optional[Dict]
    extraction_confidence: Optional[float]
    form_mapping: Optional[Dict]  # ❌ CRITIQUE
    # ... + 8 autres champs
```

**Verdict**: 30% des champs du modèle n'existent PAS en DB.

---

### 3. Énumérations Incohérentes

**DB Enum `attachment_type_enum`:**
```sql
-- Valeurs probables (à vérifier):
'receipt', 'declaration_form', 'justificatif', 'identity_doc', ...
```

**Code Enum `DocumentType`:**
```python
class DocumentType(str, Enum):
    declaration_iva = "declaration_iva"
    declaration_irpf = "declaration_irpf"
    declaration_petroliferos = "declaration_petroliferos"
    fiscal_service = "fiscal_service"
    passport = "passport"
    national_id = "national_id"
    # ... 20 types au total
```

**Problème**: Les enums ne correspondent PAS. Le code attend des types granulaires (20 types) mais la DB utilise des catégories larges.

---

## ✅ CE QUI FONCTIONNE DÉJÀ

### 1. Templates + Extracteurs + Mappers

**Implémentation complète**:
- ✅ 7 templates JSON pour 13 formulaires fiscaux
- ✅ `TemplateLoader` avec cache
- ✅ `ZoneLabelExtractor` avec 3 stratégies (label detection, pattern, coordinates)
- ✅ 8 `FormMapper` pour conversion vers frontend
- ✅ Tests E2E avec samples OCR réalistes

**Localisation**:
```
packages/backend/app/core/documents/
├── templates/
│   ├── declarations/ (7 JSON templates)
│   └── fiscal_services/ (1 JSON template)
├── extractors/
│   ├── template_loader.py (342 lignes)
│   ├── zone_label_extractor.py (414 lignes)
│   └── declarations/
└── mappers/
    └── declaration_mapper.py (572 lignes, 8 mappers)
```

**Capacités**:
- Extraction robuste même avec mauvais scans (label detection)
- Confidence scoring par champ
- Validation rules (calculations, format, ranges)
- Mapping intelligent vers formulaires frontend

**Tests**:
- `packages/backend/tests/integration/test_document_extraction_e2e.py` (501 lignes)
- Couvre tous les 7 types de formulaires
- Samples OCR réalistes basés sur vrais formulaires Guinée Équatoriale

---

### 2. Modèles Pydantic

**Bien conçus**:
- ✅ `Document`, `DocumentCreate`, `DocumentUpdate`
- ✅ Énumérations pour statuts: `DocumentOCRStatus`, `DocumentExtractionStatus`, `DocumentValidationStatus`
- ✅ Modèles de requête: `OCRRequest`, `ExtractionRequest`
- ✅ Modèles de réponse: `DocumentResponse`, `DocumentListResponse`
- ✅ `DocumentProcessingStats` pour analytics

**Fichier**: `packages/backend/app/models/document.py`

---

### 3. Repository (Code)

**Bien implémenté**:
- ✅ `DocumentRepository` hérite de `BaseRepository`
- ✅ Méthodes spécialisées:
  - `create_document()`
  - `update_ocr_results()`
  - `update_extracted_data()`  # ❌ MAIS échouera (colonnes manquantes)
  - `update_ocr_failed()`
  - `update_extraction_failed()`
  - `find_pending_ocr()`
  - `find_pending_extraction()`
  - `search_documents()` avec filtres avancés
  - `get_processing_stats()` pour analytics

**Fichier**: `packages/backend/app/repositories/document_repository.py` (603 lignes)

**Problème**: Code excellent MAIS inutilisable sans migration DB.

---

## ❌ CE QUI MANQUE TOTALEMENT

### 1. OCR Service (0% implémenté)

**Besoin**:
```python
# packages/backend/app/services/ocr_service.py (À CRÉER)
class OCRService:
    async def extract_text(
        self,
        file_path: str,
        provider: str = "google_vision"
    ) -> OCRResult:
        """
        Extrait texte d'un document via Google Cloud Vision ou Tesseract

        Workflow:
        1. Télécharge fichier depuis Firebase Storage
        2. Appelle Google Cloud Vision API
        3. Si échec: Fallback vers Tesseract
        4. Retourne OCRResult avec:
           - text: str (texte extrait)
           - confidence: float (0-1)
           - provider: str (google_vision, tesseract)
           - processing_time_ms: int
        """
        pass
```

**Dépendances manquantes**:
- Google Cloud Vision API client
- Credentials Google Cloud
- Tesseract installation + pytesseract
- Firebase Storage download

---

### 2. Document Service (0% implémenté)

**Besoin**:
```python
# packages/backend/app/services/document_service.py (À CRÉER)
class DocumentService:
    def __init__(self):
        self.ocr_service = OCRService()
        self.document_repo = document_repository
        self.template_loader = template_loader
        self.zone_extractor = zone_label_extractor
        # Mappers dict

    async def process_document(
        self,
        document_id: UUID
    ) -> ProcessingResult:
        """
        Orchestre le workflow complet:

        1. Récupère document depuis DB
        2. Lance OCR (Google Vision ou Tesseract)
        3. Sauvegarde résultats OCR dans DB
        4. Détecte type de formulaire (classification)
        5. Charge template approprié
        6. Extrait données structurées via ZoneLabelExtractor
        7. Mappe vers formulaire frontend via Mapper
        8. Sauvegarde extracted_data + form_mapping dans DB
        9. Retourne résultat complet

        Gère erreurs à chaque étape avec retry logic
        """
        pass

    async def upload_and_process(
        self,
        user_id: UUID,
        file: UploadFile,
        document_type: DocumentType
    ) -> Document:
        """
        Upload + traitement complet en une seule opération

        1. Upload vers Firebase Storage
        2. Crée record dans uploaded_files
        3. Lance process_document() en async
        4. Retourne document immédiatement (status: processing)
        """
        pass
```

---

### 3. API Endpoints (0% implémenté)

**Besoin**:
```python
# packages/backend/app/api/v1/endpoints/documents.py (À CRÉER)

@router.post("/documents/upload", response_model=DocumentResponse)
async def upload_document(
    file: UploadFile,
    document_type: DocumentType,
    current_user: User = Depends(get_current_user)
) -> DocumentResponse:
    """Upload document avec OCR + extraction automatique"""
    pass

@router.get("/documents/{document_id}", response_model=DocumentResponse)
async def get_document(
    document_id: UUID,
    current_user: User = Depends(get_current_user)
) -> DocumentResponse:
    """Récupère document avec extracted_data et form_mapping"""
    pass

@router.post("/documents/{document_id}/extract", response_model=DocumentResponse)
async def trigger_extraction(
    document_id: UUID,
    force_reprocess: bool = False,
    current_user: User = Depends(get_current_user)
) -> DocumentResponse:
    """Lance extraction manuelle (re-process)"""
    pass

@router.get("/documents/{document_id}/form-mapping", response_model=Dict[str, Any])
async def get_form_mapping(
    document_id: UUID,
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """Récupère form_mapping pour pre-fill frontend"""
    pass

@router.get("/documents", response_model=DocumentListResponse)
async def list_documents(
    page: int = 1,
    size: int = 20,
    document_type: Optional[DocumentType] = None,
    ocr_status: Optional[str] = None,
    current_user: User = Depends(get_current_user)
) -> DocumentListResponse:
    """Liste documents avec filtres"""
    pass

# + 15 autres endpoints selon spec 05_DOCUMENTS.md
```

**Fichier à créer**: `packages/backend/app/api/v1/endpoints/documents.py`

---

## 📋 PLAN D'ACTION PRIORISÉ

### Phase 1: DB Migration (BLOQUANT) - 2h

**Tâche**: Créer migration pour ajouter colonnes manquantes

**Script**: `.github/docs-internal/database/migrations/003_add_document_extraction_columns.sql`

```sql
-- Migration 003: Add Document Extraction Columns
-- Date: 2025-11-14
-- Description: Ajoute colonnes pour OCR + extraction Module 03

BEGIN;

-- 1. Ajouter colonnes OCR
ALTER TABLE uploaded_files ADD COLUMN IF NOT EXISTS original_filename VARCHAR(255);
ALTER TABLE uploaded_files ADD COLUMN IF NOT EXISTS file_url TEXT;
ALTER TABLE uploaded_files ADD COLUMN IF NOT EXISTS file_hash VARCHAR(64);
ALTER TABLE uploaded_files ADD COLUMN IF NOT EXISTS document_type VARCHAR(50);
ALTER TABLE uploaded_files ADD COLUMN IF NOT EXISTS document_subtype VARCHAR(50);
ALTER TABLE uploaded_files ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE uploaded_files ADD COLUMN IF NOT EXISTS processing_mode VARCHAR(20) DEFAULT 'server_processing';

-- 2. Ajouter colonnes résultats OCR
ALTER TABLE uploaded_files ADD COLUMN IF NOT EXISTS ocr_text TEXT;
ALTER TABLE uploaded_files ADD COLUMN IF NOT EXISTS ocr_confidence NUMERIC(3,2);
ALTER TABLE uploaded_files ADD COLUMN IF NOT EXISTS ocr_provider VARCHAR(20);

-- 3. Ajouter colonnes extraction
ALTER TABLE uploaded_files ADD COLUMN IF NOT EXISTS extraction_status VARCHAR(20) DEFAULT 'pending';
ALTER TABLE uploaded_files ADD COLUMN IF NOT EXISTS extracted_data JSONB;
ALTER TABLE uploaded_files ADD COLUMN IF NOT EXISTS extraction_confidence NUMERIC(3,2);
ALTER TABLE uploaded_files ADD COLUMN IF NOT EXISTS form_mapping JSONB;

-- 4. Ajouter colonnes processing
ALTER TABLE uploaded_files ADD COLUMN IF NOT EXISTS processing_started_at TIMESTAMPTZ;
ALTER TABLE uploaded_files ADD COLUMN IF NOT EXISTS processing_completed_at TIMESTAMPTZ;
ALTER TABLE uploaded_files ADD COLUMN IF NOT EXISTS processing_duration_ms INTEGER;

-- 5. Ajouter colonnes metadata
ALTER TABLE uploaded_files ADD COLUMN IF NOT EXISTS access_level VARCHAR(20) DEFAULT 'private';
ALTER TABLE uploaded_files ADD COLUMN IF NOT EXISTS validation_status VARCHAR(20) DEFAULT 'pending';
ALTER TABLE uploaded_files ADD COLUMN IF NOT EXISTS related_to_type VARCHAR(50);
ALTER TABLE uploaded_files ADD COLUMN IF NOT EXISTS related_to_id UUID;
ALTER TABLE uploaded_files ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 6. Migrer données existantes
UPDATE uploaded_files SET original_filename = file_name WHERE original_filename IS NULL;
UPDATE uploaded_files SET document_type = file_type::text WHERE document_type IS NULL;

-- 7. Indexes pour performance
CREATE INDEX IF NOT EXISTS idx_uploaded_files_document_type ON uploaded_files(document_type);
CREATE INDEX IF NOT EXISTS idx_uploaded_files_extraction_status ON uploaded_files(extraction_status);
CREATE INDEX IF NOT EXISTS idx_uploaded_files_form_mapping ON uploaded_files USING gin(form_mapping) WHERE form_mapping IS NOT NULL;

COMMIT;
```

**Script Python**: `.github/docs-internal/database/apply_migration.py` (existe déjà)

```bash
cd .github/docs-internal/database
python apply_migration.py migrations/003_add_document_extraction_columns.sql
```

---

### Phase 2: OCR Service - 4h

**Fichier**: `packages/backend/app/services/ocr_service.py`

**Dépendances**:
```bash
pip install google-cloud-vision pillow pytesseract
```

**Configuration**:
- Ajouter `GOOGLE_CLOUD_VISION_CREDENTIALS` dans `.env`
- Installer Tesseract: `apt-get install tesseract-ocr tesseract-ocr-spa tesseract-ocr-fra`

---

### Phase 3: Document Service - 4h

**Fichier**: `packages/backend/app/services/document_service.py`

**Intégration**:
- Utilise `OCRService`
- Utilise `DocumentRepository`
- Utilise Templates + Extractors + Mappers existants

---

### Phase 4: API Endpoints - 4h

**Fichier**: `packages/backend/app/api/v1/endpoints/documents.py`

**Endpoints prioritaires**:
1. `POST /documents/upload` - Upload + process
2. `GET /documents/{id}` - Récupère document
3. `GET /documents/{id}/form-mapping` - Pre-fill frontend
4. `GET /documents` - Liste documents
5. `POST /documents/{id}/extract` - Re-process

---

### Phase 5: Tests d'intégration - 2h

**Fichier**: `packages/backend/tests/integration/test_document_upload_e2e.py`

**Tests**:
- Upload PDF → OCR → Extraction → Form mapping (workflow complet)
- Upload avec Google Vision
- Upload avec Tesseract fallback
- Erreur handling

---

## 📊 ESTIMATION TOTALE

| Phase | Effort | Priorité | Bloquant |
|-------|--------|----------|----------|
| DB Migration | 2h | P0 | ✅ OUI |
| OCR Service | 4h | P0 | ✅ OUI |
| Document Service | 4h | P0 | ✅ OUI |
| API Endpoints | 4h | P1 | Non |
| Tests intégration | 2h | P2 | Non |
| **TOTAL** | **16h** | | |

**Déjà fait** (Module 03 Phase 1): 16h (Templates + Extractors + Mappers + Tests)

**Total Module 03**: 32h (16h fait + 16h restant)

---

## 🎯 RECOMMANDATION

**Commencer IMMÉDIATEMENT par Phase 1 (DB Migration)**

Sans la migration, RIEN ne fonctionne. Le code est excellent mais inutilisable.

Une fois la migration faite, les phases 2-4 peuvent être implémentées en parallèle ou séquentiellement.

**Ordre recommandé**:
1. ✅ **Migration DB** (2h) - BLOQUANT
2. ✅ **OCR Service** (4h) - BLOQUANT
3. ✅ **Document Service** (4h) - BLOQUANT
4. API Endpoints (4h)
5. Tests intégration (2h)

---

## 📝 CONCLUSION

**État actuel**: Module 03 à 40% - Le "cerveau" (extraction) fonctionne parfaitement mais le "corps" (API/DB/OCR) manque.

**Risque**: Code inutilisable en production sans migration DB.

**Action immédiate**: Exécuter migration DB pour débloquer le reste du workflow.

**Estimation réaliste**: 2 jours de travail pour workflow complet fonctionnel.

