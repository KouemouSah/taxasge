# Session 2 — Annuaire Public Professionnel

## Objectif
Transformer la page /annuaire basique en un annuaire professionnel de production avec vues kanban/liste, filtres avancés, et UX optimale.

## Prérequis
- Session 1 terminée (page /annuaire existe, endpoint backend fonctionne)
- 50+ companies en BD (seed data appliqué)

## Phases

### Phase 1 : Backend — Filtres avancés + agrégations
- [ ] Ajouter endpoint `GET /public/companies/stats` — compteurs par zone, secteur, régime
- [ ] Enrichir `/public/companies/search` avec filtres :
  - `forma_juridica` (dropdown)
  - `regimen_fiscal` (dropdown)
  - `provincia` (dropdown)
  - `Localidad` (dropdown)
  - `sort_by` (legal_name, regimen_fiscal, zone_code, tipo_comercio)
  - `sort_order` (asc/desc)
- [ ] Pagination cursor-based (pas OFFSET pour 1M+)

### Phase 2 : Frontend — Vue Liste professionnelle
- [ ] Remplacer les cards basiques par un DataTable riche :
  - Colonnes : Nom, NIF/PE, Localidad, Provincia, Zone, Sector, Régimen, Forme Juridique
  - Tri sur chaque colonne (clickable header)
  - Recherche globale + filtres par colonne
  - Pagination avec compteur total
- [ ] Header stats : Total, par régime (mini badges), par zone (top 5)
- [ ] Mode "sans scroll" — table avec hauteur fixe et scroll interne

### Phase 3 : Frontend — Vue Kanban
- [ ] Toggle Liste/Kanban dans le header
- [ ] Vue Kanban : colonnes par régimen_fiscal (Bundle, Declarativo, Mixto, Exento)
- [ ] Chaque card : nom, NIF, localidad, sector, badge zone
- [ ] Compteur par colonne
- [ ] Drag disabled (lecture seule pour le public)

### Phase 4 : Design professionnel
- [ ] Barre de recherche proéminente avec icône et placeholder
- [ ] Filtres en ligne (pas de sidebar) — dropdowns compacts
- [ ] Cards résultats avec hover effect, shadow, badges colorés
- [ ] Empty state professionnel (illustration + message)
- [ ] SEO : metadata, title, description dynamiques
- [ ] Responsive : mobile-first, cards empilées

### Validation
- [ ] Test avec 50 companies — vérifier tous les filtres
- [ ] Test performance : recherche debounce < 300ms
- [ ] Test mobile : layout responsive
- [ ] Lint : 0 erreurs
