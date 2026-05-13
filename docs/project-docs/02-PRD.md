# PRD — Product Requirements Document — Facil

> **Statut document** : v1.0 — 2026-05-11
> **Auteur** : équipe Facil
> **Maturité produit** : MVP avancé pre-launch ((document interne de positionnement))
> **Audience** : équipe produit, équipe technique, partenaires institutionnels, advisors
> **Cohérence** : ce document respecte strictement (document interne). En cas de conflit, le master prévaut.

---

## 1. Executive Summary

### 1.1 Pitch

> Facil est la plateforme native souveraine de transformation digitale fiscale pour les administrations publiques émergentes — première instance déployée en Guinée Équatoriale, conçue pour s'étendre à la région CEMAC / UEMOA / OHADA.

### 1.2 Vision

Devenir l'infrastructure de référence pour la digitalisation des recettes fiscales dans les pays émergents francophones et hispanophones, en partenariat avec les Trésors publics, les bailleurs internationaux (BAD, BM, AFD, UE), et les administrations fiscales nationales.

### 1.3 Statut actuel — HONNÊTETÉ NON-NÉGOCIABLE

- ✅ **MVP avancé** : 18 modules backend documentés (35 modules réels en code après vérification, dont treasury, inspections, bundle_payment), 26 modules frontend (38 réels)
- ✅ **77 tables PostgreSQL** structurées, 25 enums, 31+ migrations production
- ✅ **Observabilité production** : Grafana Cloud (Loki + Tempo + AI Observability + Security Observability)
- ✅ **Code production-ready**, infrastructure Cloud Run + Firebase Hosting + Supabase opérationnelle
- ❌ **Pas de clients payants** à ce jour
- ❌ **Pas de déploiement public massif** — pre-launch
- ❌ **Pas approuvé contractuellement** par MFPDE / DGT GE
- ❌ **Pas disponible Play Store / App Store** (Play Store rejected gov 2026-05-08, voie alternative en cours)

### 1.4 Métriques succès cibles à 12-24 mois

| Métrique | Cible 12 mois | Cible 24 mois |
|---|---|---|
| Pilote actif | 1 (GE) | 2-3 (GE + 1-2 CEMAC) |
| Agents publics actifs | 50-100 | 500-1 000 |
| Citoyens actifs (DAU) | 500-2 000 | 10 000-30 000 |
| Déclarations traitées | 1 000-5 000 | 50 000-200 000 |
| Disponibilité (uptime) | 99,5 % | 99,5 % |
| NPS contribuables | >40 | >50 |

> ⚠️ Cibles indicatives, à raffiner après pilote réel. Pas de données historiques disponibles.

---

## 2. Vision et stratégie produit

### 2.1 Problème adressé

Les administrations fiscales émergentes font face à 5 défis structurels (cf. master §3) :

1. **Mobilisation des recettes fiscales sous-optimale** — procédures papier, files d'attente, déplacements coûteux pour les contribuables → évasion + sous-déclaration.
2. **Fragmentation des systèmes** — chaque ministère / direction générale gère ses recettes de façon cloisonnée → pas de vue consolidée pour le Trésor public.
3. **Absence de traçabilité numérique** — pas d'audit trail immuable, paiements manuels, falsifications faciles.
4. **Faible inclusion financière** — 80 %+ des contribuables émergents sans compte bancaire formel, mais 60 %+ avec accès mobile money / USSD (source : Findex 2021 BM).
5. **Charges opérationnelles administratives élevées** — agents saturés par tâches manuelles, files physiques, supports papier coûteux à gérer et archiver.

### 2.2 Solution — Facil en 5 piliers

1. **Catalogue centralisé** — 850+ services fiscaux (taxes, déclarations, paiements administratifs) + 28 types de déclarations (IVA, IRPF, retenciones, petroliferos, etc.) avec calcul automatique et règles métier paramétrables.
2. **Workflow d'inspection terrain** — application mobile + tablet inspector pour les agents avec collecte de paiement sur place et synchronisation offline.
3. **Paiement multi-canal** — BANGE Mobile Money (intégré), USSD GETESA / MUNI (intégré), cartes bancaires (gateway), virements bancaires (manual validation), caisse physique.
4. **Chatbot IA** — Vertex AI Gemini en RAG sur les services fiscaux GE, accessible 24/7 par les contribuables, multilingue ES / FR / EN.
5. **OCR documents + observabilité production-grade** — Document AI pour extraction automatique des champs, Grafana Cloud pour la supervision multi-couches.

### 2.3 Différenciation (cf. master §8)

- **Souveraineté numérique** : hébergeable cloud souverain ou on-prem, contrairement aux solutions US/UE
- **Mobile money local** : BANGE / GETESA / MUNI intégrés natif, contrairement à SAP / Oracle qui n'ont pas ces connecteurs
- **Multilingue ES / FR / EN** : adapté aux pays CEMAC francophones et hispanophones (GE)
- **Architecture modulaire moderne** : extensible vers Facil Framework V1.1 pour réutilisation multi-pays
- **Open Core philosophie** (via Facil V1) : éviter le vendor lock-in propriétaire

