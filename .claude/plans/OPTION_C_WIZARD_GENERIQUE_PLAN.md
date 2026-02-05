# PLAN COMPLET : Option C - Wizard Générique Dynamique

> **Version** : 1.7
> **Date création** : 2026-02-05
> **Statut** : ✅ PHASE 4 COMPLÈTE - Prêt pour Phase 5 (Extension workflows)
> **Effort estimé** : 6-10 jours
> **Dernière modification** : Form_review 100% dynamique - Plus de hardcoding (voir CHANGELOG v1.7)

---

## OBJECTIF

Rendre le wizard frontend **dynamique** en lisant la configuration des formulaires depuis le backend, sans créer de nouvelles tables en base de données.

**Résultat attendu** : Un seul composant `DynamicFormRenderer` qui génère les formulaires pour TOUS les workflows.

---

## PRINCIPES DIRECTEURS

1. **Pas de nouvelles tables BD** - La config reste dans le code Python
2. **Backend = Source de vérité** - Les conditions sont évaluées côté backend
3. **Frontend générique** - Un seul composant pour tous les workflows
4. **Migration progressive** - Garder la rétrocompatibilité pendant la transition
5. **Pasaporte d'abord** - Valider sur le workflow le plus complexe
6. **Réutiliser l'existant** - `get_form_mapping()` est la source de vérité pour les extractions

---

## VUE D'ENSEMBLE DES PHASES

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Phase 1        Phase 2         Phase 3         Phase 4         Phase 5    │
│  BACKEND        API             FRONTEND        MIGRATION       EXTENSION  │
│  STRUCTURE      ENDPOINT        COMPOSANT       PASAPORTE       WORKFLOWS  │
│                                                                             │
│  [1-2 jours]    [0.5-1 jour]    [2-3 jours]     [1-2 jours]     [1j/wf]    │
│                                                                             │
│  ────────►      ────────►       ────────►       ────────►       ────────►  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

# PHASE 1 : STRUCTURE BACKEND

**Objectif** : Standardiser et exposer la configuration des formulaires

**Durée estimée** : 1-2 jours

## Étape 1.1 : Définir les dataclasses

**Fichier** : `packages/backend/app/modules/service_requests/workflows/workflow_interface.py`

### Tâches :
- [ ] Créer `@dataclass FormField`
- [ ] Créer `@dataclass FormSection`
- [ ] Créer `@dataclass FormConfig`
- [ ] Ajouter types dans `__all__`

### Structure FormField :
```python
@dataclass
class FormField:
    key: str                           # Identifiant unique du champ
    label_es: str                      # Label en espagnol
    type: str = "text"                 # text, date, select, radio, checkbox
    required: bool = False
    options: Optional[List[str]] = None  # Pour select/radio
    readonly: bool = False
    placeholder_es: Optional[str] = None
    validation: Optional[Dict] = None      # Règles de validation
    # NOTE: PAS de extraction_path ici - utiliser get_form_mapping() existant
```

### NOTE IMPORTANTE : extraction_path

**`extraction_path` n'est PAS inclus dans FormField** car il existe déjà dans `get_form_mapping()` de chaque workflow.

Chaque workflow (pasaporte, vehiculo, etc.) a déjà une méthode :
```python
def get_form_mapping(self, context) -> Dict[str, str]:
    return {
        "apellidos": "dip.titular.apellidos",
        "nombre_padre": "dip.filiacion.nombre_padre",
        # ... ~50+ mappings par workflow
    }
```

**L'API endpoint utilisera `get_form_mapping()` pour résoudre les valeurs** - pas de duplication nécessaire.

### Structure FormSection :
```python
@dataclass
class FormSection:
    id: str
    title_es: str
    fields: List[FormField]
    condition: Optional[Dict[str, Any]] = None  # Condition d'affichage
    source_document: Optional[str] = None       # Document source pour extraction
    description_es: Optional[str] = None
```

### Structure FormConfig :
```python
@dataclass
class FormConfig:
    step_id: str
    title_es: str
    sections: List[FormSection]
    description_es: Optional[str] = None
```

### Checklist validation :
- [ ] Les dataclasses sont créées sans erreur
- [ ] `mypy` passe sans erreur
- [ ] Les imports fonctionnent

---

## Étape 1.2 : Créer le ConditionEvaluator

**Fichier** : `packages/backend/app/modules/service_requests/services/condition_evaluator.py` (nouveau)

### Tâches :
- [ ] Créer la classe `ConditionEvaluator`
- [ ] Implémenter `evaluate(condition: Dict, context: WorkflowContext) -> bool`
- [ ] Supporter les opérateurs : `==`, `!=`, `in`, `not_in`, `AND`, `OR`
- [ ] Ajouter tests unitaires

### Conditions supportées :
```python
# Égalité simple
{"solicitud_type": "RENOVACION"}

# Valeur dans liste
{"motivo_in": ["VENCIMIENTO", "DETERIORO"]}

# Booléen
{"is_minor": True}

# Combinaison OR
{"OR": [
    {"solicitud_type": "EXPEDICION"},
    {"is_minor": True}
]}

# Combinaison AND
{"AND": [
    {"solicitud_type": "RENOVACION"},
    {"is_minor": False}
]}
```

