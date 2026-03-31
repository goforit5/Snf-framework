import Anthropic from '@anthropic-ai/sdk';
import type { AgentDefinition, DecisionPriority } from '@snf/core';
import { GovernanceLevel } from '@snf/core';
import {
  BaseSnfAgent,
  type AgentInput,
  type IngestResult,
  type ClassifyResult,
  type ProcessResult,
  type AgentDependencies,
} from '../../base-agent.js';
import type { GovernanceContext, GovernanceDecision } from '../../governance-engine.js';
import {
  PHARMACY_SYSTEM_PROMPT,
  getTaskPrompt,
  formatPccEvidence,
  formatLabEvidence,
  formatRegulatoryEvidence,
  type PharmacyTaskType,
} from './pharmacy-prompts.js';
import { PHARMACY_TOOLS, PCC_TOOLS, TOOL_NAMES } from './pharmacy-tools.js';
import type {
  DrugInteractionResult,
  FormularyResult,
  RenalDosingResult,
  BeersResult,
  PsychotropicAssessmentResult,
} from './pharmacy-tools.js';

// ─── PharmacyAgent Definition ───────────────────────────────────────────────

/**
 * Build the PharmacyAgent definition. This is the AgentDefinition record
 * registered with the AgentRegistry. Separating it from the class allows
 * definition-level configuration without instantiating the agent.
 */
export function createPharmacyAgentDefinition(
  overrides?: Partial<AgentDefinition>,
): AgentDefinition {
  return {
    id: 'pharmacy-agent',
    name: 'PharmacyAgent',
    tier: 'domain',
    domain: 'clinical',
    version: '1.0.0',
    description:
      'Expert clinical pharmacist agent handling medication reconciliation, drug interaction ' +
      'checking, formulary compliance, controlled substance monitoring, and psychotropic reviews. ' +
      'CMS F-tag aware (F756, F757, F758). Integrates with PCC for medication data, orders, ' +
      'labs, and clinical assessments.',

    // Claude config
    modelId: 'claude-sonnet-4-20250514',
    systemPrompt: PHARMACY_SYSTEM_PROMPT,
    tools: [
      // PCC connector tools (platform-level)
      PCC_TOOLS.GET_MEDICATIONS,
      PCC_TOOLS.GET_ORDERS,
      PCC_TOOLS.GET_ASSESSMENTS,
      PCC_TOOLS.GET_LAB_RESULTS,
      PCC_TOOLS.GET_RESIDENT,
      PCC_TOOLS.GET_ALLERGIES,
      PCC_TOOLS.GET_DIAGNOSES,
      PCC_TOOLS.GET_DOCUMENTS,
      PCC_TOOLS.GET_CENSUS,
      PCC_TOOLS.GET_BEHAVIORAL_MONITORING,
      PCC_TOOLS.GET_GDR_HISTORY,
      PCC_TOOLS.GET_PRN_UTILIZATION,
      // Pharmacy-specific analytical tools
      TOOL_NAMES.CHECK_DRUG_INTERACTIONS,
      TOOL_NAMES.VERIFY_FORMULARY_STATUS,
      TOOL_NAMES.CALCULATE_RENAL_DOSING,
      TOOL_NAMES.CHECK_BEERS_CRITERIA,
      TOOL_NAMES.ASSESS_PSYCHOTROPIC_NECESSITY,
    ],
    maxTokens: 4096,

    // Governance — pharmacy uses conservative thresholds given clinical safety implications
    governanceThresholds: {
      autoExecute: 0.95,    // Only auto-execute when evidence is unambiguous
      recommend: 0.80,      // Recommend with timeout for strong but not certain findings
      requireApproval: 0.60, // Require pharmacist approval below 80%
    },

    // Scheduling — psychotropic review is quarterly; others are event-driven
    schedule: {
      cron: '0 5 1 1,4,7,10 *',
      timezone: 'America/Los_Angeles',
      description: 'Quarterly psychotropic review — 1st day of Jan/Apr/Jul/Oct at 5:00 AM PT',
    },
    eventTriggers: [
      'admission.created',
      'medication.order.created',
      'medication.order.changed',
      'medication.order.renewed',
      'lab.result.received',
    ],

    // Status
    status: 'active',

    // Metrics (initialized — runtime updates these)
    actionsToday: 0,
    avgConfidence: 0,
    overrideRate: 0,
    lastRunAt: null,

    ...overrides,
  };
}

// ─── Task Definition ID to PharmacyTaskType Mapping ─────────────────────────

