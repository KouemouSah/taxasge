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
        "ai_obs": "Observabilité IA",
        "security_obs": "Observabilité Sécurité",
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
      "security": "Sécurité des reçus & vérification QR",
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
    "security": {
      "title": "Sécurité des reçus & vérification QR",
      "intro": "Chaque reçu, licence, certificat et PDF de demande de service généré par Facil est <strong>signé cryptographiquement</strong> et <strong>vérifiable publiquement via QR code</strong>. Le QR encode un lien profond vers un endpoint de vérification public ; le lien porte un jeton <strong>HMAC-SHA256</strong> impossible à forger sans le secret côté serveur. Modifier le numéro de reçu, le montant ou la date casse la signature &mdash; l'endpoint de vérification rejette alors le document.",
      "diagram_title": "Architecture &mdash; Flux Signer & Vérifier",
      "diagram_caption": "Génération (serveur) → QR (PDF) → Vérification publique (n'importe quel appareil)",
      "box": {
        "gen": "1. Reçu PDF généré", "gen_sub": "paiement validé → PDF rendu via WeasyPrint",
        "sign": "2. Signature HMAC-SHA256", "sign_sub": "message : numero_recu | montant | AAAAMMJJ<br>secret : RECEIPT_VERIFICATION_SECRET<br>sortie : empreinte hex 16 caractères",
        "qr": "3. QR encodé", "qr_sub": "URL : https://app/verify/{ref}?t={token}<br>intégré comme PNG base64 dans le PDF",
        "store": "4. Stocké au coffre-fort", "store_sub": "URL signée Firebase Storage + ligne d'audit + entrée coffre utilisateur",
        "scan": "5. Scan du QR par n'importe qui", "scan_sub": "le navigateur ouvre<br>GET /api/v1/verify/{ref}?t=...<br>(sans authentification)",
        "verify": "6. Le serveur recalcule l'HMAC", "verify_sub": "hmac.compare_digest() — temps constant<br>match → 200 + données du paiement<br>mismatch → 404"
      },
      "tech_title": "Ce qui rend le document infalsifiable",
      "col_control": "Contrôle de sécurité", "col_impl": "Implémentation", "col_why": "Pourquoi c'est important",
      "row": {
        "algo": "Algorithme cryptographique",
        "algo_why": "Empreinte authentifiée standard. Forger un jeton valide nécessite le secret serveur — calculatoirement infaisable sans lui.",
        "secret": "Secret de signature",
        "secret_why": "Secret permanent chargé depuis l'environnement / Secret Manager. Jamais SECRET_KEY (qui tourne à chaque démarrage à froid Cloud Run et invaliderait les anciens QR).",
        "payload": "Message signé",
        "payload_why": "Lie le jeton au reçu exact, au montant exact et au jour du paiement. Modifier un champ du PDF → la signature casse → la vérification échoue.",
        "compare": "Comparaison",
        "compare_why": "Comparaison à temps constant — immunisée contre les attaques de canal auxiliaire temporel qui pourraient autrement fuiter le jeton octet par octet.",
        "token": "Format du jeton",
        "token_val": "16 caractères hex (les 64 premiers bits de l'HMAC)",
        "token_why": "Suffisamment compact pour un petit QR code (ERROR_CORRECT_M reste scannable au téléphone), suffisamment long pour rendre la recherche par force brute infaisable (2^64).",
        "endpoint": "Endpoints publics",
        "endpoint_why": "Aucune authentification requise — n'importe qui (tiers, guichetier, douanier) peut scanner et vérifier en un tap. La vie privée est préservée : la réponse confirme uniquement la validité + données minimales.",
        "vault": "Stockage & coffre-fort",
        "vault_why": "PDF persisté sur Firebase Storage avec URL signée et enregistré au coffre citoyen. Le QR est vérifié contre l'état BD live, donc un paiement révoqué / remboursé peut être signalé au scan."
      },
      "threat_title": "Modèle de menaces",
      "threat": {
        "edit": "<strong>Édition du PDF imprimé</strong> (modifier montant, nom ou date dans un éditeur PDF) → le jeton QR ne correspond plus au nouveau contenu → l'endpoint renvoie 404. Détecté au premier scan.",
        "replay": "<strong>Réutilisation d'un QR pour un autre reçu</strong> → l'endpoint charge le reçu par son numéro, pas par le jeton ; un jeton volé ne peut pas être apparié à un autre numéro de reçu.",
        "brute": "<strong>Force brute du jeton</strong> → espace de recherche 2<sup>64</sup>, endpoint public sous rate-limit. Statistiquement infaisable.",
        "timing": "<strong>Canal auxiliaire temporel</strong> → atténué par <code>hmac.compare_digest()</code>.",
        "secret": "<strong>Fuite du secret</strong> → faire tourner <code>RECEIPT_VERIFICATION_SECRET</code> dans Secret Manager — les anciens reçus doivent alors être resignés si la vérification continue est requise (compromis acceptable en cas d'incident de sécurité)."
      }
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
  },

  "workflows": {
    "html_title": "Moteur de workflows - Documentation Facil",
    "title": "Référence du moteur de workflows",
    "description": "Le moteur de workflows pilote 36 workflows de demande de service répartis sur 8 domaines. Chaque workflow définit les étapes du wizard, les documents requis, les calculs de frais, les schémas OCR et les règles de routage par entité.",
    "yes": "Oui",
    "no": "Non",
    "varies": "variable",
    "toc": {
      "wizard": "Flux du wizard",
      "state": "Machine à états des demandes",
      "catalog": "Les 36 workflows",
      "condition": "ConditionEvaluator",
      "fees": "Méthodes de calcul des frais",
      "routing": "Routage par entité",
      "ocr": "Intégration des schémas OCR",
      "appointments": "Gestion des rendez-vous",
      "validation": "Validation à 2 couches"
    },
    "wizard": {
      "intro": "Toute demande de service suit un wizard avec étapes configurables. Le flux standard est :",
      "step": { "selection": "Sélection", "upload": "Téléversement", "form": "Revue de formulaire 1..N", "appointment": "Rendez-vous", "payment": "Paiement", "confirmation": "Confirmation" },
      "col_step": "Étape", "col_purpose": "Rôle", "col_optional": "Optionnelle ?",
      "row": {
        "selection": { "name": "<strong>Sélection</strong>", "purpose": "Choisir le sous-type, le type de personne, le motif. Pilote la visibilité dynamique du formulaire.", "opt": "Non (toujours présente)" },
        "upload": { "name": "<strong>Téléversement</strong>", "purpose": "Téléverser les documents requis (l'extraction OCR s'exécute ici). Les documents varient par workflow.", "opt": "Non" },
        "form": { "name": "<strong>Revue de formulaire 1..N</strong>", "purpose": "Vérifier les données extraites par OCR, remplir les champs manuels, valider les règles métier.", "opt": "Nombre variable (1-3)" },
        "appt": { "name": "<strong>Rendez-vous</strong>", "purpose": "Réserver un créneau (holds + reservations). Uniquement pour les workflows nécessitant une visite physique.", "opt": "Oui" },
        "pay": { "name": "<strong>Paiement</strong>", "purpose": "Calculer les frais et initier le paiement (BANGE ou manuel).", "opt": "Non" },
        "conf": { "name": "<strong>Confirmation</strong>", "purpose": "Affichage de synthèse, téléchargement PDF, email avec reçu.", "opt": "Non" }
      },
      "cache_title": "Wizard cache-first",
      "cache_body": "Le wizard utilise une approche <strong>cache-first</strong> : les données d'étape sont stockées dans Redis pendant le flux du wizard (pas d'écriture en BD avant le paiement). L'endpoint <code>POST /wizard-sessions/{id}/initiate-payment</code> exécute une opération atomique persistance-et-paiement dans une seule transaction BD."
    },
    "state": {
      "diagram_title": "Cycle de vie d'une demande de service",
      "draft": "Brouillon", "submit": "▼ Soumettre", "submitted": "Soumise", "auto_assign": "▼ Auto-affectation aux agents de l'entité",
      "processing": "En traitement", "decision": "▼ Décision agent", "accepted": "Acceptée", "rejected": "Rejetée",
      "amended": "Amendée", "completed": "Terminée"
    },
    "cat": {
      "identity": "Identité & Civil (CNEDOGE) — 1 workflow",
      "immigration": "Immigration (Extranjeria) — 2 workflows",
      "traffic": "Trafic (DGT) — 3 workflows",
      "driving": "Conduite (Conducir) — 1 workflow",
      "contracts": "Contrats (Contrato) — 1 workflow",
      "civil": "Fonction publique (Funcion Publica) — 5 workflows",
      "bundle": "Bundle / Commercial (multi-entité) — 1 workflow",
      "generic": "Générique — 2 workflows",
      "col_workflow": "Workflow", "col_file": "Fichier", "col_minor": "Mineur ?", "col_motivo": "Motif ?",
      "col_docs": "Docs", "col_forms": "Pages de formulaire", "col_rdv": "RDV", "col_subtypes": "Sous-types",
      "col_entities": "Entités", "col_description": "Description",
      "row": {
        "pasaporte_motivo": "Oui (4)",
        "visado": "Tramites Visado (4 sous-types)",
        "conducir_motivo": "Oui (3 : PERDIDA, ROBO, DETERIORO pour DUPLICADO)",
        "contrato_docs": "3 requis + 10 optionnels",
        "promo_sub": "3 sous-types",
        "bundle_desc": "Obligations multi-entités pour licences commerciales",
        "generic_desc": "Catch-all pour services non catégorisés"
      }
    },
    "cond": {
      "intro": "Le <code>ConditionEvaluator</code> contrôle dynamiquement la visibilité des étapes et sections en fonction des données de formulaire collectées dans les étapes précédentes. Les conditions sont définies sous forme d'objets JSON dans la configuration des workflows.",
      "callout_title": "Règle critique : les conditions sont toujours des chaînes",
      "callout_body": "Les conditions doivent utiliser des valeurs string : <code>{\"is_minor\": \"true\"}</code>, <strong>pas</strong> <code>{\"is_minor\": true}</code>. Le RadioGroup frontend stocke des chaînes, et le ConditionEvaluator effectue une comparaison <code>==</code> stricte."
    },
    "fees": {
      "col_method": "Méthode", "col_enum": "Valeur enum", "col_desc": "Description", "col_example": "Exemple",
      "row": {
        "fixed_exp": "Expédition fixe",
        "fixed_exp_desc": "Prix fixe pour les nouvelles demandes",
        "fixed_exp_ex": "Pasaporte : 35 000 FCFA",
        "fixed_ren": "Renouvellement fixe",
        "fixed_ren_desc": "Prix fixe pour les renouvellements",
        "fixed_ren_ex": "Renouvellement Conducir : 15 000 FCFA",
        "percent": "Basé sur pourcentage",
        "percent_desc": "Pourcentage d'un montant de base",
        "percent_ex": "IVA : 15 % de la base imposable",
        "unit": "Basé sur unités",
        "unit_desc": "Prix par unité (pages, items)",
        "unit_ex": "Contrato : prix par page",
        "tiered": "Taux par paliers",
        "tiered_desc": "Taux variant selon des seuils",
        "tiered_ex": "Visa Alternativo : paliers 3/6/12/24 mois",
        "formula": "Basé sur formule",
        "formula_desc": "Évaluation de formule personnalisée",
        "formula_ex": "Calculs fiscaux complexes",
        "fixed_unit": "Fixe + unitaire",
        "fixed_unit_desc": "Frais de base plus charge unitaire",
        "fixed_unit_ex": "Base + charge par employé"
      }
    },
    "routing": {
      "intro": "Le routage par entité est entièrement <strong>piloté par la BD</strong>. La colonne JSONB <code>entities.workflow_codes</code> détermine quelle entité gère quel workflow. Cela est géré via l'UI admin, sans changement de code.",
      "callout_title": "Pas de routage en code",
      "callout_body": "Ne jamais créer de fonctions <code>get_issuing_entities()</code> en code. Le champ <code>entity_code</code> sur <code>PredefinedWorkflow</code> est purement déclaratif/d'audit. Le routage réel est résolu depuis <code>entities.workflow_codes</code> au runtime."
    },
    "ocr": {
      "intro": "40 fichiers de schémas JSON définissent les templates d'extraction OCR pour les types de documents utilisés dans les workflows. Stockés dans <code>packages/backend/app/modules/service_requests/schemas/</code>.",
      "summary": "Les 40 schémas OCR",
      "col_file": "Fichier de schéma",
      "col_doctype": "Type de document",
      "doc": {
        "dip": "Carte d'identité nationale (DIP) - Guinée équatoriale",
        "pasaporte_gq": "Passeport - Guinée équatoriale",
        "pasaporte_int": "Passeport - International",
        "nacimiento": "Acte de naissance",
        "medico": "Certificat médical",
        "conducta": "Certificat de bonne conduite",
        "conducir": "Permis de conduire",
        "defuncion": "Acte de décès",
        "nif": "Numéro fiscal (NIF)",
        "padron": "Certificat de recensement",
        "solvencia": "Certificat de solvabilité fiscale",
        "onrc": "Contrat ONRC",
        "compraventa": "Contrat de vente",
        "contrato_func": "Contrat de fonctionnaire",
        "residencia": "Permis de résidence",
        "trabajo": "Permis de travail",
        "circulacion": "Permis de circulation véhicule",
        "visado": "Visa",
        "sello": "Tampon entrée/sortie",
        "itv": "Inspection véhicule (ITV)",
        "reco_veh": "Certificat de reconnaissance véhicule",
        "carnet_func": "Carnet de fonctionnaire",
        "nombramiento": "Nomination officielle",
        "dgi_note": "Note de revenu DGI",
        "res_note": "Note de revenu résidence",
        "escritura": "Acte de constitution d'entreprise",
        "cuve": "Document CUVE",
        "licencia_muni": "Licence de commerce municipale",
        "reg_comercio": "Registre du commerce",
        "reg_emp": "Registre des entreprises",
        "reg_vue": "Registre VUE",
        "conciso": "Certificat commercial concis",
        "actualizacion": "Certificat de mise à jour d'entreprise",
        "atestacion": "Attestation bancaire",
        "antecedentes": "Casier judiciaire",
        "gubernativa": "Autorisation gouvernementale",
        "parental": "Autorisation parentale",
        "cert_nac": "Certification de naissance",
        "decl_nac": "Déclaration de naissance",
        "casier": "Extrait de casier judiciaire international"
      }
    },
    "appt": {
      "intro": "Les workflows avec rendez-vous utilisent un système à 2 tables pour empêcher la double-réservation :",
      "col_table": "Table", "col_purpose": "Rôle", "col_lifetime": "Durée de vie",
      "row": {
        "holds": "Réservation temporaire pendant le flux du wizard",
        "holds_ttl": "TTL 15 minutes",
        "reservations": "Réservation confirmée permanente",
        "reservations_ttl": "Permanente"
      },
      "fns_intro": "Trois fonctions SQL gèrent le cycle de vie d'un rendez-vous :",
      "fn1": "<code>hold_appointment_slot()</code> &mdash; Crée une réservation temporaire, compte les holds+confirmées",
      "fn2": "<code>confirm_appointment_hold()</code> &mdash; Convertit une réservation en confirmée + INSERT reservation",
      "fn3": "<code>get_available_slots_v3()</code> &mdash; Retourne les créneaux disponibles (compte reservations + holds)"
    },
    "val": {
      "diagram_title": "Architecture de validation",
      "layer1": "Couche 1 : étape Téléversement",
      "layer1_sub": "SchemaValidationEngine (70+ règles JSON) + RiskAnalyzer (12 étapes)",
      "layer2": "Couche 2 : étape Revue de formulaire",
      "layer2_sub": "Surcharges validate_step() uniquement (Python réel)",
      "point1": "<strong>Schema</strong> (couche 1) = validité documentaire (format, signatures, champs requis, validité temporelle)",
      "point2": "<strong>validate_step</strong> (couche 2) = décision métier (ce que le résultat signifie pour CE workflow)",
      "point3": "<strong>Ne jamais dupliquer les règles entre les couches.</strong> Si le schéma a <code>certificado_vigente</code>, ne pas recréer dans validate_step."
    }
  },

  "indexpage": {
    "html_title": "Documentation Plateforme Facil",
    "title": "Documentation de la plateforme Facil",
    "breadcrumb": "Accueil de la documentation",
    "description": "Référence technique complète pour la plateforme de services administratifs Facil. Conçue pour la République de Guinée équatoriale pour traiter les services fiscaux, gérer les démarches civiles et soutenir 100+ agents gouvernementaux concurrents à travers plusieurs ministères.",
    "stats": {
      "fiscal": "Services fiscaux",
      "tables": "Tables de base de données",
      "workflows": "Workflows",
      "roles": "Rôles",
      "backend": "Modules backend",
      "frontend": "Modules frontend",
      "routers": "Routeurs API",
      "ocr": "Schémas OCR"
    },
    "docmap": {
      "title": "Plan de la documentation",
      "architecture": "— Structure du monorepo, backend 3-tier, modules frontend, cache, pipeline IA",
      "api": "— 62 routeurs, authentification, formats requête/réponse, rate limiting",
      "database": "— 145 tables sur 10 domaines, 50 enums, conventions de nommage, migrations",
      "workflows": "— 36 workflows, étapes du wizard, condition evaluator, calcul des frais, routage par entité",
      "modules": "— 30 modules backend, 41+ modules frontend, organisés par domaine",
      "agents": "— Chatbot RAG, 5 agents par rôle, extraction OCR, affectation intelligente",
      "payments_title": "Systèmes de paiement",
      "payments": "— Intégration BANGE, paiements atomiques, flux groupés, rapports financiers",
      "security_title": "Architecture de sécurité",
      "security": "— JWT + 2FA, RBAC avec 335 permissions, conformité OWASP, journal d'audit",
      "deployment_title": "Déploiement & Opérations",
      "deployment": "— Pipeline CI/CD, Cloud Run, Firebase Hosting, monitoring",
      "i18n": "— Support trilingue (ES/FR/EN), 11 400+ clés, architecture de traduction",
      "grafana": "— 10 dashboards production, ingénierie analytique, couche de données sémantique, KPIs orientés décision",
      "logrocket": "— Rejeu de session (web + mobile + inspector), caviardage PII en priorité, bridge Sentry, flux d'utilisation quotidiens"
    },
    "overview": {
      "title": "Aperçu de la plateforme",
      "body1": "<strong>Facil</strong> est un framework full-stack alimenté par l'IA pour numériser les démarches administratives gouvernementales et les procédures liées aux entreprises. Il se livre comme une plateforme complète &mdash; <strong>API backend, tableau de bord web, application mobile citoyen et application d'inspection terrain</strong> &mdash; que tout gouvernement peut configurer pour piloter ses propres services fiscaux, workflows, traitement documentaire et interactions citoyennes, de bout en bout.",
      "body2": "Le framework est <strong>indépendant du pays par conception</strong> : workflows, services fiscaux, entités, rôles, traductions et règles métier sont tous <em>pilotés par les données</em> et configurables via la base de données et l'admin UI &mdash; rien n'est codé en dur. Déployer Facil dans un nouveau pays signifie <em>configurer</em> services, entités et workflows, pas réécrire du code. L'IA intégrée (Gemini 2.5 Flash via Vertex AI + RAG pgvector) alimente le chatbot, l'OCR/IDP intelligent, le scoring de risque automatisé et l'aide à la décision pour les agents.",
      "body3": "<strong>Déploiement actuel &mdash; République de Guinée équatoriale</strong> : 873 services fiscaux à travers 20 entités gouvernementales (DGI, CNEDOGE, DGT, Extranjer&iacute;a, Ayuntamiento, C&aacute;mara de Comercio, Tesoro P&uacute;blico, MINFP, ITV, ONRC, OFIVE, plus 8 entités ministérielles), répertoire de 21 ministères, 34 sites dans 17 villes, 36 workflows métier, 47 rôles avec 337 permissions granulaires, interface entièrement trilingue (espagnol, français, anglais)."
    },
    "stack": {
      "title": "Pile technique",
      "col_layer": "Couche", "col_tech": "Technologie", "col_version": "Version", "col_purpose": "Rôle",
      "row": {
        "api": "API backend", "api_purpose": "API REST avec docs OpenAPI auto",
        "runtime": "Runtime", "runtime_purpose": "Async-first avec asyncio/asyncpg",
        "db": "Base de données", "db_purpose": "Stockage principal avec pgvector",
        "cache": "Cache", "cache_purpose": "Mise en cache avec fallback en mémoire",
        "frontend": "Frontend", "frontend_purpose": "App Router avec SSR et i18n",
        "ui": "Framework UI", "ui_purpose": "Bibliothèque de composants avec Tailwind CSS",
        "mobile": "Mobile", "mobile_purpose": "Apps Android/iOS citoyen et inspecteur",
        "ai": "IA", "ai_purpose": "Chatbot RAG, analyse documentaire, scoring de risque",
        "cloud": "Cloud", "cloud_purpose": "Déploiement de conteneurs serverless",
        "hosting": "Hébergement", "hosting_purpose": "CDN frontend avec canaux staging",
        "storage": "Stockage", "storage_purpose": "Stockage de documents et fichiers avec URLs signées",
        "cicd": "CI/CD", "cicd_purpose": "8 fichiers workflow (CI, deploy, build)",
        "errors": "Suivi d'erreurs", "errors_purpose": "Exceptions backend + web + mobile + inspector, releases, source maps",
        "replay": "Rejeu de session", "replay_purpose": "Rejeux web + mobile + inspector avec caviardage PII, bridge Sentry",
        "metrics": "Métriques & alertes", "metrics_purpose": "10 dashboards opérationnels, Postgres dual-provider, alertes d'astreinte",
        "bi": "Tableaux de bord métier", "bi_purpose": "BI embarquée avec report IDs gérés par admin (sans redéploiement)",
        "audit": "Audit & journaux", "audit_purpose": "Logs structurés, piste audit_logs en BD, permission_audit_log"
      }
    },
    "monorepo": { "title": "Structure du monorepo" },
    "qs": {
      "title": "Démarrage rapide",
      "backend_title": "Développement backend",
      "frontend_title": "Développement frontend",
      "callout_title": "Important",
      "callout_body": "Ne jamais compiler manuellement avec <code>gcloud</code>. Tous les déploiements doivent passer par GitHub Actions. Pousse sur la branche <code>develop</code> et le pipeline CI/CD construira et déploiera automatiquement le backend (Cloud Run) et le frontend (Firebase Hosting)."
    },
    "pages": { "title": "Pages de documentation" },
    "cards": {
      "architecture": "Conception backend 3-tier, structure modulaire frontend, couches de cache, pipeline IA, apps mobiles et topologie de déploiement.",
      "api": "Les 62 routeurs API, flux d'authentification, formats requête/réponse, gestion d'erreurs, rate limiting et pagination.",
      "database": "145 tables sur 10 domaines, 50 enums avec toutes leurs valeurs, conventions de nommage et relations clés.",
      "workflows": "36 définitions de workflows, flux du wizard, conditions dynamiques, calcul des frais, intégration OCR et routage par entité.",
      "modules": "30 modules backend et 41+ modules frontend organisés par domaine, avec endpoints clés, tables et dépendances.",
      "agents": "Chatbot RAG avec Gemini 2.5 Flash, 5 agents par rôle, traitement OCR de documents et moteur d'affectation intelligente.",
      "payments": "Intégration BANGE, pipeline de paiement atomique, flux multi-entités, rapports financiers et génération de reçus.",
      "security": "Authentification JWT + 2FA, RBAC avec 47 rôles et 335 permissions, conformité OWASP, en-têtes CSP et journal d'audit.",
      "deployment_title": "Déploiement & Ops",
      "deployment": "8 workflows GitHub Actions, conteneurs Cloud Run, Firebase Hosting, gestion d'environnements et monitoring.",
      "i18n": "Support trilingue (espagnol, français, anglais), 11 400+ clés de traduction, traductions d'entités backend et rendu de modèles.",
      "grafana": "10 dashboards production-grade, architecture de données sémantique 4 couches, résolution multi-source et KPIs orientés décision pour trésorerie, agents et inspecteurs.",
      "logrocket": "Rejeu de session sur web + mobile + inspector avec caviardage PII 4 couches, application de la politique d'identification et bridge Sentry pour debug forensique."
    },
    "dec": {
      "title": "Décisions d'architecture clés",
      "col_decision": "Décision", "col_choice": "Choix", "col_rationale": "Justification",
      "row": {
        "api": "Framework API", "api_choice": "FastAPI (async)", "api_rationale": "Async natif, docs OpenAPI auto, validation Pydantic v2, haut débit",
        "driver": "Driver BD", "driver_choice": "asyncpg (pas d'ORM)", "driver_rationale": "SQL paramétré brut pour contrôle, performance et sécurité maximums",
        "routing": "Routage frontend", "routing_choice": "Next.js App Router avec [locale]", "routing_rationale": "Rendu côté serveur, i18n intégré, route groups pour auth/dashboard/public",
        "state": "Gestion d'état", "state_choice": "React Query + Zustand", "state_rationale": "Séparation état serveur (Query) vs état client (Zustand)",
        "deploy": "Déploiement", "deploy_choice": "Cloud Run + Firebase Hosting", "deploy_rationale": "Scaling serverless, zéro gestion d'infra, distribution CDN",
        "entity": "Routage par entité", "entity_choice": "Piloté par BD (entities.workflow_codes)", "entity_rationale": "Aucun changement de code requis pour assigner des workflows aux entités, géré via UI admin",
        "cache": "Stratégie de cache", "cache_choice": "HybridCache (Redis + fallback en mémoire)", "cache_rationale": "Dégradation gracieuse si Redis indisponible, TTLs spécifiques au domaine",
        "ai": "Modèle IA", "ai_choice": "Gemini 2.5 Flash via Vertex AI", "ai_rationale": "Inférence rapide, support tool-use, rentable pour des charges gouvernementales"
      }
    },
    "ent": {
      "title": "Entités gouvernementales",
      "intro": "Facil dessert plusieurs entités gouvernementales de Guinée équatoriale, chacune gérant des services fiscaux et workflows spécifiques :",
      "col_entity": "Entité", "col_code": "Code", "col_domain": "Domaine",
      "row": {
        "dgi": "Déclarations fiscales, services fiscaux",
        "cnedoge": "Services de passeport",
        "dgt": "Immatriculation de véhicules, permis de conduire",
        "extranjeria": "Permis de résidence, démarches de visa",
        "ayuntamiento": "Services municipaux, licences commerciales",
        "camara": "Inscription des entreprises, certificats commerciaux",
        "tesoro": "Trésorerie, traitement des paiements",
        "funcion": "Fonction publique, vérification des employés",
        "various": "Divers ministères",
        "min": "Inspections et permis sectoriels"
      }
    },
    "footer": "Plateforme Facil v1.1.8 · République de Guinée équatoriale · © 2026 Sah Kouemou",
    "footer.dashboards": "Tableaux de bord"
  },

  "api": {
    "html_title": "Référence API - Documentation Facil",
    "title": "Référence API",
    "description": "Le backend Facil expose 62 routeurs API via FastAPI, tous montés sous le préfixe <code>/api/v1</code>. Cette référence couvre l'authentification, les conventions de requête et les endpoints clés par domaine.",
    "toc": {
      "base_url": "URL de base & conventions",
      "auth": "Authentification",
      "errors": "Gestion d'erreurs",
      "rate": "Rate limiting",
      "routers": "Les 62 routeurs API",
      "auth_ep": "Endpoints Auth",
      "user_ep": "Endpoints Utilisateurs",
      "fiscal_ep": "Endpoints Services fiscaux",
      "sr_ep": "Endpoints Demandes de service",
      "pay_ep": "Endpoints Paiements",
      "chat_ep": "Endpoints Chatbot",
      "admin_ep": "Endpoints Admin"
    },
    "base": {
      "col_env": "Environnement", "col_url": "URL de base",
      "row": { "prod": "Production", "local": "Dev local" }
    },
    "headers": { "title": "En-têtes de requête" },
    "pag": { "title": "Pagination", "intro": "Les endpoints de listing acceptent les paramètres de pagination standard :", "meta": "La réponse inclut les métadonnées de pagination :" },
    "auth": {
      "flow_title": "Flux d'authentification",
      "step1": "Connexion (email+mot de passe)",
      "step2": "Vérification des identifiants",
      "step3": "Vérification 2FA (si activé)",
      "step4": "Émission de la paire JWT",
      "col_token": "Token", "col_lifetime": "Durée", "col_purpose": "Rôle",
      "row": {
        "access": "Token d'accès", "access_life": "30 minutes", "access_purpose": "Autorisation API (en-tête Bearer)",
        "refresh": "Token de rafraîchissement", "refresh_life": "30 jours", "refresh_purpose": "Obtenir de nouveaux tokens d'accès sans re-login"
      },
      "jwt_title": "Payload JWT",
      "2fa_title": "Authentification à deux facteurs (2FA)",
      "2fa_body": "2FA TOTP optionnel via <code>pyotp</code>. Lorsqu'activé, la connexion retourne un flag <code>2fa_required</code> et le client doit soumettre le code TOTP pour terminer l'authentification."
    },
    "err": {
      "intro": "Toutes les erreurs suivent un schéma de réponse cohérent avec support trilingue :",
      "col_status": "Statut HTTP", "col_code": "Code d'erreur", "col_desc": "Description",
      "row": {
        "400": "Paramètres de requête invalides",
        "401": "Token JWT manquant ou invalide",
        "403": "Permissions insuffisantes (RBAC)",
        "404": "Ressource introuvable",
        "409": "Conflit de ressource (doublon, mismatch de version)",
        "422": "Échec de validation Pydantic (erreurs de champ détaillées)",
        "429": "Limite de taux dépassée",
        "500": "Erreur interne (détails assainis pour les clients)"
      },
      "callout_title": "Note de sécurité",
      "callout_body": "Pour les erreurs 5xx, le backend assainit le champ <code>detail</code> pour empêcher la fuite des messages d'exception internes. Les stack traces complètes sont loggées côté serveur via Loguru."
    },
    "rate": {
      "intro": "Le rate limiting est appliqué par utilisateur (ou par IP pour les endpoints non authentifiés) via la fonction Redis <code>check_rate_limit()</code>.",
      "col_cat": "Catégorie d'endpoint", "col_limit": "Limite", "col_window": "Fenêtre",
      "row": {
        "auth": "Authentification (login/register)", "auth_limit": "10 requêtes",
        "chat": "Messages chatbot", "chat_limit": "30 requêtes",
        "general": "API générale (authentifiée)", "general_limit": "100 requêtes",
        "upload": "Téléversement de fichiers", "upload_limit": "20 requêtes",
        "window": "60 secondes"
      }
    },
    "routers": {
      "auth": "Authentification & Utilisateurs (5 routeurs)",
      "fiscal": "Services fiscaux & Bundles (7 routeurs)",
      "sr": "Demandes de service (6 routeurs)",
      "pay": "Paiements & Vérification (3 routeurs)",
      "agents": "Agents & Affectations (5 routeurs)",
      "admin": "Admin & Permissions (7 routeurs)",
      "tr": "Traductions & i18n (4 routeurs)",
      "comm": "Communications (6 routeurs)",
      "companies": "Entreprises (5 routeurs)",
      "insp": "Inspections (4 routeurs)",
      "other": "Autres (10 routeurs)",
      "col_router": "Routeur", "col_prefix": "Préfixe", "col_tags": "Tags"
    },
    "ep": {
      "auth": {
        "login": "Connexion email + mot de passe, retourne la paire JWT",
        "register": "Créer un nouveau compte utilisateur",
        "refresh": "Échanger le token de rafraîchissement contre un nouveau token d'accès",
        "verify": "Envoyer le code de vérification email",
        "reset": "Demander l'email de réinitialisation de mot de passe",
        "change": "Changer le mot de passe (authentifié)",
        "2fa_setup": "Initialiser la configuration 2FA TOTP",
        "2fa_verify": "Vérifier le code TOTP lors de la connexion",
        "logout": "Révoquer le token de rafraîchissement"
      },
      "user": {
        "me": "Récupérer le profil de l'utilisateur courant",
        "update": "Mettre à jour le profil de l'utilisateur courant",
        "byid": "Récupérer un utilisateur par ID (admin)"
      },
      "fs": {
        "list": "Lister tous les services fiscaux (873 au total, paginé)",
        "detail": "Récupérer les détails du service avec infos tarifaires",
        "search": "Recherche plein-texte (tsvector)",
        "ministry": "Services filtrés par ministère"
      },
      "sr": {
        "create": "Créer une nouvelle demande de service",
        "list": "Lister les demandes de service de l'utilisateur",
        "detail": "Récupérer les détails de la demande",
        "wizard_create": "Créer une session wizard (flux cache-first)",
        "wizard_update": "Mettre à jour les données d'étape du wizard",
        "initiate": "Persistance + paiement atomique"
      },
      "pay": {
        "initiate": "Initier un paiement (BANGE ou manuel)",
        "detail": "Récupérer les détails du paiement",
        "webhook": "Callback de paiement BANGE",
        "verify": "Vérifier un reçu de paiement"
      },
      "chat": {
        "message": "Envoyer un message au chatbot IA",
        "list": "Lister l'historique des conversations",
        "detail": "Récupérer les messages d'une conversation"
      },
      "admin": {
        "health": "Tableau de bord de santé système",
        "users": "Lister tous les utilisateurs (admin uniquement)",
        "audit": "Interroger les journaux d'audit (2800+ entrées)",
        "menu_me": "Récupérer le menu agent pour l'utilisateur courant",
        "menu_map": "Lister les mappings workflow-vers-menu"
      }
    }
  },

  "arch": {
    "html_title": "Architecture système - Documentation Facil",
    "description": "Facil est une plateforme basée sur un monorepo avec 4 packages : un backend Python/FastAPI, un frontend Next.js et deux applications mobiles Expo React Native. Ce document détaille l'architecture de chaque couche.",
    "toc": {
      "overview": "Vue d'ensemble du système",
      "backend": "Architecture backend 3-tier",
      "frontend": "Architecture frontend",
      "mobile": "Architecture mobile",
      "db": "Architecture base de données",
      "caching": "Architecture de cache",
      "ai": "Architecture IA",
      "event": "Event Bus & traitement en arrière-plan"
    },
    "overview": {
      "diagram_title": "Architecture système haut niveau",
      "citizens": "Citoyens / Entreprises", "citizens_sub": "Navigateur web + App mobile",
      "gov_agents": "Agents gouvernementaux", "gov_agents_sub": "Tableau de bord agent",
      "inspectors": "Inspecteurs", "inspectors_sub": "App mobile inspecteur",
      "firebase_sub": "CDN + canaux staging",
      "nextjs_sub": "SSR + App Router + i18n (ES/FR/EN)",
      "https": "▼ HTTPS / API REST",
      "cloudrun_sub": "Conteneurs auto-scalés",
      "fastapi_sub": "Python 3.11+ / asyncio",
      "pg_sub": "145 tables + pgvector",
      "redis_sub": "Cache + rate limits",
      "storage_sub": "Documents + fichiers",
      "body": "La plateforme suit une stricte séparation des préoccupations : le backend agit comme une API REST sans état consommée par plusieurs clients (frontend web, deux apps mobiles). Tout l'état est stocké dans PostgreSQL avec Redis comme couche de cache de performance. Les services externes incluent Vertex AI pour les fonctionnalités d'intelligence et BANGE pour le traitement des paiements."
    },
    "backend": {
      "intro": "Le backend suit une architecture stricte 3-tier en couches au sein de chacun de ses 30 modules fonctionnels. Chaque couche a une responsabilité unique et ne communique qu'avec sa couche adjacente.",
      "diagram_title": "Architecture en couches du backend",
      "api_layer": "Couche API", "api_layer_sub": "Routeurs FastAPI + middleware + auth guards",
      "connector1": "Modèles Request/Response Pydantic v2",
      "svc_layer": "Couche Services", "svc_layer_sub": "Logique métier + validation + moteur de règles",
      "connector2": "Objets de domaine / dicts",
      "repo_layer": "Couche Repository", "repo_layer_sub": "asyncpg + SQL paramétré + pool de connexions",
      "connector3": "Records asyncpg",
      "pg_sub": "Hébergé sur Supabase",
      "api_title": "Couche API",
      "api_intro": "La couche API se compose de 62 routeurs FastAPI enregistrés dans <code>app/main.py</code>. Chaque routeur :",
      "api": {
        "bullet1": "Définit les endpoints HTTP avec paramètres typés",
        "bullet2": "Applique les décorateurs d'authentification et de permission (<code>@permission_required</code>)",
        "bullet3": "Valide l'entrée via les modèles Pydantic v2",
        "bullet4": "Délègue à la couche services pour la logique métier",
        "bullet5": "Retourne des réponses JSON structurées avec des codes d'erreur"
      },
      "svc_title": "Couche Services",
      "svc_body": "Les services contiennent toute la logique métier, la validation et la coordination entre repositories. Ils gèrent la gestion de transactions, la publication d'événements et l'orchestration cross-module.",
      "repo_title": "Couche Repository",
      "repo_body": "Les repositories sont la <strong>seule</strong> couche qui interagit avec la base. Toutes les requêtes utilisent du <strong>SQL paramétré</strong> avec des placeholders <code>$1, $2</code> (jamais de concaténation) pour la prévention d'injections SQL.",
      "modstruct_title": "Structure de fichiers d'un module",
      "startup_title": "Séquence de démarrage de l'application",
      "startup_intro": "L'application FastAPI s'initialise dans cet ordre au démarrage (défini dans le lifespan de <code>main.py</code>) :",
      "startup": {
        "s1": "<strong>Pool BD</strong> &mdash; pool de connexions asyncpg (5-20 connexions)",
        "s2": "<strong>Sync permissions</strong> &mdash; auto-découverte RBAC, sync des rôles, nettoyage obsolète",
        "s3": "<strong>Sync workflows</strong> &mdash; classes Python workflows synchronisées vers la BD (tarifs, docs, menus)",
        "s4": "<strong>Event Bus</strong> &mdash; enregistre les handlers notification, audit, agent queue, payment assignment et verification",
        "s5": "<strong>Réparation des orphelins</strong> &mdash; auto-réparation des demandes PAID non assignées aux agents",
        "s6": "<strong>Système de cache</strong> &mdash; Upstash Redis avec fallback en mémoire",
        "s7": "<strong>RBAC listener</strong> &mdash; PostgreSQL NOTIFY pour invalidation temps réel des permissions",
        "s8": "<strong>Scheduler interne</strong> &mdash; jobs cron (remplace Cloud Scheduler)"
      }
    },
    "frontend": {
      "diagram_title": "Architecture modulaire du frontend",
      "modules": "41+ modules fonctionnels", "modules_sub": "components / hooks / services / types",
      "core": "Couche Core", "core_sub": "api/client.ts, auth, providers",
      "shadcn_sub": "Stylage Tailwind CSS",
      "rq_sub": "État serveur",
      "zustand_sub": "État client",
      "routes_title": "Groupes de routes",
      "col_group": "Groupe", "col_path": "Chemin", "col_purpose": "Rôle", "col_auth": "Auth requise",
      "no": "Non", "yes_jwt": "Oui (JWT)",
      "row": {
        "auth_path": "<code>/[locale]/login</code>, <code>/register</code>, etc.",
        "auth_purpose": "Pages d'authentification",
        "public_path": "<code>/[locale]/services</code>, <code>/about</code>",
        "public_purpose": "Informations publiques",
        "dash_purpose": "Zone protégée utilisateur/agent"
      },
      "modpat_title": "Pattern de module frontend"
    },
    "mobile": {
      "intro": "Deux applications Expo (React Native) distinctes servent des groupes d'utilisateurs différents :",
      "col_app": "Application", "col_pkg": "Package", "col_users": "Utilisateurs", "col_status": "Statut",
      "row": {
        "citizen": "Facil (citoyen)",
        "citizen_users": "Citoyens, entreprises",
        "citizen_status": "P2 complet (dashboard, listings, services)",
        "inspector_users": "Agents d'inspection terrain",
        "inspector_status": "Architecture P0 prête"
      },
      "stack_title": "Pile technique mobile",
      "stack": {
        "framework": "<strong>Framework :</strong> Expo SDK 54 avec Expo Router (routing par fichiers)",
        "ui": "<strong>UI :</strong> React Native Paper (Material Design 3)",
        "state": "<strong>État :</strong> React Query (serveur) + Zustand (client)",
        "validation": "<strong>Validation :</strong> Schémas Zod sur tous les formulaires",
        "i18n": "<strong>Internationalisation :</strong> 3 langues (ES/FR/EN)",
        "design": "<strong>Principe de design :</strong> Patterns Android natifs (listes plates, séparateurs, effets ripple)"
      }
    },
    "db": {
      "intro": "PostgreSQL hébergé sur Supabase sert de stockage principal des données. Le schéma comprend 145 tables organisées sur 10 domaines, avec l'extension pgvector pour le stockage des embeddings IA.",
      "diagram_title": "Architecture de connexion BD",
      "fastapi": "Application FastAPI",
      "pool_sub": "min=5, max=20 connexions",
      "pg_sub": "145 tables + 50 enums + pgvector",
      "features_intro": "Caractéristiques BD clés :",
      "feat": {
        "pool": "<strong>Pooling de connexions :</strong> pool asyncpg avec 5-20 connexions, auto-reconnect",
        "lock": "<strong>Ordre des verrous :</strong> séquence de verrouillage canonique pour les paiements bundle pour prévenir les deadlocks",
        "soft": "<strong>Suppressions logiques :</strong> pattern timestamp <code>deleted_at</code> sur les tables applicables",
        "audit": "<strong>Piste d'audit :</strong> <code>created_at</code>, <code>updated_at</code> sur toutes les tables",
        "pgvector": "<strong>pgvector :</strong> pour le stockage d'embeddings du chatbot RAG et la recherche par similarité",
        "tsvector": "<strong>tsvector :</strong> recherche plein-texte sur le catalogue de services fiscaux"
      },
      "see_also": "Voir <a href=\"database.html\">Référence du schéma BD</a> pour le catalogue complet des tables."
    },
    "cache": {
      "intro": "Le système <code>HybridCache</code> (<code>app/core/cache.py</code>) fournit Redis (Upstash TLS) comme cache primaire avec fallback automatique en mémoire si Redis est indisponible.",
      "col_instance": "Instance de cache", "col_factory": "Fonction factory", "col_ttl": "TTL", "col_purpose": "Rôle",
      "5min": "5 min", "10min": "10 min", "30min": "30 min", "1h": "1 heure",
      "row": {
        "default": "Par défaut", "default_purpose": "Mise en cache générale",
        "menu": "Menu", "menu_purpose": "Configurations de menu par rôle",
        "perm": "Permissions", "perm_purpose": "Ensembles de permissions RBAC par utilisateur",
        "svc": "Services", "svc_purpose": "Catalogue de services fiscaux (873 items)",
        "tr": "Traductions", "tr_purpose": "Traductions UI et d'entités",
        "wm": "Mappings workflow", "wm_purpose": "Règles de mapping workflow vers menu",
        "sess": "Sessions", "sess_purpose": "Données de session utilisateur"
      },
      "features_intro": "Fonctionnalités cache supplémentaires :",
      "feat": {
        "rate": "<strong>Rate limiting :</strong> <code>check_rate_limit(identifier, endpoint, max_requests, window_seconds)</code>",
        "invalidate": "<strong>Invalidation de cache :</strong> <code>invalidate_user_permissions_cache(user_id)</code> déclenchée par PostgreSQL NOTIFY",
        "listener": "<strong>RBAC listener :</strong> invalidation de cache temps réel via <code>app/core/rbac_listener.py</code> abonné au canal PostgreSQL NOTIFY",
        "dec": "<strong>Décorateurs :</strong> <code>@cached(cache_getter, ttl)</code> pour mise en cache transparente des résultats"
      }
    },
    "ai": {
      "diagram_title": "Pipeline IA / RAG",
      "user_query": "Requête utilisateur",
      "preproc": "Pré-processeur de requête", "preproc_sub": "Détection de langue, classification d'intention",
      "hybrid": "Recherche hybride", "hybrid_sub": "70 % cosinus pgvector + 30 % tsvector",
      "context": "Assemblage du contexte", "context_sub": "Docs pertinents + contexte utilisateur + outils",
      "gemini_sub": "35 outils + boucle d'auto-réflexion",
      "response": "Réponse", "response_sub": "15 formats + vérif de score (régénération si <5/10)",
      "body": "Le système IA utilise Gemini 2.5 Flash via Google Vertex AI avec un pipeline Retrieval-Augmented Generation (RAG). Il supporte 35 outils spécialisés (19 publics, 8 authentifiés, 8 raisonnement avancé) et 5 configurations d'agents par rôle. La boucle d'auto-réflexion score chaque réponse et régénère si la qualité est inférieure à 5/10.",
      "see_also": "Voir <a href=\"agents.html\">IA &amp; Intelligence</a> pour la référence IA complète."
    },
    "event": {
      "intro": "L'<code>EventBus</code> (<code>app/core/events.py</code>) fournit un système de publish/subscribe in-process pour la communication cross-module découplée.",
      "handlers_title": "Handlers d'événements enregistrés",
      "col_handler": "Handler", "col_module": "Module", "col_events": "Événements",
      "row": {
        "notif": "Handler de notification", "notif_events": "Changements de statut de demande, événements de paiement",
        "audit": "Handler d'audit", "audit_events": "Toutes les opérations critiques (table audit_logs)",
        "queue": "Handler de file agent", "queue_events": "Paiement complété, demande soumise",
        "pay": "Handler d'assignation de paiement", "pay_events": "Auto-affectation des paiements manuels à Trésorerie",
        "verif": "Handler de vérification", "verif_events": "Événements de vérification de documents externes"
      },
      "sched_title": "Scheduler interne",
      "sched_intro": "Le <code>internal_scheduler</code> (<code>app/core/scheduler.py</code>) exécute des tâches périodiques au sein du processus de l'application, remplaçant le besoin d'un Cloud Scheduler externe :",
      "sched": {
        "appt": "Expiration des holds de rendez-vous (nettoyage TTL 15 minutes)",
        "sla": "Suivi des échéances SLA et escalade",
        "workload": "Rééquilibrage de la charge des agents",
        "warm": "Préchauffage du cache pour les données fréquemment accédées"
      }
    }
  },

  "lr": {
    "html_title": "Observabilité LogRocket - Documentation Facil",
    "title": "LogRocket — Rejeu de session & observabilité confidentialité d'abord",
    "description": "LogRocket est wiré sur <strong>3 surfaces</strong> (web, mobile, inspector) comme la « CCTV » de la plateforme Facil. Tandis que Sentry capture les plantages après coup, LogRocket enregistre <em>ce que l'utilisateur a fait</em> avant, pendant et après — rendant les bugs signalés par les citoyens et les frictions UX reproductibles sans jamais demander à l'utilisateur de répéter ses étapes.",
    "toc": {
      "why": "1. Pourquoi LogRocket (et pas seulement Sentry)",
      "architecture": "2. Architecture — 3 surfaces, 1 famille de SDK",
      "privacy": "3. Conception confidentialité d'abord (caviardage PII)",
      "wiring": "4. Wiring du dépôt (fichier par fichier)",
      "secrets": "5. Topologie des secrets",
      "flows": "6. Flux d'utilisation quotidiens",
      "tour": "7. Tour du tableau de bord LogRocket",
      "bridge": "8. Le bridge Sentry",
      "limits": "9. Limites, pièges, roadmap"
    },
    "why": {
      "intro": "LogRocket et Sentry semblent similaires au premier abord — tous deux « capturent les erreurs » — mais résolvent des problèmes différents. Choisir le bon sous pression représente la moitié de l'art de l'astreinte.",
      "both_title": "Pourquoi nous utilisons les deux",
      "both1": "<strong>La force de Sentry, c'est l'alerting + le regroupement</strong>. Quand le taux d'erreurs grimpe, Sentry ping l'astreinte et déduplique par fingerprint de stack-trace. Léger, faible volume.",
      "both2": "<strong>La force de LogRocket, c'est le contexte</strong>. Quand un citoyen dit « l'app a planté quand j'ai cliqué sur soumettre », tu rejoues exactement cette session et tu <em>vois</em> le bug, pas seulement le symptôme.",
      "both3": "<strong>Ils se complètent</strong> : Sentry détecte → LogRocket explique. Le bridge (<code>bridgeLogRocketToSentry()</code>) attache l'URL de session LogRocket à chaque événement Sentry, donc un Issue dans Sentry permet d'accéder en un clic au rejeu correspondant.",
      "pitfall_title": "Piège fréquent",
      "pitfall_body": "« J'ai Sentry, je n'ai pas besoin de LogRocket » — <strong>faux</strong>. Les bugs UX (UI gelée, mauvaise navigation, formulaire confus) ne laissent aucune trace Sentry car aucune exception n'est levée. LogRocket est le seul outil qui capture les <em>sessions sans erreur</em>, ce qu'il faut exactement pour diagnostiquer une plainte citoyenne sur le wizard."
    },
    "compare": {
      "cadence": "Cadence de capture", "cadence_sentry": "Uniquement à l'erreur", "cadence_lr": "<strong>En continu</strong>, comme une CCTV",
      "stored": "Ce qui est stocké", "stored_sentry": "Stack trace + 60 s de breadcrumbs", "stored_lr": "<strong>Vidéo de session complète</strong> — clics, scrolls, réseau, console, redux/zustand",
      "pricing": "Modèle de tarification", "pricing_sentry": "Par événement d'erreur", "pricing_lr": "Par <strong>session</strong> (une visite utilisateur = une session)",
      "tier": "Free tier", "tier_sentry": "5K erreurs / mois", "tier_lr": "1K sessions / mois",
      "best": "Idéal pour", "best_sentry": "« Pourquoi ce plantage ? » — root-cause", "best_lr": "« Qu'a fait l'utilisateur avant X ? » — reproduire un parcours",
      "trigger": "Déclencheur", "trigger_sentry": "<code>captureException(err)</code> ou auto-uncaught", "trigger_lr": "Init SDK au boot → capture jusqu'à la fin de session",
      "ui": "UI principale", "ui_sentry": "Liste Issues / Errors", "ui_lr": "Liste de sessions avec rejeu vidéo"
    },
    "arch": {
      "diagram_title": "Matrice de couverture LogRocket",
      "web": "Web (Next.js 14)",
      "mobile": "App mobile citoyen (Expo SDK 54)",
      "inspector": "App inspecteur (Expo SDK 54)",
      "single": "Projet LogRocket unique",
      "single_sub": "app.logrocket.com/0eqns2/facil — quota partagé 1K sessions/mois",
      "pii": "Caviardage PII (défense 3 couches)",
      "pii_sub": "Options SDK + sanitizers + opt-in DOM/JSX",
      "bridge": "Bridge Sentry (web aujourd'hui)",
      "bridge_sub": "extra.logrocketURL sur chaque événement Sentry",
      "policy_title": "Politique d'init par surface",
      "col_surface": "Surface", "col_init": "Localisation de l'init", "col_noop": "Auto no-op si", "col_default": "Capture par défaut",
      "row": {
        "web": { "name": "<strong>Web</strong>", "init": "<code>&lt;LogRocketProvider&gt;</code> monté dans <code>Providers.tsx</code>", "noop": "<code>NODE_ENV=development</code> OU <code>NEXT_PUBLIC_LOGROCKET_APP_ID</code> vide OU SSR (<code>!window</code>)", "default": "Capture tout le texte visible ; <strong>opt-out</strong> via <code>data-private=\"redact\"</code>" },
        "mobile": { "name": "<strong>Mobile</strong>", "init": "<code>initLogRocket()</code> dans <code>&lt;DeferredEffects&gt;</code> de <code>_layout.tsx</code>", "noop": "<code>__DEV__=true</code> OU <code>EXPO_PUBLIC_LOGROCKET_APP_ID</code> vide", "default": "Caviarde tout le texte ; <strong>opt-in</strong> via <code>&lt;LRAllow&gt;</code>" },
        "insp": { "name": "<strong>Inspector</strong>", "init": "Idem mobile", "default": "Idem mobile (caviardage RN par défaut)" }
      },
      "opposite_title": "Pourquoi des défauts opposés (web vs mobile) ?",
      "opposite_body": "Le web est un poste de bureau, souvent utilisé par des agents sur des machines partagées — capturer est plus utile pour le triage et le navigateur desktop ne contient généralement pas la même intensité de PII qu'un appareil personnel. Le mobile est un appareil personnel avec des formulaires sensibles (passeport, NIF, adresse) — caviarder par défaut est plus sûr. Coût du compromis : les rejeux sont moins informatifs sur mobile tant que tu n'audites pas chaque écran et n'enveloppes pas les zones non-PII avec <code>&lt;LRAllow&gt;</code>."
    },
    "priv": {
      "intro": "Facil traite des passeports citoyens, NIFs, déclarations, reçus de paiement. La fuite de PII vers un SaaS tiers est un risque réglementaire. Les wrappers SDK appliquent <strong>4 couches de défense</strong>, chacune indépendamment suffisante (défense en profondeur) :",
      "l1": "<strong>L1 — Options SDK</strong> : <code>inputSanitizer: true</code> (web) / <code>textSanitizer: 'excluded'</code> (mobile) masque l'entrée brute de l'utilisateur avant qu'elle ne quitte l'appareil.",
      "l2": "<strong>L2 — Sanitizers réseau</strong> : chaque requête supprime les en-têtes <code>Authorization</code> + <code>Cookie</code> ; les corps sont supprimés sur <code>/auth/login</code>, <code>/auth/register</code>, <code>/auth/password-reset</code>, <code>/auth/2fa</code> ; les corps de réponse sont supprimés sur les endpoints émettant des tokens (<code>/auth/login</code>, <code>/auth/refresh</code>, <code>/auth/2fa</code>).",
      "l3": "<strong>L3 — Opt-in DOM / JSX</strong> : responsabilité de l'équipe app — taguer explicitement les champs PII. <code>data-private=\"redact\"</code> sur web ; <code>&lt;LRAllow&gt;</code> enveloppant le contenu non-PII sur mobile (inverse : tout ce qui n'est pas enveloppé reste masqué).",
      "l4": "<strong>L4 — Politique d'identification</strong> : seuls <code>id + role + locale</code> sont envoyés via <code>LogRocket.identify()</code>. <strong>Jamais</strong> email, téléphone, NIF, adresse. Imposé via la signature TypeScript du wrapper.",
      "other_title": "Autres défauts pertinents pour la confidentialité",
      "other": {
        "ip": "<code>shouldCaptureIP: false</code> (web) / <code>enableIPCapture: false</code> (mobile) — ne jamais géolocaliser les utilisateurs.",
        "console": "<code>console.isEnabled = { warn: true, error: true, log: false }</code> — supprimer les logs développeur qui peuvent porter du contexte sensible.",
        "release": "<code>release: NEXT_PUBLIC_BUILD_VERSION</code> — attribution de session par build pour la chasse aux régressions."
      }
    },
    "wiring": {
      "web_title": "Web (<code>packages/web/</code>)",
      "web": {
        "wrapper": "<code>src/core/observability/logrocket.ts</code> — wrapper SDK (init, identify, track, capture, bridge sentry).",
        "provider": "<code>src/components/observability/LogRocketProvider.tsx</code> — composant client monté dans <code>Providers.tsx</code>.",
        "storage": "<code>src/core/auth/storage.ts</code> — <code>identifyLogRocket</code> branché dans <code>setAuthData/clearAuthData</code>.",
        "env": "<code>.env.example</code> — <code>NEXT_PUBLIC_LOGROCKET_APP_ID</code>, <code>NEXT_PUBLIC_BUILD_VERSION</code>.",
        "docker": "<code>Dockerfile</code> — ligne <code>ARG NEXT_PUBLIC_LOGROCKET_APP_ID</code> + <code>ENV</code>.",
        "gha": "<code>.github/workflows/deploy-frontend-staging.yml</code> — passe <code>_NEXT_PUBLIC_LOGROCKET_APP_ID=${{ secrets.LOGROCKET_APP_ID }}</code> à Cloud Build."
      },
      "mobile_title": "Mobile (<code>packages/mobile/</code>)",
      "mobile": {
        "wrapper": "<code>src/core/observability/logrocket.ts</code> — wrapper LogRocket RN.",
        "sentry": "<code>src/core/observability/sentry.ts</code> — wrapper Sentry RN compagnon.",
        "layout": "<code>src/app/_layout.tsx</code> — <code>initSentry()</code> + <code>initLogRocket()</code> dans <code>&lt;DeferredEffects&gt;</code>.",
        "auth": "<code>src/core/auth/auth-provider.tsx</code> — <code>setSentryUser</code> + <code>identifyLogRocket</code> co-localisés.",
        "appjson": "<code>app.json</code> — plugin <code>expo-build-properties</code> : <code>minSdkVersion: 25</code> + <code>extraMavenRepos</code> (informatif en mode non-CNG).",
        "gradle": "<code>android/build.gradle</code> — <code>ext.minSdkVersion = 25</code> + entrée Maven repo (canonique en mode non-CNG — natifs commités).",
        "eas": "<code>eas.json</code> — <code>EXPO_PUBLIC_LOGROCKET_APP_ID</code> dans les blocs env <code>preview</code> + <code>production</code>.",
        "easignore": "<code>.easignore</code> — surcharge <code>.gitignore</code> pour que <code>/android</code> soit envoyé à EAS (sans : <code>ENOENT gradlew</code> à la phase FIX_GRADLEW)."
      },
      "insp_title": "Inspector (<code>packages/inspector/</code>)",
      "insp_body": "Mêmes fichiers que mobile. Pas encore de Sentry RN — <code>bridgeLogRocketToSentry()</code> est un stub no-op en attente de l'intégration Sentry inspector."
    },
    "secrets": {
      "intro": "Source de vérité : <strong>Google Cloud Secret Manager</strong> (projet <code>taxasge-dev</code>). Le secret <code>logrocket-app-id</code> est mirroré vers les secrets de dépôt GitHub et les variables d'env EAS, stocké en <strong>plaintext</strong> délibérément — l'App ID est baké dans le bundle client et visible dans les requêtes réseau DevTools de toute façon. Le mirroring conserve un point de rotation unique.",
      "web_diagram": "Flux du secret (web)",
      "web_step1": "▼ mirroré manuellement une fois",
      "gh_secrets": "Secrets de dépôt GitHub",
      "docker": "Stage Docker BUILDER (bake Next.js)",
      "docker_sub": "NEXT_PUBLIC_* embarqué dans le bundle client",
      "browser": "Navigateur de l'utilisateur final",
      "browser_sub": "Init SDK au chargement de la page",
      "mobile_diagram": "Flux du secret (Mobile / Inspector via EAS)",
      "eas_env": "Env EAS Cloud (preview + production)",
      "eas_worker": "Worker EAS Build (bake Expo CLI)",
      "eas_worker_sub": "EXPO_PUBLIC_* embarqué dans le bundle JS",
      "artifact": "Artefact APK / IPA / AAB",
      "artifact_sub": "Distribué via Play / App Store / direct",
      "full_topology": "Topologie complète des secrets + migration multi-cloud (AWS / Azure / VPS) : voir <code>.claude/plans/OBSERVABILITY_STACK.md §2 / §5</code>."
    },
    "flow1": {
      "title": "Flux 1 — Un utilisateur signale un bug (« L'app a planté quand j'ai cliqué sur soumettre »)",
      "s1": "Ouvrir le tableau de bord LogRocket → <strong>Session Replay</strong>.",
      "s2": "Filtrer par <code>user_id</code> (la valeur envoyée via <code>LogRocket.identify()</code> — <strong>pas l'email</strong>, par conception, l'email étant PII). Si tu n'as que l'email, retrouve le user_id dans l'UI admin du backend d'abord.",
      "s3": "Cliquer sur la session la plus récente dans la liste de résultats.",
      "s4": "La vidéo de rejeu montre le parcours exact : clics, scrolls, le formulaire rempli, le moment du plantage.",
      "s5": "Le panneau de droite reflète une vue DevTools, alignée temporellement avec la vidéo — erreurs console, requêtes réseau, état redux/zustand.",
      "s6": "Cliquer sur la requête en échec dans le panneau réseau → voir corps de requête + réponse → diagnostiquer la cause sans jamais reproduire le bug.",
      "note": "<strong>Pourquoi pas Sentry d'abord</strong> : Sentry ne fire que si le bug lève une véritable exception. Les bugs UX (UI gelée, mauvaise navigation, formulaire confus) ne laissent aucune trace Sentry. LogRocket capture tout cela."
    },
    "flow2": {
      "title": "Flux 2 — Un pic d'erreurs en production",
      "intro": "Alerte Sentry : « TypeError: Cannot read property 'name' of undefined — 12 occurrences en 5 minutes ».",
      "s1": "Sentry <strong>Issues</strong> → cliquer sur l'alerte → voir stack trace + fréquence dans le temps + quelle release l'a introduite.",
      "s2": "Ouvrir une des sessions affectées dans LogRocket via <code>event.extra.logrocketURL</code> (le lien du bridge).",
      "s3": "Le rejeu LogRocket montre la séquence : l'utilisateur a navigué vers <code>/services</code>, cliqué sur recherche, tapé « passport », cliqué sur un résultat. Le panneau réseau révèle que <code>GET /api/services/12345</code> a retourné <code>null</code> au lieu de l'objet attendu.",
      "s4": "Tu sais maintenant : régression backend, pas un bug frontend.",
      "s5": "Rollback la release backend OU écrire un null-check défensif côté frontend."
    },
    "flow3": {
      "title": "Flux 3 — Optimiser un drop-off d'entonnoir",
      "intro": "« Pourquoi 80 % des utilisateurs abandonnent à l'étape 3 du wizard ? »",
      "s1": "Trouver un événement custom déjà wiré via <code>trackLogRocket()</code> — par ex. <code>wizard_step_completed</code> avec <code>{ step: number }</code>.",
      "s2": "LogRocket <strong>Dashboards</strong> → créer un entonnoir : <code>wizard_step_completed</code> (step:1) → step:2 → step:3 → <code>wizard_submitted</code>.",
      "s3": "L'entonnoir montre : 100 % → 95 % → 85 % → <strong>15 %</strong>. Chute massive à l'étape 3.",
      "s4": "Filtrer les sessions : celles qui ont atteint step:3 mais jamais <code>wizard_submitted</code>. Échantillonner 10 rejeux.",
      "s5": "Tu observes un pattern : 6 des 10 utilisateurs fixent le champ « NIF » > 30 s, puis abandonnent. L'étiquette est trop technique.",
      "s6": "Livrer une étiquette plus claire + une bulle d'aide. Re-mesurer l'entonnoir une semaine plus tard.",
      "note": "<strong>Pourquoi pas Sentry</strong> : rien n'a planté. Aucune exception. C'est purement un diagnostic UX."
    },
    "tour": {
      "intro": "L'UI LogRocket à <code>app.logrocket.com/0eqns2/facil</code> expose 5 sections principales :",
      "col_section": "Section", "col_purpose": "Rôle", "col_when": "Quand l'utiliser",
      "row": {
        "replay": { "name": "<strong>Session Replay</strong>", "purpose": "Rejeux par visite utilisateur avec timeline console + réseau", "when": "Plainte citoyen, bug UX, plantage intermittent" },
        "issues": { "name": "<strong>Issues</strong>", "purpose": "Erreurs JS auto-détectées, similaires à Sentry mais avec une session attachée", "when": "Triage des erreurs non alertées par Sentry" },
        "dashboards": { "name": "<strong>Dashboards</strong>", "purpose": "Agrégations d'événements custom (compteurs, entonnoirs, taux de conversion)", "when": "Drop-off d'entonnoir, comparaison A/B" },
        "surveys": { "name": "<strong>Surveys / Feedback</strong>", "purpose": "Sondages NPS + widgets de feedback in-app (non utilisés aujourd'hui)", "when": "Recherche UX, sentiment post-lancement" },
        "settings": { "name": "<strong>Settings → Integrations</strong>", "purpose": "Hooks Slack / Jira / Linear (free tier limité)", "when": "Pousser les issues critiques au chat de l'équipe" }
      }
    },
    "bridge": {
      "intro": "Activé le 2026-04-30 une fois <code>@sentry/nextjs</code> wiré (côté web). Le bridge attache l'URL de session LogRocket à chaque événement Sentry pour qu'un Issue dans Sentry permette d'accéder en un clic au rejeu correspondant — éliminant le coût de context-switch entre les deux outils.",
      "ordering": "<strong>Pourquoi cet ordre</strong> : <code>getSessionURL()</code> fire <em>après</em> le premier flush réseau (~2-5 s dans la session). Les événements Sentry peuvent être capturés immédiatement au chargement de la page. Initialiser LogRocket en premier et enregistrer le bridge à l'intérieur de son <code>init()</code> signifie : au moment où le bridge se connecte, Sentry écoute déjà ; le site d'appel du bridge vit à côté de l'init LogRocket dont il dépend ; pas de dépendance circulaire.",
      "mobile": "<strong>Bridge mobile</strong> : stub aujourd'hui. S'active le jour où les événements Sentry RN sur mobile/inspector doivent porter une URL de session LogRocket. Même édition de 4 lignes que le web une fois les deux SDKs confirmés en live."
    },
    "limits": {
      "title": "Limites connues (honnêtes)",
      "tier": "<strong>Free tier 1K sessions / mois</strong> — partagé entre web + mobile + inspector. À l'échelle actuelle (~20 utilisateurs staging) marge confortable ; le passage en production nécessite le plan Team.",
      "sourcemap": "<strong>Téléversement de sourcemaps non wiré</strong> — les stack traces LogRocket sont minifiées. Plan : réutiliser le téléversement de sourcemaps Sentry CLI (<code>@sentry/cli</code>) au build time. <em>Suivi : OBSERVABILITY_STACK.md §8</em>.",
      "redact": "<strong>Caviardage par défaut sur mobile</strong> — rejeux informatifs uniquement sur les écrans audités et enveloppés avec <code>&lt;LRAllow&gt;</code>. Cadence d'audit : à chaque livraison de feature.",
      "onprem": "<strong>Pas de free tier on-prem</strong> — les déploiements air-gapped doivent désactiver LogRocket entièrement."
    },
    "traps": {
      "title": "Pièges connus",
      "col_symptom": "Symptôme", "col_cause": "Cause racine", "col_fix": "Fix",
      "row": {
        "minsdk_cause": "LogRocket RN nécessite Android API 25+",
        "minsdk_fix": "Bumper <code>ext.minSdkVersion</code> à 25 dans <code>android/build.gradle</code> + <code>app.json</code> (cf. <code>OBSERVABILITY_STACK.md §7.6</code>)",
        "gradlew_cause": "<code>/android</code> dans <code>.gitignore</code> retire les natifs de l'upload EAS",
        "gradlew_fix": "Ajouter <code>.easignore</code> qui surcharge <code>.gitignore</code> pour les uploads EAS (cf. <code>OBSERVABILITY_STACK.md §7.2</code>)",
        "bundle_symptom": "Le frontend manque de <code>LOGROCKET_APP_ID</code> dans le bundle",
        "bundle_cause": "<code>--build-arg</code> non passé au build Docker",
        "bundle_fix": "Le YAML Cloud Build doit passer <code>_NEXT_PUBLIC_LOGROCKET_APP_ID=${{ secrets.LOGROCKET_APP_ID }}</code> en substitution (cf. <code>OBSERVABILITY_STACK.md §7.5</code>)",
        "anon_symptom": "Sessions mobile toutes anonymes",
        "anon_cause": "<code>identifyLogRocket()</code> non appelé dans l'auth provider",
        "anon_fix": "Wirer dans <code>auth-provider.tsx</code> aux côtés de <code>setSentryUser</code>",
        "blank_symptom": "Les rejeux ne montrent que des champs vides sur mobile",
        "blank_cause": "Défaut <code>textSanitizer: 'excluded'</code> + pas d'enveloppage <code>&lt;LRAllow&gt;</code>",
        "blank_fix": "Auditer les écrans ; envelopper le texte non-PII avec <code>&lt;LRAllow&gt;</code>"
      }
    },
    "roadmap": {
      "title": "Roadmap",
      "s1": "<strong>Sentry RN sur inspector</strong> — activer le corps de <code>bridgeLogRocketToSentry()</code> dans le wrapper inspector.",
      "s2": "<strong>Téléversement de sourcemaps</strong> — via réutilisation de Sentry CLI en CI pour web et mobile.",
      "s3": "<strong>Cron d'auto-rotation</strong> pour <code>logrocket-app-id</code> (cadence faible — public de toute façon).",
      "s4": "<strong>Templates d'entonnoir</strong> — entonnoirs préconstruits pour les 4 parcours utilisateur critiques (signup, paiement, wizard, téléversement de document) avec seuils de conversion cibles + alertes."
    },
    "agent": {
      "title": "Agent réutilisable pour d'autres projets",
      "body": "Distillé dans <code>infra/observability/LOGROCKET_OBSERVABILITY_AGENT.md</code> — un agent reproducible en 7 phases invocable via la slash-command <code>/logrocket-observability</code>. Fonctionne sur tout projet web (Next.js / Vite / CRA), mobile (Expo / bare RN) ou hybride. Applique 8 garde-fous actifs (caviardage PII, gating, politique d'identification, topologie des secrets, drift de sourcemap, etc.)."
    },
    "related": {
      "title": "Documentation associée",
      "stack": "<code>.claude/plans/OBSERVABILITY_STACK.md</code> — référence complète (~750 lignes) : topologie des secrets, migration multi-cloud, catalogue des pièges.",
      "quickstart": "<code>.claude/plans/OBSERVABILITY_QUICKSTART.md</code> — tutoriel pas-à-pas pour les nouveaux contributeurs.",
      "dashboards": "<code>.claude/plans/OBSERVABILITY_DASHBOARDS_AND_SENTRY_BACKEND.md</code> — doc compagnon côté Sentry (8 dashboards, règles d'alerte).",
      "grafana": "<a href=\"grafana-dashboards.html\">Tableaux de bord Grafana</a> — la couche analytique (KPIs orientés décision), complémentaire à LogRocket (rejeu forensique)."
    }
  },

  "aio": {
    "html_title": "Observabilité IA - Documentation Facil",
    "title": "Observabilité IA — suivi coût & latence Gemini",
    "description": "Télémétrie par appel sur chaque requête Gemini / Vertex AI émise par le backend Facil. 18 points d'appel instrumentés sur 16 fonctionnalités (RAG chatbot, OCR, classification, enrichissement, routage, briefing, etc.). Sorties : 1 dashboard Grafana avec 12 panels + 3 règles d'alerte + traçabilité persistée en BD (table <code>ai_call_metrics</code>, mig 325). Privacy by design : aucun contenu brut de prompt stocké, uniquement des hashes SHA-256 tronqués.",
    "toc": {
      "why": "1. Pourquoi & analyse de gap",
      "stack": "2. Stack & double-écriture",
      "schema": "3. Schéma BD (mig 325)",
      "wrapper": "4. API Wrapper (traced_generate_sync)",
      "features": "5. Labels feature (16 mappings)",
      "dashboard": "6. Dashboard (12 panels)",
      "alerts": "7. Alertes (3 règles + runbooks)",
      "privacy": "8. Confidentialité & sécurité",
      "cohabitation": "9. Cohabitation avec VertexAIManager",
      "phaseb": "10. Phase B — APM Backend (instrumentation complète)"
    },
    "why": {
      "intro": "Avant ce travail, le backend faisait <strong>~17 points d'appel Gemini distincts</strong> avec <strong>zéro observabilité</strong>. On ne pouvait répondre à 4 questions opérationnelles critiques :",
      "q1": "<strong>Coût</strong> : combien dépense-t-on en tokens par jour, par modèle, par feature ?",
      "q2": "<strong>Latence</strong> : quel est le p95/p99 par type d'appel (RAG vs OCR vs classification) ?",
      "q3": "<strong>Fiabilité</strong> : quel est le failure rate, et de quel type (rate-limit / timeout / JSON parse / contenu bloqué) ?",
      "q4": "<strong>Optimisation</strong> : quels prompts coûtent le plus ? Y a-t-il des quick wins ?"
    },
    "stack": {
      "intro": "Chaque appel passe par un wrapper unique <code>traced_generate_sync()</code> qui émet <strong>à la fois</strong> un span OTEL (vers Grafana Tempo pour le drill-down trace) <strong>et</strong> une ligne dans la table BD <code>ai_call_metrics</code>.",
      "step1": "Point d'appel", "step1_sub": "ex: chatbot RAG",
      "step2": "traced_generate_sync", "step2_sub": "app/core/ai_telemetry.py",
      "step3": "model.generate_content()", "step3_sub": "Vertex AI sync via run_in_executor",
      "fanA": "A. Span OTEL", "fanA_sub": "→ Grafana Tempo (rétention 14j)",
      "fanB": "B. asyncio.create_task INSERT", "fanB_sub": "→ ai_call_metrics (BD persistante)",
      "why_double": "Tempo Free tier a une rétention de 14 jours — insuffisant pour rapports de coût mensuels. La BD est la <strong>source de vérité long-terme</strong> ; Tempo fait du drill-down debug. Les deux écritures sont <strong>fire-and-forget</strong> via <code>asyncio.create_task</code> — ne bloquent jamais l'appel utilisateur."
    },
    "schema": {
      "intro": "Table <code>ai_call_metrics</code> (20 colonnes, 8 indexes, 9 CHECK constraints) :",
      "col_name": "Colonne", "col_type": "Type", "col_purpose": "Rôle",
      "row_id": "Clé primaire + temps d'ingestion",
      "row_trace": "Corrélation OTEL avec Tempo",
      "row_model": "gemini | vertex_embedding × chat | embeddings | completion",
      "row_feature": "Contexte Facil (chatbot_rag / ocr / etc.)",
      "row_tokens": "Compteurs d'usage; total_tokens auto-calculé",
      "row_cost": "Coût FCFA estimé (input × pricing.input + output × pricing.output)",
      "row_status": "ms end-start + enum 6 statuts (success / error / rate_limited / timeout / content_blocked / json_parse_error)",
      "row_hash": "SHA-256 tronqué — identifiant privacy-safe (pas de mapping inverse)",
      "views": "Deux vues d'agrégation alimentent les panels : <code>v_ai_cost_daily</code> (90 jours) et <code>v_ai_cost_hourly</code> (7 jours). Les deux grantées à <code>looker_readonly</code>."
    },
    "wrapper": {
      "intro": "Le module <code>app/core/ai_telemetry.py</code> expose 4 wrappers :",
      "col_when": "Quand utiliser", "col_signature": "Signature",
      "row_sync": "<code>model.generate_content()</code> sync + <code>run_in_executor</code>. <strong>Pattern le plus courant dans ce codebase.</strong>",
      "row_async": "<code>generate_content_async()</code> async si le SDK le supporte",
      "row_emb_sync": "<code>model.get_embeddings()</code> sync",
      "row_emb_async": "Embeddings async",
      "principles": "Principes : (1) <strong>import OTEL soft</strong> — module charge sans opentelemetry-sdk; les spans deviennent no-op; persist BD continue. (2) <strong>persist BD ne bloque jamais</strong> — <code>asyncio.create_task</code> + try/except. (3) <strong>privacy by construction</strong> — contenu prompt jamais stocké, uniquement le hash 16-char SHA-256."
    },
    "features": {
      "intro": "Chaque point d'appel est tagué avec une string <code>feature</code> utilisée pour la segmentation coût/latence dans le dashboard :",
      "col_label": "Feature", "col_module": "Module", "col_volume": "Volume",
      "vol_high": "Élevé", "vol_vhigh": "Très élevé", "vol_med": "Moyen", "vol_low": "Faible (cron)"
    },
    "dashboard": {
      "intro": "UID : <code>facil-ai-observability</code>. <strong>12 panels</strong> répartis en 5 sections rangées. Listé à <code>/admin/dashboards</code> sous catégorie « security » (rls_mode <code>admin_only</code>).",
      "s1": "<strong>💰 Coût</strong> : aujourd'hui XAF, MTD XAF, total appels jour, tokens in/out jour (4 stats)",
      "s2": "<strong>📈 Tendances</strong> : coût empilé par feature/jour, p95 latence par feature/heure (2 timeseries)",
      "s3": "<strong>🚨 Erreurs</strong> : taux d'erreur 24h, erreurs par type bar chart, succès-vs-erreur par heure (3 panels)",
      "s4": "<strong>🔝 Top coûts</strong> : top features par coût (7j), top prompt_hashes par coût (7j) (2 tables)",
      "s5": "<strong>🤖 Breakdown modèles</strong> (collapsé) : donut part de coût + table par-modèle (2 panels)",
      "screenshot_caption": "Capture live : 5 appels aujourd'hui (3 chatbot_rag + 1 embeddings_rag + 1 intent_classification), 22,4K tokens d'entrée, 0% taux d'erreur. Le coût affiche « XAF0 » car volume × pricing arrondit en-dessous de 1 XAF — voir note Phase B ci-dessous pour corriger la troncature de model_name « publishers/google/models/g… »."
    },
    "alerts": {
      "col_threshold": "Seuil", "col_severity": "Sévérité", "col_for": "Durée",
      "runbook_cost": "Runbook — Pic de coût",
      "runbook_error": "Runbook — Pic de taux d'erreur",
      "runbook_latency": "Runbook — Dégradation p95 latence",
      "cost_body": "1. Ouvrir le dashboard, drill dans « Top features par coût (7j) ». 2. Identifier la feature dominante. 3. Vérifier « Top prompt hashes par coût (7j) » pour des prompts coûteux dupliqués (candidat caching). 4. Si routing/briefing/enrichment cron est en cause, throttler. 5. Si chatbot_rag explose, suspecter un bot ou un agent qui boucle — vérifier audit_logs.",
      "error_body": "1. Ouvrir « Errors by status type (7j) ». 2. <strong>rate_limited</strong> → quota Vertex AI atteint, augmenter via Google Cloud Console. 3. <strong>timeout</strong> → vérifier le statut Gemini ; envisager un asyncio.wait_for plus long. 4. <strong>content_blocked</strong> → filtre SAFETY déclenché, revoir le template prompt. 5. <strong>json_parse_error</strong> → règle mémoire #21 : assurer <code>response_mime_type=\"application/json\"</code> dans GenerationConfig.",
      "latency_body": "1. Vérifier le panel « p95 latency par feature ». 2. Si <code>ocr</code> pique, suspecter de gros PDFs. 3. Si <code>chatbot_rag</code> pique, vérifier la latence de la recherche pgvector. 4. Si toutes les features piquent, suspecter une dégradation région Vertex AI."
    },
    "privacy": {
      "no_content": "<strong>Aucun contenu brut de prompt</strong> stocké. Uniquement le hash SHA-256 tronqué à 16 chars. Pas de table de mapping inverse. RGPD-safe by design.",
      "token_hash": "<strong>Format prompt_hash</strong> enforced par CHECK BD <code>chk_aim_prompt_hash_format</code> : <code>^[a-f0-9]{16}$</code>",
      "user_fk": "<strong>user_id FK ON DELETE SET NULL</strong> — la suppression d'un user efface le lien sans supprimer la ligne d'audit",
      "token_secret": "<strong>Token OTLP via Secret Manager</strong> (<code>grafana-otlp-token</code>) — CAP token scopé à <code>traces:write</code>",
      "iam": "<strong>RLS</strong> : dashboard <code>rls_mode='admin_only'</code> — les non-admins ne voient pas les données coût même via <code>/api/v1/dashboards/reports-config</code>"
    },
    "cohabitation": {
      "intro": "Le singleton <code>app/modules/shared/services/vertex_ai_manager.py</code> existant est INTENTIONNELLEMENT préservé. Les deux systèmes sont complémentaires, pas redondants :",
      "col_concern": "Préoccupation",
      "row_circuit": "Circuit breaker (10 fail/60s cooldown)",
      "row_realtime": "Lecture stats in-memory sub-μs",
      "row_persist": "Persistance BD (cross-worker, survit restart)",
      "row_cost": "Coût en XAF",
      "row_tags": "Tags par feature/modèle/user/trace",
      "row_status": "Enum statut (6 valeurs)",
      "pattern": "Pattern d'appel : <code>await traced_generate_sync(...)</code> suivi de <code>VertexAIManager().track_usage(response, \"X\")</code> + <code>track_success()</code>. Les deux coexistent ; aucun ne bloque l'autre."
    },
    "phaseb": {
      "intro": "La phase A instrumentait uniquement les 18 points d'appel Gemini. La phase B (2026-05-05) étend la couverture OTEL à <strong>tout le backend FastAPI</strong> via auto-instrumentation — chaque requête HTTP, chaque query <code>asyncpg</code>, chaque appel <code>httpx</code> externe, chaque op Redis devient un span. Cela débloque la feature <strong>Application Observability</strong> de Grafana Cloud (RED metrics + service map auto-dérivés des spans Tempo).",
      "what": "Ce qui est instrumenté",
      "col_layer": "Couche", "col_pkg": "Package OTEL", "col_creates": "Spans créés",
      "row_fastapi": "Span parent par requête HTTP (méthode, path, status, durée). Exclut /healthz, /metrics, /static/* pour garder le volume raisonnable.",
      "row_asyncpg": "Span par query (statement, paramètres masqués, durée). Identifie les queries lentes et la lock contention.",
      "row_httpx": "Span par appel sortant vers Vertex AI / BANGE / Firebase / Grafana API. URL + status + latence.",
      "row_redis": "Span par op cache (GET, SET, DEL, etc.). Identifie cold cache ou hot keys.",
      "sampling": "Politique de sampling : 100 % (zéro sampling)",
      "sampling_body": "Décision utilisateur 2026-05-05 : <strong>pas de sampling</strong> — on instrumente tout. Trade-off : visibilité complète sur 100+ traces agents concurrents et debug bundle workflow, au prix d'une ingestion Tempo plus élevée (50 Go/mois free tier). Si le quota sature, descendre à 25 % de head-sampling sur HTTP via <code>TraceIdRatioBased</code> dans <code>main.py</code>.",
      "activate": "Activer Application Observability dans Grafana",
      "activate_body": "Après que le prochain déploiement ait émis les premiers spans instrumentés (~5 min) :",
      "act1": "Ouvrir <a href=\"https://kouemousah.grafana.net/a/grafana-app-observability-app/landing\" target=\"_blank\" rel=\"noopener\">grafana-app-observability-app/landing</a>",
      "act2": "Cliquer <strong>Activate Application Observability</strong>",
      "act3": "Sélectionner la source de données Tempo (par défaut : <code>grafanacloud-kouemousah-traces</code>)",
      "act4": "Attendre 5-10 min que le pipeline d'auto-dérivation démarre. La service map apparaît sous Observability &gt; Application.",
      "expected": "Service map attendue",
      "benefits": "Bénéfices concrets",
      "b1": "<strong>Debug bundle workflow</strong> — tracer un seul <code>service_request_id</code> à travers web → backend → 5 locks d'entités → BANGE → email → coffre, end-to-end en un clic",
      "b2": "<strong>Lock contention BD</strong> — heatmap des queries asyncpg lentes fait émerger les deadlocks avant que les users ne le remarquent",
      "b3": "<strong>Régression de déploiement</strong> — p95 latence par endpoint pré/post deploy ; décision de revert en 30s",
      "b4": "<strong>Détection d'anomalies auto</strong> — le Knowledge Graph Grafana corrèle pic + deploy + query lente sans creuser manuellement",
      "cap_services": "<strong>Figure 1 — Liste des services</strong> (<em>Observability → Application → Services</em>).<br><strong>Ce que c'est :</strong> le catalogue de tous les services auto-découverts par Grafana à partir des spans OTEL émis par l'instrumentation Phase B. Aucun enregistrement manuel — un service apparaît dès qu'il émet son premier span.<br><strong>Ce qu'on lit ici :</strong> 3 services trouvés — <code>facil-backend</code> (le process FastAPI), <code>postgres</code> (chaque requête asyncpg devient un span), <code>redis</code> (chaque get/set du cache). Chaque ligne affiche la <em>Duration p95</em> (95% des requêtes servies sous cette latence), les <em>Errors</em> (% échec), et le <em>Rate</em> (req/sec).<br><strong>Ce que les chiffres signifient :</strong> <code>facil-backend</code> p95 = <strong>487,5 ms</strong> = latence API globale au pire 5%. <code>postgres</code> p95 = <strong>725 ms</strong> à rate 0,12 r/s = très peu de queries, certaines lentes (cron MV refresh). <code>redis</code> p95 = <strong>2,35 s</strong> = élevé mais sur opérations rares (warmup au boot). 0% erreurs partout = stack propre.<br><strong>Comment l'utiliser :</strong> point d'entrée de toute session de debug. Si un utilisateur signale une lenteur, on commence ici, on trie par p95, et on drill dans le service le plus lent.",
      "cap_overview": "<strong>Figure 2 — Vue d'ensemble facil-backend</strong>.<br><strong>Ce que c'est :</strong> la vue RED Method (Rate / Errors / Duration) d'un service précis, auto-dérivée des spans. Le dashboard standard SRE pour n'importe quel service backend.<br><strong>Ce qu'on lit ici :</strong> <em>Ligne du haut</em> = les 3 metrics RED sur la fenêtre temporelle. Sous-panel <em>Operations</em> = breakdown par route HTTP (ici <code>GET /health</code> domine car polledpar le health-check Cloud Run). Sous-panel <em>Outbound &amp; databases</em> = les dépendances downstream que le service appelle.<br><strong>Ce que les chiffres signifient :</strong> p95 = <strong>487,5 ms</strong> sur <code>GET /health</code> est inattendu — health-check devrait être 5-10 ms. Cause : au boot, Cloud Run lance des probes au démarrage à froid pendant que le pool asyncpg s'initialise. Solution : ajouter un startup probe distinct du liveness probe. Redis p95 <strong>2,35 s</strong> + Postgres p95 <strong>487 ms</strong> visibles dans <em>Outbound</em> = appels bloquants dans le request path ; à investiguer s'ils sont dans le hot path.<br><strong>Comment l'utiliser :</strong> après la Figure 1, c'est le 2ème écran. Les 3 metrics RED disent <em>où</em> vient la lenteur (route ou dépendance).",
      "cap_servicemap": "<strong>Figure 3 — Service map</strong>.<br><strong>Ce que c'est :</strong> le graphe d'appels du service auto-construit depuis les spans des instrumenters (<code>asyncpg</code>, <code>redis</code>, <code>httpx</code>). Chaque nœud = un service, chaque arête = N requêtes/sec avec latence moyenne.<br><strong>Ce qu'on lit ici :</strong> <code>facil-backend</code> appelle 2 dépendances — <code>postgres</code> (211,88 ms/req @ 0,92 r/s = le cœur du trafic métier, tous les endpoints lisent/écrivent en BD) et <code>redis</code> (129,76 ms/req @ 0,03 r/s = bien plus rare, surtout des invalidations de cache). <em>Pourquoi Vertex AI / Firebase / BANGE n'apparaissent pas ?</em> Ce sont des appels <code>httpx</code> qui ne se déclenchent que quand un utilisateur lance un chatbot, signe un document ou paie — fréquence basse, pas de trafic durant la fenêtre capturée.<br><strong>Ce que les chiffres signifient :</strong> 211,88 ms <em>par requête Postgres</em> en moyenne, c'est élevé (cible &lt; 50 ms). Corrobore le constat de la Figure 2. <em>r/sec</em> = throughput. <em>Avg / p50 / p95</em> sur chaque arête = même méthode RED appliquée à la relation entre 2 services.<br><strong>Comment l'utiliser :</strong> cartographier l'architecture en 5 secondes. Pour détecter un edge critique manquant (ex : « pourquoi BANGE n'apparaît pas alors qu'il y a eu 100 paiements ? »), comparer au schéma d'architecture prod. Pour détecter de la contention, regarder les arêtes les plus épaisses (rate élevé).",
      "cap_traces": "<strong>Figure 4 — Onglet Traces</strong> (filtre TraceQL <code>resource.service.name=\"facil-backend\"</code>).<br><strong>Ce que c'est :</strong> la liste des <em>distributed traces</em> récentes (une trace = une requête bout-en-bout traversant N spans). Une trace = une requête HTTP suivie à travers tous les hops internes.<br><strong>Ce qu'on lit ici :</strong> 20 traces les plus récentes dans la fenêtre capturée. Chaque ligne = <em>Trace ID</em> (cliquable), <em>Trace name</em> (le span racine = l'opération qui a tout déclenché), <em>Span count</em> (combien de hops internes), <em>Duration</em> (total end-to-end). Principalement des queries <code>SELECT</code> (101–906 ms), un <code>INSERT</code> (981 ms), un <code>REFRESH MATERIALIZED VIEW</code> (599 ms — le cron <code>request-telemetry-cleanup</code> rafraîchissant la MV en Phase C.2).<br><strong>Ce que les chiffres signifient :</strong> <em>Span count</em> &gt; 5 = une requête qui a déclenché plusieurs BD calls (signe potentiel de N+1 query). <em>Duration</em> en haut (981 ms INSERT) révèle souvent une instruction SQL lente. Le REFRESH ponctuel est normal — cron backend, tourne toutes les 6h.<br><strong>Comment l'utiliser :</strong> cliquer sur un trace_id ouvre la vue flame graph = breakdown complet route FastAPI → query asyncpg → résultat. Indispensable pour diagnostiquer les bottlenecks complexes (ex : un workflow bundle 5-entités prenant 4 s — la trace montre exactement quelle entité a locké la première)."
    }
  },

  "gr": {
    "html_title": "Tableaux de bord Grafana - Documentation Facil",
    "title": "Tableaux de bord Grafana — Ingénierie analytique",
    "description": "10 tableaux de bord Grafana production-grade construits sur une architecture de données sémantique 4-couches, permettant aux décideurs gouvernementaux (trésorerie, agents ministériels, superviseurs, inspecteurs) de répondre aux questions métier en moins de 30 secondes. Cette page documente le <em>pourquoi</em>, le <em>comment</em> et les <em>décisions</em> pilotées par chaque tableau de bord.",
    "toc": {
      "why": "1. Pourquoi & contexte métier",
      "ae": "2. Ingénierie analytique — la couche sémantique",
      "personas": "3. Personas & carte des décisions",
      "dashboards": "4. Les 10 tableaux de bord",
      "patterns": "5. Patterns d'ingénierie",
      "stack": "6. Stack & provisioning",
      "admin": "7. Self-service admin (mig 323)",
      "limits": "8. Limites, lignage & roadmap"
    },
    "admin": {
      "intro": "La migration 323 (2026-05-05) rend le registre des tableaux de bord entièrement piloté par la BD. Les administrateurs avec la permission <code>dashboards.manage</code> peuvent ajouter, éditer, supprimer et importer en masse des tableaux de bord via l'UI web &mdash; <strong>sans modification de code, sans redéploiement</strong>. Sur les 10 dashboards Grafana actifs sur <code>kouemousah.grafana.net</code>, les 10 sont seedés automatiquement par la mig 323, plus 1 catalogue Looker (Catalogue de Services), pour un total de 11 lignes dans <code>dashboard_registrations</code>.",
      "where_title": "Où gérer les tableaux de bord",
      "where": {
        "list": "<code>/admin/dashboards</code> &mdash; landing publique, regroupé par catégorie (direction / finance / opérations / métier / produit / sécurité)",
        "config": "<code>/admin/dashboards/config</code> &mdash; CRUD admin : liste (11 lignes) + édition + désactivation + bouton import",
        "detail": "<code>/admin/dashboards/{slug}</code> &mdash; embed plein écran (mode kiosk) avec breadcrumb retour"
      },
      "add_title": "Ajouter un nouveau dashboard Grafana (3 clics)",
      "add": {
        "s1": "<strong>Pousser le JSON du dashboard</strong> vers <code>infra/grafana/dashboards/NN_nom.json</code> via l'agent <code>/grafana-dashboards</code> existant ou par provisionnement manuel. Note l'<code>uid</code> (ex : <code>facil-new-kpi</code>).",
        "s2": "<strong>Ouvrir la page admin</strong> <code>/admin/dashboards/config</code>. Cliquer sur le bouton <strong>« Importer depuis Grafana »</strong> (en haut à droite).",
        "s3": "<strong>La modal s'ouvre</strong> avec tous les dashboards du workspace. Les déjà importés sont filtrés. Cocher la/les ligne(s) voulue(s), éditer le slug + titres i18n + catégorie inline, puis cliquer <strong>« Importer »</strong>. La liste se rafraîchit automatiquement."
      },
      "add_hint": "Le slug devient le segment d'URL (<code>/admin/dashboards/{slug}</code>) et la clé d'audit log &mdash; une fois fixé, il est immuable. Garde-le minuscule, avec tirets, 3-40 caractères.",
      "where_get_title": "Où trouver l'UID et l'Organization ID Grafana",
      "where_get": {
        "uid": "<strong>UID du dashboard</strong> : dans Grafana, ouvrir le dashboard. L'URL est <code>https://&lt;workspace&gt;.grafana.net/d/&lt;UID&gt;/&lt;slug&gt;</code> &mdash; le segment <code>&lt;UID&gt;</code> est ce qu'il te faut (4&ndash;40 caractères alphanumériques + tirets/soulignés). Aussi visible dans <em>Paramètres du dashboard &rarr; JSON Model &rarr; <code>uid</code></em>.",
        "org": "<strong>Organization ID</strong> : <code>1</code> pour tout workspace Grafana Cloud single-org (le défaut, dont <code>kouemousah.grafana.net</code>). Visible dans toute URL avec <code>?orgId=1</code>, ou dans <em>Admin &rarr; Organisations</em>. Ne change que si tu utilises plusieurs orgs Grafana."
      },
      "config_title": "Configuration requise",
      "config_intro": "L'endpoint d'import Grafana appelle l'API HTTP Grafana côté serveur ; il requiert deux variables d'environnement dans Cloud Run / Secret Manager :",
      "col_var": "Variable", "col_value": "Valeur", "col_purpose": "Rôle",
      "row": {
        "base": "URL de base du workspace — utilisée pour construire l'URL iframe <em>et</em> l'appel API discover. Variable d'env standard (non sensible).",
        "token_v": "<strong>Liaison Secret Manager</strong> : <code>grafana-sa-token:latest</code> — bindée via <code>--set-secrets=</code> dans le workflow de déploiement, PAS une variable d'env standard.",
        "token_p": "Authentifie <code>/api/v1/dashboards/admin/grafana/discover</code> contre <code>/api/search</code> de Grafana. Le token n'apparaît jamais dans le descriptor du service Cloud Run ; la rotation = un seul <code>gcloud secrets versions add</code> sans modification du workflow."
      },
      "config_token_hint": "Pour créer le token : Grafana &rarr; <em>Administration &rarr; Service Accounts &rarr; Add new</em> &rarr; rôle <code>Viewer</code> (ou scope plus fin <code>dashboards:read</code>) &rarr; <em>Add token</em>. Puis provisionner dans GCP :",
      "csp_hint": "<strong>Exigence CSP frontend</strong> : le middleware Next.js émet un header <code>Content-Security-Policy</code> avec <code>frame-src</code>. Le domaine Grafana DOIT y être whitelisté sinon le navigateur bloque l'iframe avec <em>« Framing 'https://kouemousah.grafana.net/' violates the following Content Security Policy directive »</em>. La liste actuelle inclut <code>https://*.grafana.net</code> et <code>https://lookerstudio.google.com</code> &mdash; définie dans <code>packages/web/src/middleware.ts</code> et <code>packages/web/next.config.mjs</code>. Ajouter un nouveau provider d'embed nécessite de mettre à jour les deux.",
      "api_title": "Endpoints backend",
      "col_method": "Méthode", "col_path": "Chemin", "col_perm": "Permission", "col_desc": "Description",
      "api": {
        "list": "Listing public — l'admin voit les lignes admin_only, les autres non (RLS).",
        "adm_list": "Listing admin — toutes les lignes, actives et inactives.",
        "create": "Créer un nouveau dashboard depuis zéro (409 si slug en conflit).",
        "put": "Mettre à jour provider/UID/état actif.",
        "patch": "Mise à jour partielle des métadonnées i18n + présentation.",
        "delete": "Soft-delete (met is_active=false, préserve l'audit trail).",
        "discover": "Lister les dashboards du workspace via /api/search Grafana (cache 5 min).",
        "import": "Import en masse des dashboards sélectionnés (TX isolée par item)."
      },
      "security_title": "Sécurité & garde-fous",
      "security": {
        "rate": "<strong>Rate-limit 10 écritures/min/user</strong> sur POST/PUT/PATCH/DELETE/import.",
        "regex": "<strong>Regex 3 couches</strong> sur slug + UID Grafana + IDs Looker (Zod &rarr; Pydantic &rarr; CHECK BD).",
        "audit": "<strong>Audit log</strong> : chaque écriture insère une ligne dans <code>audit_logs</code> dans la même transaction BD (mémoire règle #24 : <code>json.dumps</code> pour JSONB).",
        "boot": "<strong>Boot non-destructif</strong> : la permission <code>dashboards.manage</code> est préservée au boot même si pas miroir dans <code>dashboards_permissions.py</code> (mémoire règle #37).",
        "rls": "<strong>Filtrage RLS</strong> : les dashboards <code>admin_only</code> (ex : <em>User Activity audit</em>) sont masqués des callers non-admin au niveau SQL, pas seulement de l'UI.",
        "token": "<strong>Le SA token ne touche jamais le navigateur</strong> : discover/import sont serveur uniquement ; le frontend ne voit jamais <code>GRAFANA_SA_TOKEN</code>."
      }
    },
    "why": {
      "problem_title": "Le problème",
      "problem_body": "Avant cette initiative, les décideurs des 20 entités gouvernementales de Facil opéraient sans vue analytique unifiée. Chaque ministère avait des rapports isolés, la réconciliation de trésorerie se faisait manuellement dans des tableurs, la performance des agents était évaluée de façon anecdotique et les inspecteurs n'avaient aucune analytique terrain. La plateforme générait <strong>3 342+ événements d'audit</strong>, traitait des paiements en XAF et affectait des demandes de service à travers <strong>5 villes</strong> — mais aucune de ces données n'était exploitable en temps réel.",
      "need_title": "Le besoin",
      "need": {
        "treasury": "<strong>La trésorerie</strong> a besoin d'un suivi quotidien des recettes par ministère, entité, méthode de paiement et site, avec le statut de réconciliation visible d'un coup d'œil.",
        "agents": "<strong>Les agents ministériels</strong> ont besoin de connaître leur charge, leur pression SLA et leurs obligations en attente.",
        "supervisors": "<strong>Les superviseurs</strong> ont besoin de comparer la performance entre équipes et de suivre l'adoption des modules OMS (One-Stop-Shop).",
        "inspectors": "<strong>Les inspecteurs</strong> ont besoin du suivi de l'activité terrain avec GPS, photos et compteurs de scellés.",
        "execs": "<strong>Les dirigeants</strong> ont besoin d'un Overview unique pour voir le pouls de la plateforme."
      },
      "choice_title": "Pourquoi Grafana (et Looker Studio en parallèle)",
      "choice_body": "Nous avons évalué trois options : une suite de tableaux de bord React custom, Looker Studio et Grafana Cloud. La décision a été d'exécuter <strong>Grafana et Looker Studio en parallèle</strong>, avec un toggle runtime dans <code>/admin/dashboards/config</code> piloté par la colonne <code>dashboard_provider_enum</code> de <code>dashboard_registrations</code>. Cette conception dual-provider permet de comparer A/B en production et d'éviter le vendor lock-in.",
      "col_criterion": "Critère", "col_custom": "React custom",
      "row": {
        "ttfd": "Time-to-first-dashboard", "ttfd_g": "< 1 jour", "ttfd_l": "~2 jours (UI seulement)", "ttfd_c": "2-3 semaines par dashboard",
        "dac": "Dashboards-as-code (versionnés en Git)", "dac_g": "JSON via API", "dac_l": "UI seulement, pas d'API pour le contenu", "dac_c": "React + manuel",
        "sql": "SQL-first (Postgres natif)", "sql_l": "JDBC, MV-aveugle par défaut",
        "embed": "Embed admin (iframe + auth)", "embed_g": "&#9989; <code>d-solo</code> + kiosk=tv", "embed_l": "&#9989; embed token",
        "cost": "Coût (10 dashboards, 100+ agents)", "cost_g": "Free tier suffisant", "cost_c": "~3 dev-mois",
        "refresh": "Auto-refresh + alerting", "refresh_g": "&#9989; natif", "refresh_l": "&#9888; limité", "refresh_c": "À construire"
      },
      "choice_summary": "Grafana l'a emporté sur le time-to-value et le dashboards-as-code. Looker Studio reste comme fallback / option pour les parties prenantes non-tech. Les deux consomment la même couche sémantique (Section 2).",
      "goals_title": "Objectifs métiers",
      "goal1": "<strong>Réduire le time-to-decision</strong> : de jours (demande de rapport manuel) à secondes (dashboard live).",
      "goal2": "<strong>Source unique de vérité</strong> : chaque KPI traçable à une vue SQL, avec piste d'audit (colonne <code>location_source</code>).",
      "goal3": "<strong>Drill-down multi-dimensionnel</strong> : chaque dashboard supporte des chaînes de filtres (ministère → entité → site → période).",
      "goal4": "<strong>Granularité par site</strong> : recettes, agents, inspections tous attribuables à des villes spécifiques (Malabo, Bata, Mongomo, …).",
      "goal5": "<strong>Suivi d'adoption OMS</strong> : classifieur dynamique (<code>workflow_codes ? 'BUNDLE_PAYMENT'</code>) pour mesurer le déploiement progressif."
    },
    "ae": {
      "intro": "Note de terminologie : ce travail est de l'<strong>Ingénierie analytique</strong>, pas de l'analyse de données métier. Un Business Data Analyst <em>consomme</em> les dashboards pour trouver des insights ; un Analytics Engineer <em>construit la couche sémantique</em> qui rend ces insights fiables, rapides et cohérents entre les consommateurs (Grafana, Looker, apps custom). Le travail ci-dessous relève du second.",
      "diagram_title": "Architecture de données 4 couches",
      "l1": "Couche 1 — Agrégations", "l1_sub": "Vues matérialisées (cron 15 min)",
      "l2": "Couche 2 — Vues enrichies", "l2_sub": "v_*_enriched (JOIN entités + sites + agents + classifieurs)",
      "l3": "Couche 3 — Wrappers auto", "l3_sub": "vw_* (sync au boot pour visibilité Looker JDBC)",
      "l4": "Couche 4 — Consommateurs", "l4_sub": "Grafana Cloud + Looker Studio + futurs outils BI",
      "l1_title": "Couche 1 — Agrégations (MVs)",
      "l1_body": "Les vues matérialisées pré-calculent les agrégations lourdes (sum, count, group by) sur un cron de 15 minutes. Elles sont la source <em>backup</em> et <em>historique</em>. <strong>Les requêtes live sur les vues enrichies sont le chemin primaire</strong> pour les dashboards qui ont besoin de temps réel — les MVs sont lues uniquement pour les agrégations historiques (cf. règle mémoire #22).",
      "l2_title": "Couche 2 — Vues enrichies (le cœur)",
      "l2_intro": "C'est la <strong>couche sémantique</strong> — l'endroit canonique où vit la logique métier :",
      "l2": {
        "joins": "<strong>Jointures résolues une fois</strong> : entités, sites, agents, ministères sont joints ici pour que les dashboards ne réinventent jamais le JOIN.",
        "classifiers": "<strong>Classifieurs calculés</strong> : <code>is_oms = workflow_codes ? 'BUNDLE_PAYMENT'</code>, <code>is_supervisor = role_code ILIKE '%supervisor%'</code>, etc.",
        "multi": "<strong>Résolution multi-sources</strong> (la fonctionnalité killer) : le site canonique d'un paiement est résolu en chaîne <code>COALESCE</code> 4-étapes (inspection terrain → demande de service → agent collecté → agent validé), avec une colonne d'audit <code>location_source</code> pour que les consommateurs puissent faire confiance à la donnée.",
        "granted": "<strong>Accordée à <code>looker_readonly</code></strong> : un rôle dédié en lecture seule sans privilèges d'écriture, isolant l'accès BI de l'accès applicatif."
      },
      "l3_title": "Couche 3 — Wrappers auto",
      "l3_body": "Le driver JDBC de Looker Studio cache les vues matérialisées (<code>relkind='m'</code>). Pour rendre les MVs visibles dans le picker sans écrire de wrappers manuels, le boot du backend exécute <code>sync_looker_view_wrappers()</code> qui crée automatiquement une vue <code>vw_*</code> de <code>relkind='v'</code> sur chaque MV accordée à <code>looker_readonly</code>. Grafana n'a pas besoin de cette couche (son driver Postgres voit les MVs nativement), donc les dashboards référencent <code>v_*</code> et <code>mv_*</code> directement.",
      "l4_title": "Couche 4 — Consommateurs (Grafana + Looker)",
      "l4_body": "Les deux providers consomment les mêmes vues de la Couche 2. La table <code>dashboard_registrations</code> stocke une colonne <code>provider</code> (<code>'looker' | 'grafana'</code>) pour que chaque dashboard enregistré sache comment être embarqué."
    },
    "personas": {
      "intro": "Chaque dashboard doit répondre à au moins une décision concrète. Le mapping ci-dessous est le <em>contrat</em> : si une partie prenante ne peut pas répondre à ses questions listées en moins de 30 secondes, le dashboard est cassé et est retravaillé.",
      "col_persona": "Persona", "col_dash": "Dashboards principaux", "col_decisions": "Décisions pilotées",
      "row": {
        "treasury": { "name": "<strong>Responsable de trésorerie</strong>", "dash": "Recaudación Fiscal, Payments Operations, Overview", "dec": "Alertes recettes quotidiennes, écarts de réconciliation, drift de méthode de paiement, contribution par ministère" },
        "agent": { "name": "<strong>Agent ministériel (CNEDOGE, MIN_TRABAJO, …)</strong>", "dash": "Performance Agentes, Service Requests", "dec": "Profondeur de ma file, ma pression SLA, benchmarking entre pairs" },
        "oms": { "name": "<strong>Superviseur OMS (AYUNTAMIENTO, CAMARA_COMERCIO)</strong>", "dash": "OMS Modules, Empresas, Inspections", "dec": "Taux de complétion des obligations bundle, vélocité d'émission de licences, qualité des inspections terrain" },
        "insp": { "name": "<strong>Chef inspecteur</strong>", "dash": "Inspections, Mobile vs Web vs Inspector", "dec": "Activité terrain par zone/ville, taux d'évidence photo, usage des scellés, adoption de l'app mobile par les inspecteurs" },
        "dir": { "name": "<strong>Directeur des services aux citoyens</strong>", "dash": "Empresas, Service Requests, User Activity", "dec": "Cohorte d'entreprises actives par zone, backlog de demandes, piste d'audit citoyenne" },
        "exec": { "name": "<strong>Direction (DG / Ministre)</strong>", "dash": "Overview uniquement", "dec": "Pouls de la santé plateforme, comparaison cross-ministères, vélocité d'adoption mobile" }
      }
    },
    "dash": {
      "intro": "Chaque dashboard ci-dessous documente : <strong>capture d'écran</strong>, <strong>KPIs principaux</strong> avec leur formule SQL, <strong>filtres</strong>, la <strong>vue source</strong> et les <strong>décisions concrètes</strong> qu'il permet. Tous les dashboards partagent un tag (<code>facil</code>) et se lient les uns aux autres via le menu déroulant de navigation.",
      "col_kpi": "KPI", "col_formula": "Formule (simplifiée)", "col_formula_short": "Formule", "col_source": "Source", "col_decision": "Décision",
      "overview": {
        "title": "00 — Overview",
        "meta": "<strong>UID</strong> : <code>facil-overview</code> · <strong>Audience</strong> : Direction · <strong>Filtres</strong> : période uniquement",
        "body": "Le pouls de la plateforme. 4-7 stat cards en haut (recettes, entreprises actives, agents en ligne, événements d'audit), 1-2 timeseries montrant la tendance, et un menu déroulant de navigation vers les 9 autres dashboards.",
        "kpi": {
          "revenue": "Recaudación total (XAF)", "revenue_dec": "Alerte recettes quotidiennes si < seuil",
          "empresas": "Empresas activas", "empresas_dec": "Vélocité d'onboarding",
          "agents": "Agentes activos (24h)", "agents_dec": "Planification de capacité",
          "audit": "Eventos de auditoría", "audit_dec": "Détection d'anomalies"
        }
      },
      "treasury": {
        "title": "01 — Recaudación Fiscal",
        "meta": "<strong>UID</strong> : <code>facil-treasury</code> · <strong>Audience</strong> : Responsable de trésorerie · <strong>Filtres</strong> : Ministère, Entité, Workflow, Méthode, <strong>Site (multi-sources)</strong>",
        "body": "Le dashboard phare. Résout les recettes par <strong>site physique</strong> (ville) en utilisant la chaîne COALESCE 4-étapes pour qu'un paiement collecté par un inspecteur à Bata soit attribué à Bata, pas à l'agent valideur à Malabo. Le donut <code>location_source</code> montre la ventilation de la résolution.",
        "kpi": {
          "total": "Recaudación total", "total_dec": "Suivi des recettes",
          "recovery_dec": "Écart de réconciliation",
          "persite": "Ventilation par site", "persite_dec": "Performance par site",
          "method": "Mix de méthodes", "method_dec": "Adoption BANGE",
          "attribution": "Attribution de source", "attribution_dec": "Audit de qualité de la donnée"
        }
      },
      "agents": {
        "title": "02 — Performance Agentes",
        "meta": "<strong>UID</strong> : <code>facil-agents</code> · <strong>Audience</strong> : Agent + Superviseur ministériel · <strong>Filtres</strong> : toggle OMS, Entité, Site, Type d'agent",
        "body": "Le toggle OMS (variable custom) permet aux superviseurs de comparer les équipes bundle-payment (AYUNTAMIENTO, CAMARA_COMERCIO) vs les équipes ministérielles traditionnelles. Drill : ministère → entité → site → agent.",
        "kpi": {
          "active": "Agents actifs", "active_dec": "Allocation de ressources",
          "queue": "Profondeur moyenne de file", "queue_dec": "Signal d'embauche / rééquilibrage",
          "sla": "Pression SLA", "sla_dec": "Alerte d'escalade",
          "top": "Top performers", "top_dec": "Reconnaissance / formation"
        }
      },
      "companies": {
        "title": "03 — Empresas",
        "meta": "<strong>UID</strong> : <code>facil-companies</code> · <strong>Audience</strong> : Directeur des services aux citoyens · <strong>Filtres</strong> : Zone, <strong>Ville (drill JSONB)</strong>",
        "body": "Le filtre Ville utilise un drill JSONB sur <code>mv_company_global_stats.by_city</code> — une colonne d'analytique pré-agrégée. Requête JSONB single-row → multiples lignes étendues via <code>jsonb_array_elements()</code>.",
        "kpi": {
          "regis": "Empresas registradas", "regis_dec": "Pénétration de marché",
          "zone": "Por zona (12 zones)", "zone_dec": "Outreach régional",
          "city": "Por ciudad (16 villes)", "city_dec": "Dispatch d'agent local",
          "debt": "Deuda por ciudad", "debt_src": "Drill JSONB", "debt_dec": "Priorité de recouvrement"
        }
      },
      "oms": {
        "title": "04 — OMS Modules",
        "meta": "<strong>UID</strong> : <code>facil-oms</code> · <strong>Audience</strong> : Superviseur OMS · <strong>Filtres</strong> : Ministère, Fee_type, Zone, Site",
        "body": "OMS = One-Stop-Shop. Suit le déploiement du workflow bundle-payment : une entité est OMS si son tableau JSONB <code>workflow_codes</code> contient <code>'BUNDLE_PAYMENT'</code>. Ce classifieur est <strong>géré par admin via UI</strong> (pas de redéploiement de code) et consommé via l'opérateur JSONB <code>?</code>.",
        "kpi": {
          "entities": "Entités OMS", "entities_dec": "Avancement du déploiement",
          "obli": "Obligations émises", "obli_dec": "Adoption bundle",
          "fees": "Frais moyens par bundle", "fees_dec": "Benchmark de tarification",
          "compl": "Taux de complétion", "compl_dec": "Diagnostic de friction"
        }
      },
      "payments": {
        "title": "05 — Payments Operations",
        "meta": "<strong>UID</strong> : <code>facil-payments</code> · <strong>Audience</strong> : Opérations trésorerie · <strong>Filtres</strong> : Statut, Entité, Site",
        "note": "Capture d'écran non prise au moment de la rédaction — structure de données identique à <code>v_treasury_payments_by_site</code> ; visuel identique au dashboard 01 avec emphase sur le statut opérationnel.",
        "kpi": {
          "pending": "Validation en attente", "pending_dec": "Alerte de backlog",
          "gap": "Écart de réconciliation", "gap_dec": "Suivi d'audit",
          "failed": "Paiements échoués", "failed_dec": "Suivi des problèmes du provider"
        }
      },
      "sr": {
        "title": "06 — Service Requests",
        "meta": "<strong>UID</strong> : <code>facil-service-requests</code> · <strong>Audience</strong> : Agent ministériel · <strong>Filtres</strong> : Workflow, Entité, Site",
        "body": "Demandes de service actives avec <strong>buckets d'âge</strong> (0-24h, 24-72h, 3-7j, 7j+) pour le suivi SLA. La ventilation de statut montre l'étape goulot du workflow.",
        "kpi": {
          "active": "SR actives", "active_dec": "Volume de backlog",
          "age": "Buckets d'âge", "age_dec": "Déclencheur d'escalade SLA",
          "status": "Mix de statuts", "status_dec": "Identification de goulot"
        }
      },
      "ua": {
        "title": "07 — User Activity (Audit)",
        "meta": "<strong>UID</strong> : <code>facil-user-activity</code> · <strong>Audience</strong> : Sécurité & Direction · <strong>Filtres</strong> : Canal, Rôle, Catégorie d'action",
        "body": "Construit sur <code>v_user_activity_audit</code> qui canonicalise 3 342+ événements audit_logs avec détection de canal (mobile/web/inspector) via regex user-agent et mapping action_category."
      },
      "channel": {
        "title": "08 — Mobile vs Web vs Inspector",
        "meta": "<strong>UID</strong> : <code>facil-channel</code> · <strong>Audience</strong> : Direction & Produit · <strong>Filtres</strong> : Workflow, Entité",
        "body": "Suit l'adoption de l'app mobile citoyen et de l'app inspector vs l'accès web traditionnel. Clé pour la stratégie produit : où investir l'effort UX."
      },
      "insp": {
        "title": "09 — Inspections (terrain)",
        "meta": "<strong>UID</strong> : <code>facil-inspections</code> · <strong>Audience</strong> : Chef inspecteur · <strong>Filtres</strong> : Entité, Ville, Résultat",
        "body": "Affiche actuellement « No data » sur la plupart des cartes car <code>field_inspections</code> est vide en production tant que l'app mobile inspector n'a pas capturé ses premiers rapports. Le schéma est prêt, tous les KPIs et filtres sont wirés, et <code>noValue: \"0\"</code> garantit l'absence d'erreurs parasites."
      }
    },
    "patterns": {
      "A_title": "Pattern A — Résolution multi-sources (COALESCE 4 étapes)",
      "A_body": "Quand une dimension peut être dérivée de plusieurs sources avec priorité, ne jamais en choisir une arbitrairement — fallback en ordre de priorité avec piste d'audit. Ce pattern a résolu le problème « tous les agents à Malabo » où les recettes des inspections terrain à Bata étaient à tort attribuées au site de l'agent valideur.",
      "B_title": "Pattern B — Classifieur JSONB (géré par admin, pas de redéploiement)",
      "B_body": "Le classifieur OMS (<code>workflow_codes ? 'BUNDLE_PAYMENT'</code>) vit dans la table <code>entities</code> sous forme de tableau JSONB. Les admins toggle le statut OMS depuis l'UI ; les dashboards recalculent instantanément. Aucun changement de code, aucune migration. Source unique de vérité.",
      "C_title": "Pattern C — Variables de template chaînées",
      "C_body": "Les filtres se chaînent via <code>refresh: 1</code> sur chaque variable : ministère → entité → site les requêtes de population dépendent de la sélection amont. La <strong>requête de population</strong> pour le filtre Site doit être le catalogue (<code>v_entity_locations_browse</code>), pas la table de faits — sinon les sites sans donnée deviennent invisibles.",
      "D_title": "Pattern D — Primitives Grafana engine-agnostic",
      "D_body": "Trois primitives côté Grafana apparaissent dans les 10 dashboards et fonctionneraient sur MySQL / BigQuery / Snowflake / SQL Server inchangées (vérifié dans notre <code>GRAFANA_DASHBOARDS_AGENT.md</code> v1.1 réutilisable) :",
      "D": {
        "sqlstring": "<code>${var:sqlstring}</code> — la <em>seule</em> façon de gérer le multi-select « All ». Jamais <code>'$var' = 'All' OR ...</code>.",
        "currency": "<code>\"unit\": \"currency:XAF\"</code> — le préfixe <code>currency:</code> déclenche l'affichage ISO. Sans lui, on obtient un littéral « currencyXAF ».",
        "novalue": "<code>\"noValue\": \"0\"</code> — sur les panels stat, NULL devient « No data ». Cela force un 0 propre."
      }
    },
    "stack": {
      "row": {
        "hosting": "Hébergement", "hosting_val": "Grafana Cloud Free Tier (<code>kouemousah.grafana.net</code>)",
        "datasource": "Datasource", "datasource_val": "Pooler Postgres IPv4 (<code>aws-0-eu-west-3.pooler.supabase.com:6543</code>)",
        "bi": "Rôle BI", "bi_val": "<code>looker_readonly</code> (lecture seule sur vues enrichies + MVs)",
        "dac": "Dashboards-as-code", "dac_val": "10 fichiers JSON dans <code>infra/grafana/dashboards/</code>",
        "push": "Script de push", "push_val": "<code>packages/backend/scripts/push_grafana_dashboards.py</code> (push API idempotent)",
        "prov": "YAML de provisioning", "prov_val": "<code>infra/grafana/provisioning/{datasources,dashboards}/</code> (pour self-hosted)",
        "refresh": "Auto-refresh", "refresh_val": "5 min par défaut par dashboard",
        "embed": "Embed dans l'admin Facil", "embed_val": "URL <code>d-solo</code> + <code>kiosk=tv</code> via <code>DashboardConfigService._build_grafana_embed_url()</code>",
        "token": "Rotation du token", "token_val": "Expiration 7 jours sur le service account <code>facil-deployer</code>"
      },
      "agent_title": "Agent réutilisable",
      "agent_body": "Le travail a été distillé dans <code>infra/grafana/GRAFANA_DASHBOARDS_AGENT.md</code> — un agent reproducible en 8 phases invocable via la slash-command <code>/grafana-dashboards</code>. La v1.1 a ajouté un adapter multi-engine (Postgres / MySQL / BigQuery / Snowflake / SQL Server) pour que le même agent tourne sur n'importe quel projet. 10 garde-fous actifs neutralisent les faiblesses connues (piège du pooler IPv4, format de devise, variables de template, fuite de token, rollback manquant, etc.)."
    },
    "limits": {
      "title": "Limites connues (honnêtes)",
      "rls": "<strong>Pas de sécurité au niveau ligne (RLS) sur Grafana</strong> — quiconque a l'URL embed peut voir le dashboard. Mitigation : permission gate au niveau wrapper applicatif (<code>dashboards.view_business</code>). Pour un vrai RLS, connecteur communautaire OAUTH2 prévu (Phase B.2).",
      "seed": "<strong>Les seed data ont tous les agents à Malabo</strong> — la distribution par site dépend des profils d'agents en prod peuplant <code>entity_location_id</code>.",
      "empty": "<strong>Dashboard Inspections vide</strong> — légitimement, jusqu'à ce que l'app mobile inspector capture des rapports terrain.",
      "token": "<strong>Rotation du token</strong> — manuelle tous les 7 jours. À automatiser via Cloud Scheduler + API service account.",
      "screenshot": "<strong>Capture 05 Payments manquante</strong> au moment de la rédaction de cette doc — le dashboard est en live ; capture en attente."
    },
    "lineage": {
      "title": "Lignage des données (audit-ready)",
      "intro": "Chaque panel peut être tracé à travers la stack :"
    },
    "roadmap": {
      "title": "Roadmap",
      "s1": "<strong>Q3 2026</strong> : connecteur communautaire OAUTH2 pour vrai RLS multi-tenant.",
      "s2": "<strong>Q3 2026</strong> : alertes sur seuil de recettes + breach SLA (Grafana natif, push vers Slack).",
      "s3": "<strong>Q4 2026</strong> : dashboards deep-dive par ministère (1 par ministère, actuellement agrégé).",
      "s4": "<strong>Q4 2026</strong> : détection d'anomalies sur l'activité utilisateur (audit log) via plugin Grafana ML."
    },
    "related": {
      "title": "Documentation associée",
      "arch": "<a href=\"architecture.html\">Architecture système</a> — vue d'ensemble backend / couche données",
      "db": "<a href=\"database.html\">Schéma de base de données</a> — référence complète des tables (145 tables)",
      "readme": "<code>infra/grafana/README.md</code> — référence provisioning + script de push",
      "agent": "<code>infra/grafana/GRAFANA_DASHBOARDS_AGENT.md</code> — agent réutilisable en 8 phases"
    }
  }
}
;
