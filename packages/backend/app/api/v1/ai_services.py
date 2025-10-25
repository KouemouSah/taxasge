"""
🤖 TaxasGE AI Services API
Intelligent assistance for fiscal services, document processing, and user guidance
"""

from fastapi import APIRouter, HTTPException, Depends, Query, Path, status, UploadFile, File
from fastapi.responses import JSONResponse, StreamingResponse
from typing import List, Optional, Dict, Any, AsyncGenerator
from uuid import UUID
from loguru import logger
from datetime import datetime
import json

from app.models.user import UserResponse
from app.api.v1.auth import get_current_user, get_current_user_optional, require_admin
from app.services.ai_service import ai_service
from app.services.translation_service import translation_service

router = APIRouter(prefix="/ai", tags=["AI Services"])


@router.get("/", response_model=Dict[str, Any])
async def get_ai_services_info():
    """Get AI Services API information"""
    return {
        "message": "TaxasGE AI Services API",
        "version": "1.0.0",
        "description": "Intelligent assistance for fiscal services and document processing",
        "endpoints": {
            "chat": "POST /chat - Interactive AI chat assistance",
            "stream": "POST /chat/stream - Streaming AI chat",
            "search": "POST /search - AI-powered service search",
            "recommend": "POST /recommend - Service recommendations",
            "analyze": "POST /analyze-document - Document analysis",
            "extract": "POST /extract-data - Data extraction from documents",
            "translate": "POST /translate - Text translation",
            "summarize": "POST /summarize - Document summarization",
            "guide": "POST /guide - Step-by-step guidance",
            "validate": "POST /validate - Form validation assistance"
        },
        "features": [
            "Multilingual AI chat (Spanish, French, English)",
            "Intelligent fiscal service search and recommendations",
            "Document analysis and data extraction",
            "Real-time translation services",
            "Step-by-step procedure guidance",
            "Form validation and error correction",
            "Contextual help and explanations",
            "Voice-to-text and text-to-voice support"
        ],
        "supported_languages": ["es", "fr", "en"],
        "ai_capabilities": [
            "Natural language understanding",
            "Document processing",
            "Multi-turn conversations",
            "Context awareness",
            "Knowledge retrieval",
            "Process automation"
        ]
    }


@router.post("/chat", response_model=Dict[str, Any])
async def ai_chat(
    message: str = Query(..., description="User message"),
    conversation_id: Optional[str] = Query(None, description="Conversation ID for context"),
    language: str = Query("es", pattern="^(es|fr|en)$", description="Response language"),
    context: Optional[Dict[str, Any]] = None,
    current_user: Optional[UserResponse] = Depends(get_current_user_optional)
):
    """Interactive AI chat assistance for fiscal services"""
    try:
        # Prepare chat context
        chat_context = {
            "user_id": str(current_user.id) if current_user else None,
            "user_role": current_user.role.value if current_user else "guest",
            "language": language,
            "conversation_id": conversation_id,
            "timestamp": datetime.utcnow().isoformat(),
            "additional_context": context or {}
        }

        # Get AI response
        ai_response = await ai_service.chat(
            message=message,
            context=chat_context,
            language=language
        )

        if not ai_response:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to get AI response"
            )

        # Log interaction
        logger.info(f"AI chat interaction - User: {current_user.id if current_user else 'anonymous'}, Language: {language}")

        return {
            "response": ai_response["message"],
            "conversation_id": ai_response["conversation_id"],
            "suggestions": ai_response.get("suggestions", []),
            "related_services": ai_response.get("related_services", []),
            "follow_up_actions": ai_response.get("follow_up_actions", []),
            "confidence": ai_response.get("confidence", 0.8),
            "response_time": ai_response.get("response_time", 0),
            "language": language,
            "timestamp": datetime.utcnow().isoformat()
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in AI chat: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error processing AI chat request"
        )


@router.post("/chat/stream")
async def ai_chat_stream(
    message: str = Query(..., description="User message"),
    conversation_id: Optional[str] = Query(None, description="Conversation ID"),
    language: str = Query("es", pattern="^(es|fr|en)$", description="Response language"),
    current_user: Optional[UserResponse] = Depends(get_current_user_optional)
):
    """Streaming AI chat for real-time responses"""
    try:
        # Prepare context
        chat_context = {
            "user_id": str(current_user.id) if current_user else None,
            "user_role": current_user.role.value if current_user else "guest",
            "language": language,
            "conversation_id": conversation_id,
            "streaming": True
        }

        # Create streaming response
        async def generate_stream() -> AsyncGenerator[str, None]:
            try:
                async for chunk in ai_service.chat_stream(message, chat_context, language):
                    yield f"data: {json.dumps(chunk)}\n\n"

                # Send final completion signal
                yield f"data: {json.dumps({'type': 'done'})}\n\n"

            except Exception as e:
                logger.error(f"Error in AI chat stream: {e}")
                yield f"data: {json.dumps({'type': 'error', 'message': 'Stream error'})}\n\n"

        return StreamingResponse(
            generate_stream(),
            media_type="text/plain",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "Content-Type": "text/event-stream"
            }
        )

    except Exception as e:
        logger.error(f"Error setting up AI chat stream: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error setting up chat stream"
        )


