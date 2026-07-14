const esc = (value = "") => String(value)
  .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;").replace(/'/g, "&#039;");

const stripHtml = (value = "") => String(value)
  .replace(/<[^>]*>/g, " ")
  .replace(/\s+/g, " ")
  .trim();

const asArray = (value) => Array.isArray(value) ? value : [];

const SERVICE_PROFILES = {
  "ai-automation": {
    proposition: "Remove repetitive work without losing control of the decisions that matter.",
    lead: "We identify where manual handling, fragmented information and repeated judgement are consuming capacity, then redesign the workflow around appropriate automation, structured data and human review.",
    signals: [
      "Teams repeatedly copy, reconcile or reformat the same information",
      "Important decisions depend on searching across disconnected systems",
      "Customer or operational requests wait in avoidable queues",
      "Automation pilots exist, but ownership, controls and adoption are unclear"
    ],
    shifts: [
      ["Manual hand-offs", "Orchestrated workflows with clear exception routes"],
      ["Unstructured information", "Searchable, governed operational knowledge"],
      ["Ad hoc AI experiments", "Prioritised use cases with measurable value"],
      ["Opaque automation", "Human review, auditability and accountable ownership"]
    ],
    modes: [
      ["Diagnose", "Map work, effort, risk and data dependencies before selecting technology."],
      ["Design", "Define the target workflow, controls, prompts, integrations and review points."],
      ["Implement", "Build, test, train users and establish monitoring so the change becomes operational."]
    ],
    outcomes: ["Capacity released", "Faster response", "Controlled adoption"]
  },
  "digital-strategy": {
    proposition: "Turn digital ambition into an investment sequence the organisation can actually deliver.",
    lead: "We connect commercial choices, customer needs, capabilities, technology and operating constraints into one executable direction with clear priorities, ownership and measures.",
    signals: [
      "Digital initiatives compete for funding without a shared decision framework",
      "Strategy documents describe ambition but not delivery dependencies",
      "Technology decisions are being made before the operating model is agreed",
      "Leadership lacks a common view of value, risk, timing and accountability"
    ],
    shifts: [
      ["Disconnected initiatives", "One prioritised portfolio tied to commercial outcomes"],
      ["Technology-led decisions", "Capability and operating-model-led choices"],
      ["Broad transformation language", "Sequenced commitments, owners and measures"],
      ["Annual strategy exercises", "A living roadmap governed through delivery"]
    ],
    modes: [
      ["Clarify", "Define the commercial questions, decision criteria and current constraints."],
      ["Architect", "Agree target capabilities, investment priorities and the required operating model."],
      ["Mobilise", "Translate the strategy into governed workstreams, measures and delivery ownership."]
    ],
    outcomes: ["Clear priorities", "Investment confidence", "Delivery alignment"]
  },
  "ecommerce-growth": {
    proposition: "Improve conversion and retention without allowing fulfilment cost or margin leakage to erase the gain.",
    lead: "We treat acquisition, merchandising, conversion, retention, inventory and fulfilment as one commercial system rather than a collection of channel optimisations.",
    signals: [
      "Traffic or media spend is rising faster than profitable revenue",
      "Conversion work is disconnected from inventory and fulfilment reality",
      "Retention activity is active but customer value is poorly understood",
      "Teams optimise channel metrics without a shared unit-economics view"
    ],
    shifts: [
      ["Channel-by-channel optimisation", "One commercial growth model"],
      ["Static merchandising", "Availability and behaviour-led presentation"],
      ["Campaign reporting", "Cohort, margin and customer-value measurement"],
      ["Occasional redesigns", "Continuous, governed experimentation"]
    ],
    modes: [
      ["Diagnose", "Find the commercial constraints across traffic, journey, retention and operations."],
      ["Experiment", "Prioritise and run controlled changes against agreed measures."],
      ["Embed", "Build the reporting, cadence and ownership needed to sustain improvement."]
    ],
    outcomes: ["Profitable conversion", "Stronger retention", "Better decisions"]
  },
  "operational-excellence": {
    proposition: "Remove the process friction, control gaps and avoidable effort that make growth harder to manage.",
    lead: "We examine how work actually moves through teams and systems, identify where queues, rework and weak ownership are creating cost or risk, and rebuild the operating model around dependable execution.",
    signals: [
      "Teams spend too much time chasing information, resolving exceptions or reconciling data",
      "Important processes rely on spreadsheets, inboxes or individual knowledge",
      "Ownership becomes unclear when work crosses teams, suppliers or systems",
      "Service levels, margin or management visibility deteriorate as volume grows"
    ],
    shifts: [
      ["Reactive exception handling", "Designed workflows with clear escalation routes"],
      ["Unclear hand-offs", "Named owners, controls and service expectations"],
      ["Manual reconciliation", "Structured data and automated checks"],
      ["Lagging operational reports", "Useful management visibility and decision cadence"]
    ],
    modes: [
      ["Operational diagnostic", "Map demand, queues, effort, controls, systems and root causes."],
      ["Operating-model redesign", "Define the future workflow, ownership, measures and enabling technology."],
      ["Embedded implementation", "Implement the change, establish governance and support adoption through stabilisation."]
    ],
    outcomes: ["Less rework", "Clearer control", "Scalable capacity"]
  },
  "fractional-leadership": {
    proposition: "Add senior digital and operational ownership before a permanent executive hire is justified.",
    lead: "We embed experienced leadership into the organisation to make decisions, align providers, govern priorities and help the existing team deliver—not simply advise from outside.",
    signals: [
      "A founder or executive is carrying too many digital and operational decisions",
      "Agencies and suppliers are active but no senior owner connects their work",
      "The team needs direction and coaching before another permanent hire",
      "Important programmes are drifting because accountability is fragmented"
    ],
    shifts: [
      ["Distributed decision-making", "One accountable senior owner"],
      ["Provider-led priorities", "Business-led governance and performance review"],
      ["Reactive escalation", "Structured cadence, risks and decisions"],
      ["Knowledge concentrated externally", "Capability transferred into the team"]
    ],
    modes: [
      ["Stabilise", "Take control of priorities, providers, risks and immediate decisions."],
      ["Lead", "Run the function, govern delivery and coach the internal team."],
      ["Transition", "Build the operating rhythm and hand over to a permanent leader or established team."]
    ],
    outcomes: ["Senior ownership", "Provider control", "Team capability"]
  },
  "project-delivery": {
    proposition: "Turn an agreed direction into implemented change with visible ownership, evidence and control.",
    lead: "We structure and lead the work required to move from recommendation to operating reality across internal teams, suppliers, technology, testing, launch and adoption.",
    signals: [
      "A strategic recommendation exists but no credible mobilisation plan follows it",
      "Multiple teams or suppliers are delivering without one integrated plan",
      "Progress reporting describes activity rather than evidence of completion",
      "Risks, dependencies and acceptance decisions are surfacing too late"
    ],
    shifts: [
      ["Strategy hand-off", "Mobilised workstreams with accountable owners"],
      ["Status reporting", "Evidence-based governance and acceptance"],
      ["Late dependency discovery", "Active dependency and risk management"],
      ["Launch as the finish line", "Adoption, hypercare and operational handover"]
    ],
    modes: [
      ["Mobilise", "Define scope, outcomes, governance, workstreams and delivery evidence."],
      ["Control", "Coordinate teams and suppliers while managing decisions, risks and dependencies."],
      ["Land", "Lead testing, launch, adoption, hypercare and transfer into normal operations."]
    ],
    outcomes: ["Visible progress", "Controlled delivery", "Operational adoption"]
  }
};

