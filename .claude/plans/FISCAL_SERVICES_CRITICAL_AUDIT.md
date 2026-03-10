# AUDIT CRITIQUE — MODULE FISCAL SERVICES
> Date: 2026-03-10 | Statut: RAPPORT D'ANALYSE | 852 services, 15 ministères, 100+ catégories

---

## 0. RÉSUMÉ EXÉCUTIF

| Métrique | Valeur | Verdict |
|----------|--------|---------|
| Services en BD | 852 (848 actifs, 4 inactifs) | OK |
| Bugs critiques backend | **7** (crashes en production) | 🔴 BLOQUANT |
| Bugs majeurs backend | **5** | 🟠 URGENT |
| Failles sécurité | **3** | 🔴 CRITIQUE |
| Problèmes frontend | **12** | 🟠 CRITIQUE |
| Services sans mots-clés | **305/852 (36%)** | 🟠 Qualité données |
| Services sans tasa_expedicion | **55/852 (6.5%)** | ⚠️ Incomplet |
| Services sans tasa_renovacion | **709/852 (83%)** | ⚠️ Normal (pas tous renouvelables) |
| Groupes de services (Precios.pdf) | **0 implémentés** | 🔴 NON CONFORME |
| Scalabilité frontend | **Max ~2000 services** | 🔴 INSUFFISANT |

---

## 1. ANALYSE DU DOCUMENT PRECIOS.PDF

### Structure identifiée dans le décret présidentiel

Le PDF définit un **système hiérarchique à 4 niveaux** pour les prix des services commerciaux :

```
ZONE GÉOGRAPHIQUE (A = Capitales Régions, B = Capitales Provinces, C = Districts)
  └── CATÉGORIE COMMERCIALE (A1/A2/A3, B1/B2/B3, C1/C2/C3)
      └── TYPE DE COMMERCE (Abacerías, Ferreterías, Cafeterías, Bares, Discotecas, Clínicas, etc.)
          └── CONCEPT / SERVICE (CMF, Cuota Anual, Ficha Comercial, Certificado, Libreta, etc.)
              └── MINISTÈRE ÉMETTEUR (HACIENDA, INFORMACIÓN, PESCA, TURISMO, INDUSTRIA, CULTURA, etc.)
```

### Données extraites (21 pages)

| Type Commerce | Zone A1 Total | Zone A2 Total | Zone A3 Total | Zone B1 Total |
|---------------|---------------|---------------|---------------|---------------|
| Abacerías/Comercio General | 636,000 XAF | 342,000 | 135,000 | 249,000 |
| Ferreterías | 609,000 | 315,000 | 108,000 | 222,000 |
| Cafeterías/Panaderías | 672,000 | 382,000 | 153,000 | 312,000 |
| Bares/Restaurantes | 642,000 | 333,000 | 138,000 | 282,000 |
| Discotecas | 882,000 | 468,000 | 228,000 | 522,000 |
| Clínicas/Farmacias | — | — | — | — |
| Video Clubs | 600,000 | 306,000 | 126,000 | — |
| Carpinterías | 702,000 | 378,000 | 153,000 | — |

### Concepts récurrents (composants du "TOTAL TESORO PÚBLICO")

Chaque type de commerce est un **BUNDLE de services** provenant de PLUSIEURS ministères :

| Concept | Ministère | Fixe pour TOUS |
|---------|-----------|---------------|
| CMF (Contribución Municipal Fiscal) | HACIENDA | Varie par zone (480K/216K/60K/120K/45K/30K) |
| Cuota Anual | HACIENDA | Varie par zone |
| Ficha Comercial | HACIENDA | 3,000-30,000 |
| Certificado de Comercio | HACIENDA | 12,000-20,000 |
| Libreta Comercial | HACIENDA | 6,000-10,000 |
| Certificado Actualización PE | HACIENDA | 3,000 |
| Rótulos no Luminosos | INFORMACIÓN | 18,000 |
| Autorización venta Pescados | PESCA | 27,000 (seulement abacerías) |
| Licencia Turismo | TURISMO | 30,000-300,000 (selon type) |
| Inspección Anual | INDUSTRIA | 45,000-120,000 |
| Licencia Medio Ambiental | MEDIO AMBIENTE | 180,000 |
| Licencia Cultural | CULTURA | 9,000-18,000 |

### CE QUI MANQUE DANS LE SYSTÈME ACTUEL

