import { Shield, AlertTriangle, Flame, Zap, DoorOpen, CalendarClock } from 'lucide-react';
import { lifeSafetyInspections, lifeSafetySummary } from '../../data/operations/lifeSafety';
import { facilityMap } from '../../data/entities/facilities';
import { PageHeader, StatusBadge } from '../../components/Widgets';
import { AgentSummaryBar } from '../../components/AgentComponents';
import { StatGrid, DataTable } from '../../components/DataComponents';
import { DecisionQueue } from '../../components/DecisionComponents';
import { useDecisionQueue } from '../../hooks/useDecisionQueue';

const fireDrills = lifeSafetyInspections.filter(i => i.type === 'fire-drill');
const fireDrillsDone = fireDrills.filter(i => i.status === 'completed').length;
const generatorTests = lifeSafetyInspections.filter(i => i.type === 'generator-test');
const generatorsDone = generatorTests.filter(i => i.status === 'completed').length;
const exitLights = lifeSafetyInspections.filter(i => i.type === 'exit-light');
const exitLightsOk = exitLights.filter(i => i.result === 'pass').length;
const nextDrill = lifeSafetyInspections
  .filter(i => i.type === 'fire-drill' && (i.status === 'scheduled' || i.status === 'due-today'))
  .sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate))[0];

