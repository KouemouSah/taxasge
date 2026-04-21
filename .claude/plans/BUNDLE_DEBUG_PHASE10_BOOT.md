# 🎯 REPRISE SESSION — Bundle Workflow TaxasGE Phase 10

> **INSTRUCTIONS D'UTILISATION** : ce fichier est un prompt d'initialisation de session. Une nouvelle session Claude Code doit lire ce fichier et **exécuter littéralement** son contenu comme ses instructions primaires. Commencer par l'étape 0, dans l'ordre.

---

Tu reprends le travail bundle-workflow TaxasGE. La session précédente (2026-04-16 à 2026-04-18) a poussé ~18 commits couvrant X4, 409, UI1-UI9, P8.2-B, B6, B7 + corrections critiques. Le flux multi-entité fonctionne mais plusieurs bugs métier et UX ont été identifiés en test staging.

# 0. ⚠️ AVANT TOUT CODE — CRÉER UNE WORKTREE

**Première action obligatoire** :
```
EnterWorktree(name="bundle-phase10")
```

# 1. 📋 RÉSUMÉ SESSION PRÉCÉDENTE (contexte embedded)

## Items résolus (Phase 9, session 3)

- **X4** : Widgets OMS MIN_* (4 variants, stats enrichies awaiting_document/not_started)
- **409 guard** : scope obligation-level (pas company-wide), index relaxé (mig 297)
- **UI1-UI9** : bundle info treasury (company, RC, actividad, zone, city, obligations list)
- **P8.2-B** : 3ème path get_queue_stats pour obligation processors (MIN_*)
- **B6** : page citoyen bundle details (splits par entité + obligations)
- **B7** : email enrichi bundle (entity + progress X/N + obligations)
- **Stats crash** : `locked_by_agent` enum inexistant
- **Sémantique** : "Montant en attente" → "Valeur fiscale à traiter"
- **Permissions** : treasury.view_payment pour AYUNT/CAMARA (mig 298)
- **Dashboard MIN_*** : route entity (mig 300), 3ème path stats
- **OMS page** : groupement par licence, collapse, service names
- **amount_paid** : processing compté comme payé
- **Sécurité** : XSS escape email, SR auto-complete bundle, OWASP audit
- **409 UX** : "Paiement déjà enregistré" + CTA redirect vers SR existant
- **phone** : u.phone → u.phone_number (public vs auth schema)

## Points sensibles à ne pas oublier