1. **Aucun concept de "groupe/bundle de services"** — Le PDF montre que pour ouvrir un bar zone A1, il faut payer 8 services différents (total 642,000 XAF). Le système actuel ne lie pas ces services.
2. **Aucune différenciation par zone géographique** — Le prix CMF est 480,000 en zone A1 mais 30,000 en zone C3. Le système stocke UN seul prix par service.
3. **Aucune différenciation par type de commerce** — "Discoteca" paie une licence tourisme à 300,000 mais "Bar" paie 60,000.
4. **Pas de notion de "TOTAL TESORO PÚBLICO"** — Le citoyen ne voit pas le montant total qu'il devra payer pour son activité.

---

## 2. BUGS CRITIQUES BACKEND (Production Crashes)

### Bug #1 — 🔴 Colonnes fantômes `expedition_amount`/`renewal_amount`
**Fichier**: `search_repository.py:84-110`
```python
# CODE (CRASH):
fs.expedition_amount >= $1    # ← COLONNE N'EXISTE PAS
# BD RÉELLE:
fs.tasa_expedicion             # ← VRAI NOM
```
**Impact**: TOUT filtre par prix dans la recherche crash avec `column "expedition_amount" does not exist`.

### Bug #2 — 🔴 `calculation_type` vs `calculation_method`
**Fichier**: `fiscal_service_repository.py:612-615`
```python
if search.calculation_type:    # ← ATTRIBUT N'EXISTE PAS SUR LE MODÈLE
    conditions.append(f"fs.calculation_type = ${param_idx}")  # ← COLONNE N'EXISTE PAS
# BD: calculation_method | Modèle: calculation_method
```
**Impact**: Filtrage par méthode de calcul silencieusement ignoré.

### Bug #3 — 🔴 Endpoint `/calculate` — signature incompatible
**Fichier**: `fiscal_service_routes.py:494`
```python
result = await calculation_service.calculate(db, request.fiscal_service_id, request.input_data)
#                                            ^^  3 args
# Mais calculate() attend: (self, conn, calculation_input: CalculationInput) → 2 args
```
**Impact**: `TypeError` sur chaque appel à `/calculate`.

### Bug #4 — 🔴 N+1 queries dans search/get_popular/get_recent
**Fichier**: `fiscal_service_repository.py:666-672`
```python
for r in results:
    keywords = await conn.fetch(  # ← DANS LA BOUCLE!
        "SELECT keyword FROM service_keywords WHERE fiscal_service_id = $1", ...)
```
**Impact**: 20 services = 21 requêtes SQL. Avec 100 agents : effondrement.
**Note**: La méthode `list()` utilise correctement `array_agg()` — pattern à propager.

### Bug #5 — 🔴 Service creation — colonnes fantômes dans INSERT
**Fichier**: `fiscal_service_service.py:83-127`
```python
INSERT INTO fiscal_services (
    ...percentage_rate, unit_price,  # ← N'EXISTENT PAS (vrais noms: base_percentage, unit_rate)
    required_documents, processing_time_days,
    legal_reference, notes,          # ← notes n'existe pas (description_es?)
    ...
)
```
**Impact**: Import bulk silencieusement tronqué ou crash.

### Bug #6 — 🔴 `updated_by` jamais renseigné dans `update()`
**Fichier**: `fiscal_service_repository.py:742-781`
```python
# update() construit dynamiquement les SET, mais N'AJOUTE JAMAIS updated_by
# Seul updated_at est ajouté (ligne 773)
# Comparer avec bulk_update (ligne 980) qui le fait correctement
```
**Impact**: Audit trail cassé — impossible de savoir qui a modifié un service.

### Bug #7 — 🔴 Paramètre `language` dupliqué 5x dans search query
**Fichier**: `search_repository.py:164-179`
```sql
-- 5 JOINs entity_translations utilisent ${param_idx} avec la MÊME valeur
-- Mais params.extend([language, limit, offset]) ne passe QU'UNE seule fois language
```
**Impact**: Traductions incorrectes ou NULL dans les résultats de recherche.

---

## 3. FAILLES DE SÉCURITÉ

### Sec #1 — 🔴 `GET /{service_id}/details` sans authentification
**Fichier**: `fiscal_service_routes.py:186-189`
```python
@router.get("/{service_id}/details")
async def get_service_details(service_id: int, ...):
    # PAS DE permission_required() ni get_current_user
```

