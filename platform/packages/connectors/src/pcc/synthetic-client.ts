/**
 * PCC Synthetic Client — returns realistic clinical data for demo/staging.
 *
 * Deterministic: same input always produces the same output.
 * Activated via CONNECTOR_MODE=synthetic environment variable.
 */

import type {
  PCCResident,
  PCCMedication,
  PCCAssessment,
  PCCAssessmentType,
  PCCVitals,
  PCCIncident,
  PCCIncidentType,
  PCCCarePlan,
  PCCCensus,
  PCCCensusResident,
  PCCLabResult,
  PCCApiResponse,
  PCCDiagnosis,
  PCCAllergy,
  PCCAdvanceDirective,
  PCCCarePlanProblem,
  PCCCarePlanGoal,
  PCCCarePlanIntervention,
  PCCProgressNote,
  PCCProgressNoteInput,
} from './types.js';

import {
  DEMO_FACILITIES,
  getFacility,
  getResidentPool,
  pick,
  pickN,
  seedHash,
  seededInt,
  seededFloat,
  daysAgo,
  daysAgoISO,
  DRUG_NAMES,
  LAB_TESTS,
  PHYSICIAN_NAMES,
  PHYSICIAN_NPIS,
  type SyntheticResident,
} from '../synthetic/seed-data.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function paginate<T>(items: T[], pageSize: number, pageNumber: number): PCCApiResponse<T[]> {
  const start = (pageNumber - 1) * pageSize;
  const page = items.slice(start, start + pageSize);
  return {
    data: page,
    meta: {
      totalCount: items.length,
      pageSize,
      pageNumber,
      hasMore: start + pageSize < items.length,
    },
  };
}

function singleResponse<T>(data: T): PCCApiResponse<T> {
  return {
    data,
    meta: { totalCount: 1, pageSize: 1, pageNumber: 1, hasMore: false },
  };
}

// ---------------------------------------------------------------------------
// Resident Builder
// ---------------------------------------------------------------------------

const SECONDARY_DIAGNOSES: readonly { code: string; desc: string }[] = [
  { code: 'I10', desc: 'Essential hypertension' },
  { code: 'E78.5', desc: 'Hyperlipidemia, unspecified' },
  { code: 'E11.9', desc: 'Type 2 diabetes without complications' },
  { code: 'F32.1', desc: 'Major depressive disorder, single episode, moderate' },
  { code: 'G47.33', desc: 'Obstructive sleep apnea' },
  { code: 'M81.0', desc: 'Age-related osteoporosis without pathological fracture' },
  { code: 'J45.20', desc: 'Mild intermittent asthma, uncomplicated' },
  { code: 'K21.0', desc: 'Gastro-esophageal reflux disease with esophagitis' },
  { code: 'N40.0', desc: 'Benign prostatic hyperplasia without lower urinary tract symptoms' },
  { code: 'G89.29', desc: 'Other chronic pain' },
];

const ALLERGIES: readonly { allergen: string; reaction: string }[] = [
  { allergen: 'Penicillin', reaction: 'Rash' },
  { allergen: 'Sulfa drugs', reaction: 'Hives' },
  { allergen: 'Codeine', reaction: 'Nausea/Vomiting' },
  { allergen: 'Latex', reaction: 'Contact dermatitis' },
  { allergen: 'Iodine', reaction: 'Anaphylaxis' },
  { allergen: 'Aspirin', reaction: 'GI bleeding' },
  { allergen: 'NKDA', reaction: 'No known drug allergies' },
];

