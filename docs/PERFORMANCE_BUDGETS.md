# PERFORMANCE_BUDGETS.md
**Project**: SNF Agentic Framework
**Updated**: 2026-04-05

## Core Web Vitals (Frontend)

| Metric | P50 Budget | P95 Budget | Alert Threshold | Monitor |
|---|---|---|---|---|
| LCP (Largest Contentful Paint) | < 1.5s | < 2.5s | > 2.5s | Lighthouse CI |
| FID (First Input Delay) | < 50ms | < 100ms | > 100ms | Web Vitals |
| CLS (Cumulative Layout Shift) | < 0.05 | < 0.1 | > 0.1 | Web Vitals |
| INP (Interaction to Next Paint) | < 100ms | < 200ms | > 200ms | Web Vitals |
| TTFB (Time to First Byte) | < 200ms | < 500ms | > 500ms | Lighthouse CI |

## Bundle Size Budgets (Frontend)

Chunk splitting configured in `vite.config.js` via `rollupOptions.output.manualChunks`.

| Chunk | Current Size | Budget | Alert | Status |
|---|---|---|---|---|
| vendor-react (React 19 + React DOM + React Router) | 48 kB | 60 kB | > 60 kB | Shipped |
| vendor-recharts (Recharts 3.8) | 429 kB | 450 kB | > 450 kB | Shipped |
| vendor-icons (Lucide React 0.577) | 35 kB | 50 kB | > 50 kB | Shipped |
| main bundle | 454 kB | 500 kB | > 500 kB (Vite warning threshold) | Shipped |
| Total initial | ~966 kB | 1,060 kB | > 1,060 kB | Shipped |

## Code Splitting Effectiveness

| Metric | Value | Source |
|---|---|---|
| Lazy-loaded pages | 69 | All pages via `React.lazy` + `Suspense` in `src/App.jsx` |
| Vendor chunks | 3 | react, recharts, lucide (`vite.config.js` manualChunks) |
| Route-based splitting | Yes | Each page loads on demand via hash router |
| Suspense fallback | PageSkeleton | `src/components/FeedbackComponents.jsx` |

## API Latency Budgets (Backend)

Fastify 5 server on port 3100 (`platform/packages/api/src/server.ts`). Routes: `/api/decisions`, `/api/agents`, `/api/audit`, `/api/ws`.

| Endpoint Group | P50 Budget | P95 Budget | Alert | Notes |
|---|---|---|---|---|
| GET /api/decisions (list) | < 50ms | < 200ms | > 200ms | Paginated, RLS-filtered |
| POST /api/decisions/:id/approve | < 100ms | < 300ms | > 300ms | Writes + audit log insert |
| GET /api/agents (list) | < 30ms | < 100ms | > 100ms | In-memory registry (30 agents) |
| GET /api/audit (query) | < 100ms | < 500ms | > 500ms | Partitioned table scan |
| GET /api/health | < 10ms | < 50ms | > 50ms | Lightweight status + timestamp |
| WebSocket heartbeat (/api/ws) | < 500ms | < 1s | > 1s | Ping/pong |

## Agent Execution Budgets

Thresholds from `AgentHealthMonitor` config in `platform/src/main.ts` (lines 384-395).

| Metric | P50 Budget | P95 Budget | Alert | Source |
|---|---|---|---|---|
| Task execution time | < 10s | < 30s | > 30s | AgentHealthMonitor |
| Error rate (per agent) | < 1% | < 5% | > 5% (degraded) | `degradedErrorRate: 0.05` |
| Critical error rate | N/A | N/A | > 15% (unhealthy, auto-probation) | `unhealthyErrorRate: 0.15` |
| Response time | < 5s | < 15s | > 15s (degraded) | `degradedResponseTimeMs: 15_000` |
| Response time (unhealthy) | N/A | N/A | > 30s (unhealthy) | `unhealthyResponseTimeMs: 30_000` |
| Dead heartbeat | N/A | N/A | > 3,600s (1 hr, mark dead) | `deadThresholdMs: 60 * 60 * 1000` |
| Health check interval | 30s | N/A | N/A | `healthCheckIntervalMs: 30_000` |
| Metrics retention | 24 hr | N/A | N/A | `MetricsCollector retentionMs: 86_400_000` |

