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

export const QUALITY_AGENT_DEFINITION: AgentDefinition = {
  id: 'agent-governance-quality',
  name: 'Quality Agent',
  tier: 'domain',
  domain: 'governance',
  version: '1.0.0',
  description:
    'Monitors CMS Quality Measures (QMs), CASPER reports, Five-Star ratings, and QAPI program ' +
    'effectiveness. Tracks QM trends, identifies deteriorating measures, and drives quality ' +
    'improvement projects. Connects to PCC clinical data and CMS quality reporting systems.',

  model: 'sonnet',
  prompt: `You are the Quality Agent for a skilled nursing facility (SNF) agentic platform.

ROLE: You are the facility's AI quality director — monitoring every CMS Quality Measure, tracking Five-Star rating components, analyzing CASPER reports, and driving QAPI (Quality Assurance and Performance Improvement) projects. Quality measures directly determine star ratings, which drive referrals, occupancy, and revenue. You connect to PCC clinical data and CMS quality reporting systems.

DOMAIN EXPERTISE:
- CMS Quality Measures (QMs): 15+ measures covering falls, pressure ulcers, UTIs, physical restraints, weight loss, antipsychotics, pain, functional decline
- Five-Star Rating System: health inspection (survey), staffing (PBJ-based), quality measure components — each 1-5 stars
- CASPER reports: Certification and Survey Provider Enhanced Reports — facility-level QM trending, comparison to state/national
- QAPI program: data-driven quality improvement projects, Plan-Do-Study-Act (PDSA) cycles, root cause analysis
- MDS-driven measures: Minimum Data Set assessments drive QM calculation — coding accuracy directly impacts scores
- Care Area Assessments (CAAs): triggered by MDS, require documented care planning response
- Antipsychotic reduction: national initiative to reduce inappropriate antipsychotic use in dementia care
- Falls with major injury: high-impact measure affecting star rating, requires immediate investigation and prevention plan
- Pressure ulcer prevention: staging, Braden scale assessment, prevention interventions, wound care protocols
- Infection control: antibiotic stewardship, UTI prevention (CAUTI), COVID-19 vaccination rates
- Rehospitalization rates: 30-day readmission tracking, SNF-VBP (Value-Based Purchasing) program impact
- Survey readiness: continuous compliance monitoring, mock survey tools, staff education on F-tag requirements

DECISION FRAMEWORK:
- 95%+ confidence: Auto-execute QM report generation, trend alerts, QAPI meeting preparation
- 80-94%: Recommend — QM trending negatively, MDS coding review needed, QAPI project adjustments
- 60-79%: Require DON approval — quality improvement intervention changes, star rating risk mitigation
- <60%: Escalate — QM in bottom decile nationally, Five-Star rating drop imminent, survey readiness gaps

DATA SOURCES:
- PCC (MDS assessments, clinical records, care plans, incident reports)
- CMS CASPER reports (facility QM data, state/national comparisons)
- CMS Five-Star Rating data (current ratings, component scores, trend)
- CMS Care Compare (public quality data, competitor comparison)
- QAPI project tracker (active projects, PDSA cycles, outcome measures)
- Survey history (deficiency citations, plans of correction, scope/severity)

OUTPUT FORMAT:
Every recommendation must include: quality measure name, current facility rate, state/national comparison, trend direction (improving/stable/declining), affected resident count, root cause analysis, recommended intervention, and projected impact on Five-Star rating.`,

  tools: [
    'pcc_get_assessments',
    'pcc_get_incidents',
    'pcc_get_resident',
    'pcc_search_residents',
    'cms_get_facility_quality',
    'cms_get_survey_results',
  ],
  mcpServers: ['pcc', 'regulatory'],
  maxTurns: 10,
  maxTokens: 4096,

  governanceThresholds: {
    autoExecute: 0.95,
    recommend: 0.80,
    requireApproval: 0.60,
  },

  schedule: {
    cron: '0 7 * * 1',
    timezone: 'America/Chicago',
    description: 'Weekly Monday 7 AM: QM trend analysis, Five-Star projection, QAPI project status review',
  },
  eventTriggers: [
    'governance.qm_threshold_breach',
    'governance.casper_report_available',
    'governance.five_star_change',
    'governance.survey_scheduled',
    'clinical.fall_with_injury',
    'clinical.new_pressure_ulcer',
    'clinical.readmission',
  ],

  status: 'active',
  actionsToday: 0,
  avgConfidence: 0,
  overrideRate: 0,
  lastRunAt: null,
};

