import { Shield, ClipboardList, Clock, AlertTriangle, CheckCircle2, FileText, Users, Activity, Eye } from 'lucide-react';
import { PageHeader, Card, ActionButton } from '../../components/Widgets';
import { useModal } from '../../components/WidgetUtils';
import { AgentSummaryBar } from '../../components/AgentComponents';
import { StatGrid, DataTable } from '../../components/DataComponents';
import { DecisionQueue } from '../../components/DecisionComponents';
import { useDecisionQueue } from '../../hooks/useDecisionQueue';
import { activeSurvey, surveyRequests, surveyRequestDecisions } from '../../data/survey/activeSurveyData';

const surveyHistory = [
  { id: 'sh-1', facility: 'Sunrise Meadows', type: 'Annual Recertification', date: '2025-11-14', deficiencies: 3, outcome: 'No IJ — Plan of Correction accepted' },
  { id: 'sh-2', facility: 'Bayview Care Center', type: 'Complaint Investigation', date: '2025-09-22', deficiencies: 1, outcome: 'Substantiated — F-689 corrected on-site' },
  { id: 'sh-3', facility: 'Heritage Oaks Nursing', type: 'Annual Recertification', date: '2025-06-10', deficiencies: 5, outcome: 'No IJ — 2 repeat deficiencies noted' },
  { id: 'sh-4', facility: 'Valley View Rehab', type: 'Life Safety Code', date: '2025-04-03', deficiencies: 2, outcome: 'Cleared — corrective actions verified' },
  { id: 'sh-5', facility: 'Mountain Crest SNF', type: 'Annual Recertification', date: '2025-01-28', deficiencies: 0, outcome: 'Deficiency-free survey' },
  { id: 'sh-6', facility: 'Cedar Ridge Health', type: 'Focused Infection Control', date: '2024-12-11', deficiencies: 1, outcome: 'F-880 — corrected within 30 days' },
];

const openRequests = surveyRequests.filter(r => r.status === 'pending' || r.status === 'in-progress' || r.status === 'escalated');
const fulfilledRequests = surveyRequests.filter(r => r.status === 'fulfilled');
const avgResponseTime = Math.round(fulfilledRequests.reduce((sum, r) => sum + (r.responseTime || 0), 0) / fulfilledRequests.length);
const hoursElapsed = ((new Date('2026-04-02T10:00:00') - new Date(activeSurvey.startDate)) / 3600000).toFixed(1);

