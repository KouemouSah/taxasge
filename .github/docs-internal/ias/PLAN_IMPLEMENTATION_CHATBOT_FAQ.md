# Plan Complet d'Implémentation du Chatbot FAQ - TaxasGE Mobile

**Date**: 2025-11-07
**Statut**: Analyse Critique COMPLÈTE avant implémentation
**Objectif**: Générer 60 FAQs basées sur DONNÉES RÉELLES avec gestion RIGOUREUSE de tous les cas

---

## 📊 I. ANALYSE CRITIQUE DES DONNÉES RÉELLES

### 1.1 Types de Services Identifiés (846 services analysés)

| Type de Calcul | Nombre | % | Gestion |
|----------------|---------|---|---------|
| **fixed_expedition** | 841 | 99.4% | Prix fixes (tasa_expedicion + tasa_renovacion) |
| **percentage_based** | 4 | 0.5% | Pourcentage (base_percentage) |
| **formula_based** | 1 | 0.1% | Formule mathématique (expedition_formula) |

### 1.2 Services Percentage-Based (4 services)

```
T-651: Reconocimiento y comprobación de calidad, higiene del medio ambiente
       base_percentage: 0.2000 (20%)

T-652: Inspección técnica
       base_percentage: 0.2000 (20%)

T-654: Buque de línea no regular
       base_percentage: 0.0200 (2%)

T-734: Reconocimiento y comprobación del funcionamiento
       base_percentage: null (NON DÉFINI)
```

### 1.3 Service Formula-Based (1 service)

```
T-646: Canon anual de concesiones
       expedition_formula: "RF + (t * CA)"
       Variables:
         - RF: Redevance Fixe (non défini dans DB)
         - t: Taux (non défini)
         - CA: Chiffre d'Affaires (user input)
```

### 1.4 Structure des Données Validée

**Documents** (split par virgule):
```typescript
document_name_es: "Documento de identidad, Fotografía"
→ Split en: ["Documento de identidad", "Fotografía"]
```

**Procédures** (avec étapes):
```typescript
procedures: [{
  template_id: 1602,
  name_es: "Procedimiento presentar (4 pasos)",
  procedure_steps: [
    { step_number: 1, description_es: "Presentar documentación" },
    { step_number: 2, description_es: "Completar formulario" },
    { step_number: 3, description_es: "Pagar tasa" },
    { step_number: 4, description_es: "Recoger pasaporte" }
  ]
}]
```

**Délais** (processing_time_days):
- ⚠️ **TOUS à 1 jour** (valeur par défaut, non fiable)
- ❌ **NE PAS AFFICHER** dans les FAQs

---

## 📋 II. FONCTIONNALITÉS COMPLÈTES DU CHATBOT

### 2.1 Intentions Supportées (8 intents)

| Intent | Description | Exemples de questions | Workflow |
|--------|-------------|----------------------|----------|
| **greeting** | Salutations | "Hola", "Buenos días" | Réponse accueil + suggestions |
| **thanks** | Remerciements | "Gracias", "Merci" | Réponse courtoisie + suggestions |
| **get_price** | Consulter prix | "¿Cuánto cuesta el pasaporte?" | Recherche service → Prix |
| **get_procedure** | Consulter procédure | "¿Cómo obtengo un pasaporte?" | Recherche service → Procédures |
| **get_documents** | Consulter documents | "¿Qué documentos necesito?" | Recherche service → Documents |
| **get_general_info** | Info générale | "Info sobre pasaporte" | Recherche service → Info complète |
| **calculate** | Utiliser calculatrice | "Calcular tasa" | Navigation vers calculatrice |
| **search_service** | Rechercher service | "Buscar licencia" | Liste de services filtrés |

### 2.2 Actions du Chatbot (5 types)

| Action Type | Description | Paramètres | Exemple |
|-------------|-------------|------------|---------|
| **navigate** | Naviguer vers écran | screen, params | Aller vers ServiceDetail |
| **search** | Recherche services | query, filters | Filtrer par "pasaporte" |
| **calculate** | Ouvrir calculatrice | serviceId | Calculer T-646 (formula) |
| **suggestions** | Afficher suggestions | items[] | "Buscar servicios", "Ver populares" |
| **external_link** | Lien externe | url | URL ministère (future) |

### 2.3 Format de Réponse FAQ

