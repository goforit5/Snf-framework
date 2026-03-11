import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, AlertTriangle, Activity, Building2, Search,
  Stethoscope, ClipboardCheck, ShieldCheck, DollarSign, FileText,
  Receipt, Users, TrendingUp, Building, Landmark, Scale, Eye,
  Menu, X, ChevronDown, ChevronRight, Bot
} from 'lucide-react';

const navSections = [
  {
    title: 'Platform',
    items: [
      { path: '/', label: 'Command Center', icon: LayoutDashboard },
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
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-0'} transition-all duration-200 bg-gray-900 border-r border-gray-800 flex-shrink-0 overflow-hidden`}>
        <div className="w-64 h-full flex flex-col">
          <div className="p-4 border-b border-gray-800">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center">
                <Bot size={18} className="text-white" />
              </div>
              <div>
                <h1 className="text-sm font-bold text-white tracking-wide">AEOS</h1>
                <p className="text-[10px] text-gray-400 leading-tight">SNF Operating System</p>
              </div>
            </div>
          </div>
          <nav className="flex-1 overflow-y-auto py-2 px-2">
            {navSections.map((section) => (
              <div key={section.title} className="mb-1">
                <button
                  onClick={() => toggleSection(section.title)}
                  className="w-full flex items-center justify-between px-2 py-1.5 text-[10px] font-semibold text-gray-500 uppercase tracking-wider hover:text-gray-400"
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
                          className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                            isActive
                              ? 'bg-blue-600/20 text-blue-400 font-medium'
                              : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
                          }`}
                        >
                          <Icon size={16} />
                          {item.label}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </nav>
          <div className="p-3 border-t border-gray-800">
            <div className="flex items-center gap-2 px-2">
              <div className="w-6 h-6 rounded-full bg-emerald-600 flex items-center justify-center text-[10px] font-bold text-white">A</div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-gray-300 truncate">Andrew</p>
                <p className="text-[10px] text-gray-500">Owner / CEO</p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-12 border-b border-gray-800 bg-gray-900/50 backdrop-blur flex items-center justify-between px-4 flex-shrink-0">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-gray-400 hover:text-white">
            {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                placeholder="Ask the system anything..."
                className="bg-gray-800 border border-gray-700 rounded-lg pl-9 pr-4 py-1.5 text-sm text-gray-300 placeholder-gray-500 w-80 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-xs text-gray-400">7 agents active</span>
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto bg-gray-950 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
