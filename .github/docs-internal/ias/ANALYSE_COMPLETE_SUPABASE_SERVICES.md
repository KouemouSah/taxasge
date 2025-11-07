# Analyse Complète des Services Supabase pour Génération de FAQs

**Date**: 2025-11-07
**Objectif**: Analyser les 850 services réels de Supabase pour sélectionner les Top 30 et générer 60 FAQs professionnelles

## 📊 Résumé Exécutif

### Services Analysés
- **Total services actifs**: 846 services
- **Services avec documents**: 609 (72%)
- **Services avec procédures**: 846 (100%)
- **Services pasaporte trouvés**: 7

### Top 30 Services Sélectionnés
- **Score de complétude**: 6/6 (maximum) pour tous
- **Critères**: Coût + Délai + Documents + Procédure + Popularité
- **Tous les services** ont:
  - ✅ Coût d'expédition défini
  - ✅ Délai de traitement (1 jour)
  - ✅ Au moins 1 document requis
  - ✅ 1 procédure assignée

## 💰 Analyse des Coûts

### Statistiques Globales (846 services)
- **Coût minimum**: 0.00 XAF
- **Coût maximum**: 25,000,000.00 XAF
- **Coût moyen (expédition)**: 200,089.33 XAF
- **Coût moyen (rénovation)**: 65,799.61 XAF

### Distribution des Coûts (Top 30)
| Plage | Nombre de Services |
|-------|-------------------|
| 0 - 100 XAF | 6 services |
| 100 - 10,000 XAF | 18 services |
| 10,000 - 50,000 XAF | 6 services |

## ⏱️ Analyse des Délais

**Constatation critique**: TOUS les 846 services ont `processing_time_days = 1`

Cela indique que:
1. Les délais réels ne sont pas encore saisis dans la base
2. OU il s'agit d'une valeur par défaut
3. Les délais détaillés sont dans `procedure_template_steps.estimated_duration_MINUTES`

**Recommandation**: Pour les FAQs, utiliser `processing_time_days` comme indicatif, mais mentionner "Délai estimé: 1 jour (sujet à confirmation)"

## 📄 Analyse des Documents

### Documents Requis par Service
- **Total assignments**: 1,000 relations
- **Services avec docs**: 609 (72%)
- **Moyenne docs/service**: 1.64 documents

### Catégories de Documents (Top 30)
- **identity**: Documents d'identité (passeport, DNI, etc.)
- **proof**: Preuves (domicile, revenus, etc.)
- **legal**: Documents légaux (statuts, actes notariés)

## 🏛️ Analyse par Ministère

### Top 5 Ministères Représentés (Top 30)

1. **MINISTERIO DE COMERCIO PROMOCIÓN DE PEQUEÑAS Y MEDIANAS EMPRESAS**
   - Services: 6 (T-201 à T-206)
   - Focus: Micro, Pequeña, Mediana empresa

2. **MINISTERIO DE ASUNTOS EXTERIORES Y COOPERACIÓN**
   - Services: 6 (incluant 4 services pasaporte)
   - Focus: Legalizaciones, Pasaportes, Carnets

3. **Ministère Aviation Civile** (non confirmé - category.ministry_id = null)
   - Services: Toneladas métricas (T-015 à T-026)
   - Focus: Aviation et transport

## 🔍 Services Pasaporte (Analyse Détaillée)

### 7 Services Pasaporte Trouvés

| Code | Nom | Coût | Ministère |
|------|-----|------|-----------|
| T-005 | Adquisición impreso de pasaporte y su expedición | 7,500 XAF | Asuntos Exteriores |
| T-006 | Renovación de Pasaporte por expiración | 5,000 XAF | Asuntos Exteriores |
| T-012 | Adquisición impreso de pasaporte y su expedición | 1 XAF | Asuntos Exteriores |
| T-013 | Renovación de Pasaporte por expiración | 5,000 XAF | Asuntos Exteriores |
| T-601 | Pasaporte Ordinario | 0 XAF | (à déterminer) |
| T-602 | Duplicado por extravío de Pasaporte | 0 XAF | (à déterminer) |
| T-603 | Renovación de pasaporte por expiración | 0 XAF | (à déterminer) |