function serviceProfileFor(service) {
  return SERVICE_PROFILES[service.slug] || {
    proposition: stripHtml(service.hero_subheading || service.summary || service.title),
    lead: stripHtml(service.description || service.summary || "The engagement is shaped around the commercial outcome and delivery environment."),
    signals: asArray(service.who_its_for).slice(0, 4),
    shifts: [],
    modes: [],
    outcomes: ["Clear direction", "Governed delivery", "Measurable change"]
  };
}

function localServiceIntro(service, location) {
  const profile = serviceProfileFor(service);
  return `${profile.lead} For organisations based in ${location.name} and across ${location.county}, delivery is available remotely throughout the UK, with on-site collaboration arranged where it improves discovery, alignment or implementation.`;
}

function checklist(items, columns = false) {
  return `<ul class="location-check-list${columns ? " location-check-list--columns" : ""}">${asArray(items)
    .map((item) => `<li><i data-lucide="check"></i><span>${esc(item)}</span></li>`)
    .join("")}</ul>`;
}

function renderSignals(profile) {
  if (!profile.signals.length) return "";
  return `<section class="local-service-signals"><div class="location-shell">
    <div class="local-service-section-head"><span class="eyebrow">When to act</span><h2>Signs the operating model needs attention</h2><p>These are common conditions that justify a structured engagement. The diagnostic establishes which are symptoms and which are root causes.</p></div>
    <div class="local-signal-grid">${profile.signals.map((signal, index) => `<article><span>${String(index + 1).padStart(2, "0")}</span><p>${esc(signal)}</p></article>`).join("")}</div>
  </div></section>`;
}

