# AI Chatbot Enhancement Command

Enhance the AI-powered chatbot using RAG + Gemini 2.0 Flash following TaxasGE patterns.

## Context

**TaxasGE Chatbot** helps citizens:
- Find relevant fiscal services
- Understand tax procedures
- Get step-by-step guidance
- Answer questions in natural language
- Support 3 languages (Spanish, French, English)

## Architecture

```
User Query → Embedding → pgvector Search → Context Retrieval → Gemini Prompt → Response
```

## Instructions

1. **Read existing implementation** in `packages/backend/app/api/v1/chatbot.py`
2. **Check DATABASE_SCHEMA_REFERENCE.md** for embeddings table
3. **Review Gemini configuration** in `.env`
4. **Test with real queries** to improve accuracy

## Backend Requirements

### Environment Variables
```bash
# Google Cloud Vertex AI (Gemini)
GOOGLE_CLOUD_PROJECT=taxasge-prod
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json
VERTEX_AI_LOCATION=us-central1
GEMINI_MODEL=gemini-2.0-flash-exp
EMBEDDING_MODEL=text-embedding-004
```

### Database Schema
```sql
-- fiscal_services table with embeddings
CREATE TABLE fiscal_services (
    id UUID PRIMARY KEY,
    name_es VARCHAR(500),
    name_fr VARCHAR(500),
    name_en VARCHAR(500),
    description_es TEXT,
    description_fr TEXT,
    description_en TEXT,
    procedure_steps_es TEXT,
    procedure_steps_fr TEXT,
    procedure_steps_en TEXT,
    embedding vector(768),  -- pgvector for similarity search
    ...
);

-- chat_history table
CREATE TABLE chat_history (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    session_id UUID,
    message TEXT,
    response TEXT,
    language VARCHAR(2),
    created_at TIMESTAMP,
    metadata JSONB
);
```

### RAG Implementation
```python
# 1. Generate embedding for user query
async def generate_query_embedding(
    query: str,
    language: str = "es"
) -> List[float]:
    """
    Generate embedding for user query using Vertex AI.
    """
    from google.cloud import aiplatform

    model = aiplatform.TextEmbeddingModel.from_pretrained(
        "text-embedding-004"
    )

    embeddings = model.get_embeddings([query])
    return embeddings[0].values


# 2. Search similar services using pgvector
async def search_similar_services(
    embedding: List[float],
    language: str = "es",
    limit: int = 5,
    db = None
) -> List[dict]:
    """
    Search fiscal services using vector similarity.

    Uses pgvector <=> operator for cosine similarity.
    """
    query = f"""
        SELECT
            id,
            name_{language} as name,
            description_{language} as description,
            procedure_steps_{language} as procedure_steps,
            1 - (embedding <=> $1::vector) as similarity
        FROM fiscal_services
        WHERE embedding IS NOT NULL
        ORDER BY embedding <=> $1::vector
        LIMIT $2
    """

    results = await db.fetch(query, embedding, limit)
    return [dict(row) for row in results]


# 3. Build context from retrieved services
def build_rag_context(
    services: List[dict],
    language: str = "es"
) -> str:
    """
    Build context string from retrieved services.
    """
    context_parts = []

    for i, service in enumerate(services, 1):
        context_parts.append(f"""
Servicio {i}: {service['name']}
Descripción: {service['description']}
Procedimiento: {service['procedure_steps']}
        """.strip())

    return "\n\n".join(context_parts)


# 4. Generate response with Gemini
async def generate_chatbot_response(
    query: str,
    context: str,
    language: str = "es",
    conversation_history: List[dict] = None
) -> str:
    """
    Generate response using Gemini 2.0 Flash with RAG context.
    """
    from google.cloud import aiplatform

    # System prompt
    system_prompt = get_system_prompt(language)

    # Build conversation with context
    messages = [
        {"role": "system", "content": system_prompt},
    ]

    # Add conversation history (last 5 messages)
    if conversation_history:
        for msg in conversation_history[-5:]:
            messages.append({"role": "user", "content": msg["message"]})
            messages.append({"role": "assistant", "content": msg["response"]})

    # Add current query with RAG context
    messages.append({
        "role": "user",
        "content": f"""
Contexto de servicios fiscales relevantes:
{context}

Pregunta del usuario: {query}
        """.strip()
    })

    # Call Gemini API
    model = aiplatform.GenerativeModel("gemini-2.0-flash-exp")
    response = await model.generate_content_async(messages)

    return response.text


# Complete RAG pipeline
async def chatbot_rag_pipeline(
    query: str,
    user_id: UUID,
    session_id: UUID,
    language: str = "es",
    db = None
) -> dict:
    """
    Complete RAG pipeline for chatbot.
    """
    # 1. Generate query embedding
    query_embedding = await generate_query_embedding(query, language)

    # 2. Search similar services
    similar_services = await search_similar_services(
        query_embedding,
        language,
        limit=5,
        db=db
    )

    # 3. Build context
    context = build_rag_context(similar_services, language)

    # 4. Get conversation history
    history = await get_conversation_history(session_id, db)

    # 5. Generate response
    response = await generate_chatbot_response(
        query,
        context,
        language,
        history
    )

    # 6. Save to chat history
    await save_chat_message(
        user_id,
        session_id,
        query,
        response,
        language,
        db
    )

    return {
        "response": response,
        "sources": [s["name"] for s in similar_services],
        "language": language
    }
```

