# 🎯 PLAN MAÎTRE — Document Intelligence & Automatisation Workflows

> **INSTRUCTIONS** : Ce fichier est un prompt d'initialisation de session. La nouvelle session doit lire ce fichier et l'exécuter comme ses instructions primaires. Commencer par l'étape 0.

---

## 0. ⚠️ AVANT TOUT CODE

### 0.1 Lire les instructions de travail
- Lire `CLAUDE.md` (racine) — règles projet, architecture, patterns, conventions
- Lire `memory/MEMORY.md` — mémoire persistante, 20 règles critiques
- Lire `memory/project_document_intelligence.md` — contexte de ce sprint

### 0.2 Lire le bilan de session précédente
La session Phase 10 (2026-04-18 → 2026-04-22) a couvert :
- P1-P15 bundle debug (guards, queue, counters, menus, i18n, UX)
- Phases 1-9 : "Mis Empresas" citoyen, certificat CLC, alertes cron, escalation, exports, rate limiting
- Vault registry connecté à 6 types de PDFs
- Auto-création licence pour AUTONOMO
- Déduplication vault (name-based, hash en cours)
- 60 companies seed avec licences + 543 obligations
- Données nettoyées (0 doublons, 0 archives invalides)

### 0.3 Créer une worktree
```
EnterWorktree(name="document-intelligence")
```

---

## 1. 📋 CONTEXTE & BILAN DE L'EXISTANT

### 1.1 Architecture documentaire actuelle

TaxasGE a un module "Mes Documents" avancé (migration 287) avec :

**6 tables BD :**
- `user_documents` — coffre-fort principal (40+ docs en staging)
- `user_document_workflow_tags` — liaison document↔workflow
- `user_document_access_log` — audit trail (OWASP A09)
- `user_document_alerts` — alertes expiration, renouvellement
- `user_agent_memory` — apprentissage comportemental agent
- `user_agent_permissions` — consentement (alertes proactives, prepare_renewal)

**3 sources de documents :**
- `personal` — upload direct citoyen vers vault
- `wizard_import` — documents soumis dans une demande de service, importés dans le vault
- `system_generated` — PDF générés (certificats, reçus, proformas, fiches solicitude)

**Agents existants :**
- `ProactiveAgentService` — cron daily : scan expirations, docs manquants, préparations
- `GeminiDocumentProcessor` — extraction OCR + classification AI (async fire-and-forget)
- `ClassificationAgent` — classification company (rules + LLM + validation)
- `VaultDocumentPicker` — composant frontend "Seleccionar del coffre" dans le wizard upload

**Vault Registry :**
- `vault_registry.py` — utility centralisée pour inscrire tout document généré dans le vault
- Connecté à : certificat licence, proforma, reçu paiement, fiche solicitude, MED, scellé
- Idempotent : ON CONFLICT DO NOTHING

### 1.2 Flux actuels vérifiés

#### Flux A — Upload personnel (POST /user-documents/upload)
```
Fichier → SHA-256 calculé (backend L335) → find_duplicate() check
  → SI doublon : WARN mais upload quand même (NE BLOQUE PAS)
  → Firebase : user-documents/{user_id}/{hash[:12]}_{filename}
  → INSERT user_documents (source='personal', file_hash=SHA-256)
  → Async : GeminiDocumentProcessor classification + extraction
  → Auto-archive anciennes versions du même type
```
✅ Hash calculé, ✅ Dedup détecté, ❌ Ne bloque pas

#### Flux B — Wizard upload → persist → vault import
```
Frontend upload → base64 en Redis cache → persist_to_db :
  → Firebase : upload_user_document()
  → INSERT service_request_documents (file_hash = doc_data.get("doc_hash") → SOUVENT NULL)
  → Après soumission : auto_import_wizard_documents()
    → Pour chaque doc : check source_document_id (idempotence par SR)
    → Check hash (souvent vide → INEFFICACE)
    → Check type+name (fallback)
    → INSERT user_documents (source='wizard_import')
```
❌ Hash PAS calculé côté frontend, ❌ Hash PAS propagé au persist, ⚠️ Dedup faible

#### Flux C — Documents générés (PDFs)
```
Event handler → génère PDF → Firebase upload
  → vault_registry.register_document_in_vault()
  → INSERT user_documents (source='system_generated')
```
✅ Connecté à 6 types de PDFs, ✅ Idempotent

### 1.3 Problèmes identifiés (critiques)

