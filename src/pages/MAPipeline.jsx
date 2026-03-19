import { MapPin, Bed, AlertTriangle, CheckCircle2, TrendingUp, Target, FileSearch, Bot, ChevronRight } from 'lucide-react';
import { maData } from '../data/mockData';
import { PageHeader, Card, StatusBadge, ConfidenceBar, ActionButton, SectionLabel } from '../components/Widgets';
import { useModal } from '../components/WidgetUtils';
import { AgentSummaryBar } from '../components/AgentComponents';
import { StatGrid } from '../components/DataComponents';
import { useDecisionQueue } from '../hooks/useDecisionQueue';
import { DecisionQueue } from '../components/DecisionComponents';

const riskColor = (score) => score >= 75 ? 'text-red-600' : score >= 60 ? 'text-amber-600' : 'text-green-600';
const riskBg = (score) => score >= 75 ? 'border-red-200 bg-red-50/30' : score >= 60 ? 'border-amber-200 bg-amber-50/30' : 'border-green-200 bg-green-50/30';
const stageColor = (stage) => stage === 'Due Diligence' ? 'bg-blue-50 text-blue-700 border border-blue-200' : stage === 'LOI Signed' ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-gray-100 text-gray-600';

const targetDetails = {
  'Willowbrook SNF': { summary: 'Willowbrook is a 110-bed SNF in Tampa, FL with 92% avg occupancy. LOI stage at $8.2M valuation (7.5x EBITDAR).', strengths: ['Strong occupancy (92% avg)', 'Established payer relationships', 'No recent IJ citations', 'Stable leadership'], risks: ['Tampa market competitive — 3 new builds within 5 miles', 'Building is 1987 construction, may need $1-2M refresh', 'Medicaid mix at 62% limits upside'], nextSteps: ['Complete financial diligence', 'Schedule site visit', 'Engage legal for LOI review'] },
  'Lakeside Care Center': { summary: 'Most advanced target at 78% diligence. 85-bed facility in Nashville at $5.8M. Significant risks: IJ citation, 34% turnover, $890K litigation.', strengths: ['Nashville growth market', 'Below-market valuation at 6.8x EBITDAR', 'Medicare mix 28% (above avg)', 'Therapy program $95K/month'], risks: ['IJ citation April 2024 (elopement)', '34% staff turnover (CNA: 48%)', '2 open lawsuits ($890K)', '3 DON changes in 18 months'], nextSteps: ['Obtain union agreements', 'Schedule environmental assessment', 'Complete building inspection', 'Legal review of litigation'] },
  'Mountain View Nursing': { summary: '140-bed facility in Denver at $12.1M. High risk score (81). Only 15% through diligence — early-stage.', strengths: ['Largest bed count (140)', 'Denver favorable demographics', 'Recent renovation (2023)', 'Strong therapy program'], risks: ['High risk score (81)', 'Highest valuation in pipeline', 'Limited info at screening stage', 'Owner in financial distress'], nextSteps: ['Request 3-year financials', 'Obtain survey history', 'Preliminary valuation analysis'] },
};

