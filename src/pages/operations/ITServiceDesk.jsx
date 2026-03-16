import { Monitor, AlertTriangle, Clock, Laptop, Wifi, Activity } from 'lucide-react';
import { PageHeader, StatusBadge, PriorityBadge } from '../../components/Widgets';
import { AgentSummaryBar } from '../../components/AgentComponents';
import { StatGrid, DataTable } from '../../components/DataComponents';
import { DecisionQueue } from '../../components/DecisionComponents';
import { useDecisionQueue } from '../../hooks/useDecisionQueue';

const itTickets = [
  { id: 'IT-001', title: 'PCC login failures — Las Vegas all users', category: 'EHR', priority: 'critical', facilityId: 'f4', facility: 'Las Vegas Desert Springs', assignedTo: 'Sarah Chen', openedDate: '2026-03-15', status: 'in-progress', impact: 'All clinical staff unable to document' },
  { id: 'IT-002', title: 'Network switch failure — Denver B-Wing', category: 'Network', priority: 'critical', facilityId: 'f2', facility: 'Denver Meadows', assignedTo: 'Mike Rodriguez', openedDate: '2026-03-15', status: 'in-progress', impact: 'B-Wing phones and workstations offline' },
  { id: 'IT-003', title: 'Printer jam — Phoenix nurses station', category: 'Hardware', priority: 'medium', facilityId: 'f1', facility: 'Phoenix Sunrise', assignedTo: 'James Park', openedDate: '2026-03-14', status: 'scheduled', impact: 'Using backup printer in admin office' },
  { id: 'IT-004', title: 'Workday timeout errors — intermittent', category: 'Software', priority: 'high', facilityId: 'all', facility: 'Enterprise-wide', assignedTo: 'Sarah Chen', openedDate: '2026-03-14', status: 'in-progress', impact: 'Payroll processing delays possible' },
  { id: 'IT-005', title: 'New hire laptop setup — 3 devices', category: 'Provisioning', priority: 'medium', facilityId: 'f3', facility: 'San Diego Pacific', assignedTo: 'James Park', openedDate: '2026-03-13', status: 'scheduled', impact: 'Start date March 17' },
  { id: 'IT-006', title: 'WiFi dead zone — Tucson dining area', category: 'Network', priority: 'low', facilityId: 'f8', facility: 'Tucson Desert Bloom', assignedTo: null, openedDate: '2026-03-12', status: 'pending', impact: 'Resident and visitor WiFi only' },
  { id: 'IT-007', title: 'Badge reader malfunction — Portland main entrance', category: 'Hardware', priority: 'high', facilityId: 'f6', facility: 'Portland Evergreen', assignedTo: 'Mike Rodriguez', openedDate: '2026-03-15', status: 'scheduled', impact: 'Manual sign-in required — security concern' },
  { id: 'IT-008', title: 'Email delivery delays — Sacramento', category: 'Software', priority: 'medium', facilityId: 'f5', facility: 'Sacramento Valley', assignedTo: null, openedDate: '2026-03-14', status: 'pending', impact: '15-30 min delay on incoming email' },
  { id: 'IT-009', title: 'PCC medication module update required', category: 'EHR', priority: 'medium', facilityId: 'all', facility: 'Enterprise-wide', assignedTo: 'Sarah Chen', openedDate: '2026-03-10', status: 'scheduled', impact: 'Scheduled maintenance window March 16 2AM' },
  { id: 'IT-010', title: 'Replace desktop — Salt Lake admin office', category: 'Hardware', priority: 'low', facilityId: 'f7', facility: 'Salt Lake Mountain View', assignedTo: 'James Park', openedDate: '2026-03-11', status: 'pending', impact: 'Slow performance, 6-year-old device' },
];

const openTickets = itTickets.filter(t => t.status !== 'completed');
const criticalTickets = itTickets.filter(t => t.priority === 'critical');
const avgResolutionTime = '4.2 hrs';
const devicesManaged = 892;
const networkUptime = '99.7%';
const ehrStatus = criticalTickets.some(t => t.category === 'EHR') ? 'Degraded' : 'Operational';

