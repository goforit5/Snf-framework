import { Link } from 'react-router-dom';
import {
  Shield, Activity, ChevronRight, CheckCircle2, FileText,
  Bot, AlertTriangle, Database, Pencil, Plus, User
} from 'lucide-react';
import { PageHeader, Card, ActionButton, ClickableRow, ConfidenceBar, AgentHumanSplit, SectionLabel, ProgressBar } from '../components/Widgets';
import { useModal } from '../components/WidgetUtils';
import { AgentSummaryBar } from '../components/AgentComponents';
import { DecisionQueue } from '../components/DecisionComponents';
import { useDecisionQueue } from '../hooks/useDecisionQueue';
import {
  complianceTrends, agentMetrics,
  complianceFacilities, complianceFindings, complianceSummary, pccSyncData
} from '../data/complianceData';

const catNames = {
  clinical: 'Clinical Care', medication: 'Medication Mgmt', infection: 'Infection & Safety',
  documentation: 'Documentation', rights: 'Rights & Nutrition', devices: 'Devices & Catheters',
};

const complianceDecisions = [
  { id: 'cc-1', title: 'F-689 Fall Prevention — Heritage Oaks', description: 'Margaret Chen (Room 204, Unit B) fell for the 3rd time in 30 days — last fall was March 12 at 2:15 AM during an unassisted bathroom trip. Her Braden score dropped to 14 (moderate risk). Current interventions (bed alarm + non-slip socks) are insufficient. Robert Williams (Room 118) fell once on March 8 from a wheelchair with brakes not locked. Family (daughter Jennifer Chen, POA) has not been notified of the most recent fall. Heritage Oaks survey window opens in 6 weeks.', facility: 'Heritage Oaks', priority: 'Critical', agent: 'Clinical Compliance Agent', confidence: 0.95, governanceLevel: 3, recommendation: 'Approve protocol change: add hourly rounding on Unit B, low beds for M. Chen and R. Williams, hip protectors for M. Chen, wheelchair brake checks for R. Williams. Agent will write updated fall risk assessments to PCC and schedule interdisciplinary care conference for March 20. Evidence supports 62% fall reduction with combined interventions.', impact: 'If not addressed: $47K average F-689 fine + Immediate Jeopardy risk given 3 falls in 30 days. CMS database shows 78% citation probability for facilities with this pattern. Heritage Oaks survey window opens April 28.', evidence: [{ label: 'PCC Fall Log', detail: 'M. Chen: falls on 2/18 (bathroom), 3/4 (hallway), 3/12 (bathroom). R. Williams: 3/8 (wheelchair)' }, { label: 'PCC Braden Score', detail: 'M. Chen: 14 (moderate risk), last assessed 3/13' }, { label: 'CMS F-689 Precedent', detail: '3+ falls in 30 days = 78% citation rate in comparable facilities' }] },
  { id: 'cc-2', title: 'Care Plan Updates Overdue — 3 Residents', description: 'Three residents at Heritage Oaks had significant clinical changes but care plans were not updated within the required 72-hour window. Margaret Chen: 3 falls and Ambien added to regimen (care plan last updated Feb 28 — 18 days ago). Robert Williams: 7.2% weight loss and dietary supplement started (care plan last updated Feb 15 — 31 days ago). Dorothy Evans: new sacral wound Stage 2 identified March 10 (care plan last updated March 1 — 17 days ago). Agent has pre-populated draft care plan updates in PCC using recent nursing notes, lab results, and medication changes.', facility: 'Heritage Oaks', priority: 'High', agent: 'Clinical Compliance Agent', confidence: 0.92, governanceLevel: 2, recommendation: 'Approve agent-drafted care plan updates for all 3 residents. Agent writes updates to PCC immediately, then notifies DON Sarah Mitchell for co-signature by end of shift. Draft updates include: fall prevention interventions (Chen), nutritional monitoring plan (Williams), wound care protocol with weekly measurements (Evans).', impact: 'F-656/F-657 citation risk — documentation gaps are the #1 survey deficiency nationally ($22K avg fine per citation). All 3 residents have active clinical issues making this a high-probability finding during survey.', evidence: [{ label: 'PCC Care Plans', detail: 'M. Chen: last updated 2/28. R. Williams: last updated 2/15. D. Evans: last updated 3/1' }, { label: 'PCC Clinical Notes', detail: 'Agent extracted 14 relevant nursing notes, 3 lab results, 2 MD orders for draft updates' }, { label: 'CMS Requirement', detail: 'F-656: care plan must be updated within 72 hrs of significant change' }] },
  { id: 'cc-3', title: 'Infection Control Policy — CDC March 2026 Update', description: 'CDC published updated respiratory infection isolation guidance on March 15, 2026, changing airborne precaution duration from 10 days to symptom-based criteria and adding rapid antigen testing requirements for de-isolation. All 8 Ensign facilities currently reference the superseded November 2024 CDC guidelines in their infection control policies. Agent compared current policy language against new guidance and identified 4 sections requiring revision. No active respiratory infection cases across facilities — this is a proactive compliance update.', facility: 'Enterprise-wide', priority: 'High', agent: 'Clinical Compliance Agent', confidence: 0.88, governanceLevel: 3, recommendation: 'Approve revised infection control policy (agent-drafted, 4 sections updated). Agent will route to Medical Director Dr. Patel for clinical review, then distribute to all 8 facility DONs with training acknowledgment tracking. Policy effective date: April 1, 2026 (allows 2-week staff training window).', impact: 'If not addressed: F-880 citation risk during survey — outdated infection control policies cited in 34% of recent CMS surveys. $28K average fine. Proactive update eliminates this exposure across all 8 facilities simultaneously.', evidence: [{ label: 'CDC Guidance', detail: 'Published 3/15/2026 — respiratory isolation now symptom-based, rapid antigen required for de-isolation' }, { label: 'Current Policy', detail: 'References Nov 2024 CDC guidelines — 4 sections outdated' }, { label: 'CMS F-880 Data', detail: 'Outdated infection control policies cited in 34% of 2025 surveys' }] },
];
const severityDotColor = { Critical: 'bg-red-500', High: 'bg-orange-400', Medium: 'bg-yellow-400', Low: 'bg-gray-300' };
const statusDot = (score) => score >= 90 ? 'bg-green-500' : score >= 75 ? 'bg-orange-400' : 'bg-red-500';

