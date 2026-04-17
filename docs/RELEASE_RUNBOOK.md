# RELEASE_RUNBOOK.md

**Project**: SNF Agentic Framework
**Updated**: 2026-04-14

---

## Overview

Three-tier deployment pipeline:

| Tier | Target | Trigger | Method |
|---|---|---|---|
| Tier 1 | Frontend (GitHub Pages) | Merge PR to `main` | GitHub Actions (`deploy.yml`) |
| Tier 2 | Backend (AWS ECS) | Manual / CI | Docker image push + ECS task update |
| Tier 3 | Native Apps (TestFlight / Enterprise) | Manual | Xcode archive + upload |

**Flow**: Feature branch -> PR -> review -> merge to `main` -> CI builds -> deploy

---

## Prerequisites

| Requirement | Check Command | Version | Notes |
|---|---|---|---|
| Node.js | `node --version` | >= 20.0.0 | Matches CI (`actions/setup-node` node-version: 20) and `platform/package.json` engines |
| npm | `npm --version` | >= 10 | Lockfile-based install (`npm ci`) |
| Swift | `swift --version` | >= 6.2 | `swift-tools-version: 6.2` in all Package.swift files |
| Xcode | `xcodebuild -version` | >= 16.0 | Required for iOS 26 / macOS 26 SDK targets |
| git | `git --version` | >= 2.x | Source control |
| gh CLI | `gh --version` | >= 2.x | PR creation, release management |
| AWS CLI | `aws --version` | >= 2.x | ECS deployment (Tier 2) |
| Docker | `docker --version` | >= 24.x | Backend container builds (Tier 2) |

---

## Tier 1: Frontend -- GitHub Pages

### Pre-Deploy Checklist

| # | Step | Command | Expected | Gate |
|---|---|---|---|---|
| 1 | Install deps | `npm ci` | 0 errors | Blocking |
| 2 | Lint | `npm run lint` | 0 errors, 0 warnings | Blocking |
| 3 | Build | `npm run build` | 0 errors, 0 warnings | Blocking |
| 4 | Bundle size -- main | Check `dist/assets/index-*.js` | < 500 kB (Vite warning threshold) | Blocking |
| 5 | Bundle size -- vendor-react | Check `dist/assets/vendor-react-*.js` | < 60 kB | Blocking |
| 6 | Bundle size -- vendor-recharts | Check `dist/assets/vendor-recharts-*.js` | < 450 kB | Blocking |
| 7 | Bundle size -- vendor-icons | Check `dist/assets/vendor-icons-*.js` | < 50 kB | Blocking |
| 8 | Bundle size -- total initial | Sum of all chunks | < 1,060 kB | Blocking |
| 9 | Preview | `npm run preview` | Manual smoke test at `http://localhost:4173/Snf-framework/` | Non-blocking |

**Bundle budgets source**: `docs/PERFORMANCE_BUDGETS.md` -- Bundle Size Budgets table

### Deploy Steps

| # | Step | Actor | Details |
|---|---|---|---|
| 1 | Merge PR to `main` | Human | Squash or merge commit |
| 2 | CI triggers | GitHub Actions | `.github/workflows/deploy.yml`, trigger: `push.branches: [main]` |
| 3 | CI: checkout | `actions/checkout@v4` | Clones repo |
| 4 | CI: setup Node | `actions/setup-node@v4` | Node.js 20 |
| 5 | CI: install | `npm ci` | Lockfile-based deterministic install |
| 6 | CI: build | `npm run build` | Vite build with manualChunks (react, recharts, lucide) to `dist/` |
| 7 | CI: upload artifact | `actions/upload-pages-artifact@v3` | Uploads `dist/` directory |
| 8 | CI: deploy | `actions/deploy-pages@v4` | Deploys to `gh-pages` environment |
| 9 | Verify | Human | Load `https://goforit5.github.io/Snf-framework/` |

**Concurrency**: `group: pages`, `cancel-in-progress: true` -- new deploys cancel in-flight ones.

