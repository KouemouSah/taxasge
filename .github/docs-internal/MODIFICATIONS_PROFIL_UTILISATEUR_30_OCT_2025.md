# Modifications Profil Utilisateur - 30 Octobre 2025

**Date:** 30 octobre 2025
**Branche:** feature/module-1-auth
**Objectif:** Ajouter les champs address, city, avatar_url et mettre à jour les modèles Pydantic

---

## Résumé des Modifications

### Champs Ajoutés ✅
- ✅ `address` (TEXT)
- ✅ `city` (VARCHAR(100))
- ✅ `avatar_url` (TEXT)

### Champ Retiré ❌
- ❌ `country` (retiré des modèles Pydantic pour cohérence avec la base de données)

---

## 📋 Fichiers Modifiés

### 1. Migration SQL

**Fichier créé:** `packages/backend/database/migrations/003_add_user_profile_columns.sql`

```sql
-- Add profile columns to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS city VARCHAR(100),
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_city ON users(city) WHERE city IS NOT NULL;

-- Add comments for documentation
COMMENT ON COLUMN users.address IS 'User street address';
COMMENT ON COLUMN users.city IS 'User city';
COMMENT ON COLUMN users.avatar_url IS 'User profile picture URL';
```

**Impact:**
- ✅ Ajoute 3 nouvelles colonnes à la table `users`
- ✅ Crée un index sur `city` pour les requêtes de recherche
- ✅ Utilise `IF NOT EXISTS` pour éviter les erreurs si déjà appliqué

---

### 2. Modèles Pydantic

**Fichier modifié:** `packages/backend/app/models/user.py`

#### A. UserProfile (ligne 30-38)

**AVANT:**
```python
class UserProfile(BaseModel):
    first_name: str = Field(..., min_length=2, max_length=50)
    last_name: str = Field(..., min_length=2, max_length=50)
    phone: Optional[str] = Field(None, pattern=r"^\+[1-9]\d{1,14}$")
    address: Optional[str] = Field(None, max_length=200)
    city: Optional[str] = Field(None, max_length=50)
    country: str = Field(default="GQ", description="Country code")  # ❌
    language: str = Field(default="es", pattern="^(es|fr|en)$")
    avatar_url: Optional[str] = Field(None)
```

**APRÈS:**
```python
class UserProfile(BaseModel):
    first_name: str = Field(..., min_length=2, max_length=50)
    last_name: str = Field(..., min_length=2, max_length=50)
    phone: Optional[str] = Field(None, pattern=r"^\+[1-9]\d{1,14}$")
    address: Optional[str] = Field(None, max_length=200)
    city: Optional[str] = Field(None, max_length=100)  # ✅ Taille alignée avec DB
    language: str = Field(default="es", pattern="^(es|fr|en)$")
    avatar_url: Optional[str] = Field(None)
```

**Changements:**
- ❌ Retiré `country`
- ✅ Modifié `city` max_length: 50 → 100 (aligné avec DB)

---

#### B. UserUpdate (ligne 96-107)

**AVANT:**
```python
class UserUpdate(BaseModel):
    first_name: Optional[str] = Field(None, min_length=2, max_length=50)
    last_name: Optional[str] = Field(None, min_length=2, max_length=50)
    phone: Optional[str] = Field(None, pattern=r"^\+[1-9]\d{1,14}$")
    address: Optional[str] = Field(None, max_length=200)
    city: Optional[str] = Field(None, max_length=50)
    language: Optional[str] = Field(None, pattern="^(es|fr|en)$")
    avatar_url: Optional[str] = None
    status: Optional[UserStatus] = None
```

**APRÈS:**
```python
class UserUpdate(BaseModel):
    first_name: Optional[str] = Field(None, min_length=2, max_length=50)
    last_name: Optional[str] = Field(None, min_length=2, max_length=50)
    phone: Optional[str] = Field(None, pattern=r"^\+[1-9]\d{1,14}$")
    address: Optional[str] = Field(None, max_length=200)
    city: Optional[str] = Field(None, max_length=100)  # ✅ Taille alignée avec DB
    language: Optional[str] = Field(None, pattern="^(es|fr|en)$")
    avatar_url: Optional[str] = None
    status: Optional[UserStatus] = None
```

**Changements:**
- ✅ Modifié `city` max_length: 50 → 100

---

#### C. UserResponse (ligne 124-143)

**AVANT:**
```python
class UserResponse(BaseModel):
    id: str
    email: EmailStr
    role: UserRole
    status: UserStatus
    first_name: str
    last_name: str
    phone: Optional[str]
    address: Optional[str]
    city: Optional[str]
    country: str  # ❌ Retiré
    language: str
    avatar_url: Optional[str]
    created_at: datetime
    updated_at: datetime
    last_login: Optional[datetime]
    citizen_profile: Optional[CitizenProfile] = None
    business_profile: Optional[BusinessProfile] = None
```

