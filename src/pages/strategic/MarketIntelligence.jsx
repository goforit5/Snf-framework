import { Globe, Building2, Users, TrendingUp, ArrowUpRight, MapPin, BarChart3 } from 'lucide-react';
import { competitors, marketRates, referralTrends, demographicData } from '../../data/strategic/marketIntel';
import { PageHeader, Card, SectionLabel } from '../../components/Widgets';
import { AgentSummaryBar } from '../../components/AgentComponents';
import { StatGrid, DataTable } from '../../components/DataComponents';
import { DecisionQueue } from '../../components/DecisionComponents';
import { useDecisionQueue } from '../../hooks/useDecisionQueue';

const marketDecisions = [
  { id: 'mi-d1', title: 'Competitor acquisition alert — 3 facilities in target market', description: 'Sabra Health Care REIT filed an 8-K on March 14 disclosing acquisition of 3 skilled nursing facilities in Phoenix metro from Desert Crest Healthcare (a 4-facility regional operator). Combined 280 beds across Scottsdale (100 beds, 3-star), Tempe (90 beds, 2-star), and Chandler (90 beds, 3-star). Estimated $45M transaction ($160K/bed). This brings Sabra\'s Phoenix metro footprint to 7 facilities (vs Ensign\'s 1 — Sunrise Senior Living). Ensign\'s M&A pipeline has deal #MA-07 (Mesa, 85-bed facility, $11M asking price) in early diligence. Sabra\'s Chandler facility is 8 miles from the Mesa target. Desert Crest\'s 4th facility (Gilbert, 75 beds) was NOT part of the Sabra deal — potentially still available.', priority: 'High', agent: 'Market Intelligence Agent', confidence: 0.93, governanceLevel: 4, facility: 'Enterprise', recommendation: 'Approve two actions: (1) Accelerate Mesa LOI (deal #MA-07) — move from diligence to LOI submission by March 28 before Sabra establishes regional pricing power. (2) Contact Desert Crest about Gilbert facility — if they sold 3 of 4, they may exit entirely. Brief Barry and M&A team on Sabra competitive dynamics at Thursday leadership call.', impact: 'Sabra at 7 facilities controls 22% of Phoenix metro SNF beds vs Ensign\'s 4%. If Mesa deal lost to Sabra: they reach 30% regional share, enabling referral network dominance and rate leverage with managed care. Phoenix 65+ population growing 4.2%/yr — fastest in portfolio.', evidence: [{ label: 'SEC 8-K — Sabra REIT, filed Mar 14 2026: $45M acquisition of 3 Desert Crest facilities' }, { label: 'Arizona AHCCCS license transfers — 3 applications filed Mar 12, Sabra as new operator' }, { label: 'Ensign M&A pipeline — deal #MA-07 (Mesa, 85 beds, $11M) in early diligence since Feb 20' }, { label: 'Desert Crest corporate filings — Gilbert facility (75 beds) not included in Sabra transaction' }] },
  { id: 'mi-d2', title: 'Census opportunity — hospital discharge pattern shift', description: 'Banner Health (Phoenix\'s largest hospital system, 6 campuses) changed their discharge planning protocols on February 1, shifting from internal rehab preference to SNF-first for orthopedic and cardiac recovery patients. CRISP HIE data shows SNF referrals from Banner increased 15% in February (from 340 to 391 referrals across all Phoenix SNFs). Sunrise Senior Living captured only 86 of 391 referrals (22%) — down from 28% in January. Top competitors captured: Sabra facilities 31%, Brookdale 18%, others 29%. The gap is driven by Sunrise\'s discharge liaison only covering Banner Desert and Banner Thunderbird, while Banner Estrella and Banner University are uncovered. Sunrise has 8 available beds and 92% occupancy — capacity exists.', priority: 'High', agent: 'Market Intelligence Agent', confidence: 0.90, governanceLevel: 3, facility: 'Sunrise Senior Living', recommendation: 'Approve deployment of second discharge liaison to cover Banner Estrella and Banner University (estimated 140 additional referral exposures/month). Hire from existing PRN pool — Lisa Hernandez (current PRN admissions coordinator) has hospital liaison experience and expressed interest. Cost: $65K/yr salary. Target: increase capture rate from 22% to 35% = 51 additional admissions/month at $12K average Medicare A stay = $612K/month incremental revenue.', impact: 'At current 22% capture rate: missing $7.3M/yr in potential revenue. Each 1% capture improvement = $144K/yr. Competitor Sabra already at 31% and expanding — delay risks permanent referral relationship lock-in.', evidence: [{ label: 'CRISP HIE data — Banner Health SNF referrals: Jan 340, Feb 391 (+15%), Sunrise share dropped 22% to 22%' }, { label: 'Sunrise admissions log — 86 Banner referrals in Feb, 0 from Estrella/University campuses' }, { label: 'PCC census — Sunrise at 92% occupancy, 8 beds available, avg Medicare A stay revenue $12K' }, { label: 'Workday — Lisa Hernandez (PRN), 3 yrs hospital liaison experience, available for FT conversion' }] },
  { id: 'mi-d3', title: 'Market entry recommendation — underserved zip code', description: 'Demographic analysis flagged zip code 84003 (American Fork, UT) as the most underserved SNF market in Ensign\'s 17-state footprint. Current 65+ population: 18,400 (Census ACS 2025), growing at 3.8%/yr — the fastest rate in Utah County. Nearest SNF is Mountain View (Salt Lake City, 22 miles north, Ensign-owned). Next closest is a 2-star independent in Provo (18 miles south, 78% occupancy). Utah County Planning Commission approved healthcare zoning for a 4.2-acre parcel on Main Street (Parcel #14-022-0085) in February. Land listing: $1.8M (Coldwell Banker Commercial). Medicare reimbursement in Utah averages $520/day for Medicare A, $185/day Medicaid. Based on comparable Ensign facilities in Utah, projected stabilized EBITDAR margin: 22%.', priority: 'Medium', agent: 'Market Intelligence Agent', confidence: 0.85, governanceLevel: 5, facility: 'Enterprise', recommendation: 'Approve $35K feasibility study (6-week timeline, assigned to M&A diligence team). Preliminary pro forma: 90-bed facility, $12M build cost, 18-month ramp to 85% occupancy, breakeven at month 14. At stabilized occupancy: $8.2M revenue, $1.8M EBITDAR. Do NOT acquire land yet — feasibility study first, then land option agreement if pro forma holds.', impact: 'First-mover advantage: no competitor has filed zoning applications in 84003. If Ensign delays, the approved parcel may be acquired for non-healthcare use (residential developer also inquired per planning commission minutes). Estimated 10-year NPV of new facility: $14.2M at 8% discount rate.', evidence: [{ label: 'Census ACS 2025 — 84003: 18,400 residents 65+, 3.8% YoY growth, median household income $78K' }, { label: 'Utah County Planning Commission minutes Feb 2026 — healthcare zoning approved, Parcel #14-022-0085' }, { label: 'CMS Provider Database — nearest SNFs: Mountain View 22mi (Ensign, 4-star), Provo Pines 18mi (independent, 2-star)' }, { label: 'Utah Medicaid rate schedule — $185/day SNF, Medicare A avg $520/day, effective Jan 2026' }] },
];

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
  const { decisions, approve, escalate } = useDecisionQueue(marketDecisions);

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

      <div className="mb-6">
        <DecisionQueue decisions={decisions} onApprove={approve} onEscalate={escalate} title="Market Intelligence Decisions" badge={decisions.length} />
      </div>

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
