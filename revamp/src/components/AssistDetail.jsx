// AssistDetail — right-pane detail for assist domain.
// Matches DecisionDetail structure: toolbar → content → action bar.

import { useState, useRef, useCallback, useMemo } from 'react';
import { ASSIST_SUMMARY, ASSIST_PRESETS } from '../data';
import { StatusPill, AgentDot, LabelSmall, StatCard, priorityColor } from './shared';

const CATEGORY_STYLE = {
  'Bug':             { c: 'var(--red)',    bg: 'var(--red-bg)' },
  'Feature Request': { c: 'var(--violet)', bg: 'var(--violet-bg)' },
  'Improvement':     { c: 'var(--accent)', bg: 'var(--accent-weak)' },
  'Question':        { c: 'var(--ink-3)',  bg: 'var(--surface-2)' },
};

const THREAD_TYPE_LABELS = {
  triage: 'Triage', clarify: 'Question', status: 'Update',
  resolution: 'Resolved', workaround: 'Workaround', ack: 'Noted',
  task: 'Task', education: 'Learn', tip: 'Tip',
};

function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function Breadcrumbs({ items }) {
  return (
    <div style={{ fontSize: 11.5, color: 'var(--ink-3)', display: 'flex', gap: 6, alignItems: 'center' }}>
      {items.map((s, i) => (
        <span key={i} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          {i > 0 && <span style={{ opacity: .5 }}>&rsaquo;</span>}
          <span>{s}</span>
        </span>
      ))}
    </div>
  );
}

