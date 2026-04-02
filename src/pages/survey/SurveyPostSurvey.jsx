import { Shield, AlertTriangle, Clock, FileText, Calendar, DollarSign, CheckCircle2, XCircle, ClipboardCheck } from 'lucide-react';
import { PageHeader, Card, ActionButton } from '../../components/Widgets';
import { useModal } from '../../components/WidgetUtils';
import { AgentSummaryBar } from '../../components/AgentComponents';
import { StatGrid, DataTable } from '../../components/DataComponents';
import { DecisionQueue } from '../../components/DecisionComponents';
import { useDecisionQueue } from '../../hooks/useDecisionQueue';
import { postSurveyData, surveyFindings, surveyPostSurveyDecisions } from '../../data/survey/activeSurveyData';

const { exitConference, cms2567, financialImpact } = postSurveyData;
const defs = cms2567.deficiencies;
const pocDeadline = new Date(cms2567.pocDeadline);
const daysUntilPoc = Math.ceil((pocDeadline - new Date('2026-04-05T09:00:00')) / 86400000);
const criticalHighCount = defs.filter(d => d.severity === 'Actual Harm').length;

const severityColor = (s) => s === 'Actual Harm' ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300';
const scopeColor = (s) => s === 'Widespread' ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' : s === 'Pattern' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300';
const idrColor = (r) => r === 'Accept' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300';
const deadlineColor = daysUntilPoc < 5 ? 'text-red-600 dark:text-red-400' : daysUntilPoc < 10 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400';

const timeline = [
  { label: 'Survey End', date: 'Apr 3', status: 'complete' },
  { label: 'CMS-2567 Received', date: 'Apr 5', status: 'complete' },
  { label: 'POC Deadline', date: 'Apr 15', status: 'upcoming' },
  { label: 'Expected Revisit', date: '~May 5', status: 'future' },
];

