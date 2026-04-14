/**
 * Shared synthetic seed data for the SNF staging environment.
 *
 * Exported so MCP synthetic responders can reference the same facility IDs,
 * resident IDs, and agent definitions used in the staging database.
 *
 * All data is deterministic — no Math.random() at module level.
 */

import { createHash } from 'node:crypto';

// ---------------------------------------------------------------------------
// Seeded PRNG — deterministic random for reproducible seed data
// ---------------------------------------------------------------------------

export class SeededRandom {
  private seed: number;
  constructor(seed: number) {
    this.seed = seed;
  }
  next(): number {
    this.seed = (this.seed * 16807 + 0) % 2147483647;
    return (this.seed - 1) / 2147483646;
  }
  pick<T>(arr: readonly T[]): T {
    return arr[Math.floor(this.next() * arr.length)];
  }
  pickN<T>(arr: readonly T[], n: number): T[] {
    const shuffled = [...arr].sort(() => this.next() - 0.5);
    return shuffled.slice(0, n);
  }
  int(min: number, max: number): number {
    return Math.floor(min + this.next() * (max - min + 1));
  }
  float(min: number, max: number, decimals = 3): number {
    const factor = 10 ** decimals;
    return Math.round((min + this.next() * (max - min)) * factor) / factor;
  }
}

// ---------------------------------------------------------------------------
// 20 Facilities (subset of Ensign's 330)
// ---------------------------------------------------------------------------

export interface SeedFacility {
  id: string;
  name: string;
  state: string;
  city: string;
  regionId: string;
  starRating: number;
  licensedBeds: number;
  currentCensus: number;
  administrator: string;
  don: string;
}

export const SEED_FACILITIES: SeedFacility[] = [
  { id: 'fac-001', name: 'Ensign Highlands Care Center', state: 'CA', city: 'Riverside', regionId: 'region-pacific', starRating: 4, licensedBeds: 120, currentCensus: 98, administrator: 'Karen Whitfield', don: 'Sarah Martinez' },
  { id: 'fac-002', name: 'Cornerstone Health & Rehab', state: 'CA', city: 'San Diego', regionId: 'region-pacific', starRating: 3, licensedBeds: 90, currentCensus: 72, administrator: 'David Kowalski', don: 'Angela Hernandez' },
  { id: 'fac-003', name: 'Desert View Skilled Nursing', state: 'AZ', city: 'Phoenix', regionId: 'region-southwest', starRating: 5, licensedBeds: 150, currentCensus: 118, administrator: 'Lisa Tanaka', don: 'Diane Foster' },
  { id: 'fac-004', name: 'Mountain West Care Center', state: 'UT', city: 'Salt Lake City', regionId: 'region-mountain', starRating: 4, licensedBeds: 80, currentCensus: 68, administrator: 'Brian Caldwell', don: 'Brenda Nguyen' },
  { id: 'fac-005', name: 'Pacific Gardens SNF', state: 'NV', city: 'Las Vegas', regionId: 'region-southwest', starRating: 3, licensedBeds: 200, currentCensus: 165, administrator: 'Amanda Okafor', don: 'Patricia Collins' },
  { id: 'fac-006', name: 'Lone Star Rehab Center', state: 'TX', city: 'Dallas', regionId: 'region-southwest', starRating: 4, licensedBeds: 160, currentCensus: 132, administrator: 'Michael Regan', don: 'Maria Kim' },
  { id: 'fac-007', name: 'Cascade Valley Health', state: 'WA', city: 'Seattle', regionId: 'region-pacific', starRating: 5, licensedBeds: 100, currentCensus: 82, administrator: 'Susan Briggs', don: 'Rachel Washington' },
  { id: 'fac-008', name: 'Heartland Care Campus', state: 'CO', city: 'Denver', regionId: 'region-mountain', starRating: 3, licensedBeds: 130, currentCensus: 108, administrator: 'Richard Vega', don: 'Stephanie Adams' },
  { id: 'fac-009', name: 'Silver Creek Nursing Home', state: 'NV', city: 'Henderson', regionId: 'region-southwest', starRating: 4, licensedBeds: 110, currentCensus: 89, administrator: 'Thomas Morrison', don: 'Christina Taylor' },
  { id: 'fac-010', name: 'Heritage Oaks SNF', state: 'TX', city: 'Houston', regionId: 'region-southwest', starRating: 4, licensedBeds: 180, currentCensus: 148, administrator: 'Nathan Chen', don: 'Rebecca Thomas' },
  { id: 'fac-011', name: 'Sunrise Senior Living', state: 'CA', city: 'Sacramento', regionId: 'region-pacific', starRating: 3, licensedBeds: 95, currentCensus: 78, administrator: 'Jennifer Patterson', don: 'Laura Jackson' },
  { id: 'fac-012', name: 'Meadowbrook Rehabilitation', state: 'OR', city: 'Portland', regionId: 'region-pacific', starRating: 4, licensedBeds: 85, currentCensus: 71, administrator: 'Carlos Sullivan', don: 'Kelly White' },
  { id: 'fac-013', name: 'Prairie View Health Center', state: 'IA', city: 'Des Moines', regionId: 'region-midwest', starRating: 4, licensedBeds: 75, currentCensus: 62, administrator: 'Patricia Rivera', don: 'Melissa Harris' },
  { id: 'fac-014', name: 'Golden Acres Care Home', state: 'KS', city: 'Wichita', regionId: 'region-midwest', starRating: 3, licensedBeds: 70, currentCensus: 55, administrator: 'Robert Bennett', don: 'Tamara Martin' },
  { id: 'fac-015', name: 'Lakeshore Nursing & Rehab', state: 'WI', city: 'Milwaukee', regionId: 'region-midwest', starRating: 5, licensedBeds: 110, currentCensus: 94, administrator: 'Sandra Cooper', don: 'Nicole Garcia' },
  { id: 'fac-016', name: 'Pinecrest Senior Care', state: 'ID', city: 'Boise', regionId: 'region-mountain', starRating: 4, licensedBeds: 65, currentCensus: 53, administrator: 'James Morgan', don: 'Heather Robinson' },
  { id: 'fac-017', name: 'Bayview Skilled Nursing', state: 'SC', city: 'Charleston', regionId: 'region-southeast', starRating: 3, licensedBeds: 140, currentCensus: 112, administrator: 'Michelle Reed', don: 'Teresa Clark' },
  { id: 'fac-018', name: 'Willow Springs Health', state: 'NE', city: 'Omaha', regionId: 'region-midwest', starRating: 4, licensedBeds: 88, currentCensus: 73, administrator: 'William Bailey', don: 'Donna Rodriguez' },
  { id: 'fac-019', name: 'Summit Ridge Rehabilitation', state: 'CO', city: 'Colorado Springs', regionId: 'region-mountain', starRating: 4, licensedBeds: 105, currentCensus: 87, administrator: 'Rachel Brooks', don: 'Kimberly Lewis' },
  { id: 'fac-020', name: 'Coastal Breeze Care Center', state: 'TX', city: 'San Antonio', regionId: 'region-southwest', starRating: 3, licensedBeds: 175, currentCensus: 141, administrator: 'Daniel Sanders', don: 'Carol Lee' },
];

export const SEED_FACILITY_IDS = SEED_FACILITIES.map((f) => f.id);

// ---------------------------------------------------------------------------
// Resident generation
// ---------------------------------------------------------------------------

