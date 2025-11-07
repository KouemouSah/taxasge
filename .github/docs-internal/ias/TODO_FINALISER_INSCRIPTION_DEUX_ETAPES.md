# TODO : Finaliser l'inscription en deux étapes

**Contexte** : Commit intermédiaire après refactoring suite aux critiques utilisateur
**Date** : 2025-11-07
**Status** : ✅ Fondations complètes | 🔄 Endpoints à implémenter

---

## ✅ CE QUI EST FAIT

### 1. Table `pending_registrations` (MINIMALISTE)
- ✅ **6 colonnes** au lieu de 25 (évite sur-engineering)
- ✅ Structure : `id, email, verification_code, created_at, expires_at, verification_attempts`
- ✅ Déployée sur Supabase
- ✅ Indexes optimisés pour lookups et cleanup

### 2. `EmailValidator` (SANS dépendances externes)
- ✅ Validation syntaxe regex RFC 5322
- ✅ Validation DNS domain avec `socket.getaddrinfo()` (stdlib)
- ✅ Timeout 3 secondes (pas de blocage)
- ✅ Fail-open sur timeout (UX > sécurité excessive)
- ✅ Testé localement : 100% des tests passent
- ✅ **Fichier** : `app/utils/email_validator.py`

### 3. `PendingRegistrationRepository`
- ✅ CRUD minimal pour pending_registrations
- ✅ Méthode `verify_code()` avec logique expiration + max attempts
- ✅ Auto-increment attempts si code faux
- ✅ Auto-delete si expiré ou 5 attempts
- ✅ Méthode `cleanup_expired()` pour cron job
- ✅ **Fichier** : `app/repositories/pending_registration_repository.py`

---

## 🔄 CE QUI RESTE À FAIRE

### Étape 1 : Nouvel endpoint `/auth/request-verification-code`

**Fichier** : `packages/backend/app/api/v1/auth.py`

**Modèle Pydantic** :
```python
class RequestVerificationRequest(BaseModel):
    """Request to send verification code to email"""
    email: EmailStr
```

**Response** :
```python
class RequestVerificationResponse(BaseModel):
    message: str  # "Verification code sent to your email"
    email: str
    expires_in: int  # 900 (15 minutes)
```

**Endpoint** :
```python
@router.post(
    "/request-verification-code",
    response_model=RequestVerificationResponse,
    status_code=200,
)
async def request_verification_code(
    request: RequestVerificationRequest,
    db: asyncpg.Connection = Depends(get_database),
):
    """
    Step 1: Send verification code to email

    Flow:
    1. Validate email (syntax + DNS)
    2. Check if email already registered
    3. Generate 6-digit code
    4. Store in pending_registrations
    5. Send email
    6. Return success
    """
    from app.utils.email_validator import EmailValidator
    from app.repositories.pending_registration_repository import PendingRegistrationRepository
    from app.services.email_service import EmailService
    from app.config import get_settings
    import random

    settings = get_settings()

    # 1. Validate email
    is_valid, error_msg = EmailValidator.validate_email(request.email)
    if not is_valid:
        raise HTTPException(400, detail=f"Invalid email: {error_msg}")

    # 2. Check if already registered
    user_repo = UserRepository(db_manager)
    existing = await user_repo.find_by_email(request.email)
    if existing:
        raise HTTPException(400, detail="Email already registered")

    # 3. Generate code
    code = str(random.randint(100000, 999999))

    # 4. Store in pending_registrations
    pending_repo = PendingRegistrationRepository(db_manager)
    await pending_repo.create(request.email, code, expires_in_minutes=15)

    # 5. Send email
    email_service = EmailService(
        smtp_host=settings.SMTP_HOST,
        smtp_port=settings.SMTP_PORT,
        smtp_username=settings.SMTP_USERNAME,
        smtp_password=settings.SMTP_PASSWORD,
        smtp_use_tls=settings.SMTP_USE_TLS,
        smtp_from_email=settings.SMTP_FROM_EMAIL,
    )

    email_sent = email_service.send_verification_code(
        to_email=request.email,
        verification_code=code,
        user_name=request.email.split('@')[0]  # Temp name
    )

    if not email_sent:
        await pending_repo.delete_by_email(request.email)
        raise HTTPException(500, detail="Failed to send verification email")

    # 6. Return
    return RequestVerificationResponse(
        message="Verification code sent to your email",
        email=request.email,
        expires_in=900
    )
```

