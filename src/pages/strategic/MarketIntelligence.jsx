import { Globe, Building2, Users, TrendingUp, ArrowUpRight, MapPin, BarChart3 } from 'lucide-react';
import { competitors, marketRates, referralTrends, demographicData } from '../../data/strategic/marketIntel';
import { PageHeader, Card, SectionLabel } from '../../components/Widgets';
import { AgentSummaryBar } from '../../components/AgentComponents';
import { StatGrid, DataTable } from '../../components/DataComponents';

const avgGrowth = (demographicData.reduce((s, d) => s + d.growthRate, 0) / demographicData.length).toFixed(1);
const avgMarketRate = Math.round(marketRates.reduce((s, r) => s + r.privateDailyRate, 0) / marketRates.length);
const latestReferrals = referralTrends[referralTrends.length - 1];
const totalMarketShare = competitors.filter(c => c.name !== 'Independent operators').reduce((s, c) => s + c.marketShare, 0);

const stats = [
  { label: 'Competitors Tracked', value: competitors.length, icon: Building2, color: 'blue' },
  { label: 'Markets Monitored', value: marketRates.length, icon: Globe, color: 'emerald' },
  { label: 'Avg Private Rate', value: `$${avgMarketRate}/day`, icon: TrendingUp, color: 'purple' },
  { label: 'Demographic Growth', value: `${avgGrowth}%`, icon: Users, color: 'cyan', change: 'avg 65+ YoY', changeType: 'positive' },
  { label: 'Referral Trend', value: latestReferrals.total, icon: ArrowUpRight, color: 'amber', change: '+13% vs Dec', changeType: 'positive' },
  { label: 'Market Share (named)', value: `${totalMarketShare}%`, icon: BarChart3, color: 'red', change: '65% independent', changeType: 'neutral' },
];

const competitorColumns = [
  { key: 'name', label: 'Competitor' },
  { key: 'region', label: 'Region' },
  { key: 'facilities', label: 'Facilities', render: (v) => <span className="font-mono tabular-nums">{v}</span> },
  { key: 'avgOccupancy', label: 'Avg Occupancy', render: (v) => <span className="font-mono tabular-nums">{v}%</span> },
  { key: 'avgStarRating', label: 'Star Rating', render: (v) => {
    const color = v >= 3.0 ? 'text-green-600' : v >= 2.5 ? 'text-amber-600' : 'text-red-600';
    return <span className={`font-mono font-semibold tabular-nums ${color}`}>{v.toFixed(1)}</span>;
  }},
  { key: 'marketShare', label: 'Market Share', render: (v) => <span className="font-mono tabular-nums">{v}%</span> },
];

const rateColumns = [
  { key: 'state', label: 'State', render: (v) => <div className="flex items-center gap-1.5"><MapPin size={12} className="text-gray-400" /><span className="font-semibold">{v}</span></div> },
  { key: 'medicaidDailyRate', label: 'Medicaid/Day', render: (v) => <span className="font-mono tabular-nums">${v}</span> },
  { key: 'medicareADailyRate', label: 'Medicare A/Day', render: (v) => <span className="font-mono tabular-nums">${v}</span> },
  { key: 'privateDailyRate', label: 'Private/Day', render: (v) => <span className="font-mono tabular-nums font-semibold">${v}</span> },
  { key: 'avgOccupancy', label: 'Avg Occupancy', render: (v) => <span className="font-mono tabular-nums">{v}%</span> },
  { key: 'totalBeds', label: 'Total Beds', render: (v) => <span className="font-mono tabular-nums">{v.toLocaleString()}</span> },
];

const demoColumns = [
  { key: 'state', label: 'State', render: (v) => <span className="font-semibold">{v}</span> },
  { key: 'population65Plus', label: '65+ Population', render: (v) => <span className="font-mono tabular-nums">{(v / 1000000).toFixed(1)}M</span> },
  { key: 'growthRate', label: 'Growth Rate', render: (v) => {
    const color = v >= 4.0 ? 'text-green-600' : 'text-amber-600';
    return <span className={`font-mono font-semibold tabular-nums ${color}`}>{v}%</span>;
  }},
  { key: 'snfBedsPerThousand', label: 'SNF Beds/1K 65+', render: (v) => <span className="font-mono tabular-nums">{v}</span> },
];

export default function MarketIntelligence() {
  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      <PageHeader
        title="Market Intelligence"
        subtitle="Competitive landscape, rate analysis, and demographic trends across 17 states"
        aiSummary="Nevada and Utah show strongest demographic growth (5.1% and 4.8%) with favorable bed-per-thousand ratios. Independent operators (65% market share) present significant consolidation opportunity. Referral volume up 13% from December trough, driven by hospital referrals."
      />
      <AgentSummaryBar
        agentName="M&A Diligence Agent"
        summary="Monitoring 6 competitors across 6 key states. Market rates updated monthly. Referral trends showing strong Q1 recovery."
        itemsProcessed={42}
        exceptionsFound={3}
        timeSaved="6 hrs"
        lastRunTime="2h ago"
      />

      <div className="mb-6"><StatGrid stats={stats} columns={6} /></div>

      <SectionLabel>Competitive Landscape</SectionLabel>
      <Card title="Competitor Facilities" className="mb-6">
        <DataTable columns={competitorColumns} data={competitors} searchable pageSize={10} />
      </Card>

      <SectionLabel>Market Rate Comparison</SectionLabel>
      <Card title="Daily Rates by State" className="mb-6">
        <DataTable columns={rateColumns} data={marketRates} pageSize={10} />
      </Card>

      <SectionLabel>Demographic Trends</SectionLabel>
      <Card title="65+ Population & Growth by State">
        <DataTable columns={demoColumns} data={demographicData} pageSize={10} />
      </Card>
    </div>
  );
}
