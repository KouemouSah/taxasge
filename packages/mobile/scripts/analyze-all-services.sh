#!/bin/bash

# TaxasGE - Analyse EXHAUSTIVE de TOUS les Services Supabase
# OBJECTIF: Analyser les 850 services réels pour sélectionner les 30 meilleurs pour FAQs
# APPROCHE: Autonome, critique, rigoureuse - ne rien inventer

set -e

SUPABASE_URL="https://bpdzfkymgydjxxwlctam.supabase.co/rest/v1"
SUPABASE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJwZHpma3ltZ3lkanh4d2xjdGFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMyNzg4NjksImV4cCI6MjA2ODg1NDg2OX0.M0d8r-0fxkwEQYyYfERExRj8sMwmda2UBoHPabgqbFg"

OUTPUT_DIR="./supabase-analysis"
ANALYSIS_DIR="$OUTPUT_DIR/full-analysis"
mkdir -p "$ANALYSIS_DIR"

echo "═══════════════════════════════════════════════════════════════════"
echo "   🔍 ANALYSE EXHAUSTIVE DE TOUS LES SERVICES SUPABASE"
echo "═══════════════════════════════════════════════════════════════════"
echo ""
echo "📅 Date: $(date -u +"%Y-%m-%dT%H:%M:%SZ")"
echo "🎯 Objectif: Analyser LES 850 SERVICES pour sélectionner Top 30"
echo "📁 Output: $ANALYSIS_DIR"
echo ""

# Function to query Supabase
query_supabase() {
    local table=$1
    local params=$2
    curl -s -X GET \
        "${SUPABASE_URL}/${table}${params}" \
        -H "apikey: ${SUPABASE_KEY}" \
        -H "Authorization: Bearer ${SUPABASE_KEY}"
}

echo "════════════════════════════════════════════════════════════════"
echo "📊 ÉTAPE 1: EXTRACTION DE TOUS LES SERVICES"
echo "════════════════════════════════════════════════════════════════"
echo ""

echo "🔍 Extraction des services actifs..."
# Extraire TOUS les services actifs (pas de limite)
all_services=$(query_supabase "fiscal_services" "?status=eq.active&select=*&limit=1000")
echo "$all_services" > "$ANALYSIS_DIR/all_services.json"

service_count=$(echo "$all_services" | jq 'length')
echo "✅ Services extraits: $service_count"
echo ""

echo "════════════════════════════════════════════════════════════════"
echo "📊 ÉTAPE 2: ANALYSE STATISTIQUE COMPLÈTE"
echo "════════════════════════════════════════════════════════════════"
echo ""

echo "💰 Analyse des coûts..."
echo "$all_services" | jq -r '
  .[] |
  select(.tasa_expedicion != null) |
  "\(.service_code)|\(.name_es)|\(.tasa_expedicion)|\(.tasa_renovacion)"
' | sort -t'|' -k3 -n > "$ANALYSIS_DIR/services_by_cost.txt"

avg_expedition=$(echo "$all_services" | jq '[.[] | select(.tasa_expedicion != null) | .tasa_expedicion] | add / length')
avg_renovation=$(echo "$all_services" | jq '[.[] | select(.tasa_renovacion != null and .tasa_renovacion > 0) | .tasa_renovacion] | add / length')

echo "   • Coût expédition moyen: $avg_expedition XAF"
echo "   • Coût rénovation moyen: $avg_renovation XAF"

# Coûts min/max
min_cost=$(echo "$all_services" | jq '[.[] | select(.tasa_expedicion != null) | .tasa_expedicion] | min')
max_cost=$(echo "$all_services" | jq '[.[] | select(.tasa_expedicion != null) | .tasa_expedicion] | max')
echo "   • Coût minimum: $min_cost XAF"
echo "   • Coût maximum: $max_cost XAF"
echo ""

echo "⏱️  Analyse des délais..."
echo "$all_services" | jq -r '
  .[] |
  select(.processing_time_days != null) |
  "\(.service_code)|\(.name_es)|\(.processing_time_days)"
' | sort -t'|' -k3 -n > "$ANALYSIS_DIR/services_by_duration.txt"

