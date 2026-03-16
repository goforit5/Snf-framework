import { useState, useEffect, useCallback, useRef } from 'react';
import { X, CheckCircle2, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { ToastContext } from './FeedbackUtils';

/* ─── Slide Out Panel ─── */
export function SlideOutPanel({ isOpen, onClose, title, width = 'md', children }) {
  const widthClasses = {
    md: 'max-w-[400px]',
    lg: 'max-w-[600px]',
    xl: 'max-w-[800px]',
  };

  useEffect(() => {
    function handleKey(e) {
      if (e.key === 'Escape' && isOpen) onClose?.();
    }
    if (isOpen) window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div
        className="absolute inset-0 bg-black/20 backdrop-blur-sm backdrop-enter"
        onClick={onClose}
      />
      <div
        className={`relative w-full ${widthClasses[width] || widthClasses.md} bg-white shadow-2xl flex flex-col slide-in-right`}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X size={18} className="text-gray-400" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
          {children}
        </div>
      </div>
    </div>
  );
}

/* ─── Toast System ─── */
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const counterRef = useRef(0);

  const removeToast = useCallback((id) => {
    // Mark toast as exiting, then remove after exit animation
    setToasts((prev) => prev.map((t) => t.id === id ? { ...t, exiting: true } : t));
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 200);
  }, []);

  const toast = useCallback(({ message, type = 'info', action, duration = 5000 }) => {
    const id = ++counterRef.current;
    setToasts((prev) => {
      const next = [...prev, { id, message, type, action, duration, exiting: false }];
      // Stack max 3
      return next.slice(-3);
    });
    if (duration > 0) {
      setTimeout(() => removeToast(id), duration);
    }
    return id;
  }, [removeToast]);

  return (
    <ToastContext.Provider value={{ toast, removeToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[60] flex flex-col-reverse gap-2 pointer-events-none">
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onDismiss={() => removeToast(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

const toastIcons = {
  success: { Icon: CheckCircle2, color: 'text-green-500' },
  error: { Icon: AlertCircle, color: 'text-red-500' },
  info: { Icon: Info, color: 'text-blue-500' },
};

function ToastItem({ toast, onDismiss }) {
  const { Icon, color } = toastIcons[toast.type] || toastIcons.info;

  return (
    <div
      className={`pointer-events-auto bg-white rounded-2xl shadow-lg border border-gray-100 px-4 py-3 flex items-center gap-3 min-w-[300px] max-w-[420px] ${toast.exiting ? 'toast-exit' : 'toast-enter'}`}
    >
      <Icon size={16} className={color} />
      <p className="text-sm text-gray-700 flex-1">{toast.message}</p>
      {toast.action && (
        <button
          onClick={() => { toast.action.onClick?.(); onDismiss(); }}
          className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors whitespace-nowrap"
        >
          {toast.action.label}
        </button>
      )}
      <button
        onClick={onDismiss}
        className="p-0.5 rounded-full hover:bg-gray-100 transition-colors flex-shrink-0"
      >
        <X size={13} className="text-gray-400" />
      </button>
    </div>
  );
}

/* ─── Toast (standalone, non-context version) ─── */
export function Toast({ message, type = 'info', action, duration = 5000, onDismiss }) {
  const { Icon, color } = toastIcons[type] || toastIcons.info;

  useEffect(() => {
    if (duration > 0 && onDismiss) {
      const timer = setTimeout(onDismiss, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onDismiss]);

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 px-4 py-3 flex items-center gap-3 min-w-[300px] max-w-[420px] toast-enter">
      <Icon size={16} className={color} />
      <p className="text-sm text-gray-700 flex-1">{message}</p>
      {action && (
        <button
          onClick={() => { action.onClick?.(); onDismiss?.(); }}
          className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors whitespace-nowrap"
        >
          {action.label}
        </button>
      )}
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="p-0.5 rounded-full hover:bg-gray-100 transition-colors flex-shrink-0"
        >
          <X size={13} className="text-gray-400" />
        </button>
      )}
    </div>
  );
}

/* ─── Confirm Dialog ─── */
export function ConfirmDialog({ isOpen, title, message, confirmLabel = 'Confirm', cancelLabel = 'Cancel', variant = 'info', onConfirm, onCancel }) {
  const variantConfig = {
    danger: { bg: 'bg-red-600 hover:bg-red-700', icon: AlertCircle, iconColor: 'text-red-500', iconBg: 'bg-red-50' },
    warning: { bg: 'bg-amber-600 hover:bg-amber-700', icon: AlertTriangle, iconColor: 'text-amber-500', iconBg: 'bg-amber-50' },
    info: { bg: 'bg-blue-600 hover:bg-blue-700', icon: Info, iconColor: 'text-blue-500', iconBg: 'bg-blue-50' },
  };
  const config = variantConfig[variant] || variantConfig.info;
  const VIcon = config.icon;

  useEffect(() => {
    function handleKey(e) {
      if (e.key === 'Escape' && isOpen) onCancel?.();
    }
    if (isOpen) window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onCancel}>
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
      <div
        className="relative bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden modal-enter"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className={`w-10 h-10 rounded-xl ${config.iconBg} flex items-center justify-center mb-4`}>
            <VIcon size={20} className={config.iconColor} />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
          <p className="text-sm text-gray-600 leading-relaxed">{message}</p>
        </div>
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex items-center justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700 transition-all active:scale-[0.97]"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold text-white shadow-sm transition-all active:scale-[0.97] ${config.bg}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Empty State ─── */
export function EmptyState({ icon: Icon, title = 'All clear', description = 'Agents handled everything. No decisions needed.', action }) {
  const DisplayIcon = Icon || CheckCircle2;

  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
      <div className="w-14 h-14 rounded-2xl bg-green-50 flex items-center justify-center mb-4">
        <DisplayIcon size={28} className="text-green-500" />
      </div>
      <h3 className="text-sm font-semibold text-gray-900 mb-1">{title}</h3>
      <p className="text-xs text-gray-500 max-w-xs">{description}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="mt-4 px-3.5 py-2 rounded-xl text-xs font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700 transition-all active:scale-[0.97]"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}

/* ─── Page Skeleton ─── */
export function PageSkeleton() {
  return (
    <div className="animate-pulse skeleton-pulse space-y-6 p-6">
      {/* Header skeleton */}
      <div className="space-y-2">
        <div className="h-7 w-48 bg-gray-200 rounded-lg" />
        <div className="h-4 w-72 bg-gray-100 rounded-lg" />
      </div>
      {/* Agent summary bar skeleton */}
      <div className="h-12 bg-gray-100 rounded-2xl" />
      {/* Stat cards skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
            <div className="flex justify-between">
              <div className="h-3 w-16 bg-gray-100 rounded" />
              <div className="w-8 h-8 bg-gray-100 rounded-xl" />
            </div>
            <div className="h-7 w-20 bg-gray-200 rounded-lg" />
            <div className="h-3 w-12 bg-gray-100 rounded" />
          </div>
        ))}
      </div>
      {/* Decision queue skeleton */}
      <div className="space-y-2">
        <div className="h-5 w-32 bg-gray-200 rounded-lg" />
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-3">
            <div className="w-6 h-6 bg-gray-100 rounded-lg" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-48 bg-gray-100 rounded" />
              <div className="h-3 w-32 bg-gray-50 rounded" />
            </div>
            <div className="flex gap-2">
              <div className="h-7 w-16 bg-gray-100 rounded-xl" />
              <div className="h-7 w-16 bg-gray-100 rounded-xl" />
            </div>
          </div>
        ))}
      </div>
      {/* Table skeleton */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="h-10 bg-gray-50" />
        {[...Array(5)].map((_, i) => (
          <div key={i} className="px-4 py-3 border-t border-gray-50 flex gap-4">
            <div className="h-4 w-24 bg-gray-100 rounded" />
            <div className="h-4 w-32 bg-gray-50 rounded" />
            <div className="h-4 w-20 bg-gray-100 rounded" />
            <div className="h-4 w-16 bg-gray-50 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
