import { createContext, useState, useCallback, useMemo, useEffect, useRef, useContext } from 'react';
import { ToastContext } from '../components/FeedbackUtils';
import { NotificationContext } from './NotificationProvider';

const STORAGE_KEY = 'snf-feedback';

function loadIssues() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveIssues(issues) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(issues));
  } catch {
    // localStorage unavailable
  }
}

// Template-based resolution generation based on category
const RESOLUTION_TEMPLATES = {
  'data-display': {
    finding: 'Identified a data rendering inconsistency on the reported page. The display component was not refreshing correctly when underlying data changed.',
    resolution: 'Updated the data binding to ensure real-time synchronization with source systems. Verified correct rendering across all affected views.',
  },
  navigation: {
    finding: 'Found a navigation flow issue where the expected transition was not completing as designed.',
    resolution: 'Corrected the routing logic and ensured smooth transitions between all connected pages. State is now preserved correctly across navigation.',
  },
  performance: {
    finding: 'Detected a performance bottleneck in the reported area. Component re-renders were occurring more frequently than necessary.',
    resolution: 'Optimized the rendering pipeline with targeted memoization. Page responsiveness improved to meet the <2 second interaction target.',
  },
  'agent-behavior': {
    finding: 'Reviewed the agent decision pipeline for the affected workflow. Found a confidence threshold calibration that was producing unexpected results.',
    resolution: 'Adjusted the agent confidence parameters and validated against historical decision patterns. Agent recommendations now align with expected governance levels.',
  },
  general: {
    finding: 'Analyzed the reported experience and identified the root cause through session context and page state review.',
    resolution: 'Implemented a targeted improvement to address the reported behavior. Verified the fix across related workflows and pages.',
  },
};

const IssueContext = createContext(null);

export function IssueProvider({ children }) {
  const toastCtx = useContext(ToastContext);
  const notifCtx = useContext(NotificationContext);
  const [issues, setIssues] = useState(loadIssues);
  const timersRef = useRef([]);

  useEffect(() => {
    saveIssues(issues);
  }, [issues]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      timersRef.current.forEach(clearTimeout);
    };
  }, []);

  const createIssue = useCallback((data) => {
    const issue = {
      id: `fb-${Date.now()}`,
      title: data.title || '',
      description: data.description || '',
      category: data.category || 'general',
      severity: data.severity || 'medium',
      status: 'draft',
      reportedBy: data.reportedBy || 'Unknown',
      reportedAt: new Date().toISOString(),
      currentPage: data.currentPage || '',
      currentRoute: data.currentRoute || '',
      userRole: data.userRole || '',
      scopeContext: data.scopeContext || '',
      sessionHistory: data.sessionHistory || [],
      inputMethod: data.inputMethod || 'text',
      agentId: 'experience-agent',
      agentNotes: [],
      resolution: null,
      resolvedAt: null,
      approvedBy: null,
    };
    setIssues(prev => [issue, ...prev]);
    return issue.id;
  }, []);

  const submitIssue = useCallback((id) => {
    setIssues(prev => prev.map(issue => {
      if (issue.id !== id) return issue;
      return { ...issue, status: 'submitted' };
    }));

    // Find the issue for notifications
    const issue = issues.find(i => i.id === id) || { title: 'Feedback', id };

    if (toastCtx) {
      toastCtx.toast({ message: `Feedback shared — Experience Agent is on it`, type: 'success' });
    }
    if (notifCtx) {
      notifCtx.addNotification({
        type: 'agent-update',
        title: `Feedback received: ${issue.title || 'New feedback'}`,
        message: 'Experience Agent is reviewing your feedback and analyzing context.',
        agentId: 'experience-agent',
      });
    }

    // Simulate agent processing
    const t1 = setTimeout(() => {
      setIssues(prev => prev.map(i => {
        if (i.id !== id) return i;
        return {
          ...i,
          status: 'investigating',
          agentNotes: [
            ...i.agentNotes,
            { text: 'Reviewing page context and session history...', timestamp: new Date().toISOString() },
          ],
        };
      }));
    }, 2000);

    const t2 = setTimeout(() => {
      setIssues(prev => prev.map(i => {
        if (i.id !== id) return i;
        const template = RESOLUTION_TEMPLATES[i.category] || RESOLUTION_TEMPLATES.general;
        return {
          ...i,
          status: 'resolving',
          agentNotes: [
            ...i.agentNotes,
            { text: `Identified area of concern on ${i.currentPage || 'reported page'}.`, timestamp: new Date().toISOString() },
            { text: template.finding, timestamp: new Date().toISOString() },
          ],
        };
      }));
    }, 4000);

    const t3 = setTimeout(() => {
      setIssues(prev => prev.map(i => {
        if (i.id !== id) return i;
        const template = RESOLUTION_TEMPLATES[i.category] || RESOLUTION_TEMPLATES.general;
        return {
          ...i,
          status: 'pending-approval',
          resolution: {
            summary: template.resolution,
            confidence: 0.92,
            proposedAt: new Date().toISOString(),
          },
          agentNotes: [
            ...i.agentNotes,
            { text: 'Resolution ready — routing for approval.', timestamp: new Date().toISOString() },
          ],
        };
      }));

      if (notifCtx) {
        notifCtx.addNotification({
          type: 'decision-required',
          title: 'Resolution ready for review',
          message: `Experience Agent has a proposed resolution for: ${issue.title || 'recent feedback'}`,
          agentId: 'experience-agent',
        });
      }
    }, 6000);

    timersRef.current.push(t1, t2, t3);
  }, [issues, toastCtx, notifCtx]);

  const approveResolution = useCallback((id) => {
    setIssues(prev => prev.map(i => {
      if (i.id !== id) return i;
      return {
        ...i,
        status: 'resolved',
        resolvedAt: new Date().toISOString(),
        approvedBy: 'operator',
        agentNotes: [
          ...i.agentNotes,
          { text: 'Resolution approved and applied. Thank you for your feedback!', timestamp: new Date().toISOString() },
        ],
      };
    }));

    const issue = issues.find(i => i.id === id);
    if (toastCtx) {
      toastCtx.toast({ message: 'Resolution approved — improvement applied', type: 'success' });
    }
    if (notifCtx) {
      notifCtx.addNotification({
        type: 'agent-update',
        title: 'Feedback resolved',
        message: `Your feedback on "${issue?.title || 'recent item'}" has been addressed. Thank you!`,
        agentId: 'experience-agent',
      });
    }
  }, [issues, toastCtx, notifCtx]);

  const dismissIssue = useCallback((id) => {
    setIssues(prev => prev.map(i => {
      if (i.id !== id) return i;
      return { ...i, status: 'closed' };
    }));
  }, []);

  const activeIssueCount = useMemo(
    () => issues.filter(i => !['resolved', 'closed'].includes(i.status)).length,
    [issues]
  );

  const pendingApprovalCount = useMemo(
    () => issues.filter(i => i.status === 'pending-approval').length,
    [issues]
  );

  const value = useMemo(() => ({
    issues,
    activeIssueCount,
    pendingApprovalCount,
    createIssue,
    submitIssue,
    approveResolution,
    dismissIssue,
  }), [issues, activeIssueCount, pendingApprovalCount, createIssue, submitIssue, approveResolution, dismissIssue]);

  return (
    <IssueContext.Provider value={value}>
      {children}
    </IssueContext.Provider>
  );
}

export { IssueContext };
