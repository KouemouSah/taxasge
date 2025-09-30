#!/bin/bash

# ============================================================================
# TaxasGE Workflow Cleanup Script - Phase 2 Optimization
# ============================================================================
# This script removes redundant workflows and completes the Phase 2 optimization
# that consolidates dashboard workflows and creates a unified monitoring system.
#
# SAFETY: This script includes safety checks and can be run with --dry-run
# to preview changes before execution.
#
# Author: KOUEMOU SAH Jean Emac
# ============================================================================

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Script configuration
DRY_RUN=false
FORCE=false
BACKUP=true

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --dry-run)
      DRY_RUN=true
      shift
      ;;
    --force)
      FORCE=true
      shift
      ;;
    --no-backup)
      BACKUP=false
      shift
      ;;
    --help)
      echo "TaxasGE Workflow Cleanup Script"
      echo ""
      echo "Usage: $0 [OPTIONS]"
      echo ""
      echo "OPTIONS:"
      echo "  --dry-run     Preview changes without executing them"
      echo "  --force       Skip confirmation prompts"
      echo "  --no-backup   Skip creating backup of removed files"
      echo "  --help        Show this help message"
      echo ""
      echo "This script removes redundant workflows as part of Phase 2 optimization"
      echo "and replaces them with unified-monitoring.yml and project-management.yml"
      exit 0
      ;;
    *)
      echo "Unknown option: $1"
      echo "Use --help for usage information"
      exit 1
      ;;
  esac
done

# Function to print colored output
print_status() {
  local color=$1
  local message=$2
  echo -e "${color}${message}${NC}"
}

print_header() {
  echo ""
  print_status $BLUE "============================================================================"
  print_status $BLUE "$1"
  print_status $BLUE "============================================================================"
  echo ""
}

# Function to check if we're in the right directory
check_repository() {
  if [[ ! -d ".github/workflows" ]]; then
    print_status $RED "❌ Error: .github/workflows directory not found"
    print_status $RED "   Please run this script from the repository root"
    exit 1
  fi

  if [[ ! -f ".github/workflows/unified-monitoring.yml" ]]; then
    print_status $RED "❌ Error: unified-monitoring.yml not found"
    print_status $RED "   Please ensure the new workflows are created before running cleanup"
    exit 1
  fi

  if [[ ! -f ".github/workflows/project-management.yml" ]]; then
    print_status $RED "❌ Error: project-management.yml not found"
    print_status $RED "   Please ensure the new workflows are created before running cleanup"
    exit 1
  fi

  print_status $GREEN "✅ Repository structure validated"
}

# Function to create backup
create_backup() {
  if [[ $BACKUP == false ]]; then
    return
  fi

  local backup_dir="workflow-backups/phase2-cleanup-$(date +%Y%m%d-%H%M%S)"

  if [[ $DRY_RUN == true ]]; then
    print_status $YELLOW "🔍 [DRY RUN] Would create backup in: $backup_dir"
    return
  fi

  mkdir -p "$backup_dir"

  # List of workflows to backup before deletion
  local workflows_to_backup=(
    "status-dashboard.yml"
    "dashboard-integration.yml"
    "milestones.yml"
    "historical_mapper.yml"
    "retroactive-project-builder.yml"
    "project-automation.yml"
  )

  print_status $BLUE "📦 Creating backup of workflows to be removed..."

  local backed_up_count=0
  for workflow in "${workflows_to_backup[@]}"; do
    local source_file=".github/workflows/$workflow"
    if [[ -f "$source_file" ]]; then
      cp "$source_file" "$backup_dir/"
      print_status $GREEN "   ✅ Backed up: $workflow"
      ((backed_up_count++))
    else
      print_status $YELLOW "   ⚠️  Not found: $workflow (may already be removed)"
    fi
  done

  if [[ $backed_up_count -gt 0 ]]; then
    print_status $GREEN "📦 Backup created with $backed_up_count files: $backup_dir"
  else
    print_status $YELLOW "📦 No files found to backup"
  fi
}

# Function to remove a workflow file
remove_workflow() {
  local workflow_file=$1
  local reason=$2
  local replacement=$3

  local full_path=".github/workflows/$workflow_file"

  if [[ ! -f "$full_path" ]]; then
    print_status $YELLOW "   ⚠️  File not found: $workflow_file (may already be removed)"
    return 0
  fi

  if [[ $DRY_RUN == true ]]; then
    print_status $YELLOW "🔍 [DRY RUN] Would remove: $workflow_file"
    print_status $YELLOW "   Reason: $reason"
    print_status $YELLOW "   Replacement: $replacement"
    return 0
  fi

  rm "$full_path"
  print_status $RED "   ❌ Removed: $workflow_file"
  print_status $BLUE "      Reason: $reason"
  print_status $GREEN "      Replacement: $replacement"

  return 1  # Return 1 to indicate a file was removed (for counting)
}

