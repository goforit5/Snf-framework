/**
 * Staging Environment Validation Script
 *
 * Validates that a staging deployment is healthy before promoting to production.
 * Checks database connectivity, agent registrations, connector health,
 * API endpoints, and WebSocket connectivity.
 *
 * Usage:
 *   DATABASE_URL=postgres://... API_URL=http://... npx tsx scripts/validate-staging.ts
 *
 * Output: validation report with pass/fail per check, printed to stdout as JSON.
 * Exit code: 0 if all checks pass, 1 if any check fails.
 */

import { Client } from 'pg';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CheckResult {
  name: string;
  status: 'pass' | 'fail' | 'warn' | 'skip';
  message: string;
  durationMs: number;
  details?: Record<string, unknown>;
}

interface ValidationReport {
  timestamp: string;
  environment: string;
  overall: 'pass' | 'fail';
  checks: CheckResult[];
  summary: {
    total: number;
    passed: number;
    failed: number;
    warned: number;
    skipped: number;
  };
}

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const config = {
  databaseUrl: process.env.DATABASE_URL ?? '',
  apiUrl: process.env.API_URL ?? 'http://localhost:3000',
  redisUrl: process.env.REDIS_URL ?? 'redis://localhost:6379',
  environment: process.env.NODE_ENV ?? 'staging',
};

// ---------------------------------------------------------------------------
// Check implementations
// ---------------------------------------------------------------------------

async function checkDatabaseConnectivity(): Promise<CheckResult> {
  const start = Date.now();
  const name = 'Database Connectivity';

  if (!config.databaseUrl) {
    return { name, status: 'skip', message: 'DATABASE_URL not set', durationMs: 0 };
  }

  const client = new Client({ connectionString: config.databaseUrl });

  try {
    await client.connect();
    const result = await client.query('SELECT NOW() AS server_time, version() AS pg_version');
    const row = result.rows[0];

    return {
      name,
      status: 'pass',
      message: `Connected to PostgreSQL`,
      durationMs: Date.now() - start,
      details: {
        serverTime: row.server_time,
        pgVersion: row.pg_version,
      },
    };
  } catch (err) {
    return {
      name,
      status: 'fail',
      message: `Database connection failed: ${err instanceof Error ? err.message : String(err)}`,
      durationMs: Date.now() - start,
    };
  } finally {
    await client.end().catch(() => {});
  }
}

async function checkMigrationStatus(): Promise<CheckResult> {
  const start = Date.now();
  const name = 'Migration Status';

  if (!config.databaseUrl) {
    return { name, status: 'skip', message: 'DATABASE_URL not set', durationMs: 0 };
  }

  const client = new Client({ connectionString: config.databaseUrl });

  try {
    await client.connect();

    // Check _migrations table exists
    const tableCheck = await client.query(
      `SELECT EXISTS (
        SELECT FROM information_schema.tables WHERE table_name = '_migrations'
      ) AS exists`,
    );

    if (!tableCheck.rows[0].exists) {
      return {
        name,
        status: 'fail',
        message: 'Migrations table does not exist — migrations have not been run',
        durationMs: Date.now() - start,
      };
    }

    // Count applied migrations
    const migrationCount = await client.query(
      'SELECT COUNT(*) AS count, MAX(applied_at) AS latest FROM _migrations',
    );
    const count = Number(migrationCount.rows[0].count);
    const latest = migrationCount.rows[0].latest;

    // Check critical tables exist
    const criticalTables = ['audit_trail', 'decision_queue'];
    const missingTables: string[] = [];

    for (const table of criticalTables) {
      const check = await client.query(
        `SELECT EXISTS (
          SELECT FROM information_schema.tables WHERE table_name = $1
        ) AS exists`,
        [table],
      );
      if (!check.rows[0].exists) {
        missingTables.push(table);
      }
    }

    if (missingTables.length > 0) {
      return {
        name,
        status: 'fail',
        message: `Missing critical tables: ${missingTables.join(', ')}`,
        durationMs: Date.now() - start,
        details: { appliedMigrations: count, missingTables },
      };
    }

    return {
      name,
      status: 'pass',
      message: `${count} migrations applied, latest at ${latest}`,
      durationMs: Date.now() - start,
      details: { appliedMigrations: count, latestMigration: latest },
    };
  } catch (err) {
    return {
      name,
      status: 'fail',
      message: `Migration check failed: ${err instanceof Error ? err.message : String(err)}`,
      durationMs: Date.now() - start,
    };
  } finally {
    await client.end().catch(() => {});
  }
}

