/**
 * PCC MCP Server — Model Context Protocol compliant server for PointClickCare.
 *
 * This server exposes PCC clinical data tools to Claude agents. It handles:
 * - OAuth2 token lifecycle (via PCCOAuthClient)
 * - Rate limiting per PCC API contract
 * - Error handling with PCC-specific error codes
 * - MCP protocol messages (initialize, tools/list, tools/call)
 *
 * Agents never hold credentials. This server is the only component that
 * authenticates with PCC. All requests are logged for audit trail.
 */

import { PCCOAuthClient, PCCAuthError } from './oauth.js';
import { PCC_TOOLS, getToolByName } from './tools.js';
import type { MCPToolDefinition, PCCApiClient, ToolContext } from './tools.js';
import type { PCCApiResponse, PCCApiError, PCCErrorCode } from './types.js';

// ---------------------------------------------------------------------------
// MCP Protocol Types
// ---------------------------------------------------------------------------

export interface MCPServerConfig {
  name: string;
  version: string;
  pccBaseUrl: string;
  /** Requests per second limit (PCC default: 10 req/s) */
  rateLimitRps: number;
  /** Requests per minute limit (PCC default: 300 req/min) */
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
  // PCC-specific error codes (application range: -32000 to -32099)
  PCC_AUTH_FAILED: -32000,
  PCC_RATE_LIMITED: -32001,
  PCC_NOT_FOUND: -32002,
  PCC_ACCESS_DENIED: -32003,
  PCC_VALIDATION_ERROR: -32004,
  PCC_SERVICE_UNAVAILABLE: -32005,
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

  /**
   * Check if a request is allowed. Returns wait time in ms (0 = allowed).
   */
  check(): number {
    const now = Date.now();

    // Prune expired entries
    this.secondWindow = this.secondWindow.filter((t) => now - t < 1000);
    this.minuteWindow = this.minuteWindow.filter((t) => now - t < 60000);

    // Check per-second limit
    if (this.secondWindow.length >= this.maxPerSecond) {
      const oldestInSecond = this.secondWindow[0]!;
      return 1000 - (now - oldestInSecond) + 1;
    }

    // Check per-minute limit
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
// PCC HTTP Client
// ---------------------------------------------------------------------------

class PCCHttpClient implements PCCApiClient {
  private readonly baseUrl: string;
  private readonly oauth: PCCOAuthClient;
  private readonly rateLimiter: RateLimiter;
  private readonly timeoutMs: number;

  constructor(
    baseUrl: string,
    oauth: PCCOAuthClient,
    rateLimiter: RateLimiter,
    timeoutMs: number,
  ) {
    this.baseUrl = baseUrl;
    this.oauth = oauth;
    this.rateLimiter = rateLimiter;
    this.timeoutMs = timeoutMs;
  }

  async get<T>(path: string, params?: Record<string, string>): Promise<PCCApiResponse<T>> {
    return this.request<T>('GET', path, params);
  }

  async post<T>(path: string, body: unknown): Promise<PCCApiResponse<T>> {
    return this.request<T>('POST', path, undefined, body);
  }

  private async request<T>(
    method: string,
    path: string,
    params?: Record<string, string>,
    body?: unknown,
  ): Promise<PCCApiResponse<T>> {
    // Rate limiting
    const waitMs = this.rateLimiter.check();
    if (waitMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, waitMs));
    }
    this.rateLimiter.record();

    // Build URL
    const url = new URL(`${this.baseUrl}${path}`);
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        url.searchParams.set(key, value);
      }
    }

    // Get token
    const token = await this.oauth.getAccessToken();

    // Make request
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(url.toString(), {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'X-PCC-API-Version': '2024-01',
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      if (!response.ok) {
        await this.handleErrorResponse(response);
      }

      return (await response.json()) as PCCApiResponse<T>;
    } finally {
      clearTimeout(timeout);
    }
  }

  private async handleErrorResponse(response: Response): Promise<never> {
    let pccError: PCCApiError | null = null;
    try {
      pccError = (await response.json()) as PCCApiError;
    } catch {
      // Response body not JSON
    }

    const errorCode = pccError?.code ?? this.httpStatusToErrorCode(response.status);

    // On 401, invalidate token so next request gets a fresh one
    if (response.status === 401) {
      await this.oauth.invalidateToken();
    }

    throw new PCCRequestError(
      pccError?.message ?? `PCC API error: ${response.status} ${response.statusText}`,
      errorCode,
      response.status,
      pccError?.requestId ?? null,
    );
  }

  private httpStatusToErrorCode(status: number): PCCErrorCode {
    switch (status) {
      case 401: return 'INVALID_TOKEN';
      case 403: return 'FACILITY_ACCESS_DENIED';
      case 404: return 'RESOURCE_NOT_FOUND';
      case 422: return 'VALIDATION_ERROR';
      case 429: return 'RATE_LIMIT_EXCEEDED';
      case 503: return 'SERVICE_UNAVAILABLE';
      default: return 'INTERNAL_ERROR';
    }
  }
}

