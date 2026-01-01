"""
Appointment Service for Citizen-First Flow.

This service handles the NEW workflow where citizens:
1. Select a location (Malabo or Bata) BEFORE payment
2. Select from available appointment slots BEFORE payment
3. Slot is temporarily held during payment (15 min)
4. Hold is confirmed after payment success
5. Fallback: submit without appointment if no slots available

Different from AppointmentSchedulerService which handles automatic scheduling
by agents AFTER validation.

Flow:
    DRAFT → DOCUMENTS → REVIEW → SELECT_LOCATION → SELECT_SLOT → PAYMENT → SUBMITTED
"""
from datetime import date, time, datetime, timedelta
from typing import Optional, List, Dict, Any, Tuple
from uuid import UUID
from dataclasses import dataclass, field
from enum import Enum
import asyncpg
import logging

logger = logging.getLogger(__name__)


class HoldStatus(str, Enum):
    """Appointment hold status"""
    HELD = "held"
    CONFIRMED = "confirmed"
    EXPIRED = "expired"
    RELEASED = "released"
    FALLBACK = "fallback"


@dataclass
class EntityLocation:
    """Represents a physical location for an entity"""
    entity_code: str
    location_name: str
    location_address: Optional[str] = None
    city: Optional[str] = None
    region: Optional[str] = None


@dataclass
class AvailableSlot:
    """Represents an available appointment slot"""
    slot_date: date
    slot_time: time
    location_name: str
    location_address: Optional[str] = None
    slots_remaining: int = 1
    city: Optional[str] = None


@dataclass
class AppointmentHold:
    """Represents a temporary appointment hold (before payment)"""
    id: UUID
    service_request_id: UUID
    entity_code: str
    location_name: str
    location_address: Optional[str]
    appointment_date: Optional[date]
    appointment_time: Optional[time]
    expires_at: datetime
    status: HoldStatus
    created_at: datetime
    city: Optional[str] = None
    confirmed_at: Optional[datetime] = None
    expired_at: Optional[datetime] = None
    released_at: Optional[datetime] = None


@dataclass
class HoldResult:
    """Result of a hold operation"""
    success: bool
    hold: Optional[AppointmentHold] = None
    error: Optional[str] = None
    expires_in_seconds: int = 0


@dataclass
class ConfirmResult:
    """Result of confirming a hold after payment"""
    success: bool
    appointment_date: Optional[date] = None
    appointment_time: Optional[time] = None
    location_name: Optional[str] = None
    city: Optional[str] = None
    error: Optional[str] = None


