# Phase 8.1 — X9 : Redirection post-validation vers dashboard superviseur

**Statut** : 🔵 PLAN — investigation-first
**Date** : 2026-04-14
**Worktree** : `bundle-phase8` (branche `worktree-bundle-phase8`, HEAD `b196e01e`)
**Effort estimé** : 1–2 h (inclut 30 min de repro live)
**Référence BOOT** : §P8.2bis

---

## 1. Symptôme documenté (BOOT §P8.2bis)

Après qu'un agent (Tesoro / AYUNT / CAMARA) valide un paiement et clique **"Continuer"** sur l'écran de confirmation du reçu (`ReceiptSuccessDialog`), il se retrouve sur `/supervisor/dashboard` ou équivalent. Conséquence : **tous les widgets retournent 403** (l'agent n'a pas les perms `supervisor_*`). Blocker workflow — l'agent doit manuellement re-naviguer vers son propre dashboard.

## 2. Investigation statique effectuée (2026-04-14, worktree `bundle-phase8`)

### 2.1 Hypothèse initiale testée et INVALIDÉE

> « Le composant `ReceiptSuccessDialog` ou un helper `getAgentHomeRoute` a un `router.push('/supervisor/dashboard')` hardcodé. »

**Éléments réfutant l'hypothèse** :

| Chemin audité | Résultat |
|---|---|
| `packages/web/src/modules/treasury/components/ReceiptSuccessDialog.tsx` | Pas de `router.push` du tout. Le composant appelle `onClose()` uniquement. |
| `app/[locale]/(dashboard)/dashboard/agent/treasury/validation/[paymentId]/page.tsx:172 navigateAfterValidation()` | Redirige vers `/${locale}/dashboard/agent/treasury/validation` (correct). |
| `app/[locale]/(dashboard)/dashboard/agent/treasury/validation/page.tsx:1028` (list page) | Après close dialog, ne fait QUE re-sélectionner le payment suivant. Pas de push. |
| `middleware.ts` | Check auth + admin permissions. Aucune logique "if role != supervisor → redirect /supervisor". |
| `DashboardLayout.tsx` | Aucun redirect supervisor. |
| `AccessDenied.tsx` | Redirect vers `/dashboard/agent` (pas supervisor). |
| `grep -r "router.push('/supervisor"` dans `packages/web/src` | 0 match. |
| `grep -r "/dashboard/supervisor"` dans `modules/agent-dashboard` | Seul hit : `EscalationsWidget.tsx:163` — un lien `"viewAll"` visible uniquement pour les supervisors déjà (`context.isSupervisor`). Non déclenché côté agent. |

### 2.2 BD vérifiée : `roles.menu_config`

Aucun rôle `agent_*` n'a un `dashboard.href` pointant vers `/dashboard/supervisor`. Valeurs actuelles :

| Rôle | `menu_config.menus[id=dashboard].href` |
|---|---|
| `agent_tesoro` | `/dashboard/agent/tesoro` |
| `agent_ayuntamiento` | `/dashboard/agent/oms/validator` |
| `agent_camara` | `/dashboard/agent/oms/validator` |
| `agent_min_agricultura` | `/dashboard/agent/oms/processor` |
| `agent_min_hacienda` | `/dashboard/agent/oms/processor` |
| `agent_min_*` (autres) | `/dashboard/agent/oms/processor` |

**Donc la config BD n'est pas la source du bug.**

### 2.3 Observation tangentielle

`/dashboard/agent/tesoro` (valeur configurée pour agent_tesoro) **n'existe pas comme route** :

```
packages/web/src/app/[locale]/(dashboard)/dashboard/agent/
├── [entityCode]/    ← catch-all dynamique
├── cnedoge-pasaporte/
├── companies/
├── oms/
├── stats/
├── treasury/        ← existe
└── page.tsx         ← landing
```

**Pas de `tesoro/` folder.** Donc `/dashboard/agent/tesoro` tombe sur `[entityCode]/page.tsx` avec `entityCode='tesoro'` → `slugToEntityCode('tesoro')` → probablement `TESORO` → `GenericEntityDashboard`. À VÉRIFIER : le comportement si `TESORO` n'est pas dans les entités supportées par ce composant.

