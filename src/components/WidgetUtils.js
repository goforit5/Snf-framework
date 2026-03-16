import { createContext, useContext } from 'react';

/* ─── Modal Context (shared between Widgets and consumers) ─── */
export const ModalContext = createContext(null);

export function useModal() {
  return useContext(ModalContext);
}
