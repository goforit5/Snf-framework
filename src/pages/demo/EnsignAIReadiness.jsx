import { PageHeader } from '../../components/Widgets';
import { Card } from '../../components/Widgets';

const BOARD_MEMBERS = [
  { name: 'Swati Abbott', role: 'Board Director', score: 65, color: 'emerald', background: 'CEO of Blue Health Intelligence (AI-based predictive analytics). M.S. Computer Science. Only board member with data/AI experience.', gap: 'Experience predates generative AI era (pre-2023). Traditional ML/analytics, not agentic AI.' },
  { name: 'Suzanne Snapper', role: 'CFO, EVP', score: 15, color: 'amber', background: 'KPMG, CPA. Oversees IT function operationally.', gap: 'Finance-first. No AI, data science, or digital transformation experience.' },
  { name: 'Dr. John Agwunobi', role: 'Director', score: 15, color: 'amber', background: 'CEO of Herbalife. SVP Walmart Health. Asst. Secretary of Health, HHS. 4-Star Admiral USPHS.', gap: 'Large-enterprise exposure but no direct AI involvement.' },
  { name: 'Spencer Burton', role: 'President & COO', score: 10, color: 'red', background: 'Led Pennant Healthcare. VP Operations Ensign Services. J.D. + MPA BYU.', gap: 'Has mentioned CMS data signals but no AI expertise.' },
  { name: 'Barry Port', role: 'CEO & Chairman', score: 8, color: 'red', background: 'COO Ensign Services (2012-2019). MBA + MHA Arizona State.', gap: 'Pure healthcare ops. Called AI "buzzword of the day" on Q4 2025 call.' },
  { name: 'Barry M. Smith', role: 'Lead Independent Director', score: 8, color: 'red', background: 'Chairman/CEO Magellan Health. Founder VistaCare.', gap: 'Managed care and behavioral health. No technology depth.' },
  { name: 'Dr. Ann Scott Blouin', role: 'Director, QA Chair', score: 12, color: 'red', background: 'EVP Joint Commission. Deloitte, EY, Huron. Ph.D. Nursing Sciences.', gap: 'Deep quality expertise but no AI experience.' },
  { name: 'Mark Parkinson', role: 'Director', score: 5, color: 'red', background: 'President/CEO of AHCA/NCAL (14 years). 45th Governor of Kansas.', gap: 'Premier policy expert. Zero technology background.' },
  { name: 'Daren Shaw', role: 'Audit Committee Chair', score: 5, color: 'red', background: 'Managing Director D.A. Davidson. KPMG.', gap: 'Investment banking and financial services. No tech.' },
  { name: 'Chad Keetch', role: 'CIO (Investment), EVP', score: 5, color: 'red', background: 'Transactional attorney Kirkland & Ellis. J.D. + MBA Ohio State.', gap: 'Legal and M&A. No technology experience.' },
  { name: 'Marivic Uychiat', role: 'VP Clinical Services', score: 5, color: 'red', background: 'Director Clinical Services Ensign. 10+ years DON.', gap: 'Clinical nursing excellence. No technology background.' },
];

const VENDOR_PROBLEMS = [
  { vendor: 'PCC (PointClickCare)', problem: 'Chart Advisor is a bolt-on AI feature within PCC\'s existing UI. It can only see PCC data — not Workday, not financial systems, not SharePoint. Generic model shared with all PCC customers.', cost: '$50-150/facility/month per module', lock: 'Clinical data locked in PCC. Switching costs: $2-5M+' },
  { vendor: 'Workday', problem: 'Workday AI Assistant operates only within Workday\'s HR/finance data. Cannot cross-reference with clinical outcomes, census data, or operational metrics. 12-18 month feature release cycle.', cost: '$100-200/user/month', lock: 'HR/payroll data migration: 6-12 months. Switching costs: $5-10M+' },
  { vendor: 'Microsoft 365 / Copilot', problem: 'M365 Copilot works within individual Office apps. Cannot connect clinical decisions to financial impact or staffing implications. Per-user licensing adds up across 10,000+ employees.', cost: '$30/user/month for Copilot', lock: 'Email, documents, SOPs all in M365 ecosystem.' },
];

