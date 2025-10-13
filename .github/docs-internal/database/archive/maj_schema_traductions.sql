-- ============================================
-- MISE À JOUR PARTIELLE SCHÉMA TaxasGE v3.4
-- Ajout: Gestion traductions unifiées anti-doublons
-- Date: 10 octobre 2025
-- ============================================

-- ============================================
-- NOUVELLES TABLES POUR TRADUCTIONS UNIFIÉES
-- ============================================

-- Table maître pour éliminer doublons
CREATE TABLE IF NOT EXISTS translation_master (
    id SERIAL PRIMARY KEY,
    term_es TEXT NOT NULL UNIQUE,        -- Terme espagnol (source unique)
    term_type VARCHAR(50) NOT NULL,      -- 'entity', 'enum', 'ui', 'keyword'
    domain VARCHAR(50),                  -- 'administrative', 'legal', 'technical'
    frequency_score INT DEFAULT 1,       -- Score fréquence usage
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_translation_master_term ON translation_master(term_es) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_translation_master_type ON translation_master(term_type, domain) WHERE is_active = true;

-- Traductions FR/EN depuis maître uniquement
CREATE TABLE IF NOT EXISTS translations (
    id SERIAL PRIMARY KEY,
    master_id INT NOT NULL REFERENCES translation_master(id) ON DELETE CASCADE,
    language_code VARCHAR(2) NOT NULL CHECK (language_code IN ('fr', 'en')),
    translation TEXT NOT NULL,
    context VARCHAR(100),                -- Contexte spécifique si nécessaire
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(master_id, language_code, context)
);

-- Index pour performance traductions
CREATE INDEX IF NOT EXISTS idx_translations_lookup ON translations(master_id, language_code) WHERE is_active = true;

-- Mappings vers sources existantes (évite doublons)
CREATE TABLE IF NOT EXISTS translation_mappings (
    id SERIAL PRIMARY KEY,
    master_id INT NOT NULL REFERENCES translation_master(id) ON DELETE CASCADE,
    source_type VARCHAR(50) NOT NULL,    -- 'enum', 'entity', 'table_column'
    source_identifier TEXT NOT NULL,     -- 'payment_status.pendiente', 'M-001', 'ministries.name_es'
    field_name VARCHAR(100),             -- 'name', 'description', NULL pour ENUMs
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(source_type, source_identifier, field_name)
);

-- Index pour mappings
CREATE INDEX IF NOT EXISTS idx_translation_mappings_source ON translation_mappings(source_type, source_identifier) WHERE is_active = true;

-- ============================================
-- MISE À JOUR TABLE enum_translations EXISTANTE
-- ============================================

-- Ajouter colonne source_master si pas existe
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'enum_translations' 
                   AND column_name = 'source_master_id') THEN
        ALTER TABLE enum_translations 
        ADD COLUMN source_master_id INT REFERENCES translation_master(id);
    END IF;
END $$;

-- Ajouter contrainte pour éviter doublons avec nouveau système
ALTER TABLE enum_translations 
ADD CONSTRAINT chk_enum_no_duplicate_master 
CHECK (
    (source_master_id IS NULL AND translation IS NOT NULL) OR
    (source_master_id IS NOT NULL AND translation IS NULL)
);

-- ============================================
-- NOUVELLES FONCTIONS UNIFIÉES
-- ============================================

-- Fonction principale: obtenir traduction depuis N'IMPORTE QUELLE source
CREATE OR REPLACE FUNCTION get_unified_translation(
    p_source_type VARCHAR(50),
    p_source_identifier TEXT,
    p_field_name VARCHAR(100) DEFAULT NULL,
    p_language VARCHAR(2) DEFAULT 'fr'
)
RETURNS TEXT AS $$
DECLARE
    v_translation TEXT;
    v_term_es TEXT;
BEGIN
    -- Recherche via mapping vers master
    SELECT t.translation INTO v_translation
    FROM translation_mappings tm
    JOIN translation_master tm2 ON tm.master_id = tm2.id
    JOIN translations t ON tm2.id = t.master_id
    WHERE tm.source_type = p_source_type
    AND tm.source_identifier = p_source_identifier
    AND (p_field_name IS NULL OR tm.field_name = p_field_name)
    AND t.language_code = p_language
    AND t.is_active = true
    AND tm.is_active = true;
    
    -- Si trouvé, retourner
    IF v_translation IS NOT NULL THEN
        RETURN v_translation;
    END IF;
    
    -- Fallback: recherche dans ancien système enum_translations
    IF p_source_type = 'enum' THEN
        SELECT translation INTO v_translation
        FROM enum_translations 
        WHERE enum_type = split_part(p_source_identifier, '.', 1)
        AND enum_value = split_part(p_source_identifier, '.', 2)
        AND language_code = p_language
        AND is_active = true;
        
        IF v_translation IS NOT NULL THEN
            RETURN v_translation;
        END IF;
    END IF;
    
    -- Si pas de traduction, retourner terme espagnol original
    SELECT tm2.term_es INTO v_term_es
    FROM translation_mappings tm
    JOIN translation_master tm2 ON tm.master_id = tm2.id
    WHERE tm.source_type = p_source_type
    AND tm.source_identifier = p_source_identifier
    AND (p_field_name IS NULL OR tm.field_name = p_field_name)
    AND tm.is_active = true;
    
    RETURN COALESCE(v_term_es, split_part(p_source_identifier, '.', 2));
