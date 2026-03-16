import { useState } from 'react';
import { Shield, DollarSign, AlertTriangle, Clock, Activity, TrendingDown } from 'lucide-react';
import { PageHeader, Card, PriorityBadge, StatusBadge } from '../../components/Widgets';
import { AgentSummaryBar } from '../../components/AgentComponents';
import { StatGrid, DataTable } from '../../components/DataComponents';
import { DecisionQueue } from '../../components/DecisionComponents';

const claims = [
  { id: 'wc-001', employee: 'Angela Torres', facility: 'Sunrise Senior Living', injuryDate: '2026-03-08', type: 'Back strain — patient transfer', status: 'open', reserves: 18500, lostDays: 5, returnToWork: null, priority: 'high' },
  { id: 'wc-002', employee: 'James Brown', facility: 'Meadowbrook Care', injuryDate: '2026-03-02', type: 'Slip and fall — wet floor', status: 'open', reserves: 8200, lostDays: 3, returnToWork: '2026-03-12', priority: 'medium' },
  { id: 'wc-003', employee: 'Keisha Brown', facility: 'Heritage Oaks SNF', injuryDate: '2026-02-25', type: 'Needlestick injury', status: 'open', reserves: 4500, lostDays: 0, returnToWork: '2026-02-26', priority: 'medium' },
  { id: 'wc-004', employee: 'Nathan Scott', facility: 'Cedar Ridge SNF', injuryDate: '2026-02-18', type: 'Shoulder injury — patient repositioning', status: 'open', reserves: 22000, lostDays: 10, returnToWork: null, priority: 'high' },
  { id: 'wc-005', employee: 'Jason Lee', facility: 'Desert Springs SNF', injuryDate: '2026-01-20', type: 'Chemical exposure — cleaning agent', status: 'under-review', reserves: 6800, lostDays: 2, returnToWork: '2026-01-24', priority: 'low' },
  { id: 'wc-006', employee: 'Donna Williams', facility: 'Meadowbrook Care', injuryDate: '2026-01-10', type: 'Repetitive strain — documentation', status: 'closed', reserves: 3200, lostDays: 0, returnToWork: '2026-01-10', priority: 'low' },
];

const openClaims = claims.filter(c => c.status !== 'closed');
const totalReserves = claims.filter(c => c.status !== 'closed').reduce((s, c) => s + c.reserves, 0);
const totalLostDays = claims.reduce((s, c) => s + c.lostDays, 0);
const returnedCount = claims.filter(c => c.returnToWork).length;