@router.post("/search", response_model=Dict[str, Any])
async def ai_powered_search(
    query: str = Query(..., description="Search query"),
    language: str = Query("es", pattern="^(es|fr|en)$", description="Response language"),
    filters: Optional[Dict[str, Any]] = None,
    limit: int = Query(10, ge=1, le=50, description="Number of results"),
    current_user: Optional[UserResponse] = Depends(get_current_user_optional)
):
    """AI-powered intelligent search for fiscal services"""
    try:
        # Perform AI-enhanced search
        search_results = await ai_service.intelligent_search(
            query=query,
            language=language,
            filters=filters or {},
            limit=limit,
            user_context={
                "user_id": str(current_user.id) if current_user else None,
                "user_role": current_user.role.value if current_user else "guest"
            }
        )

        if not search_results:
            return {
                "results": [],
                "total": 0,
                "query_understanding": "No results found",
                "suggestions": ["Try using different keywords", "Check spelling", "Use more general terms"],
                "related_topics": []
            }

        return {
            "results": search_results["results"],
            "total": search_results["total"],
            "query_understanding": search_results.get("query_understanding", ""),
            "search_intent": search_results.get("search_intent", ""),
            "suggestions": search_results.get("suggestions", []),
            "related_topics": search_results.get("related_topics", []),
            "semantic_matches": search_results.get("semantic_matches", []),
            "language": language,
            "response_time": search_results.get("response_time", 0)
        }

    except Exception as e:
        logger.error(f"Error in AI-powered search: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error performing AI search"
        )


@router.post("/recommend", response_model=Dict[str, Any])
async def get_recommendations(
    user_intent: str = Query(..., description="User intent or needs"),
    context: Optional[Dict[str, Any]] = None,
    language: str = Query("es", pattern="^(es|fr|en)$", description="Response language"),
    current_user: Optional[UserResponse] = Depends(get_current_user_optional)
):
    """Get AI-powered service recommendations based on user needs"""
    try:
        # Get personalized recommendations
        recommendations = await ai_service.get_recommendations(
            user_intent=user_intent,
            context=context or {},
            language=language,
            user_profile={
                "user_id": str(current_user.id) if current_user else None,
                "user_role": current_user.role.value if current_user else "guest"
            }
        )

        return {
            "recommendations": recommendations.get("services", []),
            "explanation": recommendations.get("explanation", ""),
            "confidence_scores": recommendations.get("confidence_scores", {}),
            "alternative_options": recommendations.get("alternatives", []),
            "estimated_cost": recommendations.get("estimated_cost", {}),
            "estimated_time": recommendations.get("estimated_time", {}),
            "required_documents": recommendations.get("required_documents", []),
            "next_steps": recommendations.get("next_steps", []),
            "language": language
        }

    except Exception as e:
        logger.error(f"Error getting AI recommendations: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error getting recommendations"
        )


@router.post("/analyze-document", response_model=Dict[str, Any])
async def analyze_document(
    file: UploadFile = File(..., description="Document to analyze"),
    analysis_type: str = Query("general", description="Type of analysis"),
    language: str = Query("es", pattern="^(es|fr|en)$", description="Response language"),
    current_user: Optional[UserResponse] = Depends(get_current_user_optional)
):
    """Analyze uploaded document using AI"""
    try:
        # Validate file
        if not file.filename:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No file provided"
            )

        # Check file size (max 10MB)
        file_content = await file.read()
        if len(file_content) > 10 * 1024 * 1024:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="File too large (max 10MB)"
            )

        # Analyze document
        analysis_result = await ai_service.analyze_document(
            file_content=file_content,
            filename=file.filename,
            content_type=file.content_type,
            analysis_type=analysis_type,
            language=language,
            user_context={
                "user_id": str(current_user.id) if current_user else None
            }
        )

        return {
            "analysis": analysis_result.get("analysis", {}),
            "extracted_data": analysis_result.get("extracted_data", {}),
            "document_type": analysis_result.get("document_type", "unknown"),
            "confidence": analysis_result.get("confidence", 0.0),
            "suggestions": analysis_result.get("suggestions", []),
            "required_actions": analysis_result.get("required_actions", []),
            "validation_status": analysis_result.get("validation_status", {}),
            "language": language,
            "file_info": {
                "filename": file.filename,
                "size": len(file_content),
                "type": file.content_type
            }
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error analyzing document: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error analyzing document"
        )


