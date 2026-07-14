import { escapeHtml, renderIcons } from "../render-helpers.js";

function wireTabs(tablist, panels) {
  const tabs = Array.from(tablist.querySelectorAll('[role="tab"]'));
  const activate = (index, moveFocus = false) => {
    tabs.forEach((tab, tabIndex) => {
      const active = tabIndex === index;
      tab.setAttribute("aria-selected", String(active));
      tab.tabIndex = active ? 0 : -1;
      const panel = panels[tabIndex];
      if (panel) {
        panel.hidden = !active;
        panel.toggleAttribute("inert", !active);
        panel.setAttribute("aria-hidden", String(!active));
      }
    });
    if (moveFocus) tabs[index]?.focus();
  };

  tabs.forEach((tab, index) => {
    tab.addEventListener("click", () => activate(index));
    tab.addEventListener("keydown", (event) => {
      let next = index;
      if (event.key === "ArrowRight" || event.key === "ArrowDown") next = (index + 1) % tabs.length;
      else if (event.key === "ArrowLeft" || event.key === "ArrowUp") next = (index - 1 + tabs.length) % tabs.length;
      else if (event.key === "Home") next = 0;
      else if (event.key === "End") next = tabs.length - 1;
      else return;
      event.preventDefault();
      activate(next, true);
    });
  });

  activate(0);
}

function technologyExamplesHtml(item) {
  const examples = Array.isArray(item.technologyExamples) ? item.technologyExamples : [];
  if (!examples.length) return "";

  const categories = examples.reduce((groups, example) => {
    const category = example.category || "Technology examples";
    if (!groups.has(category)) groups.set(category, []);
    groups.get(category).push(example);
    return groups;
  }, new Map());

  return `<div class="service-v3-technology-panel">
    <p>Technology is shown as a compatible implementation environment. Specific integrations are only claimed where the delivery evidence supports them.</p>
    ${Array.from(categories.entries()).map(([category, items]) => `
      <section class="service-v3-technology-category">
        <h3>${escapeHtml(category)}</h3>
        ${items.map((example) => `
          <article class="service-v3-technology-example">
            <div>
              <strong>${escapeHtml(example.useCase || "Workflow example")}</strong>
              <small>${escapeHtml((example.technologies || []).map((technology) => technology.name).join(" · "))}</small>
            </div>
            <p>${escapeHtml(example.explanation || "A compatible technology environment for this use case.")}</p>
          </article>`).join("")}
      </section>`).join("")}
  </div>`;
}

function rebuildEngagementNavigator(item) {
  const section = document.getElementById("service-content-tabs");
  const audienceSource = document.getElementById("who-what-section");
  const deliverablesSource = document.getElementById("deliverables-section");
  const techSource = document.getElementById("tech-section");
  if (!section || section.dataset.v3Ready === "true") return;

  const audienceCards = Array.from(audienceSource?.querySelectorAll(":scope > .card") || []);
  const examplesMarkup = technologyExamplesHtml(item);
  if (techSource && examplesMarkup) {
    techSource.removeAttribute("hidden");
    techSource.innerHTML = examplesMarkup;
  }

  const definitions = [
    ["Who it’s for", "Teams and conditions this work is designed around.", "users", audienceCards[0]],
    ["What’s included", "Activities and workstreams covered by the engagement.", "list-checks", audienceCards[1]],
    ["What you’ll receive", "Tangible outputs and operating assets handed back.", "package-check", deliverablesSource],
    ["Technology examples", "Compatible tools shown in the context of real workflows.", "workflow", techSource],
  ].filter((definition) => definition[3]);

  definitions.forEach(([, , , node]) => node.remove());
  audienceSource?.remove();

  section.dataset.v3Ready = "true";
  section.className = "service-content-tabs-section service-v3-engagement";
  section.innerHTML = `
    <div class="section-head left service-v3-engagement-heading">
      <span class="eyebrow">Engagement detail</span>
      <h2>What the engagement covers</h2>
      <p>Choose a view to understand the audience, delivery scope, outputs and technology environment.</p>
    </div>
    <div class="service-v3-engagement-shell">
      <div class="service-v3-engagement-tabs" role="tablist" aria-label="Service engagement information"></div>
      <div class="service-v3-engagement-panels"></div>
    </div>`;

  const tablist = section.querySelector(".service-v3-engagement-tabs");
  const panelWrap = section.querySelector(".service-v3-engagement-panels");
  const panels = [];

  definitions.forEach(([label, note, icon, node], index) => {
    const tab = document.createElement("button");
    tab.type = "button";
    tab.role = "tab";
    tab.id = `service-v3-tab-${index}`;
    tab.setAttribute("aria-controls", `service-v3-panel-${index}`);
    tab.setAttribute("aria-selected", String(index === 0));
    tab.tabIndex = index === 0 ? 0 : -1;
    tab.innerHTML = `<span class="service-v3-tab-icon"><i data-lucide="${icon}"></i></span><span><strong>${escapeHtml(label)}</strong><small>${escapeHtml(note)}</small></span>`;
    tablist.appendChild(tab);

    const panel = document.createElement("div");
    panel.id = `service-v3-panel-${index}`;
    panel.role = "tabpanel";
    panel.setAttribute("aria-labelledby", tab.id);
    panel.setAttribute("aria-hidden", String(index !== 0));
    panel.className = "service-v3-engagement-panel";
    panel.hidden = index !== 0;
    panel.toggleAttribute("inert", index !== 0);
    node.removeAttribute("hidden");
    node.removeAttribute("style");
    panel.appendChild(node);
    panelWrap.appendChild(panel);
    panels.push(panel);
  });

  wireTabs(tablist, panels);
}

