import { useState, useContext, useCallback, useEffect } from 'react';
import {
  MessageSquareHeart, Mic, MicOff, Send, CheckCircle2, Clock, Search,
  Sparkles, ChevronRight, Bot, X, ArrowRight, Loader2
} from 'lucide-react';
import { SlideOutPanel } from './FeedbackComponents';
import { IssueContext } from '../providers/IssueProvider';
import { useAuth } from '../hooks/useAuth';
import { useScopeContext } from '../hooks/useScopeContext';
import { useSessionHistory } from '../hooks/useSessionHistory';
import { useVoiceInput } from '../hooks/useVoiceInput';

/* ─── Status Config ─── */
const STATUS_CONFIG = {
  draft: { label: 'Draft', color: 'gray', icon: null },
  submitted: { label: 'Submitted', color: 'blue', icon: Send },
  investigating: { label: 'Investigating', color: 'violet', icon: Search },
  resolving: { label: 'Preparing Fix', color: 'amber', icon: Sparkles },
  'pending-approval': { label: 'Ready for Review', color: 'amber', icon: Clock },
  resolved: { label: 'Resolved', color: 'green', icon: CheckCircle2 },
  closed: { label: 'Closed', color: 'gray', icon: CheckCircle2 },
};

const CATEGORY_OPTIONS = [
  { value: 'data-display', label: 'Data & Display' },
  { value: 'navigation', label: 'Navigation' },
  { value: 'performance', label: 'Performance' },
  { value: 'agent-behavior', label: 'Agent Behavior' },
  { value: 'general', label: 'General Feedback' },
];

const SEVERITY_OPTIONS = [
  { value: 'low', label: 'Minor', color: 'text-gray-600 dark:text-gray-400' },
  { value: 'medium', label: 'Moderate', color: 'text-blue-600 dark:text-blue-400' },
  { value: 'high', label: 'Important', color: 'text-amber-600 dark:text-amber-400' },
  { value: 'critical', label: 'Urgent', color: 'text-red-600 dark:text-red-400' },
];

