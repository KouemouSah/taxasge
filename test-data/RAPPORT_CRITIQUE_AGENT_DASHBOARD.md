# RAPPORT CRITIQUE : Agent Dashboard - Analyse des Dysfonctionnements

**Date:** 2026-01-18
**Statut:** CRITIQUE - Multiples points de défaillance identifiés
**Impact:** Dashboard agents TESORO et CNEDOGE non fonctionnels

---

## RESUME EXECUTIF

L'investigation révèle **5 problèmes majeurs interconnectés** empêchant le bon fonctionnement du dashboard agent:

| # | Problème | Sévérité | Impact |
|---|----------|----------|--------|
| 1 | Menus non affichés | CRITIQUE | Agents ne peuvent pas naviguer |
| 2 | Erreur chargement statistiques | HAUTE | Dashboard affiche erreur |
| 3 | Page validation Treasury crash | CRITIQUE | Fonctionnalité inutilisable |
| 4 | Demandes CNEDOGE invisibles | CRITIQUE | 0 demandes affichées malgré 3 soumises |
| 5 | Paiements Treasury non visibles | CRITIQUE | Validation impossible |

---

## PROBLEME 1 : MENUS NON AFFICHES

### Symptôme
Les agents voient uniquement les cards du dashboard mais aucun menu de navigation (validations, paiements, etc.)

### Causes Racines Identifiées

#### 1.1 Filtrage Silencieux par Permissions
**Fichier:** `packages/web/src/modules/agent-dashboard/hooks/useAgentDashboard.ts` (lignes 183-213)

```typescript
const filterMenuItems = (items: MenuItem[]): MenuItem[] => {
  return items
    .filter((item) => {
      if ('permission' in item && item.permission) {
        if (!hasPermission(item.permission)) return false;  // SUPPRIME LE GROUPE ENTIER
      }
      return true;
    })
    // ... filtre aussi les sous-items
    .filter(Boolean) as MenuItem[];  // SUPPRIME SILENCIEUSEMENT LES GROUPES VIDES
};
```

**Problème:** Si un agent n'a pas la permission `treasury.manage_settings`, TOUT le groupe "settings" disparaît sans avertissement.

#### 1.2 Entity Code Non Résolu
**Fichier:** `packages/web/src/modules/agent-dashboard/hooks/useAgentDashboard.ts` (lignes 162-169)

```typescript
const entityCode: EntityCode | null = agentProfile
  ? (agentProfile.entity_code as EntityCode) ||
    getEntityCodeFromName(agentProfile.entity_name || agentProfile.ministry_name || '')
  : null;

const entityConfig = entityCode ? getEntityConfig(entityCode) : null;
```

**Si `entity_code` est `null` ou ne matche pas les codes connus (`TESORO`, `CNEDOGE_PASAPORTE`):**
- `entityConfig` devient `null`
- Le sidebar affiche: "No configuration available for this agent."

#### 1.3 Erreur API Silencieuse
**Fichier:** `packages/web/src/modules/agent-dashboard/hooks/useAgentDashboard.ts` (lignes 89-91)

```typescript
} catch (error) {
  console.error('Failed to fetch agent profile:', error);  // LOG SEULEMENT
  return null;  // RETOURNE NULL SANS FEEDBACK UI
}
```

**Résultat:** L'utilisateur ne voit aucune erreur, juste un dashboard vide.

### Evidence à Vérifier
```javascript
// Console navigateur - vérifier le rôle stocké:
console.log(JSON.parse(localStorage.getItem('taxasge_auth'))?.user?.role);
// Attendu: 'agent'

// Network tab - vérifier l'appel API:
// GET /api/v1/agents/profiles/me
// Vérifier: response.entity_code === 'TESORO' ou 'CNEDOGE_PASAPORTE'
```

---

## PROBLEME 2 : ERREUR CHARGEMENT STATISTIQUES

### Symptôme
Message "Erreur lors du chargement des statistiques" affiché sur le dashboard.

### Causes Racines Identifiées

#### 2.1 JSONB Fields Non Processés
**Fichier:** `packages/backend/app/modules/agents/repositories/agent_profile_repository.py`

Les champs JSONB (`specializations`, `working_days`, `available_workflows`) doivent être convertis de PostgreSQL vers Python/JSON. Si `_process_jsonb_fields()` n'est pas appelé, Pydantic validation échoue.

