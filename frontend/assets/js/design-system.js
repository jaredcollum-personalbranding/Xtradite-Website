(() => {
  "use strict";

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
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
    const items = Array.from(list.querySelectorAll(":scope > .faq-item"));

    const setOpen = (target, open) => {
      items.forEach((item) => {
        const button = item.querySelector(":scope > .faq-question");
        const panel = item.querySelector(":scope > .faq-answer");
        const active = item === target && open;
        item.classList.toggle("open", active);
        button?.setAttribute("aria-expanded", String(active));
        panel?.setAttribute("aria-hidden", String(!active));
      });
    };

    items.forEach((item, index) => {
      const original = item.querySelector(":scope > .faq-question");
      const panel = item.querySelector(":scope > .faq-answer");
      if (!original || !panel) return;

      const number = String(index + 1).padStart(2, "0");
      const buttonId = original.id || `faq-question-${Math.random().toString(36).slice(2, 9)}`;
      const panelId = panel.id || `${buttonId}-answer`;
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

      button.addEventListener("click", () => setOpen(item, !item.classList.contains("open")));
    });
  }

  function normaliseTabs(tablist) {
    if (!tablist || tablist.dataset.tabSystem === "true") return;
    tablist.dataset.tabSystem = "true";
    const tabs = Array.from(tablist.querySelectorAll('[role="tab"]'));
    if (!tabs.length) return;

    const activate = (index, moveFocus = false) => {
      tabs.forEach((tab, tabIndex) => {
        const active = index === tabIndex;
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
    };

    let selected = tabs.findIndex((tab) => tab.getAttribute("aria-selected") === "true");
    if (selected < 0) selected = 0;
    activate(selected);

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
      activate(next, true);
    });
  }

  function hardenMegaMenu() {
    const header = document.getElementById("site-header");
    const nav = document.getElementById("site-nav");
    if (!header || !nav || nav.dataset.layeringReady === "true") return;
    nav.dataset.layeringReady = "true";
    header.classList.add("has-layered-navigation");

    document.addEventListener("keydown", (event) => {
      if (event.key !== "Escape") return;
      nav.querySelectorAll(".mega-nav-item.is-open").forEach((item) => {
        item.classList.remove("is-open");
        item.querySelector(":scope > .mega-nav-trigger")?.setAttribute("aria-expanded", "false");
        item.querySelector(":scope > .mega-menu-panel")?.setAttribute("aria-hidden", "true");
      });
    });
  }

  function prepare(root = document) {
    root.querySelectorAll?.(".faq-list").forEach(upgradeFaqList);
    root.querySelectorAll?.('[role="tablist"]').forEach(normaliseTabs);
    hardenMegaMenu();
  }

  prepare();
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => mutation.addedNodes.forEach((node) => {
      if (node instanceof Element) prepare(node.matches(".faq-list,[role=tablist]") ? node.parentElement : node);
    }));
  });
  observer.observe(document.body, { childList: true, subtree: true });
})();
