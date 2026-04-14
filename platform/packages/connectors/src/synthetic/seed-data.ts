/**
 * Shared seed data for all synthetic MCP connectors.
 *
 * Deterministic generation: same facilityId/residentId/employeeId always
 * produces the same output. Uses a simple seeded hash — no crypto needed.
 */

// ---------------------------------------------------------------------------
// Seeded random number generator (deterministic)
// ---------------------------------------------------------------------------

export function seedHash(input: string): number {
  let h = 0;
  for (let i = 0; i < input.length; i++) {
    h = ((h << 5) - h + input.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

/** Deterministic random in [0, 1) from a seed string */
export function seededRandom(seed: string): number {
  const h = seedHash(seed);
  return (h % 10000) / 10000;
}

/** Pick one item from array deterministically */
export function pick<T>(arr: readonly T[], seed: string): T {
  return arr[seedHash(seed) % arr.length];
}

/** Pick N items from array deterministically (no duplicates) */
export function pickN<T>(arr: readonly T[], n: number, seed: string): T[] {
  const copy = [...arr];
  const result: T[] = [];
  for (let i = 0; i < Math.min(n, copy.length); i++) {
    const idx = seedHash(`${seed}-${i}`) % copy.length;
    result.push(copy[idx]);
    copy.splice(idx, 1);
  }
  return result;
}

/** Deterministic integer in [min, max] inclusive */
export function seededInt(min: number, max: number, seed: string): number {
  return min + (seedHash(seed) % (max - min + 1));
}

/** Deterministic float in [min, max) with decimals */
export function seededFloat(min: number, max: number, seed: string, decimals = 1): number {
  const raw = min + seededRandom(seed) * (max - min);
  const factor = Math.pow(10, decimals);
  return Math.round(raw * factor) / factor;
}

/** Generate a date string N days ago from 2026-04-13 */
export function daysAgo(n: number): string {
  const base = new Date('2026-04-13T12:00:00Z');
  base.setDate(base.getDate() - n);
  return base.toISOString().split('T')[0];
}

/** Generate an ISO datetime string N days ago */
export function daysAgoISO(n: number): string {
  const base = new Date('2026-04-13T12:00:00Z');
  base.setDate(base.getDate() - n);
  return base.toISOString();
}

// ---------------------------------------------------------------------------
// 20 Demo Facilities (subset of 330)
// ---------------------------------------------------------------------------

export interface DemoFacility {
  facilityId: string;
  name: string;
  state: string;
  city: string;
  region: string;
  totalBeds: number;
  ccn: string;
  administrator: string;
  don: string;
}

export const DEMO_FACILITIES: readonly DemoFacility[] = [
  { facilityId: 'FAC-AZ-001', name: 'Desert Springs Care Center', state: 'AZ', city: 'Phoenix', region: 'Southwest', totalBeds: 120, ccn: '035001', administrator: 'Karen Whitfield', don: 'Sarah Martinez' },
  { facilityId: 'FAC-AZ-002', name: 'Sunflower Rehabilitation', state: 'AZ', city: 'Tucson', region: 'Southwest', totalBeds: 90, ccn: '035002', administrator: 'David Kowalski', don: 'Angela Hernandez' },
  { facilityId: 'FAC-CA-001', name: 'Pacific Gardens SNF', state: 'CA', city: 'San Diego', region: 'Pacific', totalBeds: 150, ccn: '055001', administrator: 'Michelle Tanaka', don: 'Lisa Foster' },
  { facilityId: 'FAC-CA-002', name: 'Heritage Oaks Nursing', state: 'CA', city: 'Sacramento', region: 'Pacific', totalBeds: 100, ccn: '055002', administrator: 'Brian Caldwell', don: 'Diane Nguyen' },
  { facilityId: 'FAC-CA-003', name: 'Bayview Senior Living', state: 'CA', city: 'Fresno', region: 'Pacific', totalBeds: 80, ccn: '055003', administrator: 'Jennifer Okafor', don: 'Brenda Collins' },
  { facilityId: 'FAC-CO-001', name: 'Mountain View Health', state: 'CO', city: 'Denver', region: 'Mountain', totalBeds: 110, ccn: '065001', administrator: 'Thomas Regan', don: 'Patricia Pearson' },
  { facilityId: 'FAC-CO-002', name: 'Lakeshore Care Center', state: 'CO', city: 'Colorado Springs', region: 'Mountain', totalBeds: 85, ccn: '065002', administrator: 'Amanda Briggs', don: 'Amanda Kim' },
  { facilityId: 'FAC-ID-001', name: 'Pinecrest Rehabilitation', state: 'ID', city: 'Boise', region: 'Mountain', totalBeds: 75, ccn: '135001', administrator: 'Nathan Vega', don: 'Rachel Washington' },
  { facilityId: 'FAC-NV-001', name: 'Valley Gardens SNF', state: 'NV', city: 'Las Vegas', region: 'Southwest', totalBeds: 130, ccn: '295001', administrator: 'Rachel Morrison', don: 'Melissa Adams' },
  { facilityId: 'FAC-NV-002', name: 'Riverside Manor', state: 'NV', city: 'Reno', region: 'Southwest', totalBeds: 70, ccn: '295002', administrator: 'Carlos Chen', don: 'Stephanie Taylor' },
  { facilityId: 'FAC-OR-001', name: 'Golden Acres Nursing', state: 'OR', city: 'Portland', region: 'Pacific', totalBeds: 95, ccn: '385001', administrator: 'Patricia Patterson', don: 'Christina Thomas' },
  { facilityId: 'FAC-OR-002', name: 'Cedar Ridge Health', state: 'OR', city: 'Salem', region: 'Pacific', totalBeds: 60, ccn: '385002', administrator: 'Robert Sullivan', don: 'Rebecca Jackson' },
  { facilityId: 'FAC-TX-001', name: 'Willow Creek Care', state: 'TX', city: 'Dallas', region: 'Southwest', totalBeds: 140, ccn: '455001', administrator: 'Sandra Rivera', don: 'Laura White' },
  { facilityId: 'FAC-TX-002', name: 'Oakwood Senior Care', state: 'TX', city: 'Houston', region: 'Southwest', totalBeds: 115, ccn: '455002', administrator: 'James Bennett', don: 'Kelly Harris' },
  { facilityId: 'FAC-TX-003', name: 'Harbor View SNF', state: 'TX', city: 'Austin', region: 'Southwest', totalBeds: 90, ccn: '455003', administrator: 'Linda Cooper', don: 'Maria Martin' },
  { facilityId: 'FAC-UT-001', name: 'Summit Rehabilitation', state: 'UT', city: 'Salt Lake City', region: 'Mountain', totalBeds: 100, ccn: '465001', administrator: 'Michael Morgan', don: 'Tamara Garcia' },
  { facilityId: 'FAC-UT-002', name: 'Meadow Springs Care', state: 'UT', city: 'Provo', region: 'Mountain', totalBeds: 65, ccn: '465002', administrator: 'Barbara Reed', don: 'Nicole Robinson' },
  { facilityId: 'FAC-WA-001', name: 'Forest Glen Nursing', state: 'WA', city: 'Seattle', region: 'Pacific', totalBeds: 120, ccn: '505001', administrator: 'William Bailey', don: 'Heather Clark' },
  { facilityId: 'FAC-WA-002', name: 'Coastal Breeze Manor', state: 'WA', city: 'Spokane', region: 'Pacific', totalBeds: 80, ccn: '505002', administrator: 'Elizabeth Brooks', don: 'Teresa Rodriguez' },
  { facilityId: 'FAC-SC-001', name: 'Magnolia Gardens', state: 'SC', city: 'Charleston', region: 'Southeast', totalBeds: 95, ccn: '425001', administrator: 'Richard Sanders', don: 'Donna Lewis' },
] as const;

export function getFacility(facilityId: string): DemoFacility | undefined {
  return DEMO_FACILITIES.find((f) => f.facilityId === facilityId);
}

export function getFacilityByCCN(ccn: string): DemoFacility | undefined {
  return DEMO_FACILITIES.find((f) => f.ccn === ccn);
}

// ---------------------------------------------------------------------------
// Resident Pool — 25 per facility (deterministic)
// ---------------------------------------------------------------------------

const FIRST_NAMES_M = ['James', 'Robert', 'William', 'Richard', 'Charles', 'Joseph', 'Thomas', 'Donald', 'George', 'Edward', 'Frank', 'Harold', 'Raymond', 'Arthur', 'Albert'] as const;
const FIRST_NAMES_F = ['Mary', 'Dorothy', 'Helen', 'Margaret', 'Ruth', 'Virginia', 'Elizabeth', 'Frances', 'Martha', 'Mildred', 'Evelyn', 'Alice', 'Louise', 'Jean', 'Gladys'] as const;
const LAST_NAMES = [
  'Anderson', 'Baker', 'Campbell', 'Davis', 'Edwards', 'Foster', 'Garcia', 'Harris',
  'Ingram', 'Johnson', 'Kelly', 'Lopez', 'Mitchell', 'Nelson', 'Owens', 'Patel',
  'Quinn', 'Robinson', 'Smith', 'Thompson', 'Underwood', 'Vasquez', 'Williams', 'Young', 'Zimmerman',
] as const;

export interface SyntheticResident {
  residentId: string;
  facilityId: string;
  firstName: string;
  lastName: string;
  gender: 'M' | 'F';
  dateOfBirth: string;
  roomNumber: string;
  bedNumber: string;
  admissionDate: string;
  payerCode: string;
  primaryDiagnosisCode: string;
  primaryDiagnosisDescription: string;
}

const PAYER_CODES = ['MA', 'MA', 'MA', 'MC', 'MC', 'MCO', 'MCO', 'PP', 'VA'] as const;

const PRIMARY_DIAGNOSES: readonly { code: string; desc: string }[] = [
  { code: 'I50.9', desc: 'Heart failure, unspecified' },
  { code: 'J44.1', desc: 'COPD with acute exacerbation' },
  { code: 'S72.001A', desc: 'Fracture of unspecified part of neck of right femur' },
  { code: 'I63.9', desc: 'Cerebral infarction, unspecified' },
  { code: 'G30.9', desc: "Alzheimer's disease, unspecified" },
  { code: 'E11.65', desc: 'Type 2 diabetes with hyperglycemia' },
  { code: 'M17.11', desc: 'Primary osteoarthritis, right knee' },
  { code: 'N18.6', desc: 'End stage renal disease' },
  { code: 'J18.9', desc: 'Pneumonia, unspecified organism' },
  { code: 'S32.009A', desc: 'Unspecified fracture of unspecified lumbar vertebra' },
  { code: 'I25.10', desc: 'Atherosclerotic heart disease of native coronary artery' },
  { code: 'G20', desc: "Parkinson's disease" },
  { code: 'M80.08XA', desc: 'Age-related osteoporosis with pathological fracture' },
  { code: 'F03.90', desc: 'Unspecified dementia without behavioral disturbance' },
  { code: 'J96.11', desc: 'Chronic respiratory failure with hypoxia' },
];

export function getResidentPool(facilityId: string): SyntheticResident[] {
  const residents: SyntheticResident[] = [];
  for (let i = 0; i < 25; i++) {
    const seed = `${facilityId}-res-${i}`;
    const isFemale = seedHash(`${seed}-gender`) % 2 === 0;
    const firstName = isFemale
      ? pick(FIRST_NAMES_F, `${seed}-fn`)
      : pick(FIRST_NAMES_M, `${seed}-fn`);
    const lastName = LAST_NAMES[i]; // guaranteed unique within facility
    const dx = pick(PRIMARY_DIAGNOSES, `${seed}-dx`);
    const admitDaysAgo = seededInt(7, 900, `${seed}-admit`);
    const birthYear = seededInt(1930, 1960, `${seed}-dob`);
    const birthMonth = seededInt(1, 12, `${seed}-dobm`);
    const birthDay = seededInt(1, 28, `${seed}-dobd`);
    const wing = pick(['A', 'B', 'C'], `${seed}-wing`);
    const roomNum = seededInt(100, 350, `${seed}-room`);

    residents.push({
      residentId: `RES-${seedHash(seed).toString(36).toUpperCase().slice(0, 8)}`,
      facilityId,
      firstName,
      lastName,
      gender: isFemale ? 'F' : 'M',
      dateOfBirth: `${birthYear}-${String(birthMonth).padStart(2, '0')}-${String(birthDay).padStart(2, '0')}`,
      roomNumber: `${roomNum}`,
      bedNumber: `${roomNum}${wing}`,
      admissionDate: daysAgo(admitDaysAgo),
      payerCode: pick(PAYER_CODES, `${seed}-payer`),
      primaryDiagnosisCode: dx.code,
      primaryDiagnosisDescription: dx.desc,
    });
  }
  return residents;
}

// ---------------------------------------------------------------------------
// Employee Pool — per facility (deterministic)
// ---------------------------------------------------------------------------

const EMP_FIRST_NAMES = [
  'Maria', 'James', 'Patricia', 'Robert', 'Jennifer', 'Michael', 'Linda', 'William',
  'Elizabeth', 'David', 'Susan', 'Richard', 'Jessica', 'Joseph', 'Sarah', 'Thomas',
  'Karen', 'Christopher', 'Nancy', 'Daniel', 'Lisa', 'Matthew', 'Betty', 'Anthony',
  'Sandra', 'Mark', 'Ashley', 'Steven', 'Kimberly', 'Andrew', 'Donna', 'Joshua',
  'Emily', 'Kenneth', 'Michelle', 'Kevin', 'Carol', 'Brian', 'Amanda', 'George',
] as const;

const EMP_LAST_NAMES = [
  'Santos', 'Rodriguez', 'Chen', 'Kim', 'Walsh', 'Park', 'Torres', 'Johnson',
  'Williams', 'Brown', 'Jones', 'Miller', 'Wilson', 'Moore', 'Taylor', 'Thomas',
  'Jackson', 'White', 'Harris', 'Martin', 'Garcia', 'Martinez', 'Robinson', 'Clark',
  'Lewis', 'Lee', 'Walker', 'Hall', 'Allen', 'Young', 'King', 'Wright',
  'Scott', 'Adams', 'Nelson', 'Hill', 'Ramirez', 'Campbell', 'Mitchell', 'Carter',
] as const;

export type EmployeeRole = 'CNA' | 'LPN' | 'RN' | 'Dietary' | 'Housekeeping' | 'Admin' | 'PT' | 'OT' | 'SLP';

export interface SyntheticEmployee {
  employeeId: string;
  workerId: string;
  firstName: string;
  lastName: string;
  email: string;
  facilityId: string;
  role: EmployeeRole;
  jobTitle: string;
  jobCode: string;
  jobFamily: string;
  department: string;
  departmentCode: string;
  hourlyRate: number;
  employeeType: 'full_time' | 'part_time' | 'prn';
  hireDate: string;
  status: 'active' | 'active' | 'active' | 'leave'; // weighted active
  hasExpiringCredential: boolean;
}

const ROLE_CONFIG: Record<EmployeeRole, { titles: string[]; codes: string[]; family: string; dept: string; deptCode: string; rateMin: number; rateMax: number }> = {
  CNA: { titles: ['Certified Nursing Assistant', 'CNA - Float', 'CNA - Night Shift'], codes: ['CNA', 'CNA-FLT', 'CNA-NS'], family: 'Nursing', dept: 'Nursing Services', deptCode: 'NRS', rateMin: 16, rateMax: 22 },
  LPN: { titles: ['Licensed Practical Nurse', 'LPN - Charge', 'LPN - Med Pass'], codes: ['LPN', 'LPN-CHG', 'LPN-MP'], family: 'Nursing', dept: 'Nursing Services', deptCode: 'NRS', rateMin: 28, rateMax: 35 },
  RN: { titles: ['Registered Nurse', 'RN - Charge', 'RN - Supervisor', 'RN - MDS Coordinator'], codes: ['RN', 'RN-CHG', 'RN-SUP', 'RN-MDS'], family: 'Nursing', dept: 'Nursing Services', deptCode: 'NRS', rateMin: 38, rateMax: 52 },
  Dietary: { titles: ['Dietary Aide', 'Cook', 'Dietary Manager'], codes: ['DIT-AID', 'DIT-COOK', 'DIT-MGR'], family: 'Dietary', dept: 'Dietary', deptCode: 'DIT', rateMin: 14, rateMax: 22 },
  Housekeeping: { titles: ['Housekeeper', 'Laundry Aide', 'EVS Lead'], codes: ['EVS-HK', 'EVS-LND', 'EVS-LD'], family: 'Environmental Services', dept: 'Environmental Services', deptCode: 'ENV', rateMin: 14, rateMax: 19 },
  Admin: { titles: ['Business Office Manager', 'Receptionist', 'Admissions Coordinator', 'HR Coordinator'], codes: ['ADM-BOM', 'ADM-REC', 'ADM-ADM', 'ADM-HR'], family: 'Administration', dept: 'Administration', deptCode: 'ADM', rateMin: 18, rateMax: 32 },
  PT: { titles: ['Physical Therapist', 'Physical Therapy Assistant'], codes: ['PT', 'PTA'], family: 'Therapy', dept: 'Therapy Services', deptCode: 'THR', rateMin: 35, rateMax: 55 },
  OT: { titles: ['Occupational Therapist', 'Occupational Therapy Assistant'], codes: ['OT', 'OTA'], family: 'Therapy', dept: 'Therapy Services', deptCode: 'THR', rateMin: 35, rateMax: 52 },
  SLP: { titles: ['Speech-Language Pathologist'], codes: ['SLP'], family: 'Therapy', dept: 'Therapy Services', deptCode: 'THR', rateMin: 40, rateMax: 55 },
};

/** Role distribution: 40% CNA, 25% LPN, 15% RN, 10% Dietary/Housekeeping, 10% Admin/Therapy */
const ROLE_DISTRIBUTION: readonly EmployeeRole[] = [
  'CNA', 'CNA', 'CNA', 'CNA', 'CNA', 'CNA', 'CNA', 'CNA',
  'LPN', 'LPN', 'LPN', 'LPN', 'LPN',
  'RN', 'RN', 'RN',
  'Dietary', 'Housekeeping',
  'Admin', 'PT', 'OT', 'SLP',
];

export function getEmployeePool(facilityId: string): SyntheticEmployee[] {
  const facility = getFacility(facilityId);
  if (!facility) return [];

  // Scale employee count with bed count: ~1.2 employees per bed
  const count = Math.round(facility.totalBeds * 1.2);
  const employees: SyntheticEmployee[] = [];

  for (let i = 0; i < count; i++) {
    const seed = `${facilityId}-emp-${i}`;
    const role = ROLE_DISTRIBUTION[i % ROLE_DISTRIBUTION.length];
    const config = ROLE_CONFIG[role];
    const firstName = pick(EMP_FIRST_NAMES, `${seed}-fn`);
    const lastName = pick(EMP_LAST_NAMES, `${seed}-ln`);
    const hireDaysAgo = seededInt(30, 2500, `${seed}-hire`);
    const hasExpiring = i < 5; // first 5 employees per facility have expiring creds

    employees.push({
      employeeId: `EMP-${seedHash(seed).toString(36).toUpperCase().slice(0, 6)}`,
      workerId: `WD-2024-${String(seedHash(seed) % 100000).padStart(5, '0')}`,
      firstName,
      lastName,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@ensigngroup.net`,
      facilityId,
      role,
      jobTitle: pick(config.titles, `${seed}-title`),
      jobCode: pick(config.codes, `${seed}-code`),
      jobFamily: config.family,
      department: config.dept,
      departmentCode: config.deptCode,
      hourlyRate: seededFloat(config.rateMin, config.rateMax, `${seed}-rate`, 2),
      employeeType: i % 7 === 0 ? 'part_time' : i % 11 === 0 ? 'prn' : 'full_time',
      hireDate: daysAgo(hireDaysAgo),
      status: i % 20 === 0 ? 'leave' : 'active',
      hasExpiringCredential: hasExpiring,
    });
  }
  return employees;
}

// ---------------------------------------------------------------------------
// Shared Clinical Data Pools
// ---------------------------------------------------------------------------

export const DRUG_NAMES: readonly { brand: string; generic: string; dosage: string; route: string; frequency: string; isPsychotropic: boolean; isControlled: boolean }[] = [
  { brand: 'Aricept', generic: 'Donepezil', dosage: '10mg', route: 'PO', frequency: 'QD', isPsychotropic: false, isControlled: false },
  { brand: 'Prinivil', generic: 'Lisinopril', dosage: '20mg', route: 'PO', frequency: 'BID', isPsychotropic: false, isControlled: false },
  { brand: 'Glucophage', generic: 'Metformin', dosage: '500mg', route: 'PO', frequency: 'BID', isPsychotropic: false, isControlled: false },
  { brand: 'Coumadin', generic: 'Warfarin', dosage: '5mg', route: 'PO', frequency: 'QD', isPsychotropic: false, isControlled: false },
  { brand: 'Norvasc', generic: 'Amlodipine', dosage: '5mg', route: 'PO', frequency: 'QD', isPsychotropic: false, isControlled: false },
  { brand: 'Lipitor', generic: 'Atorvastatin', dosage: '40mg', route: 'PO', frequency: 'QHS', isPsychotropic: false, isControlled: false },
  { brand: 'Lasix', generic: 'Furosemide', dosage: '40mg', route: 'PO', frequency: 'QD', isPsychotropic: false, isControlled: false },
  { brand: 'Synthroid', generic: 'Levothyroxine', dosage: '50mcg', route: 'PO', frequency: 'QAM', isPsychotropic: false, isControlled: false },
  { brand: 'Protonix', generic: 'Pantoprazole', dosage: '40mg', route: 'PO', frequency: 'QD', isPsychotropic: false, isControlled: false },
  { brand: 'Seroquel', generic: 'Quetiapine', dosage: '25mg', route: 'PO', frequency: 'QHS', isPsychotropic: true, isControlled: false },
  { brand: 'Ativan', generic: 'Lorazepam', dosage: '0.5mg', route: 'PO', frequency: 'PRN', isPsychotropic: true, isControlled: true },
  { brand: 'Haldol', generic: 'Haloperidol', dosage: '1mg', route: 'PO', frequency: 'BID', isPsychotropic: true, isControlled: false },
  { brand: 'Zoloft', generic: 'Sertraline', dosage: '50mg', route: 'PO', frequency: 'QD', isPsychotropic: true, isControlled: false },
  { brand: 'Lovenox', generic: 'Enoxaparin', dosage: '40mg', route: 'SubQ', frequency: 'QD', isPsychotropic: false, isControlled: false },
  { brand: 'Humalog', generic: 'Insulin Lispro', dosage: '10 units', route: 'SubQ', frequency: 'TID AC', isPsychotropic: false, isControlled: false },
  { brand: 'Tylenol', generic: 'Acetaminophen', dosage: '650mg', route: 'PO', frequency: 'Q6H PRN', isPsychotropic: false, isControlled: false },
  { brand: 'Colace', generic: 'Docusate Sodium', dosage: '100mg', route: 'PO', frequency: 'BID', isPsychotropic: false, isControlled: false },
  { brand: 'Silvadene', generic: 'Silver Sulfadiazine', dosage: '1%', route: 'Topical', frequency: 'BID', isPsychotropic: false, isControlled: false },
  { brand: 'Rocephin', generic: 'Ceftriaxone', dosage: '1g', route: 'IV', frequency: 'QD', isPsychotropic: false, isControlled: false },
  { brand: 'Morphine', generic: 'Morphine Sulfate', dosage: '15mg', route: 'PO', frequency: 'Q4H PRN', isPsychotropic: false, isControlled: true },
];

export const LAB_TESTS: readonly { name: string; code: string; unit: string; refRange: string; normalMin: number; normalMax: number; physioMin: number; physioMax: number }[] = [
  { name: 'WBC', code: 'CBC-WBC', unit: 'K/uL', refRange: '4.5-11.0', normalMin: 4.5, normalMax: 11.0, physioMin: 2.0, physioMax: 25.0 },
  { name: 'Hemoglobin', code: 'CBC-HGB', unit: 'g/dL', refRange: '12.0-17.5', normalMin: 12.0, normalMax: 17.5, physioMin: 6.0, physioMax: 20.0 },
  { name: 'Hematocrit', code: 'CBC-HCT', unit: '%', refRange: '36-51', normalMin: 36, normalMax: 51, physioMin: 20, physioMax: 60 },
  { name: 'Platelets', code: 'CBC-PLT', unit: 'K/uL', refRange: '150-400', normalMin: 150, normalMax: 400, physioMin: 50, physioMax: 700 },
  { name: 'Sodium', code: 'BMP-NA', unit: 'mEq/L', refRange: '136-145', normalMin: 136, normalMax: 145, physioMin: 120, physioMax: 160 },
  { name: 'Potassium', code: 'BMP-K', unit: 'mEq/L', refRange: '3.5-5.0', normalMin: 3.5, normalMax: 5.0, physioMin: 2.5, physioMax: 6.5 },
  { name: 'Chloride', code: 'BMP-CL', unit: 'mEq/L', refRange: '98-106', normalMin: 98, normalMax: 106, physioMin: 85, physioMax: 115 },
  { name: 'CO2', code: 'BMP-CO2', unit: 'mEq/L', refRange: '23-29', normalMin: 23, normalMax: 29, physioMin: 15, physioMax: 40 },
  { name: 'BUN', code: 'BMP-BUN', unit: 'mg/dL', refRange: '7-20', normalMin: 7, normalMax: 20, physioMin: 3, physioMax: 80 },
  { name: 'Creatinine', code: 'BMP-CREAT', unit: 'mg/dL', refRange: '0.7-1.3', normalMin: 0.7, normalMax: 1.3, physioMin: 0.4, physioMax: 8.0 },
  { name: 'Glucose', code: 'BMP-GLU', unit: 'mg/dL', refRange: '70-100', normalMin: 70, normalMax: 100, physioMin: 40, physioMax: 400 },
  { name: 'INR', code: 'COAG-INR', unit: '', refRange: '0.8-1.1', normalMin: 0.8, normalMax: 1.1, physioMin: 0.5, physioMax: 5.0 },
  { name: 'HbA1c', code: 'A1C', unit: '%', refRange: '4.0-5.6', normalMin: 4.0, normalMax: 5.6, physioMin: 3.5, physioMax: 14.0 },
  { name: 'Albumin', code: 'CHEM-ALB', unit: 'g/dL', refRange: '3.5-5.5', normalMin: 3.5, normalMax: 5.5, physioMin: 1.5, physioMax: 6.5 },
  { name: 'Prealbumin', code: 'CHEM-PREALB', unit: 'mg/dL', refRange: '15-36', normalMin: 15, normalMax: 36, physioMin: 5, physioMax: 45 },
];

export const PHYSICIAN_NAMES = [
  'Dr. Michael Sharma', 'Dr. Sarah Chen', 'Dr. Robert Williams', 'Dr. Emily Brown',
  'Dr. James Patel', 'Dr. Lisa Nguyen', 'Dr. David Garcia', 'Dr. Jennifer Kim',
  'Dr. Thomas Martinez', 'Dr. Amanda Foster',
] as const;

export const PHYSICIAN_NPIS = [
  '1234567890', '2345678901', '3456789012', '4567890123', '5678901234',
  '6789012345', '7890123456', '8901234567', '9012345678', '0123456789',
] as const;

export const CMS_FTAGS: readonly { tag: string; desc: string }[] = [
  { tag: 'F689', desc: 'Free of Accident Hazards/Supervision/Devices' },
  { tag: 'F684', desc: 'Quality of Care' },
  { tag: 'F880', desc: 'Infection Prevention & Control' },
  { tag: 'F757', desc: 'Drug Regimen is Free From Unnecessary Drugs' },
  { tag: 'F758', desc: 'Free From Unnecessary Psychotropic Meds/PRN Use' },
  { tag: 'F656', desc: 'Develop/Implement Comprehensive Care Plan' },
  { tag: 'F657', desc: 'Care Plan Revised to Meet Resident Needs' },
  { tag: 'F686', desc: 'Treatment/Svcs to Prevent/Heal Pressure Ulcers' },
  { tag: 'F812', desc: 'Food Procurement, Store/Prepare/Serve - Loss of Nutrients' },
  { tag: 'F838', desc: 'Facility Assessment' },
  { tag: 'F600', desc: 'Free from Abuse and Neglect' },
  { tag: 'F641', desc: 'Accuracy of Assessments' },
  { tag: 'F761', desc: 'Label/Store Drugs and Biologicals' },
  { tag: 'F583', desc: 'Personal Privacy/Confidentiality' },
  { tag: 'F585', desc: 'Grievances' },
];
