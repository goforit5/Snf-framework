import { Building2, Users, TrendingUp, Calendar, DollarSign, Target } from 'lucide-react';
import { PageHeader, Card } from '../../components/Widgets';
import { AgentSummaryBar } from '../../components/AgentComponents';
import { StatGrid, DataTable } from '../../components/DataComponents';
import { DecisionQueue } from '../../components/DecisionComponents';
import { useDecisionQueue } from '../../hooks/useDecisionQueue';

const hospitalPartners = [
  { id: 'hp-1', hospital: 'Banner Desert Medical', city: 'Phoenix', state: 'AZ', referralsMTD: 8, referralsLastMonth: 6, conversionRate: 75, avgResponseHrs: 3.2, relationship: 'Strong', primaryContact: 'Dr. Lisa Chen', lastVisit: '2026-03-10' },
  { id: 'hp-2', hospital: 'Denver Health', city: 'Denver', state: 'CO', referralsMTD: 5, referralsLastMonth: 7, conversionRate: 60, avgResponseHrs: 5.1, relationship: 'Growing', primaryContact: 'Sarah Mitchell, RN', lastVisit: '2026-03-08' },
  { id: 'hp-3', hospital: 'Sharp Memorial', city: 'San Diego', state: 'CA', referralsMTD: 11, referralsLastMonth: 9, conversionRate: 82, avgResponseHrs: 2.8, relationship: 'Strong', primaryContact: 'Dr. James Park', lastVisit: '2026-03-12' },
  { id: 'hp-4', hospital: 'Sunrise Hospital', city: 'Las Vegas', state: 'NV', referralsMTD: 6, referralsLastMonth: 8, conversionRate: 50, avgResponseHrs: 6.4, relationship: 'At Risk', primaryContact: 'Maria Santos', lastVisit: '2026-02-18' },
  { id: 'hp-5', hospital: 'UC San Diego Health', city: 'San Diego', state: 'CA', referralsMTD: 7, referralsLastMonth: 5, conversionRate: 71, avgResponseHrs: 3.5, relationship: 'Growing', primaryContact: 'Dr. Robert Kim', lastVisit: '2026-03-11' },
  { id: 'hp-6', hospital: 'Providence Portland', city: 'Portland', state: 'OR', referralsMTD: 4, referralsLastMonth: 4, conversionRate: 75, avgResponseHrs: 4.0, relationship: 'Stable', primaryContact: 'Janet Holmes, MSW', lastVisit: '2026-03-05' },
  { id: 'hp-7', hospital: 'Intermountain Medical', city: 'Salt Lake City', state: 'UT', referralsMTD: 6, referralsLastMonth: 5, conversionRate: 83, avgResponseHrs: 2.5, relationship: 'Strong', primaryContact: 'Dr. David Larsen', lastVisit: '2026-03-13' },
  { id: 'hp-8', hospital: 'Banner UMC Tucson', city: 'Tucson', state: 'AZ', referralsMTD: 3, referralsLastMonth: 4, conversionRate: 67, avgResponseHrs: 4.8, relationship: 'Growing', primaryContact: 'Amy Rodriguez, RN', lastVisit: '2026-03-01' },
  { id: 'hp-9', hospital: 'Valley Hospital Las Vegas', city: 'Las Vegas', state: 'NV', referralsMTD: 4, referralsLastMonth: 6, conversionRate: 50, avgResponseHrs: 7.2, relationship: 'At Risk', primaryContact: 'Tom Bradley', lastVisit: '2026-02-12' },
  { id: 'hp-10', hospital: 'UC Davis Medical', city: 'Sacramento', state: 'CA', referralsMTD: 5, referralsLastMonth: 3, conversionRate: 80, avgResponseHrs: 3.0, relationship: 'Strong', primaryContact: 'Dr. Priya Patel', lastVisit: '2026-03-09' },
];

const totalReferralsMTD = hospitalPartners.reduce((s, h) => s + h.referralsMTD, 0);
const topSource = hospitalPartners.reduce((a, b) => a.referralsMTD > b.referralsMTD ? a : b);
const avgConversion = Math.round(hospitalPartners.reduce((s, h) => s + h.conversionRate, 0) / hospitalPartners.length);

const MARKETING_DECISIONS = [
  { id: 'mbd-1', title: 'Sunrise Hospital relationship deteriorating — 33% referral drop', facility: 'Las Vegas Desert Springs', priority: 'high', confidence: 0.89, agent: 'census-forecast', governanceLevel: 2, recommendation: 'Schedule in-person meeting with Maria Santos this week. Response time of 6.4 hrs is double our target. Assign dedicated liaison. Last visit was 25 days ago.', impact: 'Sunrise Hospital was #3 referral source — losing volume to competitor SNF' },
  { id: 'mbd-2', title: 'Valley Hospital Las Vegas — no visit in 31 days', facility: 'Las Vegas Desert Springs', priority: 'high', confidence: 0.91, agent: 'census-forecast', governanceLevel: 2, recommendation: 'Immediate outreach needed. 7.2 hr avg response time is worst in network. Assign Brian Caldwell (administrator) to personally visit. Conversion rate at 50% — below 70% threshold.', impact: 'Two at-risk hospital relationships in Las Vegas market compounds census pressure' },
  { id: 'mbd-3', title: 'Schedule community health fair — Sacramento market', facility: 'Sacramento Valley', priority: 'medium', confidence: 0.85, agent: 'census-forecast', governanceLevel: 1, recommendation: 'Sacramento Valley occupancy at 88.8%. Community health fair in partnership with UC Davis Medical would strengthen relationship and generate direct family referrals. Budget: $3,500.', impact: 'Previous health fairs generated 4-6 referrals within 30 days' },
];

