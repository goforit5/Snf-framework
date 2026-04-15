/**
 * E2E Test Helpers
 *
 * HTTP client wrappers and assertion utilities for E2E tests.
 */

import type { FastifyInstance } from 'fastify';
import jwt from 'jsonwebtoken';
import type { JsonRpcRequest, JsonRpcResponse } from '../../packages/connectors/src/gateway/mcp-server.js';

// ---------------------------------------------------------------------------
// JWT test token helper
// ---------------------------------------------------------------------------

export const TEST_JWT_SECRET = 'test-secret-for-e2e-tests';

export function makeTestToken(overrides: Record<string, unknown> = {}): string {
  return jwt.sign(
    {
      sub: 'test-user-001',
      userId: 'test-user-001',
      userName: 'Test Admin',
      role: 'ceo',
      facilityIds: [],
      regionIds: [],
      ...overrides,
    },
    TEST_JWT_SECRET,
    { expiresIn: '1h' },
  );
}

// ---------------------------------------------------------------------------
// HTTP client helpers
// ---------------------------------------------------------------------------

export interface ApiResponse<T = unknown> {
  status: number;
  body: T;
  headers: Record<string, string>;
}

export async function apiGet<T = unknown>(
  server: FastifyInstance,
  path: string,
): Promise<ApiResponse<T>> {
  const res = await server.inject({
    method: 'GET',
    url: path,
    headers: { authorization: `Bearer ${makeTestToken()}` },
  });
  return {
    status: res.statusCode,
    body: JSON.parse(res.payload) as T,
    headers: res.headers as Record<string, string>,
  };
}

export async function apiPost<T = unknown>(
  server: FastifyInstance,
  path: string,
  payload: Record<string, unknown>,
): Promise<ApiResponse<T>> {
  const res = await server.inject({
    method: 'POST',
    url: path,
    payload,
    headers: { authorization: `Bearer ${makeTestToken()}` },
  });
  return {
    status: res.statusCode,
    body: JSON.parse(res.payload) as T,
    headers: res.headers as Record<string, string>,
  };
}

// ---------------------------------------------------------------------------
// MCP JSON-RPC client helper
// ---------------------------------------------------------------------------

export function mcpRequest(
  method: string,
  params?: Record<string, unknown>,
  id: string | number = 1,
): JsonRpcRequest {
  return {
    jsonrpc: '2.0',
    id,
    method,
    params,
  };
}

// ---------------------------------------------------------------------------
// Paginated response shape
// ---------------------------------------------------------------------------

export interface PaginatedBody<T = unknown> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
}

// ---------------------------------------------------------------------------
// Assertion helpers
// ---------------------------------------------------------------------------

export function assertPaginated(body: PaginatedBody): void {
  if (!body.pagination) throw new Error('Response missing pagination');
  if (typeof body.pagination.page !== 'number') throw new Error('pagination.page is not a number');
  if (typeof body.pagination.pageSize !== 'number') throw new Error('pagination.pageSize is not a number');
  if (!Array.isArray(body.data)) throw new Error('data is not an array');
}

export function assertHasFields(obj: Record<string, unknown>, fields: string[]): string[] {
  const missing: string[] = [];
  for (const f of fields) {
    if (obj[f] === undefined) missing.push(f);
  }
  return missing;
}

export function assertMinLength(value: string, minLen: number, fieldName: string): void {
  if (value.length < minLen) {
    throw new Error(`${fieldName} too short: ${value.length} < ${minLen} chars`);
  }
}