function renderShifts(profile) {
  if (!profile.shifts.length) return "";
  return `<section class="local-service-shifts"><div class="location-shell">
    <div class="local-service-section-head local-service-section-head--light"><span class="eyebrow">The change</span><h2>What the engagement is designed to move</h2><p>The work is not a generic efficiency exercise. It moves specific operating conditions from fragile and reactive to governed and repeatable.</p></div>
    <div class="local-shift-table"><div class="local-shift-table-head"><span>Current condition</span><span>Target condition</span></div>${profile.shifts.map(([from, to]) => `<div class="local-shift-row"><span>${esc(from)}</span><i data-lucide="arrow-right"></i><strong>${esc(to)}</strong></div>`).join("")}</div>
  </div></section>`;
}

function renderEngagementArchitecture(service, profile) {
  const audience = asArray(service.who_its_for);
  const included = asArray(service.what_included);
  const deliverables = asArray(service.deliverables);
  return `<section class="local-service-architecture"><div class="location-shell">
    <div class="local-service-section-head"><span class="eyebrow">Engagement architecture</span><h2>What the work covers</h2><p>The exact scope is agreed after discovery, but every engagement connects the people involved, the work required and the evidence your team receives.</p></div>
    <div class="local-architecture-grid">
      <article class="local-architecture-primary"><span class="local-card-kicker">Who it is for</span><h3>Teams with a real operating constraint—not a request for another presentation.</h3>${checklist(audience.length ? audience : profile.signals)}</article>
      <div class="local-architecture-stack">
        <article><span class="local-card-kicker">What is included</span>${checklist(included)}</article>
        <article><span class="local-card-kicker">What your team receives</span>${checklist(deliverables)}</article>
      </div>
    </div>
    ${profile.modes.length ? `<div class="local-engagement-modes"><div class="local-engagement-modes-head"><span>Ways to engage</span><p>The scope can begin with a focused intervention and extend into implementation where the evidence supports it.</p></div>${profile.modes.map(([title, description], index) => `<article><span>${String(index + 1).padStart(2, "0")}</span><h3>${esc(title)}</h3><p>${esc(description)}</p></article>`).join("")}</div>` : ""}
  </div></section>`;
}

function renderProcess(service) {
  const steps = asArray(service.how_it_works);
  if (!steps.length) return "";
  return `<section class="local-service-process"><div class="location-shell">
    <div class="local-service-section-head"><span class="eyebrow">Delivery route</span><h2>From diagnosis to embedded change</h2><p>Each phase creates evidence for the next decision. Work does not advance because a date arrived; it advances when the required outputs and controls are in place.</p></div>
    <div class="local-process-timeline">${steps.map((step, index) => `<article class="${index % 2 ? "is-right" : "is-left"}"><div class="local-process-marker">${String(index + 1).padStart(2, "0")}</div><div class="local-process-card"><h3>${esc(step.title)}</h3><p>${esc(step.description || "")}</p></div></article>`).join("")}</div>
  </div></section>`;
}

