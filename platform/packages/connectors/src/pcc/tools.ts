/**
 * MCP tool definitions for PCC (PointClickCare).
 *
 * Each tool maps to one or more PCC REST API endpoints. Tool descriptions
 * are written for Claude — they explain when to use the tool, what data
 * it returns, and any governance constraints.
 */

import type { GovernanceLevel } from '@snf/core';
import type {
  PCCResident,
  PCCMedication,
  PCCOrder,
  PCCAssessment,
  PCCVitals,
  PCCIncident,
  PCCCarePlan,
  PCCProgressNote,
  PCCProgressNoteInput,
  PCCCensus,
  PCCLabResult,
  PCCApiResponse,
} from './types.js';

// ---------------------------------------------------------------------------
// MCP Tool Schema Types
// ---------------------------------------------------------------------------

export interface MCPToolDefinition {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  /** Minimum governance level required to invoke this tool */
  minGovernanceLevel: GovernanceLevel;
  /** PCC API endpoint pattern(s) this tool calls */
  pccEndpoints: string[];
  handler: (params: Record<string, unknown>, context: ToolContext) => Promise<unknown>;
}

export interface ToolContext {
  facilityId: string;
  agentId: string;
  traceId: string;
  apiClient: PCCApiClient;
}

/** Interface for the HTTP client that tools use to call PCC */
export interface PCCApiClient {
  get<T>(path: string, params?: Record<string, string>): Promise<PCCApiResponse<T>>;
  post<T>(path: string, body: unknown): Promise<PCCApiResponse<T>>;
}

// ---------------------------------------------------------------------------
// Tool Definitions
// ---------------------------------------------------------------------------

