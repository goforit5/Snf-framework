import { useState } from 'react';
import {
  Shield, Activity, Bot, User, CheckCircle2, AlertTriangle, Clock, TrendingUp,
  FileCheck, Building2, Stethoscope, Pill, Bug, FileText, Heart, Cpu, Zap,
  ChevronRight, ChevronDown, ChevronUp, Target, Eye, Play, Download, RefreshCw,
  Database, ArrowRight, Wifi, WifiOff, CircleDot, Check, X as XIcon, Sparkles
} from 'lucide-react';
import {
  auditCategories, auditTypes, complianceTrends, agentMetrics,
  complianceWins, complianceRisks, complianceFacilities,
  complianceFindings, pccSyncData, complianceSummary
} from '../data/complianceData';
import {
  PageHeader, StatCard, Card, ActionButton, ClickableRow, useModal,
  ConfidenceBar, PriorityBadge, StatusBadge, AgentHumanSplit,
  SectionLabel, ProgressBar, EmptyAgentBadge
} from '../components/Widgets';

/* ─── Color Lookup Maps (Tailwind JIT safe) ─── */
const categoryColorMap = {
  red:     { bg: 'bg-red-50',     text: 'text-red-700',     border: 'border-red-200',     bar: 'bg-red-500',     light: 'bg-red-100' },
  purple:  { bg: 'bg-purple-50',  text: 'text-purple-700',  border: 'border-purple-200',  bar: 'bg-purple-500',  light: 'bg-purple-100' },
  amber:   { bg: 'bg-amber-50',   text: 'text-amber-700',   border: 'border-amber-200',   bar: 'bg-amber-500',   light: 'bg-amber-100' },
  blue:    { bg: 'bg-blue-50',    text: 'text-blue-700',    border: 'border-blue-200',    bar: 'bg-blue-500',    light: 'bg-blue-100' },
  emerald: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', bar: 'bg-emerald-500', light: 'bg-emerald-100' },
  cyan:    { bg: 'bg-cyan-50',    text: 'text-cyan-700',    border: 'border-cyan-200',    bar: 'bg-cyan-500',    light: 'bg-cyan-100' },
};

