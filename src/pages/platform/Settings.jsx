import { useState } from 'react';
import { Settings as SettingsIcon, Bot, Shield, Users, Globe, RotateCcw, Zap, Info } from 'lucide-react';
import { PageHeader, Card, ActionButton, SectionLabel } from '../../components/Widgets';
import { StatGrid } from '../../components/DataComponents';
import { GovernanceBadge } from '../../components/DecisionComponents';
import { useAuth } from '../../providers/AuthProvider';
import { useScopeContext } from '../../providers/ScopeProvider';
import { agentRegistry, domainLabels } from '../../data/agents/agentRegistry';
import { demoUserList, roles } from '../../data/platform/users';
import { governanceLevels, policies } from '../../data/platform/policies';
import { regions } from '../../data/entities/regions';
import { facilities } from '../../data/entities/facilities';

const PLATFORM_VERSION = '2.0.0-demo';
const LAST_REFRESH = '2026-03-15T08:20:00Z';

export default function Settings() {
  const { user, switchRole } = useAuth();
  const { scope, setScope } = useScopeContext();
  const [agentStates, setAgentStates] = useState(() =>
    Object.fromEntries(agentRegistry.map(a => [a.id, a.status]))
  );

  const activeCount = Object.values(agentStates).filter(s => s === 'active').length;
  const pausedCount = Object.values(agentStates).filter(s => s !== 'active').length;

  function toggleAgent(agentId) {
    setAgentStates(prev => ({
      ...prev,
      [agentId]: prev[agentId] === 'active' ? 'paused' : 'active',
    }));
  }

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

        {/* ─── Agent Management ─── */}
        <div>
          <SectionLabel>Agent Management</SectionLabel>
          <Card
            title="Agent Fleet"
            badge={`${activeCount} active`}
            action={<span className="text-xs text-gray-400">{agentRegistry.length} total agents</span>}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {agentRegistry.map(agent => {
                const isActive = agentStates[agent.id] === 'active';
                const domainColors = {
                  clinical: 'border-l-blue-500',
                  'revenue-cycle': 'border-l-emerald-500',
                  workforce: 'border-l-violet-500',
                  operations: 'border-l-orange-500',
                  'quality-compliance': 'border-l-amber-500',
                  'legal-strategic': 'border-l-slate-500',
                  vendor: 'border-l-green-500',
                  orchestration: 'border-l-indigo-500',
                  meta: 'border-l-gray-500',
                };
                return (
                  <div
                    key={agent.id}
                    className={`rounded-xl border border-gray-100 border-l-4 ${domainColors[agent.domain] || 'border-l-gray-300'} p-3 flex items-center gap-3 ${
                      isActive ? 'bg-white' : 'bg-gray-50 opacity-70'
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${isActive ? 'bg-green-500' : 'bg-amber-500'}`} />
                        <p className="text-xs font-semibold text-gray-900 truncate">{agent.displayName}</p>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] text-gray-400">{domainLabels[agent.domain] || agent.domain}</span>
                        <GovernanceBadge level={agent.governanceLevel} />
                      </div>
                    </div>
                    <button
                      onClick={() => toggleAgent(agent.id)}
                      className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-all active:scale-[0.95] ${
                        isActive
                          ? 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200'
                          : 'bg-green-50 text-green-700 hover:bg-green-100 border border-green-200'
                      }`}
                    >
                      {isActive ? 'Pause' : 'Resume'}
                    </button>
                  </div>
                );
              })}
            </div>
          </Card>
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
              <div className="flex flex-wrap gap-3">
                <ActionButton
                  label="Reset All Agent States"
                  variant="ghost"
                  icon={RotateCcw}
                  onClick={() => setAgentStates(Object.fromEntries(agentRegistry.map(a => [a.id, 'active'])))}
                />
                <ActionButton
                  label="Pause All Agents"
                  variant="outline"
                  icon={Bot}
                  onClick={() => setAgentStates(Object.fromEntries(agentRegistry.map(a => [a.id, 'paused'])))}
                />
                <ActionButton
                  label="Activate All Agents"
                  variant="primary"
                  icon={Zap}
                  onClick={() => setAgentStates(Object.fromEntries(agentRegistry.map(a => [a.id, 'active'])))}
                />
              </div>
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
