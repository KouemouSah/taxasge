# USERS MANAGEMENT - USE CASES

> **Module** : USERS
> **Endpoints** : 12
> **Statut** : ⚠️ PARTIEL (30% implémenté - profil basique existe)
> **Priorité** : HAUTE

---

## 📋 TABLE DES MATIÈRES

- [UC-USER-001](#uc-user-001) - GET /users/me - Profil complet utilisateur
- [UC-USER-002](#uc-user-002) - PATCH /users/me - Modifier profil utilisateur
- [UC-USER-003](#uc-user-003) - PATCH /users/me/preferences - Gérer préférences
- [UC-USER-004](#uc-user-004) - GET /users/me/dashboard - Dashboard personnalisé
- [UC-USER-005](#uc-user-005) - GET /users/me/activity - Historique activité
- [UC-USER-006](#uc-user-006) - GET /users/me/declarations - Mes déclarations
- [UC-USER-007](#uc-user-007) - GET /users/me/notifications - Mes notifications
- [UC-USER-008](#uc-user-008) - GET /users/me/payments - Historique paiements
- [UC-USER-009](#uc-user-009) - POST /users/me/kyc/upload - Upload documents KYC
- [UC-USER-010](#uc-user-010) - POST /users/me/change-password - Changer mot de passe
- [UC-USER-011](#uc-user-011) - POST /users/me/2fa/enable - Activer 2FA
- [UC-USER-012](#uc-user-012) - DELETE /users/me - Supprimer compte (RGPD)

---

## 📊 VUE D'ENSEMBLE MODULE

### Contexte
Le module USERS gère le profil complet des utilisateurs (citizens et businesses) après authentification initiale. Il fournit un dashboard personnalisé, historique d'activité, préférences et gestion avancée du compte.

### Workflow Global
```
Auth Login → Profile Complete → Dashboard
    ↓
[Citizen Profile] OU [Business Profile]
    ↓
Preferences + Notifications + Activity History
    ↓
KYC Verification (optional) + 2FA Security
    ↓
Account Management (password, deletion RGPD)
```

### Acteurs
- **Citizen** : Utilisateur personne physique
- **Business** : Utilisateur entreprise
- **System** : Traitement automatique

### Types de Profils

#### Citizen Profile
```json
{
  "user_type": "citizen",
  "personal_info": {
    "first_name": "Jean",
    "last_name": "Dupont",
    "date_of_birth": "1985-03-15",
    "gender": "male",
    "nationality": "GQ"
  },
  "identity": {
    "national_id": "123456789",
    "passport_number": "GQ1234567",
    "id_expiry_date": "2030-12-31"
  },
  "contact": {
    "email": "jean.dupont@example.com",
    "phone": "+240222123456",
    "secondary_phone": null
  },
  "address": {
    "street": "Calle de la República",
    "city": "Malabo",
    "province": "Bioko Norte",
    "postal_code": "00001",
    "country": "GQ"
  }
}
```

#### Business Profile
```json
{
  "user_type": "business",
  "business_info": {
    "company_name": "TechCorp Equatorial Guinea S.A.",
    "legal_form": "SA",
    "registration_number": "RC-2020-12345",
    "nif": "NIF-987654321",
    "creation_date": "2020-01-15",
    "sector": "Tecnología",
    "employees_count": 25,
    "annual_revenue": 500000000
  },
  "legal_representative": {
    "full_name": "Maria Lopez",
    "position": "CEO",
    "email": "maria.lopez@techcorp.gq",
    "phone": "+240222987654"
  },
  "contact": {
    "email": "contact@techcorp.gq",
    "phone": "+240222555000",
    "website": "https://techcorp.gq"
  },
  "address": {
    "street": "Avenida de la Independencia 45",
    "city": "Malabo",
    "province": "Bioko Norte",
    "postal_code": "00002",
    "country": "GQ"
  }
}
```

### Dépendances
- **Database** : Supabase (PostgreSQL) - table `users`
- **Storage** : Firebase Storage (documents KYC)
- **Cache** : Redis (dashboard metrics)
- **TOTP** : pyotp (2FA)
- **Email** : SendGrid (notifications)

---

## 🎯 USE CASES

### UC-USER-001 : Get User Profile - Profil complet utilisateur

#### 1. Métadonnées
- **ID** : UC-USER-001
- **Endpoint** : `GET /users/me`
- **Méthode** : GET
- **Auth requise** : ✅ Oui (Bearer token)
- **Priorité** : HAUTE
- **Statut implémentation** : ⚠️ PARTIEL (profil basique seulement)
- **Acteurs** : Citizen, Business

#### 2. Description Métier
**Contexte** : Un utilisateur connecté souhaite consulter son profil complet avec toutes les métadonnées, statistiques et informations de vérification.

**Problème** : Fournir une vue exhaustive du profil utilisateur adaptée au type (citizen vs business).

**Objectif** : Retourner profil complet différencié selon user_type avec statistiques d'activité, statut KYC et préférences.

**Workflow** :
1. Utilisateur authentifié demande son profil
2. Système identifie user_type (citizen/business)
3. Récupère profil depuis DB
4. Enrichit avec statistiques (déclarations, paiements)
5. Ajoute statut KYC et vérifications
6. Retourne profil complet formaté

#### 3. Given/When/Then
```gherkin
Given un utilisateur authentifié (citizen OU business)
  And un profil existant en DB
When l'utilisateur demande GET /users/me
Then le profil complet est retourné
  And les statistiques sont calculées (total déclarations, total payé)
  And le statut KYC est inclus (verified/pending/not_started)
  And les préférences sont incluses
  And le format varie selon user_type (citizen vs business)
```

#### 4. Requête HTTP
```http
GET /api/v1/users/me HTTP/1.1
Host: api.taxasge.gq
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### 5. Réponse Succès - Citizen
```json
{
  "success": true,
  "data": {
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "user_type": "citizen",
    "email": "jean.dupont@example.com",
    "status": "active",
    "email_verified": true,
    "kyc_status": "verified",
    "2fa_enabled": false,
    "created_at": "2025-01-15T10:00:00Z",
    "last_login_at": "2025-10-31T14:30:00Z",
    "profile_completion": 100,
    
    "personal_info": {
      "first_name": "Jean",
      "last_name": "Dupont",
      "date_of_birth": "1985-03-15",
      "gender": "male",
      "nationality": "GQ"
    },
    
    "identity": {
      "national_id": "123456789",
      "national_id_verified": true,
      "passport_number": "GQ1234567",
      "id_expiry_date": "2030-12-31"
    },
    
    "contact": {
      "phone": "+240222123456",
      "phone_verified": true,
      "secondary_phone": null
    },
    
    "address": {
      "street": "Calle de la República",
      "city": "Malabo",
      "province": "Bioko Norte",
      "postal_code": "00001",
      "country": "GQ"
    },
    
    "preferences": {
      "language": "fr",
      "notifications": {
        "email": true,
        "sms": false,
        "push": true
      },
      "privacy": {
        "profile_visibility": "private",
        "activity_visible": false
      }
    },
    
    "statistics": {
      "total_declarations": 5,
      "pending_declarations": 1,
      "completed_declarations": 4,
      "total_paid_amount": 250000,
      "total_paid_currency": "XAF",
      "last_declaration_date": "2025-10-15T10:00:00Z",
      "last_payment_date": "2025-10-20T14:30:00Z"
    },
    
    "verification": {
      "kyc_verified_at": "2025-01-20T10:00:00Z",
      "kyc_documents": ["national_id", "proof_of_address"],
      "trusted_user": true
    }
  }
}
```

#### 6. Réponse Succès - Business
```json
{
  "success": true,
  "data": {
    "user_id": "660e8400-e29b-41d4-a716-446655440001",
    "user_type": "business",
    "email": "contact@techcorp.gq",
    "status": "active",
    "email_verified": true,
    "kyc_status": "verified",
    "2fa_enabled": true,
    "created_at": "2024-06-01T10:00:00Z",
    "last_login_at": "2025-10-31T09:00:00Z",
    "profile_completion": 100,
    
    "business_info": {
      "company_name": "TechCorp Equatorial Guinea S.A.",
      "legal_form": "SA",
      "registration_number": "RC-2020-12345",
      "nif": "NIF-987654321",
      "nif_verified": true,
      "creation_date": "2020-01-15",
      "sector": "Tecnología",
      "sub_sector": "Software Development",
      "employees_count": 25,
      "annual_revenue": 500000000,
      "revenue_currency": "XAF"
    },
    
    "legal_representative": {
      "full_name": "Maria Lopez",
      "position": "CEO",
      "email": "maria.lopez@techcorp.gq",
      "phone": "+240222987654",
      "verified": true
    },
    
    "contact": {
      "phone": "+240222555000",
      "phone_verified": true,
      "website": "https://techcorp.gq",
      "linkedin": "https://linkedin.com/company/techcorp-gq"
    },
    
    "address": {
      "street": "Avenida de la Independencia 45",
      "city": "Malabo",
      "province": "Bioko Norte",
      "postal_code": "00002",
      "country": "GQ"
    },
    
    "preferences": {
      "language": "es",
      "notifications": {
        "email": true,
        "sms": true,
        "push": true
      },
      "privacy": {
        "profile_visibility": "public",
        "activity_visible": true
      }
    },
    
    "statistics": {
      "total_declarations": 18,
      "pending_declarations": 2,
      "completed_declarations": 16,
      "total_paid_amount": 1850000,
      "total_paid_currency": "XAF",
      "last_declaration_date": "2025-10-28T10:00:00Z",
      "last_payment_date": "2025-10-29T14:30:00Z",
      "avg_declaration_amount": 102777
    },
    
    "verification": {
      "kyc_verified_at": "2024-06-15T10:00:00Z",
      "kyc_documents": ["rc", "nif", "representative_id", "bank_statement"],
      "trusted_business": true,
      "compliance_score": 95
    }
  }
}
```

#### 7. Gestion Erreurs

| Code | Scénario | Message | Action |
|------|----------|---------|--------|
| 401 | Token manquant | Authorization required | Fournir token |
| 401 | Token invalide | Invalid token | Reconnecter |
| 404 | User non trouvé | User not found | Vérifier compte |
| 500 | Erreur DB | Database error | Réessayer |

#### 8. Métriques Techniques

**Latence** :
- P50 : < 100ms (cached)
- P95 : < 300ms
- P99 : < 500ms

**Throughput** : ~1,000-2,000 requêtes/jour

**Taux succès** : > 99.5%

**Cache** : Redis TTL 15 minutes

#### 9. KPIs Métier

**Taux complétude profil** :
```
Formule : (Profils 100% / Total profils) × 100
Cible : > 80%
```

**Taux vérification KYC** :
```
Formule : (Users KYC verified / Total users) × 100
Cible : > 60% (citizen), > 90% (business)
```

#### 10. Instrumentation
```python
from prometheus_client import Counter, Histogram, Gauge

user_profile_requests = Counter(
    'user_profile_requests_total',
    'Total profile requests',
    ['user_type']  # citizen, business
)

user_profile_duration = Histogram(
    'user_profile_duration_seconds',
    'Profile request duration'
)

user_profiles_cached = Counter(
    'user_profiles_cached_total',
    'Profiles served from cache'
)

users_kyc_verified = Gauge(
    'users_kyc_verified',
    'Number of KYC verified users',
    ['user_type']
)
```

#### 11. Sécurité

**RBAC** : User peut SEULEMENT voir son propre profil

**Champs sensibles** :
- `password_hash` : JAMAIS retourné
- `national_id` : Masqué partiel (***456789)
- `nif` : Masqué partiel (***654321)

**Rate Limiting** : 100 requêtes/minute/user

#### 12. Workflow
```python
async def get_user_profile(user_id: str, user_type: str):
    """
    UC-USER-001 : Get complete user profile
    """
    # 1. Check cache first
    cache_key = f"user:profile:{user_id}"
    cached_profile = await redis_client.get(cache_key)
    
    if cached_profile:
        user_profiles_cached.inc()
        return json.loads(cached_profile)
    
    # 2. Get user from DB
    user = await db.users.find_one({"user_id": user_id})
    
    if not user:
        raise NotFoundError("User not found")
    
    # 3. Calculate statistics
    stats = await calculate_user_statistics(user_id)
    
    # 4. Get KYC status
    kyc_info = await get_kyc_verification_status(user_id)
    
    # 5. Format profile based on user_type
    if user_type == 'citizen':
        profile = format_citizen_profile(user, stats, kyc_info)
    else:
        profile = format_business_profile(user, stats, kyc_info)
    
    # 6. Cache profile (15 min TTL)
    await redis_client.setex(cache_key, 900, json.dumps(profile))
    
    # 7. Metrics
    user_profile_requests.labels(user_type=user_type).inc()
    
    return profile

async def calculate_user_statistics(user_id: str):
    """Calculate user activity statistics"""
    declarations = await db.declarations.find({"user_id": user_id}).to_list()
    payments = await db.payments.find({"user_id": user_id, "status": "completed"}).to_list()
    
    return {
        "total_declarations": len(declarations),
        "pending_declarations": sum(1 for d in declarations if d['status'] in ['pending', 'processing']),
        "completed_declarations": sum(1 for d in declarations if d['status'] == 'completed'),
        "total_paid_amount": sum(p['amount'] for p in payments),
        "total_paid_currency": "XAF",
        "last_declaration_date": max((d['created_at'] for d in declarations), default=None),
        "last_payment_date": max((p['completed_at'] for p in payments), default=None)
    }
```

---

### UC-USER-002 : Update User Profile - Modifier profil

#### 1. Métadonnées
- **ID** : UC-USER-002
- **Endpoint** : `PATCH /users/me`
- **Méthode** : PATCH
- **Auth requise** : ✅ Oui
- **Priorité** : HAUTE
- **Statut implémentation** : ❌ NON IMPLÉMENTÉ
- **Acteurs** : Citizen, Business

#### 2. Description Métier
**Contexte** : Un utilisateur souhaite mettre à jour ses informations de profil (contact, adresse, informations personnelles/business).

**Problème** : Permettre modification partielle du profil avec validation selon user_type.

**Objectif** : Mettre à jour profil avec validation business rules, invalider cache, audit logging.

#### 3. Given/When/Then
```gherkin
Given un utilisateur authentifié
  And des champs à modifier (contact, address, personal_info, etc.)
When l'utilisateur soumet PATCH /users/me
  And les champs sont validés selon user_type
Then le profil est mis à jour en DB
  And le cache Redis est invalidé
  And un audit log est créé
  And le profil mis à jour est retourné
  And profile_completion est recalculé
```

#### 4. Requête HTTP - Citizen
```http
PATCH /api/v1/users/me HTTP/1.1
Host: api.taxasge.gq
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "personal_info": {
    "first_name": "Jean-Pierre"
  },
  "contact": {
    "phone": "+240222999888",
    "secondary_phone": "+240222111222"
  },
  "address": {
    "street": "Nueva Calle Principal 123"
  }
}
```

#### 5. Réponse Succès
```json
{
  "success": true,
  "data": {
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "updated_fields": ["personal_info.first_name", "contact.phone", "contact.secondary_phone", "address.street"],
    "updated_at": "2025-10-31T15:00:00Z",
    "profile_completion": 100
  },
  "message": "Profile updated successfully"
}
```

#### 6. Gestion Erreurs

| Code | Scénario | Message | Action |
|------|----------|---------|--------|
| 400 | Phone invalide | Invalid phone format | Corriger format E.164 |
| 400 | Email invalide | Invalid email format | Corriger format |
| 400 | Champ protégé | Cannot modify protected field | Utiliser endpoint spécifique |
| 401 | Non authentifié | Authorization required | Se connecter |
| 409 | Email déjà utilisé | Email already in use | Choisir autre email |

#### 7. Métriques Techniques
**Latence** : P95 < 500ms
**Taux succès** : > 98%

#### 8. KPIs Métier
**Fréquence mise à jour profil** : ~10-15% users/mois

#### 9. Instrumentation
```python
user_profile_updates = Counter(
    'user_profile_updates_total',
    'Profile updates',
    ['user_type', 'field']
)
```

#### 10. Sécurité

**Champs modifiables** :
- `personal_info.*` (citizen)
- `business_info.*` (business, sauf RC/NIF)
- `contact.*`
- `address.*`

**Champs protégés** (non modifiables):
- `user_id`
- `email` (endpoint spécifique)
- `user_type`
- `status`
- `role`
- `registration_number` (business)
- `nif` (business)

**Validation** :
- Phone : E.164 format (+240...)
- Email : RFC 5322
- Dates : ISO 8601

#### 11. Workflow
```python
async def update_user_profile(user_id: str, user_type: str, updates: dict):
    # Define allowed fields by user_type
    if user_type == 'citizen':
        allowed_fields = ['personal_info', 'contact', 'address']
    else:
        allowed_fields = ['business_info', 'legal_representative', 'contact', 'address']
    
    # Filter and validate updates
    filtered_updates = {}
    for field, value in updates.items():
        if field in allowed_fields:
            # Validate field
            if field == 'contact' and 'phone' in value:
                if not validate_e164_phone(value['phone']):
                    raise ValidationError("Invalid phone format")
            filtered_updates[field] = value
    
    # Update DB
    result = await db.users.update_one(
        {"user_id": user_id},
        {"$set": {**filtered_updates, "updated_at": datetime.utcnow()}}
    )
    
    # Invalidate cache
    await redis_client.delete(f"user:profile:{user_id}")
    
    # Recalculate profile completion
    profile_completion = await calculate_profile_completion(user_id, user_type)
    await db.users.update_one(
        {"user_id": user_id},
        {"$set": {"profile_completion": profile_completion}}
    )
    
    # Audit log
    await log_audit_event(
        user_id=user_id,
        action="profile_updated",
        fields_updated=list(filtered_updates.keys())
    )
    
    user_profile_updates.labels(user_type=user_type, field='multiple').inc()
    
    return {"updated_fields": list(filtered_updates.keys())}
```

---

### UC-USER-003 : Manage Preferences - Gérer préférences

#### 1. Métadonnées
- **ID** : UC-USER-003
- **Endpoint** : `PATCH /users/me/preferences`
- **Méthode** : PATCH
- **Auth requise** : ✅ Oui
- **Priorité** : HAUTE
- **Statut implémentation** : ❌ NON IMPLÉMENTÉ
- **Acteurs** : Citizen, Business

#### 2. Description Métier
Gérer préférences utilisateur : langue, notifications (email/SMS/push), confidentialité, accessibilité.

#### 3. Given/When/Then
```gherkin
Given un utilisateur authentifié
When l'utilisateur modifie ses préférences
Then les préférences sont mises à jour
  And les paramètres sont appliqués immédiatement
  And le cache est invalidé
```

#### 4. Requête HTTP
```http
PATCH /api/v1/users/me/preferences HTTP/1.1
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "language": "es",
  "notifications": {
    "email": true,
    "sms": false,
    "push": true,
    "digest_frequency": "daily"
  },
  "privacy": {
    "profile_visibility": "private",
    "activity_visible": false
  },
  "accessibility": {
    "high_contrast": false,
    "large_text": false
  }
}
```

#### 5. Réponse Succès
```json
{
  "success": true,
  "message": "Preferences updated successfully",
  "data": {
    "language": "es",
    "notifications": {
      "email": true,
      "sms": false,
      "push": true,
      "digest_frequency": "daily"
    },
    "privacy": {
      "profile_visibility": "private",
      "activity_visible": false
    }
  }
}
```

#### 6-11. Sections Abrégées
Métriques, KPIs, sécurité et workflow similaires aux précédents, adaptés pour les préférences utilisateur.

---

### UC-USER-004 : Get Dashboard - Dashboard personnalisé

#### 1. Métadonnées
- **ID** : UC-USER-004
- **Endpoint** : `GET /users/me/dashboard`
- **Méthode** : GET
- **Auth requise** : ✅ Oui
- **Priorité** : HAUTE
- **Statut implémentation** : ❌ NON IMPLÉMENTÉ
- **Acteurs** : Citizen, Business

#### 2. Description Métier
**Contexte** : L'utilisateur accède à son espace personnel et voit un dashboard récapitulatif de son activité.

**Problème** : Fournir vue d'ensemble actionnable avec tâches à venir, activité récente, statistiques.

**Objectif** : Dashboard personnalisé avec 4 sections principales : résumé, actions rapides, tâches à venir, activité récente.

#### 3. Given/When/Then
```gherkin
Given un utilisateur authentifié
When l'utilisateur accède au dashboard
Then le résumé d'activité est affiché (pending declarations, upcoming payments)
  And les actions rapides sont listées (create declaration, pay, upload docs)
  And les tâches à venir sont affichées avec deadlines
  And l'activité récente (5 derniers événements) est affichée
  And les statistiques annuelles sont calculées
```

#### 4. Requête HTTP
```http
GET /api/v1/users/me/dashboard HTTP/1.1
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### 5. Réponse Succès
```json
{
  "success": true,
  "data": {
    "summary": {
      "pending_declarations": 1,
      "in_progress_declarations": 2,
      "upcoming_payments": 1,
      "upcoming_payment_amount": 125000,
      "total_spent_this_year": 250000,
      "currency": "XAF"
    },
    
    "quick_actions": [
      {
        "id": "create_declaration",
        "title": "Créer une nouvelle déclaration",
        "icon": "plus",
        "url": "/declarations/create"
      },
      {
        "id": "pay_pending",
        "title": "Payer déclaration en attente",
        "icon": "credit-card",
        "url": "/payments/pending",
        "badge": 1
      },
      {
        "id": "upload_document",
        "title": "Uploader un document",
        "icon": "upload",
        "url": "/documents/upload"
      },
      {
        "id": "contact_support",
        "title": "Contacter le support",
        "icon": "help",
        "url": "/support/contact"
      }
    ],
    
    "upcoming_tasks": [
      {
        "type": "payment_deadline",
        "title": "Paiement à effectuer avant le 15 Nov",
        "declaration_id": "DECL-2025-001234",
        "deadline": "2025-11-15T23:59:59Z",
        "days_remaining": 15,
        "amount": 125000,
        "currency": "XAF",
        "priority": "high"
      },
      {
        "type": "document_required",
        "title": "Documents requis pour DECL-2025-001235",
        "declaration_id": "DECL-2025-001235",
        "required_documents": ["proof_of_address", "bank_statement"],
        "deadline": "2025-11-20T23:59:59Z",
        "days_remaining": 20,
        "priority": "medium"
      },
      {
        "type": "info_requested",
        "title": "Informations complémentaires demandées",
        "declaration_id": "DECL-2025-001236",
        "agent_message": "Veuillez préciser la nature de l'activité",
        "deadline": "2025-11-10T23:59:59Z",
        "days_remaining": 10,
        "priority": "high"
      }
    ],
    
    "recent_activity": [
      {
        "type": "declaration_submitted",
        "title": "Déclaration soumise",
        "declaration_id": "DECL-2025-001234",
        "timestamp": "2025-10-28T14:30:00Z",
        "status": "processing"
      },
      {
        "type": "payment_completed",
        "title": "Paiement effectué",
        "payment_id": "PAY-2025-001233",
        "amount": 125000,
        "currency": "XAF",
        "timestamp": "2025-10-20T10:15:00Z"
      },
      {
        "type": "document_uploaded",
        "title": "Document uploadé",
        "document_name": "national_id.pdf",
        "timestamp": "2025-10-15T09:00:00Z"
      },
      {
        "type": "declaration_validated",
        "title": "Déclaration validée",
        "declaration_id": "DECL-2025-001232",
        "timestamp": "2025-10-10T16:45:00Z"
      },
      {
        "type": "notification_received",
        "title": "Nouveau message de l'agent",
        "message": "Votre déclaration a été validée",
        "timestamp": "2025-10-10T16:30:00Z"
      }
    ],
    
    "statistics_year": {
      "year": 2025,
      "total_declarations": 5,
      "completed_declarations": 4,
      "total_paid": 250000,
      "currency": "XAF",
      "avg_processing_time_days": 3.5
    }
  }
}
```

#### 6. Gestion Erreurs

| Code | Scénario | Message | Action |
|------|----------|---------|--------|
| 401 | Non authentifié | Authorization required | Se connecter |
| 500 | Erreur calcul stats | Error calculating dashboard | Réessayer |

#### 7. Métriques Techniques
**Latence** : P95 < 500ms (agrégations multiples)
**Cache** : Redis TTL 5 minutes
**Taux succès** : > 99%

#### 8. KPIs Métier
**Taux engagement dashboard** : ~60-70% users consultent daily

#### 9. Instrumentation
```python
user_dashboard_requests = Counter(
    'user_dashboard_requests_total',
    'Dashboard requests'
)

user_dashboard_duration = Histogram(
    'user_dashboard_duration_seconds',
    'Dashboard generation duration'
)
```

#### 10. Sécurité
**RBAC** : User voit SEULEMENT son propre dashboard
**Rate Limiting** : 60 requêtes/heure

#### 11. Workflow
```python
async def get_user_dashboard(user_id: str):
    # Check cache
    cache_key = f"user:dashboard:{user_id}"
    cached = await redis_client.get(cache_key)
    if cached:
        return json.loads(cached)
    
    # Aggregate data
    summary = await get_dashboard_summary(user_id)
    upcoming_tasks = await get_upcoming_tasks(user_id)
    recent_activity = await get_recent_activity(user_id, limit=5)
    stats = await get_year_statistics(user_id, year=2025)
    
    dashboard = {
        "summary": summary,
        "quick_actions": get_quick_actions(),
        "upcoming_tasks": upcoming_tasks,
        "recent_activity": recent_activity,
        "statistics_year": stats
    }
    
    # Cache 5 min
    await redis_client.setex(cache_key, 300, json.dumps(dashboard))
    
    user_dashboard_requests.inc()
    return dashboard
```

---

### UC-USER-005 à UC-USER-012 : Use Cases Complémentaires

#### UC-USER-005 : GET /users/me/activity
- Historique activité complet (paginé)
- Filtres : type, date_range

#### UC-USER-006 : GET /users/me/declarations
- Liste toutes mes déclarations
- Filtres : status, fiscal_service, date_range

#### UC-USER-007 : GET /users/me/notifications
- Liste notifications (unread/read)
- Mark as read
- Préférences notifications

#### UC-USER-008 : GET /users/me/payments
- Historique paiements
- Reçus PDF
- Filtres : status, date_range

#### UC-USER-009 : POST /users/me/kyc/upload
- Upload documents KYC (national_id, passport, proof_of_address)
- Déclenchement vérification automatique
- Status : pending → verified/rejected

#### UC-USER-010 : POST /users/me/change-password
- Changer password (requiert ancien password)
- Révocation autres sessions

#### UC-USER-011 : POST /users/me/2fa/enable
- Activer 2FA TOTP
- Génération QR code
- Vérification code initial

#### UC-USER-012 : DELETE /users/me
- Suppression compte (RGPD right to be forgotten)
- Soft delete (anonymisation)
- Cascade : déclarations anonymisées, paiements conservés (obligation légale 7 ans)

---

## 📈 MÉTRIQUES MODULE USERS

### Dashboard Grafana Queries
```promql
# Taux complétude profil
avg(user_profile_completion) by (user_type)

# Requêtes dashboard quotidiennes
rate(user_dashboard_requests_total[1d])

# Latence dashboard P95
histogram_quantile(0.95, rate(user_dashboard_duration_seconds_bucket[5m]))

# Taux KYC vérifiés
users_kyc_verified{user_type="citizen"} / users_total{user_type="citizen"}
```

### Alertes

| Alerte | Condition | Action |
|--------|-----------|--------|
| Dashboard slow | P95 > 1s | Check DB queries |
| Low profile completion | < 70% | Améliorer onboarding |
| Low KYC rate (business) | < 80% | Campagne verification |

---

## 🧪 TESTS RECOMMANDÉS

### Tests Unitaires
```python
class TestUC_USER_001_Profile:
    def test_get_profile_citizen(self):
        """Test : récupérer profil citizen complet"""
        pass
    
    def test_get_profile_business(self):
        """Test : récupérer profil business complet"""
        pass
    
    def test_get_profile_cache_hit(self):
        """Test : cache Redis fonctionne"""
        pass

class TestUC_USER_002_Update:
    def test_update_profile_citizen(self):
        """Test : modifier profil citizen"""
        pass
    
    def test_update_protected_field_rejected(self):
        """Test : tentative modif champ protégé → 400"""
        pass
    
    def test_update_invalid_phone(self):
        """Test : phone invalide → 400"""
        pass

class TestUC_USER_004_Dashboard:
    def test_dashboard_with_pending_tasks(self):
        """Test : dashboard avec tâches à venir"""
        pass
    
    def test_dashboard_empty_activity(self):
        """Test : nouveau user sans activité"""
        pass
```

### Tests E2E
```python
async def test_user_complete_flow():
    """Test : Login → Profile → Update → Dashboard → Activity"""
    # 1. Login
    token = await login_test_user()
    
    # 2. Get profile
    profile = await client.get("/users/me", headers={"Authorization": f"Bearer {token}"})
    assert profile.status_code == 200
    
    # 3. Update profile
    update_response = await client.patch(
        "/users/me",
        json={"contact": {"phone": "+240222999888"}},
        headers={"Authorization": f"Bearer {token}"}
    )
    assert update_response.status_code == 200
    
    # 4. Get dashboard
    dashboard = await client.get("/users/me/dashboard", headers={"Authorization": f"Bearer {token}"})
    assert dashboard.status_code == 200
    assert "summary" in dashboard.json()['data']
```

---

## 📚 RÉFÉRENCES

### Dépendances
- **pyotp** : 2FA TOTP
- **phonenumbers** : Validation E.164

### Standards
- **Phone** : E.164 (+240...)
- **Email** : RFC 5322
- **RGPD** : Right to be forgotten (UC-USER-012)

---

