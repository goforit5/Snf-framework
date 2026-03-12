import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { ModalProvider } from './components/Widgets';
import Layout from './components/Layout';
import CommandCenter from './pages/CommandCenter';
import ExceptionQueue from './pages/ExceptionQueue';
import AgentWorkLedger from './pages/AgentWorkLedger';
import ExecutiveDashboard from './pages/ExecutiveDashboard';
import FacilityAdmin from './pages/FacilityAdmin';
import MorningStandup from './pages/MorningStandup';
import ClinicalCommand from './pages/ClinicalCommand';
import SurveyReadiness from './pages/SurveyReadiness';
import APOperations from './pages/APOperations';
import InvoiceExceptions from './pages/InvoiceExceptions';
import PayrollCommand from './pages/PayrollCommand';
import FinanceCommand from './pages/FinanceCommand';
import MonthlyClose from './pages/MonthlyClose';
import MAPipeline from './pages/MAPipeline';
import AuditTrail from './pages/AuditTrail';
import ClinicalCompliance from './pages/ClinicalCompliance';
import AuditLibrary from './pages/AuditLibrary';

export default function App() {
  return (
    <Router>
      <ModalProvider>
        <Layout>
          <Routes>
            <Route path="/" element={<CommandCenter />} />
            <Route path="/dashboard" element={<ExecutiveDashboard />} />
            <Route path="/exceptions" element={<ExceptionQueue />} />
            <Route path="/agents" element={<AgentWorkLedger />} />
            <Route path="/facility" element={<FacilityAdmin />} />
            <Route path="/standup" element={<MorningStandup />} />
            <Route path="/clinical" element={<ClinicalCommand />} />
            <Route path="/survey" element={<SurveyReadiness />} />
            <Route path="/ap" element={<APOperations />} />
            <Route path="/invoice-exceptions" element={<InvoiceExceptions />} />
            <Route path="/payroll" element={<PayrollCommand />} />
            <Route path="/finance" element={<FinanceCommand />} />
            <Route path="/close" element={<MonthlyClose />} />
            <Route path="/ma" element={<MAPipeline />} />
            <Route path="/audit" element={<AuditTrail />} />
            <Route path="/compliance" element={<ClinicalCompliance />} />
            <Route path="/audits" element={<AuditLibrary />} />
          </Routes>
        </Layout>
      </ModalProvider>
    </Router>
  );
}
