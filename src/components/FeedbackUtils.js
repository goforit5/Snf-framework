import { createContext, useContext } from 'react';

/* ─── Toast Context (shared between FeedbackComponents and consumers) ─── */
export const ToastContext = createContext(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within a ToastProvider');
  return ctx;
}
