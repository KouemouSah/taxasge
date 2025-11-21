# Corrections Nécessaires pour les Vues SQL

## Problèmes Identifiés

### 1. Colonnes inexistantes dans `ministry_agents`

La table `ministry_agents` N'A PAS les colonnes suivantes utilisées dans les vues:
- ❌ `full_name`
- ❌ `email`
- ❌ `sectors_of_competence`
- ❌ `phone`

**Structure réelle de `ministry_agents`:**
```sql
id                   integer (PK)
user_id              uuid (FK → users.id)
ministry_id          integer (FK → ministries.id)
agent_role           varchar(50)
is_active            boolean
[...]
```

**Solution:** Ces informations doivent être obtenues via la table `users`:
- Join: `ministry_agents.user_id = users.id`
- Utiliser: `users.full_name`, `users.email`, `users.phone_number`

### 2. Colonne `phone` vs `phone_number`

❌ `users.phone` n'existe pas
✅ `users.phone_number` est le nom correct

### 3. Colonne `sectors_of_competence`

Cette colonne N'EXISTE NULLE PART dans le schéma. À supprimer ou remplacer par une logique métier appropriée.

---

## Corrections à Appliquer

### Fichier: `01_declarations_views.sql`

**Ligne 68:** Utilise `ma.full_name`
```sql
-- ACTUEL (INCORRECT)
ma.full_name as agent_name,

-- CORRECTION
u_agent.full_name as agent_name,
```

**Solution:** Ajouter join avec users pour l'agent:
```sql
LEFT JOIN users u_agent ON ma.user_id = u_agent.id
```

### Fichier: `02_agents_workload_views.sql`

**Lignes 17-21:** Utilisent colonnes inexistantes de `ministry_agents`
```sql
-- ACTUEL (INCORRECT)
ma.full_name as agent_name,
ma.email as agent_email,
ma.sectors_of_competence,

-- CORRECTION
u.full_name as agent_name,
u.email as agent_email,
-- Supprimer sectors_of_competence ou remplacer par logique appropriée
```

**Solution:** Ajouter join:
```sql
JOIN users u ON ma.user_id = u.id
```

**Lignes 135, 195, 282:** Même problème `ma.full_name`

**Ligne 33 (users.phone):** À corriger en `phone_number`

---

## Actions Requises

1. ✅ Supprimer `sectors_of_competence` (n'existe pas)
2. ✅ Ajouter joins avec `users` pour obtenir `full_name`, `email`
3. ✅ Corriger `phone` → `phone_number`
4. ✅ Vérifier TOUS les champs utilisés contre DATABASE_SCHEMA_REFERENCE.md

---

## Checklist de Validation

Avant d'appliquer les vues:
- [ ] Vérifier que TOUTES les colonnes SELECT existent dans les tables
- [ ] Vérifier que TOUS les joins utilisent les bons types (uuid = uuid, integer = integer)
- [ ] Vérifier que TOUTES les valeurs d'enum sont valides
- [ ] Tester chaque vue individuellement sur la base de données