/* ─── Detail view (item selected) ─── */
export function AssistItemDetail({ item, assistQueue, role }) {
  const replyRef = useRef(null);

  const handleReply = useCallback(() => {
    if (!replyRef.current) return;
    const text = replyRef.current.value.trim();
    if (!text) return;
    assistQueue.handleReply(item.id, text, role);
    replyRef.current.value = '';
  }, [item.id, assistQueue, role]);

  const pc = item.priority ? priorityColor(item.priority) : 'var(--ink-3)';
  const cs = item.category ? (CATEGORY_STYLE[item.category] || CATEGORY_STYLE.Question) : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', height: '100%' }}>

      {/* Toolbar — matches DecisionDetail */}
      <div style={{ padding: '10px 24px', borderBottom: '1px solid var(--line)', display: 'flex', alignItems: 'center', gap: 10, minHeight: 44 }}>
        <Breadcrumbs items={['Assist', 'Messages', item.id]} />
        <span style={{ flex: 1 }} />
        <StatusPill status={item.status} />
        {item.sourceView && (
          <span style={{
            fontSize: 10.5, color: 'var(--ink-3)', padding: '2px 8px', borderRadius: 4,
            background: 'var(--surface)', border: '1px solid var(--line)',
          }}>
            {item.sourceView}
          </span>
        )}
        {item.direction === 'outbound' && item.actionRequired && item.status !== 'acted' && (
          <button onClick={() => assistQueue.handleAction(item.id)} style={{
            all: 'unset', cursor: 'pointer',
            padding: '5px 10px', borderRadius: 6, background: 'var(--accent)', color: '#fff',
            fontSize: 11.5, fontWeight: 600,
          }}>
            {item.actionLabel}
          </button>
        )}
      </div>

      {/* Content — matches DecisionDetail layout */}
      <div style={{ overflow: 'auto', flex: 1, padding: '22px 32px 0' }}>

        {/* Submitter line */}
        <div style={{ fontSize: 11.5, color: 'var(--ink-3)', marginBottom: 6 }}>
          {item.direction === 'inbound'
            ? `${item.submittedBy.name} \u00b7 ${item.submittedBy.role} \u00b7 ${item.submittedBy.facility}`
            : `From ${item.submittedBy.name} \u00b7 to ${item.targetRole}`
          }
        </div>

        {/* Priority / category row — matches DecisionDetail priority/id/since row */}
        {item.direction === 'inbound' && (
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 8 }}>
            {cs && (
              <span style={{
                fontSize: 9.5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: .3,
                padding: '1px 6px', borderRadius: 4, background: cs.bg, color: cs.c,
              }}>{item.category === 'Feature Request' ? 'Feature' : item.category}</span>
            )}
            {item.priority && (
              <span style={{ fontSize: 10.5, fontWeight: 600, color: pc, textTransform: 'uppercase', letterSpacing: .4 }}>{item.priority}</span>
            )}
            <span className="mono" style={{ fontSize: 11, color: 'var(--ink-3)' }}>{item.id}</span>
            <span style={{ fontSize: 11, color: 'var(--ink-3)' }}>&middot; {timeAgo(item.submittedAt)}</span>
          </div>
        )}

        {/* Title */}
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 600, letterSpacing: -0.5, fontFamily: 'var(--font-display)', lineHeight: 1.2 }}>
          {item.message?.slice(0, 100)}{item.message?.length > 100 ? '...' : ''}
        </h1>

        {/* Agent summary */}
        {item.agentSummary && (
          <p style={{ margin: '10px 0 18px', fontSize: 14, lineHeight: 1.55, color: 'var(--ink-2)', maxWidth: 640 }}>
            {item.agentSummary}
          </p>
        )}

        {/* Resolution card */}
        {item.resolution && (
          <div style={{
            padding: '10px 14px', marginBottom: 18,
            background: 'var(--green-bg)', borderRadius: 8,
            border: '1px solid var(--green)33', fontSize: 12.5,
          }}>
            <div style={{ fontWeight: 600, color: 'var(--green)', marginBottom: 4 }}>&#x2713; Resolved</div>
            {item.resolution}
          </div>
        )}

        {/* Media link */}
        {item.mediaUrl && (
          <div style={{
            padding: '10px 14px', marginBottom: 18,
            background: 'var(--accent-weak)', borderRadius: 8,
            border: '1px solid var(--accent)33',
            fontSize: 12.5, display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <span style={{ fontWeight: 600, color: 'var(--accent)' }}>&#x25B6;</span>
            <span style={{ color: 'var(--ink-2)' }}>{item.mediaUrl}</span>
          </div>
        )}

        {/* Agent recommendation card — matches DecisionDetail agent card */}
        {item.triageConfidence && (
          <>
            <LabelSmall>Agent assessment</LabelSmall>
            <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 10, padding: '12px 14px', marginBottom: 20 }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6, fontSize: 12 }}>
                <AgentDot name="Assist Agent" color="var(--violet)" size={18} />
                <span style={{ fontWeight: 600 }}>Assist Agent</span>
                <span style={{ color: 'var(--ink-3)' }}>&middot; {Math.round(item.triageConfidence * 100)}% confidence</span>
              </div>
              <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.55 }}>
                {item.agentSummary || 'Triaged and categorized automatically.'}
              </p>
            </div>
          </>
        )}

        {/* Conversation thread — structured timeline, not chat bubbles */}
        <LabelSmall>Conversation</LabelSmall>
        <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 10, marginBottom: 24, overflow: 'hidden' }}>
          {item.thread.map((msg, i) => {
            const isUser = msg.actor === 'user';
            const typeLabel = msg.type ? (THREAD_TYPE_LABELS[msg.type] || msg.type) : null;
            return (
              <div key={i} style={{
                display: 'grid', gridTemplateColumns: '22px 1fr', gap: 10,
                padding: '12px 14px', borderTop: i ? '1px solid var(--line-soft)' : 'none',
              }}>
                {/* Timeline marker */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 2 }}>
                  {isUser
                    ? <div style={{
                        width: 18, height: 18, borderRadius: 9, background: 'var(--accent)',
                        color: '#fff', fontSize: 8, fontWeight: 700, display: 'flex',
                        alignItems: 'center', justifyContent: 'center',
                      }}>{(msg.role || 'U')[0]}</div>
                    : <AgentDot name={msg.name || 'Assist Agent'} color="var(--violet)" size={18} />
                  }
                  {i < item.thread.length - 1 && (
                    <div style={{ width: 1.5, flex: 1, background: 'var(--line)', marginTop: 4 }} />
                  )}
                </div>

                {/* Content */}
                <div>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 4 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: isUser ? 'var(--accent)' : 'var(--violet)' }}>
                      {isUser ? msg.role : msg.name}
                    </span>
                    {typeLabel && (
                      <span style={{
                        fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: .3,
                        padding: '1px 5px', borderRadius: 3, border: '1px solid var(--violet)33', color: 'var(--violet)',
                      }}>{typeLabel}</span>
                    )}
                    <span style={{ fontSize: 10, color: 'var(--ink-4)' }}>{timeAgo(msg.t)}</span>
                  </div>
                  <div style={{ fontSize: 13, lineHeight: 1.55, color: 'var(--ink-1)', whiteSpace: 'pre-wrap' }}>
                    {msg.body}
                  </div>
                </div>
              </div>
            );
          })}
          {assistQueue.typing === item.id && (
            <div style={{
              display: 'grid', gridTemplateColumns: '22px 1fr', gap: 10,
              padding: '12px 14px', borderTop: '1px solid var(--line-soft)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 2 }}>
                <AgentDot name="Assist Agent" color="var(--violet)" size={18} />
              </div>
              <div style={{ display: 'flex', gap: 4, alignItems: 'center', padding: '4px 0' }}>
                {[0, 1, 2].map((i) => (
                  <span key={i} style={{
                    width: 5, height: 5, borderRadius: '50%', background: 'var(--violet)',
                    opacity: 0.6, animation: `assistPulse 1.2s ease-in-out ${i * 0.2}s infinite`,
                  }} />
                ))}
                <style>{`@keyframes assistPulse { 0%,100% { opacity:.3; transform:scale(.85); } 50% { opacity:1; transform:scale(1.1); } }`}</style>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Action bar — matches DecisionDetail action bar */}
      <div style={{ padding: '10px 24px', borderTop: '1px solid var(--line)', display: 'flex', gap: 8, alignItems: 'flex-end' }}>
        <textarea
          ref={replyRef}
          placeholder="Reply..."
          rows={1}
          onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); handleReply(); } }}
          style={{
            flex: 1, resize: 'none', outline: 'none',
            background: 'var(--bg-sunk)', borderRadius: 'var(--r-1)',
            padding: '8px 12px', fontSize: 13, lineHeight: 1.5,
            color: 'var(--ink-1)', fontFamily: 'var(--font-text)',
            maxHeight: 100, overflow: 'auto',
            border: '1px solid var(--line)',
          }}
        />
        <button onClick={handleReply} style={{
          all: 'unset', cursor: 'pointer',
          padding: '8px 14px', borderRadius: 'var(--r-1)',
          fontSize: 12, fontWeight: 600,
          background: 'var(--accent)', color: '#fff',
          flexShrink: 0,
        }}>
          Send &#x21B5;
        </button>
      </div>
    </div>
  );
}

