import { useState } from 'react';
import { Search, Filter, Bot, User, Shield, FileText, Clock, ChevronDown, ExternalLink, Eye } from 'lucide-react';
import { auditTrail } from '../data/mockData';
import { PageHeader, Card, ActorBadge, ConfidenceBar } from '../components/Widgets';

export default function AuditTrail() {
  const [filterActor, setFilterActor] = useState('all');
  const [filterAction, setFilterAction] = useState('all');

  const filtered = auditTrail.filter(item => {
    if (filterActor !== 'all' && item.actorType !== filterActor) return false;
    if (filterAction !== 'all') {
      if (filterAction === 'approval' && !item.action.toLowerCase().includes('approv')) return false;
      if (filterAction === 'alert' && !item.action.toLowerCase().includes('alert') && !item.action.toLowerCase().includes('flag')) return false;
      if (filterAction === 'processing' && !item.action.toLowerCase().includes('process') && !item.action.toLowerCase().includes('detect')) return false;
    }
    return true;
  });

  const agentCount = auditTrail.filter(t => t.actorType === 'agent').length;
  const humanCount = auditTrail.filter(t => t.actorType === 'human').length;
  const avgConfidence = (auditTrail.filter(t => t.confidence).reduce((s, t) => s + t.confidence, 0) / auditTrail.filter(t => t.confidence).length).toFixed(2);

  const formatTime = (ts) => {
    const d = new Date(ts);
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  const formatDate = (ts) => {
    const d = new Date(ts);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const dispositionColor = (disp) => {
    if (disp.includes('Auto-approved') || disp.includes('Approved')) return 'text-emerald-400 bg-emerald-500/10';
    if (disp.includes('Critical') || disp.includes('required')) return 'text-red-400 bg-red-500/10';
    if (disp.includes('Pending') || disp.includes('Escalated')) return 'text-amber-400 bg-amber-500/10';
    return 'text-blue-400 bg-blue-500/10';
  };

  return (
    <div className="min-h-screen bg-gray-950 p-6">
      <PageHeader
        title="Audit Trail Explorer"
        subtitle="Complete Traceability for Every Agent & Human Action"
        aiSummary={`${auditTrail.length} actions logged in the last 24 hours. ${agentCount} agent actions (avg confidence: ${(avgConfidence * 100).toFixed(0)}%), ${humanCount} human actions. Every decision is traceable to its policy basis, evidence chain, and disposition. Zero unlogged actions — full compliance with governance requirements.`}
      />

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        {[
          { label: 'Total Actions', value: auditTrail.length, color: 'text-white' },
          { label: 'Agent Actions', value: agentCount, color: 'text-blue-400' },
          { label: 'Human Actions', value: humanCount, color: 'text-emerald-400' },
          { label: 'Avg Confidence', value: `${(avgConfidence * 100).toFixed(0)}%`, color: 'text-amber-400' },
          { label: 'Policies Checked', value: auditTrail.reduce((s, t) => s + t.policies.length, 0), color: 'text-purple-400' },
        ].map((stat, i) => (
          <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl p-3 text-center">
            <p className="text-[10px] text-gray-500 mb-1">{stat.label}</p>
            <p className={`text-xl font-bold ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Filter Bar */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 mb-6">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Filter size={14} className="text-gray-500" />
            <span className="text-xs text-gray-400 font-medium">Filters:</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] text-gray-500">Actor:</span>
            {['all', 'agent', 'human'].map(opt => (
              <button
                key={opt}
                onClick={() => setFilterActor(opt)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                  filterActor === opt
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                {opt === 'all' ? 'All' : opt === 'agent' ? 'Agents' : 'Humans'}
              </button>
            ))}
          </div>

          <div className="w-px h-6 bg-gray-800" />

          <div className="flex items-center gap-2">
            <span className="text-[10px] text-gray-500">Action:</span>
            {['all', 'approval', 'alert', 'processing'].map(opt => (
              <button
                key={opt}
                onClick={() => setFilterAction(opt)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                  filterAction === opt
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                {opt.charAt(0).toUpperCase() + opt.slice(1)}
              </button>
            ))}
          </div>

          <div className="ml-auto text-xs text-gray-500">
            Showing {filtered.length} of {auditTrail.length}
          </div>
        </div>
      </div>

      {/* Audit Trail Table */}
      <Card title="Action Log" badge={`${filtered.length} entries`}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-500 text-[10px] uppercase tracking-wider border-b border-gray-800">
                <th className="text-left pb-3 font-medium">Timestamp</th>
                <th className="text-left pb-3 font-medium">Actor</th>
                <th className="text-left pb-3 font-medium">Action</th>
                <th className="text-left pb-3 font-medium">Target</th>
                <th className="text-left pb-3 font-medium">Confidence</th>
                <th className="text-left pb-3 font-medium">Policies Checked</th>
                <th className="text-left pb-3 font-medium">Evidence</th>
                <th className="text-left pb-3 font-medium">Disposition</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <tr key={item.id} className="border-b border-gray-800/50 hover:bg-gray-800/20 transition-colors">
                  {/* Timestamp */}
                  <td className="py-3 pr-3 align-top">
                    <div className="flex flex-col">
                      <span className="text-xs text-gray-300 font-mono">{formatTime(item.timestamp)}</span>
                      <span className="text-[10px] text-gray-600">{formatDate(item.timestamp)}</span>
                    </div>
                  </td>

                  {/* Actor */}
                  <td className="py-3 pr-3 align-top">
                    <ActorBadge name={item.actor} type={item.actorType} />
                  </td>

                  {/* Action */}
                  <td className="py-3 pr-3 align-top">
                    <span className="text-xs text-gray-200">{item.action}</span>
                  </td>

                  {/* Target */}
                  <td className="py-3 pr-3 align-top max-w-48">
                    <span className="text-xs text-gray-400">{item.target}</span>
                  </td>

                  {/* Confidence */}
                  <td className="py-3 pr-3 align-top w-32">
                    {item.confidence ? (
                      <ConfidenceBar value={item.confidence} />
                    ) : (
                      <span className="text-[10px] text-gray-600 italic">Human action</span>
                    )}
                  </td>

                  {/* Policies */}
                  <td className="py-3 pr-3 align-top">
                    <div className="flex flex-wrap gap-1 max-w-56">
                      {item.policies.map((p, i) => (
                        <span key={i} className="inline-block px-1.5 py-0.5 rounded text-[9px] bg-gray-800 text-gray-400 border border-gray-700 whitespace-nowrap">
                          {p}
                        </span>
                      ))}
                    </div>
                  </td>

                  {/* Evidence */}
                  <td className="py-3 pr-3 align-top">
                    <div className="flex items-start gap-1">
                      <FileText size={10} className="text-gray-600 mt-0.5 flex-shrink-0" />
                      <span className="text-[10px] text-gray-500 leading-relaxed">{item.evidence || 'None'}</span>
                    </div>
                  </td>

                  {/* Disposition */}
                  <td className="py-3 align-top">
                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-medium ${dispositionColor(item.disposition)}`}>
                      {item.disposition}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Governance Summary */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card title="Agent Governance Summary">
          <div className="space-y-3">
            {[
              { label: 'Auto-approved (high confidence)', count: 1, pct: '12.5%', color: 'bg-emerald-500' },
              { label: 'Escalated to human', count: 3, pct: '37.5%', color: 'bg-amber-500' },
              { label: 'Alert / notification only', count: 3, pct: '37.5%', color: 'bg-blue-500' },
              { label: 'Blocked / held', count: 1, pct: '12.5%', color: 'bg-red-500' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${item.color} flex-shrink-0`} />
                <span className="text-xs text-gray-400 flex-1">{item.label}</span>
                <span className="text-xs text-gray-300 font-mono">{item.count}</span>
                <span className="text-[10px] text-gray-600 w-10 text-right">{item.pct}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Policy Coverage">
          <div className="space-y-2">
            {[
              { policy: 'Contract compliance', checks: 4 },
              { policy: 'Duplicate detection', checks: 3 },
              { policy: 'Credential verification', checks: 3 },
              { policy: 'Safety protocols', checks: 3 },
              { policy: 'Budget thresholds', checks: 2 },
              { policy: 'Regulatory requirements', checks: 2 },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between py-1">
                <span className="text-xs text-gray-400">{item.policy}</span>
                <div className="flex items-center gap-2">
                  <div className="flex gap-0.5">
                    {Array.from({ length: item.checks }).map((_, j) => (
                      <div key={j} className="w-1.5 h-3 rounded-sm bg-blue-500/60" />
                    ))}
                  </div>
                  <span className="text-[10px] text-gray-500 font-mono w-4 text-right">{item.checks}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Compliance Attestation">
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-lg">
              <Shield size={20} className="text-emerald-400 flex-shrink-0" />
              <div>
                <p className="text-xs font-semibold text-emerald-400">Full Traceability</p>
                <p className="text-[10px] text-gray-400 mt-0.5">100% of agent actions logged with policy basis, evidence chain, and disposition</p>
              </div>
            </div>
            <div className="space-y-2 text-[10px] text-gray-500">
              <div className="flex justify-between">
                <span>Audit period</span>
                <span className="text-gray-400">Last 24 hours</span>
              </div>
              <div className="flex justify-between">
                <span>Unlogged actions</span>
                <span className="text-emerald-400 font-semibold">0</span>
              </div>
              <div className="flex justify-between">
                <span>Override events</span>
                <span className="text-gray-400">0</span>
              </div>
              <div className="flex justify-between">
                <span>Governance level</span>
                <span className="text-gray-400">Level 0 (Full approval)</span>
              </div>
              <div className="flex justify-between">
                <span>Log integrity</span>
                <span className="text-emerald-400 font-semibold">Verified</span>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