const findings = [
  { severity: 'Critical', title: 'Immediate Jeopardy Citation (2024)', target: 'Lakeside Care Center', detail: 'IJ citation in April 2024 related to elopement. 23-day POC. Signals systemic safety culture concerns.', recommendation: 'Request full POC documentation and subsequent survey results.', evidence: ['CMS survey report', 'Plan of Correction', 'Subsequent survey results', 'Security logs'], confidence: 0.92, fullAnalysis: 'The IJ citation was issued April 12, 2024, related to a resident elopement. Root cause: security system non-functional 3 weeks prior, staff training overdue for 40% of staff, two prior near-miss events undocumented. Expect enhanced scrutiny for 18-24 months post-acquisition.' },
  { severity: 'High', title: 'Staff Turnover Rate 34%', target: 'Lakeside Care Center', detail: '34% turnover exceeds 22% industry avg. CNA turnover at 48%. Three DON changes in 18 months. Agency reliance $180K/yr.', recommendation: 'Build retention premium into valuation. Budget $200K first-year stabilization.', evidence: ['Employee roster', 'Agency invoices', 'Nashville wage survey', 'Exit interviews'], confidence: 0.91, fullAnalysis: 'CNA turnover at 48% is double industry average. Agency reliance up 34% YoY. Lakeside pays 8% below Nashville market median for CNAs. Stabilization plan requires significant upfront investment.' },
  { severity: 'High', title: 'Open Litigation Exposure $890K', target: 'Lakeside Care Center', detail: 'Two claims: wrongful death ($650K) and employee discrimination ($240K). Defense counsel estimates 40% liability.', recommendation: 'Require seller indemnification. Adjust valuation by $356K expected value.', evidence: ['Court filings', 'Defense counsel assessment', 'Insurance analysis', 'Similar TN outcomes'], confidence: 0.88, fullAnalysis: 'Combined expected value of liability: $280-470K. Recommend adjusting valuation by midpoint ($356K).' },
  { severity: 'Medium', title: 'Missing Union Agreement Documentation', target: 'Lakeside Care Center', detail: 'Union agreements not provided despite two requests. Nashville has active SEIU organizing. If unionized, labor costs could increase 8-12%.', recommendation: 'Escalate request. Flag as potential deal term.', evidence: ['Document request log', 'Nashville SEIU activity', 'Comparable CBA terms', 'NLRB data'], confidence: 0.85, fullAnalysis: 'Failure to provide after two requests is concerning. Nashville has seen 3 successful SNF union elections in 2025. Unionization risk within 12-18 months is 35-40%.' },
];