**Pour services à prix fixes** (99.4% des cas):
```markdown
📋 **{name_es}**

🏛️ **Ministerio responsable:**
{ministry_name_es}

💰 **Tarifas:**
• Expedición: {tasa_expedicion} XAF
• Renovación: {tasa_renovacion} XAF  (SI > 0)

📄 **Documentos Requeridos - Expedición:**
1. {documento_1}
2. {documento_2}
...

📝 **Procedimientos - Expedición y Renovación:**
1. {paso_1}
2. {paso_2}
...

Duración estimada: —
Localización: —
Horas de apertura: Lun-Ven : 08h - 16h
```

**Pour services percentage_based** (0.5% des cas):
```markdown
📋 **{name_es}**

🏛️ **Ministerio responsable:**
{ministry_name_es}

💰 **Método de Cálculo:**
• Porcentaje: {base_percentage * 100}%
• Base de cálculo: {percentage_of ou "A determinar según valor del bien"}

📄 **Documentos Requeridos:**
...
📝 **Procedimientos:**
...
```

**Pour services formula_based** (0.1% des cas):
```markdown
📋 **{name_es}**

🏛️ **Ministerio responsable:**
{ministry_name_es}

💰 **Fórmula de Cálculo:**
{expedition_formula}

Variables:
• RF: Redevance Fixe
• t: Taux applicable
• CA: Chiffre d'Affaires

📄 **Documentos Requeridos:**
...
📝 **Procedimientos:**
...
```

---

## 🔄 III. WORKFLOWS DÉTAILLÉS

### 3.1 Workflow Principal: Traitement Message Utilisateur

```
┌─────────────────────────────────────┐
│ 1. User envoie message              │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│ 2. Normalisation texte               │
│    - Lowercase                       │
│    - Trim                            │
│    - Remove accents                  │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│ 3. Détection Intent                  │
│    - Match regex patterns (FAQ)      │
│    - Score de confiance (0-1)        │
│    - Fallback si score < 0.5         │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│ 4. Extraction Entités                │
│    - Service keywords (pasaporte)    │
│    - Amounts (1000 XAF)              │
│    - Types (expedición/renovación)   │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│ 5. Génération Réponse                │
│    - Get FAQ matched                 │
│    - Inject dynamic data             │
│    - Generate suggestions            │
│    - Add actions                     │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│ 6. Display Response                  │
│    - Message bot                     │
│    - Quick replies (suggestions)     │
│    - Action buttons                  │
└─────────────────────────────────────┘
```

### 3.2 Workflow: Recherche Service Dynamique

Cas d'usage : "¿Cuánto cuesta el pasaporte?"

```
┌─────────────────────────────────────┐
│ Intent détecté: get_price            │
│ Entité: serviceKeyword = "pasaporte" │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│ Recherche dans fiscal_services       │
│ WHERE name_es LIKE '%pasaporte%'     │
└──────────────┬──────────────────────┘
               │
               ▼
        ┌──────┴──────┐
        │             │
        ▼             ▼
   ┌─────────┐   ┌─────────┐
   │ 1 Match │   │Multiple │
   └────┬────┘   │ Matches │
        │        └────┬────┘
        │             │
        ▼             ▼
┌─────────────┐  ┌──────────────┐
│Display Full │  │Display List  │
│Service Info │  │with options  │
│(ministry,   │  │"Encontré N   │
│ docs, proc) │  │ servicios:"  │
└─────────────┘  └──────────────┘
                        │
                        ▼
                 ┌──────────────┐
                 │User selects  │
                 │→ Show detail │
                 └──────────────┘
```

### 3.3 Workflow: Services avec Formules/Pourcentages

Cas: "¿Cuánto cuesta T-646?"

```
┌─────────────────────────────────────┐
│ Service trouvé: T-646                │
│ calculation_method: formula_based    │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│ Check calculation_method             │
└──────────────┬──────────────────────┘
               │
        ┌──────┴──────┬────────────────┐
        │             │                │
        ▼             ▼                ▼
┌──────────────┐ ┌─────────────┐ ┌──────────────┐
│fixed_        │ │percentage_  │ │formula_based │
│expedition    │ │based        │ │              │
└──────┬───────┘ └──────┬──────┘ └──────┬───────┘
       │                │                │
       ▼                ▼                ▼
┌──────────────┐ ┌─────────────┐ ┌──────────────┐
│Display:      │ │Display:     │ │Display:      │
│Expedición:   │ │Porcentaje:  │ │Fórmula:      │
│7.500 XAF     │ │20%          │ │RF+(t*CA)     │
│Renovación:   │ │Base: valor  │ │              │
│5.000 XAF     │ │del bien     │ │Action:       │
│              │ │             │ │→ Calculator  │
└──────────────┘ └─────────────┘ └──────────────┘
```