avg_duration=$(echo "$all_services" | jq '[.[] | select(.processing_time_days != null) | .processing_time_days] | add / length')
min_duration=$(echo "$all_services" | jq '[.[] | select(.processing_time_days != null) | .processing_time_days] | min')
max_duration=$(echo "$all_services" | jq '[.[] | select(.processing_time_days != null) | .processing_time_days] | max')

echo "   • Délai moyen: $avg_duration jours"
echo "   • Délai minimum: $min_duration jours"
echo "   • Délai maximum: $max_duration jours"
echo ""

echo "📈 Analyse de popularité..."
echo "$all_services" | jq -r '
  .[] |
  "\(.service_code)|\(.name_es)|\(.view_count)|\(.calculation_count)|\(.favorite_count)"
' | sort -t'|' -k3 -n -r > "$ANALYSIS_DIR/services_by_popularity.txt"

total_views=$(echo "$all_services" | jq '[.[] | .view_count] | add')
echo "   • Total vues: $total_views"
echo ""

echo "════════════════════════════════════════════════════════════════"
echo "🔍 ÉTAPE 3: RECHERCHE SERVICE PASAPORTE"
echo "════════════════════════════════════════════════════════════════"
echo ""

# Rechercher avec différentes variantes
echo "🔍 Recherche 'pasaporte'..."
pasaporte_exact=$(echo "$all_services" | jq '[.[] | select(.name_es | ascii_downcase | contains("pasaporte"))]')
echo "$pasaporte_exact" > "$ANALYSIS_DIR/pasaporte_services.json"
pasaporte_count=$(echo "$pasaporte_exact" | jq 'length')
echo "   • Trouvés avec 'pasaporte': $pasaporte_count"

if [ "$pasaporte_count" -gt 0 ]; then
    echo ""
    echo "📋 Services Pasaporte trouvés:"
    echo "$pasaporte_exact" | jq -r '.[] | "   • \(.service_code): \(.name_es) (\(.tasa_expedicion) XAF, \(.processing_time_days) jours)"'
fi
echo ""

# Rechercher d'autres documents populaires
echo "🔍 Recherche autres documents communs..."
for keyword in "visa" "dni" "cedula" "licencia" "permiso" "certificado"; do
    count=$(echo "$all_services" | jq "[.[] | select(.name_es | ascii_downcase | contains(\"$keyword\"))] | length")
    echo "   • '$keyword': $count services"
done
echo ""

echo "════════════════════════════════════════════════════════════════"
echo "🔗 ÉTAPE 4: ANALYSE DES RELATIONS"
echo "════════════════════════════════════════════════════════════════"
echo ""

echo "📄 Extraction des assignments documents..."
all_doc_assignments=$(query_supabase "service_document_assignments" "?limit=2000")
echo "$all_doc_assignments" > "$ANALYSIS_DIR/all_doc_assignments.json"
doc_assign_count=$(echo "$all_doc_assignments" | jq 'length')
echo "   • Document assignments: $doc_assign_count"

# Services avec documents
services_with_docs=$(echo "$all_doc_assignments" | jq -r '[.[].fiscal_service_id] | unique | length')
echo "   • Services avec documents: $services_with_docs"
echo ""

echo "📝 Extraction des assignments procédures..."
all_proc_assignments=$(query_supabase "service_procedure_assignments" "?limit=2000")
echo "$all_proc_assignments" > "$ANALYSIS_DIR/all_proc_assignments.json"
proc_assign_count=$(echo "$all_proc_assignments" | jq 'length')
echo "   • Procédure assignments: $proc_assign_count"

services_with_procs=$(echo "$all_proc_assignments" | jq -r '[.[].fiscal_service_id] | unique | length')
echo "   • Services avec procédures: $services_with_procs"
echo ""

echo "════════════════════════════════════════════════════════════════"
echo "🎯 ÉTAPE 5: SÉLECTION TOP 30 SERVICES"
echo "════════════════════════════════════════════════════════════════"
echo ""

echo "📊 Critères de sélection:"
echo "   1. Services avec données complètes (coût, délai, documents, procédure)"
echo "   2. Services populaires (view_count > 0)"
echo "   3. Services représentatifs (différentes catégories/coûts/délais)"
echo ""

