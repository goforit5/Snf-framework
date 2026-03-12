import { useState } from 'react';
import {
  ShieldCheck, AlertTriangle, CheckCircle2, Clock, FileText, Activity,
  Building2, Bot, ChevronRight, RefreshCw, Pill, Users, Heart,
  Stethoscope, ClipboardCheck, ArrowRight, ExternalLink, Zap, Eye
} from 'lucide-react';
import { complianceData } from '../data/mockData';
import {
  PageHeader, StatCard, Card, ActionButton, ClickableRow, useModal,
  ConfidenceBar, PriorityBadge, StatusBadge, AgentHumanSplit,
  SectionLabel, ProgressBar, EmptyAgentBadge
} from '../components/Widgets';

const auditTypeIcon = {
  Psychotropic: Pill,
  Catheter: Activity,
  'Skin & Wound': Heart,
  Falls: AlertTriangle,
  Admissions: Users,
};

const auditTypeColor = {
  Psychotropic: 'purple',
  Catheter: 'cyan',
  'Skin & Wound': 'amber',
  Falls: 'red',
  Admissions: 'blue',
};

const statusColorMap = {
  pass: 'bg-green-50 text-green-700 border-green-200',
  warning: 'bg-amber-50 text-amber-700 border-amber-200',
  fail: 'bg-red-50 text-red-700 border-red-200',
  pending: 'bg-gray-50 text-gray-600 border-gray-200',
};

