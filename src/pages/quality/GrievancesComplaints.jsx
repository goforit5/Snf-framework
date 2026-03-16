import { MessageSquare, Clock, Users, UserCheck, AlertTriangle, ThumbsUp } from 'lucide-react';
import { grievances, grievanceSummary } from '../../data/compliance/grievances';
import { facilityName, formatDate } from '../../data/helpers';
import { PageHeader, Card, useModal, ActionButton } from '../../components/Widgets';
import { AgentSummaryBar } from '../../components/AgentComponents';
import { StatGrid, DataTable } from '../../components/DataComponents';
import { DecisionQueue } from '../../components/DecisionComponents';

const residentComplaints = grievances.filter(g => g.complainantType === 'resident').length;
const familyComplaints = grievances.filter(g => g.complainantType === 'family').length;
const staffComplaints = grievances.filter(g => g.complainantType === 'staff').length;

const stats = [
  { label: 'Open Grievances', value: grievanceSummary.totalOpen, icon: MessageSquare, color: 'red', change: `${grievances.filter(g => g.status === 'escalated').length} escalated`, changeType: 'negative' },
  { label: 'Avg Resolution Days', value: `${grievanceSummary.avgResolutionDays}d`, icon: Clock, color: 'amber' },
  { label: 'Resident Complaints', value: residentComplaints, icon: Users, color: 'blue' },
  { label: 'Family Complaints', value: familyComplaints, icon: Users, color: 'purple' },
  { label: 'Staff Complaints', value: staffComplaints, icon: UserCheck, color: 'cyan' },
  { label: 'Satisfaction Score', value: `${grievanceSummary.satisfactionRate}%`, icon: ThumbsUp, color: 'emerald', change: 'Post-resolution surveys', changeType: 'positive' },
];

const openGrievances = grievances.filter(g => g.status !== 'resolved');
const decisions = openGrievances.map((g, i) => ({
  id: g.id,
  number: i + 1,
  title: `${g.category} — ${g.complainant}`,
  description: g.description,
  facility: facilityName(g.facilityId),
  priority: g.status === 'escalated' ? 'critical' : g.category === 'Quality of Care' || g.category === 'Safety' ? 'high' : 'medium',
  agent: 'quality-measures',
  confidence: 0.87,
  recommendation: g.status === 'escalated'
    ? 'Escalated grievance requires immediate leadership review and resolution plan within 24 hours.'
    : `Continue investigation. Target resolution within ${grievanceSummary.avgResolutionDays} days. Assign follow-up satisfaction survey.`,
  governanceLevel: g.status === 'escalated' ? 4 : 3,
}));

const statusColor = (s) => {
  const colors = { investigating: 'bg-amber-50 text-amber-700', resolved: 'bg-green-50 text-green-700', escalated: 'bg-red-50 text-red-700' };
  return colors[s] || 'bg-gray-100 text-gray-500';
};

const typeColor = (t) => {
  const colors = { family: 'bg-purple-50 text-purple-700', resident: 'bg-blue-50 text-blue-700', staff: 'bg-cyan-50 text-cyan-700', anonymous: 'bg-gray-100 text-gray-600' };
  return colors[t] || 'bg-gray-100 text-gray-500';
};

const grievanceColumns = [
  { key: 'receivedDate', label: 'Date', render: (v) => <span className="text-xs font-mono">{formatDate(v)}</span> },
  { key: 'complainant', label: 'Complainant', render: (v) => <span className="text-xs font-medium">{v}</span> },
  { key: 'complainantType', label: 'Type', render: (v) => <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${typeColor(v)}`}>{v}</span> },
  { key: 'category', label: 'Category' },
  { key: 'facilityId', label: 'Facility', render: (v) => <span className="text-xs">{facilityName(v)}</span> },
  { key: 'status', label: 'Status', render: (v) => <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${statusColor(v)}`}>{v}</span> },
];

export default function GrievancesComplaints() {
  const { open } = useModal();

  const handleRowClick = (row) => {
    open({
      title: `${row.category} — ${row.complainant}`,
      content: (
        <div className="space-y-4">
          <p className="text-sm text-gray-700">{row.description}</p>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div><span className="text-gray-500">Facility:</span> <span className="text-gray-900">{facilityName(row.facilityId)}</span></div>
            <div><span className="text-gray-500">Investigator:</span> <span className="text-gray-900">{row.investigator}</span></div>
            <div><span className="text-gray-500">Received:</span> <span className="text-gray-900">{formatDate(row.receivedDate)}</span></div>
            <div><span className="text-gray-500">Status:</span> <span className="text-gray-900 capitalize">{row.status}</span></div>
          </div>
          {row.resolution && (
            <div className="bg-green-50 rounded-xl p-3 border border-green-100">
              <p className="text-[10px] font-semibold text-green-600 uppercase mb-1">Resolution</p>
              <p className="text-xs text-gray-700">{row.resolution}</p>
            </div>
          )}
          {row.satisfactionFollowUp && (
            <div className="bg-blue-50 rounded-xl p-3 border border-blue-100">
              <p className="text-[10px] font-semibold text-blue-600 uppercase mb-1">Satisfaction Follow-Up</p>
              <p className="text-xs text-gray-700 capitalize">{row.satisfactionFollowUp}</p>
            </div>
          )}
        </div>
      ),
      actions: <ActionButton label="Close" variant="ghost" />,
    });
  };

  return (
    <div className="p-6">
      <PageHeader
        title="Grievances & Complaints"
        subtitle="Complaint tracking, investigation, and resolution monitoring"
        aiSummary={`${grievanceSummary.totalOpen} open grievances. Margaret Chen's daughter filed a quality of care complaint about repeated falls. 1 safety grievance escalated — lift equipment malfunction at Heritage Oaks. Post-resolution satisfaction rate is ${grievanceSummary.satisfactionRate}%.`}
        riskLevel={openGrievances.some(g => g.status === 'escalated') ? 'high' : 'medium'}
      />

      <AgentSummaryBar
        agentName="Quality Measures Agent"
        summary={`tracking ${grievances.length} grievances. ${grievanceSummary.totalOpen} open, ${grievanceSummary.resolved} resolved. Avg resolution: ${grievanceSummary.avgResolutionDays} days.`}
        itemsProcessed={grievances.length}
        exceptionsFound={grievanceSummary.totalOpen}
        timeSaved="4.1 hrs"
        lastRunTime="6:00 AM"
      />

      <div className="mb-6">
        <StatGrid stats={stats} columns={6} />
      </div>

      <div className="mb-6">
        <DecisionQueue
          decisions={decisions}
          title="Grievances Needing Investigation"
          badge={decisions.length}
          onApprove={() => {}}
          onEscalate={() => {}}
        />
      </div>

      <Card title="All Grievances" badge={`${grievances.length}`}>
        <DataTable columns={grievanceColumns} data={grievances} onRowClick={handleRowClick} sortable searchable />
      </Card>
    </div>
  );
}
