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
  }
}
;
