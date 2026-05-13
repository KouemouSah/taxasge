# Facil — Documentation produit

> Documentation publique du projet **Facil** : plateforme native souveraine de transformation digitale fiscale pour les administrations publiques émergentes.
>
> Première instance déployée en Guinée Équatoriale, conçue pour s'étendre à la région CEMAC / UEMOA / OHADA.

## Accès rapide

| Document | Description | Format |
|---|---|---|
| 📘 [**Présentation technique**](01-PRESENTATION_TECHNIQUE.md) | Architecture 3-tiers, 31 modules backend, 42 frontend, 77 tables PostgreSQL, observabilité Grafana, déploiement Cloud Run | Markdown |
| 📋 [**PRD — Product Requirements**](02-PRD.md) | Vision produit, personas, 32 user stories, NFR, roadmap 12-24 mois, risques | Markdown |
| 🔄 [**BPMN — Processus métier v2**](03-BPMN_PROCESSES.md) | 10 workflows métier + 4 vues C4 architecture + état machine globale + pattern lock ordering (1 800 lignes) | Markdown + 17 diagrammes Mermaid |
| 🌐 [**Site web interactif**](web/index.html) | Vue interactive : PRD filtrable + BPMN visuel + vue couplée user stories ↔ workflows | HTML / CSS / JS vanilla |

## Site web interactif

Le dossier [`web/`](web/) contient un mini-site statique (vanilla HTML/CSS/JS, sans framework) qui rend la documentation accessible visuellement :

- **`web/index.html`** — landing avec 3 cartes d'accès rapide + 6 piliers en schéma hub-and-spoke
- **`web/prd.html`** — PRD interactif (32 user stories filtrables par persona / statut / priorité, recherche en direct, vue sticky-notes color-coded)
- **`web/bpmn.html`** — BPMN visuel (17 diagrammes Mermaid rendus inline)
- **`web/prd-bpmn.html`** — vue couplée split-screen user story ↔ workflow

Le site fonctionne **100 % offline** : double-clic sur `web/index.html` (toutes les dépendances dont Mermaid 10.9.1 sont en local dans `web/assets/`).

## Statut produit

- **Maturité** : MVP avancé pre-launch
- **Backend** : 31 modules métier, 77 tables PostgreSQL, 25 enums, 300+ migrations
- **Frontend** : 42 modules Next.js 14 + Expo mobile (iOS / Android)
- **Observabilité** : Grafana Cloud (Loki + Tempo + Prometheus + AI/Security Observability)
- **Pilote** : Q3 2026 cible — portail numérique DGT et entités partenaires
- **Régions** : GE → CEMAC / UEMOA / OHADA. Multilingue ES / FR / EN

## 6 piliers de la solution

1. **Catalogue centralisé** — 850+ services fiscaux + 28 types de déclarations
2. **Inspection terrain** — app mobile + tablet inspector avec sync offline
3. **Paiement multi-canal** — BANGE Mobile Money + USSD GETESA/MUNI + cartes + virements + cash
4. **Chatbot IA** — Vertex AI Gemini RAG, 24/7, multilingue ES/FR/EN
5. **OCR + observabilité** — Gemini extraction + Grafana Cloud production-grade
6. **App mobile citoyen** — Expo natif iOS/Android, notifications push, mode offline, USSD

## Contact

- **Auteur** : KOUEMOU SAH JEAN EMAC
- **Email** : kouemou.sah@gmail.com
- **Audience** : équipe produit, technique, partenaires institutionnels, bailleurs internationaux

---

© 2026 **Facil** — KOUEMOU SAH JEAN EMAC. Tous droits réservés.