function buildFullResident(sr: SyntheticResident): PCCResident {
  const seed = sr.residentId;
  const phIdx = seedHash(`${seed}-ph`) % PHYSICIAN_NAMES.length;
  const numDx = seededInt(2, 5, `${seed}-ndx`);
  const secondaryDx = pickN(SECONDARY_DIAGNOSES, numDx - 1, `${seed}-sdx`);
  const numAllergies = seededInt(1, 3, `${seed}-nal`);
  const allergyList = pickN(ALLERGIES, numAllergies, `${seed}-alg`);

  const diagnosisList: PCCDiagnosis[] = [
    { icd10Code: sr.primaryDiagnosisCode, description: sr.primaryDiagnosisDescription, onsetDate: sr.admissionDate, rank: 1, isPrimary: true },
    ...secondaryDx.map((d, i) => ({
      icd10Code: d.code,
      description: d.desc,
      onsetDate: daysAgo(seededInt(30, 1200, `${seed}-dxon-${i}`)),
      rank: i + 2,
      isPrimary: false,
    })),
  ];

  const allergies: PCCAllergy[] = allergyList.map((a, i) => ({
    allergen: a.allergen,
    reaction: a.reaction,
    severity: pick(['Mild', 'Moderate', 'Severe'] as const, `${seed}-asev-${i}`),
    onsetDate: a.allergen === 'NKDA' ? null : daysAgo(seededInt(365, 3650, `${seed}-aon-${i}`)),
  }));

  const directives: PCCAdvanceDirective[] = [
    {
      type: pick(['Full Code', 'DNR', 'DNR/DNI', 'Comfort Care Only'] as const, `${seed}-ad`),
      status: 'Active',
      effectiveDate: sr.admissionDate,
      expirationDate: null,
    },
  ];

  const payerMap: Record<string, string> = {
    MA: 'Medicare Part A', MB: 'Medicare Part B', MC: 'Medicaid',
    MCO: 'Managed Care Organization', PP: 'Private Pay', VA: 'Veterans Affairs',
  };

  return {
    residentId: sr.residentId,
    facilityId: sr.facilityId,
    firstName: sr.firstName,
    middleName: seedHash(`${seed}-mn`) % 3 === 0 ? pick(['A', 'M', 'J', 'L', 'R'] as const, `${seed}-mid`) : null,
    lastName: sr.lastName,
    dateOfBirth: sr.dateOfBirth,
    gender: sr.gender,
    ssn: null, // never expose in synthetic
    medicareNumber: sr.payerCode === 'MA' || sr.payerCode === 'MB' ? `${seededInt(100, 999, `${seed}-mcare`)}A${seededInt(10000, 99999, `${seed}-mcare2`)}` : null,
    medicaidNumber: sr.payerCode === 'MC' ? `${seededInt(1000000, 9999999, `${seed}-mcaid`)}` : null,
    roomNumber: sr.roomNumber,
    bedNumber: sr.bedNumber,
    admissionDate: sr.admissionDate,
    dischargeDate: null,
    payerCode: sr.payerCode,
    payerName: payerMap[sr.payerCode] ?? 'Private Pay',
    primaryDiagnosisCode: sr.primaryDiagnosisCode,
    primaryDiagnosisDescription: sr.primaryDiagnosisDescription,
    diagnosisList,
    allergies,
    advanceDirectives: directives,
    residentStatus: 'Active',
    careLevel: pick(['Skilled', 'Intermediate', 'Custodial'] as const, `${seed}-cl`),
    physicianName: PHYSICIAN_NAMES[phIdx],
    physicianNpi: PHYSICIAN_NPIS[phIdx],
  };
}

// ---------------------------------------------------------------------------
// PCC Synthetic Client
// ---------------------------------------------------------------------------

export class PCCSyntheticClient {

  getResident(facilityId: string, residentId: string): PCCApiResponse<PCCResident> {
    const pool = getResidentPool(facilityId);
    const sr = pool.find((r) => r.residentId === residentId);
    if (!sr) {
      // Return first resident as fallback for demo
      return singleResponse(buildFullResident(pool[0]));
    }
    return singleResponse(buildFullResident(sr));
  }

  searchResidents(
    facilityId: string,
    filters: { firstName?: string; lastName?: string; roomNumber?: string; payerCode?: string; status?: string },
    pageSize = 50,
    pageNumber = 1,
  ): PCCApiResponse<PCCResident[]> {
    let pool = getResidentPool(facilityId);

    if (filters.firstName) {
      const q = filters.firstName.toLowerCase();
      pool = pool.filter((r) => r.firstName.toLowerCase().includes(q));
    }
    if (filters.lastName) {
      const q = filters.lastName.toLowerCase();
      pool = pool.filter((r) => r.lastName.toLowerCase().includes(q));
    }
    if (filters.roomNumber) {
      pool = pool.filter((r) => r.roomNumber === filters.roomNumber);
    }
    if (filters.payerCode) {
      pool = pool.filter((r) => r.payerCode === filters.payerCode);
    }

    const residents = pool.map(buildFullResident);
    return paginate(residents, pageSize, pageNumber);
  }

