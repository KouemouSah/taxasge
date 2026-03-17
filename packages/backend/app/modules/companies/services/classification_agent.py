"""
CompanyClassificationAgent — Production-grade company fiscal regime classifier.

Architecture (3-layer):
  Layer 1: Rules-based decision tree (deterministic, handles 80%+ of cases)
           Uses STRUCTURAL ATTRIBUTES only: forma_juridica, sector, subsector, size.
  Layer 2: LLM inference for commerce_type (from objeto_social + sector)
  Layer 3: LLM validation for edge cases (contradictions, low confidence)

CRITICAL DESIGN PRINCIPLE:
  Bundles = CONSEQUENCE of classification, NOT a criterion.
  Classification uses structural attributes → regime determined → THEN bundles loaded.
  A company classified 'bundle' without an existing bundle = admin flag, NOT 'pendiente'.

Batch-capable: asyncio.Semaphore for concurrent processing.
Draft workflow: creates company_creation_drafts → admin validates.
Audit trail: company_classification_history for every reclassification.
"""

import asyncio
import json
from decimal import Decimal, InvalidOperation
from typing import Any, Dict, List, Optional, Tuple

import asyncpg
from loguru import logger

from app.modules.companies.models.classification import (
    BatchClassificationResult,
    ClassificationResult,
    ExtractionResult,
)
from app.modules.shared.services.llm_agent_mixin import LLMAgentMixin


# ── Constants ────────────────────────────────────────────────────────────────

# Thresholds (from GE fiscal legislation)
DECLARATIVO_CAPITAL_THRESHOLD = Decimal("50000000")  # 50M XAF
DECLARATIVO_EMPLOYEE_THRESHOLD = 50

# Auto-approve threshold for drafts
AUTO_APPROVE_CONFIDENCE = 0.90

# Concurrency limits for batch processing
CLASSIFY_CONCURRENCY = 20
EXTRACT_CONCURRENCY = 5

# Exempt legal forms (no commercial tax obligations)
EXEMPT_FORMAS = frozenset({
    "ong", "asociacion", "fundacion", "embajada",
    "organismo_internacional", "gobierno", "entidad_publica",
})

# Persona fisica forms (IRPF regime, not ISS)
PERSONA_FISICA_FORMAS = frozenset({
    "autonomo", "empresa_individual",
})

# Persona moral forms (ISS regime)
PERSONA_MORAL_FORMAS = frozenset({
    "sociedad_limitada", "sociedad_anonima", "sucursal", "cooperativa",
})

# Special forms (always declarativo)
SPECIAL_FORMAS = frozenset({
    "representacion_comercial", "joint_venture", "ute",
})

# Commercial sectors/subsectors
COMMERCIAL_SUBSECTORS = frozenset({
    "comercio", "servicios",
})


# ── LLM Prompts ─────────────────────────────────────────────────────────────

COMMERCE_TYPE_PROMPT = """Eres un experto en clasificación comercial de Guinea Ecuatorial.

DATOS DE LA EMPRESA:
- Objeto social: {objeto_social}
- Sector: {sector}
- Subsector: {subsector}
- Forma jurídica: {forma_juridica}

TIPOS DE COMERCIO DISPONIBLES (bundles fiscales activos):
{commerce_types_list}

TAREA: Identifica el commerce_type más apropiado para esta empresa.

REGLAS:
1. Mapear al commerce_type MÁS ESPECÍFICO de la lista disponible
2. Si la actividad no corresponde a NINGÚN tipo → responder null
3. Si hay ambigüedad entre 2 tipos → elegir el más probable + flag
4. Responder SOLO con JSON válido

RESPUESTA (JSON):
{{"commerce_type": "<string o null>", "confidence": <float 0-1>, "reasoning": "<string>", "alternatives": ["<string>"]}}"""

