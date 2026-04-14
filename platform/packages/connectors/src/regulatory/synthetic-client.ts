/**
 * Regulatory Synthetic Client — returns realistic CMS/OIG/SAM/bank data for demo/staging.
 *
 * Deterministic: same input always produces the same output.
 * Activated via CONNECTOR_MODE=synthetic environment variable.
 */

import type {
  CMSFacilityQuality,
  CMSQualityMeasure,
  CMSStaffingData,
  CMSSurveyResult,
  CMSDeficiency,
  CMSPenalty,
  OIGExclusionResult,
  OIGBatchScreeningResult,
  SAMDebarmentResult,
  BankTransaction,
  BankBalance,
} from './types.js';

import {
  DEMO_FACILITIES,
  getFacility,
  getFacilityByCCN,
  getEmployeePool,
  pick,
  pickN,
  seedHash,
  seededInt,
  seededFloat,
  daysAgo,
  CMS_FTAGS,
} from '../synthetic/seed-data.js';

// ---------------------------------------------------------------------------
// Quality Measure Templates
// ---------------------------------------------------------------------------

const QUALITY_MEASURES: readonly Omit<CMSQualityMeasure, 'facilityValue' | 'reportQuarter'>[] = [
  { measureCode: 'SS-401', measureName: 'Percentage of short-stay residents who were re-hospitalized', domain: 'short_stay', stateAverage: 21.5, nationalAverage: 22.3, threshold: 25.0, isBelowThreshold: true },
  { measureCode: 'SS-424', measureName: 'Percentage of short-stay residents who made improvements in function', domain: 'short_stay', stateAverage: 68.1, nationalAverage: 66.2, threshold: 60.0, isBelowThreshold: false },
  { measureCode: 'SS-411', measureName: 'Percentage of short-stay residents who newly received an antipsychotic medication', domain: 'short_stay', stateAverage: 2.1, nationalAverage: 2.3, threshold: 3.0, isBelowThreshold: true },
  { measureCode: 'LS-402', measureName: 'Percentage of long-stay residents experiencing falls with major injury', domain: 'long_stay', stateAverage: 3.5, nationalAverage: 3.3, threshold: 5.0, isBelowThreshold: true },
  { measureCode: 'LS-419', measureName: 'Percentage of long-stay residents who received an antipsychotic medication', domain: 'long_stay', stateAverage: 14.8, nationalAverage: 14.2, threshold: 15.0, isBelowThreshold: true },
  { measureCode: 'LS-451', measureName: 'Percentage of long-stay residents with a urinary tract infection', domain: 'long_stay', stateAverage: 3.8, nationalAverage: 3.5, threshold: 5.0, isBelowThreshold: true },
  { measureCode: 'LS-403', measureName: 'Percentage of long-stay residents with pressure ulcers (Stage II+)', domain: 'long_stay', stateAverage: 5.2, nationalAverage: 5.5, threshold: 7.0, isBelowThreshold: true },
  { measureCode: 'LS-425', measureName: 'Percentage of long-stay residents who lose too much weight', domain: 'long_stay', stateAverage: 5.8, nationalAverage: 5.6, threshold: 8.0, isBelowThreshold: true },
];

// ---------------------------------------------------------------------------
// Regulatory Synthetic Client
// ---------------------------------------------------------------------------

export class RegulatorySyntheticClient {

