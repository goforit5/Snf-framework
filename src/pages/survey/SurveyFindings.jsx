import { ClipboardCheck, AlertTriangle, Shield, MessageSquare, MapPin, Gauge, Eye, Clock, CheckCircle2 } from 'lucide-react';
import { PageHeader, Card } from '../../components/Widgets';
import { useModal } from '../../components/WidgetUtils';
import { AgentSummaryBar } from '../../components/AgentComponents';
import { StatGrid, DataTable } from '../../components/DataComponents';
import { DecisionQueue } from '../../components/DecisionComponents';
import { useDecisionQueue } from '../../hooks/useDecisionQueue';
import { surveyObservations, surveyDeficiencyFindings, surveyFindingsDecisions } from '../../data/survey/activeSurveyData';

const typeBadge = { tour: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300', interview: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300', 'med-pass': 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300', 'meal-observation': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300', 'record-review': 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300', environmental: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' };
const sevColor = (s) => s >= 4 ? 'bg-red-900 text-white' : s === 3 ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' : s === 2 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300';
const scopeColor = (s) => s === 'Widespread' ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' : s === 'Pattern' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300';
const fmtTime = (ts) => new Date(ts).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });

const ijRiskCount = surveyDeficiencyFindings.filter(f => f.severity >= 3).length;
const interviewCount = surveyObservations.filter(o => o.type === 'interview').length;
const uniqueLocations = new Set(surveyObservations.map(o => o.location)).size;
const maxSeverity = Math.max(...surveyObservations.map(o => o.severity));

/* Scope & Severity matrix grades */
const gradeMatrix = [
  ['A', 'B', 'C'],
  ['D', 'E', 'F'],
  ['G', 'H', 'I'],
  ['J', 'K', 'L'],
];
const activeGrades = new Set(surveyDeficiencyFindings.map(f => f.grade));

