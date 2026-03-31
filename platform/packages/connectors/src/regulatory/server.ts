/**
 * Regulatory MCP Server — Model Context Protocol compliant server for CMS, OIG, SAM.gov, and bank feeds.
 *
 * This server exposes regulatory and financial data tools to Claude agents. It handles:
 * - API key auth for CMS Provider Data, OIG LEIE, SAM.gov, and bank feed aggregators
 * - Rate limiting per API provider contracts
 * - Error handling with source-specific error codes
 * - MCP protocol messages (initialize, tools/list, tools/call)
 *
 * Agents never hold credentials. This server is the only component that
 * authenticates with regulatory data sources. All requests are logged for audit trail.
 */

import { getApiConfig, getApiKey, getBaseUrl, invalidateConfig } from './oauth.js';
import type { RegulatoryApiKeyConfig } from './oauth.js';
import { regulatoryTools } from './tools.js';
import type { MCPToolDefinition } from './tools.js';

// ---------------------------------------------------------------------------
// MCP Protocol Types
// ---------------------------------------------------------------------------

export interface MCPServerConfig {
  name: string;
  version: string;
  /** Requests per second limit (conservative: 2 req/s across all sources) */
  rateLimitRps: number;
  /** Requests per minute limit (conservative: 60 req/min across all sources) */
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
  // Regulatory-specific error codes (application range: -32000 to -32099)
  REG_AUTH_FAILED: -32000,
  REG_RATE_LIMITED: -32001,
  REG_NOT_FOUND: -32002,
  REG_ACCESS_DENIED: -32003,
  REG_VALIDATION_ERROR: -32004,
  REG_SERVICE_UNAVAILABLE: -32005,
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
// Regulatory HTTP Client
// ---------------------------------------------------------------------------

export type RegulatorySource = 'cms' | 'oig' | 'sam' | 'bank';

export interface RegulatoryApiClient {
  get<T>(source: RegulatorySource, path: string, params?: Record<string, string>): Promise<T>;
  post<T>(source: RegulatorySource, path: string, body: unknown): Promise<T>;
}

class RegulatoryHttpClient implements RegulatoryApiClient {
  private readonly rateLimiter: RateLimiter;
  private readonly timeoutMs: number;

  constructor(rateLimiter: RateLimiter, timeoutMs: number) {
    this.rateLimiter = rateLimiter;
    this.timeoutMs = timeoutMs;
  }

  async get<T>(source: RegulatorySource, path: string, params?: Record<string, string>): Promise<T> {
    return this.request<T>(source, 'GET', path, params);
  }

  async post<T>(source: RegulatorySource, path: string, body: unknown): Promise<T> {
    return this.request<T>(source, 'POST', path, undefined, body);
  }

  private async request<T>(
    source: RegulatorySource,
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

    const baseUrl = getBaseUrl(source);
    const apiKey = getApiKey(source);
    const url = new URL(`${baseUrl}${path}`);

    if (params) {
      for (const [key, value] of Object.entries(params)) {
        url.searchParams.set(key, value);
      }
    }

    // Each source uses a different auth header pattern
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };

    switch (source) {
      case 'cms':
        headers['X-API-Key'] = apiKey;
        break;
      case 'oig':
        headers['Authorization'] = `Bearer ${apiKey}`;
        break;
      case 'sam':
        url.searchParams.set('api_key', apiKey);
        break;
      case 'bank':
        headers['PLAID-CLIENT-ID'] = apiKey;
        headers['PLAID-SECRET'] = apiKey;
        break;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(url.toString(), {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          invalidateConfig();
        }
        throw new RegulatoryRequestError(
          `${source.toUpperCase()} API error: ${response.status} ${response.statusText}`,
          this.httpStatusToErrorCode(response.status),
          response.status,
          source,
        );
      }

      return (await response.json()) as T;
    } finally {
      clearTimeout(timeout);
    }
  }

