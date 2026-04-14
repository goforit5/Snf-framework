#!/usr/bin/env bash
# =============================================================================
# SNF Agentic Platform — AWS Account Bootstrap
# =============================================================================
# Creates foundational AWS resources required before Terraform can run:
#   1. S3 bucket for Terraform state (versioned, KMS-encrypted)
#   2. DynamoDB table for state locking
#   3. ECR repositories for container images
#   4. IAM role + policies for ECS task execution
#
# Idempotent: checks if each resource exists before creating.
#
# Usage:
#   ./bootstrap-aws.sh [--region us-east-1]
#
# Prerequisites:
#   - AWS CLI v2 configured with appropriate credentials
#   - Permissions: s3, dynamodb, ecr, iam
# =============================================================================

set -euo pipefail

# ---------------------------------------------------------------------------
# Defaults
# ---------------------------------------------------------------------------

REGION="us-east-1"
PROJECT="snf-agentic-platform"
ROLE_NAME="snf-ecs-task-role"
POLICY_NAME="snf-ecs-task-policy"

# ---------------------------------------------------------------------------
# Parse arguments
# ---------------------------------------------------------------------------

while [[ $# -gt 0 ]]; do
  case "$1" in
    --region)
      REGION="$2"
      shift 2
      ;;
    --region=*)
      REGION="${1#*=}"
      shift
      ;;
    -h|--help)
      echo "Usage: $0 [--region us-east-1]"
      echo ""
      echo "Bootstraps AWS resources for SNF Terraform deployment:"
      echo "  - S3 state bucket (versioned, KMS-encrypted)"
      echo "  - DynamoDB lock table"
      echo "  - ECR repositories (snf-orchestrator, snf-mcp-gateway)"
      echo "  - IAM role for ECS tasks"
      exit 0
      ;;
    *)
      echo "Unknown argument: $1"
      exit 1
      ;;
  esac
done

# ---------------------------------------------------------------------------
# Resolve AWS account ID
# ---------------------------------------------------------------------------

echo "============================================================"
echo "SNF Agentic Platform — AWS Bootstrap"
echo "============================================================"
echo "Region: ${REGION}"
echo ""

ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
echo "AWS Account: ${ACCOUNT_ID}"
echo ""

STATE_BUCKET="snf-terraform-state-${ACCOUNT_ID}"
LOCK_TABLE="snf-terraform-locks"
ECR_REPOS=("snf-orchestrator" "snf-mcp-gateway")

# ---------------------------------------------------------------------------
# Tracking
# ---------------------------------------------------------------------------

CREATED=()
EXISTING=()

# ---------------------------------------------------------------------------
# 1. S3 Terraform State Bucket
# ---------------------------------------------------------------------------

echo "--- S3 State Bucket ---"

if aws s3api head-bucket --bucket "${STATE_BUCKET}" 2>/dev/null; then
  echo "  [EXISTS] s3://${STATE_BUCKET}"
  EXISTING+=("s3://${STATE_BUCKET}")
else
  echo "  [CREATE] s3://${STATE_BUCKET}"

  # us-east-1 does not accept LocationConstraint
  if [[ "${REGION}" == "us-east-1" ]]; then
    aws s3api create-bucket \
      --bucket "${STATE_BUCKET}" \
      --region "${REGION}" \
      --output text > /dev/null
  else
    aws s3api create-bucket \
      --bucket "${STATE_BUCKET}" \
      --region "${REGION}" \
      --create-bucket-configuration LocationConstraint="${REGION}" \
      --output text > /dev/null
  fi

  # Enable versioning
  aws s3api put-bucket-versioning \
    --bucket "${STATE_BUCKET}" \
    --versioning-configuration Status=Enabled

  # Enable KMS encryption
  aws s3api put-bucket-encryption \
    --bucket "${STATE_BUCKET}" \
    --server-side-encryption-configuration '{
      "Rules": [{
        "ApplyServerSideEncryptionByDefault": {
          "SSEAlgorithm": "aws:kms"
        },
        "BucketKeyEnabled": true
      }]
    }'

  # Block public access
  aws s3api put-public-access-block \
    --bucket "${STATE_BUCKET}" \
    --public-access-block-configuration \
      BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true

  CREATED+=("s3://${STATE_BUCKET}")
fi

echo ""

# ---------------------------------------------------------------------------
# 2. DynamoDB Lock Table
# ---------------------------------------------------------------------------

echo "--- DynamoDB Lock Table ---"

if aws dynamodb describe-table --table-name "${LOCK_TABLE}" --region "${REGION}" 2>/dev/null | grep -q "ACTIVE"; then
  echo "  [EXISTS] ${LOCK_TABLE}"
  EXISTING+=("dynamodb:${LOCK_TABLE}")
else
  echo "  [CREATE] ${LOCK_TABLE}"

  aws dynamodb create-table \
    --table-name "${LOCK_TABLE}" \
    --attribute-definitions AttributeName=LockID,AttributeType=S \
    --key-schema AttributeName=LockID,KeyType=HASH \
    --billing-mode PAY_PER_REQUEST \
    --region "${REGION}" \
    --output text > /dev/null

  # Wait for table to become active
  aws dynamodb wait table-exists \
    --table-name "${LOCK_TABLE}" \
    --region "${REGION}"

  CREATED+=("dynamodb:${LOCK_TABLE}")
fi

echo ""

# ---------------------------------------------------------------------------
# 3. ECR Repositories
# ---------------------------------------------------------------------------

echo "--- ECR Repositories ---"

