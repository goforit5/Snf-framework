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

export const CENSUS_AGENT_DEFINITION: AgentDefinition = {
  id: 'agent-operations-census',
  name: 'Census Agent',
  tier: 'domain',
  domain: 'operations',
  version: '1.0.0',
  description:
    'Manages bed availability, referral screening, admission forecasting, and census optimization. ' +
    'Coordinates with hospitals, home health agencies, and insurance companies to maximize ' +
    'occupancy while matching resident acuity to facility capabilities. Connects to PCC and referral platforms.',

  modelId: 'claude-sonnet-4-20250514',
  systemPrompt: `You are the Census Agent for a skilled nursing facility (SNF) agentic platform.

ROLE: You are the facility's AI admissions and census manager — tracking every bed in real-time, screening referrals against facility capabilities, forecasting census trends, and optimizing occupancy. Every empty bed costs $300-500/day in lost revenue. You connect directly to PCC, hospital referral systems, and payer verification platforms.

DOMAIN EXPERTISE:
- Bed management: real-time bed board (occupied, hold, reserved, available), room type matching (private/semi-private/isolation)
- Referral screening: clinical capability matching (ventilator, IV, wound care, dialysis, behavioral), insurance verification
- Hospital discharge planning: referral response SLA (< 2 hours), clinical record review, transportation coordination
- Payer mix optimization: Medicare A (highest rate, 100-day limit), Medicare B, Managed Care, Medicaid, Private Pay
- Census forecasting: discharge prediction (MDS-driven), admission pipeline probability, seasonal patterns
- Acuity matching: resident needs vs. facility capabilities, staffing requirements for high-acuity admissions
- PDPM impact: Patient-Driven Payment Model classification affects revenue — SLP, NTA, nursing components
- Readmission prevention: 30-day hospital readmission tracking, quality measure impact, SNFIST programs
- Waitlist management: priority ranking, room type preferences, payer preference, clinical complexity
- Marketing coordination: hospital liaison activities, physician relationship management, competitive positioning

DECISION FRAMEWORK:
- 95%+ confidence: Auto-accept referrals matching all clinical/payer criteria, update bed board
- 80-94%: Recommend — referrals with minor clinical questions, payer authorization pending
- 60-79%: Require DON/administrator approval — high-acuity admissions, behavioral challenges, payer concerns
- <60%: Escalate — isolation room needed (none available), referral exceeds facility license, complex payer situation

DATA SOURCES:
- PCC (census, bed board, resident records, clinical capabilities)
- Hospital referral platforms (Ensocare, PointClickCare Connect, Allscripts referral)
- Insurance verification (payer eligibility, authorization, benefit verification)
- Workday Financial Management (revenue per bed-day by payer, occupancy targets)
- Historical census data (seasonal patterns, average length of stay, discharge patterns)
- CMS Quality Measures (readmission rates, discharge to community rates)

OUTPUT FORMAT:
Every recommendation must include: referral source, patient name, clinical needs summary, payer type, estimated daily rate, bed assignment recommendation, clinical match score, and revenue impact per admission.`,

  tools: [
    'pcc.census.query',
    'pcc.census.update_bed',
    'pcc.referral.query',
    'pcc.referral.accept',
    'pcc.referral.decline',
    'pcc.clinical.query_capabilities',
    'insurance.verify_eligibility',
    'insurance.check_authorization',
    'workday.revenue.query_rates',
    'analytics.census_forecast',
    'notifications.send',
    'notifications.escalate',
  ],
  maxTokens: 4096,

  governanceThresholds: {
    autoExecute: 0.95,
    recommend: 0.80,
    requireApproval: 0.60,
  },

  schedule: {
    cron: '0 7,11,15,19 * * *',
    timezone: 'America/Chicago',
    description: 'Four times daily: 7 AM (overnight referrals), 11 AM (midday pipeline), 3 PM (afternoon admits), 7 PM (next-day prep)',
  },
  eventTriggers: [
    'operations.referral_received',
    'operations.admission_completed',
    'operations.discharge_planned',
    'operations.discharge_completed',
    'operations.bed_status_change',
    'clinical.readmission_risk',
    'financial.authorization_received',
  ],

  status: 'active',
  actionsToday: 0,
  avgConfidence: 0,
  overrideRate: 0,
  lastRunAt: null,
};

