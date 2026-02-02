# Rapport Critique: Display Config Workflow Code Migration

**Date**: 2026-02-02
**Analyste**: Claude Code Expert
**Statut**: 🔴 **MIGRATION INCOMPLÈTE - GAPS CRITIQUES IDENTIFIÉS**

---

## Résumé Exécutif

L'analyse approfondie révèle que **la migration planifiée n'a été que partiellement implémentée**. Le backend est correctement configuré pour utiliser `workflow_code` exact, mais **le frontend `DisplayConfigForm` utilise toujours un champ de saisie texte** au lieu du dropdown de sélection de workflow codes prévu.

### Verdict de l'Expert

Votre diagnostic est **CORRECT**. L'image `display.png` montre clairement:
1. Un champ `Input` texte libre "Patrón Workflow" avec `PASAPORTE_%`
2. Aucun dropdown/Select de workflow codes
3. Les colonnes extraites ne se chargent pas dynamiquement car le pattern `PASAPORTE_%` ne correspond à aucun workflow exact

---

## 1. État de la Base de Données ✅

### Structure Actuelle (CORRECTE)

```sql
-- workflow_display_config table
| Column           | Type                     | Nullable | Default |
|------------------|--------------------------|----------|---------|
| id               | integer                  | NO       | auto    |
| workflow_code    | character varying        | NO       |         | ← RENOMMÉ (OK)
| list_columns     | jsonb                    | NO       | [...]   |
| preview_sections | jsonb                    | NO       | [...]   |
| labels           | jsonb                    | YES      | {}      |
| is_active        | boolean                  | NO       | true    |
| created_at       | timestamp with time zone | NO       | now()   |
| updated_at       | timestamp with time zone | NO       | now()   |
| deleted_at       | timestamp with time zone | YES      |         |
```

### Index Créés ✅
- `workflow_display_config_pkey` - PK sur `id`
- `workflow_display_config_workflow_pattern_key` - Unique sur `workflow_code` (nom legacy)
- `idx_workflow_display_config_code` - Unique sur `workflow_code` WHERE `is_active = true`

### Données Actuelles
```
| id | workflow_code | is_active |
|----|---------------|-----------|
| 1  | PASAPORTE_%   | false     | ← Pattern avec wildcard, DÉSACTIVÉ
```

**Observation**: La colonne est bien renommée en `workflow_code`, mais contient encore l'ancien pattern avec `%`.

### Workflows Disponibles (34 actifs)
| Catégorie | Exemples |
|-----------|----------|
| CONDUCCION | CONDUCIR_NUEVO, CONDUCIR_RENOVACION |
| CONTRATOS | CONTRATO_ARRENDAMIENTO, CONTRATO_OBRA |
| EXTRANJERIA | RESIDENCIA_PRIMERA_VEZ, RESIDENCIA_RENOVACION |
| FUNCION_PUBLICA | FP_VERIFICACION_FUNCIONARIO |
| IDENTIDAD | PASAPORTE_NUEVO, PASAPORTE_RENOVACION |
| VEHICULOS | VEHICULO_PRIMERA_MATRICULACION |

---

## 2. Backend Analysis ✅

### Repository (`display_config_repository.py`) ✅

```python
# Méthode get_by_code - CORRECTE (exact match)
async def get_by_code(self, workflow_code: str) -> Optional[Dict[str, Any]]:
    query = """
        SELECT ... FROM workflow_display_config
        WHERE workflow_code = $1  -- ✅ Exact match, pas LIKE
        AND is_active = true
        AND deleted_at IS NULL
    """

# Méthode get_available_columns_for_workflow - CORRECTE
# Utilise exact match sur service_requests.workflow_code
```

### Routes (`menu_config_routes.py`) ✅

| Endpoint | Statut | Notes |
|----------|--------|-------|
| `GET /workflows` | ✅ | Liste des workflow codes depuis table `workflows` |
| `GET /display-configs/available-columns/{workflow_code}` | ✅ | Découverte colonnes (exact match) |
| `GET /display-configs/sample-request/{workflow_code}` | ✅ | Sample request pour preview |
| `POST /display-configs` | ✅ | Création avec `workflow_code` |

### Models Pydantic (`menu_config.py`) ✅

