# Phase 2 — Fix Bug 2 : NaN/Inf dans treasury_analytics
**Date** : 2026-05-06
**Bug** : 500 sur `/admin/service-requests/treasury/analytics/report` avec `ValueError('Out of range float values are not JSON compliant')`

## Architecture & Solution

### Cause racine confirmée (logs Cloud Run)
```
treasury_analytics.py:387: ConstantInputWarning: An input array is constant;
the correlation coefficient is not defined.
  coefficient, p_value = stats.pearsonr(...)
ValueError('Out of range float values are not JSON compliant')
```

`scipy.stats.pearsonr` retourne `(NaN, NaN)` quand l'une des séries a variance=0. Le `try/except Exception` (ligne 401) ne catch PAS le warning, et `float(NaN)` propage. Pydantic/Starlette JSON encoder rejette NaN/Inf → 500.

### Endroits à risque (sources de NaN/Inf)
1. **`calculate_correlations` ligne 387** : pearsonr sur série constante → confirmé
2. **`analyze_trend`** : `model.predict([[last_day + 7]])[0]` peut retourner NaN si X tous égaux
3. **`detect_anomalies`** : Z-score = `(x - mean) / std` → NaN si std=0
4. **`generate_predictions`** : LinearRegression peut produire prédictions Inf en cas de fit pathologique
5. **`calculate_descriptive_stats` ligne 299** : `desc["std"]` est protégé par `if desc["std"] == desc["std"]` mais `q1, q3, iqr` ne le sont pas si dataset = 1 point

### Solution retenue
**Triple ceinture de sécurité** :

1. **Pré-validation** : skip pearsonr si variance = 0 sur l'une des deux séries (cas le plus fréquent en GE staging avec peu de données)
2. **Helper `_safe_float()`** : `lambda x: float(x) if (x is not None and np.isfinite(x)) else 0.0` — utilisé partout où on convertit numpy → float
3. **Sanitize JSON** : ajout d'un guard global au niveau du modèle Pydantic (mais inutile si pré-validation et safe_float bien posés)

### Pseudo-code

```python
# Helper en haut de la classe
@staticmethod
def _safe_float(x: Any, default: float = 0.0) -> float:
    """Convert numpy/scipy/pandas value to JSON-safe float (no NaN, no Inf)."""
    try:
        v = float(x)
        return v if np.isfinite(v) else default
    except (TypeError, ValueError):
        return default

# calculate_correlations - skip constant series
def calculate_correlations(self, df, columns):
    ...
    for i, col1 in enumerate(available_cols):
        for col2 in available_cols[i + 1:]:
            data1 = df[col1]; data2 = df[col2]
            mask = ~(data1.isna() | data2.isna())
            if mask.sum() < 3: continue

            v1 = data1[mask].values
            v2 = data2[mask].values

            # NEW: skip if either series is constant (pearsonr undefined)
            if np.std(v1) == 0 or np.std(v2) == 0:
                logger.debug(f"Skipping correlation {col1}/{col2}: constant series")
                continue

            try:
                coefficient, p_value = stats.pearsonr(v1, v2)
                coef = self._safe_float(coefficient, 0.0)
                p = self._safe_float(p_value, 1.0)
                results.append(CorrelationResult(
                    variable_1=col1, variable_2=col2,
                    coefficient=coef, p_value=p,
                    strength=self._interpret_correlation(coef),
                    is_significant=(p < 0.05 and coef != 0.0),
                ))
            except Exception as e:
                logger.warning(f"Correlation error for {col1}/{col2}: {e}")
```

### Application transverse (defense in depth)
- Remplacer tous les `float(x)` sur valeurs scipy/numpy par `self._safe_float(x)` dans :
  - `calculate_correlations` (déjà ci-dessus)
  - `calculate_descriptive_stats` (mean, median, std, min, max, q1, q3, iqr)
  - `analyze_trend` (slope, intercept, r_squared, slope_pct, projections)
  - `detect_anomalies` (z_score, expected_value, deviation_pct)
  - `generate_predictions` (predicted_value, lower_bound, upper_bound)

## Checklist d'implémentation

- [ ] 2.1 Ajouter helper `_safe_float()` static method
- [ ] 2.2 `calculate_correlations` :
  - [ ] skip si variance(v1)=0 ou variance(v2)=0
  - [ ] `_safe_float` sur coefficient et p_value
  - [ ] `is_significant` requiert coef ≠ 0
- [ ] 2.3 `calculate_descriptive_stats` : `_safe_float` partout
- [ ] 2.4 `analyze_trend` : `_safe_float` sur slope, intercept, r_squared, slope_pct, proj_7d, proj_30d
- [ ] 2.5 `detect_anomalies` : `_safe_float` sur value, expected, z_score, deviation_pct
- [ ] 2.6 `generate_predictions` : `_safe_float` sur predicted, upper, lower
- [ ] 2.7 Test syntaxe AST + py_compile
- [ ] 2.8 Critique de la phase
- [ ] 2.9 Commit local sémantique

## Tests post-deploy attendus

- `curl /api/v1/admin/service-requests/treasury/analytics/report?period=month&language=es` → 200 (pas 500) même avec données dégradées
- Frontend `/dashboard/agent/treasury/analytics` tab Reporte → charge sans "Error al cargar los datos analiticos"
- Si scope entité bug 1 reste pour l'instant (Phase 3) — c'est OK, ce n'est pas le sujet de cette phase

## Risques

- ⚠️ Régression sur les "vraies" correlations significatives : non, car le helper ne touche pas les valeurs valides finies.
- ⚠️ La signature publique de `generate_report` ne change pas → pas d'impact sur les callers externes (chatbot Analista IA, admin_routes).
- ✅ Pas de SQL touché → pas de risque BD.

## Hors scope explicite

- Filtre `entity_code` dans get_kpi_data → reporté à Phase 3 (Bug 1 global, qui touche aussi workload-dashboard, audit, anomalies).
