import { Gavel, DollarSign, Clock, Users, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { litigation, litigationSummary } from '../../data/legal/litigation';
import { PageHeader } from '../../components/Widgets';
import { AgentSummaryBar } from '../../components/AgentComponents';
import { StatGrid, DataTable } from '../../components/DataComponents';
import { DecisionQueue } from '../../components/DecisionComponents';

export default function LitigationTracker() {
  const activeCases = litigation.filter(l => l.status === 'active');
  const settledCases = litigation.filter(l => l.status === 'settled');
  const upcomingDeadlineCases = activeCases.filter(l => l.nextDeadline && l.nextDeadline <= '2026-04-30');
  const attorneys = [...new Set(litigation.map(l => l.attorney.split(' (')[0]))];
  const avgCaseAgeDays = Math.round(activeCases.reduce((sum, l) => {
    const filed = new Date(l.filedDate);
    const now = new Date('2026-03-15');
    return sum + (now - filed) / (1000 * 60 * 60 * 24);
  }, 0) / (activeCases.length || 1));

  const stats = [
    { label: 'Open Cases', value: litigationSummary.activeCases, icon: Gavel, color: 'red', change: '1 settled this quarter', changeType: 'positive' },
    { label: 'Total Reserves', value: `$${(litigationSummary.totalReserves / 1000).toFixed(0)}K`, icon: DollarSign, color: 'amber', change: 'Facility f4 highest exposure' },
    { label: 'Settlements YTD', value: `$28K`, icon: CheckCircle2, color: 'emerald', change: `${settledCases.length} case${settledCases.length !== 1 ? 's' : ''} settled` },
    { label: 'Avg Case Age', value: `${avgCaseAgeDays}d`, icon: Clock, color: 'blue' },
    { label: 'Upcoming Deadlines', value: upcomingDeadlineCases.length, icon: AlertTriangle, color: 'red', change: 'Next 45 days', changeType: 'negative' },
    { label: 'Attorneys', value: attorneys.length, icon: Users, color: 'purple' },
  ];

  const decisions = upcomingDeadlineCases.map((l) => ({
    id: l.id,
    title: `${l.caseNumber} — ${l.plaintiff}`,
    description: `${l.description} Deadline: ${l.nextDeadline}. Reserve: $${(l.reserve / 1000).toFixed(0)}K. Attorney: ${l.attorney}.`,
    facility: l.facilityId,
    priority: l.reserve >= 250000 ? 'critical' : l.reserve >= 100000 ? 'high' : 'medium',
    agent: 'contract-agent',
    confidence: 0.90,
    recommendation: l.caseType === 'regulatory'
      ? 'Prepare IDR documentation and submit before deadline'
      : `Review case status with ${l.attorney.split(' (')[0]} and confirm strategy before deadline`,
    impact: `$${(l.reserve / 1000).toFixed(0)}K reserve at risk`,
    governanceLevel: l.reserve >= 250000 ? 4 : 3,
  }));

  const handleDecision = () => {};

  const statusColors = {
    active: 'bg-red-50 text-red-700',
    settled: 'bg-green-50 text-green-700',
    dismissed: 'bg-gray-100 text-gray-500',
  };

  const caseTypeColors = {
    negligence: 'bg-red-50 text-red-700',
    'wrongful-death': 'bg-red-100 text-red-800',
    employment: 'bg-amber-50 text-amber-700',
    regulatory: 'bg-purple-50 text-purple-700',
    'slip-fall': 'bg-blue-50 text-blue-700',
  };

  const columns = [
    { key: 'caseNumber', label: 'Case #', render: (v) => <span className="font-mono text-xs font-medium text-gray-900">{v}</span> },
    { key: 'plaintiff', label: 'Plaintiff', render: (v) => <span className="text-xs font-medium text-gray-700">{v}</span> },
    { key: 'caseType', label: 'Type', render: (v) => <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${caseTypeColors[v] || 'bg-gray-100 text-gray-500'}`}>{v.replace(/-/g, ' ')}</span> },
    { key: 'status', label: 'Status', render: (v) => <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${statusColors[v] || 'bg-gray-100 text-gray-500'}`}>{v}</span> },
    { key: 'reserve', label: 'Reserve', render: (v) => <span className="text-xs font-mono font-semibold text-gray-900">{v > 0 ? `$${(v / 1000).toFixed(0)}K` : '—'}</span> },
    { key: 'nextDeadline', label: 'Next Deadline', render: (v) => <span className={`text-xs font-mono ${v ? 'text-gray-700' : 'text-gray-300'}`}>{v || 'None'}</span> },
    { key: 'facilityId', label: 'Facility', render: (v) => <span className="text-xs text-gray-500">{v}</span> },
  ];

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      <PageHeader
        title="Litigation Tracker"
        subtitle="Active cases and legal proceedings"
        aiSummary={`${litigationSummary.activeCases} active cases with $${(litigationSummary.totalReserves / 1000).toFixed(0)}K in total reserves. Facility f4 has highest exposure at $${(litigationSummary.highestExposureFacility.totalReserves / 1000).toFixed(0)}K across ${activeCases.filter(l => l.facilityId === 'f4').length} cases. ${upcomingDeadlineCases.length} deadlines approaching in the next 45 days. One case settled this quarter for $28K (under $35K reserve).`}
        riskLevel="high"
      />

      <AgentSummaryBar
        agentName="Contract Agent"
        summary={`Tracking ${litigation.length} cases. ${upcomingDeadlineCases.length} deadlines approaching. Reserve adequacy reviewed for all active matters.`}
        itemsProcessed={litigation.length}
        exceptionsFound={upcomingDeadlineCases.length}
        timeSaved="6.0 hrs"
        lastRunTime="7:30 AM"
      />

      <div className="mb-6"><StatGrid stats={stats} columns={6} /></div>

      {decisions.length > 0 && (
        <div className="mb-6">
          <DecisionQueue
            decisions={decisions}
            onApprove={handleDecision}
            onEscalate={handleDecision}
            title="Cases Requiring Attention"
            badge={decisions.length}
          />
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-900">All Cases</h3>
        </div>
        <div className="p-6">
          <DataTable columns={columns} data={litigation} searchable pageSize={10} />
        </div>
      </div>
    </div>
  );
}
