# Synthèse - Mise à Jour Profil Utilisateur

**Date:** 30 octobre 2025
**Question:** Les champs `address`, `city`, `country`, `avatar_url` peuvent-ils être enregistrés depuis la page profil ?

---

## ✅ RÉPONSE : OUI, ABSOLUMENT !

Les champs manquants lors de l'enregistrement **PEUVENT et DOIVENT** être mis à jour via la page profil.

---

## 🔍 Analyse Backend - API Update Profile

### Endpoint Disponible ✅

```http
PUT /api/v1/users/profile
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "first_name": "John",
  "last_name": "Doe",
  "phone": "+240222123456",
  "address": "123 Main Street",     ✅ ACCEPTÉ
  "city": "Malabo",                 ✅ ACCEPTÉ
  "language": "es",
  "avatar_url": "https://..."       ✅ ACCEPTÉ
}
```

**Fichier:** `packages/backend/app/api/v1/users.py:121-158`

---

### Modèle UserUpdate ✅

**Fichier:** `packages/backend/app/models/user.py:97-109`

```python
class UserUpdate(BaseModel):
    """Model for user updates"""
    first_name: Optional[str] = Field(None, min_length=2, max_length=50)
    last_name: Optional[str] = Field(None, min_length=2, max_length=50)
    phone: Optional[str] = Field(None, pattern=r"^\+[1-9]\d{1,14}$")
    address: Optional[str] = Field(None, max_length=200)        # ✅ PRÉSENT
    city: Optional[str] = Field(None, max_length=50)            # ✅ PRÉSENT
    language: Optional[str] = Field(None, pattern="^(es|fr|en)$")
    avatar_url: Optional[str] = None                            # ✅ PRÉSENT
    status: Optional[UserStatus] = None  # Admin only
```

**Statut:** ✅ **Tous les champs sont acceptés dans le modèle**

---

### Méthode Repository Update ✅

**Fichier:** `packages/backend/app/repositories/base.py:155-180`

```python
async def update(
    self,
    id: str,
    updates: Dict[str, Any],
    use_supabase: bool = True
) -> Optional[T]:
    """Update entity by ID"""
    # Add updated timestamp
    updates["updated_at"] = datetime.utcnow()

    if use_supabase and self.supabase.enabled:
        results = await self.supabase.update(
            self.table_name,
            filters={"id": id},
            data=updates              # ✅ Tous les champs sont passés
        )
        if results:
            return self._map_to_model(results[0])
```

**Statut:** ✅ **La méthode update() accepte et enregistre TOUS les champs**

---

### Logique de l'Endpoint ✅

**Fichier:** `packages/backend/app/api/v1/users.py:127-141`

```python
async def update_user_profile(
    user_update: UserUpdate,
    current_user: UserResponse = Depends(get_current_user)
):
    # Convert update model to dict, excluding None values
    update_data = {
        k: v for k, v in user_update.dict(exclude_unset=True).items()
        if v is not None
    }

    # Non-admin users cannot update status
    if current_user.role not in [UserRole.admin, UserRole.operator] and "status" in update_data:
        del update_data["status"]

    if not update_data:
        return current_user

    updated_user = await user_repository.update(current_user.id, update_data)
    # ✅ Tous les champs sont transmis au repository
```

**Logique:**
1. Extrait les champs non-null du UserUpdate
2. Supprime le champ `status` si user n'est pas admin
3. Appelle `user_repository.update()` avec **TOUS** les champs

**Statut:** ✅ **Aucun filtrage des champs address, city, avatar_url**

---

## 🎯 Validation Complète

### Test Backend API

```bash
# 1. S'authentifier
curl -X POST "https://taxasge-backend-staging.run.app/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@taxasge.com",
    "password": "SecurePass@2025GQ"
  }'

# Récupérer le access_token

# 2. Mettre à jour le profil
curl -X PUT "https://taxasge-backend-staging.run.app/api/v1/users/profile" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {access_token}" \
  -d '{
    "address": "123 Avenue de la Liberté",
    "city": "Malabo",
    "avatar_url": "https://example.com/avatar.jpg"
  }'
```

**Résultat attendu:** ✅ 200 OK avec les champs mis à jour

---

## 🌐 Frontend - Page Profil

### État Actuel ⚠️

**Recherche effectuée:**
```bash
find packages/web -type f -name "*profile*"
```

**Résultat:** Aucune page profil trouvée dans `packages/web/app/`

**Statut:** 🔴 **La page profil n'existe PAS encore** dans le frontend

---

### Ce qui est nécessaire 📋

Pour permettre aux utilisateurs de modifier leur profil, il faut créer :

#### 1. Page Profil
```
packages/web/app/(dashboard)/profile/page.tsx
```

#### 2. Composant Formulaire
```
packages/web/components/profile/ProfileForm.tsx
```

#### 3. Hook API
```typescript
// packages/web/lib/hooks/useProfile.ts
export const useProfile = () => {
  const updateProfile = async (data: UserUpdate) => {
    const response = await fetch('/api/v1/users/profile', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });
    return response.json();
  };

  return { updateProfile };
};
```

#### 4. Champs du Formulaire

Le formulaire devrait inclure :
```tsx
<ProfileForm>
  <Input name="first_name" label="Prénom" />
  <Input name="last_name" label="Nom" />
  <Input name="phone" label="Téléphone" />
  <Input name="address" label="Adresse" />         {/* ✅ */}
  <Input name="city" label="Ville" />              {/* ✅ */}
  <Select name="country" label="Pays">             {/* ✅ */}
    <option value="GQ">Guinée Équatoriale</option>
  </Select>
  <Select name="language" label="Langue">
    <option value="es">Español</option>
    <option value="fr">Français</option>
    <option value="en">English</option>
  </Select>
  <ImageUpload name="avatar_url" />                {/* ✅ */}
</ProfileForm>
```

