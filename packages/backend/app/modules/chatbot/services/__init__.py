"""Chatbot Services"""

# Legacy placeholder service (deprecated — renamed to chatbot_service_deprecated.py)
from app.modules.chatbot.services.chatbot_service_deprecated import chatbot_service as chatbot_service_legacy, ChatbotService

# New RAG-powered service
from app.modules.chatbot.services.chatbot_service_rag import chatbot_service_rag, ChatbotServiceRAG

# Embedding and AI services
from app.modules.chatbot.services.embedding_service import embedding_service, EmbeddingService
from app.modules.chatbot.services.gemini_service import gemini_service, GeminiService

# Use RAG service as default
chatbot_service = chatbot_service_rag

__all__ = [
    "chatbot_service",  # Default (RAG)
    "chatbot_service_rag",
    "ChatbotServiceRAG",
    "embedding_service",
    "EmbeddingService",
    "gemini_service",
    "GeminiService",
    # Legacy
    "chatbot_service_legacy",
    "ChatbotService",
]
