-- ============================================================================
-- Migration 008: Permissions Module - Sistema de Gestión de Permisos Granulares
-- ============================================================================
-- Description: Crea el módulo completo de permisos granulares
--              - 5 nuevas tablas
--              - Modificación tabla users (role_id)
--              - 8 roles sistema
--              - Función cleanup_expired_permissions
-- Author: Claude Code
-- Date: 2025-11-17
-- Version: 1.0
-- Dependencies: Migrations 004, 005, 006 (Assignment module, supervisor role)
-- Estimated time: ~30 seconds
-- ============================================================================

BEGIN;

-- ============================================================================
-- PART 1: Crear tabla PERMISSIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,          -- Ex: "assignment.reassign_in_progress"
    resource VARCHAR(50) NOT NULL,              -- Ex: "assignment"
    action VARCHAR(50) NOT NULL,                -- Ex: "reassign_in_progress"
    description TEXT,                           -- Description en espagnol
    is_critical BOOLEAN DEFAULT FALSE,          -- Si permission critique (UI warning)
    module_name VARCHAR(50),                    -- Module source (assignment, documents, etc.)
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_permissions_resource ON permissions(resource);
CREATE INDEX idx_permissions_name ON permissions(name);
CREATE INDEX idx_permissions_module ON permissions(module_name);

COMMENT ON TABLE permissions IS 'Catalogue centralisé de toutes les permissions de l''application';
COMMENT ON COLUMN permissions.name IS 'Nom unique de la permission (format: resource.action)';
COMMENT ON COLUMN permissions.resource IS 'Ressource concernée (assignment, declaration, etc.)';
COMMENT ON COLUMN permissions.action IS 'Action autorisée (view, create, edit, delete, etc.)';
COMMENT ON COLUMN permissions.is_critical IS 'Si TRUE, UI affiche un warning lors de l''attribution';
COMMENT ON COLUMN permissions.module_name IS 'Nom du module qui a déclaré cette permission';

-- ============================================================================
-- PART 2: Crear tabla ROLES
-- ============================================================================

CREATE TABLE IF NOT EXISTS roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,          -- Ex: "Superviseur Junior DGI"
    code VARCHAR(50) UNIQUE NOT NULL,           -- Ex: "supervisor_dgi_junior"
    entity_type VARCHAR(50),                    -- "DGI", "Ministry", NULL (global)
    description TEXT,
    is_system BOOLEAN DEFAULT FALSE,            -- Si TRUE, non modifiable/supprimable
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    created_by UUID REFERENCES users(id)
);

CREATE INDEX idx_roles_code ON roles(code);
CREATE INDEX idx_roles_entity_type ON roles(entity_type);

COMMENT ON TABLE roles IS 'Rôles personnalisables pour attribution de permissions groupées';
COMMENT ON COLUMN roles.code IS 'Code unique du rôle (utilisé dans le code)';
COMMENT ON COLUMN roles.entity_type IS 'Type d''entité (DGI, Ministry, NULL pour global)';
COMMENT ON COLUMN roles.is_system IS 'Rôles système protégés (citizen, admin, etc.) - ne peuvent pas être modifiés/supprimés';
COMMENT ON COLUMN roles.created_by IS 'Utilisateur qui a créé le rôle (NULL pour rôles système)';

-- ============================================================================
-- PART 3: Crear tabla ROLE_PERMISSIONS (association many-to-many)
-- ============================================================================

CREATE TABLE IF NOT EXISTS role_permissions (
    role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID REFERENCES permissions(id) ON DELETE CASCADE,
    granted BOOLEAN DEFAULT TRUE,               -- TRUE = accordé, FALSE = refusé explicitement
    created_at TIMESTAMP DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    PRIMARY KEY (role_id, permission_id)
);

CREATE INDEX idx_role_permissions_role ON role_permissions(role_id);
CREATE INDEX idx_role_permissions_permission ON role_permissions(permission_id);

