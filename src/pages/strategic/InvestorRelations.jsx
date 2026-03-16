import { DollarSign, TrendingUp, BarChart3, Users, LineChart, PieChart } from 'lucide-react';
import { PageHeader, Card, SectionLabel } from '../../components/Widgets';
import { AgentSummaryBar } from '../../components/AgentComponents';
import { StatGrid, DataTable } from '../../components/DataComponents';

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
