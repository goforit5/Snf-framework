/**
 * CommandPalette — Cmd+K search overlay.
 *
 * Searches across pages, decisions, facilities, and records.
 * Results navigate via react-router on click.
 * Escape or backdrop click closes.
 */

import { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ALL_PAGES } from '../../data/navigation';
import { DECISIONS } from './DecisionWorklist';

/* ─── Mock data ─── */
const MOCK_FACILITIES = [
  'Heritage Oaks',
  'Bayview',
  'Meadowbrook',
  'Pacific Gardens',
  'Sunrise Senior',
];

const MOCK_RECORDS = [
  'Margaret Chen (R-214)',
  'Invoice INV-22841',
  'Contract Aetna-2024-0156',
  'License RN-2019-45678',
];

/* ─── Build searchable items ─── */
function buildItems() {
  const items = [];

  ALL_PAGES.forEach((p) => {
    items.push({
      kind: 'Page',
      label: p.label,
      sublabel: p.section,
      path: p.path,
    });
  });

  DECISIONS.forEach((d) => {
    items.push({
      kind: 'Decision',
      label: d.title,
      sublabel: `${d.id} - ${d.facility || 'Enterprise'}`,
      decisionId: d.id,
    });
  });

  MOCK_FACILITIES.forEach((f) => {
    items.push({
      kind: 'Facility',
      label: f,
      sublabel: 'Facility',
    });
  });

  MOCK_RECORDS.forEach((r) => {
    items.push({
      kind: 'Record',
      label: r,
      sublabel: 'Record',
    });
  });

  return items;
}

/* ─── Search icon SVG ─── */
function SearchIcon() {
  return (
    <svg width={15} height={15} viewBox="0 0 15 15" fill="none" stroke="var(--ink-3)" strokeWidth="1.5" strokeLinecap="round" style={{ flexShrink: 0 }}>
      <circle cx="6.5" cy="6.5" r="5" />
      <path d="M10.5 10.5L14 14" />
    </svg>
  );
}

/* ─── Kind badge colors ─── */
const KIND_COLORS = {
  Page: 'var(--accent)',
  Decision: 'var(--amber)',
  Facility: 'var(--green)',
  Record: 'var(--violet)',
};

/* ─── Styles ─── */
const backdropStyle = {
  position: 'absolute',
  inset: 0,
  zIndex: 9999,
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'center',
  paddingTop: 100,
  background: 'rgba(10,12,16,.4)',
  backdropFilter: 'blur(8px)',
  WebkitBackdropFilter: 'blur(8px)',
};

const dialogStyle = {
  width: 560,
  background: 'var(--surface)',
  border: '1px solid var(--line)',
  borderRadius: 14,
  boxShadow: 'var(--sh-pop)',
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'column',
  fontFamily: 'var(--font-text)',
};

const inputRowStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  padding: '12px 16px',
  borderBottom: '1px solid var(--line-soft)',
};

const inputStyle = {
  flex: 1,
  border: 'none',
  outline: 'none',
  background: 'transparent',
  fontSize: 14,
  color: 'var(--ink-1)',
  fontFamily: 'var(--font-text)',
};

const escBadgeStyle = {
  fontSize: 10,
  fontWeight: 500,
  color: 'var(--ink-4)',
  background: 'var(--surface-2)',
  border: '1px solid var(--line)',
  borderRadius: 4,
  padding: '2px 5px',
  flexShrink: 0,
  fontFamily: 'var(--font-mono)',
};

const listStyle = {
  maxHeight: 420,
  overflowY: 'auto',
  padding: '6px 0',
};

const emptyStyle = {
  padding: '24px 16px',
  fontSize: 13,
  color: 'var(--ink-3)',
  textAlign: 'center',
};

function resultStyle(isFirst) {
  return {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '8px 16px',
    cursor: 'pointer',
    background: isFirst ? 'var(--accent-weak)' : 'transparent',
    transition: 'background 80ms',
  };
}

function kindBadgeStyle(kind) {
  return {
    fontSize: 10,
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    color: KIND_COLORS[kind] || 'var(--ink-3)',
    background: 'var(--surface-2)',
    borderRadius: 3,
    padding: '2px 5px',
    flexShrink: 0,
    minWidth: 56,
    textAlign: 'center',
  };
}

const resultLabelStyle = {
  fontSize: 13,
  fontWeight: 500,
  color: 'var(--ink-1)',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
};

const resultSublabelStyle = {
  fontSize: 11.5,
  color: 'var(--ink-3)',
  marginLeft: 'auto',
  flexShrink: 0,
  whiteSpace: 'nowrap',
};

/* ─── Component ─── */
export default function CommandPalette({ open, onClose }) {
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const [query, setQuery] = useState('');

  const allItems = useMemo(buildItems, []);

  // Auto-focus input when opened
  useEffect(() => {
    if (open && inputRef.current) {
      // Small delay to ensure DOM is ready
      const t = setTimeout(() => inputRef.current?.focus(), 30);
      return () => clearTimeout(t);
    }
    // Reset query when closing
    if (!open) setQuery('');
  }, [open]);

  // Keyboard: escape closes
  useEffect(() => {
    if (!open) return;
    function handleKey(e) {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  if (!open) return null;

  // Filter
  const q = query.toLowerCase().trim();
  const filtered = q
    ? allItems.filter(
        (item) =>
          item.label.toLowerCase().includes(q) ||
          (item.sublabel && item.sublabel.toLowerCase().includes(q)),
      )
    : allItems;

  const results = filtered.slice(0, 10);

  function handleSelect(item) {
    if (item.kind === 'Page' && item.path) {
      navigate(item.path);
    } else if (item.kind === 'Decision' && item.decisionId) {
      navigate(`/?decision=${item.decisionId}`);
    }
    onClose();
  }

  return (
    <div style={backdropStyle} onClick={onClose}>
      <div style={dialogStyle} onClick={(e) => e.stopPropagation()}>
        {/* Search input */}
        <div style={inputRowStyle}>
          <SearchIcon />
          <input
            ref={inputRef}
            style={inputStyle}
            type="text"
            placeholder="Search pages, decisions, facilities, records..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <span style={escBadgeStyle}>esc</span>
        </div>

        {/* Results */}
        <div style={listStyle}>
          {results.length === 0 ? (
            <p style={emptyStyle}>No results for &ldquo;{query}&rdquo;</p>
          ) : (
            results.map((item, i) => (
              <div
                key={`${item.kind}-${item.label}-${i}`}
                style={resultStyle(i === 0)}
                onClick={() => handleSelect(item)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'var(--accent-weak)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = i === 0 ? 'var(--accent-weak)' : 'transparent';
                }}
              >
                <span style={kindBadgeStyle(item.kind)}>{item.kind}</span>
                <span style={resultLabelStyle}>{item.label}</span>
                <span style={resultSublabelStyle}>{item.sublabel}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
