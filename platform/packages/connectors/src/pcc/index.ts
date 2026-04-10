/**
 * PCC MCP Connector — PointClickCare integration for the SNF Agentic Platform.
 *
 * Provides MCP-compliant tools for reading and writing clinical data in PCC.
 * Agents use these tools to access resident records, medications, assessments,
 * vitals, incidents, care plans, and census data across 330+ facilities.
 *
 * Wave 8 (SNF-97): the legacy `server.ts` (custom JSON-RPC HTTP server) and
 * `oauth.ts` (token lifecycle) are deleted. Connector tool method bodies live
 * in `tools.ts` and types in `types.ts`. The new gateway in
 * `connectors/src/gateway/` mounts a connector instance via reflection
 * (`mountConnectorAsMcp`) and Vaults supply OAuth tokens at request time.
 */

// Tools
export { PCC_TOOLS, getToolByName, getToolNames } from './tools.js';
export type { MCPToolDefinition, ToolContext, PCCApiClient } from './tools.js';

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
