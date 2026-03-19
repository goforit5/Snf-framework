import { useState } from 'react';
import { Filter, CheckCircle2, XCircle, MessageSquare, ArrowUpCircle, Building2, Clock, Zap, Shield } from 'lucide-react';
import { exceptions } from '../data/mockData';
import { PageHeader, PriorityBadge, ConfidenceBar, ActionButton, EmptyAgentBadge, AgentHumanSplit } from '../components/Widgets';
import { useModal } from '../components/WidgetUtils';
import { AgentSummaryBar } from '../components/AgentComponents';
import { StatGrid } from '../components/DataComponents';
import { DecisionQueue } from '../components/DecisionComponents';
import { useDecisionQueue } from '../hooks/useDecisionQueue';
import { QuickFilter } from '../components/FilterComponents';
import { EmptyState } from '../components/FeedbackComponents';

const FILTER_OPTIONS = [
  { label: 'All', value: 'All' },
  { label: 'Vendor', value: 'Vendor' },
  { label: 'Clinical', value: 'Clinical' },
  { label: 'Payroll', value: 'Payroll' },
  { label: 'Compliance', value: 'Compliance' },
  { label: 'Price Change', value: 'Price Change' },
  { label: 'GL Coding', value: 'GL Coding' },
  { label: 'Insurance', value: 'Insurance' },
];

const typeBadgeColors = {
  Vendor: 'bg-purple-50 text-purple-700 border-purple-200',
  Clinical: 'bg-red-50 text-red-700 border-red-200',
  Payroll: 'bg-blue-50 text-blue-700 border-blue-200',
  Compliance: 'bg-amber-50 text-amber-700 border-amber-200',
  'Price Change': 'bg-orange-50 text-orange-700 border-orange-200',
  'GL Coding': 'bg-cyan-50 text-cyan-700 border-cyan-200',
  Insurance: 'bg-emerald-50 text-emerald-700 border-emerald-200',
};

const exceptionDetails = {
  e1: { analysis: 'MedLine Industries submitted onboarding paperwork including W-9 (EIN verified), Certificate of Insurance (current through Dec 2026), and a signed vendor agreement.', evidence: ['W-9 form (EIN verified via IRS TIN match)', 'Certificate of Insurance — GL $2M, Workers Comp active', 'OFAC/SAM.gov sanctions screening — clean'], policy: 'New vendor onboarding requires W-9 verification, insurance validation, sanctions screening, and signed agreement before first payment.', recommendation: 'Approve onboarding. All required documents verified.' },
  e2: { analysis: 'Sysco increased paper goods category pricing by 18% effective March 1. Contract #2024-0156 Section 4.2 allows maximum 5% annual escalation with 60-day advance notice.', evidence: ['Contract #2024-0156 — Section 4.2 escalation clause (5% max)', 'March invoices showing 18% price increase', '12-month pricing history'], policy: 'Vendor price changes exceeding contract terms must be disputed within 10 business days.', recommendation: 'File formal pricing dispute with Sysco citing Section 4.2.' },
  e3: { analysis: 'Margaret Chen (Room 214B) experienced her third fall in 30 days at 6:22 AM today. Risk score: 92/100. Contributing factors include progressive cognitive decline and polypharmacy.', evidence: ['Incident reports IR-2026-089, IR-2026-067, IR-2026-042', 'Current medication list — 3 fall-risk medications', 'Cognitive assessment from Feb 28 (MMSE: 17)'], policy: 'Three falls in 30 days triggers mandatory care conference within 24 hours.', recommendation: 'Schedule immediate care conference. Notify family. Request physician medication review.' },
  e4: { analysis: 'Night shift CNA overtime at Meadowbrook spiked 340% vs the 4-week trailing average. 3 CNAs called off on March 10.', evidence: ['Timecards TC-8892 through TC-8914', 'Call-off logs for March 10', 'Missed meal break records — 8 employees'], policy: 'Overtime exceeding 200% of rolling average requires administrator review.', recommendation: 'Approve premium pay for meal breaks ($312 — mandatory under state law). Review staffing model.' },
  e5: { analysis: "Sarah Mitchell's RN license #RN-2019-45678 expires March 15. State board portal shows no pending renewal application.", evidence: ['License record #RN-2019-45678', 'State board portal — no renewal found', 'Schedule: 12 shifts March 15-21'], policy: 'Credential expiration within 14 days triggers immediate notification.', recommendation: 'Contact Sarah Mitchell today to confirm renewal status.' },
  e6: { analysis: 'Invoice from ABC Plumbing ($4,200) was auto-coded to Project 2024-RENO which was closed December 31, 2025.', evidence: ['Invoice scan — ABC Plumbing, $4,200', 'Project 2024-RENO closure memo', 'GL account 6200 — Building Maintenance (active)'], policy: 'Invoices cannot be posted to closed project codes.', recommendation: 'Recode to GL 6200 (Building Maintenance).' },
  e7: { analysis: "ABC Electric's Certificate of Insurance expired March 1, 2026. They have 3 active work orders ($45K total).", evidence: ['COI-2025-0234 — expired March 1, 2026', 'Active work orders: WO-2026-018, WO-2026-024, WO-2026-031', 'Auto-notification sent March 2'], policy: 'Vendors with expired insurance must not perform work on-site.', recommendation: 'Escalate to ABC Electric management. Hold all new work.' },
  e8: { analysis: 'Three residents at Bayview show weight loss exceeding 5% in 30 days without documented intervention plans.', evidence: ['Weight logs for 3 residents (5.1%, 6.8%, 7.2% loss)', 'Missing dietary consult documentation'], policy: 'Weight loss exceeding 5% in 30 days requires immediate dietary consult.', recommendation: 'Order immediate dietary consults for all 3 residents.' },
};