const FIRST_NAMES_F = [
  'Margaret', 'Dorothy', 'Helen', 'Betty', 'Ruth', 'Virginia', 'Florence',
  'Mildred', 'Eleanor', 'Gladys', 'Alice', 'Evelyn', 'Martha', 'Irene',
  'Edna', 'Lillian', 'Rose', 'Marie', 'Hazel', 'Grace', 'Lucille', 'Pearl',
  'Ethel', 'Bernice', 'Gertrude', 'Clara', 'Thelma', 'Anna', 'Doris', 'June',
];
const FIRST_NAMES_M = [
  'Robert', 'James', 'William', 'George', 'Charles', 'Frank', 'Harold',
  'Raymond', 'Eugene', 'Kenneth', 'Albert', 'Ralph', 'Arthur', 'Henry',
  'Donald', 'Walter', 'Joseph', 'Richard', 'Thomas', 'Edward', 'Paul',
  'Herbert', 'Leonard', 'Norman', 'Carl', 'Earl', 'Fred', 'Howard', 'Roy', 'John',
];
const LAST_NAMES = [
  'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
  'Wilson', 'Anderson', 'Taylor', 'Thomas', 'Jackson', 'White', 'Harris',
  'Martin', 'Thompson', 'Robinson', 'Clark', 'Lewis', 'Lee', 'Walker',
  'Hall', 'Allen', 'Young', 'King', 'Wright', 'Scott', 'Torres', 'Hill',
  'Moore', 'Ward', 'Turner', 'Campbell', 'Parker', 'Evans', 'Edwards',
  'Stewart', 'Flores', 'Morris', 'Murphy', 'Cook', 'Rogers', 'Reed',
  'Bell', 'Bailey', 'Cooper', 'Richardson', 'Cox', 'Howard', 'Long',
];

const DIAGNOSES = [
  'CHF', 'COPD', 'Type 2 Diabetes', 'Alzheimer\'s Disease', 'Vascular Dementia',
  'CVA', 'UTI', 'Hip Fracture', 'Pneumonia', 'Hypertension',
  'CKD Stage 3', 'Atrial Fibrillation', 'Parkinson\'s Disease', 'Osteoarthritis',
  'Depression', 'Anxiety', 'GERD', 'DVT', 'Anemia', 'Hypothyroidism',
];

const PAYER_TYPES = ['medicare_a', 'medicare_b', 'medicaid', 'managed_care', 'private_pay'] as const;

export interface SeedResident {
  id: string;
  facilityId: string;
  firstName: string;
  lastName: string;
  gender: 'M' | 'F';
  age: number;
  roomNumber: string;
  diagnoses: string[];
  payerType: string;
  admissionDate: string;
}

export function generateResidents(count: number, rng: SeededRandom): SeedResident[] {
  const residents: SeedResident[] = [];
  const baseDate = new Date('2026-04-13');

  for (let i = 0; i < count; i++) {
    const facility = SEED_FACILITIES[i % SEED_FACILITIES.length];
    const gender = rng.next() > 0.55 ? 'F' : 'M';
    const firstName = gender === 'F' ? rng.pick(FIRST_NAMES_F) : rng.pick(FIRST_NAMES_M);
    const lastName = rng.pick(LAST_NAMES);
    const floor = rng.int(1, 3);
    const room = rng.int(1, 20);
    const bed = rng.next() > 0.5 ? 'A' : 'B';
    const daysAgo = rng.int(14, 730);
    const admDate = new Date(baseDate.getTime() - daysAgo * 86400000);

    residents.push({
      id: `res-${String(i + 1).padStart(4, '0')}`,
      facilityId: facility.id,
      firstName,
      lastName,
      gender,
      age: rng.int(65, 95),
      roomNumber: `${floor}${String(room).padStart(2, '0')}${bed}`,
      diagnoses: rng.pickN(DIAGNOSES, rng.int(1, 4)),
      payerType: rng.pick(PAYER_TYPES),
      admissionDate: admDate.toISOString().split('T')[0],
    });
  }

  return residents;
}

// ---------------------------------------------------------------------------
// 12 Agent definitions (from agents.config.yaml)
// ---------------------------------------------------------------------------

export interface SeedAgent {
  id: string;
  name: string;
  tier: 'domain' | 'orchestration' | 'meta';
  domain: string;
  version: string;
  description: string;
  modelId: string;
  department: string;
}

export const SEED_AGENTS: SeedAgent[] = [
  { id: 'clinical-operations', name: 'Clinical Operations Agent', tier: 'domain', domain: 'clinical', version: '1.2.0', description: 'Monitors clinical workflows: medication reviews, psychotropic GDR, infection control, fall risk, wound care, therapy plans', modelId: 'claude-sonnet-4-6', department: 'clinical' },
  { id: 'financial-operations', name: 'Financial Operations Agent', tier: 'domain', domain: 'financial', version: '1.1.0', description: 'Enterprise finance: GL reconciliation, budget variance analysis, expense approvals, capital expenditure reviews', modelId: 'claude-sonnet-4-6', department: 'financial' },
  { id: 'workforce-operations', name: 'Workforce Operations Agent', tier: 'domain', domain: 'workforce', version: '1.1.0', description: 'Shift coverage, credential tracking, overtime monitoring, recruitment pipeline, training compliance', modelId: 'claude-sonnet-4-6', department: 'workforce' },
  { id: 'admissions-operations', name: 'Admissions Operations Agent', tier: 'domain', domain: 'admissions', version: '1.0.0', description: 'Census management, referral review, payer verification, bed availability, discharge planning', modelId: 'claude-sonnet-4-6', department: 'admissions' },
  { id: 'quality-safety', name: 'Quality & Safety Agent', tier: 'domain', domain: 'quality', version: '1.1.0', description: 'Fall investigations, survey readiness, QM trending, incident reports, QAPI action items', modelId: 'claude-sonnet-4-6', department: 'quality' },
  { id: 'legal-compliance', name: 'Legal & Compliance Agent', tier: 'domain', domain: 'legal', version: '1.0.0', description: 'Contract reviews, regulatory filings, compliance audits, policy updates, litigation monitoring', modelId: 'claude-sonnet-4-6', department: 'legal' },
  { id: 'operations-facilities', name: 'Operations & Facilities Agent', tier: 'domain', domain: 'operations', version: '1.0.0', description: 'Work orders, equipment maintenance, supply chain, environmental safety, life safety inspections', modelId: 'claude-sonnet-4-6', department: 'operations' },
  { id: 'strategic-ma', name: 'Strategic M&A Agent', tier: 'domain', domain: 'strategic', version: '1.0.0', description: 'Acquisition target analysis, market intelligence, competitive positioning, portfolio optimization', modelId: 'claude-opus-4-6', department: 'strategic' },
  { id: 'revenue-cycle', name: 'Revenue Cycle Agent', tier: 'domain', domain: 'financial', version: '1.2.0', description: 'Claim denial management, AR follow-up, PDPM optimization, payer contract analysis, timely filing', modelId: 'claude-sonnet-4-6', department: 'revenue' },
  { id: 'command-center', name: 'Command Center Agent', tier: 'orchestration', domain: 'platform', version: '1.0.0', description: 'Cross-domain orchestration, escalation routing, enterprise-wide alert correlation', modelId: 'claude-opus-4-6', department: 'command-center' },
  { id: 'executive-briefing', name: 'Executive Briefing Agent', tier: 'orchestration', domain: 'platform', version: '1.0.0', description: 'Board reports, investor relations summaries, regulatory compliance dashboards (READ-ONLY)', modelId: 'claude-opus-4-6', department: 'executive' },
  { id: 'agent-builder', name: 'Agent Builder Meta-Agent', tier: 'meta', domain: 'platform', version: '1.0.0', description: 'SOP-to-runbook pipeline, agent configuration updates, meta-level orchestration', modelId: 'claude-opus-4-6', department: 'agent-builder' },
];

export const SEED_AGENT_IDS = SEED_AGENTS.map((a) => a.id);

// The 8 domain agents that generate decisions (excluding orchestration/meta)
export const DECISION_AGENT_IDS = SEED_AGENTS
  .filter((a) => a.tier === 'domain')
  .map((a) => a.id);

// ---------------------------------------------------------------------------
// Medications, assessments, and clinical reference data
// ---------------------------------------------------------------------------

