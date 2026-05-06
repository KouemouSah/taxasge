# Phase 1 — Fix Bug 3 : `get_effectiveness_report` manquant
**Date** : 2026-05-06
**Bug** : 500 sur `GET /api/v1/supervisor/rules/effectiveness/report`

## Architecture & Solution

### Cause exacte
- `supervisor_routes.py:2024` appelle `rules_repo.get_effectiveness_report(entity_type=..., min_times_applied=...)`
- `rules_repository.py` n'a PAS cette méthode → `AttributeError`
- Caught par try/except → 500 "Failed to generate effectiveness report"

### Contrat attendu (déduit de supervisor_routes.py:2030-2043)
```python
async def get_effectiveness_report(
    self,
    entity_type: Optional[str] = None,
    min_times_applied: int = 10,
) -> List[Mapping]:
    # Returns rows with these keys:
    # - id (UUID), name (str), priority (int)
    # - times_applied (int), times_matched (int)
    # - success_rate (Decimal/float), effectiveness_score (Decimal/float)
    # - application_rate (Decimal/float)
    # - last_applied_at (datetime | None)
```

### Métriques calculées (depuis le docstring du endpoint)
- `times_matched` : compteur déjà existant dans `assignment_rules`
- `times_applied` : compteur déjà existant
- `success_rate` : déjà calculé (numeric stocké dans la table)
- **`effectiveness_score`** : `success_rate * 100` (0-100)
- **`application_rate`** : `(times_applied / times_matched) * 100` si times_matched > 0, sinon 0

### Filtres
- `entity_type` : optionnel — si fourni, `WHERE entity_type = $X`
- `min_times_applied` : `HAVING times_applied >= $Y`
- `status = 'active'` : ne montrer que règles actives (sinon archivées polluent)

### Tri
- Par `effectiveness_score DESC` (cf. docstring "Sorted by effectiveness score (DESC)")
- Tie-break par `times_applied DESC` (priorise règles avec volume)

### Performance & sécurité
- **Pas de N+1** : single query agrégée
- **Paramétré** ($1, $2…) — aucune concaténation user input
- **Index** : `assignment_rules` est petit (~10-100 lignes typiquement), pas besoin d'optimiser
- **Self-explanatory query** : pas de JOIN inutile

## SQL final retenu

```sql
SELECT
    id, name, priority,
    times_applied, times_matched,
    success_rate,
    success_rate * 100 AS effectiveness_score,
    CASE
        WHEN times_matched > 0
            THEN (times_applied::numeric / times_matched) * 100
        ELSE 0
    END AS application_rate,
    last_applied_at
FROM assignment_rules
WHERE status = 'active'
  AND times_applied >= $2
  {entity_filter}
ORDER BY effectiveness_score DESC, times_applied DESC
```

## Checklist d'implémentation

- [ ] 1.1 Lire la signature attendue dans `supervisor_routes.py:2024-2050`
- [ ] 1.2 Ajouter méthode `get_effectiveness_report` dans `rules_repository.py`
- [ ] 1.3 Vérifier la requête SQL :
  - [ ] paramétrée ($1, $2)
  - [ ] tri DESC sur effectiveness_score
  - [ ] application_rate gérée pour `times_matched=0`
  - [ ] filtre entity_type optionnel propre
- [ ] 1.4 Test syntaxe : `python -c "from app.modules.assignment.repositories.rules_repository import RulesRepository; assert hasattr(RulesRepository, 'get_effectiveness_report')"`
- [ ] 1.5 Smoke local : `mypy` ou import Python
- [ ] 1.6 Vérifier qu'aucun autre fichier n'attend une autre signature pour cette méthode (grep)
- [ ] 1.7 Critique de la phase : honnêteté sur ce qui marche / ne marche pas
- [ ] 1.8 Commit local sémantique avec message descriptif

## Tests post-deploy attendus

Après merge sur develop + GitHub Actions :
- `curl -H "Authorization: Bearer $TOKEN" https://taxasge-backend-staging.../api/v1/supervisor/rules/effectiveness/report?min_applications=5` → 200 (ou 403 si pas de perm, mais PAS 500)
- Frontend `/dashboard/supervisor/reports` (vista general) → card "Eficacia de Reglas" charge sans erreur

## Risques

- ✅ **Pas de régression possible** : ajout pur, pas de modification existante.
- ⚠️ Si une autre méthode `get_effectiveness_report` existe ailleurs (héritage, mixin), conflit possible. **Mitigation** : grep avant impl.