## 3. Hypothèses restantes (à tester en repro live)

| # | Hypothèse | Probabilité | Comment invalider / valider |
|---|---|---|---|
| **H1** | Le symptôme BOOT est imprécis : l'agent ne va PAS sur `/supervisor/*`, mais sur `/dashboard/agent/tesoro` (404 ou fallback GenericEntityDashboard) qui appelle des API widgets supervisor et **CEUX-CI** retournent 403. L'utilisateur a confondu "widgets 403" avec "je suis sur /supervisor". | 40 % | Network tab + URL bar après click Continuer |
| **H2** | Le catch-all `[entityCode]/page.tsx` avec entityCode `tesoro` (non reconnu) redirige silencieusement vers `/dashboard/supervisor` via une logique dans `GenericEntityDashboard` ou `useAgentDashboard`. | 25 % | Lire `GenericEntityDashboard.tsx` complet + `slugToEntityCode()` + trace entityCode `tesoro` |
| **H3** | Un composant Sidebar (lien "Home" / "Dashboard") a un `href` calculé depuis un helper qui résout mal le rôle → produit `/dashboard/supervisor`. | 20 % | Lecture complète `GenericAgentSidebar.tsx` + flow data `context.isSupervisor` |
| **H4** | Bug observé depuis l'ANCIEN état BD (avant le fix menu_config actuel) — le fix BD est déjà déployé mais pas testé manuellement ; X9 est peut-être DÉJÀ résolu. | 15 % | Repro live : si le bug ne se reproduit PAS → X9 est déjà mort, on ferme avec un test E2E |

**Note critique** : Les 4 hypothèses exigent toutes une **reproduction live** pour être départagées. Je ne peux pas avancer sur du fix sans repro.

## 4. Plan d'action

### Phase 0 — Reproduction + root-cause déterministe (30 min)

**Prérequisite** : validation utilisateur sur l'approche. Je ne lance pas de repro sans qu'elle soit nécessaire.

**Tâches** :
- [ ] **Demander à l'utilisateur les étapes exactes de reproduction** — login quel email ? validation quel paiement ? URL de départ ? URL observée post-click ?
- [ ] **Ou** : lancer `npm run dev` dans `packages/web/`, login `tesoreria.ge@outlook.fr` (agent Tesoro déjà utilisé en session précédente), naviguer `/dashboard/agent/treasury/validation`, valider un paiement pending, capturer :
  - URL barre après click Continuer
  - Onglet Network : tous les calls `/api/v1/supervisor/*` vs `/api/v1/admin/*`
  - Console : messages React / warnings / erreurs
- [ ] **Corollaire** : si H4 se vérifie (pas de bug repro), consigner la validation dans le plan et fermer P8.1 sans code.

**Critère de passage à Phase 1** : root cause identifiée avec certitude (stack trace / code path / composant précis).

### Phase 1 — Fix ciblé (30 min – 1 h, dépend de root cause)

Selon le résultat de Phase 0, l'une des 3 pistes :

**Piste A (si H1)** : widgets supervisor appelés depuis un dashboard agent
- Identifier le widget qui appelle `/supervisor/*`
- Ajouter une garde côté composant : `if (!context.isSupervisor) return null`
- OU migrer le widget vers un endpoint agent-friendly

**Piste B (si H2)** : `GenericEntityDashboard` ou `[entityCode]/page.tsx` mal routé
- Fix le slug-to-entity resolver pour reconnaître `tesoro`
- OU supprimer `agent_tesoro.menu_config.dashboard.href='/dashboard/agent/tesoro'` et pointer vers `/dashboard/agent/treasury` (route existante)
- Préférer **backfill data** (BOOT règle §2) : UPDATE `roles.menu_config` JSONB pour `agent_tesoro` → `"href":"/dashboard/agent/treasury"`

