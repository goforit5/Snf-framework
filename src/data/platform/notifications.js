// System notifications

export const notifications = [
  { id: 'notif-001', type: 'critical', title: 'RN License Expiring Today', message: 'Sarah Mitchell\'s RN license expires March 15. No renewal application on file. 12 shifts scheduled next week.', agentId: 'hr-compliance-agent', facilityId: 'f1', timestamp: '2026-03-15T04:00:00Z', read: false, dismissed: false, actionUrl: '/clinical-compliance' },
  { id: 'notif-002', type: 'critical', title: 'Repeat Faller Alert', message: 'Margaret Chen (Room 214B) — 3rd fall in 30 days. Care plan review and family notification required.', agentId: 'clinical-monitoring-agent', facilityId: 'f4', timestamp: '2026-03-14T06:22:00Z', read: false, dismissed: false, actionUrl: '/clinical' },
  { id: 'notif-003', type: 'critical', title: 'Fire Alarm Panel Fault', message: 'Intermittent fault on B-wing fire alarm panel at Las Vegas Desert Springs. Repair in progress.', agentId: 'life-safety-agent', facilityId: 'f4', timestamp: '2026-03-14T22:15:00Z', read: false, dismissed: false, actionUrl: '/facility-admin' },
  { id: 'notif-004', type: 'decision-required', title: 'Agency Spend Over Budget', message: 'Las Vegas facility agency spend at 167% of monthly budget. 18 agency shifts this week. Approve continuation or implement alternative staffing plan.', agentId: 'payroll-audit-agent', facilityId: 'f4', timestamp: '2026-03-14T08:00:00Z', read: false, dismissed: false, actionUrl: '/payroll' },
  { id: 'notif-005', type: 'decision-required', title: 'Sysco Price Increase +18%', message: 'Sysco paper goods category increased 18% vs contract. Contract allows max 5% annual escalation. Dispute recommended.', agentId: 'procurement-agent', facilityId: null, timestamp: '2026-03-14T07:45:00Z', read: false, dismissed: false, actionUrl: '/exception-queue' },
  { id: 'notif-006', type: 'decision-required', title: 'Unknown Vendor Invoice', message: 'Invoice $15,600 from Unknown Vendor LLC — not in master file. Requires vendor onboarding or rejection.', agentId: 'ap-processing-agent', facilityId: 'f2', timestamp: '2026-03-14T08:12:00Z', read: true, dismissed: false, actionUrl: '/invoice-exceptions' },
  { id: 'notif-007', type: 'agent-update', title: 'Morning Invoice Batch Complete', message: 'Processed 47 invoices. 41 auto-approved, 6 exceptions generated. Estimated time saved: 6.2 hours.', agentId: 'ap-processing-agent', facilityId: null, timestamp: '2026-03-15T08:00:00Z', read: false, dismissed: false, actionUrl: '/ap-operations' },
  { id: 'notif-008', type: 'agent-update', title: 'Clinical Scan Complete', message: 'Reviewed 729 resident records across 8 facilities. 5 high-risk alerts generated. 2 require DON review.', agentId: 'clinical-monitoring-agent', facilityId: null, timestamp: '2026-03-15T06:00:00Z', read: false, dismissed: false, actionUrl: '/clinical' },
  { id: 'notif-009', type: 'agent-update', title: 'Payroll Audit Complete', message: 'Audited 892 timecards. 42 exceptions detected. $3,450 in corrections identified. 6 auto-resolved.', agentId: 'payroll-audit-agent', facilityId: null, timestamp: '2026-03-15T05:00:00Z', read: false, dismissed: false, actionUrl: '/payroll' },
  { id: 'notif-010', type: 'info', title: 'Survey Window Alert', message: 'State survey expected within next 2 weeks for Denver Meadows based on 16-month cycle.', agentId: 'survey-readiness-agent', facilityId: 'f2', timestamp: '2026-03-14T04:00:00Z', read: true, dismissed: false, actionUrl: '/survey-readiness' },
  { id: 'notif-011', type: 'info', title: 'Contract Expiring', message: 'Southwest Physical Therapy Group contract expires March 31. Auto-renewal pending approval.', agentId: 'contract-management-agent', facilityId: null, timestamp: '2026-03-14T09:00:00Z', read: true, dismissed: false, actionUrl: '/finance' },
  { id: 'notif-012', type: 'info', title: 'New Hire Starting Monday', message: 'Amanda Foster (CNA) starts at Las Vegas Desert Springs on March 17. Onboarding checklist 42% complete.', agentId: 'hr-onboarding-agent', facilityId: 'f4', timestamp: '2026-03-14T10:00:00Z', read: true, dismissed: false, actionUrl: '/facility-admin' },
  { id: 'notif-013', type: 'decision-required', title: 'Claim Appeal Deadline', message: 'Medicare claim MCA-2026-00453 appeal deadline April 14. Denial reason: medical necessity. $13,440 at stake.', agentId: 'revenue-cycle-agent', facilityId: 'f2', timestamp: '2026-03-15T07:00:00Z', read: false, dismissed: false, actionUrl: '/finance' },
  { id: 'notif-014', type: 'agent-update', title: 'Supply Reorder Triggered', message: 'Auto-reorder placed for Las Vegas Desert Springs: gloves (80 boxes), wound care kits (25), incontinence briefs (16 cases).', agentId: 'supply-chain-agent', facilityId: 'f4', timestamp: '2026-03-14T14:00:00Z', read: true, dismissed: false, actionUrl: '/facility-admin' },
  { id: 'notif-015', type: 'critical', title: 'Generator Failure', message: 'Tucson Desert Bloom generator auto-start failed test. Backup power unreliable. Emergency repair scheduled.', agentId: 'life-safety-agent', facilityId: 'f8', timestamp: '2026-03-12T16:00:00Z', read: true, dismissed: false, actionUrl: '/facility-admin' },
];

export const notificationSummary = {
  total: notifications.length,
  unread: notifications.filter(n => !n.read).length,
  critical: notifications.filter(n => n.type === 'critical').length,
  decisionsRequired: notifications.filter(n => n.type === 'decision-required').length,
  agentUpdates: notifications.filter(n => n.type === 'agent-update').length,
  info: notifications.filter(n => n.type === 'info').length,
};
