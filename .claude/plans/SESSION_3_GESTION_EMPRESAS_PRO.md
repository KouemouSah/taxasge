# Session 3 — Gestión de Empresas Professionnel

## Objectif
Refondre la page /admin/companies avec graphes, vue kanban/liste, filtres croisés dynamiques, et KPIs interactifs niveau Sage ERP.

## Prérequis
- Permissions company.* assignées (fait en session 1)
- 50+ companies en BD

## Phases

### Phase 1 : Enrichir les KPIs avec graphes inline
- [ ] Remplacer les 4 cards plats (Total, Activas, Verificadas, Con Licencias) par :
  - KPI Total avec mini sparkline (tendance 6 mois)
  - KPI Activas avec gauge circulaire (% actifs)
  - KPI Verificadas avec progress bar colorée
  - KPI Con Licencias avec ratio (licences/total)
  - KPI Deuda Total avec badge alerte si > seuil
  - Mini donut régimes inline

### Phase 2 : DataTable avancé
- [ ] Remplacer la table basique par un DataTable professionnel :
  - Filtres multi-critères en header (search, status, verification, regime, zone, city, forma)
  - Tri sur chaque colonne
  - Sélection multiple (checkboxes) pour actions bulk
  - Actions bulk : vérifier, exporter CSV, reclassifier
  - Badge coloré par régime dans chaque ligne
  - Progress bar mini pour compliance (si licence)
  - Expand row pour voir détails rapides (objeto_social, membres)

### Phase 3 : Vue Kanban
- [ ] Toggle Liste/Kanban
- [ ] Colonnes par regimen_fiscal OU par zone (sélectable)
- [ ] Cards avec : nom, NIF, zone, forma, badge verified, mini stats
- [ ] Drag & drop pour changer de régime (admin only, avec confirmation)
- [ ] Compteur et montant total par colonne

### Phase 4 : Filtres croisés dynamiques (tableau croisé)
- [ ] Panneau filtres en sidebar collapsible
- [ ] Filtres interconnectés : sélectionner une zone filtre les villes disponibles
- [ ] Tags de filtres actifs avec bouton clear
- [ ] Sauvegarde de filtres favoris (localStorage)
- [ ] Export CSV filtré

### Phase 5 : Actions rapides
- [ ] Clic droit / menu actions sur chaque ligne
- [ ] Vérifier / Dé-vérifier
- [ ] Reclassifier (appel classification agent)
- [ ] Voir détail (link vers /admin/companies/[id])
- [ ] Voir licence (si existe)

### Validation
- [ ] 50 companies affichées correctement
- [ ] Tous les filtres fonctionnent (combinés)
- [ ] Kanban affiche les bonnes colonnes
- [ ] Bulk actions fonctionnent
- [ ] Performance : < 200ms pour le rendu
