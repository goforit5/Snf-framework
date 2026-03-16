import { useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X, AlertTriangle, AlertCircle, Bot, Info, CheckCheck,
  Stethoscope, DollarSign, ShieldCheck, Users, Building2, Package,
  Clock
} from 'lucide-react';
import { useNotificationContext } from '../hooks/useNotificationContext';
import { SlideOutPanel } from './FeedbackComponents';

/* ─── Type Config ─── */
const TYPE_CONFIG = {
  critical: {
    label: 'Critical',
    icon: AlertTriangle,
    dotColor: 'bg-red-500',
    badgeColor: 'bg-red-50 text-red-700 border-red-200',
    iconColor: 'text-red-500',
  },
  'decision-required': {
    label: 'Decision Required',
    icon: AlertCircle,
    dotColor: 'bg-amber-500',
    badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
    iconColor: 'text-amber-500',
  },
  'agent-update': {
    label: 'Agent Updates',
    icon: Bot,
    dotColor: 'bg-emerald-500',
    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    iconColor: 'text-emerald-500',
  },
  info: {
    label: 'Informational',
    icon: Info,
    dotColor: 'bg-blue-500',
    badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
    iconColor: 'text-blue-500',
  },
};

/* ─── Category icons based on actionUrl ─── */
function getCategoryIcon(actionUrl) {
  if (!actionUrl) return Bot;
  if (actionUrl.includes('clinical') || actionUrl.includes('compliance')) return Stethoscope;
  if (actionUrl.includes('finance') || actionUrl.includes('ap') || actionUrl.includes('invoice') || actionUrl.includes('revenue') || actionUrl.includes('payroll') || actionUrl.includes('close')) return DollarSign;
  if (actionUrl.includes('survey') || actionUrl.includes('audit')) return ShieldCheck;
  if (actionUrl.includes('workforce') || actionUrl.includes('hr')) return Users;
  if (actionUrl.includes('facility')) return Building2;
  if (actionUrl.includes('exception') || actionUrl.includes('supply')) return Package;
  return Bot;
}

/* ─── Time formatting ─── */
function formatTimeAgo(timestamp) {
  const now = new Date('2026-03-15T12:00:00Z'); // demo date
  const then = new Date(timestamp);
  const diffMs = now - then;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}

/* ─── Render an icon from a component reference without creating components during render ─── */
function renderIcon(IconComponent, size, className) {
  return <IconComponent size={size} className={className} />;
}

/* ─── Notification Item ─── */
function NotificationItem({ notification, onNavigate, onDismiss, onMarkRead }) {
  const typeConfig = TYPE_CONFIG[notification.type] || TYPE_CONFIG.info;
  const categoryIcon = getCategoryIcon(notification.actionUrl);

  const handleClick = useCallback(() => {
    onMarkRead(notification.id);
    if (notification.actionUrl) {
      onNavigate(notification.actionUrl);
    }
  }, [notification.id, notification.actionUrl, onMarkRead, onNavigate]);

  const handleDismiss = useCallback((e) => {
    e.stopPropagation();
    onDismiss(notification.id);
  }, [notification.id, onDismiss]);

  return (
    <div
      onClick={handleClick}
      className={`group relative flex gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all ${
        notification.read
          ? 'opacity-60 hover:opacity-80 hover:bg-gray-50'
          : 'hover:bg-gray-50'
      }`}
    >
      {/* Unread dot */}
      {!notification.read && (
        <div className={`absolute left-1 top-5 w-2 h-2 rounded-full ${typeConfig.dotColor}`} />
      )}

      {/* Icon */}
      <div className={`flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center ${
        notification.read ? 'bg-gray-100' : 'bg-gray-50 border border-gray-200'
      }`}>
        {renderIcon(categoryIcon, 16, notification.read ? 'text-gray-400' : typeConfig.iconColor)}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className={`text-sm leading-snug ${notification.read ? 'text-gray-500' : 'text-gray-900 font-semibold'}`}>
            {notification.title}
          </p>
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 p-1 rounded-full opacity-0 group-hover:opacity-100 hover:bg-gray-200 transition-all"
            title="Dismiss"
          >
            <X size={12} className="text-gray-400" />
          </button>
        </div>
        <p className={`text-xs mt-0.5 line-clamp-2 ${notification.read ? 'text-gray-400' : 'text-gray-500'}`}>
          {notification.message}
        </p>
        <div className="flex items-center gap-2 mt-1.5">
          <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full border ${typeConfig.badgeColor}`}>
            {renderIcon(typeConfig.icon, 10)}
            {typeConfig.label}
          </span>
          <span className="flex items-center gap-1 text-[10px] text-gray-400">
            <Clock size={10} />
            {formatTimeAgo(notification.timestamp)}
          </span>
        </div>
      </div>
    </div>
  );
}

/* ─── Notification Center Panel ─── */
export default function NotificationCenter({ isOpen, onClose }) {
  const { notifications, unreadCount, markAsRead, dismiss, dismissAll } = useNotificationContext();
  const navigate = useNavigate();

  const handleNavigate = useCallback((url) => {
    onClose();
    navigate(url);
  }, [navigate, onClose]);

  // Group notifications by type, ordered: critical, decision-required, agent-update, info
  const grouped = useMemo(() => {
    const typeOrder = ['critical', 'decision-required', 'agent-update', 'info'];
    const groups = {};
    for (const type of typeOrder) {
      const items = notifications.filter(n => n.type === type);
      if (items.length > 0) {
        groups[type] = items.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      }
    }
    return groups;
  }, [notifications]);

  return (
    <SlideOutPanel isOpen={isOpen} onClose={onClose} title="Notifications" width="md">
      {/* Header actions */}
      <div className="flex items-center justify-between mb-4 -mt-2">
        <p className="text-sm text-gray-500">
          {unreadCount > 0 ? (
            <><span className="font-semibold text-gray-900">{unreadCount}</span> unread</>
          ) : (
            'All caught up'
          )}
        </p>
        {unreadCount > 0 && (
          <button
            onClick={dismissAll}
            className="flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors px-2 py-1 rounded-lg hover:bg-blue-50"
          >
            <CheckCheck size={14} />
            Mark all read
          </button>
        )}
      </div>

      {/* Grouped notifications */}
      {notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
            <CheckCheck size={20} className="text-gray-400" />
          </div>
          <p className="text-sm font-medium text-gray-500">No notifications</p>
          <p className="text-xs text-gray-400 mt-1">All clear across the enterprise</p>
        </div>
      ) : (
        <div className="space-y-5">
          {Object.entries(grouped).map(([type, items]) => {
            const config = TYPE_CONFIG[type];
            const unreadInGroup = items.filter(n => !n.read).length;

            return (
              <div key={type}>
                <div className="flex items-center gap-2 mb-2 px-1">
                  {renderIcon(config.icon, 14, config.iconColor)}
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                    {config.label}
                  </span>
                  {unreadInGroup > 0 && (
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${config.badgeColor}`}>
                      {unreadInGroup}
                    </span>
                  )}
                </div>
                <div className="space-y-0.5">
                  {items.map(n => (
                    <NotificationItem
                      key={n.id}
                      notification={n}
                      onNavigate={handleNavigate}
                      onDismiss={dismiss}
                      onMarkRead={markAsRead}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </SlideOutPanel>
  );
}
