import { escapeHtml, renderIcons } from "../render-helpers.js";

const ECOMMERCE_PHASES = [
  {
    title: "Discovery",
    summary: "Build a reliable view of the commercial and operational landscape before prescribing change.",
    narrative: [
      "We begin by getting a complete lay of the land across revenue, margin, inventory, merchandising, customer acquisition and retention. The objective is to understand how the business currently makes money, where growth is being constrained and which apparent performance signals can be trusted.",
      "The review covers product and channel cost data, contribution margin, stock availability, catalogue structure, product listings, rich media, pricing and promotional mechanics. We also examine session and conversion tracking, channel attribution, customer journeys, funnel leakage, repeat purchase behaviour and the hand-offs between marketing, ecommerce, operations and finance.",
      "Stakeholder interviews and working sessions surface undocumented processes, reporting assumptions and competing definitions of success. This stage closes with a prioritised evidence log rather than a collection of disconnected observations."
    ],
    outputs: ["Commercial and contribution-margin baseline", "Inventory, catalogue and merchandising audit", "Analytics, attribution and tracking assessment", "Customer-journey and funnel review", "Prioritised growth constraints and opportunity register"]
  },
  {
    title: "Assess",
    summary: "Stabilise the inputs, outputs and measurement framework so decisions are made from one version of the truth.",
    narrative: [
      "Assessment converts discovery findings into a dependable operating baseline. We reconcile platform, analytics, advertising, CRM, inventory and finance data so the leadership team understands which source owns each metric and how those metrics should be interpreted.",
      "Tracking defects, attribution gaps, inconsistent product taxonomies, duplicated events and unreliable reporting logic are documented and corrected in priority order. We agree the commercial definitions for revenue, gross margin, contribution, customer acquisition cost, retention and channel efficiency.",
      "Growth activity is not scaled until the business can distinguish genuine incremental performance from reporting noise, stock effects, promotional distortion or channel cannibalisation."
    ],
    outputs: ["Single-source-of-truth measurement framework", "Tracking and attribution remediation plan", "KPI definitions and reporting ownership", "Channel and funnel performance baseline", "Data-quality and decision-readiness sign-off"]
  },
  {
    title: "Design",
    summary: "Translate the evidence into a structured growth plan and redesign the journeys, processes and campaigns required to support it.",
    narrative: [
      "This is where the future operating model is designed. We define the growth thesis, priority customer segments, channel roles, commercial guardrails and the sequence of interventions most likely to create sustainable value.",
      "Depending on the findings, design may include restructuring product discovery, navigation, product-detail pages, merchandising rules, promotional calendars, lifecycle journeys, paid-media architecture, landing pages, experimentation processes and management reporting.",
      "Every proposed change is linked to a measurable hypothesis, an owner, a delivery dependency and a defined success threshold. The roadmap balances quick commercial gains with the foundational work needed to prevent growth from increasing complexity or eroding margin."
    ],
    outputs: ["Structured ecommerce growth plan", "Prioritised CRO and customer-journey roadmap", "Merchandising and campaign operating model", "CRM and retention journey design", "Experiment backlog with hypotheses and success measures"]
  },
  {
    title: "Deliver",
    summary: "Implement the redesigned growth system and establish an effortless, lean operating rhythm around it.",
    narrative: [
      "Delivery moves the agreed plan into live trading. We coordinate implementation across ecommerce, analytics, CRM, paid media, content, creative, operations and external providers, ensuring that changes are released in a controlled sequence and validated against the agreed baseline.",
      "Dashboards, workflows, campaign structures, content requirements and governance routines are embedded with the team rather than handed over as theoretical recommendations. Risks, dependencies and performance movements are reviewed through a consistent delivery cadence.",
      "The goal is a stable operating environment in which recurring activity is clear, reporting is trusted, teams know what action to take and growth initiatives can be launched without recreating the operating model each time."
    ],
    outputs: ["Implemented funnel, campaign and merchandising changes", "Live KPI and contribution reporting", "Lean trading and performance cadence", "Documented workflows, ownership and governance", "Team enablement and implementation handover"]
  },
  {
    title: "Optimise",
    summary: "Use the stable baseline to generate, test and scale new growth hypotheses.",
    narrative: [
      "Optimisation begins once the core system is stable enough for tests to produce meaningful evidence. We identify opportunities from behavioural data, commercial performance, customer feedback, search demand, lifecycle signals and operational constraints.",
      "Ideas are converted into prioritised hypotheses covering acquisition, conversion, average order value, retention, margin, inventory productivity and customer experience. Tests are sequenced according to expected value, confidence, effort and dependency rather than launched as isolated tactics.",
      "Results feed back into the roadmap. Successful interventions are operationalised and scaled; inconclusive tests are refined; unsuccessful tests are documented so the organisation compounds learning rather than repeating the same assumptions."
    ],
    outputs: ["Prioritised optimisation and experimentation programme", "Test design, measurement and learning records", "Scaled winning journeys and campaigns", "Ongoing commercial opportunity reviews", "Continuous roadmap refinement"]
  }
];

