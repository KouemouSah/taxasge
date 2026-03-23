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
import json
import uuid
import asyncpg
from datetime import datetime

import hashlib

from app.modules.chatbot.services.embedding_service import embedding_service
from app.modules.chatbot.services.gemini_service import gemini_service
from app.modules.chatbot.services.chatbot_tools import (
    CHATBOT_FUNC_DECLS, CHATBOT_FUNCTION_MAP,
)
from app.modules.chatbot.repositories.semantic_search_repository import SemanticSearchRepository
from app.modules.chatbot.repositories.legislacion_repository import LegislacionRepository
from app.config import settings

MAX_TOOL_ROUNDS = 2
CACHE_TTL_SECONDS = 3600  # 1 hour cache for common queries


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
        db: Optional[asyncpg.Connection] = None,
        conversation_history: Optional[List[Dict[str, str]]] = None
    ) -> Dict[str, Any]:
        """
        Process chat message using RAG

        Args:
            message: User message
            context: Conversation context (user_id, role, conversation_id)
            language: Response language (es/fr/en)
            db: Database connection (required for RAG)
            conversation_history: Previous messages for context continuity
                Each message is {"role": "user"|"assistant", "content": "..."}

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
        user_id = context.get("user_id")

        # Fallback if AI disabled
        if not self.enabled or not db:
            return await self._fallback_response(message, conversation_id, language)

        # Cache check — skip for conversations with history (follow-ups need fresh context)
        if not conversation_history:
            cached = await self._get_cached_response(message, language)
            if cached:
                cached["conversation_id"] = conversation_id
                cached["response_time"] = (datetime.now() - start_time).total_seconds()
                cached["model"] = "gemini-rag-cached"
                logger.info(f"Cache HIT for: '{message[:50]}...'")
                return cached

        try:
            # Load persisted conversation history if available
            if not conversation_history and db:
                persisted = await self._load_conversation(db, conversation_id)
                if persisted:
                    conversation_history = persisted
                    logger.info(f"Loaded {len(persisted)} persisted messages for {conversation_id}")

            # Summarize long conversations to save context tokens
            if conversation_history and len(conversation_history) > 10:
                conversation_history = self._summarize_history(conversation_history)
                logger.info(f"Conversation summarized to {len(conversation_history)} messages")

            # Step 1: Generate query embedding
            logger.info(f"Processing chat: '{message[:50]}...' (lang: {language})")
            query_embedding = await embedding_service.generate_query_embedding(message)

            if not query_embedding:
                logger.warning("Failed to generate query embedding, using fallback")
                return await self._fallback_response(message, conversation_id, language)

            # Step 2a: Semantic search for relevant legislative documents (PDFs)
            legislacion_repo = LegislacionRepository(db)
            relevant_docs_extended = await legislacion_repo.search_documents( # Renamed variable
                query_embedding=query_embedding,
                limit=settings.RAG_EXTENDED_SEARCH_TOP_K, # Changed limit
                similarity_threshold=settings.SEMANTIC_SEARCH_SIMILARITY_THRESHOLD
            )
            logger.info(f"Found {len(relevant_docs_extended)} extended relevant legislative document chunks")

            # Step 2b: Semantic search for relevant fiscal services (DB)
            search_repo = SemanticSearchRepository(db)
            relevant_services_extended = await search_repo.search_services( # Renamed variable
                query_embedding=query_embedding,
                limit=settings.RAG_EXTENDED_SEARCH_TOP_K, # Changed limit
                similarity_threshold=settings.SEMANTIC_SEARCH_SIMILARITY_THRESHOLD
            )
            logger.info(f"Found {len(relevant_services_extended)} extended relevant services")

            # Filter for primary context (above SEMANTIC_SEARCH_SIMILARITY_THRESHOLD) + deduplicate
            relevant_docs = [doc for doc in relevant_docs_extended if doc.get('similarity', 0) >= settings.SEMANTIC_SEARCH_SIMILARITY_THRESHOLD][:settings.RAG_MAX_CONTEXT_DOCUMENTS]
            relevant_services = self._deduplicate_services(
                [svc for svc in relevant_services_extended if svc.get('similarity', 0) >= settings.SEMANTIC_SEARCH_SIMILARITY_THRESHOLD]
            )[:settings.RAG_MAX_CONTEXT_SERVICES]

            # Step 3: Consolidate and prioritize context for LLM
            consolidated_context, context_sources = self._consolidate_context(relevant_docs, relevant_services)

            # --- Fallback Logic (Suggestion 2 & 6 Implementation) ---
            message_to_llm = message # The message to send to LLM, might be refined by fallback
            fallback_message = ""
            did_you_mean_suggestions = []

            # Check for insufficient primary context — only fallback if BOTH docs and services are empty
            if not relevant_docs and not relevant_services and len(consolidated_context) < settings.RAG_MIN_CONTEXT_LENGTH:
                logger.warning(f"Insufficient primary context found for query: '{message[:50]}...' (length: {len(consolidated_context)})")
                
                # Try to generate "Did you mean?" suggestions
                did_you_mean_suggestions = self._generate_did_you_mean_suggestions(
                    query=message,
                    relevant_docs_extended=relevant_docs_extended,
                    relevant_services_extended=relevant_services_extended,
                    language=language
                )
                
                if did_you_mean_suggestions:
                    fallback_message = did_you_mean_suggestions[0] # Take the first "Did you mean?" message
                    logger.info(f"Using 'Did you mean?' fallback: {fallback_message}")
                else:
                    # If no "Did you mean?" suggestions, classify intent for a more guided fallback
                    intent_classification = await gemini_service.classify_intent(message, language)
                    intent = intent_classification.get('intent', 'search')
                    logger.info(f"Intent classified as '{intent}' for fallback.")

                    if intent in ["search", "general", "guide", "document", "calculate"]:
                        # General clarification if intent is broad or specific but no results
                        clarification_template = {
                            "es": "No encontré una respuesta directa a su pregunta. Por favor, intente reformular o añadir más detalles. Por ejemplo, ¿busca información sobre {intent_es}?",
                            "fr": "Je n'ai pas trouvé de réponse directe à votre question. Veuillez essayer de reformuler ou d'ajouter plus de détails. Par exemple, cherchez-vous des informations sur {intent_fr} ?",
                            "en": "I couldn't find a direct answer to your question. Please try rephrasing or adding more details. For example, are you looking for information about {intent_en}?"
                        }
                        intent_phrases = {
                            "search": {"es": "un servicio específico", "fr": "un service spécifique", "en": "a specific service"},
                            "general": {"es": "un tema general", "fr": "un sujet général", "en": "a general topic"},
                            "guide": {"es": "guías paso a paso", "fr": "des guides étape par étape", "en": "step-by-step guides"},
                            "document": {"es": "documentos requeridos", "fr": "les documents requis", "en": "required documents"},
                            "calculate": {"es": "cálculo de costos", "fr": "le calcul des coûts", "en": "cost calculation"}
                        }
                        fallback_message = clarification_template.get(language, clarification_template["es"]).format(
                            intent_es=intent_phrases.get(intent, {}).get("es", "este tema"),
                            intent_fr=intent_phrases.get(intent, {}).get("fr", "ce sujet"),
                            intent_en=intent_phrases.get(intent, {}).get("en", "this topic"),
                        )
                    else:
                        # Catch-all if intent is very unusual or unhandled for now
                        fallback_resp = await self._fallback_response(message, conversation_id, language)
                        fallback_message = fallback_resp.get("message", "")
            
            # If a fallback message is generated, we return it directly without calling Gemini for content generation
            if fallback_message:
                logger.info("Returning fallback message due to insufficient context.")
                return {
                    "message": fallback_message,
                    "conversation_id": conversation_id,
                    "suggestions": did_you_mean_suggestions if did_you_mean_suggestions else [],
                    "related_services": self._format_related_services(relevant_services), # Still show primary services if any
                    "related_documents": self._format_related_documents(relevant_docs), # Still show primary docs if any
                    "follow_up_actions": [],
                    "confidence": 0.1, # Low confidence for fallback
                    "response_time": (datetime.now() - start_time).total_seconds(),
                    "sources": [],
                    "model": "gemini-rag-fallback"
                }

            # Step 4: Generate AI response with RAG context + function calling tools
            # RAG context is ALWAYS provided (priority). Tools enrich when needed.
            func_decls = CHATBOT_FUNC_DECLS if CHATBOT_FUNC_DECLS else None
            ai_response = await gemini_service.chat(
                user_message=message,
                context_content=consolidated_context,
                context_services=relevant_services,
                language=language,
                conversation_history=conversation_history,
                function_declarations=func_decls,
            )

            # Step 4b: Multi-round tool execution if Gemini requested function calls
            tools_used = []
            tool_round = 0
            while ai_response.get("function_calls") and tool_round < MAX_TOOL_ROUNDS:
                tool_round += 1
                function_results_data = []

                for fc in ai_response["function_calls"]:
                    fn_name = fc["name"]
                    fn_args = fc.get("args", {})
                    fn_impl = CHATBOT_FUNCTION_MAP.get(fn_name)

                    if not fn_impl:
                        logger.warning(f"Unknown tool called: {fn_name}")
                        function_results_data.append({
                            "name": fn_name,
                            "args": fn_args,
                            "result": {"error": f"Unknown function: {fn_name}"},
                        })
                        continue

                    try:
                        result = await fn_impl(db, **fn_args)
                        tools_used.append(fn_name)
                        logger.info(f"Tool {fn_name}({fn_args}) → {len(str(result))} chars")
                        function_results_data.append({
                            "name": fn_name,
                            "args": fn_args,
                            "result": result,
                        })
                    except Exception as tool_err:
                        logger.error(f"Tool {fn_name} error: {tool_err}")
                        function_results_data.append({
                            "name": fn_name,
                            "args": fn_args,
                            "result": {"error": str(tool_err)},
                        })

                # Send tool results back to Gemini (round 2+)
                ai_response = await gemini_service.chat_round2(
                    round1_response=ai_response["round1_response"],
                    chat_history=ai_response["chat_history"],
                    function_results_data=function_results_data,
                    context_services=relevant_services,
                    function_declarations=func_decls,
                )

            if tools_used:
                logger.info(f"Chatbot used {len(tools_used)} tools in {tool_round} round(s): {tools_used}")

            # Override ai_response sources with our consolidated ones
            ai_response["sources"] = context_sources

            # Step 5: Build structured response
            response_time = (datetime.now() - start_time).total_seconds()
            response_message = ai_response.get("message", "")

            # Step 6: Self-evaluation — check response quality
            quality_score = await self._evaluate_response(
                message, response_message, consolidated_context
            )
            confidence = max(ai_response.get("confidence", 0.5), quality_score)
            logger.info(f"Response quality: {quality_score:.2f}, confidence: {confidence:.2f}")

            # Persist conversation (non-blocking, non-fatal)
            if db:
                await self._save_conversation(
                    db, conversation_id, message, response_message,
                    user_id=user_id, language=language,
                )

            final_response = {
                "message": response_message,
                "conversation_id": conversation_id,
                "suggestions": self._generate_suggestions(relevant_docs, relevant_services, language),
                "related_services": self._format_related_services(relevant_services),
                "related_documents": self._format_related_documents(relevant_docs),
                "follow_up_actions": self._generate_follow_up_actions(relevant_services, language),
                "confidence": confidence,
                "response_time": response_time,
                "sources": ai_response.get("sources", []),
                "model": ai_response.get("model", "gemini-rag")
            }

            # Step 7: Cache successful response for future identical queries
            await self._cache_response(message, language, final_response)

            return final_response

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

            # Semantic search for relevant legislative documents (PDFs)
            legislacion_repo = LegislacionRepository(db)
            relevant_docs_extended = await legislacion_repo.search_documents(
                query_embedding=query_embedding,
                limit=settings.RAG_EXTENDED_SEARCH_TOP_K,
                similarity_threshold=settings.SEMANTIC_SEARCH_SIMILARITY_THRESHOLD
            )

            # Semantic search for relevant fiscal services (DB)
            search_repo = SemanticSearchRepository(db)
            relevant_services_extended = await search_repo.search_services(
                query_embedding=query_embedding,
                limit=settings.RAG_EXTENDED_SEARCH_TOP_K,
                similarity_threshold=settings.SEMANTIC_SEARCH_SIMILARITY_THRESHOLD
            )
            
            # Filter for primary context (above SEMANTIC_SEARCH_SIMILARITY_THRESHOLD) + deduplicate
            relevant_docs = [doc for doc in relevant_docs_extended if doc.get('similarity', 0) >= settings.SEMANTIC_SEARCH_SIMILARITY_THRESHOLD][:settings.RAG_MAX_CONTEXT_DOCUMENTS]
            relevant_services = self._deduplicate_services(
                [svc for svc in relevant_services_extended if svc.get('similarity', 0) >= settings.SEMANTIC_SEARCH_SIMILARITY_THRESHOLD]
            )[:settings.RAG_MAX_CONTEXT_SERVICES]
            
            consolidated_context, context_sources = self._consolidate_context(relevant_docs, relevant_services)

            # --- Fallback Logic (Suggestion 2 & 6 Implementation for stream) ---
            if len(consolidated_context) < settings.RAG_MIN_CONTEXT_LENGTH:
                logger.warning(f"Insufficient primary context found for stream query: '{message[:50]}...' (length: {len(consolidated_context)})")

                did_you_mean_suggestions = self._generate_did_you_mean_suggestions(
                    query=message,
                    relevant_docs_extended=relevant_docs_extended,
                    relevant_services_extended=relevant_services_extended,
                    language=language
                )
                
                if did_you_mean_suggestions:
                    fallback_message = did_you_mean_suggestions[0]
                    logger.info(f"Using 'Did you mean?' fallback for stream: {fallback_message}")
                else:
                    intent_classification = await gemini_service.classify_intent(message, language)
                    intent = intent_classification.get('intent', 'search')
                    logger.info(f"Intent classified as '{intent}' for stream fallback.")

                    clarification_template = {
                        "es": "No encontré una respuesta directa a su pregunta. Por favor, intente reformular o añadir más detalles. Por ejemplo, ¿busca información sobre {intent_es}?",
                        "fr": "Je n'ai pas trouvé de réponse directe à votre question. Veuillez essayer de reformuler ou d'ajouter plus de détails. Par exemple, cherchez-vous des informations sur {intent_fr} ?",
                        "en": "I couldn't find a direct answer to your question. Please try rephrasing or adding more details. For example, are you looking for information about {intent_en}?"
                    }
                    intent_phrases = {
                        "search": {"es": "un servicio específico", "fr": "un service spécifique", "en": "a specific service"},
                        "general": {"es": "un tema general", "fr": "un sujet général", "en": "a general topic"},
                        "guide": {"es": "guías paso a paso", "fr": "des guides étape par étape", "en": "step-by-step guides"},
                        "document": {"es": "documentos requeridos", "fr": "les documents requis", "en": "required documents"},
                        "calculate": {"es": "cálculo de costos", "fr": "le calcul des coûts", "en": "cost calculation"}
                    }
                    fallback_message = clarification_template.get(language, clarification_template["es"]).format(
                        intent_es=intent_phrases.get(intent, {}).get("es", "este tema"),
                        intent_fr=intent_phrases.get(intent, {}).get("fr", "ce sujet"),
                        intent_en=intent_phrases.get(intent, {}).get("en", "this topic"),
                    )

                logger.info("Yielding fallback message for stream.")
                yield {"type": "chunk", "text": fallback_message}
                yield {"type": "done", "sources": [], "confidence": 0.1, "model": "gemini-rag-fallback", "suggestions": did_you_mean_suggestions}
                return # Exit early if fallback is used

            # Stream AI response
            async for chunk in gemini_service.chat_stream(
                user_message=message,
                context_content=consolidated_context, # New parameter
                context_services=relevant_services, # Keep for compatibility/future
                language=language
            ):
                if chunk.get("type") == "done":
                    chunk["sources"] = context_sources # Override sources
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
        start_time = datetime.now()

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
                "response_time": (datetime.now() - start_time).total_seconds()
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

            # Search for relevant services (top 3 + 3 alternatives)
            search_repo = SemanticSearchRepository(db)
            all_services = await search_repo.search_services(
                query_embedding=intent_embedding,
                limit=6  # Top 3 + 3 alternatives
            )

            services = all_services[:3]
            alternatives = all_services[3:6]

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
                "alternatives": [
                    {"service_code": s["service_code"], "name": s.get("name_es", ""), "similarity": s.get("similarity", 0)}
                    for s in alternatives
                ],
                "next_steps": self._generate_next_steps(services, language)
            }

        except Exception as e:
            logger.error(f"Recommendations error: {e}")
            return {"services": [], "error": str(e)}

    # ========================================================================
    # CONTEXT CONSOLIDATION
    # ========================================================================

    def _deduplicate_services(self, services: List[Dict]) -> List[Dict]:
        """Deduplicate services by service_code, keeping highest similarity.
        Also filters out test/invalid data (e.g., cost < 100 XAF)."""
        seen = {}
        for svc in services:
            code = svc.get('service_code', '')
            if not code:
                continue
            # Filter out test data (suspiciously low prices)
            price = svc.get('tasa_expedicion', 0)
            if price and float(price) > 0 and float(price) < 100:
                logger.debug(f"Filtered test service {code}: {price} XAF")
                continue
            if code not in seen or svc.get('similarity', 0) > seen[code].get('similarity', 0):
                seen[code] = svc
        return list(seen.values())

    def _consolidate_context(
        self,
        relevant_docs: List[Dict],
        relevant_services: List[Dict]
    ) -> tuple:
        """
        Build structured context string from legislative docs + fiscal services for LLM.
        Priority: legislative documents first (official sources), then services.

        Returns:
            (context_text: str, source_codes: List[str])
        """
        parts = []
        sources = []

        # Priority 1: Legislative documents (official government sources)
        if relevant_docs:
            parts.append("=== DOCUMENTOS LEGISLATIVOS (FUENTE OFICIAL) ===")
            for doc in relevant_docs[:getattr(settings, 'RAG_MAX_CONTEXT_DOCUMENTS', 5)]:
                doc_name = doc.get('document_name', 'Documento')
                page = doc.get('page_number', '?')
                content = doc.get('content', '')
                # Smart truncation at sentence boundary
                if len(content) > 600:
                    cut = content[:600].rfind('.')
                    content = content[:cut + 1] if cut > 200 else content[:600]
                parts.append(f"[{doc_name} - Pág. {page}]")
                parts.append(content)
                sources.append(f"DOC:{doc_name}:p{page}")

        # Priority 2: Fiscal services (with bundle context if available)
        if relevant_services:
            parts.append("=== SERVICIOS FISCALES ===")
            for svc in relevant_services[:getattr(settings, 'RAG_MAX_CONTEXT_SERVICES', 5)]:
                code = svc.get('service_code', '')
                name = svc.get('name_es', '')
                desc = svc.get('description_es', '') or ''
                price_exp = svc.get('tasa_expedicion', 0)
                price_ren = svc.get('tasa_renovacion', 0)
                cat = svc.get('category_name', '')
                bundle = svc.get('bundle_name', '')
                zone = svc.get('zone_name', '')
                svc_type = svc.get('service_type', '')
                legal_ref = svc.get('legal_reference', '')
                processing_days = svc.get('processing_time_days', '')
                validity_months = svc.get('validity_period_months', '')

                parts.append(f"[{code}] {name} ({cat})")
                if desc:
                    # Smart truncation
                    short_desc = desc[:300].rsplit('.', 1)[0] + '.' if len(desc) > 300 else desc
                    parts.append(f"  Descripción: {short_desc}")
                if price_exp and float(price_exp) > 0:
                    parts.append(f"  Tarifa expedición: {price_exp} XAF")
                if price_ren and float(price_ren) > 0:
                    parts.append(f"  Tarifa renovación: {price_ren} XAF")
                if svc_type:
                    parts.append(f"  Tipo: {svc_type}")
                if processing_days:
                    parts.append(f"  Tiempo de procesamiento: {processing_days} días")
                if validity_months:
                    parts.append(f"  Validez: {validity_months} meses")
                if legal_ref:
                    parts.append(f"  Referencia legal: {legal_ref}")
                if bundle:
                    parts.append(f"  Paquete fiscal: {bundle}")
                if zone:
                    parts.append(f"  Zona: {zone}")

                # Include required documents if available
                docs_req = svc.get('required_documents')
                if docs_req:
                    parts.append("  Documentos requeridos:")
                    if isinstance(docs_req, list):
                        for d in docs_req[:10]:
                            doc_name_req = d.get('document_name_es', d.get('template_code', '')) if isinstance(d, dict) else str(d)
                            if doc_name_req:
                                parts.append(f"    - {doc_name_req}")

                # Include procedures if available
                procedures = svc.get('procedures')
                if procedures:
                    parts.append("  Procedimientos:")
                    if isinstance(procedures, list):
                        for p in procedures[:5]:
                            p_name = p.get('name_es', p.get('template_code', '')) if isinstance(p, dict) else str(p)
                            if p_name:
                                parts.append(f"    - {p_name}")
                            steps = p.get('steps', []) if isinstance(p, dict) else []
                            if isinstance(steps, list):
                                for step in steps[:8]:
                                    step_desc = step.get('description', '') if isinstance(step, dict) else str(step)
                                    step_num = step.get('step_number', '') if isinstance(step, dict) else ''
                                    if step_desc:
                                        parts.append(f"      {step_num}. {step_desc}")

                sources.append(code)

        context_text = "\n".join(parts)

        # Truncate to MAX_CONTEXT_TOKENS (~4 chars/token)
        max_chars = getattr(settings, 'MAX_CONTEXT_TOKENS', 3000) * 4
        if len(context_text) > max_chars:
            context_text = context_text[:max_chars]

        return context_text, sources

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
        relevant_docs: List[Dict], # New parameter
        services: List[Dict],
        language: str
    ) -> List[str]:
        suggestions = []

        if relevant_docs:
            top_doc = relevant_docs[0]
            suggestions.append({
                "es": f"¿Qué dice el Documento {top_doc.get('document_name', '')} en la página {top_doc.get('page_number', '')} sobre este tema?",
                "fr": f"Que dit le Document {top_doc.get('document_name', '')} à la page {top_doc.get('page_number', '')} à propos de ce sujet ?",
                "en": f"What does Document {top_doc.get('document_name', '')} on page {top_doc.get('page_number', '')} say about this topic?"
            }.get(language, f"What does Document {top_doc.get('document_name', '')} on page {top_doc.get('page_number', '')} say about this topic?"))
            
            suggestions.append({
                "es": f"Explorar otras secciones del Documento {top_doc.get('document_name', '')}",
                "fr": f"Explorer d'autres sections du Document {top_doc.get('document_name', '')}",
                "en": f"Explore other sections of Document {top_doc.get('document_name', '')}"
            }.get(language, f"Explore other sections of Document {top_doc.get('document_name', '')}"))

        if services:
            top_service = services[0]
            suggestions.append({
                "es": f"Pregunta sobre los documentos requeridos para {top_service.get('name_es', '')}",
                "fr": f"Demandez les documents requis pour {top_service.get('name_es', '')}",
                "en": f"Ask about required documents for {top_service.get('name_es', '')}"
            }.get(language, f"Ask about required documents for {top_service.get('name_es', '')}"))
            
            suggestions.append({
                "es": f"¿Cuánto tiempo tarda el proceso de {top_service.get('service_code', '')}?",
                "fr": f"Combien de temps prend le processus {top_service.get('service_code', '')}?",
                "en": f"How long does the {top_service.get('service_code', '')} process take?"
            }.get(language, f"How long does the {top_service.get('service_code', '')} process take?"))

        # Return a maximum of 3 unique suggestions, prioritizing docs then services
        return list(dict.fromkeys(suggestions))[:3] # Using dict.fromkeys to preserve order and deduplicate

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

    def _format_related_documents(self, documents: List[Dict]) -> List[Dict]:
        """Format legislative documents for response"""
        return [
            {
                "document_name": d["document_name"],
                "page_number": d["page_number"],
                "similarity": round(d.get("similarity", 0), 2)
            }
            for d in documents[:settings.RAG_MAX_CONTEXT_DOCUMENTS] # Limit to top N documents
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

    def _generate_did_you_mean_suggestions(
        self,
        query: str,
        relevant_docs_extended: List[Dict],
        relevant_services_extended: List[Dict],
        language: str
    ) -> List[str]:
        """
        Generates "Did you mean?" suggestions from extended search results
        that are below the main similarity threshold but above the suggestion threshold.
        """
        suggestions = []
        
        # Collect potential suggestions from docs
        for doc in relevant_docs_extended:
            if settings.SUGGESTION_SIMILARITY_THRESHOLD <= doc.get('similarity', 0) < settings.SEMANTIC_SEARCH_SIMILARITY_THRESHOLD:
                doc_name = doc.get('document_name', '')
                if doc_name and doc_name not in suggestions: # Avoid duplicates
                    suggestions.append(f"{doc_name}")
        
        # Collect potential suggestions from services
        for svc in relevant_services_extended:
            if settings.SUGGESTION_SIMILARITY_THRESHOLD <= svc.get('similarity', 0) < settings.SEMANTIC_SEARCH_SIMILARITY_THRESHOLD:
                svc_name = svc.get('name_es', '') # Assuming name_es is always present and descriptive enough
                if svc_name and svc_name not in suggestions: # Avoid duplicates
                    suggestions.append(f"{svc_name}")
        
        if suggestions:
            # Craft a polite "Did you mean?" question
            did_you_mean_template = {
                "es": "No encontré una respuesta directa. ¿Quizás quisiste decir sobre: {suggestions_list}?",
                "fr": "Je n'ai pas trouvé de réponse directe. Vouliez-vous dire : {suggestions_list} ?",
                "en": "I couldn't find a direct answer. Did you mean: {suggestions_list}?"
            }
            suggestions_list_str = ", ".join(suggestions[:3]) # Limit to top 3 suggestions
            return [did_you_mean_template.get(language, did_you_mean_template["es"]).format(suggestions_list=suggestions_list_str)]
        
        return []

    # ========================================================================
    # CONVERSATION PERSISTENCE
    # ========================================================================

    async def _load_conversation(
        self, db: asyncpg.Connection, conversation_id: str
    ) -> Optional[List[Dict[str, str]]]:
        """Load conversation history from DB. Returns list of messages or None."""
        try:
            row = await db.fetchrow(
                "SELECT messages FROM chatbot_conversations WHERE conversation_id = $1",
                conversation_id,
            )
            if row and row["messages"]:
                messages = json.loads(row["messages"]) if isinstance(row["messages"], str) else row["messages"]
                return messages
        except Exception as e:
            logger.warning(f"Failed to load conversation {conversation_id}: {e}")
        return None

    async def _save_conversation(
        self,
        db: asyncpg.Connection,
        conversation_id: str,
        user_message: str,
        assistant_message: str,
        user_id: Optional[str] = None,
        language: str = "es",
    ) -> None:
        """Append user+assistant messages to conversation and persist."""
        try:
            new_messages = [
                {"role": "user", "content": user_message},
                {"role": "assistant", "content": assistant_message},
            ]
            # Upsert: create or append
            await db.execute(
                """
                INSERT INTO chatbot_conversations
                    (conversation_id, user_id, messages, language, message_count, last_message_at)
                VALUES ($1, $2::uuid, $3::jsonb, $4, 2, NOW())
                ON CONFLICT (conversation_id) DO UPDATE SET
                    messages = chatbot_conversations.messages || $3::jsonb,
                    message_count = chatbot_conversations.message_count + 2,
                    last_message_at = NOW()
                """,
                conversation_id,
                user_id,
                json.dumps(new_messages),
                language,
            )
        except Exception as e:
            # Non-fatal: log and continue
            logger.warning(f"Failed to save conversation {conversation_id}: {e}")

    # ========================================================================
    # RESPONSE CACHE (Redis-backed, 1h TTL for common queries)
    # ========================================================================

    async def _get_cached_response(self, message: str, language: str) -> Optional[Dict]:
        """Check Redis cache for a previous response to the same query."""
        try:
            from app.core.cache import get_cache
            cache = get_cache()
            cache_key = f"chat:resp:{language}:{hashlib.md5(message.lower().strip().encode()).hexdigest()}"
            cached = await cache.get(cache_key)
            if cached and isinstance(cached, dict):
                return cached
        except Exception:
            pass
        return None

    async def _cache_response(self, message: str, language: str, response: Dict):
        """Cache a successful response for future identical queries."""
        try:
            from app.core.cache import get_cache
            cache = get_cache()
            cache_key = f"chat:resp:{language}:{hashlib.md5(message.lower().strip().encode()).hexdigest()}"
            # Only cache high-confidence responses
            if response.get("confidence", 0) >= 0.3:
                cache_data = {
                    "message": response.get("message", ""),
                    "suggestions": response.get("suggestions", []),
                    "related_services": response.get("related_services", []),
                    "related_documents": response.get("related_documents", []),
                    "follow_up_actions": response.get("follow_up_actions", []),
                    "confidence": response.get("confidence", 0),
                    "sources": response.get("sources", []),
                }
                await cache.set(cache_key, cache_data, ttl=CACHE_TTL_SECONDS)
                logger.debug(f"Cached response for: '{message[:40]}...'")
        except Exception as e:
            logger.debug(f"Cache set failed (non-fatal): {e}")

    # ========================================================================
    # CONVERSATION SUMMARIZATION
    # ========================================================================

    def _summarize_history(self, history: List[Dict[str, str]]) -> List[Dict[str, str]]:
        """Compress old conversation messages into a summary.

        Keeps last 10 messages verbatim. Summarizes older ones into a
        single system message so Gemini has context without token bloat.
        """
        if not history or len(history) <= 10:
            return history

        # Split: old messages to summarize + recent to keep
        old_messages = history[:-10]
        recent_messages = history[-10:]

        # Build summary from old messages
        topics = []
        for msg in old_messages:
            if msg.get("role") == "user":
                topics.append(msg.get("content", "")[:100])
            elif msg.get("role") == "assistant":
                # Extract first sentence of assistant response
                content = msg.get("content", "")
                first_sentence = content.split(".")[0][:120] if content else ""
                if first_sentence:
                    topics.append(f"→ {first_sentence}")

        summary_text = (
            "RESUMEN DE CONVERSACIÓN ANTERIOR:\n"
            + "\n".join(topics[-8:])  # Last 8 exchanges max
        )

        summary_message = {
            "role": "user",
            "content": summary_text,
        }

        return [summary_message] + recent_messages

    # ========================================================================
    # SELF-EVALUATION (quality check)
    # ========================================================================

    async def _evaluate_response(
        self, question: str, response_text: str, context: str
    ) -> float:
        """Quick self-evaluation: does the response actually answer the question?

        Returns a quality score 0-1. If < 0.3, the response is likely
        off-topic or hallucinated.
        """
        if not response_text or len(response_text) < 20:
            return 0.1

        score = 0.5  # Base score

        # Check 1: Response length proportional to context
        if len(response_text) > 50:
            score += 0.1

        # Check 2: Response mentions key terms from question
        question_words = set(question.lower().split())
        response_words = set(response_text.lower().split())
        common = question_words & response_words
        if len(common) >= 2:
            score += 0.15

        # Check 3: Response uses data from context (not generic)
        if context:
            context_snippets = [w for w in context.split() if len(w) > 5][:20]
            context_in_response = sum(1 for w in context_snippets if w.lower() in response_text.lower())
            if context_in_response >= 3:
                score += 0.15

        # Check 4: Response has structure (lists, bold = used context)
        if "**" in response_text or "- " in response_text or "1." in response_text:
            score += 0.1

        return min(1.0, score)


# ============================================================================
# SINGLETON INSTANCE
# ============================================================================

chatbot_service_rag = ChatbotServiceRAG()
