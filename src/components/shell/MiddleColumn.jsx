/**
 * MiddleColumn — 260px list pane between CommandRail and ContentPane.
 *
 * Two modes:
 *   1. Home (platform domain + path '/')  -> DecisionWorklist
 *   2. Any domain                         -> DomainIndex for that domain
 *
 * Header shows domain title + scope indicator.
 */

import { useScopeContext } from '../../hooks/useScopeContext';
import { findSectionByKey } from '../../data/navigation';
import DecisionWorklist from './DecisionWorklist';
import DomainIndex from './DomainIndex';

/* ─── Styles ─── */
const columnStyle = {
  width: 260,
  minWidth: 260,
  height: '100vh',
  display: 'flex',
  flexDirection: 'column',
  background: 'var(--surface)',
  borderRight: '1px solid var(--line)',
  overflow: 'hidden',
};

const headerStyle = {
  flexShrink: 0,
  padding: '14px 16px 10px',
  borderBottom: '1px solid var(--line-soft)',
};

const labelStyle = {
  fontSize: 10.5,
  fontWeight: 600,
  letterSpacing: 0.8,
  textTransform: 'uppercase',
  color: 'var(--ink-4)',
  margin: 0,
  lineHeight: 1,
};

const titleStyle = {
  fontSize: 13,
  fontWeight: 600,
  color: 'var(--ink-1)',
  margin: '4px 0 0',
  lineHeight: 1.2,
  fontFamily: 'var(--font-display)',
};

const scopeStyle = {
  fontSize: 11,
  fontWeight: 400,
  color: 'var(--ink-3)',
  margin: '2px 0 0',
  lineHeight: 1.2,
};

const bodyStyle = {
  flex: 1,
  overflowY: 'auto',
  overflowX: 'hidden',
};

/* ─── Component ─── */
export default function MiddleColumn({ activeDomain, pathname }) {
  const { scope } = useScopeContext();

  const isHome = activeDomain === 'platform' && pathname === '/';
  const section = findSectionByKey(activeDomain);

  // Header text
  const domainLabel = isHome ? 'Platform' : (section?.title || 'Platform');
  const headerTitle = isHome ? 'Decision Queue' : `${domainLabel} Pages`;

  return (
    <div style={columnStyle}>
      {/* Header */}
      <div style={headerStyle}>
        <p style={labelStyle}>{domainLabel}</p>
        <p style={titleStyle}>{headerTitle}</p>
        <p style={scopeStyle}>{scope.label}</p>
      </div>

      {/* Body — switches between worklist and domain index */}
      <div style={bodyStyle}>
        {isHome ? (
          <DecisionWorklist />
        ) : (
          <DomainIndex
            sectionKey={activeDomain}
            pathname={pathname}
          />
        )}
      </div>
    </div>
  );
}