---

### Étape 2 : Modifier `/auth/register` existant

**IMPORTANT** : L'ancien endpoint `/register` doit maintenant :
1. Accepter le code de vérification
2. Vérifier le code
3. Créer l'utilisateur SEULEMENT si code valide

**Nouveau modèle** :
```python
class RegisterRequest(BaseModel):
    """Complete registration after email verification"""
    email: EmailStr
    verification_code: str = Field(min_length=6, max_length=6, pattern="^\\d{6}$")

    # User data (submitted AFTER verification)
    password: str = Field(min_length=8, max_length=100)
    first_name: str = Field(min_length=1, max_length=100)
    last_name: str = Field(min_length=1, max_length=100)
    phone: str = Field(pattern="^(222|555|551)\\d{6}$")
    role: UserRole

    # Optional profiles
    # ... (citizen/business fields)
```

**Logique modifiée** :
```python
@router.post("/register", response_model=AuthResponse, status_code=201)
async def register(
    request: RegisterRequest,
    auth_service: AuthService = Depends(get_auth_service),
):
    """
    Step 2: Verify code and create user

    Flow:
    1. Verify code in pending_registrations
    2. Check not expired
    3. Check attempts < 5
    4. Create user with email_verified=True
    5. Delete from pending_registrations
    6. Generate JWT tokens
    7. Return AuthResponse
    """
    from app.repositories.pending_registration_repository import PendingRegistrationRepository

    pending_repo = PendingRegistrationRepository(db_manager)

    # 1-3. Verify code
    is_valid = await pending_repo.verify_code(request.email, request.verification_code)

    if not is_valid:
        raise HTTPException(400, detail="Invalid or expired verification code")

    # 4. Create user (email already verified!)
    user_data = UserCreate(
        email=request.email,
        password=request.password,
        first_name=request.first_name,
        last_name=request.last_name,
        phone=request.phone,
        role=request.role,
        email_verified=True,  # ← Already verified!
        status="active",
        # ... profiles
    )

    user = await auth_service.create_user(user_data)

    # 5. Delete pending
    await pending_repo.delete_by_email(request.email)

    # 6. Generate tokens
    access_token = auth_service.jwt_service.create_access_token(...)
    refresh_token = auth_service.jwt_service.create_refresh_token(...)

    # 7. Return
    return AuthResponse(...)
```

---

### Étape 3 : Supprimer l'ancien code de vérification email

**Fichiers à modifier** :
- `app/services/auth_service.py` : Supprimer `send_verification_email()` (lignes 770-862)
- `app/api/v1/auth.py` : Supprimer ancien flow (lignes 89-147)

**Pourquoi** : Avec le nouveau flow, l'email est vérifié AVANT création utilisateur, donc pas besoin d'envoyer un email APRÈS création.

---

### Étape 4 : Cron job cleanup (OPTIONNEL mais recommandé)

**Fichier** : `app/tasks/cleanup_pending.py` (À CRÉER)

```python
"""Cron job to cleanup expired pending_registrations"""
import asyncio
from app.database.connection import db_manager
from app.repositories.pending_registration_repository import PendingRegistrationRepository

async def cleanup():
    repo = PendingRegistrationRepository(db_manager)
    count = await repo.cleanup_expired()
    print(f"[CLEANUP] Deleted {count} expired pending registrations")

if __name__ == "__main__":
    asyncio.run(cleanup())
```

