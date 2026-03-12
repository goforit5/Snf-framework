import { Link } from 'react-router-dom';
import { Shield, Activity, Wifi, WifiOff, ChevronRight, AlertTriangle, CheckCircle2, Clock, FileText, Link2, Bot } from 'lucide-react';
import {
  PageHeader, Card, ActionButton, ClickableRow, useModal,
  ConfidenceBar, PriorityBadge, AgentHumanSplit, SectionLabel, ProgressBar
} from '../components/Widgets';
import {
  complianceTrends, agentMetrics,
  complianceFacilities, complianceFindings, complianceSummary, pccSyncData
} from '../data/complianceData';

/* ─── Color Lookups (no dynamic Tailwind) ─── */
const scoreTextColor = { green: 'text-emerald-600', amber: 'text-amber-600', red: 'text-red-600' };
const scoreBgColor = { green: 'bg-emerald-500', amber: 'bg-amber-500', red: 'bg-red-500' };
const fTagColor = 'bg-purple-50 text-purple-700 border-purple-200';
const catBarColors = {
  clinical: 'bg-red-400', medication: 'bg-purple-400', infection: 'bg-amber-400',
  documentation: 'bg-blue-400', rights: 'bg-emerald-400', devices: 'bg-cyan-400',
};
const catNames = {
  clinical: 'Clinical Care', medication: 'Medication Mgmt', infection: 'Infection & Safety',
  documentation: 'Documentation', rights: 'Rights & Nutrition', devices: 'Devices & Catheters',
};

function tier(score) {
  if (score >= 90) return 'green';
  if (score >= 75) return 'amber';
  return 'red';
}