const TASK_TYPE_MAP: Record<string, PharmacyTaskType> = {
  'medication-reconciliation': 'medication_reconciliation',
  'drug-interaction-check': 'drug_interaction',
  'psychotropic-review': 'psychotropic_review',
  'formulary-compliance': 'formulary_compliance',
  'controlled-substance-monitoring': 'controlled_substance',
};

// ─── PharmacyAgent ──────────────────────────────────────────────────────────

/**
 * PharmacyAgent — the first fully implemented domain agent.
 *
 * Extends BaseSnfAgent and implements the four abstract methods:
 *   onIngest   -> Pull medication data from PCC connector
 *   onClassify -> Determine task type, priority, governance context
 *   onProcess  -> Run clinical analysis via Claude with pharmacy tools
 *   onDecide   -> Post-decision hook for domain-specific side effects
 *
 * This agent is THE exemplar for all 25 other domain agents. It demonstrates:
 * - How to structure data ingestion from PCC
 * - How to classify tasks and set governance context
 * - How to use Claude tool_use with domain-specific tools
 * - How to build evidence arrays from tool results
 * - How to handle governance decisions and post-decision actions
 */
export class PharmacyAgent extends BaseSnfAgent {
  constructor(deps: AgentDependencies, definitionOverrides?: Partial<AgentDefinition>) {
    super(createPharmacyAgentDefinition(definitionOverrides), deps);
  }

  // ─── onIngest ───────────────────────────────────────────────────────────

  /**
   * Pull medication data from PCC based on the task type.
   *
   * For medication reconciliation: active meds + transfer summary + allergies
   * For drug interaction: new order + active meds + labs + diagnoses + allergies
   * For psychotropic review: census + psychotropic orders + GDR history + behavioral monitoring + PRN data
   * For formulary: medication order details
   * For controlled substances: controlled substance orders + PDMP data
   */
  protected async onIngest(input: AgentInput): Promise<IngestResult> {
    const taskType = this.resolveTaskType(input);
    const payload = input.payload;
    const sourceRefs: string[] = [];

    // Build normalized data based on task type. In production, each of these
    // calls goes through the PCC connector (HTTP -> PCC API). Here we structure
    // the payload so downstream steps have a consistent shape.
    const normalizedData: Record<string, unknown> = {
      taskType,
      facilityId: input.facilityId,
    };

    switch (taskType) {
      case 'medication_reconciliation': {
        normalizedData.residentId = payload.residentId;
        normalizedData.activeMedications = payload.activeMedications ?? [];
        normalizedData.transferSummary = payload.transferSummary ?? null;
        normalizedData.allergies = payload.allergies ?? [];
        sourceRefs.push(
          `PCC:medications:${payload.residentId}`,
          `PCC:documents:transfer_summary:${payload.residentId}`,
          `PCC:allergies:${payload.residentId}`,
        );
        break;
      }

      case 'drug_interaction': {
        normalizedData.residentId = payload.residentId;
        normalizedData.newOrder = payload.newOrder ?? null;
        normalizedData.activeMedications = payload.activeMedications ?? [];
        normalizedData.allergies = payload.allergies ?? [];
        normalizedData.diagnoses = payload.diagnoses ?? [];
        normalizedData.labResults = payload.labResults ?? {};
        sourceRefs.push(
          `PCC:orders:${payload.orderId}`,
          `PCC:medications:${payload.residentId}`,
          `PCC:allergies:${payload.residentId}`,
          `PCC:diagnoses:${payload.residentId}`,
          `PCC:labs:${payload.residentId}`,
        );
        break;
      }

      case 'psychotropic_review': {
        normalizedData.census = payload.census ?? [];
        normalizedData.psychotropicOrders = payload.psychotropicOrders ?? [];
        normalizedData.gdrHistory = payload.gdrHistory ?? [];
        normalizedData.behavioralMonitoring = payload.behavioralMonitoring ?? [];
        normalizedData.prnUtilization = payload.prnUtilization ?? [];
        sourceRefs.push(
          `PCC:census:${input.facilityId}`,
          `PCC:medications:psychotropic:${input.facilityId}`,
          `PCC:clinical:gdr_history:${input.facilityId}`,
          `PCC:clinical:behavioral_monitoring:${input.facilityId}`,
          `PCC:medications:prn_utilization:${input.facilityId}`,
        );
        break;
      }

      case 'formulary_compliance': {
        normalizedData.residentId = payload.residentId;
        normalizedData.orderedMedication = payload.orderedMedication ?? null;
        normalizedData.facilityFormulary = payload.facilityFormulary ?? [];
        sourceRefs.push(
          `PCC:orders:${payload.orderId}`,
          `FORMULARY:${input.facilityId}`,
        );
        break;
      }

      case 'controlled_substance': {
        normalizedData.residentId = payload.residentId;
        normalizedData.controlledSubstanceOrders = payload.controlledSubstanceOrders ?? [];
        normalizedData.activeMedications = payload.activeMedications ?? [];
        normalizedData.prescriberInfo = payload.prescriberInfo ?? null;
        normalizedData.pdmpData = payload.pdmpData ?? null;
        sourceRefs.push(
          `PCC:medications:controlled:${payload.residentId}`,
          `PDMP:${payload.residentId}`,
        );
        break;
      }

      default:
        throw new Error(`Unknown pharmacy task type: ${taskType}`);
    }

    return {
      normalizedData,
      sourceDocumentRefs: sourceRefs,
    };
  }