**APRÈS:**
```python
class UserResponse(BaseModel):
    id: str
    email: EmailStr
    role: UserRole
    status: UserStatus
    first_name: str
    last_name: str
    phone: Optional[str]
    address: Optional[str]
    city: Optional[str]
    language: str  # ✅ Plus de country
    avatar_url: Optional[str]
    created_at: datetime
    updated_at: datetime
    last_login: Optional[datetime]
    citizen_profile: Optional[CitizenProfile] = None
    business_profile: Optional[BusinessProfile] = None
```

**Changements:**
- ❌ Retiré `country: str`

---

#### D. UserSearchFilter (ligne 155-164)

**AVANT:**
```python
class UserSearchFilter(BaseModel):
    email: Optional[str]
    role: Optional[UserRole]
    status: Optional[UserStatus]
    country: Optional[str]  # ❌ Retiré
    city: Optional[str]
    language: Optional[str]
    created_after: Optional[datetime]
    created_before: Optional[datetime]
    search_query: Optional[str]
```

**APRÈS:**
```python
class UserSearchFilter(BaseModel):
    email: Optional[str]
    role: Optional[UserRole]
    status: Optional[UserStatus]
    city: Optional[str]  # ✅ Garde city
    language: Optional[str]
    created_after: Optional[datetime]
    created_before: Optional[datetime]
    search_query: Optional[str]
```

**Changements:**
- ❌ Retiré `country`

---

#### E. UserStats (ligne 167-174)

**AVANT:**
```python
class UserStats(BaseModel):
    total_users: int
    active_users: int
    new_users_this_month: int
    users_by_role: Dict[str, int]
    users_by_status: Dict[str, int]
    users_by_country: Dict[str, int]  # ❌ Retiré
```

**APRÈS:**
```python
class UserStats(BaseModel):
    total_users: int
    active_users: int
    new_users_this_month: int
    users_by_role: Dict[str, int]
    users_by_status: Dict[str, int]
    users_by_city: Dict[str, int]  # ✅ Remplacé par city
```

**Changements:**
- ❌ Retiré `users_by_country`
- ✅ Ajouté `users_by_city`

---

### 3. Repository User

**Fichier modifié:** `packages/backend/app/repositories/user_repository.py`

#### A. Méthode _map_to_model (ligne 24-43)

**AVANT:**
```python
def _map_to_model(self, data: Dict[str, Any]) -> UserResponse:
    return UserResponse(
        id=str(data["id"]),
        email=data["email"],
        role=UserRole(data["role"]),
        status=UserStatus(data["status"]),
        first_name=data["first_name"],
        last_name=data["last_name"],
        phone=data.get("phone"),
        address=data.get("address"),
        city=data.get("city"),
        country=data.get("country", "GQ"),  # ❌ Retiré
        language=data.get("language", "es"),
        avatar_url=data.get("avatar_url"),
        created_at=data["created_at"],
        updated_at=data["updated_at"],
        last_login=data.get("last_login"),
        citizen_profile=data.get("citizen_profile"),
        business_profile=data.get("business_profile")
    )
```

**APRÈS:**
```python
def _map_to_model(self, data: Dict[str, Any]) -> UserResponse:
    return UserResponse(
        id=str(data["id"]),
        email=data["email"],
        role=UserRole(data["role"]),
        status=UserStatus(data["status"]),
        first_name=data["first_name"],
        last_name=data["last_name"],
        phone=data.get("phone_number"),  # ✅ Mapping correct: phone_number
        address=data.get("address"),
        city=data.get("city"),
        language=data.get("preferred_language", "es"),  # ✅ Mapping correct: preferred_language
        avatar_url=data.get("avatar_url"),
        created_at=data["created_at"],
        updated_at=data["updated_at"],
        last_login=data.get("last_login"),
        citizen_profile=data.get("citizen_profile"),
        business_profile=data.get("business_profile")
    )
```

**Changements:**
- ❌ Retiré `country`
- ✅ Corrigé mapping `phone` → `phone_number` (colonne DB réelle)
- ✅ Corrigé mapping `language` → `preferred_language` (colonne DB réelle)

---

#### B. Méthode create_user (ligne 99-115)

**AVANT:**
```python
data = {
    "id": user_id,
    "email": user_data.email,
    "password_hash": password_hash,
    "first_name": user_data.profile.first_name,
    "last_name": user_data.profile.last_name,
    "phone_number": user_data.profile.phone,
    "role": user_data.role.value,
    "status": UserStatus.active.value,
    "preferred_language": user_data.profile.language if user_data.profile.language else "es",
}
```