END;
$$ LANGUAGE plpgsql;

-- Fonction pour enregistrer nouveau terme sans doublon
CREATE OR REPLACE FUNCTION register_translation_term(
    p_term_es TEXT,
    p_term_type VARCHAR(50),
    p_domain VARCHAR(50) DEFAULT NULL,
    p_translation_fr TEXT DEFAULT NULL,
    p_translation_en TEXT DEFAULT NULL
)
RETURNS INT AS $$
DECLARE
    v_master_id INT;
BEGIN
    -- Vérifier si terme existe déjà
    SELECT id INTO v_master_id 
    FROM translation_master 
    WHERE term_es = p_term_es AND is_active = true;
    
    -- Si n'existe pas, créer
    IF v_master_id IS NULL THEN
        INSERT INTO translation_master (term_es, term_type, domain)
        VALUES (p_term_es, p_term_type, p_domain)
        RETURNING id INTO v_master_id;
    END IF;
    
    -- Ajouter traductions si fournies
    IF p_translation_fr IS NOT NULL THEN
        INSERT INTO translations (master_id, language_code, translation)
        VALUES (v_master_id, 'fr', p_translation_fr)
        ON CONFLICT (master_id, language_code, context) 
        DO UPDATE SET translation = EXCLUDED.translation, updated_at = NOW();
    END IF;
    
    IF p_translation_en IS NOT NULL THEN
        INSERT INTO translations (master_id, language_code, translation)
        VALUES (v_master_id, 'en', p_translation_en)
        ON CONFLICT (master_id, language_code, context) 
        DO UPDATE SET translation = EXCLUDED.translation, updated_at = NOW();
    END IF;
    
    RETURN v_master_id;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour créer mapping source → master (évite doublons)
