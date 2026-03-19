import { useState, useRef, useCallback } from 'react';
import { CheckCircle2, XCircle, ArrowUp, Clock, ChevronDown, ChevronRight, Bot, FileText, Shield, Zap, AlertTriangle, Maximize2, Database, Globe, Activity } from 'lucide-react';
import { useModal } from './WidgetUtils';

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

/* ─── Decision Detail Modal Content ─── */
function DecisionDetailModal({
  title, description, facility, priority, agent, confidence,
  recommendation, evidence = [], impact, governanceLevel,
  agentReasoning, policies = [], sourceSystems = [], timeline = [],
  onApprove, onOverride, onEscalate, onDefer, closeModal,
}) {
  const badgeColor = {
    critical: 'bg-red-50 text-red-700 border-red-200',
    high: 'bg-amber-50 text-amber-700 border-amber-200',
    medium: 'bg-blue-50 text-blue-700 border-blue-200',
    low: 'bg-gray-50 text-gray-600 border-gray-200',
  }[priority?.toLowerCase()] || 'bg-blue-50 text-blue-700 border-blue-200';

  const confidencePct = confidence != null ? (confidence * 100).toFixed(0) : null;
  const confidenceColor = confidence >= 0.95 ? 'text-green-600' : confidence >= 0.8 ? 'text-amber-600' : 'text-red-600';

  // Generate default timeline if none provided
  const displayTimeline = timeline.length > 0 ? timeline : [
    { time: '6 min ago', event: 'Agent detected anomaly across source systems' },
    { time: '5 min ago', event: 'Cross-referenced policies and compliance requirements' },
    { time: '4 min ago', event: 'Completed impact analysis and risk assessment' },
    { time: '3 min ago', event: 'Generated recommendation with supporting evidence' },
    { time: 'Now', event: 'Awaiting human decision' },
  ];

  // Generate default source systems if none provided
  const displaySystems = sourceSystems.length > 0 ? sourceSystems : ['PCC', 'Workday'];

  const handleAction = (action) => {
    closeModal?.();
    action?.();
  };

  return (
    <div className="space-y-6">
      {/* Header with badges */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          {facility && (
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">{facility}</p>
          )}
          <div className="flex items-center gap-2 flex-wrap mt-1">
            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${badgeColor}`}>
              {priority}
            </span>
            {governanceLevel != null && <GovernanceBadge level={governanceLevel} />}
          </div>
        </div>
        {confidencePct != null && (
          <div className="text-right flex-shrink-0">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Confidence</p>
            <p className={`text-2xl font-bold tabular-nums ${confidenceColor}`}>{confidencePct}%</p>
            <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden mt-1">
              <div
                className={`h-full rounded-full transition-all ${confidence >= 0.95 ? 'bg-green-500' : confidence >= 0.8 ? 'bg-amber-500' : 'bg-red-500'}`}
                style={{ width: `${confidence * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Description */}
      {description && (
        <div>
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Situation</p>
          <p className="text-sm text-gray-700 leading-relaxed">{description}</p>
        </div>
      )}

      {/* Agent Analysis */}
      <div className="bg-blue-50/50 rounded-xl p-4 border border-blue-100">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
            <Bot size={16} className="text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <p className="text-xs font-semibold text-blue-700">{agent || 'AI Agent'}</p>
              <span className="text-[10px] text-blue-500 font-medium">Analysis</span>
            </div>
            <p className="text-xs text-gray-700 leading-relaxed">
              {agentReasoning || recommendation || 'Agent analysis completed. See evidence and recommendation below.'}
            </p>
          </div>
        </div>
      </div>

      {/* Recommendation */}
      {recommendation && (
        <div className="bg-green-50/50 rounded-xl p-4 border border-green-100">
          <p className="text-[10px] font-semibold text-green-600 uppercase tracking-wider mb-2">Recommendation</p>
          <p className="text-sm text-gray-700 leading-relaxed font-medium">{recommendation}</p>
          {impact && (
            <div className="flex items-start gap-2 mt-3 pt-3 border-t border-green-100">
              <AlertTriangle size={12} className="text-amber-500 mt-0.5 flex-shrink-0" />
              <div>
                <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Impact: </span>
                <span className="text-xs text-gray-700">{impact}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Evidence Chain */}
      {evidence.length > 0 && (
        <div>
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-3">Evidence Chain</p>
          <div className="space-y-2">
            {evidence.map((item, i) => (
              <div key={i} className="flex items-start gap-3 bg-gray-50 rounded-xl p-3 border border-gray-100">
                <div className="w-6 h-6 rounded-lg bg-white border border-gray-200 flex items-center justify-center flex-shrink-0">
                  <span className="text-[10px] font-bold text-gray-400 tabular-nums">{i + 1}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-gray-700">{item.label}</p>
                  {item.detail && <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{item.detail}</p>}
                  {item.source && (
                    <span className="inline-flex items-center gap-1 mt-1 text-[10px] text-blue-600 font-medium">
                      <Database size={9} />
                      {item.source}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Policies Checked */}
      {policies.length > 0 && (
        <div>
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-3">Policies Verified</p>
          <div className="flex flex-wrap gap-1.5">
            {policies.map((policy, i) => (
              <span key={i} className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-green-50 border border-green-100 text-[10px] text-green-700 font-medium">
                <Shield size={10} className="text-green-500" />
                {policy}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Timeline */}
      <div>
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-3">Decision Timeline</p>
        <div className="relative pl-6">
          <div className="absolute left-[9px] top-1 bottom-1 w-px bg-gray-200" />
          {displayTimeline.map((entry, i) => {
            const isLast = i === displayTimeline.length - 1;
            return (
              <div key={i} className="relative flex items-start gap-3 pb-3 last:pb-0">
                <div className={`absolute left-[-15px] w-[18px] h-[18px] rounded-full border-2 flex items-center justify-center ${isLast ? 'bg-blue-50 border-blue-300' : 'bg-white border-gray-200'}`}>
                  {isLast ? (
                    <Activity size={8} className="text-blue-500" />
                  ) : (
                    <div className="w-1.5 h-1.5 rounded-full bg-gray-300" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-xs ${isLast ? 'font-semibold text-blue-700' : 'text-gray-700'}`}>{entry.event}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">{entry.time}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Source Systems */}
      <div>
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-3">Data Sources</p>
        <div className="flex flex-wrap gap-2">
          {displaySystems.map((system, i) => (
            <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-50 border border-gray-200 text-xs font-medium text-gray-700">
              <Globe size={11} className="text-gray-400" />
              {system}
            </span>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2 pt-4 border-t border-gray-100" role="group" aria-label="Decision actions">
        {onApprove && (
          <button
            onClick={() => handleAction(onApprove)}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-green-600 hover:bg-green-700 text-white transition-all duration-200 active:scale-[0.97] flex items-center gap-1.5"
          >
            <CheckCircle2 size={14} />
            Approve
          </button>
        )}
        {onOverride && (
          <button
            onClick={() => handleAction(onOverride)}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700 transition-all duration-200 active:scale-[0.97] flex items-center gap-1.5"
          >
            <XCircle size={14} />
            Override
          </button>
        )}
        {onEscalate && (
          <button
            onClick={() => handleAction(onEscalate)}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700 transition-all duration-200 active:scale-[0.97] flex items-center gap-1.5"
          >
            <ArrowUp size={14} />
            Escalate
          </button>
        )}
        {onDefer && (
          <button
            onClick={() => handleAction(onDefer)}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700 transition-all duration-200 active:scale-[0.97] flex items-center gap-1.5"
          >
            <Clock size={14} />
            Defer
          </button>
        )}
      </div>
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
  agentReasoning,
  policies = [],
  sourceSystems = [],
  timeline = [],
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
  const modal = useModal();

  const openDetailModal = useCallback((e) => {
    if (e) e.stopPropagation();
    if (!modal) return;
    modal.open({
      title,
      content: (
        <DecisionDetailModal
          title={title}
          description={description}
          facility={facility}
          priority={priority}
          agent={agent}
          confidence={confidence}
          recommendation={recommendation}
          evidence={evidence}
          impact={impact}
          governanceLevel={governanceLevel}
          agentReasoning={agentReasoning}
          policies={policies}
          sourceSystems={sourceSystems}
          timeline={timeline}
          onApprove={onApprove}
          onOverride={onOverride}
          onEscalate={onEscalate}
          onDefer={onDefer}
          closeModal={() => modal.close()}
        />
      ),
    });
  }, [modal, title, description, facility, priority, agent, confidence, recommendation, evidence, impact, governanceLevel, agentReasoning, policies, sourceSystems, timeline, onApprove, onOverride, onEscalate, onDefer]);

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
      <div className="px-4 py-3 flex items-center gap-2 lg:gap-3">
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
            <h4 className="text-sm font-semibold text-gray-900 truncate max-w-[200px] xl:max-w-none">{title}</h4>
            {facility && <span className="text-[10px] text-gray-400 font-medium hidden sm:inline">{facility}</span>}
          </div>
        </div>
        <div className="flex items-center gap-1.5 lg:gap-2 flex-shrink-0">
          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${badgeColor}`}>
            {priority}
          </span>
          {confidence != null && (
            <span className="text-[10px] font-mono font-medium text-gray-500 tabular-nums hidden sm:inline">
              {(confidence * 100).toFixed(0)}%
            </span>
          )}
          {governanceLevel != null && <span className="hidden md:inline"><GovernanceBadge level={governanceLevel} /></span>}
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
                className="px-2.5 py-1.5 rounded-xl text-[11px] font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700 transition-all duration-200 active:scale-[0.97] hidden lg:block"
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

      {/* Expanded view — animated, scrollable for dense briefings */}
      {isExpanded && (
        <div className="px-4 pb-4 border-t border-gray-100 card-expand max-h-[420px] overflow-y-auto">
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
            {/* View Full Detail button — opens Level 3 modal */}
            <button
              onClick={openDetailModal}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-medium text-gray-500 hover:text-gray-700 bg-gray-50 hover:bg-gray-100 border border-gray-200 transition-all duration-200 active:scale-[0.97]"
            >
              <Maximize2 size={11} />
              View Full Detail
            </button>
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
            agentReasoning={decision.agentReasoning}
            policies={decision.policies}
            sourceSystems={decision.sourceSystems}
            timeline={decision.timeline}
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