class AppointmentService:
    """
    Service for citizen-first appointment selection.

    Key Methods:
    - get_available_locations(): Get Malabo/Bata options for an entity
    - get_available_slots(): Get 6 available slots for a location
    - hold_slot(): Create temporary hold (15 min) before payment
    - confirm_hold(): Called by payment webhook after success
    - submit_without_appointment(): Fallback when no slots available
    - release_hold(): Release a hold (user changed selection)
    - release_expired_holds(): Cron job to clean up expired holds
    """

    DEFAULT_HOLD_MINUTES = 15
    DEFAULT_SLOTS_LIMIT = 6
    DEFAULT_DELAY_DAYS = 7

    # === PUBLIC METHODS ===

    async def get_available_locations(
        self,
        db: asyncpg.Connection,
        entity_code: str
    ) -> List[EntityLocation]:
        """
        Get available locations for an entity (e.g., Malabo and Bata).

        Args:
            db: Database connection
            entity_code: Entity code (e.g., 'CNEDOGE', 'DGT')

        Returns:
            List of EntityLocation objects with city and region
        """
        # Use city column added in migration 029
        rows = await db.fetch("""
            SELECT DISTINCT ON (city, location_name)
                entity_code,
                location_name,
                location_address,
                city,
                region
            FROM appointment_slot_configs
            WHERE entity_code = $1
            AND is_active = TRUE
            AND city IS NOT NULL
            ORDER BY city, location_name
        """, entity_code)

        return [
            EntityLocation(
                entity_code=row['entity_code'],
                location_name=row['location_name'],
                location_address=row['location_address'],
                city=row['city'],
                region=row['region']
            )
            for row in rows
        ]

    async def get_available_slots(
        self,
        db: asyncpg.Connection,
        entity_code: str,
        location_name: str,
        from_date: Optional[date] = None,
        limit: int = DEFAULT_SLOTS_LIMIT
    ) -> List[AvailableSlot]:
        """
        Get available appointment slots for a specific location.

        Uses get_available_slots_v2() PostgreSQL function which considers
        both confirmed reservations AND active holds.

        Args:
            db: Database connection
            entity_code: Entity code
            location_name: Location name (e.g., 'CNEDOGE Malabo')
            from_date: Start date (defaults to minimum delay date)
            limit: Max slots to return (default 6)

        Returns:
            List of AvailableSlot objects
        """
        # Calculate minimum date based on delay rules
        if from_date is None:
            delay_days = await self._get_delay_days(db, entity_code)
            from_date = self._add_business_days(date.today(), delay_days)

        # Use the v2 function that considers holds
        rows = await db.fetch("""
            SELECT
                slot_date,
                slot_time,
                location_name,
                location_address,
                slots_remaining
            FROM get_available_slots_v2($1, $2, $3, $4)
        """, entity_code, location_name, from_date, limit)

        return [
            AvailableSlot(
                slot_date=row['slot_date'],
                slot_time=row['slot_time'],
                location_name=row['location_name'],
                location_address=row['location_address'],
                slots_remaining=row['slots_remaining']
            )
            for row in rows
        ]

    async def hold_slot(
        self,
        db: asyncpg.Connection,
        service_request_id: UUID,
        entity_code: str,
        location_name: str,
        location_address: Optional[str],
        appointment_date: date,
        appointment_time: time,
        hold_minutes: int = DEFAULT_HOLD_MINUTES
    ) -> HoldResult:
        """
        Create a temporary hold on an appointment slot.

        Called when user selects a slot (BEFORE payment).
        Hold expires after 15 minutes if payment not completed.
        Releases any previous hold for this request.

        Args:
            db: Database connection
            service_request_id: Service request UUID
            entity_code: Entity code
            location_name: Location name
            location_address: Location address
            appointment_date: Selected date
            appointment_time: Selected time
            hold_minutes: Hold duration (default 15)

        Returns:
            HoldResult with success status and hold details
        """
        try:
            # Use the PostgreSQL function
            row = await db.fetchrow("""
                SELECT * FROM hold_appointment_slot(
                    $1, $2, $3, $4, $5, $6, $7
                )
            """,
                service_request_id,
                entity_code,
                location_name,
                location_address,
                appointment_date,
                appointment_time,
                hold_minutes
            )

            if row:
                hold = AppointmentHold(
                    id=row['id'],
                    service_request_id=row['service_request_id'],
                    entity_code=row['entity_code'],
                    location_name=row['location_name'],
                    location_address=row['location_address'],
                    appointment_date=row['appointment_date'],
                    appointment_time=row['appointment_time'],
                    expires_at=row['expires_at'],
                    status=HoldStatus(row['status']),
                    created_at=row['created_at'],
                    confirmed_at=row['confirmed_at'],
                    expired_at=row['expired_at'],
                    released_at=row['released_at']
                )

                # Calculate seconds until expiry
                now = datetime.now(hold.expires_at.tzinfo) if hold.expires_at.tzinfo else datetime.utcnow()
                expires_in = (hold.expires_at - now).total_seconds()

                logger.info(
                    f"Appointment slot held: request={service_request_id}, "
                    f"date={appointment_date}, time={appointment_time}, "
                    f"location={location_name}, expires_in={expires_in}s"
                )

                return HoldResult(
                    success=True,
                    hold=hold,
                    expires_in_seconds=max(0, int(expires_in))
                )
            else:
                return HoldResult(
                    success=False,
                    error="Failed to create appointment hold"
                )

        except Exception as e:
            logger.error(f"Error holding slot: {e}")
            return HoldResult(
                success=False,
                error=str(e)
            )

    async def confirm_hold(
        self,
        db: asyncpg.Connection,
        service_request_id: UUID
    ) -> ConfirmResult:
        """
        Confirm a held appointment after payment success.

        Called by payment webhook after successful payment.
        Creates permanent reservation and updates service_request.

        Args:
            db: Database connection
            service_request_id: Service request UUID

        Returns:
            ConfirmResult with success status and appointment details
        """
        try:
            # Use the PostgreSQL function
            success = await db.fetchval("""
                SELECT confirm_appointment_hold($1)
            """, service_request_id)

            if success:
                # Get the confirmed appointment details (including city from migration 029)
                row = await db.fetchrow("""
                    SELECT
                        cita_date,
                        cita_time,
                        cita_location,
                        selected_city
                    FROM service_requests
                    WHERE id = $1
                """, service_request_id)

                logger.info(
                    f"Appointment confirmed: request={service_request_id}, "
                    f"date={row['cita_date']}, time={row['cita_time']}, "
                    f"location={row['cita_location']}, city={row['selected_city']}"
                )

                return ConfirmResult(
                    success=True,
                    appointment_date=row['cita_date'],
                    appointment_time=row['cita_time'],
                    location_name=row['cita_location'],
                    city=row['selected_city']
                )
            else:
                # Check if hold expired
                hold = await db.fetchrow("""
                    SELECT status, expires_at
                    FROM appointment_holds
                    WHERE service_request_id = $1
                    ORDER BY created_at DESC
                    LIMIT 1
                """, service_request_id)

                if hold and hold['status'] == 'expired':
                    return ConfirmResult(
                        success=False,
                        error="Appointment hold expired. Please select a new slot."
                    )
                elif not hold:
                    return ConfirmResult(
                        success=False,
                        error="No appointment hold found for this request."
                    )
                else:
                    return ConfirmResult(
                        success=False,
                        error=f"Hold status is '{hold['status']}', cannot confirm."
                    )

        except Exception as e:
            logger.error(f"Error confirming hold: {e}")
            return ConfirmResult(
                success=False,
                error=str(e)
            )

    async def submit_without_appointment(
        self,
        db: asyncpg.Connection,
        service_request_id: UUID,
        location_name: str
    ) -> ConfirmResult:
        """
        Submit a request without an appointment (fallback).

        Called when no slots are available.
        Agent will assign appointment later.

        Args:
            db: Database connection
            service_request_id: Service request UUID
            location_name: Preferred location

        Returns:
            ConfirmResult with success status
        """
        try:
            success = await db.fetchval("""
                SELECT submit_without_appointment($1, $2)
            """, service_request_id, location_name)

            if success:
                logger.info(
                    f"Request submitted without appointment: request={service_request_id}, "
                    f"location={location_name}"
                )

                return ConfirmResult(
                    success=True,
                    location_name=location_name,
                    error=None
                )
            else:
                return ConfirmResult(
                    success=False,
                    error="Failed to submit request without appointment"
                )

        except Exception as e:
            logger.error(f"Error submitting without appointment: {e}")
            return ConfirmResult(
                success=False,
                error=str(e)
            )

    async def release_hold(
        self,
        db: asyncpg.Connection,
        service_request_id: UUID
    ) -> bool:
        """
        Release a held appointment slot.

        Called when user wants to select a different slot.

        Args:
            db: Database connection
            service_request_id: Service request UUID

        Returns:
            True if hold was released
        """
        result = await db.execute("""
            UPDATE appointment_holds
            SET status = 'released',
                released_at = NOW()
            WHERE service_request_id = $1
            AND status = 'held'
        """, service_request_id)

        return 'UPDATE 1' in result

    async def release_expired_holds(
        self,
        db: asyncpg.Connection
    ) -> Tuple[int, List[UUID]]:
        """
        Release all expired holds.

        Should be called by a cron job every minute.

        Args:
            db: Database connection

        Returns:
            Tuple of (released_count, list of service_request_ids)
        """
        row = await db.fetchrow("""
            SELECT released_count, service_request_ids
            FROM release_expired_appointment_holds()
        """)

        released_count = row['released_count'] or 0
        request_ids = row['service_request_ids'] or []

        if released_count > 0:
            logger.info(f"Released {released_count} expired appointment holds")

        return released_count, request_ids

    async def get_hold_status(
        self,
        db: asyncpg.Connection,
        service_request_id: UUID
    ) -> Optional[AppointmentHold]:
        """
        Get the current hold status for a service request.

        Args:
            db: Database connection
            service_request_id: Service request UUID

        Returns:
            AppointmentHold if exists, None otherwise
        """
        row = await db.fetchrow("""
            SELECT *
            FROM appointment_holds
            WHERE service_request_id = $1
            ORDER BY created_at DESC
            LIMIT 1
        """, service_request_id)

        if row:
            return AppointmentHold(
                id=row['id'],
                service_request_id=row['service_request_id'],
                entity_code=row['entity_code'],
                location_name=row['location_name'],
                location_address=row['location_address'],
                appointment_date=row['appointment_date'],
                appointment_time=row['appointment_time'],
                expires_at=row['expires_at'],
                status=HoldStatus(row['status']),
                created_at=row['created_at'],
                confirmed_at=row['confirmed_at'],
                expired_at=row['expired_at'],
                released_at=row['released_at']
            )

        return None

    async def get_entity_code_for_workflow(
        self,
        db: asyncpg.Connection,
        workflow_code: str
    ) -> str:
        """
        Get the appointment entity code for a workflow.

        Args:
            db: Database connection
            workflow_code: Workflow code

        Returns:
            Entity code (e.g., 'CNEDOGE', 'DGT')
        """
        entity = await db.fetchval("""
            SELECT COALESCE(appointment_entity_code, entity_code)
            FROM workflows
            WHERE code = $1
        """, workflow_code)

        if not entity:
            # Fallback mapping based on workflow prefix
            prefix_mapping = {
                'PASAPORTE': 'CNEDOGE',
                'DIP': 'CNEDOGE',
                'CONDUCIR': 'DGT',
                'VEHICULO': 'DGT',
                'RESIDENCIA': 'EXTRANJERIA',
                'VISA': 'EXTRANJERIA',
                'FUNCIONARIO': 'MINFP',
                'CARNET': 'MINFP',
            }

            workflow_upper = workflow_code.upper()
            for prefix, code in prefix_mapping.items():
                if workflow_upper.startswith(prefix):
                    return code

            return 'CNEDOGE'  # Default

        return entity

    # === PRIVATE METHODS ===

    async def _get_delay_days(
        self,
        db: asyncpg.Connection,
        entity_code: str,
        workflow_code: Optional[str] = None,
        priority: str = 'NORMAL'
    ) -> int:
        """Get the delay days for appointment scheduling."""

        # Priority 1: Workflow-specific rule
        if workflow_code:
            delay = await db.fetchval("""
                SELECT delay_business_days
                FROM appointment_delay_rules
                WHERE workflow_code = $1
                AND priority = $2
                AND is_active = TRUE
            """, workflow_code, priority)

            if delay is not None:
                return delay

        # Priority 2: Entity-specific rule
        delay = await db.fetchval("""
            SELECT delay_business_days
            FROM appointment_delay_rules
            WHERE entity_code = $1
            AND workflow_code IS NULL
            AND priority = $2
            AND is_active = TRUE
        """, entity_code, priority)

        if delay is not None:
            return delay

        # Priority 3: Default rule
        delay = await db.fetchval("""
            SELECT delay_business_days
            FROM appointment_delay_rules
            WHERE entity_code IS NULL
            AND workflow_code IS NULL
            AND priority = $1
            AND is_active = TRUE
        """, priority)

        return delay or self.DEFAULT_DELAY_DAYS

    def _add_business_days(self, start_date: date, days: int) -> date:
        """Add business days to a date (excluding weekends)."""
        current = start_date
        added = 0

        while added < days:
            current += timedelta(days=1)
            # Skip weekends (Saturday=5, Sunday=6 in Python's weekday())
            if current.weekday() < 5:
                added += 1

        return current


# Singleton instance
appointment_service = AppointmentService()
