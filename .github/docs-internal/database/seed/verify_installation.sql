-- ====================================
-- SCRIPT DE VERIFICATION INSTALLATION
-- ====================================

-- 1. Compter toutes les entités principales
SELECT 'ministries' as table_name, COUNT(*) as count FROM ministries
UNION ALL SELECT 'sectors', COUNT(*) FROM sectors
UNION ALL SELECT 'categories', COUNT(*) FROM categories
UNION ALL SELECT 'fiscal_services', COUNT(*) FROM fiscal_services
UNION ALL SELECT 'procedure_templates', COUNT(*) FROM procedure_templates
UNION ALL SELECT 'procedure_template_steps', COUNT(*) FROM procedure_template_steps
UNION ALL SELECT 'service_procedure_assignments', COUNT(*) FROM service_procedure_assignments
UNION ALL SELECT 'document_templates', COUNT(*) FROM document_templates
UNION ALL SELECT 'service_keywords', COUNT(*) FROM service_keywords
UNION ALL SELECT 'translations', COUNT(*) FROM translations
UNION ALL SELECT 'entity_translations', COUNT(*) FROM entity_translations;

-- 2. Services sans procedures assignées
SELECT 
  COUNT(*) as services_without_procedures
FROM fiscal_services fs
LEFT JOIN service_procedure_assignments spa ON fs.id = spa.fiscal_service_id
WHERE spa.id IS NULL;

-- 3. Traductions par langue
SELECT 'entity_translations' as source, language_code, COUNT(*) as count
FROM entity_translations 
GROUP BY language_code
UNION ALL
SELECT 'Keywords', language_code, COUNT(*)
FROM service_keywords
GROUP BY language_code
ORDER BY source, language_code;

-- 4. Vérifier intégrité catégories
SELECT 
  'Categories sans sector' as issue,
  COUNT(*) as count
FROM categories c
LEFT JOIN sectors s ON c.sector_id = s.id
WHERE s.id IS NULL;

-- 5. Services avec montants par défaut (à corriger)
SELECT 
  COUNT(*) as services_with_default_rate
FROM fiscal_services
WHERE tasa_expedicion = 1 AND tasa_renovacion = 0;
