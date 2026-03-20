# Spécification Technique — BundleWorkflow (Paiement Obligations Entreprises Autonomes)

## Date : 2026-03-20
## Statut : SPEC pour implémentation
## Auteur : Claude Code (expert critique)

---

## 1. CONTEXTE ET OBJECTIF

### Qu'est-ce que le BundleWorkflow ?
Un workflow déclenché par un citoyen/utilisateur depuis son dashboard pour **payer les obligations fiscales annuelles** d'une entreprise autonome enregistrée au Padrón Empresarial de Guinée Équatoriale.

### Qui peut le déclencher ?
- Le propriétaire de l'entreprise (user role: business/citizen)
- Un comptable mandaté (user role: accountant)
- Un tiers qui paie pour le compte d'un autre (cas GE fréquent : famille/associé)
- Un admin (pour tests ou cas spéciaux)

### Pourquoi un workflow et pas un simple bouton "payer" ?
Parce que le processus implique :
1. Identification certaine de l'entreprise (NIF/PE)
2. Vérification de l'existence de la licence annuelle
3. Création automatique si première année
4. Choix du mode de paiement (per_line vs consolidé)
5. Routage vers les bonnes entités (Tesoro, Ayuntamiento, Cámara)
6. Validation post-paiement par agents
7. Émission de documents officiels

C'est un **cycle de vie complet**, pas une transaction simple.

---

## 2. INTÉGRATION DANS L'ARCHITECTURE EXISTANTE

### Pattern à suivre : PredefinedWorkflow
Le BundleWorkflow DOIT être un `PredefinedWorkflow` comme les autres (Pasaporte, Residencia, etc.) car :
- Il utilise le même moteur (WorkflowEngine)
- Il utilise les mêmes schemas OCR (GeminiDocumentProcessor)
- Il utilise le même système de paiement (service_payments)
- Il s'intègre dans les menus dynamiques (workflow_menu_mapping)
- Il bénéficie du même audit trail (service_request_documents, compliance_events)

### Différences clés avec les workflows existants

| Aspect | Workflows actuels (Pasaporte, etc.) | BundleWorkflow |
|--------|--------------------------------------|----------------|
| **Résultat** | Document officiel (passeport, licence) | Paiement d'obligations fiscales |
| **Nombre de paiements** | 1 paiement fixe | N paiements (1 par obligation ou 1 consolidé) |
| **Post-paiement** | Agent review → émission document | Routing → multi-entités → émission licence |
| **Récurrence** | Ponctuel | Annuel (renouvellement chaque année) |
| **Documents requis** | Identité + spécifiques | Certificado Padrón (PE) obligatoire |
| **Classification** | N/A | Classification fiscale automatique |
| **Licence commerciale** | N/A | Création commercial_license + obligations |

### Tables impliquées (EXISTANTES, pas à créer)

```
service_requests          ← Dossier principal (wizard session → persist)
service_request_documents ← Documents uploadés (certificado padrón)
service_payments          ← Paiement(s) avec fee_type discriminant
companies                 ← Entreprise identifiée/créée
commercial_licenses       ← Licence annuelle (1 par entreprise × bundle × année)
license_obligations       ← Obligations individuelles (tesoro, municipal, chamber)
license_compliance_events ← Audit trail complet
company_classification_history ← Historique des classifications
```

### Schemas OCR à intégrer dans GeminiDocumentProcessor

