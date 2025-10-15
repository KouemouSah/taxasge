-- ============================================
-- CHATBOT FAQ SEED DATA (MVP1 - Test Examples)
-- ============================================
-- Date: 2025-10-13
-- Description: 5 FAQ exemples pour tester le chatbot local
-- Stratégie: Patterns regex + keywords pour matching
-- ============================================

-- ============================================
-- 1. GREETING (Salutations)
-- ============================================
INSERT INTO chatbot_faq (
  id,
  question_pattern,
  intent,
  response_es,
  response_fr,
  response_en,
  follow_up_suggestions,
  actions,
  keywords,
  priority,
  is_active
) VALUES (
  'faq-greeting-001',
  '(?i)^(hola|buenos días|buenas tardes|hey|hi|hello|salut|bonjour)',
  'greeting',
  '¡Hola! Soy TaxasBot, tu asistente fiscal para Guinea Ecuatorial. 👋

Puedo ayudarte con:
• Consultar precios de servicios fiscales
• Ver procedimientos paso a paso
• Conocer documentos requeridos
• Calcular montos exactos

¿En qué puedo ayudarte hoy?',
  'Bonjour ! Je suis TaxasBot, votre assistant fiscal pour la Guinée équatoriale. 👋

Je peux vous aider avec :
• Consulter les prix des services fiscaux
• Voir les procédures étape par étape
• Connaître les documents requis
• Calculer les montants exacts

Comment puis-je vous aider aujourd''hui ?',
  'Hello! I''m TaxasBot, your tax assistant for Equatorial Guinea. 👋

I can help you with:
• Check fiscal service prices
• View step-by-step procedures
• Know required documents
• Calculate exact amounts

How can I help you today?',
  '["¿Cuánto cuesta un servicio?", "¿Qué documentos necesito?", "Ver servicios populares"]',
  '{"type": "suggestions", "items": [{"text": "Ver servicios", "action": "navigate", "screen": "Services"}]}',
  '["hola", "buenos días", "buenas tardes", "hey", "hi", "hello", "salut", "bonjour", "saludo", "greeting"]',
  10,
  1
);

-- ============================================
-- 2. GET_PRICE (Consulta de precios)
-- ============================================
INSERT INTO chatbot_faq (
  id,
  question_pattern,
  intent,
  response_es,
  response_fr,
  response_en,
  follow_up_suggestions,
  actions,
  keywords,
  priority,
  is_active
) VALUES (
  'faq-price-001',
  '(?i)(cuánto|cuanto|precio|coste|costo|cost|price|prix|combien|tarifa|tasa)',
  'get_price',
  'Para consultar el precio de un servicio fiscal, puedes:

1️⃣ **Buscar por nombre**: Usa la búsqueda principal para encontrar el servicio que necesitas.

2️⃣ **Navegar por categorías**: Explora los servicios organizados por ministerio y sector.

3️⃣ **Usar la calculadora**: Para servicios con cálculo dinámico (porcentajes, tarifas escalonadas).

📊 Contamos con **547 servicios fiscales** en nuestra base de datos.

¿Qué servicio te interesa?',
  'Pour consulter le prix d''un service fiscal, vous pouvez :

1️⃣ **Rechercher par nom** : Utilisez la recherche principale pour trouver le service dont vous avez besoin.

2️⃣ **Naviguer par catégories** : Explorez les services organisés par ministère et secteur.

3️⃣ **Utiliser la calculatrice** : Pour les services avec calcul dynamique (pourcentages, tarifs échelonnés).

📊 Nous avons **547 services fiscaux** dans notre base de données.

Quel service vous intéresse ?',
  'To check the price of a fiscal service, you can:

1️⃣ **Search by name**: Use the main search to find the service you need.

2️⃣ **Browse by categories**: Explore services organized by ministry and sector.

3️⃣ **Use the calculator**: For services with dynamic calculation (percentages, tiered rates).

📊 We have **547 fiscal services** in our database.

Which service are you interested in?',
  '["Buscar servicios", "Ver servicios populares", "Usar calculadora"]',
  '{"type": "navigate", "screen": "Search"}',
  '["cuánto", "cuanto", "precio", "coste", "costo", "cost", "price", "prix", "combien", "tarifa", "tasa", "monto", "importe"]',
  8,
  1
);

