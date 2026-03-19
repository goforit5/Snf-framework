import { useState, useEffect, useCallback, useRef } from 'react';
import { AlertTriangle, CheckCircle2, Clock, TrendingUp, TrendingDown, Bot, User, ChevronRight, ChevronDown, ArrowUpRight, ArrowDownRight, X } from 'lucide-react';
import { ModalContext } from './WidgetUtils';

const FOCUSABLE_SELECTOR = 'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

function useFocusTrap(containerRef, isActive) {
  useEffect(() => {
    if (!isActive || !containerRef.current) return;

    const container = containerRef.current;
    const focusableElements = () => Array.from(container.querySelectorAll(FOCUSABLE_SELECTOR)).filter(el => el.offsetParent !== null);

    // Auto-focus first focusable element
    const elements = focusableElements();
    if (elements.length > 0) {
      elements[0].focus();
    }

    function handleKeyDown(e) {
      if (e.key !== 'Tab') return;
      const els = focusableElements();
      if (els.length === 0) return;

      const first = els[0];
      const last = els[els.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }

    container.addEventListener('keydown', handleKeyDown);
    return () => container.removeEventListener('keydown', handleKeyDown);
  }, [containerRef, isActive]);
}

/* ─── Modal System ─── */
export function ModalProvider({ children }) {
  const [modal, setModal] = useState(null);
  const close = useCallback(() => setModal(null), []);
  const modalRef = useRef(null);

  useFocusTrap(modalRef, !!modal);

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') close(); };
    if (modal) window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [modal, close]);

  return (
    <ModalContext.Provider value={{ open: setModal, close }}>
      {children}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-enter" role="dialog" aria-modal="true" aria-labelledby="modal-title" onClick={close}>
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
          <div
            ref={modalRef}
            className={`relative bg-white rounded-2xl shadow-2xl w-full max-h-[85vh] overflow-hidden modal-enter mx-2 sm:mx-4 ${modal.maxWidth || 'max-w-2xl'}`}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 id="modal-title" className="text-lg font-semibold text-gray-900">{modal.title}</h2>
              <button onClick={close} aria-label="Close dialog" className="p-1.5 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors">
                <X size={18} className="text-gray-400" aria-hidden="true" />
              </button>
            </div>
            <div className="overflow-y-auto max-h-[calc(85vh-130px)] p-6 scrollbar-thin">
              {modal.content}
            </div>
            {modal.actions && (
              <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex items-center justify-end gap-3">
                {modal.actions}
              </div>
            )}
          </div>
        </div>
      )}
    </ModalContext.Provider>
  );
}

/* ─── Page Header ─── */
export function PageHeader({ title, subtitle, aiSummary, riskLevel }) {
  const riskColors = {
    low: 'bg-green-50 text-green-700 border-green-200',
    medium: 'bg-amber-50 text-amber-700 border-amber-200',
    high: 'bg-red-50 text-red-700 border-red-200',
    critical: 'bg-red-100 text-red-800 border-red-300',
  };

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{title}</h1>
          {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
        </div>
        {riskLevel && (
          <span className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${riskColors[riskLevel]}`}>
            {riskLevel.toUpperCase()} RISK
          </span>
        )}
      </div>
      {aiSummary && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl p-5">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
              <Bot size={16} className="text-blue-600" />
            </div>
            <div>
              <p className="text-xs font-semibold text-blue-600 mb-1">AI Analysis</p>
              <p className="text-sm text-gray-700 leading-relaxed">{aiSummary}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Stat Card ─── */
export function StatCard({ label, value, change, changeType, icon: Icon, color = 'blue', onClick }) {
  const colorMap = {
    blue: { bg: 'bg-blue-50', icon: 'text-blue-600', ring: 'ring-blue-100' },
    emerald: { bg: 'bg-emerald-50', icon: 'text-emerald-600', ring: 'ring-emerald-100' },
    amber: { bg: 'bg-amber-50', icon: 'text-amber-600', ring: 'ring-amber-100' },
    red: { bg: 'bg-red-50', icon: 'text-red-600', ring: 'ring-red-100' },
    purple: { bg: 'bg-purple-50', icon: 'text-purple-600', ring: 'ring-purple-100' },
    cyan: { bg: 'bg-cyan-50', icon: 'text-cyan-600', ring: 'ring-cyan-100' },
  };
  const c = colorMap[color] || colorMap.blue;

  return (
    <div
      className={`bg-white rounded-2xl p-4 shadow-sm border border-gray-100 ${onClick ? 'cursor-pointer hover:shadow-md hover:border-gray-200 transition-all active:scale-[0.98]' : ''}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } } : undefined}
      aria-label={onClick ? `${label}: ${value}` : undefined}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-gray-500 font-medium">{label}</span>
        {Icon && (
          <div className={`w-8 h-8 rounded-xl ${c.bg} flex items-center justify-center`}>
            <Icon size={16} className={c.icon} />
          </div>
        )}
      </div>
      <p className="text-2xl font-bold text-gray-900 tracking-tight">{value}</p>
      {change && (
        <div className={`flex items-center gap-1 mt-1.5 text-xs font-medium ${changeType === 'positive' ? 'text-green-600' : changeType === 'negative' ? 'text-red-500' : 'text-gray-400'}`}>
          {changeType === 'positive' ? <ArrowUpRight size={12} /> : changeType === 'negative' ? <ArrowDownRight size={12} /> : null}
          {change}
        </div>
      )}
    </div>
  );
}