  // ─── onClassify ─────────────────────────────────────────────────────────

  /**
   * Determine task category, priority, and governance context.
   *
   * Priority is driven by clinical urgency:
   * - critical: allergy conflict, contraindicated interaction, missing diagnosis justification
   * - high: major DDI, high-risk med reconciliation, overdue GDR
   * - medium: moderate interactions, formulary non-compliance, standard reconciliation
   * - low: minor interactions, compliant psychotropic review, routine formulary check
   */
  protected async onClassify(
    input: AgentInput,
    ingestResult: IngestResult,
  ): Promise<ClassifyResult> {
    const taskType = ingestResult.normalizedData.taskType as PharmacyTaskType;
    const data = ingestResult.normalizedData;

    // Determine priority based on task type and data signals
    const priority = this.assessPriority(taskType, data);

    // Build governance context — pharmacy tasks always involve PHI
    const governanceContext: GovernanceContext = {
      involvesPhi: true,
      safetySentinel: priority === 'critical',
      firstEncounter: false,
    };

    // Apply task-specific governance signals
    if (taskType === 'controlled_substance') {
      governanceContext.regulatoryFiling = true; // DEA/PDMP reporting implications
    }

    // Build classification tags
    const tags = this.buildClassificationTags(taskType, data);

    return {
      category: taskType,
      priority,
      governanceContext,
      tags,
    };
  }

  // ─── onProcess ──────────────────────────────────────────────────────────

  /**
   * Run clinical analysis via Claude with pharmacy-specific tools.
   *
   * This is the core analytical step. Claude receives:
   * 1. The pharmacy system prompt (expert pharmacist persona)
   * 2. A task-specific prompt (e.g., medication reconciliation analysis template)
   * 3. The ingested/normalized data from PCC
   * 4. Access to pharmacy tools (interaction checking, formulary, Beers, etc.)
   *
   * Claude uses tool_use to call analytical functions, then synthesizes findings
   * into a structured recommendation with confidence score and evidence.
   */
  protected async onProcess(
    input: AgentInput,
    ingestResult: IngestResult,
    classifyResult: ClassifyResult,
  ): Promise<ProcessResult> {
    const taskType = classifyResult.category as PharmacyTaskType;
    const taskPrompt = getTaskPrompt(taskType);

    // Build the analysis request message
    const analysisMessage = this.buildAnalysisMessage(taskType, ingestResult.normalizedData);

    // Send to Claude with pharmacy tools
    const messages: Anthropic.MessageParam[] = [
      {
        role: 'user',
        content: `${taskPrompt}\n\n---\n\nDATA FOR ANALYSIS:\n${analysisMessage}`,
      },
    ];

    // Agentic loop — Claude may call multiple tools before providing final analysis
    let response = await this.sendMessage(messages, { tools: PHARMACY_TOOLS });
    const toolResults: Array<{ toolName: string; result: Record<string, unknown> }> = [];

    // Process tool_use responses in a loop until Claude provides a final text response
    while (response.stop_reason === 'tool_use') {
      const assistantContent = response.content;
      messages.push({ role: 'assistant', content: assistantContent });

      // Process each tool call
      const toolResultBlocks: Anthropic.ToolResultBlockParam[] = [];
      for (const block of assistantContent) {
        if (block.type === 'tool_use') {
          const toolResult = await this.executePharmacyTool(
            block.name,
            block.input as Record<string, unknown>,
            ingestResult.normalizedData,
          );
          toolResults.push({ toolName: block.name, result: toolResult });

          toolResultBlocks.push({
            type: 'tool_result',
            tool_use_id: block.id,
            content: JSON.stringify(toolResult),
          });
        }
      }

      messages.push({ role: 'user', content: toolResultBlocks });
      response = await this.sendMessage(messages, { tools: PHARMACY_TOOLS });
    }

    // Extract the final text analysis from Claude's response
    const analysisText = response.content
      .filter((block): block is Anthropic.TextBlock => block.type === 'text')
      .map((block) => block.text)
      .join('\n');

    // Parse structured output from Claude's response
    const parsedAnalysis = this.parseAnalysisResponse(analysisText, taskType);

    // Build evidence from tool results and PCC data
    const evidence = this.buildEvidence(
      taskType,
      ingestResult,
      toolResults,
      parsedAnalysis,
    );

    // Calculate confidence from parsed analysis and tool results
    const confidence = this.calculateConfidence(taskType, parsedAnalysis, toolResults);

    // Build impact assessment
    const impact = this.assessImpact(taskType, parsedAnalysis, ingestResult.normalizedData);

    // Build reasoning chain
    const reasoning = this.buildReasoning(taskType, parsedAnalysis, toolResults);

    // Build alternatives considered
    const alternativesConsidered = this.buildAlternatives(taskType, parsedAnalysis);

    return {
      recommendation: parsedAnalysis.recommendation as string ?? analysisText,
      confidence,
      reasoning,
      evidence,
      alternativesConsidered,
      dollarAmount: parsedAnalysis.cost_impact as number ?? null,
      impact,
    };
  }

