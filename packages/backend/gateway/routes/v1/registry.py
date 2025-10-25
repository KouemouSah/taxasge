"""
Registre central de tous les endpoints TaxasGE
Configuration centralisée des routes, permissions et rate limiting
"""

from typing import Dict, List, Any, Optional, Callable
from dataclasses import dataclass, field
from enum import Enum
import importlib
from loguru import logger

class RouteType(Enum):
    """Types de routes disponibles"""
    PUBLIC = "public"
    AUTHENTICATED = "authenticated"
    ADMIN = "admin"

class HTTPMethod(Enum):
    """Méthodes HTTP supportées"""
    GET = "GET"
    POST = "POST"
    PUT = "PUT"
    DELETE = "DELETE"
    PATCH = "PATCH"
    OPTIONS = "OPTIONS"

@dataclass
class RateLimit:
    """Configuration rate limiting"""
    requests: int
    window_seconds: int
    burst: Optional[int] = None

@dataclass
class RouteConfig:
    """Configuration complète d'une route"""
    path: str
    method: HTTPMethod
    handler_path: str
    route_type: RouteType
    description: str = ""

    # Security
    permissions: List[str] = field(default_factory=list)
    require_api_key: bool = False

    # Performance
    rate_limit: Optional[RateLimit] = None
    cache_ttl: int = 0
    cache_key_template: Optional[str] = None

    # Validation
    request_schema: Optional[str] = None
    response_schema: Optional[str] = None

    # Metadata
    tags: List[str] = field(default_factory=list)
    deprecated: bool = False
    version_added: str = "2.0.0"

