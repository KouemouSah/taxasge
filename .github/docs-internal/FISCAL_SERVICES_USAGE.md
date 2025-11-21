# Fiscal Services - Guide d'Utilisation

## Vue d'ensemble

Le module `fiscal_services` gère le **catalogue des services fiscaux** (850+ services gouvernementaux).

## Architecture

```
fiscal_services/
├── models/
│   ├── fiscal_service.py    - Services fiscaux et calculs
│   └── templates.py          - Templates et assignments
├── services/
│   ├── fiscal_service_service.py  - Logique métier complexe
│   └── calculation_service.py     - Calculs de montants
├── repositories/
│   └── fiscal_service_repository.py  - Accès données
└── api/
    └── fiscal_service_routes.py      - Endpoints API
```

## Tables Principales

### 1. **fiscal_services** - Catalogue des services
```sql
fiscal_services (
  id INTEGER,
  service_code VARCHAR(20) UNIQUE,
  category_id INTEGER,
  name_es VARCHAR(255),           -- Nom en espagnol (source)
  description_es TEXT,             -- Description en espagnol (source)
  service_type service_type_enum,
  calculation_method calculation_method_enum,
  tasa_expedicion NUMERIC,         -- Tarif 1ère émission
  tasa_renovacion NUMERIC,         -- Tarif renouvellement
  status service_status_enum
)
```

**Exemples:**
- FS-001: "Permiso de Residencia Temporal" - 50,000 GNF
- FS-002: "Licencia Comercial" - 100,000 GNF

### 2. **service_keywords** - Mots-clés de recherche
```sql
service_keywords (
  id INTEGER,
  fiscal_service_id INTEGER,
  keyword VARCHAR(100),            -- Mot-clé recherche
  language_code VARCHAR(2),        -- es, en, fr
  weight INTEGER,                  -- 1-10 (importance)
  is_auto_generated BOOLEAN
)
```

**⚠️ USAGE: RECHERCHE EXCLUSIVEMENT**

Les keywords permettent de trouver un service en tapant différents termes:

**Exemple pour "Permiso de Residencia":**
```json
[
  {"keyword": "residencia", "language_code": "es", "weight": 10},
  {"keyword": "permiso", "language_code": "es", "weight": 8},
  {"keyword": "temporal", "language_code": "es", "weight": 6},
  {"keyword": "residence", "language_code": "en", "weight": 10},
  {"keyword": "permit", "language_code": "en", "weight": 8},
  {"keyword": "temporary", "language_code": "en", "weight": 6},
  {"keyword": "résidence", "language_code": "fr", "weight": 10},
  {"keyword": "permis", "language_code": "fr", "weight": 8}
]
```

**Flow de recherche:**
1. Utilisateur tape: "residence"
2. Système cherche dans `service_keywords` WHERE keyword LIKE '%residence%'
3. Trouve le service "Permiso de Residencia" grâce au keyword anglais
4. Retourne le service

### 3. **entity_translations** - Traductions UI du site
```sql
entity_translations (
  entity_type translatable_entity_type,  -- 'fiscal_service'
  entity_code VARCHAR(100),              -- service_code
  language_code VARCHAR(5),              -- fr, en, pt
  field_name VARCHAR(30),                -- name, description
  translation_text TEXT,                 -- Texte traduit
  translation_source VARCHAR(20),        -- manual, google, deepl
  translation_quality NUMERIC            -- 0-1
)
```

**⚠️ USAGE: INTERFACE UTILISATEUR UNIQUEMENT**

Les translations servent à afficher le site en différentes langues:

**Exemple pour "Permiso de Residencia":**

**Données source (espagnol):**
```json
{
  "service_code": "FS-001",
  "name_es": "Permiso de Residencia Temporal",
  "description_es": "Documento que permite residir temporalmente en Guinea Ecuatorial"
}
```

**Traductions UI:**
```json
[
  {
    "entity_type": "fiscal_service",
    "entity_code": "FS-001",
    "language_code": "fr",
    "field_name": "name",
    "translation_text": "Permis de Résidence Temporaire",
    "translation_source": "manual",
    "translation_quality": 1.0
  },
  {
    "entity_type": "fiscal_service",
    "entity_code": "FS-001",
    "language_code": "fr",
    "field_name": "description",
    "translation_text": "Document permettant de résider temporairement en Guinée Équatoriale",
    "translation_source": "google_translate",
    "translation_quality": 0.8
  },
  {
    "entity_type": "fiscal_service",
    "entity_code": "FS-001",
    "language_code": "en",
    "field_name": "name",
    "translation_text": "Temporary Residence Permit",
    "translation_source": "manual",
    "translation_quality": 1.0
  }
]
```

**Flow d'affichage:**
1. Utilisateur sélectionne "Français" dans les paramètres UI
2. Frontend demande GET /api/fiscal-services/FS-001?lang=fr
3. Backend retourne:
   - Si translation existe: "Permis de Résidence Temporaire"
   - Sinon fallback: "Permiso de Residencia Temporal" (espagnol)

### 4. **service_document_assignments** - Documents requis
```sql
service_document_assignments (
  id INTEGER,
  fiscal_service_id INTEGER,
  document_template_id INTEGER,
  is_required_expedition BOOLEAN,    -- Requis pour 1ère demande
  is_required_renewal BOOLEAN,       -- Requis pour renouvellement
  display_order INTEGER,
  custom_notes TEXT
)
```

