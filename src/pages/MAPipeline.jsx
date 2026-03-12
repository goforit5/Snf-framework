import { Building2, MapPin, Bed, AlertTriangle, CheckCircle2, Clock, Circle, FileSearch, Shield, TrendingUp, Target, XCircle, Bot, ChevronRight } from 'lucide-react';
import { maData } from '../data/mockData';
import { PageHeader, Card, StatusBadge, ProgressBar, ConfidenceBar, ClickableRow, useModal, ActionButton, SectionLabel } from '../components/Widgets';

export default function MAPipeline() {
  const { open } = useModal();
  const { pipeline, diligenceItems } = maData;

  const riskColor = (score) => {
    if (score >= 75) return 'text-red-600';
    if (score >= 60) return 'text-amber-600';
    return 'text-green-600';
  };

  const riskBg = (score) => {
    if (score >= 75) return 'border-red-200 bg-red-50/30';
    if (score >= 60) return 'border-amber-200 bg-amber-50/30';
    return 'border-green-200 bg-green-50/30';
  };

  const stageColor = (stage) => {
    if (stage === 'Due Diligence') return 'bg-blue-50 text-blue-700 border border-blue-200';
    if (stage === 'LOI Signed') return 'bg-amber-50 text-amber-700 border border-amber-200';
    return 'bg-gray-100 text-gray-600';
  };

  const categories = [...new Set(diligenceItems.map(d => d.category))];

  const statusIcon = (status) => {
    if (status === 'received') return <CheckCircle2 size={14} className="text-green-600" />;
    if (status === 'pending') return <Clock size={14} className="text-amber-600" />;
    return <XCircle size={14} className="text-red-600" />;
  };

  const totalReceived = diligenceItems.filter(d => d.status === 'received').length;
  const totalItems = diligenceItems.length;

  const targetDetails = {
    'Willowbrook SNF': {
      summary: 'Willowbrook is a 110-bed SNF in Tampa, FL with a solid occupancy history averaging 92% over the past 3 years. Current ownership has operated for 12 years. Facility is in LOI stage with $8.2M valuation based on 7.5x EBITDAR multiple.',
      strengths: ['Strong occupancy (92% avg)', 'Established payer relationships', 'No recent IJ citations', 'Stable leadership (DON 6 years)'],
      risks: ['Tampa market getting competitive — 3 new builds within 5 miles', 'Building is 1987 construction, may need capital refresh ($1-2M)', 'Medicaid mix at 62% limits upside'],
      nextSteps: ['Complete financial diligence (3yr P&L received)', 'Schedule site visit', 'Engage legal for LOI review', 'Request staffing records and turnover data'],
    },
    'Lakeside Care Center': {
      summary: 'Lakeside is the most advanced target at 78% diligence. An 85-bed facility in Nashville, TN with $5.8M valuation. Significant risks identified: IJ citation in 2024, 34% staff turnover, and $890K in open litigation. Two critical documents still missing.',
      strengths: ['Nashville is a growth market', 'Below-market valuation at 6.8x EBITDAR', 'Medicare mix at 28% (above avg)', 'Therapy program generating $95K/month'],
      risks: ['IJ citation April 2024 (elopement)', '34% staff turnover (CNA: 48%)', '2 open lawsuits totaling $890K', 'Missing union agreement docs', '3 DON changes in 18 months'],
      nextSteps: ['Obtain union agreements (2 requests sent)', 'Schedule environmental assessment', 'Complete building inspection', 'Legal review of open litigation'],
    },
    'Mountain View Nursing': {
      summary: 'Mountain View is a 140-bed facility in Denver, CO in initial screening at $12.1M valuation. High risk score (81) driven by elevated survey history and large valuation. Only 15% through diligence — early-stage evaluation.',
      strengths: ['Largest bed count in pipeline (140)', 'Denver market has favorable demographics', 'Recent renovation (2023) — good physical plant', 'Strong therapy program'],
      risks: ['High risk score (81) — multiple survey deficiencies', 'Valuation at $12.1M is highest in pipeline', 'Limited information available at screening stage', 'Current owner in financial distress — potential asset deterioration'],
      nextSteps: ['Request 3-year financial statements', 'Obtain survey history and POC documentation', 'Preliminary valuation analysis', 'Determine if risk profile warrants advancing to LOI'],
    },
  };

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
            <div className="bg-gray-50 rounded-xl p-4">
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Risk Score</h4>
              <div className="flex items-center gap-2">
                <span className={`text-2xl font-bold ${riskColor(target.riskScore)}`}>{target.riskScore}</span>
                <span className="text-xs text-gray-400">/ 100</span>
              </div>
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Diligence Progress</h4>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-blue-600">{target.diligenceProgress}%</span>
              </div>
            </div>
          </div>

          {details.strengths && (
            <div>
              <h4 className="text-xs font-semibold text-green-700 uppercase tracking-wider mb-2">Strengths</h4>
              <ul className="space-y-1.5">
                {details.strengths.map((s, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <CheckCircle2 size={14} className="text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-700">{s}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {details.risks && (
            <div>
              <h4 className="text-xs font-semibold text-red-700 uppercase tracking-wider mb-2">Key Risks</h4>
              <ul className="space-y-1.5">
                {details.risks.map((r, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <AlertTriangle size={14} className="text-red-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-700">{r}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {details.nextSteps && (
            <div>
              <h4 className="text-xs font-semibold text-blue-700 uppercase tracking-wider mb-2">Next Steps</h4>
              <ul className="space-y-1.5">
                {details.nextSteps.map((n, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <ChevronRight size={14} className="text-blue-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-700">{n}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ),
      actions: (
        <>
          <ActionButton label="View Full Report" variant="primary" />
          <ActionButton label="Close" variant="ghost" />
        </>
      ),
    });
  };

  const findings = [
    {
      severity: 'Critical',
      title: 'Immediate Jeopardy Citation (2024)',
      target: 'Lakeside Care Center',
      detail: 'IJ citation in April 2024 survey related to elopement risk. Facility was on 23-day plan of correction. CMS monitoring ended August 2024. While resolved, this signals systemic safety culture concerns and increases regulatory scrutiny risk post-acquisition.',
      recommendation: 'Request full POC documentation and subsequent survey results. Consider regulatory counsel review.',
      fullAnalysis: 'The Immediate Jeopardy (IJ) citation was issued on April 12, 2024, related to a resident elopement event. The facility was placed on a 23-day Plan of Correction (POC) with CMS monitoring. The POC was accepted and monitoring ended August 2024. However, our analysis of the underlying root cause reveals systemic issues: (1) Security system had been non-functional for 3 weeks prior to the incident, (2) Staff training on elopement protocols was overdue for 40% of staff, (3) Two prior near-miss events were not documented per protocol. Post-acquisition, expect enhanced regulatory scrutiny for 18-24 months.',
      evidence: ['CMS survey report April 2024', 'Plan of Correction documentation', 'Subsequent survey results August 2024', 'Security system maintenance logs'],
      confidence: 0.92,
    },
    {
      severity: 'High',
      title: 'Staff Turnover Rate 34%',
      target: 'Lakeside Care Center',
      detail: '34% annual turnover significantly exceeds industry average of 22%. CNA turnover at 48%. Three DON changes in 18 months. This drives agency reliance ($180K/yr) and quality instability.',
      recommendation: 'Build retention premium into valuation model. Budget $200K first-year stabilization fund.',
      fullAnalysis: 'Staff turnover analysis reveals a facility in workforce crisis. Key findings: (1) CNA turnover at 48% is more than double the industry average of 22%, (2) Three Directors of Nursing in 18 months indicates leadership instability, (3) Agency reliance is $180K/year and growing — up 34% year-over-year, (4) Exit interview data (limited) cites management style and scheduling conflicts as top reasons, (5) Wage comparison shows Lakeside pays 8% below Nashville market median for CNAs. A stabilization plan will require significant upfront investment but is critical to successful integration.',
      evidence: ['Employee roster and termination records', 'Agency staffing invoices', 'Nashville market wage survey', 'Exit interview summaries'],
      confidence: 0.91,
    },
    {
      severity: 'High',
      title: 'Open Litigation Exposure $890K',
      target: 'Lakeside Care Center',
      detail: 'Two active claims: (1) Wrongful death suit filed Jan 2025 ($650K demand), and (2) Employee discrimination complaint ($240K). Both pre-trial. Defense counsel estimates 40% liability probability.',
      recommendation: 'Require seller indemnification for pre-closing claims. Adjust valuation by expected value ($356K).',
      fullAnalysis: 'Two active legal matters represent material exposure: (1) Smith v. Lakeside Care — wrongful death claim filed January 2025 alleging inadequate fall prevention protocols. Demand is $650K. Defense counsel rates liability probability at 35-40%. Settlement range estimated $200-350K. (2) Johnson v. Lakeside Care — employment discrimination claim filed October 2024 alleging wrongful termination. Demand is $240K. EEOC investigation in progress. Defense counsel rates liability at 40-45%. Settlement range estimated $80-120K. Combined expected value of liability: $280-470K. Recommend adjusting valuation by midpoint ($356K).',
      evidence: ['Court filings and pleadings', 'Defense counsel liability assessment', 'Insurance coverage analysis', 'Similar case outcomes in TN'],
      confidence: 0.88,
    },
    {
      severity: 'Medium',
      title: 'Missing Union Agreement Documentation',
      target: 'Lakeside Care Center',
      detail: 'Union agreements not yet provided despite two requests. Nashville market has active SEIU organizing. If unionized, labor costs could increase 8-12% and complicate integration.',
      recommendation: 'Escalate document request. Flag as potential deal term — seller representation on union status.',
      fullAnalysis: 'The failure to provide union agreement documentation after two formal requests (February 15 and March 3) is concerning. Nashville has seen increased SEIU organizing activity in healthcare, with 3 successful union elections at area SNFs in 2025. If Lakeside has an existing CBA, implications include: (1) Labor cost increase of 8-12% based on comparable Nashville CBAs, (2) Integration complexity — must honor existing agreements, (3) Potential successorship obligations, (4) Scheduling flexibility constraints. If no CBA exists, the active organizing environment means unionization risk within 12-18 months is moderate (35-40% probability based on market activity).',
      evidence: ['Document request log', 'Nashville SEIU organizing activity reports', 'Comparable CBA terms analysis', 'NLRB election data'],
      confidence: 0.85,
    },
  ];

  const openFindingModal = (finding) => {
    open({
      title: finding.title,
      content: (
        <div className="space-y-5">
          <div className="flex items-center gap-3">
            <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
              finding.severity === 'Critical' ? 'bg-red-100 text-red-700 border border-red-200' :
              finding.severity === 'High' ? 'bg-red-50 text-red-700 border border-red-200' :
              'bg-amber-50 text-amber-700 border border-amber-200'
            }`}>{finding.severity}</span>
            <span className="text-xs text-gray-400">{finding.target}</span>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Full AI Analysis</h4>
            <p className="text-sm text-gray-700 leading-relaxed">{finding.fullAnalysis}</p>
          </div>

          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Target size={14} className="text-blue-600" />
              <h4 className="text-xs font-semibold text-blue-700">Recommendation</h4>
            </div>
            <p className="text-sm text-blue-800">{finding.recommendation}</p>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Evidence</h4>
            <div className="space-y-1.5">
              {finding.evidence.map((e, i) => (
                <div key={i} className="flex items-center gap-2 py-1.5 px-3 bg-gray-50 rounded-lg">
                  <FileSearch size={12} className="text-gray-400" />
                  <span className="text-xs text-gray-700">{e}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">AI Confidence:</span>
              <div className="flex-1 max-w-32">
                <ConfidenceBar value={finding.confidence} />
              </div>
            </div>
          </div>
        </div>
      ),
      actions: (
        <>
          <ActionButton label="Accept Finding" variant="primary" />
          <ActionButton label="Request More Data" variant="outline" />
          <ActionButton label="Close" variant="ghost" />
        </>
      ),
    });
  };

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      <PageHeader
        title="M&A Pipeline & Due Diligence"
        subtitle="3 Active Targets | Lakeside Care Center in Active Diligence"
        aiSummary="Lakeside Care Center (Nashville) is the most advanced target at 78% diligence complete. Key risk: IJ citation in 2024 survey history and 34% staff turnover. Two critical documents still missing for Lakeside (union agreements, environmental assessment). Mountain View (Denver) flagged high-risk at 81 — elevated survey history and large valuation warrant deeper screening before committing diligence resources."
        riskLevel="medium"
      />

      {/* Pipeline Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {pipeline.map((target, i) => (
          <div
            key={i}
            className={`bg-white border rounded-2xl p-5 shadow-sm cursor-pointer hover:shadow-md transition-all active:scale-[0.98] ${riskBg(target.riskScore)}`}
            onClick={() => openTargetModal(target)}
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="text-sm font-semibold text-gray-900">{target.name}</h3>
                <div className="flex items-center gap-1.5 mt-1">
                  <MapPin size={11} className="text-gray-400" />
                  <span className="text-xs text-gray-500">{target.location}</span>
                </div>
              </div>
              <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${stageColor(target.stage)}`}>
                {target.stage}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-gray-50 rounded-xl p-2.5">
                <div className="flex items-center gap-1.5 mb-1">
                  <Bed size={11} className="text-gray-400" />
                  <span className="text-[10px] text-gray-400">Beds</span>
                </div>
                <span className="text-sm font-bold text-gray-900">{target.beds}</span>
              </div>
              <div className="bg-gray-50 rounded-xl p-2.5">
                <div className="flex items-center gap-1.5 mb-1">
                  <TrendingUp size={11} className="text-gray-400" />
                  <span className="text-[10px] text-gray-400">Valuation</span>
                </div>
                <span className="text-sm font-bold text-gray-900">{target.valuation}</span>
              </div>
            </div>

            <div className="mb-3">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] text-gray-400">Risk Score</span>
                <span className={`text-sm font-bold ${riskColor(target.riskScore)}`}>{target.riskScore}/100</span>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${target.riskScore >= 75 ? 'bg-red-500' : target.riskScore >= 60 ? 'bg-amber-500' : 'bg-green-500'}`}
                  style={{ width: `${target.riskScore}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] text-gray-400">Diligence Progress</span>
                <span className="text-[10px] text-gray-500 font-mono">{target.diligenceProgress}%</span>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full bg-blue-500" style={{ width: `${target.diligenceProgress}%` }} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Risk Scorecard + Due Diligence */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <Card title="Risk Scorecard — Lakeside Care Center" className="lg:col-span-1">
          <div className="space-y-3">
            {[
              { area: 'Financial Health', score: 72, detail: 'High AR >90d ($340K)' },
              { area: 'Clinical Quality', score: 58, detail: 'IJ citation 2024, below avg falls' },
              { area: 'Labor Stability', score: 45, detail: '34% turnover rate' },
              { area: 'Legal Exposure', score: 62, detail: '2 open claims ($890K)' },
              { area: 'Physical Plant', score: null, detail: 'Inspection pending' },
              { area: 'Regulatory', score: 68, detail: 'CMPs totaling $45K' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-28 flex-shrink-0">
                  <span className="text-xs text-gray-700">{item.area}</span>
                </div>
                <div className="flex-1">
                  {item.score !== null ? (
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${item.score >= 70 ? 'bg-green-500' : item.score >= 50 ? 'bg-amber-500' : 'bg-red-500'}`}
                          style={{ width: `${item.score}%` }}
                        />
                      </div>
                      <span className={`text-xs font-mono font-bold w-8 text-right ${item.score >= 70 ? 'text-green-600' : item.score >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
                        {item.score}
                      </span>
                    </div>
                  ) : (
                    <span className="text-[10px] text-gray-400 italic">Awaiting data</span>
                  )}
                </div>
              </div>
            ))}
            <div className="pt-3 mt-3 border-t border-gray-100">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-900">Composite Risk</span>
                <span className="text-lg font-bold text-amber-600">58</span>
              </div>
              <p className="text-[10px] text-gray-400 mt-1">Moderate risk — proceed with enhanced diligence on labor and clinical</p>
            </div>
          </div>
        </Card>

        {/* Due Diligence Table */}
        <Card title="Due Diligence Checklist — Lakeside Care Center" className="lg:col-span-2" badge={`${totalReceived}/${totalItems} received`}>
          <div className="space-y-4">
            {categories.map(cat => (
              <div key={cat}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{cat}</span>
                  <div className="flex-1 h-px bg-gray-100" />
                </div>
                <div className="space-y-1">
                  {diligenceItems.filter(d => d.category === cat).map((item, i) => (
                    <div key={i} className="flex items-center gap-3 py-2 px-3 rounded-xl hover:bg-gray-50 transition-colors">
                      {statusIcon(item.status)}
                      <span className="text-sm text-gray-900 flex-1">{item.item}</span>
                      <StatusBadge status={item.status} />
                      {item.risk && item.risk !== 'Unknown' ? (
                        <span className="text-[10px] text-red-600 bg-red-50 border border-red-100 px-2 py-0.5 rounded-md max-w-48 truncate">
                          {item.risk}
                        </span>
                      ) : item.risk === 'Unknown' ? (
                        <span className="text-[10px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded-md">Pending review</span>
                      ) : (
                        <span className="text-[10px] text-green-600 bg-green-50 border border-green-100 px-2 py-0.5 rounded-md">Clear</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* AI Findings */}
      <Card title="AI Findings — Red Flags & Key Observations" action={
        <div className="flex items-center gap-1.5 text-[10px] text-blue-600">
          <Bot size={12} />
          <span className="font-medium">M&A Intelligence Agent</span>
        </div>
      }>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {findings.map((finding, i) => (
            <div
              key={i}
              className={`border rounded-2xl p-4 cursor-pointer hover:shadow-md transition-all active:scale-[0.98] ${
                finding.severity === 'Critical' ? 'border-red-200 bg-red-50/40' :
                finding.severity === 'High' ? 'border-red-200 bg-red-50/30' : 'border-amber-200 bg-amber-50/30'
              }`}
              onClick={() => openFindingModal(finding)}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <AlertTriangle size={14} className={finding.severity === 'Critical' || finding.severity === 'High' ? 'text-red-600' : 'text-amber-600'} />
                  <span className="text-sm font-semibold text-gray-900">{finding.title}</span>
                </div>
                <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                  finding.severity === 'Critical' ? 'bg-red-100 text-red-700' :
                  finding.severity === 'High' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                }`}>
                  {finding.severity}
                </span>
              </div>
              <p className="text-[10px] text-gray-400 mb-2">{finding.target}</p>
              <p className="text-xs text-gray-500 leading-relaxed mb-3">{finding.detail}</p>
              <div className="bg-white/60 rounded-xl p-2.5">
                <div className="flex items-center gap-1.5 mb-1">
                  <Target size={10} className="text-blue-600" />
                  <span className="text-[10px] font-semibold text-blue-600">Recommendation</span>
                </div>
                <p className="text-[10px] text-gray-700 leading-relaxed">{finding.recommendation}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