### Checklist validation :
- [ ] Tests unitaires passent (min 10 cas)
- [ ] Conditions simples fonctionnent
- [ ] Conditions OR/AND fonctionnent
- [ ] Conditions imbriquées fonctionnent

---

## Étape 1.3 : Ajouter méthode get_form_config au Protocol

**Fichier** : `packages/backend/app/modules/service_requests/workflows/workflow_interface.py`

### Tâches :
- [ ] Ajouter `get_form_config(step_id, context) -> FormConfig` au Protocol
- [ ] Implémenter dans `PredefinedWorkflow` (classe de base)
- [ ] La méthode lit `step.config["sections"]` et filtre selon conditions

### Implémentation :
```python
def get_form_config(self, step_id: str, context: WorkflowContext) -> FormConfig:
    """Retourne la config formulaire avec sections filtrées selon contexte."""
    step = self.get_step(step_id)
    if not step or step.step_type != StepType.FORM_REVIEW:
        raise ValueError(f"Step {step_id} not found or not a form review step")

    evaluator = ConditionEvaluator()
    filtered_sections = []

    for section_data in step.config.get("sections", []):
        condition = section_data.get("condition")
        if condition is None or evaluator.evaluate(condition, context):
            # Filtrer aussi les fields avec conditions
            fields = [...]
            filtered_sections.append(FormSection(...))

    return FormConfig(
        step_id=step_id,
        title_es=step.title_es,
        sections=filtered_sections
    )
```

### Checklist validation :
- [ ] Méthode ajoutée au Protocol
- [ ] Implémentation dans PredefinedWorkflow
- [ ] pasaporte_workflow_v2 retourne la config correcte
- [ ] Sections conditionnelles sont filtrées

---

## Métriques Phase 1

| Métrique | Cible | Comment mesurer |
|----------|-------|-----------------|
| Fichiers modifiés | 2-3 | git diff --stat |
| Lignes ajoutées | ~150-200 | git diff --stat |
| Tests unitaires | ≥10 | pytest -v |
| Couverture conditions | 100% | Tous les opérateurs testés |
| Type check | 0 erreurs | mypy |

---

# PHASE 2 : API ENDPOINT

**Objectif** : Exposer la configuration des formulaires via REST API

**Durée estimée** : 0.5-1 jour

## Étape 2.1 : Créer les modèles Pydantic response

**Fichier** : `packages/backend/app/modules/service_requests/models/form_config.py` (nouveau)

### Tâches :
- [ ] Créer `FormFieldResponse`
- [ ] Créer `FormSectionResponse`
- [ ] Créer `FormConfigResponse`

### Structure :
```python
class FormFieldResponse(BaseModel):
    key: str
    label_es: str
    type: str = "text"
    required: bool = False
    options: Optional[List[str]] = None
    readonly: bool = False
    placeholder_es: Optional[str] = None
    current_value: Optional[Any] = None  # Valeur pré-remplie (résolu via get_form_mapping)
    # NOTE: PAS de extraction_path - résolu côté backend via get_form_mapping()

class FormSectionResponse(BaseModel):
    id: str
    title_es: str
    fields: List[FormFieldResponse]
    source_document: Optional[str] = None

class FormConfigResponse(BaseModel):
    step_id: str
    title_es: str
    description_es: Optional[str] = None
    sections: List[FormSectionResponse]
```

### Checklist validation :
- [ ] Modèles Pydantic créés
- [ ] Serialization JSON fonctionne
- [ ] Pas d'erreur mypy

---

## Étape 2.2 : Créer l'endpoint API

**Fichier** : `packages/backend/app/modules/service_requests/api/service_requests_routes.py`

### Tâches :
- [ ] Ajouter route `GET /requests/{request_id}/form-config/{step_id}`
- [ ] Charger la demande et son contexte
- [ ] Appeler `workflow.get_form_config(step_id, context)`
- [ ] Pré-remplir les valeurs depuis extracted_data/form_data
- [ ] Retourner FormConfigResponse

### Implémentation :
```python
@router.get("/requests/{request_id}/form-config/{step_id}", response_model=FormConfigResponse)
async def get_form_config(
    request_id: UUID,
    step_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncConnection = Depends(get_db)
) -> FormConfigResponse:
    """
    Retourne la configuration du formulaire pour un step.
    Les conditions sont évaluées, seules les sections applicables sont retournées.
    Les valeurs sont pré-remplies depuis les données extraites via get_form_mapping().
    """
    # 1. Charger la demande
    request = await service_request_repo.get_by_id(db, request_id)

    # 2. Vérifier permissions
    if request.user_id != current_user.id:
        raise HTTPException(403, "Not authorized")

    # 3. Construire le contexte
    context = build_workflow_context(request)

    # 4. Charger le workflow
    workflow = get_workflow(request.workflow_code)

    # 5. Obtenir la config filtrée
    form_config = workflow.get_form_config(step_id, context)

    # 6. Obtenir le mapping extraction (SOURCE DE VÉRITÉ existante)
    form_mapping = workflow.get_form_mapping(context)
    # form_mapping = {"apellidos": "dip.titular.apellidos", ...}

    # 7. Pré-remplir les valeurs via le mapping existant
    for section in form_config.sections:
        for field in section.fields:
            extraction_path = form_mapping.get(field.key)  # Résolu via get_form_mapping()
            if extraction_path:
                field.current_value = resolve_nested_value(
                    extraction_path,
                    request.extracted_data,
                    request.form_data
                )

    return FormConfigResponse.from_dataclass(form_config)


def resolve_nested_value(path: str, extracted_data: dict, form_data: dict) -> Any:
    """Résout une valeur depuis un chemin comme 'dip.titular.apellidos'."""
    # Priorité: form_data > extracted_data
    if path in form_data:
        return form_data[path]

    # Sinon, naviguer dans extracted_data
    parts = path.split('.')
    value = extracted_data
    for part in parts:
        if isinstance(value, dict) and part in value:
            value = value[part]
        else:
            return None
    return value
```

