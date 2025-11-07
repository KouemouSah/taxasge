#!/usr/bin/env python3

"""
TaxasGE - Enrichissement COMPLET des Top 30 Services
Extraction de TOUTES les données réelles (documents + procédures + steps)
"""

import json
import time
import urllib.request
import urllib.error
from pathlib import Path

SUPABASE_URL = "https://bpdzfkymgydjxxwlctam.supabase.co/rest/v1"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJwZHpma3ltZ3lkanh4d2xjdGFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMyNzg4NjksImV4cCI6MjA2ODg1NDg2OX0.M0d8r-0fxkwEQYyYfERExRj8sMwmda2UBoHPabgqbFg"

OUTPUT_DIR = Path("./supabase-analysis/complete-enriched")
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

def query_supabase(table: str, params: str = "", max_retries: int = 3) -> list:
    """Query Supabase with retry logic"""
    url = f"{SUPABASE_URL}/{table}{params}"
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}"
    }

    for attempt in range(max_retries):
        try:
            req = urllib.request.Request(url, headers=headers)
            with urllib.request.urlopen(req, timeout=30) as response:
                data = json.loads(response.read().decode())
                return data if isinstance(data, list) else []
        except (urllib.error.URLError, urllib.error.HTTPError, TimeoutError) as e:
            if attempt < max_retries - 1:
                wait_time = 2 ** attempt  # Exponential backoff
                print(f"   ⚠️  Retry {attempt + 1}/{max_retries} after {wait_time}s...")
                time.sleep(wait_time)
            else:
                print(f"   ❌ Failed after {max_retries} attempts: {e}")
                return []

    return []

def main():
    print("═" * 70)
    print("   🔍 ENRICHISSEMENT COMPLET DES TOP 30 SERVICES (Python)")
    print("═" * 70)
    print()

    # Load existing base data
    print("📥 Loading base data...")
    with open("./supabase-analysis/enriched/top_30_enriched.json") as f:
        top_30_base = json.load(f)

    with open("./supabase-analysis/enriched/document_templates.json") as f:
        doc_templates = {doc["id"]: doc for doc in json.load(f)}

    with open("./supabase-analysis/full-analysis/all_proc_assignments.json") as f:
        proc_assignments_list = json.load(f)
        proc_assignments = {}
        for assign in proc_assignments_list:
            service_id = assign["fiscal_service_id"]
            if service_id not in proc_assignments:
                proc_assignments[service_id] = []
            proc_assignments[service_id].append(assign)

    print("   ✅ Base data loaded")
    print()

    # Extract procedure templates and steps
    print("📥 Extracting procedure data from Supabase...")
    print("   • Procedure Templates...")
    proc_templates_list = query_supabase("procedure_templates", "?select=*&limit=2000")
    proc_templates = {pt["id"]: pt for pt in proc_templates_list}
    print(f"   ✅ {len(proc_templates)} templates")

    print("   • Procedure Steps...")
    all_proc_steps = query_supabase("procedure_template_steps", "?select=*&order=template_id.asc,step_number.asc&limit=5000")
    proc_steps = {}
    for step in all_proc_steps:
        template_id = step["template_id"]
        if template_id not in proc_steps:
            proc_steps[template_id] = []
        proc_steps[template_id].append(step)
    print(f"   ✅ {len(all_proc_steps)} steps for {len(proc_steps)} templates")
    print()

    # Enrich each service
    print("════════════════════════════════════════════════════════════════")
    print("🔍 ENRICHING TOP 30 SERVICES")
    print("════════════════════════════════════════════════════════════════")
    print()

    enriched_services = []

    for service in top_30_base:
        service_id = service["id"]
        service_code = service["service_code"]
        service_name = service["name_es"]

        print(f"📋 {service_code}: {service_name}")

        # Enrich procedures with full details and steps
        procedures_enriched = []
        service_proc_assigns = proc_assignments.get(service_id, [])

        for proc_assign in service_proc_assigns:
            template_id = proc_assign["template_id"]
            template = proc_templates.get(template_id, {})
            steps = proc_steps.get(template_id, [])

            proc_name = template.get("name_es", "N/A")
            print(f"   └─ Procédure: {proc_name}")
            print(f"      Steps: {len(steps)}")

            for step in steps:
                print(f"      {step['step_number']}. {step['description_es']}")

            procedures_enriched.append({
                **proc_assign,
                "template_details": template,
                "procedure_steps": steps
            })

        # Enrich documents with full details
        documents_enriched = []
        for doc_assign in service.get("required_documents", []):
            doc_template_id = doc_assign["document_template_id"]
            doc_template = doc_templates.get(doc_template_id, {})

            documents_enriched.append({
                **doc_assign,
                "template_details": doc_template
            })

        # Create fully enriched service
        enriched_service = {
            **service,
            "procedures": procedures_enriched,
            "required_documents_enriched": documents_enriched
        }

        enriched_services.append(enriched_service)
        print()

    # Save enriched data
    output_file = OUTPUT_DIR / "top_30_complete.json"
    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(enriched_services, f, ensure_ascii=False, indent=2)

    print("════════════════════════════════════════════════════════════════")
    print("✅ ENRICHISSEMENT COMPLET TERMINÉ")
    print("════════════════════════════════════════════════════════════════")
    print()

    services_with_procs = sum(1 for s in enriched_services if len(s["procedures"]) > 0)
    services_with_docs = sum(1 for s in enriched_services if len(s["required_documents_enriched"]) > 0)
    total_steps = sum(len(step) for s in enriched_services for proc in s["procedures"] for step in [proc.get("procedure_steps", [])])

    print(f"📊 RÉSUMÉ:")
    print(f"   • Services enrichis: {len(enriched_services)}")
    print(f"   • Services avec procédures: {services_with_procs}")
    print(f"   • Services avec documents: {services_with_docs}")
    print(f"   • Total procedure steps: {total_steps}")
    print()
    print(f"📁 Fichier généré: {output_file}")
    print()

if __name__ == "__main__":
    main()