VALIDATION_PROMPT = """Evalúa la coherencia de esta clasificación de empresa en Guinea Ecuatorial.

DATOS EMPRESA:
- Nombre: {name}
- Forma jurídica: {forma}
- Sector: {sector} / Subsector: {subsector}
- Objeto social: {objeto_social}
- Commerce type inferido: {commerce_type}
- Capital: {capital} XAF
- Empleados: {employees}
- Documento: {doc_type} ({identifier})

CLASIFICACIÓN POR REGLAS:
- Régimen: {rules_regime}
- Confidence: {rules_confidence}
- Razón: {rules_reason}

PREGUNTAS:
1. ¿La forma_juridica es coherente con el tipo de documento (NIF vs PE)?
2. ¿El commerce_type inferido es coherente con el objeto social?
3. ¿El régimen asignado es correcto para este perfil de empresa?
4. ¿Hay datos contradictorios o sospechosos?

Responde SOLO con JSON:
{{"is_valid": <bool>, "suggested_regime": "<string o null>", "confidence": <float 0-1>, "issues": ["<string>"], "recommendations": ["<string>"]}}"""

EXTRACTION_PROMPT = """Eres un experto en registro empresarial de Guinea Ecuatorial.
Extrae los datos de la empresa del siguiente documento.

TIPO DE DOCUMENTO: {doc_type}

DOCUMENTO:
{document_text}

CAMPOS A EXTRAER (JSON):
- nif: Número de Identificación Fiscal (formato XXXXXCC-XX) o null
- registration_number: Número registro PE-XXXX (solo para AUTÓNOMO) o null
- legal_name: Razón social / denominación completa
- forma_juridica: Una de [empresa_individual, autonomo, sociedad_limitada, sociedad_anonima, sucursal, cooperativa, ong, asociacion, fundacion, embajada, organismo_internacional, gobierno, entidad_publica, representacion_comercial, joint_venture, ute]
- sector_actividad: "Primario" | "Secundario" | "Terciario"
- subsector_actividad: "COMERCIO" | "SERVICIOS" | otro (texto libre)
- objeto_social: Descripción completa de la actividad comercial
- capital_social: Capital social en XAF (solo número) o null
- employee_count: Número de empleados (entero) o null
- domicilio_fiscal: Dirección completa
- representante_legal: Nombre completo del representante
- nacionalidad: Nacionalidad de la empresa
- fecha_constitucion: Fecha de creación (YYYY-MM-DD) o null
- estado_empresa: "ACTIVA" | "INACTIVA"

REGLAS CRÍTICAS:
1. Si un campo no se encuentra, usar null — NO inventar
2. Para capital_social: solo el número, sin "F.CFA" ni puntos de miles
3. Para forma_juridica: mapear al valor EXACTO de la lista
4. CROSS-CHECK: Si doc_type=CERTIFICADO_ACTUALIZACION_PADRON → forma_juridica DEBE ser autonomo
5. CROSS-CHECK: Si registration_number empieza por PE- → forma_juridica DEBE ser autonomo
6. Responder SOLO con JSON válido

JSON:"""


# ── Classification Agent ─────────────────────────────────────────────────────