| # | Problème | Impact | Sévérité |
|---|----------|--------|----------|
| 1 | **Hash jamais calculé au wizard upload** | Même fichier uploadé N fois = N fichiers Firebase | CRITIQUE |
| 2 | **Dedup ne bloque pas** (warn only) | Pollution Firebase + confusion utilisateur | HIGH |
| 3 | **VaultDocumentPicker pas auto-activé** | Utilisateur doit manuellement cliquer "Seleccionar del coffre" | HIGH |
| 4 | **Extraction Gemini pas liée au contrôle de validité** | Document expiré accepté sans alerte | HIGH |
| 7 | **Workflows acceptent des documents expirés** | Un citoyen peut soumettre un DIP expiré et la demande passe toutes les validations — aucun check d'expiration dans le wizard upload ni dans la validation agent | CRITIQUE |
| 5 | **Pas de pré-remplissage auto des docs dans le wizard** | Utilisateur re-upload pour chaque demande | MEDIUM |
| 6 | **Pas de vérification cross-document** | Nom sur DIP ≠ nom sur passeport → pas détecté | MEDIUM |

---

## 2. 🎯 OBJECTIFS

### Objectif principal
Construire un système de **Document Intelligence** où :
1. Chaque document est uploadé UNE SEULE fois (déduplication stricte par contenu)
2. Les documents du vault sont automatiquement proposés dans les workflows
3. L'extraction Gemini alimente la validation de conformité (expiration, identité)
4. L'agent proactif notifie AVANT que le document n'expire
5. L'agent d'automatisation peut initier des workflows avec les documents existants

### Objectifs secondaires
- Réduire les coûts Firebase (moins de fichiers dupliqués)
- Améliorer l'UX citoyen (moins de re-uploads)
- Améliorer la qualité des données (cross-validation identité)
- Conformité OWASP (intégrité fichiers, audit trail)

---

## 3. 📦 PHASES D'IMPLÉMENTATION

### Phase 1 — Déduplication stricte par contenu (2h)

**1A. Frontend : calculer SHA-256 avant upload wizard**

Fichier : `packages/web/src/modules/documents/hooks/useDocumentUpload.ts` (ou équivalent wizard)

Utiliser Web Crypto API :
```typescript
async function computeFileHash(file: File): Promise<string> {
  const buffer = await file.arrayBuffer()
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer)
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0')).join('')
}
```

Ajouter le hash à `doc_data.doc_hash` AVANT l'envoi au cache Redis.

**1B. Backend : propager le hash au persist wizard**

Fichier : `packages/backend/app/modules/service_requests/services/wizard_session_service.py`

Le `file_hash=doc_data.get("doc_hash")` (ligne 1302) recevra maintenant un vrai SHA-256 au lieu de NULL.

**1C. Backend : bloquer les vrais doublons (pas juste warn)**

Fichier : `packages/backend/app/modules/user_documents/api/user_documents_routes.py`

Au POST /upload (ligne 339) : si `find_duplicate()` trouve un match exact → retourner le document existant au lieu d'uploader un nouveau fichier. Pas de nouveau fichier Firebase.

```python
if existing:
    return UploadResult(
        document=existing_doc,
        duplicate=True,
        message="Document already in vault — reusing existing"
    )
```

**1D. Backend : dedup stricte au wizard import**

Fichier : `packages/backend/app/modules/user_documents/services/user_documents_service.py`

Le check 3 niveaux existe déjà (session précédente). Avec le hash propagé depuis 1A/1B, le Level 1 (hash) sera maintenant efficace.

### Phase 2 — Auto-fill wizard avec documents du vault (3h)

**2A. Backend : endpoint readiness enrichi**

Fichier : `packages/backend/app/modules/user_documents/api/user_documents_routes.py`

L'endpoint `GET /user-documents/readiness/{workflow_code}` existe déjà. L'enrichir pour retourner :
- Pour chaque document requis : `{ required: true, found_in_vault: true/false, vault_document_id, expiry_status, needs_renewal }`
- L'ID du document vault à utiliser pour le pré-remplissage

**2B. Frontend : auto-select dans le wizard upload step**

Fichier : `packages/web/src/modules/service-requests/components/DocumentUploader.tsx` (ou composant wizard upload)

Au chargement du step :
1. Appeler `readiness/{workflow_code}`
2. Pour chaque document requis trouvé dans le vault → pré-sélectionner avec badge "✓ Document trouvé"
3. L'utilisateur peut remplacer s'il veut (bouton "Remplacer")
4. Si le document est expirant → badge ambre "⚠ Expire bientôt"
5. Si expiré → ne PAS auto-sélectionner, forcer re-upload

**2C. Backend : skip Firebase upload pour docs pré-sélectionnés**

Quand le wizard persiste et qu'un document vient du vault (pas un nouvel upload) :
- Ne PAS re-uploader vers Firebase
- Utiliser le `file_path` existant du vault
- Créer le lien `service_request_documents` avec le même `file_path`

