/**
 * Generic adapter that mounts any existing connector class as an MCP server.
 *
 * Reflection strategy: enumerate the connector's public async methods
 * (skipping constructor, symbols, and private `_`-prefixed members) and
 * expose each as an MCP tool `${toolPrefix}__${methodName}`.
 *
 * Every string in every return value is passed through `PhiTokenizer.tokenize`
 * before leaving the gateway, so Claude never sees raw PHI.
 *
 * Connectors may optionally expose one of the following metadata shapes to
 * customize tool schemas:
 *   - `static mcpToolSchemas: Record<methodName, {description, inputSchema}>`
 *   - per-instance `mcpToolSchemas` getter
 * Otherwise a loose `{input: object}` schema is used.
 */

import {
  McpServer,
  type ToolCallContext,
  type ToolCallResult,
  type ToolSpec,
} from './mcp-server.js';
import type { PhiTokenizer } from './redaction.js';

// ---------------------------------------------------------------------------

interface ToolSchemaHint {
  description?: string;
  inputSchema?: Record<string, unknown>;
}

interface MaybeWithSchemas {
  mcpToolSchemas?: Record<string, ToolSchemaHint>;
}

const DEFAULT_INPUT_SCHEMA: Record<string, unknown> = {
  type: 'object',
  properties: { input: { type: 'object' } },
};

/** Mount any connector instance as an MCP server with PHI tokenization. */
export function mountConnectorAsMcp(
  connector: object,
  toolPrefix: string,
  tokenizer: PhiTokenizer,
): McpServer {
  const server = new McpServer({
    name: `${toolPrefix}-connector`,
    version: '0.1.0',
  });

  const schemas = (connector as MaybeWithSchemas).mcpToolSchemas ?? {};
  const methodNames = discoverPublicMethods(connector);

  for (const methodName of methodNames) {
    const hint: ToolSchemaHint = schemas[methodName] ?? {};
    const spec: ToolSpec = {
      name: `${toolPrefix}__${methodName}`,
      description: hint.description ?? `Connector method ${toolPrefix}.${methodName}`,
      inputSchema: hint.inputSchema ?? DEFAULT_INPUT_SCHEMA,
      handler: async (input, ctx): Promise<ToolCallResult> =>
        invokeAndTokenize(connector, methodName, input, ctx, tokenizer),
    };
    server.registerTool(spec);
  }

  return server;
}

function discoverPublicMethods(connector: object): string[] {
  const names = new Set<string>();
  let proto: object | null = Object.getPrototypeOf(connector) as object | null;
  while (proto && proto !== Object.prototype) {
    for (const key of Object.getOwnPropertyNames(proto)) {
      if (key === 'constructor') continue;
      if (key.startsWith('_')) continue;
      const descriptor = Object.getOwnPropertyDescriptor(proto, key);
      if (!descriptor || typeof descriptor.value !== 'function') continue;
      names.add(key);
    }
    proto = Object.getPrototypeOf(proto) as object | null;
  }
  // Also consider own properties that happen to be functions.
  for (const key of Object.getOwnPropertyNames(connector)) {
    if (key.startsWith('_')) continue;
    const value = (connector as Record<string, unknown>)[key];
    if (typeof value === 'function') names.add(key);
  }
  return Array.from(names);
}

async function invokeAndTokenize(
  connector: object,
  methodName: string,
  input: Record<string, unknown>,
  _ctx: ToolCallContext,
  tokenizer: PhiTokenizer,
): Promise<ToolCallResult> {
  const method = (connector as Record<string, unknown>)[methodName];
  if (typeof method !== 'function') {
    return {
      content: [{ type: 'text', text: `Method ${methodName} is not callable` }],
      isError: true,
    };
  }

  try {
    // Call with a single argument; connectors can destructure.
    const raw = await (method as (arg: unknown) => Promise<unknown>).call(connector, input);
    const jsonText = JSON.stringify(raw ?? null, null, 2);
    const tokenized = await tokenizer.tokenize(jsonText);
    return {
      content: [{ type: 'text', text: tokenized }],
      isError: false,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'unknown error';
    return {
      content: [{ type: 'text', text: `Connector call failed: ${msg}` }],
      isError: true,
    };
  }
}
