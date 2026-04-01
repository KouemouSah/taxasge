# AUDIT GLOBAL — Détection Bugs & Optimisations
**Date:** 2026-04-01
**Statut:** EN COURS
**Auditeur:** Claude Expert

---

## RÉSUMÉ EXÉCUTIF

Audit approfondi de l'application Facil couvrant frontend, backend et alignement DB.
**13 bugs identifiés** dont 5 signalés par l'utilisateur + 8 découverts lors de l'analyse.

| Sévérité | Count | Description |
|----------|-------|-------------|
| 🔴 CRITIQUE | 4 | Crash/500, données corrompues, fonctionnalité cassée |
| 🟠 MAJEUR | 5 | UX bloquée, erreurs silencieuses, sécurité |
| 🟡 MINEUR | 4 | Incohérences, améliorations nécessaires |

---

## BUG #1 — Agent Invite 500 (Ayuntamiento)
**Sévérité:** 🔴 CRITIQUE
**Signalé par:** Utilisateur
**Endpoint:** `POST /api/v1/agents/invite`
**Erreur:** 500 Internal Server Error

### Analyse Root Cause

**Fichiers impliqués:**
- `packages/backend/app/modules/agents/api/profile_routes.py:549-564`
- `packages/backend/app/modules/agents/services/agent_profile_service.py:552-661`
- `packages/backend/app/modules/auth/repositories/pending_registration_repository.py:92-122`

**Cause identifiée:** Le handler catch-all (ligne 559-564) transforme TOUTE exception non-ValueError en 500 générique sans détail utile :
```python
except Exception as e:
    logger.error(f"Agent invitation error for {data.user.email}: {type(e).__name__}: {e}")
    raise HTTPException(status_code=500, detail="Invitation failed. Please try again.")
```

**Causes probables de l'Exception non-ValueError :**
1. **`PendingRegistrationRepository.create_agent_invitation()`** — si la table `pending_registrations` a un trigger ou constraint qui échoue (ex: metadata JSONB trop volumineux, email format)
2. **`db_manager.execute_single()` (ligne 588)** — pool exhaustion, timeout, connection lost → asyncpg exception non catchée comme ValueError
3. **`get_email_service()` retourne None** (ligne 638) → `NoneType.send_agent_invitation()` → AttributeError → 500
4. **UUID parsing** (ligne 540) : `current_user.id` extraction non défensive — si `current_user` n'a ni `.id` ni `"sub"` → AttributeError

**Bug secondaire:** Le message d'erreur 400 pour ValueError est générique ("Invalid invitation data") et masque le vrai message (ex: "Un compte existe déjà avec l'email X").

### Fix requis
- [ ] Ajouter logging détaillé avec traceback complet
- [ ] Rendre le message d'erreur 400 informatif (renvoyer `str(e)`)
- [ ] Catch spécifique pour `asyncpg` exceptions (pool, FK, unique)
- [ ] Guard `get_email_service()` retour None
- [ ] Guard `current_user.id` extraction défensive
- [ ] Vérifier logs Cloud Run pour le traceback exact

---

## BUG #2 — Email Agent Non Modifiable
**Sévérité:** 🟠 MAJEUR
**Signalé par:** Utilisateur

### Analyse Root Cause

**Frontend: OK — L'email EST éditable.**
- `packages/web/src/app/[locale]/(dashboard)/dashboard/admin/agents/[id]/page.tsx:622-631`
- L'Input email est bien présent en mode édition (ligne 624, non disabled)
- `handleSaveInfo()` (ligne 375-430) appelle bien `adminUsersApi.updateUser(profile.user_id, { email })`

**Backend: OK — L'endpoint existe.**
- `packages/backend/app/modules/admin/api/user_management_routes.py:265-393`
- `PUT /api/v1/admin/users/{user_id}` accepte bien `email` dans `UserUpdate`
- Logic email change : vérifie unicité → set `pending_verification` → envoie verification code

**Problème probable:**
1. **L'admin ne clique pas sur "Editar"** dans la barre info compacte (le bouton est petit, `h-7 px-2`, facile à manquer)
2. **Confusion UX** : Il y a DEUX modes d'édition — la barre info compacte (email/phone) et le formulaire profil principal (tabs). L'email n'est que dans la barre compacte, PAS dans le formulaire profil.
3. **Erreur silencieuse** : si `adminUsersApi.updateUser()` échoue (ex: permission `users.update_any` manquante), le toast d'erreur peut être masqué ou le message non informatif.
4. **Bug potentiel de routing** : Le frontend appelle `PUT /admin/users/{user_id}` mais le backend attend `PUT /api/v1/admin/users/{user_id}` — à vérifier que le fetchClient ajoute bien le prefix `/api/v1`

