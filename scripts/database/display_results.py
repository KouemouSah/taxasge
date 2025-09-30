#SCRIPT SUMMARY

#============================================================================
#Ce script Python de prévisualisation effectue :
#1. 📖 Lit et décode le fichier de rapport 'historical-context.json'
#2. 📊 Extrait et formate les données clés (progression, phase critique, etc.)
#3. 🖥️ Affiche un résumé lisible du statut du projet dans la console
#4. 🛡️ Gère les erreurs (fichier manquant, JSON invalide) et quitte avec un code d'erreur

#Exécution : Conçu pour être appelé dans un workflow CI/CD après la génération du rapport
#Entrée : Le fichier 'historical-context.json' présent à la racine
#Sortie : Un résumé textuel formaté dans la sortie standard (logs du workflow)
#============================================================================

import json
import sys

# Ce script est destiné à être exécuté par le workflow GitHub Actions.

try:
    # Le script est exécuté depuis la racine, le chemin est donc direct.
    with open("historical-context.json", "r", encoding="utf-8") as f:
        data = json.load(f)

    print("📊 Preview du contexte historique :")
    print(f"   - Progression globale: {data['metadata']['overall_progress']}%")
    print(f"   - Phase critique: {data['project_status']['current_phase']}")
    print(f"   - Niveau de confiance: {data['project_status']['confidence_level']}")
    
    print("\n   --- Détail des phases ---")
    # <-- BOUCLE AJOUTÉE ICI
    for phase, info in data["phases"].items():
        print(f"   - {info['title']}: {info['completion']}% ({info['status']})")

except FileNotFoundError:
    print("⚠️ Erreur : Le fichier 'historical-context.json' n'a pas été trouvé.")
    sys.exit(1) # Sortie avec un code d'erreur pour faire échouer le step
except (KeyError, json.JSONDecodeError) as e:
    print(f"❌ Erreur : Le fichier JSON est invalide ou des clés manquent. Détails : {e}")
    sys.exit(1)