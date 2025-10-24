-- ====================================================================
-- SERVICES AVEC MONTANTS PAR DEFAUT (A CORRIGER)
-- ====================================================================
-- Description: 60 services ont tasa_expedicion = 1 FCFA par défaut
--              car aucune méthode de calcul n'était définie dans le JSON
--
-- CAUSE: Ces services dans le JSON source avaient:
--   - tasa_expedicion = 0 (ou NULL)
--   - tasa_renovacion = 0 (ou NULL)
--   - Aucun base_percentage défini
--   - Aucun tiers défini
--
-- SOLUTION APPLIQUEE: tasa_expedicion = 1 pour respecter la contrainte DB:
--   CHECK ((tasa_expedicion > 0) OR (tasa_renovacion > 0))
--
-- Action requise: Remplacer 1 FCFA par les vrais montants
-- ====================================================================

-- LISTE DES SERVICES CONCERNÉS:

-- T-007: Expedición Salvoconducto
-- T-012: Adquisición impreso de pasaporte y su expedición
-- T-021: Los helicópteros
-- T-029: RUBO
-- T-040: Inscripción registral de contratos de locación de aeronaves inicial y sus renovaciones
-- T-041: Inscripción registral de hipotecas, prendas u otro acto jurídico que recaiga sobre la propiedad de las aeronaves o componentes de las mismas
-- T-046: Terreno edificado (por metro cuadrado)
-- T-047: Terreno no edificado (por metro cuadrado)
-- T-053: Zona de acceso a la Terminal (menos de 10 minutos)
-- T-057: Aeronaves del Estado (siempre que no realicen vuelos comerciales)
-- T-058: Aeronaves del Gobierno (siempre que no realicen vuelos comerciales)
-- T-059: Aeronaves de los servicios oficiales de la República (siempre que no realicen vuelos comerciales)
-- T-060: Todas las aeronaves militares y gubernamentales de los países amigos (en servicio no aerocomercial)
-- T-066: AUTORIZACIONES DE EXPLOTACIÓN
-- T-067: RUBO
-- T-094: Certificado de un proveedor de servicios de navegación aérea
-- T-095: Certificado de un proveedor de servicios de navegación aérea
-- T-096: RUBRO AERODROMOS
-- T-098: Autorización/Homologación
-- T-100: 5,7 T menor que AR 10T
-- T-101: 10 T menor que AR 30T
-- T-102: 30 T menor que AR 50 T
-- T-103: 50 T menor que AR 100 T
-- T-104: 100 T menor que AR 200 T
-- T-105: AR mayor que 200 T
-- T-122: Baja intensidad por movimiento (Mongomeyen, Corisco y Annobón)
-- T-124: Alta intensidad por movimiento (en los aeropuertos de Mongomeyen, Corisco y Annobón)
-- T-125: 
-- T-144: De la 3ª a la 5ª hora
-- T-145: A partir de la 5ª
-- T-148: De la 3ª a la 5ª hora
-- T-149: A partir de la 5ª
-- T-187: Exportación madera rollizo
-- T-188: Exportación madera aserrada
-- T-195: 1% sobre el valor CIF que se ingresa en la zona única de la aduana
-- T-197: Autorización de importación de mercancía
-- T-198: Facturas visadas en las sedes diplomáticas
-- T-199: Facturas no visadas en las sedes diplomáticas OK
-- T-200: Facturas no visadas en las sedes diplomáticas NOK
-- T-289: Por cada premio
-- T-293: Autorizaciones para visita turística nativos. Por persona y para 7 días
-- T-336: Autorización de construcción de cayucos con tronco abandonado en la playa, por metro de eslora
-- T-337: Autorización de construcción de cayucos con tronco apeado, por metro de eslora
-- T-358: Matricula Enseñanza Primaria
-- T-488: Compra productos 1ª
-- T-489: Compra productos2ª
-- T-490: Compra productos 3ª
-- T-491: Abacería
-- T-515: Regalía sobre el volumen de explotación industrial de canteras por m3
-- T-517: Canon de arrendamiento de superficie/ exploración
-- T-518: Producción
-- T-523: Plataforma o /barco de perforación de (1 - 3 meses)
-- T-524: Permiso de investigación en general
-- T-525: Bono a la firma del contrato minero
-- T-526: Bono de declaración
-- T-527: Canon de arrendamiento contractual de superficie
-- T-528: Durante al periodo de explotación USD/Ha
-- T-610: Denuncia
-- T-616: Exportación y reexportación por aparato equipo de sistema
-- T-909: Camiones de 10 a 14 Vehículos muy pesados (Camiones cargados)


-- ====================================================================
-- EXEMPLE DE CORRECTION MANUELLE:
-- ====================================================================
-- IMPORTANT: Ces montants sont des EXEMPLES. Vous devez:
--   1. Consulter la documentation fiscale officielle
--   2. Vérifier les montants dans les textes de loi
--   3. Confirmer avec le ministère concerné si nécessaire
--
-- Pour chaque service:
--   - tasa_expedicion: Montant pour la première émission du document
--   - tasa_renovacion: Montant pour le renouvellement (si applicable)
--   - Les montants sont en FCFA (Francs CFA)

/*
BEGIN;

-- Exemple: T-007 Expedición Salvoconducto (Délivrance de laissez-passer)
-- Catégorie: C-001 (SERVICE CONSULAIRE)
UPDATE fiscal_services
SET tasa_expedicion = 5000,  -- EXEMPLE: Remplacer par le vrai montant
    tasa_renovacion = 0,     -- Pas de renouvellement pour ce service
    updated_at = NOW()
WHERE service_code = 'T-007';

-- Exemple: T-012 Adquisición impreso de pasaporte y su expedición
-- Catégorie: C-001 (SERVICE CONSULAIRE)
UPDATE fiscal_services
SET tasa_expedicion = 15000,  -- EXEMPLE: Remplacer par le vrai montant
    tasa_renovacion = 7500,   -- EXEMPLE: Si renouvellement applicable
    updated_at = NOW()
WHERE service_code = 'T-012';

-- Exemple: T-046 Terreno edificado (por metro cuadrado)
-- Catégorie: C-005 (CONCESSION TERRAIN AEROPORT)
-- Note: Tarif au m² - peut nécessiter calculation_method = 'percentage_base'
UPDATE fiscal_services
SET tasa_expedicion = 100,   -- EXEMPLE: Tarif par m²
    tasa_renovacion = 0,
    updated_at = NOW()
WHERE service_code = 'T-046';

-- ... Ajouter les 57 autres corrections ici

COMMIT;
*/

-- ====================================================================
-- QUERY POUR LISTER TOUS LES SERVICES A CORRIGER:
-- ====================================================================

SELECT
    fs.service_code,
    fs.name_es,
    fs.tasa_expedicion,
    fs.tasa_renovacion,
    fs.calculation_method,
    c.name_es as category
FROM fiscal_services fs
LEFT JOIN categories c ON fs.category_id = c.id
WHERE fs.tasa_expedicion = 1 AND fs.tasa_renovacion = 0
ORDER BY fs.service_code;

-- Résultat attendu: 60 services