// ---------------------------------------------------------------------------
// PCC Request Error
// ---------------------------------------------------------------------------

export class PCCRequestError extends Error {
  readonly code: PCCErrorCode;
  readonly httpStatus: number;
  readonly requestId: string | null;

  constructor(message: string, code: PCCErrorCode, httpStatus: number, requestId: string | null) {
    super(message);
    this.name = 'PCCRequestError';
    this.code = code;
    this.httpStatus = httpStatus;
    this.requestId = requestId;
  }
}

// ---------------------------------------------------------------------------
// PCC MCP Server
// ---------------------------------------------------------------------------

const DEFAULT_CONFIG: MCPServerConfig = {
  name: 'pcc-mcp-server',
  version: '0.1.0',
  pccBaseUrl: process.env.PCC_BASE_URL ?? 'https://api.pointclickcare.com/v1',
  rateLimitRps: 10,
  rateLimitRpm: 300,
  requestTimeoutMs: 30000,
};

export class PCCMCPServer {
  private readonly config: MCPServerConfig;
  private readonly oauth: PCCOAuthClient;
  private readonly httpClient: PCCHttpClient;
  private readonly tools: MCPToolDefinition[];

  constructor(config?: Partial<MCPServerConfig>, oauth?: PCCOAuthClient) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.oauth = oauth ?? PCCOAuthClient.fromEnv();

    const rateLimiter = new RateLimiter(this.config.rateLimitRps, this.config.rateLimitRpm);
    this.httpClient = new PCCHttpClient(
      this.config.pccBaseUrl,
      this.oauth,
      rateLimiter,
      this.config.requestTimeoutMs,
    );
    this.tools = PCC_TOOLS;
  }

  /**
   * Handle an incoming MCP request and return an MCP response.
   */
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

    const tool = getToolByName(params.name);
    if (!tool) {
      return this.errorResponse(request.id, MCP_ERRORS.METHOD_NOT_FOUND, `Unknown tool: ${params.name}`);
    }

    const toolArgs = params.arguments ?? {};

    // Build tool context
    const context: ToolContext = {
      facilityId: (toolArgs.facilityId as string) ?? '',
      agentId: (toolArgs._agentId as string) ?? 'unknown',
      traceId: (toolArgs._traceId as string) ?? crypto.randomUUID(),
      apiClient: this.httpClient,
    };

    try {
      const result = await tool.handler(toolArgs, context);
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
    if (error instanceof PCCRequestError) {
      return this.errorResponse(
        requestId,
        this.pccErrorToMCPCode(error.code),
        error.message,
        { pccErrorCode: error.code, httpStatus: error.httpStatus, requestId: error.requestId },
      );
    }

    if (error instanceof PCCAuthError) {
      return this.errorResponse(
        requestId,
        MCP_ERRORS.PCC_AUTH_FAILED,
        error.message,
        { statusCode: error.statusCode },
      );
    }

    const message = error instanceof Error ? error.message : 'Internal server error';
    return this.errorResponse(requestId, MCP_ERRORS.INTERNAL_ERROR, message);
  }

  private pccErrorToMCPCode(pccCode: PCCErrorCode): number {
    switch (pccCode) {
      case 'INVALID_TOKEN':
      case 'TOKEN_EXPIRED':
      case 'INSUFFICIENT_SCOPE':
        return MCP_ERRORS.PCC_AUTH_FAILED;
      case 'RATE_LIMIT_EXCEEDED':
        return MCP_ERRORS.PCC_RATE_LIMITED;
      case 'RESOURCE_NOT_FOUND':
        return MCP_ERRORS.PCC_NOT_FOUND;
      case 'FACILITY_ACCESS_DENIED':
        return MCP_ERRORS.PCC_ACCESS_DENIED;
      case 'VALIDATION_ERROR':
        return MCP_ERRORS.PCC_VALIDATION_ERROR;
      case 'SERVICE_UNAVAILABLE':
        return MCP_ERRORS.PCC_SERVICE_UNAVAILABLE;
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

  /** Get server configuration (for diagnostics, never includes secrets) */
  getServerInfo(): { name: string; version: string; toolCount: number; isPlaceholder: boolean } {
    return {
      name: this.config.name,
      version: this.config.version,
      toolCount: this.tools.length,
      isPlaceholder: this.oauth.isPlaceholder(),
    };
  }

  /** Get list of available tool names */
  getToolNames(): string[] {
    return this.tools.map((t) => t.name);
  }
}

/**
 * Create a PCC MCP Server with default configuration.
 * Reads credentials from environment variables.
 */
export function createPCCServer(config?: Partial<MCPServerConfig>): PCCMCPServer {
  return new PCCMCPServer(config);
}
