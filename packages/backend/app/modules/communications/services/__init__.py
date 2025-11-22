"""
Communications Services
"""

from app.modules.communications.services.email_service import EmailService, get_email_service
from app.modules.communications.services.communication_service import CommunicationService

__all__ = [
    "EmailService",
    "get_email_service",
    "CommunicationService",
]
