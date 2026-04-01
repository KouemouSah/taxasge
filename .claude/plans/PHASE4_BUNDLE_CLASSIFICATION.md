# Phase 4 — Bundle Workflow Classification Review
**Date:** 2026-04-01
**Statut:** EN COURS

## Problème
Après upload du document "Certificado Padrón", le flow est:
1. OCR extrait `localidad` (ex: "Malabo")
2. `initiate_from_upload()` crée company + classifie + crée license → retourne obligations
3. Si zone resolution échoue (localidad ≠ cities table) → COMPANY_NO_ZONE → blank page

## Solution Architecturale

### Approche : Preview + Override (pas de nouveau step wizard)

**Principe:** Ajouter un endpoint de preview qui classifie SANS créer, et modifier
l'initiation pour accepter des overrides manuels (zone_id, commerce_type).

### Backend
1. `POST /bundle-workflow/classify-preview` — preview classification sans créer
2. Modifier `initiate_from_upload()` pour accepter `zone_id` optionnel

### Frontend
3. Après upload document, appeler `classify-preview` automatiquement
4. Si zone/commerce_type résolus → auto-avancer vers obligations (flow actuel)
5. Si zone manquante → afficher sélecteur zone inline dans ObligationsReviewStep
6. Si commerce_type manquant → afficher sélecteur catégorie filtré par zone

## Checklist
- [ ] 4.1 Backend: endpoint classify-preview
- [ ] 4.2 Backend: modifier initiate_from_upload pour overrides zone_id/commerce_type
- [ ] 4.3 Frontend: hook — state classificationPreview, auto-call après upload
- [ ] 4.4 Frontend: ObligationsReviewStep — sélecteurs zone/catégorie si nécessaire
- [ ] 4.5 Tests
- [ ] 4.6 Auto-critique
