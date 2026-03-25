# Speaker Notes — Technical Architecture Briefing (14 Slides)

**CONFIDENTIAL — Andrew Lark | March 2026**
**Audience:** CTO / Dev Team at Ensign Group

---

## Slide 1: The Agentic Enterprise
**Title slide — Andrew Lark, Technical Architecture Briefing**

- "Thank you for having me. I'm Andrew — 14 years in skilled nursing operations, CPA, former CFO. I've been building AI systems that connect directly to the data sources you already use."
- "This isn't a vendor pitch. I'm going to show you what's technically possible when you stop waiting for your SaaS vendors to add AI and start connecting agents directly to your data."

---

## Slide 2: Background — Operations, controls, and architecture in one person
**Andrew's credentials and unique positioning**

- "I'm not a typical AI consultant. I ran the back office at SNFs — I know what goes wrong at 2am when census drops and the DON calls in sick."
- "14 years in SNF operations. CPA. CFO. Now building the AI layer that I wished existed when I was running facilities."
- "The reason this matters: most AI companies don't understand healthcare ops. Most healthcare ops people don't understand AI architecture. I sit at that intersection."

---

## Slide 3: The SaaSpocalypse — The market recognized the shift immediately
**$285B selloff in SaaS stocks**

- "February 3rd, 2026. DeepSeek drops an open-source model that matches GPT-4 at a fraction of the cost. The market response: $285 billion wiped off SaaS valuations in a single day."
- "This isn't a correction — it's a structural repricing. The market is saying: the per-seat SaaS model is under existential pressure."
- "Salesforce, ServiceNow, Workday — their entire business model is charging per user for a UI on top of a database. AI agents don't need the UI."

---

## Slide 4: Industry Signal — What AI leaders are saying
**Quotes from Nadella, Schmidt, Amodei, Benioff, Huang, Altman, McDermott**

- "These aren't my opinions — these are the CEOs of the companies building AI. Listen to what they're saying."
- "Satya Nadella: 'Every app will be rewritten.' Eric Schmidt: 'AI agents will replace most SaaS.' Dario Amodei: '3-6 months and AI will be writing most code.'"
- "The SaaS vendors themselves are admitting their own products are about to be disrupted. The question is: do you wait for them to cannibalize their own revenue, or do you move first?"

---

## Slide 5: Capability Shift — What changed and what it means for enterprise systems
**Then vs Now comparison**

- "Two years ago, you needed 50 engineers to build what I can build with 1 AI-augmented developer today."
- "Context windows went from 4K tokens to 1 million. That means an AI agent can read an entire patient chart, every policy document, and every CMS regulation simultaneously."
- "Cost dropped 99%. Speed increased 100x. The economics of custom enterprise AI completely changed."

---

## Slide 6: Vendor Analysis — Your vendors are adding AI shaped by their priorities
**PCC, Workday, etc. adding AI features — but limited by their business model**

- "Yes, PointClickCare is adding AI features. Yes, Workday is adding AI. But think about their incentives."
- "PCC makes money when you use PCC. They will never build an agent that pulls data from PCC AND Workday AND your pharmacy system and makes a cross-functional decision."
- "Their AI will always be siloed within their product. Your operations aren't siloed — your AI shouldn't be either."

---

## Slide 7: The Opportunity — From vendor-led to enterprise-owned
**Why Ensign should own the AI layer**

- "The opportunity is to own the intelligence layer that sits on top of ALL your systems. PCC for clinical. Workday for HR and finance. Microsoft 365 for communications. Pharmacy. Labs. CMS data."
- "One unified AI layer that sees everything, connects everything, and makes recommendations that no single vendor can."
- "This is the difference between having AI features in your tools versus having AI that runs your business."

---

## Slide 8: The Vision — One platform, every function, every decision
**Full agentic enterprise architecture — 8 business functions**

- "Here's what it looks like. 26 specialized AI agents covering clinical, financial, workforce, admissions, quality, legal, operations, and strategic functions."
- "Each agent connects directly to the relevant data sources via API. No manual data entry. No swivel-chair between systems."
- "Every agent produces decisions with quantified impact — dollars, days, risk scores, regulatory citations. Humans approve or override in under 10 seconds."

