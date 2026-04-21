/**
 * DomainIndex — Section-grouped page links for the domain middle column.
 *
 * Shows the page list for a given domain section. Active page gets a
 * left accent border and accent color text matching Apple Mail's
 * selected-row treatment.
 */

import { Link, useLocation } from 'react-router-dom';
import { findSectionByKey } from '../../data/navigation';

/* ─── Styles ─── */
const listStyle = {
  listStyle: 'none',
  margin: 0,
  padding: '4px 0',
};

/* ─── Component ─── */
export default function DomainIndex({ sectionKey }) {
  const location = useLocation();
  const currentPath = location.pathname;
  const section = findSectionByKey(sectionKey);

  if (!section || !section.items || section.items.length === 0) {
    return (
      <div style={{ padding: '24px 16px', textAlign: 'center' }}>
        <p style={{
          fontSize: 12.5,
          color: 'var(--ink-3)',
          margin: 0,
          fontFamily: 'var(--font-text)',
        }}>
          No pages in this section
        </p>
      </div>
    );
  }

  return (
    <nav>
      <ul style={listStyle}>
        {section.items.map((item) => {
          const isActive = currentPath === item.path;

          return (
            <li key={item.path}>
              <Link
                to={item.path}
                style={{
                  display: 'block',
                  padding: '7px 16px',
                  fontSize: 12.5,
                  fontWeight: isActive ? 600 : 500,
                  color: isActive ? 'var(--accent)' : 'var(--ink-1)',
                  background: isActive ? 'var(--accent-weak)' : 'transparent',
                  borderLeft: isActive
                    ? '3px solid var(--accent)'
                    : '3px solid transparent',
                  textDecoration: 'none',
                  fontFamily: 'var(--font-text)',
                  lineHeight: 1.4,
                  transition: 'background 120ms ease, color 120ms ease',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) e.currentTarget.style.background = 'var(--surface-2)';
                }}
                onMouseLeave={(e) => {
                  if (!isActive) e.currentTarget.style.background = 'transparent';
                }}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
