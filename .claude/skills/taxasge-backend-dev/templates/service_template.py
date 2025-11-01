"""
Template Service Métier - Business Logic Layer
===============================================

Usage:
1. Copier ce fichier vers app/services/{module}_service.py
2. Remplacer {MODULE} par nom module (ex: declarations)
3. Remplacer {Module} par nom classe (ex: Declaration)
4. Implémenter business rules spécifiques
5. Ajouter validations métier

Source: .github/docs-internal/Documentations/Backend/ARCHITECTURE.md
"""

from typing import List, Optional, Dict, Any
from datetime import datetime
from app.database.repositories.{module}_repository import {Module}Repository
from app.core.errors import (
    ValidationError,
    ResourceNotFoundError,
    BusinessRuleError,
    UnauthorizedError
)
from app.schemas.{module} import {Module}Create, {Module}Update
from app.models.{module} import {Module}
from app.core.events import EventBus
from app.core.cache import cache_manager


class {Module}Service:
    """
    Service {module} - Business Logic Layer.
    
    Responsabilités:
    - Validations métier
    - Orchestration opérations complexes
    - Gestion workflow (draft → submitted → approved)
    - Notifications
    - Cache
    
    Source: .github/docs-internal/Documentations/Backend/ARCHITECTURE.md
    """
    
    def __init__(self, repository: {Module}Repository = None):
        """
        Initialiser service.
        
        Args:
            repository: Repository {module} (injection dépendance)
        """
        self.repo = repository or {Module}Repository()
        self.event_bus = EventBus()
        self.cache = cache_manager
    
    # ========================================
    # CRUD OPERATIONS
    # ========================================
    
    async def create(
        self,
        data: {Module}Create,
        user_id: int
    ) -> {Module}:
        """
        Créer {module} avec validations métier.
        
        Source: .github/docs-internal/Documentations/Backend/API_REFERENCE.md
        
        Business Rules:
        1. [Règle métier 1]
        2. [Règle métier 2]
        3. [Règle métier 3]
        
        Args:
            data: Données création
            user_id: ID utilisateur créateur
        
        Returns:
            {Module} créé
        
        Raises:
            ValidationError: Si validation métier échoue
            BusinessRuleError: Si règle métier violée
        """
        # Validations métier
        await self._validate_creation_rules(data, user_id)
        
        # Enrichir données
        enriched_data = await self._enrich_creation_data(data, user_id)
        
        # Créer via repository
        {module} = await self.repo.create(enriched_data)
        
        # Actions post-création
        await self._post_creation_actions({module})
        
        return {module}
    
    async def get_by_id(self, id: int) -> {Module}:
        """
        Récupérer {module} par ID avec cache.
        
        Args:
            id: ID {module}
        
        Returns:
            {Module} trouvé
        
        Raises:
            ResourceNotFoundError: Si {module} non trouvé
        """
        # Vérifier cache
        cache_key = f"{module}:{id}"
        cached = await self.cache.get(cache_key)
        if cached:
            return cached
        
        # Récupérer depuis DB
        {module} = await self.repo.get_by_id(id)
        
        # Mettre en cache (TTL: 5 minutes)
        await self.cache.set(cache_key, {module}, ttl=300)
        
        return {module}
    
    async def list(
        self,
        filters: Dict[str, Any] = None,
        skip: int = 0,
        limit: int = 100
    ) -> List[{Module}]:
        """
        Lister {module}s avec filtres.
        
        Args:
            filters: Filtres dynamiques
            skip: Offset pagination
            limit: Limite résultats
        
        Returns:
            Liste {module}s
        """
        return await self.repo.list(
            filters=filters,
            skip=skip,
            limit=limit
        )
    
    async def count(self, filters: Dict[str, Any] = None) -> int:
        """
        Compter {module}s avec filtres.
        
        Args:
            filters: Filtres dynamiques
        
        Returns:
            Nombre total {module}s
        """
        return await self.repo.count(filters=filters)
    
    async def update(
        self,
        id: int,
        data: {Module}Update,
        user_id: int
    ) -> {Module}:
        """
        Mettre à jour {module} avec validations.
        
        Business Rules:
        1. Certains champs non modifiables après soumission
        2. [Autres règles métier]
        
        Args:
            id: ID {module}
            data: Données mise à jour
            user_id: ID utilisateur modifiant
        
        Returns:
            {Module} mis à jour
        
        Raises:
            ResourceNotFoundError: Si {module} non trouvé
            BusinessRuleError: Si règle métier violée
        """
        # Récupérer existant
        existing = await self.get_by_id(id)
        
        # Validations métier
        await self._validate_update_rules(existing, data, user_id)
        
        # Mettre à jour via repository
        updated = await self.repo.update(id, data)
        
        # Invalider cache
        await self.cache.delete(f"{module}:{id}")
        
        # Actions post-mise à jour
        await self._post_update_actions(existing, updated)
        
        return updated
    
    async def delete(self, id: int, user_id: int) -> bool:
        """
        Supprimer {module} (soft delete).
        
        Business Rules:
        1. Suppression uniquement si status != "approved"
        2. [Autres règles métier]
        
        Args:
            id: ID {module}
            user_id: ID utilisateur supprimant
        
        Returns:
            True si supprimé
        
        Raises:
            ResourceNotFoundError: Si {module} non trouvé
            BusinessRuleError: Si règle métier violée
        """
        # Récupérer existant
        existing = await self.get_by_id(id)
        
        # Validations métier
        await self._validate_deletion_rules(existing, user_id)
        
        # Soft delete
        await self.repo.soft_delete(id)
        
        # Invalider cache
        await self.cache.delete(f"{module}:{id}")
        
        # Actions post-suppression
        await self._post_deletion_actions(existing)
        
        return True
    
    # ========================================
    # WORKFLOW OPERATIONS
    # ========================================
    
    async def submit(self, id: int, user_id: int) -> {Module}:
        """
        Soumettre {module} pour validation.
        
        Workflow: draft → submitted
        
        Business Rules:
        1. Tous champs requis doivent être remplis
        2. Status doit être "draft"
        3. Utilisateur doit être propriétaire
        
        Args:
            id: ID {module}
            user_id: ID utilisateur soumettant
        
        Returns:
            {Module} soumis
        
        Raises:
            BusinessRuleError: Si règle workflow violée
        """
        # Récupérer {module}
        {module} = await self.get_by_id(id)
        
        # Vérifier ownership
        if {module}.user_id != user_id:
            raise UnauthorizedError("Not owner of this {module}")
        
        # Vérifier status
        if {module}.status != "draft":
            raise BusinessRuleError(
                f"{Module} already submitted (status: {{{module}.status}})"
            )
        
        # Valider complétude
        await self._validate_completeness({module})
        
        # Mettre à jour status
        {module}.status = "submitted"
        {module}.submitted_at = datetime.utcnow()
        await self.repo.update(id, {module})
        
        # Invalider cache
        await self.cache.delete(f"{module}:{id}")
        
        # Notifications
        await self._notify_agents_new_submission({module})
        
        # Event
        await self.event_bus.publish(
            "{module}.submitted",
            {{"id": id, "user_id": user_id}}
        )
        
        return {module}
    
    # ========================================
    # VALIDATIONS MÉTIER (Private)
    # ========================================
    
    async def _validate_creation_rules(
        self,
        data: {Module}Create,
        user_id: int
    ):
        """
        Valider règles métier création.
        
        Raises:
            ValidationError: Si validation échoue
            BusinessRuleError: Si règle métier violée
        """
        # Exemple: Vérifier quota utilisateur
        user_count = await self.repo.count({{"user_id": user_id}})
        if user_count >= 100:
            raise BusinessRuleError(
                f"User has reached maximum {module}s (100)"
            )
    
    async def _enrich_creation_data(
        self,
        data: {Module}Create,
        user_id: int
    ) -> Dict[str, Any]:
        """Enrichir données création."""
        enriched = data.dict()
        enriched.update({{
            "user_id": user_id,
            "status": "draft",
            "created_at": datetime.utcnow(),
        }})
        return enriched
    
    async def _post_creation_actions(self, {module}: {Module}):
        """Actions après création."""
        pass
    
    async def _validate_update_rules(
        self,
        existing: {Module},
        data: {Module}Update,
        user_id: int
    ):
        """Valider règles métier mise à jour."""
        pass
    
    async def _post_update_actions(self, old: {Module}, new: {Module}):
        """Actions après mise à jour."""
        pass
    
    async def _validate_deletion_rules(self, existing: {Module}, user_id: int):
        """Valider règles métier suppression."""
        if existing.status == "approved":
            raise BusinessRuleError("Cannot delete approved {module}")
    
    async def _post_deletion_actions(self, {module}: {Module}):
        """Actions après suppression."""
        pass
    
    async def _validate_completeness(self, {module}: {Module}):
        """Valider complétude avant soumission."""
        pass
    
    async def _notify_agents_new_submission(self, {module}: {Module}):
        """Notifier agents nouvelle soumission."""
        pass
