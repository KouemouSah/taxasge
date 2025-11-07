# RAPPORT : Refonte Flow d'Inscription en Deux Étapes
**Date**: 2025-11-07
**Auteur**: Claude Code
**Status**: 🔴 EN COURS - Migration table créée, reste implémentation

---

## 🔴 PROBLÈME CRITIQUE IDENTIFIÉ

### Observation de l'utilisateur
> "l'utilisateur avec le mail finalemailtest@odoolab.site ne peut pas être créé et l'adresse libressai@gmail.com a reçu le mail pour signaler que le mail n'existe pas [...] l'utilisateur aussi doit être notifié que le mail n'existe pas [...] je constate que l'utilisateur finalemailtest@odoolab.site est enregistré dans la base de données je pense qu'il y a un défaut, car cela ne sert a rien d'enregistrer un mail qui n'existe pas"

### Analyse Critique

**Problème #1 : Logique d'inscription inversée (CRITIQUE)**

**Flow actuel (BUGUÉ)** :
1. ✅ Utilisateur créé dans la base de données
2. ❌ Email envoyé → **ÉCHEC** (email invalide/serveur down)
3. ⚠️ **Utilisateur reste dans la base avec email_verified=false**
4. ⚠️ **Rollback échoue silencieusement** (Gmail accepte mais ne délivre pas)

**Impact** :
- ❌ Pollution de la base de données avec emails invalides
- ❌ Utilisateurs orphelins qui ne pourront jamais se connecter
- ❌ Pas de feedback pour l'utilisateur que son email est invalide
- ❌ Violation du principe ACID (Atomicity)

**Problème #2 : Validation d'email absente**

- ❌ Aucune vérification DNS MX (existence du domaine)
- ❌ Aucune vérification de syntaxe avancée
- ❌ Gmail accepte l'email mais bounce plus tard (soft bounce)
- ❌ L'utilisateur ne sait jamais que son email est invalide

---

## ✅ SOLUTION RETENUE : APPROCHE A (Two-Step Registration)

### Nouveau Flow d'Inscription

```
ÉTAPE 1 : Request Verification
POST /api/v1/auth/request-verification
{
  "email": "user@example.com",
  "password": "SecureP@ss2025",
  "first_name": "John",
  "last_name": "Doe",
  "phone": "222123456",
  "role": "citizen"
}

Actions:
1. Valider l'email (regex + DNS MX)
2. Hasher le mot de passe
3. Générer code 6 chiffres
4. Stocker dans pending_registrations (expires_at: NOW() + 15min)
5. Envoyer email avec code
6. Retourner: {"message": "Code envoyé", "expires_in": 900}

ÉTAPE 2 : Verify and Register
POST /api/v1/auth/register
{
  "email": "user@example.com",
  "verification_code": "123456"
}

Actions:
1. Vérifier que le code correspond (pending_registrations)
2. Vérifier que le code n'est pas expiré
3. Vérifier attempts < 5
4. SEULEMENT ALORS créer l'utilisateur dans users
5. Supprimer de pending_registrations
6. Générer JWT tokens
7. Retourner: {access_token, refresh_token, user}
```

### Avantages de l'Approche A

✅ **Intégrité des données** : La table `users` ne contient QUE des utilisateurs avec emails validés
✅ **Expérience utilisateur** : Feedback immédiat si email invalide
✅ **Sécurité** : Impossible de créer un compte sans accès à l'email
✅ **Pas de rollback complexe** : Pas de transactions multi-tables
✅ **Scalabilité** : Pas de nettoyage de comptes orphelins nécessaire

---

## 📊 ÉTAT D'AVANCEMENT

### ✅ Étape 1 : Table pending_registrations (COMPLÉTÉ)

**Migration SQL** : `migrations/create_pending_registrations.sql`

**Structure** :
```sql
CREATE TABLE pending_registrations (
    id UUID PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    verification_code VARCHAR(6) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name, last_name, phone, role,

    -- Citizen fields (optional)
    national_id, birth_date, gender, marital_status, occupation,

    -- Business fields (optional)
    business_name, business_type, tax_id, registration_number,
    industry, employee_count, annual_revenue, website,

    created_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP NOT NULL,  -- +15 minutes
    verification_attempts INTEGER DEFAULT 0,
    last_attempt_at TIMESTAMP
);
```

