// Navigation definition — single source of truth for all nav sections.
// Extracted from Layout.jsx so both old Layout and new AppShell can consume it.

import {
  LayoutDashboard, BarChart3, AlertTriangle, Activity, Coffee, Shield, Settings,
  Stethoscope, Pill, Dumbbell, Bug, Apple, Heart, FileText, ClipboardCheck, ShieldCheck, Eye, HeartPulse as HeartPulseIcon, FileCheck2,
  DollarSign, CreditCard, Handshake, Calculator, Receipt, FileWarning, Calendar, Banknote, Vault, PieChart,
  Users, UserPlus, ClipboardList, CalendarClock, BadgeCheck, GraduationCap, UserCog, Gift, HardHat, TrendingDown,
  Building2, Package, Wrench, Sparkles, Flame, Truck, Monitor,
  BedDouble, Phone, Percent, Megaphone, Sparkles as SparklesIcon,
  Award, ShieldAlert, HeartPulse, MessageSquare, Target,
  Scale, FileSignature, Gavel, FileCheck, Home,
  Building, Globe, Landmark, LineChart, Flag,
  Play, Wand2, Bot, Network, BookOpen,
} from 'lucide-react';

/* ─── Navigation Sections ─── */
export const NAV_SECTIONS = [
  {
    key: 'platform',
    title: 'Platform',
    icon: LayoutDashboard,
    railIcon: LayoutDashboard,
    items: [
      { path: '/', label: 'Command Center', icon: LayoutDashboard },
      { path: '/dashboard', label: 'Executive Dashboard', icon: BarChart3 },
      { path: '/exceptions', label: 'Exception Queue', icon: AlertTriangle },
      { path: '/agents', label: 'Agent Operations', icon: Activity },
      { path: '/briefing', label: 'Morning Briefing', icon: Coffee },
      { path: '/audit', label: 'Audit Trail', icon: Shield },
      { path: '/platform/agent-builder', label: 'Agent Builder', icon: Wand2 },
      { path: '/settings', label: 'Settings', icon: Settings },
    ],
  },
  {
    key: 'clinical',
    title: 'Clinical',
    icon: Stethoscope,
    railIcon: Stethoscope,
    items: [
      { path: '/clinical', label: 'Clinical Command', icon: Stethoscope },
      { path: '/clinical/pharmacy', label: 'Pharmacy', icon: Pill },
      { path: '/clinical/therapy', label: 'Therapy & Rehab', icon: Dumbbell },
      { path: '/clinical/infection-control', label: 'Infection Control', icon: Bug },
      { path: '/clinical/dietary', label: 'Dietary & Nutrition', icon: Apple },
      { path: '/clinical/social-services', label: 'Social Services', icon: Heart },
      { path: '/clinical/medical-records', label: 'Medical Records', icon: FileText },
      { path: '/clinical/care-transitions', label: 'Care Transitions', icon: HeartPulseIcon },
      { path: '/clinical/documentation-integrity', label: 'Documentation Integrity', icon: FileCheck2 },
      { path: '/survey', label: 'Survey Readiness', icon: ClipboardCheck },
      { path: '/compliance', label: 'Compliance', icon: ShieldCheck },
      { path: '/audits', label: 'Audit Library', icon: Eye },
    ],
  },
  {
    key: 'revenue',
    title: 'Finance',
    icon: DollarSign,
    railIcon: DollarSign,
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
    railIcon: Users,
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
    railIcon: Building2,
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
    railIcon: BedDouble,
    items: [
      { path: '/admissions', label: 'Census Command', icon: BedDouble },
      { path: '/admissions/referrals', label: 'Referrals', icon: Phone },
      { path: '/admissions/pre-admission', label: 'Pre-Admission', icon: ClipboardCheck },
      { path: '/admissions/intelligence', label: 'Admissions Intelligence', icon: SparklesIcon },
      { path: '/admissions/payer-mix', label: 'Payer Mix', icon: Percent },
      { path: '/admissions/marketing', label: 'Marketing & BD', icon: Megaphone },
    ],
  },
  {
    key: 'quality',
    title: 'Quality',
    icon: Award,
    railIcon: Award,
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
    railIcon: Scale,
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
    railIcon: LineChart,
    items: [
      { path: '/ma', label: 'M&A Pipeline', icon: Building },
      { path: '/strategic/market-intel', label: 'Market Intel', icon: Globe },
      { path: '/strategic/board', label: 'Board Governance', icon: Landmark },
      { path: '/strategic/investor-relations', label: 'Investor Relations', icon: LineChart },
      { path: '/strategic/government-affairs', label: 'Government Affairs', icon: Flag },
    ],
  },
  {
    key: 'agents-collab',
    title: 'Agents',
    icon: Bot,
    railIcon: Bot,
    items: [
      { path: '/agents/directory', label: 'Agent Directory', icon: Network },
      { path: '/agents/flows', label: 'Team Chat', icon: MessageSquare },
      { path: '/agents/policies', label: 'Policy Console', icon: BookOpen },
      { path: '/agents', label: 'Agent Ledger', icon: Activity },
    ],
  },
  {
    key: 'demo',
    title: 'Demo',
    icon: Play,
    railIcon: Play,
    hidden: true, // hide from command rail
    items: [
      { path: '/presentation', label: 'Presentation', icon: Play },
      { path: '/demo/ai-landscape', label: 'AI Landscape', icon: Globe },
      { path: '/demo/frameworks', label: 'Decision Frameworks', icon: Target },
    ],
  },
];

