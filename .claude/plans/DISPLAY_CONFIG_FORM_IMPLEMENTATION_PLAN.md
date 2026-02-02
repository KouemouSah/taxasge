# Plan d'Implémentation: DisplayConfigForm Refactoring

**Date**: 2026-02-02
**Version**: 1.0
**Statut**: ✅ IMPLÉMENTATION COMPLÈTE
**Durée estimée**: 2-3 heures

---

## Objectif

Refactoriser `DisplayConfigForm.tsx` pour:
1. Remplacer l'Input texte par un Select dropdown de workflow codes
2. Charger dynamiquement les colonnes extraites au changement de workflow
3. Afficher un preview avec données réelles (sample request)
4. Supporter les modes create/edit

---

## Pré-requis Validés ✅

| Élément | Statut | Notes |
|---------|--------|-------|
| Endpoint `GET /menu-config/workflows` | ✅ | Retourne 34 workflows actifs |
| Endpoint `GET /menu-config/display-configs/available-columns/{code}` | ✅ | Exact match |
| Endpoint `GET /menu-config/display-configs/sample-request/{code}` | ✅ | Retourne sample ou null |
| Hook `useWorkflowCodesGrouped()` | ✅ | Créé et exporté |
| Hook `useSampleRequest()` | ✅ | Créé et exporté |
| Composant `Select` de shadcn/ui | ✅ | Disponible |

---

## Phase 1: Préparation et Imports

### Objectif
Ajouter les imports nécessaires et préparer la structure.

### Étapes

#### 1.1 Ajouter les imports manquants

**Fichier**: `packages/web/src/modules/admin/components/DisplayConfigForm.tsx`

```typescript
// Ajouter aux imports existants
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// Modifier l'import des hooks
import {
  useAllAvailableColumns,
  useWorkflowCodesGrouped,  // AJOUTER
  useSampleRequest,         // AJOUTER
  FALLBACK_SYSTEM_COLUMNS,
  AVAILABLE_SECTIONS,
  DEFAULT_SELECTED_COLUMNS,
} from '@/modules/admin/hooks';
```

#### 1.2 Ajouter l'icône Database pour les sections

```typescript
import {
  // ... imports existants
  Database,  // AJOUTER pour l'icône workflow
} from 'lucide-react';
```

### Checklist Phase 1 ✅
- [x] Import `Select` components de shadcn/ui
- [x] Import `useWorkflowCodesGrouped` du hook
- [x] Import `useSampleRequest` du hook
- [x] Import icône `Database`
- [x] Vérifier que TypeScript compile sans erreur

---

## Phase 2: Refactoring de l'État et Hooks

### Objectif
Remplacer la logique de pattern par la sélection de workflow code exact.

### Étapes

#### 2.1 Modifier les props du composant

```typescript
export interface DisplayConfigFormProps {
  initialData?: DisplayConfigFormData;
  // SUPPRIMER: patternEditable?: boolean;
  onSubmit: (data: DisplayConfigFormData) => Promise<void>;
  onDirtyChange?: (isDirty: boolean) => void;
  isSubmitting?: boolean;
  mode?: 'create' | 'edit';
}
```

#### 2.2 Modifier l'état local

```typescript
// AVANT
const [pattern, setPattern] = useState(initialData?.workflow_code ?? '');

// APRÈS
const [selectedWorkflow, setSelectedWorkflow] = useState<string>(
  initialData?.workflow_code ?? ''
);
```

#### 2.3 Ajouter les hooks pour workflows et sample

```typescript
// Après les hooks existants (sensors, etc.)

// Hook pour la liste des workflows (dropdown)
const {
  grouped: workflowGroups,
  categories: workflowCategories,
  isLoading: workflowsLoading,
  isError: workflowsError,
} = useWorkflowCodesGrouped();

// Hook pour le sample request (preview avec données réelles)
const {
  data: sampleRequest,
  isLoading: sampleLoading,
} = useSampleRequest(selectedWorkflow || undefined);
```

#### 2.4 Modifier le hook useAllAvailableColumns

