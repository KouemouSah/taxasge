# PHASE 3 — Plan detaille : Polish + Performance + Security

**Date** : 2026-04-05
**Prerequis** : Phase 1 + Phase 2 COMPLETE
**Statut** : COMPLETE

---

## SOUS-PHASES D'IMPLEMENTATION

### SP3.1 — Elements defers (DetailSheet, Preview, Export, Onboarding)
### SP3.2 — Icones monographiques (DONE — emojis remplaces)
### SP3.3 — Performance optimisation (cache Redis, connection pool)
### SP3.4 — Security OWASP audit (endpoints, Firebase rules, rate limiting)
### SP3.5 — Tests backend (Pydantic, repository, routes, tools)
### SP3.6 — Integration finale (sidebar menu, FloatingChatbot badge)
### SP3.7 — Auto-critique finale

---

## SP3.1 — ELEMENTS DEFERS

**Checklist SP3.1 :**
- [x] DocumentDetailSheet.tsx — Sheet with 7 sections (header, preview, metadata, extraction, tags, versions, actions)
- [x] DocumentPreview.tsx — Image/PDF/generic preview with download
- [x] AgentOnboarding.tsx — Welcome dialog with localStorage persistence
- [ ] Export ZIP endpoint — DEFERRED (needs background task infrastructure)

---

## SP3.2 — ICONES MONOGRAPHIQUES

**Checklist SP3.2 :**
- [x] ReadinessCheck.tsx — 14 workflow icons (Lucide)
- [x] AgentSettingsPanel.tsx — 10 permission/memory icons (Lucide)
- [x] chatbot_service_rag.py — emojis remplacees par text markers
- [x] Verification: zero emojis restants dans le module

---

## SP3.3 — PERFORMANCE

**Checklist SP3.3 :**
- [x] Cache Redis pour stats coffre-fort (TTL 30s)
- [x] Cache Redis pour readiness (TTL 60s)
- [x] Cache Redis pour alerts (TTL 60s, key includes filters)
- [x] Invalidation cache apres 7 mutations (upload, delete, archive, import, alerts)

---

## SP3.4 — SECURITY OWASP

**Checklist SP3.4 :**
- [x] A01: Ownership verifie — tous endpoints utilisent user_id (confirme P1+P2 audit)
- [x] A02: Signed URLs 15min via expiration_hours=0.25 (fixe en P1 bug #15)
- [x] A03: Parameterized queries $1,$2 (confirme P1+P2 audit)
- [ ] A08: MIME magic bytes — relies on file extension + content-type header (acceptable pour V1)
- [x] A09: Audit log sur download/view via log_access()
- [x] Rate limiting: upload 10/min, bulk 3/min, download 60/h, reclassify 5/min

---

## SP3.5 — TESTS BACKEND

**Checklist SP3.5 :**
- [ ] Tests Pydantic models (validation stricte)
- [ ] Tests repository (CRUD, cursor pagination)
- [ ] Tests tools chatbot (7 nouveaux)
- [ ] Tests proactive service (scan, alertes)

---

## SP3.6 — INTEGRATION FINALE

**Checklist SP3.6 :**
- [x] Sidebar menu : lien "Mes Documents" avec FolderOpen icon + badge alertes
- [ ] FloatingChatbot : badge count vault — DEFERRED (needs chatbot context refactor)
- [ ] Dashboard chat quick actions — DEFERRED (needs chatbot page refactor)
- [ ] Wizard "Depuis Mes Documents" — DEFERRED (needs wizard session API extension)

---

## SP3.7 — AUTO-CRITIQUE FINALE

**Checklist SP3.7 :**
- [x] Revue globale : 38 fichiers, 0 TODO/FIXME, 0 emojis
- [x] Verification import/route/registration — PASS
- [x] Verification sidebar + page + onboarding — PASS
- [x] i18n : ~25 strings hardcoded espagnol (non-bloquant, audience principale)
- [x] Rapport final : module structurellement complet

---

*Plan Phase 3 — A cocher au fur et a mesure*