**Piste C (si H3)** : sidebar ou helper résout mal
- Fix le helper avec mapping rôle→route explicite
- Ajouter un test unitaire TSX sur le helper

### Phase 2 — Tests (30 min)

- [ ] Test E2E manuel (navigateur) : agent Tesoro → valider paiement → click Continuer → arrive sur son dashboard → widgets chargent 200
- [ ] Si fix data BD : ajouter une migration `292_fix_agent_tesoro_dashboard_href.sql` ou un script backfill dans `scripts/` (gitignoré) + documenter dans le plan
- [ ] Si fix code : ajouter un test jest unitaire sur le composant / helper modifié
- [ ] Grep global `router.push('/supervisor` pour vérifier qu'aucun autre endroit ne réintroduirait le bug (clean audit)

### Phase 3 — Auto-critique + commit (15 min)

- [ ] Relire le diff ligne par ligne
- [ ] Vérifier qu'aucun autre workflow agent n'a été touché (R-P8-2)
- [ ] Commit local : `fix(agent-ui): redirect post-validation to agent dashboard instead of /supervisor (X9)`
- [ ] **Demander confirmation utilisateur avant push**
- [ ] Après push : monitor CI via `gh run list --branch develop --limit 5`

## 5. Risques

### R-X9-1 : Le bug ne se reproduit pas → "H4 par défaut"
**Mitigation** : si après 3 tentatives manuelles le bug ne reproduit pas, consigner comme "non reproductible en staging 2026-04-14", ajouter un test E2E de couverture, fermer le ticket et passer à X2.

### R-X9-2 : Fix data BD sans migration trackée
**Mitigation** : BOOT §2 recommande "préférer backfill data > schema changes quand possible". Si fix = UPDATE JSONB, créer un script dans `scripts/` avec preview SQL + confirmation avant exécution. Loguer le diff dans le commit message.

### R-X9-3 : Fix code qui touche `GenericAgentSidebar` ou `useAgentDashboard.getBasePath()` = surface d'impact énorme (tous les agents)
**Mitigation** : grep exhaustif des usages + test manuel des 4 rôles (Tesoro, AYUNT, CAMARA, MIN_*).

## 6. Validation checklist (à cocher en cours d'exécution)

- [ ] Repro live capturée (URL + network + console)
- [ ] Root cause identifiée (hypothèse validée)
- [ ] Fix implémenté (data OU code)
- [ ] Test manuel 4 rôles
- [ ] Grep `router.push('/supervisor` = 0 match dans chemins agent
- [ ] Diff relu ligne par ligne
- [ ] Commit local créé
- [ ] Autorisation user obtenue
- [ ] Push + CI verte
- [ ] Plan mis à jour (cette checklist cochée)

## 7. Dépendances & prochain item

**Bloque** : X2 (P8.2) — sans Tesoro qui revient proprement à sa liste post-validation, tester X2 AYUNT/CAMARA est pénible.
**Bloqué par** : rien côté code. Bloqué uniquement par la **validation utilisateur** de cette approche investigation-first.

**Après P8.1** : P8.2 = X2 (route frontend AYUNT/CAMARA validation vers `/treasury/payments/{id}/validate` au lieu de `/agent/service-requests/{id}/decision`).

---

**Demande explicite à l'utilisateur** (avant toute exécution de Phase 0) :

1. **Valides-tu l'approche investigation-first** (repro live obligatoire avant fix) ou préfères-tu que je saute direct sur un fix hypothétique ?
2. **Peux-tu confirmer les étapes exactes de reproduction** observées en session précédente :
   - Rôle (agent_tesoro ? agent_ayuntamiento ? autre) ?
   - Email login ?
   - URL de la page de validation (`/dashboard/agent/treasury/validation/[paymentId]` ou liste `/dashboard/agent/treasury/validation`) ?
   - URL observée après click Continuer ?
   - Screenshot ou capture Network tab disponible ?
3. **Préfères-tu** que je lance moi-même `npm run dev` et tente la repro (si staging BD a encore des paiements pending) ou que tu capturés la repro et me la transmettes ?
