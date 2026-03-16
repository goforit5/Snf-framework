import { useState } from 'react';
import { Bot, User, ChevronDown, ChevronRight, ArrowRight, Shield, FileText, CheckCircle2, XCircle, Clock } from 'lucide-react';

/* ─── Audit Entry ─── */
const actorTypeConfig = {
  agent: { bg: 'bg-blue-50', dot: 'bg-blue-500', icon: Bot, iconColor: 'text-blue-600' },
  human: { bg: 'bg-green-50', dot: 'bg-green-500', icon: User, iconColor: 'text-green-600' },
  system: { bg: 'bg-gray-50', dot: 'bg-gray-400', icon: Bot, iconColor: 'text-gray-500' },
};

const dispositionConfig = {
  approved: { color: 'text-green-600', bg: 'bg-green-50', icon: CheckCircle2 },
  rejected: { color: 'text-red-600', bg: 'bg-red-50', icon: XCircle },
  pending: { color: 'text-amber-600', bg: 'bg-amber-50', icon: Clock },
  deferred: { color: 'text-gray-500', bg: 'bg-gray-50', icon: Clock },
  auto: { color: 'text-blue-600', bg: 'bg-blue-50', icon: CheckCircle2 },
};

function formatTimestamp(timestamp) {
  if (!timestamp) return '';
  const d = new Date(timestamp);
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

function formatDate(timestamp) {
  if (!timestamp) return '';
  const d = new Date(timestamp);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function AuditEntry({ entry, isExpanded = false, onToggle }) {
  const { timestamp, actor, actorType = 'agent', action, target, confidence, policies = [], evidence = [], disposition } = entry;
  const aConfig = actorTypeConfig[actorType] || actorTypeConfig.agent;
  const ActorIcon = aConfig.icon;
  const dConfig = disposition ? (dispositionConfig[disposition] || dispositionConfig.auto) : null;
  const DispositionIcon = dConfig?.icon;

  return (
    <div
      className="rounded-xl border border-gray-100 bg-white hover:border-gray-200 transition-all duration-200 cursor-pointer"
      onClick={onToggle}
    >
      <div className="flex items-center gap-3 px-4 py-3">
        <div className={`w-7 h-7 rounded-lg ${aConfig.bg} flex items-center justify-center flex-shrink-0`}>
          <ActorIcon size={13} className={aConfig.iconColor} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-gray-900">{actor}</span>
            <span className="text-sm text-gray-600">{action}</span>
            {target && <span className="text-sm text-gray-400">{target}</span>}
          </div>
        </div>
        <div className="flex items-center gap-2.5 flex-shrink-0">
          {confidence != null && (
            <span className="text-[10px] font-mono font-medium text-gray-500 tabular-nums">
              {(confidence * 100).toFixed(0)}%
            </span>
          )}
          {dConfig && DispositionIcon && (
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold ${dConfig.bg} ${dConfig.color}`}>
              <DispositionIcon size={10} />
              {disposition}
            </span>
          )}
          <span className="text-[10px] text-gray-400 tabular-nums">{formatTimestamp(timestamp)}</span>
          {isExpanded ? <ChevronDown size={13} className="text-gray-400" /> : <ChevronRight size={13} className="text-gray-400" />}
        </div>
      </div>

      {isExpanded && (
        <div className="px-4 pb-3 border-t border-gray-100">
          <div className="pt-3 space-y-2.5">
            {policies.length > 0 && (
              <div className="flex items-start gap-2 text-xs">
                <Shield size={11} className="text-blue-500 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="text-gray-500">Policies:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {policies.map((p, i) => (
                      <span key={i} className="px-1.5 py-0.5 rounded bg-blue-50 text-[10px] text-blue-700 font-medium">{p}</span>
                    ))}
                  </div>
                </div>
              </div>
            )}
            {evidence.length > 0 && (
              <div className="flex items-start gap-2 text-xs">
                <FileText size={11} className="text-gray-400 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="text-gray-500">Evidence:</span>
                  <ul className="mt-1 space-y-0.5">
                    {evidence.map((e, i) => (
                      <li key={i} className="text-gray-700">
                        <span className="font-medium">{e.label}</span>
                        {e.detail && <span className="text-gray-500"> — {e.detail}</span>}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Audit Timeline ─── */
function groupByTime(entries) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);

  const groups = {
    'Today': [],
    'Yesterday': [],
    'This Week': [],
    'Older': [],
  };

  entries.forEach((entry) => {
    const d = new Date(entry.timestamp);
    if (d >= today) groups['Today'].push(entry);
    else if (d >= yesterday) groups['Yesterday'].push(entry);
    else if (d >= weekAgo) groups['This Week'].push(entry);
    else groups['Older'].push(entry);
  });

  return Object.entries(groups).filter(([, items]) => items.length > 0);
}

function groupByTrace(entries) {
  const traceMap = {};
  entries.forEach((entry) => {
    const traceId = entry.traceId || 'ungrouped';
    if (!traceMap[traceId]) traceMap[traceId] = [];
    traceMap[traceId].push(entry);
  });
  return Object.entries(traceMap);
}

export function AuditTimeline({ entries = [], groupBy = 'time' }) {
  const [expandedId, setExpandedId] = useState(null);

  const groups = groupBy === 'trace' ? groupByTrace(entries) : groupByTime(entries);

  return (
    <div className="space-y-6">
      {groups.map(([label, items]) => (
        <div key={label}>
          <div className="flex items-center gap-3 mb-3">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">{label}</h4>
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-[10px] text-gray-400 tabular-nums">{items.length}</span>
          </div>
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-[17px] top-3 bottom-3 w-px bg-gray-200" />
            <div className="space-y-2 relative">
              {items.map((entry) => {
                const aConfig = actorTypeConfig[entry.actorType] || actorTypeConfig.agent;
                return (
                  <div key={entry.id} className="relative pl-10">
                    {/* Timeline dot */}
                    <div className={`absolute left-[13px] top-4 w-2.5 h-2.5 rounded-full ${aConfig.dot} ring-2 ring-white`} />
                    <AuditEntry
                      entry={entry}
                      isExpanded={expandedId === entry.id}
                      onToggle={() => setExpandedId(expandedId === entry.id ? null : entry.id)}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── Trace View ─── */
export function TraceView({ traceId, entries = [] }) {
  const [expandedId, setExpandedId] = useState(null);
  const sorted = [...entries].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Trace</span>
        <span className="px-2 py-0.5 rounded-lg bg-gray-100 text-[10px] font-mono text-gray-600">{traceId}</span>
      </div>
      <div className="space-y-1">
        {sorted.map((entry, i) => (
          <div key={entry.id}>
            <AuditEntry
              entry={entry}
              isExpanded={expandedId === entry.id}
              onToggle={() => setExpandedId(expandedId === entry.id ? null : entry.id)}
            />
            {i < sorted.length - 1 && (
              <div className="flex justify-center py-1">
                <div className="flex flex-col items-center">
                  <div className="w-px h-2 bg-gray-200" />
                  <ArrowRight size={12} className="text-gray-300 rotate-90" />
                  <div className="w-px h-2 bg-gray-200" />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      {sorted.length > 0 && (
        <div className="mt-4 px-3 py-2 rounded-xl bg-gray-50 border border-gray-100">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Clock size={11} />
            <span>
              {formatDate(sorted[0].timestamp)} {formatTimestamp(sorted[0].timestamp)}
              {' '}&rarr;{' '}
              {formatTimestamp(sorted[sorted.length - 1].timestamp)}
            </span>
            <span className="text-gray-400">&middot;</span>
            <span>{sorted.length} event{sorted.length !== 1 ? 's' : ''} in trace</span>
          </div>
        </div>
      )}
    </div>
  );
}
