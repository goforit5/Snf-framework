/**
 * M365 MCP Connector — Microsoft 365 / Graph API integration for the SNF Agentic Platform.
 *
 * Provides MCP-compliant tools for reading and writing M365 data via Microsoft Graph.
 * Agents use these tools to access Outlook email, calendar, SharePoint documents,
 * and Teams messages across the Ensign enterprise.
 *
 * Wave 8 (SNF-97): legacy `server.ts` and `oauth.ts` deleted. The new
 * gateway in `connectors/src/gateway/` mounts a connector instance via
 * reflection and Vaults supply OAuth tokens at request time.
 */

// Tools
export { m365Tools } from './tools.js';
export type { MCPToolDefinition } from './tools.js';

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
