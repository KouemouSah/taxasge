# DÉCISION 003 : BUDGET MENSUEL - $30-50/MOIS

**ID :** DECISION_003
**Type :** Stratégique - Budget & Coûts
**Priorité :** HAUTE
**Date :** 2025-10-23
**Décideur :** KOUEMOU SAH Jean Emac
**Statut :** ✅ VALIDÉ

---

## 🎯 CONTEXTE DÉCISION

### Hypothèse Initiale
> "Je veux utiliser pour le lancement des options totalement gratuites de Google Cloud et Firebase."

### Analyse Réalité

**Conclusion :** ❌ **Impossible de rester 100% gratuit en production**

**Raisons :**
1. Cloud Vision API : 1,000 units/mois gratuit = ~16 documents/jour MAX
2. Firestore : 50K reads/day épuisé en 2-3 heures si 100+ users actifs
3. Supabase PostgreSQL : 500 MB gratuit, projet estimé 2-5 GB

---

## 💰 ESTIMATION DÉTAILLÉE COÛTS

### Scénario 1 : MVP (100 users actifs/jour)

| Service | Usage Estimé | Quota Gratuit | Dépassement | Coût Mensuel |
|---------|--------------|---------------|-------------|--------------|
| **Cloud Run** | 200K req/mois | 2M req/mois | ✅ OK | $0 |
| **Supabase PostgreSQL** | 1 GB | 500 MB | ❌ Dépassé | $25/mois |
| **Firebase Storage** | 3 GB documents | 5 GB | ✅ OK | $0 |
| **Google Vision API** | 2,000 units/mois | 1,000 units | ⚠️ Dépassé | $1.50/mois |
| **Firebase Hosting** | 2 GB transfert | 10 GB | ✅ OK | $0 |
| **Cloud Build** | 10 builds/mois | 120 builds/day | ✅ OK | $0 |
| **TOTAL MVP** | - | - | - | **~$27/mois** |

### Scénario 2 : Production (1,000 users actifs/jour)

| Service | Usage Estimé | Quota Gratuit | Dépassement | Coût Mensuel |
|---------|--------------|---------------|-------------|--------------|
| **Cloud Run** | 1M req/mois | 2M req/mois | ✅ OK | $0 |
| **Supabase PostgreSQL** | 5 GB | 500 MB | ❌ Dépassé | $25/mois |
| **Firebase Storage** | 15 GB documents | 5 GB | ❌ Dépassé | $2.60/mois |
| **Google Vision API** | 10,000 units/mois | 1,000 units | ❌ Dépassé | $13.50/mois |
| **Firebase Hosting** | 8 GB transfert | 10 GB | ✅ OK | $0 |
| **TOTAL Production** | - | - | - | **~$41/mois** |

### Scénario 3 : Scaling (5,000 users actifs/jour)

| Service | Usage Estimé | Coût Mensuel |
|---------|--------------|--------------|
| **Cloud Run** | 5M req/mois | $15/mois |
| **Supabase PostgreSQL** | 20 GB | $25/mois (fixe) |
| **Firebase Storage** | 50 GB | $13/mois |
| **Google Vision API** | 50K units/mois | $75/mois |
| **Firebase Hosting** | 30 GB | $5/mois |
| **TOTAL Scaling** | - | **~$133/mois** |

---

## ✅ DÉCISION PRISE

**Choix :** Budget **$30-50/mois** validé

**Citation décideur :**
> "Je valide le budget mensuel"

---

## 📊 PLAN BUDGET PROGRESSIF

### Phase 0-1 : Développement (Semaines 1-8)
```
Environnement : Dev/Staging uniquement
Coût : ~$15-20/mois (usage minimal)
```

### Phase 2 : MVP Production (Semaines 9-12)
```
Utilisateurs : 50-100/jour
Coût : ~$27-30/mois
```

### Phase 3 : Production Stable (Mois 4-6)
```
Utilisateurs : 500-1,000/jour
Coût : ~$40-50/mois
```

### Phase 4 : Scaling (Mois 7+)
```
Utilisateurs : 2,000-5,000/jour
Coût : ~$80-150/mois
```

---

## 🚨 ALERTES BUDGET RECOMMANDÉES

### Configuration GCP Budget Alerts

**Alerte 1 : Seuil 50%**
```
Budget mensuel : $50
Alerte à : $25 (50%)
Action : Email notification
```

**Alerte 2 : Seuil 80%**
```
Budget mensuel : $50
Alerte à : $40 (80%)
Action : Email + SMS
```

**Alerte 3 : Seuil 100%**
```
Budget mensuel : $50
Alerte à : $50 (100%)
Action : Email + SMS + Review urgent
```

**Alerte 4 : Dépassement**
```
Budget mensuel : $50
Alerte à : $60 (120%)
Action : Désactivation auto services non-critiques
```

---

## 💡 OPTIMISATIONS COÛTS

### Optimisation 1 : OCR Hybride
**Économie estimée :** $5-10/mois

```
Stratégie :
1. Tesseract OCR (gratuit) en priorité
2. Google Vision seulement si confidence Tesseract < 70%
3. Économie : 60-70% requêtes Vision API
```

### Optimisation 2 : Caching Agressif
**Économie estimée :** $2-5/mois

```
Stratégie :
1. Cache catalogue fiscal services (Redis)
2. Cache résultats OCR (PostgreSQL)
3. Réduction 30% requêtes database
```

### Optimisation 3 : Storage Lifecycle
**Économie estimée :** $1-3/mois

```
Stratégie :
1. Documents > 90 jours → Nearline Storage ($0.01/GB)
2. Documents > 1 an → Coldline Storage ($0.004/GB)
3. Économie : 50% coûts storage
```

**Total économies potentielles :** $8-18/mois

---

## 📋 SUIVI BUDGET

### Métriques à Tracker

| Métrique | Fréquence | Alerte Si |
|----------|-----------|-----------|
| Coût total mensuel | Quotidienne | > $50 |
| Coût par user actif | Hebdomadaire | > $0.05/user |
| Vision API usage | Quotidienne | > 300 units/jour |
| Database size | Hebdomadaire | > 80% quota |
| Storage size | Hebdomadaire | > 80% quota |

### Rapports Budget

**Hebdomadaire :**
- Coût 7 derniers jours
- Projection fin de mois
- Top 3 services coûteux

**Mensuel :**
- Coût total mois
- Comparaison mois précédent
- ROI (coût / users actifs)
- Recommandations optimisation

---

## ✅ VALIDATION FINALE

**Statut :** ✅ **VALIDÉ**

**Budget approuvé :**
- MVP : $30/mois
- Production (1K users/jour) : $50/mois
- Scaling (5K users/jour) : $150/mois (révision nécessaire)

**Conditions :**
- ✅ Alertes budget configurées
- ✅ Review mensuel coûts obligatoire
- ✅ Optimisations appliquées progressivement

---

**Décision enregistrée par :** Claude Code Expert IA
**Date :** 2025-10-23
**Validé par :** KOUEMOU SAH Jean Emac