```python
class WorkflowCodeResponse(BaseModel):
    code: str
    name_es: str
    category: Optional[str] = None

class WorkflowDisplayConfigBase(BaseModel):
    workflow_code: str  # ✅ Renommé depuis workflow_pattern
    list_columns: List[str]
    preview_sections: List[str]
```

---

## 3. Frontend Analysis 🔴 **GAPS CRITIQUES**

### Service API (`menuConfigService.ts`) ✅

```typescript
// Endpoints disponibles et correctement définis
getWorkflowCodes(): Promise<WorkflowCodeListResponse>  // ✅
getAvailableColumns(workflowCode: string)              // ✅
getSampleRequest(workflowCode: string)                 // ✅
```

### Hooks ✅

| Hook | Fichier | Statut |
|------|---------|--------|
| `useWorkflowCodes()` | `useWorkflowCodes.ts` | ✅ Créé |
| `useWorkflowCodesGrouped()` | `useWorkflowCodes.ts` | ✅ Créé |
| `useSampleRequest()` | `useWorkflowCodes.ts` | ✅ Créé |
| `useAvailableColumns()` | `useDisplayConfigs.ts` | ✅ Fonctionne |

### DisplayConfigForm.tsx 🔴 **PROBLÈME PRINCIPAL**

**État Actuel (INCORRECT):**
```tsx
// Ligne 252-253: Input texte libre au lieu de dropdown
const [pattern, setPattern] = useState(initialData?.workflow_code ?? '');

// Ligne 422-453: Utilise <Input> au lieu de <Select>
<Input
  value={pattern}
  onChange={(e) => setPattern(e.target.value.toUpperCase())}
  placeholder={t('patternPlaceholder')}
  className="font-mono"
/>
// Exemples affichés: "PASAPORTE_%, RESIDENCIA_%, CONDUCIR_%, VEHICULO_%"
```

**Ce qui manque:**
1. ❌ Import de `useWorkflowCodesGrouped` non utilisé dans le composant
2. ❌ Composant `<Select>` avec groupes par catégorie
3. ❌ Chargement dynamique des colonnes extraites au changement de workflow
4. ❌ Preview avec données réelles (`useSampleRequest` non utilisé)

### Colonnes Extraites - Non Chargées 🔴

Le hook `useAllAvailableColumns` est appelé avec le pattern (ex: `PASAPORTE_%`):
```tsx
const shouldFetchColumns = !!pattern && pattern.length >= 3;
const { systemColumns, extractedColumns, ... } = useAllAvailableColumns(pattern, shouldFetchColumns);
```

**Problème**: L'endpoint backend utilise maintenant un **exact match** sur `workflow_code`.
- `PASAPORTE_%` ne correspond à aucun workflow exact
- Résultat: **0 colonnes extraites** retournées

### Preview avec Données Mock 🔴

```tsx
// Ligne 776-779: Données mockées statiques
<div><span className="text-muted-foreground">Email:</span> juan@email.com</div>
<div><span className="text-muted-foreground">Teléfono:</span> +240 555 1234</div>
```

**Attendu**: Utiliser `useSampleRequest(selectedWorkflowCode)` pour afficher des données réelles.

---

## 4. Analyse des Écarts (Gap Analysis)

### Phase 1: Base de Données ✅ COMPLÈTE
- [x] Colonne renommée `workflow_pattern` → `workflow_code`
- [x] Index unique créé
- [x] Migration exécutée

### Phase 2: Backend ✅ COMPLÈTE
- [x] Repository modifié: exact match
- [x] Endpoint `/workflows` créé
- [x] Endpoint `available-columns` modifié
- [x] Endpoint `sample-request` créé
- [x] Modèles Pydantic ajoutés

### Phase 3: Frontend Service/Hooks ✅ COMPLÈTE
- [x] Type `WorkflowCode` ajouté
- [x] `getWorkflowCodes()` implémenté
- [x] Hook `useWorkflowCodes` créé
- [x] Hook `useWorkflowCodesGrouped` créé
- [x] Hook `useSampleRequest` créé

### Phase 4: Traductions ⚠️ NON VÉRIFIÉE
- [ ] Vérifier `es.json`, `fr.json`, `en.json` pour les clés de colonnes

### Phase 5: DisplayConfigForm 🔴 **NON IMPLÉMENTÉE**
- [ ] ❌ Dropdown workflows (Input texte utilisé)
- [ ] ❌ Sélection workflow charge colonnes correspondantes
- [ ] ❌ Preview avec données réelles (mock utilisé)
- [ ] ❌ Intégration `useSampleRequest`

