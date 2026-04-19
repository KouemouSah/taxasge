# Bilan Session 2026-04-19 + Plan Correctif Définitif

## 1. Modifications apportées cette session

### Commit `9785002f` — fix(assignment): strict location scope + entity_code alignment
**Fichiers** : `payment_assignment_handler.py`, `workload_repository.py`

| Change | Impact | Statut |
|--------|--------|--------|
| `entity_code = target_entity_code` ajouté dans UPDATE service_payments | Dashboard stats widgets trouvent maintenant les paiements non-bundle | ✅ Correct |
| HAVING `< $1` → `<= $1` (seuil capacité) | Agents à exactement 80% ne sont plus exclus | ✅ Correct |
| Fallback entity-wide remplacé par retry même-site sans seuil | Location scope absolu respecté | ✅ Correct |

### Commit `4fe98ebc` — feat(verify+vault+decision)
**Fichiers** : `verify page.tsx`, `receipt_service.py`, `wizard_session_service.py`, `agent_routes.py`

| Change | Impact | Statut |
|--------|--------|--------|
| P1: Préfixes CON-/PAS-/etc. dans verify page | Lien QR solicitud fonctionne | ✅ Correct |
| P2: auto_import_generated() après receipt PDF | Reçus apparaîtront dans Documents > Générés | ⚠️ Non testé (deploy OK) |
| P2: Firebase upload + auto_import solicitud PDF | Solicitudes apparaîtront dans Documents > Générés | ⚠️ Non testé |
| P3: Dual-source auth (agent_work_queue OR assignments) | Agents DGT peuvent cliquer Aprobar | ⚠️ Patch temporaire |

### Commit `46e1422c` — fix(agent-decision): status::text cast
**Fichier** : `agent_routes.py`

| Change | Impact | Statut |
|--------|--------|--------|
| `status::text = ANY($2::text[])` (4 occurrences) | Comparaison enum/text fonctionne | ✅ Correct |

### Backfill BD (scripts, non-commités)

| Script | Action | Réversible |
|--------|--------|-----------|
| `seed_bundle_test_apply.py` | 61 sociétés bundle + obligations | Oui (cleanup script) |
| `fix_conducir_sync.py` | entity_code DGT→TESORO + reassign Malabo | Oui |
| Revert assignments cancel | 9 assignments restaurées | Fait |

---

## 2. Root Cause Unique Identifiée

### Le chaînon manquant : `assignment_outbox_service.py` ligne 341-356

Le service `AssignmentOutboxService.process_outbox_item()` fait 3 choses dans une transaction :
1. **`agent_queue_service.add_to_queue()`** → INSERT dans `agent_work_queue` avec `assigned_to = NULL`
2. **`auto_assign_item()`** → INSERT dans `assignments` avec `agent_profile_id = <correct agent>`
3. **Sync `service_requests.assigned_to`** = `agent_user_id` ← FAIT ✓

**Manquant** : sync `agent_work_queue.assigned_to` = `agent_user_id` ← **JAMAIS FAIT**

Conséquence : `agent_work_queue.assigned_to` est NULL pour **100% des 11 entrées** en BD.
Le handler `make_decision` vérifie `agent_work_queue.assigned_to = current_user` → toujours NULL → toujours 403.

**Cela affecte TOUS les agents de TOUS les workflows** : PASAPORTE, CONDUCIR, BUNDLE, RESIDENCIA, etc.

### Preuve BD

```
agent_work_queue : total=11, with_assignee=0 (100% NULL)
assignments      : 45 entries, 27 assigned, 17 completed, 1 rejected (système fonctionnel)
```

### Aussi dans `agent_queue_handler.py`

Le handler qui écoute `REQUEST_SUBMITTED` appelle aussi `add_to_queue()` sans sync du `assigned_to`. Même bug, même cause.

---

## 3. Impact du patch temporaire (dual-source)

Mon fix "dual-source" dans `make_decision` contourne le bug en acceptant l'auth via `assignments` quand `agent_work_queue` est vide. C'est un **workaround valide** mais :

| Ce qui fonctionne | Ce qui ne fonctionne pas |
|---|---|
| Aprobar/Rechazar/Solicitar docs | Completados (query agent_work_queue.status='completed') |
| Assignment tracking correct | Stats Pendientes/En Proceso (query agent_work_queue) |
| status::text comparaison | Queue release/reassign (opère sur agent_work_queue) |
| | Escalation (agent_work_queue.escalated) |
| | SLA tracking (agent_work_queue.sla_deadline/sla_status) |

Le patch ne résout que `make_decision`. Les 76 autres références à `agent_work_queue` dans le code restent cassées.

---

## 4. Bugs ouverts reportés de la session précédente (Phase 8)

