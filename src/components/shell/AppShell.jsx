/**
 * AppShell — Top-level 3-column layout (Apple Mail style).
 *
 * Grid: 52px CommandRail | 260px MiddleColumn | 1fr ContentPane
 *
 * Owns palette-open state and Cmd+K keyboard shortcut.
 * Reads current route to resolve the active domain.
 */

import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { findDomainByPath } from '../../data/navigation';
import CommandRail from './CommandRail';
import MiddleColumn from './MiddleColumn';
import ContentPane from './ContentPane';
import CommandPalette from './CommandPalette';

/* ─── Constants ─── */
const GRID_COLUMNS = '52px 260px 1fr';

export default function AppShell({ children }) {
  const location = useLocation();
  const pathname = location.pathname;

  const activeDomain = findDomainByPath(pathname) || 'platform';

  /* ── Command palette ── */
  const [paletteOpen, setPaletteOpen] = useState(false);

  const openPalette = useCallback(() => setPaletteOpen(true), []);
  const closePalette = useCallback(() => setPaletteOpen(false), []);

  /* ── Keyboard shortcuts ── */
  useEffect(() => {
    function handleKeyDown(e) {
      // Cmd+K (macOS) or Ctrl+K (Windows/Linux) — toggle palette
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setPaletteOpen((prev) => !prev);
        return;
      }

      // Escape — close palette
      if (e.key === 'Escape' && paletteOpen) {
        e.preventDefault();
        closePalette();
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [paletteOpen, closePalette]);

  /* ── Shell styles ── */
  const shellStyle = {
    display: 'grid',
    gridTemplateColumns: GRID_COLUMNS,
    height: '100vh',
    width: '100vw',
    overflow: 'hidden',
    background: 'var(--bg)',
    fontFamily: 'var(--font-text)',
    color: 'var(--ink-1)',
  };

  return (
    <div style={shellStyle}>
      {/* Col 1 — 52px icon rail */}
      <CommandRail
        activeDomain={activeDomain}
        onSearchClick={openPalette}
      />

      {/* Col 2 — 260px middle list */}
      <MiddleColumn
        activeDomain={activeDomain}
        pathname={pathname}
      />

      {/* Col 3 — main content */}
      <ContentPane activeDomain={activeDomain}>
        {children}
      </ContentPane>

      {/* Overlay — command palette */}
      <CommandPalette open={paletteOpen} onClose={closePalette} />
    </div>
  );
}
