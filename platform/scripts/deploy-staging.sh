#!/usr/bin/env bash
# =============================================================================
# SNF Agentic Platform — Staging Deployment Orchestrator
# =============================================================================
# End-to-end deployment of the staging environment:
#   1. terraform init (S3 backend)
#   2. terraform plan
#   3. terraform apply (with confirmation)
#   4. Extract outputs (ALB URL, DB endpoint, NLB endpoint)
#   5. Run database migrations via ECS one-off task
#   6. Seed secrets into Secrets Manager
#   7. Health check validation
#
# Usage:
#   ./deploy-staging.sh [--auto-approve]
#
# Prerequisites:
#   - AWS CLI configured + bootstrap-aws.sh already run
#   - Docker images pushed to ECR (snf-orchestrator, snf-mcp-gateway)
# =============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TF_DIR="${SCRIPT_DIR}/../infra/terraform/environments/staging"
REGION="us-east-1"
AUTO_APPROVE=""

# ---------------------------------------------------------------------------
# Parse arguments
# ---------------------------------------------------------------------------

while [[ $# -gt 0 ]]; do
  case "$1" in
    --auto-approve)
      AUTO_APPROVE="-auto-approve"
      shift
      ;;
    --region)
      REGION="$2"
      shift 2
      ;;
    -h|--help)
      echo "Usage: $0 [--auto-approve] [--region us-east-1]"
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

echo "============================================================"
echo "SNF Staging Deployment"
echo "============================================================"
echo "Account:  ${ACCOUNT_ID}"
echo "Region:   ${REGION}"
echo "State:    s3://${STATE_BUCKET}/staging/terraform.tfstate"
echo "============================================================"
echo ""

# ---------------------------------------------------------------------------
# Step 1: Terraform Init
# ---------------------------------------------------------------------------

echo "--- Step 1: terraform init ---"

cd "${TF_DIR}"

terraform init \
  -backend-config="bucket=${STATE_BUCKET}" \
  -backend-config="region=${REGION}" \
  -reconfigure

echo ""

# ---------------------------------------------------------------------------
# Step 2: Terraform Plan
# ---------------------------------------------------------------------------

echo "--- Step 2: terraform plan ---"

terraform plan \
  -var="region=${REGION}" \
  -out=staging.tfplan

echo ""

# ---------------------------------------------------------------------------
# Step 3: Terraform Apply
# ---------------------------------------------------------------------------

echo "--- Step 3: terraform apply ---"

if [[ -n "${AUTO_APPROVE}" ]]; then
  terraform apply ${AUTO_APPROVE} staging.tfplan
else
  echo "Review the plan above. Apply?"
  read -r -p "  Type 'yes' to continue: " CONFIRM
  if [[ "${CONFIRM}" != "yes" ]]; then
    echo "Aborted."
    exit 0
  fi
  terraform apply staging.tfplan
fi

echo ""

# ---------------------------------------------------------------------------
# Step 4: Extract Outputs
# ---------------------------------------------------------------------------

echo "--- Step 4: Extract outputs ---"

SERVICE_URL=$(terraform output -raw service_url 2>/dev/null || echo "pending")
DB_HOST=$(terraform output -raw database_host 2>/dev/null || echo "pending")
VPC_ID=$(terraform output -raw vpc_id 2>/dev/null || echo "pending")

echo "  Service URL:  ${SERVICE_URL}"
echo "  Database:     (sensitive — see terraform output)"
echo "  VPC ID:       ${VPC_ID}"
echo ""

# ---------------------------------------------------------------------------
# Step 5: Database Migrations (ECS one-off task)
# ---------------------------------------------------------------------------

echo "--- Step 5: Database migrations ---"

CLUSTER_NAME="snf-agentic-platform-staging"
MIGRATION_TASK_DEF="snf-migration-staging"

# Check if migration task definition exists
if aws ecs describe-task-definition --task-definition "${MIGRATION_TASK_DEF}" --region "${REGION}" 2>/dev/null; then
  echo "  Running migration task..."

  TASK_ARN=$(aws ecs run-task \
    --cluster "${CLUSTER_NAME}" \
    --task-definition "${MIGRATION_TASK_DEF}" \
    --launch-type FARGATE \
    --network-configuration "awsvpcConfiguration={subnets=[$(terraform output -json private_subnet_ids 2>/dev/null | tr -d '[]"' || echo '')],securityGroups=[],assignPublicIp=DISABLED}" \
    --region "${REGION}" \
    --query 'tasks[0].taskArn' \
    --output text 2>/dev/null || echo "")

  if [[ -n "${TASK_ARN}" && "${TASK_ARN}" != "None" ]]; then
    echo "  Waiting for migration task: ${TASK_ARN}"
    aws ecs wait tasks-stopped --cluster "${CLUSTER_NAME}" --tasks "${TASK_ARN}" --region "${REGION}" 2>/dev/null || true
    echo "  Migration task completed."
  else
    echo "  [WARN] Could not start migration task — run manually after first deploy."
  fi
else
  echo "  [SKIP] Migration task definition not found — create it after first deploy."
fi

echo ""

# ---------------------------------------------------------------------------
# Step 6: Seed Secrets
# ---------------------------------------------------------------------------

echo "--- Step 6: Seed secrets ---"

SECRETS=(
  "snf-staging/database-url"
  "snf-staging/anthropic-api-key"
  "snf-staging/pcc-client-id"
  "snf-staging/pcc-client-secret"
  "snf-staging/workday-tenant-url"
)

for SECRET_NAME in "${SECRETS[@]}"; do
  if aws secretsmanager describe-secret --secret-id "${SECRET_NAME}" --region "${REGION}" 2>/dev/null | grep -q "${SECRET_NAME}"; then
    echo "  [EXISTS] ${SECRET_NAME}"
  else
    echo "  [CREATE] ${SECRET_NAME} (placeholder)"
    aws secretsmanager create-secret \
      --name "${SECRET_NAME}" \
      --description "SNF staging — populate with real value" \
      --secret-string "PLACEHOLDER_SET_ME" \
      --region "${REGION}" \
      --output text > /dev/null 2>&1 || echo "  [WARN] Failed to create ${SECRET_NAME}"
  fi
done

echo ""

# ---------------------------------------------------------------------------
# Step 7: Health Check Validation
# ---------------------------------------------------------------------------

echo "--- Step 7: Health check validation ---"

if [[ "${SERVICE_URL}" != "pending" ]]; then
  echo "  Waiting 30s for service to stabilize..."
  sleep 30

  HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "${SERVICE_URL}/api/health" --max-time 10 2>/dev/null || echo "000")

  if [[ "${HTTP_STATUS}" == "200" ]]; then
    echo "  [PASS] Health check returned 200"
  else
    echo "  [WARN] Health check returned ${HTTP_STATUS} — service may still be starting"
  fi
else
  echo "  [SKIP] Service URL not available yet"
fi

echo ""

# ---------------------------------------------------------------------------
# Done
# ---------------------------------------------------------------------------

echo "============================================================"
echo "Staging deployment complete."
echo ""
echo "Next steps:"
echo "  1. Populate secrets: aws secretsmanager put-secret-value --secret-id snf-staging/<name> --secret-string '<value>'"
echo "  2. Push container images to ECR"
echo "  3. Run: npx tsx scripts/validate-staging.ts"
echo "============================================================"
