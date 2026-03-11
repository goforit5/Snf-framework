import { Building2, MapPin, Bed, AlertTriangle, CheckCircle2, Clock, Circle, FileSearch, Shield, TrendingUp, Target, XCircle, Bot } from 'lucide-react';
import { maData } from '../data/mockData';
import { PageHeader, Card, StatusBadge, ProgressBar, ConfidenceBar } from '../components/Widgets';

export default function MAPipeline() {
  const { pipeline, diligenceItems } = maData;

  const riskColor = (score) => {
    if (score >= 75) return 'text-red-400';
    if (score >= 60) return 'text-amber-400';
    return 'text-emerald-400';
  };

  const riskBg = (score) => {
    if (score >= 75) return 'bg-red-500/10 border-red-500/30';
    if (score >= 60) return 'bg-amber-500/10 border-amber-500/30';
    return 'bg-emerald-500/10 border-emerald-500/30';
  };

  const stageColor = (stage) => {
    if (stage === 'Due Diligence') return 'bg-blue-500/20 text-blue-400';
    if (stage === 'LOI Signed') return 'bg-amber-500/20 text-amber-400';
    return 'bg-gray-500/20 text-gray-400';
  };

  const categories = [...new Set(diligenceItems.map(d => d.category))];

  const statusIcon = (status) => {
    if (status === 'received') return <CheckCircle2 size={14} className="text-emerald-400" />;
    if (status === 'pending') return <Clock size={14} className="text-amber-400" />;
    return <XCircle size={14} className="text-red-400" />;
  };

  const totalReceived = diligenceItems.filter(d => d.status === 'received').length;
  const totalItems = diligenceItems.length;
  const redFlags = diligenceItems.filter(d => d.risk && d.risk !== 'Unknown').length;

  return (
    <div className="min-h-screen bg-gray-950 p-6">
      <PageHeader
        title="M&A Pipeline & Due Diligence"
        subtitle="3 Active Targets | Lakeside Care Center in Active Diligence"
        aiSummary="Lakeside Care Center (Nashville) is the most advanced target at 78% diligence complete. Key risk: IJ citation in 2024 survey history and 34% staff turnover. Two critical documents still missing for Lakeside (union agreements, environmental assessment). Mountain View (Denver) flagged high-risk at 81 — elevated survey history and large valuation warrant deeper screening before committing diligence resources."
        riskLevel="medium"
      />

      {/* Pipeline Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {pipeline.map((target, i) => (
          <div key={i} className={`bg-gray-900 border rounded-xl p-5 ${riskBg(target.riskScore)}`}>
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="text-sm font-semibold text-white">{target.name}</h3>
                <div className="flex items-center gap-1.5 mt-1">
                  <MapPin size={11} className="text-gray-500" />
                  <span className="text-xs text-gray-400">{target.location}</span>
                </div>
              </div>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${stageColor(target.stage)}`}>
                {target.stage}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-gray-800/50 rounded-lg p-2.5">
                <div className="flex items-center gap-1.5 mb-1">
                  <Bed size={11} className="text-gray-500" />
                  <span className="text-[10px] text-gray-500">Beds</span>
                </div>
                <span className="text-sm font-bold text-white">{target.beds}</span>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-2.5">
                <div className="flex items-center gap-1.5 mb-1">
                  <TrendingUp size={11} className="text-gray-500" />
                  <span className="text-[10px] text-gray-500">Valuation</span>
                </div>
                <span className="text-sm font-bold text-white">{target.valuation}</span>
              </div>
            </div>

            <div className="mb-3">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] text-gray-500">Risk Score</span>
                <span className={`text-sm font-bold ${riskColor(target.riskScore)}`}>{target.riskScore}/100</span>
              </div>
              <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${target.riskScore >= 75 ? 'bg-red-500' : target.riskScore >= 60 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                  style={{ width: `${target.riskScore}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] text-gray-500">Diligence Progress</span>
                <span className="text-[10px] text-gray-400 font-mono">{target.diligenceProgress}%</span>
              </div>
              <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                <div className="h-full rounded-full bg-blue-500" style={{ width: `${target.diligenceProgress}%` }} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Risk Scorecard */}
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
                  <span className="text-xs text-gray-300">{item.area}</span>
                </div>
                <div className="flex-1">
                  {item.score !== null ? (
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${item.score >= 70 ? 'bg-emerald-500' : item.score >= 50 ? 'bg-amber-500' : 'bg-red-500'}`}
                          style={{ width: `${item.score}%` }}
                        />
                      </div>
                      <span className={`text-xs font-mono font-bold w-8 text-right ${item.score >= 70 ? 'text-emerald-400' : item.score >= 50 ? 'text-amber-400' : 'text-red-400'}`}>
                        {item.score}
                      </span>
                    </div>
                  ) : (
                    <span className="text-[10px] text-gray-600 italic">Awaiting data</span>
                  )}
                </div>
              </div>
            ))}
            <div className="pt-3 mt-3 border-t border-gray-800">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-white">Composite Risk</span>
                <span className="text-lg font-bold text-amber-400">58</span>
              </div>
              <p className="text-[10px] text-gray-500 mt-1">Moderate risk — proceed with enhanced diligence on labor and clinical</p>
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
                  <div className="flex-1 h-px bg-gray-800" />
                </div>
                <div className="space-y-1">
                  {diligenceItems.filter(d => d.category === cat).map((item, i) => (
                    <div key={i} className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-gray-800/30 transition-colors">
                      {statusIcon(item.status)}
                      <span className="text-sm text-gray-200 flex-1">{item.item}</span>
                      <StatusBadge status={item.status} />
                      {item.risk && item.risk !== 'Unknown' ? (
                        <span className="text-[10px] text-red-400 bg-red-500/10 px-2 py-0.5 rounded max-w-48 truncate">
                          {item.risk}
                        </span>
                      ) : item.risk === 'Unknown' ? (
                        <span className="text-[10px] text-gray-600 bg-gray-800 px-2 py-0.5 rounded">Pending review</span>
                      ) : (
                        <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">Clear</span>
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
        <div className="flex items-center gap-1.5 text-[10px] text-blue-400">
          <Bot size={12} />
          <span>M&A Intelligence Agent</span>
        </div>
      }>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            {
              severity: 'Critical',
              title: 'Immediate Jeopardy Citation (2024)',
              target: 'Lakeside Care Center',
              detail: 'IJ citation in April 2024 survey related to elopement risk. Facility was on 23-day plan of correction. CMS monitoring ended August 2024. While resolved, this signals systemic safety culture concerns and increases regulatory scrutiny risk post-acquisition.',
              recommendation: 'Request full POC documentation and subsequent survey results. Consider regulatory counsel review.',
              color: 'border-red-500/30 bg-red-500/5',
            },
            {
              severity: 'High',
              title: 'Staff Turnover Rate 34%',
              target: 'Lakeside Care Center',
              detail: '34% annual turnover significantly exceeds industry average of 22%. CNA turnover at 48%. Three DON changes in 18 months. This drives agency reliance ($180K/yr) and quality instability.',
              recommendation: 'Build retention premium into valuation model. Budget $200K first-year stabilization fund.',
              color: 'border-red-500/30 bg-red-500/5',
            },
            {
              severity: 'High',
              title: 'Open Litigation Exposure $890K',
              target: 'Lakeside Care Center',
              detail: 'Two active claims: (1) Wrongful death suit filed Jan 2025 ($650K demand), and (2) Employee discrimination complaint ($240K). Both pre-trial. Defense counsel estimates 40% liability probability.',
              recommendation: 'Require seller indemnification for pre-closing claims. Adjust valuation by expected value ($356K).',
              color: 'border-amber-500/30 bg-amber-500/5',
            },
            {
              severity: 'Medium',
              title: 'Missing Union Agreement Documentation',
              target: 'Lakeside Care Center',
              detail: 'Union agreements not yet provided despite two requests. Nashville market has active SEIU organizing. If unionized, labor costs could increase 8-12% and complicate integration.',
              recommendation: 'Escalate document request. Flag as potential deal term — seller representation on union status.',
              color: 'border-amber-500/30 bg-amber-500/5',
            },
          ].map((finding, i) => (
            <div key={i} className={`border rounded-xl p-4 ${finding.color}`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <AlertTriangle size={14} className={finding.severity === 'Critical' ? 'text-red-500' : finding.severity === 'High' ? 'text-red-400' : 'text-amber-400'} />
                  <span className="text-sm font-semibold text-white">{finding.title}</span>
                </div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  finding.severity === 'Critical' ? 'bg-red-600/20 text-red-400' :
                  finding.severity === 'High' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'
                }`}>
                  {finding.severity}
                </span>
              </div>
              <p className="text-[10px] text-gray-500 mb-2">{finding.target}</p>
              <p className="text-xs text-gray-400 leading-relaxed mb-3">{finding.detail}</p>
              <div className="bg-gray-800/50 rounded-lg p-2.5">
                <div className="flex items-center gap-1.5 mb-1">
                  <Target size={10} className="text-blue-400" />
                  <span className="text-[10px] font-semibold text-blue-400">Recommendation</span>
                </div>
                <p className="text-[10px] text-gray-300 leading-relaxed">{finding.recommendation}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
