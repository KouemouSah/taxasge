"""
Category Metadata - Localized labels and table associations for system translation categories

This module provides metadata for translation categories including:
- Localized labels (ES, FR, EN)
- Database table association
- Field/column associations
- Description

Used by the /categories endpoint to return enriched category information.
"""

from typing import Dict, List, Optional
from dataclasses import dataclass


@dataclass
class CategoryMetadata:
    """Metadata for a translation category"""
    code: str  # Category code (e.g., "enum.user_role")
    label_es: str  # Spanish label
    label_fr: str  # French label
    label_en: str  # English label
    description_es: str  # Spanish description
    description_fr: str  # French description
    description_en: str  # English description
    db_table: Optional[str] = None  # Associated database table
    db_column: Optional[str] = None  # Associated column/field
    db_enum: Optional[str] = None  # Associated PostgreSQL ENUM type


# Category metadata registry
# Organized by category type: enum.*, ui.*, form.*, message.*, etc.
CATEGORY_METADATA: Dict[str, CategoryMetadata] = {
    # ==========================================================================
    # ENUM TRANSLATIONS - PostgreSQL ENUM types
    # ==========================================================================

    # User role enum
    "enum.user_role": CategoryMetadata(
        code="enum.user_role",
        label_es="Rol de usuario",
        label_fr="Rôle d'utilisateur",
        label_en="User role",
        description_es="Valores del enum user_role_enum: admin, agent, supervisor, user, guest",
        description_fr="Valeurs de l'énumération user_role_enum: admin, agent, supervisor, user, guest",
        description_en="Values for user_role_enum: admin, agent, supervisor, user, guest",
        db_table="users",
        db_column="role",
        db_enum="user_role_enum",
    ),

    # User status enum
    "enum.user_status": CategoryMetadata(
        code="enum.user_status",
        label_es="Estado de usuario",
        label_fr="Statut d'utilisateur",
        label_en="User status",
        description_es="Valores del enum user_status_enum: active, inactive, suspended, pending_verification",
        description_fr="Valeurs de l'énumération user_status_enum: active, inactive, suspended, pending_verification",
        description_en="Values for user_status_enum: active, inactive, suspended, pending_verification",
        db_table="users",
        db_column="status",
        db_enum="user_status_enum",
    ),

    # Declaration status enum
    "enum.declaration_status": CategoryMetadata(
        code="enum.declaration_status",
        label_es="Estado de declaración",
        label_fr="Statut de déclaration",
        label_en="Declaration status",
        description_es="Valores del enum declaration_status_enum: draft, submitted, under_review, validated, rejected, paid, archived",
        description_fr="Valeurs de l'énumération declaration_status_enum: draft, submitted, under_review, validated, rejected, paid, archived",
        description_en="Values for declaration_status_enum: draft, submitted, under_review, validated, rejected, paid, archived",
        db_table="declarations",
        db_column="status",
        db_enum="declaration_status_enum",
    ),

    # Declaration type enum
    "enum.declaration_type": CategoryMetadata(
        code="enum.declaration_type",
        label_es="Tipo de declaración",
        label_fr="Type de déclaration",
        label_en="Declaration type",
        description_es="Valores del enum declaration_type_enum: income_tax, vat, property_tax, etc.",
        description_fr="Valeurs de l'énumération declaration_type_enum: income_tax, vat, property_tax, etc.",
        description_en="Values for declaration_type_enum: income_tax, vat, property_tax, etc.",
        db_table="declarations",
        db_column="declaration_type",
        db_enum="declaration_type_enum",
    ),

    # Payment status enum
    "enum.payment_status": CategoryMetadata(
        code="enum.payment_status",
        label_es="Estado de pago",
        label_fr="Statut de paiement",
        label_en="Payment status",
        description_es="Valores del enum payment_status_enum: pending, processing, completed, failed, refunded, cancelled",
        description_fr="Valeurs de l'énumération payment_status_enum: pending, processing, completed, failed, refunded, cancelled",
        description_en="Values for payment_status_enum: pending, processing, completed, failed, refunded, cancelled",
        db_table="payments",
        db_column="status",
        db_enum="payment_status_enum",
    ),

    # Payment method enum
    "enum.payment_method": CategoryMetadata(
        code="enum.payment_method",
        label_es="Método de pago",
        label_fr="Méthode de paiement",
        label_en="Payment method",
        description_es="Valores del enum payment_method_enum: mobile_money, bank_transfer, card, cash",
        description_fr="Valeurs de l'énumération payment_method_enum: mobile_money, bank_transfer, card, cash",
        description_en="Values for payment_method_enum: mobile_money, bank_transfer, card, cash",
        db_table="payments",
        db_column="payment_method",
        db_enum="payment_method_enum",
    ),

    # Service status enum
    "enum.service_status": CategoryMetadata(
        code="enum.service_status",
        label_es="Estado de servicio",
        label_fr="Statut de service",
        label_en="Service status",
        description_es="Valores del enum service_status_enum: active, inactive, deprecated",
        description_fr="Valeurs de l'énumération service_status_enum: active, inactive, deprecated",
        description_en="Values for service_status_enum: active, inactive, deprecated",
        db_table="fiscal_services",
        db_column="status",
        db_enum="service_status_enum",
    ),

    # Service type enum
    "enum.service_type": CategoryMetadata(
        code="enum.service_type",
        label_es="Tipo de servicio",
        label_fr="Type de service",
        label_en="Service type",
        description_es="Valores del enum service_type_enum: tax, fee, permit, registration, certificate, license",
        description_fr="Valeurs de l'énumération service_type_enum: tax, fee, permit, registration, certificate, license",
        description_en="Values for service_type_enum: tax, fee, permit, registration, certificate, license",
        db_table="fiscal_services",
        db_column="service_type",
        db_enum="service_type_enum",
    ),

    # Calculation method enum
    "enum.calculation_method": CategoryMetadata(
        code="enum.calculation_method",
        label_es="Método de cálculo",
        label_fr="Méthode de calcul",
        label_en="Calculation method",
        description_es="Valores del enum calculation_method_enum: fixed, percentage, tiered, formula, variable",
        description_fr="Valeurs de l'énumération calculation_method_enum: fixed, percentage, tiered, formula, variable",
        description_en="Values for calculation_method_enum: fixed, percentage, tiered, formula, variable",
        db_table="fiscal_services",
        db_column="calculation_method",
        db_enum="calculation_method_enum",
    ),

    # Assignment status enum
    "enum.assignment_status": CategoryMetadata(
        code="enum.assignment_status",
        label_es="Estado de asignación",
        label_fr="Statut d'assignation",
        label_en="Assignment status",
        description_es="Valores del enum assignment_status_enum: pending, assigned, in_progress, completed, reassigned",
        description_fr="Valeurs de l'énumération assignment_status_enum: pending, assigned, in_progress, completed, reassigned",
        description_en="Values for assignment_status_enum: pending, assigned, in_progress, completed, reassigned",
        db_table="agent_assignments",
        db_column="status",
        db_enum="assignment_status_enum",
    ),

    # Agent action type enum
    "enum.agent_action_type": CategoryMetadata(
        code="enum.agent_action_type",
        label_es="Tipo de acción de agente",
        label_fr="Type d'action d'agent",
        label_en="Agent action type",
        description_es="Valores del enum agent_action_type: review, approve, reject, escalate, comment",
        description_fr="Valeurs de l'énumération agent_action_type: review, approve, reject, escalate, comment",
        description_en="Values for agent_action_type: review, approve, reject, escalate, comment",
        db_table="agent_actions",
        db_column="action_type",
        db_enum="agent_action_type",
    ),

    # Company role enum
    "enum.company_role": CategoryMetadata(
        code="enum.company_role",
        label_es="Rol en empresa",
        label_fr="Rôle dans l'entreprise",
        label_en="Company role",
        description_es="Valores del enum company_role_enum: owner, admin, accountant, employee",
        description_fr="Valeurs de l'énumération company_role_enum: owner, admin, accountant, employee",
        description_en="Values for company_role_enum: owner, admin, accountant, employee",
        db_table="user_company_memberships",
        db_column="role",
        db_enum="company_role_enum",
    ),

    # ==========================================================================
    # UI TRANSLATIONS - User interface elements
    # ==========================================================================

    "ui.button": CategoryMetadata(
        code="ui.button",
        label_es="Botones",
        label_fr="Boutons",
        label_en="Buttons",
        description_es="Etiquetas de botones de la interfaz: guardar, cancelar, enviar, etc.",
        description_fr="Libellés des boutons de l'interface: enregistrer, annuler, soumettre, etc.",
        description_en="Button labels: save, cancel, submit, etc.",
        db_table=None,
        db_column=None,
    ),

    "ui.menu": CategoryMetadata(
        code="ui.menu",
        label_es="Menús",
        label_fr="Menus",
        label_en="Menus",
        description_es="Elementos del menú de navegación",
        description_fr="Éléments du menu de navigation",
        description_en="Navigation menu items",
        db_table=None,
        db_column=None,
    ),

    "ui.label": CategoryMetadata(
        code="ui.label",
        label_es="Etiquetas",
        label_fr="Étiquettes",
        label_en="Labels",
        description_es="Etiquetas de campos de formulario y elementos UI",
        description_fr="Étiquettes des champs de formulaire et éléments UI",
        description_en="Form field and UI element labels",
        db_table=None,
        db_column=None,
    ),

    "ui.tooltip": CategoryMetadata(
        code="ui.tooltip",
        label_es="Tooltips",
        label_fr="Info-bulles",
        label_en="Tooltips",
        description_es="Textos de ayuda contextual",
        description_fr="Textes d'aide contextuelle",
        description_en="Contextual help text",
        db_table=None,
        db_column=None,
    ),

    "ui.placeholder": CategoryMetadata(
        code="ui.placeholder",
        label_es="Placeholders",
        label_fr="Textes indicatifs",
        label_en="Placeholders",
        description_es="Textos de placeholder en campos de entrada",
        description_fr="Textes indicatifs dans les champs de saisie",
        description_en="Placeholder text in input fields",
        db_table=None,
        db_column=None,
    ),

    # ==========================================================================
    # FORM TRANSLATIONS - Form-specific texts
    # ==========================================================================

    "form.validation": CategoryMetadata(
        code="form.validation",
        label_es="Validación de formularios",
        label_fr="Validation de formulaires",
        label_en="Form validation",
        description_es="Mensajes de validación de campos: requerido, formato inválido, etc.",
        description_fr="Messages de validation des champs: requis, format invalide, etc.",
        description_en="Field validation messages: required, invalid format, etc.",
        db_table=None,
        db_column=None,
    ),

    "form.error": CategoryMetadata(
        code="form.error",
        label_es="Errores de formulario",
        label_fr="Erreurs de formulaire",
        label_en="Form errors",
        description_es="Mensajes de error en formularios",
        description_fr="Messages d'erreur dans les formulaires",
        description_en="Form error messages",
        db_table=None,
        db_column=None,
    ),

    "form.success": CategoryMetadata(
        code="form.success",
        label_es="Mensajes de éxito",
        label_fr="Messages de succès",
        label_en="Success messages",
        description_es="Mensajes de confirmación tras operaciones exitosas",
        description_fr="Messages de confirmation après opérations réussies",
        description_en="Confirmation messages after successful operations",
        db_table=None,
        db_column=None,
    ),

    # ==========================================================================
    # MESSAGE TRANSLATIONS - System messages and notifications
    # ==========================================================================

    "message.info": CategoryMetadata(
        code="message.info",
        label_es="Mensajes informativos",
        label_fr="Messages informatifs",
        label_en="Info messages",
        description_es="Mensajes informativos del sistema",
        description_fr="Messages informatifs du système",
        description_en="System informational messages",
        db_table=None,
        db_column=None,
    ),

    "message.warning": CategoryMetadata(
        code="message.warning",
        label_es="Advertencias",
        label_fr="Avertissements",
        label_en="Warnings",
        description_es="Mensajes de advertencia del sistema",
        description_fr="Messages d'avertissement du système",
        description_en="System warning messages",
        db_table=None,
        db_column=None,
    ),

    "message.error": CategoryMetadata(
        code="message.error",
        label_es="Errores",
        label_fr="Erreurs",
        label_en="Errors",
        description_es="Mensajes de error del sistema",
        description_fr="Messages d'erreur du système",
        description_en="System error messages",
        db_table=None,
        db_column=None,
    ),

    # ==========================================================================
    # AGENT/DASHBOARD TRANSLATIONS
    # ==========================================================================

    "agent.dashboard": CategoryMetadata(
        code="agent.dashboard",
        label_es="Panel del agente",
        label_fr="Tableau de bord agent",
        label_en="Agent dashboard",
        description_es="Textos del panel de control de agentes fiscales",
        description_fr="Textes du tableau de bord des agents fiscaux",
        description_en="Fiscal agent dashboard texts",
        db_table=None,
        db_column=None,
    ),

    "agent.workflow": CategoryMetadata(
        code="agent.workflow",
        label_es="Flujo de trabajo del agente",
        label_fr="Flux de travail agent",
        label_en="Agent workflow",
        description_es="Textos del flujo de trabajo de procesamiento de declaraciones",
        description_fr="Textes du flux de traitement des déclarations",
        description_en="Declaration processing workflow texts",
        db_table=None,
        db_column=None,
    ),

    # ==========================================================================
    # FISCAL TRANSLATIONS - Fiscal domain specific
    # ==========================================================================

    "fiscal.period": CategoryMetadata(
        code="fiscal.period",
        label_es="Períodos fiscales",
        label_fr="Périodes fiscales",
        label_en="Fiscal periods",
        description_es="Nombres de períodos fiscales: mensual, trimestral, anual",
        description_fr="Noms des périodes fiscales: mensuel, trimestriel, annuel",
        description_en="Fiscal period names: monthly, quarterly, annual",
        db_table="fiscal_periods",
        db_column="period_type",
    ),

    "fiscal.tax_type": CategoryMetadata(
        code="fiscal.tax_type",
        label_es="Tipos de impuestos",
        label_fr="Types d'impôts",
        label_en="Tax types",
        description_es="Nombres de tipos de impuestos y tasas",
        description_fr="Noms des types d'impôts et taxes",
        description_en="Tax and fee type names",
        db_table=None,
        db_column=None,
    ),

    # ==========================================================================
    # EMAIL/NOTIFICATION TRANSLATIONS
    # ==========================================================================

    "email.subject": CategoryMetadata(
        code="email.subject",
        label_es="Asuntos de correo",
        label_fr="Objets d'email",
        label_en="Email subjects",
        description_es="Asuntos de correos electrónicos del sistema",
        description_fr="Objets des emails du système",
        description_en="System email subject lines",
        db_table=None,
        db_column=None,
    ),

    "email.body": CategoryMetadata(
        code="email.body",
        label_es="Cuerpos de correo",
        label_fr="Corps d'email",
        label_en="Email bodies",
        description_es="Plantillas de contenido de correos electrónicos",
        description_fr="Modèles de contenu des emails",
        description_en="Email content templates",
        db_table=None,
        db_column=None,
    ),

    "notification.push": CategoryMetadata(
        code="notification.push",
        label_es="Notificaciones push",
        label_fr="Notifications push",
        label_en="Push notifications",
        description_es="Textos de notificaciones push móviles",
        description_fr="Textes des notifications push mobiles",
        description_en="Mobile push notification texts",
        db_table=None,
        db_column=None,
    ),

    # ==========================================================================
    # CHATBOT TRANSLATIONS
    # ==========================================================================

    "chatbot.response": CategoryMetadata(
        code="chatbot.response",
        label_es="Respuestas del chatbot",
        label_fr="Réponses du chatbot",
        label_en="Chatbot responses",
        description_es="Respuestas predefinidas del asistente virtual",
        description_fr="Réponses prédéfinies de l'assistant virtuel",
        description_en="Predefined virtual assistant responses",
        db_table=None,
        db_column=None,
    ),

    "chatbot.greeting": CategoryMetadata(
        code="chatbot.greeting",
        label_es="Saludos del chatbot",
        label_fr="Salutations du chatbot",
        label_en="Chatbot greetings",
        description_es="Mensajes de bienvenida y saludos del chatbot",
        description_fr="Messages de bienvenue et salutations du chatbot",
        description_en="Chatbot welcome and greeting messages",
        db_table=None,
        db_column=None,
    ),
}


