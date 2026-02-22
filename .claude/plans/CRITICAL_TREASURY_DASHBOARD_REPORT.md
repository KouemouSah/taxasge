# RAPPORT CRITIQUE - Dashboard TESORO (Treasury) Agent
**Date**: 2026-02-22/23
**Statut**: CORRIGE - Toutes les corrections appliquées, en attente de déploiement

---

## Résumé Exécutif

Le dashboard agent TESORO (Treasury) présente **5 erreurs critiques** qui rendent la majorité des fonctionnalités inutilisables. Les agents TESORO ne peuvent actuellement ni voir les statistiques, ni charger la liste de validation des paiements, ni naviguer correctement vers les sous-pages.

**Impact**: 3 endpoints backend en 500, 1 endpoint en 404, navigation frontend cassée.

---

## Erreurs Identifiées

### CRITIQUE #1: SQL Type Mismatch — `user_role_enum = character varying` (500)

**Endpoints affectés**:
- `GET /admin/service-requests/treasury/stats/dashboard` (admin_routes.py:4751)
- `GET /admin/service-requests/treasury/payments/pending` (admin_routes.py:3164)

**Cause racine**: Après la migration 048, la colonne `users.role` a été convertie en ENUM (`user_role_enum`) avec seulement 6 valeurs: `citizen, business, accountant, admin, agent, funcionario`. Tous les agents ont `role = 'agent'`.

**Code fautif** (identique dans les 2 endpoints):
```sql
-- FAUX: admin_routes.py:3170-3174 et 4757-4761
SELECT 1 FROM roles r
JOIN role_permissions rp ON rp.role_id = r.id
JOIN permissions p ON p.id = rp.permission_id
JOIN users u ON u.role = r.code           -- ❌ ENUM vs VARCHAR = crash asyncpg
WHERE u.id = $1::uuid AND p.name = 'treasury.view_all'
```

**Erreur asyncpg**: `UndefinedFunctionError: operator does not exist: user_role_enum = character varying`

**Même si on castait en TEXT**: `u.role::text` = `'agent'` mais `r.code` = `'agent_tesoro'` → **JAMAIS de match**. La logique est doublement fausse.

**Pattern correct** (utilisé partout ailleurs dans le codebase, ex: `user_permission_repository.py:427`):
```sql
-- CORRECT: via role_id FK
JOIN users u ON u.role_id = r.id          -- ✅ UUID FK join
```

**Fichier de référence**: `packages/backend/app/modules/permissions/repositories/user_permission_repository.py:427`

---

### CRITIQUE #2: Entity Code Mismatch — `TREASURY` vs `TESORO` (404)

**Endpoint affecté**:
- `GET /agent/service-requests/entity/TREASURY/requests` → 404

**Cause racine**: Le slug URL `treasury` est converti en code entité `TREASURY` par `slugToEntityCode()`:

```typescript
// packages/web/src/modules/agent-dashboard/utils/entity-url.ts:17
export function slugToEntityCode(slug: string): EntityCode {
  return slug.toUpperCase().replace(/-/g, '_') as EntityCode;  // 'treasury' → 'TREASURY'
}
```

**Mais le code entité en BD est `TESORO`** (vérifié directement en BD):
```
| code    | name            | entity_type | is_active |
|---------|-----------------|-------------|-----------|
| TESORO  | Tesoro Publico  | entity      | true      |
```

**Où le problème se manifeste**:
- La page "Dossiers Pendientes" (screenshot tge2.png) utilise le composant générique `[entityCode]` route
- Le paramètre URL `treasury` → `slugToEntityCode('treasury')` → `TREASURY`
- Le backend cherche `WHERE code = 'TREASURY'` → **pas de résultat** → 404

**Note**: La page principale `treasury/page.tsx:35` utilise correctement `TREASURY_ENTITY_CODE = 'TESORO'`, mais le problème vient du routing dynamique generic.

---

### CRITIQUE #3: Double Locale dans Navigation (404 Frontend)

**URL cassée**: `/es/es/dashboard/agent/treasury/escalations` → 404

**Cause racine**: Construction du href dans les quick actions (`treasury/page.tsx:199-201`):

