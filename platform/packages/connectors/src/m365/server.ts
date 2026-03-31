/**
 * M365 MCP Server — Model Context Protocol compliant server for Microsoft 365 / Graph API.
 *
 * This server exposes Microsoft 365 tools to Claude agents. It handles:
 * - Azure AD OAuth2 token lifecycle (via m365 oauth module)
 * - Rate limiting per Microsoft Graph API contract
 * - Error handling with Graph-specific error codes
 * - MCP protocol messages (initialize, tools/list, tools/call)
 *
 * Agents never hold credentials. This server is the only component that
 * authenticates with Microsoft Graph. All requests are logged for audit trail.
 */

import { getAccessToken, getGraphBaseUrl, invalidateToken } from './oauth.js';
import { m365Tools } from './tools.js';
import type { MCPToolDefinition } from './tools.js';

// ---------------------------------------------------------------------------
// MCP Protocol Types
// ---------------------------------------------------------------------------

export interface MCPServerConfig {
  name: string;
  version: string;
  graphBaseUrl: string;
  /** Requests per second limit (Graph default: 10 req/s per app) */
  rateLimitRps: number;
  /** Requests per minute limit (Graph default: 600 req/min) */
  rateLimitRpm: number;
  /** Request timeout in milliseconds */
  requestTimeoutMs: number;
}

export interface MCPRequest {
  jsonrpc: '2.0';
  id: string | number;
  method: string;
  params?: Record<string, unknown>;
}

export interface MCPResponse {
  jsonrpc: '2.0';
  id: string | number;
  result?: unknown;
  error?: MCPError;
}

export interface MCPError {
  code: number;
  message: string;
  data?: unknown;
}

// MCP standard error codes
const MCP_ERRORS = {
  PARSE_ERROR: -32700,
  INVALID_REQUEST: -32600,
  METHOD_NOT_FOUND: -32601,
  INVALID_PARAMS: -32602,
  INTERNAL_ERROR: -32603,
  // M365-specific error codes (application range: -32000 to -32099)
  M365_AUTH_FAILED: -32000,
  M365_RATE_LIMITED: -32001,
  M365_NOT_FOUND: -32002,
  M365_ACCESS_DENIED: -32003,
  M365_VALIDATION_ERROR: -32004,
  M365_SERVICE_UNAVAILABLE: -32005,
  M365_THROTTLED: -32006,
} as const;

// ---------------------------------------------------------------------------
// Rate Limiter
// ---------------------------------------------------------------------------

class RateLimiter {
  private readonly maxPerSecond: number;
  private readonly maxPerMinute: number;
  private secondWindow: number[] = [];
  private minuteWindow: number[] = [];

  constructor(maxPerSecond: number, maxPerMinute: number) {
    this.maxPerSecond = maxPerSecond;
    this.maxPerMinute = maxPerMinute;
  }

  check(): number {
    const now = Date.now();
    this.secondWindow = this.secondWindow.filter((t) => now - t < 1000);
    this.minuteWindow = this.minuteWindow.filter((t) => now - t < 60000);

    if (this.secondWindow.length >= this.maxPerSecond) {
      const oldestInSecond = this.secondWindow[0]!;
      return 1000 - (now - oldestInSecond) + 1;
    }

    if (this.minuteWindow.length >= this.maxPerMinute) {
      const oldestInMinute = this.minuteWindow[0]!;
      return 60000 - (now - oldestInMinute) + 1;
    }

    return 0;
  }

  record(): void {
    const now = Date.now();
    this.secondWindow.push(now);
    this.minuteWindow.push(now);
  }
}

// ---------------------------------------------------------------------------
// Graph HTTP Client
// ---------------------------------------------------------------------------

export interface GraphApiClient {
  get<T>(path: string, params?: Record<string, string>): Promise<T>;
  post<T>(path: string, body: unknown): Promise<T>;
}

class GraphHttpClient implements GraphApiClient {
  private readonly baseUrl: string;
  private readonly rateLimiter: RateLimiter;
  private readonly timeoutMs: number;