**Permissions**: `contents: read`, `pages: write`, `id-token: write`

### Post-Deploy Verification

| Check | Method | Expected |
|---|---|---|
| Site loads | Browser: `https://goforit5.github.io/Snf-framework/` | React app renders, sidebar visible |
| Hash routing works | Navigate to `/#/command-center` | CommandCenter page loads |
| Dark mode toggle | Click theme toggle in top bar | All 69 pages support light/dark |
| Lazy loading | Open DevTools Network tab, navigate pages | Chunks load on demand |
| Presentation decks | Load `/Snf-framework/presentation.html`, `/Snf-framework/presentation-barry.html` | Slides render, keyboard nav works |

### Rollback

| # | Action | Command | Notes |
|---|---|---|---|
| 1 | Revert merge commit | `git revert <merge-sha> && git push origin main` | Creates new commit, triggers redeploy |
| 2 | Emergency: force-deploy previous | `gh workflow run deploy.yml --ref <previous-sha>` | Uses `workflow_dispatch` trigger |
| 3 | Verify rollback | Load `https://goforit5.github.io/Snf-framework/` | Confirm previous version active |

---

## Tier 2: Backend -- AWS ECS (Planned)

### Pre-Deploy Checklist

| # | Step | Command | Expected | Gate |
|---|---|---|---|---|
| 1 | Install deps | `cd platform && npm ci` | 0 errors | Blocking |
| 2 | Typecheck | `npm run typecheck` | 0 errors (tsc --build) | Blocking |
| 3 | Lint | `npm run lint` | 0 errors | Blocking |
| 4 | Unit tests | `npm run test` | All pass (vitest) | Blocking |
| 5 | Build | `npm run build` | All workspaces build | Blocking |
| 6 | Env vars present | Diff `.env` against `.env.sample` | All keys populated | Blocking |

### Environment Variables

All variables from `platform/.env.sample`:

| Variable | Category | Required | Notes |
|---|---|---|---|
| `ANTHROPIC_API_KEY` | Claude Agent SDK | Yes | AI model access |
| `DATABASE_URL` | PostgreSQL | Yes | `postgresql://user:pass@host:5432/snf_platform` |
| `DATABASE_SSL` | PostgreSQL | Production | `true` in production |
| `PCC_CLIENT_ID` | PointClickCare | Yes | OAuth2 client |
| `PCC_CLIENT_SECRET` | PointClickCare | Yes | OAuth2 secret |
| `PCC_BASE_URL` | PointClickCare | Yes | `https://api.pointclickcare.com/v1` |
| `PCC_TOKEN_URL` | PointClickCare | Yes | `https://api.pointclickcare.com/oauth/token` |
| `WORKDAY_CLIENT_ID` | Workday | Yes | OAuth2 client |
| `WORKDAY_CLIENT_SECRET` | Workday | Yes | OAuth2 secret |
| `WORKDAY_TENANT_ID` | Workday | Yes | Ensign tenant |
| `WORKDAY_BASE_URL` | Workday | Yes | `https://TENANT.workday.com/api/v1` |
| `M365_CLIENT_ID` | Microsoft 365 | Yes | Azure AD app registration |
| `M365_CLIENT_SECRET` | Microsoft 365 | Yes | Azure AD secret |
| `M365_TENANT_ID` | Microsoft 365 | Yes | Ensign Azure tenant |
| `CMS_API_KEY` | CMS / Regulatory | Yes | Public API key |
| `OIG_API_KEY` | CMS / Regulatory | Yes | Public API key |
| `API_PORT` | API Server | No | Default: `3001` |
| `API_HOST` | API Server | No | Default: `0.0.0.0` |
| `WS_PORT` | WebSocket | No | Default: `3002` |
| `LOG_LEVEL` | Logging | No | Default: `info` |
| `NODE_ENV` | Logging | No | `production` for deploy |

