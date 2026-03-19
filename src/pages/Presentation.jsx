import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Play, ExternalLink, ArrowRight, X, ChevronDown } from 'lucide-react';

/* ═══════════════════════════════════════════════════
   GLOBAL STYLES — injected once
   Apple Keynote-inspired light presentation
   ═══════════════════════════════════════════════════ */
const PRESENTATION_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;0,9..40,800;1,9..40,400&display=swap');

  .pres-root {
    font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  /* Slide crossfade */
  .slide-enter { animation: slideFadeIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
  @keyframes slideFadeIn {
    from { opacity: 0; transform: translateY(12px) scale(0.995); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
  }

  /* Stagger reveal — Remotion-style kinetic entrance */
  .reveal { opacity: 0; transform: translateY(18px); }
  .reveal.visible { animation: revealUp 0.65s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
  @keyframes revealUp {
    to { opacity: 1; transform: translateY(0); }
  }
  .stagger-1 { animation-delay: 0.06s !important; }
  .stagger-2 { animation-delay: 0.12s !important; }
  .stagger-3 { animation-delay: 0.18s !important; }
  .stagger-4 { animation-delay: 0.24s !important; }
  .stagger-5 { animation-delay: 0.30s !important; }
  .stagger-6 { animation-delay: 0.36s !important; }
  .stagger-7 { animation-delay: 0.42s !important; }
  .stagger-8 { animation-delay: 0.48s !important; }

  /* Detail drawer slide-in */
  @keyframes drawerIn { from { transform: translateX(100%); } to { transform: translateX(0); } }
  .drawer-enter { animation: drawerIn 0.3s cubic-bezier(0.16, 1, 0.3, 1); }

  /* Big number counter pulse */
  .number-accent {
    background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  .number-danger {
    background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  /* Progress bar shimmer */
  .progress-shimmer {
    background: linear-gradient(90deg, #2563eb 0%, #3b82f6 50%, #2563eb 100%);
    background-size: 200% 100%;
    animation: shimmer 2s linear infinite;
  }
  @keyframes shimmer { to { background-position: -200% 0; } }

  /* Card hover lift */
  .card-lift { transition: transform 0.25s ease, box-shadow 0.25s ease; }
  .card-lift:hover { transform: translateY(-2px); box-shadow: 0 8px 30px rgba(0,0,0,0.08); }

  /* Nav dot pulse */
  .dot-active {
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.2);
  }

  /* Subtle grain overlay */
  .grain::after {
    content: '';
    position: fixed;
    inset: 0;
    opacity: 0.015;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
    pointer-events: none;
    z-index: 9999;
  }
`;

/* ═══════════════════════════════════════════════════
   REUSABLE COMPONENTS
   ═══════════════════════════════════════════════════ */

function useSlideReveal(currentSlide) {
  const containerRef = useRef(null);
  useEffect(() => {
    if (!containerRef.current) return;
    const els = containerRef.current.querySelectorAll('.reveal');
    els.forEach(el => el.classList.remove('visible'));
    requestAnimationFrame(() => {
      els.forEach(el => el.classList.add('visible'));
    });
  }, [currentSlide]);
  return containerRef;
}

function DetailDrawer({ isOpen, onClose, title, children }) {
  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e) => { if (e.key === 'Escape') { e.stopPropagation(); onClose(); } };
    window.addEventListener('keydown', handleEsc, true);
    return () => window.removeEventListener('keydown', handleEsc, true);
  }, [isOpen, onClose]);
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" />
      <div className="relative w-full max-w-xl bg-white h-full overflow-y-auto shadow-2xl drawer-enter" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 bg-white/95 backdrop-blur-xl border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
          <h3 className="text-base font-bold text-gray-900">{title}</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>
        <div className="px-6 py-6 text-sm text-gray-600 leading-relaxed space-y-4">
          {children}
        </div>
      </div>
    </div>
  );
}

function DetailTrigger({ label, onClick }) {
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      className="inline-flex items-center gap-1 text-[11px] text-blue-500 hover:text-blue-700 transition-colors font-medium mt-1"
    >
      <ChevronDown className="w-3 h-3" /> {label}
    </button>
  );
}

/* label pill above headings */
function SectionLabel({ children, color = 'text-blue-600' }) {
  return <p className={`reveal stagger-1 text-[11px] uppercase tracking-[0.2em] ${color} font-semibold mb-3`}>{children}</p>;
}

/* ═══════════════════════════════════════════════════
   SLIDE DATA
   ═══════════════════════════════════════════════════ */
const SLIDES = [
  { id: 'title', label: 'Title' },
  { id: 'reality', label: 'The Reality' },
  { id: 'saaspocalypse', label: 'SaaSpocalypse' },
  { id: 'quotes', label: 'Leaders' },
  { id: 'agents-vs-saas', label: 'Agents vs SaaS' },
  { id: 'ensign-gap', label: 'Ensign Gap' },
  { id: 'vision', label: 'Vision' },
  { id: 'hitl', label: 'HITL' },
  { id: 'security', label: 'Security' },
  { id: 'data-sources', label: 'Data Sources' },
  { id: 'demo', label: 'Live Demo' },
  { id: 'why-andrew', label: 'Why Andrew' },
  { id: 'ask', label: 'The Ask' },
];

/* ═══════════════════════════════════════════════════
   SLIDE COMPONENTS
   ═══════════════════════════════════════════════════ */

function TitleSlide() {
  return (
    <div className="flex flex-col items-center justify-center text-center h-full">
      <SectionLabel>Strategic Technology Briefing</SectionLabel>
      <h1 className="reveal stagger-2 text-[3.8rem] font-extrabold tracking-[-0.03em] leading-[1.08] text-gray-900 mb-5 max-w-3xl">
        The Agentic Enterprise
      </h1>
      <p className="reveal stagger-3 text-lg text-gray-500 max-w-2xl leading-relaxed mb-10">
        Why AI agents will run every function of Ensign's business — clinical, financial, HR, operations, compliance — and why the infrastructure to do it already exists.
      </p>
      <div className="reveal stagger-4">
        <p className="font-semibold text-gray-900 text-base">Andrew Lark</p>
        <p className="text-gray-400 text-sm mt-1">AI Architecture &bull; SNF Operations &bull; HIPAA Systems &bull; Internal Controls</p>
      </div>
      <p className="reveal stagger-5 text-gray-400 text-xs mt-8">For Barry Port, CEO &amp; Ryan Rushton, CTO — The Ensign Group</p>
    </div>
  );
}

function RealitySlide() {
  return (
    <div className="max-w-4xl mx-auto">
      <SectionLabel>The Reality</SectionLabel>
      <h2 className="reveal stagger-2 text-[2.6rem] font-bold tracking-[-0.02em] text-gray-900 text-center mb-8">Every SaaS product is the same three things</h2>
      <div className="grid grid-cols-3 gap-5 mb-8">
        {[
          { emoji: '🗃', title: 'A Database', desc: 'Your data, on their servers' },
          { emoji: '💻', title: 'A User Interface', desc: 'Screens to view and edit that data' },
          { emoji: '🔗', title: 'An API Layer', desc: 'Rules for reading and writing' },
        ].map((c, i) => (
          <div key={c.title} className={`reveal stagger-${i + 3} bg-white rounded-2xl border border-gray-200 p-8 text-center card-lift shadow-sm`}>
            <div className="text-3xl mb-4">{c.emoji}</div>
            <h4 className="font-bold text-gray-900 mb-1">{c.title}</h4>
            <p className="text-sm text-gray-500">{c.desc}</p>
          </div>
        ))}
      </div>
      <p className="reveal stagger-6 text-center text-gray-600 leading-relaxed max-w-3xl mx-auto text-[15px]">
        Workday, PCC, Microsoft 365, every financial system — same pattern. Ensign pays <span className="font-bold text-gray-900">millions per year</span> for access to <span className="text-blue-600 font-semibold">its own data</span> through someone else's interface. AI agents don't need the interface. They connect directly to the data — across <em>every</em> system — and run the business.
      </p>
      <div className="reveal stagger-7 flex flex-wrap gap-2 justify-center mt-6">
        {['PCC / EHR', 'Workday', 'Microsoft 365', 'Financial Systems', 'SharePoint', 'Payroll', 'HR Systems'].map(s => (
          <span key={s} className="px-3 py-1.5 rounded-full text-xs font-semibold border border-blue-200 text-blue-600 bg-blue-50">{s}</span>
        ))}
      </div>
    </div>
  );
}

function SaaspocalypseSlide() {
  const [detail, setDetail] = useState(null);
  return (
    <>
    <DetailDrawer isOpen={detail === 'timeline'} onClose={() => setDetail(null)} title="SaaSpocalypse — Full 60-Day Timeline">
      <p><strong className="text-gray-900">November 2025:</strong> Claude Opus 4.6 reaches 80.9% on SWE-bench Verified. AI transitions from "copilot" to "pilot."</p>
      <p><strong className="text-gray-900">Q3-Q4 2025:</strong> SaaS growth rates decline every quarter since 2021 peak. AI budgets up 100%+, overall IT budgets up ~8%. Jason Lemkin: "That's not growth. That's harvesting."</p>
      <p><strong className="text-gray-900">January 29, 2026:</strong> Worst single day for software stocks since COVID crash. ServiceNow -11% despite beating earnings 9th consecutive quarter. Microsoft loses $360B in one day.</p>
      <p><strong className="text-gray-900">Early February:</strong> Anthropic releases Claude Cowork plugins — 11 specialized agents replicating complex SaaS functionality. No coding required.</p>
      <p><strong className="text-gray-900">February 5:</strong> SemiAnalysis: Claude Code authors 4% of all GitHub public commits (~135K/day), equivalent to 4 million full-time developers. Projected 20%+ by end of 2026.</p>
      <p><strong className="text-gray-900">February 5-6:</strong> $1 trillion in market cap erased in 7 days (Forrester). Atlassian seat count declined for FIRST TIME ever. Forward multiples collapsed from 39x to 21x.</p>
      <p className="text-gray-400 text-xs">Sources: <a href="https://www.cnbc.com/2026/02/06/ai-anthropic-tools-saas-software-stocks-selloff.html" target="_blank" rel="noopener" className="underline hover:text-gray-600">CNBC</a>, <a href="https://techcrunch.com/2026/03/01/saas-in-saas-out-heres-whats-driving-the-saaspocalypse/" target="_blank" rel="noopener" className="underline hover:text-gray-600">TechCrunch</a>, <a href="https://www.bloomberg.com/news/articles/2026-02-04/what-s-behind-the-saaspocalypse-plunge-in-software-stocks" target="_blank" rel="noopener" className="underline hover:text-gray-600">Bloomberg</a>, Forrester, SemiAnalysis</p>
    </DetailDrawer>
    <DetailDrawer isOpen={detail === 'stocks'} onClose={() => setDetail(null)} title="Full Stock Impact — All Major SaaS Companies">
      <table className="w-full text-sm">
        <thead><tr className="border-b border-gray-200"><th className="text-left py-2 text-gray-500 text-xs font-semibold uppercase">Company</th><th className="text-right py-2 text-gray-500 text-xs font-semibold uppercase">Drop</th><th className="text-left py-2 pl-4 text-gray-500 text-xs font-semibold uppercase">Note</th></tr></thead>
        <tbody className="text-gray-700">
          {[
            ['HubSpot', '-50%+', 'Hardest hit CRM player'],
            ['Monday.com', '-40%+', 'Project management collapse'],
            ['Workday', '-35%', 'Ensign\'s HR/finance provider'],
            ['Atlassian', '-35%', 'First-ever seat decline'],
            ['Adobe', '-30-35%', 'Creative AI disruption'],
            ['ServiceNow', '-30-40%', '9 consecutive beats ignored'],
            ['Salesforce', '-28%', 'Net-new logos declining'],
            ['Thomson Reuters', '-20%', 'Legal/professional services'],
            ['Gartner', '-33%+', 'Research/advisory disruption'],
            ['Asana', '-33%+', 'Work management disruption'],
          ].map(([co, drop, note]) => (
            <tr key={co} className="border-b border-gray-100"><td className="py-2 font-medium">{co}</td><td className="py-2 text-right text-red-600 font-bold">{drop}</td><td className="py-2 pl-4 text-xs text-gray-400">{note}</td></tr>
          ))}
        </tbody>
      </table>
      <p className="mt-4 text-xs text-gray-400">The repricing is structural, not cyclical. Forward multiples collapsed from ~39x to ~21x — a new equilibrium.</p>
    </DetailDrawer>
    <div className="max-w-4xl mx-auto">
      <SectionLabel color="text-red-500">February 3, 2026</SectionLabel>
      <h2 className="reveal stagger-2 text-[2.6rem] font-bold tracking-[-0.02em] text-gray-900 text-center mb-8">Wall Street figured it out <span className="text-red-500">in one day</span></h2>
      <div className="reveal stagger-3 text-center mb-8">
        <span className="text-[5rem] font-extrabold tracking-[-0.03em] number-danger leading-none">$2T</span>
        <p className="text-gray-500 text-sm mt-2">wiped from SaaS market cap — triggered by AI agent capabilities becoming undeniable</p>
      </div>
      <div className="grid grid-cols-4 gap-4 mb-8">
        {[
          { company: 'Workday', drop: '-35%', highlight: true },
          { company: 'Salesforce', drop: '-28%' },
          { company: 'HubSpot', drop: '-50%' },
          { company: 'Atlassian', drop: '-35%' },
        ].map((s, i) => (
          <div key={s.company} className={`reveal stagger-${i + 4} text-center py-5 px-3 rounded-2xl border card-lift ${s.highlight ? 'border-red-300 bg-red-50 shadow-sm' : 'border-gray-200 bg-white shadow-sm'}`}>
            <p className="text-xs text-gray-400 font-medium mb-1">{s.company}</p>
            <p className="text-2xl font-extrabold text-red-500">{s.drop}</p>
          </div>
        ))}
      </div>
      <div className="reveal stagger-8 bg-white rounded-2xl border border-gray-200 p-5 text-center shadow-sm">
        <p className="text-[11px] uppercase tracking-wider text-amber-600 font-semibold mb-2">March 2026 Update</p>
        <p className="text-sm text-gray-500 max-w-3xl mx-auto leading-relaxed">
          Forward earnings multiples collapsed from <span className="font-bold text-gray-900">39x to 21x</span>. <span className="font-bold text-gray-900">Deutsche Bank</span>: disruption fears show <span className="text-red-500 font-semibold">21% multiple compression</span>. <span className="font-bold text-gray-900">Goldman Sachs</span>: software at 22x forward earnings — less than half the decade average.
        </p>
        <p className="text-[10px] text-gray-400 mt-3">
          <a href="https://www.inc.com/brian-contreras/deutsche-bank-saaspocalypse-software-stocks-trade-discount/91315100" target="_blank" rel="noopener" className="underline hover:text-gray-600">Deutsche Bank/Inc</a> · <a href="https://www.cnbc.com/2026/02/06/ai-anthropic-tools-saas-software-stocks-selloff.html" target="_blank" rel="noopener" className="underline hover:text-gray-600">CNBC</a> · <a href="https://techcrunch.com/2026/03/01/saas-in-saas-out-heres-whats-driving-the-saaspocalypse/" target="_blank" rel="noopener" className="underline hover:text-gray-600">TechCrunch</a> · <a href="https://www.bloomberg.com/news/articles/2026-02-04/what-s-behind-the-saaspocalypse-plunge-in-software-stocks" target="_blank" rel="noopener" className="underline hover:text-gray-600">Bloomberg</a>
        </p>
        <div className="flex justify-center gap-4 mt-3">
          <DetailTrigger label="Full 60-day timeline" onClick={() => setDetail('timeline')} />
          <DetailTrigger label="All stock impacts" onClick={() => setDetail('stocks')} />
        </div>
      </div>
      <p className="reveal stagger-8 text-center text-gray-400 text-sm mt-5">
        Ensign uses <span className="text-red-500 font-semibold">Workday</span>. This is your exposure.
      </p>
    </div>
    </>
  );
}

function QuotesSlide() {
  const heroQuotes = [
    { text: '"SaaS applications are essentially CRUD databases with business logic. In the future, this logic will migrate to AI agents. The agent will orchestrate across multiple SaaS applications."', name: 'Satya Nadella — Microsoft CEO', date: 'Oct 2025', url: 'https://www.outlookbusiness.com/artificial-intelligence/microsoft-ceo-satya-nadella-reveals-how-ai-agents-will-disrupt-saas-models' },
    { text: '"AI will be able to do basically everything that humans do. We\'ll see AI replace 50% of white-collar jobs within 1 to 5 years — software engineers first."', name: 'Dario Amodei — Anthropic CEO', date: 'Jan 2025', url: 'https://kiboshib.com/quotes-about-ai/' },
    { text: '"Digital labor is a multi-trillion-dollar TAM." Salesforce cut 4,000 customer service roles because AI agents resolve 85% of inquiries. "I need less heads."', name: 'Marc Benioff — Salesforce CEO', date: 'Sep 2025', url: 'https://www.cnbc.com/2025/09/02/salesforce-ceo-confirms-4000-layoffs-because-i-need-less-heads-with-ai.html' },
    { text: '"In the next one year, the vast majority of programmers will be replaced by AI programmers. AI systems will soon recursively write and improve on their own code."', name: 'Eric Schmidt — Ex-Google CEO', date: 'Apr 2025', url: 'https://san.com/cc/former-google-ceo-predicts-ai-will-replace-most-programmers-in-a-year/' },
  ];
  const compactQuotes = [
    { text: '"The notion that business applications exist could collapse in the agentic AI era."', name: 'Nadella — Jan 2026', url: 'https://www.cxtoday.com/data-analytics/microsoft-ceo-ai-agents-will-transform-saas-as-we-know-it/' },
    { text: '"The agentic AI inflection point has arrived. IT departments will become HR for digital employees."', name: 'Jensen Huang — Nvidia', url: 'https://kiboshib.com/quotes-about-ai/' },
    { text: '"AI agents are joining the workforce. Are we overexcited? Yes. Is AI the most important thing? Also yes."', name: 'Sam Altman — OpenAI', url: 'https://www.inc.com/ben-sherry/sam-altman-says-ai-agents-will-transform-the-workforce-in-2025/91103146' },
    { text: '"2026 is the year of agentic collaboration. AI agents are saving workers a day a week now."', name: 'Bill McDermott — ServiceNow', url: 'https://cloudwars.com/innovation-leadership/servicenow-ai-agents-will-boost-productivity-20-this-year-50-next-year-says-ceo-bill-mcdermott/' },
    { text: '"Per-seat pricing doesn\'t work when agents do the work."', name: 'Salesforce — Feb 2026', url: 'https://www.deloitte.com/us/en/insights/industry/technology/technology-media-and-telecom-predictions/2026/saas-ai-agents.html' },
  ];
  return (
    <div className="max-w-4xl mx-auto">
      <SectionLabel>The Signal Your Vendors Won't Share</SectionLabel>
      <h2 className="reveal stagger-2 text-[2.4rem] font-bold tracking-[-0.02em] text-gray-900 mb-8">What the people building AI<br />are actually saying</h2>
      <div className="grid grid-cols-2 gap-x-8 gap-y-0 mb-8">
        {heroQuotes.map((q, i) => (
          <div key={i} className={`reveal stagger-${i + 3} py-4 border-t border-gray-200`}>
            <p className="text-[14px] text-gray-600 leading-relaxed mb-2 italic">{q.text}</p>
            <div className="flex justify-between items-center">
              <span className="text-[11px] text-gray-400 font-semibold">{q.name} · {q.date}</span>
              <a href={q.url} target="_blank" rel="noopener" className="text-[10px] text-gray-300 hover:text-blue-500 underline">source</a>
            </div>
          </div>
        ))}
      </div>
      <div className="reveal stagger-7 grid grid-cols-5 gap-x-4 gap-y-0">
        {compactQuotes.map((q, i) => (
          <div key={i} className="py-3 border-t border-gray-100">
            <p className="text-[11px] text-gray-400 leading-snug mb-1">{q.text}</p>
            <div className="flex justify-between items-center">
              <span className="text-[10px] text-gray-300 font-semibold">{q.name}</span>
              <a href={q.url} target="_blank" rel="noopener" className="text-[9px] text-gray-300 hover:text-blue-500">src</a>
            </div>
          </div>
        ))}
      </div>
      <p className="reveal stagger-8 text-center text-gray-400 text-xs mt-6">
        Your AI committee hears watered-down versions of this from vendors whose business model depends on you <em>not</em> understanding it.
      </p>
    </div>
  );
}

function AgentsVsSaasSlide() {
  const [detail, setDetail] = useState(null);
  return (
    <>
    <DetailDrawer isOpen={detail === 'bcg'} onClose={() => setDetail(null)} title="BCG AI Value Gap — Tier 1 vs Tier 2">
      <p>BCG's September 2025 study of <strong className="text-gray-900">1,800+ organizations</strong> found that companies who build proprietary AI (Tier 1) achieve <strong className="text-gray-900">2.6x more EBITDA impact</strong> than those who buy vendor AI features (Tier 2).</p>
      <p><strong className="text-gray-900">Tier 1 (Builders):</strong> Own data pipeline, custom models, proprietary workflows. AI is a competitive moat.</p>
      <p><strong className="text-gray-900">Tier 2 (Buyers):</strong> Rely on SaaS vendors to add AI. Generic models, shared with competitors. This is Ensign's current trajectory.</p>
      <p><strong className="text-gray-900">The implication:</strong> At $5.06B revenue, the EBITDA difference could be <strong className="text-gray-900">$100M+ annually</strong>.</p>
      <p className="text-xs text-gray-400">Source: <a href="https://www.bcg.com/publications/2025/the-widening-ai-value-gap" target="_blank" rel="noopener" className="underline hover:text-gray-600">BCG — "The Widening AI Value Gap" (Sep 2025)</a></p>
    </DetailDrawer>
    <DetailDrawer isOpen={detail === 'cost'} onClose={() => setDetail(null)} title="Cost Comparison — Per-Seat vs Agentic">
      <p><strong className="text-gray-900">Per-Seat Model (Current):</strong></p>
      <ul className="list-disc ml-5 space-y-1"><li>Workday: ~$100-200/user/month for 10,000+ employees</li><li>PCC AI add-ons: $50-150/facility/month per module</li><li>Total: <strong className="text-red-600">$5M-15M/year</strong> across all vendor AI add-ons</li></ul>
      <p className="mt-3"><strong className="text-gray-900">Agentic Model (Proposed):</strong></p>
      <ul className="list-disc ml-5 space-y-1"><li>AWS Bedrock: $0.003-0.01 per 1K tokens</li><li>10,000 operations/day: ~$300/day</li><li>Total: <strong className="text-emerald-600">$100K-200K/year</strong> in compute costs</li></ul>
      <p className="mt-3">That's <strong className="text-gray-900">50-100x cheaper</strong> than vendor AI add-ons.</p>
    </DetailDrawer>
    <div className="max-w-4xl mx-auto">
      <SectionLabel>The Critical Distinction</SectionLabel>
      <h2 className="reveal stagger-2 text-[2.6rem] font-bold tracking-[-0.02em] text-gray-900 text-center mb-8">AI Agents ≠ SaaS with AI Features</h2>
      <div className="grid grid-cols-2 gap-5 mb-8">
        <div className="reveal stagger-3 bg-white rounded-2xl border border-red-200 p-7 shadow-sm">
          <h3 className="text-red-500 font-bold text-lg mb-4">SaaS Vendors Adding "AI"</h3>
          <ul className="space-y-3 text-sm text-gray-600">
            {[
              'AI bolted onto existing UI — you still navigate their screens',
              'Per-seat pricing + AI surcharge — pay more for your own data',
              'Data stays siloed in each vendor system',
              'Vendor roadmap sets your pace — 12-18 month feature cycles',
              'Generic models trained on broad data, not your operations',
              'Your PHI sent to their servers for AI processing',
            ].map(t => <li key={t} className="flex gap-2"><span className="text-red-400 font-bold flex-shrink-0">✗</span>{t}</li>)}
          </ul>
          <p className="text-xs text-gray-400 mt-4 italic">PCC "Chart Advisor," Workday "AI Assistant" — same database, new UI, premium price</p>
        </div>
        <div className="reveal stagger-4 bg-gradient-to-br from-blue-50 to-white rounded-2xl border border-blue-200 p-7 shadow-sm">
          <h3 className="text-blue-600 font-bold text-lg mb-4">Autonomous AI Agents</h3>
          <ul className="space-y-3 text-sm text-gray-600">
            {[
              'Agents connect directly to APIs — no UI needed',
              'Pennies per operation — 100x cheaper than per-seat',
              'Cross-system intelligence — PCC + Workday + GL + HR unified',
              'Your pace, your priorities — deploy in days, not years',
              'Models trained on Ensign\'s specific workflows and data',
              'All processing in your VPC — PHI never leaves',
            ].map(t => <li key={t} className="flex gap-2"><span className="text-emerald-500 font-bold flex-shrink-0">✓</span>{t}</li>)}
          </ul>
          <p className="text-xs text-blue-400 mt-4 italic">Tier 1 builders achieve 2.6x more EBITDA impact — BCG, Sep 2025</p>
        </div>
      </div>
      <div className="reveal stagger-5 text-center">
        <p className="text-gray-700 text-base font-medium">
          Asking your SaaS vendors to build AI for you is like asking Blockbuster to build Netflix.
        </p>
        <div className="flex justify-center gap-4 mt-3">
          <DetailTrigger label="BCG Tier 1 vs Tier 2 data" onClick={() => setDetail('bcg')} />
          <DetailTrigger label="Cost comparison breakdown" onClick={() => setDetail('cost')} />
        </div>
        <p className="text-gray-400 text-[10px] mt-2">
          <a href="https://www.deloitte.com/us/en/insights/industry/technology/technology-media-and-telecom-predictions/2026/saas-ai-agents.html" target="_blank" rel="noopener" className="underline hover:text-gray-600">Deloitte 2026</a> · <a href="https://www.bcg.com/publications/2025/the-widening-ai-value-gap" target="_blank" rel="noopener" className="underline hover:text-gray-600">BCG AI Value Gap</a>
        </p>
      </div>
    </div>
    </>
  );
}

function EnsignGapSlide() {
  const [detail, setDetail] = useState(null);
  return (
    <>
    <DetailDrawer isOpen={detail === 'board'} onClose={() => setDetail(null)} title="Ensign Board AI Readiness Assessment">
      <p>Of 11 board members and key executives analyzed, <strong className="text-gray-900">only one — Swati Abbott — has meaningful AI experience</strong>.</p>
      <table className="w-full text-xs mt-3">
        <thead><tr className="border-b border-gray-200"><th className="text-left py-2 text-gray-500">Person</th><th className="text-left py-2 text-gray-500">Role</th><th className="text-right py-2 text-gray-500">AI Score</th></tr></thead>
        <tbody>
          {[
            ['Swati Abbott', 'Board Director', '65%', 'text-emerald-600'],
            ['Suzanne Snapper', 'CFO', '15%', 'text-amber-600'],
            ['Dr. Agwunobi', 'Director', '15%', 'text-amber-600'],
            ['Spencer Burton', 'President/COO', '10%', 'text-red-500'],
            ['Barry Port', 'CEO/Chairman', '8%', 'text-red-500'],
            ['Barry M. Smith', 'Lead Ind. Director', '8%', 'text-red-500'],
            ['Daren Shaw', 'Audit Chair', '5%', 'text-red-500'],
            ['Mark Parkinson', 'Director', '5%', 'text-red-500'],
            ['Chad Keetch', 'CIO (Investment)', '5%', 'text-red-500'],
            ['Marivic Uychiat', 'VP Clinical', '5%', 'text-red-500'],
          ].map(([name, role, score, color]) => (
            <tr key={name} className="border-b border-gray-100"><td className="py-1.5 text-gray-700">{name}</td><td className="py-1.5 text-gray-400">{role}</td><td className={`py-1.5 text-right font-bold ${color}`}>{score}</td></tr>
          ))}
        </tbody>
      </table>
      <p className="mt-3 text-gray-400 text-xs">No AI committee. No CAIO, no CDO. CTO/CIO are operational IT, not strategic. Source: <a href="https://investor.ensigngroup.net/governance/board-of-directors/default.aspx" target="_blank" rel="noopener" className="underline hover:text-gray-600">Ensign IR</a></p>
    </DetailDrawer>
    <DetailDrawer isOpen={detail === 'earnings'} onClose={() => setDetail(null)} title="Barry Port's AI Statements — Full Analysis">
      {[
        ['"Buzzword of the Day"', 'Dismissive language. Signals leadership does not take AI seriously. Compare to Nadella: "Everything we do will be infused with AI."'],
        ['"Leverage Existing Partnerships"', 'Vendor-first strategy. Waiting for PCC/Workday to add AI = moving at vendor speed.'],
        ['"Great Committee and Thought Leadership"', 'Committee governance for AI is a death sentence. Committees meet monthly. AI evolves weekly.'],
        ['"Mundane Administrative Things"', 'AUTOMATION thinking (2020), not AGENT thinking (2026). Agents reason, plan, and optimize.'],
        ['"Looking More Into the Future"', 'Clinical AI is not the future. Johns Hopkins, HCA, Mayo are deploying now.'],
        ['"Same day as SemiAnalysis"', 'Feb 5, 2026: Ensign calls AI a buzzword. Same day Claude Code revealed at 4% of all GitHub commits.'],
      ].map(([flag, desc]) => <p key={flag}><strong className="text-red-600">{flag}</strong> — {desc}</p>)}
      <p className="text-xs text-gray-400 mt-2">Source: <a href="https://seekingalpha.com/article/4866691-the-ensign-group-inc-ensg-q4-2025-earnings-call-transcript" target="_blank" rel="noopener" className="underline hover:text-gray-600">Q4 2025 Earnings Call Transcript</a></p>
    </DetailDrawer>
    <div className="max-w-4xl mx-auto">
      <SectionLabel>The Gap</SectionLabel>
      <h2 className="reveal stagger-2 text-[2.4rem] font-bold tracking-[-0.02em] text-gray-900 mb-6">Ensign's stated plan vs. what's possible today</h2>
      <div className="grid grid-cols-2 gap-5 mb-6">
        <div className="reveal stagger-3 bg-white rounded-2xl border border-red-200 p-6 shadow-sm">
          <h3 className="text-red-500 font-bold mb-4">Current Strategy</h3>
          <div className="border-l-2 border-red-300 pl-4 mb-4">
            <p className="text-sm text-gray-500 italic leading-relaxed">"We've been highly involved in looking at opportunities where we can leverage mostly our existing partnerships with a lot of our enterprise providers..."</p>
            <p className="text-xs text-gray-400 mt-2 font-semibold">Barry Port — Q4 2025 · <a href="https://seekingalpha.com/article/4751931-ensign-group-inc-ensg-q4-2025-earnings-call-transcript" target="_blank" rel="noopener" className="underline hover:text-gray-600">transcript</a></p>
          </div>
          <ul className="space-y-2 text-sm text-gray-600">
            {['Wait for Workday to add AI features', 'Wait for PCC to add AI features', 'Pay premium for vendor-controlled AI', 'Vendor roadmaps set your pace', 'Data stays locked in siloed systems'].map(t => (
              <li key={t} className="flex gap-2"><span className="text-red-400">✗</span>{t}</li>
            ))}
          </ul>
        </div>
        <div className="reveal stagger-4 bg-gradient-to-br from-blue-50 to-white rounded-2xl border border-blue-200 p-6 shadow-sm">
          <h3 className="text-blue-600 font-bold mb-4">Agentic Alternative</h3>
          <ul className="space-y-2 text-sm text-gray-600">
            {[
              'AI agents connect to all data — PCC, Workday, Microsoft, financials, HR',
              'Build exactly what operations need across every function',
              'Zero SaaS dependency for new capabilities',
              'Your pace, your priorities, your IP',
              'Agents work 24/7 across all systems',
              '30-day deployment, not 18-month roadmap',
              'Every dollar of ROI tracked in real-time',
              'Costs pennies per operation',
            ].map(t => (
              <li key={t} className="flex gap-2"><span className="text-emerald-500">✓</span>{t}</li>
            ))}
          </ul>
        </div>
      </div>
      <div className="reveal stagger-5 bg-white rounded-2xl border border-gray-200 p-4 text-center shadow-sm">
        <p className="text-sm text-gray-600">Ensign AI Readiness Scorecard: <span className="text-red-500 font-bold">3/10</span> — strong operational foundation but critical leadership, governance, and strategy gaps</p>
        <div className="flex justify-center gap-4 mt-2">
          <DetailTrigger label="Board AI readiness scores" onClick={() => setDetail('board')} />
          <DetailTrigger label="Barry's earnings call analysis" onClick={() => setDetail('earnings')} />
        </div>
      </div>
    </div>
    </>
  );
}

function VisionSlide() {
  return (
    <div className="max-w-4xl mx-auto">
      <SectionLabel>The Vision</SectionLabel>
      <h2 className="reveal stagger-2 text-[2.4rem] font-bold tracking-[-0.02em] text-gray-900 mb-2">One platform. Every function. <span className="number-accent">Every decision.</span></h2>
      <p className="reveal stagger-3 text-gray-500 mb-6 max-w-2xl">AI agents connect to all of Ensign's data and run the business at a level of visibility and speed that has never been possible.</p>
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { title: 'Clinical Operations', desc: 'Compliance, audit automation, care plans, PCC documentation, survey readiness across 330+ SNFs' },
          { title: 'Financial & Billing', desc: 'Revenue management, AP/AR, billing audits, GL coding, Workday and financial systems' },
          { title: 'HR & Workforce', desc: 'Hiring, payroll, staffing optimization, credential tracking, performance management' },
          { title: 'M&A & Growth', desc: 'Due diligence, facility evaluation, market analysis, referral tracking, census optimization' },
          { title: 'Compliance & Regulatory', desc: 'CMS F-tags, state regulations, internal controls, audit trails, SOX' },
          { title: 'Communications & PR', desc: 'Investor relations, marketing, email intelligence, Microsoft 365 and SharePoint' },
        ].map((c, i) => (
          <div key={c.title} className={`reveal stagger-${i + 4} bg-white rounded-2xl border border-gray-200 p-4 shadow-sm card-lift`}>
            <h4 className="text-blue-600 font-semibold text-sm mb-1">{c.title}</h4>
            <p className="text-xs text-gray-500 leading-relaxed">{c.desc}</p>
          </div>
        ))}
      </div>
      <div className="reveal stagger-8 flex items-center justify-center gap-2 flex-wrap">
        {['PCC', 'Workday', 'Microsoft 365', 'SharePoint', 'AWS / Azure'].map(s => (
          <span key={s} className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 shadow-sm">{s}</span>
        ))}
        <ArrowRight className="w-4 h-4 text-blue-500" />
        <span className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold shadow-md">AI Agents</span>
        <ArrowRight className="w-4 h-4 text-blue-500" />
        <span className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 shadow-sm">Executive Intelligence</span>
      </div>
    </div>
  );
}

function HITLSlide() {
  return (
    <div className="max-w-4xl mx-auto">
      <SectionLabel>Human-in-the-Loop</SectionLabel>
      <h2 className="reveal stagger-2 text-[2.4rem] font-bold tracking-[-0.02em] text-gray-900 mb-2">Agents propose. Humans approve. <span className="number-accent">Every time.</span></h2>
      <p className="reveal stagger-3 text-gray-500 mb-6 max-w-2xl">The &lt;10 second decision flow: agents pre-pull ALL data from source systems. Humans never open another application.</p>
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { step: '1', title: 'Agent Detects', desc: 'Monitors PCC, Workday, CMS, GL systems 24/7. Identifies anomalies, opportunities, compliance gaps.' },
          { step: '2', title: 'Agent Analyzes', desc: 'Pulls all relevant data, cross-references systems, quantifies impact in dollars and risk.' },
          { step: '3', title: 'Agent Recommends', desc: 'Self-contained decision card with evidence, confidence score, and definitive recommendation.' },
          { step: '4', title: 'Human Decides', desc: 'Approve, reject, escalate, or defer. One click. Under 10 seconds. Full audit trail logged.' },
        ].map((s, i) => (
          <div key={s.step} className={`reveal stagger-${i + 4} bg-white rounded-2xl border border-gray-200 p-5 shadow-sm card-lift`}>
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white text-sm font-bold mb-3 shadow-sm">{s.step}</div>
            <h4 className="font-bold text-gray-900 text-sm mb-2">{s.title}</h4>
            <p className="text-xs text-gray-500 leading-relaxed">{s.desc}</p>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-4">
        {[
          { title: 'Governance Levels', desc: 'Level 0 (full approval) → Level 5 (autonomous). Start locked down, relax as trust is earned per agent, per facility.' },
          { title: 'Decision Replay', desc: 'Every action replayable. See exact data, reasoning, and confidence at time of decision. SOX-ready from day one.' },
          { title: 'Kill Switch', desc: 'Disable any agent instantly — per facility, per function. Rollback any action. Zero-downtime governance.' },
        ].map((c, i) => (
          <div key={c.title} className={`reveal stagger-${i + 6} bg-emerald-50 rounded-2xl border border-emerald-200 p-4 shadow-sm`}>
            <h4 className="text-emerald-700 font-semibold text-sm mb-1">{c.title}</h4>
            <p className="text-xs text-gray-500 leading-relaxed">{c.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function SecuritySlide() {
  return (
    <div className="max-w-4xl mx-auto">
      <SectionLabel>Security Architecture</SectionLabel>
      <h2 className="reveal stagger-2 text-[2.4rem] font-bold tracking-[-0.02em] text-gray-900 mb-6">HIPAA, PHI, and security are solved problems</h2>
      <div className="reveal stagger-3 flex items-center justify-center gap-3 mb-8">
        <div className="px-5 py-3 bg-white border border-gray-200 rounded-xl text-center shadow-sm">
          <span className="text-sm font-semibold text-gray-900">All Ensign Data</span><br /><span className="text-[10px] text-gray-400">Never leaves your cloud</span>
        </div>
        <ArrowRight className="w-4 h-4 text-blue-500" />
        <div className="px-5 py-3 bg-blue-600 rounded-xl text-center shadow-md">
          <span className="text-sm font-semibold text-white">AWS Bedrock / Azure OpenAI</span><br /><span className="text-[10px] text-white/70">In-VPC Processing</span>
        </div>
        <ArrowRight className="w-4 h-4 text-blue-500" />
        <div className="px-5 py-3 bg-white border border-gray-200 rounded-xl text-center shadow-sm">
          <span className="text-sm font-semibold text-gray-900">AI Results</span><br /><span className="text-[10px] text-gray-400">Agents & dashboards</span>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="reveal stagger-4 bg-emerald-50 border border-emerald-200 rounded-2xl p-5 shadow-sm">
          <h4 className="text-emerald-700 font-semibold mb-2">The Agentic Approach</h4>
          <p className="text-sm text-gray-600 leading-relaxed"><span className="text-gray-900 font-semibold">AWS Bedrock</span> — BAA-covered, SOC 2 Type II, HITRUST. All data in your VPC. Same security as Ensign's current cloud. No new attack surface.</p>
        </div>
        <div className="reveal stagger-5 bg-red-50 border border-red-200 rounded-2xl p-5 shadow-sm">
          <h4 className="text-red-600 font-semibold mb-2">What SaaS Vendors Do</h4>
          <p className="text-sm text-gray-600 leading-relaxed">Send <span className="text-gray-900 font-semibold">your data to their servers</span>. Third-party processing. Additional BAAs. Lost visibility. They charge you for adding AI to data that was already yours.</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="reveal stagger-6 bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
          <h4 className="text-blue-600 font-semibold text-sm mb-2">Regulatory Compliance</h4>
          <ul className="text-xs text-gray-600 space-y-1.5">
            <li><span className="text-gray-900 font-semibold">HIPAA</span> — BAA-covered, PHI never leaves VPC</li>
            <li><span className="text-gray-900 font-semibold">SOX</span> — Immutable logs, separation of duties</li>
            <li><span className="text-gray-900 font-semibold">CMS</span> — F-tag mapping, survey readiness</li>
            <li><span className="text-gray-900 font-semibold">State regs</span> — Multi-state rules in agent logic</li>
          </ul>
        </div>
        <div className="reveal stagger-7 bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
          <h4 className="text-blue-600 font-semibold text-sm mb-2">AI Safety Controls</h4>
          <ul className="text-xs text-gray-600 space-y-1.5">
            <li><span className="text-gray-900 font-semibold">Hallucination guard</span> — Sources cited, confidence scored</li>
            <li><span className="text-gray-900 font-semibold">Read-only default</span> — Write requires approval</li>
            <li><span className="text-gray-900 font-semibold">Governance levels</span> — Full approval → relax</li>
            <li><span className="text-gray-900 font-semibold">Kill switch</span> — Disable any agent instantly</li>
          </ul>
        </div>
      </div>
      <p className="reveal stagger-8 text-center text-gray-400 text-xs mt-5">
        Average healthcare breach costs <span className="text-gray-900 font-semibold">$10.9M</span> (IBM, 2025). 80% originate from vendors.
      </p>
    </div>
  );
}

function DataSourcesSlide() {
  return (
    <div className="max-w-4xl mx-auto">
      <SectionLabel>Technical Architecture</SectionLabel>
      <h2 className="reveal stagger-2 text-[2.4rem] font-bold tracking-[-0.02em] text-gray-900 text-center mb-6">Every system feeds one intelligence layer</h2>
      <div className="grid grid-cols-2 gap-4 mb-6">
        {[
          { system: 'PointClickCare (PCC)', data: 'Clinical records, MDS, care plans, medications, assessments, census', agents: 'Clinical Compliance, Documentation Intelligence, Survey Readiness' },
          { system: 'Workday', data: 'HR records, payroll, benefits, scheduling, time & attendance', agents: 'Workforce Optimization, Predictive Staffing, Credentialing' },
          { system: 'Microsoft 365 / SharePoint', data: 'Email, documents, SOPs, policies, communications', agents: 'Document Intelligence, Policy Compliance, Communication Monitoring' },
          { system: 'Financial Systems', data: 'GL, AP/AR, billing, claims, treasury, budgets, managed care', agents: 'Revenue Cycle, Billing Audits, Financial Forecasting, PDPM' },
          { system: 'CMS / State Regulators', data: 'F-tags, surveys, star ratings, quality measures', agents: 'Regulatory Monitoring, Survey Readiness, Quality Tracking' },
          { system: 'Internal / Custom', data: 'Referrals, census tracking, M&A pipeline, vendor contracts', agents: 'Admissions Intelligence, M&A Due Diligence, Supply Chain' },
        ].map((s, i) => (
          <div key={s.system} className={`reveal stagger-${i + 3} bg-white rounded-2xl border border-gray-200 p-4 shadow-sm card-lift`}>
            <h4 className="text-blue-600 font-semibold text-sm mb-2">{s.system}</h4>
            <p className="text-xs text-gray-400 mb-2">{s.data}</p>
            <p className="text-xs text-gray-600"><span className="text-emerald-600 font-semibold">Agents:</span> {s.agents}</p>
          </div>
        ))}
      </div>
      <div className="reveal stagger-8 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-200 p-5 text-center shadow-sm">
        <p className="text-sm text-gray-700 font-medium mb-1">26 specialized AI agents across 8 departments</p>
        <p className="text-xs text-gray-500">Each agent has read access to relevant systems. Write-back requires human approval. All actions logged.</p>
      </div>
    </div>
  );
}

function DemoSlide({ onLaunchApp }) {
  return (
    <div className="max-w-4xl mx-auto text-center">
      <SectionLabel>Live Demo</SectionLabel>
      <h2 className="reveal stagger-2 text-[2.6rem] font-bold tracking-[-0.02em] text-gray-900 mb-3">See every area of the business<br />like never before</h2>
      <p className="reveal stagger-3 text-gray-500 max-w-2xl mx-auto mb-8">A working agentic dashboard — AI agents monitoring clinical compliance, generating financial insights, surfacing operational intelligence, and writing documentation with nurse-controlled approval.</p>
      <div className="grid grid-cols-4 gap-4 mb-8">
        {[
          { num: '330+', label: 'Facilities Visible' },
          { num: '65', label: 'Agent Pages Live' },
          { num: '26', label: 'AI Agents' },
          { num: '8', label: 'Departments' },
        ].map((s, i) => (
          <div key={s.label} className={`reveal stagger-${i + 4} bg-white rounded-2xl border border-gray-200 p-5 shadow-sm`}>
            <div className="text-3xl font-extrabold number-accent">{s.num}</div>
            <p className="text-xs text-gray-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>
      <button
        onClick={onLaunchApp}
        className="reveal stagger-8 inline-flex items-center gap-2 px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl text-lg transition-all shadow-lg shadow-blue-600/25 hover:shadow-blue-600/35 hover:-translate-y-0.5"
      >
        <Play className="w-5 h-5" /> Launch Live Demo
      </button>
      <p className="reveal stagger-8 text-gray-400 text-xs mt-5">Built in days, not months. This is what agentic looks like.</p>
    </div>
  );
}

function WhyAndrewSlide() {
  return (
    <div className="max-w-4xl mx-auto">
      <SectionLabel>Why Andrew</SectionLabel>
      <h2 className="reveal stagger-2 text-[2.4rem] font-bold tracking-[-0.02em] text-gray-900 mb-6">The intersection that doesn't exist elsewhere</h2>
      <div className="space-y-3 mb-6">
        {[
          { icon: '★', text: '13 years SNF operations + 5 years public accounting & internal controls — I know the clinical workflows, survey process, and documentation from the inside. Financial processes, audit methodology, and internal controls from Big 4 training.' },
          { icon: '☷', text: 'Full-stack AI architecture — Anthropic, OpenAI, AWS Bedrock, Azure. Production agentic systems including a clinical audit platform built on PCC, a voice-based clinical app, and enterprise dashboards — all running for pennies per operation.' },
          { icon: '◃', text: 'Every integration layer — PCC, Workday, Microsoft 365, SharePoint, Azure, AWS, internal servers. I connect all of them into a single agentic layer.' },
          { icon: '⚙', text: 'Already built, not just pitched — The compliance engine, the clinical app, the financial dashboards. This isn\'t a PowerPoint and a timeline. The prototypes work. I just need your data.' },
        ].map((item, i) => (
          <div key={i} className={`reveal stagger-${i + 3} flex gap-4 items-start bg-white rounded-2xl border border-gray-200 p-5 shadow-sm card-lift`}>
            <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center flex-shrink-0 text-white text-sm shadow-sm">{item.icon}</div>
            <p className="text-sm text-gray-600 leading-relaxed">{item.text}</p>
          </div>
        ))}
      </div>
      <div className="reveal stagger-7 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-200 p-5 text-center shadow-sm">
        <p className="text-sm text-gray-700 font-medium">One person + AI agents replaces what normally costs <span className="number-accent font-bold">$1.5M–$2.5M</span> in MBB consulting fees</p>
        <p className="text-xs text-gray-500 mt-1">McKinsey, Bain, BCG frameworks — same rigor, same-day delivery, plus implementation</p>
        <a href="#/demo/frameworks" target="_blank" rel="noopener" className="inline-flex items-center gap-1 text-[11px] text-blue-500 hover:text-blue-700 font-medium mt-2 transition-colors">
          <ExternalLink className="w-3 h-3" /> View all 8 frameworks applied to Ensign
        </a>
      </div>
    </div>
  );
}

function AskSlide() {
  const [detail, setDetail] = useState(null);
  return (
    <>
    <DetailDrawer isOpen={detail === 'roi'} onClose={() => setDetail(null)} title="ROI Model — Conservative Annual Value Creation">
      <table className="w-full text-xs">
        <thead><tr className="border-b border-gray-200"><th className="text-left py-2 text-gray-500 uppercase">Value Lever</th><th className="text-right py-2 text-gray-500 uppercase">Annual Impact</th></tr></thead>
        <tbody>
          {[
            ['Documentation Intelligence', '$15M – $40M', 'Reduce survey deficiencies 15-20% across 378 facilities'],
            ['Referral Conversion', '$20M – $50M', 'Improve referral acceptance accuracy by 10%'],
            ['Predictive Staffing', '$25M – $60M', 'Reduce agency labor 8-12% (2-3x cost)'],
            ['MDS Optimization', '$30M – $75M', 'Capture 2-3% additional reimbursement'],
            ['M&A Due Diligence', '$10M – $25M', '51 acquisitions in 2025 — faster, better'],
            ['Avoided Vendor AI', '$5M – $15M', 'Skip PCC/Workday AI add-ons'],
            ['Avoided Consulting', '$2M – $5M', 'Replace MBB engagements'],
            ['Reduced Breach Risk', '$5M – $15M', 'Avg $10.9M per breach (IBM)'],
          ].map(([lever, impact, note]) => (
            <tr key={lever} className="border-b border-gray-100">
              <td className="py-2"><span className="text-gray-700 font-medium">{lever}</span><br/><span className="text-gray-400 text-[10px]">{note}</span></td>
              <td className="py-2 text-right text-emerald-600 font-bold whitespace-nowrap">{impact}</td>
            </tr>
          ))}
          <tr className="border-t-2 border-gray-300">
            <td className="py-2 text-gray-900 font-bold">Total Annual Value</td>
            <td className="py-2 text-right font-bold number-accent">$112M – $285M</td>
          </tr>
        </tbody>
      </table>
      <p className="mt-3 text-gray-400 text-xs">2.2%–5.6% of $5.06B revenue. Sources: BCG, IBM, Deloitte, Ensign FY2025.</p>
    </DetailDrawer>
    <DetailDrawer isOpen={detail === 'frameworks'} onClose={() => setDetail(null)} title="Strategic Frameworks Applied">
      <p>8 gold-standard consulting frameworks — same tools McKinsey, Bain, BCG charge $1.5M–$2.5M to apply:</p>
      <ul className="list-disc ml-5 space-y-2 mt-3">
        {[
          ['McKinsey Build vs. Buy Matrix', '$400K-$750K. Quantified scoring across 6 dimensions.'],
          ['Bain Build/Buy/Partner Trident', '$500K-$1M. Per-capability evaluation.'],
          ['BCG Four Tensions (Agentic)', 'Nov 2025. Most current agentic AI research.'],
          ['McKinsey 7-S Model', '45-year gold standard for organizational alignment.'],
          ['Moore\'s Core vs. Context', 'Binary classification preventing "everything is important."'],
          ['Porter\'s Five Forces', 'Applied to vendor dependency (advanced use).'],
          ['Bain TCO Model', '5-year horizon with IP valuation. PE-grade.'],
          ['BCG AI Value Gap', '1,800+ orgs. Tier 1 = 2.6x EBITDA.'],
        ].map(([name, desc]) => <li key={name}><strong className="text-gray-900">{name}</strong> — {desc}</li>)}
      </ul>
    </DetailDrawer>
    <div className="max-w-4xl mx-auto">
      <SectionLabel>The Engagement</SectionLabel>
      <h2 className="reveal stagger-2 text-[2.4rem] font-bold tracking-[-0.02em] text-gray-900 mb-6">30 days to first value. <span className="number-accent">Immediate ROI.</span></h2>
      <div className="grid grid-cols-2 gap-5 mb-5">
        <div className="reveal stagger-3">
          <h3 className="text-emerald-700 font-semibold text-sm mb-3">What I need from Ensign</h3>
          <div className="space-y-2">
            {['Data access — PCC, Workday, financials, M365, SharePoint', 'SOPs and workflow documentation', 'Auth credentials for system integration'].map(t => (
              <div key={t} className="bg-white border border-gray-200 rounded-xl p-3 shadow-sm"><p className="text-sm text-gray-600">{t}</p></div>
            ))}
          </div>
        </div>
        <div className="reveal stagger-4">
          <h3 className="text-gray-400 font-semibold text-sm mb-3">What I don't need</h3>
          <div className="space-y-2 pt-1">
            {['Your dev team or IT staff', 'Your SaaS vendors', 'Months of planning'].map(t => (
              <div key={t} className="p-3"><p className="text-sm text-gray-300 line-through">{t}</p></div>
            ))}
          </div>
        </div>
      </div>
      <div className="reveal stagger-5 bg-white rounded-2xl border border-gray-200 p-5 mb-4 shadow-sm">
        <h4 className="text-blue-600 font-semibold text-sm mb-3">First 30 Days</h4>
        <div className="grid grid-cols-3 gap-3">
          {[
            { title: 'Clinical app', desc: 'voice-based, PCC-connected, nurse-ready' },
            { title: 'All data connected', desc: 'every system feeding one intelligence layer' },
            { title: 'Financial audits', desc: 'automated from live data' },
          ].map(c => (
            <div key={c.title} className="bg-blue-50 rounded-xl p-3 border border-blue-100">
              <p className="text-xs text-gray-700"><span className="text-gray-900 font-semibold">{c.title}</span> — {c.desc}</p>
            </div>
          ))}
        </div>
      </div>
      <div className="reveal stagger-6 bg-white rounded-2xl border border-gray-200 p-5 mb-4 shadow-sm">
        <h4 className="text-amber-600 font-semibold text-sm mb-2">Then — Scale</h4>
        <p className="text-sm text-gray-600 leading-relaxed">
          5–6 AI engineers under my direction. Expand to every business function. Your team provides oversight. Agents handle everything else. <span className="text-gray-900 font-bold">The highest-level thinkers stay. Everything else is agentic.</span>
        </p>
      </div>
      <div className="reveal stagger-7 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-200 p-5 text-center shadow-sm">
        <p className="text-base font-bold text-gray-900 mb-1">Every dollar of ROI is tracked by the same agents that generate it.</p>
        <p className="text-sm text-gray-600">Conservative annual value creation: <span className="number-accent font-bold text-lg">$112M – $285M</span></p>
        <div className="flex justify-center gap-4 mt-2">
          <DetailTrigger label="Full ROI breakdown" onClick={() => setDetail('roi')} />
          <DetailTrigger label="8 consulting frameworks applied" onClick={() => setDetail('frameworks')} />
          <a href="#/demo/frameworks" target="_blank" rel="noopener" className="inline-flex items-center gap-1 text-[11px] text-blue-500 hover:text-blue-700 font-medium mt-1 transition-colors">
            <ExternalLink className="w-3 h-3" /> Full framework analysis
          </a>
        </div>
        <p className="text-xs text-gray-400 mt-2">Let's schedule a technical deep-dive this week.</p>
      </div>
    </div>
    </>
  );
}

/* ═══════════════════════════════════════════════════
   MAIN PRESENTATION COMPONENT
   ═══════════════════════════════════════════════════ */
export default function Presentation() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [slideKey, setSlideKey] = useState(0);
  const navigate = useNavigate();
  const totalSlides = SLIDES.length;
  const containerRef = useSlideReveal(slideKey);

  const goTo = useCallback((idx) => {
    const clamped = Math.max(0, Math.min(idx, totalSlides - 1));
    if (clamped !== currentSlide) {
      setCurrentSlide(clamped);
      setSlideKey(k => k + 1);
    }
  }, [totalSlides, currentSlide]);

  const next = useCallback(() => goTo(currentSlide + 1), [currentSlide, goTo]);
  const prev = useCallback(() => goTo(currentSlide - 1), [currentSlide, goTo]);

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === ' ' || e.key === 'PageDown') { e.preventDefault(); next(); }
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp' || e.key === 'PageUp') { e.preventDefault(); prev(); }
      else if (e.key === 'Escape') { navigate('/'); }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [next, prev, navigate]);

  const launchApp = () => {
    sessionStorage.setItem('fromPresentation', 'true');
    navigate('/');
  };

  const progress = ((currentSlide + 1) / totalSlides) * 100;

  const slideComponents = [
    <TitleSlide key="title" />,
    <RealitySlide key="reality" />,
    <SaaspocalypseSlide key="saaspocalypse" />,
    <QuotesSlide key="quotes" />,
    <AgentsVsSaasSlide key="agents-vs-saas" />,
    <EnsignGapSlide key="ensign-gap" />,
    <VisionSlide key="vision" />,
    <HITLSlide key="hitl" />,
    <SecuritySlide key="security" />,
    <DataSourcesSlide key="data-sources" />,
    <DemoSlide key="demo" onLaunchApp={launchApp} />,
    <WhyAndrewSlide key="why-andrew" />,
    <AskSlide key="ask" />,
  ];

  return (
    <>
    <style>{PRESENTATION_STYLES}</style>
    <div className="pres-root grain fixed inset-0 bg-[#f5f5f7] text-gray-900 overflow-hidden select-none">
      {/* Progress bar */}
      <div className="fixed top-0 left-0 w-full h-[3px] bg-gray-200 z-50">
        <div className="h-full progress-shimmer transition-all duration-500 ease-out" style={{ width: `${progress}%` }} />
      </div>

      {/* Nav dots — right edge */}
      <div className="fixed right-5 top-1/2 -translate-y-1/2 flex flex-col gap-2 z-50">
        {SLIDES.map((s, i) => (
          <button
            key={s.id}
            onClick={() => goTo(i)}
            title={s.label}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              i === currentSlide
                ? 'bg-blue-600 scale-[1.4] dot-active'
                : 'bg-gray-300 hover:bg-blue-400'
            }`}
          />
        ))}
      </div>

      {/* Slide counter */}
      <div className="fixed bottom-5 right-5 text-[11px] text-gray-400 font-mono z-50 tabular-nums tracking-wide">
        {currentSlide + 1} / {totalSlides}
      </div>

      {/* Arrow buttons */}
      <button
        onClick={prev}
        disabled={currentSlide === 0}
        className="fixed left-4 top-1/2 -translate-y-1/2 z-50 w-10 h-10 rounded-full bg-white/80 border border-gray-200 hover:bg-white flex items-center justify-center transition-all shadow-sm disabled:opacity-0 disabled:pointer-events-none"
      >
        <ChevronLeft className="w-5 h-5 text-gray-500" />
      </button>
      <button
        onClick={next}
        disabled={currentSlide === totalSlides - 1}
        className="fixed right-14 top-1/2 -translate-y-1/2 z-50 w-10 h-10 rounded-full bg-white/80 border border-gray-200 hover:bg-white flex items-center justify-center transition-all shadow-sm disabled:opacity-0 disabled:pointer-events-none"
      >
        <ChevronRight className="w-5 h-5 text-gray-500" />
      </button>

      {/* Back to app */}
      <button
        onClick={() => navigate('/')}
        className="fixed top-4 left-4 z-50 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/80 border border-gray-200 hover:bg-white text-xs text-gray-500 transition-all shadow-sm"
      >
        <ExternalLink className="w-3 h-3" /> App
      </button>

      {/* Slide content with crossfade */}
      <div ref={containerRef} key={slideKey} className="h-full flex items-center justify-center px-16 py-16 slide-enter">
        {slideComponents[currentSlide]}
      </div>
    </div>
    </>
  );
}