  getMedications(facilityId: string, residentId: string, filters?: { status?: string; psychotropicOnly?: boolean }): PCCApiResponse<PCCMedication[]> {
    const seed = `${facilityId}-${residentId}`;
    const resident = getResidentPool(facilityId).find((r) => r.residentId === residentId);
    const numMeds = seededInt(4, 10, `${seed}-nmeds`);
    const drugs = pickN(DRUG_NAMES, numMeds, `${seed}-drugs`);
    const phIdx = seedHash(`${residentId}-ph`) % PHYSICIAN_NAMES.length;

    let meds: PCCMedication[] = drugs.map((d, i) => {
      const medSeed = `${seed}-med-${i}`;
      return {
        medicationId: `MED-${seedHash(medSeed).toString(36).toUpperCase().slice(0, 8)}`,
        residentId,
        drugName: d.brand,
        genericName: d.generic,
        dosage: d.dosage,
        route: d.route,
        frequency: d.frequency,
        prescribedDate: daysAgo(seededInt(7, 365, `${medSeed}-pd`)),
        discontinuedDate: null,
        prescriberId: `PRV-${seedHash(`${medSeed}-prv`).toString(36).toUpperCase().slice(0, 6)}`,
        prescriberName: PHYSICIAN_NAMES[phIdx],
        status: d.frequency.includes('PRN') ? 'PRN' as const : 'Active' as const,
        isPsychotropic: d.isPsychotropic,
        isControlled: d.isControlled,
        gradualDoseReductionDue: d.isPsychotropic ? daysAgo(-seededInt(7, 90, `${medSeed}-gdr`)) : null,
        pharmacyNotes: null,
      };
    });

    if (filters?.psychotropicOnly) {
      meds = meds.filter((m) => m.isPsychotropic);
    }
    if (filters?.status && filters.status !== 'All') {
      meds = meds.filter((m) => m.status === filters.status);
    }

    return paginate(meds, 200, 1);
  }

  getAssessments(
    facilityId: string,
    residentId: string,
    filters?: { assessmentType?: PCCAssessmentType; fromDate?: string; toDate?: string; status?: string },
  ): PCCApiResponse<PCCAssessment[]> {
    const seed = `${facilityId}-${residentId}`;
    const assessments: PCCAssessment[] = [];

    // MDS Quarterly
    assessments.push(buildAssessment(seed, residentId, 'MDS_QUARTERLY', 0));
    assessments.push(buildAssessment(seed, residentId, 'MDS_ADMISSION', 1));
    // BIMS
    assessments.push(buildAssessment(seed, residentId, 'BIMS', 2));
    // PHQ-9
    assessments.push(buildAssessment(seed, residentId, 'PHQ9', 3));
    // Falls Risk
    assessments.push(buildAssessment(seed, residentId, 'FALLS_RISK', 4));
    // Braden
    assessments.push(buildAssessment(seed, residentId, 'BRADEN', 5));
    // Pain
    assessments.push(buildAssessment(seed, residentId, 'PAIN', 6));

    let result = assessments;
    if (filters?.assessmentType) {
      result = result.filter((a) => a.assessmentType === filters.assessmentType);
    }

    return paginate(result, 200, 1);
  }