**Security**: Never commit `.env`. Credentials in env vars only. See `docs/SECURITY_ARCHITECTURE.md` -- Credential Storage.

### Database Migration

| # | Step | Command | Notes |
|---|---|---|---|
| 1 | Backup database | `pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql` | Always before migration |
| 2 | Run migrations | `npm run db:migrate` | Runs `packages/hitl/dist/migrations/run.js` |
| 3 | Verify schema | Connect to DB, check tables exist | `decision_queue`, `audit_trail` (partitioned), `agent_registry`, `agent_runs`, `agent_steps` |
| 4 | Seed data (optional) | `npm run db:seed` | Development/staging only |

**Migration files**: `platform/packages/hitl/src/migrations/001_decision_queue.sql`, `002_audit_trail.sql`, `003_agent_registry.sql`

### Backend Startup Sequence

Defined in `platform/src/main.ts`. 18 steps executed sequentially:

| Step | Component | Action | Depends On | Fatal on Failure |
|---|---|---|---|---|
| 1 | Database Pool | `new Pool()` with max 20 connections, verify with `SELECT NOW()` | `DATABASE_URL` env var | Yes |
| 2 | Database Migrations | Execute `packages/hitl/dist/migrations/run.js` via `execFileSync` | Step 1 | Yes |
| 3 | Audit Engine + Chain Verifier | `new AuditEngine(pool)`, `new ChainVerifier(pool)` | Step 1 | No |
| 4 | Event Bus | `new EventBus({ maxLogSize: 50_000 })` | None | No |
| 5 | Governance Engine | `new GovernanceEngine()` | None | No |
| 6 | Decision Service | `new DecisionService({ pool, onStateChange })` | Step 1 | No |
| 7 | Audit Logger | `createAgentLogger({ engine: auditEngine })` | Step 3 | No |
| 8 | Decision Queue Adapter | Bridge `DecisionService.submit` to `DecisionQueue` interface | Step 6 | No |
| 9 | Agent Dependencies | Bundle `auditLogger`, `decisionQueue`, `eventBus`, `governanceEngine`, `anthropicApiKey` | Steps 4-8 | No |
| 10 | Agent Registry | Register all 30 agents (26 domain + 4 orchestration/meta), set all to probation | Step 9 | No |
| 11 | Task Registry | `TaskRegistry.loadFromDirectory(task-definitions/)` -- load YAML task definitions | None | No (warns on errors) |
| 12 | Run Manager | `new RunManager({ maxCompletedHistory: 50_000 })` | None | No |
| 13 | Task Executor | Bridge function: task scheduler -> agent execution via `agentRegistry.get()` | Steps 10-12 | No |
| 14 | Task Scheduler | `new TaskScheduler()` with 30s tick interval, 2 default retries; `.start()` | Steps 11-13 | No |
| 15 | Event Processor | `new EventProcessor()` listening for event-triggered tasks; `.start()` | Steps 4, 11-12 | No |
| 16 | Metrics Collector + Health Monitor | `MetricsCollector` (24h retention), `AgentHealthMonitor` (30s check interval); `.startMonitoring()` | Step 10 | No |
| 17 | Chain Verifier | `startPeriodicVerification(60 min, 24h lookback)`; listens for `chain:break`, `chain:verified`, `chain:error` | Step 3 | No |
| 18 | Fastify API Server | `buildServer()`, `server.listen({ port, host })` | All above | Yes |

**Post-startup**: Registers SIGINT/SIGTERM handlers for graceful shutdown (reverse order: close server -> stop scheduler -> stop event processor -> stop health monitor -> stop chain verifier -> stop all agents -> close DB pool).

### 30 Registered Agents

