# 🔄 CORRECTIONS ROADMAP FRONTEND WEB
## Intégration Chatbot LLM + OCR/IA Formulaires

---

## 🤖 CHATBOT LLM CLOUD (NON OFFLINE)

### Architecture Chatbot Web

```bash
# PROMPT 2G-NOUVEAU : Chatbot LLM Integration Web
MISSION: Chatbot intelligent alimenté par LLM cloud
STACK TECHNOLOGIQUE:
- Frontend: Next.js + React + WebSocket
- LLM Provider: OpenAI GPT-4 ou Claude-3.5 Sonnet
- Backend: Firebase Functions + Streaming
- Cache: Redis pour conversations récentes
- Analytics: Suivi conversations et satisfaction

ARCHITECTURE:
Frontend Web ↔ Firebase Functions ↔ OpenAI/Anthropic API
                      ↕
                   Redis Cache
                      ↕
                 Analytics DB

INTERFACE CHATBOT:
┌─────────────────────────────────────┐
│ 🤖 Assistant TaxasGE                │
├─────────────────────────────────────┤
│                                     │
│ Bot: ¡Hola! Soy tu asistente fiscal │
│      para Guinée Équatoriale.       │
│      ¿En qué puedo ayudarte?        │
│                                     │
│                    User: Necesito   │
│                    renovar mi       │
│                    residencia       │
│                                     │
│ Bot: Para renovar tu tarjeta de     │
│      residencia necesitas:          │
│      • Formulario DGI-RES-001       │
│      • Pago 45,000 XAF              │
│      • Foto reciente                │
│      [📄 Ver Formulaire] [💰 Pagar] │
│                                     │
├─────────────────────────────────────┤
│ [Tapez votre message...] [Envoyer]  │
└─────────────────────────────────────┘

CAPABILITIES LLM:
1. Compréhension contextuelle multilingue (ES/FR/EN)
2. Connaissance complète 547 services fiscaux
3. Calculs automatiques avec explications
4. Navigation intelligente vers formulaires
5. Génération documents personnalisés
6. Suivi historique conversations utilisateur

IMPLEMENTATION:
// components/ChatBot.tsx
const ChatBot = () => {
  const [messages, setMessages] = useState<Message[]>([])
  const [isTyping, setIsTyping] = useState(false)
  
  const sendMessage = async (userMessage: string) => {
    // Ajouter message utilisateur
    setMessages(prev => [...prev, { role: 'user', content: userMessage }])
    setIsTyping(true)
    
    try {
      // Streaming response du backend
      const response = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: userMessage,
          conversationId: sessionId,
          context: currentTaxContext 
        })
      })
      
      // Stream la réponse LLM
      const reader = response.body?.getReader()
      let botMessage = ''
      
      while (true) {
        const { done, value } = await reader!.read()
        if (done) break
        
        const chunk = new TextDecoder().decode(value)
        botMessage += chunk
        
        // Update UI en temps réel
        setMessages(prev => [...prev.slice(0, -1), { 
          role: 'assistant', 
          content: botMessage 
        }])
      }
    } catch (error) {
      // Fallback message
    } finally {
      setIsTyping(false)
    }
  }
}

BACKEND LLM INTEGRATION:
// app/api/chat/stream/route.ts
export async function POST(request: Request) {
  const { message, conversationId, context } = await request.json()
  
  // Construction prompt avec contexte fiscal
  const systemPrompt = `Tu es l'assistant fiscal officiel de Guinée Équatoriale.
  Tu as accès à 547 services fiscaux avec leurs montants, documents et procédures.
  
  CONTEXTE FISCAL ACTUEL:
  ${JSON.stringify(context, null, 2)}
  
  DIRECTIVES:
  - Réponds uniquement sur les questions fiscales
  - Fournis montants exacts en XAF
  - Dirige vers formulaires appropriés
  - Propose actions concrètes (calculer, voir documents)
  - Sois précis et officiel dans le ton`
  
  const response = await openai.chat.completions.create({
    model: 'gpt-4-turbo',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: message }
    ],
    stream: true,
    temperature: 0.3, // Réponses plus précises
    max_tokens: 500
  })
  
  // Stream response vers frontend
  return new Response(
    new ReadableStream({
      async start(controller) {
        for await (const chunk of response) {
          const content = chunk.choices[0]?.delta?.content || ''
          controller.enqueue(new TextEncoder().encode(content))
        }
        controller.close()
      }
    })
  )
}

LIVRABLES:
- Interface chatbot web responsive
- LLM streaming integration
- Context awareness fiscal
- Actions intelligentes intégrées
ACCEPTATION:
- Réponses LLM pertinentes >90%
- Streaming temps réel fonctionnel
- Actions navigation working
- Multilingue ES/FR/EN support
```

