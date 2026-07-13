import { escapeHtml } from "../render-helpers.js";

const STYLE_HREF = "/assets/css/service-template-v3.css?v=20260714";

function ensureStyles() {
  if (document.querySelector("link[data-service-template-v3-css]")) return;
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = STYLE_HREF;
  link.dataset.serviceTemplateV3Css = "true";
  document.head.appendChild(link);
}

function wireVerticalTabs(tablist, panels) {
  const tabs = Array.from(tablist.querySelectorAll('[role="tab"]'));
  const activate = (index, moveFocus = false) => {
    tabs.forEach((tab, tabIndex) => {
      const active = tabIndex === index;
      tab.setAttribute("aria-selected", String(active));
      tab.tabIndex = active ? 0 : -1;
      if (panels[tabIndex]) {
        panels[tabIndex].hidden = !active;
        panels[tabIndex].classList.toggle("is-active", active);
      }
    });
    if (moveFocus) tabs[index]?.focus();
  };

  tabs.forEach((tab, index) => {
    tab.addEventListener("click", () => activate(index));
    tab.addEventListener("keydown", (event) => {
      let next = index;
      if (event.key === "ArrowDown" || event.key === "ArrowRight") next = (index + 1) % tabs.length;
      else if (event.key === "ArrowUp" || event.key === "ArrowLeft") next = (index - 1 + tabs.length) % tabs.length;
      else if (event.key === "Home") next = 0;
      else if (event.key === "End") next = tabs.length - 1;
      else return;
      event.preventDefault();
      activate(next, true);
    });
  });

  activate(0);
}

function rebuildEngagementNavigator() {
  const section = document.getElementById("service-content-tabs");
  const audienceSource = document.getElementById("who-what-section");
  const deliverablesSource = document.getElementById("deliverables-section");
  const techSource = document.getElementById("tech-section");
  if (!section || section.dataset.v3Ready === "true") return techSource;

  const cards = Array.from(audienceSource?.querySelectorAll(":scope > .card") || []);
  const audienceCard = cards[0] || null;
  const includedCard = cards[1] || null;
  const deliverables = deliverablesSource || null;

  [audienceCard, includedCard, deliverables, techSource].forEach((node) => node?.remove());
  audienceSource?.remove();

  const definitions = [
    {
      label: "Who it’s for",
      note: "Teams, trading conditions and constraints this work is designed around.",
      icon: "users",
      node: audienceCard,
    },
    {
      label: "What’s included",
      note: "Activities, workstreams and practical support covered by the engagement.",
      icon: "list-checks",
      node: includedCard,
    },
    {
      label: "What you’ll receive",
      note: "Decisions, operating assets and tangible outputs handed back to your team.",
      icon: "package-check",
      node: deliverables,
    },
  ].filter((definition) => definition.node);

  section.dataset.v3Ready = "true";
  section.className = "service-content-tabs-section service-v3-engagement";
  section.innerHTML = `
    <div class="section-head left service-v3-engagement-heading">
      <span class="eyebrow">Engagement detail</span>
      <h2>What the engagement covers</h2>
      <p>Choose a view to understand the audience, delivery scope or tangible outputs without repeating the full service narrative.</p>
    </div>
    <div class="service-v3-engagement-shell">
      <div class="service-v3-engagement-tabs" role="tablist" aria-orientation="vertical" aria-label="Service engagement information"></div>
      <div class="service-v3-engagement-panels"></div>
    </div>`;

  const tablist = section.querySelector(".service-v3-engagement-tabs");
  const panelWrap = section.querySelector(".service-v3-engagement-panels");
  const panels = [];

  definitions.forEach((definition, index) => {
    const tab = document.createElement("button");
    tab.type = "button";
    tab.role = "tab";
    tab.id = `service-v3-tab-${index}`;
    tab.setAttribute("aria-controls", `service-v3-panel-${index}`);
    tab.setAttribute("aria-selected", String(index === 0));
    tab.tabIndex = index === 0 ? 0 : -1;
    tab.innerHTML = `
      <span class="service-v3-tab-icon"><i data-lucide="${definition.icon}"></i></span>
      <span><strong>${escapeHtml(definition.label)}</strong><small>${escapeHtml(definition.note)}</small></span>
      <i class="service-v3-tab-arrow" data-lucide="arrow-right"></i>`;
    tablist.appendChild(tab);

    const panel = document.createElement("div");
    panel.id = `service-v3-panel-${index}`;
    panel.role = "tabpanel";
    panel.setAttribute("aria-labelledby", tab.id);
    panel.className = "service-v3-engagement-panel";
    panel.hidden = index !== 0;
    definition.node.removeAttribute("hidden");
    definition.node.removeAttribute("style");
    panel.appendChild(definition.node);
    panelWrap.appendChild(panel);
    panels.push(panel);
  });

  wireVerticalTabs(tablist, panels);
  return techSource;
}

