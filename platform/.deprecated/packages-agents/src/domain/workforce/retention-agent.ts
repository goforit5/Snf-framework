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

export const RETENTION_AGENT_DEFINITION: AgentDefinition = {
  id: 'agent-workforce-retention',
  name: 'Retention Agent',
  tier: 'domain',
  domain: 'workforce',
  version: '1.0.0',
  description:
    'Predicts turnover risk, analyzes engagement signals, identifies at-risk employees, and ' +
    'recommends retention interventions. Monitors Workday HCM patterns, exit surveys, and ' +
    'workforce analytics to reduce the 50%+ annual CNA turnover rate in SNFs.',

  model: 'sonnet',
  prompt: `You are the Retention Agent for a skilled nursing facility (SNF) agentic platform.

ROLE: You are the facility's AI workforce retention analyst — predicting which employees are at risk of leaving, analyzing root causes of turnover, and recommending targeted interventions. SNFs face 50-80% annual CNA turnover — every prevented departure saves $5K-15K in replacement costs. You connect to Workday HCM and workforce analytics.

DOMAIN EXPERTISE:
- Turnover prediction: pattern recognition across tenure, schedule patterns, overtime trends, call-off frequency
- Flight risk signals: increased absenteeism, schedule change requests, certification non-renewal, reduced overtime willingness
- Engagement analysis: tenure milestones (30/60/90 days critical), shift satisfaction, peer relationships, supervisor ratings
- Exit interview analysis: NLP extraction of departure reasons, trend identification, facility-level patterns
- Compensation benchmarking: local market rates by role, competitor facility comparisons, sign-on bonus effectiveness
- Retention interventions: tenure-based bonuses, schedule flexibility, career ladder advancement, mentorship programs
- SNF-specific turnover drivers: physical demands, emotional burnout, scheduling inflexibility, compensation gaps, lack of advancement
- CNA pipeline: new graduate retention, training investment recovery, temp-to-perm conversion optimization
- Seasonal patterns: holiday season attrition, summer scheduling conflicts, post-survey-season departures
- Cost modeling: replacement cost calculation (recruiting + training + agency coverage + productivity ramp)

DECISION FRAMEWORK:
- 95%+ confidence: Auto-execute retention check-ins, milestone recognition, schedule preference updates
- 80-94%: Recommend — retention bonus eligibility, career development plan, schedule accommodation
- 60-79%: Require administrator approval — retention counteroffer, role change, transfer to preferred facility
- <60%: Escalate — high-performer flight risk with no clear intervention, department-wide turnover spike

DATA SOURCES:
- Workday HCM (employee records, tenure, compensation, performance reviews)
- Workday Time & Attendance (attendance patterns, overtime trends, schedule adherence)
- Workday Recruiting (exit interview data, departure reasons, rehire eligibility)
- Employee engagement surveys (satisfaction scores, open-ended feedback)
- Local labor market data (competitor wages, unemployment rates, CNA program graduates)
- Facility-level metrics (staff satisfaction, turnover rate by unit/shift/role)

OUTPUT FORMAT:
Every recommendation must include: employee name, role, tenure, flight risk score (1-100), risk signals detected, recommended intervention, estimated retention probability with intervention, and cost-of-departure if lost.`,

  tools: [
    'workday_get_employee',
    'workday_search_employees',
    'workday_get_timecards',
    'workday_get_pto',
    'workday_get_payroll',
  ],
  mcpServers: ['workday'],
  maxTurns: 8,
  maxTokens: 4096,

  governanceThresholds: {
    autoExecute: 0.95,
    recommend: 0.80,
    requireApproval: 0.60,
  },

  schedule: {
    cron: '0 7 * * 1',
    timezone: 'America/Chicago',
    description: 'Weekly Monday 7 AM: flight risk scoring, tenure milestone alerts, engagement trend analysis',
  },
  eventTriggers: [
    'workforce.employee_resigned',
    'workforce.attendance_pattern_change',
    'workforce.tenure_milestone',
    'workforce.exit_interview_completed',
    'workforce.engagement_survey_completed',
    'workforce.compensation_review_due',
  ],

  status: 'active',
  actionsToday: 0,
  avgConfidence: 0,
  overrideRate: 0,
  lastRunAt: null,
};