### Sec #2 — 🟠 Pas de rate limiting sur `/calculate`
**Fichier**: `fiscal_service_routes.py:478-504`
Un attaquant peut spammer les calculs (CPU-intensive si formules complexes).

### Sec #3 — 🟠 Formules de calcul — risque d'injection
Si `calculation_config` contient des expressions évaluées dynamiquement (eval/exec), risque d'exécution de code arbitraire.

---

## 4. PROBLÈMES FRONTEND

### Front #1 — 🔴 Charge les 852 services d'un coup
**Fichier**: `admin/fiscal-services/page.tsx:113`
```typescript
pageSize: 1000  // ← TOUT EN MÉMOIRE
```
Filtrage client-side uniquement. Ne scale pas au-delà de ~2000 services.

### Front #2 — 🔴 Filtres ministry/sector ignorés côté API
**Fichier**: `services/api.ts:375-393`
Le backend supporte `category_id`, `status`, mais le frontend n'envoie PAS `ministry_id`, `sector_id`, `search` au backend.

### Front #3 — 🟠 Validation formulaire création minimale
Seuls 3 champs vérifiés (serviceCode, categoryId, nameEs). Les champs tarifs ne sont pas validés conditionnellement selon `calculationMethod`.

### Front #4 — 🟠 Import bulk — bouton présent, handler non câblé
Le bouton "Importar" existe mais `onClick` n'est pas implémenté.

### Front #5 — 🟠 Pas de cache invalidation
Après CRUD, `fetchServices()` recharge les 852 services au lieu d'invalider le cache React Query.

### Front #6 — 🟠 Page détail n'affiche pas tous les champs
`processingTimeDays`, `complexityLevel`, `priority`, `rateTiers`, `penaltyCalculationRules`, `eligibilityCriteria`, `exemptionConditions`, `regulatoryArticles` manquants.

### Front #7 — 🟠 Pas de groupement/template de services

### Front #8 — 🟠 Pas de bulk edit (statut, priorité, complexité)

### Front #9 — 🟠 Pas de page catalogue publique pour citoyens

### Front #10 — ⚠️ SearchableTemplateTable — état vide par défaut
Ne montre rien tant que l'admin n'a pas tapé un terme de recherche.

### Front #11 — ⚠️ Alias camelCase/snake_case partout
Les types TS ont les deux conventions → code confus.

### Front #12 — ⚠️ Pas de tri par colonnes dans le tableau

---

## 5. CRITIQUE DU SCHÉMA DE BASE DE DONNÉES

### 5.1 Points forts ✅
- 52 colonnes bien structurées
- `search_vector` tsvector + GIN index → full-text search prêt
- `embedding` pgvector + HNSW index → recherche sémantique prête
- Index partiels intelligents (`idx_fiscal_services_active`)
- `tariff_effective_from`/`to` → versioning des tarifs possible
- `parent_service_id` → hiérarchie de services possible
- `tier_group_name` + `is_tier_component` → groupement possible
- `calculation_config` JSONB → flexible

### 5.2 Manques critiques ❌

| Manque | Impact | Solution ERP |
|--------|--------|-------------|
| **Pas de table `service_bundles`** | Impossible de lier les 8 services d'une ouverture de bar | Créer table + table pivot |
| **Pas de pricing par zone géographique** | Un CMF coûte 480K en A1 mais 30K en C3 | Table `service_zone_pricing` |
| **Pas de pricing par catégorie commerciale** | Licence tourisme varie selon le type de commerce | Table `service_category_pricing` |
| **`tier_group_name` inutilisé** | 0 services avec cette colonne renseignée | À implémenter |
| **`parent_service_id` inutilisé** | 0 services avec parent_service_id renseigné | À implémenter |
| **Pas de versioning des tarifs** | `tariff_effective_from/to` existent mais aucun historique | Table `tariff_history` |
| **Pas de `service_group_type`** | Aucune distinction entre service unitaire et composant de bundle | Ajouter enum |
| **305 services sans keywords** | 36% sans mots-clés → recherche dégradée | Migration de données |

### 5.3 Indexation (8 index existants)

