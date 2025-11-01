# CARTE COMPLÈTE - Fichiers à Restaurer

**Date d'analyse** : 30 octobre 2025 - 17:00 UTC
**Sources** : 248 fichiers versionnés analysés
**Méthodologie** : Extraction systématique par patterns

---

## 📁 STRUCTURE COMPLÈTE IDENTIFIÉE

### 1. `.github/docs-internal/Documentations/Backend/`

#### use_cases/
- `01_AUTH.md` ✅ CONFIRMÉ
- `01_AUTHENTICATION.md` ✅ TROUVÉ

#### DECISIONS/
- `DECISION_003_SECURITY_HARDENING.md` ✅ TROUVÉ
- `DECISION_006_FRONTEND_TEMPLATE.md` ✅ TROUVÉ
- `DECISION_007_DESIGN_SYSTEM_GQ.md` ✅ TROUVÉ

#### BASELINES/
- `BASELINE_BACKEND.md` ✅ TROUVÉ
- `BASELINE_FRONTEND.md` ✅ TROUVÉ
- `BASELINE_INFRASTRUCTURE.md` ✅ TROUVÉ

#### RAPPORTS/
- `RAPPORT_FINAL_PHASE_0.md` ✅ TROUVÉ
- `RAPPORT_GENERAL.md` ✅ TROUVÉ
- `RAPPORT_MODULE_01_AUTHENTICATION.md` ✅ TROUVÉ (fichier lu partiellement)
- `RAPPORT_ORCHESTRATION_2025-10-24.md` ✅ TROUVÉ
- `RAPPORT_ORCHESTRATION_2025-10-24_TASK-P0-003B.md` ✅ TROUVÉ
- `RAPPORT_ORCHESTRATION_2025-10-24_TASK-P0-004.md` ✅ TROUVÉ
- `RAPPORT_ORCHESTRATION_2025-10-24_TASK-P0-004B.md` ✅ TROUVÉ
- `RAPPORT_ORCHESTRATION_2025-10-24_TASK-P0-005.md` ✅ TROUVÉ (déjà présent : 92d83a28740cd555@v2)
- `RAPPORT_ORCHESTRATION_2025-10-24_TASK-P0-006.md` ✅ TROUVÉ
- `RAPPORT_STRATEGIE_DEPLOIEMENT.md` ✅ TROUVÉ
- `RAPPORT_TASK_P0-003B.md` ✅ TROUVÉ
- `RAPPORT_TASK_P0-004.md` ✅ TROUVÉ

#### Autres fichiers identifiés
- `03_SECURITY_HARDENING.md` ✅ TROUVÉ
- `06_FRONTEND_TEMPLATE.md` ✅ TROUVÉ
- `07_DESIGN_SYSTEM_GQ.md` ✅ TROUVÉ

---

### 2. `Documentations/Mobile/` (Racine projet)

**Fichiers confirmés (git status 25 oct)** :
- `build-install-with-bundled-db.bat` ✅ CONFIRMÉ
- `rapport_status_build_v4.3.0.md` ✅ CONFIRMÉ
- `rapport_v4.3.0_architecture_dual_version.md` ✅ CONFIRMÉ
- `design/` (dossier) ✅ CONFIRMÉ
- `screenshots/` (dossier) ✅ CONFIRMÉ

---

### 3. `.claude/.agent/` (Système agents)