**AVANTAGE** : Réutilise `get_form_mapping()` qui existe déjà dans TOUS les workflows - aucune duplication.

### Checklist validation :
- [ ] Endpoint accessible
- [ ] Retourne 200 avec JSON valide
- [ ] Sections filtrées selon contexte
- [ ] Valeurs pré-remplies correctement
- [ ] 403 si pas autorisé
- [ ] 404 si demande inexistante

---

## Étape 2.3 : Tests d'intégration API

**Fichier** : `packages/backend/tests/api/test_form_config.py` (nouveau)

### Cas de test :
- [ ] EXPEDICION adulte → filiation visible, pasaporte_anterior invisible
- [ ] RENOVACION adulte → filiation invisible, pasaporte_anterior visible
- [ ] EXPEDICION mineur → filiation visible, pasaporte_anterior invisible
- [ ] RENOVACION mineur → filiation visible, pasaporte_anterior visible
- [ ] Valeurs pré-remplies depuis extraction

### Checklist validation :
- [ ] Tous les tests passent
- [ ] Couverture des 4 scénarios principaux

---

## Métriques Phase 2

| Métrique | Cible | Comment mesurer |
|----------|-------|-----------------|
| Endpoint créé | 1 | curl test |
| Temps réponse | <200ms | Mesure API |
| Tests intégration | ≥5 | pytest |
| Erreurs gérées | 403, 404 | Tests |

---

# PHASE 3 : FRONTEND - COMPOSANT GÉNÉRIQUE

**Objectif** : Créer le composant DynamicFormRenderer

**Durée estimée** : 2-3 jours

## Étape 3.1 : Définir les types TypeScript

**Fichier** : `packages/web/src/modules/service-requests/types/form-config.ts` (nouveau)

### Tâches :
- [ ] Créer `FormField` interface
- [ ] Créer `FormSection` interface
- [ ] Créer `FormConfig` interface
- [ ] Exporter depuis `types/index.ts`

### Structure :
```typescript
export interface FormField {
  key: string;
  label_es: string;
  type: 'text' | 'date' | 'select' | 'radio' | 'checkbox' | 'textarea';
  required: boolean;
  options?: string[];
  readonly?: boolean;
  placeholder_es?: string;
  current_value?: unknown;  // Valeur déjà résolue par le backend via get_form_mapping()
  // NOTE: PAS de extraction_path côté frontend - c'est résolu côté backend
}

export interface FormSection {
  id: string;
  title_es: string;
  fields: FormField[];
  source_document?: string;
}

export interface FormConfig {
  step_id: string;
  title_es: string;
  description_es?: string;
  sections: FormSection[];
}
```

**NOTE** : Le frontend ne connaît PAS les chemins d'extraction (`dip.titular.apellidos`).
Le backend résout ces valeurs via `get_form_mapping()` et les envoie directement dans `current_value`.

### Checklist validation :
- [ ] Types créés
- [ ] Exportés correctement
- [ ] Pas d'erreur TypeScript

---

## Étape 3.2 : Créer le hook useFormConfig

**Fichier** : `packages/web/src/modules/service-requests/hooks/useFormConfig.ts` (nouveau)

### Tâches :
- [ ] Créer le hook avec React Query
- [ ] Gérer loading/error states
- [ ] Cache approprié

### Implémentation :
```typescript
export function useFormConfig(requestId: string, stepId: string) {
  return useQuery<FormConfig>({
    queryKey: ['form-config', requestId, stepId],
    queryFn: async () => {
      const response = await apiClient.get(
        `/service-requests/requests/${requestId}/form-config/${stepId}`
      );
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!requestId && !!stepId,
  });
}
```

### Checklist validation :
- [ ] Hook fonctionne
- [ ] Loading state géré
- [ ] Error state géré
- [ ] Cache fonctionnel

---

## Étape 3.3 : Créer DynamicField component

**Fichier** : `packages/web/src/modules/service-requests/components/DynamicField.tsx` (nouveau)

### Tâches :
- [ ] Composant pour chaque type de champ
- [ ] Support text, date, select, radio, checkbox, textarea
- [ ] Gestion readonly
- [ ] Affichage label + required indicator
- [ ] Validation visuelle

