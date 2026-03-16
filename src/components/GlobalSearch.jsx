import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, X, Building2, Users, Bot, FileText, User,
  LayoutDashboard, BarChart3, AlertTriangle, Activity, Coffee, Shield, Settings,
  Stethoscope, Pill, Dumbbell, Bug, Apple, Heart, ClipboardCheck, ShieldCheck, Eye,
  DollarSign, CreditCard, Handshake, Calculator, Receipt, FileWarning, Calendar, Banknote, Vault, PieChart,
  UserPlus, ClipboardList, CalendarClock, BadgeCheck, GraduationCap, UserCog, Gift, HardHat, TrendingDown,
  Package, Wrench, Sparkles, Flame, Truck, Monitor,
  BedDouble, Phone, Percent, Megaphone,
  Award, ShieldAlert, HeartPulse, MessageSquare, Target,
  Scale, FileSignature, Gavel, FileCheck, Home,
  Building, Globe, Landmark, LineChart, Flag,
  Command,
} from 'lucide-react';
import { facilities } from '../data/entities/facilities';
import { residents } from '../data/entities/residents';
import { staff } from '../data/entities/staff';
import { agentRegistry } from '../data/agents/agentRegistry';

/* ─── Icon lookup for agents ─── */
const ICON_MAP = {
  HeartPulse, Pill, Dumbbell, Bug, Apple, Heart, FileText, ClipboardCheck,
  ShieldCheck, Eye, DollarSign, CreditCard, Handshake, Calculator, Receipt,
  FileWarning, Calendar, Banknote, Vault, PieChart, Users, UserPlus,
  ClipboardList, CalendarClock, BadgeCheck, GraduationCap, UserCog, Gift,
  HardHat, TrendingDown, Building2, Package, Wrench, Sparkles, Flame, Truck,
  Monitor, BedDouble, Phone, Percent, Megaphone, Award, ShieldAlert,
  MessageSquare, Target, Scale, FileSignature, Gavel, FileCheck, Home,
  Building, Globe, Landmark, LineChart, Flag, Stethoscope, Bot, LayoutDashboard,
  BarChart3, AlertTriangle, Activity, Coffee, Shield, Settings,
};

