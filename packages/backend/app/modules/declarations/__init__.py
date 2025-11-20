"""
Declarations Module - Tax Declarations Management

Module critique gérant les déclarations fiscales:
- 28 types de déclarations (IVA, IRPF, Pétrolifères, Retenciones, etc.)
- 9 tables DB (tax_declarations + 5 details + 3 audit)
- Workflow complet: draft → submitted → processing → accepted/rejected
- Support OCR extraction via Documents module
- Intégration Payments pour règlement
- Intégration Agents pour validation

Tables DB:
- tax_declarations (table principale)
- declaration_iva_details (90% volume)
- declaration_irpf_data (5% volume)
- declaration_petroliferos_details (4% volume, gros montants)
- declaration_retencion_details (retenues à la source)
- declaration_other_details (7 autres types, <1% volume)
- declaration_amount_adjustments (audit trail ajustements)
- declaration_corrections (audit trail corrections)
- calculation_history (historique calculs)

Endpoints: ~25
Priorité: 🔴 CRITIQUE P1
"""

from app.modules.declarations.api.declaration_routes import router as declaration_router

__all__ = ["declaration_router"]
