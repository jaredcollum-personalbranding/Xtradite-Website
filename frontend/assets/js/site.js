/**
 * Shared page chrome behavior — header navigation, scroll state, mobile nav toggle,
 * testimonial slider, FAQ accordion and stat counter animation. Plain script (no
 * imports), safe to load on every page before page-specific module scripts.
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
  const MENU_CACHE_KEY = "xtradite-global-menu-v1";
  const MENU_CACHE_TTL = 30 * 60 * 1000;

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

  function applyBrandLogos(root = document) {
    root.querySelectorAll("img.logo-img").forEach((image) => {
      const inFooter = Boolean(image.closest(".site-footer"));
      const inHeader = Boolean(image.closest(".site-header"));
      image.src = inFooter
        ? BRAND_LOGOS.light
        : inHeader
          ? BRAND_LOGOS.dark
          : BRAND_LOGOS.transparent;
      image.alt = "Xtradite Digital";
      image.width = inFooter ? 132 : 120;
      image.height = inFooter ? 132 : 120;
      image.decoding = "async";
    });

    root.querySelectorAll('script[type="application/ld+json"]').forEach((script) => {
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

  const logoObserver = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (!(node instanceof Element)) return;
        if (node.matches("img.logo-img") || node.querySelector("img.logo-img")) {
          applyBrandLogos(node.matches("img.logo-img") ? node.parentElement : node);
        }
      });
    });
  });
  logoObserver.observe(document.documentElement, { childList: true, subtree: true });

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

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
        <div class="mega-menu-panel mega-menu-panel--what-we-do" id="mega-menu-what-we-do">
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
              <div class="mega-menu-list mega-menu-list--services">
                ${services.map((item) => serviceEntry(item, state)).join("")}
              </div>
            </section>
            <section class="mega-menu-column mega-menu-column--industries">
              <div class="mega-menu-column-head">
                <div><span>Industries</span><small>Where we work</small></div>
                <a href="/industries">View all industries <span aria-hidden="true">→</span></a>
              </div>
              <div class="mega-menu-list mega-menu-list--industries">
                ${industries.map((item) => industryEntry(item, state)).join("")}
              </div>
            </section>
          </div>
        </div>
      </div>

      <div class="mega-nav-item mega-nav-item--insights${activeClass(state.projectInsights)}">
        <button class="mega-nav-trigger" type="button" aria-expanded="false" aria-controls="mega-menu-project-insights">
          <span>Project Insights</span><span class="mega-nav-chevron" aria-hidden="true"></span>
        </button>
        <div class="mega-menu-panel mega-menu-panel--insights" id="mega-menu-project-insights">
          <div class="mega-menu-intro mega-menu-intro--compact">
            <span class="mega-menu-kicker">Evidence & thinking</span>
            <h2>See the work, then understand the thinking behind it.</h2>
          </div>
          <div class="mega-insight-links">
            <a href="/case-studies"${currentAttribute(state.path === "/case-studies" || state.path === "/case-study-detail")}>
              <span class="mega-insight-index">01</span>
              <strong>Case Studies</strong>
              <small>Delivery stories, commercial outcomes and practical evidence.</small>
              <span class="mega-insight-arrow" aria-hidden="true">→</span>
            </a>
            <a href="/insights"${currentAttribute(state.path === "/insights" || state.path === "/insights-post")}>
              <span class="mega-insight-index">02</span>
              <strong>Insights</strong>
              <small>Analysis on growth, operations, technology and leadership.</small>
              <span class="mega-insight-arrow" aria-hidden="true">→</span>
            </a>
          </div>
        </div>
      </div>

      <a class="mega-nav-link mega-nav-contact${activeClass(state.contact)}" href="/contact"${currentAttribute(state.contact)}>Contact Us</a>`;

    document.querySelectorAll(".header-cta").forEach((cta) => cta.remove());
    wireMegaNavigation(nav);
  }

  function setMegaMenuOpen(item, open) {
    if (!item) return;
    const trigger = item.querySelector(":scope > .mega-nav-trigger");
    item.classList.toggle("is-open", open);
    if (trigger) trigger.setAttribute("aria-expanded", String(open));
  }

  function wireMegaNavigation(nav) {
    const items = Array.from(nav.querySelectorAll(".mega-nav-item"));
    const toggle = document.getElementById("nav-toggle");

    const closeMenus = (except = null) => {
      items.forEach((item) => {
        if (item !== except) setMegaMenuOpen(item, false);
      });
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
        }
        if (event.key === "Escape") {
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
        if (!window.matchMedia("(min-width: 1151px)").matches) return;
        closeMenus(item);
        setMegaMenuOpen(item, true);
      });

      item.addEventListener("pointerleave", () => {
        if (!window.matchMedia("(min-width: 1151px)").matches) return;
        setMegaMenuOpen(item, false);
      });

      item.addEventListener("focusin", () => {
        if (!window.matchMedia("(min-width: 1151px)").matches) return;
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

    if (window.lucide) window.lucide.createIcons();
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
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
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

  // ---- Sticky header frosted-glass on scroll -----------------------------
  const header = document.getElementById("site-header");
  if (header) {
    const onScroll = () => header.classList.toggle("scrolled", window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  // ---- Mobile nav toggle ---------------------------------------------------
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

  // ---- Cookie settings -------------------------------------------------------
  document.querySelectorAll("[data-cookie-settings]").forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      if (window.CookieConsent && typeof window.CookieConsent.renew === "function") {
        window.CookieConsent.renew();
      }
    });
  });

  // ---- Testimonial slider(s) ------------------------------------------------
  document.querySelectorAll(".testimonial-slider").forEach((slider) => {
    const slides = Array.from(slider.querySelectorAll(".testimonial-slide"));
    const dotsWrap = slider.querySelector(".testimonial-dots");
    if (!slides.length) return;
    let active = 0;
    slides.forEach((s, i) => s.classList.toggle("active", i === 0));

    if (dotsWrap) {
      slides.forEach((_, i) => {
        const dot = document.createElement("button");
        dot.setAttribute("aria-label", `Show testimonial ${i + 1}`);
        if (i === 0) dot.classList.add("active");
        dot.addEventListener("click", () => show(i));
        dotsWrap.appendChild(dot);
      });
    }

    function show(i) {
      active = i;
      slides.forEach((s, idx) => s.classList.toggle("active", idx === i));
      if (dotsWrap) {
        Array.from(dotsWrap.children).forEach((d, idx) => d.classList.toggle("active", idx === i));
      }
    }

    if (slides.length > 1) {
      setInterval(() => show((active + 1) % slides.length), 6000);
    }
  });

  // ---- FAQ accordion ----------------------------------------------------------
  document.querySelectorAll(".faq-item").forEach((item) => {
    const q = item.querySelector(".faq-question");
    if (!q) return;
    q.addEventListener("click", () => {
      const wasOpen = item.classList.contains("open");
      item.parentElement.querySelectorAll(".faq-item").forEach((i) => i.classList.remove("open"));
      if (!wasOpen) item.classList.add("open");
    });
  });

  // ---- Stat counter animation --------------------------------------------------
  const counters = document.querySelectorAll(".stat-number[data-count-to]");
  if (counters.length && "IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          animateCount(entry.target);
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.4 }
    );
    counters.forEach((c) => observer.observe(c));
  }

  function animateCount(el) {
    const target = el.getAttribute("data-count-to");
    const match = target.match(/^([^\d]*)(\d+(?:\.\d+)?)(.*)$/);
    if (!match) {
      el.textContent = target;
      return;
    }
    const [, prefix, numStr, suffix] = match;
    const end = parseFloat(numStr);
    const decimals = (numStr.split(".")[1] || "").length;
    const duration = 1200;
    const start = performance.now();
    function tick(now) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const value = (end * eased).toFixed(decimals);
      el.textContent = `${prefix}${value}${suffix}`;
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  // ---- Lucide icons -------------------------------------------------------------
  if (window.lucide) window.lucide.createIcons();
  else document.addEventListener("lucide:ready", () => window.lucide && window.lucide.createIcons());
})();
