import { useState, useMemo } from 'react';
import { Briefcase, DollarSign, Heart, Building2, MapPin } from 'lucide-react';
import { PageHeader } from '../components/Widgets';
import { AgentSummaryBar } from '../components/AgentComponents';
import { DecisionQueue } from '../components/DecisionComponents';
import { useDecisionQueue } from '../hooks/useDecisionQueue';
import { useModal } from '../components/WidgetUtils';
import { useAuth } from '../hooks/useAuth';
import CEOBriefing from '../components/standup/CEOBriefing';
import CFOBriefing from '../components/standup/CFOBriefing';
import DONBriefing from '../components/standup/DONBriefing';
import AdminBriefing from '../components/standup/AdminBriefing';
import RegionalBriefing from '../components/standup/RegionalBriefing';

const ROLES = [
  { key: 'ceo', label: 'CEO', icon: Briefcase },
  { key: 'cfo', label: 'CFO', icon: DollarSign },
  { key: 'don', label: 'DON', icon: Heart },
  { key: 'administrator', label: 'Administrator', icon: Building2 },
  { key: 'regional-director', label: 'Regional VP', icon: MapPin },
];

const AGENT_SUMMARIES = {
  ceo: { agentName: 'Executive Briefing Agent', summary: 'Enterprise-wide overnight analysis complete. 8 facilities monitored, 729 beds managed. 2 strategic alerts, 1 M&A update, and 4 operational items requiring attention.', itemsProcessed: 2840, exceptionsFound: 6, timeSaved: '2.1 hrs' },
  cfo: { agentName: 'Financial Briefing Agent', summary: 'Overnight financial scan across 8 facilities. 6 billing exceptions, 2 denied claims approaching appeal deadline, and month-end close at 68%.', itemsProcessed: 1420, exceptionsFound: 8, timeSaved: '1.8 hrs' },
  don: { agentName: 'Clinical Briefing Agent', summary: 'Clinical monitoring scan complete across all residents. 3 open incidents, 2 compliance alerts, staffing coverage at 87% with 3 gaps requiring action.', itemsProcessed: 540, exceptionsFound: 5, timeSaved: '45 min' },
  administrator: { agentName: 'Facility Briefing Agent', summary: 'Las Vegas Desert Springs overnight review. Census 94/100 with 2 admissions and 3 discharges expected. 4 critical items, 2 staffing gaps, fire panel issue ongoing.', itemsProcessed: 340, exceptionsFound: 4, timeSaved: '35 min' },
  'regional-director': { agentName: 'Regional Briefing Agent', summary: 'Southwest region overnight review. 3 facilities, 295 beds, avg occupancy 89.8%. Las Vegas Desert Springs flagged for staffing and compliance concerns.', itemsProcessed: 1120, exceptionsFound: 7, timeSaved: '1.2 hrs' },
};

