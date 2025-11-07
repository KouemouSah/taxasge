#!/bin/bash

# TaxasGE - Supabase Schema Analyzer (via curl)
# OBJECTIF: Extraire le schéma complet et les données réelles
# Utilise curl au lieu de fetch() qui échoue en Node.js

SUPABASE_URL="https://bpdzfkymgydjxxwlctam.supabase.co/rest/v1"
SUPABASE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJwZHpma3ltZ3lkanh4d2xjdGFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMyNzg4NjksImV4cCI6MjA2ODg1NDg2OX0.M0d8r-0fxkwEQYyYfERExRj8sMwmda2UBoHPabgqbFg"

OUTPUT_DIR="./supabase-analysis"
mkdir -p "$OUTPUT_DIR"

echo "═══════════════════════════════════════════════════════════════════"
echo "        🔍 ANALYSE CRITIQUE DU SCHÉMA SUPABASE TAXASGE (CURL)"
echo "═══════════════════════════════════════════════════════════════════"
echo ""
echo "📅 Date: $(date -u +"%Y-%m-%dT%H:%M:%SZ")"
echo "🔗 Supabase URL: $SUPABASE_URL"
echo "📁 Output dir: $OUTPUT_DIR"
echo ""

# Function to query Supabase
query_supabase() {
    local table=$1
    local params=$2
    curl -s -X GET \
        "${SUPABASE_URL}/${table}${params}" \
        -H "apikey: ${SUPABASE_KEY}" \
        -H "Authorization: Bearer ${SUPABASE_KEY}" \
        -H "Prefer: count=exact"
}

# Function to get count
get_count() {
    local table=$1
    query_supabase "$table" "?limit=0" | jq -r 'length'
}

echo "════════════════════════════════════════════════════════════════"
echo "📊 ÉTAPE 1: EXTRACTION DES COUNTS"
echo "════════════════════════════════════════════════════════════════"
echo ""

declare -A TABLES=(
    [ministries]=14
    [sectors]=16
    [categories]=98
    [fiscal_services]=850
    [service_keywords]=7014
    [procedure_templates]=703
    [procedure_template_steps]=2077
    [document_templates]=792
    [service_procedure_assignments]=850
    [service_document_assignments]=1234
    [entity_translations]=8420
)

for table in "${!TABLES[@]}"; do
    expected=${TABLES[$table]}
    echo "📊 Analyzing: $table..."

    # Get sample data
    data=$(query_supabase "$table" "?limit=5")
    echo "$data" > "$OUTPUT_DIR/${table}_sample.json"

    # Count using jq
    actual=$(echo "$data" | jq 'length')

    if [ "$actual" -eq "$expected" ] || [ "$actual" -gt 0 ]; then
        echo "   ✅ Sample extracted: $actual rows (expected total: $expected)"
    else
        echo "   ⚠️  Sample extracted: $actual rows (expected total: $expected)"
    fi

    # Extract schema from first row
    schema=$(echo "$data" | jq -r '.[0] | to_entries | .[] | "\(.key): \(.value | type)"')
    echo "$schema" > "$OUTPUT_DIR/${table}_schema.txt"

    echo ""
done

echo ""
echo "════════════════════════════════════════════════════════════════"
echo "🔍 ÉTAPE 2: ANALYSE SERVICE EXEMPLE (Pasaporte)"
echo "════════════════════════════════════════════════════════════════"
echo ""

# Chercher service pasaporte
echo "🔍 Recherche service 'pasaporte'..."
service=$(query_supabase "fiscal_services" "?name_es=ilike.*pasaporte*&limit=1")
echo "$service" | jq '.' > "$OUTPUT_DIR/service_pasaporte.json"

service_id=$(echo "$service" | jq -r '.[0].id')
ministry_id=$(echo "$service" | jq -r '.[0].ministry_id')
category_id=$(echo "$service" | jq -r '.[0].category_id')
service_code=$(echo "$service" | jq -r '.[0].service_code')

echo "   📋 Service ID: $service_id"
echo "   🏛️  Ministry ID: $ministry_id"
echo "   📂 Category ID: $category_id"
echo "   🔑 Service Code: $service_code"
echo ""

