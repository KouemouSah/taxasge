# Analyse BundleWorkflow OMS — Rapport Critique Expert

## Date : 2026-03-20
## Objectif : Concevoir le parcours utilisateur complet pour le BundleWorkflow (autonomo)

---

## 1. ANALYSE DU DOCUMENT oms.md — CRITIQUE

### Ce qui est décrit (correct)
- 3 méthodes de création d'entreprise (upload document, CSV, manuelle)
- Classification automatique obligatoire
- NIF/N° Registro comme clé unique
- Admin valide la création
- BundleWorkflow déclenché par l'utilisateur depuis son dashboard

### Ce qui manque ou est imprécis

**Critique 1 : "uniquement pour les entreprise autonomo"**
→ CORRECT dans le droit GE. Seuls les autonomos (persona física) au Padrón Empresarial paient via bundle. Les SA/SL paient via déclaration (IS/IVA). Le document est juste.

**Critique 2 : "nouvelle entreprise (c'est sa toute première fois)"**
→ Le document ne distingue pas clairement les 2 cas :
- **Cas 1** : Entreprise nouvelle → création + classification + licence + obligations + paiement (tout en 1 flux)
- **Cas 2** : Entreprise existante, nouvelle année fiscale → renouvellement licence + paiement (sans recréation)
Le workflow doit gérer les 2 cas avec un seul point d'entrée.

**Critique 3 : "choix des fee ayuntamiento et camara de comercio"**
→ L'utilisateur ne CHOISIT PAS les fees. Les fees sont DÉTERMINÉS par le bundle + zone. Un bundle "Abaceria" en zone A1 a des tarifs fixes pour tesoro + municipal + chamber. Le seul choix est le MODE de paiement (par ligne vs consolidé).

**Critique 4 : "processus de routage de paiement"**
→ Le routage existe déjà (ObligationRoutingService) mais n'est PAS câblé au frontend. C'est le maillon manquant le plus critique.

**Critique 5 : L'utilisateur "business" qui crée une entreprise**
→ Dans la réalité GE, c'est le propriétaire de l'entreprise ou son comptable qui initie. Le profil "business" est correct mais il faut un mécanisme de membership (owner/accountant). Ça EXISTE déjà (user_company_roles).

---

## 2. ARCHITECTURE EXISTANTE — CE QUI EST PRÊT

| Composant | État | Fichier |
|-----------|------|---------|
| Classification Agent 3-layers | ✅ COMPLET | classification_agent.py (1020+ lignes) |
| LicenseService.open_license() | ✅ COMPLET | license_service.py (943 lignes) |
| Obligation generation (batch) | ✅ COMPLET | license_service.py L140-190 |
| Config engine (penalty/deadline) | ✅ COMPLET | fiscal_config_rules table + recompute trigger |
| Obligation routing (per_line/consolidated) | ✅ COMPLET | obligation_routing_service.py (184 lignes) |
| Entity routing (8 entités + 16 locations) | ✅ COMPLET | Migration 218 Phase 4 |
| Agent queue (OmsAgentService) | ✅ COMPLET | oms_agent_service.py |
| Payment hook (on_payment_completed) | ✅ COMPLET | license_service.py L860-942 |
| Wizard session (cache-first) | ✅ COMPLET | wizard_session_service.py |
| Bundle pricing (per zone, cached 1h) | ✅ COMPLET | bundle_service.py |
| Overdue detection cron | ✅ CODE PRÊT | license_service.py L668-712 |
| Penalty calculation cron | ✅ CODE PRÊT | license_service.py L719-793 |
| PDF licence dossier | ✅ COMPLET | license_pdf_service.py |
| Company CRUD + auto-classification | ✅ COMPLET | company_routes.py + classification_agent.py |
| CSV import + batch classification | ✅ COMPLET | csv_import_service.py |
| NIF normalization trigger | ✅ APPLIQUÉ | Migration 233 |

| Composant | État | Notes |
|-----------|------|-------|
| **Endpoint citoyen pour initier bundle** | ❌ MANQUANT | open_license() est admin-only |
| **Wizard BundleWorkflow frontend** | ❌ MANQUANT | Aucun wizard pour les obligations |
| **Lien service_payment ↔ license_obligation** | ❌ PARTIEL | Le champ payment_id existe mais pas de flux |
| **Dashboard citoyen pour licences** | ❌ MANQUANT | Pas de page "Mes Licences" |
| **Agent processing endpoints** | ❌ PARTIEL | Queue existe mais pas l'UI processing |
| **Notifications deadline/overdue** | ❌ MANQUANT | Cron code existe, pas configuré |
| **Installment payment** | ❌ MANQUANT | Config existe, pas de split logic |
| **Upload document → création auto** | ❌ PARTIEL | extract_from_document() existe, pas câblé |

