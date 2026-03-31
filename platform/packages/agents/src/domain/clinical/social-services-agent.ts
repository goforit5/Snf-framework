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

export const SOCIAL_SERVICES_AGENT_DEFINITION: AgentDefinition = {
  id: 'agent-clinical-social-services',
  name: 'Social Services Agent',
  tier: 'domain',
  domain: 'clinical',
  version: '1.0.0',
  description:
    'Manages discharge planning, family coordination, psychosocial assessments, community resource referrals, ' +
    'advance directive documentation, and resident rights compliance. Ensures smooth transitions ' +
    'of care and supports resident/family communication per F-tags F655/F656/F657/F660.',

  modelId: 'claude-sonnet-4-20250514',
  systemPrompt: `You are the Social Services Agent for a skilled nursing facility (SNF) agentic platform.

ROLE: You are the facility's AI social services director — coordinating discharge planning, managing family communications, tracking psychosocial needs, and ensuring resident rights compliance. You connect directly to PCC social services records, hospital systems for transitions of care, and community resource databases.

DOMAIN EXPERTISE:
- Discharge planning: disposition assessment (home, ALF, LTACH, hospice), home health referrals, DME coordination
- Transitions of care: hospital readmission prevention, INTERACT transfer documentation
- Psychosocial assessments: MDS Section F (preferences for daily routine), PHQ-9 (depression screening)
- Advance directives: POLST/MOLST documentation, DNR status, healthcare proxy coordination
- Resident rights: grievance tracking, room change notifications, informed consent documentation
- Family communication: family meeting scheduling, care conference documentation, HIPAA-compliant updates
- Community resources: Medicaid waiver programs, Area Agency on Aging, transportation, adult day programs
- Guardianship and conservatorship tracking
- F-tag awareness: F655 (baseline care plan), F656 (comprehensive care plan), F657 (care plan revision), F660 (discharge planning)

DECISION FRAMEWORK:
- 95%+ confidence: Auto-execute routine discharge timeline updates, family meeting reminders, resource referral packets
- 80-94%: Recommend — discharge disposition changes, new community resource referrals
- 60-79%: Require social worker/DON approval — discharge date changes, Medicaid application initiation
- <60%: Escalate — APS/ombudsman report, involuntary discharge proceedings, guardianship concerns

DATA SOURCES:
- PCC Social Services Module (assessments, discharge plans, advance directives)
- PCC MDS Section F (preferences), Section Q (discharge planning)
- Hospital ADT feeds (transitions of care)
- Community resource database
- Grievance tracking system
- Family communication log (M365 email/Teams integration)
- Court records for guardianship/conservatorship

OUTPUT FORMAT:
Every recommendation must include: resident name, room number, current discharge disposition, specific finding, recommended action with timeline, family/guardian notification status, and community resource referrals if applicable.`,

  tools: [
    'pcc.social_services.query',
    'pcc.social_services.update',
    'pcc.assessments.query',
    'pcc.residents.get',
    'pcc.mds.section_q.query',
    'hospital.adt.query',
    'community_resources.search',
    'community_resources.refer',
    'grievance.tracking.query',
    'grievance.tracking.create',
    'm365.calendar.schedule',
    'm365.email.send',
    'notifications.send',
  ],
  maxTokens: 4096,

  governanceThresholds: {
    autoExecute: 0.95,
    recommend: 0.80,
    requireApproval: 0.60,
  },

  schedule: {
    cron: '0 8,14 * * *',
    timezone: 'America/Chicago',
    description: 'Twice daily: 8 AM (discharge planning review), 2 PM (family communication follow-ups)',
  },
  eventTriggers: [
    'clinical.admission',
    'clinical.discharge_planning',
    'clinical.change_of_condition',
    'clinical.assessment_complete',
    'operations.grievance_filed',
    'operations.family_request',
  ],

  status: 'active',
  actionsToday: 0,
  avgConfidence: 0,
  overrideRate: 0,
  lastRunAt: null,
};

// ─── Agent Implementation ───────────────────────────────────────────────────

export class SocialServicesAgent extends BaseSnfAgent {
  constructor(deps: AgentDependencies) {
    super(SOCIAL_SERVICES_AGENT_DEFINITION, deps);
  }

  protected async onIngest(input: AgentInput): Promise<IngestResult> {
    // Pull social services records from PCC — psychosocial assessments, discharge plans
    // Pull MDS Section Q (discharge planning) responses
    // Pull advance directive documentation status
    // Pull grievance tracking records
    // Pull family communication log from M365
    // Pull hospital ADT feed for transition-of-care events
    // Pull community resource referral history
    return {
      normalizedData: {
        residentId: input.payload['residentId'],
        dischargePlan: {},
        psychosocialAssessment: {},
        advanceDirectives: {},
        grievances: [],
        familyCommunication: [],
        communityReferrals: [],
      },
      sourceDocumentRefs: [
        `pcc://social-services/${input.facilityId}/${input.payload['residentId']}`,
        `pcc://mds/section-q/${input.facilityId}/${input.payload['residentId']}`,
        `m365://communications/${input.facilityId}`,
      ],
    };
  }

  protected async onClassify(
    input: AgentInput,
    _ingestResult: IngestResult,
  ): Promise<ClassifyResult> {
    const category = (input.payload['eventType'] as string) ?? 'social_services_review';

    return {
      category,
      priority: category === 'aps_report' ? 'critical' : 'medium',
      governanceContext: {
        involvesPhi: true,
        safetySentinel: category === 'aps_report',
      },
      tags: ['clinical', 'social-services', 'discharge-planning'],
    };
  }

  protected async onProcess(
    _input: AgentInput,
    _ingestResult: IngestResult,
    _classifyResult: ClassifyResult,
  ): Promise<ProcessResult> {
    // Use Claude to analyze social services data:
    // 1. Evaluate discharge readiness — clinical stability, support system, home environment
    // 2. Identify residents expressing desire to return home (MDS Section Q)
    // 3. Track overdue family meetings and care conferences
    // 4. Review advance directive completeness — POLST, DNR, healthcare proxy
    // 5. Analyze grievance trends by category and resolution time
    // 6. Match resident needs to community resources (transportation, day programs)
    // 7. Generate specific discharge or social services recommendation
    return {
      recommendation: 'Social services analysis pending full implementation',
      confidence: 0.83,
      reasoning: [
        'Evaluated discharge readiness against clinical and social criteria',
        'Reviewed advance directive documentation completeness',
        'Assessed family communication and care conference compliance',
      ],
      evidence: [
        {
          source: 'PCC Social Services',
          label: 'Discharge Plan Status',
          value: 'Plan data loaded for analysis',
          confidence: 0.90,
        },
      ],
      alternativesConsidered: [],
      dollarAmount: null,
      impact: {
        financial: 'Timely discharge planning prevents unnecessary bed-day costs',
        clinical: 'Smooth transitions of care prevent hospital readmissions',
        regulatory: 'F655/F656/F660 compliance maintained',
        operational: 'Proactive discharge planning improves bed availability',
        timeSaved: '35 minutes per discharge case coordination',
      },
    };
  }

  protected async onDecide(
    _input: AgentInput,
    _processResult: ProcessResult,
    _governance: GovernanceDecision,
  ): Promise<void> {
    // Post-decision hooks:
    // - If auto-executed: send family meeting reminders, update discharge timeline
    // - If pending approval: queue for social worker/DON review
    // - If escalated: notify administrator and legal for complex situations
    // - Emit event for CensusAgent when discharge date confirmed
  }
}
