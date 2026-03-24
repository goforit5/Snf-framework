import { MessageSquare, Clock, Users, UserCheck, ThumbsUp } from 'lucide-react';
import { grievances, grievanceSummary } from '../../data/compliance/grievances';
import { facilityName, formatDate } from '../../data/helpers';
import { PageHeader, Card, ActionButton } from '../../components/Widgets';
import { useModal } from '../../components/WidgetUtils';
import { AgentSummaryBar } from '../../components/AgentComponents';
import { StatGrid, DataTable } from '../../components/DataComponents';
import { DecisionQueue } from '../../components/DecisionComponents';
import { useDecisionQueue } from '../../hooks/useDecisionQueue';

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
const staticDecisions = [
  {
    id: 'grv-d1', title: 'ESCALATED: Linda Chen (daughter) — quality of care complaint, 3 falls in 30 days',
    description: 'Linda Chen, daughter and POA for Margaret Chen (Room 214-B, Heritage Oaks), filed a formal quality of care grievance on March 3 stating: "My mother has fallen three times in one month and nobody changed her care plan after the second fall. The third fall broke her hip. This is negligence." Linda has retained attorney Robert Simmons of Simmons & Associates (medical malpractice firm). The grievance was escalated to leadership on March 5 after the initial investigator (Social Worker Amanda Foster) determined that the care plan was indeed not updated after the second fall on February 15 — a finding that aligns with the CMS IJ survey result. Margaret is currently at Desert Springs Hospital post-surgical hip repair, expected to return to Heritage Oaks by March 22.',
    facility: facilityName('f4'),
    priority: 'critical', agent: 'Quality Measures Agent', confidence: 0.96, governanceLevel: 4,
    recommendation: 'Three-part response requiring executive approval: (1) DON Patricia Alvarez and Administrator to meet with Linda Chen in person by March 19 — acknowledge the care plan gap, present corrective actions taken (RCA completed, care plan updated, staff re-educated). Do NOT admit liability (attorney involved). (2) General Counsel Rebecca Torres to coordinate with insurance carrier CNA Professional (claim #CNA-2026-HO-0847) — carrier may want to assign defense counsel given the malpractice firm involvement. (3) Offer Linda a direct line to the Administrator for weekly updates on Margaret\'s recovery and updated care plan. Document all interactions in PCC grievance module and SharePoint litigation hold folder.',
    impact: 'If unresolved: state ombudsman complaint (Linda mentioned this as next step), potential lawsuit ($250K-$500K exposure per comparable hip fracture settlements), CMS complaint survey triggered. Resolved well: demonstrates accountability, may prevent litigation (60% of families drop legal action when they feel heard and see genuine corrective action, per AHRQ data).',
    evidence: [{ label: 'Grievance #GRV-2026-HO-001', detail: 'Filed 3/3 by Linda Chen (daughter/POA), category: Quality of Care, status: escalated 3/5' }, { label: 'Attorney involvement', detail: 'Robert Simmons, Simmons & Associates, medical malpractice. Records request received 3/12' }, { label: 'Care plan gap confirmed', detail: 'Fall #2 on 2/15 — care plan still showed "standby assist" as of 2/28 fall #3' }, { label: 'Insurance claim', detail: 'CNA Professional #CNA-2026-HO-0847, reserve $125K established' }],
  },
  {
    id: 'grv-d2', title: 'Safety grievance — Hoyer lift malfunction, CNA injury, Heritage Oaks',
    description: 'CNA Andre Williams filed a safety grievance on March 10 regarding the Hoyer lift hydraulic failure that caused his back injury on March 9 (WC claim #wc-003). Andre\'s grievance states: "I\'ve reported this lift making grinding noises for 2 months and nothing was done. Now I\'m hurt and can\'t do my job." Workday shows Andre submitted a maintenance request (MR-2026-HO-0219) on January 14 noting "Hoyer lift in Room 108 makes grinding sound during operation." The request was marked "completed" on January 20 with the note "lubricated mechanism, operating normally" — but the hydraulic pump seal (the actual failure point) was not inspected. Andre has been with Ensign for 5 years, clean record, currently on modified duty pending MRI results March 20.',
    facility: facilityName('f4'),
    priority: 'high', agent: 'Quality Measures Agent', confidence: 0.93, governanceLevel: 3,
    recommendation: 'Three actions: (1) Maintenance Director to meet with Andre by March 19 to acknowledge the January maintenance request was inadequately resolved — the grinding noise should have triggered a full hydraulic system inspection, not just lubrication. (2) Implement a new protocol: all lift equipment complaints require hydraulic system inspection checklist (pump, seals, fluid level, hoses) — not just the reported symptom. (3) Andre\'s modified duty assignment must accommodate his restrictions per WC guidelines — ensure he\'s not being pressured to lift. HR Director Sarah Williams to confirm with his supervisor. Document corrective actions in both the grievance file and the WC claim file.',
    impact: 'Andre is a valued 5-year employee — mishandling this grievance risks losing him (and his institutional knowledge of bariatric care protocols). If Andre feels the safety concern was ignored: potential OSHA complaint for retaliation/failure to maintain equipment. The January maintenance request creates a paper trail that Ensign knew about the equipment issue — this strengthens Andre\'s WC claim and weakens any subrogation argument against Invacare.',
    evidence: [{ label: 'Grievance #GRV-2026-HO-003', detail: 'Filed 3/10 by Andre Williams, category: Safety, status: investigating' }, { label: 'Maintenance request MR-2026-HO-0219', detail: 'Filed 1/14 re: grinding noise, closed 1/20 "lubricated, operating normally"' }, { label: 'WC claim #wc-003', detail: 'Back injury 3/9, modified duty, MRI scheduled 3/20, Hartford policy #WC-ENS-2025-001' }],
  },
  {
    id: 'grv-d3', title: 'Dietary complaint — Robert Kim (family), cold meals and missed dietary restrictions',
    description: 'Sandra Kim (wife of resident Robert Kim, Room 308, Pacific Gardens) called the facility on March 11 to complain that Robert has received cold meals "at least 5 times this month" and that his sodium-restricted diet was violated twice — he was served regular soup on March 7 and salted crackers on March 9. Robert has Stage 2 heart failure with a physician-ordered sodium restriction of <2,000mg/day. PCC dietary records confirm the sodium-restricted diet order is active (ordered by Dr. Garcia on February 1). The Dietary Manager (Carmen Rodriguez) investigated and found that the tray line substitution log showed Robert\'s trays were prepared correctly, but a float dietary aide (not regular staff) delivered trays on both dates and did not check the tray card against the diet order sheet. The cold meal complaints correlate with understaffing on the dinner tray line — dietary has had 2 open positions since February.',
    facility: facilityName('f3'),
    priority: 'high', agent: 'Quality Measures Agent', confidence: 0.90, governanceLevel: 2,
    recommendation: 'Four corrective actions: (1) Dietary Manager Carmen Rodriguez to call Sandra Kim today with investigation findings and corrective plan. (2) Implement mandatory tray card verification for ALL float dietary staff — 30-second check before delivery. (3) Review tray line timing: dinner trays are currently plated at 4:30 PM but delivery doesn\'t start until 5:15 PM (45-minute gap causing cold food). Move plating to 4:50 PM or invest in heated delivery cart ($1,200). (4) Expedite hiring for 2 open dietary positions — HR has 3 applicants pending background checks. Follow-up satisfaction call to Sandra Kim within 7 days of corrective actions.',
    impact: 'Dietary restriction violations are a CMS survey-sensitive area — F-tag 0802 (food in form to meet individual needs). If surveyed: the 2 sodium restriction violations would likely be cited. For Robert specifically: excess sodium with Stage 2 heart failure increases fluid retention and hospitalization risk. Cold meals are a resident rights issue (F-0804). If Sandra files a state complaint: survey could be triggered within 10 business days.',
    evidence: [{ label: 'Grievance #GRV-2026-PG-005', detail: 'Filed 3/11 by Sandra Kim (spouse), category: Dietary, status: investigating' }, { label: 'PCC dietary order', detail: 'Kim, Robert: sodium <2,000mg/day, ordered 2/1/2026 by Dr. Garcia. Active.' }, { label: 'Tray line log', detail: 'Correct trays prepared, but float aide delivered without tray card check on 3/7 and 3/9' }, { label: 'Staffing gap', detail: '2 dietary aide positions open since Feb, dinner tray line understaffed on affected dates' }],
  },
  {
    id: 'grv-d4', title: 'Staff grievance — night shift CNA reports insufficient supplies, Cedar Ridge',
    description: 'CNA Keisha Brown (Cedar Ridge, night shift) submitted an anonymous grievance through the Workday complaint portal on March 8 reporting: "We run out of briefs and wipes almost every night shift. I\'ve told my supervisor 3 times and nothing changes. Residents are sitting in soiled briefs because we don\'t have supplies." The Quality Measures Agent cross-referenced this with supply chain data: Cedar Ridge\'s incontinence supply PAR levels were last updated in October 2025 when census was 48 residents. Current census is 62 residents (29% increase) but PAR levels were never adjusted. Night shift consumption averages 85 briefs/night; current PAR stocks 60 briefs for night shift. Supply Chain Agent confirms the discrepancy and has prepared an updated PAR recommendation.',
    facility: facilityName('f6'),
    priority: 'high', agent: 'Quality Measures Agent', confidence: 0.91, governanceLevel: 2,
    recommendation: 'Three immediate actions: (1) Update Cedar Ridge incontinence supply PAR levels from 60 to 100 briefs/night shift (accommodates 62 residents with safety margin). Cost increase: $340/month. (2) Facility Administrator Janet Kim to acknowledge the grievance (even though anonymous) by posting a unit-wide communication that supply PAR levels are being updated. (3) Supply Chain Agent to implement quarterly PAR review triggered by census changes >10% — this gap should have been caught automatically. Respond to anonymous grievance through Workday portal within 48 hours per policy.',
    impact: 'Residents sitting in soiled briefs is a dignity issue (F-tag 0558, resident rights) and a skin integrity issue (F-tag 0686, pressure ulcer prevention). If a resident develops a moisture-associated skin breakdown and the supply shortage is documented: CMS would cite both the care failure and the systemic supply management failure. Night shift staff morale is already fragile — ignoring this grievance risks turnover (Cedar Ridge night shift has 2 open CNA positions).',
    evidence: [{ label: 'Workday anonymous grievance', detail: 'Filed 3/8, category: Working Conditions/Supplies, 3 prior verbal reports to supervisor' }, { label: 'Supply chain data', detail: 'PAR set at 60 briefs (Oct 2025, census 48). Current census: 62. Night usage: 85 briefs/shift' }, { label: 'Census change', detail: 'Cedar Ridge census: 48 (Oct 2025) to 62 (Mar 2026) = 29% increase, PAR never adjusted' }],
  },
];
const decisionData = staticDecisions;

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
  const { decisions, approve, escalate } = useDecisionQueue(decisionData);

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
          onApprove={approve}
          onEscalate={escalate}
        />
      </div>

      <Card title="All Grievances" badge={`${grievances.length}`}>
        <DataTable columns={grievanceColumns} data={grievances} onRowClick={handleRowClick} sortable searchable />
      </Card>
    </div>
  );
}
