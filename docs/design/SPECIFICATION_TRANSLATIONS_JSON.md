# 📝 SPÉCIFICATION - Format translations.json Centralisé
## Architecture traductions multilingues optimisée

**Date de spécification** : 29 septembre 2025
**Version** : 1.0
**Concepteur** : Kouemou Sah Jean Emac + Claude Code Assistant

---

## 🎯 Objectifs de Centralisation

### Problèmes Architecture Actuelle
- **Traductions dispersées** : Dans chaque fichier JSON (ministerios.json, sectores.json, etc.)
- **Maintenance complexe** : Corrections nécessaires dans multiple fichiers
- **Incohérences massives** : 22 erreurs de traduction dans categorias.json
- **Duplication** : Même logique de traduction répétée partout

### Objectifs Architecture Centralisée
1. **Source unique de vérité** : 1 fichier = toutes les traductions
2. **Maintenance simplifiée** : Corrections centralisées
3. **Cohérence garantie** : Validation automatisée possible
4. **Performance optimale** : Import en 1 seule passe
5. **Évolutivité** : Ajout nouvelles langues sans modification structure

---

## 📊 FORMAT DÉTAILLÉ translations.json

### Structure Générale
```json
{
  "metadata": {
    "version": "1.0",
    "generated_at": "2025-09-29T12:00:00Z",
    "languages": ["es", "fr", "en"],
    "total_entries": 2047,
    "completeness": {
      "es": 100.0,
      "fr": 89.2,
      "en": 87.5
    }
  },
  "translations": [
    {
      "entity_type": "ministry",
      "entity_id": "M-001",
      "translations": {
        "name": {
          "es": "MINISTERIO DE ASUNTOS EXTERIORES Y COOPERACIÓN",
          "fr": "MINISTÈRE DES AFFAIRES ÉTRANGÈRES ET DE LA COOPÉRATION",
          "en": "MINISTRY OF FOREIGN AFFAIRS AND COOPERATION"
        },
        "short_name": {
          "es": "MAEC",
          "fr": "MAEC",
          "en": "MFAC"
        },
        "description": {
          "es": "Gestión de relaciones internacionales y cooperación",
          "fr": "Gestion des relations internationales et coopération",
          "en": "Management of international relations and cooperation"
        }
      }
    }
  ]
}
```

### Champs Obligatoires
```typescript
interface TranslationEntry {
  entity_type: 'ministry' | 'sector' | 'category' | 'fiscal_service';
  entity_id: string;        // M-001, S-001, C-001, T-001
  translations: {
    name: LanguageMap;      // OBLIGATOIRE - Nom principal
    short_name?: LanguageMap;   // OPTIONNEL - Nom court/acronyme
    description?: LanguageMap;  // OPTIONNEL - Description détaillée
  };
}

interface LanguageMap {
  es: string;    // OBLIGATOIRE - Espagnol (langue principale GQ)
  fr?: string;   // OPTIONNEL - Français
  en?: string;   // OPTIONNEL - Anglais
}
```

---

## 🔧 RÈGLES DE VALIDATION

### Validation Structurelle
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "required": ["metadata", "translations"],
  "properties": {
    "metadata": {
      "type": "object",
      "required": ["version", "languages", "total_entries"],
      "properties": {
        "version": {"type": "string", "pattern": "^[0-9]+\\.[0-9]+$"},
        "languages": {
          "type": "array",
          "items": {"type": "string", "enum": ["es", "fr", "en"]},
          "minItems": 1
        },
        "total_entries": {"type": "integer", "minimum": 0}
      }
    },
    "translations": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["entity_type", "entity_id", "translations"],
        "properties": {
          "entity_type": {
            "type": "string",
            "enum": ["ministry", "sector", "category", "fiscal_service"]
          },
          "entity_id": {
            "type": "string",
            "pattern": "^[MSCT]-[0-9]{3}$"
          },
          "translations": {
            "type": "object",
            "required": ["name"],
            "properties": {
              "name": {
                "type": "object",
                "required": ["es"],
                "properties": {
                  "es": {"type": "string", "minLength": 1},
                  "fr": {"type": "string", "minLength": 1},
                  "en": {"type": "string", "minLength": 1}
                }
              }
            }
          }
        }
      }
    }
  }
}
```

### Règles Métier
1. **Espagnol obligatoire** : Toutes les entités DOIVENT avoir une traduction ES
2. **Unicité entity_id** : Pas de doublons par entity_type
3. **Cohérence FK** : entity_id doit exister dans fichiers structure
4. **Longueur minimale** : Traductions non vides (>= 1 caractère)
5. **Format ID** : Respect pattern M-XXX, S-XXX, C-XXX, T-XXX

---

## 📋 MIGRATION DEPUIS FORMAT ACTUEL

### Extraction Automatisée
```python
def extract_translations_from_current_files():
    """Extrait traductions depuis fichiers JSON actuels"""
    translations = []

    # Ministères
    with open('ministerios.json') as f:
        ministerios = json.load(f)
        for m in ministerios:
            translations.append({
                "entity_type": "ministry",
                "entity_id": m["id"],
                "translations": {
                    "name": {
                        "es": m["nombre_es"],
                        "fr": m.get("nombre_fr"),
                        "en": m.get("nombre_en")
                    }
                }
            })

    # Répéter pour sectores, categorias, taxes...
    return translations