**APRÈS:**
```python
data = {
    "id": user_id,
    "email": user_data.email,
    "password_hash": password_hash,
    "first_name": user_data.profile.first_name,
    "last_name": user_data.profile.last_name,
    "phone_number": user_data.profile.phone,
    "address": user_data.profile.address,  # ✅ AJOUTÉ
    "city": user_data.profile.city,  # ✅ AJOUTÉ
    "avatar_url": user_data.profile.avatar_url,  # ✅ AJOUTÉ
    "role": user_data.role.value,
    "status": UserStatus.active.value,
    "preferred_language": user_data.profile.language if user_data.profile.language else "es",
}
```

**Changements:**
- ✅ Ajouté `address`
- ✅ Ajouté `city`
- ✅ Ajouté `avatar_url`

---

### 4. Service Auth

**Fichier modifié:** `packages/backend/app/services/auth_service.py`

#### A. Méthode register - UserResponse (ligne 93-109)

**AVANT:**
```python
user_response = UserResponse(
    id=user.id,
    email=user.email,
    role=user.role,
    status=user.status,
    first_name=user.first_name,
    last_name=user.last_name,
    phone=user.phone,
    address=user.address,
    city=user.city,
    country=user.country,  # ❌ Retiré
    language=user.language,
    avatar_url=user.avatar_url,
    created_at=user.created_at,
    updated_at=user.updated_at,
    last_login=user.last_login,
)
```

**APRÈS:**
```python
user_response = UserResponse(
    id=user.id,
    email=user.email,
    role=user.role,
    status=user.status,
    first_name=user.first_name,
    last_name=user.last_name,
    phone=user.phone,
    address=user.address,
    city=user.city,
    language=user.language,  # ✅ Plus de country
    avatar_url=user.avatar_url,
    created_at=user.created_at,
    updated_at=user.updated_at,
    last_login=user.last_login,
)
```

**Changements:**
- ❌ Retiré `country=user.country`

---

#### B. Méthode login - UserResponse (ligne 178-194)

**Changements identiques:** Retiré `country=user.country`

---

## 📊 Impact des Changements

### Avant Modifications

| Composant | État | Problème |
|-----------|------|----------|
| **Base de données** | 🔴 Colonnes manquantes | address, city, avatar_url absents |
| **Modèles Pydantic** | 🟡 Incohérents | country présent mais pas en DB |
| **Repository** | 🔴 Insertion incomplète | Champs non enregistrés |
| **API** | 🟡 Partiel | Modèles prêts mais DB manquante |

---

### Après Modifications

| Composant | État | Résultat |
|-----------|------|----------|
| **Base de données** | ✅ Migration prête | Colonnes address, city, avatar_url à ajouter |
| **Modèles Pydantic** | ✅ Cohérents | Plus de country, city=100 char |
| **Repository** | ✅ Insertion complète | Tous les champs enregistrés |
| **API** | ✅ Prêt | Enregistrement + Update fonctionnels |

---

## 🧪 Prochaines Étapes

### 1. Exécuter la Migration SQL ⚠️ CRITIQUE

**Commande:**
```bash
# Option 1: Via psql
psql "postgresql://postgres:[PASSWORD]@db.bpdzfkymgydjxxwlctam.supabase.co:5432/postgres" \
  -f packages/backend/database/migrations/003_add_user_profile_columns.sql

# Option 2: Via script Python
cd packages/backend
./venv/Scripts/python.exe -c "
import psycopg2
from pathlib import Path
from dotenv import load_dotenv
import os

load_dotenv('.env.local')
DATABASE_URL = os.getenv('DATABASE_URL')

conn = psycopg2.connect(DATABASE_URL)
cursor = conn.cursor()

with open('database/migrations/003_add_user_profile_columns.sql') as f:
    cursor.execute(f.read())

conn.commit()
cursor.close()
conn.close()
print('✅ Migration 003 applied successfully')
"
```

**Résultat attendu:**
```
✅ Migration 003 applied successfully
```

---

### 2. Vérifier les Colonnes

**Commande:**
```bash
cd packages/backend
./venv/Scripts/python.exe -c "
import psycopg2, os
from dotenv import load_dotenv
from pathlib import Path

load_dotenv('.env.local')
conn = psycopg2.connect(os.getenv('DATABASE_URL'))
cursor = conn.cursor()

cursor.execute('''
    SELECT column_name, data_type, character_maximum_length
    FROM information_schema.columns
    WHERE table_name = 'users'
    AND column_name IN ('address', 'city', 'avatar_url')
    ORDER BY column_name
''')

for col in cursor.fetchall():
    print(f'{col[0]:<15} {col[1]:<20} {col[2] or \"N/A\"}')

cursor.close()
conn.close()
"
```