  getVitals(facilityId: string, residentId: string, _filters?: { fromDate?: string; toDate?: string; limit?: number }): PCCApiResponse<PCCVitals[]> {
    const seed = `${facilityId}-${residentId}`;
    const limit = _filters?.limit ?? 30;
    const vitals: PCCVitals[] = [];

    for (let day = 0; day < limit; day++) {
      const vSeed = `${seed}-vitals-${day}`;
      vitals.push({
        vitalsId: `VIT-${seedHash(vSeed).toString(36).toUpperCase().slice(0, 8)}`,
        residentId,
        recordedDate: daysAgoISO(day),
        recordedBy: pick(['J. Walsh, RN', 'L. Park, RN', 'M. Santos, RN', 'P. Chen, CNA'] as const, `${vSeed}-by`),
        temperature: seededFloat(97.2, 99.4, `${vSeed}-temp`, 1),
        temperatureUnit: 'F',
        bloodPressureSystolic: seededInt(110, 160, `${vSeed}-sys`),
        bloodPressureDiastolic: seededInt(60, 95, `${vSeed}-dia`),
        heartRate: seededInt(58, 100, `${vSeed}-hr`),
        respiratoryRate: seededInt(14, 22, `${vSeed}-rr`),
        oxygenSaturation: seededInt(92, 100, `${vSeed}-o2`),
        weight: seededFloat(120, 210, `${vSeed}-wt`, 1),
        weightUnit: 'lbs',
        painLevel: seededInt(0, 6, `${vSeed}-pain`),
        bloodGlucose: seedHash(`${vSeed}-bg`) % 3 === 0 ? seededInt(80, 250, `${vSeed}-bg`) : null,
      });
    }

    return paginate(vitals, limit, 1);
  }

  getIncidents(facilityId: string, filters?: { residentId?: string; incidentType?: PCCIncidentType; severity?: string; fromDate?: string; toDate?: string; status?: string }): PCCApiResponse<PCCIncident[]> {
    const seed = `${facilityId}-incidents`;
    const count = seededInt(3, 12, `${seed}-count`);
    const incidentTypes: PCCIncidentType[] = ['Fall', 'Medication Error', 'Infection', 'Skin Integrity', 'Behavior', 'Elopement', 'Fall', 'Fall'];
    const pool = getResidentPool(facilityId);

    const incidents: PCCIncident[] = [];
    for (let i = 0; i < count; i++) {
      const iSeed = `${seed}-${i}`;
      const resident = pool[seedHash(`${iSeed}-res`) % pool.length];
      const incType = pick(incidentTypes, `${iSeed}-type`);
      const dayOffset = seededInt(1, 90, `${iSeed}-day`);

      incidents.push({
        incidentId: `INC-${seedHash(iSeed).toString(36).toUpperCase().slice(0, 8)}`,
        residentId: resident.residentId,
        facilityId,
        incidentDate: daysAgoISO(dayOffset),
        reportedDate: daysAgoISO(dayOffset),
        reportedBy: pick(['J. Walsh, RN', 'M. Santos, RN', 'L. Park, DON'] as const, `${iSeed}-by`),
        incidentType: incType,
        severity: pick(['Minor', 'Moderate', 'Major'] as const, `${iSeed}-sev`),
        location: pick([
          `Room ${resident.roomNumber}`, 'Hallway - South Wing', 'Dining Room',
          'Bathroom', 'Activity Room', 'Therapy Gym',
        ] as const, `${iSeed}-loc`),
        description: getIncidentDescription(incType, resident, iSeed),
        injuries: incType === 'Fall' ? getInjuries(iSeed) : [],
        witnessNames: seedHash(`${iSeed}-wit`) % 2 === 0 ? [pick(['CNA P. Chen', 'LPN J. Rodriguez', 'Housekeeper M. Torres'] as const, `${iSeed}-witn`)] : [],
        interventions: getInterventions(incType, iSeed),
        followUpRequired: seedHash(`${iSeed}-fu`) % 3 !== 0,
        followUpDate: seedHash(`${iSeed}-fu`) % 3 !== 0 ? daysAgo(dayOffset - 3) : null,
        status: pick(['Open', 'Under Review', 'Closed', 'Closed'] as const, `${iSeed}-stat`),
      });
    }

    let result = incidents;
    if (filters?.residentId) result = result.filter((i) => i.residentId === filters.residentId);
    if (filters?.incidentType) result = result.filter((i) => i.incidentType === filters.incidentType);
    if (filters?.severity) result = result.filter((i) => i.severity === filters.severity);
    if (filters?.status) result = result.filter((i) => i.status === filters.status);

    return paginate(result, 200, 1);
  }

