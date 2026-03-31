# AUDIT MULTILINGUE COMPLET - APPLICATION FACIL
> Date: 2026-03-31 | Auditeur: Claude Opus 4.6 | Statut: RAPPORT CRITIQUE v2

## 1. RESUME EXECUTIF

L'infrastructure i18n de Facil est **architecturalement solide** ET les donnees de traduction sont **massivement presentes en BD** (8,536 entity_translations + 2,967 system translations). Cependant, le code frontend et backend **ne consomme pas correctement ces traductions**, resultant en un melange de langues visible par les utilisateurs.

**Le probleme n'est PAS un manque de donnees. C'est un manque de CABLAGE entre les donnees et l'affichage.**

### Chiffres cles

**Base de donnees — Traductions disponibles:**
| Table | Contenu | Couverture |
|-------|---------|------------|
| `entity_translations` | **8,536 entrees** (FR+EN) | 7 types d'entites |
| `translations` | **2,967 entrees** (ES+FR+EN) | 37 categories |

**entity_translations — Couverture par type:**
| Entity Type | FR | EN | Total source | Couverture |
|---|---|---|---|---|
| ministry | 18 | 18 | 21 | **86%** |
| sector | 19 | 19 | ~20 | **~95%** |
| category | 98 | 98 | 100 | **98%** |
| service | 852 | 852 | 869 active | **98%** |
| procedure_template | 312 | 312 | 704 | **44%** ← GAP |
| procedure_step | 2,160 | 2,160 | ? | elevee |
| document_template | 809 | 809 | 793 | **100%+** |

**translations table — Top categories:**
| Categorie | Count |
|-----------|-------|
| frontend.admin | 1,371 |
| workflow | 167 (14 noms + steps + options) |
| enum | 128 (131 valeurs x 3 langues) |
| frontend.auth | 147 |
| frontend.support | 113 |

**Fichiers JSON frontend:**
- **Web**: ES=9,425 / FR=9,506 / EN=9,313 cles → **716 cles desynchronisees**
- **Mobile**: 541 cles x 3 langues → **100% synchronise**

**Backend errors**: **1,593 HTTPException** hardcodees (mix EN/ES) dans **82 fichiers**

---

## 2. DIAGNOSTIC PRINCIPAL: LE CODE NE CONSOMME PAS LES TRADUCTIONS

### 2.1 Bundle Simulator (Licences commerciales) — PAS DE TRADUCTION

**Symptome**: Page publique `/licencias-comerciales` toujours en espagnol, meme en mode FR/EN.

**Cause racine**: L'endpoint `GET /service-bundles/simulator` ignore la langue:

```python
# bundle_routes.py — PAS de parametre language
@router.get("/simulator", response_model=SimulatorResponse)
async def simulate_bundle_pricing(
    commerce_type: str = Query(...),
    zone_code: str = Query(...),
    db=Depends(get_database),
):
    # ...
    fee_groups_list.append(FeeGroupItems(
        fee_type=ft,
        label_es=FEE_TYPE_LABELS_ES.get(ft, ft.upper()),  # ← TOUJOURS ES
    ))

# bundle_service.py — SQL ne fetch que _es
SELECT sb.commerce_type, sb.name_es, sb.description_es FROM service_bundles sb
```

**Frontend**: Le type `CommerceTypeOption` n'a que `nameEs`, `descriptionEs`. Pas de champ FR/EN.

**Pourtant**: Les 21 services T-2001..T-2011 ONT des traductions FR/EN dans `entity_translations` !

### 2.2 Noms de Workflow — PAS CONSOMMES

**Symptome**: Noms de workflow en espagnol sur le web public et dashboard.

**Cause racine**: Le code utilise `wf.service_name_es` (propriete Python hardcodee) au lieu de la table `translations`:

```python
# verify_routes.py
for code, wf in workflow_engine.get_all_workflows().items():
    wf_labels[code.value] = wf.service_name_es  # ← TOUJOURS ES
```

