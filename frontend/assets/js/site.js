/**
 * Shared page chrome behavior — header scroll state, mobile nav toggle, testimonial
 * slider, FAQ accordion, stat counter animation. Plain script (no imports), safe to load
 * on every page before the page-specific module script.
 */
(function () {
  "use strict";

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