export default function WorkersComp() {
  const stats = [
    { label: 'Open Claims', value: openClaims.length, icon: Shield, color: 'red' },
    { label: 'Total Reserves', value: `$${(totalReserves / 1000).toFixed(1)}K`, icon: DollarSign, color: 'amber' },
    { label: 'OSHA Rate', value: '3.2', icon: Activity, color: 'purple', change: 'Industry avg: 4.1', changeType: 'positive' },
    { label: 'Lost Work Days', value: totalLostDays, icon: Clock, color: 'red', change: 'YTD', changeType: 'neutral' },
    { label: 'Return to Work %', value: `${Math.round((returnedCount / claims.length) * 100)}%`, icon: TrendingDown, color: 'emerald' },
    { label: 'Experience Mod', value: '0.92', icon: AlertTriangle, color: 'emerald', change: 'Below 1.0 = favorable', changeType: 'positive' },
  ];

  const decisions = [
    {
      id: 'wc-dec-1', title: 'Angela Torres — back strain, 5 lost days, no RTW date', facility: 'Sunrise Senior Living',
      priority: 'high', agent: 'Risk Management Agent', confidence: 0.91, governanceLevel: 3,
      description: 'CNA back strain during patient transfer on March 8. Currently out of work with no return date. $18,500 in reserves. MRI scheduled for March 18.',
      recommendation: 'Request updated medical report. Schedule modified duty assessment. Engage return-to-work coordinator. Consider ergonomic training for all CNAs at this facility.',
      impact: '$18,500 reserves, 5+ lost days, shift coverage gap',
      evidence: [{ label: 'Incident report', detail: 'Filed 3/8/2026' }, { label: 'Medical records', detail: 'MRI scheduled 3/18' }],
    },
    {
      id: 'wc-dec-2', title: 'Nathan Scott — shoulder injury, 10 lost days', facility: 'Cedar Ridge SNF',
      priority: 'high', agent: 'Risk Management Agent', confidence: 0.89, governanceLevel: 3,
      description: 'Shoulder injury during patient repositioning Feb 18. 10 lost work days. $22,000 reserves — highest open claim. Physical therapy in progress.',
      recommendation: 'Review PT progress report. If improving, establish modified duty start date. If not progressing, request IME (Independent Medical Examination).',
      impact: '$22,000 reserves, 10 lost days, coverage costs',
    },
    {
      id: 'wc-dec-3', title: 'Pattern alert: 2 patient handling injuries in 30 days', facility: 'Multiple',
      priority: 'medium', agent: 'Risk Management Agent', confidence: 0.93, governanceLevel: 2,
      description: 'Two patient handling injuries (back strain, shoulder injury) in 30 days across different facilities. May indicate systemic training gap.',
      recommendation: 'Schedule enterprise-wide patient handling refresher training. Audit mechanical lift equipment availability at all facilities. Review staffing levels during peak lifting times.',
    },
  ];

  const columns = [
    { key: 'employee', label: 'Employee' },
    { key: 'facility', label: 'Facility', render: (v) => <span className="text-xs">{v}</span> },
    { key: 'injuryDate', label: 'Injury Date', render: (v) => <span className="font-mono text-xs">{v}</span> },
    { key: 'type', label: 'Injury Type', render: (v) => <span className="text-xs">{v}</span> },
    { key: 'reserves', label: 'Reserves', render: (v) => <span className="font-mono font-semibold">${v.toLocaleString()}</span> },
    { key: 'lostDays', label: 'Lost Days', render: (v) => <span className={`font-mono font-semibold ${v > 5 ? 'text-red-600' : v > 0 ? 'text-amber-600' : 'text-green-600'}`}>{v}</span> },
    { key: 'status', label: 'Status', render: (v) => <StatusBadge status={v === 'open' ? 'pending' : v === 'under-review' ? 'in-progress' : 'completed'} /> },
  ];

  return (
    <div className="p-6">
      <PageHeader
        title="Workers' Compensation"
        subtitle="Ensign Agentic Framework — Claims & Risk Management"
        aiSummary={`${openClaims.length} open claims totaling $${(totalReserves / 1000).toFixed(1)}K in reserves. ${totalLostDays} lost work days YTD. OSHA rate 3.2 — below industry average of 4.1. Experience mod 0.92 (favorable). Pattern detected: 2 patient handling injuries in 30 days — recommend enterprise-wide refresher training.`}
        riskLevel="medium"
      />

      <AgentSummaryBar
        agentName="Risk Management Agent"
        summary={`monitoring ${claims.length} claims, $${(totalReserves / 1000).toFixed(1)}K in reserves. Pattern analysis detected.`}
        itemsProcessed={claims.length}
        exceptionsFound={2}
        timeSaved="4.1 hrs"
        lastRunTime="6:00 AM"
      />

      <div className="mb-6"><StatGrid stats={stats} columns={6} /></div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <DecisionQueue decisions={decisions} onApprove={() => {}} onEscalate={() => {}} title="Claims Needing Review" badge={decisions.length} />
        <Card title="Claims by Injury Type">
          <div className="space-y-3">
            {[
              { type: 'Patient handling', count: 2, reserves: 40500, color: 'text-red-600' },
              { type: 'Slip and fall', count: 1, reserves: 8200, color: 'text-amber-600' },
              { type: 'Needlestick', count: 1, reserves: 4500, color: 'text-blue-600' },
              { type: 'Chemical exposure', count: 1, reserves: 6800, color: 'text-purple-600' },
              { type: 'Repetitive strain', count: 1, reserves: 3200, color: 'text-gray-600' },
            ].map((t) => (
              <div key={t.type} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div>
                  <p className="text-sm font-medium text-gray-900">{t.type}</p>
                  <p className="text-[10px] text-gray-400">{t.count} claim{t.count > 1 ? 's' : ''}</p>
                </div>
                <span className={`text-sm font-semibold font-mono ${t.color}`}>${t.reserves.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card title="All Claims" badge={`${claims.length}`}>
        <DataTable columns={columns} data={claims} searchable pageSize={10} />
      </Card>
    </div>
  );
}
