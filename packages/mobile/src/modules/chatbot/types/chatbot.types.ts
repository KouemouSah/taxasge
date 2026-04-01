/**
 * Chatbot types — aligned with backend ChatRequest/ChatResponse
 * Backend: app/modules/chatbot/models/chatbot.py
 */

export interface ChatMessage {
  id: string;
  text: string;
  isBot: boolean;
  timestamp: Date;
  suggestions?: string[];
  relatedServices?: RelatedService[];
}

export interface RelatedService {
  id: number;
  name: string;
  service_code?: string;
}

export interface ChatRequest {
  message: string;
  conversation_id?: string;
  language: 'es' | 'fr' | 'en';
  context?: Record<string, unknown>;
  history?: Array<{ role: 'user' | 'assistant'; content: string }>;
}

export interface ChatResponse {
  response: string;
  conversation_id: string;
  suggestions: string[];
  related_services: Array<{ id: number; name: string; service_code?: string }>;
  follow_up_actions: string[];
  confidence: number;
  response_time: number;
  language: string;
  timestamp: string;
}
