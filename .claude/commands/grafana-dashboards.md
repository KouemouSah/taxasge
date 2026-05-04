---
description: Invoke the Grafana Dashboards Agent to design + build + push production-grade dashboards on this project. Reusable across projects via infra/grafana/GRAFANA_DASHBOARDS_AGENT.md.
argument-hint: [setup|analyze|build|fix <issue>] (optional, default = full pipeline)
---

# Grafana Dashboards Agent

Lis et exécute **strictement** le document
`infra/grafana/GRAFANA_DASHBOARDS_AGENT.md` (8 phases avec gates).

## Comportement selon $ARGUMENTS

- **`setup`** → Phase 0 + Phase 1 uniquement (compte, token, datasource healthy)
- **`analyze`** → Phase 2 + Phase 3 (schema discovery + plan métier validé)
- **`build`** → Phase 4 + Phase 5 + Phase 6 (migrations + JSONs + push)
- **`fix <issue>`** → Phase 7 ciblé sur l'issue (ex: `fix no-data-payments`)
- **vide** → flux complet 0 → 8

## Règles non-négociables

1. **Phases dans l'ordre** : ne pas sauter de gate. Demander validation utilisateur entre chaque phase.
2. **Phase 0 obligatoire** : ne pas commencer Phase 1 sans `.env` rempli + accès BD validé.
3. **Phase 3 obligatoire** : ne pas écrire un seul JSON tant que l'analyse métier n'a pas été validée par l'utilisateur.
4. **Pas de push git automatique** : à la fin, demander explicitement « OK pour `git push origin <branch>` ? ».
5. **Pas de token en clair** : token/passwords toujours via `.env` gitignored, jamais dans la conversation.
6. **Toujours utiliser `pg_attribute`** pour schéma (pas `information_schema` — filtré sur Supabase pooler).
7. **Toujours `${var:sqlstring}`** pour filtres multi-select (pas `'$var' = 'All'`).
8. **Toujours `currency:XAF`** (pas `currencyXAF`) + `noValue: "0"` sur stat panels.

## Sortie attendue

À la fin du flux complet (sans args) :
- N migrations SQL dans `packages/backend/database/migrations/` (ou équivalent du projet)
- N+1 dashboards JSON dans `infra/grafana/dashboards/` (incluant un Overview avec navigation)
- `push_grafana_dashboards.py` ou équivalent fonctionnel
- README à jour
- Commits locaux sémantiques (1 par phase ou groupés)
- Demande explicite de push

## Anti-patterns à refuser

L'agent **doit refuser** si l'utilisateur demande :
- Coller le token Grafana directement dans la conversation (au lieu de `.env`)
- Sauter Phase 3 (« crée juste 5 dashboards génériques »)
- Push git sans validation explicite
- Hardcoder des UUIDs / passwords / role names
- Procéder sur un SGBD non-postgres sans confirmation (cf. Faiblesse 1)
- Créer un token sans expiry (cf. Faiblesse 6)
- Écrire des migrations sans bloc rollback (cf. Faiblesse 7)
- Push API sans avoir vérifié datasource health en amont (cf. Faiblesse 3)

Dans ces cas, expliquer la raison et proposer la voie correcte.

## Garde-fous actifs (faiblesses gérées pendant le flux)

L'agent **N'enregistre PAS** ces faiblesses comme dette technique. Il les
**neutralise pendant l'exécution** via les garde-fous §11 du document agent :

| # | Faiblesse | Garde-fou pendant l'exécution |
|---|---|---|
| 1 | DB engine non-postgres | Phase 0.5 — détecte le moteur, park le flux si non-postgres |
| 2 | Grafana self-hosted vs Cloud | Phase 0.6 — détecte le mode, switch YAML provisioning |
| 3 | Pas de smoke tests E2E | Phase 6.4 — `/api/ds/query` test obligatoire avec seuil 20% panels OK |
| 4 | Classifier métier inventé | Phase 3.2 — interview obligatoire pour critère SQL exact |
| 5 | Pas de RLS multi-tenant | Phase 8.2 — disclaimer ⚠️ ajouté au README + log final |
| 6 | Token sans rotation | Phase 0.2 — suggère expiry ≤ 30j, TODO rotation si refus |
| 7 | Migrations non-réversibles | Phase 4.5 — bloc `-- ROLLBACK` obligatoire dans chaque mig |
| 8 | Pinning Grafana version | Phase 5.1 — interroge `/api/health` pour adapter schemaVersion |
| 9 | Cache navigateur post-push | Phase 7.0 — instructions hard-refresh affichées |
| 10 | Token leak en logs | Phase 0.7 — masking actif, vérification `.gitignore` |

**Si une faiblesse non-listée est rencontrée**, l'agent doit :
1. Documenter la nouvelle faiblesse dans §11 du document agent
2. Proposer un garde-fou actif (pas juste un disclaimer)
3. Mettre à jour cette table

→ L'agent **n'autorise PAS** un flux qui aurait des faiblesses non-couvertes.

## Reproductibilité multi-projets

Cet agent fonctionne sur **n'importe quel projet** :
1. Copier `infra/grafana/GRAFANA_DASHBOARDS_AGENT.md` dans le nouveau repo
2. Copier `.claude/commands/grafana-dashboards.md` (ce fichier)
3. Adapter les chemins de migrations / scripts au layout du nouveau projet
4. Lancer `/grafana-dashboards` → l'agent guide depuis zéro

Le projet **Facil (taxasge)** a servi de validation : 10 dashboards production
livrés en une session. Voir `memory/session_2026_05_04_grafana_e1.md` pour le bilan.
