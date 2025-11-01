# 🧪 PHASE 5 : TESTS & QA

**Durée estimée** : 2 semaines  
**Objectif** : Coverage >85%, 0 bugs critiques, Performance validée

---

## VUE D'ENSEMBLE

**Semaines** :
- Semaine 1 : Tests Unitaires + Intégration + Sécurité
- Semaine 2 : Tests E2E + Performance + Rapport Final

**Critères Acceptation MVP** :
- ✅ Coverage tests >85%
- ✅ 0 bugs critiques
- ✅ 0 bugs bloquants
- ✅ 20 scénarios E2E passants
- ✅ Performance targets atteints (P95 < 500ms)

---

## SEMAINE 1 : TESTS UNITAIRES, INTÉGRATION & SÉCURITÉ

### TASK-P5-001 : Coverage Audit Complet

**Agent** : Test  
**Priorité** : CRITIQUE  
**Effort** : 1 jour  

#### Contexte
Analyser coverage actuel et identifier gaps précis.

#### Actions
1. **Mesurer coverage global**
   ```bash
   pytest --cov=app --cov-report=html --cov-report=term
   open htmlcov/index.html
   ```

2. **Analyser par module**
   ```bash
   # Coverage par module
   pytest --cov=app.api.v1 --cov-report=term
   pytest --cov=app.services --cov-report=term
   pytest --cov=app.database.repositories --cov-report=term
   ```

3. **Identifier lignes non couvertes**
   - Ouvrir `htmlcov/index.html`
   - Trier modules par coverage (croissant)
   - Identifier lignes rouges (non testées)

4. **Créer rapport gaps**
   ```markdown
   # Coverage Gaps Report
   
   ## Modules <85%
   
   ### auth_service.py (72%)
   **Lignes non couvertes** :
   - L.45-52 : Fonction reset_password (error handling)
   - L.78-82 : Fonction refresh_token (edge case expired)
   
   **Tests à écrire** :
   - test_reset_password_expired_token
   - test_refresh_token_already_used
   
   ### payment_service.py (68%)
   **Lignes non couvertes** :
   - L.123-145 : Webhook BANGE retry logic
   - L.201-210 : Refund handling
   
   **Tests à écrire** :
   - test_webhook_retry_3_times
   - test_refund_payment_success
   ```

#### Output
**Fichier** : `.agent/Reports/COVERAGE_GAPS_REPORT.md`

**Contenu** :
- Liste modules <85%
- Lignes non couvertes par module
- Tests manquants identifiés
- Priorisation (CRITIQUE, HAUTE, MOYENNE)

#### Critères Validation
- ✅ Rapport gaps complet et détaillé
- ✅ Tous modules analysés
- ✅ Tests manquants listés et priorisés

---

### TASK-P5-002 : Tests Unitaires Manquants (Modules Critiques)

**Agent** : Test  
**Priorité** : CRITIQUE  
**Effort** : 2 jours  

#### Contexte
Écrire tests manquants pour atteindre >85% coverage sur modules critiques.

#### Modules Prioritaires
1. **AUTH** (cible >90%)
2. **PAYMENTS** (cible >90%)
3. **DECLARATIONS** (cible >85%)
4. **WEBHOOKS** (cible >95%)
5. **AGENTS** (cible >85%)

#### Approche
Pour chaque module :
1. Lire rapport gaps
2. Écrire tests cas non couverts
3. Focus sur :
   - Error handling (try/except non testés)
   - Edge cases (valeurs limites)
   - Branches conditionnelles (if/else)

#### Exemples Tests à Écrire

**AUTH Module** :
```python
# tests/use_cases/test_uc_auth.py

@pytest.mark.asyncio
async def test_reset_password_expired_token(client):
    """Test reset password avec token expiré"""
    # Créer token expiré (created 25h ago)
    expired_token = create_reset_token(
        user_id="123",
        expires_in_hours=-1  # Expiré
    )
    
    response = await client.post(
        "/api/v1/auth/reset-password",
        json={
            "token": expired_token,
            "new_password": "newpassword123"
        }
    )
    
    assert response.status_code == 400
    data = response.json()
    assert data["code"] == "TOKEN_EXPIRED"

@pytest.mark.asyncio
async def test_refresh_token_already_used(client, user_token):
    """Test refresh token déjà utilisé (rotation)"""
    # Premier refresh
    response1 = await client.post(
        "/api/v1/auth/refresh",
        json={"refresh_token": user_token.refresh_token}
    )
    assert response1.status_code == 200
    
    # Deuxième refresh avec même token (doit échouer)
    response2 = await client.post(
        "/api/v1/auth/refresh",
        json={"refresh_token": user_token.refresh_token}
    )
    assert response2.status_code == 401
    assert "Token already used" in response2.json()["detail"]

@pytest.mark.asyncio
async def test_login_account_banned(client, banned_user):
    """Test login avec compte banni"""
    response = await client.post(
        "/api/v1/auth/login",
        json={
            "email": banned_user.email,
            "password": "password123"
        }
    )
    
    assert response.status_code == 403
    data = response.json()
    assert data["code"] == "ACCOUNT_BANNED"
```

