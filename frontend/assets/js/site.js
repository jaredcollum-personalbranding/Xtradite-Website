/**
 * Shared page chrome behaviour — global navigation, responsive menu controls,
 * enquiry loading, testimonials, FAQs, statistic counters and icon rendering.
 * Plain script: safe to load before page-specific modules on every route.
 */
(function () {
  "use strict";

  const currentScript = document.currentScript;
  const scriptBase = currentScript && currentScript.src
    ? new URL(".", currentScript.src)
    : new URL("/assets/js/", window.location.origin);

  const BRAND_LOGOS = {
    dark: "https://bmhkdyshluiloorgnwoy.supabase.co/storage/v1/object/public/rich-media/Branding/XD-logo-nbg.png",
    light: "https://bmhkdyshluiloorgnwoy.supabase.co/storage/v1/object/public/rich-media/Branding/XD-logo-nbg.png",
    transparent: "https://bmhkdyshluiloorgnwoy.supabase.co/storage/v1/object/public/rich-media/Branding/XD-logo-nbg.png",
  };

  const SUPABASE_URL = "https://bmhkdyshluiloorgnwoy.supabase.co";
  const SUPABASE_ANON_KEY = "sb_publishable_Aj9nCJLFY9aMycZeQ3buTQ_-n-Q7SFK";
  const MENU_CACHE_KEY = "xtradite-global-menu-v2";
  const MENU_CACHE_TTL = 30 * 60 * 1000;
  const DESKTOP_QUERY = "(min-width: 1151px)";

  const FALLBACK_SERVICES = [
    { slug: "ai-automation", title: "AI & Automation", summary: "Practical AI and workflow automation that removes manual bottlenecks." },
    { slug: "digital-strategy", title: "Digital Strategy", summary: "Commercially grounded strategy connected to delivery and measurable outcomes." },
    { slug: "ecommerce-growth", title: "eCommerce Growth", summary: "Conversion, retention and merchandising improvements built around profitable growth." },
    { slug: "operational-excellence", title: "Operational Excellence", summary: "Lean operating models, clearer controls and more dependable execution." },
    { slug: "fractional-leadership", title: "Fractional Leadership", summary: "Senior digital and operational ownership without a permanent executive hire." },
    { slug: "project-delivery", title: "Project Delivery", summary: "Hands-on mobilisation and delivery of complex digital change." },
    { slug: "shopify-migration", title: "Shopify Migration", summary: "A structured migration programme that preserves what matters and rebuilds what does not." },
  ];

  const FALLBACK_INDUSTRIES = [
    { slug: "retail", title: "Retail", summary: "Connected customer, commercial and operational improvement." },
    { slug: "ecommerce", title: "eCommerce", summary: "Profitable growth across acquisition, conversion and retention." },
    { slug: "manufacturing", title: "Manufacturing", summary: "Operational visibility, automation and scalable delivery." },
    { slug: "consumer-goods", title: "Consumer Goods", summary: "Stronger digital operations across brands, channels and markets." },
    { slug: "professional-services", title: "Professional Services", summary: "Clearer delivery, leadership and commercial systems." },
    { slug: "startups", title: "Startups & Scale-ups", summary: "Practical operating structure for fast-moving teams." },
  ];

  function loadStylesheet(datasetName, href) {
    if (document.querySelector(`link[data-${datasetName}]`)) return;
    const stylesheet = document.createElement("link");
    stylesheet.rel = "stylesheet";
    stylesheet.setAttribute(`data-${datasetName}`, "true");
    stylesheet.href = new URL(href, scriptBase).href;
    document.head.appendChild(stylesheet);
  }

  loadStylesheet("xtradite-brand-logo-css", "../css/brand-logo.css?v=20260713-4");
  loadStylesheet("xtradite-mobile-css", "../css/mobile.css");
  loadStylesheet("xtradite-tabs-css", "../css/tabs.css?v=20260713-1");
  loadStylesheet("xtradite-mega-menu-css", "../css/mega-menu.css?v=20260714-1");
  loadStylesheet("xtradite-enquiry-css", "../css/enquiry.css");
  loadStylesheet("xtradite-jam-refinement-css", "../css/jam-refinement.css?v=20260714-1");

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function repairKnownMojibake(root = document) {
    root.querySelectorAll?.(".stat-number").forEach((element) => {
      if (element.textContent?.includes("Â£")) element.textContent = element.textContent.replaceAll("Â£", "£");
      const target = element.getAttribute("data-count-to");
      if (target?.includes("Â£")) element.setAttribute("data-count-to", target.replaceAll("Â£", "£"));
    });
  }

  function linkedInSvg() {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("aria-hidden", "true");
    svg.setAttribute("focusable", "false");
    svg.setAttribute("fill", "none");
    svg.setAttribute("stroke", "currentColor");
    svg.setAttribute("stroke-width", "2");
    svg.setAttribute("stroke-linecap", "round");
    svg.setAttribute("stroke-linejoin", "round");
    svg.classList.add("lucide", "lucide-linkedin", "xtradite-brand-icon");
    svg.innerHTML = '<path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6z"></path><rect width="4" height="12" x="2" y="9"></rect><circle cx="4" cy="4" r="2"></circle>';
    return svg;
  }

  function replaceUnsupportedBrandIcons(root = document) {
    root.querySelectorAll?.('i[data-lucide="linkedin"]').forEach((icon) => icon.replaceWith(linkedInSvg()));
  }

  function installLucideGuard() {
    if (!window.lucide || typeof window.lucide.createIcons !== "function" || window.lucide.__xtraditeGuarded) return;
    const nativeCreateIcons = window.lucide.createIcons.bind(window.lucide);
    window.lucide.createIcons = (...args) => {
      replaceUnsupportedBrandIcons(document);
      return nativeCreateIcons(...args);
    };
    window.lucide.__xtraditeGuarded = true;
  }

  function renderIcons() {
    installLucideGuard();
    replaceUnsupportedBrandIcons(document);
    if (window.lucide?.createIcons) window.lucide.createIcons();
  }

  installLucideGuard();
  repairKnownMojibake();
  replaceUnsupportedBrandIcons();

  function applyBrandLogos(root = document) {
    root.querySelectorAll?.("img.logo-img").forEach((image) => {
      const inFooter = Boolean(image.closest(".site-footer"));
      const inHeader = Boolean(image.closest(".site-header"));
      image.src = inFooter ? BRAND_LOGOS.light : inHeader ? BRAND_LOGOS.dark : BRAND_LOGOS.transparent;
      image.alt = "Xtradite Digital";
      image.width = inFooter ? 132 : 120;
      image.height = inFooter ? 132 : 120;
      image.decoding = "async";
    });

    root.querySelectorAll?.('script[type="application/ld+json"]').forEach((script) => {
      try {
        const data = JSON.parse(script.textContent || "{}");
        const records = Array.isArray(data) ? data : [data];
        let changed = false;
        records.forEach((record) => {
          if (record && ["Organization", "LocalBusiness", "ProfessionalService"].includes(record["@type"])) {
            record.logo = BRAND_LOGOS.transparent;
            changed = true;
          }
          if (record?.provider?.["@type"] === "Organization") {
            record.provider.logo = BRAND_LOGOS.transparent;
            changed = true;
          }
        });
        if (changed) script.textContent = JSON.stringify(Array.isArray(data) ? records : records[0]);
      } catch (_) {
        // Ignore malformed or non-object JSON-LD blocks.
      }
    });
  }

  applyBrandLogos();

  const chromeObserver = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (!(node instanceof Element)) return;
        applyBrandLogos(node.matches("img.logo-img") ? node.parentElement : node);
        repairKnownMojibake(node);
        replaceUnsupportedBrandIcons(node);
      });
    });
  });
  chromeObserver.observe(document.documentElement, { childList: true, subtree: true });

  function currentMenuState() {
    const path = window.location.pathname.replace(/\/+$/, "") || "/";
    const params = new URLSearchParams(window.location.search);
    return {
      path,
      slug: params.get("slug") || "",
      home: path === "/",
      about: path === "/about",
      whatWeDo:
        path === "/services" ||
        path.startsWith("/services/") ||
        path === "/service-detail" ||
        path === "/industries" ||
        path === "/industry-detail" ||
        path === "/locations" ||
        path.startsWith("/uk/"),
      projectInsights:
        path === "/case-studies" ||
        path === "/case-study-detail" ||
        path === "/insights" ||
        path === "/insights-post",
      contact: path === "/contact",
    };
  }

  function activeClass(active) {
    return active ? " active" : "";
  }

  function currentAttribute(active) {
    return active ? ' aria-current="page"' : "";
  }

  function serviceEntry(item, state) {
    const active = state.path === `/services/${item.slug}` || (state.path === "/service-detail" && state.slug === item.slug);
    return `<a class="mega-menu-entry${activeClass(active)}" href="/services/${encodeURIComponent(item.slug)}"${currentAttribute(active)}>
      <span class="mega-menu-entry-title">${escapeHtml(item.title)}</span>
      ${item.summary ? `<span class="mega-menu-entry-copy">${escapeHtml(item.summary)}</span>` : ""}
    </a>`;
  }

  function industryEntry(item, state) {
    const active = state.path === "/industry-detail" && state.slug === item.slug;
    return `<a class="mega-menu-entry mega-menu-entry--compact${activeClass(active)}" href="/industry-detail?slug=${encodeURIComponent(item.slug)}"${currentAttribute(active)}>
      <span class="mega-menu-entry-title">${escapeHtml(item.title)}</span>
      ${item.summary ? `<span class="mega-menu-entry-copy">${escapeHtml(item.summary)}</span>` : ""}
    </a>`;
  }

  function renderGlobalNavigation(services = FALLBACK_SERVICES, industries = FALLBACK_INDUSTRIES) {
    const nav = document.getElementById("site-nav");
    if (!nav) return;

    const state = currentMenuState();
    nav.className = "site-nav mega-nav";
    nav.setAttribute("aria-label", "Primary navigation");
    nav.innerHTML = `
      <a class="mega-nav-link${activeClass(state.home)}" href="/"${currentAttribute(state.home)}>Home</a>
      <a class="mega-nav-link${activeClass(state.about)}" href="/about"${currentAttribute(state.about)}>About</a>

      <div class="mega-nav-item mega-nav-item--what-we-do${activeClass(state.whatWeDo)}">
        <button class="mega-nav-trigger" type="button" aria-expanded="false" aria-controls="mega-menu-what-we-do">
          <span>What We Do</span><span class="mega-nav-chevron" aria-hidden="true"></span>
        </button>
        <div class="mega-menu-panel mega-menu-panel--what-we-do" id="mega-menu-what-we-do" aria-hidden="true">
          <div class="mega-menu-intro">
            <span class="mega-menu-kicker">Capabilities</span>
            <h2>Commercial thinking connected to implementation.</h2>
            <p>Choose a core service or browse the sectors where the work is most frequently applied.</p>
          </div>
          <div class="mega-menu-columns">
            <section class="mega-menu-column mega-menu-column--services">
              <div class="mega-menu-column-head">
                <div><span>Services</span><small>How we help</small></div>
                <a href="/services">View all services <span aria-hidden="true">→</span></a>
              </div>
              <div class="mega-menu-list mega-menu-list--services">${services.map((item) => serviceEntry(item, state)).join("")}</div>
            </section>
            <section class="mega-menu-column mega-menu-column--industries">
              <div class="mega-menu-column-head">
                <div><span>Industries</span><small>Where we work</small></div>
                <a href="/industries">View all industries <span aria-hidden="true">→</span></a>
              </div>
              <div class="mega-menu-list mega-menu-list--industries">${industries.map((item) => industryEntry(item, state)).join("")}</div>
            </section>
          </div>
        </div>
      </div>

      <div class="mega-nav-item mega-nav-item--insights${activeClass(state.projectInsights)}">
        <button class="mega-nav-trigger" type="button" aria-expanded="false" aria-controls="mega-menu-project-insights">
          <span>Project Insights</span><span class="mega-nav-chevron" aria-hidden="true"></span>
        </button>
        <div class="mega-menu-panel mega-menu-panel--insights" id="mega-menu-project-insights" aria-hidden="true">
          <div class="mega-menu-intro mega-menu-intro--compact">
            <span class="mega-menu-kicker">Evidence & thinking</span>
            <h2>See the work, then understand the thinking behind it.</h2>
          </div>
          <div class="mega-insight-links">
            <a href="/case-studies"${currentAttribute(state.path === "/case-studies" || state.path === "/case-study-detail")}>
              <span class="mega-insight-index">01</span><strong>Case Studies</strong>
              <small>Delivery stories, commercial outcomes and practical evidence.</small>
              <span class="mega-insight-arrow" aria-hidden="true">→</span>
            </a>
            <a href="/insights"${currentAttribute(state.path === "/insights" || state.path === "/insights-post")}>
              <span class="mega-insight-index">02</span><strong>Insights</strong>
              <small>Analysis on growth, operations, technology and leadership.</small>
              <span class="mega-insight-arrow" aria-hidden="true">→</span>
            </a>
          </div>
        </div>
      </div>

      <a class="mega-nav-link mega-nav-contact${activeClass(state.contact)}" href="/contact"${currentAttribute(state.contact)}>Contact Us</a>`;

    document.querySelectorAll(".header-cta").forEach((cta) => cta.remove());
    wireMegaNavigation(nav);
    renderIcons();
  }

  function setMegaMenuOpen(item, open) {
    if (!item) return;
    const trigger = item.querySelector(":scope > .mega-nav-trigger");
    const panel = item.querySelector(":scope > .mega-menu-panel");
    item.classList.toggle("is-open", open);
    trigger?.setAttribute("aria-expanded", String(open));
    panel?.setAttribute("aria-hidden", String(!open));
  }

  function wireMegaNavigation(nav) {
    const items = Array.from(nav.querySelectorAll(".mega-nav-item"));
    const toggle = document.getElementById("nav-toggle");
    const timers = new WeakMap();

    const cancelTimer = (item) => {
      const timer = timers.get(item);
      if (timer) window.clearTimeout(timer);
      timers.delete(item);
    };

    const closeMenus = (except = null) => {
      items.forEach((item) => {
        cancelTimer(item);
        if (item !== except) setMegaMenuOpen(item, false);
      });
    };

    const openAfter = (item, delay = 80) => {
      cancelTimer(item);
      timers.set(item, window.setTimeout(() => {
        closeMenus(item);
        setMegaMenuOpen(item, true);
      }, delay));
    };

    const closeAfter = (item, delay = 180) => {
      cancelTimer(item);
      timers.set(item, window.setTimeout(() => setMegaMenuOpen(item, false), delay));
    };

    items.forEach((item) => {
      const trigger = item.querySelector(":scope > .mega-nav-trigger");
      const panel = item.querySelector(":scope > .mega-menu-panel");
      if (!trigger || !panel) return;

      trigger.addEventListener("click", () => {
        const open = !item.classList.contains("is-open");
        closeMenus(item);
        setMegaMenuOpen(item, open);
      });

      trigger.addEventListener("keydown", (event) => {
        if (event.key === "ArrowDown") {
          event.preventDefault();
          closeMenus(item);
          setMegaMenuOpen(item, true);
          panel.querySelector("a")?.focus();
        } else if (event.key === "Escape") {
          event.preventDefault();
          setMegaMenuOpen(item, false);
        }
      });

      panel.addEventListener("keydown", (event) => {
        if (event.key !== "Escape") return;
        event.preventDefault();
        setMegaMenuOpen(item, false);
        trigger.focus();
      });

      item.addEventListener("pointerenter", () => {
        if (window.matchMedia(DESKTOP_QUERY).matches) openAfter(item);
      });
      item.addEventListener("pointerleave", () => {
        if (window.matchMedia(DESKTOP_QUERY).matches) closeAfter(item);
      });
      item.addEventListener("focusin", () => {
        if (!window.matchMedia(DESKTOP_QUERY).matches) return;
        cancelTimer(item);
        closeMenus(item);
        setMegaMenuOpen(item, true);
      });
      item.addEventListener("focusout", () => {
        window.setTimeout(() => {
          if (!item.contains(document.activeElement)) setMegaMenuOpen(item, false);
        }, 0);
      });
    });

    nav.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        closeMenus();
        nav.classList.remove("open");
        toggle?.classList.remove("open");
        toggle?.setAttribute("aria-expanded", "false");
      });
    });

    document.addEventListener("click", (event) => {
      if (!nav.contains(event.target)) closeMenus();
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") closeMenus();
    });
  }

  function readCachedMenu() {
    try {
      const cached = JSON.parse(sessionStorage.getItem(MENU_CACHE_KEY) || "null");
      if (!cached || Date.now() - cached.savedAt > MENU_CACHE_TTL) return null;
      if (!Array.isArray(cached.services) || !Array.isArray(cached.industries)) return null;
      return cached;
    } catch (_) {
      return null;
    }
  }

  function writeCachedMenu(services, industries) {
    try {
      sessionStorage.setItem(MENU_CACHE_KEY, JSON.stringify({ savedAt: Date.now(), services, industries }));
    } catch (_) {
      // Navigation still works through the in-memory fallback.
    }
  }

  async function fetchMenuCollection(view, fields) {
    const url = `${SUPABASE_URL}/rest/v1/${view}?select=${encodeURIComponent(fields)}&order=sort_order.asc`;
    const response = await fetch(url, {
      headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
    });
    if (!response.ok) throw new Error(`Navigation content request failed: ${response.status}`);
    return response.json();
  }

  async function refreshGlobalNavigation() {
    const cached = readCachedMenu();
    if (cached) {
      renderGlobalNavigation(cached.services, cached.industries);
      return;
    }

    try {
      const [services, industries] = await Promise.all([
        fetchMenuCollection("services_delivery", "slug,title,summary,sort_order"),
        fetchMenuCollection("industries_delivery", "slug,title,summary,sort_order"),
      ]);
      const publishedServices = services.filter((item) => item.slug && item.title);
      const publishedIndustries = industries.filter((item) => item.slug && item.title);
      if (!publishedServices.length || !publishedIndustries.length) return;
      writeCachedMenu(publishedServices, publishedIndustries);
      renderGlobalNavigation(publishedServices, publishedIndustries);
    } catch (error) {
      console.warn("Global navigation is using its built-in content fallback.", error);
    }
  }

  renderGlobalNavigation();
  refreshGlobalNavigation();

  if (!window.__xtraditeEnquiryLoading) {
    window.__xtraditeEnquiryLoading = true;
    const enquiryScript = document.createElement("script");
    enquiryScript.type = "module";
    enquiryScript.src = new URL("enquiry.js", scriptBase).href;
    document.body.appendChild(enquiryScript);
  }

  const header = document.getElementById("site-header");
  if (header) {
    const onScroll = () => header.classList.toggle("scrolled", window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  const toggle = document.getElementById("nav-toggle");
  const nav = document.getElementById("site-nav");
  if (toggle && nav) {
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-controls", "site-nav");
    toggle.addEventListener("click", () => {
      const open = !nav.classList.contains("open");
      toggle.classList.toggle("open", open);
      nav.classList.toggle("open", open);
      toggle.setAttribute("aria-expanded", String(open));
      if (!open) nav.querySelectorAll(".mega-nav-item.is-open").forEach((item) => setMegaMenuOpen(item, false));
    });
  }

  document.querySelectorAll("[data-cookie-settings]").forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      if (window.CookieConsent && typeof window.CookieConsent.renew === "function") window.CookieConsent.renew();
    });
  });

  document.querySelectorAll(".testimonial-slider").forEach((slider) => {
    const slides = Array.from(slider.querySelectorAll(".testimonial-slide"));
    const dotsWrap = slider.querySelector(".testimonial-dots");
    if (!slides.length) return;
    let active = 0;
    let timer = null;
    let userPaused = false;

    const show = (index) => {
      active = (index + slides.length) % slides.length;
      slides.forEach((slide, slideIndex) => slide.classList.toggle("active", slideIndex === active));
      if (dotsWrap) Array.from(dotsWrap.children).forEach((dot, dotIndex) => dot.classList.toggle("active", dotIndex === active));
    };

    const stop = () => {
      if (timer) window.clearInterval(timer);
      timer = null;
    };

    const start = () => {
      stop();
      if (userPaused || slides.length < 2 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      timer = window.setInterval(() => show(active + 1), 6000);
    };

    show(0);
    if (dotsWrap) {
      dotsWrap.innerHTML = "";
      slides.forEach((_, index) => {
        const dot = document.createElement("button");
        dot.type = "button";
        dot.setAttribute("aria-label", `Show testimonial ${index + 1}`);
        dot.addEventListener("click", () => {
          userPaused = true;
          stop();
          show(index);
        });
        dotsWrap.appendChild(dot);
      });
      show(0);
    }
    slider.addEventListener("focusin", stop);
    slider.addEventListener("pointerenter", stop);
    slider.addEventListener("pointerleave", start);
    start();
  });

  document.querySelectorAll(".faq-item").forEach((item) => {
    const question = item.querySelector(".faq-question");
    if (!question || question.dataset.faqReady === "true") return;
    question.dataset.faqReady = "true";
    question.setAttribute("aria-expanded", String(item.classList.contains("open")));
    question.addEventListener("click", () => {
      const wasOpen = item.classList.contains("open");
      item.parentElement.querySelectorAll(".faq-item").forEach((sibling) => {
        sibling.classList.remove("open");
        sibling.querySelector(".faq-question")?.setAttribute("aria-expanded", "false");
      });
      if (!wasOpen) {
        item.classList.add("open");
        question.setAttribute("aria-expanded", "true");
      }
    });
  });

  const counters = document.querySelectorAll(".stat-number[data-count-to]");
  if (counters.length && "IntersectionObserver" in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        animateCount(entry.target);
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.4 });
    counters.forEach((counter) => observer.observe(counter));
  }

  function animateCount(element) {
    const target = element.getAttribute("data-count-to") || "";
    const match = target.match(/^([^\d]*)(\d+(?:\.\d+)?)(.*)$/);
    if (!match || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      element.textContent = target;
      return;
    }
    const [, prefix, numString, suffix] = match;
    const end = Number.parseFloat(numString);
    const decimals = (numString.split(".")[1] || "").length;
    const startTime = performance.now();
    const tick = (now) => {
      const progress = Math.min((now - startTime) / 1200, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      element.textContent = `${prefix}${(end * eased).toFixed(decimals)}${suffix}`;
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  renderIcons();
  document.addEventListener("lucide:ready", renderIcons, { once: true });
})();