const CRITICAL_DECISIONS = [
  {
    id: 'dq-e2', title: 'Sysco contract violation — 18% price increase vs 5% cap',
    description: 'Sysco raised paper goods pricing 18% on March 1 across Heritage Oaks, Meadowbrook, Pacific Gardens, and Bayview. Contract #2024-0156 Section 4.2 caps annual escalation at 5% with 60-day advance notice. No notice was given. At current volume, the overage costs $49,200/year across 4 facilities. Sysco\'s regional rep (Mark Torres) has not responded to the auto-generated inquiry sent March 3.',
    facility: 'Enterprise (4 facilities)', priority: 'Critical',
    agent: 'AP Audit Agent', confidence: 0.96, governanceLevel: 3,
    recommendation: 'Approve formal pricing dispute citing Contract #2024-0156 Section 4.2. Agent will auto-generate dispute letter, freeze Sysco payments above 5% threshold, and escalate to Sysco VP of Accounts if no response within 5 business days.',
    impact: 'If not disputed within 10 business days (deadline: March 14): $49,200/year overpayment becomes contractually accepted. Dispute window closes permanently.',
    evidence: [
      { label: 'Contract #2024-0156 Section 4.2 — 5% max annual escalation, 60-day notice required' },
      { label: 'March invoices: 18% increase on paper goods SKUs (42 line items across 4 facilities)' },
      { label: '12-month pricing history — no prior increases since contract start' },
      { label: 'No advance notice received — Sysco violated notification clause' },
    ],
  },
  {
    id: 'dq-e3', title: 'Margaret Chen — 3rd fall, mandatory care conference within 24 hrs',
    description: 'Margaret Chen, 84, Room 214B, fell at 6:22 AM today — her 3rd fall in 30 days. PCC shows: Braden score 14 (moderate risk), MMSE 17 (moderate cognitive decline), current meds include Ambien 5mg, Gabapentin 300mg, and Lisinopril 10mg — all flagged as fall-risk contributors. Current interventions (bed alarm + non-slip socks) have failed to prevent recurrence. Daughter Jennifer Chen (POA, phone: 702-555-0147) has not been notified of today\'s fall. Pattern: all 3 falls occurred between 5-7 AM, bathroom-related.',
    facility: 'Heritage Oaks', priority: 'Critical',
    agent: 'Clinical Safety Agent', confidence: 0.94, governanceLevel: 3,
    recommendation: 'Approve enhanced fall prevention protocol: add hourly rounding 10PM-7AM, low bed positioning, hip protectors, and 1:1 aide overnight. Request physician review of Ambien (primary contributor per CDC fall-risk guidelines). Agent will schedule IDT care conference for 2 PM today, notify daughter Jennifer, and update PCC care plan automatically.',
    impact: 'Without protocol change: 78% probability of 4th fall within 14 days (based on 3-fall recurrence model). F-689 citation risk during state survey window (opens March 20). Similar cases in CMS database resulted in $22,500 average fine.',
    evidence: [
      { label: 'PCC Fall History — IR-2026-089 (3/15, 6:22AM), IR-2026-067 (2/24, 5:45AM), IR-2026-042 (2/10, 6:10AM)' },
      { label: 'PCC Medications — Ambien 5mg QHS, Gabapentin 300mg TID, Lisinopril 10mg daily (all fall-risk per Beers Criteria)' },
      { label: 'PCC Cognitive Assessment — MMSE 17/30, Braden 14/23, Fall Risk Score 92/100' },
      { label: 'Current interventions: bed alarm (active), non-slip socks (in use) — insufficient per 3-fall threshold' },
    ],
  },
  {
    id: 'dq-e7', title: 'ABC Electric COI expired — $45K in active work orders on hold',
    description: 'ABC Electric\'s Certificate of Insurance expired March 1. They have 3 active work orders totaling $45,000, including the critical B-wing fire alarm panel repair ($18,500). Auto-notification was sent March 2 — no response. Their COI broker (Gallagher Insurance, contact: Lisa Park, 480-555-0312) confirmed renewal is in progress but not yet issued. Without ABC Electric, the fire alarm repair requires a new vendor with 5-7 day lead time, extending the $480/day fire watch.',
    facility: 'Sunrise Senior Living', priority: 'Critical',
    agent: 'Vendor Compliance Agent', confidence: 0.87, governanceLevel: 4,
    recommendation: 'Approve 72-hour emergency COI waiver for fire alarm repair only (WO-2026-018, $18,500). Hold WO-2026-024 and WO-2026-031 until full COI renewal. Agent will notify ABC Electric of conditional approval and set 72-hour auto-expiry on waiver.',
    impact: 'Each day without repair: $480 fire watch cost + unresolved Life Safety Code violation for 24 residents in B-wing. If repair delayed to alternate vendor: additional $2,880-$3,360 in fire watch costs + 5-7 day exposure. State fire marshal notification required at day 7.',
    evidence: [
      { label: 'COI-2025-0234 — expired March 1, 2026. GL coverage: $2M, Workers Comp: lapsed' },
      { label: 'Active work orders: WO-2026-018 ($18,500 fire alarm), WO-2026-024 ($14,200 HVAC), WO-2026-031 ($12,300 electrical)' },
      { label: 'Gallagher Insurance confirmed renewal in progress — ETA 3-5 business days' },
      { label: 'Fire watch log: 5 consecutive days at $480/day = $2,400 spent to date' },
    ],
  },
  {
    id: 'dq-e8', title: 'Bayview — 3 residents with significant weight loss, no dietary consults',
    description: 'PCC weight tracking flagged 3 residents at Bayview with weight loss exceeding 5% in 30 days: Helen Rodriguez (Room 108, 7.2% loss, 142→132 lbs), James Park (Room 215, 6.8% loss, 168→157 lbs), and Dorothy Williams (Room 303, 5.1% loss, 125→119 lbs). None have documented dietary consult orders. Helen\'s loss correlates with new Metformin prescription started February 12. James has documented decreased appetite in nursing notes but no intervention. Dorothy\'s loss is unexplained — no medication changes, no documented illness.',
    facility: 'Bayview', priority: 'High',
    agent: 'Clinical Monitoring Agent', confidence: 0.92, governanceLevel: 2,
    recommendation: 'Approve immediate dietary consult orders for all 3 residents. Agent will auto-generate PCC orders, notify dietary department, and flag for physician review. Priority: Dorothy Williams (unexplained loss requires workup) > Helen Rodriguez (medication correlation) > James Park (appetite decline).',
    impact: 'Unaddressed weight loss >5% triggers F-692 Nutrition citation. With state survey window open, all 3 are high-visibility findings. CMS database shows F-692 average fine of $18,750. Additionally, unexplained weight loss in Dorothy Williams may indicate underlying condition requiring urgent medical evaluation.',
    evidence: [
      { label: 'PCC Weight Logs — Helen Rodriguez: 142→132 lbs (7.2% in 28 days), no dietary consult on file' },
      { label: 'PCC Weight Logs — James Park: 168→157 lbs (6.8% in 30 days), nursing notes cite "decreased appetite" x3 weeks' },
      { label: 'PCC Weight Logs — Dorothy Williams: 125→119 lbs (5.1% in 26 days), no medication changes, no documented illness' },
      { label: 'PCC Medication Review — Helen\'s Metformin 500mg BID started 2/12 (known GI/appetite side effect)' },
    ],
  },
];