  getCMSFacilityQuality(ccn: string): { success: boolean; data: CMSFacilityQuality; source: string; retrievedAt: string } {
    const facility = getFacilityByCCN(ccn);
    const seed = `cms-quality-${ccn}`;

    // Generate ratings with variety: some 5-star, some 3-star
    const overallRating = seededInt(2, 5, `${seed}-overall`);
    const healthRating = Math.max(1, Math.min(5, overallRating + seededInt(-1, 1, `${seed}-health`)));
    const staffingRating = Math.max(1, Math.min(5, overallRating + seededInt(-1, 1, `${seed}-staffing`)));
    const qualityRating = Math.max(1, Math.min(5, overallRating + seededInt(0, 1, `${seed}-quality`)));

    const measures: CMSQualityMeasure[] = QUALITY_MEASURES.map((m, i) => {
      const mSeed = `${seed}-m${i}`;
      let facilityValue: number;

      if (overallRating >= 4) {
        // High-performing: better than average
        facilityValue = seededFloat(m.stateAverage * 0.7, m.stateAverage * 0.95, mSeed, 1);
      } else if (overallRating === 3) {
        // Average
        facilityValue = seededFloat(m.stateAverage * 0.9, m.stateAverage * 1.15, mSeed, 1);
      } else {
        // Below average
        facilityValue = seededFloat(m.stateAverage * 1.1, m.threshold * 1.1, mSeed, 1);
      }

      // For improvement measures (higher = better), invert the logic
      if (m.measureCode === 'SS-424') {
        facilityValue = overallRating >= 4
          ? seededFloat(m.stateAverage * 1.05, m.stateAverage * 1.2, mSeed, 1)
          : seededFloat(m.stateAverage * 0.85, m.stateAverage, mSeed, 1);
      }

      return {
        ...m,
        facilityValue,
        isBelowThreshold: facilityValue < m.threshold,
        reportQuarter: '2025-Q4',
      };
    });

    const staffingData: CMSStaffingData = {
      rnHoursPerResidentDay: seededFloat(0.55, 1.2, `${seed}-rnhrs`, 2),
      totalNursingHoursPerResidentDay: seededFloat(3.5, 5.0, `${seed}-tnhrs`, 2),
      ptHoursPerResidentDay: seededFloat(0.05, 0.20, `${seed}-pthrs`, 2),
      rnTurnoverRate: seededFloat(25, 55, `${seed}-rnto`, 1),
      totalNurseTurnoverRate: seededFloat(35, 60, `${seed}-tnto`, 1),
      weekendStaffingRatio: seededFloat(0.80, 0.98, `${seed}-wknd`, 2),
      reportedStaffingVsPayroll: staffingRating >= 3 ? 'consistent' : 'inconsistent',
    };

    return {
      success: true,
      data: {
        ccn,
        facilityName: facility?.name ?? `Facility ${ccn}`,
        overallRating,
        healthInspectionRating: healthRating,
        staffingRating,
        qualityMeasureRating: qualityRating,
        reportDate: '2026-01-15',
        qualityMeasures: measures,
        staffingData,
      },
      source: 'cms_provider_data',
      retrievedAt: new Date().toISOString(),
    };
  }

  getCMSSurveyResults(
    ccn: string,
    filters?: { surveyType?: string; startDate?: string; endDate?: string; limit?: number },
  ): { success: boolean; data: CMSSurveyResult[]; totalCount: number; source: string; retrievedAt: string } {
    const seed = `cms-survey-${ccn}`;
    const numSurveys = seededInt(1, 3, `${seed}-count`);
    const surveys: CMSSurveyResult[] = [];

    for (let i = 0; i < numSurveys; i++) {
      const sSeed = `${seed}-${i}`;
      const numDefs = seededInt(1, 5, `${sSeed}-ndefs`);
      const selectedTags = pickN(CMS_FTAGS, numDefs, `${sSeed}-tags`);

      const deficiencies: CMSDeficiency[] = selectedTags.map((ftag, j) => {
        const dSeed = `${sSeed}-def-${j}`;
        const severity = pick(['minimal_harm', 'potential_harm', 'potential_harm', 'actual_harm'] as const, `${dSeed}-sev`);
        return {
          tag: ftag.tag,
          tagDescription: ftag.desc,
          scope: pick(['isolated', 'pattern', 'isolated'] as const, `${dSeed}-scope`),
          severity,
          correctionDate: daysAgo(-seededInt(1, 30, `${dSeed}-corr`)),
          citation: `${ftag.tag} - 42 CFR 483`,
          findings: getSurveyFindings(ftag.tag, dSeed),
        };
      });

      const grid = { immediate_jeopardy: 0, actual_harm: 0, potential_harm: 0, minimal_harm: 0 };
      for (const def of deficiencies) {
        grid[def.severity]++;
      }

      const surveyDaysAgo = seededInt(30, 365, `${sSeed}-days`) + i * 180;
      const surveyType = i === 0 ? 'standard' : pick(['complaint', 'focused', 'revisit'] as const, `${sSeed}-type`);

      if (filters?.surveyType && surveyType !== filters.surveyType) continue;

      surveys.push({
        ccn,
        surveyDate: daysAgo(surveyDaysAgo),
        surveyType: surveyType as CMSSurveyResult['surveyType'],
        deficiencies,
        totalDeficiencies: deficiencies.length,
        scopeSeverityGrid: grid,
        planOfCorrection: {
          submittedDate: daysAgo(surveyDaysAgo - 14),
          acceptedDate: daysAgo(surveyDaysAgo - 21),
          status: 'accepted',
        },
      });
    }

    return {
      success: true,
      data: surveys,
      totalCount: surveys.length,
      source: 'cms_provider_data',
      retrievedAt: new Date().toISOString(),
    };
  }

