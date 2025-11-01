# TASK-AUTH-FIX-002 : Correction SupabaseClient - Lever Exceptions

**Assigné à** : DEV_AGENT (Backend)
**Type** : backend
**Skill** : taxasge-backend-dev
**Priorité** : CRITIQUE
**Effort estimé** : 1 heure
**Date création** : 2025-11-01
**Dépendances** : TASK-AUTH-FIX-001 (complétée)

---

## 🎯 CONTEXTE

**Problème identifié** :
Le custom `SupabaseClient` dans `packages/backend/app/database/supabase_client.py` retourne `None` en cas d'erreur au lieu de lever des exceptions. Cela masque les erreurs réelles et empêche le debugging.

**Symptôme** :
Registration API retourne `{"detail":"Failed to create session: Failed to create session"}` sans détail de l'erreur originale.

**Source** : `packages/backend/app/database/supabase_client.py`
- Ligne 114-115 : `insert()` retourne `None` en cas d'exception
- Ligne 87-88 : `select()` retourne `[]` en cas d'exception
- Ligne 133-134 : `update()` retourne `[]` en cas d'exception
- Ligne 147-148 : `delete()` retourne `None` en cas d'exception

**Impact** :
- Impossible de diagnostiquer erreurs Supabase
- Messages d'erreur génériques pour utilisateurs
- Debugging difficile en production/staging

---

## 🎯 OBJECTIF

Modifier le `SupabaseClient` pour qu'il **lève des exceptions explicites** au lieu de retourner `None` ou `[]` silencieusement, tout en gardant la même signature des méthodes pour compatibilité.

---

## 📋 CRITÈRES DE VALIDATION

### Backend
- [ ] `insert()` lève exception au lieu de retourner `None`
- [ ] `select()` lève exception au lieu de retourner `[]`
- [ ] `update()` lève exception au lieu de retourner `[]`
- [ ] `delete()` lève exception au lieu de retourner `None`
- [ ] Messages d'erreur incluent détails HTTP (status code, response body)
- [ ] Logs erreurs conservés (logger.error)
- [ ] Aucune régression : repositories existants fonctionnent
- [ ] Tests existants passent

### Tests
- [ ] Tests unitaires `test_supabase_client.py` mis à jour
- [ ] Tests vérifient exceptions levées en cas d'erreur HTTP
- [ ] Coverage `supabase_client.py` maintenu >85%

### Documentation
- [ ] Docstrings méthodes mises à jour avec exceptions possibles
- [ ] Rapport tâche généré

---

## 🔧 SOLUTION ATTENDUE

### Changements requis

**Fichier** : `packages/backend/app/database/supabase_client.py`

**Avant** (ligne 113-115) :
```python
except Exception as e:
    logger.error(f"Supabase insert error on {table}: {e}")
    return None
```

**Après** :
```python
except httpx.HTTPStatusError as e:
    logger.error(f"Supabase insert error on {table}: {e.response.status_code} - {e.response.text}")
    raise Exception(f"Database insert failed: {e.response.status_code} - {e.response.text}")
except Exception as e:
    logger.error(f"Supabase insert error on {table}: {e}")
    raise Exception(f"Database insert failed: {str(e)}")
```

**Pattern à appliquer** :
1. Capturer `httpx.HTTPStatusError` séparément pour détails HTTP
2. Logger l'erreur avec détails (status code + response body)
3. Lever exception explicite avec message détaillé
4. Appliquer à toutes les méthodes : `insert()`, `select()`, `update()`, `delete()`

### Méthodes à modifier

1. **insert()** (ligne 90-115)
2. **select()** (ligne 58-88)
3. **update()** (ligne 117-134)
4. **delete()** (ligne 136-148)

### Exception handling pattern

```python
try:
    response = await self.client.post(url, json=data)
    response.raise_for_status()
    return response.json()
except httpx.HTTPStatusError as e:
    error_detail = f"{e.response.status_code} - {e.response.text}"
    logger.error(f"Supabase {operation} error on {table}: {error_detail}")
    raise Exception(f"Database {operation} failed on {table}: {error_detail}")
except Exception as e:
    logger.error(f"Supabase {operation} error on {table}: {e}")
    raise Exception(f"Database {operation} failed on {table}: {str(e)}")
```