  // ─── onDecide ───────────────────────────────────────────────────────────

  /**
   * Post-decision hook. Called after governance evaluation.
   *
   * For PharmacyAgent, this handles domain-specific side effects:
   * - For contraindicated interactions at ESCALATE_ONLY level: publish urgent alert event
   * - For auto-executed formulary interchanges: log the therapeutic substitution
   * - For psychotropic reviews: update facility compliance tracking
   */
  protected async onDecide(
    input: AgentInput,
    processResult: ProcessResult,
    governance: GovernanceDecision,
  ): Promise<void> {
    // Publish domain-specific events for cross-agent coordination
    if (governance.level === GovernanceLevel.ESCALATE_ONLY) {
      // Safety escalation — notify infection control agent, DON dashboard, and quality agent
      await this.deps.eventBus.publish({
        id: crypto.randomUUID(),
        traceId: input.traceId,
        sourceAgentId: this.definition.id,
        eventType: 'clinical.medication_interaction',
        domain: 'clinical',
        facilityId: input.facilityId,
        timestamp: new Date().toISOString(),
        payload: {
          severity: 'critical',
          recommendation: processResult.recommendation,
          confidence: processResult.confidence,
          governanceLevel: governance.level,
          requiresImmediateAction: true,
        },
        severity: 'critical',
        subscriberAgentIds: [],
      });
    }

    // Log the governance decision for pharmacy audit trail
    await this.deps.auditLogger.logGovernanceDecision(
      governance,
      this.definition.id,
      input.traceId,
    );
  }

  // ─── Private Helpers ──────────────────────────────────────────────────────

  /**
   * Resolve the task type from the input's taskDefinitionId.
   */
  private resolveTaskType(input: AgentInput): PharmacyTaskType {
    const taskType = TASK_TYPE_MAP[input.taskDefinitionId];
    if (!taskType) {
      // Fall back to payload hint
      const payloadHint = input.payload.taskType as string | undefined;
      if (payloadHint && Object.values(TASK_TYPE_MAP).includes(payloadHint as PharmacyTaskType)) {
        return payloadHint as PharmacyTaskType;
      }
      throw new Error(
        `PharmacyAgent cannot handle task definition: ${input.taskDefinitionId}. ` +
        `Supported: ${Object.keys(TASK_TYPE_MAP).join(', ')}`,
      );
    }
    return taskType;
  }

  /**
   * Assess clinical priority based on task type and data signals.
   */
  private assessPriority(
    taskType: PharmacyTaskType,
    data: Record<string, unknown>,
  ): DecisionPriority {
    switch (taskType) {
      case 'drug_interaction': {
        // New medication orders with existing polypharmacy are higher priority
        const activeMeds = data.activeMedications as unknown[];
        if (activeMeds && activeMeds.length > 10) return 'high';
        return 'medium';
      }

      case 'medication_reconciliation': {
        // New admissions — always at least medium priority per F756 timeline requirements
        const allergies = data.allergies as unknown[];
        if (allergies && allergies.length > 5) return 'high';
        return 'medium';
      }

      case 'psychotropic_review':
        // Quarterly reviews are scheduled — start at medium, escalate per findings
        return 'medium';

      case 'formulary_compliance':
        return 'low';

      case 'controlled_substance':
        // Controlled substances always warrant higher scrutiny
        return 'high';

      default:
        return 'medium';
    }
  }