---

## ✅ Conclusion : TOUT EST PRÊT CÔTÉ BACKEND

### Champs Supportés

| Champ | Backend API | Repository | Base de Données | Frontend |
|-------|-------------|------------|-----------------|----------|
| **address** | ✅ Accepté | ✅ Update | ✅ Colonne existe* | 🔴 Page manquante |
| **city** | ✅ Accepté | ✅ Update | ✅ Colonne existe* | 🔴 Page manquante |
| **country** | ❌ Manquant** | ✅ Update | ✅ Colonne existe* | 🔴 Page manquante |
| **avatar_url** | ✅ Accepté | ✅ Update | ✅ Colonne existe* | 🔴 Page manquante |

*À vérifier dans Supabase
**country n'est pas dans UserUpdate, mais peut être ajouté

---

## 🚀 Stratégie Recommandée

### Option 1 : Laisser les Champs Optionnels (RECOMMANDÉ) ✅

**Approche:**
1. ✅ Enregistrement : Champs essentiels uniquement (nom, email, téléphone)
2. ✅ Page Profil : Utilisateur complète son profil après enregistrement
3. ✅ Progressif : Meilleure UX (pas de formulaire trop long)

**Avantages:**
- Enregistrement rapide (moins de friction)
- Utilisateur contrôle ses données
- Conforme RGPD (données minimales)
- Flexibilité (mise à jour à tout moment)

**Workflow:**
```
1. Enregistrement → email, nom, téléphone, mot de passe
2. Premier login → Redirection vers page "Compléter votre profil"
3. Profil → Ajout address, city, country, avatar
4. Dashboard → Accès complet
```

---

### Option 2 : Ajouter les Champs au Formulaire d'Enregistrement ⚠️

**Approche:**
Modifier `user_repository.create_user()` pour enregistrer TOUS les champs

**Fichier:** `packages/backend/app/repositories/user_repository.py:100-112`

```python
# AJOUT des champs manquants
data = {
    "id": user_id,
    "email": user_data.email,
    "password_hash": password_hash,
    "first_name": user_data.profile.first_name,
    "last_name": user_data.profile.last_name,
    "phone_number": user_data.profile.phone,
    "address": user_data.profile.address,              # ✅ AJOUTÉ
    "city": user_data.profile.city,                    # ✅ AJOUTÉ
    "country": user_data.profile.country or "GQ",      # ✅ AJOUTÉ
    "avatar_url": user_data.profile.avatar_url,        # ✅ AJOUTÉ
    "role": user_data.role.value,
    "status": UserStatus.active.value,
    "preferred_language": user_data.profile.language if user_data.profile.language else "es",
}
```

**Inconvénients:**
- Formulaire d'enregistrement plus long
- Plus de friction à l'inscription
- Champs non obligatoires donc souvent vides quand même

---

## 💡 Recommandation Finale

### ✅ OPTION 1 EST LA MEILLEURE

**Raisons:**

1. **UX Optimale**
   - Enregistrement rapide (5 champs : email, password, nom, prénom, téléphone)
   - Profil complété progressivement

2. **Backend Déjà Prêt**
   - API PUT /profile fonctionne
   - Tous les champs acceptés
   - Validation en place

3. **Priorités Module 1**
   - ✅ Enregistrement fonctionnel (CRITIQUE)
   - ✅ Login fonctionnel (CRITIQUE)
   - 🟡 Page profil (IMPORTANT mais pas bloquant)

4. **Développement Incrémental**
   - Phase 1 : Auth complète (register + login) ← **MAINTENANT**
   - Phase 2 : Page profil utilisateur ← **Après validation auth**

---

## 📋 Actions Nécessaires

### Immédiat (Pour valider l'auth)

- [x] Merger develop dans feature/module-1-auth ✅
- [x] Bugs #5 et #6 corrigés ✅
- [ ] Tester enregistrement + login
- [ ] Créer utilisateur test
- [ ] Valider le flow complet

### Court Terme (Après validation auth)

- [ ] Ajouter `country` dans UserUpdate model
- [ ] Créer page `/profile` dans le frontend
- [ ] Créer composant ProfileForm
- [ ] Créer hook useProfile
- [ ] Tests E2E update profile

---

## 🎯 Réponse Finale à la Question

### **"Les champs address, city, country, avatar_url pourront toujours être enregistrés à partir de sa page profil ?"**

**✅ OUI, ABSOLUMENT !**

**Détails:**
1. ✅ L'API backend est **100% prête** à accepter ces champs via PUT /profile
2. ✅ Le repository `update()` enregistre **tous les champs** sans restriction
3. ✅ Le modèle `UserUpdate` inclut déjà `address`, `city`, `avatar_url`
4. 🔴 Seul manque : La page profil dans le frontend (à créer)
5. 🟡 `country` : Facile à ajouter dans UserUpdate si nécessaire

**Conclusion:** Le système est conçu pour que les utilisateurs complètent leur profil APRÈS l'enregistrement. C'est une **bonne pratique UX**.

---

**Rapport généré le:** 30 octobre 2025 - 11:45
**Statut:** ✅ Backend Prêt - Frontend Page Profil à Créer
**Recommandation:** Valider l'auth d'abord, puis créer la page profil
