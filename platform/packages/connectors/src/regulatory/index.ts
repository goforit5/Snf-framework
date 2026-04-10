/**
 * Regulatory MCP Connector — CMS, OIG, SAM.gov, and bank feed integration for the SNF Agentic Platform.
 *
 * Provides MCP-compliant tools for regulatory compliance and financial data.
 * Agents use these tools to access CMS quality ratings, survey/inspection results,
 * OIG exclusion screening, SAM.gov debarment checks, and bank transaction feeds.
 *
 * Wave 8 (SNF-97): legacy `server.ts` and `oauth.ts` deleted. The new
 * gateway in `connectors/src/gateway/` mounts a connector instance via
 * reflection and Vaults supply API keys at request time.
 */

// Tools
export { regulatoryTools } from './tools.js';
export type { MCPToolDefinition } from './tools.js';

// Types
export type {
  CMSFacilityQuality,
  CMSQualityMeasure,
  CMSStaffingData,
  CMSSurveyResult,
  CMSDeficiency,
  CMSPenalty,
  OIGExclusionResult,
  OIGExclusionMatch,
  OIGBatchScreeningResult,
  SAMDebarmentResult,
  SAMDebarmentMatch,
  BankTransaction,
  BankBalance,
} from './types.js';