  /**
   * Build classification tags for the task.
   */
  private buildClassificationTags(
    taskType: PharmacyTaskType,
    data: Record<string, unknown>,
  ): string[] {
    const tags: string[] = ['pharmacy', taskType];

    switch (taskType) {
      case 'medication_reconciliation':
        tags.push('f756', 'admission', 'medication-safety');
        break;
      case 'drug_interaction':
        tags.push('f756', 'medication-safety', 'real-time');
        break;
      case 'psychotropic_review':
        tags.push('f757', 'f758', 'psychotropic', 'gdr', 'quarterly-review', 'survey-readiness');
        break;
      case 'formulary_compliance':
        tags.push('formulary', 'cost-management');
        break;
      case 'controlled_substance':
        tags.push('controlled-substance', 'dea', 'pdmp', 'regulatory');
        break;
    }

    // Add data-driven tags
    if (data.allergies && (data.allergies as unknown[]).length > 0) {
      tags.push('allergy-risk');
    }

    return tags;
  }

  /**
   * Build the analysis message content from normalized data for Claude.
   */
  private buildAnalysisMessage(
    _taskType: PharmacyTaskType,
    data: Record<string, unknown>,
  ): string {
    // Serialize the relevant data fields as structured JSON for Claude to analyze.
    // Exclude internal fields that are already in the prompt context.
    const analysisData = { ...data };
    delete analysisData.taskType;

    return JSON.stringify(analysisData, null, 2);
  }

  /**
   * Execute a pharmacy-specific analytical tool.
   *
   * In production, tools like check_drug_interactions dispatch to real clinical
   * decision support systems (Lexicomp, Micromedex, Medi-Span). Here we return
   * the input enriched with context so Claude can perform the analysis using
   * its clinical knowledge.
   */
  private async executePharmacyTool(
    toolName: string,
    toolInput: Record<string, unknown>,
    contextData: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    switch (toolName) {
      case TOOL_NAMES.CHECK_DRUG_INTERACTIONS:
        return {
          tool: toolName,
          status: 'executed',
          input: toolInput,
          context: {
            active_medication_count: (contextData.activeMedications as unknown[])?.length ?? 0,
            allergy_count: (contextData.allergies as unknown[])?.length ?? 0,
            diagnosis_count: (contextData.diagnoses as unknown[])?.length ?? 0,
          },
          note: 'Production: dispatches to Lexicomp/Micromedex interaction database',
        };

      case TOOL_NAMES.VERIFY_FORMULARY_STATUS:
        return {
          tool: toolName,
          status: 'executed',
          input: toolInput,
          facility_id: contextData.facilityId,
          note: 'Production: queries facility-specific formulary database',
        };

      case TOOL_NAMES.CALCULATE_RENAL_DOSING:
        return {
          tool: toolName,
          status: 'executed',
          input: toolInput,
          lab_values: contextData.labResults ?? {},
          note: 'Production: calculates CrCl via Cockcroft-Gault, queries renal dosing tables',
        };

      case TOOL_NAMES.CHECK_BEERS_CRITERIA:
        return {
          tool: toolName,
          status: 'executed',
          input: toolInput,
          note: 'Production: screens against AGS Beers Criteria 2023 database',
        };

      case TOOL_NAMES.ASSESS_PSYCHOTROPIC_NECESSITY:
        return {
          tool: toolName,
          status: 'executed',
          input: toolInput,
          gdr_history: contextData.gdrHistory ?? [],
          behavioral_monitoring: contextData.behavioralMonitoring ?? [],
          prn_utilization: contextData.prnUtilization ?? [],
          note: 'Production: evaluates against CMS F758 GDR criteria',
        };

      default:
        return {
          tool: toolName,
          status: 'unknown_tool',
          error: `PharmacyAgent does not handle tool: ${toolName}`,
        };
    }
  }