function integrateTechnologyWithDelivery(techSource) {
  const section = document.getElementById("how-it-works-section");
  const timeline = document.getElementById("service-how-it-works");
  if (!section || !timeline || section.dataset.v3Ready === "true") return;

  section.dataset.v3Ready = "true";
  section.classList.add("service-v3-delivery-section");
  const heading = section.querySelector(":scope > .section-head");
  heading?.classList.add("service-v3-delivery-heading");

  const layout = document.createElement("div");
  layout.className = "service-v3-delivery-layout";
  timeline.remove();
  layout.appendChild(timeline);

  if (techSource) {
    techSource.removeAttribute("hidden");
    techSource.removeAttribute("style");
    techSource.classList.add("service-v3-tech-rail");
    const techHeading = techSource.querySelector(".section-head");
    if (techHeading) {
      const title = techHeading.querySelector("h2");
      if (title) title.textContent = "Technology in the delivery environment";
      if (!techHeading.querySelector("p")) {
        techHeading.insertAdjacentHTML("beforeend", "<p>Platforms are selected around the operating model, existing estate and commercial priorities—not presented as a generic software list.</p>");
      }
    }
    techSource.querySelectorAll(".tech-logo-item").forEach((item) => {
      const label = item.querySelector("span")?.textContent?.trim();
      if (label) item.setAttribute("aria-label", label);
    });
    layout.appendChild(techSource);
  }

  section.appendChild(layout);
}

function refineRoiModel(item) {
  const card = document.querySelector(".service-roi-card, .glance-card");
  if (!card || card.dataset.v3Ready === "true") return;
  card.dataset.v3Ready = "true";
  card.classList.add("service-v3-roi");

  card.innerHTML = `
    <div class="service-v3-roi-head">
      <div><span class="eyebrow">Indicative engagement model</span><h3>Compare consultancy input with capacity released</h3></div>
      <span class="service-v3-model-status"><i aria-hidden="true"></i>Planning estimate</span>
    </div>
    <p class="service-v3-roi-intro" id="v3-roi-intro">Adjust duration and scope to compare estimated consultancy time with internal capacity that a ${escapeHtml(item.title.toLowerCase())} engagement could release. The figures are illustrative planning ranges, not a guaranteed financial return.</p>
    <div class="service-v3-roi-kpis" aria-live="polite" aria-atomic="true">
      <article><span>Estimated input</span><strong id="v3-roi-input">10</strong><small>consultancy hours / month</small></article>
      <article><span>Capacity released</span><strong id="v3-roi-release">22</strong><small>internal hours / month</small></article>
      <article><span>Indicative leverage</span><strong id="v3-roi-leverage">2.2×</strong><small>released for each hour invested</small></article>
    </div>
    <div class="service-v3-roi-controls">
      <div class="service-v3-roi-control">
        <div><label for="v3-roi-duration">Project duration</label><output id="v3-roi-duration-output" for="v3-roi-duration">12 weeks</output></div>
        <input id="v3-roi-duration" type="range" min="4" max="24" step="2" value="12" aria-describedby="v3-roi-duration-help v3-roi-intro">
        <small id="v3-roi-duration-help">Longer engagements allow more implementation, adoption and optimisation—not simply more analysis.</small>
      </div>
      <div class="service-v3-roi-control">
        <div><label for="v3-roi-scope">Delivery scope</label><output id="v3-roi-scope-output" for="v3-roi-scope">Focused</output></div>
        <input id="v3-roi-scope" type="range" min="1" max="3" step="1" value="2" aria-describedby="v3-roi-scope-help v3-roi-intro">
        <small id="v3-roi-scope-help">Choose the closest delivery pattern below. The selected option also updates the range control.</small>
      </div>
    </div>
    <div class="service-v3-scope-guide" role="group" aria-label="Delivery scope definitions">
      <button type="button" data-scope="1" aria-pressed="false"><strong>Targeted</strong><span>One defined problem, journey or workstream with a clear handover.</span></button>
      <button type="button" data-scope="2" class="is-active" aria-pressed="true"><strong>Focused</strong><span>Connected improvement around one commercial outcome and the teams that influence it.</span></button>
      <button type="button" data-scope="3" aria-pressed="false"><strong>Embedded</strong><span>Ongoing leadership and delivery across multiple dependent workstreams.</span></button>
    </div>
    <p class="service-v3-roi-note">Assumptions include suitable access, stakeholder participation and adoption. Outcomes depend on baseline maturity, implementation scope and the value of the work being released.</p>`;

  const duration = card.querySelector("#v3-roi-duration");
  const scope = card.querySelector("#v3-roi-scope");
  const labels = ["Targeted", "Focused", "Embedded"];
  const inputBase = [6, 10, 16];
  const leverageBase = [1.7, 2.2, 2.7];

  const update = () => {
    const weeks = Number(duration.value);
    const scopeValue = Number(scope.value);
    const durationFactor = 0.85 + Math.min(20, weeks) / 80;
    const input = Math.round(inputBase[scopeValue - 1] * (0.88 + weeks / 100));
    const leverage = leverageBase[scopeValue - 1] * durationFactor;
    const released = Math.round(input * leverage);
    const selectedLabel = labels[scopeValue - 1];

    card.querySelector("#v3-roi-duration-output").textContent = `${weeks} weeks`;
    card.querySelector("#v3-roi-scope-output").textContent = selectedLabel;
    card.querySelector("#v3-roi-input").textContent = String(input);
    card.querySelector("#v3-roi-release").textContent = String(released);
    card.querySelector("#v3-roi-leverage").textContent = `${leverage.toFixed(1)}×`;
    duration.setAttribute("aria-valuetext", `${weeks} weeks`);
    scope.setAttribute("aria-valuetext", selectedLabel);

    card.querySelectorAll("[data-scope]").forEach((button) => {
      const active = Number(button.dataset.scope) === scopeValue;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });
  };

  duration.addEventListener("input", update);
  scope.addEventListener("input", update);
  scope.addEventListener("keydown", (event) => {
    if (event.key === "Home") scope.value = "1";
    else if (event.key === "End") scope.value = "3";
    else return;
    event.preventDefault();
    update();
  });
  card.querySelectorAll("[data-scope]").forEach((button) => {
    button.addEventListener("click", () => {
      scope.value = button.dataset.scope;
      update();
      scope.focus({ preventScroll: true });
    });
  });
  update();
}