function prepareDeliverySection() {
  const section = document.getElementById("how-it-works-section");
  const timeline = document.getElementById("service-how-it-works");
  if (!section || !timeline) return;
  section.classList.add("service-v3-delivery-section");
  section.querySelector(":scope > .section-head")?.classList.add("service-v3-delivery-heading");
  timeline.classList.add("service-v3-delivery-layout");
}

function refineRoiModel(item) {
  const card = document.querySelector(".service-roi-card, .glance-card");
  if (!card || card.dataset.v3Ready === "true") return;
  card.dataset.v3Ready = "true";
  card.classList.add("service-v3-roi");
  card.innerHTML = `
    <div class="service-v3-roi-head"><div><span class="eyebrow">Indicative engagement model</span><h3>Compare consultancy input with capacity released</h3></div><span class="service-v3-model-status"><i aria-hidden="true"></i>Planning estimate</span></div>
    <p class="service-v3-roi-intro">Adjust duration and scope to compare estimated consultancy time with internal capacity a ${escapeHtml(item.title.toLowerCase())} engagement could release. Figures are illustrative planning ranges.</p>
    <div class="service-v3-roi-kpis" aria-live="polite" aria-atomic="true"><article><span>Estimated input</span><strong id="v3-roi-input">10</strong><small>hours / month</small></article><article><span>Capacity released</span><strong id="v3-roi-release">22</strong><small>hours / month</small></article><article><span>Indicative leverage</span><strong id="v3-roi-leverage">2.2×</strong><small>released per hour</small></article></div>
    <div class="service-v3-roi-controls"><div class="service-v3-roi-control"><div><label for="v3-roi-duration">Project duration</label><output id="v3-roi-duration-output">12 weeks</output></div><input id="v3-roi-duration" type="range" min="4" max="24" step="2" value="12"></div><div class="service-v3-roi-control"><div><label for="v3-roi-scope">Delivery scope</label><output id="v3-roi-scope-output">Focused</output></div><input id="v3-roi-scope" type="range" min="1" max="3" step="1" value="2"></div></div>
    <div class="service-v3-scope-guide" role="group" aria-label="Delivery scope"><button type="button" data-scope="1"><strong>Targeted</strong><span>One defined problem or workstream.</span></button><button type="button" data-scope="2" class="is-active" aria-pressed="true"><strong>Focused</strong><span>Connected improvement around one outcome.</span></button><button type="button" data-scope="3"><strong>Embedded</strong><span>Leadership across dependent workstreams.</span></button></div>`;

  const duration = card.querySelector("#v3-roi-duration");
  const scope = card.querySelector("#v3-roi-scope");
  const labels = ["Targeted", "Focused", "Embedded"];
  const inputBase = [6, 10, 16];
  const leverageBase = [1.7, 2.2, 2.7];
  const update = () => {
    const weeks = Number(duration.value);
    const scopeValue = Number(scope.value);
    const input = Math.round(inputBase[scopeValue - 1] * (.88 + weeks / 100));
    const leverage = leverageBase[scopeValue - 1] * (.85 + Math.min(20, weeks) / 80);
    card.querySelector("#v3-roi-duration-output").textContent = `${weeks} weeks`;
    card.querySelector("#v3-roi-scope-output").textContent = labels[scopeValue - 1];
    card.querySelector("#v3-roi-input").textContent = String(input);
    card.querySelector("#v3-roi-release").textContent = String(Math.round(input * leverage));
    card.querySelector("#v3-roi-leverage").textContent = `${leverage.toFixed(1)}×`;
    card.querySelectorAll("[data-scope]").forEach((button) => {
      const active = Number(button.dataset.scope) === scopeValue;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });
  };
  duration.addEventListener("input", update);
  scope.addEventListener("input", update);
  card.querySelectorAll("[data-scope]").forEach((button) => button.addEventListener("click", () => { scope.value = button.dataset.scope; update(); }));
  update();
}

function refineCoverageAndFaqs() {
  document.getElementById("service-location-coverage")?.classList.add("service-v3-coverage");
  const faqSection = document.getElementById("faq-section");
  if (faqSection) faqSection.classList.add("service-v3-faq-section");
}

export function refineServiceTemplate(item) {
  rebuildEngagementNavigator(item);
  prepareDeliverySection();
  refineRoiModel(item);
  refineCoverageAndFaqs();
  renderIcons();
}