### 2.4 Roadmap 24 mois (cf. master §9)

| Trimestre | Objectif |
|---|---|
| Q3 2026 | Pilote Guinée Équatoriale avec 1-2 directions générales (DGIR + DGT) |
| Q4 2026 | Soft launch citizen-facing + feedback itération |
| Q1 2027 | Stabilisation production + 1er rapport d'impact mesuré |
| Q2-Q3 2027 | Bootstrap Facil Framework V1 (extraction socle réutilisable, multi-tenant) |
| Q4 2027 | Premier déploiement régional CEMAC (Cameroun ou Gabon pilote) |
| Q1-Q2 2028 | Facil Framework V1.1 (treasury capabilities) — répondre à TDR type PIMEPE |
| H2 2028 | 2-3 déploiements actifs CEMAC / UEMOA, monétisation services managés |

---

## 3. Personas et utilisateurs

7 rôles distincts définis dans la BD (`user_role_enum`) :

### 3.1 Persona 1 — Citoyen / Contribuable individuel

- **Profil démographique** : 18-65 ans, urbain ou semi-urbain, smartphone Android entry-level
- **Niveau numérique** : faible à moyen, USSD natif, web hésitant
- **Pain points** :
  - Files d'attente longues aux guichets fiscaux
  - Procédures opaques, formulaires complexes
  - Déplacements coûteux dans les zones rurales
  - Manque de transparence sur l'avancement de leurs dossiers
- **Cas d'usage typiques** :
  - Déclaration revenus annuelle (IRPF)
  - Paiement taxes administratives (passeport, permis conduire, cédula)
  - Vérification authenticité reçu via QR code
  - Demande document officiel (acte naissance, certificat résidence)
  - Suivi temps réel statut demande
- **KPIs réussite** : NPS >50, time-to-payment <15 min, taux complétion déclaration >70 %, taux usage mobile vs web >60 %

### 3.2 Persona 2 — Entreprise (Business)

- **Profil** : PME ou grande entreprise GE, comptable interne ou externe
- **Pain points** :
  - Multiples déclarations fiscales mensuelles / trimestrielles
  - Multi-entité (groupes avec filiales)
  - Réconciliation paiements compliquée
  - Suivi conformité / pénalités
- **Cas d'usage** :
  - Déclaration IVA mensuelle (90 % volume)
  - Déclaration retención (impôt à la source)
  - Bundle payment licence commerciale
  - Gestion multi-utilisateurs avec rôles internes
  - Export comptable pour comptabilité interne
- **KPIs** : taux complétion déclaration >85 %, time-to-payment <10 min, tickets support <5 % users

### 3.3 Persona 3 — Comptable / Cabinet comptable (Accountant)

- **Profil** : comptable indépendant ou cabinet qui gère plusieurs entreprises clientes
- **Pain points** :
  - Switch entre comptes clients
  - Délégation de tâches (preparation vs validation)
  - Audit trail des actions par client
- **Cas d'usage** :
  - Multi-tenant management plusieurs entreprises
  - Soumission déclaration au nom client avec signature
  - Reporting consolidé multi-clients
- **KPIs** : nombre d'entreprises gérées simultanément, time per client per month

### 3.4 Persona 4 — Agent DGI (DGI Agent)

- **Profil** : fonctionnaire administration fiscale, 30-55 ans, base PC bureau ou tablette
- **Pain points** :
  - Charge de travail non équilibrée entre collègues
  - SLA difficile à respecter sans outil de priorisation
  - Manque de visibilité sur sa file d'attente personnelle
  - Documents parfois incomplets, allers-retours avec contribuables
- **Cas d'usage** :
  - Réception assignment automatique (auto-assignment scoring)
  - Review déclaration soumise par contribuable
  - Demande pièces complémentaires (waiting_documents)
  - Approbation / rejet déclaration avec motif
  - Escalation au superviseur si complexité
- **KPIs** : SLA respect >85 %, throughput dossiers/jour >15, taux escalation <20 %

### 3.5 Persona 5 — Agent Trésor / Ministériel (Ministry Agent)

- **Profil** : agent Trésor public, autres ministères percepteurs (intérieur, transports, etc.)
- **Pain points** :
  - Réconciliation bancaire manuelle longue
  - Pas de vue temps réel des paiements reçus
  - Difficile de tracer paiement par contribuable
- **Cas d'usage** :
  - Validation paiement reçu vs déclaration
  - Réconciliation bancaire (matching paiements ↔ déclarations)
  - Génération reçu officiel signé
  - Reporting Trésor consolidé par direction émettrice
- **KPIs** : taux match auto >95 %, délai réconciliation <24h, exception rate <5 %

### 3.6 Persona 6 — Superviseur (Supervisor)

- **Profil** : manager d'équipe agents (5-20 personnes)
- **Pain points** :
  - Manque de visibilité productivité équipe
  - Difficile d'identifier les agents en surcharge / sous-charge
  - Détection des cas anormaux nécessitant intervention