-- ============================================
-- 3. GET_PROCEDURE (Consulta de procedimientos)
-- ============================================
INSERT INTO chatbot_faq (
  id,
  question_pattern,
  intent,
  response_es,
  response_fr,
  response_en,
  follow_up_suggestions,
  actions,
  keywords,
  priority,
  is_active
) VALUES (
  'faq-procedure-001',
  '(?i)(cómo|como|procedimiento|proceso|trámite|tramite|pasos|steps|procédure|procedure)',
  'get_procedure',
  '📋 **Procedimientos Fiscales**

Para ver los pasos detallados de un trámite:

1. Busca el servicio fiscal que necesitas
2. Accede a la ficha del servicio
3. Consulta la sección "Procedimiento"

Allí encontrarás:
✅ Pasos numerados y detallados
⏱️ Tiempo estimado por paso
📍 Ubicación de las oficinas
💰 Costos adicionales (si aplican)

También puedes ver procedimientos para:
• Expedición (primera vez)
• Renovación (actualización)

¿Qué trámite necesitas realizar?',
  '📋 **Procédures Fiscales**

Pour voir les étapes détaillées d''une démarche :

1. Recherchez le service fiscal dont vous avez besoin
2. Accédez à la fiche du service
3. Consultez la section "Procédure"

Vous y trouverez :
✅ Étapes numérotées et détaillées
⏱️ Temps estimé par étape
📍 Emplacement des bureaux
💰 Coûts supplémentaires (le cas échéant)

Vous pouvez également voir les procédures pour :
• Expédition (première fois)
• Renouvellement (mise à jour)

Quelle démarche devez-vous effectuer ?',
  '📋 **Fiscal Procedures**

To see detailed steps for a procedure:

1. Search for the fiscal service you need
2. Access the service details
3. Check the "Procedure" section

There you will find:
✅ Numbered and detailed steps
⏱️ Estimated time per step
📍 Office locations
💰 Additional costs (if applicable)

You can also see procedures for:
• Expedition (first time)
• Renewal (update)

What procedure do you need to do?',
  '["Buscar servicios", "Ver documentos requeridos", "¿Cuánto tiempo toma?"]',
  '{"type": "navigate", "screen": "Services"}',
  '["cómo", "como", "procedimiento", "proceso", "trámite", "tramite", "pasos", "steps", "procédure", "procedure", "etapas", "hacer"]',
  8,
  1
);

-- ============================================
-- 4. GET_DOCUMENTS (Consulta de documentos)
-- ============================================
INSERT INTO chatbot_faq (
  id,
  question_pattern,
  intent,
  response_es,
  response_fr,
  response_en,
  follow_up_suggestions,
  actions,
  keywords,
  priority,
  is_active
) VALUES (
  'faq-documents-001',
  '(?i)(documentos|documents|papeles|requisitos|necesito|requiere|require)',
  'get_documents',
  '📄 **Documentos Requeridos**

Para cada servicio fiscal, puedes consultar:

✅ **Documentos obligatorios**
📋 Cantidad de copias necesarias
🔄 Vigencia del documento
💾 Formatos aceptados (digital/físico)

**Cómo consultarlos:**
1. Busca el servicio fiscal
2. Ve a "Documentos requeridos"
3. Filtra por: Expedición o Renovación

💡 **Tip**: Algunos documentos son comunes para varios servicios (DNI, certificado de empadronamiento).

¿Para qué servicio necesitas saber los documentos?',
  '📄 **Documents Requis**

Pour chaque service fiscal, vous pouvez consulter :

✅ **Documents obligatoires**
📋 Nombre de copies nécessaires
🔄 Validité du document
💾 Formats acceptés (numérique/physique)

**Comment les consulter :**
1. Recherchez le service fiscal
2. Allez à "Documents requis"
3. Filtrez par : Expédition ou Renouvellement

💡 **Astuce** : Certains documents sont communs à plusieurs services (DNI, certificat de résidence).

Pour quel service avez-vous besoin de connaître les documents ?',
  '📄 **Required Documents**

For each fiscal service, you can check:

✅ **Mandatory documents**
📋 Number of copies needed
🔄 Document validity
💾 Accepted formats (digital/physical)

**How to check them:**
1. Search for the fiscal service
2. Go to "Required documents"
3. Filter by: Expedition or Renewal

💡 **Tip**: Some documents are common for several services (ID, residence certificate).

For which service do you need to know the documents?',
  '["Buscar servicios", "Ver procedimientos", "Documentos comunes"]',
  '{"type": "navigate", "screen": "Services"}',
  '["documentos", "documents", "papeles", "requisitos", "necesito", "requiere", "require", "necesarios", "obligatorios"]',
  8,
  1
);

-- ============================================
-- 5. THANKS (Agradecimientos)
-- ============================================
INSERT INTO chatbot_faq (
  id,
  question_pattern,
  intent,
  response_es,
  response_fr,
  response_en,
  follow_up_suggestions,
  actions,
  keywords,
  priority,
  is_active
) VALUES (
  'faq-thanks-001',
  '(?i)(gracias|thank|merci|muchas gracias|thanks|thx)',
  'thanks',
  '¡De nada! 😊

Estoy aquí para ayudarte con cualquier consulta fiscal.

Si necesitas más información:
• Explora los servicios por categoría
• Usa la calculadora para montos exactos
• Guarda tus servicios favoritos

¿Hay algo más en lo que pueda ayudarte?',
  'De rien ! 😊

Je suis là pour vous aider avec toute question fiscale.

Si vous avez besoin de plus d''informations :
• Explorez les services par catégorie
• Utilisez la calculatrice pour les montants exacts
• Enregistrez vos services favoris

Puis-je vous aider avec autre chose ?',
  'You''re welcome! 😊

I''m here to help you with any tax query.

If you need more information:
• Explore services by category
• Use the calculator for exact amounts
• Save your favorite services

Is there anything else I can help you with?',
  '["Buscar otro servicio", "Usar calculadora", "Ver favoritos"]',
  NULL,
  '["gracias", "thank", "merci", "muchas gracias", "thanks", "thx", "agradecimiento"]',
  5,
  1
);

-- ============================================
-- END OF SEED DATA
-- ============================================
-- Total: 5 FAQ entries for testing
-- Intents covered: greeting, get_price, get_procedure, get_documents, thanks
-- Next: Add 20-30 more specific FAQs after validation
-- ============================================