/* ─── Card ─── */
export function Card({ title, children, className = '', action, badge, onClick }) {
  return (
    <div
      className={`bg-white rounded-2xl shadow-sm border border-gray-100 ${onClick ? 'cursor-pointer hover:shadow-md transition-all' : ''} ${className}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } } : undefined}
    >
      {title && (
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between min-w-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <h3 className="text-sm font-semibold text-gray-900 truncate">{title}</h3>
            {badge && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-600 border border-red-100">{badge}</span>
            )}
          </div>
          {action}
        </div>
      )}
      <div className="p-6 min-w-0 overflow-hidden">{children}</div>
    </div>
  );
}

/* ─── Collapsible Card ─── */
export function CollapsibleCard({ title, defaultOpen = true, children, badge, className = '' }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className={`bg-white rounded-2xl shadow-sm border border-gray-100 ${className}`}>
      <button
        className="w-full px-6 py-4 border-b border-gray-100 flex items-center justify-between cursor-pointer hover:bg-gray-50/50 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-2.5">
          <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
          {badge && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-600 border border-red-100">{badge}</span>
          )}
        </div>
        {isOpen
          ? <ChevronDown size={16} className="text-gray-400 transition-transform" aria-hidden="true" />
          : <ChevronRight size={16} className="text-gray-400 transition-transform" aria-hidden="true" />
        }
      </button>
      {isOpen && <div className="p-6">{children}</div>}
    </div>
  );
}

/* ─── Badges ─── */
export function PriorityBadge({ priority }) {
  const colors = {
    Critical: 'bg-red-50 text-red-700 border-red-200',
    High: 'bg-amber-50 text-amber-700 border-amber-200',
    Medium: 'bg-blue-50 text-blue-700 border-blue-200',
    Low: 'bg-gray-50 text-gray-600 border-gray-200',
  };
  return (
    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${colors[priority] || colors.Low}`}>
      {priority}
    </span>
  );
}

export function StatusBadge({ status }) {
  const colors = {
    pending: 'bg-amber-50 text-amber-700',
    approved: 'bg-green-50 text-green-700',
    rejected: 'bg-red-50 text-red-700',
    completed: 'bg-green-50 text-green-700',
    'in-progress': 'bg-blue-50 text-blue-700',
    'auto-approved': 'bg-green-50 text-green-700',
    exception: 'bg-red-50 text-red-700',
    'pending-approval': 'bg-amber-50 text-amber-700',
    received: 'bg-green-50 text-green-700',
    missing: 'bg-red-50 text-red-700',
  };
  return (
    <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold ${colors[status] || 'bg-gray-100 text-gray-500'}`}>
      {status}
    </span>
  );
}

/* ─── Confidence Bar ─── */
export function ConfidenceBar({ value }) {
  const color = value >= 0.9 ? 'bg-green-500' : value >= 0.7 ? 'bg-amber-500' : 'bg-red-500';
  const pct = (value * 100).toFixed(0);
  return (
    <div className="flex items-center gap-2" role="meter" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={`Confidence: ${pct}%`}>
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden" aria-hidden="true">
        <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${value * 100}%` }} />
      </div>
      <span className="text-[10px] text-gray-500 font-mono font-medium">{pct}%</span>
    </div>
  );
}

/* ─── Buttons ─── */
export function ActionButton({ label, variant = 'primary', onClick, icon: Icon }) {
  const variants = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm',
    success: 'bg-green-600 hover:bg-green-700 text-white shadow-sm',
    danger: 'bg-red-600 hover:bg-red-700 text-white shadow-sm',
    ghost: 'bg-gray-100 hover:bg-gray-200 text-gray-700',
    outline: 'bg-white border border-gray-200 hover:bg-gray-50 text-gray-700',
  };
  return (
    <button onClick={onClick} className={`px-3.5 py-2 min-h-[44px] min-w-[44px] rounded-xl text-xs font-semibold transition-all active:scale-[0.97] flex items-center justify-center gap-1.5 ${variants[variant]}`}>
      {Icon && <Icon size={13} />}
      {label}
    </button>
  );
}