export default function MarketingBD() {
  const { decisions, approve, escalate } = useDecisionQueue(MARKETING_DECISIONS);

  const stats = [
    { label: 'Hospital Partners', value: hospitalPartners.length, icon: Building2, color: 'blue', change: '2 at risk' },
    { label: 'Referrals MTD', value: totalReferralsMTD, icon: Users, color: 'emerald', change: '+12% vs last month', changeType: 'positive' },
    { label: 'Top Source', value: topSource.hospital.split(' ').slice(0, 2).join(' '), icon: Target, color: 'cyan', change: `${topSource.referralsMTD} referrals` },
    { label: 'Community Events', value: 3, icon: Calendar, color: 'purple', change: 'This month' },
    { label: 'Marketing Spend', value: '$28.5K', icon: DollarSign, color: 'amber', change: 'MTD budget' },
    { label: 'Avg Conversion', value: `${avgConversion}%`, icon: TrendingUp, color: 'emerald', change: '+4% vs target', changeType: 'positive' },
  ];

  const partnerColumns = [
    { key: 'hospital', label: 'Hospital', render: (v) => <span className="font-medium text-gray-900">{v}</span> },
    { key: 'city', label: 'Market' },
    { key: 'referralsMTD', label: 'Refs MTD', render: (v, row) => <span className="font-mono">{v} <span className={`text-[10px] ${v > row.referralsLastMonth ? 'text-green-500' : v < row.referralsLastMonth ? 'text-red-500' : 'text-gray-400'}`}>({v > row.referralsLastMonth ? '+' : ''}{v - row.referralsLastMonth})</span></span> },
    { key: 'conversionRate', label: 'Conv %', render: (v) => <span className={`font-mono font-semibold ${v >= 75 ? 'text-green-600' : v >= 60 ? 'text-amber-600' : 'text-red-600'}`}>{v}%</span> },
    { key: 'avgResponseHrs', label: 'Resp Time', render: (v) => <span className={`font-mono ${v <= 4 ? 'text-green-600' : v <= 6 ? 'text-amber-600' : 'text-red-600'}`}>{v}h</span> },
    { key: 'relationship', label: 'Status', render: (v) => <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${v === 'Strong' ? 'bg-green-50 text-green-600 border border-green-100' : v === 'At Risk' ? 'bg-red-50 text-red-600 border border-red-100' : v === 'Growing' ? 'bg-blue-50 text-blue-600 border border-blue-100' : 'bg-gray-50 text-gray-600 border border-gray-100'}`}>{v}</span> },
    { key: 'lastVisit', label: 'Last Visit', render: (v) => { const d = Math.floor((new Date() - new Date(v)) / 86400000); return <span className={`text-xs ${d > 21 ? 'text-red-600 font-semibold' : d > 14 ? 'text-amber-600' : 'text-gray-600'}`}>{d}d ago</span>; } },
  ];

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <PageHeader
        title="Marketing & Business Development"
        subtitle="Hospital relationships and referral source management"
        aiSummary={`${hospitalPartners.length} hospital partners tracked with ${totalReferralsMTD} referrals MTD. ${avgConversion}% average conversion rate. 2 Las Vegas relationships flagged as at-risk — Sunrise Hospital and Valley Hospital both showing declining referral volume and slow response times.`}
        riskLevel="medium"
      />
      <AgentSummaryBar
        agentName="census-forecast"
        summary={`Monitoring ${hospitalPartners.length} hospital relationships. ${decisions.length} action items — 2 at-risk relationships in Las Vegas and 1 marketing event opportunity.`}
        itemsProcessed={totalReferralsMTD}
        exceptionsFound={decisions.length}
        timeSaved="1.5 hrs"
        lastRunTime="18 min ago"
      />

      <div className="mb-6"><StatGrid stats={stats} columns={6} /></div>

      <div className="mb-6">
        <DecisionQueue
          decisions={decisions}
          onApprove={approve}
          onEscalate={escalate}
          title="Marketing Decisions"
          badge={decisions.length}
        />
      </div>

      <Card title="Hospital Relationships" badge={`${hospitalPartners.length}`} className="mb-6">
        <DataTable columns={partnerColumns} data={hospitalPartners} searchable pageSize={10} />
      </Card>

      <div className="mt-8 pt-4 border-t border-gray-200 flex items-center justify-between">
        <p className="text-[11px] text-gray-400">Admissions & Census — Marketing & Business Development</p>
        <p className="text-[11px] text-gray-400">Generated {new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })} by census-forecast agent</p>
      </div>
    </div>
  );
}
