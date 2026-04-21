/**
 * DomainHero — Grid of page cards shown when a domain is selected
 * but no specific page is active yet.
 *
 * Shows the domain title, page count subtitle, and a 3-column card grid
 * linking to each page in the section.
 */

import { Link } from 'react-router-dom';
import { findSectionByKey } from '../../data/navigation';

/* ─── Styles ─── */
const wrapperStyle = {
  padding: '28px 32px',
  fontFamily: 'var(--font-text)',
  color: 'var(--ink-1)',
};

const titleStyle = {
  fontSize: 26,
  fontWeight: 600,
  fontFamily: 'var(--font-display)',
  color: 'var(--ink-1)',
  margin: '0 0 4px',
  lineHeight: 1.2,
};

const subtitleStyle = {
  fontSize: 13,
  color: 'var(--ink-3)',
  margin: '0 0 20px',
  lineHeight: 1.4,
};

const gridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(3, 1fr)',
  gap: 12,
};

const cardStyle = {
  background: 'var(--surface)',
  border: '1px solid var(--line)',
  borderRadius: 10,
  padding: '14px 16px',
  textDecoration: 'none',
  color: 'var(--ink-1)',
  display: 'block',
  transition: 'border-color 120ms ease, box-shadow 120ms ease',
};

const cardNameStyle = {
  fontSize: 13,
  fontWeight: 600,
  color: 'var(--ink-1)',
  margin: '0 0 4px',
  lineHeight: 1.3,
};

const cardDescStyle = {
  fontSize: 11.5,
  color: 'var(--ink-3)',
  margin: 0,
  lineHeight: 1.4,
};

/* ─── Component ─── */
export default function DomainHero({ domainKey }) {
  const section = findSectionByKey(domainKey);

  if (!section || !section.items || section.items.length === 0) {
    return (
      <div style={{ ...wrapperStyle, textAlign: 'center' }}>
        <p style={{ fontSize: 14, color: 'var(--ink-3)' }}>No pages available</p>
      </div>
    );
  }

  const pageCount = section.items.length;

  return (
    <div style={wrapperStyle}>
      <h1 style={titleStyle}>{section.title}</h1>
      <p style={subtitleStyle}>
        {pageCount} page{pageCount !== 1 ? 's' : ''} &middot; agents handled 247 items overnight
      </p>

      <div style={gridStyle}>
        {section.items.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            style={cardStyle}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'var(--accent)';
              e.currentTarget.style.boxShadow = 'var(--sh-2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--line)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <p style={cardNameStyle}>{item.label}</p>
            <p style={cardDescStyle}>
              Agentic monitoring and decisions
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
