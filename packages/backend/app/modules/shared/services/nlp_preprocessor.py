"""
NLP Pre-processor for LLM Analyst Agents (Admin + Treasury).

Pure Python — no ML dependencies, runs in microseconds synchronously
before the Gemini call.

Pipeline:
  User question
    → NLPPreprocessor.extract_slots()     — intent + entity extraction
    → ConversationMemory.resolve_missing_slots()  — inherit from history
    → NLPPreprocessor.build_enriched_prompt()     — structured input for Gemini
    → Gemini (better routing, precise function args)

Design principles:
  - Intent detection via ordered regex patterns (most specific first)
  - Named entity recognition: entity codes, agent names, time periods, metrics
  - Confidence scoring: drives slot inheritance threshold
  - Deterministic, testable, no external API calls
  - Multilingual: Spanish (primary), French/English (secondary)
"""

import re
from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Dict, List, Optional


# ──────────────────────────────────────────────────────────────────────────────
# Intent Categories
# ──────────────────────────────────────────────────────────────────────────────

class IntentCategory(Enum):
    """Coarse-grained intent categories covering both admin and treasury domains."""
    AGENT_AVAILABILITY  = "agent_availability"   # Who is online/connected right now
    AGENT_SPECIFIC      = "agent_specific"        # Stats for a named agent
    WORKLOAD            = "workload"              # Workload distribution / capacity
    SLA                 = "sla"                   # SLA compliance / deadlines
    PERFORMANCE         = "performance"           # Rankings, rates, efficiency
    ANOMALY             = "anomaly"               # Statistical anomalies / alerts
    TREND               = "trend"                 # Time-series / evolution
    REVENUE             = "revenue"               # Financial totals (treasury)
    ENTITY_COMPARE      = "entity_compare"        # Cross-entity comparison
    RECONCILIATION      = "reconciliation"        # Bank reconciliation (treasury)
    GENERAL             = "general"               # Fallback — no clear signal


# ──────────────────────────────────────────────────────────────────────────────
# Extracted Slots
# ──────────────────────────────────────────────────────────────────────────────

@dataclass
class ExtractedSlots:
    """Structured slots extracted from a natural language question."""
    intent:            IntentCategory    = IntentCategory.GENERAL
    entity_codes:      List[str]         = field(default_factory=list)
    agent_name:        Optional[str]     = None
    time_period_days:  Optional[int]     = None
    metric:            Optional[str]     = None   # success_rate | quality | sla_compliance | productivity
    amount_threshold:  Optional[float]   = None
    confidence:        float             = 0.0
    raw_time_expr:     Optional[str]     = None   # human-readable: "esta semana"
    keywords_matched:  List[str]         = field(default_factory=list)


# ──────────────────────────────────────────────────────────────────────────────
# NLP Preprocessor
# ──────────────────────────────────────────────────────────────────────────────