**Indexes créés** :
- `idx_pending_registrations_email` (lookups)
- `idx_pending_registrations_expires_at` (cron cleanup)
- `idx_pending_registrations_verification_code` (verification)

**Status** : ✅ **Déployé sur Supabase** (25 colonnes, 5 indexes)

---

### 🔄 Étape 2 : Validation DNS MX (EN ATTENTE)

**Fichier** : `packages/backend/app/services/email_validator.py` (À CRÉER)

```python
import dns.resolver
import re
from typing import Tuple

class EmailValidator:
    """Validates email addresses with DNS MX verification"""

    EMAIL_REGEX = re.compile(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$')

    @staticmethod
    def validate_syntax(email: str) -> bool:
        """Validate email syntax using regex"""
        return bool(EmailValidator.EMAIL_REGEX.match(email))

    @staticmethod
    def validate_domain_mx(email: str) -> Tuple[bool, str]:
        """
        Validate that email domain has MX records
        Returns: (is_valid, error_message)
        """
        try:
            domain = email.split('@')[1]
            mx_records = dns.resolver.resolve(domain, 'MX')

            if not mx_records:
                return False, f"Domain {domain} has no mail server"

            return True, ""

        except dns.resolver.NXDOMAIN:
            return False, f"Domain does not exist"
        except dns.resolver.NoAnswer:
            return False, f"Domain has no MX records"
        except Exception as e:
            return False, f"DNS lookup failed: {str(e)}"

    @staticmethod
    def validate_email(email: str) -> Tuple[bool, str]:
        """
        Full email validation (syntax + DNS MX)
        Returns: (is_valid, error_message)
        """
        # Syntax check
        if not EmailValidator.validate_syntax(email):
            return False, "Invalid email format"

        # DNS MX check
        return EmailValidator.validate_domain_mx(email)
```

**Dependencies** : `dnspython==2.4.2` (ajouter à requirements.txt)

---

### 🔄 Étape 3 : Endpoint request-verification (EN ATTENTE)

**Fichier** : `packages/backend/app/api/v1/auth.py`

**Nouveau modèle Pydantic** :
```python
class RequestVerificationRequest(BaseModel):
    """Request to send verification code"""
    email: EmailStr
    password: str = Field(min_length=8, max_length=100)
    first_name: str = Field(min_length=1, max_length=100)
    last_name: str = Field(min_length=1, max_length=100)
    phone: str = Field(pattern="^(222|555|551)\\d{6}$")
    role: UserRole

    # Optional citizen fields
    national_id: Optional[str] = None
    birth_date: Optional[date] = None
    gender: Optional[str] = None
    marital_status: Optional[str] = None
    occupation: Optional[str] = None

    # Optional business fields
    business_name: Optional[str] = None
    business_type: Optional[str] = None
    tax_id: Optional[str] = None
    registration_number: Optional[str] = None
    industry: Optional[str] = None
    employee_count: Optional[int] = None
    annual_revenue: Optional[Decimal] = None
    website: Optional[str] = None

class RequestVerificationResponse(BaseModel):
    """Response after requesting verification"""
    message: str
    email: str
    expires_in: int  # seconds (900 = 15 minutes)
    resend_after: int  # seconds before can resend (60)
```

**Nouveau endpoint** :
```python
@router.post(
    "/request-verification",
    response_model=RequestVerificationResponse,
    status_code=status.HTTP_200_OK,
    summary="Request email verification code",
)
async def request_verification(
    request: RequestVerificationRequest,
    auth_service: AuthService = Depends(get_auth_service),
):
    """
    Step 1 of two-step registration:
    - Validates email (syntax + DNS MX)
    - Generates 6-digit code
    - Stores in pending_registrations
    - Sends email with code
    - Returns expires_in (15 minutes)
    """
    try:
        result = await auth_service.request_verification(request)
        return result
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
```