#### System/
- `README.md` → Index principal (NON, c'est `.agent/README.md`)
- `ORCHESTRATOR.md` ✅ À EXTRAIRE
- `PROJECT_CONTEXT.md` ✅ À EXTRAIRE
- `TECH_STACK.md` ✅ À EXTRAIRE

#### Tasks/
- `DEV_AGENT.md` ✅ À EXTRAIRE
- `TEST_AGENT.md` ✅ À EXTRAIRE
- `DOC_AGENT.md` ✅ À EXTRAIRE
- `PHASE_1_CLEANUP.md` ✅ À EXTRAIRE
- `PHASE_2_CORE_BACKEND.md` ✅ À EXTRAIRE
- `PHASE_3_ADMIN_AGENT.md` ✅ À EXTRAIRE
- `PHASE_4_INTEGRATIONS.md` ✅ À EXTRAIRE
- `PHASE_5_TESTS_QA.md` ✅ À EXTRAIRE
- `PHASE_6_DEPLOYMENT.md` ✅ À EXTRAIRE

#### SOP/
- `DEV_WORKFLOW.md` ✅ À EXTRAIRE
- `TEST_WORKFLOW.md` ✅ À EXTRAIRE
- `DOC_WORKFLOW.md` ✅ À EXTRAIRE
- `CODE_STANDARDS.md` ✅ À EXTRAIRE
- `GIT_CONVENTIONS.md` ✅ À EXTRAIRE
- `ERROR_HANDLING.md` ✅ À EXTRAIRE

#### Reports/
- `TASK_REPORT_TEMPLATE.md` ✅ À EXTRAIRE
- `WEEKLY_REPORT_TEMPLATE.md` ✅ À EXTRAIRE

#### Racine
- `.agent/README.md` ✅ EXTRAIT (337 lignes)

---

### 4. Fichiers racine `.claude/`

- `system_instructions.md` ✅ CONFIRMÉ (git status 25 oct)
- `.claude/reports/` (dossier) ✅ CONFIRMÉ
- `.claude/skills/` (dossier) ✅ CONFIRMÉ

---

## 📊 STATISTIQUES

| Catégorie | Nombre Fichiers | Statut |
|-----------|----------------|--------|
| **USE_CASES** | 2+ | Identifiés |
| **DECISIONS** | 3 | Identifiés |
| **BASELINES** | 3 | Identifiés |
| **RAPPORTS** | 12 | Identifiés |
| **Agent System** | 3 | À extraire |
| **Agent Tasks** | 9 | À extraire |
| **Agent SOP** | 6 | À extraire |
| **Agent Reports** | 2 | À extraire |
| **Mobile Docs** | 5 | Confirmés |
| **TOTAL** | **45+** | - |

---

## 🎯 PLAN DE RESTAURATION ORDONNÉ

### Phase 1 : `.claude/.agent/` (24 fichiers)
1. ✅ `README.md` (déjà extrait)
2. Extraire System/ (3 fichiers)
3. Extraire Tasks/ (9 fichiers)
4. Extraire SOP/ (6 fichiers)
5. Extraire Reports/ (2 fichiers)

### Phase 2 : `.claude/` racine (3 éléments)
1. `system_instructions.md`
2. `reports/` (contenu à investiguer)
3. `skills/` (contenu à investiguer)

### Phase 3 : `.github/docs-internal/Documentations/Backend/` (20+ fichiers)
1. Créer structure dossiers
2. Restaurer use_cases/ (2 fichiers)
3. Restaurer DECISIONS/ (3 fichiers)
4. Restaurer BASELINES/ (3 fichiers)
5. Restaurer RAPPORTS/ (12 fichiers)

### Phase 4 : `Documentations/Mobile/` (5 éléments)
1. Créer dossier racine
2. Restaurer 3 fichiers .md/.bat
3. Créer dossiers design/ et screenshots/

### Phase 5 : Validation
1. Vérifier tous chemins
2. Vérifier contenu cohérent
3. Git status compare avec 25 octobre

---

## 🔍 FICHIERS AVEC VERSIONS MULTIPLES

Format : `hash@vN` où N = numéro version

| Hash | Dernière Version | Description |
|------|------------------|-------------|
| `92d83a28740cd555` | v51 | RAPPORT TASK-P0-005 |
| `a9743aeff4cb710d` | v7 | RAPPORT MODULE 01 |
| `4fbdbc3b7ed3c845` | v12 | RAPPORT GÉNÉRAL |
| `0cdcff53906e9624` | v51 | (à identifier) |
| `129e158a4a9ade14` | v5 | (à identifier) |
| `1f84ed695a519216` | v51 | (à identifier) |

**Stratégie** : Toujours prendre la version la plus récente (@vMAX)

---

## ⚠️ NOTES IMPORTANTES

### Découvertes Clés

1. **Dossier Documentations/ à 2 emplacements** :
   - `.github/docs-internal/Documentations/` → Backend/Frontend
   - `Documentations/` racine → Mobile

2. **Fichiers USE_CASE multiples** :
   - Au moins 2 identifiés (01_AUTH, 01_AUTHENTICATION)
   - Probablement plus à découvrir

3. **Structure RAPPORTS riche** :
   - 12 rapports d'orchestration identifiés
   - Couvrent Phase 0 complète

4. **Système .agent/ complet** :
   - 24 fichiers markdown
   - Architecture agents dev/test/doc
   - 6 phases de développement

### Fichiers NON trouvés (mentionnés mais absents)

- Autres USE_CASES (02_*, 03_*, 04_*, 05_*, 06_*) sauf ceux listés
- TASK_REPORTS sous-dossier spécifique

**Raison possible** : Jamais créés ou dans historique plus ancien

---

## 📝 PROCHAINES ACTIONS

1. ✅ Carte complète créée
2. ⏳ Extraire tous fichiers `.agent/`
3. ⏳ Extraire `system_instructions.md`
4. ⏳ Extraire tous fichiers `Documentations/Backend/`
5. ⏳ Chercher fichiers `Documentations/Mobile/`
6. ⏳ Restaurer structure complète
7. ⏳ Validation git status

---

**Document généré par** : Claude Code Expert
**Analyse** : 248 fichiers versionnés
**Confiance** : HAUTE (patterns multiples + confirmations croisées)
**Prochaine action** : Extraction Phase 1 - `.claude/.agent/`
