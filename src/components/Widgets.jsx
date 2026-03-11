import { AlertTriangle, CheckCircle2, Clock, TrendingUp, TrendingDown, Bot, User, ChevronRight, ArrowUpRight, ArrowDownRight } from 'lucide-react';

export function PageHeader({ title, subtitle, aiSummary, riskLevel }) {
  const riskColors = {
    low: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    medium: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    high: 'bg-red-500/10 text-red-400 border-red-500/20',
    critical: 'bg-red-600/10 text-red-500 border-red-600/20',
  };

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h1 className="text-2xl font-bold text-white">{title}</h1>
          {subtitle && <p className="text-sm text-gray-400 mt-0.5">{subtitle}</p>}
        </div>
        {riskLevel && (
          <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${riskColors[riskLevel]}`}>
            {riskLevel.toUpperCase()} RISK
          </span>
        )}
      </div>
      {aiSummary && (
        <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4">
          <div className="flex items-start gap-2">
            <Bot size={16} className="text-blue-400 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-blue-200 leading-relaxed">{aiSummary}</p>
          </div>
        </div>
      )}
    </div>
  );
}

export function StatCard({ label, value, change, changeType, icon: Icon, color = 'blue' }) {
  const colorMap = {
    blue: 'from-blue-600/20 to-blue-600/5 border-blue-500/20',
    emerald: 'from-emerald-600/20 to-emerald-600/5 border-emerald-500/20',
    amber: 'from-amber-600/20 to-amber-600/5 border-amber-500/20',
    red: 'from-red-600/20 to-red-600/5 border-red-500/20',
    purple: 'from-purple-600/20 to-purple-600/5 border-purple-500/20',
    cyan: 'from-cyan-600/20 to-cyan-600/5 border-cyan-500/20',
  };
  const iconColorMap = {
    blue: 'text-blue-400', emerald: 'text-emerald-400', amber: 'text-amber-400',
    red: 'text-red-400', purple: 'text-purple-400', cyan: 'text-cyan-400',
  };

  return (
    <div className={`bg-gradient-to-br ${colorMap[color]} border rounded-xl p-4`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-gray-400 font-medium">{label}</span>
        {Icon && <Icon size={16} className={iconColorMap[color]} />}
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
      {change && (
        <div className={`flex items-center gap-1 mt-1 text-xs ${changeType === 'positive' ? 'text-emerald-400' : changeType === 'negative' ? 'text-red-400' : 'text-gray-400'}`}>
          {changeType === 'positive' ? <ArrowUpRight size={12} /> : changeType === 'negative' ? <ArrowDownRight size={12} /> : null}
          {change}
        </div>
      )}
    </div>
  );
}

export function Card({ title, children, className = '', action, badge }) {
  return (
    <div className={`bg-gray-900 border border-gray-800 rounded-xl ${className}`}>
      {title && (
        <div className="px-5 py-3 border-b border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-white">{title}</h3>
            {badge && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/30">{badge}</span>
            )}
          </div>
          {action}
        </div>
      )}
      <div className="p-5">{children}</div>
    </div>
  );
}

export function PriorityBadge({ priority }) {
  const colors = {
    Critical: 'bg-red-500/20 text-red-400 border-red-500/30',
    High: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    Medium: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    Low: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  };
  return (
    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${colors[priority] || colors.Low}`}>
      {priority}
    </span>
  );
}

export function StatusBadge({ status }) {
  const colors = {
    pending: 'bg-amber-500/20 text-amber-400',
    approved: 'bg-emerald-500/20 text-emerald-400',
    rejected: 'bg-red-500/20 text-red-400',
    completed: 'bg-emerald-500/20 text-emerald-400',
    'in-progress': 'bg-blue-500/20 text-blue-400',
    'auto-approved': 'bg-emerald-500/20 text-emerald-400',
    exception: 'bg-red-500/20 text-red-400',
    'pending-approval': 'bg-amber-500/20 text-amber-400',
    received: 'bg-emerald-500/20 text-emerald-400',
    missing: 'bg-red-500/20 text-red-400',
  };
  return (
    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${colors[status] || 'bg-gray-500/20 text-gray-400'}`}>
      {status}
    </span>
  );
}

export function ConfidenceBar({ value }) {
  const color = value >= 0.9 ? 'bg-emerald-500' : value >= 0.7 ? 'bg-amber-500' : 'bg-red-500';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${value * 100}%` }} />
      </div>
      <span className="text-[10px] text-gray-400 font-mono">{(value * 100).toFixed(0)}%</span>
    </div>
  );
}