export default function ExceptionQueue() {
  const { open } = useModal();
  const [activeFilters, setActiveFilters] = useState(['All']);
  const [selectedIds, setSelectedIds] = useState([]);
  const criticalQueue = useDecisionQueue(CRITICAL_DECISIONS);

  const activeFilter = activeFilters.length === 0 || activeFilters.includes('All') ? 'All' : activeFilters[0];
  const filtered = activeFilter === 'All' ? exceptions : exceptions.filter(e => e.type === activeFilter);
  const pendingCount = exceptions.filter(e => e.status === 'pending').length;
  const criticalCount = exceptions.filter(e => e.priority === 'Critical' && e.status === 'pending').length;
  const safeToApprove = exceptions.filter(e => e.status === 'pending' && e.confidence >= 0.93).length;
  const resolvedToday = exceptions.filter(e => e.status === 'approved').length;

  const filterOptions = FILTER_OPTIONS.map(f => ({
    ...f,
    count: f.value === 'All' ? exceptions.length : exceptions.filter(e => e.type === f.value).length,
  }));

  const summaryStats = [
    { label: 'Pending Review', value: pendingCount, change: `${criticalCount} critical`, changeType: 'negative' },
    { label: 'Safe to Bulk Approve', value: safeToApprove, change: '93%+ confidence', changeType: 'positive', color: 'emerald' },
    { label: 'Resolved Today', value: resolvedToday, change: 'Auto + manual', changeType: 'positive' },
    { label: 'Avg Resolution', value: '4.2h', change: 'Under 6h SLA', changeType: 'positive' },
  ];

  const [_now] = useState(() => Date.now());
  function timeAgo(ts) {
    const diff = _now - new Date(ts).getTime();
    const hours = Math.floor(diff / 3600000);
    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  }

  const toggleSelect = (id) => setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const selectAllSafe = () => setSelectedIds(exceptions.filter(e => e.status === 'pending' && e.confidence >= 0.93).map(e => e.id));

  const openExceptionModal = (exc) => {
    const detail = exceptionDetails[exc.id] || { analysis: exc.details, evidence: ['Agent analysis log'], policy: 'Standard review required', recommendation: 'Review and take appropriate action.' };
    const confidenceColor = exc.confidence >= 0.9 ? 'text-green-600' : exc.confidence >= 0.7 ? 'text-amber-600' : 'text-red-600';
    open({
      title: exc.title,
      content: (
        <div className="space-y-5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold border ${typeBadgeColors[exc.type] || 'bg-gray-50 text-gray-600 border-gray-200'}`}>{exc.type}</span>
            <PriorityBadge priority={exc.priority} />
          </div>
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Agent Confidence</h4>
              <span className={`text-lg font-bold ${confidenceColor}`}>{(exc.confidence * 100).toFixed(0)}%</span>
            </div>
            <ConfidenceBar value={exc.confidence} />
          </div>
          <div>
            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">AI Analysis</h4>
            <p className="text-sm text-gray-700 leading-relaxed">{detail.analysis}</p>
          </div>
          <div>
            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Evidence Chain</h4>
            <div className="space-y-1.5">
              {detail.evidence.map((e, i) => (
                <div key={i} className="flex items-start gap-2 text-sm text-gray-600">
                  <CheckCircle2 size={13} className="text-green-500 flex-shrink-0 mt-0.5" /><span>{e}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5"><Shield size={12} className="text-gray-400" />Policy Rule</h4>
            <p className="text-sm text-gray-700 leading-relaxed">{detail.policy}</p>
          </div>
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
            <h4 className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-2">Agent Recommendation</h4>
            <p className="text-sm text-gray-700 leading-relaxed">{detail.recommendation}</p>
          </div>
        </div>
      ),
      actions: exc.status === 'pending' ? (
        <>
          <ActionButton label="Approve" variant="success" icon={CheckCircle2} />
          <ActionButton label="Reject" variant="danger" icon={XCircle} />
          <ActionButton label="Escalate" variant="primary" icon={ArrowUpCircle} />
          <ActionButton label="Request Info" variant="ghost" icon={MessageSquare} />
        </>
      ) : <ActionButton label="Close" variant="ghost" />,
    });
  };

  return (
    <div className="p-6 max-w-[1600px] mx-auto">
      <PageHeader
        title="Exception Queue"
        subtitle="Ensign Agentic Framework — Human-in-the-Loop Review"
        aiSummary={`${pendingCount} exceptions need review. ${criticalCount} are critical priority. ${safeToApprove} items have agent confidence above 93% and are safe for bulk approval. The Sysco pricing dispute is the highest-impact item, affecting 4 facilities and $49K annually.`}
        riskLevel={criticalCount > 0 ? 'high' : 'medium'}
      />

      <AgentSummaryBar
        agentName="Escalation Manager"
        summary={`routed ${pendingCount} exceptions for human review. ${safeToApprove} safe for bulk approval at 93%+ confidence.`}
        itemsProcessed={1750}
        exceptionsFound={pendingCount}
        timeSaved="2.4 hrs"
      />

      <div className="mb-6">
        <AgentHumanSplit agentCount={1750} humanCount={pendingCount} agentLabel="Auto-Resolved by Agents" humanLabel="Flagged for Your Review" />
      </div>

      <div className="mb-6">
        <StatGrid stats={summaryStats} columns={4} />
      </div>

      {criticalQueue.stats.pending > 0 && (
        <div className="mb-6">
          <DecisionQueue
            decisions={criticalQueue.decisions}
            onApprove={criticalQueue.approve}
            onOverride={criticalQueue.override}
            onEscalate={criticalQueue.escalate}
            title="Critical Exceptions — Decide Now"
            badge={criticalQueue.stats.pending}
          />
        </div>
      )}

      {safeToApprove > 0 && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-green-100 flex items-center justify-center"><Zap size={16} className="text-green-600" /></div>
            <div>
              <p className="text-sm font-semibold text-gray-900">{safeToApprove} items ready for bulk approval</p>
              <p className="text-xs text-gray-500">Agent confidence above 93% — all policy checks passed</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ActionButton label="Select All Safe" variant="outline" onClick={selectAllSafe} />
            <ActionButton label={`Approve ${selectedIds.length > 0 ? selectedIds.length : safeToApprove} Items`} variant="success" icon={CheckCircle2} />
          </div>
        </div>
      )}

      <div className="mb-6">
        <QuickFilter filters={filterOptions} active={activeFilters} onChange={(vals) => setActiveFilters(vals.length === 0 ? ['All'] : vals.filter(v => v !== 'All').length > 0 ? vals.filter(v => v !== 'All') : ['All'])} />
      </div>

      <div className="space-y-3">
        {filtered.map((exc) => {
          const confidenceColor = exc.confidence >= 0.9 ? 'text-green-600' : exc.confidence >= 0.7 ? 'text-amber-600' : 'text-red-600';
          return (
            <div key={exc.id} onClick={() => openExceptionModal(exc)} className={`bg-white border rounded-2xl p-5 transition-all cursor-pointer active:scale-[0.995] hover:shadow-md ${exc.priority === 'Critical' ? 'border-red-200 hover:border-red-300' : 'border-gray-100 hover:border-gray-200'}`}>
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold border ${typeBadgeColors[exc.type] || 'bg-gray-50 text-gray-600 border-gray-200'}`}>{exc.type}</span>
                    <PriorityBadge priority={exc.priority} />
                    {exc.status === 'approved' && <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-green-50 text-green-700 border border-green-200">Approved</span>}
                  </div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-1">{exc.title}</h3>
                  <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">{exc.details}</p>
                </div>
                <div className="flex-shrink-0 text-right">
                  <span className={`text-lg font-bold ${confidenceColor}`}>{(exc.confidence * 100).toFixed(0)}%</span>
                  <p className="text-[10px] text-gray-400">confidence</p>
                </div>
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                    <input type="checkbox" checked={selectedIds.includes(exc.id)} onChange={() => toggleSelect(exc.id)} className="w-4 h-4 rounded-md border-gray-300 text-blue-600 focus:ring-blue-500/20 cursor-pointer" />
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-gray-400"><Building2 size={11} /><span>{exc.facility}</span></div>
                  <EmptyAgentBadge agent={exc.agent} />
                  <div className="flex items-center gap-1 text-[11px] text-gray-400"><Clock size={11} /><span>{timeAgo(exc.timestamp)}</span></div>
                </div>
                {exc.status === 'pending' && (
                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <ActionButton label="Approve" variant="success" onClick={() => openExceptionModal(exc)} />
                    <ActionButton label="Reject" variant="danger" onClick={() => openExceptionModal(exc)} />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <EmptyState icon={Filter} title="No exceptions match this filter" description="Try selecting a different category above" />
      )}
    </div>
  );
}