export const MEDICATIONS = [
  { name: 'Donepezil', dose: '10mg', class: 'cholinesterase_inhibitor', psychotropic: false },
  { name: 'Lisinopril', dose: '20mg', class: 'ace_inhibitor', psychotropic: false },
  { name: 'Metformin', dose: '500mg', class: 'antidiabetic', psychotropic: false },
  { name: 'Metoprolol', dose: '50mg', class: 'beta_blocker', psychotropic: false },
  { name: 'Atorvastatin', dose: '40mg', class: 'statin', psychotropic: false },
  { name: 'Omeprazole', dose: '20mg', class: 'ppi', psychotropic: false },
  { name: 'Amlodipine', dose: '5mg', class: 'calcium_channel_blocker', psychotropic: false },
  { name: 'Gabapentin', dose: '300mg', class: 'anticonvulsant', psychotropic: true },
  { name: 'Sertraline', dose: '50mg', class: 'ssri', psychotropic: true },
  { name: 'Quetiapine', dose: '25mg', class: 'antipsychotic', psychotropic: true },
  { name: 'Lorazepam', dose: '0.5mg', class: 'benzodiazepine', psychotropic: true },
  { name: 'Risperidone', dose: '0.5mg', class: 'antipsychotic', psychotropic: true },
  { name: 'Haloperidol', dose: '1mg', class: 'antipsychotic', psychotropic: true },
  { name: 'Trazodone', dose: '50mg', class: 'antidepressant', psychotropic: true },
  { name: 'Warfarin', dose: '5mg', class: 'anticoagulant', psychotropic: false },
  { name: 'Furosemide', dose: '40mg', class: 'diuretic', psychotropic: false },
  { name: 'Levothyroxine', dose: '75mcg', class: 'thyroid', psychotropic: false },
  { name: 'Pantoprazole', dose: '40mg', class: 'ppi', psychotropic: false },
];

export const ICD10_CODES: Record<string, string> = {
  'CHF': 'I50.9',
  'COPD': 'J44.1',
  'Type 2 Diabetes': 'E11.9',
  'Hypertension': 'I10',
  'Alzheimer\'s Disease': 'G30.9',
  'Vascular Dementia': 'F01.50',
  'CVA': 'I63.9',
  'UTI': 'N39.0',
  'Hip Fracture': 'S72.009A',
  'Pneumonia': 'J18.9',
  'CKD Stage 3': 'N18.3',
  'Atrial Fibrillation': 'I48.91',
  'Parkinson\'s Disease': 'G20',
  'Depression': 'F32.9',
};

// ---------------------------------------------------------------------------
// 5 Hero decisions (hand-crafted for demo walkthrough)
// ---------------------------------------------------------------------------

export interface HeroDecision {
  id: string;
  traceId: string;
  title: string;
  description: string;
  category: string;
  domain: string;
  agentId: string;
  confidence: number;
  recommendation: string;
  reasoning: string[];
  evidence: object[];
  governanceLevel: number;
  priority: 'critical' | 'high' | 'medium' | 'low';
  dollarAmount: number | null;
  facilityId: string;
  targetType: string;
  targetId: string;
  targetLabel: string;
  sourceSystems: string[];
  impact: object;
}

