"""
Declaration Form Mappers
Maps extracted fiscal declaration data to frontend forms

Author: Claude Code
Date: 2025-11-13
Version: 2.0 - IVA and IRPF form mapping
"""

from typing import Dict, Any, Optional
from app.core.documents.mappers.base import BaseFormMapper


class IVAFormMapper(BaseFormMapper):
    """
    Maps IVA extraction data to FormIVA fields

    Frontend form: FormIVA (React component)
    """

    def get_form_type(self) -> str:
        return "declaration_iva"

    def get_field_mapping(self) -> Dict[str, str]:
        """
        Map extractor fields to FormIVA fields

        Returns:
            Mapping dict: extractor_field -> form_field
        """
        return {
            # Identification
            "nif": "nif",
            "empresa": "empresa_nombre",
            "ejercicio": "ejercicio",
            "periodo": "periodo",
            "fecha": "fecha_presentacion",
            "auto_liquidacion_num": "auto_liquidacion_numero",

            # Régimen General (01-03)
            "base_imponible_general": "regimen_general_base",
            "tipo_general": "regimen_general_tipo",
            "cuota_general": "regimen_general_cuota",

            # Régimen Reducido 1 (04-06)
            "base_imponible_reducido1": "regimen_reducido1_base",
            "tipo_reducido1": "regimen_reducido1_tipo",
            "cuota_reducido1": "regimen_reducido1_cuota",

            # Régimen Reducido 2 (07-09)
            "base_imponible_reducido2": "regimen_reducido2_base",
            "tipo_reducido2": "regimen_reducido2_tipo",
            "cuota_reducido2": "regimen_reducido2_cuota",

            # Total
            "total_ingresar": "total_a_ingresar"
        }

    def _transform_value(
        self,
        form_field: str,
        value: Any,
        metadata: Optional[Dict[str, Any]]
    ) -> Any:
        """Transform value for IVA form"""

        # Currency fields: ensure float format
        if any(keyword in form_field for keyword in ["base", "cuota", "total"]):
            if isinstance(value, (int, float)):
                return round(value, 2)
            return value

        # Percentage fields: ensure float format
        if "tipo" in form_field:
            if isinstance(value, (int, float)):
                return round(value, 2)
            return value

        # Periodo: normalize to "1T", "2T", etc.
        if form_field == "periodo":
            periodo = str(value).upper()
            if periodo.isdigit():
                month = int(periodo)
                if month <= 12:
                    # Monthly to quarterly
                    trimestre = ((month - 1) // 3) + 1
                    return f"{trimestre}T"
                return periodo
            return periodo

        return value

    def _calculate_derived_fields(self, pre_filled_fields: Dict[str, Any]) -> Dict[str, Any]:
        """Calculate IVA derived fields"""
        derived = {}

        # Calculate total IVA if all cuotas are present
        cuotas = []
        for field in ["regimen_general_cuota", "regimen_reducido1_cuota", "regimen_reducido2_cuota"]:
            if field in pre_filled_fields:
                try:
                    cuotas.append(float(pre_filled_fields[field]))
                except:
                    pass

        if cuotas:
            derived["total_cuotas_iva"] = round(sum(cuotas), 2)

        # Verify cuota calculations
        for regime in ["general", "reducido1", "reducido2"]:
            base_field = f"regimen_{regime}_base"
            tipo_field = f"regimen_{regime}_tipo"
            cuota_field = f"regimen_{regime}_cuota"

            if all(f in pre_filled_fields for f in [base_field, tipo_field]):
                try:
                    base = float(pre_filled_fields[base_field])
                    tipo = float(pre_filled_fields[tipo_field])
                    calculated_cuota = base * (tipo / 100)

                    derived[f"regimen_{regime}_cuota_calculated"] = round(calculated_cuota, 2)
                except:
                    pass

        return derived


class IRPFFormMapper(BaseFormMapper):
    """
    Maps IRPF extraction data to FormIRPF fields

    Frontend form: FormIRPF (React component)
    """

    def get_form_type(self) -> str:
        return "declaration_irpf"

    def get_field_mapping(self) -> Dict[str, str]:
        """
        Map extractor fields to FormIRPF fields

        Returns:
            Mapping dict: extractor_field -> form_field
        """
        return {
            # Identification
            "nif": "nif",
            "nombre_completo": "nombre_completo",
            "ejercicio": "ejercicio",

            # Income
            "rendimientos_trabajo": "rendimientos_trabajo",
            "rendimientos_actividades": "rendimientos_actividades_economicas",
            "rendimientos_capital": "rendimientos_capital",

            # Base
            "base_imponible": "base_imponible_general",

            # Deductions
            "deducciones_familiares": "deduccion_minimo_personal",
            "deducciones_vivienda": "deduccion_vivienda_habitual",

            # Result
            "cuota_integra": "cuota_integra",
            "tipo_gravamen": "tipo_medio_gravamen",
            "resultado_declaracion": "resultado_declaracion"
        }

    def _transform_value(
        self,
        form_field: str,
        value: Any,
        metadata: Optional[Dict[str, Any]]
    ) -> Any:
        """Transform value for IRPF form"""

        # Currency fields: ensure float format
        if any(keyword in form_field for keyword in ["rendimientos", "base", "cuota", "deducc", "resultado"]):
            if isinstance(value, (int, float)):
                return round(value, 2)
            return value

        # Percentage fields: ensure float format
        if "tipo" in form_field or "gravamen" in form_field:
            if isinstance(value, (int, float)):
                return round(value, 2)
            return value

        return value

    def _calculate_derived_fields(self, pre_filled_fields: Dict[str, Any]) -> Dict[str, Any]:
        """Calculate IRPF derived fields"""
        derived = {}

        # Calculate total income
        income_fields = [
            "rendimientos_trabajo",
            "rendimientos_actividades_economicas",
            "rendimientos_capital"
        ]

        total_income = 0.0
        for field in income_fields:
            if field in pre_filled_fields:
                try:
                    total_income += float(pre_filled_fields[field])
                except:
                    pass

        if total_income > 0:
            derived["total_ingresos"] = round(total_income, 2)

        # Calculate total deductions
        deduction_fields = [
            "deduccion_minimo_personal",
            "deduccion_vivienda_habitual"
        ]

        total_deductions = 0.0
        for field in deduction_fields:
            if field in pre_filled_fields:
                try:
                    total_deductions += float(pre_filled_fields[field])
                except:
                    pass

        if total_deductions > 0:
            derived["total_deducciones"] = round(total_deductions, 2)

        return derived


# Singleton instances
iva_form_mapper = IVAFormMapper()
irpf_form_mapper = IRPFFormMapper()