export default function SurveyFindings() {
  const { open } = useModal();
  const { decisions, approve, escalate, override } = useDecisionQueue(surveyFindingsDecisions);

  const stats = [
    { label: 'Observations Logged', value: surveyObservations.length, icon: Eye, color: 'blue' },
    { label: 'Potential Deficiencies', value: surveyDeficiencyFindings.length, icon: AlertTriangle, color: 'red' },
    { label: 'IJ Risk Areas', value: ijRiskCount, icon: Shield, color: 'red', change: 'Severity 3+', changeType: 'negative' },
    { label: 'Interviews Conducted', value: interviewCount, icon: MessageSquare, color: 'purple' },
    { label: 'Areas Toured', value: uniqueLocations, icon: MapPin, color: 'emerald' },
    { label: 'Highest Severity', value: maxSeverity, icon: Gauge, color: 'amber', change: maxSeverity >= 3 ? 'Actual harm risk' : 'No harm', changeType: maxSeverity >= 3 ? 'negative' : 'positive' },
  ];

  const openObservation = (row) => {
    open({
      title: `${row.fTag} — ${row.location}`,
      content: (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${typeBadge[row.type] || typeBadge.environmental}`}>{row.type}</span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${sevColor(row.severity)}`}>Severity {row.severity}</span>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">Time</p>
            <p className="text-sm text-gray-700 dark:text-gray-300">{fmtTime(row.timestamp)}</p>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">Surveyor</p>
            <p className="text-sm text-gray-700 dark:text-gray-300">{row.surveyor}</p>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">Full Description</p>
            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{row.description}</p>
          </div>
        </div>
      ),
      maxWidth: 'max-w-lg',
    });
  };

  const columns = [
    { key: 'timestamp', label: 'Time', sortable: true, render: (v) => <span className="text-xs whitespace-nowrap">{fmtTime(v)}</span> },
    { key: 'surveyor', label: 'Surveyor', sortable: true, render: (v) => <span className="text-sm">{v.split(',')[0]}</span> },
    { key: 'location', label: 'Location', sortable: true, render: (v) => <span className="text-sm">{v}</span> },
    { key: 'type', label: 'Type', sortable: true, render: (v) => <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${typeBadge[v] || typeBadge.environmental}`}>{v}</span> },
    { key: 'description', label: 'Description', sortable: false, render: (v) => <span className="text-sm">{v.length > 70 ? v.slice(0, 70) + '...' : v}</span> },
    { key: 'fTag', label: 'F-Tag', sortable: true, render: (v) => <span className="px-2 py-0.5 rounded bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs font-bold">{v}</span> },
    { key: 'severity', label: 'Severity', sortable: true, render: (v) => <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${sevColor(v)}`}>{v}</span> },
  ];

  const scopeLabels = ['Isolated', 'Pattern', 'Widespread'];
  const sevLabels = [1, 2, 3, 4];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Findings & Risk Assessment"
        subtitle="Real-Time Deficiency Pattern Detection"
        aiSummary={`${surveyObservations.length} observations logged across ${uniqueLocations} locations. ${surveyDeficiencyFindings.length} potential deficiencies identified with top risk being F-689 (Free from Accident Hazards) at Pattern/Severity 3 — one step below Immediate Jeopardy.`}
        riskLevel="high"
      />

      <AgentSummaryBar
        agentName="Survey Defense Agent"
        summary="Analyzing observation patterns, cross-referencing F-tag regulations, and mapping deficiency scope and severity in real time."
        itemsProcessed={15}
        exceptionsFound={5}
        timeSaved="4.2 hrs"
        lastRunTime="2 min ago"
      />

      <StatGrid stats={stats} columns={6} />

      <DecisionQueue decisions={decisions} onApprove={approve} onEscalate={escalate} onOverride={override} title="Deficiency Risk Decisions" badge={decisions.length} />

      {/* Deficiency Risk Board */}
      <Card title="Deficiency Risk Board" badge={`${surveyDeficiencyFindings.length} findings`}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {surveyDeficiencyFindings.map(f => (
            <div key={f.id} className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="px-2 py-0.5 rounded bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs font-bold mr-2">{f.fTag}</span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{f.description}</span>
                </div>
                <span className="px-2 py-1 rounded-lg bg-gray-100 dark:bg-gray-800 text-sm font-bold text-gray-900 dark:text-gray-100 shrink-0">Grade {f.grade}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${scopeColor(f.scope)}`}>{f.scope}</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${sevColor(f.severity)}`}>Severity {f.severity}</span>
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">{f.evidenceCount} evidence items</span>
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-violet-50 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300">{Math.round(f.confidence * 100)}% confidence</span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{f.analysis}</p>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">Mitigation Steps</p>
                <ul className="space-y-1">
                  {f.mitigation.map((m, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-gray-600 dark:text-gray-400">
                      <CheckCircle2 size={12} className="text-emerald-500 mt-0.5 shrink-0" />
                      <span>{m}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Observation Log */}
      <Card title="Observation Log" badge={`${surveyObservations.length} entries`}>
        <DataTable columns={columns} data={surveyObservations} onRowClick={openObservation} searchable pageSize={8} />
      </Card>

      {/* Scope & Severity Matrix */}
      <Card title="Scope & Severity Matrix" badge="CMS Grading">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-center text-sm">
            <thead>
              <tr>
                <th className="p-2 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400" />
                {scopeLabels.map(s => (
                  <th key={s} className="p-2 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">{s}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sevLabels.map((sev, si) => (
                <tr key={sev}>
                  <td className="p-2 text-xs font-bold text-gray-500 dark:text-gray-400 whitespace-nowrap">Severity {sev}</td>
                  {scopeLabels.map((_, sci) => {
                    const grade = gradeMatrix[si][sci];
                    const isActive = activeGrades.has(grade);
                    return (
                      <td key={grade} className="p-1">
                        <div className={`min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg font-bold text-lg transition-colors ${
                          isActive
                            ? sev >= 3 ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 ring-2 ring-red-400'
                              : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 ring-2 ring-amber-400'
                            : 'bg-gray-50 text-gray-300 dark:bg-gray-800/50 dark:text-gray-600'
                        }`}>
                          {grade}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
