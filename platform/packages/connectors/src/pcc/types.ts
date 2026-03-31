/**
 * PCC-specific data types and mapping functions.
 *
 * These represent the wire format from PCC's REST API. Mapping functions
 * convert PCC responses to @snf/core types for use throughout the platform.
 */

import type { Resident, PayerType, CareLevel } from '@snf/core';

// ---------------------------------------------------------------------------
// PCC API Response Envelope
// ---------------------------------------------------------------------------

export interface PCCApiResponse<T> {
  data: T;
  meta: {
    totalCount: number;
    pageSize: number;
    pageNumber: number;
    hasMore: boolean;
  };
}

export interface PCCApiError {
  code: PCCErrorCode;
  message: string;
  details: string | null;
  requestId: string;
}

export type PCCErrorCode =
  | 'INVALID_TOKEN'
  | 'TOKEN_EXPIRED'
  | 'INSUFFICIENT_SCOPE'
  | 'RESOURCE_NOT_FOUND'
  | 'RATE_LIMIT_EXCEEDED'
  | 'FACILITY_ACCESS_DENIED'
  | 'VALIDATION_ERROR'
  | 'INTERNAL_ERROR'
  | 'SERVICE_UNAVAILABLE';

// ---------------------------------------------------------------------------
// PCC Resident
// ---------------------------------------------------------------------------

export interface PCCResident {
  residentId: string;
  facilityId: string;
  firstName: string;
  middleName: string | null;
  lastName: string;
  dateOfBirth: string;
  gender: 'M' | 'F' | 'O';
  ssn: string | null;
  medicareNumber: string | null;
  medicaidNumber: string | null;
  roomNumber: string;
  bedNumber: string;
  admissionDate: string;
  dischargeDate: string | null;
  payerCode: string;
  payerName: string;
  primaryDiagnosisCode: string;
  primaryDiagnosisDescription: string;
  diagnosisList: PCCDiagnosis[];
  allergies: PCCAllergy[];
  advanceDirectives: PCCAdvanceDirective[];
  residentStatus: 'Active' | 'Discharged' | 'Hospital' | 'LOA' | 'Deceased';
  careLevel: string;
  physicianName: string;
  physicianNpi: string;
}

export interface PCCDiagnosis {
  icd10Code: string;
  description: string;
  onsetDate: string;
  rank: number;
  isPrimary: boolean;
}

export interface PCCAllergy {
  allergen: string;
  reaction: string;
  severity: 'Mild' | 'Moderate' | 'Severe';
  onsetDate: string | null;
}

export interface PCCAdvanceDirective {
  type: string;
  status: string;
  effectiveDate: string;
  expirationDate: string | null;
}

// ---------------------------------------------------------------------------
// PCC Medications
// ---------------------------------------------------------------------------

export interface PCCMedication {
  medicationId: string;
  residentId: string;
  drugName: string;
  genericName: string;
  dosage: string;
  route: string;
  frequency: string;
  prescribedDate: string;
  discontinuedDate: string | null;
  prescriberId: string;
  prescriberName: string;
  status: 'Active' | 'Discontinued' | 'Hold' | 'PRN';
  isPsychotropic: boolean;
  isControlled: boolean;
  gradualDoseReductionDue: string | null;
  pharmacyNotes: string | null;
}

// ---------------------------------------------------------------------------
// PCC Orders
// ---------------------------------------------------------------------------

export interface PCCOrder {
  orderId: string;
  residentId: string;
  orderType: 'Medication' | 'Treatment' | 'Dietary' | 'Lab' | 'Radiology' | 'Therapy' | 'Other';
  orderDescription: string;
  orderDate: string;
  startDate: string;
  endDate: string | null;
  frequency: string;
  status: 'Active' | 'Completed' | 'Discontinued' | 'Pending';
  orderedBy: string;
  orderedByNpi: string;
  priority: 'Routine' | 'STAT' | 'Urgent';
}

// ---------------------------------------------------------------------------
// PCC Assessments (MDS, BIMS, PHQ-9, Falls Risk)
// ---------------------------------------------------------------------------

export interface PCCAssessment {
  assessmentId: string;
  residentId: string;
  assessmentType: PCCAssessmentType;
  assessmentDate: string;
  completedDate: string | null;
  completedBy: string;
  status: 'In Progress' | 'Completed' | 'Locked' | 'Corrected';
  ardDate: string | null;
  score: number | null;
  sections: PCCAssessmentSection[];
}

export type PCCAssessmentType =
  | 'MDS_ADMISSION'
  | 'MDS_QUARTERLY'
  | 'MDS_ANNUAL'
  | 'MDS_SIGNIFICANT_CHANGE'
  | 'MDS_DISCHARGE'
  | 'BIMS'
  | 'PHQ9'
  | 'FALLS_RISK'
  | 'BRADEN'
  | 'PAIN';

export interface PCCAssessmentSection {
  sectionCode: string;
  sectionName: string;
  items: Record<string, string | number | boolean | null>;
}

// ---------------------------------------------------------------------------
// PCC Vitals
// ---------------------------------------------------------------------------

export interface PCCVitals {
  vitalsId: string;
  residentId: string;
  recordedDate: string;
  recordedBy: string;
  temperature: number | null;
  temperatureUnit: 'F' | 'C';
  bloodPressureSystolic: number | null;
  bloodPressureDiastolic: number | null;
  heartRate: number | null;
  respiratoryRate: number | null;
  oxygenSaturation: number | null;
  weight: number | null;
  weightUnit: 'lbs' | 'kg';
  painLevel: number | null;
  bloodGlucose: number | null;
}

