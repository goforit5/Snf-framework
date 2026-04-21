/**
 * CommandRail — 52px fixed-width left rail with domain icons.
 *
 * Top:    user avatar (28px circle)
 * Middle: domain icon buttons (role-ordered, filtered by visibility + hidden flag)
 * Bottom: search trigger, dark mode toggle, scope badge
 *
 * Active domain gets --accent coloring + 2.5px left bar.
 * Icons rendered from section.railIcon (lucide component refs stored in navigation.js).
 */

import { useNavigate } from 'react-router-dom';
import { Home, Search, Sun, Moon } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useDarkModeContext } from '../../hooks/useDarkMode';
import { useScopeContext } from '../../hooks/useScopeContext';
import { NAV_SECTIONS, ROLE_DOMAIN_ORDER } from '../../data/navigation';

/* ─── Helpers ─── */
function getInitials(name) {
  if (!name) return '?';
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function getOrderedSections(role) {
  const order = ROLE_DOMAIN_ORDER[role?.toLowerCase()];
  if (!order) return NAV_SECTIONS.filter((s) => !s.hidden);
  return order
    .map((key) => NAV_SECTIONS.find((s) => s.key === key))
    .filter(Boolean)
    .filter((s) => !s.hidden);
}

/* ─── Styles ─── */
const railStyle = {
  width: 52,
  minWidth: 52,
  height: '100vh',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  background: 'var(--bg-sunk)',
  borderRight: '1px solid var(--line)',
  paddingTop: 10,
  paddingBottom: 10,
  gap: 0,
  overflow: 'hidden',
};

const avatarStyle = {
  width: 28,
  height: 28,
  borderRadius: '50%',
  background: 'var(--accent)',
  color: '#fff',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: 10.5,
  fontWeight: 600,
  fontFamily: 'var(--font-text)',
  letterSpacing: 0.3,
  cursor: 'default',
  flexShrink: 0,
  marginBottom: 12,
};

const iconListStyle = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 2,
  overflowY: 'auto',
  overflowX: 'hidden',
  width: '100%',
  paddingTop: 2,
};

const bottomStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 4,
  paddingTop: 8,
  flexShrink: 0,
};

function iconBtnStyle(isActive) {
  return {
    position: 'relative',
    width: 36,
    height: 36,
    borderRadius: 9,
    border: 'none',
    background: isActive ? 'var(--accent-weak)' : 'transparent',
    color: isActive ? 'var(--accent)' : 'var(--ink-3)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'background 120ms, color 120ms',
    padding: 0,
    flexShrink: 0,
  };
}

const accentBarStyle = {
  position: 'absolute',
  left: -1,
  top: 8,
  bottom: 8,
  width: 2.5,
  borderRadius: 2,
  background: 'var(--accent)',
};

const scopeBadgeStyle = {
  fontSize: 9,
  fontWeight: 500,
  color: 'var(--ink-4)',
  letterSpacing: 0.2,
  textAlign: 'center',
  lineHeight: 1.1,
  maxWidth: 44,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
};

/* ─── Component ─── */
export default function CommandRail({ activeDomain, onSearchClick }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isDark, toggle } = useDarkModeContext();
  const { scope } = useScopeContext();

  const sections = getOrderedSections(user.role);
  const initials = getInitials(user.name);

  // Scope label — abbreviated for rail width
  const scopeLabel =
    scope.type === 'enterprise'
      ? 'All'
      : scope.type === 'region'
        ? 'Rgn'
        : 'Fac';

  return (
    <nav style={railStyle} aria-label="Domain navigation">
      {/* Avatar */}
      <div style={avatarStyle} title={user.name}>
        {initials}
      </div>

      {/* Domain icons */}
      <div style={iconListStyle}>
        {/* Home button */}
        <button
          style={iconBtnStyle(activeDomain === 'platform' && true)}
          onClick={() => navigate('/')}
          title="Home"
          aria-label="Home"
        >
          {activeDomain === 'platform' && <span style={accentBarStyle} />}
          <Home size={17} />
        </button>

        {/* Domain buttons (skip platform — Home covers it) */}
        {sections
          .filter((s) => s.key !== 'platform')
          .map((section) => {
            const isActive = activeDomain === section.key;
            const RailIcon = section.railIcon;
            return (
              <button
                key={section.key}
                style={iconBtnStyle(isActive)}
                onClick={() => navigate(section.items[0].path)}
                title={section.title}
                aria-label={section.title}
              >
                {isActive && <span style={accentBarStyle} />}
                <RailIcon size={17} />
              </button>
            );
          })}
      </div>

      {/* Bottom tools */}
      <div style={bottomStyle}>
        <button
          style={iconBtnStyle(false)}
          onClick={onSearchClick}
          title="Search (Cmd+K)"
          aria-label="Search"
        >
          <Search size={17} />
        </button>

        <button
          style={iconBtnStyle(false)}
          onClick={toggle}
          title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          aria-label="Toggle dark mode"
        >
          {isDark ? <Sun size={17} /> : <Moon size={17} />}
        </button>

        <span style={scopeBadgeStyle} title={scope.label}>
          {scopeLabel}
        </span>
      </div>
    </nav>
  );
}