const itDecisions = [
  { id: 'it-d1', title: 'PCC login failures affecting all Las Vegas staff', description: 'Authentication service returning 503 errors. All clinical documentation blocked since 7:15 AM.', priority: 'critical', agent: 'Platform Monitor', confidence: 0.96, recommendation: 'Escalate to PCC support (Priority 1). Switch to paper documentation backup protocol. Estimated resolution 2-4 hours.', governanceLevel: 3, facility: 'Las Vegas Desert Springs' },
  { id: 'it-d2', title: 'Network switch failure — Denver B-Wing offline', description: 'Cisco switch in B-Wing IDF failed. 12 workstations, 8 VoIP phones, and nurse call integration affected.', priority: 'critical', agent: 'Platform Monitor', confidence: 0.93, recommendation: 'Deploy spare switch from Denver stockroom. Estimated 90 min to restore. Redirect calls to cell phones interim.', governanceLevel: 2, facility: 'Denver Meadows' },
  { id: 'it-d3', title: 'Badge reader malfunction — Portland security risk', description: 'Main entrance badge reader not reading cards. Manual sign-in log in use.', priority: 'high', agent: 'Platform Monitor', confidence: 0.89, recommendation: 'Station security guard at entrance until repair. Schedule vendor visit today.', governanceLevel: 2, facility: 'Portland Evergreen' },
];

const columns = [
  { key: 'id', label: 'Ticket' },
  { key: 'title', label: 'Description' },
  { key: 'category', label: 'Category' },
  { key: 'facility', label: 'Facility' },
  { key: 'priority', label: 'Priority', render: (v) => <PriorityBadge priority={v.charAt(0).toUpperCase() + v.slice(1)} /> },
  { key: 'assignedTo', label: 'Assigned', render: (v) => v || <span className="text-red-500 text-xs font-semibold">Unassigned</span> },
  { key: 'status', label: 'Status', render: (v) => <StatusBadge status={v === 'pending' ? 'pending' : v === 'in-progress' ? 'in-progress' : v === 'scheduled' ? 'in-progress' : 'completed'} /> },
];

export default function ITServiceDesk() {
  const { decisions, approve, escalate } = useDecisionQueue(itDecisions);

  const stats = [
    { label: 'Open Tickets', value: openTickets.length, icon: Monitor, color: 'blue' },
    { label: 'Critical', value: criticalTickets.length, change: criticalTickets.length > 0 ? 'Immediate action' : 'None', changeType: criticalTickets.length > 0 ? 'negative' : 'positive', icon: AlertTriangle, color: 'red' },
    { label: 'Avg Resolution', value: avgResolutionTime, icon: Clock, color: 'purple' },
    { label: 'Devices Managed', value: devicesManaged, icon: Laptop, color: 'amber' },
    { label: 'Network Uptime', value: networkUptime, change: '30-day average', changeType: 'positive', icon: Wifi, color: 'emerald' },
    { label: 'EHR Status', value: ehrStatus, change: ehrStatus === 'Degraded' ? 'Las Vegas affected' : 'All systems normal', changeType: ehrStatus === 'Degraded' ? 'negative' : 'positive', icon: Activity, color: ehrStatus === 'Degraded' ? 'red' : 'emerald' },
  ];

  return (
    <div className="p-6">
      <PageHeader
        title="IT Service Desk"
        subtitle="Technology support, network operations, and EHR system monitoring"
        aiSummary={`${criticalTickets.length} critical tickets: PCC login failures at Las Vegas blocking all clinical documentation, and network switch failure at Denver taking B-Wing offline. ${openTickets.length} total open tickets, ${itTickets.filter(t => !t.assignedTo).length} unassigned. EHR status degraded.`}
        riskLevel={criticalTickets.length > 0 ? 'high' : 'low'}
      />
      <AgentSummaryBar
        agentName="Platform Monitor"
        summary={`Monitoring ${devicesManaged} devices across 8 facilities. ${criticalTickets.length} critical issues active. Network uptime ${networkUptime}. EHR system ${ehrStatus.toLowerCase()}.`}
        itemsProcessed={devicesManaged}
        exceptionsFound={criticalTickets.length}
        timeSaved="2.4 hrs"
      />

      <div className="mb-6"><StatGrid stats={stats} columns={6} /></div>

      <div className="mb-6">
        <DecisionQueue decisions={decisions} onApprove={approve} onEscalate={escalate} title="Critical IT Decisions" badge={decisions.length} />
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Open Tickets</h3>
        <DataTable columns={columns} data={itTickets} searchable pageSize={10} />
      </div>
    </div>
  );
}