COMMENT ON TABLE role_permissions IS 'Permissions associées à chaque rôle';
COMMENT ON COLUMN role_permissions.granted IS 'FALSE permet de refuser explicitement une permission héritée';
COMMENT ON COLUMN role_permissions.created_by IS 'Admin qui a assigné cette permission au rôle';

-- ============================================================================
-- PART 4: Crear tabla USER_PERMISSIONS (overrides utilisateur)
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_permissions (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    permission_id UUID REFERENCES permissions(id) ON DELETE CASCADE,
    granted BOOLEAN DEFAULT TRUE,
    granted_by UUID REFERENCES users(id),       -- Admin qui a accordé
    granted_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP,                       -- NULL = permanent, sinon expire automatiquement
    reason TEXT,                                -- Raison de l'attribution (audit)
    PRIMARY KEY (user_id, permission_id)
);

CREATE INDEX idx_user_permissions_user ON user_permissions(user_id);
CREATE INDEX idx_user_permissions_permission ON user_permissions(permission_id);
CREATE INDEX idx_user_permissions_expires ON user_permissions(expires_at) WHERE expires_at IS NOT NULL;

COMMENT ON TABLE user_permissions IS 'Permissions spécifiques par utilisateur (override du rôle)';
COMMENT ON COLUMN user_permissions.granted IS 'TRUE = permission accordée, FALSE = permission refusée (override)';
COMMENT ON COLUMN user_permissions.granted_by IS 'Admin qui a accordé/refusé cette permission';
COMMENT ON COLUMN user_permissions.expires_at IS 'Expiration automatique pour permissions temporaires';
COMMENT ON COLUMN user_permissions.reason IS 'Raison de l''attribution (pour audit et traçabilité)';

-- ============================================================================
-- PART 5: Crear tabla PERMISSION_AUDIT_LOG (audit trail)
-- ============================================================================

CREATE TABLE IF NOT EXISTS permission_audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    action VARCHAR(50) NOT NULL,                -- INSERT, UPDATE, DELETE
    table_name VARCHAR(50) NOT NULL,            -- role_permissions, user_permissions
    record_id TEXT,                             -- Identifiant du record modifié
    user_id UUID REFERENCES users(id),
    permission_id UUID REFERENCES permissions(id),
    old_value JSONB,
    new_value JSONB,
    changed_by UUID REFERENCES users(id),
    changed_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_permission_audit_log_user ON permission_audit_log(user_id);
CREATE INDEX idx_permission_audit_log_permission ON permission_audit_log(permission_id);
CREATE INDEX idx_permission_audit_log_changed_at ON permission_audit_log(changed_at);
CREATE INDEX idx_permission_audit_log_table ON permission_audit_log(table_name);

COMMENT ON TABLE permission_audit_log IS 'Historique complet de tous les changements de permissions (audit trail)';
COMMENT ON COLUMN permission_audit_log.action IS 'Type de modification (INSERT, UPDATE, DELETE)';
COMMENT ON COLUMN permission_audit_log.table_name IS 'Table concernée par la modification';
COMMENT ON COLUMN permission_audit_log.old_value IS 'Ancienne valeur (JSONB) avant modification';
COMMENT ON COLUMN permission_audit_log.new_value IS 'Nouvelle valeur (JSONB) après modification';

-- ============================================================================
-- PART 6: Modifier table USERS (ajouter role_id)
-- ============================================================================

-- Vérifier si la colonne existe déjà
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'role_id'
    ) THEN
        -- Ajouter colonne role_id (nullable pour compatibilité)
        ALTER TABLE users ADD COLUMN role_id UUID REFERENCES roles(id);

        -- Créer index
        CREATE INDEX idx_users_role_id ON users(role_id) WHERE role_id IS NOT NULL;

        COMMENT ON COLUMN users.role_id IS 'Référence vers table roles (nouvelle logique granulaire). Si NULL, utilise role VARCHAR.';

        RAISE NOTICE 'Colonne users.role_id ajoutée avec succès';
    ELSE
        RAISE NOTICE 'Colonne users.role_id existe déjà - skip';
    END IF;