**PAYMENTS Module** :
```python
# tests/use_cases/test_uc_payments.py

@pytest.mark.asyncio
async def test_webhook_retry_exponential_backoff(client, bange_webhook):
    """Test retry webhook avec exponential backoff"""
    # Simuler 3 failures puis success
    with patch('app.services.payment_service.process_payment') as mock:
        mock.side_effect = [
            Exception("DB error"),  # Retry 1
            Exception("DB error"),  # Retry 2
            Exception("DB error"),  # Retry 3
            None  # Success
        ]
        
        # Webhooks doivent retry 3 fois avant success
        for i in range(4):
            response = await client.post(
                "/api/v1/webhooks/bange",
                json=bange_webhook.payload,
                headers={"X-BANGE-Signature": bange_webhook.signature}
            )
        
        # Vérifier appels avec délais exponentiels
        assert mock.call_count == 4

@pytest.mark.asyncio
async def test_refund_payment(client, admin_token, completed_payment):
    """Test remboursement paiement"""
    response = await client.post(
        f"/api/v1/admin/payments/{completed_payment.id}/refund",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={
            "reason": "User request",
            "amount": completed_payment.amount
        }
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "refunded"
    
    # Vérifier notification envoyée
    notifications = await notification_repo.get_by_user_id(completed_payment.user_id)
    assert any(n.type == "payment_refunded" for n in notifications)
```

**DECLARATIONS Module** :
```python
# tests/use_cases/test_uc_declarations.py

@pytest.mark.asyncio
async def test_submit_declaration_missing_required_documents(client, user_token, draft_declaration):
    """Test submit déclaration avec documents manquants"""
    # Draft a 3 documents requis mais 0 uploadés
    response = await client.post(
        f"/api/v1/declarations/{draft_declaration.id}/submit",
        headers={"Authorization": f"Bearer {user_token}"}
    )
    
    assert response.status_code == 422
    data = response.json()
    assert "missing_documents" in data["errors"][0]["code"]
    assert len(data["errors"][0]["missing"]) == 3

@pytest.mark.asyncio
async def test_delete_declaration_not_draft(client, user_token, submitted_declaration):
    """Test suppression déclaration non-draft (interdit)"""
    response = await client.delete(
        f"/api/v1/declarations/{submitted_declaration.id}",
        headers={"Authorization": f"Bearer {user_token}"}
    )
    
    assert response.status_code == 400
    data = response.json()
    assert "Only draft declarations can be deleted" in data["detail"]
```

#### Stratégie Coverage
```python
# Pour chaque fonction non couverte :

def function_to_test(param):
    try:
        # Code nominal (déjà testé)
        result = do_something(param)
        return result
    except SpecificError as e:
        # ❌ Pas testé - Écrire test_function_specific_error
        logger.error(f"Error: {e}")
        raise
    except Exception as e:
        # ❌ Pas testé - Écrire test_function_unexpected_error
        logger.exception(f"Unexpected: {e}")
        raise

# Branches conditionnelles
if condition:
    # ✅ Testé
    do_something()
else:
    # ❌ Pas testé - Écrire test_function_else_branch
    do_something_else()
```

#### Critères Validation
- ✅ AUTH >90%
- ✅ PAYMENTS >90%
- ✅ DECLARATIONS >85%
- ✅ WEBHOOKS >95%
- ✅ AGENTS >85%
- ✅ Tous tests passants

---

### TASK-P5-003 : Tests Intégration Workflows Critiques

**Agent** : Test  
**Priorité** : CRITIQUE  
**Effort** : 2 jours  

#### Contexte
Tester workflows complets end-to-end (plusieurs modules ensemble).

#### 3 Workflows Critiques

