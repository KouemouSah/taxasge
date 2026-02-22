# Plan : TESORO — Site-Based Routing + Dashboard Dynamisation

## Contexte

Le Tesoro (Treasury) est une entite transversale qui valide les paiements de TOUTES les entites.
Elle fonctionne en mode **module-based** (`roles.menu_config` = JSON explicite, `workflow_codes = []`).

### Problemes identifies (audit 3 agents paralleles)

| # | Severite | Probleme | Impact |
|---|----------|----------|--------|
| 1 | **P0** | `entity_locations.entity_id = NULL` pour les **16 lignes** (pas juste TESORO) | Site-based routing casse pour TOUTES les entites via FK |
| 2 | **P0** | `PaymentAssignmentHandler` ne route pas par site | Agent Bata recoit paiements Malabo |
| 3 | **P1** | `/treasury/payments/pending` et `/dashboard-stats` sans filtre location | Agent voit tout, pas son site |
| 4 | **P1** | `payment_sla_service` emails a TOUS les agents TESORO | Bruit pour agents d'autres sites |
| 5 | **P1** | Dashboard `treasury/page.tsx` = 356 lignes hardcodees (9 cards + 4 stats) | Admin ne peut pas modifier sans code |
| 6 | **P1** | Page validation sans filtre location | Pas de scoping geographique |
| 7 | **P2** | 3 widgets manquants dans WidgetRegistry (`in_progress_payments`, `my_escalations`, `recent_activity`) | `dashboard_config` definit 5 widgets mais seuls 2 sont enregistres |

### Architecture actuelle

- **Sidebar menu** : Dynamique (JSON dans `roles.menu_config` -> API `/menu-config/me` -> `GenericAgentSidebar`)
- **Dashboard page** : HARDCODE (9 Quick Action cards + 4 stat cards dans `treasury/page.tsx`)
- **Widget system** : Existe (`GenericEntityDashboard` + `DynamicDashboard` + `WidgetRegistry`) mais TESORO ne l'utilise pas
- **Roles** : `agent_tesoro` (38 perms) + `supervisor_tesoro` (42 perms) — separation existe deja
- **Data** : 1 agent, 0 superviseur, 11 paiements bloques en `pending_agent_review`
- **Patterns existants** : `agent_queue_handler.py:176` = gold standard site-based routing

---

## Phase 0 — Fix Data (P0, prerequisite)

### Migration 118 : Backfill `entity_locations.entity_id`

**Fichier** : `packages/backend/database/migrations/118_backfill_entity_locations_entity_id.sql`

```sql
-- Backfill entity_id for ALL 16 entity_locations rows
-- Migration 058 had set entity_id = NULL. Never restored.
UPDATE entity_locations el
SET entity_id = e.id
FROM entities e
WHERE e.code = el.entity_code
  AND e.is_active = true
  AND el.entity_id IS NULL;

-- Verify
DO $$
DECLARE orphan_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO orphan_count FROM entity_locations WHERE entity_id IS NULL;
    IF orphan_count > 0 THEN
        RAISE WARNING '% entity_locations still have NULL entity_id', orphan_count;
    ELSE
        RAISE NOTICE 'All entity_locations.entity_id populated OK';
    END IF;
END $$;
```

**Verification** : `SELECT entity_code, entity_id IS NOT NULL as has_id FROM entity_locations` -> toutes les lignes = true

---

## Phase 1 — Payment Routing par Site (P0, backend)

### Refactor `PaymentAssignmentHandler` pour utiliser `AutoAssignmentService`

**Fichier** : `packages/backend/app/modules/payments/handlers/payment_assignment_handler.py`

**Probleme** : Raw SQL (lignes 111-133) filtre par `entity_id` seulement, duplique la logique de `workload_repository.get_available_agents()`.

**Solution** : Remplacer le SQL brut par un appel a `AutoAssignmentService.auto_assign_item()` qui supporte deja `entity_location_id` avec fallback (site exact -> floating agents -> entity-wide).

**Changes** :
1. Extraire `entity_location_id` depuis `service_requests` (le handler recoit deja `service_request_id` dans le payload)
2. Appeler `auto_assign_item(entity_code='TESORO', entity_location_id=location_id)`
3. Supprimer le SQL brut de selection d'agent (lignes 111-133)
4. Garder la mise a jour de `service_payments.assigned_agent_id` et le duplicate check

**Pattern de reference** : `agent_queue_handler.py:176` :
```python
entity_location_id=sr["entity_location_id"]  # Gold standard
```

**Fichier modifie** : 1 fichier, ~30 lignes nettes

---

## Phase 2 — Scoping Endpoints par Site (P1, backend)

### 2A : `/treasury/payments/pending` — Ajouter filtre location

**Fichier** : `packages/backend/app/modules/service_requests/api/admin_routes.py` (lignes 3096-3296)

