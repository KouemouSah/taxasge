# DÉCISION 001 : BASE DE DONNÉES - POSTGRESQL (VALIDÉE)

**ID :** DECISION_001
**Type :** Stratégique - Architecture Technique
**Priorité :** BLOQUANT
**Date :** 2025-10-23
**Décideur :** KOUEMOU SAH Jean Emac
**Statut :** ✅ **VALIDÉ ET FINALISÉ**

---

## ✅ DÉCISION FINALE

**Choix validé :** **PostgreSQL (Supabase) UNIQUEMENT**

**Citation décideur :**
> "[x] Option A : Je valide PostgreSQL (Supabase) uniquement → Supprimer Firestore"

**Date validation :** 2025-10-23

---

## 📋 JUSTIFICATION DÉCISION

### Pourquoi PostgreSQL

**✅ Avantages :**
1. **Schéma déjà développé :** 50+ tables, 1,038 lignes SQL
   - Source : `.github/docs-internal/database/schema_taxasge_declaration.sql`
2. **Backend déjà codé :** asyncpg intégré
   - Source : `packages/backend/app/config.py:45-60`
3. **Transactions ACID :** Paiements BANGE nécessitent garanties transactionnelles
4. **Requêtes complexes :** JOINs, aggregations, vues matérialisées possibles
5. **Coût prévisible :** $25/mois fixe (vs Firestore variable)
6. **ROI développement :** 0 réécriture nécessaire

### Pourquoi PAS Firestore

**❌ Inconvénients :**
1. Schéma PostgreSQL inutilisable → Refonte totale
2. Backend à réécrire complètement (asyncpg → firestore)
3. Pas de transactions complexes
4. Quotas gratuits insuffisants (50K reads/day épuisé rapidement)
5. Coût variable imprévisible

---

## 🎯 ACTIONS IMMÉDIATES

### Phase 0 - Jour 1-2 : Nettoyage Configuration

#### Action 1 : Supprimer Firestore
```bash
✅ Supprimer : firestore.rules
✅ Supprimer : firestore.indexes.json
✅ Modifier : firebase.json (retirer section firestore)
✅ Désactiver : Firestore dans console Firebase
```

#### Action 2 : Valider PostgreSQL Supabase
```bash
✅ Tester connexion Supabase
✅ Vérifier schéma tables chargé
✅ Tester query basique
✅ Configurer connection pooling
```

#### Action 3 : Configuration Production
```bash
✅ Backup automatique quotidien (Supabase)
✅ Row Level Security (RLS) activé
✅ Monitoring queries lentes
✅ Alertes storage > 80%
```

---

## 💰 BUDGET POSTGRESQL

### Coût Estimé

| Scénario | Stockage | Coût Mensuel |
|----------|----------|--------------|
| **MVP (100 users/jour)** | 1 GB | $25/mois |
| **Production (1K users/jour)** | 5 GB | $25/mois |
| **Scaling (5K users/jour)** | 20 GB | $25/mois |
| **Scaling (10K users/jour)** | 50 GB | $25/mois |

**Note :** Supabase Pro = $25/mois pour **jusqu'à 8 GB**, puis $0.125/GB supplémentaire

**Budget validé :** ✅ $25/mois inclus dans budget total $30-50/mois

---

## 📊 ARCHITECTURE TECHNIQUE FINALE

### Stack Database

```
Application : TaxasGE
├── Backend : FastAPI (Python 3.11)
├── Database : PostgreSQL 15 (Supabase)
├── ORM : asyncpg (connection pooling)
├── Migrations : Alembic (à configurer)
└── Backup : Supabase automated daily
```

### Connection String

```python
# packages/backend/app/config.py
DATABASE_URL = "postgresql://user:password@db.xxx.supabase.co:5432/postgres"

# Configuration pool
DB_POOL_MIN_SIZE = 5
DB_POOL_MAX_SIZE = 20
```

---

## 🔒 SÉCURITÉ & CONFORMITÉ

### Supabase Row Level Security (RLS)

**Activé pour tables sensibles :**
- `users` : User ne peut lire/modifier que ses propres données
- `tax_declarations` : User ne voit que ses déclarations
- `payments` : User ne voit que ses paiements
- `documents` : User ne voit que ses documents

**Exemple RLS Policy :**
```sql
-- Users peuvent lire uniquement leurs propres données
CREATE POLICY "Users can view own data"
ON users FOR SELECT
USING (auth.uid() = id);

-- Admins peuvent tout voir
CREATE POLICY "Admins can view all"
ON users FOR SELECT
USING (auth.jwt() ->> 'role' = 'admin');
```

### Backup & Recovery

**Stratégie :**
- Backup automatique quotidien (Supabase)
- Point-in-time recovery (PITR) : 7 jours
- Export manuel hebdomadaire (sécurité supplémentaire)

---

## ✅ VALIDATION TECHNIQUE

### Tests de Validation Phase 0

**Backend :**
- [ ] Connexion PostgreSQL réussie
- [ ] Pool de connexions configuré (5-20 connexions)
- [ ] Query test SELECT 1 OK
- [ ] Latency < 100ms (depuis Cloud Run)

**Schema :**
- [ ] 50+ tables chargées
- [ ] Contraintes FK validées
- [ ] Indexes créés
- [ ] Vues matérialisées (si applicable)

**Sécurité :**
- [ ] RLS activé sur tables sensibles
- [ ] Connection SSL obligatoire
- [ ] Credentials dans Secret Manager (pas .env)

---

## 📋 FIRESTORE SUPPRIMÉ

### Fichiers à Supprimer

```bash
# Phase 0 - Actions nettoyage
rm firestore.rules
rm firestore.indexes.json

# Modifier firebase.json (retirer lignes 84-86)
# Avant :
"firestore": {
  "rules": "firestore.rules",
  "indexes": "firestore.indexes.json"
}
# Supprimer cette section ↑
```

### Console Firebase

```
1. Aller sur console.firebase.google.com
2. Projet : taxasge-dev
3. Firestore Database
4. Désactiver (si déjà créé)
```

**Économie :** $0 (Firestore non utilisé)

---

## 🎯 IMPACT DÉCISION

### Positif

✅ **Coût prévisible :** $25/mois fixe
✅ **Développement accéléré :** Pas de réécriture
✅ **Qualité garantie :** Transactions ACID
✅ **Maintenance simplifiée :** 1 seule DB

### Négatif

⚠️ **Vendor lock-in :** Supabase (mitigé : PostgreSQL standard)
⚠️ **Scaling limite :** 8 GB inclus, puis payant

### Alternatives Futures (si scaling > 100K users/jour)

**Option migration future (si nécessaire) :**
- Cloud SQL (GCP) : PostgreSQL managé
- Self-hosted PostgreSQL : Contrôle total
- Supabase Enterprise : Support dédié

**Timeline migration :** 2026+ (si nécessaire)

---

## ✅ VALIDATION FINALE

**Statut :** ✅ **DÉCISION VALIDÉE ET FINALISÉE**

**Conditions remplies :**
- ✅ Décideur a confirmé explicitement
- ✅ Budget approuvé ($25/mois)
- ✅ Architecture technique validée
- ✅ Actions Phase 0 définies
- ✅ Tests validation identifiés

**Prochaine étape :** Exécution actions nettoyage Phase 0 (Jour 1-2)

---

**Décision enregistrée par :** Claude Code Expert IA
**Date :** 2025-10-23
**Validé par :** KOUEMOU SAH Jean Emac
**Statut final :** ✅ APPROUVÉ - Exécution autorisée
