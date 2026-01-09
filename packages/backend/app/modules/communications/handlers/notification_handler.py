"""
Notification Event Handler
==========================
Handles events from the EventBus and sends appropriate notifications.

Maps event types to notification templates and sends via:
- Email
- SMS (when configured)
- Push notifications (when configured)

@module communications/handlers/notification_handler
"""

import asyncio
from typing import Dict, Optional, Any, List
from dataclasses import dataclass
from enum import Enum
from loguru import logger

from app.core.events import EventBus, EventType, EventPayload
from app.modules.communications.services.communication_service import CommunicationService
from app.modules.communications.models.communication import CommunicationType


class NotificationChannel(str, Enum):
    """Available notification channels."""
    EMAIL = "email"
    SMS = "sms"
    PUSH = "push"
    IN_APP = "in_app"


@dataclass
class NotificationConfig:
    """Configuration for a notification triggered by an event."""
    template_code: str
    channels: List[NotificationChannel]
    priority: str = "normal"  # low, normal, high, critical
    subject_key: Optional[str] = None  # i18n key for email subject
    requires_user_prefs: bool = True  # Check user notification preferences


# =============================================================================
# EVENT TO NOTIFICATION MAPPING
# =============================================================================

EVENT_NOTIFICATION_MAP: Dict[EventType, NotificationConfig] = {
    # Payment Events
    EventType.PAYMENT_COMPLETED: NotificationConfig(
        template_code="payment_completed",
        channels=[NotificationChannel.EMAIL, NotificationChannel.SMS, NotificationChannel.PUSH],
        priority="high",
        subject_key="notifications.payment.completed.subject"
    ),
    EventType.PAYMENT_FAILED: NotificationConfig(
        template_code="payment_failed",
        channels=[NotificationChannel.EMAIL, NotificationChannel.SMS],
        priority="high",
        subject_key="notifications.payment.failed.subject"
    ),
    EventType.PAYMENT_CASH_PENDING: NotificationConfig(
        template_code="payment_cash_pending",
        channels=[NotificationChannel.EMAIL, NotificationChannel.SMS],
        priority="normal",
        subject_key="notifications.payment.cash_pending.subject"
    ),
    EventType.PAYMENT_CASH_VALIDATED: NotificationConfig(
        template_code="payment_cash_validated",
        channels=[NotificationChannel.EMAIL, NotificationChannel.SMS, NotificationChannel.PUSH],
        priority="high",
        subject_key="notifications.payment.cash_validated.subject"
    ),
    EventType.PAYMENT_CASH_REJECTED: NotificationConfig(
        template_code="payment_cash_rejected",
        channels=[NotificationChannel.EMAIL, NotificationChannel.SMS],
        priority="high",
        subject_key="notifications.payment.cash_rejected.subject"
    ),

    # Service Request Events
    EventType.REQUEST_SUBMITTED: NotificationConfig(
        template_code="request_submitted",
        channels=[NotificationChannel.EMAIL, NotificationChannel.PUSH],
        priority="normal",
        subject_key="notifications.request.submitted.subject"
    ),
    EventType.REQUEST_APPROVED: NotificationConfig(
        template_code="request_approved",
        channels=[NotificationChannel.EMAIL, NotificationChannel.SMS, NotificationChannel.PUSH],
        priority="high",
        subject_key="notifications.request.approved.subject"
    ),
    EventType.REQUEST_REJECTED: NotificationConfig(
        template_code="request_rejected",
        channels=[NotificationChannel.EMAIL, NotificationChannel.SMS],
        priority="high",
        subject_key="notifications.request.rejected.subject"
    ),
    EventType.REQUEST_COMPLETED: NotificationConfig(
        template_code="request_completed",
        channels=[NotificationChannel.EMAIL, NotificationChannel.SMS, NotificationChannel.PUSH],
        priority="high",
        subject_key="notifications.request.completed.subject"
    ),

    # Document Events
    EventType.DOCUMENT_VALIDATED: NotificationConfig(
        template_code="document_validated",
        channels=[NotificationChannel.EMAIL, NotificationChannel.PUSH],
        priority="normal",
        subject_key="notifications.document.validated.subject"
    ),
    EventType.DOCUMENT_REJECTED: NotificationConfig(
        template_code="document_rejected",
        channels=[NotificationChannel.EMAIL, NotificationChannel.SMS],
        priority="high",
        subject_key="notifications.document.rejected.subject"
    ),

    # Appointment Events
    EventType.APPOINTMENT_BOOKED: NotificationConfig(
        template_code="appointment_booked",
        channels=[NotificationChannel.EMAIL, NotificationChannel.SMS, NotificationChannel.PUSH],
        priority="high",
        subject_key="notifications.appointment.booked.subject"
    ),
    EventType.APPOINTMENT_CONFIRMED: NotificationConfig(
        template_code="appointment_confirmed",
        channels=[NotificationChannel.EMAIL, NotificationChannel.SMS],
        priority="normal",
        subject_key="notifications.appointment.confirmed.subject"
    ),
    EventType.APPOINTMENT_CANCELLED: NotificationConfig(
        template_code="appointment_cancelled",
        channels=[NotificationChannel.EMAIL, NotificationChannel.SMS],
        priority="high",
        subject_key="notifications.appointment.cancelled.subject"
    ),
    EventType.APPOINTMENT_REMINDER: NotificationConfig(
        template_code="appointment_reminder",
        channels=[NotificationChannel.EMAIL, NotificationChannel.SMS, NotificationChannel.PUSH],
        priority="high",
        subject_key="notifications.appointment.reminder.subject"
    ),

    # Declaration Events
    EventType.DECLARATION_SUBMITTED: NotificationConfig(
        template_code="declaration_submitted",
        channels=[NotificationChannel.EMAIL, NotificationChannel.PUSH],
        priority="normal",
        subject_key="notifications.declaration.submitted.subject"
    ),
    EventType.DECLARATION_VALIDATED: NotificationConfig(
        template_code="declaration_validated",
        channels=[NotificationChannel.EMAIL, NotificationChannel.SMS, NotificationChannel.PUSH],
        priority="high",
        subject_key="notifications.declaration.validated.subject"
    ),
    EventType.DECLARATION_REJECTED: NotificationConfig(
        template_code="declaration_rejected",
        channels=[NotificationChannel.EMAIL, NotificationChannel.SMS],
        priority="high",
        subject_key="notifications.declaration.rejected.subject"
    ),

    # SLA Events
    EventType.SLA_WARNING: NotificationConfig(
        template_code="sla_warning",
        channels=[NotificationChannel.EMAIL, NotificationChannel.PUSH],
        priority="high",
        subject_key="notifications.sla.warning.subject",
        requires_user_prefs=False  # Always notify agents
    ),
    EventType.SLA_BREACH: NotificationConfig(
        template_code="sla_breach",
        channels=[NotificationChannel.EMAIL, NotificationChannel.SMS, NotificationChannel.PUSH],
        priority="critical",
        subject_key="notifications.sla.breach.subject",
        requires_user_prefs=False  # Always notify agents
    ),
}


