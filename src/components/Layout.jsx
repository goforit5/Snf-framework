import { useState, useEffect, useRef, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, BarChart3, AlertTriangle, Activity, Coffee, Shield, Settings,
  Stethoscope, Pill, Dumbbell, Bug, Apple, Heart, FileText, ClipboardCheck, ShieldCheck, Eye,
  DollarSign, CreditCard, Handshake, Calculator, Receipt, FileWarning, Calendar, Banknote, Vault, PieChart,
  Users, UserPlus, ClipboardList, CalendarClock, BadgeCheck, GraduationCap, UserCog, Gift, HardHat, TrendingDown,
  Building2, Package, Wrench, Sparkles, Flame, Truck, Monitor,
  BedDouble, Phone, Percent, Megaphone,
  Award, ShieldAlert, HeartPulse, MessageSquare, Target,
  Scale, FileSignature, Gavel, FileCheck, Home,
  Building, Globe, Landmark, LineChart, Flag,
  Menu, X, ChevronDown, ChevronLeft, ChevronRight, Bot, Search, Bell, Play, Sun, Moon
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useDarkModeContext } from '../hooks/useDarkMode';
import { useScopeContext } from '../hooks/useScopeContext';
import { useAgentContext } from '../hooks/useAgentContext';
import { useNotificationContext } from '../hooks/useNotificationContext';
import { demoUserList } from '../data/platform/users';
import { facilities } from '../data/entities/facilities';
import { regions } from '../data/entities/regions';
import { ScopeSelector } from './FilterComponents';
import GlobalSearch from './GlobalSearch';
import { useGlobalSearchShortcut } from './GlobalSearchUtils';
import NotificationCenter from './NotificationCenter';
import IssueReporter from './IssueReporter';

