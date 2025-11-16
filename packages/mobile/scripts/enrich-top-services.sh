#!/bin/bash

# TaxasGE - Enrichir les Top 30 Services avec Ministry et Documents
# OBJECTIF: Extraire toutes les données complètes pour générer les FAQs

set -e

SUPABASE_URL="https://bpdzfkymgydjxxwlctam.supabase.co/rest/v1"
SUPABASE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJwZHpma3ltZ3lkanh4d2xjdGFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMyNzg4NjksImV4cCI6MjA2ODg1NDg2OX0.M0d8r-0fxkwEQYyYfERExRj8sMwmda2UBoHPabgqbFg"

INPUT_FILE="./supabase-analysis/full-analysis/top_30_services.json"
OUTPUT_DIR="./supabase-analysis/enriched"
mkdir -p "$OUTPUT_DIR"

echo "═══════════════════════════════════════════════════════════════════"
echo "   🔍 ENRICHISSEMENT DES TOP 30 SERVICES"
echo "═══════════════════════════════════════════════════════════════════"
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

echo "📥 Extraction des données de référence..."

# Extraire toutes les catégories
echo "  • Categories..."
all_categories=$(query_supabase "categories" "?select=*&limit=200")
echo "$all_categories" > "$OUTPUT_DIR/categories.json"

# Extraire tous les secteurs
echo "  • Sectors..."
all_sectors=$(query_supabase "sectors" "?select=*&limit=50")
echo "$all_sectors" > "$OUTPUT_DIR/sectors.json"

# Extraire tous les ministères
echo "  • Ministries..."
all_ministries=$(query_supabase "ministries" "?select=*&limit=30")
echo "$all_ministries" > "$OUTPUT_DIR/ministries.json"

# Extraire tous les templates de documents
echo "  • Document Templates..."
all_doc_templates=$(query_supabase "document_templates" "?select=*&limit=300")
echo "$all_doc_templates" > "$OUTPUT_DIR/document_templates.json"

# Extraire les assignments déjà récupérés
echo "  • Document Assignments..."
cp ./supabase-analysis/full-analysis/all_doc_assignments.json "$OUTPUT_DIR/doc_assignments.json"

echo ""
echo "════════════════════════════════════════════════════════════════"
echo "🔍 ENRICHISSEMENT DE CHAQUE SERVICE"
echo "════════════════════════════════════════════════════════════════"
echo ""

# Enrichir chaque service
cat "$INPUT_FILE" | jq -c '.[]' | while IFS= read -r service; do
    service_id=$(echo "$service" | jq '.id')
    service_code=$(echo "$service" | jq -r '.service_code')
    service_name=$(echo "$service" | jq -r '.name_es')
    category_id=$(echo "$service" | jq '.category_id')

    echo "📋 Service $service_code: $service_name"

    # Trouver la catégorie
    category=$(cat "$OUTPUT_DIR/categories.json" | jq ".[] | select(.id == $category_id)")

    if [ -n "$category" ]; then
        sector_id=$(echo "$category" | jq '.sector_id')
        category_name=$(echo "$category" | jq -r '.name_es')
        echo "   └─ Catégorie: $category_name"

        # Trouver le secteur
        sector=$(cat "$OUTPUT_DIR/sectors.json" | jq ".[] | select(.id == $sector_id)")

        if [ -n "$sector" ]; then
            ministry_id=$(echo "$sector" | jq '.ministry_id')
            sector_name=$(echo "$sector" | jq -r '.name_es')
            echo "   └─ Secteur: $sector_name"

            # Trouver le ministère
            ministry=$(cat "$OUTPUT_DIR/ministries.json" | jq ".[] | select(.id == $ministry_id)")

            if [ -n "$ministry" ]; then
                ministry_name=$(echo "$ministry" | jq -r '.name_es')
                echo "   └─ Ministère: $ministry_name"
            fi
        fi
    fi

    # Trouver les documents requis
    docs=$(cat "$OUTPUT_DIR/doc_assignments.json" | jq "[.[] | select(.fiscal_service_id == $service_id)]")
    doc_count=$(echo "$docs" | jq 'length')
    echo "   └─ Documents: $doc_count"

    if [ "$doc_count" -gt 0 ]; then
        echo "$docs" | jq -c '.[]' | while IFS= read -r doc_assign; do
            doc_template_id=$(echo "$doc_assign" | jq '.document_template_id')
            is_required=$(echo "$doc_assign" | jq '.is_required_expedition')

            # Trouver le template
            doc_template=$(cat "$OUTPUT_DIR/document_templates.json" | jq ".[] | select(.id == $doc_template_id)")

            if [ -n "$doc_template" ]; then
                doc_name=$(echo "$doc_template" | jq -r '.document_name_es')
                echo "      • $doc_name $([ "$is_required" = "true" ] && echo "(requerido)" || echo "(opcional)")"
            fi
        done
    fi

    # Ajouter ministry et docs au service
    enriched_service=$(echo "$service" | jq ". + {
        category_name_es: $(echo "$category" | jq '.name_es // null'),
        sector_name_es: $(echo "$sector" | jq '.name_es // null'),
        ministry_name_es: $(echo "$ministry" | jq '.name_es // null'),
        ministry_code: $(echo "$ministry" | jq '.code // null'),
        required_documents: $docs
    }")

    echo "$enriched_service"
    echo ""
done | jq -s '.' > "$OUTPUT_DIR/top_30_enriched.json"

echo ""
echo "════════════════════════════════════════════════════════════════"
echo "✅ ENRICHISSEMENT TERMINÉ"
echo "════════════════════════════════════════════════════════════════"
echo ""
echo "📁 Fichier généré: $OUTPUT_DIR/top_30_enriched.json"
echo ""

# Afficher un résumé
enriched_count=$(cat "$OUTPUT_DIR/top_30_enriched.json" | jq 'length')
services_with_ministry=$(cat "$OUTPUT_DIR/top_30_enriched.json" | jq '[.[] | select(.ministry_name_es != null)] | length')
services_with_docs=$(cat "$OUTPUT_DIR/top_30_enriched.json" | jq '[.[] | select(.required_documents != null and (.required_documents | length) > 0)] | length')

echo "📊 RÉSUMÉ:"
echo "   • Services enrichis: $enriched_count"
echo "   • Services avec ministère: $services_with_ministry"
echo "   • Services avec documents: $services_with_docs"
echo ""