class NLPPreprocessor:
    """
    Lightweight NLP pre-processor: question → ExtractedSlots.

    Pattern matching is ordered by specificity (most specific first).
    Confidence is derived from the number of slots successfully filled.
    """

    # Known entity codes in the system
    ENTITY_CODES: frozenset = frozenset({
        "CNEDOGE", "CNEDOGE_PASAPORTE", "CNEDOGE_RESIDENCIA",
        "DGT", "ITVE", "ITV", "MINFP", "ONRC", "TESORO",
        "COMISARIA", "EXTRANJERIA", "POLICIA", "OFIVE",
    })

    # ── Intent patterns (ordered: most specific first) ────────────────────────
    _INTENT_PATTERNS: List[tuple] = [
        (IntentCategory.AGENT_AVAILABILITY, [
            r"cu[aá]ntos?\s+agentes?\s*(están?|hay|trabajan?|conectados?|disponibles?|activos?)",
            r"\bagentes?\s+(conectados?|en\s+l[ií]nea|online|activos?\s+ahora|disponibles?\s+ahora)\b",
            r"\b(conectados?|en\s+l[ií]nea|online)\b",
            r"qui[eé]n[es]?\s+(est[aá]n?|trabaja[n]?)\s*(ahora|hoy|en\s+este\s+momento)",
            r"agentes?\s+que\s+están?\s+trabajando",
        ]),
        (IntentCategory.AGENT_SPECIFIC, [
            r"(?:agente|funcionario)\s+([A-ZÁÉÍÓÚÑ][a-záéíóúñ]+(?:\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+)+)",
            r"c[oó]mo\s+(?:está|va|lleva)\s+([A-ZÁÉÍÓÚÑ][a-záéíóúñ]+(?:\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+)+)",
            r"(?:datos?|estad[ií]sticas?|rendimiento)\s+(?:de|del|sobre)\s+(?:el\s+agente\s+)?([A-ZÁÉÍÓÚÑ])",
        ]),
        (IntentCategory.RECONCILIATION, [
            r"\breconciliaci[oó]n\b",
            r"\bsin\s+conciliar\b",
            r"\btransacciones?\s+bancarias?\b",
            r"\bBGFI\b|\bBANGE\b|\bECOBANK\b|\bSGBGE\b",
            r"\bpago\s+no\s+encontrado\b|\breferenciar?\b",
        ]),
        (IntentCategory.SLA, [
            r"\bSLA\b",
            r"\b(vencidos?|en\s+riesgo|atrasados?|plazo\s+vencido)\b",
            r"\bpagos?\s+(pendientes?|atrasados?|vencidos?)\b",
            r"\btiempo\s+(?:de\s+procesamiento|medio|promedio)\b",
            r"\bincumplimiento\b|\bcumplimiento\s+SLA\b",
            r"\bdeadline\b|\bplazo\b",
        ]),
        (IntentCategory.PERFORMANCE, [
            r"\branking\b|\bclasificaci[oó]n\b",
            r"\bmejor\s+agente\b|\bpeor\s+agente\b|\btop\s+\d\b",
            r"\bm[aá]s\s+(?:eficiente|productivo|r[aá]pido)\b",
            r"\btasa\s+de\s+(?:[eé]xito|rechazo|aprobaci[oó]n)\b",
            r"\ban[aá]lisis?\s+de\s+rendimiento\b",
            r"\brechazos?\b.*\b(?:patr[oó]n|agente)\b|\b(?:agente)\b.*\brechazos?\b",
        ]),
        (IntentCategory.ANOMALY, [
            r"\banomal[ií]as?\b",
            r"\bpatrones?\s+inusuales?\b",
            r"\bdesviaci[oó]n\s+(?:est[au]d[ií]stica)?\b",
            r"\b(?:sospechoso|irregular|inusual|extra[nñ]o)\b",
            r"\bdetectar?\s+(?:problemas?|patrones?|anomal[ií]as?)\b",
        ]),
        (IntentCategory.WORKLOAD, [
            r"\bcarga\s+de\s+trabajo\b|\bworkload\b",
            r"\bdistribuci[oó]n\s+de\s+(?:la\s+)?carga\b",
            r"\bsobrecargados?\b|\bsaturados?\b",
            r"\b(?:desequilibrio|balance|equilibrio)\s+(?:de\s+)?(?:carga|trabajo)\b",
            r"\bcapacidad\s+(?:al\s+\d+%|actual)\b",
        ]),
        (IntentCategory.TREND, [
            r"\btendencia\b|\bevoluci[oó]n\b",
            r"\bserie\s+temporal\b|\ba\s+lo\s+largo\s+del\s+tiempo\b",
            r"\b(?:creci(?:endo|miento)|decreciendo|bajando|subiendo)\b",
            r"\bcomparar?\s+(?:per[ií]odos?|meses?|semanas?)\b",
            r"\b(?:forecast|predicci[oó]n|pron[oó]stico)\b",
            r"\b(?:últ[ií]mos?\s+\d+\s+d[ií]as?|últ[ií]mas?\s+semanas?)\b",
        ]),
        (IntentCategory.REVENUE, [
            r"\bingresos?\b|\brecaudaci[oó]n\b|\bfacturaci[oó]n\b",
            r"\bmonto\s+total\b|\btotal\s+(?:cobrado|recaudado)\b",
            r"\bXAF\b|\bFCFA\b",
            r"\bpagos?\s+(?:completados?|aprobados?)\b",
            r"\bpagadores?\s+(?:principales?|top)\b",
        ]),
        (IntentCategory.ENTITY_COMPARE, [
            r"\bcomparar?\s+(?:entidades?|entre\s+entidades?)\b",
            r"\bmejor\s+entidad\b|\bpeor\s+entidad\b",
            r"\bpor\s+entidad\b|\btodas\s+las\s+entidades?\b",
            r"\bversus\b|\bvs\.?\s+",
        ]),
    ]

    # ── Time period patterns ──────────────────────────────────────────────────
    # Each entry: (pattern, value_or_None)
    # None = extract integer from capture group
    _TIME_PATTERNS: List[tuple] = [
        (r"\b(hoy|d[ií]a\s+de\s+hoy|este\s+d[ií]a|tiempo\s+real)\b",              0),
        (r"\b(ayer)\b",                                                              1),
        (r"\b(esta\s+semana|[úu]ltim[oa]s?\s+7\s+d[ií]as?)\b",                     7),
        (r"\b([úu]ltim[oa]s?\s+(\d+)\s+d[ií]as?)\b",                              None),  # group 2 = N
        (r"\b([úu]ltim[oa]s?\s+(\d+)\s+semanas?)\b",                              None),  # group 2 = N*7
        (r"\b(este\s+mes|[úu]ltim[oa]s?\s+30\s+d[ií]as?|mes\s+en\s+curso)\b",     30),
        (r"\b([úu]ltim[oa]s?\s+90\s+d[ií]as?|este\s+trimestre)\b",                 90),
        (r"\b(este\s+a[nñ]o|[úu]ltim[oa]s?\s+365\s+d[ií]as?)\b",                 365),
        (r"\b(hace\s+(\d+)\s+d[ií]as?)\b",                                         None),  # group 2 = N
        (r"\b(hace\s+una?\s+semana)\b",                                             7),
        (r"\b(hace\s+un\s+mes)\b",                                                  30),
        (r"\b(en\s+tiempo\s+real|ahora\s+mismo|en\s+este\s+momento)\b",             0),
        # French
        (r"\b(aujourd['\u2019]?hui)\b",                                             0),
        (r"\b(cette\s+semaine|7\s+derniers?\s+jours?)\b",                           7),
        (r"\b(ce\s+mois|30\s+derniers?\s+jours?)\b",                               30),
        (r"\b(les?\s+(\d+)\s+derniers?\s+jours?)\b",                               None),  # group 2 = N
    ]

    # ── Metric patterns ───────────────────────────────────────────────────────
    _METRIC_PATTERNS: List[tuple] = [
        ("success_rate", [
            r"\btasa\s+de\s+[eé]xito\b", r"\btasa\s+de\s+aprobaci[oó]n\b",
            r"\b[eé]xito\b", r"\baprobados?\b", r"\bsuccess\b",
        ]),
        ("quality", [
            r"\bcalidad\b", r"\bquality\b", r"\bpuntuaci[oó]n\s+de\s+calidad\b",
        ]),
        ("sla_compliance", [
            r"\bSLA\b", r"\bcumplimiento\s+SLA\b", r"\bplazo\b", r"\bdeadline\b",
        ]),
        ("productivity", [
            r"\bproductividad\b", r"\bexpedientes?\s+procesados?\b",
            r"\bvolumen\b", r"\bcu[aá]ntos?\s+(?:procesa|procesó|han\s+procesado)\b",
        ]),
    ]

    # ── Stop words for agent name extraction ──────────────────────────────────
    _AGENT_NAME_STOPS: frozenset = frozenset({
        "los", "las", "agentes", "entidades", "pagos", "días", "datos",
        "rendimiento", "estadísticas", "información", "análisis",
    })

    # ── Public API ────────────────────────────────────────────────────────────

    def extract_slots(self, question: str) -> ExtractedSlots:
        """
        Extract structured slots from a natural language question.

        Runs in O(P*Q) where P=patterns, Q=question length.
        Typical latency: <1ms.
        """
        q_lower = question.lower()
        slots = ExtractedSlots()
        matched_keywords: List[str] = []

        # 1. Intent detection (ordered patterns, first match wins per category)
        best_intent = IntentCategory.GENERAL
        best_score = 0
        for intent_cat, patterns in self._INTENT_PATTERNS:
            score = sum(
                1 for p in patterns
                if re.search(p, q_lower, re.IGNORECASE)
            )
            if score > best_score:
                best_score = score
                best_intent = intent_cat
                matched_keywords = [
                    m.group(0)[:25]
                    for p in patterns
                    for m in [re.search(p, q_lower, re.IGNORECASE)]
                    if m
                ][:5]
        slots.intent = best_intent

        # 2. Entity code extraction (case-insensitive, whole word)
        for code in self.ENTITY_CODES:
            if re.search(rf"\b{re.escape(code)}\b", question, re.IGNORECASE):
                slots.entity_codes.append(code.upper())

        # 3. Time period extraction (first match wins)
        for pattern, value in self._TIME_PATTERNS:
            match = re.search(pattern, q_lower, re.IGNORECASE)
            if match:
                slots.raw_time_expr = match.group(0)
                if value is not None:
                    slots.time_period_days = value
                else:
                    # Extract integer from captured group
                    try:
                        groups = match.groups()
                        n = next(
                            int(g) for g in groups[1:]
                            if g and g.isdigit()
                        )
                        if "semana" in pattern or "semaine" in pattern:
                            n *= 7
                        slots.time_period_days = n
                    except StopIteration:
                        slots.time_period_days = 7  # safe default
                break

        # 4. Metric extraction
        for metric_key, patterns in self._METRIC_PATTERNS:
            if any(re.search(p, q_lower, re.IGNORECASE) for p in patterns):
                slots.metric = metric_key
                break

        # 5. Agent name extraction — heuristic: capitalized bigram after indicator
        _agent_patterns = [
            r"(?:agente|funcionario)\s+([A-ZÁÉÍÓÚÑ][a-záéíóúñ]+(?:\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+)*)",
            r"(?:sobre|del\s+agente)\s+([A-ZÁÉÍÓÚÑ][a-záéíóúñ]+(?:\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+)*)",
            r"(?:c[oó]mo\s+(?:est[aá]|va|lleva))\s+([A-ZÁÉÍÓÚÑ][a-záéíóúñ]+(?:\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+)*)",
        ]
        for p in _agent_patterns:
            m = re.search(p, question, re.IGNORECASE)
            if m:
                candidate = m.group(1).strip()
                if (
                    candidate.lower() not in self._AGENT_NAME_STOPS
                    and len(candidate) > 3
                ):
                    slots.agent_name = candidate
                    break

        # 6. Amount threshold (ignore small numbers ≤ 100 — likely days/pct)
        _amount_match = re.search(
            r"(\d[\d\s,\.]*)\s*(XAF|FCFA|mil(?:es)?|mill?ones?)?",
            question, re.IGNORECASE,
        )
        if _amount_match:
            try:
                raw = _amount_match.group(1).replace(" ", "").replace(",", "").replace(".", "")
                amount = float(raw)
                unit = (_amount_match.group(2) or "").lower()
                if "mil" in unit:
                    amount *= 1_000
                elif "millon" in unit or "million" in unit:
                    amount *= 1_000_000
                if amount > 100:
                    slots.amount_threshold = amount
            except (ValueError, AttributeError):
                pass

        # 7. Confidence scoring
        confidence = 0.0
        if slots.intent != IntentCategory.GENERAL:
            confidence += 0.4
        if slots.entity_codes:
            confidence += 0.2
        if slots.time_period_days is not None:
            confidence += 0.15
        if slots.metric:
            confidence += 0.15
        if slots.agent_name:
            confidence += 0.1

        slots.confidence = min(confidence, 1.0)
        slots.keywords_matched = matched_keywords

        return slots

    def build_enriched_prompt(
        self,
        question: str,
        slots: ExtractedSlots,
        memory_context: Optional[Dict[str, Any]] = None,
    ) -> str:
        """
        Build structured prompt combining question + extracted context.

        Format:
          [CONTEXTO EXTRAÍDO]          ← only if confidence ≥ 0.3
          - Intención: ...
          - Entidades: ...
          ...

          [CONTEXTO CONVERSACIONAL]    ← only if memory has relevant inherited slots
          - Dato del turno anterior: ...

          PREGUNTA: {question}

        Gemini receives this enriched prompt for better tool routing.
        """
        lines: List[str] = []

        # ── Extracted slots section ───────────────────────────────────────────
        ctx: List[str] = []
        if slots.intent != IntentCategory.GENERAL:
            ctx.append(f"Intención detectada: {slots.intent.value}")
        if slots.entity_codes:
            ctx.append(f"Entidades mencionadas: {', '.join(slots.entity_codes)}")
        if slots.agent_name:
            ctx.append(f"Agente específico: {slots.agent_name}")
        if slots.time_period_days is not None:
            if slots.time_period_days == 0:
                ctx.append("Período: tiempo real (ahora)")
            else:
                label = slots.raw_time_expr or f"últimos {slots.time_period_days} días"
                ctx.append(f"Período: {label} ({slots.time_period_days}d)")
        if slots.metric:
            ctx.append(f"Métrica solicitada: {slots.metric}")

        if ctx and slots.confidence >= 0.3:
            lines.append("[CONTEXTO EXTRAÍDO]")
            lines.extend(f"- {c}" for c in ctx)
            lines.append("")

        # ── Memory / conversation context ─────────────────────────────────────
        if memory_context:
            mem: List[str] = []
            if memory_context.get("entity_codes") and not slots.entity_codes:
                mem.append(
                    f"Entidades del turno anterior: {', '.join(memory_context['entity_codes'])}"
                )
            if memory_context.get("time_period_days") is not None and slots.time_period_days is None:
                mem.append(f"Período del turno anterior: {memory_context['time_period_days']} días")
            if memory_context.get("metric") and not slots.metric:
                mem.append(f"Métrica previa: {memory_context['metric']}")
            if memory_context.get("agent_name") and not slots.agent_name:
                mem.append(f"Agente previo: {memory_context['agent_name']}")
            if memory_context.get("key_findings"):
                snippet = memory_context["key_findings"][:150]
                mem.append(f"Hallazgo previo relevante: {snippet}")

            if mem:
                lines.append("[CONTEXTO CONVERSACIONAL]")
                lines.extend(f"- {m}" for m in mem)
                lines.append("")

        lines.append(f"PREGUNTA: {question}")
        return "\n".join(lines)

    def get_injected_kwargs(self, slots: ExtractedSlots) -> Dict[str, Any]:
        """
        Return kwargs to inject into SQL function calls based on confident slots.

        These act as NLP-derived defaults (lowest precedence — Gemini args override).
        Only returned when confidence ≥ threshold to avoid false positives.
        """
        kwargs: Dict[str, Any] = {}
        if slots.entity_codes and len(slots.entity_codes) == 1 and slots.confidence >= 0.4:
            kwargs["entity_code"] = slots.entity_codes[0]
        if slots.agent_name and slots.confidence >= 0.5:
            kwargs["agent_name"] = slots.agent_name
        if slots.time_period_days is not None and slots.confidence >= 0.35:
            kwargs["period_days"] = slots.time_period_days
            kwargs["days"] = slots.time_period_days
        if slots.metric and slots.confidence >= 0.4:
            kwargs["metric"] = slots.metric
        return kwargs


# ── Module-level singleton ────────────────────────────────────────────────────
nlp_preprocessor = NLPPreprocessor()
