-- ============================================
-- SEED TRANSLATIONS v4.1 - OPTIMIZED
-- Generated from translations.json
-- Format: SHORT codes + ENUM + PRIMARY KEY
-- Translations: 1344
-- Date: 2025-10-10T21:03:39.039Z
-- ============================================

BEGIN;

-- ============================================
-- ENTITY TRANSLATIONS v4.1 (FR + EN)
-- ============================================
-- entity_type: translatable_entity_type ENUM (strict)
-- entity_code: SHORT codes (-76% vs verbose)
-- language_code: 'fr', 'en' (ES already in DB)
-- field_name: 'name', 'description', 'instructions'
-- ============================================

-- CATEGORY (168 translations)

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('category', 'C-001', 'fr', 'name', 'SERVICE CONSULAIRE', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('category', 'C-001', 'en', 'name', 'CONSULAR SERVICE', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('category', 'C-002', 'fr', 'name', 'AÉRONEFS DE TRAFIC INTERNATIONAL', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('category', 'C-002', 'en', 'name', 'INTERNATIONAL AIRCRAFT TRAFFIC', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('category', 'C-003', 'fr', 'name', 'AÉRONEFS DE TRAFIC NATIONAL', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('category', 'C-003', 'en', 'name', 'NATIONAL AIRCRAFT TRAFFIC', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('category', 'C-004', 'fr', 'name', 'AÉRONEFS : TARIF DE SUPERVISION DE LA SÉCURITÉ OPÉRATIONNELLE (IMMATRICULATION)', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('category', 'C-004', 'en', 'name', 'AIRCRAFT: OPERATIONAL SAFETY SUPERVISION FEE (REGISTRATION)', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('category', 'C-005', 'fr', 'name', 'LOCATION DES TERRAINS DES ENCEINTES AÉROPORTUAIRES', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('category', 'C-005', 'en', 'name', 'AIRPORT GROUNDS RENTAL', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('category', 'C-006', 'fr', 'name', 'AUTORISATIONS DE SURVOL ET D''ATTERRISSAGE', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('category', 'C-006', 'en', 'name', 'OVERFLIGHT AND LANDING AUTHORIZATIONS', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('category', 'C-007', 'fr', 'name', 'DÉTECTION D''OBSTACLES', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('category', 'C-007', 'en', 'name', 'OBSTACLE DETECTION', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('category', 'C-008', 'fr', 'name', 'STATIONNEMENT DE VÉHICULES', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('category', 'C-008', 'en', 'name', 'VEHICLE PARKING', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('category', 'C-009', 'fr', 'name', 'EXEMPTION DU PAIEMENT DES DROITS AÉRONAUTIQUES', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('category', 'C-009', 'en', 'name', 'EXEMPTION FROM AERONAUTICAL FEES PAYMENT', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('category', 'C-010', 'fr', 'name', 'II/III, RNP 10, ETOPS, RVSM', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('category', 'C-010', 'en', 'name', 'II/III, RNP 10, ETOPS, RVSM', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('category', 'C-011', 'fr', 'name', 'PERSONNEL AU SOL', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('category', 'C-011', 'en', 'name', 'GROUND PERSONNEL', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('category', 'C-012', 'fr', 'name', 'TARIF DE STATIONNEMENT', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('category', 'C-012', 'en', 'name', 'PARKING FEE', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('category', 'C-013', 'fr', 'name', 'TARIF DE SÉCURITÉ AÉROPORTUAIRE', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('category', 'C-013', 'en', 'name', 'AIRPORT SECURITY FEE', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('category', 'C-014', 'fr', 'name', 'TARIF DE BALISAGE LUMINEUX DE PISTE', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('category', 'C-014', 'en', 'name', 'RUNWAY LIGHTING BEACON FEE', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('category', 'C-015', 'fr', 'name', 'TARIF POUR LE CONTRÔLE ET LA SUPERVISION DE LA SÉCURITÉ OPÉRATIONNELLE', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('category', 'C-015', 'en', 'name', 'OPERATIONAL SAFETY CONTROL AND SUPERVISION FEE', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('category', 'C-016', 'fr', 'name', 'TARIF POUR LE DÉVELOPPEMENT DES INFRASTRUCTURES AÉRONAUTIQUES', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('category', 'C-016', 'en', 'name', 'AERONAUTICAL INFRASTRUCTURE DEVELOPMENT FEE', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('category', 'C-017', 'fr', 'name', 'TARIF POUR LES SERVICES ET FACILITÉS FOURNIS AUX PASSAGERS LORS DE LEUR TRANSIT DANS LES AÉROPORTS', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('category', 'C-017', 'en', 'name', 'FEE FOR PASSENGER SERVICES AND FACILITIES DURING AIRPORT TRANSIT', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('category', 'C-018', 'fr', 'name', 'TARIF POUR LA PROLONGATION D''OUVERTURE DES SERVICES AÉROPORTUAIRES (AÉRODROMES ET AÉROPORTS)', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('category', 'C-018', 'en', 'name', 'FEE FOR EXTENDED AIRPORT SERVICES OPENING (AIRFIELDS AND AIRPORTS)', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('category', 'C-019', 'fr', 'name', 'TARIF POUR L''UTILISATION DES PASSERELLES TÉLESCOPIQUES POUR L''EMBARQUEMENT ET LE DÉBARQUEMENT DES PASSAGERS', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('category', 'C-019', 'en', 'name', 'FEE FOR TELESCOPIC BOARDING BRIDGE USE FOR PASSENGER BOARDING AND DISEMBARKING', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('category', 'C-020', 'fr', 'name', 'TARIF POUR LA SURVEILLANCE RADAR DES VOLS EN TRANSIT DANS L''ESPACE AÉRIEN DE LA GUINÉE ÉQUATORIALE', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('category', 'C-020', 'en', 'name', 'FEE FOR RADAR SURVEILLANCE OF FLIGHTS IN TRANSIT IN EQUATORIAL GUINEA AIRSPACE', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('category', 'C-021', 'fr', 'name', 'TARIFS DE MANUTENTION', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('category', 'C-021', 'en', 'name', 'HANDLING FEES', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('category', 'C-022', 'fr', 'name', 'TAXE SUR LE CARBURANT', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('category', 'C-022', 'en', 'name', 'FUEL TAX', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('category', 'C-023', 'fr', 'name', 'TAXE INTERNATIONALE DE TRANSPORT', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('category', 'C-023', 'en', 'name', 'INTERNATIONAL TRANSPORT TAX', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('category', 'C-024', 'fr', 'name', 'VOLS CHARTER', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('category', 'C-024', 'en', 'name', 'CHARTER FLIGHTS', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('category', 'C-025', 'fr', 'name', 'VOLS INTERNATIONAUX', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('category', 'C-025', 'en', 'name', 'INTERNATIONAL FLIGHTS', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('category', 'C-026', 'fr', 'name', 'VOLS NATIONAUX', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('category', 'C-026', 'en', 'name', 'DOMESTIC FLIGHTS', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('category', 'C-027', 'fr', 'name', 'COTISATION ANNUELLE', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('category', 'C-027', 'en', 'name', 'ANNUAL FEE', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('category', 'C-028', 'fr', 'name', 'LICENCE D''EXPORTATION ET DE RÉEXPORTATION', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('category', 'C-028', 'en', 'name', 'EXPORT AND RE-EXPORT LICENSE', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('category', 'C-029', 'fr', 'name', 'SERVICE DE CHANGEMENT DE DÉNOMINATION', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('category', 'C-029', 'en', 'name', 'DENOMINATION CHANGE SERVICE', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('category', 'C-030', 'fr', 'name', 'SERVICE DE COMMERCE', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('category', 'C-030', 'en', 'name', 'COMMERCE SERVICE', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('category', 'C-031', 'fr', 'name', 'SERVICE D''IMPORTATION DE MARCHANDISES', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('category', 'C-031', 'en', 'name', 'GOODS IMPORT SERVICE', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('category', 'C-032', 'fr', 'name', 'SECTEUR DE PROMOTION DES PETITES ET MOYENNES ENTREPRISES', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('category', 'C-032', 'en', 'name', 'SMALL AND MEDIUM ENTERPRISES PROMOTION SECTOR', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('category', 'C-039', 'fr', 'name', 'ACTIVITÉS CULTURELLES', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('category', 'C-039', 'en', 'name', 'CULTURAL ACTIVITIES', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('category', 'C-044', 'fr', 'name', 'AUTRES PRESTATIONS', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('category', 'C-044', 'en', 'name', 'OTHER SERVICES', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('category', 'C-045', 'fr', 'name', 'SERVICE DE LA MARINE', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('category', 'C-045', 'en', 'name', 'MARINE SERVICE', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('category', 'C-046', 'fr', 'name', 'SERVICE D''ENREGISTREMENT DES PETITES EMBARCATIONS', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('category', 'C-046', 'en', 'name', 'SMALL VESSEL REGISTRATION SERVICE', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('category', 'C-047', 'fr', 'name', 'SERVICE D''INSCRIPTIONS ET DOCUMENTS ACADÉMIQUES', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('category', 'C-047', 'en', 'name', 'ENROLLMENT AND ACADEMIC DOCUMENTS SERVICE', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('category', 'C-048', 'fr', 'name', 'AUTORISATIONS DE CENTRES PRIVÉS', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('category', 'C-048', 'en', 'name', 'PRIVATE CENTER AUTHORIZATIONS', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('category', 'C-049', 'fr', 'name', 'MATIÈRES EN ATTENTE, PAR MATIÈRE', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('category', 'C-049', 'en', 'name', 'PENDING SUBJECTS, PER SUBJECT', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('category', 'C-050', 'fr', 'name', 'VALIDATION ET AUTRES DOCUMENTS SPÉCIAUX', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('category', 'C-050', 'en', 'name', 'VALIDATION AND OTHER SPECIAL DOCUMENTS', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('category', 'C-051', 'fr', 'name', 'INSCRIPTION POUR REDOUBLEMENT', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('category', 'C-051', 'en', 'name', 'ENROLLMENT FOR GRADE REPETITION', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('category', 'C-052', 'fr', 'name', 'INSCRIPTION À L''EXAMEN DE FIN D''ÉTUDES', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('category', 'C-052', 'en', 'name', 'ENROLLMENT FOR GRADUATION EXAM', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('category', 'C-053', 'fr', 'name', 'SERVICE D''ENSEIGNEMENT PRIMAIRE', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('category', 'C-053', 'en', 'name', 'PRIMARY EDUCATION SERVICE', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('category', 'C-054', 'fr', 'name', 'SERVICE D''ENSEIGNEMENT UNIVERSITAIRE', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('category', 'C-054', 'en', 'name', 'UNIVERSITY EDUCATION SERVICE', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('category', 'C-057', 'fr', 'name', 'SECTEUR DE L''ÉCONOMIE, DE LA PLANIFICATION ET DES INVESTISSEMENTS PUBLICS', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('category', 'C-057', 'en', 'name', 'ECONOMY, PLANNING AND PUBLIC INVESTMENTS SECTOR', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('category', 'C-058', 'fr', 'name', 'SERVICE DE CERTIFICATIONS BANCAIRES', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('category', 'C-058', 'en', 'name', 'BANKING CERTIFICATIONS SERVICE', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('category', 'C-059', 'fr', 'name', 'SERVICE DES BANQUES, ASSURANCES ET RÉASSURANCES', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('category', 'C-059', 'en', 'name', 'BANKING, INSURANCE AND REINSURANCE SERVICE', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('category', 'C-060', 'fr', 'name', 'SERVICE DES IMPÔTS ET CONTRIBUTIONS', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('category', 'C-060', 'en', 'name', 'TAX AND CONTRIBUTIONS SERVICE', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('category', 'C-061', 'fr', 'name', 'SERVICE DE RECOUVREMENT', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('category', 'C-061', 'en', 'name', 'COLLECTION SERVICE', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('category', 'C-062', 'fr', 'name', 'AGENCE DE PRESSE INTERNATIONALE', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('category', 'C-062', 'en', 'name', 'INTERNATIONAL PRESS AGENCY', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('category', 'C-063', 'fr', 'name', 'MULTISERVICES DE PRODUCTION ET REPRODUCTION DE DOCUMENTS', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('category', 'C-063', 'en', 'name', 'DOCUMENT PRODUCTION AND REPRODUCTION MULTISERVICES', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('category', 'C-064', 'fr', 'name', 'PUBLICITÉ ET AFFICHAGE DANS LES LIEUX PUBLICS ET VOIES URBAINES', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('category', 'C-064', 'en', 'name', 'ADVERTISING AND PROMOTION IN PUBLIC PLACES AND URBAN AREAS', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('category', 'C-065', 'fr', 'name', 'PUBLICITÉ DANS LES JOURNAUX D''ÉTAT', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('category', 'C-065', 'en', 'name', 'ADVERTISING IN STATE-OWNED NEWSPAPERS', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('category', 'C-066', 'fr', 'name', 'SERVICE DE BASE INTERNET', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('category', 'C-066', 'en', 'name', 'INTERNET BASE SERVICE', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('category', 'C-067', 'fr', 'name', 'SERVICE DE PAPETERIE', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('category', 'C-067', 'en', 'name', 'STATIONERY SERVICE', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('category', 'C-068', 'fr', 'name', 'SERVICE DE RADIO ET TÉLÉVISION', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('category', 'C-068', 'en', 'name', 'RADIO AND TELEVISION SERVICE', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('category', 'C-069', 'fr', 'name', 'SERVICE DE TÉLÉ-ANNONCES', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('category', 'C-069', 'en', 'name', 'TELE-ADVERTISING SERVICE', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('category', 'C-070', 'fr', 'name', 'RADIATIONS', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('category', 'C-070', 'en', 'name', 'VEHICLE DEREGISTRATION', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('category', 'C-071', 'fr', 'name', 'CATÉGORIES', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('category', 'C-071', 'en', 'name', 'CATEGORIES', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('category', 'C-072', 'fr', 'name', 'PERMIS DE CONDUIRE', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('category', 'C-072', 'en', 'name', 'DRIVING LICENSE', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('category', 'C-073', 'fr', 'name', 'RENOUVELLEMENTS HORS DÉLAI', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('category', 'C-073', 'en', 'name', 'LATE RENEWALS', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('category', 'C-074', 'fr', 'name', 'SERVICE DES AUTORISATIONS', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('category', 'C-074', 'en', 'name', 'AUTHORIZATION SERVICE', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('category', 'C-075', 'fr', 'name', 'SERVICE DE CIRCULATION ROUTIÈRE', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('category', 'C-075', 'en', 'name', 'ROAD TRAFFIC SERVICE', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('category', 'C-076', 'fr', 'name', 'AUTORISATION DE VENTE DE GAZ', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('category', 'C-076', 'en', 'name', 'GAS SALES AUTHORIZATION', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('category', 'C-077', 'fr', 'name', 'AUTORISATION DE VENTE DE PRODUITS RAFFINÉS', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('category', 'C-077', 'en', 'name', 'AUTHORIZATION FOR SALE OF REFINED PRODUCTS', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('category', 'C-078', 'fr', 'name', 'SECRÉTARIAT GÉNÉRAL', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('category', 'C-078', 'en', 'name', 'GENERAL SECRETARIAT', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('category', 'C-079', 'fr', 'name', 'SERVICE DES MINES ET DES HYDROCARBURES', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('category', 'C-079', 'en', 'name', 'MINING AND HYDROCARBONS SERVICE', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('category', 'C-080', 'fr', 'name', 'ENREGISTREMENT DES VÉHICULES', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('category', 'C-080', 'en', 'name', 'VEHICLE REGISTRATION', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('category', 'C-081', 'fr', 'name', 'ARCHIVES NUMÉRIQUES OU ÉLECTRIQUES', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('category', 'C-081', 'en', 'name', 'DIGITAL OR ELECTRICAL ARCHIVES', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('category', 'C-082', 'fr', 'name', 'IMPLANTATION DES TERRAINS URBAINS', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('category', 'C-082', 'en', 'name', 'URBAN LAND LAYOUT', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('category', 'C-083', 'fr', 'name', 'SERVICE DE PLANS PAPIER À TOUTE ÉCHELLE PAR IMPRIMANTE', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('category', 'C-083', 'en', 'name', 'PAPER PLAN PRINTING SERVICE AT ANY SCALE BY PRINTER', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('category', 'C-084', 'fr', 'name', 'SERVICE DE TRAÇAGE', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('category', 'C-084', 'en', 'name', 'PLOTTING SERVICE', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('category', 'C-085', 'fr', 'name', 'SERVICE TECHNIQUE D''EXPERTISE DES BIENS MEUBLES ET IMMEUBLES', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('category', 'C-085', 'en', 'name', 'TECHNICAL APPRAISAL SERVICE FOR MOVABLE AND IMMOVABLE PROPERTY', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('category', 'C-086', 'fr', 'name', 'SERVICES D''URBANISME ET TRAITEMENT DES DOSSIERS', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('category', 'C-086', 'en', 'name', 'URBAN PLANNING AND FILE PROCESSING SERVICES', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('category', 'C-087', 'fr', 'name', 'AUTORISATIONS ET VISAS', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('category', 'C-087', 'en', 'name', 'AUTHORIZATIONS AND VISAS', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('category', 'C-088', 'fr', 'name', 'CERTIFICATS ET ATTESTATIONS', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('category', 'C-088', 'en', 'name', 'CERTIFICATES AND STATEMENTS', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('category', 'C-089', 'fr', 'name', 'DOCUMENTS D''IDENTITÉ ET DE VOYAGE', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('category', 'C-089', 'en', 'name', 'IDENTITY AND TRAVEL DOCUMENTS', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('category', 'C-090', 'fr', 'name', 'SANCTIONS ET PROCÉDURES POLICIÈRES', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('category', 'C-090', 'en', 'name', 'POLICE SANCTIONS AND PROCEDURES', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('category', 'C-091', 'fr', 'name', 'AUTORISATIONS', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('category', 'C-091', 'en', 'name', 'AUTHORIZATIONS', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('category', 'C-092', 'fr', 'name', 'AUTORISATIONS', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('category', 'C-092', 'en', 'name', 'AUTHORIZATIONS', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('category', 'C-093', 'fr', 'name', 'NAVIRES DE LIGNE RÉGULIÈRE À DESTINATION DE NOTRE PAYS EN F. CFA/VOYAGE', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('category', 'C-093', 'en', 'name', 'REGULAR LINE VESSELS BOUND FOR OUR COUNTRY IN CFA F./TRIP', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('category', 'C-101', 'fr', 'name', 'VÉHICULES TRÈS LOURDS', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('category', 'C-101', 'en', 'name', 'VERY HEAVY VEHICLES', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('category', 'C-102', 'fr', 'name', 'VÉHICULES PARTICULIERS', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('category', 'C-102', 'en', 'name', 'PRIVATE VEHICLES', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('category', 'C-103', 'fr', 'name', 'VÉHICULES POIDS MOYEN', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('category', 'C-103', 'en', 'name', 'MEDIUM WEIGHT VEHICLES', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('category', 'C-104', 'fr', 'name', 'VÉHICULES PUBLICS', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('category', 'C-104', 'en', 'name', 'PUBLIC VEHICLES', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('category', 'C-105', 'fr', 'name', 'VÉHICULES REMORQUES', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('category', 'C-105', 'en', 'name', 'TRAILER VEHICLES', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;


-- MINISTRY (28 translations)

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('ministry', 'M-001', 'fr', 'name', 'MINISTÈRE DES AFFAIRES ÉTRANGÈRES ET DE LA COOPÉRATION', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('ministry', 'M-001', 'en', 'name', 'MINISTRY OF FOREIGN AFFAIRS AND COOPERATION', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('ministry', 'M-002', 'fr', 'name', 'MINISTÈRE DE L''AVIATION CIVILE', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('ministry', 'M-002', 'en', 'name', 'CIVIL AVIATION MINISTRY', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('ministry', 'M-003', 'fr', 'name', 'MINISTÈRE DU COMMERCE ET DE LA PROMOTION DES PETITES ET MOYENNES ENTREPRISES', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('ministry', 'M-003', 'en', 'name', 'MINISTRY OF COMMERCE AND PROMOTION OF SMALL AND MEDIUM ENTERPRISES', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('ministry', 'M-004', 'fr', 'name', 'MINISTÈRE DE LA CULTURE, DE LA PROMOTION ARTISANALE ET DU TOURISME', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('ministry', 'M-004', 'en', 'name', 'MINISTRY OF CULTURE, CRAFT PROMOTION AND TOURISM', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('ministry', 'M-005', 'fr', 'name', 'MINISTÈRE DE LA DÉFENSE NATIONALE', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('ministry', 'M-005', 'en', 'name', 'MINISTRY OF NATIONAL DEFENSE', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('ministry', 'M-006', 'fr', 'name', 'MINISTÈRE DE L''ÉDUCATION ET DES SCIENCES', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('ministry', 'M-006', 'en', 'name', 'MINISTRY OF EDUCATION AND SCIENCES', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('ministry', 'M-007', 'fr', 'name', 'MINISTÈRE DES FINANCES, DE L''ÉCONOMIE, DE LA PLANIFICATION ET DES INVESTISSEMENTS', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('ministry', 'M-007', 'en', 'name', 'MINISTRY OF FINANCE, ECONOMY, PLANNING AND INVESTMENTS', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('ministry', 'M-008', 'fr', 'name', 'MINISTÈRE DE L''INFORMATION, DE LA PRESSE ET DE LA RADIO', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('ministry', 'M-008', 'en', 'name', 'MINISTRY OF INFORMATION, PRESS AND RADIO', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('ministry', 'M-009', 'fr', 'name', 'MINISTÈRE DE L''INTÉRIEUR ET DES COOPÉRATIONS LOCALES', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('ministry', 'M-009', 'en', 'name', 'MINISTRY OF INTERIOR AND LOCAL COOPERATIONS', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('ministry', 'M-010', 'fr', 'name', 'MINISTÈRE DES MINES ET DES HYDROCARBURES', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('ministry', 'M-010', 'en', 'name', 'MINISTRY OF MINES AND HYDROCARBONS', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('ministry', 'M-011', 'fr', 'name', 'MINISTÈRE DES TRAVAUX PUBLICS, DU LOGEMENT ET DE L''URBANISME', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('ministry', 'M-011', 'en', 'name', 'MINISTRY OF PUBLIC WORKS, HOUSING AND URBAN PLANNING', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('ministry', 'M-012', 'fr', 'name', 'MINISTÈRE DE LA SÉCURITÉ NATIONALE', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('ministry', 'M-012', 'en', 'name', 'MINISTRY OF NATIONAL SECURITY', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('ministry', 'M-013', 'fr', 'name', 'MINISTÈRE DES TRANSPORTS, POSTES ET TÉLÉCOMMUNICATIONS', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('ministry', 'M-013', 'en', 'name', 'MINISTRY OF TRANSPORT, POST AND TELECOMMUNICATIONS', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('ministry', 'M-014', 'fr', 'name', 'PRÉSIDENCE DU GOUVERNEMENT', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('ministry', 'M-014', 'en', 'name', 'GOVERNMENT PRESIDENCY', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;


-- SECTOR (40 translations)

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('sector', 'S-001', 'fr', 'name', 'SECTEUR DES AFFAIRES ÉTRANGÈRES ET DE LA COOPÉRATION', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('sector', 'S-001', 'en', 'name', 'FOREIGN AFFAIRS AND COOPERATION SECTOR', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('sector', 'S-002', 'fr', 'name', 'SECTEUR DE L''AVIATION CIVILE', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('sector', 'S-002', 'en', 'name', 'CIVIL AVIATION SECTOR', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('sector', 'S-003', 'fr', 'name', 'SECTEUR DU COMMERCE', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('sector', 'S-003', 'en', 'name', 'COMMERCE SECTOR', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('sector', 'S-005', 'fr', 'name', 'SECTEUR DE L''ÉCONOMIE, DE LA CULTURE ET DE LA PROMOTION ARTISANALE', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('sector', 'S-005', 'en', 'name', 'ECONOMY, CULTURE AND CRAFT PROMOTION SECTOR', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('sector', 'S-007', 'fr', 'name', 'SECTEUR DE LA DÉFENSE NATIONALE', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('sector', 'S-007', 'en', 'name', 'NATIONAL DEFENSE SECTOR', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('sector', 'S-008', 'fr', 'name', 'SECTEUR DE L''ÉDUCATION ET DES SCIENCES', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('sector', 'S-008', 'en', 'name', 'EDUCATION AND SCIENCES SECTOR', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('sector', 'S-009', 'fr', 'name', 'SECTEUR DE L''ÉCONOMIE, DE LA PLANIFICATION ET DES INVESTISSEMENTS PUBLICS', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('sector', 'S-009', 'en', 'name', 'ECONOMY, PLANNING AND PUBLIC INVESTMENTS SECTOR', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('sector', 'S-010', 'fr', 'name', 'SECTEUR DES FINANCES ET DES BUDGETS', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('sector', 'S-010', 'en', 'name', 'FINANCE AND BUDGET SECTOR', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('sector', 'S-011', 'fr', 'name', 'SECTEUR DE L''INFORMATION, DE LA PRESSE ET DE LA RADIO', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('sector', 'S-011', 'en', 'name', 'INFORMATION, PRESS AND RADIO SECTOR', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('sector', 'S-012', 'fr', 'name', 'SECTEUR DE L''INTÉRIEUR ET DES COOPÉRATIONS LOCALES', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('sector', 'S-012', 'en', 'name', 'INTERIOR AND LOCAL COOPERATIONS SECTOR', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('sector', 'S-013', 'fr', 'name', 'SECTEUR DES MINES ET DES HYDROCARBURES', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('sector', 'S-013', 'en', 'name', 'MINES AND HYDROCARBONS SECTOR', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('sector', 'S-014', 'fr', 'name', 'SECTEUR DES TRAVAUX PUBLICS ET INFRASTRUCTURES', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('sector', 'S-014', 'en', 'name', 'PUBLIC WORKS AND INFRASTRUCTURE SECTOR', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('sector', 'S-015', 'fr', 'name', 'SECTEUR DE L''URBANISME', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('sector', 'S-015', 'en', 'name', 'URBAN PLANNING SECTOR', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('sector', 'S-016', 'fr', 'name', 'SECTEUR DE LA SÉCURITÉ NATIONALE', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('sector', 'S-016', 'en', 'name', 'NATIONAL SECURITY SECTOR', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('sector', 'S-017', 'fr', 'name', 'SECTEUR TRANSPORTS ET POSTES', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('sector', 'S-017', 'en', 'name', 'TRANSPORT AND POSTAL SECTOR', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('sector', 'C-098', 'fr', 'name', 'SERVICE POSTAL DE GUINÉE ÉQUATORIALE', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('sector', 'C-098', 'en', 'name', 'EQUATORIAL GUINEA POSTAL SERVICE', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('sector', 'C-096', 'fr', 'name', 'Inspection des navires', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('sector', 'C-096', 'en', 'name', 'Ship inspection', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('sector', 'C-097', 'fr', 'name', 'Registre des navires et entreprise maritime', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('sector', 'C-097', 'en', 'name', 'Ship and maritime company registration', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('sector', 'C-098', 'fr', 'name', 'SERVICE POSTAL DE GUINÉE ÉQUATORIALE', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('sector', 'C-098', 'en', 'name', 'EQUATORIAL GUINEA POSTAL SERVICE', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('sector', 'S-018', 'fr', 'name', 'SECTEUR DE L''ENTRETIEN DES ROUTES ET DES PÉAGES', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('sector', 'S-018', 'en', 'name', 'ROAD MAINTENANCE AND TOLL SECTOR', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;


-- SERVICE (1108 translations)

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-001', 'fr', 'name', 'Légalisation de documents', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-001', 'en', 'name', 'Document legalization', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-002', 'fr', 'name', 'Légalisation d''actes notariés', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-002', 'en', 'name', 'Legalization of notarized documents', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-003', 'fr', 'name', 'Légalisation de diplômes ou titres académiques', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-003', 'en', 'name', 'Legalization of diplomas or academic degrees', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-004', 'fr', 'name', 'Légalisation de documents commerciaux', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-004', 'en', 'name', 'Legalization of Commercial Documents', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-005', 'fr', 'name', 'Acquisition du formulaire de passeport et sa délivrance', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-005', 'en', 'name', 'Passport Form Acquisition and Issuance', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-006', 'fr', 'name', 'Renouvellement de passeport pour expiration de validité', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-006', 'en', 'name', 'Passport Renewal due to Expiration', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-007', 'fr', 'name', 'Délivrance de laissez-passer', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-007', 'en', 'name', 'Safe Conduct Issuance', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-008', 'fr', 'name', 'Légalisation de documents', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-008', 'en', 'name', 'Legalization of Documents', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-009', 'fr', 'name', 'Légalisation d''actes notariés', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-009', 'en', 'name', 'Legalization of Notarized Documents', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-010', 'fr', 'name', 'Légalisation de diplômes ou titres académiques', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-010', 'en', 'name', 'Legalization of Academic Diplomas or Degrees', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-011', 'fr', 'name', 'Légalisation de documents commerciaux', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-011', 'en', 'name', 'Legalization of Commercial Documents', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-012', 'fr', 'name', 'Acquisition du formulaire de passeport et sa délivrance', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-012', 'en', 'name', 'Passport Form Acquisition and Issuance', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-013', 'fr', 'name', 'Renouvellement de passeport pour expiration de validité', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-013', 'en', 'name', 'Passport Renewal due to Expiration', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-014', 'fr', 'name', 'Délivrance de la carte consulaire', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-014', 'en', 'name', 'Consular ID Card Issuance', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-015', 'fr', 'name', 'De 1 à 25 Tonnes métriques', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-015', 'en', 'name', '1 to 25 Metric Tons', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-016', 'fr', 'name', 'De 26 à 75 Tonnes métriques', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-016', 'en', 'name', '26 to 75 Metric Tons', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-017', 'fr', 'name', 'De 76 à 150 Tonnes métriques', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-017', 'en', 'name', '76 to 150 Metric Tons', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-018', 'fr', 'name', 'De 151 à 300 Tonnes métriques', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-018', 'en', 'name', '151 to 300 Metric Tons', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-019', 'fr', 'name', 'Plus de 300 Tonnes métriques', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-019', 'en', 'name', 'More than 300 Metric Tons', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-020', 'fr', 'name', 'Les aéronefs privés de tourisme, dont la masse maximale au décollage est inférieure ou égale à 2 tonnes, payeront un tarif global', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-020', 'en', 'name', 'Private tourism aircraft with a maximum takeoff weight less than or equal to 2 tons, will pay a global rate', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-021', 'fr', 'name', 'Les hélicoptères', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-021', 'en', 'name', 'Helicopters', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-022', 'fr', 'name', 'De 1 à 4 Tonnes métriques', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-022', 'en', 'name', '1 to 4 Metric Tons', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-023', 'fr', 'name', 'De 5 à 14 Tonnes métriques', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-023', 'en', 'name', '5 to 14 Metric Tons', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-024', 'fr', 'name', 'De 15 à 25 Tonnes métriques', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-024', 'en', 'name', '15 to 25 Metric Tons', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-025', 'fr', 'name', 'De 26 à 75 Tonnes métriques', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-025', 'en', 'name', '26 to 75 Metric Tons', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-026', 'fr', 'name', 'De 76 à 150 Tonnes métriques', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-026', 'en', 'name', '76 to 150 Metric Tons', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-027', 'fr', 'name', '16+A28:A33', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-027', 'en', 'name', '16+A28:A33', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-028', 'fr', 'name', 'Plus de 300 Tonnes métriques', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-028', 'en', 'name', 'More than 300 Metric Tons', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-029', 'fr', 'name', 'RUBRIQUE', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-029', 'en', 'name', 'CATEGORY', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-030', 'fr', 'name', 'Certificat d''immatriculation original', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-030', 'en', 'name', 'Original Registration Certificate', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-031', 'fr', 'name', 'Certificat d''immatriculation temporaire ou provisoire', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-031', 'en', 'name', 'Temporary or Provisional Registration Certificate', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-032', 'fr', 'name', 'Renouvellement du certificat d''immatriculation temporaire ou provisoire', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-032', 'en', 'name', 'Renewal of Temporary or Provisional Registration Certificate', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-033', 'fr', 'name', 'Certificat d''immatriculation en double', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-033', 'en', 'name', 'Duplicate Registration Certificate', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-034', 'fr', 'name', 'Mutation de propriété', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-034', 'en', 'name', 'Change of Ownership', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-035', 'fr', 'name', 'Mention d''hypothèque (ou autres) dans le registre d''immatriculation (inscription à main levée)', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-035', 'en', 'name', 'Mortgage Mention (or others) in Registration Registry (Unencumbered Registration)', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-036', 'fr', 'name', 'Copie certifiée d''une mention dans le registre', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-036', 'en', 'name', 'Certified Copy of a Registry Mention', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-037', 'fr', 'name', 'Certificat de navigabilité et sa convalidation', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-037', 'en', 'name', 'Airworthiness Certificate and its Validation', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-038', 'fr', 'name', 'Certificat de navigabilité spécial', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-038', 'en', 'name', 'Special Airworthiness Certificate', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-039', 'fr', 'name', 'Autorisation de vol', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-039', 'en', 'name', 'Flight Permit', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-040', 'fr', 'name', 'Inscription registrale des contrats de location d''aéronefs initial et ses renouvellements', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-040', 'en', 'name', 'Initial Aircraft Leasing Contract Registration and Renewals', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-041', 'fr', 'name', 'Inscription registrale des hypothèques, gages ou autres actes juridiques portant sur la propriété des aéronefs ou de leurs composants', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-041', 'en', 'name', 'Registry Inscription of Mortgages, Pledges, or Other Legal Acts Affecting Aircraft or Aircraft Component Ownership', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-042', 'fr', 'name', 'Convalidation de certificat de navigabilité étranger', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-042', 'en', 'name', 'Validation of Foreign Airworthiness Certificate', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-043', 'fr', 'name', 'Certificat d''exploitation d''installation radioélectrique embarquée', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-043', 'en', 'name', 'On-board Radioelectric Installation Operation Certificate', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-044', 'fr', 'name', 'Certificat de limitation du bruit', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-044', 'en', 'name', 'Noise Limitation Certificate', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-045', 'fr', 'name', 'Autorisations spéciales (MNSP, PRNAV, BRNAV, CAT)', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-045', 'en', 'name', 'Special Authorizations (MNSP, PRNAV, BRNAV, CAT)', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-046', 'fr', 'name', 'Terrain construit (par mètre carré)', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-046', 'en', 'name', 'Developed Land (per square meter)', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-047', 'fr', 'name', 'Terrain non construit (par mètre carré)', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-047', 'en', 'name', 'Undeveloped Land (per square meter)', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-048', 'fr', 'name', 'Autorisation d''atterrissage (par atterrissage)', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-048', 'en', 'name', 'Landing Authorization (per landing)', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-049', 'fr', 'name', 'Autorisation de survol', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-049', 'en', 'name', 'Overflight Authorization', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-050', 'fr', 'name', 'Inspection du site et étude du dossier', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-050', 'en', 'name', 'Site Inspection and File Study', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-051', 'fr', 'name', 'Production de documents techniques', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-051', 'en', 'name', 'Technical Document Production', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-052', 'fr', 'name', 'Autres validations', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-052', 'en', 'name', 'Other Validations', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-053', 'fr', 'name', 'Zone d''accès au Terminal (moins de 10 minutes)', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-053', 'en', 'name', 'Terminal Access Zone (less than 10 minutes)', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-054', 'fr', 'name', 'Zone d''accès au Terminal (première heure de stationnement)', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-054', 'en', 'name', 'Terminal Access Zone (first hour of parking)', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-055', 'fr', 'name', 'Zone d''accès au Terminal (après la première heure)', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-055', 'en', 'name', 'Terminal Access Zone (after the first hour)', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-056', 'fr', 'name', 'Zone d''accès au Terminal (une journée)', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-056', 'en', 'name', 'Terminal Access Zone (one day)', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-057', 'fr', 'name', 'Aéronefs de l''État (ne réalisant pas de vols commerciaux)', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-057', 'en', 'name', 'State Aircraft (not performing commercial flights)', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-058', 'fr', 'name', 'Aéronefs du Gouvernement (ne réalisant pas de vols commerciaux)', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-058', 'en', 'name', 'Government Aircraft (not performing commercial flights)', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-059', 'fr', 'name', 'Aéronefs des services officiels de la République (ne réalisant pas de vols commerciaux)', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-059', 'en', 'name', 'Aircraft of Official Republic Services (not performing commercial flights)', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-060', 'fr', 'name', 'Tous les aéronefs militaires et gouvernementaux des pays amis (en service non aérocommercial)', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-060', 'en', 'name', 'All Military and Governmental Aircraft from Friendly Countries (in non-commercial service)', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-061', 'fr', 'name', 'Carnets de moteurs', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-061', 'en', 'name', 'Engine Logbooks', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-062', 'fr', 'name', 'Carnets d''hélices', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-062', 'en', 'name', 'Propeller Logbooks', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-063', 'fr', 'name', 'Carnets d''aéronefs', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-063', 'en', 'name', 'Aircraft Logbooks', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-064', 'fr', 'name', 'Demandes d''établissement de mémoire technique pour réparations mineures', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-064', 'en', 'name', 'Minor Repair Technical Memory Establishment Requests', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-065', 'fr', 'name', 'Demandes d''établissement de mémoire technique pour modifications majeures', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-065', 'en', 'name', 'Major Modification Technical Memory Establishment Requests', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-066', 'fr', 'name', 'AUTORISATIONS D''EXPLOITATION', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-066', 'en', 'name', 'OPERATING AUTHORIZATIONS', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-067', 'fr', 'name', 'RUBRIQUE', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-067', 'en', 'name', 'CATEGORY', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-068', 'fr', 'name', 'Inspection opérationnelle relative au permis d''exploitation ou à une acceptation', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-068', 'en', 'name', 'Operational Inspection Related to Operating Permit or Acceptance', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-069', 'fr', 'name', 'Inspection opérationnelle relative au permis d''exploitation ou à une acceptation', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-069', 'en', 'name', 'Operational Inspection Related to Operating Permit or Acceptance', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-070', 'fr', 'name', 'Inspection opérationnelle relative au permis d''exploitation ou à une acceptation', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-070', 'en', 'name', 'Operational Inspection Related to Operating Permit or Acceptance', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-071', 'fr', 'name', 'Acceptation de transporteur étranger', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-071', 'en', 'name', 'Foreign Carrier Acceptance', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-072', 'fr', 'name', 'Acceptation de transporteur étranger', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-072', 'en', 'name', 'Foreign Carrier Acceptance', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-073', 'fr', 'name', 'Acceptation de transporteur étranger', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-073', 'en', 'name', 'Foreign Carrier Acceptance', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-074', 'fr', 'name', 'Licence d''exploitation', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-074', 'en', 'name', 'Operating License', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-075', 'fr', 'name', 'Licence d''exploitation', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-075', 'en', 'name', 'Operating License', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-076', 'fr', 'name', 'Licence d''exploitation', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-076', 'en', 'name', 'Operating License', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-077', 'fr', 'name', 'Certificat de transporteur aérien (AOC) vols réguliers de passagers', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-077', 'en', 'name', 'Air Operator Certificate (AOC) for Regular Passenger Flights', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-078', 'fr', 'name', 'Certificat de transporteur aérien (AOC) vols réguliers de passagers', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-078', 'en', 'name', 'Air Operator Certificate (AOC) for Regular Passenger Flights', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-079', 'fr', 'name', 'Certificat de transporteur aérien (AOC) vols réguliers de passagers', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-079', 'en', 'name', 'Air Operator Certificate (AOC) for Regular Passenger Flights', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-080', 'fr', 'name', 'Certificat de transporteur aérien (AOC) fret', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-080', 'en', 'name', 'Air Operator Certificate (AOC) for Cargo', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-081', 'fr', 'name', 'Certificat de transporteur aérien (AOC) fret', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-081', 'en', 'name', 'Air Operator Certificate (AOC) for Cargo', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-082', 'fr', 'name', 'Certificat de transporteur aérien (AOC) fret', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-082', 'en', 'name', 'Air Operator Certificate (AOC) for Cargo', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-083', 'fr', 'name', 'Autorisation d''exploitation aérienne (AOC) Aviation Générale', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-083', 'en', 'name', 'Air Operator Certificate (AOC) for General Aviation', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-084', 'fr', 'name', 'Autorisation d''exploitation aérienne (AOC) Aviation Générale', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-084', 'en', 'name', 'Air Operator Certificate (AOC) for General Aviation', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-085', 'fr', 'name', 'Autorisation d''exploitation aérienne (AOC) Aviation Générale', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-085', 'en', 'name', 'Air Operator Certificate (AOC) for General Aviation', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-086', 'fr', 'name', 'Établissement des spécifications d''exploitation', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-086', 'en', 'name', 'Establishment of Operating Specifications', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-087', 'fr', 'name', 'Établissement des spécifications d''exploitation', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-087', 'en', 'name', 'Establishment of Operating Specifications', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-088', 'fr', 'name', 'Établissement des spécifications d''exploitation', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-088', 'en', 'name', 'Establishment of Operating Specifications', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-089', 'fr', 'name', 'Modification de l''annexe au certificat de transporteur aérien', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-089', 'en', 'name', 'Modification of Air Operator Certificate Annex', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-090', 'fr', 'name', 'Modification de l''annexe au certificat de transporteur aérien', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-090', 'en', 'name', 'Modification of Air Operator Certificate Annex', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-091', 'fr', 'name', 'Modification de l''annexe au certificat de transporteur aérien', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-091', 'en', 'name', 'Modification of Air Operator Certificate Annex', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-092', 'fr', 'name', 'Acceptation d''un centre de formation (aéroclub)', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-092', 'en', 'name', 'Acceptance of a Training Center (Aeroclub)', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-093', 'fr', 'name', 'Acceptation d''un centre de formation (formation professionnelle)', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-093', 'en', 'name', 'Acceptance of a Training Center (Professional Training)', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-094', 'fr', 'name', 'Certificat d''un prestataire de services de navigation aérienne', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-094', 'en', 'name', 'Certificate of an Air Navigation Service Provider', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-095', 'fr', 'name', 'Certificat d''un prestataire de services de navigation aérienne', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-095', 'en', 'name', 'Certificate of an Air Navigation Service Provider', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-096', 'fr', 'name', 'RUBRIQUE AÉRODROMES', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-096', 'en', 'name', 'AERODROME CATEGORY', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-097', 'fr', 'name', 'Inspection initiale et choix du site', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-097', 'en', 'name', 'Initial Inspection and Site Selection', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-098', 'fr', 'name', 'Autorisation/Homologation', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-098', 'en', 'name', 'Authorization/Approval', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-099', 'fr', 'name', 'Certification AR 5,7', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-099', 'en', 'name', 'AR 5.7 Certification', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-100', 'fr', 'name', '5,7 T inférieure à AR 10T', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-100', 'en', 'name', '5.7 T less than AR 10T', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-101', 'fr', 'name', '10 T inférieure à AR 30T', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-101', 'en', 'name', '10 T less than AR 30T', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-102', 'fr', 'name', '30 T inférieure à AR 50 T', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-102', 'en', 'name', '30 T less than AR 50 T', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-103', 'fr', 'name', '50 T inférieure à AR 100 T', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-103', 'en', 'name', '50 T less than AR 100 T', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-104', 'fr', 'name', '100 T inférieure à AR 200 T', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-104', 'en', 'name', '100 T less than AR 200 T', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-105', 'fr', 'name', 'AR supérieure à 200 T', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-105', 'en', 'name', 'AR greater than 200 T', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-106', 'fr', 'name', 'Inspection périodique', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-106', 'en', 'name', 'Periodic Inspection', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-107', 'fr', 'name', 'Licence d''agent d''exploitation', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-107', 'en', 'name', 'Operational Agent License', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-108', 'fr', 'name', 'Licence de mécanicien', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-108', 'en', 'name', 'Mechanic License', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-109', 'fr', 'name', 'Licence de contrôleur de la navigation aérienne', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-109', 'en', 'name', 'Air Navigation Controller License', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-110', 'fr', 'name', 'Qualification de contrôleur de la navigation aérienne', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-110', 'en', 'name', 'Air Navigation Controller Qualification', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-111', 'fr', 'name', 'Autres licences', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-111', 'en', 'name', 'Other Licenses', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-112', 'fr', 'name', 'Carte d''étudiant', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-112', 'en', 'name', 'Student Card', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-113', 'fr', 'name', 'Aéronefs étrangers (F.CFA/Tm/heure)', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-113', 'en', 'name', 'Foreign Aircraft (F.CFA/Tm/hour)', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-114', 'fr', 'name', 'Aéronefs étrangers sur terrain de base opérationnelle sous contrat (F.CFA/Tm)', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-114', 'en', 'name', 'Foreign Aircraft on Operational Base Land under Contract (F.CFA/Tm)', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-115', 'fr', 'name', 'Aéronefs nationaux hors du terrain de base (F.CFA par Tm/heure)', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-115', 'en', 'name', 'National Aircraft outside Base Land (F.CFA per Tm/hour)', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-116', 'fr', 'name', 'Passagers sur vols nationaux (F.CFA/passager)', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-116', 'en', 'name', 'Passengers on National Flights (F.CFA/passenger)', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-117', 'fr', 'name', 'Passagers sur vols sous-régionaux (F.CFA/passager)', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-117', 'en', 'name', 'Passengers on Subregional Flights (F.CFA/passenger)', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-118', 'fr', 'name', 'Passagers sur vols internationaux (F.CFA/passager)', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-118', 'en', 'name', 'Passengers on International Flights (F.CFA/passenger)', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-119', 'fr', 'name', 'Carburant vols nationaux F.CFA/litre en vols réguliers', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-119', 'en', 'name', 'Fuel for National Flights F.CFA/liter in Regular Flights', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-120', 'fr', 'name', 'Carburant vols internationaux F.CFA/litre en vols réguliers', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-120', 'en', 'name', 'Fuel for International Flights F.CFA/liter in Regular Flights', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-121', 'fr', 'name', 'Basse intensité par mouvement (atterrissage ou décollage) à Malabo ou Bata', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-121', 'en', 'name', 'Low Intensity per Movement (Landing or Takeoff) in Malabo or Bata', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-122', 'fr', 'name', 'Basse intensité par mouvement (Mongomeyen, Corisco et Annobón)', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-122', 'en', 'name', 'Low Intensity per Movement (Mongomeyen, Corisco and Annobón)', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-123', 'fr', 'name', 'Haute intensité par mouvement (dans les aéroports de Malabo et Bata)', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-123', 'en', 'name', 'High Intensity per Movement (in Malabo and Bata Airports)', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-124', 'fr', 'name', 'Haute intensité par mouvement (dans les aéroports de Mongomeyen, Corisco et Annobón)', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-124', 'en', 'name', 'High Intensity per Movement (in Mongomeyen, Corisco and Annobón Airports)', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-126', 'fr', 'name', 'Carte d''étudiant', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-126', 'en', 'name', 'Student Card', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-127', 'fr', 'name', 'Carnet de Vol', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-127', 'en', 'name', 'Flight Logbook', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-128', 'fr', 'name', 'Licence', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-128', 'en', 'name', 'License', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-129', 'fr', 'name', 'Validation de licence étrangère', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-129', 'en', 'name', 'Foreign License Validation', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-130', 'fr', 'name', 'Autorisation provisoire d''instructeur', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-130', 'en', 'name', 'Provisional Instructor Authorization', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-131', 'fr', 'name', 'Renouvellement de la carte d''étudiant', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-131', 'en', 'name', 'Student Card Renewal', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-132', 'fr', 'name', 'Ouverture ou fermeture du carnet de vol', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-132', 'en', 'name', 'Flight Logbook Opening or Closing', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-133', 'fr', 'name', 'Renouvellement de licence', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-133', 'en', 'name', 'License Renewal', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-134', 'fr', 'name', 'Qualification', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-134', 'en', 'name', 'Qualification', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-135', 'fr', 'name', 'Autres mentions sur la licence', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-135', 'en', 'name', 'Other Endorsements on the License', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-136', 'fr', 'name', 'Passagers à destination de tout aéroport international / F.CFA par passager', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-136', 'en', 'name', 'Passengers to Any International Airport / F.CFA per Passenger', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-137', 'fr', 'name', 'Vols nationaux', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-137', 'en', 'name', 'National Flights', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-138', 'fr', 'name', 'Vols à destination des pays CEMAC', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-138', 'en', 'name', 'Flights to CEMAC Countries', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-139', 'fr', 'name', 'Vols à destination d''autres pays', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-139', 'en', 'name', 'Flights to Other Countries', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-140', 'fr', 'name', 'Fret et excédent de bagages', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-140', 'en', 'name', 'Freight and Excess Baggage', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-141', 'fr', 'name', 'Autres aéroports (les 3 premières heures)', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-141', 'en', 'name', 'Other Airports (first 3 hours)', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-142', 'fr', 'name', 'Autres aéroports (après les 3 premières heures, par tranche de 2 heures supplémentaires)', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-142', 'en', 'name', 'Other Airports (after first 3 hours, per 2-hour additional fraction)', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-143', 'fr', 'name', 'Pour les trois (03) premières heures', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-143', 'en', 'name', 'For the first three (03) hours', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-144', 'fr', 'name', 'De la 3ème à la 5ème heure', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-144', 'en', 'name', 'From 3rd to 5th hour', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-145', 'fr', 'name', 'À partir de la 5ème', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-145', 'en', 'name', 'From the 5th hour onwards', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-146', 'fr', 'name', 'Avions de plus de 100 Tm', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-146', 'en', 'name', 'Aircraft over 100 Metric Tons', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-147', 'fr', 'name', 'Pour les trois (03) premières heures', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-147', 'en', 'name', 'For the first three (03) hours', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-148', 'fr', 'name', 'De la 3ème à la 5ème heure', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-148', 'en', 'name', 'From 3rd to 5th hour', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-149', 'fr', 'name', 'À partir de la 5ème', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-149', 'en', 'name', 'From the 5th hour onwards', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-150', 'fr', 'name', 'Vols nationaux (F.CFA par mouvement)', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-150', 'en', 'name', 'National Flights (F.CFA per Movement)', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-151', 'fr', 'name', 'Vols régionaux (F.CFA par mouvement)', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-151', 'en', 'name', 'Regional Flights (F.CFA per Movement)', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-152', 'fr', 'name', 'Vols internationaux (F.CFA par mouvement)', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-152', 'en', 'name', 'International Flights (F.CFA per Movement)', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-153', 'fr', 'name', 'Assistance au sol pour les compagnies aériennes et autres utilisateurs', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-153', 'en', 'name', 'Ground Assistance for Airlines and Other Users', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-154', 'fr', 'name', 'Jet A1 vendu (par litre)', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-154', 'en', 'name', 'Jet A1 Sold (per liter)', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-155', 'fr', 'name', 'Passagers à destination des aéroports de la CEMAC', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-155', 'en', 'name', 'Passengers to CEMAC Airports', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-156', 'fr', 'name', 'Passagers à destination de tout autre aéroport international', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-156', 'en', 'name', 'Passengers to Any Other International Airport', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-157', 'fr', 'name', 'Payeront par F.CFA/litre pour les vols internationaux', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-157', 'en', 'name', 'Will Pay F.CFA/liter for International Flights', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-158', 'fr', 'name', 'Par KG de fret (fret de provenance ou destination nationale)', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-158', 'en', 'name', 'Per KG of Freight (Cargo of National Origin or Destination)', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-159', 'fr', 'name', 'Par KG de fret (fret de provenance ou destination CEMAC)', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-159', 'en', 'name', 'Per KG of Freight (Cargo of CEMAC Origin or Destination)', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-160', 'fr', 'name', 'Par KG (fret avec provenance ou destination de tout aéroport international)', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-160', 'en', 'name', 'Per KG (Cargo with Origin or Destination from Any International Airport)', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-161', 'fr', 'name', 'Par colis du passager (bagages accompagnés), colis des passagers à destination nationale', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-161', 'en', 'name', 'Per Passenger Package (Accompanied Baggage), Passenger Packages with National Destination', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-162', 'fr', 'name', 'Par colis du passager (bagages accompagnés), colis des passagers à destination de tout aéroport international', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-162', 'en', 'name', 'Per Passenger Package (Accompanied Baggage), Passenger Packages Destined for Any International Airport', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-163', 'fr', 'name', 'Aéronefs avec masse maximale au décollage inférieure à 25 tonnes métriques', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-163', 'en', 'name', 'Aircraft with Maximum Takeoff Weight below 25 Metric Tons', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-164', 'fr', 'name', 'Aéronefs avec un poids maximal au décollage égal ou supérieur à 25 et inférieur à 90 tonnes métriques', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-164', 'en', 'name', 'Aircraft with maximum takeoff weight equal to or greater than 25 and less than 90 metric tons', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-165', 'fr', 'name', 'Aéronefs avec un poids maximal au décollage supérieur à 90 tonnes métriques', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-165', 'en', 'name', 'Aircraft with maximum takeoff weight exceeding 90 metric tons', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-166', 'fr', 'name', 'Aéronefs avec un poids maximal au décollage inférieur à 25 tonnes métriques', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-166', 'en', 'name', 'Aircraft with maximum takeoff weight less than 25 metric tons', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-167', 'fr', 'name', 'Aéronefs avec un poids maximal au décollage égal ou supérieur à 25 et inférieur à 90 tonnes métriques', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-167', 'en', 'name', 'Aircraft with maximum takeoff weight equal to or greater than 25 and less than 90 metric tons', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-168', 'fr', 'name', 'Aéronefs avec un poids maximal au décollage supérieur à 90 tonnes métriques', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-168', 'en', 'name', 'Aircraft with maximum takeoff weight exceeding 90 metric tons', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-169', 'fr', 'name', 'Entreprises de gros', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-169', 'en', 'name', 'Wholesale companies', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-170', 'fr', 'name', 'Entreprises de détail', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-170', 'en', 'name', 'Retail companies', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-171', 'fr', 'name', 'Commerçants ambulants', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-171', 'en', 'name', 'Street vendors', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-172', 'fr', 'name', 'Enregistrement importateur-exportateur', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-172', 'en', 'name', 'Importer-exporter registration', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-173', 'fr', 'name', 'Liste des prix', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-173', 'en', 'name', 'Price list', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-174', 'fr', 'name', 'Autorisation d''exportation de marchandises', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-174', 'en', 'name', 'Goods export authorization', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-175', 'fr', 'name', 'Autorisation d''exportation de viande animale', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-175', 'en', 'name', 'Animal meat export authorization', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-176', 'fr', 'name', 'Autorisation d''exportation d''objet d''art', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-176', 'en', 'name', 'Art object export authorization', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-177', 'fr', 'name', 'Fournisseurs, marchandises, prolongation de délai', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-177', 'en', 'name', 'Suppliers, goods, deadline extension', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-178', 'fr', 'name', 'Entreprises de gros', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-178', 'en', 'name', 'Wholesale companies', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-179', 'fr', 'name', 'Entreprises de détail', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-179', 'en', 'name', 'Retail companies', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-180', 'fr', 'name', 'Autorisation professionnelle de six (6) mois', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-180', 'en', 'name', 'Six (6) month professional authorization', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-181', 'fr', 'name', 'Autorisation d''introduction de marchandises arrivées en transit dans le pays', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-181', 'en', 'name', 'Authorization for introduction of goods arrived in transit in the country', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-182', 'fr', 'name', 'Autorisation de commercialisation de marchandises de contrebande', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-182', 'en', 'name', 'Authorization for commercialization of smuggled goods', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-183', 'fr', 'name', 'Licence générale', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-183', 'en', 'name', 'General license', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-184', 'fr', 'name', 'Licence temporaire', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-184', 'en', 'name', 'Temporary license', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-185', 'fr', 'name', 'Licence spécifique', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-185', 'en', 'name', 'Specific license', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-186', 'fr', 'name', 'Autorisation de distribution de produits dans le pays', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-186', 'en', 'name', 'Authorization for product distribution in the country', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-187', 'fr', 'name', 'Exportation de bois rond', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-187', 'en', 'name', 'Round wood export', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-188', 'fr', 'name', 'Exportation de bois scié', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-188', 'en', 'name', 'Sawn wood export', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-189', 'fr', 'name', 'Feuille commerciale', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-189', 'en', 'name', 'Commercial sheet', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-190', 'fr', 'name', 'Carnet commercial', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-190', 'en', 'name', 'Commercial booklet', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-191', 'fr', 'name', 'Certificat d''ouverture', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-191', 'en', 'name', 'Opening certificate', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-192', 'fr', 'name', 'Certificat de recherche de documents', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-192', 'en', 'name', 'Document search certificate', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-193', 'fr', 'name', 'Certificat de dissolution d''entreprise', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-193', 'en', 'name', 'Company dissolution certificate', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-194', 'fr', 'name', 'Certificat d''exportation temporaire', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-194', 'en', 'name', 'Temporary export certificate', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-195', 'fr', 'name', '1% sur la valeur CAF entrant dans la zone unique des douanes', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-195', 'en', 'name', '1% on CIF value entering the single customs zone', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-196', 'fr', 'name', 'Évaluation de bien', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-196', 'en', 'name', 'Asset valuation', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-197', 'fr', 'name', 'Autorisation d''importation de marchandises', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-197', 'en', 'name', 'Goods import authorization', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-198', 'fr', 'name', 'Factures visées dans les missions diplomatiques', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-198', 'en', 'name', 'Invoices validated at diplomatic missions', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-199', 'fr', 'name', 'Factures non visées dans les missions diplomatiques OK', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-199', 'en', 'name', 'Invoices not validated at diplomatic missions OK', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-200', 'fr', 'name', 'Factures non visées dans les missions diplomatiques NOK', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-200', 'en', 'name', 'Invoices not validated at diplomatic missions NOK', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-223', 'fr', 'name', 'Représentation de cirques étrangers. Par autorisation', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-223', 'en', 'name', 'Foreign circus performance. Per authorization', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-224', 'fr', 'name', 'Représentations théâtrales étrangères', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-224', 'en', 'name', 'Foreign theatrical performances', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-225', 'fr', 'name', 'Représentations de carnavals. Par représentation', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-225', 'en', 'name', 'Carnival performances. Per performance', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-226', 'fr', 'name', 'Représentations nationales maximum 20 personnes', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-226', 'en', 'name', 'National performances maximum 20 people', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-227', 'fr', 'name', 'Représentations nationales de 20 à 50 personnes', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-227', 'en', 'name', 'National performances from 20 to 50 people', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-228', 'fr', 'name', 'Représentations nationales de 50 à 100 personnes', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-228', 'en', 'name', 'National performances from 50 to 100 people', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-229', 'fr', 'name', 'Représentations étrangères ou internationales maximum 20 personnes', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-229', 'en', 'name', 'Foreign or international performances maximum 20 people', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-230', 'fr', 'name', 'Représentations étrangères de 20 à 50 personnes', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-230', 'en', 'name', 'Foreign performances from 20 to 50 people', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-231', 'fr', 'name', 'Représentations étrangères de 50 à 100 personnes', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-231', 'en', 'name', 'Foreign performances from 50 to 100 people', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-232', 'fr', 'name', 'Représentations étrangères de plus de 100 personnes', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-232', 'en', 'name', 'Foreign performances of more than 100 people', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-233', 'fr', 'name', 'Salles de cinéma', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-233', 'en', 'name', 'Movie theaters', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-234', 'fr', 'name', 'Distributeurs de films', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-234', 'en', 'name', 'Film distributors', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-235', 'fr', 'name', 'Vidéo-club projection de ville', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-235', 'en', 'name', 'City video club projection', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-236', 'fr', 'name', 'Vidéo-club village', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-236', 'en', 'name', 'Village video club', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-237', 'fr', 'name', 'Vidéo-Club distribution', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-237', 'en', 'name', 'Video Club distribution', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-238', 'fr', 'name', 'Cadreurs', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-238', 'en', 'name', 'Cameramen', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-239', 'fr', 'name', 'Tournage de film 16,35 70 mm. Chaque fois', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-239', 'en', 'name', 'Film shooting 16,35 70 mm. Each time', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-240', 'fr', 'name', 'Vente de cassettes, CD, DVD', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-240', 'en', 'name', 'Sale of cassettes, CD, DVD', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-241', 'fr', 'name', 'Musiciens nationaux (par représentation)', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-241', 'en', 'name', 'National musicians (per performance)', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-242', 'fr', 'name', 'Musiciens étrangers (par représentation)', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-242', 'en', 'name', 'Foreign musicians (per performance)', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-243', 'fr', 'name', 'Studios photographiques', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-243', 'en', 'name', 'Photography studios', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-244', 'fr', 'name', 'Photographes Ambulants', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-244', 'en', 'name', 'Street Photographers', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-245', 'fr', 'name', 'Propagande Imprimerie', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-245', 'en', 'name', 'Printing Propaganda', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-246', 'fr', 'name', 'Publicité parkings', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-246', 'en', 'name', 'Parking advertising', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-247', 'fr', 'name', 'Panneaux plus de 1m de long sur 1 de large', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-247', 'en', 'name', 'Panels more than 1m long by 1m wide', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-248', 'fr', 'name', 'Panneaux de 1m de long sur 1 de large', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-248', 'en', 'name', 'Panels 1m long by 1m wide', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-249', 'fr', 'name', 'Panneaux de 1m de long sur 0,5m de large', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-249', 'en', 'name', 'Panels 1m long by 0.5m wide', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-250', 'fr', 'name', 'Panneaux de 1m de long sur 0,25m de large', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-250', 'en', 'name', 'Panels 1m long by 0.25m wide', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-251', 'fr', 'name', 'Panneaux de 1m de long sur 0,10m de large', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-251', 'en', 'name', 'Panels 1m long by 0.10m wide', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-252', 'fr', 'name', 'Panneaux de 0,25m de long sur 0,25m de large', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-252', 'en', 'name', 'Panels 0.25m long by 0.25m wide', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-253', 'fr', 'name', 'Carte d''artiste', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-253', 'en', 'name', 'Artist card', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-254', 'fr', 'name', 'Certificat Censure de film', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-254', 'en', 'name', 'Movie Censorship Certificate', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-255', 'fr', 'name', 'Participation aux représentations d''artistes engagés. ( % ) Sur recettes', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-255', 'en', 'name', 'Participation in contracted artists performance. ( % ) On revenue', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-256', 'fr', 'name', 'Visite de musée', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-256', 'en', 'name', 'Museum visit', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-257', 'fr', 'name', 'Locaux, ateliers et boutiques artisanales et renouvellement', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-257', 'en', 'name', 'Premises, workshops and craft shops and renewal', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-258', 'fr', 'name', 'Ouverture d''ateliers d''artisanat et renouvellements', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-258', 'en', 'name', 'Opening of craft workshops and renewals', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-259', 'fr', 'name', 'Vitrines d''objets d''art', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-259', 'en', 'name', 'Art object display cases', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-260', 'fr', 'name', 'Enseignes permanentes pour hôtels et autres établissements similaires', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-260', 'en', 'name', 'Permanent signs for hotels and other similar establishments', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-261', 'fr', 'name', 'Salon de coiffure catégorie A', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-261', 'en', 'name', 'Hairdressing salon category A', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-262', 'fr', 'name', 'Salon de coiffure catégorie B', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-262', 'en', 'name', 'Hairdressing salon category B', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-263', 'fr', 'name', 'Salon de coiffure catégorie C', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-263', 'en', 'name', 'Hairdressing salon category C', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-264', 'fr', 'name', 'Enseignes permanentes pour bars, vidéo-clubs, cinémas, théâtres et salles des fêtes', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-264', 'en', 'name', 'Permanent signs for bars, video clubs, cinemas, theaters and party halls', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-265', 'fr', 'name', 'Enseignes temporaires', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-265', 'en', 'name', 'Temporary signs', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-266', 'fr', 'name', 'Carte d''Artiste plasticien', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-266', 'en', 'name', 'Visual Artist Card', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-267', 'fr', 'name', 'Agences de voyages, grossistes', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-267', 'en', 'name', 'Travel agencies, wholesalers', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-268', 'fr', 'name', 'Hôtels cinq étoiles/Appart-hôtels cinq clés Pour ouverture et début d''activités', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-268', 'en', 'name', 'Five-star hotels/Five-key apart-hotels For opening and start of activities', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-269', 'fr', 'name', 'Hôtels quatre étoiles/Appart-hôtels quatre clés Pour ouverture et début d''activités', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-269', 'en', 'name', 'Four-star hotels/Four-key apart-hotels For opening and start of activities', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-270', 'fr', 'name', 'Hôtels trois étoiles/Appart-hôtels trois clés pour ouverture et début d''activités', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-270', 'en', 'name', 'Three-star hotels/Three-key apart-hotels for opening and start of activities', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-271', 'fr', 'name', 'Hôtels deux étoiles/Appart-hôtels deux clés pour ouverture et début d''activités', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-271', 'en', 'name', 'Two-star hotels/Two-key apart-hotels for opening and start of activities', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-272', 'fr', 'name', 'Hôtels une étoile/Appart-hôtels une clé/Auberges et Pensions pour ouverture et début d''activités', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-272', 'en', 'name', 'One-star hotels/One-key apart-hotels/Hostels and Guesthouses for opening and start of activities', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-273', 'fr', 'name', 'Certificat de classification d''établissement', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-273', 'en', 'name', 'Establishment classification certificate', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-274', 'fr', 'name', 'Restaurants type A pour ouverture et début d''activités', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-274', 'en', 'name', 'Type A restaurants for opening and start of activities', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-275', 'fr', 'name', 'Restaurants type B pour ouverture et début d''activités', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-275', 'en', 'name', 'Type B restaurants for opening and start of activities', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-276', 'fr', 'name', 'Cafétérias (Snack bar - pâtisseries type A) Pour ouverture et début d''activités', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-276', 'en', 'name', 'Cafeterias (Snack bar - type A pastry shops) For opening and start of activities', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-277', 'fr', 'name', 'Cafétérias (Snack bar - pâtisseries type B) Pour ouverture et début d''activités', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-277', 'en', 'name', 'Cafeterias (Snack bar - type B pastry shops) For opening and start of activities', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-278', 'fr', 'name', 'Bars catégorie A Pour ouverture et début d''activités', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-278', 'en', 'name', 'Category A bars For opening and start of activities', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-279', 'fr', 'name', 'Bars type B', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-279', 'en', 'name', 'Type B bars', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-280', 'fr', 'name', 'Bars type C, dans les Quartiers et périphéries', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-280', 'en', 'name', 'Type C bars, in Neighborhoods and peripheries', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-281', 'fr', 'name', 'Discothèques, Pubs nocturnes et similaires catégorie A', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-281', 'en', 'name', 'Nightclubs, Night pubs and similar category A', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-282', 'fr', 'name', 'Discothèques, Pubs nocturnes et similaires catégorie B', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-282', 'en', 'name', 'Nightclubs, Night pubs and similar category B', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-283', 'fr', 'name', 'Casinos Pour ouverture et début d''activités', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-283', 'en', 'name', 'Casinos For opening and start of activities', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-284', 'fr', 'name', 'Taxe mensuelle par machine', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-284', 'en', 'name', 'Monthly fee per machine', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-285', 'fr', 'name', 'Taxe mensuelle par table de jeu', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-285', 'en', 'name', 'Monthly fee per gaming table', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-286', 'fr', 'name', 'Salles de jeux de hasard et machines à sous', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-286', 'en', 'name', 'Gambling halls and slot machines', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-287', 'fr', 'name', 'Taxe mensuelle par machine à sous', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-287', 'en', 'name', 'Monthly fee per slot machine', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-288', 'fr', 'name', 'Loteries', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-288', 'en', 'name', 'Lotteries', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-289', 'fr', 'name', 'Par prix', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-289', 'en', 'name', 'Per prize', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-290', 'fr', 'name', 'Tombolas', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-290', 'en', 'name', 'Raffles', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-291', 'fr', 'name', 'Cinéastes professionnels safari', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-291', 'en', 'name', 'Professional safari filmmakers', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-292', 'fr', 'name', 'Cinéastes safari', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-292', 'en', 'name', 'Safari filmmakers', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-293', 'fr', 'name', 'Autorisations pour visite touristique locaux. Par personne et pour 7 jours', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-293', 'en', 'name', 'Authorizations for native tourist visit. Per person and for 7 days', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-294', 'fr', 'name', 'Autorisations pour visite touristique Étrangers. Par personne et pour 7 jours', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-294', 'en', 'name', 'Authorizations for foreign tourist visit. Per person and for 7 days', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-295', 'fr', 'name', 'Agences de voyages grossistes', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-295', 'en', 'name', 'Wholesale travel agencies', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-296', 'fr', 'name', 'Agences de voyages détaillants', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-296', 'en', 'name', 'Retail travel agencies', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-297', 'fr', 'name', 'Agences opérateurs touristiques', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-297', 'en', 'name', 'Tour operator agencies', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-298', 'fr', 'name', 'Agences de voyages et Location de Véhicules', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-298', 'en', 'name', 'Travel agencies and Vehicle Rental', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-331', 'fr', 'name', 'Autorisation d''achat de fusil de chasse', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-331', 'en', 'name', 'Shotgun purchase authorization', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-332', 'fr', 'name', 'Autorisation d''importation de fusil de chasse', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-332', 'en', 'name', 'Shotgun import authorization', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-333', 'fr', 'name', 'Autorisation d''importation de cartouches de chasse (par boîte)', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-333', 'en', 'name', 'Hunting cartridge import authorization (per box)', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-334', 'fr', 'name', 'Révision annuelle des armes de chasse', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-334', 'en', 'name', 'Annual hunting weapons inspection', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-335', 'fr', 'name', 'Guide de possession d''armes', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-335', 'en', 'name', 'Weapons ownership guide', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-336', 'fr', 'name', 'Autorisation de construction de pirogues avec bois abandonné sur la plage, par mètre de longueur', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-336', 'en', 'name', 'Authorization for dugout canoe construction with abandoned log on beach, per meter of length', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-337', 'fr', 'name', 'Autorisation de construction de pirogues avec bois coupé, par mètre de longueur', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-337', 'en', 'name', 'Authorization for dugout canoe construction with cut wood, per meter of length', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-338', 'fr', 'name', 'Autorisation de pirogue type CANOË pour la pêche ou le trafic naval', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-338', 'en', 'name', 'CANOE type dugout canoe authorization for fishing or naval traffic', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-339', 'fr', 'name', 'Autorisation de mise à l''eau des embarcations (sauf pirogues) par tonne', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-339', 'en', 'name', 'Vessel launching authorization (except dugouts) per ton', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-340', 'fr', 'name', 'Autorisation d''échouage', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-340', 'en', 'name', 'Beaching authorization', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-341', 'fr', 'name', 'Embarcation de plaisance', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-341', 'en', 'name', 'Recreational vessel', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-342', 'fr', 'name', 'Embarcation avec moteur intégré', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-342', 'en', 'name', 'Vessel with inboard engine', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-343', 'fr', 'name', 'Embarcations avec moteur hors-bord ou voile', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-343', 'en', 'name', 'Vessels with outboard engine or sail', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-344', 'fr', 'name', 'Pirogue à moteur hors-bord', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-344', 'en', 'name', 'Dugout canoe with outboard motor', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-345', 'fr', 'name', 'Pirogue sans moteur', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-345', 'en', 'name', 'Non-motorized dugout canoe', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-346', 'fr', 'name', 'Enregistrement des navires par tonne', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-346', 'en', 'name', 'Ship registration per ton', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-347', 'fr', 'name', 'Provisoire', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-347', 'en', 'name', 'Provisional', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-348', 'fr', 'name', 'Définitive', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-348', 'en', 'name', 'Definitive', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-349', 'fr', 'name', 'Changement de domaine des embarcations', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-349', 'en', 'name', 'Vessel domain change', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-350', 'fr', 'name', 'Inscription de fusil sous-marin', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-350', 'en', 'name', 'Underwater speargun registration', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-351', 'fr', 'name', 'Inscription de moteur hors-bord par CV', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-351', 'en', 'name', 'Outboard engine registration per HP', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-352', 'fr', 'name', 'Carnet de navigation maritime', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-352', 'en', 'name', 'Maritime navigation card', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-353', 'fr', 'name', 'Rôle de pirogue', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-353', 'en', 'name', 'Dugout canoe role', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-354', 'fr', 'name', 'Rôle d''expédition embarcations de plaisance', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-354', 'en', 'name', 'Recreational vessel dispatch role', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-355', 'fr', 'name', 'Titre de patron', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-355', 'en', 'name', 'Skipper''s license', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-356', 'fr', 'name', 'Changement de propriété de pirogue', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-356', 'en', 'name', 'Dugout canoe ownership change', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-357', 'fr', 'name', 'Occupation zone maritime terrestre propriétés urbaines', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-357', 'en', 'name', 'Urban property maritime-terrestrial zone occupation', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-358', 'fr', 'name', 'Inscription à l''enseignement primaire', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-358', 'en', 'name', 'Primary Education Enrollment', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-359', 'fr', 'name', 'Bulletin', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-359', 'en', 'name', 'Report Card', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-360', 'fr', 'name', 'Carnet', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-360', 'en', 'name', 'Student ID Card', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-361', 'fr', 'name', 'Relevé de notes', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-361', 'en', 'name', 'Transcript', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-362', 'fr', 'name', 'Livret scolaire', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-362', 'en', 'name', 'School Record Book', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-363', 'fr', 'name', 'Inscription au baccalauréat élémentaire (ESBA)', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-363', 'en', 'name', 'Elementary Baccalaureate Enrollment (ESBA)', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-364', 'fr', 'name', 'Inscription FP1 (Sous-officier - assistant technique)', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-364', 'en', 'name', 'FP1 Enrollment (Sub-officer - Technical Assistant)', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-365', 'fr', 'name', 'Inscription au baccalauréat (supérieur)', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-365', 'en', 'name', 'Baccalaureate Enrollment (Higher)', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-366', 'fr', 'name', 'Inscription niveau master (Officier technique)', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-366', 'en', 'name', 'Master''s Level Enrollment (Technical Officer)', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-367', 'fr', 'name', 'Inscription niveau diplôme (professorat)', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-367', 'en', 'name', 'Diploma Level Enrollment (Teaching)', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-368', 'fr', 'name', 'Garderies et maternelles', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-368', 'en', 'name', 'Daycare and Preschools', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-369', 'fr', 'name', 'École primaire', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-369', 'en', 'name', 'Primary School', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-370', 'fr', 'name', 'ESBA', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-370', 'en', 'name', 'ESBA', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-371', 'fr', 'name', 'Baccalauréat', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-371', 'en', 'name', 'Baccalaureate', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-372', 'fr', 'name', 'Inscription ESBA', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-372', 'en', 'name', 'ESBA Enrollment', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-373', 'fr', 'name', 'Inscription FP1 (Sous-officier - assistant technique)', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-373', 'en', 'name', 'FP1 Enrollment (Sub-officer - Technical Assistant)', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-374', 'fr', 'name', 'Inscription au baccalauréat (supérieur)', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-374', 'en', 'name', 'Baccalaureate Enrollment (Higher)', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-375', 'fr', 'name', 'Inscription FP2 Master (Officier technique)', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-375', 'en', 'name', 'FP2 Master''s Enrollment (Technical Officer)', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-376', 'fr', 'name', 'Validation des études primaires', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-376', 'en', 'name', 'Primary studies validation', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-377', 'fr', 'name', 'Validation des études secondaires', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-377', 'en', 'name', 'Secondary studies validation', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-378', 'fr', 'name', 'Validation des études universitaires', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-378', 'en', 'name', 'University studies validation', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-379', 'fr', 'name', 'Reconnaissance des études', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-379', 'en', 'name', 'Recognition of Studies', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-380', 'fr', 'name', 'Duplicata', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-380', 'en', 'name', 'Duplicates', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-381', 'fr', 'name', 'Inscription ESBA', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-381', 'en', 'name', 'ESBA Enrollment', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-382', 'fr', 'name', 'Inscription au baccalauréat supérieur', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-382', 'en', 'name', 'Higher Baccalaureate Enrollment', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-383', 'fr', 'name', 'Examen d''entrée à l''université (cours préuniversitaire)', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-383', 'en', 'name', 'University entrance exam (pre-university course)', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-384', 'fr', 'name', 'Relevé de notes', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-384', 'en', 'name', 'Transcript', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-385', 'fr', 'name', 'Diplôme de passage de niveau', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-385', 'en', 'name', 'Grade-level diploma', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-386', 'fr', 'name', 'Inscription en licence', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-386', 'en', 'name', 'Undergraduate enrollment', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-387', 'fr', 'name', 'Inscriptions dans d''autres écoles universitaires', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-387', 'en', 'name', 'Enrollment in other university schools', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-398', 'fr', 'name', 'Immatriculation définitive, Société Anonyme (S.A)', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-398', 'en', 'name', 'Permanent registration, Public Limited Company (PLC)', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-399', 'fr', 'name', 'Immatriculation définitive, Société à Responsabilité Limitée (SARL)', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-399', 'en', 'name', 'Permanent registration, Limited Liability Company (LLC)', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-400', 'fr', 'name', 'Certificat d''Investissement', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-400', 'en', 'name', 'Investment Certificate', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-401', 'fr', 'name', 'Entreprise individuelle/Unipersonnelle/Autonome', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-401', 'en', 'name', 'Individual/Sole Proprietorship/Self-employed Business', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-402', 'fr', 'name', 'Certificat de Solvabilité Bancaire', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-402', 'en', 'name', 'Bank Solvency Certificate', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-403', 'fr', 'name', 'Autorisation de transfert rapide à l''étranger', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-403', 'en', 'name', 'Fast international transfer authorization', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-404', 'fr', 'name', 'Frais d''opérations de transfert', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-404', 'en', 'name', 'Transfer operation fees', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-405', 'fr', 'name', 'Certificat de Rémunérations', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-405', 'en', 'name', 'Income Certificate', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-406', 'fr', 'name', 'Déclaration de Revenus à l''Étranger', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-406', 'en', 'name', 'Foreign Income Declaration', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-407', 'fr', 'name', 'Certificat d''Identification de Véhicule', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-407', 'en', 'name', 'Vehicle Identification Certificate', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-408', 'fr', 'name', 'Renouvellement de documentation de Résidence et autres', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-408', 'en', 'name', 'Residence and Other Documentation Renewal', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-409', 'fr', 'name', 'Certificat de Conformité Fiscale', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-409', 'en', 'name', 'Tax Compliance Certificate', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-410', 'fr', 'name', 'Entreprises importatrices de matériel audiovisuel (canal +, strong...)', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-410', 'en', 'name', 'Audiovisual equipment importing companies (canal +, strong...)', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-411', 'fr', 'name', 'Sociétés de distribution de télévision par câble', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-411', 'en', 'name', 'Cable television distribution companies', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-412', 'fr', 'name', 'Cybercafés', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-412', 'en', 'name', 'Internet cafes', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-413', 'fr', 'name', 'Catégorie ''A''', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-413', 'en', 'name', 'Category ''A''', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-414', 'fr', 'name', 'Catégorie ''B''', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-414', 'en', 'name', 'Category ''B''', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-415', 'fr', 'name', 'Catégorie ''C''', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-415', 'en', 'name', 'Category ''C''', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-416', 'fr', 'name', 'Affiches ou panneaux lumineux : 1m', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-416', 'en', 'name', 'Illuminated posters or billboards: 1m', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-417', 'fr', 'name', 'Affiches ou panneaux lumineux : 3m', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-417', 'en', 'name', 'Illuminated posters or billboards: 3m', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-418', 'fr', 'name', 'Marquages publicitaires sur véhicules et autres moyens de transport : 1m', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-418', 'en', 'name', 'Vehicle and transport advertising paintings: 1m', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-419', 'fr', 'name', 'Peintures murales publicitaires : 1m', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-419', 'en', 'name', 'Mural advertising paintings: 1m', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-420', 'fr', 'name', 'Affichage statique non publicitaire', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-420', 'en', 'name', 'Non-commercial static display', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-421', 'fr', 'name', 'Publicité dans les publications : 1m', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-421', 'en', 'name', 'Advertising in publications: 1m', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-422', 'fr', 'name', 'Écrans géants ou publicités lumineuses : 1m', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-422', 'en', 'name', 'Giant screens or illuminated advertising: 1m', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-423', 'fr', 'name', 'Écrans géants ou publicités lumineuses : 3m', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-423', 'en', 'name', 'Giant screens or illuminated advertising: 3m', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-424', 'fr', 'name', 'Supports promotionnels ou publicitaires', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-424', 'en', 'name', 'Promotional or advertising media', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-425', 'fr', 'name', '1 page en Noir et Blanc', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-425', 'en', 'name', '1 page in Black and White', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-426', 'fr', 'name', '1 page en bichromie avec photos en couleur', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-426', 'en', 'name', '1 page in two colors with full color photos', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-427', 'fr', 'name', '1/2 page en Noir et Blanc', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-427', 'en', 'name', '1/2 page in Black and White', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-428', 'fr', 'name', '1/2 page en bichromie avec photos en couleur', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-428', 'en', 'name', '1/2 page in two colors with full color photos', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-429', 'fr', 'name', '1/2 page en quadrichromie', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-429', 'en', 'name', '1/2 page in full color', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-430', 'fr', 'name', '1/4 de page en Noir et Blanc', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-430', 'en', 'name', '1/4 page in Black and White', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-431', 'fr', 'name', '1/4 de page en bichromie', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-431', 'en', 'name', '1/4 page in two colors', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-432', 'fr', 'name', '1/4 de page en quadrichromie', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-432', 'en', 'name', '1/4 page in full color', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-433', 'fr', 'name', '1/8 de page en Noir et Blanc', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-433', 'en', 'name', '1/8 page in Black and White', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-434', 'fr', 'name', '1/8 de page en bichromie avec photos en couleur', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-434', 'en', 'name', '1/8 page in two colors with full color photos', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-435', 'fr', 'name', '1/8 de page en quadrichromie', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-435', 'en', 'name', '1/8 page in full color', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-436', 'fr', 'name', 'Bannière Centrale (595*115)', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-436', 'en', 'name', 'Central Banner (595*115)', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-437', 'fr', 'name', 'Bannière latérale (337*75)', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-437', 'en', 'name', 'Side Banner (337*75)', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-438', 'fr', 'name', 'Méga bannière latérale (337*150)', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-438', 'en', 'name', 'Side Mega Banner (337*150)', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-439', 'fr', 'name', 'Vidéo centrale (600*600)', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-439', 'en', 'name', 'Central Video (600*600)', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-440', 'fr', 'name', 'Bannière Centrale (595*115)', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-440', 'en', 'name', 'Central Banner (595*115)', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-441', 'fr', 'name', 'Bannière latérale (337*75)', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-441', 'en', 'name', 'Side Banner (337*75)', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-442', 'fr', 'name', 'Méga bannière latérale (337*150)', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-442', 'en', 'name', 'Side Mega Banner (337*150)', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-443', 'fr', 'name', 'Vidéo centrale (600*600)', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-443', 'en', 'name', 'Central Video (600*600)', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-444', 'fr', 'name', 'Catégorie ''A''', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-444', 'en', 'name', 'Category ''A''', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-445', 'fr', 'name', 'Catégorie ''B''', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-445', 'en', 'name', 'Category ''B''', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-446', 'fr', 'name', 'Catégorie ''C''', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-446', 'en', 'name', 'Category ''C''', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-447', 'fr', 'name', 'Dédicaces', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-447', 'en', 'name', 'Dedications', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-448', 'fr', 'name', 'Communiqués', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-448', 'en', 'name', 'Announcements', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-449', 'fr', 'name', 'Publicité à la minute', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-449', 'en', 'name', 'Advertising per minute', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-450', 'fr', 'name', 'Message unique', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-450', 'en', 'name', 'One-time message', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-451', 'fr', 'name', 'Message unique', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-451', 'en', 'name', 'One-time message', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-452', 'fr', 'name', 'Annonce avec photo', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-452', 'en', 'name', 'Photo advertisement', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-453', 'fr', 'name', 'Annonces et communications/mot', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-453', 'en', 'name', 'Notices and communications/word', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-454', 'fr', 'name', 'Publicité à la minute', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-454', 'en', 'name', 'Advertising per minute', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-455', 'fr', 'name', 'DÉFILEMENT', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-455', 'en', 'name', 'SCROLL', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-456', 'fr', 'name', 'Publicité annuelle', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-456', 'en', 'name', 'Annual advertising', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-457', 'fr', 'name', 'Magazines commerciaux', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-457', 'en', 'name', 'Commercial magazines', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-458', 'fr', 'name', 'Journaux commerciaux', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-458', 'en', 'name', 'Commercial newspapers', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-459', 'fr', 'name', 'Kiosques de vente de journaux et magazines', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-459', 'en', 'name', 'Newspaper and magazine sales kiosks', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-460', 'fr', 'name', 'Distributeurs de journaux et magazines', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-460', 'en', 'name', 'Newspaper and magazine distributors', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-461', 'fr', 'name', 'Agences de communication et de gestion publicitaire', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-461', 'en', 'name', 'Communication and advertising management agencies', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-462', 'fr', 'name', 'Immatriculation temporaire', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-462', 'en', 'name', 'Temporary registration', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-465', 'fr', 'name', 'Première délivrance B', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-465', 'en', 'name', 'First issuance B', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-548', 'fr', 'name', 'Première délivrance B', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-548', 'en', 'name', 'First issuance B', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-466', 'fr', 'name', 'Première délivrance B1', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-466', 'en', 'name', 'First issuance B1', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-549', 'fr', 'name', 'Première délivrance B1', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-549', 'en', 'name', 'First issuance B1', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-467', 'fr', 'name', 'Première délivrance C', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-467', 'en', 'name', 'First issuance C', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-550', 'fr', 'name', 'Première délivrance C', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-550', 'en', 'name', 'First issuance C', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-468', 'fr', 'name', 'Première délivrance D', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-468', 'en', 'name', 'First issuance D', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-551', 'fr', 'name', 'Première délivrance D', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-551', 'en', 'name', 'First issuance D', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-463', 'fr', 'name', 'Immatriculation définitive', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-463', 'en', 'name', 'Permanent registration', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-464', 'fr', 'name', 'Première délivrance A1 - A2', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-464', 'en', 'name', 'First issuance A1 - A2', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-465', 'fr', 'name', 'Première délivrance B', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-465', 'en', 'name', 'First issuance B', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-548', 'fr', 'name', 'Première délivrance B', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-548', 'en', 'name', 'First issuance B', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-466', 'fr', 'name', 'Première délivrance B1', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-466', 'en', 'name', 'First issuance B1', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-549', 'fr', 'name', 'Première délivrance B1', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-549', 'en', 'name', 'First issuance B1', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-467', 'fr', 'name', 'Première délivrance C', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-467', 'en', 'name', 'First issuance C', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-550', 'fr', 'name', 'Première délivrance C', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-550', 'en', 'name', 'First issuance C', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-468', 'fr', 'name', 'Première délivrance D', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-468', 'en', 'name', 'First issuance D', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-551', 'fr', 'name', 'Première délivrance D', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-551', 'en', 'name', 'First issuance D', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-469', 'fr', 'name', 'Première délivrance E', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-469', 'en', 'name', 'First issuance E', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-470', 'fr', 'name', 'Renouvellement dans les délais', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-470', 'en', 'name', 'On-time renewal', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-471', 'fr', 'name', 'Duplicatas', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-471', 'en', 'name', 'Duplicates', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-472', 'fr', 'name', 'Impression Permis', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-472', 'en', 'name', 'License Printing', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-473', 'fr', 'name', 'Demande d''instance', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-473', 'en', 'name', 'Application Request', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-474', 'fr', 'name', 'Accès à l''Examen', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-474', 'en', 'name', 'Exam Access', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-475', 'fr', 'name', 'Jusqu''à 30 jours avec majoration de 10%', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-475', 'en', 'name', 'Up to 30 days with 10% surcharge', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-476', 'fr', 'name', 'Plus de 30 jours avec majoration de 20%', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-476', 'en', 'name', 'Over 30 days with 20% surcharge', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-477', 'fr', 'name', 'Échanges', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-477', 'en', 'name', 'Exchanges', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-478', 'fr', 'name', 'Domiciliations', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-478', 'en', 'name', 'Address Registrations', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-479', 'fr', 'name', 'Certificat d''authenticité', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-479', 'en', 'name', 'Certificate of authenticity', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-480', 'fr', 'name', 'Certificat de bonne conduite (Entités Mineures)', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-480', 'en', 'name', 'Certificate of Good Conduct (Minor Entities)', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-481', 'fr', 'name', 'Certificat d''arpentage (entités mineures)', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-481', 'en', 'name', 'Land measurement certificate (minor entities)', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-482', 'fr', 'name', 'Certificat de casier judiciaire', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-482', 'en', 'name', 'Background check certificate', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-483', 'fr', 'name', 'Associations de taxis', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-483', 'en', 'name', 'Taxi associations', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-484', 'fr', 'name', 'Usine', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-484', 'en', 'name', 'Factory', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-485', 'fr', 'name', 'Poissonnerie provinces et districts', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-485', 'en', 'name', 'Fish shop provinces and districts', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-486', 'fr', 'name', 'Établissements', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-486', 'en', 'name', 'Establishments', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-487', 'fr', 'name', 'Stand fixe villages', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-487', 'en', 'name', 'Fixed stand villages', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-488', 'fr', 'name', 'Achat produits 1ère catégorie', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-488', 'en', 'name', 'Product purchase 1st category', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-489', 'fr', 'name', 'Achat produits 2ème catégorie', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-489', 'en', 'name', 'Product purchase 2nd category', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-490', 'fr', 'name', 'Achat produits 3ème catégorie', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-490', 'en', 'name', 'Product purchase 3rd category', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-491', 'fr', 'name', 'Épicerie', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-491', 'en', 'name', 'Grocery store', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-492', 'fr', 'name', 'Immatriculations', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-492', 'en', 'name', 'Vehicle registrations', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-493', 'fr', 'name', 'Définitive', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-493', 'en', 'name', 'Permanent', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-494', 'fr', 'name', 'Définitive hors délai par tranche de 7 jours', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-494', 'en', 'name', 'Late permanent registration per 7 days', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-495', 'fr', 'name', 'Provisoire par tranche de 7 jours', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-495', 'en', 'name', 'Provisional per 7 days', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-496', 'fr', 'name', 'Véhicules en période d''essai par tranche de 7 jours', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-496', 'en', 'name', 'Test vehicles per 7 days', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-497', 'fr', 'name', 'Duplicatas', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-497', 'en', 'name', 'Duplicates', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-498', 'fr', 'name', 'Transferts de véhicules dans les délais', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-498', 'en', 'name', 'On-time vehicle transfers', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-499', 'fr', 'name', 'Transfert de véhicules hors délai avec majoration', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-499', 'en', 'name', 'Late vehicle transfer with surcharge', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-500', 'fr', 'name', 'Duplicatas carte grise', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-500', 'en', 'name', 'Vehicle registration duplicates', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-501', 'fr', 'name', 'Détaillants par an', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-501', 'en', 'name', 'Retailers per year', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-502', 'fr', 'name', 'Grossistes par an', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-502', 'en', 'name', 'Wholesalers per year', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-503', 'fr', 'name', 'Autorisation d''entrée dans les eaux territoriales de Guinée Équatoriale pour Plateformes et Remorqueurs', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-503', 'en', 'name', 'Authorization for entry into Equatorial Guinea territorial waters for Platforms and Tugboats', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-504', 'fr', 'name', 'Détaillants par an', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-504', 'en', 'name', 'Retailers per year', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-505', 'fr', 'name', 'Grossistes par an', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-505', 'en', 'name', 'Wholesalers per year', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-506', 'fr', 'name', 'Enregistrement des entreprises', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-506', 'en', 'name', 'Company registration', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-507', 'fr', 'name', 'Certificat de radiation', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-507', 'en', 'name', 'Deregistration certificate', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-508', 'fr', 'name', 'Pénalités de renouvellement tardif', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-508', 'en', 'name', 'Late renewal penalties', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-509', 'fr', 'name', 'Renouvellement autorisation de vente de gaz domestique par an', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-509', 'en', 'name', 'Renewal of domestic gas sales authorization per year', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-510', 'fr', 'name', 'Autorisation de vente de prod. dérivés du pétrole inférieurs à 20.000 L/an', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-510', 'en', 'name', 'Authorization for sale of crude derivatives under 20,000 L/year', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-511', 'fr', 'name', 'Autorisation de vente de prod. dérivés du pétrole supérieurs à 20.000 L/an', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-511', 'en', 'name', 'Authorization for sale of crude derivatives over 20,000 L/year', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-512', 'fr', 'name', 'Autorisation de construction de Station-service', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-512', 'en', 'name', 'Fuel dispenser construction authorization', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-513', 'fr', 'name', 'Autorisation pour l''exploitation annuelle de carrières', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-513', 'en', 'name', 'Annual quarry exploitation authorization', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-514', 'fr', 'name', 'Autorisation pour l''exploitation annuelle de sable', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-514', 'en', 'name', 'Annual sand exploitation authorization', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-515', 'fr', 'name', 'Redevance sur le volume d''exploitation industrielle de carrières par m3', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-515', 'en', 'name', 'Royalty on industrial quarry exploitation volume per m3', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-516', 'fr', 'name', 'Redevance sur le volume d''exploitation industrielle d''agrégats par m3', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-516', 'en', 'name', 'Royalty on industrial aggregate exploitation volume per m3', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-517', 'fr', 'name', 'Redevance de location de surface/exploration', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-517', 'en', 'name', 'Surface/exploration lease fee', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-518', 'fr', 'name', 'Production', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-518', 'en', 'name', 'Production', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-519', 'fr', 'name', 'Ancrage de plateforme par navire de (1 - 6 mois)', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-519', 'en', 'name', 'Platform anchoring by vessel (1 - 6 months)', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-520', 'fr', 'name', 'Ancrage de plateforme par navire de (6 - 12 mois)', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-520', 'en', 'name', 'Platform anchoring by vessel (6 - 12 months)', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-521', 'fr', 'name', 'Autorisation des navires d''acquisition/support sismique de (1 - 6 mois)', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-521', 'en', 'name', 'Authorization for seismic acquisition/support vessels (1 - 6 months)', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-522', 'fr', 'name', 'Autorisation des navires d''acquisition/support sismique de (6 - 12 mois)', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-522', 'en', 'name', 'Authorization for seismic acquisition/support vessels (6 - 12 months)', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-523', 'fr', 'name', 'Plateforme ou navire de forage de (1 - 3 mois)', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-523', 'en', 'name', 'Drilling platform or vessel (1 - 3 months)', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-524', 'fr', 'name', 'Permis de recherche général', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-524', 'en', 'name', 'General research permit', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-525', 'fr', 'name', 'Prime à la signature du contrat minier', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-525', 'en', 'name', 'Mining contract signing bonus', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-526', 'fr', 'name', 'Prime de déclaration', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-526', 'en', 'name', 'Declaration bonus', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-527', 'fr', 'name', 'Redevance contractuelle de location de surface', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-527', 'en', 'name', 'Contractual surface lease fee', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-528', 'fr', 'name', 'Pendant la période d''exploitation USD/Ha', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-528', 'en', 'name', 'During exploitation period USD/Ha', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-552', 'fr', 'name', 'Véhicules à usage privé sauf camions', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-552', 'en', 'name', 'Private use vehicles except trucks', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-553', 'fr', 'name', 'Véhicules à usage public sauf camions', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-553', 'en', 'name', 'Public use vehicles except trucks', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-554', 'fr', 'name', 'Véhicules et machines de services publics', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-554', 'en', 'name', 'Public service vehicles and machinery', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-555', 'fr', 'name', 'Camions, autobus et tracteurs', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-555', 'en', 'name', 'Trucks, buses and tractors', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-556', 'fr', 'name', 'Véhicules de tourisme et camionnettes', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-556', 'en', 'name', 'Tourism vehicles and vans', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-557', 'fr', 'name', 'Particuliers', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-557', 'en', 'name', 'Private individuals', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-558', 'fr', 'name', 'Mesures de terrains :', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-558', 'en', 'name', 'Land measurements:', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-559', 'fr', 'name', 'Surfaces de 100 à 1000 m²', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-559', 'en', 'name', 'Areas from 100 to 1000 m²', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-560', 'fr', 'name', 'Surface de 1000 à 10.000 m²', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-560', 'en', 'name', 'Area from 1000 to 10,000 m²', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-561', 'fr', 'name', 'Surface de plus de 10.000 m²', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-561', 'en', 'name', 'Area over 10,000 m²', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-562', 'fr', 'name', 'Surfaces de 10 à 100 m²', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-562', 'en', 'name', 'Areas from 10 to 100 m²', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-563', 'fr', 'name', '101 à 1000 m² imposable', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-563', 'en', 'name', '101 to 1000 m² taxable', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-564', 'fr', 'name', '1001 à 10.000 m² imposable', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-564', 'en', 'name', '1001 to 10,000 m² taxable', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-565', 'fr', 'name', '10.001 à 100.000 m² imposable', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-565', 'en', 'name', '10,001 to 100,000 m² taxable', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-566', 'fr', 'name', '100.001 et plus, imposable', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-566', 'en', 'name', '100,001 and more, taxable', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-567', 'fr', 'name', 'Terrain de 500 à 1.000 m²', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-567', 'en', 'name', 'Land from 500 to 1,000 m²', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-568', 'fr', 'name', 'Terrain de 1.001 à 5.000 m²', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-568', 'en', 'name', 'Land from 1,001 to 5,000 m²', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-569', 'fr', 'name', 'Terrain de 5001 et plus', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-569', 'en', 'name', 'Land from 5001 and above', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-570', 'fr', 'name', 'A4', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-570', 'en', 'name', 'A4', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-571', 'fr', 'name', 'A3', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-571', 'en', 'name', 'A3', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-572', 'fr', 'name', 'A2', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-572', 'en', 'name', 'A2', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-573', 'fr', 'name', 'A1', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-573', 'en', 'name', 'A1', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-574', 'fr', 'name', 'A0', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-574', 'en', 'name', 'A0', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-575', 'fr', 'name', 'De 0 à 500.000 F. CFA', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-575', 'en', 'name', 'From 0 to 500,000 F. CFA', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-576', 'fr', 'name', 'De 500.000 à 1.000.000 F. CFA', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-576', 'en', 'name', 'From 500,000 to 1,000,000 F. CFA', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-577', 'fr', 'name', 'De 1.000.000 à 3.000.000 F. CFA', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-577', 'en', 'name', 'From 1,000,000 to 3,000,000 F. CFA', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-578', 'fr', 'name', 'À partir de 3.000.000', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-578', 'en', 'name', 'From 3,000,000 and above', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-579', 'fr', 'name', 'Terrain de 1001 à 5000 m²', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-579', 'en', 'name', 'Land from 1001 to 5000 m²', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-580', 'fr', 'name', 'Terrain à partir de 5001', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-580', 'en', 'name', 'Land from 5001 and above', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-581', 'fr', 'name', 'Autorisation Visa Ordinaire', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-581', 'en', 'name', 'Ordinary Visa Authorization', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-582', 'fr', 'name', 'Visas alternatifs 3 Mois', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-582', 'en', 'name', 'Alternative Visas 3 Months', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-583', 'fr', 'name', 'Visas alternatifs 6 Mois', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-583', 'en', 'name', 'Alternative Visas 6 Months', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-584', 'fr', 'name', 'Visas alternatifs 12 Mois', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-584', 'en', 'name', 'Alternative Visas 12 Months', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-585', 'fr', 'name', 'Prolongation de visa d''entrée pour 1 mois', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-585', 'en', 'name', 'Entry visa extension for 1 month', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-586', 'fr', 'name', 'Séjour/mois', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-586', 'en', 'name', 'Stay/month', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-587', 'fr', 'name', 'Visas alternatifs 24 Mois', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-587', 'en', 'name', 'Alternative Visas 24 Months', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-588', 'fr', 'name', 'Autorisation Visas d''entrée frontalière', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-588', 'en', 'name', 'Border entry visa authorization', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-589', 'fr', 'name', 'Sortie avec visa expiré, par mois', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-589', 'en', 'name', 'Exit with expired visa, per month', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-590', 'fr', 'name', 'Nouvelle émigration (de 1 à 6 mois)', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-590', 'en', 'name', 'New emigration (1 to 6 months)', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-591', 'fr', 'name', 'Certificat de Bonne conduite Nationaux', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-591', 'en', 'name', 'Certificate of Good Conduct for Nationals', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-592', 'fr', 'name', 'Certificat de Bonne conduite Étrangers', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-592', 'en', 'name', 'Certificate of Good Conduct for Foreigners', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-593', 'fr', 'name', 'Certificat de perte de documents', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-593', 'en', 'name', 'Certificate of lost documents', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-594', 'fr', 'name', 'Certificat de police pour non-résident', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-594', 'en', 'name', 'Police certificate for non-resident', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-595', 'fr', 'name', 'Authentification', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-595', 'en', 'name', 'Authentication certificate', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-596', 'fr', 'name', 'Assurance d''expatriation', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-596', 'en', 'name', 'Expatriation insurance', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-599', 'fr', 'name', 'Document d''Identité Personnel', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-599', 'en', 'name', 'Personal Identity Document', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-600', 'fr', 'name', 'Duplicata pour perte de la CNI', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-600', 'en', 'name', 'Duplicate for lost ID', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-601', 'fr', 'name', 'Passeport Ordinaire', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-601', 'en', 'name', 'Ordinary Passport', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-602', 'fr', 'name', 'Duplicata pour perte de Passeport', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-602', 'en', 'name', 'Duplicate for lost Passport', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-603', 'fr', 'name', 'Renouvellement de passeport pour expiration de validité', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-603', 'en', 'name', 'Passport renewal due to expiration', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-604', 'fr', 'name', 'Carte de Séjour étrangers (12 mois)', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-604', 'en', 'name', 'Foreign Residence Card (12 months)', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-605', 'fr', 'name', 'Carte de Séjour étrangers (24 mois)', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-605', 'en', 'name', 'Foreign Residence Card (24 months)', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-610', 'fr', 'name', 'Plainte', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-610', 'en', 'name', 'Complaint', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-611', 'fr', 'name', 'Sanction pour trouble à l''ordre public', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-611', 'en', 'name', 'Public order disturbance sanction', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-612', 'fr', 'name', 'Certificat de reconnaissance et homologation d''équipements et appareils', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-612', 'en', 'name', 'Certificate of recognition and approval of equipment and devices', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-613', 'fr', 'name', 'Inscription et Registre des Entreprises', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-613', 'en', 'name', 'Company Registration and Records', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-614', 'fr', 'name', 'Certificat d''enregistrement d''entreprises d''importation', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-614', 'en', 'name', 'Registration certificate for import companies', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-615', 'fr', 'name', 'Certificat d''enregistrement indépendant', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-615', 'en', 'name', 'Independent registration certificate', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-616', 'fr', 'name', 'Exportation et réexportation par appareil système', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-616', 'en', 'name', 'Export and re-export per system equipment', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-617', 'fr', 'name', 'Certificat d''importation, exportation et réexportation', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-617', 'en', 'name', 'Import, export and re-export certificate', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-618', 'fr', 'name', 'Certificat de modification de propriétaire, dénomination ou domicile', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-618', 'en', 'name', 'Certificate of change of owner, name or address', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-619', 'fr', 'name', 'Fourgonnettes de 1 à 2 T', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-619', 'en', 'name', 'Vans from 1 to 2 T', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-620', 'fr', 'name', 'Fourgon de 3 à 5 T', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-620', 'en', 'name', 'Van from 3 to 5 T', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-621', 'fr', 'name', 'Minibus de 10 à 15 places', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-621', 'en', 'name', 'Minibuses from 10 to 15 seats', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-622', 'fr', 'name', 'Minibus de 15 à 20 places', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-622', 'en', 'name', 'Minibuses from 15 to 20 seats', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-623', 'fr', 'name', 'Minibus de 23 à 30 places', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-623', 'en', 'name', 'Minibuses from 23 to 30 seats', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-624', 'fr', 'name', 'Autobus de 40 à 50 places', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-624', 'en', 'name', 'Buses from 40 to 50 seats', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-625', 'fr', 'name', 'Transport de passagers', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-625', 'en', 'name', 'Passenger transport', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-626', 'fr', 'name', 'Transport de marchandises', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-626', 'en', 'name', 'Freight transport', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-627', 'fr', 'name', 'Transport mixte', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-627', 'en', 'name', 'Mixed transport', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-628', 'fr', 'name', 'Transport de liquides et gaz en vrac', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-628', 'en', 'name', 'Bulk liquid and gas transport', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-909', 'fr', 'name', 'Camions de 10 à 14 Véhicules très lourds (Camions chargés)', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-909', 'en', 'name', 'Trucks 10 to 14 Very heavy vehicles (Loaded trucks)', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-910', 'fr', 'name', 'Véhicules Particuliers légers (Privé)', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-910', 'en', 'name', 'Light Private Vehicles (Private)', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-911', 'fr', 'name', '(Camions Moyens de 6 à 8 Roues) Véhicules très lourds (Camions vides)', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-911', 'en', 'name', '(Medium Trucks 6 to 8 Wheels) Very heavy vehicles (Empty trucks)', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-912', 'fr', 'name', 'Camionnettes (Dina 100 et Toyota) Véhicules lourds (Camionnettes)', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-912', 'en', 'name', 'Vans (Dina 100 and Toyota) Heavy vehicles (Vans)', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-913', 'fr', 'name', 'Véhicules de transport public (Taxis, Minibus, autobus et autres)', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-913', 'en', 'name', 'Public transport vehicles (Taxis, Minibuses, buses and others)', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-914', 'fr', 'name', 'Camions Remorques', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-914', 'en', 'name', 'Trailer Trucks', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-915', 'fr', 'name', 'Camions Chargés de Conteneurs', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-915', 'en', 'name', 'Container Loaded Trucks', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-916', 'fr', 'name', 'Camions Remorques, Grues et Machines lourdes', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;

INSERT INTO entity_translations (entity_type, entity_code, language_code, field_name, translation_text, translation_source, created_at)
VALUES ('service', 'T-916', 'en', 'name', 'Trailer Trucks, Cranes and Heavy Machinery', 'import', NOW())
ON CONFLICT (entity_type, entity_code, language_code, field_name) DO NOTHING;



COMMIT;

-- ============================================
-- STATS
-- ============================================
-- Total translations: 1344
-- By entity_type:
--   - category: 168
--   - ministry: 28
--   - sector: 40
--   - service: 1108
-- By language:
--   - FR: 672
--   - EN: 672
-- ES translations skipped: Already in DB
-- ============================================
