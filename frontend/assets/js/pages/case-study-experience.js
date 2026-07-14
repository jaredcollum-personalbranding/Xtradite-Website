import { escapeHtml } from "../render-helpers.js";

function evidenceStatusLabel(metric) {
  if (metric?.evidenceStatus === "approved") return "Approved evidence";
  if (metric?.evidenceStatus === "qualified") return "Qualified evidence";
  return "Not approved for public use";
}

function explicitContextRows(metric) {
  const rows = [
    ["Starting point", metric.baseline],
    ["Measurement period", metric.timeframe],
    ["Why it mattered", metric.commercialMeaning || metric.meaning],
    ["Limitations", metric.limitations],
  ].filter(([, value]) => String(value || "").trim());

  if (!rows.length) return "";
  return `<div class="cs-evidence-context">
    ${rows.map(([label, value]) => `<span>${escapeHtml(label)}</span><p>${escapeHtml(value)}</p>`).join("")}
  </div>`;
}

function metricCardHtml(metric, index) {
  return `<article class="cs-evidence-card cs-evidence-card--datum" style="--evidence-delay:${index * 70}ms">
    <span class="cs-evidence-index">${String(index + 1).padStart(2, "0")}</span>
    <strong>${escapeHtml(metric.value)}</strong>
    <p>${escapeHtml(metric.label)}</p>
    <span class="cs-evidence-status">${escapeHtml(evidenceStatusLabel(metric))}</span>
    ${explicitContextRows(metric)}
  </article>`;
}

function observeEvidence(section) {
  if (!section || section.dataset.evidenceObserved === "true") return;
  section.dataset.evidenceObserved = "true";
  if (!("IntersectionObserver" in window) || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    section.classList.add("is-visible");
    return;
  }

  const observer = new IntersectionObserver((entries) => entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    entry.target.classList.add("is-visible");
    observer.unobserve(entry.target);
  }), { threshold: 0.2 });
  observer.observe(section);
}

export function renderEvidenceExperience(_item, metrics = []) {
  const wrap = document.getElementById("cs-metrics");
  const section = document.getElementById("cs-evidence-section");
  const eligible = metrics.filter((metric) => ["qualified", "approved"].includes(metric?.evidenceStatus));
  if (!wrap || !eligible.length) return;

  wrap.innerHTML = `<div class="cs-evidence-dashboard${eligible.length >= 4 ? " has-four" : ""}">
    ${eligible.map(metricCardHtml).join("")}
  </div>`;
  observeEvidence(section);
}

function stagePanelHtml(step, index, total) {
  const progress = ((index + 1) / total) * 100;
  return `<article class="cs-timeline-panel" id="cs-stage-panel-${index}" role="tabpanel" aria-labelledby="cs-stage-tab-${index}" aria-hidden="${index !== 0}" ${index ? "hidden inert" : ""}>
    <div class="cs-timeline-panel-copy">
      <span class="cs-timeline-step">Step ${String(index + 1).padStart(2, "0")} of ${String(total).padStart(2, "0")}</span>
      <h3>${escapeHtml(step.title)}</h3>
      <p>${escapeHtml(step.description)}</p>
    </div>
    <div class="cs-timeline-panel-visual" aria-hidden="true">
      <span>Delivery progress</span>
      <div class="cs-timeline-orbit" style="--stage-progress:${progress}%"><i></i><b>${Math.round(progress)}%</b></div>
      <div class="cs-timeline-lanes">${Array.from({ length: total }, (_, laneIndex) => `<i class="${laneIndex <= index ? "is-complete" : ""}"></i>`).join("")}</div>
    </div>
  </article>`;
}

