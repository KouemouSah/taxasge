# UC-DOC-004 : Delete Document - Suppression Document

## 1. Métadonnées
- **ID** : UC-DOC-004
- **Endpoint** : `DELETE /documents/{id}`
- **Méthode** : DELETE
- **Auth requise** : ✅ Oui
- **Priorité** : MOYENNE
- **Statut implémentation** : ✅ IMPLÉMENTÉ (80%)
- **Acteurs** : Citizen, Business, Admin
- **Dépend de** : UC-DOC-001 (document doit exister)

---

## 2. Description Métier

### Contexte
Un utilisateur souhaite supprimer un document uploadé par erreur, obsolète, ou contenant des données incorrectes. La suppression doit être **soft delete** (marquage comme supprimé) pour permettre récupération ultérieure et traçabilité audit.

**Cas d'usage** :
1. **Document uploadé par erreur** (mauvais fichier)
2. **Document en doublon** (re-upload du même fichier)
3. **Document obsolète** (remplacé par nouvelle version)
4. **Demande RGPD** (droit à l'oubli - hard delete après 30j)

### Problème
- Permettre suppression tout en conservant traçabilité
- Éviter perte accidentelle de données importantes
- Respecter contraintes légales (conservation fiscale 5 ans)
- Gérer suppression en cascade (annotations, validations)

### Objectif
- Soft delete par défaut (flag `deleted_at`)
- Hard delete SEULEMENT si admin ET > 30 jours depuis soft delete
- Empêcher suppression si document lié à déclaration validée
- Conserver métadonnées minimales pour audit (90 jours)

### Workflow Détaillé
```
1. User/Admin demande DELETE /documents/{document_id}

2. Backend vérifie authentification
   → Token JWT valide ?

3. Backend récupère document
   → SELECT * FROM uploaded_files WHERE id = {document_id}
   → Document existe ?

4. Backend vérifie RBAC permissions :
   ├─ User : document.user_id == current_user.id ?
   ├─ Admin : Toujours autorisé (avec confirmation)
   └─ Agent : NON autorisé (403 Forbidden)
   
   Si permission refusée → 403 Forbidden

5. Backend vérifie contraintes business :
   
   a) Document lié à déclaration validée ?
      → SELECT status FROM declarations 
         WHERE id = document.related_to_id
      → Si status = 'validated' OU 'approved' :
         → 422 Unprocessable (cannot delete)
   
   b) Document en cours d'OCR ?
      → Si ocr_status = 'processing' :
         → Annuler job OCR d'abord
   
   c) Document déjà supprimé ?
      → Si deleted_at IS NOT NULL :
         → 410 Gone (already deleted)

6. Backend effectue SOFT DELETE :
   
   → UPDATE uploaded_files SET
       deleted_at = NOW(),
       deleted_by = current_user.id,
       deletion_reason = request.reason
     WHERE id = {document_id}
   
   → Fichier reste dans Firebase Storage (flag metadata)
   → Données OCR conservées (marquées deleted)
   → Annotations conservées (historique)

7. Backend invalide cache Redis :
   → DEL "document:{document_id}"

8. Backend enregistre audit :
   → INSERT INTO audit_logs (
       action: 'document_deleted',
       document_id,
       user_id,
       deletion_type: 'soft'
     )

9. Backend notifie user (email optionnel) :
   → "Document supprimé. Récupérable sous 30 jours."

10. Return response succès

11. Tâche CRON (chaque nuit) :
    → Hard delete documents supprimés > 30 jours
    → DELETE FROM uploaded_files WHERE deleted_at < NOW() - 30 days
    → DELETE FROM Firebase Storage
```

### Cas Spéciaux

#### Cas 1 : Hard Delete (Admin seulement)
```
Query parameter : ?hard_delete=true

Conditions :
- current_user.role = 'admin'
- document.deleted_at < NOW() - 30 days (déjà soft deleted)
- Confirmation explicite requise

Actions :
1. DELETE FROM uploaded_files WHERE id = {document_id}
2. DELETE FROM ocr_extraction_results WHERE uploaded_file_id = {document_id}
3. DELETE FROM document_annotations WHERE document_id = {document_id}
4. DELETE Firebase Storage file
5. Audit log avec raison RGPD/demande utilisateur
```

#### Cas 2 : Restauration (Annuler Suppression)
```
Endpoint dédié : POST /documents/{id}/restore
Disponible : UC-DOC-021 (à développer)

Conditions :
- deleted_at < NOW() - 30 days (pas encore hard deleted)
- User propriétaire OU admin

Actions :
1. UPDATE uploaded_files SET deleted_at = NULL
2. Restaurer visibilité fichier
```

---

## 3. Given/When/Then

### Scénario 1 : User Supprime Son Document

```gherkin
Given un utilisateur authentifié (user_id = "user-123")
  And un document uploadé par cet utilisateur (DOC-2025-abc123)
  And le document N'EST PAS lié à déclaration validée
  And le document n'est PAS déjà supprimé

When l'utilisateur demande DELETE /documents/DOC-2025-abc123
  And optionnel : reason = "Uploaded wrong file"

Then le système effectue SOFT DELETE :
  - UPDATE uploaded_files.deleted_at = NOW()
  - UPDATE uploaded_files.deleted_by = "user-123"
  - Fichier reste dans Firebase (flag deleted)
  - Cache Redis invalidé
  
And retourne 200 OK avec :
  - message: "Document deleted successfully"
  - recoverable: true
  - recovery_deadline: NOW() + 30 days
  
And audit log créé : action = "document_deleted"
```

### Scénario 2 : Suppression Refusée (Document Validé)

```gherkin
Given un document lié à déclaration validée
  And declaration.status = "approved"

When l'utilisateur tente de supprimer le document

Then le système retourne 422 Unprocessable
  And message: "Cannot delete document linked to validated declaration"
  And suggestion: "Create new declaration to replace this one"
```

### Scénario 3 : Admin Hard Delete (RGPD)

```gherkin
Given un admin authentifié
  And un document soft deleted il y a 35 jours
  And query parameter : hard_delete=true
  And confirmation RGPD fournie

When l'admin demande DELETE /documents/{id}?hard_delete=true

Then le système effectue HARD DELETE :
  - DELETE FROM uploaded_files
  - DELETE FROM ocr_extraction_results
  - DELETE Firebase Storage file
  - Conserver audit minimal (document_id, date, raison)
  
And retourne 200 OK avec :
  - message: "Document permanently deleted (RGPD compliance)"
  - recoverable: false
```

### Scénario 4 : Agent Tente de Supprimer (Refusé)

```gherkin
Given un agent authentifié
  And un document uploadé par un citoyen

When l'agent tente DELETE /documents/{id}

Then le système retourne 403 Forbidden
  And message: "Agents cannot delete documents. Contact admin if needed."
```

---

## 4. Requête HTTP

### Soft Delete (défaut)
```http
DELETE /api/v1/documents/DOC-2025-abc123xyz HTTP/1.1
Host: api.taxasge.gq
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "reason": "Uploaded wrong file"
}
```

### Hard Delete (admin)
```http
DELETE /api/v1/documents/DOC-2025-abc123xyz?hard_delete=true HTTP/1.1
Authorization: Bearer eyJadmin_token...
Content-Type: application/json

{
  "reason": "RGPD deletion request",
  "confirmation": "I understand this is permanent"
}
```

### Query Parameters

| Paramètre | Type | Obligatoire | Description |
|-----------|------|-------------|-------------|
| `hard_delete` | Boolean | ❌ Non | true = hard delete (admin only) |

### Body Parameters

| Paramètre | Type | Obligatoire | Description |
|-----------|------|-------------|-------------|
| `reason` | String | ❌ Non | Raison suppression (audit) |
| `confirmation` | String | ⚠️ Si hard_delete | "I understand this is permanent" |

---

## 5. Réponse Succès

### Cas 1 : Soft Delete Réussi

**Response contient** :
- `success`: true
- `data.document_id`: "DOC-2025-abc123xyz"
- `data.filename`: "declaration_irpf_2024.pdf"
- `data.deletion_type`: "soft"
- `data.deleted_at`: "2025-10-31T16:00:00Z"
- `data.deleted_by.user_id`: "user-123"
- `data.deleted_by.full_name`: "Jean Dupont"
- `data.reason`: "Uploaded wrong file"
- `data.recoverable`: true
- `data.recovery_deadline`: "2025-11-30T16:00:00Z" (30 jours)
- `data.recovery_endpoint`: "POST /documents/DOC-2025-abc123xyz/restore"
- `message`: "Document deleted successfully. Recoverable until 2025-11-30."

**Headers** :
- `X-Deletion-Type`: "soft"
- `X-Recovery-Deadline`: "2025-11-30T16:00:00Z"

### Cas 2 : Hard Delete Réussi (Admin)

**Response contient** :
- `success`: true
- `data.document_id`: "DOC-2025-abc123xyz"
- `data.deletion_type`: "hard"
- `data.deleted_at`: "2025-10-31T16:00:00Z"
- `data.deleted_by.user_id`: "admin-001"
- `data.reason`: "RGPD deletion request"
- `data.recoverable`: false
- `data.audit_retained`: true
- `data.audit_retention_period`: "90 days"
- `warning`: "⚠️ This action is PERMANENT and cannot be undone"
- `message`: "Document permanently deleted (RGPD compliance)"

**Headers** :
- `X-Deletion-Type`: "hard"
- `X-Audit-Retention`: "90-days"

### Cas 3 : Soft Delete avec OCR en Cours

**Response contient** :
- `success`: true
- `data.document_id`: "DOC-2025-def456"
- `data.deletion_type`: "soft"
- `data.ocr_job_cancelled`: true
- `data.ocr_status`: "cancelled"
- `message`: "Document deleted. OCR processing cancelled."

---

## 6. Gestion Erreurs

| Code | Scénario | Message | Action |
|------|----------|---------|--------|
| 400 | ID invalide | Invalid document ID format | Corriger format |
| 400 | Hard delete sans confirmation | Confirmation required for hard delete | Fournir confirmation |
| 401 | Non authentifié | Authorization required | Se connecter |
| 403 | Agent tente supprimer | Agents cannot delete documents | Contacter admin |
| 403 | Hard delete non-admin | Only admins can perform hard delete | Se connecter comme admin |
| 404 | Document non trouvé | Document not found | Vérifier ID |
| 410 | Déjà supprimé | Document already deleted | Utiliser /restore si < 30j |
| 422 | Lié déclaration validée | Cannot delete document linked to validated declaration | Créer nouvelle déclaration |
| 422 | Hard delete trop tôt | Document must be soft deleted for 30 days before hard delete | Attendre deadline |
| 500 | Erreur Firebase | Failed to delete file from storage | Réessayer / Contacter support |

**Note** : En cas d'erreur partielle (fichier DB supprimé mais Firebase échoué), système retry automatique via job CRON.

---

## 7. Métriques Techniques

### Latence
- **P50** : < 150ms (soft delete)
- **P95** : < 300ms
- **P99** : < 500ms (hard delete avec cascade)

### Throughput
- **Moyenne** : ~10-20 suppressions/heure
- **Pics** : ~50 suppressions/heure (utilisateurs découvrent erreur upload)

### Taux Succès
- **Cible** : > 99%
- **Échecs courants** : 422 (lié déclaration validée) ~5-10%

### Suppressions par Type

**Distribution estimée** :
- Soft delete : 95%
- Hard delete (admin) : 5%

**Taux restauration** (dans 30j) : ~15-20%

---

## 8. KPIs Métier

### Taux suppression documents
```
Formule : (Documents supprimés / Total documents uploadés) × 100
Cible : < 5%
Insight : Si > 10% → Problème UX upload (users uploadent mauvais fichiers)
```

### Taux restauration
```
Formule : (Documents restaurés / Documents supprimés) × 100
Actuel : 15-20%
Insight : Soft delete utile (users changent d'avis)
```

### Délai moyen suppression après upload
```
Formule : AVG(deleted_at - uploaded_at)
Insight : 
- < 5 minutes → Erreur immédiate (mauvais fichier)
- 1-24h → Découverte erreur plus tard
- > 7j → Document obsolète/remplacé
```

### Documents orphelins (supprimés accidentellement)
```
Formule : COUNT(documents WHERE deleted_at NOT NULL AND related_to_id IS NULL)
Alerte : > 50 documents/mois
Action : Améliorer workflow de confirmation suppression
```

---

## 9. Instrumentation

**Métriques Prometheus** :

```python
document_deletions_total = Counter(
    'document_deletions_total',
    'Total document deletions',
    ['deletion_type', 'user_role']  # soft/hard, citizen/admin
)

document_deletion_reasons = Counter(
    'document_deletion_reasons_total',
    'Document deletion reasons distribution',
    ['reason_category']  # wrong_file, duplicate, obsolete, rgpd
)

document_delete_duration = Histogram(
    'document_delete_duration_seconds',
    'Document deletion duration',
    ['deletion_type'],
    buckets=[0.1, 0.2, 0.3, 0.5, 1.0]
)

document_restorations_total = Counter(
    'document_restorations_total',
    'Documents restored after soft delete'
)

document_delete_errors = Counter(
    'document_delete_errors_total',
    'Document deletion errors',
    ['error_code']  # linked_to_validated, permission_denied, etc.
)
```

---

## 10. Sécurité

### RBAC - Règles Suppression

| Rôle | Soft Delete | Hard Delete | Conditions |
|------|-------------|-------------|------------|
| **Citizen/Business** | ✅ Oui | ❌ Non | Seulement ses propres documents |
| **Agent** | ❌ Non | ❌ Non | Doit demander admin |
| **Supervisor** | ⚠️ Limité | ❌ Non | Documents de son ministère (avec approbation) |
| **Admin** | ✅ Oui | ✅ Oui | Tous documents (avec confirmation hard delete) |

### Contraintes Business

**Empêcher suppression si** :
1. Document lié à déclaration `status IN ('validated', 'approved', 'paid')`
2. Document requis pour audit fiscal (moins de 5 ans)
3. Document lié à litige en cours
4. Document utilisé comme pièce jointe dans correspondance officielle

**Workflow validation** :
```
AVANT suppression :
1. Check declaration status
2. Check audit requirements (fiscal year < CURRENT_YEAR - 5)
3. Check litigation status
4. Si au moins 1 contrainte → 422 Unprocessable
```

### Audit Logging Renforcé

Pour hard delete, audit DOIT conserver :
```
{
  "action": "document_hard_deleted",
  "document_id": "DOC-2025-abc123",
  "original_filename": "declaration_irpf_2024.pdf",
  "user_id_owner": "user-123",
  "deleted_by_admin": "admin-001",
  "reason": "RGPD deletion request",
  "original_upload_date": "2025-10-31T14:30:00Z",
  "soft_deleted_date": "2025-11-05T10:00:00Z",
  "hard_deleted_date": "2025-12-06T09:00:00Z",
  "days_since_soft_delete": 31,
  "legal_retention_checked": true,
  "audit_retention_days": 90
}
```

### Rate Limiting
```
User : 10 suppressions/heure (protection accident)
Admin : 50 suppressions/heure
```

### Confirmation Hard Delete (Admin)

Pour hard delete, admin DOIT :
1. Cocher confirmation UI : "Je comprends que c'est permanent"
2. Fournir raison détaillée (min 20 caractères)
3. Si > 100 documents → Validation par 2 admins (4-eyes principle)

---

## 11. Workflow Récapitulatif

### Workflow Soft Delete (User)
```
┌────────────────────────────────────────────────┐
│ 1. User Request                                │
│    DELETE /documents/DOC-2025-abc123           │
│    Body: { reason: "Wrong file" }              │
└─────────────┬──────────────────────────────────┘
              │
              ▼
┌────────────────────────────────────────────────┐
│ 2. Auth + RBAC Check                           │
│    - Verify JWT token                          │
│    - Check document.user_id == current_user.id │
│    ✅ Permission granted                        │
└─────────────┬──────────────────────────────────┘
              │
              ▼
┌────────────────────────────────────────────────┐
│ 3. Fetch Document Metadata                     │
│    SELECT * FROM uploaded_files                │
│    WHERE id = 'DOC-2025-abc123'                │
│    → Document found                            │
└─────────────┬──────────────────────────────────┘
              │
              ▼
┌────────────────────────────────────────────────┐
│ 4. Check Business Constraints                  │
│    a) Linked to validated declaration?         │
│       SELECT status FROM declarations          │
│       WHERE id = document.related_to_id        │
│       → status = 'draft' ✅ OK to delete        │
│                                                │
│    b) Already deleted?                         │
│       deleted_at IS NULL ✅ Not deleted yet     │
│                                                │
│    c) OCR in progress?                         │
│       ocr_status = 'completed' ✅ No issue      │
└─────────────┬──────────────────────────────────┘
              │
              ▼
┌────────────────────────────────────────────────┐
│ 5. Perform SOFT DELETE                         │
│    UPDATE uploaded_files SET                   │
│      deleted_at = NOW(),                       │
│      deleted_by = 'user-123',                  │
│      deletion_reason = 'Wrong file'            │
│    WHERE id = 'DOC-2025-abc123'                │
│    → 1 row updated                             │
└─────────────┬──────────────────────────────────┘
              │
              ▼
┌────────────────────────────────────────────────┐
│ 6. Update Firebase Metadata                    │
│    SET file.metadata.deleted = true            │
│    (File NOT physically deleted)               │
└─────────────┬──────────────────────────────────┘
              │
              ▼
┌────────────────────────────────────────────────┐
│ 7. Invalidate Cache                            │
│    DEL "document:DOC-2025-abc123"              │
│    DEL "user:user-123:documents"               │
└─────────────┬──────────────────────────────────┘
              │
              ▼
┌────────────────────────────────────────────────┐
│ 8. Audit Log                                   │
│    INSERT INTO audit_logs (                    │
│      action: 'document_deleted',               │
│      deletion_type: 'soft',                    │
│      user_id: 'user-123',                      │
│      document_id: 'DOC-2025-abc123'            │
│    )                                           │
└─────────────┬──────────────────────────────────┘
              │
              ▼
┌────────────────────────────────────────────────┐
│ 9. Metrics                                     │
│    - Increment document_deletions_total        │
│    - Observe document_delete_duration          │
└─────────────┬──────────────────────────────────┘
              │
              ▼
┌────────────────────────────────────────────────┐
│ 10. Return Success Response                    │
│     200 OK                                     │
│     {                                          │
│       success: true,                           │
│       data: {                                  │
│         deletion_type: 'soft',                 │
│         recoverable: true,                     │
│         recovery_deadline: NOW() + 30 days     │
│       }                                        │
│     }                                          │
└────────────────────────────────────────────────┘
```

### Workflow Hard Delete (Admin - après 30j)
```
┌────────────────────────────────────────────────┐
│ 1. Admin Request                               │
│    DELETE /documents/{id}?hard_delete=true     │
│    Body: {                                     │
│      reason: "RGPD request",                   │
│      confirmation: "I understand..."           │
│    }                                           │
└─────────────┬──────────────────────────────────┘
              │
              ▼
┌────────────────────────────────────────────────┐
│ 2. Verify Admin Role                           │
│    current_user.role == 'admin' ?              │
│    ✅ YES → Continue                            │
└─────────────┬──────────────────────────────────┘
              │
              ▼
┌────────────────────────────────────────────────┐
│ 3. Check Prerequisites                         │
│    a) Document already soft deleted?           │
│       deleted_at IS NOT NULL ✅                 │
│                                                │
│    b) 30 days passed since soft delete?        │
│       NOW() - deleted_at > 30 days ✅           │
│                                                │
│    c) Confirmation provided?                   │
│       "I understand this is permanent" ✅       │
└─────────────┬──────────────────────────────────┘
              │
              ▼
┌────────────────────────────────────────────────┐
│ 4. Cascade DELETE (Transaction)               │
│    BEGIN TRANSACTION;                          │
│                                                │
│    a) DELETE FROM document_annotations         │
│       WHERE document_id = {id}                 │
│                                                │
│    b) DELETE FROM ocr_extraction_results       │
│       WHERE uploaded_file_id = {id}            │
│                                                │
│    c) DELETE FROM uploaded_files               │
│       WHERE id = {id}                          │
│                                                │
│    COMMIT;                                     │
└─────────────┬──────────────────────────────────┘
              │
              ▼
┌────────────────────────────────────────────────┐
│ 5. Delete Firebase Storage File                │
│    firebase.storage.bucket.file(path).delete() │
│    → File permanently deleted                  │
└─────────────┬──────────────────────────────────┘
              │
              ▼
┌────────────────────────────────────────────────┐
│ 6. Create Audit Archive (90 days retention)   │
│    INSERT INTO deleted_documents_audit (       │
│      document_id, filename, reason,            │
│      deleted_by_admin, retention_until         │
│    )                                           │
└─────────────┬──────────────────────────────────┘
              │
              ▼
┌────────────────────────────────────────────────┐
│ 7. Return Success                              │
│    200 OK                                      │
│    { deletion_type: 'hard', recoverable: false }│
└────────────────────────────────────────────────┘
```

### CRON Job - Auto Hard Delete (Nightly)
```
Schedule: Tous les jours à 02:00 UTC

1. SELECT * FROM uploaded_files
   WHERE deleted_at < NOW() - INTERVAL 30 days
   AND deleted_at IS NOT NULL

2. Pour chaque document trouvé :
   a) Vérifier aucune contrainte légale (audit fiscal < 5 ans)
   b) Si OK → Hard delete (workflow ci-dessus)
   c) Si KO → Conserver + flag "legal_hold"

3. Cleanup Firebase Storage orphaned files

4. Report email admin :
   - X documents hard deleted
   - Y documents conservés (legal hold)
```

---

**FIN UC-DOC-004**

**Taille** : ~600 lignes (vs ~1,000 avec JSON)
**Réduction** : -40% 🎯
**Format** : ✅ Descriptions littérales
**Workflow** : ✅ ASCII diagrams détaillés