**Logique dans AuthService** :
```python
async def request_verification(
    self,
    request: RequestVerificationRequest
) -> RequestVerificationResponse:
    """
    Process verification request

    Steps:
    1. Validate email (syntax + DNS MX)
    2. Check if email already registered
    3. Hash password
    4. Generate 6-digit code
    5. Store in pending_registrations (expires in 15min)
    6. Send verification email
    7. Return response with expires_in
    """

    # 1. Validate email
    is_valid, error_msg = EmailValidator.validate_email(request.email)
    if not is_valid:
        raise ValueError(f"Invalid email: {error_msg}")

    # 2. Check if email already registered
    existing_user = await self.user_repo.find_by_email(request.email)
    if existing_user:
        raise ValueError("Email already registered")

    # 3. Hash password
    password_hash = self.password_service.hash_password(request.password)

    # 4. Generate 6-digit code
    verification_code = str(random.randint(100000, 999999))

    # 5. Store in pending_registrations
    expires_at = datetime.utcnow() + timedelta(minutes=15)
    await self.pending_registration_repo.create(
        email=request.email,
        verification_code=verification_code,
        password_hash=password_hash,
        first_name=request.first_name,
        last_name=request.last_name,
        phone=request.phone,
        role=request.role,
        # ... all other fields
        expires_at=expires_at
    )

    # 6. Send verification email
    email_sent = await self.email_service.send_verification_code(
        to_email=request.email,
        verification_code=verification_code,
        user_name=request.first_name
    )

    if not email_sent:
        # Rollback pending_registration
        await self.pending_registration_repo.delete_by_email(request.email)
        raise ValueError("Failed to send verification email")

    # 7. Return response
    return RequestVerificationResponse(
        message="Verification code sent to your email",
        email=request.email,
        expires_in=900,  # 15 minutes
        resend_after=60  # 1 minute
    )
```

---

### 🔄 Étape 4 : Modifier /auth/register (EN ATTENTE)

**Nouveau modèle Pydantic** :
```python
class VerifyAndRegisterRequest(BaseModel):
    """Verify code and complete registration"""
    email: EmailStr
    verification_code: str = Field(min_length=6, max_length=6, pattern="^\\d{6}$")
```

**Endpoint modifié** :
```python
@router.post(
    "/register",
    response_model=AuthResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Verify code and complete registration",
)
async def register(
    request: VerifyAndRegisterRequest,
    auth_service: AuthService = Depends(get_auth_service),
):
    """
    Step 2 of two-step registration:
    - Verifies the 6-digit code
    - Creates user in database
    - Generates JWT tokens
    - Returns authentication response
    """
    try:
        result = await auth_service.verify_and_register(request)
        return result
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
```

**Logique dans AuthService** :
```python
async def verify_and_register(
    self,
    request: VerifyAndRegisterRequest
) -> AuthResponse:
    """
    Verify code and complete registration

    Steps:
    1. Find pending_registration by email
    2. Verify code matches
    3. Verify not expired
    4. Verify attempts < 5
    5. Create user in database
    6. Delete pending_registration
    7. Generate JWT tokens
    8. Return AuthResponse
    """

    # 1. Find pending registration
    pending = await self.pending_registration_repo.find_by_email(request.email)
    if not pending:
        raise ValueError("No pending registration found for this email")

    # 2. Verify code
    if pending.verification_code != request.verification_code:
        # Increment attempts
        await self.pending_registration_repo.increment_attempts(request.email)

        if pending.verification_attempts >= 4:  # Next attempt will be 5th
            await self.pending_registration_repo.delete_by_email(request.email)
            raise ValueError("Too many failed attempts. Please request a new code.")

        raise ValueError("Invalid verification code")

    # 3. Verify not expired
    if datetime.utcnow() > pending.expires_at:
        await self.pending_registration_repo.delete_by_email(request.email)
        raise ValueError("Verification code expired. Please request a new one.")

    # 4. Create user
    user_data = UserCreate(
        email=pending.email,
        password=pending.password_hash,  # Already hashed
        first_name=pending.first_name,
        last_name=pending.last_name,
        phone=pending.phone,
        role=pending.role,
        status="active",
        email_verified=True,  # Already verified via code!
        # ... all profile fields from pending
    )

    user = await self.user_repo.create_user_from_hash(user_data)

    # 5. Delete pending registration
    await self.pending_registration_repo.delete_by_email(request.email)

    # 6. Generate tokens
    access_token = self.jwt_service.create_access_token(...)
    refresh_token = self.jwt_service.create_refresh_token(...)

    # 7. Return response
    return AuthResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        expires_in=3600,
        user=user
    )
```

