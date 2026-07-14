const DESKTOP_QUERY = "(min-width: 901px)";

function enhanceFaq(root) {
  const items = Array.from(root.querySelectorAll(".faq-item"));
  if (!items.length || root.dataset.enhanced === "true") return;
  root.dataset.enhanced = "true";

  const setOpen = (activeIndex, focus = false) => {
    items.forEach((item, index) => {
      const button = item.querySelector(".faq-question");
      const answer = item.querySelector(".faq-answer");
      const open = index === activeIndex;
      item.classList.toggle("open", open);
      button?.setAttribute("aria-expanded", String(open));
      if (answer) {
        answer.hidden = !open;
        answer.toggleAttribute("inert", !open);
        answer.setAttribute("aria-hidden", String(!open));
      }
    });
    if (focus && activeIndex >= 0) items[activeIndex]?.querySelector(".faq-question")?.focus();
  };

  items.forEach((item, index) => {
    const button = item.querySelector(".faq-question");
    const answer = item.querySelector(".faq-answer");
    if (!button || !answer) return;

    const buttonId = `service-faq-question-${index}`;
    const answerId = `service-faq-answer-${index}`;
    button.type = "button";
    button.id = buttonId;
    button.setAttribute("aria-controls", answerId);
    button.setAttribute("aria-expanded", "false");
    answer.id = answerId;
    answer.setAttribute("role", "region");
    answer.setAttribute("aria-labelledby", buttonId);

    if (!button.querySelector(".service-faq-number")) {
      const number = document.createElement("span");
      number.className = "service-faq-number";
      number.setAttribute("aria-hidden", "true");
      number.textContent = String(index + 1).padStart(2, "0");
      button.prepend(number);
    }

    button.addEventListener("click", () => {
      const currentOpen = button.getAttribute("aria-expanded") === "true";
      setOpen(currentOpen ? -1 : index);
    });

    button.addEventListener("keydown", (event) => {
      if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;
      event.preventDefault();
      let next = index;
      if (event.key === "ArrowDown") next = (index + 1) % items.length;
      else if (event.key === "ArrowUp") next = (index - 1 + items.length) % items.length;
      else if (event.key === "Home") next = 0;
      else if (event.key === "End") next = items.length - 1;
      items[next]?.querySelector(".faq-question")?.focus();
    });
  });

  setOpen(-1);
}

function enhanceTimeline(root) {
  const steps = Array.from(root.querySelectorAll(".timeline-step"));
  if (!steps.length || root.dataset.enhanced === "true") return;
  root.dataset.enhanced = "true";
  root.classList.add("service-process");

  const panels = [];
  const buttons = [];

  steps.forEach((step, index) => {
    const number = step.querySelector(".step-num")?.textContent?.trim() || String(index + 1).padStart(2, "0");
    const title = step.querySelector("h4")?.textContent?.trim() || `Step ${index + 1}`;
    const description = step.querySelector("p")?.textContent?.trim() || "";
    const buttonId = `service-process-trigger-${index}`;
    const panelId = `service-process-panel-${index}`;

    step.className = "service-process-step";
    step.innerHTML = `
      <button class="service-process-trigger" id="${buttonId}" type="button" aria-expanded="${index === 0}" aria-controls="${panelId}">
        <span class="service-process-number" aria-hidden="true">${number}</span>
        <span class="service-process-title">${title}</span>
        <span class="service-process-toggle" aria-hidden="true">+</span>
      </button>
      <div class="service-process-panel" id="${panelId}" role="region" aria-labelledby="${buttonId}" ${index === 0 ? "" : "hidden inert"}>
        <p></p>
      </div>`;
    step.querySelector(".service-process-panel p").textContent = description;
    buttons.push(step.querySelector(".service-process-trigger"));
    panels.push(step.querySelector(".service-process-panel"));
  });

  const activate = (activeIndex, { focus = false, allowCollapse = false } = {}) => {
    const currentOpen = buttons[activeIndex]?.getAttribute("aria-expanded") === "true";
    const collapse = allowCollapse && currentOpen;
    steps.forEach((step, index) => {
      const active = index === activeIndex && !collapse;
      step.classList.toggle("is-active", active);
      buttons[index].setAttribute("aria-expanded", String(active));
      panels[index].hidden = !active;
      panels[index].toggleAttribute("inert", !active);
      panels[index].setAttribute("aria-hidden", String(!active));
    });
    if (focus && !collapse) buttons[activeIndex]?.focus();
  };

  buttons.forEach((button, index) => {
    button.addEventListener("click", () => {
      activate(index, { allowCollapse: !window.matchMedia(DESKTOP_QUERY).matches });
    });
    button.addEventListener("keydown", (event) => {
      if (!["ArrowDown", "ArrowRight", "ArrowUp", "ArrowLeft", "Home", "End"].includes(event.key)) return;
      event.preventDefault();
      let next = index;
      if (event.key === "ArrowDown" || event.key === "ArrowRight") next = (index + 1) % buttons.length;
      else if (event.key === "ArrowUp" || event.key === "ArrowLeft") next = (index - 1 + buttons.length) % buttons.length;
      else if (event.key === "Home") next = 0;
      else if (event.key === "End") next = buttons.length - 1;
      activate(next, { focus: true });
    });
  });

  let observer = null;
  const configure = () => {
    observer?.disconnect();
    observer = null;
    activate(0);
    if (!window.matchMedia(DESKTOP_QUERY).matches || window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) return;
    observer = new IntersectionObserver((entries) => {
      const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (!visible) return;
      const index = steps.indexOf(visible.target);
      if (index >= 0) activate(index);
    }, { rootMargin: "-30% 0px -45% 0px", threshold: [0.1, 0.35, 0.65] });
    steps.forEach((step) => observer.observe(step));
  };

  window.matchMedia(DESKTOP_QUERY).addEventListener?.("change", configure);
  window.matchMedia("(prefers-reduced-motion: reduce)").addEventListener?.("change", configure);
  configure();
}

export function enhanceServicePage() {
  const faq = document.getElementById("service-faq");
  const timeline = document.getElementById("service-how-it-works");
  if (faq) enhanceFaq(faq);
  if (timeline) enhanceTimeline(timeline);
}
