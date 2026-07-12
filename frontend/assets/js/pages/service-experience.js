import { renderIcons } from "../render-helpers.js";

function ensureStyles() {
  if (document.querySelector('link[data-service-experience-css]')) return;
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.dataset.serviceExperienceCss = "true";
  link.href = "/assets/css/service-experience.css";
  document.head.appendChild(link);
}

function enhancePunchLists() {
  const section = document.getElementById("who-what-section");
  if (!section) return;
  section.classList.add("service-punch-grid");
  section.querySelectorAll(".card").forEach((card, cardIndex) => {
    card.classList.add("service-punch-card");
    const list = card.querySelector("ul");
    if (!list) return;
    list.classList.add("service-punch-list");
    list.querySelectorAll("li").forEach((item) => {
      item.innerHTML = `<span class="service-punch-icon"><i data-lucide="${cardIndex ? "check" : "arrow-up-right"}"></i></span><span>${item.innerHTML}</span>`;
    });
  });
}

function enhanceTimeline() {
  const wrap = document.getElementById("service-how-it-works");
  const timeline = wrap?.querySelector(".timeline");
  if (!timeline) return;
  timeline.classList.add("service-scroll-timeline");
  const progress = document.createElement("span");
  progress.className = "service-timeline-progress";
  progress.setAttribute("aria-hidden", "true");
  timeline.prepend(progress);

  const steps = Array.from(timeline.querySelectorAll(".timeline-step"));
  steps.forEach((step, index) => {
    step.style.setProperty("--step-index", index);
    step.classList.add("service-timeline-step");
  });

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-visible");
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.28, rootMargin: "0px 0px -10%" });
  steps.forEach((step) => observer.observe(step));

  let ticking = false;
  const updateProgress = () => {
    ticking = false;
    const rect = timeline.getBoundingClientRect();
    const viewport = window.innerHeight;
    const travelled = viewport * 0.65 - rect.top;
    const total = rect.height + viewport * 0.15;
    const ratio = Math.max(0, Math.min(1, travelled / total));
    timeline.style.setProperty("--timeline-progress", `${ratio * 100}%`);
  };
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(updateProgress);
  };
  updateProgress();
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
}

function enhanceFaq() {
  const section = document.getElementById("faq-section");
  const list = section?.querySelector(".faq-list");
  if (!section || !list) return;
  section.classList.add("service-faq-section");
  list.classList.add("service-faq-list");
  list.querySelectorAll(".faq-item").forEach((item, index) => {
    const button = item.querySelector(".faq-question");
    const answer = item.querySelector(".faq-answer");
    if (!button || !answer) return;
    const answerId = `service-faq-answer-${index}`;
    button.setAttribute("aria-expanded", "false");
    button.setAttribute("aria-controls", answerId);
    answer.id = answerId;
    const number = document.createElement("span");
    number.className = "service-faq-number";
    number.textContent = String(index + 1).padStart(2, "0");
    button.prepend(number);
    button.addEventListener("click", () => {
      requestAnimationFrame(() => {
        list.querySelectorAll(".faq-item").forEach((faq) => {
          faq.querySelector(".faq-question")?.setAttribute("aria-expanded", String(faq.classList.contains("open")));
        });
      });
    });
  });
}

function renderRoiModel(item) {
  const card = document.querySelector(".glance-card");
  if (!card) return;
  card.classList.add("service-roi-card");
  card.innerHTML = `
    <div class="service-roi-head">
      <span class="eyebrow">Indicative ROI</span>
      <span class="service-roi-live"><span></span>Reactive model</span>
    </div>
    <h3>Scale the engagement</h3>
    <p>Adjust duration and scope to model the potential operational leverage of a ${item.title.toLowerCase()} engagement.</p>
    <div class="service-roi-control">
      <div><label for="roi-duration">Project duration</label><output id="roi-duration-output">12 weeks</output></div>
      <input id="roi-duration" type="range" min="4" max="24" step="2" value="12">
    </div>
    <div class="service-roi-control">
      <div><label for="roi-scope">Delivery scope</label><output id="roi-scope-output">Focused</output></div>
      <input id="roi-scope" type="range" min="1" max="3" step="1" value="2">
    </div>
    <div class="service-roi-metrics" aria-live="polite">
      <div><strong id="roi-hours">18</strong><span>hours released / month</span></div>
      <div><strong id="roi-capacity">1.4×</strong><span>estimated capacity gain</span></div>
      <div><strong id="roi-payback">5–8</strong><span>month planning horizon</span></div>
    </div>
    <p class="service-roi-note">Illustrative planning ranges only. Actual outcomes depend on baseline maturity, adoption and implementation scope.</p>`;

  const duration = card.querySelector("#roi-duration");
  const scope = card.querySelector("#roi-scope");
  const labels = ["Targeted", "Focused", "Embedded"];
  const update = () => {
    const weeks = Number(duration.value);
    const scopeValue = Number(scope.value);
    const maturity = Math.max(0.65, Math.min(1.45, weeks / 12));
    const hours = Math.round(7 + weeks * 0.55 * scopeValue);
    const capacity = (1 + 0.12 * scopeValue * maturity).toFixed(1);
    const paybackLow = Math.max(2, Math.round(8 - weeks / 5 - scopeValue));
    const paybackHigh = paybackLow + Math.max(2, 5 - scopeValue);
    card.querySelector("#roi-duration-output").textContent = `${weeks} weeks`;
    card.querySelector("#roi-scope-output").textContent = labels[scopeValue - 1];
    card.querySelector("#roi-hours").textContent = String(hours);
    card.querySelector("#roi-capacity").textContent = `${capacity}×`;
    card.querySelector("#roi-payback").textContent = `${paybackLow}–${paybackHigh}`;
  };
  duration.addEventListener("input", update);
  scope.addEventListener("input", update);
  update();
}

export function enhanceServiceExperience(item) {
  ensureStyles();
  enhancePunchLists();
  enhanceTimeline();
  enhanceFaq();
  renderRoiModel(item);
  renderIcons();
}