  getCarePlan(facilityId: string, residentId: string, _status?: string): PCCApiResponse<PCCCarePlan[]> {
    const seed = `${facilityId}-${residentId}-cp`;
    const sr = getResidentPool(facilityId).find((r) => r.residentId === residentId) ?? getResidentPool(facilityId)[0];

    const problems: PCCCarePlanProblem[] = [
      buildCarePlanProblem(seed, 0, sr.primaryDiagnosisDescription, sr.admissionDate),
      buildCarePlanProblem(seed, 1, 'Risk for falls related to impaired mobility', sr.admissionDate),
      buildCarePlanProblem(seed, 2, 'Chronic pain management', daysAgo(seededInt(30, 180, `${seed}-p2`))),
    ];

    const carePlan: PCCCarePlan = {
      carePlanId: `CP-${seedHash(seed).toString(36).toUpperCase().slice(0, 8)}`,
      residentId,
      createdDate: sr.admissionDate,
      lastReviewDate: daysAgo(seededInt(1, 30, `${seed}-rev`)),
      nextReviewDate: daysAgo(-seededInt(30, 90, `${seed}-next`)),
      status: 'Active',
      problems,
    };

    return paginate([carePlan], 10, 1);
  }

  createProgressNote(input: PCCProgressNoteInput): PCCApiResponse<PCCProgressNote> {
    const note: PCCProgressNote = {
      ...input,
      noteId: `NOTE-${seedHash(`${input.residentId}-${Date.now()}`).toString(36).toUpperCase().slice(0, 8)}`,
      createdDate: new Date().toISOString(),
      signedDate: null,
      signedBy: null,
      status: 'Draft',
    };
    return singleResponse(note);
  }

  getCensus(facilityId: string, _censusDate?: string): PCCCensus {
    const facility = getFacility(facilityId);
    if (!facility) {
      return { facilityId, censusDate: daysAgo(0), totalBeds: 100, occupiedBeds: 85, availableBeds: 15, occupancyRate: 0.85, residents: [], pendingAdmissions: 0, pendingDischarges: 0 };
    }

    const pool = getResidentPool(facilityId);
    const occupancyPct = seededFloat(0.80, 0.95, `${facilityId}-occ`, 3);
    const occupiedBeds = Math.round(facility.totalBeds * occupancyPct);
    const availableBeds = facility.totalBeds - occupiedBeds;

    const censusResidents: PCCCensusResident[] = pool.slice(0, occupiedBeds).map((r) => ({
      residentId: r.residentId,
      firstName: r.firstName,
      lastName: r.lastName,
      roomNumber: r.roomNumber,
      bedNumber: r.bedNumber,
      admissionDate: r.admissionDate,
      payerCode: r.payerCode,
      residentStatus: 'Active',
    }));

    return {
      facilityId,
      censusDate: _censusDate ?? daysAgo(0),
      totalBeds: facility.totalBeds,
      occupiedBeds,
      availableBeds,
      occupancyRate: Math.round(occupancyPct * 1000) / 1000,
      residents: censusResidents,
      pendingAdmissions: seededInt(0, 4, `${facilityId}-padm`),
      pendingDischarges: seededInt(0, 3, `${facilityId}-pdis`),
    };
  }