export const HERO_DECISIONS: HeroDecision[] = [
  {
    id: '00000000-hero-0001-0000-000000000001',
    traceId: '00000000-trace-0001-0000-000000000001',
    title: 'Margaret Chen (Room 214B) — Psychotropic GDR Review: Donepezil 10mg',
    description: 'Margaret Chen (Room 214B) — Psychotropic GDR Review: Donepezil 10mg due for gradual dose reduction per F-Tag 758. BIMS 8/15, PHQ-9 12, no behavioral incidents in 90 days. Last GDR attempted 2025-10-15 resulted in cognitive decline reversal at day 14. Agent recommends maintaining current dose based on 90-day cognitive stability trend and prior failed reduction attempt. Pharmacy consultant Dr. Patel concurs.',
    category: 'psychotropic_review',
    domain: 'clinical',
    agentId: 'clinical-operations',
    confidence: 0.92,
    recommendation: 'Maintain current Donepezil 10mg dose. Document clinical rationale for GDR exception per F-Tag 758. Schedule next review in 90 days (2026-07-12).',
    reasoning: [
      'F-Tag 758 requires gradual dose reduction attempt for all psychotropic medications unless clinically contraindicated',
      'Prior GDR attempt (2025-10-15) resulted in measurable cognitive decline: BIMS dropped from 9 to 5 within 14 days',
      'Current 90-day stability trend: BIMS stable at 8/15 (±1), PHQ-9 stable at 12, zero behavioral incidents',
      'Pharmacy consultant Dr. Rajesh Patel reviewed on 2026-04-10 and recommends maintaining current dose',
      'CMS Interpretive Guidance permits dose maintenance when documented clinical evidence supports continued use',
    ],
    evidence: [
      { source: 'pcc', label: 'MDS 3.0 BIMS Score', value: '8/15 (moderate cognitive impairment)', confidence: 0.98 },
      { source: 'pcc', label: 'PHQ-9 Depression Screen', value: '12 (moderate depression)', confidence: 0.97 },
      { source: 'pcc', label: 'Behavioral Monitoring Log', value: '0 incidents in 90 days', confidence: 0.99 },
      { source: 'pcc', label: 'Prior GDR Attempt', value: '2025-10-15: BIMS decline 9→5 at day 14, dose restored', confidence: 0.96 },
      { source: 'pcc', label: 'Pharmacy Consultant Note', value: 'Dr. Patel recommends maintaining dose (2026-04-10)', confidence: 0.95 },
    ],
    governanceLevel: 4,
    priority: 'high',
    dollarAmount: null,
    facilityId: 'fac-001',
    targetType: 'resident',
    targetId: 'res-0001',
    targetLabel: 'Margaret Chen — Room 214B — Ensign Highlands Care Center',
    sourceSystems: ['pcc', 'pharmacy'],
    impact: { clinical: 'Medication safety — psychotropic monitoring compliance', regulatory: 'F-Tag 758 GDR compliance', timeSaved: '45 minutes' },
  },
  {
    id: '00000000-hero-0002-0000-000000000002',
    traceId: '00000000-trace-0002-0000-000000000002',
    title: '$47,832 Medicare Part A Claim Denial — Cornerstone H&R — DX Code Mismatch',
    description: '$47,832 Medicare Part A claim denial for Cornerstone Health & Rehab. DX code mismatch between MDS ARD 03/15 and UB-04 line 67. Primary diagnosis coded as J18.9 (Pneumonia, unspecified organism) on UB-04 but MDS reflects J18.1 (Lobar pneumonia, unspecified organism). Agent identified the ICD-10 mapping error originated in the PCC auto-coding module during the 03/15 ARD lock. Recommends corrected resubmission within the 120-day timely filing window (deadline: 2026-07-13).',
    category: 'claim_denial',
    domain: 'financial',
    agentId: 'revenue-cycle',
    confidence: 0.94,
    recommendation: 'Resubmit claim with corrected ICD-10 code J18.1 on UB-04 line 67 to match MDS ARD. Estimated recovery: $47,832. Timely filing deadline: 2026-07-13 (91 days remaining).',
    reasoning: [
      'Medicare Administrative Contractor (MAC) denial reason code CO-11: diagnosis inconsistent with procedure',
      'MDS 3.0 ARD 2026-03-15 reflects J18.1 (Lobar pneumonia) as primary dx for RUG-IV classification',
      'UB-04 submitted with J18.9 (Pneumonia, unspecified) — mismatch triggers automatic denial',
      'PCC auto-coding module mapped J18.1→J18.9 during ARD lock; root cause: outdated code crosswalk table',
      'Corrected resubmission within 120-day timely filing window (CMS 42 CFR §424.44) eligible for full recovery',
      'Similar coding error pattern found in 3 other recent claims — systemic PCC configuration issue identified',
    ],
    evidence: [
      { source: 'pcc', label: 'MDS 3.0 ARD', value: 'ARD 2026-03-15 — Primary DX: J18.1 (Lobar pneumonia)', confidence: 0.98 },
      { source: 'workday', label: 'UB-04 Claim', value: 'Claim #2026-SD-04472 — Line 67 DX: J18.9 (mismatch)', confidence: 0.99 },
      { source: 'workday', label: 'Denial EOB', value: 'MAC denial CO-11, received 2026-04-08, amount: $47,832.00', confidence: 0.99 },
      { source: 'pcc', label: 'PCC Auto-Code Log', value: 'J18.1→J18.9 crosswalk applied at ARD lock 03/15 14:23 PST', confidence: 0.95 },
    ],
    governanceLevel: 4,
    priority: 'critical',
    dollarAmount: 4783200,
    facilityId: 'fac-002',
    targetType: 'claim',
    targetId: 'claim-2026-SD-04472',
    targetLabel: 'Claim #2026-SD-04472 — Cornerstone Health & Rehab — $47,832',
    sourceSystems: ['pcc', 'workday'],
    impact: { financial: '$47,832 recovery opportunity', regulatory: 'CMS timely filing compliance (91 days remaining)', timeSaved: '3.5 hours' },
  },
  {
    id: '00000000-hero-0003-0000-000000000003',
    traceId: '00000000-trace-0003-0000-000000000003',
    title: 'Night Shift RN Vacancy — Pacific Gardens NV — 3 Consecutive Shifts Uncovered',
    description: 'Night shift (11p-7a) RN vacancy at Pacific Gardens SNF, Las Vegas. 3 consecutive shifts uncovered 04/15–04/17 after RN Janet Morrison called out (family emergency). Current staffing falls below Nevada NAC 449.242 minimum RN coverage requirement (1 RN per 40 residents, night shift). Census: 165 residents. Agent identified 2 qualified per-diem RNs from the Ensign agency pool: Maria Santos (NV license #RN-78234, credential exp 08/2026, last shift at Pacific Gardens 03/22) and James Park (NV license #RN-81045, credential exp 11/2026, no prior Pacific Gardens shifts).',
    category: 'shift_coverage',
    domain: 'workforce',
    agentId: 'workforce-operations',
    confidence: 0.88,
    recommendation: 'Assign Maria Santos for 04/15 and 04/16 shifts (familiar with facility). Assign James Park for 04/17 with 2-hour orientation overlap. Estimated total agency cost: $2,847 (3 shifts × $949/shift). Alert DON Patricia Collins for approval.',
    reasoning: [
      'Nevada NAC 449.242 requires minimum 1 RN per 40 residents on night shift — Pacific Gardens needs 5 RNs minimum (165 census ÷ 40)',
      'Current night shift has 4 RNs scheduled 04/15-04/17 after Morrison callout — 1 below minimum',
      'Maria Santos: last worked Pacific Gardens 03/22, knows unit layout, medication pass workflow. Preferred first assignment',
      'James Park: no prior Pacific Gardens shifts, requires 2-hour orientation per facility onboarding policy P-HR-012',
      'Agency rate: $949/shift (Ensign contracted rate, below $1,100 market average for Las Vegas metro)',
      'Internal float pool exhausted: 0 qualified RNs available across Nevada facilities for these dates',
    ],
    evidence: [
      { source: 'workday', label: 'Staffing Schedule', value: 'Night shift 04/15-04/17: 4 RNs scheduled (min required: 5)', confidence: 0.99 },
      { source: 'workday', label: 'Agency Pool — Maria Santos', value: 'NV RN#78234, exp 08/2026, last Pacific Gardens shift 03/22', confidence: 0.97 },
      { source: 'workday', label: 'Agency Pool — James Park', value: 'NV RN#81045, exp 11/2026, no prior Pacific Gardens shifts', confidence: 0.97 },
      { source: 'workday', label: 'Float Pool Availability', value: '0 qualified RNs available across NV facilities 04/15-04/17', confidence: 0.98 },
    ],
    governanceLevel: 3,
    priority: 'critical',
    dollarAmount: 284700,
    facilityId: 'fac-005',
    targetType: 'schedule',
    targetId: 'sched-2026-04-15-night',
    targetLabel: 'Night Shift RN Coverage — Pacific Gardens — 04/15-04/17',
    sourceSystems: ['workday'],
    impact: { financial: '$2,847 agency cost', regulatory: 'NAC 449.242 staffing compliance', operational: 'Patient safety — minimum RN coverage', timeSaved: '2 hours' },
  },
  {
    id: '00000000-hero-0004-0000-000000000004',
    traceId: '00000000-trace-0004-0000-000000000004',
    title: 'Fall Cluster Alert — Cascade Valley WA — 4 Falls in 72 Hours, Common Factor Identified',
    description: 'Fall cluster detected at Cascade Valley Health, Seattle: 4 resident falls between 04/10 18:00 and 04/13 06:00 in Wing B (rooms 201-220). All 4 falls occurred during night shift (11p-7a) in the same hallway section near the medication room. Agent cross-referenced PCC incident reports with environmental data and identified common factor: hallway B-corridor lighting replaced 04/09 (work order WO-2847) with LED fixtures producing 15 lux vs required 30 lux minimum (CMS F-Tag 584). Residents affected: Robert Williams (Room 207A, hip contusion), Dorothy Johnson (Room 212B, no injury), Helen Brown (Room 215A, wrist sprain), Walter Davis (Room 218B, no injury).',
    category: 'fall_investigation',
    domain: 'quality',
    agentId: 'quality-safety',
    confidence: 0.91,
    recommendation: 'Immediate: Replace Wing B corridor lighting to meet 30 lux minimum (CMS F-Tag 584). Notify maintenance supervisor. File QAPI investigation report within 24 hours. Order fall mat placement for rooms 207A, 212B, 215A, 218B pending lighting correction. Schedule 7-day post-intervention fall rate reassessment.',
    reasoning: [
      '4 falls in 72 hours in same wing exceeds facility average of 1.2 falls/week facility-wide — statistically significant cluster (p<0.01)',
      'All 4 falls occurred during night shift in B-corridor (rooms 201-220), none in A-corridor or C-corridor',
      'Work order WO-2847 (04/09): B-corridor hallway lighting replaced with LED fixtures — temporal correlation',
      'Environmental light meter reading 04/12: B-corridor 15 lux, A-corridor 32 lux, C-corridor 28 lux',
      'CMS F-Tag 584 (Safe Environment) requires minimum 30 lux in corridors per Life Safety Code NFPA 101',
      '2 of 4 residents have documented visual impairment (Williams: macular degeneration, Brown: glaucoma)',
    ],
    evidence: [
      { source: 'pcc', label: 'Incident Report — Robert Williams', value: 'Fall 04/10 23:45, B-corridor near med room, hip contusion', confidence: 0.99 },
      { source: 'pcc', label: 'Incident Report — Dorothy Johnson', value: 'Fall 04/11 02:15, B-corridor room 212 doorway, no injury', confidence: 0.99 },
      { source: 'pcc', label: 'Incident Report — Helen Brown', value: 'Fall 04/12 01:30, B-corridor near room 215, wrist sprain', confidence: 0.99 },
      { source: 'pcc', label: 'Incident Report — Walter Davis', value: 'Fall 04/13 04:00, B-corridor near bathroom, no injury', confidence: 0.99 },
      { source: 'internal', label: 'Work Order WO-2847', value: 'B-corridor lighting replacement completed 04/09 by vendor ElectroPro', confidence: 0.98 },
      { source: 'internal', label: 'Light Meter Reading', value: 'B-corridor: 15 lux (04/12) vs A-corridor: 32 lux, C-corridor: 28 lux', confidence: 0.97 },
    ],
    governanceLevel: 4,
    priority: 'critical',
    dollarAmount: null,
    facilityId: 'fac-007',
    targetType: 'facility_wing',
    targetId: 'fac-007-wing-b',
    targetLabel: 'Wing B (Rooms 201-220) — Cascade Valley Health',
    sourceSystems: ['pcc', 'internal'],
    impact: { clinical: 'Patient safety — fall prevention', regulatory: 'CMS F-Tag 584 (Safe Environment)', quality: 'QAPI fall cluster investigation required within 24h', timeSaved: '4 hours' },
  },
  {
    id: '00000000-hero-0005-0000-000000000005',
    traceId: '00000000-trace-0005-0000-000000000005',
    title: 'CMS 5-Star Rating Drop Risk — Desert View AZ — 14-Day Correction Window',
    description: 'Desert View Skilled Nursing (Phoenix, AZ) at risk of 5-star → 4-star CMS rating drop. Quality Measures (QM) composite score decreased from 4.2 to 3.7 in the April 2026 refresh preview. Primary driver: antipsychotic medication use rate increased from 12.3% to 18.7% (national average: 14.1%), crossing the CMS threshold for point deduction. Secondary driver: long-stay catheter use rate at 4.8% (threshold: 3.5%). CMS publishes updated ratings on 04/27 — 14-day window to implement corrections and file data correction request if warranted.',
    category: 'survey_readiness',
    domain: 'quality',
    agentId: 'quality-safety',
    confidence: 0.87,
    recommendation: 'Initiate immediate GDR review for all 28 residents on antipsychotic medications. Target: reduce antipsychotic use rate from 18.7% to below 15% by documenting PRN-to-scheduled conversions, dose reductions, and clinically justified exceptions. File CMS Quality Measure data correction request for 3 residents with documented diagnoses excluded from the antipsychotic measure (Huntington\'s, Tourette\'s, schizophrenia). Assign catheter care audit to DON Diane Foster — target: remove 2 inappropriate indwelling catheters.',
    reasoning: [
      'CMS Five-Star Quality Rating System refreshes monthly — April 2026 preview shows QM composite drop 4.2→3.7',
      'Antipsychotic use rate 18.7% exceeds national average 14.1% and CMS threshold for point deduction (15%)',
      'Of 28 residents on antipsychotics: 3 have CMS-excluded diagnoses (can be corrected via data submission), 7 may qualify for GDR taper',
      'Catheter use rate 4.8% above 3.5% threshold — chart audit identified 2 residents with catheters past medical necessity window',
      'Star rating drop from 5→4 historically correlates with 8-12% referral volume decrease for SNFs in Phoenix metro',
      '14-day correction window: CMS allows Quality Measure data corrections filed by 04/25 for the 04/27 publish',
    ],
    evidence: [
      { source: 'cms', label: 'QM Preview — Antipsychotic Rate', value: '18.7% (threshold: 15%, national avg: 14.1%)', confidence: 0.96 },
      { source: 'cms', label: 'QM Preview — Catheter Use Rate', value: '4.8% (threshold: 3.5%)', confidence: 0.96 },
      { source: 'cms', label: 'Current Star Rating', value: '5 stars (at risk of drop to 4 stars)', confidence: 0.98 },
      { source: 'pcc', label: 'Antipsychotic Census', value: '28 residents on antipsychotics (3 with excluded diagnoses)', confidence: 0.97 },
      { source: 'pcc', label: 'Catheter Census', value: '7 residents with indwelling catheters (2 past medical necessity)', confidence: 0.95 },
    ],
    governanceLevel: 5,
    priority: 'critical',
    dollarAmount: null,
    facilityId: 'fac-003',
    targetType: 'facility',
    targetId: 'fac-003',
    targetLabel: 'Desert View Skilled Nursing — Phoenix, AZ — 5-Star Rating',
    sourceSystems: ['cms', 'pcc'],
    impact: { regulatory: 'CMS 5-Star rating preservation', financial: 'Estimated $180K/year referral revenue at risk from star drop', clinical: 'Antipsychotic use reduction aligns with CMS national initiative', timeSaved: '6 hours' },
  },
];

