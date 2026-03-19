import { useState, useMemo, useCallback } from 'react';
import { Bot, Shield, Users, Globe, RotateCcw, Zap, ChevronDown, ChevronRight, Save, Bell, BellOff, Mail, Check } from 'lucide-react';
import { PageHeader, Card, ActionButton, SectionLabel } from '../../components/Widgets';
import { StatGrid } from '../../components/DataComponents';
import { GovernanceBadge } from '../../components/DecisionComponents';
import { useAuth } from '../../hooks/useAuth';
import { useScopeContext } from '../../hooks/useScopeContext';
import { agentRegistry, agentsByDomain, domainLabels } from '../../data/agents/agentRegistry';
import { demoUserList, roles } from '../../data/platform/users';
import { governanceLevels, policies } from '../../data/platform/policies';
import { regions } from '../../data/entities/regions';
import { facilities } from '../../data/entities/facilities';

const PLATFORM_VERSION = '2.0.0-demo';
const LAST_REFRESH = '2026-03-15T08:20:00Z';
const STORAGE_KEY = 'snf-agent-config';

const NOTIFICATION_OPTIONS = [
  { value: 'in-app', label: 'In-App', icon: Bell },
  { value: 'email', label: 'Email', icon: Mail },
  { value: 'none', label: 'None', icon: BellOff },
];

const DOMAIN_COLORS = {
  clinical: 'border-l-blue-500 bg-blue-50/30',
  'revenue-cycle': 'border-l-emerald-500 bg-emerald-50/30',
  workforce: 'border-l-violet-500 bg-violet-50/30',
  operations: 'border-l-orange-500 bg-orange-50/30',
  'quality-compliance': 'border-l-amber-500 bg-amber-50/30',
  'legal-strategic': 'border-l-slate-500 bg-slate-50/30',
  vendor: 'border-l-green-500 bg-green-50/30',
  orchestration: 'border-l-indigo-500 bg-indigo-50/30',
  meta: 'border-l-gray-500 bg-gray-50/30',
};

const DOMAIN_HEADER_COLORS = {
  clinical: 'from-blue-50 to-blue-100/50 border-blue-200',
  'revenue-cycle': 'from-emerald-50 to-emerald-100/50 border-emerald-200',
  workforce: 'from-violet-50 to-violet-100/50 border-violet-200',
  operations: 'from-orange-50 to-orange-100/50 border-orange-200',
  'quality-compliance': 'from-amber-50 to-amber-100/50 border-amber-200',
  'legal-strategic': 'from-slate-50 to-slate-100/50 border-slate-200',
  vendor: 'from-green-50 to-green-100/50 border-green-200',
  orchestration: 'from-indigo-50 to-indigo-100/50 border-indigo-200',
  meta: 'from-gray-50 to-gray-100/50 border-gray-200',
};

/* ─── Build default config from agent registry ─── */
function buildDefaultConfig() {
  return Object.fromEntries(
    agentRegistry.map(a => [a.id, {
      enabled: a.status === 'active',
      governanceLevel: a.governanceLevel,
      notification: 'in-app',
    }])
  );
}

/* ─── Load saved config from sessionStorage ─── */
function loadConfig() {
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Merge with defaults to handle any new agents
      const defaults = buildDefaultConfig();
      return { ...defaults, ...parsed };
    }
  } catch { /* ignore */ }
  return buildDefaultConfig();
}