  getCMSPenalties(
    ccn: string,
    _filters?: { status?: string; startDate?: string; limit?: number },
  ): { success: boolean; data: CMSPenalty[]; totalCount: number; summary: object; source: string; retrievedAt: string } {
    const seed = `cms-penalty-${ccn}`;
    // Most facilities have 0-1 penalties
    const hasPenalty = seedHash(seed) % 3 === 0;

    const penalties: CMSPenalty[] = hasPenalty ? [{
      ccn,
      penaltyType: pick(['cmp', 'denial_of_payment'] as const, `${seed}-type`),
      amount: seededInt(5000, 50000, `${seed}-amt`),
      startDate: daysAgo(seededInt(90, 365, `${seed}-start`)),
      endDate: daysAgo(seededInt(30, 89, `${seed}-end`)),
      status: 'resolved',
      relatedSurveyDate: daysAgo(seededInt(120, 400, `${seed}-survey`)),
      relatedDeficiencyTags: [pick(CMS_FTAGS, `${seed}-tag1`).tag],
      description: `Per-instance CMP for ${pick(CMS_FTAGS, `${seed}-tag1`).desc.toLowerCase()} deficiency. Corrected on revisit.`,
    }] : [];

    return {
      success: true,
      data: penalties,
      totalCount: penalties.length,
      summary: {
        totalActivePenalties: 0,
        totalResolvedLast12Months: penalties.length,
        totalAmountLast12Months: penalties.reduce((s, p) => s + (p.amount ?? 0), 0),
      },
      source: 'cms_provider_data',
      retrievedAt: new Date().toISOString(),
    };
  }

  oigExclusionCheck(
    firstName: string,
    lastName: string,
    npi?: string,
  ): { success: boolean; data: OIGExclusionResult; source: string; retrievedAt: string } {
    // All demo staff are clean
    return {
      success: true,
      data: {
        searchedName: `${lastName}, ${firstName}`,
        searchedNpi: npi ?? null,
        matchFound: false,
        matches: [],
        searchDate: new Date().toISOString(),
        databaseDate: daysAgo(seededInt(1, 15, `oig-db-${lastName}`)),
      },
      source: 'oig_leie',
      retrievedAt: new Date().toISOString(),
    };
  }

  oigBatchScreening(
    facilityId: string,
  ): { success: boolean; data: OIGBatchScreeningResult; summary: object; source: string; retrievedAt: string } {
    const pool = getEmployeePool(facilityId);
    const totalScreened = pool.length;

    return {
      success: true,
      data: {
        facilityId,
        screeningDate: new Date().toISOString(),
        totalScreened,
        matchesFound: 0,
        results: [], // no matches for demo (all clean)
        nextScheduledScreening: daysAgo(-30),
      },
      summary: {
        totalScreened,
        clearances: totalScreened,
        potentialMatches: 0,
        confirmedExclusions: 0,
        complianceStatus: 'compliant',
      },
      source: 'oig_leie',
      retrievedAt: new Date().toISOString(),
    };
  }

  samDebarmentCheck(
    entityName: string,
    uei?: string,
  ): { success: boolean; data: SAMDebarmentResult; source: string; retrievedAt: string } {
    // All demo entities are clean
    return {
      success: true,
      data: {
        searchedName: entityName,
        searchedUei: uei ?? null,
        searchedTin: null,
        matchFound: false,
        matches: [],
        searchDate: new Date().toISOString(),
      },
      source: 'sam_gov',
      retrievedAt: new Date().toISOString(),
    };
  }

