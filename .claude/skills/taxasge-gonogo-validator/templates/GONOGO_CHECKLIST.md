# ✅ CHECKLIST GO/NO-GO MODULE {XX} - {NOM_MODULE}

**Module :** {XX} - {NOM_MODULE}
**Dates :** {DATE_DÉBUT} → {DATE_FIN}
**Évaluateur :** {AGENT/ORCHESTRATOR}
**Date évaluation :** {YYYY-MM-DD}

---

## 📋 CRITÈRES VALIDATION

### 1. BACKEND (40 points)

#### Endpoints (20 points)
- [ ] **10 pts** : Tous endpoints implémentés ({X}/{Y}) - {%}
- [ ] **5 pts** : Validation Pydantic complète (tous champs)
- [ ] **3 pts** : Error handling RFC 7807 (tous endpoints)
- [ ] **2 pts** : Documentation Swagger complète

**Score Backend Endpoints :** ___/20

#### Tests Backend (10 points)
- [ ] **5 pts** : Coverage pytest >{80%} (actuel : {%})
- [ ] **3 pts** : Tests unitaires passent (100%)
- [ ] **2 pts** : Tests intégration API passent

**Score Tests Backend :** ___/10

#### Qualité Code Backend (10 points)
- [ ] **4 pts** : Lint flake8 OK (0 erreurs)
- [ ] **3 pts** : Type check mypy OK (0 erreurs)
- [ ] **2 pts** : Docstrings complètes (toutes fonctions publiques)
- [ ] **1 pt** : Aucun code dupliqué >10 lignes

**Score Qualité Backend :** ___/10

---

### 2. FRONTEND (30 points)

#### Pages/Composants (15 points)
- [ ] **8 pts** : Toutes pages implémentées ({X}/{Y}) - {%}
- [ ] **4 pts** : Responsive (mobile/tablet/desktop)
- [ ] **3 pts** : Loading states gérés (Skeleton)

**Score Frontend Pages :** ___/15

#### Tests Frontend (10 points)
- [ ] **5 pts** : Coverage Jest >{75%} (actuel : {%})
- [ ] **3 pts** : Tests unitaires passent (100%)
- [ ] **2 pts** : Tests E2E Playwright passent

**Score Tests Frontend :** ___/10

#### Qualité Frontend (5 points)
- [ ] **2 pts** : ESLint OK (0 erreurs)
- [ ] **2 pts** : TypeScript strict OK (0 erreurs)
- [ ] **1 pt** : Build Next.js réussit

**Score Qualité Frontend :** ___/5

---

### 3. INTEGRATION (15 points)

#### Communication Backend ↔ Frontend (10 points)
- [ ] **5 pts** : API calls fonctionnent (toutes routes)
- [ ] **3 pts** : CORS configuré correctement
- [ ] **2 pts** : Authentication/Authorization OK

**Score Integration :** ___/10

#### Staging (5 points)
- [ ] **3 pts** : Backend staging déployé et accessible
- [ ] **2 pts** : Frontend staging déployé et accessible

**Score Staging :** ___/5

---

### 4. ACCESSIBILITÉ & PERFORMANCE (10 points)

#### Accessibility (5 points)
- [ ] **3 pts** : Lighthouse Accessibility >85
- [ ] **2 pts** : ARIA labels complets (tous champs formulaire)

**Score Accessibilité :** ___/5

#### Performance (5 points)
- [ ] **3 pts** : Lighthouse Performance >85
- [ ] **2 pts** : Latency API P95 <500ms

**Score Performance :** ___/5

---

### 5. DOCUMENTATION (5 points)

- [ ] **2 pts** : README module à jour
- [ ] **2 pts** : Use cases validés
- [ ] **1 pt** : Rapport module créé

**Score Documentation :** ___/5

---

## 📊 SCORE FINAL

```
Backend :        ___/40  ({%})
Frontend :       ___/30  ({%})
Integration :    ___/15  ({%})
Accessibility :  ___/10  ({%})
Documentation :  ___/5   ({%})
─────────────────────────────
TOTAL :          ___/100 ({%})
```

---

## 🎯 DÉCISION GO/NO-GO

### Critères Décision

