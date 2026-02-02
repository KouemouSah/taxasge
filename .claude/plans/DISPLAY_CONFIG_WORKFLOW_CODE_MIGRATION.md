# Plan de Migration: Display Config vers Workflow Code Exact

**Date**: 2026-02-02
**Version**: 1.0
**Statut**: APPROUVÉ - PRÊT POUR IMPLÉMENTATION

---

## Résumé Exécutif

Migration de l'architecture `workflow_pattern` (LIKE) vers `workflow_code` (exact match) pour les configurations d'affichage, avec optimisation par defaults et création à la demande.

### Principes Clés
1. **Pas de duplication** - Utiliser defaults, configs créées uniquement si personnalisation
2. **Liste**: `DEFAULT_LIST_COLUMNS` hardcodées (colonnes système communes)
3. **Preview**: Config spécifique par workflow ou defaults
4. **Dropdown**: Sélection dynamique des workflows existants

---

## Phase 1: Base de Données

### Objectif
Modifier la structure de `workflow_display_config` pour supporter les workflow codes exacts.

### Étapes

#### 1.1 Créer migration SQL
```sql
-- Migration: 089_workflow_display_config_exact_code.sql

BEGIN;

-- 1. Renommer la colonne
ALTER TABLE workflow_display_config
RENAME COLUMN workflow_pattern TO workflow_code;

-- 2. Supprimer l'ancien index (si existe)
DROP INDEX IF EXISTS idx_workflow_display_config_pattern;

-- 3. Créer nouvel index unique
CREATE UNIQUE INDEX idx_workflow_display_config_code
ON workflow_display_config(workflow_code)
WHERE deleted_at IS NULL;

-- 4. Mettre à jour la description de la colonne
COMMENT ON COLUMN workflow_display_config.workflow_code IS
'Exact workflow code (e.g., PASAPORTE_EXPEDICION_ADULTO). No patterns.';

-- 5. Optionnel: Archiver les anciennes configs avec pattern (%)
UPDATE workflow_display_config
SET is_active = false,
    updated_at = NOW()
WHERE workflow_code LIKE '%\%%';

COMMIT;
```

#### 1.2 Vérifier la structure
```sql
-- Vérification
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'workflow_display_config';

-- Vérifier l'index
SELECT indexname FROM pg_indexes
WHERE tablename = 'workflow_display_config';
```

### Checklist de Validation Phase 1
- [ ] Migration SQL créée et revue
- [ ] Migration exécutée sans erreur
- [ ] Colonne renommée `workflow_pattern` → `workflow_code`
- [ ] Index unique créé sur `workflow_code`
- [ ] Anciennes configs pattern désactivées (is_active = false)
- [ ] Aucune régression sur les requêtes existantes

---

## Phase 2: Backend - Repository & Routes

### Objectif
Adapter le backend pour utiliser le match exact et ajouter l'endpoint de liste des workflows.

### Étapes

#### 2.1 Modifier `display_config_repository.py`

**Fichier**: `packages/backend/app/modules/menu_config/repositories/display_config_repository.py`

```python
# Avant (LIKE)
async def get_by_workflow_code(self, code: str) -> Optional[Dict]:
    query = """
        SELECT * FROM workflow_display_config
        WHERE $1 LIKE workflow_pattern
        AND is_active = true
        AND deleted_at IS NULL
        ORDER BY LENGTH(workflow_pattern) DESC
        LIMIT 1
    """

# Après (EXACT)
async def get_by_workflow_code(self, workflow_code: str) -> Optional[Dict]:
    """Get display config by exact workflow code."""
    query = """
        SELECT * FROM workflow_display_config
        WHERE workflow_code = $1
        AND is_active = true
        AND deleted_at IS NULL
    """
    return await self.db.fetchrow(query, workflow_code)
```

#### 2.2 Ajouter endpoint liste des workflows

**Fichier**: `packages/backend/app/modules/menu_config/api/menu_config_routes.py`

```python
@router.get(
    "/workflows",
    response_model=List[WorkflowCodeResponse],
    summary="List available workflow codes",
    description="Get all distinct workflow codes from service_request_workflows table."
)
async def list_workflow_codes(
    current_user: UserResponse = Depends(get_current_user),
    db: asyncpg.Connection = Depends(get_database),
    permission_service: PermissionService = Depends(get_permission_service),
):
    """List all available workflow codes for dropdown selection."""
    await permission_service.check_permission(
        current_user.id, "menu.view_mappings", raise_exception=True
    )

    query = """
        SELECT DISTINCT code, name_es, name_fr, category
        FROM service_request_workflows
        WHERE is_active = true
        ORDER BY category, code
    """
    rows = await db.fetch(query)
    return [WorkflowCodeResponse(**row) for row in rows]
```

