import { useState, useMemo } from 'react';
import { Database, ArrowRight } from 'lucide-react';
import { Treemap, ResponsiveContainer } from 'recharts';
import { agentRegistry, agentById, agentDependencies, dataSources, domainLabels } from '../../data/agents';
import { Card, SectionLabel } from '../Widgets';

const DOMAIN_COLORS = {
  'clinical': '#3B82F6',
  'revenue-cycle': '#10B981',
  'workforce': '#8B5CF6',
  'operations': '#F97316',
  'quality-compliance': '#EAB308',
  'legal-strategic': '#6366F1',
  'vendor': '#14B8A6',
  'orchestration': '#EC4899',
  'meta': '#64748B',
};

function CustomTreemapContent({ x, y, width, height, name, connections, root }) {
  if (width < 40 || height < 30) return null;
  const truncName = name && name.length > (width / 7) ? name.substring(0, Math.floor(width / 7)) + '...' : name;
  const domainKey = root?.name ? Object.keys(domainLabels).find(k => domainLabels[k] === root.name) : 'meta';
  const color = DOMAIN_COLORS[domainKey] || '#64748B';
  return (
    <g>
      <rect x={x} y={y} width={width} height={height} rx={6} fill={color} fillOpacity={0.15} stroke={color} strokeWidth={1} strokeOpacity={0.3} />
      <text x={x + width / 2} y={y + height / 2 - 6} textAnchor="middle" fill="#374151" fontSize={11} fontWeight={600}>{truncName}</text>
      {width > 60 && height > 45 && (
        <text x={x + width / 2} y={y + height / 2 + 10} textAnchor="middle" fill="#9CA3AF" fontSize={9}>{connections} connections</text>
      )}
    </g>
  );
}

export default function DependencyGraphTab() {
  const treemapData = useMemo(() => {
    const domains = {};
    agentRegistry.forEach(agent => {
      const domain = agent.domain;
      if (!domains[domain]) {
        domains[domain] = { name: domainLabels[domain] || domain, children: [] };
      }
      const connections = agentDependencies.filter(d => d.from === agent.id || d.to === agent.id).length;
      domains[domain].children.push({
        name: agent.displayName.replace(/ Agent$/, ''),
        size: Math.max(agent.actionsToday || 1, 5),
        connections,
        agentId: agent.id,
        confidence: agent.confidenceAvg,
        status: agent.status,
      });
    });
    return Object.values(domains);
  }, []);

  return (
    <>
      <SectionLabel>Agent Dependency Treemap</SectionLabel>
      <Card title="Agent Ecosystem" badge={`${agentRegistry.length} agents`} action={<span className="text-[10px] text-gray-400">Size = actions/day, grouped by domain</span>}>
        <ResponsiveContainer width="100%" height={400}>
          <Treemap
            data={treemapData}
            dataKey="size"
            stroke="#fff"
            content={<CustomTreemapContent />}
          />
        </ResponsiveContainer>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <Card title="Data Source Dependencies" badge={`${dataSources.length} sources`}>
          <div className="space-y-4">
            {dataSources.map(ds => {
              const connectedAgents = agentDependencies
                .filter(d => d.from === ds.id && d.type === 'data-source')
                .map(d => agentById[d.to])
                .filter(Boolean);
              return (
                <div key={ds.id} className="rounded-xl p-4 bg-gray-50 border border-gray-100">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: ds.color + '15', border: `1px solid ${ds.color}30` }}>
                      <Database size={14} style={{ color: ds.color }} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{ds.name}</p>
                      <p className="text-[10px] text-gray-400">{connectedAgents.length} connected agents</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {connectedAgents.map(agent => (
                      <span key={agent.id} className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-white border border-gray-200 text-gray-700">
                        {agent.displayName.replace(/ Agent$/, '')}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <Card title="Agent-to-Agent Dependencies" badge={`${agentDependencies.filter(d => d.type !== 'data-source').length} connections`}>
          <div className="space-y-2 max-h-[520px] overflow-y-auto">
            {agentDependencies.filter(d => d.type !== 'data-source').map((dep, i) => {
              const fromAgent = agentById[dep.from];
              const toAgent = agentById[dep.to];
              if (!fromAgent || !toAgent) return null;
              const typeColors = {
                triggers: 'bg-blue-50 text-blue-700 border-blue-100',
                cascades: 'bg-violet-50 text-violet-700 border-violet-100',
                coordinates: 'bg-cyan-50 text-cyan-700 border-cyan-100',
                blocks: 'bg-red-50 text-red-700 border-red-100',
                feeds: 'bg-emerald-50 text-emerald-700 border-emerald-100',
              };
              return (
                <div key={i} className="flex items-center gap-2 rounded-lg p-2.5 bg-gray-50 border border-gray-100">
                  <span className="text-[11px] font-medium text-gray-700 truncate flex-1">{fromAgent.displayName.replace(/ Agent$/, '')}</span>
                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border flex-shrink-0 ${typeColors[dep.type] || 'bg-gray-50 text-gray-500 border-gray-200'}`}>{dep.type}</span>
                  <ArrowRight size={10} className="text-gray-300 flex-shrink-0" />
                  <span className="text-[11px] font-medium text-gray-700 truncate flex-1 text-right">{toAgent.displayName.replace(/ Agent$/, '')}</span>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </>
  );
}
