import Anthropic from '@anthropic-ai/sdk';

/**
 * PharmacyAgent — Tool definitions for Claude tool_use.
 *
 * These are pharmacy-specific clinical analysis tools that Claude calls during
 * the process step. Each tool returns structured output that feeds directly
 * into the decision evidence array.
 *
 * PCC connector tools (pcc_get_medications, pcc_get_orders, etc.) are defined
 * at the platform level. These tools are the pharmacy domain's ANALYTICAL tools
 * that operate on data already ingested from PCC.
 */

// ─── Tool Definitions (Anthropic Tool format) ───────────────────────────────

export const PHARMACY_TOOLS: Anthropic.Tool[] = [
  {
    name: 'check_drug_interactions',
    description:
      'Cross-reference a medication against a list of active medications to identify drug-drug interactions, ' +
      'drug-allergy conflicts, and therapeutic duplications. Returns severity-classified interactions with ' +
      'clinical significance and recommended actions. Uses established interaction databases (Lexicomp, ' +
      'Clinical Pharmacology, Micromedex-equivalent logic).',
    input_schema: {
      type: 'object' as const,
      properties: {
        target_medication: {
          type: 'object',
          description: 'The medication being evaluated',
          properties: {
            name: { type: 'string', description: 'Generic medication name' },
            dose: { type: 'string', description: 'Dose with units (e.g., "10mg")' },
            route: { type: 'string', description: 'Route of administration (e.g., "PO", "IV")' },
            frequency: { type: 'string', description: 'Dosing frequency (e.g., "BID", "daily")' },
            drug_class: { type: 'string', description: 'Therapeutic drug class' },
          },
          required: ['name'],
        },
        active_medications: {
          type: 'array',
          description: 'List of all active medications for the resident',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              dose: { type: 'string' },
              route: { type: 'string' },
              frequency: { type: 'string' },
              drug_class: { type: 'string' },
            },
          },
        },
        allergies: {
          type: 'array',
          description: 'Resident allergy list',
          items: {
            type: 'object',
            properties: {
              allergen: { type: 'string' },
              reaction: { type: 'string' },
              severity: { type: 'string' },
            },
          },
        },
        diagnoses: {
          type: 'array',
          description: 'Active diagnosis list (ICD-10 codes)',
          items: {
            type: 'object',
            properties: {
              icd10: { type: 'string' },
              description: { type: 'string' },
            },
          },
        },
      },
      required: ['target_medication', 'active_medications'],
    },
  },
  {
    name: 'verify_formulary_status',
    description:
      'Check if a medication is on the facility formulary. Returns formulary status, therapeutic alternatives ' +
      'with equivalence ratings, cost comparison data, and recommended interchange if applicable. Supports ' +
      'facility-specific and corporate-level formulary lookups.',
    input_schema: {
      type: 'object' as const,
      properties: {
        medication_name: {
          type: 'string',
          description: 'Generic medication name to check',
        },
        dose: {
          type: 'string',
          description: 'Ordered dose (e.g., "20mg")',
        },
        facility_id: {
          type: 'string',
          description: 'Facility ID for facility-specific formulary lookup',
        },
        include_alternatives: {
          type: 'boolean',
          description: 'Whether to return therapeutic alternatives if non-formulary',
        },
      },
      required: ['medication_name', 'facility_id'],
    },
  },
  {
    name: 'calculate_renal_dosing',
    description:
      'Calculate renal-adjusted dosing for a medication based on the resident\'s most recent lab values ' +
      '(GFR, creatinine clearance, serum creatinine). Uses Cockcroft-Gault or CKD-EPI equations as ' +
      'appropriate. Returns recommended dose adjustment, monitoring frequency, and contraindication warnings.',
    input_schema: {
      type: 'object' as const,
      properties: {
        medication_name: {
          type: 'string',
          description: 'Generic medication name',
        },
        current_dose: {
          type: 'string',
          description: 'Currently ordered dose (e.g., "500mg BID")',
        },
        lab_values: {
          type: 'object',
          description: 'Recent renal function lab values',
          properties: {
            gfr: { type: 'number', description: 'GFR in mL/min/1.73m2' },
            creatinine_clearance: { type: 'number', description: 'CrCl in mL/min (Cockcroft-Gault)' },
            serum_creatinine: { type: 'number', description: 'Serum creatinine in mg/dL' },
            bun: { type: 'number', description: 'Blood urea nitrogen in mg/dL' },
            collection_date: { type: 'string', description: 'Date of lab collection (ISO 8601)' },
          },
          required: ['serum_creatinine', 'collection_date'],
        },
        patient_demographics: {
          type: 'object',
          description: 'Patient demographics for CrCl calculation',
          properties: {
            age: { type: 'number' },
            weight_kg: { type: 'number' },
            sex: { type: 'string', description: '"male" or "female"' },
          },
          required: ['age', 'weight_kg', 'sex'],
        },
      },
      required: ['medication_name', 'current_dose', 'lab_values', 'patient_demographics'],
    },
  },
  {
    name: 'check_beers_criteria',
    description:
      'Screen a medication or medication list against the AGS Beers Criteria (2023) for potentially ' +
      'inappropriate medications in older adults (65+). Returns Beers category, quality of evidence, ' +
      'strength of recommendation, and recommended alternatives. Covers all five Beers tables: ' +
      '(1) potentially inappropriate, (2) drug-disease interactions, (3) use with caution, ' +
      '(4) drug-drug interactions to avoid, (5) renal-based dose adjustments.',
    input_schema: {
      type: 'object' as const,
      properties: {
        medications: {
          type: 'array',
          description: 'Medications to screen',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              dose: { type: 'string' },
              drug_class: { type: 'string' },
              indication: { type: 'string' },
            },
            required: ['name'],
          },
        },
        patient_age: {
          type: 'number',
          description: 'Patient age in years',
        },
        diagnoses: {
          type: 'array',
          description: 'Active diagnoses for Table 2 (drug-disease) screening',
          items: {
            type: 'object',
            properties: {
              icd10: { type: 'string' },
              description: { type: 'string' },
            },
          },
        },
        gfr: {
          type: 'number',
          description: 'GFR for Table 5 (renal-based) screening',
        },
      },
      required: ['medications', 'patient_age'],
    },
  },
  {
    name: 'assess_psychotropic_necessity',
    description:
      'Evaluate a psychotropic medication against CMS GDR (Gradual Dose Reduction) criteria per F758. ' +
      'Assesses: (1) documented psychiatric diagnosis supporting use, (2) behavioral monitoring adequacy, ' +
      '(3) non-pharmacological interventions attempted, (4) GDR attempt history for antipsychotics, ' +
      '(5) PRN utilization patterns. Returns compliance status and required actions.',
    input_schema: {
      type: 'object' as const,
      properties: {
        resident_id: {
          type: 'string',
          description: 'PCC resident identifier',
        },
        medication: {
          type: 'object',
          description: 'The psychotropic medication under review',
          properties: {
            name: { type: 'string' },
            drug_class: {
              type: 'string',
              description: '"antipsychotic" | "anxiolytic" | "sedative_hypnotic" | "antidepressant"',
            },
            dose: { type: 'string' },
            start_date: { type: 'string' },
            prescriber: { type: 'string' },
            is_prn: { type: 'boolean' },
          },
          required: ['name', 'drug_class'],
        },
        diagnosis_justification: {
          type: 'object',
          description: 'Documented diagnosis supporting the psychotropic',
          properties: {
            icd10: { type: 'string' },
            description: { type: 'string' },
            documented_date: { type: 'string' },
            meets_cms_criteria: { type: 'boolean' },
          },
        },
        behavioral_monitoring: {
          type: 'object',
          description: 'Recent behavioral monitoring data',
          properties: {
            last_assessment_date: { type: 'string' },
            bims_score: { type: 'number' },
            phq9_score: { type: 'number' },
            behavioral_notes_current: { type: 'boolean' },
            non_pharm_interventions_documented: { type: 'boolean' },
          },
        },
        gdr_history: {
          type: 'array',
          description: 'Gradual dose reduction attempt history (antipsychotics)',
          items: {
            type: 'object',
            properties: {
              attempt_date: { type: 'string' },
              outcome: { type: 'string', description: '"successful" | "failed" | "contraindicated"' },
              clinical_rationale: { type: 'string' },
            },
          },
        },
        prn_administrations: {
          type: 'array',
          description: 'PRN administration records for the last 90 days',
          items: {
            type: 'object',
            properties: {
              date: { type: 'string' },
              reason: { type: 'string' },
              effectiveness: { type: 'string' },
            },
          },
        },
      },
      required: ['resident_id', 'medication'],
    },
  },
];

