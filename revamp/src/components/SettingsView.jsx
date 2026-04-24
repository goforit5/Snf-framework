// SettingsView — Apple System Preferences style settings page.

import { useState } from 'react';
import { ROLES } from '../data';
import { AGENTS } from '../agents-data';
import { FACILITIES } from '../data/facilities';

/* ─── Section wrapper ─── */
function SettingsSection({ title, children }) {
  return (
    <div style={{ marginBottom: 32 }}>
      <div style={{
        fontSize: 10.5, color: 'var(--ink-3)', fontWeight: 600,
        textTransform: 'uppercase', letterSpacing: 0.5,
        marginBottom: 10,
      }}>{title}</div>
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--line)',
        borderRadius: 'var(--r-2)', overflow: 'hidden',
      }}>
        {children}
      </div>
    </div>
  );
}

/* ─── Row ─── */
function Row({ label, value, last }) {
  return (
    <div style={{
      padding: '10px 16px',
      borderBottom: last ? 'none' : '1px solid var(--line-soft, var(--line))',
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      fontSize: 12.5,
    }}>
      <span style={{ color: 'var(--ink-1)', fontWeight: 500 }}>{label}</span>
      <span style={{ color: 'var(--ink-3)' }}>{value}</span>
    </div>
  );
}

/* ─── Toggle switch ─── */
function Toggle({ on, onToggle, label }) {
  return (
    <div style={{
      padding: '10px 16px',
      borderBottom: '1px solid var(--line-soft, var(--line))',
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      fontSize: 12.5,
    }}>
      <span style={{ color: 'var(--ink-1)', fontWeight: 500 }}>{label}</span>
      <button onClick={onToggle} style={{
        all: 'unset', cursor: 'pointer',
        width: 40, height: 22, borderRadius: 'var(--r-pill)',
        background: on ? 'var(--accent)' : 'var(--line)',
        position: 'relative',
        transition: 'background .2s',
      }}>
        <span style={{
          position: 'absolute', top: 2, left: on ? 20 : 2,
          width: 18, height: 18, borderRadius: 9,
          background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,.2)',
          transition: 'left .2s',
        }} />
      </button>
    </div>
  );
}

/* ─── Integration status pill ─── */
function IntegrationRow({ name, status, last }) {
  const styles = {
    connected:      { bg: 'var(--green-bg)', color: 'var(--green)', label: 'Connected' },
    pending:        { bg: 'var(--amber-bg)', color: 'var(--amber)', label: 'Pending' },
    'not configured': { bg: 'var(--surface-2, var(--surface))', color: 'var(--ink-3)', label: 'Not Configured' },
  };
  const s = styles[status] || styles['not configured'];
  return (
    <div style={{
      padding: '10px 16px',
      borderBottom: last ? 'none' : '1px solid var(--line-soft, var(--line))',
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      fontSize: 12.5,
    }}>
      <span style={{ color: 'var(--ink-1)', fontWeight: 500 }}>{name}</span>
      <span style={{
        fontSize: 10.5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.4,
        padding: '2px 8px', borderRadius: 4,
        background: s.bg, color: s.color,
      }}>{s.label}</span>
    </div>
  );
}

const GOVERNANCE_LEVELS = [
  { level: 1, name: 'Full Auto', desc: 'Agent acts without approval' },
  { level: 2, name: 'Notify', desc: 'Agent acts, human notified' },
  { level: 3, name: 'Propose', desc: 'Agent proposes, human approves' },
  { level: 4, name: 'Supervised', desc: 'Human must review before execution' },
  { level: 5, name: 'Manual', desc: 'Human initiates, agent assists' },
  { level: 6, name: 'Locked', desc: 'Human only, agent blocked' },
];

const INTEGRATIONS = [
  { name: 'PointClickCare (PCC)', status: 'pending' },
  { name: 'Workday', status: 'pending' },
  { name: 'Microsoft 365', status: 'not configured' },
  { name: 'CMS / OIG / SAM', status: 'connected' },
  { name: 'AWS Bedrock', status: 'not configured' },
];