- **Cas d'usage** :
  - Tableau de bord équipe (workload, throughput, SLA)
  - Réassignation manuelle de cas
  - Validation cas escaladés par agents
  - Reporting performance vers direction
- **KPIs** : équilibrage workload, SLA équipe >85 %, détection anomalies <48h

### 3.7 Persona 7 — Administrateur système (Admin)

- **Profil** : administrateur technique de la plateforme, équipe MFPDE DSI
- **Pain points** :
  - Gestion utilisateurs / permissions complexe
  - Audit logs à explorer pour incidents
  - Configuration des workflows métier
- **Cas d'usage** :
  - CRUD utilisateurs et entités
  - Gestion RBAC permissions (50+ permissions)
  - Configuration menus dynamiques par rôle
  - Audit logs viewer
  - Configuration workflows et règles d'assignment
- **KPIs** : zero downtime config changes, audit complet capturé, RBAC bypass = 0

---

## 4. Fonctionnalités existantes (V1 MVP)

> Statut établi par vérification du code source `packages/backend/app/modules/` et `packages/web/src/modules/` au 2026-05-11.
> ✅ Implémenté et testé / 🟡 Implémenté partiel ou en stabilisation / 📋 Planifié

### 4.1 Modules backend

| Module | Statut | Description |
|---|---|---|
| `auth` | ✅ | JWT + 2FA TOTP + sessions + refresh tokens + lockout |
| `users` | ✅ | CRUD users + 7 rôles + métadonnées + audit |
| `permissions` | ✅ | RBAC 50+ permissions, role_permissions, user overrides |
| `fiscal_services` | ✅ | 850+ services catalogués + categories + ministries + sectors |
| `declarations` | ✅ | 28 types déclarations (IVA, IRPF, retenciones, petroliferos, etc.) |
| `service_requests` | ✅ | Workflow demande citoyen end-to-end |
| `payments` | ✅ | Multi-canal BANGE / cartes / virement / cash + payment plans |
| `chatbot` | ✅ | Gemini RAG + pgvector + sessions conversationnelles |
| `documents` | ✅ | Upload + Storage Supabase + métadonnées |
| `communications` | ✅ | Email + SMS + Push + WhatsApp + USSD providers |
| `webhooks` | ✅ | Webhooks bancaires + intégrations externes |
| `support` | ✅ | Tickets support + catégorisation + multilingue |
| `companies` | ✅ | Gestion entreprises + user_company_roles |
| `dashboards` | ✅ | Looker Studio integration + KPI dashboards |
| `agents` / `assignment` | ✅ | Auto-assignment 5-criteria + workload management |
| `inspections` | 🟡 | Inspector tablet + field collection — stabilisation lock ordering en cours |
| `treasury` | 🟡 | Reconciliation + analytics + anomaly detection |
| `bundle_payment` | 🟡 | Bundle commercial license payment, refacto récente (commit 401ad737) |
| `menu_config` | ✅ | Menus dynamiques workflow-based ou explicit |
| `homepage` | ✅ | Pages publiques d'accueil multilingues |
| `translations` | ✅ | Translations BD + entity translations + system messages |
| `audit_logs` | ✅ | Audit append-only de toutes les actions critiques |
| `enrichment` | 🟡 | Enrichissement données externes (à stabiliser) |
| `verified_identifiers` | 🟡 | Identifiants vérifiés citoyens (à étendre) |
| `cities` / `entity_locations` | ✅ | Géographie GE (Bata + Malabo + provinces) |
| `accountant` / `funcionario` / `admin` | ✅ | Endpoints spécialisés par rôle |
| `legal` | ✅ | Pages légales (privacy, terms, account deletion) |
| `batch_requests` | 🟡 | Requêtes batch citizen / agent (à étendre) |
| `user_documents` | ✅ | Documents utilisateur stockés |

### 4.2 Modules frontend (Next.js 14 App Router)

| Catégorie | Modules | Statut |
|---|---|---|
| Auth | login, register, 2FA, recovery, lockout | ✅ |
| Citizen dashboard | déclarations, paiements, demandes, notifications, profil | ✅ |
| Business dashboard | multi-entité, déclarations groupées, comptabilité | 🟡 |
| Agent DGI dashboard | inbox, workload, SLA, assignment, escalation | ✅ |
| Agent ministry dashboard | reconciliation, validation, reporting | ✅ |
| Supervisor dashboard | équipe view, réassignation, KPIs | ✅ |
| Admin dashboard | users, permissions, RBAC, audit, menu config, entities | ✅ |
| Inspector mobile | field collection, payment intake, OCR offline | 🟡 |
| Mobile citizen (Expo) | login, déclaration simple, paiement BANGE, notifications push FCM | 🟡 |
| Public pages (homepage, legal, support) | multilingue ES/FR/EN | ✅ |
| Chatbot widget | embed sur toutes pages, conversation history | ✅ |
| OCR document upload | preview + validate pattern | ✅ |
| Manual i18n | docs/manual/ HTML statique trilingue | ✅ |

