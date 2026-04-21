// RecordInspector — universal record detail view.
// Shows entity header, status, related decisions, key fields, and agent activity.

import { useMemo } from 'react';
import { DECISIONS } from '../data';
import { AGENTS } from '../agents-data';
import { LabelSmall, StatusPill, priorityColor } from './shared';

function TypeIcon({ recordType }) {
  const icons = {
    resident:    <path d="M8 8a3 3 0 100-6 3 3 0 000 6zM2 14c0-3 2.7-5 6-5s6 2 6 5"/>,
    invoice:     <><path d="M8 2v12"/><path d="M11 5H6.5a1.5 1.5 0 000 3h3a1.5 1.5 0 010 3H5"/></>,
    staff:       <><circle cx="5.5" cy="6" r="2"/><circle cx="10.5" cy="6" r="2"/><path d="M1.5 13c0-2 1.8-3.3 4-3.3s4 1.3 4 3.3"/></>,
    referral:    <><path d="M4 2h8v12H4z"/><circle cx="10" cy="8" r=".6" fill="currentColor" stroke="none"/></>,
    incident:    <path d="M8 2l5 2v4c0 3.5-2.5 5.5-5 6-2.5-.5-5-2.5-5-6V4z"/>,
    workorder:   <><path d="M3 13l4-4M6 2l3 3-3 3-3-3zM13 9l-4 4-2-2 4-4z"/></>,
    contract:    <><path d="M4 11l5-5M7 4l4 4M2 14h7"/></>,
    opportunity: <><path d="M2 13h12M4 11V7M7 11V4M10 11V8M13 11V6"/></>,
  };
  const p = icons[recordType] || icons.resident;
  return (
    <svg width="20" height="20" viewBox="0 0 16 16" fill="none" stroke="var(--accent)"
      strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
      style={{ flexShrink: 0 }}
    >{p}</svg>
  );
}

/* ─── Key fields by record type ─── */

function getKeyFields(record, recordType) {
  const base = [
    { label: 'Record ID', value: record.id },
    { label: 'Facility', value: record.facility },
  ];

  const typeFields = {
    resident: [
      { label: 'Care Plan', value: record.status === 'critical' ? 'Review required' : 'Current' },
      { label: 'Last Assessment', value: 'Apr 14, 2026' },
      { label: 'Primary Diagnosis', value: 'CHF, mild dementia' },
      { label: 'Fall Risk Tier', value: record.status === 'critical' ? 'High' : 'Moderate' },
    ],
    invoice: [
      { label: 'Amount', value: record.detail.match(/\$[\d.,]+K?/)?.[0] || 'Varies' },
      { label: 'Vendor / Payer', value: record.name.split(' ')[0] },
      { label: 'GL Code', value: '6420-001' },
      { label: 'Match Status', value: record.status === 'stable' ? '3-way matched' : 'Pending review' },
    ],
    staff: [
      { label: 'Role', value: record.name.split(', ')[1] || 'Staff' },
      { label: 'Credential Status', value: record.status === 'critical' ? 'Expiring' : 'Current' },
      { label: 'Hire Date', value: '2019-03-15' },
      { label: 'Training', value: '94% complete' },
    ],
    referral: [
      { label: 'Payer', value: 'Medicare A' },
      { label: 'Diagnosis', value: record.detail.split(', ').slice(1).join(', ') || 'Pending' },
      { label: 'Bed Availability', value: 'Available' },
      { label: 'Clinical Fit', value: 'Good' },
    ],
    incident: [
      { label: 'Date/Time', value: 'Apr 18, 2026 08:14' },
      { label: 'Severity', value: record.status === 'critical' ? 'High' : 'Moderate' },
      { label: 'Injury', value: record.detail.includes('no injury') ? 'None' : 'Minor' },
      { label: 'Root Cause', value: 'Under investigation' },
    ],
    workorder: [
      { label: 'Priority', value: record.status === 'critical' ? 'Emergency' : 'Scheduled' },
      { label: 'Assigned To', value: 'Facilities team' },
      { label: 'Est. Cost', value: '$2,400' },
      { label: 'Target Date', value: 'Apr 22, 2026' },
    ],
    contract: [
      { label: 'Parties', value: record.name },
      { label: 'Value', value: record.detail.match(/\$[\d.,]+K?/)?.[0] || 'Per terms' },
      { label: 'Expiry', value: 'Jun 30, 2026' },
      { label: 'Key Terms', value: record.detail.split(', ').pop() },
    ],
    opportunity: [
      { label: 'Stage', value: record.detail.split(', ').pop() },
      { label: 'Valuation', value: record.detail.match(/\$[\d]+M/)?.[0] || 'TBD' },
      { label: 'Beds', value: record.detail.match(/\d+-bed/)?.[0] || 'TBD' },
      { label: 'Timeline', value: 'Q3 2026' },
    ],
  };

  return [...base, ...(typeFields[recordType] || typeFields.resident)];
}

/* ─── Mock agent activity for a record ─── */

function getAgentActivity(record, domainKey) {
  const domainAgents = AGENTS.filter((a) => a.domain.toLowerCase() === domainKey);
  const primary = domainAgents[0];
  const secondary = domainAgents[1];

  return [
    { agent: primary?.name || 'Monitor Agent', action: `Flagged ${record.id} for review`, time: '2h ago' },
    { agent: secondary?.name || 'Audit Agent', action: `Pulled evidence from source systems`, time: '1h 45m ago' },
    { agent: primary?.name || 'Monitor Agent', action: `Updated risk assessment to ${record.status}`, time: '1h 20m ago' },
  ];
}