**Cloud Scheduler** (exécuter toutes les 15 minutes) :
```bash
gcloud scheduler jobs create http cleanup-pending-registrations \
  --schedule="*/15 * * * *" \
  --uri="https://YOUR-BACKEND-URL/api/v1/admin/tasks/cleanup-pending" \
  --http-method=POST \
  --project=taxasge-dev
```

---

## 📋 CHECKLIST AVANT DÉPLOIEMENT

### Tests à effectuer
- [ ] Test 1 : Request code avec email valide → code reçu
- [ ] Test 2 : Request code avec email invalide → erreur 400
- [ ] Test 3 : Request code avec domaine inexistant → erreur 400
- [ ] Test 4 : Register avec bon code → utilisateur créé
- [ ] Test 5 : Register avec mauvais code → erreur 400
- [ ] Test 6 : Register avec code expiré (après 15min) → erreur 400
- [ ] Test 7 : Register après 5 tentatives ratées → erreur 400
- [ ] Test 8 : Request code puis attendre 16min puis register → erreur (expiré)

### Edge cases à tester
- [ ] Email déjà enregistré → bloquer au step 1
- [ ] Demander 2 codes de suite pour même email → remplacer l'ancien
- [ ] Utilisateur orphelin existant (finalemailtest@odoolab.site) → doit pouvoir se réinscrire

---

## 🚨 MIGRATION DES UTILISATEURS ORPHELINS

**Problème** : Il y a des utilisateurs dans la DB avec `email_verified=false` (comme `finalemailtest@odoolab.site`)

**Solution** :
```sql
-- Script à exécuter AVANT déploiement
DELETE FROM users WHERE email_verified = false AND created_at < NOW() - INTERVAL '1 day';
```

**Ou alternative douce** :
```sql
-- Marquer comme "pending_cleanup" au lieu de delete
UPDATE users SET status = 'pending_cleanup' WHERE email_verified = false;
```

---

## 📊 ESTIMATION TEMPORELLE

| Tâche | Temps |
|-------|-------|
| Endpoint request-verification-code | 30 min |
| Modifier endpoint register | 45 min |
| Supprimer ancien code verification | 15 min |
| Tests E2E manuels | 30 min |
| Debug + ajustements | 30 min |
| **TOTAL** | **2h 30min** |

---

## 💡 NOTES TECHNIQUES

### Pourquoi pas de Redis ?
- ❌ Dépendance supplémentaire
- ❌ Coût infrastructure
- ✅ PostgreSQL suffit amplement pour ce use case
- ✅ Moins de 1000 inscriptions/jour estimé

### Pourquoi fail-open sur DNS timeout ?
- UX > sécurité excessive
- Si DNS timeout, on laisse l'utilisateur essayer
- L'email sera quand même envoyé (et bouncera si vraiment invalide)
- Gmail gérera le bounce de toute façon

### Pourquoi 15 minutes d'expiration ?
- Balance entre UX et sécurité
- Assez long pour que l'email arrive
- Pas trop long pour éviter spam de codes

---

## 🎯 PROCHAINE SESSION

**Commencer par** :
1. Lire ce fichier TODO
2. Implémenter endpoint `request-verification-code`
3. Tester avec Postman/curl
4. Modifier endpoint `register`
5. Tester flow complet
6. Commit + deploy

**Temps estimé** : 2-3 heures de dev propre

---

## 📞 QUESTIONS À SE POSER

1. **Backward compatibility** : Garder l'ancien endpoint `/register` avec un flag `legacy=true` ?
2. **Rate limiting** : Limiter à 3 demandes de code par email par heure ?
3. **Email templates** : Améliorer le template d'email de vérification ?
4. **Monitoring** : Ajouter métriques (taux de vérification, temps moyen, etc.) ?

**Réponse recommandée** : NON à tout (KISS principle). On peut ajouter plus tard si vraiment nécessaire.