  constructor(baseUrl: string, rateLimiter: RateLimiter, timeoutMs: number) {
    this.baseUrl = baseUrl;
    this.rateLimiter = rateLimiter;
    this.timeoutMs = timeoutMs;
  }

  async get<T>(path: string, params?: Record<string, string>): Promise<T> {
    return this.request<T>('GET', path, params);
  }

  async post<T>(path: string, body: unknown): Promise<T> {
    return this.request<T>('POST', path, undefined, body);
  }

  private async request<T>(
    method: string,
    path: string,
    params?: Record<string, string>,
    body?: unknown,
  ): Promise<T> {
    const waitMs = this.rateLimiter.check();
    if (waitMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, waitMs));
    }
    this.rateLimiter.record();

    const url = new URL(`${this.baseUrl}${path}`);
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        url.searchParams.set(key, value);
      }
    }

    const token = await getAccessToken();

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(url.toString(), {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
          ConsistencyLevel: 'eventual',
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      if (!response.ok) {
        if (response.status === 401) {
          invalidateToken();
        }
        throw new M365RequestError(
          `Microsoft Graph API error: ${response.status} ${response.statusText}`,
          this.httpStatusToErrorCode(response.status),
          response.status,
        );
      }

      return (await response.json()) as T;
    } finally {
      clearTimeout(timeout);
    }
  }

  private httpStatusToErrorCode(status: number): M365ErrorCode {
    switch (status) {
      case 401: return 'AUTH_FAILED';
      case 403: return 'ACCESS_DENIED';
      case 404: return 'NOT_FOUND';
      case 422: return 'VALIDATION_ERROR';
      case 429: return 'THROTTLED';
      case 503: return 'SERVICE_UNAVAILABLE';
      default: return 'INTERNAL_ERROR';
    }
  }
}

// ---------------------------------------------------------------------------
// Error Types
// ---------------------------------------------------------------------------

export type M365ErrorCode =
  | 'AUTH_FAILED'
  | 'THROTTLED'
  | 'NOT_FOUND'
  | 'ACCESS_DENIED'
  | 'VALIDATION_ERROR'
  | 'SERVICE_UNAVAILABLE'
  | 'INTERNAL_ERROR';

export class M365RequestError extends Error {
  readonly code: M365ErrorCode;
  readonly httpStatus: number;

  constructor(message: string, code: M365ErrorCode, httpStatus: number) {
    super(message);
    this.name = 'M365RequestError';
    this.code = code;
    this.httpStatus = httpStatus;
  }
}

// ---------------------------------------------------------------------------
// M365 MCP Server
// ---------------------------------------------------------------------------

const DEFAULT_CONFIG: MCPServerConfig = {
  name: 'm365-mcp-server',
  version: '0.1.0',
  graphBaseUrl: getGraphBaseUrl(),
  rateLimitRps: 10,
  rateLimitRpm: 600,
  requestTimeoutMs: 30000,
};

export class M365MCPServer {
  private readonly config: MCPServerConfig;
  private readonly httpClient: GraphHttpClient;
  private readonly tools: MCPToolDefinition[];
  private readonly isPlaceholderMode: boolean;

  constructor(config?: Partial<MCPServerConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    const rateLimiter = new RateLimiter(this.config.rateLimitRps, this.config.rateLimitRpm);
    this.httpClient = new GraphHttpClient(
      this.config.graphBaseUrl,
      rateLimiter,
      this.config.requestTimeoutMs,
    );
    this.tools = m365Tools;
    this.isPlaceholderMode = this.config.graphBaseUrl.includes('placeholder');
  }

  async handleRequest(request: MCPRequest): Promise<MCPResponse> {
    try {
      switch (request.method) {
        case 'initialize':
          return this.handleInitialize(request);
        case 'tools/list':
          return this.handleToolsList(request);
        case 'tools/call':
          return this.handleToolsCall(request);
        default:
          return this.errorResponse(request.id, MCP_ERRORS.METHOD_NOT_FOUND, `Unknown method: ${request.method}`);
      }
    } catch (error) {
      return this.handleError(request.id, error);
    }
  }

