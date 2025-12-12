"""
Communications Services
"""

from app.modules.communications.services.email_service import EmailService, get_email_service
from app.modules.communications.services.communication_service import CommunicationService
from app.modules.communications.services.template_service import TemplateService, get_template_service
from app.modules.communications.services.email_content import get_email_content, get_supported_languages
from app.modules.communications.services.email_template_service import EmailTemplateService

__all__ = [
    "EmailService",
    "get_email_service",
    "CommunicationService",
    "TemplateService",
    "get_template_service",
    "get_email_content",
    "get_supported_languages",
    "EmailTemplateService",
]
