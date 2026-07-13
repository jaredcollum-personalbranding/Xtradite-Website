/** Shared page chrome, metadata and interaction behaviour. */
(function () {
  "use strict";

  const currentScript = document.currentScript;
  const scriptBase = currentScript?.src
    ? new URL(".", currentScript.src)
    : new URL("/assets/js/", window.location.origin);
  const asset = (path) => new URL(path, scriptBase).href;
  const SITE_URL = "https://www.xtradite-digital.co.uk";
  const LOGO_URL = "https://bmhkdyshluiloorgnwoy.supabase.co/storage/v1/object/public/rich-media/Branding/XD-logo-nbg.png";
  const SOCIAL_IMAGE = `${SITE_URL}/assets/brand/xtradite-social-share.svg`;
  const FAVICON = `${SITE_URL}/assets/brand/favicon.svg`;

  function ensureStylesheet(selector, href, dataKey) {
    if (document.querySelector(selector)) return;
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = href;
    link.dataset[dataKey] = "true";
    document.head.appendChild(link);
  }

  ensureStylesheet('link[data-xtradite-brand-logo-css]', asset("../css/brand-logo.css?v=20260713-3"), "xtraditeBrandLogoCss");
  ensureStylesheet('link[data-xtradite-mobile-css]', asset("../css/mobile.css"), "xtraditeMobileCss");
  ensureStylesheet('link[data-xtradite-enquiry-css]', asset("../css/enquiry.css"), "xtraditeEnquiryCss");

  function upsertMeta(selector, attributes) {
    let node = document.head.querySelector(selector);
    if (!node) {
      node = document.createElement("meta");
      document.head.appendChild(node);
    }
    Object.entries(attributes).forEach(([key, value]) => node.setAttribute(key, value));
    return node;
  }

  function ensureLink(selector, attributes) {
    let node = document.head.querySelector(selector);
    if (!node) {
      node = document.createElement("link");
      document.head.appendChild(node);
    }
    Object.entries(attributes).forEach(([key, value]) => node.setAttribute(key, value));
    return node;
  }

  function normaliseMetadata() {
    const title = (document.title || "Xtradite Digital").replace(/â€”/g, "—").trim();
    if (title !== document.title) document.title = title;
    const description = document.querySelector('meta[name="description"]')?.content ||
      "Practical UK digital consultancy for ecommerce, CRM, analytics, AI automation and digital growth.";
    const canonical = document.querySelector('link[rel="canonical"]')?.href ||
      `${SITE_URL}${window.location.pathname === "/index.html" ? "/" : window.location.pathname}`;

    ensureLink('link[rel="icon"][type="image/svg+xml"]', { rel: "icon", type: "image/svg+xml", href: FAVICON });
    ensureLink('link[rel="apple-touch-icon"]', { rel: "apple-touch-icon", sizes: "180x180", href: FAVICON });
    ensureLink('link[rel="canonical"]', { rel: "canonical", href: canonical });

    upsertMeta('meta[property="og:site_name"]', { property: "og:site_name", content: "Xtradite Digital" });
    upsertMeta('meta[property="og:locale"]', { property: "og:locale", content: "en_GB" });
    upsertMeta('meta[property="og:type"]', { property: "og:type", content: "website" });
    upsertMeta('meta[property="og:title"]', { property: "og:title", content: title });
    upsertMeta('meta[property="og:description"]', { property: "og:description", content: description });
    upsertMeta('meta[property="og:url"]', { property: "og:url", content: canonical });
    upsertMeta('meta[property="og:image"]', { property: "og:image", content: SOCIAL_IMAGE });
    upsertMeta('meta[property="og:image:width"]', { property: "og:image:width", content: "1200" });
    upsertMeta('meta[property="og:image:height"]', { property: "og:image:height", content: "630" });
    upsertMeta('meta[property="og:image:alt"]', { property: "og:image:alt", content: "Xtradite Digital — practical consultancy for measurable growth" });
    upsertMeta('meta[name="twitter:card"]', { name: "twitter:card", content: "summary_large_image" });
    upsertMeta('meta[name="twitter:title"]', { name: "twitter:title", content: title });
    upsertMeta('meta[name="twitter:description"]', { name: "twitter:description", content: description });
    upsertMeta('meta[name="twitter:image"]', { name: "twitter:image", content: SOCIAL_IMAGE });
    upsertMeta('meta[name="theme-color"]', { name: "theme-color", content: "#0D0D0D" });
  }

  function applyBrandLogos(root = document) {
    root.querySelectorAll("img.logo-img").forEach((image) => {
      const footer = Boolean(image.closest(".site-footer"));
      image.src = LOGO_URL;
      image.alt = "Xtradite Digital";
      image.width = footer ? 84 : 76;
      image.height = footer ? 84 : 76;
      image.decoding = "async";
      image.loading = footer ? "lazy" : "eager";
      image.fetchPriority = footer ? "low" : "high";
      image.removeAttribute("data-image-error");
      image.addEventListener("error", () => image.setAttribute("data-image-error", "true"), { once: true });
    });

    root.querySelectorAll('script[type="application/ld+json"]').forEach((script) => {
      try {
        const data = JSON.parse(script.textContent || "{}");
        const records = Array.isArray(data) ? data : [data];
        let changed = false;
        records.forEach((record) => {
          if (record && ["Organization", "LocalBusiness", "ProfessionalService"].includes(record["@type"])) {
            record.logo = LOGO_URL;
            changed = true;
          }
          if (record?.provider?.["@type"] === "Organization") {
            record.provider.logo = LOGO_URL;
            changed = true;
          }
        });
        if (changed) script.textContent = JSON.stringify(Array.isArray(data) ? records : records[0]);
      } catch (_) {}
    });
  }

  function initialiseNavigation() {
    const header = document.getElementById("site-header");
    const toggle = document.getElementById("nav-toggle");
    const nav = document.getElementById("site-nav");
    if (header) {
      const onScroll = () => header.classList.toggle("scrolled", window.scrollY > 8);
      onScroll();
      window.addEventListener("scroll", onScroll, { passive: true });
    }
    if (!toggle || !nav) return;

    toggle.setAttribute("aria-controls", "site-nav");
    toggle.setAttribute("aria-expanded", "false");
    const close = () => {
      toggle.classList.remove("open");
      nav.classList.remove("open");
      toggle.setAttribute("aria-expanded", "false");
      document.body.classList.remove("nav-open");
    };
    toggle.addEventListener("click", () => {
      const open = !nav.classList.contains("open");
      toggle.classList.toggle("open", open);
      nav.classList.toggle("open", open);
      toggle.setAttribute("aria-expanded", String(open));
      document.body.classList.toggle("nav-open", open);
    });
    nav.querySelectorAll("a").forEach((link) => link.addEventListener("click", close));
    document.addEventListener("keydown", (event) => { if (event.key === "Escape") close(); });
    window.addEventListener("resize", () => { if (window.innerWidth > 1150) close(); }, { passive: true });
  }

  function initialiseFooter() {
    document.querySelectorAll(".site-footer .footer-bottom span").forEach((node) => {
      node.innerHTML = node.innerHTML.replace(/©\s*\d{4}/, `&copy; ${new Date().getFullYear()}`);
    });
    document.querySelectorAll('.footer-social a[href="#"]').forEach((link) => {
      link.setAttribute("aria-disabled", "true");
      link.setAttribute("tabindex", "-1");
      link.addEventListener("click", (event) => event.preventDefault());
    });
  }

  normaliseMetadata();
  applyBrandLogos();
  initialiseNavigation();
  initialiseFooter();

  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => mutation.addedNodes.forEach((node) => {
      if (!(node instanceof Element)) return;
      if (node.matches("img.logo-img") || node.querySelector("img.logo-img")) applyBrandLogos(node);
    }));
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });

  if (!window.__xtraditeEnquiryLoading) {
    window.__xtraditeEnquiryLoading = true;
    const enquiryScript = document.createElement("script");
    enquiryScript.type = "module";
    enquiryScript.src = asset("enquiry.js");
    enquiryScript.addEventListener("error", () => { window.__xtraditeEnquiryLoading = false; });
    document.body.appendChild(enquiryScript);
  }

  document.querySelectorAll("[data-cookie-settings]").forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      if (window.CookieConsent?.renew) window.CookieConsent.renew();
      else if (window.Cookiebot?.renew) window.Cookiebot.renew();
    });
  });

  document.querySelectorAll(".testimonial-slider").forEach((slider) => {
    const slides = Array.from(slider.querySelectorAll(".testimonial-slide"));
    const dotsWrap = slider.querySelector(".testimonial-dots");
    if (!slides.length) return;
    let active = 0;
    const show = (index) => {
      active = index;
      slides.forEach((slide, i) => slide.classList.toggle("active", i === index));
      if (dotsWrap) Array.from(dotsWrap.children).forEach((dot, i) => dot.classList.toggle("active", i === index));
    };
    slides.forEach((_, index) => {
      if (!dotsWrap) return;
      const dot = document.createElement("button");
      dot.type = "button";
      dot.setAttribute("aria-label", `Show testimonial ${index + 1}`);
      dot.addEventListener("click", () => show(index));
      dotsWrap.appendChild(dot);
    });
    show(0);
    if (slides.length > 1 && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      window.setInterval(() => show((active + 1) % slides.length), 6000);
    }
  });

  document.querySelectorAll(".faq-item").forEach((item) => {
    const question = item.querySelector(".faq-question");
    if (!question) return;
    question.setAttribute("aria-expanded", String(item.classList.contains("open")));
    question.addEventListener("click", () => {
      const wasOpen = item.classList.contains("open");
      item.parentElement?.querySelectorAll(".faq-item").forEach((candidate) => {
        candidate.classList.remove("open");
        candidate.querySelector(".faq-question")?.setAttribute("aria-expanded", "false");
      });
      if (!wasOpen) {
        item.classList.add("open");
        question.setAttribute("aria-expanded", "true");
      }
    });
  });

  const counters = document.querySelectorAll(".stat-number[data-count-to]");
  function animateCount(element) {
    const target = element.getAttribute("data-count-to") || "";
    const match = target.match(/^([^\d]*)(\d+(?:\.\d+)?)(.*)$/);
    if (!match) return void (element.textContent = target);
    const [, prefix, number, suffix] = match;
    const end = Number.parseFloat(number);
    const decimals = (number.split(".")[1] || "").length;
    const start = performance.now();
    const tick = (now) => {
      const progress = Math.min((now - start) / 1200, 1);
      const value = (end * (1 - Math.pow(1 - progress, 3))).toFixed(decimals);
      element.textContent = `${prefix}${value}${suffix}`;
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }
  if (counters.length && "IntersectionObserver" in window) {
    const counterObserver = new IntersectionObserver((entries) => entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      animateCount(entry.target);
      counterObserver.unobserve(entry.target);
    }), { threshold: 0.4 });
    counters.forEach((counter) => counterObserver.observe(counter));
  }

  if (window.lucide) window.lucide.createIcons();
  else document.addEventListener("lucide:ready", () => window.lucide?.createIcons());
})();