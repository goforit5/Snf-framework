/**
 * Minimal MCP (Model Context Protocol) server over streamable HTTP.
 *
 * Implements the JSON-RPC 2.0 wire protocol for MCP:
 *  - initialize
 *  - tools/list
 *  - tools/call
 *  - notifications/* (accepted, silently discarded)
 *
 * Supports Server-Sent Events (SSE) for server→client streaming per the
 * Streamable HTTP transport spec. Tool handlers can optionally push
 * progress notifications; otherwise a single `tools/call` response is sent.
 *
 * This is a hand-rolled implementation because `@modelcontextprotocol/sdk`
 * is not in the workspace. Kept deliberately minimal — enough to satisfy
 * Claude Managed Agents' MCP client and pass local smoke tests.
 */

// ---------------------------------------------------------------------------
// Wire types
// ---------------------------------------------------------------------------

export interface JsonRpcRequest {
  jsonrpc: '2.0';
  id?: string | number | null;
  method: string;
  params?: Record<string, unknown>;
}

export interface JsonRpcResponse {
  jsonrpc: '2.0';
  id: string | number | null;
  result?: unknown;
  error?: JsonRpcError;
}

export interface JsonRpcError {
  code: number;
  message: string;
  data?: unknown;
}

export const MCP_ERROR = {
  PARSE_ERROR: -32700,
  INVALID_REQUEST: -32600,
  METHOD_NOT_FOUND: -32601,
  INVALID_PARAMS: -32602,
  INTERNAL_ERROR: -32603,
} as const;

// ---------------------------------------------------------------------------
// Tool specification
// ---------------------------------------------------------------------------

export interface ToolContent {
  type: 'text';
  text: string;
}

export interface ToolCallResult {
  content: ToolContent[];
  isError?: boolean;
}

export interface ToolSpec {
  name: string;
  description: string;
  /** JSON Schema describing tool input. */
  inputSchema: Record<string, unknown>;
  handler: (input: Record<string, unknown>, ctx: ToolCallContext) => Promise<ToolCallResult>;
}

export interface ToolCallContext {
  /** MCP session id if the client supplied one. */
  sessionId?: string;
  /** Raw JSON-RPC request id for correlation. */
  requestId: string | number | null;
  /** Optional request headers — useful for extracting tool_use_id. */
  headers: Record<string, string | string[] | undefined>;
}

// ---------------------------------------------------------------------------
// Server
// ---------------------------------------------------------------------------

export interface McpServerInfo {
  name: string;
  version: string;
}

export class McpServer {
  private readonly tools = new Map<string, ToolSpec>();

  constructor(private readonly info: McpServerInfo) {}

  registerTool(spec: ToolSpec): void {
    if (this.tools.has(spec.name)) {
      throw new Error(`Duplicate tool registration: ${spec.name}`);
    }
    this.tools.set(spec.name, spec);
  }

  getToolNames(): string[] {
    return Array.from(this.tools.keys());
  }

  getInfo(): McpServerInfo {
    return this.info;
  }

  /**
   * Handle a single JSON-RPC request. Returns `null` for notifications.
   */
  async handle(
    req: JsonRpcRequest,
    headers: Record<string, string | string[] | undefined>,
  ): Promise<JsonRpcResponse | null> {
    if (req.jsonrpc !== '2.0') {
      return this.errorResponse(req.id ?? null, MCP_ERROR.INVALID_REQUEST, 'jsonrpc must be "2.0"');
    }

    // Notifications (no id) — accept and ignore.
    if (req.id === undefined || req.id === null) {
      return null;
    }

    try {
      switch (req.method) {
        case 'initialize':
          return this.handleInitialize(req);
        case 'tools/list':
          return this.handleToolsList(req);
        case 'tools/call':
          return await this.handleToolsCall(req, headers);
        default:
          if (req.method.startsWith('notifications/')) {
            return null;
          }
          return this.errorResponse(req.id, MCP_ERROR.METHOD_NOT_FOUND, `Unknown method: ${req.method}`);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Internal error';
      return this.errorResponse(req.id, MCP_ERROR.INTERNAL_ERROR, message);
    }
  }

  private handleInitialize(req: JsonRpcRequest): JsonRpcResponse {
    return {
      jsonrpc: '2.0',
      id: req.id ?? null,
      result: {
        protocolVersion: '2024-11-05',
        capabilities: { tools: {} },
        serverInfo: this.info,
      },
    };
  }

  private handleToolsList(req: JsonRpcRequest): JsonRpcResponse {
    const tools = Array.from(this.tools.values()).map((t) => ({
      name: t.name,
      description: t.description,
      inputSchema: t.inputSchema,
    }));
    return {
      jsonrpc: '2.0',
      id: req.id ?? null,
      result: { tools },
    };
  }

  private async handleToolsCall(
    req: JsonRpcRequest,
    headers: Record<string, string | string[] | undefined>,
  ): Promise<JsonRpcResponse> {
    const params = (req.params ?? {}) as { name?: string; arguments?: Record<string, unknown> };
    if (!params.name) {
      return this.errorResponse(req.id ?? null, MCP_ERROR.INVALID_PARAMS, 'Missing tool name');
    }
    const spec = this.tools.get(params.name);
    if (!spec) {
      return this.errorResponse(req.id ?? null, MCP_ERROR.METHOD_NOT_FOUND, `Unknown tool: ${params.name}`);
    }

    const ctx: ToolCallContext = {
      sessionId: firstHeader(headers['mcp-session-id']),
      requestId: req.id ?? null,
      headers,
    };

    const result = await spec.handler(params.arguments ?? {}, ctx);
    return {
      jsonrpc: '2.0',
      id: req.id ?? null,
      result,
    };
  }

  private errorResponse(
    id: string | number | null,
    code: number,
    message: string,
    data?: unknown,
  ): JsonRpcResponse {
    return { jsonrpc: '2.0', id, error: { code, message, data } };
  }
}

function firstHeader(h: string | string[] | undefined): string | undefined {
  if (h === undefined) return undefined;
  if (Array.isArray(h)) return h[0];
  return h;
}