  // -------------------------------------------------------------------------
  // MCP Method Handlers
  // -------------------------------------------------------------------------

  private handleInitialize(request: MCPRequest): MCPResponse {
    return {
      jsonrpc: '2.0',
      id: request.id,
      result: {
        protocolVersion: '2024-11-05',
        capabilities: {
          tools: {},
        },
        serverInfo: {
          name: this.config.name,
          version: this.config.version,
        },
      },
    };
  }

  private handleToolsList(request: MCPRequest): MCPResponse {
    const toolDefinitions = this.tools.map((tool) => ({
      name: tool.name,
      description: tool.description,
      inputSchema: tool.inputSchema,
    }));

    return {
      jsonrpc: '2.0',
      id: request.id,
      result: { tools: toolDefinitions },
    };
  }

  private async handleToolsCall(request: MCPRequest): Promise<MCPResponse> {
    const params = request.params as { name?: string; arguments?: Record<string, unknown> } | undefined;

    if (!params?.name) {
      return this.errorResponse(request.id, MCP_ERRORS.INVALID_PARAMS, 'Missing tool name');
    }

    const tool = this.tools.find((t) => t.name === params.name);
    if (!tool) {
      return this.errorResponse(request.id, MCP_ERRORS.METHOD_NOT_FOUND, `Unknown tool: ${params.name}`);
    }

    const toolArgs = params.arguments ?? {};

    try {
      const result = await tool.handler(toolArgs);
      return {
        jsonrpc: '2.0',
        id: request.id,
        result: {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        },
      };
    } catch (error) {
      return this.handleError(request.id, error);
    }
  }

  // -------------------------------------------------------------------------
  // Error Handling
  // -------------------------------------------------------------------------

  private handleError(requestId: string | number, error: unknown): MCPResponse {
    if (error instanceof M365RequestError) {
      return this.errorResponse(
        requestId,
        this.m365ErrorToMCPCode(error.code),
        error.message,
        { m365ErrorCode: error.code, httpStatus: error.httpStatus },
      );
    }

    const message = error instanceof Error ? error.message : 'Internal server error';
    return this.errorResponse(requestId, MCP_ERRORS.INTERNAL_ERROR, message);
  }

  private m365ErrorToMCPCode(code: M365ErrorCode): number {
    switch (code) {
      case 'AUTH_FAILED':
        return MCP_ERRORS.M365_AUTH_FAILED;
      case 'THROTTLED':
        return MCP_ERRORS.M365_THROTTLED;
      case 'NOT_FOUND':
        return MCP_ERRORS.M365_NOT_FOUND;
      case 'ACCESS_DENIED':
        return MCP_ERRORS.M365_ACCESS_DENIED;
      case 'VALIDATION_ERROR':
        return MCP_ERRORS.M365_VALIDATION_ERROR;
      case 'SERVICE_UNAVAILABLE':
        return MCP_ERRORS.M365_SERVICE_UNAVAILABLE;
      default:
        return MCP_ERRORS.INTERNAL_ERROR;
    }
  }

  private errorResponse(id: string | number, code: number, message: string, data?: unknown): MCPResponse {
    return {
      jsonrpc: '2.0',
      id,
      error: { code, message, data },
    };
  }

  // -------------------------------------------------------------------------
  // Server Info
  // -------------------------------------------------------------------------

  getServerInfo(): { name: string; version: string; toolCount: number; isPlaceholder: boolean } {
    return {
      name: this.config.name,
      version: this.config.version,
      toolCount: this.tools.length,
      isPlaceholder: this.isPlaceholderMode,
    };
  }

  getToolNames(): string[] {
    return this.tools.map((t) => t.name);
  }
}

/**
 * Create an M365 MCP Server with default configuration.
 * Reads credentials from environment variables.
 */
export function createM365Server(config?: Partial<MCPServerConfig>): M365MCPServer {
  return new M365MCPServer(config);
}