---

## 📄 OCR/IA POUR REMPLISSAGE AUTOMATIQUE FORMULAIRES

### Fonctionnalité OCR + IA

```bash
# PROMPT 2H-NOUVEAU : OCR + IA Form Filling
MISSION: Remplissage automatique formulaires via document scanné
STACK TECHNOLOGIQUE:
- OCR: Google Cloud Vision API ou AWS Textract
- IA Processing: GPT-4 Vision ou Claude-3.5 Sonnet
- Upload: Firebase Storage
- Processing: Firebase Functions
- Validation: Backend business rules

WORKFLOW UTILISATEUR:
1. User upload document scanné (photo/PDF)
2. OCR extraction texte + structure
3. IA analyse et mapping vers champs
4. Pre-remplissage formulaire automatique
5. User validation/correction
6. Soumission formulaire complété

INTERFACE UPLOAD:
┌─────────────────────────────────────┐
│ 📄 Remplissage Automatique          │
├─────────────────────────────────────┤
│ Service: Renouvellement Résidence   │
├─────────────────────────────────────┤
│ 📷 Télécharger Document             │
│ ┌─────────────────────────────────┐ │
│ │   [📄 Drop file here or click]  │ │
│ │   Formats: PDF, JPG, PNG        │ │
│ │   Taille max: 10MB              │ │
│ └─────────────────────────────────┘ │
├─────────────────────────────────────┤
│ OU                                  │
├─────────────────────────────────────┤
│ 📷 Prendre Photo                    │
│ [Ouvrir Caméra]                     │
└─────────────────────────────────────┘

APRÈS UPLOAD + TRAITEMENT:
┌─────────────────────────────────────┐
│ ✅ Document Analysé                 │
├─────────────────────────────────────┤
│ Informations Extraites:             │
│ • Nom: SANCHEZ RIVERA Maria         │
│ • N° Résidence: RES-2024-001234     │
│ • Date expiration: 15/03/2025       │
│ • Montant dû: 45,000 XAF            │
├─────────────────────────────────────┤
│ 📋 FORMULAIRE PRE-REMPLI:          │
│                                     │
│ Nom complet: [Maria SANCHEZ RIVERA]│
│ N° Document: [RES-2024-001234]     │
│ Type service: [Renouvellement]     │
│ Montant: [45,000 XAF]             │
│                                     │
│ [✏️ Corriger] [✅ Valider]         │
└─────────────────────────────────────┘

BACKEND OCR PROCESSING:
// functions/src/ocr-processing.ts
export const processDocumentOCR = functions.storage
  .object()
  .onFinalize(async (object) => {
    const { bucket, name } = object
    
    if (!name?.includes('uploads/documents/')) return
    
    try {
      // 1. OCR avec Google Vision
      const [result] = await visionClient.textDetection({
        image: { source: { imageUri: `gs://${bucket}/${name}` } }
      })
      
      const extractedText = result.fullTextAnnotation?.text || ''
      
      // 2. Structure detection avec bounding boxes
      const blocks = result.fullTextAnnotation?.pages?.[0]?.blocks || []
      const structuredData = extractStructuredData(blocks)
      
      // 3. IA analysis avec GPT-4 Vision
      const aiAnalysis = await openai.chat.completions.create({
        model: 'gpt-4-vision-preview',
        messages: [
          {
            role: 'system',
            content: `Tu es un expert en extraction de données fiscales.
            Analyse ce document et extrais les informations pour remplir un formulaire.
            
            TYPES DOCUMENTS SUPPORTÉS:
            - Notes de validation résidence
            - Factures services fiscaux  
            - Reçus paiements DGI
            - Formulaires partiellement remplis
            
            RETOURNE JSON avec structure:
            {
              "documentType": "residence_validation",
              "extractedFields": {
                "fullName": "...",
                "documentNumber": "...",
                "serviceType": "...",
                "amount": "...",
                "expiryDate": "...",
                "issueDate": "..."
              },
              "confidence": 0.95,
              "requiredCorrections": ["field1", "field2"]
            }`
          },
          {
            role: 'user',
            content: [
              { type: 'text', text: `Texte OCR: ${extractedText}` },
              { 
                type: 'image_url', 
                image_url: { url: await getSignedUrl(bucket, name) }
              }
            ]
          }
        ],
        temperature: 0.1, // Très précis
        max_tokens: 1000
      })
      
      // 4. Parse réponse IA
      const analysis = JSON.parse(aiAnalysis.choices[0].message.content)
      
      // 5. Validation business rules
      const validatedData = await validateExtractedData(analysis)
      
      // 6. Save résultats pour frontend
      await admin.firestore()
        .collection('ocr_results')
        .doc(extractDocumentId(name))
        .set({
          originalDocument: name,
          extractedText,
          aiAnalysis: analysis,
          validatedData,
          status: 'ready',
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        })
        
    } catch (error) {
      console.error('OCR processing failed:', error)
    }
  })