// ─── Tool Name Constants ────────────────────────────────────────────────────

export const TOOL_NAMES = {
  CHECK_DRUG_INTERACTIONS: 'check_drug_interactions',
  VERIFY_FORMULARY_STATUS: 'verify_formulary_status',
  CALCULATE_RENAL_DOSING: 'calculate_renal_dosing',
  CHECK_BEERS_CRITERIA: 'check_beers_criteria',
  ASSESS_PSYCHOTROPIC_NECESSITY: 'assess_psychotropic_necessity',
} as const;

// ─── PCC Connector Tool Names (platform-level, referenced by PharmacyAgent) ─

export const PCC_TOOLS = {
  GET_MEDICATIONS: 'pcc_get_medications',
  GET_ORDERS: 'pcc_get_orders',
  GET_ASSESSMENTS: 'pcc_get_assessments',
  GET_LAB_RESULTS: 'pcc_get_lab_results',
  GET_RESIDENT: 'pcc_get_resident',
  GET_ALLERGIES: 'pcc_get_allergies',
  GET_DIAGNOSES: 'pcc_get_diagnoses',
  GET_DOCUMENTS: 'pcc_get_documents',
  GET_CENSUS: 'pcc_get_census',
  GET_BEHAVIORAL_MONITORING: 'pcc_get_behavioral_monitoring',
  GET_GDR_HISTORY: 'pcc_get_gdr_history',
  GET_PRN_UTILIZATION: 'pcc_get_prn_utilization',
} as const;