### Fix requis
- [ ] Vérifier que l'admin a la permission `users.update_any`
- [ ] Rendre le bouton "Editar" plus visible (icon + label plus grand)
- [ ] Ajouter un indicateur visuel clair que l'email est modifiable
- [ ] Vérifier le prefix API du fetchClient pour `/admin/users`
- [ ] Tester le flow complet: clic Editar → modifier email → Save → vérifier toast

---

## BUG #3 — Agents Fantômes (Fake Emails, Statut Actif)
**Sévérité:** 🟠 MAJEUR
**Signalé par:** Utilisateur

### Analyse Root Cause

**Migration 272** a créé 17 agents OMS test avec mot de passe `TestOms2026!` :
- Ces agents ont été insérés directement en SQL avec des emails potentiellement invalides
- Statut `active` et `availability = available` sans vérification email
- Mot de passe en clair hashé en bcrypt dans la migration

**Migration 061** avait nettoyé les anciens comptes test mais les 17 OMS sont restés.

### Impact
- Fausse capacité : le système de routage automatique peut assigner des tâches à ces agents fantômes
- Faux KPIs : les dashboards comptent ces agents dans les statistiques
- Risque sécurité : mots de passe faibles connus (`TestOms2026!`)

### Fix requis
- [ ] Migration SQL : SET `status = 'deactivated'` + `availability = 'unavailable'` pour tous les agents avec emails test
- [ ] OU : Supprimer ces agents s'ils ne sont plus nécessaires
- [ ] Ajouter contrainte : email_verified DOIT être true pour que availability puisse être 'available'
- [ ] Audit : lister tous les users avec `status = 'active'` ET `email_verified = false`

---

## BUG #4 — Config Rules Update 500
**Sévérité:** 🔴 CRITIQUE
**Signalé par:** Utilisateur
**Endpoint:** `PUT /api/v1/config-rules/{rule_id}`

### Analyse Root Cause

**Fichiers impliqués:**
- `packages/backend/app/modules/fiscal_services/models/config_rules.py:79-87`
- `packages/backend/app/modules/fiscal_services/api/config_rules_routes.py:145-165`
- `packages/backend/app/modules/fiscal_services/services/config_rules_service.py:80-92`
- `packages/backend/app/modules/fiscal_services/repositories/config_rules_repository.py:168-202`

**Cause confirmée: ABSENCE DE VALIDATION sur ConfigRuleUpdate**

`ConfigRuleCreate` (ligne 50-76) a un `@model_validator` qui valide la forme du `config` JSON :
- penalty → require `rate` >= 0
- deadline → require `month` (1-12) + `day` (1-31)
- installment → require `max_installments` >= 1

**`ConfigRuleUpdate` (ligne 79-87) N'A AUCUNE VALIDATION.** Le champ `config: Optional[Dict]` accepte n'importe quoi.

**Scenario 500:**
1. Frontend envoie `config = { "rate": "abc" }` (string au lieu de number)
2. Ou `config = {}` (objet vide, sans les champs requis)
3. Repository écrit directement en JSONB sans validation
4. Le trigger DB `recompute_effective_configs()` plante sur données invalides → PostgreSQL error → asyncpg exception → 500

**Bug secondaire:** Pas de `config_type` dans `ConfigRuleUpdate` → impossible de valider la forme du config car on ne sait pas quel type de règle on met à jour. Il faut le lire depuis la BD.

### Fix requis
- [ ] Ajouter validation config dans le service (lire config_type de la règle existante, valider config contre ce type)
- [ ] Catch spécifique des erreurs PostgreSQL dans le repository
- [ ] Retourner 422 avec message utile au lieu de 500
- [ ] Frontend : ajouter validation Zod côté client avant envoi

---

## BUG #5 — Bundle Workflow: Obligations Vides après Upload Document
**Sévérité:** 🔴 CRITIQUE
**Signalé par:** Utilisateur
**Screenshots:** Confirmés (1.png = Doc OK 85%, 2.png = Obligations VIDE)

### Analyse Root Cause

**Data Flow:**
```
OCR Extraction (85%) → map_extraction_to_company_data()
  → Zone Resolution (localidad → cities.name → zone_id)
    → Classification (rules + LLM → regimen_fiscal + commerce_type)
      → Company Creation (INSERT companies)
        → BundleWorkflowService.initiate()
          → LicenseService.open_license()
            → Fetch bundle_items for zone_id
              → Create obligations
```

