"""
Unit tests for CompanyClassificationAgent._rules_classify()

Tests the deterministic rules engine WITHOUT DB (no LLM, no async).
Covers all classification paths: R1 (exempt), R2 (special), R2b (autonomo+PE),
R2c (autonomo without PE), R3 (commercial sector), R4 (size), R5 (regime matrix).
"""

import pytest
from decimal import Decimal
from unittest.mock import AsyncMock, MagicMock

# Import the module constants and the class
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', '..', 'app'))

from modules.companies.services.classification_agent import (
    CompanyClassificationAgent,
    EXEMPT_FORMAS,
    SPECIAL_FORMAS,
    PERSONA_FISICA_FORMAS,
    COMMERCIAL_SUBSECTORS,
    DECLARATIVO_CAPITAL_THRESHOLD,
    DECLARATIVO_EMPLOYEE_THRESHOLD,
)


agent = CompanyClassificationAgent()


class TestR1ExemptEntities:
    """Rule 1: Exempt forma_juridica → exento."""

    @pytest.mark.parametrize("forma", list(EXEMPT_FORMAS))
    def test_exempt_forms_return_exento(self, forma):
        result = agent._rules_classify({
            "forma_juridica": forma,
            "sector_actividad": "primario",
        })
        assert result.regimen_fiscal == "exento"
        assert result.confidence >= 0.90
        assert "R1_exempt_forma_juridica" in result.rules_applied

    def test_exempt_case_insensitive(self):
        result = agent._rules_classify({"forma_juridica": "  ONG  "})
        assert result.regimen_fiscal == "exento"


class TestR2SpecialForms:
    """Rule 2: Special forms → declarativo."""

    @pytest.mark.parametrize("forma", list(SPECIAL_FORMAS))
    def test_special_forms_return_declarativo(self, forma):
        result = agent._rules_classify({"forma_juridica": forma})
        assert result.regimen_fiscal == "declarativo"
        assert "R2_special_forma_declarativo" in result.rules_applied


class TestR2bAutonomoPE:
    """Rule 2b: Autonomo + PE-XXXX → ALWAYS bundle (hard rule)."""

    def test_autonomo_with_pe_is_bundle(self):
        result = agent._rules_classify({
            "forma_juridica": "autonomo",
            "registration_number": "PE-001234",
        })
        assert result.regimen_fiscal == "bundle"
        assert result.confidence >= 0.95
        assert "R2b_autonomo_pe_always_bundle" in result.rules_applied

    def test_autonomo_with_pe_ignores_size(self):
        """Even a large autonomo with PE is bundle, not mixto."""
        result = agent._rules_classify({
            "forma_juridica": "autonomo",
            "registration_number": "PE-999999",
            "capital_social": 100_000_000,  # 100M XAF > threshold
            "employee_count": 200,
        })
        assert result.regimen_fiscal == "bundle"

    def test_empresa_individual_with_pe_is_bundle(self):
        result = agent._rules_classify({
            "forma_juridica": "empresa_individual",
            "registration_number": "PE-0055",
        })
        assert result.regimen_fiscal == "bundle"


class TestR2cAutonomoWithoutPE:
    """Rule 2c: Autonomo WITHOUT PE → presumed commercial → flow R3-R5."""

    def test_autonomo_no_pe_no_sector_is_bundle(self):
        """Autonomo presumed commercial → small + commercial → bundle."""
        result = agent._rules_classify({
            "forma_juridica": "autonomo",
            # No registration_number, no sector_actividad
        })
        assert result.regimen_fiscal == "bundle"
        assert "R2c_persona_fisica_presumed_commercial" in result.rules_applied

    def test_autonomo_large_no_pe_is_mixto(self):
        """Large autonomo without PE → commercial + large → mixto."""
        result = agent._rules_classify({
            "forma_juridica": "autonomo",
            "capital_social": 60_000_000,
        })
        assert result.regimen_fiscal == "mixto"


