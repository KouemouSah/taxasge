# Session 4 — Extraction Documents + Création Batch Entreprises

## Objectif
Implémenter l'upload de documents d'entreprises (PDF, images) avec extraction LLM automatique, classification et création en batch. Permet de traiter 1000+ documents importés.

## Prérequis
- Classification agent unifié (fait)
- `extract_from_document()` existe dans classification_agent.py (dead code à câbler)
- Infrastructure OCR existante (Gemini 2.0 Flash)

## Architecture du flux
```
Admin upload N documents (PDF/images)
  → Queue de traitement async
  → Pour chaque document :
    1. Extraction LLM (extract_from_document) → company_data JSON
    2. Validation format (NIF, PE, forma_juridica)
    3. Classification 3-layers → regimen_fiscal
    4. Détection doublons (NIF/PE vs BD existante)
    5. Création draft (company_creation_drafts)
  → Admin review batch → approve/reject
  → Companies + licences créées
```

## Phases

### Phase 1 : Backend — Endpoint upload batch
- [ ] `POST /classification/upload-documents` — multipart/form-data
  - Accepte multiple fichiers (PDF, JPG, PNG)
  - Max 50 fichiers par batch, max 10MB par fichier
  - Crée un `batch_id` UUID
  - Pour chaque fichier : appelle `extract_from_document()` → `classify_company()` → `create_draft()`
  - Retourne : {batch_id, total, extracted, classified, errors[]}
- [ ] Câbler `extract_from_document()` (actuellement dead code) :
  - Appelle Gemini 2.0 Flash avec le document
  - Extrait : legal_name, nif, registration_number, forma_juridica, sector, objeto_social, localidad, provincia
  - Retourne ExtractionResult avec confidence + fields_extracted/missing
- [ ] Gérer les erreurs par document (pas de crash global si 1 doc échoue)

### Phase 2 : Backend — Processing queue async
- [ ] Pour les gros batches (>20 docs), utiliser un background task
- [ ] Endpoint `GET /classification/batch/{batch_id}/status` — progress tracking
- [ ] Stocker les fichiers uploadés dans Firebase Storage (temporaire)
- [ ] Cleanup des fichiers après traitement

### Phase 3 : Frontend — Interface upload professionnel
- [ ] Onglet "Importar" enrichi dans /admin/company-classification :
  - Zone drag & drop pour fichiers (avec preview thumbnails)
  - Barre de progression par fichier + globale
  - Tableau résultats en temps réel (extraction → classification → draft)
  - Badge statut par fichier (processing, success, error, duplicate)
  - Bouton "Approuver tout" / "Rejeter les erreurs"
- [ ] Support CSV conservé (onglet séparé)

### Phase 4 : Frontend — Review batch
- [ ] Tableau des drafts du batch filtrable
- [ ] Preview des données extraites vs document original (side-by-side)
- [ ] Correction manuelle des champs extraits avant approbation
- [ ] Bulk approve/reject

### Validation
- [ ] Tester avec 5 documents PDF réels (certificados actualizacion padron)
- [ ] Tester avec 20 documents batch
- [ ] Vérifier la détection de doublons
- [ ] Vérifier que les documents sont nettoyés après traitement
- [ ] Performance : extraction < 5s par document
