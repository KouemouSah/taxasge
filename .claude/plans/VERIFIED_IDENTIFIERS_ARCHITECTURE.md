# Architecture Module verified_identifiers - Version Corrigée

## 1. Flux de Vérification (Corrigé)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        SOUMISSION DEMANDE                                    │
│                                                                             │
│  Citoyen soumet formulaire → form_data JSON stocké                         │
│  {                                                                          │
│    "dip": { "numero_dip": "000074636", "fecha_expiracion": "2030-08-05" }, │
│    "pasaporte_antiguo": { "numero_pasaporte": "P10004052", ... }           │
│  }                                                                          │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                      EXTRACTION IDs (depuis form_data)                       │
│                                                                             │
│  1. Lire document_verification_config pour le workflow                      │
│  2. Pour chaque document_code configuré:                                    │
│     - Extraire form_data[document_code][extraction_path]                    │
│     - Ex: form_data["dip"]["numero_dip"] → "000074636"                     │
│  3. Créer entrée dans verification_queue                                    │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────┴───────────────┐
                    ▼                               ▼
┌───────────────────────────────┐   ┌───────────────────────────────────────┐
│    AUTO-VÉRIFICATION          │   │       VÉRIFICATION MANUELLE           │
│                               │   │                                       │
│ 1. Hasher ID (HMAC-SHA256)    │   │ Fallback AUTOMATIQUE si:             │
│ 2. Chercher dans              │   │ - ID non trouvé en auto              │
│    verified_identifiers       │   │ - Document expiré                    │
│ 3. Comparer dates expiration  │   │ - Données incohérentes               │
│                               │   │                                       │
│ Résultat:                     │   │ Agent vérifie:                        │
│ ✓ Trouvé & valide → OK        │   │ 1. Document physique/scan            │
│ ✗ Non trouvé → FALLBACK ───────────│ 2. Cohérence données extraites       │
│ ✗ Expiré → FALLBACK ───────────────│ 3. Validation identité               │
└───────────────────────────────┘   └───────────────────────────────────────┘
                                                    │
                                                    ▼
                    ┌───────────────────────────────────────────────────────┐
                    │         INSERTION AUTOMATIQUE (NON OPTIONNELLE)        │
                    │                                                       │
                    │ Agent valide → système insère AUTOMATIQUEMENT:        │
                    │                                                       │
                    │ INSERT INTO verified_identifiers (                    │
                    │   blind_index,      -- HMAC-SHA256 de l'ID            │
                    │   encrypted_value,  -- AES-256-GCM de l'ID            │
                    │   identifier_type,  -- 'dni', 'pasaporte', etc.       │
                    │   source,           -- 'manual_verification'          │
                    │   expires_at,       -- Depuis form_data.fecha_expir.  │
                    │   verified_by,      -- UUID de l'agent                │
                    │   verification_request_id -- UUID de la demande       │
                    │ )                                                      │
                    └───────────────────────────────────────────────────────┘
```

## 2. Source des IDs - CLARIFICATION

### Question: form_data vs extraction_data?

**Réponse: form_data est la source correcte**

| Source | Utilisation | Pourquoi |
|--------|-------------|----------|
| `form_data` | **SOURCE PRIMAIRE** pour les IDs à vérifier | C'est la déclaration officielle du citoyen |
| `extraction_data` | **VALIDATION** - comparer avec Gemini OCR | Sert à valider que le document correspond |

### Chemin d'extraction

```javascript
// Configuration dans document_verification_config:
{
  document_code: 'dip',
  extraction_paths: ['numero_dip'],
  expiration_path: 'fecha_expiracion'
}

// Extraction depuis service_request.form_data:
const identifierValue = form_data['dip']['numero_dip'];     // "000074636"
const expirationDate = form_data['dip']['fecha_expiracion']; // "2030-08-05"
```

## 3. Architecture Backend à Mettre à Jour

### 3.1 Endpoint manual_verification (MODIFICATION REQUISE)

**Fichier**: `packages/backend/app/modules/verified_identifiers/api/verified_identifiers_routes.py`

```python
@router.post("/manual-verification/{request_id}/validate")
async def validate_manual_verification(
    request_id: UUID,
    validation: ManualVerificationValidation,
    current_user: User = Depends(get_current_user),
    db = Depends(get_database)
):
    """
    Valide une vérification manuelle.
    IMPORTANT: Insertion automatique dans verified_identifiers (NON OPTIONNEL)
    """
    # 1. Récupérer la demande et ses documents
    service_request = await get_service_request(db, request_id)

    # 2. Pour chaque document vérifié
    for doc_verification in validation.documents:
        # 3. Extraire l'ID depuis form_data
        identifier_value = extract_identifier_from_form_data(
            service_request.form_data,
            doc_verification.document_code
        )

        # 4. INSERTION AUTOMATIQUE (pas optionnel)
        await insert_verified_identifier(
            db,
            identifier_value=identifier_value,
            identifier_type=doc_verification.identifier_type,
            source='manual_verification',
            expires_at=extract_expiration_date(service_request.form_data, doc_verification.document_code),
            verified_by=current_user.id,
            verification_request_id=request_id
        )

    # 5. Mettre à jour le statut de la demande
    await update_verification_status(db, request_id, 'VERIFIED')
