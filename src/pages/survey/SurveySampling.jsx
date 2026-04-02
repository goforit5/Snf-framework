import { Users, FileText, CheckCircle2, AlertTriangle, Tag, ClipboardList } from 'lucide-react';
import { PageHeader, Card } from '../../components/Widgets';
import { useModal } from '../../components/WidgetUtils';
import { AgentSummaryBar } from '../../components/AgentComponents';
import { StatGrid, DataTable } from '../../components/DataComponents';
import { DecisionQueue } from '../../components/DecisionComponents';
import { useDecisionQueue } from '../../hooks/useDecisionQueue';
import { sampleResidents, surveySamplingDecisions } from '../../data/survey/activeSurveyData';

const riskColor = (risk) => {
  const colors = { Critical: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', High: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', Medium: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400', Low: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' };
  return colors[risk] || colors.Low;
};

const highestRisk = (flags) => {
  const order = ['Critical', 'High', 'Medium', 'Low'];
  for (const level of order) { if (flags.some(f => f.risk === level)) return level; }
  return 'Low';
};

const recordsProgress = (r) => {
  const provided = r.recordsProvided.length;
  const requested = r.recordsRequested.length;
  const color = provided === requested ? 'text-green-600 dark:text-green-400' : provided === 0 ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400';
  return <span className={`font-semibold ${color}`}>{provided}/{requested}</span>;
};

function ResidentModal({ resident }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
        <div><span className="text-gray-500 dark:text-gray-400">Room</span><p className="font-medium text-gray-900 dark:text-gray-100">{resident.room}</p></div>
        <div><span className="text-gray-500 dark:text-gray-400">Admitted</span><p className="font-medium text-gray-900 dark:text-gray-100">{new Date(resident.admitDate).toLocaleDateString()}</p></div>
        <div><span className="text-gray-500 dark:text-gray-400">MDS Date</span><p className="font-medium text-gray-900 dark:text-gray-100">{new Date(resident.mdsDate).toLocaleDateString()}</p></div>
        <div><span className="text-gray-500 dark:text-gray-400">Care Plan Date</span><p className="font-medium text-gray-900 dark:text-gray-100">{new Date(resident.carePlanDate).toLocaleDateString()}</p></div>
      </div>
      <div className="text-sm"><span className="text-gray-500 dark:text-gray-400">Primary Diagnosis</span><p className="font-medium text-gray-900 dark:text-gray-100">{resident.primaryDx}</p></div>
      <div>
        <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">Records Status</h4>
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="bg-gray-50 dark:bg-gray-800"><th className="px-3 py-2 text-left text-gray-600 dark:text-gray-300">Record Type</th><th className="px-3 py-2 text-center text-gray-600 dark:text-gray-300">Requested</th><th className="px-3 py-2 text-center text-gray-600 dark:text-gray-300">Provided</th><th className="px-3 py-2 text-center text-gray-600 dark:text-gray-300">Status</th></tr></thead>
            <tbody>
              {resident.recordsRequested.map((rec) => {
                const provided = resident.recordsProvided.includes(rec);
                return (
                  <tr key={rec} className="border-t border-gray-100 dark:border-gray-800">
                    <td className="px-3 py-2 text-gray-900 dark:text-gray-100">{rec}</td>
                    <td className="px-3 py-2 text-center"><CheckCircle2 size={16} className="text-blue-500 mx-auto" /></td>
                    <td className="px-3 py-2 text-center">{provided ? <CheckCircle2 size={16} className="text-green-500 mx-auto" /> : <span className="text-gray-300 dark:text-gray-600">--</span>}</td>
                    <td className="px-3 py-2 text-center"><span className={`text-xs font-medium px-2 py-0.5 rounded-full ${provided ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>{provided ? 'Complete' : 'Outstanding'}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      <div>
        <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">Risk Flags</h4>
        <div className="space-y-2">
          {resident.riskFlags.map((flag, i) => (
            <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full whitespace-nowrap ${riskColor(flag.risk)}`}>{flag.risk}</span>
              <div><span className="text-xs font-semibold text-gray-600 dark:text-gray-400">{flag.fTag}</span><p className="text-sm text-gray-900 dark:text-gray-100 mt-0.5">{flag.detail}</p></div>
            </div>
          ))}
        </div>
      </div>
      <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
        <h4 className="text-sm font-semibold text-blue-800 dark:text-blue-300 mb-1">Agent Analysis</h4>
        <p className="text-sm text-blue-700 dark:text-blue-400">{resident.agentAnalysis}</p>
      </div>
    </div>
  );
}

