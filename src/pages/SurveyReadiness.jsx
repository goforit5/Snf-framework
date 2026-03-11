import { Shield, AlertTriangle, CheckCircle2, XCircle, ClipboardCheck, FileWarning, Bot, ChevronRight } from 'lucide-react';
import { surveyData } from '../data/mockData';
import { PageHeader, Card, PriorityBadge, ActionButton } from '../components/Widgets';

export default function SurveyReadiness() {
  const { overall, categories, riskItems } = surveyData;

  const overallColor = overall >= 85 ? 'text-emerald-400' : overall >= 70 ? 'text-amber-400' : 'text-red-400';
  const overallBg = overall >= 85 ? 'from-emerald-500/20 to-emerald-500/5 border-emerald-500/20' : overall >= 70 ? 'from-amber-500/20 to-amber-500/5 border-amber-500/20' : 'from-red-500/20 to-red-500/5 border-red-500/20';

  const barColor = (score) => {
    if (score >= 85) return 'bg-emerald-500';
    if (score >= 70) return 'bg-amber-500';
    return 'bg-red-500';
  };

  const riskColor = (risk) => {
    if (risk === 'High') return 'bg-red-500/20 text-red-400 border-red-500/30';
    if (risk === 'Medium') return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
    return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
  };

  const vulnerabilities = [
    { area: 'Fall Prevention (F-689)', detail: 'Heritage Oaks has 3 repeat fallers with incomplete post-fall assessments. Surveyors will pull these records.', severity: 'Critical' },
    { area: 'Nutrition Management (F-692)', detail: 'Bayview has 3 residents with >5% weight loss and no documented intervention plan. Immediate Jeopardy risk.', severity: 'Critical' },
    { area: 'License Currency', detail: '2 RN licenses expiring within 30 days at Sunrise. If expired during survey, facility faces enforcement.', severity: 'High' },
    { area: 'Infection Control (F-880)', detail: 'Meadowbrook hand hygiene audit at 72% — state average is 89%. Training gap evident.', severity: 'Medium' },
  ];

  const immediateActions = [
    { action: 'Complete all overdue post-fall assessments at Heritage Oaks', owner: 'DON - Heritage Oaks', deadline: 'Today', impact: 'Closes F-689 exposure' },
    { action: 'Document weight loss interventions for 3 Bayview residents', owner: 'DON - Bayview', deadline: 'Today', impact: 'Prevents potential IJ on F-692' },
    { action: 'Verify RN license renewals at Sunrise — escalate to HR', owner: 'HR Director', deadline: 'By March 13', impact: 'Avoids staffing crisis + survey finding' },
    { action: 'Schedule hand hygiene in-service at Meadowbrook', owner: 'IP Nurse - Meadowbrook', deadline: 'This week', impact: 'Improves F-880 compliance score' },
    { action: 'Audit care plan timeliness across all facilities', owner: 'Clinical Agent', deadline: 'This week', impact: 'Reduces 11 open care plan issues' },
  ];

  return (
    <div className="min-h-screen bg-gray-950 p-6">
      <PageHeader
        title="Survey Readiness Dashboard"
        subtitle="Continuous compliance monitoring — if surveyors walked in today"
        aiSummary="Overall readiness is 76 — below the 85 target. Two critical F-tag risks require same-day action: F-689 (falls) at Heritage Oaks and F-692 (nutrition) at Bayview both carry Immediate Jeopardy potential. Licenses & Certifications (68) and Incident Resolution (65) are the weakest categories. State survey cycle indicates inspection likely within 2 weeks."
        riskLevel="high"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Overall Score */}
        <div className={`bg-gradient-to-br ${overallBg} border rounded-xl p-6 flex flex-col items-center justify-center`}>
          <span className="text-xs text-gray-400 font-medium mb-2">OVERALL READINESS SCORE</span>
          <span className={`text-7xl font-bold ${overallColor}`}>{overall}</span>
          <span className="text-sm text-gray-400 mt-2">Target: 85+</span>
          <div className="mt-4 w-full bg-gray-800 rounded-full h-3 overflow-hidden">
            <div className={`h-full rounded-full ${barColor(overall)} transition-all`} style={{ width: `${overall}%` }} />
          </div>
          <div className="mt-3 flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-gray-400">85+ Ready</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-amber-500" />
              <span className="text-gray-400">70-84 At Risk</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-red-500" />
              <span className="text-gray-400">&lt;70 Critical</span>
            </div>
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="lg:col-span-2">
          <Card title="Category Readiness Scores">
            <div className="space-y-3">
              {categories.map((cat, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-xs text-gray-400 w-40 flex-shrink-0">{cat.name}</span>
                  <div className="flex-1 h-5 bg-gray-800 rounded-full overflow-hidden relative">
                    <div className={`h-full rounded-full ${barColor(cat.score)} transition-all`} style={{ width: `${cat.score}%` }} />
                    <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white">
                      {cat.score}
                    </span>
                  </div>
                  <span className="text-[10px] text-gray-500 w-16 text-right">{cat.issues} issues</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* Risk Items Table */}
      <Card title="F-Tag Risk Items" badge={`${riskItems.length}`} className="mb-6">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-500 text-xs border-b border-gray-800">
                <th className="text-left py-2 font-medium">F-Tag</th>
                <th className="text-left py-2 font-medium">Description</th>
                <th className="text-center py-2 font-medium">Risk</th>
                <th className="text-left py-2 font-medium">Facility</th>
                <th className="text-left py-2 font-medium">Details</th>
              </tr>
            </thead>
            <tbody>
              {riskItems.map((item, i) => (
                <tr key={i} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                  <td className="py-3">
                    <span className="text-white font-mono font-bold">{item.tag}</span>
                  </td>
                  <td className="py-3 text-gray-300">{item.description}</td>
                  <td className="py-3 text-center">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${riskColor(item.risk)}`}>
                      {item.risk}
                    </span>
                  </td>
                  <td className="py-3 text-gray-400 text-xs">{item.facility}</td>
                  <td className="py-3 text-gray-400 text-xs">{item.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* If Surveyors Walked In Today */}
        <Card title="If Surveyors Walked In Today" badge="4 vulnerabilities">
          <div className="space-y-3">
            {vulnerabilities.map((v, i) => (
              <div key={i} className={`rounded-lg p-4 border ${v.severity === 'Critical' ? 'bg-red-500/5 border-red-500/20' : v.severity === 'High' ? 'bg-amber-500/5 border-amber-500/20' : 'bg-gray-800/50 border-gray-700/50'}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white text-sm font-medium">{v.area}</span>
                  <PriorityBadge priority={v.severity} />
                </div>
                <p className="text-sm text-gray-400">{v.detail}</p>
              </div>
            ))}
          </div>
        </Card>

        {/* Recommended Immediate Actions */}
        <Card title="Recommended Immediate Actions" badge={`${immediateActions.length}`}>
          <div className="space-y-3">
            {immediateActions.map((a, i) => (
              <div key={i} className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/50">
                <div className="flex items-start gap-3">
                  <div className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${a.deadline === 'Today' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'}`}>
                    {i + 1}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-white font-medium mb-1">{a.action}</p>
                    <div className="flex items-center gap-3 text-[11px] text-gray-500">
                      <span>Owner: <span className="text-gray-300">{a.owner}</span></span>
                      <span>By: <span className={a.deadline === 'Today' ? 'text-red-400 font-medium' : 'text-amber-400'}>{a.deadline}</span></span>
                    </div>
                    <p className="text-[11px] text-emerald-400/70 mt-1">{a.impact}</p>
                  </div>
                </div>
              </div>
            ))}
            <div className="pt-3 border-t border-gray-800">
              <div className="flex items-center gap-1.5">
                <Bot size={12} className="text-blue-400" />
                <span className="text-xs text-gray-500">Survey Readiness Agent — weekly assessment completed at 4:00 AM</span>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
