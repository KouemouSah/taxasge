# 📋 PLAN DE TRAVAIL - MODULE 03 : DÉCLARATIONS & SERVICES FISCAUX

**Version**: 1.1 (Mise à jour critique)
**Date Création**: 2025-01-12
**Statut**: 🟢 INFRASTRUCTURE 70% PRÊTE - Développement accéléré possible
**Dernière Mise à Jour**: 2025-11-13

## 🎉 DÉCOUVERTE MAJEURE (2025-11-13)

**Audit complet de l'infrastructure existante révèle :**
- ✅ **Architecture 3 niveaux 100% implémentée** (IVA/IRPF/Pétrolifères/Generic/Fiscal Services)
- ✅ **Firebase Storage entièrement configuré** (rules + service backend complet)
- ✅ **70% des tables critiques déjà en production** (7/10)
- ✅ **Seulement 3 tables manquantes** (au lieu de 10 initialement estimé)
- ✅ **Service Firebase Storage production-ready** (705 lignes avec sécurité complète)

**Impact Timeline :**
- Réduction estimée : **-50% durée Phase 0-1** (de 7-9 jours → 3-4 jours)
- Démarrage Phase 2 (Backend API) : **Immédiat après création 3 tables**
- Mise en production MVP : **Possible sous 3 semaines** (au lieu de 5-7 semaines)

---

## 📊 VUE D'ENSEMBLE

### Objectifs du Module
Implémenter le système complet de soumission de déclarations fiscales et de services fiscaux, incluant :
- Upload et traitement OCR de documents
- Workflows de validation par agents
- Système de paiement multi-banques
- Gestion des justificatifs

### Documents de Référence
- ✅ `FISCAL_DECLARATIONS_ARCHITECTURE.md` (2265 lignes analysées)
- ✅ `FINAL_ARCHITECTURE_4_LAYERS.md` (analyse partielle)
- ✅ `DATABASE_SCHEMA_REFERENCE.md` (54 tables)
- ✅ `fonctionnalités_core.md` (Module 3 - lignes 19-40)

### Contraintes Techniques
- **Firebase Storage** : `taxasge-dev.firebasestorage.app` configuré avec sous-dossiers
- **OCR** : Tesseract uniquement (pas Cloud Vision pour MVP)
- **Banques** : 5 banques configurées (BANGE, BGFI, CCEI, SGBGE, ECOBANK)
- **Architecture** : 3 niveaux (IVA/IRPF/Pétrolif

ères structurés, 7 autres JSONB, fiscal services séparés)

---

## 🎯 MÉTRIQUES DE VALIDATION GLOBALES

| Métrique | Objectif | Critique |
|----------|----------|----------|
| **Performance p95** | < 50ms queries | ✅ Critical |
| **Upload fichiers** | < 5s pour 10MB | ✅ Critical |
| **OCR Confidence** | > 75% moyenne | ⚠️ Important |
| **Taux validation 1er essai** | > 80% | ⚠️ Important |
| **Time to payment** | < 48h (déclarations) | ✅ Critical |
| **Disponibilité API** | > 99.5% | ✅ Critical |

---

## 📐 ARCHITECTURE 3 NIVEAUX (CRITIQUE)

### ⚠️ ANALYSE CRITIQUE

**PROBLÈME IDENTIFIÉ** : Le document propose 14 types de formulaires différents.

**DÉCISION ARCHITECTURALE** :
- ✅ **Niveau 1** : 3 tables structurées (IVA, IRPF, Pétrolifères) = 99% volume
- ✅ **Niveau 2** : 1 table JSONB (7 autres types) = <1% volume
- ✅ **Niveau 3** : fiscal_service_data (format différent)

**JUSTIFICATION** :
- Performance critique pour 99% des cas
- Évite surengineering (14 tables inutile)
- Flexibilité pour types rares
- Type safety avec GENERATED columns

---

## 🏗️ PHASES D'IMPLÉMENTATION

### PHASE 0 : PRÉPARATION & VALIDATION (CRITIQUE)

**Objectif** : Valider l'architecture avant développement

#### UC-00-01 : Analyse Critique du Schéma DB ✅ TERMINÉ
- **Status** : ✅ COMPLÉTÉ (2025-01-12)
- **Résultat** : DATABASE_SCHEMA_REFERENCE.md créé (175KB, 54 tables)
- **Tables critiques identifiées** :
  - `tax_declarations` (ligne 2265-2330)
  - `companies` (ligne 449-479)
  - `user_company_roles` (table de liaison)
  - `documents` (manquante - à créer selon FISCAL_DECLARATIONS_ARCHITECTURE.md ligne 1203-1291)

#### UC-00-02 : Validation Gaps Schéma ✅ TERMINÉ
- **Status** : ✅ COMPLÉTÉ (2025-11-13)
- **Tâches** :
  1. ✅ Comparer DATABASE_SCHEMA_REFERENCE.md vs FISCAL_DECLARATIONS_ARCHITECTURE.md
  2. ✅ Identifier tables manquantes critiques
  3. ✅ Vérifier implémentation actuelle dans Supabase
  4. ✅ Mettre à jour statut des tables
