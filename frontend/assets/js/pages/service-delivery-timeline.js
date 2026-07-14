const DESKTOP_QUERY = "(min-width: 901px)";
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

function initialiseDeliveryTimeline() {
  const timeline = document.querySelector(".service-delivery-timeline");
  if (!timeline || timeline.dataset.timelineReady === "true") return;
  timeline.dataset.timelineReady = "true";

  const phases = Array.from(timeline.querySelectorAll("[data-delivery-phase]"));
  if (!phases.length) return;

  const setActive = (index, { focus = false, allowCollapse = false } = {}) => {
    const safeIndex = Math.max(0, Math.min(index, phases.length - 1));
    const current = phases[safeIndex];
    const collapseCurrent = allowCollapse && current.classList.contains("is-open");

    phases.forEach((phase, phaseIndex) => {
      const active = phaseIndex === safeIndex && !collapseCurrent;
      const trigger = phase.querySelector(".service-delivery-phase-trigger");
      const content = phase.querySelector(".service-delivery-phase-content");
      phase.classList.toggle("is-current", active);
      phase.classList.toggle("is-open", active);
      trigger?.setAttribute("aria-expanded", String(active));
      if (content) {
        content.hidden = !active;
        content.toggleAttribute("inert", !active);
        content.setAttribute("aria-hidden", String(!active));
      }
    });

    timeline.style.setProperty("--active-stage", String(safeIndex));
    timeline.style.setProperty("--delivery-progress", `${((safeIndex + 1) / phases.length) * 100}%`);
    if (focus) phases[safeIndex].querySelector(".service-delivery-phase-trigger")?.focus({ preventScroll: true });
  };

  phases.forEach((phase, index) => {
    const trigger = phase.querySelector(".service-delivery-phase-trigger");
    if (!trigger) return;
    if (trigger instanceof HTMLButtonElement) trigger.type = "button";
    trigger.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopImmediatePropagation();
      const mobileOrReduced = !window.matchMedia(DESKTOP_QUERY).matches || reducedMotion.matches;
      setActive(index, { allowCollapse: mobileOrReduced });
    }, true);
    trigger.addEventListener("keydown", (event) => {
      if (!["ArrowDown", "ArrowRight", "ArrowUp", "ArrowLeft", "Home", "End"].includes(event.key)) return;
      event.preventDefault();
      let next = index;
      if (event.key === "ArrowDown" || event.key === "ArrowRight") next = (index + 1) % phases.length;
      else if (event.key === "ArrowUp" || event.key === "ArrowLeft") next = (index - 1 + phases.length) % phases.length;
      else if (event.key === "Home") next = 0;
      else if (event.key === "End") next = phases.length - 1;
      setActive(next, { focus: true });
    });
  });

  let observer = null;
  const configureObserver = () => {
    observer?.disconnect();
    observer = null;
    const desktop = window.matchMedia(DESKTOP_QUERY).matches;
    timeline.dataset.deliveryMode = !desktop ? "accordion" : reducedMotion.matches ? "manual" : "scroll";
    if (!desktop || reducedMotion.matches || !("IntersectionObserver" in window)) {
      const openIndex = phases.findIndex((phase) => phase.classList.contains("is-open"));
      setActive(openIndex >= 0 ? openIndex : 0);
      return;
    }

    observer = new IntersectionObserver((entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (!visible) return;
      const index = phases.indexOf(visible.target);
      if (index >= 0) setActive(index);
    }, {
      root: null,
      rootMargin: "-34% 0px -42% 0px",
      threshold: [0.05, 0.25, 0.5, 0.75],
    });

    phases.forEach((phase) => observer.observe(phase));
  };

  const media = window.matchMedia(DESKTOP_QUERY);
  media.addEventListener?.("change", configureObserver);
  reducedMotion.addEventListener?.("change", configureObserver);
  setActive(0);
  configureObserver();
}

export function watchDeliveryTimeline() {
  initialiseDeliveryTimeline();
  if (document.querySelector(".service-delivery-timeline")) return;
  const observer = new MutationObserver(() => {
    if (!document.querySelector(".service-delivery-timeline")) return;
    initialiseDeliveryTimeline();
    observer.disconnect();
  });
  observer.observe(document.body, { childList: true, subtree: true });
}