class NotificationEventHandler:
    """
    Event handler that sends notifications based on events.

    Responsibilities:
    - Listen to relevant events from EventBus
    - Map events to notification templates
    - Send notifications via appropriate channels
    - Respect user notification preferences
    """

    def __init__(self):
        """Initialize the notification handler."""
        self.communication_service = CommunicationService()
        self._registered = False
        logger.info("NotificationEventHandler initialized")

    def register(self) -> None:
        """
        Register all event handlers with the EventBus.
        Should be called once at application startup.
        """
        if self._registered:
            logger.warning("NotificationEventHandler already registered")
            return

        for event_type in EVENT_NOTIFICATION_MAP.keys():
            EventBus.subscribe(event_type, self.handle_event)
            logger.debug(f"Registered notification handler for {event_type.value}")

        self._registered = True
        logger.info(
            f"NotificationEventHandler registered for {len(EVENT_NOTIFICATION_MAP)} event types"
        )

    async def handle_event(self, payload: EventPayload) -> None:
        """
        Handle an event and send appropriate notifications.

        Args:
            payload: The event payload containing all relevant data
        """
        event_type_str = payload.get("event_type", "")

        try:
            event_type = EventType(event_type_str)
        except ValueError:
            logger.warning(f"Unknown event type: {event_type_str}")
            return

        config = EVENT_NOTIFICATION_MAP.get(event_type)
        if not config:
            logger.debug(f"No notification config for {event_type_str}")
            return

        logger.info(
            f"Processing notification for {event_type_str}, "
            f"channels: {[c.value for c in config.channels]}"
        )

        # Extract user info from payload
        user_email = payload.get("user_email")
        user_phone = payload.get("user_phone")
        user_name = payload.get("user_name")
        language = payload.get("preferred_language", "es")

        # Build template context from payload
        context = self._build_template_context(payload)

        # Send to each channel
        for channel in config.channels:
            try:
                await self._send_notification(
                    channel=channel,
                    config=config,
                    user_email=user_email,
                    user_phone=user_phone,
                    user_name=user_name,
                    language=language,
                    context=context
                )
            except Exception as e:
                logger.error(
                    f"Failed to send {channel.value} notification for "
                    f"{event_type_str}: {e}"
                )

    async def _send_notification(
        self,
        channel: NotificationChannel,
        config: NotificationConfig,
        user_email: Optional[str],
        user_phone: Optional[str],
        user_name: Optional[str],
        language: str,
        context: Dict[str, Any]
    ) -> bool:
        """
        Send a notification via a specific channel.

        Args:
            channel: The notification channel
            config: Notification configuration
            user_email: User's email address
            user_phone: User's phone number
            user_name: User's display name
            language: Preferred language (es, fr, en)
            context: Template context variables

        Returns:
            True if notification was sent successfully
        """
        if channel == NotificationChannel.EMAIL:
            if not user_email:
                logger.warning("Cannot send email: no email address")
                return False

            # Get subject based on language
            subject = self._get_subject(config, language, context)

            # Render template content
            content = await self._render_template(
                config.template_code,
                language,
                context
            )

            if not content:
                logger.warning(
                    f"No template content for {config.template_code} ({language})"
                )
                return False

            # Send via communication service (run in thread pool since it's sync)
            loop = asyncio.get_running_loop()
            success = await loop.run_in_executor(
                None,
                lambda: self.communication_service.send_communication(
                    channel=CommunicationType.EMAIL,
                    recipient=user_email,
                    subject=subject,
                    content=content,
                    metadata={"language": language, "user_name": user_name}
                )
            )

            if success:
                logger.info(f"Email sent to {user_email} ({config.template_code})")
            return success

        elif channel == NotificationChannel.SMS:
            if not user_phone:
                logger.debug("Cannot send SMS: no phone number")
                return False

            # SMS sending would be implemented here
            logger.info(f"SMS notification queued for {user_phone}")
            # TODO: Implement SMS sending via sms_provider_service
            return True

        elif channel == NotificationChannel.PUSH:
            # Push notification would be implemented here
            logger.debug(f"Push notification queued ({config.template_code})")
            # TODO: Implement push notifications
            return True

        elif channel == NotificationChannel.IN_APP:
            # In-app notification would be implemented here
            logger.debug(f"In-app notification queued ({config.template_code})")
            # TODO: Implement in-app notifications
            return True

        return False

    def _build_template_context(self, payload: EventPayload) -> Dict[str, Any]:
        """
        Build template context from event payload.

        Args:
            payload: Event payload

        Returns:
            Dictionary of template variables
        """
        return {
            # User info
            "user_name": payload.get("user_name", "Usuario"),
            "user_email": payload.get("user_email", ""),

            # Payment info
            "amount": payload.get("amount"),
            "currency": payload.get("currency", "XAF"),
            "payment_method": payload.get("payment_method"),
            "receipt_number": payload.get("receipt_number"),

            # Request info
            "request_id": payload.get("request_id"),
            "service_code": payload.get("service_code"),
            "workflow_code": payload.get("workflow_code"),

            # Document info
            "document_type": payload.get("document_type"),
            "file_name": payload.get("file_name"),

            # Appointment info
            "appointment_date": payload.get("appointment_date"),
            "appointment_time": payload.get("appointment_time"),
            "location": payload.get("location"),

            # Reason/notes
            "reason": payload.get("reason"),
            "notes": payload.get("notes"),

            # Timestamp
            "timestamp": payload.get("timestamp"),

            # Any additional metadata
            **(payload.get("metadata") or {}),
        }

    def _get_subject(
        self,
        config: NotificationConfig,
        language: str,
        context: Dict[str, Any]
    ) -> str:
        """
        Get email subject for the notification.

        Args:
            config: Notification configuration
            language: Language code
            context: Template context

        Returns:
            Email subject string
        """
        # Default subjects by template code
        subjects = {
            "payment_completed": {
                "es": "Pago completado - TaxasGE",
                "fr": "Paiement effectué - TaxasGE",
                "en": "Payment completed - TaxasGE"
            },
            "payment_failed": {
                "es": "Pago fallido - TaxasGE",
                "fr": "Échec du paiement - TaxasGE",
                "en": "Payment failed - TaxasGE"
            },
            "payment_cash_pending": {
                "es": "Pago en efectivo pendiente de validación - TaxasGE",
                "fr": "Paiement en espèces en attente de validation - TaxasGE",
                "en": "Cash payment pending validation - TaxasGE"
            },
            "payment_cash_validated": {
                "es": "Pago en efectivo validado - TaxasGE",
                "fr": "Paiement en espèces validé - TaxasGE",
                "en": "Cash payment validated - TaxasGE"
            },
            "payment_cash_rejected": {
                "es": "Pago en efectivo rechazado - TaxasGE",
                "fr": "Paiement en espèces refusé - TaxasGE",
                "en": "Cash payment rejected - TaxasGE"
            },
            "request_submitted": {
                "es": "Solicitud recibida - TaxasGE",
                "fr": "Demande reçue - TaxasGE",
                "en": "Request received - TaxasGE"
            },
            "request_approved": {
                "es": "Solicitud aprobada - TaxasGE",
                "fr": "Demande approuvée - TaxasGE",
                "en": "Request approved - TaxasGE"
            },
            "request_rejected": {
                "es": "Solicitud rechazada - TaxasGE",
                "fr": "Demande refusée - TaxasGE",
                "en": "Request rejected - TaxasGE"
            },
            "request_completed": {
                "es": "Solicitud completada - TaxasGE",
                "fr": "Demande terminée - TaxasGE",
                "en": "Request completed - TaxasGE"
            },
            "document_validated": {
                "es": "Documento validado - TaxasGE",
                "fr": "Document validé - TaxasGE",
                "en": "Document validated - TaxasGE"
            },
            "document_rejected": {
                "es": "Documento rechazado - TaxasGE",
                "fr": "Document refusé - TaxasGE",
                "en": "Document rejected - TaxasGE"
            },
            "appointment_booked": {
                "es": "Cita confirmada - TaxasGE",
                "fr": "Rendez-vous confirmé - TaxasGE",
                "en": "Appointment confirmed - TaxasGE"
            },
            "appointment_confirmed": {
                "es": "Cita confirmada - TaxasGE",
                "fr": "Rendez-vous confirmé - TaxasGE",
                "en": "Appointment confirmed - TaxasGE"
            },
            "appointment_cancelled": {
                "es": "Cita cancelada - TaxasGE",
                "fr": "Rendez-vous annulé - TaxasGE",
                "en": "Appointment cancelled - TaxasGE"
            },
            "appointment_reminder": {
                "es": "Recordatorio de cita - TaxasGE",
                "fr": "Rappel de rendez-vous - TaxasGE",
                "en": "Appointment reminder - TaxasGE"
            },
            "declaration_submitted": {
                "es": "Declaración recibida - TaxasGE",
                "fr": "Déclaration reçue - TaxasGE",
                "en": "Declaration received - TaxasGE"
            },
            "declaration_validated": {
                "es": "Declaración validada - TaxasGE",
                "fr": "Déclaration validée - TaxasGE",
                "en": "Declaration validated - TaxasGE"
            },
            "declaration_rejected": {
                "es": "Declaración rechazada - TaxasGE",
                "fr": "Déclaration refusée - TaxasGE",
                "en": "Declaration rejected - TaxasGE"
            },
            "sla_warning": {
                "es": "Alerta SLA - TaxasGE",
                "fr": "Alerte SLA - TaxasGE",
                "en": "SLA Warning - TaxasGE"
            },
            "sla_breach": {
                "es": "Incumplimiento SLA - TaxasGE",
                "fr": "Violation SLA - TaxasGE",
                "en": "SLA Breach - TaxasGE"
            },
        }

        template_subjects = subjects.get(config.template_code, {})
        return template_subjects.get(language, template_subjects.get("es", "TaxasGE Notification"))

    async def _render_template(
        self,
        template_code: str,
        language: str,
        context: Dict[str, Any]
    ) -> Optional[str]:
        """
        Render a notification template.

        In the future, this will fetch templates from the database.
        For now, returns a basic HTML template.

        Args:
            template_code: Template identifier
            language: Language code
            context: Template variables

        Returns:
            Rendered HTML content or None if template not found
        """
        # Basic template rendering
        # In production, this would fetch from email_templates table
        user_name = context.get("user_name", "Usuario")

        # Generic template structure
        html = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: #1a73e8; color: white; padding: 20px; text-align: center; }}
                .content {{ padding: 20px; background: #f9f9f9; }}
                .footer {{ padding: 20px; text-align: center; font-size: 12px; color: #666; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>TaxasGE</h1>
                </div>
                <div class="content">
                    <p>Estimado/a {user_name},</p>
                    <p>{self._get_template_body(template_code, language, context)}</p>
                </div>
                <div class="footer">
                    <p>Este es un mensaje automático de TaxasGE.</p>
                    <p>No responda a este correo.</p>
                </div>
            </div>
        </body>
        </html>
        """
        return html

    def _get_template_body(
        self,
        template_code: str,
        language: str,
        context: Dict[str, Any]
    ) -> str:
        """Get the body text for a template."""
        amount = context.get("amount")
        receipt = context.get("receipt_number")
        reason = context.get("reason", "")

        bodies = {
            "payment_completed": {
                "es": f"Su pago de {amount} XAF ha sido procesado exitosamente. Número de recibo: {receipt}",
                "fr": f"Votre paiement de {amount} XAF a été traité avec succès. Numéro de reçu: {receipt}",
                "en": f"Your payment of {amount} XAF has been processed successfully. Receipt number: {receipt}"
            },
            "payment_failed": {
                "es": f"Su pago no pudo ser procesado. Motivo: {reason}",
                "fr": f"Votre paiement n'a pas pu être traité. Raison: {reason}",
                "en": f"Your payment could not be processed. Reason: {reason}"
            },
            "payment_cash_pending": {
                "es": "Su pago en efectivo está pendiente de validación por un agente.",
                "fr": "Votre paiement en espèces est en attente de validation par un agent.",
                "en": "Your cash payment is pending validation by an agent."
            },
            "payment_cash_validated": {
                "es": f"Su pago en efectivo ha sido validado. Número de recibo: {receipt}",
                "fr": f"Votre paiement en espèces a été validé. Numéro de reçu: {receipt}",
                "en": f"Your cash payment has been validated. Receipt number: {receipt}"
            },
            "payment_cash_rejected": {
                "es": f"Su pago en efectivo ha sido rechazado. Motivo: {reason}",
                "fr": f"Votre paiement en espèces a été refusé. Raison: {reason}",
                "en": f"Your cash payment has been rejected. Reason: {reason}"
            },
            "request_submitted": {
                "es": "Su solicitud ha sido recibida y está siendo procesada.",
                "fr": "Votre demande a été reçue et est en cours de traitement.",
                "en": "Your request has been received and is being processed."
            },
            "request_approved": {
                "es": "Su solicitud ha sido aprobada.",
                "fr": "Votre demande a été approuvée.",
                "en": "Your request has been approved."
            },
            "request_rejected": {
                "es": f"Su solicitud ha sido rechazada. Motivo: {reason}",
                "fr": f"Votre demande a été refusée. Raison: {reason}",
                "en": f"Your request has been rejected. Reason: {reason}"
            },
            "request_completed": {
                "es": "Su solicitud ha sido completada exitosamente.",
                "fr": "Votre demande a été complétée avec succès.",
                "en": "Your request has been completed successfully."
            },
            "appointment_booked": {
                "es": f"Su cita ha sido confirmada para el {context.get('appointment_date')} a las {context.get('appointment_time')}.",
                "fr": f"Votre rendez-vous a été confirmé pour le {context.get('appointment_date')} à {context.get('appointment_time')}.",
                "en": f"Your appointment has been confirmed for {context.get('appointment_date')} at {context.get('appointment_time')}."
            },
            "appointment_reminder": {
                "es": f"Le recordamos su cita programada para el {context.get('appointment_date')} a las {context.get('appointment_time')}.",
                "fr": f"Nous vous rappelons votre rendez-vous prévu pour le {context.get('appointment_date')} à {context.get('appointment_time')}.",
                "en": f"This is a reminder of your appointment scheduled for {context.get('appointment_date')} at {context.get('appointment_time')}."
            },
        }

        template_bodies = bodies.get(template_code, {})
        return template_bodies.get(
            language,
            template_bodies.get("es", "Tiene una nueva notificación de TaxasGE.")
        )


# =============================================================================
# REGISTRATION FUNCTION
# =============================================================================

def register_notification_handlers() -> NotificationEventHandler:
    """
    Register all notification handlers with the EventBus.
    Should be called once at application startup.

    Returns:
        The registered NotificationEventHandler instance
    """
    handler = NotificationEventHandler()
    handler.register()
    return handler
