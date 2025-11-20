-- ============================================================================
-- MIGRATION: Convert user_company_roles.role from VARCHAR to ENUM
-- ============================================================================
-- Date: 2025-01-20
-- Description: Change user_company_roles.role column type from VARCHAR to ENUM
--   to ensure data integrity and restrict to 4 allowed values
--
-- Company Roles (STRICTLY for user_company_roles.role column):
--   - company_owner: Full permissions, can transfer ownership, delete company
--   - company_admin: Manage members, declarations, payments (except ownership)
--   - company_accountant: Financial focus (declarations, payments, approval)
--   - company_member: Basic access (own declarations only)
--
-- System User Roles (users.role - DIFFERENT, NOT affected by this migration):
--   - citizen, business, accountant, admin (uses user_role_enum)
-- ============================================================================

BEGIN;

-- ============================================================================
-- STEP 1: Create company_role_enum type (if not exists)
-- ============================================================================

DO $$ BEGIN
    CREATE TYPE company_role_enum AS ENUM (
        'company_owner',
        'company_admin',
        'company_accountant',
        'company_member'
    );
    RAISE NOTICE 'Created company_role_enum type';
EXCEPTION
    WHEN duplicate_object THEN
        RAISE NOTICE 'company_role_enum type already exists, skipping creation';
END $$;

COMMENT ON TYPE company_role_enum IS
    'Company member roles for user_company_roles.role column. DISTINCT from users.role (user_role_enum).';

-- ============================================================================
-- STEP 2: Update existing VARCHAR values to new prefixed names
-- ============================================================================

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_name = 'user_company_roles'
    ) THEN
        -- Only update if column is VARCHAR
        IF EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'user_company_roles'
            AND column_name = 'role'
            AND data_type = 'character varying'
        ) THEN
            -- Migrate old values to new prefixed values
            UPDATE user_company_roles
            SET role = CASE
                WHEN role = 'owner' THEN 'company_owner'
                WHEN role = 'admin' THEN 'company_admin'
                WHEN role = 'accountant' THEN 'company_accountant'
                WHEN role = 'member' THEN 'company_member'
                WHEN role LIKE 'company_%' THEN role  -- Already migrated
                ELSE 'company_member'  -- Default fallback for unknown values
            END;

            RAISE NOTICE 'Updated existing role values to prefixed names';
        ELSE
            RAISE NOTICE 'role column is not VARCHAR, skipping value update';
        END IF;
    ELSE
        RAISE NOTICE 'user_company_roles table does not exist, skipping value update';
    END IF;
END $$;

-- ============================================================================
-- STEP 3: Change column type from VARCHAR to ENUM
-- ============================================================================

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_name = 'user_company_roles'
    ) THEN
        -- Check if column is VARCHAR (needs type change)
        IF EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'user_company_roles'
            AND column_name = 'role'
            AND data_type = 'character varying'
        ) THEN
            -- Change column type: VARCHAR → company_role_enum
            ALTER TABLE user_company_roles
                ALTER COLUMN role TYPE company_role_enum
                USING role::company_role_enum;

            RAISE NOTICE 'Changed user_company_roles.role from VARCHAR to company_role_enum';
        ELSIF EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'user_company_roles'
            AND column_name = 'role'
            AND udt_name = 'company_role_enum'
        ) THEN
            RAISE NOTICE 'user_company_roles.role is already company_role_enum, no change needed';
        ELSE
            RAISE WARNING 'user_company_roles.role has unexpected type, manual review needed';
        END IF;
    ELSE
        RAISE NOTICE 'user_company_roles table does not exist, skipping column type change';
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