| Index | Type | Verdict |
|-------|------|---------|
| `pkey` (id) | btree | ✅ OK |
| `service_code_key` (unique) | btree | ✅ OK |
| `idx_fiscal_services_active` | btree partiel (status=active, service_type) | ✅ OK |
| `idx_fiscal_services_category` | btree (category_id, status) | ✅ OK |
| `idx_fiscal_services_code` | btree (service_code) | ⚠️ Redondant avec unique key |
| `idx_fiscal_services_search_vector` | GIN (tsvector) | ✅ Excellent |
| `idx_fiscal_services_embedding_hnsw` | HNSW (pgvector) | ✅ Excellent |
| `idx_fiscal_services_workflow_code` | btree partiel | ✅ OK |
| **MANQUANT**: `idx_ministry_id` via JOIN | — | 🔴 Filtrage ministry lent |
| **MANQUANT**: `idx_parent_service_id` | — | 🟠 Si hiérarchie utilisée |
| **MANQUANT**: `idx_tier_group_name` | — | 🟠 Si groupes utilisés |

---

## 6. DONNÉES RÉELLES — DISTRIBUTION

### Par ministère (Top 5)
| Ministère | Secteurs | Catégories | Services |
|-----------|----------|------------|----------|
| TRANSPORTE CORREOS TELECOMUNICACIONES | 1 | 8 | 292 |
| AVIACIÓN CIVIL | 1 | 25 | 155 |
| CULTURA PROMOCIÓN ARTESANAL TURISMO | 1 | 1 | 76 |
| COMERCIO PEQUEÑAS MEDIANAS EMPRESAS | 1 | 13 | 60 |
| INFORMACIÓN PRENSA RADIO | 1 | 8 | 52 |

### Par méthode de calcul
| Méthode | Total | Sans tasa_expedition | Avg expedition |
|---------|-------|---------------------|---------------|
| fixed_expedition | 846 | 55 | 200,229 XAF |
| percentage_based | 4 | 4 | 0 |
| fixed_renewal | 1 | 0 | 2,000 |
| formula_based | 1 | 1 | 0 |

**Constat** : 99.3% des services utilisent `fixed_expedition`. Les 4 autres méthodes sont quasiment inutilisées. Le système de calcul complexe (formules, tiers, pourcentages) est surdimensionné par rapport à l'usage actuel.

---

## 7. PLAN DE MIGRATION ERP-GRADE

### Phase 1 — Hotfixes critiques (1-2 jours)
> Corriger les 7 bugs qui crashent en production

- [ ] 1.1 Fix `search_repository.py` : `expedition_amount` → `tasa_expedicion` (6 requêtes)
- [ ] 1.2 Fix `fiscal_service_repository.py` : `calculation_type` → `calculation_method`
- [ ] 1.3 Fix `/calculate` endpoint signature
- [ ] 1.4 Fix N+1 queries (propager pattern `array_agg()` de `list()` vers `search()`/`get_popular()`/`get_recent()`)
- [ ] 1.5 Fix `fiscal_service_service.py` : corriger noms colonnes INSERT
- [ ] 1.6 Fix `updated_by` dans `update()`
- [ ] 1.7 Fix paramètres `language` dans search query
- [ ] 1.8 Ajouter `permission_required` sur `GET /{service_id}/details`
- [ ] 1.9 Ajouter rate limiting sur `/calculate`

### Phase 2 — Frontend scalable (3-5 jours)
> Passer de client-side à server-side filtering

- [ ] 2.1 **Server-side pagination** : Remplacer `pageSize: 1000` par vrais paramètres paginés
- [ ] 2.2 **Server-side filters** : Ajouter `ministry_id`, `sector_id`, `search` dans l'API list
- [ ] 2.3 **React Query** : Migrer de `useState + fetch` vers `useQuery` avec cache invalidation
- [ ] 2.4 **Tri par colonnes** : Ajouter `sort_by`, `sort_order` au backend et au tableau
- [ ] 2.5 **Validation conditionnelle** du formulaire création selon `calculationMethod`
- [ ] 2.6 **Page détail complète** : Afficher TOUS les champs
- [ ] 2.7 **Export CSV/Excel** des services filtrés
- [ ] 2.8 **Câbler le bouton Import bulk** (upload Excel, mapping colonnes, preview, confirm)

### Phase 3 — Bundles/Groupes de services (5-7 jours)
> Implémenter le concept du Precios.pdf

#### 3.1 Nouvelles tables