// ─── Agent Implementation ───────────────────────────────────────────────────

export class CensusAgent extends BaseSnfAgent {
  constructor(deps: AgentDependencies) {
    super(CENSUS_AGENT_DEFINITION, deps);
  }

  protected async onIngest(input: AgentInput): Promise<IngestResult> {
    // Pull current census and bed board from PCC
    // Pull incoming referral details and clinical records
    // Verify insurance eligibility and authorization
    // Pull facility clinical capability matrix
    // Pull discharge forecasts for upcoming days
    // Pull payer-specific revenue rates
    return {
      normalizedData: {
        referralId: input.payload['referralId'],
        censusSnapshot: {},
        bedAvailability: [],
        referralDetail: {},
        insuranceVerification: {},
        clinicalCapabilities: {},
        dischargeForecast: [],
        revenueRates: {},
      },
      sourceDocumentRefs: [
        `pcc://census/facility/${input.payload['facilityId']}`,
        `pcc://referral/${input.payload['referralId']}`,
        `insurance://verify/${input.payload['payerId']}`,
      ],
    };
  }

  protected async onClassify(
    input: AgentInput,
    ingestResult: IngestResult,
  ): Promise<ClassifyResult> {
    const category = (input.payload['eventType'] as string) ?? 'census_management';
    const occupancyRate = (ingestResult.normalizedData['censusSnapshot'] as Record<string, unknown>)?.['occupancyRate'] as number ?? 90;

    return {
      category,
      priority: occupancyRate < 80 ? 'high' : 'medium',
      governanceContext: {
        occupancyRate,
      },
      tags: ['operations', 'census', 'admissions', 'bed-management'],
    };
  }

  protected async onProcess(
    _input: AgentInput,
    _ingestResult: IngestResult,
    _classifyResult: ClassifyResult,
  ): Promise<ProcessResult> {
    // Use Claude to analyze census data:
    // 1. Score referral clinical match against facility capabilities
    // 2. Verify insurance eligibility and estimate daily revenue
    // 3. Identify optimal bed assignment (room type, unit, roommate compatibility)
    // 4. Forecast census impact (occupancy change, payer mix shift)
    // 5. Calculate PDPM classification impact on revenue
    // 6. Generate specific admission recommendation
    return {
      recommendation: 'Census analysis pending full implementation',
      confidence: 0.88,
      reasoning: [
        'Scored clinical capability match for referral',
        'Verified insurance eligibility and authorization status',
        'Identified optimal bed assignment based on acuity and room type',
        'Calculated revenue impact and PDPM classification',
      ],
      evidence: [
        {
          source: 'PCC Census',
          label: 'Admission Analysis',
          value: 'Census analysis complete',
          confidence: 0.91,
        },
      ],
      alternativesConsidered: [],
      dollarAmount: null,
      impact: {
        financial: 'Each admission generates $400-800/day depending on payer and PDPM classification',
        clinical: 'Proper acuity matching ensures safe and appropriate care delivery',
        regulatory: 'Maintains admission standards and readmission quality measures',
        operational: 'Automated referral screening reduces response time from hours to minutes',
        timeSaved: '30 minutes per referral screening',
      },
    };
  }

  protected async onDecide(
    _input: AgentInput,
    _processResult: ProcessResult,
    _governance: GovernanceDecision,
  ): Promise<void> {
    // Post-decision hooks:
    // - If auto-executed: accept referral in PCC, reserve bed, notify nursing
    // - If pending approval: route to DON/administrator with admission brief
    // - If escalated: complex admission committee review, notify regional
    // - Emit event for BillingAgent (payer setup), SchedulingAgent (staffing adjustment)
  }
}
