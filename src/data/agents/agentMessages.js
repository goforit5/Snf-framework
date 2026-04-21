// Inter-Agent Message Threads — typed protocol for agent-to-agent collaboration
// Powers the Agent Collaboration view showing how agents negotiate, request data, and escalate
// Each message has a typed intent (REQUEST_DATA, RESPONSE, PROPOSAL, COUNTER, DISPUTE, etc.)
// and structured fields so the UI can render both narrative and data views

export const agentMessages = [
  // ─── TH-1042: Billing requests therapy minutes from Clinical ──────────
  // Straightforward data handoff — billing needs therapy data for PDPM claim accuracy
  {
    thread: 'TH-1042',
    status: 'resolved',
    duration: '47s',
    escalated: false,
    topic: 'Therapy minutes validation for March Medicare Part A claims batch',
    participants: ['billing-claims', 'therapy-agent'],
    messages: [
      {
        from: 'billing-claims',
        to: 'therapy-agent',
        type: 'REQUEST_DATA',
        t: '11:42:14',
        body: 'Preparing March Medicare Part A claims batch for 38 residents. Need validated therapy minutes by discipline (PT/OT/ST) for the billing period March 1-15 to ensure PDPM classification accuracy before submission.',
        fields: {
          claimsBatch: 'MCR-2026-03A',
          residentCount: 38,
          billingPeriod: 'March 1-15, 2026',
          facilityIds: 'f1, f3, f4',
          dataNeeded: 'PT/OT/ST minutes per resident, authorization status, functional outcome scores',
        },
      },
      {
        from: 'therapy-agent',
        to: 'billing-claims',
        type: 'RESPONSE',
        t: '11:42:38',
        body: 'Therapy minutes validated against PCC session logs. 36 of 38 residents have complete therapy documentation. Two residents have documentation gaps — Maria Torres (Room 118A, missing 2 OT sessions) and Frank Goldberg (Room 305B, ST authorization expired March 10). Recommend holding those 2 claims for correction.',
        fields: {
          validatedResidents: 36,
          holdResidents: 2,
          totalPTMinutes: 4280,
          totalOTMinutes: 3140,
          totalSTMinutes: 1860,
          gapDetails: 'Maria Torres: 2 OT sessions undocumented (est. 60 min). Frank Goldberg: ST auth expired, 3 sessions post-expiry.',
          avgFunctionalGain: '+4.2 points (GG items)',
        },
      },
      {
        from: 'billing-claims',
        to: 'therapy-agent',
        type: 'ACKNOWLEDGE',
        t: '11:43:01',
        body: 'Received. Submitting 36 clean claims now. Holding Torres and Goldberg for documentation remediation. Flagging Goldberg ST authorization to revenue-optimization for renewal tracking.',
        fields: {
          claimsSubmitted: 36,
          claimsHeld: 2,
          estimatedReimbursement: '$284,600',
          nextAction: 'Submit clean batch, route holds to remediation queue',
        },
      },
    ],
  },

  // ─── TH-1043: OT staffing increase proposal — dispute escalates to DON + CEO ─
  // The Margaret Chen fall cascade triggers a cross-domain staffing debate
  {
    thread: 'TH-1043',
    status: 'escalated',
    duration: '4m 12s',
    escalated: true,
    topic: 'Heritage Oaks night shift OT staffing increase vs weekend differential pilot',
    participants: ['clinical-monitor', 'payroll-audit', 'enterprise-orchestrator'],
    humans: ['DON', 'CEO'],
    messages: [
      {
        from: 'clinical-monitor',
        to: 'enterprise-orchestrator',
        type: 'PROPOSAL',
        t: '07:02:33',
        body: 'Heritage Oaks fall cluster analysis complete. 6 falls in 30 days, 67% concentrated in East Wing during night shift. Root cause: CNA-to-resident ratio is 1:15 vs target 1:12. Proposing immediate hire of 3 additional night shift OT aides at Heritage Oaks to close the gap. This is a patient safety issue — Margaret Chen is the third repeat faller this month.',
        fields: {
          facilityId: 'f4',
          fallsLast30Days: 6,
          eastWingConcentration: '67%',
          currentRatio: '1:15',
          targetRatio: '1:12',
          proposedHires: 3,
          annualCost: '$189,000',
          riskMitigated: 'F-689 citation risk ($50K+ CMP), litigation exposure ($200K+ per fall claim)',
          traceId: 'TRACE-MCF-001',
        },
      },
      {
        from: 'payroll-audit',
        to: 'enterprise-orchestrator',
        type: 'COUNTER',
        t: '07:03:18',
        body: 'Acknowledge the safety concern, but 3 FTE hires at $189K/year is premature. Heritage Oaks is already 8.2% over labor budget this month from the CNA overtime spike. Counter-proposal: implement a 90-day weekend differential pilot ($4/hr premium) to attract existing staff to night/weekend shifts. This fills gaps without permanent headcount. If the pilot fails to reduce falls by 40%, then escalate to full hiring.',
        fields: {
          currentLaborOverage: '8.2%',
          proposedDifferential: '$4/hr weekend premium',
          pilotDuration: '90 days',
          pilotCost: '$28,800',
          successMetric: '40% fall reduction',
          fallbackAction: 'Proceed with 3 FTE hires if pilot fails',
          monthlyBudgetImpact: '$9,600 vs $15,750 for hires',
        },
      },
      {
        from: 'clinical-monitor',
        to: 'enterprise-orchestrator',
        type: 'DISPUTE',
        t: '07:04:41',
        body: 'Differential pilot is insufficient for an active patient safety crisis. Margaret Chen has fallen 3 times in 30 days. Two other residents are repeat fallers. A 90-day pilot means 90 more days at unsafe staffing levels. CMS surveyors do not accept "we are running a pilot" as a defense for F-689 citations. The cost of one fall-related lawsuit ($200K-$500K) dwarfs the $189K annual hire cost. Patient safety must take precedence over budget optimization.',
        fields: {
          activeRepeatFallers: 3,
          f689RiskScore: 88,
          f689RiskLevel: 'HIGH',
          averageFallLitigationCost: '$200,000-$500,000',
          cmsDefenseViability: 'LOW — pilot does not constitute immediate corrective action',
          patientSafetyPriority: 'CRITICAL',
        },
      },
      {
        from: 'enterprise-orchestrator',
        to: 'clinical-monitor',
        type: 'ESCALATE',
        t: '07:06:45',
        body: 'Agent consensus not reached. Clinical-monitor cites immediate patient safety risk and regulatory exposure. Payroll-audit cites budget constraints and proposes phased approach. Both positions have merit — this requires human judgment on risk tolerance. Escalating to DON (clinical authority) and CEO (budget authority) for joint decision. Full analysis package attached.',
        fields: {
          escalationId: 'ESC-001',
          decisionId: 'D-4830',
          escalationReason: 'Agent disagreement on staffing approach — patient safety vs budget optimization',
          agentAPosition: '3 FTE hires ($189K/yr) — immediate safety correction',
          agentBPosition: 'Weekend differential pilot ($28.8K/90 days) — phased approach',
          requiredDeciders: 'DON, CEO',
          policyTrigger: 'P-004 (Governance Level 4: agent disagreement with >$50K impact)',
          slaDeadline: '24 hours',
        },
      },
    ],
  },

  // ─── TH-1044: Procurement needs GL spend data for Sysco dispute ───────
  // Cross-domain data request — procurement building contract dispute evidence
  {
    thread: 'TH-1044',
    status: 'pending',
    duration: '\u2014',
    escalated: false,
    topic: 'Historical spend analysis for Sysco paper goods contract dispute',
    participants: ['procurement-agent', 'monthly-close'],
    messages: [
      {
        from: 'procurement-agent',
        to: 'monthly-close',
        type: 'REQUEST_DATA',
        t: '08:14:22',
        body: 'Building evidence package for Sysco price violation dispute (Contract #2024-0156). Need 12-month GL spend history for paper goods category across all 5 facilities. Specifically: monthly spend by facility, vendor-level breakout, and any mid-year price change events. This strengthens the dispute letter by showing total financial impact over time.',
        fields: {
          traceId: 'TRACE-SYS-001',
          contractId: '#2024-0156',
          glCategory: 'Paper Goods (GL 6240)',
          dateRange: 'March 2025 - March 2026',
          facilityIds: 'f1, f2, f3, f4, f5',
          breakoutNeeded: 'Monthly by facility, vendor-level detail, price change events',
          urgency: 'High — dispute letter pending CFO approval',
        },
      },
      {
        from: 'monthly-close',
        to: 'procurement-agent',
        type: 'WORKING',
        t: '08:15:01',
        body: 'Pulling GL 6240 data now. February close is 91% complete so Feb actuals are finalized. March data is preliminary (open period). Extracting from Workday GL subledger. Estimate 3-5 minutes for full 12-month cross-facility pull with vendor-level detail.',
        fields: {
          dataSource: 'Workday GL Subledger',
          februaryStatus: 'Closed (finalized)',
          marchStatus: 'Open (preliminary)',
          estimatedCompletion: '3-5 minutes',
          glAccount: '6240 - Paper & Disposable Goods',
        },
      },
    ],
  },

  // ─── TH-1045: Credentialing FYIs Scheduling about expiring RN license ─
  // Fast coordination — license alert triggers immediate schedule adjustment
  {
    thread: 'TH-1045',
    status: 'resolved',
    duration: '18s',
    escalated: false,
    topic: 'RN license expiration alert and schedule coverage — Jennifer Nguyen',
    participants: ['hr-compliance', 'scheduling-agent'],
    messages: [
      {
        from: 'hr-compliance',
        to: 'scheduling-agent',
        type: 'FYI',
        t: '04:12:07',
        body: 'Jennifer Nguyen (RN, Pacific Gardens) license expires in 14 days (April 3, 2026). Renewal application confirmed filed with CT Board — processing time is typically 7-10 business days. Low risk of gap but flagging for contingency planning. She has 8 shifts scheduled April 1-7.',
        fields: {
          staffId: 'EMP-4421',
          staffName: 'Jennifer Nguyen, RN',
          licenseNumber: 'RN-2021-78234',
          expirationDate: '2026-04-03',
          renewalStatus: 'Filed — pending board processing',
          expectedProcessingDays: '7-10 business days',
          scheduledShifts: 8,
          schedulePeriod: 'April 1-7, 2026',
          facilityId: 'f3',
          riskLevel: 'LOW',
        },
      },
      {
        from: 'scheduling-agent',
        to: 'hr-compliance',
        type: 'ACKNOWLEDGE',
        t: '04:12:25',
        body: 'Acknowledged. Contingency plan flagged for Jennifer Nguyen shifts April 1-7. Two backup RNs identified: Maria Santos (available 4 shifts) and Robert Kim (available 4 shifts). If renewal is not confirmed by March 31, will activate backup coverage. No schedule changes needed yet.',
        fields: {
          contingencyStatus: 'Prepared',
          backupStaff: 'Maria Santos (4 shifts), Robert Kim (4 shifts)',
          activationTrigger: 'Renewal not confirmed by March 31',
          coverageCost: '$0 (internal staff, regular hours)',
          nextCheckDate: '2026-03-31',
        },
      },
    ],
  },

  // ─── TH-1046: Revenue Optimization proposes PDPM reclassification ─────
  // Revenue optimization identifies missed revenue, monthly close validates impact
  {
    thread: 'TH-1046',
    status: 'resolved',
    duration: '2m 8s',
    escalated: false,
    topic: 'PDPM reclassification opportunity — 8 residents potentially underclassified',
    participants: ['revenue-optimization', 'monthly-close'],
    messages: [
      {
        from: 'revenue-optimization',
        to: 'monthly-close',
        type: 'PROPOSAL',
        t: '09:30:15',
        body: 'Weekly PDPM review identified 8 residents across 3 facilities with clinical indicators supporting higher PDPM classifications. Five in the nursing component (ES2 to ES3), two in PT component, one in NTA. Combined revenue impact is $3,600/month ($43,200 annualized). MDS agent has confirmed clinical documentation supports reclassification. Proposing immediate MDS correction submissions.',
        fields: {
          residentsAffected: 8,
          facilitiesAffected: 'f1, f3, f4',
          nursingReclassifications: 5,
          ptReclassifications: 2,
          ntaReclassifications: 1,
          monthlyRevenueImpact: '$3,600',
          annualizedImpact: '$43,200',
          clinicalDocStatus: 'Validated by MDS agent',
          mdsCorrectionsReady: true,
        },
      },
      {
        from: 'monthly-close',
        to: 'revenue-optimization',
        type: 'RESPONSE',
        t: '09:31:42',
        body: 'Acknowledged revenue impact. For rev-rec purposes: reclassifications submitted in March will generate retroactive adjustments back to the effective date of the clinical change. February close is finalized so no restatement needed. March revenue accruals will be adjusted to reflect the higher PDPM rates. Confirm the effective dates so I can book the revenue adjustment correctly in the March close.',
        fields: {
          revRecTreatment: 'Retroactive adjustment from clinical change effective date',
          februaryImpact: 'None (closed period)',
          marchAccrualAdjustment: 'Required — will book $3,600 incremental',
          informationNeeded: 'Effective dates per resident for retroactive calculation',
          closeDeadline: 'March 17, 2026',
        },
      },
      {
        from: 'revenue-optimization',
        to: 'monthly-close',
        type: 'ACKNOWLEDGE',
        t: '09:32:23',
        body: 'Effective dates sent to your queue. Five nursing reclassifications effective March 1 (documentation already in PCC). Two PT reclassifications effective March 8 (post-evaluation sessions). One NTA effective March 3 (medication change date). Total retroactive adjustment: $1,890 for March 1-15 period. MDS corrections being submitted to payers now.',
        fields: {
          nursingES3EffectiveDate: 'March 1 (5 residents)',
          ptEffectiveDate: 'March 8 (2 residents)',
          ntaEffectiveDate: 'March 3 (1 resident)',
          retroactiveAdjustment: '$1,890',
          retroactivePeriod: 'March 1-15',
          mdsSubmissionStatus: 'In progress — payer acknowledgment expected within 48 hours',
        },
      },
    ],
  },

  // ─── TH-1047: AP Processing flags duplicate vendor invoice ────────────
  // Quick fraud/error detection — AP catches duplicate, supply chain confirms
  {
    thread: 'TH-1047',
    status: 'resolved',
    duration: '31s',
    escalated: false,
    topic: 'Duplicate invoice detection — McKesson medical supplies',
    participants: ['ap-processing', 'supply-chain'],
    messages: [
      {
        from: 'ap-processing',
        to: 'supply-chain',
        type: 'PROPOSAL',
        t: '08:22:41',
        body: 'Flagged potential duplicate invoice from McKesson Medical. Invoice INV-MK-2026-8834 ($4,218.50) matches INV-MK-2026-8790 ($4,218.50) submitted 8 days ago — same amount, same GL code, similar line items. The 8790 invoice was already paid on March 10. Need supply chain to verify whether this is a legitimate second delivery or a duplicate billing error before I release payment.',
        fields: {
          suspectInvoice: 'INV-MK-2026-8834',
          matchedInvoice: 'INV-MK-2026-8790',
          amount: '$4,218.50',
          vendor: 'McKesson Medical',
          glCode: '6110 - Medical Supplies',
          matchedPaymentDate: 'March 10, 2026',
          matchConfidence: '94%',
          matchCriteria: 'Amount, GL code, vendor, line item similarity',
          facilityId: 'f3',
        },
      },
      {
        from: 'supply-chain',
        to: 'ap-processing',
        type: 'RESPONSE',
        t: '08:23:02',
        body: 'Confirmed duplicate. Only one PO matches this order — PO-2026-1847, received March 7 at Pacific Gardens. Receiving log shows single delivery (GRN-2026-3891). McKesson submitted the same invoice twice under different invoice numbers. Recommend rejecting INV-MK-2026-8834 and notifying McKesson vendor relations.',
        fields: {
          purchaseOrder: 'PO-2026-1847',
          receivingNote: 'GRN-2026-3891',
          deliveryDate: 'March 7, 2026',
          deliveryCount: 1,
          verdict: 'DUPLICATE — reject',
          vendorContactAction: 'Notify McKesson AR department of duplicate submission',
          amountSaved: '$4,218.50',
        },
      },
      {
        from: 'ap-processing',
        to: 'supply-chain',
        type: 'ACKNOWLEDGE',
        t: '08:23:12',
        body: 'Invoice INV-MK-2026-8834 rejected and flagged in vendor ledger. Duplicate notification sent to McKesson via EDI. Adding McKesson to enhanced duplicate monitoring for 90 days per policy. This is their second duplicate in 6 months.',
        fields: {
          invoiceStatus: 'Rejected',
          vendorNotification: 'Sent via EDI',
          enhancedMonitoring: '90 days',
          priorDuplicates: 1,
          duplicateHistory: 'INV-MK-2025-6412 (October 2025, $2,890)',
          totalDuplicatesPrevented: '$7,108.50 (lifetime)',
        },
      },
    ],
  },
];
