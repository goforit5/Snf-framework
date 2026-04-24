// DecisionDetail — decision detail pane with navigate-to-page chip

import { LabelSmall, priorityColor, Breadcrumbs } from './shared';
import { DOMAINS as DOMAIN_DATA } from '../data/domains';

const DOMAIN_PAGE_MAP = {
  clinical:   'Clinical Command',
  finance:    'Billing & Claims',
  workforce:  'Workforce Command',
  operations: 'Facility Command',
  admissions: 'Census Command',
  quality:    'Quality Command',
  legal:      'Legal Command',
  strategic:  'M&A Pipeline',
};

export default function DecisionDetail({ d, onNavTo, onNavToRecord, queue }) {
  const { approve, escalate, defer, actionLog } = queue;
  const actionStatus = d._status;
  const isPending = actionStatus === 'pending';
  const logEntry = actionLog?.[d.id];

  const domainId = d.domain || 'home';
  const deepPage = DOMAIN_PAGE_MAP[domainId] || null;
  const deepLink = deepPage ? { domain: domainId, page: deepPage } : null;

  const impactPills = [
    d.impact?.dollars != null && { k: `$${d.impact.dollars.toLocaleString()}`, v: d.impact.unit || '' },
    d.impact?.citation && { k: d.impact.citation, v: 'citation risk' },
    d.impact?.time_days && { k: `${d.impact.time_days}d`, v: 'window' },
    d.impact?.probability && { k: `${Math.round(d.impact.probability * 100)}%`, v: 'probability' },
  ].filter(Boolean);
  const pc = priorityColor(d.priority);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* toolbar */}
      <div style={{ padding: '10px 24px', borderBottom: '1px solid var(--line)', display: 'flex', alignItems: 'center', gap: 10, minHeight: 44 }}>
        <Breadcrumbs items={['Home', 'Decisions', d.id]} onNavigate={(i) => { if (i === 0) onNavTo('home', null); }} />
        <span style={{ flex: 1 }} />
        {deepLink && (
          <>
            <button onClick={() => onNavTo(deepLink.domain, deepLink.page)} style={{
              all: 'unset', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
              padding: '5px 10px', borderRadius: 6, border: '1px solid var(--line)',
              background: 'var(--surface)', fontSize: 11.5, color: 'var(--accent)', fontWeight: 500,
            }}>
              <svg aria-hidden="true" width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 2h5v5M8 2L3 7"/></svg>
              {deepLink.page}
            </button>
            {(() => {
              const domData = DOMAIN_DATA.find((dd) => dd.id === domainId);
              const firstRecord = domData?.records?.[0];
              if (!firstRecord) return null;
              return (
                <button onClick={() => onNavToRecord(domainId, firstRecord)} style={{
                  all: 'unset', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                  padding: '5px 10px', borderRadius: 6, border: '1px solid var(--line)',
                  background: 'var(--surface)', fontSize: 11.5, color: 'var(--ink-2)', fontWeight: 500,
                }}>
                  <svg aria-hidden="true" width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="5" cy="5" r="3"/></svg>
                  View records
                </button>
              );
            })()}
          </>
        )}
      </div>

      <div style={{ overflow: 'auto', flex: 1, padding: '22px 32px 0' }}>
        <div style={{ fontSize: 11.5, color: 'var(--ink-3)', marginBottom: 6 }}>{d.facility}</div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 8 }}>
          <span style={{ fontSize: 10.5, fontWeight: 600, color: pc, textTransform: 'uppercase', letterSpacing: .4 }}>{d.priority}</span>
          <span className="mono" style={{ fontSize: 11, color: 'var(--ink-3)' }}>{d.id}</span>
          <span style={{ fontSize: 11, color: 'var(--ink-3)' }}>&middot; opened {d.since} ago</span>
        </div>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 600, letterSpacing: -0.5, fontFamily: 'var(--font-display)', lineHeight: 1.2 }}>{d.title}</h1>
        <p style={{ margin: '10px 0 18px', fontSize: 14, lineHeight: 1.55, color: 'var(--ink-2)', maxWidth: 640 }}>{d.one_line}</p>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 22 }}>
          {impactPills.map((p, i) => (
            <div key={i} style={{ padding: '8px 12px', background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 8, minWidth: 80 }}>
              <div className="tnum" style={{ fontSize: 15, fontWeight: 600, letterSpacing: -0.2 }}>{p.k}</div>
              <div style={{ fontSize: 10.5, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: .3, fontWeight: 500 }}>{p.v}</div>
            </div>
          ))}
        </div>

        <LabelSmall as="h2">Agent recommendation</LabelSmall>
        <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 10, padding: '12px 14px', marginBottom: 20 }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6, fontSize: 12 }}>
            <svg aria-hidden="true" width="14" height="14" viewBox="0 0 12 12" fill="none" stroke="var(--violet)" strokeWidth="1.4"><rect x="2" y="3" width="8" height="7" rx="1.5"/><path d="M6 1v2" strokeLinecap="round"/></svg>
            <span style={{ fontWeight: 600 }}>{d.agent}</span>
            <span style={{ color: 'var(--ink-3)' }}>&middot; {Math.round(d.confidence * 100)}% confidence</span>
          </div>
          <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.55 }}>{d.rec}</p>
        </div>

        {isPending && d.nextSteps && d.nextSteps.length > 0 && (
          <>
            <LabelSmall as="h2">If approved</LabelSmall>
            <div style={{ background: 'var(--accent-weak)', border: '1px solid var(--accent)', borderRadius: 10, padding: '12px 14px', marginBottom: 20 }}>
              {d.nextSteps.map((step, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'baseline', fontSize: 12.5, color: 'var(--ink-2)', marginBottom: i < d.nextSteps.length - 1 ? 6 : 0 }}>
                  <span style={{ color: 'var(--accent)', fontWeight: 600, flexShrink: 0 }}>{i + 1}.</span>
                  <span>{step}</span>
                </div>
              ))}
            </div>
          </>
        )}

        <LabelSmall as="h2">Evidence pulled</LabelSmall>
        <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 10, marginBottom: 24, overflow: 'hidden' }}>
          {d.evidence.map((r, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr auto', padding: '10px 14px', gap: 12, borderTop: i ? '1px solid var(--line-soft)' : 'none', fontSize: 12.5 }}>
              <span style={{ fontWeight: 500 }}>{r[0]}</span>
              <span className="tnum" style={{ color: 'var(--ink-2)' }}>{r[1]}</span>
              <span style={{ color: 'var(--ink-3)', fontSize: 11 }}>{r[2]}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Action buttons with feedback */}
      <div style={{ padding: '12px 24px', borderTop: '1px solid var(--line)', display: 'flex', gap: 10 }}>
        {isPending ? (
          <>
            <button onClick={() => approve(d.id)} style={{ all: 'unset', cursor: 'pointer', padding: '8px 14px', borderRadius: 8, background: 'var(--accent)', color: 'var(--ink-on-accent)', fontSize: 13, fontWeight: 600 }}>Approve recommendation &#x21B5;</button>
            <button onClick={() => escalate(d.id)} style={{ all: 'unset', cursor: 'pointer', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--line)', background: 'var(--surface)', fontSize: 13, fontWeight: 500 }}>Escalate <span style={{ fontSize: 10, opacity: 0.7, marginLeft: 4, fontFamily: 'var(--font-mono)' }}>E</span></button>
            <button onClick={() => defer(d.id)} style={{ all: 'unset', cursor: 'pointer', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--line)', background: 'var(--surface)', fontSize: 13, fontWeight: 500 }}>Defer <span style={{ fontSize: 10, opacity: 0.7, marginLeft: 4, fontFamily: 'var(--font-mono)' }}>D</span></button>
          </>
        ) : (
          <div aria-live="polite" style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', borderRadius: 8,
              background: actionStatus === 'approved' ? 'var(--green)' : actionStatus === 'escalated' ? 'var(--amber)' : 'var(--ink-3)',
              color: 'var(--ink-on-accent)', fontSize: 13, fontWeight: 600,
            }}>
              {actionStatus === 'approved' && '\u2713 Approved'}
              {actionStatus === 'escalated' && '\u26A1 Escalated'}
              {actionStatus === 'deferred' && '\u23F8 Deferred'}
              {logEntry && (
                <span style={{ fontWeight: 400, opacity: 0.85, fontSize: 12, marginLeft: 4 }}>
                  &middot; {new Date(logEntry.at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                </span>
              )}
            </div>
            {actionStatus === 'approved' && d.nextSteps && d.nextSteps.length > 0 && (
              <div style={{ fontSize: 12, color: 'var(--ink-3)', padding: '0 2px' }}>
                Next: {d.nextSteps[0]}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