  /**
   * Parse Claude's analysis response text into structured data.
   * Claude is instructed to output JSON; this extracts and validates it.
   */
  private parseAnalysisResponse(
    analysisText: string,
    _taskType: PharmacyTaskType,
  ): Record<string, unknown> {
    // Try to extract JSON from the response (Claude may wrap it in markdown code blocks)
    const jsonMatch = analysisText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    const jsonStr = jsonMatch ? jsonMatch[1] : analysisText;

    try {
      return JSON.parse(jsonStr.trim()) as Record<string, unknown>;
    } catch {
      // If Claude didn't return valid JSON, wrap the text as a recommendation
      return {
        recommendation: analysisText,
        confidence: 0.70, // Lower confidence when we can't parse structured output
        findings: [],
      };
    }
  }

  /**
   * Build the evidence array from tool results and PCC source data.
   */
  private buildEvidence(
    taskType: PharmacyTaskType,
    ingestResult: IngestResult,
    toolResults: Array<{ toolName: string; result: Record<string, unknown> }>,
    parsedAnalysis: Record<string, unknown>,
  ): Array<{ source: string; label: string; value: string; confidence: number }> {
    const evidence: Array<{ source: string; label: string; value: string; confidence: number }> = [];
    const residentId = (ingestResult.normalizedData.residentId as string) ?? 'facility-wide';

    // Add PCC source data as evidence
    for (const ref of ingestResult.sourceDocumentRefs) {
      evidence.push(
        formatPccEvidence(
          ref.split(':')[1] ?? 'data',
          residentId,
          `Source: ${ref}`,
          0.99, // PCC data is authoritative
        ),
      );
    }

    // Add tool results as evidence
    for (const { toolName, result } of toolResults) {
      evidence.push({
        source: `PharmacyTool:${toolName}`,
        label: `Tool: ${toolName}`,
        value: JSON.stringify(result).slice(0, 500), // Truncate for readability
        confidence: 0.95,
      });
    }

    // Add regulatory evidence based on task type
    switch (taskType) {
      case 'medication_reconciliation':
        evidence.push(
          formatRegulatoryEvidence(
            'F756',
            'Timely medication regimen review upon admission',
            parsedAnalysis.discrepancy_count === 0 ? 'compliant' : 'at_risk',
            0.95,
          ),
        );
        break;

      case 'drug_interaction':
        evidence.push(
          formatRegulatoryEvidence(
            'F756',
            'Medication regimen review — drug interaction screening',
            (parsedAnalysis.max_severity as string) === 'none' ? 'compliant' : 'at_risk',
            0.95,
          ),
        );
        break;

      case 'psychotropic_review':
        evidence.push(
          formatRegulatoryEvidence(
            'F757',
            'Unnecessary medications — psychotropic justification',
            'at_risk',
            0.90,
          ),
          formatRegulatoryEvidence(
            'F758',
            'Psychotropic drugs — GDR compliance',
            'at_risk',
            0.90,
          ),
        );
        break;

      case 'controlled_substance':
        evidence.push(
          formatRegulatoryEvidence(
            'F756',
            'Medication regimen review — controlled substance monitoring',
            'at_risk',
            0.90,
          ),
        );
        break;
    }

    // Add lab evidence if available
    const labResults = ingestResult.normalizedData.labResults as Record<string, unknown> | undefined;
    if (labResults?.gfr !== undefined) {
      evidence.push(
        formatLabEvidence(
          'GFR',
          String(labResults.gfr),
          '>60 mL/min/1.73m2',
          (labResults.collection_date as string) ?? 'unknown',
          0.99,
        ),
      );
    }

    return evidence;
  }

  /**
   * Calculate overall confidence score from analysis and tool results.
   */
  private calculateConfidence(
    taskType: PharmacyTaskType,
    parsedAnalysis: Record<string, unknown>,
    toolResults: Array<{ toolName: string; result: Record<string, unknown> }>,
  ): number {
    // If the analysis includes an explicit confidence, use it as the base
    const analysisConfidence = typeof parsedAnalysis.confidence === 'number'
      ? parsedAnalysis.confidence
      : null;

    // If analysis returned structured confidence, weight it heavily
    if (analysisConfidence !== null) {
      // Adjust down slightly if fewer tools were called than expected
      const expectedTools = this.getExpectedToolCount(taskType);
      const toolCompleteness = Math.min(toolResults.length / Math.max(expectedTools, 1), 1.0);
      const adjustedConfidence = analysisConfidence * (0.8 + 0.2 * toolCompleteness);
      return Math.round(adjustedConfidence * 100) / 100;
    }

    // Fallback: base confidence on task type and data completeness
    switch (taskType) {
      case 'medication_reconciliation':
        return parsedAnalysis.discrepancy_count === 0 ? 0.96 : 0.82;
      case 'drug_interaction':
        return (parsedAnalysis.max_severity as string) === 'none' ? 0.97 : 0.78;
      case 'psychotropic_review':
        return 0.85; // Quarterly reviews always need human verification
      case 'formulary_compliance':
        return 0.90;
      case 'controlled_substance':
        return 0.80; // Conservative for controlled substances
      default:
        return 0.75;
    }
  }