const complianceColor = (rate) => {
  if (rate >= 90) return { text: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200', bar: 'bg-green-500' };
  if (rate >= 75) return { text: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', bar: 'bg-amber-500' };
  return { text: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', bar: 'bg-red-500' };
};

const severityColorMap = {
  Critical: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
  High:     { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  Medium:   { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  Low:      { bg: 'bg-gray-50', text: 'text-gray-600', border: 'border-gray-200' },
};

const urgencyColorMap = {
  Critical: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', dot: 'bg-red-500' },
  High:     { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', dot: 'bg-amber-500' },
  Medium:   { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', dot: 'bg-blue-500' },
};

/* ─── Mini Sparkline ─── */
function Sparkline({ data, height = 32, color = 'bg-blue-400' }) {
  if (!data || data.length === 0) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  return (
    <div className="flex items-end gap-px" style={{ height }}>
      {data.map((val, i) => (
        <div
          key={i}
          className={`flex-1 rounded-t-sm ${i === data.length - 1 ? color : 'bg-gray-200'}`}
          style={{ height: `${Math.max(((val - min) / range) * 100, 8)}%` }}
        />
      ))}
    </div>
  );
}

/* ─── Category Icon ─── */
function CategoryIcon({ category }) {
  const icons = {
    clinical: Stethoscope,
    medication: Pill,
    infection: Bug,
    documentation: FileText,
    rights: Heart,
    devices: Cpu,
  };
  const Icon = icons[category] || Shield;
  return <Icon size={14} />;
}

export default function ClinicalCompliance() {
  const { open } = useModal();
  const [expandedPcc, setExpandedPcc] = useState(false);

  const pendingFindings = complianceFindings.filter(f => f.status === 'pending');
  const months = complianceTrends.months;

  /* ─── Audit Type Modal ─── */
  const openAuditTypeModal = (audit) => {
    const cc = complianceColor(audit.complianceRate);

    open({
      title: `${audit.fTag}: ${audit.name}`,
      content: (
        <div className="space-y-5">
          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-gray-50 rounded-xl p-3 text-center border border-gray-100">
              <div className="text-2xl font-bold text-gray-900">{audit.totalAudited}</div>
              <div className="text-[10px] text-gray-500 mt-0.5">Records Audited</div>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 text-center border border-gray-100">
              <div className="text-2xl font-bold text-amber-600">{audit.findingsCount}</div>
              <div className="text-[10px] text-gray-500 mt-0.5">Open Findings</div>
            </div>
            <div className={`rounded-xl p-3 text-center border ${cc.bg} ${cc.border}`}>
              <div className={`text-2xl font-bold ${cc.text}`}>{audit.complianceRate}%</div>
              <div className="text-[10px] text-gray-500 mt-0.5">Compliance Rate</div>
            </div>
          </div>

          {/* Description */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Regulatory Description</p>
            <p className="text-sm text-gray-700 leading-relaxed">{audit.description}</p>
          </div>

          {/* What Agent Checks */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">What the Agent Checks</p>
            <div className="space-y-1.5">
              {audit.agentChecks.map((check, i) => (
                <div key={i} className="flex items-start gap-2 text-sm text-gray-700">
                  <CheckCircle2 size={14} className="text-blue-500 mt-0.5 flex-shrink-0" />
                  <span>{check}</span>
                </div>
              ))}
            </div>
          </div>

          {/* What Humans Approve */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">What Humans Approve</p>
            <div className="space-y-1.5">
              {audit.humanApprovals.map((item, i) => (
                <div key={i} className="flex items-start gap-2 text-sm text-gray-700">
                  <User size={14} className="text-green-500 mt-0.5 flex-shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* What the Agent Does */}
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Bot size={14} className="text-blue-600" />
              <p className="text-xs font-semibold text-blue-700">What the Agent Does</p>
            </div>
            <p className="text-sm text-gray-700 leading-relaxed">{audit.whatAgentDoes}</p>
          </div>

          {/* Citation Risk */}
          <div className="flex items-center gap-4">
            <div>
              <p className="text-[10px] text-gray-500 uppercase font-semibold">Citation Risk</p>
              <PriorityBadge priority={audit.citationRisk} />
            </div>
            <div>
              <p className="text-[10px] text-gray-500 uppercase font-semibold">Fine Range</p>
              <span className="text-sm font-semibold text-gray-900">{audit.avgFineAmount}</span>
            </div>
          </div>

          {/* 6-month trend */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">6-Month Compliance Trend</p>
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
              <div className="flex items-end gap-1.5" style={{ height: 80 }}>
                {audit.trend.map((val, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-[9px] text-gray-500 font-mono">{val}%</span>
                    <div className="w-full rounded-t" style={{ height: `${val}%`, backgroundColor: val >= 90 ? '#22c55e' : val >= 75 ? '#f59e0b' : '#ef4444' }} />
                  </div>
                ))}
              </div>
              <div className="flex justify-between mt-2">
                {months.map((m, i) => (
                  <span key={i} className="flex-1 text-center text-[9px] text-gray-400">{m}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      ),
      actions: (
        <>
          <ActionButton label="Run Audit Now" icon={Play} variant="primary" />
          <ActionButton label="View Findings" icon={Eye} variant="outline" />
        </>
      ),
    });
  };

  /* ─── Facility Modal ─── */
  const openFacilityModal = (facility) => {
    const cc = complianceColor(facility.complianceScore);
    const facilityFindings = complianceFindings.filter(f => f.facility === facility.name);

    open({
      title: facility.name,
      content: (
        <div className="space-y-5">
          {/* Score + trend */}
          <div className="flex items-center gap-6">
            <div className="text-center">
              <div className={`text-4xl font-bold ${cc.text}`}>{facility.complianceScore}%</div>
              <div className="text-[10px] text-gray-500 mt-0.5">Compliance Score</div>
            </div>
            <div className="flex-1">
              <Sparkline data={facility.trend} height={48} color={cc.bar} />
              <div className="flex justify-between mt-1">
                {months.map((m, i) => (
                  <span key={i} className="text-[9px] text-gray-400">{m}</span>
                ))}
              </div>
            </div>
          </div>

          {/* Facility info */}
          <div className="flex gap-4 text-xs text-gray-600">
            <span>{facility.city}</span>
            <span>{facility.beds} beds</span>
            <span>Census: {facility.census}</span>
            <span>{facility.openFindings} open findings</span>
          </div>

          {/* Category Scores */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Category Scores</p>
            <div className="space-y-3">
              {Object.entries(facility.categoryScores).map(([key, val]) => {
                const cat = auditCategories.find(c => c.id === key);
                const catColor = complianceColor(val);
                return (
                  <div key={key}>
                    <div className="flex justify-between mb-1">
                      <span className="text-xs text-gray-600 font-medium capitalize">{cat?.name || key}</span>
                      <span className={`text-xs font-bold ${catColor.text}`}>{val}%</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${catColor.bar}`} style={{ width: `${val}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* F-Tag Risks */}
          {facility.fTagRisks.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">F-Tag Risks</p>
              <div className="flex flex-wrap gap-1.5">
                {facility.fTagRisks.map((tag, i) => (
                  <span key={i} className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-red-50 text-red-600 border border-red-100">{tag}</span>
                ))}
              </div>
            </div>
          )}

          {/* PCC Status */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
            {facility.pccConnected ? (
              <>
                <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
                <span className="text-xs text-gray-700 font-medium">PCC Connected</span>
                <span className="text-[10px] text-gray-400 ml-auto">Last sync: {facility.lastPccSync}</span>
              </>
            ) : (
              <>
                <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                <span className="text-xs text-gray-700 font-medium">PCC Not Connected</span>
                <span className="text-[10px] text-red-500 ml-auto">Pending IT onboarding</span>
              </>
            )}
          </div>

          {/* Open findings for this facility */}
          {facilityFindings.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Open Findings</p>
              <div className="space-y-2">
                {facilityFindings.map((f, i) => (
                  <div key={i} className="p-3 rounded-lg bg-gray-50 border border-gray-100">
                    <div className="flex items-center gap-2 mb-1">
                      <PriorityBadge priority={f.severity} />
                      <span className="text-[10px] text-gray-400 font-mono">{f.fTag}</span>
                    </div>
                    <p className="text-sm text-gray-700">{f.title}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ),
      actions: (
        <>
          <ActionButton label="Run Full Audit" icon={Play} variant="primary" />
          <ActionButton label="Export Report" icon={Download} variant="outline" />
        </>
      ),
    });
  };

  /* ─── Finding Modal ─── */
  const openFindingModal = (finding) => {
    open({
      title: finding.title,
      content: (
        <div className="space-y-5">
          {/* Badges */}
          <div className="flex items-center gap-2 flex-wrap">
            <PriorityBadge priority={finding.severity} />
            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-600 border border-amber-100">{finding.fTag}</span>
            <StatusBadge status={finding.status} />
            <span className="text-[10px] text-gray-400 ml-auto">Detected: {finding.detectedAt}</span>
          </div>

          {/* Details */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Full Details</p>
            <p className="text-sm text-gray-700 leading-relaxed">{finding.details}</p>
          </div>

          {/* Affected Residents */}
          {finding.residents.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Affected Residents</p>
              <div className="space-y-1.5">
                {finding.residents.map((r, i) => (
                  <div key={i} className="flex items-center gap-3 p-2.5 bg-gray-50 rounded-lg border border-gray-100">
                    <span className="text-sm font-medium text-gray-900">{r.name}</span>
                    <span className="text-xs text-gray-400">Room {r.room}</span>
                    <span className="text-xs text-red-500 ml-auto">{r.issue}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Fix Steps */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Agent-Recommended Fix Steps</p>
            <div className="space-y-2">
              {finding.fixSteps.map((step, i) => (
                <div key={i} className="flex items-start gap-3 p-2.5 bg-gray-50 rounded-lg border border-gray-100">
                  <div className="w-5 h-5 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-[10px] font-bold text-blue-600">{i + 1}</span>
                  </div>
                  <p className="text-sm text-gray-700">{step}</p>
                </div>
              ))}
            </div>
          </div>

          {/* PCC Action */}
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1.5">
              <Database size={14} className="text-blue-600" />
              <p className="text-xs font-semibold text-blue-700">PCC Write-Back</p>
            </div>
            <p className="text-sm text-gray-700">{finding.pccAction}</p>
          </div>

          {/* Confidence + Risk */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-[10px] text-gray-500 uppercase font-semibold mb-1.5">Agent Confidence</p>
              <ConfidenceBar value={finding.agentConfidence} />
            </div>
            <div>
              <p className="text-[10px] text-gray-500 uppercase font-semibold mb-1">Citation Risk</p>
              <span className="text-sm font-semibold text-red-600">{finding.citationRisk}</span>
              <p className="text-[10px] text-gray-400 mt-0.5">Fine: {finding.estimatedFine}</p>
            </div>
          </div>
        </div>
      ),
      actions: (
        <>
          <ActionButton label="Approve Fix" icon={Check} variant="success" />
          <ActionButton label="Modify" variant="primary" />
          <ActionButton label="Dismiss" variant="ghost" />
        </>
      ),
    });
  };

  /* ─── Win / Risk Item Modal ─── */
  const openWinModal = (win) => {
    open({
      title: win.title,
      content: (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-green-50 text-green-700 border border-green-200">{win.impact}</span>
            <span className="px-2.5 py-1 rounded-lg text-xs font-medium bg-gray-100 text-gray-600">{win.category}</span>
          </div>
          <p className="text-sm text-gray-700 leading-relaxed">{win.detail}</p>
          <div className="bg-green-50 border border-green-100 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <Bot size={14} className="text-green-600" />
              <p className="text-xs font-semibold text-green-700">Agent Impact</p>
            </div>
            <p className="text-sm text-gray-700">This improvement was driven by continuous AI agent monitoring with zero additional staffing.</p>
          </div>
        </div>
      ),
    });
  };

  const openRiskModal = (risk) => {
    open({
      title: risk.title,
      content: (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <PriorityBadge priority={risk.urgency} />
            {risk.fTag !== 'N/A' && (
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-600 border border-amber-100">{risk.fTag}</span>
            )}
          </div>
          <p className="text-sm text-gray-700 leading-relaxed">{risk.detail}</p>
          <div className="bg-red-50 border border-red-100 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle size={14} className="text-red-600" />
              <p className="text-xs font-semibold text-red-700">Action Required</p>
            </div>
            <p className="text-sm text-gray-700">Agent has flagged this item for immediate attention. Continued decline will increase survey citation risk.</p>
          </div>
        </div>
      ),
      actions: (
        <>
          <ActionButton label="Create Action Plan" variant="primary" />
          <ActionButton label="Assign" variant="outline" />
        </>
      ),
    });
  };

  /* ════════════════════════════════════════════ RENDER ════════════════════════════════════════════ */
  return (
    <div className="p-6 bg-[#f5f5f7] min-h-screen">

      {/* ── 1. Header ── */}
      <PageHeader
        title="Clinical Compliance Engine"
        subtitle="AI-Powered Regulatory Compliance Monitoring -- 20 CMS Audit Types"
        aiSummary={`20 audit types running continuously across ${complianceSummary.facilitiesMonitored} facilities. Overall compliance at ${complianceSummary.overallCompliance}% (up 8 points in 6 months). ${complianceSummary.criticalFindings} critical findings need nurse approval -- PRN psychotropic documentation at Heritage Oaks is the top priority. Agents completed ${agentMetrics.totalAuditsThisWeek.toLocaleString()} automated audits this week, saving ${agentMetrics.hoursAutoSaved} staff hours. ${complianceSummary.pendingApproval} items awaiting one-tap nurse approval.`}
        riskLevel="medium"
      />

      {/* ── 2. Hero Stats Row ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 mb-8">
        <StatCard label="Overall Compliance" value={`${complianceSummary.overallCompliance}%`} icon={Shield} color="blue" change="+8pts 6mo" changeType="positive" />
        <StatCard label="Active Findings" value={complianceSummary.totalFindings} icon={AlertTriangle} color="red" change={`${complianceSummary.criticalFindings} critical`} changeType="negative" />
        <StatCard label="Audit Types Active" value={complianceSummary.totalAuditTypes} icon={FileCheck} color="emerald" change="All 20 running" changeType="positive" />
        <StatCard label="Residents Monitored" value={complianceSummary.residentsMonitored} icon={Heart} color="purple" change="7 facilities" changeType="positive" />
        <StatCard label="Checks / Day" value={complianceSummary.totalChecksPerDay.toLocaleString()} icon={Activity} color="cyan" change="Automated" changeType="positive" />
        <StatCard label="Hours Saved / Week" value={agentMetrics.hoursAutoSaved} icon={Clock} color="emerald" change={`${agentMetrics.fteSaved} FTEs`} changeType="positive" />
        <StatCard label="Pending Approvals" value={complianceSummary.pendingApproval} icon={CheckCircle2} color="amber" change="Avg 8 min" changeType="positive" />
        <StatCard label="PCC Connected" value={`${complianceSummary.pccConnected}/${complianceSummary.facilitiesMonitored}`} icon={Database} color="blue" change="Real-time sync" changeType="positive" />
      </div>

      {/* ── 3. Agent Efficiency Dashboard ── */}
      <Card title="Agent Efficiency Dashboard" badge="KEY METRIC" className="mb-8"
        action={<EmptyAgentBadge agent="Compliance Engine" />}>
        <div className="space-y-6">
          {/* Agent vs Human Split */}
          <AgentHumanSplit
            agentCount={agentMetrics.totalAuditsThisWeek}
            humanCount={agentMetrics.totalHumanApprovals}
            agentLabel="Automated Audits"
            humanLabel="Human Approvals"
          />

          {/* Mini stats row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100 text-center">
              <div className="text-2xl font-bold text-blue-700">{agentMetrics.accuracy}%</div>
              <div className="text-[10px] text-gray-500 font-medium mt-0.5">Detection Accuracy</div>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border border-green-100 text-center">
              <div className="text-2xl font-bold text-green-700">{agentMetrics.avgTimeToDetect}</div>
              <div className="text-[10px] text-gray-500 font-medium mt-0.5">Avg Detection Time</div>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-xl p-4 border border-purple-100 text-center">
              <div className="text-2xl font-bold text-purple-700">{agentMetrics.fteSaved}</div>
              <div className="text-[10px] text-gray-500 font-medium mt-0.5">FTEs Replaced</div>
            </div>
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-4 border border-amber-100 text-center">
              <div className="text-2xl font-bold text-amber-700">{agentMetrics.costSavedMonthly}</div>
              <div className="text-[10px] text-gray-500 font-medium mt-0.5">Saved / Month</div>
            </div>
          </div>

          {/* Weekly Activity Bar Chart */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Daily Audit Activity This Week</p>
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
              <div className="flex items-end gap-3" style={{ height: 120 }}>
                {agentMetrics.weeklyActivity.map((d, i) => {
                  const maxAudits = Math.max(...agentMetrics.weeklyActivity.map(w => w.audits));
                  const pct = (d.audits / maxAudits) * 100;
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center">
                      <span className="text-[10px] text-gray-500 font-mono mb-1">{d.audits}</span>
                      <div className="w-full rounded-t-lg bg-blue-400 transition-all relative" style={{ height: `${pct}%`, minHeight: 8 }}>
                        {d.findings > 0 && (
                          <div className="absolute top-0 left-0 right-0 bg-amber-400 rounded-t-lg" style={{ height: `${(d.findings / d.audits) * 100}%`, minHeight: 3, maxHeight: '100%' }} />
                        )}
                      </div>
                      <span className="text-[10px] text-gray-500 mt-2 font-medium">{d.day}</span>
                    </div>
                  );
                })}
              </div>
              <div className="flex items-center justify-center gap-6 mt-3 pt-3 border-t border-gray-200">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded bg-blue-400" />
                  <span className="text-[10px] text-gray-500">Automated audits</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded bg-amber-400" />
                  <span className="text-[10px] text-gray-500">Findings detected</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* ── 4. Compliance Trend Chart ── */}
      <Card title="6-Month Compliance Trend" className="mb-8"
        action={<span className="text-xs text-gray-400 font-medium">Target: 90%</span>}>
        <div className="space-y-6">
          {/* Main bar chart */}
          <div className="bg-gray-50 rounded-xl p-6 border border-gray-100">
            <div className="relative" style={{ height: 200 }}>
              {/* Target line */}
              <div className="absolute left-0 right-0 border-t-2 border-dashed border-green-300" style={{ bottom: `${(90 / 100) * 100}%` }}>
                <span className="absolute -top-4 right-0 text-[10px] text-green-600 font-semibold">90% Target</span>
              </div>
              <div className="flex items-end gap-4 h-full">
                {complianceTrends.overall.map((val, i) => {
                  const color = val >= 90 ? 'bg-green-500' : val >= 80 ? 'bg-blue-500' : val >= 75 ? 'bg-amber-500' : 'bg-red-500';
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center">
                      <span className="text-sm font-bold text-gray-700 mb-2">{val}%</span>
                      <div className={`w-full rounded-t-xl ${color} transition-all shadow-sm`} style={{ height: `${val}%` }} />
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="flex justify-between mt-3">
              {months.map((m, i) => (
                <span key={i} className="flex-1 text-center text-xs text-gray-500 font-medium">{m}</span>
              ))}
            </div>
          </div>

          {/* Facility sparklines */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">By Facility</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {Object.entries(complianceTrends.byFacility).map(([name, data]) => {
                const current = data[data.length - 1];
                const cc = complianceColor(current);
                return (
                  <div key={name} className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] text-gray-600 font-medium truncate">{name}</span>
                      <span className={`text-sm font-bold ${cc.text}`}>{current}%</span>
                    </div>
                    <Sparkline data={data} height={24} color={cc.bar} />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Category sparklines */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">By Category</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {Object.entries(complianceTrends.byCategory).map(([name, data]) => {
                const current = data[data.length - 1];
                const cc = complianceColor(current);
                return (
                  <div key={name} className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] text-gray-600 font-medium truncate">{name}</span>
                      <span className={`text-xs font-bold ${cc.text}`}>{current}%</span>
                    </div>
                    <Sparkline data={data} height={20} color={cc.bar} />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </Card>

      {/* ── 5. All 20 Audit Types by Category ── */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-6">
          <h2 className="text-lg font-bold text-gray-900">20 CMS Audit Types</h2>
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-50 text-blue-600 border border-blue-100">All Running</span>
        </div>

        {auditCategories.map((cat) => {
          const catAudits = auditTypes.filter(a => a.category === cat.id);
          const colors = categoryColorMap[cat.color] || categoryColorMap.blue;
          if (catAudits.length === 0) return null;

          return (
            <div key={cat.id} className="mb-6">
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-7 h-7 rounded-lg ${colors.light} flex items-center justify-center`}>
                  <CategoryIcon category={cat.id} />
                </div>
                <SectionLabel>{cat.name}</SectionLabel>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {catAudits.map((audit) => {
                  const cc = complianceColor(audit.complianceRate);
                  return (
                    <div
                      key={audit.id}
                      className="bg-white rounded-2xl p-4 border border-gray-100 hover:shadow-md hover:border-gray-200 transition-all cursor-pointer active:scale-[0.98]"
                      onClick={() => openAuditTypeModal(audit)}
                    >
                      {/* Header */}
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-md bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-500">
                            {audit.rank}
                          </span>
                          <span className="text-[10px] font-mono text-gray-400">{audit.fTag}</span>
                        </div>
                        <span className={`text-lg font-bold ${cc.text}`}>{audit.complianceRate}%</span>
                      </div>

                      {/* Name */}
                      <p className="text-sm font-semibold text-gray-900 mb-2 leading-snug">{audit.name}</p>

                      {/* Sparkline */}
                      <div className="mb-3">
                        <Sparkline data={audit.trend} height={20} color={cc.bar} />
                      </div>

                      {/* Footer */}
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-gray-400">{audit.findingsCount} findings</span>
                        <div className="flex items-center gap-2 text-[10px]">
                          <span className="flex items-center gap-0.5 text-blue-500">
                            <Bot size={10} /> {audit.agentActions}
                          </span>
                          <span className="flex items-center gap-0.5 text-green-500">
                            <User size={10} /> {audit.humanActions}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── 6. Facility Compliance Grid ── */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <h2 className="text-lg font-bold text-gray-900">Facility Compliance</h2>
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-gray-100 text-gray-500">{complianceFacilities.length} facilities</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {complianceFacilities.map((facility) => {
            const cc = complianceColor(facility.complianceScore);
            return (
              <div
                key={facility.id}
                className={`bg-white rounded-2xl p-5 border hover:shadow-md transition-all cursor-pointer active:scale-[0.98] ${facility.complianceScore < 75 ? 'border-red-200' : 'border-gray-100'}`}
                onClick={() => openFacilityModal(facility)}
              >
                {/* Score + Name */}
                <div className="flex items-start justify-between mb-1">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900">{facility.name}</h3>
                    <p className="text-[10px] text-gray-400 mt-0.5">{facility.city} &middot; {facility.beds} beds &middot; Census {facility.census}</p>
                  </div>
                  <div className={`text-2xl font-bold ${cc.text}`}>{facility.complianceScore}%</div>
                </div>

                {/* Category bars */}
                <div className="grid grid-cols-3 gap-x-3 gap-y-1.5 mt-3 mb-3">
                  {Object.entries(facility.categoryScores).map(([key, val]) => {
                    const catObj = auditCategories.find(c => c.id === key);
                    const barColor = complianceColor(val);
                    return (
                      <div key={key}>
                        <div className="flex justify-between mb-0.5">
                          <span className="text-[9px] text-gray-400 truncate capitalize">{catObj?.name?.split(' ')[0] || key}</span>
                          <span className={`text-[9px] font-bold ${barColor.text}`}>{val}</span>
                        </div>
                        <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${barColor.bar}`} style={{ width: `${val}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Sparkline */}
                <Sparkline data={facility.trend} height={20} color={cc.bar} />

                {/* Footer */}
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                  <div className="flex items-center gap-1.5">
                    {facility.pccConnected ? (
                      <div className="w-2 h-2 rounded-full bg-green-500" />
                    ) : (
                      <div className="w-2 h-2 rounded-full bg-red-400" />
                    )}
                    <span className="text-[10px] text-gray-400">
                      {facility.pccConnected ? `PCC ${facility.lastPccSync}` : 'PCC offline'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-gray-400">{facility.openFindings} findings</span>
                    {facility.fTagRisks.length > 0 && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-red-50 text-red-500">{facility.fTagRisks.length} risks</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── 7. Findings Needing Nurse Approval ── */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <h2 className="text-lg font-bold text-gray-900">Findings Needing Nurse Approval</h2>
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-600 border border-amber-100">{pendingFindings.length} pending</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {pendingFindings.map((finding) => (
            <div
              key={finding.id}
              className="bg-white rounded-2xl p-5 border border-gray-100 hover:shadow-md transition-all cursor-pointer active:scale-[0.98]"
              onClick={() => openFindingModal(finding)}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <PriorityBadge priority={finding.severity} />
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-600 border border-amber-100">{finding.fTag}</span>
                </div>
                <span className="text-[10px] text-gray-400">{finding.detectedAt}</span>
              </div>

              {/* Title */}
              <p className="text-sm font-semibold text-gray-900 mb-1">{finding.title}</p>
              <p className="text-xs text-gray-400 mb-3">{finding.facility}</p>

              {/* Suggested Fix */}
              <div className="bg-green-50 border border-green-100 rounded-xl p-3 mb-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <Sparkles size={12} className="text-green-600" />
                  <span className="text-[10px] font-semibold text-green-700">Agent-Suggested Fix</span>
                </div>
                <p className="text-xs text-gray-700 leading-relaxed">{finding.suggestedFix}</p>
              </div>

              {/* Confidence + Risk */}
              <div className="mb-3">
                <ConfidenceBar value={finding.agentConfidence} />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 text-[10px]">
                  <span className="text-red-500 font-medium">{finding.citationRisk}</span>
                  <span className="text-gray-400">Fine: {finding.estimatedFine}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Database size={10} className="text-blue-500" />
                  <span className="text-[10px] text-blue-500">Will sync to PCC</span>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
                <ActionButton label="Approve Fix" icon={Check} variant="success" onClick={(e) => e.stopPropagation()} />
                <ActionButton label="Review" icon={Eye} variant="outline" onClick={(e) => { e.stopPropagation(); openFindingModal(finding); }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── 8. Improvements & Risk Watch ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Compliance Wins */}
        <div>
          <div className="flex items-center gap-3 mb-4">
            <h2 className="text-lg font-bold text-gray-900">Compliance Wins</h2>
            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-green-50 text-green-600 border border-green-100">{complianceWins.length}</span>
          </div>
          <div className="space-y-3">
            {complianceWins.map((win, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl p-4 border border-green-100 hover:shadow-md transition-all cursor-pointer active:scale-[0.98]"
                onClick={() => openWinModal(win)}
              >
                <div className="flex items-start justify-between mb-2">
                  <p className="text-sm font-semibold text-gray-900 flex-1 mr-3">{win.title}</p>
                  <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-green-50 text-green-700 border border-green-200 whitespace-nowrap">{win.impact}</span>
                </div>
                <p className="text-xs text-gray-500 leading-relaxed">{win.detail}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-500">{win.category}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Watch Items */}
        <div>
          <div className="flex items-center gap-3 mb-4">
            <h2 className="text-lg font-bold text-gray-900">Watch Items</h2>
            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-red-50 text-red-600 border border-red-100">{complianceRisks.length}</span>
          </div>
          <div className="space-y-3">
            {complianceRisks.map((risk, i) => {
              const uc = urgencyColorMap[risk.urgency] || urgencyColorMap.Medium;
              return (
                <div
                  key={i}
                  className={`bg-white rounded-2xl p-4 border hover:shadow-md transition-all cursor-pointer active:scale-[0.98] ${risk.urgency === 'Critical' ? 'border-red-200' : risk.urgency === 'High' ? 'border-amber-200' : 'border-gray-100'}`}
                  onClick={() => openRiskModal(risk)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${uc.dot}`} />
                      <PriorityBadge priority={risk.urgency} />
                      {risk.fTag !== 'N/A' && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-600 border border-amber-100">{risk.fTag}</span>
                      )}
                    </div>
                  </div>
                  <p className="text-sm font-semibold text-gray-900 mb-1">{risk.title}</p>
                  <p className="text-xs text-gray-500 leading-relaxed">{risk.detail}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── 9. PCC Integration Panel ── */}
      <Card title="PointClickCare Integration" badge="LIVE"
        action={
          <button
            className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1 font-medium"
            onClick={() => setExpandedPcc(!expandedPcc)}
          >
            {expandedPcc ? 'Collapse' : 'Expand'} {expandedPcc ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>
        }
      >
        <div className="space-y-5">
          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="bg-gray-50 rounded-xl p-3 text-center border border-gray-100">
              <div className="text-xl font-bold text-gray-900">{pccSyncData.stats.syncedToday}</div>
              <div className="text-[10px] text-gray-500">Synced Today</div>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 text-center border border-gray-100">
              <div className="text-xl font-bold text-amber-600">{pccSyncData.stats.pendingWrites}</div>
              <div className="text-[10px] text-gray-500">Pending Writes</div>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 text-center border border-gray-100">
              <div className="text-xl font-bold text-green-600">{pccSyncData.stats.avgLatency}</div>
              <div className="text-[10px] text-gray-500">Avg Latency</div>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 text-center border border-gray-100">
              <div className="text-xl font-bold text-blue-600">{pccSyncData.stats.totalRecords.toLocaleString()}</div>
              <div className="text-[10px] text-gray-500">Total Records</div>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 text-center border border-gray-100">
              <div className="text-xl font-bold text-green-600">{pccSyncData.stats.uptime}</div>
              <div className="text-[10px] text-gray-500">Uptime</div>
            </div>
          </div>

          {/* Facility Connections */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Facility Connections</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
              {pccSyncData.facilities.map((f, i) => (
                <div key={i} className="flex items-center gap-2 p-2.5 rounded-lg bg-gray-50 border border-gray-100">
                  {f.connected ? (
                    <Wifi size={12} className="text-green-500 flex-shrink-0" />
                  ) : (
                    <WifiOff size={12} className="text-red-400 flex-shrink-0" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] text-gray-700 font-medium truncate">{f.name}</p>
                    <p className="text-[9px] text-gray-400">
                      {f.connected ? `${f.lastSync} \u00B7 ${f.recordCount.toLocaleString()} records` : 'Not connected'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {expandedPcc && (
            <>
              {/* Pipeline */}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Data Pipeline</p>
                <div className="flex items-center gap-1 flex-wrap">
                  {pccSyncData.pipeline.map((step, i) => (
                    <div key={i} className="flex items-center gap-1">
                      <div className="bg-blue-50 border border-blue-100 rounded-lg px-3 py-2 text-center">
                        <div className="text-[10px] font-semibold text-blue-700">{step.name}</div>
                        <div className="text-[9px] text-gray-400 mt-0.5 max-w-[120px] truncate">{step.detail}</div>
                      </div>
                      {i < pccSyncData.pipeline.length - 1 && (
                        <ArrowRight size={12} className="text-gray-300 flex-shrink-0" />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Activity */}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Recent Activity</p>
                <div className="space-y-1.5">
                  {pccSyncData.recentActivity.map((item, i) => {
                    const typeColors = {
                      write: 'bg-green-100 text-green-700',
                      alert: 'bg-amber-100 text-amber-700',
                      sync: 'bg-blue-100 text-blue-700',
                    };
                    const tc = typeColors[item.type] || typeColors.sync;
                    return (
                      <div key={i} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors">
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${tc}`}>{item.type}</span>
                        <span className="text-xs text-gray-700 flex-1">{item.action}</span>
                        <span className="text-[10px] text-gray-400 whitespace-nowrap">{item.time}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      </Card>

      {/* Footer */}
      <div className="mt-8 text-center">
        <p className="text-xs text-gray-400">
          AI Compliance Engine &middot; {complianceSummary.totalAuditTypes} audit types &middot; {complianceSummary.residentsMonitored} residents &middot; {complianceSummary.facilitiesMonitored} facilities &middot; Last scan: 6:00 AM today
        </p>
      </div>
    </div>
  );
}
