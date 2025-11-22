"""
Chatbot Service - RAG-powered AI assistance

Implements Retrieval-Augmented Generation (RAG) using:
- Gemini for chat and embeddings
- pgvector for semantic search
- PostgreSQL for fiscal services data

Author: Claude Code
Date: 2025-01-22
"""

from typing import Dict, Any, List, Optional, AsyncGenerator
from loguru import logger
import uuid
import asyncpg
from datetime import datetime

from app.modules.chatbot.services.embedding_service import embedding_service
from app.modules.chatbot.services.gemini_service import gemini_service
from app.modules.chatbot.repositories.semantic_search_repository import SemanticSearchRepository
from app.config import settings


class ChatbotServiceRAG:
    """
    RAG-powered chatbot service

    Workflow:
    1. User query → Generate embedding
    2. Semantic search → Find relevant services
    3. Build context → Enrich with DB data
    4. LLM generation → Gemini with context
    5. Response → Structured answer with sources
    """

    def __init__(self):
        """Initialize chatbot service"""
        self.provider = "gemini-rag"
        self.enabled = embedding_service.enabled and gemini_service.enabled

        if self.enabled:
            logger.info("✅ ChatbotServiceRAG initialized (RAG mode active)")
        else:
            logger.warning("⚠️ ChatbotServiceRAG initialized in fallback mode (AI disabled)")

    async def chat(
        self,
        message: str,
        context: Dict[str, Any],
        language: str = "es",
        db: Optional[asyncpg.Connection] = None
    ) -> Dict[str, Any]:
        """
        Process chat message using RAG

        Args:
            message: User message
            context: Conversation context (user_id, role, conversation_id)
            language: Response language (es/fr/en)
            db: Database connection (required for RAG)

        Returns:
            Dict with:
            - message: AI response
            - conversation_id: Conversation ID
            - suggestions: Follow-up suggestions
            - related_services: Related fiscal services
            - follow_up_actions: Recommended actions
            - confidence: Confidence score (0-1)
            - response_time: Processing time
            - sources: Service codes cited
        """
        start_time = datetime.now()
        conversation_id = context.get("conversation_id") or str(uuid.uuid4())

        # Fallback if AI disabled
        if not self.enabled or not db:
            return await self._fallback_response(message, conversation_id, language)

        try:
            # Step 1: Generate query embedding
            logger.info(f"Processing chat: '{message[:50]}...' (lang: {language})")
            query_embedding = await embedding_service.generate_query_embedding(message)

            if not query_embedding:
                logger.warning("Failed to generate query embedding, using fallback")
                return await self._fallback_response(message, conversation_id, language)

            # Step 2: Semantic search for relevant services
            search_repo = SemanticSearchRepository(db)
            relevant_services = await search_repo.search_services(
                query_embedding=query_embedding,
                limit=settings.RAG_MAX_CONTEXT_SERVICES,
                similarity_threshold=settings.SEMANTIC_SEARCH_SIMILARITY_THRESHOLD
            )

            logger.info(f"Found {len(relevant_services)} relevant services")

            # Step 3: Generate AI response with context
            ai_response = await gemini_service.chat(
                user_message=message,
                context_services=relevant_services,
                language=language
            )

            # Step 4: Build structured response
            response_time = (datetime.now() - start_time).total_seconds()

            return {
                "message": ai_response.get("message", ""),
                "conversation_id": conversation_id,
                "suggestions": self._generate_suggestions(relevant_services, language),
                "related_services": self._format_related_services(relevant_services),
                "follow_up_actions": self._generate_follow_up_actions(relevant_services, language),
                "confidence": ai_response.get("confidence", 0.5),
                "response_time": response_time,
                "sources": ai_response.get("sources", []),
                "model": ai_response.get("model", "gemini-rag")
            }

        except Exception as e:
            logger.error(f"Chat processing error: {e}")
            return await self._fallback_response(message, conversation_id, language, error=str(e))

    async def chat_stream(
        self,
        message: str,
        context: Dict[str, Any],
        language: str = "es",
        db: Optional[asyncpg.Connection] = None
    ) -> AsyncGenerator[Dict[str, Any], None]:
        """
        Stream chat response in real-time

        Args:
            message: User message
            context: Conversation context
            language: Response language
            db: Database connection

        Yields:
            Stream chunks:
            - {"type": "chunk", "text": "..."}
            - {"type": "done", "sources": [...]}
            - {"type": "error", "message": "..."}
        """
        if not self.enabled or not db:
            yield {"type": "error", "message": "AI service temporarily unavailable"}
            return

        try:
            # Generate query embedding
            query_embedding = await embedding_service.generate_query_embedding(message)

            if not query_embedding:
                yield {"type": "error", "message": "Failed to process query"}
                return

            # Semantic search
            search_repo = SemanticSearchRepository(db)
            relevant_services = await search_repo.search_services(
                query_embedding=query_embedding,
                limit=settings.RAG_MAX_CONTEXT_SERVICES
            )

            # Stream AI response
            async for chunk in gemini_service.chat_stream(
                user_message=message,
                context_services=relevant_services,
                language=language
            ):
                yield chunk

        except Exception as e:
            logger.error(f"Stream error: {e}")
            yield {"type": "error", "message": str(e)}

    async def intelligent_search(
        self,
        query: str,
        language: str,
        filters: Dict[str, Any],
        limit: int,
        user_context: Dict[str, Any],
        db: Optional[asyncpg.Connection] = None
    ) -> Dict[str, Any]:
        """
        AI-powered intelligent search for fiscal services

        Args:
            query: Search query
            language: Search language
            filters: Optional filters (category_id, service_type, etc.)
            limit: Max results
            user_context: User context (user_id, role)
            db: Database connection

        Returns:
            Dict with:
            - results: List of matching services
            - total: Total matches
            - query_understanding: AI's interpretation
            - search_intent: Detected intent
            - suggestions: Search suggestions
            - semantic_matches: Similarity scores
        """
        if not self.enabled or not db:
            return {
                "results": [],
                "total": 0,
                "query_understanding": query,
                "message": "Search temporarily unavailable"
            }

        try:
            # Step 1: Classify search intent
            intent = await gemini_service.classify_intent(query, language)
            logger.info(f"Search intent: {intent.get('intent')} (confidence: {intent.get('confidence')})")

            # Step 2: Generate query embedding
            query_embedding = await embedding_service.generate_query_embedding(query)

            if not query_embedding:
                return {"results": [], "total": 0, "error": "Failed to process query"}

            # Step 3: Semantic search with filters
            search_repo = SemanticSearchRepository(db)
            results = await search_repo.search_services(
                query_embedding=query_embedding,
                limit=limit,
                filters=filters
            )

            # Step 4: Format results
            return {
                "results": results,
                "total": len(results),
                "query_understanding": query,
                "search_intent": intent.get("intent"),
                "suggestions": self._generate_search_suggestions(results, query, language),
                "related_topics": self._extract_related_topics(results),
                "semantic_matches": [
                    {"service_code": s["service_code"], "similarity": s.get("similarity", 0)}
                    for s in results
                ],
                "language": language,
                "response_time": 0  # TODO: track
            }

        except Exception as e:
            logger.error(f"Intelligent search error: {e}")
            return {"results": [], "total": 0, "error": str(e)}

    async def get_recommendations(
        self,
        user_intent: str,
        context: Dict[str, Any],
        language: str,
        user_profile: Dict[str, Any],
        db: Optional[asyncpg.Connection] = None
    ) -> Dict[str, Any]:
        """
        Get AI-powered service recommendations

        Args:
            user_intent: What user wants to do
            context: Additional context
            language: Response language
            user_profile: User profile (user_id, role)
            db: Database connection

        Returns:
            Recommended services with explanations
        """
        if not self.enabled or not db:
            return {
                "services": [],
                "explanation": "Recommendations temporarily unavailable"
            }

        try:
            # Generate embedding for user intent
            intent_embedding = await embedding_service.generate_query_embedding(user_intent)

            if not intent_embedding:
                return {"services": [], "explanation": "Failed to process intent"}

            # Search for relevant services
            search_repo = SemanticSearchRepository(db)
            services = await search_repo.search_services(
                query_embedding=intent_embedding,
                limit=3  # Top 3 recommendations
            )

            # Generate explanation using Gemini
            explanation = await self._generate_recommendation_explanation(
                services,
                user_intent,
                language
            )

            return {
                "services": services,
                "explanation": explanation,
                "confidence_scores": {
                    s["service_code"]: s.get("similarity", 0)
                    for s in services
                },
                "alternatives": [],  # TODO: implement
                "next_steps": self._generate_next_steps(services, language)
            }

        except Exception as e:
            logger.error(f"Recommendations error: {e}")
            return {"services": [], "error": str(e)}

    # ========================================================================
    # HELPER METHODS
    # ========================================================================

    async def _fallback_response(
        self,
        message: str,
        conversation_id: str,
        language: str,
        error: Optional[str] = None
    ) -> Dict[str, Any]:
        """Fallback response when AI is unavailable"""
        messages = {
            "es": "Lo siento, el servicio de AI no está disponible en este momento. Por favor, intenta de nuevo más tarde o contacta al soporte.",
            "fr": "Désolé, le service AI n'est pas disponible pour le moment. Veuillez réessayer plus tard ou contacter le support.",
            "en": "Sorry, the AI service is temporarily unavailable. Please try again later or contact support."
        }

        return {
            "message": messages.get(language, messages["es"]),
            "conversation_id": conversation_id,
            "suggestions": [],
            "related_services": [],
            "follow_up_actions": [],
            "confidence": 0.0,
            "response_time": 0,
            "error": error or "AI service disabled"
        }

    def _generate_suggestions(
        self,
        services: List[Dict],
        language: str
    ) -> List[str]:
        """Generate follow-up suggestions based on retrieved services"""
        if not services:
            return []

        suggestions_templates = {
            "es": [
                f"Pregunta sobre los documentos requeridos para {services[0]['name_es']}",
                f"¿Cuánto tiempo tarda el proceso de {services[0]['service_code']}?",
                "¿Hay servicios relacionados que deba conocer?"
            ],
            "fr": [
                f"Demandez les documents requis pour {services[0]['name_es']}",
                f"Combien de temps prend le processus {services[0]['service_code']}?",
                "Y a-t-il des services connexes que je devrais connaître?"
            ],
            "en": [
                f"Ask about required documents for {services[0]['name_es']}",
                f"How long does the {services[0]['service_code']} process take?",
                "Are there related services I should know about?"
            ]
        }

        return suggestions_templates.get(language, suggestions_templates["es"])[:3]

    def _format_related_services(self, services: List[Dict]) -> List[Dict]:
        """Format services for response"""
        return [
            {
                "service_code": s["service_code"],
                "name": s["name_es"],
                "category": s.get("category_name", ""),
                "similarity": round(s.get("similarity", 0), 2)
            }
            for s in services[:5]
        ]

    def _generate_follow_up_actions(
        self,
        services: List[Dict],
        language: str
    ) -> List[str]:
        """Generate recommended next actions"""
        if not services:
            return []

        actions_templates = {
            "es": [
                "Ver detalles completos del servicio",
                "Calcular el costo total",
                "Iniciar el trámite"
            ],
            "fr": [
                "Voir les détails complets du service",
                "Calculer le coût total",
                "Commencer la procédure"
            ],
            "en": [
                "View complete service details",
                "Calculate total cost",
                "Start the procedure"
            ]
        }

        return actions_templates.get(language, actions_templates["es"])

    def _generate_search_suggestions(
        self,
        results: List[Dict],
        original_query: str,
        language: str
    ) -> List[str]:
        """Generate search refinement suggestions"""
        if not results:
            suggestions = {
                "es": ["Intenta con palabras diferentes", "Revisa la ortografía"],
                "fr": ["Essayez avec des mots différents", "Vérifiez l'orthographe"],
                "en": ["Try different words", "Check spelling"]
            }
            return suggestions.get(language, suggestions["es"])

        # Extract unique categories
        categories = list(set(
            r.get("category_name", "") for r in results
            if r.get("category_name")
        ))

        return [f"Buscar más servicios en {cat}" for cat in categories[:3]]

    def _extract_related_topics(self, results: List[Dict]) -> List[str]:
        """Extract related topics from results"""
        topics = set()

        for result in results:
            if result.get("category_name"):
                topics.add(result["category_name"])
            if result.get("sector_name"):
                topics.add(result["sector_name"])

        return list(topics)[:5]

    async def _generate_recommendation_explanation(
        self,
        services: List[Dict],
        user_intent: str,
        language: str
    ) -> str:
        """Generate explanation for recommendations using AI"""
        if not services or not gemini_service.enabled:
            return "Servicios recomendados basados en tu búsqueda."

        # Use Gemini to explain why these services are recommended
        prompt = f"""Explain briefly (2-3 sentences) why these services are recommended for: "{user_intent}"

Services:
{chr(10).join(f"- {s['service_code']}: {s['name_es']}" for s in services)}

Language: {language}
Keep it helpful and concise."""

        try:
            from app.modules.chatbot.services.gemini_service import gemini_service
            response = await gemini_service.chat(
                user_message=prompt,
                context_services=services,
                language=language
            )
            return response.get("message", "Servicios relevantes encontrados.")
        except:
            return "Servicios recomendados basados en tu búsqueda."

    def _generate_next_steps(
        self,
        services: List[Dict],
        language: str
    ) -> List[str]:
        """Generate next steps for recommended services"""
        steps_templates = {
            "es": [
                "Revisar los requisitos de cada servicio",
                "Preparar los documentos necesarios",
                "Calcular los costos totales",
                "Iniciar el trámite cuando estés listo"
            ],
            "fr": [
                "Examiner les exigences de chaque service",
                "Préparer les documents nécessaires",
                "Calculer les coûts totaux",
                "Commencer la procédure quand vous êtes prêt"
            ],
            "en": [
                "Review requirements for each service",
                "Prepare necessary documents",
                "Calculate total costs",
                "Start the process when ready"
            ]
        }

        return steps_templates.get(language, steps_templates["es"])


# ============================================================================
# SINGLETON INSTANCE
# ============================================================================

chatbot_service_rag = ChatbotServiceRAG()
