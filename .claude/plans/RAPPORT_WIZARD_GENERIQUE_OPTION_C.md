# RAPPORT EXPERT : Wizard Generique Dynamique (Option C)

> **Date** : 2026-02-05
> **Auteur** : Claude (Expert Technique)
> **Objectif** : Analyse critique et rigoureuse de l'effort et ROI pour un wizard generique

---

## RESUME EXECUTIF

| Critere | Valeur |
|---------|--------|
| **Effort total estime** | 15-20 jours/homme |
| **Fichiers impactes** | ~25-30 fichiers |
| **Lignes de code** | ~3000-4000 nouvelles/modifiees |
| **Risque technique** | MOYEN-ELEVE |
| **ROI** | Positif SI 3+ workflows actifs |
| **Recommandation** | Migration progressive (pas Big Bang) |

---

## 1. ETAT ACTUEL DU SYSTEME

### 1.1 Architecture Backend (2 systemes paralleles)

```
PredefinedWorkflow (code-based)     GenericWorkflow (DB-driven)
         |                                    |
    pasaporte_workflow_v2.py            generic_workflow.py
    residencia_workflow.py              (charge depuis DB)
    vehiculo_workflow.py
    conducir_workflow.py
    contrato_workflow.py
    funcion_publica/*.py
```

**Probleme** : Ces deux systemes ne partagent pas d'implementation commune pour les formulaires.

### 1.2 Architecture Frontend

| Composant | Fichier | Lignes | Dynamisme |
|-----------|---------|--------|-----------|
| WorkflowWizard.tsx (generique) | components/ | 505 | 80% generique |
| PassportWizardPage (specifique) | wizard/page.tsx | **~2000** | 20% generique |

**Probleme majeur** : Le wizard Pasaporte est un fichier monolithique de ~2000 lignes avec :
- `step2Fields` hardcode (lignes 1936-1944)
- `step1Fields` hardcode (lignes 1925-1935)
- Logique conditionnelle dispersee dans tout le fichier
- Pas de reutilisation possible pour d'autres workflows

### 1.3 Inventaire des Workflows

| Workflow | Backend | Frontend | Complexite | Steps |
|----------|---------|----------|------------|-------|
| **Pasaporte** | PredefinedWorkflow v2 | Custom page.tsx | TRES HAUTE | 9 |
| **Residencia** | PredefinedWorkflow | Partiel | HAUTE | 8+ (3 phases) |
| **Vehiculo** | PredefinedWorkflow | Partiel | HAUTE | 6-7 |
| **Conducir** | PredefinedWorkflow | Minimal | MOYENNE | 5-6 |
| **Contrato** | PredefinedWorkflow | Minimal | BASSE | 4-5 |
| **Verificacion** | PredefinedWorkflow | Minimal | BASSE | 3 |

---

## 2. CE QUE L'OPTION C IMPLIQUE

### 2.1 Definition du Wizard Generique

Un wizard ou chaque etape est **entierement configurable** via :
1. Configuration JSON/DB (pas de code specifique par workflow)
2. Composants generiques reutilisables
3. Conditions evaluees dynamiquement

### 2.2 Composants a Creer/Modifier

#### A. Backend (Effort: ~6-8 jours)

| Composant | Description | Effort | Priorite |
|-----------|-------------|--------|----------|
| `workflow_form_sections` table | Nouvelle table pour sections de formulaire | 0.5j | P0 |
| `FormSectionSchema` model | Pydantic model pour sections/champs | 0.5j | P0 |
| API `/workflows/{code}/form-config` | Endpoint retournant config formulaire | 1j | P0 |
| `ConditionEvaluator` service | Evaluateur de conditions generique | 2j | P1 |
| Migration `workflow_form_sections` | Script SQL + donnees | 1j | P0 |
| Unification PredefinedWorkflow | Extraire config vers DB | 2-3j | P2 |

#### B. Frontend (Effort: ~8-10 jours)

