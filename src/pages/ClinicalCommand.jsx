import { AlertTriangle, Activity, Shield, TrendingUp, TrendingDown, Minus, Heart, Brain, Pill, FileWarning, Users, ClipboardList, Bot, ChevronRight } from 'lucide-react';
import { clinicalData } from '../data/mockData';
import { PageHeader, StatCard, Card, PriorityBadge, ActionButton } from '../components/Widgets';

export default function ClinicalCommand() {
  const { metrics, highRiskResidents } = clinicalData;

  const trendIcon = (trend) => {
    if (trend === 'worsening') return <TrendingUp size={14} className="text-red-400" />;
    if (trend === 'improving') return <TrendingDown size={14} className="text-emerald-400" />;
    return <Minus size={14} className="text-gray-400" />;
  };

  const trendLabel = (trend) => {
    if (trend === 'worsening') return <span className="text-red-400 text-[10px]">Worsening</span>;
    if (trend === 'improving') return <span className="text-emerald-400 text-[10px]">Improving</span>;
    return <span className="text-gray-400 text-[10px]">Stable</span>;
  };

  const riskScoreColor = (score) => {
    if (score >= 85) return 'text-red-400';
    if (score >= 70) return 'text-amber-400';
    return 'text-emerald-400';
  };

  const interventions = [
    { resident: 'Margaret Chen', room: '214B', action: 'Immediate care conference — 3rd fall in 30 days triggers escalation protocol', priority: 'Critical', agent: 'Clinical Monitoring Agent' },
    { resident: 'Robert Williams', room: '118A', action: 'Dietary consult + lab panel — 7.2% weight loss requires physician notification within 24hrs', priority: 'High', agent: 'Clinical Monitoring Agent' },
    { resident: 'Helen Garcia', room: '410B', action: 'Social work referral + depression screening follow-up — PHQ-9 reassessment due', priority: 'High', agent: 'Clinical Monitoring Agent' },
    { resident: 'Dorothy Evans', room: '305C', action: 'Wound care protocol review — Stage 3 wound requires weekly measurement documentation', priority: 'Medium', agent: 'Clinical Monitoring Agent' },
  ];

  const docExceptions = [
    { type: 'MDS Assessment', count: 6, details: 'Overdue quarterly assessments — 4 at Heritage Oaks, 2 at Meadowbrook' },
    { type: 'Care Plan Updates', count: 8, details: 'Care plans not updated within 48hrs of significant change' },
    { type: 'Physician Orders', count: 5, details: 'Verbal orders not co-signed within required timeframe' },
    { type: 'Incident Reports', count: 4, details: 'Incomplete incident documentation — missing witness statements or follow-up' },
  ];

  return (
    <div className="min-h-screen bg-gray-950 p-6">
      <PageHeader
        title="Clinical Command Center"
        subtitle="Real-time clinical risk monitoring across all facilities"
        aiSummary="2 residents require immediate intervention: Margaret Chen (214B) has had her 3rd fall in 30 days — care conference is mandatory today. Robert Williams (118A) shows 7.2% weight loss with declining appetite. 15 overdue assessments across 3 facilities create survey exposure on F-tags 689 and 692. Infection rate remains low at 2 active cases."
        riskLevel="high"
      />

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 mb-6">
        <StatCard label="Falls (30d)" value={metrics.falls} icon={AlertTriangle} color="red" change="+2 vs prior" changeType="negative" />
        <StatCard label="Active Wounds" value={metrics.wounds} icon={Activity} color="amber" change="3 Stage 3+" changeType="negative" />
        <StatCard label="Infections" value={metrics.infections} icon={Shield} color="emerald" change="Below avg" changeType="positive" />
        <StatCard label="Rehosp. Rate" value={`${metrics.rehospRate}%`} icon={Heart} color="amber" change="Target: <10%" changeType="neutral" />
        <StatCard label="Psych Reviews Due" value={metrics.psychReview} icon={Brain} color="purple" change="Due this week" changeType="neutral" />
        <StatCard label="Overdue Assessments" value={metrics.overdueAssessments} icon={ClipboardList} color="red" change="+5 vs last week" changeType="negative" />
        <StatCard label="Doc Exceptions" value={metrics.docExceptions} icon={FileWarning} color="amber" change="23 open" changeType="negative" />
      </div>

      {/* High-Risk Residents Table */}
      <Card title="High-Risk Residents" badge={`${highRiskResidents.length}`} className="mb-6">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-500 text-xs border-b border-gray-800">
                <th className="text-left py-2 font-medium">Resident</th>
                <th className="text-left py-2 font-medium">Room</th>
                <th className="text-left py-2 font-medium">Unit</th>
                <th className="text-center py-2 font-medium">Risk Score</th>
                <th className="text-left py-2 font-medium">Risk Drivers</th>
                <th className="text-center py-2 font-medium">Trend</th>
              </tr>
            </thead>
            <tbody>
              {highRiskResidents.map((r, i) => (
                <tr key={i} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                  <td className="py-3 text-white font-medium">{r.name}</td>
                  <td className="py-3 text-gray-300">{r.room}</td>
                  <td className="py-3 text-gray-400">{r.unit}</td>
                  <td className="py-3 text-center">
                    <span className={`text-lg font-bold ${riskScoreColor(r.riskScore)}`}>{r.riskScore}</span>
                  </td>
                  <td className="py-3">
                    <div className="flex flex-wrap gap-1">
                      {r.drivers.map((d, j) => (
                        <span key={j} className="px-2 py-0.5 rounded text-[10px] bg-gray-800 text-gray-300 border border-gray-700">
                          {d}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="py-3">
                    <div className="flex items-center justify-center gap-1">
                      {trendIcon(r.trend)}
                      {trendLabel(r.trend)}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Agent-Suggested Interventions */}
        <Card title="Agent-Suggested Interventions" badge={`${interventions.length}`}>
          <div className="space-y-3">
            {interventions.map((item, i) => (
              <div key={i} className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/50">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-white text-sm font-medium">{item.resident}</span>
                    <span className="text-gray-500 text-xs">Room {item.room}</span>
                  </div>
                  <PriorityBadge priority={item.priority} />
                </div>
                <p className="text-sm text-gray-300 mb-3">{item.action}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Bot size={12} className="text-blue-400" />
                    <span className="text-[11px] text-gray-500">{item.agent}</span>
                  </div>
                  <div className="flex gap-2">
                    <ActionButton label="Accept" variant="success" />
                    <ActionButton label="Modify" variant="ghost" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Documentation Exceptions */}
        <Card title="Documentation Exceptions" badge={`${metrics.docExceptions}`}>
          <div className="space-y-3">
            {docExceptions.map((item, i) => (
              <div key={i} className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white text-sm font-medium">{item.type}</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/30">
                    {item.count} open
                  </span>
                </div>
                <p className="text-sm text-gray-400">{item.details}</p>
              </div>
            ))}
            <div className="pt-3 border-t border-gray-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Bot size={12} className="text-blue-400" />
                  <span className="text-xs text-gray-500">Clinical Agent scanned 540 records at 6:00 AM</span>
                </div>
                <button className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1">
                  View all exceptions <ChevronRight size={12} />
                </button>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
