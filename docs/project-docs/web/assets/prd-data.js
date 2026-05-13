window.PRD_DATA = 
{
  "meta": {
    "version": "1.0",
    "source": "02-PRD.md",
    "generated": "2026-05-11",
    "audience": "produit / technique / partenaires institutionnels / advisors",
    "maturity": "MVP avancé pre-launch"
  },
  "personas": [
    { "id": "citizen", "name": "Citoyen", "icon": "C", "color": "#1F4E79", "description": "Personne physique contribuable GE" },
    { "id": "business", "name": "Entreprise", "icon": "B", "color": "#0B7A6E", "description": "PME ou grande entreprise GE" },
    { "id": "accountant", "name": "Comptable", "icon": "A", "color": "#6E45A1", "description": "Comptable indépendant / cabinet" },
    { "id": "dgi_agent", "name": "Agent entité", "icon": "D", "color": "#B5651C", "description": "Fonctionnaire administration fiscale" },
    { "id": "ministry_agent", "name": "Agent Trésor", "icon": "T", "color": "#B02A6F", "description": "Agent Trésor / ministériel" },
    { "id": "supervisor", "name": "Superviseur", "icon": "S", "color": "#4A4A4A", "description": "Manager d'équipe agents" },
    { "id": "admin", "name": "Admin", "icon": "X", "color": "#B02A37", "description": "Administrateur plateforme" },
    { "id": "transverse", "name": "Transverse", "icon": "*", "color": "#0B5A8C", "description": "Cross-persona / système" }
  ],
  "sections": [
    { "id": "executive-summary", "title": "1. Executive Summary" },
    { "id": "vision", "title": "2. Vision et stratégie" },
    { "id": "personas", "title": "3. Personas" },
    { "id": "features", "title": "4. Fonctionnalités existantes" },
    { "id": "user-stories", "title": "5. User Stories" },
    { "id": "nfr", "title": "6. Exigences non fonctionnelles" },
    { "id": "roadmap", "title": "7. Roadmap 12-24 mois" },
    { "id": "metrics", "title": "8. Métriques de succès" },
    { "id": "risks", "title": "9. Risques" },
    { "id": "out-of-scope", "title": "10. Out of scope V1" },
    { "id": "glossary", "title": "11. Glossaire" }
  ],
  "user_stories": [
    {
      "id": "US-001",
      "title": "Inscription rapide avec NIF",
      "persona": "citizen",
      "priority": "P0",
      "status": "implemented",
      "as_a": "citoyen",
      "i_want": "m'inscrire avec mon NIF en moins de 3 minutes",
      "so_that": "je peux commencer à utiliser Facil rapidement",
      "acceptance_criteria": [
        "Formulaire avec NIF + email + mot de passe + langue (ES par défaut)",
        "Validation email avec lien expirable 15 min",
        "Détection format NIF GE (algorithme module 11)",
        "2FA proposé mais pas obligatoire à l'inscription",
        "Confirmation email envoyée + redirection dashboard"
      ],
      "linked_workflows": ["09-2fa-authentication"]
    },
    {
      "id": "US-002",
      "title": "Déclaration IVA mensuelle mobile",
      "persona": "citizen",
      "priority": "P0",
      "status": "implemented",
      "as_a": "citoyen",
      "i_want": "déclarer mon IVA mensuelle depuis mon mobile en moins de 10 minutes",
      "so_that": "je n'aie pas à me déplacer au bureau DGI",
      "acceptance_criteria": [
        "Sélection du type de déclaration (IVA destajo / IVA real)",
        "Pré-remplissage des champs depuis dernière déclaration",
        "Calcul automatique du montant à payer",
        "Upload de pièces justificatives (PDF / photo)",
        "Validation pré-soumission avec récapitulatif",
        "Génération IUI + redirection paiement"
      ],
      "linked_workflows": ["01-declaration-iva", "04-payment-bange"]
    },
    {
      "id": "US-003",
      "title": "Paiement BANGE Mobile Money",
      "persona": "citizen",
      "priority": "P0",
      "status": "implemented",
      "as_a": "citoyen",
      "i_want": "payer ma déclaration via BANGE Mobile Money en moins de 2 minutes",
      "so_that": "je n'utilise pas mon faible solde data",
      "acceptance_criteria": [
        "Sélection BANGE comme méthode",
        "Saisie numéro BANGE + PIN",
        "Confirmation montant à débiter",
        "Confirmation paiement temps réel",
        "Reçu PDF généré et téléchargeable"
      ],
      "linked_workflows": ["04-payment-bange"]
    },
    {
      "id": "US-004",
      "title": "Vérification authenticité reçu via QR",
      "persona": "citizen",
      "priority": "P1",
      "status": "implemented",
      "as_a": "citoyen",
      "i_want": "vérifier l'authenticité d'un reçu via QR code sans m'authentifier",
      "so_that": "je puisse confirmer qu'un document est officiel",
      "acceptance_criteria": [
        "Scan QR redirige vers /verify/request/{ref}?t={token}",
        "Endpoint public sans auth requise",
        "Affichage : référence, date, montant, émetteur, statut",
        "Pas d'exposition de données personnelles"
      ],
      "linked_workflows": ["04-payment-bange", "03-citizen-service-request"]
    },
    {
      "id": "US-005",
      "title": "Question chatbot WhatsApp Business",
      "persona": "citizen",
      "priority": "P1",
      "status": "implemented",
      "as_a": "citoyen rural",
      "i_want": "poser une question via WhatsApp Business au chatbot",
      "so_that": "je n'ai pas besoin de connexion data permanente",
      "acceptance_criteria": [
        "Webhook WhatsApp Business configuré",
        "Chatbot RAG répond en ES/FR",
        "Réponses incluant liens directs ou instructions USSD",
        "Historique conversation accessible si user identifié"
      ],
      "linked_workflows": ["11-c4-context"]
    },
    {
      "id": "US-006",
      "title": "Notifications push statut dossier",
      "persona": "citizen",
      "priority": "P0",
      "status": "implemented",
      "as_a": "citoyen",
      "i_want": "recevoir des notifications push quand mon dossier change de statut",
      "so_that": "je n'aie pas besoin de revenir vérifier manuellement",
      "acceptance_criteria": [
        "Push FCM sur Android, APNs sur iOS",
        "Notification email en parallèle",
        "Lien deep link vers le détail de la demande",
        "Option de désactivation par catégorie"
      ],
      "linked_workflows": ["03-citizen-service-request"]
    },
    {
      "id": "US-007",
      "title": "Historique paiements et reçus",
      "persona": "citizen",
      "priority": "P1",
      "status": "implemented",
      "as_a": "citoyen",
      "i_want": "consulter l'historique de mes paiements et reçus",
      "so_that": "je puisse les exporter pour ma comptabilité",
      "acceptance_criteria": [
        "Liste paginée avec filtres (date, type, statut)",
        "Export CSV / PDF",
        "Téléchargement individuel des reçus signés"
      ],
      "linked_workflows": ["04-payment-bange"]
    },
    {
      "id": "US-008",
      "title": "Multi-utilisateurs avec rôles entreprise",
      "persona": "business",
      "priority": "P1",
      "status": "partial",
      "as_a": "entreprise",
      "i_want": "gérer plusieurs utilisateurs avec rôles distincts (préparateur / valideur)",
      "so_that": "je puisse séparer les responsabilités",
      "acceptance_criteria": [
        "Page équipe avec invitation par email",
        "4 rôles entreprise : owner, admin, accountant, member",
        "Workflow 4-yeux pour soumissions importantes",
        "Audit log par utilisateur"
      ],
      "linked_workflows": ["09-2fa-authentication"]
    },
    {
      "id": "US-009",
      "title": "Déclaration IVA via import Excel",
      "persona": "business",
      "priority": "P1",
      "status": "partial",
      "as_a": "entreprise",
      "i_want": "déclarer mes IVA mensuelles avec import Excel",
      "so_that": "je gagne du temps sur la saisie répétitive",
      "acceptance_criteria": [
        "Template Excel téléchargeable",
        "Upload + parsing avec validation lignes",
        "Erreurs identifiées par ligne",
        "Soumission après correction"
      ],
      "linked_workflows": ["01-declaration-iva"]
    },
    {
      "id": "US-010",
      "title": "Bundle paiement licence commerciale",
      "persona": "business",
      "priority": "P0",
      "status": "partial",
      "as_a": "entreprise",
      "i_want": "payer mon bundle de licence commerciale en une seule transaction",
      "so_that": "je n'aie pas à faire plusieurs paiements",
      "acceptance_criteria": [
        "Sélection licences à renouveler",
        "Calcul montant total avec taxes",
        "Paiement unique BANGE / virement",
        "Génération reçus individuels par licence"
      ],
      "linked_workflows": ["08-bundle-payment-licence", "04-payment-bange"]
    },
    {
      "id": "US-011",
      "title": "Réception déclarations auto-assignées",
      "persona": "dgi_agent",
      "priority": "P0",
      "status": "implemented",
      "as_a": "agent DGI",
      "i_want": "recevoir les nouvelles déclarations automatiquement assignées",
      "so_that": "je n'aie pas à les choisir manuellement",
      "acceptance_criteria": [
        "Auto-assignment au login basé sur scoring 5-criteria (workload, expertise, location, SLA, complexity)",
        "Notification interne nouvelle assignation",
        "File personnelle visible avec priorisation"
      ],
      "linked_workflows": ["05-agent-assignment"]
    },
    {
      "id": "US-012",
      "title": "File de travail priorisée par SLA",
      "persona": "dgi_agent",
      "priority": "P0",
      "status": "implemented",
      "as_a": "agent DGI",
      "i_want": "voir ma file de travail priorisée par SLA",
      "so_that": "je traite d'abord les cas urgents",
      "acceptance_criteria": [
        "Vue liste avec colonnes (référence, contribuable, type, SLA restant, priorité)",
        "Tri automatique par SLA croissant",
        "Filtres par type, statut, date"
      ],
      "linked_workflows": ["05-agent-assignment", "01-declaration-iva"]
    },
    {
      "id": "US-013",
      "title": "Demande documents complémentaires",
      "persona": "dgi_agent",
      "priority": "P0",
      "status": "implemented",
      "as_a": "agent DGI",
      "i_want": "demander des documents complémentaires au contribuable sans perdre l'assignation",
      "so_that": "je puisse continuer le traitement après réception",
      "acceptance_criteria": [
        "Status passe à waiting_documents (pas cancelled)",
        "SLA suspendu pendant attente",
        "Notification automatique au contribuable",
        "Reprise auto à réception documents"
      ],
      "linked_workflows": ["03-citizen-service-request"]
    },
    {
      "id": "US-014",
      "title": "Approbation/rejet avec audit trail",
      "persona": "dgi_agent",
      "priority": "P0",
      "status": "implemented",
      "as_a": "agent DGI",
      "i_want": "approuver ou rejeter une déclaration avec motif tracé",
      "so_that": "je laisse un audit trail clair",
      "acceptance_criteria": [
        "Dropdown motifs prédéfinis + champ libre",
        "Signature électronique de la décision",
        "Audit log immuable",
        "Notification automatique au contribuable"
      ],
      "linked_workflows": ["01-declaration-iva", "03-citizen-service-request"]
    },
    {
      "id": "US-015",
      "title": "Escalation cas complexe au superviseur",
      "persona": "dgi_agent",
      "priority": "P1",
      "status": "implemented",
      "as_a": "agent DGI",
      "i_want": "escalader un cas complexe à mon superviseur",
      "so_that": "j'obtienne validation avant action",
      "acceptance_criteria": [
        "Bouton escalader avec sélection motif",
        "SLA superviseur déclenché",
        "Notification supervisor + replacement temporaire dans la queue"
      ],
      "linked_workflows": ["05-agent-assignment"]
    },
    {
      "id": "US-016",
      "title": "Collection paiement terrain (inspector)",
      "persona": "dgi_agent",
      "priority": "P0",
      "status": "partial",
      "as_a": "agent DGI inspector",
      "i_want": "collecter un paiement sur le terrain depuis ma tablette",
      "so_that": "je sécurise immédiatement la recette",
      "acceptance_criteria": [
        "Formulaire collection sur tablet",
        "Sélection type de licence / amende",
        "Paiement mobile money sur place",
        "Reçu imprimé + envoi email",
        "Sync offline-online (lock ordering 4 niveaux)"
      ],
      "linked_workflows": ["02-inspection-field-payment", "17-pattern-lock-ordering"]
    },
    {
      "id": "US-017",
      "title": "Réconciliation automatique paiements",
      "persona": "ministry_agent",
      "priority": "P0",
      "status": "implemented",
      "as_a": "agent Trésor",
      "i_want": "réconcilier automatiquement les paiements reçus aux déclarations",
      "so_that": "je consacre mon temps aux exceptions",
      "acceptance_criteria": [
        "Cron toutes les heures de réconciliation auto",
        "Matching primaire par IUI dans libellé",
        "Matching secondaire par IBAN + montant + date ± 2j",
        "Liste exceptions à traiter manuellement"
      ],
      "linked_workflows": ["10-payment-reconciliation"]
    },
    {
      "id": "US-018",
      "title": "Génération reçu officiel signé",
      "persona": "ministry_agent",
      "priority": "P0",
      "status": "implemented",
      "as_a": "agent Trésor",
      "i_want": "générer un reçu officiel signé électroniquement",
      "so_that": "le contribuable ait un document opposable",
      "acceptance_criteria": [
        "Génération PDF avec template officiel",
        "Signature électronique (PAdES, futur AATL en V1.1)",
        "QR code vérifiable inclus",
        "Envoi automatique email contribuable"
      ],
      "linked_workflows": ["04-payment-bange", "10-payment-reconciliation"]
    },
    {
      "id": "US-019",
      "title": "Dashboard recettes consolidées",
      "persona": "ministry_agent",
      "priority": "P1",
      "status": "implemented",
      "as_a": "agent Trésor",
      "i_want": "voir un dashboard temps réel des recettes consolidées",
      "so_that": "je puisse reporter au DG en fin de journée",
      "acceptance_criteria": [
        "KPIs : recettes du jour, % vs hier, top 5 services percepteurs",
        "Filtres par direction émettrice et type de service",
        "Export PDF rapport quotidien"
      ],
      "linked_workflows": ["10-payment-reconciliation"]
    },
    {
      "id": "US-020",
      "title": "Workload équipe temps réel",
      "persona": "supervisor",
      "priority": "P0",
      "status": "implemented",
      "as_a": "superviseur",
      "i_want": "voir le workload de mon équipe en temps réel",
      "so_that": "je puisse rééquilibrer si nécessaire",
      "acceptance_criteria": [
        "Vue équipe avec workload par agent (assignations actives, SLA à risque)",
        "Indicateurs surcharge / sous-charge",
        "Drag-drop réassignation manuelle"
      ],
      "linked_workflows": ["05-agent-assignment"]
    },
    {
      "id": "US-021",
      "title": "Alerte escalations agent",
      "persona": "supervisor",
      "priority": "P1",
      "status": "implemented",
      "as_a": "superviseur",
      "i_want": "recevoir alerte si un agent dépasse 5 cas escaladés en 24h",
      "so_that": "je puisse identifier un problème de formation ou de complexité",
      "acceptance_criteria": [
        "Alerte email + notification dashboard",
        "Drill-down sur les cas escaladés",
        "Action : ré-assignation, formation, ou validation"
      ],
      "linked_workflows": ["05-agent-assignment"]
    },
    {
      "id": "US-022",
      "title": "Export rapport mensuel performance",
      "persona": "supervisor",
      "priority": "P2",
      "status": "implemented",
      "as_a": "superviseur",
      "i_want": "exporter rapport mensuel performance équipe",
      "so_that": "je le présente à ma direction",
      "acceptance_criteria": [
        "Export Excel ou PDF avec KPIs équipe + par agent",
        "Comparaison mois M vs M-1",
        "Graphiques inclus"
      ],
      "linked_workflows": []
    },
    {
      "id": "US-023",
      "title": "Création utilisateur avec rôle",
      "persona": "admin",
      "priority": "P0",
      "status": "implemented",
      "as_a": "admin",
      "i_want": "créer un nouvel utilisateur avec rôle spécifique en moins de 2 minutes",
      "so_that": "l'onboarding agents soit rapide",
      "acceptance_criteria": [
        "Formulaire avec champs requis (email, rôle, métadonnées)",
        "Sélection rôle parmi 7 du user_role_enum",
        "Email d'invitation automatique avec lien création mot de passe",
        "2FA configurable obligatoire selon rôle"
      ],
      "linked_workflows": ["09-2fa-authentication"]
    },
    {
      "id": "US-024",
      "title": "Configuration menus dynamiques",
      "persona": "admin",
      "priority": "P0",
      "status": "implemented",
      "as_a": "admin",
      "i_want": "configurer dynamiquement les menus par rôle",
      "so_that": "je n'aie pas à re-déployer le code",
      "acceptance_criteria": [
        "Page /admin/menu-config avec table CRUD",
        "JSON config menu par rôle",
        "Workflow-based mapping pour menu auto",
        "Cache invalidation auto au save"
      ],
      "linked_workflows": []
    },
    {
      "id": "US-025",
      "title": "Visualisation audit logs",
      "persona": "admin",
      "priority": "P1",
      "status": "implemented",
      "as_a": "admin",
      "i_want": "visualiser les audit logs avec filtres",
      "so_that": "j'investigue les incidents",
      "acceptance_criteria": [
        "Vue paginée avec filtres (user, action, entity_type, date range)",
        "Drill-down sur l'événement avec old_values / new_values",
        "Export pour analyse externe"
      ],
      "linked_workflows": []
    },
    {
      "id": "US-026",
      "title": "Permissions granulaires par utilisateur",
      "persona": "admin",
      "priority": "P1",
      "status": "implemented",
      "as_a": "admin",
      "i_want": "assigner permissions granulaires à un utilisateur sans changer son rôle",
      "so_that": "je gère les exceptions",
      "acceptance_criteria": [
        "Override par utilisateur via user_permissions",
        "Audit log changement permission",
        "Cache invalidation immédiate"
      ],
      "linked_workflows": []
    },
    {
      "id": "US-027",
      "title": "Configuration règles auto-assignment",
      "persona": "admin",
      "priority": "P1",
      "status": "implemented",
      "as_a": "admin",
      "i_want": "configurer les règles d'auto-assignment",
      "so_that": "le scoring s'adapte aux pratiques internes",
      "acceptance_criteria": [
        "Page d'édition pondération criteria (workload, expertise, location, SLA, complexity)",
        "Test avec scénario fictif",
        "Déploiement à chaud"
      ],
      "linked_workflows": ["05-agent-assignment"]
    },
    {
      "id": "US-028",
      "title": "Changement langue à la volée",
      "persona": "transverse",
      "priority": "P0",
      "status": "implemented",
      "as_a": "any user",
      "i_want": "changer de langue à la volée",
      "so_that": "j'utilise la langue dans laquelle je suis le plus à l'aise",
      "acceptance_criteria": [
        "Switcher visible dans header (ES / FR / EN)",
        "Persistance préférence en BD",
        "Application immédiate sans reload"
      ],
      "linked_workflows": []
    },
    {
      "id": "US-029",
      "title": "Chatbot dans langue préférée",
      "persona": "transverse",
      "priority": "P1",
      "status": "implemented",
      "as_a": "any user",
      "i_want": "recevoir réponses chatbot dans ma langue préférée",
      "so_that": "je comprenne mieux",
      "acceptance_criteria": [
        "Détection langue user via préférence",
        "Override possible par user dans le widget"
      ],
      "linked_workflows": ["06-document-validation-ocr"]
    },
    {
      "id": "US-030",
      "title": "Support ticket avec catégorisation",
      "persona": "transverse",
      "priority": "P1",
      "status": "implemented",
      "as_a": "any user",
      "i_want": "signaler un problème via support ticket",
      "so_that": "je puisse obtenir de l'aide",
      "acceptance_criteria": [
        "Formulaire support avec catégorisation",
        "Upload pièces jointes",
        "Réponse email avec numéro ticket",
        "Suivi statut ticket"
      ],
      "linked_workflows": []
    },
    {
      "id": "US-031",
      "title": "Suppression compte RGPD",
      "persona": "transverse",
      "priority": "P0",
      "status": "implemented",
      "as_a": "planet citizen",
      "i_want": "demander suppression de mon compte avec données associées",
      "so_that": "mes droits soient respectés",
      "acceptance_criteria": [
        "Workflow account deletion avec confirmation email",
        "Soft delete 30j puis hard delete",
        "Anonymisation logs vs suppression",
        "Documentation légale claire (page legal)"
      ],
      "linked_workflows": []
    },
    {
      "id": "US-032",
      "title": "Webhook bancaire entrant",
      "persona": "transverse",
      "priority": "P0",
      "status": "implemented",
      "as_a": "external system",
      "i_want": "notifier paiement reçu via webhook",
      "so_that": "Facil marque automatiquement la déclaration payée",
      "acceptance_criteria": [
        "Endpoint webhook signé HMAC",
        "IP whitelist banque",
        "Idempotency key pour éviter doublons",
        "Retry queue si Facil indisponible temporairement"
      ],
      "linked_workflows": ["04-payment-bange", "10-payment-reconciliation"]
    }
  ],
  "non_functional_requirements": [
    { "id": "NFR-PERF-1", "category": "Performance", "requirement": "API critiques : latence p95 < 300 ms, p99 < 1 s" },
    { "id": "NFR-PERF-2", "category": "Performance", "requirement": "Endpoint chatbot : p95 < 3 s (incluant call Gemini)" },
    { "id": "NFR-PERF-3", "category": "Performance", "requirement": "Endpoint paiement BANGE : p95 < 2 s" },
    { "id": "NFR-PERF-4", "category": "Performance", "requirement": "OCR document : traitement async via queue, retour user < 30 s pour preview" },
    { "id": "NFR-SCALE-1", "category": "Scalabilité", "requirement": "100+ agents publics concurrent (lock ordering implémenté)" },
    { "id": "NFR-SCALE-2", "category": "Scalabilité", "requirement": "100k+ contribuables concurrent en lecture" },
    { "id": "NFR-SCALE-3", "category": "Scalabilité", "requirement": "1M+ contribuables enregistrés à terme" },
    { "id": "NFR-SCALE-4", "category": "Scalabilité", "requirement": "Throughput cible : 10k requests/sec backend (autoscaling Cloud Run)" },
    { "id": "NFR-AVAIL-1", "category": "Disponibilité", "requirement": "SLA cible 99,5% (downtime annuel acceptable ~44h)" },
    { "id": "NFR-AVAIL-2", "category": "Disponibilité", "requirement": "RTO 4h max pour services critiques" },
    { "id": "NFR-AVAIL-3", "category": "Disponibilité", "requirement": "RPO 15 min max de perte de données via backups Supabase" },
    { "id": "NFR-SEC-1", "category": "Sécurité", "requirement": "RBAC granulaire 50+ permissions" },
    { "id": "NFR-SEC-2", "category": "Sécurité", "requirement": "2FA TOTP obligatoire pour admin, supervisor, dgi_agent, ministry_agent" },
    { "id": "NFR-SEC-3", "category": "Sécurité", "requirement": "Bcrypt 12 rounds + TLS 1.3 + AES-256-GCM at-rest" },
    { "id": "NFR-SEC-4", "category": "Sécurité", "requirement": "Audit log append-only + HMAC webhooks + Rate limiting" },
    { "id": "NFR-SEC-5", "category": "Sécurité", "requirement": "AI Security détection injection + Security Observability" },
    { "id": "NFR-I18N-1", "category": "Multilingue", "requirement": "3 langues complètes : ES (primaire), FR, EN" },
    { "id": "NFR-MOB-1", "category": "Mobile", "requirement": "iOS 14+ + Android 8+ via Expo SDK 49+" },
    { "id": "NFR-MOB-2", "category": "Mobile", "requirement": "Push FCM/APNs natifs (pas Expo Push pour 1M users)" },
    { "id": "NFR-OBS-1", "category": "Observabilité", "requirement": "Grafana Cloud Loki + Tempo + Prometheus + 5 alertes" },
    { "id": "NFR-COMP-1", "category": "Conformité", "requirement": "RGPD-compatible (pas de certification formelle V1)" }
  ],
  "risks": [
    { "id": "R-01", "risk": "Adoption citoyenne faible (résistance papier→digital)", "probability": "Élevée", "impact": "Critique", "mitigation": "Mode hybride 12 mois, formation in-app, USSD low-tech" },
    { "id": "R-02", "risk": "Pilote GE retardé pour raisons politiques", "probability": "Moyenne", "impact": "Élevé", "mitigation": "Plans B autres administrations, hedge contractuel" },
    { "id": "R-03", "risk": "Dépendance Vertex AI Gemini", "probability": "Faible", "impact": "Moyen", "mitigation": "Abstraction LLM via Facil V1 Phase B, Ollama on-prem possible" },
    { "id": "R-04", "risk": "Dépendance Supabase (lock-in)", "probability": "Faible", "impact": "Moyen", "mitigation": "PostgreSQL standard, migration possible RDS/Cloud SQL/Neon" },
    { "id": "R-05", "risk": "Concurrence multinationale (SAP, Oracle)", "probability": "Moyenne", "impact": "Élevé", "mitigation": "Différenciation souveraineté + mobile money local" },
    { "id": "R-06", "risk": "Bus factor 1 (dev solo)", "probability": "Élevée", "impact": "Critique", "mitigation": "Documentation extensive, recrutement prioritaire 6 mois" },
    { "id": "R-07", "risk": "Play Store refusé à nouveau (gov)", "probability": "Moyenne", "impact": "Moyen", "mitigation": "PWA web fallback, sponsor institutionnel, AAB direct" },
    { "id": "R-08", "risk": "Cycle vente B2G long (12-24 mois)", "probability": "Élevée", "impact": "Élevé", "mitigation": "Prospection en parallèle pilote, RFPs BAD multiples" },
    { "id": "R-09", "risk": "Dépendance bailleurs financement", "probability": "Moyenne", "impact": "Élevé", "mitigation": "Diversifier : VCs Africa, gov direct, Open Core" },
    { "id": "R-10", "risk": "Compliance RGPD/ENS/ISO 27001 tardive", "probability": "Moyenne", "impact": "Moyen", "mitigation": "Doc compliance roadmap V2 + budget audit prévu" },
    { "id": "R-11", "risk": "Bug critique prod sans ops 24/7", "probability": "Moyenne", "impact": "Élevé", "mitigation": "Observabilité Grafana + alerting + on-call solo + circuit breakers" },
    { "id": "R-12", "risk": "Données fiscales compromises", "probability": "Faible", "impact": "Critique", "mitigation": "Pen-test semestriel, AI Security + Security Observability, audit immuable" },
    { "id": "R-13", "risk": "Évolution réglementaire fiscale GE rapide", "probability": "Moyenne", "impact": "Moyen", "mitigation": "Architecture configurable, BD règles paramétrables" }
  ],
  "roadmap": [
    { "quarter": "Q3 2026", "objective": "Pilote Guinée Équatoriale avec 1-2 directions générales (DGIR + DGT)" },
    { "quarter": "Q4 2026", "objective": "Soft launch citizen-facing + feedback itération" },
    { "quarter": "Q1 2027", "objective": "Stabilisation production + 1er rapport d'impact mesuré" },
    { "quarter": "Q2-Q3 2027", "objective": "Bootstrap Facil Framework V1 (extraction socle réutilisable)" },
    { "quarter": "Q4 2027", "objective": "Premier déploiement régional CEMAC (Cameroun ou Gabon pilote)" },
    { "quarter": "Q1-Q2 2028", "objective": "Facil Framework V1.1 (treasury capabilities)" },
    { "quarter": "H2 2028", "objective": "2-3 déploiements actifs CEMAC / UEMOA, monétisation services managés" }
  ]
}
;