```typescript
const href = action.href?.startsWith('/')
  ? `/${locale}${action.href}`   // Si href = '/es/dashboard/agent/treasury/escalations'
  : action.href || '#';          // → Résultat: '/es/es/dashboard/agent/treasury/escalations'
```

**Problème**: Si le backend `menu_config` retourne des hrefs déjà préfixés avec la locale (ex: `/es/dashboard/agent/treasury/validation`), le frontend ajoute une 2e fois la locale.

**Vérification nécessaire**: Format exact des `href` dans `roles.menu_config` JSON pour le rôle `agent_tesoro`.

---

### HIGH #4: Page Validation 500 — Même SQL que #1

**Page**: "Validación de Pagos" (screenshot tge3.png) → "Error al cargar los pagos pendientes"

**Cause**: Identique au bug #1. L'endpoint `GET /treasury/payments/pending` crash au même point (`is_supervisor` query).

---

### HIGH #5: Page Transactions Error

**Page**: "Historial de Transacciones" (screenshot tge4.png) → "Error al cargar el historial"

**Cause probable**: Endpoint transactions potentiellement affecté par le même pattern SQL, ou endpoint manquant. À investiguer (peut être lié aux widgets `pending-payments` qui eux fonctionnent via un endpoint différent).

---

## Analyse Architecture

### Ce qui FONCTIONNE

| Composant | Endpoint | Status |
|-----------|----------|--------|
| Widget "Pagos Pendientes" | `/agent/service-requests/dashboard/widgets/pending-payments` | ✅ OK (5 paiements visibles) |
| Widget "Pagos En Revisión" | même endpoint avec `workflow_status=locked_by_agent` | ✅ OK |
| Widget "Pagos Completados" | même endpoint avec `workflow_status=completed` | ✅ OK |
| Menu sidebar | `/menu-config/me` | ✅ OK |
| Authentication | JWT + permissions cache | ✅ OK |

### Ce qui NE FONCTIONNE PAS

