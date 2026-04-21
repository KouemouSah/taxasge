# Plan — Tri sur colonnes pour toutes les tables admin

## Contexte

Audit : 5/21 tables admin ont le tri (24%). Objectif : 100%.
Volume 1M+ utilisateurs : tri server-side obligatoire sur tables paginées.

## Architecture

### Composant réutilisable `SortableHeader`

```tsx
// Usage dans n'importe quelle table :
<SortableHeader column="legal_name" label={t("name")} sort={sort} onSort={setSort} />
```

- Un seul composant, pas de duplication
- Gère l'icône (ArrowUpDown → ArrowUp/ArrowDown)
- Compatible server-side (envoie sort_by/sort_order au backend)
- Compatible client-side (tri local pour petites tables)

### Deux modes

| Mode | Quand | Comment |
|------|-------|---------|
| Server-side | Tables paginées (>100 lignes potentielles) | Query params `sort_by` + `sort_order` → backend ORDER BY |
| Client-side | Tables complètes en mémoire (<50 lignes) | `useMemo` sort sur le tableau local |

## Phases

### Phase 1 — Composant SortableHeader + hook useSortState

Fichiers :
- `packages/web/src/components/ui/sortable-header.tsx` (NEW)
- `packages/web/src/hooks/use-sort-state.ts` (NEW)

### Phase 2 — Tables CRITIQUES (server-side, paginées)

| Table | Fichier | Colonnes triables | Backend endpoint |
|-------|---------|-------------------|------------------|
| Licenses | `admin/licenses/page.tsx` | company, status, totalAmount, amountPaid, complianceScore, fiscalYear, deadline | GET /licenses/ |
| Agents | `admin/agents/page.tsx` | name, role, entity, status, availability | GET /agents/ |
| Users | `admin/users/page.tsx` | name, email, role, status, createdAt | GET /users/ |
| Assignments | `admin/assignments/page.tsx` | agent, status, priority, assignedAt, dueDate | GET /assignments/ |
| Audit Logs | `admin/audit-logs/page.tsx` | timestamp, action, userId, entityType | GET /audit-logs/ |

### Phase 3 — Tables MOYENNES (client-side ou server-side selon volume)

| Table | Fichier | Colonnes triables |
|-------|---------|-------------------|
| Config Rules | `admin/config-rules/page.tsx` | name, configType, specificity, isEnabled |
| Roles | `admin/roles/page.tsx` | name, code, memberCount, isActive |
| Service Bundles | `admin/service-bundles/page.tsx` | name, commerceType, itemCount, isActive |
| Permissions | `admin/permissions/page.tsx` | name, code, module |

### Phase 4 — Tables BASSES (client-side)

| Table | Fichier | Colonnes triables |
|-------|---------|-------------------|
| Email Templates | `admin/communications/email-templates/page.tsx` | name, type, isActive |
| SMS Templates | `admin/communications/sms-templates/page.tsx` | name, type |
| Push Templates | `admin/communications/push-templates/page.tsx` | name, type |
| USSD | `admin/communications/ussd/page.tsx` | name, status |
| Webhooks | `admin/communications/webhooks/page.tsx` | url, status, lastTriggered |
| Support Categories | `admin/support/categories/page.tsx` | name, isActive |
| Translations | `admin/translations/page.tsx` | key, locale |

## Checklist

- [ ] Phase 1 : SortableHeader + useSortState
- [ ] Phase 2 : 5 tables critiques
- [ ] Phase 3 : 4 tables moyennes
- [ ] Phase 4 : 7 tables basses
- [ ] Vérifier que le backend accepte sort_by/sort_order sur chaque endpoint paginé
- [ ] i18n des labels de colonnes
- [ ] Commit local par phase, push après validation
