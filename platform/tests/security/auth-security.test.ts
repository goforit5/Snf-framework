/**
 * Security Penetration Tests — SNF-160
 *
 * Validates JWT bypass prevention, RBAC enforcement, WebSocket auth,
 * and credential exposure prevention across the SNF API surface.
 *
 * All tests use vitest with mocked Fastify server injection.
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import jwt from 'jsonwebtoken';
import type { FastifyInstance } from 'fastify';
import { buildServer } from '../../packages/api/src/server.js';
import {
  InMemoryDecisionService,
  InMemoryAuditEngine,
} from './../../tests/e2e/setup.js';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TEST_SECRET = 'test-jwt-secret-for-security-tests-only';
const WRONG_SECRET = 'this-is-the-wrong-secret-entirely';
const DECISION_ID = '00000000-0000-0000-0000-000000000001';

// ---------------------------------------------------------------------------
// JWT helpers
// ---------------------------------------------------------------------------

function signToken(
  payload: Record<string, unknown>,
  secret = TEST_SECRET,
  options: jwt.SignOptions = {},
): string {
  return jwt.sign(payload, secret, { algorithm: 'HS256', expiresIn: '1h', ...options });
}

function validCeoClaims(): Record<string, unknown> {
  return {
    sub: 'user-ceo-001',
    userName: 'Test CEO',
    role: 'ceo',
    facilityIds: [],
    regionIds: [],
  };
}

function validReadOnlyClaims(): Record<string, unknown> {
  return {
    sub: 'user-readonly-001',
    userName: 'Read Only User',
    role: 'read_only',
    facilityIds: [],
    regionIds: [],
  };
}

function validAuditorClaims(): Record<string, unknown> {
  return {
    sub: 'user-auditor-001',
    userName: 'Auditor User',
    role: 'auditor',
    facilityIds: [],
    regionIds: [],
  };
}

function facilityScopedClaims(facilityIds: string[]): Record<string, unknown> {
  return {
    sub: 'user-admin-fac',
    userName: 'Facility Admin',
    role: 'administrator',
    facilityIds,
    regionIds: [],
  };
}

// ---------------------------------------------------------------------------
// Server setup
// ---------------------------------------------------------------------------

let server: FastifyInstance;
let decisionService: InMemoryDecisionService;

beforeAll(async () => {
  process.env.JWT_SECRET = TEST_SECRET;

  decisionService = new InMemoryDecisionService();
  decisionService.seed();

  const auditEngine = new InMemoryAuditEngine();

  server = await buildServer({
    logger: false,
    decisionService,
    auditEngine,
  });
});

afterAll(async () => {
  await server.close();
  delete process.env.JWT_SECRET;
});

beforeEach(() => {
  decisionService.reset();
});

// ===========================================================================
// Test Group 1: JWT Bypass Attempts
// ===========================================================================

describe('JWT bypass attempts', () => {
  it('rejects request with no Authorization header', async () => {
    const res = await server.inject({
      method: 'GET',
      url: '/api/decisions',
    });
    expect(res.statusCode).toBe(401);
    expect(JSON.parse(res.payload).error).toMatch(/Missing Authorization/i);
  });

  it('rejects request with empty Bearer token', async () => {
    const res = await server.inject({
      method: 'GET',
      url: '/api/decisions',
      headers: { authorization: 'Bearer ' },
    });
    expect(res.statusCode).toBe(401);
  });

  it('rejects malformed JWT (not a JWT)', async () => {
    const res = await server.inject({
      method: 'GET',
      url: '/api/decisions',
      headers: { authorization: 'Bearer this-is-not-a-jwt' },
    });
    expect(res.statusCode).toBe(401);
  });

  it('rejects JWT signed with wrong secret', async () => {
    const token = signToken(validCeoClaims(), WRONG_SECRET);
    const res = await server.inject({
      method: 'GET',
      url: '/api/decisions',
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(401);
  });

  it('rejects expired JWT with "Token expired" message', async () => {
    const token = signToken(validCeoClaims(), TEST_SECRET, { expiresIn: '-1s' });
    const res = await server.inject({
      method: 'GET',
      url: '/api/decisions',
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(401);
    expect(JSON.parse(res.payload).error).toMatch(/Token expired/i);
  });

  it('rejects JWT with "none" algorithm', async () => {
    // Manually craft a "none" algorithm token
    const header = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');
    const payload = Buffer.from(JSON.stringify(validCeoClaims())).toString('base64url');
    const noneToken = `${header}.${payload}.`;

    const res = await server.inject({
      method: 'GET',
      url: '/api/decisions',
      headers: { authorization: `Bearer ${noneToken}` },
    });
    expect(res.statusCode).toBe(401);
  });

  it('rejects JWT with missing sub/userId claim', async () => {
    const claims = { ...validCeoClaims() };
    delete claims.sub;
    delete claims.userId;
    const token = signToken(claims);

    const res = await server.inject({
      method: 'GET',
      url: '/api/decisions',
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(401);
  });

  it('rejects JWT with missing role claim', async () => {
    const claims = { ...validCeoClaims() };
    delete claims.role;
    const token = signToken(claims);

    const res = await server.inject({
      method: 'GET',
      url: '/api/decisions',
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(401);
  });

  it('rejects JWT with invalid role value', async () => {
    const claims = { ...validCeoClaims(), role: 'superadmin' };
    const token = signToken(claims);

    const res = await server.inject({
      method: 'GET',
      url: '/api/decisions',
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(401);
  });
});

// ===========================================================================
// Test Group 2: RBAC Enforcement
// ===========================================================================

describe('RBAC enforcement', () => {
  it('read_only user cannot approve decisions (POST /api/decisions/:id/approve)', async () => {
    const token = signToken(validReadOnlyClaims());
    const res = await server.inject({
      method: 'POST',
      url: `/api/decisions/${DECISION_ID}/approve`,
      headers: { authorization: `Bearer ${token}` },
      payload: { note: 'Attempting unauthorized approval' },
    });
    expect(res.statusCode).toBe(403);
    expect(JSON.parse(res.payload).error).toMatch(/Insufficient role/i);
  });

  it('auditor user cannot trigger sessions (POST /api/sessions/trigger)', async () => {
    const token = signToken(validAuditorClaims());
    const res = await server.inject({
      method: 'POST',
      url: '/api/sessions/trigger',
      headers: { authorization: `Bearer ${token}` },
      payload: { eventType: 'api.manual' },
    });
    expect(res.statusCode).toBe(403);
    expect(JSON.parse(res.payload).error).toMatch(/Insufficient role/i);
  });

  it('only AGENT_ADMIN_ROLES can pause agents — non-admin gets 403', async () => {
    // administrator is NOT in AGENT_ADMIN_ROLES (ceo, cfo, it_admin, regional_director)
    const token = signToken({
      sub: 'user-don-001',
      userName: 'DON User',
      role: 'don',
      facilityIds: [],
      regionIds: [],
    });
    const res = await server.inject({
      method: 'POST',
      url: '/api/agents/agent-001/pause',
      headers: { authorization: `Bearer ${token}` },
      payload: { reason: 'Attempting unauthorized pause' },
    });
    expect(res.statusCode).toBe(403);
    expect(JSON.parse(res.payload).error).toMatch(/Insufficient role/i);
  });

  it('facility-scoped user cannot access other facility data', async () => {
    const token = signToken(facilityScopedClaims(['FAC-AZ-001']));

    // Request decisions for a different facility
    const res = await server.inject({
      method: 'GET',
      url: '/api/decisions?facilityId=FAC-CA-999',
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(403);
    expect(JSON.parse(res.payload).error).toMatch(/Access denied/i);
  });
});

// ===========================================================================
// Test Group 3: WebSocket Authentication
// ===========================================================================

describe('WebSocket authentication', () => {
  // Note: Fastify's inject() does not support WebSocket upgrade, so we test
  // the auth logic by verifying the route behavior via the handler's token
  // validation path. The actual WS close codes (4001) are verified by
  // ensuring the verifyToken function rejects correctly.

  it('rejects WebSocket connection with no token param', async () => {
    // The WS route skips authMiddleware (handled in handler), so we test
    // indirectly: the handler checks for ?token= and closes if missing.
    // Since inject() cannot fully test WS, we verify verifyToken throws
    // when called with empty string.
    const { verifyToken } = await import('../../packages/api/src/middleware/auth.js');
    await expect(verifyToken('')).rejects.toThrow();
  });

  it('rejects WebSocket connection with invalid token', async () => {
    const { verifyToken } = await import('../../packages/api/src/middleware/auth.js');
    await expect(verifyToken('invalid-token-string')).rejects.toThrow();
  });

  it('rejects WebSocket connection with expired token', async () => {
    const { verifyToken } = await import('../../packages/api/src/middleware/auth.js');
    const expired = signToken(validCeoClaims(), TEST_SECRET, { expiresIn: '-1s' });
    await expect(verifyToken(expired)).rejects.toThrow(/Token expired/i);
  });

  it('accepts valid token and returns UserContext', async () => {
    const { verifyToken } = await import('../../packages/api/src/middleware/auth.js');
    const token = signToken(validCeoClaims());
    const user = await verifyToken(token);
    expect(user.userId).toBe('user-ceo-001');
    expect(user.role).toBe('ceo');
    expect(user.userName).toBe('Test CEO');
  });
});

// ===========================================================================
// Test Group 4: Credential Exposure Prevention
// ===========================================================================

describe('credential exposure prevention', () => {
  it('error responses do not contain JWT_SECRET', async () => {
    // Trigger various error paths and check that the secret is never leaked
    const badToken = signToken(validCeoClaims(), WRONG_SECRET);

    const res = await server.inject({
      method: 'GET',
      url: '/api/decisions',
      headers: { authorization: `Bearer ${badToken}` },
    });

    const body = res.payload;
    expect(body).not.toContain(TEST_SECRET);
    expect(body).not.toContain(WRONG_SECRET);
    expect(body).not.toContain('JWT_SECRET');
  });

  it('error responses do not contain credential values', async () => {
    // Request with a token that has an invalid role — error message should not
    // leak any internal values
    const claims = { ...validCeoClaims(), role: 'superadmin' };
    const token = signToken(claims);

    const res = await server.inject({
      method: 'GET',
      url: '/api/decisions',
      headers: { authorization: `Bearer ${token}` },
    });

    const body = res.payload;
    // Should not contain the raw token
    expect(body).not.toContain(token);
    // Should not contain internal env vars
    expect(body).not.toContain(TEST_SECRET);
  });

  it('health endpoint does not expose internal details beyond status/timestamp/version', async () => {
    const res = await server.inject({
      method: 'GET',
      url: '/api/health',
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.payload);

    // Only these three fields should be present
    expect(Object.keys(body).sort()).toEqual(['status', 'timestamp', 'version'].sort());
    expect(body.status).toBe('ok');
    expect(body.version).toMatch(/^\d+\.\d+\.\d+$/);

    // Must not leak internals
    expect(body).not.toHaveProperty('env');
    expect(body).not.toHaveProperty('database');
    expect(body).not.toHaveProperty('secret');
    expect(body).not.toHaveProperty('config');
  });
});