export default function SurveySampling() {
  const { open } = useModal();
  const { decisions, approve, escalate, override } = useDecisionQueue(surveySamplingDecisions);

  const totalRecordsRequested = sampleResidents.reduce((s, r) => s + r.recordsRequested.length, 0);
  const totalRecordsProvided = sampleResidents.reduce((s, r) => s + r.recordsProvided.length, 0);
  const outstanding = totalRecordsRequested - totalRecordsProvided;
  const criticalFlags = sampleResidents.reduce((s, r) => s + r.riskFlags.filter(f => f.risk === 'Critical').length, 0);
  const uniqueFTags = new Set(sampleResidents.flatMap(r => r.riskFlags.map(f => f.fTag))).size;

  const stats = [
    { label: 'Residents Sampled', value: sampleResidents.length, icon: Users, color: 'blue' },
    { label: 'Records Requested', value: totalRecordsRequested, icon: FileText, color: 'purple' },
    { label: 'Records Provided', value: totalRecordsProvided, icon: CheckCircle2, color: 'emerald', change: `${Math.round((totalRecordsProvided / totalRecordsRequested) * 100)}% complete`, changeType: 'positive' },
    { label: 'Outstanding Items', value: outstanding, icon: ClipboardList, color: 'amber', change: 'Needs follow-up', changeType: 'negative' },
    { label: 'Critical Risk Flags', value: criticalFlags, icon: AlertTriangle, color: 'red', change: 'Immediate action', changeType: 'negative' },
    { label: 'Focus Areas (F-Tags)', value: uniqueFTags, icon: Tag, color: 'violet' },
  ];

  const columns = [
    { key: 'name', label: 'Resident', sortable: true },
    { key: 'room', label: 'Room', sortable: true },
    { key: 'primaryDx', label: 'Primary Dx', sortable: true },
    { key: 'records', label: 'Records', render: (_, r) => recordsProgress(r), sortable: false },
    { key: 'risk', label: 'Risk Level', render: (_, r) => { const risk = highestRisk(r.riskFlags); return <span className={`text-xs font-semibold px-2 py-1 rounded-full ${riskColor(risk)}`}>{risk}</span>; }, sortable: true },
    { key: 'whySelected', label: 'Why Selected', sortable: false },
  ];

  const handleRowClick = (resident) => {
    open({ title: `${resident.name} — Room ${resident.room}`, content: <ResidentModal resident={resident} />, maxWidth: 'max-w-4xl' });
  };

  // Aggregate risk flags across all residents
  const fTagMap = {};
  sampleResidents.forEach(r => r.riskFlags.forEach(f => {
    if (!fTagMap[f.fTag]) fTagMap[f.fTag] = { fTag: f.fTag, count: 0, highestRisk: 'Low', details: new Set() };
    fTagMap[f.fTag].count++;
    fTagMap[f.fTag].details.add(f.detail);
    const order = ['Critical', 'High', 'Medium', 'Low'];
    if (order.indexOf(f.risk) < order.indexOf(fTagMap[f.fTag].highestRisk)) fTagMap[f.fTag].highestRisk = f.risk;
  }));
  const aggregatedRisks = Object.values(fTagMap).sort((a, b) => ['Critical', 'High', 'Medium', 'Low'].indexOf(a.highestRisk) - ['Critical', 'High', 'Medium', 'Low'].indexOf(b.highestRisk));

  return (
    <div className="space-y-6">
      <PageHeader title="Resident Sample Tracking" subtitle="Surveyor-Selected Residents & Record Requests" aiSummary={`10 residents sampled by survey team with ${outstanding} records outstanding. ${criticalFlags} critical risk flags identified across ${uniqueFTags} F-tag focus areas. Priority attention needed on falls, psychotropic documentation, and restraint monitoring.`} riskLevel="high" />
      <AgentSummaryBar agentName="Survey Defense Agent" summary="Pre-analyzing all sampled resident records against F-tag requirements. Cross-referencing PCC documentation with surveyor focus areas to identify gaps before interviews." itemsProcessed={10} exceptionsFound={4} timeSaved="6.8 hrs" lastRunTime="4 min ago" />
      <StatGrid stats={stats} columns={6} />
      <DecisionQueue decisions={decisions} onApprove={approve} onEscalate={escalate} onOverride={override} title="Sample Defense Actions" badge={decisions.length} />
      <Card title="Sampled Residents" badge={`${sampleResidents.length} residents`}>
        <DataTable columns={columns} data={sampleResidents} onRowClick={handleRowClick} searchable pageSize={10} />
      </Card>
      <Card title="Agent Risk Analysis" badge={`${aggregatedRisks.length} F-Tags`}>
        <div className="space-y-3">
          {aggregatedRisks.map((item) => (
            <div key={item.fTag} className="flex items-start gap-4 p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50">
              <div className="flex-shrink-0 mt-0.5">
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${riskColor(item.highestRisk)}`}>{item.highestRisk}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-gray-900 dark:text-gray-100">{item.fTag}</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">{item.count} resident{item.count > 1 ? 's' : ''} affected</span>
                </div>
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  {[...item.details].map((d, i) => <li key={i}>{d}</li>)}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
