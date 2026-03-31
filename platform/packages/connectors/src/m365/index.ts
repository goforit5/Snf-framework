/**
 * M365 MCP Connector — Microsoft 365 / Graph API integration for the SNF Agentic Platform.
 *
 * Provides MCP-compliant tools for reading and writing M365 data via Microsoft Graph.
 * Agents use these tools to access Outlook email, calendar, SharePoint documents,
 * and Teams messages across the Ensign enterprise.
 */

// Server
export { M365MCPServer, createM365Server, M365RequestError } from './server.js';
export type { MCPServerConfig, MCPRequest, MCPResponse, MCPError, GraphApiClient, M365ErrorCode } from './server.js';

// Tools
export { m365Tools } from './tools.js';
export type { MCPToolDefinition } from './tools.js';

// OAuth
export { getAccessToken, getGraphBaseUrl, invalidateToken } from './oauth.js';
export type { AzureADTokenResponse } from './oauth.js';

// Types
export type {
  M365Email,
  M365Recipient,
  M365Attachment,
  M365EmailSearch,
  M365CalendarEvent,
  M365Attendee,
  M365CreateEvent,
  M365SharePointFile,
  M365SharePointSearch,
  M365TeamsMessage,
  M365TeamsMessageSearch,
  M365SendEmail,
} from './types.js';
