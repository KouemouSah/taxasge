# Phase 4 — Plan détaillé : Catalog permissions dynamique + cleanup UI morts

## Contexte critique (interrogation BD directe)

Migration `287_user_documents_vault.sql:299-317` révèle la vérité BD :

```sql
CREATE TABLE user_agent_permissions (
    permission_type VARCHAR(50) NOT NULL
        CHECK (permission_type IN (
            'prepare_renewal', 'prepare_request', 'suggest_appointments',
            'proactive_alerts', 'auto_classify'
        )),
    level INTEGER DEFAULT 1 CHECK (level IN (1, 2)),
    ...
)
```

**Constat** :
1. Seulement **5 types** acceptés par la BD
2. **Level 3 n'existe pas** (CHECK rejette)
3. Backend `_TOOL_PERMISSION_MAP` référence `submit_request` + `book_appointment` → **permission_types fantômes**, INSERT échouerait
4. Tools `submit_prepared_request` + `book_appointment` déclarés Level 3 → jamais autorisables en l'état
5. **Grep confirmé** : aucune migration n'étend la CHECK constraint

### Implications sur Phase 5
Le design initial (piggyback sur `user_agent_permissions` pour Level 3) ne peut PAS fonctionner. Phase 5 devra utiliser une **nouvelle table** `user_agent_executive_consents` (pattern confirmation_code single-use, Redis TTL) orthogonale au modèle permissions persistant. **Cette Phase 4 N'IMPLÉMENTE PAS Level 3 — elle expose la vérité BD actuelle.**

## Objectif Phase 4

