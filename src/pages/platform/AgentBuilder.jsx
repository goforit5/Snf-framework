import { useCallback, useEffect, useRef, useState } from 'react';
import { Wand2, FileText, Zap, GitPullRequest } from 'lucide-react';
import { PageHeader, SectionLabel } from '../../components/Widgets';
import { StatGrid } from '../../components/DataComponents';
import UploadSection from './agent-builder/UploadSection';
import { PipelineStatusStrip, ReviewPanel, HistoryList } from './agent-builder/PipelineStatus';

/**
 * Agent Builder page — Wave 7 (SNF-96).
 *
 * Turns SOP uploads into governed runbook PRs. Every generated delta is
 * human-reviewed on a PR per design decision SNF-100 — no auto-merge.
 *
 * Pipeline: ingest → compile → writing_pr → completed
 *
 * Backend: platform/packages/api/src/routes/agent-builder.ts
 */

const API_BASE = import.meta.env.VITE_API_BASE ?? '';
const POLL_INTERVAL_MS = 2000;

/* Mock-mode fallback so the page works on GitHub Pages without the API. */
function makeMockRun(files, targetDepartment) {
  const runId = `mock-${Date.now()}`;
  return {
    runId,
    createdAt: new Date().toISOString(),
    createdBy: 'andrew@taskvisory.com',
    tenant: 'snf-ensign-prod',
    targetDepartment,
    sourceFiles: files.map((f) => f.name),
    status: 'ingesting',
  };
}

function advanceMockRun(run) {
  const flow = ['ingesting', 'compiling', 'writing_pr', 'completed'];
  const idx = flow.indexOf(run.status);
  if (idx === -1 || idx === flow.length - 1) {
    return {
      ...run,
      compileSummary: {
        taskCount: 3,
        newToolsRequired: 1,
        markdownPreview:
          '<!-- BEGIN AGENT-BUILDER DELTA -->\n' +
          '## Task: med.error.report\n' +
          'Name: med.error.report\n' +
          'Trigger: Event `medication.variance.reported`\n' +
          'Procedure:\n' +
          '  - step: 1\n' +
          '    action: Document variance in MAR within 30 minutes\n' +
          '  - step: 2\n' +
          '    action: DON reviews within 4 hours and classifies severity\n' +
          'Governance: L3 — Staff review for severity A-B\n' +
          'Confidence: 88% (agent-builder auto-generated — human review required per SNF-100)\n' +
          '<!-- END AGENT-BUILDER DELTA -->',
      },
      prUrl: null,
    };
  }
  return { ...run, status: flow[idx + 1] };
}

async function apiUpload(files, targetDepartment, title) {
  const form = new FormData();
  for (const f of files) form.append('files', f, f.name);
  form.append('targetDepartment', targetDepartment);
  if (title) form.append('title', title);
  const res = await fetch(`${API_BASE}/api/agent-builder/upload`, {
    method: 'POST',
    body: form,
  });
  if (!res.ok) throw new Error(`upload failed: ${res.status}`);
  return res.json();
}

async function apiStatus(runId) {
  const res = await fetch(`${API_BASE}/api/agent-builder/status/${runId}`);
  if (!res.ok) throw new Error(`status failed: ${res.status}`);
  return res.json();
}

async function apiHistory() {
  const res = await fetch(`${API_BASE}/api/agent-builder/history`);
  if (!res.ok) throw new Error(`history failed: ${res.status}`);
  return res.json();
}

export default function AgentBuilder() {
  const [currentRun, setCurrentRun] = useState(null);
  const [history, setHistory] = useState([]);
  const [mockMode, setMockMode] = useState(false);
  const pollRef = useRef(null);

  /* Seed history from API on mount; fall back to mock mode if API is absent. */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await apiHistory();
        if (!cancelled) setHistory(data.runs || []);
      } catch {
        if (!cancelled) {
          setMockMode(true);
          setHistory([]);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  /* Cleanup poll interval on unmount. */
  useEffect(
    () => () => {
      if (pollRef.current) clearInterval(pollRef.current);
    },
    [],
  );

  const startPipeline = useCallback(
    async ({ files, targetDepartment, title }) => {
      if (pollRef.current) clearInterval(pollRef.current);

      if (mockMode) {
        let run = makeMockRun(files, targetDepartment);
        setCurrentRun(run);
        pollRef.current = setInterval(() => {
          run = advanceMockRun(run);
          setCurrentRun({ ...run });
          if (run.status === 'completed') {
            clearInterval(pollRef.current);
            pollRef.current = null;
            setHistory((prev) => [run, ...prev].slice(0, 50));
          }
        }, POLL_INTERVAL_MS);
        return;
      }

      try {
        const initial = await apiUpload(files, targetDepartment, title);
        setCurrentRun(initial);
        pollRef.current = setInterval(async () => {
          try {
            const latest = await apiStatus(initial.runId);
            setCurrentRun(latest);
            if (latest.status === 'completed' || latest.status === 'failed') {
              clearInterval(pollRef.current);
              pollRef.current = null;
              const h = await apiHistory();
              setHistory(h.runs || []);
            }
          } catch {
            /* swallow transient poll errors */
          }
        }, POLL_INTERVAL_MS);
      } catch (err) {
        setCurrentRun({
          runId: `err-${Date.now()}`,
          createdAt: new Date().toISOString(),
          createdBy: 'andrew@taskvisory.com',
          tenant: 'snf-ensign-prod',
          targetDepartment,
          sourceFiles: files.map((f) => f.name),
          status: 'failed',
          error: err instanceof Error ? err.message : String(err),
        });
      }
    },
    [mockMode],
  );

  const isRunning =
    currentRun &&
    currentRun.status !== 'completed' &&
    currentRun.status !== 'failed';

  const stats = [
    { label: 'Runs Today', value: history.filter((r) => isToday(r.createdAt)).length, icon: Wand2, color: 'violet' },
    { label: 'PRs Opened', value: history.filter((r) => r.prUrl).length, icon: GitPullRequest, color: 'blue' },
    { label: 'Completed', value: history.filter((r) => r.status === 'completed').length, icon: Zap, color: 'emerald' },
    { label: 'Source Files', value: history.reduce((n, r) => n + r.sourceFiles.length, 0), icon: FileText, color: 'amber' },
  ];

  return (
    <div>
      <PageHeader
        title="Agent Builder"
        subtitle="Turn SOPs into governed runbooks. Upload a policy document, interview transcript, or Confluence link — the builder agent produces a PR-ready runbook delta."
        aiSummary={
          mockMode
            ? 'Running in demo mode — backend API not reachable. Uploaded files remain in your browser and are never sent anywhere.'
            : 'Connected to platform API. Every generated PR is human-reviewed per SNF-100.'
        }
      />

      <StatGrid stats={stats} columns={4} />

      <div className="mt-8 space-y-6">
        <div>
          <SectionLabel>Upload</SectionLabel>
          <UploadSection onStart={startPipeline} isRunning={!!isRunning} />
        </div>

        {currentRun && (
          <div>
            <SectionLabel>Pipeline</SectionLabel>
            <PipelineStatusStrip run={currentRun} />
          </div>
        )}

        {currentRun && currentRun.compileSummary && (
          <div>
            <SectionLabel>Review</SectionLabel>
            <ReviewPanel run={currentRun} />
          </div>
        )}

        <div>
          <SectionLabel>History</SectionLabel>
          <HistoryList runs={history} />
        </div>
      </div>
    </div>
  );
}

function isToday(iso) {
  try {
    const d = new Date(iso);
    const now = new Date();
    return d.toDateString() === now.toDateString();
  } catch {
    return false;
  }
}