/* ─── Main component ─── */

export default function RecordInspector({ record, domainKey, onClose }) {
  if (!record) return null;

  const relatedDecisions = useMemo(() =>
    DECISIONS.filter((d) =>
      d.evidence.some((e) =>
        e.some((field) =>
          typeof field === 'string' && (
            field.includes(record.id) ||
            field.includes(record.name.split(',')[0]) ||
            field.includes(record.name.split(' ').slice(0, 2).join(' '))
          )
        )
      )
    ),
    [record]
  );

  const keyFields = getKeyFields(record, getDomainRecordType(domainKey));
  const activity = getAgentActivity(record, domainKey);

  return (
    <div style={{ overflow: 'auto', padding: '20px 32px 40px', position: 'relative' }}>

      {/* ─── Close / back ─── */}
      <button onClick={onClose} style={{
        all: 'unset', cursor: 'pointer',
        position: 'absolute', top: 20, right: 28,
        width: 28, height: 28, borderRadius: 7,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'var(--surface)', border: '1px solid var(--line)',
        color: 'var(--ink-3)', fontSize: 14,
      }} title="Close">
        &times;
      </button>

      {/* ─── 1. Entity header ─── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
        <TypeIcon recordType={getDomainRecordType(domainKey)} />
        <div>
          <h1 style={{
            margin: 0, fontSize: 22, fontWeight: 600,
            letterSpacing: -0.3, fontFamily: 'var(--font-display)',
          }}>{record.name}</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
            <span className="mono" style={{ fontSize: 11.5, color: 'var(--ink-3)' }}>{record.id}</span>
            <span style={{ fontSize: 11.5, color: 'var(--ink-3)' }}>&middot; {record.facility}</span>
          </div>
        </div>
      </div>

      {/* ─── 2. Status + detail ─── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '10px 0 8px' }}>
        <StatusPill status={record.status} />
      </div>
      <p style={{
        margin: '6px 0 22px', fontSize: 13.5, lineHeight: 1.55,
        color: 'var(--ink-2)', maxWidth: 600,
      }}>{record.detail}</p>

      {/* ─── 3. Related decisions ─── */}
      <LabelSmall>Related decisions</LabelSmall>
      {relatedDecisions.length > 0 ? (
        <div style={{
          background: 'var(--surface)', border: '1px solid var(--line)',
          borderRadius: 10, overflow: 'hidden', marginBottom: 22,
        }}>
          {relatedDecisions.map((d, i) => {
            const pc = priorityColor(d.priority);
            return (
              <div key={d.id} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 14px',
                borderTop: i ? '1px solid var(--line-soft)' : 'none',
              }}>
                <span style={{ width: 6, height: 6, borderRadius: 3, background: pc, flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 600 }}>{d.title}</div>
                  <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>{d.id} &middot; {d.agent} &middot; {d.since}</div>
                </div>
                <span className="tnum" style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--ink-2)' }}>
                  {Math.round(d.confidence * 100)}%
                </span>
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{
          background: 'var(--surface)', border: '1px solid var(--line)',
          borderRadius: 10, padding: '14px', marginBottom: 22,
          fontSize: 12.5, color: 'var(--ink-3)',
        }}>No open decisions reference this record.</div>
      )}

      {/* ─── 4. Key fields ─── */}
      <LabelSmall>Key fields</LabelSmall>
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--line)',
        borderRadius: 10, overflow: 'hidden', marginBottom: 22,
      }}>
        {keyFields.map((f, i) => (
          <div key={f.label} style={{
            display: 'grid', gridTemplateColumns: '140px 1fr',
            padding: '9px 14px', gap: 12,
            borderTop: i ? '1px solid var(--line-soft)' : 'none',
            fontSize: 12.5,
          }}>
            <span style={{ color: 'var(--ink-3)', fontWeight: 500 }}>{f.label}</span>
            <span style={{ color: 'var(--ink-1)', fontWeight: 500 }}>{f.value}</span>
          </div>
        ))}
      </div>

      {/* ─── 5. Agent activity ─── */}
      <LabelSmall>Agent actions on {record.name.split(',')[0]}</LabelSmall>
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--line)',
        borderRadius: 10, overflow: 'hidden',
      }}>
        {activity.map((a, i) => (
          <div key={i} style={{
            display: 'grid', gridTemplateColumns: '1.2fr 1.8fr auto',
            padding: '10px 14px', gap: 12,
            borderTop: i ? '1px solid var(--line-soft)' : 'none',
            fontSize: 12.5,
          }}>
            <span style={{ fontWeight: 600, color: 'var(--violet)' }}>{a.agent}</span>
            <span style={{ color: 'var(--ink-2)' }}>{a.action}</span>
            <span style={{ color: 'var(--ink-3)', fontSize: 11 }}>{a.time}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* Helper to map domainKey -> recordType */
function getDomainRecordType(domainKey) {
  const map = {
    clinical: 'resident', finance: 'invoice', workforce: 'staff',
    admissions: 'referral', quality: 'incident', operations: 'workorder',
    legal: 'contract', strategic: 'opportunity',
  };
  return map[domainKey] || 'resident';
}
