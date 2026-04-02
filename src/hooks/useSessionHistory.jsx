import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { useLocation } from 'react-router-dom';

const SessionHistoryContext = createContext(null);

// Map routes to friendly page names
const ROUTE_NAMES = {
  '/': 'Command Center',
  '/dashboard': 'Executive Dashboard',
  '/exceptions': 'Exception Queue',
  '/agents': 'Agent Operations',
  '/briefing': 'Morning Briefing',
  '/audit': 'Audit Trail',
  '/settings': 'Settings',
  '/clinical': 'Clinical Command',
  '/clinical/pharmacy': 'Pharmacy',
  '/clinical/therapy': 'Therapy & Rehab',
  '/clinical/infection-control': 'Infection Control',
  '/clinical/dietary': 'Dietary & Nutrition',
  '/clinical/social-services': 'Social Services',
  '/clinical/medical-records': 'Medical Records',
  '/survey': 'Survey Readiness',
  '/compliance': 'Compliance',
  '/audits': 'Audit Library',
  '/revenue': 'Revenue Command',
  '/revenue/billing': 'Billing & Claims',
  '/revenue/ar': 'AR Management',
  '/revenue/managed-care': 'Managed Care',
  '/revenue/pdpm': 'PDPM Optimization',
  '/ap': 'AP Operations',
  '/invoice-exceptions': 'Invoice Exceptions',
  '/close': 'Monthly Close',
  '/payroll': 'Payroll',
  '/revenue/treasury': 'Treasury & Cash',
  '/revenue/budget': 'Budget & Forecast',
  '/workforce': 'Workforce Command',
  '/workforce/recruiting': 'Recruiting',
  '/workforce/onboarding': 'Onboarding',
  '/workforce/scheduling': 'Scheduling',
  '/workforce/credentialing': 'Credentialing',
  '/workforce/training': 'Training',
  '/workforce/employee-relations': 'Employee Relations',
  '/workforce/benefits': 'Benefits',
  '/workforce/workers-comp': 'Workers Comp',
  '/workforce/retention': 'Retention',
  '/facility': 'Facility Command',
  '/operations/supply-chain': 'Supply Chain',
  '/operations/maintenance': 'Maintenance',
  '/operations/environmental': 'Environmental',
  '/operations/life-safety': 'Life Safety',
  '/operations/transportation': 'Transportation',
  '/operations/it': 'IT Service Desk',
  '/admissions': 'Census Command',
  '/admissions/referrals': 'Referrals',
  '/admissions/pre-admission': 'Pre-Admission',
  '/admissions/payer-mix': 'Payer Mix',
  '/admissions/marketing': 'Marketing & BD',
  '/quality': 'Quality Command',
  '/quality/risk': 'Risk Management',
  '/quality/patient-safety': 'Patient Safety',
  '/quality/grievances': 'Grievances',
  '/quality/outcomes': 'Outcomes',
  '/legal': 'Legal Command',
  '/legal/contracts': 'Contracts',
  '/legal/litigation': 'Litigation',
  '/legal/regulatory': 'Regulatory',
  '/legal/real-estate': 'Real Estate',
  '/legal/corporate-compliance': 'Corporate Compliance',
  '/ma': 'M&A Pipeline',
  '/strategic/market-intel': 'Market Intel',
  '/strategic/board': 'Board Governance',
  '/strategic/investor-relations': 'Investor Relations',
  '/strategic/government-affairs': 'Government Affairs',
};

export function getPageName(pathname) {
  return ROUTE_NAMES[pathname] || 'Unknown Page';
}

export function SessionHistoryProvider({ children }) {
  const location = useLocation();
  const [history, setHistory] = useState([]);

  useEffect(() => {
    setHistory(prev => {
      const entry = {
        route: location.pathname,
        pageName: getPageName(location.pathname),
        timestamp: new Date().toISOString(),
      };
      const next = [entry, ...prev];
      return next.slice(0, 20);
    });
  }, [location.pathname]);

  const getSessionContext = useCallback(() => ({
    currentRoute: location.pathname,
    currentPage: getPageName(location.pathname),
    recentHistory: history.slice(0, 10),
    sessionStart: history.length > 0 ? history[history.length - 1].timestamp : new Date().toISOString(),
  }), [location.pathname, history]);

  return (
    <SessionHistoryContext.Provider value={{ history, getSessionContext }}>
      {children}
    </SessionHistoryContext.Provider>
  );
}

export function useSessionHistory() {
  const ctx = useContext(SessionHistoryContext);
  if (!ctx) throw new Error('useSessionHistory must be used within SessionHistoryProvider');
  return ctx;
}