/* ─── Main Component ─── */
export default function ClinicalCompliance() {
  const { open } = useModal();
  const data = complianceSummary;
  const trends = complianceTrends;
  const months = trends.months;
  const overall = trends.overall;

  const pendingFindings = complianceFindings.filter(f => f.status === 'pending');
  const criticalAndHigh = pendingFindings.filter(f => f.severity === 'Critical' || f.severity === 'High').slice(0, 5);

  /* ─── Facility Detail Modal ─── */
  function openFacilityModal(fac) {
    const t = tier(fac.complianceScore);
    open({
      title: fac.name,
      content: (
        <div className="space-y-6">
          <div className="text-center py-4">
            <span className={`text-6xl font-bold tracking-tight ${scoreTextColor[t]}`}>
              {fac.complianceScore}%
            </span>
            <p className="text-sm text-gray-500 mt-2">Overall Compliance Score</p>
          </div>

          <div className="space-y-3">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Category Breakdown</p>
            {Object.entries(fac.categoryScores).map(([cat, score]) => (
              <ProgressBar
                key={cat}
                label={catNames[cat]}
                value={score}
                color={score >= 90 ? 'emerald' : score >= 75 ? 'amber' : 'red'}
              />
            ))}
          </div>

          {fac.fTagRisks.length > 0 && (
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">F-Tag Risks</p>
              <div className="flex flex-wrap gap-2">
                {fac.fTagRisks.map(tag => (
                  <span key={tag} className={`px-2.5 py-1 rounded-lg text-xs font-semibold border ${fTagColor}`}>{tag}</span>
                ))}
              </div>
            </div>
          )}

          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              {fac.pccConnected
                ? <Wifi size={14} className="text-emerald-500" />
                : <WifiOff size={14} className="text-red-500" />}
              <span className="text-sm font-semibold text-gray-800">
                PCC {fac.pccConnected ? 'Connected' : 'Offline'}
              </span>
            </div>
            {fac.lastPccSync && (
              <p className="text-xs text-gray-500">Last sync: {fac.lastPccSync}</p>
            )}
          </div>

          {fac.openFindings > 0 && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <AlertTriangle size={14} className="text-amber-500" />
              <span>{fac.openFindings} open finding{fac.openFindings !== 1 ? 's' : ''}</span>
            </div>
          )}
        </div>
      ),
      actions: (
        <>
          <ActionButton label="Run Audit" variant="primary" icon={Activity} />
          <ActionButton label="Export" variant="outline" icon={FileText} />
        </>
      ),
    });
  }

  /* ─── Finding Detail Modal ─── */
  function openFindingModal(f) {
    open({
      title: f.title,
      content: (
        <div className="space-y-6">
          <div className="flex flex-wrap gap-2">
            <PriorityBadge priority={f.severity} />
            <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold border ${fTagColor}`}>{f.fTag}</span>
            <span className="text-xs text-gray-500">{f.facility}</span>
          </div>

          <p className="text-sm text-gray-700 leading-relaxed">{f.details}</p>

          {f.residents.length > 0 && (
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Affected Residents</p>
              <div className="space-y-2">
                {f.residents.map((r, i) => (
                  <div key={i} className="bg-gray-50 rounded-lg px-4 py-2 text-sm">
                    <span className="font-medium text-gray-800">{r.name}</span>
                    <span className="text-gray-500 ml-2">Room {r.room}</span>
                    <span className="text-gray-500 ml-2">— {r.issue}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <Bot size={14} className="text-emerald-600" />
              <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Agent-Suggested Fix</span>
            </div>
            <ol className="space-y-2">
              {f.fixSteps.map((step, i) => (
                <li key={i} className="flex gap-2 text-sm text-gray-700">
                  <span className="font-bold text-emerald-600 flex-shrink-0">{i + 1}.</span>
                  {step}
                </li>
              ))}
            </ol>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <Link2 size={14} className="text-blue-600" />
              <span className="text-xs font-bold text-blue-700">PCC Write-Back</span>
            </div>
            <p className="text-sm text-gray-700">{f.pccAction}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-500 mb-1.5">Agent Confidence</p>
              <ConfidenceBar value={f.agentConfidence} />
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1.5">Citation Risk</p>
              <p className="text-sm font-semibold text-red-600">{f.citationRisk}</p>
              <p className="text-xs text-gray-500">{f.estimatedFine}</p>
            </div>
          </div>
        </div>
      ),
      actions: (
        <>
          <ActionButton label="Dismiss" variant="ghost" />
          <ActionButton label="Modify" variant="outline" />
          <ActionButton label="Approve Fix" variant="success" icon={CheckCircle2} />
        </>
      ),
    });
  }

  /* ─── PCC Integration Modal ─── */
  function openPccModal() {
    const pcc = pccSyncData;
    open({
      title: 'PCC Integration Status',
      content: (
        <div className="space-y-6">
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Synced Today', val: pcc.stats.syncedToday.toLocaleString() },
              { label: 'Avg Latency', val: pcc.stats.avgLatency },
              { label: 'Uptime', val: pcc.stats.uptime },
            ].map(s => (
              <div key={s.label} className="text-center bg-gray-50 rounded-xl p-4">
                <p className="text-lg font-bold text-gray-900">{s.val}</p>
                <p className="text-xs text-gray-500 mt-1">{s.label}</p>
              </div>
            ))}
          </div>

          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Facility Connections</p>
            <div className="space-y-2">
              {pcc.facilities.map(f => (
                <div key={f.name} className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    {f.connected
                      ? <div className="w-2 h-2 rounded-full bg-emerald-500" />
                      : <div className="w-2 h-2 rounded-full bg-red-500" />}
                    <span className="text-sm font-medium text-gray-800">{f.name}</span>
                  </div>
                  <span className="text-xs text-gray-500">{f.lastSync || 'Not connected'}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Data Pipeline</p>
            <div className="space-y-2">
              {pcc.pipeline.map((step, i) => (
                <div key={i} className="flex items-center gap-3 bg-gray-50 rounded-lg px-4 py-2.5">
                  <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 size={12} className="text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800">{step.name}</p>
                    <p className="text-xs text-gray-500">{step.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Recent Activity</p>
            <div className="space-y-2">
              {pcc.recentActivity.slice(0, 5).map((a, i) => (
                <div key={i} className="flex items-start gap-3 text-sm">
                  <span className="text-xs text-gray-400 flex-shrink-0 w-16">{a.time}</span>
                  <span className="text-gray-700">{a.action}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ),
    });
  }

  /* ─── Render ─── */
  const chartMax = 100;
  const targetLine = 90;

  return (
    <div className="space-y-10">

      {/* ── Section 1: Header ── */}
      <PageHeader
        title="Compliance Command"
        aiSummary="Overall compliance is 84% and trending up 8 points since October. Heritage Oaks remains the primary risk at 68% — all other facilities are above 78%."
      />

      {/* ── Section 2: The Big Number + Agent Impact ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 flex flex-col items-center justify-center text-center">
          <p className={`text-6xl font-bold tracking-tight ${scoreTextColor[tier(data.overallCompliance)]}`}>
            {data.overallCompliance}%
          </p>
          <p className="text-sm text-gray-500 mt-2 font-medium">Overall Compliance</p>
          <div className="flex items-center gap-2 mt-3">
            <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
              +8% in 6 months
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-2">Target: 90%</p>
        </div>

        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl shadow-sm p-8 flex flex-col justify-center text-white">
          <p className="text-4xl font-bold tracking-tight">{agentMetrics.hoursAutoSaved} hrs/week</p>
          <p className="text-base text-blue-100 mt-1 font-medium">saved by AI agents</p>
          <p className="text-lg font-semibold mt-4">
            {Math.round(agentMetrics.fteSaved)} FTEs replaced by AI agents
          </p>
          <p className="text-sm text-blue-200 mt-3">
            {agentMetrics.totalAuditsThisWeek.toLocaleString()} audits this week
            <span className="mx-2">&middot;</span>
            {agentMetrics.accuracy}% accuracy
          </p>
        </div>
      </div>

      {/* ── Section 3: 6-Month Compliance Trend ── */}
      <Card title="6-Month Compliance Trend" action={<span className="text-xs text-gray-400 font-medium">Target: 90%</span>}>
        {/* Chart area */}
        <div className="relative px-2">
          {/* Target line — positioned at 90% of chart height */}
          <div className="absolute left-0 right-0 z-10" style={{ bottom: `${(90 / 100) * 220 + 32}px` }}>
            <div className="border-t-2 border-dashed border-emerald-300 mx-2" />
            <span className="absolute -top-5 right-2 text-[11px] text-emerald-500 font-semibold">90%</span>
          </div>

          {/* Bar chart using grid for reliable sizing */}
          <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${months.length}, 1fr)`, height: 220 }}>
            {months.map((month, i) => {
              const val = overall[i];
              const t = tier(val);
              const pct = (val / 100) * 100;
              return (
                <div key={month} className="flex flex-col items-center justify-end">
                  <span className="text-sm font-bold text-gray-700 mb-2">{val}%</span>
                  <div className="w-full flex justify-center" style={{ height: `${pct}%` }}>
                    <div className={`w-full max-w-16 rounded-t-xl ${scoreBgColor[t]}`} style={{ height: '100%' }} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Month labels */}
          <div className="grid gap-3 mt-3" style={{ gridTemplateColumns: `repeat(${months.length}, 1fr)` }}>
            {months.map(month => (
              <div key={month} className="text-center text-xs text-gray-500 font-medium">{month}</div>
            ))}
          </div>
        </div>

        <p className="text-sm text-gray-500 mt-6 text-center">
          Trending up <span className="font-semibold text-emerald-600">+8 points</span> since October — on track to reach 90% CMS target by Q3
        </p>
      </Card>

      {/* ── Section 4: Facility Health Grid ── */}
      <div>
        <SectionLabel>Facility Health</SectionLabel>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {complianceFacilities.map(fac => {
            const t = tier(fac.complianceScore);
            return (
              <div
                key={fac.id}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all cursor-pointer active:scale-[0.98]"
                onClick={() => openFacilityModal(fac)}
              >
                <div className="flex items-start justify-between mb-1">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900">{fac.name}</h3>
                    <p className="text-xs text-gray-400 mt-0.5">{fac.city}</p>
                  </div>
                  <span className={`text-3xl font-bold tracking-tight ${scoreTextColor[t]}`}>
                    {fac.complianceScore}
                  </span>
                </div>

                {/* Category strip */}
                <div className="flex gap-1 mt-4 mb-4">
                  {['clinical', 'medication', 'infection', 'documentation', 'rights', 'devices'].map(cat => {
                    const score = fac.categoryScores[cat];
                    return (
                      <div key={cat} className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden" title={`${catNames[cat]}: ${score}%`}>
                        <div
                          className={`h-full rounded-full ${catBarColors[cat]}`}
                          style={{ width: `${score}%` }}
                        />
                      </div>
                    );
                  })}
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    {fac.pccConnected
                      ? <><div className="w-2 h-2 rounded-full bg-emerald-500" /><span className="text-xs text-gray-500">Connected</span></>
                      : <><div className="w-2 h-2 rounded-full bg-red-500" /><span className="text-xs text-red-500 font-medium">Offline</span></>}
                  </div>
                  {fac.openFindings > 0 && (
                    <span className="text-xs text-amber-600 font-medium">
                      {fac.openFindings} finding{fac.openFindings !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Section 5: Needs Your Attention ── */}
      <div>
        <SectionLabel>Needs Your Attention</SectionLabel>
        <div className="space-y-3">
          {criticalAndHigh.map(f => (
            <ClickableRow key={f.id} onClick={() => openFindingModal(f)}>
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-sm font-semibold text-gray-900 truncate">{f.title}</span>
                    <PriorityBadge priority={f.severity} />
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${fTagColor}`}>{f.fTag}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span>{f.facility}</span>
                    <span className="text-gray-300">&middot;</span>
                    <span className="truncate">{f.suggestedFix}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <ActionButton label="Approve" variant="success" icon={CheckCircle2} onClick={e => e.stopPropagation()} />
                  <ActionButton label="Review" variant="outline" onClick={e => e.stopPropagation()} />
                </div>
              </div>
            </ClickableRow>
          ))}
        </div>
      </div>

      {/* ── Section 6: Agent vs Human Split ── */}
      <div>
        <SectionLabel>Agent vs Human</SectionLabel>
        <AgentHumanSplit
          agentCount={agentMetrics.totalAuditsThisWeek}
          humanCount={agentMetrics.totalHumanApprovals}
        />
        <div className="grid grid-cols-3 gap-4 mt-4">
          {[
            { label: 'Audit types monitored', value: data.totalAuditTypes },
            { label: 'Checks per day', value: data.totalChecksPerDay.toLocaleString() },
            { label: 'Avg approval time', value: agentMetrics.approvalTimeAvg },
          ].map(s => (
            <div key={s.label} className="text-center bg-white rounded-xl border border-gray-100 p-4">
              <p className="text-lg font-bold text-gray-900">{s.value}</p>
              <p className="text-xs text-gray-500 mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Section 7: Quick Links ── */}
      <div>
        <SectionLabel>Quick Links</SectionLabel>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Link to="/audits" className="block">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all cursor-pointer">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">View All 20 Audit Types</h3>
                  <p className="text-xs text-gray-500 mt-1">Detailed breakdown by F-tag and category</p>
                </div>
                <ChevronRight size={18} className="text-gray-400" />
              </div>
            </div>
          </Link>
          <div
            className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all cursor-pointer"
            onClick={openPccModal}
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-gray-900">PCC Integration Status</h3>
                <p className="text-xs text-gray-500 mt-1">{pccSyncData.stats.syncedToday.toLocaleString()} records synced today &middot; {pccSyncData.stats.uptime} uptime</p>
              </div>
              <ChevronRight size={18} className="text-gray-400" />
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
