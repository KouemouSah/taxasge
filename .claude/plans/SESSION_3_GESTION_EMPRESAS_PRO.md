# Session 3 — Gestión de Empresas Professionnel

## Objectif
Refondre la page /admin/companies avec graphes, vue kanban/liste, filtres croisés dynamiques, et KPIs interactifs niveau Sage ERP.

## Prérequis
- Permissions company.* assignées (fait en session 1)
- 50+ companies en BD

## Phases

### Phase 1 : Enrichir les KPIs avec graphes inline ✅
- [x] KPI Total + mini sparkline 6 mois (chart.js Line, pointRadius=0, fill, tension=0.4) + trend "+N este mes"
- [x] KPI Activas + gauge circulaire SVG (GaugeRing component, % avec couleur verte)
- [x] KPI Verificadas + progress bar colorée (vert ≥80%, ambre ≥50%, rouge <50%) + ratio N/total
- [x] KPI Con Licencias + ratio bar orange (cobertura %)
- [x] KPI Deuda Total + badge "Alto riesgo" si > 1M XAF (données depuis analytics.debt_by_fee_type)
- [x] Mini donut régimes (chart.js Doughnut, cutout 65%, légende inline 4 couleurs)
- [x] Badge régime coloré dans table (borderColor + color dynamiques par régime)
- [x] Data sources: `getGlobalStats()` (MV fast) + `getAnalytics()` (MV JSONB) — remplace ancien `getStats()`
- [x] Grid responsive: 2 cols mobile, 3 cols lg, 6 cols xl

### Phase 2 : DataTable avancé ✅
- [x] Filtres multi-critères — search + status + verification + regime + **zone** (dropdown depuis /zones)
- [x] Tri serveur sur 4 colonnes — legal_name, is_active, is_verified, created_at (ArrowUp/Down/UpDown)
- [x] Sélection multiple — Checkbox par ligne + select-all par page + compteur bleu
- [x] Actions bulk — Verificar, Revocar, Clasificar IA (Promise.all parallel) + Cancelar
- [x] Export CSV — BOM UTF-8, headers fixes, filtre par sélection ou tout, download auto
- [x] Badge coloré par régime — bordure + texte colorés (fait en Phase 1, conservé)
- [x] Expand row — ChevronDown toggle, panneau inline: forma, sector/subsector, objeto_social, dirección, miembros, reg. number
- [x] Action Classify par ligne — bouton Brain violet, appel API classify + refresh
- [x] Grid 10 colonnes (checkbox + 9 data)

### Phase 3 : Vue Kanban ✅
- [x] Toggle Liste/Kanban — boutons List/Columns3 dans le header
- [x] Colonnes par regimen_fiscal (4 cols colorées) OU par zone (8 cols max, sélectable via dropdown)
- [x] Cards compactes DnD — nom, NIF, zone, forma badge, verified icon, cursor-grab
- [x] Drag & drop via @dnd-kit — PointerSensor (distance 8px), closestCenter, confirmation dialog
- [x] Drop = reclassification via `/admin/{id}/classify` + refresh KPIs
- [x] DroppableColumn highlight bleu au hover
- [x] Skeleton loading Kanban (4 colonnes × 3 cards pulse)
- [x] Compteur par colonne dans header

### Phase 4 : Filtres croisés dynamiques ✅
- [x] Panneau avancé collapsible — bouton "Más" + ChevronDown toggle, bg-muted/30 border
- [x] Filtres interconnectés — Zone → Villes cascade (filtrées depuis analytics.by_city par zone_code)
- [x] Tags de filtres actifs — Badge removable par filtre (status, verified, regimen, zone, city, search) + "Limpiar todo"
- [x] Sauvegarde filtres favoris — localStorage `admin_companies_filter_presets`, save/load/delete, icône Star
- [x] Export CSV filtré — déjà fait Phase 2 (conservé + bouton Save ajouté à côté)
- [x] `resetAllFilters()` — remet tout à "all" en 1 clic
- [x] cityId ajouté au fetchCompanies (backend city_id param existant)

### Phase 5 : Actions rapides ✅
- [x] DropdownMenu sur chaque ligne — MoreHorizontal trigger, align="end", 6 items
- [x] Ver detalle — Eye icon, router.push vers /admin/companies/[id]
- [x] Abrir en nueva pestaña — ExternalLink icon, window.open _blank
- [x] Verificar / Revocar — ShieldCheck coloré vert/gris selon état, confirm dialog
- [x] Clasificar IA — Brain violet, appel classify + refresh
- [x] Ver licencias — FolderSearch orange, link vers /admin/licenses?company={id}
- [x] Actions column réduite 90px → 50px (juste le bouton MoreHorizontal)

### Validation
- [x] ESLint : 0 erreurs
- [x] TypeScript : 0 erreurs
- [ ] Test avec 50+ companies — tous les filtres fonctionnent
- [ ] Test cascade Zone → Ciudad
- [ ] Test Kanban drag & drop
- [ ] Test bulk actions
- [ ] Test export CSV
- [ ] Test saved presets (localStorage)