**Workflow 1 : Parcours Citizen Complet**
```python
# tests/integration/test_citizen_workflow.py

@pytest.mark.integration
@pytest.mark.asyncio
async def test_citizen_complete_workflow(client):
    """
    Test parcours citizen complet :
    Register → Login → Search Service → Create Declaration → 
    Upload Documents → Submit → Agent Validates → Pay → Receipt
    """
    
    # 1. Register
    user_data = {
        "email": "citizen@test.com",
        "password": "password123",
        "full_name": "Test Citizen",
        "user_type": "citizen"
    }
    response = await client.post("/api/v1/auth/register", json=user_data)
    assert response.status_code == 201
    user_id = response.json()["id"]
    
    # 2. Login
    response = await client.post("/api/v1/auth/login", json={
        "email": user_data["email"],
        "password": user_data["password"]
    })
    assert response.status_code == 200
    token = response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # 3. Search Service
    response = await client.get(
        "/api/v1/fiscal-services?search=impot",
        headers=headers
    )
    assert response.status_code == 200
    services = response.json()
    assert len(services) > 0
    service_id = services[0]["id"]
    
    # 4. Create Declaration (draft)
    response = await client.post(
        "/api/v1/declarations/create",
        headers=headers,
        json={
            "service_id": service_id,
            "data": {"revenue": 5000000}
        }
    )
    assert response.status_code == 201
    declaration = response.json()
    declaration_id = declaration["id"]
    assert declaration["status"] == "draft"
    
    # 5. Upload Documents
    # Document 1 : CNI
    files = {"file": ("cni.pdf", b"fake_pdf_content", "application/pdf")}
    response = await client.post(
        f"/api/v1/declarations/{declaration_id}/documents",
        headers=headers,
        files=files,
        data={"document_type": "national_id"}
    )
    assert response.status_code == 201
    
    # Document 2 : Justificatif
    files = {"file": ("justif.pdf", b"fake_pdf_content", "application/pdf")}
    response = await client.post(
        f"/api/v1/declarations/{declaration_id}/documents",
        headers=headers,
        files=files,
        data={"document_type": "proof_of_address"}
    )
    assert response.status_code == 201
    
    # 6. Submit Declaration
    response = await client.post(
        f"/api/v1/declarations/{declaration_id}/submit",
        headers=headers
    )
    assert response.status_code == 200
    assert response.json()["status"] == "submitted"
    
    # 7. Agent Login et Validate
    agent_response = await client.post("/api/v1/auth/login", json={
        "email": "agent@test.com",
        "password": "agentpass"
    })
    agent_token = agent_response.json()["access_token"]
    agent_headers = {"Authorization": f"Bearer {agent_token}"}
    
    # Agent claim
    response = await client.post(
        f"/api/v1/agents/declarations/{declaration_id}/claim",
        headers=agent_headers
    )
    assert response.status_code == 200
    
    # Agent validate
    response = await client.post(
        f"/api/v1/agents/declarations/{declaration_id}/validate",
        headers=agent_headers,
        json={
            "comments": "All documents verified",
            "validated_amount": 250000
        }
    )
    assert response.status_code == 200
    assert response.json()["status"] == "validated"
    
    # 8. Get Payment Info
    response = await client.get(
        f"/api/v1/payments?declaration_id={declaration_id}",
        headers=headers
    )
    assert response.status_code == 200
    payments = response.json()
    assert len(payments) == 1
    payment = payments[0]
    assert payment["status"] == "pending"
    
    # 9. Simulate BANGE Webhook (Payment)
    webhook_payload = {
        "event": "payment.success",
        "transaction_id": f"TXN-{uuid.uuid4()}",
        "reference": declaration["reference"],
        "amount": 250000,
        "status": "completed"
    }
    signature = generate_bange_signature(webhook_payload)
    
    response = await client.post(
        "/api/v1/webhooks/bange",
        json=webhook_payload,
        headers={"X-BANGE-Signature": signature}
    )
    assert response.status_code == 200
    
    # 10. Verify Payment Completed
    response = await client.get(
        f"/api/v1/payments/{payment['id']}",
        headers=headers
    )
    assert response.status_code == 200
    assert response.json()["status"] == "completed"
    
    # 11. Verify Declaration Paid
    response = await client.get(
        f"/api/v1/declarations/{declaration_id}",
        headers=headers
    )
    assert response.status_code == 200
    assert response.json()["status"] == "paid"
    
    # 12. Get Receipt
    response = await client.get(
        f"/api/v1/receipts?declaration_id={declaration_id}",
        headers=headers
    )
    assert response.status_code == 200
    receipts = response.json()
    assert len(receipts) == 1
    
    print("✅ Parcours citizen complet réussi!")
```

**Workflow 2 : Webhook BANGE → Payment Update → Notification**
```python
@pytest.mark.integration
@pytest.mark.asyncio
async def test_webhook_to_notification_workflow(client, validated_declaration):
    """
    Test workflow webhook complet :
    BANGE Webhook → Update Payment → Update Declaration → Send Notification
    """
    
    # Setup : Déclaration validated avec payment pending
    payment = await create_pending_payment(validated_declaration)
    
    # 1. Receive BANGE Webhook
    webhook_payload = {
        "event": "payment.success",
        "transaction_id": f"TXN-{uuid.uuid4()}",
        "reference": validated_declaration.reference,
        "amount": payment.amount,
        "status": "completed",
        "timestamp": datetime.now().isoformat()
    }
    signature = generate_bange_signature(webhook_payload)
    
    response = await client.post(
        "/api/v1/webhooks/bange",
        json=webhook_payload,
        headers={"X-BANGE-Signature": signature}
    )
    assert response.status_code == 200
    
    # 2. Verify Payment Updated
    updated_payment = await payment_repo.get_by_id(payment.id)
    assert updated_payment.status == "completed"
    assert updated_payment.transaction_id == webhook_payload["transaction_id"]
    assert updated_payment.paid_at is not None
    
    # 3. Verify Declaration Updated
    updated_declaration = await declaration_repo.get_by_id(validated_declaration.id)
    assert updated_declaration.status == "paid"
    assert updated_declaration.paid_at is not None
    
    # 4. Verify Notification Sent
    await asyncio.sleep(0.5)  # Attendre notification async
    
    notifications = await notification_repo.get_by_user_id(validated_declaration.user_id)
    payment_notif = next((n for n in notifications if n.type == "payment_received"), None)
    
    assert payment_notif is not None
    assert validated_declaration.reference in payment_notif.body
    assert str(payment.amount) in payment_notif.body
    
    # 5. Verify Webhook Logged
    webhook_logs = await conn.fetch(
        "SELECT * FROM webhook_events WHERE transaction_id = $1",
        webhook_payload["transaction_id"]
    )
    assert len(webhook_logs) == 1
    assert webhook_logs[0]["processed"] is True
    
    print("✅ Workflow webhook complet réussi!")
```

