import { useState } from 'react';
import { Filter, CheckCircle2, XCircle, MessageSquare, ArrowUpCircle, Bot, Building2, Clock, ShieldCheck, AlertTriangle, Zap, ChevronRight, FileText, Shield } from 'lucide-react';
import { exceptions } from '../data/mockData';
import { PageHeader, Card, PriorityBadge, ConfidenceBar, ActionButton, EmptyAgentBadge, AgentHumanSplit, SectionLabel, useModal } from '../components/Widgets';

const FILTER_TABS = ['All', 'Vendor', 'Clinical', 'Payroll', 'Compliance', 'Price Change', 'GL Coding', 'Insurance'];

const typeBadgeColors = {
  Vendor: 'bg-purple-50 text-purple-700 border-purple-200',
  Clinical: 'bg-red-50 text-red-700 border-red-200',
  Payroll: 'bg-blue-50 text-blue-700 border-blue-200',
  Compliance: 'bg-amber-50 text-amber-700 border-amber-200',
  'Price Change': 'bg-orange-50 text-orange-700 border-orange-200',
  'GL Coding': 'bg-cyan-50 text-cyan-700 border-cyan-200',
  Insurance: 'bg-emerald-50 text-emerald-700 border-emerald-200',
};

// Enriched exception data for modals
const exceptionDetails = {
  e1: {
    analysis: 'MedLine Industries submitted onboarding paperwork including W-9 (EIN verified), Certificate of Insurance (current through Dec 2026), and a signed vendor agreement. OFAC sanctions screening returned clean. Dun & Bradstreet credit score: 82/100.',
    evidence: ['W-9 form (EIN verified via IRS TIN match)', 'Certificate of Insurance — GL $2M, Workers Comp active', 'OFAC/SAM.gov sanctions screening — clean', 'Signed vendor agreement'],
    policy: 'New vendor onboarding requires W-9 verification, insurance validation, sanctions screening, and signed agreement before first payment.',
    recommendation: 'Approve onboarding. All required documents verified. MedLine is a nationally recognized medical supply vendor with strong financial standing.',
  },
  e2: {
    analysis: 'Sysco increased paper goods category pricing by 18% effective March 1. Contract #2024-0156 Section 4.2 allows maximum 5% annual escalation with 60-day advance notice. No advance notice was provided. This affects 4 facilities with combined monthly paper goods spend of $34,200. At 18%, this represents $4,100/month in excess charges ($49,200/year).',
    evidence: ['Contract #2024-0156 — Section 4.2 escalation clause (5% max)', 'March invoices showing 18% price increase', '12-month pricing history showing no prior escalation', 'No advance notice letter on file'],
    policy: 'Vendor price changes exceeding contract terms must be disputed within 10 business days. Procurement Agent must file formal dispute and initiate backup vendor evaluation.',
    recommendation: 'File formal pricing dispute with Sysco citing Section 4.2. Demand rollback to contracted rates plus maximum 5% escalation. If unresolved in 5 business days, activate backup quotes from Medline and Cardinal Health.',
  },
  e3: {
    analysis: 'Margaret Chen (Room 214B) experienced her third fall in 30 days at 6:22 AM today. Risk score: 92/100 (highest in portfolio). Contributing factors include progressive cognitive decline (MMSE dropped from 22 to 17 in 60 days), polypharmacy (12 medications including 3 fall-risk drugs), and recent UTI diagnosed Feb 28. Post-fall assessment for this incident is not yet complete.',
    evidence: ['Incident reports IR-2026-089, IR-2026-067, IR-2026-042', 'Current medication list — 3 fall-risk medications identified', 'Cognitive assessment from Feb 28 (MMSE: 17)', 'UTI diagnosis and treatment record'],
    policy: 'Three falls in 30 days triggers mandatory care conference within 24 hours, physician notification, family notification (if POA on file), and medication review. F-689 compliance requires documented intervention plan.',
    recommendation: 'Schedule immediate care conference. Notify family (daughter Jennifer Chen, POA). Request physician medication review focusing on fall-risk drugs. Implement 1:1 observation during high-risk hours (2-6 AM). Complete post-fall assessment within 2 hours.',
  },
  e4: {
    analysis: 'Night shift CNA overtime at Meadowbrook spiked 340% vs the 4-week trailing average. Root cause: 3 CNAs called off on March 10, triggering agency fills at 1.8x standard rates. Total agency cost for the night: $2,400 (vs ~$600 normal). Additionally, 8 employees worked through lunch breaks, triggering $312 in premium pay under state labor law.',
    evidence: ['Timecards TC-8892 through TC-8914', 'Call-off logs for March 10', 'Agency billing at 1.8x rate', 'Missed meal break records — 8 employees'],
    policy: 'Overtime exceeding 200% of rolling average requires administrator review. Agency fills exceeding budget require DON + administrator approval within 48 hours.',
    recommendation: 'Approve premium pay for meal breaks ($312 — mandatory under state law). Review staffing model for night shift CNAs to reduce call-off reliance on agency. Consider implementing a float pool or incentive pay for night shift coverage.',
  },
  e5: {
    analysis: 'Sarah Mitchell\'s RN license #RN-2019-45678 expires March 15 — 4 days from now. State board portal shows no pending renewal application. She has 12 shifts scheduled March 15-21. If her license lapses, all shifts require coverage. Agency RN cost for 12 shifts: approximately $4,800.',
    evidence: ['License record #RN-2019-45678 — expiry March 15, 2026', 'State board portal — no renewal application found', 'Schedule: 12 shifts March 15-21', 'Agency rate comparison: $400/shift vs $250 internal'],
    policy: 'Credential expiration within 14 days triggers immediate notification to employee and DON. Working on expired credentials is a state regulatory violation and survey deficiency.',
    recommendation: 'Contact Sarah Mitchell today to confirm renewal status. If renewal not in progress, begin shift reassignment by March 13. Notify DON at Sunrise Senior Living. Document all actions for compliance file.',
  },
  e6: {
    analysis: 'Invoice from ABC Plumbing ($4,200) was auto-coded to Project 2024-RENO which was closed December 31, 2025. The work described on the invoice (bathroom fixture repair) is routine maintenance, not renovation. GL Agent recommends recoding to account 6200 (Building Maintenance).',
    evidence: ['Invoice scan — ABC Plumbing, $4,200', 'Project 2024-RENO closure memo (Dec 31, 2025)', 'GL account 6200 — Building Maintenance (active)', 'Work order WO-2026-0142 — bathroom fixture repair'],
    policy: 'Invoices cannot be posted to closed project codes. GL exceptions must be resolved within 3 business days to avoid aging delays.',
    recommendation: 'Recode from Project 2024-RENO to GL 6200 (Building Maintenance). The work is clearly routine maintenance per the work order description. No further review needed.',
  },
  e7: {
    analysis: 'ABC Electric\'s Certificate of Insurance expired March 1, 2026. They have 3 active work orders at Heritage Oaks ($45K total) and 2 open invoices ($12,800). Vendor Compliance Agent automatically placed a hold on new work orders and sent a renewal reminder to the vendor on March 2.',
    evidence: ['COI-2025-0234 — expired March 1, 2026', 'Active work orders: WO-2026-018, WO-2026-024, WO-2026-031', 'Open invoices: INV-4401 ($7,200), INV-4418 ($5,600)', 'Auto-notification sent March 2 — no response'],
    policy: 'Vendors with expired insurance must not perform work on-site. Existing invoices may be paid but new work orders are held until valid COI is received.',
    recommendation: 'Escalate to ABC Electric management — they have not responded to the auto-notification. Hold all new work. Existing invoices can be paid per policy. If COI not received by March 14, begin sourcing replacement electrician.',
  },
  e8: {
    analysis: 'Three residents at Bayview Rehabilitation show weight loss exceeding 5% in 30 days without documented intervention plans. This represents an F-692 (Nutrition/Hydration) risk. All three are on the clinical monitoring watchlist. Dietary consults have not been documented.',
    evidence: ['Weight logs for 3 residents (5.1%, 6.8%, 7.2% loss)', 'Missing dietary consult documentation', 'F-692 regulatory guidance — requires documented intervention', 'Clinical monitoring alerts from Feb 15, Feb 22, Mar 1'],
    policy: 'Weight loss exceeding 5% in 30 days without documented intervention plan is a potential F-692 citation. Requires immediate dietary consult, physician notification, and documented care plan update.',
    recommendation: 'Order immediate dietary consults for all 3 residents. Notify attending physicians. Update care plans with weight monitoring frequency and nutritional interventions. Document all actions to establish survey-ready trail.',
  },
  e9: {
    analysis: 'DON at Pacific Gardens requested surgical supply catalog addition. Procurement Agent identified comparable items from contracted vendor (Medline) at 12% lower cost. Auto-approved with contracted vendor substitution.',
    evidence: ['DON request form', 'Medline catalog comparison — 12% savings', 'Existing contract pricing schedule'],
    policy: 'New item requests under $10K with contracted vendor alternatives may be auto-approved with cost-effective substitution.',
    recommendation: 'Already approved. Contracted vendor alternative saves 12% annually on this category.',
  },
  e10: {
    analysis: '8 employees at Sunrise Senior Living worked through their lunch breaks on March 10 per time records. State labor law requires premium pay of 1 hour at regular rate for each missed meal break. Total estimated premium: $312.',
    evidence: ['Time records for 8 employees — March 10', 'State labor code section on meal break premium', 'Payroll calculation: 8 x avg $39/hr = $312'],
    policy: 'Missed meal breaks on shifts exceeding 6 hours require premium pay per state labor law. Payroll Agent flags automatically when no break is clocked within required window.',
    recommendation: 'Approve $312 premium pay — this is a legal requirement, not discretionary. Flag to Sunrise administrator for root cause review (staffing levels during lunch coverage).',
  },
};

