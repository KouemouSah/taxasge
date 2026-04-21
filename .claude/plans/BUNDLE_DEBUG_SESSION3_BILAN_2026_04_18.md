# BILAN SESSION 3 — Bundle workflow debug Phase 9

**Date de début** : 2026-04-16
**Date de fin** : 2026-04-18
**Branche** : `develop`
**Worktree** : `bundle-phase9` (branche `worktree-bundle-phase9`)
**Durée cumulée** : ~20h effectives sur 3 journées

---

## 1. Résumé exécutif

Session 3 a repris le travail Phase 9 depuis le boot prompt `BUNDLE_DEBUG_PHASE9_BOOT.md`. Tous les items du backlog Phase 9 ont été traités (X4, 409 guard, UI1-UI9, P8.2-B, B6, B7). La session a aussi couvert des bugs critiques découverts en test staging (stats crash, i18n, groupement OMS, sémantique, permissions, dashboard MIN_*, amount_paid, sécurité OWASP, SR auto-complete, phone column, 409 UX redirect).

**État final** :
- ✅ **X4** : widgets OMS MIN_* (4 variants) + stats enrichies (awaiting_document, not_started)
- ✅ **409 guard** : scope obligation-level + migration 297 (unique index relaxé)
- ✅ **UI1-UI9** : bundle info treasury (company, RC, actividad, zone, city, obligations list)
- ✅ **P8.2-B** : 3ème path get_queue_stats (obligation processors)
- ✅ **B6** : page citoyen bundle details (splits + obligations)
- ✅ **B7** : email enrichi bundle (entity + progress + obligations list)
- ✅ **Stats crash** : `locked_by_agent` enum inexistant → corrigé
- ✅ **i18n** : 17 clés agent.oms.nav.*, OMS status labels, fee_type labels, workflowNames.BUNDLE_PAYMENT
- ✅ **Sémantique** : "Montant en attente" → "Valeur fiscale à traiter" pour MIN_*
- ✅ **Permissions** : treasury.view_payment accordé à AYUNT/CAMARA (mig 298)
- ✅ **Dashboard MIN_*** : route entity dashboard (mig 300) + 3ème path stats
- ✅ **OMS page** : groupement par licence, collapse/expand, service names, fee_type supprimé
- ✅ **Licence detail** : Tipo+Ministerio → service_name
- ✅ **amount_paid** : processing compté comme payé dans KPIs licence
- ✅ **Sécurité OWASP** : XSS escape email, SR auto-complete bundle
- ✅ **phone** : u.phone → u.phone_number (public.users vs auth.users)
- ✅ **409 UX** : "Paiement déjà enregistré" + CTA "Voir ma demande" + redirect SR

---

## 2. Commits poussés sur `origin/develop` (~18 commits)

| # | Item | Scope |
|---|------|-------|
| 1 | X4 widgets OMS MIN_* | Frontend (OmsObligationsWidget + WidgetRegistry) |
| 2 | 409 guard obligation-level | Backend + migration 297 |
| 3 | X4 bis stats enrichies | Backend + Frontend |
| 4 | UI1-UI9 bundle info treasury | Backend + Frontend + i18n |
| 5 | Stats crash + i18n nav + obligations list | Backend + Frontend + i18n |
| 6 | OMS: stats fix, perms, grouping, sémantique | Frontend + migrations 298/299 |
| 7 | P8.2-B 3ème path obligation processors | Backend |
| 8 | Lint fix (Phone, MessageSquare, ChevronUp) | Frontend |
| 9 | OMS UX: collapse, service names, phone, dashboard MIN_* | Backend + Frontend + migration 300 |
| 10 | amount_paid processing = paid | Backend |
| 11 | B6 page citoyen bundle details | Backend + Frontend |
| 12 | B7 email enrichi bundle | Backend + migration 301 |
| 13 | Sécurité XSS + SR auto-complete | Backend |
| 14 | Lint/types fix (DetailViewResponse) | Frontend |
| 15 | detail-view commercial_license_id fix | Backend |
| 16 | u.phone → u.phone_number + 409 UX redirect | Backend + Frontend |

