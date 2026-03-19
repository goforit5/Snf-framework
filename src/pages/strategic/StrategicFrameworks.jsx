import { useState } from 'react';
import { PageHeader } from '../../components/Widgets';
import { Card } from '../../components/Widgets';
import { ChevronDown, ChevronRight, ExternalLink } from 'lucide-react';

const FRAMEWORKS = [
  {
    id: 'mckinsey-build-buy',
    name: 'McKinsey Build vs. Buy Matrix',
    origin: 'McKinsey Digital Practice',
    cost: '$400K–$750K engagement',
    team: '3–6 consultants, 6–8 weeks',
    why: 'The dominant framework used by Fortune 500 CIOs for every major technology sourcing decision since the 2010s. Forces quantified scoring across six dimensions — eliminates emotional bias and vendor-driven decision making.',
    dimensions: ['Strategic importance', 'Competitive differentiation', 'Integration complexity', 'Vendor maturity', 'Internal capability', 'Total cost of ownership'],
    ensignApplication: {
      decision: 'Should Ensign build proprietary AI agents or buy AI features from PCC, Workday, and other vendors?',
      scoring: [
        { dimension: 'Strategic Importance', score: '9/10', rationale: 'AI is the single largest strategic inflection facing SNF operators. This is not an IT decision — it is a business model decision. At $5.06B revenue, getting this wrong costs hundreds of millions.' },
        { dimension: 'Competitive Differentiation', score: '10/10', rationale: 'Vendor AI features are available to every competitor. Custom AI agents trained on Ensign\'s 378-facility dataset create a moat no competitor can replicate. BCG data: Tier 1 builders achieve 2.6x EBITDA vs Tier 2 buyers.' },
        { dimension: 'Integration Complexity', score: '8/10', rationale: 'Ensign runs PCC, Workday, M365, SharePoint, financial systems. Vendor AI operates within silos. Custom agents cross all system boundaries simultaneously — clinical + financial + HR + compliance in one decision.' },
        { dimension: 'Vendor Maturity', score: '3/10', rationale: 'PCC Chart Advisor, Workday AI Assistant are early-stage bolt-ons. SaaSpocalypse ($2T wipeout) signals that investors believe vendors cannot pivot fast enough. Vendor AI roadmaps are 12-18 months behind the frontier.' },
        { dimension: 'Internal Capability', score: '7/10 (with Andrew)', rationale: 'Ensign has zero AI capability today (board AI readiness: 3/10). With Andrew\'s engagement, capability jumps to 7/10 — the rare combination of SNF domain expertise + AI architecture + implementation ability.' },
        { dimension: 'Total Cost of Ownership', score: '9/10 Build', rationale: 'Vendor AI: $5-15M/year across all platforms. Custom agents: $100-200K/year in compute. Build wins by 50-100x on operating cost alone, plus the IP becomes an appreciating asset.' },
      ],
      verdict: 'BUILD — overwhelmingly. The only dimension where Buy scores is vendor maturity, and that advantage is evaporating as vendors scramble to bolt on AI. Every other dimension strongly favors building proprietary.',
    },
  },
  {
    id: 'bain-trident',
    name: 'Bain Build/Buy/Partner Trident',
    origin: 'Bain & Company',
    cost: '$500K–$1M engagement',
    team: '4–8 consultants, 8–12 weeks',
    why: 'Bain\'s proprietary three-way decision model used by their PE clients (Bain Capital manages $180B+ in assets). The nuance of evaluating per-capability rather than making a blanket build-or-buy decision is what separates sophisticated strategy from lazy thinking.',
    dimensions: ['Build: custom development', 'Buy: vendor procurement', 'Partner: strategic alliance'],
    ensignApplication: {
      decision: 'For each AI capability, should Ensign build, buy from a vendor, or partner with a specialist?',
      scoring: [
        { dimension: 'Clinical Documentation AI', score: 'BUILD', rationale: 'Core competitive advantage. Ensign\'s 378-facility clinical data is irreplaceable training data. PCC Chart Advisor is generic — Ensign\'s agents should know Ensign\'s specific documentation patterns, survey deficiency history, and clinical protocols.' },
        { dimension: 'Revenue Cycle / PDPM', score: 'BUILD', rationale: 'Direct revenue impact of $30-75M annually. Ensign\'s billing patterns, denial history, and payer relationships are proprietary data that generic vendor AI cannot optimize against.' },
        { dimension: 'Workforce Scheduling', score: 'BUILD', rationale: 'Labor is 65% of costs ($3.3B). Predictive scheduling requires facility-specific data — census patterns, employee preferences, historical call-out rates. Vendor scheduling AI uses generic models.' },
        { dimension: 'Cloud Infrastructure', score: 'BUY (AWS/Azure)', rationale: 'Not a differentiator. AWS Bedrock and Azure OpenAI provide the compute layer. Ensign should buy infrastructure but build the intelligence layer on top.' },
        { dimension: 'M&A Due Diligence', score: 'BUILD', rationale: '51 acquisitions in 2025. Ensign\'s internal benchmarks across 378 facilities are the most valuable dataset for evaluating targets. No vendor has this data.' },
        { dimension: 'HIPAA/Security Framework', score: 'PARTNER', rationale: 'Partner with AWS for BAA-covered infrastructure. The security framework itself should be built custom, but the underlying cloud security is a solved problem from AWS/Azure.' },
      ],
      verdict: 'BUILD for every capability that touches Ensign\'s proprietary data and operations. BUY infrastructure only. PARTNER on security compliance frameworks. The pattern: own the intelligence, rent the compute.',
    },
  },
  {
    id: 'bcg-four-tensions',
    name: 'BCG Four Tensions of the Agentic Enterprise',
    origin: 'BCG Henderson Institute + MIT Sloan, November 2025',
    cost: '$300K–$600K engagement',
    team: 'BCG Digital Ventures or Henderson Institute fellows',
    why: 'The most current academic-grade research on how enterprises should organize around agentic AI. Published November 2025 — most executives haven\'t read it yet, and most ops teams have never heard of it. This is brand-new strategic thinking.',
    dimensions: ['Autonomy vs. Control', 'Speed vs. Safety', 'Specialization vs. Generalization', 'Human vs. Agent authority'],
    ensignApplication: {
      decision: 'How should Ensign structure its agentic AI deployment to balance innovation speed with healthcare safety requirements?',
      scoring: [
        { dimension: 'Autonomy vs. Control', score: 'Graduated', rationale: 'Start with Level 0 (full human approval for every action). Facilities earn higher autonomy levels as trust is built. Some agents may reach Level 3-4 (auto-execute with audit) for low-risk tasks like scheduling, while clinical write-backs stay at Level 1-2.' },
        { dimension: 'Speed vs. Safety', score: 'Safety-first', rationale: 'Healthcare demands safety-first. But the framework shows that excessive caution is itself a risk — competitors who move faster build better training data, better models, better outcomes. The answer: move fast on read-only intelligence, move carefully on write-back actions.' },
        { dimension: 'Specialization vs. Generalization', score: 'Specialized agents', rationale: 'Ensign should deploy 26 specialized agents rather than one general AI. Each agent has deep expertise in its domain (billing agent knows PDPM rules, clinical agent knows F-tags). Generalist AI makes mistakes that specialists avoid.' },
        { dimension: 'Human vs. Agent Authority', score: 'Humans decide, agents execute', rationale: 'BCG research shows organizations that give agents execution authority but reserve decision authority to humans achieve the best outcomes. Ensign\'s HITL model — agents propose, humans approve — is exactly this pattern.' },
      ],
      verdict: 'Ensign\'s decentralized model (each facility operates semi-autonomously) is uniquely suited for agentic AI. The BCG Four Tensions framework validates the graduated governance approach: start safe, earn trust, increase autonomy over time.',
    },
  },
  {
    id: 'mckinsey-7s',
    name: 'McKinsey 7-S Model',
    origin: 'Tom Peters & Robert Waterman at McKinsey, 1982',
    cost: '$300K–$500K engagement',
    team: 'McKinsey OrgSolutions practice',
    why: 'Created in 1980, published in "In Search of Excellence" — the best-selling business book of the 20th century. Used in every major M&A integration, reorg, and transformation for 45 years. Endures because it reveals misalignment that pure financial analysis misses.',
    dimensions: ['Strategy', 'Structure', 'Systems', 'Shared Values', 'Skills', 'Staff', 'Style'],
    ensignApplication: {
      decision: 'Is Ensign organizationally aligned to execute an AI transformation?',
      scoring: [
        { dimension: 'Strategy', score: 'MISALIGNED', rationale: 'CEO calls AI "buzzword of the day." No AI strategy articulated. Vendor-dependency strategy contradicts industry direction. The Q4 2025 earnings call signals no strategic urgency.' },
        { dimension: 'Structure', score: 'FAVORABLE', rationale: 'Ensign\'s decentralized model is actually ideal for agentic AI. Each facility can pilot independently. But there\'s no AI leadership structure — technology reports to CFO, not a strategic tech leader.' },
        { dimension: 'Systems', score: 'READY', rationale: 'PCC, Workday, M365 all have APIs. The data infrastructure exists. What\'s missing is the intelligence layer that connects them. This is exactly what the agentic platform provides.' },
        { dimension: 'Shared Values', score: 'PARTIALLY ALIGNED', rationale: 'Ensign values operational excellence and autonomous facility leadership — both align with agentic AI. But there\'s a cultural resistance to "replacing" roles, which needs reframing as "augmenting" highest-value work.' },
        { dimension: 'Skills', score: 'CRITICAL GAP', rationale: 'Board AI readiness: 3/10. Only Swati Abbott has analytics background. No CAIO, no CDO. CTO/CIO are operational IT. This is the single biggest barrier — solved by Andrew\'s engagement.' },
        { dimension: 'Staff', score: 'VULNERABLE', rationale: '"Data services team" celebrated by Barry is exactly the function AI agents will automate first. Staff redeployment plan needed — move data packaging people into data strategy roles.' },
        { dimension: 'Style', score: 'NEEDS SHIFT', rationale: 'Committee-based AI governance is too slow. AI evolves weekly, committees meet monthly. Need to shift to agile deployment with rapid iteration and feedback loops.' },
      ],
      verdict: 'The 7-S analysis reveals Ensign has strong operational foundations (Structure, Systems) but critical gaps in Strategy, Skills, and Style. The engagement directly addresses these: Andrew provides the Skills, the agentic platform provides the Systems upgrade, and success redefines the Strategy.',
    },
  },
  {
    id: 'moore-core-context',
    name: 'Moore\'s Core vs. Context',
    origin: 'Geoffrey Moore, "Dealing with Darwin" (2005)',
    cost: 'Included in broader MBB engagement',
    team: 'Any MBB firm during strategy engagement',
    why: 'Adopted by every major consulting firm as the fastest way to determine where a company should invest vs. outsource. The simplicity is the genius — forces binary classification that prevents the "everything is important" trap that kills strategic focus.',
    dimensions: ['Core: creates competitive differentiation', 'Context: necessary but not differentiating'],
    ensignApplication: {
      decision: 'Which Ensign capabilities are Core (invest and differentiate) vs. Context (maintain or outsource)?',
      scoring: [
        { dimension: 'Clinical Quality & Outcomes', score: 'CORE', rationale: 'This is how Ensign wins referrals, earns star ratings, and justifies premium reimbursement. AI agents that improve clinical outcomes are core competitive weapons.' },
        { dimension: 'Revenue Optimization', score: 'CORE', rationale: 'At $5.06B revenue, even 1% improvement = $50M. PDPM optimization, denial prevention, and billing accuracy are direct competitive advantages.' },
        { dimension: 'M&A Intelligence', score: 'CORE', rationale: 'Ensign\'s growth model depends on acquiring and turning around facilities. AI-powered due diligence using 378-facility benchmarks is an unfair advantage no competitor can match.' },
        { dimension: 'SaaS Platform UIs', score: 'CONTEXT', rationale: 'Navigating Workday screens, PCC interfaces, SharePoint folders — this is context work. Agents eliminate the need for humans to interact with these UIs at all.' },
        { dimension: 'Data Packaging', score: 'CONTEXT', rationale: 'Barry celebrates "data services folks who package data into dashboards." This is context work that AI agents do in seconds. Redeploy these people to core strategic roles.' },
        { dimension: 'IT Infrastructure', score: 'CONTEXT', rationale: 'AWS/Azure infrastructure is commodity. Buy it, don\'t build it. Focus engineering talent on the intelligence layer, not the plumbing.' },
      ],
      verdict: 'Ensign is currently spending executive attention and budget on Context activities (vendor management, data packaging, UI navigation) while under-investing in Core differentiators (clinical AI, revenue AI, M&A intelligence). The agentic platform flips this: agents handle all Context work, freeing humans for Core decisions.',
    },
  },
  {
    id: 'porter-five-forces',
    name: 'Porter\'s Five Forces (Applied to Vendor Dependency)',
    origin: 'Michael Porter, Harvard Business School, 1979',
    cost: 'Included in broader MBB engagement',
    team: 'Strategy consulting or corporate strategy team',
    why: 'The canonical framework for competitive analysis taught in every MBA program on earth. Applying it to vendor dependency — rather than traditional market analysis — is an advanced use that demonstrates strategic sophistication most healthcare operators don\'t consider.',
    dimensions: ['Supplier Power', 'Buyer Power', 'Threat of Substitutes', 'Threat of New Entrants', 'Competitive Rivalry'],
    ensignApplication: {
      decision: 'How much power do Ensign\'s SaaS vendors (PCC, Workday) actually hold, and how does AI change that balance?',
      scoring: [
        { dimension: 'Supplier Power (Vendors)', score: 'HIGH → declining', rationale: 'PCC and Workday currently hold enormous power: high switching costs, data lock-in, no alternatives. But AI agents reduce this power dramatically — agents access data via APIs regardless of which vendor holds it. The SaaSpocalypse ($2T wipeout) reflects investors recognizing this shift.' },
        { dimension: 'Buyer Power (Ensign)', score: 'LOW → rising', rationale: 'Currently Ensign has weak negotiating position — can\'t credibly threaten to leave PCC. With an agentic layer, Ensign can progressively reduce vendor dependency, negotiate from strength, and eventually replace vendor UIs entirely.' },
        { dimension: 'Threat of Substitutes', score: 'EXTREME (for vendors)', rationale: 'AI agents ARE the substitute. They can replicate 80%+ of SaaS functionality at 1/50th the cost. This is why Salesforce dropped 28%, Workday dropped 35%. The market is pricing in substitution risk.' },
        { dimension: 'Threat of New Entrants', score: 'HIGH (for vendors)', rationale: 'Claude Code and similar AI coding tools mean a small team can replicate complex SaaS platforms in weeks. Vibe coding erodes software moats. Clinware raised $4.25M specifically to AI-disrupt SNF admissions.' },
        { dimension: 'Competitive Rivalry', score: 'INTENSIFYING', rationale: 'SNF operators who deploy AI first will have better outcomes, lower costs, faster M&A integration. First-mover advantage is real because training data compounds — the more Ensign uses AI, the better it gets.' },
      ],
      verdict: 'Porter\'s analysis shows Ensign is currently in a weak position (high vendor power, low buyer power). AI agents flip every force in Ensign\'s favor. The longer Ensign waits, the more entrenched vendor dependency becomes while competitors build their own AI moats.',
    },
  },
  {
    id: 'bain-tco',
    name: 'Bain Total Cost of Ownership Model',
    origin: 'Bain performance improvement practice',
    cost: '$200K–$400K engagement',
    team: 'Bain performance improvement practice',
    why: 'Goes beyond sticker price to model hidden costs, scaling economics, and residual value. This is what PE firms demand before any technology investment. The 5-year horizon with IP valuation is what separates financial rigor from vendor sales decks.',
    dimensions: ['Direct costs', 'Hidden costs', 'Scaling economics', 'Opportunity cost', 'Residual/IP value'],
    ensignApplication: {
      decision: 'What is the true 5-year cost of vendor AI vs. proprietary AI agents?',
      scoring: [
        { dimension: 'Year 1 Direct Costs', score: 'Build: $2-3M | Buy: $5-10M', rationale: 'Build includes Andrew\'s engagement + 5-6 AI engineers + AWS compute. Buy includes per-facility AI subscriptions across PCC, Workday, and other vendors × 378 facilities.' },
        { dimension: 'Year 2-5 Scaling', score: 'Build: flat | Buy: linear growth', rationale: 'Custom AI compute costs stay roughly flat as efficiency improves. Vendor costs scale linearly with facility count — each acquisition adds more per-seat licenses. At 15-20 acquisitions/year, this compounds.' },
        { dimension: 'Hidden Costs (Buy)', score: '$3-8M/year', rationale: 'Implementation consultants, data migration, training, integration between vendor AI products that don\'t talk to each other, vendor lock-in premium at renewal, opportunity cost of waiting for vendor roadmaps.' },
        { dimension: 'Opportunity Cost', score: '$112-285M/year', rationale: 'The ROI model shows $112-285M in annual value from agentic AI. Every month of delay = $9-24M in unrealized value. Vendor AI timeline: 12-18 months. Custom AI timeline: 30 days to first value.' },
        { dimension: '5-Year IP Value', score: 'Build: $50-100M+ | Buy: $0', rationale: 'Custom AI becomes an appreciating asset — proprietary models trained on 378-facility data. Vendor AI generates zero IP for Ensign. At scale, Ensign\'s AI could be licensed to other operators or spun into a technology subsidiary.' },
      ],
      verdict: '5-year TCO: Build = $12-18M total. Buy = $40-80M total. Build wins by 3-5x on cost alone, before counting the $50-100M+ in IP value created. The financial case is overwhelming.',
    },
  },
  {
    id: 'bcg-ai-value-gap',
    name: 'BCG AI Value Gap',
    origin: 'BCG GAMMA Practice, September 2025',
    cost: '$400K–$800K engagement',
    team: 'BCG AI practice (GAMMA)',
    why: 'Empirical evidence from 1,800+ organizations proving that Tier 1 companies (proprietary AI builders) achieve 2.6x more EBITDA impact than Tier 2 (vendor AI buyers). Data transforms the argument from opinion to proof.',
    dimensions: ['Tier 1: Build proprietary AI', 'Tier 2: Buy vendor AI', 'EBITDA impact differential'],
    ensignApplication: {
      decision: 'What is the measurable financial impact of being a Tier 1 builder vs. Tier 2 buyer?',
      scoring: [
        { dimension: 'Current Ensign Position', score: 'Below Tier 2', rationale: 'Ensign hasn\'t even reached Tier 2 (vendor AI buyer) status. AI readiness score: 3/10. Zero AI deployments. No AI strategy. Below the starting line of BCG\'s framework.' },
        { dimension: 'Tier 2 Path (Vendor AI)', score: '1x EBITDA impact', rationale: 'If Ensign buys PCC Chart Advisor, Workday AI, etc., they get the same generic tools as every other PCC/Workday customer. No competitive differentiation. EBITDA improvement: marginal, shared with competitors.' },
        { dimension: 'Tier 1 Path (Build)', score: '2.6x EBITDA impact', rationale: 'Building proprietary AI trained on Ensign\'s 378-facility dataset creates an unfair advantage. The AI improves with scale — every new acquisition makes the model better. This is a compounding competitive moat.' },
        { dimension: 'EBITDA Differential at Ensign Scale', score: '$100M+ annually', rationale: 'At $5.06B revenue with ~15% EBITDA margin (~$760M), a 2.6x improvement in AI-driven EBITDA impact could mean $100M+ in incremental annual earnings. Over 5 years: $500M+ in cumulative value.' },
        { dimension: 'Time Sensitivity', score: 'CRITICAL', rationale: 'BCG data shows the gap is widening. Tier 1 companies are accelerating. Tier 2 companies are falling further behind. Every quarter Ensign delays, the gap compounds. First-mover advantage in training data is irreversible.' },
      ],
      verdict: 'BCG\'s data is unambiguous: building proprietary AI delivers 2.6x the financial impact of buying vendor AI. At Ensign\'s scale, this translates to $100M+ in annual EBITDA differential. The question isn\'t whether to build — it\'s how fast Ensign can start.',
    },
  },
];

