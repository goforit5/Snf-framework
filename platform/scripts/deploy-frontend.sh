#!/usr/bin/env bash
set -euo pipefail

###############################################################################
# deploy-frontend.sh — Build React app and deploy to S3 + CloudFront
###############################################################################

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Required env vars
: "${S3_BUCKET:?Set S3_BUCKET to the frontend bucket name}"
: "${CLOUDFRONT_DISTRIBUTION_ID:?Set CLOUDFRONT_DISTRIBUTION_ID}"

VITE_API_URL="${VITE_API_URL:-/api}"

echo "==> Building frontend (API_URL=$VITE_API_URL)..."
cd "$PROJECT_ROOT"
VITE_API_URL="$VITE_API_URL" npm run build

echo "==> Uploading dist/ to s3://$S3_BUCKET..."
aws s3 sync dist/ "s3://$S3_BUCKET" \
  --delete \
  --cache-control "public, max-age=31536000, immutable" \
  --exclude "index.html" \
  --exclude "*.json"

# index.html and manifests get short cache
aws s3 cp dist/index.html "s3://$S3_BUCKET/index.html" \
  --cache-control "public, max-age=60"

# Copy any JSON manifests with short cache
find dist/ -name "*.json" -exec sh -c \
  'aws s3 cp "$1" "s3://'"$S3_BUCKET"'/$(echo "$1" | sed "s|^dist/||")" --cache-control "public, max-age=60"' \
  _ {} \;

echo "==> Invalidating CloudFront cache..."
aws cloudfront create-invalidation \
  --distribution-id "$CLOUDFRONT_DISTRIBUTION_ID" \
  --paths "/*" \
  --query 'Invalidation.Id' \
  --output text

echo "==> Deploy complete."
