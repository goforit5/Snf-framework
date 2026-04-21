// Agent Escalations — agent-vs-agent disagreement scenarios requiring human judgment
// When two agents reach opposing conclusions on a decision with significant impact,
// the enterprise-orchestrator routes the dispute to the appropriate human decision-makers
// Each escalation captures both positions with rationale, cost analysis, and policy citations

export const escalations = [
  // ─── ESC-001: OT Staffing vs Differential Pilot ───────────────────────
  // Clinical Monitor wants 3 FTE hires for patient safety
  // Payroll Audit wants a 90-day differential pilot to control costs
  // Triggered by Margaret Chen fall cascade (TRACE-MCF-001)
  {
    id: 'ESC-001',
    decisionId: 'D-4830',
    status: 'pending',
    title: 'Heritage Oaks night shift staffing — immediate hires vs differential pilot',
    description: 'Heritage Oaks has experienced 6 falls in 30 days with 67% concentrated in the East Wing during night shift. The clinical-monitor agent identified a CNA-to-resident ratio of 1:15 (target: 1:12) as the root cause and proposes hiring 3 additional night shift OT aides immediately. The payroll-audit agent counters that the facility is already 8.2% over labor budget and recommends a 90-day weekend differential pilot ($4/hr premium) to attract existing staff before committing to permanent headcount. Both agents have valid positions — this is a patient safety vs budget optimization tradeoff that requires executive judgment.',
    createdAt: '2026-03-15T07:06:45Z',
    duration: '13h 53m',
    agentA: {
      id: 'clinical-monitor',
      name: 'Clinical Monitoring Agent',
      position: 'Hire 3 night shift OT aides immediately',
      rationale: 'Margaret Chen is the third repeat faller this month. CNA-to-resident ratio of 1:15 violates facility target of 1:12. CMS surveyors will not accept a pilot program as a defense for F-689 (Free of Accident Hazards) citations. The litigation cost of a single fall-related lawsuit ($200K-$500K) exceeds the annual cost of 3 FTE hires. Patient safety must take precedence over budget optimization during an active safety crisis.',
      cost: '$189,000/year ($15,750/month)',
      citations: [
        'F-689 — Free of Accident Hazards (42 CFR 483.25(d))',
        'Facility fall risk protocol — 3-fall escalation rule',
        'CMS State Operations Manual, Appendix PP, F-689 guidance',
        'Heritage Oaks F-689 risk score: 88 (HIGH)',
      ],
    },
    agentB: {
      id: 'payroll-audit',
      name: 'Payroll Audit Agent',
      position: 'Implement 90-day weekend differential pilot first',
      rationale: 'Heritage Oaks is already 8.2% over March labor budget due to the CNA overtime spike. Adding 3 FTEs creates a permanent $189K/year cost commitment based on a single month of data. A $4/hr weekend differential pilot costs $28,800 over 90 days and may resolve the coverage gap by redistributing existing staff. If the pilot fails to reduce falls by 40%, escalation to full hiring is the fallback. This is the financially responsible path that still addresses the staffing gap.',
      cost: '$28,800/90 days ($9,600/month)',
      citations: [
        'Heritage Oaks March labor budget variance: -8.2%',
        'Meadowbrook overtime cascade cost: $28,560/30 days',
        'Ensign operational budget policy: >5% variance requires Regional Director approval',
        'Weekend differential benchmark: $3-5/hr industry standard',
      ],
    },
    humans: ['DON', 'CEO'],
    policy: 'P-004',
  },

  // ─── ESC-002: Vendor Contract Auto-Renewal vs Renegotiation ───────────
  // Contract Lifecycle says auto-renewal deadline is approaching — act now or lose leverage
  // Procurement says terminate for cause and switch vendors
  // Triggered by Sysco price dispute (TRACE-SYS-001)
  {
    id: 'ESC-002',
    decisionId: 'D-4831',
    status: 'pending',
    title: 'Sysco paper goods — auto-renewal with renegotiation vs termination and vendor switch',
    description: 'Sysco increased paper goods pricing by 18% across 4 facilities in violation of Contract #2024-0156 clause 4.2 (maximum 5% annual escalation). The contract-agent recommends using the auto-renewal clause as leverage to renegotiate pricing back to compliant levels while maintaining the relationship — the auto-renewal deadline is October 2 and gives Ensign 6 months of negotiating position. The procurement-agent recommends immediate termination for cause (60-day exit under clause 9.1) and switching to US Foods, which is 12% cheaper even at Sysco\'s old pricing. Both approaches have merit — this is a relationship preservation vs cost optimization tradeoff with $34,200/year at stake.',
    createdAt: '2026-03-15T10:30:00Z',
    duration: '10h 30m',
    agentA: {
      id: 'contract-agent',
      name: 'Contract Lifecycle Agent',
      position: 'Leverage auto-renewal deadline to renegotiate with Sysco',
      rationale: 'Sysco is a strategic vendor serving all 5 facilities with established delivery routes, known product quality, and integrated EDI billing. Switching vendors creates transition risk — new vendor onboarding takes 30-60 days and may disrupt supply continuity. The auto-renewal deadline (October 2) gives Ensign 6 months of leverage to negotiate pricing concessions, potentially including retroactive credits for the overcharges. Terminating a multi-facility vendor relationship over a pricing dispute that may be a billing error is premature.',
      cost: '$0 negotiation cost (existing relationship)',
      citations: [
        'Contract #2024-0156, Clause 4.2 — Annual price escalation cap',
        'Contract #2024-0156, Clause 12.1 — Auto-renewal with 90-day notice',
        'Vendor transition risk assessment: 30-60 day onboarding timeline',
        'Sysco relationship tenure: 4 years across 5 facilities',
      ],
    },
    agentB: {
      id: 'procurement-agent',
      name: 'Procurement Agent',
      position: 'Terminate for cause and transition to US Foods',
      rationale: 'Sysco deliberately violated contractual pricing caps by 13 percentage points (18% vs 5% maximum). This is not an error — it affected 24 invoices across 4 facilities over 2 weeks. US Foods is GPO-approved, already qualified as a vendor at 3 facilities, and is 12% cheaper than Sysco\'s pre-increase pricing. The 60-day termination for cause under clause 9.1 protects Ensign from an additional $34,200/year in overpayments. Renegotiation rewards bad vendor behavior and sets a precedent that contract violations have no consequences.',
      cost: '$18,400/year savings vs Sysco old pricing',
      citations: [
        'Contract #2024-0156, Clause 9.1 — Termination for cause (60 days)',
        '24 invoices with unauthorized price increases (March 1-14)',
        'US Foods competitive bid: $0.82/unit avg vs Sysco $1.14/unit',
        'GPO vendor qualification: US Foods approved for paper goods category',
      ],
    },
    humans: ['CFO'],
    policy: 'P-007',
  },

  // ─── ESC-003: Antipsychotic Reduction — Clinical Protocols ────────────
  // Pharmacy agent recommends antipsychotic dose reduction per CMS guidelines
  // Clinical monitor flags patient safety risk based on behavioral history
  // Requires both physician and DON sign-off
  {
    id: 'ESC-003',
    decisionId: 'D-4832',
    status: 'resolved',
    title: 'Antipsychotic dose reduction for Harold Webb — CMS compliance vs behavioral risk',
    description: 'Harold Webb (Room 227A, Meadowbrook) has been on quetiapine 200mg for 9 months without a documented gradual dose reduction (GDR) attempt. The pharmacy-agent identified this as a CMS F-758 (Free from Unnecessary Psychotropic Medications) risk and recommends initiating a GDR per federal guidelines. The clinical-monitor agent flags that Harold has a documented history of aggressive episodes — 3 behavioral incidents in the 2 months prior to quetiapine initiation, including one that required 1:1 observation for 72 hours. A dose reduction without adequate behavioral monitoring could endanger Harold and other residents. Both agents agree a GDR should occur eventually but disagree on timing and safeguards.',
    createdAt: '2026-03-14T14:20:00Z',
    duration: '18h 40m',
    agentA: {
      id: 'pharmacy-agent',
      name: 'Pharmacy Reconciliation Agent',
      position: 'Initiate gradual dose reduction per CMS F-758 guidelines',
      rationale: 'CMS requires documented GDR attempts for all antipsychotic medications unless clinically contraindicated with specific documentation. Harold Webb has been on quetiapine 200mg for 9 months with no GDR attempt — this is a survey citation risk. The recommended protocol is a 25% dose reduction (200mg to 150mg) with 2-week behavioral monitoring. If behavioral symptoms recur, the dose can be restored with clinical justification documented. Delaying the GDR further increases F-758 citation risk, which is a quality measure that affects the facility 5-star rating.',
      cost: '$0 (medication cost actually decreases by ~$45/month)',
      citations: [
        'F-758 — Free from Unnecessary Psychotropic Medications (42 CFR 483.45(e))',
        'CMS GDR requirements: attempt within 6 months of initiation',
        'Meadowbrook F-758 risk score: currently MEDIUM, trending HIGH',
        'Quetiapine 200mg: 9 months without GDR attempt (overdue by 3 months)',
      ],
    },
    agentB: {
      id: 'clinical-monitor',
      name: 'Clinical Monitoring Agent',
      position: 'Delay GDR until enhanced behavioral monitoring plan is in place',
      rationale: 'Harold Webb had 3 documented aggressive episodes in July-August 2025 including one requiring 72-hour 1:1 observation. The quetiapine was initiated specifically to manage these behaviors and has been effective — zero behavioral incidents in 9 months. A premature GDR without adequate monitoring infrastructure risks recurrence of aggressive behavior that could injure Harold or other residents. Recommend delaying GDR by 30 days to implement enhanced behavioral monitoring: increased rounding frequency, behavioral observation log, and a trained 1:1 aide available on standby during the reduction period.',
      cost: '$2,400 (1:1 aide standby for 30 days during monitoring period)',
      citations: [
        'Harold Webb behavioral history: 3 incidents (Jul-Aug 2025)',
        '72-hour 1:1 observation required for incident #3 (Aug 12, 2025)',
        'Zero behavioral incidents since quetiapine initiation (Aug 18, 2025)',
        'Facility safety policy: enhanced monitoring required for GDR in patients with aggression history',
      ],
    },
    humans: ['DON', 'Medical Director'],
    policy: 'P-012',
  },

  // ─── ESC-004: M&A Go/No-Go — Strategic Value vs Survey Risk ───────────
  // M&A Diligence recommends proceeding with conditions based on strategic value
  // Quality Measures flags high clinical risk from recent IJ citation and declining star rating
  {
    id: 'ESC-004',
    decisionId: 'D-4833',
    status: 'pending',
    title: 'Lakeside Care Center acquisition — strategic value vs clinical quality risk',
    description: 'Lakeside Care Center (Nashville, TN, 85 beds) is under LOI with an asking price of $5.8M. The ma-diligence agent completed full analysis and recommends proceeding with conditions, citing strategic market entry into Nashville and $600K valuation adjustment for identified risks. The quality-measures agent opposes, citing a 2024 IJ citation (F-600 abuse allegation), declining 5-star rating (4-star to 3-star), below-state-average fall rate, and 18% RN vacancy rate. The quality-measures agent argues that the clinical risk profile makes this a reputational liability that could damage Ensign\'s brand in a new market. This is a strategic growth vs quality risk tradeoff requiring executive committee judgment.',
    createdAt: '2026-03-14T15:00:00Z',
    duration: '30h',
    agentA: {
      id: 'ma-diligence',
      name: 'M&A Due Diligence Agent',
      position: 'Proceed with acquisition at adjusted valuation ($5.2M)',
      rationale: 'Lakeside represents Ensign\'s entry into the Nashville market, which has favorable demographics (growing 65+ population, limited SNF competition). The identified risks are real but manageable with Ensign\'s operational playbook. The recommended $600K valuation adjustment covers: $180K for wage normalization, $200K for clinical remediation, $220K for AR collection risk. The IJ citation was resolved with no ongoing obligations. Ensign has successfully turned around 12 facilities with similar or worse profiles in the past 3 years. Passing on Lakeside means losing Nashville market entry for potentially 2-3 years.',
      cost: '$5,200,000 (adjusted from $5.8M asking)',
      citations: [
        'Nashville market analysis: 12% growth in 65+ population (2020-2025)',
        'Ensign turnaround history: 12 successful facility improvements since 2023',
        'Composite risk score: 58/100 (MODERATE)',
        'IJ citation (Oct 2024) resolved — state monitor ended April 2025, no repeat findings',
      ],
    },
    agentB: {
      id: 'quality-measures',
      name: 'Quality Measures Agent',
      position: 'Decline acquisition — clinical risk profile too high for market entry',
      rationale: 'Lakeside\'s clinical profile is deteriorating, not improving. The 5-star rating dropped from 4 to 3 in 12 months. An IJ citation for abuse (F-600) is the most serious citation category — it signals systemic culture problems that take years to fix, not months. The 18% RN vacancy rate means the facility cannot safely staff current census, let alone implement Ensign\'s improvement protocols. Fall rate is 25% above state average. Entering Nashville with a troubled facility risks Ensign\'s reputation in a market where they have no existing brand equity. A cleaner acquisition target in Nashville within 12 months is the lower-risk path.',
      cost: '$0 (decline deal)',
      citations: [
        'CMS 5-star rating decline: 4-star to 3-star (12 months)',
        'IJ citation F-600 (abuse/neglect) — October 2024',
        'RN vacancy rate: 18% (5 of 28 positions)',
        'Fall rate: 12.3 per 1,000 resident days vs state average 9.8',
      ],
    },
    humans: ['CEO', 'CFO', 'COO'],
    policy: 'P-001',
  },
];