**Observations**:
- **Duplication**: T-005/T-012 et T-006/T-013 semblent être des doublons
- **Coûts variables**: De 0 à 7,500 XAF (incohérence probable)
- **Recommandation**: Utiliser T-005 (7,500 XAF) et T-006 (5,000 XAF) pour les FAQs

### Documents Requis pour Pasaporte

**T-005** (Nouvelle acquisition):
- Documento de identidad
- Fotografía

**T-006** (Rénovation):
- Pasaporte actual
- Documento de identidad

## 📑 Autres Services Communs Trouvés

| Mot-clé | Nombre de Services |
|---------|-------------------|
| **visa** | 11 services |
| **licencia** | 16 services |
| **permiso** | 6 services |
| **certificado** | 46 services |
| **dni** | 0 services |
| **cedula** | 0 services |

**Note**: Pas de services DNI/Cedula trouvés dans la base actuelle.

## 📊 Top 30 Services Sélectionnés (Détail)

### 1-6: Promoción de PYMES
- **T-201**: Micro empresa (3,000 XAF)
- **T-202**: Pequeña empresa (5,000 XAF)
- **T-203**: Mediana empresa (10,000 XAF)
- **T-204**: Micro empresa (2,000 XAF)
- **T-205**: Pequeña empresa (4,000 XAF)
- **T-206**: Mediana empresa (8,000 XAF)

### 7-10: Legalizaciones (Asuntos Exteriores)
- **T-001**: Legalización de Documentos (2,000 XAF)
- **T-002**: Legalización de Escritos Notariados (2,000 XAF)
- **T-003**: Legalización de Diplomas o Títulos Académicos (2,000 XAF)
- **T-004**: Legalización de Documentos Mercantiles (10,000 XAF)

### 11-18: Pasaportes et Carnets (Asuntos Exteriores)
- **T-005**: Adquisición impreso de pasaporte y su expedición (7,500 XAF)
- **T-006**: Renovación de Pasaporte (5,000 XAF)
- **T-009**: Legalización de Escritos notariados (15,000 XAF)
- **T-010**: legalización de Diplomas (500 XAF)
- **T-011**: Legalización de Documentos Mercantiles (25,000 XAF)
- **T-012**: Adquisición impreso de pasaporte (1 XAF)
- **T-013**: Renovación de Pasaporte (5,000 XAF)
- **T-014**: Expedición Carnet Consular (5,000 XAF)

### 19-30: Aviation (Toneladas métricas)
- **T-015** à **T-026**: Services pour aéronefs (3.50 à 8,200 XAF)

## 🔧 Structure des Données Découvertes

### Hiérarchie Organisationnelle
```
Ministry (14 totaux)
  └─ Sector (16 totaux)
      └─ Category (98 totales)
          └─ Fiscal Service (846 actifs)
```

### Champs Clés Utilisés

**fiscal_services**:
- `service_code`: Code unique (ex: "T-201")
- `name_es`: Nom en espagnol
- `tasa_expedicion`: Coût d'expédition (XAF)
- `tasa_renovacion`: Coût de rénovation (XAF)
- `processing_time_days`: Délai en jours
- `category_id`: Lien vers catégorie

**service_document_assignments**:
- `fiscal_service_id`: Lien vers service
- `document_template_id`: Lien vers template
- `is_required_expedition`: Requis pour expédition
- `is_required_renewal`: Requis pour rénovation

**document_templates**:
- `document_name_es`: Nom du document en espagnol
- `category`: Catégorie (identity, proof, legal)

## 🎯 Recommandations pour Génération de FAQs

### Format FAQ Amélioré (Approuvé par l'utilisateur)