```typescript
// AVANT
const shouldFetchColumns = !!pattern && pattern.length >= 3;
const { systemColumns, extractedColumns, totalRequests, isLoading: isLoadingColumns } =
  useAllAvailableColumns(pattern, shouldFetchColumns);

// APRÈS
const shouldFetchColumns = !!selectedWorkflow && selectedWorkflow.length > 0;
const {
  systemColumns,
  extractedColumns,
  totalRequests,
  isLoading: isLoadingColumns,
} = useAllAvailableColumns(selectedWorkflow, shouldFetchColumns);
```

#### 2.5 Modifier le handler de changement de workflow

```typescript
// Ajouter cette fonction
const handleWorkflowChange = (workflowCode: string) => {
  setSelectedWorkflow(workflowCode);
  // Reset les colonnes sélectionnées aux defaults quand on change de workflow
  if (mode === 'create') {
    setSelectedColumns([...DEFAULT_SELECTED_COLUMNS]);
  }
};
```

#### 2.6 Modifier le useEffect pour initialData

```typescript
useEffect(() => {
  if (initialData) {
    setSelectedWorkflow(initialData.workflow_code);  // MODIFIER
    setSelectedColumns(initialData.list_columns);
    setSelectedSections(initialData.preview_sections);
    setIsDirty(false);
  }
}, [initialData]);
```

#### 2.7 Modifier le tracking dirty state

```typescript
useEffect(() => {
  if (!initialData) {
    setIsDirty(selectedWorkflow.length > 0);  // MODIFIER
  } else {
    const workflowChanged = selectedWorkflow !== initialData.workflow_code;  // AJOUTER
    const columnsChanged =
      JSON.stringify(selectedColumns) !== JSON.stringify(initialData.list_columns);
    const sectionsChanged =
      JSON.stringify(selectedSections) !== JSON.stringify(initialData.preview_sections);
    setIsDirty(workflowChanged || columnsChanged || sectionsChanged);  // MODIFIER
  }
}, [selectedWorkflow, selectedColumns, selectedSections, initialData]);  // MODIFIER deps
```

#### 2.8 Modifier handleSubmit

```typescript
const handleSubmit = async () => {
  await onSubmit({
    workflow_code: selectedWorkflow,  // MODIFIER
    list_columns: selectedColumns,
    preview_sections: selectedSections,
  });
};
```

#### 2.9 Modifier la validation

```typescript
// AVANT
const isValid = pattern.length >= 3 && selectedColumns.length > 0;

// APRÈS
const isValid = selectedWorkflow.length > 0 && selectedColumns.length > 0;
```

### Checklist Phase 2
- [ ] Props `patternEditable` supprimée
- [ ] État `pattern` renommé en `selectedWorkflow`
- [ ] Hook `useWorkflowCodesGrouped` connecté
- [ ] Hook `useSampleRequest` connecté
- [ ] Hook `useAllAvailableColumns` utilise `selectedWorkflow`
- [ ] Handler `handleWorkflowChange` créé
- [ ] useEffect initialData mis à jour
- [ ] useEffect dirty state mis à jour
- [ ] handleSubmit utilise `selectedWorkflow`
- [ ] Validation mise à jour
- [ ] TypeScript compile sans erreur

---

## Phase 3: Refactoring du JSX - Section Workflow

### Objectif
Remplacer l'Input texte par un Select groupé par catégorie.

### Étapes

#### 3.1 Remplacer la Card "Pattern Input"