class CompanyClassificationAgent(LLMAgentMixin):
    """Production-grade company classifier with LLM augmentation.

    Rules-first architecture: deterministic rules handle 80%+ of cases,
    LLM augments for commerce_type inference and edge-case validation.
    """

    def _get_service_name(self) -> str:
        return "CompanyClassificationAgent"

    def _get_model_name(self) -> str:
        from app.config import get_settings
        return getattr(get_settings(), "GEMINI_CHAT_MODEL", "gemini-2.0-flash")

    def _get_default_generation_config(self) -> dict:
        return {"temperature": 0.1, "max_output_tokens": 1024}

    # ── Public API ───────────────────────────────────────────────────────

    async def classify_company(
        self,
        conn: asyncpg.Connection,
        company_data: Dict[str, Any],
        zone_id: Optional[str] = None,
    ) -> ClassificationResult:
        """Classify a single company. Rules first, LLM if needed.

        Args:
            conn: Database connection
            company_data: Company attributes (forma_juridica, sector, etc.)
            zone_id: Commerce zone for bundle lookup (optional)

        Returns:
            ClassificationResult with regime, confidence, and reasoning.
        """
        # Layer 1: Rules-based classification
        result = self._rules_classify(company_data)

        # Layer 2: LLM commerce_type inference (if commercial but no commerce_type)
        if (
            result.regimen_fiscal in ("bundle", "mixto")
            and not company_data.get("commerce_type")
            and company_data.get("objeto_social")
        ):
            inferred = await self._llm_infer_commerce_type(
                conn,
                company_data.get("objeto_social", ""),
                company_data.get("sector_actividad", ""),
                company_data.get("subsector_actividad", ""),
                company_data.get("forma_juridica", ""),
            )
            if inferred:
                result.commerce_type = inferred
                result.rules_applied.append("llm_commerce_type_inference")

        # Layer 3: Post-classification validation (bundle existence, cross-checks)
        result = await self._validate_post_classification(
            conn, result, company_data, zone_id
        )

        return result

    async def classify_batch(
        self,
        conn: asyncpg.Connection,
        items: List[Dict[str, Any]],
        zone_id: Optional[str] = None,
    ) -> BatchClassificationResult:
        """Classify a batch of companies with concurrency control.

        Args:
            conn: Database connection
            items: List of company data dicts
            zone_id: Default zone for all items (overridable per item)

        Returns:
            BatchClassificationResult with counts and per-item results.
        """
        sem = asyncio.Semaphore(CLASSIFY_CONCURRENCY)
        results = []
        errors = 0
        auto_approved = 0
        pending_review = 0

        async def _classify_one(item: Dict[str, Any]) -> Optional[Dict[str, Any]]:
            nonlocal errors, auto_approved, pending_review
            async with sem:
                try:
                    item_zone = item.get("zone_id") or zone_id
                    result = await self.classify_company(conn, item, item_zone)
                    entry = {
                        "company_data": item,
                        "classification": result.model_dump(),
                    }
                    if result.confidence >= AUTO_APPROVE_CONFIDENCE:
                        auto_approved += 1
                        entry["auto_approved"] = True
                    else:
                        pending_review += 1
                        entry["auto_approved"] = False
                    return entry
                except Exception as e:
                    errors += 1
                    logger.error(f"Batch classify error: {e}")
                    return {
                        "company_data": item,
                        "error": str(e),
                        "auto_approved": False,
                    }

        tasks = [_classify_one(item) for item in items]
        raw = await asyncio.gather(*tasks)
        results = [r for r in raw if r is not None]

        return BatchClassificationResult(
            total=len(items),
            classified=len(results) - errors,
            auto_approved=auto_approved,
            pending_review=pending_review,
            errors=errors,
            results=results,
        )

    async def classify_and_update(
        self,
        conn: asyncpg.Connection,
        company_id: str,
        triggered_by: str = "manual",
        user_id: Optional[str] = None,
    ) -> Optional[ClassificationResult]:
        """Classify and update an existing company's regimen_fiscal in DB.

        Creates a classification history entry if regime changes.
        Returns the classification result, or None if company not found.
        """
        company = await conn.fetchrow(
            "SELECT * FROM companies WHERE id = $1", company_id
        )
        if not company:
            return None

        company_data = dict(company)
        result = await self.classify_company(conn, company_data)
        new_regimen = result.regimen_fiscal
        current_regimen = company_data.get("regimen_fiscal") or "pendiente"

        # Update company if classification changed — atomic transaction
        if current_regimen != new_regimen or company_data.get("commerce_type") != result.commerce_type:
            async with conn.transaction():
                # Build UPDATE with safe parameterized columns
                if result.commerce_type and result.commerce_type != company_data.get("commerce_type"):
                    await conn.execute(
                        """UPDATE companies
                           SET regimen_fiscal = $2, commerce_type = $3, updated_at = NOW()
                           WHERE id = $1""",
                        company_id, new_regimen, result.commerce_type,
                    )
                else:
                    await conn.execute(
                        """UPDATE companies
                           SET regimen_fiscal = $2, updated_at = NOW()
                           WHERE id = $1""",
                        company_id, new_regimen,
                    )

                # Audit trail
                await conn.execute(
                    """INSERT INTO company_classification_history
                       (company_id, old_regimen, new_regimen, old_commerce_type, new_commerce_type,
                        reason, confidence, details, triggered_by, created_by)
                       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)""",
                    company_id,
                    current_regimen,
                    new_regimen,
                    company_data.get("commerce_type"),
                    result.commerce_type,
                    result.reason,
                    result.confidence,
                    json.dumps({
                        "rules_applied": result.rules_applied,
                        "flags": result.flags,
                        "llm_validated": result.llm_validated,
                    }),
                    triggered_by,
                    user_id,
                )

            logger.info(
                f"Company {company_id} reclassified: {current_regimen} → {new_regimen} "
                f"(confidence={result.confidence:.0%}, trigger={triggered_by})"
            )

        return result

    async def extract_from_document(
        self,
        document_text: str,
        doc_type: str = "CERTIFICADO_REGISTRO_EMPRESARIAL",
    ) -> ExtractionResult:
        """LLM extraction of company data from document text.

        Args:
            document_text: Raw text from OCR
            doc_type: Document type identifier

        Returns:
            ExtractionResult with extracted company_data and metadata.
        """
        prompt = EXTRACTION_PROMPT.format(
            doc_type=doc_type,
            document_text=document_text[:4000],  # Limit for token budget
        )

        parsed = await self._call_gemini_structured(
            prompt, timeout=30.0,
            generation_config={"temperature": 0.05, "max_output_tokens": 1024},
        )

        if not parsed or not isinstance(parsed, dict):
            return ExtractionResult(
                company_data={},
                extraction_confidence=0.0,
                fields_extracted=[],
                fields_missing=["all"],
                warnings=["LLM extraction failed or returned invalid JSON"],
            )

        # Analyze extraction quality
        expected_fields = [
            "legal_name", "forma_juridica", "sector_actividad",
            "objeto_social", "nif", "registration_number",
        ]
        extracted = [f for f in expected_fields if parsed.get(f)]
        missing = [f for f in expected_fields if not parsed.get(f)]
        confidence = len(extracted) / max(len(expected_fields), 1)

        warnings = []
        # Cross-check: PE-XXXX → must be autonomo
        reg_num = parsed.get("registration_number") or ""
        forma = (parsed.get("forma_juridica") or "").lower()
        if reg_num.upper().startswith("PE-") and forma != "autonomo":
            warnings.append(
                f"CROSS-CHECK: registration_number={reg_num} (PE-) "
                f"but forma_juridica='{forma}' (expected: autonomo)"
            )
        # Cross-check: NIF format → should NOT be autonomo
        nif = parsed.get("nif") or ""
        if nif and not reg_num.upper().startswith("PE-") and forma == "autonomo":
            warnings.append(
                f"CROSS-CHECK: NIF='{nif}' present but forma_juridica='autonomo' "
                f"(autonomos typically use PE-XXXX, not NIF)"
            )

        return ExtractionResult(
            company_data=parsed,
            extraction_confidence=round(confidence, 2),
            fields_extracted=extracted,
            fields_missing=missing,
            warnings=warnings,
        )

    async def create_draft(
        self,
        conn: asyncpg.Connection,
        company_data: Dict[str, Any],
        classification: ClassificationResult,
        source_type: str = "manual",
        source_file_id: Optional[str] = None,
        batch_id: Optional[str] = None,
        extraction_confidence: float = 0.0,
        extraction_details: Optional[Dict] = None,
        created_by: Optional[str] = None,
    ) -> str:
        """Create a company_creation_drafts record.

        Returns the draft UUID.
        """
        # Determine status based on confidence
        status = "pending_review"
        if classification.confidence >= AUTO_APPROVE_CONFIDENCE and not classification.flags:
            status = "auto_approved"

        draft_id = await conn.fetchval(
            """INSERT INTO company_creation_drafts
               (source_type, source_file_id, batch_id,
                company_data, regimen_fiscal, classification_confidence,
                classification_reason, classification_details,
                extraction_confidence, extraction_details,
                status, created_by)
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
               RETURNING id""",
            source_type,
            source_file_id,
            batch_id,
            json.dumps(company_data, default=str),
            classification.regimen_fiscal,
            classification.confidence,
            classification.reason,
            json.dumps({
                "rules_applied": classification.rules_applied,
                "flags": classification.flags,
                "commerce_type": classification.commerce_type,
                "llm_validated": classification.llm_validated,
                "llm_issues": classification.llm_issues,
                "suggested_actions": classification.suggested_actions,
            }),
            extraction_confidence,
            json.dumps(extraction_details or {}),
            status,
            created_by,
        )

        logger.info(
            f"Draft created: {draft_id} (status={status}, "
            f"regime={classification.regimen_fiscal}, "
            f"confidence={classification.confidence:.0%})"
        )
        return str(draft_id)

    # ── Layer 1: Rules-based classification ──────────────────────────────

    def _rules_classify(self, data: Dict[str, Any]) -> ClassificationResult:
        """Pure rules-based classification using STRUCTURAL ATTRIBUTES.

        Decision tree (6 rules):
        1. Exempt check (forma_juridica)
        2. Special forms (always declarativo)
        3. Commercial activity (sector + subsector)
        4. LLM-inferable commerce_type marker
        5. Size check (capital + employees)
        6. Regime determination

        CRITICAL: Bundles are NOT queried here — they are a CONSEQUENCE.
        """
        forma = (data.get("forma_juridica") or "").lower().strip()
        sector = (data.get("sector_actividad") or "").strip()
        subsector = (data.get("subsector_actividad") or "").upper().strip()
        commerce_type = data.get("commerce_type")
        capital = data.get("capital_social")
        employees = data.get("employee_count")
        rules_applied = []
        flags = []

        # ── Rule 1: Exempt entities ──
        if forma in EXEMPT_FORMAS:
            rules_applied.append("R1_exempt_forma_juridica")
            return ClassificationResult(
                regimen_fiscal="exento",
                confidence=0.95,
                reason=f"Forma jurídica '{forma}' exenta de obligaciones fiscales comerciales",
                rules_applied=rules_applied,
                commerce_type=None,
            )

        # ── Rule 2: Special forms (always declarativo) ──
        if forma in SPECIAL_FORMAS:
            rules_applied.append("R2_special_forma_declarativo")
            return ClassificationResult(
                regimen_fiscal="declarativo",
                confidence=0.85,
                reason=f"Forma jurídica '{forma}' → régimen declarativo (sin bundle posible)",
                rules_applied=rules_applied,
                commerce_type=None,
            )

        # ── Rule 3: Commercial activity check ──
        is_commercial = False
        if sector.lower() == "terciario" and subsector in COMMERCIAL_SUBSECTORS:
            is_commercial = True
            rules_applied.append("R3_terciario_commercial")
        elif commerce_type:
            # Explicit commerce_type provided → treat as commercial
            is_commercial = True
            rules_applied.append("R3_explicit_commerce_type")

        # ── Rule 4: Size check ──
        is_large = False
        large_reasons = []

        if capital is not None:
            try:
                cap = Decimal(str(capital))
                if cap >= DECLARATIVO_CAPITAL_THRESHOLD:
                    is_large = True
                    large_reasons.append(
                        f"capital {cap:,.0f} XAF ≥ {DECLARATIVO_CAPITAL_THRESHOLD:,.0f}"
                    )
            except (InvalidOperation, ValueError):
                flags.append("invalid_capital_social")

        if employees is not None:
            try:
                emp = int(employees)
                if emp >= DECLARATIVO_EMPLOYEE_THRESHOLD:
                    is_large = True
                    large_reasons.append(
                        f"{emp} empleados ≥ {DECLARATIVO_EMPLOYEE_THRESHOLD}"
                    )
            except (ValueError, TypeError):
                flags.append("invalid_employee_count")

        rules_applied.append("R4_size_check")

        # ── Rule 5: Regime determination ──
        rules_applied.append("R5_regime_determination")

        if is_commercial and not is_large:
            return ClassificationResult(
                regimen_fiscal="bundle",
                confidence=0.90,
                reason=f"Empresa comercial (sector={sector}, subsector={subsector}) de tamaño estándar",
                rules_applied=rules_applied,
                commerce_type=commerce_type,
                flags=flags,
            )

        if is_commercial and is_large:
            return ClassificationResult(
                regimen_fiscal="mixto",
                confidence=0.85,
                reason=f"Empresa comercial grande ({', '.join(large_reasons)})",
                rules_applied=rules_applied,
                commerce_type=commerce_type,
                flags=flags,
            )

        if not is_commercial and is_large:
            return ClassificationResult(
                regimen_fiscal="declarativo",
                confidence=0.85,
                reason=f"Empresa no-comercial grande ({', '.join(large_reasons)})",
                rules_applied=rules_applied,
                commerce_type=None,
                flags=flags,
            )

        if not is_commercial and not is_large:
            # Small non-commercial — still declarativo but lower confidence
            # Could be reclassified if objeto_social reveals commercial activity
            return ClassificationResult(
                regimen_fiscal="declarativo",
                confidence=0.75,
                reason="Empresa no-comercial de tamaño estándar → declarativo",
                rules_applied=rules_applied,
                commerce_type=None,
                flags=flags,
                suggested_actions=["verify_objeto_social_for_commercial_activity"],
            )

        # Fallback: insufficient data
        missing = []
        if not forma:
            missing.append("forma_juridica")
        if not sector:
            missing.append("sector_actividad")
        if capital is None:
            missing.append("capital_social")
        if employees is None:
            missing.append("employee_count")

        return ClassificationResult(
            regimen_fiscal="pendiente",
            confidence=0.30,
            reason=f"Datos insuficientes. Faltan: {', '.join(missing) if missing else 'sector comercial'}",
            rules_applied=rules_applied,
            flags=["insufficient_data"] + flags,
            suggested_actions=["request_missing_data"],
        )

    # ── Layer 2: LLM Commerce Type Inference ─────────────────────────────

    async def _llm_infer_commerce_type(
        self,
        conn: asyncpg.Connection,
        objeto_social: str,
        sector: str,
        subsector: str,
        forma_juridica: str,
    ) -> Optional[str]:
        """LLM infers commerce_type from business activity description.

        Queries active service_bundles for the list of available commerce_types.
        """
        # Get available commerce types from DB
        rows = await conn.fetch(
            "SELECT DISTINCT commerce_type FROM service_bundles WHERE is_active = true ORDER BY commerce_type"
        )
        if not rows:
            return None

        types_list = "\n".join(f"- {r['commerce_type']}" for r in rows)

        prompt = COMMERCE_TYPE_PROMPT.format(
            objeto_social=objeto_social[:500],
            sector=sector,
            subsector=subsector,
            forma_juridica=forma_juridica,
            commerce_types_list=types_list,
        )

        parsed = await self._call_gemini_structured(
            prompt, timeout=15.0,
            generation_config={"temperature": 0.1, "max_output_tokens": 256},
        )

        if not parsed or not isinstance(parsed, dict):
            return None

        ct = parsed.get("commerce_type")
        confidence = parsed.get("confidence", 0)

        if ct and confidence >= 0.5:
            logger.info(
                f"LLM inferred commerce_type='{ct}' "
                f"(confidence={confidence}, reason={parsed.get('reasoning', '')})"
            )
            return ct

        return None

    # ── Layer 3: Post-classification Validation ──────────────────────────

    async def _validate_post_classification(
        self,
        conn: asyncpg.Connection,
        result: ClassificationResult,
        company_data: Dict[str, Any],
        zone_id: Optional[str] = None,
    ) -> ClassificationResult:
        """Post-classification validation: bundle existence, cross-checks.

        Rule 6: If regime is 'bundle' or 'mixto' AND commerce_type is set,
        verify that an active service_bundle exists for that commerce_type.
        A MISSING bundle = admin flag, NOT reclassification to 'pendiente'.
        """
        rules = list(result.rules_applied)
        flags = list(result.flags)
        actions = list(result.suggested_actions)

        # ── R6a: Bundle existence check ──
        if result.regimen_fiscal in ("bundle", "mixto") and result.commerce_type:
            bundle_exists = await conn.fetchval(
                "SELECT EXISTS(SELECT 1 FROM service_bundles "
                "WHERE commerce_type = $1 AND is_active = true)",
                result.commerce_type,
            )
            rules.append("R6a_bundle_existence_check")

            if not bundle_exists:
                flags.append("bundle_missing")
                actions.append(
                    f"admin_create_bundle_for_{result.commerce_type}"
                )
                # Lower confidence but DO NOT change regime
                result = result.model_copy(update={
                    "confidence": min(result.confidence, 0.70),
                    "flags": flags,
                    "suggested_actions": actions,
                    "rules_applied": rules,
                })
                logger.warning(
                    f"No active bundle for commerce_type='{result.commerce_type}' "
                    f"— regime stays '{result.regimen_fiscal}', flagged for admin"
                )
                return result

        # ── R6b: NIF/PE cross-check ──
        forma = (company_data.get("forma_juridica") or "").lower()
        nif = company_data.get("nif") or ""
        reg_num = (company_data.get("registration_number") or "").upper()

        if reg_num.startswith("PE-") and forma and forma not in PERSONA_FISICA_FORMAS:
            flags.append("nif_pe_mismatch")
            actions.append("verify_forma_juridica_vs_registration")
            rules.append("R6b_pe_crosscheck_failed")

        if nif and not reg_num.startswith("PE-") and forma == "autonomo":
            flags.append("nif_pe_mismatch")
            actions.append("verify_forma_juridica_vs_nif")
            rules.append("R6b_nif_crosscheck_failed")

        rules.append("R6_post_validation_complete")

        return result.model_copy(update={
            "rules_applied": rules,
            "flags": flags,
            "suggested_actions": actions,
        })

    # ── LLM Validation (edge cases) ──────────────────────────────────────

    async def llm_validate_classification(
        self,
        company_data: Dict[str, Any],
        rules_result: ClassificationResult,
    ) -> ClassificationResult:
        """LLM validates edge cases: contradictions, ambiguous data.

        Only called for low-confidence results or when flags are present.
        """
        identifier = company_data.get("nif") or company_data.get("registration_number") or "N/A"
        doc_type = "NIF" if company_data.get("nif") else "PE-XXXX"

        prompt = VALIDATION_PROMPT.format(
            name=company_data.get("legal_name", "N/A"),
            forma=company_data.get("forma_juridica", "N/A"),
            sector=company_data.get("sector_actividad", "N/A"),
            subsector=company_data.get("subsector_actividad", "N/A"),
            objeto_social=(company_data.get("objeto_social") or "N/A")[:300],
            commerce_type=rules_result.commerce_type or "N/A",
            capital=company_data.get("capital_social", "N/A"),
            employees=company_data.get("employee_count", "N/A"),
            doc_type=doc_type,
            identifier=identifier,
            rules_regime=rules_result.regimen_fiscal,
            rules_confidence=rules_result.confidence,
            rules_reason=rules_result.reason,
        )

        parsed = await self._call_gemini_structured(
            prompt, timeout=20.0,
            generation_config={"temperature": 0.1, "max_output_tokens": 512},
        )

        if not parsed or not isinstance(parsed, dict):
            return rules_result

        issues = parsed.get("issues", [])
        recommendations = parsed.get("recommendations", [])
        suggested = parsed.get("suggested_regime")
        llm_confidence = parsed.get("confidence", 0)

        updated = rules_result.model_copy(update={
            "llm_validated": True,
            "llm_issues": issues,
        })

        # Only override regime if LLM is confident AND flags issues
        if (
            suggested
            and suggested != rules_result.regimen_fiscal
            and llm_confidence >= 0.80
            and issues
        ):
            updated = updated.model_copy(update={
                "regimen_fiscal": suggested,
                "confidence": min(llm_confidence, rules_result.confidence),
                "reason": f"LLM override: {rules_result.reason} → {'; '.join(issues)}",
                "suggested_actions": list(rules_result.suggested_actions) + recommendations,
            })
            logger.info(
                f"LLM override: {rules_result.regimen_fiscal} → {suggested} "
                f"(issues: {issues})"
            )

        return updated


# ── Module-level singleton ────────────────────────────────────────────────────

classification_agent = CompanyClassificationAgent()