- **Résultat Analyse** : **BONNE NOUVELLE - 7/10 tables DÉJÀ IMPLÉMENTÉES** ✅
  - ✅ `bank_configurations` - **EXISTE** (ligne 308-338 DATABASE_SCHEMA_REFERENCE.md)
  - ✅ `declaration_iva_data` - **EXISTE** (ligne 664-711) - Niveau 1 architecture ✅
  - ✅ `declaration_irpf_data` - **EXISTE** (ligne 608-657) - Niveau 1 architecture ✅
  - ✅ `declaration_petroliferos_data` - **EXISTE** (ligne 728-763) - Niveau 1 architecture ✅
  - ✅ `declaration_data_generic` - **EXISTE** (ligne 565-600) - Niveau 2 architecture ✅
  - ✅ `fiscal_service_data` - **EXISTE** (ligne 850-875) - Niveau 3 architecture ✅
  - ✅ `declaration_amount_adjustments` - **EXISTE** (ligne 481-499) - Audit trail ✅
- **Tables RÉELLEMENT Manquantes** (3 seulement) :
  - ❌ `user_sessions` - CRITIQUE pour context preservation (ligne 1327-1366 FISCAL_DECLARATIONS_ARCHITECTURE.md)
  - ❌ `agent_work_queue` - CRITIQUE pour load balancing agents (ligne 1371-1406)
  - ❌ `document_processing_queue` - Important pour OCR retry logic (ligne 1296-1322)
- **Tables EXISTANTES avec noms alternatifs** :
  - ✅ `declaration_validation_audit` → Remplacée par `declaration_amount_adjustments` + `audit_logs`
  - ✅ `sessions` - **EXISTE** (ligne ~2100) - Peut remplacer `user_sessions` avec adaptation
- **Métriques** :
  - ✅ Tables manquantes identifiées : 3 (au lieu de 10)
  - ✅ Architecture 3 niveaux : **100% implémentée** 🎉
  - ❌ Migration SQL pour 3 tables manquantes : À créer
  - ❌ Tests migration : Non
- **Impact** : **Développement accéléré - 70% infrastructure déjà prête**
- **Prochaine Étape** : Créer migration uniquement pour 3 tables manquantes
- **Durée Révisée** : 0.5 jour (au lieu de 1 jour)

#### UC-00-03 : Configuration Firebase Storage ✅ TERMINÉ
- **Status** : ✅ COMPLÉTÉ (2025-11-13)
- **Tâches** :
  1. ✅ Valider buckets Firebase Storage existants
  2. ✅ Définir structure dossiers :
     ```
     STRUCTURE IMPLÉMENTÉE (storage.rules lignes 65-191):
     /user-documents/{userId}/{applicationId}/{fileName}     # Déclarations
     /profile-pictures/{userId}/{fileName}                   # Avatars
     /official-documents/{category}/{fileName}               # Templates
     /tax-forms/{formId}/{fileName}                          # Formulaires fiscaux
     /application-attachments/{applicationId}/{fileName}     # Justificatifs
     /temp-uploads/{userId}/{sessionId}/{fileName}           # Temporaires (15min)
     /reports/{reportType}/{fileName}                        # Rapports agents
     /audit-documents/{year}/{month}/{fileName}              # Audit admin

     SERVICE BACKEND IMPLÉMENTÉ (firebase_storage_service.py):
     - Organisation auto: {folder}/{user_id}/{YYYY/MM/DD}/{document_type}/{file_id}
     - Métadonnées automatiques: user_id, document_type, file_hash, uploaded_at
     - URLs signées 24h par défaut
     ```
  3. ✅ Configurer règles sécurité Firebase
  4. ✅ Service backend prêt
- **Métriques** :
  - ✅ Règles sécurité configurées : **OUI** (storage.rules 196 lignes)
  - ✅ Service Python créé : **OUI** (firebase_storage_service.py 705 lignes)
  - ✅ Limites fichiers configurées : 10MB max, 5MB documents, 2MB images
  - ✅ MIME types validés : PDF, DOC, DOCX, XLS, XLSX, JPEG, PNG, WEBP
  - ✅ Sécurité : isOwner(), isAdmin(), isOfficialUser() helpers
  - ✅ Antivirus : Extensions dangereuses (.exe, .bat, .cmd, .scr) bloquées
  - ✅ Retention : 365 jours configurable
  - ✅ Upload helper functions : upload_user_document(), upload_tax_attachment(), upload_app_asset()
- **Configuration Dev/Prod** :
  - **Dev** : `taxasge-dev.firebasestorage.app`
  - **Prod** : `taxasge-pro.firebasestorage.app`
  - **Auto-détection** : Variable d'environnement FIREBASE_STORAGE_BUCKET
- **Risques Mitigés** :
  - ✅ Règles Firebase granulaires par dossier (pas permissives)
  - ✅ Limites taille strictes (10MB max global)
  - ✅ Validation MIME type obligatoire
  - ✅ SHA-256 hash pour détection doublons
  - ✅ Metadata uploadedBy forcée = request.auth.uid
- **Tests Requis** :
  - ❌ Upload test déclaration PDF : À faire
  - ❌ OCR sur document uploadé : À faire
  - ❌ Génération reçu PDF : À faire
  - ❌ Test règles sécurité (unauthorized access) : À faire
