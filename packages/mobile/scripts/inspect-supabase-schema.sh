#!/bin/bash

# Script to inspect Supabase database structure using REST API
# Purpose: Query actual table structures to understand which columns should be synced

SUPABASE_URL="https://bpdzfkymgydjxxwlctam.supabase.co"
SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJwZHpma3ltZ3lkanh4d2xjdGFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMyNzg4NjksImV4cCI6MjA2ODg1NDg2OX0.M0d8r-0fxkwEQYyYfERExRj8sMwmda2UBoHPabgqbFg"

echo "🔍 Starting Supabase Database Inspection"
echo "=========================================="
echo ""

# Array of tables to inspect
tables=(
  "ministries:14"
  "sectors:16"
  "categories:98"
  "fiscal_services:850"
  "service_keywords:100"
  "procedure_templates:703"
  "procedure_template_steps:2077"
  "document_templates:792"
  "service_procedure_assignments:850"
  "service_document_assignments:1234"
  "entity_translations:8420"
)

# Function to inspect a table
inspect_table() {
  local table_name=$1
  local expected_count=$2

  echo ""
  echo "========================================"
  echo "📊 Inspecting: $table_name"
  echo "========================================"

  # Get one record to see column structure
  local response=$(curl -s -X GET \
    "${SUPABASE_URL}/rest/v1/${table_name}?limit=1" \
    -H "apikey: ${SUPABASE_ANON_KEY}" \
    -H "Authorization: Bearer ${SUPABASE_ANON_KEY}")

  # Check if error
  if echo "$response" | grep -q "error"; then
    echo "❌ Error querying $table_name:"
    echo "$response" | jq '.'
    return
  fi

  # Get count using HEAD request
  local count_response=$(curl -s -I -X HEAD \
    "${SUPABASE_URL}/rest/v1/${table_name}?select=count" \
    -H "apikey: ${SUPABASE_ANON_KEY}" \
    -H "Authorization: Bearer ${SUPABASE_ANON_KEY}" \
    -H "Prefer: count=exact")

  local count=$(echo "$count_response" | grep -i "content-range" | sed 's/.*\///' | tr -d '\r')

  echo "✅ Total records: $count (expected: $expected_count)"

  if [ "$count" != "$expected_count" ]; then
    local diff=$((count - expected_count))
    echo "⚠️  Discrepancy: $diff records difference"
  fi

  echo ""
  echo "📋 Columns and sample data:"
  echo "$response" | jq '.[0]' | head -100
}

# Inspect each table
for item in "${tables[@]}"; do
  IFS=':' read -r table expected <<< "$item"
  inspect_table "$table" "$expected"
  sleep 0.5  # Avoid rate limiting
done

echo ""
echo "========================================"
echo "🔬 CRITICAL TABLE ANALYSIS"
echo "========================================"
echo ""

# Detailed analysis for fiscal_services
echo "📌 Checking fiscal_services for name_fr/name_en columns..."
fiscal_sample=$(curl -s -X GET \
  "${SUPABASE_URL}/rest/v1/fiscal_services?limit=1" \
  -H "apikey: ${SUPABASE_ANON_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_ANON_KEY}")

echo "$fiscal_sample" | jq '.[0] | keys' | grep -q "name_fr" && echo "   ✅ Has name_fr" || echo "   ❌ MISSING name_fr"
echo "$fiscal_sample" | jq '.[0] | keys' | grep -q "name_en" && echo "   ✅ Has name_en" || echo "   ❌ MISSING name_en"
echo "$fiscal_sample" | jq '.[0] | keys' | grep -q "name_es" && echo "   ✅ Has name_es" || echo "   ❌ MISSING name_es"

echo ""
echo "📌 Checking entity_translations structure..."
entity_trans_sample=$(curl -s -X GET \
  "${SUPABASE_URL}/rest/v1/entity_translations?limit=5" \
  -H "apikey: ${SUPABASE_ANON_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_ANON_KEY}")

echo "Sample entity_translations records:"
echo "$entity_trans_sample" | jq '.[] | {entity_type, entity_code, language_code, field_name, translation_text}' | head -50

echo ""
echo "✅ Inspection complete!"