### 4.3 Capacités planifiées V2 (via Facil Framework V1.1)

📋 Planifié dans `C:/facil_framework/.claude/plans/TREASURY_CAPABILITIES_UPGRADE_PLAN.md` :

- ERP Sage X3 connector (Phase O)
- Audit chain immuable Postgres+Trillian+Sigstore Rekor (Phase P, palliatif Hyperledger)
- Government numbering schemes + public accounting catalogs (Phase Q)
- ISO 20022 banking gateway (Phase R)
- External system adapters (Phase S, pour SIGREF/SYDONIA/CONTFIN-style)
- PWA offline + recours workflow + formation in-app (Phase T)
- AATL signature provider + XAdES + OCSP (Phase N.5 extension)
- LDAP/AD direct + multi-AD + group RBAC (Phase J extension)
- Keycloak provider optionnel (Phase J Keycloak extension)

---

## 5. User stories prioritaires

### 5.1 Stories Citoyen / Contribuable

**US-001** — *As a* citoyen, *I want* m'inscrire avec mon NIF en moins de 3 minutes, *so that* je peux commencer à utiliser Facil rapidement.
- **Critères d'acceptation** :
  - Formulaire avec NIF + email + mot de passe + langue (ES par défaut)
  - Validation email avec lien expirable 15 min
  - Détection format NIF GE (algorithme module 11)
  - 2FA proposé mais pas obligatoire à l'inscription
  - Confirmation email envoyée + redirection dashboard

**US-002** — *As a* citoyen, *I want* déclarer mon IVA mensuelle depuis mon mobile en moins de 10 minutes, *so that* je n'aie pas à me déplacer au bureau DGI.
- **Critères** :
  - Sélection du type de déclaration (IVA destajo / IVA real)
  - Pré-remplissage des champs depuis dernière déclaration
  - Calcul automatique du montant à payer
  - Upload de pièces justificatives (PDF / photo)
  - Validation pré-soumission avec récapitulatif
  - Génération IUI + redirection paiement

**US-003** — *As a* citoyen, *I want* payer ma déclaration via BANGE Mobile Money en moins de 2 minutes, *so that* je n'utilise pas mon faible solde data.
- **Critères** :
  - Sélection BANGE comme méthode
  - Saisie numéro BANGE + PIN
  - Confirmation montant à débiter
  - Confirmation paiement temps réel
  - Reçu PDF généré et téléchargeable

**US-004** — *As a* citoyen, *I want* vérifier l'authenticité d'un reçu via QR code sans m'authentifier, *so that* je puisse confirmer qu'un document est officiel.
- **Critères** :
  - Scan QR redirige vers `/verify/request/{ref}?t={token}`
  - Endpoint public sans auth requise
  - Affichage : référence, date, montant, émetteur, statut
  - Pas d'exposition de données personnelles

**US-005** — *As a* citoyen rural, *I want* poser une question via WhatsApp Business au chatbot, *so that* je n'ai pas besoin de connexion data permanente.
- **Critères** :
  - Webhook WhatsApp Business configuré
  - Chatbot RAG répond en ES/FR
  - Réponses incluant liens directs ou instructions USSD
  - Historique conversation accessible si user identifié

**US-006** — *As a* citoyen, *I want* recevoir des notifications push quand mon dossier change de statut, *so that* je n'aie pas besoin de revenir vérifier manuellement.
- **Critères** :
  - Push FCM sur Android, APNs sur iOS
  - Notification email en parallèle
  - Lien deep link vers le détail de la demande
  - Option de désactivation par catégorie

**US-007** — *As a* citoyen, *I want* consulter l'historique de mes paiements et reçus, *so that* je puisse les exporter pour ma comptabilité.
- **Critères** :
  - Liste paginée avec filtres (date, type, statut)
  - Export CSV / PDF
  - Téléchargement individuel des reçus signés

### 5.2 Stories Entreprise

**US-008** — *As a* entreprise, *I want* gérer plusieurs utilisateurs avec rôles distincts (préparateur / valideur), *so that* je puisse séparer les responsabilités.
- **Critères** :
  - Page « équipe » avec invitation par email
  - 4 rôles entreprise : owner, admin, accountant, member
  - Workflow 4-yeux pour soumissions importantes
  - Audit log par utilisateur

**US-009** — *As a* entreprise, *I want* déclarer mes IVA mensuelles avec import Excel, *so that* je gagne du temps sur la saisie répétitive.
- **Critères** :
  - Template Excel téléchargeable
  - Upload + parsing avec validation lignes
  - Erreurs identifiées par ligne
  - Soumission après correction

**US-010** — *As a* entreprise, *I want* payer mon bundle de licence commerciale en une seule transaction, *so that* je n'aie pas à faire plusieurs paiements.
- **Critères** :
  - Sélection licences à renouveler
  - Calcul montant total avec taxes
  - Paiement unique BANGE / virement
  - Génération reçus individuels par licence

### 5.3 Stories Agent DGI