---

## 🎯 IV. PLAN D'IMPLÉMENTATION RIGOUREUX

### 4.1 Répartition des 60 FAQs

| Type | Nombre | Description | Source de Données |
|------|--------|-------------|-------------------|
| **Service FAQs** | 30 | Top 30 services enrichis | `top_30_complete.json` |
| **Category FAQs** | 15 | Groupes de services | Grouper par `category_name_es` |
| **Procedural FAQs** | 15 | Questions procédurales | Hardcoded (paiement, suivi, contact) |

### 4.2 Service FAQs (30) - Gestion des 3 Types

**A. Services à Prix Fixes (29/30)**

Template:
```typescript
{
  id: "faq-service-{service_code}",
  question_pattern: "({keywords_regex})",
  intent: "get_general_info",
  response_es: `
📋 **{name_es}**

🏛️ **Ministerio responsable:**
{ministry_name_es}

💰 **Tarifas:**
• Expedición: {formatAmount(tasa_expedicion)} XAF
${tasa_renovacion > 0 ? `• Renovación: ${formatAmount(tasa_renovacion)} XAF` : ''}

📄 **Documentos Requeridos - Expedición:**
${documents.map((d, i) => `${i+1}. ${d}`).join('\n')}

📝 **Procedimientos - Expedición y Renovación:**
${steps.map((s, i) => `${i+1}. ${s.description_es}`).join('\n')}

Duración estimada: —
Localización: —
Horas de apertura: Lun-Ven : 08h - 16h
  `,
  response_fr: "...",  // Via entity_translations
  response_en: "...",  // Via entity_translations
  keywords: JSON.stringify(extractedKeywords),
  priority: calculatePriority(service),
}
```

**B. Service Percentage-Based (1/30) - T-651**

Template modifié:
```typescript
{
  id: "faq-service-T-651",
  question_pattern: "(reconocimiento|calidad|higiene|medio ambiente)",
  intent: "get_general_info",
  response_es: `
📋 **Reconocimiento y comprobación de calidad, higiene del medio ambiente**

🏛️ **Ministerio responsable:**
{ministry_name_es}

💰 **Método de Cálculo:**
• Porcentaje: 20%
• Base de cálculo: Según valor del servicio solicitado

📄 **Documentos Requeridos:**
${documents...}

📝 **Procedimientos:**
${procedures...}

⚠️ Para calcular el monto exacto, use la calculadora con el valor específico.
  `,
  actions: JSON.stringify({
    type: "calculate",
    screen: "Calculator",
    params: { serviceId: service.id }
  }),
}
```

**C. Service Formula-Based (0/30)**

Note: T-646 n'est PAS dans le Top 30 (score trop faible).
Si besoin futur, template:
```typescript
{
  id: "faq-service-T-646",
  response_es: `
📋 **Canon anual de concesiones**

💰 **Fórmula de Cálculo:**
RF + (t × CA)

**Variables:**
• RF: Redevance Fixe
• t: Taux applicable
• CA: Chiffre d'Affaires (annuel)

⚠️ Utilice la calculadora para obtener el monto exacto.
  `,
  actions: JSON.stringify({
    type: "calculate",
    ...
  }),
}
```

### 4.3 Category FAQs (15)

Grouper les services par catégorie et fournir navigation:

```typescript
{
  id: "faq-category-servicio-consular",
  question_pattern: "(servicios consulares|consulado|embajada)",
  intent: "get_general_info",
  response_es: `
📂 **SERVICIO CONSULAR**

Servicios disponibles:
1. Pasaporte (7.500 XAF)
2. Legalización de Documentos (2.000 XAF)
3. Carnet Consular (5.000 XAF)

¿Qué servicio te interesa?
  `,
  follow_up_suggestions: JSON.stringify([
    "Info sobre pasaporte",
    "Legalización de documentos",
    "Buscar otro servicio"
  ]),
  actions: JSON.stringify({
    type: "suggestions",
    items: [
      { text: "Pasaporte", action: "navigate", screen: "ServiceDetail", params: { serviceId: 12 }},
      { text: "Legalización", action: "navigate", screen: "ServiceDetail", params: { serviceId: 8 }},
    ]
  }),
}
```

### 4.4 Procedural FAQs (15)

Questions générales NON liées à des services spécifiques:

```typescript
// 1. Paiement
{
  id: "faq-proc-payment",
  question_pattern: "(cómo pagar|métodos de pago|dónde pagar)",
  intent: "get_general_info",
  response_es: `
💳 **Métodos de Pago**

Puede pagar las tasas fiscales en:
• Bancos autorizados
• Oficinas del ministerio correspondiente

Métodos aceptados:
• Efectivo (FCFA)
• Transferencia bancaria

📍 Consulte las oficinas específicas para cada servicio.
  `,
}

// 2. Suivi
{
  id: "faq-proc-tracking",
  question_pattern: "(seguir|rastrear|estado|progreso|seguimiento)",
  intent: "get_general_info",
  response_es: `
📊 **Seguimiento de Trámites**

Para conocer el estado de su trámite:
1. Contacte directamente con el ministerio
2. Presente su número de expediente
3. Horario: Lun-Ven 08h - 16h

🏛️ Los plazos varían según el tipo de servicio.
  `,
}

// 3-15: Autres questions (horaires, contact, documents communs, etc.)
```

### 4.5 Extraction des Traductions (FR/EN)

Pour chaque service, extraire les traductions via `entity_translations`:

```sql
SELECT
  et_name.translation AS name_fr,
  et_desc.translation AS description_fr
FROM fiscal_services fs
LEFT JOIN entity_translations et_name
  ON et_name.entity_type = 'fiscal_service'
  AND et_name.entity_id = fs.id
  AND et_name.field_name = 'name'
  AND et_name.language = 'fr'
LEFT JOIN entity_translations et_desc
  ON et_desc.entity_type = 'fiscal_service'
  AND et_desc.entity_id = fs.id
  AND et_desc.field_name = 'description'
  AND et_desc.language = 'fr'
WHERE fs.id = ?
```

### 4.6 Génération des Keywords

Extraire automatiquement depuis:
```typescript
function extractKeywords(service: EnrichedService): string[] {
  const keywords = new Set<string>();

  // Mots du nom du service
  const nameWords = service.name_es
    .toLowerCase()
    .split(/\s+/)
    .filter(w => w.length > 3 && !STOP_WORDS.includes(w));
  nameWords.forEach(w => keywords.add(w));

  // Code du service
  keywords.add(service.service_code.toLowerCase());

  // Catégorie
  if (service.category_name_es) {
    keywords.add(service.category_name_es.toLowerCase());
  }

  // Documents (extraits)
  service.required_documents_enriched.forEach(doc => {
    const docWords = doc.template_details.document_name_es
      .split(',')
      .map(d => d.trim().toLowerCase());
    docWords.forEach(w => keywords.add(w));
  });

  return Array.from(keywords).slice(0, 10); // Max 10 keywords
}
```

### 4.7 Calcul de Priorité

```typescript
function calculatePriority(service: EnrichedService): number {
  let priority = 5; // Base

  // +3 si coût élevé (> 100,000 XAF) → Services importants
  if (service.tasa_expedicion > 100000) priority += 3;

  // +2 si ministère majeur
  const majorMinistries = [
    'MINISTERIO DE ASUNTOS EXTERIORES',
    'MINISTERIO DE HACIENDA',
    'MINISTERIO DE JUSTICIA'
  ];
  if (majorMinistries.some(m => service.ministry_name_es?.includes(m))) {
    priority += 2;
  }

  // +1 si beaucoup de documents (> 3)
  if (service.required_documents_enriched.length > 3) priority += 1;

  // +1 si procédure longue (> 5 steps)
  const totalSteps = service.procedures.reduce((sum, p) => sum + p.procedure_steps.length, 0);
  if (totalSteps > 5) priority += 1;

  return Math.min(priority, 10); // Max 10
}
```

---

## ⚠️ V. POINTS CRITIQUES ET DÉCISIONS

### 5.1 processing_time_days - NE PAS AFFICHER

**Raison**: TOUS les services ont 1 jour (valeur par défaut non fiable)

**Solution**:
- ❌ Ne pas mentionner de délai spécifique
- ✅ Afficher "Duración estimada: —"
- ✅ Dire "Consulte con el ministerio para plazos exactos"

### 5.2 Documents Split par Virgule

**Implémentation**: Comme ServiceDetailScreen.tsx (lignes 152-191)

```typescript
const documentParts = documentName.split(',').map(d => d.trim());
documentParts.forEach((part, index) => {
  const cleaned = part
    .replace(/^[-\s]+/, '')
    .replace(/^\d+[\.\-]\s*/, '')
    .trim();

  response += `${index + 1}. ${cleaned}\n`;
});
```