VALIDATION BUSINESS RULES:
// functions/src/validation.ts
const validateExtractedData = async (analysis: any) => {
  const { documentType, extractedFields } = analysis
  
  switch (documentType) {
    case 'residence_validation':
      return validateResidenceData(extractedFields)
    case 'fiscal_receipt':
      return validateReceiptData(extractedFields)
    case 'tax_form':
      return validateTaxFormData(extractedFields)
    default:
      throw new Error('Document type not supported')
  }
}

const validateResidenceData = (fields: any) => {
  const errors = []
  
  // Validation format numéro résidence
  if (!fields.documentNumber?.match(/RES-\d{4}-\d{6}/)) {
    errors.push('Invalid residence number format')
  }
  
  // Validation montant
  if (!fields.amount || isNaN(parseFloat(fields.amount))) {
    errors.push('Invalid amount format')
  }
  
  // Validation dates
  if (fields.expiryDate && !moment(fields.expiryDate).isValid()) {
    errors.push('Invalid expiry date')
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    fields: sanitizeFields(fields)
  }
}

FRONTEND INTEGRATION:
// components/OCRFormFiller.tsx
const OCRFormFiller = ({ serviceType, onFormFilled }) => {
  const [uploading, setUploading] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [result, setResult] = useState(null)
  
  const handleFileUpload = async (file: File) => {
    setUploading(true)
    
    try {
      // 1. Upload vers Firebase Storage
      const storageRef = ref(storage, `uploads/documents/${Date.now()}_${file.name}`)
      const uploadResult = await uploadBytes(storageRef, file)
      
      // 2. Poll pour résultats OCR/IA
      const documentId = extractDocumentId(uploadResult.metadata.fullPath)
      
      setProcessing(true)
      const result = await pollForOCRResult(documentId)
      
      setResult(result)
      
      // 3. Pre-fill formulaire
      if (result.isValid) {
        onFormFilled(result.validatedData.fields)
      }
      
    } catch (error) {
      console.error('Upload failed:', error)
    } finally {
      setUploading(false)
      setProcessing(false)
    }
  }
  
  return (
    <div className="ocr-form-filler">
      <FileDropzone 
        onDrop={handleFileUpload}
        accept={['image/*', 'application/pdf']}
        maxSize={10 * 1024 * 1024} // 10MB
      />
      
      {processing && (
        <ProcessingStatus 
          message="🔍 Analyse du document en cours..."
          progress={processingProgress}
        />
      )}
      
      {result && (
        <ExtractionResult 
          data={result}
          onEdit={handleManualCorrection}
          onValidate={handleValidation}
        />
      )}
    </div>
  )
}

