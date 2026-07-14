import { escapeHtml } from "../render-helpers.js";

function textOnly(value) {
  return String(value || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function sentence(value, limit = 180) {
  const text = textOnly(value);
  if (!text) return "";
  const first = text.match(/^.*?[.!?](?:\s|$)/)?.[0]?.trim() || text;
  return first.length > limit ? `${first.slice(0, limit).replace(/\s+\S*$/, "")}…` : first;
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
  return match ? { start: Number(match[1]), end: Number(match[2]) } : null;
}

function parsePercentageChange(value) {
  const match = String(value || "").match(/^\s*([+-])\s*(\d+(?:\.\d+)?)\s*%\s*$/);
  if (!match) return null;
  const magnitude = Number(match[2]);
  return { value: match[1] === "-" ? -magnitude : magnitude, magnitude };
}

function metricStatus(metric) {
  return /\b(target|goal|forecast|projected|projection|estimated|indicative)\b/i.test(`${metric.label || ""} ${metric.value || ""}`)
    ? "Target or estimate"
    : "Delivered result";
}

function findTimeframe(item, metric) {
  if (metric.timeframe) return String(metric.timeframe);
  const source = [metric.label, metric.value, item.cardSummary, item.description, item.resultsDetail, ...(item.approach || []).map((step) => step.description)].map(textOnly).join(" ");
  const patterns = [
    /\bwithin\s+(?:around\s+|approximately\s+)?\d+\s+(?:days?|weeks?|months?|years?)\b/i,
    /\bover\s+(?:around\s+|approximately\s+)?\d+\s+(?:days?|weeks?|months?|years?)\b/i,
    /\bfor\s+(?:around\s+|approximately\s+)?\d+\s+(?:days?|weeks?|months?|years?)\b/i,
    /\bin\s+(?:around\s+|approximately\s+)?\d+\s+(?:days?|weeks?|months?|years?)\b/i,
    /\b(?:around|approximately)\s+\d+\s+(?:days?|weeks?|months?|years?)\b/i,
  ];
  return patterns.map((pattern) => source.match(pattern)?.[0]).find(Boolean) || "Timeframe not stated";
}

function chartContext(item, metric, options = {}) {
  const explicit = metric.chartNarrative || metric.narrative || metric.context || metric.description;
  const baseline = metric.baseline || options.baseline || sentence(item.challenge, 150) || "The original operating position is described in the case study.";
  const change = metric.change || options.change || `${metric.label || "The measure"} changed to ${metric.value || "the reported result"}.`;
  const meaning = metric.commercialMeaning || metric.meaning || sentence(item.resultsDetail || item.cardSummary, 170) || "The change mattered because it improved the commercial or operational outcome described in the engagement.";
  return {
    baseline: sentence(explicit || baseline, 170),
    change: sentence(change, 150),
    timeframe: findTimeframe(item, metric),
    meaning,
    status: metricStatus(metric),
  };
}

function contextHtml(context) {
  return `<div class="cs-evidence-context">
    <span>What changed</span><p>${escapeHtml(context.change)}</p>
    <span>Starting point</span><p>${escapeHtml(context.baseline)}</p>
    <span>Period and status</span><p>${escapeHtml(`${context.timeframe} · ${context.status}`)}</p>
    <span>Why it mattered</span><p>${escapeHtml(context.meaning)}</p>
  </div>`;
}

function slopeChartHtml(item, metric, pair) {
  const max = Math.max(pair.start, pair.end, 100);
  const chartTop = 22;
  const chartBottom = 142;
  const y = (value) => chartBottom - (Math.max(0, value) / max) * (chartBottom - chartTop);
  const startY = y(pair.start).toFixed(1);
  const endY = y(pair.end).toFixed(1);
  const movement = pair.end - pair.start;
  const timeframe = findTimeframe(item, metric);
  const afterLabel = timeframe === "Timeframe not stated" ? "After" : timeframe.replace(/^within\s+/i, "Within ").replace(/^over\s+/i, "Over ");
  const context = chartContext(item, metric, {
    baseline: `${metric.label || "The measure"} started at ${pair.start}%.`,
    change: `${metric.label || "The measure"} increased from ${pair.start}% to ${pair.end}%, a movement of ${movement.toFixed(movement % 1 ? 1 : 0)} percentage points.`,
  });

  return `<article class="cs-evidence-card cs-evidence-card--recovery">
    <div class="cs-evidence-card-head"><span>${escapeHtml(metric.label || "Visibility recovery")}</span><strong>${movement >= 0 ? "+" : ""}${movement.toFixed(movement % 1 ? 1 : 0)} pts</strong></div>
    <svg class="cs-slope-chart" viewBox="0 0 420 168" role="img" aria-label="${escapeHtml(metric.label)} changed from ${pair.start}% to ${pair.end}%${timeframe === "Timeframe not stated" ? "" : ` ${timeframe}`}">
      <defs><linearGradient id="csSlopeGradient" x1="0" x2="1"><stop offset="0" stop-color="#8a72e8"/><stop offset="1" stop-color="#ff783d"/></linearGradient></defs>
      <line class="cs-slope-grid" x1="46" y1="142" x2="374" y2="142"/><line class="cs-slope-line" x1="70" y1="${startY}" x2="350" y2="${endY}"/>
      <circle class="cs-slope-point cs-slope-point--start" cx="70" cy="${startY}" r="8"/><circle class="cs-slope-point cs-slope-point--end" cx="350" cy="${endY}" r="10"/>
      <text class="cs-slope-value" x="70" y="${Math.max(18, Number(startY) - 16)}" text-anchor="middle">${pair.start}%</text>
      <text class="cs-slope-value cs-slope-value--end" x="350" y="${Math.max(18, Number(endY) - 16)}" text-anchor="middle">${pair.end}%</text>
      <text class="cs-slope-axis" x="70" y="162" text-anchor="middle">Baseline</text><text class="cs-slope-axis" x="350" y="162" text-anchor="middle">${escapeHtml(afterLabel)}</text>
    </svg>${contextHtml(context)}
  </article>`;
}

function upliftChartHtml(item, metric, change, index) {
  const baselineHeight = 62;
  const resultHeight = Math.max(24, Math.min(96, baselineHeight * (1 + change.value / 100)));
  const direction = change.value >= 0 ? "increased" : "decreased";
  const context = chartContext(item, metric, {
    baseline: `${metric.label || "The measure"} is indexed to a baseline of 100 because the source does not provide the raw starting value.`,
    change: `${metric.label || "The measure"} ${direction} by ${change.magnitude}%.`,
  });
  return `<article class="cs-evidence-card cs-evidence-card--uplift" style="--evidence-delay:${index * 70}ms">
    <div class="cs-evidence-card-head"><span>${escapeHtml(metric.label || "Commercial impact")}</span><strong>${escapeHtml(metric.value)}</strong></div>
    <div class="cs-index-chart" role="img" aria-label="${escapeHtml(metric.label)} ${direction} by ${change.magnitude} per cent; bars are indexed to a baseline of 100">
      <div class="cs-index-bar-group"><span class="cs-index-bar cs-index-bar--base" style="--bar-height:${baselineHeight}%"><i>100</i></span><span class="cs-index-bar cs-index-bar--result" style="--bar-height:${resultHeight}%"><i>${Math.round(100 + change.value)}</i></span></div>
      <div class="cs-index-chart-labels"><span>Indexed baseline</span><span>Indexed result</span></div>
    </div>${contextHtml(context)}
  </article>`;
}

function cadenceCardHtml(item, metric, testsPerMonth, months) {
  const total = testsPerMonth * months;
  const dots = Array.from({ length: total }, (_, index) => `<i style="--dot-delay:${index * 28}ms" title="Month ${Math.floor(index / testsPerMonth) + 1}, experiment ${(index % testsPerMonth) + 1}"></i>`).join("");
  const context = chartContext(item, metric, {
    baseline: sentence(item.challenge, 150),
    change: `${total} structured experiments were delivered at a cadence of ${testsPerMonth} per month across ${months} months.`,
  });
  return `<article class="cs-evidence-card cs-evidence-card--cadence">
    <div class="cs-evidence-card-head"><span>${escapeHtml(metric.label || "Experimentation cadence")}</span><strong>${testsPerMonth} / month</strong></div>
    <div class="cs-cadence-grid" role="img" aria-label="${total} structured experiments delivered over ${months} months">${dots}</div>
    <div class="cs-cadence-summary"><b>${total}</b><span>structured experiments across ${months} months</span></div>${contextHtml(context)}
  </article>`;
}

function genericMetricHtml(item, metric, index) {
  const context = chartContext(item, metric, {
    change: `${metric.label || "The reported measure"}: ${metric.value || "result recorded"}.`,
  });
  return `<article class="cs-evidence-card cs-evidence-card--datum" style="--evidence-delay:${index * 70}ms">
    <span class="cs-evidence-index">${String(index + 1).padStart(2, "0")}</span><strong>${escapeHtml(metric.value)}</strong><p>${escapeHtml(metric.label)}</p>
    <div class="cs-datum-signal" aria-hidden="true"><i></i><i></i><i></i><i></i></div>${contextHtml(context)}
  </article>`;
}

function extractCadence(item) {
  const text = (item.approach || []).map((step) => `${step.title || ""} ${step.description || ""}`).join(" ");
  const match = text.match(/((?:\d+|one|two|three|four|five|six|seven|eight|nine|ten))\s+(?:controlled\s+|structured\s+)?(?:tests?|experiments?)\s+(?:a|per|each)\s+month[\s\S]*?((?:\d+|one|two|three|four|five|six|seven|eight|nine|ten|twelve))\s+months?/i);
  if (!match) return null;
  const testsPerMonth = numericWordsToNumber(match[1]);
  const months = numericWordsToNumber(match[2]);
  return testsPerMonth && months ? { testsPerMonth, months } : null;
}

function observeEvidence(section) {
  if (!section || section.dataset.evidenceObserved === "true") return;
  section.dataset.evidenceObserved = "true";
  if (!("IntersectionObserver" in window) || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return section.classList.add("is-visible");
  const observer = new IntersectionObserver((entries) => entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    entry.target.classList.add("is-visible");
    observer.unobserve(entry.target);
  }), { threshold: 0.2 });
  observer.observe(section);
}

export function renderEvidenceExperience(item, metrics = []) {
  const wrap = document.getElementById("cs-metrics");
  const section = document.getElementById("cs-evidence-section");
  if (!wrap || !metrics.length) return;
  const cadence = extractCadence(item);
  let cadenceRendered = false;
  const cards = metrics.map((metric, index) => {
    const metricText = `${metric.label || ""} ${metric.value || ""}`;
    if (/\b(?:tests?|experiments?|experimentation)\b[\s\S]*\bmonth\b/i.test(metricText) && cadence) {
      cadenceRendered = true;
      return cadenceCardHtml(item, metric, cadence.testsPerMonth, cadence.months);
    }
    const pair = parseBeforeAfter(metric.value);
    if (pair) return slopeChartHtml(item, metric, pair);
    const change = parsePercentageChange(metric.value);
    if (change) return upliftChartHtml(item, metric, change, index);
    return genericMetricHtml(item, metric, index);
  });
  if (cadence && !cadenceRendered) cards.push(cadenceCardHtml(item, { label: "Experimentation cadence", value: `${cadence.testsPerMonth} tests per month` }, cadence.testsPerMonth, cadence.months));
  wrap.innerHTML = `<div class="cs-evidence-dashboard${cards.length >= 4 ? " has-four" : ""}">${cards.join("")}</div>`;
  observeEvidence(section);
}

function stagePanelHtml(step, index, total) {
  const progress = ((index + 1) / total) * 100;
  return `<article class="cs-timeline-panel" id="cs-stage-panel-${index}" role="tabpanel" aria-labelledby="cs-stage-tab-${index}" aria-hidden="${index !== 0}" ${index ? "hidden inert" : ""}>
    <div class="cs-timeline-panel-copy"><span class="cs-timeline-step">Step ${String(index + 1).padStart(2, "0")} of ${String(total).padStart(2, "0")}</span><h3>${escapeHtml(step.title)}</h3><p>${escapeHtml(step.description)}</p></div>
    <div class="cs-timeline-panel-visual" aria-hidden="true"><span>Delivery progress</span><div class="cs-timeline-orbit" style="--stage-progress:${progress}%"><i></i><b>${Math.round(progress)}%</b></div><div class="cs-timeline-lanes">${Array.from({ length: total }, (_, laneIndex) => `<i class="${laneIndex <= index ? "is-complete" : ""}"></i>`).join("")}</div></div>
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
  } else inViewport = true;

  activate(0);
  section.hidden = false;
}