```tsx
{/* SUPPRIMER tout le bloc patternEditable && (...) */}

{/* NOUVEAU: Workflow Selection - visible uniquement en mode create */}
{mode === 'create' && (
  <Card>
    <CardHeader className="pb-3">
      <CardTitle className="text-base flex items-center gap-2">
        <Database className="h-4 w-4" />
        {t('workflowCode')}
      </CardTitle>
      <CardDescription>{t('workflowCodeDescription')}</CardDescription>
    </CardHeader>
    <CardContent>
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <Select
            value={selectedWorkflow}
            onValueChange={handleWorkflowChange}
            disabled={workflowsLoading}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder={t('selectWorkflow')} />
            </SelectTrigger>
            <SelectContent className="max-h-[300px]">
              {workflowCategories.map((category) => (
                <SelectGroup key={category}>
                  <SelectLabel className="text-xs font-semibold text-muted-foreground uppercase">
                    {category}
                  </SelectLabel>
                  {workflowGroups[category]?.map((wf) => (
                    <SelectItem key={wf.code} value={wf.code}>
                      <span className="font-medium">{wf.name_es}</span>
                      <span className="ml-2 text-xs text-muted-foreground">
                        ({wf.code})
                      </span>
                    </SelectItem>
                  ))}
                </SelectGroup>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Indicateur de chargement / résultat */}
        {selectedWorkflow && (
          <div className="text-sm text-muted-foreground whitespace-nowrap">
            {isLoadingColumns ? (
              <span className="flex items-center gap-1">
                <Loader2 className="h-3 w-3 animate-spin" />
                {t('loadingColumns')}
              </span>
            ) : (
              <span>
                {totalRequests > 0
                  ? t('requestsFound', { count: totalRequests })
                  : t('noRequestsFound')}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Message d'erreur si chargement workflows échoue */}
      {workflowsError && (
        <p className="text-sm text-destructive mt-2">
          {t('workflowLoadError')}
        </p>
      )}
    </CardContent>
  </Card>
)}

{/* Mode edit: Afficher le workflow en lecture seule */}
{mode === 'edit' && initialData && (
  <Card>
    <CardHeader className="pb-3">
      <CardTitle className="text-base flex items-center gap-2">
        <Database className="h-4 w-4" />
        {t('workflowCode')}
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className="flex items-center gap-2">
        <Badge variant="secondary" className="font-mono text-sm">
          {initialData.workflow_code}
        </Badge>
        <span className="text-sm text-muted-foreground">
          ({t('readOnly')})
        </span>
      </div>
    </CardContent>
  </Card>
)}
```

### Checklist Phase 3
- [ ] Ancien bloc Input supprimé
- [ ] Nouveau Select avec groupes par catégorie
- [ ] Mode create: Select visible et éditable
- [ ] Mode edit: Workflow affiché en lecture seule (Badge)
- [ ] Indicateur de chargement workflows
- [ ] Indicateur de nombre de demandes trouvées
- [ ] Gestion erreur chargement workflows
- [ ] TypeScript compile sans erreur

---

## Phase 4: Preview avec Données Réelles

### Objectif
Remplacer les données mockées par les données réelles du sample request.

### Étapes

#### 4.1 Créer une fonction helper pour extraire les valeurs

```typescript
// Ajouter après les constantes existantes

/**
 * Extract value from sample request data
 * Checks both form_data and extracted_data
 */
function getSampleValue(
  sampleRequest: SampleRequest | null | undefined,
  fieldId: string
): string | null {
  if (!sampleRequest) return null;

  // Check form_data first
  if (sampleRequest.form_data && fieldId in sampleRequest.form_data) {
    const value = sampleRequest.form_data[fieldId];
    if (value !== null && value !== undefined) {
      return String(value);
    }
  }

  // Then check extracted_data
  if (sampleRequest.extracted_data && fieldId in sampleRequest.extracted_data) {
    const value = sampleRequest.extracted_data[fieldId];
    if (value !== null && value !== undefined) {
      return String(value);
    }
  }

  return null;
}

// Type pour SampleRequest (import ou définir)
interface SampleRequest {
  id: string;
  reference: string;
  citizen_name: string | null;
  workflow_code: string;
  status: string;
  priority: string | null;
  extracted_data: Record<string, unknown> | null;
  form_data: Record<string, unknown> | null;
  created_at: string;
}
```

#### 4.2 Modifier la section Preview - Info

