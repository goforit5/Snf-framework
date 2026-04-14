#!/usr/bin/env bash
# =============================================================================
# SNF Agentic Platform — Staging Teardown
# =============================================================================
# Destroys staging infrastructure for cost savings.
#
# Default: destroys compute only (keeps VPC + database for quick re-deploy).
# --full:  destroys everything including VPC and database.
#
# Usage:
#   ./teardown-staging.sh           # compute-only teardown
#   ./teardown-staging.sh --full    # full environment destroy
# =============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TF_DIR="${SCRIPT_DIR}/../infra/terraform/environments/staging"
REGION="us-east-1"
FULL_DESTROY=false

# ---------------------------------------------------------------------------
# Parse arguments
# ---------------------------------------------------------------------------

while [[ $# -gt 0 ]]; do
  case "$1" in
    --full)
      FULL_DESTROY=true
      shift
      ;;
    --region)
      REGION="$2"
      shift 2
      ;;
    -h|--help)
      echo "Usage: $0 [--full] [--region us-east-1]"
      echo ""
      echo "Options:"
      echo "  --full    Destroy everything (VPC, database, compute)"
      echo "            Default: compute-only (keeps VPC + database)"
      exit 0
      ;;
    *)
      echo "Unknown argument: $1"
      exit 1
      ;;
  esac
done

# ---------------------------------------------------------------------------
# Resolve account ID
# ---------------------------------------------------------------------------

ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
STATE_BUCKET="snf-terraform-state-${ACCOUNT_ID}"

cd "${TF_DIR}"

# Ensure we're initialized
terraform init \
  -backend-config="bucket=${STATE_BUCKET}" \
  -backend-config="region=${REGION}" \
  -reconfigure > /dev/null 2>&1

echo "============================================================"
echo "SNF Staging Teardown"
echo "============================================================"
echo "Account: ${ACCOUNT_ID}"
echo "Region:  ${REGION}"
echo "Mode:    $(if ${FULL_DESTROY}; then echo 'FULL DESTROY'; else echo 'Compute-only'; fi)"
echo "============================================================"
echo ""

if ${FULL_DESTROY}; then
  echo "WARNING: This will destroy ALL staging resources including the database."
  echo "         All data will be permanently lost."
  echo ""
  read -r -p "Type 'destroy-all' to confirm: " CONFIRM
  if [[ "${CONFIRM}" != "destroy-all" ]]; then
    echo "Aborted."
    exit 0
  fi

  echo ""
  echo "--- Full destroy ---"
  terraform destroy \
    -var="region=${REGION}"

else
  echo "Destroying compute resources only (VPC + database preserved)..."
  echo ""
  read -r -p "Type 'yes' to continue: " CONFIRM
  if [[ "${CONFIRM}" != "yes" ]]; then
    echo "Aborted."
    exit 0
  fi

  echo ""
  echo "--- Compute-only destroy ---"

  # Target only compute modules for destruction
  terraform destroy \
    -var="region=${REGION}" \
    -target='module.snf_platform.module.compute_orchestrator' \
    -target='module.snf_platform.module.compute_mcp_gateway'

  echo ""
  echo "Preserved resources:"
  echo "  - VPC / networking"
  echo "  - Database (Aurora PostgreSQL)"
  echo "  - Secrets Manager entries"
  echo ""
  echo "To re-deploy compute: ./deploy-staging.sh"
fi

echo ""
echo "============================================================"
echo "Teardown complete."
echo "============================================================"
