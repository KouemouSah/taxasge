# Plan: Agent Dashboard Overhaul

**Date**: 2026-03-06
**Statut**: COMPLETE
**Priorite**: CRITIQUE (P0 bloque production)

---

## Analyse Critique

### Etat des lieux

| # | Probleme | Severite | Impact | Utilisateurs |
|---|----------|----------|--------|--------------|
| P0 | `sp.request_id` n'existe pas -> 500 preview + queue handler | CRITIQUE | Preview casse pour TOUS les agents, startup repair silencieusement mort | 100% agents |
| P1 | Page detail agent -> 500 "Internal server error" | CRITIQUE | Impossible d'ouvrir un dossier depuis "En curso" | 100% agents |
| P2 | Page Escalaciones ne correspond pas au metier | MAJEUR | Page inutile, read-only, affiche ses propres escalations envoyees au lieu des dossiers recus/escalades | 100% agents |
| P3 | Panel de Control pas scope par site | MAJEUR | Agent Bata voit stats Malabo+Bata, pas uniquement son site | Agents multi-sites |
| P4 | Citas pas scope par site agent | MAJEUR | Agent voit creneaux de tous les sites au lieu de son site par defaut | Agents multi-sites |
| P5 | Panel de Control design generique | MINEUR | Dashboard pas oriente metier, quick actions pas optimales | UX |

### Donnees BD verifiees

- `service_payments.service_request_id` (PAS `request_id`) - UUID, FK vers service_requests
- `agent_work_queue` : PAS de `entity_location_id` -> stats non scopables par site via cette table seule
- `service_requests` : a `entity_location_id` (UUID) + `escalated`, `escalated_by`, `escalated_at`, `escalation_reason`
- `entity_locations` : `id`, `entity_code`, `city`, `location_name`, `is_main_office`
- `service_request_history` : `action` VARCHAR (escalated, escalation_resolved, status_change...)
- 0 escalations actives en BD (aucun test reel)
- 11 demandes actives (toutes CNEDOGE_PASAPORTE)
- `agent_work_queue` n'a PAS `entity_location_id` mais a `entity_code`

### Fichiers concernes

**Backend** :
- `agent_routes.py:2371` - `sp.request_id` FAUX -> `sp.service_request_id`
- `agent_queue_handler.py:295` - `sp.request_id` FAUX -> `sp.service_request_id`
- `agent_routes.py:664` - `GET /{request_id}` endpoint detail agent
- `agent_routes.py:1408` - `GET /my-escalations` - endpoint escalations
- `agent_routes.py:1113` - `POST /{request_id}/escalate`
- `agent_routes.py:245` - `GET /queue/stats` - stats sans site scope
- `agent_queue_service.py:498` - `get_queue_stats()` requete sur `agent_work_queue`

**Frontend** :
- `escalations/page.tsx` - Page escalaciones agent (342 lignes)
- `GenericEntityDashboard.tsx` - Dashboard principal agent
- `useEntityStats.ts` - Hook stats (appelle `/queue/stats`)
- `AppointmentsPage.tsx` - Page citas avec location selector
- `PendingPage.tsx` - Split view avec preview erreur
- `agent/[entityCode]/request/[requestId]/page.tsx` - Page detail erreur 500

---

## PHASE 1 : Fix P0 + P1 - Crashes Production (URGENT)

### Etape 1.1 : Fix `sp.request_id` -> `sp.service_request_id`

**Fichiers** :
- [ ] `agent_routes.py:2371` : `sp.request_id` -> `sp.service_request_id`
- [ ] `agent_queue_handler.py:295` : `sp.request_id` -> `sp.service_request_id`

**Validation** :
- [ ] Grep confirme 0 occurrence de `sp.request_id` dans tout le backend
- [ ] Toutes les occurrences `sp.service_request_id` dans le codebase sont correctes
- [ ] Verifier qu'aucun autre fichier n'utilise `request_id` comme alias de colonne sur service_payments

### Etape 1.2 : Fix page detail agent 500

