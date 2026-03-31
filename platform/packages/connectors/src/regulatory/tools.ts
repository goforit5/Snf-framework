/**
 * Regulatory & Financial MCP tool definitions.
 * CMS quality data, OIG exclusion screening, SAM.gov debarment, bank feeds.
 * Each tool: name, description, inputSchema (JSON Schema), handler returning mock data.
 */

import type {
  CMSFacilityQuality,
  CMSSurveyResult,
  CMSPenalty,
  OIGExclusionResult,
  OIGBatchScreeningResult,
  SAMDebarmentResult,
  BankTransaction,
  BankBalance,
} from './types.js';

export interface MCPToolDefinition {
  name: string;
  description: string;
  inputSchema: object;
  handler: (input: Record<string, unknown>) => Promise<unknown>;
}

// --- Tool Definitions ---

export const regulatoryTools: MCPToolDefinition[] = [
  {
    name: 'cms_get_facility_quality',
    description:
      'Get CMS quality measures for a facility by CCN. Returns 5-star ratings, quality measures by domain, staffing data, and comparison to state/national averages.',
    inputSchema: {
      type: 'object',
      properties: {
        ccn: { type: 'string', description: 'CMS Certification Number (6 digits)' },
      },
      required: ['ccn'],
    },
    handler: async (input) => {
      const quality: CMSFacilityQuality = {
        ccn: input.ccn as string,
        facilityName: 'Desert Springs Care Center',
        overallRating: 4,
        healthInspectionRating: 3,
        staffingRating: 4,
        qualityMeasureRating: 5,
        reportDate: '2026-01-15',
        qualityMeasures: [
          { measureCode: 'SS-401', measureName: 'Percentage of short-stay residents who were re-hospitalized after a nursing home admission', domain: 'short_stay', facilityValue: 18.2, stateAverage: 21.5, nationalAverage: 22.3, threshold: 25.0, isBelowThreshold: true, reportQuarter: '2025-Q4' },
          { measureCode: 'SS-424', measureName: 'Percentage of short-stay residents who made improvements in function', domain: 'short_stay', facilityValue: 74.8, stateAverage: 68.1, nationalAverage: 66.2, threshold: 60.0, isBelowThreshold: false, reportQuarter: '2025-Q4' },
          { measureCode: 'LS-402', measureName: 'Percentage of long-stay residents experiencing one or more falls with major injury', domain: 'long_stay', facilityValue: 2.8, stateAverage: 3.5, nationalAverage: 3.3, threshold: 5.0, isBelowThreshold: true, reportQuarter: '2025-Q4' },
          { measureCode: 'LS-419', measureName: 'Percentage of long-stay residents who received an antipsychotic medication', domain: 'long_stay', facilityValue: 12.1, stateAverage: 14.8, nationalAverage: 14.2, threshold: 15.0, isBelowThreshold: true, reportQuarter: '2025-Q4' },
          { measureCode: 'LS-451', measureName: 'Percentage of long-stay residents with a urinary tract infection', domain: 'long_stay', facilityValue: 4.2, stateAverage: 3.8, nationalAverage: 3.5, threshold: 5.0, isBelowThreshold: true, reportQuarter: '2025-Q4' },
        ],
        staffingData: {
          rnHoursPerResidentDay: 0.82,
          totalNursingHoursPerResidentDay: 4.15,
          ptHoursPerResidentDay: 0.12,
          rnTurnoverRate: 38.2,
          totalNurseTurnoverRate: 42.7,
          weekendStaffingRatio: 0.91,
          reportedStaffingVsPayroll: 'consistent',
        },
      };
      return {
        success: true,
        data: quality,
        source: 'cms_provider_data',
        retrievedAt: new Date().toISOString(),
      };
    },
  },

  {
    name: 'cms_get_survey_results',
    description:
      'Get CMS survey/inspection results for a facility. Returns deficiency citations with scope, severity, findings, and plan of correction status.',
    inputSchema: {
      type: 'object',
      properties: {
        ccn: { type: 'string', description: 'CMS Certification Number' },
        surveyType: { type: 'string', enum: ['standard', 'complaint', 'focused', 'revisit'], description: 'Filter by survey type' },
        startDate: { type: 'string', description: 'Surveys after this date (YYYY-MM-DD)' },
        endDate: { type: 'string', description: 'Surveys before this date (YYYY-MM-DD)' },
        limit: { type: 'number', description: 'Max results', default: 10 },
      },
      required: ['ccn'],
    },
    handler: async (input) => {
      const survey: CMSSurveyResult = {
        ccn: input.ccn as string,
        surveyDate: '2025-11-14',
        surveyType: 'standard',
        deficiencies: [
          {
            tag: 'F880',
            tagDescription: 'Infection Prevention & Control',
            scope: 'pattern',
            severity: 'potential_harm',
            correctionDate: '2025-12-15',
            citation: 'F880 - 42 CFR 483.80',
            findings: 'Facility failed to maintain proper hand hygiene protocols in 3 of 8 observed medication pass events. Staff observed not performing hand hygiene between resident contacts in the south wing during 11/14 morning medication pass.',
          },
          {
            tag: 'F689',
            tagDescription: 'Free of Accident Hazards/Supervision/Devices',
            scope: 'isolated',
            severity: 'minimal_harm',
            correctionDate: '2025-12-01',
            citation: 'F689 - 42 CFR 483.25(d)',
            findings: 'One resident (Room 214B) found with call light cord wrapped around bed rail, creating potential entanglement hazard. Care plan did not address cord management for residents with limited mobility.',
          },
        ],
        totalDeficiencies: 2,
        scopeSeverityGrid: {
          immediate_jeopardy: 0,
          actual_harm: 0,
          potential_harm: 1,
          minimal_harm: 1,
        },
        planOfCorrection: {
          submittedDate: '2025-11-28',
          acceptedDate: '2025-12-05',
          status: 'accepted',
        },
      };
      return {
        success: true,
        data: [survey],
        totalCount: 1,
        source: 'cms_provider_data',
        retrievedAt: new Date().toISOString(),
      };
    },
  },

  {
    name: 'cms_get_penalties',
    description:
      'Get CMS civil monetary penalties and enforcement actions for a facility. Returns penalty type, amount, status, and related deficiency tags.',
    inputSchema: {
      type: 'object',
      properties: {
        ccn: { type: 'string', description: 'CMS Certification Number' },
        status: { type: 'string', enum: ['active', 'resolved', 'appealed', 'waived'], description: 'Filter by status' },
        startDate: { type: 'string', description: 'Penalties issued after this date' },
        limit: { type: 'number', description: 'Max results', default: 10 },
      },
      required: ['ccn'],
    },
    handler: async (input) => {
      const penalties: CMSPenalty[] = [
        {
          ccn: input.ccn as string,
          penaltyType: 'cmp',
          amount: 13575,
          startDate: '2025-04-01',
          endDate: '2025-04-01',
          status: 'resolved',
          relatedSurveyDate: '2025-02-20',
          relatedDeficiencyTags: ['F880', 'F441'],
          description: 'Per-instance CMP for infection control deficiency identified during 2/20/2025 complaint survey. Corrected on revisit 3/15/2025.',
        },
      ];
      return {
        success: true,
        data: penalties,
        totalCount: 1,
        summary: {
          totalActivePenalties: 0,
          totalResolvedLast12Months: 1,
          totalAmountLast12Months: 13575,
        },
        source: 'cms_provider_data',
        retrievedAt: new Date().toISOString(),
      };
    },
  },

  {
    name: 'oig_exclusion_check',
    description:
      'Check an individual against the OIG LEIE (List of Excluded Individuals/Entities). Federal requirement: facilities must screen all employees monthly. Returns match/no-match with exclusion details.',
    inputSchema: {
      type: 'object',
      properties: {
        firstName: { type: 'string', description: 'Individual first name' },
        lastName: { type: 'string', description: 'Individual last name' },
        npi: { type: 'string', description: 'National Provider Identifier (10 digits)' },
        dob: { type: 'string', description: 'Date of birth (YYYY-MM-DD) for disambiguation' },
        state: { type: 'string', description: 'State for disambiguation (2-letter code)' },
      },
      required: ['firstName', 'lastName'],
    },
    handler: async (input) => {
      const result: OIGExclusionResult = {
        searchedName: `${input.lastName}, ${input.firstName}`,
        searchedNpi: (input.npi as string) ?? null,
        matchFound: false,
        matches: [],
        searchDate: new Date().toISOString(),
        databaseDate: '2026-03-15',
      };
      return {
        success: true,
        data: result,
        source: 'oig_leie',
        retrievedAt: new Date().toISOString(),
      };
    },
  },

  {
    name: 'oig_batch_screening',
    description:
      'Batch screen all employees at a facility against the OIG LEIE exclusion list. Returns summary with any matches flagged for immediate review. Federal compliance requirement.',
    inputSchema: {
      type: 'object',
      properties: {
        facilityId: { type: 'string', description: 'Facility ID to screen all employees' },
        includeContractors: { type: 'boolean', description: 'Include contractors and vendors', default: true },
      },
      required: ['facilityId'],
    },
    handler: async (input) => {
      const result: OIGBatchScreeningResult = {
        facilityId: input.facilityId as string,
        screeningDate: new Date().toISOString(),
        totalScreened: 142,
        matchesFound: 0,
        results: [],
        nextScheduledScreening: '2026-04-15',
      };
      return {
        success: true,
        data: result,
        summary: {
          totalScreened: 142,
          clearances: 142,
          potentialMatches: 0,
          confirmedExclusions: 0,
          complianceStatus: 'compliant',
        },
        source: 'oig_leie',
        retrievedAt: new Date().toISOString(),
      };
    },
  },

  {
    name: 'sam_debarment_check',
    description:
      'Check an entity or individual against SAM.gov for debarment, suspension, or proposed debarment. Required for any entity receiving federal funds.',
    inputSchema: {
      type: 'object',
      properties: {
        entityName: { type: 'string', description: 'Entity or individual name' },
        uei: { type: 'string', description: 'Unique Entity Identifier (SAM)' },
        tin: { type: 'string', description: 'Tax Identification Number' },
        cageCode: { type: 'string', description: 'CAGE Code' },
      },
      required: ['entityName'],
    },
    handler: async (input) => {
      const result: SAMDebarmentResult = {
        searchedName: input.entityName as string,
        searchedUei: (input.uei as string) ?? null,
        searchedTin: (input.tin as string) ?? null,
        matchFound: false,
        matches: [],
        searchDate: new Date().toISOString(),
      };
      return {
        success: true,
        data: result,
        source: 'sam_gov',
        retrievedAt: new Date().toISOString(),
      };
    },
  },

  {
    name: 'bank_get_transactions',
    description:
      'Get bank feed transactions for a facility operating account. Returns posted and pending transactions with payee, amount, and categorization. Used by financial agents for cash flow analysis and anomaly detection.',
    inputSchema: {
      type: 'object',
      properties: {
        accountId: { type: 'string', description: 'Bank account ID' },
        facilityId: { type: 'string', description: 'Facility ID (resolves to all accounts at facility)' },
        startDate: { type: 'string', description: 'Transactions after this date (YYYY-MM-DD)' },
        endDate: { type: 'string', description: 'Transactions before this date (YYYY-MM-DD)' },
        type: { type: 'string', enum: ['debit', 'credit'], description: 'Filter by transaction type' },
        minAmount: { type: 'number', description: 'Minimum absolute amount' },
        maxAmount: { type: 'number', description: 'Maximum absolute amount' },
        status: { type: 'string', enum: ['posted', 'pending', 'reconciled'], description: 'Filter by status' },
        limit: { type: 'number', description: 'Max results', default: 100 },
        offset: { type: 'number', description: 'Pagination offset', default: 0 },
      },
    },
    handler: async (input) => {
      const transactions: BankTransaction[] = [
        {
          transactionId: 'TXN-2026-03-28-001',
          accountId: 'ACCT-OP-AZ001',
          accountName: 'Desert Springs Operating',
          date: '2026-03-28',
          postedDate: '2026-03-28',
          amount: -47250.0,
          type: 'debit',
          description: 'ADP PAYROLL',
          memo: 'Biweekly payroll 03/17-03/30',
          category: 'Payroll',
          checkNumber: null,
          referenceNumber: 'ADP-20260328-001',
          payee: 'ADP TotalSource',
          status: 'posted',
          facilityId: 'FAC-AZ-001',
        },
        {
          transactionId: 'TXN-2026-03-27-001',
          accountId: 'ACCT-OP-AZ001',
          accountName: 'Desert Springs Operating',
          date: '2026-03-27',
          postedDate: '2026-03-27',
          amount: 128450.0,
          type: 'credit',
          description: 'MEDICARE EFT',
          memo: 'Medicare Part A payment - March',
          category: 'Revenue - Medicare',
          checkNumber: null,
          referenceNumber: 'CMS-EFT-20260327',
          payee: null,
          status: 'posted',
          facilityId: 'FAC-AZ-001',
        },
        {
          transactionId: 'TXN-2026-03-27-002',
          accountId: 'ACCT-OP-AZ001',
          accountName: 'Desert Springs Operating',
          date: '2026-03-27',
          postedDate: '2026-03-27',
          amount: -8942.5,
          type: 'debit',
          description: 'MEDLINE INDUSTRIES',
          memo: 'PO-2026-0847 Medical supplies',
          category: 'Medical Supplies',
          checkNumber: '10847',
          referenceNumber: null,
          payee: 'Medline Industries Inc',
          status: 'posted',
          facilityId: 'FAC-AZ-001',
        },
        {
          transactionId: 'TXN-2026-03-29-001',
          accountId: 'ACCT-OP-AZ001',
          accountName: 'Desert Springs Operating',
          date: '2026-03-29',
          postedDate: '2026-03-29',
          amount: -3150.0,
          type: 'debit',
          description: 'SYSCO CORPORATION',
          memo: 'Weekly food service delivery',
          category: 'Dietary/Food Service',
          checkNumber: null,
          referenceNumber: 'SYSCO-WK13-2026',
          payee: 'Sysco Corporation',
          status: 'pending',
          facilityId: 'FAC-AZ-001',
        },
      ];
      return {
        success: true,
        data: transactions,
        totalCount: 4,
        summary: {
          totalDebits: -59342.5,
          totalCredits: 128450.0,
          netChange: 69107.5,
          transactionCount: 4,
        },
        source: 'bank_feed_ofx',
        retrievedAt: new Date().toISOString(),
      };
    },
  },

  {
    name: 'bank_get_balances',
    description:
      'Get current account balances across all bank accounts for a facility or the enterprise. Returns current, available, and ledger balances by account.',
    inputSchema: {
      type: 'object',
      properties: {
        facilityId: { type: 'string', description: 'Facility ID (all accounts at facility)' },
        accountId: { type: 'string', description: 'Specific account ID' },
        accountType: { type: 'string', enum: ['checking', 'savings', 'money_market', 'operating', 'trust'], description: 'Filter by account type' },
      },
    },
    handler: async (input) => {
      const balances: BankBalance[] = [
        {
          accountId: 'ACCT-OP-AZ001',
          accountName: 'Desert Springs Operating',
          accountType: 'operating',
          institution: 'JPMorgan Chase',
          routingNumber: '122100024',
          maskedAccountNumber: '****4821',
          currentBalance: 487293.42,
          availableBalance: 484143.42,
          ledgerBalance: 487293.42,
          asOfDate: '2026-03-29',
          facilityId: 'FAC-AZ-001',
          currency: 'USD',
        },
        {
          accountId: 'ACCT-PR-AZ001',
          accountName: 'Desert Springs Patient Trust',
          accountType: 'trust',
          institution: 'JPMorgan Chase',
          routingNumber: '122100024',
          maskedAccountNumber: '****4822',
          currentBalance: 42187.65,
          availableBalance: 42187.65,
          ledgerBalance: 42187.65,
          asOfDate: '2026-03-29',
          facilityId: 'FAC-AZ-001',
          currency: 'USD',
        },
        {
          accountId: 'ACCT-SAV-AZ001',
          accountName: 'Desert Springs Reserve',
          accountType: 'savings',
          institution: 'JPMorgan Chase',
          routingNumber: '122100024',
          maskedAccountNumber: '****4823',
          currentBalance: 250000.0,
          availableBalance: 250000.0,
          ledgerBalance: 250000.0,
          asOfDate: '2026-03-29',
          facilityId: 'FAC-AZ-001',
          currency: 'USD',
        },
      ];
      return {
        success: true,
        data: balances,
        summary: {
          totalCurrentBalance: 779481.07,
          totalAvailableBalance: 776331.07,
          accountCount: 3,
        },
        source: 'bank_feed_ofx',
        retrievedAt: new Date().toISOString(),
      };
    },
  },
];