| Composant | Description | Effort | Priorite |
|-----------|-------------|--------|----------|
| `DynamicFormRenderer.tsx` | Composant generique de rendu formulaire | 3j | P0 |
| `ConditionEvaluator.ts` | Evaluation conditions cote client | 1j | P0 |
| `GenericFormReviewStep.tsx` | Step review generique | 2j | P0 |
| `GenericPaymentStep.tsx` | Step paiement generique | 1j | P1 |
| `GenericAppointmentStep.tsx` | Existe deja (AppointmentSelection) | 0j | - |
| `GenericDocumentUploadStep.tsx` | Existe partiellement (DocumentUploader) | 0.5j | P1 |
| Migration PassportWizardPage | Remplacer hardcoding par generique | 2-3j | P2 |
| Types/interfaces | FormSection, FormField, Condition | 0.5j | P0 |

#### C. Base de donnees (Effort: ~1-2 jours)

```sql
-- Nouvelle table workflow_form_sections
CREATE TABLE workflow_form_sections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_code VARCHAR(50) NOT NULL,
    step_id VARCHAR(50) NOT NULL,
    section_id VARCHAR(50) NOT NULL,
    title_es VARCHAR(200) NOT NULL,
    title_fr VARCHAR(200),
    title_en VARCHAR(200),
    display_order INTEGER DEFAULT 0,
    condition_type VARCHAR(50), -- 'always', 'is_minor', 'solicitud_type', 'custom'
    condition_value JSONB,      -- {"solicitud_type": "EXPEDICION"} ou {"is_minor": true}
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(workflow_code, step_id, section_id)
);

-- Nouvelle table workflow_form_fields
CREATE TABLE workflow_form_fields (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    section_id UUID REFERENCES workflow_form_sections(id) ON DELETE CASCADE,
    field_key VARCHAR(100) NOT NULL,
    field_type VARCHAR(50) NOT NULL, -- 'text', 'date', 'select', 'radio', 'checkbox'
    label_es VARCHAR(200) NOT NULL,
    label_fr VARCHAR(200),
    label_en VARCHAR(200),
    placeholder_es VARCHAR(200),
    is_required BOOLEAN DEFAULT false,
    validation_rules JSONB,     -- {"min_length": 2, "pattern": "^[A-Z]+$"}
    options JSONB,              -- Pour select: [{"value": "M", "label": "Masculino"}]
    display_order INTEGER DEFAULT 0,
    condition_type VARCHAR(50),
    condition_value JSONB,
    extraction_path VARCHAR(200), -- "dip.titular.apellidos" pour pre-remplissage OCR
    is_active BOOLEAN DEFAULT true,
    UNIQUE(section_id, field_key)
);
```

---

## 3. ANALYSE CRITIQUE : DEFIS MAJEURS

### 3.1 Complexite Conditionnelle (RISQUE ELEVE)

Le workflow Pasaporte a une logique conditionnelle complexe :

```
is_minor = true
  └─> Affiche: certificado_nacimiento, autorizacion_parental, dip_representante_*
  └─> Masque: DIP titulaire
  └─> Ajoute step: form_review_representantes

solicitud_type = RENOVACION
  └─> Ajoute step: select_motivo
  └─> Ajoute documents: pasaporte_antiguo (selon motivo)

motivo IN (PERDIDA, ROBO)
  └─> Ajoute: denuncia_policial
  └─> Modifie: tarif (penalite)
```

**Probleme** : Cette logique est actuellement dispersee dans :
- `getVisiblePassportSteps()` (frontend)
- `_setup_workflow()` (backend)
- `get_document_requirements()` (backend)
- `form_review_*` conditions (backend)

**Solution requise** : Un `ConditionEvaluator` unifie capable de :
1. Parser des expressions : `is_minor AND solicitud_type = 'RENOVACION'`
2. Evaluer contre le contexte wizard
3. Etre utilise cote backend ET frontend (logique dupliquee ou API)

### 3.2 Sections de Formulaire Variables

Actuellement `step2Fields` est hardcode :
```typescript
const step2Fields = [
  { key: 'nombre_padre', ... },      // Filiation - conditionnel
  { key: 'profesion_padre', ... },   // Filiation - conditionnel
  { key: 'nombre_madre', ... },      // Filiation - conditionnel
  { key: 'profesion_madre', ... },   // Filiation - conditionnel
  { key: 'numero_pasaporte_antiguo', ... }, // Pasaporte anterior - conditionnel
  { key: 'fecha_expedicion_antiguo', ... }, // Pasaporte anterior - conditionnel
  { key: 'fecha_expiracion_antiguo', ... }, // Pasaporte anterior - conditionnel
]
```