**Migrations SQL** : 297, 298, 299, 300, 301 (toutes idempotentes, appliquées en staging)

---

## 3. Architecture validée en staging

### 3.1 Dashboard entity MIN_* (nouveau)
```
MIN_HACIENDA agent login → /dashboard/agent/min-hacienda
  ↓ GenericEntityDashboard
  ↓ useEntityStats → GET /queue/stats?entity_code=MIN_HACIENDA
  ↓ 3ème path (obligation processor): count license_obligations
  ↓ Widgets: oms_pending_processing, oms_processed_today, oms_documents_pending, oms_ministry_stats
  ↓ OMS queue page: /dashboard/agent/oms (groupé par licence, collapse, service names)
```

### 3.2 Page citoyen bundle (nouveau)
```
/service-requests/{id}/detail-view
  ↓ bundle_details (conditional BUNDLE_PAYMENT)
  ↓ Splits grid (3 colonnes: entity + amount + status badge)
  ↓ Obligations list (service name + amount + status icon)
```

### 3.3 Email enrichi (nouveau)
```
PAYMENT_CASH_VALIDATED event (bundle)
  ↓ entity_name + progress (X/N) + obligation names
  ↓ "Todas las validaciones completadas" sur le dernier split
  ↓ XSS-escaped via html.escape()
```

---

## 4. Bugs découverts et résolus

### 4.1 Stats crash `locked_by_agent`
L'enum `payment_workflow_status` n'a PAS de valeur `locked_by_agent`. La query `get_queue_stats` crashait → toutes les stats cards à 0 pour TOUS les agents.

### 4.2 u.phone vs u.phone_number
`public.users.phone_number` ≠ `auth.users.phone`. Mon code utilisait `u.phone` (table Supabase auth) au lieu de `u.phone_number` (table publique). Crashait la page validation pour tous les agents.

### 4.3 SR auto-complete prématuré
`manual_processor.validate_payment` marquait le SR comme PAID dès le premier split validé. Pour les bundles, le SR doit rester PAYMENT_PROCESSING tant que tous les splits ne sont pas completed.

### 4.4 detail-view AttributeError
`ServiceRequestResponse` n'expose pas `commercial_license_id`. Mon code B6 accédait `request.commercial_license_id` → AttributeError → 500 sur toutes les pages détail bundle.

### 4.5 amount_paid ne comptait pas processing
Les obligations en `processing` (post-paiement, en traitement MIN_*) n'étaient pas comptées dans `amount_paid`. La licence montrait une balance fausse.

---

## 5. Règles établies cette session

1. **TOUJOURS vérifier le schéma (table_schema)** : `phone` existe dans `auth.users` mais PAS dans `public.users`. Filtrer par `table_schema = 'public'` dans les queries information_schema.
2. **TOUJOURS tester les enum values** : vérifier que les valeurs utilisées dans les IN/FILTER clauses existent réellement dans l'enum PostgreSQL.
3. **replace_all=true est dangereux** : peut modifier des queries dans d'autres fonctions sans les JOINs nécessaires.
4. **Sémantique OMS** : MIN_* agents traitent des obligations APRÈS paiement. "En attente" est faux → "À traiter". "Montant" est faux → "Valeur fiscale".
5. **Pydantic ≠ DB** : `ServiceRequestResponse` ne contient pas tous les champs de `service_requests`. Pour accéder à des colonnes non-exposées, faire un SELECT direct.

---

## 6. Items restants (Phase 10)

### CRITIQUES

