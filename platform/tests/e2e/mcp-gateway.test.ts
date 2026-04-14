/**
 * E2E Test: MCP Gateway
 *
 * Tests the MCP JSON-RPC server directly (unit-level, no HTTP transport).
 * Validates initialize handshake, tool listing, and tool dispatch.
 */

import { describe, it, expect } from 'vitest';
import { McpServer } from '../../packages/connectors/src/gateway/mcp-server.js';
import type {
  JsonRpcRequest,
  JsonRpcResponse,
  ToolSpec,
} from '../../packages/connectors/src/gateway/mcp-server.js';

// ---------------------------------------------------------------------------
// Test MCP server with synthetic tools
// ---------------------------------------------------------------------------

function buildTestMcpServer(): McpServer {
  const server = new McpServer({ name: 'snf-test-gateway', version: '1.0.0' });

  const syntheticTools: ToolSpec[] = [
    {
      name: 'pcc__get_resident',
      description: 'Get resident details from PCC',
      inputSchema: { type: 'object', properties: { residentId: { type: 'string' } } },
      handler: async (input) => ({
        content: [{ type: 'text', text: JSON.stringify({ id: input.residentId, name: 'Margaret Chen', room: '214B' }) }],
      }),
    },
    {
      name: 'pcc__get_medications',
      description: 'Get resident medications from PCC',
      inputSchema: { type: 'object', properties: { residentId: { type: 'string' } } },
      handler: async () => ({
        content: [{ type: 'text', text: JSON.stringify([{ name: 'Donepezil', dose: '10mg' }]) }],
      }),
    },
    {
      name: 'workday__get_employee',
      description: 'Get employee details from Workday',
      inputSchema: { type: 'object', properties: { employeeId: { type: 'string' } } },
      handler: async (input) => ({
        content: [{ type: 'text', text: JSON.stringify({ id: input.employeeId, name: 'Maria Santos', role: 'RN' }) }],
      }),
    },
    {
      name: 'workday__get_schedule',
      description: 'Get staffing schedule from Workday',
      inputSchema: { type: 'object', properties: { facilityId: { type: 'string' } } },
      handler: async () => ({
        content: [{ type: 'text', text: JSON.stringify({ shifts: 3, uncovered: 1 }) }],
      }),
    },
    {
      name: 'm365__search_email',
      description: 'Search emails via Microsoft 365',
      inputSchema: { type: 'object', properties: { query: { type: 'string' } } },
      handler: async () => ({
        content: [{ type: 'text', text: JSON.stringify({ results: [] }) }],
      }),
    },
    {
      name: 'regulatory__check_exclusion',
      description: 'Check OIG/SAM exclusion list',
      inputSchema: { type: 'object', properties: { name: { type: 'string' } } },
      handler: async () => ({
        content: [{ type: 'text', text: JSON.stringify({ excluded: false }) }],
      }),
    },
  ];

  for (const tool of syntheticTools) {
    server.registerTool(tool);
  }

  return server;
}

const EMPTY_HEADERS: Record<string, string | string[] | undefined> = {};