### System Prompts by Language
```python
def get_system_prompt(language: str) -> str:
    prompts = {
        "es": """
Eres un asistente virtual del sistema TaxasGE de Guinea Ecuatorial.
Tu objetivo es ayudar a los ciudadanos con sus consultas sobre servicios fiscales.

INSTRUCCIONES:
1. Responde en español claro y sencillo
2. Usa el contexto proporcionado de servicios fiscales relevantes
3. Si no sabes la respuesta, indica que el usuario contacte a soporte
4. Proporciona pasos numerados para procedimientos
5. Sé amable, profesional y conciso
6. NO inventes información que no está en el contexto
7. NO proporciones URLs externas

FORMATO DE RESPUESTA:
- Saludo breve
- Respuesta directa a la pregunta
- Pasos del procedimiento (si aplica)
- Documentos requeridos (si aplica)
- Cierre útil
        """.strip(),

        "fr": """
Vous êtes un assistant virtuel du système TaxasGE de Guinée Équatoriale.
Votre objectif est d'aider les citoyens avec leurs questions sur les services fiscaux.

INSTRUCTIONS:
1. Répondez en français clair et simple
2. Utilisez le contexte fourni des services fiscaux pertinents
3. Si vous ne savez pas la réponse, indiquez de contacter le support
4. Fournissez des étapes numérotées pour les procédures
5. Soyez aimable, professionnel et concis
6. N'inventez PAS d'informations qui ne sont pas dans le contexte
7. Ne fournissez PAS d'URLs externes
        """.strip(),

        "en": """
You are a virtual assistant for the TaxasGE system of Equatorial Guinea.
Your goal is to help citizens with their fiscal services queries.

INSTRUCTIONS:
1. Respond in clear and simple English
2. Use the provided context of relevant fiscal services
3. If you don't know the answer, indicate to contact support
4. Provide numbered steps for procedures
5. Be friendly, professional, and concise
6. DO NOT invent information not in the context
7. DO NOT provide external URLs
        """.strip()
    }

    return prompts.get(language, prompts["es"])
```

## Frontend Requirements

