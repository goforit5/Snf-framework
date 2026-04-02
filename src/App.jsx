import { lazy, Suspense } from 'react';
import { HashRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { ModalProvider } from './components/Widgets';
import { AuthProvider } from './providers/AuthProvider';
import { ScopeProvider } from './providers/ScopeProvider';
import { AgentProvider } from './providers/AgentProvider';
import { NotificationProvider } from './providers/NotificationProvider';
import { ToastProvider, PageSkeleton } from './components/FeedbackComponents';
import { useDarkMode, DarkModeContext } from './hooks/useDarkMode';
import Layout from './components/Layout';
const ComingSoon = lazy(() => import('./pages/ComingSoon'));

/* ─── Presentation (renders outside Layout) ─── */
const Presentation = lazy(() => import('./pages/Presentation'));

/* ─── Platform (existing pages) ─── */
const CommandCenter = lazy(() => import('./pages/CommandCenter'));
const ExecutiveDashboard = lazy(() => import('./pages/ExecutiveDashboard'));
const ExceptionQueue = lazy(() => import('./pages/ExceptionQueue'));
const AgentOperations = lazy(() => import('./pages/AgentWorkLedger'));
const MorningBriefing = lazy(() => import('./pages/MorningStandup'));
const AuditTrail = lazy(() => import('./pages/AuditTrail'));
const SettingsPage = lazy(() => import('./pages/platform/Settings'));

/* ─── Clinical ─── */
const ClinicalCommand = lazy(() => import('./pages/ClinicalCommand'));
const SurveyReadiness = lazy(() => import('./pages/SurveyReadiness'));
const ClinicalCompliance = lazy(() => import('./pages/ClinicalCompliance'));

/* ─── Survey ─── */
const SurveyCommand = lazy(() => import('./pages/survey/SurveyCommand'));
const SurveyRequests = lazy(() => import('./pages/survey/SurveyRequests'));
const SurveySampling = lazy(() => import('./pages/survey/SurveySampling'));
const SurveyFindings = lazy(() => import('./pages/survey/SurveyFindings'));
const SurveyPostSurvey = lazy(() => import('./pages/survey/SurveyPostSurvey'));
const AuditLibrary = lazy(() => import('./pages/AuditLibrary'));
const PharmacyManagement = lazy(() => import('./pages/clinical/PharmacyManagement'));
const TherapyRehab = lazy(() => import('./pages/clinical/TherapyRehab'));
const InfectionControl = lazy(() => import('./pages/clinical/InfectionControl'));
const DietaryNutrition = lazy(() => import('./pages/clinical/DietaryNutrition'));
const SocialServices = lazy(() => import('./pages/clinical/SocialServices'));
const MedicalRecords = lazy(() => import('./pages/clinical/MedicalRecords'));

/* ─── Revenue Cycle ─── */
const RevenueCycleCommand = lazy(() => import('./pages/revenue/RevenueCycleCommand'));
const FinanceCommand = lazy(() => import('./pages/FinanceCommand'));
const APOperations = lazy(() => import('./pages/APOperations'));
const InvoiceExceptions = lazy(() => import('./pages/InvoiceExceptions'));
const MonthlyClose = lazy(() => import('./pages/MonthlyClose'));
const PayrollCommand = lazy(() => import('./pages/PayrollCommand'));
const BillingClaims = lazy(() => import('./pages/revenue/BillingClaims'));
const ARManagement = lazy(() => import('./pages/revenue/ARManagement'));
const ManagedCareContracts = lazy(() => import('./pages/revenue/ManagedCareContracts'));
const PDPMOptimization = lazy(() => import('./pages/revenue/PDPMOptimization'));
const TreasuryCashFlow = lazy(() => import('./pages/revenue/TreasuryCashFlow'));
const BudgetForecasting = lazy(() => import('./pages/revenue/BudgetForecasting'));

/* ─── Workforce ─── */
const WorkforceCommand = lazy(() => import('./pages/workforce/WorkforceCommand'));
const RecruitingPipeline = lazy(() => import('./pages/workforce/RecruitingPipeline'));
const OnboardingCenter = lazy(() => import('./pages/workforce/OnboardingCenter'));
const SchedulingStaffing = lazy(() => import('./pages/workforce/SchedulingStaffing'));
const Credentialing = lazy(() => import('./pages/workforce/Credentialing'));
const TrainingEducation = lazy(() => import('./pages/workforce/TrainingEducation'));
const EmployeeRelations = lazy(() => import('./pages/workforce/EmployeeRelations'));
const BenefitsAdmin = lazy(() => import('./pages/workforce/BenefitsAdmin'));
const WorkersComp = lazy(() => import('./pages/workforce/WorkersComp'));
const RetentionAnalytics = lazy(() => import('./pages/workforce/RetentionAnalytics'));

/* ─── Operations ─── */
const FacilityCommand = lazy(() => import('./pages/operations/FacilityCommand'));
const SupplyChain = lazy(() => import('./pages/operations/SupplyChain'));
const MaintenanceWorkOrders = lazy(() => import('./pages/operations/MaintenanceWorkOrders'));
const EnvironmentalServices = lazy(() => import('./pages/operations/EnvironmentalServices'));
const LifeSafety = lazy(() => import('./pages/operations/LifeSafety'));
const Transportation = lazy(() => import('./pages/operations/Transportation'));
const ITServiceDesk = lazy(() => import('./pages/operations/ITServiceDesk'));

/* ─── Admissions ─── */
const CensusCommand = lazy(() => import('./pages/admissions/CensusCommand'));
const ReferralManagement = lazy(() => import('./pages/admissions/ReferralManagement'));
const PreAdmissionScreening = lazy(() => import('./pages/admissions/PreAdmissionScreening'));
const PayerMixOptimization = lazy(() => import('./pages/admissions/PayerMixOptimization'));
const MarketingBD = lazy(() => import('./pages/admissions/MarketingBD'));

/* ─── Quality ─── */
const QualityCommand = lazy(() => import('./pages/quality/QualityCommand'));
const RiskManagement = lazy(() => import('./pages/quality/RiskManagement'));
const PatientSafety = lazy(() => import('./pages/quality/PatientSafety'));
const GrievancesComplaints = lazy(() => import('./pages/quality/GrievancesComplaints'));
const OutcomesTracking = lazy(() => import('./pages/quality/OutcomesTracking'));

/* ─── Legal ─── */
const LegalCommand = lazy(() => import('./pages/legal/LegalCommand'));
const ContractLifecycle = lazy(() => import('./pages/legal/ContractLifecycle'));
const LitigationTracker = lazy(() => import('./pages/legal/LitigationTracker'));
const RegulatoryResponse = lazy(() => import('./pages/legal/RegulatoryResponse'));
const RealEstateLeases = lazy(() => import('./pages/legal/RealEstateLeases'));
const CorporateCompliance = lazy(() => import('./pages/legal/CorporateCompliance'));

/* ─── Strategic ─── */
const MAPipeline = lazy(() => import('./pages/MAPipeline'));
const MarketIntelligence = lazy(() => import('./pages/strategic/MarketIntelligence'));
const BoardGovernance = lazy(() => import('./pages/strategic/BoardGovernance'));
const InvestorRelations = lazy(() => import('./pages/strategic/InvestorRelations'));
const GovernmentAffairs = lazy(() => import('./pages/strategic/GovernmentAffairs'));

/* ─── Demo ─── */
const StrategicFrameworks = lazy(() => import('./pages/strategic/StrategicFrameworks'));
const EnsignAIReadiness = lazy(() => import('./pages/demo/EnsignAIReadiness'));
const AILandscape = lazy(() => import('./pages/demo/AILandscape'));

function AppRoutes() {
  const location = useLocation();
  const isPresentation = location.pathname === '/presentation';

  if (isPresentation) {
    return (
      <iframe
        src={`${import.meta.env.BASE_URL}presentation.html`}
        title="Presentation"
        className="w-screen h-screen border-0"
        style={{ position: 'fixed', inset: 0, zIndex: 9999 }}
      />
    );
  }

  return (
    <Layout>
      <Suspense fallback={<PageSkeleton />}>
        <Routes>
          {/* Platform */}
          <Route path="/" element={<CommandCenter />} />
                        <Route path="/dashboard" element={<ExecutiveDashboard />} />
                        <Route path="/exceptions" element={<ExceptionQueue />} />
                        <Route path="/agents" element={<AgentOperations />} />
                        <Route path="/briefing" element={<MorningBriefing />} />
                        <Route path="/audit" element={<AuditTrail />} />
                        <Route path="/settings" element={<SettingsPage />} />

                        {/* Backward compat */}
                        <Route path="/standup" element={<MorningBriefing />} />
                        <Route path="/finance" element={<FinanceCommand />} />

                        {/* Clinical */}
                        <Route path="/clinical" element={<ClinicalCommand />} />
                        <Route path="/clinical/pharmacy" element={<PharmacyManagement />} />
                        <Route path="/clinical/therapy" element={<TherapyRehab />} />
                        <Route path="/clinical/infection-control" element={<InfectionControl />} />
                        <Route path="/clinical/dietary" element={<DietaryNutrition />} />
                        <Route path="/clinical/social-services" element={<SocialServices />} />
                        <Route path="/clinical/medical-records" element={<MedicalRecords />} />
                        <Route path="/survey/readiness" element={<SurveyReadiness />} />
                        <Route path="/survey" element={<SurveyReadiness />} />
                        <Route path="/compliance" element={<ClinicalCompliance />} />

                        {/* Survey */}
                        <Route path="/survey/command" element={<SurveyCommand />} />
                        <Route path="/survey/requests" element={<SurveyRequests />} />
                        <Route path="/survey/sampling" element={<SurveySampling />} />
                        <Route path="/survey/findings" element={<SurveyFindings />} />
                        <Route path="/survey/post-survey" element={<SurveyPostSurvey />} />
                        <Route path="/audits" element={<AuditLibrary />} />

                        {/* Revenue Cycle */}
                        <Route path="/revenue" element={<RevenueCycleCommand />} />
                        <Route path="/revenue/billing" element={<BillingClaims />} />
                        <Route path="/revenue/ar" element={<ARManagement />} />
                        <Route path="/revenue/managed-care" element={<ManagedCareContracts />} />
                        <Route path="/revenue/pdpm" element={<PDPMOptimization />} />
                        <Route path="/ap" element={<APOperations />} />
                        <Route path="/invoice-exceptions" element={<InvoiceExceptions />} />
                        <Route path="/close" element={<MonthlyClose />} />
                        <Route path="/payroll" element={<PayrollCommand />} />
                        <Route path="/revenue/treasury" element={<TreasuryCashFlow />} />
                        <Route path="/revenue/budget" element={<BudgetForecasting />} />

                        {/* Workforce */}
                        <Route path="/workforce" element={<WorkforceCommand />} />
                        <Route path="/workforce/recruiting" element={<RecruitingPipeline />} />
                        <Route path="/workforce/onboarding" element={<OnboardingCenter />} />
                        <Route path="/workforce/scheduling" element={<SchedulingStaffing />} />
                        <Route path="/workforce/credentialing" element={<Credentialing />} />
                        <Route path="/workforce/training" element={<TrainingEducation />} />
                        <Route path="/workforce/employee-relations" element={<EmployeeRelations />} />
                        <Route path="/workforce/benefits" element={<BenefitsAdmin />} />
                        <Route path="/workforce/workers-comp" element={<WorkersComp />} />
                        <Route path="/workforce/retention" element={<RetentionAnalytics />} />

                        {/* Operations */}
                        <Route path="/facility" element={<FacilityCommand />} />
                        <Route path="/operations/supply-chain" element={<SupplyChain />} />
                        <Route path="/operations/maintenance" element={<MaintenanceWorkOrders />} />
                        <Route path="/operations/environmental" element={<EnvironmentalServices />} />
                        <Route path="/operations/life-safety" element={<LifeSafety />} />
                        <Route path="/operations/transportation" element={<Transportation />} />
                        <Route path="/operations/it" element={<ITServiceDesk />} />

                        {/* Admissions */}
                        <Route path="/admissions" element={<CensusCommand />} />
                        <Route path="/admissions/referrals" element={<ReferralManagement />} />
                        <Route path="/admissions/pre-admission" element={<PreAdmissionScreening />} />
                        <Route path="/admissions/payer-mix" element={<PayerMixOptimization />} />
                        <Route path="/admissions/marketing" element={<MarketingBD />} />

                        {/* Quality */}
                        <Route path="/quality" element={<QualityCommand />} />
                        <Route path="/quality/risk" element={<RiskManagement />} />
                        <Route path="/quality/patient-safety" element={<PatientSafety />} />
                        <Route path="/quality/grievances" element={<GrievancesComplaints />} />
                        <Route path="/quality/outcomes" element={<OutcomesTracking />} />

                        {/* Legal */}
                        <Route path="/legal" element={<LegalCommand />} />
                        <Route path="/legal/contracts" element={<ContractLifecycle />} />
                        <Route path="/legal/litigation" element={<LitigationTracker />} />
                        <Route path="/legal/regulatory" element={<RegulatoryResponse />} />
                        <Route path="/legal/real-estate" element={<RealEstateLeases />} />
                        <Route path="/legal/corporate-compliance" element={<CorporateCompliance />} />

                        {/* Strategic */}
                        <Route path="/ma" element={<MAPipeline />} />
                        <Route path="/strategic/market-intel" element={<MarketIntelligence />} />
                        <Route path="/strategic/board" element={<BoardGovernance />} />
                        <Route path="/strategic/investor-relations" element={<InvestorRelations />} />
                        <Route path="/strategic/government-affairs" element={<GovernmentAffairs />} />

                        {/* Demo */}
                        <Route path="/demo/frameworks" element={<StrategicFrameworks />} />
                        <Route path="/demo/ai-readiness" element={<EnsignAIReadiness />} />
                        <Route path="/demo/ai-landscape" element={<AILandscape />} />

                        {/* Backward compat */}
                        <Route path="/strategic/frameworks" element={<StrategicFrameworks />} />
        </Routes>
      </Suspense>
    </Layout>
  );
}

export default function App() {
  const darkMode = useDarkMode();

  return (
    <DarkModeContext.Provider value={darkMode}>
      <Router>
        <AuthProvider>
          <ScopeProvider>
            <AgentProvider>
              <NotificationProvider>
                <ModalProvider>
                  <ToastProvider>
                    <AppRoutes />
                  </ToastProvider>
                </ModalProvider>
              </NotificationProvider>
            </AgentProvider>
          </ScopeProvider>
        </AuthProvider>
      </Router>
    </DarkModeContext.Provider>
  );
}
