#!/usr/bin/env python3
"""
Script de diagnostic simplifié pour le problème 2FA
Vérifie l'état de la base de données et teste l'activation 2FA
Sans dépendance loguru - utilise print standard
"""

import os
import sys
from pathlib import Path
from dotenv import load_dotenv
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
    print("ERROR: DATABASE_URL not found in .env.local")
    sys.exit(1)


def diagnose_2fa():
    """Diagnostic complet du problème 2FA"""

    try:
        import psycopg2
        from psycopg2.extras import RealDictCursor

        print("=" * 80)
        print("DIAGNOSTIC 2FA - user@odoolab.site")
        print("=" * 80)

        # Connect to database
        print(f"\n1. Connexion a la base de donnees...")
        conn = psycopg2.connect(DATABASE_URL)
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        print("   [OK] Connecte")

        # Step 1: Check if user exists
        print(f"\n2. Verification de l'existence de l'utilisateur...")
        cursor.execute("""
            SELECT id, email, two_factor_enabled,
                   two_factor_secret IS NOT NULL as has_secret,
                   two_factor_backup_codes IS NOT NULL as has_backup_codes,
                   updated_at
            FROM users
            WHERE id = %s
        """, (USER_ID,))

        user = cursor.fetchone()

        if not user:
            print(f"   [ERREUR] Utilisateur {USER_EMAIL} NON TROUVE!")
            print(f"   ID recherche: {USER_ID}")
            return False

        print(f"   [OK] Utilisateur trouve: {user['email']}")
        print(f"   Etat actuel:")
        print(f"      - two_factor_enabled: {user['two_factor_enabled']}")
        print(f"      - has_secret: {user['has_secret']}")
        print(f"      - has_backup_codes: {user['has_backup_codes']}")

        # Step 2: Test UPDATE (dry run)
        print(f"\n3. Test UPDATE (sans commit) pour verifier RLS...")

        test_secret = "TEST_SECRET_3HRYXVMT3J7G2NEAW4FTHOCOV26UH6YF"
        test_backup_codes = json.dumps(["test1", "test2", "test3"])

        try:
            cursor.execute("""
                UPDATE users
                SET two_factor_enabled = TRUE,
                    two_factor_secret = %s,
                    two_factor_backup_codes = %s::jsonb,
                    updated_at = NOW()
                WHERE id = %s
            """, (test_secret, test_backup_codes, USER_ID))

            rows_affected = cursor.rowcount
            print(f"   Lignes affectees: {rows_affected}")

            if rows_affected == 0:
                print("   [ERREUR] UPDATE n'a affecte AUCUNE ligne!")
                print("   Cela peut indiquer:")
                print("      1. RLS bloque l'UPDATE")
                print("      2. Le user_id n'existe pas")
                print("      3. Probleme de permissions")
                conn.rollback()
                return False

            print(f"   [OK] UPDATE reussi ({rows_affected} ligne)")

            # Verify the update
            cursor.execute("""
                SELECT two_factor_enabled,
                       two_factor_secret
                FROM users
                WHERE id = %s
            """, (USER_ID,))

            updated_user = cursor.fetchone()
            print(f"   Verification apres UPDATE:")
            print(f"      - two_factor_enabled: {updated_user['two_factor_enabled']}")
            print(f"      - two_factor_secret: {updated_user['two_factor_secret'][:20]}..." if updated_user['two_factor_secret'] else "      - two_factor_secret: None")

            # Rollback (c'etait juste un test)
            conn.rollback()
            print(f"\n   [ATTENTION] Rollback effectue (test seulement)")

        except Exception as e:
            print(f"   [ERREUR] Erreur lors de l'UPDATE: {e}")
            print(f"   Cela confirme un probleme RLS ou de permissions")
            conn.rollback()
            return False

        # Step 3: Check RLS status
        print(f"\n4. Verification du statut RLS sur la table users...")

        cursor.execute("""
            SELECT relname, relrowsecurity, relforcerowsecurity
            FROM pg_class
            WHERE relname = 'users'
        """)

        rls_status = cursor.fetchone()

        if rls_status:
            print(f"   Table: {rls_status['relname']}")
            print(f"   RLS active: {rls_status['relrowsecurity']}")
            print(f"   RLS force: {rls_status['relforcerowsecurity']}")

            if rls_status['relrowsecurity']:
                print("   [ATTENTION] RLS EST ACTIVE sur la table users")

                # Check policies
                cursor.execute("""
                    SELECT schemaname, tablename, policyname,
                           permissive, roles, cmd, qual, with_check
                    FROM pg_policies
                    WHERE tablename = 'users'
                """)

                policies = cursor.fetchall()

                if policies:
                    print(f"\n   Policies RLS existantes ({len(policies)}):")
                    for policy in policies:
                        print(f"      - {policy['policyname']}")
                        print(f"        CMD: {policy['cmd']}")
                        print(f"        Roles: {policy['roles']}")
                else:
                    print("   [ERREUR] AUCUNE POLICY RLS definie!")
                    print("   Cela bloque tous les acces!")

        # Step 4: Check connection role
        print(f"\n5. Verification du role de connexion...")

        cursor.execute("SELECT current_user, current_role")
        role_info = cursor.fetchone()

        print(f"   current_user: {role_info['current_user']}")
        print(f"   current_role: {role_info['current_role']}")

        if role_info['current_user'] != 'postgres':
            print(f"   [ATTENTION] Connecte en tant que '{role_info['current_user']}' (pas 'postgres')")
            print(f"   RLS peut s'appliquer a ce role")
        else:
            print(f"   [OK] Connecte en tant que 'postgres' (RLS devrait etre bypasse)")

        # Close connection
        cursor.close()
        conn.close()

        # Summary
        print("\n" + "=" * 80)
        print("RESUME")
        print("=" * 80)

        if user['two_factor_enabled']:
            print("[OK] 2FA est ACTIVE en base de donnees")
            print("   Le probleme n'est PAS au niveau de la persistance")
        else:
            print("[ERREUR] 2FA est DESACTIVE en base de donnees")
            print("   Le probleme EST au niveau de la persistance")
            print("\nCauses possibles:")
            print("   1. RLS bloque les UPDATEs")
            print("   2. La connexion n'utilise pas le service_role_key")
            print("   3. Le backend n'appelle pas user_repo.enable_two_factor()")

        return True

    except Exception as e:
        print(f"[ERREUR] Erreur: {e}")
        import traceback
        traceback.print_exc()
        return False


if __name__ == "__main__":
    success = diagnose_2fa()
    sys.exit(0 if success else 1)
