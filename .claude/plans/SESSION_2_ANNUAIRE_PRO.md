# Session 2 — Annuaire Public Professionnel

## Objectif
Transformer la page /annuaire basique en un annuaire professionnel de production.

## Ce qui a été fait (Session 1B)

### Backend ✅
- [x] `websearch_to_tsquery` + ILIKE fallback (FTS avec stemming)
- [x] Filtres: sector, zona, **forma_juridica**, **provincia**, **ciudad** (cascade)
- [x] Sort dynamique (whitelist: legal_name, city, sector, forma)
- [x] Endpoints: `/provincias`, `/ciudades?provincia=X`, `/formas-juridicas`
- [x] Pagination serveur 20/page
- [x] `Depends(get_database)` (fix await bug)

### Frontend ✅
- [x] Grille 2 colonnes responsive
- [x] Icônes colorées (Building2=bleu, FileText=ambre, Briefcase=émeraude, MapPin=rose)
- [x] Badge Forma Jurídica coloré (S.L.=bleu, Autónomo=émeraude, S.A.=violet, ONG=ambre)
- [x] Panneau filtres avancés (expandable avec chevron)
- [x] Cascade Provincia → Ciudad
- [x] Compteur filtres actifs + bouton "Limpiar"
- [x] Toggle vue grille/liste
- [x] Debounce search 350ms
- [x] Pagination Previous/Next

## Ce qui reste (Session 2)

### Phase 1 : Enrichissement UX ✅
- [x] Tri par colonne (clickable headers en mode liste) — SortHeader avec ArrowUp/Down/UpDown, toggle asc/desc
- [x] SEO : metadata dynamiques — layout.tsx avec generateMetadata (title, description, openGraph, alternates i18n)
- [x] Empty state avec illustration SVG — Buildings skyline + magnifying glass avec "?" (120x120)
- [x] Skeleton loading — CardSkeleton (6 placeholders pulse) remplace le spinner
- [x] Compteurs par forma dans barre filtres — Badges cliquables "S.L. 23" + counts dans dropdown Select
- [x] Traductions ajoutées (es/fr/en) : sortByName/City/Sector/Forma, noResultsHint, metaTitle, metaDescription

### Phase 2 : Vue Kanban ✅
- [x] Toggle Grille/Liste/**Kanban** — 3ème bouton Columns3 dans le toggle bar
- [x] Colonnes par forma_juridica — parallel API fetch per column (10 items/col, 350ms debounce)
- [x] Cards compactes dans chaque colonne — nom, NIF, sector, ciudad (2.5px padding)
- [x] Compteur par colonne — Badge dans le header coloré (utilise formaCounts)
- [x] "+N más →" link en bas de colonne → bascule en grille filtré sur cette forma
- [x] Skeleton loading Kanban (4 colonnes × 3 cards)
- [x] Scroll horizontal + scroll vertical par colonne (max-h 600px)

### Phase 3 : Performance à l'échelle ✅
- [x] Cache Redis sur /search (30s TTL) — `pub_dir:s:{md5}` key, graceful degradation si Redis down
- [x] Cache Redis sur filter endpoints (120s TTL) — zones, sectors, provincias, formas-juridicas
- [x] Cache client React Query (staleTime 60s search, 5min filtres) — `useAnnuaireSearch` hook + 6 hooks filtres
- [x] Prefetch page suivante (hover sur "Next"/"Prev") — `useAnnuairePrefetch` + `onMouseEnter`
- [x] Debounce refactoré — `useDebouncedValue` hook (350ms) remplace setTimeout manual
- [x] Lazy loading images/avatars — N/A (pas d'images actuellement, prêt si ajoutées)
- **Hook** : `packages/web/src/modules/companies/hooks/useAnnuaireSearch.ts` (7 hooks + prefetch helper)

### Phase 4 : Mobile ✅
- [x] Cards plein-largeur sur mobile — `grid-cols-1 md:grid-cols-2` (déjà OK)
- [x] Filtres en bottom sheet — `Sheet side="bottom"` sur mobile (`sm:hidden`), inline chevron sur desktop (`hidden sm:inline-flex`)
- [x] `FilterControls` composant partagé — bottom sheet + desktop inline utilisent les mêmes contrôles
- [x] Recherche sticky en haut — `sticky top-0 z-10 bg-white/95 backdrop-blur-sm` sur mobile, `static` sur desktop
- [x] Touch-friendly pagination — boutons `h-10 w-10` sur mobile (44px touch target), `h-8` sur desktop
- [x] Header responsive — icône 40px/48px, titre xl/2xl, sous-titre xs/sm
- [x] Kanban snap scroll — `snap-x snap-mandatory` sur mobile, désactivé desktop
- [x] Kanban masqué sur mobile — bouton toggle Columns3 `hidden sm:block`
- [x] Compteur résultats abrégé — juste le nombre sur mobile, "+ results" sur desktop
- [x] Cards `active:shadow-sm` — feedback tactile

### Validation
- [ ] Test avec 50+ companies — tous les filtres fonctionnent
- [ ] Test cascade Provincia → Ciudad
- [ ] Test performance : debounce < 400ms, réponse < 200ms
- [ ] Test mobile responsive
- [ ] ESLint : 0 erreurs
- [ ] TypeScript : 0 erreurs