const MORNING_DECISIONS = [
  {
    id: 'ms-1', title: 'B-wing fire alarm — approve emergency vendor COI waiver',
    description: 'The Simplex 4100ES fire panel in B-wing has shown Zone 3 ground faults for 5 straight days, affecting rooms 301-312 (24 residents). ABC Electric is the only local vendor with Simplex parts in stock, but their COI lapsed March 1. Their broker Gallagher Insurance confirmed renewal is in process (3-5 business days). Two staff members have been walking continuous fire watch since March 10 at $480/day — $2,400 spent so far. Maintenance Director Tom Reeves reports the fault would delay evacuation notification by ~45 seconds in a fire event. The next-closest vendor (Desert Fire Protection) has 5-7 day lead time and quoted $21,200 (vs ABC\'s $18,500).',
    facility: 'Sunrise Senior Living', priority: 'Critical',
    agent: 'Facility Briefing Agent', confidence: 0.87, governanceLevel: 4,
    recommendation: 'Approve 72-hour emergency COI waiver for fire alarm repair only (WO-2026-018, $18,500). Agent will auto-notify ABC Electric, set 72-hour auto-expiry, and hold all other ABC work orders until full COI renewal. If denied, approve Desert Fire Protection at $21,200 with 5-7 day lead time.',
    impact: 'Every additional day: $480 fire watch + Life Safety Code K-tag violation exposure for 24 residents. Day 7 (March 17) triggers mandatory state fire marshal notification. Alternate vendor route adds $2,880-$3,360 in fire watch costs during lead time plus $2,700 vendor premium.',
    evidence: [
      { label: 'Fire Alarm System — Zone 3 ground fault on SLC Loop 2, rooms 301-312, fault log: 5 consecutive days' },
      { label: 'Vendor — ABC Electric COI expired 3/1, Gallagher Insurance confirms renewal ETA 3-5 business days' },
      { label: 'Fire Watch — 2 staff x 12 hrs x $20/hr = $480/day, 5 days = $2,400 cumulative' },
      { label: 'Alternate Quote — Desert Fire Protection: $21,200, earliest 3/23, no Simplex parts in stock (must order)' },
    ],
  },
  {
    id: 'ms-2', title: 'Margaret Chen 3rd fall — approve enhanced protocol + med review',
    description: 'Margaret Chen, 84, Room 214B at Heritage Oaks, fell at 6:22 AM today — her 3rd fall in 30 days. PCC shows all 3 falls were nocturnal (5-7 AM), bathroom-related. Her Braden score is 14 (moderate risk), MMSE is 17 (moderate cognitive decline). She\'s on Ambien 5mg QHS, Gabapentin 300mg TID, and Lisinopril 10mg daily — all flagged as fall-risk contributors per Beers Criteria. Current interventions (bed alarm + non-slip socks) clearly aren\'t working. Her daughter Jennifer Chen (POA, 702-555-0147) hasn\'t been notified of today\'s incident yet. State survey window opens in 5 days.',
    facility: 'Heritage Oaks', priority: 'Critical',
    agent: 'Clinical Briefing Agent', confidence: 0.94, governanceLevel: 2,
    recommendation: 'Approve enhanced fall prevention: hourly rounding 10PM-7AM, low bed positioning, bilateral hip protectors, and 1:1 aide 10PM-6AM ($240/night). Agent will auto-order physician medication review (priority: Ambien discontinuation), schedule IDT care conference for 2 PM today, call Jennifer Chen at 702-555-0147, and update PCC care plan with all interventions.',
    impact: 'Without protocol change: 78% probability of 4th fall within 14 days (3-fall recurrence model). Heritage Oaks was cited F-689 in 2024 ($15,000) — a repeat citation during survey window (opens 3/20) would be Scope & Severity G, estimated fine $22,500-$45,000. 1:1 aide cost: $240/night x 14 days = $3,360 vs potential $45,000 fine.',
    evidence: [
      { label: 'PCC Falls — IR-2026-089 (3/15, 6:22AM bathroom), IR-2026-067 (2/24, 5:45AM bathroom), IR-2026-042 (2/10, 6:10AM bathroom)' },
      { label: 'PCC Meds — Ambien 5mg QHS, Gabapentin 300mg TID, Lisinopril 10mg daily — all Beers Criteria fall-risk' },
      { label: 'PCC Assessments — Braden 14/23, MMSE 17/30, Fall Risk Score 92/100, current interventions: bed alarm + non-slip socks' },
      { label: 'CMS History — Heritage Oaks F-689 citation 4/12/2024, $15,000 fine. Repeat deficiency multiplier applies.' },
    ],
  },
  {
    id: 'ms-3', title: 'Night shift CNA vacancy — authorize agency at 1.5x rate',
    description: 'CNA Maria Gonzalez called off tonight\'s night shift (11PM-7AM) at Las Vegas Desert Springs — third no-call/no-show this month. Workday shows no internal float CNAs available (all 4 float pool members already assigned). Agency vendor StaffBridge has one CNA available (Lisa Tran, 2 years SNF experience, last worked Desert Springs in January) at $42/hr (1.5x the $28/hr base rate). Current night census is 94 residents. State minimum CNA ratio is 1:12 — without this fill, the facility drops to 1:15.7, a direct staffing violation.',
    facility: 'Las Vegas Desert Springs', priority: 'High',
    agent: 'Workforce Briefing Agent', confidence: 0.91, governanceLevel: 2,
    recommendation: 'Authorize agency CNA Lisa Tran via StaffBridge at $42/hr for tonight\'s 8-hour shift ($336 total). Agent will auto-confirm booking, send facility orientation packet, and file corrective action for Maria Gonzalez (3rd NCNS triggers written warning per Workday policy HR-204). Agent will also flag this vacancy for permanent recruitment — this position has been open 25 days.',
    impact: 'Without fill: facility at 1:15.7 CNA ratio vs 1:12 state minimum. Direct staffing violation if surveyed = Immediate Jeopardy finding (most severe CMS category). Agency cost: $336 for one shift ($112 premium over base). The position has been open 25 days — Workday shows 3 applicants in pipeline, none past phone screen.',
    evidence: [
      { label: 'Workday Scheduling — Maria Gonzalez NCNS tonight (3rd this month: 3/3, 3/9, 3/15). No float pool available.' },
      { label: 'StaffBridge Agency — Lisa Tran, CNA, available tonight 11PM-7AM, $42/hr, last at Desert Springs 1/22/2026' },
      { label: 'Staffing Ratios — Night census 94, current CNAs on shift: 6. With fill: 1:13.4. Without: 1:15.7 (violation at 1:12)' },
      { label: 'Workday Recruiting — Night CNA position open 25 days, 3 applicants, 0 past phone screen. Avg time-to-fill: 18 days.' },
    ],
  },
];