### 5.3 Horaires par Défaut

**Tous les services**: `"Lun-Ven : 08h - 16h"`
(Comme ServiceDetailScreen.tsx ligne 381)

### 5.4 Services sans Documents/Procédures

**Gestion**:
```typescript
if (service.required_documents_enriched.length === 0) {
  response += "📄 **Documentos Requeridos:**\nConsulte con el ministerio correspondiente.\n\n";
}

if (service.procedures.length === 0) {
  response += "📝 **Procedimientos:**\nConsulte con el ministerio correspondiente.\n\n";
}
```

### 5.5 Multilingue (FR/EN)

**Priorité MVP1**:
- ✅ Espagnol (ES) - Complet avec données réelles
- ⏳ Français (FR) - Via entity_translations (si disponible)
- ⏳ Anglais (EN) - Via entity_translations (si disponible)

**Fallback**: Si traduction manquante, utiliser ES avec note:
```
"[ES] {contenido en español}"
```

---

## 📁 VI. FICHIERS À GÉNÉRER

### 6.1 Script de Génération

**Fichier**: `packages/mobile/scripts/generate_faqs_real_data.py`

**Inputs**:
- `supabase-analysis/complete-enriched/top_30_complete.json`
- `supabase-analysis/enriched/categories.json`
- Hardcoded procedural FAQs

**Outputs**:
- `packages/mobile/src/database/seed/generated-faqs-v2.ts` (TypeScript)
- `packages/mobile/src/database/seed/generated-faqs-v2.sql` (SQL)

### 6.2 Format Output TypeScript

```typescript
export const GENERATED_FAQS_V2: Omit<ChatbotFAQ, 'created_at' | 'updated_at'>[] = [
  {
    id: "faq-service-T-005",
    question_pattern: "(pasaporte|passport|passeport|adquisición pasaporte)",
    intent: "get_general_info",
    response_es: "...",
    response_fr: null,
    response_en: null,
    follow_up_suggestions: JSON.stringify([...]),
    actions: JSON.stringify({...}),
    keywords: JSON.stringify([...]),
    priority: 8,
    is_active: 1,
  },
  // ... 59 more FAQs
];
```

### 6.3 Format Output SQL

```sql
-- Generated FAQs v2 - Real Data from Supabase
-- Date: 2025-11-07
-- Source: Top 30 enriched services + Categories + Procedural

INSERT INTO chatbot_faqs (
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
) VALUES
  ('faq-service-T-005', '(...)', 'get_general_info', '...', NULL, NULL, '[...]', '{...}', '[...]', 8, 1),
  ...
;
```

---

## ✅ VII. VALIDATION ET TESTS

### 7.1 Tests à Effectuer

1. **Validation Data**:
   - ✅ Tous les services ont ministry_name_es
   - ✅ Documents splités correctement
   - ✅ Procédures avec toutes les étapes
   - ✅ Gestion des 3 types de calcul

2. **Tests Intent Matching**:
   - Test "¿Cuánto cuesta el pasaporte?" → get_price + T-005
   - Test "Documentos para pasaporte" → get_documents + T-005
   - Test "Legalización documentos" → get_general_info + T-001

3. **Tests Multilingual**:
   - ES: Réponse complète
   - FR: Fallback si traduction manquante
   - EN: Fallback si traduction manquante

4. **Tests Actions**:
   - navigate: Vers ServiceDetail avec serviceId
   - calculate: Ouvrir Calculator pour percentage/formula services
   - suggestions: Quick replies fonctionnels

### 7.2 Métriques de Qualité

- **Coverage**: 30/846 services (3.5%) couverts
- **Priorité**: Services Top 30 (score 6/6)
- **Accuracy**: 100% données réelles (0% invention)
- **Completeness**: Ministry + Docs + Procs + Prix

---

## 🚀 VIII. EXÉCUTION

### Étapes Suivantes:

1. ✅ **Validation Plan** (ce document)
2. ⏳ **Génération Script Python** (generate_faqs_real_data.py)
3. ⏳ **Exécution Script** → Générer 60 FAQs
4. ⏳ **Validation Output** (TypeScript + SQL)
5. ⏳ **Tests E2E** (ChatbotService.e2e.test.ts)
6. ⏳ **Commit & Push**

---

**Document généré automatiquement**
**Date**: 2025-11-07T13:30:00Z
**Auteur**: Claude Code
**Statut**: ✅ PRÊT POUR IMPLÉMENTATION
