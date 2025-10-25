import requests
import json
import time
import sys

# ===========================================
# CONFIGURATION - MODIFIER AVEC TES VALEURS
# ===========================================
SUPABASE_URL = "https://YOUR_PROJECT_ID.supabase.co"
SUPABASE_SERVICE_KEY = "YOUR_SERVICE_ROLE_KEY"  # Service role key (settings > API)

# ===========================================
# Fonction pour exécuter une requête SQL
# ===========================================
def execute_sql(sql_content):
    url = f"{SUPABASE_URL}/rest/v1/rpc/query"
    
    headers = {
        "apikey": SUPABASE_SERVICE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=representation"
    }
    
    # Créer payload
    payload = {"query": sql_content}
    
    try:
        response = requests.post(url, headers=headers, json=payload, timeout=120)
        return response
    except Exception as e:
        print(f"Erreur: {e}")
        return None

# ===========================================
# Lire et diviser le fichier SQL
# ===========================================
print("Lecture du fichier seed_procedure_templates.sql...")

with open("data/seed/seed_procedure_templates.sql", "r", encoding="utf-8") as f:
    content = f.read()

# Diviser par sections logiques (chaque INSERT)
print("Division en chunks...")

lines = content.split("
")
chunks = []
current_chunk = []
in_transaction = False

for line in lines:
    if line.strip() == "BEGIN;":
        continue  # Skip BEGIN
    elif line.strip() == "COMMIT;":
        continue  # Skip COMMIT
    elif line.strip().startswith("INSERT INTO"):
        # Nouveau chunk
        if current_chunk:
            chunks.append("
".join(current_chunk))
            current_chunk = []
    
    current_chunk.append(line)

# Ajouter dernier chunk
if current_chunk:
    chunks.append("
".join(current_chunk))

print(f"Fichier divisé en {len(chunks)} chunks")
print()

# ===========================================
# Exécuter chunk par chunk avec transaction
# ===========================================
print("Début de l'insertion...")
print("="*50)

# D'abord BEGIN
response = execute_sql("BEGIN;")
if not response or response.status_code >= 400:
    print(f"ERREUR BEGIN: {response.text if response else 'No response'}")
    sys.exit(1)

print("✓ Transaction démarrée")

success_count = 0
error_count = 0

for i, chunk in enumerate(chunks, 1):
    # Skip chunks vides
    if not chunk.strip():
        continue
    
    print(f"[{i}/{len(chunks)}] Exécution...", end="")
    
    response = execute_sql(chunk)
    
    if response and response.status_code < 400:
        print(" ✓")
        success_count += 1
    else:
        print(f" ✗ ERREUR")
        error_text = response.text if response else "No response"
        print(f"  Erreur: {error_text[:200]}")
        error_count += 1
        
        # Si erreur critique, rollback et arrêt
        if error_count > 10:
            print("
Trop d'erreurs, ROLLBACK...")
            execute_sql("ROLLBACK;")
            sys.exit(1)
    
    # Petit délai pour ne pas surcharger l'API
    time.sleep(0.1)

# Commit final
print()
print("Commit de la transaction...")
response = execute_sql("COMMIT;")

if response and response.status_code < 400:
    print("✓ Transaction validée")
else:
    print(f"✗ ERREUR COMMIT: {response.text if response else 'No response'}")
    sys.exit(1)

print()
print("="*50)
print(f"Terminé: {success_count} succès, {error_count} erreurs")