| Domain | Count | Agents |
|---|---|---|
| Clinical | 7 | ClinicalMonitor, Pharmacy, InfectionControl, Therapy, Dietary, MedicalRecords, SocialServices |
| Financial | 6 | Billing, AR, AP, Payroll, Treasury, Budget |
| Workforce | 5 | Recruiting, Scheduling, Credentialing, Training, Retention |
| Operations | 4 | SupplyChain, Maintenance, Census, LifeSafety |
| Governance | 4 | Quality, Risk, Compliance, Legal |
| Orchestration + Meta | 4 | ExceptionRouter, ExecutiveBriefing, Audit, Platform |

**All agents boot in probation mode** -- every action requires human approval until manually cleared.

### Post-Deploy Verification

| # | Check | Endpoint / Command | Expected |
|---|---|---|---|
| 1 | Health endpoint | `GET /api/health` | 200 OK, returns version + timestamp |
| 2 | Agent count | `GET /api/agents` | 30 agents listed |
| 3 | Agent status | `GET /api/agents` | All in `probation` status initially |
| 4 | Decision API | `GET /api/decisions` | 200 OK, paginated response |
| 5 | Audit trail | `GET /api/audit` | 200 OK, entries from startup |
| 6 | Chain verification | Check logs for `[audit] Chain verification passed` | Entries verified, 0 breaks |
| 7 | WebSocket | Connect to `ws://host:3002/api/ws` | Heartbeat ping/pong < 1s |
| 8 | Task scheduler | Check logs for `[scheduler] TaskScheduler started` | N cron jobs scheduled |
| 9 | Event processor | Check logs for `[events] EventProcessor started` | Listening for event-triggered tasks |
| 10 | DB connectivity | Check logs for `[db] Connected to PostgreSQL` | Server time returned |

**Latency budgets**: See `docs/PERFORMANCE_BUDGETS.md` -- API Latency Budgets table.

### Rollback

| # | Action | Command | Notes |
|---|---|---|---|
| 1 | Rollback ECS task | `aws ecs update-service --cluster snf --service snf-api --task-definition snf-api:<previous-revision>` | Reverts to previous container image |
| 2 | Rollback DB migration | `npm run db:migrate -- --down` | Only if migration was the cause |
| 3 | Restore DB from backup | `psql $DATABASE_URL < backup_YYYYMMDD_HHMMSS.sql` | Nuclear option -- restores full state |
| 4 | Verify rollback | `GET /api/health` | Confirm previous version running |

---

## Tier 3: Native Apps -- TestFlight / Enterprise

### Pre-Deploy Checklist

| # | Step | Command | Expected | Gate |
|---|---|---|---|---|
| 1 | Build SNFKit | `cd SNFKit && swift build` | 0 errors | Blocking |
| 2 | Test SNFKit | `cd SNFKit && swift test` | All pass (SNFKitTests target) | Blocking |
| 3 | Build iOS app | `cd SNF_iOS && swift build` | 0 errors | Blocking |
| 4 | Build macOS app | `cd SNF_macOS && swift build` | 0 errors | Blocking |
| 5 | Verify platforms | Check Package.swift | iOS 26+, macOS 26+ | Blocking |

### Package Dependencies

```
SNFKit/
  |- SNFModels (no deps)
  |- SNFData (depends: SNFModels, resources: MockData)
  |- SNFServices (depends: SNFModels, SNFData)

SNF_iOS/  (depends: SNFKit -> SNFModels, SNFData, SNFServices)
SNF_macOS/ (depends: SNFKit -> SNFModels, SNFData, SNFServices)
```

### Build & Deploy -- iOS

| # | Step | Command | Notes |
|---|---|---|---|
| 1 | Archive | `xcodebuild archive -scheme SNF_iOS -destination 'generic/platform=iOS' -archivePath build/SNF_iOS.xcarchive` | Requires signing identity |
| 2 | Export IPA | `xcodebuild -exportArchive -archivePath build/SNF_iOS.xcarchive -exportPath build/ -exportOptionsPlist ExportOptions.plist` | Requires provisioning profile |
| 3 | Upload to TestFlight | `xcrun altool --upload-app -f build/SNF_iOS.ipa -t ios --apiKey <key> --apiIssuer <issuer>` | Or use Transporter app |
| 4 | Verify | TestFlight app on test device | Confirm build appears, install, smoke test |