export default function SurveyPostSurvey() {
  const { open } = useModal();
  const { decisions, approve, escalate, override } = useDecisionQueue(surveyPostSurveyDecisions);

  const stats = [
    { label: 'Deficiencies Cited', value: defs.length, icon: AlertTriangle, color: 'red', change: 'CMS-2567 received', changeType: 'negative' },
    { label: 'Actual Harm', value: criticalHighCount, icon: Shield, color: 'red', change: `${defs.length - criticalHighCount} potential harm`, changeType: 'negative' },
    { label: 'POC Deadline', value: 'Apr 15', icon: Clock, color: daysUntilPoc < 10 ? 'amber' : 'blue', change: `${daysUntilPoc} days remaining`, changeType: daysUntilPoc < 10 ? 'negative' : 'neutral' },
    { label: 'IDR Window', value: 'Apr 15', icon: FileText, color: 'amber', change: '2 disputes recommended', changeType: 'neutral' },
    { label: 'Revisit Estimate', value: '~30 days', icon: Calendar, color: 'blue', change: 'Post-POC acceptance', changeType: 'neutral' },
    { label: 'Financial Exposure', value: `$${(financialImpact.totalExposure.low / 1000).toFixed(0)}K-$${(financialImpact.totalExposure.high / 1000).toFixed(0)}K`, icon: DollarSign, color: 'red', change: 'Total CMP range', changeType: 'negative' },
  ];

  const openDeficiencyModal = (def) => {
    open({
      title: `${def.fTag} — Deficiency Detail`,
      maxWidth: 'max-w-3xl',
      content: (
        <div className="space-y-5">
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">{def.description}</p>
            <div className="flex flex-wrap gap-2 mt-2">
              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${scopeColor(def.scope)}`}>{def.scope}</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${severityColor(def.severity)}`}>{def.severity}</span>
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">Grade {def.grade}</span>
            </div>
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Agent-Drafted Plan of Correction</h4>
            <div className="space-y-3">
              {[
                { label: 'Corrective Action', text: def.poc.correctiveAction },
                { label: 'Affected Residents', text: def.poc.affectedResidents },
                { label: 'Systemic Changes', text: def.poc.systemicChanges },
                { label: 'Monitoring Plan', text: def.poc.monitoringPlan },
              ].map(s => (
                <div key={s.label} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-1">{s.label}</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300">{s.text}</p>
                </div>
              ))}
            </div>
          </div>
          {def.idrRecommendation === 'Dispute' && (
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
              <p className="text-xs font-bold text-amber-700 dark:text-amber-300 mb-1">IDR Dispute Recommended — {Math.round(def.successProbability * 100)}% Success Probability</p>
              <p className="text-sm text-gray-700 dark:text-gray-300">Agent recommends filing Informal Dispute Resolution for this deficiency.</p>
            </div>
          )}
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
            <p className="text-xs font-bold text-red-700 dark:text-red-300 mb-1">Financial Exposure</p>
            <p className="text-sm text-gray-700 dark:text-gray-300">${def.financialExposure.low.toLocaleString()} - ${def.financialExposure.high.toLocaleString()} ({def.financialExposure.basis})</p>
          </div>
        </div>
      ),
    });
  };

  const defColumns = [
    { key: 'fTag', label: 'F-Tag', sortable: true, render: (v) => <span className="font-bold text-gray-900 dark:text-white">{v}</span> },
    { key: 'description', label: 'Description', sortable: false, render: (v) => <span className="text-sm">{v.length > 60 ? v.slice(0, 60) + '...' : v}</span> },
    { key: 'scope', label: 'Scope', sortable: true, render: (v) => <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${scopeColor(v)}`}>{v}</span> },
    { key: 'severity', label: 'Severity', sortable: true, render: (v) => <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${severityColor(v)}`}>{v}</span> },
    { key: 'grade', label: 'Grade', sortable: true, render: (v) => <span className="font-semibold">{v}</span> },
    { key: 'idrRecommendation', label: 'IDR', sortable: true, render: (v) => <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${idrColor(v)}`}>{v}</span> },
    { key: 'successProbability', label: 'Success %', sortable: true, render: (v) => v ? <span className="font-semibold">{Math.round(v * 100)}%</span> : <span className="text-gray-400">N/A</span> },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="POC & Survey Response"
        subtitle="Plan of Correction, IDR Analysis & Revisit Preparation"
        aiSummary={`${defs.length} deficiencies cited on CMS-2567. POC deadline in ${daysUntilPoc} days (April 15). ${criticalHighCount} actual harm findings at Grade G. Agent recommends IDR disputes for 2 deficiencies. Total financial exposure estimated at $${(financialImpact.totalExposure.low / 1000).toFixed(0)}K-$${(financialImpact.totalExposure.high / 1000).toFixed(0)}K. All 5 POCs drafted and ready for administrator review.`}
        riskLevel="high"
      />

      <AgentSummaryBar
        agentName="Survey Defense Agent"
        summary="Drafted all 5 Plans of Correction with CMS-required elements. Analyzed IDR viability for each deficiency — recommending dispute for F-758 and F-880. Financial exposure modeled across all citation grades."
        itemsProcessed={5}
        exceptionsFound={1}
        timeSaved="12.5 hrs"
        lastRunTime="18 min ago"
      />

      <StatGrid stats={stats} columns={6} />

      <DecisionQueue decisions={decisions} onApprove={approve} onEscalate={escalate} onOverride={override} title="Post-Survey Decisions" badge={decisions.length} />

      {/* Exit Conference Summary */}
      <Card title="Exit Conference Summary" badge={new Date(exitConference.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}>
        <div className="space-y-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">Attendees</p>
            <div className="flex flex-wrap gap-2">
              {exitConference.attendees.map(a => (
                <span key={a} className="px-2 py-1 rounded-md bg-gray-100 dark:bg-gray-800 text-xs text-gray-700 dark:text-gray-300">{a}</span>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">Preliminary Findings</p>
            <div className="space-y-2">
              {surveyFindings.map(f => (
                <div key={f.fTag} className="flex flex-wrap items-center gap-2 py-2 border-b border-gray-100 dark:border-gray-800 last:border-0">
                  <span className="px-2 py-0.5 rounded bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs font-bold">{f.fTag}</span>
                  <span className="text-sm text-gray-700 dark:text-gray-300 flex-1 min-w-[200px]">{f.description}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${scopeColor(f.scope)}`}>{f.scope}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${severityColor(f.severity)}`}>{f.severity}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* CMS-2567 Deficiency Tracker */}
      <Card title="CMS-2567 Deficiency Tracker" badge={`${defs.length} deficiencies`}>
        <DataTable columns={defColumns} data={defs} onRowClick={openDeficiencyModal} searchable pageSize={10} />
      </Card>

      {/* POC Timeline */}
      <Card title="POC Timeline" badge="Key Dates">
        <div className="space-y-4">
          <div className="flex items-center justify-center gap-1 sm:gap-3 overflow-x-auto py-2">
            {timeline.map((t, i) => (
              <div key={t.label} className="flex items-center gap-1 sm:gap-3">
                <div className="flex flex-col items-center min-w-[80px]">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${t.status === 'complete' ? 'bg-emerald-100 dark:bg-emerald-900/40' : t.status === 'upcoming' ? 'bg-amber-100 dark:bg-amber-900/40' : 'bg-gray-100 dark:bg-gray-800'}`}>
                    {t.status === 'complete' ? <CheckCircle2 size={16} className="text-emerald-600 dark:text-emerald-400" /> : t.status === 'upcoming' ? <Clock size={16} className="text-amber-600 dark:text-amber-400" /> : <Calendar size={16} className="text-gray-400" />}
                  </div>
                  <p className="text-xs font-semibold text-gray-900 dark:text-white mt-1">{t.date}</p>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400">{t.label}</p>
                </div>
                {i < timeline.length - 1 && <div className="w-8 sm:w-12 h-px bg-gray-300 dark:bg-gray-700 mt-[-12px]" />}
              </div>
            ))}
          </div>
          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 text-center">
            <p className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">POC Deadline Countdown</p>
            <p className={`text-3xl font-bold ${deadlineColor}`}>{daysUntilPoc} days</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Due {pocDeadline.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
          </div>
          <div className="space-y-2">
            {defs.map(d => (
              <div key={d.id} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800 last:border-0">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-gray-900 dark:text-white">{d.fTag}</span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">POC Draft</span>
                </div>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                  <ClipboardCheck size={12} /> Ready for Review
                </span>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Financial Impact */}
      <Card title="Financial Impact Analysis" badge={`$${(financialImpact.totalExposure.low / 1000).toFixed(0)}K-$${(financialImpact.totalExposure.high / 1000).toFixed(0)}K`}>
        <div className="space-y-3">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 text-center">
            <p className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">Total Exposure Range</p>
            <p className="text-2xl font-bold text-red-600 dark:text-red-400">${financialImpact.totalExposure.low.toLocaleString()} — ${financialImpact.totalExposure.high.toLocaleString()}</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-2 text-xs font-bold uppercase tracking-wider text-gray-500">F-Tag</th>
                  <th className="text-right py-2 text-xs font-bold uppercase tracking-wider text-gray-500">Low</th>
                  <th className="text-right py-2 text-xs font-bold uppercase tracking-wider text-gray-500">High</th>
                  <th className="text-left py-2 pl-4 text-xs font-bold uppercase tracking-wider text-gray-500">Basis</th>
                </tr>
              </thead>
              <tbody>
                {defs.map(d => (
                  <tr key={d.id} className="border-b border-gray-100 dark:border-gray-800 last:border-0">
                    <td className="py-2 font-bold text-gray-900 dark:text-white">{d.fTag}</td>
                    <td className="py-2 text-right text-gray-700 dark:text-gray-300">${d.financialExposure.low.toLocaleString()}</td>
                    <td className="py-2 text-right text-gray-700 dark:text-gray-300">${d.financialExposure.high.toLocaleString()}</td>
                    <td className="py-2 pl-4 text-gray-500 dark:text-gray-400">{d.financialExposure.basis}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Card>
    </div>
  );
}