  bankGetTransactions(
    filters?: { accountId?: string; facilityId?: string; startDate?: string; endDate?: string; type?: string; limit?: number; offset?: number },
  ): { success: boolean; data: BankTransaction[]; totalCount: number; summary: object; source: string; retrievedAt: string } {
    const facilityId = filters?.facilityId ?? DEMO_FACILITIES[0].facilityId;
    const facility = getFacility(facilityId);
    const seed = `bank-txn-${facilityId}`;
    const facCode = facilityId.replace('FAC-', '');

    const TRANSACTION_TEMPLATES: { desc: string; payee: string | null; category: string; amountMin: number; amountMax: number; type: 'debit' | 'credit' }[] = [
      { desc: 'ADP PAYROLL', payee: 'ADP TotalSource', category: 'Payroll', amountMin: 35000, amountMax: 75000, type: 'debit' },
      { desc: 'MEDICARE EFT', payee: null, category: 'Revenue - Medicare', amountMin: 80000, amountMax: 200000, type: 'credit' },
      { desc: 'MEDICAID REIMBURSEMENT', payee: null, category: 'Revenue - Medicaid', amountMin: 40000, amountMax: 100000, type: 'credit' },
      { desc: 'MEDLINE INDUSTRIES', payee: 'Medline Industries Inc', category: 'Medical Supplies', amountMin: 5000, amountMax: 20000, type: 'debit' },
      { desc: 'SYSCO CORPORATION', payee: 'Sysco Corporation', category: 'Dietary/Food Service', amountMin: 2000, amountMax: 5000, type: 'debit' },
      { desc: 'UTILITY PAYMENT', payee: 'Local Power Company', category: 'Utilities', amountMin: 5000, amountMax: 15000, type: 'debit' },
      { desc: 'INSURANCE PREMIUM', payee: 'Hartford Insurance', category: 'Insurance', amountMin: 8000, amountMax: 20000, type: 'debit' },
      { desc: 'PRIVATE PAY DEPOSIT', payee: null, category: 'Revenue - Private Pay', amountMin: 5000, amountMax: 30000, type: 'credit' },
      { desc: 'PHARMACY SERVICES', payee: 'PharMerica Corp', category: 'Pharmacy', amountMin: 10000, amountMax: 35000, type: 'debit' },
      { desc: 'MANAGED CARE PAYMENT', payee: null, category: 'Revenue - Managed Care', amountMin: 30000, amountMax: 80000, type: 'credit' },
    ];

    const numTxns = seededInt(8, 15, `${seed}-count`);
    let transactions: BankTransaction[] = [];

    for (let i = 0; i < numTxns; i++) {
      const tSeed = `${seed}-${i}`;
      const tmpl = TRANSACTION_TEMPLATES[i % TRANSACTION_TEMPLATES.length];
      const amount = seededFloat(tmpl.amountMin, tmpl.amountMax, `${tSeed}-amt`, 2);
      const dayOffset = seededInt(0, 30, `${tSeed}-day`);

      transactions.push({
        transactionId: `TXN-${daysAgo(dayOffset).replace(/-/g, '')}-${String(i).padStart(3, '0')}`,
        accountId: `ACCT-OP-${facCode}`,
        accountName: `${facility?.name ?? 'Facility'} Operating`,
        date: daysAgo(dayOffset),
        postedDate: daysAgo(dayOffset),
        amount: tmpl.type === 'debit' ? -amount : amount,
        type: tmpl.type,
        description: tmpl.desc,
        memo: `${tmpl.category} - ${daysAgo(dayOffset)}`,
        category: tmpl.category,
        checkNumber: tmpl.type === 'debit' && seedHash(`${tSeed}-chk`) % 3 === 0 ? String(seededInt(10000, 19999, `${tSeed}-chkn`)) : null,
        referenceNumber: `REF-${seedHash(tSeed).toString(36).toUpperCase().slice(0, 8)}`,
        payee: tmpl.payee,
        status: dayOffset < 2 ? 'pending' : 'posted',
        facilityId,
      });
    }

    if (filters?.type) {
      transactions = transactions.filter((t) => t.type === filters.type);
    }

    const totalDebits = transactions.filter((t) => t.type === 'debit').reduce((s, t) => s + t.amount, 0);
    const totalCredits = transactions.filter((t) => t.type === 'credit').reduce((s, t) => s + t.amount, 0);

    return {
      success: true,
      data: transactions,
      totalCount: transactions.length,
      summary: {
        totalDebits: Math.round(totalDebits * 100) / 100,
        totalCredits: Math.round(totalCredits * 100) / 100,
        netChange: Math.round((totalCredits + totalDebits) * 100) / 100,
        transactionCount: transactions.length,
      },
      source: 'bank_feed_ofx',
      retrievedAt: new Date().toISOString(),
    };
  }

