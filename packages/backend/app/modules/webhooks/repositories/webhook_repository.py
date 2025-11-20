"""
Webhook Repository - Bank transactions and configurations

Handles:
- bank_configurations table
- bank_transactions table
- Reconciliation avec module PAYMENTS
"""

from typing import Optional, List, Dict, Any
from loguru import logger
import asyncpg

from app.modules.webhooks.models import (
    BankConfigurationCreate,
    BankConfigurationUpdate,
    BankTransactionCreate,
)


class WebhookRepository:
    """Repository for webhooks and bank transactions"""

    # ========== BANK CONFIGURATIONS ==========

    async def create_bank_config(
        self, conn: asyncpg.Connection, config: BankConfigurationCreate
    ) -> Dict[str, Any]:
        """Create bank configuration (admin only)"""
        query = """
            INSERT INTO bank_configurations (
                bank_code, bank_name, api_endpoint, api_version,
                api_key_encrypted, webhook_secret, treasury_account_number,
                is_active, supports_webhooks, supports_direct_integration,
                created_at, updated_at
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
            RETURNING *
        """
        result = await conn.fetchrow(
            query,
            config.bank_code.value,
            config.bank_name,
            config.api_endpoint,
            config.api_version,
            config.api_key_encrypted,
            config.webhook_secret,
            config.treasury_account_number,
            config.is_active,
            config.supports_webhooks,
            config.supports_direct_integration,
        )
        return dict(result)

    async def get_bank_config_by_code(
        self, conn: asyncpg.Connection, bank_code: str
    ) -> Optional[Dict[str, Any]]:
        """Get bank configuration by code"""
        result = await conn.fetchrow(
            "SELECT * FROM bank_configurations WHERE bank_code = $1", bank_code
        )
        return dict(result) if result else None

    async def list_bank_configs(
        self, conn: asyncpg.Connection, active_only: bool = True
    ) -> List[Dict[str, Any]]:
        """List bank configurations"""
        if active_only:
            query = "SELECT * FROM bank_configurations WHERE is_active = true ORDER BY bank_name"
        else:
            query = "SELECT * FROM bank_configurations ORDER BY bank_name"

        results = await conn.fetch(query)
        return [dict(r) for r in results]

    async def update_bank_config(
        self, conn: asyncpg.Connection, config_id: int, update_data: BankConfigurationUpdate
    ) -> Optional[Dict[str, Any]]:
        """Update bank configuration"""
        updates = []
        params = [config_id]
        param_idx = 2

        for field, value in update_data.dict(exclude_unset=True).items():
            if value is not None:
                updates.append(f"{field} = ${param_idx}")
                params.append(value)
                param_idx += 1

        if not updates:
            result = await conn.fetchrow("SELECT * FROM bank_configurations WHERE id = $1", config_id)
            return dict(result) if result else None

        updates.append("updated_at = NOW()")

        query = f"UPDATE bank_configurations SET {', '.join(updates)} WHERE id = $1 RETURNING *"
        result = await conn.fetchrow(query, *params)
        return dict(result) if result else None

    # ========== BANK TRANSACTIONS ==========

    async def create_bank_transaction(
        self, conn: asyncpg.Connection, transaction: BankTransactionCreate
    ) -> Dict[str, Any]:
        """Create bank transaction (from webhook)"""
        query = """
            INSERT INTO bank_transactions (
                bank_code, bank_reference, bank_transaction_date,
                amount, currency, account_number, account_holder_name,
                status, raw_data, created_at
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, 'unreconciled', $8, NOW())
            RETURNING *
        """
        result = await conn.fetchrow(
            query,
            transaction.bank_code.value,
            transaction.bank_reference,
            transaction.bank_transaction_date,
            transaction.amount,
            transaction.currency,
            transaction.account_number,
            transaction.account_holder_name,
            transaction.raw_data,
        )
        return dict(result)

    async def get_by_bank_reference(
        self, conn: asyncpg.Connection, bank_code: str, bank_reference: str
    ) -> Optional[Dict[str, Any]]:
        """Get transaction by bank reference (idempotency)"""
        query = """
            SELECT * FROM bank_transactions
            WHERE bank_code = $1 AND bank_reference = $2
        """
        result = await conn.fetchrow(query, bank_code, bank_reference)
        return dict(result) if result else None

    async def get_transaction_by_id(
        self, conn: asyncpg.Connection, transaction_id: str
    ) -> Optional[Dict[str, Any]]:
        """Get transaction by ID with related data"""
        query = """
            SELECT
                bt.*,
                p.bank_reference as payment_reference,
                u.email as user_email
            FROM bank_transactions bt
            LEFT JOIN payments p ON bt.payment_id = p.id
            LEFT JOIN users u ON p.user_id = u.id
            WHERE bt.id = $1
        """
        result = await conn.fetchrow(query, transaction_id)
        return dict(result) if result else None

    async def list_unreconciled(
        self, conn: asyncpg.Connection, limit: int = 50, offset: int = 0
    ) -> tuple[List[Dict[str, Any]], int]:
        """List unreconciled transactions"""
        count_query = "SELECT COUNT(*) FROM bank_transactions WHERE status = 'unreconciled'"
        total = await conn.fetchval(count_query)

        data_query = """
            SELECT
                bt.*,
                p.bank_reference as payment_reference,
                u.email as user_email
            FROM bank_transactions bt
            LEFT JOIN payments p ON bt.payment_id = p.id
            LEFT JOIN users u ON p.user_id = u.id
            WHERE bt.status = 'unreconciled'
            ORDER BY bt.bank_transaction_date DESC
            LIMIT $1 OFFSET $2
        """
        results = await conn.fetch(data_query, limit, offset)
        return [dict(r) for r in results], total

    async def reconcile(
        self, conn: asyncpg.Connection, transaction_id: str, payment_id: str, reconciled_by: str
    ) -> Dict[str, Any]:
        """
        Reconcile bank transaction with payment

        IMPORTANT: Cohérence bidirectionnelle avec module PAYMENTS
        - Met à jour bank_transactions.payment_id
        - Met à jour payments.bank_transaction_id
        """
        # Update bank_transaction
        tx_query = """
            UPDATE bank_transactions
            SET payment_id = $2, status = 'reconciled',
                reconciled_at = NOW(), reconciled_by = $3
            WHERE id = $1
            RETURNING *
        """
        tx_result = await conn.fetchrow(tx_query, transaction_id, payment_id, reconciled_by)

        if not tx_result:
            raise ValueError(f"Transaction {transaction_id} not found")

        # Update payment (bidirectional link)
        payment_query = """
            UPDATE payments
            SET bank_transaction_id = $2, updated_at = NOW()
            WHERE id = $1
        """
        await conn.execute(payment_query, payment_id, transaction_id)

        logger.info(f"Reconciled transaction {transaction_id} with payment {payment_id} by user {reconciled_by}")
        return dict(tx_result)

    async def auto_reconcile_by_reference(
        self, conn: asyncpg.Connection, bank_reference: str
    ) -> Optional[Dict[str, Any]]:
        """
        Auto-reconcile transaction by matching bank_reference

        Cherche un payment avec le même bank_reference et réconcilie automatiquement
        """
        # Find payment with matching bank_reference
        payment_query = "SELECT id FROM payments WHERE bank_reference = $1"
        payment = await conn.fetchrow(payment_query, bank_reference)

        if not payment:
            logger.warning(f"No payment found with bank_reference {bank_reference}")
            return None

        payment_id = payment["id"]

        # Find unreconciled transaction with this reference
        tx_query = """
            SELECT * FROM bank_transactions
            WHERE bank_reference = $1 AND status = 'unreconciled'
        """
        transaction = await conn.fetchrow(tx_query, bank_reference)

        if not transaction:
            logger.warning(f"No unreconciled transaction found with reference {bank_reference}")
            return None

        # Reconcile
        return await self.reconcile(conn, transaction["id"], payment_id, None)  # Auto = system user