**Workflow 3 : Agent Queue → Claim → Validate/Reject**
```python
@pytest.mark.integration
@pytest.mark.asyncio
async def test_agent_workflow_queue_to_decision(client, agent_token, submitted_declarations):
    """
    Test workflow agent complet :
    Queue → Claim → Validate/Reject → Notification
    """
    headers = {"Authorization": f"Bearer {agent_token}"}
    
    # 1. Get Queue (with priority scoring)
    response = await client.get("/api/v1/agents/queue", headers=headers)
    assert response.status_code == 200
    queue = response.json()
    assert len(queue) >= 2
    
    # Vérifier tri par priorité
    assert queue[0]["priority_score"] >= queue[1]["priority_score"]
    
    # 2. Claim déclaration (première dans queue)
    decl_id = queue[0]["id"]
    response = await client.post(
        f"/api/v1/agents/declarations/{decl_id}/claim",
        headers=headers
    )
    assert response.status_code == 200
    
    # Vérifier status updated
    decl = await declaration_repo.get_by_id(decl_id)
    assert decl.status == "processing"
    assert decl.processing_started_at is not None
    
    # 3a. Validate (scenario 1)
    response = await client.post(
        f"/api/v1/agents/declarations/{decl_id}/validate",
        headers=headers,
        json={
            "comments": "Documents OK",
            "validated_amount": decl.amount
        }
    )
    assert response.status_code == 200
    
    # Vérifier validation
    decl = await declaration_repo.get_by_id(decl_id)
    assert decl.status == "validated"
    assert decl.validated_at is not None
    
    # Vérifier payment créé
    payments = await payment_repo.get_by_declaration_id(decl_id)
    assert len(payments) == 1
    assert payments[0].status == "pending"
    
    # Vérifier notification user
    notifications = await notification_repo.get_by_user_id(decl.user_id)
    validate_notif = next((n for n in notifications if n.type == "declaration_validated"), None)
    assert validate_notif is not None
    
    # 3b. Reject (scenario 2 - autre déclaration)
    decl_id_2 = queue[1]["id"]
    response = await client.post(
        f"/api/v1/agents/declarations/{decl_id_2}/claim",
        headers=headers
    )
    assert response.status_code == 200
    
    response = await client.post(
        f"/api/v1/agents/declarations/{decl_id_2}/reject",
        headers=headers,
        json={
            "reason": "missing_documents",
            "comments": "CNI missing",
            "required_actions": ["Upload national ID card"]
        }
    )
    assert response.status_code == 200
    
    # Vérifier rejection
    decl2 = await declaration_repo.get_by_id(decl_id_2)
    assert decl2.status == "rejected"
    assert decl2.rejected_at is not None
    
    # Vérifier notification rejection
    notifications2 = await notification_repo.get_by_user_id(decl2.user_id)
    reject_notif = next((n for n in notifications2 if n.type == "declaration_rejected"), None)
    assert reject_notif is not None
    assert "CNI missing" in reject_notif.body
    
    print("✅ Workflow agent complet réussi!")
```

#### Critères Validation
- ✅ 3 workflows passants
- ✅ Toutes étapes validées
- ✅ Notifications vérifiées
- ✅ Pas de régression

---

### TASK-P5-004 : Tests Sécurité

**Agent** : Test  
**Priorité** : CRITIQUE  
**Effort** : 1 jour  

#### Tests Sécurité Obligatoires

**1. Authentication Tests**
```python
@pytest.mark.security
@pytest.mark.asyncio
async def test_jwt_token_expiration(client, expired_token):
    """Test token expiré rejeté"""
    response = await client.get(
        "/api/v1/users/me",
        headers={"Authorization": f"Bearer {expired_token}"}
    )
    assert response.status_code == 401
    assert "expired" in response.json()["detail"].lower()

@pytest.mark.security
@pytest.mark.asyncio
async def test_jwt_token_invalid_signature(client):
    """Test token avec signature invalide rejeté"""
    fake_token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.fake.signature"
    
    response = await client.get(
        "/api/v1/users/me",
        headers={"Authorization": f"Bearer {fake_token}"}
    )
    assert response.status_code == 401
```

