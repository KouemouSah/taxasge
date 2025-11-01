"""
Template Repository - Data Access Layer
========================================

Usage:
1. Copier vers app/database/repositories/{module}_repository.py
2. Remplacer {MODULE} et {Module}
3. Adapter queries selon besoins
4. Vérifier database/schema.sql pour colonnes

Source: database/schema.sql
"""

from typing import List, Optional, Dict, Any
from sqlalchemy import select, update, func, or_
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import Depends
from app.models.{module} import {Module}
from app.database.connection import get_db
from app.core.errors import ResourceNotFoundError
from datetime import datetime


class {Module}Repository:
    """
    Repository {module} - Data Access Layer.
    
    Source: database/schema.sql
    """
    
    def __init__(self, db: AsyncSession = Depends(get_db)):
        self.db = db
    
    async def create(self, data: Dict[str, Any]) -> {Module}:
        """Créer {module}."""
        entity = {Module}(**data)
        self.db.add(entity)
        await self.db.flush()
        await self.db.refresh(entity)
        return entity
    
    async def get_by_id(self, id: int) -> {Module}:
        """Récupérer {module} par ID."""
        query = select({Module}).where({Module}.id == id)
        result = await self.db.execute(query)
        entity = result.scalar_one_or_none()
        
        if not entity:
            raise ResourceNotFoundError(
                resource="{Module}",
                identifier=str(id)
            )
        return entity
    
    async def list(
        self,
        filters: Dict[str, Any] = None,
        skip: int = 0,
        limit: int = 100
    ) -> List[{Module}]:
        """Lister {module}s avec filtres."""
        query = select({Module})
        
        if filters:
            query = self._apply_filters(query, filters)
        
        query = query.offset(skip).limit(limit)
        result = await self.db.execute(query)
        return result.scalars().all()
    
    async def count(self, filters: Dict[str, Any] = None) -> int:
        """Compter {module}s."""
        query = select(func.count({Module}.id))
        
        if filters:
            query = self._apply_filters(query, filters)
        
        result = await self.db.execute(query)
        return result.scalar_one()
    
    async def update(self, id: int, data: Dict[str, Any]) -> {Module}:
        """Mettre à jour {module}."""
        entity = await self.get_by_id(id)
        
        for key, value in data.items():
            if hasattr(entity, key):
                setattr(entity, key, value)
        
        entity.updated_at = datetime.utcnow()
        await self.db.flush()
        await self.db.refresh(entity)
        return entity
    
    async def soft_delete(self, id: int) -> {Module}:
        """Supprimer {module} (soft delete)."""
        entity = await self.get_by_id(id)
        entity.deleted_at = datetime.utcnow()
        await self.db.flush()
        await self.db.refresh(entity)
        return entity
    
    def _apply_filters(self, query, filters: Dict[str, Any]):
        """Appliquer filtres dynamiques."""
        for field, value in filters.items():
            if hasattr({Module}, field):
                column = getattr({Module}, field)
                if value is None:
                    query = query.where(column.is_(None))
                elif isinstance(value, list):
                    query = query.where(column.in_(value))
                else:
                    query = query.where(column == value)
        
        if hasattr({Module}, "deleted_at"):
            query = query.where({Module}.deleted_at.is_(None))
        
        return query