const lifeSafetyDecisions = [
  {
    id: 'ls-d1', title: 'Overdue fire drill — Desert Springs, 10 days past due, CMS window imminent',
    description: 'Desert Springs\' quarterly fire drill was due March 5 and has not been completed — now 10 days overdue. The delay was caused by the fire alarm panel fault in B-Wing (WO-001, ground fault alarms since March 13) which the Safety Officer said made a drill "impractical." However, CMS requires quarterly drills regardless of equipment status — the facility must document alternative evacuation procedures when alarm systems are impaired. Desert Springs\' last CMS survey was 13 months ago (February 2025). The standard survey cycle is 12-15 months, meaning a survey could occur any day. The drill must cover all 3 shifts (day, evening, night) per NFPA 101 and include 72 residents across 2 wings.',
    priority: 'critical', agent: 'Life Safety Agent', confidence: 0.97, governanceLevel: 3,
    facility: facilityMap['f4']?.name,
    recommendation: 'Schedule fire drill within 24 hours — March 19 day shift, with evening and night shift follow-ups by March 21. Use manual notification protocol (air horns + PA system) since fire alarm panel is impaired. Document the alarm impairment and alternative drill method in the Life Safety Management binder. Safety Officer Maria Rodriguez confirmed availability to coordinate. File a Plan of Correction-ready explanation for the 10-day delay.',
    impact: 'If surveyed without current drill documentation: F-tag 0923 (fire drill quarterly), deficiency finding with mandatory Plan of Correction. Repeat deficiency (previous drill was 2 days late in Q3 2025) escalates to Pattern status — $3,050/day CMP until corrected. Desert Springs\' otherwise clean 3-year survey history is at risk.',
    evidence: [{ label: 'Fire drill schedule', detail: 'Q1 2026 drill due 3/5, not conducted. Q4 2025 drill conducted 12/7 (2 days late)' }, { label: 'Survey timing', detail: 'Last CMS survey Feb 2025 — 13 months ago, within 12-15 month survey window' }, { label: 'NFPA 101 requirement', detail: 'Quarterly drills on each shift, documented within 24 hours, covers all occupied areas' }],
  },
  {
    id: 'ls-d2', title: 'Fire extinguisher visual inspection overdue — Desert Springs, 28 units',
    description: 'Monthly fire extinguisher visual inspection for March has not been completed at Desert Springs. 28 extinguishers across 2 wings and common areas require visual check of pressure gauge, pin/seal, physical condition, and signage. The inspection was due March 1 — now 14 days overdue. February inspection was completed on time by maintenance tech Carlos Rivera. Carlos has been on PTO since March 10 (family emergency) and no backup was assigned for life safety inspections during his absence.',
    priority: 'high', agent: 'Life Safety Agent', confidence: 0.95, governanceLevel: 2,
    facility: facilityMap['f4']?.name,
    recommendation: 'Assign backup maintenance tech (Jorge Hernandez, available today) to complete all 28 extinguisher inspections before end of shift. The inspection takes approximately 90 minutes using the facility\'s extinguisher location map. Tag each unit with March inspection date. Document Carlos Rivera\'s absence as reason for delay in the Life Safety Management binder. Going forward: establish backup assignment protocol for all life safety inspections when primary tech is unavailable.',
    impact: 'NFPA 10 requires monthly visual inspections. State fire marshal or CMS surveyor would cite this as deficiency. Each uninspected extinguisher is a separate finding. 28 findings = Pattern-level deficiency with accelerated correction timeline.',
    evidence: [{ label: 'Inspection log', detail: 'February completed 2/28 by Carlos Rivera. March: not started as of 3/15' }, { label: 'Extinguisher inventory', detail: '28 units: 18 ABC dry chemical, 6 CO2 (kitchen/electrical), 4 K-class (kitchen)' }, { label: 'Staffing gap', detail: 'Carlos Rivera PTO since 3/10, no backup assigned for life safety duties' }],
  },
  {
    id: 'ls-d3', title: 'Fire alarm panel test blocked by WO-001 repair — Desert Springs',
    description: 'The monthly fire alarm system test was due March 14 and cannot be completed until the Notifier NFS2-3030 ground fault in B-Wing is repaired (WO-001). The test requires all zones to be functional — running the test with an active ground fault would produce invalid results and potentially lock out the B-Wing zone entirely. ABC Electric is scheduled for repair pending COI waiver approval (separate maintenance decision). Once the panel is repaired, the alarm test can be conducted the same day — estimated 2 hours for full system walk-test of 48 detection devices and 12 notification appliances.',
    priority: 'high', agent: 'Life Safety Agent', confidence: 0.93, governanceLevel: 2,
    facility: facilityMap['f4']?.name,
    recommendation: 'Approve alarm test immediately following WO-001 panel repair completion. Alert monitoring company (ADT, account #DS-2026-4421) to expect test signals on repair day. Have maintenance director present during walk-test to verify all 48 detection devices and 12 notification appliances respond correctly. If repair extends beyond March 21: document impairment and alternative monitoring measures per NFPA 72.',
    impact: 'Monthly alarm test is required by NFPA 72 and CMS Life Safety Code. Combined with overdue fire drill and extinguisher inspection, Desert Springs now has 3 life safety deficiencies — this pattern would be flagged as systemic failure during survey. Concentrated corrective action after WO-001 repair is essential.',
    evidence: [{ label: 'Test schedule', detail: 'Monthly test due 3/14, blocked by WO-001 panel fault since 3/13' }, { label: 'System scope', detail: '48 detection devices (smoke/heat), 12 notification appliances (horns/strobes), 2 zones' }, { label: 'ADT monitoring', detail: 'Account #DS-2026-4421, must be notified before test to prevent false dispatch' }],
  },
  {
    id: 'ls-d4', title: 'Quarterly fire drill due today — Bayview, all shifts required',
    description: 'Bayview Rehabilitation\'s Q1 2026 fire drill is scheduled for today (March 15). Drill coordinator is Safety Officer Kevin Park. The drill plan covers all 3 floors (107 residents) with a simulated fire in the 2nd floor utility room. Day shift drill at 10:00 AM, evening shift at 3:30 PM, night shift at 11:00 PM. Bayview has had zero fire drill deficiencies in 4 consecutive years. Last quarter\'s drill identified one issue: 2nd floor stairwell C door took 8 seconds to close (standard: <5 seconds) — this was corrected by replacing the door closer in December.',
    priority: 'medium', agent: 'Life Safety Agent', confidence: 0.90, governanceLevel: 1,
    facility: facilityMap['f5']?.name,
    recommendation: 'Confirm drill coordinator Kevin Park and all shift charge nurses are prepared. Pre-drill checklist: (1) Verify stairwell C door closer repair from December is holding (<5 second close time), (2) Ensure all staff have current fire response assignments posted, (3) Portable radios charged for drill communication, (4) Post-drill debrief within 1 hour of each shift drill. Documentation form pre-filled in Life Safety binder.',
    impact: 'On-time completion maintains Bayview\'s 4-year clean record on fire drills. CMS surveyors specifically check drill documentation during standard surveys — Bayview\'s next survey window opens in May 2026.',
    evidence: [{ label: 'Drill plan', detail: 'Simulated fire 2nd floor utility room, 3 shifts, 107 residents, coordinator Kevin Park' }, { label: 'Prior drill', detail: 'Q4 2025 completed on schedule, 1 finding (stairwell C door) corrected Dec 2025' }, { label: 'Survey timeline', detail: 'Last survey Sep 2025 — next window opens May 2026 (8-month minimum cycle)' }],
  },
];

