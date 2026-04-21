# Phase 1 — Fix CRITIQUE Backend (Agent Decision Flow)
**Date**: 2026-04-21
**Dépendance**: Aucune
**Prérequis validé**: Le workflow est strict — aucune demande ne peut être traitée sans que le paiement soit payé.

---

## Architecture de la solution

### B1 — asyncio.gather → queries séquentielles
**Fichier**: `agent_routes.py:1638-1662`
**Solution**: Remplacer `asyncio.gather(db.fetchrow(), db.fetch(), ...)` par 4 queries séquentielles.
Raison: asyncpg interdit les opérations concurrentes sur une même connexion.
Les queries sont rapides (<5ms chacune), le coût séquentiel (~20ms total) est négligeable
vs le crash systématique actuel.

### B2 — Colonne `updated_at` → `last_updated_at`
**Fichier**: `assignment_feedback_service.py:154`
**Solution**: Simple rename dans le SQL. Vérifié: la colonne correcte est `last_updated_at`.

### B3 — Variable `workflow_data` non définie
**Fichier**: `agent_routes.py:1781`
**Solution**: Ajouter paramètre `requires_appointment: bool` à `_bg_approve_pdf_and_notify`.
Le caller a déjà `workflow_data` — on passe la valeur extraite au lieu de refaire une query.

### Optimisation — Merger queries 1750-1755
**Fichier**: `agent_routes.py:1750-1755`
**Solution**: Fusionner les 2 queries sur `service_requests` en une seule.

### B10 — Auto-advance sécurisé
**Fichier**: `agent_routes.py:1397-1444`
**Solution**: Wrapper dans `async with db.transaction()` avec `FOR UPDATE` pour éviter race condition.

---

## Checklist

- [x] B1: Remplacer asyncio.gather par séquentiel dans _bg_approve_pdf_and_notify ✅
- [x] B3: Ajouter paramètre requires_appointment à _bg_approve_pdf_and_notify ✅
- [x] B3: Passer requires_appointment depuis le caller (background_tasks.add_task) ✅
- [x] B3: Utiliser requires_appointment au lieu de workflow_data.get('requires_appointment') ✅
- [x] Optimisation: Merger les 2 queries status/cita en une seule ✅
- [x] B2: Corriger updated_at → last_updated_at dans assignment_feedback_service.py ✅
- [x] B10: Wrapper auto-advance dans une transaction sécurisée avec FOR UPDATE ✅
- [x] Syntaxe: py_compile OK sur les 2 fichiers modifiés ✅
- [x] Sécurité: aucune référence résiduelle à agent_workloads.updated_at ✅
- [x] Auto-critique: revue OWASP passée — parameterized queries, null guards, no info leak ✅