export const HERO_DECISION_IDS = HERO_DECISIONS.map((d) => d.id);

// ---------------------------------------------------------------------------
// Decision narrative templates (per domain)
// ---------------------------------------------------------------------------

export type DecisionTemplate = (
  resident: SeedResident,
  facility: SeedFacility,
  rng: SeededRandom,
) => {
  title: string;
  description: string;
  category: string;
  recommendation: string;
  reasoning: string[];
  evidence: object[];
  targetType: string;
  targetId: string;
  targetLabel: string;
  dollarAmount: number | null;
  sourceSystems: string[];
  impact: object;
  confidence: number;
  priority: 'critical' | 'high' | 'medium' | 'low';
  governanceLevel: number;
};

const clinicalTemplates: DecisionTemplate[] = [
  (res, fac, rng) => {
    const med = rng.pick(MEDICATIONS.filter((m) => m.psychotropic));
    const bims = rng.int(3, 14);
    const phq9 = rng.int(2, 22);
    return {
      title: `${res.firstName} ${res.lastName} (Room ${res.roomNumber}) — Psychotropic GDR Review: ${med.name} ${med.dose}`,
      description: `${res.firstName} ${res.lastName} (Room ${res.roomNumber}) — ${med.name} ${med.dose} due for gradual dose reduction per F-Tag 758. BIMS ${bims}/15, PHQ-9 ${phq9}. ${bims >= 10 ? 'Agent recommends dose taper trial over 14 days with daily BIMS monitoring.' : 'Agent recommends maintaining current dose based on cognitive impairment severity.'}`,
      category: 'psychotropic_review',
      recommendation: bims >= 10 ? `Initiate ${med.name} taper: reduce to ${med.dose.replace(/\d+/, (n) => String(Math.floor(Number(n) / 2)))} for 14-day trial. Monitor BIMS daily.` : `Maintain current ${med.name} ${med.dose}. Document clinical rationale for GDR exception.`,
      reasoning: [`F-Tag 758 GDR requirement applies to ${med.class}`, `BIMS ${bims}/15 indicates ${bims >= 13 ? 'intact' : bims >= 8 ? 'moderate' : 'severe'} cognitive impairment`, `PHQ-9 ${phq9} indicates ${phq9 >= 20 ? 'severe' : phq9 >= 15 ? 'moderately severe' : phq9 >= 10 ? 'moderate' : 'mild'} depression`],
      evidence: [{ source: 'pcc', label: 'BIMS Score', value: `${bims}/15`, confidence: 0.97 }, { source: 'pcc', label: 'PHQ-9', value: `${phq9}`, confidence: 0.96 }],
      targetType: 'resident', targetId: res.id, targetLabel: `${res.firstName} ${res.lastName} — Room ${res.roomNumber} — ${fac.name}`,
      dollarAmount: null, sourceSystems: ['pcc', 'pharmacy'],
      impact: { clinical: 'Psychotropic medication safety', regulatory: 'F-Tag 758 compliance' },
      confidence: rng.float(0.82, 0.96), priority: 'high', governanceLevel: 4,
    };
  },
  (res, fac, rng) => {
    const dx = rng.pick(['MRSA', 'C. difficile', 'Influenza A', 'COVID-19', 'VRE']);
    return {
      title: `${res.firstName} ${res.lastName} (Room ${res.roomNumber}) — Infection Control Alert: ${dx} Screening Positive`,
      description: `${dx} positive screening for ${res.firstName} ${res.lastName}, Room ${res.roomNumber}. Contact precautions initiated. Agent reviewed census for exposure contacts within 48-hour window and identified ${rng.int(2, 6)} potentially exposed residents on the same wing.`,
      category: 'infection_control',
      recommendation: `Implement enhanced contact precautions. Notify ${fac.don} (DON). Screen ${rng.int(2, 6)} exposed residents within 24 hours. Update PCC isolation status.`,
      reasoning: [`${dx} positive screening requires immediate contact precautions per CDC guidelines`, `${rng.int(2, 6)} residents shared dining and activity areas within 48-hour exposure window`],
      evidence: [{ source: 'pcc', label: 'Lab Result', value: `${dx} positive (specimen collected ${new Date(Date.now() - 86400000).toISOString().split('T')[0]})`, confidence: 0.99 }],
      targetType: 'resident', targetId: res.id, targetLabel: `${res.firstName} ${res.lastName} — Room ${res.roomNumber} — ${fac.name}`,
      dollarAmount: null, sourceSystems: ['pcc'],
      impact: { clinical: `${dx} containment`, regulatory: 'Infection control compliance' },
      confidence: rng.float(0.90, 0.98), priority: 'critical', governanceLevel: 3,
    };
  },
  (res, fac, rng) => {
    const braden = rng.int(10, 18);
    const prevBraden = braden + rng.int(2, 5);
    return {
      title: `${res.firstName} ${res.lastName} (Room ${res.roomNumber}) — Fall Risk Reassessment: Braden Score ${braden}`,
      description: `Braden Pressure Injury Risk score dropped from ${prevBraden} to ${braden} for ${res.firstName} ${res.lastName}. ${braden <= 12 ? 'High risk — pressure-relieving mattress and q2h repositioning protocol recommended.' : 'Moderate risk — current interventions adequate with increased monitoring.'}`,
      category: 'fall_risk_assessment',
      recommendation: braden <= 12 ? `Upgrade to pressure-relieving mattress. Initiate q2h repositioning protocol. Dietary consult for nutritional support.` : `Continue current interventions. Increase skin assessment frequency to daily. Re-evaluate in 7 days.`,
      reasoning: [`Braden score decline ${prevBraden}→${braden} over 14 days`, `Score ${braden} = ${braden <= 12 ? 'high' : braden <= 14 ? 'moderate' : 'mild'} risk category`],
      evidence: [{ source: 'pcc', label: 'Braden Score', value: `Current: ${braden} (previous: ${prevBraden})`, confidence: 0.98 }],
      targetType: 'resident', targetId: res.id, targetLabel: `${res.firstName} ${res.lastName} — Room ${res.roomNumber} — ${fac.name}`,
      dollarAmount: braden <= 12 ? rng.int(800, 2500) * 100 : null, sourceSystems: ['pcc'],
      impact: { clinical: 'Pressure injury prevention', quality: 'QM long-stay pressure ulcer rate' },
      confidence: rng.float(0.85, 0.95), priority: braden <= 12 ? 'high' : 'medium', governanceLevel: 3,
    };
  },
  (res, fac, rng) => {
    const discrepancies = rng.int(1, 5);
    return {
      title: `${res.firstName} ${res.lastName} (Room ${res.roomNumber}) — Medication Reconciliation: ${discrepancies} Discrepancies Found`,
      description: `Medication reconciliation identified ${discrepancies} discrepancies between PCC MAR, pharmacy records, and physician orders for ${res.firstName} ${res.lastName}. Most critical: ${rng.pick(MEDICATIONS).name} dose on MAR does not match current physician order.`,
      category: 'medication_reconciliation',
      recommendation: `Reconcile ${discrepancies} discrepancies with attending physician. Priority: verify ${rng.pick(MEDICATIONS).name} dosing. Update PCC MAR upon physician confirmation.`,
      reasoning: [`${discrepancies} medication discrepancies identified during automated reconciliation`, 'PCC MAR vs pharmacy vs physician order cross-check'],
      evidence: [{ source: 'pcc', label: 'MAR Discrepancies', value: `${discrepancies} found`, confidence: 0.94 }],
      targetType: 'resident', targetId: res.id, targetLabel: `${res.firstName} ${res.lastName} — Room ${res.roomNumber} — ${fac.name}`,
      dollarAmount: null, sourceSystems: ['pcc', 'pharmacy'],
      impact: { clinical: 'Medication safety', regulatory: 'F-Tag 761 med error prevention' },
      confidence: rng.float(0.80, 0.93), priority: 'high', governanceLevel: 4,
    };
  },
];