### Chatbot UI Component
```typescript
// packages/web/src/modules/chatbot/components/ChatWindow.tsx
interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: string[];
  timestamp: Date;
}

function ChatWindow() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { mutate: sendMessage } = useMutation({
    mutationFn: (query: string) => api.chatbot.send({
      query,
      language: currentLanguage,
      session_id: sessionId
    }),
    onSuccess: (data) => {
      setMessages(prev => [...prev, {
        id: uuid(),
        role: 'assistant',
        content: data.response,
        sources: data.sources,
        timestamp: new Date()
      }]);
    }
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    // Add user message
    setMessages(prev => [...prev, {
      id: uuid(),
      role: 'user',
      content: input,
      timestamp: new Date()
    }]);

    // Send to API
    sendMessage(input);
    setInput('');
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages list */}
      <ScrollArea className="flex-1 p-4">
        {messages.map(msg => (
          <MessageItem key={msg.id} message={msg} />
        ))}
        {isLoading && <TypingIndicator />}
      </ScrollArea>

      {/* Input form */}
      <form onSubmit={handleSubmit} className="p-4 border-t">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t('chatbot.placeholder')}
            disabled={isLoading}
          />
          <Button type="submit" disabled={isLoading || !input.trim()}>
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </form>
    </div>
  );
}
```

### Message Rendering
```typescript
function MessageItem({ message }: { message: Message }) {
  const isUser = message.role === 'user';

  return (
    <div className={cn(
      "mb-4 flex",
      isUser ? "justify-end" : "justify-start"
    )}>
      <div className={cn(
        "max-w-[80%] rounded-lg p-3",
        isUser
          ? "bg-primary text-primary-foreground"
          : "bg-muted"
      )}>
        <Markdown>{message.content}</Markdown>

        {/* Show sources for assistant messages */}
        {!isUser && message.sources && message.sources.length > 0 && (
          <div className="mt-2 pt-2 border-t text-xs opacity-70">
            <p className="font-semibold">Fuentes:</p>
            <ul className="list-disc list-inside">
              {message.sources.map((source, i) => (
                <li key={i}>{source}</li>
              ))}
            </ul>
          </div>
        )}

        <p className="text-xs opacity-50 mt-1">
          {formatTime(message.timestamp)}
        </p>
      </div>
    </div>
  );
}
```

## Improvements

### 1. Multi-turn Conversation
- Maintain conversation context (last 5 messages)
- Reference previous questions/answers
- Session management

### 2. Quick Replies / Suggested Questions
```typescript
const suggestedQuestions = {
  es: [
    "¿Cómo declaro el IVA?",
    "¿Qué documentos necesito para el IRPF?",
    "¿Cómo puedo pagar mis impuestos?",
    "¿Cuánto tiempo tarda la validación?"
  ],
  fr: [...],
  en: [...]
};
```

### 3. Feedback Collection
```typescript
// After each response, allow user to rate
<div className="flex gap-2 mt-2">
  <Button size="sm" variant="ghost" onClick={() => rateResponse('helpful')}>
    👍 Útil
  </Button>
  <Button size="sm" variant="ghost" onClick={() => rateResponse('not_helpful')}>
    👎 No útil
  </Button>
</div>
```

### 4. Fallback to Human Agent
```typescript
// If chatbot can't help, offer agent escalation
if (confidence < 0.5) {
  return {
    response: "Lo siento, no tengo suficiente información. ¿Desea contactar con un agente?",
    actions: ["contact_agent"]
  };
}
```

## Checklist

- [ ] Vertex AI credentials configured
- [ ] Embeddings generated for all services
- [ ] pgvector extension enabled in PostgreSQL
- [ ] RAG pipeline implemented
- [ ] Gemini API integration completed
- [ ] System prompts for 3 languages created
- [ ] Conversation history tracking added
- [ ] Frontend chat UI implemented
- [ ] Message rendering with markdown support
- [ ] Sources display for transparency
- [ ] Suggested questions added
- [ ] Feedback mechanism implemented
- [ ] Error handling for API failures
- [ ] Rate limiting added
- [ ] Tests written
- [ ] Performance optimized (response time <3s)