/* ─── Role-based domain ordering for command rail ─── */
export const ROLE_DOMAIN_ORDER = {
  ceo:        ['platform', 'strategic', 'revenue', 'workforce', 'quality', 'clinical', 'operations', 'admissions', 'legal', 'agents-collab'],
  admin:      ['platform', 'workforce', 'clinical', 'operations', 'admissions', 'quality', 'revenue', 'legal', 'strategic', 'agents-collab'],
  don:        ['platform', 'clinical', 'quality', 'workforce', 'operations', 'admissions', 'legal', 'revenue', 'strategic', 'agents-collab'],
  billing:    ['platform', 'revenue', 'admissions', 'legal', 'workforce', 'operations', 'clinical', 'quality', 'strategic', 'agents-collab'],
  accounting: ['platform', 'revenue', 'workforce', 'operations', 'admissions', 'clinical', 'quality', 'legal', 'strategic', 'agents-collab'],
};

/* ─── Helpers ─── */

// Path prefixes used to match routes to domains
const PATH_PREFIX_MAP = {};
NAV_SECTIONS.forEach((sec) => {
  sec.items.forEach((item) => {
    // Map each path to its section key
    PATH_PREFIX_MAP[item.path] = sec.key;
  });
});

export function findDomainByPath(pathname) {
  // Exact match first
  if (PATH_PREFIX_MAP[pathname]) return PATH_PREFIX_MAP[pathname];
  // Prefix match (e.g., /agents/inspect/clin-mon → agents-collab)
  for (const sec of NAV_SECTIONS) {
    for (const item of sec.items) {
      if (pathname.startsWith(item.path) && item.path !== '/') return sec.key;
    }
  }
  // Home fallback
  if (pathname === '/') return 'platform';
  return null;
}

export function findSectionByKey(key) {
  return NAV_SECTIONS.find((s) => s.key === key) || null;
}

export function buildBreadcrumb(pathname) {
  for (const sec of NAV_SECTIONS) {
    for (const item of sec.items) {
      if (item.path === pathname) {
        return [sec.title, item.label];
      }
    }
  }
  return [];
}

// Flattened pages list for search
export const ALL_PAGES = NAV_SECTIONS.flatMap((sec) =>
  sec.items.map((item) => ({
    path: item.path,
    label: item.label,
    section: sec.title,
    sectionKey: sec.key,
    icon: item.icon,
  }))
);
