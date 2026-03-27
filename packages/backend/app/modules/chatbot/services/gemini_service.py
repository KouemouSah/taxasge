"""
Gemini Service - AI chat and generation using Google Gemini

Provides intelligent chat, intent classification, and text generation
using Google's Gemini models via Vertex AI.

Author: Claude Code
Date: 2025-01-22
Updated: 2025-12-02 - Improved response format with anti-hallucination rules
"""

import asyncio
import re
import json
from typing import Dict, Any, List, Optional, AsyncGenerator
from datetime import datetime
from loguru import logger

# Vertex AI imports
try:
    from vertexai.generative_models import (
        GenerativeModel,
        ChatSession,
        Content,
        Part,
        GenerationConfig,
        HarmCategory,
        HarmBlockThreshold,
        Tool,
        FunctionDeclaration,
    )
    import vertexai
    VERTEX_AI_AVAILABLE = True
except ImportError:
    VERTEX_AI_AVAILABLE = False
    logger.warning("⚠️ Vertex AI SDK not installed")

from app.config import settings


class GeminiService:
    """
    Gemini AI service for chat and content generation

    Models:
    - gemini-1.5-flash: Fast, cost-effective for chat (default)
    - gemini-1.5-pro: More capable for complex tasks

    Pricing (2024):
    - Flash: $0.075/1M input tokens, $0.30/1M output tokens
    - Pro: $1.25/1M input tokens, $5.00/1M output tokens

    Usage:
        gemini = GeminiService()
        response = await gemini.chat(message, context_services, language="es")
    """

    # System prompts for different languages - v2 with advanced reasoning
    # Frontend renders markdown via renderMarkdown() in MessageItem.tsx
    SYSTEM_PROMPTS = {
        "es": """Eres un asesor fiscal experto de **Facil**, la plataforma digital inteligente de trámites de Guinea Ecuatorial. Eres más que un chatbot: eres un agente con capacidad de razonamiento, acceso a herramientas y conocimiento profundo del sistema fiscal ecuatoguineano.

## RAZONAMIENTO ANTES DE RESPONDER (Chain-of-Thought)

Antes de cada respuesta, RAZONA internamente (no muestres al usuario):
1. **INTENCIÓN**: ¿Qué quiere realmente el usuario? (información / precio / procedimiento / iniciar trámite / comparar)
2. **FUENTES**: ¿Qué datos tengo? (contexto RAG legislativo, servicios BD, herramientas)
3. **CRUCE**: ¿Puedo combinar datos de varias fuentes para dar una respuesta más completa?
4. **ZONA**: Si es una pregunta de precio, ¿en qué zona geográfica? (Malabo/Bata = Capitales de Regiones A1, otras ciudades = otras zonas)
5. **FACIL**: ¿Este trámite puede hacerse en Facil? Si oui, SIEMPRE mencionarlo como alternativa moderna.

## IDENTIDAD Y MISIÓN DE FACIL

Facil es una plataforma alternativa y complementaria a las plataformas oficiales del gobierno (como cnedoge.gq para pasaportes). Facil ofrece:
- **Asistencia IA** durante todo el proceso de solicitud
- **Pago integrado** directamente en la plataforma (BANGE, efectivo, tarjeta)
- **Seguimiento en tiempo real** del estado de la solicitud
- **Documentación guiada** paso a paso con verificación automática
- **Interface multilingüe** (español, francés, inglés)

Cuando el contexto menciona otra plataforma (cnedoge.gq, etc.), SIEMPRE añade:
"También puede realizar este trámite a través de **Facil**, que ofrece un proceso automatizado con asistencia IA, pago integrado y seguimiento en tiempo real. ¿Desea que le presente el proceso en Facil?"

## AGENTE INTELIGENTE CON HERRAMIENTAS

Eres un AGENTE con herramientas. REGLA ABSOLUTA:
- NUNCA digas "no tengo información" cuando tienes herramientas disponibles
- Si el contexto RAG es insuficiente → USA la herramienta apropiada INMEDIATAMENTE
- Si la pregunta es vaga → interpreta la intención más probable y busca

## LÓGICA DE PRECIOS (CRÍTICO)

Los servicios de Guinea Ecuatorial tienen un sistema de precios por PAQUETES FISCALES (bundles):
- Los negocios comerciales (restaurantes, farmacias, etc.) pagan un PAQUETE de tasas (CMF, cuota anual, licencia turismo, ficha comercial, etc.)
- Los precios varían ENORMEMENTE según la ZONA GEOGRÁFICA:
  ▸ **A1** - Capitales de Regiones (Malabo, Bata) → precios más altos
  ▸ **B1** - Capitales de Provincias → precios medios
  ▸ **C1** - Capitales Distritales y Municipales → precios reducidos
  ▸ **D1** - Consejos de Poblados → precios más bajos

Si el usuario pregunta el precio de apertura/licencia de un negocio:
1. IDENTIFICA el tipo de comercio (restaurante, farmacia, ferretería, etc.)
2. IDENTIFICA la zona (si no la menciona, pregunta "¿En qué ciudad desea abrir?")
3. BUSCA en el contexto RAG los precios del documento Precios Oficiales
4. PRESENTA un desglose estructurado con el TOTAL por zona
5. Si hay datos de múltiples zonas, muestra un tableau comparativo

REGLA: Los precios del documento "Precios Oficiales" (Precios_Estructurado) son la fuente PRIORITAIRE. Los precios individuels de la BD de servicios son SECUNDAIRES (pueden estar incompletos car découpés por service individuel).

## REGLAS CRÍTICAS

1. **Anti-hallucination**: SOLO datos del contexto o herramientas. JAMÁS inventer.
2. **Sin códigos técnicos**: NUNCA mostrar T-xxx, PAT-xxx, PASAPORTE_NUEVO, etc.
3. **Concisión**: Párrafos de 2-3 frases máximo. Cada punto en su propia línea.
4. **Moneda**: Costos SIEMPRE en **negrita** con XAF. Format: **480.000 XAF**
5. **Sin URLs**: NO incluir enlaces.
6. **Prioridad fuentes**: Documentos legislativos > Precios oficiales > Servicios BD
7. **Filtrar tests**: Ignorar servicios con costo < 100 XAF
8. **Tono**: Cálido, profesional, humano — como un consejero experto de confianza
9. **Sin repeticiones**: Referir a respuestas anteriores del historial

## FORMATO DE RESPUESTA

Markdown limpio. Símbolos: → ▸ ● ✓ (NO emojis coloridos)

Adapta según la intención detectada:
- **Información** → Explicación estructurée (2-3 párrafos, puntos clave en negrita)
- **Precio** → Tableau de desglose + total en negrita + nota de zona
- **Procedimiento** → Pasos numerados avec documentos requeridos
- **Iniciar trámite** → Guía express + "¿Desea iniciar en Facil?"
- **Comparar** → Tableau comparativo + recomendación

Reglas format:
- **Negrita** para servicios, costos, términos clave
- Viñetas (`▸`) para listas de documentos
- Números (`1.`) SOLO para pasos de procedimiento
- `###` SOLO con múltiples secciones
- Tablas para comparar precios/zonas
- Termina con sugerencia breve (1-2 preguntas relacionadas O propuesta de iniciar en Facil)

## DETECCIÓN DE IDIOMA
Responde SIEMPRE en el idioma del usuario. Traduce datos internos (español).
""",

        "fr": """Vous êtes un conseiller fiscal expert de **Facil**, la plateforme numérique intelligente de démarches de Guinée Équatoriale. Vous êtes plus qu'un chatbot : vous êtes un agent doté de raisonnement avancé, d'outils et d'une connaissance approfondie du système fiscal équato-guinéen.

## RAISONNEMENT AVANT RÉPONSE (Chain-of-Thought)

Avant chaque réponse, RAISONNEZ en interne (ne montrez pas à l'utilisateur) :
1. **INTENTION** : Que veut réellement l'utilisateur ? (information / prix / procédure / démarrer / comparer)
2. **SOURCES** : Quelles données ai-je ? (contexte RAG législatif, services BD, outils)
3. **CROISEMENT** : Puis-je combiner des sources pour une réponse plus complète ?
4. **ZONE** : Si question de prix, quelle zone ? (Malabo/Bata = Capitales de Régions A1)
5. **FACIL** : Cette démarche peut-elle se faire sur Facil ? Si oui, TOUJOURS le mentionner.

## IDENTITÉ ET MISSION DE FACIL

Facil est une plateforme alternative et complémentaire aux plateformes officielles (cnedoge.gq pour passeports, etc.). Facil offre :
- **Assistance IA** pendant tout le processus
- **Paiement intégré** (BANGE, espèces, carte)
- **Suivi en temps réel** de la demande
- **Documentation guidée** pas à pas avec vérification automatique
- **Interface multilingue** (espagnol, français, anglais)

Quand le contexte mentionne une autre plateforme, TOUJOURS ajouter :
"Vous pouvez également effectuer cette démarche via **Facil**, qui offre un processus automatisé avec assistance IA, paiement intégré et suivi en temps réel. Souhaitez-vous que je vous présente le processus sur Facil ?"

## AGENT INTELLIGENT AVEC OUTILS

Vous êtes un AGENT avec des outils. RÈGLE ABSOLUE :
- NE JAMAIS dire "je n'ai pas l'information" quand vous avez des outils
- Contexte RAG insuffisant → UTILISEZ l'outil approprié IMMÉDIATEMENT
- Question vague → interprétez l'intention et cherchez

## LOGIQUE DE PRIX (CRITIQUE)

Les services de GE utilisent des PAQUETS FISCAUX (bundles) par type de commerce, avec prix variant par ZONE :
- **A1** - Capitales de Régions (Malabo, Bata) → prix les plus élevés
- **B1** - Capitales de Provinces → prix moyens
- **C1** - Capitales de Districts → prix réduits
- **D1** - Conseils de Villages → prix les plus bas

Pour les questions de prix d'ouverture :
1. Identifiez le type de commerce
2. Identifiez la zone (sinon demandez "Dans quelle ville ?")
3. Cherchez dans les Prix Officiels (source prioritaire)
4. Présentez un décompte structuré avec TOTAL

Source prioritaire : Document "Precios Oficiales" > prix individuels BD

## RÈGLES CRITIQUES

1. **Anti-hallucination** : UNIQUEMENT données du contexte ou outils. JAMAIS inventer.
2. **Sans codes techniques** : JAMAIS T-xxx, PAT-xxx
3. **Concision** : Paragraphes 2-3 phrases max
4. **Devise** : Coûts en **gras** avec XAF. Format : **480.000 XAF**
5. **Sans URLs** : NE PAS inclure de liens
6. **Priorité sources** : Documents législatifs > Prix officiels > Services BD
7. **Ton** : Chaleureux, professionnel, comme un conseiller de confiance
8. **TRADUISEZ** tous les noms de services et documents de l'espagnol au français

## FORMAT

Markdown propre. Symboles : → ▸ ● ✓ (PAS d'emojis)
Adaptez selon l'intention : Information → explication, Prix → tableau, Procédure → étapes, Démarrer → guide + "Souhaitez-vous démarrer sur Facil ?"
Terminez avec 1-2 suggestions connexes.
""",

        "en": """You are an expert fiscal advisor for **Facil**, the intelligent digital services platform of Equatorial Guinea. You are more than a chatbot: you are an agent with advanced reasoning, tools access, and deep knowledge of the Equatoguinean fiscal system.

## REASONING BEFORE RESPONDING (Chain-of-Thought)

Before each response, REASON internally (do not show to user):
1. **INTENT**: What does the user really want? (information / price / procedure / start / compare)
2. **SOURCES**: What data do I have? (RAG legislative context, services DB, tools)
3. **CROSS-REFERENCE**: Can I combine sources for a more complete answer?
4. **ZONE**: If pricing question, which geographic zone? (Malabo/Bata = Regional Capitals A1)
5. **FACIL**: Can this procedure be done on Facil? If yes, ALWAYS mention it.

## FACIL'S IDENTITY AND MISSION

Facil is an alternative and complementary platform to official government platforms (cnedoge.gq for passports, etc.). Facil offers:
- **AI assistance** throughout the application process
- **Integrated payment** (BANGE, cash, card)
- **Real-time tracking** of application status
- **Guided documentation** step by step with automatic verification
- **Multilingual interface** (Spanish, French, English)

When context mentions another platform, ALWAYS add:
"You can also complete this procedure through **Facil**, which offers an automated process with AI assistance, integrated payment, and real-time tracking. Would you like me to walk you through the process on Facil?"

## INTELLIGENT AGENT WITH TOOLS

You are an AGENT with tools. ABSOLUTE RULE:
- NEVER say "I don't have information" when you have tools available
- Insufficient RAG context → USE the appropriate tool IMMEDIATELY
- Vague question → interpret the most likely intent and search

## PRICING LOGIC (CRITICAL)

Equatorial Guinea services use FISCAL BUNDLES per commerce type, with prices varying by ZONE:
- **A1** - Regional Capitals (Malabo, Bata) → highest prices
- **B1** - Provincial Capitals → medium prices
- **C1** - District Capitals → reduced prices
- **D1** - Village Councils → lowest prices

For business opening price questions:
1. Identify the commerce type
2. Identify the zone (if not mentioned, ask "In which city?")
3. Search Official Prices (priority source)
4. Present a structured breakdown with TOTAL

Priority source: "Official Prices" document > individual BD prices

## CRITICAL RULES

1. **Anti-hallucination**: ONLY data from context or tools. NEVER invent.
2. **No technical codes**: NEVER show T-xxx, PAT-xxx
3. **Concise**: 2-3 sentence paragraphs max
4. **Currency**: Costs in **bold** with XAF. Format: **480,000 XAF**
5. **No URLs**: DO NOT include links
6. **Source priority**: Legislative docs > Official prices > Service DB
7. **Tone**: Warm, professional, like a trusted expert advisor
8. **TRANSLATE** all service names from Spanish to English

## FORMAT

Clean Markdown. Symbols: → ▸ ● ✓ (NO emojis)
Adapt by intent: Info → explanation, Price → table, Procedure → steps, Start → guide + "Would you like to start on Facil?"
End with 1-2 related suggestions.
"""
    }

    def __init__(self):
        """Initialize Gemini service with Vertex AI"""
        if not VERTEX_AI_AVAILABLE:
            logger.error("❌ Vertex AI SDK not available - Gemini disabled")
            self.enabled = False
            return

        try:
            # Initialize Vertex AI
            vertexai.init(
                project=settings.GOOGLE_CLOUD_PROJECT,
                location=settings.GOOGLE_CLOUD_LOCATION
            )

            # Initialize models
            self.chat_model = GenerativeModel(settings.GEMINI_CHAT_MODEL)
            self.pro_model = GenerativeModel(settings.GEMINI_PRO_MODEL)

            # Generation configuration
            self.generation_config = GenerationConfig(
                temperature=settings.GEMINI_TEMPERATURE,
                top_p=settings.GEMINI_TOP_P,
                top_k=settings.GEMINI_TOP_K,
                max_output_tokens=settings.GEMINI_MAX_OUTPUT_TOKENS,
            )

            # Safety settings (important for government service!)
            self.safety_settings = {
                HarmCategory.HARM_CATEGORY_HATE_SPEECH: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
                HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
                HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
                HarmCategory.HARM_CATEGORY_HARASSMENT: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
            }

            self.enabled = True
            logger.info(
                f"✅ Gemini service initialized "
                f"(chat: {settings.GEMINI_CHAT_MODEL}, "
                f"pro: {settings.GEMINI_PRO_MODEL})"
            )

        except Exception as e:
            logger.error(f"❌ Failed to initialize Gemini service: {e}")
            self.enabled = False



    async def chat(
        self,
        user_message: str,
        context_content: str,
        context_services: List[Dict[str, Any]],
        language: str = "es",
        conversation_history: Optional[List[Dict[str, str]]] = None,
        function_declarations: Optional[list] = None,
        force_tools: bool = False,
    ) -> Dict[str, Any]:
        """
        Generate chat response with RAG context

        Args:
            user_message: User's question/message
            context_content: Pre-built consolidated context from RAG (PDFs + services)
            context_services: Relevant services (used for suggestions/related info)
            language: Response language (es/fr/en)
            conversation_history: Previous messages for context

        Returns:
            Dict with:
            - message: AI response text
            - sources: List of service codes cited
            - confidence: Confidence score (0-1)
            - model: Model used
            - response_time: Generation time (seconds)
            - finish_reason: Why generation stopped

        Cost: ~$0.075/1M input tokens, ~$0.30/1M output tokens (Flash)
        """
        if not self.enabled:
            return {
                "message": "AI service temporarily unavailable. Please try again later.",
                "sources": [],
                "confidence": 0.0,
                "error": "Service disabled"
            }

        start_time = datetime.now()

        try:
            # Build prompts
            system_prompt = self.SYSTEM_PROMPTS.get(language, self.SYSTEM_PROMPTS["es"])
            # The consolidated context (including system instructions) is passed directly
            # from chatbot_service_rag.py. We wrap the user message to clarify its role.
            
            # Few-shot examples — teach Gemini the expected tutorial-style format
            few_shot_section = """
EJEMPLO DE BUENA RESPUESTA (formato tutoriel):

Pregunta: "¿Cómo obtener un pasaporte?"
Respuesta correcta:

### Pasaporte — Primera Expedición

Obtener un pasaporte en Guinea Ecuatorial es un trámite que se realiza a través de la plataforma Facil.

**Costo:** **7,500 XAF**

**Documentos que necesitas:**
- ▸ Documento Nacional de Identidad (DIP) — original y copia
- ▸ 4 fotografías tamaño pasaporte — fondo blanco
- ▸ Certificado de nacimiento — original

**Cómo hacerlo paso a paso:**
1. **Accede a Facil** → Entra en la plataforma y crea tu cuenta
2. **Selecciona "Pasaporte"** → Busca el servicio en el catálogo
3. **Prepara tus documentos** → Escanea o fotografía los 3 documentos de la lista
4. **Sube los documentos** → Adjunta los archivos uno por uno en la plataforma
5. **Reserva tu cita** → Elige fecha y hora disponibles (mínimo 3 días)
6. **Paga el servicio** → **7,500 XAF** por BANGE, tarjeta o en ventanilla
7. **Acude a tu cita** → Lleva los documentos originales para la toma biométrica
8. **Recoge tu pasaporte** → Te notificaremos cuando esté listo

**Tiempo total:** 15 días hábiles aproximadamente
**Entidad:** CNEDOGE (Malabo o Bata)

¿Necesitas saber las direcciones de las oficinas o los horarios de atención?
"""

            # Build conversation contents for multi-turn chat
            contents = []

            # Add conversation history if provided
            if conversation_history:
                for msg in conversation_history[-settings.RAG_CONVERSATION_HISTORY_LENGTH:]:  # Limit by setting
                    role = "user" if msg.get("role") == "user" else "model"
                    contents.append({
                        "role": role,
                        "parts": [{"text": msg.get("content", "")}]
                    })
                logger.info(f"Including {len(contents)} messages from conversation history")

            # Build conversation context summary for continuity
            context_summary = ""
            if conversation_history and len(conversation_history) > 4:
                user_topics = [
                    msg.get("content", "")[:80]
                    for msg in conversation_history
                    if msg.get("role") == "user"
                ]
                if user_topics:
                    context_summary = (
                        "\nCONTEXTO DE CONVERSACIÓN PREVIA:\n"
                        f"El usuario ya ha preguntado sobre: {'; '.join(user_topics[-5:])}\n"
                        "No repitas información ya proporcionada. Responde en contexto.\n"
                    )

            # Add current user message with system prompt + few-shot + context
            full_user_prompt = f"{system_prompt}\n{few_shot_section}\n{context_summary}\n{context_content}\n\nPREGUNTA DEL USUARIO:\n{user_message}"
            contents.append({
                "role": "user",
                "parts": [{"text": full_user_prompt}]
            })

            # Build tool parameter if function declarations provided
            generate_kwargs = {
                "generation_config": self.generation_config,
                "safety_settings": self.safety_settings,
            }
            if function_declarations:
                generate_kwargs["tools"] = [Tool(function_declarations=function_declarations)]
                # Force tool use when RAG context is empty/insufficient
                if force_tools:
                    try:
                        from vertexai.preview.generative_models import ToolConfig
                        generate_kwargs["tool_config"] = ToolConfig(
                            function_calling_config=ToolConfig.FunctionCallingConfig(
                                mode=ToolConfig.FunctionCallingConfig.Mode.ANY,
                            )
                        )
                        logger.info("ToolConfig mode=ANY: forcing tool use")
                    except ImportError:
                        logger.debug("ToolConfig not available, using default AUTO mode")

            # Generate response
            loop = asyncio.get_event_loop()
            response = await loop.run_in_executor(
                None,
                lambda: self.chat_model.generate_content(contents, **generate_kwargs)
            )

            # Check for function calls in response
            function_calls = []
            if response.candidates and response.candidates[0].content.parts:
                for part in response.candidates[0].content.parts:
                    if hasattr(part, 'function_call') and part.function_call:
                        fn_call = part.function_call
                        function_calls.append({
                            "name": fn_call.name,
                            "args": dict(fn_call.args) if fn_call.args else {},
                        })

            # If Gemini wants to call functions, return them for orchestration
            if function_calls:
                logger.info(f"Gemini requested {len(function_calls)} function call(s): {[fc['name'] for fc in function_calls]}")
                # Build proper Content objects for chat_history (round 2 needs these)
                chat_history = [
                    Content(role="user", parts=[Part.from_text(full_user_prompt)]),
                ]
                return {
                    "function_calls": function_calls,
                    "round1_response": response,  # Raw response for round 2
                    "chat_history": chat_history,  # Content objects for multi-round
                    "response_text": "",
                    "confidence": 0.0,
                    "response_time": (datetime.now() - start_time).total_seconds(),
                }

            # Extract response text
            response_text = response.text if response.text else ""

            # Extract service codes cited in response
            service_codes = self._extract_service_codes(response_text)

            # Calculate confidence
            confidence = self._calculate_confidence(
                response,
                context_services,
                service_codes
            )

            # Calculate response time
            response_time = (datetime.now() - start_time).total_seconds()

            logger.info(
                f"Gemini chat completed in {response_time:.2f}s "
                f"(confidence: {confidence:.2f}, sources: {len(service_codes)})"
            )

            return {
                "message": response_text,
                "sources": service_codes,
                "confidence": confidence,
                "model": settings.GEMINI_CHAT_MODEL,
                "response_time": response_time,
                "finish_reason": response.candidates[0].finish_reason.name if response.candidates else "UNKNOWN"
            }

        except Exception as e:
            logger.error(f"Gemini chat error: {e}")
            error_messages = {
                "es": "Lo siento, ocurrió un error al procesar tu pregunta. Por favor, intenta de nuevo.",
                "fr": "Désolé, une erreur s'est produite lors du traitement de votre question. Veuillez réessayer.",
                "en": "Sorry, an error occurred while processing your question. Please try again."
            }
            return {
                "message": error_messages.get(language, error_messages["es"]),
                "sources": [],
                "confidence": 0.0,
                "error": str(e)
            }

    async def chat_round2(
        self,
        round1_response: Any,
        chat_history: list,
        function_results_data: List[Dict],
        context_services: List[Dict[str, Any]],
        function_declarations: Optional[list] = None,
    ) -> Dict[str, Any]:
        """Execute round 2: send tool results back to Gemini for final response.

        Uses the proven pattern from base_analyst_service.py:
        1. Append round 1 model response (with function_call parts) to history
        2. Append function_response parts as user message
        3. Generate final content (Gemini sees all data and generates text)

        Args:
            round1_response: Raw Gemini response from round 1 (has function_call parts)
            chat_history: List of Content objects from round 1
            function_results_data: List of {name, args, result} from executed tools
            context_services: For confidence calculation
            function_declarations: Same declarations (for potential round 3)
        """
        import json as json_module
        start_time = datetime.now()
        try:
            # 1. Append Gemini's round 1 response (contains function_call parts)
            if round1_response.candidates and round1_response.candidates[0].content:
                chat_history.append(round1_response.candidates[0].content)

            # 2. Build function_response parts (proven pattern from base_analyst_service)
            fn_response_parts = []
            for fr in function_results_data:
                fn_response_parts.append(
                    Part.from_function_response(
                        name=fr["name"],
                        response={
                            "result": json_module.dumps(
                                fr["result"], default=str, ensure_ascii=False
                            )
                        },
                    )
                )

            chat_history.append(Content(role="user", parts=fn_response_parts))

            # 3. Generate final response with all accumulated context
            generate_kwargs = {
                "generation_config": self.generation_config,
                "safety_settings": self.safety_settings,
            }
            if function_declarations:
                generate_kwargs["tools"] = [Tool(function_declarations=function_declarations)]

            loop = asyncio.get_event_loop()
            response = await loop.run_in_executor(
                None,
                lambda: self.chat_model.generate_content(chat_history, **generate_kwargs)
            )

            # Check if Gemini wants MORE tools (chain-of-tools, rare)
            more_calls = []
            if response.candidates and response.candidates[0].content.parts:
                for part in response.candidates[0].content.parts:
                    if hasattr(part, 'function_call') and part.function_call and part.function_call.name:
                        more_calls.append({
                            "name": part.function_call.name,
                            "args": dict(part.function_call.args) if part.function_call.args else {},
                        })

            if more_calls:
                logger.info(f"Gemini round 2 requested {len(more_calls)} more tool(s) — returning for round 3")
                return {
                    "function_calls": more_calls,
                    "round1_response": response,
                    "chat_history": chat_history,
                    "response_text": "",
                    "confidence": 0.0,
                    "response_time": (datetime.now() - start_time).total_seconds(),
                }

            response_text = response.text if response.text else ""
            service_codes = self._extract_service_codes(response_text)
            confidence = self._calculate_confidence(response, context_services, service_codes)
            response_time = (datetime.now() - start_time).total_seconds()

            logger.info(f"Gemini round 2 completed in {response_time:.2f}s (confidence: {confidence:.2f})")

            return {
                "message": response_text,
                "sources": service_codes,
                "confidence": confidence,
                "model": settings.GEMINI_CHAT_MODEL,
                "response_time": response_time,
                "finish_reason": response.candidates[0].finish_reason.name if response.candidates else "UNKNOWN",
            }

        except Exception as e:
            logger.error(f"Gemini round 2 error: {e}")
            return {
                "message": "",
                "sources": [],
                "confidence": 0.0,
                "error": str(e),
            }

    async def chat_stream(
        self,
        user_message: str,
        context_content: str, # New parameter for consolidated context
        context_services: List[Dict[str, Any]],
        language: str = "es"
    ) -> AsyncGenerator[Dict[str, Any], None]:
        """
        Stream chat response for real-time UX

        Args:
            user_message: User's question
            context_content: Pre-built consolidated context from RAG (PDFs + services)
            context_services: Relevant services (used for suggestions/related info)
            language: Response language

        Yields:
            Chunks of response:
            - {"type": "chunk", "text": "..."}
            - {"type": "done"}
            - {"type": "error", "message": "..."}

        Perfect for frontend with typing animation
        """
        if not self.enabled:
            yield {
                "type": "error",
                "message": "AI service temporarily unavailable"
            }
            return

        try:
            # Build prompts
            system_prompt = self.SYSTEM_PROMPTS.get(language, self.SYSTEM_PROMPTS["es"])
            # The consolidated context (including system instructions) is passed directly
            # from chatbot_service_rag.py. We wrap the user message to clarify its role.
            full_prompt = f"{system_prompt}\n\n{context_content}\n\nPREGUNTA DEL USUARIO:\n{user_message}"

            # Generate streaming response
            loop = asyncio.get_event_loop()
            response_stream = await loop.run_in_executor(
                None,
                lambda: self.chat_model.generate_content(
                    full_prompt,
                    generation_config=self.generation_config,
                    safety_settings=self.safety_settings,
                    stream=True
                )
            )

            # Stream chunks
            full_text = ""
            for chunk in response_stream:
                if chunk.text:
                    full_text += chunk.text
                    yield {
                        "type": "chunk",
                        "text": chunk.text
                    }

            # Extract sources from full response
            service_codes = self._extract_service_codes(full_text)

            # Send completion with metadata
            yield {
                "type": "done",
                "sources": service_codes,
                "total_length": len(full_text)
            }

        except Exception as e:
            logger.error(f"Gemini stream error: {e}")
            yield {
                "type": "error",
                "message": str(e)
            }

    async def classify_intent(
        self,
        user_message: str,
        language: str = "es"
    ) -> Dict[str, Any]:
        """
        Classify user intent using Gemini

        Identifies what the user wants to do:
        - search: Looking for a service
        - guide: Needs step-by-step instructions
        - calculate: Wants to calculate costs
        - document: Asking about required documents
        - status: Checking application/payment status
        - general: General question

        Args:
            user_message: User's message
            language: Message language

        Returns:
            Dict with:
            - intent: Primary intent category
            - confidence: Confidence score (0-1)
            - keywords: Extracted keywords
            - suggested_filters: Recommended search filters
        """
        if not self.enabled:
            return {
                "intent": "search",
                "confidence": 0.5,
                "keywords": [],
                "suggested_filters": {}
            }

        prompt = f"""Analiza el siguiente mensaje del usuario y clasifica su intención.

Mensaje: "{user_message}"

Responde en formato JSON con:
{{
    "intent": "search|guide|calculate|document|status|general",
    "confidence": 0.0-1.0,
    "keywords": ["keyword1", "keyword2"],
    "suggested_filters": {{
        "category": "nombre_categoria_si_aplica",
        "service_type": "tax|service|license|permit"
    }}
}}

Intenciones:
- search: Busca un servicio específico
- guide: Necesita instrucciones paso a paso
- calculate: Quiere calcular costos
- document: Pregunta sobre documentos requeridos
- status: Consulta estado de trámite
- general: Pregunta general

Responde SOLO con el JSON, sin explicaciones adicionales."""

        try:
            loop = asyncio.get_event_loop()
            response = await loop.run_in_executor(
                None,
                lambda: self.chat_model.generate_content(
                    prompt,
                    generation_config=GenerationConfig(
                        temperature=0.1,  # Low temperature for structured output
                        max_output_tokens=500
                    )
                )
            )

            # Parse JSON response
            result = json.loads(response.text)
            return result

        except Exception as e:
            logger.error(f"Intent classification error: {e}")
            # Fallback to simple heuristics
            return self._fallback_intent_classification(user_message)

    def _extract_service_codes(self, text: str) -> List[str]:
        """
        Extract service codes mentioned in text

        Service codes follow pattern: XXX-### (e.g., PAT-001, IMP-042)

        Args:
            text: Text to search

        Returns:
            List of unique service codes found
        """
        pattern = r'\b[A-Z]{3}-\d{3}\b'
        codes = re.findall(pattern, text)
        return list(set(codes))  # Deduplicate

    def _calculate_confidence(
        self,
        response: Any,
        context_services: List[Dict],
        cited_codes: List[str]
    ) -> float:
        """
        Calculate confidence score for response

        Factors:
        - Number of relevant services found
        - Average similarity of retrieved services
        - Whether AI cited specific services
        - Response safety/quality indicators

        Args:
            response: Gemini response object
            context_services: Retrieved services
            cited_codes: Service codes cited in response

        Returns:
            Confidence score 0-1
        """
        if not context_services:
            return 0.3  # Low confidence without context

        # Base confidence from service similarity
        avg_similarity = sum(
            s.get('similarity', 0) for s in context_services
        ) / len(context_services)

        confidence = avg_similarity

        # Boost if AI cited specific services
        if cited_codes and len(cited_codes) > 0:
            confidence = min(1.0, confidence + 0.1)

        # Check finish reason
        if response.candidates:
            finish_reason = response.candidates[0].finish_reason.name
            if finish_reason != "STOP":
                confidence *= 0.7  # Reduce if incomplete

        # Cap at 0.95 (never 100% certain)
        return min(0.95, confidence)

    def _fallback_intent_classification(self, message: str) -> Dict[str, Any]:
        """Simple keyword-based intent classification as fallback"""
        message_lower = message.lower()

        # Intent keywords
        if any(word in message_lower for word in ["cuánto", "costo", "precio", "tasa", "tarifa"]):
            return {"intent": "calculate", "confidence": 0.6}
        elif any(word in message_lower for word in ["documentos", "requisitos", "necesito"]):
            return {"intent": "document", "confidence": 0.6}
        elif any(word in message_lower for word in ["cómo", "pasos", "proceso", "procedimiento"]):
            return {"intent": "guide", "confidence": 0.6}
        elif any(word in message_lower for word in ["estado", "trámite", "pago"]):
            return {"intent": "status", "confidence": 0.6}
        else:
            return {"intent": "search", "confidence": 0.5}


# ============================================================================
# SINGLETON INSTANCE
# ============================================================================

gemini_service = GeminiService()
