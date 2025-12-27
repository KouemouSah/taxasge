# MISSION : AUDIT & MISE À NIVEAU DU MODULE "{{MODULE_NAME}}"

## RÔLE
Tu es Lead Tech Fullstack (FastAPI/React). Tu es intransigeant sur la Clean Architecture, la Convention de Naming et la Sécurité.

## CONTEXTE
- Module cible : `{{MODULE_NAME}}`
- Référence DB : `.github/docs-internal/database/DATABASE_SCHEMA_REFERENCE.md`
- Credentials (ENV) : Admin & User (pour les tests E2E).
- Project context : .agent\System\PROJECT_CONTEXT.md

## 🛑 CONSIGNE PRIORITAIRE : THINK FIRST
Avant de toucher au code, analyse l'existant et génère un plan dans une balise XML :
<thinking>
1. Analyse de l'architecture (Service/Repo pattern).
2. Vérification des conventions de nommage actuelles vs attendues.
3. Analyse des manques (Gaps) Schema DB vs Pydantic.
4. Stratégie de test critique.
5. Sois critique, rigoureux, challenge toi
</thinking>

Une fois ta réflexion validée, fais un rapport et exécute la checklist suivante point par point. si un élément de ton rapport manque dans la checklist ajoute le
comme autre tâche a executer.

## CHECKLIST D'EXÉCUTION (STRICTE)

### 1. CODE STYLE & CONVENTIONS (The Hygiene)
- [ ] **Naming Convention Enforced** :
    - **Frontend (TS/React)** : Vérifier que TOUTES les fonctions et variables sont en `camelCase`. Renommer si nécessaire.
    - **Backend (Python)** : Vérifier le respect du `snake_case` (PEP8) pour fonctions/variables.
    - **Files** : Vérifier que les noms de fichiers sont cohérents (ex: `kebab-case` ou `snake_case`).
- [ ] **Existing Patterns Followed** : Le code respecte-t-il la structure dossier/fichier du projet ?

### 2. ARCHITECTURE & BACKEND (The Core)
- [ ] **Database Schema Reviewed** : Cohérence stricte avec `DATABASE_SCHEMA_REFERENCE.md`.
- [ ] **Service Layer Created/Verified** : Logique métier isolée (Pas de logique dans le Router).
- [ ] **Repository Layer Created/Verified** : Requêtes DB isolées (Pas de SQL/ORM dans le Service).
- [ ] **Pydantic Models Defined** : Typage strict (Input vs Output schemas).
- [ ] **API Route Created** : Endpoints RESTful, verbes HTTP corrects.
- [ ] **Logging Added** : Logs structurés aux points d'entrée/sortie et erreurs.

### 3. SÉCURITÉ & ROBUSTESSE
- [ ] **RBAC Permissions Checked** : Chaque route a-t-elle `Depends(get_current_user)` ou les scopes requis ?
- [ ] **Error Handling Added** : Exceptions HTTP claires (pas de `return {"error": ...}` manuel, utiliser `raise HTTPException`).


### 4. FRONTEND & UX (The Face)
- [ ] **Component Analysis** : Découpage atomique des composants.
- [ ] **Type Matching** : Les interfaces TS matchent à 100% les modèles Pydantic.
- [ ] **Traductions (i18n)** .
- [ ] **Design Review** : Amélioration UX proposée (Feedback visuel, alignements).

### 5. QUALITÉ & VALIDATION (The Proof)
- [ ] **Unit Tests Written** : Tests unitaires backend (pytest).
- [ ] **E2E Testing (Playwright)** :
    - Script : `tests/e2e/audit_{{MODULE_NAME}}.spec.ts`
    - Scénario : Admin flow + User flow.
    - **Preuve** : Capture d'écran obligatoire dans `Documentations/captures/{{MODULE_NAME}}/`.
- [ ] **Manual Testing Completed** : L'agent confirme avoir simulé le parcours.

## LIVRABLES
Le ticket est clos UNIQUEMENT si :
1. Les conventions de nommage (camelCase/snake_case) sont unifiées.
2. Les tests E2E passent (Vert).
3. Les captures d'écran sont présentes.