if [ "$ministry_id" != "null" ] && [ -n "$ministry_id" ]; then
    echo "🏛️  Récupération du ministère..."
    ministry=$(query_supabase "ministries" "?id=eq.$ministry_id")
    echo "$ministry" | jq '.' > "$OUTPUT_DIR/ministry_example.json"
    echo "$ministry" | jq -r '.[0].name_es'
    echo ""
fi

if [ "$category_id" != "null" ] && [ -n "$category_id" ]; then
    echo "📂 Récupération de la catégorie..."
    category=$(query_supabase "categories" "?id=eq.$category_id")
    echo "$category" | jq '.' > "$OUTPUT_DIR/category_example.json"
    echo "$category" | jq -r '.[0].name_es'
    echo ""
fi

if [ "$service_id" != "null" ] && [ -n "$service_id" ]; then
    echo "📝 Récupération des procedure assignments..."
    proc_assign=$(query_supabase "service_procedure_assignments" "?service_id=eq.$service_id")
    echo "$proc_assign" | jq '.' > "$OUTPUT_DIR/procedure_assignments.json"

    proc_template_id=$(echo "$proc_assign" | jq -r '.[0].procedure_template_id')
    echo "   📋 Procedure Template ID: $proc_template_id"
    echo ""

    if [ "$proc_template_id" != "null" ] && [ -n "$proc_template_id" ]; then
        echo "📋 Récupération du procedure template..."
        proc_template=$(query_supabase "procedure_templates" "?id=eq.$proc_template_id")
        echo "$proc_template" | jq '.' > "$OUTPUT_DIR/procedure_template.json"
        echo "$proc_template" | jq -r '.[0]'
        echo ""

        echo "📊 Récupération des procedure steps..."
        steps=$(query_supabase "procedure_template_steps" "?procedure_template_id=eq.$proc_template_id&order=step_order.asc")
        echo "$steps" | jq '.' > "$OUTPUT_DIR/procedure_steps.json"

        # Calculer délai total
        total_days=$(echo "$steps" | jq '[.[].estimated_duration_days] | add')
        step_count=$(echo "$steps" | jq 'length')
        echo "   ⏱️  DÉLAI TOTAL: $total_days jours ($step_count étapes)"
        echo ""
    fi

    echo "📄 Récupération des document assignments..."
    doc_assign=$(query_supabase "service_document_assignments" "?service_id=eq.$service_id")
    echo "$doc_assign" | jq '.' > "$OUTPUT_DIR/document_assignments.json"

    doc_count=$(echo "$doc_assign" | jq 'length')
    echo "   📑 Documents requis: $doc_count"

    if [ "$doc_count" -gt 0 ]; then
        doc_ids=$(echo "$doc_assign" | jq -r '[.[].document_template_id] | join(",")')
        echo "$doc_ids" | tr ',' '\n' | while read doc_id; do
            doc=$(query_supabase "document_templates" "?id=eq.$doc_id")
            echo "$doc" | jq -r '.[0].name_es'
        done > "$OUTPUT_DIR/documents_list.txt"
        cat "$OUTPUT_DIR/documents_list.txt"
    fi
    echo ""

    echo "🔑 Récupération des keywords..."
    keywords=$(query_supabase "service_keywords" "?service_id=eq.$service_id")
    echo "$keywords" | jq '.' > "$OUTPUT_DIR/keywords.json"
    echo "$keywords" | jq -r '.[].keyword_text'
    echo ""
fi

echo "🌐 Récupération des traductions..."
translations=$(query_supabase "entity_translations" "?entity_type=eq.service&entity_code=eq.$service_code&limit=10")
echo "$translations" | jq '.' > "$OUTPUT_DIR/translations.json"
echo "   📊 Traductions: $(echo $translations | jq 'length')"
echo ""

echo ""
echo "════════════════════════════════════════════════════════════════"
echo "✅ ANALYSE TERMINÉE"
echo "════════════════════════════════════════════════════════════════"
echo ""
echo "📁 Fichiers générés dans: $OUTPUT_DIR/"
ls -lh "$OUTPUT_DIR/"