| # | Bug | Description |
|---|-----|-------------|
| **P1** | 🔴 Validation obligation sans paiement | OmsAgentService.process_obligation permet de valider une obligation dont le paiement n'est pas encore validé par TESORO. Guard manquant : `lo.status NOT IN ('paid', 'processing')` → bloquer |
| **P2** | 🔴 OMS queue montre obligations non-payées | La queue OMS filtre `lo.status IN ('pending', 'overdue', 'processing')` mais pour MIN_*/AYUNT/CAMARA, seules `paid`/`processing` sont post-paiement. Les `pending` n'ont rien à faire dans la queue OMS |
| **P3** | 🔴 Licences "Abierta" après initiation paiement | `initiate_payment` passe les obligations à `payment_pending` mais n'appelle pas `update_license_counters`. Les compteurs restent à 0. Status licence reste "open" au lieu de "partial" |

### HIGH — Menu "Obligations" MIN_*

| # | Bug | Description |
|---|-----|-------------|
| **P4** | 🟡 Menu Obligations vide pour MIN_* | Le menu "Obligations → En Cours / Terminées" pointe vers `/oms/queue` mais cette page est DIFFÉRENTE de la page `/oms` (File d'Obligations). Analyser : ces 2 menus pointent-ils vers la même page ? Sinon, quelle est la différence fonctionnelle ? Proposer une structure de menu claire |

### HIGH — Cycle de vie notification citoyen bundle

| # | Feature | Description |
|---|---------|-------------|
| **P5** | 🟡 Licence PDF à l'initiation du paiement | Quand le citoyen valide son paiement (cash), il devrait recevoir : (a) une confirmation de sa demande (comme la fiche de solicitude des workflows non-bundle), (b) une licence provisoire avec le statut des obligations payées, (c) notification + email. Actuellement il ne reçoit RIEN entre l'initiation et la validation par TESORO |
| **P6** | 🟡 Licence PDF progressive | À chaque validation d'obligation par un agent MIN_*, la licence devrait être re-générée avec la ligne validée mise à jour et envoyée au citoyen. Le citoyen reçoit N versions de sa licence au fur et à mesure des validations |
| **P7** | 🟡 Facture de paiement vs Reçu | Le citoyen devrait recevoir une FACTURE (proforma) au moment du paiement (avant validation TESORO), puis un REÇU (validé) après validation. Ce sont 2 documents distincts |

### MEDIUM — UX

| # | Bug | Description |
|---|-----|-------------|
| **P8** | Collapse 1 obligation | Ne pas collapse pour les entreprises avec 1 seule obligation. Collapse à partir de 2+ |
| **P9** | Widget alertes dupliqué | dashboard_config AYUNT a `oms_overdue_alerts` + `oms_compliance_summary` qui pointent tous les 2 vers AlertsWidget → doublon. Supprimer un des deux dans la BD |
| **P10** | Labels non traduits licence | Ajouter clés `oms.licenses.obligationName`, `.amount`, `.dueDate`, `.statusCol`, `.actionsCol` dans es/fr/en |
| **P11** | Labels espagnol résiduels | "Total", "Pagado", "Balance", "Recuperación" sur page licence détail |
| **P12** | Navigation Assistant IA | Retour depuis /chat → dashboard citoyen au lieu du dashboard agent |

### LOW

| # | Bug | Description |
|---|-----|-------------|
| **P13** | Batch validation obligations | Permettre la validation batch depuis le tableau OMS avec indicateur visuel du statut paiement (payé/non-payé) pour éviter de valider sans paiement |
| **P14** | run_migrations tracking table | Infrastructure interne |
| **P15** | MVCC non-bundle wizard_session_service | Bug latent jamais déclenché |

---

## 7. Références

- `.claude/plans/BUNDLE_DEBUG_PHASE9_BOOT.md` — prompt d'initialisation session 3
- `.claude/plans/BUNDLE_DEBUG_SESSION2_BILAN_2026_04_16.md` — bilan session 2
- `memory/feedback_no_regression_working_flows.md` — règle non-régression
- `scripts/reset_bundle_staging.py` — staging reset tool

**Fin du bilan session 3.**