END $$;

-- ============================================================================
-- PART 7: Insérer rôles système (8 rôles)
-- ============================================================================

INSERT INTO roles (code, name, entity_type, is_system, description) VALUES
    ('citizen', 'Ciudadano', NULL, TRUE, 'Ciudadano estándar'),
    ('business', 'Empresa', NULL, TRUE, 'Empresa o organización'),
    ('accountant', 'Contador', NULL, TRUE, 'Contador público'),
    ('admin', 'Administrador', NULL, TRUE, 'Administrador del sistema (todos los derechos)'),
    ('dgi_agent', 'Agente DGI', 'DGI', TRUE, 'Agente de validación DGI'),
    ('ministry_agent', 'Agente Ministerio', 'Ministry', TRUE, 'Agente de validación ministerial'),
    ('supervisor', 'Supervisor', NULL, TRUE, 'Supervisor general (DGI o Ministerial)'),
    ('supervisor_dgi', 'Supervisor DGI', 'DGI', TRUE, 'Supervisor DGI (todos los derechos supervisor)')
ON CONFLICT (code) DO NOTHING;

-- ============================================================================
-- PART 8: Migrer users existants vers role_id
-- ============================================================================

-- Migrer tous les users existants vers la nouvelle table roles
UPDATE users u
SET role_id = r.id
FROM roles r
WHERE u.role::TEXT = r.code
AND u.role_id IS NULL;

-- ============================================================================
-- PART 9: Créer fonction cleanup_expired_permissions
-- ============================================================================

CREATE OR REPLACE FUNCTION cleanup_expired_permissions()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM user_permissions
    WHERE expires_at IS NOT NULL
    AND expires_at < NOW();

    GET DIAGNOSTICS deleted_count = ROW_COUNT;

    -- Enregistrer dans audit log
    INSERT INTO permission_audit_log (
        action, table_name, record_id, changed_by, changed_at, new_value
    ) VALUES (
        'CLEANUP', 'user_permissions', 'expired', NULL, NOW(),
        jsonb_build_object('deleted_count', deleted_count)
    );

    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION cleanup_expired_permissions() IS 'Supprime les permissions utilisateur expirées. À appeler via CRON quotidien.';

-- ============================================================================
-- PART 10: Créer triggers pour audit automatique
-- ============================================================================

-- Trigger pour auditer les modifications de role_permissions
CREATE OR REPLACE FUNCTION audit_role_permissions()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO permission_audit_log (
            action, table_name, record_id, permission_id, changed_by, new_value
        ) VALUES (
            'INSERT', 'role_permissions',
            NEW.role_id::TEXT || '-' || NEW.permission_id::TEXT,
            NEW.permission_id, NEW.created_by,
            jsonb_build_object('role_id', NEW.role_id, 'permission_id', NEW.permission_id, 'granted', NEW.granted)
        );
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO permission_audit_log (
            action, table_name, record_id, permission_id, changed_by, old_value, new_value
        ) VALUES (
            'UPDATE', 'role_permissions',
            NEW.role_id::TEXT || '-' || NEW.permission_id::TEXT,
            NEW.permission_id, NEW.created_by,
            jsonb_build_object('granted', OLD.granted),
            jsonb_build_object('granted', NEW.granted)
        );
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO permission_audit_log (
            action, table_name, record_id, permission_id, changed_by, old_value
        ) VALUES (
            'DELETE', 'role_permissions',
            OLD.role_id::TEXT || '-' || OLD.permission_id::TEXT,
            OLD.permission_id, OLD.created_by,
            jsonb_build_object('role_id', OLD.role_id, 'permission_id', OLD.permission_id, 'granted', OLD.granted)
        );
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_audit_role_permissions
AFTER INSERT OR UPDATE OR DELETE ON role_permissions
FOR EACH ROW EXECUTE FUNCTION audit_role_permissions();

