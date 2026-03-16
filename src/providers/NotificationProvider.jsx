import { createContext, useState, useCallback, useMemo } from 'react';
import { notifications as seedNotifications } from '../data/platform/notifications';

/* ─── Notification Context ─── */
const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState(() => seedNotifications);

  const unreadCount = useMemo(
    () => notifications.filter(n => !n.read).length,
    [notifications]
  );

  const criticalCount = useMemo(
    () => notifications.filter(n => n.type === 'critical' && !n.read).length,
    [notifications]
  );

  const markAsRead = useCallback((id) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  }, []);

  const dismiss = useCallback((id) => {
    setNotifications(prev =>
      prev.filter(n => n.id !== id)
    );
  }, []);

  const dismissAll = useCallback(() => {
    setNotifications(prev =>
      prev.map(n => ({ ...n, read: true }))
    );
  }, []);

  const addNotification = useCallback((notification) => {
    setNotifications(prev => [
      {
        ...notification,
        id: notification.id || `n-${Date.now()}`,
        timestamp: notification.timestamp || new Date().toISOString(),
        read: false,
      },
      ...prev,
    ]);
  }, []);

  const value = useMemo(() => ({
    notifications,
    unreadCount,
    criticalCount,
    markAsRead,
    dismiss,
    dismissAll,
    addNotification,
  }), [notifications, unreadCount, criticalCount, markAsRead, dismiss, dismissAll, addNotification]);

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export { NotificationContext };
