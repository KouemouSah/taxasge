"""
Company Repository - Data access layer for companies and user_company_roles

ALIGNED WITH DATABASE_SCHEMA_REFERENCE.md
Tables: companies, user_company_roles

IMPORTANT NOTES:
- companies table does NOT have owner_user_id column
- Owner is tracked via user_company_roles with role=company_owner
- user_company_roles has composite PK: (user_id, company_id)
- Field names: legal_name (not name), assigned_at (not added_at)
"""

from typing import Optional, List, Dict, Any
from loguru import logger
import asyncpg

from app.modules.companies.models import CompanyCreate, CompanyUpdate, CompanyMemberRole


class CompanyRepository:
    """Repository for companies and members - ALIGNED WITH DB SCHEMA"""

    async def create(self, conn: asyncpg.Connection, company: CompanyCreate, owner_id: str) -> Dict[str, Any]:
        """
        Create company

        ALIGNED WITH DATABASE_SCHEMA_REFERENCE.md
        Note: owner_user_id does NOT exist in companies table.
        Owner is tracked via user_company_roles with role=company_owner
        """
        query = """
            INSERT INTO companies (
                legal_name, tax_id, trade_name, primary_sector_id,
                email, phone, address, city,
                is_active, is_verified,
                created_at, updated_at
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
            RETURNING *
        """
        result = await conn.fetchrow(
            query,
            company.legal_name,
            company.tax_id,
            company.trade_name,
            company.primary_sector_id,
            company.email,
            company.phone,
            company.address,
            company.city,
            company.is_active,
            company.is_verified
        )

        # Add owner as member with company_owner role
        await self.add_member(conn, dict(result)["id"], owner_id, CompanyMemberRole.COMPANY_OWNER)

        return dict(result)

    async def get_by_id(self, conn: asyncpg.Connection, company_id: str) -> Optional[Dict[str, Any]]:
        """Get company by ID"""
        query = """
            SELECT c.*, COUNT(ucr.user_id) as member_count
            FROM companies c
            LEFT JOIN user_company_roles ucr ON c.id = ucr.company_id
            WHERE c.id = $1
            GROUP BY c.id
        """
        result = await conn.fetchrow(query, company_id)
        return dict(result) if result else None

    async def list_by_user(self, conn: asyncpg.Connection, user_id: str, limit: int = 50, offset: int = 0) -> tuple[List[Dict[str, Any]], int]:
        """List companies where user is member"""
        count_query = """
            SELECT COUNT(DISTINCT c.id)
            FROM companies c
            JOIN user_company_roles ucr ON c.id = ucr.company_id
            WHERE ucr.user_id = $1
        """
        total = await conn.fetchval(count_query, user_id)

        data_query = """
            SELECT c.*, COUNT(ucr2.user_id) as member_count
            FROM companies c
            JOIN user_company_roles ucr ON c.id = ucr.company_id
            LEFT JOIN user_company_roles ucr2 ON c.id = ucr2.company_id
            WHERE ucr.user_id = $1
            GROUP BY c.id
            ORDER BY c.created_at DESC
            LIMIT $2 OFFSET $3
        """
        results = await conn.fetch(data_query, user_id, limit, offset)
        return [dict(r) for r in results], total

    async def update(self, conn: asyncpg.Connection, company_id: str, update_data: CompanyUpdate) -> Optional[Dict[str, Any]]:
        """Update company"""
        updates = []
        params = [company_id]
        param_idx = 2

        for field, value in update_data.dict(exclude_unset=True).items():
            if value is not None:
                updates.append(f"{field} = ${param_idx}")
                params.append(value)
                param_idx += 1

        if not updates:
            return await self.get_by_id(conn, company_id)

        updates.append(f"updated_at = ${param_idx}")
        params.append("NOW()")

        query = f"UPDATE companies SET {', '.join(updates)} WHERE id = $1 RETURNING *"
        result = await conn.fetchrow(query, *params)
        return dict(result) if result else None

    async def delete(self, conn: asyncpg.Connection, company_id: str) -> bool:
        """Delete company and members"""
        await conn.execute("DELETE FROM user_company_roles WHERE company_id = $1", company_id)
        result = await conn.execute("DELETE FROM companies WHERE id = $1", company_id)
        return result == "DELETE 1"

    async def add_member(self, conn: asyncpg.Connection, company_id: str, user_id: str, role: CompanyMemberRole) -> Dict[str, Any]:
        """
        Add member to company

        ALIGNED WITH DATABASE_SCHEMA_REFERENCE.md
        Table: user_company_roles
        Composite PK: (user_id, company_id)
        """
        query = """
            INSERT INTO user_company_roles (company_id, user_id, role, is_active, assigned_at)
            VALUES ($1, $2, $3, TRUE, NOW())
            ON CONFLICT (user_id, company_id) DO UPDATE SET role = $3, is_active = TRUE
            RETURNING *
        """
        result = await conn.fetchrow(query, company_id, user_id, role.value)
        return dict(result)

    async def remove_member(self, conn: asyncpg.Connection, company_id: str, user_id: str) -> bool:
        """Remove member from company"""
        result = await conn.execute(
            "DELETE FROM user_company_roles WHERE company_id = $1 AND user_id = $2",
            company_id, user_id
        )
        return result == "DELETE 1"

    async def get_members(self, conn: asyncpg.Connection, company_id: str) -> List[Dict[str, Any]]:
        """
        Get company members

        ALIGNED WITH DATABASE_SCHEMA_REFERENCE.md
        Table: user_company_roles
        """
        query = """
            SELECT ucr.*, u.email as user_email, u.first_name || ' ' || u.last_name as user_name
            FROM user_company_roles ucr
            JOIN users u ON ucr.user_id = u.id
            WHERE ucr.company_id = $1
            ORDER BY ucr.assigned_at
        """
        results = await conn.fetch(query, company_id)
        return [dict(r) for r in results]

    async def check_membership(self, conn: asyncpg.Connection, company_id: str, user_id: str) -> Optional[str]:
        """Check if user is member and return role"""
        result = await conn.fetchval(
            "SELECT role FROM user_company_roles WHERE company_id = $1 AND user_id = $2",
            company_id, user_id
        )
        return result