#### 2.2 Agent Profile Manquant en BD
```sql
-- Vérifier l'existence du profil:
SELECT ap.*, u.email, e.code as entity_code
FROM agent_profiles ap
JOIN users u ON u.id = ap.user_id
LEFT JOIN entities e ON e.id = ap.entity_id
WHERE u.email = 'tesoreria.ge@outlook.fr';
```

**Si le résultat est vide:** L'agent profile n'a pas été créé.

#### 2.3 Rôle Utilisateur Incorrect
Le hook `useAgentProfile` vérifie `authState.role === 'agent'`. Si le rôle n'est pas exactement `'agent'`, la query est désactivée:

```typescript
enabled: authState.isLoaded && !!authState.userId && isAgent,  // DESACTIVE si role != 'agent'
```

---

## PROBLEME 3 : PAGE VALIDATION TREASURY CRASH

### Symptôme
La page `/dashboard/agent/treasury/validation` s'affiche puis devient blanche avec "Application error: a client-side exception has occurred".

### Causes Racines Identifiées

#### 3.1 ENDPOINT BACKEND MANQUANT (CRITIQUE)
**Fichier attendu:** Endpoints pour `/admin/service-requests/treasury/payments/pending`

**Statut actuel:** L'endpoint N'EXISTE PAS dans le backend. Les routes Treasury ne sont pas implémentées.

**Evidence:**
```typescript
// Frontend appelle (packages/web/src/modules/treasury/services/api.ts ligne 157):
GET /api/v1/admin/service-requests/treasury/payments/pending
// → Retourne 404 Not Found
```

#### 3.2 Accès Propriété Undefined
**Fichier:** `packages/web/src/modules/treasury/components/PaymentValidationDialog.tsx` (ligne 84)

```typescript
<span className="capitalize">{payment.paymentMethod.replace('_', ' ')}</span>
```

Si `payment.paymentMethod` est `undefined`, cela provoque:
```
TypeError: Cannot read property 'replace' of undefined
```

#### 3.3 Paramètres Hook Incorrects
**Fichier:** `packages/web/src/app/[locale]/(dashboard)/dashboard/agent/treasury/validation/page.tsx` (lignes 64-67)

```typescript
const { data } = usePendingPayments({
  status: statusFilter,     // ❌ MAUVAIS NOM
  method: methodFilter,     // ❌ MAUVAIS NOM
});
```

**Attendu par l'API:**
```typescript
{
  workflowStatus: statusFilter,  // ✓ NOM CORRECT
  paymentMethod: methodFilter,   // ✓ NOM CORRECT
}
```

---

## PROBLEME 4 : DEMANDES CNEDOGE NON VISIBLES

### Symptôme
"En cours" affiche 0 demandes alors que 3 demandes de passeport ont été soumises.

### Causes Racines Identifiées

#### 4.1 Demandes Non Ajoutées à la Queue
**Fichier:** `packages/backend/app/modules/agents/services/agent_queue_service.py`

Pour qu'une demande apparaisse dans "En cours":
1. Elle doit être dans `agent_work_queue` avec `status = 'pending'`
2. Elle doit avoir `ministry_id` correspondant à CNEDOGE (via entity mapping)

**Problème potentiel:** Lors de la soumission d'une service_request, l'insertion dans `agent_work_queue` n'est peut-être pas effectuée.

```python
# Vérification en BD:
SELECT * FROM agent_work_queue
WHERE item_type = 'service_request'
AND ministry_id = (SELECT ministry_id FROM entities WHERE code = 'CNEDOGE_PASAPORTE');
```

#### 4.2 Mapping Entity -> Ministry Manquant
**Fichier:** `packages/backend/app/modules/agents/services/agent_queue_service.py` (ligne 39-47)

```python
entity_ministry_map = {
    'CNEDOGE': 1,
    'CNEDOGE_PASAPORTE': 1,  # ← Doit être défini
    'DGT': 2,
    # ...
}
```

Si `CNEDOGE_PASAPORTE` n'est pas mappé, la queue filter échoue.

#### 4.3 Workflow Non Configuré pour Queue Auto
```sql
-- Vérifier la config du workflow:
SELECT code, requires_agent_validation, auto_assign_to_queue
FROM workflows
WHERE code LIKE 'PASAPORTE%';
```

Si `auto_assign_to_queue = false`, les demandes ne sont pas automatiquement ajoutées.

---

## PROBLEME 5 : PAIEMENTS TREASURY NON VISIBLES

### Symptôme
Après initiation du paiement cash sur 3 demandes passeport, aucune validation n'apparaît côté Treasury.

### Causes Racines Identifiées