**Probleme** : Tous ces champs ne devraient pas s'afficher dans tous les cas.

**Solution** : Config en DB avec conditions :
```json
{
  "sections": [
    {
      "id": "filiacion",
      "title_es": "Filiacion",
      "condition": {"OR": [
        {"solicitud_type": "EXPEDICION"},
        {"is_minor": true}
      ]},
      "fields": [...]
    },
    {
      "id": "pasaporte_anterior",
      "title_es": "Pasaporte Anterior",
      "condition": {"solicitud_type": "RENOVACION"},
      "fields": [...]
    }
  ]
}
```

### 3.3 Mapping OCR → Formulaire

Chaque workflow a un mapping different :
- Pasaporte: `dip.titular.apellidos` → `apellidos`
- Residencia: `pasaporte.titular.apellidos` → `apellidos` (pas DIP!)
- Vehiculo: `permiso_circulacion.vehiculo.matricula` → `matricula`

**Probleme** : Le mapping est specifique a chaque workflow et depend des schemas OCR.

**Solution** : Stocker `extraction_path` par champ dans `workflow_form_fields`.

### 3.4 Multi-Entite et Multi-Phase

- **Residencia** : 3 phases (Stamp → Documents → Nota de Ingreso)
- **Vehiculo** : 3 entites (DGT, OFIVE, ITVE)

**Probleme** : Le wizard generique doit supporter ces variations.

**Solution** : Phase tracking + entity assignment dans le contexte wizard.

---

## 4. BENEFICES POUR LES AUTRES WORKFLOWS

### 4.1 Reutilisation Directe

| Workflow | Benefice | Effort Additionnel |
|----------|----------|-------------------|
| **Vehiculo** | Config DB pour 7 sous-types | 2j (config uniquement) |
| **Conducir** | Config DB pour 5 sous-types | 1j |
| **Residencia** | Config + support multi-phase | 3j |
| **Contrato** | Config simple | 0.5j |
| **Nouveaux workflows** | Pas de code frontend | 0.5j par workflow |

### 4.2 Maintenance Reduite

| Aspect | Avant (Hardcode) | Apres (Generique) |
|--------|------------------|-------------------|
| Ajouter un champ | Modifier .tsx + .py | INSERT en DB |
| Changer condition | Modifier 2-3 fichiers | UPDATE en DB |
| Ajouter workflow | Creer fichier .tsx ~2000 lignes | Config DB uniquement |
| Bug affichage | Debug frontend | Verifier config DB |

### 4.3 Calcul ROI

**Cout initial** : 15-20 jours

**Economies par workflow** :
- Wizard hardcode : ~5-8 jours par workflow
- Wizard generique : ~1-2 jours par workflow (config uniquement)
- Economie : ~4-6 jours par workflow

**Break-even** : 3-4 workflows

**Workflows actuels** : 6+ (pasaporte, residencia, vehiculo, conducir, contrato, verificacion)

**ROI** : (6 workflows × 5 jours economies) - 18 jours = **+12 jours positif**

---

## 5. PLAN D'IMPLEMENTATION RECOMMANDE

### Phase 1 : Fondations (5-6 jours)

1. **Creer tables DB** : `workflow_form_sections`, `workflow_form_fields`
2. **Creer API endpoint** : `GET /workflows/{code}/form-config`
3. **Creer `DynamicFormRenderer.tsx`** : Composant generique
4. **Creer `ConditionEvaluator.ts`** : Evaluation conditions

### Phase 2 : Migration Pasaporte (4-5 jours)

1. **Migrer config Pasaporte** vers DB (sections + champs)
2. **Remplacer `step2Fields` hardcode** par appel API
3. **Tester tous les cas** : adulte/mineur × tous motivos
4. **Garder ancien code en fallback** (feature flag)

### Phase 3 : Extension aux autres workflows (5-7 jours)

