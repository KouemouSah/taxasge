"""
Company Fiscal Regime Classifier — Rules-based with LLM fallback.

Classifies a company's `regimen_fiscal` based on its attributes:
- commerce_type → if matches a known service_bundle → 'bundle'
- capital_social / employee_count thresholds → 'declarativo'
- Both conditions → 'mixto'
- NGO/government → 'exento'
- Default → 'pendiente'

The classifier queries the DB for active bundle commerce_types
so rules stay in sync with fiscal catalog changes.
"""

from typing import Dict, Any, Optional
from decimal import Decimal
from loguru import logger
import asyncpg


# Thresholds for declarativo regime (companies above these are too large for bundle system)
DECLARATIVO_CAPITAL_THRESHOLD = Decimal("50000000")  # 50M XAF
DECLARATIVO_EMPLOYEE_THRESHOLD = 50

# Known exempt entity types (registered NGOs, embassies, government entities)
EXEMPT_FORMA_JURIDICA = {
    "ong", "asociacion", "fundacion", "embajada", "organismo_internacional",
    "gobierno", "entidad_publica",
}


class CompanyClassifier:
    """Rules-based fiscal regime classifier."""

    async def classify(
        self,
        conn: asyncpg.Connection,
        company: Dict[str, Any],
    ) -> Dict[str, Any]:
        """Classify a company's fiscal regime.

        Returns dict with:
            regimen_fiscal: str ('bundle', 'declarativo', 'mixto', 'exento', 'pendiente')
            confidence: float (0.0 - 1.0)
            reason: str (explanation of classification)
        """
        commerce_type = company.get("commerce_type")
        capital_social = company.get("capital_social")
        employee_count = company.get("employee_count")
        forma_juridica = (company.get("forma_juridica") or "").lower().strip()

        # Rule 1: Exempt entities
        if forma_juridica in EXEMPT_FORMA_JURIDICA:
            return {
                "regimen_fiscal": "exento",
                "confidence": 0.95,
                "reason": f"Forma jurídica '{forma_juridica}' es exenta de obligaciones fiscales comerciales",
            }

        # Rule 2: Check if commerce_type matches an active bundle
        has_bundle = False
        if commerce_type:
            bundle_exists = await conn.fetchval(
                "SELECT EXISTS(SELECT 1 FROM service_bundles WHERE commerce_type = $1 AND is_active = true)",
                commerce_type,
            )
            has_bundle = bool(bundle_exists)

        # Rule 3: Check declarativo thresholds
        is_large = False
        large_reasons = []
        if capital_social and capital_social > DECLARATIVO_CAPITAL_THRESHOLD:
            is_large = True
            large_reasons.append(f"capital social {capital_social:,.0f} XAF > {DECLARATIVO_CAPITAL_THRESHOLD:,.0f}")
        if employee_count and employee_count > DECLARATIVO_EMPLOYEE_THRESHOLD:
            is_large = True
            large_reasons.append(f"{employee_count} empleados > {DECLARATIVO_EMPLOYEE_THRESHOLD}")

        # Classification decision tree
        if has_bundle and is_large:
            return {
                "regimen_fiscal": "mixto",
                "confidence": 0.85,
                "reason": f"Bundle activo para '{commerce_type}' + empresa grande ({', '.join(large_reasons)})",
            }

        if has_bundle and not is_large:
            return {
                "regimen_fiscal": "bundle",
                "confidence": 0.90,
                "reason": f"Bundle activo para '{commerce_type}', empresa de tamaño estándar",
            }

        if is_large and not has_bundle:
            return {
                "regimen_fiscal": "declarativo",
                "confidence": 0.80,
                "reason": f"Sin bundle para '{commerce_type or 'N/A'}', empresa grande ({', '.join(large_reasons)})",
            }

        # Not enough data to classify
        missing = []
        if not commerce_type:
            missing.append("commerce_type")
        if not capital_social:
            missing.append("capital_social")
        if not employee_count:
            missing.append("employee_count")

        return {
            "regimen_fiscal": "pendiente",
            "confidence": 0.30,
            "reason": f"Datos insuficientes para clasificar. Faltan: {', '.join(missing) if missing else 'commerce_type sin bundle asociado'}",
        }

    async def classify_and_update(
        self,
        conn: asyncpg.Connection,
        company_id: str,
    ) -> Optional[Dict[str, Any]]:
        """Classify and update company's regimen_fiscal in DB.

        Returns the classification result or None if company not found.
        """
        company = await conn.fetchrow("SELECT * FROM companies WHERE id = $1", company_id)
        if not company:
            return None

        result = await self.classify(conn, dict(company))
        regimen = result["regimen_fiscal"]

        # Update only if different
        current = company.get("regimen_fiscal") or "pendiente"
        if current != regimen:
            await conn.execute(
                "UPDATE companies SET regimen_fiscal = $2, updated_at = NOW() WHERE id = $1",
                company_id, regimen,
            )
            logger.info(
                f"Company {company_id} reclassified: {current} → {regimen} "
                f"(confidence={result['confidence']:.0%}, reason={result['reason']})"
            )

        return result