**Pourtant**: La table `translations` contient les 14 noms de workflow en 3 langues:
```
workflow.name.PASAPORTE → ES: "Solicitud de Pasaporte" | FR: "Demande de Passeport" | EN: "Passport Application"
workflow.name.CONDUCIR → ES: "Solicitud de Certificado para Conducir" | FR: "Demande de Permis de Conduire" | EN: "Driving License Application"
...14 workflows complets
```

**Mobile**: Gere correctement via hook `use-workflow-translations.ts` qui fetch `/translations/system/export/workflow` + fallback JSON local.

### 2.3 Composants Web hardcodes

| Fichier | Langue hardcodee | Impact |
|---------|-----------------|--------|
| `accountant/page.tsx` | ES ("Panel de Contador") | Page comptable entiere |
| `companies/dashboard/page.tsx` | ES ("Cobro Global", "Zonas Alerta") | Dashboard entreprises |
| `activate-admin/page.tsx` | FR (sans accents !) | Activation admin |
| `activate-agent/page.tsx` | FR (sans accents !) | Activation agent |
| `workflows/[code]/page.tsx` | ES ("Use el boton...") | Config workflows |

### 2.4 Contenu dynamique — `name_es` hardcode dans le frontend

```typescript
// fiscal-services/[id]/page.tsx
{ministry ? (ministry.name_es || ministry.nameEs) : '-'}  // ← IGNORE locale

// Plusieurs pages admin utilisent .name_es directement
```

**Pourtant**: Les endpoints `GET /homepage/ministries`, `GET /services/search` ACCEPTENT `?language=` et JOINent `entity_translations`. Le probleme est que certaines pages n'utilisent pas ces endpoints traduits ou ne passent pas le parametre locale.

---

## 3. PROBLEMES PAR SEVERITE

### CRITIQUE (melange de langues visible par tous les utilisateurs)

| # | Probleme | Scope | Donnees existantes ? |
|---|----------|-------|---------------------|
| C1 | Bundle simulator toujours ES | Page publique licences | OUI (entity_translations service) |
| C2 | Workflow names toujours ES | Web dashboard + public | OUI (translations table workflow) |
| C3 | 1,593 HTTPException hardcodees | Toutes erreurs API | NON (a creer) |
| C4 | 716 cles web desynchronisees | Toutes pages web | Partiel |
| C5 | Mobile DEFAULT_MESSAGES ES only | Toutes erreurs mobile | Cles existantes mais non utilisees |

### MAJEUR (affecte certains profils/pages)

| # | Probleme | Scope |
|---|----------|-------|
| M1 | 15+ fichiers web sans useTranslations | Pages accountant, admin, activation |
| M2 | Pages admin utilisent `.name_es` directement | Admin services, entities |
| M3 | Mobile inline objects (HERO_I18N, QUICK_ACTION_LABELS) | Home mobile |
| M4 | Francais dans fichier espagnol mobile (slot/creneau) | Wizard appointment |
| M5 | procedure_templates a 44% couverture | Procedures en ES pour 56% des templates |

### MOYEN (experience degradee)

| # | Probleme | Scope |
|---|----------|-------|
| m1 | Formatage dates inconsistant (toLocaleString vs formatDate) | Diverses pages |
| m2 | Accept-Language envoye mais ignore par backend | Toutes requetes API |
| m3 | Language middleware backend ne consulte pas user.preferred_language | Backend |
| m4 | Vue materialisee peut etre desynchronisee | Recherche homepage |
| m5 | Constantes langue dupliquees (3 fichiers mobile) | Mobile |

---

## 4. FORCES DE L'EXISTANT (ce qui marche)