def get_category_metadata(code: str) -> Optional[CategoryMetadata]:
    """
    Get metadata for a specific category code

    Args:
        code: Category code (e.g., "enum.user_role")

    Returns:
        CategoryMetadata or None if not found
    """
    return CATEGORY_METADATA.get(code)


def get_all_category_metadata() -> Dict[str, CategoryMetadata]:
    """
    Get all category metadata

    Returns:
        Dict of category code to CategoryMetadata
    """
    return CATEGORY_METADATA


def get_category_label(code: str, language: str = "es") -> str:
    """
    Get localized label for a category

    Args:
        code: Category code
        language: Language code (es, fr, en)

    Returns:
        Localized label or code if not found
    """
    metadata = CATEGORY_METADATA.get(code)
    if not metadata:
        return code  # Return code as fallback

    if language == "fr":
        return metadata.label_fr
    elif language == "en":
        return metadata.label_en
    else:
        return metadata.label_es


def enrich_categories(
    categories: List[str],
    language: str = "es"
) -> List[Dict]:
    """
    Enrich category list with metadata

    Args:
        categories: List of category codes from database
        language: Language code for labels

    Returns:
        List of enriched category dicts with labels
    """
    enriched = []

    for code in categories:
        metadata = CATEGORY_METADATA.get(code)

        if metadata:
            # Get label based on language
            if language == "fr":
                label = metadata.label_fr
                description = metadata.description_fr
            elif language == "en":
                label = metadata.label_en
                description = metadata.description_en
            else:
                label = metadata.label_es
                description = metadata.description_es

            enriched.append({
                "code": code,
                "label": label,
                "description": description,
                "db_table": metadata.db_table,
                "db_column": metadata.db_column,
                "db_enum": metadata.db_enum,
            })
        else:
            # Unknown category - use code as label
            enriched.append({
                "code": code,
                "label": code,  # Fallback to code
                "description": None,
                "db_table": None,
                "db_column": None,
                "db_enum": None,
            })

    return enriched