**Analyse** : Le screenshot `pas.png` montre `agentDashboard.detail.loadError` + "Internal server error" sur `/dashboard/agent/cnedoge-pasaporte/request/{id}`.

L'endpoint `GET /agent/service-requests/{request_id}` (ligne 664) appelle `service_request_service.get_request()` qui fait `SELECT * FROM service_requests WHERE id = $1`. Cette requete ne touche PAS `service_payments`, donc le crash n'est PAS du au `sp.request_id`.

**Hypothese** : Le frontend `getRequestDetail()` pointe vers le bon endpoint. L'erreur pourrait venir de :
1. `_build_response()` qui accede a un champ manquant
2. Le Pydantic `ServiceRequestResponse` qui echoue a serialiser un champ
3. Un middleware ou dependency qui crash

**Action** :
- [ ] Tester `GET /agent/service-requests/{request_id}` avec curl/fetch directement
- [ ] Verifier les logs Cloud Run pour le VRAI traceback de l'endpoint `/{request_id}` (pas le preview)
- [ ] Si le bug est confirme, corriger la cause racine
- [ ] Si l'erreur est uniquement le preview (qui se charge en parallele), confirmer apres fix 1.1

**Validation** :
- [ ] Page detail agent charge sans erreur
- [ ] Preview dans split-view PendingPage charge sans erreur
- [ ] Tester avec au moins 2 demandes differentes

### Etape 1.3 : Fix aussi le `sp.amount` -> verifier colonne

**Analyse** : Ligne 2361 fait `sp.amount AS total_amount` mais la colonne dans `service_payments` est `total_amount` pas `amount`.

**Action** :
- [ ] Verifier: `SELECT column_name FROM information_schema.columns WHERE table_name = 'service_payments' AND column_name IN ('amount', 'total_amount')`
- [ ] Si `amount` n'existe pas, corriger en `sp.total_amount`

**Validation** :
- [ ] La requete preview compile sans erreur asyncpg

---

## PHASE 2 : Escalaciones - Refonte metier (P2)

### Analyse critique du design actuel

La page actuelle (`escalations/page.tsx`, 342 lignes) est un **tableau read-only** des escalations que l'agent a LUI-MEME envoyees. Problemes :

1. **Perspective inversee** : L'agent ne voit que ce qu'il a escale, pas ce qu'on lui a escale
2. **Aucune action possible** : Pas de lien vers le dossier, pas d'accepter/rejeter
3. **Textes hardcodes en anglais** : "Resolution", "Awaiting review", "Under Review", "Reassigned"
4. **Pas de filtrage par entite/site** : Page globale `/dashboard/agent/escalations` pas par entite
5. **Bouton "Nueva Escalacion"** inutile : L'escalation se fait depuis la page de decision du dossier
6. **Donnees pauvres** : `priority_score` toujours 0.0, pas de nom du beneficiaire, pas de montant

### Design propose : Page contextuelle par entite

La page escalaciones doit etre **integree dans le menu de l'entite** (pas globale) et montrer :

**Vue principale** : Split view comme la page Pendientes
- **Gauche** : Liste des dossiers que l'agent a escalades (mes escalations envoyees)
  - Reference + workflow + beneficiaire
  - Statut escalation (en attente / en revision / resolu)
  - Temps ecoule depuis escalation
  - Badge priorite
- **Droite** : Apercu du dossier selectionne (reutiliser `RequestPreview` existant)

**Header** :
- Compteurs : En attente | En revision | Resolues
- Filtres : statut, recherche par reference

**Actions par dossier** :
- Voir le dossier complet (lien vers page detail)
- Relancer l'escalation (si > 48h sans reponse)

### Etape 2.1 : Backend - Enrichir endpoint my-escalations

**Fichier** : `agent_routes.py:1408`

**Modifications** :
- [ ] Ajouter `entity_code` comme parametre optionnel (filtrage par entite)
- [ ] Enrichir la reponse avec : `beneficiary_name`, `workflow_name`, `submitted_at`
- [ ] Calculer `hours_since_escalation` cote backend
- [ ] Ajouter `entity_location_id` filtering si agent non-main-office
- [ ] Ajouter `can_re_escalate` (true si > 48h et toujours pending)