#### 5.1 Transition Workflow Status Non Effectuée
Pour qu'un paiement apparaisse en validation Treasury:
- `service_payments.workflow_status` doit être `'pending_agent_review'`
- `service_payments.payment_method` doit être `'cash'` ou `'check'`

```sql
-- Vérifier les paiements:
SELECT sp.id, sp.payment_method, sp.workflow_status, sr.reference_number
FROM service_payments sp
JOIN service_requests sr ON sr.id = sp.service_request_id
WHERE sp.payment_method = 'cash';
```

**Résultat attendu:** `workflow_status = 'pending_agent_review'`
**Problème potentiel:** Status bloqué à `'submitted'` (transition auto non effectuée)

#### 5.2 Pas de Scoping Ministry sur Payments
**Fichier:** `packages/backend/app/modules/admin/api/admin_routes.py` (lignes 2699-2730)

```python
where_clauses = [
    "sp.workflow_status = $1",
    "sp.payment_method IN ('cash', 'check')"
]
# ❌ MANQUE: Filter par ministry/entity de l'agent Treasury
```

**Conséquence:** Tous les paiements cash de tous les ministères seraient visibles, MAIS si le filtre est vide, rien ne s'affiche.

---

## ARCHITECTURE DU WORKFLOW PASSEPORT + PAIEMENT CASH

### Flux Attendu (Non Implémenté Complètement)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ PHASE 1: Soumission Service Request                                          │
├─────────────────────────────────────────────────────────────────────────────┤
│ 1. Citoyen soumet demande passeport                                          │
│ 2. service_requests INSERT (status='SUBMITTED')                              │
│ 3. ❌ MANQUANT: agent_work_queue INSERT (ministry_id=CNEDOGE)               │
│ 4. ❌ MANQUANT: Notification agent CNEDOGE                                   │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ PHASE 2: Validation CNEDOGE (En parallèle avec paiement)                     │
├─────────────────────────────────────────────────────────────────────────────┤
│ 1. Agent CNEDOGE voit demande dans "En cours"                                │
│ 2. Agent s'assigne la demande (lock 30min)                                   │
│ 3. Agent valide dossier → status='DOSSIER_VALIDE'                           │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ PHASE 3: Paiement Cash Initié                                                │
├─────────────────────────────────────────────────────────────────────────────┤
│ 1. Citoyen sélectionne "Cash" et génère reçu                                 │
│ 2. service_payments INSERT (payment_method='cash')                           │
│ 3. workflow_status: 'submitted' → ❌ MANQUANT: 'pending_agent_review'       │
│ 4. ❌ MANQUANT: Notification agent TESORO                                    │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ PHASE 4: Validation Treasury                                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│ 1. ❌ MANQUANT: Endpoint GET /treasury/payments/pending                      │
│ 2. Agent Treasury voit paiement dans dashboard                               │
│ 3. Agent verrouille paiement (lock 15min)                                    │
│ 4. Agent valide → workflow_status='approved'                                 │
│ 5. Génération reçu signé HMAC                                                │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## PLAN DE RESOLUTION

### PRIORITE 1 : CRITIQUE (Bloquer le fonctionnement complet)

#### 1.1 Créer les Endpoints Treasury Manquants
**Fichiers à créer/modifier:**
- `packages/backend/app/modules/treasury/api/treasury_routes.py`
- `packages/backend/app/modules/treasury/services/treasury_service.py`

**Endpoints requis:**
```python
GET  /treasury/payments/pending         # Liste paiements en attente validation
POST /treasury/payments/{id}/lock       # Verrouiller un paiement
POST /treasury/payments/{id}/validate   # Valider un paiement
POST /treasury/payments/{id}/reject     # Rejeter un paiement
GET  /treasury/stats/dashboard          # Statistiques dashboard
```

#### 1.2 Implémenter Ajout Automatique à agent_work_queue
**Fichier:** `packages/backend/app/modules/service_requests/services/service_request_service.py`

```python
# Après création service_request, ajouter:
async def add_to_agent_queue(db, service_request_id: UUID, workflow_code: str):
    ministry_id = await get_ministry_id_for_workflow(db, workflow_code)
    await agent_queue_service.create_queue_item(
        db,
        item_id=str(service_request_id),
        item_type='service_request',
        ministry_id=ministry_id,
        priority_score=calculate_priority(workflow_code)
    )
```

#### 1.3 Implémenter Transition Auto vers pending_agent_review
**Fichier:** `packages/backend/app/modules/payments/services/payment_service.py`