export default function SurveyCommand() {
  const { open } = useModal();
  const { decisions, approve, escalate, override } = useDecisionQueue(surveyRequestDecisions);

  const stats = [
    { label: 'Open Requests', value: openRequests.length, icon: ClipboardList, color: 'amber', change: '1 escalated', changeType: 'negative' },
    { label: 'Fulfilled Requests', value: fulfilledRequests.length, icon: CheckCircle2, color: 'emerald', change: `${Math.round((fulfilledRequests.length / surveyRequests.length) * 100)}% completion`, changeType: 'positive' },
    { label: 'Avg Response Time', value: `${avgResponseTime} min`, icon: Clock, color: 'blue', change: 'Target: <15 min', changeType: 'positive' },
    { label: 'Live Risk Score', value: 72, icon: AlertTriangle, color: 'amber', change: 'Elevated — fire drill gap', changeType: 'negative' },
    { label: 'Focus Areas Detected', value: 4, icon: Eye, color: 'purple', change: 'Pharmacy, Dietary, Safety, IC', changeType: 'neutral' },
    { label: 'Hours Elapsed', value: hoursElapsed, icon: Clock, color: 'blue', change: `Day ${activeSurvey.day} of 4`, changeType: 'neutral' },
  ];

  const surveyorNames = ['Karen Mitchell, RN (Lead)', 'David Park, PharmD', 'Lisa Chen, RD', 'Tom Reynolds, LSW'];

  const historyColumns = [
    { key: 'facility', label: 'Facility', sortable: true },
    { key: 'type', label: 'Survey Type', sortable: true },
    { key: 'date', label: 'Date', sortable: true, render: (v) => new Date(v).toLocaleDateString() },
    { key: 'deficiencies', label: 'Deficiencies', sortable: true, render: (v) => (
      <span className={`font-semibold ${v === 0 ? 'text-emerald-600 dark:text-emerald-400' : v >= 4 ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400'}`}>{v}</span>
    )},
    { key: 'outcome', label: 'Outcome', sortable: false },
  ];

  const openPlaceholderModal = (title, description) => {
    open({
      title,
      content: (
        <div className="space-y-3">
          <p className="text-sm text-gray-600 dark:text-gray-400">{description}</p>
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 text-sm text-gray-500 dark:text-gray-400">
            This action will connect to PCC, Workday, and SharePoint when Ensign credentials are activated.
          </div>
        </div>
      ),
      maxWidth: 'max-w-2xl',
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Survey Command Center"
        subtitle="Active Survey Management & Defense"
        aiSummary={`ACTIVE SURVEY at ${activeSurvey.facility} — Day ${activeSurvey.day} of 4. ${activeSurvey.surveyType} with ${activeSurvey.teamSize} surveyors led by ${activeSurvey.leadSurveyor}. Key risk areas: fire drill gap (45 days), PRN psychotropic documentation, dietary referral follow-up, and hand hygiene compliance at 72%. ${openRequests.length} requests outstanding, ${fulfilledRequests.length} fulfilled with ${avgResponseTime}-min avg response.`}
        riskLevel="high"
      />

      <AgentSummaryBar
        agentName="Survey Defense Agent"
        summary="Actively managing survey document requests, monitoring surveyor focus areas, and pre-staging records. 47 documents pre-compiled from PCC, Workday, and SharePoint. 5 risk exceptions requiring immediate human decisions."
        itemsProcessed={47}
        exceptionsFound={5}
        timeSaved="14.2 hrs"
        lastRunTime="2 min ago"
      />

      {/* Active Survey Alert Banner */}
      <Card>
        <div className="border-l-4 border-red-500 pl-4">
          <div className="flex flex-wrap items-center gap-3 mb-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 text-xs font-bold uppercase tracking-wide">
              <Activity className="w-3.5 h-3.5" /> Active Survey
            </span>
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Survey Active — Started Mar 31, 8:15 AM
            </span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
            {activeSurvey.facility} — {activeSurvey.surveyType}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
            Day {activeSurvey.day} of 4 &middot; {activeSurvey.teamSize} Surveyors &middot; State Health Department
          </p>
          <div className="flex flex-wrap gap-2 mb-4">
            {surveyorNames.map((name) => (
              <span key={name} className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-gray-100 dark:bg-gray-800 text-xs text-gray-700 dark:text-gray-300">
                <Users className="w-3 h-3" /> {name}
              </span>
            ))}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Open Requests', value: openRequests.length, color: 'text-amber-600 dark:text-amber-400' },
              { label: 'Fulfilled', value: fulfilledRequests.length, color: 'text-emerald-600 dark:text-emerald-400' },
              { label: 'Observations Logged', value: 8, color: 'text-blue-600 dark:text-blue-400' },
              { label: 'Risk Score', value: '72/100', color: 'text-red-600 dark:text-red-400' },
            ].map((s) => (
              <div key={s.label} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 text-center">
                <p className="text-[10px] uppercase tracking-wider text-gray-500 dark:text-gray-400">{s.label}</p>
                <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
              </div>
            ))}
          </div>
        </div>
      </Card>

      <StatGrid stats={stats} columns={6} />

      <DecisionQueue
        decisions={decisions}
        onApprove={approve}
        onEscalate={escalate}
        onOverride={override}
        title="Survey Defense Decisions"
        badge={decisions.length}
      />

      {/* Quick Actions */}
      <Card title="Quick Actions" badge="Survey Tools">
        <div className="flex flex-wrap gap-3">
          <ActionButton
            label="Log Request"
            icon={ClipboardList}
            variant="primary"
            onClick={() => openPlaceholderModal('Log Surveyor Request', 'Record a new document or information request from the survey team. The agent will auto-locate and stage the requested materials from PCC, Workday, and SharePoint.')}
          />
          <ActionButton
            label="Log Observation"
            icon={Eye}
            variant="ghost"
            onClick={() => openPlaceholderModal('Log Surveyor Observation', 'Document a surveyor observation, resident interaction, or environmental finding. The agent will cross-reference with compliance data and flag any risk areas.')}
          />
          <ActionButton
            label="Add Sample Resident"
            icon={Users}
            variant="ghost"
            onClick={() => openPlaceholderModal('Add Sample Resident', 'Add a resident selected by the survey team for focused review. The agent will pre-pull their complete clinical record, care plan, MDS assessments, and medication profile from PCC.')}
          />
          <ActionButton
            label="View Entrance Docs"
            icon={FileText}
            variant="ghost"
            onClick={() => openPlaceholderModal('Entrance Conference Documents', 'View and manage the entrance conference document package. All items are pre-staged by the Survey Defense Agent with real-time fulfillment tracking.')}
          />
        </div>
      </Card>

      {/* Survey History */}
      <Card title="Survey History" badge={`${surveyHistory.length} surveys`}>
        <DataTable
          columns={historyColumns}
          data={surveyHistory}
          searchable
          pageSize={6}
        />
      </Card>
    </div>
  );
}