/* ─── Navigation Definition ─── */
const NAV_SECTIONS = [
  {
    key: 'platform',
    title: 'Platform',
    icon: LayoutDashboard,
    items: [
      { path: '/', label: 'Command Center', icon: LayoutDashboard },
      { path: '/dashboard', label: 'Executive Dashboard', icon: BarChart3 },
      { path: '/exceptions', label: 'Exception Queue', icon: AlertTriangle },
      { path: '/agents', label: 'Agent Operations', icon: Activity },
      { path: '/briefing', label: 'Morning Briefing', icon: Coffee },
      { path: '/audit', label: 'Audit Trail', icon: Shield },
      { path: '/settings', label: 'Settings', icon: Settings },
    ],
  },
  {
    key: 'clinical',
    title: 'Clinical',
    icon: Stethoscope,
    items: [
      { path: '/clinical', label: 'Clinical Command', icon: Stethoscope },
      { path: '/clinical/pharmacy', label: 'Pharmacy', icon: Pill },
      { path: '/clinical/therapy', label: 'Therapy & Rehab', icon: Dumbbell },
      { path: '/clinical/infection-control', label: 'Infection Control', icon: Bug },
      { path: '/clinical/dietary', label: 'Dietary & Nutrition', icon: Apple },
      { path: '/clinical/social-services', label: 'Social Services', icon: Heart },
      { path: '/clinical/medical-records', label: 'Medical Records', icon: FileText },
      { path: '/survey', label: 'Survey Readiness', icon: ClipboardCheck },
      { path: '/compliance', label: 'Compliance', icon: ShieldCheck },
      { path: '/audits', label: 'Audit Library', icon: Eye },
    ],
  },
  {
    key: 'revenue',
    title: 'Revenue Cycle',
    icon: DollarSign,
    items: [
      { path: '/revenue', label: 'Revenue Command', icon: DollarSign },
      { path: '/revenue/billing', label: 'Billing & Claims', icon: FileText },
      { path: '/revenue/ar', label: 'AR Management', icon: CreditCard },
      { path: '/revenue/managed-care', label: 'Managed Care', icon: Handshake },
      { path: '/revenue/pdpm', label: 'PDPM Optimization', icon: Calculator },
      { path: '/ap', label: 'AP Operations', icon: Receipt },
      { path: '/invoice-exceptions', label: 'Invoice Exceptions', icon: FileWarning },
      { path: '/close', label: 'Monthly Close', icon: Calendar },
      { path: '/payroll', label: 'Payroll', icon: Banknote },
      { path: '/revenue/treasury', label: 'Treasury & Cash', icon: Vault },
      { path: '/revenue/budget', label: 'Budget & Forecast', icon: PieChart },
    ],
  },
  {
    key: 'workforce',
    title: 'Workforce',
    icon: Users,
    items: [
      { path: '/workforce', label: 'Workforce Command', icon: Users },
      { path: '/workforce/recruiting', label: 'Recruiting', icon: UserPlus },
      { path: '/workforce/onboarding', label: 'Onboarding', icon: ClipboardList },
      { path: '/workforce/scheduling', label: 'Scheduling', icon: CalendarClock },
      { path: '/workforce/credentialing', label: 'Credentialing', icon: BadgeCheck },
      { path: '/workforce/training', label: 'Training', icon: GraduationCap },
      { path: '/workforce/employee-relations', label: 'Employee Relations', icon: UserCog },
      { path: '/workforce/benefits', label: 'Benefits', icon: Gift },
      { path: '/workforce/workers-comp', label: 'Workers Comp', icon: HardHat },
      { path: '/workforce/retention', label: 'Retention', icon: TrendingDown },
    ],
  },
  {
    key: 'operations',
    title: 'Operations',
    icon: Building2,
    items: [
      { path: '/facility', label: 'Facility Command', icon: Building2 },
      { path: '/operations/supply-chain', label: 'Supply Chain', icon: Package },
      { path: '/operations/maintenance', label: 'Maintenance', icon: Wrench },
      { path: '/operations/environmental', label: 'Environmental', icon: Sparkles },
      { path: '/operations/life-safety', label: 'Life Safety', icon: Flame },
      { path: '/operations/transportation', label: 'Transportation', icon: Truck },
      { path: '/operations/it', label: 'IT Service Desk', icon: Monitor },
    ],
  },
  {
    key: 'admissions',
    title: 'Admissions',
    icon: BedDouble,
    items: [
      { path: '/admissions', label: 'Census Command', icon: BedDouble },
      { path: '/admissions/referrals', label: 'Referrals', icon: Phone },
      { path: '/admissions/pre-admission', label: 'Pre-Admission', icon: ClipboardCheck },
      { path: '/admissions/payer-mix', label: 'Payer Mix', icon: Percent },
      { path: '/admissions/marketing', label: 'Marketing & BD', icon: Megaphone },
    ],
  },
  {
    key: 'quality',
    title: 'Quality',
    icon: Award,
    items: [
      { path: '/quality', label: 'Quality Command', icon: Award },
      { path: '/quality/risk', label: 'Risk Management', icon: ShieldAlert },
      { path: '/quality/patient-safety', label: 'Patient Safety', icon: HeartPulse },
      { path: '/quality/grievances', label: 'Grievances', icon: MessageSquare },
      { path: '/quality/outcomes', label: 'Outcomes', icon: Target },
    ],
  },
  {
    key: 'legal',
    title: 'Legal',
    icon: Scale,
    items: [
      { path: '/legal', label: 'Legal Command', icon: Scale },
      { path: '/legal/contracts', label: 'Contracts', icon: FileSignature },
      { path: '/legal/litigation', label: 'Litigation', icon: Gavel },
      { path: '/legal/regulatory', label: 'Regulatory', icon: FileCheck },
      { path: '/legal/real-estate', label: 'Real Estate', icon: Home },
      { path: '/legal/corporate-compliance', label: 'Corporate Compliance', icon: ShieldCheck },
    ],
  },
  {
    key: 'strategic',
    title: 'Strategic',
    icon: Building,
    items: [
      { path: '/ma', label: 'M&A Pipeline', icon: Building },
      { path: '/strategic/market-intel', label: 'Market Intel', icon: Globe },
      { path: '/strategic/board', label: 'Board Governance', icon: Landmark },
      { path: '/strategic/investor-relations', label: 'Investor Relations', icon: LineChart },
      { path: '/strategic/government-affairs', label: 'Government Affairs', icon: Flag },
    ],
  },
  {
    key: 'demo',
    title: 'Demo',
    icon: Play,
    items: [
      { path: '/presentation', label: 'Presentation', icon: Play },
      { path: '/demo/ai-landscape', label: 'AI Landscape', icon: Globe },
      { path: '/demo/frameworks', label: 'Decision Frameworks', icon: Target },
    ],
  },
];

