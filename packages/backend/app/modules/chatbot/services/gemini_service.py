"""
Gemini Service - AI chat and generation using Google Gemini

Provides intelligent chat, intent classification, and text generation
using Google's Gemini models via Vertex AI.

Author: Claude Code
Date: 2025-01-22
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
    SYSTEM_PROMPTS = {
        "es": """Eres un asistente fiscal experto de TaxasGE, la plataforma oficial de servicios fiscales de Guinea Ecuatorial.

**Tu rol:**
- Ayudar a ciudadanos y empresas con trámites fiscales y pagos
- Proporcionar información precisa sobre tasas, documentos y procedimientos
- Guiar paso a paso en procesos complejos
- Corregir errores de escritura y entender las intenciones del usuario

**Reglas estrictas:**
1. SOLO usa información del contexto proporcionado (servicios fiscales relevantes)
2. Si no tienes información suficiente, di claramente "No tengo información suficiente sobre esto"
3. SIEMPRE cita el código del servicio cuando hables de un servicio específico (ej: PAT-001)
4. Sé conciso pero completo - proporciona información útil sin divagar
5. Usa lenguaje simple, profesional y accesible
6. Si detectas errores de escritura, corrígelos silenciosamente
7. Para preguntas sobre costos, SIEMPRE menciona la moneda (XAF)
8. Si hay documentos requeridos, lístalos claramente

**Formato de respuesta preferido:**
- Respuesta directa a la pregunta
- Información clave (costos, tiempo de procesamiento, ministerio)
- Lista de documentos requeridos (si aplica)
- Pasos a seguir (si aplica)
- Sugerencias de servicios relacionados (si relevante)

**Ejemplos de buenas respuestas:**
Usuario: "¿Cuánto cuesta la patente de comercio?"
Tú: "La Patente de Comercio (PAT-001) tiene un costo de expedición de 50,000 XAF. El proceso tarda aproximadamente 5 días hábiles.
Se lo hace en el Ministerio de Comercio. 

Documentos requeridos:
- DNI o pasaporte
- Certificado de no antecedentes penales
- Plano del local comercial

¿Necesitas ayuda con alguno de estos documentos?"

Sé útil, preciso y profesional en todo momento.""",

        "fr": """Vous êtes un assistant fiscal expert de TaxasGE, la plateforme officielle des services fiscaux de Guinée Équatoriale.

**Votre rôle:**
- Aider les citoyens et les entreprises avec les démarches fiscales
- Fournir des informations précises sur les tarifs, documents et procédures
- Guider étape par étape dans les processus complexes
- Corriger les erreurs d'orthographe et comprendre les intentions

**Règles strictes:**
1. Utilisez UNIQUEMENT les informations du contexte fourni
2. Si vous n'avez pas assez d'informations, dites-le clairement
3. Citez TOUJOURS le code du service (ex: PAT-001)
4. Soyez concis mais complet
5. Utilisez un langage simple et professionnel
6. Pour les coûts, mentionnez TOUJOURS la devise (XAF)
7. Listez clairement les documents requis et le ministère concerné

Soyez utile, précis et professionnel.""",

        "en": """You are an expert fiscal assistant for TaxasGE, the official fiscal services platform of Equatorial Guinea.

**Your role:**
- Help citizens and businesses with fiscal procedures
- Provide accurate information about fees, documents, and procedures
- Guide step-by-step through complex processes
- Correct typos and understand user intent

**Strict rules:**
1. ONLY use information from the provided context
2. If you don't have enough information, say so clearly
3. ALWAYS cite the service code (e.g., PAT-001)
4. Be concise but complete
5. Use simple, professional language
6. For costs, ALWAYS mention the currency (XAF)
7. Clearly list required documents

