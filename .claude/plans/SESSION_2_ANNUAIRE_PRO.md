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

### Phase 1 : Enrichissement UX
- [ ] Tri par colonne (clickable headers en mode liste)
- [ ] SEO : metadata dynamiques (title, description par recherche)
- [ ] Empty state avec illustration SVG (pas juste icône+texte)
- [ ] Skeleton loading (au lieu du spinner)
- [ ] Compteurs par forma dans la barre de filtres (badges: "S.L. (23)", "Autónomo (10)")

### Phase 2 : Vue Kanban (optionnel)
- [ ] Toggle Grille/Liste/**Kanban**
- [ ] Colonnes par forma_juridica (Autónomo, S.L., S.A., ONG)
- [ ] Cards compactes dans chaque colonne
- [ ] Compteur par colonne
- [ ] NOTE: "mixto" supprimé, Kanban par forma (pas par régime)

### Phase 3 : Performance à l'échelle
- [ ] Cache Redis sur /search (30s TTL) pour les requêtes populaires
- [ ] Cache client React Query (staleTime 60s)
- [ ] Prefetch page suivante (hover sur "Next")
- [ ] Lazy loading images/avatars (si ajoutées plus tard)

### Phase 4 : Mobile
- [ ] Cards plein-largeur sur mobile (grid-cols-1)
- [ ] Filtres en bottom sheet (pas inline)
- [ ] Recherche sticky en haut
- [ ] Touch-friendly pagination

### Validation
- [ ] Test avec 50+ companies — tous les filtres fonctionnent
- [ ] Test cascade Provincia → Ciudad
- [ ] Test performance : debounce < 400ms, réponse < 200ms
- [ ] Test mobile responsive
- [ ] ESLint : 0 erreurs
- [ ] TypeScript : 0 erreurs