**Modele enrichi** :
```python
class EscalationItemResponse(BaseModel):
    id: str
    reference: str
    workflow_code: str
    workflow_name: str  # NEW
    beneficiary_name: str  # NEW
    status: str
    escalation_status: str  # pending | in_review | resolved | reassigned
    escalation_reason: str
    escalated_at: str
    hours_since_escalation: float  # NEW
    can_re_escalate: bool  # NEW (> 48h + still pending)
    notes: Optional[str]
    priority: str  # NEW (from sr.priority)
```

**Validation** :
- [ ] Endpoint repond avec les nouveaux champs
- [ ] Filtrage par entity_code fonctionne
- [ ] Agent non-main-office ne voit que les escalations de son site

### Etape 2.2 : Frontend - Refonte page escalaciones

**Fichier** : `escalations/page.tsx` -> deplacer vers composant module agent-dashboard

**IMPORTANT** : La page actuelle est dans `/dashboard/agent/escalations/` (globale). Mais le screenshot `esc.png` montre qu'elle est DEJA accessible par entite : `/dashboard/agent/dgt/licencias/escalations`. C'est un menu genere par `workflow_menu_mapping`. On garde cette approche.

**Modifications** :
- [ ] Creer `EscalationsPage.tsx` dans `modules/agent-dashboard/components/escalations/`
- [ ] Layout split-view (gauche liste, droite apercu - comme PendingPage)
- [ ] Header avec compteurs (pending/in_review/resolved)
- [ ] Filtres : statut + recherche
- [ ] Liste avec : reference, workflow_name, beneficiary_name, statut, temps ecoule, priorite
- [ ] Click sur item -> charge preview a droite (reutiliser RequestPreview)
- [ ] Bouton "Ver dossier" -> naviguer vers page detail
- [ ] Bouton "Relancer" si `can_re_escalate = true`
- [ ] Traduire TOUS les textes (es/fr/en) - plus de hardcode anglais
- [ ] Supprimer bouton "Nueva Escalacion" du header (escalation = action sur dossier, pas creation isolee)

**Validation** :
- [ ] Page charge sans erreur
- [ ] Click sur dossier affiche preview
- [ ] Filtres fonctionnent
- [ ] Aucun texte hardcode en anglais
- [ ] Responsive mobile (liste seule, pas de split view)

---

## PHASE 3 : Panel de Control - Site scoping + redesign (P3 + P5)

### Analyse critique du design actuel

Le Panel de Control (`GenericEntityDashboard.tsx`) affiche :
1. **5 Stats Cards** : Pending, In Progress, Completed Today, SLA Violations, Escalated
2. **Quick Actions** : Extraites du menu dynamique (max 6)
3. **Dynamic Widgets** : alerts, urgent_requests, calendar_slots, today_appointments, workflow_distribution

**Problemes** :
- Stats viennent de `agent_work_queue` qui n'a PAS `entity_location_id` -> pas scopable par site
- Les widgets sont generiques et ne montrent pas ce qui compte pour l'agent
- Pas de vue "ma journee" (RDV du jour + dossiers urgents + SLA critique)

### Etape 3.1 : Backend - Stats scopees par site

**Fichier** : `agent_routes.py:245` (`GET /queue/stats`)

Le probleme est que `agent_work_queue` n'a pas `entity_location_id`. Deux options :
- **Option A** : JOIN avec `service_requests` pour recuperer `entity_location_id`
- **Option B** : Requeter directement `service_requests` au lieu de `agent_work_queue`

**Decision** : Option A (JOIN) car `agent_work_queue` a des champs SLA/priority calcules qu'on ne veut pas recalculer.

