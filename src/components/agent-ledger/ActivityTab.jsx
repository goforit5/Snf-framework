import { Bot, ArrowRight } from 'lucide-react';
import { agentById } from '../../data/agents';
import { Card, ConfidenceBar, SectionLabel } from '../Widgets';
import { SearchInput } from '../FilterComponents';

function formatTime(ts) {
  return new Date(ts).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

export default function ActivityTab({ search, setSearch, todayActivities, openActionDetail }) {
  const filtered = search.trim()
    ? todayActivities.filter(a => {
        const q = search.toLowerCase();
        const agent = agentById[a.agentId];
        return (agent?.displayName || a.agentId).toLowerCase().includes(q) ||
               a.action.toLowerCase().includes(q) ||
               a.trigger.toLowerCase().includes(q);
      })
    : todayActivities;

  return (
    <>
      <div className="mb-6">
        <SearchInput placeholder="Search agents, actions, triggers..." value={search} onChange={setSearch} />
      </div>
      <SectionLabel>Today's Agent Activity</SectionLabel>
      <Card title="Agent Actions" badge={`${filtered.length} actions`}>
        <div className="space-y-2">
          {filtered.slice(0, 20).map(activity => {
            const agent = agentById[activity.agentId];
            return (
              <div key={activity.id} onClick={() => openActionDetail(activity)} className="rounded-xl p-4 bg-gray-50/50 border border-gray-100 hover:bg-white hover:shadow-sm hover:border-gray-200 transition-all cursor-pointer active:scale-[0.995]">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
                  <div className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center flex-shrink-0">
                    <Bot size={13} className="text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs font-semibold text-gray-900 truncate">{agent?.displayName || activity.agentId}</span>
                      <span className="text-[10px] text-gray-400">{formatTime(activity.timestamp)}</span>
                    </div>
                    <p className="text-xs text-gray-600 truncate">{activity.action}</p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    {activity.confidence != null && (
                      <div className="w-16 hidden md:block"><ConfidenceBar value={activity.confidence} /></div>
                    )}
                    <span className="text-[10px] text-emerald-600 font-medium">{activity.timeSaved}</span>
                    <ArrowRight size={14} className="text-gray-300" />
                  </div>
                </div>
              </div>
            );
          })}
          {filtered.length > 20 && (
            <p className="text-xs text-gray-400 text-center py-2">Showing 20 of {filtered.length} actions</p>
          )}
        </div>
      </Card>
    </>
  );
}