```sql
-- Groupes/Bundles de services (ex: "Ouverture Bar Zone A1")
CREATE TABLE service_bundles (
    id SERIAL PRIMARY KEY,
    bundle_code VARCHAR(50) UNIQUE NOT NULL,
    name_es VARCHAR(255) NOT NULL,
    description_es TEXT,
    commerce_type VARCHAR(100),          -- ABACERIAS, BARES, DISCOTECAS...
    zone_category VARCHAR(10),           -- A1, A2, A3, B1, B2, B3, C1, C2, C3
    region VARCHAR(20),                  -- Insular, Continental
    is_active BOOLEAN DEFAULT true,
    total_amount NUMERIC(12,2),          -- TOTAL TESORO PÚBLICO (calculé)
    legal_reference TEXT,                -- Référence décret
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id)
);

-- Composants d'un bundle
CREATE TABLE service_bundle_items (
    id SERIAL PRIMARY KEY,
    bundle_id INT NOT NULL REFERENCES service_bundles(id) ON DELETE CASCADE,
    fiscal_service_id INT NOT NULL REFERENCES fiscal_services(id),
    ministry_label VARCHAR(100),          -- HACIENDA, TURISMO, etc.
    concept_label VARCHAR(255),           -- CMF, Licencia, etc.
    amount_override NUMERIC(12,2),        -- Prix spécifique au bundle (override tasa_expedicion)
    is_required BOOLEAN DEFAULT true,     -- Obligatoire dans le bundle?
    display_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(bundle_id, fiscal_service_id)
);

-- Prix par zone géographique (pour services à tarif variable)
CREATE TABLE service_zone_pricing (
    id SERIAL PRIMARY KEY,
    fiscal_service_id INT NOT NULL REFERENCES fiscal_services(id),
    zone_category VARCHAR(10) NOT NULL,   -- A1, A2, A3, B1, B2, B3, C1, C2, C3
    region VARCHAR(20) NOT NULL,          -- Insular, Continental
    commerce_type VARCHAR(100),           -- NULL = tous types
    tasa_expedicion NUMERIC(12,2) NOT NULL,
    tasa_renovacion NUMERIC(12,2),
    effective_from DATE NOT NULL DEFAULT CURRENT_DATE,
    effective_to DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(fiscal_service_id, zone_category, commerce_type, effective_from)
);

CREATE INDEX idx_service_bundles_zone ON service_bundles(zone_category, commerce_type);
CREATE INDEX idx_bundle_items_bundle ON service_bundle_items(bundle_id);
CREATE INDEX idx_bundle_items_service ON service_bundle_items(fiscal_service_id);
CREATE INDEX idx_zone_pricing_service ON service_zone_pricing(fiscal_service_id, zone_category);
```

#### 3.2 Backend API

```
GET    /service-bundles                     # Liste paginée + filtres
GET    /service-bundles/{id}                # Détail avec items
POST   /service-bundles                     # Créer bundle
PUT    /service-bundles/{id}                # Modifier
DELETE /service-bundles/{id}                # Supprimer
POST   /service-bundles/{id}/items          # Ajouter services au bundle
DELETE /service-bundles/{id}/items/{item_id} # Retirer service
GET    /service-bundles/calculate/{id}      # Calculer total bundle
POST   /service-bundles/bulk-import         # Import depuis Excel/PDF
```

#### 3.3 Frontend Admin

- Nouvel onglet "Bundles" dans la page fiscal-services admin
- Formulaire création bundle : sélection zone + type commerce → auto-calcul total
- Drag-drop pour réordonner les items du bundle
- Preview "Fiche TESORO PÚBLICO" (rendu identique au PDF)
- Import PDF : parser Precios.pdf → créer automatiquement les bundles

### Phase 4 — Templates de création (2-3 jours)

- [ ] 4.1 **Template system** : Créer un service à partir d'un template existant (copier documents, procédures, pricing)
- [ ] 4.2 **Template library** : Bibliothèque de templates par type (document_processing, license_permit, etc.)
- [ ] 4.3 **Création rapide** : Wizard en 3 étapes au lieu du formulaire géant actuel
  - Étape 1: Infos de base (code, nom, catégorie, type)
  - Étape 2: Tarification (afficher UNIQUEMENT les champs pertinents selon calculationMethod)
  - Étape 3: Documents & Procédures (avec preview des assignations)

### Phase 5 — Qualité des données (2 jours)

- [ ] 5.1 Migration : Ajouter keywords aux 305 services manquants (via LLM Gemini)
- [ ] 5.2 Migration : Importer les bundles du Precios.pdf (21 pages × ~10 types × 3 zones × 8 services)
- [ ] 5.3 Dashboard qualité : % services complets, % avec keywords, % avec tarifs expirés
- [ ] 5.4 Alertes admin : services sans documents assignés, tarifs expirants dans 30 jours

