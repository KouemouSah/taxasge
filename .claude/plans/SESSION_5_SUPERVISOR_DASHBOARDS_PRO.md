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

### Phase 2 : Superviseur Ministère Dashboard (4 onglets)
- [ ] STRATÉGIQUE : KPIs obligations + gauges recouvrement + donut fee_type
- [ ] PILOTAJE : Table cross-zones avec recovery rates + stacked bar
- [ ] OPÉRATIONNEL : Top débiteurs pour SON ministère + alertes overdue
- [ ] CONTRÔLE : Compliance par zone + tendance recouvrement mensuel
- [ ] Line chart multi-séries : paid vs overdue vs penalties (12 mois)

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