- **Durée Réalisée** : Infrastructure déjà complète, tests restants = 0.3 jour

#### UC-00-04 : Configuration Tesseract OCR
- **Status** : 🔴 À FAIRE
- **Tâches** :
  1. ❌ Installer Tesseract backend (`apt-get install tesseract-ocr`)
  2. ❌ Installer langues (spa, fra, eng)
  3. ❌ Créer service OCR Python (`app/services/ocr_tesseract_service.py`)
  4. ❌ Tester reconnaissance sur formulaire IVA sample
  5. ❌ Mesurer confidence moyenne
- **Métriques** :
  - ❌ Tesseract installé : Non
  - ❌ Confidence moyenne > 75% : Non testé
  - ❌ Temps traitement < 3s : Non testé
- **Risques** :
  - 🔴 Confidence < 70% = user frustration (trop corrections manuelles)
  - ⚠️ Documents scannés basse qualité = OCR échoue
- **Durée Estimée** : 1 jour

---

### PHASE 1 : INFRASTRUCTURE & BACKEND (FONDATIONS)

**Durée Totale Estimée** : 5-7 jours
**Criticité** : ✅ CRITIQUE (bloque toute feature)

#### UC-01-01 : Migration Schéma Base de Données
- **Status** : 🔴 À FAIRE
- **Dépendances** : UC-00-02
- **Tâches** :
  1. ❌ Créer `migrations/001_add_declarations_tables.sql`
  2. ❌ Ajouter 10 tables manquantes identifiées
  3. ❌ Créer indexes optimisés (référence ligne 1148-1152 FISCAL_DECLARATIONS_ARCHITECTURE.md)
  4. ❌ Créer materialized views :
     - `agent_declarations_dashboard` (ligne 1482-1526)
     - `declarations_stats_by_type` (ligne 1528-1542)
  5. ❌ Créer fonctions DB :
     - `lock_declaration_for_agent()` (ligne 1549-1568)
     - `unlock_declaration_by_agent()` (ligne 1571-1586)
     - `auto_assign_declaration_to_agent()` (ligne 1589-1633)
     - `calculate_queue_priority()` (ligne 1636-1672)
  6. ❌ Exécuter migration sur DB dev
  7. ❌ Vérifier contraintes FK
- **Fichiers Créés** :
  - `packages/backend/migrations/001_add_declarations_tables.sql`
- **Métriques** :
  - ❌ Migration exécutée sans erreur : Non
  - ❌ 10 tables créées : 0/10
  - ❌ 4 fonctions DB créées : 0/4
  - ❌ 2 vues matérialisées créées : 0/2
  - ❌ Tests intégrité FK : Non
- **Validation** :
  ```sql
  -- Vérifier tables créées
  SELECT table_name FROM information_schema.tables
  WHERE table_schema = 'public' AND table_name LIKE '%declaration%';

  -- Vérifier fonctions
  SELECT proname FROM pg_proc WHERE proname LIKE '%declaration%';
  ```
- **Bloqueurs** : Aucun
- **Risques** :
  - 🔴 Erreur FK = rollback complet
  - ⚠️ Oubli index = performance dégradée
- **Durée Estimée** : 1-2 jours

#### UC-01-02 : Service Upload Fichiers (Firebase Storage)
- **Status** : 🔴 À FAIRE
- **Dépendances** : UC-00-03
- **Tâches** :
  1. ❌ Créer `app/services/firebase_storage_service.py`
  2. ❌ Implémenter `upload_file(user_id, file, category)`
  3. ❌ Implémenter validation fichiers :
     - Taille max : 50MB (ligne 1274 FISCAL_DECLARATIONS_ARCHITECTURE.md)
     - Types autorisés : PDF, JPG, PNG
     - Hash SHA256 pour déduplication (ligne 1224)
  4. ❌ Implémenter `get_file_url(file_id)`
  5. ❌ Implémenter `delete_file(file_id)`
  6. ❌ Créer endpoint API `POST /api/v1/files/upload`
  7. ❌ Tests unitaires (90% coverage)
- **Fichiers Créés** :
  - `packages/backend/app/services/firebase_storage_service.py`
  - `packages/backend/app/api/v1/files.py`
  - `packages/backend/tests/services/test_firebase_storage.py`
- **Métriques** :
  - ❌ Upload < 5s pour 10MB : Non testé
  - ❌ Déduplication hash fonctionne : Non
  - ❌ Validation rejette fichiers > 50MB : Non
  - ❌ Tests coverage > 90% : 0%
- **Validation** :
  ```python
  # Test upload
  file_url = await firebase_storage.upload_file(
      user_id="uuid",
      file=test_pdf,
      category="declarations"
  )
  assert file_url.startswith("https://firebasestorage")
  ```
- **Risques** :
  - 🔴 Upload fichiers malveillants (virus, scripts) = faille sécurité
  - ⚠️ Pas de scan antivirus = risque
- **Durée Estimée** : 1 jour

