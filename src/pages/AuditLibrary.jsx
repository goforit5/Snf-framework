import { useState } from 'react';
import { Shield, Activity, AlertTriangle, Users, Bot, User, Play, FileText, CheckCircle2, ChevronRight, Database, Pencil, Plus } from 'lucide-react';
import { auditCategories, auditTypes, complianceFindings } from '../data/complianceData';
import { PageHeader, ActionButton, ConfidenceBar } from '../components/Widgets';
import { useModal } from '../components/WidgetUtils';
import { AgentSummaryBar } from '../components/AgentComponents';
import { StatGrid } from '../components/DataComponents';
import { DecisionQueue } from '../components/DecisionComponents';
import { useDecisionQueue } from '../hooks/useDecisionQueue';
import { QuickFilter, SearchInput } from '../components/FilterComponents';

const AUDIT_DECISIONS = [
  {
    id: 'aud-1', title: 'F-689 Falls — 3 residents missing assessments, survey in 5 days',
    description: 'The Q4 internal audit at Heritage Oaks flagged 3 residents with incomplete fall risk assessments: Margaret Chen (Room 214B, 3 falls in 30 days, no updated care plan since Feb 1), Robert Kim (Room 118A, 2 falls, Braden score not reassessed post-fall), and Anna Lopez (Room 305, 1 fall, no medication reconciliation completed). PCC shows all three have active fall-risk medications. State survey window opens March 20 — surveyors pull fall records first. Heritage Oaks was cited for F-689 in 2024 ($15,000 fine), making this a repeat deficiency risk.',
    facility: 'Heritage Oaks', priority: 'Critical',
    agent: 'Compliance Audit Engine', confidence: 0.91, governanceLevel: 3,
    recommendation: 'Approve remediation plan: Agent will auto-generate fall risk reassessments in PCC for all 3 residents, create care plan update orders, schedule physician medication reviews, and assign DON Sarah Martinez to verify completion within 48 hours. Staff re-training module on fall documentation will auto-deploy to all CNAs by Friday.',
    impact: 'If uncorrected before survey: F-689 repeat citation at Scope & Severity level G (pattern). 2024 Heritage Oaks F-689 fine was $15,000 — repeat deficiency typically doubles to $30,000+. CMS Civil Money Penalty calculator estimates $22,500-$45,000 range.',
    evidence: [
      { label: 'PCC — Margaret Chen: 3 falls (2/10, 2/24, 3/15), care plan last updated 2/1, no post-fall nursing assessment for 3/15 fall' },
      { label: 'PCC — Robert Kim: 2 falls (1/28, 2/19), Braden score 16 from 1/15 (not reassessed post-fall per policy)' },
      { label: 'PCC — Anna Lopez: 1 fall (3/2), on Trazodone 50mg + Gabapentin 300mg, no medication reconciliation documented' },
      { label: 'CMS Survey History — Heritage Oaks cited F-689 on 4/12/2024, fine $15,000, POC accepted 5/1/2024' },
    ],
  },
  {
    id: 'aud-2', title: 'Infection control documentation gaps — 16 items before survey',
    description: 'The pre-survey readiness scan at Pacific Gardens found 16 documentation gaps in infection control. PCC shows: 12 hand hygiene observation logs missing for February (required weekly per facility policy, only 2 of 4 weeks documented across 3 units), and 4 antibiotic stewardship reviews overdue (residents on >14-day antibiotic courses without 72-hour reassessment). Infection Preventionist Maria Santos has been on FMLA since February 15 — no coverage was assigned. Infection control is CMS\'s #1 focus area in 2026 survey guidance.',
    facility: 'Pacific Gardens', priority: 'High',
    agent: 'Compliance Audit Engine', confidence: 0.88, governanceLevel: 3,
    recommendation: 'Approve documentation sprint: Agent will assign backup IP duties to Charge RN Lisa Wong (who completed IP certification in January), auto-generate hand hygiene observation templates in PCC for the 12 missing logs, and create antibiotic stewardship review orders for the 4 overdue residents. Target: all 16 items completed by Friday March 21.',
    impact: 'CMS 2026 survey guidance lists infection control as Priority #1. Missing IP coverage during FMLA is an Immediate Jeopardy risk factor. F-880/F-881 citations average $28,000 per deficiency. 16 missing items suggest systemic failure — Scope & Severity level F or higher.',
    evidence: [
      { label: 'PCC Infection Control Module — 12 missing hand hygiene logs: A-wing (4), B-wing (4), C-wing (4) for weeks of 2/3, 2/10, 2/17, 2/24' },
      { label: 'PCC Pharmacy — 4 residents on antibiotics >14 days without 72-hour stewardship review: Rm 204, 211, 308, 415' },
      { label: 'Workday HR — Maria Santos (Infection Preventionist) FMLA start 2/15, no backup IP assigned per org chart' },
      { label: 'CMS 2026 Survey Guidance — "Infection Prevention & Control remains the highest priority focus area"' },
    ],
  },
  {
    id: 'aud-3', title: 'Life Safety Code violation — approve emergency repair waiver',
    description: 'B-wing fire alarm panel at Sunrise Senior Living has shown intermittent fault codes for 5 consecutive days. The panel covers 24 resident rooms and 3 common areas. ABC Electric (the only local vendor with Simplex 4100ES parts) cannot perform the repair because their COI expired March 1. Fire watch protocol is active — 2 staff members walking B-wing continuously, costing $480/day ($20/hr x 2 staff x 12 hrs). Maintenance Director Tom Reeves confirmed the fault is in Zone 3 (rooms 301-312), which would delay evacuation notification by approximately 45 seconds in a fire event.',
    facility: 'Sunrise Senior Living', priority: 'Critical',
    agent: 'Compliance Audit Engine', confidence: 0.85, governanceLevel: 4,
    recommendation: 'Approve 72-hour emergency COI waiver limited to WO-2026-018 (fire alarm repair, $18,500) only. Agent will auto-notify ABC Electric of conditional approval, set 72-hour countdown with auto-revocation, and hold remaining work orders (WO-2026-024, WO-2026-031) until full COI renewal. If waiver is denied, approve alternate vendor engagement — next available (Desert Fire Protection) has 5-7 day lead time.',
    impact: 'Current exposure: $480/day fire watch ($2,400 spent to date) + Life Safety Code K-tag violation. Day 7 triggers mandatory state fire marshal notification. 24 residents in affected zone with 45-second evacuation notification delay. Alternate vendor adds $2,880-$3,360 additional fire watch cost during lead time.',
    evidence: [
      { label: 'Fire Alarm System — Simplex 4100ES, Zone 3 fault: intermittent ground fault on SLC Loop 2, rooms 301-312' },
      { label: 'Vendor Records — ABC Electric COI-2025-0234 expired 3/1/2026, renewal confirmed in progress by Gallagher Insurance' },
      { label: 'Fire Watch Log — 5 days active, 2 staff x 12 hrs x $20/hr = $480/day, cumulative $2,400' },
      { label: 'Alternate Vendor Quote — Desert Fire Protection: earliest availability 3/23, quoted $21,200 (14.6% premium)' },
    ],
  },
];

