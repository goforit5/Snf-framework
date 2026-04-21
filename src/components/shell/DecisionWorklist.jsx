/**
 * DecisionWorklist — Priority-grouped list of pending decisions.
 *
 * Shown in the middle column when the Home / platform domain is active.
 * Clicking a row navigates to /?decision={id} so ContentPane can
 * render DecisionDetail in the right pane.
 *
 * Also exports DECISIONS — the enriched decision data array consumed by
 * DecisionDetail and CommandPalette.
 */

import { useNavigate, useSearchParams } from 'react-router-dom';
import { pendingDecisions } from '../../data/decisions/pendingDecisions';

/* ─── Priority palette ─── */
const PRIORITY_COLOR = {
  critical: 'var(--red)',
  high: 'var(--amber)',
  medium: 'var(--accent)',
  low: 'var(--ink-4)',
};

const PRIORITY_ORDER = ['critical', 'high', 'medium', 'low'];

/* ─── Facility ID → name lookup ─── */
const FACILITY_MAP = {
  f1: 'Sunrise Senior Living',
  f2: 'Meadowbrook Care',
  f3: 'Pacific Gardens',
  f4: 'Heritage Oaks',
  f5: 'Bayview Health Center',
  all: 'Enterprise',
};

/* ─── Domain → page label ─── */
const DOMAIN_PAGE_MAP = {
  clinical: 'Clinical Command',
  financial: 'Revenue Command',
  workforce: 'Workforce Command',
  vendor: 'Revenue Command',
  operations: 'Facility Command',
  strategic: 'M&A Pipeline',
  compliance: 'Compliance',
  quality: 'Quality Command',
  risk: 'Risk Management',
  legal: 'Legal Command',
};

/* ─── Agent ID → display name ─── */
const AGENT_NAME_MAP = {
  'clinical-monitor': 'Clinical Monitor',
  'procurement-agent': 'Procurement Agent',
  'hr-compliance': 'HR Compliance Agent',
  'scheduling-agent': 'Scheduling Agent',
  'ma-diligence': 'M&A Diligence Agent',
  'ap-processing': 'AP Processing Agent',
  'payroll-audit': 'Payroll Audit Agent',
  'supply-chain': 'Supply Chain Agent',
  'training-agent': 'Training Agent',
  'wound-care-agent': 'Wound Care Agent',
  'vendor-compliance': 'Vendor Compliance Agent',
  'recruiting-agent': 'Recruiting Agent',
  'risk-management': 'Risk Management Agent',
  'infection-control': 'Infection Control Agent',
  'pharmacy-agent': 'Pharmacy Agent',
  'contract-agent': 'Contract Agent',
  'survey-readiness': 'Survey Readiness Agent',
  'maintenance-agent': 'Maintenance Agent',
  'infection-prevention-agent': 'Infection Prevention Agent',
  'mds-audit-agent': 'MDS Audit Agent',
  'quality-improvement-agent': 'Quality Improvement Agent',
  'clinical-compliance-agent': 'Clinical Compliance Agent',
  'life-safety-agent': 'Life Safety Agent',
  'regulatory-response-agent': 'Regulatory Response Agent',
};

/* ─── Parse impact from estimatedImpact string ─── */
function parseImpact(d) {
  const raw = d.estimatedImpact || '';
  const impact = {};

  const dollarMatch = raw.match(/\$([0-9,.]+[KMB]?)/);
  if (dollarMatch) {
    let val = dollarMatch[1].replace(/,/g, '');
    if (val.endsWith('K')) val = parseFloat(val) * 1000;
    else if (val.endsWith('M')) val = parseFloat(val) * 1000000;
    else val = parseFloat(val);
    if (!isNaN(val)) {
      impact.dollars = Math.round(val);
      if (raw.includes('/day')) impact.dollarsUnit = 'per day';
      else if (raw.includes('/week')) impact.dollarsUnit = 'per week';
      else if (raw.includes('/year') || raw.includes('/yr')) impact.dollarsUnit = 'per year';
      else if (raw.includes('acquisition')) impact.dollarsUnit = 'acquisition';
      else if (raw.includes('settlement')) impact.dollarsUnit = 'settlement';
      else if (raw.includes('back pay')) impact.dollarsUnit = 'back pay';
      else impact.dollarsUnit = 'impact';
    }
  }

  const fTag = (d.policiesChecked || []).concat(d.evidence || []).join(' ').match(/F-\d+/);
  if (fTag) impact.citation = fTag[0];

  if (d.dueBy && d.createdAt) {
    const days = Math.max(1, Math.round(
      (new Date(d.dueBy) - new Date(d.createdAt)) / (1000 * 60 * 60 * 24),
    ));
    impact.timeDays = days;
  }

  if (d.confidence != null) impact.probability = d.confidence;

  return impact;
}

