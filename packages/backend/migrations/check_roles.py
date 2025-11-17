"""
Check which roles exist in the database
"""

import psycopg2
import os
from urllib.parse import urlparse

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://postgres:taxasge-db25@db.bpdzfkymgydjxxwlctam.supabase.co:5432/postgres"
)

def parse_database_url(url):
    parsed = urlparse(url)
    return {
        'host': parsed.hostname,
        'port': parsed.port or 5432,
        'database': parsed.path[1:],
        'user': parsed.username,
        'password': parsed.password
    }

def check_roles():
    db_params = parse_database_url(DATABASE_URL)
    conn = psycopg2.connect(**db_params)
    cursor = conn.cursor()

    print("Roles in database:")
    print("-" * 80)

    cursor.execute("""
        SELECT id, code, name, is_system
        FROM roles
        ORDER BY is_system DESC, code
    """)

    roles = cursor.fetchall()

    for role_id, code, name, is_system in roles:
        system_marker = "[SYSTEM]" if is_system else "[CUSTOM]"
        print(f"{system_marker:10} {code:30} {name}")

    print()
    print(f"Total roles: {len(roles)}")

    cursor.close()
    conn.close()

if __name__ == "__main__":
    check_roles()
