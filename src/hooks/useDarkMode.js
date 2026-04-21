import { useState, useEffect, useCallback, createContext, useContext } from 'react';

const STORAGE_KEY = 'snf-dark-mode';

function getInitialMode() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'dark') return true;
    if (stored === 'light') return false;
  } catch {
    // localStorage unavailable
  }
  // Fall back to system preference
  if (typeof window !== 'undefined') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }
  return false;
}

export function useDarkMode() {
  const [isDark, setIsDark] = useState(getInitialMode);

  // Apply dark class + data-theme attribute to html element
  // Bridge: .dark class for legacy Tailwind pages, data-theme for new shell tokens
  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
      root.setAttribute('data-theme', 'dark');
    } else {
      root.classList.remove('dark');
      root.setAttribute('data-theme', 'light');
    }
  }, [isDark]);

  // Persist preference
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, isDark ? 'dark' : 'light');
    } catch {
      // localStorage unavailable
    }
  }, [isDark]);

  // Listen for system preference changes (only if no stored preference)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    function handleChange(e) {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored) {
          setIsDark(e.matches);
        }
      } catch {
        setIsDark(e.matches);
      }
    }
    mq.addEventListener('change', handleChange);
    return () => mq.removeEventListener('change', handleChange);
  }, []);

  const toggle = useCallback(() => setIsDark((prev) => !prev), []);

  return { isDark, toggle };
}

/* ─── Context for sharing dark mode state ─── */
export const DarkModeContext = createContext({ isDark: false, toggle: () => {} });

export function useDarkModeContext() {
  return useContext(DarkModeContext);
}