---

### 🔄 Étape 5 : Repository pending_registrations (EN ATTENTE)

**Fichier** : `packages/backend/app/repositories/pending_registration_repository.py` (À CRÉER)

```python
from datetime import datetime, timedelta
from typing import Optional
import asyncpg

class PendingRegistrationRepository:
    """Repository for pending_registrations table"""

    def __init__(self, db_manager):
        self.db_manager = db_manager

    async def create(self, **data) -> str:
        """Create pending registration, returns ID"""
        query = """
            INSERT INTO pending_registrations (
                email, verification_code, password_hash,
                first_name, last_name, phone, role,
                expires_at, ...
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, ...)
            RETURNING id
        """
        row = await self.db_manager.execute_single(query, ...)
        return row['id']

    async def find_by_email(self, email: str) -> Optional[dict]:
        """Find pending registration by email"""
        query = "SELECT * FROM pending_registrations WHERE email = $1"
        row = await self.db_manager.execute_single(query, email)
        return dict(row) if row else None

    async def delete_by_email(self, email: str):
        """Delete pending registration"""
        query = "DELETE FROM pending_registrations WHERE email = $1"
        await self.db_manager.execute_command(query, email)

    async def increment_attempts(self, email: str):
        """Increment verification attempts"""
        query = """
            UPDATE pending_registrations
            SET verification_attempts = verification_attempts + 1,
                last_attempt_at = NOW()
            WHERE email = $1
        """
        await self.db_manager.execute_command(query, email)

    async def cleanup_expired(self):
        """Delete expired pending registrations (cron job)"""
        query = "DELETE FROM pending_registrations WHERE expires_at < NOW()"
        result = await self.db_manager.execute_command(query)
        # Returns number of deleted rows
        return int(result.split()[-1])
```

---

### 🔄 Étape 6 : Cron job cleanup (EN ATTENTE)

**Fichier** : `packages/backend/app/tasks/cleanup_pending_registrations.py` (À CRÉER)

```python
import asyncio
from loguru import logger
from app.database.connection import db_manager
from app.repositories.pending_registration_repository import PendingRegistrationRepository

async def cleanup_pending_registrations():
    """
    Cron job to delete expired pending registrations
    Run every 15 minutes
    """
    try:
        repo = PendingRegistrationRepository(db_manager)
        deleted_count = await repo.cleanup_expired()
        logger.info(f"Cleaned up {deleted_count} expired pending registrations")
    except Exception as e:
        logger.error(f"Failed to cleanup pending registrations: {e}")

if __name__ == "__main__":
    asyncio.run(cleanup_pending_registrations())
```

**Cloud Scheduler** (GCP) :
```bash
gcloud scheduler jobs create http cleanup-pending-registrations \
  --schedule="*/15 * * * *" \
  --uri="https://taxasge-backend-staging-xrlbgdr5eq-uc.a.run.app/api/v1/admin/tasks/cleanup-pending" \
  --http-method=POST \
  --headers="X-CloudScheduler-Token=SECRET_TOKEN" \
  --project=taxasge-dev
```

---

## 📝 TÂCHES RESTANTES

### TODO - High Priority
- [ ] Créer `email_validator.py` avec validation DNS MX
- [ ] Créer `pending_registration_repository.py`
- [ ] Modifier `auth.py` : ajouter endpoint `/request-verification`
- [ ] Modifier `auth.py` : refactoriser endpoint `/register`
- [ ] Créer `cleanup_pending_registrations.py` cron job
- [ ] Ajouter `dnspython==2.4.2` à requirements.txt