const financialTemplates: DecisionTemplate[] = [
  (res, fac, rng) => {
    const amount = rng.int(8000, 85000);
    const dxCode = rng.pick(Object.entries(ICD10_CODES));
    return {
      title: `$${amount.toLocaleString()} Medicare Part A Claim Denial — ${fac.name} — DX Code Issue`,
      description: `$${amount.toLocaleString()} Medicare Part A claim denial at ${fac.name}. Denial reason: DX code ${dxCode[1]} (${dxCode[0]}) documentation insufficient to support skilled level of care. Agent identified missing progress notes for days 8-12 of the covered stay.`,
      category: 'claim_denial',
      recommendation: `Gather missing progress notes for days 8-12. Resubmit with supplemental documentation package within timely filing window.`,
      reasoning: [`MAC denial for insufficient documentation supporting skilled care`, `${rng.int(60, 110)} days remaining in timely filing window`],
      evidence: [{ source: 'workday', label: 'Denial Amount', value: `$${amount.toLocaleString()}`, confidence: 0.99 }, { source: 'pcc', label: 'Missing Documentation', value: 'Progress notes days 8-12', confidence: 0.95 }],
      targetType: 'claim', targetId: `claim-${rng.int(1000, 9999)}`, targetLabel: `Claim Denial — ${fac.name} — $${amount.toLocaleString()}`,
      dollarAmount: amount * 100, sourceSystems: ['pcc', 'workday'],
      impact: { financial: `$${amount.toLocaleString()} recovery opportunity` },
      confidence: rng.float(0.82, 0.95), priority: amount > 25000 ? 'critical' : 'high', governanceLevel: 4,
    };
  },
  (_res, fac, rng) => {
    const category = rng.pick(['dietary supplies', 'pharmacy', 'medical supplies', 'utilities', 'contract labor']);
    const variance = rng.int(15, 45);
    const amount = rng.int(5000, 35000);
    return {
      title: `$${amount.toLocaleString()} Budget Variance — ${fac.name} — ${category} ${variance}% Over`,
      description: `GL budget variance alert: ${category} at ${fac.name} trending ${variance}% over Q2 budget ($${amount.toLocaleString()} over projected). Agent analyzed purchasing patterns and identified ${rng.pick(['vendor price increase not reflected in budget', 'increased utilization due to census growth', 'duplicate orders in procurement system'])}.`,
      category: 'budget_variance',
      recommendation: `Review ${category} spending with facility administrator ${fac.administrator}. Identify cost reduction opportunities or submit budget amendment request.`,
      reasoning: [`${variance}% over budget exceeds 10% threshold for management review`, `Root cause: ${rng.pick(['vendor pricing', 'utilization increase', 'procurement error'])}`],
      evidence: [{ source: 'workday', label: 'GL Variance', value: `${category}: $${amount.toLocaleString()} over budget (${variance}%)`, confidence: 0.97 }],
      targetType: 'budget', targetId: `budget-${fac.id}-q2`, targetLabel: `Q2 Budget — ${category} — ${fac.name}`,
      dollarAmount: amount * 100, sourceSystems: ['workday'],
      impact: { financial: `$${amount.toLocaleString()} budget overrun` },
      confidence: rng.float(0.85, 0.95), priority: variance > 30 ? 'high' : 'medium', governanceLevel: 3,
    };
  },
  (_res, fac, rng) => {
    const days = rng.int(45, 120);
    const amount = rng.int(12000, 95000);
    return {
      title: `AR Aging Alert — ${fac.name} — $${amount.toLocaleString()} Balance ${days}+ Days`,
      description: `Accounts receivable aging alert: $${amount.toLocaleString()} outstanding balance at ${fac.name} aged ${days}+ days. Payer: ${rng.pick(['UnitedHealthcare', 'Aetna', 'Humana', 'BlueCross', 'Cigna'])}. Agent identified ${rng.pick(['missing authorization renewal', 'pending clinical documentation', 'incorrect member ID on file'])} as likely root cause.`,
      category: 'ar_followup',
      recommendation: `Escalate to payer relations team. ${days > 90 ? 'Initiate formal appeal process.' : 'Follow up with payer for status update and provide missing documentation.'}`,
      reasoning: [`$${amount.toLocaleString()} aged ${days} days exceeds ${days > 90 ? '90' : '60'}-day AR target`, 'Automated payer follow-up sequence exhausted'],
      evidence: [{ source: 'workday', label: 'AR Balance', value: `$${amount.toLocaleString()} — ${days} days outstanding`, confidence: 0.98 }],
      targetType: 'account', targetId: `ar-${rng.int(10000, 99999)}`, targetLabel: `AR — ${fac.name} — $${amount.toLocaleString()}`,
      dollarAmount: amount * 100, sourceSystems: ['workday'],
      impact: { financial: `$${amount.toLocaleString()} cash collection` },
      confidence: rng.float(0.78, 0.92), priority: days > 90 ? 'high' : 'medium', governanceLevel: 3,
    };
  },
];