  getLabResults(
    facilityId: string,
    residentId: string,
    filters?: { testName?: string; fromDate?: string; toDate?: string; abnormalOnly?: boolean },
  ): PCCApiResponse<PCCLabResult[]> {
    const seed = `${facilityId}-${residentId}-labs`;
    const phIdx = seedHash(`${residentId}-ph`) % PHYSICIAN_NAMES.length;
    const results: PCCLabResult[] = [];

    // Generate 2 rounds of labs (recent and 2 weeks ago)
    for (let round = 0; round < 2; round++) {
      const roundDate = daysAgo(round * 14 + seededInt(0, 3, `${seed}-rd-${round}`));
      for (const test of LAB_TESTS) {
        const lSeed = `${seed}-${test.code}-${round}`;
        // 80% normal, 15% mild abnormal, 5% critical
        const roll = seededFloat(0, 1, lSeed, 3);
        let value: number;
        let flag: PCCLabResult['abnormalFlag'];

        if (roll < 0.80) {
          value = seededFloat(test.normalMin, test.normalMax, `${lSeed}-val`, 1);
          flag = 'Normal';
        } else if (roll < 0.90) {
          value = seededFloat(test.normalMax, test.normalMax * 1.3, `${lSeed}-val`, 1);
          flag = 'High';
        } else if (roll < 0.95) {
          value = seededFloat(test.normalMin * 0.7, test.normalMin, `${lSeed}-val`, 1);
          flag = 'Low';
        } else if (roll < 0.975) {
          value = seededFloat(test.normalMax * 1.3, test.physioMax * 0.8, `${lSeed}-val`, 1);
          flag = 'Critical High';
        } else {
          value = seededFloat(test.physioMin, test.normalMin * 0.7, `${lSeed}-val`, 1);
          flag = 'Critical Low';
        }

        // Clamp to physiologic range
        value = Math.max(test.physioMin, Math.min(test.physioMax, value));

        results.push({
          labResultId: `LAB-${seedHash(lSeed).toString(36).toUpperCase().slice(0, 8)}`,
          residentId,
          orderId: `ORD-${seedHash(`${lSeed}-ord`).toString(36).toUpperCase().slice(0, 8)}`,
          testName: test.name,
          testCode: test.code,
          resultValue: String(value),
          resultUnit: test.unit,
          referenceRange: test.refRange,
          abnormalFlag: flag,
          collectionDate: roundDate,
          resultDate: roundDate,
          performingLab: 'Quest Diagnostics',
          orderingProvider: PHYSICIAN_NAMES[phIdx],
          status: 'Final',
        });
      }
    }

    let filtered = results;
    if (filters?.testName) {
      const q = filters.testName.toLowerCase();
      filtered = filtered.filter((r) => r.testName.toLowerCase().includes(q) || r.testCode.toLowerCase().includes(q));
    }
    if (filters?.abnormalOnly) {
      filtered = filtered.filter((r) => r.abnormalFlag !== 'Normal');
    }

    return paginate(filtered, 200, 1);
  }
}

// ---------------------------------------------------------------------------
// Assessment Builder
// ---------------------------------------------------------------------------