const months = ['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'];
const statusDot = (rate) => rate >= 90 ? 'bg-green-500' : rate >= 75 ? 'bg-orange-500' : 'bg-red-500';
const severityDot = { Critical: 'bg-red-500', High: 'bg-orange-500', Medium: 'bg-yellow-500', Low: 'bg-gray-400' };

/* ─── Modal Views ─── */
function SuccessView({ finding, close }) {
  const writebacks = finding?.pccWritebacks || [];
  const coSignCount = writebacks.filter(w => w.requiresCoSign).length;
  return {
    title: 'Fix Applied',
    content: (
      <div className="flex flex-col items-center py-8">
        <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mb-5"><CheckCircle2 size={28} className="text-green-600" /></div>
        <p className="text-lg font-semibold text-gray-900 mb-2">Documentation Synced to PCC</p>
        <p className="text-sm text-gray-500 mb-6">{writebacks.length} {writebacks.length === 1 ? 'entry' : 'entries'} written successfully</p>
        <div className="w-full space-y-2">{writebacks.map((wb, i) => <div key={i} className="flex items-center gap-3 bg-green-50 border border-green-100 rounded-lg px-4 py-2.5"><CheckCircle2 size={14} className="text-green-600 flex-shrink-0" /><div className="flex-1 min-w-0"><p className="text-xs font-medium text-green-900 truncate">{wb.module} &rarr; {wb.field}</p><p className="text-[11px] text-green-700">{wb.resident} &middot; Room {wb.room}</p></div></div>)}</div>
        {coSignCount > 0 && <div className="mt-4 bg-amber-50 border border-amber-100 rounded-lg px-4 py-2.5 w-full"><p className="text-xs text-amber-800 font-medium">{coSignCount} {coSignCount === 1 ? 'entry requires' : 'entries require'} co-signature — notifications sent.</p></div>}
        <p className="text-xs text-gray-400 mt-4">Audit trail entry #AT-2026-{String(Math.floor(Math.random() * 9000) + 1000).padStart(4, '0')} created</p>
      </div>
    ),
    actions: <ActionButton label="Done" variant="primary" onClick={close} />,
  };
}