@router.post("/translate", response_model=Dict[str, Any])
async def translate_text(
    text: str = Query(..., description="Text to translate"),
    source_language: str = Query(..., pattern="^(es|fr|en)$", description="Source language"),
    target_language: str = Query(..., pattern="^(es|fr|en)$", description="Target language"),
    context: Optional[str] = Query(None, description="Translation context"),
    current_user: Optional[UserResponse] = Depends(get_current_user_optional)
):
    """Translate text using AI translation service"""
    try:
        if source_language == target_language:
            return {
                "translated_text": text,
                "source_language": source_language,
                "target_language": target_language,
                "confidence": 1.0,
                "alternatives": []
            }

        # Perform AI translation
        translation_result = await ai_service.translate_text(
            text=text,
            source_language=source_language,
            target_language=target_language,
            context=context
        )

        return {
            "translated_text": translation_result.get("translated_text", ""),
            "source_language": source_language,
            "target_language": target_language,
            "confidence": translation_result.get("confidence", 0.0),
            "alternatives": translation_result.get("alternatives", []),
            "detected_language": translation_result.get("detected_language", source_language),
            "translation_time": translation_result.get("translation_time", 0)
        }

    except Exception as e:
        logger.error(f"Error translating text: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error translating text"
        )


@router.post("/guide", response_model=Dict[str, Any])
async def get_guidance(
    service_id: Optional[UUID] = Query(None, description="Fiscal service ID"),
    process_type: str = Query(..., description="Type of process for guidance"),
    language: str = Query("es", pattern="^(es|fr|en)$", description="Response language"),
    current_step: Optional[int] = Query(None, description="Current step in process"),
    current_user: Optional[UserResponse] = Depends(get_current_user_optional)
):
    """Get AI-powered step-by-step guidance for fiscal processes"""
    try:
        # Get personalized guidance
        guidance = await ai_service.get_process_guidance(
            service_id=service_id,
            process_type=process_type,
            language=language,
            current_step=current_step,
            user_context={
                "user_id": str(current_user.id) if current_user else None,
                "user_role": current_user.role.value if current_user else "guest"
            }
        )

        return {
            "steps": guidance.get("steps", []),
            "current_step": guidance.get("current_step", 1),
            "total_steps": guidance.get("total_steps", 0),
            "estimated_time": guidance.get("estimated_time", {}),
            "required_documents": guidance.get("required_documents", []),
            "tips": guidance.get("tips", []),
            "common_issues": guidance.get("common_issues", []),
            "next_actions": guidance.get("next_actions", []),
            "help_resources": guidance.get("help_resources", []),
            "language": language
        }

    except Exception as e:
        logger.error(f"Error getting AI guidance: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error getting process guidance"
        )


@router.post("/validate", response_model=Dict[str, Any])
async def validate_form_data(
    form_data: Dict[str, Any] = Query(..., description="Form data to validate"),
    form_type: str = Query(..., description="Type of form"),
    language: str = Query("es", pattern="^(es|fr|en)$", description="Response language"),
    current_user: Optional[UserResponse] = Depends(get_current_user_optional)
):
    """AI-powered form validation and error correction"""
    try:
        # Validate form data using AI
        validation_result = await ai_service.validate_form_data(
            form_data=form_data,
            form_type=form_type,
            language=language
        )

        return {
            "is_valid": validation_result.get("is_valid", False),
            "errors": validation_result.get("errors", []),
            "warnings": validation_result.get("warnings", []),
            "suggestions": validation_result.get("suggestions", []),
            "corrected_data": validation_result.get("corrected_data", {}),
            "completeness_score": validation_result.get("completeness_score", 0.0),
            "required_fields": validation_result.get("required_fields", []),
            "optional_improvements": validation_result.get("optional_improvements", []),
            "language": language
        }

    except Exception as e:
        logger.error(f"Error validating form data: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error validating form data"
        )


# Admin endpoints

@router.get("/stats", response_model=Dict[str, Any])
async def get_ai_stats(
    admin_user: UserResponse = Depends(require_admin)
):
    """Get AI services usage statistics (admin only)"""
    try:
        stats = await ai_service.get_usage_stats()

        return {
            "total_interactions": stats.get("total_interactions", 0),
            "daily_usage": stats.get("daily_usage", []),
            "popular_queries": stats.get("popular_queries", []),
            "language_distribution": stats.get("language_distribution", {}),
            "feature_usage": stats.get("feature_usage", {}),
            "user_satisfaction": stats.get("user_satisfaction", {}),
            "response_times": stats.get("response_times", {}),
            "error_rates": stats.get("error_rates", {}),
            "cost_analytics": stats.get("cost_analytics", {}),
            "model_performance": stats.get("model_performance", {})
        }

    except Exception as e:
        logger.error(f"Error getting AI stats: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error retrieving AI statistics"
        )


@router.post("/feedback", response_model=Dict[str, str])
async def submit_ai_feedback(
    conversation_id: str = Query(..., description="Conversation ID"),
    rating: int = Query(..., ge=1, le=5, description="Rating (1-5)"),
    feedback: Optional[str] = Query(None, description="Optional feedback text"),
    current_user: Optional[UserResponse] = Depends(get_current_user_optional)
):
    """Submit feedback for AI interaction"""
    try:
        # Record feedback
        await ai_service.record_feedback(
            conversation_id=conversation_id,
            rating=rating,
            feedback=feedback,
            user_id=str(current_user.id) if current_user else None
        )

        return {
            "status": "success",
            "message": "Feedback recorded successfully"
        }

    except Exception as e:
        logger.error(f"Error recording AI feedback: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error recording feedback"
        )