function buildAssessment(seed: string, residentId: string, type: PCCAssessmentType, idx: number): PCCAssessment {
  const aSeed = `${seed}-assess-${idx}`;
  const daysBack = seededInt(5, 90, `${aSeed}-days`);

  let score: number | null = null;
  const sections: PCCAssessment['sections'] = [];

  switch (type) {
    case 'BIMS':
      score = seededInt(0, 15, `${aSeed}-score`);
      sections.push({
        sectionCode: 'C0200-C0500',
        sectionName: 'Brief Interview for Mental Status',
        items: { repetition: seededInt(0, 2, `${aSeed}-rep`), year: seededInt(0, 1, `${aSeed}-yr`), month: seededInt(0, 1, `${aSeed}-mo`), day: seededInt(0, 1, `${aSeed}-day`), recall: seededInt(0, 2, `${aSeed}-rec`) },
      });
      break;
    case 'PHQ9':
      score = seededInt(0, 27, `${aSeed}-score`);
      sections.push({
        sectionCode: 'D0200',
        sectionName: 'Patient Health Questionnaire',
        items: { interest: seededInt(0, 3, `${aSeed}-i1`), depressed: seededInt(0, 3, `${aSeed}-i2`), sleep: seededInt(0, 3, `${aSeed}-i3`), tired: seededInt(0, 3, `${aSeed}-i4`), appetite: seededInt(0, 3, `${aSeed}-i5`) },
      });
      break;
    case 'FALLS_RISK':
      score = seededInt(0, 125, `${aSeed}-score`); // Morse Fall Scale 0-125
      sections.push({
        sectionCode: 'J1800',
        sectionName: 'Morse Fall Scale',
        items: { history_of_falling: seededInt(0, 25, `${aSeed}-hf`), secondary_diagnosis: seededInt(0, 15, `${aSeed}-sd`), ambulatory_aid: seededInt(0, 30, `${aSeed}-aa`), iv_therapy: seededInt(0, 20, `${aSeed}-iv`), gait: seededInt(0, 20, `${aSeed}-gait`), mental_status: seededInt(0, 15, `${aSeed}-ms`) },
      });
      break;
    case 'BRADEN':
      score = seededInt(9, 23, `${aSeed}-score`); // 6-23, lower = higher risk
      sections.push({
        sectionCode: 'M0300',
        sectionName: 'Braden Scale',
        items: { sensory_perception: seededInt(1, 4, `${aSeed}-sp`), moisture: seededInt(1, 4, `${aSeed}-moist`), activity: seededInt(1, 4, `${aSeed}-act`), mobility: seededInt(1, 4, `${aSeed}-mob`), nutrition: seededInt(1, 4, `${aSeed}-nut`), friction_shear: seededInt(1, 3, `${aSeed}-fs`) },
      });
      break;
    case 'PAIN':
      score = seededInt(0, 10, `${aSeed}-score`);
      sections.push({
        sectionCode: 'J0200-J0600',
        sectionName: 'Pain Assessment',
        items: { pain_frequency: seededInt(0, 3, `${aSeed}-freq`), pain_intensity: seededInt(0, 10, `${aSeed}-int`), pain_relief: seededInt(0, 2, `${aSeed}-rel`) },
      });
      break;
    default:
      // MDS types
      score = null;
      sections.push({
        sectionCode: 'A0310',
        sectionName: 'Type of Assessment',
        items: { assessment_type: type, rug_score: `${pick(['ES', 'HE', 'HC', 'HD', 'LE', 'LB'] as const, `${aSeed}-rug`)}${seededInt(1, 3, `${aSeed}-rugl`)}` },
      });
      break;
  }

  return {
    assessmentId: `ASM-${seedHash(aSeed).toString(36).toUpperCase().slice(0, 8)}`,
    residentId,
    assessmentType: type,
    assessmentDate: daysAgo(daysBack),
    completedDate: daysAgo(daysBack - seededInt(0, 3, `${aSeed}-comp`)),
    completedBy: pick(['L. Park, RN', 'S. Martinez, DON', 'J. Walsh, RN-MDS'] as const, `${aSeed}-by`),
    status: 'Completed',
    ardDate: type.startsWith('MDS') ? daysAgo(daysBack + seededInt(0, 7, `${aSeed}-ard`)) : null,
    score,
    sections,
  };
}

// ---------------------------------------------------------------------------
// Care Plan Builder
// ---------------------------------------------------------------------------

function buildCarePlanProblem(seed: string, idx: number, problem: string, onsetDate: string): PCCCarePlanProblem {
  const pSeed = `${seed}-prob-${idx}`;
  const goals: PCCCarePlanGoal[] = [
    {
      goalId: `GOAL-${seedHash(`${pSeed}-g0`).toString(36).toUpperCase().slice(0, 6)}`,
      description: `Resident will ${pick(['demonstrate improvement in', 'maintain current level of', 'achieve stabilization of'] as const, `${pSeed}-gdesc`)} ${problem.toLowerCase().slice(0, 40)}`,
      targetDate: daysAgo(-seededInt(30, 90, `${pSeed}-gtar`)),
      status: pick(['Active', 'Met', 'Active'] as const, `${pSeed}-gstat`),
      measurableCriteria: `${pick(['Score improvement of >=2 points', 'No decline in functional status', 'Zero incidents related to condition', 'Pain level maintained at <=4'] as const, `${pSeed}-gcrit`)}`,
    },
  ];

  const interventions: PCCCarePlanIntervention[] = [
    {
      interventionId: `INT-${seedHash(`${pSeed}-i0`).toString(36).toUpperCase().slice(0, 6)}`,
      description: pick([
        'Monitor and document vital signs per protocol',
        'Administer medications as ordered',
        'Provide assistance with ADLs as needed',
        'Implement fall prevention precautions',
        'Conduct weekly pain reassessment',
        'Encourage participation in therapy sessions',
        'Monitor intake and output',
        'Provide emotional support and active listening',
      ] as const, `${pSeed}-idesc`),
      frequency: pick(['Every shift', 'Daily', 'Weekly', 'BID', 'PRN'] as const, `${pSeed}-ifreq`),
      responsibleDiscipline: pick(['Nursing', 'Therapy', 'Social Services', 'Dietary'] as const, `${pSeed}-idisc`),
      startDate: onsetDate,
      endDate: null,
    },
    {
      interventionId: `INT-${seedHash(`${pSeed}-i1`).toString(36).toUpperCase().slice(0, 6)}`,
      description: pick([
        'Educate resident/family on condition management',
        'Coordinate with physician for medication review',
        'Refer to PT/OT for functional assessment',
        'Schedule care conference with interdisciplinary team',
      ] as const, `${pSeed}-idesc2`),
      frequency: pick(['As needed', 'Quarterly', 'Monthly'] as const, `${pSeed}-ifreq2`),
      responsibleDiscipline: pick(['Nursing', 'Social Services', 'MDS Coordinator'] as const, `${pSeed}-idisc2`),
      startDate: onsetDate,
      endDate: null,
    },
  ];

  return {
    problemId: `PROB-${seedHash(pSeed).toString(36).toUpperCase().slice(0, 6)}`,
    problem,
    onsetDate,
    goals,
    interventions,
  };
}