#### UC-01-03 : Service OCR Tesseract
- **Status** : 🔴 À FAIRE
- **Dépendances** : UC-00-04, UC-01-02
- **Tâches** :
  1. ❌ Créer `app/services/ocr_tesseract_service.py`
  2. ❌ Implémenter `extract_text(file_url, language='spa')`
  3. ❌ Implémenter preprocessing :
     - Deskew (redressement)
     - Denoising (réduction bruit)
     - Contrast enhancement
  4. ❌ Implémenter `extract_structured_fields(text, form_template_id)`
  5. ❌ Implémenter retry logic (ligne 841-907 FISCAL_DECLARATIONS_ARCHITECTURE.md)
  6. ❌ Créer queue background job (ligne 1296-1322)
  7. ❌ Tests avec formulaires réels
- **Fichiers Créés** :
  - `packages/backend/app/services/ocr_tesseract_service.py`
  - `packages/backend/app/workers/ocr_worker.py`
  - `packages/backend/tests/services/test_ocr_tesseract.py`
- **Métriques** :
  - ❌ Confidence moyenne > 75% : Non testé
  - ❌ Temps traitement < 3s : Non testé
  - ❌ Retry automatique fonctionne : Non
  - ❌ Dead letter queue après 3 échecs : Non
- **Validation** :
  ```python
  # Test OCR
  result = await ocr_service.extract_text(
      file_url="https://storage/.../iva_form.pdf",
      language="spa"
  )
  assert result.confidence > 0.75
  assert "Base Imponible" in result.text
  ```
- **Risques** :
  - 🔴 Confidence < 70% = trop de corrections manuelles
  - 🔴 Pas de retry = perte données si timeout
  - ⚠️ Queue bloquée = user attend indéfiniment
- **Durée Estimée** : 2 jours

#### UC-01-04 : Pattern Strategy - Bank Adapters
- **Status** : 🔴 À FAIRE
- **Dépendances** : UC-01-01
- **Tâches** :
  1. ❌ Créer interface abstraite `BankPaymentAdapter` (ligne 665-677)
  2. ❌ Implémenter 5 adapters :
     - `BANGEAdapter`
     - `BGFIAdapter`
     - `CCEIBankAdapter`
     - `SGBGEAdapter`
     - `ECOBANKAdapter`
  3. ❌ Créer `BankAdapterFactory` (ligne 700-720)
  4. ❌ Seed table `bank_configurations` (ligne 1440-1446)
  5. ❌ Implémenter idempotency keys (ligne 769-797)
  6. ❌ Tests mock API bancaires
- **Fichiers Créés** :
  - `packages/backend/app/adapters/bank_adapter.py`
  - `packages/backend/app/adapters/banks/bange_adapter.py` (×5)
  - `packages/backend/app/adapters/bank_adapter_factory.py`
  - `packages/backend/tests/adapters/test_bank_adapters.py`
- **Métriques** :
  - ❌ 5 adapters implémentés : 0/5
  - ❌ Idempotency empêche duplicates : Non testé
  - ❌ Timeout géré correctement : Non
  - ❌ Tests coverage > 85% : 0%
- **Validation** :
  ```python
  # Test adapter
  adapter = BankAdapterFactory.get_adapter('BANGE')
  txn_id = await adapter.initiate_payment({
      'amount': 102000,
      'payment_id': 'uuid'
  })
  assert txn_id.startswith('BANGE-TXN-')
  ```
- **Risques** :
  - 🔴 Pas d'idempotency = double paiement si retry
  - 🔴 Timeout non géré = user attend indéfiniment
  - ⚠️ Chaque banque a API différente = complexité
- **Durée Estimée** : 2 jours

#### UC-01-05 : Session Management (Context Preservation)
- **Status** : 🔴 À FAIRE
- **Dépendances** : UC-01-01
- **Tâches** :
  1. ❌ Créer service `app/services/session_service.py`
  2. ❌ Implémenter `save_context(session_id, context_data)`
  3. ❌ Implémenter `restore_context(session_id)`
  4. ❌ Créer middleware session tracking
  5. ❌ Implémenter cleanup expired sessions (cron)
  6. ❌ Tests avec paiement interrompu
- **Fichiers Créés** :
  - `packages/backend/app/services/session_service.py`
  - `packages/backend/app/middleware/session_middleware.py`
  - `packages/backend/tests/services/test_session.py`
- **Métriques** :
  - ❌ Context sauvegardé correctement : Non
  - ❌ Restore après déconnexion fonctionne : Non
  - ❌ Cleanup sessions expirées : Non
- **Validation** :
  ```python
  # User perd connexion pendant paiement
  await session_service.save_context(session_id, {
      'payment_draft': {...}
  })
  # User se reconnecte
  context = await session_service.restore_context(session_id)
  assert context['payment_draft'] is not None
  ```
- **Risques** :
  - ⚠️ Pas de context preservation = user doit tout ressaisir
- **Durée Estimée** : 1 jour

---

### PHASE 2 : WORKFLOW DÉCLARATIONS (BACKEND)

**Durée Totale Estimée** : 7-10 jours
**Criticité** : ✅ CRITIQUE

#### UC-02-01 : API Soumission Déclaration
- **Status** : 🔴 À FAIRE
- **Dépendances** : UC-01-01, UC-01-02, UC-01-03
- **Tâches** :
  1. ❌ Créer endpoint `POST /api/v1/declarations/submit`
  2. ❌ Validation formulaire selon type
  3. ❌ Calcul auto montants (GENERATED columns)
  4. ❌ Insertion dans table appropriée (IVA/IRPF/Pétrolif/Generic)
  5. ❌ Upload documents justificatifs
  6. ❌ Trigger OCR si document scanné
  7. ❌ Notification email user
  8. ❌ Tests e2e