/* ─── Helpers ─── */
const STORAGE_KEY = 'snf-nav-collapsed';

function loadCollapsedState() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

function saveCollapsedState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // localStorage unavailable
  }
}

function findCurrentSection(pathname) {
  for (const section of NAV_SECTIONS) {
    for (const item of section.items) {
      if (item.path === pathname) return section.key;
    }
  }
  return 'platform';
}

function buildBreadcrumb(pathname) {
  for (const section of NAV_SECTIONS) {
    for (const item of section.items) {
      if (item.path === pathname) {
        return { section: section.title, page: item.label };
      }
    }
  }
  return { section: 'Platform', page: 'Command Center' };
}

/* ─── Scope Selector Adapter ─── */
function ScopeSelectorBar() {
  const { scope, setScope } = useScopeContext();

  const facilityOptions = useMemo(
    () => facilities.map(f => ({ id: f.id, label: f.name })),
    []
  );
  const regionOptions = useMemo(
    () => regions.map(r => ({ id: r.id, label: r.name })),
    []
  );

  return (
    <ScopeSelector
      currentScope={scope}
      facilities={facilityOptions}
      regions={regionOptions}
      onChange={({ type, id }) => setScope(type, id)}
    />
  );
}

/* ─── Role Switcher ─── */
function RoleSwitcher() {
  const { user, switchRole } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setIsOpen(false);
    }
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label={`Switch role, current: ${user.name}`}
        className="flex items-center gap-2 px-2 py-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      >
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-[10px] font-bold text-white shadow-sm" aria-hidden="true">
          {user.avatarInitials}
        </div>
        <ChevronDown size={12} className={`text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-1.5 w-64 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 z-50 overflow-hidden" role="menu" aria-label="Role switcher">
          {/* Current user header */}
          <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50">
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{user.name}</p>
            <p className="text-[11px] text-gray-500 dark:text-gray-400">{user.title}</p>
          </div>
          <div className="py-1">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-4 pt-2 pb-1" id="role-switcher-label">Switch Role</p>
            {demoUserList.map((u) => (
              <button
                key={u.id}
                role="menuitem"
                onClick={() => { switchRole(u.role); setIsOpen(false); }}
                aria-current={user.id === u.id ? 'true' : undefined}
                className={`w-full flex items-center gap-3 px-4 py-2 text-left transition-colors ${
                  user.id === u.id ? 'bg-blue-50 dark:bg-blue-900/30' : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-sm ${
                  user.id === u.id
                    ? 'bg-gradient-to-br from-blue-600 to-indigo-600'
                    : 'bg-gray-400'
                }`}>
                  {u.avatarInitials}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm truncate ${user.id === u.id ? 'font-semibold text-blue-700 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'}`}>{u.name}</p>
                  <p className="text-[10px] text-gray-400 dark:text-gray-500 truncate">{u.title}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Notification Bell ─── */
function NotificationBell({ onClick }) {
  const { unreadCount, criticalCount } = useNotificationContext();

  return (
    <button
      onClick={onClick}
      className="relative p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
    >
      <Bell size={18} className="text-gray-500 dark:text-gray-400" aria-hidden="true" />
      {unreadCount > 0 && (
        <span
          className={`absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full text-[10px] font-bold text-white px-1 ${
            criticalCount > 0 ? 'bg-red-500' : 'bg-blue-500'
          }`}
          aria-hidden="true"
        >
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </button>
  );
}

/* ─── Agent Pulse ─── */
function AgentPulse() {
  const { agentCount } = useAgentContext();

  return (
    <div className="flex items-center gap-2 bg-green-50 dark:bg-green-900/30 px-3 py-1.5 rounded-full border border-green-100 dark:border-green-800" role="status" aria-live="polite">
      <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" aria-hidden="true" />
      <span className="text-xs text-green-700 dark:text-green-400 font-medium">{agentCount.active} agents active</span>
    </div>
  );
}

/* ─── Responsive Breakpoint Constants ─── */
const BREAKPOINT_MOBILE = 768;
const BREAKPOINT_TABLET = 1280;

function useResponsiveMode() {
  const [mode, setMode] = useState(() => {
    if (typeof window === 'undefined') return 'full';
    const w = window.innerWidth;
    if (w < BREAKPOINT_MOBILE) return 'mobile';
    if (w < BREAKPOINT_TABLET) return 'icons';
    return 'full';
  });

  useEffect(() => {
    const mqMobile = window.matchMedia(`(max-width: ${BREAKPOINT_MOBILE - 1}px)`);
    const mqTablet = window.matchMedia(`(min-width: ${BREAKPOINT_MOBILE}px) and (max-width: ${BREAKPOINT_TABLET - 1}px)`);

    function update() {
      if (mqMobile.matches) setMode('mobile');
      else if (mqTablet.matches) setMode('icons');
      else setMode('full');
    }

    mqMobile.addEventListener('change', update);
    mqTablet.addEventListener('change', update);
    return () => {
      mqMobile.removeEventListener('change', update);
      mqTablet.removeEventListener('change', update);
    };
  }, []);

  return mode;
}

/* ─── Main Layout ─── */
export default function Layout({ children }) {
  const responsiveMode = useResponsiveMode();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchOpen, setSearchOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const location = useLocation();
  const { user, canViewSection } = useAuth();
  const { isDark, toggle: toggleDarkMode } = useDarkModeContext();

  useGlobalSearchShortcut(setSearchOpen);

  // Close mobile menu on route change
  // eslint-disable-next-line react-hooks/set-state-in-effect -- conditional on prev !== current, not cascading
  useEffect(() => { setMobileMenuOpen(prev => prev ? false : prev); }, [location.pathname]);

  // Close mobile/tablet menu overlay when resizing to desktop
  // eslint-disable-next-line react-hooks/set-state-in-effect -- conditional, only fires on breakpoint change
  useEffect(() => { if (responsiveMode === 'full') setMobileMenuOpen(prev => prev ? false : prev); }, [responsiveMode]);

  const currentSectionKey = findCurrentSection(location.pathname);
  const breadcrumb = buildBreadcrumb(location.pathname);

  const isTablet = responsiveMode === 'icons';
  const isIconsOnly = isTablet || (responsiveMode === 'full' && !sidebarOpen);
  const isMobile = responsiveMode === 'mobile';

  // Initialize collapsed state: current section + platform expanded, rest collapsed
  const [userExpandedSections, setUserExpandedSections] = useState(() => {
    const stored = loadCollapsedState();
    if (stored) return stored;
    const initial = {};
    NAV_SECTIONS.forEach(s => {
      initial[s.key] = s.key === 'platform' || s.key === currentSectionKey;
    });
    return initial;
  });

  // Auto-expand current section on navigation — but respect manual toggles
  const [prevSectionKey, setPrevSectionKey] = useState(currentSectionKey);
  if (currentSectionKey !== prevSectionKey) {
    setPrevSectionKey(currentSectionKey);
    if (!userExpandedSections[currentSectionKey]) {
      const merged = { ...userExpandedSections, [currentSectionKey]: true };
      saveCollapsedState(merged);
      setUserExpandedSections(merged);
    }
  }
  const expandedSections = userExpandedSections;

  const toggleSection = (key) => {
    setUserExpandedSections(prev => {
      const next = { ...prev, [key]: !prev[key] };
      saveCollapsedState(next);
      return next;
    });
  };

  // Filter sections by role visibility
  const visibleSections = useMemo(
    () => NAV_SECTIONS.filter(s => canViewSection(s.key)),
    [canViewSection]
  );

  /* ─── Sidebar content (shared between desktop and mobile overlay) ─── */
  const sidebarContent = (full) => (
    <div className={`${full ? 'w-64' : 'w-16'} h-full flex flex-col transition-all duration-200`}>
      {/* Logo */}
      <div className={`${full ? 'p-5' : 'p-3'} border-b border-gray-100 dark:border-gray-800`}>
        <div className={`flex items-center ${full ? 'gap-3' : 'justify-center'}`}>
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-sm flex-shrink-0">
            <Bot size={18} className="text-white" />
          </div>
          {full && (
            <div>
              <h1 className="text-sm font-bold text-gray-900 dark:text-gray-100 tracking-tight">Ensign</h1>
              <p className="text-[10px] text-gray-400 dark:text-gray-500 leading-tight font-medium">Agentic Framework</p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className={`flex-1 overflow-y-auto py-3 ${full ? 'px-3' : 'px-1.5'} scrollbar-thin`} aria-label="Main navigation">
        {visibleSections.map((section) => {
          const SectionIcon = section.icon;
          const isCurrentSection = section.key === currentSectionKey;
          const isExpanded = expandedSections[section.key];

          return (
            <div key={section.key} className="mb-1">
              {full ? (
                <button
                  onClick={() => toggleSection(section.key)}
                  aria-expanded={isExpanded}
                  aria-label={`${section.title} section`}
                  className={`w-full flex items-center justify-between px-2 py-2 min-h-[44px] text-[10px] font-bold uppercase tracking-wider transition-colors rounded-lg ${
                    isCurrentSection
                      ? 'text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-900/20'
                      : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <SectionIcon size={12} aria-hidden="true" />
                    {section.title}
                  </div>
                  {isExpanded ? <ChevronDown size={12} aria-hidden="true" /> : <ChevronRight size={12} aria-hidden="true" />}
                </button>
              ) : (
                <div className="flex justify-center py-1">
                  <Link
                    to={section.items[0]?.path || '/'}
                    title={section.title}
                    className={`w-11 h-11 flex items-center justify-center rounded-xl transition-colors ${
                      isCurrentSection
                        ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30'
                        : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                  >
                    <SectionIcon size={18} />
                  </Link>
                </div>
              )}
              {full && isExpanded && (
                <div className="space-y-0.5">
                  {section.items.map((item) => {
                    const isActive = location.pathname === item.path;
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        aria-current={isActive ? 'page' : undefined}
                        className={`flex items-center gap-2.5 px-3 py-2 min-h-[44px] rounded-xl text-sm transition-all ${
                          isActive
                            ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-semibold shadow-sm'
                            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-200'
                        }`}
                      >
                        <Icon size={16} className={isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400'} aria-hidden="true" />
                        {item.label}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* User */}
      <div className={`${full ? 'p-4' : 'p-2'} border-t border-gray-100 dark:border-gray-800`}>
        <div className={`flex items-center ${full ? 'gap-3 px-2' : 'justify-center'}`}>
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-[11px] font-bold text-white shadow-sm flex-shrink-0">
            {user.avatarInitials}
          </div>
          {full && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{user.name}</p>
              <p className="text-[10px] text-gray-400 dark:text-gray-500 font-medium truncate">{user.title}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-[#f5f5f7] dark:bg-gray-950">
      {/* Skip navigation link */}
      <a href="#main-content" className="skip-nav">
        Skip to main content
      </a>

      {/* Mobile/tablet sidebar overlay */}
      {(isMobile || isTablet) && mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
          <aside className="relative w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 shadow-xl">
            <button
              onClick={() => setMobileMenuOpen(false)}
              aria-label="Close menu"
              className="absolute top-4 right-4 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors z-10"
            >
              <X size={20} className="text-gray-500" aria-hidden="true" />
            </button>
            {sidebarContent(true)}
          </aside>
        </div>
      )}

      {/* Desktop / tablet sidebar */}
      {!isMobile && (
        <aside className={`${isIconsOnly ? 'w-16' : 'w-64'} transition-all duration-200 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex-shrink-0 overflow-hidden`} aria-label="Primary navigation">
          {sidebarContent(!isIconsOnly)}
        </aside>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="h-14 border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl flex items-center justify-between px-4 flex-shrink-0">
          {/* Left: hamburger + breadcrumb */}
          <div className="flex items-center gap-3">
            {isMobile || isTablet ? (
              <button
                onClick={() => setMobileMenuOpen(true)}
                aria-label="Open menu"
                className="min-h-[44px] min-w-[44px] flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <Menu size={20} aria-hidden="true" />
              </button>
            ) : (
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                aria-label={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
                aria-expanded={sidebarOpen}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                {sidebarOpen ? <X size={18} aria-hidden="true" /> : <Menu size={18} aria-hidden="true" />}
              </button>
            )}
            <div className="hidden sm:flex items-center gap-1.5 text-sm">
              <span className="text-gray-400 dark:text-gray-500 font-medium">{breadcrumb.section}</span>
              <ChevronRight size={12} className="text-gray-300 dark:text-gray-600" />
              <span className="text-gray-700 dark:text-gray-200 font-semibold">{breadcrumb.page}</span>
            </div>
          </div>

          {/* Center: search trigger */}
          <div className="flex-1 flex justify-center px-2 md:px-4">
            <button
              onClick={() => setSearchOpen(true)}
              aria-label="Search the platform (Command+K)"
              className="w-full max-w-md flex items-center gap-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 min-h-[44px] text-sm text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-all cursor-pointer"
            >
              <Search size={14} className="text-gray-400 flex-shrink-0" aria-hidden="true" />
              <span className="flex-1 text-left hidden sm:inline">Search anything...</span>
              <span className="flex-1 text-left sm:hidden">Search...</span>
              <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-gray-200 dark:bg-gray-700 text-[10px] font-semibold text-gray-500 dark:text-gray-400">
                &#8984;K
              </kbd>
            </button>
          </div>

          {/* Right: scope, pulse, notifications, role */}
          <div className="flex items-center gap-1 md:gap-2">
            <div className="hidden lg:block"><ScopeSelectorBar /></div>
            <div className="hidden md:block"><AgentPulse /></div>
            <button
              onClick={toggleDarkMode}
              aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
            >
              {isDark ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <NotificationBell onClick={() => setNotificationsOpen(true)} />
            <RoleSwitcher />
          </div>
        </header>

        {/* Page content */}
        <main id="main-content" className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 scrollbar-thin" tabIndex={-1}>
          {children}
        </main>
      </div>

      {/* Global Search Overlay */}
      <GlobalSearch isOpen={searchOpen} onClose={() => setSearchOpen(false)} />

      {/* Notification Center */}
      <NotificationCenter isOpen={notificationsOpen} onClose={() => setNotificationsOpen(false)} />

      {/* Feedback Reporter */}
      <IssueReporter />

      {/* Back to Presentation pill — shown when navigated from presentation */}
      {typeof sessionStorage !== 'undefined' && sessionStorage.getItem('fromPresentation') && (
        <Link
          to="/presentation"
          onClick={() => sessionStorage.removeItem('fromPresentation')}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2 rounded-full bg-gray-900 text-white text-xs font-semibold shadow-lg hover:bg-gray-800 transition-colors"
        >
          <ChevronLeft size={14} /> Back to Presentation
        </Link>
      )}
    </div>
  );
}
