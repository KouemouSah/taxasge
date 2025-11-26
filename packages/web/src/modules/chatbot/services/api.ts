/**
 * Chatbot API Service
 * Handles all API calls for RAG-powered AI chatbot
 *
 * @module chatbot/services
 * @author Claude Code
 * @date 2025-11-26
 *
 * BACKEND ALIGNMENT: Phase Chatbot
 * Base URL: /api/v1/chatbot
 * Backend: packages/backend/app/modules/chatbot/api/chatbot_routes.py
 *
 * Features:
 * - Interactive chat with Gemini AI
 * - Real-time streaming (SSE)
 * - Semantic search over fiscal services
 * - Service recommendations
 * - Feedback system
 */

import type {
  ChatRequest,
  ChatResponse,
  AISearchRequest,
  AISearchResponse,
  RecommendationRequest,
  RecommendationResponse,
  GuidanceRequest,
  GuidanceResponse,
  FeedbackSubmission,
  FeedbackResponse,
  ChatbotStats,
  StreamChunk,
  LanguageCode,
  toCamelCase,
  toSnakeCase,
} from '@/types/chatbot'

// =============================================================================
// CONFIGURATION
// =============================================================================

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
const API_VERSION = '/api/v1'
const CHATBOT_BASE = '/chatbot'

// =============================================================================
// HTTP CLIENT
// =============================================================================