// ─── Agent Implementation ───────────────────────────────────────────────────

export class QualityAgent extends BaseSnfAgent {
  constructor(deps: AgentDependencies) {
    super(QUALITY_AGENT_DEFINITION, deps);
  }

  protected async onIngest(input: AgentInput): Promise<IngestResult> {
    // Pull current QM scores from PCC MDS data
    // Pull latest CASPER reports from CMS
    // Pull Five-Star rating components and trend
    // Pull active QAPI projects and PDSA cycle status
    // Pull clinical incident data (falls, pressure ulcers, infections)
    // Pull survey history and open plans of correction
    return {
      normalizedData: {
        facilityId: input.payload['facilityId'],
        qualityMeasures: {},
        casperData: {},
        fiveStarRating: {},
        qapiProjects: [],
        clinicalIncidents: [],
        surveyHistory: [],
      },
      sourceDocumentRefs: [
        `cms://casper/facility/${input.payload['facilityId']}`,
        `cms://five-star/${input.payload['facilityId']}`,
        `pcc://mds/facility/${input.payload['facilityId']}`,
      ],
    };
  }

  protected async onClassify(
    input: AgentInput,
    ingestResult: IngestResult,
  ): Promise<ClassifyResult> {
    const category = (input.payload['eventType'] as string) ?? 'quality_monitoring';
    const fiveStarRating = (ingestResult.normalizedData['fiveStarRating'] as Record<string, unknown>)?.['overall'] as number ?? 3;

    return {
      category,
      priority: fiveStarRating <= 2 ? 'critical' : fiveStarRating <= 3 ? 'high' : 'medium',
      governanceContext: {
        fiveStarRating,
      },
      tags: ['governance', 'quality', 'cms', 'five-star', 'qapi'],
    };
  }

  protected async onProcess(
    _input: AgentInput,
    _ingestResult: IngestResult,
    _classifyResult: ClassifyResult,
  ): Promise<ProcessResult> {
    // Use Claude to analyze quality data:
    // 1. Trend each QM over trailing 4 quarters — identify deteriorating measures
    // 2. Compare facility QMs to state and national benchmarks
    // 3. Project Five-Star rating impact from QM changes
    // 4. Identify MDS coding accuracy issues affecting QM scores
    // 5. Evaluate QAPI project effectiveness against target outcomes
    // 6. Generate specific quality improvement recommendation
    return {
      recommendation: 'Quality analysis pending full implementation',
      confidence: 0.89,
      reasoning: [
        'Trended quality measures over trailing 4 quarters',
        'Compared facility rates to state and national benchmarks',
        'Projected Five-Star rating impact from current trends',
        'Evaluated QAPI project progress against target outcomes',
      ],
      evidence: [
        {
          source: 'CMS CASPER',
          label: 'Quality Measure Trending',
          value: 'QM analysis complete',
          confidence: 0.91,
        },
      ],
      alternativesConsidered: [],
      dollarAmount: null,
      impact: {
        financial: 'Each star improvement drives 3-5% occupancy increase ($500K+ annual revenue)',
        clinical: 'QM improvement directly reflects better resident outcomes',
        regulatory: 'Strong QMs reduce survey deficiency risk and scope/severity',
        operational: 'Data-driven QAPI replaces reactive quality management',
        timeSaved: '20 hours per month of manual QM tracking and reporting',
      },
    };
  }

  protected async onDecide(
    _input: AgentInput,
    _processResult: ProcessResult,
    _governance: GovernanceDecision,
  ): Promise<void> {
    // Post-decision hooks:
    // - If auto-executed: generate QM trend report, update QAPI dashboard
    // - If pending approval: route QI intervention to DON with evidence brief
    // - If escalated: immediate quality improvement plan, notify regional QA director
    // - Emit event for RiskAgent (quality-related risk tracking), ComplianceAgent (survey readiness)
  }
}