---

## 🧪 TESTS À EFFECTUER

### Tests unitaires (création recommandée)

**Fichier** : `packages/backend/tests/test_supabase_client.py`

**Tests à ajouter** :
```python
@pytest.mark.asyncio
async def test_insert_http_error_raises_exception():
    """Test que insert() lève exception en cas d'erreur HTTP"""
    # Mock httpx response avec status 400
    # Vérifier qu'exception levée avec détails erreur

@pytest.mark.asyncio
async def test_select_http_error_raises_exception():
    """Test que select() lève exception en cas d'erreur HTTP"""
    # Mock httpx response avec status 404
    # Vérifier qu'exception levée avec détails erreur

@pytest.mark.asyncio
async def test_update_http_error_raises_exception():
    """Test que update() lève exception en cas d'erreur HTTP"""
    # Mock httpx response avec status 500
    # Vérifier qu'exception levée avec détails erreur

@pytest.mark.asyncio
async def test_delete_http_error_raises_exception():
    """Test que delete() lève exception en cas d'erreur HTTP"""
    # Mock httpx response avec status 403
    # Vérifier qu'exception levée avec détails erreur
```

### Tests intégration (après déploiement staging)

1. **Test registration avec erreur DB** :
   - Tenter registration avec données invalides
   - Vérifier message d'erreur détaillé (pas juste "Failed to create session")

2. **Test logs staging** :
   - Vérifier logs Cloud Run contiennent détails erreurs HTTP
   - Vérifier format : `{status_code} - {response_text}`

---

## 📚 RÉFÉRENCES

**Fichiers à modifier** :
- `packages/backend/app/database/supabase_client.py` (lignes 58-148)

**Fichiers impactés (vérifier compatibilité)** :
- `packages/backend/app/repositories/user_repository.py`
- `packages/backend/app/repositories/session_repository.py`
- `packages/backend/app/repositories/refresh_token_repository.py`

**Documentation** :
- httpx exceptions : https://www.python-httpx.org/exceptions/
- Pattern exception handling : `.claude/.agent/SOP/CODE_STANDARDS.md`

---

## ⚠️ RISQUES & MITIGATIONS

| Risque | Probabilité | Impact | Mitigation |
|--------|-------------|--------|------------|
| Régression repositories existants | Faible | Élevé | Tests existants doivent passer |
| Changement comportement API | Faible | Moyen | Même signature méthodes conservée |
| Logs trop verbeux | Moyenne | Faible | Logger que détails essentiels |

---

## 📋 CHECKLIST DEV_AGENT

**Avant de commencer** :
- [ ] Lire `supabase_client.py` complet
- [ ] Identifier tous les `return None` et `return []` dans try/except
- [ ] Lire repositories utilisant SupabaseClient

**Développement** :
- [ ] Modifier `insert()` pour lever exception
- [ ] Modifier `select()` pour lever exception
- [ ] Modifier `update()` pour lever exception
- [ ] Modifier `delete()` pour lever exception
- [ ] Mettre à jour docstrings avec exceptions possibles
- [ ] Créer/mettre à jour tests unitaires

**Validation** :
- [ ] Tous tests existants passent (`pytest packages/backend/tests/`)
- [ ] Nouveaux tests passent
- [ ] Coverage maintenu >85%
- [ ] Aucune erreur flake8/mypy
- [ ] Application démarre sans erreur

**Documentation** :
- [ ] Générer rapport tâche
- [ ] Commit + push vers develop

---

## 🎯 LIVRABLE ATTENDU

**Code** :
- `packages/backend/app/database/supabase_client.py` modifié
- `packages/backend/tests/test_supabase_client.py` créé/mis à jour

**Documentation** :
- `.claude/.agent/Reports/TASK_AUTH_FIX_002_REPORT.md`

**Validation** :
- Score Go/No-Go >75/100
- 0 bugs critiques introduits

---

**Deadline** : 2025-11-01 (même jour - 1h effort)
**Statut** : 🟡 EN ATTENTE ASSIGNATION DEV_AGENT