/* ─── AI Ticket Structuring (mock) ─── */
function structureTicket(description) {
  const lower = description.toLowerCase();
  let category = 'general';
  let severity = 'medium';
  let title = '';

  // Category inference
  if (lower.match(/chart|data|number|display|show|stat|metric|missing|wrong|incorrect/)) category = 'data-display';
  else if (lower.match(/navigat|page|click|redirect|link|menu|route|back|forward/)) category = 'navigation';
  else if (lower.match(/slow|load|lag|freeze|wait|performance|render|stuck/)) category = 'performance';
  else if (lower.match(/agent|decision|recommend|confidence|approv|automat/)) category = 'agent-behavior';

  // Severity inference
  if (lower.match(/urgent|critical|broken|can't use|blocked|error|crash/)) severity = 'critical';
  else if (lower.match(/important|significant|affect|impact|issue/)) severity = 'high';
  else if (lower.match(/minor|small|cosmetic|tweak|suggestion|nice/)) severity = 'low';

  // Title generation — first sentence or first 60 chars
  const firstSentence = description.split(/[.!?]/)[0].trim();
  title = firstSentence.length > 60 ? firstSentence.substring(0, 57) + '...' : firstSentence;

  return { title, category, severity };
}

/* ─── Format time ago ─── */
function timeAgo(timestamp) {
  const seconds = Math.floor((Date.now() - new Date(timestamp).getTime()) / 1000);
  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

/* ─── Status Badge ─── */
function FeedbackStatusBadge({ status }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.draft;
  const colorMap = {
    gray: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
    blue: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    violet: 'bg-violet-50 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
    amber: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    green: 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  };
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${colorMap[config.color]}`}>
      {Icon && <Icon size={10} />}
      {config.label}
    </span>
  );
}

/* ─── Context Chips ─── */
function ContextChips({ page, role, scope }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {page && (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-gray-50 dark:bg-gray-800 text-[11px] text-gray-600 dark:text-gray-400 border border-gray-100 dark:border-gray-700">
          <span className="text-gray-400">Page:</span> {page}
        </span>
      )}
      {role && (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-gray-50 dark:bg-gray-800 text-[11px] text-gray-600 dark:text-gray-400 border border-gray-100 dark:border-gray-700">
          <span className="text-gray-400">Role:</span> {role}
        </span>
      )}
      {scope && (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-gray-50 dark:bg-gray-800 text-[11px] text-gray-600 dark:text-gray-400 border border-gray-100 dark:border-gray-700">
          <span className="text-gray-400">Scope:</span> {scope}
        </span>
      )}
    </div>
  );
}

/* ─── Report Form ─── */
function ReportForm({ onSubmitted }) {
  const { user } = useAuth();
  const { scope } = useScopeContext();
  const { getSessionContext } = useSessionHistory();
  const { createIssue, submitIssue } = useContext(IssueContext);
  const { isListening, transcript, startListening, stopListening, isSupported } = useVoiceInput();

  const [description, setDescription] = useState('');
  const [structuredData, setStructuredData] = useState(null);
  const [isStructuring, setIsStructuring] = useState(false);
  const [draftId, setDraftId] = useState(null);

  const sessionCtx = getSessionContext();

  // Sync voice transcript to description
  useEffect(() => {
    if (transcript) setDescription(transcript);
  }, [transcript]);

  const handleStructure = useCallback(() => {
    if (!description.trim()) return;
    setIsStructuring(true);
    // Simulate AI processing
    setTimeout(() => {
      const result = structureTicket(description);
      setStructuredData(result);
      setIsStructuring(false);
    }, 1200);
  }, [description]);

  const handleSubmit = useCallback(() => {
    if (!description.trim()) return;
    const data = structuredData || structureTicket(description);

    const id = createIssue({
      title: data.title,
      description,
      category: data.category,
      severity: data.severity,
      reportedBy: user?.name || 'Unknown',
      currentPage: sessionCtx.currentPage,
      currentRoute: sessionCtx.currentRoute,
      userRole: user?.title || '',
      scopeContext: scope?.type === 'enterprise' ? 'Enterprise' : scope?.id || 'Enterprise',
      sessionHistory: sessionCtx.recentHistory,
      inputMethod: transcript ? 'voice' : 'text',
    });

    setDraftId(id);
    submitIssue(id);

    // Reset form
    setDescription('');
    setStructuredData(null);
    setDraftId(null);
    onSubmitted?.();
  }, [description, structuredData, createIssue, submitIssue, user, sessionCtx, scope, transcript, onSubmitted]);

  return (
    <div className="space-y-5">
      {/* Auto-captured context */}
      <div>
        <p className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">Context captured automatically</p>
        <ContextChips
          page={sessionCtx.currentPage}
          role={user?.title}
          scope={scope?.type === 'enterprise' ? 'Enterprise' : scope?.id}
        />
      </div>

      {/* Description input */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
          What can we improve?
        </label>
        <div className="relative">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={isListening ? 'Listening...' : 'Describe what you noticed or what could be better...'}
            rows={4}
            className={`w-full rounded-xl border px-4 py-3 text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none transition-all ${
              isListening
                ? 'border-red-300 dark:border-red-700 ring-2 ring-red-200 dark:ring-red-900'
                : 'border-gray-200 dark:border-gray-700'
            }`}
          />
          {isSupported && (
            <button
              onClick={isListening ? stopListening : startListening}
              className={`absolute bottom-3 right-3 p-2 rounded-full transition-all min-h-[44px] min-w-[44px] flex items-center justify-center ${
                isListening
                  ? 'bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 animate-pulse'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-violet-100 dark:hover:bg-violet-900/30 hover:text-violet-600'
              }`}
              aria-label={isListening ? 'Stop voice input' : 'Start voice input'}
            >
              {isListening ? <MicOff size={18} /> : <Mic size={18} />}
            </button>
          )}
        </div>
        {isListening && (
          <p className="text-xs text-red-500 dark:text-red-400 mt-1 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
            Listening — speak naturally, then tap to stop
          </p>
        )}
      </div>

      {/* Structure / Preview */}
      {!structuredData && description.trim().length > 10 && (
        <button
          onClick={handleStructure}
          disabled={isStructuring}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-violet-200 dark:border-violet-800 bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-400 text-sm font-medium hover:bg-violet-100 dark:hover:bg-violet-900/30 transition-colors disabled:opacity-50 min-h-[44px]"
        >
          {isStructuring ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Preparing your feedback...
            </>
          ) : (
            <>
              <Sparkles size={16} />
              Preview how this looks
            </>
          )}
        </button>
      )}

      {/* Structured ticket preview */}
      {structuredData && (
        <div className="rounded-xl border border-violet-200 dark:border-violet-800 bg-violet-50/50 dark:bg-violet-900/10 p-4 space-y-3">
          <div className="flex items-center gap-2 text-violet-700 dark:text-violet-400">
            <Bot size={14} />
            <span className="text-[11px] font-semibold uppercase tracking-wider">Experience Agent prepared this</span>
          </div>

          {/* Editable title */}
          <div>
            <label className="block text-[11px] font-medium text-gray-500 dark:text-gray-400 mb-1">Summary</label>
            <input
              type="text"
              value={structuredData.title}
              onChange={(e) => setStructuredData(prev => ({ ...prev, title: e.target.value }))}
              className="w-full rounded-lg border border-violet-200 dark:border-violet-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>

          {/* Category & Severity */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-gray-500 dark:text-gray-400 mb-1">Category</label>
              <select
                value={structuredData.category}
                onChange={(e) => setStructuredData(prev => ({ ...prev, category: e.target.value }))}
                className="w-full rounded-lg border border-violet-200 dark:border-violet-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-violet-500"
              >
                {CATEGORY_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-medium text-gray-500 dark:text-gray-400 mb-1">Priority</label>
              <select
                value={structuredData.severity}
                onChange={(e) => setStructuredData(prev => ({ ...prev, severity: e.target.value }))}
                className="w-full rounded-lg border border-violet-200 dark:border-violet-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-violet-500"
              >
                {SEVERITY_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={!description.trim()}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold shadow-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed min-h-[44px]"
      >
        <Send size={16} />
        Share Feedback
      </button>
    </div>
  );
}

/* ─── Issue Card ─── */
function IssueCard({ issue, onApprove, onDismiss }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden transition-all">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 p-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors min-h-[44px]"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <FeedbackStatusBadge status={issue.status} />
            <span className="text-[11px] text-gray-400 dark:text-gray-500">{timeAgo(issue.reportedAt)}</span>
          </div>
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{issue.title || 'Untitled feedback'}</p>
          <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
            {issue.currentPage} {issue.inputMethod === 'voice' ? '— via voice' : ''}
          </p>
        </div>
        <ChevronRight size={14} className={`text-gray-400 transition-transform ${expanded ? 'rotate-90' : ''}`} />
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="px-3 pb-3 border-t border-gray-100 dark:border-gray-700">
          {/* Description */}
          <p className="text-sm text-gray-600 dark:text-gray-300 mt-3 mb-3 leading-relaxed">{issue.description}</p>

          {/* Agent Notes Timeline */}
          {issue.agentNotes.length > 0 && (
            <div className="mb-3">
              <p className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                <Bot size={10} /> Experience Agent Activity
              </p>
              <div className="space-y-2">
                {issue.agentNotes.map((note, idx) => (
                  <div key={idx} className="flex gap-2">
                    <div className="w-1 rounded-full bg-violet-200 dark:bg-violet-800 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-gray-700 dark:text-gray-300">{note.text}</p>
                      <p className="text-[10px] text-gray-400 dark:text-gray-500">{timeAgo(note.timestamp)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Resolution */}
          {issue.resolution && (
            <div className="rounded-lg border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 p-3 mb-3">
              <p className="text-[11px] font-semibold text-green-700 dark:text-green-400 uppercase tracking-wider mb-1">Proposed Improvement</p>
              <p className="text-sm text-gray-700 dark:text-gray-300">{issue.resolution.summary}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-[11px] text-green-600 dark:text-green-400 font-medium">
                  Confidence: {Math.round(issue.resolution.confidence * 100)}%
                </span>
              </div>
            </div>
          )}

          {/* Actions */}
          {issue.status === 'pending-approval' && (
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => onApprove(issue.id)}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm font-semibold transition-colors min-h-[44px]"
              >
                <CheckCircle2 size={14} />
                Approve
              </button>
              <button
                onClick={() => onDismiss(issue.id)}
                className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors min-h-[44px]"
              >
                <X size={14} />
                Dismiss
              </button>
            </div>
          )}

          {issue.status === 'resolved' && (
            <div className="flex items-center gap-1.5 text-green-600 dark:text-green-400 text-sm font-medium">
              <CheckCircle2 size={14} />
              Resolved {issue.resolvedAt ? timeAgo(issue.resolvedAt) : ''}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── Issue List ─── */
function IssueList() {
  const { issues, approveResolution, dismissIssue } = useContext(IssueContext);
  const visibleIssues = issues.filter(i => i.status !== 'draft');

  if (visibleIssues.length === 0) {
    return (
      <div className="text-center py-12">
        <MessageSquareHeart size={40} className="mx-auto text-gray-300 dark:text-gray-600 mb-3" />
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">No feedback yet</p>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Your shared feedback will appear here</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {visibleIssues.map(issue => (
        <IssueCard
          key={issue.id}
          issue={issue}
          onApprove={approveResolution}
          onDismiss={dismissIssue}
        />
      ))}
    </div>
  );
}

/* ─── Main IssueReporter Component ─── */
export default function IssueReporter() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('report');
  const issueCtx = useContext(IssueContext);
  const activeCount = issueCtx?.activeIssueCount || 0;
  const pendingCount = issueCtx?.pendingApprovalCount || 0;

  const handleSubmitted = useCallback(() => {
    setActiveTab('activity');
  }, []);

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(true)}
        aria-label={`Share feedback${activeCount > 0 ? `, ${activeCount} active` : ''}`}
        className="fixed bottom-6 right-6 z-40 flex items-center justify-center w-14 h-14 rounded-full bg-violet-600 dark:bg-violet-500 text-white shadow-lg shadow-violet-600/25 dark:shadow-violet-500/25 hover:bg-violet-700 dark:hover:bg-violet-600 hover:scale-105 active:scale-95 transition-all"
      >
        <MessageSquareHeart size={22} />
        {activeCount > 0 && (
          <span className={`absolute -top-1 -right-1 min-w-[20px] h-[20px] flex items-center justify-center rounded-full text-[10px] font-bold text-white px-1 ${
            pendingCount > 0 ? 'bg-amber-500' : 'bg-red-500'
          }`}>
            {activeCount}
          </span>
        )}
      </button>

      {/* Feedback Panel */}
      <SlideOutPanel
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Share Feedback"
        width="lg"
      >
        {/* Tabs */}
        <div className="flex gap-1 p-1 rounded-xl bg-gray-100 dark:bg-gray-800 mb-5">
          <button
            onClick={() => setActiveTab('report')}
            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors min-h-[44px] ${
              activeTab === 'report'
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            Share Feedback
          </button>
          <button
            onClick={() => setActiveTab('activity')}
            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors min-h-[44px] flex items-center justify-center gap-1.5 ${
              activeTab === 'activity'
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            My Feedback
            {activeCount > 0 && (
              <span className="min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-400 text-[10px] font-bold px-1">
                {activeCount}
              </span>
            )}
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'report' ? (
          <ReportForm onSubmitted={handleSubmitted} />
        ) : (
          <IssueList />
        )}

        {/* Agent footer */}
        <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-2 text-[11px] text-gray-400 dark:text-gray-500">
            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center flex-shrink-0">
              <Bot size={10} className="text-white" />
            </div>
            <span>Powered by <span className="font-semibold text-violet-600 dark:text-violet-400">Experience Agent</span> — feedback is analyzed, resolved, and verified before applying changes.</span>
          </div>
        </div>
      </SlideOutPanel>
    </>
  );
}