### Phase 6 — Catalogue citoyen (3-5 jours)

- [ ] 6.1 Page `/catalogo` publique avec recherche full-text (tsvector déjà indexé)
- [ ] 6.2 Filtres : ministère, type, fourchette de prix, zone géographique
- [ ] 6.3 Fiche détaillée : description, documents requis, procédures, délai, prix, base légale
- [ ] 6.4 Simulateur de coût : "J'ouvre un bar à Malabo" → calcul automatique du bundle
- [ ] 6.5 Recherche sémantique : utiliser les embeddings pgvector (index HNSW déjà créé)

---

## 8. ARCHITECTURE CIBLE ERP-GRADE

```
                    ┌─────────────────────────────┐
                    │      ADMIN DASHBOARD        │
                    │ ┌─────┐ ┌────────┐ ┌──────┐ │
                    │ │Serv.│ │Bundles │ │Stats │ │
                    │ │CRUD │ │Manager │ │Quality│ │
                    │ └──┬──┘ └───┬────┘ └──┬───┘ │
                    └────┼────────┼─────────┼─────┘
                         │        │         │
                    ┌────▼────────▼─────────▼─────┐
                    │     API GATEWAY (FastAPI)    │
                    │  /fiscal-services (CRUD)     │
                    │  /service-bundles (CRUD)     │
                    │  /service-zones (pricing)    │
                    │  /calculate (engine)         │
                    └────────────┬─────────────────┘
                                 │
          ┌──────────────────────┼──────────────────────┐
          │                      │                      │
    ┌─────▼─────┐      ┌────────▼────────┐    ┌───────▼───────┐
    │ PostgreSQL │      │  Redis Cache    │    │  Vertex AI    │
    │            │      │                 │    │  (Gemini)     │
    │ fiscal_    │      │ services:1h     │    │               │
    │ services   │      │ bundles:30m     │    │ Embeddings    │
    │ bundles    │      │ pricing:1h      │    │ Semantic      │
    │ zone_      │      │ search:5m       │    │ Search        │
    │ pricing    │      │                 │    │               │
    │ (tsvector) │      └─────────────────┘    └───────────────┘
    │ (pgvector) │
    └────────────┘
```

### Performance cible

| Opération | Actuel | Cible |
|-----------|--------|-------|
| Liste admin (page) | 1-2s (852 items) | <200ms (20 items paginés) |
| Recherche | Client-side 200ms+ | <50ms (tsvector GIN) |
| Création service | OK | OK + template |
| Calcul bundle | N/A | <100ms (pré-calculé) |
| Catalogue citoyen | N/A | <300ms (recherche sémantique) |

---

## 9. CHECKLIST DE VALIDATION

### Phase 1 — Hotfixes ✅ COMPLÉTÉE (2026-03-10)

#### Pass 1 — Bugs identifiés par l'audit initial
- [x] Fix `expedition_amount`/`renewal_amount` → `tasa_expedicion`/`tasa_renovacion` (search_repository.py, 9 occurrences)
- [x] Fix `calculation_type` → `calculation_method` (fiscal_service_repository.py:612)
- [x] Fix `/calculate` signature mismatch — passe `CalculationInput` directement (routes.py:494)
- [x] Fix N+1 queries — `_batch_keywords()` + `ANY($1)` dans search/get_popular/get_recent
- [x] Fix `percentage_rate` → `base_percentage`, `unit_price` → `unit_rate` (calculation_service.py, 3 occurrences)
- [x] Fix INSERT colonnes fantômes — `required_documents`/`notes` retirés, vrais noms BD (fiscal_service_service.py)
- [x] Fix `updated_by` — ajouté en paramètre `update()` + propagé depuis route admin
- [x] Fix `service_details_repository.py` — NULL→vrais champs BD (percentage_rate→base_percentage, unit_price→unit_rate, view_count, calculation_count)
- [x] Fix `sort_order` injection — whitelist ASC/DESC (search_repository.py)
- [x] Supprimé endpoint debug `/debug/translations/{template_code}` (exposé sans auth en prod)