```python
async def initiate_cash_payment(db, service_request_id: UUID, amount: Decimal):
    payment = await create_service_payment(
        db,
        service_request_id=service_request_id,
        payment_method='cash',
        workflow_status='pending_agent_review',  # Direct transition
    )
    return payment
```

### PRIORITE 2 : HAUTE (Expérience utilisateur dégradée)

#### 2.1 Ajouter Logging Détaillé dans useAgentDashboard
**Fichier:** `packages/web/src/modules/agent-dashboard/hooks/useAgentDashboard.ts`

```typescript
// Après ligne 169:
console.log('[AgentDashboard] Debug:', {
  userId: authState.userId,
  role: authState.role,
  entityCode,
  entityConfig: entityConfig ? 'FOUND' : 'NULL',
  menuItemsCount: menuItems?.length || 0,
  permissions: user?.permissions?.slice(0, 5) // First 5 for brevity
});
```

#### 2.2 Corriger Accès Propriétés Undefined
**Fichier:** `packages/web/src/modules/treasury/components/PaymentValidationDialog.tsx`

```typescript
// Ligne 84 - AVANT:
<span className="capitalize">{payment.paymentMethod.replace('_', ' ')}</span>

// APRES:
<span className="capitalize">{payment.paymentMethod?.replace('_', ' ') || 'N/A'}</span>
```

#### 2.3 Corriger Noms Paramètres Hook
**Fichier:** `packages/web/src/app/[locale]/(dashboard)/dashboard/agent/treasury/validation/page.tsx`

```typescript
// Ligne 64-67 - AVANT:
const { data } = usePendingPayments({
  status: statusFilter,
  method: methodFilter,
});

// APRES:
const { data } = usePendingPayments({
  workflowStatus: statusFilter !== 'all' ? statusFilter : undefined,
  paymentMethod: methodFilter !== 'all' ? methodFilter : undefined,
});
```

### PRIORITE 3 : MOYENNE (Améliorations)

#### 3.1 Ajouter Feedback Erreur UI
```typescript
// useAgentDashboard.ts - remplacer catch silencieux:
} catch (error) {
  console.error('Failed to fetch agent profile:', error);
  toast({
    variant: 'destructive',
    title: 'Erreur',
    description: 'Impossible de charger le profil agent. Veuillez rafraîchir.'
  });
  throw error; // Propager pour React Query error state
}
```

#### 3.2 Valider Entity Code Backend
**Fichier:** `packages/backend/app/modules/agents/repositories/agent_profile_repository.py`

Vérifier que `entity_code` est toujours retourné et correspond aux valeurs attendues:
- `TESORO`
- `CNEDOGE_PASAPORTE`
- `CNEDOGE_RESIDENCIA`
- etc.

---

## CHECKLIST DE VERIFICATION

### Base de Données
```sql
-- 1. Vérifier les agent_profiles des agents test:
SELECT ap.id, u.email, u.role, e.code as entity_code, ap.is_active
FROM agent_profiles ap
JOIN users u ON u.id = ap.user_id
LEFT JOIN entities e ON e.id = ap.entity_id
WHERE u.email IN ('tesoreria.ge@outlook.fr', 'cnedoge26@gmail.com');

-- 2. Vérifier les service_requests soumises:
SELECT id, reference_number, workflow_code, status, payment_status, created_at
FROM service_requests
WHERE workflow_code LIKE 'PASAPORTE%'
ORDER BY created_at DESC LIMIT 10;

-- 3. Vérifier la queue agent:
SELECT * FROM agent_work_queue WHERE item_type = 'service_request' ORDER BY created_at DESC;

-- 4. Vérifier les paiements:
SELECT sp.id, sp.payment_method, sp.workflow_status, sp.total_amount, sr.reference_number
FROM service_payments sp
LEFT JOIN service_requests sr ON sr.id = sp.service_request_id
ORDER BY sp.created_at DESC LIMIT 10;

-- 5. Vérifier mapping entities:
SELECT e.code, e.ministry_id, m.name as ministry_name
FROM entities e
JOIN ministries m ON m.id = e.ministry_id
WHERE e.code IN ('TESORO', 'CNEDOGE_PASAPORTE');
```

### Frontend (Console Navigateur)
```javascript
// 1. Vérifier auth state:
console.log(JSON.parse(localStorage.getItem('taxasge_auth')));

// 2. Vérifier cookies:
document.cookie;

// 3. Observer les appels réseau:
// Network tab → Filter: profiles/me, treasury, service-requests
```

---

## TROUVAILLE CRITIQUE : CAUSE RACINE CONFIRMEE