const GENERIC_PHASES = {
  "ai-automation": [
    ["Discovery", "Map repetitive work, information flows, decision points, systems and risk constraints before selecting automation opportunities."],
    ["Assess", "Score opportunities for value, feasibility, data readiness, security, compliance and human oversight."],
    ["Design", "Define target workflows, integration architecture, prompts, controls, exception handling and success measures."],
    ["Deliver", "Build, test and deploy automations with documentation, monitoring, access controls and team training."],
    ["Optimise", "Review adoption, accuracy, time saved and failure patterns, then expand the highest-value use cases."]
  ],
  "digital-strategy": [
    ["Discovery", "Understand commercial goals, customers, channels, systems, capabilities, constraints and current strategic assumptions."],
    ["Assess", "Evaluate market position, operating maturity, investment effectiveness and the evidence behind existing priorities."],
    ["Design", "Create the strategic choices, target operating model, measurement framework and sequenced roadmap."],
    ["Deliver", "Mobilise owners, workstreams, governance and reporting so strategy becomes executable change."],
    ["Optimise", "Review performance against strategic outcomes and reallocate effort as evidence and conditions change."]
  ],
  "operational-excellence": [
    ["Discovery", "Map workflows, hand-offs, systems, decision queues, service levels and sources of avoidable effort."],
    ["Assess", "Quantify bottlenecks, failure demand, control gaps, capacity constraints and the true cost of current processes."],
    ["Design", "Redesign workflows, ownership, controls, reporting and automation around a leaner operating model."],
    ["Deliver", "Implement new routines, documentation, dashboards and governance while supporting adoption across teams."],
    ["Optimise", "Measure throughput, quality, cost and cycle time, then remove the next constraint in the system."]
  ],
  "fractional-leadership": [
    ["Discovery", "Establish the commercial context, leadership expectations, team capability, priorities and unresolved decisions."],
    ["Assess", "Test plans, providers, budgets, performance claims, governance and the evidence supporting current direction."],
    ["Design", "Set the operating cadence, decision rights, outcomes, reporting standards and practical leadership plan."],
    ["Deliver", "Lead the work directly, coordinate teams and suppliers, resolve blockers and maintain accountable execution."],
    ["Optimise", "Strengthen internal capability, improve decision quality and prepare the function for sustainable ownership."]
  ],
  "project-delivery": [
    ["Discovery", "Clarify the intended outcome, stakeholders, scope, dependencies, constraints, risks and current delivery state."],
    ["Assess", "Validate feasibility, plans, estimates, provider claims, resourcing and critical-path assumptions."],
    ["Design", "Create the delivery plan, governance, workstreams, acceptance criteria, reporting and escalation routes."],
    ["Deliver", "Coordinate execution, manage risk and change, resolve blockers and maintain transparent progress evidence."],
    ["Optimise", "Review delivery performance, embed lessons and improve the operating model for subsequent programmes."]
  ]
};

function getPhases(item) {
  if (item.slug === "ecommerce-growth") return ECOMMERCE_PHASES;
  const base = GENERIC_PHASES[item.slug];
  if (!base) return [];
  const deliverables = [...(item.whatIncluded || []), ...(item.deliverables || [])];
  return base.map(([title, summary], index) => ({
    title,
    summary,
    narrative: [summary, "This stage is reviewed with the relevant stakeholders so assumptions, evidence, ownership and acceptance criteria are agreed before the engagement moves forward."],
    outputs: deliverables.filter((_, outputIndex) => outputIndex % base.length === index).slice(0, 5)
  }));
}

function activateTabs(tabs, panels, index) {
  tabs.forEach((tab, tabIndex) => {
    const active = tabIndex === index;
    tab.setAttribute("aria-selected", String(active));
    tab.tabIndex = active ? 0 : -1;
    panels[tabIndex].hidden = !active;
  });
}

function wireTabs(tabs, panels) {
  tabs.forEach((tab, index) => {
    tab.addEventListener("click", () => activateTabs(tabs, panels, index));
    tab.addEventListener("keydown", (event) => {
      let next = index;
      if (event.key === "ArrowRight") next = (index + 1) % tabs.length;
      else if (event.key === "ArrowLeft") next = (index - 1 + tabs.length) % tabs.length;
      else if (event.key === "Home") next = 0;
      else if (event.key === "End") next = tabs.length - 1;
      else return;
      event.preventDefault();
      activateTabs(tabs, panels, next);
      tabs[next].focus();
    });
  });
}