export function ActionButton({ label, variant = 'primary', onClick }) {
  const variants = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white',
    success: 'bg-emerald-600 hover:bg-emerald-700 text-white',
    danger: 'bg-red-600 hover:bg-red-700 text-white',
    ghost: 'bg-gray-800 hover:bg-gray-700 text-gray-300',
  };
  return (
    <button onClick={onClick} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${variants[variant]}`}>
      {label}
    </button>
  );
}

export function ProgressBar({ value, label, color = 'blue' }) {
  const colors = { blue: 'bg-blue-500', emerald: 'bg-emerald-500', amber: 'bg-amber-500', red: 'bg-red-500' };
  return (
    <div>
      {label && (
        <div className="flex justify-between mb-1">
          <span className="text-xs text-gray-400">{label}</span>
          <span className="text-xs text-gray-300 font-mono">{value}%</span>
        </div>
      )}
      <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${colors[color]} transition-all`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

export function EmptyAgentBadge({ agent }) {
  return (
    <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-gray-800 border border-gray-700">
      <Bot size={12} className="text-blue-400" />
      <span className="text-[11px] text-gray-300">{agent}</span>
    </div>
  );
}

export function ActorBadge({ name, type }) {
  return (
    <div className="inline-flex items-center gap-1.5">
      {type === 'agent' ? (
        <Bot size={12} className="text-blue-400" />
      ) : (
        <User size={12} className="text-emerald-400" />
      )}
      <span className="text-xs text-gray-300">{name}</span>
    </div>
  );
}

export function FacilityCard({ facility }) {
  const riskColor = facility.surveyRisk === 'High' ? 'border-red-500/40' : facility.surveyRisk === 'Medium' ? 'border-amber-500/40' : 'border-emerald-500/40';
  const healthColor = facility.healthScore >= 80 ? 'text-emerald-400' : facility.healthScore >= 70 ? 'text-amber-400' : 'text-red-400';

  return (
    <div className={`bg-gray-900 border ${riskColor} rounded-xl p-4 hover:bg-gray-800/50 transition-colors cursor-pointer`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-white">{facility.name}</h3>
        <span className={`text-lg font-bold ${healthColor}`}>{facility.healthScore}</span>
      </div>
      <p className="text-xs text-gray-500 mb-3">{facility.city}</p>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div><span className="text-gray-500">Census:</span> <span className="text-gray-300">{facility.census}/{facility.beds}</span></div>
        <div><span className="text-gray-500">Occupancy:</span> <span className="text-gray-300">{facility.occupancy}%</span></div>
        <div><span className="text-gray-500">Labor %:</span> <span className="text-gray-300">{facility.laborPct}%</span></div>
        <div><span className="text-gray-500">Incidents:</span> <span className="text-gray-300">{facility.openIncidents}</span></div>
      </div>
      <div className="mt-3 flex items-center justify-between">
        <StatusBadge status={facility.surveyRisk === 'High' ? 'exception' : facility.surveyRisk === 'Medium' ? 'pending' : 'completed'} />
        <span className="text-xs text-gray-500">AP: ${(facility.apAging / 1000).toFixed(0)}K</span>
      </div>
    </div>
  );
}

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
          className="flex-1 bg-blue-500/40 rounded-t"
          style={{ height: `${((val - min) / range) * 100}%`, minHeight: 2 }}
        />
      ))}
    </div>
  );
}