export default function ClinicalCompliance() {
  const { open, close } = useModal();
  const { decisions: queuedDecisions, approve, escalate } = useDecisionQueue(complianceDecisions);
  const data = complianceSummary;
  const trends = complianceTrends;
  const months = trends.months;
  const overall = trends.overall;
  const pendingFindings = complianceFindings.filter(f => f.status === 'pending');
  const criticalAndHigh = pendingFindings.filter(f => f.severity === 'Critical' || f.severity === 'High').slice(0, 5);

  function openSuccessModal(finding) {
    const writebacks = finding.pccWritebacks || [];
    const coSignCount = writebacks.filter(w => w.requiresCoSign).length;
    open({
      title: 'Fix Applied',
      content: (
        <div className="flex flex-col items-center text-center py-6 space-y-4">
          <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center"><CheckCircle2 size={28} className="text-green-500" /></div>
          <p className="text-lg font-semibold text-gray-900">Documentation Synced to PCC</p>
          <p className="text-sm text-gray-500">{writebacks.length} {writebacks.length === 1 ? 'entry' : 'entries'} written successfully</p>
          <div className="w-full space-y-2 text-left">
            {writebacks.map((wb, i) => (
              <div key={i} className="flex items-center gap-3 bg-green-50 border border-green-100 rounded-lg px-4 py-2.5">
                <CheckCircle2 size={14} className="text-green-600 flex-shrink-0" />
                <div className="flex-1 min-w-0"><p className="text-xs font-medium text-green-900 truncate">{wb.module} &rarr; {wb.field}</p><p className="text-[11px] text-green-700">{wb.resident} &middot; Room {wb.room}</p></div>
              </div>
            ))}
          </div>
          {coSignCount > 0 && <div className="bg-amber-50 border border-amber-100 rounded-lg px-4 py-2.5 w-full text-left"><p className="text-xs text-amber-800 font-medium">{coSignCount} {coSignCount === 1 ? 'entry requires' : 'entries require'} co-signature — notifications sent.</p></div>}
          <div className="space-y-1 text-sm text-gray-400">
            <p>Audit trail entry #AT-2026-{String(Math.floor(Math.random() * 9000) + 1000).padStart(4, '0')} created</p>
            <p>Next: {pendingFindings.length - 1} findings remaining in queue</p>
          </div>
        </div>
      ),
      actions: <ActionButton label="Done" variant="primary" onClick={close} />,
    });
  }

  function openApprovalModal(finding) {
    const actionIcon = { Add: Plus, Update: Pencil, Remove: AlertTriangle };
    const actionColor = { Add: 'text-green-600 bg-green-50', Update: 'text-blue-600 bg-blue-50', Remove: 'text-red-600 bg-red-50' };
    const writebacks = finding.pccWritebacks || [];
    open({
      title: 'Review PCC Documentation Changes',
      content: (
        <div className="space-y-5">
          <p className="text-sm text-gray-700">The following documentation will be written to PointClickCare for <span className="font-semibold">{finding.title}</span>:</p>
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-start gap-3"><Database size={16} className="text-blue-600 flex-shrink-0 mt-0.5" /><div><p className="text-sm font-semibold text-blue-900">{writebacks.length} documentation {writebacks.length === 1 ? 'change' : 'changes'} to PCC</p><p className="text-xs text-blue-700 mt-0.5">Review each entry below before approving.</p></div></div>
          {writebacks.map((wb, i) => {
            const Icon = actionIcon[wb.action] || Pencil;
            const color = actionColor[wb.action] || 'text-gray-600 bg-gray-50';
            return (
              <div key={i} className="border border-gray-200 rounded-xl overflow-hidden">
                <div className="bg-gray-50 px-4 py-3 flex items-center gap-3 border-b border-gray-200"><div className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 ${color}`}><Icon size={12} /></div><div className="flex-1 min-w-0"><p className="text-xs font-semibold text-gray-900">{wb.module} &rarr; {wb.section}</p><p className="text-[11px] text-gray-500">{wb.resident} &middot; Room {wb.room}</p></div><span className="text-[10px] font-bold text-gray-400 uppercase">{wb.action}</span></div>
                <div className="px-4 py-3 space-y-3">
                  <div><p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Field</p><p className="text-sm font-medium text-gray-900">{wb.field}</p></div>
                  {wb.currentValue && <div><p className="text-[10px] font-bold text-red-400 uppercase tracking-wider mb-1">Current Value</p><div className="bg-red-50 border border-red-100 rounded-lg p-3"><p className="text-xs text-red-800 whitespace-pre-wrap font-mono leading-relaxed">{wb.currentValue}</p></div></div>}
                  <div><p className="text-[10px] font-bold text-green-600 uppercase tracking-wider mb-1">New Value (Will Be Written)</p><div className="bg-green-50 border border-green-100 rounded-lg p-3"><p className="text-xs text-green-900 whitespace-pre-wrap font-mono leading-relaxed">{wb.newValue}</p></div></div>
                  {wb.requiresCoSign && <div className="flex items-center gap-2 pt-1"><User size={12} className="text-amber-500" /><span className="text-[11px] text-amber-700 font-medium">Requires co-sign: {wb.coSignRole}</span></div>}
                </div>
              </div>
            );
          })}
          <p className="text-xs text-gray-400">An audit trail entry will be created for each PCC write-back.</p>
        </div>
      ),
      actions: (<><ActionButton label="Go Back" variant="outline" onClick={() => openFindingModal(finding)} /><ActionButton label={`Approve & Write ${writebacks.length} Changes to PCC`} variant="primary" icon={CheckCircle2} onClick={() => openSuccessModal(finding)} /></>),
    });
  }

  function openFindingModal(f) {
    open({
      title: f.title,
      content: (
        <div className="space-y-6">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1.5"><div className={`w-1.5 h-1.5 rounded-full ${severityDotColor[f.severity]}`} /><span className="text-xs text-gray-600">{f.severity}</span></div>
            <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-lg text-xs font-medium">{f.fTag}</span>
            <span className="text-xs text-gray-500">{f.facility}</span>
            <span className="text-xs text-gray-400">Detected {f.detectedAt}</span>
          </div>
          <p className="text-sm text-gray-700 leading-relaxed">{f.details}</p>
          {f.residents.length > 0 && (<div><p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Affected Residents</p><div className="space-y-2">{f.residents.map((r, i) => <div key={i} className="bg-gray-50 rounded-lg px-4 py-2.5 text-sm"><span className="font-medium text-gray-900">{r.name}</span><span className="text-gray-500 ml-2">Room {r.room}</span><span className="text-gray-400 ml-2">— {r.issue}</span></div>)}</div></div>)}
          <div className="bg-gray-50 rounded-xl p-5"><div className="flex items-center gap-2 mb-3"><Bot size={14} className="text-blue-600" /><span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Agent-Suggested Fix</span></div><ol className="space-y-2">{f.fixSteps.map((step, i) => <li key={i} className="flex gap-2 text-sm text-gray-700"><span className="font-semibold text-gray-900 flex-shrink-0">{i + 1}.</span>{step}</li>)}</ol></div>
          {f.pccWritebacks && f.pccWritebacks.length > 0 && (<div className="bg-gray-50 rounded-xl p-4"><div className="flex items-center gap-2 mb-2"><Database size={14} className="text-blue-600" /><span className="text-xs font-bold text-gray-500 uppercase tracking-wider">PCC Write-Back ({f.pccWritebacks.length} changes)</span></div><div className="space-y-2">{f.pccWritebacks.map((wb, i) => <div key={i} className="flex items-center gap-2 text-sm text-gray-700"><span className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0" /><span className="font-medium text-gray-900">{wb.module}</span><span className="text-gray-400">&rarr;</span><span className="truncate">{wb.field}</span></div>)}</div><p className="text-[11px] text-gray-400 mt-2">Full documentation shown on approval screen</p></div>)}
          <div className="grid grid-cols-2 gap-4">
            <div><p className="text-xs text-gray-500 mb-1.5">Agent Confidence</p><ConfidenceBar value={f.agentConfidence} /></div>
            <div><p className="text-xs text-gray-500 mb-1.5">Citation Risk</p><p className="text-sm font-semibold text-gray-900">{f.citationRisk}</p><p className="text-xs text-gray-500">{f.estimatedFine}</p></div>
          </div>
        </div>
      ),
      actions: (<><ActionButton label="Dismiss" variant="ghost" /><ActionButton label="Modify" variant="outline" /><ActionButton label="Approve Fix" variant="primary" icon={CheckCircle2} onClick={() => openApprovalModal(f)} /></>),
    });
  }

  function openFacilityModal(fac) {
    const facFindings = complianceFindings.filter(f => f.facility === fac.name && f.status === 'pending');
    open({
      title: fac.name,
      content: (
        <div className="space-y-6">
          <div className="text-center py-4"><p className="text-6xl font-bold tracking-tight text-gray-900">{fac.complianceScore}%</p><p className="text-sm text-gray-500 mt-2">Overall Compliance Score</p></div>
          <div className="space-y-3"><p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Category Breakdown</p>{Object.entries(fac.categoryScores).map(([cat, score]) => <ProgressBar key={cat} label={catNames[cat]} value={score} color="blue" />)}</div>
          {fac.fTagRisks.length > 0 && (<div><p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">F-Tag Risks</p><div className="flex flex-wrap gap-2">{fac.fTagRisks.map(tag => <span key={tag} className="bg-gray-100 text-gray-600 px-2.5 py-1 rounded-lg text-xs font-medium">{tag}</span>)}</div></div>)}
          <div className="bg-gray-50 rounded-xl p-4"><div className="flex items-center gap-2 mb-1">{fac.pccConnected ? <div className="w-2 h-2 rounded-full bg-green-500" /> : <div className="w-2 h-2 rounded-full bg-red-500" />}<span className="text-sm font-semibold text-gray-900">PCC {fac.pccConnected ? 'Connected' : 'Offline'}</span></div>{fac.lastPccSync && <p className="text-xs text-gray-500">Last sync: {fac.lastPccSync}</p>}</div>
          {facFindings.length > 0 && (<div><p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Open Findings ({facFindings.length})</p><div className="space-y-2">{facFindings.map(f => <div key={f.id} className="bg-gray-50 rounded-lg px-4 py-3 cursor-pointer hover:bg-white hover:shadow-sm transition-all border border-transparent hover:border-gray-200" onClick={() => openFindingModal(f)}><div className="flex items-center gap-2"><div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${severityDotColor[f.severity]}`} /><span className="text-sm font-medium text-gray-900 truncate">{f.title}</span></div><div className="flex items-center gap-2 mt-1 ml-3.5"><span className="bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded text-[10px] font-medium">{f.fTag}</span><span className="text-xs text-gray-400">{f.detectedAt}</span></div></div>)}</div></div>)}
        </div>
      ),
      actions: (<><ActionButton label="Run Audit" variant="primary" icon={Activity} /><ActionButton label="Export" variant="outline" icon={FileText} /></>),
    });
  }

  function openPccModal() {
    const pcc = pccSyncData;
    open({
      title: 'PCC Integration Status',
      content: (
        <div className="space-y-6">
          <div className="grid grid-cols-3 gap-4">{[{ label: 'Synced Today', val: pcc.stats.syncedToday.toLocaleString() }, { label: 'Avg Latency', val: pcc.stats.avgLatency }, { label: 'Uptime', val: pcc.stats.uptime }].map(s => <div key={s.label} className="text-center bg-gray-50 rounded-xl p-4"><p className="text-lg font-bold text-gray-900">{s.val}</p><p className="text-xs text-gray-500 mt-1">{s.label}</p></div>)}</div>
          <div><p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Facility Connections</p><div className="space-y-2">{pcc.facilities.map(f => <div key={f.name} className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-2.5"><div className="flex items-center gap-2"><div className={`w-2 h-2 rounded-full ${f.connected ? 'bg-green-500' : 'bg-red-500'}`} /><span className="text-sm font-medium text-gray-800">{f.name}</span></div><span className="text-xs text-gray-500">{f.lastSync || 'Not connected'}</span></div>)}</div></div>
          <div><p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Data Pipeline</p><div className="space-y-2">{pcc.pipeline.map((step, i) => <div key={i} className="flex items-center gap-3 bg-gray-50 rounded-lg px-4 py-2.5"><div className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0"><CheckCircle2 size={12} className="text-blue-600" /></div><div><p className="text-sm font-medium text-gray-800">{step.name}</p><p className="text-xs text-gray-500">{step.detail}</p></div></div>)}</div></div>
          <div><p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Recent Activity</p><div className="space-y-2">{pcc.recentActivity.slice(0, 5).map((a, i) => <div key={i} className="flex items-start gap-3 text-sm"><span className="text-xs text-gray-400 flex-shrink-0 w-16">{a.time}</span><span className="text-gray-700">{a.action}</span></div>)}</div></div>
        </div>
      ),
    });
  }

  return (
    <div className="space-y-10">
      <PageHeader title="Compliance Command" aiSummary="Overall compliance is 84% and trending up 8 points since October. Heritage Oaks remains the primary risk at 68% — all other facilities are above 78%." />

      <AgentSummaryBar agentName="Compliance Monitoring Agent" summary={`overall compliance at ${data.overallCompliance}%. ${pendingFindings.length} findings pending review.`} itemsProcessed={data.totalChecksPerDay} exceptionsFound={pendingFindings.length} timeSaved={`${agentMetrics.hoursAutoSaved} hrs/wk`} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-2xl p-8 flex flex-col items-center justify-center text-center">
          <p className="text-7xl font-bold tracking-tight text-gray-900">{data.overallCompliance}%</p>
          <p className="text-sm text-gray-500 mt-2 font-medium">Overall Compliance</p>
          <div className="flex items-center gap-1.5 mt-3"><div className="w-1.5 h-1.5 rounded-full bg-green-500" /><span className="text-xs text-gray-500">+8% in 6 months</span></div>
          <p className="text-xs text-gray-400 mt-2">Target: 90%</p>
        </div>
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-8 flex flex-col justify-center text-white">
          <p className="text-4xl font-bold tracking-tight">{agentMetrics.hoursAutoSaved} hrs/week</p>
          <p className="text-base text-blue-100 mt-1 font-medium">saved by AI agents</p>
          <p className="text-lg font-semibold mt-4">{Math.round(agentMetrics.fteSaved)} FTEs replaced by AI agents</p>
          <p className="text-sm text-blue-200 mt-3">{agentMetrics.totalAuditsThisWeek.toLocaleString()} audits this week<span className="mx-2">&middot;</span>{agentMetrics.accuracy}% accuracy</p>
        </div>
      </div>

      <Card title="6-Month Compliance Trend" action={<span className="text-xs text-gray-400 font-medium">Target: 90%</span>}>
        <div className="relative px-2">
          <div className="absolute left-0 right-0 z-10" style={{ bottom: `${(90 / 100) * 220 + 32}px` }}><div className="border-t-2 border-dashed border-gray-300 mx-2" /><span className="absolute -top-5 right-2 text-[11px] text-gray-400 font-semibold">90%</span></div>
          <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${months.length}, 1fr)`, height: 220 }}>
            {months.map((month, i) => { const val = overall[i]; const pct = (val / 100) * 100; return (<div key={month} className="flex flex-col items-center justify-end"><span className="text-sm font-bold text-gray-700 mb-2">{val}%</span><div className="w-full flex justify-center" style={{ height: `${pct}%` }}><div className="w-full max-w-16 rounded-t-xl bg-blue-500" style={{ height: '100%' }} /></div></div>); })}
          </div>
          <div className="grid gap-3 mt-3" style={{ gridTemplateColumns: `repeat(${months.length}, 1fr)` }}>{months.map(month => <div key={month} className="text-center text-xs text-gray-500 font-medium">{month}</div>)}</div>
        </div>
        <p className="text-sm text-gray-500 mt-6 text-center">Trending up <span className="font-semibold text-gray-900">+8 points</span> since October — on track to reach 90% CMS target by Q3</p>
      </Card>

      <div><SectionLabel>Facility Health</SectionLabel>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {complianceFacilities.map(fac => (
            <div key={fac.id} className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-md transition-all cursor-pointer active:scale-[0.98]" onClick={() => openFacilityModal(fac)}>
              <div className="flex items-start justify-between mb-1"><div><h3 className="text-sm font-semibold text-gray-900">{fac.name}</h3><p className="text-xs text-gray-400 mt-0.5">{fac.city}</p></div><div className="flex items-center gap-1.5"><div className={`w-1.5 h-1.5 rounded-full ${statusDot(fac.complianceScore)}`} /><span className="text-3xl font-bold tracking-tight text-gray-900">{fac.complianceScore}</span></div></div>
              <div className="mt-4 mb-4"><div className="h-2 bg-gray-200 rounded-full overflow-hidden"><div className="h-full rounded-full bg-blue-500" style={{ width: `${fac.complianceScore}%` }} /></div></div>
              <div className="flex items-center justify-between"><div className="flex items-center gap-1.5">{fac.pccConnected ? <><div className="w-1.5 h-1.5 rounded-full bg-green-500" /><span className="text-xs text-gray-500">Connected</span></> : <><div className="w-1.5 h-1.5 rounded-full bg-red-500" /><span className="text-xs text-gray-500">Offline</span></>}</div>{fac.openFindings > 0 && <span className="text-xs text-gray-500">{fac.openFindings} finding{fac.openFindings !== 1 ? 's' : ''}</span>}</div>
            </div>
          ))}
        </div>
      </div>

      <DecisionQueue decisions={queuedDecisions} onApprove={approve} onEscalate={escalate} title="Compliance Decisions" badge={queuedDecisions.length} />

      <div><SectionLabel>Needs Your Attention</SectionLabel>
        <div className="space-y-3">
          {criticalAndHigh.map(f => (
            <ClickableRow key={f.id} onClick={() => openFindingModal(f)}>
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap"><div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${severityDotColor[f.severity]}`} /><span className="text-sm font-semibold text-gray-900 truncate">{f.title}</span><span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-lg text-[10px] font-medium">{f.fTag}</span></div>
                  <div className="flex items-center gap-2 text-xs text-gray-500 ml-3.5"><span>{f.facility}</span><span className="text-gray-300">&middot;</span><span className="truncate">{f.suggestedFix}</span></div>
                </div>
                <ActionButton label="Approve" variant="primary" icon={CheckCircle2} onClick={e => { e.stopPropagation(); openApprovalModal(f); }} />
              </div>
            </ClickableRow>
          ))}
        </div>
      </div>

      <div><SectionLabel>Agent vs Human</SectionLabel>
        <AgentHumanSplit agentCount={agentMetrics.totalAuditsThisWeek} humanCount={agentMetrics.totalHumanApprovals} />
        <div className="grid grid-cols-3 gap-4 mt-4">
          {[{ label: 'Audit types monitored', value: data.totalAuditTypes }, { label: 'Checks per day', value: data.totalChecksPerDay.toLocaleString() }, { label: 'Avg approval time', value: agentMetrics.approvalTimeAvg }].map(s => <div key={s.label} className="text-center bg-white border border-gray-200 rounded-2xl p-4"><p className="text-lg font-bold text-gray-900">{s.value}</p><p className="text-xs text-gray-500 mt-1">{s.label}</p></div>)}
        </div>
      </div>

      <div><SectionLabel>Quick Links</SectionLabel>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Link to="/audits" className="block"><div className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-md transition-all cursor-pointer"><div className="flex items-center justify-between"><div><h3 className="text-sm font-semibold text-gray-900">View All 20 Audit Types</h3><p className="text-xs text-gray-500 mt-1">Detailed breakdown by F-tag and category</p></div><ChevronRight size={18} className="text-gray-400" /></div></div></Link>
          <div className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-md transition-all cursor-pointer" onClick={openPccModal}><div className="flex items-center justify-between"><div><h3 className="text-sm font-semibold text-gray-900">PCC Integration Status</h3><p className="text-xs text-gray-500 mt-1">{pccSyncData.stats.syncedToday.toLocaleString()} records synced today &middot; {pccSyncData.stats.uptime} uptime</p></div><ChevronRight size={18} className="text-gray-400" /></div></div>
        </div>
      </div>
    </div>
  );
}