### Phase 3 — Extraction + Validation + Contrôle de conformité + Blocage expirés (4h)

**3A. Blocage documents expirés dans les workflows (CRITIQUE)**

Actuellement un citoyen peut soumettre un DIP expiré depuis 2 ans — le wizard l'accepte, l'agent le traite, personne ne vérifie l'expiration. C'est un trou de sécurité métier.

**3 points de contrôle à ajouter :**

**Séparation des responsabilités :**

Le module Documents **NE DÉCIDE PAS** de l'acceptabilité d'un document. Il existe déjà un système de validation dans les workflows (`SchemaValidationEngine`, `validate_step()`, `cross_validation_rules`) qui applique les règles métier définies par workflow. Le module Documents a 3 rôles :

1. **Extraire** — Gemini extrait `expiry_date`, `holder_name`, `document_number` → stockés dans `extraction_data`
2. **Informer** — badges visuels dans le vault et le wizard (expiré ⚠, bientôt expiré ⏳, valide ✓)
3. **Notifier** — alertes proactives pilotées par `expiry_policy` (timing des notifications)

Les workflows et leurs règles existantes décident ensuite de l'acceptation/rejet.

**Implémentation :**

1. **Badges informatifs (frontend)** — après extraction Gemini :
   - Si `expiry_date < TODAY` → badge ambre "⚠ Expirado" (informatif, pas blocage)
   - Si `expiry_date < TODAY + 30j` → badge jaune "Expire bientôt"
   - Visibles dans : vault, wizard upload, vue agent validation

2. **`expiry_policy` pour les notifications** — dans `workflow_document_requirements` :
   - `'notify_30d'` — notifier 30 jours avant expiration
   - `'notify_60d'` — notifier 60 jours avant
   - `'notify_90d'` — notifier 90 jours avant
   - `'no_notify'` (default) — pas de notification liée au workflow
   - L'agent proactif utilise ce paramètre pour envoyer les alertes ciblées

3. **Alimentation des données pour les workflows** — enrichir `service_request_documents` :
   - `extraction_data` contient `expiry_date` → accessible par `SchemaValidationEngine`
   - Les règles de validation du workflow (JSON schema) peuvent référencer `expiry_date` pour décider
   - Le module Documents FOURNIT la donnée, le workflow APPLIQUE la règle

4. **Vue agent** — affichage informatif :
   - Badge d'expiration sur chaque document dans le panel de validation
   - L'agent voit, le workflow valide, l'agent décide

**3B. Pipeline extraction → validation**

Quand GeminiDocumentProcessor extrait un document, les données critiques doivent alimenter la validation :

```
Upload document → GeminiProcessor extrait :
  - document_type (DIP, passeport, etc.)
  - holder_name (nom du titulaire)
  - document_number (numéro DIP/passeport)
  - issue_date (date de délivrance)
  - expiry_date (date d'expiration)
  - issuing_authority (autorité)
  
→ Stocké dans user_documents.extraction_data (JSONB)
→ Si expiry_date < TODAY → statut = 'expired', alerte créée
→ Si expiry_date < TODAY + 30j → alerte 'expiring_soon'
```

Ce pipeline EXISTE déjà (ProactiveAgentService). Vérifier qu'il est connecté :
- `extraction_data.expiry_date` → `user_documents.expiry_date` (sync)
- `extraction_data.holder_name` → `user_documents.holder_name` (sync)

**3B. Cross-validation identité**

Quand le wizard a plusieurs documents du même titulaire (DIP + passeport) :
- Comparer `holder_name` entre les 2 extractions
- Si discordance > seuil → warning à l'agent (pas blocage)
- Comparer `document_number` si même type → détecter les versions multiples

Fichier : créer `packages/backend/app/modules/user_documents/services/cross_validator.py`

**3C. Alerte expiration proactive enrichie**

L'agent proactif existe (`proactive_agent_service.py`). L'enrichir :
- Quand un document expire dans < 30 jours ET qu'un workflow actif l'utilise → alerte CRITIQUE
- Quand un document expire ET qu'il existe un document plus récent du même type → suggérer remplacement
- Email + Push au citoyen avec CTA "Renouveler maintenant"

### Phase 4 — Agent d'automatisation des workflows (6h)

**Concept** : un agent qui prépare automatiquement les demandes de service quand tous les documents sont dans le vault.

**4A. Readiness → Suggestion**

Quand le `ReadinessCheck` (onglet "Préparation" du vault) détecte que tous les documents requis pour un workflow sont présents et valides :
- Afficher un CTA "Iniciar solicitud automáticamente"
- Pré-remplir le wizard avec les documents du vault
- L'utilisateur n'a qu'à valider et payer