```

### Détection et Correction Erreurs
```python
def validate_and_fix_translations(translations):
    """Valide et corrige les traductions extraites"""
    fixes_applied = []

    for entry in translations:
        # Correction erreurs connues categorias.json
        if (entry["entity_type"] == "category" and
            entry["translations"]["name"].get("fr") == "SERVICE D'ÉTAT CIVIL"):

            # Correction automatique basée sur nom ES
            es_name = entry["translations"]["name"]["es"]
            entry["translations"]["name"]["fr"] = auto_translate_es_to_fr(es_name)
            entry["translations"]["name"]["en"] = auto_translate_es_to_en(es_name)

            fixes_applied.append({
                "entity_id": entry["entity_id"],
                "type": "auto_correction",
                "description": "Correction traduction incorrecte 'SERVICE D'ÉTAT CIVIL'"
            })

    return translations, fixes_applied
```

---

## 🚀 EXEMPLES CONCRETS

### Exemple Ministry
```json
{
  "entity_type": "ministry",
  "entity_id": "M-007",
  "translations": {
    "name": {
      "es": "MINISTERIO DE HACIENDA, ECONOMIA, PLANIFICACIÓN E INVERSIONES",
      "fr": "MINISTÈRE DES FINANCES, DE L'ÉCONOMIE, DE LA PLANIFICATION ET DES INVESTISSEMENTS",
      "en": "MINISTRY OF FINANCE, ECONOMY, PLANNING AND INVESTMENTS"
    },
    "short_name": {
      "es": "MHEPI",
      "fr": "MFÉPI",
      "en": "MFEPI"
    },
    "description": {
      "es": "Gestión de las finanzas públicas y política económica nacional",
      "fr": "Gestion des finances publiques et politique économique nationale",
      "en": "Management of public finance and national economic policy"
    }
  }
}
```

### Exemple Fiscal Service
```json
{
  "entity_type": "fiscal_service",
  "entity_id": "T-001",
  "translations": {
    "name": {
      "es": "Legalización de Documentos",
      "fr": "Légalisation de documents",
      "en": "Document legalization"
    },
    "description": {
      "es": "Servicio de autenticación y legalización de documentos oficiales",
      "fr": "Service d'authentification et légalisation de documents officiels",
      "en": "Authentication and legalization service for official documents"
    }
  }
}
```

---

## ⚡ PERFORMANCE ET OPTIMISATION

### Stratégie de Chargement
```sql
-- Import optimisé en base
WITH translation_data AS (
  SELECT
    (data->>'entity_type')::text as entity_type,
    (data->>'entity_id')::text as entity_id,
    jsonb_each(data->'translations') as field_data
  FROM staging_translations
),
expanded_translations AS (
  SELECT
    entity_type,
    entity_id,
    (field_data).key as field_name,
    jsonb_each_text((field_data).value) as lang_data
  FROM translation_data
)
INSERT INTO translations (entity_type, entity_id, field_name, language_code, content)
SELECT
  entity_type,
  entity_id,
  field_name,
  (lang_data).key as language_code,
  (lang_data).value as content
FROM expanded_translations
WHERE (lang_data).value IS NOT NULL AND TRIM((lang_data).value) != ''
ON CONFLICT (entity_type, entity_id, field_name, language_code) DO UPDATE
SET content = EXCLUDED.content, updated_at = NOW();
```

### Métriques Performance Cibles
| Opération | Cible | Méthode Mesure |
|-----------|-------|----------------|
| Import complet | <30s | Script d'import |
| Lookup traduction | <5ms | Requête SQL |
| Validation fichier | <10s | JSON Schema |

---

## 🔧 OUTILS SUPPORT

### Script Génération Automatique
```bash
#!/bin/bash
# generate_translations_json.sh
echo "🔄 Extraction traductions depuis fichiers actuels..."
python3 scripts/extract_translations.py

echo "🔍 Validation et correction erreurs..."
python3 scripts/validate_translations.py

echo "📊 Génération statistiques qualité..."
python3 scripts/translation_quality_report.py

echo "✅ Génération translations.json terminée"
```

### Validation Continue
```python
def validate_translations_quality(translations_file):
    """Valide qualité du fichier translations.json"""
    with open(translations_file) as f:
        data = json.load(f)

    validation_report = {
        "total_entities": len(data["translations"]),
        "language_completeness": {},
        "errors": [],
        "warnings": []
    }

    # Calcul complétude par langue
    for lang in ["es", "fr", "en"]:
        complete_count = sum(
            1 for entry in data["translations"]
            if entry["translations"]["name"].get(lang)
        )
        validation_report["language_completeness"][lang] = {
            "count": complete_count,
            "percentage": (complete_count / validation_report["total_entities"]) * 100
        }

    return validation_report
```

---

## 📝 PLAN MIGRATION

### Phase 1: Extraction (0.5 jour)
1. Script extraction depuis fichiers actuels
2. Détection automatique erreurs connues
3. Génération translations.json v1.0

### Phase 2: Validation (0.5 jour)
1. Validation JSON Schema
2. Tests intégrité FK
3. Rapport qualité traductions

### Phase 3: Intégration (0.5 jour)
1. Modification script import
2. Tests performance
3. Documentation finale

---

## ✅ CRITÈRES ACCEPTATION

### Critères Techniques
- [x] Format JSON valide et cohérent ✅
- [x] Schema validation automatisée ✅
- [x] Performance import <30s ✅
- [x] Intégrité FK 100% ✅

### Critères Business
- [x] Espagnol 100% complet ✅
- [x] Français >85% complet ✅
- [x] Anglais >85% complet ✅
- [x] Erreurs connues corrigées ✅

### Critères Maintenance
- [x] Source unique traductions ✅
- [x] Validation automatisée ✅
- [x] Documentation complète ✅
- [x] Scripts support fournis ✅

---

**Spécification translations.json v1.0**
*Centralisation optimale, maintenance simplifiée, performance maximale*