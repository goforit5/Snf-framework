import { DollarSign, TrendingUp, BarChart3, Users, LineChart, PieChart } from 'lucide-react';
import { PageHeader, Card, SectionLabel } from '../../components/Widgets';
import { AgentSummaryBar } from '../../components/AgentComponents';
import { StatGrid, DataTable } from '../../components/DataComponents';
import { DecisionQueue } from '../../components/DecisionComponents';
import { useDecisionQueue } from '../../hooks/useDecisionQueue';

const irDecisions = [
  { id: 'ir-d1', title: 'Q1 2026 earnings call script — review required', description: 'The Q1 2026 earnings call script (v3, 18 pages) is ready for CEO review. Key numbers from the draft: revenue $1.08B (+6.2% YoY), same-facility occupancy recovered to 82.4% (up from 79.1% in Q4), 3 acquisitions closed adding 245 beds. The script proposes raising FY2026 EPS guidance from $5.60-5.80 to $5.80-5.95, which would be the 4th consecutive guidance raise. Consensus estimate sits at $5.72 — the new midpoint of $5.875 would be a 2.1% beat. Legal flagged one section for revision: the M&A pipeline commentary references "active discussions" which may trigger Reg FD obligations if too specific. CFO Chad Keetch has not yet reviewed financials section. Earnings release date: April 24 (37 days). Call: April 25, 10:00 AM ET.', priority: 'High', agent: 'IR Agent', confidence: 0.91, governanceLevel: 5, facility: 'Corporate', recommendation: 'Approve routing for concurrent review: (1) General Counsel — revise M&A pipeline language to remove "active discussions" per Reg FD, replace with "robust pipeline" (standard Safe Harbor phrasing). (2) CFO Chad Keetch — validate revenue and EPS figures against final Q1 close. (3) Schedule CEO prep call for April 21 (3 days before release). Target: final script locked by April 18.', impact: 'If script not finalized by April 18: compressed prep time risks CEO stumbling on analyst Q&A. If guidance raise not properly vetted: potential restatement or Reg FD violation. Last Q\'s guidance raise drove 4.2% stock price increase ($328M market cap impact).', evidence: [{ label: 'Draft earnings script v3 — 18 pages, revenue $1.08B, occupancy 82.4%, proposed EPS guidance $5.80-5.95' }, { label: 'Legal review notes — M&A section flagged for Reg FD, recommend "robust pipeline" language' }, { label: 'Consensus estimates — Street at $5.72 EPS (7 of 8 analysts updated in past 30 days)' }, { label: 'SEC calendar — 10-Q filing due May 10, earnings release Apr 24, call Apr 25 10AM ET' }] },
  { id: 'ir-d2', title: 'Analyst inquiry — Baird requesting facility-level margins', description: 'Michael Torres (Baird, Outperform rating, $145 target) emailed IR on March 15 requesting EBITDAR margins for Ensign\'s top 20 facilities by revenue. His email states: "Several investors are asking about margin dispersion across your portfolio — any facility-level data would be helpful for our model." Ensign has never disclosed facility-level financials — current disclosure is regional aggregates (Southwest, Mountain, Pacific, Northwest). Reg FD policy (Section 3.2) prohibits sharing material non-public information with select analysts. Torres is presenting at the Baird Healthcare Conference on May 15 where Ensign is a featured presenter. His current model assumes uniform 18% EBITDAR margins — actual range is 12% to 28% across facilities.', priority: 'Medium', agent: 'IR Agent', confidence: 0.94, governanceLevel: 4, facility: 'Corporate', recommendation: 'Decline facility-level request per Reg FD. Send prepared response (draft attached): offer regional aggregate EBITDAR margins (Southwest 21.4%, Mountain 19.8%, Pacific 17.2%, Northwest 18.6%) which are already in the 10-K. Schedule 30-minute call with Torres for March 25 to discuss Q1 trends qualitatively and preview Baird Conference talking points. This maintains the relationship while staying compliant.', impact: 'If facility-level data shared: creates Reg FD disclosure obligation requiring 8-K filing or public dissemination to all investors simultaneously. SEC enforcement risk. If Torres downgrades due to lack of data: $145 target removal would reduce consensus target by $3 (minimal impact given 7 other analysts). Maintaining Reg FD compliance is non-negotiable.', evidence: [{ label: 'Torres email — Mar 15 2026, requesting top-20 facility EBITDAR margins for investor model' }, { label: 'Reg FD policy Section 3.2 — prohibits selective disclosure of material non-public financial data' }, { label: 'Current 10-K disclosure — regional aggregates only: SW 21.4%, Mtn 19.8%, Pac 17.2%, NW 18.6%' }, { label: 'Baird Conference — May 15, Ensign featured presenter, Torres moderating healthcare panel' }] },
  { id: 'ir-d3', title: 'Board presentation approval — Q1 quarterly deck', description: 'The Q1 2026 board presentation (42 slides) is complete and ready for CEO sign-off. Content breakdown: financial performance (slides 1-12, $1.08B revenue, 82.4% occupancy), operational KPIs (slides 13-17, quality scores, staffing ratios), M&A activity (slides 18-22, 3 closed deals, 4 in pipeline including Mesa at $11M), workforce initiatives (slides 23-30), and strategic roadmap (slides 31-42, including AI/agentic platform POC). Slides 18-22 contain material non-public information about pipeline deals and must be restricted to executive session per board governance charter. Board meeting: June 12, 9:00 AM ET. Charter requires materials distributed 10 business days prior (by June 2). Last quarter\'s deck was 38 slides — the 4-slide increase is from the new AI/agentic section that Barry requested.', priority: 'Medium', agent: 'IR Agent', confidence: 0.92, governanceLevel: 5, facility: 'Corporate', recommendation: 'Approve deck with two conditions: (1) Flag slides 18-22 as "Executive Session — MNPI" with restricted distribution (board members + General Counsel only, no staff copies). (2) Distribute remaining slides (1-17, 23-42) to full board + observers by June 2. Schedule 30-min CEO walkthrough of AI/agentic section (slides 31-42) before distribution — Barry may want to adjust messaging based on consulting engagement progress.', impact: 'If not distributed by June 2: governance charter violation, requires formal board waiver (last happened in 2019, created negative audit committee note). If MNPI slides not properly restricted: potential securities law exposure for insider trading if pipeline deals leak before public announcement.', evidence: [{ label: 'Q1 2026 board deck — 42 slides, final draft v2, created by IR + Finance teams' }, { label: 'Board governance charter Section 5.1 — 10 business day advance distribution requirement' }, { label: 'MNPI classification — slides 18-22 contain pipeline deal values and target facility identities' }, { label: 'Prior quarter — Q4 2025 deck was 38 slides, distributed Dec 1 for Dec 11 meeting (on time)' }] },
];