  bankGetBalances(
    filters?: { facilityId?: string; accountId?: string; accountType?: string },
  ): { success: boolean; data: BankBalance[]; summary: object; source: string; retrievedAt: string } {
    const facilityId = filters?.facilityId ?? DEMO_FACILITIES[0].facilityId;
    const facility = getFacility(facilityId);
    const seed = `bank-bal-${facilityId}`;
    const facCode = facilityId.replace('FAC-', '');
    const facName = facility?.name ?? 'Facility';

    let balances: BankBalance[] = [
      {
        accountId: `ACCT-OP-${facCode}`,
        accountName: `${facName} Operating`,
        accountType: 'operating',
        institution: 'JPMorgan Chase',
        routingNumber: '122100024',
        maskedAccountNumber: `****${seededInt(1000, 9999, `${seed}-op`)}`,
        currentBalance: seededFloat(250000, 750000, `${seed}-opbal`, 2),
        availableBalance: seededFloat(240000, 740000, `${seed}-opavail`, 2),
        ledgerBalance: seededFloat(250000, 750000, `${seed}-opled`, 2),
        asOfDate: daysAgo(0),
        facilityId,
        currency: 'USD',
      },
      {
        accountId: `ACCT-PR-${facCode}`,
        accountName: `${facName} Patient Trust`,
        accountType: 'trust',
        institution: 'JPMorgan Chase',
        routingNumber: '122100024',
        maskedAccountNumber: `****${seededInt(1000, 9999, `${seed}-pr`)}`,
        currentBalance: seededFloat(20000, 60000, `${seed}-prbal`, 2),
        availableBalance: seededFloat(20000, 60000, `${seed}-pravail`, 2),
        ledgerBalance: seededFloat(20000, 60000, `${seed}-prled`, 2),
        asOfDate: daysAgo(0),
        facilityId,
        currency: 'USD',
      },
      {
        accountId: `ACCT-SAV-${facCode}`,
        accountName: `${facName} Reserve`,
        accountType: 'savings',
        institution: 'JPMorgan Chase',
        routingNumber: '122100024',
        maskedAccountNumber: `****${seededInt(1000, 9999, `${seed}-sav`)}`,
        currentBalance: seededFloat(150000, 400000, `${seed}-savbal`, 2),
        availableBalance: seededFloat(150000, 400000, `${seed}-savavail`, 2),
        ledgerBalance: seededFloat(150000, 400000, `${seed}-savled`, 2),
        asOfDate: daysAgo(0),
        facilityId,
        currency: 'USD',
      },
    ];

    if (filters?.accountType) {
      balances = balances.filter((b) => b.accountType === filters.accountType);
    }
    if (filters?.accountId) {
      balances = balances.filter((b) => b.accountId === filters.accountId);
    }

    const totalCurrent = balances.reduce((s, b) => s + b.currentBalance, 0);
    const totalAvailable = balances.reduce((s, b) => s + b.availableBalance, 0);

    return {
      success: true,
      data: balances,
      summary: {
        totalCurrentBalance: Math.round(totalCurrent * 100) / 100,
        totalAvailableBalance: Math.round(totalAvailable * 100) / 100,
        accountCount: balances.length,
      },
      source: 'bank_feed_ofx',
      retrievedAt: new Date().toISOString(),
    };
  }
}

// ---------------------------------------------------------------------------
// Survey Findings Generator
// ---------------------------------------------------------------------------

function getSurveyFindings(tag: string, seed: string): string {
  switch (tag) {
    case 'F880':
      return pick([
        'Facility failed to maintain proper hand hygiene protocols in 3 of 8 observed medication pass events. Staff observed not performing hand hygiene between resident contacts.',
        'Isolation precautions not consistently implemented. Two residents on contact precautions found without proper signage and PPE available outside rooms.',
      ] as const, seed);
    case 'F689':
      return pick([
        'One resident found with call light cord wrapped around bed rail, creating potential entanglement hazard. Care plan did not address cord management.',
        'Wet floor in hallway near dining room without wet floor sign posted. Two residents using walkers observed navigating the area without staff assistance.',
      ] as const, seed);
    case 'F684':
      return 'Resident experienced decline in ADL function over 90-day period without documented reassessment or care plan revision addressing the change.';
    case 'F757':
      return 'Three residents receiving antipsychotic medications without documented target behaviors or gradual dose reduction attempts within required timeframes.';
    case 'F758':
      return 'PRN psychotropic medication administered 12 times in 30-day period without documented clinical indication or physician notification after 3rd use.';
    case 'F656':
      return 'Care plans for 2 of 10 sampled residents lacked individualized, measurable goals. Generic care plan language did not reflect resident-specific needs.';
    case 'F686':
      return 'Stage III pressure ulcer on sacrum documented without weekly wound measurements for 3 consecutive weeks. Treatment orders not updated to reflect wound progression.';
    case 'F812':
      return 'Food temperature logs showed 4 instances in past month where hot food was served below 140°F. Corrective action not documented.';
    default:
      return `Deficiency identified during survey observation related to ${pick(CMS_FTAGS, seed).desc.toLowerCase()}. See full citation for details.`;
  }
}

// ---------------------------------------------------------------------------
// Singleton
// ---------------------------------------------------------------------------

export const regulatorySyntheticClient = new RegulatorySyntheticClient();