- **Fichiers Créés** :
  - `packages/backend/app/api/v1/declarations.py`
  - `packages/backend/app/schemas/declaration_schemas.py`
  - `packages/backend/tests/api/test_declarations.py`
- **Métriques** :
  - ❌ Validation rejette données invalides : Non
  - ❌ Calculs auto corrects (IVA) : Non testé
  - ❌ OCR trigger automatique : Non
  - ❌ Email envoyé : Non
  - ❌ Tests e2e > 85% coverage : 0%
- **Validation** :
  ```python
  response = await client.post("/api/v1/declarations/submit", json={
      "declaration_type": "monthly_vat_standard",
      "tax_period": "2025-10",
      "data": {...}
  })
  assert response.status_code == 201
  assert response.json()['status'] == 'submitted'
  ```
- **Risques** :
  - 🔴 Calculs incorrects = montant erroné
  - ⚠️ OCR échoue silencieusement = données perdues
- **Durée Estimée** : 2 jours

#### UC-02-02 : API Validation Agent Déclaration
- **Status** : 🔴 À FAIRE
- **Dépendances** : UC-02-01
- **Tâches** :
  1. ❌ Créer endpoint `POST /api/v1/agents/declarations/{id}/lock`
  2. ❌ Implémenter fonction `lock_declaration_for_agent()`
  3. ❌ Créer endpoint `POST /api/v1/agents/declarations/{id}/approve`
  4. ❌ Créer endpoint `POST /api/v1/agents/declarations/{id}/reject`
  5. ❌ Créer endpoint `POST /api/v1/agents/declarations/{id}/request-modification`
  6. ❌ Audit trail complet (table `declaration_validation_audit`)
  7. ❌ Auto-unlock si lock expire (2h)
  8. ❌ Tests workflow complet
- **Fichiers Créés** :
  - `packages/backend/app/api/v1/agents/declarations.py`
  - `packages/backend/tests/api/test_agent_declarations.py`
- **Métriques** :
  - ❌ Lock empêche conflicts agents : Non
  - ❌ Auto-unlock après 2h fonctionne : Non
  - ❌ Audit trail enregistré : Non
  - ❌ Tests workflow > 90% : 0%
- **Validation** :
  ```python
  # Agent 1 lock déclaration
  response = await client.post(
      f"/api/v1/agents/declarations/{decl_id}/lock",
      headers={'Authorization': f'Bearer {agent1_token}'}
  )
  assert response.status_code == 200

  # Agent 2 essaie de lock → doit échouer
  response = await client.post(
      f"/api/v1/agents/declarations/{decl_id}/lock",
      headers={'Authorization': f'Bearer {agent2_token}'}
  )
  assert response.status_code == 409  # Conflict
  ```
- **Risques** :
  - 🔴 Pas de lock = 2 agents modifient simultanément
  - 🔴 Lock ne expire pas = déclaration bloquée indéfiniment
- **Durée Estimée** : 2 jours

#### UC-02-03 : API Paiement Déclaration
- **Status** : 🔴 À FAIRE
- **Dépendances** : UC-02-02, UC-01-04
- **Tâches** :
  1. ❌ Créer endpoint `POST /api/v1/declarations/{id}/pay`
  2. ❌ Vérifier status='approved' (bloque si pas approuvé)
  3. ❌ Appel bank adapter approprié
  4. ❌ Créer record `declaration_payments`
  5. ❌ Implémenter idempotency keys
  6. ❌ Créer webhook endpoint `POST /api/webhooks/bank-payment-confirmation`
  7. ❌ Update status declaration après paiement
  8. ❌ Tests idempotency
- **Fichiers Créés** :
  - `packages/backend/app/api/v1/declarations_payments.py`
  - `packages/backend/app/api/webhooks.py`
  - `packages/backend/tests/api/test_declaration_payments.py`
- **Métriques** :
  - ❌ Paiement bloqué si pas approuvé : Non
  - ❌ Idempotency empêche duplicates : Non
  - ❌ Webhook traité correctement : Non
  - ❌ Tests e2e paiement > 85% : 0%
- **Validation** :
  ```python
  # Essai paiement AVANT approbation → doit échouer
  response = await client.post(
      f"/api/v1/declarations/{decl_id}/pay",
      json={'bank_code': 'BANGE', ...}
  )
  assert response.status_code == 403

  # Agent approuve
  await approve_declaration(decl_id)

  # Paiement OK maintenant
  response = await client.post(...)
  assert response.status_code == 201
  ```
- **Risques** :
  - 🔴 Paiement possible sans approbation = fraude
  - 🔴 Pas d'idempotency = double paiement
  - 🔴 Webhook non traité = paiement validé mais DB pas à jour
- **Durée Estimée** : 2 jours

