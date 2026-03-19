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
  {
    id: 'it-d1', title: 'PCC login failures — Desert Springs, all clinical documentation blocked since 7:15 AM',
    description: 'PointClickCare authentication service returning HTTP 503 (Service Unavailable) errors for all Desert Springs users since 7:15 AM. 34 clinical staff (18 CNAs, 8 nurses, 4 therapists, 2 MDS coordinators, 2 dietary) cannot document in the EHR. Sarah Chen (IT lead) isolated the issue to Desert Springs only — all other facilities connecting normally. Root cause: the facility\'s Cisco ASA firewall (serial #ASA-5516-2847) is dropping outbound HTTPS connections to PCC\'s cloud authentication endpoint (auth.pointclickcare.com). The firewall\'s SSL inspection certificate expired March 14. Paper documentation backup protocol was activated at 7:30 AM — nurses are documenting on paper MARs and treatment sheets.',
    priority: 'critical', agent: 'Platform Monitor', confidence: 0.96, governanceLevel: 3,
    facility: 'Las Vegas Desert Springs',
    recommendation: 'Approve two parallel actions: (1) Immediate: Sarah Chen to disable SSL inspection on the PCC traffic rule (15-minute fix, restores PCC access, acceptable security posture since PCC uses TLS 1.3). (2) Same-day: renew the SSL inspection certificate via Cisco Smart Licensing portal ($0 cost, covered under SmartNet contract SN-DS-2024-882). Estimated PCC restoration: 30 minutes from approval. Paper documentation must be back-entered into PCC within 24 hours per facility policy.',
    impact: 'Every hour of EHR downtime: medication administration documentation delayed (safety risk — no real-time MAR), therapy sessions undocumented (PDPM billing risk), MDS assessments paused (already 3 overdue). Estimated revenue documentation risk: $4,200/hour in unbilled services. Paper-to-digital back-entry cost: ~$1,400 (8 staff-hours at $175/hr loaded).',
    evidence: [{ label: 'IT-001 ticket log', detail: '7:15 AM first report, 7:25 AM confirmed all users affected, 7:30 AM paper backup activated' }, { label: 'Firewall diagnostic', detail: 'Cisco ASA SSL inspection cert expired 3/14, blocking TLS handshake to auth.pointclickcare.com' }, { label: 'PCC status page', detail: 'All systems operational — confirms issue is local to Desert Springs network' }],
  },
  {
    id: 'it-d2', title: 'Network switch failure — Meadowbrook B-Wing, 12 workstations + 8 phones offline',
    description: 'Cisco Catalyst 2960X switch (serial #CAT-2960-B2-4419) in the Meadowbrook B-Wing IDF closet failed at 6:45 AM — all 4 status LEDs solid amber indicating hardware failure. Impact: 12 workstations (4 nursing stations, 6 hallway COWs, 2 therapy room PCs), 8 VoIP phones (including nurse call system integration), and 2 wireless access points serving 28 resident rooms. B-Wing nurses are using personal cell phones for physician callbacks. The nurse call system is functioning on battery backup but cannot route calls to the desk phone — all calls go to overhead PA only. Mike Rodriguez has a spare Catalyst 2960X in the Denver stockroom (20-minute drive).',
    priority: 'critical', agent: 'Platform Monitor', confidence: 0.93, governanceLevel: 2,
    facility: 'Denver Meadows',
    recommendation: 'Approve emergency switch replacement: Mike Rodriguez retrieves spare from stockroom (20 min), installs in B-Wing IDF (45 min configuration + patching), test all ports (15 min). Total estimated restoration: 90 minutes from approval. Spare switch cost: $0 (already in inventory). Cisco SmartNet RMA for failed unit: submit today for replacement within 4 business days. Interim: move 2 COWs from A-Wing to B-Wing nursing stations for critical documentation.',
    impact: 'B-Wing nurses cannot document vitals, medication passes, or treatments in PCC from workstations. VoIP phones offline means physician orders by callback cannot be received at nursing station. Nurse call routing to PA only (not desk phone) increases response time by estimated 45 seconds per call — fall risk for 28 residents.',
    evidence: [{ label: 'IT-002 ticket', detail: 'Cisco 2960X failed 6:45 AM, all LEDs amber, no console access — hardware failure confirmed' }, { label: 'Impact scope', detail: '12 workstations, 8 VoIP phones, 2 APs, 28 resident rooms affected' }, { label: 'Spare inventory', detail: 'Catalyst 2960X in Denver stockroom, pre-configured with base VLAN template, 20-min retrieval' }],
  },
  {
    id: 'it-d3', title: 'Badge reader malfunction — Cedar Ridge main entrance, security gap',
    description: 'The HID iCLASS SE badge reader at Cedar Ridge\'s main entrance stopped reading proximity cards at approximately 5:00 PM yesterday. Manual sign-in log has been in use for 16 hours. The reader\'s LED shows steady red (communication failure with access controller). Mike Rodriguez checked the Wiegand cable connection — intact. Likely cause: RS-485 communication board failure (common in HID SE readers after 5+ years, this unit installed 2020). Security concern: 47 staff entries since 5 PM were manual sign-in only — no electronic access log. Cedar Ridge has 3 other entrances, all badge-controlled and functioning normally. One unauthorized visitor was intercepted at 8 PM by a CNA who noticed them in the hallway without a visitor badge.',
    priority: 'high', agent: 'Platform Monitor', confidence: 0.89, governanceLevel: 2,
    facility: 'Portland Evergreen',
    recommendation: 'Approve two actions: (1) Station front desk staff at main entrance during business hours (7 AM - 7 PM) until reader replaced — verify visitor IDs manually and maintain sign-in log. Cost: $0 (redirect existing receptionist). After hours: lock main entrance, route all entry through B-entrance (badge reader functional). (2) Order replacement HID iCLASS SE reader ($380, vendor SecureTech, same-day delivery available in Portland metro). Mike Rodriguez can install in 45 minutes.',
    impact: 'Unsecured main entrance creates elopement risk (2 residents with wandering care plans on 1st floor) and unauthorized access risk. The 8 PM unauthorized visitor incident demonstrates the gap. CMS F-tag 0689 (accident hazards) and F-tag 0921 (facility security) both implicated. State requires electronic access logs for all entry points per licensing standard.',
    evidence: [{ label: 'IT-007 ticket', detail: 'HID iCLASS SE reader failed 3/14 5:00 PM, LED steady red, Wiegand cable OK' }, { label: 'Access log gap', detail: '47 manual sign-ins since 5 PM 3/14, no electronic timestamps' }, { label: 'Security incident', detail: 'Unauthorized visitor intercepted 8 PM 3/14, entered through unsecured main entrance' }],
  },
  {
    id: 'it-d4', title: 'Workday timeout errors — enterprise-wide, payroll processing at risk',
    description: 'Intermittent Workday session timeout errors reported across all 8 facilities since March 14. Users get "Session Expired" after 3-5 minutes of inactivity (normal timeout is 30 minutes). Sarah Chen reviewed Workday status page — no outages reported. Network analysis shows the issue correlates with the March 13 firewall firmware update (all facilities updated simultaneously). The shortened session timeout is affecting payroll processing: the March 28 payroll cycle requires HR coordinators to have extended sessions for batch approvals. 14 time-card corrections are pending because supervisors keep getting logged out mid-approval.',
    priority: 'high', agent: 'Platform Monitor', confidence: 0.88, governanceLevel: 2,
    facility: 'Enterprise-wide',
    recommendation: 'Sarah Chen to roll back the firewall session timeout setting from the March 13 firmware update. The new firmware changed the default idle timeout from 1800 seconds to 300 seconds for HTTPS sessions — this needs to be explicitly set back to 1800 in the firewall policy for Workday traffic. Change can be pushed to all 8 firewalls simultaneously via Cisco FMC (30-minute maintenance window, no downtime). Schedule for tonight 10 PM to avoid disruption.',
    impact: 'If not resolved before March 28 payroll cycle: risk of delayed payroll processing affecting 534 employees. 14 pending time-card corrections blocked — $3,200 in corrections waiting. Ongoing user frustration: estimated 340 re-login events per day across enterprise (8.5 minutes lost productivity per user per day).',
    evidence: [{ label: 'IT-004 ticket', detail: 'Session timeouts reported across all facilities, correlates with 3/13 firmware update' }, { label: 'Firewall config diff', detail: 'Default idle timeout changed from 1800s to 300s in firmware v7.4.1 release notes' }, { label: 'Payroll impact', detail: '14 time-card corrections pending, March 28 payroll cycle requires extended sessions' }],
  },
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