**2. Authorization (RBAC) Tests**
```python
@pytest.mark.security
@pytest.mark.asyncio
async def test_user_cannot_access_admin_endpoints(client, user_token):
    """Test user normal ne peut pas accéder admin"""
    endpoints = [
        "/api/v1/admin/dashboard",
        "/api/v1/admin/users",
        "/api/v1/admin/agents"
    ]
    
    for endpoint in endpoints:
        response = await client.get(
            endpoint,
            headers={"Authorization": f"Bearer {user_token}"}
        )
        assert response.status_code == 403
        assert "Insufficient permissions" in response.json()["detail"]

@pytest.mark.security
@pytest.mark.asyncio
async def test_user_cannot_access_other_user_data(client, user1_token, user2_id):
    """Test user ne peut pas voir données autre user"""
    response = await client.get(
        f"/api/v1/users/{user2_id}",
        headers={"Authorization": f"Bearer {user1_token}"}
    )
    assert response.status_code == 403
```

**3. Input Validation Tests**
```python
@pytest.mark.security
@pytest.mark.asyncio
async def test_sql_injection_prevention(client, user_token):
    """Test prévention SQL injection"""
    malicious_input = "'; DROP TABLE users; --"
    
    response = await client.get(
        f"/api/v1/users?search={malicious_input}",
        headers={"Authorization": f"Bearer {user_token}"}
    )
    # Ne doit pas crasher et ne doit pas exécuter SQL
    assert response.status_code in [200, 400]

@pytest.mark.security
@pytest.mark.asyncio
async def test_xss_prevention(client):
    """Test prévention XSS"""
    xss_payload = "<script>alert('XSS')</script>"
    
    response = await client.post(
        "/api/v1/auth/register",
        json={
            "email": "test@test.com",
            "password": "password123",
            "full_name": xss_payload
        }
    )
    
    if response.status_code == 201:
        # Vérifier que script pas exécuté dans response
        user = response.json()
        assert "<script>" not in user["full_name"]
```

**4. Rate Limiting Tests**
```python
@pytest.mark.security
@pytest.mark.asyncio
async def test_rate_limiting_login(client):
    """Test rate limiting sur login (max 5/min)"""
    for i in range(6):
        response = await client.post(
            "/api/v1/auth/login",
            json={"email": "test@test.com", "password": "wrong"}
        )
        
        if i < 5:
            assert response.status_code in [401, 422]  # Wrong creds
        else:
            assert response.status_code == 429  # Too many requests
            assert "rate limit" in response.json()["detail"].lower()
```

**5. CORS Tests**
```python
@pytest.mark.security
@pytest.mark.asyncio
async def test_cors_allowed_origins(client):
    """Test CORS avec origine autorisée"""
    response = await client.options(
        "/api/v1/users/me",
        headers={"Origin": "https://taxasge.com"}
    )
    assert response.headers.get("Access-Control-Allow-Origin") == "https://taxasge.com"

@pytest.mark.security
@pytest.mark.asyncio
async def test_cors_blocked_origins(client):
    """Test CORS avec origine non autorisée"""
    response = await client.options(
        "/api/v1/users/me",
        headers={"Origin": "https://malicious.com"}
    )
    assert "Access-Control-Allow-Origin" not in response.headers
```

#### Critères Validation
- ✅ Tous tests sécurité passants
- ✅ 0 failles détectées
- ✅ JWT validation OK
- ✅ RBAC enforcement OK
- ✅ Input validation OK
- ✅ Rate limiting OK
- ✅ CORS configuré correctement

---

## SEMAINE 2 : TESTS E2E, PERFORMANCE & RAPPORT FINAL

### TASK-P5-005 : 20 Scénarios E2E

**Agent** : Test  
**Priorité** : CRITIQUE  
**Effort** : 3 jours  

#### Contexte
Tester 20 scénarios utilisateur complets couvrant tous use cases critiques.

#### 20 Scénarios E2E

**Scénarios Citizen (1-7)** :
1. ✅ Parcours complet citizen (déjà testé en intégration)
2. Citizen register → Email verification → First login
3. Citizen search services → Compare → Create declaration
4. Citizen upload invalid document → Error → Upload valid
5. Citizen submit incomplete → Error → Complete → Submit
6. Citizen view dashboard → See pending declarations
7. Citizen receive notification → Click → View declaration

**Scénarios Business (8-10)** :
8. Business register → Upload RC/NIF → Verify → Create declaration
9. Business create multiple declarations → Track all
10. Business download receipts → Export CSV

**Scénarios Agent (11-14)** :
11. ✅ Agent workflow (déjà testé en intégration)
12. Agent request additional info → Citizen upload → Agent resume
13. Agent reject → Citizen fix → Resubmit → Agent validate
14. Agent view performance dashboard → Export report

**Scénarios Admin (15-17)** :
15. Admin view dashboard → Drill down revenue by service
16. Admin ban user → User cannot login
17. Admin create agent → Agent receives credentials → Login

**Scénarios Payment (18-19)** :
18. ✅ Payment webhook workflow (déjà testé)
19. Payment failure → Retry → Success

**Scénario Escalation (20)** :
20. Declaration → Agent → Escalate to support → Resolve

