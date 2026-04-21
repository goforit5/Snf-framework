/**
 * ContentPane — Right pane (col 3) of the 3-column shell.
 *
 * Two modes:
 *   1. Decision detail — when pathname is '/' and ?decision=ID is present,
 *      renders DecisionDetail instead of children.
 *   2. Page content — breadcrumb bar at top, then routed {children}.
 */

import { useLocation, useSearchParams } from 'react-router-dom';
import { buildBreadcrumb } from '../../data/navigation';
import DecisionDetail from './DecisionDetail';

/* ─── Styles ─── */
const paneStyle = {
  display: 'flex',
  flexDirection: 'column',
  height: '100vh',
  minWidth: 0,
  background: 'var(--bg)',
  fontFamily: 'var(--font-text)',
  color: 'var(--ink-1)',
};

const breadcrumbBarStyle = {
  flexShrink: 0,
  padding: '10px 24px',
  borderBottom: '1px solid var(--line-soft)',
  minHeight: 36,
  display: 'flex',
  alignItems: 'center',
};

const breadcrumbTextStyle = {
  fontSize: 11.5,
  color: 'var(--ink-3)',
  margin: 0,
  fontFamily: 'var(--font-text)',
};

const childrenWrapperStyle = {
  flex: 1,
  overflow: 'auto',
};

/* ─── Component ─── */
export default function ContentPane({ children, activeDomain: _activeDomain }) {
  const location = useLocation();
  const pathname = location.pathname;
  const [searchParams] = useSearchParams();
  const decisionId = searchParams.get('decision');

  /* Decision detail mode: Home route + decision param */
  const showDecisionDetail = pathname === '/' && decisionId;

  if (showDecisionDetail) {
    return (
      <main style={paneStyle}>
        <DecisionDetail decisionId={decisionId} />
      </main>
    );
  }

  /* Normal page mode: breadcrumb + routed children */
  const crumbs = buildBreadcrumb(pathname);

  return (
    <main style={paneStyle}>
      {/* Breadcrumb bar */}
      {crumbs.length > 0 && (
        <div style={breadcrumbBarStyle}>
          <p style={breadcrumbTextStyle}>
            {crumbs.join(' \u203a ')}
          </p>
        </div>
      )}

      {/* Page content */}
      <div style={childrenWrapperStyle}>
        {children}
      </div>
    </main>
  );
}
