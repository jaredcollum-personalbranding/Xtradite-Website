(function () {
  "use strict";

  const nav = document.getElementById("site-nav");
  if (!nav || nav.dataset.statePreserver === "true") return;
  nav.dataset.statePreserver = "true";

  let activeControls = "";

  function triggerForControls(controls) {
    if (!controls) return null;
    return Array.from(nav.querySelectorAll(".mega-nav-trigger"))
      .find((trigger) => trigger.getAttribute("aria-controls") === controls) || null;
  }

  function restoreOpenMenu() {
    const trigger = triggerForControls(activeControls);
    if (!trigger) return;
    const item = trigger.closest(".mega-nav-item");
    const panel = item?.querySelector(":scope > .mega-menu-panel");
    if (!item || !panel) return;
    item.classList.add("is-open");
    trigger.setAttribute("aria-expanded", "true");
    panel.setAttribute("aria-hidden", "false");
  }

  document.addEventListener("click", (event) => {
    const trigger = event.target instanceof Element ? event.target.closest(".mega-nav-trigger") : null;
    if (trigger && nav.contains(trigger)) {
      activeControls = trigger.getAttribute("aria-controls") || "";
      window.setTimeout(() => {
        const current = triggerForControls(activeControls);
        if (!current || current.getAttribute("aria-expanded") !== "true") activeControls = "";
      }, 0);
      return;
    }

    if (!(event.target instanceof Node) || !nav.contains(event.target)) {
      window.setTimeout(() => { activeControls = ""; }, 0);
    }
  }, true);

  document.addEventListener("focusin", (event) => {
    const item = event.target instanceof Element ? event.target.closest(".mega-nav-item") : null;
    const trigger = item?.querySelector(":scope > .mega-nav-trigger");
    if (trigger && nav.contains(trigger)) activeControls = trigger.getAttribute("aria-controls") || "";
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") activeControls = "";
  });

  const observer = new MutationObserver((mutations) => {
    if (!activeControls || !mutations.some((mutation) => mutation.type === "childList")) return;
    restoreOpenMenu();
  });
  observer.observe(nav, { childList: true, subtree: false });
})();