**✅ GO (Score ≥ 80/100)** :
- Tous endpoints backend implémentés
- Toutes pages frontend implémentées
- Tests coverage backend >80%, frontend >75%
- Aucun bug critique (P0)
- Staging stable

**⚠️ GO CONDITIONNEL (Score 70-79/100)** :
- Minor issues identifiés
- Plan correction <48h
- Re-validation après corrections

**❌ NO-GO (Score <70/100)** :
- Blockers critiques non résolus
- Coverage tests insuffisant
- Bugs critiques (P0) non fixés
- Refonte module requise

---

### DÉCISION FINALE

**Score final :** ___/100 ({%})

**Décision :** [ ] ✅ GO / [ ] ⚠️ GO CONDITIONNEL / [ ] ❌ NO-GO

---

## 🚨 BUGS & BLOCKERS

### Bugs Critiques (P0)
- [ ] Aucun ✅

**OU** :
1. **Bug P0-{XX}** : {Description}
   - Impact : {Bloque feature X}
   - Solution : {Plan correction}
   - Deadline fix : {Date}

### Bugs Majeurs (P1)
- [ ] Aucun ✅

**OU** :
1. **Bug P1-{XX}** : {Description}
   - Impact : {Dégrade UX}
   - Solution : {Plan correction}
   - Deadline fix : {Date}

### Blockers
- [ ] Aucun ✅

**OU** :
1. **Blocker #{X}** : {Description}
   - Raison : {Pourquoi bloqué}
   - Escalation : {À qui}
   - Décision requise : {Quoi}

---

## 📋 ACTIONS CORRECTIVES (Si GO CONDITIONNEL)

**Si score 70-79/100** :

| Action | Responsable | Deadline | Status |
|--------|-------------|----------|--------|
| {Action 1} | {Agent} | {Date} | ⏳ |
| {Action 2} | {Agent} | {Date} | ⏳ |

**Re-validation prévue :** {Date}

---

## ✅ VALIDATION FORMELLE

### Revue Orchestrateur

**Validé par :** {Nom Orchestrateur}
**Date :** {YYYY-MM-DD}
**Commentaires :**
```
{Commentaires orchestrateur sur qualité module}
```

### Métriques Finales

```
Backend Coverage :      {%}
Frontend Coverage :     {%}
Lighthouse Performance: {score}/100
Lighthouse Accessibility: {score}/100
API Latency P95:        {ms}
Build Time:             {secondes}
```

---

## 🎯 PROCHAINES ÉTAPES

### Si GO ✅
- **Module suivant :** {XX+1} - {NOM_MODULE_SUIVANT}
- **Démarrage :** {DATE}
- **Agent assigné :** {NOM_AGENT}

### Si NO-GO ❌
- **Plan correction :** {Description plan}
- **Durée estimée :** {X jours}
- **Re-validation :** {DATE}
- **Impact timeline :** {+X jours retard}

---

## 📊 LEÇONS APPRISES

**Points positifs :**
1. {Ce qui a bien fonctionné}
2. {Best practices à répéter}

**Points d'amélioration :**
1. {Ce qui peut être amélioré}
2. {Risques à anticiper module suivant}

**Suggestions :**
1. {Suggestion amélioration process}
2. {Outils/patterns à adopter}

---

## 🔗 RÉFÉRENCES

**Documents :**
- Use Case : `.github/docs-internal/Documentations/Backend/use_cases/{XX}_{MODULE}.md`
- Rapport Module : `.github/docs-internal/ias/03_PHASES/RAPPORT_MODULE_{XX}.md`
- Code Backend : `packages/backend/app/api/v1/{module}.py`
- Code Frontend : `packages/web/src/app/(dashboard)/{module}/`

**Tests :**
- Backend : `packages/backend/tests/use_cases/test_uc_{module}.py`
- Frontend : `packages/web/tests/unit/components/{module}/`
- E2E : `packages/web/tests/e2e/{module}.spec.ts`

**Staging :**
- Backend : https://taxasge-backend-staging.run.app/api/v1/{module}/
- Frontend : https://staging.taxasge.com/{module}/

---

**Checklist créée par :** Claude Code Expert IA
**Template version :** 1.0
**Date :** 2025-10-23