**US-011** — *As a* agent DGI, *I want* recevoir les nouvelles déclarations automatiquement assignées, *so that* je n'aie pas à les choisir manuellement.
- **Critères** :
  - Auto-assignment au login basé sur scoring 5-criteria (workload, expertise, location, SLA, complexity)
  - Notification interne nouvelle assignation
  - File personnelle visible avec priorisation

**US-012** — *As a* agent DGI, *I want* voir ma file de travail priorisée par SLA, *so that* je traite d'abord les cas urgents.
- **Critères** :
  - Vue liste avec colonnes (référence, contribuable, type, SLA restant, priorité)
  - Tri automatique par SLA croissant
  - Filtres par type, statut, date

**US-013** — *As a* agent DGI, *I want* demander des documents complémentaires au contribuable sans perdre l'assignation, *so that* je puisse continuer le traitement après réception.
- **Critères** :
  - Status passe à `waiting_documents` (pas `cancelled`)
  - SLA suspendu pendant attente
  - Notification automatique au contribuable
  - Reprise auto à réception documents

**US-014** — *As a* agent DGI, *I want* approuver ou rejeter une déclaration avec motif tracé, *so that* je laisse un audit trail clair.
- **Critères** :
  - Dropdown motifs prédéfinis + champ libre
  - Signature électronique de la décision
  - Audit log immuable
  - Notification automatique au contribuable

**US-015** — *As a* agent DGI, *I want* escalader un cas complexe à mon superviseur, *so that* j'obtienne validation avant action.
- **Critères** :
  - Bouton « escalader » avec sélection motif
  - SLA superviseur déclenché
  - Notification supervisor + replacement temporaire dans la queue

**US-016** — *As a* agent DGI inspector, *I want* collecter un paiement sur le terrain depuis ma tablette, *so that* je sécurise immédiatement la recette.
- **Critères** :
  - Formulaire collection sur tablet
  - Sélection type de licence / amende
  - Paiement mobile money sur place
  - Reçu imprimé + envoi email
  - Sync offline-online (lock ordering 4 niveaux)

### 5.4 Stories Agent Trésor

**US-017** — *As a* agent Trésor, *I want* réconcilier automatiquement les paiements reçus aux déclarations, *so that* je consacre mon temps aux exceptions.
- **Critères** :
  - Cron toutes les heures de réconciliation auto
  - Matching primaire par IUI dans libellé
  - Matching secondaire par IBAN + montant + date ± 2j
  - Liste exceptions à traiter manuellement

**US-018** — *As a* agent Trésor, *I want* générer un reçu officiel signé électroniquement, *so that* le contribuable ait un document opposable.
- **Critères** :
  - Génération PDF avec template officiel
  - Signature électronique (PAdES, futur AATL en V1.1)
  - QR code vérifiable inclus
  - Envoi automatique email contribuable

**US-019** — *As a* agent Trésor, *I want* voir un dashboard temps réel des recettes consolidées, *so that* je puisse reporter au DG en fin de journée.
- **Critères** :
  - KPIs : recettes du jour, % vs hier, top 5 services percepteurs
  - Filtres par direction émettrice et type de service
  - Export PDF rapport quotidien

### 5.5 Stories Superviseur

**US-020** — *As a* superviseur, *I want* voir le workload de mon équipe en temps réel, *so that* je puisse rééquilibrer si nécessaire.
- **Critères** :
  - Vue équipe avec workload par agent (assignations actives, SLA à risque)
  - Indicateurs surcharge / sous-charge
  - Drag-drop réassignation manuelle

**US-021** — *As a* superviseur, *I want* recevoir alerte si un agent dépasse 5 cas escaladés en 24h, *so that* je puisse identifier un problème de formation ou de complexité.
- **Critères** :
  - Alerte email + notification dashboard
  - Drill-down sur les cas escaladés
  - Action : ré-assignation, formation, ou validation

**US-022** — *As a* superviseur, *I want* exporter rapport mensuel performance équipe, *so that* je le présente à ma direction.
- **Critères** :
  - Export Excel ou PDF avec KPIs équipe + par agent
  - Comparaison mois M vs M-1
  - Graphiques inclus

### 5.6 Stories Admin

**US-023** — *As a* admin, *I want* créer un nouvel utilisateur avec rôle spécifique en moins de 2 minutes, *so that* l'onboarding agents soit rapide.
- **Critères** :
  - Formulaire avec champs requis (email, rôle, métadonnées)
  - Sélection rôle parmi 7 du `user_role_enum`
  - Email d'invitation automatique avec lien création mot de passe
  - 2FA configurable obligatoire selon rôle

**US-024** — *As a* admin, *I want* configurer dynamiquement les menus par rôle, *so that* je n'aie pas à re-déployer le code.
- **Critères** :
  - Page `/admin/menu-config` avec table CRUD
  - JSON config menu par rôle
  - Workflow-based mapping pour menu auto
  - Cache invalidation auto au save

**US-025** — *As a* admin, *I want* visualiser les audit logs avec filtres, *so that* j'investigue les incidents.
- **Critères** :
  - Vue paginée avec filtres (user, action, entity_type, date range)
  - Drill-down sur l'événement avec old_values / new_values
  - Export pour analyse externe

