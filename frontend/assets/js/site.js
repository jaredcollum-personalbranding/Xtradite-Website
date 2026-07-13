/**
 * Shared page chrome behavior — header scroll state, mobile nav toggle, testimonial
 * slider, FAQ accordion, stat counter animation. Plain script (no imports), safe to load
 * on every page before the page-specific module script.
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

  if (!document.querySelector('link[data-xtradite-brand-logo-css]')) {
    const stylesheet = document.createElement("link");
    stylesheet.rel = "stylesheet";
    stylesheet.dataset.xtraditeBrandLogoCss = "true";
    stylesheet.href = new URL("../css/brand-logo.css?v=20260713-4", scriptBase).href;
    document.head.appendChild(stylesheet);
  }

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
      // Intrinsic dimensions match the largest desktop presentation. CSS handles responsive scaling.
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

  // ---- Shared mobile responsive stylesheet ---------------------------------
  if (!document.querySelector('link[data-xtradite-mobile-css]')) {
    const stylesheet = document.createElement("link");
    stylesheet.rel = "stylesheet";
    stylesheet.dataset.xtraditeMobileCss = "true";
    stylesheet.href = new URL("../css/mobile.css", scriptBase).href;
    document.head.appendChild(stylesheet);
  }

  // ---- Site-wide enquiry form distribution ---------------------------------
  if (!document.querySelector('link[data-xtradite-enquiry-css]')) {
    const stylesheet = document.createElement("link");
    stylesheet.rel = "stylesheet";
    stylesheet.dataset.xtraditeEnquiryCss = "true";
    stylesheet.href = new URL("../css/enquiry.css", scriptBase).href;
    document.head.appendChild(stylesheet);
  }

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
    toggle.addEventListener("click", () => {
      toggle.classList.toggle("open");
      nav.classList.toggle("open");
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