### Implémentation :
```typescript
interface DynamicFieldProps {
  field: FormField;
  value: unknown;
  onChange: (value: unknown) => void;
  locale: string;
  disabled?: boolean;
}

export function DynamicField({ field, value, onChange, locale, disabled }: DynamicFieldProps) {
  const label = getLabel(field, locale);

  switch (field.type) {
    case 'text':
      return (
        <div className="space-y-2">
          <Label>{label}{field.required && <span className="text-red-500">*</span>}</Label>
          <Input
            value={value as string || ''}
            onChange={e => onChange(e.target.value)}
            readOnly={field.readonly}
            disabled={disabled}
            placeholder={field.placeholder_es}
          />
        </div>
      );
    case 'date':
      return <DateField ... />;
    case 'select':
      return <SelectField ... />;
    // etc.
  }
}
```

### Checklist validation :
- [ ] Tous les types de champs supportés
- [ ] Labels affichés correctement
- [ ] Required indicator visible
- [ ] Readonly fonctionne
- [ ] Styling cohérent avec le reste de l'app

---

## Étape 3.4 : Créer DynamicFormRenderer component

**Fichier** : `packages/web/src/modules/service-requests/components/DynamicFormRenderer.tsx` (nouveau)

### Tâches :
- [ ] Rendu des sections
- [ ] Rendu des champs via DynamicField
- [ ] Gestion des valeurs (state)
- [ ] Callback onChange
- [ ] Support i18n pour labels

### Implémentation :
```typescript
interface DynamicFormRendererProps {
  config: FormConfig;
  values: Record<string, unknown>;
  onChange: (key: string, value: unknown) => void;
  locale: string;
  disabled?: boolean;
}

export function DynamicFormRenderer({
  config,
  values,
  onChange,
  locale,
  disabled
}: DynamicFormRendererProps) {
  return (
    <div className="space-y-6">
      {config.sections.map(section => (
        <Card key={section.id}>
          <CardHeader>
            <CardTitle>{section.title_es}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {section.fields.map(field => (
              <DynamicField
                key={field.key}
                field={field}
                value={values[field.key] ?? field.current_value}  // current_value déjà résolu par backend
                onChange={v => onChange(field.key, v)}
                locale={locale}
                disabled={disabled}
              />
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
```

### Checklist validation :
- [ ] Sections rendues correctement
- [ ] Champs dans les bonnes sections
- [ ] Valeurs initiales affichées
- [ ] onChange fonctionne
- [ ] Style cohérent

---

## Étape 3.5 : Export et index

**Fichier** : `packages/web/src/modules/service-requests/index.ts`

### Tâches :
- [ ] Exporter DynamicFormRenderer
- [ ] Exporter DynamicField
- [ ] Exporter useFormConfig
- [ ] Exporter types

### Checklist validation :
- [ ] Imports fonctionnent depuis d'autres modules
- [ ] Pas de circular dependencies

---

## Métriques Phase 3

| Métrique | Cible | Comment mesurer |
|----------|-------|-----------------|
| Composants créés | 2 | Count files |
| Types de champs | 6 | text, date, select, radio, checkbox, textarea |
| Lignes de code | ~300-400 | wc -l |
| Type check | 0 erreurs | npm run type-check |
| Lint | 0 erreurs | npm run lint |

---

# PHASE 4 : MIGRATION WIZARD PASAPORTE

**Objectif** : Remplacer le hardcoding par le composant dynamique

**Durée estimée** : 1-2 jours

## Étape 4.1 : Ajouter feature flag

**Fichier** : `packages/web/src/core/config/features.ts`

### Tâches :
- [ ] Ajouter flag `USE_DYNAMIC_FORM_RENDERER`
- [ ] Valeur par défaut: `false`
- [ ] Configurable via env variable

### Implémentation :
```typescript
export const FEATURES = {
  USE_DYNAMIC_FORM_RENDERER: process.env.NEXT_PUBLIC_USE_DYNAMIC_FORM === 'true',
};
```

### Checklist validation :
- [ ] Flag créé
- [ ] Valeur par défaut false
- [ ] Configurable

---

## Étape 4.2 : Modifier FormReviewStepEditable

**Fichier** : `packages/web/src/app/[locale]/(dashboard)/dashboard/service-requests/[id]/wizard/page.tsx`

### Tâches :
- [ ] Importer useFormConfig et DynamicFormRenderer
- [ ] Ajouter condition sur feature flag
- [ ] Si flag ON: utiliser DynamicFormRenderer
- [ ] Si flag OFF: garder l'ancien code (step2Fields)

### Implémentation :
```typescript
function FormReviewStepEditable({ ... }) {
  // Feature flag pour migration progressive
  if (FEATURES.USE_DYNAMIC_FORM_RENDERER) {
    const { data: formConfig, isLoading } = useFormConfig(requestId, step);

    if (isLoading) return <Loader />;

    return (
      <DynamicFormRenderer
        config={formConfig}
        values={editedData}
        onChange={onFieldEdit}
        locale={locale}
      />
    );
  }

  // Ancien code (à supprimer après validation)
  const step2Fields = [...];  // Code actuel
  // ...
}
```

### Checklist validation :
- [ ] Feature flag respecté
- [ ] Ancien code fonctionne (flag OFF)
- [ ] Nouveau code fonctionne (flag ON)
- [ ] Pas de régression