  private httpStatusToErrorCode(status: number): RegulatoryErrorCode {
    switch (status) {
      case 401: return 'AUTH_FAILED';
      case 403: return 'ACCESS_DENIED';
      case 404: return 'NOT_FOUND';
      case 422: return 'VALIDATION_ERROR';
      case 429: return 'RATE_LIMITED';
      case 503: return 'SERVICE_UNAVAILABLE';
      default: return 'INTERNAL_ERROR';
    }
  }
}

// ---------------------------------------------------------------------------
// Error Types
// ---------------------------------------------------------------------------

export type RegulatoryErrorCode =
  | 'AUTH_FAILED'
  | 'RATE_LIMITED'
  | 'NOT_FOUND'
  | 'ACCESS_DENIED'
  | 'VALIDATION_ERROR'
  | 'SERVICE_UNAVAILABLE'
  | 'INTERNAL_ERROR';

export class RegulatoryRequestError extends Error {
  readonly code: RegulatoryErrorCode;
  readonly httpStatus: number;
  readonly source: RegulatorySource;

  constructor(message: string, code: RegulatoryErrorCode, httpStatus: number, source: RegulatorySource) {
    super(message);
    this.name = 'RegulatoryRequestError';
    this.code = code;
    this.httpStatus = httpStatus;
    this.source = source;
  }
}

// ---------------------------------------------------------------------------
// Regulatory MCP Server
// ---------------------------------------------------------------------------

const DEFAULT_CONFIG: MCPServerConfig = {
  name: 'regulatory-mcp-server',
  version: '0.1.0',
  rateLimitRps: 2,
  rateLimitRpm: 60,
  requestTimeoutMs: 30000,
};

export class RegulatoryMCPServer {
  private readonly config: MCPServerConfig;
  private readonly httpClient: RegulatoryHttpClient;
  private readonly tools: MCPToolDefinition[];
  private readonly apiConfig: RegulatoryApiKeyConfig;

  constructor(config?: Partial<MCPServerConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    const rateLimiter = new RateLimiter(this.config.rateLimitRps, this.config.rateLimitRpm);
    this.httpClient = new RegulatoryHttpClient(rateLimiter, this.config.requestTimeoutMs);
    this.tools = regulatoryTools;
    this.apiConfig = getApiConfig();
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
    if (error instanceof RegulatoryRequestError) {
      return this.errorResponse(
        requestId,
        this.regulatoryErrorToMCPCode(error.code),
        error.message,
        { regulatoryErrorCode: error.code, httpStatus: error.httpStatus, source: error.source },
      );
    }

    const message = error instanceof Error ? error.message : 'Internal server error';
    return this.errorResponse(requestId, MCP_ERRORS.INTERNAL_ERROR, message);
  }

  private regulatoryErrorToMCPCode(code: RegulatoryErrorCode): number {
    switch (code) {
      case 'AUTH_FAILED':
        return MCP_ERRORS.REG_AUTH_FAILED;
      case 'RATE_LIMITED':
        return MCP_ERRORS.REG_RATE_LIMITED;
      case 'NOT_FOUND':
        return MCP_ERRORS.REG_NOT_FOUND;
      case 'ACCESS_DENIED':
        return MCP_ERRORS.REG_ACCESS_DENIED;
      case 'VALIDATION_ERROR':
        return MCP_ERRORS.REG_VALIDATION_ERROR;
      case 'SERVICE_UNAVAILABLE':
        return MCP_ERRORS.REG_SERVICE_UNAVAILABLE;
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
      isPlaceholder: this.apiConfig.isPlaceholder,
    };
  }

  getToolNames(): string[] {
    return this.tools.map((t) => t.name);
  }
}

/**
 * Create a Regulatory MCP Server with default configuration.
 * Reads API keys from environment variables.
 */
export function createRegulatoryServer(config?: Partial<MCPServerConfig>): RegulatoryMCPServer {
  return new RegulatoryMCPServer(config);
}