**US-026** — *As a* admin, *I want* assigner permissions granulaires à un utilisateur sans changer son rôle, *so that* je gère les exceptions.
- **Critères** :
  - Override par utilisateur via `user_permissions`
  - Audit log changement permission
  - Cache invalidation immédiate

**US-027** — *As a* admin, *I want* configurer les règles d'auto-assignment, *so that* le scoring s'adapte aux pratiques internes.
- **Critères** :
  - Page d'édition pondération criteria (workload, expertise, location, SLA, complexity)
  - Test avec scénario fictif
  - Déploiement à chaud

### 5.7 Stories transverses

**US-028** — *As any user*, *I want* changer de langue à la volée, *so that* j'utilise la langue dans laquelle je suis le plus à l'aise.
- **Critères** :
  - Switcher visible dans header (ES / FR / EN)
  - Persistance préférence en BD
  - Application immédiate sans reload

**US-029** — *As any user*, *I want* recevoir réponses chatbot dans ma langue préférée, *so that* je comprenne mieux.
- **Critères** :
  - Détection langue user via préférence
  - Override possible par user dans le widget

**US-030** — *As any user*, *I want* signaler un problème via support ticket, *so that* je puisse obtenir de l'aide.
- **Critères** :
  - Formulaire support avec catégorisation
  - Upload pièces jointes
  - Réponse email avec numéro ticket
  - Suivi statut ticket

**US-031** — *As a planet citizen* (RGPD), *I want* demander suppression de mon compte avec données associées, *so that* mes droits soient respectés.
- **Critères** :
  - Workflow account deletion avec confirmation email
  - Soft delete 30j puis hard delete
  - Anonymisation logs vs suppression
  - Documentation légale claire (page legal)

**US-032** — *As an external system* (banque), *I want* notifier paiement reçu via webhook, *so that* Facil marque automatiquement la déclaration payée.
- **Critères** :
  - Endpoint webhook signé HMAC
  - IP whitelist banque
  - Idempotency key pour éviter doublons
  - Retry queue si Facil indisponible temporairement

---

## 6. Exigences non fonctionnelles (NFR)

### 6.1 Performance

- API critiques : latence p95 < 300 ms, p99 < 1 s
- Endpoint chatbot : p95 < 3 s (incluant call Gemini)
- Endpoint paiement BANGE : p95 < 2 s (incluant call BANGE wallet)
- OCR document : traitement async via queue, retour user < 30 s pour preview

### 6.2 Scalabilité

- 100+ agents publics concurrent (lock ordering implémenté pour bundle / field payment)
- 100k+ contribuables concurrent en lecture
- 1M+ contribuables enregistrés à terme
- Throughput cible : 10k requests/sec backend (autoscaling Cloud Run)

### 6.3 Disponibilité

- SLA cible **99,5 %** (downtime annuel acceptable ~44h)
  > Pas 99,99 % (downtime ~52 min/an) — irréaliste pour 1 dev sans équipe ops 24/7. À reviser à V2 si client gov exige
- RTO (recovery time) : 4h max pour services critiques
- RPO (recovery point) : 15 min max de perte de données via backups Supabase

### 6.4 Sécurité

- RBAC granulaire 50+ permissions
- 2FA TOTP obligatoire pour admin, supervisor, dgi_agent, ministry_agent
- Bcrypt 12 rounds pour passwords
- Audit log append-only (table `audit_logs`)
- TLS 1.3 partout (Cloud Run + Cloudflare)
- AES-256-GCM pour data sensibles au repos
- HMAC pour webhooks
- Rate limiting par user + endpoint
- AI Security : détection prompt injection (mig 328)
- Security Observability : tracking IP/UA/Geo + injection persistence (mig 329-330)
- Conformité RGPD-compatible (account deletion, audit, data minimization)

### 6.5 Multilingue

- 3 langues complètes : ES (primaire), FR (secondaire), EN (international)
- Tables `translations` + `entity_translations` (40 % storage reduction)
- Switching à la volée sans reload
- Templates emails / SMS / push multilingues

### 6.6 Mobile

- iOS 14+ + Android 8+ via Expo SDK 49+
- EAS Build pour CI/CD APK/IPA/AAB
- Push notifications natives FCM (Android) + APNs (iOS) — pas Expo Push pour 1M users
- Sync offline limité (V1) + extension PWA offline (V1.1 via Phase T)

### 6.7 Observabilité

- Grafana Cloud avec Loki (logs) + Tempo (traces) + Prometheus (metrics)
- AI Observability : 17 call sites Gemini avec cost XAF + latency + error type (mig 325-328)
- Security Observability : table `request_telemetry` 31 cols + sampling adaptatif (mig 329-330)
- 5+ alertes configurées (cost spike, error rate, p95 latency, Tempo quota, injection spike)
- Looker Studio dashboards via wrappers MV automatiques

### 6.8 Conformité

