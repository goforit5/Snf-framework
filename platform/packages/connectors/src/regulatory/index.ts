/**
 * Regulatory MCP Connector — CMS, OIG, SAM.gov, and bank feed integration for the SNF Agentic Platform.
 *
 * Provides MCP-compliant tools for regulatory compliance and financial data.
 * Agents use these tools to access CMS quality ratings, survey/inspection results,
 * OIG exclusion screening, SAM.gov debarment checks, and bank transaction feeds.
 */

// Server
export { RegulatoryMCPServer, createRegulatoryServer, RegulatoryRequestError } from './server.js';
export type { MCPServerConfig, MCPRequest, MCPResponse, MCPError, RegulatoryApiClient, RegulatorySource, RegulatoryErrorCode } from './server.js';

// Tools
export { regulatoryTools } from './tools.js';
export type { MCPToolDefinition } from './tools.js';

// Auth (API key, not OAuth)
export { getApiConfig, getApiKey, getBaseUrl, invalidateConfig } from './oauth.js';
export type { RegulatoryApiKeyConfig } from './oauth.js';

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