**Changes** :
1. Lookup `agent_location_id` depuis `agent_profiles` pour l'agent courant (non-supervisor)
2. Ajouter `WHERE sr.entity_location_id = $N` pour agents site-bound
3. Ajouter param optionnel `entity_location_id` pour superviseurs (filtre volontaire)
4. Ajouter `LEFT JOIN entity_locations el_site ON el_site.id = sr.entity_location_id` au SELECT
5. Exposer `location_name` dans la reponse

### 2B : `/treasury/payments/dashboard-stats` — Scoper par site

**Fichier** : Meme fichier (lignes 4318-4360)

**Changes** :
1. Ajouter `JOIN service_requests sr ON sr.id = sp.service_request_id`
2. Filtrer par `sr.entity_location_id` pour agents site-bound
3. Agents floating (entity_location_id IS NULL) = stats system-wide (statu quo)

### 2C : SLA emails — Ajouter colonne location

**Fichier** : `packages/backend/app/modules/payments/services/payment_sla_service.py`

**Approche pragmatique** (v1) : Garder l'envoi blanket mais ajouter la colonne "Sede" (nom du site) dans les tableaux HTML des emails SLA. Les agents voient a quel site appartient chaque paiement.

**Changes** :
1. Dans `_process_warnings()` et `_process_escalations()` : JOIN `service_requests sr` + `entity_locations el` pour recuperer `location_name`
2. Ajouter colonne "Sede" dans le HTML table

**Fichiers modifies** : 2 fichiers, ~60 lignes

---

## Phase 3 — Dashboard Dynamisation (P1, frontend)

### Remplacer le dashboard hardcode par menu_config + widgets

**Fichier** : `packages/web/src/app/[locale]/(dashboard)/dashboard/agent/treasury/page.tsx`

**Approche hybride** :
1. **Stats cards** (4) : GARDER — deja API-driven via `useTreasuryStats()`, specifiques au TESORO
2. **Quick Action cards** (9) : REMPLACER par derivation depuis `menu_config.menus`
3. **Widgets section** : AJOUTER via `DynamicDashboard` + `dashboard_config`

**Implementation** :

```tsx
// Imports
import { useMenuConfig } from '@/modules/agent-dashboard/hooks/useMenuConfig';
import { DynamicDashboard } from '@/modules/agent-dashboard/components/DynamicDashboard';
import { renderWidget } from '@/modules/agent-dashboard/components/widgets/WidgetRegistry';
import { iconMap } from '@/modules/agent-dashboard/utils/menu-helpers';

// Dans le composant :
const { menuConfig, dashboardConfig } = useMenuConfig();

// Quick actions derivees du menu
const quickActions = useMemo(() => {
  if (!menuConfig?.menus) return [];
  return menuConfig.menus
    .filter(m => m.id !== 'dashboard' && m.id !== 'settings')
    .flatMap(menu => menu.items?.length
      ? menu.items.slice(0, 2)  // 2 premiers sous-items par groupe
      : [menu]                   // item direct si pas de sous-menu
    );
}, [menuConfig]);

// Render quick actions (remplace les 9 cards hardcodees)
{quickActions.map(action => (
  <Card key={action.id} className="hover:shadow-md transition-shadow">
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        {iconMap[action.icon] && createElement(iconMap[action.icon], { className: "h-5 w-5" })}
        {t(action.titleKey)}
      </CardTitle>
    </CardHeader>
    <CardContent>
      <Link href={`/${locale}${action.href}`}>
        <Button variant="outline" className="w-full">
          {t('actions.view')} <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </Link>
    </CardContent>
  </Card>
))}

// Widgets section
{dashboardConfig && (
  <DynamicDashboard
    config={dashboardConfig}
    renderWidget={(widget) => renderWidget(widget.id, 'TESORO' as EntityCode, widget)}
  />
)}
```

**Resultat** :
- Admin ajoute un item dans `roles.menu_config` -> carte Quick Action apparait automatiquement
- Admin configure `roles.dashboard_config` widgets -> widgets apparaissent automatiquement
- Les 4 stat cards restent (API-driven, specifiques au TESORO)

**Fichier modifie** : 1 fichier, de 356 lignes -> ~180 lignes (reduction ~50%)

---

## Phase 4 — Filtre Location sur Page Validation (P1, frontend)

### 4A : Hook + API — Ajouter `entityLocationId`

**Fichiers** :
- `packages/web/src/modules/treasury/types/treasury.ts` : +`entityLocationId?: string` dans `PendingPaymentsParams`, +`locationName?: string` dans `PendingPayment`
- `packages/web/src/modules/treasury/services/api.ts` : mapper `entityLocationId` -> `entity_location_id` dans query params

### 4B : Nouveau hook `useTreasuryLocations`

**Fichier** : `packages/web/src/modules/treasury/hooks/useTreasuryLocations.ts`

