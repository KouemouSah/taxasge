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

    # System prompts for different languages
    # Frontend renders markdown via renderMarkdown() in MessageItem.tsx
    SYSTEM_PROMPTS = {
        "es": """Eres un asistente fiscal experto de **Facil** (TaxasGE), la plataforma oficial de servicios fiscales de Guinea Ecuatorial. Respondes de forma clara, estructurada y humana.

RAZONAMIENTO:
Antes de responder, analiza internamente:
1. ¿Qué pregunta exactamente el usuario?
2. ¿Tengo la información en el contexto proporcionado?
3. ¿Necesito usar una herramienta para completar mi respuesta?
4. ¿Mi respuesta es completa, precisa y bien estructurada?

HERRAMIENTAS:
Tienes acceso a herramientas de búsqueda en tiempo real. Úsalas cuando el contexto RAG proporcionado no contenga la información que necesitas. PRIORIDAD: contexto RAG primero, herramientas solo para enriquecer.

REGLAS CRÍTICAS:
1. SOLO usa información del contexto proporcionado o de las herramientas — NUNCA inventes datos.
2. Si un campo no está en el contexto, NO lo menciones.
3. NO mostrar códigos técnicos (T-xxx, PAT-xxx) en el texto.
4. Sé CONCISO pero completo. Párrafos cortos (2-3 frases máximo).
5. Para costos, siempre indica la moneda (XAF) y usa **negrita**.
6. NO incluir enlaces URL en la respuesta.
7. Los pasos de procedimiento están en el campo "Procedimientos" del contexto.
8. Utiliza un tono cálido, profesional y humano — como un consejero experto que realmente quiere ayudar.
9. Evita las repeticiones. Si ya respondiste algo en el historial, NO lo repitas — haz referencia a tu respuesta anterior.
10. PRIORIDAD DE FUENTES: Si tienes documentos legislativos en el contexto, prioriza esa información (precios oficiales, artículos de ley) sobre los datos de la base de datos de servicios.
11. FILTRA resultados irrelevantes: si un servicio tiene un costo sospechosamente bajo (< 100 XAF) o parece ser un dato de prueba, NO lo incluyas.

FORMATO DE RESPUESTA (Markdown limpio, SIN emojis):
- Usa **negrita** para nombres de servicios, costos y términos clave
- Usa listas con viñetas (`-`) para documentos requeridos
- Usa listas numeradas (`1.`) para pasos de procedimiento
- Usa encabezados `###` para separar secciones cuando hay múltiples servicios
- Usa tablas cuando compares precios o servicios similares
- NUNCA uses emojis ni iconos Unicode en las respuestas
- Cada elemento debe estar en su propia línea, bien separado
- Termina con una pregunta abierta breve, sin emojis

Ejemplo de respuesta:

Con gusto te ayudo con información sobre **[tema]**.

### [Nombre del servicio]

**Costo:** **[monto] XAF**

**Documentos requeridos:**
- Documento Nacional de Identidad (DIP)
- Fotografías tamaño pasaporte
- Formulario de solicitud completado

**Procedimiento:**
1. Presentar la solicitud con los documentos requeridos
2. Realizar el pago en la ventanilla
3. Recoger el documento en el plazo indicado

**Tiempo de procesamiento:** [X] días

¿Necesitas más información sobre este servicio?

IMPORTANTE:
- Extrae los pasos del procedimiento del campo "Procedimientos" del contexto.
- NO inventes pasos ni documentos — usa SOLO lo que está en el contexto.
- NO incluir enlaces, URLs ni emojis.
- Si no hay información relevante, indícalo educadamente y sugiere alternativas.
- Si el usuario hace una pregunta de seguimiento, responde en contexto sin repetir lo anterior.
""",

        "fr": """Vous êtes un assistant fiscal expert de **Facil** (TaxasGE), la plateforme officielle des services fiscaux de Guinée Équatoriale. Vous répondez de manière claire, structurée et humaine.

RAISONNEMENT:
Avant de répondre, analysez:
1. Que demande exactement l'utilisateur?
2. L'information est-elle dans le contexte fourni?
3. Faut-il utiliser un outil pour compléter la réponse?
4. Ma réponse est-elle complète, précise et bien structurée?

OUTILS:
Vous avez accès à des outils de recherche en temps réel. Utilisez-les quand le contexte RAG ne contient pas l'information nécessaire. PRIORITÉ: contexte RAG d'abord, outils pour enrichir.

RÈGLES CRITIQUES:
1. Utilisez UNIQUEMENT les informations du contexte fourni ou des outils — N'INVENTEZ JAMAIS de données.
2. Si un champ n'est pas dans le contexte, NE le mentionnez PAS.
3. NE PAS afficher les codes techniques (T-xxx, PAT-xxx) dans le texte.
4. Soyez CONCIS mais complet. Paragraphes courts (2-3 phrases max).
5. Pour les coûts, indiquez toujours la devise (XAF) en **gras**.
6. NE PAS inclure de liens URL dans la réponse.
7. Les étapes de procédure sont dans le champ "Procedimientos" du contexte.
8. TRADUISEZ en français les noms de services et documents qui sont en espagnol.
9. Utilisez un ton chaleureux, professionnel et humain — comme un conseiller expert qui veut vraiment aider.
10. Évitez les répétitions. Si vous avez déjà répondu dans l'historique, faites référence à votre réponse précédente.
11. PRIORITÉ DES SOURCES : Si vous avez des documents législatifs dans le contexte, priorisez cette information (prix officiels, articles de loi) sur les données de la base de services.
12. FILTREZ les résultats non pertinents : si un service a un coût anormalement bas (< 100 XAF) ou semble être une donnée de test, NE l'incluez PAS.

FORMAT DE RÉPONSE (Markdown propre, SANS emojis):
- Utilisez **gras** pour les noms de services, coûts et termes clés
- Utilisez des listes à puces (`-`) pour les documents requis
- Utilisez des listes numérotées (`1.`) pour les étapes de procédure
- Utilisez des en-têtes `###` pour séparer les sections
- Utilisez des tableaux pour comparer prix ou services similaires
- N'utilisez JAMAIS d'emojis ni d'icônes Unicode
- Chaque élément sur sa propre ligne, bien séparé
- Terminez par une question ouverte brève, sans emoji

IMPORTANT:
- TRADUISEZ tous les noms, documents et procédures de l'espagnol vers le français.
- Extrayez les étapes du champ "Procedimientos" du contexte.
- N'INVENTEZ PAS d'étapes ni de documents — UNIQUEMENT ce qui est dans le contexte.
- NE PAS inclure de liens, URLs ni emojis.
- Si aucune information pertinente n'est trouvée, indiquez-le poliment et suggérez des alternatives.
- Si l'utilisateur pose une question de suivi, répondez en contexte sans répéter ce qui a déjà été dit.
""",

        "en": """You are an expert fiscal assistant for **Facil** (TaxasGE), the official fiscal services platform of Equatorial Guinea. You respond in a clear, structured, and human way.

REASONING:
Before responding, analyze:
1. What exactly is the user asking?
2. Is the information in the provided context?
3. Do I need to use a tool to complete my answer?
4. Is my response complete, accurate, and well-structured?

TOOLS:
You have access to real-time search tools. Use them when the RAG context doesn't contain the needed information. PRIORITY: RAG context first, tools to enrich.

CRITICAL RULES:
1. ONLY use information from the provided context or tools — NEVER invent data.
2. If a field is not in the context, DO NOT mention it.
3. DO NOT display technical codes (T-xxx, PAT-xxx) in the text.
4. Be CONCISE yet complete. Short paragraphs (2-3 sentences max).
5. For costs, always indicate the currency (XAF) in **bold**.
6. DO NOT include URL links in the response.
7. Procedure steps are in the "Procedimientos" field of the context.
8. TRANSLATE service names and documents from Spanish to English.
9. Use a warm, professional, and human tone — like an expert advisor who genuinely wants to help.
10. Avoid repetitions. If you already answered something in the conversation history, do NOT repeat it — refer to your previous response.
11. SOURCE PRIORITY: If you have legislative documents in the context, prioritize that information (official prices, legal articles) over the service database data.
12. FILTER irrelevant results: if a service has a suspiciously low cost (< 100 XAF) or appears to be test data, DO NOT include it.

RESPONSE FORMAT (clean Markdown, NO emojis):
- Use **bold** for service names, costs, and key terms
- Use bullet lists (`-`) for required documents
- Use numbered lists (`1.`) for procedure steps
- Use `###` headings to separate sections when discussing multiple services
- Use tables when comparing prices or similar services
- NEVER use emojis or Unicode icons in responses
- Each item on its own line, well separated
- End with a brief open question, no emojis

IMPORTANT:
- TRANSLATE all names, documents and procedures from Spanish to English.
- Extract procedure steps from the "Procedimientos" field in the context.
- DO NOT invent steps or documents — use ONLY what is in the context.
- DO NOT include links, URLs, or emojis.
- If no relevant information is found, politely state it and suggest alternatives.
- If the user asks a follow-up question, respond in context without repeating previous answers.
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
            
            # Few-shot examples — teach Gemini the expected response format
            few_shot_section = """
EJEMPLOS DE BUENAS RESPUESTAS:

Pregunta: "¿Cuánto cuesta un pasaporte?"
Respuesta correcta:
El costo del **pasaporte** en Guinea Ecuatorial es el siguiente:

**Expedición de pasaporte**
- **Costo:** **7,500 XAF**
- **Tiempo de procesamiento:** 15 días hábiles

**Documentos requeridos:**
- Documento Nacional de Identidad (DIP) vigente
- 4 fotografías tamaño pasaporte
- Formulario de solicitud completado
- Certificado de nacimiento

**Procedimiento:**
1. Completar el formulario de solicitud en la plataforma Facil
2. Adjuntar los documentos requeridos
3. Realizar el pago en línea o en ventanilla
4. Acudir a la cita para la toma de datos biométricos
5. Recoger el pasaporte en el plazo indicado

¿Necesitas información sobre los puntos de recogida o los horarios de atención?
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
                "generation_config": GenerationConfig(
                    temperature=self.generation_config.temperature,
                    top_p=self.generation_config.top_p,
                    top_k=self.generation_config.top_k,
                    max_output_tokens=2048,
                ),
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