const maDecisions = [
  { id: 'ma-1', title: 'LOI Approval — Sunrise Acres ($18.5M, 120-bed)', description: 'Sunrise Acres is a 120-bed SNF in Scottsdale, AZ owned by a solo operator (Dr. James Whitfield, age 68) who wants to retire. The facility runs at 91% occupancy with a 32% Medicare mix — 8 points above national average. Trailing 12-month EBITDAR: $2.37M on $14.8M revenue (16% margin). CMS Five-Star: 4 overall, 5 on staffing. Building renovated 2021 ($3.2M per Maricopa County records). Zero IJ citations in 5 years. Only 2 competing SNFs within 10 miles, both at 95%+ occupancy. The seller\'s broker (Marcus & Millichap) contacted us March 10 — a regional chain requested a facility tour for next week.', facility: 'Sunrise Acres (Target)', priority: 'High', agent: 'M&A Intelligence Agent', confidence: 0.87, governanceLevel: 5, recommendation: 'Approve LOI at $18.5M (7.8x EBITDAR) with 90-day exclusivity, $500K refundable earnest money, and standard Ensign diligence conditions. Three comparable Phoenix-area sales in trailing 12 months: Desert View (7.2x, 90 beds), Camelback Care (7.6x, 100 beds), Valley SNF (8.1x, 85 beds). Our offer sits at market midpoint. Projected Year 2 cash-on-cash return: 12.4%.', impact: 'Competing buyer likely bids $19-20M based on Phoenix market premium if we lose exclusivity. Every day of delay increases risk. At $18.5M vs $19.5M competitor price: $1M saved. At 12.4% cash-on-cash, this acquisition pays for itself in 8.1 years — well within Ensign\'s 10-year target.', evidence: [{ label: 'Seller financials (verified) — Revenue: $14.8M, EBITDAR: $2.37M (16% margin), occupancy: 91%, Medicare mix: 32%, Medicaid: 44%, private pay: 24%' }, { label: 'CMS Five-Star — 4 stars overall, 5 stars staffing (4.2 RN hrs/resident/day), 4 stars quality. Last survey: December 2025, zero deficiencies. No IJ in 5 years.' }, { label: 'Market analysis — Phoenix MSA 65+ population: 812K, growing 6.2% YoY. Two competing SNFs within 10 miles: both at 95%+ occupancy. Zero new SNF construction permits filed in Scottsdale.' }, { label: 'Broker intelligence — Marcus & Millichap confirmed competing interest from regional chain. Tour requested for next week. Exclusivity window: 48 hours before seller engages second party.' }] },
  { id: 'ma-2', title: 'Due Diligence Red Flag — Environmental Assessment', description: 'The Phase I environmental assessment for Lakeside Care Center (Nashville) came back with a significant finding. Environmental consultant (Terracon) identified a potential underground storage tank (UST) on the east property boundary, approximately 40 feet from the building foundation. Historical land use records from Davidson County show a gas station operated on the adjacent parcel from 1960-1985. Soil discoloration was observed during the site visit on March 4. No documentation of UST removal or closure exists in Tennessee TDEC records. The property is in a groundwater protection zone.', facility: 'Lakeside Care Center', priority: 'Critical', agent: 'M&A Intelligence Agent', confidence: 0.82, governanceLevel: 4, recommendation: 'Approve $35K Phase II environmental assessment (soil boring + groundwater monitoring wells). Terracon can mobilize within 10 business days, results in 4-6 weeks. Simultaneously, instruct legal to add environmental indemnification clause to LOI addendum — seller bears all remediation costs for pre-existing contamination with no cap and 10-year survival period.', impact: 'UST remediation costs range from $50K (clean removal, no contamination) to $500K+ (groundwater contamination requiring pump-and-treat). Without Phase II, Ensign assumes full CERCLA liability post-close. Tennessee TDEC enforcement actions average $180K in similar cases. The $35K Phase II investment protects against up to $500K in unknown liability — a 14:1 risk-reward ratio.', evidence: [{ label: 'Terracon Phase I report (dated 3/6/26) — Recognized Environmental Condition (REC) identified: potential UST on east boundary. Soil discoloration observed at 3 surface sample points. No UST closure records in TDEC database.' }, { label: 'Davidson County land records — Adjacent parcel (220 Elm St): Shell gas station operated 1960-1985. Station demolished 1987. No environmental remediation permits on file.' }, { label: 'TDEC groundwater map — Property sits within Zone 2 wellhead protection area. Contamination would trigger mandatory remediation under TN Water Quality Control Act.' }, { label: 'Environmental counsel (Baker Donelson) — recommends Phase II before proceeding. Similar TN case in 2024: buyer discovered contamination post-close, remediation cost $340K, 18-month timeline.' }] },
  { id: 'ma-3', title: 'Valuation Adjustment — Mountain View Updated Comps', description: 'Three new comparable SNF sales in the Denver metro closed in February 2026, all at lower multiples than our original Mountain View valuation assumed. Pikes Peak SNF (110 beds) sold at 6.5x EBITDAR, Aurora Care Center (95 beds) at 6.8x, and Centennial Nursing (120 beds) at 7.0x. Our original Mountain View model used 7.5x — based on Q3 2025 comps that are now stale. Mountain View\'s owner (Gerald Foster, 72) is in financial distress: Workday market intelligence shows 2 tax liens totaling $89K filed in January, and the facility\'s line of credit was reduced from $2M to $500K by FirstBank in December. His asking price of $12.1M (7.5x) no longer reflects market reality.', facility: 'Mountain View Nursing', priority: 'Medium', agent: 'M&A Intelligence Agent', confidence: 0.90, governanceLevel: 3, recommendation: 'Reduce offer from $12.1M to $10.9M (6.8x EBITDAR — the median of the 3 new comps). Present the updated comparable data directly to seller. Given his financial distress (tax liens, reduced credit line), he has limited negotiating leverage and is unlikely to find a buyer at 7.5x in the current market. Save $1.2M on purchase price.', impact: 'Proceeding at $12.1M overpays by $1.2M (11%) relative to current market. At the revised $10.9M, Year 1 cash-on-cash return improves from 9.8% to 11.6%. If seller rejects, we can walk — Mountain View is early-stage (15% diligence) with high risk score (81) and we have minimal sunk cost.', evidence: [{ label: 'Denver SNF transactions (Feb 2026) — Pikes Peak SNF: $7.15M / 110 beds / 6.5x EBITDAR. Aurora Care: $5.44M / 95 beds / 6.8x. Centennial Nursing: $9.24M / 120 beds / 7.0x. Median: 6.8x.' }, { label: 'Original valuation model — Mountain View at $12.1M assumed 7.5x EBITDAR based on Q3 2025 comps. Updated model at 6.8x = $10.9M. Delta: $1.2M (11% reduction).' }, { label: 'Seller distress indicators — Gerald Foster (owner, age 72): 2 IRS tax liens filed Jan 2026 totaling $89K. FirstBank reduced LOC from $2M to $500K in Dec 2025. Facility cash reserves estimated at <$200K.' }, { label: 'Risk assessment — Mountain View risk score: 81/100 (high). Only 15% through diligence. Owner distress increases execution risk but also provides negotiating leverage.' }] },
];