### Phase 6: PendingPage ⚠️ NON VÉRIFIÉE
- [ ] Vérifier si `deriveWorkflowPattern` supprimée
- [ ] Vérifier utilisation `DEFAULT_LIST_COLUMNS`

---

## 5. Causes des Erreurs Silencieuses

### Cause 1: Pattern vs Code Exact
```
Frontend envoie: "PASAPORTE_%"
Backend attend:  "PASAPORTE_NUEVO" (exact)
Résultat:        0 colonnes extraites, aucune erreur levée
```

### Cause 2: Hooks Non Connectés
Les hooks `useWorkflowCodesGrouped` et `useSampleRequest` sont créés mais **jamais importés ni utilisés** dans `DisplayConfigForm.tsx`.

### Cause 3: Fallback Silencieux
```tsx
// useAllAvailableColumns retourne silencieusement des arrays vides si pas de match
const allColumns: AvailableColumn[] = data
  ? [...data.system_columns, ...data.extracted_columns]
  : [];  // Fallback silencieux
```

---

## 6. Permissions ✅

Permissions correctement configurées:
| Permission | Usage |
|------------|-------|
| `menu.view_mappings` | Requis pour list/get workflows et colonnes |
| `menu.create_mapping` | Requis pour créer display config |
| `menu.update_mapping` | Requis pour modifier |
| `menu.delete_mapping` | Requis pour supprimer |

---

## 7. Plan de Correction Recommandé

### Action Immédiate (DisplayConfigForm.tsx)

**Fichier**: `packages/web/src/modules/admin/components/DisplayConfigForm.tsx`

1. **Importer les hooks manquants**:
```tsx
import { useWorkflowCodesGrouped, useSampleRequest } from '@/modules/admin/hooks';
```

2. **Ajouter l'état pour le workflow sélectionné**:
```tsx
const [selectedWorkflow, setSelectedWorkflow] = useState(initialData?.workflow_code ?? '');
```

3. **Utiliser les hooks**:
```tsx
const { grouped, categories, isLoading: workflowsLoading } = useWorkflowCodesGrouped();
const { data: sampleRequest } = useSampleRequest(selectedWorkflow);
```

4. **Remplacer l'Input par un Select groupé**:
```tsx
<Select value={selectedWorkflow} onValueChange={handleWorkflowChange}>
  <SelectTrigger>
    <SelectValue placeholder="Sélectionner un workflow..." />
  </SelectTrigger>
  <SelectContent>
    {categories.map((category) => (
      <SelectGroup key={category}>
        <SelectLabel>{category}</SelectLabel>
        {grouped[category]?.map((wf) => (
          <SelectItem key={wf.code} value={wf.code}>
            {wf.name_es} ({wf.code})
          </SelectItem>
        ))}
      </SelectGroup>
    ))}
  </SelectContent>
</Select>
```

5. **Mettre à jour le preview avec données réelles**:
```tsx
// Dans la section preview
{sampleRequest ? (
  <div>
    <span className="text-muted-foreground">Email:</span>
    {sampleRequest.form_data?.email || sampleRequest.extracted_data?.email || '—'}
  </div>
) : (
  <span className="text-muted-foreground">Aucune demande trouvée</span>
)}
```

---

## 8. Résumé des Fichiers à Modifier

| Fichier | Action | Priorité |
|---------|--------|----------|
| `DisplayConfigForm.tsx` | Refactoring complet | 🔴 CRITIQUE |
| Traductions (es.json, fr.json, en.json) | Vérifier clés colonnes | ⚠️ MOYENNE |
| PendingPage.tsx | Vérifier usage exact code | ⚠️ MOYENNE |

---

## 9. Conclusion

**Diagnostic confirmé**: La migration a été correctement implémentée côté backend et les hooks frontend sont prêts, mais le composant `DisplayConfigForm.tsx` n'a **jamais été mis à jour** pour utiliser ces nouveaux hooks.

**Impact**:
- L'interface admin affiche toujours l'ancien système de patterns
- Les colonnes extraites ne se chargent jamais (0 résultats)
- Le preview utilise des données mockées au lieu de données réelles

**Recommandation**: Implémenter immédiatement la Phase 5 du plan de migration (DisplayConfigForm refactoring).

---

*Rapport généré le 2026-02-02 par Claude Code Expert*