export default function SettingsView({ role }) {
  const currentRole = ROLES.find((r) => r.id === role) || ROLES[0];

  const [notifs, setNotifs] = useState({
    critical: true,
    summaries: true,
    briefing: true,
    escalation: true,
  });

  const toggle = (key) => setNotifs((prev) => ({ ...prev, [key]: !prev[key] }));

  return (
    <div style={{
      fontFamily: 'var(--font-text)', color: 'var(--ink-1)',
      padding: '24px 32px', overflow: 'auto', height: '100%',
      maxWidth: 600,
    }}>
      {/* Header */}
      <h1 style={{
        margin: 0, fontSize: 22, fontWeight: 600, letterSpacing: -0.3,
        fontFamily: 'var(--font-display)',
      }}>
        Settings
      </h1>
      <div style={{
        fontSize: 13, color: 'var(--ink-3)', marginTop: 4, marginBottom: 28,
      }}>
        Platform configuration and preferences
      </div>

      {/* Profile */}
      <SettingsSection title="Profile">
        <Row label="Name" value={currentRole.name} />
        <Row label="Title" value={currentRole.title} />
        <Row label="Role" value={currentRole.id} />
        <Row label="Scope" value={currentRole.scope} last />
      </SettingsSection>

      {/* Notification Preferences */}
      <SettingsSection title="Notification Preferences">
        <Toggle label="Critical alerts" on={notifs.critical} onToggle={() => toggle('critical')} />
        <Toggle label="Agent summaries" on={notifs.summaries} onToggle={() => toggle('summaries')} />
        <Toggle label="Daily briefing" on={notifs.briefing} onToggle={() => toggle('briefing')} />
        <div style={{ borderBottom: 'none' }}>
          <Toggle label="Escalation alerts" on={notifs.escalation} onToggle={() => toggle('escalation')} />
        </div>
      </SettingsSection>

      {/* Agent Governance */}
      <SettingsSection title="Agent Governance Levels">
        {GOVERNANCE_LEVELS.map((g, i) => (
          <div key={g.level} style={{
            padding: '10px 16px',
            borderBottom: i < GOVERNANCE_LEVELS.length - 1 ? '1px solid var(--line-soft, var(--line))' : 'none',
            display: 'flex', alignItems: 'center', gap: 12,
            fontSize: 12.5,
          }}>
            <span style={{
              width: 24, height: 24, borderRadius: 6,
              background: 'var(--accent-weak)', color: 'var(--accent)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, fontWeight: 700, flexShrink: 0,
            }}>
              L{g.level}
            </span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, color: 'var(--ink-1)' }}>{g.name}</div>
              <div style={{ fontSize: 11.5, color: 'var(--ink-3)', marginTop: 1 }}>{g.desc}</div>
            </div>
          </div>
        ))}
      </SettingsSection>

      {/* Integrations */}
      <SettingsSection title="Integrations">
        {INTEGRATIONS.map((intg, i) => (
          <IntegrationRow
            key={intg.name}
            name={intg.name}
            status={intg.status}
            last={i === INTEGRATIONS.length - 1}
          />
        ))}
      </SettingsSection>

      {/* Integration CTA */}
      <div style={{
        marginTop: -16, marginBottom: 32, padding: '16px 20px',
        background: 'var(--accent-weak)',
        border: '1px solid var(--accent)',
        borderRadius: 'var(--r-2, 10px)',
      }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--accent)', marginBottom: 4 }}>
          Ready to connect your systems?
        </div>
        <div style={{ fontSize: 12.5, color: 'var(--ink-2)', lineHeight: 1.5, marginBottom: 12 }}>
          With Ensign's PCC and Workday credentials, every decision card in this platform routes real actions — offer letters, DPH filings, care plan updates — without opening another application.
        </div>
        <button style={{
          all: 'unset', cursor: 'pointer',
          padding: '8px 16px', borderRadius: 8,
          background: 'var(--accent)', color: '#fff',
          fontSize: 13, fontWeight: 600,
        }}>
          Schedule credential onboarding
        </button>
      </div>

      {/* About */}
      <SettingsSection title="About">
        <Row label="Version" value="2.0.0" />
        <Row label="Build date" value="2026-04-21" />
        <Row label="Active agents" value={String(AGENTS.length)} />
        <Row label="Facilities" value={String(FACILITIES.length) + ' (demo) / 330 facilities'} last />
      </SettingsSection>
    </div>
  );
}
