# DOCUMENTS MANAGEMENT - USE CASES (VERSION 2)

> **Module** : DOC
> **Endpoints** : 20
> **Statut** : ✅ 90% IMPLÉMENTÉ (Meilleur module backend)
> **Priorité** : HAUTE
> **Version** : 2.0 - AVEC MAPPING INTELLIGENT VERS FORMULAIRES

---

## 📋 TABLE DES MATIÈRES

- [UC-DOC-001](#uc-doc-001) - POST /documents/upload - Upload avec OCR + Mapping formulaire
- [UC-DOC-002](#uc-doc-002) - POST /documents/bulk-upload - Upload multiple documents
- [UC-DOC-003](#uc-doc-003) - GET /documents/{id} - Récupérer document avec métadonnées
- [UC-DOC-004](#uc-doc-004) - DELETE /documents/{id} - Supprimer document
- [UC-DOC-005](#uc-doc-005) - GET /documents/list - Lister mes documents
- [UC-DOC-006](#uc-doc-006) - POST /documents/search - Recherche avancée documents
- [UC-DOC-007](#uc-doc-007) - POST /documents/{id}/ocr - Déclencher OCR manuel
- [UC-DOC-008](#uc-doc-008) - GET /documents/{id}/form-mapping - Récupérer mapping pour pré-remplissage
- [UC-DOC-009](#uc-doc-009) - PATCH /documents/{id}/validate - Valider document
- [UC-DOC-010](#uc-doc-010) - POST /documents/{id}/annotate - Ajouter annotations
- [UC-DOC-011](#uc-doc-011) - GET /documents/{id}/annotations - Lister annotations
- [UC-DOC-012](#uc-doc-012) - GET /documents/{id}/versions - Historique versions
- [UC-DOC-013](#uc-doc-013) - POST /documents/{id}/verify - Vérifier authenticité
- [UC-DOC-014](#uc-doc-014) - GET /documents/stats - Statistiques documents
- [UC-DOC-015](#uc-doc-015) - GET /documents/types - Types documents supportés (20 modèles)
- [UC-DOC-016](#uc-doc-016) - POST /documents/{id}/share - Partager document
- [UC-DOC-017](#uc-doc-017) - GET /documents/shared - Documents partagés avec moi
- [UC-DOC-018](#uc-doc-018) - POST /documents/{id}/download - Télécharger document
- [UC-DOC-019](#uc-doc-019) - POST /documents/batch-validate - Validation batch
- [UC-DOC-020](#uc-doc-020) - GET /documents/pending-validation - Documents en attente

---

## 📊 VUE D'ENSEMBLE MODULE

### Contexte
Le module DOCUMENTS gère le cycle de vie complet des documents avec **OCR automatique** + **MAPPING INTELLIGENT vers formulaires spécifiques**. Le système identifie automatiquement le type de document, extrait les données, et **pré-remplit le formulaire correspondant** (frontend).

### Pipeline OCR + Mapping Complet
```
1. Upload Document Scanné
   ↓
2. Stockage Firebase + Metadata (uploaded_files)
   ↓
3. OCR (Tesseract + Google Vision fallback)
   ↓
4. Stockage Résultats OCR bruts (ocr_extraction_results)
   ↓
5. ✨ CLASSIFICATION INTELLIGENTE du type de document
   ↓
6. ✨ EXTRACTION avec Extractor spécialisé (20 modèles)
   ↓
7. ✨ MAPPING vers formulaire cible (7 tables SQL)
   ↓
8. Retour extracted_data + form_mapping au Frontend
   ↓
9. PRÉ-REMPLISSAGE AUTOMATIQUE du formulaire (Frontend)
   ↓
10. User valide/corrige le formulaire
   ↓
11. Sauvegarde finale dans table spécifique:
    - declaration_irpf_data
    - declaration_iva_data
    - declaration_petroliferos_data
    - fiscal_service_data
    - declaration_data_generic
```





┌─────────────────────────────────────────────────────────────┐
│ 1. USER UPLOAD DOCUMENT SCANNÉ                             │
│    (Déclaration IRPF PDF)                                   │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. BACKEND: Validation + Upload Firebase                   │
│    → INSERT uploaded_files table                            │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. OCR Processing (Tesseract + Google Vision)              │
│    → INSERT ocr_extraction_results table                    │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. ✨ CLASSIFICATION INTELLIGENTE                           │
│    "Ce document est une déclaration IRPF" (96% confiance)  │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. ✨ EXTRACTION avec IRPFExtractor                         │
│    revenus_salaires: 850000                                 │
│    deductions_charges_famille: 50000                        │
│    tipo_gravamen: 35                                        │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│ 6. ✨ MAPPING vers FormIRPF                                 │
│    target_form: "FormIRPF"                                  │
│    target_table: "declaration_irpf_data"                    │
│    pre_filled_fields: { revenus_salaires: 850000, ... }    │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│ 7. RETOUR API avec form_mapping                            │
│    Response JSON complet (voir UC-DOC-001)                  │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│ 8. FRONTEND: Charge FormIRPF.tsx                           │
│    Pré-remplit automatiquement tous les champs             │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│ 9. USER: Valide/Corrige le formulaire                      │
│    Champs avec confiance < 80% flaggés ⚠️                  │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│ 10. FRONTEND: POST /declarations/irpf                      │
│     Données validées par user                               │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│ 11. BACKEND: INSERT declaration_irpf_data table            │
│     ✅ Sauvegarde finale dans table SQL spécifique          │
└─────────────────────────────────────────────────────────────┘

### Acteurs
- **Citizen** : Upload documents personnels
- **Business** : Upload documents entreprise
- **Agent** : Valider documents
- **System** : OCR + Classification + Mapping automatique

---

## 🎯 20 MODÈLES DE DOCUMENTS SUPPORTÉS

### Groupe 1 : Déclarations Fiscales (3 modèles)

#### 1. DECLARATION_IRPF - Impôt Revenu Personnes Physiques
**Table cible** : `declaration_irpf_data`
**Champs extraits** :
- `revenus_salaires` (Revenus salaires)
- `revenus_activites_professionnelles` (Revenus activités professionnelles)
- `deductions_charges_famille` (Déductions charges famille)
- `deductions_cotisations_sociales` (Cotisations sociales)
- `tipo_gravamen` (Taux d'imposition)
- `total_revenus_bruts` (Total revenus bruts)
- `base_liquidable` (Base imposable)

#### 2. DECLARATION_IVA - Déclaration TVA
**Table cible** : `declaration_iva_data`
**Champs extraits** :
- `iva_dev_01_base` (Base IVA déductible 15%)
- `iva_dev_04_base` (Base IVA déductible 6%)
- `iva_dev_07_base` (Base IVA déductible 1.5%)
- `iva_ded_01_operaciones_interiores` (Opérations intérieures)
- `iva_ded_02_importaciones` (Importations)
- Calculs automatiques des cuotas

#### 3. DECLARATION_PETROLIFEROS - Produits Pétroliers
**Table cible** : `declaration_petroliferos_data`
**Sous-types** : 6 variantes
- `imp_prod_fmi` (Importation produits FMI)
- `imp_prod_ivs` (Importation produits IVS)
- `residentes_3` (Résidents 3%)
- `residentes_5` (Résidents 5%)
- `no_residentes_10` (Non-résidents 10%)
- `cuota_min_petrolera` (Quota minimum pétrole)

**Champs extraits** :
- `base_imponible`
- `tipo_gravamen`
- `cantidad_producto`
- `precio_unitario`

### Groupe 2 : Documents Identité (3 modèles)

#### 4. NATIONAL_ID - Carte Identité Nationale
**Champs extraits** :
- `full_name` (Nom complet)
- `national_id_number` (Numéro CNI)
- `date_of_birth` (Date naissance)
- `nationality` (Nationalité)
- `issue_date` (Date émission)
- `expiry_date` (Date expiration)

#### 5. PASSPORT - Passeport
**Champs extraits** :
- `passport_number`
- `full_name`
- `nationality`
- `date_of_birth`
- `issue_date`
- `expiry_date`
- `issuing_authority` (Autorité émettrice)

#### 6. RESIDENCE_PERMIT - Permis de Résidence
**Champs extraits** :
- `permit_number`
- `full_name`
- `nationality`
- `issue_date`
- `expiry_date`
- `permit_type`

### Groupe 3 : Documents Entreprise (4 modèles)

#### 7. BUSINESS_REGISTRATION - Registre Commerce (RC)
**Champs extraits** :
- `registration_number` (Numéro RC)
- `company_name` (Raison sociale)
- `legal_form` (Forme juridique: SA, SARL, etc.)
- `registration_date`
- `capital_social`
- `activity_sector`

#### 8. TAX_ID_CERTIFICATE - Certificat NIF
**Champs extraits** :
- `nif_number` (Numéro NIF)
- `company_name`
- `issue_date`
- `tax_regime`

#### 9. BUSINESS_LICENSE - Licence Commerciale
**Champs extraits** :
- `license_number`
- `company_name`
- `activity_type`
- `issue_date`
- `expiry_date`

#### 10. COMPANY_STATUTES - Statuts Société
**Champs extraits** :
- `company_name`
- `legal_form`
- `capital_social`
- `registered_office` (Siège social)
- `company_purpose` (Objet social)

### Groupe 4 : Documents Financiers (6 modèles)

#### 11. PAYSLIP - Fiche de Paie
**Champs extraits** :
- `employee_name`
- `employer_name`
- `period` (Période: 2025-10)
- `gross_salary` (Salaire brut)
- `net_salary` (Salaire net)
- `tax_withheld` (Impôt retenu)
- `social_contributions` (Cotisations sociales)

#### 12. BANK_STATEMENT - Relevé Bancaire
**Champs extraits** :
- `account_holder`
- `account_number` (Masqué: ****1234)
- `bank_name`
- `period_start`
- `period_end`
- `opening_balance`
- `closing_balance`
- `transactions_count`

#### 13. INVOICE - Facture
**Champs extraits** :
- `invoice_number`
- `issue_date`
- `due_date`
- `supplier_name`
- `customer_name`
- `total_amount`
- `tax_amount` (TVA)
- `currency`

#### 14. TAX_RETURN - Déclaration Fiscale Antérieure
**Champs extraits** :
- `fiscal_year`
- `taxpayer_name`
- `taxpayer_id` (NIF)
- `total_income`
- `taxable_income`
- `tax_due`

#### 15. BALANCE_SHEET - Bilan Comptable
**Champs extraits** :
- `company_name`
- `fiscal_year`
- `total_assets` (Actif total)
- `total_liabilities` (Passif total)
- `equity` (Capitaux propres)
- `revenue` (Chiffre d'affaires)

#### 16. PROFIT_LOSS_STATEMENT - Compte de Résultat
**Champs extraits** :
- `company_name`
- `fiscal_year`
- `revenue` (Produits)
- `expenses` (Charges)
- `operating_profit` (Résultat d'exploitation)
- `net_profit` (Résultat net)

### Groupe 5 : Documents Support (4 modèles)

#### 17. PROOF_OF_ADDRESS - Justificatif Domicile
**Champs extraits** :
- `full_name`
- `address`
- `document_type` (Facture eau/électricité/loyer)
- `issue_date`

#### 18. CONTRACT - Contrat (Bail, Travail, etc.)
**Champs extraits** :
- `contract_type`
- `parties` (Parties contractantes)
- `start_date`
- `end_date`
- `amount` (si applicable)

#### 19. CERTIFICATE - Certificat (Travail, Scolarité, etc.)
**Champs extraits** :
- `certificate_type`
- `beneficiary_name`
- `issuing_organization`
- `issue_date`

#### 20. OTHER - Autre Document
**Table cible** : `declaration_data_generic`
**Champs extraits** : Extraction générique JSON

---

## 🗃️ MAPPING VERS 7 TABLES SQL

| Type Document | Table SQL Cible | Formulaire Frontend |
|---------------|-----------------|---------------------|
| DECLARATION_IRPF | `declaration_irpf_data` | FormIRPF.tsx |
| DECLARATION_IVA | `declaration_iva_data` | FormIVA.tsx |
| DECLARATION_PETROLIFEROS | `declaration_petroliferos_data` | FormPetroliferos.tsx |
| 850 Services Fiscaux | `fiscal_service_data` | FormFiscalService.tsx |
| Autres déclarations | `declaration_data_generic` | FormGeneric.tsx |
| Résultats OCR bruts | `ocr_extraction_results` | (Intermédiaire) |
| Métadonnées upload | `uploaded_files` | (Référence) |

---

## 🎯 USE CASES

### UC-DOC-001 : Upload Document - Upload avec OCR + Mapping Intelligent

#### 1. Métadonnées
- **ID** : UC-DOC-001
- **Endpoint** : `POST /documents/upload`
- **Méthode** : POST (multipart/form-data)
- **Auth requise** : ✅ Oui
- **Priorité** : CRITIQUE
- **Statut implémentation** : ✅ IMPLÉMENTÉ (90%) - MAPPING À FINALISER
- **Acteurs** : Citizen, Business
- **Version** : 2.0 (avec mapping intelligent)

#### 2. Description Métier
**Contexte** : Un utilisateur upload un document scanné (déclaration IRPF, fiche de paie, CNI, etc.). Le système doit automatiquement:
1. Faire l'OCR
2. Identifier le type de document (classification intelligente)
3. Extraire les données avec l'extractor approprié
4. **Mapper vers le formulaire cible**
5. **Retourner les champs pré-remplis pour le frontend**

**Problème** : 
- Éviter la saisie manuelle fastidieuse
- Réduire les erreurs de saisie
- Pré-remplir automatiquement le bon formulaire (IRPF/IVA/etc.)

**Objectif** : 
- Upload → OCR → Classification → Extraction → **Mapping formulaire**
- Retourner `form_mapping` avec champs pré-remplis
- Frontend utilise ce mapping pour auto-fill le formulaire

**Workflow Complet** :
```
1. User upload document scanné
2. Validation (size, format, virus)
3. Upload Firebase Storage → URL
4. Insert metadata → uploaded_files table
5. Trigger OCR (Tesseract + Google Vision fallback)
6. Insert raw OCR → ocr_extraction_results table
7. ✨ CLASSIFICATION: Identifier type document (20 modèles)
8. ✨ EXTRACTION: Appliquer extractor spécialisé
9. ✨ MAPPING: Mapper vers formulaire cible + table SQL
10. Return:
    - document_id
    - ocr_confidence
    - extracted_data (raw)
    - form_mapping {
        target_form,
        target_table,
        pre_filled_fields,
        fields_confidence
      }
11. Frontend reçoit mapping → Pré-remplit formulaire automatiquement
12. User valide/corrige formulaire
13. Frontend POST vers endpoint spécifique → Sauvegarde table SQL cible
```

#### 3. Given/When/Then
```gherkin
Given un utilisateur authentifié
  And un document scanné de déclaration IRPF (PDF/Image)
  And le document contient les champs: revenus_salaires, deductions, etc.
When l'utilisateur upload le document avec document_type="declaration_irpf"
  And le système fait l'OCR (confidence > 90%)
  And le système classifie le document comme "DECLARATION_IRPF"
  And le système extrait les champs structurés
Then le système retourne:
  - document_id
  - ocr_status: "completed"
  - extracted_data (JSON brut OCR)
  - form_mapping {
      target_form: "FormIRPF",
      target_table: "declaration_irpf_data",
      pre_filled_fields: {
        revenus_salaires: 850000,
        deductions_charges_famille: 50000,
        tipo_gravamen: 35
      },
      fields_confidence: {
        revenus_salaires: 0.98,
        deductions_charges_famille: 0.85
      }
    }
  And le frontend charge automatiquement FormIRPF.tsx
  And le frontend pré-remplit les champs avec pre_filled_fields
  And l'utilisateur valide/corrige les valeurs
  And le frontend POST /declarations/irpf avec les données validées
  And les données sont sauvegardées dans declaration_irpf_data table
```

#### 4. Requête HTTP
```http
POST /api/v1/documents/upload HTTP/1.1
Host: api.taxasge.gq
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: multipart/form-data; boundary=----WebKitFormBoundary

------WebKitFormBoundary
Content-Disposition: form-data; name="file"; filename="declaration_irpf_2024.pdf"
Content-Type: application/pdf

[Binary PDF content]
------WebKitFormBoundary
Content-Disposition: form-data; name="document_type"

declaration_irpf
------WebKitFormBoundary
Content-Disposition: form-data; name="related_to_type"

tax_declaration
------WebKitFormBoundary
Content-Disposition: form-data; name="enable_form_mapping"

true
------WebKitFormBoundary
Content-Disposition: form-data; name="description"

Déclaration IRPF 2024 scannée
------WebKitFormBoundary--
```

#### 5. Réponse Succès - OCR Rapide avec Mapping
```json
{
  "success": true,
  "data": {
    "document_id": "DOC-2025-abc123xyz",
    "filename": "declaration_irpf_2024.pdf",
    "document_type": "declaration_irpf",
    "file_size": 3458632,
    "mime_type": "application/pdf",
    "storage_url": "https://firebasestorage.googleapis.com/.../DOC-2025-abc123xyz.pdf",
    "uploaded_at": "2025-10-31T14:30:00Z",
    
    "ocr_status": "completed",
    "ocr_confidence": 0.94,
    "ocr_engine": "tesseract",
    "processing_time_ms": 2450,
    
    "extracted_data": {
      "raw_text": "DECLARACIÓN IRPF 2024\nNombre: Jean Dupont\nRENTA SALARIAL: 850.000 XAF\nDEDUCCIONES FAMILIA: 50.000 XAF\nTIPO GRAVAMEN: 35%\nTOTAL A INGRESAR: 280.000 XAF",
      "document_classification": {
        "identified_type": "declaration_irpf",
        "confidence": 0.96,
        "alternative_types": [
          {"type": "declaration_iva", "confidence": 0.15}
        ]
      },
      "structured_fields": {
        "nombre_contribuyente": "Jean Dupont",
        "renta_salarial": 850000,
        "deducciones_familia": 50000,
        "tipo_gravamen": 35,
        "total_ingresar": 280000
      }
    },
    
    "form_mapping": {
      "enabled": true,
      "target_form": "FormIRPF",
      "target_table": "declaration_irpf_data",
      "form_url": "/declarations/irpf/create?prefill=DOC-2025-abc123xyz",
      
      "pre_filled_fields": {
        "revenus_salaires": 850000,
        "deductions_charges_famille": 50000,
        "tipo_gravamen": 35,
        "total_revenus_bruts": 850000,
        "total_deductions": 50000,
        "base_liquidable": 800000,
        "calculated_amount": 280000
      },
      
      "fields_confidence": {
        "revenus_salaires": 0.98,
        "deductions_charges_famille": 0.85,
        "tipo_gravamen": 0.92,
        "calculated_amount": 0.90
      },
      
      "fields_metadata": {
        "revenus_salaires": {
          "ocr_source": "RENTA SALARIAL: 850.000 XAF",
          "page": 1,
          "bounding_box": {"x": 120, "y": 340, "width": 200, "height": 30},
          "needs_validation": false
        },
        "deductions_charges_famille": {
          "ocr_source": "DEDUCCIONES FAMILIA: 50.000 XAF",
          "page": 1,
          "bounding_box": {"x": 120, "y": 380, "width": 220, "height": 30},
          "needs_validation": true
        }
      },
      
      "unmapped_fields": [
        {
          "ocr_text": "NUMERO EXPEDIENTE: 2024-IRPF-001234",
          "reason": "Not mapped to any form field",
          "stored_in": "additional_data"
        }
      ],
      
      "mapping_quality": {
        "total_fields_extracted": 7,
        "successfully_mapped": 6,
        "high_confidence_fields": 5,
        "low_confidence_fields": 1,
        "unmapped_fields": 1,
        "overall_score": 0.92
      }
    },
    
    "validation_status": "pending",
    "related_to": {
      "type": "tax_declaration",
      "id": null
    },
    
    "next_actions": [
      {
        "action": "review_and_submit",
        "label": "Réviser et soumettre le formulaire IRPF",
        "url": "/declarations/irpf/create?prefill=DOC-2025-abc123xyz",
        "priority": "high"
      },
      {
        "action": "manual_entry",
        "label": "Saisie manuelle sans pré-remplissage",
        "url": "/declarations/irpf/create",
        "priority": "low"
      }
    ]
  },
  
  "message": "Document uploaded and OCR completed successfully. Form IRPF pre-filled with extracted data."
}
```

#### 6. Réponse Succès - Autre Type (Fiche de Paie)
```json
{
  "success": true,
  "data": {
    "document_id": "DOC-2025-def456uvw",
    "filename": "fiche_paie_octobre_2025.pdf",
    "document_type": "payslip",
    "ocr_status": "completed",
    "ocr_confidence": 0.96,
    
    "extracted_data": {
      "document_classification": {
        "identified_type": "payslip",
        "confidence": 0.98
      },
      "structured_fields": {
        "employee_name": "Jean Dupont",
        "employer_name": "TechCorp GQ",
        "period": "2025-10",
        "gross_salary": 850000,
        "net_salary": 680000,
        "tax_withheld": 85000,
        "social_contributions": 85000
      }
    },
    
    "form_mapping": {
      "enabled": true,
      "target_form": "FiscalServiceForm",
      "target_table": "fiscal_service_data",
      "form_url": "/fiscal-services/T-042/apply?prefill=DOC-2025-def456uvw",
      
      "pre_filled_fields": {
        "nom_demandeur": "Jean Dupont",
        "montant_chiffre": 850000,
        "periode": "2025-10",
        "concept_pago": "Justificatif revenus salariés"
      },
      
      "mapping_quality": {
        "overall_score": 0.96
      }
    }
  }
}
```

#### 7. Gestion Erreurs

| Code | Scénario | Message | Action |
|------|----------|---------|--------|
| 400 | File manquant | No file provided | Fournir fichier |
| 400 | Document type non supporté | Unsupported document_type (allowed: 20 types) | Utiliser type valide |
| 400 | File trop grand | File exceeds 20MB limit | Compresser |
| 401 | Non authentifié | Authorization required | Se connecter |
| 422 | OCR confidence trop basse | OCR confidence < 50%, cannot map to form | Upload meilleure qualité |
| 422 | Classification failed | Could not identify document type | Spécifier document_type manuellement |
| 500 | Erreur mapping | Form mapping failed | Saisie manuelle disponible |
| 503 | OCR indisponible | OCR service unavailable | Réessayer |

#### 8. Métriques Techniques

**Latence** :
- P50 : < 3s (upload + OCR + mapping)
- P95 : < 8s
- P99 : < 15s (PDF complexe)

**Throughput** : ~500-1,000 uploads/jour

**Taux succès OCR** : > 95%

**Taux succès mapping** : > 90% (documents qualité standard)

**Storage** : ~50GB/mois

#### 9. KPIs Métier

**Taux pré-remplissage réussi** :
```
Formule : (Documents avec mapping réussi / Total uploads) × 100
Cible : > 85%
```

**Temps économisé utilisateur** :
```
Estimation : 10-15 minutes par document (vs saisie manuelle)
Économie mensuelle : ~5,000-7,500 heures
```

**Taux validation sans correction** :
```
Formule : (Formulaires validés sans modif / Total pré-remplis) × 100
Cible : > 70%
```

#### 10. Instrumentation

```python
from prometheus_client import Counter, Histogram, Gauge

document_uploads_with_mapping = Counter(
    'document_uploads_with_mapping_total',
    'Documents uploaded with form mapping enabled',
    ['document_type', 'mapping_success']
)

form_mapping_duration = Histogram(
    'form_mapping_duration_seconds',
    'Form mapping processing duration',
    ['document_type']
)

form_mapping_quality_score = Histogram(
    'form_mapping_quality_score',
    'Form mapping quality scores',
    ['document_type'],
    buckets=[0.5, 0.6, 0.7, 0.8, 0.9, 0.95, 1.0]
)

document_classification_accuracy = Counter(
    'document_classification_accuracy_total',
    'Document classification accuracy',
    ['identified_type', 'actual_type', 'correct']
)

pre_filled_fields_count = Histogram(
    'pre_filled_fields_count',
    'Number of fields successfully pre-filled',
    ['document_type']
)

unmapped_fields_count = Histogram(
    'unmapped_fields_count',
    'Number of fields that could not be mapped',
    ['document_type']
)
```

#### 11. Sécurité

**Validation Document Type** :
- Whitelist stricte : 20 types supportés
- Rejet si type inconnu (sauf "other")

**Confiance Mapping** :
- Si overall_score < 0.70 → Flag "needs_manual_review"
- Si fields_confidence < 0.60 → Flag champ individuel

**RBAC** : User upload documents pour ses propres déclarations

#### 12. Workflow Code

```python
from typing import Dict, Optional
import pytesseract
from PIL import Image
import io

# Configuration des 20 extractors
DOCUMENT_EXTRACTORS = {
    "declaration_irpf": IRPFExtractor(),
    "declaration_iva": IVAExtractor(),
    "declaration_petroliferos": PetroliferosExtractor(),
    "payslip": PayslipExtractor(),
    "bank_statement": BankStatementExtractor(),
    "invoice": InvoiceExtractor(),
    "national_id": NationalIDExtractor(),
    "passport": PassportExtractor(),
    "business_registration": BusinessRegistrationExtractor(),
    "tax_id_certificate": TaxIDExtractor(),
    # ... 10 autres extractors
}

# Configuration mapping vers tables SQL
FORM_MAPPINGS = {
    "declaration_irpf": {
        "target_form": "FormIRPF",
        "target_table": "declaration_irpf_data",
        "field_mappings": {
            "revenus_salaires": {"ocr_keywords": ["renta salarial", "salaire", "revenu travail"]},
            "deductions_charges_famille": {"ocr_keywords": ["deducciones familia", "charges famille"]},
            "tipo_gravamen": {"ocr_keywords": ["tipo gravamen", "taux imposition"]},
        }
    },
    "declaration_iva": {
        "target_form": "FormIVA",
        "target_table": "declaration_iva_data",
        "field_mappings": {
            "iva_dev_01_base": {"ocr_keywords": ["base imponible", "base iva 15"]},
            "iva_dev_02_tipo": {"ocr_keywords": ["tipo 15%", "rate 15"]},
        }
    },
    "payslip": {
        "target_form": "FiscalServiceForm",
        "target_table": "fiscal_service_data",
        "field_mappings": {
            "nom_demandeur": {"ocr_keywords": ["nombre empleado", "nom salarié"]},
            "montant_chiffre": {"ocr_keywords": ["salario bruto", "salaire brut"]},
        }
    }
    # ... 17 autres mappings
}

async def upload_document_with_mapping(
    file: UploadFile,
    document_type: str,
    enable_form_mapping: bool = True,
    current_user: User = Depends(get_current_user)
):
    """
    UC-DOC-001 : Upload document avec OCR + Mapping intelligent
    """
    start_time = datetime.utcnow()
    
    # 1. Validation & Upload (comme avant)
    file_content = await file.read()
    document_id = f"DOC-{datetime.utcnow().strftime('%Y-%m-%d')}-{secrets.token_urlsafe(8)}"
    
    # Upload Firebase
    storage_url = await upload_to_firebase(document_id, file_content, file.content_type)
    
    # 2. Insert metadata → uploaded_files table
    uploaded_file = await db.uploaded_files.insert_one({
        "id": document_id,
        "user_id": current_user.user_id,
        "file_path": storage_url,
        "file_name": file.filename,
        "file_size_bytes": len(file_content),
        "mime_type": file.content_type,
        "file_type": document_type,
        "requires_ocr": True,
        "ocr_status": "pending",
        "uploaded_at": datetime.utcnow()
    })
    
    # 3. OCR Processing
    ocr_result = await process_ocr_with_fallback(file_content, document_type)
    
    # 4. Insert OCR results → ocr_extraction_results table
    ocr_extraction_id = await db.ocr_extraction_results.insert_one({
        "id": str(uuid.uuid4()),
        "uploaded_file_id": document_id,
        "ocr_engine": ocr_result["engine"],
        "extracted_data": ocr_result["raw_data"],
        "confidence_score": ocr_result["confidence"],
        "processing_time_ms": ocr_result["processing_time_ms"],
        "status": "pending_validation",
        "created_at": datetime.utcnow()
    })
    
    # 5. ✨ CLASSIFICATION INTELLIGENTE
    classified_type = await classify_document(
        ocr_text=ocr_result["raw_text"],
        declared_type=document_type,
        file_content=file_content
    )
    
    # 6. ✨ EXTRACTION avec Extractor spécialisé
    extractor = DOCUMENT_EXTRACTORS.get(classified_type["identified_type"])
    if extractor:
        extracted_fields = await extractor.extract(ocr_result["raw_text"])
    else:
        extracted_fields = {}
    
    # 7. ✨ MAPPING vers formulaire cible
    form_mapping = None
    if enable_form_mapping and classified_type["identified_type"] in FORM_MAPPINGS:
        form_mapping = await map_to_form(
            document_type=classified_type["identified_type"],
            extracted_fields=extracted_fields,
            ocr_confidence=ocr_result["confidence"]
        )
    
    # 8. Update uploaded_files status
    await db.uploaded_files.update_one(
        {"id": document_id},
        {"$set": {"ocr_status": "completed"}}
    )
    
    # 9. Metrics
    document_uploads_with_mapping.labels(
        document_type=classified_type["identified_type"],
        mapping_success=str(form_mapping is not None)
    ).inc()
    
    if form_mapping:
        form_mapping_quality_score.labels(
            document_type=classified_type["identified_type"]
        ).observe(form_mapping["mapping_quality"]["overall_score"])
    
    # 10. Return response
    return {
        "success": True,
        "data": {
            "document_id": document_id,
            "filename": file.filename,
            "document_type": classified_type["identified_type"],
            "storage_url": storage_url,
            "ocr_status": "completed",
            "ocr_confidence": ocr_result["confidence"],
            "extracted_data": {
                "raw_text": ocr_result["raw_text"],
                "document_classification": classified_type,
                "structured_fields": extracted_fields
            },
            "form_mapping": form_mapping,
            "next_actions": generate_next_actions(document_id, form_mapping)
        }
    }

async def classify_document(
    ocr_text: str,
    declared_type: str,
    file_content: bytes
) -> Dict:
    """
    Classification intelligente du type de document
    
    Méthodes:
    1. Keyword matching (mots-clés spécifiques par type)
    2. Pattern recognition (numéros NIF, RC, etc.)
    3. Layout analysis (structure du document)
    4. ML model (optionnel - TensorFlow Lite)
    """
    # Keywords par type de document
    KEYWORDS = {
        "declaration_irpf": ["declaración irpf", "impuesto renta", "revenus personnes physiques"],
        "declaration_iva": ["declaración iva", "tva", "impuesto valor añadido"],
        "payslip": ["nómina", "fiche de paie", "salario bruto"],
        "national_id": ["documento nacional", "carte identité", "DNI", "CNI"],
        # ... 16 autres
    }
    
    # Score par type
    scores = {}
    for doc_type, keywords in KEYWORDS.items():
        score = sum(1 for kw in keywords if kw.lower() in ocr_text.lower())
        scores[doc_type] = score / len(keywords)
    
    # Type avec meilleur score
    identified_type = max(scores, key=scores.get) if scores else declared_type
    confidence = scores.get(identified_type, 0.5)
    
    # Alternatives
    alternatives = sorted(
        [{"type": t, "confidence": s} for t, s in scores.items() if t != identified_type],
        key=lambda x: x["confidence"],
        reverse=True
    )[:3]
    
    return {
        "identified_type": identified_type,
        "confidence": confidence,
        "alternative_types": alternatives
    }

async def map_to_form(
    document_type: str,
    extracted_fields: Dict,
    ocr_confidence: float
) -> Dict:
    """
    Mapper les champs extraits vers le formulaire cible
    """
    mapping_config = FORM_MAPPINGS[document_type]
    
    pre_filled_fields = {}
    fields_confidence = {}
    fields_metadata = {}
    unmapped_fields = []
    
    # Pour chaque champ du formulaire
    for form_field, config in mapping_config["field_mappings"].items():
        # Chercher correspondance dans extracted_fields
        found = False
        for extracted_key, extracted_value in extracted_fields.items():
            # Match par nom de champ ou keywords
            if (extracted_key == form_field or 
                any(kw in extracted_key.lower() for kw in config.get("ocr_keywords", []))):
                
                pre_filled_fields[form_field] = extracted_value
                fields_confidence[form_field] = ocr_confidence * 0.95  # Légère pénalité
                fields_metadata[form_field] = {
                    "ocr_source": f"{extracted_key}: {extracted_value}",
                    "needs_validation": ocr_confidence < 0.85
                }
                found = True
                break
        
        if not found:
            unmapped_fields.append({
                "form_field": form_field,
                "reason": "No matching extracted field"
            })
    
    # Calcul qualité mapping
    total_fields = len(mapping_config["field_mappings"])
    mapped_fields = len(pre_filled_fields)
    high_confidence = sum(1 for c in fields_confidence.values() if c > 0.90)
    
    overall_score = (mapped_fields / total_fields) * ocr_confidence if total_fields > 0 else 0
    
    return {
        "enabled": True,
        "target_form": mapping_config["target_form"],
        "target_table": mapping_config["target_table"],
        "pre_filled_fields": pre_filled_fields,
        "fields_confidence": fields_confidence,
        "fields_metadata": fields_metadata,
        "unmapped_fields": unmapped_fields,
        "mapping_quality": {
            "total_fields_expected": total_fields,
            "successfully_mapped": mapped_fields,
            "high_confidence_fields": high_confidence,
            "overall_score": overall_score
        }
    }

def generate_next_actions(document_id: str, form_mapping: Optional[Dict]) -> list:
    """Générer actions suggérées pour l'utilisateur"""
    actions = []
    
    if form_mapping:
        target_form = form_mapping["target_form"]
        actions.append({
            "action": "review_and_submit",
            "label": f"Réviser et soumettre le formulaire {target_form}",
            "url": f"/declarations/create?form={target_form}&prefill={document_id}",
            "priority": "high"
        })
    
    actions.append({
        "action": "manual_entry",
        "label": "Saisie manuelle sans pré-remplissage",
        "url": "/declarations/create",
        "priority": "low"
    })
    
    return actions
```

---

### UC-DOC-008 : Get Form Mapping - Récupérer mapping pour pré-remplissage

#### 1. Métadonnées
- **ID** : UC-DOC-008
- **Endpoint** : `GET /documents/{id}/form-mapping`
- **Méthode** : GET
- **Auth requise** : ✅ Oui
- **Priorité** : HAUTE
- **Statut implémentation** : ❌ NON IMPLÉMENTÉ
- **Acteurs** : Frontend, Citizen, Business

#### 2. Description Métier
**Contexte** : Le frontend a besoin de récupérer le mapping d'un document déjà uploadé pour pré-remplir un formulaire.

**Objectif** : Endpoint dédié pour récupérer uniquement le form_mapping sans recharger tout le document.

#### 3. Given/When/Then
```gherkin
Given un document déjà uploadé avec OCR complété
  And le document a un form_mapping disponible
When le frontend demande GET /documents/{id}/form-mapping
Then le système retourne le form_mapping complet
  And le frontend peut pré-remplir le formulaire correspondant
```

#### 4. Requête HTTP
```http
GET /api/v1/documents/DOC-2025-abc123xyz/form-mapping HTTP/1.1
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### 5. Réponse Succès
```json
{
  "success": true,
  "data": {
    "document_id": "DOC-2025-abc123xyz",
    "document_type": "declaration_irpf",
    "ocr_completed_at": "2025-10-31T14:30:05Z",
    
    "form_mapping": {
      "target_form": "FormIRPF",
      "target_table": "declaration_irpf_data",
      "form_url": "/declarations/irpf/create?prefill=DOC-2025-abc123xyz",
      
      "pre_filled_fields": {
        "revenus_salaires": 850000,
        "deductions_charges_famille": 50000,
        "tipo_gravamen": 35,
        "base_liquidable": 800000,
        "calculated_amount": 280000
      },
      
      "fields_confidence": {
        "revenus_salaires": 0.98,
        "deductions_charges_famille": 0.85,
        "tipo_gravamen": 0.92
      },
      
      "mapping_quality": {
        "overall_score": 0.92,
        "successfully_mapped": 6,
        "total_fields_expected": 7
      }
    }
  }
}
```

#### 6. Gestion Erreurs

| Code | Scénario | Message | Action |
|------|----------|---------|--------|
| 404 | Document non trouvé | Document not found | Vérifier ID |
| 400 | OCR pas complété | OCR not yet completed | Attendre completion |
| 400 | Pas de mapping | No form mapping available for this document | Saisie manuelle |

---

### UC-DOC-002 à UC-DOC-020 : Use Cases Complémentaires

*[Autres use cases restent identiques à la version 1, avec ajout du support des 20 modèles]*

---

## 📈 MÉTRIQUES MODULE DOCUMENTS (Mise à jour)

### Dashboard Grafana Queries

```promql
# Taux succès mapping
rate(document_uploads_with_mapping_total{mapping_success="true"}[5m]) / 
rate(document_uploads_with_mapping_total[5m])

# Score qualité mapping moyen
avg(form_mapping_quality_score)

# Distribution types documents uploadés
sum(document_uploads_with_mapping_total) by (document_type)

# Champs pré-remplis moyen par document
avg(pre_filled_fields_count)

# Temps économisé estimé (10min par document avec mapping réussi)
sum(rate(document_uploads_with_mapping_total{mapping_success="true"}[1h])) * 600
```

### Alertes Critiques

| Alerte | Condition | Action |
|--------|-----------|--------|
| Low mapping success rate | < 80% | Check extractors |
| Classification accuracy drop | < 85% | Retrain ML model |
| High unmapped fields | avg > 3 | Improve field mappings |

---

## 🧪 TESTS RECOMMANDÉS

### Tests Unitaires

```python
class TestUC_DOC_001_Mapping:
    def test_upload_irpf_with_mapping(self):
        """Test : upload déclaration IRPF → mapping réussi"""
        pass
    
    def test_classification_accuracy(self):
        """Test : classification correcte 20 types documents"""
        pass
    
    def test_mapping_quality_score(self):
        """Test : calcul score qualité mapping"""
        pass
    
    def test_pre_fill_fields_extraction(self):
        """Test : extraction champs IRPF spécifiques"""
        pass

class TestExtractors:
    def test_irpf_extractor(self):
        """Test : IRPFExtractor extrait tous champs"""
        pass
    
    def test_iva_extractor(self):
        """Test : IVAExtractor calcule cuotas"""
        pass
    
    def test_payslip_extractor(self):
        """Test : PayslipExtractor extrait salaire brut/net"""
        pass
```

### Tests E2E

```python
async def test_full_workflow_with_form_prefill():
    """
    Test E2E complet :
    Upload IRPF → OCR → Mapping → Pré-fill Form → Validation → Save DB
    """
    # 1. Upload document IRPF
    with open("test_declaration_irpf.pdf", "rb") as f:
        response = await client.post(
            "/documents/upload",
            files={"file": f},
            data={
                "document_type": "declaration_irpf",
                "enable_form_mapping": "true"
            },
            headers={"Authorization": f"Bearer {token}"}
        )
    
    assert response.status_code == 200
    data = response.json()["data"]
    
    # 2. Vérifier mapping présent
    assert "form_mapping" in data
    assert data["form_mapping"]["target_table"] == "declaration_irpf_data"
    assert "revenus_salaires" in data["form_mapping"]["pre_filled_fields"]
    
    # 3. Frontend charge formulaire pré-rempli
    form_url = data["form_mapping"]["form_url"]
    pre_filled = data["form_mapping"]["pre_filled_fields"]
    
    # 4. User valide et soumet
    declaration_response = await client.post(
        "/declarations/irpf",
        json={
            "document_id": data["document_id"],
            **pre_filled  # Utilise données pré-remplies
        },
        headers={"Authorization": f"Bearer {token}"}
    )
    
    assert declaration_response.status_code == 201
    
    # 5. Vérifier données sauvegardées dans table SQL
    saved_data = await db.declaration_irpf_data.find_one({
        "tax_declaration_id": declaration_response.json()["data"]["declaration_id"]
    })
    
    assert saved_data["revenus_salaires"] == pre_filled["revenus_salaires"]
```

---

## 📚 CONFIGURATION EXTRACTORS

### Exemple : IRPFExtractor

```python
class IRPFExtractor:
    """
    Extractor spécialisé pour déclarations IRPF
    
    Champs extraits → Mapping table declaration_irpf_data:
    - revenus_salaires
    - revenus_activites_professionnelles
    - deductions_charges_famille
    - deductions_cotisations_sociales
    - tipo_gravamen
    - calculated_amount
    """
    
    KEYWORDS = {
        "revenus_salaires": [
            "renta salarial", "salaire", "revenu travail",
            "salario bruto", "gross salary"
        ],
        "deductions_charges_famille": [
            "deducciones familia", "charges famille",
            "deducción hijos", "enfants à charge"
        ],
        "tipo_gravamen": [
            "tipo gravamen", "taux imposition", "tax rate",
            "tipo impositivo"
        ]
    }
    
    def extract(self, ocr_text: str) -> Dict:
        """Extrait champs structurés depuis texte OCR"""
        extracted = {}
        
        # Patterns regex par champ
        patterns = {
            "revenus_salaires": r"(?:renta salarial|salaire)[\s:]+([0-9,.]+)",
            "deductions_charges_familie": r"(?:deducciones familia|charges)[\s:]+([0-9,.]+)",
            "tipo_gravamen": r"(?:tipo gravamen|taux)[\s:]+([0-9,.]+)%?"
        }
        
        for field, pattern in patterns.items():
            match = re.search(pattern, ocr_text, re.IGNORECASE)
            if match:
                value = self._parse_number(match.group(1))
                extracted[field] = value
        
        # Calculs automatiques
        if "revenus_salaires" in extracted and "deductions_charges_famille" in extracted:
            extracted["base_liquidable"] = (
                extracted["revenus_salaires"] - 
                extracted["deductions_charges_familie"]
            )
        
        return extracted
    
    def _parse_number(self, text: str) -> float:
        """Parse nombre depuis texte (gérer . et ,)"""
        cleaned = text.replace(",", "").replace(".", "")
        return float(cleaned)
```

---

## 🔄 WORKFLOW FRONTEND INTÉGRATION

### Exemple React : Pré-remplissage automatique

```typescript
// FormIRPF.tsx
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

const FormIRPF = () => {
  const [searchParams] = useSearchParams();
  const documentId = searchParams.get('prefill');
  
  const [formData, setFormData] = useState({
    revenus_salaires: 0,
    deductions_charges_famille: 0,
    tipo_gravamen: 0,
    // ... autres champs
  });
  
  const [fieldsConfidence, setFieldsConfidence] = useState({});
  
  useEffect(() => {
    if (documentId) {
      // Récupérer mapping depuis backend
      fetch(`/api/v1/documents/${documentId}/form-mapping`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => {
          const mapping = data.data.form_mapping;
          
          // Pré-remplir formulaire automatiquement
          setFormData(mapping.pre_filled_fields);
          setFieldsConfidence(mapping.fields_confidence);
          
          // Afficher toast de succès
          toast.success(
            `Formulaire pré-rempli avec ${mapping.mapping_quality.successfully_mapped} champs extraits du document`
          );
        });
    }
  }, [documentId]);
  
  return (
    <form onSubmit={handleSubmit}>
      <div className="field">
        <label>Revenus Salaires (XAF)</label>
        <input 
          type="number"
          value={formData.revenus_salaires}
          onChange={e => setFormData({...formData, revenus_salaires: e.target.value})}
          className={fieldsConfidence.revenus_salaires < 0.80 ? 'low-confidence' : ''}
        />
        {fieldsConfidence.revenus_salaires < 0.80 && (
          <span className="warning">⚠️ Confiance faible - vérifier valeur</span>
        )}
      </div>
      
      {/* ... autres champs ... */}
      
      <button type="submit">Valider déclaration</button>
    </form>
  );
};
```

---

**FIN MODULE DOCUMENTS V2**

**✅ VERSION CORRIGÉE** : Inclut maintenant le workflow complet avec mapping intelligent vers les 7 tables SQL et 20 modèles de documents supportés.

**🎯 CHANGEMENTS MAJEURS** :
1. ✅ 20 modèles de documents (vs 5 extractors génériques)
2. ✅ Classification intelligente automatique
3. ✅ Mapping vers 7 tables SQL spécifiques
4. ✅ Réponse avec `form_mapping` pour pré-remplissage frontend
5. ✅ Nouveau UC-DOC-008 : GET form-mapping endpoint
6. ✅ Exemple code complet extractors + mapping
7. ✅ Workflow frontend React intégration