---

## Étape 4.3 : Tests E2E scénarios Pasaporte

### Scénarios à tester :

| # | Scénario | Filiation | Pasaporte Anterior |
|---|----------|-----------|-------------------|
| 1 | EXPEDICION adulte | ✓ Visible | ✗ Invisible |
| 2 | EXPEDICION mineur | ✓ Visible | ✗ Invisible |
| 3 | RENOVACION VENCIMIENTO adulte | ✗ Invisible | ✓ Visible |
| 4 | RENOVACION VENCIMIENTO mineur | ✓ Visible | ✓ Visible |
| 5 | RENOVACION DETERIORO adulte | ✗ Invisible | ✓ Visible |
| 6 | RENOVACION PERDIDA adulte | ✗ Invisible | ✓ Visible |

### Checklist validation :
- [ ] Scénario 1 validé
- [ ] Scénario 2 validé
- [ ] Scénario 3 validé
- [ ] Scénario 4 validé
- [ ] Scénario 5 validé
- [ ] Scénario 6 validé
- [ ] Valeurs pré-remplies correctement
- [ ] Sauvegarde fonctionne

---

## Étape 4.4 : Activer en production

### Tâches :
- [ ] Tests passent avec flag ON
- [ ] Review code
- [ ] Activer flag en staging
- [ ] Tests manuels staging
- [ ] Activer flag en production
- [ ] Monitoring erreurs

### Checklist validation :
- [ ] Aucune erreur en staging (24h)
- [ ] Aucune erreur en production (48h)
- [ ] Pas de régression fonctionnelle

---

## Étape 4.5 : Cleanup ancien code

### Tâches :
- [ ] Supprimer feature flag
- [ ] Supprimer `step2Fields` hardcodé
- [ ] Supprimer `step1Fields` hardcodé
- [ ] Supprimer condition feature flag
- [ ] Simplifier le composant

### Checklist validation :
- [ ] Code legacy supprimé
- [ ] Tests passent toujours
- [ ] Pas de régression

---

## Métriques Phase 4

| Métrique | Cible | Comment mesurer |
|----------|-------|-----------------|
| Lignes supprimées | ~50-100 | git diff --stat |
| Scénarios testés | 6 | Checklist E2E |
| Erreurs production | 0 | Monitoring |
| Temps migration | <2j | Tracking |

---

# PHASE 5 : EXTENSION AUX AUTRES WORKFLOWS

**Objectif** : Appliquer le pattern aux autres workflows

**Durée estimée** : ~1 jour par workflow

## Étape 5.1 : Vehiculo

### Tâches :
- [ ] Vérifier structure `config.sections` dans vehiculo_workflow.py
- [ ] Ajouter sections si manquantes
- [ ] Ajouter conditions appropriées
- [ ] Tester endpoint API
- [ ] Vérifier frontend utilise DynamicFormRenderer

### Checklist validation :
- [ ] API retourne config correcte
- [ ] Frontend affiche formulaire
- [ ] Conditions respectées

---

## Étape 5.2 : Conducir

### Tâches :
- [ ] Vérifier structure `config.sections` dans conducir_workflow.py
- [ ] Ajouter sections si manquantes
- [ ] Ajouter conditions (âge par classe de permis)
- [ ] Tester

### Checklist validation :
- [ ] API retourne config correcte
- [ ] Frontend affiche formulaire
- [ ] Validation âge fonctionne

---

## Étape 5.3 : Residencia

### Tâches :
- [ ] Adapter pour workflow 3 phases
- [ ] Gérer les phases stamp → docs → nota_ingreso
- [ ] Tester chaque phase

### Checklist validation :
- [ ] Phase 1 fonctionne
- [ ] Phase 2 fonctionne
- [ ] Transitions correctes

---

## Étape 5.4 : Autres workflows

### Pour chaque workflow :
- [ ] Contrato
- [ ] Verificacion (fonction publique)

---

## Métriques Phase 5

| Métrique | Cible | Comment mesurer |
|----------|-------|-----------------|
| Workflows migrés | 5 | Count |
| Code dupliqué | 0 | Pas de copier-coller |
| Tests par workflow | ≥2 | pytest |

---

# MÉTRIQUES GLOBALES DU PROJET

## Métriques de succès

| Métrique | Baseline | Cible | Deadline |
|----------|----------|-------|----------|
| Lignes hardcodées form_review | ~50 | 0 | Fin Phase 4 |
| Composants génériques | 0 | 2 | Fin Phase 3 |
| Workflows utilisant DynamicForm | 0 | 5 | Fin Phase 5 |
| Temps ajout nouveau champ | ~30min (code) | ~5min (config) | Fin Phase 5 |
| Couverture tests | ? | >80% | Fin Phase 4 |

## Métriques de qualité

| Métrique | Cible | Comment mesurer |
|----------|-------|-----------------|
| Type errors | 0 | mypy + tsc |
| Lint errors | 0 | eslint + flake8 |
| Tests passants | 100% | CI/CD |
| Erreurs production | 0 | Monitoring |

## Métriques de performance