// ─── Tool Result Types ──────────────────────────────────────────────────────

export interface DrugInteractionResult {
  interactions: Array<{
    interaction_type: 'ddi' | 'drug_allergy' | 'therapeutic_duplication' | 'renal_adjustment' | 'hepatic_adjustment' | 'beers_criteria' | 'drug_disease';
    severity: 'minor' | 'moderate' | 'major' | 'contraindicated';
    drug_a: string;
    drug_b: string;
    mechanism: string;
    clinical_significance: string;
    recommendation: string;
    alternative_medications: string[];
    evidence_source: string;
    confidence: number;
  }>;
  max_severity: 'none' | 'minor' | 'moderate' | 'major' | 'contraindicated';
  interaction_count: number;
  beers_criteria_flagged: boolean;
  renal_dose_adjustment_needed: boolean;
  order_recommendation: 'proceed' | 'modify' | 'hold' | 'block';
  summary: string;
}

export interface FormularyResult {
  formulary_status: 'formulary' | 'non_formulary' | 'restricted' | 'prior_auth_required';
  therapeutic_alternatives: Array<{
    name: string;
    equivalence_rating: string;
    cost_savings_monthly: number;
  }>;
  recommended_interchange: {
    medication: string;
    dose: string;
    rationale: string;
  } | null;
  cost_savings_opportunity: number;
  requires_prescriber_contact: boolean;
  summary: string;
}

export interface RenalDosingResult {
  calculated_gfr: number | null;
  calculated_crcl: number | null;
  renal_stage: string;
  current_dose: string;
  recommended_dose: string;
  dose_adjustment_needed: boolean;
  contraindicated: boolean;
  monitoring_frequency: string;
  rationale: string;
  confidence: number;
}

export interface BeersResult {
  flagged_medications: Array<{
    medication: string;
    beers_table: number;
    category: string;
    quality_of_evidence: 'high' | 'moderate' | 'low';
    strength_of_recommendation: 'strong' | 'weak';
    recommendation: string;
    alternatives: string[];
  }>;
  total_flagged: number;
  summary: string;
}

export interface PsychotropicAssessmentResult {
  resident_id: string;
  classification: 'compliant' | 'action_needed' | 'critical';
  diagnosis_adequate: boolean;
  behavioral_monitoring_current: boolean;
  gdr_compliant: boolean | null;
  gdr_last_attempt_date: string | null;
  prn_utilization_flag: boolean;
  polypharmacy_flag: boolean;
  findings: string[];
  recommended_actions: string[];
  f_tag_references: string[];
  confidence: number;
}