#### UC-02-04 : Agent Work Queue (Auto-Assignment)
- **Status** : 🔴 À FAIRE
- **Dépendances** : UC-01-01
- **Tâches** :
  1. ❌ Créer service `app/services/agent_queue_service.py`
  2. ❌ Implémenter `calculate_priority_score()` (ligne 1636-1672)
  3. ❌ Implémenter `auto_assign_to_agent()` (ligne 1585-1633)
  4. ❌ Créer dashboard agent API `GET /api/v1/agents/queue`
  5. ❌ Créer background job assignation auto
  6. ❌ Tests priorité urgence/montant/SLA
- **Fichiers Créés** :
  - `packages/backend/app/services/agent_queue_service.py`
  - `packages/backend/app/workers/agent_assignment_worker.py`
  - `packages/backend/tests/services/test_agent_queue.py`
- **Métriques** :
  - ❌ Priorité calculée correctement : Non
  - ❌ Auto-assignment fonctionne : Non
  - ❌ Load balancing agents : Non testé
  - ❌ Tests > 85% : 0%
- **Validation** :
  ```python
  # Déclaration urgente (SLA < 3j) + gros montant
  decl = await create_declaration(
      due_date=datetime.now() + timedelta(days=2),
      amount=10_000_000
  )

  # Auto-assignment doit attribuer à agent dispo
  assigned = await agent_queue.auto_assign()
  assert assigned == decl.id

  # Priorité doit être élevée (>100)
  priority = await calculate_priority_score('declaration', decl.id)
  assert priority > 100
  ```
- **Risques** :
  - ⚠️ Mauvais calcul priorité = déclarations urgentes ignorées
  - ⚠️ Pas de load balancing = 1 agent surchargé
- **Durée Estimée** : 1.5 jour

---

### PHASE 3 : FRONTEND DÉCLARATIONS

**Durée Totale Estimée** : 8-10 jours
**Criticité** : ✅ CRITIQUE

#### UC-03-01 : Page Liste Déclarations
- **Status** : 🔴 À FAIRE
- **Dépendances** : UC-02-01
- **Tâches** :
  1. ❌ Créer `/dashboard/declarations/page.tsx`
  2. ❌ Afficher liste déclarations user
  3. ❌ Filtres : type, période, status
  4. ❌ Badges status colorés
  5. ❌ Timeline workflow (submitted → approved → paid → closed)
  6. ❌ Actions : Voir détails, Payer (si approved), Modifier (si requires_modification)
- **Fichiers Créés** :
  - `packages/web/src/app/dashboard/declarations/page.tsx`
  - `packages/web/src/components/declarations/DeclarationsList.tsx`
  - `packages/web/src/components/declarations/DeclarationStatusBadge.tsx`
- **Métriques** :
  - ❌ Liste affichée < 1s : Non
  - ❌ Filtres fonctionnent : Non
  - ❌ Timeline claire : Non
- **Durée Estimée** : 1 jour

#### UC-03-02 : Formulaire IVA (Niveau 1 - 90% volume)
- **Status** : 🔴 À FAIRE
- **Dépendances** : UC-02-01, UC-01-03
- **Tâches** :
  1. ❌ Créer `/dashboard/declarations/new/iva/page.tsx`
  2. ❌ Formulaire structuré (68 champs IVA-REAL.pdf)
  3. ❌ Auto-calculs :
     - Total IVA devengado (03+06+09+...)
     - Total déductible (022+023+...)
     - Total à payer (021-028)
  4. ❌ Option upload formulaire scanné
  5. ❌ Interface validation côte-à-côte (scan vs form)
  6. ❌ Sauvegarde brouillon (context_data session)
  7. ❌ Validation frontend (montants > 0, cohérence)
- **Fichiers Créés** :
  - `packages/web/src/app/dashboard/declarations/new/iva/page.tsx`
  - `packages/web/src/components/declarations/forms/IVAForm.tsx`
  - `packages/web/src/components/declarations/forms/IVAOCRValidation.tsx`
- **Métriques** :
  - ❌ Auto-calculs corrects : Non testé
  - ❌ OCR pre-fill < 10s : Non
  - ❌ Sauvegarde brouillon fonctionne : Non
  - ❌ Validation empêche soumission invalide : Non
- **Validation** :
  ```tsx
  // User saisit base 15%
  <Input value={1500000} onChange={...} />
  // Cuota 15% doit se calculer auto
  expect(cuota_15).toBe(225000)
  ```
- **Risques** :
  - 🔴 Auto-calculs incorrects = montant erroné déclaré
  - ⚠️ OCR trop lent (>15s) = user abandonne
- **Durée Estimée** : 3 jours

#### UC-03-03 : Formulaire IRPF (Niveau 1)
- **Status** : 🔴 À FAIRE
- **Dépendances** : UC-02-01
- **Durée Estimée** : 2 jours

#### UC-03-04 : Formulaire Pétrolifères (Niveau 1)
- **Status** : 🔴 À FAIRE
- **Dépendances** : UC-02-01
- **Durée Estimée** : 2 jours

#### UC-03-05 : Page Paiement Déclaration
- **Status** : 🔴 À FAIRE
- **Dépendances** : UC-02-03
- **Tâches** :
  1. ❌ Créer `/dashboard/declarations/{id}/pay/page.tsx`
  2. ❌ Vérifier status='approved' (redirect sinon)
  3. ❌ Sélecteur 5 banques
  4. ❌ Affichage compte trésor auto (selon banque)
  5. ❌ Formulaire détails paiement
  6. ❌ Confirmation + idempotency key génération
  7. ❌ Loader pendant traitement
  8. ❌ Redirect vers reçu après success
