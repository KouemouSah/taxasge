# Plan : Vérification polymorphe + Auto-registration documents + Fix 403 DGT

**Date** : 2026-04-19
**Contexte** : Test CONDUCIR_RENOVACION (CON-2026-00001) — 3 bugs identifiés

---

## P1 — Fix verification link polymorphe

### Problème
Le lien QR sur la solicitud `solicitud_CON-2026-00001.pdf` pointe vers :
```
https://taxasge.emacsah.com/fr/verify/CON-2026-00001?t=68ab8080659dc6ba
```
La page frontend ne reconnaît que `SRV-` et `LIC-` comme préfixes de service_request. `CON-` tombe dans le case default → appel receipt endpoint → "Recu Non Valide".

### Root cause
**Frontend** : `packages/web/src/app/[locale]/(public)/verify/[receiptNumber]/page.tsx` lignes 280-286 :
```typescript
if (reference.startsWith('SRV-')) → /verify/request/
else if (reference.startsWith('LIC-')) → /verify/license/
else → /verify/ (receipt, default)
```

**Backend** : DÉJÀ polymorphe (3 endpoints existent). Aucun changement backend nécessaire.

### Fix
Ajouter TOUS les préfixes de service_request au routage frontend :
- `CON-` (CONDUCIR), `PAS-` (PASAPORTE), `RES-` (RESIDENCIA), `MAT-` (MATRICULACION)
- `INS-` (INSPECCION), `DUP-` (DUPLICADO), `PRO-` (PROMOCION), `CAR-` (CARNET)
- `VER-` (VERIFICACION), `TRA-` (TRAMITES), `PER-` (PERMISO), `CER-` (CERTIFICADO)
- `SRV-` (generic, déjà couvert)

**Approche** : regex ou liste de préfixes connus, avec fallback intelligent :
- Si préfixe 3 lettres + `-YYYY-` → service_request
- Si `REC-` → receipt
- Si `LIC-` → license
- Default → tenter service_request d'abord, fallback receipt

### Fichier
- `packages/web/src/app/[locale]/(public)/verify/[receiptNumber]/page.tsx`

### Checklist
- [ ] Ajouter constante `SR_PREFIXES` avec tous les codes connus
- [ ] Modifier la logique de détection pour utiliser un pattern regex `^[A-Z]{3}-\d{4}-`
- [ ] Tester avec `CON-2026-00001` → doit afficher info solicitud (pas "reçu non valide")
- [ ] Vérifier que `REC-2026-000011` continue de fonctionner (receipt)
- [ ] Vérifier que `LIC-2026-00001` continue de fonctionner (license)

---

## P2 — Auto-registration des documents générés dans user_documents

### Problème
Les PDFs officiels (solicitud, reçu) sont générés et stockés dans Firebase Storage + envoyés par email, mais PAS enregistrés dans `user_documents` → invisibles dans le menu "Documents > Générés".

### Infrastructure existante (DÉJÀ EN PLACE)
- **Table** : `user_documents` avec `source = 'platform_generated'`, `generation_type` enum
- **Méthode** : `user_documents_service.auto_import_generated()` — EXISTE, jamais appelée
- **Frontend** : `GeneratedDocumentsGrid.tsx` avec filtres par type — EXISTE
- **Endpoint** : `GET /api/v1/user-documents/generated` — EXISTE

### Fix : 2 hooks d'appel

#### Hook A — Receipt PDF (après validation paiement)
**Fichier** : `packages/backend/app/modules/payments/services/receipt_service.py`
**Après** : `generate_and_store_receipt()` ligne ~887 (après Firebase upload + UPDATE service_payments)

```python
await user_documents_service.auto_import_generated(
    db=db,
    user_id=user_id,
    generation_type='payment_receipt',
    file_path=file_path,
    file_name=filename,
    file_size_bytes=len(pdf_bytes),
    mime_type='application/pdf',
    title_es='Recibo de Pago',
    title_fr='Reçu de Paiement',
    title_en='Payment Receipt',
    reference_number=receipt_number,
    service_request_id=service_request_id,
    verification_code=verification_token,
)
```

#### Hook B — Solicitud Summary PDF (après soumission demande)
**Fichier** : `packages/backend/app/modules/service_requests/services/summary_pdf_service.py`
**Après** : `generate_summary_pdf()` — après Firebase upload