### TODO - Testing
- [ ] Test unitaire : EmailValidator.validate_domain_mx()
- [ ] Test E2E : Flow complet request → verify → register
- [ ] Test edge case : Code expiré
- [ ] Test edge case : 5 tentatives ratées
- [ ] Test edge case : Email déjà enregistré

### TODO - Cleanup
- [ ] Supprimer les utilisateurs orphelins existants
- [ ] Migrer les anciennes routes (backward compat?)
- [ ] Documenter le nouveau flow dans README

---

## 🎯 NEXT STEPS

**Option 1 : Implémenter maintenant (2-3 heures)**
- Je continue et implémente toutes les étapes ci-dessus
- Je teste le flow complet
- Je déploie sur staging
- **Avantage** : Solution complète immédiatement
- **Inconvénient** : Long (peut dépasser votre budget temps)

**Option 2 : Implémenter par étapes (recommandé)**
- Je crée d'abord EmailValidator + tests
- Vous validez que la validation DNS MX fonctionne
- Ensuite je crée request-verification endpoint
- Vous testez l'envoi de code
- Ensuite je modifie /register
- Vous testez le flow complet
- **Avantage** : Validation incrémentale, moins de risque
- **Inconvénient** : Plusieurs sessions de travail

**Option 3 : Vous continuez (DIY)**
- Vous utilisez ce rapport comme guide
- Vous implémentez vous-même en suivant la structure
- Je reste disponible pour review/debug
- **Avantage** : Vous apprenez la solution
- **Inconvénient** : Plus long pour vous

---

## 📊 ESTIMATION TEMPORELLE

| Tâche | Temps estimé |
|-------|--------------|
| EmailValidator + tests | 30 min |
| PendingRegistrationRepository | 30 min |
| Endpoint request-verification | 45 min |
| Refonte endpoint register | 45 min |
| Cron job cleanup | 15 min |
| Tests E2E + debug | 60 min |
| **TOTAL** | **3h 45min** |

---

## 🚨 RISQUES IDENTIFIÉS

### Risque 1 : Backward Compatibility
**Problème** : Les applications mobiles/web actuelles utilisent l'ancien endpoint `/register` en one-step
**Mitigation** :
- Garder l'ancien endpoint avec un flag `legacy=true`
- Ajouter un warning dans les logs
- Migrer progressivement les clients

### Risque 2 : DNS Lookup Performance
**Problème** : La validation DNS MX peut prendre 1-2 secondes
**Mitigation** :
- Cache des résultats DNS (Redis ou in-memory, TTL 1h)
- Timeout de 3 secondes max
- Fallback : Si DNS timeout, envoyer email quand même (soft validation)

### Risque 3 : Email Delivery Delayed
**Problème** : L'email met 30 secondes à arriver, le code expire en 15min
**Mitigation** :
- Augmenter TTL à 30 minutes si nécessaire
- Ajouter bouton "Resend code" dans l'UI
- Rate limit : 1 resend par minute max

---

## 💰 COÛTS ESTIMÉS

### Infrastructure
- **pending_registrations table** : ~0.01$ par 1000 registrations (Supabase storage)
- **DNS lookups** : Gratuit (dnspython utilise resolvers publics)
- **Cloud Scheduler cron** : ~0.10$ par mois (free tier covers 3 jobs)

### Temps développeur
- **Implémentation** : 3-4 heures
- **Tests** : 1-2 heures
- **Documentation** : 30 minutes
- **Total** : ~6 heures dev time

---

## 📞 DÉCISION REQUISE

**Que souhaitez-vous que je fasse maintenant ?**

A. ✅ **Continue l'implémentation complète** (3-4h)
B. 🔄 **Implémente étape par étape** (validation incrémentale)
C. 📖 **Stop ici, je continue moi-même** (avec ce guide)
D. 🤔 **Discutons d'abord des détails** (questions/clarifications)

**Répondez A, B, C ou D pour que je sache comment procéder.**