LIVRABLES:
- Upload interface avec drag&drop
- OCR processing backend complet
- IA analysis et extraction données
- Pre-filling formulaires automatique
- Validation et correction manuelle
ACCEPTATION:
- OCR accuracy >90% documents clairs
- IA extraction pertinence >85%
- Pre-filling automatique functional
- Correction manuelle intuitive
- Processing time < 30 secondes
```

### DASHBOARD ADMINISTRATEUR DGI

```bash
# PROMPT 3H-NOUVEAU : Dashboard Admin OCR/IA
MISSION: Interface administration pour gérer OCR et chatbot
FONCTIONNALITÉS ADMIN:
1. Monitoring conversations chatbot
2. Analyse accuracy OCR par type document
3. Validation manuelle extractions douteuses
4. Training data pour améliorer IA
5. Statistiques usage OCR/Chatbot
6. Configuration prompts et règles

DASHBOARD INTERFACE:
┌─────────────────────────────────────┐
│ 🏛️ Administration TaxasGE            │
├─────────────────────────────────────┤
│ 📊 KPIs IA/OCR                      │
│ ┌─────┐┌─────┐┌─────┐┌─────┐        │
│ │ 89% ││ 156 ││ 45  ││ 92% │        │
│ │OCR  ││Chat ││Queue││User │        │
│ │Acc. ││/day ││OCR  ││Sat. │        │
│ └─────┘└─────┘└─────┘└─────┘        │
├─────────────────────────────────────┤
│ 🤖 Conversations Chatbot            │
│ ┌─────────────────────────────────┐ │
│ │ User: Maria S. | Satisfaction: ⭐⭐⭐⭐⭐ │
│ │ Sujet: Renouvellement résidence │ │
│ │ Durée: 3min | Actions: 2       │ │
│ │ [👁️ Voir] [📊 Analyser]         │ │
│ └─────────────────────────────────┘ │
├─────────────────────────────────────┤
│ 📄 Queue Validation OCR             │
│ ┌─────────────────────────────────┐ │
│ │ ⚠️ Validation Requise            │ │
│ │ Doc: residence_note_001.pdf     │ │
│ │ Confidence: 67%                 │ │
│ │ [✅ Valider] [❌ Rejeter]        │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘

ANALYTICS OCR:
- Accuracy par type document
- Documents les plus problématiques
- Temps traitement moyen
- Corrections fréquentes
- ROI automatisation vs manuel

ANALYTICS CHATBOT:
- Satisfaction conversations
- Intents les plus demandés
- Temps résolution moyen
- Taux escalation humain
- Conversion chat → action

LIVRABLES:
- Dashboard admin complet
- Analytics IA/OCR détaillées
- Queue validation manuelle
- Configuration système IA
ACCEPTATION:
- Monitoring temps réel functional
- Analytics précises et utiles
- Workflow validation efficient
- Configuration updates immediate
```

Ces corrections intègrent les fonctionnalités manquantes critiques :

1. **Chatbot LLM Cloud** : Streaming, contextuel, multilingue avec actions intelligentes
2. **OCR + IA Form Filling** : Upload → OCR → IA Analysis → Pre-fill automatique
3. **Dashboard Admin** : Monitoring et validation manuelle des processus IA
4. **Suppression offline web** : Chatbot nécessite connexion pour LLM

L'approche est maintenant complète avec l'IA générative moderne pour l'assistance utilisateur et l'automatisation des formulaires administratifs.