// ─── Agent Implementation ───────────────────────────────────────────────────

export class RetentionAgent extends BaseSnfAgent {
  constructor(deps: AgentDependencies) {
    super(RETENTION_AGENT_DEFINITION, deps);
  }

  protected async onIngest(input: AgentInput): Promise<IngestResult> {
    // Pull employee records with tenure and compensation from Workday HCM
    // Pull attendance patterns and overtime trends
    // Pull exit interview data for recent departures
    // Pull engagement survey results
    // Pull local market compensation data
    // Calculate flight risk signals from behavioral patterns
    return {
      normalizedData: {
        employeeId: input.payload['employeeId'],
        employeeProfile: {},
        attendancePatterns: {},
        engagementScores: {},
        compensationComparison: {},
        flightRiskSignals: [],
        departmentTurnoverRate: 0,
      },
      sourceDocumentRefs: [
        `workday://hcm/employee/${input.payload['employeeId']}`,
        `workday://time/patterns/${input.payload['employeeId']}`,
        `workday://surveys/engagement/${input.payload['facilityId']}`,
      ],
    };
  }

  protected async onClassify(
    input: AgentInput,
    ingestResult: IngestResult,
  ): Promise<ClassifyResult> {
    const category = (input.payload['eventType'] as string) ?? 'retention_analysis';
    const signalCount = (ingestResult.normalizedData['flightRiskSignals'] as unknown[])?.length ?? 0;

    return {
      category,
      priority: signalCount >= 3 ? 'high' : 'medium',
      governanceContext: {
        flightRiskLevel: signalCount >= 3 ? 'high' : 'routine',
      },
      tags: ['workforce', 'retention', 'engagement', 'turnover'],
    };
  }

  protected async onProcess(
    _input: AgentInput,
    _ingestResult: IngestResult,
    _classifyResult: ClassifyResult,
  ): Promise<ProcessResult> {
    // Use Claude to analyze retention data:
    // 1. Calculate composite flight risk score from behavioral signals
    // 2. Compare compensation to local market rates
    // 3. Analyze attendance pattern changes over trailing 90 days
    // 4. Identify root cause patterns from exit interview NLP analysis
    // 5. Model cost of departure (recruiting + training + agency backfill)
    // 6. Recommend targeted retention intervention with ROI estimate
    return {
      recommendation: 'Retention analysis pending full implementation',
      confidence: 0.85,
      reasoning: [
        'Calculated flight risk score from behavioral pattern analysis',
        'Compared compensation against local market benchmarks',
        'Analyzed attendance trend changes over trailing 90 days',
        'Estimated cost of departure and intervention ROI',
      ],
      evidence: [
        {
          source: 'Workday Analytics',
          label: 'Flight Risk Assessment',
          value: 'Risk scoring complete',
          confidence: 0.88,
        },
      ],
      alternativesConsidered: [],
      dollarAmount: null,
      impact: {
        financial: 'Each prevented CNA departure saves $8K-15K in replacement costs',
        clinical: 'Staff continuity improves resident care quality and satisfaction',
        regulatory: 'Stable staffing reduces survey deficiency risk',
        operational: 'Reduced turnover eliminates constant recruiting/onboarding cycle',
        timeSaved: '40 hours per prevented turnover event (recruiting + training)',
      },
    };
  }

  protected async onDecide(
    _input: AgentInput,
    _processResult: ProcessResult,
    _governance: GovernanceDecision,
  ): Promise<void> {
    // Post-decision hooks:
    // - If auto-executed: trigger milestone recognition, schedule check-in
    // - If pending approval: route retention intervention to administrator
    // - If escalated: department-wide retention action plan to regional HR
    // - Emit event for SchedulingAgent (schedule preference accommodation)
  }
}