**4B. Agent proactif → Notification**

Le cron daily peut :
- Scanner les workflows disponibles pour chaque citoyen
- Si tous docs présents → notification push "Votre demande de passeport est prête à soumettre"
- Le citoyen clique → wizard pré-rempli → validation → soumission

**4C. Consentement**

Table `user_agent_permissions` existe déjà. Vérifier que :
- `permission_type='prepare_request'` → consent nécessaire
- `permission_type='proactive_alerts'` → consent nécessaire
- Pas d'action automatique sans consentement explicite

### Phase 5 — Sécurité & Conformité (2h)

**5A. Intégrité fichier (OWASP A08)**
- Vérifier magic bytes AVANT upload (existe déjà au POST /upload)
- Ajouter la même vérification au wizard upload
- Bloquer les fichiers avec extension falsifiée

**5B. Audit trail complet**
- Chaque accès au vault est loggé dans `user_document_access_log` (existe)
- Ajouter : log quand un document est auto-sélectionné dans le wizard
- Ajouter : log quand un document est refusé (expiré, corrompu)

**5C. RGPD — Droit à l'oubli**
- Le soft-delete → hard-delete après 30 jours existe
- Vérifier que Firebase Storage est aussi nettoyé (background task)
- Vérifier que `extraction_data` est aussi supprimé

---

## 4. 🚫 RÈGLES NON NÉGOCIABLES

1. **JAMAIS uploader un fichier qui existe déjà** — SHA-256 comme clé de déduplication
2. **JAMAIS bloquer un document expiré depuis le module Documents** — l'expiration est INFORMATIVE. Le module extrait et informe. Seuls les workflows et leurs règles (`SchemaValidationEngine`, `validate_step()`) décident de l'acceptation. `expiry_policy` pilote les NOTIFICATIONS, pas le blocage.
3. **JAMAIS d'action automatique sans consentement** — table `user_agent_permissions`
4. **TOUJOURS vérifier la BD avant d'écrire** — `information_schema.columns`, pas de suppositions
5. **TOUJOURS tester les flux E2E** — upload → dedup → wizard → extraction → validation

---

## 5. 📁 FICHIERS CLÉS

| Fichier | Rôle |
|---------|------|
| `packages/backend/app/modules/user_documents/api/user_documents_routes.py` | Endpoints vault (CRUD, upload, readiness, alerts) |
| `packages/backend/app/modules/user_documents/services/user_documents_service.py` | Import wizard, dedup, auto-archive |
| `packages/backend/app/modules/user_documents/services/proactive_agent_service.py` | Cron daily scan (expirations, missing docs) |
| `packages/backend/app/modules/user_documents/services/vault_registry.py` | Inscription centralisée docs générés |
| `packages/backend/app/modules/user_documents/repositories/user_documents_repository.py` | Data access (find_duplicate, create, archive) |
| `packages/backend/app/modules/service_requests/services/wizard_session_service.py` | Persist wizard → Firebase → vault import |
| `packages/backend/app/modules/service_requests/services/summary_pdf_service.py` | Gemini extraction + PDF generation |
| `packages/web/src/modules/user-documents/components/DocumentVault.tsx` | UI vault (4 onglets) |
| `packages/web/src/modules/user-documents/components/VaultDocumentPicker.tsx` | "Seleccionar del coffre" dans wizard |
| `packages/web/src/modules/user-documents/components/PersonalDocumentsGrid.tsx` | Onglet documents personnels |
| `packages/web/src/modules/user-documents/components/GeneratedDocumentsGrid.tsx` | Onglet documents générés |
| `packages/web/src/modules/user-documents/hooks/useDocumentUpload.ts` | Hook upload avec dedup frontend |

---

## 6. 🧪 VALIDATION

1. Upload DIP via wizard → vérifier hash calculé côté frontend
2. Ré-upload même DIP → vérifier blocage (pas de nouveau fichier Firebase)
3. Nouvelle demande passeport → vérifier DIP auto-sélectionné depuis vault
4. Upload document expiré → vérifier alerte dans vault
5. Readiness check → vérifier que tous docs requis sont détectés
6. Agent proactif → vérifier alertes créées pour docs expirants

---

## 7. 📨 PREMIER MESSAGE ATTENDU

Après worktree + lecture contexte :
1. Vérifier l'état actuel de la BD (user_documents, uploaded_files, service_request_documents)
2. Commencer par Phase 1 (déduplication stricte — le fondement de tout le reste)
3. Tester chaque phase avant de passer à la suivante
4. Commit local par phase, push après validation globale
