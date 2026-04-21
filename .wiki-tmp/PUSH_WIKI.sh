#!/bin/bash
# ============================================
# Wiki Push Script - Run this manually
# ============================================
# All 9 wiki pages are already in /tmp/taxasge-wiki/
# This script commits and pushes them to GitHub.
# ============================================

set -e

cd /tmp/taxasge-wiki

echo "Files in wiki repo:"
ls -la *.md
echo ""

echo "=== Staging all files ==="
git add -A

echo "=== Status ==="
git status

echo "=== Committing ==="
git commit -m "$(cat <<'EOF'
docs(wiki): create 9 comprehensive wiki pages

Pages created:
- Home: Platform overview, key metrics (873 services, 145 tables, 36 workflows)
- Architecture: 3-tier backend, module-based frontend, database design
- API-Reference: 50+ API routers, auth flow, endpoint catalog
- Database-Schema: 145 tables across 10 domains, 50+ enums
- Module-Catalog: 30 backend + 41 frontend modules
- Workflow-Reference: 36 workflows, state machine, wizard steps
- Deployment-Guide: Cloud Run, GitHub Actions CI/CD, branch strategy
- Security: JWT+2FA, RBAC (47 roles, 335 permissions), OWASP
- i18n-Guide: Trilingual support (es/fr/en)

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>
EOF
)"

echo "=== Pushing to GitHub wiki ==="
git push origin master

echo ""
echo "=== Done! Wiki published at: ==="
echo "https://github.com/KouemouSah/taxasge/wiki"
