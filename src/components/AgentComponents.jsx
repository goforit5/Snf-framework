import { useState } from 'react';
import { Bot, Clock, Zap, ChevronDown, ChevronRight, CheckCircle2, AlertCircle, Activity, Pause, Shield } from 'lucide-react';

/* ─── Agent Summary Bar ─── */
export function AgentSummaryBar({ agentName, summary, itemsProcessed, exceptionsFound, timeSaved, lastRunTime }) {
  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-100 dark:border-blue-800 rounded-2xl px-5 py-3 mb-6">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center flex-shrink-0">
          <Bot size={14} className="text-white" />
        </div>
        <p className="text-sm text-gray-700 flex-1 min-w-0">
          <span className="font-semibold text-blue-700 dark:text-blue-400">{agentName}</span>
          {' — '}
          {summary}
        </p>
        <div className="flex items-center gap-3 lg:gap-4 flex-shrink-0 flex-wrap">
          {itemsProcessed != null && (
            <div className="flex items-center gap-1.5">
              <Zap size={12} className="text-blue-500" />
              <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 tabular-nums">{itemsProcessed}</span>
              <span className="text-[10px] text-gray-400">processed</span>
            </div>
          )}
          {exceptionsFound != null && (
            <div className="flex items-center gap-1.5">
              <AlertCircle size={12} className="text-amber-500" />
              <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 tabular-nums">{exceptionsFound}</span>
              <span className="text-[10px] text-gray-400">exceptions</span>
            </div>
          )}
          {timeSaved && (
            <div className="flex items-center gap-1.5">
              <Clock size={12} className="text-green-500" />
              <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">{timeSaved}</span>
              <span className="text-[10px] text-gray-400">saved</span>
            </div>
          )}
          {lastRunTime && (
            <span className="text-[10px] text-gray-400">{lastRunTime}</span>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Agent Activity Feed ─── */
export function AgentActivityFeed({ activities = [], maxItems = 10, showViewAll = false, onViewAll }) {
  const [expandedId, setExpandedId] = useState(null);
  const displayed = activities.slice(0, maxItems);

  const statusDot = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'in-progress': return 'bg-violet-500 animate-pulse';
      case 'failed': return 'bg-red-500';
      default: return 'bg-gray-300';
    }
  };

  function formatTimeAgo(timestamp) {
    if (!timestamp) return '';
    const now = new Date();
    const then = new Date(timestamp);
    const diffMs = now - then;
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return 'just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    return `${Math.floor(diffHr / 24)}d ago`;
  }

  return (
    <div className="space-y-1">
      {displayed.map((activity) => {
        const isExpanded = expandedId === activity.id;
        return (
          <div
            key={activity.id}
            className="rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50 hover:bg-white dark:hover:bg-gray-800 hover:border-gray-200 dark:hover:border-gray-700 transition-all duration-200 cursor-pointer"
            onClick={() => setExpandedId(isExpanded ? null : activity.id)}
            role="button"
            tabIndex={0}
            aria-expanded={isExpanded}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setExpandedId(isExpanded ? null : activity.id); } }}
          >
            <div className="flex items-center gap-3 px-4 py-2.5">
              <div className={`w-2 h-2 rounded-full flex-shrink-0 ${statusDot(activity.status)}`} />
              <div className="w-6 h-6 rounded-md bg-blue-50 flex items-center justify-center flex-shrink-0">
                <Bot size={12} className="text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-700 truncate">
                  <span className="font-medium text-gray-900 dark:text-gray-100">{activity.agentName}</span>
                  {' '}{activity.action}
                </p>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                {activity.confidence != null && (
                  <span className="text-[10px] font-mono font-medium text-gray-500 tabular-nums">
                    {(activity.confidence * 100).toFixed(0)}%
                  </span>
                )}
                <span className="text-[10px] text-gray-400">{formatTimeAgo(activity.timestamp)}</span>
                {isExpanded ? <ChevronDown size={12} className="text-gray-400" /> : <ChevronRight size={12} className="text-gray-400" />}
              </div>
            </div>
            {isExpanded && (
              <div className="px-4 pb-3 pt-0 border-t border-gray-100 dark:border-gray-800 mt-0">
                <div className="pt-2.5 space-y-2">
                  {activity.timeSaved && (
                    <div className="flex items-center gap-2 text-xs">
                      <Clock size={11} className="text-green-500" />
                      <span className="text-gray-500">Time saved:</span>
                      <span className="font-medium text-gray-700">{activity.timeSaved}</span>
                    </div>
                  )}
                  {activity.costImpact && (
                    <div className="flex items-center gap-2 text-xs">
                      <Zap size={11} className="text-emerald-500" />
                      <span className="text-gray-500">Cost impact:</span>
                      <span className="font-medium text-gray-700">{activity.costImpact}</span>
                    </div>
                  )}
                  {activity.policiesChecked && activity.policiesChecked.length > 0 && (
                    <div className="flex items-start gap-2 text-xs">
                      <Shield size={11} className="text-blue-500 mt-0.5" />
                      <div>
                        <span className="text-gray-500">Policies checked:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {activity.policiesChecked.map((policy, i) => (
                            <span key={i} className="px-1.5 py-0.5 rounded bg-blue-50 text-[10px] text-blue-700 font-medium">
                              {policy}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}
      {showViewAll && activities.length > maxItems && (
        <button
          onClick={onViewAll}
          className="w-full text-center text-xs font-semibold text-blue-600 hover:text-blue-700 py-2 transition-colors"
        >
          View all {activities.length} activities
        </button>
      )}
    </div>
  );
}

/* ─── Agent Status Indicator ─── */
export function AgentStatusIndicator({ status, agentName, lastRun }) {
  const statusConfig = {
    active: { dot: 'bg-green-500', label: 'Active', textColor: 'text-green-700' },
    paused: { dot: 'bg-amber-500', label: 'Paused', textColor: 'text-amber-700' },
    error: { dot: 'bg-red-500', label: 'Error', textColor: 'text-red-700' },
  };
  const config = statusConfig[status] || statusConfig.active;

  function formatTimeAgo(timestamp) {
    if (!timestamp) return '';
    const now = new Date();
    const then = new Date(timestamp);
    const diffMs = now - then;
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return 'just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    return `${Math.floor(diffHr / 24)}d ago`;
  }

  return (
    <div className="inline-flex items-center gap-2" role="status" aria-label={`${agentName || 'Agent'}: ${config.label}`}>
      <div className={`w-2 h-2 rounded-full ${config.dot} ${status === 'active' ? 'animate-pulse' : ''}`} aria-hidden="true" />
      {agentName && <span className="text-xs font-medium text-gray-700">{agentName}</span>}
      {lastRun && <span className="text-[10px] text-gray-400">ran {formatTimeAgo(lastRun)}</span>}
    </div>
  );
}

/* ─── Agent Card ─── */
const domainGradients = {
  clinical: 'from-blue-600 to-indigo-600',
  finance: 'from-emerald-600 to-teal-600',
  workforce: 'from-violet-600 to-purple-600',
  operations: 'from-orange-600 to-amber-600',
  legal: 'from-slate-600 to-gray-600',
  strategic: 'from-cyan-600 to-blue-600',
  platform: 'from-indigo-600 to-violet-600',
};

const domainBadgeColors = {
  clinical: 'bg-blue-50 text-blue-700 border-blue-100',
  finance: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  workforce: 'bg-violet-50 text-violet-700 border-violet-100',
  operations: 'bg-orange-50 text-orange-700 border-orange-100',
  legal: 'bg-slate-50 text-slate-700 border-slate-100',
  strategic: 'bg-cyan-50 text-cyan-700 border-cyan-100',
  platform: 'bg-indigo-50 text-indigo-700 border-indigo-100',
};

export function AgentCard({ agent, onClick }) {
  const { name, displayName, domain, status, actionsToday, exceptionsToday, confidenceAvg, lastRun, icon: Icon } = agent;
  const gradient = domainGradients[domain] || domainGradients.platform;
  const badgeColor = domainBadgeColors[domain] || domainBadgeColors.platform;

  const statusConfig = {
    active: { dot: 'bg-green-500', label: 'Active' },
    paused: { dot: 'bg-amber-500', label: 'Paused' },
    error: { dot: 'bg-red-500', label: 'Error' },
  };
  const sc = statusConfig[status] || statusConfig.active;

  function formatTimeAgo(timestamp) {
    if (!timestamp) return 'never';
    const now = new Date();
    const then = new Date(timestamp);
    const diffMs = now - then;
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return 'just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    return `${Math.floor(diffHr / 24)}d ago`;
  }

  return (
    <div
      className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-4 hover:shadow-md hover:border-gray-200 dark:hover:border-gray-700 transition-all duration-200 cursor-pointer active:scale-[0.98]"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick?.(); } }}
      aria-label={`${displayName || name} agent, ${domain} domain, ${sc.label}`}
    >
      <div className="flex items-start gap-3 mb-3">
        <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center flex-shrink-0`}>
          {Icon ? <Icon size={16} className="text-white" /> : <Bot size={16} className="text-white" />}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{displayName || name}</h4>
          <div className="flex items-center gap-2 mt-0.5">
            <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border ${badgeColor}`}>
              {domain}
            </span>
            <div className="flex items-center gap-1">
              <div className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
              <span className="text-[10px] text-gray-400">{sc.label}</span>
            </div>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2 text-center">
        <div>
          <p className="text-lg font-bold text-gray-900 dark:text-gray-100 tabular-nums">{actionsToday ?? 0}</p>
          <p className="text-[10px] text-gray-400">Actions</p>
        </div>
        <div>
          <p className="text-lg font-bold text-gray-900 dark:text-gray-100 tabular-nums">{exceptionsToday ?? 0}</p>
          <p className="text-[10px] text-gray-400">Exceptions</p>
        </div>
        <div>
          <p className="text-lg font-bold text-gray-900 dark:text-gray-100 tabular-nums">
            {confidenceAvg != null ? `${(confidenceAvg * 100).toFixed(0)}%` : '—'}
          </p>
          <p className="text-[10px] text-gray-400">Confidence</p>
        </div>
      </div>
      <div className="mt-3 pt-2.5 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
        <span className="text-[10px] text-gray-400">Last run {formatTimeAgo(lastRun)}</span>
        <Activity size={12} className="text-gray-300" />
      </div>
    </div>
  );
}