- RGPD-compatible (pas de certification formelle V1, à viser V2)
- Pas certifié ISO 27001 / eIDAS / ENS V1 (12-18 mois chantier organisationnel à part)
- Documentation légale en place (privacy, terms, account deletion)

---

## 7. Roadmap fonctionnelle 12-24 mois

Cf. master §9 + Facil V1.1 plan.

### 7.1 Q3 2026 — Pilote Guinée Équatoriale
- Soft go-live avec DGIR + DGT
- 50-100 agents publics formés
- 500-2 000 contribuables tests volontaires
- Stabilisation production basée sur feedback réel

### 7.2 Q4 2026 — Soft launch citizen-facing
- Communication publique progressive
- App mobile relancée Play Store via voie alternative (PWA web fallback en backup)
- Mesure NPS + métriques adoption
- Itération UX prioritaire

### 7.3 Q1 2027 — Stabilisation + 1er rapport d'impact
- Stabilisation basée sur retours pilote
- Premier rapport d'impact mesuré (recettes mobilisées, temps économisé)
- Stratégie commerciale CEMAC affinée

### 7.4 Q2-Q3 2027 — Bootstrap Facil Framework V1
- Extraction socle réutilisable depuis Facil
- Multi-tenant strict
- Profils gov-emergent-country + private-services + saas + banking + empty
- Premier client beta Facil Framework

### 7.5 Q4 2027 — Premier déploiement régional
- Cible : Cameroun ou Gabon (CEMAC francophone)
- Customisation Facil Framework + profile gov-emergent-country
- Modèle de déploiement réplicable

### 7.6 Q1-Q2 2028 — Facil Framework V1.1 (treasury capabilities)
Cf. `C:/facil_framework/.claude/plans/TREASURY_CAPABILITIES_UPGRADE_PLAN.md` :
- Phase O — ERP Sage X3 connector (8-12j)
- Phase P — Audit chain immuable Postgres+Trillian+Sigstore Rekor (5-8j)
- Phase Q — Numbering schemes + accounting catalogs (5-7j)
- Phase R — ISO 20022 banking gateway (6-9j)
- Phase S — External system adapters (5-8j)
- Phase T — PWA offline + recours + formation (9-14j)
- Phase J ext — LDAP/AD direct + multi-AD + group RBAC (3-5j)
- Phase J Keycloak — KeycloakProvider optionnel (2-3j)
- Phase N.5 ext — AATL + XAdES + OCSP (3-5j)

Total V1.1 : 46-71j dev cumulés

### 7.7 H2 2028 — Régionalisation effective
- 2-3 déploiements actifs CEMAC / UEMOA
- Monétisation services managés
- Premier ARR significatif

---

## 8. Métriques de succès

### 8.1 Métriques produit

| Métrique | Cible 12 mois |
|---|---|
| DAU citoyens | 500-2 000 |
| MAU citoyens | 5 000-20 000 |
| Taux complétion déclaration | >70 % |
| NPS contribuables | >40 |
| % usage mobile vs web | >60 % |
| Taux chatbot resolution sans escalation | >50 % |

### 8.2 Métriques techniques

| Métrique | Cible |
|---|---|
| Uptime | >99,5 % |
| API latency p95 | <300 ms |
| Error rate | <0,5 % |
| Mean time to recovery (MTTR) | <1 h |
| Test coverage backend | >70 % (cible — actuellement plus faible) |

### 8.3 Métriques business

| Métrique | Cible 12 mois | Cible 24 mois |
|---|---|---|
| Pilotes actifs | 1 (GE) | 2-3 |
| Agents publics actifs | 50-100 | 500-1 000 |
| Déclarations traitées | 1 000-5 000 | 50 000-200 000 |
| Recettes mobilisées via plateforme | À mesurer | À mesurer |
| ARR récurrent | 0 (pilote gratuit) | 50-200 k€ premiers contrats |

> Toutes ces cibles sont indicatives. Pas de référence historique. À raffiner après pilote réel.

---

## 9. Risques