1. **Configurer Vehiculo** en DB
2. **Configurer Conducir** en DB
3. **Configurer Residencia** (avec support multi-phase)
4. **Supprimer code legacy** apres validation

### Phase 4 : Optimisations (2-3 jours)

1. **Admin UI** pour gerer les configs (optionnel)
2. **Cache** des configs (Redis)
3. **Logs/Audit** des modifications

---

## 6. ALTERNATIVES A L'OPTION C

### Alternative 1 : Option A (Quick Fix) + Extensions Progressives

**Principe** : Corriger `step2Fields` avec conditions inline, puis etendre au besoin.

```typescript
const step2Fields = useMemo(() => {
  const base = [];
  if (wizardState.solicitudType === 'EXPEDICION' || wizardState.isMinor) {
    base.push({ key: 'nombre_padre', ... }, ...);
  }
  if (wizardState.solicitudType === 'RENOVACION') {
    base.push({ key: 'numero_pasaporte_antiguo', ... }, ...);
  }
  return base;
}, [wizardState]);
```

**Effort** : 1-2 heures pour Pasaporte
**Probleme** : Chaque workflow necessite du code specifique

### Alternative 2 : Backend-Driven avec Conditions Simples

**Principe** : Etendre `pasaporte_workflow_v2.py` pour retourner les sections avec conditions evaluees.

**Avantage** : Pas de changement DB, logique centralisee backend
**Inconvenient** : Frontend doit encore parser les conditions

### Comparaison

| Critere | Option A | Alternative 2 | Option C |
|---------|----------|---------------|----------|
| Effort initial | 2h | 2-3j | 15-20j |
| Maintenabilite | Basse | Moyenne | Haute |
| Reutilisabilite | Nulle | Moyenne | Haute |
| Scalabilite | Mauvaise | Moyenne | Bonne |
| Risque | Tres bas | Bas | Moyen |

---

## 7. RISQUES ET MITIGATIONS

| Risque | Probabilite | Impact | Mitigation |
|--------|-------------|--------|------------|
| Regression Pasaporte | MOYENNE | ELEVE | Feature flag + tests E2E complets |
| Performance (API calls) | BASSE | MOYEN | Cache Redis + memoization |
| Complexite conditions | HAUTE | MOYEN | Limiter a conditions simples d'abord |
| Scope creep | HAUTE | ELEVE | Definition stricte du MVP |
| Resistance au changement | MOYENNE | MOYEN | Documentation + formation |

---

## 8. RECOMMANDATION FINALE

### Pour votre contexte (6+ workflows actifs) :

**JE RECOMMANDE : Option C avec implementation progressive**

**Raisons** :
1. ROI positif des le 4eme workflow
2. Maintenance long-terme simplifiee
3. Nouveaux workflows deployes en heures (pas jours)
4. Coherence UI/UX garantie

### Sequence recommandee :

```
Semaine 1-2 : Phase 1 (Fondations)
   └─> Tables DB + API + DynamicFormRenderer

Semaine 2-3 : Phase 2 (Migration Pasaporte)
   └─> Config DB + remplacement step2Fields
   └─> CORRECTION BUG ACTUEL INCLUSE

Semaine 3-4 : Phase 3 (Extension)
   └─> Vehiculo + Conducir

Post-MVP : Phase 4
   └─> Admin UI + optimisations
```

### Demarrage immediat possible :

Si vous validez cette approche, je peux commencer par :
1. Creer le schema SQL `workflow_form_sections` + `workflow_form_fields`
2. Implementer `DynamicFormRenderer.tsx` minimal
3. Migrer `step2Fields` du Pasaporte comme premier cas d'usage

Cela corrigera le bug actuel tout en posant les fondations du wizard generique.

---

## 9. QUESTIONS POUR DECISION

1. **Budget temps** : Avez-vous 15-20 jours disponibles sur les prochaines semaines ?
2. **Priorite workflows** : Quels workflows autres que Pasaporte sont prioritaires ?
3. **Admin UI** : Voulez-vous une interface admin pour gerer les configs ?
4. **Feature flag** : Acceptez-vous un mode "dual" temporaire (ancien + nouveau) ?

---

*Rapport genere par Claude - Expert Technique*