/* ─── Empty state (no item selected) — full-scope assist hub ─── */
export function AssistEmpty({ assistQueue, role }) {
  const [composeText, setComposeText] = useState('');
  const composeRef = useRef(null);

  const visiblePresets = useMemo(
    () => ASSIST_PRESETS.filter((p) => !p.roles || p.roles.includes(role)),
    [role],
  );

  const handleSubmit = useCallback(() => {
    assistQueue.handleSubmit(composeText, role);
    setComposeText('');
    if (composeRef.current) composeRef.current.style.height = 'auto';
  }, [composeText, assistQueue, role]);

  const handlePreset = useCallback((preset) => {
    if (preset.fill) setComposeText(preset.fill);
    setTimeout(() => composeRef.current?.focus(), 50);
  }, []);

  const handleInput = useCallback((e) => {
    setComposeText(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
  }, []);

  const { stats } = assistQueue;

  // Group presets by function
  const opsPresets = visiblePresets.filter((p) =>
    ['What happened overnight?', 'Prep for standup', 'Show my pending decisions', 'Get me updated on census'].includes(p.label)
  );
  const eePresets = visiblePresets.filter((p) =>
    ['Request PTO', 'Payroll question', 'Employee handbook', 'Benefits question', 'Leave request'].includes(p.label)
  );
  const supportPresets = visiblePresets.filter((p) =>
    ['Report a bug', 'Request a feature', 'Explain a decision'].includes(p.label)
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', overflow: 'auto', padding: '22px 32px 40px' }}>

      {/* Agent bar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '10px 14px', marginBottom: 20,
        background: 'var(--surface)', border: '1px solid var(--line)',
        borderRadius: 10,
      }}>
        <AgentDot name="Assist Agent" color="var(--violet)" size={24} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12.5, fontWeight: 600 }}>Assist Agent</div>
          <div className="tnum" style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 1 }}>
            Your one-stop channel — platform support, employee services, corporate communications
          </div>
        </div>
        <div className="tnum" style={{ fontSize: 11, color: 'var(--ink-3)' }}>
          avg {ASSIST_SUMMARY.avgTriageSeconds}s triage
        </div>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 24 }}>
        <StatCard label="Your messages" value={stats.inbound} trend="up" change="+2" />
        <StatCard label="Agent resolved" value={stats.autoResolved} trend="up" change={`${Math.round(stats.autoResolved / Math.max(stats.inbound, 1) * 100)}%`} />
        <StatCard label="Action required" value={stats.outUnread} trend="flat" />
        <StatCard label="Avg triage" value={ASSIST_SUMMARY.avgTriageSeconds + 's'} trend="down" change="-12s" />
      </div>

      {/* Quick actions — grouped by function */}
      {opsPresets.length > 0 && (
        <>
          <LabelSmall>Operations</LabelSmall>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
            {opsPresets.map((p) => (
              <button key={p.label} onClick={() => handlePreset(p)} style={{
                all: 'unset', cursor: 'pointer',
                fontSize: 11, fontWeight: 500, color: 'var(--ink-2)',
                padding: '5px 12px', borderRadius: 'var(--r-pill)',
                background: 'var(--bg-sunk)', border: '1px solid var(--line)',
              }}>{p.label}</button>
            ))}
          </div>
        </>
      )}

      <LabelSmall>Employee Services</LabelSmall>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
        {eePresets.map((p) => (
          <button key={p.label} onClick={() => handlePreset(p)} style={{
            all: 'unset', cursor: 'pointer',
            fontSize: 11, fontWeight: 500, color: 'var(--ink-2)',
            padding: '5px 12px', borderRadius: 'var(--r-pill)',
            background: 'var(--bg-sunk)', border: '1px solid var(--line)',
          }}>{p.label}</button>
        ))}
      </div>

      <LabelSmall>Platform Support</LabelSmall>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
        {supportPresets.map((p) => (
          <button key={p.label} onClick={() => handlePreset(p)} style={{
            all: 'unset', cursor: 'pointer',
            fontSize: 11, fontWeight: 500, color: 'var(--ink-2)',
            padding: '5px 12px', borderRadius: 'var(--r-pill)',
            background: 'var(--bg-sunk)', border: '1px solid var(--line)',
          }}>{p.label}</button>
        ))}
      </div>

      {/* Compose */}
      <LabelSmall>Send a message</LabelSmall>
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--line)',
        borderRadius: 10, padding: 16, marginBottom: 24,
      }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
          <textarea
            ref={composeRef}
            value={composeText}
            onChange={handleInput}
            onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); handleSubmit(); } }}
            placeholder="PTO request, payroll question, bug report, feature idea..."
            rows={2}
            style={{
              flex: 1, resize: 'none', outline: 'none',
              background: 'var(--bg-sunk)', borderRadius: 'var(--r-1)',
              padding: '10px 12px', fontSize: 13, lineHeight: 1.5,
              color: 'var(--ink-1)', fontFamily: 'var(--font-text)',
              maxHeight: 150, overflow: 'auto',
              border: '1px solid var(--line)',
            }}
          />
          <button onClick={handleSubmit} disabled={!composeText.trim()} style={{
            all: 'unset', cursor: composeText.trim() ? 'pointer' : 'default',
            padding: '8px 16px', borderRadius: 'var(--r-1)',
            fontSize: 12, fontWeight: 600,
            background: composeText.trim() ? 'var(--accent)' : 'var(--line)',
            color: composeText.trim() ? '#fff' : 'var(--ink-4)',
            flexShrink: 0,
          }}>
            Send
          </button>
        </div>
        <div style={{ fontSize: 10.5, color: 'var(--ink-4)', marginTop: 8 }}>
          Triaged in under 60 seconds. Logged to your HR personnel file. &#x2318;+Enter to send.
        </div>
      </div>
    </div>
  );
}