---

## Slide 9: Security Architecture — HIPAA, PHI, and security are solved problems
**AWS Bedrock in-VPC architecture**

- "I know the first question from any technical team is security. Here's the architecture."
- "AWS Bedrock runs inside YOUR VPC. PHI never leaves Ensign's cloud boundary. No data goes to OpenAI, no data goes to any third party."
- "BAA-covered. SOC 2. HITRUST. This isn't experimental — this is production-grade healthcare infrastructure that major health systems are already using."

---

## Slide 10: Three Objections — And the architecture that answers them
**Preemptive objection handling for technical team**

- "Your team should be skeptical. Here are the three objections I'd raise if I were in your seat, and how the architecture addresses each one."
- "Objection 1: 'AI hallucinates.' Answer: Every recommendation includes source citations, confidence scores, and human approval gates. Nothing executes without a human click."
- "Objection 2: 'We can't trust AI with patient data.' Answer: Read-only by default. Write access requires governance level 4+ approval. Complete audit trail on every action."
- "Objection 3: 'What if it breaks?' Answer: Kill switches at every level. Agent, function, facility, enterprise. Any human can shut down any agent instantly."

---

## Slide 11: Governance & Control — From data access to production deployment
**6 governance levels, RBAC, audit trails**

- "This isn't a black box. There are 6 governance levels — from fully automated (refilling printer paper) to board-level approval (M&A decisions)."
- "Role-based access control means facility admins see their facility, regional directors see their region, and the C-suite sees everything."
- "Every agent action is logged with an immutable audit trail. Who approved it, when, what data was used, what the alternatives were. Full decision replay."

---

## Slide 12: Live Demo — See every area of the business like never before
**Link to the working prototype**

- "This isn't a mockup. This is a working prototype with 69 pages across 8 business functions, deployed and running right now."
- "330 facilities on the heatmap — matching Ensign's actual portfolio scale. Click any red facility, you land in its command view with all the decisions pre-loaded."
- "Every decision card is self-contained. The agent already pulled all the data from PCC, Workday, CMS. You never open another application."
- **DEMO FLOW:** Click CommandCenter → show heatmap → click a red facility → show decisions → approve one → show Agent Operations → show Facility Command with search/filter

---

## Slide 13: Live Demo — Additional demo assets
**Clinical audit platform, native apps**

- "Beyond the command center, I've also built a clinical audit platform that runs psychotropic and falls audits across your census. Let me show you the output."
- **SHOW:** ensign-demo (localhost:5174) — Dashboard, Run Audits, ETL Status pages
- **SHOW:** Anonymized psychotropic audit Excel — 49 patients, action items, analytics
- **SHOW:** Anonymized falls audit Excel — incidents, missed opportunities, census data
- **SHOW:** iOS app on simulator — native companion for facility administrators
- "All of this was built by one person with AI. That's the point. Imagine what a team of 5-6 could do."

---

## Slide 14: What's Next — Dedicated leadership at the intersection of operations, controls, and AI architecture
**The ask**

- "Here's what I'm proposing: a 30-day engagement. In that time, I'll connect your actual PCC instance, run real clinical audits, deploy a voice-based clinical documentation app, and set up the executive intelligence layer."
- "After 30 days, you'll have working systems, not a proposal. Then we scale with 5-6 dedicated AI engineers."
- "The cost of waiting is real. Every month without this is a month your competitors might move first. And unlike most technology investments, this one pays for itself in the first quarter."
- "I'm uniquely positioned to do this because I've done every job in a nursing home except direct patient care. I know what matters. I know what's noise. And I know how to build the technology that connects it all."

---

## Key Stats to Have Ready

- **330+ facilities** across 17 states
- **~$4B annual revenue**
- **$285B SaaSpocalypse** selloff (Feb 3, 2026)
- **69 pages** in the working prototype
- **26 AI agents** across 8 business functions
- **<10 second rule** for every human action
- **6 governance levels** from auto-approve to board-level
- **99% cost reduction** in AI inference (2023 → 2026)
- **1M token context window** — can read entire patient chart + policies + regs simultaneously