| ID | Risque | Probabilité | Impact | Mitigation |
|---|---|---|---|---|
| R-01 | Adoption citoyenne faible (résistance changement papier → digital) | Élevée | Critique | Mode hybride papier+digital pendant 12 mois, formation in-app, USSD pour low-tech |
| R-02 | Pilote GE retardé pour raisons politiques | Moyenne | Élevé | Plans B avec autres administrations (autres ministères), hedge contractuel |
| R-03 | Dépendance Vertex AI Gemini (lock-in cloud) | Faible | Moyen | Abstraction LLM via Facil V1 Phase B, possibilité Ollama on-prem |
| R-04 | Dépendance Supabase (lock-in) | Faible | Moyen | PostgreSQL standard, migration possible vers RDS / Cloud SQL / Neon |
| R-05 | Concurrence multinationale (SAP, Oracle entrent sur le marché) | Moyenne | Élevé | Différenciation souveraineté + mobile money local + multilingue |
| R-06 | Bus factor 1 (dev solo) | Élevée | Critique | Documentation extensive, recrutement prioritaire 2-3 devs en 6 mois |
| R-07 | Refus Play Store gov rejeté à nouveau (post 2026-05-08) | Moyenne | Moyen | PWA web fallback, voie B (sponsor institutionnel), AAB direct distribution |
| R-08 | Cycle vente B2G long (12-24 mois) | Élevée | Élevé | Démarrer prospection en parallèle pilote, RFPs BAD multiples en parallèle |
| R-09 | Dépendance bailleurs (BAD, BM) pour financement | Moyenne | Élevé | Diversifier sources : VCs Africa, gov direct contracts, Open Core revenues |
| R-10 | Compliance RGPD / ENS / ISO 27001 demandée tardivement par client | Moyenne | Moyen | Doc compliance roadmap V2 + budget audit prévu |
| R-11 | Bug critique en production sans équipe ops 24/7 | Moyenne | Élevé | Observabilité Grafana + alerting + on-call solo + circuit breakers |
| R-12 | Données fiscales sensibles compromises (incident sécurité) | Faible | Critique | Pen-test semestriel, AI Security + Security Observability, audit logs immuable |
| R-13 | Évolution réglementaire fiscale rapide en GE (changement IVA, etc.) | Moyenne | Moyen | Architecture configurable, BD de règles paramétrables, pas de hardcoding |

---

## 10. Out of scope V1

Ce qu'on ne fait PAS pour rester focus :

- ❌ **Blockchain Hyperledger Fabric** — palliatif Postgres+Trillian+Rekor proposé en Facil V1.1 Phase P
- ❌ **Sage X3 connector** — V2 via Facil V1.1 Phase O
- ❌ **eIDAS qualifié national** — V2 via Facil V1.1 N.5 ext (AATL en MVP)
- ❌ **ISO 20022 banking gateway** — V2 via Facil V1.1 Phase R
- ❌ **Active Directory direct** — V2 via Facil V1.1 J ext (SAML disponible V1)
- ❌ **Keycloak intégré** — V2 optionnel via Facil V1.1 J Keycloak ext
- ❌ **Biométrie passeport / KYC renforcé** — V2 si demande client
- ❌ **Marketplace de services tiers** — V2+
- ❌ **Multi-tenant strict** (1 deploy = 1 client en V1) — V2 via Facil multi-tenant
- ❌ **Certification formelle ISO 27001 / SOC 2** — V2, chantier organisationnel 12-18 mois

---

## 11. Annexes

### 11.1 Glossaire termes métiers

| Terme | Définition |
|---|---|
| **IVA** | Impuesto sobre el Valor Añadido — équivalent TVA |
| **IRPF** | Impuesto sobre la Renta de las Personas Físicas — impôt sur le revenu |
| **Retención** | Retenue à la source (impôt prélevé en amont du paiement) |
| **Petroliferos** | Déclarations spécifiques au secteur pétrolier (volume faible mais montants élevés) |
| **Cuota mínima** | Cotisation minimale forfaitaire |
| **NIF** | Número de Identificación Fiscal — identifiant fiscal contribuable |
| **DGIR** | Direction Générale des Impôts et Recouvrement |
| **DGT** | Direction Générale du Trésor |
| **MFPDE** | Ministère des Finances de la Planification et du Développement Économique |
| **PCE-GE** | Plan Comptable de l'État — Guinée Équatoriale |
| **CEMAC** | Communauté Économique et Monétaire de l'Afrique Centrale |
| **UEMOA** | Union Économique et Monétaire Ouest-Africaine |
| **OHADA** | Organisation pour l'Harmonisation en Afrique du Droit des Affaires |
| **BANGE** | Banque Nationale de Guinée Équatoriale (mobile money provider) |
| **GETESA / MUNI** | Opérateurs télécoms GE avec USSD intégré |
| **IUI / IUG** | Identifiants uniques recettes / dépenses (PIMEPE-style) |

### 11.2 Liens documents complémentaires

- (document interne) — source de vérité positionnement
- `01-PRESENTATION_TECHNIQUE.md` — architecture technique détaillée
- `03-BPMN_PROCESSES.md` — workflows métier détaillés (10 processus)
- `bpmn/*.mmd` — diagrammes Mermaid individuels par processus
- `C:/taxasge/CLAUDE.md` — référence technique opérationnelle
- `C:/facil_framework/.claude/plans/TREASURY_CAPABILITIES_UPGRADE_PLAN.md` — plan upgrade Facil V1.1 (référencé pour roadmap V2 Facil)

### 11.3 Statut maturité par module (vue agrégée)

```
Backend (35 modules réels) :
  ✅ Implémenté testé : 24
  🟡 Partiel/stabilisation : 10
  📋 Planifié V1.1+ : 1 (treasury V1.1 features)

Frontend (38 modules réels) :
  ✅ Implémenté testé : 28
  🟡 Partiel/stabilisation : 8
  📋 Planifié V1.1+ : 2 (recours, formation in-app)
```

---

*Fin du PRD. Ce document est vivant — il sera mis à jour à chaque itération produit majeure. Toute modification structurelle nécessite revue cohérence avec le master positioning.*