#### 2.3 Modifier endpoint available-columns

```python
@router.get(
    "/display-configs/available-columns/{workflow_code}",
    response_model=AvailableColumnsResponse,
    summary="Get available columns for a workflow",
    description="Discover columns from actual service requests for exact workflow code."
)
async def get_available_columns(
    workflow_code: str,  # Exact code, not pattern
    ...
):
    # Modifier la requête pour utiliser = au lieu de LIKE
    query = """
        SELECT DISTINCT ...
        FROM service_requests sr
        WHERE sr.workflow_code = $1
        ...
    """
```

#### 2.4 Ajouter modèle Pydantic

**Fichier**: `packages/backend/app/modules/menu_config/models/menu_config.py`

```python
class WorkflowCodeResponse(BaseModel):
    """Workflow code for dropdown selection."""
    code: str
    name_es: str
    name_fr: Optional[str] = None
    category: Optional[str] = None

class WorkflowCodeListResponse(BaseModel):
    """List of workflow codes."""
    items: List[WorkflowCodeResponse]
    total: int
```

### Checklist de Validation Phase 2
- [ ] Repository modifié: match exact au lieu de LIKE
- [ ] Nouvel endpoint `GET /menu-config/workflows` créé
- [ ] Endpoint retourne liste des workflow codes avec noms
- [ ] Endpoint `available-columns` modifié pour code exact
- [ ] Modèles Pydantic ajoutés
- [ ] Tests unitaires passent
- [ ] Tests manuels avec curl/Postman OK

---

## Phase 3: Frontend - Service & Hooks

### Objectif
Ajouter le service et hook pour récupérer la liste des workflows.

### Étapes

#### 3.1 Ajouter au service API

**Fichier**: `packages/web/src/modules/admin/services/menuConfigService.ts`

```typescript
// Types
export interface WorkflowCode {
  code: string;
  name_es: string;
  name_fr: string | null;
  category: string | null;
}

export interface WorkflowCodeListResponse {
  items: WorkflowCode[];
  total: number;
}

// API call
export async function getWorkflowCodes(): Promise<WorkflowCode[]> {
  const response = await apiClient.get<WorkflowCode[]>('/menu-config/workflows');
  return response.data;
}

// Update getAvailableColumns to use exact code
export async function getAvailableColumns(
  workflowCode: string  // Changed from pattern
): Promise<AvailableColumnsResponse> {
  const response = await apiClient.get<AvailableColumnsResponse>(
    `/menu-config/display-configs/available-columns/${encodeURIComponent(workflowCode)}`
  );
  return response.data;
}
```

#### 3.2 Ajouter hook useWorkflowCodes

**Fichier**: `packages/web/src/modules/admin/hooks/useWorkflowCodes.ts`

```typescript
import { useQuery } from '@tanstack/react-query';
import { getWorkflowCodes } from '../services/menuConfigService';
import type { WorkflowCode } from '../services/menuConfigService';

export function useWorkflowCodes() {
  return useQuery<WorkflowCode[], Error>({
    queryKey: ['workflow-codes'],
    queryFn: getWorkflowCodes,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

// Group workflows by category for dropdown
export function useWorkflowCodesGrouped() {
  const { data: workflows, ...rest } = useWorkflowCodes();

  const grouped = useMemo(() => {
    if (!workflows) return {};
    return workflows.reduce((acc, wf) => {
      const category = wf.category || 'Otros';
      if (!acc[category]) acc[category] = [];
      acc[category].push(wf);
      return acc;
    }, {} as Record<string, WorkflowCode[]>);
  }, [workflows]);

  return { grouped, workflows, ...rest };
}
```

#### 3.3 Exporter dans index.ts

**Fichier**: `packages/web/src/modules/admin/hooks/index.ts`

```typescript
export * from './useWorkflowCodes';
```

### Checklist de Validation Phase 3
- [ ] Type `WorkflowCode` ajouté au service
- [ ] Fonction `getWorkflowCodes()` ajoutée
- [ ] Hook `useWorkflowCodes` créé
- [ ] Hook `useWorkflowCodesGrouped` créé (groupé par catégorie)
- [ ] Export dans index.ts
- [ ] TypeScript compile sans erreur

