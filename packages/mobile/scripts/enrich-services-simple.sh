#!/bin/bash

set -e

OUTPUT_DIR="./supabase-analysis/enriched"

echo "🔍 Enriching Top 30 services..."

# Process each service
jq -c '.[]' supabase-analysis/full-analysis/top_30_services.json | while read -r service; do
    service_id=$(echo "$service" | jq '.id')
    service_code=$(echo "$service" | jq -r '.service_code')
    category_id=$(echo "$service" | jq '.category_id')

    # Find category
    category=$(jq ".[] | select(.id == $category_id)" "$OUTPUT_DIR/categories.json")
    sector_id=$(echo "$category" | jq -r '.sector_id // empty')

    # Find sector
    if [ -n "$sector_id" ]; then
        sector=$(jq ".[] | select(.id == $sector_id)" "$OUTPUT_DIR/sectors.json")
        ministry_id=$(echo "$sector" | jq -r '.ministry_id // empty')

        # Find ministry
        if [ -n "$ministry_id" ]; then
            ministry=$(jq ".[] | select(.id == $ministry_id)" "$OUTPUT_DIR/ministries.json")
        else
            ministry="{}"
        fi
    else
        sector="{}"
        ministry="{}"
    fi

    # Find required documents
    docs=$(jq "[.[] | select(.fiscal_service_id == $service_id)]" "$OUTPUT_DIR/doc_assignments.json")

    # Add enriched data to service
    echo "$service" | jq --argjson cat "$category" \
                          --argjson sec "$sector" \
                          --argjson min "$ministry" \
                          --argjson docs "$docs" \
        '. + {
            category_name_es: $cat.name_es,
            sector_name_es: $sec.name_es,
            ministry_name_es: $min.name_es,
            ministry_code: $min.code,
            required_documents: $docs
        }'
done | jq -s '.' > "$OUTPUT_DIR/top_30_enriched.json"

count=$(jq 'length' "$OUTPUT_DIR/top_30_enriched.json")
echo "✅ Enriched $count services"
