import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, AlertTriangle, Activity, Building2, Search,
  Stethoscope, ClipboardCheck, ShieldCheck, DollarSign, FileText,
  Receipt, Users, TrendingUp, Building, Landmark, Scale, Eye,
  Menu, X, ChevronDown, ChevronRight, Bot, BarChart3
} from 'lucide-react';

const navSections = [
  {
    title: 'Platform',
    items: [
      { path: '/', label: 'Command Center', icon: LayoutDashboard },
      { path: '/dashboard', label: 'Executive Dashboard', icon: BarChart3 },
      { path: '/exceptions', label: 'Exception Queue', icon: AlertTriangle },
      { path: '/agents', label: 'Agent Work Ledger', icon: Activity },
    ]
  },
  {
    title: 'Facility Ops',
    items: [
      { path: '/facility', label: 'Admin Dashboard', icon: Building2 },
      { path: '/standup', label: 'Morning Stand-Up', icon: Users },
    ]
  },
  {
    title: 'Clinical',
    items: [
      { path: '/clinical', label: 'Clinical Command', icon: Stethoscope },
      { path: '/survey', label: 'Survey Readiness', icon: ShieldCheck },
      { path: '/compliance', label: 'Compliance Command', icon: ClipboardCheck },
      { path: '/audits', label: 'Audit Library', icon: Eye },
    ]
  },
  {
    title: 'Back Office',
    items: [
      { path: '/ap', label: 'AP Operations', icon: Receipt },
      { path: '/invoice-exceptions', label: 'Invoice Exceptions', icon: FileText },
      { path: '/payroll', label: 'Payroll Command', icon: DollarSign },
    ]
  },
  {
    title: 'Finance',
    items: [
      { path: '/finance', label: 'Finance Command', icon: Landmark },
      { path: '/close', label: 'Monthly Close', icon: ClipboardCheck },
    ]
  },
  {
    title: 'Strategic',
    items: [
      { path: '/ma', label: 'M&A Pipeline', icon: Building },
      { path: '/audit', label: 'Audit Trail', icon: Eye },
    ]
  },
];

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [expandedSections, setExpandedSections] = useState(
    navSections.reduce((acc, s) => ({ ...acc, [s.title]: true }), {})
  );
  const location = useLocation();

  const toggleSection = (title) => {
    setExpandedSections(prev => ({ ...prev, [title]: !prev[title] }));
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#f5f5f7]">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-0'} transition-all duration-200 bg-white border-r border-gray-200 flex-shrink-0 overflow-hidden`}>
        <div className="w-64 h-full flex flex-col">
          {/* Logo */}
          <div className="p-5 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-sm">
                <Bot size={18} className="text-white" />
              </div>
              <div>
                <h1 className="text-sm font-bold text-gray-900 tracking-tight">Ensign</h1>
                <p className="text-[10px] text-gray-400 leading-tight font-medium">Agentic Framework</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-3 px-3 scrollbar-thin">
            {navSections.map((section) => (
              <div key={section.title} className="mb-1">
                <button
                  onClick={() => toggleSection(section.title)}
                  className="w-full flex items-center justify-between px-2 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider hover:text-gray-600 transition-colors"
                >
                  {section.title}
                  {expandedSections[section.title] ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                </button>
                {expandedSections[section.title] && (
                  <div className="space-y-0.5">
                    {section.items.map((item) => {
                      const isActive = location.pathname === item.path;
                      const Icon = item.icon;
                      return (
                        <Link
                          key={item.path}
                          to={item.path}
                          className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm transition-all ${
                            isActive
                              ? 'bg-blue-50 text-blue-700 font-semibold shadow-sm'
                              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                          }`}
                        >
                          <Icon size={16} className={isActive ? 'text-blue-600' : 'text-gray-400'} />
                          {item.label}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </nav>

          {/* User */}
          <div className="p-4 border-t border-gray-100">
            <div className="flex items-center gap-3 px-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-[11px] font-bold text-white shadow-sm">B</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">Barry</p>
                <p className="text-[10px] text-gray-400 font-medium">CEO, Ensign Group</p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="h-14 border-b border-gray-200 bg-white/80 backdrop-blur-xl flex items-center justify-between px-6 flex-shrink-0">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-gray-400 hover:text-gray-600 transition-colors">
              {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Ask the system anything..."
                className="bg-gray-50 border border-gray-200 rounded-xl pl-9 pr-4 py-2 text-sm text-gray-700 placeholder-gray-400 w-80 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition-all"
              />
            </div>
            <div className="flex items-center gap-2 bg-green-50 px-3 py-1.5 rounded-full border border-green-100">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              <span className="text-xs text-green-700 font-medium">7 agents active</span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-8 scrollbar-thin">
          {children}
        </main>
      </div>
    </div>
  );
}
