import { escapeHtml } from "../render-helpers.js";

const STYLE_ID = "caseStudyExperienceCss";
const STYLE_HREF = "/assets/css/case-study-experience.css?v=20260713";

function ensureStyles() {
  if (document.querySelector(`link[data-${STYLE_ID.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)}]`)) return;
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = STYLE_HREF;
  link.dataset[STYLE_ID] = "true";
  document.head.appendChild(link);
}

function numericWordsToNumber(value) {
  const words = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, twelve: 12 };
  const normalised = String(value || "").toLowerCase();
  const digit = normalised.match(/\d+(?:\.\d+)?/);
  if (digit) return Number(digit[0]);
  const word = Object.keys(words).find((candidate) => new RegExp(`\\b${candidate}\\b`).test(normalised));
  return word ? words[word] : null;
}

function parseBeforeAfter(value) {
  const match = String(value || "").match(/(-?\d+(?:\.\d+)?)\s*%?\s*(?:→|->|to)\s*(-?\d+(?:\.\d+)?)\s*%?/i);
  if (!match) return null;
  return { start: Number(match[1]), end: Number(match[2]) };
}

function parsePercentageChange(value) {
  const match = String(value || "").match(/^\s*([+-])\s*(\d+(?:\.\d+)?)\s*%\s*$/);
  if (!match) return null;
  const magnitude = Number(match[2]);
  return { value: match[1] === "-" ? -magnitude : magnitude, magnitude };
}

function slopeChartHtml(metric, pair) {
  const max = Math.max(pair.start, pair.end, 100);
  const chartTop = 22;
  const chartBottom = 142;
  const y = (value) => chartBottom - (Math.max(0, value) / max) * (chartBottom - chartTop);
  const startY = y(pair.start).toFixed(1);
  const endY = y(pair.end).toFixed(1);
  const movement = pair.end - pair.start;

  return `
    <article class="cs-evidence-card cs-evidence-card--recovery">
      <div class="cs-evidence-card-head">
        <span>Visibility recovery</span>
        <strong>${movement >= 0 ? "+" : ""}${movement.toFixed(movement % 1 ? 1 : 0)} pts</strong>
      </div>
      <svg class="cs-slope-chart" viewBox="0 0 420 168" role="img" aria-label="${escapeHtml(metric.label)} changed from ${pair.start}% to ${pair.end}%">
        <defs><linearGradient id="csSlopeGradient" x1="0" x2="1"><stop offset="0" stop-color="#8a72e8" /><stop offset="1" stop-color="#ff783d" /></linearGradient></defs>
        <line class="cs-slope-grid" x1="46" y1="142" x2="374" y2="142" />
        <line class="cs-slope-line" x1="70" y1="${startY}" x2="350" y2="${endY}" />
        <circle class="cs-slope-point cs-slope-point--start" cx="70" cy="${startY}" r="8" />
        <circle class="cs-slope-point cs-slope-point--end" cx="350" cy="${endY}" r="10" />
        <text class="cs-slope-value" x="70" y="${Math.max(18, Number(startY) - 16)}" text-anchor="middle">${pair.start}%</text>
        <text class="cs-slope-value cs-slope-value--end" x="350" y="${Math.max(18, Number(endY) - 16)}" text-anchor="middle">${pair.end}%</text>
        <text class="cs-slope-axis" x="70" y="162" text-anchor="middle">Before</text>
        <text class="cs-slope-axis" x="350" y="162" text-anchor="middle">After four weeks</text>
      </svg>
      <p>${escapeHtml(metric.label)}</p>
    </article>`;
}

function upliftChartHtml(metric, change, index) {
  const baselineHeight = 62;
  const resultHeight = Math.min(92, baselineHeight * (1 + Math.abs(change.value) / 100));
  const direction = change.value >= 0 ? "up" : "down";
  return `
    <article class="cs-evidence-card cs-evidence-card--uplift" style="--evidence-delay:${index * 70}ms">
      <div class="cs-evidence-card-head"><span>Commercial impact</span><strong>${escapeHtml(metric.value)}</strong></div>
      <div class="cs-index-chart" role="img" aria-label="${escapeHtml(metric.label)} moved ${Math.abs(change.value)} per cent ${direction}">
        <div class="cs-index-bar-group">
          <span class="cs-index-bar cs-index-bar--base" style="--bar-height:${baselineHeight}%"><i>100</i></span>
          <span class="cs-index-bar cs-index-bar--result" style="--bar-height:${resultHeight}%"><i>${Math.round(100 + change.value)}</i></span>
        </div>
        <div class="cs-index-chart-labels"><span>Baseline</span><span>Result</span></div>
      </div>
      <p>${escapeHtml(metric.label)}</p>
    </article>`;
}

function cadenceCardHtml(testsPerMonth, months) {
  const total = testsPerMonth * months;
  const dots = Array.from({ length: total }, (_, index) => {
    const month = Math.floor(index / testsPerMonth) + 1;
    return `<i style="--dot-delay:${index * 28}ms" title="Month ${month}, experiment ${(index % testsPerMonth) + 1}"></i>`;
  }).join("");
  return `
    <article class="cs-evidence-card cs-evidence-card--cadence">
      <div class="cs-evidence-card-head"><span>Experimentation engine</span><strong>${testsPerMonth} / month</strong></div>
      <div class="cs-cadence-grid" role="img" aria-label="${total} structured experiments delivered over ${months} months">${dots}</div>
      <div class="cs-cadence-summary"><b>${total}</b><span>structured experiments across ${months} months</span></div>
    </article>`;
}

