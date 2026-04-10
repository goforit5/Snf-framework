/**
 * Workday MCP Connector — Workday HCM/Payroll/Benefits integration for the SNF Agentic Platform.
 *
 * Provides MCP-compliant tools for reading HR data from Workday.
 * Agents use these tools to access employee records, payroll, benefits,
 * timecards, org charts, PTO, and staffing positions across 330+ facilities.
 *
 * Wave 8 (SNF-97): legacy `server.ts` and `oauth.ts` deleted. The new
 * gateway in `connectors/src/gateway/` mounts a connector instance via
 * reflection and Vaults supply OAuth tokens at request time.
 */

// Tools
export { workdayTools } from './tools.js';
export type { MCPToolDefinition } from './tools.js';

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