// ---------------------------------------------------------------------------
// PCC Incidents
// ---------------------------------------------------------------------------

export interface PCCIncident {
  incidentId: string;
  residentId: string | null;
  facilityId: string;
  incidentDate: string;
  reportedDate: string;
  reportedBy: string;
  incidentType: PCCIncidentType;
  severity: 'Minor' | 'Moderate' | 'Major' | 'Sentinel';
  location: string;
  description: string;
  injuries: string[];
  witnessNames: string[];
  interventions: string[];
  followUpRequired: boolean;
  followUpDate: string | null;
  status: 'Open' | 'Under Review' | 'Closed';
}

export type PCCIncidentType =
  | 'Fall'
  | 'Medication Error'
  | 'Elopement'
  | 'Skin Integrity'
  | 'Behavior'
  | 'Abuse/Neglect Allegation'
  | 'Equipment'
  | 'Infection'
  | 'Other';

// ---------------------------------------------------------------------------
// PCC Care Plan
// ---------------------------------------------------------------------------

export interface PCCCarePlan {
  carePlanId: string;
  residentId: string;
  createdDate: string;
  lastReviewDate: string;
  nextReviewDate: string;
  status: 'Active' | 'Revised' | 'Discontinued';
  problems: PCCCarePlanProblem[];
}

export interface PCCCarePlanProblem {
  problemId: string;
  problem: string;
  onsetDate: string;
  goals: PCCCarePlanGoal[];
  interventions: PCCCarePlanIntervention[];
}

export interface PCCCarePlanGoal {
  goalId: string;
  description: string;
  targetDate: string;
  status: 'Active' | 'Met' | 'Not Met' | 'Revised';
  measurableCriteria: string;
}

export interface PCCCarePlanIntervention {
  interventionId: string;
  description: string;
  frequency: string;
  responsibleDiscipline: string;
  startDate: string;
  endDate: string | null;
}

// ---------------------------------------------------------------------------
// PCC Progress Note
// ---------------------------------------------------------------------------

export interface PCCProgressNoteInput {
  residentId: string;
  facilityId: string;
  noteType: 'Nursing' | 'Social Services' | 'Dietary' | 'Activities' | 'Therapy' | 'Physician';
  noteText: string;
  authorId: string;
  authorName: string;
  authorCredentials: string;
}

export interface PCCProgressNote extends PCCProgressNoteInput {
  noteId: string;
  createdDate: string;
  signedDate: string | null;
  signedBy: string | null;
  status: 'Draft' | 'Signed' | 'Cosigned' | 'Addendum';
}

// ---------------------------------------------------------------------------
// PCC Census
// ---------------------------------------------------------------------------

export interface PCCCensus {
  facilityId: string;
  censusDate: string;
  totalBeds: number;
  occupiedBeds: number;
  availableBeds: number;
  occupancyRate: number;
  residents: PCCCensusResident[];
  pendingAdmissions: number;
  pendingDischarges: number;
}

export interface PCCCensusResident {
  residentId: string;
  firstName: string;
  lastName: string;
  roomNumber: string;
  bedNumber: string;
  admissionDate: string;
  payerCode: string;
  residentStatus: string;
}

// ---------------------------------------------------------------------------
// PCC Lab Results
// ---------------------------------------------------------------------------

export interface PCCLabResult {
  labResultId: string;
  residentId: string;
  orderId: string;
  testName: string;
  testCode: string;
  resultValue: string;
  resultUnit: string;
  referenceRange: string;
  abnormalFlag: 'Normal' | 'Low' | 'High' | 'Critical Low' | 'Critical High' | null;
  collectionDate: string;
  resultDate: string;
  performingLab: string;
  orderingProvider: string;
  status: 'Final' | 'Preliminary' | 'Corrected';
}

// ---------------------------------------------------------------------------
// Mapping Functions: PCC types -> @snf/core types
// ---------------------------------------------------------------------------

const PAYER_CODE_MAP: Record<string, PayerType> = {
  'MA': 'medicare_a',
  'MB': 'medicare_b',
  'MC': 'medicaid',
  'MCO': 'managed_care',
  'PP': 'private_pay',
  'VA': 'va',
};

const CARE_LEVEL_MAP: Record<string, CareLevel> = {
  'Skilled': 'skilled',
  'Intermediate': 'intermediate',
  'Custodial': 'custodial',
  'Respite': 'respite',
  'Hospice': 'hospice',
};

const STATUS_MAP: Record<string, Resident['status']> = {
  'Active': 'active',
  'Discharged': 'discharged',
  'Hospital': 'hospital',
  'LOA': 'active',
  'Deceased': 'deceased',
};

export function mapPCCResidentToResident(pcc: PCCResident): Resident {
  return {
    id: pcc.residentId,
    facilityId: pcc.facilityId,
    firstName: pcc.firstName,
    lastName: pcc.lastName,
    roomNumber: pcc.roomNumber,
    admissionDate: pcc.admissionDate,
    payerType: PAYER_CODE_MAP[pcc.payerCode] ?? 'private_pay',
    diagnoses: pcc.diagnosisList.map((d) => d.description),
    careLevel: CARE_LEVEL_MAP[pcc.careLevel] ?? 'skilled',
    status: STATUS_MAP[pcc.residentStatus] ?? 'active',
  };
}