| Bug | Sévérité | Statut |
|---|---|---|
| X8 : Receipt PDF montants à 0 | CRITIQUE | OUVERT |
| X9 : Redirection post-validation → supervisor 403 | BLOCKER | OUVERT |
| X2 : 403 AYUNT/CAMARA Aprobar (bundle SR-level) | BLOCKER | OUVERT |
| X1 : Dashboard vs Validation page desync | MEDIUM+ | OUVERT |
| UI1-UI9 : 9 issues UX validation page bundle | MEDIUM | OUVERT |

---

## 5. Plan Correctif Définitif — Prochaine Session

### Phase 0 — Fix racine `assigned_to` (1h)

**Le seul vrai fix.** Tout le reste en découle.

**Fichier** : `packages/backend/app/modules/service_requests/services/assignment_outbox_service.py`

**Action** : Après la ligne 356 (sync service_requests.assigned_to), ajouter :
```python
# Sync agent_work_queue.assigned_to (chaînon manquant)
await db.execute("""
    UPDATE agent_work_queue
    SET assigned_to = $1, assigned_at = NOW(), status = 'assigned', updated_at = NOW()
    WHERE item_id = $2 AND item_type = 'service_request'
      AND (assigned_to IS NULL OR status = 'pending')
""", agent_user_id, service_request_id)
```

**Même fix dans** : `agent_queue_handler.py` (si path similaire)

**Backfill BD** : UPDATE les 11 entrées existantes :
```sql
UPDATE agent_work_queue awq
SET assigned_to = ap.user_id, assigned_at = a.assigned_at, status = 'assigned'
FROM assignments a
JOIN agent_profiles ap ON ap.id = a.agent_profile_id
WHERE a.item_id = awq.item_id AND a.item_type = awq.item_type
  AND a.status IN ('assigned', 'in_progress')
  AND awq.assigned_to IS NULL;
```

**Checklist** :
- [ ] Fix outbox service
- [ ] Fix agent_queue_handler (si applicable)
- [ ] Backfill BD
- [ ] Vérifier : agent_work_queue 0 entrées avec assigned_to=NULL
- [ ] Supprimer le dual-source workaround dans make_decision (cleanup)

### Phase 1 — Supprimer le patch dual-source (30min)

Une fois Phase 0 appliquée, `agent_work_queue.assigned_to` sera toujours rempli. Le CTE `asn` dans make_decision devient inutile. Revenir à la vérification simple via `agent_work_queue` seul.

**OU** garder le dual-source comme safety net (défense en profondeur).

### Phase 2 — Completados / Stats / Notification (2h)

Avec `agent_work_queue` correctement peuplé :
- [ ] Completados : vérifier que la query utilise `agent_work_queue.status = 'completed'` + tester
- [ ] Stats Pendientes : vérifier le compteur
- [ ] Notification post-approve : tester `_bg_approve_pdf_and_notify` de bout en bout
- [ ] Status auto-advance : après DOSSIER_VALIDE, si paiement + cita existent, avancer vers CITA_SCHEDULED ou IN_PROGRESS

### Phase 3 — Bugs Phase 8 restants (4-6h)

- [ ] X8 : Receipt PDF montants à 0 (template lit mauvaise variable)
- [ ] X9 : Redirection post-validation (frontend router hardcodé)
- [ ] X2 : 403 AYUNT/CAMARA (même root cause que le fix Phase 0, devrait être résolu)
- [ ] X1 : Dashboard desync (unifier queries stats)

### Phase 4 — Site appointment agent (1h)

- [ ] Composant AppointmentScheduler : default site = agent's entity_location_id, pas le premier de la liste

### Phase 5 — Tests E2E automatisés (3-4h)

Pytest fixtures pour les 3 workflows critiques :
- [ ] PASAPORTE : soumission → assignation → make_decision(approve) → notification → status DOSSIER_VALIDE → completados
- [ ] CONDUCIR : soumission → paiement → cita → assignation → make_decision(approve) → auto-advance
- [ ] BUNDLE : initiate_payment → entity routing → validation split par split → receipt → email

---

## 6. Ordre d'exécution recommandé

```
Phase 0 (fix racine assigned_to)     ← BLOQUE tout le reste
  ↓
Phase 1 (cleanup dual-source)        ← optionnel
  ↓
Phase 2 (completados + notification) ← testable immédiatement après Phase 0
  ↓
Phase 3 (bugs Phase 8)               ← indépendant
  ↓
Phase 4 (appointment site)           ← indépendant
  ↓
Phase 5 (tests E2E)                  ← après stabilisation
```

**Effort total estimé** : 1 journée de travail (8-10h)

---

## 7. Ce que je recommande pour la prochaine session