class ChatbotApiClient {
  private baseUrl: string

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`

    const token = typeof window !== 'undefined'
      ? localStorage.getItem('auth_token')
      : null

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    if (options.headers) {
      const headersToMerge = options.headers instanceof Headers
        ? Object.fromEntries(options.headers.entries())
        : Array.isArray(options.headers)
        ? Object.fromEntries(options.headers)
        : options.headers
      Object.assign(headers, headersToMerge)
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({
          message: `HTTP error! status: ${response.status}`,
        }))
        throw new Error(error.message || error.detail || `HTTP error! status: ${response.status}`)
      }

      return response.json()
    } catch (error) {
      if (error instanceof Error) {
        throw error
      }
      throw new Error('Unknown error occurred')
    }
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' })
  }

  async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    })
  }
}

const client = new ChatbotApiClient(`${API_BASE_URL}${API_VERSION}${CHATBOT_BASE}`)

// =============================================================================
// CHATBOT API
// =============================================================================

export const chatbotApi = {
  /**
   * POST /api/v1/chatbot/chat
   * Interactive chat with RAG support
   */
  chat: async (request: ChatRequest): Promise<ChatResponse> => {
    // Convert camelCase to snake_case for backend
    const backendRequest = {
      message: request.message,
      conversation_id: request.conversationId,
      language: request.language,
      context: request.context,
    }

    const response = await client.post<any>('/chat', backendRequest)

    // Convert snake_case response to camelCase
    return {
      response: response.response,
      conversationId: response.conversation_id,
      suggestions: response.suggestions || [],
      relatedServices: (response.related_services || []).map((service: any) => ({
        serviceCode: service.service_code,
        name: service.name,
        category: service.category,
        similarity: service.similarity,
        ministryCode: service.ministry_code,
        sectorCode: service.sector_code,
      })),
      followUpActions: response.follow_up_actions || [],
      confidence: response.confidence,
      responseTime: response.response_time,
      language: response.language,
      timestamp: response.timestamp,
      sources: response.sources,
      model: response.model,
    }
  },

  /**
   * POST /api/v1/chatbot/chat/stream
   * Streaming chat with Server-Sent Events (SSE)
   */
  chatStream: async function* (
    message: string,
    conversationId?: string,
    language: LanguageCode = 'es'
  ): AsyncGenerator<StreamChunk, void, unknown> {
    const token = typeof window !== 'undefined'
      ? localStorage.getItem('auth_token')
      : null

    const params = new URLSearchParams({
      message,
      language,
      ...(conversationId && { conversation_id: conversationId }),
    })

    const response = await fetch(
      `${API_BASE_URL}${API_VERSION}${CHATBOT_BASE}/chat/stream?${params}`,
      {
        method: 'POST',
        headers: {
          Accept: 'text/event-stream',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      }
    )

    if (!response.ok) {
      throw new Error(`Stream error: ${response.statusText}`)
    }

    const reader = response.body?.getReader()
    const decoder = new TextDecoder()

    if (!reader) {
      throw new Error('No response body')
    }

    try {
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')

        // Keep the last incomplete line in buffer
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))
              yield data as StreamChunk
            } catch (e) {
              console.error('Failed to parse SSE data:', e)
            }
          }
        }
      }
    } finally {
      reader.releaseLock()
    }
  },

  /**
   * POST /api/v1/chatbot/search
   * AI-powered semantic search
   */
  search: async (request: AISearchRequest): Promise<AISearchResponse> => {
    const backendRequest = {
      query: request.query,
      language: request.language,
      filters: request.filters,
      limit: request.limit,
    }

    const response = await client.post<any>('/search', backendRequest)

    return {
      results: response.results || [],
      total: response.total,
      queryUnderstanding: response.query_understanding,
      searchIntent: response.search_intent,
      suggestions: response.suggestions || [],
      relatedTopics: response.related_topics || [],
      semanticMatches: (response.semantic_matches || []).map((match: any) => ({
        serviceCode: match.service_code,
        serviceName: match.service_name,
        similarity: match.similarity,
        category: match.category,
        description: match.description,
      })),
      language: response.language,
      responseTime: response.response_time,
    }
  },

  /**
   * POST /api/v1/chatbot/recommend
   * Get service recommendations
   */
  getRecommendations: async (
    request: RecommendationRequest
  ): Promise<RecommendationResponse> => {
    const backendRequest = {
      user_intent: request.userIntent,
      context: request.context,
      language: request.language,
    }

    const response = await client.post<any>('/recommend', backendRequest)

    return {
      recommendations: response.recommendations || [],
      explanation: response.explanation,
      confidenceScores: response.confidence_scores || {},
      alternativeOptions: response.alternative_options || [],
      estimatedCost: response.estimated_cost,
      estimatedTime: response.estimated_time,
      requiredDocuments: response.required_documents || [],
      nextSteps: response.next_steps || [],
      language: response.language,
    }
  },

  /**
   * POST /api/v1/chatbot/guide
   * Get step-by-step guidance
   */
  getGuidance: async (request: GuidanceRequest): Promise<GuidanceResponse> => {
    const backendRequest = {
      service_id: request.serviceId,
      process_type: request.processType,
      user_context: request.userContext,
      language: request.language,
    }

    const response = await client.post<any>('/guide', backendRequest)

    return {
      steps: (response.steps || []).map((step: any) => ({
        stepNumber: step.step_number,
        title: step.title,
        description: step.description,
        estimatedTime: step.estimated_time,
        requiredDocuments: step.required_documents,
        tips: step.tips,
      })),
      totalEstimatedTime: response.total_estimated_time,
      importantNotes: response.important_notes || [],
      commonMistakes: response.common_mistakes || [],
      language: response.language,
    }
  },

  /**
   * POST /api/v1/chatbot/feedback
   * Submit user feedback
   */
  submitFeedback: async (
    feedback: FeedbackSubmission
  ): Promise<FeedbackResponse> => {
    const backendRequest = {
      conversation_id: feedback.conversationId,
      rating: feedback.rating,
      feedback: feedback.feedback,
      timestamp: feedback.timestamp || new Date().toISOString(),
    }

    return client.post<FeedbackResponse>('/feedback', backendRequest)
  },

  /**
   * GET /api/v1/chatbot/stats
   * Get chatbot statistics (admin only)
   */
  getStats: async (): Promise<ChatbotStats> => {
    const response = await client.get<any>('/stats')

    return {
      totalConversations: response.total_conversations,
      totalMessages: response.total_messages,
      averageResponseTime: response.average_response_time,
      satisfactionRating: response.satisfaction_rating,
      topQueries: (response.top_queries || []).map((q: any) => ({
        query: q.query,
        count: q.count,
      })),
      languageDistribution: response.language_distribution || {},
      servicesRecommended: (response.services_recommended || []).map((s: any) => ({
        serviceCode: s.service_code,
        count: s.count,
      })),
    }
  },

  /**
   * GET /api/v1/chatbot/
   * Get API information
   */
  getInfo: async (): Promise<any> => {
    return client.get('/')
  },
}

// =============================================================================
// EXPORTS
// =============================================================================

export default chatbotApi