---

## Phase 4: Traductions Manquantes

### Objectif
Ajouter toutes les traductions manquantes pour les colonnes extraites.

### Colonnes à traduire

```
ciudad, departamento, domicilio, estado_civil,
fecha_expedicion_antiguo, fecha_expiracion_antiguo,
fecha_nacimiento, grupo_sanguin, nombre_madre, nombre_padre,
nombres, numero_dip, numero_pasaporte_antiguo,
profesion, representante_unico, apellidos, natural_de,
lugar_nacimiento, sexo, nacionalidad, direccion, telefono, email
```

### Étapes

#### 4.1 Ajouter traductions es.json

**Fichier**: `packages/web/messages/es.json`

```json
{
  "admin": {
    "menuConfig": {
      "displayConfig": {
        "columns": {
          "ciudad": "Ciudad",
          "departamento": "Departamento",
          "domicilio": "Domicilio",
          "estado_civil": "Estado Civil",
          "fecha_expedicion_antiguo": "Fecha Expedición Anterior",
          "fecha_expiracion_antiguo": "Fecha Expiración Anterior",
          "fecha_nacimiento": "Fecha de Nacimiento",
          "grupo_sanguineo": "Grupo Sanguíneo",
          "nombre_madre": "Nombre de la Madre",
          "nombre_padre": "Nombre del Padre",
          "nombres": "Nombres",
          "numero_dip": "N° DIP",
          "numero_pasaporte_antiguo": "N° Pasaporte Anterior",
          "profesion": "Profesión",
          "representante_unico": "Representante Único",
          "apellidos": "Apellidos",
          "natural_de": "Natural de",
          "lugar_nacimiento": "Lugar de Nacimiento",
          "sexo": "Sexo",
          "nacionalidad": "Nacionalidad",
          "direccion": "Dirección",
          "telefono": "Teléfono",
          "email": "Correo Electrónico"
        }
      }
    }
  }
}
```

#### 4.2 Ajouter traductions fr.json

**Fichier**: `packages/web/messages/fr.json`

```json
{
  "admin": {
    "menuConfig": {
      "displayConfig": {
        "columns": {
          "ciudad": "Ville",
          "departamento": "Département",
          "domicilio": "Domicile",
          "estado_civil": "État Civil",
          "fecha_expedicion_antiguo": "Date Expédition Précédente",
          "fecha_expiracion_antiguo": "Date Expiration Précédente",
          "fecha_nacimiento": "Date de Naissance",
          "grupo_sanguineo": "Groupe Sanguin",
          "nombre_madre": "Nom de la Mère",
          "nombre_padre": "Nom du Père",
          "nombres": "Prénoms",
          "numero_dip": "N° DIP",
          "numero_pasaporte_antiguo": "N° Passeport Précédent",
          "profesion": "Profession",
          "representante_unico": "Représentant Unique",
          "apellidos": "Noms de Famille",
          "natural_de": "Originaire de",
          "lugar_nacimiento": "Lieu de Naissance",
          "sexo": "Sexe",
          "nacionalidad": "Nationalité",
          "direccion": "Adresse",
          "telefono": "Téléphone",
          "email": "Adresse Email"
        }
      }
    }
  }
}
```

#### 4.3 Ajouter traductions en.json

**Fichier**: `packages/web/messages/en.json`

```json
{
  "admin": {
    "menuConfig": {
      "displayConfig": {
        "columns": {
          "ciudad": "City",
          "departamento": "Department",
          "domicilio": "Address",
          "estado_civil": "Marital Status",
          "fecha_expedicion_antiguo": "Previous Issue Date",
          "fecha_expiracion_antiguo": "Previous Expiry Date",
          "fecha_nacimiento": "Date of Birth",
          "grupo_sanguineo": "Blood Type",
          "nombre_madre": "Mother's Name",
          "nombre_padre": "Father's Name",
          "nombres": "First Names",
          "numero_dip": "ID Number",
          "numero_pasaporte_antiguo": "Previous Passport Number",
          "profesion": "Profession",
          "representante_unico": "Legal Guardian",
          "apellidos": "Last Names",
          "natural_de": "Native of",
          "lugar_nacimiento": "Place of Birth",
          "sexo": "Gender",
          "nacionalidad": "Nationality",
          "direccion": "Address",
          "telefono": "Phone",
          "email": "Email Address"
        }
      }
    }
  }
}
```

