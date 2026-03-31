/**
 * PCC MCP Connector — PointClickCare integration for the SNF Agentic Platform.
 *
 * Provides MCP-compliant tools for reading and writing clinical data in PCC.
 * Agents use these tools to access resident records, medications, assessments,
 * vitals, incidents, care plans, and census data across 330+ facilities.
 */

// Server
export { PCCMCPServer, createPCCServer, PCCRequestError } from './server.js';
export type { MCPServerConfig, MCPRequest, MCPResponse, MCPError } from './server.js';

// Tools
export { PCC_TOOLS, getToolByName, getToolNames } from './tools.js';
export type { MCPToolDefinition, ToolContext, PCCApiClient } from './tools.js';

// OAuth
export { PCCOAuthClient, PCCAuthError, MemoryTokenStorage, SecretsManagerTokenStorage } from './oauth.js';
export type { OAuthToken, OAuthClientConfig, TokenStorage } from './oauth.js';

// Types
export type {
  PCCApiResponse,
  PCCApiError,
  PCCErrorCode,
  PCCResident,
  PCCDiagnosis,
  PCCAllergy,
  PCCAdvanceDirective,
  PCCMedication,
  PCCOrder,
  PCCAssessment,
  PCCAssessmentType,
  PCCAssessmentSection,
  PCCVitals,
  PCCIncident,
  PCCIncidentType,
  PCCCarePlan,
  PCCCarePlanProblem,
  PCCCarePlanGoal,
  PCCCarePlanIntervention,
  PCCProgressNote,
  PCCProgressNoteInput,
  PCCCensus,
  PCCCensusResident,
  PCCLabResult,
} from './types.js';
export { mapPCCResidentToResident } from './types.js';
