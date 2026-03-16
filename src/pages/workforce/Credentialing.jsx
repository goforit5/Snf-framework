import { Shield, AlertTriangle, Clock, CheckCircle2, FileWarning, RefreshCw } from 'lucide-react';
import { PageHeader, Card, StatusBadge } from '../../components/Widgets';
import { AgentSummaryBar } from '../../components/AgentComponents';
import { StatGrid, DataTable } from '../../components/DataComponents';
import { DecisionQueue } from '../../components/DecisionComponents';
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

  const decisions = [
    {
      id: 'cred-1', title: 'CRITICAL: Sarah Mitchell RN license expires TODAY', facility: facilityNames.f1,
      priority: 'critical', agent: 'HR Compliance Agent', confidence: 0.99, governanceLevel: 4,
      description: 'RN license RN-2019-45678 (Arizona) expires March 15, 2026. Sarah has 12 shifts scheduled over the next 2 weeks. She CANNOT work as an RN without an active license.',
      recommendation: 'Step 1: Contact Sarah immediately to verify renewal status. Step 2: If not renewed, remove from schedule effective today. Step 3: Activate agency RN backfill for her shifts. Step 4: File with AZ Board of Nursing for expedited renewal if in process.',
      impact: '12 shifts at risk. Working without license = regulatory violation, potential $10K+ fine per incident.',
      evidence: [
        { label: 'AZ Board of Nursing', detail: 'License RN-2019-45678 — expiry 03/15/2026' },
        { label: 'PCC Schedule', detail: '12 shifts Mar 15-28, all RN-required' },
        { label: 'Last verification', detail: '03/20/2024 — due for re-verification' },
      ],
    },
    {
      id: 'cred-2', title: 'Rashid Ahmed LPN license — expires March 28', facility: facilityNames.f2,
      priority: 'high', agent: 'HR Compliance Agent', confidence: 0.94, governanceLevel: 2,
      description: 'LPN license LPN-CO-2022-3456 expires in 13 days. No renewal application on file.',
      recommendation: 'Send automated renewal reminder. Schedule follow-up call in 5 days if no action taken.',
      impact: 'LPN coverage at Meadowbrook at risk if not renewed',
    },
    {
      id: 'cred-3', title: 'George Bailey CNA certification — expires April 5', facility: facilityNames.f5,
      priority: 'medium', agent: 'HR Compliance Agent', confidence: 0.90, governanceLevel: 2,
      description: 'CNA certification CNA-CA-2024-7890 expires in 21 days. Renewal requires 48 hours of continuing education — status unknown.',
      recommendation: 'Verify CE hours completion. If incomplete, schedule remaining hours immediately.',
    },
  ];

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
        <DecisionQueue decisions={decisions} onApprove={() => {}} onEscalate={() => {}} title="Credential Alerts" badge={decisions.length} />
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