const typeLabels = {
  'fire-drill': 'Fire Drill',
  'sprinkler-inspection': 'Sprinkler Inspection',
  'extinguisher-check': 'Extinguisher Check',
  'generator-test': 'Generator Test',
  'exit-light': 'Exit Light Check',
  'alarm-test': 'Alarm Test',
};

const columns = [
  { key: 'type', label: 'Type', render: (v) => typeLabels[v] || v },
  { key: 'facilityId', label: 'Facility', render: (v) => facilityMap[v]?.name || v },
  { key: 'scheduledDate', label: 'Scheduled' },
  { key: 'completedDate', label: 'Completed', render: (v) => v || '—' },
  { key: 'result', label: 'Result', render: (v) => v ? <span className={`text-xs font-semibold ${v === 'pass' ? 'text-green-600' : v === 'fail' ? 'text-red-600' : 'text-amber-600'}`}>{v.toUpperCase()}</span> : '—' },
  { key: 'inspector', label: 'Inspector', render: (v) => v || '—' },
  { key: 'status', label: 'Status', render: (v) => <StatusBadge status={v === 'overdue' ? 'exception' : v === 'due-today' ? 'pending' : v === 'completed' ? 'completed' : 'in-progress'} /> },
];

export default function LifeSafety() {
  const { decisions, approve, escalate } = useDecisionQueue(lifeSafetyDecisions);

  const stats = [
    { label: 'Inspections Current', value: lifeSafetySummary.completed, icon: Shield, color: 'emerald' },
    { label: 'Overdue', value: lifeSafetySummary.overdue, change: lifeSafetySummary.overdue > 0 ? 'Immediate action needed' : 'All current', changeType: lifeSafetySummary.overdue > 0 ? 'negative' : 'positive', icon: AlertTriangle, color: 'red' },
    { label: 'Fire Drills Done', value: `${fireDrillsDone}/${fireDrills.length}`, icon: Flame, color: 'amber' },
    { label: 'Generator Tests', value: `${generatorsDone}/${generatorTests.length}`, change: lifeSafetyInspections.filter(i => i.type === 'generator-test' && i.result === 'fail').length > 0 ? '1 failure' : 'All passed', changeType: lifeSafetyInspections.filter(i => i.type === 'generator-test' && i.result === 'fail').length > 0 ? 'negative' : 'positive', icon: Zap, color: 'purple' },
    { label: 'Exit Lights OK', value: `${exitLightsOk}/${exitLights.length}`, icon: DoorOpen, color: 'blue' },
    { label: 'Next Drill Due', value: nextDrill ? nextDrill.scheduledDate.slice(5) : 'None', change: nextDrill ? (facilityMap[nextDrill.facilityId]?.name || nextDrill.facilityId) : '', icon: CalendarClock, color: 'cyan' },
  ];

  return (
    <div className="p-6">
      <PageHeader
        title="Life Safety Compliance"
        subtitle="Fire drills, inspections, generator tests, and emergency equipment"
        aiSummary={`${lifeSafetySummary.overdue} overdue items — all at Las Vegas Desert Springs. Fire drill 10 days past due, fire extinguisher check and alarm test also overdue. ${lifeSafetySummary.failures} equipment test failures this period. CMS citation risk is elevated.`}
        riskLevel={lifeSafetySummary.overdue > 0 ? 'high' : 'low'}
      />
      <AgentSummaryBar
        agentName="Maintenance Agent"
        summary={`Tracking ${lifeSafetySummary.total} life safety items. ${lifeSafetySummary.completed} completed, ${lifeSafetySummary.overdue} overdue, ${lifeSafetySummary.dueToday} due today. Las Vegas has 3 overdue items.`}
        itemsProcessed={lifeSafetySummary.total}
        exceptionsFound={lifeSafetySummary.overdue + lifeSafetySummary.failures}
        timeSaved="1.5 hrs"
      />

      <div className="mb-6"><StatGrid stats={stats} columns={6} /></div>

      <div className="mb-6">
        <DecisionQueue decisions={decisions} onApprove={approve} onEscalate={escalate} title="Life Safety Decisions" badge={decisions.length} />
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">All Life Safety Items</h3>
        <DataTable columns={columns} data={lifeSafetyInspections} searchable pageSize={10} />
      </div>
    </div>
  );
}