for REPO in "${ECR_REPOS[@]}"; do
  if aws ecr describe-repositories --repository-names "${REPO}" --region "${REGION}" 2>/dev/null | grep -q "${REPO}"; then
    echo "  [EXISTS] ${REPO}"
    EXISTING+=("ecr:${REPO}")
  else
    echo "  [CREATE] ${REPO}"

    aws ecr create-repository \
      --repository-name "${REPO}" \
      --image-scanning-configuration scanOnPush=true \
      --encryption-configuration encryptionType=KMS \
      --region "${REGION}" \
      --output text > /dev/null

    # Set lifecycle policy: keep last 10 untagged images
    aws ecr put-lifecycle-policy \
      --repository-name "${REPO}" \
      --region "${REGION}" \
      --lifecycle-policy-text '{
        "rules": [{
          "rulePriority": 1,
          "description": "Expire untagged images after 10",
          "selection": {
            "tagStatus": "untagged",
            "countType": "imageCountMoreThan",
            "countNumber": 10
          },
          "action": { "type": "expire" }
        }]
      }' \
      --output text > /dev/null

    CREATED+=("ecr:${REPO}")
  fi
done

echo ""

# ---------------------------------------------------------------------------
# 4. IAM Role for ECS Tasks
# ---------------------------------------------------------------------------

echo "--- IAM ECS Task Role ---"

if aws iam get-role --role-name "${ROLE_NAME}" 2>/dev/null | grep -q "${ROLE_NAME}"; then
  echo "  [EXISTS] ${ROLE_NAME}"
  EXISTING+=("iam:${ROLE_NAME}")
else
  echo "  [CREATE] ${ROLE_NAME}"

  # Trust policy: allow ECS tasks to assume this role
  aws iam create-role \
    --role-name "${ROLE_NAME}" \
    --assume-role-policy-document '{
      "Version": "2012-10-17",
      "Statement": [{
        "Effect": "Allow",
        "Principal": { "Service": "ecs-tasks.amazonaws.com" },
        "Action": "sts:AssumeRole"
      }]
    }' \
    --description "SNF Agentic Platform ECS task role — Bedrock, Secrets Manager, CloudWatch, ECR" \
    --output text > /dev/null

  CREATED+=("iam:${ROLE_NAME}")
fi

# Ensure inline policy is up to date (idempotent put)
echo "  [POLICY] Updating inline policy: ${POLICY_NAME}"

aws iam put-role-policy \
  --role-name "${ROLE_NAME}" \
  --policy-name "${POLICY_NAME}" \
  --policy-document "{
    \"Version\": \"2012-10-17\",
    \"Statement\": [
      {
        \"Sid\": \"BedrockInvoke\",
        \"Effect\": \"Allow\",
        \"Action\": [
          \"bedrock:InvokeModel\",
          \"bedrock:InvokeModelWithResponseStream\"
        ],
        \"Resource\": \"arn:aws:bedrock:${REGION}:${ACCOUNT_ID}:*\"
      },
      {
        \"Sid\": \"SecretsRead\",
        \"Effect\": \"Allow\",
        \"Action\": [
          \"secretsmanager:GetSecretValue\",
          \"secretsmanager:DescribeSecret\"
        ],
        \"Resource\": \"arn:aws:secretsmanager:${REGION}:${ACCOUNT_ID}:secret:snf-*\"
      },
      {
        \"Sid\": \"CloudWatchLogs\",
        \"Effect\": \"Allow\",
        \"Action\": [
          \"logs:CreateLogGroup\",
          \"logs:CreateLogStream\",
          \"logs:PutLogEvents\"
        ],
        \"Resource\": \"arn:aws:logs:${REGION}:${ACCOUNT_ID}:log-group:/ecs/snf-*\"
      },
      {
        \"Sid\": \"ECRPull\",
        \"Effect\": \"Allow\",
        \"Action\": [
          \"ecr:GetDownloadUrlForLayer\",
          \"ecr:BatchGetImage\",
          \"ecr:GetAuthorizationToken\",
          \"ecr:BatchCheckLayerAvailability\"
        ],
        \"Resource\": \"*\"
      }
    ]
  }"

echo ""

# ---------------------------------------------------------------------------
# Summary
# ---------------------------------------------------------------------------

echo "============================================================"
echo "Bootstrap Summary"
echo "============================================================"
echo ""

if [[ ${#CREATED[@]} -gt 0 ]]; then
  echo "Created (${#CREATED[@]}):"
  for r in "${CREATED[@]}"; do
    echo "  + ${r}"
  done
  echo ""
fi

if [[ ${#EXISTING[@]} -gt 0 ]]; then
  echo "Already existed (${#EXISTING[@]}):"
  for r in "${EXISTING[@]}"; do
    echo "  = ${r}"
  done
  echo ""
fi

echo "------------------------------------------------------------"
echo "Terraform Variables (copy into your tfvars or export):"
echo "------------------------------------------------------------"
echo ""
echo "  TF_STATE_BUCKET = \"${STATE_BUCKET}\""
echo "  TF_LOCK_TABLE   = \"${LOCK_TABLE}\""
echo "  AWS_REGION       = \"${REGION}\""
echo "  AWS_ACCOUNT_ID   = \"${ACCOUNT_ID}\""
echo "  ECR_ORCHESTRATOR = \"${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com/snf-orchestrator\""
echo "  ECR_MCP_GATEWAY  = \"${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com/snf-mcp-gateway\""
echo "  ECS_TASK_ROLE    = \"arn:aws:iam::${ACCOUNT_ID}:role/${ROLE_NAME}\""
echo ""
echo "============================================================"
echo "Bootstrap complete. Run 'terraform init' with the S3 backend."
echo "============================================================"
