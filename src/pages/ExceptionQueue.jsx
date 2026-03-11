import { useState } from 'react';
import { Filter, CheckCircle2, XCircle, MessageSquare, ArrowUpCircle, Bot, Building2, Clock, ShieldCheck, AlertTriangle, Zap } from 'lucide-react';
import { exceptions } from '../data/mockData';
import { PageHeader, Card, PriorityBadge, ConfidenceBar, ActionButton, EmptyAgentBadge } from '../components/Widgets';

const FILTER_TABS = ['All', 'Vendor', 'Clinical', 'Payroll', 'Compliance', 'Price Change', 'GL Coding', 'Insurance'];

const typeBadgeColors = {
  Vendor: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  Clinical: 'bg-red-500/20 text-red-400 border-red-500/30',
  Payroll: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  Compliance: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  'Price Change': 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  'GL Coding': 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  Insurance: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
};

export default function ExceptionQueue() {
  const [activeFilter, setActiveFilter] = useState('All');
  const [selectedIds, setSelectedIds] = useState([]);

  const filtered = activeFilter === 'All'
    ? exceptions
    : exceptions.filter(e => e.type === activeFilter);

  const pendingCount = exceptions.filter(e => e.status === 'pending').length;
  const criticalCount = exceptions.filter(e => e.priority === 'Critical' && e.status === 'pending').length;
  const safeToApprove = exceptions.filter(e => e.status === 'pending' && e.confidence >= 0.93).length;

  const filterCounts = FILTER_TABS.reduce((acc, tab) => {
    acc[tab] = tab === 'All' ? exceptions.length : exceptions.filter(e => e.type === tab).length;
    return acc;
  }, {});

  const toggleSelect = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  function formatTime(ts) {
    const d = new Date(ts);
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  }

  return (
    <div className="min-h-screen bg-gray-950 p-6">
      <PageHeader
        title="Universal Exception Queue"
        subtitle={`${pendingCount} pending exceptions across all facilities`}
        aiSummary={`${pendingCount} exceptions need review. ${criticalCount} are critical and require immediate attention. ${safeToApprove} items have high confidence (93%+) and are safe for bulk approval. Sysco pricing dispute is the highest-impact item affecting 4 facilities.`}
      />

      {/* Bulk Action Bar */}
      {safeToApprove > 0 && (
        <div className="mb-4 p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap size={16} className="text-emerald-400" />
            <span className="text-sm text-emerald-300">
              <span className="font-semibold">{safeToApprove} items</span> have confidence above 93% and are safe for bulk approval
            </span>
          </div>
          <button className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5">
            <CheckCircle2 size={14} />
            Bulk Approve {safeToApprove} Safe Items
          </button>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveFilter(tab)}
            className={`px-4 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeFilter === tab
                ? 'bg-blue-600 text-white'
                : 'bg-gray-900 text-gray-400 hover:text-gray-300 hover:bg-gray-800 border border-gray-800'
            }`}
          >
            {tab}
            {filterCounts[tab] > 0 && (
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                activeFilter === tab ? 'bg-blue-500 text-white' : 'bg-gray-700 text-gray-400'
              }`}>
                {filterCounts[tab]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Exception Cards */}
      <div className="space-y-3">
        {filtered.map((exc) => (
          <div
            key={exc.id}
            className={`bg-gray-900 border rounded-xl p-5 transition-colors ${
              exc.priority === 'Critical' ? 'border-red-500/30 hover:border-red-500/50' : 'border-gray-800 hover:border-gray-700'
            }`}
          >
            {/* Header Row */}
            <div className="flex items-start justify-between gap-4 mb-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${typeBadgeColors[exc.type] || 'bg-gray-500/20 text-gray-400 border-gray-500/30'}`}>
                    {exc.type}
                  </span>
                  <PriorityBadge priority={exc.priority} />
                  {exc.status === 'approved' && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400">
                      Approved
                    </span>
                  )}
                </div>
                <h3 className="text-sm font-semibold text-white mb-1">{exc.title}</h3>
              </div>
              <div className="flex-shrink-0 text-right">
                <p className="text-[11px] text-gray-500 flex items-center gap-1 justify-end">
                  <Clock size={10} />
                  {formatTime(exc.timestamp)}
                </p>
              </div>
            </div>

            {/* Content */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-4">
              <div className="lg:col-span-7">
                <p className="text-xs text-gray-400 leading-relaxed">{exc.details}</p>
              </div>
              <div className="lg:col-span-5 grid grid-cols-2 gap-3">
                <div>
                  <span className="text-[10px] text-gray-500 uppercase tracking-wide">Facility</span>
                  <p className="text-xs text-gray-300 mt-0.5">{exc.facility}</p>
                </div>
                <div>
                  <span className="text-[10px] text-gray-500 uppercase tracking-wide">Detected By</span>
                  <div className="mt-0.5">
                    <EmptyAgentBadge agent={exc.agent} />
                  </div>
                </div>
                <div className="col-span-2">
                  <span className="text-[10px] text-gray-500 uppercase tracking-wide">Confidence</span>
                  <div className="mt-1">
                    <ConfidenceBar value={exc.confidence} />
                  </div>
                </div>
              </div>
            </div>

            {/* Action Row */}
            <div className="flex items-center justify-between pt-3 border-t border-gray-800">
              <div className="flex items-center gap-1.5">
                <input
                  type="checkbox"
                  checked={selectedIds.includes(exc.id)}
                  onChange={() => toggleSelect(exc.id)}
                  className="w-3.5 h-3.5 rounded border-gray-600 bg-gray-800 text-blue-500 focus:ring-blue-500/20"
                />
                <span className="text-[10px] text-gray-500">Select</span>
              </div>
              {exc.status === 'pending' && (
                <div className="flex items-center gap-2">
                  <ActionButton label="Approve" variant="success" />
                  <ActionButton label="Reject" variant="danger" />
                  <ActionButton label="Request Info" variant="ghost" />
                  <ActionButton label="Escalate" variant="primary" />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16">
          <Filter size={32} className="text-gray-700 mx-auto mb-3" />
          <p className="text-sm text-gray-500">No exceptions match this filter</p>
        </div>
      )}
    </div>
  );
}