export function organiseServiceContentTabs() {
  const root = document.getElementById("service-detail-root");
  const audience = document.getElementById("who-what-section");
  const deliverables = document.getElementById("deliverables-section");
  const technology = document.getElementById("tech-section");
  if (!root || document.getElementById("service-content-tabs")) return;

  const definitions = [
    ["Who it’s for & what’s included", "users", audience],
    ["What you’ll receive", "package-check", deliverables],
    ["Technology & applications", "workflow", technology]
  ].filter(([, , node]) => node && !node.hidden);
  if (!definitions.length) return;

  const section = document.createElement("section");
  section.id = "service-content-tabs";
  section.className = "service-content-tabs-section";
  section.innerHTML = `<div class="section-head left service-content-tabs-heading"><span class="eyebrow">Engagement detail</span><h2>What the engagement covers</h2><p>Review the audience, delivery outputs and technology environment without leaving the service page.</p></div><div class="service-content-tablist" role="tablist" aria-label="Service engagement information"></div><div class="service-content-tabpanels"></div>`;

  const tablist = section.querySelector(".service-content-tablist");
  const panelWrap = section.querySelector(".service-content-tabpanels");
  definitions.forEach(([label, icon, node], index) => {
    const tab = document.createElement("button");
    tab.type = "button";
    tab.role = "tab";
    tab.id = `service-content-tab-${index}`;
    tab.setAttribute("aria-controls", `service-content-panel-${index}`);
    tab.setAttribute("aria-selected", String(index === 0));
    tab.tabIndex = index === 0 ? 0 : -1;
    tab.innerHTML = `<span class="service-content-tab-icon"><i data-lucide="${icon}"></i></span><span>${escapeHtml(label)}</span>`;
    tablist.appendChild(tab);

    const panel = document.createElement("div");
    panel.id = `service-content-panel-${index}`;
    panel.role = "tabpanel";
    panel.setAttribute("aria-labelledby", tab.id);
    panel.className = "service-content-tabpanel";
    panel.hidden = index !== 0;
    node.removeAttribute("style");
    node.removeAttribute("hidden");
    node.classList.add("service-content-tab-source");
    panel.appendChild(node);
    panelWrap.appendChild(panel);
  });

  const timeline = document.getElementById("how-it-works-section");
  if (timeline) root.insertBefore(section, timeline);
  else root.appendChild(section);
  wireTabs(Array.from(tablist.children), Array.from(panelWrap.children));
  renderIcons();
}

export function renderDetailedDeliveryTimeline(item) {
  const wrap = document.getElementById("service-how-it-works");
  const section = document.getElementById("how-it-works-section");
  if (!wrap || !section) return;
  const phases = getPhases(item);
  if (!phases.length) return;

  section.querySelector(".section-head h2").textContent = "Delivery, review and consultation timeline";
  section.querySelector(".section-head").insertAdjacentHTML("beforeend", `<p class="service-delivery-intro">Each phase includes a defined review point, visible outputs and an opportunity to challenge the evidence before delivery progresses.</p>`);
  wrap.innerHTML = `<div class="service-delivery-timeline">${phases.map((phase, index) => `<article class="service-delivery-phase${index === 0 ? " is-open" : ""}" data-delivery-phase><button class="service-delivery-phase-trigger" type="button" aria-expanded="${index === 0}" aria-controls="service-delivery-phase-${index}"><span class="service-delivery-phase-number">${String(index + 1).padStart(2, "0")}</span><span class="service-delivery-phase-heading"><strong>${escapeHtml(phase.title)}</strong><span>${escapeHtml(phase.summary)}</span></span><span class="service-delivery-phase-toggle"><i data-lucide="plus"></i></span></button><div class="service-delivery-phase-content" id="service-delivery-phase-${index}" ${index === 0 ? "" : "hidden"}><div class="service-delivery-phase-narrative">${phase.narrative.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join("")}</div><aside class="service-delivery-phase-outputs"><span class="service-coverage-kicker">Delivered and reviewed</span><ul>${phase.outputs.map((output) => `<li><i data-lucide="check"></i><span>${escapeHtml(output)}</span></li>`).join("")}</ul></aside></div></article>`).join("")}</div>`;

  wrap.querySelectorAll("[data-delivery-phase]").forEach((phase) => {
    const button = phase.querySelector(".service-delivery-phase-trigger");
    const content = phase.querySelector(".service-delivery-phase-content");
    button.addEventListener("click", () => {
      const open = !phase.classList.contains("is-open");
      phase.classList.toggle("is-open", open);
      button.setAttribute("aria-expanded", String(open));
      content.hidden = !open;
    });
  });
  renderIcons();
}