export default function MAPipeline() {
  const { open } = useModal();
  const { pipeline, diligenceItems } = maData;
  const { decisions: maDecisionsPending, approve: maApprove, escalate: maEscalate } = useDecisionQueue(maDecisions);
  const totalReceived = diligenceItems.filter(d => d.status === 'received').length;
  const categories = [...new Set(diligenceItems.map(d => d.category))];

  const dealStats = [
    { label: 'Active Targets', value: pipeline.length, icon: MapPin, color: 'blue' },
    { label: 'Total Beds', value: pipeline.reduce((s, t) => s + t.beds, 0), icon: Bed, color: 'emerald' },
    { label: 'Total Valuation', value: '$26.1M', icon: TrendingUp, color: 'purple' },
    { label: 'Diligence Items', value: `${totalReceived}/${diligenceItems.length}`, icon: CheckCircle2, color: 'cyan', change: 'received' },
    { label: 'Red Flags', value: findings.length, icon: AlertTriangle, color: 'red', change: `${findings.filter(f => f.severity === 'Critical').length} critical` },
  ];

  const openTargetModal = (target) => {
    const details = targetDetails[target.name] || {};
    open({
      title: target.name,
      content: (
        <div className="space-y-5">
          <div className="flex items-center gap-3">
            <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${stageColor(target.stage)}`}>{target.stage}</span>
            <span className="text-xs text-gray-400">{target.location}</span>
            <span className="text-xs text-gray-400">{target.beds} beds</span>
            <span className="text-sm font-bold text-gray-900">{target.valuation}</span>
          </div>
          <p className="text-sm text-gray-700 leading-relaxed">{details.summary}</p>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-xl p-4"><h4 className="text-xs font-semibold text-gray-500 uppercase mb-1">Risk Score</h4><span className={`text-2xl font-bold ${riskColor(target.riskScore)}`}>{target.riskScore}</span><span className="text-xs text-gray-400"> / 100</span></div>
            <div className="bg-gray-50 rounded-xl p-4"><h4 className="text-xs font-semibold text-gray-500 uppercase mb-1">Diligence</h4><span className="text-2xl font-bold text-blue-600">{target.diligenceProgress}%</span></div>
          </div>
          {details.strengths && <div><h4 className="text-xs font-semibold text-green-700 uppercase mb-2">Strengths</h4><ul className="space-y-1.5">{details.strengths.map((s, i) => <li key={i} className="flex items-start gap-2"><CheckCircle2 size={14} className="text-green-500 mt-0.5 flex-shrink-0" /><span className="text-sm text-gray-700">{s}</span></li>)}</ul></div>}
          {details.risks && <div><h4 className="text-xs font-semibold text-red-700 uppercase mb-2">Key Risks</h4><ul className="space-y-1.5">{details.risks.map((r, i) => <li key={i} className="flex items-start gap-2"><AlertTriangle size={14} className="text-red-500 mt-0.5 flex-shrink-0" /><span className="text-sm text-gray-700">{r}</span></li>)}</ul></div>}
          {details.nextSteps && <div><h4 className="text-xs font-semibold text-blue-700 uppercase mb-2">Next Steps</h4><ul className="space-y-1.5">{details.nextSteps.map((n, i) => <li key={i} className="flex items-start gap-2"><ChevronRight size={14} className="text-blue-500 mt-0.5 flex-shrink-0" /><span className="text-sm text-gray-700">{n}</span></li>)}</ul></div>}
        </div>
      ),
      actions: <><ActionButton label="View Full Report" variant="primary" /><ActionButton label="Close" variant="ghost" /></>,
    });
  };

  const openFindingModal = (finding) => {
    open({
      title: finding.title,
      content: (
        <div className="space-y-5">
          <div className="flex items-center gap-3">
            <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${finding.severity === 'Critical' ? 'bg-red-100 text-red-700 border border-red-200' : finding.severity === 'High' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>{finding.severity}</span>
            <span className="text-xs text-gray-400">{finding.target}</span>
          </div>
          <div><h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Full AI Analysis</h4><p className="text-sm text-gray-700 leading-relaxed">{finding.fullAnalysis}</p></div>
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4"><div className="flex items-center gap-2 mb-2"><Target size={14} className="text-blue-600" /><h4 className="text-xs font-semibold text-blue-700">Recommendation</h4></div><p className="text-sm text-blue-800">{finding.recommendation}</p></div>
          <div><h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Evidence</h4><div className="space-y-1.5">{finding.evidence.map((e, i) => <div key={i} className="flex items-center gap-2 py-1.5 px-3 bg-gray-50 rounded-lg"><FileSearch size={12} className="text-gray-400" /><span className="text-xs text-gray-700">{e}</span></div>)}</div></div>
          <div className="bg-gray-50 rounded-xl p-4"><div className="flex items-center gap-2"><span className="text-xs text-gray-500">AI Confidence:</span><div className="flex-1 max-w-32"><ConfidenceBar value={finding.confidence} /></div></div></div>
        </div>
      ),
      actions: <><ActionButton label="Accept Finding" variant="primary" /><ActionButton label="Request More Data" variant="outline" /><ActionButton label="Close" variant="ghost" /></>,
    });
  };

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      <PageHeader title="M&A Pipeline & Due Diligence" subtitle="3 Active Targets | Lakeside Care Center in Active Diligence" riskLevel="medium" />
      <AgentSummaryBar agentName="M&A Intelligence Agent" summary="Lakeside Care Center at 78% diligence with key risks identified. 2 critical documents missing. Mountain View flagged high-risk (81) — deeper screening needed." itemsProcessed={12} exceptionsFound={4} timeSaved="18 hrs" />

      <SectionLabel>M&A Decisions</SectionLabel>
      <div className="mb-6">
        <DecisionQueue decisions={maDecisionsPending} onApprove={maApprove} onEscalate={maEscalate} title="Deal Decisions" badge={maDecisionsPending.length} />
      </div>

      <div className="mb-6"><StatGrid stats={dealStats} columns={5} /></div>

      {/* Pipeline Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {pipeline.map((target, i) => (
          <div key={i} className={`bg-white border rounded-2xl p-5 shadow-sm cursor-pointer hover:shadow-md transition-all active:scale-[0.98] ${riskBg(target.riskScore)}`} onClick={() => openTargetModal(target)}>
            <div className="flex items-start justify-between mb-3">
              <div><h3 className="text-sm font-semibold text-gray-900">{target.name}</h3><div className="flex items-center gap-1.5 mt-1"><MapPin size={11} className="text-gray-400" /><span className="text-xs text-gray-500">{target.location}</span></div></div>
              <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${stageColor(target.stage)}`}>{target.stage}</span>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-gray-50 rounded-xl p-2.5"><div className="flex items-center gap-1.5 mb-1"><Bed size={11} className="text-gray-400" /><span className="text-[10px] text-gray-400">Beds</span></div><span className="text-sm font-bold text-gray-900">{target.beds}</span></div>
              <div className="bg-gray-50 rounded-xl p-2.5"><div className="flex items-center gap-1.5 mb-1"><TrendingUp size={11} className="text-gray-400" /><span className="text-[10px] text-gray-400">Valuation</span></div><span className="text-sm font-bold text-gray-900">{target.valuation}</span></div>
            </div>
            <div className="mb-3"><div className="flex items-center justify-between mb-1.5"><span className="text-[10px] text-gray-400">Risk Score</span><span className={`text-sm font-bold ${riskColor(target.riskScore)}`}>{target.riskScore}/100</span></div><div className="h-1.5 bg-gray-100 rounded-full overflow-hidden"><div className={`h-full rounded-full ${target.riskScore >= 75 ? 'bg-red-500' : target.riskScore >= 60 ? 'bg-amber-500' : 'bg-green-500'}`} style={{ width: `${target.riskScore}%` }} /></div></div>
            <div><div className="flex items-center justify-between mb-1.5"><span className="text-[10px] text-gray-400">Diligence Progress</span><span className="text-[10px] text-gray-500 font-mono">{target.diligenceProgress}%</span></div><div className="h-1.5 bg-gray-100 rounded-full overflow-hidden"><div className="h-full rounded-full bg-blue-500" style={{ width: `${target.diligenceProgress}%` }} /></div></div>
          </div>
        ))}
      </div>

      {/* Due Diligence Table */}
      <Card title="Due Diligence Checklist — Lakeside Care Center" badge={`${totalReceived}/${diligenceItems.length} received`} className="mb-6">
        <div className="space-y-4">
          {categories.map(cat => (
            <div key={cat}>
              <div className="flex items-center gap-2 mb-2"><span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{cat}</span><div className="flex-1 h-px bg-gray-100" /></div>
              <div className="space-y-1">
                {diligenceItems.filter(d => d.category === cat).map((item, i) => (
                  <div key={i} className="flex items-center gap-3 py-2 px-3 rounded-xl hover:bg-gray-50 transition-colors">
                    <CheckCircle2 size={14} className={item.status === 'received' ? 'text-green-600' : item.status === 'pending' ? 'text-amber-600' : 'text-red-600'} />
                    <span className="text-sm text-gray-900 flex-1">{item.item}</span>
                    <StatusBadge status={item.status} />
                    {item.risk && item.risk !== 'Unknown' ? <span className="text-[10px] text-red-600 bg-red-50 border border-red-100 px-2 py-0.5 rounded-md max-w-48 truncate">{item.risk}</span> : item.risk === 'Unknown' ? <span className="text-[10px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded-md">Pending review</span> : <span className="text-[10px] text-green-600 bg-green-50 border border-green-100 px-2 py-0.5 rounded-md">Clear</span>}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* AI Findings */}
      <Card title="AI Findings — Red Flags & Key Observations" action={<div className="flex items-center gap-1.5 text-[10px] text-blue-600"><Bot size={12} /><span className="font-medium">M&A Intelligence Agent</span></div>}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {findings.map((finding, i) => (
            <div key={i} className={`border rounded-2xl p-4 cursor-pointer hover:shadow-md transition-all active:scale-[0.98] ${finding.severity === 'Critical' ? 'border-red-200 bg-red-50/40' : finding.severity === 'High' ? 'border-red-200 bg-red-50/30' : 'border-amber-200 bg-amber-50/30'}`} onClick={() => openFindingModal(finding)}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2"><AlertTriangle size={14} className={finding.severity !== 'Medium' ? 'text-red-600' : 'text-amber-600'} /><span className="text-sm font-semibold text-gray-900">{finding.title}</span></div>
                <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${finding.severity === 'Critical' ? 'bg-red-100 text-red-700' : finding.severity === 'High' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>{finding.severity}</span>
              </div>
              <p className="text-[10px] text-gray-400 mb-2">{finding.target}</p>
              <p className="text-xs text-gray-500 leading-relaxed mb-3">{finding.detail}</p>
              <div className="bg-white/60 rounded-xl p-2.5"><div className="flex items-center gap-1.5 mb-1"><Target size={10} className="text-blue-600" /><span className="text-[10px] font-semibold text-blue-600">Recommendation</span></div><p className="text-[10px] text-gray-700 leading-relaxed">{finding.recommendation}</p></div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