Be helpful, accurate, and professional."""
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

    def _build_context_prompt(
        self,
        services: List[Dict[str, Any]],
        user_query: str,
        language: str = "es"
    ) -> str:
        """
        Build rich context from retrieved fiscal services

        Args:
            services: List of relevant fiscal services from semantic search
            user_query: User's original question
            language: Response language

        Returns:
            Formatted context for LLM prompt
        """
        if not services:
            return f"PREGUNTA DEL USUARIO:\n{user_query}\n\nNOTA: No se encontraron servicios relevantes en la base de datos."

        context_parts = []

        # Language-specific headers
        headers = {
            "es": "SERVICIOS FISCALES RELEVANTES:",
            "fr": "SERVICES FISCAUX PERTINENTS:",
            "en": "RELEVANT FISCAL SERVICES:"
        }
        context_parts.append(headers.get(language, headers["es"]))

        # Format each service
        for idx, service in enumerate(services, 1):
            context_parts.append(f"\n--- Servicio {idx}: {service['service_code']} ---")
            context_parts.append(f"Nombre: {service['name_es']}")
            context_parts.append(f"Tipo: {service.get('service_type', 'N/A')}")

            if service.get('category_name'):
                hierarchy = [service['category_name']]
                if service.get('sector_name'):
                    hierarchy.append(service['sector_name'])
                if service.get('ministry_name'):
                    hierarchy.append(service['ministry_name'])
                context_parts.append(f"Categoría: {' > '.join(hierarchy)}")

            if service.get('description_es'):
                desc = service['description_es']
                if len(desc) > 300:
                    desc = desc[:300] + "..."
                context_parts.append(f"Descripción: {desc}")

            # Costs
            if service.get('tasa_expedicion'):
                context_parts.append(f"Tasa de expedición: {service['tasa_expedicion']} XAF")

            if service.get('tasa_renovacion'):
                context_parts.append(f"Tasa de renovación: {service['tasa_renovacion']} XAF")

            # Processing time
            if service.get('processing_time_days'):
                context_parts.append(f"Tiempo de procesamiento: {service['processing_time_days']} días")

            # Validity period
            if service.get('validity_period_months'):
                context_parts.append(f"Periodo de validez: {service['validity_period_months']} meses")

            # Required documents
            if service.get('required_documents'):
                try:
                    docs = json.loads(service['required_documents']) if isinstance(service['required_documents'], str) else service['required_documents']
                    if docs and len(docs) > 0:
                        context_parts.append("Documentos requeridos:")
                        for doc in docs[:5]:  # Limit to 5 documents
                            doc_name = doc.get('document_name', 'N/A')
                            is_required = "Obligatorio" if doc.get('is_required_expedition', True) else "Opcional"
                            context_parts.append(f"  - {doc_name} ({is_required})")
                except:
                    pass

            # Legal reference
            if service.get('legal_reference'):
                ref = service['legal_reference']
                if len(ref) > 150:
                    ref = ref[:150] + "..."
                context_parts.append(f"Referencia legal: {ref}")

            # Similarity score (for debugging)
            if service.get('similarity'):
                context_parts.append(f"[Relevancia: {service['similarity']:.1%}]")

        # Add user query at the end
        query_headers = {
            "es": "PREGUNTA DEL USUARIO:",
            "fr": "QUESTION DE L'UTILISATEUR:",
            "en": "USER QUESTION:"
        }
        context_parts.append(f"\n\n{query_headers.get(language, query_headers['es'])}")
        context_parts.append(user_query)

        return "\n".join(context_parts)

    async def chat(
        self,
        user_message: str,
        context_services: List[Dict[str, Any]],
        language: str = "es",
        conversation_history: Optional[List[Dict[str, str]]] = None
    ) -> Dict[str, Any]:
        """
        Generate chat response with RAG context

        Args:
            user_message: User's question/message
            context_services: Relevant services from semantic search
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
            context_prompt = self._build_context_prompt(
                context_services,
                user_message,
                language
            )

            # Combine prompts
            full_prompt = f"{system_prompt}\n\n{context_prompt}"

            # Generate response
            loop = asyncio.get_event_loop()
            response = await loop.run_in_executor(
                None,
                lambda: self.chat_model.generate_content(
                    full_prompt,
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
        context_services: List[Dict[str, Any]],
        language: str = "es"
    ) -> AsyncGenerator[Dict[str, Any], None]:
        """
        Stream chat response for real-time UX

        Args:
            user_message: User's question
            context_services: Relevant services
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
            context_prompt = self._build_context_prompt(
                context_services,
                user_message,
                language
            )
            full_prompt = f"{system_prompt}\n\n{context_prompt}"

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