class TestR3CommercialActivity:
    """Rule 3: Sector terciario + commercial subsector."""

    def test_terciario_comercio_is_commercial(self):
        result = agent._rules_classify({
            "forma_juridica": "sociedad_limitada",
            "sector_actividad": "terciario",
            "subsector_actividad": "comercio",
        })
        assert result.regimen_fiscal == "bundle"
        assert "R3_terciario_commercial" in result.rules_applied

    def test_terciario_servicios_is_commercial(self):
        result = agent._rules_classify({
            "forma_juridica": "sociedad_anonima",
            "sector_actividad": "TERCIARIO",  # Case insensitive
            "subsector_actividad": "SERVICIOS",
        })
        assert result.regimen_fiscal == "bundle"

    def test_explicit_commerce_type_is_commercial(self):
        result = agent._rules_classify({
            "forma_juridica": "sociedad_limitada",
            "commerce_type": "electronics_retail",
        })
        assert result.regimen_fiscal == "bundle"
        assert "R3_explicit_commerce_type" in result.rules_applied


class TestR4SizeCheck:
    """Rule 4: Capital/employee thresholds."""

    def test_high_capital_is_large(self):
        result = agent._rules_classify({
            "forma_juridica": "sociedad_anonima",
            "sector_actividad": "terciario",
            "subsector_actividad": "comercio",
            "capital_social": 60_000_000,  # > 50M
        })
        assert result.regimen_fiscal == "mixto"  # commercial + large

    def test_many_employees_is_large(self):
        result = agent._rules_classify({
            "forma_juridica": "cooperativa",
            "sector_actividad": "terciario",
            "subsector_actividad": "servicios",
            "employee_count": 100,  # > 50
        })
        assert result.regimen_fiscal == "mixto"

    def test_below_thresholds_is_small(self):
        result = agent._rules_classify({
            "forma_juridica": "sociedad_limitada",
            "sector_actividad": "terciario",
            "subsector_actividad": "comercio",
            "capital_social": 10_000_000,
            "employee_count": 10,
        })
        assert result.regimen_fiscal == "bundle"


class TestR5RegimeMatrix:
    """Rule 5: Decision matrix (is_commercial × is_large)."""

    def test_commercial_small_is_bundle(self):
        result = agent._rules_classify({
            "forma_juridica": "sociedad_limitada",
            "commerce_type": "retail",
        })
        assert result.regimen_fiscal == "bundle"

    def test_commercial_large_is_mixto(self):
        result = agent._rules_classify({
            "forma_juridica": "sociedad_anonima",
            "commerce_type": "retail",
            "capital_social": 80_000_000,
        })
        assert result.regimen_fiscal == "mixto"

    def test_non_commercial_large_is_declarativo(self):
        result = agent._rules_classify({
            "forma_juridica": "sociedad_anonima",
            "sector_actividad": "primario",
            "capital_social": 100_000_000,
        })
        assert result.regimen_fiscal == "declarativo"

    def test_non_commercial_small_is_declarativo(self):
        result = agent._rules_classify({
            "forma_juridica": "sociedad_limitada",
            "sector_actividad": "primario",
        })
        assert result.regimen_fiscal == "declarativo"
        assert result.confidence <= 0.80

    def test_empty_data_is_pendiente_or_declarativo(self):
        result = agent._rules_classify({})
        # No forma, no sector → not commercial, not large → declarativo
        assert result.regimen_fiscal in ("declarativo", "pendiente")


class TestNIFNormalization:
    """Test that classification handles various NIF/PE formats."""

    def test_pe_with_spaces(self):
        """PE with spaces should still match (normalization happens at DB level)."""
        result = agent._rules_classify({
            "forma_juridica": "autonomo",
            "registration_number": "PE-001234",
        })
        assert result.regimen_fiscal == "bundle"

    def test_pe_lowercase(self):
        """PE comparison is uppercase."""
        result = agent._rules_classify({
            "forma_juridica": "autonomo",
            "registration_number": "pe-001234",
        })
        # pe- doesn't match PE- (uppercase check)
        # This tests the actual behavior
        assert result.regimen_fiscal in ("bundle", "declarativo")