async function checkApiHealth(): Promise<CheckResult> {
  const start = Date.now();
  const name = 'API Health Endpoint';

  try {
    const response = await fetch(`${config.apiUrl}/api/health`, {
      signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) {
      return {
        name,
        status: 'fail',
        message: `API health returned ${response.status} ${response.statusText}`,
        durationMs: Date.now() - start,
      };
    }

    const body = await response.json() as Record<string, unknown>;

    return {
      name,
      status: 'pass',
      message: `API healthy — version ${body.version ?? 'unknown'}`,
      durationMs: Date.now() - start,
      details: body,
    };
  } catch (err) {
    return {
      name,
      status: 'fail',
      message: `API health check failed: ${err instanceof Error ? err.message : String(err)}`,
      durationMs: Date.now() - start,
    };
  }
}

async function checkApiDecisionsEndpoint(): Promise<CheckResult> {
  const start = Date.now();
  const name = 'API Decisions Endpoint';

  try {
    const response = await fetch(`${config.apiUrl}/api/decisions`, {
      signal: AbortSignal.timeout(10_000),
    });

    // Accept 200 (data returned) or 401 (auth required, but endpoint exists)
    if (response.status === 200 || response.status === 401) {
      return {
        name,
        status: 'pass',
        message: `Decisions endpoint responding (${response.status})`,
        durationMs: Date.now() - start,
      };
    }

    return {
      name,
      status: 'fail',
      message: `Decisions endpoint returned ${response.status}`,
      durationMs: Date.now() - start,
    };
  } catch (err) {
    return {
      name,
      status: 'fail',
      message: `Decisions endpoint failed: ${err instanceof Error ? err.message : String(err)}`,
      durationMs: Date.now() - start,
    };
  }
}

async function checkApiAgentsEndpoint(): Promise<CheckResult> {
  const start = Date.now();
  const name = 'API Agents Endpoint';

  try {
    const response = await fetch(`${config.apiUrl}/api/agents`, {
      signal: AbortSignal.timeout(10_000),
    });

    if (response.status === 200 || response.status === 401) {
      return {
        name,
        status: 'pass',
        message: `Agents endpoint responding (${response.status})`,
        durationMs: Date.now() - start,
      };
    }

    return {
      name,
      status: 'fail',
      message: `Agents endpoint returned ${response.status}`,
      durationMs: Date.now() - start,
    };
  } catch (err) {
    return {
      name,
      status: 'fail',
      message: `Agents endpoint failed: ${err instanceof Error ? err.message : String(err)}`,
      durationMs: Date.now() - start,
    };
  }
}

async function checkApiAuditEndpoint(): Promise<CheckResult> {
  const start = Date.now();
  const name = 'API Audit Endpoint';

  try {
    const response = await fetch(`${config.apiUrl}/api/audit`, {
      signal: AbortSignal.timeout(10_000),
    });

    if (response.status === 200 || response.status === 401) {
      return {
        name,
        status: 'pass',
        message: `Audit endpoint responding (${response.status})`,
        durationMs: Date.now() - start,
      };
    }

    return {
      name,
      status: 'fail',
      message: `Audit endpoint returned ${response.status}`,
      durationMs: Date.now() - start,
    };
  } catch (err) {
    return {
      name,
      status: 'fail',
      message: `Audit endpoint failed: ${err instanceof Error ? err.message : String(err)}`,
      durationMs: Date.now() - start,
    };
  }
}

async function checkWebSocketConnectivity(): Promise<CheckResult> {
  const start = Date.now();
  const name = 'WebSocket Connectivity';

  // WebSocket check via HTTP upgrade probe
  try {
    const wsUrl = config.apiUrl.replace(/^http/, 'ws') + '/api/ws';
    const response = await fetch(config.apiUrl + '/api/ws', {
      headers: {
        'Connection': 'Upgrade',
        'Upgrade': 'websocket',
        'Sec-WebSocket-Version': '13',
        'Sec-WebSocket-Key': 'dGhlIHNhbXBsZSBub25jZQ==',
      },
      signal: AbortSignal.timeout(10_000),
    });

    // 101 = Switching Protocols (WebSocket upgrade success)
    // 400/426 = server recognized the upgrade attempt but rejected it (still shows WS support)
    if (response.status === 101 || response.status === 400 || response.status === 426) {
      return {
        name,
        status: 'pass',
        message: `WebSocket endpoint reachable (${response.status})`,
        durationMs: Date.now() - start,
      };
    }

    return {
      name,
      status: 'warn',
      message: `WebSocket probe returned unexpected ${response.status} — may still work with proper WS client`,
      durationMs: Date.now() - start,
    };
  } catch (err) {
    return {
      name,
      status: 'warn',
      message: `WebSocket probe failed: ${err instanceof Error ? err.message : String(err)}. May require proper WS client for testing.`,
      durationMs: Date.now() - start,
    };
  }
}

async function checkConnectorPlaceholders(): Promise<CheckResult> {
  const start = Date.now();
  const name = 'Connector Configuration';

  // In staging, connectors are in placeholder mode. We validate that the
  // configuration structure is present, not that real credentials work.
  const connectors = ['pcc', 'workday', 'm365', 'cms', 'anthropic'];
  const envChecks: Record<string, boolean> = {};

  for (const connector of connectors) {
    const envKey = `${connector.toUpperCase()}_CLIENT_ID`;
    envChecks[connector] = !!process.env[envKey];
  }

  const configured = Object.values(envChecks).filter(Boolean).length;
  const status = configured === 0 ? 'warn' : configured === connectors.length ? 'pass' : 'warn';

  return {
    name,
    status,
    message: `${configured}/${connectors.length} connectors have credentials configured`,
    durationMs: Date.now() - start,
    details: envChecks,
  };
}

async function checkAuditTrailIntegrity(): Promise<CheckResult> {
  const start = Date.now();
  const name = 'Audit Trail Integrity';

  if (!config.databaseUrl) {
    return { name, status: 'skip', message: 'DATABASE_URL not set', durationMs: 0 };
  }

  const client = new Client({ connectionString: config.databaseUrl });

  try {
    await client.connect();

    // Check if audit_trail has any entries
    const countResult = await client.query(
      'SELECT COUNT(*) AS count FROM audit_trail',
    );
    const count = Number(countResult.rows[0].count);

    if (count === 0) {
      return {
        name,
        status: 'pass',
        message: 'Audit trail empty (fresh deployment)',
        durationMs: Date.now() - start,
        details: { entryCount: 0 },
      };
    }

    // Check that genesis entry (first entry) has the correct previous_hash
    const genesisResult = await client.query(
      `SELECT previous_hash FROM audit_trail ORDER BY timestamp ASC, id ASC LIMIT 1`,
    );
    const genesisHash = genesisResult.rows[0]?.previous_hash?.trim();
    const expectedGenesis = '0'.repeat(64);

    if (genesisHash !== expectedGenesis) {
      return {
        name,
        status: 'fail',
        message: `Genesis entry has unexpected previous_hash: ${genesisHash?.substring(0, 16)}...`,
        durationMs: Date.now() - start,
        details: { entryCount: count, genesisHash },
      };
    }

    return {
      name,
      status: 'pass',
      message: `${count} audit entries, genesis hash valid`,
      durationMs: Date.now() - start,
      details: { entryCount: count },
    };
  } catch (err) {
    return {
      name,
      status: 'fail',
      message: `Audit trail check failed: ${err instanceof Error ? err.message : String(err)}`,
      durationMs: Date.now() - start,
    };
  } finally {
    await client.end().catch(() => {});
  }
}

// ---------------------------------------------------------------------------
// Main validation runner
// ---------------------------------------------------------------------------

async function validate(): Promise<ValidationReport> {
  console.log('SNF Agentic Platform — Staging Validation');
  console.log('='.repeat(60));
  console.log(`Environment: ${config.environment}`);
  console.log(`API URL:     ${config.apiUrl}`);
  console.log(`Database:    ${config.databaseUrl ? '(configured)' : '(not set)'}`);
  console.log('='.repeat(60));
  console.log('');

  const checks: CheckResult[] = [];

  // Run all checks
  const checkFns = [
    checkDatabaseConnectivity,
    checkMigrationStatus,
    checkAuditTrailIntegrity,
    checkApiHealth,
    checkApiDecisionsEndpoint,
    checkApiAgentsEndpoint,
    checkApiAuditEndpoint,
    checkWebSocketConnectivity,
    checkConnectorPlaceholders,
  ];

  for (const checkFn of checkFns) {
    const result = await checkFn();
    checks.push(result);

    const icon =
      result.status === 'pass' ? 'PASS' :
      result.status === 'fail' ? 'FAIL' :
      result.status === 'warn' ? 'WARN' :
      'SKIP';

    console.log(`  [${icon}] ${result.name} (${result.durationMs}ms)`);
    console.log(`         ${result.message}`);
  }

  const summary = {
    total: checks.length,
    passed: checks.filter((c) => c.status === 'pass').length,
    failed: checks.filter((c) => c.status === 'fail').length,
    warned: checks.filter((c) => c.status === 'warn').length,
    skipped: checks.filter((c) => c.status === 'skip').length,
  };

  const overall = summary.failed > 0 ? 'fail' as const : 'pass' as const;

  console.log('');
  console.log('='.repeat(60));
  console.log(`Result: ${overall.toUpperCase()}`);
  console.log(`  Passed: ${summary.passed}/${summary.total}`);
  console.log(`  Failed: ${summary.failed}/${summary.total}`);
  console.log(`  Warned: ${summary.warned}/${summary.total}`);
  console.log(`  Skipped: ${summary.skipped}/${summary.total}`);
  console.log('='.repeat(60));

  return {
    timestamp: new Date().toISOString(),
    environment: config.environment,
    overall,
    checks,
    summary,
  };
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

validate().then((report) => {
  // Output full report as JSON for CI/CD integration
  console.log('\n--- JSON Report ---');
  console.log(JSON.stringify(report, null, 2));

  process.exit(report.overall === 'pass' ? 0 : 1);
}).catch((err) => {
  console.error('Validation script failed:', err);
  process.exit(1);
});
