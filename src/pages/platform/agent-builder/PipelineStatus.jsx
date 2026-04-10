import { Check, Loader2, FileSearch, Wand2, GitPullRequest, AlertCircle } from 'lucide-react';
import { Card } from '../../../components/Widgets';

/**
 * Agent Builder — pipeline status strip + review panel.
 * Wave 7 (SNF-96).
 */

const STAGES = [
  { key: 'ingesting', label: 'Ingest', icon: FileSearch, description: 'Extract + tokenize PHI' },
  { key: 'compiling', label: 'Compile', icon: Wand2, description: 'agent-builder session' },
  { key: 'writing_pr', label: 'PR', icon: GitPullRequest, description: 'Open review PR' },
  { key: 'completed', label: 'Done', icon: Check, description: 'Human review required' },
];

function stageOrder(stage) {
  const idx = STAGES.findIndex((s) => s.key === stage);
  return idx === -1 ? 0 : idx;
}

export function PipelineStatusStrip({ run }) {
  if (!run) return null;
  const currentIdx = run.status === 'failed' ? -1 : stageOrder(run.status);

  return (
    <Card title="Pipeline Status" action={<span className="text-[11px] font-mono text-gray-400">{run.runId.slice(0, 8)}</span>}>
      <div className="flex items-center gap-2 flex-wrap">
        {STAGES.map((stage, i) => {
          const Icon = stage.icon;
          const isDone = currentIdx > i;
          const isActive = currentIdx === i && run.status !== 'failed' && run.status !== 'completed';
          const isFinal = run.status === 'completed' && i === STAGES.length - 1;
          const color =
            run.status === 'failed'
              ? 'bg-red-100 text-red-700 border-red-200'
              : isDone || isFinal
                ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                : isActive
                  ? 'bg-blue-100 text-blue-700 border-blue-200'
                  : 'bg-gray-50 text-gray-400 border-gray-200';
          return (
            <div key={stage.key} className="flex items-center gap-2">
              <div className={`flex items-center gap-2 rounded-xl border px-3 py-2 min-h-[44px] ${color}`}>
                {isActive ? <Loader2 size={16} className="animate-spin" /> : <Icon size={16} />}
                <div>
                  <p className="text-xs font-semibold">{stage.label}</p>
                  <p className="text-[10px] opacity-80">{stage.description}</p>
                </div>
              </div>
              {i < STAGES.length - 1 && <span className="text-gray-300">→</span>}
            </div>
          );
        })}
      </div>
      {run.status === 'failed' && (
        <div className="mt-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3">
          <AlertCircle size={16} className="text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-red-800">{run.error || 'Pipeline failed'}</p>
        </div>
      )}
    </Card>
  );
}

export function ReviewPanel({ run }) {
  if (!run || !run.compileSummary) return null;
  const { compileSummary } = run;
  return (
    <Card
      title="Generated Runbook Delta"
      action={
        run.prUrl ? (
          <a
            href={run.prUrl}
            target="_blank"
            rel="noreferrer"
            className="text-xs font-semibold text-blue-600 hover:text-blue-700"
          >
            View PR →
          </a>
        ) : (
          <span className="text-[11px] text-amber-600">Draft patch written locally</span>
        )
      }
    >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <Stat label="Tasks" value={compileSummary.taskCount} />
        <Stat label="New Tools" value={compileSummary.newToolsRequired} />
        <Stat label="Department" value={run.targetDepartment} mono />
        <Stat label="Status" value={run.status} />
      </div>
      <div className="rounded-xl bg-gray-900 text-gray-100 p-4 overflow-x-auto max-h-96 overflow-y-auto">
        <pre className="text-[11px] font-mono whitespace-pre-wrap">{compileSummary.markdownPreview}</pre>
      </div>
      <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
        <p className="text-[11px] text-amber-900">
          Human review required per SNF-100 — no auto-merge. Confirm procedure steps, governance level,
          and success criteria before approving the PR.
        </p>
      </div>
    </Card>
  );
}

function Stat({ label, value, mono = false }) {
  return (
    <div className="rounded-lg border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 p-3">
      <p className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold">{label}</p>
      <p className={`mt-1 text-sm font-bold text-gray-900 dark:text-gray-100 ${mono ? 'font-mono' : ''}`}>
        {value}
      </p>
    </div>
  );
}

export function HistoryList({ runs }) {
  if (!runs || runs.length === 0) {
    return (
      <Card title="Recent Runs">
        <p className="text-xs text-gray-500">No runs yet — upload an SOP above to get started.</p>
      </Card>
    );
  }
  return (
    <Card title="Recent Runs">
      <div className="divide-y divide-gray-100 dark:divide-gray-700">
        {runs.map((r) => (
          <div key={r.runId} className="py-3 flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-gray-900 dark:text-gray-100 truncate">
                {r.sourceFiles.join(', ')} → {r.targetDepartment}
              </p>
              <p className="text-[10px] text-gray-500">
                {new Date(r.createdAt).toLocaleString()} • by {r.createdBy}
              </p>
            </div>
            <StatusPill status={r.status} />
            {r.prUrl && (
              <a
                href={r.prUrl}
                target="_blank"
                rel="noreferrer"
                className="min-h-[44px] flex items-center text-[11px] font-semibold text-blue-600 hover:text-blue-700"
              >
                PR →
              </a>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}

function StatusPill({ status }) {
  const styles = {
    ingesting: 'bg-blue-100 text-blue-700',
    compiling: 'bg-violet-100 text-violet-700',
    writing_pr: 'bg-amber-100 text-amber-700',
    completed: 'bg-emerald-100 text-emerald-700',
    failed: 'bg-red-100 text-red-700',
  }[status] || 'bg-gray-100 text-gray-600';
  return (
    <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${styles}`}>
      {status}
    </span>
  );
}
