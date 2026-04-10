import { useCallback, useRef, useState } from 'react';
import { Upload, FileText, X, Zap } from 'lucide-react';
import { Card, ActionButton } from '../../../components/Widgets';

/**
 * Agent Builder — Upload section.
 *
 * Drag-and-drop file intake, target department picker, optional title,
 * "Start Compilation" trigger. Wave 7 (SNF-96).
 */

const DEPARTMENTS = [
  'clinical',
  'financial',
  'workforce',
  'admissions',
  'quality',
  'legal',
  'operations',
  'strategic',
  'revenue',
  'command-center',
  'executive',
  'agent-builder',
];

const ACCEPT = '.pdf,.docx,.txt,.md,.markdown';

export default function UploadSection({ onStart, isRunning }) {
  const [files, setFiles] = useState([]);
  const [department, setDepartment] = useState('clinical');
  const [title, setTitle] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef(null);

  const addFiles = useCallback((list) => {
    const incoming = Array.from(list || []);
    if (incoming.length === 0) return;
    setFiles((prev) => [...prev, ...incoming]);
  }, []);

  const removeFile = useCallback((idx) => {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  }, []);

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      setDragOver(false);
      addFiles(e.dataTransfer.files);
    },
    [addFiles],
  );

  const handleStart = useCallback(() => {
    if (files.length === 0 || !department) return;
    onStart({ files, targetDepartment: department, title });
  }, [files, department, title, onStart]);

  return (
    <Card title="Upload SOP Document" action={<span className="text-xs text-gray-400">Wave 7 • SNF-96</span>}>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`rounded-xl border-2 border-dashed transition-all cursor-pointer min-h-[160px] flex flex-col items-center justify-center p-6 ${
          dragOver
            ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20'
            : 'border-gray-200 dark:border-gray-700 bg-gray-50/60 dark:bg-gray-800/40 hover:border-blue-300 hover:bg-blue-50/40'
        }`}
        role="button"
        tabIndex={0}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          multiple
          className="hidden"
          onChange={(e) => addFiles(e.target.files)}
        />
        <Upload size={32} className="text-blue-500 mb-2" />
        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          Drop SOP PDFs, DOCX, TXT, or Markdown
        </p>
        <p className="text-[11px] text-gray-500 mt-1">
          or click to select — PHI is tokenized before the agent sees it
        </p>
      </div>

      {files.length > 0 && (
        <div className="mt-4 space-y-2">
          {files.map((f, i) => (
            <div
              key={`${f.name}-${i}`}
              className="flex items-center gap-3 rounded-lg border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2"
            >
              <FileText size={16} className="text-blue-500 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-gray-900 dark:text-gray-100 truncate">{f.name}</p>
                <p className="text-[10px] text-gray-500">{(f.size / 1024).toFixed(1)} KB</p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeFile(i);
                }}
                className="min-w-[44px] min-h-[44px] flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors"
                aria-label={`Remove ${f.name}`}
              >
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider block mb-1">
            Target Department
          </label>
          <select
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className="w-full text-xs font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2.5 min-h-[44px]"
          >
            {DEPARTMENTS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider block mb-1">
            Title (optional)
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Medication Error Reporting SOP"
            className="w-full text-xs font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2.5 min-h-[44px]"
          />
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <p className="text-[11px] text-gray-500">
          Every generated runbook is gated by human review on the PR (SNF-100).
        </p>
        <ActionButton
          label={isRunning ? 'Pipeline running...' : 'Start Compilation'}
          icon={Zap}
          variant="primary"
          onClick={isRunning ? undefined : handleStart}
        />
      </div>
    </Card>
  );
}