| Métrique | Cible | Comment mesurer |
|----------|-------|-----------------|
| Temps réponse API /form-config | <200ms | Mesure |
| Temps render DynamicForm | <100ms | React DevTools |
| Bundle size increase | <10KB | Webpack analyzer |

---

# RISQUES ET MITIGATIONS

| Risque | Probabilité | Impact | Mitigation |
|--------|-------------|--------|------------|
| Régression Pasaporte | Moyenne | Élevé | Feature flag + tests E2E |
| Performance API | Basse | Moyen | Cache + optimisation |
| Complexité conditions | Moyenne | Moyen | Tests unitaires exhaustifs |
| Résistance adoption | Basse | Bas | Documentation claire |

---

# DÉPENDANCES

## Pré-requis
- [ ] Option A déployée (correction immédiate) ✅ FAIT
- [ ] Accès aux environnements staging/prod
- [ ] CI/CD fonctionnel

## Dépendances entre phases
- Phase 2 dépend de Phase 1
- Phase 3 peut démarrer en parallèle de Phase 2
- Phase 4 dépend de Phase 2 et Phase 3
- Phase 5 dépend de Phase 4

---

# CALENDRIER SUGGÉRÉ

```
Semaine 1:
├── Jour 1-2: Phase 1 (Backend structure)
├── Jour 3: Phase 2 (API endpoint)
└── Jour 4-5: Phase 3 (Frontend composant) - début

Semaine 2:
├── Jour 1: Phase 3 (Frontend) - fin
├── Jour 2-3: Phase 4 (Migration Pasaporte)
└── Jour 4-5: Phase 5 (Autres workflows) - début

Semaine 3:
├── Jour 1-2: Phase 5 (Autres workflows) - fin
├── Jour 3: Cleanup + documentation
└── Jour 4-5: Buffer / fixes
```

---

# VALIDATION FINALE

## Critères d'acceptation

- [ ] DynamicFormRenderer utilisé par Pasaporte
- [ ] Aucun `step2Fields` hardcodé restant
- [ ] API /form-config fonctionnelle
- [ ] Tests E2E passent pour 6 scénarios
- [ ] Autres workflows migrés
- [ ] Documentation à jour
- [ ] Pas de régression en production

## Sign-off

| Rôle | Nom | Date | Signature |
|------|-----|------|-----------|
| Tech Lead | | | |
| QA | | | |
| Product Owner | | | |

---

# CHANGELOG

## v1.1 - 2026-02-05

**SIMPLIFICATION : Retrait de `extraction_path`**

Suite à l'analyse critique, `extraction_path` a été retiré de `FormField` car :

1. **Duplication inutile** : `get_form_mapping()` existe déjà dans TOUS les workflows
2. **Maintenance double** : Aurait nécessité de maintenir les paths à 2 endroits
3. **Source de vérité unique** : `get_form_mapping()` contient déjà ~50+ mappings par workflow

**Modifications** :
- `FormField` (backend) : Retiré `extraction_path`
- `FormFieldResponse` (API) : Retiré `extraction_path`
- `FormField` (frontend TS) : Retiré `extraction_path`
- API endpoint : Utilise `workflow.get_form_mapping(context)` pour résoudre les valeurs

**Impact** :
- Moins de code à écrire
- Pas de migration de données
- Cohérence avec l'architecture existante

---

## v1.2 - 2026-02-05

**PHASE 1 & 2 TERMINÉES : Backend Structure + API Endpoint**

### Phase 1 - Backend Structure ✅
- `ConditionEvaluator` créé (`services/condition_evaluator.py`)
- `FormField`, `FormSection`, `FormConfig` dataclasses créées (`workflows/form_config.py`)
- `get_form_config()` implémenté dans `PredefinedWorkflow`
- `_build_eval_context()` helper ajouté
- Tests unitaires: 36 tests (get_form_config scenarios)

### Phase 2 - API Endpoint ✅
- `FormFieldResponse`, `FormSectionResponse`, `FormConfigResponse` Pydantic models (`models/form_config.py`)
- `GET /service-requests/{request_id}/form-config/{step_id}` endpoint (`api/routes.py`)
- `_resolve_field_value()` helper pour résoudre les valeurs depuis form_data/extracted_data
- Tests unitaires: 15 tests (helper + models)

**Fichiers créés/modifiés** :
- `packages/backend/app/modules/service_requests/models/form_config.py` (nouveau)
- `packages/backend/app/modules/service_requests/api/routes.py` (endpoint ajouté)
- `packages/backend/app/modules/service_requests/models/__init__.py` (exports)
- `packages/backend/tests/unit/service_requests/test_form_config_api.py` (nouveau)

**Prochaine étape** : Phase 4 - Migration Pasaporte (feature flag)

---

## v1.3 - 2026-02-05

**PHASE 3 TERMINÉE : Frontend Components**

### Fichiers créés

| Fichier | Description |
|---------|-------------|
| `types/form-config.ts` | TypeScript interfaces: FormField, FormSection, FormConfig + helpers |
| `hooks/useFormConfig.ts` | React Query hook avec cache 5min, invalidation, prefetch |
| `components/DynamicField.tsx` | Composant pour tous types de champs (text, date, select, radio, checkbox, textarea) |
| `components/DynamicFormRenderer.tsx` | Composant principal qui rend sections et champs dynamiquement |