# Function to perform the cleanup
perform_cleanup() {
  print_header "🧹 REMOVING REDUNDANT WORKFLOWS"

  local removed_count=0

  print_status $BLUE "📊 Removing primary consolidation targets..."

  # Primary consolidation targets
  remove_workflow "status-dashboard.yml" \
    "Extremely wasteful (96 executions/day)" \
    "unified-monitoring.yml (3 executions/day)" && ((removed_count++))

  remove_workflow "dashboard-integration.yml" \
    "Duplicates functionality with status dashboard" \
    "unified-monitoring.yml (includes project metrics)" && ((removed_count++))

  print_status $BLUE "📋 Removing redundant project workflows..."

  # Redundant project workflows
  remove_workflow "milestones.yml" \
    "Manual-only workflow, functionality consolidated" \
    "project-management.yml (intelligent milestone management)" && ((removed_count++))

  remove_workflow "historical_mapper.yml" \
    "One-time analysis workflow, no longer needed" \
    "project-management.yml (maintains context)" && ((removed_count++))

  remove_workflow "retroactive-project-builder.yml" \
    "One-time setup workflow, project established" \
    "project-management.yml (ongoing project management)" && ((removed_count++))

  remove_workflow "project-automation.yml" \
    "Daily execution, functionality consolidated" \
    "project-management.yml (weekly execution, 85% reduction)" && ((removed_count++))

  if [[ $DRY_RUN == false ]]; then
    print_status $GREEN "✅ Successfully removed $removed_count workflow files"
  else
    print_status $YELLOW "🔍 [DRY RUN] Would remove $removed_count workflow files"
  fi
}

# Function to validate new workflows
validate_new_workflows() {
  print_header "✅ VALIDATING NEW WORKFLOWS"

  local validation_passed=true

  # Check unified-monitoring.yml
  if grep -q "96.8% reduction" ".github/workflows/unified-monitoring.yml"; then
    print_status $GREEN "✅ unified-monitoring.yml: Optimization documented"
  else
    print_status $YELLOW "⚠️  unified-monitoring.yml: Optimization documentation missing"
    validation_passed=false
  fi

  if grep -q "cron.*0 7" ".github/workflows/unified-monitoring.yml"; then
    print_status $GREEN "✅ unified-monitoring.yml: Smart scheduling configured"
  else
    print_status $YELLOW "⚠️  unified-monitoring.yml: Smart scheduling missing"
    validation_passed=false
  fi

  # Check project-management.yml
  if grep -q "weekly" ".github/workflows/project-management.yml"; then
    print_status $GREEN "✅ project-management.yml: Weekly execution configured"
  else
    print_status $YELLOW "⚠️  project-management.yml: Weekly execution missing"
    validation_passed=false
  fi

  if grep -q "85% reduction" ".github/workflows/project-management.yml"; then
    print_status $GREEN "✅ project-management.yml: Optimization documented"
  else
    print_status $YELLOW "⚠️  project-management.yml: Optimization documentation missing"
    validation_passed=false
  fi

  if [[ $validation_passed == true ]]; then
    print_status $GREEN "✅ All new workflows validated successfully"
  else
    print_status $YELLOW "⚠️  Some validation checks failed - review new workflows"
  fi
}

# Function to generate cleanup summary
generate_summary() {
  print_header "📊 OPTIMIZATION SUMMARY"

  cat << EOF
$(print_status $BLUE "Before Phase 2:")
• status-dashboard.yml: 96 runs/day × 30 days = 2,880 runs/month
• dashboard-integration.yml: 1 run/day × 30 days = 30 runs/month
• project-automation.yml: 9 runs/week × 4 weeks = 36 runs/month
• Other workflows: ~10 runs/month
$(print_status $RED "Total eliminated: ~2,956 runs/month")

$(print_status $BLUE "After Phase 2:")
• unified-monitoring.yml: 3 runs/day × 30 days = 90 runs/month
• project-management.yml: 1 run/week × 4 weeks = 4 runs/month
$(print_status $GREEN "Total new: 94 runs/month")

$(print_status $GREEN "🎯 NET OPTIMIZATION RESULTS:")
$(print_status $GREEN "• Execution reduction: 2,956 → 94 = 96.8% reduction")
$(print_status $GREEN "• Estimated cost reduction: >60%")
$(print_status $GREEN "• Workflow maintenance: 6 → 2 workflows (67% reduction)")
$(print_status $GREEN "• Enhanced functionality: Smart monitoring + intelligent project management")

$(print_status $BLUE "📋 NEXT STEPS:")
1. Monitor new workflows for 1-2 weeks
2. Validate all functionality is preserved
3. Team training on new dashboard and reports
4. Continuous optimization based on usage patterns
EOF
}

