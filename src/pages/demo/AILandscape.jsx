import { PageHeader } from '../../components/Widgets';
import { Card } from '../../components/Widgets';
import { ArrowRight } from 'lucide-react';

const FOUNDATION_MODELS = [
  { name: 'Anthropic (Claude)', tier: 'Frontier', models: 'Claude Opus 4.6, Claude Sonnet 4.6, Claude Haiku 4.5', strength: 'Strongest coding + reasoning. 80.9% SWE-bench. Claude Code writes 4% of all GitHub commits (135K/day). Safety-first architecture. Enterprise-grade via AWS Bedrock (BAA-covered).', ensign: 'Primary recommendation for Ensign. HIPAA-compliant via AWS Bedrock. Best agentic AI capabilities — agents that reason, plan, and execute multi-step workflows across systems.', color: 'bg-orange-50 border-orange-200' },
  { name: 'OpenAI (GPT)', tier: 'Frontier', models: 'GPT-4o, o1, o3, GPT-4.5', strength: 'Largest install base. ChatGPT has 300M+ weekly users. Strong general reasoning. Enterprise tier via Azure OpenAI (BAA-covered).', ensign: 'Strong alternative. Available via Azure OpenAI with HIPAA compliance. However, OpenAI has faced more safety incidents and data handling controversies than Anthropic.', color: 'bg-green-50 border-green-200' },
  { name: 'Google (Gemini)', tier: 'Frontier', models: 'Gemini 2.5 Pro, Gemini Ultra', strength: 'Largest context windows (1M+ tokens). Strong multimodal (text + image + video). Deep integration with Google Cloud Healthcare API.', ensign: 'Viable for specific use cases (large document processing). Google Cloud Healthcare API has HIPAA compliance. Less agentic capability than Claude.', color: 'bg-blue-50 border-blue-200' },
  { name: 'Meta (Llama)', tier: 'Open Source', models: 'Llama 3.1, Llama 4', strength: 'Open-source — can be self-hosted with zero data leaving your infrastructure. Community of 500M+ developers. No per-API-call cost after hardware investment.', ensign: 'Long-term consideration for maximum data privacy. Self-hosted = zero external data transfer. Weaker than frontier models today but improving rapidly.', color: 'bg-purple-50 border-purple-200' },
];

const STACK_LAYERS = [
  { layer: 'Foundation Models', examples: 'Claude, GPT, Gemini, Llama', who: 'Anthropic, OpenAI, Google, Meta', cost: '$0.003-0.01 per 1K tokens', description: 'The actual intelligence. These models reason, plan, write, analyze. They are the engine. Everything above this layer is a wrapper.' },
  { layer: 'Cloud AI Infrastructure', examples: 'AWS Bedrock, Azure OpenAI, Google Vertex AI', who: 'Amazon, Microsoft, Google', cost: 'Small markup on model pricing', description: 'HIPAA-compliant hosting. BAA-covered. SOC 2. These platforms provide the secure compute layer — PHI stays in your VPC.' },
  { layer: 'SaaS Vendors Adding "AI"', examples: 'PCC Chart Advisor, Workday AI, Salesforce Einstein', who: 'PCC, Workday, Salesforce, ServiceNow', cost: '$30-200/user/month premium', description: 'Vendors wrap foundation models in their UI and charge a 50-100x markup. They add minimal value — the same Claude/GPT model you can access directly for pennies. Their "AI" only sees their own data silo.' },
  { layer: 'Custom AI Agents (WHERE ENSIGN SHOULD BE)', examples: 'This platform — agentic framework', who: 'Built by Andrew for Ensign', cost: '$0.01-0.05 per agent operation', description: 'Direct access to foundation models. Custom agents trained on Ensign\'s data. Cross-system intelligence. No per-seat pricing. All IP belongs to Ensign. 50-100x cheaper than vendor AI.' },
];