1. **Commencer par Phase 0** — c'est LE fix. Une ligne de code + un backfill SQL.
2. **Tester Phase 0 immédiatement** avec le dossier CON-2026-00001 : l'agent DGT doit pouvoir valider ET le dossier doit apparaître dans Completados.
3. **Enchaîner Phase 2** : tester notification citoyen + status advancement.
4. **Phase 3 en parallèle** si le temps le permet.

---

## 8. Fix racine implémenté (même session)

### Root cause : `assigned_to` jamais synchronisé

**3 fichiers** avaient le même bug (sync service_requests.assigned_to mais PAS agent_work_queue.assigned_to) :

| Fichier | Rôle | Fix |
|---|---|---|
| `assignment_outbox_service.py` | Assignation après paiement | + UPDATE agent_work_queue.assigned_to |
| `agent_queue_handler.py` | Assignation via event PAYMENT_COMPLETED | + idem |
| `service_request_service.py` | Assignation via submit_request | + idem + skip re-assign si déjà assigné |

### Flow "Demander docs" redesigné

**Avant** (cassé) :
```
Agent demande docs → agent_work_queue status='cancelled', assigned_to=NULL
Citoyen re-soumet  → NOUVELLE entrée + NOUVEAU auto_assign → potentiellement AUTRE agent
```

**Après** (corrigé) :
```
Agent demande docs → agent_work_queue status='waiting_documents' (garde assigned_to + SLA)
Citoyen re-soumet  → add_to_queue() réactive MÊME entrée → MÊME agent
                   → submit_request() skip auto_assign (assigned_to déjà set)
```

| Fichier | Changement |
|---|---|
| `agent_routes.py` make_decision/request_documents | `cancelled` → `waiting_documents`, garde `assigned_to` |
| `agent_queue_service.py` add_to_queue() | Détecte `waiting_documents` → réactive à `assigned` |
| `service_request_service.py` submit_request() | Skip auto_assign si `assigned_to` déjà set |

### Migration 305

```sql
CHECK (status IN ('pending','assigned','in_progress','completed','cancelled','waiting_documents','escalated'))
```

- `waiting_documents` : nouveau statut pour le flow demande de docs
- `escalated` : bug latent trouvé — `agent_routes.py` ligne 1867 écrivait `status='escalated'` mais ce statut n'était PAS dans le CHECK constraint. Aurait crashé à la première escalation réelle.

### Audit exhaustif des 76 références à `agent_work_queue`

| Query pattern | `waiting_documents` géré ? | Verdict |
|---|---|---|
| `add_to_queue()` : `NOT IN ('completed','cancelled')` | Oui, trouvée et réactivée | ✅ Corrigé |
| Pendientes : `IN ('assigned','pending')` | Exclu (correct, item en pause) | ✅ OK |
| Stats : `COUNT(*) FILTER (WHERE status='pending')` etc. | Non compté (correct) | ✅ OK |
| `complete_item()` : `SET status='completed'` | Fonctionne sur tout status | ✅ OK |
| `cancel_and_release()` : `NOT IN ('completed','cancelled')` | Inclut waiting_documents (cancellable) | ✅ OK |
| Batch approve : `IN ('assigned','pending')` | Exclu (correct, docs pas revus) | ✅ OK |
| Escalation : `SET status='escalated'` | Maintenant dans CHECK constraint | ✅ Corrigé |
| `entity_agent_tools.py` : `IN ('pending','assigned')` | Exclu (correct) | ✅ OK |

### Backfill BD

- 10/11 entrées `agent_work_queue` synchronisées (assigned_to + status)
- 1 entrée légitime sans assignment (SRV-2026-00003, pas d'agent disponible)
- CHECK constraint mise à jour en staging

### Revert du dual-source workaround

Le CTE `asn` (assignments fallback) dans `make_decision` a été supprimé — plus nécessaire maintenant que `agent_work_queue.assigned_to` est correctement peuplé.

---

## 9. Bugs restants (non traités cette session)

| Bug | Sévérité | Description |
|---|---|---|
| X8 | CRITIQUE | Receipt PDF montants à 0 |
| X9 | BLOCKER | Redirection post-validation → supervisor 403 |
| X2 | BLOCKER | 403 AYUNT/CAMARA Aprobar (bundle SR-level) |
| X1 | MEDIUM+ | Dashboard vs Validation page desync |
| Completados | MEDIUM | Vérifier que la query fonctionne maintenant |
| Notification post-approve | MEDIUM | Tester _bg_approve_pdf_and_notify |
| Status auto-advance | MEDIUM | DOSSIER_VALIDE → CITA_SCHEDULED si cita+paiement existent |
| Site appointment agent | LOW | Default = agent's site, pas premier de la liste |
