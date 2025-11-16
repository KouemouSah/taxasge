#!/bin/bash

# TaxasGE - Enrichissement COMPLET des Top 30 Services
# OBJECTIF: Extraire TOUTES les données réelles (documents + procédures détaillées)

set -e

SUPABASE_URL="https://bpdzfkymgydjxxwlctam.supabase.co/rest/v1"
SUPABASE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJwZHpma3ltZ3lkanh4d2xjdGFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMyNzg4NjksImV4cCI6MjA2ODg1NDg2OX0.M0d8r-0fxkwEQYyYfERExRj8sMwmda2UBoHPabgqbFg"

OUTPUT_DIR="./supabase-analysis/complete-enriched"
mkdir -p "$OUTPUT_DIR"

echo "═══════════════════════════════════════════════════════════════════"
echo "   🔍 ENRICHISSEMENT COMPLET DES TOP 30 SERVICES"
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

# Extraire tous les procedure templates
echo "  • Procedure Templates..."
all_proc_templates=$(query_supabase "procedure_templates" "?select=*&limit=2000")
echo "$all_proc_templates" > "$OUTPUT_DIR/procedure_templates.json"

# Extraire tous les procedure steps
echo "  • Procedure Steps..."
all_proc_steps=$(query_supabase "procedure_template_steps" "?select=*&order=template_id.asc,step_number.asc&limit=5000")
echo "$all_proc_steps" > "$OUTPUT_DIR/procedure_template_steps.json"

# Copier les données déjà extraites
echo "  • Copying existing data..."
cp ./supabase-analysis/enriched/top_30_enriched.json "$OUTPUT_DIR/top_30_base.json"
cp ./supabase-analysis/enriched/document_templates.json "$OUTPUT_DIR/document_templates.json"
cp ./supabase-analysis/full-analysis/all_proc_assignments.json "$OUTPUT_DIR/proc_assignments.json"

echo ""
echo "════════════════════════════════════════════════════════════════"
echo "🔍 ENRICHISSEMENT COMPLET DE CHAQUE SERVICE"
echo "════════════════════════════════════════════════════════════════"
echo ""

# Enrichir chaque service avec procédures complètes
jq -c '.[]' "$OUTPUT_DIR/top_30_base.json" | while read -r service; do
    service_id=$(echo "$service" | jq '.id')
    service_code=$(echo "$service" | jq -r '.service_code')
    service_name=$(echo "$service" | jq -r '.name_es')

    echo "📋 $service_code: $service_name"

    # Trouver les assignments de procédures
    proc_assignments=$(jq "[.[] | select(.fiscal_service_id == $service_id)]" "$OUTPUT_DIR/proc_assignments.json")
    proc_count=$(echo "$proc_assignments" | jq 'length')

    if [ "$proc_count" -gt 0 ]; then
        echo "   └─ Procédures: $proc_count"

        # Pour chaque procédure, extraire les détails et steps
        procedures_enriched=$(echo "$proc_assignments" | jq -c '.[]' | while read -r proc_assign; do
            template_id=$(echo "$proc_assign" | jq '.template_id')

            # Trouver le template
            proc_template=$(jq ".[] | select(.id == $template_id)" "$OUTPUT_DIR/procedure_templates.json")
            proc_name=$(echo "$proc_template" | jq -r '.name_es // "N/A"')

            echo "      • $proc_name"

            # Trouver les steps
            proc_steps=$(jq "[.[] | select(.template_id == $template_id)] | sort_by(.step_number)" "$OUTPUT_DIR/procedure_template_steps.json")
            step_count=$(echo "$proc_steps" | jq 'length')

            if [ "$step_count" -gt 0 ]; then
                echo "        Steps: $step_count"
                echo "$proc_steps" | jq -c '.[]' | while read -r step; do
                    step_num=$(echo "$step" | jq '.step_number')
                    step_desc=$(echo "$step" | jq -r '.description_es')
                    echo "        $step_num. $step_desc"
                done
            fi

            # Retourner procédure enrichie avec steps
            echo "$proc_assign" | jq --argjson template "$proc_template" \
                                     --argjson steps "$proc_steps" \
                '. + {
                    template_details: $template,
                    procedure_steps: $steps
                }'
        done | jq -s '.')
    else
        procedures_enriched="[]"
    fi

    # Enrichir documents avec détails complets
    doc_assignments=$(echo "$service" | jq '.required_documents')
    documents_enriched=$(echo "$doc_assignments" | jq -c '.[]' | while read -r doc_assign; do
        doc_template_id=$(echo "$doc_assign" | jq '.document_template_id')

        # Trouver le template complet
        doc_template=$(jq ".[] | select(.id == $doc_template_id)" "$OUTPUT_DIR/document_templates.json")

        # Retourner document enrichi
        echo "$doc_assign" | jq --argjson template "$doc_template" \
            '. + {
                template_details: $template
            }'
    done | jq -s '.')

    # Créer le service complet enrichi
    echo "$service" | jq --argjson procs "$procedures_enriched" \
                          --argjson docs "$documents_enriched" \
        '. + {
            procedures: $procs,
            required_documents_enriched: $docs
        }'
done | jq -s '.' > "$OUTPUT_DIR/top_30_complete.json"

echo ""
echo "════════════════════════════════════════════════════════════════"
echo "✅ ENRICHISSEMENT COMPLET TERMINÉ"
echo "════════════════════════════════════════════════════════════════"
echo ""

count=$(jq 'length' "$OUTPUT_DIR/top_30_complete.json")
services_with_proc_details=$(jq '[.[] | select(.procedures | length > 0)] | length' "$OUTPUT_DIR/top_30_complete.json")
services_with_doc_details=$(jq '[.[] | select(.required_documents_enriched | length > 0)] | length' "$OUTPUT_DIR/top_30_complete.json")

echo "📊 RÉSUMÉ:"
echo "   • Services enrichis: $count"
echo "   • Services avec détails procédures: $services_with_proc_details"
echo "   • Services avec détails documents: $services_with_doc_details"
echo ""
echo "📁 Fichier généré: $OUTPUT_DIR/top_30_complete.json"
echo ""