#### Exemple Scénario 12 (Request Info)
```python
@pytest.mark.e2e
@pytest.mark.asyncio
async def test_scenario_12_agent_request_info(client):
    """
    Scénario : Agent demande infos complémentaires
    """
    # Setup
    citizen_token = await register_and_login_citizen(client)
    agent_token = await login_agent(client)
    
    # 1. Citizen crée et submit déclaration
    decl_id = await create_and_submit_declaration(client, citizen_token)
    
    # 2. Agent claim déclaration
    await client.post(
        f"/api/v1/agents/declarations/{decl_id}/claim",
        headers={"Authorization": f"Bearer {agent_token}"}
    )
    
    # 3. Agent demande infos supplémentaires
    response = await client.post(
        f"/api/v1/agents/declarations/{decl_id}/request-info",
        headers={"Authorization": f"Bearer {agent_token}"},
        json={
            "required_info": ["Copie CNI recto-verso"],
            "message": "Merci de fournir CNI complète",
            "deadline": "2025-10-27"
        }
    )
    assert response.status_code == 200
    
    # Vérifier status updated
    decl = await declaration_repo.get_by_id(decl_id)
    assert decl.status == "pending_documents"
    
    # 4. Citizen reçoit notification
    await asyncio.sleep(0.5)
    notifications = await notification_repo.get_by_user_id(decl.user_id)
    info_request = next((n for n in notifications if "CNI" in n.body), None)
    assert info_request is not None
    
    # 5. Citizen upload document manquant
    response = await client.post(
        f"/api/v1/declarations/{decl_id}/documents",
        headers={"Authorization": f"Bearer {citizen_token}"},
        files={"file": ("cni_complet.pdf", b"pdf_content", "application/pdf")},
        data={"document_type": "national_id"}
    )
    assert response.status_code == 201
    
    # 6. Citizen resubmit
    response = await client.post(
        f"/api/v1/declarations/{decl_id}/resubmit",
        headers={"Authorization": f"Bearer {citizen_token}"}
    )
    assert response.status_code == 200
    
    # Vérifier status updated
    decl = await declaration_repo.get_by_id(decl_id)
    assert decl.status == "submitted"
    
    # 7. Agent reprend et valide
    await client.post(
        f"/api/v1/agents/declarations/{decl_id}/claim",
        headers={"Authorization": f"Bearer {agent_token}"}
    )
    
    response = await client.post(
        f"/api/v1/agents/declarations/{decl_id}/validate",
        headers={"Authorization": f"Bearer {agent_token}"},
        json={"comments": "OK", "validated_amount": 250000}
    )
    assert response.status_code == 200
    
    print("✅ Scénario 12 réussi!")
```

#### Critères Validation
- ✅ 20/20 scénarios passants
- ✅ Aucune régression
- ✅ Tous use cases critiques couverts

---

### TASK-P5-006 : Tests Performance (Locust)

**Agent** : Test  
**Priorité** : HAUTE  
**Effort** : 1 jour  

#### Contexte
Valider performance endpoints critiques sous charge.

#### Métriques Cibles
| Endpoint | P50 | P95 | P99 |
|----------|-----|-----|-----|
| POST /auth/login | <100ms | <300ms | <500ms |
| POST /auth/register | <150ms | <300ms | <500ms |
| GET /users/me | <50ms | <100ms | <200ms |
| GET /declarations/list | <200ms | <500ms | <1s |
| POST /declarations/create | <300ms | <800ms | <1.5s |
| POST /webhooks/bange | <500ms | <2s | <3s |
| GET /agents/queue | <200ms | <500ms | <1s |

#### Locust Script
```python
# locustfile.py
from locust import HttpUser, task, between
import random

class TaxasGEUser(HttpUser):
    wait_time = between(1, 3)
    
    def on_start(self):
        """Login au démarrage"""
        response = self.client.post("/api/v1/auth/login", json={
            "email": f"user{random.randint(1, 100)}@test.com",
            "password": "password123"
        })
        
        if response.status_code == 200:
            self.token = response.json()["access_token"]
        else:
            self.token = None
    
    @task(10)
    def view_dashboard(self):
        """Task : Voir dashboard (poids 10)"""
        if self.token:
            self.client.get(
                "/api/v1/users/me/dashboard",
                headers={"Authorization": f"Bearer {self.token}"}
            )
    
    @task(5)
    def list_declarations(self):
        """Task : Lister déclarations (poids 5)"""
        if self.token:
            self.client.get(
                "/api/v1/declarations/list",
                headers={"Authorization": f"Bearer {self.token}"}
            )
    
    @task(3)
    def create_declaration(self):
        """Task : Créer déclaration (poids 3)"""
        if self.token:
            self.client.post(
                "/api/v1/declarations/create",
                headers={"Authorization": f"Bearer {self.token}"},
                json={
                    "service_id": "550e8400-e29b-41d4-a716-446655440000",
                    "data": {"revenue": 5000000}
                }
            )
    
    @task(2)
    def search_services(self):
        """Task : Rechercher services (poids 2)"""
        if self.token:
            self.client.get(
                f"/api/v1/fiscal-services?search=impot",
                headers={"Authorization": f"Bearer {self.token}"}
            )
    
    @task(1)
    def view_profile(self):
        """Task : Voir profil (poids 1)"""
        if self.token:
            self.client.get(
                "/api/v1/users/me",
                headers={"Authorization": f"Bearer {self.token}"}
            )

# Tests de charge
class WebhookUser(HttpUser):
    """Simuler webhooks BANGE"""
    wait_time = between(0.1, 0.5)
    
    @task
    def send_webhook(self):
        payload = {
            "event": "payment.success",
            "transaction_id": f"TXN-{random.randint(1, 100000)}",
            "reference": f"DECL-2025-{random.randint(1, 1000):06d}",
            "amount": 250000,
            "status": "completed"
        }
        
        signature = generate_signature(payload)
        
        self.client.post(
            "/api/v1/webhooks/bange",
            json=payload,
            headers={"X-BANGE-Signature": signature}
        )
```

