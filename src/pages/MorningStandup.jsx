import { Sun, Users, Bed, ArrowUpRight, ArrowDownRight, ArrowLeftRight, AlertTriangle, Clock, UserPlus, UserMinus, Stethoscope, ShieldAlert, Clipboard } from 'lucide-react';
import { morningStandup, facilities } from '../data/mockData';
import { PageHeader, Card, PriorityBadge, StatusBadge } from '../components/Widgets';

export default function MorningStandup() {
  const { censusChanges, newAdmits, dischargesExpected, staffingIssues, criticalItems } = morningStandup;
  const heritageOaks = facilities.find(f => f.id === 'f4');

  return (
    <div className="min-h-screen bg-gray-950 p-6 max-w-5xl mx-auto">
      <PageHeader
        title="Morning Stand-Up Board"
        subtitle={`Heritage Oaks Nursing — ${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}`}
        aiSummary="Census at 94/100 with 3 admissions and 2 discharges expected today. 2 staffing gaps to address. 4 critical items for interdisciplinary discussion — Margaret Chen's repeat falls and the delayed pharmacy delivery are highest priority."
      />

      {/* Census Overview Banner */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
          <Bed size={18} className="text-blue-400 mx-auto mb-2" />
          <p className="text-2xl font-bold text-white">{censusChanges.currentCensus}</p>
          <p className="text-[11px] text-gray-500">Current Census</p>
          <p className="text-[10px] text-gray-600 mt-1">of {censusChanges.capacity} beds</p>
        </div>
        <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4 text-center">
          <UserPlus size={18} className="text-emerald-400 mx-auto mb-2" />
          <p className="text-2xl font-bold text-emerald-400">{censusChanges.admissions}</p>
          <p className="text-[11px] text-gray-500">Admissions</p>
          <p className="text-[10px] text-emerald-500/60 mt-1">Expected today</p>
        </div>
        <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4 text-center">
          <UserMinus size={18} className="text-amber-400 mx-auto mb-2" />
          <p className="text-2xl font-bold text-amber-400">{censusChanges.discharges}</p>
          <p className="text-[11px] text-gray-500">Discharges</p>
          <p className="text-[10px] text-amber-500/60 mt-1">Expected today</p>
        </div>
        <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4 text-center">
          <ArrowLeftRight size={18} className="text-blue-400 mx-auto mb-2" />
          <p className="text-2xl font-bold text-blue-400">{censusChanges.transfers}</p>
          <p className="text-[11px] text-gray-500">Transfers</p>
          <p className="text-[10px] text-blue-500/60 mt-1">Internal moves</p>
        </div>
        <div className="bg-purple-500/5 border border-purple-500/20 rounded-xl p-4 text-center">
          <ArrowUpRight size={18} className="text-purple-400 mx-auto mb-2" />
          <p className="text-2xl font-bold text-purple-400">{censusChanges.currentCensus + censusChanges.admissions - censusChanges.discharges}</p>
          <p className="text-[11px] text-gray-500">Projected EOD</p>
          <p className="text-[10px] text-purple-500/60 mt-1">{((censusChanges.currentCensus + censusChanges.admissions - censusChanges.discharges) / censusChanges.capacity * 100).toFixed(0)}% occupancy</p>
        </div>
      </div>

      {/* Critical Items - Full Width at Top */}
      <Card title="Critical Items for Discussion" badge={`${criticalItems.length}`} className="mb-6">
        <div className="space-y-2">
          {criticalItems.map((item, i) => {
            const isCritical = item.includes('fall') || item.includes('Fire alarm');
            return (
              <div
                key={i}
                className={`flex items-start gap-3 p-3 rounded-lg border ${
                  isCritical
                    ? 'bg-red-500/5 border-red-500/20'
                    : 'bg-amber-500/5 border-amber-500/20'
                }`}
              >
                <AlertTriangle size={14} className={`flex-shrink-0 mt-0.5 ${isCritical ? 'text-red-400' : 'text-amber-400'}`} />
                <p className="text-sm text-gray-200 leading-relaxed">{item}</p>
              </div>
            );
          })}
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* New Admissions */}
        <Card title="New Admissions Today" badge={`${newAdmits.length}`}>
          <div className="space-y-0">
            {/* Table Header */}
            <div className="grid grid-cols-12 gap-2 px-3 py-2 text-[10px] text-gray-500 uppercase tracking-wide border-b border-gray-800">
              <div className="col-span-3">Name</div>
              <div className="col-span-2">Room</div>
              <div className="col-span-2">Payer</div>
              <div className="col-span-3">Diagnosis</div>
              <div className="col-span-2">Arrival</div>
            </div>
            {newAdmits.map((admit, i) => (
              <div key={i} className="grid grid-cols-12 gap-2 px-3 py-3 text-xs border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                <div className="col-span-3 font-medium text-white">{admit.name}</div>
                <div className="col-span-2 text-gray-400">{admit.room}</div>
                <div className="col-span-2">
                  <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                    admit.payer === 'Medicare A' ? 'bg-blue-500/20 text-blue-400' :
                    admit.payer === 'Medicaid' ? 'bg-purple-500/20 text-purple-400' :
                    'bg-emerald-500/20 text-emerald-400'
                  }`}>
                    {admit.payer}
                  </span>
                </div>
                <div className="col-span-3 text-gray-400">{admit.diagnosis}</div>
                <div className="col-span-2 text-gray-300 font-mono">{admit.arrivalTime}</div>
              </div>
            ))}
          </div>
        </Card>

        {/* Expected Discharges */}
        <Card title="Expected Discharges" badge={`${dischargesExpected.length}`}>
          <div className="space-y-0">
            {/* Table Header */}
            <div className="grid grid-cols-12 gap-2 px-3 py-2 text-[10px] text-gray-500 uppercase tracking-wide border-b border-gray-800">
              <div className="col-span-3">Name</div>
              <div className="col-span-2">Room</div>
              <div className="col-span-4">Destination</div>
              <div className="col-span-3">Barriers</div>
            </div>
            {dischargesExpected.map((dc, i) => (
              <div key={i} className="grid grid-cols-12 gap-2 px-3 py-3 text-xs border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                <div className="col-span-3 font-medium text-white">{dc.name}</div>
                <div className="col-span-2 text-gray-400">{dc.room}</div>
                <div className="col-span-4 text-gray-400">{dc.destination}</div>
                <div className="col-span-3">
                  {dc.barriers === 'None' ? (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400">Clear</span>
                  ) : (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400">{dc.barriers}</span>
                  )}
                </div>
              </div>
            ))}
            {dischargesExpected.length < 3 && (
              <div className="px-3 py-3 text-center">
                <p className="text-[11px] text-gray-600">No additional discharges expected</p>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Staffing Issues */}
      <Card title="Staffing Issues" badge={`${staffingIssues.length}`} className="mb-6">
        <div className="space-y-0">
          <div className="grid grid-cols-12 gap-2 px-3 py-2 text-[10px] text-gray-500 uppercase tracking-wide border-b border-gray-800">
            <div className="col-span-2">Shift</div>
            <div className="col-span-2">Role</div>
            <div className="col-span-2">Unit</div>
            <div className="col-span-4">Issue</div>
            <div className="col-span-2">Status</div>
          </div>
          {staffingIssues.map((issue, i) => (
            <div key={i} className="grid grid-cols-12 gap-2 px-3 py-3 text-xs border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
              <div className="col-span-2 text-gray-300 font-mono text-[11px]">{issue.shift}</div>
              <div className="col-span-2 font-medium text-white">{issue.role}</div>
              <div className="col-span-2 text-gray-400">{issue.unit}</div>
              <div className="col-span-4 text-gray-400">{issue.issue}</div>
              <div className="col-span-2">
                <StatusBadge status={issue.issue.includes('agency') ? 'approved' : 'pending'} />
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Footer */}
      <div className="mt-8 pt-4 border-t border-gray-800 flex items-center justify-between">
        <p className="text-[11px] text-gray-600">
          Heritage Oaks Nursing — Morning Interdisciplinary Stand-Up
        </p>
        <p className="text-[11px] text-gray-600">
          Generated {new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })} by SNF Operating System
        </p>
      </div>
    </div>
  );
}
