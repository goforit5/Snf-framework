import { useState, useRef, useCallback } from 'react';
import { CheckCircle2, XCircle, ArrowUp, Clock, ChevronDown, ChevronRight, Bot, FileText, Shield, Zap, AlertTriangle } from 'lucide-react';

/* ─── Governance Badge ─── */
const governanceLevels = {
  0: { label: 'Auto', color: 'bg-green-50 text-green-700 border-green-200', icon: Zap },
  1: { label: 'Notify', color: 'bg-blue-50 text-blue-700 border-blue-200', icon: null },
  2: { label: 'Confirm', color: 'bg-blue-50 text-blue-700 border-blue-200', icon: null },
  3: { label: 'Review', color: 'bg-amber-50 text-amber-700 border-amber-200', icon: null },
  4: { label: 'Dual Approve', color: 'bg-orange-50 text-orange-700 border-orange-200', icon: null },
  5: { label: 'Executive', color: 'bg-red-50 text-red-700 border-red-200', icon: null },
};

export function GovernanceBadge({ level }) {
  const config = governanceLevels[level] || governanceLevels[0];
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold border ${config.color}`}>
      <span className="tabular-nums">L{level}</span>
      <span>{config.label}</span>
    </span>
  );
}

/* ─── Evidence Panel ─── */
export function EvidencePanel({ evidence = [], policies = [], agentReasoning }) {
  return (
    <div className="space-y-3">
      {agentReasoning && (
        <div className="bg-blue-50/50 rounded-xl p-3 border border-blue-100">
          <div className="flex items-start gap-2">
            <Bot size={13} className="text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-[10px] font-semibold text-blue-600 uppercase tracking-wider mb-1">Agent Reasoning</p>
              <p className="text-xs text-gray-700 leading-relaxed">{agentReasoning}</p>
            </div>
          </div>
        </div>
      )}
      {evidence.length > 0 && (
        <div>
          <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Evidence</p>
          <div className="space-y-1.5">
            {evidence.map((item, i) => (
              <div key={i} className="flex items-start gap-2 text-xs">
                <FileText size={11} className="text-gray-400 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="font-medium text-gray-700">{item.label}</span>
                  {item.detail && <span className="text-gray-500"> — {item.detail}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {policies.length > 0 && (
        <div>
          <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Policies Checked</p>
          <div className="flex flex-wrap gap-1">
            {policies.map((policy, i) => (
              <span key={i} className="px-1.5 py-0.5 rounded bg-gray-100 text-[10px] text-gray-600 font-medium">
                <Shield size={9} className="inline mr-0.5 -mt-0.5" />
                {policy}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Decision Card ─── */
const priorityBorders = {
  critical: 'border-l-red-500',
  high: 'border-l-amber-500',
  medium: 'border-l-blue-500',
  low: 'border-l-gray-300',
};

const priorityBadges = {
  critical: 'bg-red-50 text-red-700 border-red-200',
  high: 'bg-amber-50 text-amber-700 border-amber-200',
  medium: 'bg-blue-50 text-blue-700 border-blue-200',
  low: 'bg-gray-50 text-gray-600 border-gray-200',
};

export function DecisionCard({
  number,
  title,
  description,
  facility,
  priority = 'medium',
  agent,
  confidence,
  recommendation,
  evidence = [],
  impact,
  governanceLevel,
  onApprove,
  onOverride,
  onEscalate,
  onDefer,
  isExpanded = false,
  onToggle,
}) {
  const borderColor = priorityBorders[priority?.toLowerCase()] || priorityBorders.medium;
  const badgeColor = priorityBadges[priority?.toLowerCase()] || priorityBadges.medium;
  const cardRef = useRef(null);
  const [flashClass, setFlashClass] = useState('');
  const [dismissing, setDismissing] = useState(false);

  const handleApprove = useCallback((e) => {
    if (e) e.stopPropagation();
    // Trigger approval flash, then fire callback
    setFlashClass('approval-flash');
    setTimeout(() => {
      setFlashClass('');
      onApprove?.();
    }, 600);
  }, [onApprove]);

  const handleDismissAction = useCallback((action) => {
    return (e) => {
      if (e) e.stopPropagation();
      setDismissing(true);
      setTimeout(() => action?.(), 300);
    };
  }, []);

  return (
    <div
      ref={cardRef}
      className={`bg-white rounded-2xl shadow-sm border border-gray-100 border-l-4 ${borderColor} transition-all duration-200 hover:shadow-md ${flashClass} ${dismissing ? 'card-dismiss' : ''}`}
    >
      {/* Collapsed view — always visible */}
      <div className="px-4 py-3 flex items-center gap-3">
        {number != null && (
          <span className="w-6 h-6 rounded-lg bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500 flex-shrink-0 tabular-nums">
            {number}
          </span>
        )}
        <div
          className="flex-1 min-w-0 cursor-pointer"
          onClick={onToggle}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onToggle?.(); } }}
        >
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="text-sm font-semibold text-gray-900 truncate">{title}</h4>
            {facility && <span className="text-[10px] text-gray-400 font-medium">{facility}</span>}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${badgeColor}`}>
            {priority}
          </span>
          {confidence != null && (
            <span className="text-[10px] font-mono font-medium text-gray-500 tabular-nums">
              {(confidence * 100).toFixed(0)}%
            </span>
          )}
          {governanceLevel != null && <GovernanceBadge level={governanceLevel} />}
          <div className="flex items-center gap-1 ml-1" role="group" aria-label="Decision actions">
            {onApprove && (
              <button
                onClick={handleApprove}
                className="px-2.5 py-1.5 rounded-xl text-[11px] font-semibold bg-green-600 hover:bg-green-700 text-white transition-all duration-200 active:scale-[0.97]"
                aria-label={`Approve: ${title}`}
              >
                Approve
              </button>
            )}
            {onOverride && (
              <button
                onClick={handleDismissAction(onOverride)}
                className="px-2.5 py-1.5 rounded-xl text-[11px] font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700 transition-all duration-200 active:scale-[0.97]"
                aria-label={`Override: ${title}`}
              >
                Override
              </button>
            )}
            {onEscalate && (
              <button
                onClick={(e) => { e.stopPropagation(); onEscalate(); }}
                className="px-2.5 py-1.5 rounded-xl text-[11px] font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700 transition-all duration-200 active:scale-[0.97]"
                aria-label={`Escalate: ${title}`}
              >
                <ArrowUp size={12} aria-hidden="true" />
              </button>
            )}
          </div>
          <button
            onClick={onToggle}
            aria-expanded={isExpanded}
            aria-label={`${isExpanded ? 'Collapse' : 'Expand'} details for: ${title}`}
            className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
          >
            {isExpanded ? <ChevronDown size={14} className="text-gray-400 transition-transform duration-200" aria-hidden="true" /> : <ChevronRight size={14} className="text-gray-400 transition-transform duration-200" aria-hidden="true" />}
          </button>
        </div>
      </div>

      {/* Expanded view — animated */}
      {isExpanded && (
        <div className="px-4 pb-4 border-t border-gray-100 card-expand">
          <div className="pt-3 space-y-3">
            {description && (
              <p className="text-sm text-gray-600 leading-relaxed">{description}</p>
            )}
            {recommendation && (
              <div className="bg-green-50/50 rounded-xl p-3 border border-green-100">
                <div className="flex items-start gap-2">
                  <Bot size={13} className="text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-[10px] font-semibold text-green-600 uppercase tracking-wider mb-1">Recommendation</p>
                    <p className="text-xs text-gray-700">{recommendation}</p>
                  </div>
                </div>
              </div>
            )}
            {agent && (
              <div className="flex items-center gap-2 text-xs">
                <div className="w-5 h-5 rounded-md bg-blue-50 flex items-center justify-center">
                  <Bot size={11} className="text-blue-600" />
                </div>
                <span className="text-gray-500">Agent:</span>
                <span className="font-medium text-gray-700">{agent}</span>
              </div>
            )}
            {impact && (
              <div className="flex items-start gap-2 text-xs">
                <AlertTriangle size={11} className="text-amber-500 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="text-gray-500">Impact:</span>
                  <span className="font-medium text-gray-700 ml-1">{impact}</span>
                </div>
              </div>
            )}
            <EvidencePanel evidence={evidence} />
            {/* Action buttons repeated in expanded view for accessibility */}
            <div className="flex items-center gap-2 pt-2 border-t border-gray-100" role="group" aria-label="Decision actions">
              {onApprove && (
                <button
                  onClick={handleApprove}
                  aria-label={`Approve: ${title}`}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-green-600 hover:bg-green-700 text-white transition-all duration-200 active:scale-[0.97] flex items-center gap-1.5"
                >
                  <CheckCircle2 size={13} aria-hidden="true" />
                  Approve
                </button>
              )}
              {onOverride && (
                <button
                  onClick={handleDismissAction(onOverride)}
                  aria-label={`Override: ${title}`}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700 transition-all duration-200 active:scale-[0.97] flex items-center gap-1.5"
                >
                  <XCircle size={13} aria-hidden="true" />
                  Override
                </button>
              )}
              {onEscalate && (
                <button
                  onClick={onEscalate}
                  aria-label={`Escalate: ${title}`}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700 transition-all duration-200 active:scale-[0.97] flex items-center gap-1.5"
                >
                  <ArrowUp size={13} aria-hidden="true" />
                  Escalate
                </button>
              )}
              {onDefer && (
                <button
                  onClick={onDefer}
                  aria-label={`Defer: ${title}`}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700 transition-all duration-200 active:scale-[0.97] flex items-center gap-1.5"
                >
                  <Clock size={13} aria-hidden="true" />
                  Defer
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Decision Queue ─── */
export function DecisionQueue({
  decisions = [],
  onApprove,
  onOverride,
  onEscalate,
  onDefer,
  title = 'Do These First',
  badge,
}) {
  const [expandedId, setExpandedId] = useState(null);

  if (decisions.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
        <CheckCircle2 size={32} className="text-green-500 mx-auto mb-3" />
        <h3 className="text-sm font-semibold text-gray-900 mb-1">All clear</h3>
        <p className="text-xs text-gray-500">Agents handled everything. No decisions needed.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-2.5 mb-3">
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
        {badge != null && (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-600 border border-red-100 tabular-nums">
            {badge}
          </span>
        )}
      </div>
      <div className="space-y-2">
        {decisions.map((decision, index) => (
          <DecisionCard
            key={decision.id}
            number={decision.number ?? index + 1}
            title={decision.title}
            description={decision.description}
            facility={decision.facility}
            priority={decision.priority}
            agent={decision.agent}
            confidence={decision.confidence}
            recommendation={decision.recommendation}
            evidence={decision.evidence}
            impact={decision.impact}
            governanceLevel={decision.governanceLevel}
            onApprove={onApprove ? () => onApprove(decision.id) : undefined}
            onOverride={onOverride ? () => onOverride(decision.id) : undefined}
            onEscalate={onEscalate ? () => onEscalate(decision.id) : undefined}
            onDefer={onDefer ? () => onDefer(decision.id) : undefined}
            isExpanded={expandedId === decision.id}
            onToggle={() => setExpandedId(expandedId === decision.id ? null : decision.id)}
          />
        ))}
      </div>
    </div>
  );
}