// ---------------------------------------------------------------------------
// Incident Description Helpers
// ---------------------------------------------------------------------------

function getIncidentDescription(type: PCCIncidentType, resident: SyntheticResident, seed: string): string {
  const name = `${resident.firstName} ${resident.lastName}`;
  switch (type) {
    case 'Fall':
      return pick([
        `${name} found on floor next to bed at ${seededInt(1, 12, seed)}:${seededInt(10, 55, `${seed}-m`).toString().padStart(2, '0')} AM. Call light within reach. Resident states "I was trying to get to the bathroom." No visible injuries noted.`,
        `${name} slipped while transferring from wheelchair to bed. Staff present and assisted resident to floor gently. Skin tear noted on right forearm.`,
        `${name} found sitting on floor in hallway near room. Alert and oriented. States legs "gave out." No injuries observed. Vitals stable.`,
      ] as const, seed);
    case 'Medication Error':
      return `Medication administration error involving ${name}: ${pick(['wrong time - medication given 2 hours late', 'missed dose discovered during med pass reconciliation', 'incorrect dosage documented but correct amount given'] as const, seed)}.`;
    case 'Infection':
      return `${name} presenting with signs of ${pick(['urinary tract infection - fever 101.2F, cloudy urine, increased confusion', 'upper respiratory infection - productive cough, low-grade fever', 'wound infection at Stage II pressure injury site'] as const, seed)}.`;
    case 'Skin Integrity':
      return `Skin assessment for ${name} revealed ${pick(['new Stage II pressure ulcer on sacrum, 2cm x 1.5cm', 'skin tear on left forearm during ADL assistance', 'deterioration of existing wound on right heel'] as const, seed)}.`;
    case 'Behavior':
      return `${name} exhibited ${pick(['verbal aggression toward staff during morning care', 'exit-seeking behavior, found at front entrance', 'refusal of medications with agitation'] as const, seed)}.`;
    case 'Elopement':
      return `${name} found outside facility perimeter at ${seededInt(1, 12, seed)}:${seededInt(10, 55, `${seed}-m`).toString().padStart(2, '0')} PM. Door alarm activated. Resident redirected safely. No injuries.`;
    default:
      return `Incident involving ${name} in Room ${resident.roomNumber}. Staff notified physician and family.`;
  }
}

function getInjuries(seed: string): string[] {
  const roll = seedHash(seed) % 4;
  if (roll === 0) return [];
  if (roll === 1) return ['No visible injuries'];
  if (roll === 2) return ['Skin tear - right forearm'];
  return ['Bruise - left hip', 'Minor abrasion - right knee'];
}

function getInterventions(type: PCCIncidentType, seed: string): string[] {
  const base = ['Notified physician', 'Documented in medical record', 'Notified family/responsible party'];
  if (type === 'Fall') return [...base, 'Neurological checks q15min x 4', 'Updated care plan', 'Bed alarm activated'];
  if (type === 'Infection') return [...base, 'Obtained cultures', 'Initiated isolation precautions'];
  return base;
}

// ---------------------------------------------------------------------------
// Singleton
// ---------------------------------------------------------------------------

export const pccSyntheticClient = new PCCSyntheticClient();
