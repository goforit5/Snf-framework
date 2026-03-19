import { Bot, CheckCircle2, Circle, Wifi, Database, Shield, Zap } from 'lucide-react';

const defaultSystems = ['PCC', 'Workday', 'Microsoft 365'];

const checklistItems = [
  { label: 'Data connectors configured', done: true },
  { label: 'Agent training complete', done: true },
  { label: 'Policy rules loaded', done: true },
  { label: 'Awaiting deployment authorization', done: false },
];

const systemIcons = {
  PCC: Database,
  Workday: Shield,
  'Microsoft 365': Wifi,
  SharePoint: Zap,
};

export default function ComingSoon({
  title = 'Module Activating',
  section = '',
  systems = defaultSystems,
  capability = '',
}) {
  return (
    <div className="flex items-center justify-center min-h-[70vh] px-6">
      <div className="max-w-lg w-full">
        {/* Outer card */}
        <div className="rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 p-8 text-center">

          {/* Animated agent icon */}
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-2xl bg-white shadow-sm flex items-center justify-center">
              <Bot size={32} className="text-indigo-500 animate-pulse" />
            </div>
          </div>

          {/* Title */}
          <h1 className="text-xl font-bold text-gray-900 mb-1">{title}</h1>

          {/* Section subtitle */}
          {section && (
            <p className="text-sm font-medium text-indigo-500 mb-3">{section}</p>
          )}

          {/* Status message */}
          <p className="text-sm text-gray-500 mb-6 max-w-sm mx-auto leading-relaxed">
            Agent deployment in progress. This module will connect to{' '}
            {systems.join(', ')} and begin autonomous monitoring.
          </p>

          {/* Agent readiness checklist */}
          <div className="rounded-xl bg-white border border-gray-100 p-4 mb-6 text-left">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Deployment Status
            </p>
            <ul className="space-y-2.5">
              {checklistItems.map((item) => (
                <li key={item.label} className="flex items-center gap-2.5 text-sm">
                  {item.done ? (
                    <CheckCircle2 size={16} className="text-emerald-500 flex-shrink-0" />
                  ) : (
                    <Circle size={16} className="text-amber-400 animate-pulse flex-shrink-0" />
                  )}
                  <span className={item.done ? 'text-gray-700' : 'text-amber-600 font-medium'}>
                    {item.label}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Systems to connect */}
          <div className="flex flex-wrap justify-center gap-2 mb-6">
            {systems.map((sys) => {
              const Icon = systemIcons[sys] || Database;
              return (
                <span
                  key={sys}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-gray-100 text-xs font-medium text-gray-600 shadow-sm"
                >
                  <Icon size={12} className="text-gray-400" />
                  {sys}
                </span>
              );
            })}
          </div>

          {/* Capability description */}
          {capability && (
            <p className="text-sm text-gray-400 mb-6 max-w-sm mx-auto leading-relaxed">
              {capability}
            </p>
          )}

          {/* CTA button */}
          <button
            type="button"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-indigo-200 text-sm font-medium text-indigo-600 hover:bg-indigo-50 transition-colors cursor-default"
          >
            <Zap size={14} />
            Request Priority Activation
          </button>
        </div>
      </div>
    </div>
  );
}