# Function to commit changes
commit_changes() {
  if [[ $DRY_RUN == true ]]; then
    print_status $YELLOW "🔍 [DRY RUN] Would commit workflow cleanup changes"
    return
  fi

  print_header "💾 COMMITTING CHANGES"

  # Check if there are changes to commit
  if git diff --quiet && git diff --cached --quiet; then
    print_status $YELLOW "ℹ️  No changes to commit"
    return
  fi

  # Add all changes
  git add -A

  # Create commit message
  local commit_message="🧹 Phase 2 workflow optimization: Remove redundant workflows

- Removed status-dashboard.yml (96 executions/day → 0)
- Removed dashboard-integration.yml (consolidated functionality)
- Removed redundant project workflows (milestones, historical_mapper, etc.)
- Replaced with unified-monitoring.yml (3 executions/day)
- Replaced with project-management.yml (weekly execution)

📊 OPTIMIZATION RESULTS:
- Net execution reduction: 96.8% (2,956 → 94 runs/month)
- Estimated cost reduction: >60%
- Workflow maintenance reduction: 67% (6 → 2 workflows)
- Enhanced: Smart monitoring + intelligent project management

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>"

  # Commit changes
  git commit -m "$commit_message"

  print_status $GREEN "✅ Changes committed successfully"
  print_status $BLUE "💡 You may want to push these changes:"
  print_status $BLUE "   git push origin $(git branch --show-current)"
}

# Main execution function
main() {
  print_header "🎯 TAXASGE WORKFLOW CLEANUP - PHASE 2 OPTIMIZATION"

  print_status $BLUE "This script will optimize your GitHub Actions workflows by:"
  print_status $BLUE "• Removing redundant monitoring workflows (96.8% execution reduction)"
  print_status $BLUE "• Consolidating project management workflows (85% reduction)"
  print_status $BLUE "• Replacing with 2 intelligent, unified workflows"
  echo ""

  if [[ $DRY_RUN == true ]]; then
    print_status $YELLOW "🔍 RUNNING IN DRY-RUN MODE - No changes will be made"
    echo ""
  fi

  # Safety checks
  check_repository

  # Confirmation prompt (unless --force)
  if [[ $FORCE == false && $DRY_RUN == false ]]; then
    echo ""
    print_status $YELLOW "⚠️  This will permanently remove redundant workflow files."
    print_status $YELLOW "   Are you sure you want to continue? [y/N]"
    read -r response
    case "$response" in
      [yY][eE][sS]|[yY])
        print_status $GREEN "✅ Proceeding with cleanup..."
        ;;
      *)
        print_status $BLUE "ℹ️  Cleanup cancelled by user"
        exit 0
        ;;
    esac
  fi

  # Create backup
  create_backup

  # Perform cleanup
  perform_cleanup

  # Validate new workflows
  validate_new_workflows

  # Generate summary
  generate_summary

  # Commit changes
  if [[ $DRY_RUN == false ]]; then
    echo ""
    print_status $YELLOW "💾 Do you want to commit these changes? [y/N]"
    if [[ $FORCE == true ]]; then
      response="y"
      print_status $BLUE "ℹ️  Auto-confirming due to --force flag"
    else
      read -r response
    fi

    case "$response" in
      [yY][eE][sS]|[yY])
        commit_changes
        ;;
      *)
        print_status $BLUE "ℹ️  Changes not committed - you can commit manually later"
        ;;
    esac
  fi

  print_header "🎉 PHASE 2 OPTIMIZATION COMPLETE"

  if [[ $DRY_RUN == false ]]; then
    print_status $GREEN "✅ Workflow cleanup completed successfully"
    print_status $BLUE "📊 Monitor the new workflows over the next few days"
    print_status $BLUE "🚀 Expect significant reduction in GitHub Actions usage"
  else
    print_status $YELLOW "🔍 DRY RUN completed - no actual changes made"
    print_status $BLUE "💡 Run without --dry-run to perform actual cleanup"
  fi
}

# Execute main function
main "$@"