- **Fichiers Créés** :
  - `packages/web/src/app/dashboard/declarations/[id]/pay/page.tsx`
  - `packages/web/src/components/payments/BankSelector.tsx`
  - `packages/web/src/components/payments/PaymentForm.tsx`
- **Métriques** :
  - ❌ Paiement bloqué si pas approved : Non
  - ❌ Idempotency key générée : Non
  - ❌ Loader UX correct : Non
- **Durée Estimée** : 1.5 jour

---

### PHASE 4 : DASHBOARD AGENTS

**Durée Totale Estimée** : 5-7 jours
**Criticité** : ✅ CRITIQUE

#### UC-04-01 : Dashboard Agent Queue
- **Status** : 🔴 À FAIRE
- **Dépendances** : UC-02-04
- **Tâches** :
  1. ❌ Créer `/dashboard/agent/queue/page.tsx`
  2. ❌ Afficher vue matérialisée `agent_declarations_dashboard`
  3. ❌ Filtres : urgent, montant élevé, type
  4. ❌ Tri : priorité, SLA
  5. ❌ Actions : Lock & Review
  6. ❌ Auto-refresh 30s
- **Fichiers Créés** :
  - `packages/web/src/app/dashboard/agent/queue/page.tsx`
  - `packages/web/src/components/agent/AgentQueue.tsx`
- **Métriques** :
  - ❌ Liste chargée < 500ms : Non
  - ❌ Auto-refresh fonctionne : Non
  - ❌ Filtres performants : Non
- **Durée Estimée** : 1.5 jour

#### UC-04-02 : Page Review Déclaration (Agent)
- **Status** : 🔴 À FAIRE
- **Dépendances** : UC-02-02
- **Tâches** :
  1. ❌ Créer `/dashboard/agent/declarations/{id}/review/page.tsx`
  2. ❌ Affichage données structurées
  3. ❌ Visualiseur documents justificatifs
  4. ❌ Historique déclarations user (comparaison N vs N-1)
  5. ❌ Actions : Approve, Reject, Request Modification
  6. ❌ Formulaire commentaire
  7. ❌ Lock auto-release si agent quitte page
- **Fichiers Créés** :
  - `packages/web/src/app/dashboard/agent/declarations/[id]/review/page.tsx`
  - `packages/web/src/components/agent/DeclarationReviewPanel.tsx`
  - `packages/web/src/components/agent/DocumentViewer.tsx`
- **Métriques** :
  - ❌ Lock/unlock automatique : Non
  - ❌ Visualiseur PDF fonctionne : Non
  - ❌ Actions agent enregistrées : Non
- **Durée Estimée** : 2.5 jours

#### UC-04-03 : Dashboard Analytics Agent
- **Status** : 🔴 À FAIRE
- **Dépendances** : UC-02-02
- **Tâches** :
  1. ❌ Créer `/dashboard/agent/analytics/page.tsx`
  2. ❌ Graphiques :
     - Déclarations validées (par jour/semaine)
     - Temps moyen traitement
     - Taux approbation vs rejet
     - Top types déclarations
  3. ❌ Utiliser vue `declarations_stats_by_type`
- **Fichiers Créés** :
  - `packages/web/src/app/dashboard/agent/analytics/page.tsx`
  - `packages/web/src/components/agent/AnalyticsCharts.tsx`
- **Métriques** :
  - ❌ Graphiques chargés < 1s : Non
  - ❌ Données exactes (vs DB) : Non testé
- **Durée Estimée** : 1.5 jour

---

## 🚨 RISQUES CRITIQUES IDENTIFIÉS

### RISQUE-01 : Double Paiement (Idempotency)
- **Probabilité** : 🔴 ÉLEVÉE
- **Impact** : 🔴 CRITIQUE
- **Mitigation** :
  - ✅ Idempotency keys obligatoires (UC-01-04)
  - ✅ Contrainte UNIQUE DB sur idempotency_key
  - ❌ Tests e2e retry paiement
- **Status** : 🔴 NON MITIGÉ

### RISQUE-02 : OCR Confidence < 70%
- **Probabilité** : ⚠️ MOYENNE
- **Impact** : ⚠️ MOYEN
- **Mitigation** :
  - ✅ Preprocessing images (deskew, denoise)
  - ✅ Interface validation côte-à-côte
  - ❌ Fallback AI extraction (Claude Vision) si confidence < 60%
- **Status** : ⚠️ PARTIELLEMENT MITIGÉ

### RISQUE-03 : Paiement Sans Approbation Agent
- **Probabilité** : 🔴 ÉLEVÉE (si pas contrôle)
- **Impact** : 🔴 CRITIQUE
- **Mitigation** :
  - ✅ Check status='approved' backend (UC-02-03)
  - ✅ Bouton "Payer" disabled frontend si pas approved
  - ✅ Tests e2e workflow complet
- **Status** : 🟢 MITIGÉ (si UC-02-03 implémenté correctement)

