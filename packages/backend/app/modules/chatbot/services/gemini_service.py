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
        HarmBlockThreshold
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
    # NOTE: Using plain text formatting since frontend doesn't render markdown
    SYSTEM_PROMPTS = {
        "es": """Eres un asistente fiscal experto de TaxasGE, la plataforma oficial de servicios fiscales de Guinea Ecuatorial.

REGLAS CRÍTICAS:
1. SOLO usa información del contexto proporcionado - NUNCA inventes datos.
2. Si un campo no está en el contexto, NO lo menciones.
3. NO mostrar códigos técnicos (T-xxx, PAT-xxx) en el texto.
4. Sé CONCISO pero completo, yendo al grano pero proporcionando los detalles necesarios.
5. Para costos, menciona la moneda (XAF).
6. NO incluir enlaces URL en la respuesta.
7. Los pasos de procedimiento están en el campo "Procedimientos" del contexto.
8. Utiliza un tono amigable y profesional, como un consejero experto. Varía la estructura de tus frases.
9. Evita las repeticiones y utiliza palabras de transición para fluidizar el discurso.
10. Comienza siempre con una breve introducción atractiva y termina con una pregunta abierta o una invitación a continuar la conversación, a menos que la respuesta sea una conclusión clara.

FORMATO DE RESPUESTA (usar texto plano, sin markdown):

Ejemplo de respuesta:

"¡Hola! Claro, con gusto te ayudo a encontrar información sobre [tema]. Aquí tienes los detalles del servicio más relevante que he encontrado:

SERVICIO: [Nombre del servicio]

Costo: [monto] XAF

Documentos requeridos:
1. [Documento 1]
2. [Documento 2]
3. [Documento 3]

Procedimiento:
1. [Paso 1 del contexto]
2. [Paso 2 del contexto]
3. [Paso 3 del contexto]

Espero que esta información te sea útil. ¿Hay algo más en lo que pueda asistirte hoy?"

IMPORTANTE:
- Extrae los pasos del procedimiento del campo "Procedimientos" del contexto.
- NO inventes pasos ni documentos - usa SOLO lo que está en el contexto.
- NO incluir enlaces o URLs.
- Si no hay información relevante, indícalo educadamente y sugiere al usuario que reformule su pregunta.
""",

        "fr": """Vous êtes un assistant fiscal expert de TaxasGE, la plateforme officielle des services fiscaux de Guinée Équatoriale.

RÈGLES CRITIQUES:
1. Utilisez UNIQUEMENT les informations du contexte fourni - N'INVENTEZ JAMAIS de données.
2. Si un champ n'est pas dans le contexte, NE le mentionnez PAS.
3. NE PAS afficher les codes techniques (T-xxx, PAT-xxx) dans le texte.
4. Soyez CONCIS mais complet, en allant droit au but tout en fournissant les détails nécessaires.
5. Pour les coûts, mentionnez la devise (XAF).
6. NE PAS inclure de liens URL dans la réponse.
7. Les étapes de procédure sont dans le champ "Procedimientos" du contexte.
8. TRADUISEZ en français les noms de services et documents qui sont en espagnol.
9. Utilisez un ton amical et professionnel, comme un conseiller expert. Variez la structure de vos phrases.
10. Évitez les répétitions et utilisez des mots de transition pour fluidifier le discours.
11. Commencez toujours par une brève introduction engageante et terminez par une question ouverte ou une invitation à poursuivre la conversation, à moins que la réponse soit une conclusion claire.

FORMAT DE RÉPONSE (utiliser texte simple, sans markdown):

Exemple de réponse:

"Bonjour ! Bien sûr, je suis là pour vous aider avec les informations sur [sujet]. Voici les détails du service le plus pertinent que j'ai trouvé :

SERVICE: [Nom du service traduit en français]

Coût: [montant] XAF

Documents requis:
1. [Document traduit en français]
2. [Document traduit en français]
3. [Document traduit en français]

Procédure:
1. [Étape traduite en français]
2. [Étape traduite en français]
3. [Étape traduite en français]

J'espère que ces informations vous seront utiles. Puis-je vous aider avec autre chose aujourd'hui ?"

IMPORTANT:
- TRADUISEZ tous les noms, documents et procédures de l'espagnol vers le français.
- Extrayez les étapes de la procédure du champ "Procedimientos" du contexte.
- N'INVENTEZ PAS d'étapes ni de documents - utilisez UNIQUEMENT ce qui est dans le contexte.
- NE PAS inclure de liens ou URLs.
- Si aucune information pertinente n'est trouvée, indiquez-le poliment et suggérez à l'utilisateur de reformuler sa question.
""",

        "en": """You are an expert fiscal assistant for TaxasGE, the official fiscal services platform of Equatorial Guinea.

CRITICAL RULES:
1. ONLY use information from the provided context - NEVER invent data.
2. If a field is not in the context, DO NOT mention it.
3. DO NOT display technical codes (T-xxx, PAT-xxx) in the text.
4. Be CONCISE yet complete, getting straight to the point while providing necessary details.
5. For costs, mention the currency (XAF).
6. DO NOT include URL links in the response.
7. Procedure steps are in the "Procedimientos" field of the context.
8. TRANSLATE service names and documents from Spanish to English.
9. Use a friendly and professional tone, like an expert advisor. Vary your sentence structure.
10. Avoid repetitions and use transition words to make the discourse flow smoothly.
11. Always start with a brief, engaging introduction and end with an open question or an invitation to continue the conversation, unless the answer is a clear conclusion.

RESPONSE FORMAT (use plain text, no markdown):

Example response:

"Hello! Of course, I'd be happy to help you find information about [topic]. Here are the details of the most relevant service I found:

SERVICE: [Service name translated to English]

Cost: [amount] XAF

Required documents:
1. [Document translated to English]
2. [Document translated to English]
3. [Document translated to English]

Procedure:
1. [Step translated to English]
2. [Step translated to English]
3. [Step translated to English]

I hope this information is useful to you. Is there anything else I can assist you with today?"

IMPORTANT:
- TRANSLATE all names, documents and procedures from Spanish to English.
- Extract procedure steps from the "Procedimientos" field in the context.
- DO NOT invent steps or documents - use ONLY what is in the context.
- DO NOT include links or URLs.
- If no relevant information is found, politely state it and suggest the user rephrase their question.
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
        context_content: str, # New parameter for consolidated context
        context_services: List[Dict[str, Any]],
        language: str = "es",
        conversation_history: Optional[List[Dict[str, str]]] = None
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

            # Add current user message with system prompt and consolidated context
            full_user_prompt = f"{system_prompt}\n\n{context_content}\n\nPREGUNTA DEL USUARIO:\n{user_message}"
            contents.append({
                "role": "user",
                "parts": [{"text": full_user_prompt}]
            })

            # Generate response
            loop = asyncio.get_event_loop()
            response = await loop.run_in_executor(
                None,
                lambda: self.chat_model.generate_content(
                    contents,
                    generation_config=self.generation_config,
                    safety_settings=self.safety_settings
                )
            )

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
            # Multilingual error messages
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