function renderProofAndTechnology(service) {
  const technologies = asArray(service.tech_categories)
    .flatMap((group) => asArray(group.items).map((item) => ({ ...item, category: group.category })))
    .slice(0, 12);
  const caseStudy = asArray(service.related_case_studies)[0];
  if (!caseStudy && !technologies.length) return "";
  return `<section class="local-service-proof"><div class="location-shell"><div class="local-proof-grid">
    ${caseStudy ? `<article class="local-proof-story"><span class="eyebrow">Evidence from delivery</span><h2>${esc(caseStudy.client)}</h2><p>${esc(caseStudy.challenge || "")}</p>${caseStudy.metric ? `<strong>${esc(caseStudy.metric)}</strong>` : ""}<a class="local-text-link" href="/case-studies/${encodeURIComponent(caseStudy.slug)}">Read the full case study <i data-lucide="arrow-up-right"></i></a></article>` : ""}
    ${technologies.length ? `<aside class="local-tech-rail"><span class="eyebrow">Technology environment</span><h3>Technology serves the operating model</h3><p>The engagement can improve an existing estate or govern a controlled platform change. Tools are selected around the work, data and ownership required.</p><div class="local-tech-list">${technologies.map((item) => `<span>${item.url ? `<img src="${esc(item.url)}" alt="" loading="lazy">` : ""}<b>${esc(item.label || item.file)}</b><small>${esc(item.category || "Technology")}</small></span>`).join("")}</div></aside>` : ""}
  </div></div></section>`;
}

function renderInsights(service) {
  const insights = asArray(service.related_blog_posts).slice(0, 3);
  if (!insights.length) return "";
  return `<section class="local-service-insights"><div class="location-shell">
    <div class="local-service-section-head"><span class="eyebrow">Project insight</span><h2>Thinking connected to the work</h2><p>These articles explain the operating assumptions, risks and decisions that sit behind the service.</p></div>
    <div class="local-insight-grid">${insights.map((post) => `<a href="/insights/${encodeURIComponent(post.slug)}"><span>${esc(asArray(post.tags)[0] || service.category || "Insight")}</span><h3>${esc(post.title)}</h3><p>${esc(post.excerpt || "")}</p><strong>Read the article <i data-lucide="arrow-right"></i></strong></a>`).join("")}</div>
  </div></section>`;
}

function renderFaqs(service, location) {
  const faqs = asArray(service.faqs).slice(0, 8);
  if (!faqs.length) return "";
  return `<section class="local-service-faq"><div class="location-shell"><div class="local-faq-layout">
    <div class="local-service-section-head"><span class="eyebrow">Questions before engagement</span><h2>What organisations in ${esc(location.name)} usually need to know</h2><p>Location changes the collaboration plan, not the service standard. Scope, evidence and accountability are agreed around the work required.</p></div>
    <div class="local-faq-list">${faqs.map((faq, index) => `<details${index === 0 ? " open" : ""}><summary><span>${String(index + 1).padStart(2, "0")}</span><b>${esc(faq.question)}</b><i data-lucide="plus"></i></summary><p>${esc(faq.answer)}</p></details>`).join("")}</div>
  </div></div></section>`;
}

function renderFinalCta(service, location, profile) {
  return `<section class="local-service-cta"><div class="location-shell"><div class="local-service-cta-card">
    <div><span class="eyebrow">Start with the constraint</span><h2>Discuss ${esc(service.title)} in ${esc(location.name)}</h2><p>${esc(profile.proposition)} The first conversation is used to clarify the problem, likely scope and whether a focused diagnostic or a broader delivery engagement is appropriate.</p></div>
    <div class="local-service-cta-actions"><a class="btn btn-primary" href="/contact?topic=${encodeURIComponent(`${service.title} in ${location.name}`)}">Start an enquiry</a><a class="btn btn-secondary" href="/services/${encodeURIComponent(service.slug)}">View the core service</a></div>
  </div></div></section>`;
}

function renderServiceDepth(service, location) {
  const profile = serviceProfileFor(service);
  return [
    renderSignals(profile),
    renderShifts(profile),
    renderEngagementArchitecture(service, profile),
    renderProcess(service),
    renderProofAndTechnology(service),
    renderInsights(service),
    renderFaqs(service, location),
    renderFinalCta(service, location, profile)
  ].join("");
}

module.exports = { localServiceIntro, renderServiceDepth, serviceProfileFor };
