# Apply Plan — Session Initialization Command

Lit et applique littéralement un fichier plan/prompt d'initialisation de session.

## Instructions

L'argument fourni est le chemin vers un fichier `.md` (plan d'initialisation) dans `.claude/plans/`. **Exécute chaque étape du fichier dans l'ordre**, en commençant par l'étape 0.

### Workflow obligatoire

1. **Lire le fichier plan** spécifié en argument (ex: `.claude/plans/BUNDLE_DEBUG_PHASE9_BOOT.md`)
2. **Créer une worktree** si le plan le demande (étape 0)
3. **Lire les fichiers de contexte** listés dans le plan (bilans, plans précédents, CLAUDE.md, mémoire)
4. **Prendre les snapshots** (git log/status + BD si spécifié)
5. **Rédiger le plan détaillé** du premier item si demandé
6. **Envoyer le premier message** au format spécifié (3-5 phrases : contexte, plan, questions)
7. **Attendre la validation utilisateur** avant tout changement de code

### Règles héritées automatiquement

- Toutes les règles de `CLAUDE.md` (racine) + `memory/MEMORY.md`
- Toutes les règles spécifiques listées dans le fichier plan (section "Règles non négociables")
- JAMAIS de push sans confirmation explicite
- JAMAIS de modification sur des workflows non concernés par le scope du plan
- Plans par phase avec checklist, commits locaux par phase, push après validation globale
- Auto-critique après chaque phase

### En cas d'échec

Si le fichier plan n'existe pas ou est illisible, alerter l'utilisateur immédiatement et lister les plans disponibles dans `.claude/plans/`.

### Exemple d'utilisation

```
/apply-plan .claude/plans/BUNDLE_DEBUG_PHASE9_BOOT.md
```
