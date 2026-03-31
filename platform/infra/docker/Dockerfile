# =============================================================================
# SNF Agentic Platform — Multi-Stage Docker Build
# =============================================================================
# Stage 1: Build (Node 20, install deps, compile TypeScript)
# Stage 2: Runtime (Node 20 slim, copy dist, run server)
#
# Build: docker build -t snf-agentic-platform .
# Run:   docker run -p 3000:3000 snf-agentic-platform
# =============================================================================

# ---------------------------------------------------------------------------
# Stage 1: Build
# ---------------------------------------------------------------------------
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies first (layer caching optimization)
COPY platform/package.json platform/package-lock.json* ./
RUN npm ci --ignore-scripts

# Copy source and compile
COPY platform/tsconfig.json ./
COPY platform/packages/ ./packages/

RUN npm run build

# ---------------------------------------------------------------------------
# Stage 2: Runtime
# ---------------------------------------------------------------------------
FROM node:20-slim AS runtime

# Security: run as non-root user
RUN groupadd --gid 1001 snf && \
    useradd --uid 1001 --gid snf --shell /bin/sh --create-home snf

WORKDIR /app

# Install production dependencies only
COPY platform/package.json platform/package-lock.json* ./
RUN npm ci --omit=dev --ignore-scripts && \
    npm cache clean --force

# Copy compiled output from builder
COPY --from=builder /app/dist ./dist

# Health check endpoint
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

# Non-root user
USER snf

EXPOSE 3000

ENV NODE_ENV=production
ENV PORT=3000

CMD ["node", "dist/server.js"]