/* ─── Page definitions for search (matches NAV_SECTIONS in Layout) ─── */
const PAGES = [
  { path: '/', label: 'Command Center', icon: LayoutDashboard, section: 'Platform' },
  { path: '/dashboard', label: 'Executive Dashboard', icon: BarChart3, section: 'Platform' },
  { path: '/exceptions', label: 'Exception Queue', icon: AlertTriangle, section: 'Platform' },
  { path: '/agents', label: 'Agent Operations', icon: Activity, section: 'Platform' },
  { path: '/briefing', label: 'Morning Briefing', icon: Coffee, section: 'Platform' },
  { path: '/audit', label: 'Audit Trail', icon: Shield, section: 'Platform' },
  { path: '/settings', label: 'Settings', icon: Settings, section: 'Platform' },
  { path: '/clinical', label: 'Clinical Command', icon: Stethoscope, section: 'Clinical' },
  { path: '/clinical/pharmacy', label: 'Pharmacy', icon: Pill, section: 'Clinical' },
  { path: '/clinical/therapy', label: 'Therapy & Rehab', icon: Dumbbell, section: 'Clinical' },
  { path: '/clinical/infection-control', label: 'Infection Control', icon: Bug, section: 'Clinical' },
  { path: '/clinical/dietary', label: 'Dietary & Nutrition', icon: Apple, section: 'Clinical' },
  { path: '/clinical/social-services', label: 'Social Services', icon: Heart, section: 'Clinical' },
  { path: '/clinical/medical-records', label: 'Medical Records', icon: FileText, section: 'Clinical' },
  { path: '/survey', label: 'Survey Readiness', icon: ClipboardCheck, section: 'Clinical' },
  { path: '/compliance', label: 'Compliance', icon: ShieldCheck, section: 'Clinical' },
  { path: '/audits', label: 'Audit Library', icon: Eye, section: 'Clinical' },
  { path: '/revenue', label: 'Revenue Command', icon: DollarSign, section: 'Revenue Cycle' },
  { path: '/revenue/billing', label: 'Billing & Claims', icon: FileText, section: 'Revenue Cycle' },
  { path: '/revenue/ar', label: 'AR Management', icon: CreditCard, section: 'Revenue Cycle' },
  { path: '/revenue/managed-care', label: 'Managed Care', icon: Handshake, section: 'Revenue Cycle' },
  { path: '/revenue/pdpm', label: 'PDPM Optimization', icon: Calculator, section: 'Revenue Cycle' },
  { path: '/ap', label: 'AP Operations', icon: Receipt, section: 'Revenue Cycle' },
  { path: '/invoice-exceptions', label: 'Invoice Exceptions', icon: FileWarning, section: 'Revenue Cycle' },
  { path: '/close', label: 'Monthly Close', icon: Calendar, section: 'Revenue Cycle' },
  { path: '/payroll', label: 'Payroll', icon: Banknote, section: 'Revenue Cycle' },
  { path: '/revenue/treasury', label: 'Treasury & Cash', icon: Vault, section: 'Revenue Cycle' },
  { path: '/revenue/budget', label: 'Budget & Forecast', icon: PieChart, section: 'Revenue Cycle' },
  { path: '/workforce', label: 'Workforce Command', icon: Users, section: 'Workforce' },
  { path: '/workforce/recruiting', label: 'Recruiting', icon: UserPlus, section: 'Workforce' },
  { path: '/workforce/onboarding', label: 'Onboarding', icon: ClipboardList, section: 'Workforce' },
  { path: '/workforce/scheduling', label: 'Scheduling', icon: CalendarClock, section: 'Workforce' },
  { path: '/workforce/credentialing', label: 'Credentialing', icon: BadgeCheck, section: 'Workforce' },
  { path: '/workforce/training', label: 'Training', icon: GraduationCap, section: 'Workforce' },
  { path: '/workforce/employee-relations', label: 'Employee Relations', icon: UserCog, section: 'Workforce' },
  { path: '/workforce/benefits', label: 'Benefits', icon: Gift, section: 'Workforce' },
  { path: '/workforce/workers-comp', label: 'Workers Comp', icon: HardHat, section: 'Workforce' },
  { path: '/workforce/retention', label: 'Retention', icon: TrendingDown, section: 'Workforce' },
  { path: '/facility', label: 'Facility Command', icon: Building2, section: 'Operations' },
  { path: '/operations/supply-chain', label: 'Supply Chain', icon: Package, section: 'Operations' },
  { path: '/operations/maintenance', label: 'Maintenance', icon: Wrench, section: 'Operations' },
  { path: '/operations/environmental', label: 'Environmental', icon: Sparkles, section: 'Operations' },
  { path: '/operations/life-safety', label: 'Life Safety', icon: Flame, section: 'Operations' },
  { path: '/operations/transportation', label: 'Transportation', icon: Truck, section: 'Operations' },
  { path: '/operations/it', label: 'IT Service Desk', icon: Monitor, section: 'Operations' },
  { path: '/admissions', label: 'Census Command', icon: BedDouble, section: 'Admissions' },
  { path: '/admissions/referrals', label: 'Referrals', icon: Phone, section: 'Admissions' },
  { path: '/admissions/pre-admission', label: 'Pre-Admission', icon: ClipboardCheck, section: 'Admissions' },
  { path: '/admissions/payer-mix', label: 'Payer Mix', icon: Percent, section: 'Admissions' },
  { path: '/admissions/marketing', label: 'Marketing & BD', icon: Megaphone, section: 'Admissions' },
  { path: '/quality', label: 'Quality Command', icon: Award, section: 'Quality' },
  { path: '/quality/risk', label: 'Risk Management', icon: ShieldAlert, section: 'Quality' },
  { path: '/quality/patient-safety', label: 'Patient Safety', icon: HeartPulse, section: 'Quality' },
  { path: '/quality/grievances', label: 'Grievances', icon: MessageSquare, section: 'Quality' },
  { path: '/quality/outcomes', label: 'Outcomes', icon: Target, section: 'Quality' },
  { path: '/legal', label: 'Legal Command', icon: Scale, section: 'Legal' },
  { path: '/legal/contracts', label: 'Contracts', icon: FileSignature, section: 'Legal' },
  { path: '/legal/litigation', label: 'Litigation', icon: Gavel, section: 'Legal' },
  { path: '/legal/regulatory', label: 'Regulatory', icon: FileCheck, section: 'Legal' },
  { path: '/legal/real-estate', label: 'Real Estate', icon: Home, section: 'Legal' },
  { path: '/legal/corporate-compliance', label: 'Corporate Compliance', icon: ShieldCheck, section: 'Legal' },
  { path: '/ma', label: 'M&A Pipeline', icon: Building, section: 'Strategic' },
  { path: '/strategic/market-intel', label: 'Market Intel', icon: Globe, section: 'Strategic' },
  { path: '/strategic/board', label: 'Board Governance', icon: Landmark, section: 'Strategic' },
  { path: '/strategic/investor-relations', label: 'Investor Relations', icon: LineChart, section: 'Strategic' },
  { path: '/strategic/government-affairs', label: 'Government Affairs', icon: Flag, section: 'Strategic' },
];