**Échec en cascade — 3 points de rupture identifiés:**

**Point 1: Zone Resolution (PROBABLE ROOT CAUSE)**
- `bundle_workflow_service.py:248-260` : `localidad` OCR → `cities.name ILIKE` lookup
- Le document "Certificado de Actualización del Padrón Empresarial" extrait `localidad` mais celle-ci peut ne pas matcher exactement un nom dans `cities` table
- Résultat : `zone_id = NULL` → Company créée sans zone
- `initiate()` ligne 386 : `if not company["zone_id"]` → ValueError `COMPANY_NO_ZONE`

**Point 2: Category/Commerce Type (CONFIRMÉ par l'utilisateur)**
- Le document "Numero de Registro" ne contient PAS de zone (A1, A2, etc.)
- La classification LLM peut inférer `regimen_fiscal = "bundle"` mais pas le `commerce_type` précis
- Sans `commerce_type` → pas de bundle trouvé → `NO_BUNDLE_FOR_COMMERCE_TYPE`

**Point 3: Frontend Silent Blank (BUG FRONTEND)**
- `ObligationsReviewStep.tsx:111` : `if (!wizard.licenseData) return null` → PAGE BLANCHE
- Si `loadObligations()` lance une exception, `setError(msg)` est appelé MAIS le composant ne rend pas `wizard.error` !
- Le composant vérifie uniquement `wizard.isInitiating` et `wizard.licenseData`, PAS `wizard.error`

### Solution architecturale proposée (challenger la suggestion utilisateur)

L'utilisateur propose : après upload document, proposer de choisir manuellement la catégorie filtrée par zone.

**Ma contre-proposition (en tant qu'expert) :**

L'approche correcte est un **flow en 2 temps avec confirmation** :

1. **Après OCR** : Afficher les données extraites (zone détectée, registration number, legal_name)
2. **Zone** : Si l'OCR détecte localidad → résoudre zone automatiquement. Si non → proposer sélection manuelle de la ville/zone
3. **Catégorie** : UNE FOIS la zone confirmée, filtrer les catégories disponibles pour cette zone et laisser l'utilisateur choisir
4. **Obligations** : Générées automatiquement après zone + catégorie confirmées

Cela est **meilleur** que la proposition utilisateur car :
- On ne saute pas l'étape zone (qui peut aussi échouer)
- On affiche les données OCR pour validation humaine (évite les erreurs d'extraction à 85%)
- Le flow est explicite et traçable

### Fix requis
- [ ] Frontend: ObligationsReviewStep DOIT afficher `wizard.error` quand licenseData est null
- [ ] Backend: Ajouter étape intermédiaire "review & classify" entre upload et obligations
- [ ] Backend: endpoint `/bundle-workflow/classify-preview` qui retourne zone + catégories disponibles
- [ ] Frontend: Nouveau step "Classification" ou enrichir le step Documents
- [ ] Backend: Fuzzy matching pour zone resolution (Levenshtein sur localidad)
- [ ] Frontend: Sélecteur manual zone + catégorie quand auto-classification échoue

---

## BUG #6 — Error Handler Générique Masque les Vrais Problèmes (DÉCOUVERT)
**Sévérité:** 🟠 MAJEUR

### Description
Plusieurs endpoints utilisent un pattern catch-all qui masque les vrais messages d'erreur :

```python
except ValueError as e:
    raise HTTPException(status_code=400, detail="Generic message")  # PERD str(e)
except Exception as e:
    raise HTTPException(status_code=500, detail="Generic message")  # PERD str(e)
```

**Fichiers affectés:**
- `profile_routes.py:556-564` (agent invite)
- `config_rules_routes.py:145-165` (config rules update)
- `user_management_routes.py:386-393` (user update)

### Impact
- Impossible de debugger en production sans accès aux logs Cloud Run
- Les admins voient "Invitation failed" sans savoir pourquoi
- Les erreurs de validation légitimes (email dupliqué, entity invalide) deviennent des 400 génériques

### Fix requis
- [ ] Renvoyer `str(e)` dans le detail pour les ValueError (erreurs de validation métier)
- [ ] Logger le traceback complet pour les Exception
- [ ] Différencier les exceptions attendues (validation) des inattendues (infra)

---

## BUG #7 — Absence de Validation ConfigRuleUpdate vs ConfigRuleCreate (DÉCOUVERT)
**Sévérité:** 🟠 MAJEUR

Couvert dans Bug #4. Le modèle Pydantic `ConfigRuleUpdate` n'a aucune validation alors que `ConfigRuleCreate` en a.

---

## BUG #8 — Pool DB sans Retry/Circuit Breaker (DÉCOUVERT)
**Sévérité:** 🟡 MINEUR (latent)

### Description
`db_manager.execute_single()` est appelé sans retry logic dans le service agent (ligne 588).
Si le pool est temporairement exhausté (20 connections max, 100+ agents simultanés), l'appel échoue immédiatement → 500.

### Impact
Avec 100+ agents connectés simultanément, le pool de 20 connections sera un goulot.

### Fix requis
- [ ] Augmenter pool max à 50 ou implémenter connection queuing
- [ ] Ajouter retry avec backoff exponentiel pour les opérations critiques
- [ ] Monitorer le pool utilization

---

## BUG #9 — Email Service None Guard Manquant (DÉCOUVERT)
**Sévérité:** 🟡 MINEUR

### Description
`agent_profile_service.py:638` : `get_email_service()` peut retourner `None` si SMTP n'est pas configuré.
La ligne 640 appelle `email_service.send_agent_invitation()` → `AttributeError: 'NoneType'` → catch par Exception → 500.

### Fix requis
- [ ] Guard : `if email_service:` avant l'appel
- [ ] Ou : `get_email_service()` doit toujours retourner un objet (pattern Null Object)

---

## BUG #10 — Metadata JSON Double-Serialization (DÉCOUVERT)
**Sévérité:** 🟡 MINEUR

### Description
`pending_registration_repository.py:277-302` : Le metadata peut être double-sérialisé.
Le code gère ce cas avec un `while isinstance(metadata, str)` loop mais si le parsing échoue, retourne `{}` silencieusement.
En aval, `finalize_agent_creation()` extrait `agent_data = metadata.get('agent_data', {})` → dict vide → champs critiques manquants → 500 downstream.

### Fix requis
- [ ] Si metadata parsing échoue, RAISE au lieu de retourner {}
- [ ] Valider que agent_data contient les champs requis (agent_type, entity_id) après extraction

---

## BUG #11 — Frontend: Toast Multilingue Cassé (DÉCOUVERT)
**Sévérité:** 🟡 MINEUR

### Description
`agents/[id]/page.tsx:416` : Message toast mélange espagnol et français :
```typescript
'Email modificado. La cuenta ha sido desactivada y un nuevo enlace de activación a été envoyé.'
```
Le mot "a été envoyé" est français dans un message espagnol.

### Fix requis
- [ ] Utiliser les clés i18n pour tous les messages toast
- [ ] Audit des hardcoded strings dans les pages admin

---

## BUG #12 — Agent Edit: Promise.all sans Atomicité (DÉCOUVERT)
**Sévérité:** 🟠 MAJEUR

### Description
`agents/[id]/page.tsx:408` : `await Promise.all(promises)` envoie en parallèle :
1. `adminUsersApi.updateUser()` (email/phone)
2. `updateMutation.mutateAsync()` (entity/location)

Si (1) réussit mais (2) échoue → email modifié + compte désactivé, mais profil agent pas mis à jour → état incohérent.

### Fix requis
- [ ] Exécuter séquentiellement : d'abord profil, puis email (le plus risqué en dernier)
- [ ] OU : créer un endpoint backend unique qui fait les deux dans une transaction

---

## BUG #13 — Agent Navigation: Charge 100 Agents en Mémoire (DÉCOUVERT)
**Sévérité:** 🟡 MINEUR (performance)

### Description
`agents/[id]/page.tsx:173` : `useAgentProfiles({ page_size: 100 })` charge 100 agents juste pour la navigation prev/next.

Avec 100+ agents, c'est un gaspillage de bande passante et mémoire.

### Fix requis
- [ ] Implémenter une navigation basée sur curseur (prev/next ID dans la liste)
- [ ] Ou : limiter à la page courante + voisins

---

## TABLEAU RÉCAPITULATIF

| # | Bug | Sévérité | Type | Backend | Frontend | DB |
|---|-----|----------|------|---------|----------|----|
| 1 | Agent Invite 500 | 🔴 CRITIQUE | Crash | ✅ | | |
| 2 | Email Non Modifiable | 🟠 MAJEUR | UX/Perm | ✅ | ✅ | |
| 3 | Agents Fantômes | 🟠 MAJEUR | Data | | | ✅ |
| 4 | Config Rules Update 500 | 🔴 CRITIQUE | Crash | ✅ | | |
| 5 | Bundle Obligations Vides | 🔴 CRITIQUE | Crash | ✅ | ✅ | |
| 6 | Error Handler Générique | 🟠 MAJEUR | Debug | ✅ | | |
| 7 | ConfigRuleUpdate sans validation | 🟠 MAJEUR | Validation | ✅ | | |
| 8 | Pool DB sans Retry | 🟡 MINEUR | Perf | ✅ | | |
| 9 | Email Service None Guard | 🟡 MINEUR | Crash | ✅ | | |
| 10 | Metadata Double-Serial | 🟡 MINEUR | Data | ✅ | | |
| 11 | Toast Multilingue | 🟡 MINEUR | i18n | | ✅ | |
| 12 | Promise.all sans Atomicité | 🟠 MAJEUR | Intégrité | | ✅ | |
| 13 | Agent Nav Performance | 🟡 MINEUR | Perf | | ✅ | |

---

## PLAN D'IMPLÉMENTATION — 4 PHASES

### Phase 1: Stabilisation Critique (Bugs 1, 4, 6) ✅ TERMINÉE
**Objectif:** Éliminer les 500 et rendre les erreurs informatives
**Estimation:** Backend only
- [x] 1.1 Fix error handling agent invite (str(e) pour ValueError, catch spécifiques, HTTPException re-raise)
- [x] 1.2 Fix ConfigRuleUpdate validation (_validate_config_shape dans service, 422 au lieu de 500)
- [x] 1.3 Fix error handlers génériques (6 endpoints: invite, activate, admin invite, admin activate, validate, user CRUD)
- [x] 1.4 Guard email_service None (agent + admin invitation)
- [x] 1.5 Guard metadata parsing failure → raise ValueError au lieu de return {}
- [x] 1.6 Tests unitaires: 23 tests (config shape validation + update_rule integration)
- [x] 1.7 Auto-critique: 2 problèmes critiques trouvés et corrigés (exception detail leak, admin email guard)
**Fichiers modifiés:** 6 fichiers backend + 1 fichier test

### Phase 2: Data Cleanup & Sécurité (Bugs 3, 9, 10) ✅ TERMINÉE
**Objectif:** Nettoyer les données corrompues et renforcer l'intégrité
- [x] 2.1 Migration SQL 283: désactiver agents fantômes (email_verified=false + active → deactivated)
- [x] 2.2 Migration inclut: profiles deactivated, workloads set unavailable, audit log
- [x] 2.3 Metadata double-serialization: raise ValueError au lieu de return {} (fait en Phase 1.4)
**Fichiers:** 1 migration SQL

### Phase 3: Frontend UX & Intégrité (Bugs 2, 5, 11, 12) ✅ TERMINÉE
**Objectif:** Corriger l'UX et les incohérences frontend
- [x] 3.1 Bouton "Editar info" plus visible (variant outline, border primary, h-8 px-3)
- [x] 3.2 ObligationsReviewStep: affiche erreur + bouton retry au lieu de page blanche
- [x] 3.3 Toast multilingue corrigé (texte espagnol cohérent, supprimé le "a été envoyé" français)
- [x] 3.4 Promise.all → exécution séquentielle (profil AVANT email pour éviter désactivation si profil échoue)
- [x] 3.5 Agent navigation réduit de page_size=100 → 20 (80% moins de données, aligné avec la page liste)
**Fichiers:** 2 composants frontend

### Phase 4: Bundle Workflow Classification (Bug 5 — Solution Architecturale) ✅ TERMINÉE
**Objectif:** Résoudre le problème de fond: zone + catégorie après OCR
- [x] 4.1 Design: Preview + Override (inline dans ObligationsReviewStep, pas de nouveau step wizard)
- [x] 4.2 Backend: `POST /bundle-workflow/classify-preview` (preview sans création)
- [x] 4.3 Backend: `initiate_from_upload()` accepte `zone_id` + `commerce_type` overrides
- [x] 4.4 Frontend: hook `classificationPreview` state + auto-call après upload
- [x] 4.5 Frontend: sélecteurs zone/catégorie inline dans ObligationsReviewStep
- [x] 4.6 TypeScript: 0 erreurs, Backend: 23/23 tests passent
- [x] 4.7 Plan détaillé: `.claude/plans/PHASE4_BUNDLE_CLASSIFICATION.md`
**Fichiers:** 4 backend + 4 frontend

---

*Rapport rédigé le 2026-04-01. Chaque phase sera détaillée dans un plan séparé avant implémentation.*