| Composant | Endpoint | Erreur | Cause |
|-----------|----------|--------|-------|
| Stats dashboard | `GET /treasury/stats/dashboard` | 500 | SQL type mismatch (#1) |
| Liste paiements validation | `GET /treasury/payments/pending` | 500 | SQL type mismatch (#1) |
| Dossiers Pendientes | `GET /entity/TREASURY/requests` | 404 | Entity code mismatch (#2) |
| Navigation quick actions | Frontend routing | 404 | Double locale (#3) |
| Historial transacciones | TBD | Error | À investiguer (#5) |

### Configuration BD TESORO (vérifiée)

**Entity**: `TESORO` (code), `Tesoro Publico` (name), `entity` type, `workflow_codes = []` (vide = gère paiements transversalement)

**Roles**:
| Code | Permissions |
|------|-------------|
| `agent_tesoro` | 23 permissions (treasury.*, payment.*, receipt.*) |
| `supervisor_tesoro` | 55 permissions (+audit, +anomaly, +export, +assignment, +reports) |

**Enum `user_role_enum`**: `citizen, business, accountant, admin, agent, funcionario` (PAS de `treasury_agent`)

**Join path correct**: `users.role_id` → `roles.id` (UUID FK, PAS `users.role = roles.code`)

---

## Plan de Correction

### Phase 1: Fix Backend SQL (CRITIQUE - 2 endpoints)

**Fichier**: `packages/backend/app/modules/service_requests/api/admin_routes.py`

#### 1.1 Fix `get_treasury_dashboard_stats` (ligne 4751-4763)

**Avant** (FAUX):
```sql
SELECT EXISTS(
    SELECT 1 FROM user_permissions up
    JOIN permissions p ON p.id = up.permission_id
    WHERE up.user_id = $1::uuid AND p.name = 'treasury.view_all'
    UNION
    SELECT 1 FROM roles r
    JOIN role_permissions rp ON rp.role_id = r.id
    JOIN permissions p ON p.id = rp.permission_id
    JOIN users u ON u.role = r.code
    WHERE u.id = $1::uuid AND p.name = 'treasury.view_all'
)
```

**Après** (CORRECT):
```sql
SELECT EXISTS(
    SELECT 1 FROM user_permissions up
    JOIN permissions p ON p.id = up.permission_id
    WHERE up.user_id = $1::uuid AND p.name = 'treasury.view_all'
    UNION
    SELECT 1 FROM users u
    JOIN roles r ON u.role_id = r.id
    JOIN role_permissions rp ON rp.role_id = r.id
    JOIN permissions p ON p.id = rp.permission_id
    WHERE u.id = $1::uuid AND p.name = 'treasury.view_all'
)
```

- [ ] Corriger ligne 4757-4761
- [ ] Vérifier que `users.role_id` existe (confirmé par user_permission_repository.py)
- [ ] Tester avec un user agent_tesoro et un supervisor_tesoro

#### 1.2 Fix `get_pending_payments` (ligne 3164-3176)

Même correction exacte.

- [ ] Corriger ligne 3170-3174
- [ ] Tester endpoint GET /treasury/payments/pending
- [ ] Vérifier que les filtres agent/supervisor fonctionnent

#### 1.3 Audit des autres requêtes treasury

- [ ] Grep `u.role = r.code` dans TOUT admin_routes.py
- [ ] Corriger TOUTES les occurrences

### Phase 2: Fix Entity Code Mapping (Frontend)

**Fichier**: `packages/web/src/modules/agent-dashboard/utils/entity-url.ts`

#### 2.1 Ajouter mapping override pour TESORO

```typescript
// Mapping des slugs URL vers les codes entité BD (quand convention != slug.toUpperCase())
const SLUG_OVERRIDES: Record<string, EntityCode> = {
  'treasury': 'TESORO',
};

export function slugToEntityCode(slug: string): EntityCode {
  const override = SLUG_OVERRIDES[slug.toLowerCase()];
  if (override) return override;
  return slug.toUpperCase().replace(/-/g, '_') as EntityCode;
}
```

- [ ] Implémenter override
- [ ] Vérifier que les pages generiques `/[entityCode]/[workflowGroup]/[action]` fonctionnent pour TESORO

### Phase 3: Fix Double Locale Navigation (Frontend)

**Fichier**: `packages/web/src/app/[locale]/(dashboard)/dashboard/agent/treasury/page.tsx`

#### 3.1 Corriger la construction des href

```typescript
// AVANT (ligne 199-201):
const href = action.href?.startsWith('/')
  ? `/${locale}${action.href}`
  : action.href || '#';

// APRÈS:
const rawHref = action.href || '#';
// Avoid double locale prefix
const localePrefix = `/${locale}/`;
const href = rawHref.startsWith(localePrefix)
  ? rawHref  // Already has locale
  : rawHref.startsWith('/')
    ? `/${locale}${rawHref}`
    : rawHref;
```

- [ ] Implémenter fix
- [ ] Vérifier les hrefs retournés par `/menu-config/me` pour agent_tesoro
- [ ] Tester navigation Mis Estadísticas, Validación, Mis Escalaciones

### Phase 4: Audit Complet des Patterns Treasury

- [ ] Grep `u.role = r.code` et `u.role =` dans TOUT le backend
- [ ] Vérifier TOUS les endpoints treasury pour le même pattern
- [ ] Vérifier l'endpoint transactions
- [ ] Vérifier l'endpoint escalations backend
- [ ] Tester end-to-end: login agent_tesoro → dashboard → navigation → actions

---

## Checklist de Validation

- [ ] `GET /treasury/stats/dashboard` retourne 200 avec données
- [ ] `GET /treasury/payments/pending` retourne 200 avec liste paginée
- [ ] `GET /entity/TESORO/requests` retourne 200 (ou empty list si pas de workflow)
- [ ] Navigation quick actions: pas de double locale
- [ ] Statistiques dashboard affichent les vrais chiffres (pas tous à 0)
- [ ] Page validation affiche la liste des paiements pendants
- [ ] Page escalations accessible sans 404
- [ ] Page transactions charge l'historique

---

## Screenshots de Référence

| Screenshot | Page | Erreur visible |
|------------|------|----------------|
| tge.png | Dashboard principal | "Error al cargar estadísticas", stats à 0, console 500+404 |
| tge1.png | Dashboard scrollé | Même erreurs, Pagos Pendientes widget OK |
| tge2.png | Dossiers Pendientes | "Error al cargar la lista" (404 entity TREASURY) |
| tge3.png | Validación de Pagos | "Error al cargar los pagos pendientes" (500 SQL) |
| tge4.png | Historial Transacciones | "Error al cargar el historial" |