**Modifications** :
- [ ] Ajouter parametre `entity_location_id: Optional[UUID]` a `get_queue_stats()`
- [ ] Si fourni, JOIN `agent_work_queue awq JOIN service_requests sr ON sr.id = awq.item_id AND sr.entity_location_id = $N`
- [ ] Endpoint: resolver le location_id de l'agent (comme `_resolve_treasury_location_scope`)
- [ ] Agent main_office : pas de filtre (voit tout) ou filtre optionnel via dropdown
- [ ] Agent non-main_office : auto-scope a son site

**Validation** :
- [ ] Agent non-main-office ne voit que les stats de son site
- [ ] Agent main-office voit toutes les stats (ou peut filtrer)
- [ ] Les 5 stats (pending, assigned, completed_today, escalated, sla_violations) sont correctes
- [ ] Performance : requete < 200ms (index sur service_requests.entity_location_id existe)

### Etape 3.2 : Frontend - Site filter dropdown dans dashboard

**Fichier** : `GenericEntityDashboard.tsx`

**Modifications** :
- [ ] Ajouter dropdown de selection de site en haut du dashboard
- [ ] Pour agent main_office : dropdown avec toutes les locations + "Todos los sitios"
- [ ] Pour agent non-main_office : badge fixe avec nom du site (pas de dropdown)
- [ ] Passer `entity_location_id` au hook `useEntityStats`
- [ ] Passer `entity_location_id` aux widgets dynamiques

**Validation** :
- [ ] Dropdown visible pour agent main-office
- [ ] Stats changent quand on selectionne un site different
- [ ] Agent non-main-office voit uniquement son site sans dropdown

### Etape 3.3 : Frontend - Redesign oriente metier

**Objectif** : Un agent qui ouvre son Panel de Control doit voir EN UN COUP D'OEIL :
1. Ce qu'il doit faire maintenant (urgences)
2. Sa journee (RDV du jour)
3. Son avancement (stats)

**Layout propose** (sans scroll sur desktop 1920x1080) :

```
+------------------------------------------+----------------+
| [Site: Malabo - MOSTOLES v]              |   Hoy: Jue 6  |
+------------------------------------------+----------------+
| Stats Cards (5)                                           |
| [Pendientes] [En curso] [Hoy] [SLA] [Escalados]          |
+-----------------------------------------------------------+
| Accion Requerida (SLA critique/escalations)  |  Proximas  |
| - SRV-2026-00011: SLA 2h restantes         |  Citas Hoy  |
| - SRV-2026-00009: Docs manquants           |  08:00 Juan  |
|                                             |  09:00 Maria |
+-----------------------------------------------------------+
| Quick Actions                                             |
| [Ver Pendientes] [Validar] [Citas] [Historial]           |
+-----------------------------------------------------------+
```

**Modifications** :
- [ ] Reorganiser layout : stats en haut, actions requises au centre, quick actions en bas
- [ ] Widget "Action Requerida" : dossiers SLA < 6h + escalations non resolues
- [ ] Widget "Citas Hoy" : prochains RDV de la journee (max 5)
- [ ] Quick Actions : extraites du menu dynamique (deja existant, garder)
- [ ] Supprimer widgets peu utiles par defaut (workflow_distribution trop generique)

**Validation** :
- [ ] Dashboard visible SANS scroll sur ecran 1920x1080
- [ ] Les widgets prioritaires sont visibles immediatement
- [ ] Click sur un item SLA/escalation navigue vers le dossier
- [ ] Click sur un RDV navigue vers la page citas

---

## PHASE 4 : Citas - Scope par site agent (P4)

### Analyse

`AppointmentsPage.tsx` a deja un dropdown de selection de location. Le probleme est :
1. Le dropdown charge TOUTES les locations de l'entite
2. Par defaut, aucune n'est pre-selectionnee (ou la premiere)
3. L'agent devrait voir SON site par defaut

### Etape 4.1 : Frontend - Pre-selection site agent

**Fichier** : `AppointmentsPage.tsx`

**Modifications** :
- [ ] Recuperer `entity_location_id` de l'agent via `useAgentDashboard()` hook
- [ ] Pre-selectionner le site de l'agent comme valeur par defaut du dropdown
- [ ] Pour agent non-main_office : masquer le dropdown (site fixe)
- [ ] Pour agent main_office : dropdown avec tous les sites, pre-selectionne sur son site