export default function ExceptionQueue() {
  const { open } = useModal();
  const [activeFilter, setActiveFilter] = useState('All');
  const [selectedIds, setSelectedIds] = useState([]);

  const filtered = activeFilter === 'All'
    ? exceptions
    : exceptions.filter(e => e.type === activeFilter);

  const pendingCount = exceptions.filter(e => e.status === 'pending').length;
  const criticalCount = exceptions.filter(e => e.priority === 'Critical' && e.status === 'pending').length;
  const safeToApprove = exceptions.filter(e => e.status === 'pending' && e.confidence >= 0.93).length;
  const resolvedToday = exceptions.filter(e => e.status === 'approved').length;

  const filterCounts = FILTER_TABS.reduce((acc, tab) => {
    acc[tab] = tab === 'All' ? exceptions.length : exceptions.filter(e => e.type === tab).length;
    return acc;
  }, {});

  const toggleSelect = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const selectAllSafe = () => {
    const safeIds = exceptions
      .filter(e => e.status === 'pending' && e.confidence >= 0.93)
      .map(e => e.id);
    setSelectedIds(safeIds);
  };

  function formatTime(ts) {
    const d = new Date(ts);
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  }

  function timeAgo(ts) {
    const diff = Date.now() - new Date(ts).getTime();
    const hours = Math.floor(diff / 3600000);
    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  }

  const openExceptionModal = (exc) => {
    const detail = exceptionDetails[exc.id] || {
      analysis: exc.details,
      evidence: ['Agent analysis log'],
      policy: 'Standard review required',
      recommendation: 'Review and take appropriate action.',
    };
    const confidenceColor = exc.confidence >= 0.9 ? 'text-green-600' : exc.confidence >= 0.7 ? 'text-amber-600' : 'text-red-600';

    open({
      title: exc.title,
      content: (
        <div className="space-y-5">
          {/* Header badges */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold border ${typeBadgeColors[exc.type] || 'bg-gray-50 text-gray-600 border-gray-200'}`}>
              {exc.type}
            </span>
            <PriorityBadge priority={exc.priority} />
            {exc.status === 'approved' && (
              <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-green-50 text-green-700 border border-green-200">
                Approved
              </span>
            )}
            <span className="text-xs text-gray-400 ml-auto">{formatTime(exc.timestamp)}</span>
          </div>

          {/* Facility & Agent */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <Building2 size={12} className="text-gray-400" />
              {exc.facility}
            </div>
            <EmptyAgentBadge agent={exc.agent} />
          </div>

          {/* Confidence Score */}
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Agent Confidence</h4>
              <span className={`text-lg font-bold ${confidenceColor}`}>{(exc.confidence * 100).toFixed(0)}%</span>
            </div>
            <ConfidenceBar value={exc.confidence} />
            <p className="text-[11px] text-gray-400 mt-2">
              {exc.confidence >= 0.93
                ? 'High confidence — safe for approval based on policy match'
                : exc.confidence >= 0.7
                ? 'Moderate confidence — human review recommended'
                : 'Low confidence — requires careful manual review'
              }
            </p>
          </div>

          {/* AI Analysis */}
          <div>
            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">AI Analysis</h4>
            <p className="text-sm text-gray-700 leading-relaxed">{detail.analysis}</p>
          </div>

          {/* Evidence Chain */}
          <div>
            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Evidence Chain</h4>
            <div className="space-y-1.5">
              {detail.evidence.map((e, i) => (
                <div key={i} className="flex items-start gap-2 text-sm text-gray-600">
                  <CheckCircle2 size={13} className="text-green-500 flex-shrink-0 mt-0.5" />
                  <span>{e}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Policy Rule */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Shield size={12} className="text-gray-400" />
              Policy Rule
            </h4>
            <p className="text-sm text-gray-700 leading-relaxed">{detail.policy}</p>
          </div>

          {/* Recommendation */}
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
      ) : (
        <ActionButton label="Close" variant="ghost" />
      ),
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

      {/* Agent vs Human context */}
      <div className="mb-6">
        <AgentHumanSplit
          agentCount={1750}
          humanCount={pendingCount}
          agentLabel="Auto-Resolved by Agents"
          humanLabel="Flagged for Your Review"
        />
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <p className="text-xs text-gray-500 font-medium mb-1">Pending Review</p>
          <p className="text-2xl font-bold text-gray-900">{pendingCount}</p>
          <p className="text-xs text-amber-600 font-medium mt-1">{criticalCount} critical</p>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <p className="text-xs text-gray-500 font-medium mb-1">Safe to Bulk Approve</p>
          <p className="text-2xl font-bold text-green-600">{safeToApprove}</p>
          <p className="text-xs text-gray-400 font-medium mt-1">93%+ confidence</p>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <p className="text-xs text-gray-500 font-medium mb-1">Resolved Today</p>
          <p className="text-2xl font-bold text-gray-900">{resolvedToday}</p>
          <p className="text-xs text-green-600 font-medium mt-1">Auto + manual</p>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <p className="text-xs text-gray-500 font-medium mb-1">Avg Resolution</p>
          <p className="text-2xl font-bold text-gray-900">4.2h</p>
          <p className="text-xs text-green-600 font-medium mt-1">Under 6h SLA</p>
        </div>
      </div>

      {/* Bulk Action Bar */}
      {safeToApprove > 0 && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-green-100 flex items-center justify-center">
              <Zap size={16} className="text-green-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">
                {safeToApprove} items ready for bulk approval
              </p>
              <p className="text-xs text-gray-500">
                Agent confidence above 93% — all policy checks passed
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ActionButton
              label="Select All Safe"
              variant="outline"
              onClick={selectAllSafe}
            />
            <ActionButton
              label={`Approve ${selectedIds.length > 0 ? selectedIds.length : safeToApprove} Items`}
              variant="success"
              icon={CheckCircle2}
            />
          </div>
        </div>
      )}

      {/* Filter Tabs — Apple segmented control style */}
      <div className="flex items-center gap-1.5 mb-6 overflow-x-auto pb-2 bg-gray-100 rounded-xl p-1.5">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveFilter(tab)}
            className={`px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              activeFilter === tab
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            {tab}
            {filterCounts[tab] > 0 && (
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                activeFilter === tab ? 'bg-blue-100 text-blue-600' : 'bg-gray-200 text-gray-500'
              }`}>
                {filterCounts[tab]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Exception Cards */}
      <div className="space-y-3">
        {filtered.map((exc) => {
          const confidenceColor = exc.confidence >= 0.9 ? 'text-green-600' : exc.confidence >= 0.7 ? 'text-amber-600' : 'text-red-600';

          return (
            <div
              key={exc.id}
              onClick={() => openExceptionModal(exc)}
              className={`bg-white border rounded-2xl p-5 transition-all cursor-pointer active:scale-[0.995] hover:shadow-md ${
                exc.priority === 'Critical'
                  ? 'border-red-200 hover:border-red-300'
                  : 'border-gray-100 hover:border-gray-200'
              }`}
            >
              {/* Top Row */}
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold border ${typeBadgeColors[exc.type] || 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                      {exc.type}
                    </span>
                    <PriorityBadge priority={exc.priority} />
                    {exc.status === 'approved' && (
                      <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-green-50 text-green-700 border border-green-200">
                        Approved
                      </span>
                    )}
                  </div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-1">{exc.title}</h3>
                  <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">{exc.details}</p>
                </div>
                <div className="flex-shrink-0 flex items-center gap-3">
                  <div className="text-right">
                    <span className={`text-lg font-bold ${confidenceColor}`}>{(exc.confidence * 100).toFixed(0)}%</span>
                    <p className="text-[10px] text-gray-400">confidence</p>
                  </div>
                  <ChevronRight size={16} className="text-gray-300" />
                </div>
              </div>

              {/* Bottom Row */}
              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(exc.id)}
                      onChange={() => toggleSelect(exc.id)}
                      className="w-4 h-4 rounded-md border-gray-300 text-blue-600 focus:ring-blue-500/20 cursor-pointer"
                    />
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-gray-400">
                    <Building2 size={11} />
                    <span>{exc.facility}</span>
                  </div>
                  <EmptyAgentBadge agent={exc.agent} />
                  <div className="flex items-center gap-1 text-[11px] text-gray-400">
                    <Clock size={11} />
                    <span>{timeAgo(exc.timestamp)}</span>
                  </div>
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
        <div className="text-center py-20">
          <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <Filter size={24} className="text-gray-400" />
          </div>
          <p className="text-sm font-medium text-gray-700 mb-1">No exceptions match this filter</p>
          <p className="text-xs text-gray-400">Try selecting a different category above</p>
        </div>
      )}
    </div>
  );
}