### RISQUE-04 : Lock Déclaration Ne Expire Pas
- **Probabilité** : ⚠️ MOYENNE
- **Impact** : ⚠️ MOYEN
- **Mitigation** :
  - ✅ Fonction `cleanup_expired_declaration_locks()` (ligne 1704-1720)
  - ✅ Cron job every 30min
  - ❌ Tests auto-unlock
- **Status** : ⚠️ PARTIELLEMENT MITIGÉ

### RISQUE-05 : Firebase Storage Faille Sécurité
- **Probabilité** : 🔴 ÉLEVÉE
- **Impact** : 🔴 CRITIQUE
- **Mitigation** :
  - ✅ Règles Firebase restrictives (UC-00-03)
  - ✅ Validation type fichier backend
  - ❌ Scan antivirus fichiers uploadés
- **Status** : ⚠️ PARTIELLEMENT MITIGÉ

---

## 📅 PLANNING PRÉVISIONNEL

### Sprint 1 (Semaine 1-2) : Infrastructure
- UC-00-02 : Validation Gaps Schéma (1j)
- UC-00-03 : Config Firebase Storage (0.5j)
- UC-00-04 : Config Tesseract (1j)
- UC-01-01 : Migration Schéma DB (1-2j)
- UC-01-02 : Service Upload Fichiers (1j)
- UC-01-03 : Service OCR Tesseract (2j)
- **Total** : 6.5-7.5 jours

### Sprint 2 (Semaine 3) : Backend Core
- UC-01-04 : Bank Adapters (2j)
- UC-01-05 : Session Management (1j)
- UC-02-01 : API Soumission Déclaration (2j)
- **Total** : 5 jours

### Sprint 3 (Semaine 4) : Backend Workflow
- UC-02-02 : API Validation Agent (2j)
- UC-02-03 : API Paiement Déclaration (2j)
- UC-02-04 : Agent Work Queue (1.5j)
- **Total** : 5.5 jours

### Sprint 4 (Semaine 5-6) : Frontend Déclarations
- UC-03-01 : Page Liste Déclarations (1j)
- UC-03-02 : Formulaire IVA (3j)
- UC-03-03 : Formulaire IRPF (2j)
- UC-03-04 : Formulaire Pétrolifères (2j)
- UC-03-05 : Page Paiement (1.5j)
- **Total** : 9.5 jours

### Sprint 5 (Semaine 7) : Dashboard Agents
- UC-04-01 : Dashboard Agent Queue (1.5j)
- UC-04-02 : Page Review Déclaration (2.5j)
- UC-04-03 : Dashboard Analytics (1.5j)
- **Total** : 5.5 jours

**DURÉE TOTALE ESTIMÉE** : 32-34 jours (~7 semaines)

---

## 📝 NOTES & DÉCISIONS ARCHITECTURALES

### NOTE-01 : Architecture 3 Niveaux Validée
- **Date** : 2025-01-12
- **Décision** : Adopter architecture 3 niveaux (IVA/IRPF/Pétrolifères structurés, 7 autres JSONB, fiscal services séparés)
- **Justification** : Performance critique 99% volume, évite overengineering 14 tables
- **Impact** : UC-01-01 doit créer 5 tables data (pas 14)

### NOTE-02 : Tesseract Uniquement pour MVP
- **Date** : 2025-01-12
- **Décision** : OCR Tesseract uniquement (pas Cloud Vision/Claude Vision)
- **Justification** : Coût 0, suffisant pour MVP (75%+ confidence)
- **Fallback** : Si confidence < 60%, escalade à AI Vision (futur)
- **Impact** : UC-01-03 implémente Tesseract only

### NOTE-03 : Firebase Storage (Pas Supabase Storage)
- **Date** : 2025-01-12
- **Décision** : Utiliser Firebase Storage déjà configuré (`taxasge-dev.firebasestorage.app`)
- **Justification** : Déjà en place, évite double intégration
- **Impact** : UC-01-02 utilise Firebase SDK

### NOTE-04 : Pas de Table `documents` Polymorphe Générique
- **Date** : 2025-01-12
- **Décision** : FISCAL_DECLARATIONS_ARCHITECTURE.md propose table `documents` polymorphe (ligne 1203-1291), mais DATABASE_SCHEMA_REFERENCE.md ne l'a pas
- **Question** : Créer cette table ou utiliser approche différente ?
- **Recommandation** : ✅ Créer table `documents` selon spec (critique pour OCR)
- **Impact** : UC-01-01 doit inclure table `documents`

---

## ✅ CHECKLIST AVANT DÉMARRAGE PHASE 1

- [ ] DATABASE_SCHEMA_REFERENCE.md consulté et compris
- [ ] 10 tables manquantes identifiées et validées
- [ ] Firebase Storage buckets validés et testés
- [ ] Tesseract installé sur environnement dev
- [ ] 5 API keys banques obtenues (ou mocks créés)
- [ ] Équipe validée architecture 3 niveaux
- [ ] Tests e2e environment configuré
- [ ] CI/CD pipeline prêt pour déploiement continu

---

**Document Vivant** : Ce plan sera mis à jour après chaque UC complétée.

**Prochaine Action** : Valider UC-00-02 (Validation Gaps Schéma) avant démarrage Phase 1.