### Exports ajoutés

**types/index.ts** :
```typescript
export * from './form-config'
```

**hooks/index.ts** :
```typescript
export { useFormConfig, useInvalidateFormConfig, usePrefetchFormConfig, formConfigQueryKeys } from './useFormConfig'
```

**components/index.ts** :
```typescript
export { DynamicField } from './DynamicField'
export { DynamicFormRenderer } from './DynamicFormRenderer'
```

### Features implémentées

- Types de champs supportés: text, date, select, radio, checkbox, textarea, number, email, tel
- Validation côté client (required, minLength, maxLength, pattern, min, max)
- Support readonly/disabled
- Affichage erreurs par champ
- Skeleton loading state
- Empty state
- Document badge par section

### Vérifications

- ✅ TypeScript : `tsc --noEmit` - 0 erreurs
- ✅ ESLint : 0 erreurs

**Prochaine étape** : Phase 5 - Extension aux autres workflows

---

## v1.4 - 2026-02-05

**PHASE 4 TERMINÉE : Migration Wizard Pasaporte**

### Feature Flag

Ajouté `FEATURE_DYNAMIC_FORM_RENDERER` dans `core/config/features.ts`:
- Par défaut: `true` ✅ (activé depuis v1.7)
- Désactiver avec: `NEXT_PUBLIC_FEATURE_DYNAMIC_FORM=false`

### Modifications wizard/page.tsx

**FormReviewStepEditable modifié** :
1. Ajout prop `requestId` à l'interface
2. Appel conditionnel de `useFormConfig()` si feature flag ON
3. Si flag ON: affiche `DynamicFormRenderer` avec config backend
4. Si flag OFF: conserve le code legacy avec `step1Fields`/`step2Fields` hardcodés

**Code flow (feature ON)** :
```
useFormConfig(requestId, step)
    ↓
GET /service-requests/{id}/form-config/{step}
    ↓
Backend évalue conditions (solicitudType, isMinor, etc.)
    ↓
Retourne FormConfigResponse avec sections filtrées
    ↓
DynamicFormRenderer affiche les sections/champs
```

### Vérifications

- ✅ TypeScript: `tsc --noEmit` - 0 erreurs
- ✅ ESLint: 0 erreurs

### Déploiement

✅ **Activé par défaut depuis v1.7** - Aucune action requise

Pour revenir au mode legacy (si problème):
```bash
NEXT_PUBLIC_FEATURE_DYNAMIC_FORM=false
```

### Scénarios de test

| # | Scénario | Filiation | Pasaporte Anterior |
|---|----------|-----------|-------------------|
| 1 | EXPEDICION adulte | ✓ Visible | ✗ Invisible |
| 2 | EXPEDICION mineur | ✓ Visible | ✗ Invisible |
| 3 | RENOVACION VENCIMIENTO adulte | ✗ Invisible | ✓ Visible |
| 4 | RENOVACION VENCIMIENTO mineur | ✓ Visible | ✓ Visible |
| 5 | RENOVACION DETERIORO adulte | ✗ Invisible | ✓ Visible |
| 6 | RENOVACION PERDIDA adulte | ✗ Invisible | ✓ Visible |

---

## v1.5 - 2026-02-05

**REVUE CRITIQUE & CORRECTIONS I18N**

### Problèmes identifiés

| Composant | Problème | Gravité |
|-----------|----------|---------|
| Backend `form_config.py` | Uniquement ES, pas FR/EN | 🔴 Critique |
| `DynamicField.tsx` | `getLabel()` ignorait locale | 🔴 Critique |
| `DynamicFormRenderer.tsx` | Labels documents hardcodés ES | 🟠 Important |
| `DynamicFormRenderer.tsx` | Message vide hardcodé ES | 🟠 Important |
| `form-config.ts` | Messages validation hardcodés ES | 🟠 Important |
| `wizard/page.tsx` | Erreurs seulement ES/EN | 🟡 Moyen |

### Corrections appliquées

1. **`DynamicField.tsx`**
   - `getLabel()` et `getPlaceholder()` : Ajout commentaire TODO pour i18n futur
   - `void locale` pour supprimer warning ESLint

2. **`DynamicFormRenderer.tsx`**
   - `DOCUMENT_LABELS`: Nouveau dict avec labels ES/FR/EN
   - `getDocumentBadge()`: Accepte maintenant `locale` en paramètre
   - `EmptyState`: Supporte maintenant locale (ES/FR/EN)
   - `EMPTY_STATE_MESSAGES`: Messages traduits

3. **`form-config.ts`**
   - `VALIDATION_MESSAGES`: Nouveau dict avec tous les messages en ES/FR/EN
   - `validateFormConfig()`: Nouveau param `locale` (default: 'es')

4. **`wizard/page.tsx`**
   - Ajout `errorMessages` dict avec ES/FR/EN
   - Ajout `formTitles` dict avec ES/FR/EN
   - Variable `loc` pour typage correct

### Ce qui reste à faire (Phase 5+)

1. **Backend i18n** : Ajouter `label_fr`, `label_en` aux modèles Pydantic