```

### 3.2 Service d'extraction dynamique (NOUVEAU)

**Fichier**: `packages/backend/app/modules/verified_identifiers/services/identifier_extractor.py`

```python
async def extract_identifier_from_form_data(
    form_data: dict,
    document_code: str,
    config: DocumentVerificationConfig
) -> tuple[str, datetime | None]:
    """
    Extrait l'identifiant et la date d'expiration depuis form_data.

    Args:
        form_data: JSON soumis par le citoyen
        document_code: Code du document (ex: 'dip')
        config: Configuration de vérification

    Returns:
        tuple(identifier_value, expiration_date)
    """
    # Naviguer vers l'objet document
    doc_data = form_data.get(document_code, {})

    # Extraire l'identifiant (premier path trouvé)
    identifier_value = None
    for path in config.extraction_paths:
        identifier_value = doc_data.get(path)
        if identifier_value:
            break

    # Extraire la date d'expiration
    expiration_date = None
    if config.expiration_path:
        exp_str = doc_data.get(config.expiration_path)
        if exp_str:
            expiration_date = parse_date(exp_str)

    return identifier_value, expiration_date
```

## 4. Détection Dynamique des Champs (NOUVEAU)

### Comment ça fonctionne

Quand un admin ajoute un nouveau document à un workflow:

1. **workflow_document_requirements** définit le document_code et extraction_schema_key
2. **extraction_schemas** définit les champs extraits par Gemini
3. **Vue v_verification_config_fields** expose les champs disponibles

### Implémentation

```sql
-- Vue créée dans migration 076
CREATE VIEW v_verification_config_fields AS
SELECT
    dvc.document_code,
    wdr.extraction_schema_key,
    -- Champs disponibles basés sur le schéma d'extraction
    available_fields
FROM document_verification_config dvc
LEFT JOIN workflow_document_requirements wdr
    ON wdr.document_code = dvc.document_code;
```

### API pour Admin UI

```python
@router.get("/document-fields/{document_code}")
async def get_available_fields(document_code: str):
    """
    Retourne les champs disponibles pour un type de document.
    Utilisé par l'admin UI pour configurer les extraction_paths.
    """
    # 1. Chercher dans workflow_document_requirements
    wdr = await get_workflow_document_requirement(document_code)

    # 2. Si extraction_schema_key existe, charger le schéma
    if wdr.extraction_schema_key:
        schema = await load_extraction_schema(wdr.extraction_schema_key)
        return schema.fields

    # 3. Sinon, analyser form_data existants
    return await analyze_form_data_fields(document_code)
```

## 5. Impact sur le Plan UI Admin

### Changements au Plan Initial

| Phase | Avant | Après |
|-------|-------|-------|
| **Phase 1** | Configuration manuelle des extraction_paths | Sélection depuis liste dynamique |
| **Phase 2** | Import manuel des IDs | Import + insertion auto sur validation |
| **Phase 3** | Statistiques basiques | Statistiques incluant source='manual_verification' |
| **Phase 4** | Audit simple | Audit avec traçabilité complète agent→ID |

### Nouveau Workflow UI Admin

```
┌─────────────────────────────────────────────────────────────────┐
│  Page: Configuration Vérification Documents                     │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Document: DIP                          [Actif ✓]        │   │
│  │                                                         │   │
│  │ Champs disponibles (détectés automatiquement):         │   │
│  │ ☑ numero_dip        ← Identifiant principal            │   │
│  │ ☐ id_lateral                                           │   │
│  │ ☐ numero_registro                                      │   │
│  │ ☑ fecha_expiracion  ← Date d'expiration               │   │
│  │                                                         │   │
│  │ Type d'identifiant: [dni ▼]                            │   │
│  │ Entité source: [cnedoge ▼]                             │   │
│  │ Obligatoire: [✓]                                       │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  [+ Ajouter Document]  [Enregistrer]                           │
└─────────────────────────────────────────────────────────────────┘
```

## 6. Résumé des Mises à Jour Requises

### Backend

| Fichier | Action |
|---------|--------|
| `verified_identifiers_routes.py` | Modifier endpoint validation pour insertion auto |
| `identifier_extractor.py` | NOUVEAU - Service extraction dynamique |
| `verified_identifiers_repository.py` | Ajouter méthode insert avec source traçable |

### Base de Données

| Migration | Statut |
|-----------|--------|
| 076_fix_document_verification_config.sql | ✅ EXÉCUTÉ |

### Frontend (Admin UI)

| Page | Priorité |
|------|----------|
| `/admin/verification/documents` | P1 - Config avec champs dynamiques |
| `/admin/verification/import` | P2 - Import batch |
| `/admin/verification/stats` | P3 - Dashboard stats |
| `/admin/verification/audit` | P4 - Historique |

## 7. Questions Résolues

1. **Source des IDs**: `form_data` (déclaration citoyen) ✅
2. **Insertion automatique**: Oui, NON optionnel sur validation manuelle ✅
3. **Détection dynamique**: Via `workflow_document_requirements` + `extraction_schemas` ✅
4. **Date expiration**: Extraite automatiquement via `expiration_path` ✅