#### Exécution Tests
```bash
# Test 100 users
locust -f locustfile.py --host=http://localhost:8000 --users 100 --spawn-rate 10 --run-time 5m

# Test spike (0 → 1000 users en 30s)
locust -f locustfile.py --host=http://localhost:8000 --users 1000 --spawn-rate 33 --run-time 2m

# Test endurance (100 users pendant 1h)
locust -f locustfile.py --host=http://localhost:8000 --users 100 --spawn-rate 10 --run-time 1h
```

#### Analyse Résultats
```python
# Extraire métriques
import json

with open('locust_stats.json') as f:
    stats = json.load(f)

for endpoint, metrics in stats.items():
    p50 = metrics['response_times']['50']
    p95 = metrics['response_times']['95']
    p99 = metrics['response_times']['99']
    
    print(f"{endpoint}:")
    print(f"  P50: {p50}ms")
    print(f"  P95: {p95}ms")
    print(f"  P99: {p99}ms")
    
    # Vérifier targets
    if endpoint == "/auth/login":
        assert p95 < 300, f"Login P95 too slow: {p95}ms"
```

#### Critères Validation
- ✅ Toutes métriques cibles atteintes
- ✅ 0 crashes sous charge
- ✅ Latence acceptable (P95 < 500ms endpoints critiques)
- ✅ Throughput >1000 req/min

---

### TASK-P5-007 : Tests Charge (Stress & Endurance)

**Agent** : Test  
**Priorité** : MOYENNE  
**Effort** : 1 jour  

#### 3 Types Tests Charge

**1. Spike Test** : 0 → 1000 users en 30s
```bash
locust -f locustfile.py --users 1000 --spawn-rate 33 --run-time 5m
```

**Critères** :
- ✅ Application reste up
- ✅ Latence P95 < 1s (acceptable dégradation)
- ✅ 0 erreurs 5xx

**2. Stress Test** : 1000 users pendant 5min
```bash
locust -f locustfile.py --users 1000 --spawn-rate 50 --run-time 5m
```

**Critères** :
- ✅ Application reste up
- ✅ Pas de memory leaks
- ✅ CPU < 80%

**3. Endurance Test** : 100 users pendant 1h
```bash
locust -f locustfile.py --users 100 --spawn-rate 10 --run-time 1h
```

**Critères** :
- ✅ Application stable
- ✅ Pas de memory leaks
- ✅ Performance stable (pas de dégradation)

#### Critères Validation
- ✅ 3 types tests passants
- ✅ 0 crashes
- ✅ Performance acceptable

---

### TASK-P5-008 : Rapport QA Final

**Agent** : Test  
**Priorité** : CRITIQUE  
**Effort** : 1 jour  