```tsx
{/* Info Section Preview */}
{selectedSections.includes('info') && (
  <div className="p-3">
    <div className="flex items-center gap-2 mb-2">
      <FileText className="h-4 w-4 text-primary" />
      <span className="text-sm font-medium">
        {t('sections.info', { defaultValue: 'Información General' })}
      </span>
    </div>
    <div className="grid grid-cols-2 gap-2 text-xs">
      <div>
        <span className="text-muted-foreground">Référence:</span>
        <span className="ml-1 font-medium">
          {sampleRequest?.reference || 'REF-XXXX-XXXXX'}
        </span>
      </div>
      <div>
        <span className="text-muted-foreground">Priorité:</span>
        <Badge className="ml-1 text-[10px] bg-blue-100 text-blue-700">
          {sampleRequest?.priority || 'Normal'}
        </Badge>
      </div>
      <div>
        <span className="text-muted-foreground">Statut:</span>
        <span className="ml-1">{sampleRequest?.status || '—'}</span>
      </div>
      <div>
        <span className="text-muted-foreground">Workflow:</span>
        <span className="ml-1 text-xs font-mono">
          {sampleRequest?.workflow_code || selectedWorkflow || '—'}
        </span>
      </div>
    </div>
  </div>
)}
```

#### 4.3 Modifier la section Preview - Extracted Data

```tsx
{/* Extracted Data Section Preview */}
{selectedSections.includes('extractedData') && (
  <div className="p-3">
    <div className="flex items-center gap-2 mb-2">
      <User className="h-4 w-4 text-primary" />
      <span className="text-sm font-medium">
        {t('sections.extractedData', { defaultValue: 'Datos Extraídos' })}
      </span>
      <Badge variant="secondary" className="text-[10px]">
        {selectedExtractedColumns.length}
      </Badge>
      {sampleLoading && (
        <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
      )}
    </div>
    {selectedExtractedColumns.length > 0 ? (
      <div className="grid grid-cols-2 gap-2 text-xs">
        {selectedExtractedColumns.slice(0, 8).map((col) => {
          const value = getSampleValue(sampleRequest, col);
          return (
            <div key={col}>
              <span className="text-muted-foreground">{getColumnLabel(col)}:</span>
              <span className="ml-1 font-medium">
                {value || '—'}
              </span>
            </div>
          );
        })}
        {selectedExtractedColumns.length > 8 && (
          <div className="col-span-2 text-muted-foreground italic">
            +{selectedExtractedColumns.length - 8} más...
          </div>
        )}
      </div>
    ) : (
      <p className="text-xs text-amber-600 italic">
        ⚠️ {t('noExtractedColumnsSelected', { defaultValue: 'Aucune colonne extraite sélectionnée' })}
      </p>
    )}
  </div>
)}
```

#### 4.4 Modifier la section Preview - Contact

```tsx
{/* Contact Section Preview */}
{selectedSections.includes('contact') && (
  <div className="p-3">
    <div className="flex items-center gap-2 mb-2">
      <Phone className="h-4 w-4 text-primary" />
      <span className="text-sm font-medium">
        {t('sections.contact', { defaultValue: 'Contacto' })}
      </span>
    </div>
    <div className="text-xs space-y-1">
      <div>
        <span className="text-muted-foreground">Email:</span>
        <span className="ml-1">
          {getSampleValue(sampleRequest, 'email') ||
           getSampleValue(sampleRequest, 'correo') ||
           '—'}
        </span>
      </div>
      <div>
        <span className="text-muted-foreground">Teléfono:</span>
        <span className="ml-1">
          {getSampleValue(sampleRequest, 'telefono') ||
           getSampleValue(sampleRequest, 'phone') ||
           '—'}
        </span>
      </div>
      {sampleRequest?.citizen_name && (
        <div>
          <span className="text-muted-foreground">Ciudadano:</span>
          <span className="ml-1">{sampleRequest.citizen_name}</span>
        </div>
      )}
    </div>
  </div>
)}
```

#### 4.5 Ajouter indicateur "données réelles" ou "aperçu"

```tsx
{/* Preview Card Header - Modifier */}
<CardHeader className="pb-3">
  <CardTitle className="text-base flex items-center gap-2">
    <Eye className="h-4 w-4" />
    {t('preview')}
    {sampleRequest && (
      <Badge variant="outline" className="text-[10px] text-green-600 border-green-300">
        Données réelles
      </Badge>
    )}
    {!sampleRequest && selectedWorkflow && !sampleLoading && (
      <Badge variant="outline" className="text-[10px] text-amber-600 border-amber-300">
        Aperçu
      </Badge>
    )}
  </CardTitle>
  <CardDescription>
    {sampleRequest
      ? t('previewRealData', { defaultValue: 'Aperçu avec données réelles' })
      : t('previewDescription', { defaultValue: 'Aperçu du panneau agent' })
    }
  </CardDescription>
</CardHeader>
```

