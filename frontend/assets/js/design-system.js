(() => {
  "use strict";

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const desktopNavigation = window.matchMedia("(min-width: 1151px)");
  document.documentElement.classList.toggle("reduced-motion", reducedMotion.matches);
  reducedMotion.addEventListener?.("change", (event) => {
    document.documentElement.classList.toggle("reduced-motion", event.matches);
  });

  function plainText(element) {
    return Array.from(element.childNodes)
      .filter((node) => node.nodeType === Node.TEXT_NODE)
      .map((node) => node.textContent.trim())
      .filter(Boolean)
      .join(" ") || element.querySelector(".faq-label")?.textContent?.trim() || "Question";
  }

  function upgradeFaqList(list) {
    if (!list || list.dataset.faqSystem === "true") return;
    list.dataset.faqSystem = "true";
    if (!list.id) list.id = `faq-list-${Math.random().toString(36).slice(2, 9)}`;
    const items = Array.from(list.querySelectorAll(":scope > .faq-item"));
    const buttons = [];

    const setOpen = (target, open) => {
      items.forEach((item) => {
        const button = item.querySelector(":scope > .faq-question");
        const panel = item.querySelector(":scope > .faq-answer");
        const active = item === target && open;
        item.classList.toggle("open", active);
        button?.setAttribute("aria-expanded", String(active));
        panel?.setAttribute("aria-hidden", String(!active));
        panel?.toggleAttribute("inert", !active);
      });
    };

    items.forEach((item, index) => {
      const original = item.querySelector(":scope > .faq-question");
      const panel = item.querySelector(":scope > .faq-answer");
      if (!original || !panel) return;

      const number = String(index + 1).padStart(2, "0");
      const buttonId = original.id || `${list.id}-question-${index + 1}`;
      const panelId = panel.id || `${list.id}-answer-${index + 1}`;
      const button = original.cloneNode(false);
      button.className = original.className;
      button.type = "button";
      button.id = buttonId;
      button.dataset.faqReady = "true";
      button.setAttribute("aria-controls", panelId);
      button.setAttribute("aria-expanded", String(item.classList.contains("open")));
      button.innerHTML = `<span class="faq-number" aria-hidden="true">${number}</span><span class="faq-label"></span><span class="faq-symbol" aria-hidden="true"><i></i><i></i></span>`;
      button.querySelector(".faq-label").textContent = plainText(original);
      original.replaceWith(button);

      panel.id = panelId;
      panel.setAttribute("role", "region");
      panel.setAttribute("aria-labelledby", buttonId);
      panel.setAttribute("aria-hidden", String(!item.classList.contains("open")));
      panel.toggleAttribute("inert", !item.classList.contains("open"));

      button.addEventListener("click", () => setOpen(item, !item.classList.contains("open")));
      button.addEventListener("keydown", (event) => {
        const current = buttons.indexOf(button);
        let next = current;
        if (event.key === "ArrowDown") next = (current + 1) % items.length;
        else if (event.key === "ArrowUp") next = (current - 1 + items.length) % items.length;
        else if (event.key === "Home") next = 0;
        else if (event.key === "End") next = items.length - 1;
        else return;
        event.preventDefault();
        buttons[next]?.focus();
      });
      buttons.push(button);
    });
  }

  function normaliseTabs(tablist) {
    if (!tablist || tablist.dataset.tabSystem === "true") return;
    if (tablist.matches(".service-v3-engagement-tabs")) {
      tablist.dataset.tabSystem = "local";
      return;
    }
    tablist.dataset.tabSystem = "true";
    const tabs = Array.from(tablist.querySelectorAll('[role="tab"]'));
    if (!tabs.length) return;
    if (!tablist.hasAttribute("aria-orientation")) tablist.setAttribute("aria-orientation", "horizontal");

    const activate = (index, moveFocus = false, userInitiated = false) => {
      tabs.forEach((tab, tabIndex) => {
        const active = index === tabIndex;
        if (tab instanceof HTMLButtonElement) tab.type = "button";
        tab.setAttribute("aria-selected", String(active));
        tab.tabIndex = active ? 0 : -1;
        const panel = document.getElementById(tab.getAttribute("aria-controls") || "");
        if (panel) {
          panel.hidden = !active;
          panel.toggleAttribute("inert", !active);
          panel.setAttribute("aria-hidden", String(!active));
        }
      });
      if (moveFocus) tabs[index]?.focus();
      if (userInitiated) {
        tablist.dispatchEvent(new CustomEvent("xtradite:tabchange", { bubbles: true, detail: { index, tab: tabs[index] } }));
      }
    };

    let selected = tabs.findIndex((tab) => tab.getAttribute("aria-selected") === "true");
    if (selected < 0) selected = 0;
    activate(selected);

    tabs.forEach((tab, index) => {
      tab.addEventListener("click", () => activate(index, false, true));
    });

    tablist.addEventListener("keydown", (event) => {
      const current = tabs.indexOf(document.activeElement);
      if (current < 0) return;
      let next = current;
      if (event.key === "ArrowRight" || event.key === "ArrowDown") next = (current + 1) % tabs.length;
      else if (event.key === "ArrowLeft" || event.key === "ArrowUp") next = (current - 1 + tabs.length) % tabs.length;
      else if (event.key === "Home") next = 0;
      else if (event.key === "End") next = tabs.length - 1;
      else return;
      event.preventDefault();
      activate(next, true, true);
    });
  }

  function syncMegaPanelInert(root = document) {
    const panels = [];
    if (root instanceof Element && root.matches(".mega-menu-panel")) panels.push(root);
    root.querySelectorAll?.(".mega-menu-panel").forEach((panel) => panels.push(panel));
    panels.forEach((panel) => panel.toggleAttribute("inert", panel.getAttribute("aria-hidden") !== "false"));
  }

  function syncMobileNavigation(nav) {
    if (!(nav instanceof HTMLElement)) return;
    if (desktopNavigation.matches) {
      nav.removeAttribute("inert");
      nav.removeAttribute("aria-hidden");
      return;
    }
    const open = nav.classList.contains("open");
    nav.toggleAttribute("inert", !open);
    nav.setAttribute("aria-hidden", String(!open));
  }

  function hardenMobileNavigation() {
    const nav = document.getElementById("site-nav");
    const toggle = document.getElementById("nav-toggle");
    if (!nav || !toggle || nav.dataset.mobileAccessibilityReady === "true") return;
    nav.dataset.mobileAccessibilityReady = "true";
    syncMobileNavigation(nav);
    toggle.addEventListener("click", () => requestAnimationFrame(() => syncMobileNavigation(nav)));
    desktopNavigation.addEventListener?.("change", () => syncMobileNavigation(nav));
    const classObserver = new MutationObserver(() => syncMobileNavigation(nav));
    classObserver.observe(nav, { attributes: true, attributeFilter: ["class"] });
  }

  function setMegaItemOpen(item, open) {
    const trigger = item?.querySelector(":scope > .mega-nav-trigger");
    const panel = item?.querySelector(":scope > .mega-menu-panel");
    item?.classList.toggle("is-open", open);
    trigger?.setAttribute("aria-expanded", String(open));
    panel?.setAttribute("aria-hidden", String(!open));
    panel?.toggleAttribute("inert", !open);
  }

  function closeMegaItem(item, returnFocus = false) {
    if (!item) return;
    const trigger = item.querySelector(":scope > .mega-nav-trigger");
    setMegaItemOpen(item, false);
    if (!returnFocus || !trigger) return;
    item.dataset.suppressFocusOpen = "true";
    trigger.focus();
    requestAnimationFrame(() => {
      setMegaItemOpen(item, false);
      delete item.dataset.suppressFocusOpen;
    });
  }

  function hardenMegaMenu() {
    const header = document.getElementById("site-header");
    const nav = document.getElementById("site-nav");
    if (!header || !nav || nav.dataset.layeringReady === "true") return;
    nav.dataset.layeringReady = "true";
    header.classList.add("has-layered-navigation");
    syncMegaPanelInert(nav);

    const panelObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => syncMegaPanelInert(mutation.target));
    });
    panelObserver.observe(nav, { attributes: true, attributeFilter: ["aria-hidden"], subtree: true });

    nav.addEventListener("focusin", (event) => {
      const item = event.target.closest(".mega-nav-item");
      if (!item || item.dataset.suppressFocusOpen !== "true") return;
      event.stopImmediatePropagation();
      setMegaItemOpen(item, false);
    }, true);

    nav.addEventListener("click", (event) => {
      const trigger = event.target.closest(".mega-nav-trigger");
      if (!trigger || !desktopNavigation.matches) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      const item = trigger.closest(".mega-nav-item");
      nav.querySelectorAll(".mega-nav-item.is-open").forEach((openItem) => {
        if (openItem !== item) closeMegaItem(openItem);
      });
      setMegaItemOpen(item, true);
    }, true);

    document.addEventListener("keydown", (event) => {
      if (event.key !== "Escape") return;
      const openItems = Array.from(nav.querySelectorAll(".mega-nav-item.is-open"));
      openItems.forEach((item, index) => closeMegaItem(item, index === openItems.length - 1));
    });

    nav.addEventListener("focusout", () => requestAnimationFrame(() => {
      if (nav.contains(document.activeElement)) return;
      nav.querySelectorAll(".mega-nav-item.is-open").forEach((item) => closeMegaItem(item));
    }));
  }

  function prepare(root = document) {
    root.querySelectorAll?.(".faq-list").forEach(upgradeFaqList);
    root.querySelectorAll?.('[role="tablist"]').forEach(normaliseTabs);
    syncMegaPanelInert(root);
    hardenMobileNavigation();
    hardenMegaMenu();
  }

  prepare();
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => mutation.addedNodes.forEach((node) => {
      if (node instanceof Element) prepare(node.matches(".faq-list,[role=tablist],.mega-menu-panel") ? node.parentElement : node);
    }));
  });
  observer.observe(document.body, { childList: true, subtree: true });
})();