| Schema | Fichier | Usage |
|--------|---------|-------|
| `CERTIFICADO_ACTUALIZACION_PADRON_EMPRESARIAL_GQ_V1` | `certificado_actualizacion_padron_empresarial_gq.json` | **OBLIGATOIRE** — Preuve d'inscription au Padrón (autonomo). Champs clés : numero_registro (PE-XXXX), localidad, provincia, estado_negocio, timbre_fiscal |
| `CERTIFICADO_REGISTRO_EMPRESARIAL_GQ_V1` | `certificado_registro_empresarial_gq.json` | Optionnel — Pour les SL/SA (hors scope bundle mais utile pour la création d'entreprise). Champs clés : nif, forma_juridica, capital_social |
| `CERTIFICADO_REGISTRO_COMERCIO_GQ_V1` | `certificado_registro_comercio_gq.json` | Optionnel — Registre du commerce annuel |

### Comment les schémas s'intègrent dans GeminiDocumentProcessor

Le processeur utilise le `extraction_schema_key` pour sélectionner le bon schéma :

```python
# Dans la définition du BundleWorkflow :
DocumentRequirement(
    document_code="certificado_padron",
    document_name_es="Certificado de Actualización del Padrón Empresarial",
    schema_key="CERTIFICADO_ACTUALIZACION_PADRON_EMPRESARIAL_GQ_V1",
    is_required=True,
    faces_required=["recto"],
    accepted_formats=["pdf", "jpg", "png"],
    max_size_mb=10,
)

# Le GeminiDocumentProcessor.process() reçoit :
#   extraction_schema_key = "CERTIFICADO_ACTUALIZACION_PADRON_EMPRESARIAL_GQ_V1"
#   → SchemaLoader résout → certificado_actualizacion_padron_empresarial_gq.json
#   → Extraction guidée par les hints + champs du schéma
#   → Validation par les 15+ rules du schéma
```

### Extraction → Classification → Licence (pipeline automatique)

```
Document uploadé (certificado_padron.pdf)
  ↓
GeminiDocumentProcessor.process(
    content=bytes,
    document_code="certificado_padron",
    extraction_schema_key="CERTIFICADO_ACTUALIZACION_PADRON_EMPRESARIAL_GQ_V1"
)
  ↓ Extraction
{
    "empresa.numero_registro": "PE-001234",
    "empresa.denominacion_comercial": "Tienda El Sol",
    "ubicacion.localidad": "Malabo",
    "ubicacion.provincia": "BIOKO-NORTE",
    "actividad.sector": "Terciario",
    "actividad.objeto_social": "Venta de productos alimenticios",
    "certificacion.estado_negocio": "Negocio Activo"
}
  ↓ Mapping vers company_data
{
    "legal_name": "Tienda El Sol",
    "registration_number": "PE-001234",
    "forma_juridica": "autonomo",
    "sector_actividad": "terciario",
    "objeto_social": "Venta de productos alimenticios",
    "localidad": "Malabo",
    "provincia": "BIOKO-NORTE"
}
  ↓ ClassificationAgent.classify_company()
  R2b: autonomo + PE-XXXX → ALWAYS bundle (conf 0.95)
  ↓ LLM commerce_type inference
  objeto_social "Venta de productos alimenticios" → commerce_type="abaceria"
  ↓ Zone resolution
  localidad="Malabo" → city_id → zone_id=A1
  ↓ Post-validation
  Bundle "Abacerias" existe pour zone A1 → OK
  ↓
ClassificationResult {
    regimen_fiscal: "bundle",
    commerce_type: "abaceria",
    confidence: 0.95,
    zone_id: "A1"
}
  ↓ Décision
  confidence ≥ 0.90 + pas de flags → auto_approved
  ↓
  CREATE company (si nouvelle)
  → LicenseService.open_license(company_id, bundle_id, zone_id, fiscal_year)
  → Obligations générées automatiquement
  → Workflow continue vers le paiement
```

---

## 3. PARCOURS UTILISATEUR — CRITIQUE DES SUGGESTIONS

### Ta proposition : "Page avec 2 choix (recherche + upload)"
**Mon analyse critique :**

**POUR la recherche en premier :**
✅ Le cas dominant (80%+) est une entreprise EXISTANTE qui renouvelle ses obligations annuelles
✅ Le comptable qui paie pour un client doit pouvoir chercher sans être le propriétaire
✅ Le NIF/PE est l'identifiant unique — la recherche est le moyen le plus fiable

**CONTRE les 2 options au même niveau :**
❌ L'upload déclenche un pipeline asynchrone (extraction LLM 3-5s + classification + draft review possible) pendant lequel l'utilisateur ne peut PAS continuer
❌ Si l'entreprise existe déjà et que l'utilisateur uploade quand même → conflit (doublons NIF/PE détectés → erreur confuse)
❌ L'UX est confuse : "chercher OU uploader" implique que ce sont des alternatives équivalentes, mais elles ont des durées et outcomes très différents

**MA CONTRE-PROPOSITION :**

```
┌─────────────────────────────────────────────────────────────┐
│ ÉTAPE 0 : IDENTIFICATION DE L'ENTREPRISE                     │
│                                                              │
│ [Barre de recherche proéminente]                             │
│ 🔍 Buscar empresa por NIF, PE-XXXX o nombre...              │
│                                                              │
│ Résultats en temps réel (debounce 300ms) :                   │
│ ┌──────────────────────────────────────────────┐             │
│ │ 🏢 Tienda El Sol — PE-001234 — Malabo (A1)  │ [Seleccionar]│
│ │    ⚠ Registrada por otro usuario            │             │
│ └──────────────────────────────────────────────┘             │
│                                                              │
│ Si AUCUN résultat :                                          │
│ ┌──────────────────────────────────────────────┐             │
│ │ No se encontró la empresa.                    │             │
│ │ ¿Es una nueva empresa? Suba el certificado    │             │
│ │ del Padrón Empresarial para registrarla.       │             │
│ │ [📄 Subir certificado]                         │             │
│ └──────────────────────────────────────────────┘             │
│                                                              │
│ La zone d'upload N'APPARAÎT QUE si la recherche             │
│ ne trouve rien. C'est SÉQUENTIEL, pas parallèle.            │
└─────────────────────────────────────────────────────────────┘
```

**Pourquoi c'est mieux :**
1. 80% des utilisateurs trouvent leur entreprise en 1 recherche → flux rapide
2. Pas de confusion entre 2 options parallèles
3. L'upload est un fallback naturel, pas une alternative
4. L'avertissement "registrada por otro usuario" informe sans bloquer (ton point ✅)

### La mention "Registrada por otro usuario"

Quand un utilisateur cherche et trouve une entreprise qu'il n'a pas créée :
- **Afficher** : "⚠ Esta empresa fue registrada por otro usuario. Puede continuar el pago como representante o tercero."
- **Ne PAS bloquer** : L'utilisateur peut sélectionner et continuer
- **Logger** : audit_log avec user_id + company_id + "third_party_payment_initiated"
- **Notification** : Email au propriétaire original ("Alguien inició un pago para su empresa")

---

## 4. DÉFINITION TECHNIQUE DU WORKFLOW

### WorkflowCode
```python
# Ajouter dans WorkflowCode enum :
BUNDLE_PAYMENT = "BUNDLE_PAYMENT"

# Catégorie :
WorkflowCategory.FISCAL  # Nouvelle catégorie (ou COMMERCIAL)
```

### Classe BundlePaymentWorkflow

```python
class BundlePaymentWorkflow(PredefinedWorkflow):
    """Bundle payment workflow for autonomo companies.

    Steps:
      0. company_identification → SELECTION (search or upload)
      1. license_verification   → SYSTEM (auto-create license if needed)
      2. obligations_review     → FORM_REVIEW (show obligations, select mode)
      3. payment               → PAYMENT (BANGE or cash)
      4. confirmation          → CONFIRMATION (receipt + next steps)
    """

    @property
    def workflow_code(self) -> WorkflowCode:
        return WorkflowCode.BUNDLE_PAYMENT

    @property
    def category(self) -> WorkflowCategory:
        return WorkflowCategory.FISCAL

    @property
    def entity_code(self) -> EntityCode:
        return EntityCode.TESORO  # Primary routing

    @property
    def requires_appointment(self) -> bool:
        return False  # No appointment needed

    @property
    def requires_agent_review(self) -> bool:
        return True  # Tesoro agent validates cash payments

    def _setup_workflow(self):
        # Step 0: Company identification
        self.add_step(WorkflowStep(
            step_number=0,
            step_type=StepType.SELECTION,
            title_es="Identificación de la Empresa",
            description_es="Busque su empresa o registre una nueva",
            is_required=True,
        ))

        # Step 1: Document upload (conditional: only if new company)
        self.add_step(WorkflowStep(
            step_number=1,
            step_type=StepType.DOCUMENT_UPLOAD,
            title_es="Documentos de la Empresa",
            description_es="Suba el certificado del Padrón Empresarial",
            is_required=False,  # Conditional: only for new companies
            condition={"company_exists": "false"},
        ))

        # Step 2: License & obligations review
        self.add_step(WorkflowStep(
            step_number=2,
            step_type=StepType.FORM_REVIEW,
            title_es="Revisión de Obligaciones",
            description_es="Revise las obligaciones fiscales y seleccione el modo de pago",
            is_required=True,
        ))

        # Step 3: Payment
        self.add_step(WorkflowStep(
            step_number=3,
            step_type=StepType.PAYMENT,
            title_es="Pago",
            description_es="Realice el pago de las obligaciones seleccionadas",
            is_required=True,
        ))

        # Step 4: Confirmation
        self.add_step(WorkflowStep(
            step_number=4,
            step_type=StepType.CONFIRMATION,
            title_es="Confirmación",
            description_es="Resumen del pago y próximos pasos",
            is_required=True,
        ))

    def get_document_requirements(self, context):
        """Documents required only for NEW companies."""
        if context.form_data.get("company_exists") == "false":
            return [
                DocumentRequirement(
                    document_code="certificado_padron",
                    document_name_es="Certificado de Actualización del Padrón Empresarial",
                    schema_key="CERTIFICADO_ACTUALIZACION_PADRON_EMPRESARIAL_GQ_V1",
                    is_required=True,
                    faces_required=["recto"],
                    accepted_formats=["pdf", "jpg", "png"],
                    max_size_mb=10,
                ),
            ]
        return []  # Existing company: no upload needed

    def get_tariff_breakdown(self, context):
        """Tariff comes from license obligations, not from a fixed schedule."""
        # The tariff is dynamic — computed from bundle_items × zone pricing
        license_data = context.form_data.get("license_data", {})
        obligations = license_data.get("obligations", [])

        items = []
        for ob in obligations:
            if ob.get("selected", True):  # Mode A: only selected; Mode B: all
                items.append({
                    "label": f"{ob['fee_type']} — {ob.get('ministry_name', '')}",
                    "amount": ob["amount"],
                })

        total = sum(i["amount"] for i in items)
        return {
            "items": items,
            "subtotal": total,
            "total": total,
            "currency": "XAF",
        }
```

### Document Requirements

| Document | Schema Key | Requis | Condition |
|----------|-----------|--------|-----------|
| Certificado Padrón | `CERTIFICADO_ACTUALIZACION_PADRON_EMPRESARIAL_GQ_V1` | OUI (si nouvelle) | `company_exists == false` |
| DIP du représentant | `DIP_GQ_V2` | NON | Optionnel pour vérification identité |

---

## 5. RISQUES ET MITIGATIONS

### R1 : Doublons d'entreprise lors de l'upload
**Risque** : Utilisateur uploade un document pour une entreprise qui existe déjà (PE-001234 déjà en BD)
**Mitigation** :
- Après extraction, vérifier immédiatement `registration_number` en BD
- Si trouvée → ne PAS créer de doublon, afficher l'entreprise existante et continuer
- Le trigger `normalize_identifier` + UNIQUE index empêche les doublons même en race condition

### R2 : Classification incorrecte bloque le paiement
**Risque** : L'agent de classification retourne `declarativo` au lieu de `bundle` pour un autonomo
**Mitigation** :
- Rule R2b : autonomo + PE → ALWAYS bundle (confidence 0.95) — hard rule, pas de LLM
- Si malgré tout → admin peut reclassifier manuellement

### R3 : Bundle/zone sans pricing
**Risque** : Le bundle "abaceria" n'a pas d'items pour la zone D3
**Mitigation** :
- Post-validation Layer 3 détecte et flag `zone_items_missing`
- Message utilisateur : "Pas de tarif configuré pour cette zone. Contactez l'administration."
- Ne PAS bloquer : créer la licence avec total_amount=0, admin complète plus tard

### R4 : Paiement partiel en Mode A (pas toutes les obligations payées)
**Risque** : Utilisateur paie Tesoro mais pas Ayuntamiento → licence reste `partial`
**Mitigation** :
- licence.status = `partial` (pas `complete`)
- Cron reminder J-30, J-15, J-0 pour les obligations restantes
- L'utilisateur peut revenir et payer les obligations manquantes (même workflow, même licence)

### R5 : Race condition — 2 utilisateurs paient la même obligation
**Risque** : Le comptable et le propriétaire paient simultanément
**Mitigation** :
- UPDATE obligation SET status='payment_pending' WHERE status='pending' RETURNING id
- Le premier UPDATE gagne (row lock), le second retourne 0 rows → "obligation déjà en cours de paiement"
- Idempotent : pas de double paiement

### R6 : Millions de workflows simultanés
**Risque** : Performance dégradée sous charge
**Mitigation** :
- open_license() = 1 transaction atomique (30 INSERTs max) → OK
- Bundle pricing cached 1h → pas de recalcul par request
- Connection pooling asyncpg (min=5, max=20) → 20 transactions simultanées
- MV refresh toutes les 15min (pas en temps réel)
- PDF generation en background task (pas bloquant)

### R7 : L'utilisateur ne termine pas le workflow
**Risque** : Session abandonnée après sélection d'entreprise, avant paiement
**Mitigation** :
- Wizard session en cache Redis (TTL 30min)
- Si licence créée mais pas payée → status reste `open` (pas de cleanup)
- L'utilisateur peut revenir et reprendre (même licence)

### R8 : Schéma OCR non reconnu par Gemini
**Risque** : Le document uploadé n'est pas un certificado padrón valide
**Mitigation** :
- GeminiDocumentProcessor vérifie `document_type` dans l'extraction
- Si mismatch → `DOC_TYPE_MISMATCH` risk factor → blocking
- Message utilisateur : "El documento no corresponde al certificado del Padrón Empresarial"

---

## 6. INTÉGRATION AVEC GeminiDocumentProcessor

### Ajouts nécessaires dans le processeur

Le GeminiDocumentProcessor supporte DÉJÀ les schémas d'entreprise. Les ajouts sont minimaux :

1. **WorkflowIdentityConfig pour BUNDLE_PAYMENT** :
```python
"BUNDLE_PAYMENT": WorkflowIdentityConfig(
    reference_document="certificado_padron",
    compare_documents=[],  # Pas de cross-check (1 seul document)
    critical_fields=[
        IdentityFieldConfig("numero_registro", ["empresa.numero_registro"], is_blocking=True),
        IdentityFieldConfig("denominacion_comercial", ["empresa.denominacion_comercial"], is_blocking=False),
        IdentityFieldConfig("localidad", ["ubicacion.localidad"], is_blocking=False),
    ],
    is_blocking=True,
),
```

2. **Mapping extraction → company_data** :
```python
def map_padron_to_company(extraction: Dict) -> Dict:
    """Map certificado_padron extraction to company_data format."""
    return {
        "legal_name": extraction.get("empresa.denominacion_comercial", ""),
        "registration_number": extraction.get("empresa.numero_registro", ""),
        "forma_juridica": "autonomo",  # ALWAYS for Padrón
        "sector_actividad": extraction.get("actividad.sector", "terciario"),
        "objeto_social": extraction.get("actividad.objeto_social", ""),
        "localidad": extraction.get("ubicacion.localidad", ""),
        "provincia": extraction.get("ubicacion.provincia", ""),
        # Le timbre fiscal confirme l'authenticité
        "timbre_fiscal_code": extraction.get("documento.codigo_timbre", ""),
    }
```

---

## 7. SESSIONS D'IMPLÉMENTATION

### Session 7A : Backend BundleWorkflow class + endpoints
- [ ] Créer `BundlePaymentWorkflow(PredefinedWorkflow)` dans workflows/
- [ ] Enregistrer dans WorkflowEngine
- [ ] Endpoint `POST /bundle-workflow/search-company` (search par NIF/PE/nom)
- [ ] Endpoint `POST /bundle-workflow/initiate` (avec company_id ou document upload)
- [ ] Endpoint `POST /bundle-workflow/{license_id}/select-obligations` (mode A/B)
- [ ] Endpoint `POST /bundle-workflow/{license_id}/initiate-payment`
- [ ] Intégration GeminiDocumentProcessor (identity config + mapping)

### Session 7B : Frontend Wizard BundleWorkflow
- [ ] Page `/dashboard/bundle-payment` — wizard 5 étapes
- [ ] Step 0 : Recherche entreprise (CompanySearchSelect enrichi)
- [ ] Step 0b : Upload certificado (conditionnel si pas trouvée)
- [ ] Step 2 : Revue obligations (table avec checkboxes Mode A)
- [ ] Step 3 : Paiement (BANGE redirect ou cash)
- [ ] Step 4 : Confirmation (résumé + PDF)

### Session 7C : Agent + Notifications
- [ ] Queue OMS pour agents Tesoro
- [ ] Validation/rejet par agent
- [ ] Émission document (licence commerciale)
- [ ] Email templates : initiation, reminder, completion

### Session 7D : Tests E2E
- [ ] Flux complet : recherche → licence → paiement → validation → complete
- [ ] Flux nouvelle entreprise : upload → extraction → classification → licence → paiement
- [ ] Race conditions (double paiement, double création)

---

## ADDENDUM : RÉPONSES AUX QUESTIONS CRITIQUES (2026-03-20)

### Q1 : GeminiDocumentProcessor traite-t-il le schéma padrón ?
**OUI** — Le schéma `certificado_actualizacion_padron_empresarial_gq.json` est complet (381 lignes) :
- 30+ champs d'extraction organisés en 6 sections (documento, empresa, ubicacion, actividad, datos_operativos, certificacion, autenticacion)
- 7 validations critiques (negocio_activo, forma_juridica=AUTONOMO, PE-XXXX format, photo, firma, sello, timbre)
- gemini_hints détaillés avec différences visuelles DGPE vs VUE
- tesseract_patterns de fallback pour 19 champs

**MAIS** — Le `WORKFLOW_IDENTITY_CONFIGS` dans GeminiDocumentProcessor n'a PAS de configuration BUNDLE_PAYMENT. Il faut ajouter :
```python
"BUNDLE_PAYMENT": WorkflowIdentityConfig(
    reference_document="certificado_padron",
    compare_documents=[],
    critical_fields=[
        IdentityFieldConfig("numero_registro", ["empresa.numero_registro"], is_blocking=True),
        IdentityFieldConfig("denominacion_social", ["empresa.denominacion_social"], is_blocking=False),
    ],
    is_blocking=True,
    workflow_patterns=["BUNDLE_PAYMENT*"]
),
```

### Q2 : LicenseService.open_license() est-il automatisé comme n8n ?
**OUI, niveau n8n** — La chaîne est 100% automatisée :

```
Paiement validé (BANGE callback ou agent Tesoro)
  ↓ bange_processor.py / manual_processor.py / gateway_processor.py
on_payment_completed(payment_id)
  ↓ 1. Vérifie fee_type IS NOT NULL (discrimine OMS vs service normal)
  ↓ 2. UPDATE obligations status='payment_pending' → 'paid' (atomique, idempotent)
  ↓ 3. Batch-fetch licences concernées (1 query, pas N+1)
  ↓ 4. ObligationRoutingService.route_paid_obligations()
       ├── tesoro → status='processing' → agent Tesoro queue
       ├── municipal → status='completed' (auto, pas d'agent)
       └── chamber → status='completed' (auto, pas d'agent)
  ↓ 5. update_license_counters() → recalcule paid/overdue/compliance_score
  ↓ 6. Si toutes completed → license.status='complete'
```

4 points d'appel automatiques (webhook BANGE, manual processor, gateway, BANGE processor). Idempotent via WHERE status='payment_pending' RETURNING.

### Q3 : ObligationRoutingService est-il câblé au paiement ?
**OUI** — Déjà câblé via `on_payment_completed()`. Le maillon MANQUANT est l'**initiation** (créer les service_payments avec le bon fee_type). C'est le travail de la Session 7A.

### Q4 : Correction de ma position sur l'upload
**Ta proposition est MEILLEURE.** L'upload doit :
1. Extraire les données via GeminiDocumentProcessor
2. Vérifier si `numero_registro` (PE-XXXX) existe déjà en BD
3. Si OUI → utiliser l'entreprise existante et continuer le workflow (pas de recréation)
4. Si NON → créer l'entreprise en parallèle + continuer le workflow
5. L'admin valide la création en arrière-plan (si confidence < 0.90)
6. Le workflow ne BLOQUE PAS — le paiement peut être initié même si la validation admin est en cours

C'est un pattern "optimistic workflow" — on continue tant que les données sont cohérentes, la validation formelle suit en async.

---

## ADDENDUM 2 : CORRECTION ARCHITECTURE PAIEMENT + ROUTING (2026-03-20)

### Correction critique : municipal/chamber NE SONT PAS auto-complétés

L'implémentation actuelle (ObligationRoutingService ligne 36-37) fait :
```python
if fee_type in ("municipal", "chamber"):
    return "completed"  # INCORRECT — doit passer par les agents
```

CORRIGÉ : Ayuntamiento et Cámara ont leur propre chaîne agent → superviseur → édition.

### Architecture DÉFINITIVE des 2 modes

**MODE A (Per Line) :**
1. Utilisateur sélectionne N obligations (checkboxes)
2. N service_payments créés (1 par obligation sélectionnée)
3. Agent Tesoro valide le PAIEMENT (pas l'édition)
4. Après validation paiement, ROUTAGE vers les ministères :
   - Obligation tesoro/Min. Hacienda → Agent Min. Hacienda → édite licence Hacienda
   - Obligation tesoro/Min. Comercio → Agent Min. Comercio → édite licence Comercio
   - Obligation municipal → Agent Ayuntamiento → édite licence municipale
   - Obligation chamber → Agent Cámara → édite licence Cámara
5. Tesoro NE FAIT PAS l'édition — il valide uniquement le paiement
6. Chaque ministère édite SA partie indépendamment

**MODE B (Consolidated) :**
1. Utilisateur paie le TOTAL en 1 seul paiement
2. Agent polyvalent Tesoro traite LE DOSSIER ENTIER (validation + édition)
3. PAS de routing vers les ministères — le polyvalent fait tout
4. 1 seul certificat/licence consolidé émis par le Tesoro

**Résumé :**
- Mode A : Tesoro = valideur paiement. Ministères = éditeurs (chacun sa licence)
- Mode B : Tesoro polyvalent = valideur + éditeur (tout le dossier)
- Municipal/Chamber : même chaîne que tesoro (agent → superviseur → édition), PAS auto-complété

### Corrections Session 7A
- [ ] resolve_target_status() : TOUS retournent "processing" (plus de "completed" auto)
- [ ] resolve_target_entity() Mode A :
  - fee_type=tesoro → route par ministry_id vers MIN_HACIENDA, MIN_COMERCIO, etc.
  - fee_type=municipal → route vers AYUNTAMIENTO
  - fee_type=chamber → route vers CAMARA_COMERCIO
- [ ] resolve_target_entity() Mode B : TOUT vers TESORO (polyvalent)
- [ ] Chaque entité (AYUNTAMIENTO, CAMARA, MIN_*) a ses agents + superviseurs

---

## ADDENDUM 3 : PRÉCISION MODE B — Ayuntamiento/Cámara TOUJOURS indépendants (2026-03-20)

### Règle fondamentale
**Ayuntamiento et Cámara de Comercio gardent TOUJOURS leur workflow indépendant, QUEL QUE SOIT le mode (A ou B).**

Le mode A/B ne change QUE le comportement du TESORO.

### Architecture DÉFINITIVE CORRIGÉE

```
MODE A :
  Tesoro:
    1. Agent Tesoro valide le paiement
    2. Routing vers CHAQUE ministère concerné (Min. Hacienda, Min. Comercio, etc.)
    3. Agent de chaque ministère édite SA licence séparément

  Ayuntamiento : (TOUJOURS PAREIL)
    1. Agent Ayuntamiento valide le paiement
    2. Superviseur Ayuntamiento traite et édite la licence municipale

  Cámara : (TOUJOURS PAREIL)
    1. Agent Cámara valide le paiement
    2. Superviseur Cámara traite et édite la licence Cámara

MODE B :
  Tesoro : (SEUL CHANGEMENT)
    1. Agent Tesoro valide le paiement
    2. Agent POLYVALENT (≠ agent qui valide) traite et édite UNE SEULE licence
       commune pour TOUTES les obligations tesoro (pas de routing multi-ministères)

  Ayuntamiento : (IDENTIQUE au Mode A)
    1. Agent Ayuntamiento valide le paiement
    2. Superviseur Ayuntamiento traite et édite la licence municipale

  Cámara : (IDENTIQUE au Mode A)
    1. Agent Cámara valide le paiement
    2. Superviseur Cámara traite et édite la licence Cámara
```

### Résumé en 1 phrase
Le mode A/B contrôle UNIQUEMENT si les obligations tesoro sont routées vers chaque ministère séparément (A) ou traitées par un agent polyvalent en 1 licence commune (B). Ayuntamiento et Cámara sont TOUJOURS indépendants.

### Impact Session 7A
- [ ] resolve_target_entity() : municipal→AYUNTAMIENTO et chamber→CAMARA_COMERCIO dans TOUS les modes
- [ ] Mode A tesoro : route par ministry_id vers MIN_HACIENDA, MIN_COMERCIO, etc.
- [ ] Mode B tesoro : route vers TESORO polyvalent (agent différent du valideur)
- [ ] JAMAIS de "completed" auto — les 3 entités ont toujours agent→superviseur→édition
