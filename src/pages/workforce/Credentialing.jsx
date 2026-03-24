import { Shield, AlertTriangle, Clock, CheckCircle2, FileWarning, RefreshCw } from 'lucide-react';
import { PageHeader, Card, StatusBadge } from '../../components/Widgets';
import { AgentSummaryBar } from '../../components/AgentComponents';
import { StatGrid, DataTable } from '../../components/DataComponents';
import { DecisionQueue } from '../../components/DecisionComponents';
import { useDecisionQueue } from '../../hooks/useDecisionQueue';
import { credentials, credentialingSummary } from '../../data/workforce/credentialing';

const facilityNames = { f1: 'Sunrise Senior Living', f2: 'Meadowbrook Care', f3: 'Pacific Gardens SNF', f4: 'Heritage Oaks SNF', f5: 'Bayview Rehabilitation', f6: 'Cedar Ridge SNF', f7: 'Mountain View Care', f8: 'Desert Springs SNF' };

export default function Credentialing() {
  const stats = [
    { label: 'Active Credentials', value: credentialingSummary.active, icon: Shield, color: 'emerald' },
    { label: 'Expiring 30 Days', value: credentialingSummary.expiring30, icon: AlertTriangle, color: 'red', change: 'Immediate action', changeType: 'negative' },
    { label: 'Expiring 60 Days', value: credentialingSummary.expiring60, icon: Clock, color: 'amber' },
    { label: 'Expired', value: credentialingSummary.expired, icon: FileWarning, color: 'red' },
    { label: 'Pending Renewal', value: credentialingSummary.pendingRenewal, icon: RefreshCw, color: 'purple' },
    { label: 'Verification Rate', value: '100%', icon: CheckCircle2, color: 'emerald', change: 'All verified', changeType: 'positive' },
  ];

  const decisionData = [
    {
      id: 'cred-1', title: 'CRITICAL: Sarah Mitchell RN license expires TODAY — remove from schedule immediately',
      facility: facilityNames.f1,
      priority: 'critical', agent: 'HR Compliance Agent', confidence: 0.99, governanceLevel: 4,
      description: 'RN Sarah Mitchell\'s Arizona nursing license (RN-2019-45678) expires today, March 15, 2026. The HR Compliance Agent verified against the Arizona State Board of Nursing portal at 12:01 AM — status shows "Active, Expiring 03/15/2026." Sarah has 12 RN shifts scheduled over the next 2 weeks at Sunrise Senior Living (4 day shifts, 4 evening shifts, 4 weekend shifts). She is the primary RN on Unit 2 (36 residents) and handles all IV medication administration for that unit. Workday shows no renewal application submitted and no PTO requested for a Board of Nursing appointment. HR Director Sarah Williams sent a 60-day reminder on January 15 and a 30-day reminder on February 15 — neither was acknowledged in Workday.',
      recommendation: 'Immediate three-step action: (1) Remove Sarah Mitchell from today\'s schedule and all future shifts until license is renewed — she cannot legally perform any RN duties after midnight tonight. (2) Contact Sarah by phone now to determine renewal status — if she has submitted a renewal application, Arizona allows a 60-day grace period with proof of submission. (3) Activate agency RN backfill for her 12 shifts via CarePlus Staffing ($55/hr, estimated $5,280 total agency cost for 12 shifts). Charge nurse Patricia Alvarez at Sunrise can absorb today\'s shift as overtime if agency cannot fill by 3:00 PM.',
      impact: 'If Sarah works a single shift after license expiration: federal crime (practicing nursing without a license), $10,000 fine per incident per AZ Rev Stat 32-1663, facility could lose CMS certification. 12 unfilled shifts = $5,280 in agency costs. If renewal is in process with Board: 60-day grace period applies, she can return to schedule with proof of application receipt.',
      evidence: [
        { label: 'AZ Board of Nursing portal', detail: 'License RN-2019-45678, status: Active expiring 03/15/2026, no renewal application on file' },
        { label: 'Workday schedule', detail: '12 shifts Mar 15-28: 3/15 day, 3/16 evening, 3/17 day, 3/19 evening, 3/21 weekend...' },
        { label: 'HR reminder log', detail: '60-day reminder sent 1/15, 30-day sent 2/15 — zero acknowledgment in Workday' },
        { label: 'Agency availability', detail: 'CarePlus: 2 RNs available for AZ facilities, $55/hr, 4-hour notice required' },
      ],
    },
    {
      id: 'cred-2', title: 'Rashid Ahmed LPN license expires March 28 — no renewal application filed',
      facility: facilityNames.f2,
      priority: 'high', agent: 'HR Compliance Agent', confidence: 0.94, governanceLevel: 2,
      description: 'LPN Rashid Ahmed\'s Colorado license (LPN-CO-2022-3456) expires March 28 — 13 days away. The HR Compliance Agent checked the Colorado DORA portal this morning: no renewal application has been submitted. Rashid handles the evening med pass for Meadowbrook\'s west hallway (28 residents, 112 medications nightly). He has been with Ensign for 4 years with an excellent performance record (4.2/5.0 last review). Colorado LPN renewal requires 10 hours of continuing education — Workday LMS shows Rashid has completed 6 of 10 required CE hours. The remaining 4 hours can be completed online through Ensign\'s approved CE provider (NetCE) in one sitting.',
      recommendation: 'Approve two parallel actions: (1) HR Coordinator Diana Reeves to call Rashid today — not email (his email open rate on HR communications is 22%). Confirm he understands the March 28 deadline and the 4 remaining CE hours. (2) Pre-schedule a 4-hour block on Rashid\'s next day off (March 20) for CE completion in the Meadowbrook training room. NetCE modules are self-paced and can be completed in 3-4 hours. Once CE is complete, he can submit the DORA renewal online (approval typically within 48 hours).',
      impact: 'If Rashid\'s license lapses: Meadowbrook loses its only evening LPN for the west hallway. Agency LPN fill for evening med pass: $42/hr ($336/shift, $2,352/week). Rashid has 8 shifts scheduled March 28 through April 10. Total agency exposure if not renewed: $4,704.',
      evidence: [
        { label: 'Colorado DORA portal', detail: 'LPN-CO-2022-3456, expires 3/28/2026, no renewal application submitted' },
        { label: 'Workday LMS', detail: 'Ahmed, Rashid: 6 of 10 CE hours completed. Remaining: 2 modules (Pharmacology Update, Pain Management)' },
        { label: 'Schedule impact', detail: '8 evening shifts Mar 28-Apr 10, west hallway med pass (28 residents, 112 meds/night)' },
      ],
    },
    {
      id: 'cred-3', title: 'George Bailey CNA certification expires April 5 — CE hours status unclear',
      facility: facilityNames.f5,
      priority: 'medium', agent: 'HR Compliance Agent', confidence: 0.90, governanceLevel: 2,
      description: 'CNA George Bailey\'s California certification (CNA-CA-2024-7890) expires April 5 — 21 days away. California requires 48 hours of continuing education for CNA renewal, including 24 hours of in-service training logged by the employer. Workday LMS shows George has 36 of 48 CE hours documented. However, Bayview\'s Staff Development Coordinator noted that George attended 3 additional in-service sessions in February (Fall Prevention, Dementia Care, and Infection Control) totaling 9 hours that were not yet entered into Workday. If those sessions are verified and logged, George would have 45 of 48 hours — needing only 3 more. George works night shift at Bayview (11P-7A) and has been difficult to reach for daytime training sessions.',
      recommendation: 'Three-step resolution: (1) Staff Development Coordinator to verify February in-service attendance records and enter the 9 hours into Workday by end of week. (2) Schedule George for one 3-hour in-service during his next shift overlap (March 22, 10:00 PM — before his 11P shift starts). Topics available: Resident Rights (2hr) + Body Mechanics (1hr). (3) Once 48 hours confirmed, submit renewal to California DPH — processing takes 5-7 business days, well within the April 5 deadline if submitted by March 25.',
      impact: 'George is one of 3 night shift CNAs at Bayview — losing him to a certification lapse would leave the unit at minimum staffing (2 CNAs for 107 residents across 3 floors). Agency night CNA fill: $35/hr ($280/shift). George has 14 shifts scheduled April 5-30. Maximum exposure if certification lapses: $3,920 in agency costs plus loss of an experienced night shift CNA who knows the residents.',
      evidence: [
        { label: 'CA DPH certification', detail: 'CNA-CA-2024-7890, expires 4/5/2026, 48 CE hours required for renewal' },
        { label: 'Workday LMS', detail: '36 of 48 CE hours logged. 9 additional hours pending entry from Feb in-services' },
        { label: 'Bayview staffing', detail: 'Night shift: 3 CNAs for 107 residents. Bailey is senior CNA (2 years), knows all residents' },
        { label: 'Renewal timeline', detail: 'CA DPH processing: 5-7 business days. Must submit by 3/25 for 4/5 deadline' },
      ],
    },
  ];

  const { decisions, approve, escalate } = useDecisionQueue(decisionData);

  const credStatusMap = {
    active: 'approved',
    'expiring-30': 'exception',
    'expiring-60': 'pending',
    expired: 'rejected',
    'pending-renewal': 'pending-approval',
  };

  const columns = [
    { key: 'staffName', label: 'Staff Member', render: (v, row) => (
      <div>
        <p className="text-sm font-medium text-gray-900">{v}</p>
        <p className="text-[10px] text-gray-400">{row.licenseNumber}</p>
      </div>
    )},
    { key: 'type', label: 'Type', render: (v) => <span className="font-semibold text-xs">{v}</span> },
    { key: 'state', label: 'State', render: (v) => <span className="text-xs">{v || 'National'}</span> },
    { key: 'facilityId', label: 'Facility', render: (v) => <span className="text-xs">{facilityNames[v] || v}</span> },
    { key: 'expiryDate', label: 'Expiry', render: (v) => <span className="font-mono text-xs">{v}</span> },
    { key: 'status', label: 'Status', render: (v) => <StatusBadge status={credStatusMap[v] || v} /> },
  ];

  return (
    <div className="p-6">
      <PageHeader
        title="Credentialing"
        subtitle="Ensign Agentic Framework — License & Certification Management"
        aiSummary={`${credentialingSummary.totalCredentials} credentials tracked. ${credentialingSummary.expiring30} expiring within 30 days — CRITICAL: Sarah Mitchell's RN license expires TODAY (March 15). ${credentialingSummary.expiring60} expiring within 60 days. ${credentialingSummary.pendingRenewal} pending renewal. All credentials verified against state boards.`}
        riskLevel="critical"
      />

      <AgentSummaryBar
        agentName="HR Compliance Agent"
        summary={`verified ${credentialingSummary.totalCredentials} credentials. ${credentialingSummary.expiring30 + credentialingSummary.expiring60} approaching expiration.`}
        itemsProcessed={credentialingSummary.totalCredentials}
        exceptionsFound={credentialingSummary.expiring30}
        timeSaved="5.2 hrs"
        lastRunTime="12:00 AM"
      />

      <div className="mb-6"><StatGrid stats={stats} columns={6} /></div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <DecisionQueue decisions={decisions} onApprove={approve} onEscalate={escalate} title="Credential Alerts" badge={decisions.length} />
        <Card title="Credentials by Type">
          <div className="space-y-3">
            {['RN', 'LPN', 'CNA', 'BLS', 'ACLS', 'PT', 'OT', 'ST'].map((type) => {
              const count = credentials.filter(c => c.type === type).length;
              const expiring = credentials.filter(c => c.type === type && (c.status === 'expiring-30' || c.status === 'expiring-60')).length;
              if (count === 0) return null;
              return (
                <div key={type} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <span className="text-sm font-medium text-gray-900">{type}</span>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="text-gray-500">{count} total</span>
                    {expiring > 0 && <span className="text-red-600 font-semibold">{expiring} expiring</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      <Card title="All Credentials" badge={`${credentials.length}`}>
        <DataTable columns={columns} data={credentials} searchable pageSize={10} />
      </Card>
    </div>
  );
}
