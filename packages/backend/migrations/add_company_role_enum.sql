-- ============================================================================
-- MIGRATION: Add company_role_enum for user_company_roles table
-- ============================================================================
-- Date: 2025-01-20
-- Description: Create ENUM type for company roles to ensure data integrity
--   and distinguish company roles from system user roles
--
-- Company Roles (STRICTLY for user_company_roles table):
--   - company_owner: Full permissions, can transfer ownership, delete company
--   - company_admin: Manage members, declarations, payments (except ownership)
--   - company_accountant: Financial focus (declarations, payments, approval)
--   - company_member: Basic access (own declarations only)
--
-- System User Roles (users.role - DIFFERENT):
--   - citizen, business, accountant, admin
-- ============================================================================

BEGIN;

-- ============================================================================
-- STEP 1: Create company_role_enum type
-- ============================================================================

DO $$ BEGIN
    CREATE TYPE company_role_enum AS ENUM (
        'company_owner',
        'company_admin',
        'company_accountant',
        'company_member'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

COMMENT ON TYPE company_role_enum IS
    'Roles for company members (user_company_roles table). STRICTLY for companies, distinct from system user roles.';

-- ============================================================================
-- STEP 2: Migrate existing data (if table exists with VARCHAR role)
-- ============================================================================

-- Check if user_company_roles table exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_name = 'user_company_roles'
    ) THEN
        -- Check if role column is VARCHAR (needs migration)
        IF EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'user_company_roles'
            AND column_name = 'role'
            AND data_type = 'character varying'
        ) THEN
            -- Update existing values to new prefixed names
            UPDATE user_company_roles
            SET role = CASE
                WHEN role = 'owner' THEN 'company_owner'
                WHEN role = 'admin' THEN 'company_admin'
                WHEN role = 'accountant' THEN 'company_accountant'
                WHEN role = 'member' THEN 'company_member'
                ELSE 'company_member'  -- Default fallback
            END;

            -- Change column type to ENUM
            ALTER TABLE user_company_roles
                ALTER COLUMN role TYPE company_role_enum
                USING role::company_role_enum;

            RAISE NOTICE 'Migrated user_company_roles.role from VARCHAR to company_role_enum';
        ELSE
            RAISE NOTICE 'user_company_roles.role is already company_role_enum or another type';
        END IF;
    ELSE
        RAISE NOTICE 'user_company_roles table does not exist yet';
    END IF;
END $$;

-- ============================================================================
-- STEP 3: Add constraint and index (if table exists)
-- ============================================================================

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_name = 'user_company_roles'
    ) THEN
        -- Add NOT NULL constraint if not exists
        ALTER TABLE user_company_roles
            ALTER COLUMN role SET NOT NULL;

        -- Create index for role-based queries
        CREATE INDEX IF NOT EXISTS idx_user_company_roles_role
            ON user_company_roles(role);

        -- Create composite index for common queries
        CREATE INDEX IF NOT EXISTS idx_user_company_roles_company_role
            ON user_company_roles(company_id, role);

        RAISE NOTICE 'Added indexes for user_company_roles.role';
    END IF;
END $$;

-- ============================================================================
-- STEP 4: Add helpful comments
-- ============================================================================

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_name = 'user_company_roles'
    ) THEN
        COMMENT ON COLUMN user_company_roles.role IS
            'Company role (company_owner, company_admin, company_accountant, company_member). DISTINCT from users.role (system roles).';

        RAISE NOTICE 'Added comments to user_company_roles.role';
    END IF;
END $$;

COMMIT;

-- ============================================================================
-- VERIFICATION QUERIES (run after migration)
-- ============================================================================

-- Verify ENUM values
-- SELECT enumlabel FROM pg_enum WHERE enumtypid = 'company_role_enum'::regtype ORDER BY enumsortorder;

-- Verify column type
-- SELECT column_name, data_type, udt_name FROM information_schema.columns WHERE table_name = 'user_company_roles' AND column_name = 'role';

-- Check role distribution
-- SELECT role, COUNT(*) FROM user_company_roles GROUP BY role;