export const PCC_TOOLS: MCPToolDefinition[] = [
  // -------------------------------------------------------------------------
  // pcc_get_resident
  // -------------------------------------------------------------------------
  {
    name: 'pcc_get_resident',
    description:
      'Get a resident by their PCC resident ID. Returns full demographics, room/bed assignment, ' +
      'payer information, diagnosis list, allergies, advance directives, and attending physician. ' +
      'Use this when you need a complete picture of a specific resident — for example, before ' +
      'generating a care plan review, preparing a family conference summary, or checking payer ' +
      'status for billing. Returns PHI — governance level 4+ required for any action on this data.',
    inputSchema: {
      type: 'object',
      properties: {
        residentId: {
          type: 'string',
          description: 'PCC resident ID (e.g., "RES-12345")',
        },
        facilityId: {
          type: 'string',
          description: 'Facility ID where the resident resides',
        },
      },
      required: ['residentId', 'facilityId'],
    },
    minGovernanceLevel: 0, // Read-only, observe
    pccEndpoints: ['GET /facilities/{facilityId}/residents/{residentId}'],
    handler: async (params, context) => {
      const { residentId, facilityId } = params as { residentId: string; facilityId: string };
      const response = await context.apiClient.get<PCCResident>(
        `/facilities/${facilityId}/residents/${residentId}`,
      );
      return response.data;
    },
  },

  // -------------------------------------------------------------------------
  // pcc_search_residents
  // -------------------------------------------------------------------------
  {
    name: 'pcc_search_residents',
    description:
      'Search for residents across one or more facilities. Supports filtering by name, room number, ' +
      'payer type, and status. Use this to find residents matching criteria — for example, all ' +
      'Medicare A residents in a facility, all residents on a specific floor, or finding a resident ' +
      'by partial name. Returns a paginated list. For large facilities, use pagination parameters.',
    inputSchema: {
      type: 'object',
      properties: {
        facilityId: {
          type: 'string',
          description: 'Facility ID to search within',
        },
        firstName: {
          type: 'string',
          description: 'First name (partial match supported)',
        },
        lastName: {
          type: 'string',
          description: 'Last name (partial match supported)',
        },
        roomNumber: {
          type: 'string',
          description: 'Room number (exact match)',
        },
        payerCode: {
          type: 'string',
          description: 'Payer code filter: MA (Medicare A), MB (Medicare B), MC (Medicaid), MCO (Managed Care), PP (Private Pay), VA',
        },
        status: {
          type: 'string',
          enum: ['Active', 'Discharged', 'Hospital', 'LOA', 'Deceased'],
          description: 'Resident status filter. Defaults to Active if omitted.',
        },
        pageSize: {
          type: 'number',
          description: 'Results per page (default 50, max 200)',
        },
        pageNumber: {
          type: 'number',
          description: 'Page number (1-based, default 1)',
        },
      },
      required: ['facilityId'],
    },
    minGovernanceLevel: 0,
    pccEndpoints: ['GET /facilities/{facilityId}/residents'],
    handler: async (params, context) => {
      const { facilityId, ...filters } = params as Record<string, string>;
      const queryParams: Record<string, string> = {};
      for (const [key, value] of Object.entries(filters)) {
        if (value !== undefined && value !== null) {
          queryParams[key] = String(value);
        }
      }
      const response = await context.apiClient.get<PCCResident[]>(
        `/facilities/${facilityId}/residents`,
        queryParams,
      );
      return response;
    },
  },

  // -------------------------------------------------------------------------
  // pcc_get_medications
  // -------------------------------------------------------------------------
  {
    name: 'pcc_get_medications',
    description:
      'Get active medications for a resident. Returns drug name, generic name, dosage, route, ' +
      'frequency, prescriber, and flags for psychotropic and controlled substances. Includes ' +
      'gradual dose reduction due dates for psychotropic medications. Use this for medication ' +
      'reconciliation, psychotropic audits, pharmacy reviews, or when a resident has a clinical ' +
      'change that may require medication adjustments. Critical for CMS F-tag compliance ' +
      '(F757 unnecessary drugs, F758 psychotropic GDR).',
    inputSchema: {
      type: 'object',
      properties: {
        residentId: {
          type: 'string',
          description: 'PCC resident ID',
        },
        facilityId: {
          type: 'string',
          description: 'Facility ID',
        },
        status: {
          type: 'string',
          enum: ['Active', 'Discontinued', 'Hold', 'PRN', 'All'],
          description: 'Medication status filter. Defaults to Active.',
        },
        psychotropicOnly: {
          type: 'boolean',
          description: 'If true, return only psychotropic medications. Useful for GDR audits.',
        },
      },
      required: ['residentId', 'facilityId'],
    },
    minGovernanceLevel: 0,
    pccEndpoints: ['GET /facilities/{facilityId}/residents/{residentId}/medications'],
    handler: async (params, context) => {
      const { residentId, facilityId, ...filters } = params as Record<string, string>;
      const queryParams: Record<string, string> = {};
      for (const [key, value] of Object.entries(filters)) {
        if (value !== undefined && value !== null) {
          queryParams[key] = String(value);
        }
      }
      const response = await context.apiClient.get<PCCMedication[]>(
        `/facilities/${facilityId}/residents/${residentId}/medications`,
        queryParams,
      );
      return response;
    },
  },

  // -------------------------------------------------------------------------
  // pcc_get_orders
  // -------------------------------------------------------------------------
  {
    name: 'pcc_get_orders',
    description:
      'Get current orders for a resident — medications, treatments, dietary, lab, radiology, ' +
      'and therapy orders. Use this when reviewing a resident\'s active treatment plan, checking ' +
      'for pending lab orders, verifying dietary restrictions, or auditing order completeness. ' +
      'Supports filtering by order type and status. STAT orders are flagged for priority handling.',
    inputSchema: {
      type: 'object',
      properties: {
        residentId: {
          type: 'string',
          description: 'PCC resident ID',
        },
        facilityId: {
          type: 'string',
          description: 'Facility ID',
        },
        orderType: {
          type: 'string',
          enum: ['Medication', 'Treatment', 'Dietary', 'Lab', 'Radiology', 'Therapy', 'Other'],
          description: 'Filter by order type. Omit for all types.',
        },
        status: {
          type: 'string',
          enum: ['Active', 'Completed', 'Discontinued', 'Pending'],
          description: 'Order status filter. Defaults to Active.',
        },
      },
      required: ['residentId', 'facilityId'],
    },
    minGovernanceLevel: 0,
    pccEndpoints: ['GET /facilities/{facilityId}/residents/{residentId}/orders'],
    handler: async (params, context) => {
      const { residentId, facilityId, ...filters } = params as Record<string, string>;
      const queryParams: Record<string, string> = {};
      for (const [key, value] of Object.entries(filters)) {
        if (value !== undefined && value !== null) {
          queryParams[key] = String(value);
        }
      }
      const response = await context.apiClient.get<PCCOrder[]>(
        `/facilities/${facilityId}/residents/${residentId}/orders`,
        queryParams,
      );
      return response;
    },
  },

  // -------------------------------------------------------------------------
  // pcc_get_assessments
  // -------------------------------------------------------------------------
  {
    name: 'pcc_get_assessments',
    description:
      'Get assessments for a resident: MDS (Minimum Data Set), BIMS (Brief Interview for Mental ' +
      'Status), PHQ-9 (depression screening), falls risk, Braden (pressure ulcer risk), and pain ' +
      'assessments. MDS assessments drive PDPM reimbursement — accurate and timely completion is ' +
      'critical for revenue. Use this for MDS tracking, clinical quality reviews, PDPM optimization, ' +
      'or when investigating care quality issues. The ARD (Assessment Reference Date) determines ' +
      'the look-back period for billing.',
    inputSchema: {
      type: 'object',
      properties: {
        residentId: {
          type: 'string',
          description: 'PCC resident ID',
        },
        facilityId: {
          type: 'string',
          description: 'Facility ID',
        },
        assessmentType: {
          type: 'string',
          enum: [
            'MDS_ADMISSION', 'MDS_QUARTERLY', 'MDS_ANNUAL', 'MDS_SIGNIFICANT_CHANGE',
            'MDS_DISCHARGE', 'BIMS', 'PHQ9', 'FALLS_RISK', 'BRADEN', 'PAIN',
          ],
          description: 'Filter by assessment type. Omit for all types.',
        },
        fromDate: {
          type: 'string',
          description: 'Start date filter (ISO 8601, e.g., "2026-01-01")',
        },
        toDate: {
          type: 'string',
          description: 'End date filter (ISO 8601)',
        },
        status: {
          type: 'string',
          enum: ['In Progress', 'Completed', 'Locked', 'Corrected'],
          description: 'Assessment status filter',
        },
      },
      required: ['residentId', 'facilityId'],
    },
    minGovernanceLevel: 0,
    pccEndpoints: ['GET /facilities/{facilityId}/residents/{residentId}/assessments'],
    handler: async (params, context) => {
      const { residentId, facilityId, ...filters } = params as Record<string, string>;
      const queryParams: Record<string, string> = {};
      for (const [key, value] of Object.entries(filters)) {
        if (value !== undefined && value !== null) {
          queryParams[key] = String(value);
        }
      }
      const response = await context.apiClient.get<PCCAssessment[]>(
        `/facilities/${facilityId}/residents/${residentId}/assessments`,
        queryParams,
      );
      return response;
    },
  },

  // -------------------------------------------------------------------------
  // pcc_get_vitals
  // -------------------------------------------------------------------------
  {
    name: 'pcc_get_vitals',
    description:
      'Get recent vital signs for a resident: temperature, blood pressure, heart rate, respiratory ' +
      'rate, O2 saturation, weight, pain level, and blood glucose. Use this when monitoring ' +
      'clinical changes, investigating incidents, reviewing a resident before a physician visit, ' +
      'or detecting weight loss trends (>5% in 30 days is a quality indicator). Returns records ' +
      'in reverse chronological order.',
    inputSchema: {
      type: 'object',
      properties: {
        residentId: {
          type: 'string',
          description: 'PCC resident ID',
        },
        facilityId: {
          type: 'string',
          description: 'Facility ID',
        },
        fromDate: {
          type: 'string',
          description: 'Start date (ISO 8601). Defaults to 30 days ago.',
        },
        toDate: {
          type: 'string',
          description: 'End date (ISO 8601). Defaults to today.',
        },
        limit: {
          type: 'number',
          description: 'Max records to return (default 50)',
        },
      },
      required: ['residentId', 'facilityId'],
    },
    minGovernanceLevel: 0,
    pccEndpoints: ['GET /facilities/{facilityId}/residents/{residentId}/vitals'],
    handler: async (params, context) => {
      const { residentId, facilityId, ...filters } = params as Record<string, string>;
      const queryParams: Record<string, string> = {};
      for (const [key, value] of Object.entries(filters)) {
        if (value !== undefined && value !== null) {
          queryParams[key] = String(value);
        }
      }
      const response = await context.apiClient.get<PCCVitals[]>(
        `/facilities/${facilityId}/residents/${residentId}/vitals`,
        queryParams,
      );
      return response;
    },
  },

  // -------------------------------------------------------------------------
  // pcc_get_incidents
  // -------------------------------------------------------------------------
  {
    name: 'pcc_get_incidents',
    description:
      'Get incident reports for a specific resident or an entire facility. Includes falls, ' +
      'medication errors, elopements, skin integrity issues, behavior incidents, and abuse/neglect ' +
      'allegations. Use this for root cause analysis, trend identification (e.g., frequent fallers), ' +
      'survey readiness, or when investigating quality concerns. Sentinel events require immediate ' +
      'escalation. Falls are the #1 incident type in SNFs and directly impact star ratings.',
    inputSchema: {
      type: 'object',
      properties: {
        facilityId: {
          type: 'string',
          description: 'Facility ID (required)',
        },
        residentId: {
          type: 'string',
          description: 'PCC resident ID. Omit for facility-wide incidents.',
        },
        incidentType: {
          type: 'string',
          enum: ['Fall', 'Medication Error', 'Elopement', 'Skin Integrity', 'Behavior', 'Abuse/Neglect Allegation', 'Equipment', 'Infection', 'Other'],
          description: 'Filter by incident type',
        },
        severity: {
          type: 'string',
          enum: ['Minor', 'Moderate', 'Major', 'Sentinel'],
          description: 'Filter by severity level',
        },
        fromDate: {
          type: 'string',
          description: 'Start date (ISO 8601)',
        },
        toDate: {
          type: 'string',
          description: 'End date (ISO 8601)',
        },
        status: {
          type: 'string',
          enum: ['Open', 'Under Review', 'Closed'],
          description: 'Incident status filter',
        },
      },
      required: ['facilityId'],
    },
    minGovernanceLevel: 0,
    pccEndpoints: [
      'GET /facilities/{facilityId}/incidents',
      'GET /facilities/{facilityId}/residents/{residentId}/incidents',
    ],
    handler: async (params, context) => {
      const { facilityId, residentId, ...filters } = params as Record<string, string>;
      const queryParams: Record<string, string> = {};
      for (const [key, value] of Object.entries(filters)) {
        if (value !== undefined && value !== null) {
          queryParams[key] = String(value);
        }
      }
      const basePath = residentId
        ? `/facilities/${facilityId}/residents/${residentId}/incidents`
        : `/facilities/${facilityId}/incidents`;
      const response = await context.apiClient.get<PCCIncident[]>(basePath, queryParams);
      return response;
    },
  },

  // -------------------------------------------------------------------------
  // pcc_get_care_plan
  // -------------------------------------------------------------------------
  {
    name: 'pcc_get_care_plan',
    description:
      'Get the active care plan for a resident, including problems, goals, and interventions. ' +
      'Care plans must be individualized, resident-centered, and reviewed quarterly. Use this ' +
      'when preparing for care conferences, reviewing clinical quality, checking if interventions ' +
      'align with current diagnoses, or auditing care plan timeliness. CMS requires care plan ' +
      'updates within 7 days of an MDS assessment. Missing or generic care plans are a top ' +
      'survey deficiency (F656/F657).',
    inputSchema: {
      type: 'object',
      properties: {
        residentId: {
          type: 'string',
          description: 'PCC resident ID',
        },
        facilityId: {
          type: 'string',
          description: 'Facility ID',
        },
        status: {
          type: 'string',
          enum: ['Active', 'Revised', 'Discontinued'],
          description: 'Care plan status filter. Defaults to Active.',
        },
      },
      required: ['residentId', 'facilityId'],
    },
    minGovernanceLevel: 0,
    pccEndpoints: ['GET /facilities/{facilityId}/residents/{residentId}/careplans'],
    handler: async (params, context) => {
      const { residentId, facilityId, status } = params as {
        residentId: string;
        facilityId: string;
        status?: string;
      };
      const queryParams: Record<string, string> = {};
      if (status) queryParams.status = status;
      const response = await context.apiClient.get<PCCCarePlan[]>(
        `/facilities/${facilityId}/residents/${residentId}/careplans`,
        queryParams,
      );
      return response;
    },
  },

  // -------------------------------------------------------------------------
  // pcc_create_progress_note
  // -------------------------------------------------------------------------
  {
    name: 'pcc_create_progress_note',
    description:
      'Create a progress note in PCC for a resident. This is a WRITE operation — it creates a ' +
      'clinical record in the EHR. Requires governance level 4+ (REQUIRE_APPROVAL). The note is ' +
      'created in Draft status and must be signed by the author. Use this when an agent needs to ' +
      'document a clinical observation, intervention, or communication. Never fabricate clinical ' +
      'observations — notes must be based on data from other PCC tools or direct clinical input. ' +
      'All progress notes are part of the legal medical record.',
    inputSchema: {
      type: 'object',
      properties: {
        residentId: {
          type: 'string',
          description: 'PCC resident ID',
        },
        facilityId: {
          type: 'string',
          description: 'Facility ID',
        },
        noteType: {
          type: 'string',
          enum: ['Nursing', 'Social Services', 'Dietary', 'Activities', 'Therapy', 'Physician'],
          description: 'Type of progress note',
        },
        noteText: {
          type: 'string',
          description: 'Note content. Must be factual, objective, and based on documented data.',
        },
        authorId: {
          type: 'string',
          description: 'PCC user ID of the note author (the clinician, not the agent)',
        },
        authorName: {
          type: 'string',
          description: 'Full name of the note author',
        },
        authorCredentials: {
          type: 'string',
          description: 'Author credentials (e.g., "RN", "LPN", "MD", "MSW")',
        },
      },
      required: ['residentId', 'facilityId', 'noteType', 'noteText', 'authorId', 'authorName', 'authorCredentials'],
    },
    minGovernanceLevel: 4, // REQUIRE_APPROVAL — writes to medical record
    pccEndpoints: ['POST /facilities/{facilityId}/residents/{residentId}/progressnotes'],
    handler: async (params, context) => {
      const input = params as unknown as PCCProgressNoteInput;
      const response = await context.apiClient.post<PCCProgressNote>(
        `/facilities/${input.facilityId}/residents/${input.residentId}/progressnotes`,
        {
          noteType: input.noteType,
          noteText: input.noteText,
          authorId: input.authorId,
          authorName: input.authorName,
          authorCredentials: input.authorCredentials,
        },
      );
      return response.data;
    },
  },

  // -------------------------------------------------------------------------
  // pcc_get_census
  // -------------------------------------------------------------------------
  {
    name: 'pcc_get_census',
    description:
      'Get facility census with bed management data. Returns total beds, occupied beds, available ' +
      'beds, occupancy rate, and a list of current residents with room assignments. Also includes ' +
      'pending admissions and discharges. Use this for real-time census tracking, bed availability ' +
      'for new admissions, occupancy reporting, and revenue projections. Occupancy rate is a key ' +
      'financial metric — each empty bed costs $200-400/day in lost revenue.',
    inputSchema: {
      type: 'object',
      properties: {
        facilityId: {
          type: 'string',
          description: 'Facility ID',
        },
        censusDate: {
          type: 'string',
          description: 'Census date (ISO 8601). Defaults to today.',
        },
      },
      required: ['facilityId'],
    },
    minGovernanceLevel: 0,
    pccEndpoints: ['GET /facilities/{facilityId}/census'],
    handler: async (params, context) => {
      const { facilityId, censusDate } = params as { facilityId: string; censusDate?: string };
      const queryParams: Record<string, string> = {};
      if (censusDate) queryParams.censusDate = censusDate;
      const response = await context.apiClient.get<PCCCensus>(
        `/facilities/${facilityId}/census`,
        queryParams,
      );
      return response.data;
    },
  },

  // -------------------------------------------------------------------------
  // pcc_get_lab_results
  // -------------------------------------------------------------------------
  {
    name: 'pcc_get_lab_results',
    description:
      'Get lab results for a resident. Returns test name, result value, reference range, abnormal ' +
      'flags (including critical values), collection date, and ordering provider. Use this when ' +
      'reviewing clinical status, monitoring chronic conditions (e.g., INR for warfarin, HbA1c ' +
      'for diabetes, BMP for renal function), or investigating clinical changes. Critical values ' +
      '(Critical High/Critical Low) require immediate physician notification per CLIA regulations.',
    inputSchema: {
      type: 'object',
      properties: {
        residentId: {
          type: 'string',
          description: 'PCC resident ID',
        },
        facilityId: {
          type: 'string',
          description: 'Facility ID',
        },
        testName: {
          type: 'string',
          description: 'Filter by test name (partial match). E.g., "CBC", "BMP", "INR".',
        },
        fromDate: {
          type: 'string',
          description: 'Start date (ISO 8601)',
        },
        toDate: {
          type: 'string',
          description: 'End date (ISO 8601)',
        },
        abnormalOnly: {
          type: 'boolean',
          description: 'If true, return only abnormal results',
        },
      },
      required: ['residentId', 'facilityId'],
    },
    minGovernanceLevel: 0,
    pccEndpoints: ['GET /facilities/{facilityId}/residents/{residentId}/labresults'],
    handler: async (params, context) => {
      const { residentId, facilityId, ...filters } = params as Record<string, string>;
      const queryParams: Record<string, string> = {};
      for (const [key, value] of Object.entries(filters)) {
        if (value !== undefined && value !== null) {
          queryParams[key] = String(value);
        }
      }
      const response = await context.apiClient.get<PCCLabResult[]>(
        `/facilities/${facilityId}/residents/${residentId}/labresults`,
        queryParams,
      );
      return response;
    },
  },
];

/** Lookup a tool definition by name */
export function getToolByName(name: string): MCPToolDefinition | undefined {
  return PCC_TOOLS.find((t) => t.name === name);
}

/** Get all tool names for agent configuration */
export function getToolNames(): string[] {
  return PCC_TOOLS.map((t) => t.name);
}
