# 🏛️ PHASE 3 : ADMIN & AGENTS

**Durée estimée** : 4 semaines  
**Objectif** : Implémenter modules ADMIN (35 endpoints) et AGENTS (20 endpoints)

---

## VUE D'ENSEMBLE

**Modules Phase 3** :
- Module ADMIN (35 endpoints) - 2 semaines
- Module AGENTS (20 endpoints) - 2 semaines

**Total** : 55 endpoints, 4 semaines

---

## SEMAINES 1-2 : MODULE ADMIN (35 endpoints)

### TASK-P3-001 : Dashboard Admin Principal

**Agent** : Dev  
**Priorité** : CRITIQUE  
**Effort** : 3 jours  
**Use Cases** : UC-ADMIN-001 à UC-ADMIN-005

#### Contexte
Dashboard admin avec métriques temps réel et analytics.

#### Endpoints
1. GET /admin/dashboard - Vue d'ensemble
2. GET /admin/analytics/revenue - Revenus (jour/semaine/mois/année)
3. GET /admin/analytics/declarations - Stats déclarations
4. GET /admin/analytics/users - Stats utilisateurs
5. GET /admin/analytics/agents - Performance agents

#### Métriques Dashboard
**Revenus** :
- Total revenus (aujourd'hui, semaine, mois, année)
- Tendance (+/- % vs période précédente)
- Top 5 services fiscaux (par revenu)
- Graphique revenus quotidiens (30 derniers jours)

**Déclarations** :
- Total déclarations par statut (pending, validated, rejected)
- Temps moyen traitement
- Taux validation (validated / total)
- Queue agent (déclarations en attente)

**Utilisateurs** :
- Total users (citizens, businesses)
- Nouveaux users (aujourd'hui, semaine, mois)
- Users actifs (derniers 30 jours)
- Taux rétention

**Agents** :
- Total agents actifs
- Déclarations traitées/agent
- Temps moyen traitement/agent
- Top 5 agents (par volume)

#### Fichiers Concernés
**Créer** :
- `app/api/v1/admin.py` (endpoints dashboard)
- `app/services/admin_service.py` (agrégation métriques)
- `tests/use_cases/test_uc_admin.py`

#### Critères Validation
- ✅ Dashboard retourne toutes métriques
- ✅ Calculs temps réel (pas de cache obsolète)
- ✅ Graphiques prêts (format JSON pour frontend)
- ✅ Tests passants
- ✅ RBAC vérifié (seul admin peut accéder)

---

### TASK-P3-002 : Gestion Utilisateurs Admin

**Agent** : Dev  
**Priorité** : HAUTE  
**Effort** : 2 jours  
**Use Cases** : UC-ADMIN-006 à UC-ADMIN-012

#### Endpoints
1. GET /admin/users - Liste tous utilisateurs (filtres, pagination)
2. GET /admin/users/{id} - Détails utilisateur
3. PATCH /admin/users/{id} - Modifier utilisateur
4. DELETE /admin/users/{id} - Supprimer utilisateur (soft delete)
5. POST /admin/users/{id}/ban - Bannir utilisateur
6. POST /admin/users/{id}/unban - Débannir utilisateur
7. GET /admin/users/{id}/activity - Historique activité

#### Fonctionnalités
**Filtres** :
- Type (citizen, business, agent, admin)
- Statut (active, banned, deleted)
- Date inscription (range)
- Recherche (email, nom, ID)

**Actions Admin** :
- Modifier infos user
- Changer rôle (user → agent, agent → admin)
- Bannir/Débannir
- Supprimer compte (soft delete)
- Voir historique complet activité

#### Fichiers Concernés
**Modifier** :
- `app/api/v1/admin.py` (ajouter endpoints users)
- `app/services/user_service.py` (ajouter fonctions admin)
- `app/database/repositories/user_repository.py`

**Tables DB** :
- `users` (ajouter colonne `banned_at`)
- `user_activity_logs` (nouveau - pour audit)

#### Critères Validation
- ✅ CRUD complet fonctionnel
- ✅ Filtres et recherche opérationnels
- ✅ Soft delete (pas de suppression réelle)
- ✅ Logs audit pour toutes actions admin
- ✅ Tests RBAC (seul admin peut accéder)

---

### TASK-P3-003 : Gestion Agents Admin

**Agent** : Dev  
**Priorité** : HAUTE  
**Effort** : 2 jours  
**Use Cases** : UC-ADMIN-013 à UC-ADMIN-018

#### Endpoints
1. GET /admin/agents - Liste tous agents
2. POST /admin/agents - Créer agent
3. GET /admin/agents/{id} - Détails agent
4. PATCH /admin/agents/{id} - Modifier agent
5. DELETE /admin/agents/{id} - Désactiver agent
6. GET /admin/agents/{id}/performance - Métriques performance

#### Métriques Performance Agent
- Total déclarations traitées
- Temps moyen traitement
- Taux validation/rejection
- Déclarations en cours
- Score qualité (basé sur feedback users)
- Disponibilité (% temps actif)

#### Assignation Automatique
**Algorithme Load Balancing** :
```python
def assign_agent(declaration):
    """
    Assigner agent avec le moins de déclarations en cours
    et meilleur score qualité.
    
    Scoring : 50% charge actuelle + 50% score qualité
    """
    available_agents = get_available_agents()
    
    scores = []
    for agent in available_agents:
        current_load = agent.current_declarations_count
        quality_score = agent.quality_score  # 0-100
        
        # Normaliser (moins de charge = mieux)
        load_score = 100 - (current_load * 10)  # -10 points par déclaration
        
        # Score final
        final_score = (load_score * 0.5) + (quality_score * 0.5)
        scores.append((agent, final_score))
    
    # Retourner agent avec meilleur score
    best_agent = max(scores, key=lambda x: x[1])[0]
    return best_agent
```

#### Fichiers Concernés
**Créer** :
- `app/services/agent_assignment_service.py` (load balancing)
- `app/models/agent_performance.py` (Pydantic models)

**Tables DB** :
- `agent_performance_metrics` (métriques quotidiennes)

#### Critères Validation
- ✅ Gestion agents complète
- ✅ Métriques performance précises
- ✅ Assignation automatique opérationnelle
- ✅ Tests assignation avec différents scénarios
- ✅ Load balancing équilibré

---

### TASK-P3-004 : Configuration Système Admin

**Agent** : Dev  
**Priorité** : MOYENNE  
**Effort** : 2 jours  
**Use Cases** : UC-ADMIN-019 à UC-ADMIN-025

#### Endpoints
1. GET /admin/settings - Récupérer settings système
2. PATCH /admin/settings - Modifier settings
3. GET /admin/fiscal-services - Liste services fiscaux
4. POST /admin/fiscal-services - Créer service
5. PATCH /admin/fiscal-services/{id} - Modifier service
6. DELETE /admin/fiscal-services/{id} - Désactiver service
7. GET /admin/system/health - Health check système

#### Settings Système
```json
{
  "maintenance_mode": false,
  "registration_enabled": true,
  "max_upload_size_mb": 10,
  "allowed_file_types": ["pdf", "jpg", "png"],
  "session_timeout_minutes": 30,
  "agent_auto_assignment": true,
  "email_notifications_enabled": true,
  "sms_notifications_enabled": false
}
```

#### Gestion Services Fiscaux
- CRUD complet catalogue 850 services
- Modification base_amount
- Activation/Désactivation services
- Catégorisation (impôts, taxes, licences)

#### Health Check
```json
{
  "status": "healthy",
  "components": {
    "database": "up",
    "redis": "up",
    "firebase": "up",
    "bange_api": "up"
  },
  "uptime_seconds": 86400,
  "version": "1.0.0"
}
```

#### Fichiers Concernés
**Tables DB** :
- `system_settings` (clé-valeur)

#### Critères Validation
- ✅ Settings modifiables
- ✅ CRUD services fiscaux opérationnel
- ✅ Health check retourne status composants
- ✅ Tests passants

---

### TASK-P3-005 : Rapports Financiers Admin

**Agent** : Dev  
**Priorité** : HAUTE  
**Effort** : 3 jours  
**Use Cases** : UC-ADMIN-026 à UC-ADMIN-030

#### Endpoints
1. GET /admin/reports/revenue - Rapport revenus
2. GET /admin/reports/taxes - Rapport taxes collectées
3. GET /admin/reports/services - Rapport par service fiscal
4. GET /admin/reports/exports - Export données (CSV/Excel)
5. POST /admin/reports/generate - Générer rapport personnalisé

#### Rapports Disponibles
**Rapport Revenus** :
- Total revenus période (jour/semaine/mois/année)
- Breakdown par service fiscal
- Breakdown par type paiement (mobile money, carte)
- Comparaison période précédente

**Rapport Taxes** :
- Total taxes collectées
- Par catégorie fiscale
- Par région (si disponible)
- Tendances mensuelles

**Export Données** :
- Format CSV/Excel
- Filtres : date range, service, statut
- Tous les champs déclarations + paiements

#### Fichiers Concernés
**Créer** :
- `app/services/report_service.py` (génération rapports)
- `app/utils/export.py` (CSV/Excel)

**Libraries** :
- `pandas` (manipulation données)
- `openpyxl` (Excel)

#### Critères Validation
- ✅ Rapports précis (validation calculs)
- ✅ Export CSV/Excel fonctionnel
- ✅ Filtres opérationnels
- ✅ Tests calculs avec données test
- ✅ Performance : génération < 10s pour 10k records

---

### TASK-P3-006 : Tests Régression MODULE ADMIN

**Agent** : Test  
**Priorité** : HAUTE  
**Effort** : 1 jour  

#### Contexte
Valider module ADMIN complet (35 endpoints).

#### Tests Critiques
1. **Tests RBAC** : Seuls admins peuvent accéder
2. **Tests dashboard** : Métriques correctes
3. **Tests gestion users** : CRUD + soft delete
4. **Tests assignation agents** : Load balancing
5. **Tests rapports** : Calculs précis

#### Scénarios
```python
@pytest.mark.admin
@pytest.mark.asyncio
async def test_admin_dashboard_metrics(client, admin_token):
    """Test dashboard retourne métriques correctes"""
    response = await client.get(
        "/api/v1/admin/dashboard",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    
    assert response.status_code == 200
    data = response.json()
    
    # Vérifier structure
    assert "revenue" in data
    assert "declarations" in data
    assert "users" in data
    assert "agents" in data

@pytest.mark.security
@pytest.mark.asyncio
async def test_admin_endpoint_requires_admin_role(client, user_token):
    """Test qu'un user normal ne peut pas accéder admin"""
    response = await client.get(
        "/api/v1/admin/dashboard",
        headers={"Authorization": f"Bearer {user_token}"}
    )
    
    assert response.status_code == 403
```

#### Critères Validation
- ✅ 100% tests passants
- ✅ Coverage >85% module ADMIN
- ✅ Tous endpoints RBAC validés
- ✅ Tests calculs métriques précis

---

## SEMAINES 3-4 : MODULE AGENTS (20 endpoints)

### TASK-P3-007 : UC-AGENT-001 (Queue Déclarations avec Scoring)

**Agent** : Dev  
**Priorité** : CRITIQUE  
**Effort** : 2 jours  
**Use Case** : UC-AGENT-001

#### Contexte
Queue intelligente déclarations avec scoring priorité.

#### Endpoint
GET /agents/queue - Liste déclarations assignées avec scoring

#### Algorithme Scoring Priorité
```python
def calculate_priority_score(declaration):
    """
    Score priorité : 0-100 (100 = plus urgent)
    
    Facteurs :
    - Délai restant avant deadline (40%)
    - Montant déclaration (30%)
    - Temps attente dans queue (20%)
    - Complexité déclaration (10%)
    """
    score = 0
    
    # 1. Délai (40 points max)
    days_until_deadline = (declaration.deadline - datetime.now()).days
    if days_until_deadline <= 1:
        score += 40
    elif days_until_deadline <= 3:
        score += 30
    elif days_until_deadline <= 7:
        score += 20
    else:
        score += 10
    
    # 2. Montant (30 points max)
    amount = declaration.amount
    if amount >= 1000000:  # 1M XAF
        score += 30
    elif amount >= 500000:
        score += 20
    else:
        score += 10
    
    # 3. Temps attente (20 points max)
    hours_waiting = (datetime.now() - declaration.submitted_at).total_seconds() / 3600
    if hours_waiting >= 48:
        score += 20
    elif hours_waiting >= 24:
        score += 15
    else:
        score += 10
    
    # 4. Complexité (10 points max)
    if declaration.required_documents_count >= 5:
        score += 10
    else:
        score += 5
    
    return score
```

#### Fonctionnalités Queue
- Tri par score priorité (descendant)
- Filtres : service fiscal, montant range
- Pagination (20 déclarations/page)
- Compteur : déclarations assignées vs totales

#### Fichiers Concernés
**Créer** :
- `app/api/v1/agents.py` (endpoint queue)
- `app/services/agent_queue_service.py` (scoring)

#### Critères Validation
- ✅ Queue retourne déclarations triées par priorité
- ✅ Scoring cohérent
- ✅ Filtres fonctionnels
- ✅ Tests scoring avec différents scénarios

---

### TASK-P3-008 : UC-AGENT-002 (Prendre Déclaration)

**Agent** : Dev  
**Priorité** : CRITIQUE  
**Effort** : 1 jour  
**Use Case** : UC-AGENT-002

#### Endpoint
POST /agents/declarations/{id}/claim - Prendre déclaration

#### Workflow
1. Vérifier déclaration status = "assigned"
2. Vérifier agent assigné = current agent
3. Update status : assigned → processing
4. Timestamp : processing_started_at
5. Lock déclaration (prevent concurrent claims)

#### Locking Mechanism
```python
# Utiliser transaction DB avec SELECT FOR UPDATE
async def claim_declaration(declaration_id: str, agent_id: str):
    async with pool.acquire() as conn:
        async with conn.transaction():
            # Lock row
            decl = await conn.fetchrow(
                """
                SELECT * FROM declarations 
                WHERE id = $1 AND agent_id = $2 AND status = 'assigned'
                FOR UPDATE
                """,
                declaration_id, agent_id
            )
            
            if not decl:
                raise NotFoundError("Declaration not found or already claimed")
            
            # Update status
            await conn.execute(
                """
                UPDATE declarations 
                SET status = 'processing', processing_started_at = NOW()
                WHERE id = $1
                """,
                declaration_id
            )
```

#### Critères Validation
- ✅ Status updated to processing
- ✅ Seul agent assigné peut claim
- ✅ Locking concurrent claims (pas de race conditions)
- ✅ Tests concurrency avec threads

---

### TASK-P3-009 : UC-AGENT-003/004 (Valider/Rejeter Déclaration)

**Agent** : Dev  
**Priorité** : CRITIQUE  
**Effort** : 2 jours  
**Use Cases** : UC-AGENT-003, UC-AGENT-004

#### Endpoints
1. POST /agents/declarations/{id}/validate - Valider déclaration
2. POST /agents/declarations/{id}/reject - Rejeter déclaration

#### Workflow Validation
**Request Body** :
```json
{
  "comments": "Documents conformes, montant correct",
  "validated_amount": 250000,
  "metadata": {
    "documents_verified": true,
    "identity_verified": true,
    "calculations_correct": true
  }
}
```

**Actions** :
1. Update status : processing → validated
2. Set validated_at timestamp
3. Créer payment request automatiquement
4. Notification user (email/SMS)

#### Workflow Rejection
**Request Body** :
```json
{
  "reason": "missing_documents",
  "comments": "Pièce d'identité manquante",
  "required_actions": [
    "Upload valid national ID card",
    "Ensure document is legible"
  ]
}
```

**Actions** :
1. Update status : processing → rejected
2. Set rejected_at timestamp
3. Notification user avec actions requises
4. Possibilité resoumission après corrections

#### Fichiers Concernés
**Modifier** :
- `app/api/v1/agents.py`
- `app/services/declaration_service.py`
- `app/services/notification_service.py`

#### Critères Validation
- ✅ Validation/Rejection fonctionnelle
- ✅ Notifications envoyées
- ✅ Payment request créé (validation)
- ✅ Resoumission possible (rejection)
- ✅ Tests workflows complets

---

### TASK-P3-010 : UC-AGENT-005 (Demander Informations Complémentaires)

**Agent** : Dev  
**Priorité** : HAUTE  
**Effort** : 1 jour  
**Use Case** : UC-AGENT-005

#### Endpoint
POST /agents/declarations/{id}/request-info - Demander infos

#### Request Body
```json
{
  "required_info": [
    "Copie CNI recto-verso",
    "Justificatif domicile récent"
  ],
  "message": "Merci de fournir les documents manquants sous 7 jours",
  "deadline": "2025-10-27"
}
```

#### Workflow
1. Update status : processing → pending_documents
2. Logger demande dans declaration_events
3. Notification user avec liste documents requis
4. Définir deadline (7 jours par défaut)

#### Critères Validation
- ✅ Status updated to pending_documents
- ✅ Notification user avec actions requises
- ✅ Deadline définie
- ✅ Tests passants

---

### TASK-P3-011 : UC-AGENT-006/007 (Statistiques + Dashboard Agent)

**Agent** : Dev  
**Priorité** : MOYENNE  
**Effort** : 2 jours  
**Use Cases** : UC-AGENT-006, UC-AGENT-007

#### Endpoints
1. GET /agents/me/statistics - Statistiques agent
2. GET /agents/me/dashboard - Dashboard agent personnalisé

#### Statistiques Agent
```json
{
  "total_declarations_processed": 142,
  "declarations_validated": 128,
  "declarations_rejected": 14,
  "validation_rate": 90.1,
  "average_processing_time_hours": 12.5,
  "current_declarations": 5,
  "quality_score": 92.3,
  "rank": "5/20"
}
```

#### Dashboard Agent
```json
{
  "queue_summary": {
    "total_assigned": 5,
    "high_priority": 2,
    "medium_priority": 2,
    "low_priority": 1
  },
  "recent_activity": [
    {
      "declaration_id": "DECL-2025-000123",
      "action": "validated",
      "timestamp": "2025-10-20T10:30:00Z"
    }
  ],
  "performance_trend": {
    "last_7_days": [8, 12, 10, 15, 9, 11, 13],
    "labels": ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"]
  }
}
```

#### Fichiers Concernés
**Créer** :
- `app/services/agent_stats_service.py`

#### Critères Validation
- ✅ Métriques précises
- ✅ Dashboard complet
- ✅ Tests calculs stats

---

### TASK-P3-012 : Tests Intégration Workflow Agents

**Agent** : Test  
**Priorité** : CRITIQUE  
**Effort** : 2 jours  

#### Scénarios E2E
1. **Happy path** : Queue → Claim → Validate → Payment
2. **Rejection** : Queue → Claim → Reject → User resubmit
3. **Request info** : Queue → Claim → Request Info → User upload → Resume

#### Tests
```python
@pytest.mark.e2e
@pytest.mark.asyncio
async def test_agent_workflow_validate(client, agent_token, test_declaration):
    """Test workflow complet validation"""
    
    # 1. Queue
    response = await client.get(
        "/api/v1/agents/queue",
        headers={"Authorization": f"Bearer {agent_token}"}
    )
    assert response.status_code == 200
    declarations = response.json()
    assert len(declarations) > 0
    
    # 2. Claim
    decl_id = declarations[0]["id"]
    response = await client.post(
        f"/api/v1/agents/declarations/{decl_id}/claim",
        headers={"Authorization": f"Bearer {agent_token}"}
    )
    assert response.status_code == 200
    
    # 3. Validate
    response = await client.post(
        f"/api/v1/agents/declarations/{decl_id}/validate",
        headers={"Authorization": f"Bearer {agent_token}"},
        json={
            "comments": "All good",
            "validated_amount": 250000
        }
    )
    assert response.status_code == 200
    
    # 4. Vérifier payment créé
    response = await client.get(
        f"/api/v1/payments?declaration_id={decl_id}",
        headers={"Authorization": f"Bearer {agent_token}"}
    )
    assert response.status_code == 200
    payments = response.json()
    assert len(payments) == 1
```

#### Critères Validation
- ✅ 3 scénarios passants
- ✅ Workflow complet validé
- ✅ Notifications vérifiées

---

### TASK-P3-013 : Documentation API Phase 3

**Agent** : Doc  
**Priorité** : MOYENNE  
**Effort** : 1 jour  

#### Modules à Documenter
- ADMIN (35 endpoints)
- AGENTS (20 endpoints)

#### Critères Validation
- ✅ Swagger complet 55 endpoints
- ✅ Exemples concrets
- ✅ Erreurs documentées
- ✅ RBAC clairement indiqué

---

## 📊 KPIs Phase 3

| Métrique | Avant | Après | Objectif |
|----------|-------|-------|----------|
| Endpoints impl | 72 | 127 | 127 |
| Modules complets | 4 | 6 | 6 |
| Coverage tests | >85% | >85% | >85% |
| Workflow agents | 0 | 1 | 1 |
| Admin dashboard | ❌ | ✅ | ✅ |

## ⏱️ Timeline

| Semaine | Tâches | Agent | Focus |
|---------|--------|-------|-------|
| S1 | TASK-P3-001 à P3-003 | Dev | Dashboard + Users + Agents |
| S2 | TASK-P3-004 à P3-006 | Dev + Test | Config + Reports + Tests |
| S3 | TASK-P3-007 à P3-010 | Dev | Queue + Workflow agents |
| S4 | TASK-P3-011 à P3-013 | Dev + Test + Doc | Stats + Tests + Docs |

---

**Prochaine Phase** : Phase 4 - Intégrations (3 semaines)