export function renderApproachExperience(steps = []) {
  const panelsWrap = document.getElementById("cs-approach");
  const navWrap = document.getElementById("cs-process-visual");
  const section = document.getElementById("cs-approach-section");
  if (!panelsWrap || !navWrap || !section || !steps.length) return;

  panelsWrap.innerHTML = `<div class="cs-timeline-panels">${steps.map((step, index) => stagePanelHtml(step, index, steps.length)).join("")}</div>`;
  navWrap.innerHTML = `<div class="cs-timeline-track" style="--timeline-columns:${Math.min(steps.length, 4)}" role="tablist" aria-label="Delivery approach">
    ${steps.map((step, index) => `<button type="button" class="cs-timeline-tab${index === 0 ? " is-active" : ""}" id="cs-stage-tab-${index}" role="tab" aria-selected="${index === 0}" aria-controls="cs-stage-panel-${index}" tabindex="${index === 0 ? 0 : -1}" data-stage="${index}"><span>${String(index + 1).padStart(2, "0")}</span><b>${escapeHtml(step.title)}</b></button>`).join("")}
    </div><div class="cs-timeline-progress" aria-hidden="true"><i></i></div>`;
  navWrap.setAttribute("aria-label", "Interactive delivery timeline controls");
  section.insertBefore(navWrap, panelsWrap);

  const tabs = Array.from(navWrap.querySelectorAll(".cs-timeline-tab"));
  const panels = Array.from(panelsWrap.querySelectorAll(".cs-timeline-panel"));
  const progress = navWrap.querySelector(".cs-timeline-progress i");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let activeIndex = 0;
  let timer = null;
  let inViewport = false;
  let focusPaused = false;
  let interactionPauseUntil = 0;

  const canPlay = () => !reducedMotion.matches && !document.hidden && inViewport && !focusPaused && Date.now() >= interactionPauseUntil && steps.length > 1;
  const stop = () => { if (timer) window.clearTimeout(timer); timer = null; };
  const schedule = () => {
    stop();
    section.dataset.autoRotation = canPlay() ? "playing" : "paused";
    if (canPlay()) timer = window.setTimeout(() => activate(activeIndex + 1), 1600);
  };

  const activate = (nextIndex, { focus = false, userInitiated = false } = {}) => {
    activeIndex = (nextIndex + steps.length) % steps.length;
    if (userInitiated) interactionPauseUntil = Date.now() + 6500;
    tabs.forEach((tab, index) => {
      const active = index === activeIndex;
      tab.classList.toggle("is-active", active);
      tab.setAttribute("aria-selected", String(active));
      tab.tabIndex = active ? 0 : -1;
    });
    panels.forEach((panel, index) => {
      const active = index === activeIndex;
      panel.hidden = !active;
      panel.toggleAttribute("inert", !active);
      panel.setAttribute("aria-hidden", String(!active));
      panel.classList.toggle("is-active", active);
    });
    if (progress) progress.style.setProperty("--timeline-progress", `${((activeIndex + 1) / steps.length) * 100}%`);
    if (focus) tabs[activeIndex]?.focus();
    schedule();
  };

  tabs.forEach((tab, index) => {
    tab.addEventListener("click", () => activate(index, { userInitiated: true }));
    tab.addEventListener("keydown", (event) => {
      if (!["ArrowRight", "ArrowLeft", "Home", "End"].includes(event.key)) return;
      event.preventDefault();
      if (event.key === "Home") activate(0, { focus: true, userInitiated: true });
      else if (event.key === "End") activate(steps.length - 1, { focus: true, userInitiated: true });
      else activate(index + (event.key === "ArrowRight" ? 1 : -1), { focus: true, userInitiated: true });
    });
  });

  section.addEventListener("focusin", () => { focusPaused = true; schedule(); });
  section.addEventListener("focusout", () => requestAnimationFrame(() => { focusPaused = section.contains(document.activeElement); schedule(); }));
  document.addEventListener("visibilitychange", schedule);
  reducedMotion.addEventListener?.("change", schedule);
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(([entry]) => { inViewport = entry.isIntersecting; schedule(); }, { threshold: 0.3 }).observe(section);
  } else {
    inViewport = true;
  }

  activate(0);
  section.hidden = false;
}
