# Session 5 — Refonte Dashboards Superviseur + Agent

## Objectif
Refondre les dashboards superviseur site, superviseur ministère, et les pages agent (lookup, debt) au niveau Sage ERP avec graphes interactifs et données croisées.

## Prérequis
- Endpoint /dashboard/analytics (fait)
- Permissions assignées (fait)
- Données seed (fait)

## Phases

### Phase 1 : Superviseur Site Dashboard (4 onglets) ✅
- [x] STRATÉGIQUE : 4 KPIs avec GaugeRing SVG (total, recovery, dette, licences) + donut régimes + line chart tendance 6 mois (creadas/verificadas)
- [x] PILOTAJE : Table entreprises avec 3 filtres avancés (search debounce, régimen, vérification) + colonnes clickables → détail + pagination + compteur
- [x] OPÉRATIONNEL : 3 cartes alertes colorées (non-vérifié jaune, dette rouge, sans identifiant orange) + actions prioritaires contextuelles (recovery <40%, pendiente, non-vérifié) + état vert si tout OK
- [x] CONTRÔLE : 5 gauges SVG (vérification, recovery, NIF, identifiants, bundles) + section anomalies zone avec XCircle/CheckCircle conditionnels
- [ ] Carte SVG zone → Phase 5 (séparée)
- **Fix prérequis** : Migration 242 — MV mv_company_stats_by_zone restaurée (zone_name, verified_companies, dette, licences, identifiants — 25 colonnes)
- **Type** : ZoneStats enrichi (+verified_companies, +inactive_companies, +with_nif, +with_reg_number, +with_zone, +missing_identifier)

### Phase 2 : Superviseur Ministère Dashboard (4 onglets) ✅
- [x] STRATÉGIQUE : 5 KPIs (total, paid+gauge, overdue, recovery, pénalités) + donut fee_type + stacked bar recovery par zone
- [x] PILOTAJE : Table cross-zones 9 colonnes (zone, fee_type, companies, obligations, paid, overdue, pénalités, total, recovery badge coloré)
- [x] OPÉRATIONNEL : Top 5 zones endettées avec progress bar recovery + alertes overdue triées par montant
- [x] CONTRÔLE : Grille gauges SVG recovery par zone (9 gauges) + bar chart pénalités par zone + anomalies (recovery <40%, zones <20%, pénalités élevées)
- [x] 4 tabs (était 3) — ajout onglet Control avec ShieldAlert icon

### Phase 3 : Agent ONRC Lookup enrichi
- [ ] Résultats avec plus de détails (licence status, dernière classification, date création)
- [ ] Historique des recherches récentes (localStorage)
- [ ] Export résultat en PDF (fiche entreprise rapide)
- [ ] Badge "À jour" / "En retard" basé sur les obligations

### Phase 4 : Agent Ministry Debt enrichi
- [ ] Graphe donut répartition paid/pending/overdue pour l'entreprise
- [ ] Timeline paiements (line chart montant cumulé vs dû)
- [ ] Bouton "Envoyer relance" (lié au système de notifications)
- [ ] Print-friendly layout pour impression du détail obligation

### Phase 5 : Carte SVG GE (remplacement Leaflet)
- [ ] Composant SVG pur des 8 provinces de GE (pas Leaflet)
- [ ] Coloré par : nb entreprises, dette, recouvrement (sélectionnable)
- [ ] Tooltip on hover avec KPIs
- [ ] Click → filtre les données du dashboard à cette zone
- [ ] Intégré dans admin dashboard Pilotaje + superviseur Stratégique

### Validation
- [ ] Chaque dashboard testé avec données seed
- [ ] Responsive mobile vérifié
- [ ] Performance < 300ms pour le rendu
- [ ] Lint : 0 erreurs