CREATE OR REPLACE FUNCTION create_translation_mapping(
    p_master_id INT,
    p_source_type VARCHAR(50),
    p_source_identifier TEXT,
    p_field_name VARCHAR(100) DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
    INSERT INTO translation_mappings (master_id, source_type, source_identifier, field_name)
    VALUES (p_master_id, p_source_type, p_source_identifier, p_field_name)
    ON CONFLICT (source_type, source_identifier, field_name) 
    DO UPDATE SET master_id = EXCLUDED.master_id;
    
    RETURN true;
END;
$$ LANGUAGE plpgsql;

-- Fonction de détection automatique doublons
CREATE OR REPLACE FUNCTION detect_translation_duplicates()
RETURNS TABLE(
    term_es TEXT,
    duplicate_count BIGINT,
    sources TEXT[]
) AS $$
BEGIN
    RETURN QUERY
    WITH duplicate_terms AS (
        SELECT 
            tm.term_es,
            COUNT(*) as dup_count,
            ARRAY_AGG(DISTINCT tmap.source_type || ':' || tmap.source_identifier) as source_list
        FROM translation_master tm
        JOIN translation_mappings tmap ON tm.id = tmap.master_id
        WHERE tm.is_active = true AND tmap.is_active = true
        GROUP BY tm.term_es
        HAVING COUNT(*) > 1
    )
    SELECT dt.term_es, dt.dup_count, dt.source_list
    FROM duplicate_terms dt
    ORDER BY dt.dup_count DESC;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- MISE À JOUR FONCTION get_enum_translation EXISTANTE
-- ============================================

-- Remplacer fonction existante pour utiliser nouveau système
CREATE OR REPLACE FUNCTION get_enum_translation(
    p_enum_type VARCHAR(100),
    p_enum_value VARCHAR(100), 
    p_language_code VARCHAR(2) DEFAULT 'es'
)
RETURNS TEXT AS $$
DECLARE
    v_translation TEXT;
BEGIN
    -- Si espagnol demandé, retourner valeur directe
    IF p_language_code = 'es' THEN
        RETURN p_enum_value;
    END IF;
    
    -- Utiliser nouveau système unifié
    SELECT get_unified_translation(
        'enum', 
        p_enum_type || '.' || p_enum_value, 
        NULL, 
        p_language_code
    ) INTO v_translation;
    
    -- Fallback vers ancien système si nouveau pas configuré
    IF v_translation IS NULL THEN
        SELECT translation INTO v_translation
        FROM enum_translations 
        WHERE enum_type = p_enum_type 
        AND enum_value = p_enum_value 
        AND language_code = p_language_code
        AND is_active = true;
    END IF;
    
    -- Fallback vers espagnol si traduction manquante
    RETURN COALESCE(v_translation, p_enum_value);
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- VUES UTILITAIRES POUR MONITORING
-- ============================================

-- Vue pour monitoring des traductions manquantes
CREATE OR REPLACE VIEW v_missing_translations AS
SELECT 
    tm.term_es,
    tm.term_type,
    tm.domain,
    CASE WHEN t_fr.translation IS NULL THEN 'fr' ELSE NULL END as missing_fr,
    CASE WHEN t_en.translation IS NULL THEN 'en' ELSE NULL END as missing_en,
    array_length(array_agg(tmap.source_identifier), 1) as source_count
FROM translation_master tm
LEFT JOIN translations t_fr ON tm.id = t_fr.master_id AND t_fr.language_code = 'fr' AND t_fr.is_active = true
LEFT JOIN translations t_en ON tm.id = t_en.master_id AND t_en.language_code = 'en' AND t_en.is_active = true
LEFT JOIN translation_mappings tmap ON tm.id = tmap.master_id AND tmap.is_active = true
WHERE tm.is_active = true
GROUP BY tm.id, tm.term_es, tm.term_type, tm.domain, t_fr.translation, t_en.translation
HAVING t_fr.translation IS NULL OR t_en.translation IS NULL;

-- Vue pour statistiques traductions
CREATE OR REPLACE VIEW v_translation_stats AS
SELECT 
    term_type,
    domain,
    COUNT(*) as total_terms,
    COUNT(CASE WHEN t_fr.translation IS NOT NULL THEN 1 END) as translated_fr,
    COUNT(CASE WHEN t_en.translation IS NOT NULL THEN 1 END) as translated_en,
    ROUND(COUNT(CASE WHEN t_fr.translation IS NOT NULL THEN 1 END) * 100.0 / COUNT(*), 2) as fr_completion_pct,
    ROUND(COUNT(CASE WHEN t_en.translation IS NOT NULL THEN 1 END) * 100.0 / COUNT(*), 2) as en_completion_pct
FROM translation_master tm
LEFT JOIN translations t_fr ON tm.id = t_fr.master_id AND t_fr.language_code = 'fr' AND t_fr.is_active = true
LEFT JOIN translations t_en ON tm.id = t_en.master_id AND t_en.language_code = 'en' AND t_en.is_active = true
WHERE tm.is_active = true
GROUP BY term_type, domain
ORDER BY term_type, domain;

-- ============================================
-- COMMENTAIRES DOCUMENTATION
-- ============================================

COMMENT ON TABLE translation_master IS 'Table maître - Source unique pour tous termes espagnols (élimine doublons)';
COMMENT ON TABLE translations IS 'Traductions FR/EN depuis master uniquement - Pas de doublons possibles';
COMMENT ON TABLE translation_mappings IS 'Mappings flexibles vers toutes sources existantes - Évite duplication';

COMMENT ON FUNCTION get_unified_translation IS 'API unifiée pour traductions depuis toute source - Anti-doublons';
COMMENT ON FUNCTION register_translation_term IS 'Enregistrement nouveau terme avec vérification doublons automatique';
COMMENT ON FUNCTION detect_translation_duplicates IS 'Détection automatique doublons cross-sources';

COMMENT ON VIEW v_missing_translations IS 'Monitoring traductions manquantes par langue';
COMMENT ON VIEW v_translation_stats IS 'Statistiques completion traductions par domaine';

-- ============================================
-- NOTIFICATIONS SUCCÈS
-- ============================================

DO $$
BEGIN
    RAISE NOTICE '============================================';
    RAISE NOTICE 'MISE À JOUR SCHÉMA v3.4 → v3.5 TERMINÉE';
    RAISE NOTICE '✅ Tables traductions unifiées ajoutées';
    RAISE NOTICE '✅ Fonctions anti-doublons créées'; 
    RAISE NOTICE '✅ API unifiée get_unified_translation() active';
    RAISE NOTICE '✅ Vues monitoring ajoutées';
    RAISE NOTICE 'Prochaine étape: Migration données existantes';
    RAISE NOTICE '============================================';
END$$;
