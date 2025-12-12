"""
Communications Models
"""

from app.modules.communications.models.communication import (
    CommunicationType,
    CommunicationStatus,
    EmailTemplate,
)

from app.modules.communications.models.sms_template import (
    SmsTemplateCategory,
    SmsTemplateCreate,
    SmsTemplateUpdate,
    SmsTemplateResponse,
    SmsTemplateListResponse,
    SmsCharacterCount,
    SmsTemplateRenderRequest,
    SmsTemplateRenderResponse,
)

__all__ = [
    # Communication models
    "CommunicationType",
    "CommunicationStatus",
    "EmailTemplate",
    # SMS Template models
    "SmsTemplateCategory",
    "SmsTemplateCreate",
    "SmsTemplateUpdate",
    "SmsTemplateResponse",
    "SmsTemplateListResponse",
    "SmsCharacterCount",
    "SmsTemplateRenderRequest",
    "SmsTemplateRenderResponse",
]