### Le code `submit_request` N'AJOUTE PAS à la queue !

**Fichier:** `packages/backend/app/modules/service_requests/services/service_request_service.py`
**Lignes:** 1035-1121

```python
async def submit_request(self, db, request_id, user_id):
    # ... validation des documents ...

    # Calculate tariff
    tariff = await tariff_service.calculate(...)
    await service_request_repository.update_amounts(...)

    # Update status to SUBMITTED
    await service_request_repository.update_status(
        db=db,
        request_id=request_id,
        new_status=ServiceRequestStatus.SUBMITTED.value,
        performed_by=user_id,
        comment="User submitted request"
    )

    # ❌ MANQUANT: Ajout à agent_work_queue
    # ❌ MANQUANT: await agent_queue_service.add_to_queue(db, request_id, workflow_code)

    return await self._build_response(db, updated, required_docs)
```

**C'EST LA CAUSE RACINE** de pourquoi les agents CNEDOGE ne voient aucune demande dans "En cours".

---

## SOLUTION OPTIMALE

### Correction Principale (1 fichier, ~10 lignes)

**Fichier à modifier:** `packages/backend/app/modules/service_requests/services/service_request_service.py`

**Ajouter après ligne 1115 (après `update_status`):**

```python
        # Add to agent work queue for processing
        try:
            from .agent_queue_service import agent_queue_service
            await agent_queue_service.add_to_queue(
                db=db,
                service_request_id=request_id,
                workflow_code=request["workflow_code"],
                entity_code=request.get("entity_code")
            )
            logger.info(f"Added request {request['reference']} to agent work queue")
        except Exception as e:
            logger.error(f"Failed to add request to queue: {e}")
            # Don't fail the submission, just log the error
```

### Correction Treasury (Frontend seulement)

Les endpoints Treasury EXISTENT déjà dans `admin_routes.py`:
- `GET /admin/service-requests/treasury/payments/pending` ✓
- Les URLs frontend sont correctes ✓

**Problème réel:** Permission `treasury.validate_payment` peut ne pas être assignée à l'agent.

**Vérification SQL:**
```sql
-- Vérifier si l'agent Treasury a la permission
SELECT u.email, p.code as permission
FROM users u
JOIN user_permissions up ON up.user_id = u.id
JOIN permissions p ON p.id = up.permission_id
WHERE u.email = 'tesoreria.ge@outlook.fr'
AND p.code = 'treasury.validate_payment';
```

---

## ESTIMATION COMPLEXITE RESOLUTION

| Tâche | Effort | Fichiers | Risque |
|-------|--------|----------|--------|
| **Ajouter add_to_queue dans submit_request** | **30 min** | **1** | **Très faible** |
| Vérifier/ajouter permissions Treasury | 15 min | BD | Très faible |
| Corriger frontend null checks | 30 min | 2-3 | Faible |
| Ajouter logging/debugging | 30 min | 2-3 | Très faible |
| Tests E2E workflow complet | 1-2 heures | N/A | Moyen |

**Total estimé:** 3-4 heures de travail (pas 5-8 jours!)

---

## ACTIONS IMMEDIATES

### 1. Corriger Backend (CRITIQUE - 30 min)
Ajouter l'appel à `agent_queue_service.add_to_queue()` dans `submit_request()`.

### 2. Vérifier Permissions Treasury (15 min)
```sql
-- Ajouter permission si manquante:
INSERT INTO user_permissions (user_id, permission_id)
SELECT u.id, p.id
FROM users u, permissions p
WHERE u.email = 'tesoreria.ge@outlook.fr'
AND p.code = 'treasury.validate_payment'
ON CONFLICT DO NOTHING;
```

### 3. Tester le Workflow Complet (1 heure)
1. Soumettre nouvelle demande passeport
2. Vérifier apparition dans dashboard CNEDOGE
3. Initier paiement cash
4. Vérifier apparition dans dashboard Treasury

---

## CONCLUSION

Le système présente **UNE lacune critique principale**: l'absence d'appel à `add_to_queue()` lors de la soumission de demande.

**Impact:** Toutes les demandes soumises depuis le début du projet n'ont JAMAIS été ajoutées à la queue des agents.

**Solution:** Une modification de ~10 lignes dans un seul fichier.

Les endpoints Treasury sont fonctionnels, le problème est soit:
1. Les paiements n'ont pas le bon `workflow_status`
2. L'agent Treasury n'a pas la permission requise
3. Erreur de parsing frontend (null checks manquants)