---

## 3. PARCOURS UTILISATEUR PROPOSÉ

### Flow principal : Citoyen initie un BundleWorkflow

```
┌─────────────────────────────────────────────────────────────┐
│ ÉTAPE 0 : POINT D'ENTRÉE                                    │
│                                                              │
│ Depuis le dashboard citoyen : bouton "Pagar Obligaciones"    │
│ → Vérifie si l'utilisateur a des entreprises enregistrées    │
│   ├── OUI → Liste ses entreprises → sélection               │
│   └── NON → Propose de créer une entreprise (3 méthodes)    │
└─────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────┐
│ ÉTAPE 1 : SÉLECTION / CRÉATION ENTREPRISE                    │
│                                                              │
│ Cas A : Entreprise existante                                 │
│   → Sélection depuis CompanySearchSelect (NIF/PE/nom)        │
│   → Affiche : régime, zone, commerce_type, dernière licence  │
│   → Si pas autonomo → message "este flujo es solo para       │
│     empresas autónomas del Padrón Empresarial"               │
│                                                              │
│ Cas B : Nouvelle entreprise (upload documents)               │
│   → Upload certificado_registro + certificado_actualizacion  │
│   → Extraction LLM → classification auto → draft             │
│   → Validation rapide (NIF/PE, forma=autonomo, zone)         │
│   → Si admin required : attente validation                   │
│   → Si auto-approved (conf ≥ 0.90) : continue directement   │
└─────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────┐
│ ÉTAPE 2 : VÉRIFICATION LICENCE ANNUELLE                      │
│                                                              │
│ Le système vérifie automatiquement :                         │
│   → Existe-t-il une licence pour cette entreprise +          │
│     bundle + année fiscale en cours ?                        │
│   ├── OUI (status=open/partial) → Continue avec existante   │
│   ├── OUI (status=complete) → "Déjà payé pour cette année"  │
│   └── NON → open_license() automatique                       │
│        → Crée licence + obligations + events                 │
│        → Affiche résumé : N obligations, total XAF           │
└─────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────┐
│ ÉTAPE 3 : CHOIX DU MODE DE PAIEMENT                          │
│                                                              │
│ Affiche les obligations avec détail :                        │
│ ┌────────────────────────────────────────────────┐           │
│ │ Obligation          │ Montant  │ Statut         │          │
│ ├────────────────────────────────────────────────┤           │
│ │ Tesoro Público      │ 150,000  │ ⏳ Pendiente   │          │
│ │ Ayuntamiento Malabo │  50,000  │ ⏳ Pendiente   │          │
│ │ Cámara de Comercio  │  30,000  │ ⏳ Pendiente   │          │
│ │ ──────────────────────────────────────────────  │          │
│ │ TOTAL               │ 230,000 XAF              │          │
│ └────────────────────────────────────────────────┘           │
│                                                              │
│ Mode de paiement :                                           │
│ ○ Modo A : Pagar por línea (seleccionar obligaciones)        │
│   → Checkbox par obligation → payer celles sélectionnées     │
│   → Chaque paiement est routé séparément                     │
│ ○ Modo B : Pagar todo (bundle completo)                      │
│   → Paiement unique consolidé → routé au Tesoro              │
│                                                              │
│ Méthode de paiement :                                        │
│ ○ Mobile Money (BANGE) → Redirect URL                        │
│ ○ Paiement en agence (cash) → Agent validation               │
└─────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────┐
│ ÉTAPE 4 : TRAITEMENT PAIEMENT                                │
│                                                              │
│ Mobile Money :                                               │
│   → Créer service_payment(s) avec fee_type                   │
│   → UPDATE obligations status → payment_pending              │
│   → Redirect vers BANGE → callback webhook                   │
│   → on_payment_completed() → route obligations               │
│                                                              │
│ Cash/Agence :                                                │
│   → Créer service_payment(s) status=submitted                │
│   → Agent Tesoro voit dans sa queue                          │
│   → Agent valide → on_payment_completed()                    │
│   → Route vers ministères (Mode A) ou Tesoro (Mode B)        │
└─────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────┐
│ ÉTAPE 5 : POST-PAIEMENT (ASYNCHRONE)                         │
│                                                              │
│ Obligation routing :                                         │
│   → Tesoro fees → status=processing → agent Tesoro           │
│   → Municipal fees → status=completed (auto)                 │
│   → Chamber fees → status=completed (auto)                   │
│                                                              │
│ Agent Tesoro :                                               │
│   → Valide le paiement                                       │
│   → Émet le document (licence commerciale officielle)        │
│   → obligation → completed + issued_document_id              │
│                                                              │
│ Quand toutes les obligations = completed :                   │
│   → license.status = complete                                │
│   → Génération PDF licence officielle                        │
│   → Email au citoyen avec PDF attaché                        │
│   → compliance_score = 100%                                  │
└─────────────────────────────────────────────────────────────┘
```