-- Trigger pour auditer les modifications de user_permissions
CREATE OR REPLACE FUNCTION audit_user_permissions()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO permission_audit_log (
            action, table_name, record_id, user_id, permission_id, changed_by, new_value
        ) VALUES (
            'INSERT', 'user_permissions',
            NEW.user_id::TEXT || '-' || NEW.permission_id::TEXT,
            NEW.user_id, NEW.permission_id, NEW.granted_by,
            jsonb_build_object(
                'user_id', NEW.user_id, 'permission_id', NEW.permission_id,
                'granted', NEW.granted, 'expires_at', NEW.expires_at, 'reason', NEW.reason
            )
        );
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO permission_audit_log (
            action, table_name, record_id, user_id, permission_id, changed_by, old_value, new_value
        ) VALUES (
            'UPDATE', 'user_permissions',
            NEW.user_id::TEXT || '-' || NEW.permission_id::TEXT,
            NEW.user_id, NEW.permission_id, NEW.granted_by,
            jsonb_build_object('granted', OLD.granted, 'expires_at', OLD.expires_at),
            jsonb_build_object('granted', NEW.granted, 'expires_at', NEW.expires_at)
        );
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO permission_audit_log (
            action, table_name, record_id, user_id, permission_id, changed_by, old_value
        ) VALUES (
            'DELETE', 'user_permissions',
            OLD.user_id::TEXT || '-' || OLD.permission_id::TEXT,
            OLD.user_id, OLD.permission_id, OLD.granted_by,
            jsonb_build_object(
                'user_id', OLD.user_id, 'permission_id', OLD.permission_id,
                'granted', OLD.granted, 'expires_at', OLD.expires_at, 'reason', OLD.reason
            )
        );
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_audit_user_permissions
AFTER INSERT OR UPDATE OR DELETE ON user_permissions
FOR EACH ROW EXECUTE FUNCTION audit_user_permissions();

COMMIT;

-- ============================================================================
-- Verification
-- ============================================================================

DO $$
DECLARE
    tables_count INTEGER;
    roles_count INTEGER;
    users_migrated INTEGER;
BEGIN
    -- Compter tables créées
    SELECT COUNT(*) INTO tables_count
    FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name IN ('permissions', 'roles', 'role_permissions', 'user_permissions', 'permission_audit_log');

    -- Compter rôles système
    SELECT COUNT(*) INTO roles_count
    FROM roles
    WHERE is_system = TRUE;

    -- Compter users migrés
    SELECT COUNT(*) INTO users_migrated
    FROM users
    WHERE role_id IS NOT NULL;

    RAISE NOTICE '';
    RAISE NOTICE '============================================================================';
    RAISE NOTICE 'MIGRATION 008 COMPLETED SUCCESSFULLY';
    RAISE NOTICE '============================================================================';
    RAISE NOTICE '';
    RAISE NOTICE '[INFO] Tables créées: % / 5', tables_count;
    RAISE NOTICE '[INFO] Rôles système: % / 8', roles_count;
    RAISE NOTICE '[INFO] Users migrés vers role_id: %', users_migrated;
    RAISE NOTICE '';

    IF tables_count = 5 AND roles_count >= 8 THEN
        RAISE NOTICE '[SUCCESS] Migration 008 réussie - Module Permissions opérationnel';
    ELSE
        RAISE WARNING '[WARNING] Migration incomplète - Vérifier les erreurs ci-dessus';
    END IF;

    RAISE NOTICE '';
    RAISE NOTICE '============================================================================';
END $$;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- Next steps:
-- 1. Créer models Pydantic pour permissions
-- 2. Créer repositories pour CRUD
-- 3. Créer services (permission_service, role_service)
-- 4. Créer middleware @require_permission
-- 5. Créer API routes
-- 6. Intégrer avec module Assignment
-- ============================================================================