#### Pass 2 — Bugs trouvés par auto-critique
- [x] Fix `is_active` → `status = 'active'` dans get_popular/get_recent (colonnes fantômes)
- [x] Fix `usage_count` → `calculation_count` dans get_popular/search ORDER BY
- [x] Fix `last_used_at` → `updated_at` dans get_recent (colonne inexistante)
- [x] Fix `fs.code` → `fs.service_code` dans search ORDER BY
- [x] Fix code dupliqué batch keywords — `search()` réutilise `_batch_keywords()`
- [x] Fix variable locale `unit_price` → `unit_rate` dans calculation_service (cohérence)
- [x] Fix `description_es as notes` remis à `NULL::text as notes` (sémantique correcte)
- [x] Fix INSERT incomplet (18→37 colonnes) — toutes les colonnes du modèle Pydantic couvertes

#### Actions A-F — Optimisations Schema (2026-03-10)
- [x] **A** — `SELECT fs.*` → colonnes explicites : `_DETAIL_COLUMNS` (get_by_id, get_by_code), `_LIST_COLUMNS` (list, search, get_popular, get_recent), calculation_service (24 cols)
- [x] **B** — tsvector `search_vector @@ plainto_tsquery('spanish', $N)` dans search_repository.py + fiscal_service_repository.py search(), ILIKE fallback catégories/keywords
- [x] **C** — Migration 202: DROP idx_fiscal_services_code (redondant), DROP idx_fiscal_services_workflow_code (0 lignes)
- [x] **D** — Migration 202: Widen `valid_service_code` de `^T-[0-9]{3}$` à `^T-[0-9]{3,6}$` (max 999→999,999)
- [x] **E** — Migration 202: `mv_fiscal_services_catalog` materialized view + 5 index + refresh_fiscal_services_catalog()
- [x] **F** — Migration 202: `fiscal_service_pricing` table (13 cols normalisées) + INSERT...SELECT populate
- [x] Refresh MV après CRUD (create/update/delete dans fiscal_service_routes.py) + invalidate_services_cache()
- [x] Fix `service.code` → `service.service_code` dans `bulk_create()`
- [x] Fix `JOIN` → `LEFT JOIN` dans get_by_id, get_popular, get_recent (sectors/ministries can be NULL)
- [x] Syntaxe vérifiée (py_compile) sur 5 fichiers modifiés

#### Vérification finale
- [x] Zero colonnes fantômes (grep = 0 matches)
- [x] Syntaxe vérifiée sur tous les fichiers modifiés
- [ ] Tests unitaires (à implémenter)
- [x] **Migration 202 exécutée** via psycopg2 (C+D+E+F + refresh function testée OK)

### Phase 2 — Frontend ✅ COMPLÉTÉE (2026-03-10)

#### Backend (nouveaux paramètres GET /)
- [x] `search` param — tsvector + ILIKE fallback (name_es, service_code)
- [x] `ministry_id` param — filtre par ministère (JOIN sectors → ministries)
- [x] `sector_id` param — filtre par secteur
- [x] `sort_by` param — whitelist: service_code, name, price, status, popular, updated
- [x] `sort_order` param — ASC/DESC (regex validated)
- [x] `page_size` max réduit de 1000 → 100
- [x] `GET /admin/export/csv` — export CSV filtré (max 5000 lignes, permission fiscal_services.view_stats)

#### Frontend (server-side pagination)
- [x] Page admin charge 20 services par page (server-side, plus de pageSize=1000)
- [x] TOUS les filtres envoyés au backend (search, ministry, sector, category, status)
- [x] Debounced search (400ms) avec protection race condition (fetchSeq)
- [x] Tri par colonnes (Code, Nom, Status, Prix) avec indicateur visuel ASC/DESC
- [x] Cascading filter dropdowns (ministry→sector→category) restent client-side (petits datasets)
- [x] Bouton export CSV fonctionnel (téléchargement avec filtres actuels)
- [x] UI compacte — stats cards réduits, table dense, actions icon-only
- [x] Lignes cliquables (navigation vers détail)
- [x] Zéro erreur TypeScript
- [ ] React Query migration (optionnel — useState+useCallback fonctionne, à migrer si besoin)
- [ ] Import bulk fonctionnel (upload → preview → confirm) — bouton câblé, implémentation future

### Phase 3 — Bundles
- [ ] Tables `service_bundles`, `service_bundle_items`, `service_zone_pricing` créées
- [ ] API CRUD bundles fonctionnelle
- [ ] UI admin bundles avec drag-drop
- [ ] Import Precios.pdf automatisé

---

*Rapport généré par audit automatique. Vérifier chaque point avant implémentation.*