### Build & Deploy -- macOS

| # | Step | Command | Notes |
|---|---|---|---|
| 1 | Archive | `xcodebuild archive -scheme SNF_macOS -destination 'generic/platform=macOS' -archivePath build/SNF_macOS.xcarchive` | Requires signing identity |
| 2 | Export app | `xcodebuild -exportArchive -archivePath build/SNF_macOS.xcarchive -exportPath build/ -exportOptionsPlist ExportOptions.plist` | Developer ID or enterprise |
| 3 | Notarize | `xcrun notarytool submit build/SNF_macOS.app --apple-id <id> --team-id <team> --password <app-password>` | Required for distribution outside App Store |
| 4 | Verify | Install on test Mac | Launch, verify SNFKit data layer, API connectivity |

### Rollback

| # | Action | Notes |
|---|---|---|
| 1 | TestFlight: expire build | Mark build as expired in App Store Connect |
| 2 | TestFlight: push previous | Re-upload previous archive, set as active |
| 3 | Enterprise: revoke distribution | Remove from MDM or enterprise distribution server |

---

## Hotfix Process

| # | Step | Command | Notes |
|---|---|---|---|
| 1 | Branch from main | `git checkout -b hotfix/<description> main` | Short-lived branch |
| 2 | Fix + commit | `git add <files> && git commit -m "fix: <description>"` | Minimal, targeted change |
| 3 | Pre-deploy checks | Run applicable tier checklist above | All gates must pass |
| 4 | PR with `hotfix` label | `gh pr create --title "fix: <description>" --label hotfix` | Expedited review (1 reviewer) |
| 5 | Merge to main | Squash merge | Triggers Tier 1 auto-deploy |
| 6 | Deploy Tier 2/3 if needed | Follow applicable tier steps | Manual for backend and native |
| 7 | Verify fix | Load production URL / hit health endpoint | Confirm issue resolved |

---

## Environment Checklist

| Environment | URL | Config Source | Branch | Notes |
|---|---|---|---|---|
| Development | `http://localhost:5173/Snf-framework/` | Local `.env` | Feature branch | `npm run dev` (Vite dev server) |
| Preview | `http://localhost:4173/Snf-framework/` | Local `.env` | Feature branch | `npm run preview` (built output) |
| Production (Frontend) | `https://goforit5.github.io/Snf-framework/` | GitHub Pages environment | `main` | Auto-deploy on merge |
| Production (Backend) | `https://<ecs-host>:3100` | AWS ECS task env vars | `main` | Planned -- pending Ensign credentials |
| Production (WebSocket) | `wss://<ecs-host>:3002/api/ws` | AWS ECS task env vars | `main` | Planned -- pending Ensign credentials |

---

## Post-Release Monitoring

| Metric | Source | Alert Threshold | Reference |
|---|---|---|---|
| LCP | Lighthouse CI | > 2.5s | `docs/PERFORMANCE_BUDGETS.md` -- Core Web Vitals |
| FID | Web Vitals | > 100ms | `docs/PERFORMANCE_BUDGETS.md` -- Core Web Vitals |
| CLS | Web Vitals | > 0.1 | `docs/PERFORMANCE_BUDGETS.md` -- Core Web Vitals |
| INP | Web Vitals | > 200ms | `docs/PERFORMANCE_BUDGETS.md` -- Core Web Vitals |
| Bundle size (main) | Vite build output | > 500 kB | `docs/PERFORMANCE_BUDGETS.md` -- Bundle Size Budgets |
| API health | `GET /api/health` | > 50ms P95 | `docs/PERFORMANCE_BUDGETS.md` -- API Latency Budgets |
| Decision API latency | `GET /api/decisions` | > 200ms P95 | `docs/PERFORMANCE_BUDGETS.md` -- API Latency Budgets |
| Agent error rate | AgentHealthMonitor | > 5% (degraded), > 15% (unhealthy) | `docs/PERFORMANCE_BUDGETS.md` -- Agent Execution Budgets |
| Agent response time | AgentHealthMonitor | > 15s (degraded), > 30s (unhealthy) | `docs/PERFORMANCE_BUDGETS.md` -- Agent Execution Budgets |
| Agent heartbeat | AgentHealthMonitor | > 3600s (dead) | `docs/PERFORMANCE_BUDGETS.md` -- Agent Execution Budgets |
| Chain verification | ChainVerifier | Any `chain:break` event | `docs/SECURITY_ARCHITECTURE.md` -- Audit Trail Security |
| DB connection pool | pg Pool | Exhaustion (20 max) | `docs/PERFORMANCE_BUDGETS.md` -- Database Performance |
| CI pipeline duration | GitHub Actions | > 5 min | `docs/PERFORMANCE_BUDGETS.md` -- CI/CD Performance |

