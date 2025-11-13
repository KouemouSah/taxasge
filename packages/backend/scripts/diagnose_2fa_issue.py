#!/usr/bin/env python3
"""
Script de diagnostic pour le problème 2FA
Vérifie l'état de la base de données et teste l'activation 2FA
"""

import os
import sys
from pathlib import Path
from dotenv import load_dotenv
from loguru import logger
import json

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

# Load environment variables
env_path = Path(__file__).parent.parent / ".env.local"
load_dotenv(env_path)

DATABASE_URL = os.getenv("DATABASE_URL")
USER_EMAIL = "user@odoolab.site"
USER_ID = "a5cfc4b3-50b4-4473-b6b7-6351b318a313"

if not DATABASE_URL:
    logger.error("DATABASE_URL not found in .env.local")
    sys.exit(1)


def diagnose_2fa():
    """Diagnostic complet du problème 2FA"""

    try:
        import psycopg2
        from psycopg2.extras import RealDictCursor

        logger.info("=" * 80)
        logger.info("DIAGNOSTIC 2FA - user@odoolab.site")
        logger.info("=" * 80)

        # Connect to database
        logger.info(f"\n1. Connexion à la base de données...")
        conn = psycopg2.connect(DATABASE_URL)
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        logger.success("   ✅ Connecté")

        # Step 1: Check if user exists
        logger.info(f"\n2. Vérification de l'existence de l'utilisateur...")
        cursor.execute("""
            SELECT id, email, two_factor_enabled,
                   two_factor_secret IS NOT NULL as has_secret,
                   two_factor_backup_codes IS NOT NULL as has_backup_codes,
                   two_factor_enabled_at, updated_at
            FROM users
            WHERE id = %s
        """, (USER_ID,))

        user = cursor.fetchone()

        if not user:
            logger.error(f"   ❌ Utilisateur {USER_EMAIL} NON TROUVÉ!")
            logger.error(f"   ID recherché: {USER_ID}")
            return False

        logger.success(f"   ✅ Utilisateur trouvé: {user['email']}")
        logger.info(f"   État actuel:")
        logger.info(f"      - two_factor_enabled: {user['two_factor_enabled']}")
        logger.info(f"      - has_secret: {user['has_secret']}")
        logger.info(f"      - has_backup_codes: {user['has_backup_codes']}")
        logger.info(f"      - two_factor_enabled_at: {user['two_factor_enabled_at']}")

        # Step 2: Test UPDATE (dry run)
        logger.info(f"\n3. Test UPDATE (sans commit) pour vérifier RLS...")

        test_secret = "TEST_SECRET_3HRYXVMT3J7G2NEAW4FTHOCOV26UH6YF"
        test_backup_codes = json.dumps(["test1", "test2", "test3"])

        try:
            cursor.execute("""
                UPDATE users
                SET two_factor_enabled = TRUE,
                    two_factor_secret = %s,
                    two_factor_backup_codes = %s::jsonb,
                    two_factor_enabled_at = NOW(),
                    updated_at = NOW()
                WHERE id = %s
            """, (test_secret, test_backup_codes, USER_ID))

            rows_affected = cursor.rowcount
            logger.info(f"   Lignes affectées: {rows_affected}")

            if rows_affected == 0:
                logger.error("   ❌ UPDATE n'a affecté AUCUNE ligne!")
                logger.error("   Cela peut indiquer:")
                logger.error("      1. RLS bloque l'UPDATE")
                logger.error("      2. Le user_id n'existe pas")
                logger.error("      3. Problème de permissions")
                conn.rollback()
                return False

            logger.success(f"   ✅ UPDATE réussi ({rows_affected} ligne)")

            # Verify the update
            cursor.execute("""
                SELECT two_factor_enabled,
                       two_factor_secret,
                       two_factor_enabled_at
                FROM users
                WHERE id = %s
            """, (USER_ID,))

            updated_user = cursor.fetchone()
            logger.info(f"   Vérification après UPDATE:")
            logger.info(f"      - two_factor_enabled: {updated_user['two_factor_enabled']}")
            logger.info(f"      - two_factor_secret: {updated_user['two_factor_secret'][:20]}..." if updated_user['two_factor_secret'] else "      - two_factor_secret: None")

            # Rollback (c'était juste un test)
            conn.rollback()
            logger.info(f"\n   ⚠️  Rollback effectué (test seulement)")

        except Exception as e:
            logger.error(f"   ❌ Erreur lors de l'UPDATE: {e}")
            logger.error(f"   Cela confirme un problème RLS ou de permissions")
            conn.rollback()
            return False

        # Step 3: Check RLS status
        logger.info(f"\n4. Vérification du statut RLS sur la table users...")

        cursor.execute("""
            SELECT relname, relrowsecurity, relforcerowsecurity
            FROM pg_class
            WHERE relname = 'users'
        """)

        rls_status = cursor.fetchone()

        if rls_status:
            logger.info(f"   Table: {rls_status['relname']}")
            logger.info(f"   RLS activé: {rls_status['relrowsecurity']}")
            logger.info(f"   RLS forcé: {rls_status['relforcerowsecurity']}")

            if rls_status['relrowsecurity']:
                logger.warning("   ⚠️  RLS EST ACTIVÉ sur la table users")

                # Check policies
                cursor.execute("""
                    SELECT schemaname, tablename, policyname,
                           permissive, roles, cmd, qual, with_check
                    FROM pg_policies
                    WHERE tablename = 'users'
                """)

                policies = cursor.fetchall()

                if policies:
                    logger.info(f"\n   Policies RLS existantes ({len(policies)}):")
                    for policy in policies:
                        logger.info(f"      - {policy['policyname']}")
                        logger.info(f"        CMD: {policy['cmd']}")
                        logger.info(f"        Roles: {policy['roles']}")
                else:
                    logger.error("   ❌ AUCUNE POLICY RLS définie!")
                    logger.error("   Cela bloque tous les accès!")

        # Step 4: Check connection role
        logger.info(f"\n5. Vérification du rôle de connexion...")

        cursor.execute("SELECT current_user, current_role")
        role_info = cursor.fetchone()

        logger.info(f"   current_user: {role_info['current_user']}")
        logger.info(f"   current_role: {role_info['current_role']}")

        if role_info['current_user'] != 'postgres':
            logger.warning(f"   ⚠️  Connecté en tant que '{role_info['current_user']}' (pas 'postgres')")
            logger.warning(f"   RLS peut s'appliquer à ce rôle")
        else:
            logger.success(f"   ✅ Connecté en tant que 'postgres' (RLS devrait être bypassé)")

        # Close connection
        cursor.close()
        conn.close()

        # Summary
        logger.info("\n" + "=" * 80)
        logger.info("RÉSUMÉ")
        logger.info("=" * 80)

        if user['two_factor_enabled']:
            logger.success("✅ 2FA est ACTIVÉ en base de données")
            logger.info("   Le problème n'est PAS au niveau de la persistance")
        else:
            logger.error("❌ 2FA est DÉSACTIVÉ en base de données")
            logger.error("   Le problème EST au niveau de la persistance")
            logger.error("\nCauses possibles:")
            logger.error("   1. RLS bloque les UPDATEs")
            logger.error("   2. La connexion n'utilise pas le service_role_key")
            logger.error("   3. Le backend n'appelle pas user_repo.enable_two_factor()")

        return True

    except Exception as e:
        logger.error(f"❌ Erreur: {e}")
        import traceback
        traceback.print_exc()
        return False


if __name__ == "__main__":
    success = diagnose_2fa()
    sys.exit(0 if success else 1)