/* ─── Progress Bar ─── */
export function ProgressBar({ value, label, color = 'blue' }) {
  const colors = { blue: 'bg-blue-500', emerald: 'bg-emerald-500', amber: 'bg-amber-500', red: 'bg-red-500' };
  return (
    <div role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={100} aria-label={label ? `${label}: ${value}%` : `${value}%`}>
      {label && (
        <div className="flex justify-between mb-1.5">
          <span className="text-xs text-gray-500">{label}</span>
          <span className="text-xs text-gray-700 font-mono font-semibold">{value}%</span>
        </div>
      )}
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden" aria-hidden="true">
        <div className={`h-full rounded-full ${colors[color]} transition-all`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

/* ─── Agent Badge ─── */
export function EmptyAgentBadge({ agent }) {
  return (
    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-100">
      <Bot size={12} className="text-blue-600" />
      <span className="text-[11px] text-blue-700 font-medium">{agent}</span>
    </div>
  );
}

export function ActorBadge({ name, type }) {
  return (
    <div className="inline-flex items-center gap-1.5">
      {type === 'agent' ? (
        <div className="w-5 h-5 rounded-md bg-blue-50 flex items-center justify-center">
          <Bot size={11} className="text-blue-600" />
        </div>
      ) : (
        <div className="w-5 h-5 rounded-md bg-green-50 flex items-center justify-center">
          <User size={11} className="text-green-600" />
        </div>
      )}
      <span className="text-xs text-gray-700 font-medium">{name}</span>
    </div>
  );
}

/* ─── Facility Card ─── */
export function FacilityCard({ facility, onClick }) {
  const riskBorder = facility.surveyRisk === 'High' ? 'border-red-200 bg-red-50/30' : facility.surveyRisk === 'Medium' ? 'border-amber-200 bg-amber-50/30' : 'border-gray-100';
  const healthColor = facility.healthScore >= 80 ? 'text-green-600' : facility.healthScore >= 70 ? 'text-amber-600' : 'text-red-600';

  return (
    <div
      className={`bg-white border ${riskBorder} rounded-2xl p-5 hover:shadow-md transition-all cursor-pointer active:scale-[0.98]`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick?.(); } }}
      aria-label={`${facility.name}, health score ${facility.healthScore}, ${facility.surveyRisk} risk`}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-900">{facility.name}</h3>
        <span className={`text-xl font-bold ${healthColor}`}>{facility.healthScore}</span>
      </div>
      <p className="text-xs text-gray-400 mb-4">{facility.city}</p>
      <div className="grid grid-cols-2 gap-2.5 text-xs">
        <div><span className="text-gray-400">Census:</span> <span className="text-gray-700 font-medium">{facility.census}/{facility.beds}</span></div>
        <div><span className="text-gray-400">Occupancy:</span> <span className="text-gray-700 font-medium">{facility.occupancy}%</span></div>
        <div><span className="text-gray-400">Labor %:</span> <span className="text-gray-700 font-medium">{facility.laborPct}%</span></div>
        <div><span className="text-gray-400">Incidents:</span> <span className="text-gray-700 font-medium">{facility.openIncidents}</span></div>
      </div>
      <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
        <StatusBadge status={facility.surveyRisk === 'High' ? 'exception' : facility.surveyRisk === 'Medium' ? 'pending' : 'completed'} />
        <span className="text-xs text-gray-400 font-medium">AP: ${(facility.apAging / 1000).toFixed(0)}K</span>
      </div>
    </div>
  );
}

/* ─── Clickable Row ─── */
export function ClickableRow({ children, onClick, className = '' }) {
  return (
    <div
      className={`rounded-xl p-4 bg-gray-50/50 border border-gray-100 hover:bg-white hover:shadow-sm hover:border-gray-200 transition-all cursor-pointer active:scale-[0.995] ${className}`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick?.(); } }}
    >
      {children}
    </div>
  );
}

/* ─── Mini Chart ─── */
export function MiniChart({ data, height = 40 }) {
  if (!data || data.length === 0) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;

  return (
    <div className="flex items-end gap-0.5" style={{ height }}>
      {data.map((val, i) => (
        <div
          key={i}
          className="flex-1 bg-blue-200 rounded-t"
          style={{ height: `${((val - min) / range) * 100}%`, minHeight: 2 }}
        />
      ))}
    </div>
  );
}

/* ─── Section Divider ─── */
export function SectionLabel({ children }) {
  return (
    <div className="flex items-center gap-3 mb-4 mt-2">
      <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider">{children}</h2>
      <div className="flex-1 h-px bg-gray-200" />
    </div>
  );
}

/* ─── Agent vs Human Indicator ─── */
export function AgentHumanSplit({ agentCount, humanCount, agentLabel = 'Agent Actions', humanLabel = 'Human Decisions' }) {
  const total = agentCount + humanCount;
  const agentPct = total > 0 ? (agentCount / total * 100).toFixed(0) : 0;
  return (
    <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-2xl p-5 border border-blue-100/50">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Bot size={16} className="text-blue-600" />
          <span className="text-sm font-semibold text-gray-900">{agentLabel}</span>
          <span className="text-sm font-bold text-blue-600">{agentCount}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-green-600">{humanCount}</span>
          <span className="text-sm font-semibold text-gray-900">{humanLabel}</span>
          <User size={16} className="text-green-600" />
        </div>
      </div>
      <div className="h-3 bg-white rounded-full overflow-hidden flex shadow-inner">
        <div className="bg-blue-500 rounded-l-full transition-all" style={{ width: `${agentPct}%` }} />
        <div className="bg-green-500 rounded-r-full flex-1" />
      </div>
      <p className="text-center text-xs text-gray-500 mt-2">
        Agents handle <span className="font-semibold text-blue-600">{agentPct}%</span> autonomously — humans approve exceptions
      </p>
    </div>
  );
}