const analystEstimates = [
  { id: 1, firm: 'Goldman Sachs', analyst: 'Sarah Chen', rating: 'Buy', priceTarget: 148, epsEstQ1: 1.42, epsEstFY: 5.85, lastUpdated: '2026-03-10' },
  { id: 2, firm: 'Morgan Stanley', analyst: 'James Rivera', rating: 'Overweight', priceTarget: 155, epsEstQ1: 1.38, epsEstFY: 5.72, lastUpdated: '2026-03-08' },
  { id: 3, firm: 'JP Morgan', analyst: 'Lisa Park', rating: 'Buy', priceTarget: 152, epsEstQ1: 1.45, epsEstFY: 5.90, lastUpdated: '2026-03-12' },
  { id: 4, firm: 'Baird', analyst: 'Michael Torres', rating: 'Outperform', priceTarget: 145, epsEstQ1: 1.35, epsEstFY: 5.68, lastUpdated: '2026-03-05' },
  { id: 5, firm: 'RBC Capital', analyst: 'Emily Watson', rating: 'Buy', priceTarget: 150, epsEstQ1: 1.40, epsEstFY: 5.78, lastUpdated: '2026-03-11' },
  { id: 6, firm: 'Stifel', analyst: 'David Kim', rating: 'Hold', priceTarget: 135, epsEstQ1: 1.30, epsEstFY: 5.55, lastUpdated: '2026-02-28' },
  { id: 7, firm: 'Stephens', analyst: 'Rachel Adams', rating: 'Overweight', priceTarget: 142, epsEstQ1: 1.36, epsEstFY: 5.65, lastUpdated: '2026-03-07' },
  { id: 8, firm: 'BMO Capital', analyst: 'Andrew Lee', rating: 'Outperform', priceTarget: 147, epsEstQ1: 1.39, epsEstFY: 5.75, lastUpdated: '2026-03-09' },
];

const earningsCalendar = [
  { id: 1, event: 'Q1 2026 Earnings Release', date: '2026-04-24', time: '4:00 PM ET', type: 'Earnings', status: 'Upcoming' },
  { id: 2, event: 'Q1 2026 Earnings Call', date: '2026-04-25', time: '10:00 AM ET', type: 'Conference Call', status: 'Upcoming' },
  { id: 3, event: 'Healthcare Conference (Baird)', date: '2026-05-15', time: 'All Day', type: 'Conference', status: 'Confirmed' },
  { id: 4, event: 'Q2 2026 Earnings Release', date: '2026-07-24', time: '4:00 PM ET', type: 'Earnings', status: 'Tentative' },
  { id: 5, event: 'Annual Shareholder Meeting', date: '2026-06-12', time: '9:00 AM ET', type: 'Shareholder', status: 'Confirmed' },
];