#### Contenu Rapport
```markdown
# RAPPORT QA FINAL - BACKEND TAXASGE

**Date** : 2025-10-XX  
**Phase** : Phase 5 - Tests & QA  
**Statut** : ✅ VALIDÉ POUR PRODUCTION

## Executive Summary

**Résultat Global** : ✅ TOUS CRITÈRES MVP VALIDÉS

| Critère | Cible | Atteint | Statut |
|---------|-------|---------|--------|
| Coverage tests | >85% | 89% | ✅ |
| Bugs critiques | 0 | 0 | ✅ |
| Bugs bloquants | 0 | 0 | ✅ |
| Scénarios E2E | 20 | 20 | ✅ |
| Performance P95 | <500ms | 420ms | ✅ |

## Coverage Tests (89%)

| Module | Coverage | Statut |
|--------|----------|--------|
| AUTH | 92% | ✅ |
| PAYMENTS | 94% | ✅ |
| DECLARATIONS | 87% | ✅ |
| WEBHOOKS | 96% | ✅ |
| AGENTS | 86% | ✅ |
| USERS | 88% | ✅ |
| DOCUMENTS | 91% | ✅ |
| ADMIN | 85% | ✅ |
| **GLOBAL** | **89%** | **✅** |

## Tests Exécutés

| Type | Total | Passants | Échoués | Taux Succès |
|------|-------|----------|---------|-------------|
| Unitaires | 342 | 342 | 0 | 100% |
| Intégration | 28 | 28 | 0 | 100% |
| E2E | 20 | 20 | 0 | 100% |
| Sécurité | 15 | 15 | 0 | 100% |
| Performance | 12 | 12 | 0 | 100% |
| **TOTAL** | **417** | **417** | **0** | **100%** |

## Performance

### Endpoints Critiques (P95)
- POST /auth/login : 280ms ✅ (target <300ms)
- POST /webhooks/bange : 1.8s ✅ (target <2s)
- GET /declarations/list : 450ms ✅ (target <500ms)
- POST /declarations/create : 720ms ✅ (target <800ms)

### Load Testing
- **100 users simultanés** : ✅ Stable
- **1000 users spike** : ✅ Acceptable (P95 <1s)
- **Endurance 1h** : ✅ Pas de dégradation

## Bugs Identifiés

### Critiques (0)
Aucun bug critique détecté.

### Bloquants (0)
Aucun bug bloquant détecté.

### Majeurs (2 - FIXÉS)
1. ~~Payment webhook timeout après 3 retries~~ → FIXÉ
2. ~~Agent queue scoring incorrect pour deadlines~~ → FIXÉ

### Mineurs (5 - NON BLOQUANTS)
1. Tooltip dashboard admin ne s'affiche pas toujours
2. Notification push délai 2-3s (acceptable)
3. Export CSV > 10k lignes lent (>15s)
4. Message erreur 422 parfois trop technique
5. Mobile : Bouton upload petit sur iPhone SE

## Sécurité

### Tests Sécurité (15/15 ✅)
- JWT validation : ✅
- RBAC enforcement : ✅
- SQL injection prevention : ✅
- XSS prevention : ✅
- Rate limiting : ✅
- CORS configuration : ✅

### Vulnérabilités : 0

## Recommandations

### Avant Production
1. ✅ Activer rate limiting production (done)
2. ✅ Configurer alertes PagerDuty (done)
3. ✅ Setup Prometheus monitoring (done)

### Post-Production (Nice to have)
1. Améliorer messages erreur 422 (plus user-friendly)
2. Optimiser export CSV >10k lignes (streaming)
3. Améliorer UX mobile (boutons plus grands)

## Conclusion

**Backend TaxasGE est PRÊT pour PRODUCTION** ✅

Tous critères MVP validés :
- ✅ Qualité code (89% coverage)
- ✅ Fonctionnel (20 scénarios E2E)
- ✅ Performance (P95 <500ms)
- ✅ Sécurité (0 vulnérabilités)
- ✅ Stabilité (tests charge OK)

**Prochaine étape** : Phase 6 - Déploiement
```

#### Critères Validation
- ✅ Rapport complet et détaillé
- ✅ Métriques exactes
- ✅ Bugs documentés
- ✅ Recommandations actionnables
- ✅ Décision GO/NO-GO claire

---

## 📊 CRITÈRES ACCEPTATION MVP - CHECKLIST FINALE

**AVANT D'APPROUVER PRODUCTION** :

### Qualité Code
- [x] Coverage tests >85% (atteint : 89%)
- [x] Tous tests passants (417/417)
- [x] Linter/type checker OK (black, flake8, mypy)
- [x] 0 code smells critiques (SonarQube)

### Fonctionnel
- [x] 20 scénarios E2E passants
- [x] Tous use cases critiques implémentés
- [x] Webhooks BANGE fonctionnels
- [x] Notifications multi-canal OK

### Performance
- [x] Endpoints critiques P95 <500ms
- [x] Webhooks P95 <2s
- [x] Load test 100 users OK
- [x] Spike test 1000 users OK
- [x] Endurance 1h OK

### Sécurité
- [x] JWT validation OK
- [x] RBAC enforcement OK
- [x] Input validation OK
- [x] Rate limiting configuré
- [x] CORS configuré
- [x] 0 vulnérabilités détectées

### Stabilité
- [x] 0 bugs critiques
- [x] 0 bugs bloquants
- [x] Tests charge passants
- [x] Pas de memory leaks

### Monitoring
- [x] Prometheus métriques instrumentées
- [x] Grafana dashboards créés
- [x] Alertes PagerDuty configurées
- [x] Logs centralisés

**SI TOUTES CASES COCHÉES** → ✅ **GO FOR PRODUCTION**

---

## ⏱️ Timeline Phase 5

| Jour | Tâches | Agent | Heures |
|------|--------|-------|--------|
| J1 | TASK-P5-001 Coverage Audit | Test | 8h |
| J2-J3 | TASK-P5-002 Tests Unitaires | Test | 16h |
| J4-J5 | TASK-P5-003 Tests Intégration | Test | 16h |
| J6 | TASK-P5-004 Tests Sécurité | Test | 8h |
| J7-J9 | TASK-P5-005 20 Scénarios E2E | Test | 24h |
| J10 | TASK-P5-006 Tests Performance | Test | 8h |
| J11 | TASK-P5-007 Tests Charge | Test | 8h |
| J12 | TASK-P5-008 Rapport QA | Test | 8h |

**Total** : 12 jours (2.4 semaines)

---

**Prochaine Phase** : Phase 6 - Déploiement (1 semaine)
