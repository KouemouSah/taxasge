"""
Declaration repository for TaxasGE Backend
Handles tax declaration data persistence with PostgreSQL and Supabase
"""

from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta
from loguru import logger
from decimal import Decimal
import uuid

from app.repositories.base import BaseRepository
from app.models.declaration import (
    DeclarationResponse, DeclarationCreate, DeclarationUpdate, DeclarationSearchFilter,
    DeclarationStats, DeclarationWorkflow, DeclarationActivity, DocumentAttachment,
    DeclarationStatus, DeclarationType, Priority, PaymentStatus, PaymentInfo
)
from app.models.user import UserActivity


class DeclarationRepository(BaseRepository[DeclarationResponse]):
    """Repository for tax declaration management operations"""

    def __init__(self):
        super().__init__("tax_declarations")

    def _map_to_model(self, data: Dict[str, Any]) -> DeclarationResponse:
        """Map database row to DeclarationResponse model"""
        return DeclarationResponse(
            id=data["id"],
            reference_number=data["reference_number"],
            user_id=data["user_id"],
            service_id=data["service_id"],
            service_name=data.get("service_name", ""),
            declaration_type=DeclarationType(data["declaration_type"]),
            status=DeclarationStatus(data["status"]),
            priority=Priority(data["priority"]),
            form_data=data.get("form_data", {}),
            attachments=data.get("attachments", []),
            required_documents=data.get("required_documents", []),
            payment_info=data.get("payment_info"),
            payment_status=PaymentStatus(data.get("payment_status", "pending")),
            submitted_at=data.get("submitted_at"),
            processed_at=data.get("processed_at"),
            approved_at=data.get("approved_at"),
            assigned_to=data.get("assigned_to"),
            processing_notes=data.get("processing_notes"),
            rejection_reason=data.get("rejection_reason"),
            notes=data.get("notes"),
            language=data.get("language", "es"),
            created_at=data["created_at"],
            updated_at=data["updated_at"],
            estimated_completion=data.get("estimated_completion"),
            workflow_stage=data.get("workflow_stage")
        )

    def _map_from_model(self, model: DeclarationResponse) -> Dict[str, Any]:
        """Map DeclarationResponse model to database row"""
        return {
            "id": model.id,
            "reference_number": model.reference_number,
            "user_id": model.user_id,
            "service_id": model.service_id,
            "service_name": model.service_name,
            "declaration_type": model.declaration_type.value,
            "status": model.status.value,
            "priority": model.priority.value,
            "form_data": model.form_data.dict() if hasattr(model.form_data, 'dict') else model.form_data,
            "attachments": [att.dict() if hasattr(att, 'dict') else att for att in model.attachments],
            "required_documents": model.required_documents,
            "payment_info": model.payment_info.dict() if model.payment_info and hasattr(model.payment_info, 'dict') else model.payment_info,
            "payment_status": model.payment_status.value,
            "submitted_at": model.submitted_at,
            "processed_at": model.processed_at,
            "approved_at": model.approved_at,
            "assigned_to": model.assigned_to,
            "processing_notes": model.processing_notes,
            "rejection_reason": model.rejection_reason,
            "notes": model.notes,
            "language": model.language,
            "created_at": model.created_at,
            "updated_at": model.updated_at,
            "estimated_completion": model.estimated_completion,
            "workflow_stage": model.workflow_stage
        }

    def _generate_reference_number(self) -> str:
        """Generate unique reference number"""
        timestamp = datetime.utcnow().strftime("%Y%m%d")
        random_part = str(uuid.uuid4())[:8].upper()
        return f"DECL-{timestamp}-{random_part}"

    async def create_declaration(self, user_id: str, declaration_data: DeclarationCreate) -> Optional[DeclarationResponse]:
        """Create new tax declaration"""
        try:
            # Get service information
            service_name = await self._get_service_name(declaration_data.service_id)

            # Calculate estimated completion
            estimated_completion = self._calculate_estimated_completion(declaration_data.priority)

            # Create declaration data
            data = {
                "reference_number": self._generate_reference_number(),
                "user_id": user_id,
                "service_id": declaration_data.service_id,
                "service_name": service_name,
                "declaration_type": declaration_data.declaration_type.value,
                "status": DeclarationStatus.draft.value,
                "priority": declaration_data.priority.value,
                "form_data": declaration_data.form_data.dict(),
                "attachments": [],
                "required_documents": declaration_data.requested_documents,
                "payment_info": None,
                "payment_status": PaymentStatus.pending.value,
                "submitted_at": None,
                "processed_at": None,
                "approved_at": None,
                "assigned_to": None,
                "processing_notes": None,
                "rejection_reason": None,
                "notes": declaration_data.notes,
                "language": declaration_data.language,
                "estimated_completion": estimated_completion,
                "workflow_stage": "draft"
            }

            return await self.create(self._map_to_model(data))

        except Exception as e:
            logger.error(f"❌ Error creating declaration: {e}")
            return None

    async def _get_service_name(self, service_id: str) -> str:
        """Get service name by ID"""
        try:
            query = "SELECT name_es FROM tax_services WHERE id = $1"
            result = await self.db_manager.execute_scalar(query, service_id)
            return result or f"Service {service_id}"
        except Exception as e:
            logger.error(f"❌ Error getting service name: {e}")
            return f"Service {service_id}"

    def _calculate_estimated_completion(self, priority: Priority) -> datetime:
        """Calculate estimated completion date based on priority"""
        now = datetime.utcnow()
        if priority == Priority.express:
            return now + timedelta(days=1)
        elif priority == Priority.urgent:
            return now + timedelta(days=3)
        else:  # normal
            return now + timedelta(days=7)

    async def submit_declaration(self, declaration_id: str) -> Optional[DeclarationResponse]:
        """Submit declaration for processing"""
        try:
            updates = {
                "status": DeclarationStatus.submitted.value,
                "submitted_at": datetime.utcnow(),
                "workflow_stage": "submitted"
            }

            return await self.update(declaration_id, updates)

        except Exception as e:
            logger.error(f"❌ Error submitting declaration {declaration_id}: {e}")
            return None

    async def update_declaration(self, declaration_id: str, updates: DeclarationUpdate) -> Optional[DeclarationResponse]:
        """Update declaration"""
        try:
            # Build update data
            update_data = {}
            update_dict = updates.dict(exclude_unset=True)

            for key, value in update_dict.items():
                if value is not None:
                    if key in ["status", "priority"] and hasattr(value, 'value'):
                        update_data[key] = value.value
                    elif key == "form_data" and hasattr(value, 'dict'):
                        update_data[key] = value.dict()
                    elif key == "payment_info" and hasattr(value, 'dict'):
                        update_data[key] = value.dict()
                    else:
                        update_data[key] = value

            return await self.update(declaration_id, update_data)

        except Exception as e:
            logger.error(f"❌ Error updating declaration {declaration_id}: {e}")
            return None

    async def find_by_reference(self, reference_number: str) -> Optional[DeclarationResponse]:
        """Find declaration by reference number"""
        try:
            if self.supabase.enabled:
                results = await self.supabase.select(
                    self.table_name,
                    filters={"reference_number": reference_number}
                )
                if results:
                    return self._map_to_model(results[0])
            else:
                query = f"SELECT * FROM {self.table_name} WHERE reference_number = $1"
                result = await self.db_manager.execute_single(query, reference_number)
                if result:
                    return self._map_to_model(dict(result))

        except Exception as e:
            logger.error(f"❌ Error finding declaration by reference {reference_number}: {e}")

        return None

    async def find_by_user(self, user_id: str, status: Optional[DeclarationStatus] = None) -> List[DeclarationResponse]:
        """Find declarations by user ID"""
        try:
            filters = {"user_id": user_id}
            if status:
                filters["status"] = status.value

            return await self.find_all(filters=filters, order_by="created_at DESC")

        except Exception as e:
            logger.error(f"❌ Error finding declarations for user {user_id}: {e}")
            return []

    async def search_declarations(self, search_filter: DeclarationSearchFilter) -> List[DeclarationResponse]:
        """Search declarations with advanced filtering"""
        try:
            filters = {}

            # Build basic filters
            if search_filter.user_id:
                filters["user_id"] = search_filter.user_id
            if search_filter.service_id:
                filters["service_id"] = search_filter.service_id
            if search_filter.status:
                filters["status"] = search_filter.status.value
            if search_filter.declaration_type:
                filters["declaration_type"] = search_filter.declaration_type.value
            if search_filter.priority:
                filters["priority"] = search_filter.priority.value
            if search_filter.payment_status:
                filters["payment_status"] = search_filter.payment_status.value
            if search_filter.assigned_to:
                filters["assigned_to"] = search_filter.assigned_to

            # Reference number search
            if search_filter.reference_number:
                declaration = await self.find_by_reference(search_filter.reference_number)
                return [declaration] if declaration else []

            # Text search
            if search_filter.search_query:
                search_columns = ["reference_number", "service_name", "notes", "processing_notes"]
                return await self.search(
                    search_filter.search_query,
                    search_columns,
                    filters
                )

            # Date range filtering with PostgreSQL
            if search_filter.created_after or search_filter.created_before or search_filter.submitted_after or search_filter.submitted_before:
                return await self._search_with_date_filters(filters, search_filter)

            # Standard filtering
            return await self.find_all(filters=filters)

        except Exception as e:
            logger.error(f"❌ Error searching declarations: {e}")
            return []

    async def _search_with_date_filters(self, base_filters: Dict[str, Any], search_filter: DeclarationSearchFilter) -> List[DeclarationResponse]:
        """Search with date range filters"""
        try:
            # Build WHERE conditions
            conditions = []
            params = []
            param_count = 0

            # Base filters
            for key, value in base_filters.items():
                param_count += 1
                conditions.append(f"{key} = ${param_count}")
                params.append(value)

            # Date filters
            if search_filter.created_after:
                param_count += 1
                conditions.append(f"created_at >= ${param_count}")
                params.append(search_filter.created_after)

            if search_filter.created_before:
                param_count += 1
                conditions.append(f"created_at <= ${param_count}")
                params.append(search_filter.created_before)

            if search_filter.submitted_after:
                param_count += 1
                conditions.append(f"submitted_at >= ${param_count}")
                params.append(search_filter.submitted_after)

            if search_filter.submitted_before:
                param_count += 1
                conditions.append(f"submitted_at <= ${param_count}")
                params.append(search_filter.submitted_before)

            # Build query
            query = f"SELECT * FROM {self.table_name}"
            if conditions:
                query += f" WHERE {' AND '.join(conditions)}"
            query += " ORDER BY created_at DESC"

            results = await self.db_manager.execute_query(query, *params)
            return [self._map_to_model(dict(row)) for row in results]

        except Exception as e:
            logger.error(f"❌ Error in date filter search: {e}")
            return []

    async def assign_to_operator(self, declaration_id: str, operator_id: str) -> bool:
        """Assign declaration to operator"""
        try:
            updates = {
                "assigned_to": operator_id,
                "status": DeclarationStatus.processing.value,
                "workflow_stage": "assigned"
            }

            result = await self.update(declaration_id, updates)
            return result is not None

        except Exception as e:
            logger.error(f"❌ Error assigning declaration {declaration_id} to operator {operator_id}: {e}")
            return False

    async def approve_declaration(self, declaration_id: str, operator_id: str, notes: str = None) -> bool:
        """Approve declaration"""
        try:
            updates = {
                "status": DeclarationStatus.approved.value,
                "approved_at": datetime.utcnow(),
                "processing_notes": notes,
                "workflow_stage": "approved"
            }

            result = await self.update(declaration_id, updates)
            return result is not None

        except Exception as e:
            logger.error(f"❌ Error approving declaration {declaration_id}: {e}")
            return False

    async def reject_declaration(self, declaration_id: str, operator_id: str, reason: str) -> bool:
        """Reject declaration"""
        try:
            updates = {
                "status": DeclarationStatus.rejected.value,
                "rejection_reason": reason,
                "processed_at": datetime.utcnow(),
                "workflow_stage": "rejected"
            }

            result = await self.update(declaration_id, updates)
            return result is not None

        except Exception as e:
            logger.error(f"❌ Error rejecting declaration {declaration_id}: {e}")
            return False

    async def update_payment_status(self, declaration_id: str, payment_status: PaymentStatus, payment_info: PaymentInfo = None) -> bool:
        """Update payment status"""
        try:
            updates = {
                "payment_status": payment_status.value
            }

            if payment_info:
                updates["payment_info"] = payment_info.dict()

            if payment_status == PaymentStatus.completed:
                updates["status"] = DeclarationStatus.paid.value
                updates["workflow_stage"] = "paid"

            result = await self.update(declaration_id, updates)
            return result is not None

        except Exception as e:
            logger.error(f"❌ Error updating payment status for declaration {declaration_id}: {e}")
            return False

    async def add_attachment(self, declaration_id: str, attachment: DocumentAttachment) -> bool:
        """Add document attachment to declaration"""
        try:
            # Get current declaration
            declaration = await self.find_by_id(declaration_id)
            if not declaration:
                return False

            # Add new attachment
            attachments = list(declaration.attachments)
            attachments.append(attachment)

            updates = {"attachments": [att.dict() if hasattr(att, 'dict') else att for att in attachments]}
            result = await self.update(declaration_id, updates)
            return result is not None

        except Exception as e:
            logger.error(f"❌ Error adding attachment to declaration {declaration_id}: {e}")
            return False

    async def get_declaration_stats(self) -> DeclarationStats:
        """Get comprehensive declaration statistics"""
        try:
            total_declarations = await self.count()

            # Count by status
            status_stats_query = """
                SELECT status, COUNT(*) as count
                FROM tax_declarations
                GROUP BY status
            """
            status_results = await self.db_manager.execute_query(status_stats_query)
            by_status = {row["status"]: row["count"] for row in status_results}

            # Count by type
            type_stats_query = """
                SELECT declaration_type, COUNT(*) as count
                FROM tax_declarations
                GROUP BY declaration_type
            """
            type_results = await self.db_manager.execute_query(type_stats_query)
            by_type = {row["declaration_type"]: row["count"] for row in type_results}

            # Count by payment status
            payment_stats_query = """
                SELECT payment_status, COUNT(*) as count
                FROM tax_declarations
                GROUP BY payment_status
            """
            payment_results = await self.db_manager.execute_query(payment_stats_query)
            by_payment_status = {row["payment_status"]: row["count"] for row in payment_results}

            # Average processing time
            avg_processing_query = """
                SELECT AVG(EXTRACT(EPOCH FROM (processed_at - submitted_at))/3600) as avg_hours
                FROM tax_declarations
                WHERE submitted_at IS NOT NULL AND processed_at IS NOT NULL
            """
            avg_result = await self.db_manager.execute_scalar(avg_processing_query)
            average_processing_time = float(avg_result or 0)

            # Completion rate
            completed_count = by_status.get("completed", 0) + by_status.get("approved", 0)
            completion_rate = (completed_count / total_declarations * 100) if total_declarations > 0 else 0

            # Time-based metrics
            start_of_month = datetime.utcnow().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            start_of_week = datetime.utcnow() - timedelta(days=7)

            declarations_this_month = await self.count({"created_at__gte": start_of_month})
            declarations_this_week = await self.count({"created_at__gte": start_of_week})

            # Popular services
            popular_services_query = """
                SELECT service_id, service_name, COUNT(*) as declaration_count
                FROM tax_declarations
                GROUP BY service_id, service_name
                ORDER BY declaration_count DESC
                LIMIT 5
            """
            popular_results = await self.db_manager.execute_query(popular_services_query)
            popular_services = [
                {
                    "service_id": row["service_id"],
                    "service_name": row["service_name"],
                    "count": row["declaration_count"]
                }
                for row in popular_results
            ]

            return DeclarationStats(
                total_declarations=total_declarations,
                by_status=by_status,
                by_type=by_type,
                by_payment_status=by_payment_status,
                average_processing_time=average_processing_time,
                completion_rate=completion_rate,
                total_revenue=Decimal("0"),  # Would need payment data
                pending_payments=Decimal("0"),  # Would need payment data
                declarations_this_month=declarations_this_month,
                declarations_this_week=declarations_this_week,
                popular_services=popular_services
            )

        except Exception as e:
            logger.error(f"❌ Error getting declaration stats: {e}")
            return DeclarationStats(
                total_declarations=0,
                by_status={},
                by_type={},
                by_payment_status={},
                average_processing_time=0.0,
                completion_rate=0.0,
                total_revenue=Decimal("0"),
                pending_payments=Decimal("0"),
                declarations_this_month=0,
                declarations_this_week=0,
                popular_services=[]
            )

    async def get_workflow_status(self, declaration_id: str) -> Optional[DeclarationWorkflow]:
        """Get declaration workflow status"""
        try:
            declaration = await self.find_by_id(declaration_id)
            if not declaration:
                return None

            # Define workflow stages
            stages = [
                {"stage": "draft", "name": "Draft", "completed": declaration.status != DeclarationStatus.draft},
                {"stage": "submitted", "name": "Submitted", "completed": declaration.submitted_at is not None},
                {"stage": "processing", "name": "Processing", "completed": declaration.status in [DeclarationStatus.processing, DeclarationStatus.approved, DeclarationStatus.completed]},
                {"stage": "approved", "name": "Approved", "completed": declaration.approved_at is not None},
                {"stage": "payment", "name": "Payment", "completed": declaration.payment_status == PaymentStatus.completed},
                {"stage": "completed", "name": "Completed", "completed": declaration.status == DeclarationStatus.completed}
            ]

            # Define next actions
            next_actions = []
            if declaration.status == DeclarationStatus.draft:
                next_actions = ["submit", "edit", "cancel"]
            elif declaration.status == DeclarationStatus.submitted:
                next_actions = ["assign", "approve", "reject"]
            elif declaration.status == DeclarationStatus.processing:
                next_actions = ["approve", "reject", "request_documents"]
            elif declaration.status == DeclarationStatus.approved:
                next_actions = ["process_payment"]

            return DeclarationWorkflow(
                declaration_id=declaration_id,
                current_stage=declaration.workflow_stage or "draft",
                stages=stages,
                next_actions=next_actions,
                estimated_completion=declaration.estimated_completion
            )

        except Exception as e:
            logger.error(f"❌ Error getting workflow status for declaration {declaration_id}: {e}")
            return None

    async def log_activity(self, user_id: str, action: str, declaration_id: str = None, details: Dict[str, Any] = None):
        """Log declaration activity"""
        try:
            activity = DeclarationActivity(
                declaration_id=declaration_id,
                user_id=user_id,
                action=action,
                details=details,
                timestamp=datetime.utcnow()
            )

            if self.supabase.enabled:
                data = {
                    "declaration_id": activity.declaration_id,
                    "user_id": activity.user_id,
                    "action": activity.action,
                    "details": activity.details,
                    "timestamp": activity.timestamp
                }
                await self.supabase.insert("declaration_activities", data)
            else:
                query = """
                    INSERT INTO declaration_activities
                    (declaration_id, user_id, action, details, timestamp)
                    VALUES ($1, $2, $3, $4, $5)
                """
                await self.db_manager.execute_command(
                    query,
                    activity.declaration_id,
                    activity.user_id,
                    activity.action,
                    activity.details,
                    activity.timestamp
                )

        except Exception as e:
            logger.error(f"❌ Error logging declaration activity: {e}")


# Global declaration repository instance
declaration_repository = DeclarationRepository()