const MAX_PER_CATEGORY = 5;

/* ─── Search helpers ─── */
function matchesQuery(text, query) {
  return text.toLowerCase().includes(query.toLowerCase());
}

function searchFacilities(query) {
  return facilities
    .filter(f => matchesQuery(f.name, query) || matchesQuery(f.city, query) || matchesQuery(f.state, query))
    .slice(0, MAX_PER_CATEGORY)
    .map(f => ({
      id: `facility-${f.id}`,
      category: 'Facilities',
      icon: Building2,
      name: f.name,
      subtitle: `${f.city}, ${f.state} — ${f.beds} beds, ${f.occupancy}% occ`,
      path: '/facility',
      data: f,
    }));
}

function searchResidents(query) {
  return residents
    .filter(r => matchesQuery(`${r.firstName} ${r.lastName}`, query) || matchesQuery(r.room, query))
    .slice(0, MAX_PER_CATEGORY)
    .map(r => {
      const fac = facilities.find(f => f.id === r.facilityId);
      return {
        id: `resident-${r.id}`,
        category: 'Residents',
        icon: User,
        name: `${r.firstName} ${r.lastName}`,
        subtitle: `Room ${r.room} — ${fac?.name || 'Unknown facility'} — ${r.payerType}`,
        path: '/clinical',
        data: r,
      };
    });
}

function searchStaff(query) {
  return staff
    .filter(s => matchesQuery(`${s.firstName} ${s.lastName}`, query) || matchesQuery(s.role, query))
    .slice(0, MAX_PER_CATEGORY)
    .map(s => {
      const fac = facilities.find(f => f.id === s.facilityId);
      return {
        id: `staff-${s.id}`,
        category: 'Staff',
        icon: Users,
        name: `${s.firstName} ${s.lastName}`,
        subtitle: `${s.role} — ${fac?.name || 'Unknown facility'}`,
        path: '/workforce',
        data: s,
      };
    });
}

function searchAgents(query) {
  return agentRegistry
    .filter(a => matchesQuery(a.displayName, query) || matchesQuery(a.domain, query))
    .slice(0, MAX_PER_CATEGORY)
    .map(a => ({
      id: `agent-${a.id}`,
      category: 'Agents',
      icon: ICON_MAP[a.icon] || Bot,
      name: a.displayName,
      subtitle: `${a.domain} — ${a.status === 'active' ? 'Active' : 'Inactive'} — ${a.actionsToday} actions today`,
      path: '/agents',
      data: a,
    }));
}

function searchPages(query) {
  return PAGES
    .filter(p => matchesQuery(p.label, query) || matchesQuery(p.section, query))
    .slice(0, MAX_PER_CATEGORY)
    .map(p => ({
      id: `page-${p.path}`,
      category: 'Pages',
      icon: p.icon,
      name: p.label,
      subtitle: p.section,
      path: p.path,
    }));
}

/* ─── Category Badge ─── */
const CATEGORY_COLORS = {
  Facilities: 'bg-blue-50 text-blue-600',
  Residents: 'bg-emerald-50 text-emerald-600',
  Staff: 'bg-amber-50 text-amber-600',
  Agents: 'bg-purple-50 text-purple-600',
  Pages: 'bg-gray-100 text-gray-600',
};