const workforceTemplates: DecisionTemplate[] = [
  (_res, fac, rng) => {
    const role = rng.pick(['RN', 'LPN', 'CNA', 'RT']);
    const shifts = rng.int(1, 5);
    const cost = rng.int(600, 1800) * shifts;
    return {
      title: `${rng.pick(['Day', 'Evening', 'Night'])} Shift ${role} Vacancy — ${fac.name} — ${shifts} Shift${shifts > 1 ? 's' : ''} Uncovered`,
      description: `${shifts} ${role} shift${shifts > 1 ? 's' : ''} uncovered at ${fac.name} due to ${rng.pick(['call-out', 'FMLA leave', 'resignation', 'schedule conflict'])}. ${shifts > 2 ? `Staffing falls below state minimum requirements.` : 'Coverage from agency pool recommended.'}`,
      category: 'shift_coverage',
      recommendation: `Assign agency ${role} from Ensign pool. Estimated cost: $${cost.toLocaleString()}. ${shifts > 2 ? 'Alert DON — below minimum staffing threshold.' : ''}`,
      reasoning: [`${shifts} uncovered ${role} shifts at ${fac.name}`, `Agency pool: ${rng.int(1, 4)} qualified candidates available`],
      evidence: [{ source: 'workday', label: 'Schedule Gap', value: `${shifts} ${role} shifts uncovered`, confidence: 0.99 }],
      targetType: 'schedule', targetId: `sched-${fac.id}-${rng.int(1, 30)}`, targetLabel: `${role} Coverage — ${fac.name}`,
      dollarAmount: cost * 100, sourceSystems: ['workday'],
      impact: { financial: `$${cost.toLocaleString()} agency cost`, operational: `${role} coverage gap` },
      confidence: rng.float(0.85, 0.95), priority: shifts > 2 ? 'critical' : 'high', governanceLevel: 3,
    };
  },
  (_res, fac, rng) => {
    const empName = `${rng.pick(FIRST_NAMES_F)} ${rng.pick(LAST_NAMES)}`;
    const credential = rng.pick(['CPR/BLS', 'RN License', 'CNA Certification', 'TB Test', 'Background Check']);
    const daysUntil = rng.int(5, 30);
    return {
      title: `Credential Expiry Alert — ${empName} — ${credential} Expires in ${daysUntil} Days`,
      description: `${credential} for ${empName} at ${fac.name} expires in ${daysUntil} days. ${daysUntil <= 14 ? 'Urgent: employee cannot work past expiry date per state regulations.' : 'Renewal notification sent; employee has not yet confirmed completion.'}`,
      category: 'credential_expiry',
      recommendation: `Contact ${empName} to confirm ${credential} renewal status. ${daysUntil <= 14 ? 'Suspend scheduling past expiry date until renewal confirmed.' : 'Send follow-up reminder.'}`,
      reasoning: [`${credential} expires in ${daysUntil} days`, `State regulations require current ${credential} for active employment`],
      evidence: [{ source: 'workday', label: 'Credential Status', value: `${credential}: expires in ${daysUntil} days`, confidence: 0.99 }],
      targetType: 'employee', targetId: `emp-${rng.int(10000, 99999)}`, targetLabel: `${empName} — ${fac.name}`,
      dollarAmount: null, sourceSystems: ['workday'],
      impact: { regulatory: `${credential} compliance`, operational: 'Staffing continuity' },
      confidence: rng.float(0.92, 0.99), priority: daysUntil <= 14 ? 'high' : 'medium', governanceLevel: 2,
    };
  },
];

const admissionsTemplates: DecisionTemplate[] = [
  (_res, fac, rng) => {
    const patientName = `${rng.pick(FIRST_NAMES_F.concat(FIRST_NAMES_M))} ${rng.pick(LAST_NAMES)}`;
    const hospital = rng.pick(['St. Mary\'s Medical Center', 'Regional Medical Center', 'University Hospital', 'Community General', 'Memorial Hospital']);
    const payer = rng.pick(['Medicare A', 'Managed Care — UHC', 'Managed Care — Aetna', 'Medicaid', 'Private Pay']);
    return {
      title: `New Referral — ${patientName} from ${hospital} — ${payer}`,
      description: `New admission referral for ${patientName}, ${rng.int(68, 92)}yo, from ${hospital}. Primary DX: ${rng.pick(Object.keys(ICD10_CODES))}. Payer: ${payer}. ${fac.name} census: ${fac.currentCensus}/${fac.licensedBeds} (${Math.round(fac.currentCensus / fac.licensedBeds * 100)}% occupancy). Estimated daily rate: $${rng.int(350, 750)}.`,
      category: 'admission_review',
      recommendation: `Accept referral. Bed available in ${rng.pick(['Wing A', 'Wing B', 'Wing C'])} room ${rng.int(1, 3)}${String(rng.int(1, 20)).padStart(2, '0')}. Verify insurance authorization within 24 hours.`,
      reasoning: ['Bed availability confirmed', `Payer ${payer} has active contract with facility`, `Clinical needs within facility capabilities`],
      evidence: [{ source: 'pcc', label: 'Census', value: `${fac.currentCensus}/${fac.licensedBeds}`, confidence: 0.99 }],
      targetType: 'referral', targetId: `ref-${rng.int(10000, 99999)}`, targetLabel: `${patientName} — ${hospital} → ${fac.name}`,
      dollarAmount: rng.int(350, 750) * rng.int(14, 90) * 100, sourceSystems: ['pcc'],
      impact: { financial: `Estimated stay revenue: $${(rng.int(350, 750) * rng.int(14, 90)).toLocaleString()}`, operational: 'Census management' },
      confidence: rng.float(0.82, 0.95), priority: 'medium', governanceLevel: 3,
    };
  },
];

const qualityTemplates: DecisionTemplate[] = [
  (res, fac, rng) => {
    const location = rng.pick(['hallway', 'bathroom', 'bedroom', 'dining room', 'therapy gym']);
    const injury = rng.pick(['no injury', 'minor bruise', 'skin tear', 'hip contusion', 'wrist sprain']);
    return {
      title: `Fall Investigation — ${res.firstName} ${res.lastName} (Room ${res.roomNumber}) — ${injury}`,
      description: `Fall incident for ${res.firstName} ${res.lastName}, Room ${res.roomNumber} at ${fac.name}. Location: ${location}. Outcome: ${injury}. ${res.age >= 85 ? 'High-risk resident (age 85+).' : ''} Agent reviewed care plan and identified ${rng.int(1, 3)} modifiable risk factors.`,
      category: 'fall_investigation',
      recommendation: `Update care plan with fall prevention interventions. ${injury !== 'no injury' ? 'Order X-ray to rule out fracture.' : 'Document in incident report.'} Increase monitoring frequency.`,
      reasoning: [`Fall in ${location}`, `${injury}`, `${rng.int(1, 3)} modifiable risk factors identified`],
      evidence: [{ source: 'pcc', label: 'Incident Report', value: `Fall in ${location}, ${injury}`, confidence: 0.99 }],
      targetType: 'resident', targetId: res.id, targetLabel: `${res.firstName} ${res.lastName} — Room ${res.roomNumber} — ${fac.name}`,
      dollarAmount: injury !== 'no injury' ? rng.int(500, 15000) * 100 : null, sourceSystems: ['pcc'],
      impact: { clinical: 'Fall prevention', quality: 'QM fall rate tracking' },
      confidence: rng.float(0.85, 0.96), priority: injury !== 'no injury' ? 'high' : 'medium', governanceLevel: 3,
    };
  },
];