/* ─── Agent Row Component ─── */
function AgentConfigRow({ agent, config, onChange }) {
  const isEnabled = config.enabled;

  return (
    <div className={`rounded-xl border border-gray-100 border-l-4 ${DOMAIN_COLORS[agent.domain] || 'border-l-gray-300 bg-gray-50/30'} p-3 transition-all ${
      !isEnabled ? 'opacity-60' : ''
    }`}>
      <div className="flex items-center gap-3">
        {/* Status dot + name */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${isEnabled ? 'bg-green-500' : 'bg-amber-500'}`} />
            <p className="text-xs font-semibold text-gray-900 truncate">{agent.displayName}</p>
          </div>
          <p className="text-[10px] text-gray-400 mt-0.5 truncate">{agent.description.split('.')[0]}</p>
        </div>

        {/* Enable/Disable toggle */}
        <button
          onClick={() => onChange({ ...config, enabled: !isEnabled })}
          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors flex-shrink-0 ${
            isEnabled ? 'bg-emerald-500' : 'bg-gray-300'
          }`}
          aria-label={isEnabled ? 'Disable agent' : 'Enable agent'}
        >
          <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-sm transition-transform ${
            isEnabled ? 'translate-x-[18px]' : 'translate-x-[3px]'
          }`} />
        </button>
      </div>

      {/* Controls row */}
      <div className="flex items-center gap-3 mt-2.5 pt-2.5 border-t border-gray-100/80">
        {/* Governance level selector */}
        <div className="flex-1 min-w-0">
          <label className="text-[10px] text-gray-400 font-medium block mb-1">Governance</label>
          <select
            value={config.governanceLevel}
            onChange={(e) => onChange({ ...config, governanceLevel: Number(e.target.value) })}
            className="w-full text-[11px] font-medium text-gray-700 bg-white border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-300 transition-all cursor-pointer appearance-none"
            style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239CA3AF' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 6px center' }}
          >
            {governanceLevels.map(gl => (
              <option key={gl.level} value={gl.level}>
                L{gl.level} — {gl.name}
              </option>
            ))}
          </select>
        </div>

        {/* Notification preference */}
        <div className="flex-shrink-0">
          <label className="text-[10px] text-gray-400 font-medium block mb-1">Notifications</label>
          <div className="flex gap-1">
            {NOTIFICATION_OPTIONS.map(opt => {
              const Icon = opt.icon;
              const isSelected = config.notification === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={() => onChange({ ...config, notification: opt.value })}
                  title={opt.label}
                  className={`p-1.5 rounded-lg transition-all ${
                    isSelected
                      ? 'bg-blue-100 text-blue-700 border border-blue-200'
                      : 'bg-white text-gray-400 border border-gray-200 hover:bg-gray-50 hover:text-gray-600'
                  }`}
                >
                  <Icon size={12} />
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Domain Group Component ─── */
function DomainGroup({ domain, agents, agentConfigs, onAgentChange, defaultExpanded }) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const activeInGroup = agents.filter(a => agentConfigs[a.id]?.enabled).length;

  return (
    <div className="rounded-2xl border border-gray-200 overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className={`w-full flex items-center justify-between px-4 py-3 bg-gradient-to-r ${DOMAIN_HEADER_COLORS[domain] || 'from-gray-50 to-gray-100/50 border-gray-200'} transition-colors hover:brightness-[0.98]`}
      >
        <div className="flex items-center gap-2.5">
          {expanded ? <ChevronDown size={14} className="text-gray-500" /> : <ChevronRight size={14} className="text-gray-500" />}
          <span className="text-sm font-semibold text-gray-900">{domainLabels[domain] || domain}</span>
          <span className="text-[10px] text-gray-500 font-medium">
            {agents.length} {agents.length === 1 ? 'agent' : 'agents'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
            activeInGroup === agents.length
              ? 'bg-emerald-100 text-emerald-700'
              : activeInGroup === 0
                ? 'bg-amber-100 text-amber-700'
                : 'bg-blue-100 text-blue-700'
          }`}>
            {activeInGroup}/{agents.length} active
          </span>
        </div>
      </button>
      {expanded && (
        <div className="p-3 grid grid-cols-1 lg:grid-cols-2 gap-3 bg-white">
          {agents.map(agent => (
            <AgentConfigRow
              key={agent.id}
              agent={agent}
              config={agentConfigs[agent.id]}
              onChange={(newConfig) => onAgentChange(agent.id, newConfig)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Main Settings Page ─── */
export default function Settings() {
  const { user, switchRole } = useAuth();
  const { scope, setScope } = useScopeContext();

  // Agent configuration state — loaded from sessionStorage or defaults
  const [agentConfigs, setAgentConfigs] = useState(loadConfig);
  const [savedConfigs, setSavedConfigs] = useState(loadConfig);
  const [saveFlash, setSaveFlash] = useState(false);

  // Derived counts
  const activeCount = Object.values(agentConfigs).filter(c => c.enabled).length;
  const pausedCount = Object.values(agentConfigs).filter(c => !c.enabled).length;

  // Check for unsaved changes
  const hasUnsavedChanges = useMemo(
    () => JSON.stringify(agentConfigs) !== JSON.stringify(savedConfigs),
    [agentConfigs, savedConfigs]
  );

  // Ordered domain keys for consistent rendering
  const domainOrder = useMemo(
    () => Object.keys(agentsByDomain).sort((a, b) => {
      const order = ['clinical', 'revenue-cycle', 'workforce', 'operations', 'quality-compliance', 'legal-strategic', 'vendor', 'orchestration', 'meta'];
      return order.indexOf(a) - order.indexOf(b);
    }),
    []
  );

  const handleAgentChange = useCallback((agentId, newConfig) => {
    setAgentConfigs(prev => ({ ...prev, [agentId]: newConfig }));
  }, []);

  const handleSave = useCallback(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(agentConfigs));
      setSavedConfigs({ ...agentConfigs });
      setSaveFlash(true);
      setTimeout(() => setSaveFlash(false), 2000);
    } catch { /* sessionStorage full or unavailable */ }
  }, [agentConfigs]);

  const handleReset = useCallback(() => {
    const defaults = buildDefaultConfig();
    setAgentConfigs(defaults);
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch { /* ignore */ }
    setSavedConfigs(defaults);
  }, []);

  const handleEnableAll = useCallback(() => {
    setAgentConfigs(prev => {
      const next = { ...prev };
      for (const id in next) next[id] = { ...next[id], enabled: true };
      return next;
    });
  }, []);

  const handlePauseAll = useCallback(() => {
    setAgentConfigs(prev => {
      const next = { ...prev };
      for (const id in next) next[id] = { ...next[id], enabled: false };
      return next;
    });
  }, []);

  const stats = [
    { label: 'Active Agents', value: activeCount, icon: Bot, color: 'emerald' },
    { label: 'Governance Policies', value: policies.length, icon: Shield, color: 'purple' },
    { label: 'Paused Agents', value: pausedCount, icon: Bot, color: 'amber' },
    { label: 'Current Role', value: roles.find(r => r.id === user.role)?.name?.split(' ').pop() || user.role, icon: Users, color: 'blue' },
    { label: 'Current Scope', value: scope.label, icon: Globe, color: 'cyan' },
  ];

  return (
    <div>
      <PageHeader
        title="Platform Settings"
        subtitle="Configuration, role switching, scope management, and agent controls"
        aiSummary={`Platform running ${activeCount} active agents across ${Object.keys(domainLabels).length} domains with ${policies.length} governance policies enforced. Current session: ${user.name} (${user.title}).`}
      />

      <StatGrid stats={stats} columns={5} />

      <div className="mt-8 space-y-8">
        {/* ─── User & Role ─── */}
        <div>
          <SectionLabel>User & Role</SectionLabel>
          <Card title="Role Switcher" action={<span className="text-xs text-gray-400">Demo mode</span>}>
            <div className="mb-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-sm">
                {user.avatarInitials}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">{user.name}</p>
                <p className="text-xs text-gray-500">{user.title}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {demoUserList.map(u => {
                const r = roles.find(rl => rl.id === u.role);
                const isActive = user.role === u.role;
                return (
                  <button
                    key={u.role}
                    onClick={() => switchRole(u.role)}
                    className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all active:scale-[0.97] border ${
                      isActive
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                        : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                    }`}
                  >
                    <span className="block">{u.name}</span>
                    <span className={`block text-[10px] mt-0.5 ${isActive ? 'text-blue-200' : 'text-gray-400'}`}>
                      {r?.name || u.role}
                    </span>
                  </button>
                );
              })}
            </div>
          </Card>
        </div>

        {/* ─── Scope Configuration ─── */}
        <div>
          <SectionLabel>Scope Configuration</SectionLabel>
          <Card title="Data Scope" action={<span className="text-xs text-gray-400">Current: {scope.label}</span>}>
            <div className="space-y-3">
              <div>
                <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-2">Enterprise</p>
                <button
                  onClick={() => setScope('enterprise')}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all active:scale-[0.97] border ${
                    scope.type === 'enterprise'
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                      : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  All Facilities
                </button>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-2">Regions</p>
                <div className="flex flex-wrap gap-2">
                  {regions.map(r => {
                    const isActive = scope.type === 'region' && scope.id === r.id;
                    return (
                      <button
                        key={r.id}
                        onClick={() => setScope('region', r.id)}
                        className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all active:scale-[0.97] border ${
                          isActive
                            ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                            : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        {r.name}
                        <span className={`block text-[10px] mt-0.5 ${isActive ? 'text-blue-200' : 'text-gray-400'}`}>
                          {r.facilityIds.length} facilities
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-2">Facilities</p>
                <div className="flex flex-wrap gap-2">
                  {facilities.map(f => {
                    const isActive = scope.type === 'facility' && scope.id === f.id;
                    return (
                      <button
                        key={f.id}
                        onClick={() => setScope('facility', f.id)}
                        className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all active:scale-[0.97] border ${
                          isActive
                            ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                            : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        {f.name}
                        <span className={`block text-[10px] mt-0.5 ${isActive ? 'text-blue-200' : 'text-gray-400'}`}>
                          {f.city}, {f.state}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* ─── Agent Configuration Panel ─── */}
        <div>
          <SectionLabel>Agent Configuration</SectionLabel>

          {/* Toolbar: bulk actions + save/reset */}
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <ActionButton label="Enable All" variant="primary" icon={Zap} onClick={handleEnableAll} />
              <ActionButton label="Pause All" variant="outline" icon={Bot} onClick={handlePauseAll} />
              <ActionButton label="Reset Defaults" variant="ghost" icon={RotateCcw} onClick={handleReset} />
            </div>
            <div className="flex items-center gap-3">
              {hasUnsavedChanges && (
                <span className="text-[11px] text-amber-600 font-medium flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                  Unsaved changes
                </span>
              )}
              <button
                onClick={handleSave}
                disabled={!hasUnsavedChanges && !saveFlash}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all active:scale-[0.97] ${
                  saveFlash
                    ? 'bg-emerald-600 text-white border border-emerald-600 shadow-sm'
                    : hasUnsavedChanges
                      ? 'bg-blue-600 text-white border border-blue-600 shadow-sm hover:bg-blue-700'
                      : 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed'
                }`}
              >
                {saveFlash ? <Check size={14} /> : <Save size={14} />}
                {saveFlash ? 'Saved' : 'Save Configuration'}
              </button>
            </div>
          </div>

          {/* Agent groups by domain */}
          <div className="space-y-3">
            {domainOrder.map((domain, idx) => (
              <DomainGroup
                key={domain}
                domain={domain}
                agents={agentsByDomain[domain]}
                agentConfigs={agentConfigs}
                onAgentChange={handleAgentChange}
                defaultExpanded={idx < 3}
              />
            ))}
          </div>
        </div>

        {/* ─── Governance Levels ─── */}
        <div>
          <SectionLabel>Governance Levels</SectionLabel>
          <Card title="Governance Framework" action={<span className="text-xs text-gray-400">6 levels defined</span>}>
            <div className="space-y-3">
              {governanceLevels.map(gl => {
                const levelPolicies = policies.filter(p => p.governanceLevel === gl.level);
                return (
                  <div key={gl.level} className="rounded-xl border border-gray-100 p-4 bg-gray-50/50">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2.5">
                        <GovernanceBadge level={gl.level} />
                        <span className="text-sm font-semibold text-gray-900">{gl.name}</span>
                      </div>
                      <span className="text-[10px] text-gray-400 font-medium">
                        {levelPolicies.length} {levelPolicies.length === 1 ? 'policy' : 'policies'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mb-2">{gl.description}</p>
                    {levelPolicies.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {levelPolicies.map(p => (
                          <span key={p.id} className="px-2 py-0.5 rounded-md bg-white border border-gray-200 text-[10px] text-gray-600 font-medium">
                            {p.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        {/* ─── Demo Controls ─── */}
        <div>
          <SectionLabel>Demo Controls</SectionLabel>
          <Card title="Platform Controls" action={<span className="text-xs text-gray-400">Demo mode</span>}>
            <div className="space-y-4">
              <div className="border-t border-gray-100 pt-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
                  <div>
                    <span className="text-gray-400 block mb-0.5">Platform Version</span>
                    <span className="font-semibold text-gray-900 font-mono">{PLATFORM_VERSION}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block mb-0.5">Last Data Refresh</span>
                    <span className="font-semibold text-gray-900">
                      {new Date(LAST_REFRESH).toLocaleString('en-US', {
                        month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400 block mb-0.5">Environment</span>
                    <span className="font-semibold text-gray-900">Demo (GitHub Pages)</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