| Composant | Statut | Detail |
|-----------|--------|--------|
| **entity_translations** | A | 8,536 entrees, 7 types, FR+EN, quality scores |
| **translations table** | A | 2,967 entrees, 37 categories, GIN indexes |
| **Admin UI traductions** | A | 3 onglets, bulk import/export, sync JSON |
| **Workflow translations** | A | 14 noms + 167 entrees (steps, options, motivos) |
| **Enum translations** | A | 128 entrees couvrant 25 enums |
| **Templates email/SMS/push** | A | 100% multilingues |
| **Mobile i18n architecture** | A | 541 cles sync, detection device, fallback |
| **Mobile workflow hook** | A | `use-workflow-translations.ts` — modele a suivre |
| **Homepage endpoints** | A- | Acceptent `?language=`, JOINent entity_translations |
| **Materialized view** | A- | Pre-join services + categories + ministries |
| **Chatbot** | A | Gemini multilingue |
| **Formatage locale** | A- | date-fns + Intl.NumberFormat |
| **SEO/Metadata** | A | getTranslations server-side |

---

## 5. APPROCHE MOBILE vs WEB — ANALYSE COMPARATIVE

### Mobile (modele a suivre)
```
Source primaire: GET /translations/system/export/workflow (backend BD)
Fallback: JSON local (es.json/fr.json/en.json)
Hook: use-workflow-translations.ts
  ├── Fetch workflow translations from API
  ├── Map workflow codes → root codes (PASAPORTE_NUEVO → PASAPORTE)
  ├── Construct translation keys (workflow.name.{ROOT})
  └── Fallback chain: API → local JSON → service_name_es
```

### Web (a corriger)
```
Source: JSON statique (messages/es.json, etc.)
Pas de fetch dynamique depuis BD translations
Pas de fallback automatique
Certaines pages passent locale aux endpoints, d'autres non
```

### Recommandation: UNIFIER

Un **seul centre de controle** = la table `translations` + `entity_translations` en BD, consommees via:
1. **API endpoints** avec `?language=` pour contenu dynamique (services, ministries, workflows)
2. **JSON statique** pour UI labels (genere depuis BD via admin "Sync to JSON")
3. **Fallback chain** identique web/mobile: BD → JSON → fallback ES

---

## 6. PLAN D'ACTION RECOMMANDE

### Phase 1: Cablage critique (eliminer le melange visible)
- [ ] **C1**: Bundle simulator — ajouter `?language=` + JOIN entity_translations
- [ ] **C2**: Workflow names — consommer translations table au lieu de `service_name_es`
- [ ] **C4**: Synchroniser les 716 cles web manquantes entre ES/FR/EN
- [ ] **C5**: Mobile DEFAULT_MESSAGES → utiliser `getErrorI18nKey()` + `t()`
- [ ] **M4**: Corriger francais dans es.json mobile (slot → horario)

### Phase 2: Composants web non-traduits
- [ ] **M1**: Ajouter useTranslations aux 15+ fichiers hardcodes
- [ ] **M2**: Remplacer `.name_es` par utility `getLocalizedField(entity, field, locale)`
- [ ] **M3**: Mobile inline objects → migrer vers i18n JSON

### Phase 3: Erreurs backend standardisees
- [ ] **C3**: Creer catalogue d'erreurs avec codes + traductions dans translations table
- [ ] Middleware d'erreur qui traduit `detail` selon Accept-Language/user preference

### Phase 4: Completude et automatisation
- [ ] **M5**: Completer procedure_templates (44% → 100%)
- [ ] **m2**: Backend utiliser Accept-Language header partout
- [ ] **m3**: Language middleware → fallback user.preferred_language
- [ ] CI check parite cles traduction
- [ ] Script audit cles inutilisees

---

## 7. METRIQUES DE SUCCES

| Metrique | Actuel | Cible |
|----------|--------|-------|
| Pages avec melange de langues | 20+ | 0 |
| Cles web desynchronisees | 716 | 0 |
| Composants sans useTranslations | 35 | 0 |
| HTTPException non-traduites | 1,593 | 0 (codes + catalogue) |
| entity_translations procedure_template | 44% | 100% |
| Score global i18n | C+ (62/100) | A (95/100) |

---

*Rapport genere le 2026-03-31 par analyse de 82 fichiers backend, 876 fichiers web, 146 fichiers mobile, et requetes BD directes (entity_translations: 8,536 rows, translations: 2,967 rows).*