export default function ClinicalCompliance() {
  const { open } = useModal();
  const [selectedFacility, setSelectedFacility] = useState(null);
  const { facilities, auditTypes, recentFindings, pccSync, summary } = complianceData;

  const displayFacilities = selectedFacility
    ? facilities.filter(f => f.id === selectedFacility)
    : facilities;

  const openFacilityModal = (facility) => {
    open({
      title: `${facility.name} — Compliance Detail`,
      content: (
        <div className="space-y-5">
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className={`text-3xl font-bold ${facility.complianceScore >= 90 ? 'text-green-600' : facility.complianceScore >= 75 ? 'text-amber-600' : 'text-red-600'}`}>
                {facility.complianceScore}%
              </div>
              <div className="text-[10px] text-gray-500 mt-0.5">Compliance</div>
            </div>
            <div className="h-12 w-px bg-gray-200" />
            <div>
              <p className="text-sm text-gray-900 font-medium">{facility.city}</p>
              <p className="text-xs text-gray-500">{facility.beds} beds — Census: {facility.census}</p>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Audit Results by Type</p>
            <div className="space-y-2">
              {facility.audits.map((audit, i) => {
                const Icon = auditTypeIcon[audit.type] || ShieldCheck;
                return (
                  <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                    <div className="flex items-center gap-2.5">
                      <Icon size={14} className="text-gray-500" />
                      <span className="text-sm text-gray-900 font-medium">{audit.type}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-500">{audit.findings} findings</span>
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${statusColorMap[audit.status]}`}>
                        {audit.status.toUpperCase()}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Open F-Tag Risks</p>
            <div className="flex flex-wrap gap-1.5">
              {facility.fTagRisks.map((tag, i) => (
                <span key={i} className="px-2.5 py-1 rounded-lg text-xs bg-amber-50 text-amber-700 border border-amber-200 font-medium">
                  {tag}
                </span>
              ))}
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Bot size={14} className="text-blue-600" />
              <p className="text-xs font-semibold text-blue-600">PCC Sync Status</p>
            </div>
            <div className="flex items-center gap-3">
              <span className={`w-2 h-2 rounded-full ${facility.pccConnected ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-sm text-gray-700">
                {facility.pccConnected ? `Connected — Last sync: ${facility.lastPccSync}` : 'Not Connected'}
              </span>
            </div>
          </div>
        </div>
      ),
      actions: (
        <>
          <ActionButton label="Run Full Audit" variant="primary" icon={RefreshCw} />
          <ActionButton label="Export Report" variant="outline" icon={FileText} />
        </>
      ),
    });
  };

  const openFindingModal = (finding) => {
    open({
      title: `Finding: ${finding.title}`,
      content: (
        <div className="space-y-5">
          <div className="flex items-center gap-3 flex-wrap">
            <PriorityBadge priority={finding.severity} />
            <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-600 border border-amber-100">
              {finding.fTag}
            </span>
            <EmptyAgentBadge agent={finding.auditType + ' Audit Agent'} />
          </div>

          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Facility</p>
            <p className="text-sm text-gray-700">{finding.facility}</p>
          </div>

          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Finding Details</p>
            <p className="text-sm text-gray-700 leading-relaxed">{finding.details}</p>
          </div>

          {finding.residents && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Affected Residents</p>
              <div className="space-y-1.5">
                {finding.residents.map((r, i) => (
                  <div key={i} className="flex items-center justify-between p-2.5 bg-gray-50 rounded-lg border border-gray-100">
                    <span className="text-sm text-gray-700">{r.name} — Room {r.room}</span>
                    <span className="text-xs text-gray-500">{r.issue}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-green-50 border border-green-100 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Bot size={14} className="text-green-600" />
              <p className="text-xs font-semibold text-green-600">Suggested Fix</p>
            </div>
            <p className="text-sm text-gray-700 leading-relaxed mb-3">{finding.suggestedFix}</p>
            {finding.fixSteps && (
              <div className="space-y-2 mt-3">
                {finding.fixSteps.map((step, i) => (
                  <div key={i} className="flex items-start gap-3 p-2.5 bg-white/70 rounded-lg">
                    <div className="w-5 h-5 rounded-full bg-green-100 border border-green-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-[10px] font-bold text-green-600">{i + 1}</span>
                    </div>
                    <p className="text-sm text-gray-700">{step}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {finding.pccAction && (
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <RefreshCw size={14} className="text-blue-600" />
                <p className="text-xs font-semibold text-blue-600">PCC Documentation Sync</p>
              </div>
              <p className="text-sm text-gray-700">{finding.pccAction}</p>
            </div>
          )}
        </div>
      ),
      actions: (
        <>
          <ActionButton label="Approve Fix" variant="success" icon={CheckCircle2} />
          <ActionButton label="Modify" variant="primary" />
          <ActionButton label="Dismiss" variant="ghost" />
        </>
      ),
    });
  };

  const openAuditTypeModal = (auditType) => {
    const findings = recentFindings.filter(f => f.auditType === auditType.name);
    open({
      title: `${auditType.name} Audit — ${auditType.fTag}`,
      content: (
        <div className="space-y-5">
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 bg-gray-50 rounded-xl border border-gray-100">
              <div className="text-2xl font-bold text-gray-900">{auditType.totalAudited}</div>
              <div className="text-[10px] text-gray-500">Residents Audited</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-xl border border-gray-100">
              <div className="text-2xl font-bold text-amber-600">{auditType.findingsCount}</div>
              <div className="text-[10px] text-gray-500">Findings</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-xl border border-gray-100">
              <div className={`text-2xl font-bold ${auditType.complianceRate >= 90 ? 'text-green-600' : auditType.complianceRate >= 75 ? 'text-amber-600' : 'text-red-600'}`}>
                {auditType.complianceRate}%
              </div>
              <div className="text-[10px] text-gray-500">Compliance</div>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Regulatory Reference</p>
            <p className="text-sm text-gray-700 leading-relaxed">{auditType.description}</p>
          </div>

          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">What the Agent Checks</p>
            <div className="space-y-1.5">
              {auditType.checks.map((check, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-gray-700">
                  <CheckCircle2 size={13} className="text-blue-500 flex-shrink-0" />
                  {check}
                </div>
              ))}
            </div>
          </div>

          {findings.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Recent Findings</p>
              <div className="space-y-2">
                {findings.map((f, i) => (
                  <div key={i} className="p-3 bg-gray-50 rounded-xl border border-gray-100 cursor-pointer hover:bg-white hover:shadow-sm transition-all" onClick={() => openFindingModal(f)}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-900 font-medium">{f.title}</span>
                      <PriorityBadge priority={f.severity} />
                    </div>
                    <p className="text-xs text-gray-500">{f.facility}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ),
      actions: (
        <>
          <ActionButton label="Run Audit Now" variant="primary" icon={RefreshCw} />
          <ActionButton label="View All Findings" variant="outline" />
        </>
      ),
    });
  };

  const openPccSyncModal = () => {
    open({
      title: 'PCC Integration Status',
      content: (
        <div className="space-y-5">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Bot size={14} className="text-blue-600" />
              <p className="text-xs font-semibold text-blue-600">PointClickCare Integration</p>
            </div>
            <p className="text-sm text-gray-700">
              Ensign's audit agents connect to PCC via SQL Server views to pull real-time resident data. When nurses approve fixes, documentation updates sync back to PCC automatically.
            </p>
          </div>

          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Facility Connections</p>
            <div className="space-y-2">
              {pccSync.facilities.map((f, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="flex items-center gap-2.5">
                    <span className={`w-2 h-2 rounded-full ${f.connected ? 'bg-green-500' : 'bg-red-500'}`} />
                    <span className="text-sm text-gray-900 font-medium">{f.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-500">{f.connected ? `Synced: ${f.lastSync}` : 'Disconnected'}</span>
                    <span className="text-xs text-gray-400">{f.recordCount} records</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Data Pipeline</p>
            <div className="space-y-2">
              {pccSync.pipeline.map((step, i) => (
                <div key={i} className="flex items-center gap-3 p-2.5 bg-gray-50 rounded-lg border border-gray-100">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center ${step.status === 'active' ? 'bg-green-100' : 'bg-gray-200'}`}>
                    <span className={`text-[10px] font-bold ${step.status === 'active' ? 'text-green-600' : 'text-gray-500'}`}>{i + 1}</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-900 font-medium">{step.name}</p>
                    <p className="text-xs text-gray-500">{step.detail}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${step.status === 'active' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {step.status === 'active' ? 'LIVE' : 'READY'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Recent Sync Activity</p>
            <div className="space-y-1.5">
              {pccSync.recentActivity.map((a, i) => (
                <div key={i} className="flex items-center justify-between text-xs py-1.5">
                  <span className="text-gray-600">{a.action}</span>
                  <span className="text-gray-400">{a.time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ),
      actions: (
        <>
          <ActionButton label="Force Sync All" variant="primary" icon={RefreshCw} />
          <ActionButton label="Connection Settings" variant="outline" />
        </>
      ),
    });
  };

  return (
    <div>
      <PageHeader
        title="Clinical Compliance & Audits"
        subtitle="Live facility compliance monitoring with automated audit agents"
        aiSummary={`${summary.totalFindings} active findings across ${summary.facilitiesMonitored} facilities. ${summary.criticalFindings} critical items need immediate nurse approval. Psychotropic audit flagged ${summary.psychFlagged} residents at Heritage Oaks — PRN documentation gaps. ${summary.pccConnected}/${summary.facilitiesMonitored} facilities connected to PCC with auto-sync enabled. Overall compliance: ${summary.overallCompliance}%.`}
        riskLevel={summary.overallCompliance < 80 ? 'high' : summary.overallCompliance < 90 ? 'medium' : 'low'}
      />

      {/* Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        <StatCard label="Overall Compliance" value={`${summary.overallCompliance}%`} icon={ShieldCheck} color="emerald" change="+2% vs last month" changeType="positive" />
        <StatCard label="Active Findings" value={summary.totalFindings} icon={AlertTriangle} color="amber" change={`${summary.criticalFindings} critical`} changeType="negative" />
        <StatCard label="Audits Run (7d)" value={summary.auditsRun7d} icon={ClipboardCheck} color="blue" change="All 5 types" changeType="positive" />
        <StatCard label="Fixes Approved" value={summary.fixesApproved} icon={CheckCircle2} color="emerald" change="Today" changeType="positive" />
        <StatCard label="Pending Approval" value={summary.pendingApproval} icon={Clock} color="amber" change="Nurse review" changeType="neutral" />
        <StatCard label="PCC Synced" value={`${summary.pccConnected}/${summary.facilitiesMonitored}`} icon={RefreshCw} color="blue" onClick={openPccSyncModal} change="Click for details" changeType="neutral" />
      </div>

      {/* Agent vs Human Split */}
      <div className="mb-6">
        <AgentHumanSplit
          agentCount={summary.auditsRun7d}
          humanCount={summary.fixesApproved + summary.pendingApproval}
          agentLabel="Automated Audits"
          humanLabel="Nurse Approvals"
        />
      </div>

      {/* Facility Compliance Cards */}
      <SectionLabel>Facility Compliance Status</SectionLabel>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-8">
        {facilities.map((facility) => (
          <div
            key={facility.id}
            className={`bg-white rounded-2xl p-5 border ${
              facility.complianceScore >= 90 ? 'border-green-200 hover:border-green-300' :
              facility.complianceScore >= 75 ? 'border-amber-200 hover:border-amber-300' :
              'border-red-200 hover:border-red-300'
            } hover:shadow-md transition-all cursor-pointer active:scale-[0.98]`}
            onClick={() => openFacilityModal(facility)}
          >
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-semibold text-gray-900">{facility.name}</h3>
                <p className="text-xs text-gray-400 mt-0.5">{facility.city}</p>
              </div>
              <div className="text-right">
                <span className={`text-2xl font-bold ${
                  facility.complianceScore >= 90 ? 'text-green-600' :
                  facility.complianceScore >= 75 ? 'text-amber-600' : 'text-red-600'
                }`}>{facility.complianceScore}%</span>
                <p className="text-[10px] text-gray-400">compliance</p>
              </div>
            </div>

            <div className="space-y-1.5 mb-3">
              {facility.audits.map((audit, i) => {
                const Icon = auditTypeIcon[audit.type] || ShieldCheck;
                return (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <Icon size={11} className="text-gray-400" />
                      <span className="text-gray-600">{audit.type}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {audit.findings > 0 && (
                        <span className="text-gray-400">{audit.findings} findings</span>
                      )}
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        audit.status === 'pass' ? 'bg-green-500' :
                        audit.status === 'warning' ? 'bg-amber-500' : 'bg-red-500'
                      }`} />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${facility.pccConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                <span className="text-[10px] text-gray-400 font-medium">
                  PCC {facility.pccConnected ? 'Connected' : 'Offline'}
                </span>
              </div>
              <span className="text-xs text-gray-400">{facility.openFindings} open findings</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Audit Types */}
        <Card title="Audit Types" badge={`${auditTypes.length} active`}>
          <div className="space-y-3">
            {auditTypes.map((auditType, i) => {
              const Icon = auditTypeIcon[auditType.name] || ShieldCheck;
              return (
                <ClickableRow key={i} onClick={() => openAuditTypeModal(auditType)}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-8 h-8 rounded-xl bg-${auditTypeColor[auditType.name] || 'blue'}-50 flex items-center justify-center`}>
                        <Icon size={15} className={`text-${auditTypeColor[auditType.name] || 'blue'}-600`} />
                      </div>
                      <div>
                        <span className="text-sm text-gray-900 font-medium">{auditType.name}</span>
                        <span className="text-xs text-gray-400 ml-2">{auditType.fTag}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-bold ${
                        auditType.complianceRate >= 90 ? 'text-green-600' :
                        auditType.complianceRate >= 75 ? 'text-amber-600' : 'text-red-600'
                      }`}>{auditType.complianceRate}%</span>
                      <ChevronRight size={14} className="text-gray-300" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{auditType.totalAudited} audited</span>
                    <span>{auditType.findingsCount} findings</span>
                    <span>Last run: {auditType.lastRun}</span>
                  </div>
                </ClickableRow>
              );
            })}
          </div>
        </Card>

        {/* Recent Findings Needing Approval */}
        <Card title="Findings Needing Nurse Approval" badge={`${recentFindings.filter(f => f.status === 'pending').length} pending`}>
          <div className="space-y-3">
            {recentFindings.filter(f => f.status === 'pending').map((finding, i) => (
              <ClickableRow key={i} onClick={() => openFindingModal(finding)}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-900 font-medium">{finding.title}</span>
                    <PriorityBadge priority={finding.severity} />
                  </div>
                  <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-600 border border-amber-100">
                    {finding.fTag}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mb-3">{finding.facility} — {finding.auditType} Audit</p>
                <div className="bg-green-50 rounded-lg p-2.5 border border-green-100 mb-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Bot size={11} className="text-green-600" />
                    <span className="text-[10px] font-semibold text-green-600">Suggested Fix</span>
                  </div>
                  <p className="text-xs text-gray-700">{finding.suggestedFix}</p>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <RefreshCw size={11} className="text-blue-500" />
                    <span className="text-[10px] text-blue-600 font-medium">Will sync to PCC</span>
                  </div>
                  <div className="flex gap-2">
                    <ActionButton label="Approve" variant="success" icon={CheckCircle2} />
                    <ActionButton label="Review" variant="ghost" />
                  </div>
                </div>
              </ClickableRow>
            ))}
          </div>
        </Card>
      </div>

      {/* PCC Sync Status Bar */}
      <Card title="PCC Documentation Sync" action={
        <button onClick={openPccSyncModal} className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
          View details <ExternalLink size={11} />
        </button>
      }>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="text-center p-4 bg-gray-50 rounded-xl border border-gray-100">
            <div className="text-2xl font-bold text-green-600">{pccSync.stats.syncedToday}</div>
            <div className="text-xs text-gray-500 mt-1">Records Synced Today</div>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-xl border border-gray-100">
            <div className="text-2xl font-bold text-blue-600">{pccSync.stats.pendingWrites}</div>
            <div className="text-xs text-gray-500 mt-1">Pending Writes</div>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-xl border border-gray-100">
            <div className="text-2xl font-bold text-gray-900">{pccSync.stats.avgLatency}</div>
            <div className="text-xs text-gray-500 mt-1">Avg Sync Latency</div>
          </div>
        </div>
        <div className="space-y-2">
          {pccSync.facilities.map((f, i) => (
            <div key={i} className="flex items-center gap-3">
              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${f.connected ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-sm text-gray-700 w-48 truncate">{f.name}</span>
              <div className="flex-1">
                <ProgressBar value={f.connected ? 100 : 0} color={f.connected ? 'emerald' : 'red'} />
              </div>
              <span className="text-xs text-gray-400 w-20 text-right">{f.recordCount} records</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