```markdown
📋 **{name_es}**

💰 **Costos:**
• Expedición: {tasa_expedicion} XAF
• Renovación: {tasa_renovacion} XAF (si > 0)

📄 **Descripción:**
{description_es ou générique}

🏛️ **Ministerio responsable:**
{ministry_name_es}

📄 **Documentos requeridos:**
1. {document_1}
2. {document_2}
...

⏱️ **Plazo de procesamiento:**
{processing_time_days} día(s)
Horario: 08H00 - 16H00
```

### Répartition des 60 FAQs

1. **30 FAQs Services** (basées sur Top 30)
   - Utiliser les données enrichies (ministry, docs, coûts)
   - Couvrir différents ministères et catégories
   - Inclure services populaires (pasaporte, licencia, certificado)

2. **15 FAQs Catégories**
   - Grouper services par catégorie
   - Lister services disponibles dans chaque catégorie
   - Fournir navigation vers services spécifiques

3. **15 FAQs Procédurales**
   - Comment payer
   - Comment suivre une demande
   - Documents acceptés
   - Horaires d'ouverture
   - Contact ministères
   - etc.

## 📁 Fichiers Générés

### Analyse Brute
- `supabase-analysis/full-analysis/all_services.json` (846 services)
- `supabase-analysis/full-analysis/all_doc_assignments.json` (1,000 assignments)
- `supabase-analysis/full-analysis/all_proc_assignments.json` (850 assignments)
- `supabase-analysis/full-analysis/top_30_services.json` (30 services sélectionnés)

### Données de Référence
- `supabase-analysis/enriched/categories.json` (98 catégories)
- `supabase-analysis/enriched/sectors.json` (16 secteurs)
- `supabase-analysis/enriched/ministries.json` (14 ministères)
- `supabase-analysis/enriched/document_templates.json` (templates)

### Services Enrichis
- `supabase-analysis/enriched/top_30_enriched.json` (Top 30 avec ministry + docs)

## ⚠️ Points d'Attention

### Données Incomplètes

1. **Délais**: Tous à 1 jour (probablement valeur par défaut)
2. **Descriptions**: Beaucoup de `description_es = null`
3. **Ministry liens**: Certaines categories ont `ministry_id = null`
4. **Doublons**: Services similaires avec codes différents

### Incohérences Détectées

1. **Pasaporte coûts**: De 0 à 7,500 XAF pour même service
2. **Codes T-012/T-005**: Même nom, coûts différents (1 vs 7,500 XAF)
3. **Services T-601 à T-603**: Coûts à 0 XAF (probablement incorrects)

### Actions Recommandées

1. ✅ **Pour FAQs**: Utiliser les services avec données les plus complètes
2. ⚠️ **Pour production**: Vérifier/corriger les doublons et incohérences
3. 📝 **Pour délais**: Calculer à partir de `procedure_template_steps` si nécessaire
4. 🏛️ **Pour ministères**: Compléter les liens manquants category → ministry

## 🚀 Prochaines Étapes

1. ✅ **Analyse complète** → Terminée
2. ✅ **Sélection Top 30** → Terminée
3. ✅ **Enrichissement ministry + docs** → Terminé
4. ⏳ **Génération 60 FAQs** → En cours
5. ⏳ **Traductions FR/EN** → À faire (via entity_translations)
6. ⏳ **Tests et validation** → À faire

## 📚 Références

- **Script d'analyse**: `packages/mobile/scripts/analyze-all-services.sh`
- **Script d'enrichissement**: `packages/mobile/scripts/enrich-services-simple.sh`
- **Données Supabase**: https://bpdzfkymgydjxxwlctam.supabase.co
- **Rapport précédent**: `.github/docs-internal/ias/ANALYSE_CRITIQUE_SCHEMA_SUPABASE.md`

---

**Rapport généré automatiquement par Claude Code**
**Date**: 2025-11-07T11:17:00Z
