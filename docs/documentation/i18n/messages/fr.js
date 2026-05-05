window.__I18N__ = window.__I18N__ || {};
window.__I18N__.fr =
{
  "common": {
    "sidebar": {
      "subtitle": "Référence technique",
      "toggle_label": "Basculer la navigation",
      "footer": "Facil v1.1.8 · Mis à jour mai 2026",
      "section": {
        "getting_started": "Démarrage",
        "architecture": "Architecture",
        "reference": "Référence",
        "features": "Fonctionnalités",
        "observability": "Observabilité",
        "operations": "Opérations"
      },
      "link": {
        "home": "Accueil",
        "architecture": "Architecture système",
        "database": "Schéma de base de données",
        "workflows": "Moteur de workflows",
        "api_reference": "Référence API",
        "modules": "Catalogue des modules",
        "agents": "IA & Intelligence",
        "payments": "Paiements",
        "grafana": "Tableaux de bord Grafana",
        "logrocket": "Observabilité LogRocket",
        "security": "Sécurité",
        "deployment": "Déploiement",
        "i18n": "Internationalisation"
      }
    },
    "breadcrumb": {
      "docs": "Docs"
    },
    "toc": {
      "title": "Sur cette page"
    },
    "footer": {
      "copyright": "Plateforme Facil v1.1.8 · © 2026 Sah Kouemou",
      "link": {
        "api": "API"
      }
    }
  },

  "modules": {
    "html_title": "Catalogue des modules - Documentation Facil",
    "title": "Catalogue des modules",
    "description": "Inventaire complet des 30 modules backend et 41+ modules frontend, organisés par domaine. Chaque module suit une structure interne standard (API/services/repositories pour le backend ; composants/hooks/services/types pour le frontend).",
    "toc": {
      "backend": "Modules backend (30)",
      "frontend": "Modules frontend (41+)",
      "core": "Cœur & Identité",
      "services": "Services & Workflows",
      "financial": "Financier",
      "agents": "Opérations agents",
      "intelligence": "Intelligence",
      "platform": "Plateforme"
    },
    "backend": {
      "intro": "Situés dans <code>packages/backend/app/modules/</code>. Chaque module est un package Python avec des sous-packages pour les routes API, les modèles, les repositories et les services."
    },
    "frontend": {
      "intro": "Situés dans <code>packages/web/src/modules/</code>. Chaque module contient des composants, hooks, services et types."
    },
    "table": {
      "module": "Module",
      "purpose": "Rôle",
      "endpoints": "Endpoints clés",
      "tables": "Tables",
      "domain": "Domaine"
    },
    "row": {
      "auth": { "purpose": "Authentification : connexion, inscription, JWT, 2FA, réinitialisation du mot de passe", "endpoints_count": "9 endpoints" },
      "users": { "purpose": "Gestion du profil utilisateur, téléversement d'avatar" },
      "permissions": { "purpose": "RBAC : rôles, permissions, surcharges utilisateur, synchronisation auto" },
      "companies": { "purpose": "Gestion des entreprises, rôles des membres, classification, annuaire public", "routers_count": "5 routeurs" },
      "funcionario": { "purpose": "Vérification des fonctionnaires", "tables_note": "champs fonctionnaire" },
      "fiscal_services": { "purpose": "Catalogue de 873 services fiscaux, bundles, modèles, règles de configuration, licences, OMS", "routers_count": "7 routeurs" },
      "service_requests": { "purpose": "Cycle de vie des demandes, sessions wizard, rendez-vous, traitement par agents, vues admin", "routers_count": "6 routeurs" },
      "declarations": { "purpose": "Déclarations fiscales (34 types), opérations en lot" },
      "documents": { "purpose": "Téléversement/téléchargement de documents, file de traitement OCR" },
      "user_documents": { "purpose": "Coffre-fort documentaire de l'utilisateur" },
      "batch_requests": { "purpose": "Opérations en masse sur les demandes de service" },
      "verified_identifiers": { "purpose": "Vérification de documents externes" },
      "inspections": { "purpose": "Inspections terrain : missions, analytique, collecte, export", "routers_count": "4 routeurs, 44+ endpoints" },
      "payments": { "purpose": "Traitement des paiements, intégration BANGE, vérification" },
      "treasury": { "purpose": "Tableau de bord trésorerie, suivi des recettes, réconciliation", "endpoints": "Endpoints scopés trésorerie" },
      "accountant": { "purpose": "Outils comptables : suivi des échéances, déclarations en lot" },
      "webhooks": { "purpose": "Webhooks de paiement BANGE, callbacks de systèmes externes" },
      "agents": { "purpose": "Profils agents, outils d'analyse" },
      "assignment": { "purpose": "Affectation des tâches, vues superviseur, statistiques" },
      "admin": { "purpose": "Diagnostics admin, gestion utilisateurs, monitoring, journaux d'audit" },
      "menu_config": { "purpose": "Configuration dynamique du menu agent (basée workflow + basée modules)" },
      "chatbot": { "purpose": "Chatbot RAG avec Gemini 2.5 Flash, 35 outils, 5 rôles d'agents" },
      "enrichment": { "purpose": "Enrichissement IA des descriptions de services (600 caractères, 3 paragraphes)", "tables_note": "descriptions" },
      "communications": { "purpose": "Email, SMS, push, USSD, modèles WhatsApp et envois", "routers_count": "6 routeurs" },
      "translations": { "purpose": "Traductions trilingues, traductions d'entités, gestion des enums, clés frontend", "routers_count": "4 routeurs" },
      "support": { "purpose": "Système de tickets de support" },
      "homepage": { "purpose": "Statistiques et données de la page d'accueil publique", "tables": "vue homepage_stats" },
      "cities": { "purpose": "Gestion des villes/localisations" },
      "entity_locations": { "purpose": "Gestion des sites physiques des entités" },
      "shared": { "purpose": "Utilitaires partagés et classes de base" }
    },
    "fe": {
      "domain": {
        "core": "Cœur",
        "public": "Public",
        "services": "Services",
        "financial": "Financier",
        "business": "Entreprise",
        "intelligence": "Intelligence",
        "agent_ops": "Ops agents",
        "admin": "Admin",
        "platform": "Plateforme"
      },
      "row": {
        "auth": "Formulaires de connexion, inscription, réinitialisation",
        "users": "Affichage et édition du profil utilisateur",
        "dashboard": "Mise en page principale du tableau de bord et widgets",
        "homepage": "Section hero, fonctionnalités, statistiques",
        "fiscal_services": "Catalogue de services, recherche, filtrage",
        "service_requests": "Liste des demandes, détail, parcours wizard",
        "declarations": "Formulaires de déclaration, fiches, opérations en lot",
        "payments": "Fiches de paiement, interface de traitement",
        "documents": "Téléversement, prévisualisation, gestion des documents",
        "user_documents": "Coffre-fort documentaire utilisateur",
        "companies": "Gestion d'entreprise, liste des membres, invitations",
        "accountant": "Calendrier d'échéances, file de tâches",
        "chatbot": "Interface chat, paramètres, suggestions, error boundary",
        "agents": "Composants et outils agents",
        "agent_dashboard": "Vues spécifiques au tableau de bord agent",
        "assignment": "Composants de gestion des affectations",
        "assignments_admin": "Administration des affectations",
        "bundle_workflow": "Interface de paiement groupé multi-entités",
        "inspections": "Gestion des inspections terrain",
        "oms": "Vues du système de gestion d'ordre",
        "treasury": "Tableau de bord agent trésorerie",
        "permissions": "Composants d'affichage des permissions",
        "permissions_admin": "Sélecteur de rôles, badges de permissions",
        "user_permissions_admin": "Surcharges de permissions par utilisateur",
        "roles_admin": "Gestion des rôles, dialogues de permissions",
        "users_admin": "Panneau d'administration des utilisateurs",
        "agents_admin": "Administration des profils agents",
        "audit_logs_admin": "Visualiseur de journaux d'audit avec filtres",
        "admin": "En-tête admin, alerte backend, composants admin centraux",
        "service_requests_admin": "Vues admin pour les demandes de service",
        "batch_requests": "Opérations en masse sur les demandes",
        "support": "Interface de tickets de support",
        "communications": "Gestion des communications",
        "translations": "Interface de gestion des traductions",
        "enrichment": "Gestion de l'enrichissement IA",
        "templates": "Gestion des modèles de documents et procédures",
        "webhooks": "Configuration des webhooks",
        "cities": "Gestion des villes",
        "entity_locations": "Gestion des sites des entités",
        "verified_identifiers": "Gestion des identifiants vérifiés",
        "funcionario": "Vérification des fonctionnaires"
      }
    }
  },

  "deployment": {
    "html_title": "Déploiement & Opérations - Documentation Facil",
    "title": "Déploiement & Opérations",
    "description": "CI/CD automatisé via GitHub Actions. Le backend se déploie sur Google Cloud Run (auto-scaling de conteneurs), le frontend sur Firebase Hosting (CDN). Les applications mobiles sont compilées via Expo et distribuées via les stores.",
    "toc": {
      "cicd": "Pipeline CI/CD",
      "workflows": "Workflows GitHub Actions",
      "cloud_run": "Google Cloud Run",
      "firebase": "Firebase Hosting",
      "environments": "Gestion des environnements",
      "migrations": "Migrations BD",
      "mobile": "Distribution mobile",
      "monitoring": "Monitoring & Alertes"
    },
    "callout": {
      "no_manual": {
        "title": "Règle critique : pas de build manuel",
        "body": "<strong>Ne jamais compiler manuellement avec <code>gcloud</code>.</strong> Tous les déploiements doivent passer par GitHub Actions. Pousse sur la branche distante et laisse le pipeline CI/CD construire et déployer."
      },
      "safety": {
        "title": "Sûreté des migrations",
        "body": "Vérifie toujours l'état de la base avant d'écrire une migration : <code>SELECT code FROM roles</code>, <code>SELECT column_name FROM information_schema.columns</code>, etc. Les codes de rôles et valeurs d'enums évoluent et doivent être validés contre la base réelle."
      }
    },
    "diagram": {
      "title": "Pipeline de déploiement",
      "workflows_count": "8 fichiers workflow",
      "ci_tests": "Tests CI",
      "ci_subtitle": "Lint, type-check, tests unitaires",
      "build_containers": "Build des conteneurs",
      "build_frontend": "Build du frontend",
      "backend_api": "API backend",
      "frontend_cdn": "CDN frontend"
    },
    "workflows": {
      "col_file": "Fichier workflow",
      "col_trigger": "Déclencheur",
      "col_purpose": "Rôle",
      "ci": { "trigger": "Push sur main, develop, feature/**", "purpose": "Linting, vérification de types, tests unitaires" },
      "backend": { "trigger": "Push sur develop (modifications packages/backend/)", "purpose": "Build de l'image Docker, déploiement Cloud Run staging" },
      "frontend": { "trigger": "Push sur develop (modifications packages/web/)", "purpose": "Build Next.js, déploiement Firebase Hosting staging" },
      "codeql": { "trigger": "Programmé + PR", "purpose": "Analyse de sécurité CodeQL" },
      "mobile": { "trigger": "Push (modifications packages/mobile/)", "purpose": "Build de l'app citoyen Expo" },
      "inspector": { "trigger": "Push (modifications packages/inspector/)", "purpose": "Build de l'app inspecteur Expo" },
      "inspector_ci": { "purpose": "Tests CI pour l'app inspecteur" },
      "dashboard": { "trigger": "Manuel / Programmé", "purpose": "Mise à jour du tableau de bord documentaire" }
    },
    "cloudrun": {
      "col_config": "Configuration",
      "col_value": "Valeur",
      "row": {
        "service": "Nom du service",
        "region": "Région",
        "runtime": "Runtime",
        "runtime_value": "Python 3.11 (conteneur)",
        "entry": "Point d'entrée",
        "min": "Instances min",
        "min_value": "0 (scale to zero)",
        "max": "Instances max",
        "max_value": "Auto-scalées",
        "memory": "Mémoire",
        "memory_value": "512 Mo–1 Go par instance",
        "timeout": "Timeout",
        "timeout_value": "300 secondes",
        "concurrency": "Concurrence",
        "concurrency_value": "80 requêtes par instance"
      }
    },
    "firebase": {
      "col_property": "Propriété",
      "col_dev": "Dev",
      "col_prod": "Production",
      "row": {
        "project": "Projet",
        "url": "URL",
        "domain": "Domaine personnalisé",
        "cdn": "CDN",
        "global": "Mondial",
        "ssl": "SSL",
        "automatic": "Automatique",
        "staging": "Canaux staging",
        "staging_value": "Schéma : <code>taxasge-dev--{channel}.web.app</code>"
      }
    },
    "envs": {
      "col_env": "Environnement",
      "col_branch": "Branche",
      "col_backend": "Backend",
      "col_frontend": "Frontend",
      "col_database": "Base de données",
      "row": {
        "dev": "Développement",
        "dev_db": "Local / Supabase dev",
        "staging": "Staging",
        "staging_backend": "Cloud Run staging",
        "staging_frontend": "Firebase dev",
        "staging_db": "Supabase staging",
        "prod": "Production",
        "prod_backend": "Cloud Run prod",
        "prod_frontend": "Firebase prod",
        "prod_db": "Supabase prod"
      },
      "vars_title": "Variables d'environnement",
      "vars_intro": "Variables d'environnement clés configurées dans <code>packages/backend/.env</code> :"
    },
    "migrations": {
      "intro": "Les migrations sont dans <code>packages/backend/migrations/</code> sous forme de fichiers SQL et Python. Elles regroupent les changements de schéma, les seeds de données et les définitions de vues.",
      "col_category": "Catégorie",
      "col_count": "Nombre",
      "col_examples": "Exemples",
      "row": {
        "schema": "Migrations de schéma",
        "schema_count": "~10 numérotées",
        "views": "Définitions de vues",
        "seeds": "Données seed",
        "runners": "Runners Python",
        "hotfixes": "Hotfixes",
        "various": "Variées"
      }
    },
    "mobile": {
      "col_app": "Application",
      "col_id": "Identifiant de package",
      "col_dist": "Distribution",
      "row": {
        "citizen": "Facil (citoyen)",
        "citizen_dist": "Builds Expo.dev, GitHub Releases, Google Play Store",
        "inspector_dist": "Builds Expo.dev, distribution interne"
      }
    },
    "monitoring": {
      "health_title": "Endpoint de health check",
      "endpoints_title": "Endpoints de monitoring",
      "health_desc": "Health check basique (public)",
      "admin_desc": "Santé système détaillée (admin)",
      "logging_title": "Logs",
      "logging_body": "Logging structuré via <strong>Loguru</strong> avec contexte. Cloud Run capture stdout/stderr et l'envoie à Google Cloud Logging pour un monitoring centralisé."
    }
  },

  "security": {
    "html_title": "Architecture de sécurité - Documentation Facil",
    "title": "Architecture de sécurité",
    "description": "Sécurité multi-couches couvrant l'authentification (JWT + 2FA), l'autorisation (RBAC avec 47 rôles et 335 permissions), la protection des données, la conformité OWASP et un journal d'audit complet.",
    "toc": {
      "request_flow": "Flux de sécurité d'une requête",
      "authentication": "Authentification",
      "rbac": "Autorisation RBAC",
      "owasp": "Conformité OWASP",
      "data_protection": "Protection des données",
      "file_security": "Sécurité des fichiers",
      "ai_security": "Sécurité IA",
      "audit": "Journal d'audit",
      "headers": "En-têtes de sécurité"
    },
    "flow": {
      "incoming": "Requête entrante",
      "cors": "Vérification CORS",
      "rate": "Rate limiter",
      "headers": "En-têtes de sécurité",
      "jwt": "Vérification JWT",
      "rbac": "Contrôle de permissions RBAC",
      "handler": "Handler",
      "audit": "Journal d'audit"
    },
    "auth": {
      "col_feature": "Fonctionnalité",
      "col_impl": "Implémentation",
      "col_details": "Détails",
      "row": {
        "password": "Hachage du mot de passe",
        "password_details": "12 rounds, sel par mot de passe",
        "access": "Token d'accès",
        "access_details": "Durée 30 minutes",
        "refresh": "Token de rafraîchissement",
        "refresh_details": "Durée 30 jours, révocable",
        "2fa_details": "OTP basé sur le temps, optionnel par utilisateur",
        "lockout": "Verrouillage à la connexion",
        "lockout_impl": "Délai progressif",
        "lockout_details": "Le compte se verrouille après plusieurs échecs",
        "session": "Gestion des sessions",
        "session_impl": "Backé par la base de données",
        "session_details": "Tables <code>sessions</code> + <code>refresh_tokens</code>",
        "email": "Vérification d'email",
        "email_impl": "Par token",
        "email_details": "Table <code>pending_registrations</code>, expiration 15 min"
      }
    },
    "stats": {
      "roles": "Rôles",
      "permissions": "Permissions",
      "audit": "Entrées d'audit"
    },
    "rbac": {
      "model_title": "Modèle de permissions",
      "diagram_title": "Architecture RBAC",
      "user": "Utilisateur",
      "has_role": "▼ a pour rôle",
      "role": "Rôle",
      "role_subtitle": "47 rôles (spécifiques à l'entité)",
      "grants": "▼ accorde",
      "role_perms": "Permissions du rôle",
      "role_perms_subtitle": "Table de mapping role_permissions",
      "permissions_count": "335 permissions",
      "permissions_subtitle": "Permissions granulaires resource.action",
      "overrides": "Par ailleurs, des <strong>surcharges de permissions par utilisateur</strong> permettent d'accorder ou de révoquer des permissions spécifiques pour un utilisateur sans toucher à son rôle, stockées dans la table <code>user_permissions</code>.",
      "naming_title": "Convention de nommage des permissions",
      "autosync_title": "Synchronisation auto des permissions",
      "autosync_body": "Au démarrage, le système de permissions découvre automatiquement tous les fichiers <code>*_permissions.py</code> à travers les modules, les synchronise en base, les associe aux rôles selon des mappings prédéfinis et nettoie les permissions obsolètes.",
      "realtime_title": "Invalidation temps réel",
      "realtime_body": "Le <code>rbac_listener</code> s'abonne à un canal PostgreSQL NOTIFY. Lorsqu'un rôle ou une permission change en base, le cache est invalidé immédiatement (sans attendre l'expiration TTL)."
    },
    "owasp": {
      "col_top10": "OWASP Top 10",
      "col_mitigation": "Mitigation",
      "row": {
        "a01": "A01 : Contrôle d'accès défaillant",
        "a01_mitigation": "RBAC avec 335 permissions, <code>@permission_required</code> par endpoint",
        "a02": "A02 : Défaillances cryptographiques",
        "a02_mitigation": "bcrypt (12 rounds), TLS partout, aucun secret en clair",
        "a03": "A03 : Injection",
        "a03_mitigation": "Requêtes asyncpg paramétrées ($1, $2), jamais de concaténation",
        "a04": "A04 : Conception non sécurisée",
        "a04_mitigation": "Architecture 3 tiers, validation des entrées (Pydantic v2), défense en profondeur",
        "a05": "A05 : Mauvaise configuration",
        "a05_mitigation": "Middleware d'en-têtes de sécurité, whitelist CORS, configs par environnement",
        "a06": "A06 : Composants vulnérables",
        "a06_mitigation": "GitHub Dependabot, analyse CodeQL",
        "a07": "A07 : Défaillances d'authentification",
        "a07_mitigation": "JWT à TTL court, lockout progressif, 2FA TOTP",
        "a08": "A08 : Intégrité des données",
        "a08_mitigation": "Validation Pydantic sur toutes les entrées, Zod côté frontend, contraintes BD",
        "a09": "A09 : Logs & Monitoring",
        "a09_mitigation": "Logging structuré Loguru, table audit_logs, 2800+ entrées",
        "a10": "A10 : SSRF",
        "a10_mitigation": "Validation d'URL sur les configurations webhooks, aucun fetch d'URL contrôlée par l'utilisateur"
      }
    },
    "data": {
      "sql": "<strong>Prévention des injections SQL :</strong> 100 % de requêtes paramétrées via asyncpg (placeholders <code>$1, $2</code>)",
      "xss": "<strong>Prévention XSS :</strong> DOMPurify côté frontend, en-têtes CSP, pas de dangerouslySetInnerHTML",
      "csrf": "<strong>CSRF :</strong> cookies SameSite, whitelist d'origines CORS",
      "5xx": "<strong>Assainissement des erreurs 5xx :</strong> les détails internes ne sont jamais exposés au client (message générique traduit retourné)",
      "secrets": "<strong>Gestion des secrets :</strong> Google Cloud Secret Manager pour les credentials de production"
    },
    "file": {
      "col_control": "Contrôle",
      "col_details": "Détails",
      "row": {
        "mime": "Validation MIME",
        "mime_details": "Vérifié contre le contenu réel du fichier, pas seulement l'extension",
        "ext": "Liste noire d'extensions",
        "ext_details": "Fichiers exécutables (.exe, .bat, .sh, etc.) bloqués",
        "size": "Limites de taille",
        "size_details": "Limites par fichier et par requête",
        "storage": "Stockage",
        "storage_details": "Supabase Storage avec URLs signées (accès limité dans le temps)",
        "access": "Contrôle d'accès",
        "access_details": "Fichiers scopés au propriétaire (user_id) ou aux agents assignés"
      }
    },
    "ai": {
      "intro": "Le chatbot implémente une détection d'injection de prompt avec 30+ règles pour empêcher l'exploitation adversariale du LLM.",
      "col_protection": "Protection",
      "col_impl": "Implémentation",
      "row": {
        "injection": "Détection d'injection de prompt",
        "injection_impl": "30+ patterns regex pour les techniques d'injection courantes",
        "tools": "Accès aux outils par rôle",
        "tools_impl": "Outils filtrés par rôle utilisateur avant invocation Gemini",
        "boundary": "Application des frontières de données",
        "boundary_impl": "L'agent citoyen ne peut accéder aux données agent internes",
        "output": "Assainissement de sortie",
        "output_impl": "Sortie LLM assainie avant rendu côté frontend",
        "rate": "Rate limiting",
        "rate_impl": "30 messages/minute par utilisateur",
        "consent": "Consentement explicite",
        "consent_impl": "Les opérations privilégiées requièrent une confirmation utilisateur"
      }
    },
    "audit": {
      "intro": "La table <code>audit_logs</code> capture toutes les opérations critiques du système via le handler d'audit de l'EventBus. Les journaux contiennent acteur, action, ressource, horodatage et métadonnées.",
      "ops_title": "Opérations auditées",
      "ops": {
        "login": "Connexion/déconnexion utilisateur, tentatives d'authentification échouées",
        "roles": "Changements de rôles et de permissions",
        "requests": "Création de demandes de service, transitions de statut",
        "payments": "Décisions de traitement des paiements (approbation/rejet)",
        "assignments": "Changements d'affectation d'agents",
        "admin": "Opérations admin de gestion utilisateurs",
        "documents": "Téléversement/téléchargement/suppression de documents",
        "config": "Changements de configuration système"
      }
    },
    "headers": {
      "intro": "Appliqués via un middleware ASGI pur (<code>SecurityHeadersMiddleware</code>) pour éviter les conflits avec CORSMiddleware :"
    },
    "callout": {
      "csp": {
        "title": "En-têtes CSP",
        "body": "Les en-têtes Content Security Policy (CSP) sont définis par le middleware Next.js du frontend (<code>middleware.ts</code>), pas par le backend. Cela évite des en-têtes CSP en double/conflictuels qui forceraient le navigateur à appliquer leur intersection (la plus restrictive)."
      }
    }
  },

  "payments": {
    "html_title": "Systèmes de paiement - Documentation Facil",
    "title": "Systèmes de paiement & finances",
    "breadcrumb": "Systèmes de paiement",
    "description": "Traitement des paiements pour tous les services Facil, incluant les paiements de service mono-entité et les paiements groupés multi-entités pour les licences commerciales. Intégré à la banque BANGE pour le mobile money, les cartes et les virements bancaires.",
    "toc": {
      "architecture": "Architecture des paiements",
      "methods": "Méthodes de paiement",
      "workflow": "Workflow de paiement (17 états)",
      "atomic": "Pipeline de paiement atomique",
      "bundle": "Flux de paiement groupé",
      "lock": "Ordre des verrous (concurrence)",
      "receipts": "Génération de reçus",
      "reporting": "Rapports financiers",
      "bange": "Intégration BANGE"
    },
    "diagram": {
      "title": "Flux de traitement des paiements",
      "wizard": "Session wizard",
      "wizard_sub": "Cache d'abord (Redis)",
      "initiate": "▼ initiate-payment",
      "atomic": "Transaction atomique",
      "atomic_sub": "Persistance + paiement dans une seule transaction BD",
      "bange_proc": "Processeur BANGE",
      "bange_sub": "mobile_money / card / bank_transfer",
      "manual_proc": "Processeur manuel",
      "manual_sub": "espèces / chèque (validation agent)",
      "redirect": "URL de redirection / confirmation",
      "webhook": "▼ Callback webhook",
      "completed": "Paiement complété",
      "completed_sub": "EventBus : auto-affectation aux agents de l'entité"
    },
    "methods": {
      "col_method": "Méthode",
      "col_enum": "Valeur enum",
      "col_processor": "Processeur",
      "col_flow": "Flux",
      "row": {
        "mobile": "Mobile money",
        "mobile_flow": "Redirection vers BANGE, callback webhook",
        "card": "Carte de crédit/débit",
        "card_flow": "Redirection vers la page de paiement BANGE",
        "transfer": "Virement bancaire",
        "transfer_flow": "Redirection vers le portail bancaire",
        "wallet": "Wallet BANGE",
        "wallet_flow": "Débit direct du wallet",
        "cash": "Espèces",
        "manual": "Manuel",
        "cash_flow": "L'agent valide en personne"
      }
    },
    "workflow": {
      "summary": "Les 17 états du workflow de paiement",
      "col_state": "État",
      "col_desc": "Description",
      "row": {
        "submitted": "Paiement créé, en attente de traitement",
        "auto": "Traitement automatique du système (redirection BANGE)",
        "pending": "Paiement manuel en attente de revue par un agent",
        "locked": "L'agent a verrouillé le paiement pour revue",
        "approved": "L'agent a approuvé le paiement",
        "rejected": "L'agent a rejeté le paiement",
        "completed": "Paiement entièrement traité et confirmé",
        "docs": "Documents supplémentaires demandés",
        "escalated": "Escaladé au superviseur",
        "cancelled": "Paiement annulé",
        "refund_req": "Remboursement initié",
        "refund_app": "Remboursement approuvé par le superviseur",
        "refund_done": "Remboursement traité",
        "hold": "Paiement temporairement suspendu",
        "expired": "Fenêtre de paiement expirée",
        "partial": "Montant partiel reçu",
        "bank": "En attente du callback BANGE"
      }
    },
    "atomic": {
      "intro": "L'endpoint <code>POST /wizard-sessions/{id}/initiate-payment</code> exécute toutes les opérations dans une seule transaction BD. Si une étape échoue, tout est rollback.",
      "step1": "1. Lire la session Redis",
      "step2": "2. Valider les données",
      "step3": "3. BEGIN TX",
      "step4": "4. INSERT service_request",
      "step5": "5. Téléverser les documents vers Firebase",
      "step6": "6. INSERT service_payment",
      "step7": "7. Confirmer le rendez-vous",
      "step8": "8. COMMIT",
      "callout_title": "Aucun enregistrement orphelin",
      "callout_body": "Le pipeline atomique garantit qu'une demande de service n'est jamais créée sans son paiement associé, et inversement. L'échec d'un téléversement de document déclenche un rollback complet."
    },
    "bundle": {
      "intro": "Les paiements groupés gèrent les obligations de licences commerciales couvrant plusieurs entités gouvernementales. Une seule licence commerciale peut générer des obligations envers TESORO, AYUNTAMIENTO, CAMARA_COMERCIO et divers ministères MIN_*.",
      "step1": "Licence commerciale",
      "step2": "Classification",
      "step3": "Résolution de zone",
      "step4": "Génération d'obligations",
      "step5": "Validation multi-entités",
      "step6": "Paiement",
      "step7": "Reçu",
      "multi_title": "Validation multi-entités",
      "multi_body": "Chaque entité valide indépendamment sa portion du bundle. L'entité TESORO valide la conformité financière globale, AYUNTAMIENTO valide les exigences municipales et CAMARA_COMERCIO vérifie le statut d'enregistrement commercial."
    },
    "lock": {
      "callout_title": "Prévention des deadlocks",
      "callout_body": "Pour toute transaction touchant aux licences commerciales ET aux paiements terrain, l'ordre de verrouillage canonique suivant DOIT être respecté. Violer cet ordre cause des deadlocks avec 100+ agents concurrents.",
      "step1": "<strong><code>commercial_licenses</code></strong> &mdash; <code>SELECT ... FOR UPDATE</code> (le seul verrou explicite &mdash; entité racine)",
      "step2": "<strong><code>service_requests</code></strong> &mdash; <code>INSERT</code> uniquement (optimiste via index UNIQUE partiel, pas de <code>FOR UPDATE</code>)",
      "step3": "<strong><code>license_obligations</code></strong> &mdash; <code>UPDATE</code> par lot (verrous acquis automatiquement)",
      "step4": "<strong><code>service_payments</code></strong> &mdash; <code>INSERT</code> final",
      "warn_title": "Jamais de FOR UPDATE sur service_requests",
      "warn_body": "La concurrence sur <code>service_requests</code> est gérée par l'index unique partiel <code>idx_sr_commercial_license_unique</code> + récupération <code>try/except asyncpg.UniqueViolationError</code> (SELECT déterministe par <code>commercial_license_id</code>)."
    },
    "receipts": {
      "intro": "Les reçus PDF sont générés via <code>SummaryPDFService</code> avec le template <code>citizen_summary_pdf.html</code> (490 lignes). Les reçus contiennent :",
      "item1": "Nom et ville de l'entité dans l'en-tête",
      "item2": "Détails du service fiscal par obligation",
      "item3": "Montants calculés avec ventilation",
      "item4": "Référence et horodatage du paiement",
      "item5": "QR code de vérification du reçu"
    },
    "reporting": {
      "col_report": "Rapport",
      "col_scope": "Périmètre",
      "col_desc": "Description",
      "scope": { "entity": "Entité", "system": "Système", "agent": "Agent", "bank": "Banque", "ministry": "Ministère" },
      "row": {
        "revenue": "Recettes par entité",
        "revenue_desc": "Recettes totales par entité gouvernementale et par période",
        "bank": "Réconciliation bancaire",
        "bank_desc": "Rapprochement entre transactions bancaires et enregistrements de paiement",
        "audit": "Audit de validation des paiements",
        "audit_desc": "Piste d'audit de toutes les décisions de validation de paiement",
        "collection": "Analytique de collecte",
        "collection_desc": "Performance de collecte par configuration bancaire",
        "ministry": "Synthèse ministérielle",
        "ministry_desc": "Synthèse financière par ministère/entité"
      }
    },
    "bange": {
      "intro": "BANGE est le processeur de paiement principal pour la Guinée équatoriale. L'intégration utilise des callbacks webhook pour confirmer le statut des paiements.",
      "col_feature": "Fonctionnalité",
      "col_details": "Détails",
      "row": {
        "webhook": "Endpoint webhook",
        "callback": "Vérification de callback",
        "callback_val": "Validation de signature HMAC",
        "currencies": "Devises supportées",
        "logging": "Logging des transactions",
        "logging_val": "Table <code>bank_transactions</code>",
        "config": "Configuration",
        "config_val": "Table <code>bank_configurations</code> (clés API, URLs webhook)"
      }
    }
  },

  "i18npage": {
    "html_title": "Internationalisation - Documentation Facil",
    "title": "Guide d'internationalisation",
    "description": "Facil est entièrement trilingue : espagnol (langue principale), français et anglais. Le système i18n couvre le frontend (11 400+ clés par locale), le backend (traductions d'entités + messages d'erreur), les apps mobiles et les modèles de communication.",
    "toc": {
      "overview": "Aperçu du support des langues",
      "frontend": "i18n frontend (next-intl)",
      "backend": "i18n backend",
      "db": "Traductions BD",
      "mobile": "i18n mobile",
      "communications": "Modèles de communication",
      "adding": "Ajouter de nouvelles clés"
    },
    "stats": {
      "languages": "Langues",
      "keys": "Clés par locale",
      "savings": "Économie de stockage (entity_translations)"
    },
    "langs": {
      "col_lang": "Langue",
      "col_code": "Code",
      "col_status": "Statut",
      "col_notes": "Notes",
      "row": {
        "es": "Espagnol",
        "es_status": "Principale",
        "es_notes": "Langue officielle de la Guinée équatoriale. Tout le contenu BD est stocké en espagnol.",
        "fr": "Français",
        "fr_notes": "Langue officielle de la Guinée équatoriale. UI + traductions d'entités complètes.",
        "en": "Anglais",
        "en_notes": "Support international. UI + traductions d'entités complètes.",
        "complete": "Complet"
      }
    },
    "fe": {
      "arch_title": "Architecture",
      "arch_body": "Le frontend utilise <code>next-intl</code> avec le segment <code>[locale]</code> de l'App Router Next.js. Toutes les pages sont imbriquées sous <code>/[locale]/</code> qui détecte et applique la langue automatiquement.",
      "usage_title": "Utilisation dans les composants",
      "keys_title": "Structure des clés de traduction",
      "keys_body": "Les clés sont organisées hiérarchiquement par module/page :"
    },
    "be": {
      "middleware_title": "Middleware de détection de langue",
      "middleware_body": "Le <code>language_middleware</code> détecte la langue de l'utilisateur via l'en-tête <code>Accept-Language</code> et la stocke dans <code>request.state.language</code> pour usage tout au long du cycle de vie de la requête.",
      "errors_title": "Traduction des messages d'erreur",
      "errors_body": "Les messages d'erreur sont auto-traduits selon la langue détectée. La classe <code>TranslatedException</code> porte un <code>error_code</code> qui se mappe à des messages trilingues. Le pattern matching gère les exceptions HTTP legacy."
    },
    "db": {
      "tables_title": "Deux tables de traduction",
      "col_table": "Table",
      "col_purpose": "Rôle",
      "col_storage": "Modèle de stockage",
      "row": {
        "translations_purpose": "Traductions unifiées pour les ENUMs, libellés UI, champs de formulaires, messages système",
        "translations_storage": "Clé-valeur avec colonne locale",
        "entity_purpose": "Traductions spécifiques aux entités (noms de ministères, noms de services, etc.)",
        "entity_storage": "Structure optimisée (réduction de stockage de 40 % vs colonnes inline)"
      },
      "convention_title": "Convention de contenu BD",
      "convention_callout_title": "Espagnol en BD, traduit à l'exécution",
      "convention_callout_body": "Tout le contenu BD (noms de ministères, noms de services, catégories) est stocké en espagnol (la langue principale). Les traductions française et anglaise sont stockées dans la table <code>entity_translations</code> et résolues au moment de la requête.",
      "pattern_title": "Pattern de traduction d'entité",
      "cache_title": "Cache des traductions",
      "cache_body": "Les traductions sont cachées pendant 1 heure via <code>get_translations_cache()</code> pour minimiser les requêtes BD. L'invalidation du cache est déclenchée lorsqu'une traduction est mise à jour via l'API admin."
    },
    "mobile": {
      "body": "Les deux applications mobiles (Facil citoyen et Facil Inspector) supportent les 3 mêmes langues. Les traductions sont stockées sous forme de fichiers JSON empaquetés avec l'app et chargés au runtime selon la préférence de l'utilisateur."
    },
    "comm": {
      "body": "Les modèles email, SMS, notifications push et notifications in-app sont stockés dans leurs tables respectives (<code>email_templates</code>, <code>sms_templates</code>, <code>push_templates</code>, <code>notification_templates</code>) avec du contenu pour les 3 langues.",
      "col_type": "Type de modèle",
      "col_table": "Table",
      "col_render": "Rendu",
      "row": {
        "email": "Email",
        "email_render": "Jinja2 avec sujet + corps trilingues",
        "sms_render": "Texte brut, segments de 160 caractères",
        "push": "Notification push",
        "push_render": "Titre + corps par locale",
        "inapp": "In-app",
        "inapp_render": "Notification structurée par locale"
      }
    },
    "add": {
      "intro": "Pour ajouter une nouvelle clé de traduction :",
      "step1": "Ajoute la clé aux <strong>3 fichiers JSON</strong> (<code>es.json</code>, <code>fr.json</code>, <code>en.json</code>)",
      "step2": "Suis la structure hiérarchique existante : <code>module.section.key</code>",
      "step3": "Fournis de vraies traductions (pas de placeholders machine-traduits)",
      "step4": "Utilise la clé dans ton composant avec <code>useTranslations('module')</code>",
      "step5": "Pour les chaînes paramétrées, utilise le format ICU : <code>\"count\": \"{count} servicios\"</code>",
      "endpoints_title": "Endpoints API de traduction",
      "ep1": "Lister les traductions par catégorie/locale",
      "ep2": "Créer une nouvelle entrée de traduction",
      "ep3": "Mettre à jour une traduction",
      "ep4": "Récupérer les traductions d'entité",
      "ep5": "Récupération en masse pour hydratation frontend",
      "ep6": "Récupérer les valeurs d'enum avec leurs traductions"
    }
  },

  "agents": {
    "html_title": "IA & Intelligence - Documentation Facil",
    "description": "Facil intègre l'IA sur quatre domaines : un chatbot RAG avec 35 outils, une intelligence documentaire OCR avec 40 schémas, l'affectation intelligente des agents et l'enrichissement de contenu. Le tout propulsé par Google Vertex AI (Gemini 2.5 Flash) et les embeddings pgvector.",
    "toc": {
      "rag": "Architecture du chatbot RAG",
      "hybrid": "Pipeline de recherche hybride",
      "tools": "35 outils spécialisés",
      "roles": "5 agents par rôle",
      "reflection": "Boucle d'auto-réflexion",
      "ocr": "Intelligence documentaire OCR",
      "assignment": "Moteur d'affectation intelligente",
      "enrichment": "Enrichissement de contenu",
      "security": "Sécurité IA (OWASP)"
    },
    "rag": {
      "diagram_title": "Pipeline RAG",
      "user_msg": "Message utilisateur",
      "preprocessor": "Pré-processeur de requête",
      "preprocessor_sub": "query_preprocessor.py : détection de langue, classification d'intention, expansion de requête",
      "embedding": "Embedding",
      "hybrid": "Recherche hybride",
      "hybrid_sub": "70 % cosinus pgvector + 30 % recherche plein-texte tsvector",
      "context": "Assemblage du contexte",
      "context_sub": "chatbot_service_rag.py : docs + contexte utilisateur + sélection d'outils",
      "gemini_sub": "gemini_service.py : prompt structuré + 35 outils",
      "reflection": "Auto-réflexion",
      "reflection_sub": "Score < 5/10 déclenche une régénération",
      "response": "Réponse",
      "response_sub": "15 formats de sortie + services associés",
      "services_title": "Services backend",
      "col_file": "Fichier",
      "col_resp": "Responsabilité",
      "row": {
        "main": "Orchestrateur principal : recherche, assemblage de contexte, construction de prompt, formatage de réponse",
        "gemini": "Client API Gemini : initialisation du modèle, exécution d'outils, streaming",
        "embedding": "Embedding texte via Vertex AI text-embedding-004 (768 dimensions)",
        "preprocessor": "Analyse de requête : détection de langue, classification d'intention, expansion",
        "tools_pub": "19 définitions d'outils publics pour utilisateurs non authentifiés",
        "tools_auth": "16 outils authentifiés (8 auth-required + 8 deep reasoning)",
        "consent": "Gestion du consentement explicite pour les opérations privilégiées"
      }
    },
    "hybrid": {
      "intro": "La recherche combine les approches sémantique (vectorielle) et lexicale (plein-texte) avec des poids configurables :",
      "col_component": "Composant",
      "col_weight": "Poids",
      "col_tech": "Technologie",
      "col_index": "Index",
      "row": {
        "semantic": "Recherche sémantique",
        "semantic_tech": "Similarité cosinus pgvector (opérateur <code>&lt;=&gt;</code>)",
        "semantic_index": "Index IVFFlat sur la colonne embedding",
        "fulltext": "Recherche plein-texte",
        "fulltext_tech": "tsvector/tsquery PostgreSQL (<code>ts_rank</code>)",
        "fulltext_index": "Index GIN sur la colonne tsvector"
      }
    },
    "tools": {
      "public_summary": "19 outils publics (non authentifiés)",
      "public_intro": "Disponibles pour tous les utilisateurs (visiteurs anonymes inclus) :",
      "public": {
        "search": "<strong>search_services</strong> &mdash; Recherche dans le catalogue des services fiscaux",
        "details": "<strong>get_service_details</strong> &mdash; Détails complets d'un service",
        "ministry": "<strong>get_ministry_services</strong> &mdash; Services par ministère",
        "requirements": "<strong>get_service_requirements</strong> &mdash; Documents requis pour un service",
        "procedure": "<strong>get_service_procedure</strong> &mdash; Procédure étape par étape",
        "fee": "<strong>calculate_fee</strong> &mdash; Calculatrice de frais",
        "offices": "<strong>get_office_locations</strong> &mdash; Sites des entités",
        "faq": "<strong>get_faq</strong> &mdash; Questions fréquentes",
        "more": "Plus 11 outils supplémentaires de récupération d'informations"
      },
      "auth_summary": "8 outils authentifiés",
      "auth_intro": "Disponibles uniquement pour les utilisateurs connectés (données personnelles scopées) :",
      "auth": {
        "requests": "<strong>get_my_requests</strong> &mdash; Demandes de service de l'utilisateur",
        "status": "<strong>get_request_status</strong> &mdash; Statut d'une demande spécifique",
        "payments": "<strong>get_my_payments</strong> &mdash; Historique de paiements de l'utilisateur",
        "declarations": "<strong>get_my_declarations</strong> &mdash; Déclarations fiscales de l'utilisateur",
        "appointments": "<strong>get_my_appointments</strong> &mdash; Rendez-vous de l'utilisateur",
        "documents": "<strong>get_my_documents</strong> &mdash; Documents téléversés par l'utilisateur",
        "company": "<strong>get_my_company</strong> &mdash; Informations sur l'entreprise",
        "support": "<strong>create_support_ticket</strong> &mdash; Créer un ticket de support"
      },
      "deep_summary": "8 outils de raisonnement avancé (agents privilégiés)",
      "deep_intro": "Disponibles pour les agents Trésorerie, Superviseur et Admin avec accès scopé à l'entité :",
      "deep": {
        "revenue": "<strong>analyze_revenue</strong> &mdash; Analyse des recettes par entité/période",
        "team": "<strong>get_team_metrics</strong> &mdash; Indicateurs de performance d'équipe",
        "sla": "<strong>get_sla_compliance</strong> &mdash; Rapports de conformité SLA",
        "workload": "<strong>get_workload_distribution</strong> &mdash; Analyse de charge des agents",
        "escalation": "<strong>get_escalation_history</strong> &mdash; Historique d'escalades",
        "times": "<strong>analyze_processing_times</strong> &mdash; Statistiques de temps de traitement",
        "perf": "<strong>get_agent_performance</strong> &mdash; Performance individuelle d'un agent",
        "audit": "<strong>get_audit_trail</strong> &mdash; Requêtes sur le journal d'audit"
      }
    },
    "roles": {
      "col_agent": "Agent",
      "col_users": "Utilisateurs",
      "col_tools": "Outils",
      "col_data": "Accès aux données",
      "col_capability": "Capacité clé",
      "row": {
        "citizen": { "name": "<strong>Agent citoyen</strong>", "users": "Visiteurs anonymes", "tools": "19 publics", "data": "Catalogue public uniquement", "cap": "Information sur les services, calcul de frais" },
        "auth": { "name": "<strong>Agent authentifié</strong>", "users": "Citoyens/entreprises connectés", "tools": "19 + 8 auth", "data": "Données personnelles uniquement", "cap": "Suivi de demandes, historique de paiements" },
        "treasury": { "name": "<strong>Agent trésorerie</strong>", "users": "Personnel trésorerie", "tools": "19 + 8 + 8 deep", "data": "Financier scopé entité", "cap": "Analyse des recettes, réconciliation" },
        "supervisor": { "name": "<strong>Agent superviseur</strong>", "users": "Superviseurs d'équipe", "tools": "19 + 8 + 8 deep", "data": "Indicateurs scopés équipe", "cap": "Gestion de charge, suivi SLA" },
        "admin": { "name": "<strong>Agent admin</strong>", "users": "Administrateurs système", "tools": "Les 35", "data": "Total (avec piste d'audit)", "cap": "Diagnostics système, accès complet" }
      },
      "callout_title": "Frontières de confidentialité",
      "callout_body": "Chaque rôle d'agent a des frontières strictes d'accès aux données appliquées au niveau des outils. Un agent citoyen <strong>ne peut pas</strong> accéder aux données internes, même si le prompt tente de le tromper. Les agents trésorerie ne voient que les données de leur entité assignée."
    },
    "reflection": {
      "intro": "Après avoir généré une réponse, le chatbot évalue lui-même la qualité de sa réponse sur une échelle de 1 à 10. Si le score est inférieur à 5, il régénère avec un contexte ajusté. Cela garantit une qualité de réponse constante et élevée.",
      "step1": "Générer la réponse",
      "step2": "Auto-score (1-10)",
      "step3": "Score ≥ 5 ?",
      "return": "Renvoyer",
      "low": "Score < 5",
      "regen": "Régénérer",
      "retry": "Renvoyer (max 1 retry)",
      "formats_title": "15 formats de réponse",
      "formats_body": "Le chatbot produit des réponses dans des formats structurés adaptés au type de requête, incluant fiches de service, listes de procédures, ventilation des frais, mises à jour de statut, listes de documents, infos de rendez-vous et blocs d'information générale."
    },
    "ocr": {
      "schemas_title": "40 schémas de documents",
      "schemas_body": "Chaque type de document a un schéma JSON définissant les champs d'extraction, les coordonnées des bounding boxes et les règles de validation. Les schémas sont stockés dans <code>packages/backend/app/modules/service_requests/schemas/</code>.",
      "pipeline_title": "Pipeline d'extraction",
      "step1": "Téléverser le document",
      "step2": "Validation MIME",
      "step3": "Correspondance de template",
      "step4": "Extraction OCR",
      "step5": "Validation de schéma",
      "step6": "Données structurées",
      "engines_title": "Moteurs de validation",
      "col_engine": "Moteur",
      "col_rules": "Règles",
      "col_purpose": "Rôle",
      "row": {
        "schema": "<strong>SchemaValidationEngine</strong>",
        "schema_rules": "70+ règles JSON",
        "schema_purpose": "Validité documentaire : format, signatures, champs requis, validité temporelle",
        "risk": "<strong>RiskAnalyzer</strong>",
        "risk_rules": "Pipeline en 12 étapes",
        "risk_purpose": "Détection de fraude : incohérences, indicateurs de falsification, vérifications croisées",
        "mrz": "<strong>Validateur MRZ</strong>",
        "mrz_rules": "Norme ICAO 9303",
        "mrz_purpose": "Validation de la zone lisible par machine pour passeports et CNI",
        "hash": "<strong>Registre de hash de documents</strong>",
        "hash_rules": "Basé PostgreSQL",
        "hash_purpose": "Détection de doublons et empreinte documentaire",
        "lev": "<strong>Matcher Levenshtein</strong>",
        "lev_rules": "Correspondance floue",
        "lev_purpose": "Correspondance de noms entre documents avec seuil configurable"
      },
      "callout_title": "Règle d'accès aux données OCR",
      "callout_body": "Les champs extraits par OCR doivent utiliser <code>context.get_extracted_field(doc, path)</code>. Les champs saisis dans le formulaire utilisent <code>form_data.get()</code>. Ne jamais mélanger ces deux modes d'accès."
    },
    "assignment": {
      "intro": "Le moteur d'affectation distribue automatiquement les éléments de travail aux agents selon plusieurs facteurs. Il utilise la table <code>agent_work_queue</code> avec un score de priorité dynamique.",
      "factors_title": "Facteurs d'affectation",
      "col_factor": "Facteur",
      "col_weight": "Poids",
      "col_desc": "Description",
      "weight": { "high": "Élevé", "medium": "Moyen", "low": "Faible", "critical": "Critique" },
      "row": {
        "capacity": "Capacité",
        "capacity_desc": "Charge actuelle vs capacité max par agent",
        "spec": "Spécialisation",
        "spec_desc": "Correspondance d'expertise agent vs type de workflow",
        "sla": "Priorité SLA",
        "sla_desc": "Temps restant avant échéance SLA",
        "amount": "Montant",
        "amount_desc": "Montant du paiement (les montants élevés peuvent être routés aux agents seniors)",
        "complex": "Complexité",
        "complex_desc": "Score de complexité du workflow",
        "avail": "Disponibilité",
        "avail_desc": "L'agent doit être disponible (ni en congé, ni malade, ni en formation, etc.)"
      },
      "states_title": "États de disponibilité des agents"
    },
    "security": {
      "body": "Le chatbot implémente les mitigations OWASP LLM Top 10 incluant la détection d'injection de prompt avec 30+ patterns. Voir <a href=\"security.html#ai-security\">Architecture de sécurité</a> pour les détails."
    },
    "enrichment": {
      "body": "Le module d'enrichissement utilise Gemini pour générer automatiquement des descriptions riches pour les services fiscaux. Chaque description fait 600 caractères, structurée en 3 paragraphes, avec un score d'auto-évaluation et des exemples few-shot pour une qualité constante."
    }
  },

  "database": {
    "html_title": "Schéma de base de données - Documentation Facil",
    "title": "Référence du schéma de base de données",
    "description": "Base de données PostgreSQL hébergée sur Supabase avec 145 tables organisées en 10 domaines, 50 enums personnalisés et l'extension pgvector pour les embeddings IA. Tous les accès via asyncpg avec des requêtes paramétrées.",
    "toc": {
      "overview": "Aperçu du schéma",
      "core": "Métier central (14 tables)",
      "declarations": "Déclarations & Workflow (12 tables)",
      "agents": "Agents & Charge de travail (7 tables)",
      "payments": "Paiements (10 tables)",
      "documents": "Documents & OCR (5 tables)",
      "auth": "Authentification & RBAC (9 tables)",
      "communications": "Communications (9 tables)",
      "support": "Support (4 tables)",
      "translations": "Traductions (3 tables)",
      "inspections": "Inspections & Bundle (15+ tables)",
      "enums": "Enums clés",
      "conventions": "Conventions de nommage",
      "migrations": "Système de migrations"
    },
    "stats": { "tables": "Tables", "enums": "Enums personnalisés", "domains": "Domaines", "permissions": "Permissions" },
    "callout": {
      "sot": { "title": "Source de vérité", "body": "Toujours interroger la base de données directement pour le schéma actuel. Utiliser <code>information_schema.columns</code> et <code>pg_type</code> plutôt que de se fier à la documentation seule, le schéma évoluant fréquemment." },
      "safety": { "title": "Règle de sûreté des migrations", "body": "Toujours vérifier l'état de la base avant d'écrire une migration. Utiliser <code>SELECT code FROM roles</code> avant d'insérer dans <code>role_permissions</code>. Des codes de rôles comme <code>dgi_agent</code> ou <code>ministry_agent</code> peuvent ne plus exister &mdash; les codes réels sont spécifiques à l'entité (par ex. <code>agent_cnedoge_pasaporte</code>, <code>agent_dgt</code>, <code>agent_extranjeria</code>)." }
    },
    "col": { "table": "Table", "description": "Description", "keys": "Colonnes clés", "volume": "Volume" },
    "row": {
      "users": "Comptes utilisateurs avec rôles",
      "fiscal_services": "Catalogue de 873 services fiscaux",
      "tax_decl": "Déclarations fiscales (20 types)",
      "companies": "Gestion des entreprises",
      "ucr": "Rôles d'utilisateurs au sein des entreprises",
      "ministries": "Ministères gouvernementaux",
      "sectors": "Secteurs ministériels",
      "categories": "Catégories de services",
      "keywords": "Mots-clés de recherche pour les services",
      "sda": "Documents requis par service",
      "spa": "Procédures par service",
      "proc_tmpl": "Modèles de procédures",
      "proc_steps": "Étapes au sein des procédures",
      "doc_tmpl": "Modèles de documents avec validité",
      "iva": "Déclarations IVA",
      "iva_vol": "~90 % des déclarations",
      "irpf": "Données IRPF / impôt sur le revenu",
      "petrol": "Déclarations du secteur pétrolier",
      "petrol_vol": "~4 % (gros montants)",
      "retencion": "Retenues à la source",
      "other": "JSONB générique pour 7 autres types",
      "adj": "Piste d'audit des ajustements de montants",
      "corr": "Historique des corrections / amendements",
      "transitions": "Transitions d'états du workflow",
      "assignments": "Affectations de tâches aux agents",
      "assignment_rules": "Règles d'auto-affectation",
      "adj_reasons": "Catalogue des motifs d'ajustement prédéfinis",
      "calc_hist": "Historique des calculs fiscaux",
      "min_agents": "Agents ministériels avec statut workflow complet",
      "workloads": "Suivi de la charge de travail des agents en temps réel",
      "queue": "File de priorité dynamique (scoring SLA, montant, complexité)",
      "perf_stats": "Indicateurs de performance mensuels",
      "uma": "Mappings utilisateur-ministère",
      "val_config": "Paramètres de validation par ministère",
      "sys_rules": "Règles métier dynamiques (sans redéploiement)",
      "payments": "Table polymorphe centrale des paiements",
      "svc_pay": "Paiements avec workflow agent (verrouillage pessimiste)",
      "pay_plans": "Plans de paiement échelonnés",
      "installments": "Échéances individuelles",
      "receipts": "Reçus PDF générés",
      "lock_hist": "Audit des verrous de paiements",
      "val_audit": "Piste d'audit des validations",
      "bank_cfg": "Configurations API/webhook bancaires",
      "bank_tx": "Transactions webhook bancaires",
      "fsd": "Données de paiement des services fiscaux",
      "uploaded": "Métadonnées de fichiers (Supabase Storage)",
      "doc_queue": "File OCR asynchrone avec retry/fallback",
      "ocr_results": "Extraction OCR brute (JSONB)",
      "form_tmpl": "Coordonnées de champs OCR (14 types de formulaire)",
      "import": "Suivi d'imports en masse Excel",
      "sessions": "Sessions JWT",
      "refresh": "Tokens de rafraîchissement avec révocation",
      "pending": "Vérification d'email (expiration 15 min)",
      "roles": "47 rôles personnalisés (avec menu_config, dashboard_config JSONB)",
      "permissions": "335 entrées de permissions",
      "role_perms": "Mappings rôle-permission",
      "user_perms": "Surcharges de permissions par utilisateur",
      "perm_log": "Historique des changements de permissions",
      "audit_logs": "Journal d'audit système (2800+ entrées)",
      "cps": "Configurations des fournisseurs (SMS, Email, Push, WhatsApp)",
      "email_tmpl": "Modèles email multilingues",
      "sms_tmpl": "Modèles SMS (segments de 160 caractères)",
      "push_tmpl": "Modèles push mobile/web",
      "notif_tmpl": "Modèles de notifications in-app",
      "ussd": "Configurations menus USSD (Getesa, Muni)",
      "webhook_cfg": "Webhooks WhatsApp Business API",
      "webhook_logs": "Audit d'exécution des webhooks",
      "tickets": "Tickets de support utilisateur/agent",
      "sup_msg": "Messages de ticket",
      "sup_att": "Pièces jointes des messages",
      "sup_cat": "Catégories multilingues de tickets",
      "translations": "Traductions unifiées (ENUMs, UI, formulaires, messages système)",
      "ent_tr": "Traductions d'entités optimisées (réduction de stockage 40 %)",
      "favs": "Services favoris des utilisateurs",
      "cl": "Entité racine du workflow bundle (SELECT FOR UPDATE)",
      "sr": "Suivi des demandes de service (index unique partiel)",
      "lo": "Obligations par entité pour une licence",
      "entities": "Entités gouvernementales avec workflow_codes JSONB",
      "ent_loc": "Sites physiques par entité",
      "pw": "Définitions de workflows synchronisées depuis les classes Python",
      "wt": "Grilles tarifaires par workflow",
      "wd": "Documents requis par workflow",
      "wmm": "Mapping workflow vers structure de menu",
      "ap": "Profils d'agents avec menu_overrides",
      "fi": "Enregistrements d'inspections terrain",
      "ah": "Réservations temporaires 15 min",
      "ar": "Réservations confirmées permanentes",
      "asc": "Configuration de capacité des créneaux",
      "ws": "Données de session wizard cache-first"
    },
    "inspections": { "intro": "Tables de workflow bundle et d'inspections terrain couvrant licences commerciales, obligations, demandes de service et opérations terrain." },
    "enums": {
      "and_more": "et plus",
      "user_role": { "summary": "user_role_enum (7 valeurs)" },
      "decl_type": { "summary": "declaration_type_enum (34 types)" },
      "pay_status": {
        "summary": "payment_workflow_status (17 états)",
        "extra": "États supplémentaires : <code>pending_documents</code>, <code>escalated</code>, <code>cancelled</code>, <code>refund_requested</code>, <code>refund_approved</code>, <code>refund_completed</code>, <code>on_hold</code>, <code>expired</code>, <code>partial_payment</code>, <code>awaiting_bank_confirmation</code>, <code>manual_review</code>"
      },
      "pay_method": { "summary": "payment_method_enum (5 valeurs)" },
      "agent_action": { "summary": "agent_action_type (7 valeurs)" },
      "svc_type": { "summary": "service_type_enum (8 valeurs)" },
      "calc_method": { "summary": "calculation_method_enum (7 valeurs)" }
    },
    "conv": {
      "col_element": "Élément",
      "col_convention": "Convention",
      "col_example": "Exemple",
      "tables": "Tables",
      "tables_conv": "<code>snake_case</code> au pluriel",
      "columns": "Colonnes",
      "fk": "Clés étrangères",
      "timestamps": "Horodatages",
      "timestamps_ex": "Présents sur toutes les tables",
      "soft": "Suppressions logiques",
      "soft_ex": "Horodatage nullable",
      "enums": "Enums",
      "indexes": "Index"
    },
    "migrations": {
      "intro": "Les migrations BD sont stockées dans <code>packages/backend/migrations/</code> sous forme de fichiers SQL et de scripts Python. Les migrations sont numérotées séquentiellement et appliquées via un runner personnalisé.",
      "verif_title": "Pattern de vérification"
    }
  }
}
;