```python
await user_documents_service.auto_import_generated(
    db=db,
    user_id=user_id,
    generation_type='request_summary',
    file_path=file_path,
    file_name=f'solicitud_{request_number}.pdf',
    file_size_bytes=len(pdf_bytes),
    mime_type='application/pdf',
    title_es='Solicitud de Trámite',
    title_fr='Demande de Service',
    title_en='Service Request',
    reference_number=request_number,
    service_request_id=request_id,
    verification_code=sr_token,
)
```

### Checklist
- [ ] Identifier l'endroit exact dans receipt_service.py où l'appel doit être fait
- [ ] Identifier l'endroit exact dans summary_pdf_service.py (ou le caller qui persiste le PDF)
- [ ] Vérifier que auto_import_generated() gère l'idempotence (pas de doublon si appelé 2x)
- [ ] Vérifier que les paramètres file_path/file_name correspondent au format Firebase
- [ ] Tester : après nouveau paiement CONDUCIR → onglet "Générés" affiche le reçu
- [ ] Tester : après soumission CONDUCIR → onglet "Générés" affiche la solicitud
- [ ] Vérifier le téléchargement via l'onglet Générés (signed URL Firebase)

---

## P3 — Fix 403 agent DGT "Aprobar" sur POST /decision

### Problème
Agent DGT (`user_id = 1d35496c-d6d2-4436-87a1-e577ae028047`) clique "Aprobar" sur le dossier CON-2026-00001 → 403 Forbidden.

### Logs Cloud Run
```
POST /api/v1/agent/service-requests/d18e8745-a4da-44af-9655-e6b17c371aa9/decision → 403
Token decoded OK, permissions cache HIT, mais le handler rejette.
```

### Root cause probable
Même pattern que le bug X2 bundle (déjà documenté dans Phase 8) :
L'endpoint `POST /agent/service-requests/{id}/decision` vérifie que l'agent courant est assigné à ce SR via `agent_work_queue` :
```sql
SELECT id FROM agent_work_queue
WHERE item_id = <sr_id> AND item_type = 'service_request'
  AND assigned_to = <current_user.id> AND status = 'assigned'
```
Mais l'assignation a été faite via la table `assignments` (via AutoAssignmentService), pas `agent_work_queue`.

### Investigation nécessaire
- [ ] Confirmer : l'assignment du SR existe dans `assignments` table
- [ ] Confirmer : AUCUNE entrée dans `agent_work_queue` pour ce SR
- [ ] Lire le handler `/decision` pour identifier la vérification exacte
- [ ] Déterminer le fix : aligner la vérification sur `assignments` OU populer `agent_work_queue`

### Fix anticipé
Modifier le handler `make_decision` pour vérifier l'assignation via :
```sql
SELECT id FROM assignments
WHERE item_id = $1::uuid AND item_type = 'service_request'
  AND agent_profile_id IN (SELECT id FROM agent_profiles WHERE user_id = $2)
  AND status IN ('assigned', 'in_progress')
```
Ou mieux : unifier `agent_work_queue` et `assignments` (dette technique majeure, hors scope ici).

### Checklist
- [ ] Requêter la BD pour confirmer l'absence dans agent_work_queue
- [ ] Lire agent_routes.py handler `/decision` (lignes ~1100-1137)
- [ ] Implémenter le fix (dual-lookup ou migration vers assignments)
- [ ] Tester : agent DGT clique Aprobar → 200 OK, dossier validé

---

## Ordre d'implémentation

1. **P3** (403 DGT) — bloque le test end-to-end du workflow CONDUCIR
2. **P1** (vérification polymorphe) — bug visible sur document officiel
3. **P2** (auto-registration documents) — feature enrichissement

## Fichiers impactés

| Phase | Fichier | Type |
|-------|---------|------|
| P1 | `packages/web/src/app/[locale]/(public)/verify/[receiptNumber]/page.tsx` | Edit frontend |
| P2 | `packages/backend/app/modules/payments/services/receipt_service.py` | Edit backend |
| P2 | `packages/backend/app/modules/service_requests/services/summary_pdf_service.py` | Edit backend |
| P3 | `packages/backend/app/modules/service_requests/api/agent_routes.py` | Edit backend |
