import { Sun, Users, Bed, ArrowUpRight, ArrowDownRight, ArrowLeftRight, AlertTriangle, Clock, UserPlus, UserMinus, Stethoscope, ShieldAlert, Clipboard, Bot } from 'lucide-react';
import { morningStandup, facilities } from '../data/mockData';
import { PageHeader, Card, PriorityBadge, StatusBadge, ClickableRow, useModal, ActionButton } from '../components/Widgets';

export default function MorningStandup() {
  const { open } = useModal();
  const { censusChanges, newAdmits, dischargesExpected, staffingIssues, criticalItems } = morningStandup;
  const heritageOaks = facilities.find(f => f.id === 'f4');

  const criticalItemDetails = [
    {
      summary: 'Margaret Chen (214B) - 3rd fall in 30 days, care conference needed today',
      detail: 'Margaret Chen, 84, experienced her 3rd fall this morning at 0622. She was found on the floor beside her bed by CNA during rounds. No apparent injury — neuro checks initiated per protocol. Previous falls: 2/10 (bathroom), 2/24 (hallway). Current interventions (bed alarm, non-skid footwear, PT 3x/week) are not preventing recurrence.',
      steps: ['Complete post-fall assessment by noon', 'Notify physician and family (daughter Lisa Chen)', 'Schedule IDT care conference for today — mandatory per 3-fall protocol', 'Implement 1:1 aide for high-risk hours (10 PM - 6 AM)', 'Review medications contributing to fall risk (Ambien, Lisinopril)'],
      owner: 'DON Sarah Martinez',
      isCritical: true,
    },
    {
      summary: 'Pharmacy delivery delayed - ETA noon (was 8 AM)',
      detail: 'Morning pharmacy delivery from Omnicare delayed due to distribution center issue. Original ETA was 8:00 AM, revised to noon. Affected: 14 medication changes effective today, 3 new admission medication orders, and routine restocking. Emergency medication cabinet has adequate supply for critical medications.',
      steps: ['Verify emergency cabinet covers all critical medications for next 4 hours', 'Contact Omnicare for firm ETA and escalation if needed', 'Identify any stat medication orders that cannot wait — arrange courier if needed', 'Notify nursing stations of delayed delivery and workaround procedures'],
      owner: 'Pharmacy Coordinator',
      isCritical: false,
    },
    {
      summary: 'State survey expected within next 2 weeks based on cycle',
      detail: 'Based on the annual survey cycle, Heritage Oaks is within the survey window. Last annual survey was March 2025. State typically surveys within a 12-month window with +/- 2 week variability. Current readiness score is 76/100 (target 85+). Two critical F-tag risks (F-689 Falls, F-692 Nutrition) need immediate attention.',
      steps: ['Ensure all "day of survey" binders are current and accessible', 'Complete all overdue documentation (15 assessments, 11 care plans)', 'Brief all department heads on survey readiness gaps', 'Conduct mock survey rounds this week focusing on F-689 and F-692', 'Verify all licenses and certifications are current'],
      owner: 'Administrator + DON',
      isCritical: false,
    },
    {
      summary: 'Fire alarm panel in B-wing showing intermittent fault',
      detail: 'Fire alarm panel in B-Wing has been showing intermittent fault codes for 3 days. ABC Electric (certified Simplex vendor) has the repair on hold due to expired Certificate of Insurance. Temporary fire watch protocol is in place per Life Safety Code — costing $480/day in additional staffing. B-Wing houses 24 residents.',
      steps: ['Decision needed: issue 72-hour COI waiver for ABC Electric for this repair only', 'If waiver not approved, identify alternate certified Simplex vendor (5-7 day lead time)', 'Continue fire watch protocol until repaired', 'Document all fire watch rounds per Life Safety Code requirements', 'Notify state fire marshal if repair extends beyond 7 days'],
      owner: 'Administrator + Maintenance Director',
      isCritical: true,
    },
  ];

  const openCriticalModal = (item, index) => {
    const detail = criticalItemDetails[index];
    open({
      title: 'Critical Item',
      content: (
        <div className="space-y-5">
          <div className={`rounded-xl p-3 border ${detail.isCritical ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'}`}>
            <div className="flex items-start gap-2">
              <AlertTriangle size={14} className={`flex-shrink-0 mt-0.5 ${detail.isCritical ? 'text-red-500' : 'text-amber-500'}`} />
              <p className="text-sm text-gray-900 font-medium">{detail.summary}</p>
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Details</p>
            <p className="text-sm text-gray-700 leading-relaxed">{detail.detail}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Action Steps</p>
            <div className="space-y-2">
              {detail.steps.map((step, i) => (
                <div key={i} className="flex items-start gap-3 p-2.5 bg-gray-50 rounded-lg border border-gray-100">
                  <div className="w-5 h-5 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-[10px] font-bold text-blue-600">{i + 1}</span>
                  </div>
                  <p className="text-sm text-gray-700">{step}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
            <p className="text-xs text-gray-500">Owner: <span className="text-gray-700 font-medium">{detail.owner}</span></p>
          </div>
        </div>
      ),
      actions: (
        <>
          <ActionButton label="Assign" variant="primary" />
          <ActionButton label="Acknowledge" variant="success" />
          <ActionButton label="Dismiss" variant="ghost" />
        </>
      ),
    });
  };

  const openAdmitModal = (admit) => {
    open({
      title: `New Admission: ${admit.name}`,
      content: (
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
              <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-0.5">Room</p>
              <p className="text-sm font-medium text-gray-900">{admit.room}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
              <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-0.5">Arrival</p>
              <p className="text-sm font-medium text-gray-900">{admit.arrivalTime}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
              <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-0.5">Payer</p>
              <p className="text-sm font-medium text-gray-900">{admit.payer}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
              <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-0.5">Diagnosis</p>
              <p className="text-sm font-medium text-gray-900">{admit.diagnosis}</p>
            </div>
          </div>
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Bot size={14} className="text-blue-600" />
              <p className="text-xs font-semibold text-blue-600">Admission Checklist</p>
            </div>
            <ul className="space-y-1.5 text-sm text-gray-700">
              <li className="flex items-center gap-2"><span className="text-green-500">--</span> Room prepared and cleaned</li>
              <li className="flex items-center gap-2"><span className="text-green-500">--</span> Admission paperwork ready</li>
              <li className="flex items-center gap-2"><span className="text-amber-500">--</span> Medication orders pending pharmacy delivery</li>
              <li className="flex items-center gap-2"><span className="text-gray-300">--</span> Initial nursing assessment (on arrival)</li>
              <li className="flex items-center gap-2"><span className="text-gray-300">--</span> Dietary screening (within 24 hrs)</li>
            </ul>
          </div>
        </div>
      ),
      actions: (
        <>
          <ActionButton label="View Full Record" variant="primary" />
          <ActionButton label="Dismiss" variant="ghost" />
        </>
      ),
    });
  };

  const openDischargeModal = (dc) => {
    open({
      title: `Discharge: ${dc.name}`,
      content: (
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
              <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-0.5">Room</p>
              <p className="text-sm font-medium text-gray-900">{dc.room}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
              <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-0.5">Destination</p>
              <p className="text-sm font-medium text-gray-900">{dc.destination}</p>
            </div>
          </div>
          <div className={`rounded-xl p-3 border ${dc.barriers === 'None' ? 'bg-green-50 border-green-100' : 'bg-amber-50 border-amber-100'}`}>
            <p className="text-xs font-semibold mb-1 ${dc.barriers === 'None' ? 'text-green-600' : 'text-amber-600'}">
              {dc.barriers === 'None' ? 'No Barriers — Clear for Discharge' : `Barrier: ${dc.barriers}`}
            </p>
            {dc.barriers !== 'None' && (
              <p className="text-sm text-gray-700">This barrier must be resolved before discharge can proceed. Social work and nursing to coordinate.</p>
            )}
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Discharge Checklist</p>
            <ul className="space-y-1.5 text-sm text-gray-700">
              <li className="flex items-center gap-2"><span className="text-green-500">--</span> Physician discharge order</li>
              <li className="flex items-center gap-2"><span className="text-green-500">--</span> Discharge summary completed</li>
              <li className="flex items-center gap-2"><span className={dc.barriers === 'None' ? 'text-green-500' : 'text-amber-500'}>--</span> Transportation arranged</li>
              <li className="flex items-center gap-2"><span className="text-gray-300">--</span> Medication reconciliation</li>
              <li className="flex items-center gap-2"><span className="text-gray-300">--</span> Patient/family education</li>
            </ul>
          </div>
        </div>
      ),
      actions: (
        <>
          <ActionButton label="Process Discharge" variant="success" />
          <ActionButton label="Dismiss" variant="ghost" />
        </>
      ),
    });
  };

  const openStaffingModal = (issue) => {
    open({
      title: `Staffing: ${issue.role} — ${issue.shift}`,
      content: (
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
              <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-0.5">Unit</p>
              <p className="text-sm font-medium text-gray-900">{issue.unit}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
              <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-0.5">Status</p>
              <StatusBadge status={issue.issue.includes('agency') ? 'approved' : 'pending'} />
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Issue</p>
            <p className="text-sm text-gray-700 leading-relaxed">{issue.issue}</p>
          </div>
          {issue.issue.includes('agency') ? (
            <div className="bg-green-50 border border-green-100 rounded-xl p-4">
              <p className="text-xs font-semibold text-green-600 mb-1">Resolution</p>
              <p className="text-sm text-gray-700">Agency staff confirmed and scheduled. No further action needed unless call-off occurs.</p>
            </div>
          ) : (
            <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
              <p className="text-xs font-semibold text-amber-600 mb-1">Pending Resolution</p>
              <p className="text-sm text-gray-700">Overtime being offered to existing staff. If no takers by 1 PM, agency fill will be requested.</p>
            </div>
          )}
        </div>
      ),
      actions: (
        <>
          <ActionButton label="Approve Agency" variant="success" />
          <ActionButton label="Offer OT" variant="primary" />
          <ActionButton label="Dismiss" variant="ghost" />
        </>
      ),
    });
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <PageHeader
        title="Morning Stand-Up Board"
        subtitle={`Heritage Oaks Nursing — ${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}`}
        aiSummary="Census at 94/100 with 3 admissions and 2 discharges expected today. 2 staffing gaps to address. 4 critical items for interdisciplinary discussion — Margaret Chen's repeat falls and the delayed pharmacy delivery are highest priority."
      />

      {/* Census Overview Banner */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        <div className="bg-white border border-gray-100 rounded-2xl p-4 text-center shadow-sm">
          <Bed size={18} className="text-blue-600 mx-auto mb-2" />
          <p className="text-2xl font-bold text-gray-900">{censusChanges.currentCensus}</p>
          <p className="text-[11px] text-gray-500">Current Census</p>
          <p className="text-[10px] text-gray-400 mt-1">of {censusChanges.capacity} beds</p>
        </div>
        <div className="bg-green-50 border border-green-100 rounded-2xl p-4 text-center">
          <UserPlus size={18} className="text-green-600 mx-auto mb-2" />
          <p className="text-2xl font-bold text-green-600">{censusChanges.admissions}</p>
          <p className="text-[11px] text-gray-500">Admissions</p>
          <p className="text-[10px] text-green-600/60 mt-1">Expected today</p>
        </div>
        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 text-center">
          <UserMinus size={18} className="text-amber-600 mx-auto mb-2" />
          <p className="text-2xl font-bold text-amber-600">{censusChanges.discharges}</p>
          <p className="text-[11px] text-gray-500">Discharges</p>
          <p className="text-[10px] text-amber-600/60 mt-1">Expected today</p>
        </div>
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 text-center">
          <ArrowLeftRight size={18} className="text-blue-600 mx-auto mb-2" />
          <p className="text-2xl font-bold text-blue-600">{censusChanges.transfers}</p>
          <p className="text-[11px] text-gray-500">Transfers</p>
          <p className="text-[10px] text-blue-600/60 mt-1">Internal moves</p>
        </div>
        <div className="bg-white border border-gray-100 rounded-2xl p-4 text-center shadow-sm">
          <ArrowUpRight size={18} className="text-gray-600 mx-auto mb-2" />
          <p className="text-2xl font-bold text-gray-900">{censusChanges.currentCensus + censusChanges.admissions - censusChanges.discharges}</p>
          <p className="text-[11px] text-gray-500">Projected EOD</p>
          <p className="text-[10px] text-gray-400 mt-1">{((censusChanges.currentCensus + censusChanges.admissions - censusChanges.discharges) / censusChanges.capacity * 100).toFixed(0)}% occupancy</p>
        </div>
      </div>

      {/* Critical Items */}
      <Card title="Critical Items for Discussion" badge={`${criticalItems.length}`} className="mb-6">
        <div className="space-y-2">
          {criticalItems.map((item, i) => {
            const isCritical = item.includes('fall') || item.includes('Fire alarm');
            return (
              <ClickableRow
                key={i}
                onClick={() => openCriticalModal(item, i)}
                className={isCritical ? '!bg-red-50/50 !border-red-200' : '!bg-amber-50/50 !border-amber-200'}
              >
                <div className="flex items-start gap-3">
                  <AlertTriangle size={14} className={`flex-shrink-0 mt-0.5 ${isCritical ? 'text-red-500' : 'text-amber-500'}`} />
                  <p className="text-sm text-gray-700 leading-relaxed">{item}</p>
                </div>
              </ClickableRow>
            );
          })}
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* New Admissions */}
        <Card title="New Admissions Today" badge={`${newAdmits.length}`}>
          <div className="space-y-0">
            <div className="grid grid-cols-12 gap-2 px-3 py-2 text-[10px] text-gray-400 uppercase tracking-wide border-b border-gray-200">
              <div className="col-span-3">Name</div>
              <div className="col-span-2">Room</div>
              <div className="col-span-2">Payer</div>
              <div className="col-span-3">Diagnosis</div>
              <div className="col-span-2">Arrival</div>
            </div>
            {newAdmits.map((admit, i) => (
              <div
                key={i}
                className="grid grid-cols-12 gap-2 px-3 py-3 text-xs border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer active:bg-gray-100"
                onClick={() => openAdmitModal(admit)}
              >
                <div className="col-span-3 font-medium text-gray-900">{admit.name}</div>
                <div className="col-span-2 text-gray-500">{admit.room}</div>
                <div className="col-span-2">
                  <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                    admit.payer === 'Medicare A' ? 'bg-blue-50 text-blue-600 border border-blue-100' :
                    admit.payer === 'Medicaid' ? 'bg-purple-50 text-purple-600 border border-purple-100' :
                    'bg-green-50 text-green-600 border border-green-100'
                  }`}>
                    {admit.payer}
                  </span>
                </div>
                <div className="col-span-3 text-gray-500">{admit.diagnosis}</div>
                <div className="col-span-2 text-gray-700 font-mono">{admit.arrivalTime}</div>
              </div>
            ))}
          </div>
        </Card>

        {/* Expected Discharges */}
        <Card title="Expected Discharges" badge={`${dischargesExpected.length}`}>
          <div className="space-y-0">
            <div className="grid grid-cols-12 gap-2 px-3 py-2 text-[10px] text-gray-400 uppercase tracking-wide border-b border-gray-200">
              <div className="col-span-3">Name</div>
              <div className="col-span-2">Room</div>
              <div className="col-span-4">Destination</div>
              <div className="col-span-3">Barriers</div>
            </div>
            {dischargesExpected.map((dc, i) => (
              <div
                key={i}
                className="grid grid-cols-12 gap-2 px-3 py-3 text-xs border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer active:bg-gray-100"
                onClick={() => openDischargeModal(dc)}
              >
                <div className="col-span-3 font-medium text-gray-900">{dc.name}</div>
                <div className="col-span-2 text-gray-500">{dc.room}</div>
                <div className="col-span-4 text-gray-500">{dc.destination}</div>
                <div className="col-span-3">
                  {dc.barriers === 'None' ? (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-50 text-green-600 border border-green-100">Clear</span>
                  ) : (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-600 border border-amber-100">{dc.barriers}</span>
                  )}
                </div>
              </div>
            ))}
            {dischargesExpected.length < 3 && (
              <div className="px-3 py-3 text-center">
                <p className="text-[11px] text-gray-400">No additional discharges expected</p>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Staffing Issues */}
      <Card title="Staffing Issues" badge={`${staffingIssues.length}`} className="mb-6">
        <div className="space-y-0">
          <div className="grid grid-cols-12 gap-2 px-3 py-2 text-[10px] text-gray-400 uppercase tracking-wide border-b border-gray-200">
            <div className="col-span-2">Shift</div>
            <div className="col-span-2">Role</div>
            <div className="col-span-2">Unit</div>
            <div className="col-span-4">Issue</div>
            <div className="col-span-2">Status</div>
          </div>
          {staffingIssues.map((issue, i) => (
            <div
              key={i}
              className="grid grid-cols-12 gap-2 px-3 py-3 text-xs border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer active:bg-gray-100"
              onClick={() => openStaffingModal(issue)}
            >
              <div className="col-span-2 text-gray-600 font-mono text-[11px]">{issue.shift}</div>
              <div className="col-span-2 font-medium text-gray-900">{issue.role}</div>
              <div className="col-span-2 text-gray-500">{issue.unit}</div>
              <div className="col-span-4 text-gray-500">{issue.issue}</div>
              <div className="col-span-2">
                <StatusBadge status={issue.issue.includes('agency') ? 'approved' : 'pending'} />
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Footer */}
      <div className="mt-8 pt-4 border-t border-gray-200 flex items-center justify-between">
        <p className="text-[11px] text-gray-400">
          Heritage Oaks Nursing — Morning Interdisciplinary Stand-Up
        </p>
        <p className="text-[11px] text-gray-400">
          Generated {new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })} by Ensign Agentic Framework
        </p>
      </div>
    </div>
  );
}
