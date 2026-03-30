import { useMemo } from 'react';
import { GitBranch, Bot, User, ChevronRight, CheckCircle2, Eye, ArrowRight } from 'lucide-react';
import { auditLog, getTraceChain } from '../../data/agents';
import { Card, ConfidenceBar, SectionLabel, ActionButton } from '../Widgets';

function formatTime(ts) {
  return new Date(ts).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

function formatDate(ts) {
  return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) + ' at ' + formatTime(ts);
}

export default function DecisionReplayTab({ open }) {
  const traceChains = useMemo(() => {
    const chains = {};
    auditLog.forEach(entry => {
      if (!chains[entry.traceId]) {
        chains[entry.traceId] = { traceId: entry.traceId, entries: [], firstTimestamp: entry.timestamp };
      }
      chains[entry.traceId].entries.push(entry);
    });
    return Object.values(chains)
      .map(c => ({
        ...c,
        entries: c.entries.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp)),
        rootAction: c.entries.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))[0]?.action,
        rootActor: c.entries.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))[0]?.actorName,
        rootTarget: c.entries.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))[0]?.target,
        agents: [...new Set(c.entries.filter(e => e.agentId).map(e => e.agentId))],
        humans: [...new Set(c.entries.filter(e => e.actorType === 'human').map(e => e.actorName))],
      }))
      .sort((a, b) => {
        if (a.entries.length >= 5 && b.entries.length < 5) return -1;
        if (a.entries.length < 5 && b.entries.length >= 5) return 1;
        return new Date(b.firstTimestamp) - new Date(a.firstTimestamp);
      });
  }, []);

  const heroChains = traceChains.filter(c => c.entries.length >= 5);
  const routineChains = traceChains.filter(c => c.entries.length < 5).slice(0, 10);

  function openReplayModal(traceId) {
    const chain = getTraceChain(traceId);
    if (!chain.length) return;
    open({
      title: 'Decision Replay',
      content: (
        <div className="space-y-4">
          <div className="bg-violet-50 border border-violet-100 rounded-xl p-4">
            <p className="text-[10px] font-semibold text-violet-600 uppercase tracking-wider mb-1">Trace Chain</p>
            <p className="text-sm font-semibold text-gray-900">{traceId}</p>
            <p className="text-xs text-gray-600 mt-0.5">{chain[0]?.target} — {chain.length} steps</p>
          </div>
          <div className="relative">
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />
            <div className="space-y-3">
              {chain.map((entry) => {
                const isAgent = entry.actorType === 'agent';
                return (
                  <div key={entry.id} className="relative pl-10">
                    <div className={`absolute left-2.5 w-3.5 h-3.5 rounded-full border-2 border-white ${isAgent ? 'bg-emerald-600' : 'bg-green-500'} shadow-sm`} style={{ top: '12px' }} />
                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                      <div className="flex items-center gap-2 mb-2">
                        <div className={`w-5 h-5 rounded-md ${isAgent ? 'bg-emerald-50' : 'bg-green-50'} flex items-center justify-center`}>
                          {isAgent ? <Bot size={11} className="text-emerald-700" /> : <User size={11} className="text-green-600" />}
                        </div>
                        <span className="text-xs font-semibold text-gray-900">{entry.actorName}</span>
                        <span className="text-[10px] text-gray-400 ml-auto">{formatDate(entry.timestamp)}</span>
                      </div>
                      <p className="text-sm text-gray-800 font-medium mb-1">{entry.action}</p>
                      <p className="text-xs text-gray-500 mb-2">{entry.disposition}</p>
                      {entry.confidence != null && (
                        <div className="mb-2 w-32"><ConfidenceBar value={entry.confidence} /></div>
                      )}
                      {entry.policiesChecked && entry.policiesChecked.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-2">
                          {entry.policiesChecked.map((p, pi) => (
                            <span key={pi} className="px-1.5 py-0.5 rounded bg-green-50 text-[10px] text-green-700 font-medium border border-green-100">
                              <CheckCircle2 size={8} className="inline mr-0.5" />{p}
                            </span>
                          ))}
                        </div>
                      )}
                      {entry.evidence && entry.evidence.length > 0 && (
                        <div className="flex items-start gap-1.5 text-[10px] text-gray-400">
                          <Eye size={10} className="mt-0.5 flex-shrink-0" />
                          <span>{Array.isArray(entry.evidence) ? entry.evidence.join(', ') : entry.evidence}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ),
      actions: <ActionButton label="Close" variant="ghost" />,
    });
  }

  return (
    <>
      <SectionLabel>Hero Decision Chains</SectionLabel>
      <div className="space-y-3 mb-8">
        {heroChains.map(chain => (
          <div key={chain.traceId} onClick={() => openReplayModal(chain.traceId)} className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md hover:border-gray-200 transition-all cursor-pointer active:scale-[0.995]">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-violet-50 border border-violet-100 flex items-center justify-center flex-shrink-0">
                <GitBranch size={18} className="text-violet-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-semibold text-gray-900">{chain.rootTarget}</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-violet-50 text-violet-600 border border-violet-100">{chain.entries.length} steps</span>
                </div>
                <p className="text-xs text-gray-600 mb-2">{chain.rootAction}</p>
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="flex items-center gap-1.5">
                    <Bot size={11} className="text-emerald-600" />
                    <span className="text-[10px] text-gray-500">{chain.agents.length} agents</span>
                  </div>
                  {chain.humans.length > 0 && (
                    <div className="flex items-center gap-1.5">
                      <User size={11} className="text-green-500" />
                      <span className="text-[10px] text-gray-500">{chain.humans.length} human{chain.humans.length > 1 ? 's' : ''}</span>
                    </div>
                  )}
                  <span className="text-[10px] text-gray-400">{chain.traceId}</span>
                </div>
              </div>
              <ChevronRight size={16} className="text-gray-300 flex-shrink-0 mt-2" />
            </div>
          </div>
        ))}
      </div>

      <SectionLabel>Routine Batch Traces</SectionLabel>
      <Card title="Recent Routine Operations" badge={`${routineChains.length} traces`}>
        <div className="space-y-2">
          {routineChains.map(chain => (
            <div key={chain.traceId} onClick={() => openReplayModal(chain.traceId)} className="rounded-xl p-3 bg-gray-50/50 border border-gray-100 hover:bg-white hover:shadow-sm hover:border-gray-200 transition-all cursor-pointer active:scale-[0.995]">
              <div className="flex items-center gap-3">
                <GitBranch size={14} className="text-gray-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-800 truncate">{chain.rootAction}</p>
                  <p className="text-[10px] text-gray-400">{chain.traceId} — {chain.entries.length} steps</p>
                </div>
                <span className="text-[10px] text-gray-400">{formatTime(chain.firstTimestamp)}</span>
                <ChevronRight size={12} className="text-gray-300" />
              </div>
            </div>
          ))}
        </div>
      </Card>
    </>
  );
}
