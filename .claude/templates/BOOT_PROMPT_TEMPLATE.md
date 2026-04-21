# 🎯 REPRISE SESSION — {{TITRE_INITIATIVE}}

> **INSTRUCTIONS D'UTILISATION** : ce fichier est un prompt d'initialisation de session.
> Une nouvelle session Claude Code doit lire ce fichier et **exécuter littéralement** son contenu.
> Commencer par l'étape 0, dans l'ordre.
>
> **Invocation** : `/apply-plan .claude/plans/{{NOM_FICHIER}}.md`

---

Tu reprends le travail {{description courte du contexte}}. La session précédente ({{dates}}) a {{résumé des accomplissements : N commits, quels items fixés}}. Il reste {{description des gaps}}.

# 0. ⚠️ AVANT TOUT CODE — CRÉER UNE WORKTREE

**Première action obligatoire** :
```
EnterWorktree(name="{{nom-worktree}}")
```

Si `EnterWorktree` échoue, alerter l'utilisateur immédiatement et NE PAS continuer.

# 1. 📋 RÉSUMÉ SESSION PRÉCÉDENTE (contexte embedded)

## Items résolus
{{tableau des items résolus avec commits}}

## Architecture validée
{{description de l'architecture en place, flux, diagramme ASCII si utile}}

## Points sensibles à ne pas oublier
{{liste des invariants, règles BD, contraintes techniques à respecter}}

# 2. 🚫 RÈGLES NON NÉGOCIABLES

## Git / Deploy
- **JAMAIS** de `gcloud builds submit` — toujours push vers `develop`, GitHub Actions gère
- **TOUJOURS** demander confirmation explicite avant `git push` (règle mémoire #13)
- Commits locaux par phase, push uniquement après validation globale (règle #14)
- **OBLIGATOIRE** : worktree dès le départ
- Python : `C:\Program Files\Odoo 17\python\python.exe` exclusivement
- Jamais `--no-verify`, `--force`, `git reset --hard`, `rebase -i` sans autorisation

## Analyse et implémentation
- **TOUJOURS** analyser le contexte, l'architecture, l'existant avant de coder
- **TOUJOURS** interroger la BD directement (`psycopg2`) pour vérifier champs, types, contraintes
- **TOUJOURS** rédiger un rapport critique + plan dans `.claude/plans/`
- **Auto-critique** après chaque phase : relire son diff, identifier les bugs
- **Challenger les suggestions utilisateur** — l'expert technique, c'est toi
- **Ne rien inventer**, travailler avec l'existant

## Règles projet-spécifiques
{{règles additionnelles propres à cette initiative, ex:}}
- {{Règle #16 : fix bundle = zéro régression non-bundle}}
- {{Règle snapshot fiscal_service : nom stocké au moment du bundle}}
- {{etc.}}

## Tests
- Tests backend dans `packages/backend/tests/unit/`
- Tests frontend dans `packages/web/src/**/__tests__/`
- Smoke tests avant chaque push
- Si tests manquent sur un endpoint critique, les ajouter

## Sécurité (OWASP Top 10)
- Parameterized queries asyncpg (`$1`, `$2`, ...) — jamais de string format SQL
- Lock timeouts sur chemins critiques (`SET LOCAL lock_timeout='3s'`)
- Pas de leak PII dans les logs
- Auth check per-item (pas juste permission globale)

# 3. 📦 BACKLOG PRIORISÉ

| # | Bug | Sévérité | Effort | Description |
|---|---|---|---|---|
| **{{ID1}}** | {{emoji}} {{sévérité}} | {{effort}} | {{description}} |
| **{{ID2}}** | ... | ... | ... |
| ... | ... | ... | ... |

**Ordre recommandé** : {{ID1}} → {{ID2}} → ... (challenger si tu trouves mieux)

# 4. 🧪 WORKFLOW DE DÉMARRAGE — ordre strict

1. **Créer worktree** (si pas fait à l'étape 0)
2. **Lire les contextes** :
   - {{fichier bilan session précédente}}
   - {{fichier plan détaillé}}
   - `CLAUDE.md` (racine) — règles projet
   - `memory/MEMORY.md` — mémoire persistante
3. **Snapshot git** : `git log --oneline -15` + `git status`
4. **Snapshot BD** : probe psycopg2 pour vérifier l'état actuel
5. **Rédiger** plan détaillé du premier item
6. **Demander validation** utilisateur avant tout changement code
7. **Implémenter** étape par étape avec auto-critique
8. **Tests** avant commit local
9. **Commit local** — attendre autorisation user avant push
10. **Push + monitor CI** via `gh run list --branch develop --limit 5`
11. **Mettre à jour** le plan (cocher les checklists validées)

# 5. 🚫 CE QUE TU NE DOIS PAS FAIRE SANS AUTORISATION

- `git push` sans confirmation explicite
- `git reset --hard`, `rebase -i`, `--force`
- `DROP` / `TRUNCATE` en BD staging
- Supprimer / renommer fichiers existants
- Refactor au-delà du scope du ticket
- Modifier le code d'autres workflows sous prétexte de cohérence
- Dépasser 2 h sans check-in utilisateur

# 6. 📨 PREMIER MESSAGE ATTENDU DE TOI

Après worktree + lecture contexte + snapshots, **résume en 3-5 phrases** :
1. Ce que tu as compris du contexte (1 phrase)
2. Ton plan pour la première phase (2 phrases avec hypothèse + approche)
3. Les questions ouvertes nécessitant décision utilisateur (1-2 phrases)

**Attends la validation user explicite** avant tout changement de code.

---

**Fichiers clés à consulter** :
- {{chemin bilan}}
- {{chemin plan}}
- {{chemins fichiers source principaux}}
- `scripts/{{script utile}}` — {{description}}

**Fin du prompt. Commence par l'étape 0.**