const legalTemplates: DecisionTemplate[] = [
  (_res, fac, rng) => {
    const contractType = rng.pick(['vendor services', 'staffing agency', 'medical supplies', 'therapy services', 'dietary management']);
    const vendor = rng.pick(['MedLine Industries', 'Sysco Healthcare', 'RehabCare Group', 'Kindred Staffing', 'Omnicare Pharmacy']);
    const amount = rng.int(50000, 500000);
    return {
      title: `Contract Renewal Review — ${vendor} — ${contractType} — $${(amount / 1000).toFixed(0)}K/year`,
      description: `${contractType} contract with ${vendor} for ${fac.name} expires in ${rng.int(30, 90)} days. Current annual value: $${amount.toLocaleString()}. Agent benchmarked against ${rng.int(3, 6)} comparable Ensign facility contracts and identified ${rng.pick(['pricing 8% above portfolio average', 'favorable terms relative to market', 'missing SLA enforcement clauses', 'auto-renewal clause requiring attention'])}.`,
      category: 'contract_renewal',
      recommendation: `Review contract terms with legal. ${rng.next() > 0.5 ? 'Negotiate pricing reduction before renewal.' : 'Proceed with renewal under current terms.'}`,
      reasoning: ['Contract approaching expiry', `Portfolio benchmarking completed across ${rng.int(3, 6)} comparable facilities`],
      evidence: [{ source: 'workday', label: 'Contract Value', value: `$${amount.toLocaleString()}/year`, confidence: 0.97 }],
      targetType: 'contract', targetId: `contract-${rng.int(1000, 9999)}`, targetLabel: `${vendor} — ${contractType} — ${fac.name}`,
      dollarAmount: amount * 100, sourceSystems: ['workday', 'm365'],
      impact: { financial: `$${amount.toLocaleString()}/year contract`, legal: 'Contract compliance' },
      confidence: rng.float(0.80, 0.92), priority: 'medium', governanceLevel: 4,
    };
  },
];

const operationsTemplates: DecisionTemplate[] = [
  (_res, fac, rng) => {
    const system = rng.pick(['HVAC', 'elevator', 'fire suppression', 'generator', 'boiler', 'kitchen equipment']);
    const cost = rng.int(2000, 25000);
    return {
      title: `Maintenance Work Order — ${fac.name} — ${system} — $${cost.toLocaleString()}`,
      description: `${system} at ${fac.name} requires ${rng.pick(['emergency repair', 'scheduled maintenance', 'replacement', 'inspection'])}. Vendor quote: $${cost.toLocaleString()}. ${system === 'fire suppression' || system === 'elevator' ? 'Life safety system — expedited approval required.' : 'Standard maintenance request.'}`,
      category: 'work_order',
      recommendation: `Approve ${system} ${rng.pick(['repair', 'maintenance'])} at $${cost.toLocaleString()}. ${cost > 10000 ? 'Requires regional director approval (>$10K threshold).' : ''}`,
      reasoning: [`${system} maintenance required`, `Vendor quote: $${cost.toLocaleString()}`],
      evidence: [{ source: 'internal', label: 'Work Order', value: `${system} — $${cost.toLocaleString()}`, confidence: 0.97 }],
      targetType: 'work_order', targetId: `wo-${rng.int(1000, 9999)}`, targetLabel: `${system} — ${fac.name}`,
      dollarAmount: cost * 100, sourceSystems: ['internal'],
      impact: { financial: `$${cost.toLocaleString()}`, operational: `${system} maintenance` },
      confidence: rng.float(0.88, 0.97), priority: (system === 'fire suppression' || system === 'elevator') ? 'critical' : 'medium', governanceLevel: cost > 10000 ? 4 : 3,
    };
  },
];

const strategicTemplates: DecisionTemplate[] = [
  (_res, fac, rng) => {
    const targetFacility = rng.pick(['Sunrise Manor', 'Valley View SNF', 'Greenwood Health', 'Riverside Care', 'Oak Hill Nursing']);
    const beds = rng.int(60, 200);
    const askingPrice = rng.int(3, 15);
    return {
      title: `Acquisition Target — ${targetFacility} — ${fac.state} — ${beds} Beds — $${askingPrice}M`,
      description: `${targetFacility} (${beds} beds, ${fac.state}) listed for acquisition at $${askingPrice}M. Current occupancy: ${rng.int(65, 90)}%. CMS rating: ${rng.int(2, 4)} stars. ${rng.int(5, 25)} miles from nearest Ensign facility (${fac.name}). Agent analysis: ${rng.pick(['strong market fundamentals, underperforming management', 'competitive market, premium pricing', 'turnaround opportunity with significant capital needs'])}.`,
      category: 'acquisition_analysis',
      recommendation: `${rng.next() > 0.5 ? 'Advance to due diligence phase.' : 'Monitor — pricing above target range. Revisit if price adjusts.'} Assign to M&A team for detailed financial modeling.`,
      reasoning: [`${beds}-bed facility in ${fac.state} market`, `Asking price $${askingPrice}M`, 'Market analysis and competitive positioning reviewed'],
      evidence: [{ source: 'internal', label: 'Listing Details', value: `${beds} beds, $${askingPrice}M asking`, confidence: 0.90 }],
      targetType: 'acquisition', targetId: `acq-${rng.int(100, 999)}`, targetLabel: `${targetFacility} — ${fac.state} — $${askingPrice}M`,
      dollarAmount: askingPrice * 1000000 * 100, sourceSystems: ['internal', 'cms'],
      impact: { strategic: `Portfolio expansion — ${beds} beds`, financial: `$${askingPrice}M acquisition` },
      confidence: rng.float(0.70, 0.88), priority: 'medium', governanceLevel: 6,
    };
  },
];

export const DOMAIN_TEMPLATES: Record<string, { agentId: string; domain: string; templates: DecisionTemplate[] }> = {
  clinical: { agentId: 'clinical-operations', domain: 'clinical', templates: clinicalTemplates },
  financial: { agentId: 'financial-operations', domain: 'financial', templates: financialTemplates },
  workforce: { agentId: 'workforce-operations', domain: 'workforce', templates: workforceTemplates },
  admissions: { agentId: 'admissions-operations', domain: 'admissions', templates: admissionsTemplates },
  quality: { agentId: 'quality-safety', domain: 'quality', templates: qualityTemplates },
  legal: { agentId: 'legal-compliance', domain: 'legal', templates: legalTemplates },
  operations: { agentId: 'operations-facilities', domain: 'operations', templates: operationsTemplates },
  strategic: { agentId: 'strategic-ma', domain: 'strategic', templates: strategicTemplates },
  revenue: { agentId: 'revenue-cycle', domain: 'financial', templates: financialTemplates },
};

// ---------------------------------------------------------------------------
// Audit hash computation — matches audit-engine.ts exactly
// ---------------------------------------------------------------------------

export interface AuditEntryFields {
  traceId: string;
  parentId: string | null;
  timestamp: string;
  facilityLocalTime: string;
  agentId: string;
  agentVersion: string;
  modelId: string;
  action: string;
  actionCategory: string;
  governanceLevel: number;
  target: object;
  input: object;
  decision: object;
  result: object;
  humanOverride: object | null;
}

export const GENESIS_HASH = '0'.repeat(64);

export function computeAuditHash(entry: AuditEntryFields, previousHash: string): string {
  const payload: Record<string, unknown> = {
    traceId: entry.traceId,
    parentId: entry.parentId,
    timestamp: entry.timestamp,
    facilityLocalTime: entry.facilityLocalTime,
    agentId: entry.agentId,
    agentVersion: entry.agentVersion,
    modelId: entry.modelId,
    action: entry.action,
    actionCategory: entry.actionCategory,
    governanceLevel: entry.governanceLevel,
    target: entry.target,
    input: entry.input,
    decision: entry.decision,
    result: entry.result,
    humanOverride: entry.humanOverride,
    previousHash,
  };

  const canonical = JSON.stringify(payload, Object.keys(payload).sort());
  return createHash('sha256').update(canonical).digest('hex');
}