function genericMetricHtml(metric, index) {
  return `
    <article class="cs-evidence-card cs-evidence-card--datum" style="--evidence-delay:${index * 70}ms">
      <span class="cs-evidence-index">${String(index + 1).padStart(2, "0")}</span>
      <strong>${escapeHtml(metric.value)}</strong>
      <p>${escapeHtml(metric.label)}</p>
      <div class="cs-datum-signal" aria-hidden="true"><i></i><i></i><i></i><i></i></div>
    </article>`;
}

function extractCadence(item) {
  const text = (item.approach || []).map((step) => `${step.title || ""} ${step.description || ""}`).join(" ");
  const match = text.match(/((?:\d+|one|two|three|four|five|six|seven|eight|nine|ten))\s+(?:controlled\s+|structured\s+)?(?:tests?|experiments?)\s+(?:a|per)\s+month[\s\S]*?((?:\d+|one|two|three|four|five|six|seven|eight|nine|ten|twelve))\s+months?/i);
  if (!match) return null;
  const testsPerMonth = numericWordsToNumber(match[1]);
  const months = numericWordsToNumber(match[2]);
  return testsPerMonth && months ? { testsPerMonth, months } : null;
}

function observeEvidence(section) {
  if (!section || section.dataset.evidenceObserved === "true") return;
  section.dataset.evidenceObserved = "true";
  if (!("IntersectionObserver" in window) || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    section.classList.add("is-visible");
    return;
  }
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-visible");
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.25 });
  observer.observe(section);
}

export function renderEvidenceExperience(item, metrics = []) {
  ensureStyles();
  const wrap = document.getElementById("cs-metrics");
  const section = document.getElementById("cs-evidence-section");
  if (!wrap || !metrics.length) return;

  const cards = metrics.map((metric, index) => {
    const pair = parseBeforeAfter(metric.value);
    if (pair) return slopeChartHtml(metric, pair);
    const change = parsePercentageChange(metric.value);
    if (change) return upliftChartHtml(metric, change, index);
    return genericMetricHtml(metric, index);
  });
  const cadence = extractCadence(item);
  if (cadence) cards.push(cadenceCardHtml(cadence.testsPerMonth, cadence.months));
  wrap.innerHTML = `<div class="cs-evidence-dashboard${cards.length >= 4 ? " has-four" : ""}">${cards.join("")}</div>`;
  observeEvidence(section);
}

function stagePanelHtml(step, index, total) {
  const progress = ((index + 1) / total) * 100;
  return `
    <article class="cs-timeline-panel" id="cs-stage-panel-${index}" role="tabpanel" aria-labelledby="cs-stage-tab-${index}" ${index ? "hidden" : ""}>
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
  ensureStyles();
  const panelsWrap = document.getElementById("cs-approach");
  const navWrap = document.getElementById("cs-process-visual");
  const section = document.getElementById("cs-approach-section");
  if (!panelsWrap || !navWrap || !section || !steps.length) return;

  panelsWrap.innerHTML = `<div class="cs-timeline-panels">${steps.map(stagePanelHtml).join("")}</div>`;
  navWrap.innerHTML = `
    <div class="cs-timeline-track" style="--timeline-columns:${Math.min(steps.length, 4)}" role="tablist" aria-label="Delivery approach">
      ${steps.map((step, index) => `<button type="button" class="cs-timeline-tab${index === 0 ? " is-active" : ""}" id="cs-stage-tab-${index}" role="tab" aria-selected="${index === 0}" aria-controls="cs-stage-panel-${index}" tabindex="${index === 0 ? 0 : -1}" data-stage="${index}">
        <span>${String(index + 1).padStart(2, "0")}</span><b>${escapeHtml(step.title)}</b>
      </button>`).join("")}
    </div>
    <div class="cs-timeline-progress" aria-hidden="true"><i></i></div>`;
  navWrap.setAttribute("aria-label", "Interactive delivery timeline");

  const tabs = [...navWrap.querySelectorAll(".cs-timeline-tab")];
  const panels = [...panelsWrap.querySelectorAll(".cs-timeline-panel")];
  const progress = navWrap.querySelector(".cs-timeline-progress i");
  let activeIndex = 0;
  let timer = null;
  let paused = false;

  const stop = () => { if (timer) window.clearInterval(timer); timer = null; };
  const start = () => {
    stop();
    if (paused || steps.length < 2 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    timer = window.setInterval(() => activate(activeIndex + 1), 5600);
  };
  const restart = () => { stop(); window.setTimeout(start, 900); };
  const activate = (nextIndex, { focus = false, userInitiated = false } = {}) => {
    activeIndex = (nextIndex + steps.length) % steps.length;
    tabs.forEach((tab, index) => {
      const active = index === activeIndex;
      tab.classList.toggle("is-active", active);
      tab.setAttribute("aria-selected", String(active));
      tab.tabIndex = active ? 0 : -1;
    });
    panels.forEach((panel, index) => {
      const active = index === activeIndex;
      panel.hidden = !active;
      panel.classList.toggle("is-active", active);
    });
    if (progress) progress.style.setProperty("--timeline-progress", `${((activeIndex + 1) / steps.length) * 100}%`);
    if (focus) tabs[activeIndex].focus();
    if (userInitiated) restart();
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

  section.addEventListener("pointerenter", () => { paused = true; stop(); });
  section.addEventListener("pointerleave", () => { paused = false; start(); });
  section.addEventListener("focusin", () => { paused = true; stop(); });
  section.addEventListener("focusout", (event) => {
    if (section.contains(event.relatedTarget)) return;
    paused = false;
    start();
  });

  activate(0);
  start();
  section.hidden = false;
}