function refineCoverage() {
  const section = document.getElementById("service-location-coverage");
  const tabs = section?.querySelector(".service-coverage-tabs");
  const shell = section?.querySelector(".service-coverage-shell");
  if (!section || !tabs || !shell || section.dataset.v3Ready === "true") return;
  section.dataset.v3Ready = "true";
  section.classList.add("service-v3-coverage");

  const descriptions = [
    "Delivery model and UK-wide support.",
    "Regional and city service routes.",
    "Start a scoped conversation.",
  ];
  tabs.querySelectorAll("button").forEach((button, index) => {
    const label = button.querySelector(".service-coverage-tab-label");
    if (!label) return;
    label.innerHTML = `<strong>${escapeHtml(label.textContent)}</strong><small>${escapeHtml(descriptions[index])}</small>`;
  });

  const layout = document.createElement("div");
  layout.className = "service-v3-coverage-layout";
  tabs.remove();
  shell.remove();
  layout.append(tabs, shell);
  section.appendChild(layout);
}

function refineFaqs() {
  const section = document.getElementById("faq-section");
  const heading = section?.querySelector(":scope > .section-head");
  const list = section?.querySelector(".faq-list");
  if (!section || !heading || !list || section.dataset.v3Ready === "true") return;
  section.dataset.v3Ready = "true";
  section.classList.add("service-v3-faq-section");

  if (!heading.querySelector("p")) {
    heading.insertAdjacentHTML("beforeend", "<p>Clear answers on scope, evidence, delivery ownership and how the engagement works in practice.</p>");
  }

  const layout = document.createElement("div");
  layout.className = "service-v3-faq-layout";
  heading.remove();
  list.remove();
  layout.append(heading, list);
  section.appendChild(layout);

  list.querySelectorAll(".faq-item").forEach((item, index) => {
    item.dataset.faqIndex = String(index + 1).padStart(2, "0");
  });
}

export function refineServiceTemplate(item) {
  ensureStyles();
  const techSource = rebuildEngagementNavigator();
  integrateTechnologyWithDelivery(techSource);
  refineRoiModel(item);
  refineCoverage();
  refineFaqs();
}