export default function AILandscape() {
  return (
    <div>
      <PageHeader
        title="AI Landscape — A Decision-Maker's Guide"
        subtitle="Understanding where the real intelligence lives, who builds it, and why Ensign should access it directly"
      />

      {/* The key insight */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-200 p-6 mb-6 shadow-sm">
        <h3 className="text-sm font-bold text-gray-900 mb-2">The One Thing to Understand</h3>
        <p className="text-sm text-gray-600 leading-relaxed">
          Every "AI feature" from every SaaS vendor — PCC, Workday, Salesforce, ServiceNow — is powered by the <span className="font-bold text-gray-900">exact same foundation models</span> (Claude, GPT, Gemini) that Ensign can access directly for 1/50th the cost. Vendors add a UI wrapper, restrict the AI to their data silo, charge per-seat, and call it innovation. <span className="font-bold text-gray-900">The real innovation is the model underneath</span> — and Ensign can use it directly, across all systems, with no middleman.
        </p>
      </div>

      {/* What LLMs actually are */}
      <Card className="mb-6">
        <h3 className="text-base font-bold text-gray-900 mb-1">What Large Language Models (LLMs) Actually Are</h3>
        <p className="text-sm text-gray-500 mb-4">A concise explanation for executives, not engineers.</p>
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
            <h4 className="text-sm font-bold text-gray-900 mb-2">Think of it as...</h4>
            <p className="text-sm text-gray-600">An LLM is like the smartest analyst you've ever hired — one who has read every medical textbook, every CMS regulation, every financial report, every legal brief ever published. It can reason about any domain, write in any style, and process information thousands of times faster than a human.</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
            <h4 className="text-sm font-bold text-gray-900 mb-2">What they can do today</h4>
            <ul className="text-sm text-gray-600 space-y-1.5">
              <li>Write and debug software (80.9% accuracy — better than most engineers)</li>
              <li>Analyze financial statements and flag anomalies</li>
              <li>Read and summarize clinical documentation</li>
              <li>Cross-reference CMS regulations against facility practices</li>
              <li>Generate audit findings with cited evidence</li>
              <li>Draft communications in any voice or format</li>
            </ul>
          </div>
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
            <h4 className="text-sm font-bold text-gray-900 mb-2">What "Agentic" means</h4>
            <p className="text-sm text-gray-600">An AI <span className="font-semibold text-gray-900">agent</span> is an LLM given the ability to take actions — read databases, call APIs, write reports, send alerts. Instead of just answering questions, it <span className="font-semibold text-gray-900">monitors, analyzes, decides, and acts</span>. It's the difference between a search engine and an employee who uses the search engine, thinks about results, and does something about them.</p>
          </div>
        </div>
      </Card>

      {/* Foundation model players */}
      <Card className="mb-6">
        <h3 className="text-base font-bold text-gray-900 mb-1">The Major Players — Who Builds the Intelligence</h3>
        <p className="text-sm text-gray-500 mb-4">Four companies build the foundation models that power all AI. Everything else is a layer on top.</p>
        <div className="space-y-4">
          {FOUNDATION_MODELS.map(m => (
            <div key={m.name} className={`rounded-xl border p-5 ${m.color}`}>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-bold text-gray-900">{m.name}</h4>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${m.tier === 'Frontier' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>{m.tier}</span>
              </div>
              <p className="text-xs text-gray-500 mb-2"><span className="font-semibold">Models:</span> {m.models}</p>
              <p className="text-sm text-gray-600 mb-2">{m.strength}</p>
              <p className="text-sm text-gray-700"><span className="font-semibold text-blue-600">For Ensign:</span> {m.ensign}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* The stack — where SaaS sits */}
      <Card className="mb-6">
        <h3 className="text-base font-bold text-gray-900 mb-1">Where SaaS Vendors Sit in the AI Stack</h3>
        <p className="text-sm text-gray-500 mb-4">Understand the layers to understand why vendor AI is a 50-100x markup on commodity intelligence.</p>
        <div className="space-y-0">
          {STACK_LAYERS.map((l, i) => (
            <div key={l.layer} className={`p-5 border-x border-t ${i === STACK_LAYERS.length - 1 ? 'border-b rounded-b-xl' : ''} ${i === 0 ? 'rounded-t-xl' : ''} ${l.layer.includes('Custom') ? 'bg-blue-50 border-blue-300' : l.layer.includes('SaaS') ? 'bg-red-50 border-red-200' : 'bg-white border-gray-200'}`}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-gray-400 w-4">{i === 0 ? '↓' : i === STACK_LAYERS.length - 1 ? '★' : '↓'}</span>
                  <h4 className={`text-sm font-bold ${l.layer.includes('Custom') ? 'text-blue-700' : l.layer.includes('SaaS') ? 'text-red-600' : 'text-gray-900'}`}>{l.layer}</h4>
                </div>
                <span className="text-[10px] font-semibold text-gray-400">{l.cost}</span>
              </div>
              <p className="text-xs text-gray-500 mb-1 ml-6"><span className="font-medium">Who:</span> {l.who} — <span className="font-medium">Examples:</span> {l.examples}</p>
              <p className="text-sm text-gray-600 ml-6">{l.description}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 text-center">
          <p className="text-sm text-gray-600 font-medium">The SaaS vendor layer is where the <span className="text-red-500 font-bold">50-100x cost markup</span> lives — and where <span className="text-blue-600 font-bold">zero competitive differentiation</span> happens.</p>
        </div>
      </Card>

      {/* How other companies vs Andrew */}
      <Card className="mb-6">
        <h3 className="text-base font-bold text-gray-900 mb-1">Two Approaches to AI — Who Do You Trust?</h3>
        <p className="text-sm text-gray-500 mb-4">Most companies delegate AI decisions to internal people who don't build AI. Andrew trusts the tool-makers and builds directly.</p>
        <div className="grid grid-cols-2 gap-5">
          <div className="bg-red-50 rounded-xl border border-red-200 p-5">
            <h4 className="text-red-600 font-bold mb-3">What Most Companies Do</h4>
            <ul className="text-sm text-gray-600 space-y-2">
              <li className="flex gap-2"><span className="text-red-400 font-bold flex-shrink-0">✗</span><span><span className="font-semibold text-gray-900">Trust internal IT</span> to evaluate AI — people who configure vendor software, not people who build AI systems</span></li>
              <li className="flex gap-2"><span className="text-red-400 font-bold flex-shrink-0">✗</span><span><span className="font-semibold text-gray-900">Ask vendors</span> what AI can do — the same vendors whose business model depends on selling per-seat licenses</span></li>
              <li className="flex gap-2"><span className="text-red-400 font-bold flex-shrink-0">✗</span><span><span className="font-semibold text-gray-900">Form committees</span> that meet monthly — while AI capabilities change weekly</span></li>
              <li className="flex gap-2"><span className="text-red-400 font-bold flex-shrink-0">✗</span><span><span className="font-semibold text-gray-900">Wait for proof</span> from peers — ceding first-mover advantage to competitors</span></li>
              <li className="flex gap-2"><span className="text-red-400 font-bold flex-shrink-0">✗</span><span><span className="font-semibold text-gray-900">Read reports</span> about AI instead of using it — knowing about a tool vs. building with it are fundamentally different</span></li>
            </ul>
            <p className="text-xs text-gray-500 mt-3 italic">This is Ensign today. Barry's Q4 statement: "We have a great committee and thought leadership assembled."</p>
          </div>
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-5">
            <h4 className="text-blue-600 font-bold mb-3">Andrew's Approach</h4>
            <ul className="text-sm text-gray-600 space-y-2">
              <li className="flex gap-2"><span className="text-emerald-500 font-bold flex-shrink-0">✓</span><span><span className="font-semibold text-gray-900">Trusts the tool-makers</span> — reads Anthropic, OpenAI, Google research directly. Attends to what the people building the models say, not vendor interpreters.</span></li>
              <li className="flex gap-2"><span className="text-emerald-500 font-bold flex-shrink-0">✓</span><span><span className="font-semibold text-gray-900">Builds and tests daily</span> — not evaluating AI theoretically, but deploying production agentic systems. This presentation, this platform, every framework — built with AI agents.</span></li>
              <li className="flex gap-2"><span className="text-emerald-500 font-bold flex-shrink-0">✓</span><span><span className="font-semibold text-gray-900">Deploys and iterates</span> — 65 pages of working agent interfaces built in days, not months. Each one demonstrates a capability that would take a vendor 12-18 months to ship.</span></li>
              <li className="flex gap-2"><span className="text-emerald-500 font-bold flex-shrink-0">✓</span><span><span className="font-semibold text-gray-900">Understands the operations</span> — 13 years SNF operations + 5 years public accounting means the AI is directed by someone who knows what questions to ask and what answers matter.</span></li>
              <li className="flex gap-2"><span className="text-emerald-500 font-bold flex-shrink-0">✓</span><span><span className="font-semibold text-gray-900">Builds the whole stack</span> — strategy, architecture, code, deployment, testing, and presentation — one continuous workflow with no handoffs.</span></li>
            </ul>
            <p className="text-xs text-blue-500 mt-3 italic">The difference: I don't read about AI. I build with it every day. This entire platform is the proof.</p>
          </div>
        </div>
      </Card>

      {/* Bottom line */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm text-center">
        <h3 className="text-lg font-bold text-gray-900 mb-3">The Landscape Is Clear</h3>
        <div className="flex items-center justify-center gap-3 mb-4 flex-wrap">
          <span className="px-4 py-2 bg-gray-100 rounded-xl text-sm font-semibold text-gray-700">Foundation Models</span>
          <ArrowRight className="w-4 h-4 text-blue-500" />
          <span className="px-4 py-2 bg-gray-100 rounded-xl text-sm font-semibold text-gray-700">Cloud Infrastructure</span>
          <ArrowRight className="w-4 h-4 text-blue-500" />
          <span className="px-4 py-2 bg-blue-600 rounded-xl text-sm font-bold text-white">Ensign's Custom AI Agents</span>
        </div>
        <p className="text-sm text-gray-600 max-w-2xl mx-auto">Skip the vendor layer entirely. Access foundation models through HIPAA-compliant cloud infrastructure. Build agents trained on Ensign's data. Own the IP. Pay 1/50th the cost. Move at your pace, not your vendor's.</p>
        <p className="text-xs text-gray-400 mt-3">
          Sources: <a href="https://www.anthropic.com" target="_blank" rel="noopener" className="underline hover:text-gray-600">Anthropic</a> · <a href="https://aws.amazon.com/bedrock/" target="_blank" rel="noopener" className="underline hover:text-gray-600">AWS Bedrock</a> · <a href="https://www.deloitte.com/us/en/insights/industry/technology/technology-media-and-telecom-predictions/2026/saas-ai-agents.html" target="_blank" rel="noopener" className="underline hover:text-gray-600">Deloitte 2026</a> · <a href="https://www.bcg.com/publications/2025/the-widening-ai-value-gap" target="_blank" rel="noopener" className="underline hover:text-gray-600">BCG AI Value Gap</a>
        </p>
      </div>
    </div>
  );
}