### Etape 4.2 : Backend - Filtrer appointments par site

**Fichier** : `agent_routes.py` (endpoints appointments)

**Modifications** :
- [ ] Verifier que `GET /appointments/available` accepte `entity_location_id`
- [ ] Si l'agent est non-main_office, forcer le filtre sur son `entity_location_id`
- [ ] Pour TodayTab, filtrer les RDV du jour par le site de l'agent

**Validation** :
- [ ] Agent non-main-office ne voit que les creneaux de son site
- [ ] Agent main-office peut changer de site
- [ ] Pre-selection correcte au chargement
- [ ] ScheduleTab respecte le filtre site
- [ ] CalendarTab respecte le filtre site

---

## PHASE 5 : Qualite & Tests

### Etape 5.1 : Traductions

- [ ] Verifier toutes les cles de traduction ajoutees dans `es.json`, `fr.json`, `en.json`
- [ ] Aucun texte hardcode dans les composants modifies
- [ ] Aucune cle `tSupervisor(...)` utilisee dans un contexte agent

### Etape 5.2 : Lint & Build

- [ ] `npm run lint` passe sans nouvelles erreurs
- [ ] `npm run type-check` passe
- [ ] Pas de warnings ESLint react-hooks/exhaustive-deps
- [ ] Backend: pas d'erreur mypy/flake8

### Etape 5.3 : Tests manuels

- [ ] Agent CNEDOGE_PASAPORTE : Panel de Control charge -> stats visibles
- [ ] Agent CNEDOGE_PASAPORTE : Pendientes -> preview charge a droite
- [ ] Agent CNEDOGE_PASAPORTE : Click dossier -> page detail charge
- [ ] Agent CNEDOGE_PASAPORTE : Citas -> pre-selection site correcte
- [ ] Agent CNEDOGE_PASAPORTE : Escalaciones -> page charge (meme si 0 escalations)
- [ ] Agent DGT : memes tests
- [ ] Agent TESORO : stats treasury non impactees

### Etape 5.4 : Push & CI

- [ ] Commit avec message descriptif
- [ ] Push vers origin/develop
- [ ] GitHub Actions CI passe (backend + frontend)
- [ ] Verifier logs Cloud Run apres deploy

---

## Resume des fichiers a modifier

### Backend (4 fichiers)
| Fichier | Phase | Modification |
|---------|-------|-------------|
| `agent_routes.py` | 1+2+3 | Fix sp.request_id, enrichir escalations, stats site-scope |
| `agent_queue_handler.py` | 1 | Fix sp.request_id |
| `agent_queue_service.py` | 3 | Ajouter entity_location_id a get_queue_stats |
| Traductions backend si necessaire | 2 | - |

### Frontend (8+ fichiers)
| Fichier | Phase | Modification |
|---------|-------|-------------|
| `EscalationsPage.tsx` (NEW) | 2 | Nouvelle page escalaciones split-view |
| `escalations/page.tsx` | 2 | Rediriger vers composant module ou refonte |
| `GenericEntityDashboard.tsx` | 3 | Site dropdown + layout redesign |
| `useEntityStats.ts` | 3 | Passer entity_location_id |
| `AppointmentsPage.tsx` | 4 | Pre-selection site agent |
| `agent-requests-api.ts` | 2 | Types enrichis escalation |
| `es.json / fr.json / en.json` | 2+3 | Nouvelles cles traduction |

### Ordre d'execution

```
Phase 1 (URGENT) ──> Push + Deploy ──> Verifier production
    |
Phase 2 (Escalaciones)
    |
Phase 3 (Panel de Control)
    |
Phase 4 (Citas)
    |
Phase 5 (Qualite) ──> Push final
```

Phase 1 doit etre deployee INDEPENDAMMENT car elle bloque la production.
Phases 2-4 peuvent etre commitees ensemble apres validation.