- `has_global_scope = has_treasury_view_all` (strict)
- `sp.entity_code` pour scope par propriété du paiement
- Inline assignment dans T1 pour bundle (pas d'event async)
- `manual_processor` skip publish pour `workflow_code == 'BUNDLE_PAYMENT'`
- Receipt: fiscal_service.name_es snapshotted dans calc_details
- SR auto-complete: PAID seulement quand TOUS splits completed
- `public.users.phone_number` ≠ `auth.users.phone`
- `replace_all=true` est dangereux — peut modifier des queries non-ciblées
- Toujours vérifier `table_schema = 'public'` dans information_schema

# 2. 🚫 RÈGLES NON NÉGOCIABLES

Identiques au BOOT Phase 9 (voir `.claude/plans/BUNDLE_DEBUG_PHASE9_BOOT.md` §2), plus :

- **Règle #17** : TOUJOURS vérifier `table_schema = 'public'` quand on query information_schema.columns. Supabase a `auth.users` avec des colonnes différentes de `public.users`.
- **Règle #18** : TOUJOURS tester les enum values avec `SELECT unnest(enum_range(NULL::type_name))` avant de les utiliser dans une query.
- **Règle #19** : NE JAMAIS pousser sans avoir auto-critiqué sécurité (OWASP), performance (indexes), et cohérence métier (les données affichées reflètent-elles la réalité du process ?).
- **Valider chaque commit avec l'utilisateur AVANT de passer au suivant.**

# 3. 📦 BACKLOG PRIORISÉ — Phase 10

## 3.1 CRITIQUES (data integrity)

### P1 — Guard validation obligation sans paiement
**Sévérité** : 🔴 CRITIQUE
**Symptôme** : Un agent OMS peut cliquer "Procesar" sur une obligation en status `pending` (pas encore payée). L'obligation passe à `completed` sans que le paiement ait été validé.
**Root cause** : `OmsAgentService.process_obligation` ne vérifie pas que `lo.status IN ('paid', 'processing')`.
**Fix** : Ajouter un guard `if lo.status not in ('paid', 'processing'): raise ValueError("OBLIGATION_NOT_PAID")`.
**Impact** : données corrompues — une obligation "completed" sans paiement validé.
**Fichier** : `packages/backend/app/modules/fiscal_services/services/oms_agent_service.py`

### P2 — OMS queue montre obligations non-payées
**Sévérité** : 🔴 HIGH
**Symptôme** : AYUNT voit 9 entreprises dans sa File d'Obligations (Tableau de Bord OMS) mais stats montrent "À traiter: 0". Les obligations affichées sont en status `pending` (jamais payées).
**Root cause** : `LicenseRepository.get_agent_queue` filtre `lo.status IN ('pending', 'overdue', 'processing')`. Pour les agents OMS post-paiement, seules `paid`/`processing` sont pertinentes.
**Fix** : Changer le filtre en `lo.status IN ('paid', 'processing')` pour la queue OMS. Les obligations `pending` ne doivent apparaître que dans la Vue d'Ensemble (pas dans la queue de travail).
**Fichier** : `packages/backend/app/modules/fiscal_services/repositories/license_repository.py`

### P3 — Licences "Abierta" après initiation paiement
**Sévérité** : 🔴 HIGH
**Symptôme** : Vue d'Ensemble montre toutes les entreprises comme "Abierta" avec 0 XAF payé, même celles avec `payment_pending` obligations.
**Root cause** : `bundle_workflow_service.initiate_payment` met les obligations à `payment_pending` mais ne call PAS `LicenseService.update_license_counters`. Les compteurs `obligations_paid` et `amount_paid` restent à 0.
**Fix** : Après la boucle d'update des obligations (`UPDATE license_obligations SET status='payment_pending'`), appeler `update_license_counters(license_id)`.
**Note** : `update_license_counters` compte déjà `paid`+`processing`+`completed` mais PAS `payment_pending`. Décision métier : `payment_pending` doit-il compter comme "payé" dans les compteurs ? Mon avis : NON (l'argent n'est pas encore encaissé). Mais le status de la licence devrait passer à "partial" ou un nouveau status "payment_initiated".

## 3.2 HIGH — Menu "Obligations" MIN_* (analyse requise)

### P4 — Menu Obligations vide
**Contexte** : Les agents MIN_* ont un menu "Obligations → En Cours / Obligations terminées" qui pointe vers `/dashboard/agent/oms/queue` et `/dashboard/agent/oms/queue/completed`.
**Question** : Ce menu est-il DIFFÉRENT du "Tableau de Bord OMS" (`/dashboard/agent/oms`) ? Si oui, quelle est la différence fonctionnelle ?
**Analyse à faire** :
1. Lire le composant de la page `/dashboard/agent/oms/queue` (s'il existe)
2. Comparer avec `/dashboard/agent/oms` (File d'Obligations)
3. Si c'est la même page → fusionner ou supprimer le menu redondant
4. Si c'est différent → comprendre le use case et le corriger

### P5-P7 — Cycle de vie notification citoyen bundle

**Contexte métier** : Dans les workflows non-bundle (pasaporte, conducir, etc.), le citoyen reçoit :
1. **À la soumission** : fiche de solicitude (PDF) → email + espace personnel
2. **Au paiement** : notification "paiement en attente de validation"
3. **À la validation** : reçu (PDF) → email

Pour le bundle, le citoyen ne reçoit **que le reçu** (étape 3). Il manque les étapes 1 et 2.

**P5 — Licence provisoire à l'initiation** :
- Quand le citoyen valide son paiement cash, générer une **licence provisoire** (PDF) avec :
  - Info entreprise (nom, RC, zone, ville)
  - Liste des obligations sélectionnées avec status "En attente de validation"
  - Référence(s) de paiement
  - QR code de vérification
- Envoyer par email + disponible dans l'espace citoyen
- Ce document sert de **justificatif de dépôt** pour le citoyen

**P6 — Licence progressive** :
- À chaque validation d'obligation par un agent (TESORO valide split → MIN_* valide obligation), re-générer la licence avec les lignes mises à jour
- Question produit : envoyer un email à chaque mise à jour (risque spam si 10 obligations) OU envoyer uniquement quand toutes les obligations d'un split sont validées ?
- Mon avis : envoyer uniquement au 2 moments clés :
  1. Quand TESORO valide le paiement (split) → licence avec obligations "payées, en cours de traitement"
  2. Quand TOUTES les obligations sont completed → licence finale "complète"

**P7 — Facture vs Reçu** :
- **Facture proforma** : générée à l'initiation du paiement (avant validation TESORO). Document légal indiquant ce que le citoyen doit/a payé.
- **Reçu** : généré à la validation par TESORO. Document légal confirmant l'encaissement.
- Ce sont 2 documents distincts avec des templates différents.
- Décision produit : la facture proforma est-elle nécessaire pour le MVP ? Mon avis : OUI, c'est le justificatif que le citoyen présente à l'agent TESORO quand il va payer en espèces.

## 3.3 MEDIUM — UX

| # | Bug | Description | Effort |
|---|-----|-------------|--------|
| **P8** | Collapse 1 obl | `if (group.items.length === 1)` → afficher inline sans collapse | 15 min |
| **P9** | Widget alertes dupliqué | Supprimer `oms_compliance_summary` ou `oms_overdue_alerts` dans dashboard_config AYUNT/CAMARA en BD | 10 min |
| **P10** | Labels licence détail | Ajouter `oms.licenses.obligationName/amount/dueDate/statusCol/actionsCol` dans es/fr/en | 15 min |
| **P11** | Labels espagnol résiduels | "Total", "Pagado", "Balance", "Recuperación" sur page licence détail → i18n | 15 min |
| **P12** | Navigation Assistant IA | Retour /chat → dashboard citoyen. Vérifier le routing post-auth (role-based redirect) | 30 min |

## 3.4 LOW

| # | Bug | Description |
|---|-----|-------------|
| **P13** | Batch validation + indicateur paiement | Ajouter badge "payé/non-payé" sur chaque obligation dans la queue OMS. Bloquer batch process si obligation non-payée |
| **P14** | run_migrations tracking table | Infrastructure |
| **P15** | MVCC non-bundle | Bug latent wizard_session_service |

**Ordre recommandé** : P1 → P2 → P3 → P4 → P8-P11 (batch UX) → P5-P7 (cycle notifications, nécessite décision produit) → P12-P15

# 4. 🧪 WORKFLOW DE DÉMARRAGE

1. **Créer worktree** : `EnterWorktree(name="bundle-phase10")`
2. **Lire les contextes** :
   - `BUNDLE_DEBUG_SESSION3_BILAN_2026_04_18.md` (bilan complet)
   - `BUNDLE_DEBUG_PHASE10_BOOT.md` (ce fichier)
   - `CLAUDE.md` (racine) — règles projet
   - `memory/MEMORY.md` — mémoire persistante
3. **Snapshot git** : `git log --oneline -15` + `git status`
4. **Snapshot BD** : probe ciblé pour vérifier l'état des obligations/licences/paiements
5. **Rédiger** plan détaillé du premier item (P1)
6. **Demander validation** utilisateur avant tout changement code
7. Implémenter → Auto-critique → Tests → Commit local → Validation → (repeat)
8. Push uniquement après validation utilisateur

# 5. 🚫 CE QUE TU NE DOIS PAS FAIRE SANS AUTORISATION

- `git push` sans confirmation explicite
- Modifier le code de workflows non-bundle
- `DROP` / `TRUNCATE` en BD staging
- Refactor au-delà du scope du ticket
- Créer des migrations SQL sans vérifier les colonnes en BD d'abord (règle #12)
- Utiliser `replace_all=true` sans vérifier le nombre d'occurrences
- Pousser sans auto-critique OWASP + performance + cohérence métier (règle #19)

# 6. 📨 PREMIER MESSAGE ATTENDU

Après worktree + lecture contexte + snapshots :

Résume en **3-5 phrases** :
1. Ce que tu as compris du contexte (1 phrase)
2. Ton plan pour le premier item P1 (2 phrases)
3. Questions ouvertes nécessitant décision utilisateur (1-2 phrases)

Attends la **validation user explicite** avant tout changement de code.

---

**Fichiers clés à consulter** :
- `.claude/plans/BUNDLE_DEBUG_SESSION3_BILAN_2026_04_18.md` — bilan session 3
- `packages/backend/app/modules/fiscal_services/services/oms_agent_service.py` — process_obligation (P1 guard)
- `packages/backend/app/modules/fiscal_services/repositories/license_repository.py` — get_agent_queue (P2 filter) + get_agent_queue_stats
- `packages/backend/app/modules/fiscal_services/services/bundle_workflow_service.py` — initiate_payment (P3 counters)
- `packages/backend/app/modules/fiscal_services/services/license_service.py` — update_license_counters
- `packages/web/src/app/[locale]/(dashboard)/dashboard/agent/oms/page.tsx` — OMS queue (P8 collapse)
- `packages/web/src/app/[locale]/(dashboard)/dashboard/agent/oms/licenses/[id]/page.tsx` — licence détail (P10-P11 labels)
- `packages/web/src/modules/agent-dashboard/components/widgets/WidgetRegistry.tsx` — widget registry (P9 doublon)

**Fin du prompt. Commence par l'étape 0.**