  /**
   * Get the expected number of tool calls for a task type.
   */
  private getExpectedToolCount(taskType: PharmacyTaskType): number {
    switch (taskType) {
      case 'medication_reconciliation': return 2; // interaction check + Beers
      case 'drug_interaction': return 3;          // interaction check + Beers + renal dosing
      case 'psychotropic_review': return 2;       // psychotropic assessment + Beers
      case 'formulary_compliance': return 1;      // formulary check
      case 'controlled_substance': return 2;      // interaction check + renal dosing
      default: return 1;
    }
  }

  /**
   * Assess the impact of the pharmacy finding across dimensions.
   */
  private assessImpact(
    taskType: PharmacyTaskType,
    parsedAnalysis: Record<string, unknown>,
    _data: Record<string, unknown>,
  ): ProcessResult['impact'] {
    switch (taskType) {
      case 'medication_reconciliation':
        return {
          financial: null,
          clinical: parsedAnalysis.discrepancy_count === 0
            ? 'No discrepancies found — medication list reconciled'
            : `${parsedAnalysis.discrepancy_count} discrepancies requiring pharmacist review`,
          regulatory: 'F756 compliance — timely medication reconciliation on admission',
          operational: 'Automated reconciliation saves 15-30 minutes of pharmacist time per admission',
          timeSaved: '20 minutes per admission',
        };

      case 'drug_interaction':
        return {
          financial: null,
          clinical: `Drug interaction check: max severity = ${parsedAnalysis.max_severity ?? 'unknown'}`,
          regulatory: 'F756 compliance — medication regimen review',
          operational: 'Real-time interaction screening on every new order',
          timeSaved: '5 minutes per order',
        };

      case 'psychotropic_review': {
        const facilityData = parsedAnalysis.facility_summary as Record<string, unknown> | undefined;
        return {
          financial: null,
          clinical: `Quarterly review: ${facilityData?.residents_on_psychotropics ?? '?'} residents on psychotropics`,
          regulatory: `F757/F758 compliance — GDR rate: ${facilityData?.gdr_compliance_rate ?? '?'}%`,
          operational: 'Automated facility-wide psychotropic review replacing manual chart audit',
          timeSaved: '4-8 hours per quarterly review',
        };
      }

      case 'formulary_compliance':
        return {
          financial: parsedAnalysis.cost_savings_opportunity
            ? `$${parsedAnalysis.cost_savings_opportunity}/month savings with formulary alternative`
            : null,
          clinical: 'Therapeutic interchange assessment',
          regulatory: null,
          operational: 'Formulary compliance tracking and therapeutic interchange',
          timeSaved: '10 minutes per non-formulary order',
        };

      case 'controlled_substance':
        return {
          financial: null,
          clinical: `Controlled substance monitoring: risk level = ${parsedAnalysis.risk_level ?? 'unknown'}`,
          regulatory: 'DEA/state PDMP compliance — controlled substance tracking',
          operational: 'Automated PDMP cross-reference and MME calculation',
          timeSaved: '15 minutes per controlled substance review',
        };

      default:
        return {
          financial: null,
          clinical: null,
          regulatory: null,
          operational: null,
          timeSaved: null,
        };
    }
  }

