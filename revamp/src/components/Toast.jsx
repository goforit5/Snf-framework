import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

const ToastContext = createContext(null);

const TYPE_COLORS = {
  success: { bg: 'var(--green)', color: 'var(--ink-on-accent)' },
  info:    { bg: 'var(--accent)', color: 'var(--ink-on-accent)' },
  warning: { bg: 'var(--amber)', color: 'var(--ink-on-accent)' },
};

const DISMISS_MS = 4000;
const MAX_TOASTS = 3;

let _toastId = 0;

function ToastItem({ toast, onRemove }) {
  const [exiting, setExiting] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    timerRef.current = setTimeout(() => setExiting(true), DISMISS_MS - 300);
    return () => clearTimeout(timerRef.current);
  }, []);

  useEffect(() => {
    if (exiting) {
      const t = setTimeout(() => onRemove(toast.id), 300);
      return () => clearTimeout(t);
    }
  }, [exiting, toast.id, onRemove]);

  const c = TYPE_COLORS[toast.type] || TYPE_COLORS.info;

  return (
    <div
      role="status"
      style={{
        padding: '10px 20px',
        borderRadius: 10,
        background: c.bg,
        color: c.color,
        fontSize: 13,
        fontWeight: 600,
        fontFamily: 'var(--font-text)',
        boxShadow: 'var(--sh-pop)',
        animation: exiting
          ? 'toastOut 300ms ease forwards'
          : 'fadeSlideIn 200ms ease',
        pointerEvents: 'auto',
        maxWidth: 420,
        textAlign: 'center',
      }}
    >
      {toast.message}
    </div>
  );
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const remove = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const show = useCallback((message, type = 'info') => {
    setToasts((prev) => {
      const next = [...prev, { id: ++_toastId, message, type }];
      return next.slice(-MAX_TOASTS);
    });
  }, []);

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      {toasts.length > 0 && (
        <div
          aria-live="polite"
          style={{
            position: 'fixed',
            bottom: 24,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 'var(--z-modal)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 8,
            pointerEvents: 'none',
          }}
        >
          {toasts.map((t) => (
            <ToastItem key={t.id} toast={t} onRemove={remove} />
          ))}
        </div>
      )}
      <style>{`
        @keyframes toastOut {
          to { opacity: 0; transform: translateY(8px); }
        }
      `}</style>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
