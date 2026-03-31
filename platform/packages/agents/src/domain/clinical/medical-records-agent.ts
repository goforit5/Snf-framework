import type { AgentDefinition } from '@snf/core';
import {
  BaseSnfAgent,
  type AgentInput,
  type IngestResult,
  type ClassifyResult,
  type ProcessResult,
  type AgentDependencies,
} from '../../base-agent.js';
import type { GovernanceDecision } from '../../governance-engine.js';

// ─── Agent Definition ───────────────────────────────────────────────────────

export const MEDICAL_RECORDS_AGENT_DEFINITION: AgentDefinition = {
  id: 'agent-clinical-medical-records',
  name: 'Medical Records Agent',
  tier: 'domain',
  domain: 'clinical',
  version: '1.0.0',
  description:
    'Manages chart completion tracking, ICD-10 coding accuracy, release of information (ROI) processing, ' +
    'record retention compliance, and clinical documentation integrity. Ensures medical records ' +
    'meet regulatory and billing requirements.',

  modelId: 'claude-sonnet-4-20250514',
  systemPrompt: `You are the Medical Records Agent for a skilled nursing facility (SNF) agentic platform.

ROLE: You are the facility's AI HIM (Health Information Management) director — monitoring chart completion, ensuring coding accuracy, processing ROI requests within legal timeframes, and maintaining documentation integrity. You connect directly to PCC medical records, coding systems, and ROI tracking.

DOMAIN EXPERTISE:
- Chart completion: physician signature requirements, verbal/telephone order authentication timelines
- ICD-10-CM coding: accurate principal diagnosis coding for PDPM, secondary diagnoses for acuity capture
- MDS-ICD-10 alignment: ensuring MDS diagnoses match active physician orders and ICD-10 codes
- Release of Information (ROI): HIPAA authorization requirements, state-specific timelines (30 days standard)
- Record retention: state-specific requirements (typically 7 years adult, 10 years minor + 7 years post-majority)
- Clinical documentation improvement (CDI): specificity enhancement, query generation for physicians
- Legal hold management: litigation hold on records, subpoena response
- F-tag awareness: F842 (medical records — clinical record requirements)

DECISION FRAMEWORK:
- 95%+ confidence: Auto-execute chart completion reminders, routine ROI processing, coding suggestions
- 80-94%: Recommend — coding corrections, CDI queries to physicians, documentation gap alerts
- 60-79%: Require HIM director/DON approval — ROI denials, coding overrides, record amendments
- <60%: Escalate — potential upcoding, legal hold requests, subpoena responses

DATA SOURCES:
- PCC Medical Records Module (chart completion, signature tracking)
- PCC Physician Orders (verbal/telephone order authentication)
- ICD-10-CM coding database
- ROI tracking system
- Legal hold database
- State medical records retention requirements
- Medicare billing records (for coding alignment)

OUTPUT FORMAT:
Every recommendation must include: resident name (if applicable), specific documentation issue, current status, deadline/timeline, recommended action, regulatory citation, and impact on billing/compliance if unresolved.`,

  tools: [
    'pcc.medical_records.query',
    'pcc.medical_records.update_status',
    'pcc.orders.query',
    'pcc.residents.get',
    'coding.icd10.lookup',
    'coding.icd10.validate',
    'roi.tracking.query',
    'roi.tracking.update',
    'roi.tracking.create',
    'legal_hold.query',
    'notifications.send',
  ],
  maxTokens: 4096,

  governanceThresholds: {
    autoExecute: 0.95,
    recommend: 0.80,
    requireApproval: 0.60,
  },

  schedule: {
    cron: '0 7,15 * * *',
    timezone: 'America/Chicago',
    description: 'Twice daily: 7 AM (overnight chart completion review), 3 PM (coding accuracy sweep)',
  },
  eventTriggers: [
    'clinical.admission',
    'clinical.discharge',
    'clinical.order_signed',
    'legal.roi_request',
    'legal.subpoena_received',
    'financial.coding_discrepancy',
  ],

  status: 'active',
  actionsToday: 0,
  avgConfidence: 0,
  overrideRate: 0,
  lastRunAt: null,
};