  /**
   * Build the reasoning chain from analysis results.
   */
  private buildReasoning(
    taskType: PharmacyTaskType,
    parsedAnalysis: Record<string, unknown>,
    toolResults: Array<{ toolName: string; result: Record<string, unknown> }>,
  ): string[] {
    const reasoning: string[] = [];

    reasoning.push(`Task type: ${taskType}`);
    reasoning.push(`Tools executed: ${toolResults.map((t) => t.toolName).join(', ') || 'none'}`);

    // Add task-specific reasoning
    switch (taskType) {
      case 'medication_reconciliation':
        reasoning.push(`Discrepancies found: ${parsedAnalysis.discrepancy_count ?? 'unknown'}`);
        reasoning.push(`Risk level: ${parsedAnalysis.risk_level ?? 'unknown'}`);
        if (parsedAnalysis.allergy_conflicts) {
          reasoning.push('ALERT: Allergy conflicts detected — requires immediate review');
        }
        break;

      case 'drug_interaction':
        reasoning.push(`Interaction count: ${parsedAnalysis.interaction_count ?? 'unknown'}`);
        reasoning.push(`Max severity: ${parsedAnalysis.max_severity ?? 'unknown'}`);
        reasoning.push(`Order recommendation: ${parsedAnalysis.order_recommendation ?? 'unknown'}`);
        if (parsedAnalysis.beers_criteria_flagged) {
          reasoning.push('Beers Criteria flag — potentially inappropriate medication for elderly');
        }
        if (parsedAnalysis.renal_dose_adjustment_needed) {
          reasoning.push('Renal dose adjustment needed — GFR/CrCl indicates impairment');
        }
        break;

      case 'psychotropic_review': {
        const summary = parsedAnalysis.facility_summary as Record<string, unknown> | undefined;
        if (summary) {
          reasoning.push(`Residents reviewed: ${summary.total_residents_reviewed}`);
          reasoning.push(`On psychotropics: ${summary.residents_on_psychotropics}`);
          reasoning.push(`GDR compliance rate: ${summary.gdr_compliance_rate}%`);
          reasoning.push(`Critical findings: ${summary.critical_count}`);
          reasoning.push(`CMS survey risk: ${summary.cms_survey_risk}`);
        }
        break;
      }

      case 'formulary_compliance':
        reasoning.push(`Formulary status: ${parsedAnalysis.formulary_status ?? 'unknown'}`);
        if (parsedAnalysis.cost_savings_opportunity) {
          reasoning.push(`Cost savings opportunity: $${parsedAnalysis.cost_savings_opportunity}/month`);
        }
        break;

      case 'controlled_substance':
        reasoning.push(`Risk level: ${parsedAnalysis.risk_level ?? 'unknown'}`);
        if (parsedAnalysis.total_mme) {
          reasoning.push(`Total MME: ${parsedAnalysis.total_mme} (threshold: 90)`);
        }
        if (parsedAnalysis.concurrent_opioid_benzo) {
          reasoning.push('ALERT: Concurrent opioid + benzodiazepine — CDC guideline violation');
        }
        break;
    }

    // Add summary from analysis if available
    if (typeof parsedAnalysis.summary === 'string') {
      reasoning.push(`Summary: ${parsedAnalysis.summary}`);
    }

    return reasoning;
  }

  /**
   * Build alternatives considered from the analysis.
   */
  private buildAlternatives(
    taskType: PharmacyTaskType,
    parsedAnalysis: Record<string, unknown>,
  ): Array<{ outcome: string; reason: string; confidence: number }> {
    const alternatives: Array<{ outcome: string; reason: string; confidence: number }> = [];

    switch (taskType) {
      case 'drug_interaction': {
        const interactions = parsedAnalysis.interactions as Array<Record<string, unknown>> | undefined;
        if (interactions) {
          for (const interaction of interactions) {
            const alts = interaction.alternative_medications as string[] | undefined;
            if (alts && alts.length > 0) {
              alternatives.push({
                outcome: `Substitute with ${alts[0]}`,
                reason: `Avoids ${interaction.interaction_type} interaction (${interaction.severity})`,
                confidence: 0.85,
              });
            }
          }
        }
        break;
      }

      case 'formulary_compliance': {
        const alts = parsedAnalysis.therapeutic_alternatives as Array<Record<string, unknown>> | undefined;
        if (alts) {
          for (const alt of alts) {
            alternatives.push({
              outcome: `Interchange to ${alt.name}`,
              reason: `Formulary alternative — saves $${alt.cost_savings_monthly}/month`,
              confidence: 0.90,
            });
          }
        }
        break;
      }

      case 'medication_reconciliation':
        alternatives.push({
          outcome: 'Accept all hospital medications as ordered',
          reason: 'No discrepancies — transfer summary matches PCC orders',
          confidence: parsedAnalysis.discrepancy_count === 0 ? 0.95 : 0.40,
        });
        break;
    }

    // Always include the "no action" alternative
    alternatives.push({
      outcome: 'No action — maintain current orders',
      reason: 'Assessment finds no clinical concerns requiring intervention',
      confidence: parsedAnalysis.risk_level === 'low' ? 0.90 : 0.30,
    });

    return alternatives;
  }
}
