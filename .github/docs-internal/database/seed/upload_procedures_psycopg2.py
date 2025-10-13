import psycopg2
import sys

# ===========================================
# CONFIGURATION - MODIFIER AVEC TES VALEURS
# ===========================================
# Trouver ces infos dans Supabase: Settings > Database > Connection string
DB_HOST = "db.YOUR_PROJECT.supabase.co"
DB_NAME = "postgres"
DB_USER = "postgres"
DB_PASSWORD = "YOUR_PASSWORD"
DB_PORT = 5432

# ===========================================
# Connexion à la base
# ===========================================
print("Connexion à la base de données...")

try:
    conn = psycopg2.connect(
        host=DB_HOST,
        database=DB_NAME,
        user=DB_USER,
        password=DB_PASSWORD,
        port=DB_PORT,
        connect_timeout=30
    )
    cursor = conn.cursor()
    print("✓ Connecté!")
except Exception as e:
    print(f"✗ Erreur de connexion: {e}")
    sys.exit(1)

# ===========================================
# Lecture du fichier SQL
# ===========================================
print("Lecture du fichier seed_procedure_templates.sql...")

with open("data/seed/seed_procedure_templates.sql", "r", encoding="utf-8") as f:
    sql_content = f.read()

print(f"Fichier lu: {len(sql_content)} caractères")
print()

# ===========================================
# Exécution du SQL
# ===========================================
print("Exécution du SQL...")
print("="*50)

try:
    # Exécuter tout le fichier d'un coup
    cursor.execute(sql_content)
    
    # Commit
    conn.commit()
    
    print("✓ Exécution réussie!")
    print(f"✓ Rows affected: {cursor.rowcount}")
    
except Exception as e:
    print(f"✗ Erreur: {e}")
    conn.rollback()
    sys.exit(1)

finally:
    cursor.close()
    conn.close()
    print()
    print("="*50)
    print("Connexion fermée")