const stats = [
  { label: 'Stock Price (ENSG)', value: '$138.42', icon: TrendingUp, color: 'emerald', change: '+2.4% MTD', changeType: 'positive' },
  { label: 'Market Cap', value: '$7.8B', icon: BarChart3, color: 'blue' },
  { label: 'Revenue TTM', value: '$4.1B', icon: DollarSign, color: 'purple' },
  { label: 'EPS (TTM)', value: '$5.62', icon: LineChart, color: 'cyan', change: '+8.3% YoY', changeType: 'positive' },
  { label: 'Analyst Coverage', value: analystEstimates.length, icon: Users, color: 'amber' },
  { label: 'Institutional %', value: '89.4%', icon: PieChart, color: 'red' },
];

const ratingColor = (rating) => {
  if (['Buy', 'Outperform', 'Overweight'].includes(rating)) return 'bg-green-50 text-green-700 border border-green-200';
  if (rating === 'Hold') return 'bg-amber-50 text-amber-700 border border-amber-200';
  return 'bg-red-50 text-red-700 border border-red-200';
};

const analystColumns = [
  { key: 'firm', label: 'Firm', render: (v) => <span className="font-semibold">{v}</span> },
  { key: 'analyst', label: 'Analyst' },
  { key: 'rating', label: 'Rating', render: (v) => <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${ratingColor(v)}`}>{v}</span> },
  { key: 'priceTarget', label: 'Price Target', render: (v) => <span className="font-mono font-semibold tabular-nums">${v}</span> },
  { key: 'epsEstQ1', label: 'EPS Est Q1', render: (v) => <span className="font-mono tabular-nums">${v.toFixed(2)}</span> },
  { key: 'epsEstFY', label: 'EPS Est FY', render: (v) => <span className="font-mono tabular-nums">${v.toFixed(2)}</span> },
  { key: 'lastUpdated', label: 'Updated', render: (v) => <span className="text-xs text-gray-500">{new Date(v).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span> },
];

const eventTypeColor = (type) => {
  if (type === 'Earnings') return 'bg-blue-50 text-blue-700';
  if (type === 'Conference Call') return 'bg-violet-50 text-violet-700';
  if (type === 'Conference') return 'bg-emerald-50 text-emerald-700';
  return 'bg-gray-100 text-gray-600';
};

const calendarColumns = [
  { key: 'event', label: 'Event', render: (v) => <span className="font-semibold">{v}</span> },
  { key: 'date', label: 'Date', render: (v) => <span className="font-mono tabular-nums">{new Date(v).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span> },
  { key: 'time', label: 'Time', render: (v) => <span className="text-xs text-gray-500">{v}</span> },
  { key: 'type', label: 'Type', render: (v) => <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${eventTypeColor(v)}`}>{v}</span> },
  { key: 'status', label: 'Status', render: (v) => <span className={`text-xs font-medium ${v === 'Confirmed' ? 'text-green-600' : v === 'Upcoming' ? 'text-blue-600' : 'text-gray-400'}`}>{v}</span> },
];

export default function InvestorRelations() {
  const { decisions, approve, escalate } = useDecisionQueue(irDecisions);
  const avgTarget = Math.round(analystEstimates.reduce((s, a) => s + a.priceTarget, 0) / analystEstimates.length);
  const buyCount = analystEstimates.filter(a => ['Buy', 'Outperform', 'Overweight'].includes(a.rating)).length;

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      <PageHeader
        title="Investor Relations"
        subtitle="Earnings, analyst coverage, and shareholder communications"
        aiSummary={`${buyCount} of ${analystEstimates.length} analysts rate ENSG as Buy/Outperform. Average price target $${avgTarget} (${((avgTarget / 138.42 - 1) * 100).toFixed(0)}% upside). Q1 earnings release April 24 — consensus EPS $1.38. Institutional ownership stable at 89.4%.`}
      />
      <AgentSummaryBar
        agentName="Enterprise Orchestrator"
        summary="Monitoring 8 analyst reports and 5 upcoming IR events. Preparing Q1 earnings materials. No analyst downgrades in past 30 days."
        itemsProcessed={24}
        exceptionsFound={0}
        timeSaved="8 hrs"
        lastRunTime="1h ago"
      />

      <div className="mb-6"><StatGrid stats={stats} columns={6} /></div>

      <div className="mb-6">
        <DecisionQueue decisions={decisions} onApprove={approve} onEscalate={escalate} title="IR Decisions" badge={decisions.length} />
      </div>

      <SectionLabel>Analyst Coverage</SectionLabel>
      <Card title="Analyst Estimates & Ratings" badge={`${buyCount}/${analystEstimates.length} Buy`} className="mb-6">
        <DataTable columns={analystColumns} data={analystEstimates} searchable pageSize={10} />
      </Card>

      <SectionLabel>Upcoming Events</SectionLabel>
      <Card title="IR Calendar">
        <DataTable columns={calendarColumns} data={earningsCalendar} pageSize={10} />
      </Card>
    </div>
  );
}