## Database Performance

PostgreSQL 15+ with `pg` pool configured in `platform/src/main.ts` (lines 148-153).

| Metric | P50 Budget | P95 Budget | Notes |
|---|---|---|---|
| Connection pool max | 20 | N/A | `pool.max: 20` |
| Idle timeout | 30s | N/A | `idleTimeoutMillis: 30_000` |
| Connection timeout | 10s | N/A | `connectionTimeoutMillis: 10_000` |
| Decision query | < 20ms | < 100ms | With RLS + index |
| Audit insert | < 10ms | < 50ms | Append-only, SHA-256 hash chain |
| Chain verification | < 5s | < 15s | 24 hr lookback, every 60 min |

## Memory Budgets

| Component | Budget | Alert | Notes |
|---|---|---|---|
| Frontend (browser) | < 150 MB | > 200 MB | 69 lazy-loaded pages, only active page in memory |
| API server (Node.js) | < 512 MB | > 768 MB | Fastify + 20 DB connections |
| Event bus (in-memory) | 50K events max | Auto-evict oldest | `EventBus maxLogSize: 50_000` |
| Run manager history | 50K completed max | Auto-evict oldest | `RunManager maxCompletedHistory: 50_000` |

## CI/CD Performance

GitHub Actions pipeline defined in `.github/workflows/deploy.yml`. Runner: `ubuntu-latest`, Node.js 20.

| Metric | Budget | Alert | Notes |
|---|---|---|---|
| npm ci | < 30s | > 60s | Lockfile-based install |
| Vite build | < 30s | > 60s | With manualChunks code splitting |
| Upload artifact | < 15s | > 30s | `actions/upload-pages-artifact@v3` |
| GitHub Actions total (build + deploy) | < 3 min | > 5 min | Concurrency: `group: pages, cancel-in-progress: true` |

## Monitoring Infrastructure

| System | Purpose | Config | Status |
|---|---|---|---|
| AgentHealthMonitor | Agent error rates, response times, dead detection | 30s interval | Shipped |
| MetricsCollector | 24 hr rolling metrics per agent | 86,400s retention | Shipped |
| ChainVerifier | Audit trail SHA-256 integrity | Every 60 min, 24 hr lookback | Shipped |
| KillSwitch | Emergency agent shutdown | Manual trigger | Shipped |
| AnomalyDetector | Agent behavior anomaly detection | Continuous | Shipped |
| AlertService | Alert routing for health/anomaly events | Event-driven | Shipped |
| Lighthouse CI | Web Vitals on deploy | Per-deploy | Planned |
| APM (DataDog/NewRelic) | Full-stack observability | N/A | Planned (post-credentials) |

## Cross-References

| Document | Path | Relevance |
|---|---|---|
| App Technical Brief | `docs/APP_TECHNICAL_BRIEF.md` | Build config, agent registry, capabilities matrix |
| Architecture Decision Records | `docs/ARCHITECTURE_DECISION_RECORDS.md` | Chunk splitting rationale, lazy loading decisions |
| CLAUDE.md | `CLAUDE.md` | Bundle sizes, page counts, component decomposition |
| Vite config | `vite.config.js` | manualChunks definition |
| Platform entry | `platform/src/main.ts` | Health monitor thresholds, pool config, event bus limits |
| API server | `platform/packages/api/src/server.ts` | Route prefixes, CORS origins, health endpoint |
| CI/CD | `.github/workflows/deploy.yml` | Build pipeline steps, Node version, concurrency |
