#!/bin/bash
# =============================================================================
# SNF Platform — Docker Build + ECR Push
# =============================================================================
# Builds both Docker images (orchestrator + gateway) and pushes to ECR.
#
# Usage:
#   ./build-and-push.sh                                    # defaults
#   ./build-and-push.sh --region us-west-2                 # custom region
#   ./build-and-push.sh --tag v1.0.0                       # custom tag
#   ./build-and-push.sh --account-id 123456789012          # explicit account
#   ./build-and-push.sh --skip-push                        # build only
#
# Requires: docker, aws CLI (authenticated to ECR)
# =============================================================================

set -euo pipefail

# ---------------------------------------------------------------------------
# Defaults
# ---------------------------------------------------------------------------
REGION="us-east-1"
TAG=""
ACCOUNT_ID=""
SKIP_PUSH=false
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PLATFORM_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

# ---------------------------------------------------------------------------
# Parse arguments
# ---------------------------------------------------------------------------
while [[ $# -gt 0 ]]; do
    case $1 in
        --region)     REGION="$2";     shift 2 ;;
        --tag)        TAG="$2";        shift 2 ;;
        --account-id) ACCOUNT_ID="$2"; shift 2 ;;
        --skip-push)  SKIP_PUSH=true;  shift ;;
        -h|--help)
            echo "Usage: $0 [--region REGION] [--tag TAG] [--account-id ID] [--skip-push]"
            exit 0
            ;;
        *) echo "Unknown option: $1"; exit 1 ;;
    esac
done

# Default tag: staging-<short-sha>
if [[ -z "$TAG" ]]; then
    SHORT_SHA=$(git -C "$PLATFORM_DIR" rev-parse --short HEAD 2>/dev/null || echo "unknown")
    TAG="staging-${SHORT_SHA}"
fi

# ---------------------------------------------------------------------------
# Preflight checks
# ---------------------------------------------------------------------------
echo "=== SNF Platform Docker Build ==="
echo ""

# Check Docker is running
if ! docker info >/dev/null 2>&1; then
    echo "ERROR: Docker is not running. Start Docker Desktop and try again."
    exit 1
fi

# Resolve AWS account ID
if [[ -z "$ACCOUNT_ID" ]]; then
    if command -v aws >/dev/null 2>&1; then
        ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text 2>/dev/null || true)
    fi
    if [[ -z "$ACCOUNT_ID" ]]; then
        echo "ERROR: Could not determine AWS account ID. Pass --account-id or configure AWS CLI."
        exit 1
    fi
fi

ECR_REGISTRY="${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com"
ORCHESTRATOR_REPO="snf-orchestrator"
GATEWAY_REPO="snf-mcp-gateway"

echo "Region:     $REGION"
echo "Account:    $ACCOUNT_ID"
echo "Tag:        $TAG"
echo "Registry:   $ECR_REGISTRY"
echo ""

# ---------------------------------------------------------------------------
# Step 1: ECR login
# ---------------------------------------------------------------------------
if [[ "$SKIP_PUSH" == false ]]; then
    echo "--- Authenticating to ECR ---"
    aws ecr get-login-password --region "$REGION" | \
        docker login --username AWS --password-stdin "$ECR_REGISTRY"
    echo ""
fi

# ---------------------------------------------------------------------------
# Step 2: Build orchestrator image
# ---------------------------------------------------------------------------
echo "--- Building orchestrator image ---"
docker build \
    -f "$PLATFORM_DIR/infra/docker/Dockerfile" \
    -t "${ORCHESTRATOR_REPO}:${TAG}" \
    -t "${ORCHESTRATOR_REPO}:latest" \
    "$PLATFORM_DIR/.."
echo ""

# ---------------------------------------------------------------------------
# Step 3: Build gateway image
# ---------------------------------------------------------------------------
echo "--- Building gateway image ---"
docker build \
    -f "$PLATFORM_DIR/infra/docker/Dockerfile.gateway" \
    -t "${GATEWAY_REPO}:${TAG}" \
    -t "${GATEWAY_REPO}:latest" \
    "$PLATFORM_DIR"
echo ""

# ---------------------------------------------------------------------------
# Step 4: Show image sizes
# ---------------------------------------------------------------------------
echo "--- Image sizes ---"
docker images --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}" | \
    grep -E "(snf-orchestrator|snf-mcp-gateway|REPOSITORY)" || true
echo ""

# ---------------------------------------------------------------------------
# Step 5: Tag and push
# ---------------------------------------------------------------------------
if [[ "$SKIP_PUSH" == true ]]; then
    echo "--- Skipping push (--skip-push) ---"
else
    echo "--- Tagging for ECR ---"
    docker tag "${ORCHESTRATOR_REPO}:${TAG}" "${ECR_REGISTRY}/${ORCHESTRATOR_REPO}:${TAG}"
    docker tag "${ORCHESTRATOR_REPO}:latest" "${ECR_REGISTRY}/${ORCHESTRATOR_REPO}:latest"
    docker tag "${GATEWAY_REPO}:${TAG}" "${ECR_REGISTRY}/${GATEWAY_REPO}:${TAG}"
    docker tag "${GATEWAY_REPO}:latest" "${ECR_REGISTRY}/${GATEWAY_REPO}:latest"

    echo "--- Pushing to ECR ---"
    docker push "${ECR_REGISTRY}/${ORCHESTRATOR_REPO}:${TAG}"
    docker push "${ECR_REGISTRY}/${ORCHESTRATOR_REPO}:latest"
    docker push "${ECR_REGISTRY}/${GATEWAY_REPO}:${TAG}"
    docker push "${ECR_REGISTRY}/${GATEWAY_REPO}:latest"
    echo ""
fi

# ---------------------------------------------------------------------------
# Step 6: Print image URIs for Terraform
# ---------------------------------------------------------------------------
echo "=== ECR Image URIs (for terraform apply -var) ==="
echo ""
echo "  orchestrator_image = \"${ECR_REGISTRY}/${ORCHESTRATOR_REPO}:${TAG}\""
echo "  gateway_image      = \"${ECR_REGISTRY}/${GATEWAY_REPO}:${TAG}\""
echo ""
echo "=== Done ==="
