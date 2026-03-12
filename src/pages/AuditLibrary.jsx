import { Shield, Activity, CheckCircle2, User, Bot, AlertTriangle, FileText, Play, Download, Users } from 'lucide-react';
import { auditCategories, auditTypes } from '../data/complianceData';
import { PageHeader, StatCard, SectionLabel, ActionButton, useModal } from '../components/Widgets';

const complianceColor = (rate) => {
  if (rate >= 90) return { text: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' };
  if (rate >= 75) return { text: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' };
  return { text: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' };
};

const riskColors = {
  Critical: 'bg-red-100 text-red-700 border-red-200',
  High: 'bg-amber-100 text-amber-700 border-amber-200',
  Medium: 'bg-blue-50 text-blue-700 border-blue-200',
  Low: 'bg-gray-50 text-gray-600 border-gray-200',
};

const months = ['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'];

function TrendChart({ trend }) {
  const max = 100;
  return (
    <div>
      <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${trend.length}, 1fr)`, height: 120 }}>
        {trend.map((val, i) => {
          const c = complianceColor(val);
          return (
            <div key={i} className="flex flex-col items-center justify-end">
              <span className="text-xs font-semibold text-gray-600 mb-1">{val}%</span>
              <div className="w-full flex justify-center" style={{ height: `${(val / max) * 100}%` }}>
                <div className={`w-full max-w-10 rounded-t-lg ${c.bg} border ${c.border}`} style={{ height: '100%' }} />
              </div>
            </div>
          );
        })}
      </div>
      <div className="grid gap-2 mt-2" style={{ gridTemplateColumns: `repeat(${trend.length}, 1fr)` }}>
        {months.map(m => <div key={m} className="text-center text-[11px] text-gray-400">{m}</div>)}
      </div>
    </div>
  );
}

function AuditDetailModal({ audit }) {
  const c = complianceColor(audit.complianceRate);

  return (
    <div className="space-y-6">
      {/* Header badges */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="px-2.5 py-1 rounded-lg bg-gray-100 text-gray-700 text-xs font-bold">#{audit.rank}</span>
        <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 text-xs font-semibold border border-blue-100">{audit.fTag}</span>
        <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold border ${riskColors[audit.citationRisk]}`}>
          {audit.citationRisk} Risk
        </span>
        <span className={`ml-auto text-3xl font-bold ${c.text}`}>{audit.complianceRate}%</span>
      </div>

      {/* Stat boxes */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-gray-50 rounded-xl p-4 text-center border border-gray-100">
          <p className="text-2xl font-bold text-gray-900">{audit.totalAudited}</p>
          <p className="text-[11px] text-gray-500 mt-0.5">Residents Audited</p>
        </div>
        <div className="bg-gray-50 rounded-xl p-4 text-center border border-gray-100">
          <p className="text-2xl font-bold text-gray-900">{audit.findingsCount}</p>
          <p className="text-[11px] text-gray-500 mt-0.5">Active Findings</p>
        </div>
        <div className={`${c.bg} rounded-xl p-4 text-center border ${c.border}`}>
          <p className={`text-2xl font-bold ${c.text}`}>{audit.complianceRate}%</p>
          <p className="text-[11px] text-gray-500 mt-0.5">Compliance Rate</p>
        </div>
      </div>

      {/* 6-Month Trend */}
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">6-Month Trend</p>
        <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
          <TrendChart trend={audit.trend} />
        </div>
      </div>

      {/* Description */}
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Regulatory Description</p>
        <p className="text-sm text-gray-700 leading-relaxed">{audit.description}</p>
      </div>

      {/* Agent Checks */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <CheckCircle2 size={15} className="text-blue-600" />
          <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide">What the Agent Checks</p>
        </div>
        <div className="space-y-2">
          {audit.agentChecks.map((check, i) => (
            <div key={i} className="flex items-start gap-2.5">
              <CheckCircle2 size={14} className="text-blue-400 mt-0.5 flex-shrink-0" />
              <span className="text-sm text-gray-700">{check}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Human Approvals */}
      <div className="bg-green-50 border border-green-100 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <User size={15} className="text-green-600" />
          <p className="text-xs font-semibold text-green-700 uppercase tracking-wide">What Humans Approve</p>
        </div>
        <div className="space-y-2">
          {audit.humanApprovals.map((item, i) => (
            <div key={i} className="flex items-start gap-2.5">
              <User size={14} className="text-green-400 mt-0.5 flex-shrink-0" />
              <span className="text-sm text-gray-700">{item}</span>
            </div>
          ))}
        </div>
      </div>

      {/* How the Agent Works */}
      <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl p-5 text-white">
        <div className="flex items-center gap-2 mb-3">
          <Bot size={15} className="text-blue-200" />
          <p className="text-xs font-semibold text-blue-200 uppercase tracking-wide">How the Agent Works</p>
        </div>
        <p className="text-sm leading-relaxed text-blue-50">{audit.whatAgentDoes}</p>
      </div>

      {/* Risk Context */}
      <div className={`rounded-xl p-4 border ${riskColors[audit.citationRisk]}`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Citation Risk</p>
            <p className="text-sm font-semibold text-gray-900">{audit.citationRisk}</p>
          </div>
          <div className="text-right">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Average Fine</p>
            <p className="text-sm font-semibold text-gray-900">{audit.avgFineAmount}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AuditLibrary() {
  const { open } = useModal();

  const avgCompliance = Math.round(auditTypes.reduce((s, a) => s + a.complianceRate, 0) / auditTypes.length);
  const totalFindings = auditTypes.reduce((s, a) => s + a.findingsCount, 0);
  const belowTarget = auditTypes.filter(a => a.complianceRate < 80).length;

  const openAuditModal = (audit) => {
    open({
      title: audit.name,
      content: <AuditDetailModal audit={audit} />,
      actions: (
        <>
          <ActionButton label="Run Audit Now" variant="primary" icon={Play} />
          <ActionButton label="View Findings" variant="outline" icon={FileText} />
          <ActionButton label="Export Report" variant="ghost" icon={Download} />
        </>
      ),
    });
  };

  return (
    <div className="p-6">
      <PageHeader
        title="Audit Library"
        subtitle="20 CMS audit types monitored continuously by AI agents"
        aiSummary={`All 20 audit types running \u2014 ${belowTarget} below 80% compliance target need attention. Average compliance is ${avgCompliance}% with ${totalFindings} active findings this week.`}
      />

      {/* Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-10">
        <StatCard label="Total Audit Types" value="20" icon={Shield} color="blue" />
        <StatCard label="Average Compliance" value={`${avgCompliance}%`} icon={Activity} color="emerald" />
        <StatCard label="Findings This Week" value={totalFindings} icon={AlertTriangle} color="amber" />
        <StatCard label="Residents Monitored" value="658" icon={Users} color="purple" />
      </div>

      {/* Audit Types by Category */}
      {auditCategories.map((category) => {
        const categoryAudits = auditTypes.filter(a => a.category === category.id);
        if (categoryAudits.length === 0) return null;

        return (
          <div key={category.id} className="mb-10">
            <div className="mb-5">
              <SectionLabel>{category.name}</SectionLabel>
              <p className="text-xs text-gray-400 -mt-2 ml-0.5">{category.description}</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {categoryAudits.map((audit) => {
                const c = complianceColor(audit.complianceRate);
                return (
                  <div
                    key={audit.id}
                    className="bg-white rounded-2xl border border-gray-100 p-5 cursor-pointer hover:shadow-md hover:border-gray-200 transition-all active:scale-[0.99]"
                    onClick={() => openAuditModal(audit)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-start gap-3 min-w-0">
                        <span className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 text-[11px] font-bold text-gray-500">
                          {audit.rank}
                        </span>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-900 leading-tight">{audit.name}</p>
                          <p className="text-[11px] text-gray-400 mt-0.5">{audit.fTag}</p>
                        </div>
                      </div>
                      <span className={`text-2xl font-bold ${c.text} flex-shrink-0 ml-3`}>
                        {audit.complianceRate}%
                      </span>
                    </div>

                    <p className="text-xs text-gray-500 mb-2.5">
                      {audit.totalAudited} residents audited &middot; {audit.findingsCount} findings &middot; Last run: {audit.lastRun}
                    </p>

                    <div className="flex items-center gap-3 text-[11px] text-gray-400">
                      <span className="flex items-center gap-1">
                        <Bot size={12} className="text-blue-500" />
                        Agent handles {audit.agentChecks.length} checks
                      </span>
                      <span className="flex items-center gap-1">
                        <User size={12} className="text-green-500" />
                        Humans approve {audit.humanApprovals.length} decisions
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