/* ─── GlobalSearch Component ─── */
export default function GlobalSearch({ isOpen, onClose }) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [recentSearches, setRecentSearches] = useState([]);
  const inputRef = useRef(null);
  const listRef = useRef(null);
  const navigate = useNavigate();

  // Compute results
  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.trim();
    return [
      ...searchPages(q),
      ...searchFacilities(q),
      ...searchResidents(q),
      ...searchStaff(q),
      ...searchAgents(q),
    ];
  }, [query]);

  // Group results by category
  const groupedResults = useMemo(() => {
    const groups = {};
    results.forEach(r => {
      if (!groups[r.category]) groups[r.category] = [];
      groups[r.category].push(r);
    });
    return groups;
  }, [results]);

  const flatResults = results;

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      // Delay focus to ensure the input is rendered
      requestAnimationFrame(() => {
        inputRef.current?.focus();
      });
    }
  }, [isOpen]);

  // Scroll selected item into view
  useEffect(() => {
    if (!listRef.current) return;
    const selected = listRef.current.querySelector('[data-selected="true"]');
    if (selected) {
      selected.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  const handleSelect = useCallback((result) => {
    // Track recent search
    setRecentSearches(prev => {
      const filtered = prev.filter(r => r.id !== result.id);
      return [result, ...filtered].slice(0, 5);
    });
    navigate(result.path);
    onClose();
  }, [navigate, onClose]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, flatResults.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (flatResults[selectedIndex]) {
        handleSelect(flatResults[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  }, [flatResults, selectedIndex, handleSelect, onClose]);

  // Reset selection when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  if (!isOpen) return null;

  let globalIndex = -1;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]" onClick={onClose}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />

      {/* Search panel */}
      <div
        className="relative w-full max-w-2xl mx-4 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
          <Search size={18} className="text-gray-400 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search facilities, residents, staff, agents, pages..."
            className="flex-1 text-base text-gray-900 placeholder-gray-400 outline-none bg-transparent"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <X size={16} className="text-gray-400" />
            </button>
          )}
          <button
            onClick={onClose}
            className="text-[11px] font-medium text-gray-400 bg-gray-100 px-2 py-1 rounded-md"
          >
            ESC
          </button>
        </div>

        {/* Results area */}
        <div ref={listRef} className="max-h-[50vh] overflow-y-auto scrollbar-thin">
          {query.trim() === '' ? (
            /* Empty state / Recent searches */
            <div className="p-6">
              {recentSearches.length > 0 ? (
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3">Recent</p>
                  <div className="space-y-1">
                    {recentSearches.map((r) => {
                      const Icon = r.icon;
                      return (
                        <button
                          key={r.id}
                          onClick={() => handleSelect(r)}
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 transition-colors text-left"
                        >
                          <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                            <Icon size={16} className="text-gray-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{r.name}</p>
                            <p className="text-[11px] text-gray-400 truncate">{r.subtitle}</p>
                          </div>
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${CATEGORY_COLORS[r.category] || 'bg-gray-100 text-gray-500'}`}>
                            {r.category}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <Search size={32} className="mx-auto text-gray-200 mb-3" />
                  <p className="text-sm text-gray-400">Start typing to search across the platform...</p>
                </div>
              )}
            </div>
          ) : flatResults.length === 0 ? (
            /* No results */
            <div className="p-6 text-center">
              <Search size={32} className="mx-auto text-gray-200 mb-3" />
              <p className="text-sm text-gray-500">No results for &ldquo;{query}&rdquo;</p>
              <p className="text-xs text-gray-400 mt-1">Try a different search term</p>
            </div>
          ) : (
            /* Grouped results */
            <div className="py-2">
              {Object.entries(groupedResults).map(([category, items]) => (
                <div key={category}>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-5 pt-3 pb-1.5">
                    {category}
                  </p>
                  {items.map((result) => {
                    globalIndex++;
                    const isSelected = globalIndex === selectedIndex;
                    const Icon = result.icon;
                    const currentIdx = globalIndex;

                    return (
                      <button
                        key={result.id}
                        data-selected={isSelected}
                        onClick={() => handleSelect(result)}
                        onMouseEnter={() => setSelectedIndex(currentIdx)}
                        className={`w-full flex items-center gap-3 px-5 py-2.5 transition-colors text-left ${
                          isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          isSelected ? 'bg-blue-100' : 'bg-gray-100'
                        }`}>
                          <Icon size={16} className={isSelected ? 'text-blue-600' : 'text-gray-500'} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium truncate ${isSelected ? 'text-blue-700' : 'text-gray-900'}`}>
                            {result.name}
                          </p>
                          <p className="text-[11px] text-gray-400 truncate">{result.subtitle}</p>
                        </div>
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold flex-shrink-0 ${CATEGORY_COLORS[category]}`}>
                          {category}
                        </span>
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer hint */}
        {flatResults.length > 0 && (
          <div className="px-5 py-2.5 border-t border-gray-100 bg-gray-50/50">
            <p className="text-[11px] text-gray-400 text-center">
              <span className="inline-flex items-center gap-1"><kbd className="px-1.5 py-0.5 rounded bg-gray-200 text-gray-500 font-mono text-[10px]">&uarr;&darr;</kbd> to navigate</span>
              <span className="mx-2">&middot;</span>
              <span className="inline-flex items-center gap-1"><kbd className="px-1.5 py-0.5 rounded bg-gray-200 text-gray-500 font-mono text-[10px]">Enter</kbd> to select</span>
              <span className="mx-2">&middot;</span>
              <span className="inline-flex items-center gap-1"><kbd className="px-1.5 py-0.5 rounded bg-gray-200 text-gray-500 font-mono text-[10px]">Esc</kbd> to close</span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Hook: global Cmd+K listener ─── */
export function useGlobalSearchShortcut(setOpen) {
  useEffect(() => {
    function handleKeyDown(e) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(prev => !prev);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setOpen]);
}
