import { createContext, useState, useCallback, useMemo, useEffect } from 'react';
import { notifications as seedNotifications } from '../data/platform/notifications';

/* ─── Constants ─── */
const STORAGE_KEY = 'snf-notifications';
const PREFS_STORAGE_KEY = 'snf-notification-prefs';

/* ─── localStorage helpers ─── */
function loadFromStorage(key, fallback) {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : fallback;
  } catch {
    return fallback;
  }
}

function saveToStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // localStorage unavailable
  }
}

/* ─── Default preferences ─── */
const DEFAULT_PREFS = {
  showCritical: true,
  showDecisionRequired: true,
  showAgentUpdate: true,
  showInfo: true,
};

/* ─── Notification Context ─── */
const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState(() => {
    const stored = loadFromStorage(STORAGE_KEY, null);
    // Use stored notifications if they exist and have entries, otherwise seed
    return stored && stored.length > 0 ? stored : seedNotifications.map(n => ({ ...n, archived: false }));
  });

  const [preferences, setPreferences] = useState(() =>
    loadFromStorage(PREFS_STORAGE_KEY, DEFAULT_PREFS)
  );

  // Persist notifications to localStorage on change
  useEffect(() => {
    saveToStorage(STORAGE_KEY, notifications);
  }, [notifications]);

  // Persist preferences to localStorage on change
  useEffect(() => {
    saveToStorage(PREFS_STORAGE_KEY, preferences);
  }, [preferences]);

  // Derived counts (exclude archived)
  const activeNotifications = useMemo(
    () => notifications.filter(n => !n.archived),
    [notifications]
  );

  const archivedNotifications = useMemo(
    () => notifications.filter(n => n.archived),
    [notifications]
  );

  const unreadCount = useMemo(
    () => activeNotifications.filter(n => !n.read).length,
    [activeNotifications]
  );

  const criticalCount = useMemo(
    () => activeNotifications.filter(n => n.type === 'critical' && !n.read).length,
    [activeNotifications]
  );

  const markAsRead = useCallback((id) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  }, []);

  const dismiss = useCallback((id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const dismissAll = useCallback(() => {
    setNotifications(prev =>
      prev.map(n => n.archived ? n : { ...n, read: true })
    );
  }, []);

  const archiveNotification = useCallback((id) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, archived: true, read: true } : n)
    );
  }, []);

  const archiveAll = useCallback(() => {
    setNotifications(prev =>
      prev.map(n => n.archived ? n : { ...n, archived: true, read: true })
    );
  }, []);

  const unarchiveNotification = useCallback((id) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, archived: false } : n)
    );
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  const addNotification = useCallback((notification) => {
    setNotifications(prev => [
      {
        ...notification,
        id: notification.id || `n-${Date.now()}`,
        timestamp: notification.timestamp || new Date().toISOString(),
        read: false,
        archived: false,
      },
      ...prev,
    ]);
  }, []);

  const updatePreferences = useCallback((updates) => {
    setPreferences(prev => ({ ...prev, ...updates }));
  }, []);

  const value = useMemo(() => ({
    notifications: activeNotifications,
    archivedNotifications,
    allNotifications: notifications,
    unreadCount,
    criticalCount,
    preferences,
    markAsRead,
    dismiss,
    dismissAll,
    archiveNotification,
    archiveAll,
    unarchiveNotification,
    clearAll,
    addNotification,
    updatePreferences,
  }), [
    activeNotifications, archivedNotifications, notifications,
    unreadCount, criticalCount, preferences,
    markAsRead, dismiss, dismissAll,
    archiveNotification, archiveAll, unarchiveNotification,
    clearAll, addNotification, updatePreferences,
  ]);

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export { NotificationContext };