### Checklist Phase 4
- [ ] Fonction `getSampleValue` créée
- [ ] Type `SampleRequest` importé ou défini
- [ ] Section Info utilise `sampleRequest`
- [ ] Section Extracted Data affiche valeurs réelles
- [ ] Section Contact affiche email/téléphone réels
- [ ] Indicateur "Données réelles" / "Aperçu" affiché
- [ ] Loader pendant chargement sample
- [ ] Fallback si pas de sample (tirets)
- [ ] TypeScript compile sans erreur

---

## Phase 5: Traductions

### Objectif
Ajouter les clés de traduction manquantes.

### Étapes

#### 5.1 Ajouter traductions ES

**Fichier**: `packages/web/messages/es.json`

Vérifier/ajouter dans `admin.menuConfig.displayConfig`:

```json
{
  "admin": {
    "menuConfig": {
      "displayConfig": {
        "workflowCode": "Código de Workflow",
        "workflowCodeDescription": "Seleccione el workflow para configurar las columnas y secciones",
        "selectWorkflow": "Seleccionar un workflow...",
        "requestsFound": "{count} solicitudes encontradas",
        "noRequestsFound": "Ninguna solicitud existente",
        "workflowLoadError": "Error al cargar los workflows",
        "readOnly": "Solo lectura",
        "previewRealData": "Vista previa con datos reales",
        "noExtractedColumnsSelected": "Ninguna columna extraída seleccionada"
      }
    }
  }
}
```

#### 5.2 Ajouter traductions FR

**Fichier**: `packages/web/messages/fr.json`

```json
{
  "admin": {
    "menuConfig": {
      "displayConfig": {
        "workflowCode": "Code Workflow",
        "workflowCodeDescription": "Sélectionnez le workflow pour configurer les colonnes et sections",
        "selectWorkflow": "Sélectionner un workflow...",
        "requestsFound": "{count} demandes trouvées",
        "noRequestsFound": "Aucune demande existante",
        "workflowLoadError": "Erreur de chargement des workflows",
        "readOnly": "Lecture seule",
        "previewRealData": "Aperçu avec données réelles",
        "noExtractedColumnsSelected": "Aucune colonne extraite sélectionnée"
      }
    }
  }
}
```

#### 5.3 Ajouter traductions EN

**Fichier**: `packages/web/messages/en.json`

```json
{
  "admin": {
    "menuConfig": {
      "displayConfig": {
        "workflowCode": "Workflow Code",
        "workflowCodeDescription": "Select the workflow to configure columns and sections",
        "selectWorkflow": "Select a workflow...",
        "requestsFound": "{count} requests found",
        "noRequestsFound": "No existing requests",
        "workflowLoadError": "Failed to load workflows",
        "readOnly": "Read only",
        "previewRealData": "Preview with real data",
        "noExtractedColumnsSelected": "No extracted columns selected"
      }
    }
  }
}
```