```typescript
export function useTreasuryLocations() {
  return useQuery<{ id: string; name: string; city: string }[]>({
    queryKey: ['treasury', 'locations'],
    queryFn: () => fetchClient.get('/admin/service-requests/treasury/locations'),
    staleTime: 5 * 60 * 1000,
  });
}
```

### 4C : Backend endpoint locations

**Fichier** : `packages/backend/app/modules/service_requests/api/admin_routes.py`

```python
@router.get("/treasury/locations")
async def get_treasury_locations(db, current_user, _perm):
    rows = await db.fetch("""
        SELECT el.id, el.location_name, el.city
        FROM entity_locations el
        JOIN entities e ON e.id = el.entity_id
        WHERE e.code = 'TESORO' AND el.is_active = true
        ORDER BY el.city, el.location_name
    """)
    return [dict(r) for r in rows]
```

### 4D : Page validation — Ajouter filtre + colonne

**Fichier** : `packages/web/src/app/[locale]/(dashboard)/dashboard/agent/treasury/validation/page.tsx`

1. State : `const [locationFilter, setLocationFilter] = useState<string>('all');`
2. Select dropdown dans la barre de filtres (a cote de status/method/SLA)
3. Passer `entityLocationId` a `usePendingPayments()`
4. Ajouter colonne "Sede" dans le tableau

**Fichiers modifies** : 5 fichiers, ~50 lignes

---

## Phase 5 — Enregistrement Widgets Manquants (P2, frontend)

### Ajouter les 3 widgets manquants dans WidgetRegistry

**Fichier** : `packages/web/src/modules/agent-dashboard/components/widgets/WidgetRegistry.tsx`

Le `dashboard_config` du role `agent_tesoro` definit 5 widgets :
- `pending_payments` -> ✅ deja enregistre
- `in_progress_payments` -> ❌ manquant
- `completed_payments` -> ❌ manquant
- `my_escalations` -> ❌ manquant (alias de `escalations`)
- `recent_activity` -> ❌ manquant

**Changes** :
1. Parametriser `PendingPaymentsWidget` pour accepter un `statusFilter` optionnel
2. Ajouter dans le registry :

```typescript
in_progress_payments: ({ className }) => (
  <PendingPaymentsWidget className={className} statusFilter="agent_reviewing" />
),
completed_payments: ({ className }) => (
  <PendingPaymentsWidget className={className} statusFilter="completed" />
),
my_escalations: ({ entityCode, className }) => (
  <EscalationsWidget entityCode={entityCode} className={className} myOnly />
),
recent_activity: ({ className }) => (
  <RecentActivityWidget className={className} />
),
```

3. Creer `RecentActivityWidget` (leger : 5 dernieres actions depuis l'audit trail)

**Fichiers modifies** : 2-3 fichiers, ~80 lignes

---

## Resume

| Phase | Priorite | Fichiers | Lignes nettes | Impact |
|-------|----------|----------|---------------|--------|
| 0. Data Fix | P0 | 1 migration | +15 | FK entity_locations repare pour 16 lignes |
| 1. Payment Routing | P0 | 1 backend | ~+30/-40 | Paiements routes par site (fallback entity-wide) |
| 2. Endpoint Scoping | P1 | 2 backend | ~+60 | Agents voient leur site, superviseurs voient tout |
| 3. Dashboard Dynamic | P1 | 1 frontend | ~-170 | Quick actions depuis menu_config + widgets depuis dashboard_config |
| 4. Location Filter | P1 | 5 (1 BE + 4 FE) | ~+50 | Filtre site sur page validation |
| 5. Widget Registration | P2 | 2-3 frontend | ~+80 | 3 widgets manquants pour dashboard_config complet |
| **Total** | | **~12 fichiers** | **~+25 net** | |

## Ordre d'implementation

1. Phase 0 (data fix — prerequisite)
2. Phase 1 (payment routing — P0)
3. Phase 2A+2B (endpoint scoping — P1)
4. Phase 3 (dashboard dynamic — P1, independant)
5. Phase 2C (SLA emails — P1)
6. Phase 4 (location filter frontend — P1)
7. Phase 5 (widgets — P2)

Un commit par phase, push apres chaque commit.

## Verification

- [ ] `SELECT entity_id IS NOT NULL FROM entity_locations` -> 16/16 = true
- [ ] Paiement cash cree avec service_request.entity_location_id -> assigne a agent du meme site
- [ ] Agent TESORO non-supervisor : `/treasury/payments/pending` retourne seulement son site
- [ ] Superviseur TESORO : `/treasury/payments/pending` retourne tout (+ filtre optionnel)
- [ ] `/treasury/payments/dashboard-stats` scope par site pour agent, global pour supervisor
- [ ] Dashboard page : quick actions derivees du menu_config (pas hardcodees)
- [ ] Dashboard page : widgets rendus depuis dashboard_config
- [ ] Page validation : filtre "Sede" fonctionnel avec dropdown des locations TESORO
- [ ] TS check : 0 erreurs
- [ ] Python syntax : tous les .py modifies compilent