function ConfirmView({ finding, open, close }) {
  const actionIcon = { Add: Plus, Update: Pencil, Remove: AlertTriangle };
  const actionColor = { Add: 'text-green-600 bg-green-50', Update: 'text-blue-600 bg-blue-50', Remove: 'text-red-600 bg-red-50' };
  const writebacks = finding.pccWritebacks || [];
  return {
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
    actions: (<><ActionButton label="Go Back" variant="outline" onClick={() => open(FindingDetailView({ finding, open, close }))} /><ActionButton label={`Approve & Write ${writebacks.length} Changes to PCC`} variant="primary" onClick={() => open(SuccessView({ finding, close }))} /></>),
  };
}

function FindingDetailView({ finding, open, close }) {
  return {
    title: finding.title,
    content: (
      <div className="space-y-5">
        <div className="flex items-center gap-2"><span className={`w-2 h-2 rounded-full ${severityDot[finding.severity] || 'bg-gray-400'}`} /><span className="text-sm text-gray-700 font-medium">{finding.severity}</span><span className="text-sm text-gray-400 mx-1">&middot;</span><span className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-lg">{finding.fTag}</span><span className="text-sm text-gray-400 mx-1">&middot;</span><span className="text-xs text-gray-500">{finding.facility}</span></div>
        <p className="text-sm text-gray-700 leading-relaxed">{finding.details}</p>
        {finding.residents && finding.residents.length > 0 && (<div className="bg-gray-50 border border-gray-100 rounded-xl p-4"><p className="text-xs font-medium text-gray-500 mb-2">Affected Residents</p>{finding.residents.map((r, i) => <div key={i} className="flex items-center justify-between py-1.5"><span className="text-sm text-gray-900 font-medium">{r.name} <span className="text-gray-400 font-normal">Room {r.room}</span></span><span className="text-xs text-gray-500">{r.issue}</span></div>)}</div>)}
        <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 space-y-2"><p className="text-xs font-medium text-gray-500 mb-2">Fix Steps</p>{finding.fixSteps.map((step, i) => <div key={i} className="flex items-start gap-3"><span className="text-xs font-bold text-gray-400 mt-0.5 w-5 text-right flex-shrink-0">{i + 1}.</span><span className="text-sm text-gray-700">{step}</span></div>)}</div>
        {finding.pccWritebacks && finding.pccWritebacks.length > 0 && (<div className="bg-gray-50 border border-gray-100 rounded-xl p-4"><p className="text-xs font-medium text-gray-500 mb-2">PCC Write-Back Preview ({finding.pccWritebacks.length} changes)</p><div className="space-y-2">{finding.pccWritebacks.map((wb, i) => <div key={i} className="flex items-center gap-2 text-sm text-gray-700"><span className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0" /><span className="font-medium text-gray-900">{wb.module}</span><span className="text-gray-400">&rarr;</span><span className="truncate">{wb.field}</span></div>)}</div><p className="text-[11px] text-gray-400 mt-2">Full details shown on approval screen</p></div>)}
        <div><p className="text-xs font-medium text-gray-500 mb-1.5">Agent Confidence</p><ConfidenceBar value={finding.agentConfidence} /></div>
      </div>
    ),
    actions: (<><ActionButton label="Dismiss" variant="ghost" onClick={close} /><ActionButton label="Modify" variant="outline" onClick={close} /><ActionButton label="Approve Fix" variant="primary" onClick={() => open(ConfirmView({ finding, open, close }))} /></>),
  };
}

function FindingsListView({ audit, open, close }) {
  const findings = complianceFindings.filter(f => f.auditType === audit.name);
  return {
    title: `${audit.name} — Active Findings`,
    content: (
      <div className="space-y-2">
        {findings.length === 0 && <p className="text-sm text-gray-400 py-8 text-center">No active findings for this audit type.</p>}
        {findings.map(f => (
          <div key={f.id} className="rounded-xl p-4 bg-gray-50 border border-gray-100 hover:bg-white hover:shadow-sm hover:border-gray-200 transition-all cursor-pointer" onClick={() => open(FindingDetailView({ finding: f, open, close }))}>
            <div className="flex items-center gap-2.5"><span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${severityDot[f.severity] || 'bg-gray-400'}`} /><span className="text-sm font-medium text-gray-900 flex-1 min-w-0 truncate">{f.title}</span><ChevronRight size={14} className="text-gray-300 flex-shrink-0" /></div>
            <p className="text-xs text-gray-500 mt-1 ml-4">{f.facility} &middot; {f.detectedAt}</p>
          </div>
        ))}
      </div>
    ),
    actions: <ActionButton label="Close" variant="outline" onClick={close} />,
  };
}

function AuditDetailView({ audit, open, close }) {
  return {
    title: audit.name,
    content: (
      <div className="space-y-6">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="bg-gray-100 text-gray-500 text-xs font-bold px-2.5 py-1 rounded-lg">#{audit.rank}</span>
          <span className="bg-gray-100 text-gray-600 text-xs font-medium px-2.5 py-1 rounded-lg">{audit.fTag}</span>
          <span className="flex items-center gap-1.5 text-xs text-gray-600"><span className={`w-1.5 h-1.5 rounded-full ${severityDot[audit.citationRisk] || 'bg-gray-400'}`} />{audit.citationRisk} Risk</span>
          <span className="ml-auto flex items-center gap-2"><span className={`w-1.5 h-1.5 rounded-full ${statusDot(audit.complianceRate)}`} /><span className="text-3xl font-bold text-gray-900">{audit.complianceRate}%</span></span>
        </div>
        <div className="grid grid-cols-3 gap-3">{[{ val: audit.totalAudited, label: 'Residents Audited' }, { val: audit.findingsCount, label: 'Active Findings' }, { val: `${audit.complianceRate}%`, label: 'Compliance Rate' }].map((s, i) => <div key={i} className="bg-gray-50 border border-gray-100 rounded-xl p-4 text-center"><p className="text-2xl font-bold text-gray-900">{s.val}</p><p className="text-[11px] text-gray-500 mt-0.5">{s.label}</p></div>)}</div>
        <div><p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">6-Month Trend</p><div className="bg-gray-50 border border-gray-100 rounded-xl p-4"><div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${audit.trend.length}, 1fr)`, height: 120 }}>{audit.trend.map((val, i) => <div key={i} className="flex flex-col items-center justify-end"><span className="text-xs font-semibold text-gray-600 mb-1">{val}%</span><div className="w-full flex justify-center" style={{ height: `${val}%` }}><div className="w-full max-w-10 rounded-t-lg bg-blue-500" style={{ height: '100%' }} /></div></div>)}</div><div className="grid gap-2 mt-2" style={{ gridTemplateColumns: `repeat(${audit.trend.length}, 1fr)` }}>{months.map(m => <div key={m} className="text-center text-[11px] text-gray-400">{m}</div>)}</div></div></div>
        <div><p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Regulatory Description</p><p className="text-sm text-gray-700 leading-relaxed">{audit.description}</p></div>
        <div className="bg-gray-50 border border-gray-100 rounded-xl p-5"><p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">What the Agent Checks</p><div className="space-y-2">{audit.agentChecks.map((check, i) => <div key={i} className="flex items-start gap-2.5"><span className="text-gray-400 mt-0.5 flex-shrink-0">&middot;</span><span className="text-sm text-gray-700">{check}</span></div>)}</div></div>
        <div className="bg-gray-50 border border-gray-100 rounded-xl p-5"><p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">What Humans Approve</p><div className="space-y-2">{audit.humanApprovals.map((item, i) => <div key={i} className="flex items-start gap-2.5"><span className="text-gray-400 mt-0.5 flex-shrink-0">&middot;</span><span className="text-sm text-gray-700">{item}</span></div>)}</div></div>
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl p-5 text-white"><div className="flex items-center gap-2 mb-3"><Bot size={15} className="text-blue-200" /><p className="text-xs font-semibold text-blue-200 uppercase tracking-wide">How the Agent Works</p></div><p className="text-sm leading-relaxed text-blue-50">{audit.whatAgentDoes}</p></div>
        <div className="bg-gray-50 border border-gray-100 rounded-xl p-4"><div className="flex items-center gap-3 text-sm text-gray-700"><span className="flex items-center gap-1.5"><span className={`w-1.5 h-1.5 rounded-full ${severityDot[audit.citationRisk] || 'bg-gray-400'}`} />Citation Risk: <span className="font-semibold">{audit.citationRisk}</span></span><span className="text-gray-300">&middot;</span><span>Average Fine: <span className="font-semibold">{audit.avgFineAmount}</span></span></div></div>
      </div>
    ),
    actions: (<><ActionButton label="View Findings" variant="outline" icon={FileText} onClick={() => open(FindingsListView({ audit, open, close }))} /><ActionButton label="Run Audit Now" variant="primary" icon={Play} /></>),
  };
}

/* ─── Page ─── */
export default function AuditLibrary() {
  const { open, close } = useModal();
  const [search, setSearch] = useState('');
  const [activeCategories, setActiveCategories] = useState([]);
  const auditDecisions = useDecisionQueue(AUDIT_DECISIONS);

  const avgCompliance = Math.round(auditTypes.reduce((s, a) => s + a.complianceRate, 0) / auditTypes.length);
  const totalFindings = auditTypes.reduce((s, a) => s + a.findingsCount, 0);
  const belowTarget = auditTypes.filter(a => a.complianceRate < 80).length;

  const filters = auditCategories.map(c => ({ value: c.id, label: c.name, count: auditTypes.filter(a => a.category === c.id).length }));

  const filteredAudits = auditTypes.filter(a => {
    if (activeCategories.length > 0 && !activeCategories.includes(a.category)) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return a.name.toLowerCase().includes(q) || a.fTag.toLowerCase().includes(q);
    }
    return true;
  });

  const stats = [
    { label: 'Total Audit Types', value: '20', icon: Shield, color: 'blue' },
    { label: 'Average Compliance', value: `${avgCompliance}%`, icon: Activity, color: 'blue' },
    { label: 'Findings This Week', value: totalFindings, icon: AlertTriangle, color: 'blue' },
    { label: 'Residents Monitored', value: '658', icon: Users, color: 'blue' },
  ];

  const openAudit = (audit) => open(AuditDetailView({ audit, open, close }));

  return (
    <div className="p-6">
      <PageHeader title="Audit Library" subtitle="20 CMS audit types monitored continuously by AI agents" aiSummary={`All 20 audit types running — ${belowTarget} below 80% compliance target. Average compliance ${avgCompliance}% with ${totalFindings} active findings.`} />

      <AgentSummaryBar agentName="Compliance Audit Engine" summary={`monitoring ${auditTypes.length} audit types across all facilities. ${totalFindings} active findings.`} itemsProcessed={658} exceptionsFound={totalFindings} timeSaved="68 hrs/wk" />

      <div className="mb-6"><StatGrid stats={stats} columns={4} /></div>

      <div className="mb-8">
        <DecisionQueue
          decisions={auditDecisions.decisions}
          onApprove={auditDecisions.approve}
          onOverride={auditDecisions.override}
          onEscalate={auditDecisions.escalate}
          title="Audit Decisions Needed"
          badge={auditDecisions.stats.pending}
        />
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex-1 min-w-0"><SearchInput placeholder="Search audits by name or F-tag..." value={search} onChange={setSearch} /></div>
      </div>
      <div className="mb-8"><QuickFilter filters={filters} active={activeCategories} onChange={setActiveCategories} /></div>

      {auditCategories.filter(c => activeCategories.length === 0 || activeCategories.includes(c.id)).map((category) => {
        const items = filteredAudits.filter(a => a.category === category.id);
        if (items.length === 0) return null;
        return (
          <div key={category.id} className="mb-10">
            <div className="mb-5"><p className="text-lg font-semibold text-gray-900">{category.name}</p><p className="text-sm text-gray-500 mt-0.5">{category.description}</p><div className="h-px bg-gray-200 mt-3" /></div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {items.map((audit) => (
                <div key={audit.id} className="bg-white border border-gray-200 rounded-2xl p-5 cursor-pointer hover:shadow-md transition-all active:scale-[0.99]" onClick={() => openAudit(audit)}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start gap-3 min-w-0"><span className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 text-[11px] font-bold text-gray-500">{audit.rank}</span><div className="min-w-0"><p className="text-sm font-semibold text-gray-900 leading-tight">{audit.name}</p><p className="text-[11px] text-gray-400 mt-0.5">{audit.fTag}</p></div></div>
                    <div className="flex items-center gap-1.5 flex-shrink-0 ml-3"><span className={`w-1.5 h-1.5 rounded-full ${statusDot(audit.complianceRate)}`} /><span className="text-2xl font-bold text-gray-900">{audit.complianceRate}%</span></div>
                  </div>
                  <p className="text-xs text-gray-500 mb-2.5">{audit.totalAudited} audited &middot; {audit.findingsCount} findings &middot; Last: {audit.lastRun}</p>
                  <div className="flex items-center gap-3 text-[11px] text-gray-400">
                    <span className="flex items-center gap-1"><Bot size={12} className="text-gray-400" />Agent: {audit.agentChecks.length} checks</span>
                    <span className="flex items-center gap-1"><User size={12} className="text-gray-400" />Human: {audit.humanApprovals.length} approvals</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
