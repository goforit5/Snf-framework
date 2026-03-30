import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X, AlertTriangle, AlertCircle, Bot, Info, CheckCheck, Archive, ArchiveRestore,
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
    tabActive: 'bg-red-50 text-red-700 border-red-200',
  },
  'decision-required': {
    label: 'Decision',
    icon: AlertCircle,
    dotColor: 'bg-amber-500',
    badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
    iconColor: 'text-amber-500',
    tabActive: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  'agent-update': {
    label: 'Updates',
    icon: Bot,
    dotColor: 'bg-emerald-500',
    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    iconColor: 'text-emerald-500',
    tabActive: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  info: {
    label: 'Info',
    icon: Info,
    dotColor: 'bg-emerald-600',
    badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    iconColor: 'text-emerald-600',
    tabActive: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  },
};

const FILTER_TABS = [
  { key: 'all', label: 'All' },
  { key: 'critical', label: 'Critical' },
  { key: 'decision-required', label: 'Decision' },
  { key: 'agent-update', label: 'Updates' },
  { key: 'info', label: 'Info' },
];

/* ─── Category icons based on actionUrl ─── */
function getCategoryIcon(actionUrl) {
  if (!actionUrl) return Bot;
  if (actionUrl.includes('clinical') || actionUrl.includes('compliance')) return Stethoscope;
  if (actionUrl.includes('finance') || actionUrl.includes('ap') || actionUrl.includes('invoice') || actionUrl.includes('revenue') || actionUrl.includes('payroll') || actionUrl.includes('close')) return DollarSign;
  if (actionUrl.includes('survey') || actionUrl.includes('audit')) return ShieldCheck;
  if (actionUrl.includes('workforce') || actionUrl.includes('hr') || actionUrl.includes('scheduling')) return Users;
  if (actionUrl.includes('facility') || actionUrl.includes('admissions')) return Building2;
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

/* ─── Render an icon from a component reference ─── */
function renderIcon(IconComponent, size, className) {
  return <IconComponent size={size} className={className} />;
}

/* ─── Notification Item ─── */
function NotificationItem({ notification, onNavigate, onDismiss, onMarkRead, onArchive, showArchive = true }) {
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

  const handleArchive = useCallback((e) => {
    e.stopPropagation();
    onArchive(notification.id);
  }, [notification.id, onArchive]);

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
          <div className="flex-shrink-0 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-all">
            {showArchive && (
              <button
                onClick={handleArchive}
                className="p-1 rounded-full hover:bg-gray-200 transition-all"
                title="Archive"
              >
                <Archive size={12} className="text-gray-400" />
              </button>
            )}
            <button
              onClick={handleDismiss}
              className="p-1 rounded-full hover:bg-gray-200 transition-all"
              title="Dismiss"
            >
              <X size={12} className="text-gray-400" />
            </button>
          </div>
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

/* ─── Archived Notification Item (simplified) ─── */
function ArchivedItem({ notification, onUnarchive, onDismiss }) {
  const typeConfig = TYPE_CONFIG[notification.type] || TYPE_CONFIG.info;

  const handleUnarchive = useCallback((e) => {
    e.stopPropagation();
    onUnarchive(notification.id);
  }, [notification.id, onUnarchive]);

  const handleDismiss = useCallback((e) => {
    e.stopPropagation();
    onDismiss(notification.id);
  }, [notification.id, onDismiss]);

  return (
    <div className="group flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-gray-50 transition-all">
      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${typeConfig.dotColor} opacity-40`} />
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-400 truncate">{notification.title}</p>
        <span className="text-[10px] text-gray-300">
          {formatTimeAgo(notification.timestamp)}
        </span>
      </div>
      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-all">
        <button
          onClick={handleUnarchive}
          className="p-1 rounded-full hover:bg-gray-200 transition-all"
          title="Unarchive"
        >
          <ArchiveRestore size={12} className="text-gray-400" />
        </button>
        <button
          onClick={handleDismiss}
          className="p-1 rounded-full hover:bg-gray-200 transition-all"
          title="Delete"
        >
          <X size={12} className="text-gray-400" />
        </button>
      </div>
    </div>
  );
}

/* ─── Notification Center Panel ─── */
export default function NotificationCenter({ isOpen, onClose }) {
  const {
    notifications, archivedNotifications, unreadCount,
    markAsRead, dismiss, dismissAll,
    archiveNotification, archiveAll, unarchiveNotification,
  } = useNotificationContext();
  const navigate = useNavigate();

  const [activeFilter, setActiveFilter] = useState('all');
  const [showArchived, setShowArchived] = useState(false);

  const handleNavigate = useCallback((url) => {
    onClose();
    navigate(url);
  }, [navigate, onClose]);

  // Filter notifications by active tab
  const filteredNotifications = useMemo(() => {
    const source = showArchived ? archivedNotifications : notifications;
    if (activeFilter === 'all') return source;
    return source.filter(n => n.type === activeFilter);
  }, [notifications, archivedNotifications, activeFilter, showArchived]);

  // Count per type (active only) for tab badges
  const typeCounts = useMemo(() => {
    const counts = { all: notifications.length };
    for (const n of notifications) {
      counts[n.type] = (counts[n.type] || 0) + 1;
    }
    return counts;
  }, [notifications]);

  // Sort filtered notifications by timestamp descending
  const sortedNotifications = useMemo(() =>
    [...filteredNotifications].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)),
    [filteredNotifications]
  );

  return (
    <SlideOutPanel isOpen={isOpen} onClose={onClose} title="Notifications" width="md">
      {/* Header actions */}
      <div className="flex items-center justify-between mb-3 -mt-2">
        <p className="text-sm text-gray-500">
          {unreadCount > 0 ? (
            <><span className="font-semibold text-gray-900">{unreadCount}</span> unread</>
          ) : (
            'All caught up'
          )}
        </p>
        <div className="flex items-center gap-1">
          {!showArchived && unreadCount > 0 && (
            <button
              onClick={dismissAll}
              className="flex items-center gap-1.5 text-xs font-medium text-emerald-700 hover:text-emerald-800 transition-colors px-2 py-1 rounded-lg hover:bg-emerald-50"
            >
              <CheckCheck size={14} />
              Mark all read
            </button>
          )}
          {!showArchived && notifications.length > 0 && (
            <button
              onClick={archiveAll}
              className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 transition-colors px-2 py-1 rounded-lg hover:bg-gray-100"
            >
              <Archive size={14} />
              Archive all
            </button>
          )}
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 mb-4 overflow-x-auto pb-1 -mx-1 px-1">
        {FILTER_TABS.map((tab) => {
          const count = typeCounts[tab.key] || 0;
          const isActive = activeFilter === tab.key && !showArchived;
          const config = TYPE_CONFIG[tab.key];

          return (
            <button
              key={tab.key}
              onClick={() => { setActiveFilter(tab.key); setShowArchived(false); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap border ${
                isActive
                  ? config?.tabActive || 'bg-gray-900 text-white border-gray-900'
                  : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50 hover:border-gray-300'
              }`}
            >
              {tab.label}
              {count > 0 && !showArchived && (
                <span className={`text-[10px] font-bold px-1 min-w-[16px] text-center rounded-full ${
                  isActive ? 'bg-white/30' : 'bg-gray-100'
                }`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}

        {/* Archive toggle */}
        <button
          onClick={() => setShowArchived(!showArchived)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap border ml-auto ${
            showArchived
              ? 'bg-gray-900 text-white border-gray-900'
              : 'bg-white text-gray-400 border-gray-200 hover:bg-gray-50 hover:border-gray-300'
          }`}
        >
          <Archive size={12} />
          Archived
          {archivedNotifications.length > 0 && (
            <span className={`text-[10px] font-bold px-1 min-w-[16px] text-center rounded-full ${
              showArchived ? 'bg-white/30' : 'bg-gray-100'
            }`}>
              {archivedNotifications.length}
            </span>
          )}
        </button>
      </div>

      {/* Notification list */}
      {sortedNotifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
            {showArchived ? (
              <Archive size={20} className="text-gray-400" />
            ) : (
              <CheckCheck size={20} className="text-gray-400" />
            )}
          </div>
          <p className="text-sm font-medium text-gray-500">
            {showArchived ? 'No archived notifications' : 'No notifications'}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {showArchived ? 'Archived items will appear here' : 'All clear across the enterprise'}
          </p>
        </div>
      ) : showArchived ? (
        <div className="space-y-0.5">
          {sortedNotifications.map(n => (
            <ArchivedItem
              key={n.id}
              notification={n}
              onUnarchive={unarchiveNotification}
              onDismiss={dismiss}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-0.5">
          {sortedNotifications.map(n => (
            <NotificationItem
              key={n.id}
              notification={n}
              onNavigate={handleNavigate}
              onDismiss={dismiss}
              onMarkRead={markAsRead}
              onArchive={archiveNotification}
            />
          ))}
        </div>
      )}
    </SlideOutPanel>
  );
}