### Checklist de Validation Phase 4
- [ ] Toutes les colonnes extraites ont une traduction ES
- [ ] Toutes les colonnes extraites ont une traduction FR
- [ ] Toutes les colonnes extraites ont une traduction EN
- [ ] JSON valide (pas d'erreur de syntaxe)
- [ ] Labels affichés correctement dans l'UI (pas de clés brutes)

---

## Phase 5: DisplayConfigForm - Refactoring Complet

### Objectif
Refactoriser le formulaire avec:
- Dropdown sélection workflow
- Sections collapsibles
- Traductions
- Preview avec données réelles

### Étapes

#### 5.1 Structure du composant

```typescript
// DisplayConfigForm.tsx - Structure cible

interface DisplayConfigFormProps {
  initialData?: DisplayConfigFormData;
  onSubmit: (data: DisplayConfigFormData) => Promise<void>;
  onDirtyChange?: (isDirty: boolean) => void;
  isSubmitting?: boolean;
  mode?: 'create' | 'edit';
}

// Sections:
// 1. Workflow Selection (dropdown) - mode create uniquement
// 2. Colonnes Disponibles (collapsible: Système | Extraites)
// 3. Colonnes Sélectionnées (drag & drop)
// 4. Sections Preview (checkboxes)
// 5. Aperçu avec données réelles
```

#### 5.2 Implémenter dropdown workflows

```typescript
// Utiliser le hook useWorkflowCodesGrouped
const { grouped, isLoading: workflowsLoading } = useWorkflowCodesGrouped();

// Composant Select avec groupes
<Select value={selectedWorkflow} onValueChange={handleWorkflowChange}>
  <SelectTrigger>
    <SelectValue placeholder="Sélectionner un workflow..." />
  </SelectTrigger>
  <SelectContent>
    {Object.entries(grouped).map(([category, workflows]) => (
      <SelectGroup key={category}>
        <SelectLabel>{category}</SelectLabel>
        {workflows.map((wf) => (
          <SelectItem key={wf.code} value={wf.code}>
            {wf.name_es} ({wf.code})
          </SelectItem>
        ))}
      </SelectGroup>
    ))}
  </SelectContent>
</Select>
```

#### 5.3 Implémenter sections collapsibles

```typescript
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

// État pour collapse
const [systemColumnsOpen, setSystemColumnsOpen] = useState(true);
const [extractedColumnsOpen, setExtractedColumnsOpen] = useState(true);

// Section Colonnes Système
<Collapsible open={systemColumnsOpen} onOpenChange={setSystemColumnsOpen}>
  <CollapsibleTrigger asChild>
    <Button variant="ghost" className="w-full justify-between">
      <span className="flex items-center gap-2">
        <Database className="h-4 w-4" />
        Colonnes Système ({systemColumns.length})
      </span>
      {systemColumnsOpen ? <ChevronUp /> : <ChevronDown />}
    </Button>
  </CollapsibleTrigger>
  <CollapsibleContent>
    {/* Checkboxes des colonnes système */}
  </CollapsibleContent>
</Collapsible>

// Section Colonnes Extraites
<Collapsible open={extractedColumnsOpen} onOpenChange={setExtractedColumnsOpen}>
  <CollapsibleTrigger asChild>
    <Button variant="ghost" className="w-full justify-between">
      <span className="flex items-center gap-2">
        <FileText className="h-4 w-4" />
        Colonnes Extraites ({extractedColumns.length})
      </span>
      {extractedColumnsOpen ? <ChevronUp /> : <ChevronDown />}
    </Button>
  </CollapsibleTrigger>
  <CollapsibleContent>
    {/* Checkboxes des colonnes extraites */}
  </CollapsibleContent>
</Collapsible>
```

#### 5.4 Preview avec données réelles

```typescript
// Hook pour récupérer une demande exemple
const { data: sampleRequest, isLoading: sampleLoading } = useQuery({
  queryKey: ['sample-request', selectedWorkflow],
  queryFn: () => getSampleRequestForWorkflow(selectedWorkflow),
  enabled: !!selectedWorkflow,
});

// Affichage dans le preview
<Card>
  <CardHeader>
    <CardTitle className="flex items-center gap-2">
      <Eye className="h-4 w-4" />
      Aperçu (données réelles)
    </CardTitle>
  </CardHeader>
  <CardContent>
    {sampleLoading ? (
      <Skeleton className="h-32" />
    ) : sampleRequest ? (
      <div className="space-y-2">
        {selectedColumns.map((colId) => (
          <div key={colId} className="flex justify-between text-sm">
            <span className="text-muted-foreground">
              {t(`columns.${colId}`, { defaultValue: humanize(colId) })}
            </span>
            <span className="font-medium">
              {getColumnValue(sampleRequest, colId) || '—'}
            </span>
          </div>
        ))}
      </div>
    ) : (
      <p className="text-sm text-muted-foreground">
        Aucune demande trouvée pour ce workflow
      </p>
    )}
  </CardContent>
</Card>
```

#### 5.5 Backend endpoint pour sample request

```python
@router.get(
    "/display-configs/sample-request/{workflow_code}",
    response_model=SampleRequestResponse,
    summary="Get sample request for preview"
)
async def get_sample_request(
    workflow_code: str,
    db: asyncpg.Connection = Depends(get_database),
):
    """Get a sample service request for preview purposes."""
    query = """
        SELECT
            sr.id, sr.reference, sr.citizen_name,
            sr.workflow_code, sr.status, sr.priority,
            sr.extracted_data, sr.form_data, sr.created_at
        FROM service_requests sr
        WHERE sr.workflow_code = $1
        AND sr.extracted_data IS NOT NULL
        ORDER BY sr.created_at DESC
        LIMIT 1
    """
    row = await db.fetchrow(query, workflow_code)
    if not row:
        return None
    return SampleRequestResponse(**dict(row))
```

### Checklist de Validation Phase 5
- [ ] Dropdown workflows fonctionne (affiche liste groupée)
- [ ] Sélection workflow charge les colonnes correspondantes
- [ ] Section "Colonnes Système" collapsible
- [ ] Section "Colonnes Extraites" collapsible
- [ ] Drag & drop fonctionne toujours
- [ ] Flèches ↑↓ fonctionnent toujours
- [ ] Preview affiche données réelles de la demande exemple
- [ ] Traductions affichées (pas de clés brutes)
- [ ] Mode create: dropdown visible
- [ ] Mode edit: dropdown masqué, workflow affiché en lecture seule
- [ ] TypeScript compile sans erreur
- [ ] Formulaire sauvegarde correctement

---

## Phase 6: PendingPage - Adaptation

### Objectif
Adapter PendingPage pour utiliser les defaults pour la liste et le workflow_code exact pour le preview.

### Étapes

#### 6.1 Supprimer deriveWorkflowPattern

```typescript
// SUPPRIMER cette fonction
function deriveWorkflowPattern(entityCode: EntityCode): string {
  const parts = entityCode.split('-');
  const workflowPart = parts[parts.length - 1];
  return `${workflowPart.toUpperCase()}_%`;
}
```

#### 6.2 Liste: utiliser DEFAULT_LIST_COLUMNS

```typescript
// Dans PendingPage.tsx
// La liste utilise toujours les colonnes par défaut (système, communes)
const displayColumns = DEFAULT_LIST_COLUMNS;

// Plus besoin de useDisplayConfigForWorkflow pour la liste
```

#### 6.3 Preview: charger config par workflow_code exact

```typescript
// Dans RequestPreview ou là où le preview est géré
const selectedRequest = requests.find(r => r.id === selectedId);
const workflowCode = selectedRequest?.workflowCode;

// Charger la config spécifique au workflow
const { data: displayConfig } = useDisplayConfigForWorkflow(
  workflowCode,
  !!workflowCode
);

// Utiliser config.preview_sections si disponible, sinon defaults
const previewSections = displayConfig?.preview_sections || DEFAULT_PREVIEW_SECTIONS;
```

#### 6.4 Modifier le hook useDisplayConfigForWorkflow

```typescript
// Modifier pour utiliser match exact
export function useDisplayConfigForWorkflow(
  workflowCode: string | undefined,
  enabled: boolean = true
) {
  return useQuery({
    queryKey: ['display-config', 'by-code', workflowCode],
    queryFn: () => getDisplayConfigByCode(workflowCode!),
    enabled: enabled && !!workflowCode,
  });
}
```

### Checklist de Validation Phase 6
- [ ] Fonction `deriveWorkflowPattern` supprimée
- [ ] Liste utilise `DEFAULT_LIST_COLUMNS`
- [ ] Preview charge config par `workflow_code` exact
- [ ] Si pas de config, preview utilise defaults
- [ ] Navigation entre demandes met à jour le preview
- [ ] Performance OK (pas de requêtes multiples inutiles)

---

## Phase 7: Tests & Validation Finale

### Tests Manuels

#### 7.1 Test création config
1. [ ] Aller à `/admin/menu-config/display/new`
2. [ ] Dropdown affiche les workflows groupés par catégorie
3. [ ] Sélectionner `PASAPORTE_EXPEDICION_MENOR`
4. [ ] Colonnes extraites spécifiques apparaissent (nombre_padre, nombre_madre)
5. [ ] Cocher/décocher colonnes fonctionne
6. [ ] Drag & drop colonnes sélectionnées fonctionne
7. [ ] Preview affiche données réelles
8. [ ] Sauvegarder → succès

#### 7.2 Test édition config
1. [ ] Aller à `/admin/menu-config/display/{id}`
2. [ ] Workflow affiché (non modifiable)
3. [ ] Colonnes actuelles pré-cochées
4. [ ] Modifier colonnes → indicateur "modifications non sauvegardées"
5. [ ] Sauvegarder → succès

#### 7.3 Test PendingPage
1. [ ] Aller à `/dashboard/agent/cnedoge-pasaporte/pending`
2. [ ] Liste affiche colonnes système (reference, name, priority, SLA)
3. [ ] Cliquer sur une demande `PASAPORTE_EXPEDICION_MENOR`
4. [ ] Preview affiche colonnes spécifiques (si config existe)
5. [ ] Cliquer sur une demande `PASAPORTE_EXPEDICION_ADULTO`
6. [ ] Preview change avec colonnes appropriées

#### 7.4 Tests techniques
1. [ ] TypeScript: `npm run type-check` passe
2. [ ] Lint: `npm run lint` - pas de nouvelles erreurs
3. [ ] Build: `npm run build` - succès
4. [ ] Backend tests: `pytest` - pass

### Checklist de Validation Phase 7
- [ ] Tous les tests manuels passent
- [ ] TypeScript compile
- [ ] Build frontend réussit
- [ ] Tests backend passent
- [ ] Pas de régression sur fonctionnalités existantes

---

## Phase 8: Déploiement & Monitoring

### Étapes

1. [ ] Commit avec message descriptif
2. [ ] Push vers branche develop
3. [ ] Vérifier GitHub Actions CI
4. [ ] Vérifier déploiement staging
5. [ ] Tests smoke en staging
6. [ ] Monitoring erreurs (si Sentry configuré)

### Rollback Plan

Si problème critique:
```sql
-- Rollback DB
ALTER TABLE workflow_display_config
RENAME COLUMN workflow_code TO workflow_pattern;

-- Réactiver anciennes configs
UPDATE workflow_display_config
SET is_active = true
WHERE workflow_pattern LIKE '%\%%';
```

---

## Résumé des Fichiers à Modifier/Créer

### Backend
| Fichier | Action |
|---------|--------|
| `database/migrations/089_*.sql` | CRÉER |
| `menu_config/repositories/display_config_repository.py` | MODIFIER |
| `menu_config/api/menu_config_routes.py` | MODIFIER |
| `menu_config/models/menu_config.py` | MODIFIER |

### Frontend
| Fichier | Action |
|---------|--------|
| `admin/services/menuConfigService.ts` | MODIFIER |
| `admin/hooks/useWorkflowCodes.ts` | CRÉER |
| `admin/hooks/index.ts` | MODIFIER |
| `admin/components/DisplayConfigForm.tsx` | MODIFIER |
| `agent-dashboard/components/pending/PendingPage.tsx` | MODIFIER |
| `messages/es.json` | MODIFIER |
| `messages/fr.json` | MODIFIER |
| `messages/en.json` | MODIFIER |

---

## Estimation

| Phase | Effort |
|-------|--------|
| Phase 1: Base de données | 30 min |
| Phase 2: Backend | 1h |
| Phase 3: Frontend Service/Hooks | 30 min |
| Phase 4: Traductions | 30 min |
| Phase 5: DisplayConfigForm | 2h |
| Phase 6: PendingPage | 1h |
| Phase 7: Tests | 1h |
| Phase 8: Déploiement | 30 min |
| **TOTAL** | **~7h** |

---

*Plan généré le 2026-02-02 par Claude Code Expert*
*Approuvé par l'utilisateur*