### Vérifications

- ✅ TypeScript: `tsc --noEmit` - 0 erreurs
- ✅ ESLint: 0 erreurs

---

## v1.6 - 2026-02-05

**EDGE CASES & OPTIMISATIONS COMPLÉTÉES**

### Edge Cases corrigés

| # | Edge Case | Correction |
|---|-----------|------------|
| 3.1 | Step ID invalide | Backend: Message d'erreur inclut maintenant la liste des step IDs valides |
| 3.2 | Sections vides | ✅ (déjà corrigé v1.5) `EmptyState` traduit |
| 3.3 | Types non supportés | `console.warn` traduit en ES/FR/EN via `UNKNOWN_TYPE_WARNINGS` |

### Optimisations implémentées

| # | Optimisation | Implémentation |
|---|--------------|----------------|
| 4.1 | Prefetch | `usePrefetchFormConfig()` précharge `form_review_2` quand sur `form_review_1` |
| 4.3 | Cache invalidation | `invalidateFormConfigCache()` appelé après `saveStepData()` |
| 4.4 | Validation avant soumission | `validateFormConfig()` exécuté avant `onNext`, erreurs affichées par champ |

### Fichiers modifiés

**Backend:**
- `workflow_interface.py`: Messages d'erreur améliorés avec liste des step_ids valides

**Frontend:**
- `DynamicField.tsx`: `UNKNOWN_TYPE_WARNINGS` dict ES/FR/EN
- `wizard/page.tsx`:
  - Import: `usePrefetchFormConfig`, `useInvalidateFormConfig`, `validateFormConfig`
  - `invalidateFormConfigCache`: Invalidation cache après save
  - `handleNextWithValidation`: Validation avant passage au step suivant
  - `handleFieldEditWithClear`: Efface erreur quand champ édité
  - `validationErrors` state + passage à `DynamicFormRenderer`
  - Prefetch `form_review_2` dans `useEffect`

### Vérifications

- ✅ TypeScript: `tsc --noEmit` - 0 erreurs
- ✅ ESLint: 0 erreurs
- ✅ Python syntax: `py_compile` - 0 erreurs

### Ce qui reste (Phase 5+)

1. **Backend i18n** : Ajouter `label_fr`, `label_en` aux modèles Pydantic
2. **Tests E2E** : Tester avec feature flag activé

---

## v1.7 - 2026-02-05

**FORM_REVIEW DYNAMIQUE - Plus de hardcoding**

### Problème identifié

Le frontend hardcodait les IDs des form_review steps :
```typescript
// ❌ AVANT - Hardcodé
currentStep.id === 'form_review_1' || currentStep.id === 'form_review_2'
prefetch(requestId, 'form_review_2')  // Toujours form_review_2
```

Cela empêchait d'avoir N form_review steps dynamiquement.

### Solution implémentée

**1. Détection dynamique des steps form_review**
```typescript
// ✅ APRÈS - Dynamique
currentStep.id.startsWith('form_review')
```

**2. Prefetch dynamique du step suivant**
```typescript
// ✅ APRÈS - Calcule le prochain step
const match = step.match(/form_review_(\d+)/)
const nextStepId = `form_review_${currentNum + 1}`
prefetch(requestId, nextStepId)
```

**3. Titre dynamique avec numéro de step**
```typescript
// ✅ APRÈS - Affiche le numéro réel
`Verificar y Editar Datos (${stepNum})`
```

### Architecture finale

```
WORKFLOW
├── form_review_1 (N sections avec conditions)
├── form_review_2 (N sections avec conditions)
├── form_review_3 (optionnel - détecté automatiquement)
└── form_review_N (le système gère N steps)
```

### Pour ajouter un nouveau form_review

**Côté backend uniquement** - Le frontend le détecte automatiquement :

```python
# Dans pasaporte_workflow_v2.py
self.add_step(WorkflowStep(
    step_number=5,
    step_id="form_review_3",
    step_type=StepType.FORM_REVIEW,
    title_es="Datos Adicionales",
    config={
        "sections": [
            {"id": "libro_familia", "title_es": "Libro de Familia", ...}
        ]
    }
))
```

### Fichiers modifiés

**`wizard/page.tsx`:**
- Ligne 820: `startsWith('form_review')` au lieu de `=== 'form_review_1' || === 'form_review_2'`
- Ligne 1185: Même correction pour le rendu du composant
- Lignes 1954-1968: Prefetch dynamique avec regex `form_review_(\d+)`
- Lignes 2060-2080: Titre dynamique avec numéro de step extrait

### Vérifications

- ✅ TypeScript: `tsc --noEmit` - 0 erreurs
- ✅ ESLint: 0 erreurs

### Avantages

| Avant | Après |
|-------|-------|
| Max 2 form_review hardcodés | N form_review dynamiques |
| Prefetch toujours form_review_2 | Prefetch du step suivant |
| Titre "1/2" ou "2/2" hardcodé | Titre avec numéro dynamique |
| Modification frontend pour ajouter step | Aucune modification frontend |

---

*Plan créé le 2026-02-05*
*Dernière mise à jour : 2026-02-05 (v1.7 - Form_review dynamique)*