const MISSING_ROLES = [
  { role: 'Chief AI Officer (CAIO)', why: 'No one owns AI strategy. Tech decisions roll up under CFO, not a strategic technology leader. No seat at the table for capital allocation decisions.', industry: 'Groupon formed board-level AI Committee March 2026. HCA Healthcare has dedicated AI leadership.' },
  { role: 'Chief Digital Officer (CDO)', why: 'No digital transformation vision. Leadership frames technology as "data dashboards for clinicians" — a 2015-era vision.', industry: 'Most Fortune 500 companies have had CDOs since 2018-2020.' },
  { role: 'Board-Level AI Committee', why: 'Four standing committees: Audit, Quality, Compensation, Nominating. None address technology, innovation, or AI.', industry: 'Groupon, Microsoft, Alphabet all have board-level AI oversight.' },
  { role: 'VP of AI/ML Engineering', why: 'CTO (Ryan Rushton) and CIO (Tyler Douglas) are operational IT roles — not strategic. No one has built or shipped AI products.', industry: 'UnitedHealth, HCA, Kaiser all have dedicated AI engineering leadership.' },
];

export default function EnsignAIReadiness() {
  return (
    <div>
      <PageHeader
        title="Ensign AI Readiness Assessment"
        subtitle="Board composition, technology leadership gaps, and why the vendor-dependent strategy will fail"
      />

      {/* Summary scorecard */}
      <div className="grid grid-cols-5 gap-4 mb-6">
        {[
          { label: 'Overall AI Readiness', value: '3/10', color: 'text-red-500' },
          { label: 'Board AI Expertise', value: '2/10', color: 'text-red-500' },
          { label: 'AI Governance', value: '1/10', color: 'text-red-500' },
          { label: 'Ops Foundation', value: '8/10', color: 'text-emerald-600' },
          { label: 'Financial Capacity', value: '9/10', color: 'text-emerald-600' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-gray-200 p-4 text-center shadow-sm">
            <div className={`text-2xl font-extrabold ${s.color}`}>{s.value}</div>
            <p className="text-[11px] text-gray-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* The paradox */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-200 p-6 mb-6 shadow-sm">
        <h3 className="text-sm font-bold text-gray-900 mb-2">The Ensign Paradox</h3>
        <p className="text-sm text-gray-600 leading-relaxed">
          Ensign has <span className="font-bold text-gray-900">the strongest operational foundation in post-acute care</span> — 378 facilities, $5.06B revenue, $1.09B liquidity, a decentralized model uniquely suited for AI, and the financial capacity to invest. But the leadership team has <span className="font-bold text-gray-900">the weakest AI readiness of any company this size</span> — no AI committee, no strategic tech leader, and a CEO who called AI "the buzzword of the day" on the same day SemiAnalysis revealed Claude Code writes 4% of all GitHub commits.
        </p>
      </div>

      {/* Board members */}
      <Card className="mb-6">
        <h3 className="text-base font-bold text-gray-900 mb-1">Board & Executive AI Readiness</h3>
        <p className="text-sm text-gray-500 mb-4">Of 11 board members and key executives, only one has meaningful AI/technology experience.</p>
        <div className="space-y-3">
          {BOARD_MEMBERS.map(m => (
            <div key={m.name} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <span className="font-semibold text-gray-900 text-sm">{m.name}</span>
                  <span className="text-xs text-gray-400 ml-2">{m.role}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${m.color === 'emerald' ? 'bg-emerald-500' : m.color === 'amber' ? 'bg-amber-500' : 'bg-red-500'}`}
                      style={{ width: `${m.score}%` }}
                    />
                  </div>
                  <span className={`text-xs font-bold ${m.color === 'emerald' ? 'text-emerald-600' : m.color === 'amber' ? 'text-amber-600' : 'text-red-500'}`}>{m.score}%</span>
                </div>
              </div>
              <p className="text-xs text-gray-500"><span className="text-gray-700 font-medium">Background:</span> {m.background}</p>
              <p className="text-xs text-gray-500 mt-1"><span className="text-red-500 font-medium">Gap:</span> {m.gap}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Missing roles */}
      <Card className="mb-6">
        <h3 className="text-base font-bold text-gray-900 mb-1">Critical Leadership Gaps</h3>
        <p className="text-sm text-gray-500 mb-4">Strategic technology roles that don't exist at Ensign — and do at every peer company.</p>
        <div className="grid grid-cols-2 gap-4">
          {MISSING_ROLES.map(r => (
            <div key={r.role} className="bg-red-50 rounded-xl border border-red-200 p-4">
              <h4 className="text-sm font-bold text-red-700 mb-1">{r.role}</h4>
              <p className="text-xs text-gray-600 mb-2">{r.why}</p>
              <p className="text-[10px] text-gray-400"><span className="font-semibold text-gray-500">Industry:</span> {r.industry}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Vendor dependency */}
      <Card className="mb-6">
        <h3 className="text-base font-bold text-gray-900 mb-1">Why Vendor AI Is Not Comparable to Agentic AI</h3>
        <p className="text-sm text-gray-500 mb-4">Ensign's current strategy — waiting for vendors to add AI features — fails on every dimension.</p>
        <div className="space-y-4">
          {VENDOR_PROBLEMS.map(v => (
            <div key={v.vendor} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-bold text-gray-900">{v.vendor}</h4>
                <span className="text-xs font-semibold text-red-500 bg-red-50 px-2 py-0.5 rounded-full border border-red-200">{v.cost}</span>
              </div>
              <p className="text-sm text-gray-600 mb-2">{v.problem}</p>
              <p className="text-xs text-gray-400"><span className="text-amber-600 font-semibold">Lock-in:</span> {v.lock}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 bg-gray-50 rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-700 font-medium mb-2">The fundamental problem with vendor AI:</p>
          <ul className="text-sm text-gray-600 space-y-1.5">
            <li className="flex gap-2"><span className="text-red-400 font-bold flex-shrink-0">1.</span>Each vendor's AI only sees <span className="font-semibold text-gray-900">its own data</span> — clinical AI can't see financials, HR AI can't see clinical outcomes</li>
            <li className="flex gap-2"><span className="text-red-400 font-bold flex-shrink-0">2.</span>The models are <span className="font-semibold text-gray-900">generic</span> — trained on broad industry data, not Ensign's 378-facility specific patterns</li>
            <li className="flex gap-2"><span className="text-red-400 font-bold flex-shrink-0">3.</span>You <span className="font-semibold text-gray-900">pay per seat/facility</span> for access to AI running on your own data</li>
            <li className="flex gap-2"><span className="text-red-400 font-bold flex-shrink-0">4.</span>No <span className="font-semibold text-gray-900">IP accrues to Ensign</span> — the vendor keeps the model, you rent the output</li>
          </ul>
        </div>
      </Card>

      {/* Sources */}
      <div className="text-center mt-6">
        <p className="text-xs text-gray-400">
          Sources: Ensign Q1-Q4 2025 earnings calls (<a href="https://seekingalpha.com/article/4866691-the-ensign-group-inc-ensg-q4-2025-earnings-call-transcript" target="_blank" rel="noopener" className="underline hover:text-gray-600">Q4 transcript</a>), SEC filings, <a href="https://investor.ensigngroup.net/governance/board-of-directors/default.aspx" target="_blank" rel="noopener" className="underline hover:text-gray-600">board composition</a>, <a href="https://investor.ensigngroup.net/governance/committee-composition/default.aspx" target="_blank" rel="noopener" className="underline hover:text-gray-600">committee structure</a>
        </p>
      </div>
    </div>
  );
}