---

## Security Checks (Pre-Release Gate)

| Check | Method | Reference |
|---|---|---|
| No credentials in source | `grep -r "placeholder_" platform/.env.sample` only | `docs/SECURITY_ARCHITECTURE.md` -- Credential Storage |
| `.env` in `.gitignore` | `grep ".env" .gitignore` | `docs/SECURITY_ARCHITECTURE.md` -- Credential Storage |
| JWT auth enabled (production) | JWT authentication implemented (SNF-139); dev fallback removed from `auth.ts` lines 73-80 for production | `docs/SECURITY_ARCHITECTURE.md` -- Authentication |
| WebSocket auth enabled | Token query param validation on WS upgrade (SNF-140) | `docs/SECURITY_ARCHITECTURE.md` -- Authentication |
| CORS origins correct | Check `platform/packages/api/src/server.ts` | Only `goforit5.github.io`, `localhost:5173`, `localhost:4173` |
| RLS policies active | Verify `facility_isolation` on `decision_queue`, `audit_facility_isolation` on `audit_trail` | `docs/SECURITY_ARCHITECTURE.md` -- Database Security |
| Audit immutability trigger | Verify `prevent_audit_modification()` trigger exists | `docs/SECURITY_ARCHITECTURE.md` -- Audit Trail Security |
| All agents in probation | Check startup logs: "all in probation mode" | `docs/SECURITY_ARCHITECTURE.md` -- Agent Security |

---

## Cross-References

| Document | Path | Relevance |
|---|---|---|
| Performance Budgets | `docs/PERFORMANCE_BUDGETS.md` | Bundle sizes, API latency, agent thresholds, CI timing |
| Security Architecture | `docs/SECURITY_ARCHITECTURE.md` | Auth, RBAC, threat model, credential storage, HIPAA mapping |
| Privacy Manifest | `docs/PRIVACY_MANIFEST.md` | PHI field inventory, data flow |
| Feature Flag Registry | `docs/FEATURE_FLAG_REGISTRY.md` | Governance levels, agent status flags, kill switch |
| API Contract | `docs/API_CONTRACT.md` | Endpoints, CORS, authentication details |
| CI/CD Pipeline | `.github/workflows/deploy.yml` | Build + deploy steps, Node version, concurrency |
| Backend Entry Point | `platform/src/main.ts` | 18-step startup sequence, agent registration, shutdown |
| Vite Config | `vite.config.js` | manualChunks, base path, build options |
| Platform Package | `platform/package.json` | Backend scripts (build, lint, typecheck, test, migrate, seed) |
| Frontend Package | `package.json` | Frontend scripts (dev, build, lint, preview) |
| SNFKit Package | `SNFKit/Package.swift` | Shared Swift package: SNFModels, SNFData, SNFServices |
| iOS Package | `SNF_iOS/Package.swift` | iOS app target, SNFKit dependency |
| macOS Package | `SNF_macOS/Package.swift` | macOS app target, SNFKit dependency |