1. Créer l'endpoint `GET /api/v1/user-documents/agent/permission-catalog` comme **source de vérité unique** dérivée du backend (pas de duplication côté frontend)
2. Chaque permission porte un flag `status: 'available' | 'coming_soon'` calculé automatiquement à partir du mapping tool ↔ permission
3. Frontend `AgentSettingsPanel` consomme le catalog au lieu de l'array hardcodé `PERMISSION_TYPES`
4. UI honnête : les 3 permissions sans tool backend s'affichent avec badge "Bientôt" + toggle disabled
5. Nettoyer le `_TOOL_PERMISSION_MAP` : retirer les entrées fantômes `submit_request`/`book_appointment` (ces tools retourneront un statut `feature_coming_soon` jusqu'à Phase 5)

## Architecture

### Backend : source unique de vérité

**Nouveau fichier ou fonction** dans `chatbot_tools_authenticated.py` :

```python
# Les 5 permission_types de la BD avec leur statut dérivé
AGENT_PERMISSION_CATALOG = [
    {
        "key": "prepare_request",
        "status": "available",
        "tool_name": "auto_prepare_wizard",
        "max_level": 2,
        "icon": "ClipboardList",
        "always_on": False,
    },
    {
        "key": "prepare_renewal",
        "status": "available",
        "tool_name": "prepare_renewal",
        "max_level": 2,
        "icon": "RotateCcw",
        "always_on": False,
    },
    {
        "key": "suggest_appointments",
        "status": "coming_soon",
        "tool_name": None,  # à implémenter Phase 7
        "max_level": 2,
        "icon": "CalendarDays",
        "always_on": False,
    },
    {
        "key": "proactive_alerts",
        "status": "coming_soon",
        "tool_name": None,  # à implémenter Phase 8
        "max_level": 2,
        "icon": "Bell",
        "always_on": False,
    },
    {
        "key": "auto_classify",
        "status": "coming_soon",
        "tool_name": None,  # à implémenter Phase 6
        "max_level": 2,
        "icon": "FolderOpen",
        "always_on": False,
    },
]
```

**Endpoint `user_documents_routes.py`** :
```python
@router.get("/agent/permission-catalog")
async def get_agent_permission_catalog(
    current_user: UserResponse = Depends(get_current_user),
):
    """
    Return the authoritative catalog of agent permissions.
    This is the single source of truth for the frontend. Each entry
    carries a status flag so the UI can render disabled toggles for
    not-yet-implemented features instead of hiding them (user trust).
    """
    return {
        "catalog": AGENT_PERMISSION_CATALOG,
        "total": len(AGENT_PERMISSION_CATALOG),
    }
```

Cache Redis 1h via `get_permissions_cache()` existant pour les 1M+ users.

**Cleanup `_TOOL_PERMISSION_MAP`** — retirer les fantômes :
```python
# AVANT
_TOOL_PERMISSION_MAP = {
    "prepare_renewal": "prepare_renewal",
    "auto_prepare_wizard": "prepare_request",
    "submit_prepared_request": "submit_request",  # ← BD rejette
    "book_appointment": "book_appointment",        # ← BD rejette
}

# APRÈS
_TOOL_PERMISSION_MAP = {
    "prepare_renewal": "prepare_renewal",
    "auto_prepare_wizard": "prepare_request",
    # submit_prepared_request + book_appointment are Level 3 executive tools.
    # They use a confirmation_code mechanism (Phase 5), not the persistent
    # user_agent_permissions table (which only accepts Level 1-2).
}
```

**Cleanup tools Level 3** — retourner `coming_soon` au lieu de `permission_required` jusqu'à Phase 5 :
```python
async def submit_prepared_request(db, **kwargs) -> dict:
    return {
        "status": "feature_coming_soon",
        "message": "L'envoi automatique de demandes sera disponible prochainement.",
    }
# Idem book_appointment
```

### Frontend : consommer le catalog

**`packages/web/src/modules/user-documents/services/api.ts`**

Nouvelle méthode :
```typescript
async getAgentPermissionCatalog(): Promise<AgentPermissionCatalog[]> {
  const res = await client.get('/user-documents/agent/permission-catalog');
  return res.data.catalog;
}
```

**`packages/web/src/modules/user-documents/types.ts`**

```typescript
export interface AgentPermissionCatalog {
  key: string;
  status: 'available' | 'coming_soon';
  tool_name: string | null;
  max_level: number;
  icon: string;
  always_on: boolean;
}
```

**`packages/web/src/modules/user-documents/components/AgentSettingsPanel.tsx`**

Remplacer l'array hardcodé `PERMISSION_TYPES` (lignes 79-85) par un fetch react-query :
```typescript
const {
  data: catalog = [],
  isLoading: catalogLoading,
} = useQuery({
  queryKey: ['user-documents', 'agent', 'permission-catalog'],
  queryFn: userDocumentsApi.getAgentPermissionCatalog,
  enabled: open,
  staleTime: 60 * 60 * 1000, // 1h cache (matches backend Redis TTL)
});
```

Map `catalog` vers les `<PermissionRow>` avec nouveau prop `status` :
```typescript
{catalog.map((entry) => {
  const IconComponent = ICON_REGISTRY[entry.icon] ?? Shield;
  return (
    <PermissionRow
      key={entry.key}
      permissionKey={entry.key}
      icon={IconComponent}
      alwaysOn={entry.always_on}
      permission={permissionMap[entry.key]}
      isToggling={togglingType === entry.key}
      highlighted={activeHighlight === entry.key}
      status={entry.status}
      maxLevel={entry.max_level}
      onToggle={handleToggle}
      onLevelChange={handleLevelChange}
    />
  );
})}
```

`ICON_REGISTRY` : mapping string → LucideIcon qui reprend les icônes existantes (`ClipboardList`, `RotateCcw`, `CalendarDays`, `Bell`, `FolderOpen`).

**`PermissionRow`** — ajout prop `status` + `maxLevel` :
- Si `status === 'coming_soon'` : Switch `disabled`, Badge "Bientôt" à côté du nom, tooltip "Cette fonctionnalité arrive prochainement"
- `maxLevel` contrôle les options du `<Select>` (1 ou 1-2)

### i18n

Nouvelles clés dans `userDocuments.agent` :
- `comingSoon`: "Bientôt disponible" / "Próximamente" / "Coming soon"
- `comingSoonTooltip`: "Cette fonctionnalité arrive prochainement. Vous serez notifié lors de son activation."

## Fichiers modifiés

| Fichier | Changement |
|---|---|
| `packages/backend/app/modules/chatbot/services/chatbot_tools_authenticated.py` | `AGENT_PERMISSION_CATALOG` constant + cleanup `_TOOL_PERMISSION_MAP` + `submit_prepared_request`/`book_appointment` retournent `feature_coming_soon` |
| `packages/backend/app/modules/user_documents/api/user_documents_routes.py` | Endpoint `GET /agent/permission-catalog` |
| `packages/web/src/modules/user-documents/services/api.ts` | `getAgentPermissionCatalog()` |
| `packages/web/src/modules/user-documents/types.ts` (ou types/index.ts) | Type `AgentPermissionCatalog` |
| `packages/web/src/modules/user-documents/components/AgentSettingsPanel.tsx` | Fetch catalog via useQuery, `ICON_REGISTRY`, `PermissionRow` accepte `status` + `maxLevel`, Badge "Bientôt", Switch disabled |
| `packages/web/messages/{fr,es,en}.json` | `userDocuments.agent.comingSoon` + `comingSoonTooltip` |

## Checklist Phase 4

### Backend
- [x] `AGENT_PERMISSION_CATALOG` constant avec 5 entrées (conforme BD CHECK)
- [x] `_TOOL_PERMISSION_MAP` nettoyé (fantômes `submit_request`/`book_appointment` retirés)
- [x] `submit_prepared_request` retourne `feature_coming_soon` (dead code retiré)
- [x] `book_appointment` retourne `feature_coming_soon` (dead code retiré)
- [x] Endpoint `/agent/permission-catalog` ajouté avec `get_current_user`
- [x] Python syntax OK (`py_compile` 2 fichiers)

### Frontend types
- [x] Type `AgentPermissionCatalogEntry` dans `types/index.ts`
- [x] API client `getAgentPermissionCatalog()` dans `services/api.ts`

### Frontend UI
- [x] `AgentSettingsPanel` : `useQuery` catalog (staleTime 1h)
- [x] `ICON_REGISTRY` string → LucideIcon avec fallback `Shield`
- [x] `PermissionRow` accepte `status` + `maxLevel`
- [x] Badge "Bientôt" amber pour `coming_soon` + tooltip
- [x] Switch disabled + opacity-60 pour `coming_soon`
- [x] `<Select>` options dynamiques `Array.from({length: maxLevel})`
- [x] Skeleton loader `catalogLoading || permissionsLoading`

### i18n
- [x] `comingSoon` en fr (Bientôt) / es (Pronto) / en (Soon)
- [x] `comingSoonTooltip` en fr/es/en

### Validation
- [x] Type-check passe — `tsc --noEmit` EXIT=0
- [x] Lint passe — eslint EXIT=0 (0 errors)
- [x] Python syntax OK — `py_compile` EXIT=0
- [ ] Test SQL direct : `SELECT DISTINCT permission_type FROM user_agent_permissions` (à valider staging)
- [ ] Test endpoint : `curl /agent/permission-catalog` retourne 5 entrées (à valider staging)
- [ ] Test UI : les 3 `coming_soon` affichent Badge + Switch disabled (à valider user)
- [ ] Test UI : `prepare_request` et `prepare_renewal` restent toggleables (à valider user)
- [ ] Test non-régression Phase 2 : gear icon + deep-link ouverture panneau (à valider user)
- [x] Critique post-implémentation : dead code Level 3 supprimé, i18n cohérent, cache partagé backend/frontend 1h
- [ ] Commit local

## Risques & mitigations

| Risque | Mitigation |
|--------|-----------|
| Catalog backend devient désynchronisé avec la BD CHECK | Test Python unitaire qui compare `AGENT_PERMISSION_CATALOG` keys avec la liste hardcodée des 5 types BD |
| Fetch catalog échoue → panneau vide | `useQuery` avec `retry: 1` + fallback : array vide → skeleton puis message "Impossible de charger les permissions" |
| `submit_prepared_request` feature_coming_soon casse le chat qui référencait l'ancien `permission_required` | MessageItem dispatcher déjà robuste — il ignore les statuts inconnus, pas de crash |
| Cache Redis expiré → latence 1er fetch | Cache cold start ~50ms, acceptable ; react-query staleTime 1h côté client |
| Icon registry manque une icône → crash | Fallback sur `Shield` si clé absente |
| 1M+ users qui ouvrent le panneau simultanément | Cache Redis 1h + react-query client cache → seulement 1 fetch/user/heure max |

## Ce qui N'EST PAS dans Phase 4

- Implémentation des tools `auto_classify` / `suggest_appointments` / `proactive_alerts` (Phases 6, 7, 8 dédiées post master-plan)
- Mécanique confirmation_code pour Level 3 executive tools (Phase 5)
- Migration pour étendre la CHECK constraint BD (pas nécessaire — les 5 types suffisent pour Level 1-2)
- Nouvelle table `user_agent_executive_consents` pour Level 3 (Phase 5)

## Estimation

- Backend constant + endpoint : 15 min
- Backend cleanup tools Level 3 : 5 min
- Frontend types + api client : 10 min
- Frontend refactor AgentSettingsPanel : 25 min
- i18n keys : 5 min
- Type-check + lint : 5 min
- Critique + fix : 10 min
- Commit : 2 min
- **Total : ~80 min**
