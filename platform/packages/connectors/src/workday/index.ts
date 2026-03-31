/**
 * Workday MCP Connector — Workday HCM/Payroll/Benefits integration for the SNF Agentic Platform.
 *
 * Provides MCP-compliant tools for reading HR data from Workday.
 * Agents use these tools to access employee records, payroll, benefits,
 * timecards, org charts, PTO, and staffing positions across 330+ facilities.
 */

// Server
export { WorkdayMCPServer, createWorkdayServer, WorkdayRequestError } from './server.js';
export type { MCPServerConfig, MCPRequest, MCPResponse, MCPError, WorkdayApiClient, WorkdayErrorCode } from './server.js';

// Tools
export { workdayTools } from './tools.js';
export type { MCPToolDefinition } from './tools.js';

// OAuth
export { getAccessToken, getBaseUrl, invalidateToken } from './oauth.js';
export type { WorkdayTokenResponse } from './oauth.js';

// Types
export type {
  WorkdayEmployee,
  WorkdayPosition,
  WorkdayDepartment,
  WorkdayPayroll,
  WorkdayDeduction,
  WorkdayTax,
  WorkdayEarning,
  WorkdayBenefits,
  WorkdayBenefitEnrollment,
  WorkdayTimecard,
  WorkdayTimecardEntry,
  WorkdayOrgUnit,
  WorkdayPTO,
  WorkdayPTOBalance,
  WorkdayPTORequest,
  WorkdayEmployeeSearch,
  WorkdayPositionSearch,
} from './types.js';
