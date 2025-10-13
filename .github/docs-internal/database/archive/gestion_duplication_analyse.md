📊 DOUBLONS DÉTECTÉS
TERMES PRÉSENTS PARTOUT
EXEMPLES DOUBLONS :
"pendiente":
  ✅ ENUMs PostgreSQL: payment_status.pendiente
  ✅ JSON entités: statut dans taxes_restructured.json  
  ✅ Tokenizer IA: token #234
  ✅ Palabras_clave: mot-clé recherche
  = 4 SOURCES DIFFÉRENTES pour MÊME TERME

"documento/documents":
  ✅ JSON métier: documentos_requeridos.json
  ✅ ENUMs: document_type 
  ✅ Tokenizer: tokens #1234-1289
  = 3+ SOURCES pour MÊME CONCEPT
  
  🎯 SOLUTION BASE DE DONNÉES - HIÉRARCHIE UNIQUE
PRINCIPE : 1 TERME = 1 SOURCE DE VÉRITÉ
-- ============================================
-- ARCHITECTURE ANTI-DOUBLONS
-- ============================================

-- 1. TABLE MAÎTRE - SOURCE UNIQUE
CREATE TABLE translation_master (
    id SERIAL PRIMARY KEY,
    term_es TEXT NOT NULL UNIQUE,        -- Terme espagnol UNIQUE
    term_type VARCHAR(50) NOT NULL,      -- 'entity', 'enum', 'ui', 'keyword'
    domain VARCHAR(50),                  -- 'administrative', 'legal', 'technical'
    frequency_score INT DEFAULT 1,       -- Score de fréquence d'usage
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. TRADUCTIONS DEPUIS MAÎTRE UNIQUEMENT  
CREATE TABLE translations (
    id SERIAL PRIMARY KEY,
    master_id INT NOT NULL REFERENCES translation_master(id),
    language_code VARCHAR(2) NOT NULL,   -- 'fr', 'en' 
    translation TEXT NOT NULL,
    context VARCHAR(100),                -- Contexte spécifique si nécessaire
    is_active BOOLEAN DEFAULT true,
    UNIQUE(master_id, language_code)
);

-- 3. MAPPINGS VERS SOURCES EXISTANTES
CREATE TABLE translation_mappings (
    id SERIAL PRIMARY KEY,
    master_id INT NOT NULL REFERENCES translation_master(id),
    source_type VARCHAR(50) NOT NULL,    -- 'enum', 'entity', 'json_file'
    source_identifier TEXT NOT NULL,     -- 'payment_status.pendiente', 'M-001', etc.
    field_name VARCHAR(100),             -- 'name', 'description', etc.
    UNIQUE(source_type, source_identifier, field_name)
);

🔧 PROCÉDÉ DE DÉDUPLICATION
ÉTAPE 1 : IDENTIFICATION TERMES MAÎTRES

function identifyMasterTerms() {
  const allTerms = []
  
  // Extraire de TOUTES les sources
  allTerms.push(...extractFromJSON('ministerios.json', 'nombre_es'))
  allTerms.push(...extractFromJSON('taxes_restructured.json', 'nombre_es'))
  allTerms.push(...extractFromEnums('payment_status', 'es'))
  allTerms.push(...extractFromTokenizer('spanish_terms'))
  
  // Détecter doublons et créer maître
  const masterTerms = deduplicateTerms(allTerms)
  
  return masterTerms.map(term => ({
    term_es: term.value,
    term_type: detectType(term),
    domain: detectDomain(term),
    frequency_score: calculateFrequency(term)
  }))
}

ÉTAPE 2 : CONSOLIDATION EN BASE

-- Exemple de consolidation pour "pendiente"
INSERT INTO translation_master (term_es, term_type, domain, frequency_score)
VALUES ('pendiente', 'state', 'administrative', 234);

-- Traductions FR/EN
INSERT INTO translations (master_id, language_code, translation)
VALUES 
  (1, 'fr', 'en attente'),
  (1, 'en', 'pending');

-- Mappings vers toutes les sources
INSERT INTO translation_mappings (master_id, source_type, source_identifier)
VALUES 
  (1, 'enum', 'payment_status.pendiente'),
  (1, 'entity', 'taxes.status_field'),
  (1, 'keyword', 'palabras_clave.pendiente');
  
  ÉTAPE 3 : API UNIFIÉE
  
  -- Fonction pour obtenir traduction depuis N'IMPORTE QUELLE source
CREATE OR REPLACE FUNCTION get_unified_translation(
    p_source_type VARCHAR(50),
    p_source_identifier TEXT,
    p_field_name VARCHAR(100) DEFAULT NULL,
    p_language VARCHAR(2) DEFAULT 'fr'
)
RETURNS TEXT AS $$
DECLARE
    v_translation TEXT;
BEGIN
    SELECT t.translation INTO v_translation
    FROM translation_mappings tm
    JOIN translation_master tm2 ON tm.master_id = tm2.id
    JOIN translations t ON tm2.id = t.master_id
    WHERE tm.source_type = p_source_type
    AND tm.source_identifier = p_source_identifier
    AND (p_field_name IS NULL OR tm.field_name = p_field_name)
    AND t.language_code = p_language
    AND t.is_active = true;
    
    RETURN v_translation;
END;
$$ LANGUAGE plpgsql;

📋 EXEMPLES D'USAGE UNIFIÉ
-- Traduction depuis ENUM
SELECT get_unified_translation('enum', 'payment_status.pendiente', NULL, 'fr');
-- Retourne: 'en attente'

-- Traduction depuis entité  
SELECT get_unified_translation('entity', 'M-001', 'name', 'fr');
-- Retourne: 'Ministère des Affaires Étrangères'

-- Traduction depuis taxe
SELECT get_unified_translation('entity', 'T-001', 'name', 'en');
-- Retourne: 'Document Legalization'

🎯 AVANTAGES SOLUTION
✅ ÉLIMINATION TOTALE DOUBLONS

1 terme = 1 entrée dans translation_master
Source unique de vérité pour chaque concept
Mappings flexibles vers toutes sources existantes

✅ PERFORMANCE OPTIMISÉE

Index unique sur term_es
Requête unique pour toute traduction
Cache possible sur translation_master

✅ MAINTENANCE SIMPLIFIÉE

Modification 1 endroit → propagation automatique
Détection automatique nouveaux doublons
Validation cohérence globale

🚀 MIGRATION RECOMMANDÉE
PHASE 1 : ANALYSE 
PHASE 2 : CONSOLIDATION 
PHASE 3 : VALIDATION

Cette solution élimine 100% des doublons tout en gardant l'accès à toutes vos sources existantes. 