export default function MorningStandup() {
  const { open } = useModal();
  const { user } = useAuth();

  const roleFromAuth = useMemo(() => {
    if (!user?.role) return 'administrator';
    const mapping = { ceo: 'ceo', cfo: 'cfo', cmo: 'don', don: 'don', 'regional-director': 'regional-director', administrator: 'administrator' };
    return mapping[user.role] || 'administrator';
  }, [user?.role]);

  const [selectedRole, setSelectedRole] = useState(roleFromAuth);
  const morningQueue = useDecisionQueue(MORNING_DECISIONS);

  const agentSummary = AGENT_SUMMARIES[selectedRole] || AGENT_SUMMARIES.administrator;

  const briefingContent = useMemo(() => {
    switch (selectedRole) {
      case 'ceo': return <CEOBriefing open={open} />;
      case 'cfo': return <CFOBriefing open={open} />;
      case 'don': return <DONBriefing open={open} />;
      case 'regional-director': return <RegionalBriefing open={open} />;
      case 'administrator':
      default: return <AdminBriefing open={open} />;
    }
  }, [selectedRole, open]);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <PageHeader
        title="Morning Briefing"
        subtitle={`${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })} — Auto-generated for ${ROLES.find(r => r.key === selectedRole)?.label || 'Administrator'}`}
      />

      {/* Role Selector */}
      <div className="flex items-center gap-2 mb-5 flex-wrap">
        {ROLES.map(role => {
          const Icon = role.icon;
          const isActive = selectedRole === role.key;
          return (
            <button
              key={role.key}
              onClick={() => setSelectedRole(role.key)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                isActive
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Icon size={14} />
              {role.label}
            </button>
          );
        })}
      </div>

      <AgentSummaryBar {...agentSummary} />

      {morningQueue.stats.pending > 0 && (
        <div className="mb-6">
          <DecisionQueue
            decisions={morningQueue.decisions}
            onApprove={morningQueue.approve}
            onOverride={morningQueue.override}
            onEscalate={morningQueue.escalate}
            title="Morning Priority Decisions"
            badge={morningQueue.stats.pending}
          />
        </div>
      )}

      {briefingContent}

      <div className="mt-8 pt-4 border-t border-gray-200 flex items-center justify-between">
        <p className="text-[11px] text-gray-400">Ensign Agentic Platform — {ROLES.find(r => r.key === selectedRole)?.label} Morning Briefing</p>
        <p className="text-[11px] text-gray-400">Generated {new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })} by {agentSummary.agentName}</p>
      </div>
    </div>
  );
}
