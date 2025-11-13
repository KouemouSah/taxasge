# UC-FS-001 : Search Fiscal Services - Recherche Services Fiscaux

## 1. Métadonnées
- **ID** : UC-FS-001
- **Endpoint** : `GET /fiscal-services/search`
- **Méthode** : GET
- **Auth requise** : ❌ Non (catalogue public)
- **Priorité** : CRITIQUE
- **Statut implémentation** : ✅ IMPLÉMENTÉ (90%)
- **Acteurs** : Tous
- **Technologies** : PostgreSQL FTS, Redis Cache

## 2. Description Métier

### Contexte
**850 services fiscaux** organisés en :
- 14 ministères
- 16 secteurs  
- 105 catégories

### Objectif
Recherche multi-critères avec :
- Full-text search
- Filtres multiples
- Tri flexible
- Cache Redis
- Facettes
- Suggestions

### Workflow (13 étapes)
1. Request avec params
2. Validation
3. Generate cache key
4. Check Redis → HIT ou MISS
5. Build SQL query
6. Apply tri
7. Apply pagination
8. Execute query
9. Enrich results
10. Calculate facets
11. Suggestions si 0 résultat
12. Cache results (10min)
13. Return response

## 3. Given/When/Then

### Scénario 1 : Recherche Simple
```gherkin
Given 850 services
When q=impôt+revenu
Then 5 services trouvés, top: IR
```

### Scénario 2 : Filtres
```gherkin
Given ministry=Transport, max_amount=25000
Then 8 services <= 25k XAF
```

## 4. Requête HTTP
```http
GET /api/v1/fiscal-services/search?q=impôt&ministry=Finances
```

### Query Parameters
- `q` : Texte (min 2 chars)
- `ministry` : Nom ministère
- `min_amount`, `max_amount` : Range montants
- `for_role` : citizen, business, all
- `sort_by` : relevance, name, amount, popularity
- `page`, `limit` : Pagination
- `language` : fr, es

## 5. Réponse Succès
```json
{
  "success": true,
  "data": {
    "results": [...],
    "total_results": 45,
    "pagination": {...},
    "facets": {
      "ministries": [...],
      "sectors": [...],
      "amount_ranges": [...]
    }
  }
}
```

## 6. Erreurs

| Code | Message |
|------|---------|
| 400 | Query too short |
| 400 | Invalid limit |
| 422 | No services match |

## 7. Métriques

- **P50** : < 50ms
- **P95** : < 200ms  
- **Cache Hit** : > 80%
- **Success Rate** : 92%

## 8. KPIs

- Taux succès : 92%
- Top termes : impôt (25%), tva (15%)
- Utilisation filtres : 55%

## 9. Workflow
```
Request → Validate → Cache Check
→ SQL Query → Execute → Enrich
→ Facets → Cache → Response
```

---

**Catalogue** : 850 services, 14 ministères, 16 secteurs