### Checklist Phase 5
- [ ] Clés ES ajoutées
- [ ] Clés FR ajoutées
- [ ] Clés EN ajoutées
- [ ] JSON valide (pas d'erreur de syntaxe)
- [ ] Clés utilisées dans le composant

---

## Phase 6: Mise à jour de la Page Create

### Objectif
Adapter la page de création pour utiliser le nouveau mode.

### Étapes

#### 6.1 Modifier la page create

**Fichier**: `packages/web/src/app/[locale]/(dashboard)/dashboard/admin/menu-config/display/new/page.tsx`

```tsx
// AVANT
<DisplayConfigForm
  patternEditable={true}
  onSubmit={handleSubmit}
  isSubmitting={createMutation.isPending}
  mode="create"
/>

// APRÈS (supprimer patternEditable)
<DisplayConfigForm
  onSubmit={handleSubmit}
  isSubmitting={createMutation.isPending}
  mode="create"
/>
```

### Checklist Phase 6
- [ ] Prop `patternEditable` supprimée de la page create
- [ ] Page compile sans erreur

---

## Phase 7: Tests et Validation

### Objectif
Valider le fonctionnement complet du formulaire.

### Tests Manuels

#### 7.1 Test Mode Create
1. [ ] Aller à `/admin/menu-config/display/new`
2. [ ] Vérifier que le dropdown affiche les workflows groupés par catégorie
3. [ ] Sélectionner `PASAPORTE_NUEVO`
4. [ ] Vérifier que les colonnes système s'affichent (9)
5. [ ] Vérifier que les colonnes extraites se chargent (si données existent)
6. [ ] Vérifier que le compteur de demandes s'affiche
7. [ ] Cocher quelques colonnes extraites
8. [ ] Vérifier que le preview affiche les données réelles (si sample existe)
9. [ ] Cliquer sur Créer
10. [ ] Vérifier redirection et toast succès

#### 7.2 Test Mode Edit
1. [ ] Aller à `/admin/menu-config/display/{id}`
2. [ ] Vérifier que le workflow est affiché en lecture seule (Badge)
3. [ ] Vérifier que les colonnes pré-sélectionnées sont cochées
4. [ ] Modifier les colonnes
5. [ ] Vérifier indicateur "modifications non sauvegardées"
6. [ ] Sauvegarder
7. [ ] Vérifier toast succès

#### 7.3 Test Cas Limites
1. [ ] Workflow sans demandes existantes → message "Aucune demande"
2. [ ] Workflow avec demandes mais sans form_data → colonnes système uniquement
3. [ ] Erreur chargement workflows → message d'erreur affiché
4. [ ] Changer de workflow → colonnes reset aux defaults

### Tests Techniques
1. [ ] `npm run type-check` passe
2. [ ] `npm run lint` pas de nouvelles erreurs
3. [ ] `npm run build` succès

### Checklist Phase 7
- [ ] Test mode create complet
- [ ] Test mode edit complet
- [ ] Tests cas limites
- [ ] TypeScript compile
- [ ] Lint passe
- [ ] Build réussit

---

## Phase 8: Commit et Push

### Objectif
Committer et pousser les modifications.

### Étapes

1. [ ] Vérifier tous les fichiers modifiés
2. [ ] Commit avec message descriptif
3. [ ] Push vers branche develop
4. [ ] Vérifier GitHub Actions CI

### Message de Commit

```
feat(admin): refactor DisplayConfigForm with workflow dropdown

- Replace text input with grouped Select dropdown for workflow selection
- Load extracted columns dynamically based on exact workflow code
- Add real data preview using useSampleRequest hook
- Support create/edit modes properly
- Add missing translations (es, fr, en)

BREAKING: Removed patternEditable prop from DisplayConfigForm

Closes: display-config-migration
```

### Checklist Phase 8
- [ ] Tous les tests passent
- [ ] Commit créé
- [ ] Push vers develop
- [ ] CI passe

---

## Résumé des Fichiers à Modifier

| Fichier | Type | Lignes ~estimées |
|---------|------|------------------|
| `DisplayConfigForm.tsx` | MODIFIER | ~200 lignes changées |
| `display/new/page.tsx` | MODIFIER | ~2 lignes |
| `messages/es.json` | MODIFIER | ~10 lignes |
| `messages/fr.json` | MODIFIER | ~10 lignes |
| `messages/en.json` | MODIFIER | ~10 lignes |

---

## Checklist Globale Finale

### Phase 1: Préparation ⬜
- [ ] Imports ajoutés

### Phase 2: État/Hooks ⬜
- [ ] État et hooks refactorés

### Phase 3: JSX Workflow ⬜
- [ ] Select dropdown implémenté

### Phase 4: Preview ⬜
- [ ] Données réelles affichées

### Phase 5: Traductions ⬜
- [ ] Toutes les clés ajoutées

### Phase 6: Page Create ⬜
- [ ] Prop supprimée

### Phase 7: Tests ⬜
- [ ] Tous les tests passent

### Phase 8: Deploy ⬜
- [ ] Commit et push OK

---

*Plan généré le 2026-02-02 par Claude Code Expert*
*Prêt pour implémentation*
