/**
 * Regulatory & Financial data source types.
 * CMS quality data, OIG exclusion lists, SAM.gov, bank feeds.
 */

// --- CMS Quality Data ---

export interface CMSFacilityQuality {
  ccn: string;
  facilityName: string;
  overallRating: number;
  healthInspectionRating: number;
  staffingRating: number;
  qualityMeasureRating: number;
  reportDate: string;
  qualityMeasures: CMSQualityMeasure[];
  staffingData: CMSStaffingData;
}

export interface CMSQualityMeasure {
  measureCode: string;
  measureName: string;
  domain: 'short_stay' | 'long_stay';
  facilityValue: number;
  stateAverage: number;
  nationalAverage: number;
  threshold: number;
  isBelowThreshold: boolean;
  reportQuarter: string;
}

export interface CMSStaffingData {
  rnHoursPerResidentDay: number;
  totalNursingHoursPerResidentDay: number;
  ptHoursPerResidentDay: number;
  rnTurnoverRate: number;
  totalNurseTurnoverRate: number;
  weekendStaffingRatio: number;
  reportedStaffingVsPayroll: 'consistent' | 'inconsistent';
}

// --- CMS Survey / Inspection ---

export interface CMSSurveyResult {
  ccn: string;
  surveyDate: string;
  surveyType: 'standard' | 'complaint' | 'focused' | 'revisit';
  deficiencies: CMSDeficiency[];
  totalDeficiencies: number;
  scopeSeverityGrid: {
    immediate_jeopardy: number;
    actual_harm: number;
    potential_harm: number;
    minimal_harm: number;
  };
  planOfCorrection: {
    submittedDate: string | null;
    acceptedDate: string | null;
    status: 'pending' | 'submitted' | 'accepted' | 'rejected';
  };
}

export interface CMSDeficiency {
  tag: string;
  tagDescription: string;
  scope: 'isolated' | 'pattern' | 'widespread';
  severity: 'minimal_harm' | 'potential_harm' | 'actual_harm' | 'immediate_jeopardy';
  correctionDate: string | null;
  citation: string;
  findings: string;
}

// --- CMS Penalties ---

export interface CMSPenalty {
  ccn: string;
  penaltyType: 'cmp' | 'denial_of_payment' | 'state_monitor' | 'directed_plan' | 'temporary_management';
  amount: number | null;
  startDate: string;
  endDate: string | null;
  status: 'active' | 'resolved' | 'appealed' | 'waived';
  relatedSurveyDate: string;
  relatedDeficiencyTags: string[];
  description: string;
}

// --- OIG Exclusion List (LEIE) ---

export interface OIGExclusionResult {
  searchedName: string;
  searchedNpi: string | null;
  matchFound: boolean;
  matches: OIGExclusionMatch[];
  searchDate: string;
  databaseDate: string;
}

export interface OIGExclusionMatch {
  lastName: string;
  firstName: string;
  middleName: string | null;
  npi: string | null;
  dob: string | null;
  exclusionType: string;
  exclusionDate: string;
  reinstateDate: string | null;
  state: string;
  specialty: string | null;
  upin: string | null;
  waiverState: string | null;
  waiverDate: string | null;
}

export interface OIGBatchScreeningResult {
  facilityId: string;
  screeningDate: string;
  totalScreened: number;
  matchesFound: number;
  results: {
    employeeId: string;
    employeeName: string;
    npi: string | null;
    result: OIGExclusionResult;
  }[];
  nextScheduledScreening: string;
}

// --- SAM.gov ---

export interface SAMDebarmentResult {
  searchedName: string;
  searchedUei: string | null;
  searchedTin: string | null;
  matchFound: boolean;
  matches: SAMDebarmentMatch[];
  searchDate: string;
}

export interface SAMDebarmentMatch {
  entityName: string;
  uei: string;
  cageCode: string | null;
  activationDate: string;
  expirationDate: string | null;
  exclusionType: 'debarment' | 'suspension' | 'proposed_debarment' | 'voluntary_exclusion';
  excludingAgency: string;
  classificationType: string;
  description: string;
}

// --- Bank Feed ---

export interface BankTransaction {
  transactionId: string;
  accountId: string;
  accountName: string;
  date: string;
  postedDate: string;
  amount: number;
  type: 'debit' | 'credit';
  description: string;
  memo: string | null;
  category: string | null;
  checkNumber: string | null;
  referenceNumber: string | null;
  payee: string | null;
  status: 'posted' | 'pending' | 'reconciled';
  facilityId: string;
}

export interface BankBalance {
  accountId: string;
  accountName: string;
  accountType: 'checking' | 'savings' | 'money_market' | 'operating' | 'trust';
  institution: string;
  routingNumber: string;
  maskedAccountNumber: string;
  currentBalance: number;
  availableBalance: number;
  ledgerBalance: number;
  asOfDate: string;
  facilityId: string;
  currency: string;
}
