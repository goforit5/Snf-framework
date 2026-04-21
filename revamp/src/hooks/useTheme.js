// useTheme — theme hook extracted from App.jsx pattern.
// Manages dark/light toggle and syncs to document data-theme attribute.

import { useState, useEffect, useCallback } from 'react';

export function useTheme() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
  }, [dark]);

  const toggle = useCallback(() => setDark((d) => !d), []);
  const theme = dark ? 'dark' : 'light';

  return { dark, theme, toggle };
}
