"""Email Template Service - Business logic for email template management"""

from typing import Optional, List, Dict, Any
from loguru import logger
import asyncpg
import os
from pathlib import Path
from fastapi import HTTPException, status

from ..repositories.email_template_repository import EmailTemplateRepository
from ..models.email_template import (
    EmailTemplateCreate,
    EmailTemplateUpdate,
    EmailTemplateResponse,
)


class EmailTemplateService:
    """Service for email template operations with HTML file management"""

    def __init__(self):
        self.repository = EmailTemplateRepository()
        # Base directory for email templates
        # Path: packages/backend/templates/emails/
        self.templates_dir = Path(__file__).parent.parent.parent.parent / "templates" / "emails"

    def _ensure_templates_directory(self):
        """Ensure the templates directory exists"""
        self.templates_dir.mkdir(parents=True, exist_ok=True)

    def _get_template_file_path(self, template_code: str) -> Path:
        """Get the full path for a template HTML file"""
        return self.templates_dir / f"{template_code}.html"

    def _get_relative_path(self, template_code: str) -> str:
        """Get the relative path to store in database"""
        return f"templates/emails/{template_code}.html"

    async def create_template(
        self, db: asyncpg.Connection, template_data: EmailTemplateCreate, user_id: int
    ) -> EmailTemplateResponse:
        """
        Create a new email template
        - Validates template code is unique
        - Saves HTML content to file
        - Creates database record
        """
        # Check if template code already exists
        existing = await self.repository.get_by_code(db, template_data.template_code)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Template with code '{template_data.template_code}' already exists",
            )

        # Ensure templates directory exists
        self._ensure_templates_directory()

        # Save HTML content to file
        html_file_path = self._get_template_file_path(template_data.template_code)
        try:
            with open(html_file_path, "w", encoding="utf-8") as f:
                f.write(template_data.html_content)
        except Exception as e:
            logger.error(f"Failed to save HTML template file: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to save template file",
            )

        # Prepare data for database
        db_data = template_data.model_dump(exclude={"html_content"})
        db_data["html_file_path"] = self._get_relative_path(template_data.template_code)

        # Create database record
        try:
            result = await self.repository.create(db, db_data, user_id)
            return EmailTemplateResponse(**result)
        except Exception as e:
            # Rollback: delete the HTML file if database creation fails
            if html_file_path.exists():
                html_file_path.unlink()
            logger.error(f"Failed to create template in database: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create template",
            )

    async def get_template(
        self, db: asyncpg.Connection, template_id: int
    ) -> Optional[EmailTemplateResponse]:
        """Get email template by ID"""
        result = await self.repository.get_by_id(db, template_id)
        if not result:
            return None
        return EmailTemplateResponse(**result)

    async def get_template_by_code(
        self, db: asyncpg.Connection, template_code: str
    ) -> Optional[EmailTemplateResponse]:
        """Get email template by code"""
        result = await self.repository.get_by_code(db, template_code)
        if not result:
            return None
        return EmailTemplateResponse(**result)

    async def get_template_html(
        self, db: asyncpg.Connection, template_id: int
    ) -> Optional[str]:
        """Get HTML content for a template"""
        template = await self.repository.get_by_id(db, template_id)
        if not template:
            return None

        html_file_path = self._get_template_file_path(template["template_code"])

        if not html_file_path.exists():
            logger.warning(f"Template HTML file not found: {html_file_path}")
            return None

        try:
            with open(html_file_path, "r", encoding="utf-8") as f:
                return f.read()
        except Exception as e:
            logger.error(f"Failed to read template HTML file: {e}")
            return None

    async def list_templates(
        self,
        db: asyncpg.Connection,
        category: Optional[str] = None,
        is_active: Optional[bool] = None,
        page: int = 1,
        page_size: int = 50,
    ) -> tuple[List[EmailTemplateResponse], int]:
        """List email templates with pagination"""
        offset = (page - 1) * page_size
        templates, total = await self.repository.list(
            db, category=category, is_active=is_active, limit=page_size, offset=offset
        )

        return [EmailTemplateResponse(**t) for t in templates], total

    async def search_templates(
        self,
        db: asyncpg.Connection,
        search_term: str,
        page: int = 1,
        page_size: int = 50,
    ) -> tuple[List[EmailTemplateResponse], int]:
        """Search email templates"""
        offset = (page - 1) * page_size
        templates, total = await self.repository.search(
            db, search_term=search_term, limit=page_size, offset=offset
        )

        return [EmailTemplateResponse(**t) for t in templates], total

    async def update_template(
        self,
        db: asyncpg.Connection,
        template_id: int,
        template_data: EmailTemplateUpdate,
        user_id: int,
    ) -> Optional[EmailTemplateResponse]:
        """
        Update email template
        - Updates database record
        - Updates HTML file if html_content provided
        """
        # Check if template exists
        existing = await self.repository.get_by_id(db, template_id)
        if not existing:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Template with ID {template_id} not found",
            )

        # Update HTML file if html_content is provided
        if template_data.html_content:
            html_file_path = self._get_template_file_path(existing["template_code"])
            try:
                with open(html_file_path, "w", encoding="utf-8") as f:
                    f.write(template_data.html_content)
            except Exception as e:
                logger.error(f"Failed to update HTML template file: {e}")
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Failed to update template file",
                )

        # Prepare data for database (exclude html_content)
        db_data = template_data.model_dump(exclude_unset=True, exclude={"html_content"})

        # Update database record
        result = await self.repository.update(db, template_id, db_data, user_id)
        if not result:
            return None

        return EmailTemplateResponse(**result)

    async def delete_template(
        self, db: asyncpg.Connection, template_id: int
    ) -> bool:
        """
        Delete email template
        - Deletes database record
        - Deletes HTML file
        """
        # Get template to find HTML file
        template = await self.repository.get_by_id(db, template_id)
        if not template:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Template with ID {template_id} not found",
            )

        # Delete database record
        success = await self.repository.delete(db, template_id)

        if success:
            # Delete HTML file
            html_file_path = self._get_template_file_path(template["template_code"])
            if html_file_path.exists():
                try:
                    html_file_path.unlink()
                except Exception as e:
                    logger.warning(f"Failed to delete HTML file: {e}")

        return success

    async def get_templates_by_category(
        self, db: asyncpg.Connection, category: str
    ) -> List[EmailTemplateResponse]:
        """Get all active templates in a category"""
        templates = await self.repository.get_by_category(db, category)
        return [EmailTemplateResponse(**t) for t in templates]