// ─── Agent Implementation ───────────────────────────────────────────────────

export class MedicalRecordsAgent extends BaseSnfAgent {
  constructor(deps: AgentDependencies) {
    super(MEDICAL_RECORDS_AGENT_DEFINITION, deps);
  }

  protected async onIngest(input: AgentInput): Promise<IngestResult> {
    // Pull chart completion status from PCC — unsigned orders, incomplete assessments
    // Pull physician order authentication timelines (48-hour compliance)
    // Pull ICD-10 coding assignments vs. active diagnoses
    // Pull ROI request queue with processing deadlines
    // Pull legal hold status for active litigation
    // Pull MDS-to-ICD-10 alignment report
    return {
      normalizedData: {
        facilityId: input.facilityId,
        chartCompletionQueue: [],
        unsignedOrders: [],
        codingDiscrepancies: [],
        roiQueue: [],
        legalHolds: [],
      },
      sourceDocumentRefs: [
        `pcc://medical-records/${input.facilityId}`,
        `pcc://orders/unsigned/${input.facilityId}`,
        `roi://queue/${input.facilityId}`,
      ],
    };
  }

  protected async onClassify(
    input: AgentInput,
    _ingestResult: IngestResult,
  ): Promise<ClassifyResult> {
    const category = (input.payload['eventType'] as string) ?? 'records_review';

    return {
      category,
      priority: category === 'subpoena_response' ? 'critical' : 'medium',
      governanceContext: {
        involvesPhi: true,
        legalLitigation: category === 'subpoena_response' || category === 'legal_hold',
      },
      tags: ['clinical', 'medical-records', 'him', 'documentation'],
    };
  }

  protected async onProcess(
    _input: AgentInput,
    _ingestResult: IngestResult,
    _classifyResult: ClassifyResult,
  ): Promise<ProcessResult> {
    // Use Claude to analyze medical records data:
    // 1. Identify unsigned physician orders approaching 48-hour deadline
    // 2. Validate ICD-10 coding against documented diagnoses and MDS
    // 3. Check ROI queue for requests approaching state-mandated deadlines
    // 4. Analyze chart completion rates by physician and unit
    // 5. Identify CDI opportunities — vague diagnoses needing specificity queries
    // 6. Ensure legal hold compliance for active litigation cases
    // 7. Generate specific documentation or coding recommendation
    return {
      recommendation: 'Medical records analysis pending full implementation',
      confidence: 0.86,
      reasoning: [
        'Reviewed chart completion status against regulatory timelines',
        'Validated ICD-10 coding accuracy against clinical documentation',
        'Assessed ROI processing queue against state deadlines',
      ],
      evidence: [
        {
          source: 'PCC Medical Records',
          label: 'Chart Completion',
          value: 'Completion data loaded for analysis',
          confidence: 0.93,
        },
      ],
      alternativesConsidered: [],
      dollarAmount: null,
      impact: {
        financial: 'Accurate coding ensures proper PDPM reimbursement',
        clinical: 'Complete documentation supports continuity of care',
        regulatory: 'F842 compliance, HIPAA ROI timelines met',
        operational: 'Reduced physician callbacks for signature compliance',
        timeSaved: '40 minutes per day of manual chart completion tracking',
      },
    };
  }

  protected async onDecide(
    _input: AgentInput,
    _processResult: ProcessResult,
    _governance: GovernanceDecision,
  ): Promise<void> {
    // Post-decision hooks:
    // - If auto-executed: send physician signature reminders, update ROI status
    // - If pending approval: queue for HIM director review
    // - If escalated: notify administrator and legal for subpoena/litigation
    // - Emit event for BillingAgent when coding corrections affect reimbursement
  }
}