# Créer des mappings service_id -> doc_count et proc_count
echo "$all_doc_assignments" | jq -r '.[] | "\(.fiscal_service_id)"' | sort | uniq -c | awk '{print "{\"service_id\":"$2",\"doc_count\":"$1"}"}' > "$ANALYSIS_DIR/doc_counts.json"
echo "$all_proc_assignments" | jq -r '.[] | "\(.fiscal_service_id)"' | sort | uniq -c | awk '{print "{\"service_id\":"$2",\"proc_count\":"$1"}"}' > "$ANALYSIS_DIR/proc_counts.json"

# Créer un score pour chaque service
echo "$all_services" | jq -c '.[]' | while IFS= read -r service; do
  service_id=$(echo "$service" | jq '.id')

  # Compter documents et procédures (avec valeur par défaut)
  doc_count=$(grep "\"service_id\":$service_id," "$ANALYSIS_DIR/doc_counts.json" 2>/dev/null | jq -r '.doc_count')
  proc_count=$(grep "\"service_id\":$service_id," "$ANALYSIS_DIR/proc_counts.json" 2>/dev/null | jq -r '.proc_count')

  # Valeurs par défaut si vides
  doc_count=${doc_count:-0}
  proc_count=${proc_count:-0}

  # Calculer score de complétude
  tasa=$(echo "$service" | jq '.tasa_expedicion // 0')
  dias=$(echo "$service" | jq '.processing_time_days // 0')
  views=$(echo "$service" | jq '.view_count // 0')

  score=0
  [ "$(echo "$tasa > 0" | bc)" = "1" ] && score=$((score + 1))
  [ "$(echo "$dias > 0" | bc)" = "1" ] && score=$((score + 1))
  [ "$doc_count" -gt 0 ] 2>/dev/null && score=$((score + 2))
  [ "$proc_count" -gt 0 ] 2>/dev/null && score=$((score + 2))
  [ "$(echo "$views > 0" | bc)" = "1" ] && score=$((score + 1))

  # Déterminer booleans
  has_docs=$([ "$doc_count" -gt 0 ] && echo "true" || echo "false")
  has_proc=$([ "$proc_count" -gt 0 ] && echo "true" || echo "false")

  # Ajouter les métriques au service
  echo "$service" | jq ". + {doc_count: $doc_count, proc_count: $proc_count, has_documents: $has_docs, has_procedure: $has_proc, completeness_score: $score}"
done > "$ANALYSIS_DIR/services_with_scores.json"

# Trier par score et prendre top 30
echo "🏆 Sélection des 30 meilleurs services..."
cat "$ANALYSIS_DIR/services_with_scores.json" | jq -s '
  sort_by(-.completeness_score, -.view_count) |
  .[0:30]
' > "$ANALYSIS_DIR/top_30_services.json"

echo ""
echo "✅ TOP 30 SERVICES SÉLECTIONNÉS:"
echo "════════════════════════════════════════════════════════════════"
cat "$ANALYSIS_DIR/top_30_services.json" | jq -r '
  .[] |
  "\(.service_code) | \(.name_es[0:40]) | Score: \(.completeness_score) | \(.tasa_expedicion) XAF | \(.processing_time_days)j | Docs: \(.doc_count)"
' | nl

echo ""
echo "════════════════════════════════════════════════════════════════"
echo "📊 RÉSUMÉ DE L'ANALYSE"
echo "════════════════════════════════════════════════════════════════"
echo ""
echo "Services totaux analysés: $service_count"
echo "Services avec documents: $services_with_docs"
echo "Services avec procédures: $services_with_procs"
echo "Services 'pasaporte' trouvés: $pasaporte_count"
echo ""
echo "Coûts: $min_cost - $max_cost XAF (moyenne: $avg_expedition XAF)"
echo "Délais: $min_duration - $max_duration jours (moyenne: $avg_duration jours)"
echo ""
echo "📁 Fichiers générés:"
echo "   • all_services.json - Tous les services"
echo "   • services_with_scores.json - Services avec scores"
echo "   • top_30_services.json - Top 30 sélectionnés"
echo "   • services_by_cost.txt - Services triés par coût"
echo "   • services_by_duration.txt - Services triés par délai"
echo "   • services_by_popularity.txt - Services triés par popularité"
echo ""
echo "════════════════════════════════════════════════════════════════"
echo "✅ ANALYSE TERMINÉE"
echo "════════════════════════════════════════════════════════════════"