function FrameworkCard({ framework }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Header — always visible */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left p-6 hover:bg-gray-50/50 transition-colors"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-lg font-bold text-gray-900">{framework.name}</h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-600 border border-blue-100 whitespace-nowrap">{framework.cost}</span>
            </div>
            <p className="text-sm text-gray-500 mb-2">{framework.origin}</p>
            <p className="text-sm text-gray-600 leading-relaxed">{framework.why}</p>
          </div>
          <div className={`flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center transition-transform duration-200 ${expanded ? 'rotate-90' : ''}`}>
            <ChevronRight size={16} className="text-gray-400" />
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5 mt-3">
          {framework.dimensions.map(d => (
            <span key={d} className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-gray-100 text-gray-500">{d}</span>
          ))}
        </div>
      </button>

      {/* Expanded content — Ensign application */}
      {expanded && (
        <div className="border-t border-gray-100 bg-gray-50/30">
          <div className="p-6">
            <div className="mb-5">
              <p className="text-xs uppercase tracking-wider text-blue-600 font-semibold mb-1">Applied to Ensign's AI Decision</p>
              <p className="text-base font-semibold text-gray-900">{framework.ensignApplication.decision}</p>
            </div>

            <div className="space-y-3 mb-5">
              {framework.ensignApplication.scoring.map(s => (
                <div key={s.dimension} className="bg-white rounded-xl border border-gray-200 p-4">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-semibold text-gray-900">{s.dimension}</span>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                      s.score.includes('BUILD') || s.score.includes('CORE') || s.score.includes('FAVORABLE') || s.score.includes('READY') || s.score.includes('Graduated') || s.score.includes('Specialized') || s.score.includes('CRITICAL')
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : s.score.includes('MISALIGNED') || s.score.includes('GAP') || s.score.includes('VULNERABLE') || s.score.includes('HIGH') || s.score.includes('EXTREME') || s.score.includes('Below')
                          ? 'bg-red-50 text-red-600 border border-red-200'
                          : 'bg-blue-50 text-blue-600 border border-blue-200'
                    }`}>
                      {s.score}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed">{s.rationale}</p>
                </div>
              ))}
            </div>

            <div className="bg-blue-50 rounded-xl border border-blue-200 p-4">
              <p className="text-xs uppercase tracking-wider text-blue-600 font-semibold mb-1">Verdict</p>
              <p className="text-sm text-gray-800 leading-relaxed font-medium">{framework.ensignApplication.verdict}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function StrategicFrameworks() {
  const [expandAll, setExpandAll] = useState(false);

  return (
    <div>
      <PageHeader
        title="Strategic Decision Frameworks"
        subtitle="8 gold-standard consulting frameworks applied to Ensign's AI strategy decision"
      />

      {/* Summary bar */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Frameworks Applied', value: '8' },
          { label: 'Traditional Cost', value: '$1.5M–$2.5M' },
          { label: 'Time (MBB)', value: '12–16 weeks' },
          { label: 'Verdict', value: 'BUILD' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-gray-200 p-4 text-center shadow-sm">
            <div className="text-xl font-extrabold text-blue-600">{s.value}</div>
            <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Context card */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-200 p-6 mb-6 shadow-sm">
        <h3 className="text-sm font-bold text-gray-900 mb-2">Why These Frameworks Matter</h3>
        <p className="text-sm text-gray-600 leading-relaxed mb-3">
          These aren't academic exercises — they're the exact tools that drive billion-dollar decisions at the world's largest companies. Fortune 500 boards, PE firms, and every major strategic decision worth more than $50M relies on some combination of these frameworks. They exist because <span className="font-semibold text-gray-900">gut instinct doesn't survive scrutiny</span> in a boardroom, but structured analysis does.
        </p>
        <p className="text-sm text-gray-600 leading-relaxed">
          No one on a typical healthcare operations team knows these frameworks — not because they aren't smart, but because these tools live inside $1,500/hour consulting partnerships, MBA strategy courses, and PE due diligence rooms. The combination of cross-domain expertise spanning corporate strategy, technology architecture, financial modeling, competitive analysis, and organizational design <span className="font-semibold text-gray-900">does not exist in a single role at most healthcare companies</span>.
        </p>
      </div>

      {/* Toggle */}
      <div className="flex justify-end mb-4">
        <button
          onClick={() => setExpandAll(!expandAll)}
          className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
        >
          <ChevronDown size={14} className={`transition-transform ${expandAll ? 'rotate-180' : ''}`} />
          {expandAll ? 'Collapse All' : 'Expand All'}
        </button>
      </div>

      {/* Framework cards */}
      <div className="space-y-4">
        {FRAMEWORKS.map(f => (
          <FrameworkCard key={f.id} framework={{ ...f, ...(expandAll ? {} : {}) }} />
        ))}
      </div>

      {/* Bottom summary */}
      <div className="mt-8 bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <h3 className="text-lg font-bold text-gray-900 mb-3">Unified Verdict Across All 8 Frameworks</h3>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-emerald-50 rounded-xl border border-emerald-200 p-4">
            <p className="text-xs uppercase tracking-wider text-emerald-700 font-semibold mb-1">Every Framework Says</p>
            <p className="text-lg font-bold text-emerald-700">Build Proprietary AI</p>
            <p className="text-sm text-gray-600 mt-1">6 of 8 frameworks explicitly recommend Build. The remaining 2 (Moore, Porter) provide structural analysis that reinforces the Build decision.</p>
          </div>
          <div className="bg-red-50 rounded-xl border border-red-200 p-4">
            <p className="text-xs uppercase tracking-wider text-red-600 font-semibold mb-1">Waiting for Vendors Means</p>
            <p className="text-lg font-bold text-red-600">$9–24M/Month in Lost Value</p>
            <p className="text-sm text-gray-600 mt-1">The ROI model shows $112-285M in annual value. Every month of delay forfeits $9-24M in unrealized benefit while competitors build their moats.</p>
          </div>
        </div>
        <div className="text-center pt-2">
          <p className="text-sm text-gray-500">
            Sources: McKinsey, Bain & Company, BCG Henderson Institute, BCG GAMMA, MIT Sloan, Geoffrey Moore, Michael Porter
          </p>
          <p className="text-xs text-gray-400 mt-1">
            <a href="https://www.bcg.com/publications/2025/the-widening-ai-value-gap" target="_blank" rel="noopener" className="underline hover:text-gray-600">BCG AI Value Gap</a> ·
            <a href="https://www.deloitte.com/us/en/insights/industry/technology/technology-media-and-telecom-predictions/2026/saas-ai-agents.html" target="_blank" rel="noopener" className="underline hover:text-gray-600 ml-1">Deloitte 2026</a> ·
            <a href="https://seekingalpha.com/article/4866691-the-ensign-group-inc-ensg-q4-2025-earnings-call-transcript" target="_blank" rel="noopener" className="underline hover:text-gray-600 ml-1">Ensign Q4 2025</a>
          </p>
        </div>
      </div>
    </div>
  );
}