describe('MCP Gateway', () => {
  // ── Initialize Handshake ─────────────────────────────────────────────

  describe('initialize', () => {
    it('returns protocol version and server info', async () => {
      const mcp = buildTestMcpServer();

      const req: JsonRpcRequest = {
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
        params: { protocolVersion: '2024-11-05', capabilities: {} },
      };

      const res = await mcp.handle(req, EMPTY_HEADERS);
      expect(res).toBeTruthy();
      const result = res!.result as { protocolVersion: string; serverInfo: { name: string } };
      expect(result.protocolVersion).toBe('2024-11-05');
      expect(result.serverInfo.name).toBe('snf-test-gateway');
    });
  });

  // ── tools/list ───────────────────────────────────────────────────────

  describe('tools/list', () => {
    it('returns all registered tools', async () => {
      const mcp = buildTestMcpServer();

      const res = await mcp.handle(
        { jsonrpc: '2.0', id: 2, method: 'tools/list' },
        EMPTY_HEADERS,
      );

      expect(res).toBeTruthy();
      const result = res!.result as { tools: { name: string; description: string }[] };
      expect(result.tools.length).toBe(6);

      const names = result.tools.map((t) => t.name);
      expect(names).toContain('pcc__get_resident');
      expect(names).toContain('workday__get_employee');
      expect(names).toContain('m365__search_email');
      expect(names).toContain('regulatory__check_exclusion');
    });

    it('each tool has name, description, and inputSchema', async () => {
      const mcp = buildTestMcpServer();

      const res = await mcp.handle(
        { jsonrpc: '2.0', id: 3, method: 'tools/list' },
        EMPTY_HEADERS,
      );

      const result = res!.result as { tools: { name: string; description: string; inputSchema: object }[] };
      for (const tool of result.tools) {
        expect(tool.name).toBeTruthy();
        expect(tool.description).toBeTruthy();
        expect(tool.inputSchema).toBeTruthy();
      }
    });
  });

  // ── tools/call — PCC ─────────────────────────────────────────────────

  describe('PCC tools', () => {
    it('pcc__get_resident returns valid synthetic data', async () => {
      const mcp = buildTestMcpServer();

      const res = await mcp.handle(
        {
          jsonrpc: '2.0',
          id: 10,
          method: 'tools/call',
          params: { name: 'pcc__get_resident', arguments: { residentId: 'res-0001' } },
        },
        EMPTY_HEADERS,
      );

      expect(res).toBeTruthy();
      expect(res!.error).toBeUndefined();
      const result = res!.result as { content: { type: string; text: string }[] };
      const data = JSON.parse(result.content[0].text);
      expect(data.id).toBe('res-0001');
      expect(data.name).toBeTruthy();
    });

    it('pcc__get_medications returns medication list', async () => {
      const mcp = buildTestMcpServer();

      const res = await mcp.handle(
        {
          jsonrpc: '2.0',
          id: 11,
          method: 'tools/call',
          params: { name: 'pcc__get_medications', arguments: { residentId: 'res-0001' } },
        },
        EMPTY_HEADERS,
      );

      expect(res!.error).toBeUndefined();
      const result = res!.result as { content: { type: string; text: string }[] };
      const meds = JSON.parse(result.content[0].text);
      expect(Array.isArray(meds)).toBe(true);
      expect(meds.length).toBeGreaterThan(0);
    });
  });

  // ── tools/call — Workday ─────────────────────────────────────────────

  describe('Workday tools', () => {
    it('workday__get_employee returns valid synthetic data', async () => {
      const mcp = buildTestMcpServer();

      const res = await mcp.handle(
        {
          jsonrpc: '2.0',
          id: 20,
          method: 'tools/call',
          params: { name: 'workday__get_employee', arguments: { employeeId: 'emp-001' } },
        },
        EMPTY_HEADERS,
      );

      expect(res!.error).toBeUndefined();
      const result = res!.result as { content: { type: string; text: string }[] };
      const data = JSON.parse(result.content[0].text);
      expect(data.id).toBe('emp-001');
    });

    it('workday__get_schedule returns schedule data', async () => {
      const mcp = buildTestMcpServer();

      const res = await mcp.handle(
        {
          jsonrpc: '2.0',
          id: 21,
          method: 'tools/call',
          params: { name: 'workday__get_schedule', arguments: { facilityId: 'fac-005' } },
        },
        EMPTY_HEADERS,
      );

      expect(res!.error).toBeUndefined();
      const result = res!.result as { content: { type: string; text: string }[] };
      const data = JSON.parse(result.content[0].text);
      expect(data.shifts).toBeDefined();
    });
  });

  // ── tools/call — M365 ────────────────────────────────────────────────

  describe('M365 tools', () => {
    it('m365__search_email returns valid response', async () => {
      const mcp = buildTestMcpServer();

      const res = await mcp.handle(
        {
          jsonrpc: '2.0',
          id: 30,
          method: 'tools/call',
          params: { name: 'm365__search_email', arguments: { query: 'test' } },
        },
        EMPTY_HEADERS,
      );

      expect(res!.error).toBeUndefined();
    });
  });

  // ── tools/call — Regulatory ──────────────────────────────────────────

  describe('Regulatory tools', () => {
    it('regulatory__check_exclusion returns valid response', async () => {
      const mcp = buildTestMcpServer();

      const res = await mcp.handle(
        {
          jsonrpc: '2.0',
          id: 40,
          method: 'tools/call',
          params: { name: 'regulatory__check_exclusion', arguments: { name: 'John Doe' } },
        },
        EMPTY_HEADERS,
      );

      expect(res!.error).toBeUndefined();
      const result = res!.result as { content: { type: string; text: string }[] };
      const data = JSON.parse(result.content[0].text);
      expect(data.excluded).toBe(false);
    });
  });

  // ── Error handling ───────────────────────────────────────────────────

  describe('Error handling', () => {
    it('returns error for invalid tool name', async () => {
      const mcp = buildTestMcpServer();

      const res = await mcp.handle(
        {
          jsonrpc: '2.0',
          id: 50,
          method: 'tools/call',
          params: { name: 'nonexistent_tool', arguments: {} },
        },
        EMPTY_HEADERS,
      );

      expect(res).toBeTruthy();
      expect(res!.error).toBeTruthy();
      expect(res!.error!.code).toBe(-32601); // METHOD_NOT_FOUND
      expect(res!.error!.message).toContain('Unknown tool');
    });

    it('returns error for unknown method', async () => {
      const mcp = buildTestMcpServer();

      const res = await mcp.handle(
        { jsonrpc: '2.0', id: 51, method: 'unknown/method' },
        EMPTY_HEADERS,
      );

      expect(res!.error).toBeTruthy();
      expect(res!.error!.code).toBe(-32601);
    });

    it('returns null for notifications (no id)', async () => {
      const mcp = buildTestMcpServer();

      const res = await mcp.handle(
        { jsonrpc: '2.0', method: 'notifications/initialized' } as JsonRpcRequest,
        EMPTY_HEADERS,
      );

      expect(res).toBeNull();
    });

    it('returns error for missing tool name in tools/call', async () => {
      const mcp = buildTestMcpServer();

      const res = await mcp.handle(
        { jsonrpc: '2.0', id: 52, method: 'tools/call', params: {} },
        EMPTY_HEADERS,
      );

      expect(res!.error).toBeTruthy();
      expect(res!.error!.code).toBe(-32602); // INVALID_PARAMS
    });
  });
});