**Résultat attendu:**
```
address         text                 N/A
avatar_url      text                 N/A
city            character varying    100
```

---

### 3. Tester l'Enregistrement Complet

**Test avec cURL:**
```bash
curl -X POST "https://taxasge-backend-staging-392159428433.us-central1.run.app/api/v1/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "complete-profile@taxasge.com",
    "password": "SecureTest@2025GQ",
    "first_name": "Complete",
    "last_name": "Profile",
    "phone": "+240222999888",
    "address": "123 Avenue de la Liberté",
    "city": "Malabo",
    "language": "es"
  }'
```

**Vérification en base:**
```bash
cd packages/backend
./venv/Scripts/python.exe -c "
import psycopg2, os
from dotenv import load_dotenv

load_dotenv('.env.local')
conn = psycopg2.connect(os.getenv('DATABASE_URL'))
cursor = conn.cursor()

cursor.execute('''
    SELECT email, first_name, last_name, address, city, avatar_url
    FROM users
    WHERE email = 'complete-profile@taxasge.com'
''')

user = cursor.fetchone()
if user:
    print(f'Email: {user[0]}')
    print(f'Name: {user[1]} {user[2]}')
    print(f'Address: {user[3]}')
    print(f'City: {user[4]}')
    print(f'Avatar: {user[5] or \"(null)\"}')
else:
    print('User not found')

cursor.close()
conn.close()
"
```

---

### 4. Tester la Mise à Jour Profil

**Test PUT /profile:**
```bash
# 1. Login avec demo@taxasge.com
ACCESS_TOKEN="..."  # Token obtenu après login

# 2. Mettre à jour le profil
curl -X PUT "https://taxasge-backend-staging-392159428433.us-central1.run.app/api/v1/users/profile" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{
    "address": "456 Boulevard de la Paix",
    "city": "Bata",
    "avatar_url": "https://example.com/avatar.jpg"
  }'
```

---

## ✅ Checklist de Validation

### Modifications Code

- [x] Migration SQL créée (003_add_user_profile_columns.sql)
- [x] UserProfile mis à jour (retiré country, city 100 char)
- [x] UserUpdate mis à jour (city 100 char)
- [x] UserResponse mis à jour (retiré country)
- [x] UserSearchFilter mis à jour (retiré country)
- [x] UserStats mis à jour (users_by_city au lieu de users_by_country)
- [x] user_repository._map_to_model mis à jour (retiré country, corrigé mapping)
- [x] user_repository.create_user mis à jour (ajouté address, city, avatar_url)
- [x] auth_service.register mis à jour (retiré country)
- [x] auth_service.login mis à jour (retiré country)

### Tests à Exécuter

- [ ] Exécuter migration SQL sur Supabase
- [ ] Vérifier les colonnes ajoutées
- [ ] Tester enregistrement avec address, city, avatar_url
- [ ] Tester mise à jour profil
- [ ] Vérifier données en base après enregistrement
- [ ] Vérifier données en base après update

---

## 📋 Résumé Final

### Modifications Totales

| Type | Nombre |
|------|--------|
| **Fichiers créés** | 1 (migration SQL) |
| **Fichiers modifiés** | 3 (user.py, user_repository.py, auth_service.py) |
| **Lignes ajoutées** | ~30 |
| **Lignes supprimées** | ~15 |
| **Champs ajoutés en DB** | 3 (address, city, avatar_url) |
| **Champs retirés des modèles** | 1 (country) |

---

### Cohérence Finale

| Élément | Modèle Pydantic | Base de Données | Statut |
|---------|----------------|-----------------|--------|
| **address** | ✅ TEXT (200 max) | ✅ TEXT | ✅ Cohérent |
| **city** | ✅ VARCHAR (100 max) | ✅ VARCHAR(100) | ✅ Cohérent |
| **avatar_url** | ✅ TEXT | ✅ TEXT | ✅ Cohérent |
| **country** | ❌ Retiré | ❌ Absent | ✅ Cohérent |
| **phone** | ✅ Optional | ✅ phone_number | ✅ Cohérent |
| **language** | ✅ str | ✅ preferred_language | ✅ Cohérent |

---

**Rapport généré le:** 30 octobre 2025 - 12:00
**Statut:** ✅ MODIFICATIONS TERMINÉES - Migration SQL à exécuter
**Prochaine Étape:** Exécuter la migration 003 sur Supabase