**Exemple:**
```json
{
  "fiscal_service_id": 1,
  "assignments": [
    {
      "document_template_id": 5,
      "is_required_expedition": true,
      "is_required_renewal": false,
      "display_order": 1,
      "custom_notes": "Pasaporte vigente con 6 meses de validez"
    },
    {
      "document_template_id": 12,
      "is_required_expedition": true,
      "is_required_renewal": true,
      "display_order": 2,
      "custom_notes": "Fotografía reciente tamaño pasaporte"
    }
  ]
}
```

### 5. **service_procedure_assignments** - Procédures à suivre
```sql
service_procedure_assignments (
  id INTEGER,
  fiscal_service_id INTEGER,
  template_id INTEGER,              -- FK procedure_templates
  applies_to VARCHAR(20),           -- 'expedition', 'renewal', 'both'
  display_order INTEGER,
  custom_notes TEXT,
  override_steps JSONB              -- Personnalisation étapes
)
```

## Différence: Keywords vs Translations

| Aspect | Keywords | Translations |
|--------|----------|--------------|
| **Usage** | Recherche | Interface UI |
| **Langue source** | Toutes langues | Espagnol uniquement |
| **Cible** | Moteur recherche | Affichage utilisateur |
| **Exemple** | "residence" trouve "Permiso..." | UI française affiche "Permis de..." |
| **Table** | service_keywords | entity_translations |
| **Automatique?** | Peut être auto-généré | Généralement manuel/API |

## Création d'un Fiscal Service Complet

```python
from app.modules.fiscal_services.services import FiscalServiceService
from app.modules.fiscal_services.models import *

service = FiscalServiceService()

result = await service.create_fiscal_service(
    conn=db_conn,

    # 1. Service de base
    service=FiscalServiceCreate(
        service_code="FS-RESIDENCE-001",
        category_id=5,
        name_es="Permiso de Residencia Temporal",
        description_es="Documento que permite residir temporalmente",
        service_type=ServiceTypeEnum.RESIDENCE_PERMIT,
        calculation_method=CalculationMethodEnum.FIXED_BOTH,
        tasa_expedicion=50000,
        tasa_renovacion=30000,
        status=ServiceStatusEnum.ACTIVE
    ),

    # 2. Documents requis
    document_assignments=[
        ServiceDocumentAssignmentCreate(
            document_template_id=5,
            is_required_expedition=True,
            is_required_renewal=False,
            display_order=1
        )
    ],

    # 3. Procédures
    procedure_assignments=[
        ServiceProcedureAssignmentCreate(
            template_id=3,
            applies_to="both",
            display_order=1
        )
    ],

    # 4. Keywords pour RECHERCHE
    keywords=[
        # Espagnol
        ServiceKeywordCreate(
            keyword="residencia",
            language_code="es",
            weight=10
        ),
        ServiceKeywordCreate(
            keyword="permiso",
            language_code="es",
            weight=8
        ),
        # Anglais (pour recherche multilingue)
        ServiceKeywordCreate(
            keyword="residence",
            language_code="en",
            weight=10
        ),
        ServiceKeywordCreate(
            keyword="permit",
            language_code="en",
            weight=8
        ),
        # Français (pour recherche multilingue)
        ServiceKeywordCreate(
            keyword="résidence",
            language_code="fr",
            weight=10
        )
    ],

    # 5. Translations pour UI SITE
    translations=[
        # Français
        EntityTranslationCreate(
            entity_type=TranslatableEntityType.FISCAL_SERVICE,
            entity_code="FS-RESIDENCE-001",
            language_code="fr",
            field_name="name",
            translation_text="Permis de Résidence Temporaire",
            translation_source="manual",
            translation_quality=1.0
        ),
        EntityTranslationCreate(
            entity_type=TranslatableEntityType.FISCAL_SERVICE,
            entity_code="FS-RESIDENCE-001",
            language_code="fr",
            field_name="description",
            translation_text="Document permettant de résider temporairement",
            translation_source="google_translate",
            translation_quality=0.8
        ),
        # Anglais
        EntityTranslationCreate(
            entity_type=TranslatableEntityType.FISCAL_SERVICE,
            entity_code="FS-RESIDENCE-001",
            language_code="en",
            field_name="name",
            translation_text="Temporary Residence Permit",
            translation_source="manual",
            translation_quality=1.0
        )
    ]
)
```

## Exemples d'Utilisation

### Scénario 1: Recherche multilingue

**Utilisateur français tape: "permis résidence"**
```python
# Recherche dans keywords
results = await search_services(query="permis résidence", lang="fr")
# Trouve "Permiso de Residencia" grâce aux keywords français

# Si UI en français, affiche traduction
# Sinon, affiche nom espagnol original
```

### Scénario 2: Affichage UI multilingue

**Utilisateur sélectionne langue UI: Français**
```python
# GET /api/fiscal-services/FS-001?ui_lang=fr
service = await get_service("FS-001", ui_lang="fr")

# Retourne:
{
  "service_code": "FS-001",
  "name": "Permis de Résidence Temporaire",  # ← Translation
  "description": "Document permettant...",    # ← Translation
  "name_es": "Permiso de Residencia...",     # ← Original
  "description_es": "Documento que..."       # ← Original
}
```

## Résumé

1. **Données source:** Toujours en espagnol (name_es, description_es)
2. **Keywords:** Pour recherche multilingue (es, fr, en)
3. **Translations:** Pour UI site multilingue (fr, en, pt)
4. **Assignments:** Lient services → documents/procédures requis
5. **Service layer:** Gère création atomique avec toutes relations