class APIRegistry:
    """Registre central de tous les endpoints API"""

    def __init__(self):
        self.routes: Dict[str, RouteConfig] = {}
        self.services: Dict[str, Dict[str, RouteConfig]] = {}
        self.route_patterns = {}

    async def register_all_services(self):
        """Enregistrer tous les services disponibles"""

        logger.info("📝 Registering TaxasGE API services...")

        # === SERVICES FISCAUX (547 services réels) ===
        await self._register_fiscal_services()

        # === HIÉRARCHIE ADMINISTRATIVE ===
        await self._register_hierarchy_services()

        # === ADMINISTRATION COMPLÈTE ===
        await self._register_admin_services()

        # === AUTHENTIFICATION ET AUTORISATION ===
        await self._register_auth_services()

        # === GESTION UTILISATEURS ===
        await self._register_user_services()

        # === DÉCLARATIONS FISCALES ===
        await self._register_declaration_services()

        # === PAIEMENTS BANGE ===
        await self._register_payment_services()

        # === ASSISTANT IA ===
        await self._register_ai_services()

        # === NOTIFICATIONS ===
        await self._register_notification_services()

        # === ANALYTICS ET RAPPORTS ===
        await self._register_analytics_services()

        logger.info(f"✅ {len(self.routes)} routes registered across {len(self.services)} services")

    async def _register_fiscal_services(self):
        """Services fiscaux - 547 services disponibles"""
        fiscal_routes = {
            # Services publics
            "GET /api/v1/services": RouteConfig(
                path="/services",
                method=HTTPMethod.GET,
                handler_path="fiscal_services.get_all_services",
                route_type=RouteType.PUBLIC,
                description="Liste complète des 547 services fiscaux",
                cache_ttl=3600,
                rate_limit=RateLimit(requests=500, window_seconds=3600),
                tags=["fiscal-services", "public"]
            ),

            "GET /api/v1/services/search": RouteConfig(
                path="/services/search",
                method=HTTPMethod.GET,
                handler_path="fiscal_services.search_services",
                route_type=RouteType.PUBLIC,
                description="Recherche dans 19,388 procédures et 547 services",
                cache_ttl=1800,
                rate_limit=RateLimit(requests=200, window_seconds=3600),
                tags=["fiscal-services", "search"]
            ),

            "GET /api/v1/services/{service_id}": RouteConfig(
                path="/services/{service_id}",
                method=HTTPMethod.GET,
                handler_path="fiscal_services.get_service_detail",
                route_type=RouteType.PUBLIC,
                description="Détail complet d'un service fiscal",
                cache_ttl=1800,
                cache_key_template="service:{service_id}",
                tags=["fiscal-services", "details"]
            ),

            "GET /api/v1/services/{service_id}/procedures": RouteConfig(
                path="/services/{service_id}/procedures",
                method=HTTPMethod.GET,
                handler_path="fiscal_services.get_service_procedures",
                route_type=RouteType.PUBLIC,
                description="Procédures détaillées du service",
                cache_ttl=3600,
                tags=["fiscal-services", "procedures"]
            ),

            "GET /api/v1/services/{service_id}/documents": RouteConfig(
                path="/services/{service_id}/documents",
                method=HTTPMethod.GET,
                handler_path="fiscal_services.get_required_documents",
                route_type=RouteType.PUBLIC,
                description="Documents requis pour le service",
                cache_ttl=3600,
                tags=["fiscal-services", "documents"]
            ),

            "GET /api/v1/services/{service_id}/keywords": RouteConfig(
                path="/services/{service_id}/keywords",
                method=HTTPMethod.GET,
                handler_path="fiscal_services.get_service_keywords",
                route_type=RouteType.PUBLIC,
                description="Mots-clés associés au service",
                cache_ttl=7200,
                tags=["fiscal-services", "keywords"]
            ),

            # Calculs fiscaux
            "POST /api/v1/services/{service_id}/calculate": RouteConfig(
                path="/services/{service_id}/calculate",
                method=HTTPMethod.POST,
                handler_path="fiscal_services.calculate_service_amount",
                route_type=RouteType.AUTHENTICATED,
                description="Calculer les montants fiscaux d'un service",
                rate_limit=RateLimit(requests=100, window_seconds=3600),
                request_schema="CalculationRequest",
                response_schema="CalculationResponse",
                tags=["fiscal-services", "calculations"]
            ),

            "POST /api/v1/calculate/batch": RouteConfig(
                path="/calculate/batch",
                method=HTTPMethod.POST,
                handler_path="fiscal_services.calculate_batch",
                route_type=RouteType.AUTHENTICATED,
                description="Calculs en lot pour plusieurs services",
                rate_limit=RateLimit(requests=20, window_seconds=3600),
                permissions=["fiscal:calculate:batch"],
                tags=["fiscal-services", "batch"]
            ),

            "GET /api/v1/calculate/history": RouteConfig(
                path="/calculate/history",
                method=HTTPMethod.GET,
                handler_path="fiscal_services.get_calculation_history",
                route_type=RouteType.AUTHENTICATED,
                description="Historique des calculs utilisateur",
                cache_ttl=300,
                tags=["fiscal-services", "history"]
            )
        }

        self._register_service("fiscal_services", fiscal_routes)

    async def _register_hierarchy_services(self):
        """Hiérarchie administrative - 14 ministères → 16 secteurs → 86 catégories"""
        hierarchy_routes = {
            "GET /api/v1/ministries": RouteConfig(
                path="/ministries",
                method=HTTPMethod.GET,
                handler_path="hierarchy.get_all_ministries",
                route_type=RouteType.PUBLIC,
                description="14 ministères complets avec statistiques",
                cache_ttl=7200,
                tags=["hierarchy", "ministries"]
            ),

            "GET /api/v1/ministries/{ministry_id}": RouteConfig(
                path="/ministries/{ministry_id}",
                method=HTTPMethod.GET,
                handler_path="hierarchy.get_ministry_detail",
                route_type=RouteType.PUBLIC,
                description="Détail d'un ministère avec secteurs",
                cache_ttl=7200,
                tags=["hierarchy", "ministries"]
            ),

            "GET /api/v1/ministries/{ministry_id}/sectors": RouteConfig(
                path="/ministries/{ministry_id}/sectors",
                method=HTTPMethod.GET,
                handler_path="hierarchy.get_ministry_sectors",
                route_type=RouteType.PUBLIC,
                description="16 secteurs d'un ministère",
                cache_ttl=7200,
                tags=["hierarchy", "sectors"]
            ),

            "GET /api/v1/sectors/{sector_id}/categories": RouteConfig(
                path="/sectors/{sector_id}/categories",
                method=HTTPMethod.GET,
                handler_path="hierarchy.get_sector_categories",
                route_type=RouteType.PUBLIC,
                description="86 catégories d'un secteur",
                cache_ttl=7200,
                tags=["hierarchy", "categories"]
            ),

            "GET /api/v1/categories/{category_id}/subcategories": RouteConfig(
                path="/categories/{category_id}/subcategories",
                method=HTTPMethod.GET,
                handler_path="hierarchy.get_category_subcategories",
                route_type=RouteType.PUBLIC,
                description="Sous-catégories d'une catégorie",
                cache_ttl=7200,
                tags=["hierarchy", "subcategories"]
            ),

            "GET /api/v1/subcategories/{subcategory_id}/services": RouteConfig(
                path="/subcategories/{subcategory_id}/services",
                method=HTTPMethod.GET,
                handler_path="hierarchy.get_subcategory_services",
                route_type=RouteType.PUBLIC,
                description="Services fiscaux d'une sous-catégorie",
                cache_ttl=3600,
                tags=["hierarchy", "services"]
            )
        }

        self._register_service("hierarchy", hierarchy_routes)

    async def _register_admin_services(self):
        """Administration complète - CRUD + Analytics + Monitoring"""
        admin_routes = {
            # === CRUD SERVICES FISCAUX ===
            "GET /api/v1/admin/services": RouteConfig(
                path="/admin/services",
                method=HTTPMethod.GET,
                handler_path="admin.services.get_all_services",
                route_type=RouteType.ADMIN,
                description="Gestion des 547 services fiscaux",
                permissions=["admin:services:read"],
                rate_limit=RateLimit(requests=1000, window_seconds=3600),
                tags=["admin", "services", "crud"]
            ),

            "POST /api/v1/admin/services": RouteConfig(
                path="/admin/services",
                method=HTTPMethod.POST,
                handler_path="admin.services.create_service",
                route_type=RouteType.ADMIN,
                description="Créer un nouveau service fiscal",
                permissions=["admin:services:create"],
                rate_limit=RateLimit(requests=50, window_seconds=3600),
                request_schema="CreateServiceRequest",
                tags=["admin", "services", "create"]
            ),

            "PUT /api/v1/admin/services/{service_id}": RouteConfig(
                path="/admin/services/{service_id}",
                method=HTTPMethod.PUT,
                handler_path="admin.services.update_service",
                route_type=RouteType.ADMIN,
                description="Modifier un service fiscal existant",
                permissions=["admin:services:update"],
                request_schema="UpdateServiceRequest",
                tags=["admin", "services", "update"]
            ),

            "DELETE /api/v1/admin/services/{service_id}": RouteConfig(
                path="/admin/services/{service_id}",
                method=HTTPMethod.DELETE,
                handler_path="admin.services.delete_service",
                route_type=RouteType.ADMIN,
                description="Supprimer un service fiscal",
                permissions=["admin:services:delete"],
                tags=["admin", "services", "delete"]
            ),

            "POST /api/v1/admin/services/bulk-update": RouteConfig(
                path="/admin/services/bulk-update",
                method=HTTPMethod.POST,
                handler_path="admin.services.bulk_update",
                route_type=RouteType.ADMIN,
                description="Mise à jour en masse des services",
                permissions=["admin:services:bulk"],
                rate_limit=RateLimit(requests=10, window_seconds=3600),
                tags=["admin", "services", "bulk"]
            ),

            "POST /api/v1/admin/services/import": RouteConfig(
                path="/admin/services/import",
                method=HTTPMethod.POST,
                handler_path="admin.services.import_services",
                route_type=RouteType.ADMIN,
                description="Importer services depuis CSV/Excel",
                permissions=["admin:services:import"],
                rate_limit=RateLimit(requests=5, window_seconds=3600),
                tags=["admin", "services", "import"]
            ),

            "GET /api/v1/admin/services/export": RouteConfig(
                path="/admin/services/export",
                method=HTTPMethod.GET,
                handler_path="admin.services.export_services",
                route_type=RouteType.ADMIN,
                description="Exporter services vers CSV/Excel",
                permissions=["admin:services:export"],
                rate_limit=RateLimit(requests=20, window_seconds=3600),
                tags=["admin", "services", "export"]
            ),

            # === GESTION PROCÉDURES (19,388 entrées) ===
            "GET /api/v1/admin/services/{service_id}/procedures": RouteConfig(
                path="/admin/services/{service_id}/procedures",
                method=HTTPMethod.GET,
                handler_path="admin.procedures.get_service_procedures",
                route_type=RouteType.ADMIN,
                description="Gestion procédures d'un service",
                permissions=["admin:procedures:read"],
                tags=["admin", "procedures"]
            ),

            "POST /api/v1/admin/services/{service_id}/procedures": RouteConfig(
                path="/admin/services/{service_id}/procedures",
                method=HTTPMethod.POST,
                handler_path="admin.procedures.add_procedure",
                route_type=RouteType.ADMIN,
                description="Ajouter une procédure",
                permissions=["admin:procedures:create"],
                tags=["admin", "procedures"]
            ),

            "PUT /api/v1/admin/procedures/{procedure_id}": RouteConfig(
                path="/admin/procedures/{procedure_id}",
                method=HTTPMethod.PUT,
                handler_path="admin.procedures.update_procedure",
                route_type=RouteType.ADMIN,
                description="Modifier une procédure",
                permissions=["admin:procedures:update"],
                tags=["admin", "procedures"]
            ),

            # === SUIVI DÉCLARATIONS ===
            "GET /api/v1/admin/declarations": RouteConfig(
                path="/admin/declarations",
                method=HTTPMethod.GET,
                handler_path="admin.declarations.get_all_declarations",
                route_type=RouteType.ADMIN,
                description="Toutes les déclarations fiscales",
                permissions=["admin:declarations:read"],
                tags=["admin", "declarations"]
            ),

            "GET /api/v1/admin/declarations/pending": RouteConfig(
                path="/admin/declarations/pending",
                method=HTTPMethod.GET,
                handler_path="admin.declarations.get_pending_declarations",
                route_type=RouteType.ADMIN,
                description="Déclarations en attente de validation",
                permissions=["admin:declarations:read"],
                cache_ttl=300,
                tags=["admin", "declarations", "pending"]
            ),

            "POST /api/v1/admin/declarations/{declaration_id}/approve": RouteConfig(
                path="/admin/declarations/{declaration_id}/approve",
                method=HTTPMethod.POST,
                handler_path="admin.declarations.approve_declaration",
                route_type=RouteType.ADMIN,
                description="Approuver une déclaration",
                permissions=["admin:declarations:approve"],
                tags=["admin", "declarations", "approve"]
            ),

            "POST /api/v1/admin/declarations/{declaration_id}/reject": RouteConfig(
                path="/admin/declarations/{declaration_id}/reject",
                method=HTTPMethod.POST,
                handler_path="admin.declarations.reject_declaration",
                route_type=RouteType.ADMIN,
                description="Rejeter une déclaration avec motif",
                permissions=["admin:declarations:reject"],
                tags=["admin", "declarations", "reject"]
            ),

            # === ANALYTICS PAIEMENTS ===
            "GET /api/v1/admin/analytics/revenue": RouteConfig(
                path="/admin/analytics/revenue",
                method=HTTPMethod.GET,
                handler_path="admin.analytics.get_revenue_analytics",
                route_type=RouteType.ADMIN,
                description="Analytics revenus par service/ministère",
                permissions=["admin:analytics:read"],
                cache_ttl=1800,
                tags=["admin", "analytics", "revenue"]
            ),

            "GET /api/v1/admin/analytics/services": RouteConfig(
                path="/admin/analytics/services",
                method=HTTPMethod.GET,
                handler_path="admin.analytics.get_services_analytics",
                route_type=RouteType.ADMIN,
                description="Analytics par service fiscal (top 547)",
                permissions=["admin:analytics:read"],
                cache_ttl=1800,
                tags=["admin", "analytics", "services"]
            ),

            # === GESTION UTILISATEURS ===
            "GET /api/v1/admin/users": RouteConfig(
                path="/admin/users",
                method=HTTPMethod.GET,
                handler_path="admin.users.get_all_users",
                route_type=RouteType.ADMIN,
                description="Gestion de tous les utilisateurs",
                permissions=["admin:users:read"],
                tags=["admin", "users"]
            ),

            "POST /api/v1/admin/users": RouteConfig(
                path="/admin/users",
                method=HTTPMethod.POST,
                handler_path="admin.users.create_user",
                route_type=RouteType.ADMIN,
                description="Créer un nouvel utilisateur",
                permissions=["admin:users:create"],
                tags=["admin", "users"]
            ),

            # === AUDIT ET CONFORMITÉ ===
            "GET /api/v1/admin/audit/logs": RouteConfig(
                path="/admin/audit/logs",
                method=HTTPMethod.GET,
                handler_path="admin.audit.get_audit_logs",
                route_type=RouteType.ADMIN,
                description="Logs d'audit complets",
                permissions=["admin:audit:read"],
                tags=["admin", "audit"]
            ),

            "GET /api/v1/admin/compliance/gdpr": RouteConfig(
                path="/admin/compliance/gdpr",
                method=HTTPMethod.GET,
                handler_path="admin.compliance.get_gdpr_status",
                route_type=RouteType.ADMIN,
                description="Statut conformité GDPR",
                permissions=["admin:compliance:read"],
                tags=["admin", "compliance"]
            )
        }

        self._register_service("admin", admin_routes)

    async def _register_auth_services(self):
        """Services d'authentification et autorisation"""
        auth_routes = {
            "POST /api/v1/auth/login": RouteConfig(
                path="/auth/login",
                method=HTTPMethod.POST,
                handler_path="auth.login_user",
                route_type=RouteType.PUBLIC,
                description="Authentification utilisateur",
                rate_limit=RateLimit(requests=10, window_seconds=300),
                request_schema="LoginRequest",
                response_schema="LoginResponse",
                tags=["auth", "login"]
            ),

            "POST /api/v1/auth/register": RouteConfig(
                path="/auth/register",
                method=HTTPMethod.POST,
                handler_path="auth.register_user",
                route_type=RouteType.PUBLIC,
                description="Inscription utilisateur",
                rate_limit=RateLimit(requests=5, window_seconds=300),
                request_schema="RegisterRequest",
                tags=["auth", "register"]
            ),

            "POST /api/v1/auth/refresh": RouteConfig(
                path="/auth/refresh",
                method=HTTPMethod.POST,
                handler_path="auth.refresh_token",
                route_type=RouteType.AUTHENTICATED,
                description="Renouveler token JWT",
                rate_limit=RateLimit(requests=20, window_seconds=3600),
                tags=["auth", "refresh"]
            ),

            "POST /api/v1/auth/logout": RouteConfig(
                path="/auth/logout",
                method=HTTPMethod.POST,
                handler_path="auth.logout_user",
                route_type=RouteType.AUTHENTICATED,
                description="Déconnexion utilisateur",
                tags=["auth", "logout"]
            ),

            "POST /api/v1/auth/forgot-password": RouteConfig(
                path="/auth/forgot-password",
                method=HTTPMethod.POST,
                handler_path="auth.forgot_password",
                route_type=RouteType.PUBLIC,
                description="Réinitialisation mot de passe",
                rate_limit=RateLimit(requests=3, window_seconds=3600),
                tags=["auth", "password"]
            )
        }

        self._register_service("auth", auth_routes)

    async def _register_user_services(self):
        """Gestion des utilisateurs"""
        user_routes = {
            "GET /api/v1/users/profile": RouteConfig(
                path="/users/profile",
                method=HTTPMethod.GET,
                handler_path="users.get_user_profile",
                route_type=RouteType.AUTHENTICATED,
                description="Profil utilisateur connecté",
                cache_ttl=300,
                tags=["users", "profile"]
            ),

            "PUT /api/v1/users/profile": RouteConfig(
                path="/users/profile",
                method=HTTPMethod.PUT,
                handler_path="users.update_user_profile",
                route_type=RouteType.AUTHENTICATED,
                description="Mettre à jour profil",
                request_schema="UpdateProfileRequest",
                tags=["users", "profile"]
            ),

            "GET /api/v1/users/favorites": RouteConfig(
                path="/users/favorites",
                method=HTTPMethod.GET,
                handler_path="users.get_user_favorites",
                route_type=RouteType.AUTHENTICATED,
                description="Services favoris utilisateur",
                cache_ttl=600,
                tags=["users", "favorites"]
            ),

            "POST /api/v1/users/favorites": RouteConfig(
                path="/users/favorites",
                method=HTTPMethod.POST,
                handler_path="users.add_favorite_service",
                route_type=RouteType.AUTHENTICATED,
                description="Ajouter service aux favoris",
                request_schema="AddFavoriteRequest",
                tags=["users", "favorites"]
            )
        }

        self._register_service("users", user_routes)

    async def _register_declaration_services(self):
        """Gestion complète des déclarations fiscales"""
        declaration_routes = {
            "GET /api/v1/declarations": RouteConfig(
                path="/declarations",
                method=HTTPMethod.GET,
                handler_path="declarations.get_user_declarations",
                route_type=RouteType.AUTHENTICATED,
                description="Déclarations de l'utilisateur",
                tags=["declarations"]
            ),

            "POST /api/v1/declarations": RouteConfig(
                path="/declarations",
                method=HTTPMethod.POST,
                handler_path="declarations.create_declaration",
                route_type=RouteType.AUTHENTICATED,
                description="Créer nouvelle déclaration",
                rate_limit=RateLimit(requests=20, window_seconds=3600),
                request_schema="CreateDeclarationRequest",
                tags=["declarations"]
            ),

            "GET /api/v1/declarations/{declaration_id}": RouteConfig(
                path="/declarations/{declaration_id}",
                method=HTTPMethod.GET,
                handler_path="declarations.get_declaration_detail",
                route_type=RouteType.AUTHENTICATED,
                description="Détail d'une déclaration",
                tags=["declarations"]
            ),

            "PUT /api/v1/declarations/{declaration_id}": RouteConfig(
                path="/declarations/{declaration_id}",
                method=HTTPMethod.PUT,
                handler_path="declarations.update_declaration",
                route_type=RouteType.AUTHENTICATED,
                description="Modification déclaration",
                request_schema="UpdateDeclarationRequest",
                tags=["declarations"]
            ),

            "POST /api/v1/declarations/{declaration_id}/submit": RouteConfig(
                path="/declarations/{declaration_id}/submit",
                method=HTTPMethod.POST,
                handler_path="declarations.submit_to_dgi",
                route_type=RouteType.AUTHENTICATED,
                description="Soumission DGI",
                rate_limit=RateLimit(requests=10, window_seconds=3600),
                tags=["declarations", "submit"]
            ),

            "DELETE /api/v1/declarations/{declaration_id}": RouteConfig(
                path="/declarations/{declaration_id}",
                method=HTTPMethod.DELETE,
                handler_path="declarations.delete_declaration",
                route_type=RouteType.AUTHENTICATED,
                description="Supprimer déclaration",
                tags=["declarations"]
            ),

            "GET /api/v1/declarations/{declaration_id}/status": RouteConfig(
                path="/declarations/{declaration_id}/status",
                method=HTTPMethod.GET,
                handler_path="declarations.get_declaration_status",
                route_type=RouteType.AUTHENTICATED,
                description="Statut déclaration DGI",
                cache_ttl=300,
                tags=["declarations", "status"]
            ),

            "POST /api/v1/declarations/{declaration_id}/documents": RouteConfig(
                path="/declarations/{declaration_id}/documents",
                method=HTTPMethod.POST,
                handler_path="declarations.attach_document",
                route_type=RouteType.AUTHENTICATED,
                description="Attacher document à déclaration",
                rate_limit=RateLimit(requests=50, window_seconds=3600),
                tags=["declarations", "documents"]
            ),

            "GET /api/v1/declarations/drafts": RouteConfig(
                path="/declarations/drafts",
                method=HTTPMethod.GET,
                handler_path="declarations.get_user_drafts",
                route_type=RouteType.AUTHENTICATED,
                description="Brouillons utilisateur",
                cache_ttl=300,
                tags=["declarations", "drafts"]
            ),

            "POST /api/v1/declarations/drafts": RouteConfig(
                path="/declarations/drafts",
                method=HTTPMethod.POST,
                handler_path="declarations.save_draft",
                route_type=RouteType.AUTHENTICATED,
                description="Sauvegarder brouillon",
                rate_limit=RateLimit(requests=100, window_seconds=3600),
                request_schema="SaveDraftRequest",
                tags=["declarations", "drafts"]
            )
        }

        self._register_service("declarations", declaration_routes)

    async def _register_payment_services(self):
        """Intégration complète paiements BANGE et facturation"""
        payment_routes = {
            "POST /api/v1/payments/initiate": RouteConfig(
                path="/payments/initiate",
                method=HTTPMethod.POST,
                handler_path="payments.initiate_payment",
                route_type=RouteType.AUTHENTICATED,
                description="Initier paiement BANGE",
                rate_limit=RateLimit(requests=50, window_seconds=3600),
                request_schema="InitiatePaymentRequest",
                tags=["payments", "bange"]
            ),

            "POST /api/v1/payments/create": RouteConfig(
                path="/payments/create",
                method=HTTPMethod.POST,
                handler_path="payments.create_payment",
                route_type=RouteType.AUTHENTICATED,
                description="Créer paiement",
                rate_limit=RateLimit(requests=30, window_seconds=3600),
                request_schema="CreatePaymentRequest",
                tags=["payments", "create"]
            ),

            "POST /api/v1/payments/bange": RouteConfig(
                path="/payments/bange",
                method=HTTPMethod.POST,
                handler_path="payments.bange_wallet_payment",
                route_type=RouteType.AUTHENTICATED,
                description="Paiement Bange Wallet",
                rate_limit=RateLimit(requests=20, window_seconds=3600),
                request_schema="BangeWalletPaymentRequest",
                tags=["payments", "bange", "wallet"]
            ),

            "GET /api/v1/payments": RouteConfig(
                path="/payments",
                method=HTTPMethod.GET,
                handler_path="payments.get_user_payments",
                route_type=RouteType.AUTHENTICATED,
                description="Historique paiements utilisateur",
                cache_ttl=300,
                tags=["payments", "history"]
            ),

            "GET /api/v1/payments/{payment_id}": RouteConfig(
                path="/payments/{payment_id}",
                method=HTTPMethod.GET,
                handler_path="payments.get_payment_detail",
                route_type=RouteType.AUTHENTICATED,
                description="Détail d'un paiement",
                tags=["payments", "details"]
            ),

            "GET /api/v1/payments/{payment_id}/status": RouteConfig(
                path="/payments/{payment_id}/status",
                method=HTTPMethod.GET,
                handler_path="payments.get_payment_status",
                route_type=RouteType.AUTHENTICATED,
                description="Statut d'un paiement",
                cache_ttl=60,
                tags=["payments", "status"]
            ),

            "POST /api/v1/payments/{payment_id}/cancel": RouteConfig(
                path="/payments/{payment_id}/cancel",
                method=HTTPMethod.POST,
                handler_path="payments.cancel_payment",
                route_type=RouteType.AUTHENTICATED,
                description="Annuler paiement",
                rate_limit=RateLimit(requests=10, window_seconds=3600),
                tags=["payments", "cancel"]
            ),

            "GET /api/v1/payments/{payment_id}/receipt": RouteConfig(
                path="/payments/{payment_id}/receipt",
                method=HTTPMethod.GET,
                handler_path="payments.get_payment_receipt",
                route_type=RouteType.AUTHENTICATED,
                description="Reçu de paiement",
                tags=["payments", "receipt"]
            ),

            "GET /api/v1/payments/methods": RouteConfig(
                path="/payments/methods",
                method=HTTPMethod.GET,
                handler_path="payments.get_payment_methods",
                route_type=RouteType.AUTHENTICATED,
                description="Méthodes de paiement disponibles",
                cache_ttl=3600,
                tags=["payments", "methods"]
            ),

            "POST /api/v1/payments/webhook/bange": RouteConfig(
                path="/payments/webhook/bange",
                method=HTTPMethod.POST,
                handler_path="payments.handle_bange_webhook",
                route_type=RouteType.PUBLIC,
                description="Webhook BANGE",
                require_api_key=True,
                tags=["payments", "webhook"]
            ),

            "POST /api/v1/payments/webhook/mobile-money": RouteConfig(
                path="/payments/webhook/mobile-money",
                method=HTTPMethod.POST,
                handler_path="payments.handle_mobile_money_webhook",
                route_type=RouteType.PUBLIC,
                description="Webhook Mobile Money",
                require_api_key=True,
                tags=["payments", "webhook", "mobile"]
            )
        }

        self._register_service("payments", payment_routes)

    async def _register_ai_services(self):
        """Assistant IA conversationnel"""
        ai_routes = {
            "POST /api/v1/ai/chat": RouteConfig(
                path="/ai/chat",
                method=HTTPMethod.POST,
                handler_path="ai.chat_with_assistant",
                route_type=RouteType.AUTHENTICATED,
                description="Chat avec assistant IA fiscal",
                rate_limit=RateLimit(requests=100, window_seconds=3600),
                request_schema="ChatRequest",
                tags=["ai", "chat"]
            ),

            "GET /api/v1/ai/recommendations": RouteConfig(
                path="/ai/recommendations",
                method=HTTPMethod.GET,
                handler_path="ai.get_recommendations",
                route_type=RouteType.AUTHENTICATED,
                description="Recommandations IA personnalisées",
                cache_ttl=1800,
                tags=["ai", "recommendations"]
            )
        }

        self._register_service("ai", ai_routes)

    async def _register_notification_services(self):
        """Services de notifications"""
        notification_routes = {
            "GET /api/v1/notifications": RouteConfig(
                path="/notifications",
                method=HTTPMethod.GET,
                handler_path="notifications.get_user_notifications",
                route_type=RouteType.AUTHENTICATED,
                description="Notifications utilisateur",
                cache_ttl=300,
                tags=["notifications"]
            ),

            "PUT /api/v1/notifications/{notification_id}/read": RouteConfig(
                path="/notifications/{notification_id}/read",
                method=HTTPMethod.PUT,
                handler_path="notifications.mark_as_read",
                route_type=RouteType.AUTHENTICATED,
                description="Marquer notification comme lue",
                tags=["notifications"]
            )
        }

        self._register_service("notifications", notification_routes)

    async def _register_analytics_services(self):
        """Services d'analytics publiques"""
        analytics_routes = {
            "GET /api/v1/analytics/popular-services": RouteConfig(
                path="/analytics/popular-services",
                method=HTTPMethod.GET,
                handler_path="analytics.get_popular_services",
                route_type=RouteType.PUBLIC,
                description="Services fiscaux les plus consultés",
                cache_ttl=3600,
                tags=["analytics", "public"]
            ),

            "GET /api/v1/analytics/search-trends": RouteConfig(
                path="/analytics/search-trends",
                method=HTTPMethod.GET,
                handler_path="analytics.get_search_trends",
                route_type=RouteType.PUBLIC,
                description="Tendances de recherche",
                cache_ttl=3600,
                tags=["analytics", "trends"]
            ),

            "GET /api/v1/services/popular": RouteConfig(
                path="/services/popular",
                method=HTTPMethod.GET,
                handler_path="fiscal_services.get_popular_services",
                route_type=RouteType.PUBLIC,
                description="Services fiscaux les plus populaires",
                cache_ttl=1800,
                tags=["services", "popular"]
            ),

            "GET /api/v1/analytics/ministry/{ministry_id}/stats": RouteConfig(
                path="/analytics/ministry/{ministry_id}/stats",
                method=HTTPMethod.GET,
                handler_path="analytics.get_ministry_statistics",
                route_type=RouteType.PUBLIC,
                description="Statistiques par ministère",
                cache_ttl=3600,
                tags=["analytics", "ministry"]
            )
        }

        self._register_service("analytics", analytics_routes)

        # === DOCUMENTS ET PROCÉDURES (2,781 documents + 4,617 procédures) ===
        await self._register_documents_services()

        # === KEYWORDS ET RECHERCHE INTELLIGENTE (6,990 mots-clés) ===
        await self._register_keywords_services()

        # === UPLOAD ET OCR (fonctionnalité critique) ===
        await self._register_upload_services()

        # === RECHERCHE AVANCÉE ET FILTRES ===
        await self._register_search_services()

        # === LOCALISATION ET TRADUCTIONS (1,854 traductions) ===
        await self._register_i18n_services()

        # === INVOICES ET FACTURATION ===
        await self._register_invoices_services()

        # === BUSINESS ET ÉQUIPE ===
        await self._register_business_services()

    async def _register_documents_services(self):
        """Documents et procédures (2,781 documents + 4,617 procédures)"""
        documents_routes = {
            "GET /api/v1/documents": RouteConfig(
                path="/documents",
                method=HTTPMethod.GET,
                handler_path="documents.get_all_documents",
                route_type=RouteType.PUBLIC,
                description="2,781 documents requis complets",
                cache_ttl=3600,
                tags=["documents", "public"]
            ),

            "GET /api/v1/documents/{document_id}": RouteConfig(
                path="/documents/{document_id}",
                method=HTTPMethod.GET,
                handler_path="documents.get_document_detail",
                route_type=RouteType.PUBLIC,
                description="Détail document (RD-00001 à RD-02781)",
                cache_ttl=1800,
                tags=["documents", "details"]
            ),

            "GET /api/v1/procedures": RouteConfig(
                path="/procedures",
                method=HTTPMethod.GET,
                handler_path="procedures.get_all_procedures",
                route_type=RouteType.PUBLIC,
                description="4,617 procédures complètes",
                cache_ttl=3600,
                tags=["procedures", "public"]
            ),

            "GET /api/v1/procedures/service/{service_id}": RouteConfig(
                path="/procedures/service/{service_id}",
                method=HTTPMethod.GET,
                handler_path="procedures.get_procedures_by_service",
                route_type=RouteType.PUBLIC,
                description="Procédures par service fiscal",
                cache_ttl=1800,
                tags=["procedures", "services"]
            ),

            "GET /api/v1/procedures/{procedure_id}": RouteConfig(
                path="/procedures/{procedure_id}",
                method=HTTPMethod.GET,
                handler_path="procedures.get_procedure_detail",
                route_type=RouteType.PUBLIC,
                description="Détail d'une procédure",
                cache_ttl=1800,
                tags=["procedures", "details"]
            )
        }

        self._register_service("documents", documents_routes)

    async def _register_keywords_services(self):
        """Keywords et recherche intelligente (6,990 mots-clés)"""
        keywords_routes = {
            "GET /api/v1/keywords": RouteConfig(
                path="/keywords",
                method=HTTPMethod.GET,
                handler_path="keywords.get_all_keywords",
                route_type=RouteType.PUBLIC,
                description="6,990 mots-clés recherche",
                cache_ttl=7200,
                tags=["keywords", "public"]
            ),

            "GET /api/v1/keywords/search": RouteConfig(
                path="/keywords/search",
                method=HTTPMethod.GET,
                handler_path="keywords.search_keywords",
                route_type=RouteType.PUBLIC,
                description="Recherche intelligente keywords",
                rate_limit=RateLimit(requests=200, window_seconds=3600),
                tags=["keywords", "search"]
            ),

            "GET /api/v1/suggestions": RouteConfig(
                path="/suggestions",
                method=HTTPMethod.GET,
                handler_path="keywords.get_suggestions",
                route_type=RouteType.PUBLIC,
                description="Autocomplétion recherche",
                rate_limit=RateLimit(requests=500, window_seconds=3600),
                cache_ttl=300,
                tags=["keywords", "suggestions"]
            ),

            "GET /api/v1/keywords/service/{service_id}": RouteConfig(
                path="/keywords/service/{service_id}",
                method=HTTPMethod.GET,
                handler_path="keywords.get_service_keywords",
                route_type=RouteType.PUBLIC,
                description="Keywords d'un service spécifique",
                cache_ttl=3600,
                tags=["keywords", "services"]
            )
        }

        self._register_service("keywords", keywords_routes)

    async def _register_upload_services(self):
        """Upload et OCR (fonctionnalité critique)"""
        upload_routes = {
            "POST /api/v1/upload": RouteConfig(
                path="/upload",
                method=HTTPMethod.POST,
                handler_path="upload.upload_document",
                route_type=RouteType.AUTHENTICATED,
                description="Upload documents utilisateur",
                rate_limit=RateLimit(requests=50, window_seconds=3600),
                request_schema="UploadDocumentRequest",
                tags=["upload", "documents"]
            ),

            "POST /api/v1/ocr/extract": RouteConfig(
                path="/ocr/extract",
                method=HTTPMethod.POST,
                handler_path="ocr.extract_text_ai",
                route_type=RouteType.AUTHENTICATED,
                description="Extraction OCR + AI",
                rate_limit=RateLimit(requests=20, window_seconds=3600),
                request_schema="OCRExtractionRequest",
                tags=["ocr", "ai"]
            ),

            "GET /api/v1/ocr/status/{job_id}": RouteConfig(
                path="/ocr/status/{job_id}",
                method=HTTPMethod.GET,
                handler_path="ocr.get_extraction_status",
                route_type=RouteType.AUTHENTICATED,
                description="Status traitement OCR",
                tags=["ocr", "status"]
            ),

            "POST /api/v1/documents/validate": RouteConfig(
                path="/documents/validate",
                method=HTTPMethod.POST,
                handler_path="documents.validate_with_ai",
                route_type=RouteType.AUTHENTICATED,
                description="Validation AI-assisted",
                rate_limit=RateLimit(requests=30, window_seconds=3600),
                request_schema="DocumentValidationRequest",
                tags=["documents", "validation", "ai"]
            ),

            "GET /api/v1/upload/history": RouteConfig(
                path="/upload/history",
                method=HTTPMethod.GET,
                handler_path="upload.get_upload_history",
                route_type=RouteType.AUTHENTICATED,
                description="Historique uploads utilisateur",
                cache_ttl=300,
                tags=["upload", "history"]
            )
        }

        self._register_service("upload", upload_routes)

    async def _register_search_services(self):
        """Recherche avancée et filtres"""
        search_routes = {
            "GET /api/v1/search": RouteConfig(
                path="/search",
                method=HTTPMethod.GET,
                handler_path="search.global_search",
                route_type=RouteType.PUBLIC,
                description="Recherche globale intelligente",
                rate_limit=RateLimit(requests=200, window_seconds=3600),
                tags=["search", "global"]
            ),

            "GET /api/v1/filters/ministries": RouteConfig(
                path="/filters/ministries",
                method=HTTPMethod.GET,
                handler_path="filters.get_ministries_filter",
                route_type=RouteType.PUBLIC,
                description="Filtres ministères",
                cache_ttl=7200,
                tags=["filters", "ministries"]
            ),

            "GET /api/v1/filters/service-types": RouteConfig(
                path="/filters/service-types",
                method=HTTPMethod.GET,
                handler_path="filters.get_service_types_filter",
                route_type=RouteType.PUBLIC,
                description="Types de services fiscaux",
                cache_ttl=7200,
                tags=["filters", "types"]
            ),

            "GET /api/v1/filters/categories": RouteConfig(
                path="/filters/categories",
                method=HTTPMethod.GET,
                handler_path="filters.get_categories_filter",
                route_type=RouteType.PUBLIC,
                description="Filtres catégories",
                cache_ttl=7200,
                tags=["filters", "categories"]
            ),

            "POST /api/v1/search/advanced": RouteConfig(
                path="/search/advanced",
                method=HTTPMethod.POST,
                handler_path="search.advanced_search",
                route_type=RouteType.PUBLIC,
                description="Recherche avancée avec critères multiples",
                rate_limit=RateLimit(requests=100, window_seconds=3600),
                request_schema="AdvancedSearchRequest",
                tags=["search", "advanced"]
            )
        }

        self._register_service("search", search_routes)

    async def _register_i18n_services(self):
        """Localisation et traductions (1,854 traductions)"""
        i18n_routes = {
            "GET /api/v1/translations/{lang}": RouteConfig(
                path="/translations/{lang}",
                method=HTTPMethod.GET,
                handler_path="i18n.get_translations_by_language",
                route_type=RouteType.PUBLIC,
                description="Traductions par langue (es/fr/en)",
                cache_ttl=14400,
                tags=["i18n", "translations"]
            ),

            "GET /api/v1/languages": RouteConfig(
                path="/languages",
                method=HTTPMethod.GET,
                handler_path="i18n.get_supported_languages",
                route_type=RouteType.PUBLIC,
                description="Langues supportées",
                cache_ttl=86400,
                tags=["i18n", "languages"]
            ),

            "GET /api/v1/i18n/{page}/{lang}": RouteConfig(
                path="/i18n/{page}/{lang}",
                method=HTTPMethod.GET,
                handler_path="i18n.get_page_translations",
                route_type=RouteType.PUBLIC,
                description="Traductions par page",
                cache_ttl=7200,
                tags=["i18n", "pages"]
            ),

            "GET /api/v1/translations/service/{service_id}/{lang}": RouteConfig(
                path="/translations/service/{service_id}/{lang}",
                method=HTTPMethod.GET,
                handler_path="i18n.get_service_translations",
                route_type=RouteType.PUBLIC,
                description="Traductions d'un service",
                cache_ttl=3600,
                tags=["i18n", "services"]
            ),

            "POST /api/v1/translations/missing": RouteConfig(
                path="/translations/missing",
                method=HTTPMethod.POST,
                handler_path="i18n.report_missing_translation",
                route_type=RouteType.AUTHENTICATED,
                description="Signaler traduction manquante",
                rate_limit=RateLimit(requests=10, window_seconds=3600),
                tags=["i18n", "feedback"]
            )
        }

        self._register_service("i18n", i18n_routes)

    async def _register_invoices_services(self):
        """Invoices et facturation"""
        invoices_routes = {
            "GET /api/v1/invoices": RouteConfig(
                path="/invoices",
                method=HTTPMethod.GET,
                handler_path="invoices.get_user_invoices",
                route_type=RouteType.AUTHENTICATED,
                description="Factures utilisateur",
                tags=["invoices", "user"]
            ),

            "GET /api/v1/invoices/{invoice_id}": RouteConfig(
                path="/invoices/{invoice_id}",
                method=HTTPMethod.GET,
                handler_path="invoices.get_invoice_detail",
                route_type=RouteType.AUTHENTICATED,
                description="Détail facture",
                tags=["invoices", "details"]
            ),

            "GET /api/v1/invoices/{invoice_id}/pdf": RouteConfig(
                path="/invoices/{invoice_id}/pdf",
                method=HTTPMethod.GET,
                handler_path="invoices.download_invoice_pdf",
                route_type=RouteType.AUTHENTICATED,
                description="Téléchargement PDF facture",
                tags=["invoices", "pdf"]
            ),

            "POST /api/v1/invoices": RouteConfig(
                path="/invoices",
                method=HTTPMethod.POST,
                handler_path="invoices.create_invoice",
                route_type=RouteType.AUTHENTICATED,
                description="Créer facture",
                rate_limit=RateLimit(requests=30, window_seconds=3600),
                request_schema="CreateInvoiceRequest",
                tags=["invoices", "create"]
            ),

            "PUT /api/v1/invoices/{invoice_id}/pay": RouteConfig(
                path="/invoices/{invoice_id}/pay",
                method=HTTPMethod.PUT,
                handler_path="invoices.mark_invoice_paid",
                route_type=RouteType.AUTHENTICATED,
                description="Marquer facture comme payée",
                tags=["invoices", "payment"]
            )
        }

        self._register_service("invoices", invoices_routes)

    async def _register_business_services(self):
        """Business et gestion d'équipe"""
        business_routes = {
            "GET /api/v1/business/dashboard": RouteConfig(
                path="/business/dashboard",
                method=HTTPMethod.GET,
                handler_path="business.get_business_dashboard",
                route_type=RouteType.AUTHENTICATED,
                description="Dashboard business multi-utilisateurs",
                permissions=["business:dashboard:read"],
                cache_ttl=600,
                tags=["business", "dashboard"]
            ),

            "GET /api/v1/business/team": RouteConfig(
                path="/business/team",
                method=HTTPMethod.GET,
                handler_path="business.get_team_members",
                route_type=RouteType.AUTHENTICATED,
                description="Membres de l'équipe",
                permissions=["business:team:read"],
                tags=["business", "team"]
            ),

            "POST /api/v1/business/team": RouteConfig(
                path="/business/team",
                method=HTTPMethod.POST,
                handler_path="business.add_team_member",
                route_type=RouteType.AUTHENTICATED,
                description="Ajouter membre équipe",
                permissions=["business:team:create"],
                rate_limit=RateLimit(requests=20, window_seconds=3600),
                request_schema="AddTeamMemberRequest",
                tags=["business", "team"]
            ),

            "GET /api/v1/business/accounting": RouteConfig(
                path="/business/accounting",
                method=HTTPMethod.GET,
                handler_path="business.get_accounting_data",
                route_type=RouteType.AUTHENTICATED,
                description="Données comptables",
                permissions=["business:accounting:read"],
                cache_ttl=1800,
                tags=["business", "accounting"]
            ),

            "POST /api/v1/business/declarations/bulk": RouteConfig(
                path="/business/declarations/bulk",
                method=HTTPMethod.POST,
                handler_path="business.create_bulk_declarations",
                route_type=RouteType.AUTHENTICATED,
                description="Déclarations groupées",
                permissions=["business:declarations:bulk"],
                rate_limit=RateLimit(requests=5, window_seconds=3600),
                request_schema="BulkDeclarationsRequest",
                tags=["business", "declarations"]
            )
        }

        self._register_service("business", business_routes)

    def _register_service(self, service_name: str, routes: Dict[str, RouteConfig]):
        """Enregistrer un service avec ses routes"""
        self.services[service_name] = routes
        for route_key, route_config in routes.items():
            self.routes[route_key] = route_config

    def get_all_routes(self) -> Dict[str, RouteConfig]:
        """Obtenir toutes les routes enregistrées"""
        return self.routes

    def get_services_count(self) -> int:
        """Nombre de services enregistrés"""
        return len(self.services)

    def get_routes_by_service(self, service_name: str) -> Dict[str, RouteConfig]:
        """Obtenir routes d'un service spécifique"""
        return self.services.get(service_name, {})

    def get_routes_by_type(self, route_type: RouteType) -> Dict[str, RouteConfig]:
        """Obtenir routes par type"""
        return {
            key: route for key, route in self.routes.items()
            if route.route_type == route_type
        }

    def find_route(self, method: str, path: str) -> Optional[RouteConfig]:
        """Trouver une route par méthode et chemin"""
        route_key = f"{method.upper()} {path}"
        return self.routes.get(route_key)

    def load_handler(self, handler_path: str) -> Callable:
        """Charger dynamiquement un handler depuis son chemin"""
        try:
            module_path, function_name = handler_path.rsplit('.', 1)
            module = importlib.import_module(f"app.handlers.{module_path}")
            return getattr(module, function_name)
        except Exception as e:
            logger.error(f"Failed to load handler {handler_path}: {e}")
            raise ImportError(f"Cannot load handler: {handler_path}")

    def get_route_stats(self) -> Dict[str, Any]:
        """Statistiques du registre"""
        route_types_count = {}
        for route in self.routes.values():
            route_type = route.route_type.value
            route_types_count[route_type] = route_types_count.get(route_type, 0) + 1

        return {
            "total_routes": len(self.routes),
            "total_services": len(self.services),
            "routes_by_type": route_types_count,
            "authenticated_routes": len(self.get_routes_by_type(RouteType.AUTHENTICATED)),
            "admin_routes": len(self.get_routes_by_type(RouteType.ADMIN)),
            "public_routes": len(self.get_routes_by_type(RouteType.PUBLIC))
        }