/* ─── Parse evidence into structured rows ─── */
function parseEvidenceRows(d) {
  return (d.evidence || []).map((e, i) => {
    const colonIdx = e.indexOf(':');
    if (colonIdx > 0 && colonIdx < 40) {
      return {
        label: e.slice(0, colonIdx).trim(),
        value: e.slice(colonIdx + 1).trim(),
        source: d.domain === 'clinical' ? 'PCC' : d.domain === 'workforce' ? 'Workday' : 'System',
      };
    }
    return {
      label: `Evidence ${i + 1}`,
      value: e,
      source: d.domain === 'clinical' ? 'PCC' : d.domain === 'workforce' ? 'Workday' : 'System',
    };
  });
}

/* ─── Time-since helper ─── */
function timeSince(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

/* ─── Enriched DECISIONS array ─── */
export const DECISIONS = pendingDecisions
  .filter((d) => d.status === 'pending')
  .map((d) => ({
    ...d,
    facility: FACILITY_MAP[d.facilityId] || d.facilityId || 'Enterprise',
    page: DOMAIN_PAGE_MAP[d.domain] || 'Command Center',
    agentName: AGENT_NAME_MAP[d.agentId] || d.agentId,
    impact: parseImpact(d),
    evidenceRows: parseEvidenceRows(d),
    since: timeSince(d.createdAt),
    normalizedPriority: (d.priority || 'medium').toLowerCase(),
  }));

/* ─── Component ─── */
export default function DecisionWorklist() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const selectedId = searchParams.get('decision');

  /* Group by priority */
  const grouped = {};
  for (const p of PRIORITY_ORDER) grouped[p] = [];
  for (const d of DECISIONS) {
    const key = d.normalizedPriority;
    if (grouped[key]) grouped[key].push(d);
  }

  return (
    <div style={{ overflow: 'auto', flex: 1 }}>
      {PRIORITY_ORDER.map((priority) => {
        const items = grouped[priority];
        if (!items || !items.length) return null;
        return (
          <div key={priority}>
            {/* Group header */}
            <div style={{
              fontSize: 10.5,
              fontWeight: 600,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: 'var(--ink-3)',
              padding: '10px 16px 4px',
              fontFamily: 'var(--font-text)',
            }}>
              {priority} ({items.length})
            </div>

            {/* Decision rows */}
            {items.map((d) => {
              const isSelected = selectedId === d.id;
              return (
                <button
                  key={d.id}
                  onClick={() => navigate(`/?decision=${d.id}`)}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 10,
                    width: '100%',
                    textAlign: 'left',
                    padding: '8px 16px',
                    border: 'none',
                    borderLeft: isSelected
                      ? '3px solid var(--accent)'
                      : '3px solid transparent',
                    background: isSelected
                      ? 'var(--accent-weak)'
                      : 'transparent',
                    cursor: 'pointer',
                    fontFamily: 'var(--font-text)',
                    transition: 'background 120ms ease',
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) e.currentTarget.style.background = 'var(--surface-2)';
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) e.currentTarget.style.background = 'transparent';
                  }}
                >
                  {/* Priority dot */}
                  <span style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: PRIORITY_COLOR[d.normalizedPriority] || 'var(--ink-4)',
                    flexShrink: 0,
                    marginTop: 5,
                  }} />

                  {/* Text block */}
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{
                      fontSize: 12.5,
                      fontWeight: 600,
                      color: 'var(--ink-1)',
                      lineHeight: 1.3,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}>
                      {d.title}
                    </div>
                    <div style={{
                      fontSize: 11.5,
                      color: 'var(--ink-3)',
                      lineHeight: 1.3,
                      marginTop: 1,
                    }}>
                      {d.facility}{d.since ? ` \u00b7 ${d.since}` : ''}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