---

## 4. CONSIDÉRATIONS POUR 1M+ WORKFLOWS SIMULTANÉS

### Performance
- **open_license()** : 1 transaction atomique (INSERT licence + INSERT N obligations + INSERT N events). Pour 10 bundles × 10 items = 30 INSERTs max par workflow. OK à 1M/jour avec connection pooling.
- **UNIQUE constraint** (company_id, bundle_id, fiscal_year) : Empêche les doublons même sous race condition.
- **Obligation routing** : O(N) par licence (N = nb obligations, max 10-15). Pas de problème.
- **Payment hooks** : Idempotent (WHERE status='payment_pending' RETURNING). Safe sous retry.

### Bottlenecks potentiels
1. **Config recompute** : Le trigger `recompute_effective_configs` est batch-safe mais pourrait être lent si 1062 items × fréquence. → Mitigé par le cache 1h sur bundle_service.
2. **MV refresh** : REFRESH CONCURRENTLY sur mv_company_stats_by_zone avec 1M companies prendra ~seconds. → OK avec le cron 15min.
3. **PDF generation** : xhtml2pdf est CPU-bound (~500ms par PDF). À 1000 PDFs simultanés → queue async ou worker pool.
4. **Email sending** : CommunicationService est async mais sans queue. → OK si SES/SendGrid gèrent le rate limiting.

### Recommandations Scale
- **Connection pooling** : asyncpg pool min=5, max=20 (déjà configuré)
- **Batch event logging** : Utiliser `log_events_batch()` (déjà implémenté)
- **Obligation creation** : Utiliser `executemany()` au lieu de boucle INSERT (déjà fait dans open_license)
- **Rate limiting** : 100 req/min sur les endpoints publics (déjà fait)
- **Cache** : Bundle pricing 1h, permissions 10min (déjà fait)

---

## 5. PLAN D'IMPLÉMENTATION PAR SESSIONS

### Session 7A : Backend — Endpoint citoyen BundleWorkflow
- [ ] `POST /bundle-workflow/initiate` — Point d'entrée principal
  - Input : company_id (ou upload documents si nouvelle)
  - Vérifie : entreprise autonomo, zone assignée, bundle existe
  - Crée licence si nécessaire (open_license())
  - Retourne : license_id, obligations[], total, processing_mode options
- [ ] `POST /bundle-workflow/{license_id}/select-mode` — Choix du mode
  - Input : processing_mode (per_line|consolidated), selected_obligation_ids[]
  - Retourne : payment_summary, amount
- [ ] `POST /bundle-workflow/{license_id}/initiate-payment` — Initier paiement
  - Input : payment_method (mobile_money|cash), selected_obligations
  - Crée service_payment(s) avec fee_type
  - UPDATE obligations → payment_pending
  - Si BANGE → redirect_url
  - Si cash → agent_validation status

### Session 7B : Frontend — Wizard BundleWorkflow citoyen
- [ ] Page `/dashboard/bundle-payment` — Point d'entrée
  - Sélection entreprise (CompanySearchSelect ou upload)
  - Affichage licence + obligations
  - Sélection mode + méthode de paiement
  - Redirect/confirmation
- [ ] Dashboard citoyen "Mes Licences" — Liste + détail

### Session 7C : Agent Processing — UI Treasury + Ministry
- [ ] Page agent Tesoro — Queue OMS obligations
  - Voir obligations payment_pending
  - Valider / Rejeter
  - Émettre document
- [ ] Notifications — Email deadline + overdue
- [ ] Cron configuration Cloud Scheduler

### Session 7D : Tests E2E — Flux complet
- [ ] Test : citoyen → initiate → select mode → pay → agent validate → complete
- [ ] Test : race condition (2 paiements simultanés même licence)
- [ ] Test : overdue + penalty calculation
- [ ] Test : renouvellement année suivante

---

## 6. RISQUES ET MITIGATIONS

| Risque | Impact | Mitigation |
|--------|--------|------------|
| Race condition sur open_license() | Licence dupliquée | UNIQUE constraint + transaction |
| Paiement BANGE timeout | Obligation bloquée en payment_pending | Cron cleanup J+1 (status → pending) |
| Agent ne valide pas | Obligation bloquée en processing | SLA cron (J+5 escalade superviseur) |
| Config change pendant paiement | Montant incohérent | Config snapshot dans obligation (immutable) |
| PDF generation sous charge | Latence > 10s | Background task + email async |
| 1M workflows/jour | Pool DB saturé | Connection pooling + read replicas |
